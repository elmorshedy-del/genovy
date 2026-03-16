import { assertRequiredEnv } from '../config/env.js';
import { withClient } from '../db/pool.js';
import { stableJson } from '../lib/json.js';
import { normalizeNcbiGeneCurie, stableHash } from '../lib/curies.js';
import { rebuildCanonicalLayer } from '../services/canonicalResolutionService.js';

function buildFixedCurie(badCurie) {
  return normalizeNcbiGeneCurie(badCurie);
}

async function listBadEntities(client) {
  const result = await client.query(`
    SELECT
      entity_id,
      entity_type,
      canonical_curie,
      canonical_label,
      description,
      primary_source_key,
      metadata_json
    FROM entities
    WHERE canonical_curie LIKE 'NCBIGene:NCBIGene:%'
    ORDER BY entity_id ASC
  `);

  return result.rows;
}

async function loadEntityByCurie(client, canonicalCurie) {
  const result = await client.query(
    `
      SELECT entity_id, canonical_curie, canonical_label, description, primary_source_key, metadata_json
      FROM entities
      WHERE canonical_curie = $1
      LIMIT 1
    `,
    [canonicalCurie]
  );

  return result.rows[0] || null;
}

async function mergeEntityMetadata(client, sourceEntity, targetEntityId) {
  await client.query(
    `
      UPDATE entities target
      SET
        description = COALESCE(NULLIF(target.description, ''), source.description),
        primary_source_key = COALESCE(target.primary_source_key, source.primary_source_key),
        metadata_json = COALESCE(source.metadata_json, '{}'::jsonb) || COALESCE(target.metadata_json, '{}'::jsonb),
        updated_at = NOW()
      FROM entities source
      WHERE source.entity_id = $1
        AND target.entity_id = $2
    `,
    [sourceEntity.entity_id, targetEntityId]
  );
}

async function moveEntityAliases(client, sourceEntityId, targetEntityId) {
  await client.query(
    `
      INSERT INTO entity_aliases (
        entity_id,
        alias_label,
        normalized_alias,
        alias_type,
        source_key,
        created_at
      )
      SELECT
        $2,
        alias_label,
        normalized_alias,
        alias_type,
        source_key,
        created_at
      FROM entity_aliases
      WHERE entity_id = $1
      ON CONFLICT (entity_id, normalized_alias, alias_type)
      DO NOTHING
    `,
    [sourceEntityId, targetEntityId]
  );

  await client.query(`DELETE FROM entity_aliases WHERE entity_id = $1`, [sourceEntityId]);
}

async function moveEntityXrefs(client, sourceEntityId, targetEntityId, badCurie, fixedCurie) {
  await client.query(
    `
      INSERT INTO entity_xrefs (
        entity_id,
        xref_curie,
        source_key,
        xref_type,
        created_at
      )
      SELECT
        $2,
        CASE WHEN xref_curie = $3 THEN $4 ELSE xref_curie END,
        source_key,
        xref_type,
        created_at
      FROM entity_xrefs
      WHERE entity_id = $1
      ON CONFLICT (entity_id, xref_curie)
      DO NOTHING
    `,
    [sourceEntityId, targetEntityId, badCurie, fixedCurie]
  );

  await client.query(`DELETE FROM entity_xrefs WHERE entity_id = $1`, [sourceEntityId]);
}

function buildRelationshipKey(subjectEntityId, predicateKey, objectEntityId, qualifiersJson) {
  return stableHash(`${subjectEntityId}|${predicateKey}|${objectEntityId}|${stableJson(qualifiersJson || {})}`);
}

async function moveRelationshipEvidence(client, sourceRelationshipId, targetRelationshipId) {
  await client.query(
    `
      INSERT INTO relationship_evidence (
        relationship_id,
        source_key,
        sync_run_id,
        source_record_key,
        evidence_type,
        evidence_code,
        confidence_score,
        provenance_url,
        payload_json,
        observed_at
      )
      SELECT
        $2,
        source.source_key,
        source.sync_run_id,
        source.source_record_key,
        source.evidence_type,
        source.evidence_code,
        source.confidence_score,
        source.provenance_url,
        source.payload_json,
        source.observed_at
      FROM relationship_evidence source
      WHERE source.relationship_id = $1
        AND NOT EXISTS (
          SELECT 1
          FROM relationship_evidence target
          WHERE target.relationship_id = $2
            AND target.source_key = source.source_key
            AND target.source_record_key IS NOT DISTINCT FROM source.source_record_key
            AND target.evidence_type = source.evidence_type
            AND target.evidence_code IS NOT DISTINCT FROM source.evidence_code
        )
    `,
    [sourceRelationshipId, targetRelationshipId]
  );
}

async function moveRelationships(client, sourceEntityId, targetEntityId) {
  const result = await client.query(
    `
      SELECT
        relationship_id,
        subject_entity_id,
        predicate_key,
        object_entity_id,
        qualifiers_json
      FROM relationships
      WHERE subject_entity_id = $1 OR object_entity_id = $1
      ORDER BY relationship_id ASC
    `,
    [sourceEntityId]
  );

  let updatedCount = 0;
  let mergedCount = 0;

  for (const row of result.rows) {
    const newSubjectEntityId = row.subject_entity_id === sourceEntityId ? targetEntityId : row.subject_entity_id;
    const newObjectEntityId = row.object_entity_id === sourceEntityId ? targetEntityId : row.object_entity_id;
    const newRelationshipKey = buildRelationshipKey(
      newSubjectEntityId,
      row.predicate_key,
      newObjectEntityId,
      row.qualifiers_json || {}
    );

    const existing = await client.query(
      `
        SELECT relationship_id
        FROM relationships
        WHERE relationship_key = $1
        LIMIT 1
      `,
      [newRelationshipKey]
    );

    if (existing.rows[0] && existing.rows[0].relationship_id !== row.relationship_id) {
      await moveRelationshipEvidence(client, row.relationship_id, existing.rows[0].relationship_id);
      await client.query(`DELETE FROM relationships WHERE relationship_id = $1`, [row.relationship_id]);
      mergedCount += 1;
      continue;
    }

    await client.query(
      `
        UPDATE relationships
        SET
          subject_entity_id = $2,
          object_entity_id = $3,
          relationship_key = $4,
          updated_at = NOW()
        WHERE relationship_id = $1
      `,
      [row.relationship_id, newSubjectEntityId, newObjectEntityId, newRelationshipKey]
    );
    updatedCount += 1;
  }

  return {
    updatedCount,
    mergedCount
  };
}

async function moveGeneDiseaseValidityAssertions(client, sourceEntityId, targetEntityId) {
  await client.query(
    `
      INSERT INTO clinical_gene_disease_validity_assertions (
        gene_entity_id,
        disease_entity_id,
        source_key,
        sync_run_id,
        source_record_key,
        classification,
        mode_of_inheritance,
        curation_sop,
        classification_date,
        gcep,
        online_report_url,
        provenance_url,
        payload_json,
        observed_at,
        updated_at
      )
      SELECT
        $2,
        source.disease_entity_id,
        source.source_key,
        source.sync_run_id,
        source.source_record_key,
        source.classification,
        source.mode_of_inheritance,
        source.curation_sop,
        source.classification_date,
        source.gcep,
        source.online_report_url,
        source.provenance_url,
        source.payload_json,
        source.observed_at,
        NOW()
      FROM clinical_gene_disease_validity_assertions source
      WHERE source.gene_entity_id = $1
      ON CONFLICT (source_key, source_record_key, gene_entity_id, disease_entity_id, classification)
      DO UPDATE SET
        mode_of_inheritance = COALESCE(EXCLUDED.mode_of_inheritance, clinical_gene_disease_validity_assertions.mode_of_inheritance),
        curation_sop = COALESCE(EXCLUDED.curation_sop, clinical_gene_disease_validity_assertions.curation_sop),
        classification_date = COALESCE(EXCLUDED.classification_date, clinical_gene_disease_validity_assertions.classification_date),
        gcep = COALESCE(EXCLUDED.gcep, clinical_gene_disease_validity_assertions.gcep),
        online_report_url = COALESCE(EXCLUDED.online_report_url, clinical_gene_disease_validity_assertions.online_report_url),
        provenance_url = COALESCE(EXCLUDED.provenance_url, clinical_gene_disease_validity_assertions.provenance_url),
        payload_json = clinical_gene_disease_validity_assertions.payload_json || EXCLUDED.payload_json,
        updated_at = NOW()
    `,
    [sourceEntityId, targetEntityId]
  );

  await client.query(`DELETE FROM clinical_gene_disease_validity_assertions WHERE gene_entity_id = $1`, [sourceEntityId]);
}

async function moveVariantDiseaseAssertions(client, sourceEntityId, targetEntityId) {
  await client.query(
    `
      INSERT INTO clinical_variant_disease_assertions (
        variant_entity_id,
        disease_entity_id,
        gene_entity_id,
        source_key,
        sync_run_id,
        source_record_key,
        allele_id,
        variation_id,
        variant_name,
        variation_type,
        clinical_significance,
        clinical_significance_simple,
        review_status,
        number_submitters,
        origin,
        origin_simple,
        assembly,
        last_evaluated,
        rcv_accession,
        phenotype_ids,
        phenotype_list,
        provenance_url,
        payload_json,
        observed_at,
        updated_at
      )
      SELECT
        source.variant_entity_id,
        source.disease_entity_id,
        $2,
        source.source_key,
        source.sync_run_id,
        source.source_record_key,
        source.allele_id,
        source.variation_id,
        source.variant_name,
        source.variation_type,
        source.clinical_significance,
        source.clinical_significance_simple,
        source.review_status,
        source.number_submitters,
        source.origin,
        source.origin_simple,
        source.assembly,
        source.last_evaluated,
        source.rcv_accession,
        source.phenotype_ids,
        source.phenotype_list,
        source.provenance_url,
        source.payload_json,
        source.observed_at,
        NOW()
      FROM clinical_variant_disease_assertions source
      WHERE source.gene_entity_id = $1
        AND NOT EXISTS (
          SELECT 1
          FROM clinical_variant_disease_assertions target
          WHERE target.variant_entity_id = source.variant_entity_id
            AND target.disease_entity_id = source.disease_entity_id
            AND target.gene_entity_id = $2
            AND target.source_key = source.source_key
            AND target.source_record_key = source.source_record_key
            AND target.assembly IS NOT DISTINCT FROM source.assembly
        )
    `,
    [sourceEntityId, targetEntityId]
  );

  await client.query(`DELETE FROM clinical_variant_disease_assertions WHERE gene_entity_id = $1`, [sourceEntityId]);
}

async function normalizeReferenceCurie(client, badCurie, fixedCurie) {
  await client.query(
    `
      DELETE FROM entity_xrefs source
      USING entity_xrefs target
      WHERE source.entity_id = target.entity_id
        AND source.xref_curie = $1
        AND target.xref_curie = $2
        AND source.entity_xref_id <> target.entity_xref_id
    `,
    [badCurie, fixedCurie]
  );

  await client.query(`UPDATE entity_xrefs SET xref_curie = $2 WHERE xref_curie = $1`, [badCurie, fixedCurie]);
  await client.query(`UPDATE source_records SET canonical_curie = $2 WHERE canonical_curie = $1`, [badCurie, fixedCurie]);
}

async function renameEntityCurie(client, entityId, fixedCurie) {
  await client.query(
    `
      UPDATE entities
      SET canonical_curie = $2, updated_at = NOW()
      WHERE entity_id = $1
    `,
    [entityId, fixedCurie]
  );
}

async function deleteEntity(client, entityId) {
  await client.query(`DELETE FROM entities WHERE entity_id = $1`, [entityId]);
}

async function countRemainingBadEntities(client) {
  const result = await client.query(`
    SELECT COUNT(*)::int AS count
    FROM entities
    WHERE canonical_curie LIKE 'NCBIGene:NCBIGene:%'
  `);

  return result.rows[0]?.count || 0;
}

async function runCleanup() {
  assertRequiredEnv({ requireAdminToken: false });

  const cleanupSummary = await withClient(async (client) => {
    const startedAt = new Date().toISOString();
    const badEntities = await listBadEntities(client);

    const summary = {
      startedAt,
      initialBadEntityCount: badEntities.length,
      mergedCount: 0,
      renamedCount: 0,
      skippedCount: 0,
      mergedRelationshipCount: 0,
      updatedRelationshipCount: 0,
      details: []
    };

    await client.query('BEGIN');

    try {
      for (const badEntity of badEntities) {
        const fixedCurie = buildFixedCurie(badEntity.canonical_curie);
        if (!fixedCurie || fixedCurie === badEntity.canonical_curie) {
          summary.skippedCount += 1;
          summary.details.push({
            entityId: badEntity.entity_id,
            badCurie: badEntity.canonical_curie,
            action: 'skipped',
            reason: 'invalid_fixed_curie'
          });
          continue;
        }

        const fixedEntity = await loadEntityByCurie(client, fixedCurie);

        if (fixedEntity && fixedEntity.entity_id !== badEntity.entity_id) {
          await mergeEntityMetadata(client, badEntity, fixedEntity.entity_id);
          await moveEntityAliases(client, badEntity.entity_id, fixedEntity.entity_id);
          await moveEntityXrefs(client, badEntity.entity_id, fixedEntity.entity_id, badEntity.canonical_curie, fixedCurie);
          const relationshipSummary = await moveRelationships(client, badEntity.entity_id, fixedEntity.entity_id);
          await moveGeneDiseaseValidityAssertions(client, badEntity.entity_id, fixedEntity.entity_id);
          await moveVariantDiseaseAssertions(client, badEntity.entity_id, fixedEntity.entity_id);
          await normalizeReferenceCurie(client, badEntity.canonical_curie, fixedCurie);
          await deleteEntity(client, badEntity.entity_id);

          summary.mergedCount += 1;
          summary.mergedRelationshipCount += relationshipSummary.mergedCount;
          summary.updatedRelationshipCount += relationshipSummary.updatedCount;
          summary.details.push({
            entityId: badEntity.entity_id,
            badCurie: badEntity.canonical_curie,
            fixedCurie,
            targetEntityId: fixedEntity.entity_id,
            action: 'merged'
          });
          continue;
        }

        await renameEntityCurie(client, badEntity.entity_id, fixedCurie);
        await normalizeReferenceCurie(client, badEntity.canonical_curie, fixedCurie);

        summary.renamedCount += 1;
        summary.details.push({
          entityId: badEntity.entity_id,
          badCurie: badEntity.canonical_curie,
          fixedCurie,
          action: 'renamed'
        });
      }

      summary.remainingBadEntityCount = await countRemainingBadEntities(client);
      summary.completedAt = new Date().toISOString();

      await client.query('COMMIT');
      return summary;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });

  const canonicalSummary = await rebuildCanonicalLayer({
    triggerMode: 'manual',
    requestedBy: 'codex-prefix-cleanup',
    options: {
      cleanupType: 'fix_doubled_ncbi_gene_prefixes'
    }
  });

  return {
    ...cleanupSummary,
    canonicalResolutionRunId: canonicalSummary.canonicalResolutionRunId,
    canonicalConceptCount: canonicalSummary.conceptCount,
    canonicalMembershipCount: canonicalSummary.membershipCount,
    canonicalRelationshipBreakdown: canonicalSummary.summary.relationships
  };
}

runCleanup()
  .then((summary) => {
    console.log(JSON.stringify(summary, null, 2));
  })
  .catch((error) => {
    console.error('[fix-doubled-ncbi-gene-prefixes] failed:', error);
    process.exit(1);
  });

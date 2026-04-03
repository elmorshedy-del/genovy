import { normalizeCurie, normalizeLabel, buildPlaceholderCurie, stableHash } from '../lib/curies.js';
import { stableJson } from '../lib/json.js';
import { collectQualifierCuries, CLINICAL_PROFILE_CONSTANTS, summarizeProfileRows } from '../lib/clinicalProfiles.js';
import {
  listGeneDiseaseValidityByEntity,
  listNaturalHistoryByEntity,
  listVariantDiseaseAssertionsByEntity
} from './clinicalEvidenceRepository.js';

const SEARCH_RESULT_LIMIT_DEFAULT = 8;
const SEARCH_RESULT_LIMIT_MAX = 12;

function confidenceOrNull(rawValue) {
  if (rawValue == null || rawValue === '') return null;
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function upsertEntity(client, entity) {
  const canonicalCurie = normalizeCurie(entity.canonicalCurie);
  const canonicalLabel = String(entity.canonicalLabel || canonicalCurie);
  const normalizedLabel = normalizeLabel(canonicalLabel);
  const result = await client.query(
    `
      INSERT INTO entities (
        entity_type,
        canonical_curie,
        canonical_label,
        normalized_label,
        description,
        primary_source_key,
        metadata_json,
        is_placeholder
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
      ON CONFLICT (canonical_curie)
      DO UPDATE SET
        entity_type = EXCLUDED.entity_type,
        canonical_label = EXCLUDED.canonical_label,
        normalized_label = EXCLUDED.normalized_label,
        description = COALESCE(EXCLUDED.description, entities.description),
        primary_source_key = COALESCE(entities.primary_source_key, EXCLUDED.primary_source_key),
        metadata_json = entities.metadata_json || EXCLUDED.metadata_json,
        is_placeholder = CASE
          WHEN entities.is_placeholder = FALSE THEN FALSE
          ELSE EXCLUDED.is_placeholder
        END,
        updated_at = NOW()
      RETURNING entity_id, canonical_curie
    `,
    [
      entity.entityType,
      canonicalCurie,
      canonicalLabel,
      normalizedLabel,
      entity.description || null,
      entity.primarySourceKey || null,
      JSON.stringify(entity.metadata || {}),
      Boolean(entity.isPlaceholder)
    ]
  );
  return result.rows[0];
}

export async function upsertEntitiesBatch(client, entities) {
  if (!entities.length) {
    return [];
  }

  const prepared = entities
    .map((entity) => {
      const canonicalCurie = normalizeCurie(entity.canonicalCurie);
      if (!canonicalCurie) {
        return null;
      }

      const canonicalLabel = String(entity.canonicalLabel || canonicalCurie);
      return {
        entityType: entity.entityType,
        canonicalCurie,
        canonicalLabel,
        normalizedLabel: normalizeLabel(canonicalLabel),
        description: entity.description || null,
        primarySourceKey: entity.primarySourceKey || null,
        metadata: entity.metadata || {},
        isPlaceholder: Boolean(entity.isPlaceholder)
      };
    })
    .filter(Boolean);

  if (!prepared.length) {
    return [];
  }

  const result = await client.query(
    `
      WITH input AS (
        SELECT DISTINCT ON (canonical_curie)
          value->>'entityType' AS entity_type,
          value->>'canonicalCurie' AS canonical_curie,
          value->>'canonicalLabel' AS canonical_label,
          value->>'normalizedLabel' AS normalized_label,
          NULLIF(value->>'description', '') AS description,
          NULLIF(value->>'primarySourceKey', '') AS primary_source_key,
          COALESCE(value->'metadata', '{}'::jsonb) AS metadata_json,
          COALESCE((value->>'isPlaceholder')::BOOLEAN, FALSE) AS is_placeholder
        FROM jsonb_array_elements($1::jsonb) AS value
        ORDER BY canonical_curie
      )
      INSERT INTO entities (
        entity_type,
        canonical_curie,
        canonical_label,
        normalized_label,
        description,
        primary_source_key,
        metadata_json,
        is_placeholder
      )
      SELECT
        entity_type,
        canonical_curie,
        canonical_label,
        normalized_label,
        description,
        primary_source_key,
        metadata_json,
        is_placeholder
      FROM input
      ON CONFLICT (canonical_curie)
      DO UPDATE SET
        entity_type = EXCLUDED.entity_type,
        canonical_label = EXCLUDED.canonical_label,
        normalized_label = EXCLUDED.normalized_label,
        description = COALESCE(EXCLUDED.description, entities.description),
        primary_source_key = COALESCE(entities.primary_source_key, EXCLUDED.primary_source_key),
        metadata_json = entities.metadata_json || EXCLUDED.metadata_json,
        is_placeholder = CASE
          WHEN entities.is_placeholder = FALSE THEN FALSE
          ELSE EXCLUDED.is_placeholder
        END,
        updated_at = NOW()
      RETURNING entity_id, canonical_curie
    `,
    [JSON.stringify(prepared)]
  );

  return result.rows;
}

export async function upsertEntityAlias(client, alias) {
  await client.query(
    `
      INSERT INTO entity_aliases (
        entity_id,
        alias_label,
        normalized_alias,
        alias_type,
        source_key
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (entity_id, normalized_alias, alias_type)
      DO NOTHING
    `,
    [
      alias.entityId,
      alias.aliasLabel,
      normalizeLabel(alias.aliasLabel),
      alias.aliasType || 'synonym',
      alias.sourceKey || null
    ]
  );
}

export async function upsertEntityXref(client, xref) {
  await client.query(
    `
      INSERT INTO entity_xrefs (
        entity_id,
        xref_curie,
        source_key,
        xref_type
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (entity_id, xref_curie)
      DO NOTHING
    `,
    [
      xref.entityId,
      normalizeCurie(xref.xrefCurie),
      xref.sourceKey || null,
      xref.xrefType || 'cross_reference'
    ]
  );
}

export async function upsertEntityXrefsBatch(client, xrefs) {
  if (!xrefs.length) {
    return;
  }

  const prepared = xrefs
    .map((xref) => {
      const normalizedXrefCurie = normalizeCurie(xref.xrefCurie);
      if (!normalizedXrefCurie) {
        return null;
      }
      return {
        entityId: xref.entityId,
        xrefCurie: normalizedXrefCurie,
        sourceKey: xref.sourceKey || null,
        xrefType: xref.xrefType || 'cross_reference'
      };
    })
    .filter(Boolean);

  if (!prepared.length) {
    return;
  }

  await client.query(
    `
      WITH input AS (
        SELECT DISTINCT ON (entity_id, xref_curie)
          (value->>'entityId')::BIGINT AS entity_id,
          value->>'xrefCurie' AS xref_curie,
          NULLIF(value->>'sourceKey', '') AS source_key,
          value->>'xrefType' AS xref_type
        FROM jsonb_array_elements($1::jsonb) AS value
        ORDER BY entity_id, xref_curie
      )
      INSERT INTO entity_xrefs (
        entity_id,
        xref_curie,
        source_key,
        xref_type
      )
      SELECT
        entity_id,
        xref_curie,
        source_key,
        xref_type
      FROM input
      ON CONFLICT (entity_id, xref_curie)
      DO NOTHING
    `,
    [JSON.stringify(prepared)]
  );
}

export async function upsertSourceRecord(client, sourceRecord) {
  const payloadJson = JSON.stringify(sourceRecord.payload || {});
  const payloadHash = stableHash(payloadJson);
  await client.query(
    `
      INSERT INTO source_records (
        source_key,
        sync_run_id,
        record_type,
        source_record_key,
        canonical_curie,
        payload_json,
        payload_hash
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
      ON CONFLICT (source_key, source_record_key)
      DO UPDATE SET
        sync_run_id = EXCLUDED.sync_run_id,
        canonical_curie = EXCLUDED.canonical_curie,
        payload_json = EXCLUDED.payload_json,
        payload_hash = EXCLUDED.payload_hash,
        updated_at = NOW()
    `,
    [
      sourceRecord.sourceKey,
      sourceRecord.syncRunId,
      sourceRecord.recordType,
      sourceRecord.sourceRecordKey,
      sourceRecord.canonicalCurie ? normalizeCurie(sourceRecord.canonicalCurie) : null,
      payloadJson,
      payloadHash
    ]
  );
}

export async function upsertSourceRecordsBatch(client, sourceRecords) {
  if (!sourceRecords.length) {
    return;
  }

  const prepared = sourceRecords.map((sourceRecord) => {
    const payloadJson = JSON.stringify(sourceRecord.payload || {});
    return {
      sourceKey: sourceRecord.sourceKey,
      syncRunId: sourceRecord.syncRunId ?? null,
      recordType: sourceRecord.recordType,
      sourceRecordKey: sourceRecord.sourceRecordKey,
      canonicalCurie: sourceRecord.canonicalCurie ? normalizeCurie(sourceRecord.canonicalCurie) : null,
      payloadJson: sourceRecord.payload || {},
      payloadHash: stableHash(payloadJson)
    };
  });

  await client.query(
    `
      WITH input AS (
        SELECT DISTINCT ON (source_key, source_record_key)
          value->>'sourceKey' AS source_key,
          NULLIF(value->>'syncRunId', '')::BIGINT AS sync_run_id,
          value->>'recordType' AS record_type,
          value->>'sourceRecordKey' AS source_record_key,
          NULLIF(value->>'canonicalCurie', '') AS canonical_curie,
          COALESCE(value->'payloadJson', '{}'::jsonb) AS payload_json,
          value->>'payloadHash' AS payload_hash
        FROM jsonb_array_elements($1::jsonb) AS value
        ORDER BY source_key, source_record_key
      ),
      updated AS (
        UPDATE source_records target
        SET
          sync_run_id = input.sync_run_id,
          canonical_curie = input.canonical_curie,
          payload_json = input.payload_json,
          payload_hash = input.payload_hash,
          updated_at = NOW()
        FROM input
        WHERE target.source_key = input.source_key
          AND target.source_record_key = input.source_record_key
        RETURNING target.source_key, target.source_record_key
      )
      INSERT INTO source_records (
        source_key,
        sync_run_id,
        record_type,
        source_record_key,
        canonical_curie,
        payload_json,
        payload_hash
      )
      SELECT
        source_key,
        sync_run_id,
        record_type,
        source_record_key,
        canonical_curie,
        payload_json,
        payload_hash
      FROM input
      WHERE NOT EXISTS (
        SELECT 1
        FROM updated
        WHERE updated.source_key = input.source_key
          AND updated.source_record_key = input.source_record_key
      )
    `,
    [JSON.stringify(prepared)]
  );
}

export async function resolveEntityByCurie(client, curie) {
  const normalizedCurie = normalizeCurie(curie);
  if (!normalizedCurie) return null;

  const canonicalMatch = await client.query(
    `
      SELECT entity_id, canonical_curie
      FROM entities
      WHERE canonical_curie = $1
      LIMIT 1
    `,
    [normalizedCurie]
  );
  if (canonicalMatch.rowCount) {
    return canonicalMatch.rows[0];
  }

  const xrefMatch = await client.query(
    `
      SELECT e.entity_id, e.canonical_curie
      FROM entity_xrefs x
      INNER JOIN entities e ON e.entity_id = x.entity_id
      WHERE x.xref_curie = $1
      ORDER BY e.is_placeholder ASC, e.entity_id ASC
      LIMIT 1
    `,
    [normalizedCurie]
  );
  if (xrefMatch.rowCount) {
    return xrefMatch.rows[0];
  }
  return null;
}

export async function resolveEntitiesByCurieBatch(client, curies) {
  const normalizedCuries = [...new Set((curies || []).map((curie) => normalizeCurie(curie)).filter(Boolean))];
  if (!normalizedCuries.length) {
    return [];
  }

  const result = await client.query(
    `
      WITH input AS (
        SELECT DISTINCT unnest($1::text[]) AS matched_curie
      ),
      candidates AS (
        SELECT
          input.matched_curie,
          e.entity_id,
          e.canonical_curie,
          e.is_placeholder,
          0 AS match_rank
        FROM input
        INNER JOIN entities e ON e.canonical_curie = input.matched_curie

        UNION ALL

        SELECT
          input.matched_curie,
          e.entity_id,
          e.canonical_curie,
          e.is_placeholder,
          1 AS match_rank
        FROM input
        INNER JOIN entity_xrefs x ON x.xref_curie = input.matched_curie
        INNER JOIN entities e ON e.entity_id = x.entity_id
      )
      SELECT DISTINCT ON (matched_curie)
        matched_curie,
        entity_id,
        canonical_curie
      FROM candidates
      ORDER BY matched_curie, match_rank ASC, is_placeholder ASC, entity_id ASC
    `,
    [normalizedCuries]
  );

  return result.rows;
}

export async function resolveEntityByLabel(client, label, entityType = '') {
  const normalized = normalizeLabel(label);
  if (!normalized) return null;

  const result = await client.query(
    `
      SELECT e.entity_id, e.canonical_curie
      FROM entities e
      LEFT JOIN entity_aliases a ON a.entity_id = e.entity_id
      WHERE ($1 = '' OR e.entity_type = $1)
        AND (e.normalized_label = $2 OR a.normalized_alias = $2)
      ORDER BY e.is_placeholder ASC, e.entity_id ASC
      LIMIT 1
    `,
    [entityType, normalized]
  );
  return result.rowCount ? result.rows[0] : null;
}

export async function resolveOrCreateEntity(client, ref, sourceKey) {
  const shouldCreateIfMissing = ref.createIfMissing !== false;

  if (ref.curie) {
    const resolved = await resolveEntityByCurie(client, ref.curie);
    if (resolved) return resolved;

    if (!shouldCreateIfMissing) {
      return null;
    }

    return upsertEntity(client, {
      entityType: ref.entityType,
      canonicalCurie: ref.curie,
      canonicalLabel: ref.label || ref.curie,
      description: ref.description || null,
      metadata: ref.metadata || {},
      primarySourceKey: sourceKey,
      isPlaceholder: Boolean(ref.isPlaceholder ?? true)
    });
  }

  if (ref.label) {
    const resolved = await resolveEntityByLabel(client, ref.label, ref.entityType);
    if (resolved) return resolved;
    if (!shouldCreateIfMissing) {
      return null;
    }
  }

  if (!shouldCreateIfMissing) {
    return null;
  }

  const placeholderCurie = buildPlaceholderCurie(ref.entityType, ref.label || `${sourceKey}-placeholder`);
  return upsertEntity(client, {
    entityType: ref.entityType,
    canonicalCurie: placeholderCurie,
    canonicalLabel: ref.label || placeholderCurie,
    description: ref.description || null,
    metadata: ref.metadata || {},
    primarySourceKey: sourceKey,
    isPlaceholder: true
  });
}

export async function upsertRelationship(client, relationship, sourceKey) {
  const subject = await resolveOrCreateEntity(client, relationship.subjectRef, sourceKey);
  const object = await resolveOrCreateEntity(client, relationship.objectRef, sourceKey);
  return upsertResolvedRelationship(
    client,
    {
      subjectEntityId: subject.entity_id,
      predicateKey: relationship.predicateKey,
      objectEntityId: object.entity_id,
      qualifiers: relationship.qualifiers || {}
    },
    sourceKey
  );
}

export async function upsertResolvedRelationship(client, relationship, sourceKey) {
  const qualifiersJson = relationship.qualifiers || {};
  const relationshipKey = stableHash(
    `${relationship.subjectEntityId}|${relationship.predicateKey}|${relationship.objectEntityId}|${stableJson(qualifiersJson)}`
  );

  const result = await client.query(
    `
      INSERT INTO relationships (
        relationship_key,
        subject_entity_id,
        predicate_key,
        object_entity_id,
        qualifiers_json,
        primary_source_key
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6)
      ON CONFLICT (relationship_key)
      DO UPDATE SET
        qualifiers_json = EXCLUDED.qualifiers_json,
        last_seen_at = NOW(),
        updated_at = NOW()
      RETURNING relationship_id
    `,
    [
      relationshipKey,
      relationship.subjectEntityId,
      relationship.predicateKey,
      relationship.objectEntityId,
      JSON.stringify(qualifiersJson),
      sourceKey
    ]
  );

  return result.rows[0];
}

export async function upsertResolvedRelationships(client, relationships, sourceKey) {
  if (!relationships.length) {
    return [];
  }

  const result = await client.query(
    `
      WITH input AS (
        SELECT
          value->>'relationshipKey' AS relationship_key,
          (value->>'subjectEntityId')::BIGINT AS subject_entity_id,
          value->>'predicateKey' AS predicate_key,
          (value->>'objectEntityId')::BIGINT AS object_entity_id,
          COALESCE(value->'qualifiers', '{}'::jsonb) AS qualifiers_json,
          $2::TEXT AS primary_source_key
        FROM jsonb_array_elements($1::jsonb) AS value
      ),
      updated AS (
        UPDATE relationships target
        SET
          qualifiers_json = input.qualifiers_json,
          last_seen_at = NOW(),
          updated_at = NOW()
        FROM input
        WHERE target.relationship_key = input.relationship_key
        RETURNING target.relationship_id, target.relationship_key
      ),
      inserted AS (
        INSERT INTO relationships (
          relationship_key,
          subject_entity_id,
          predicate_key,
          object_entity_id,
          qualifiers_json,
          primary_source_key
        )
        SELECT
          relationship_key,
          subject_entity_id,
          predicate_key,
          object_entity_id,
          qualifiers_json,
          primary_source_key
        FROM input
        WHERE NOT EXISTS (
          SELECT 1
          FROM updated
          WHERE updated.relationship_key = input.relationship_key
        )
        RETURNING relationship_id, relationship_key
      )
    SELECT relationship_id, relationship_key
    FROM updated
    UNION ALL
    SELECT relationship_id, relationship_key
    FROM inserted
    `,
    [JSON.stringify(relationships), sourceKey]
  );

  return result.rows;
}

export async function upsertRelationshipEvidenceBatch(client, evidenceRows) {
  if (!evidenceRows.length) {
    return;
  }

  await client.query(
    `
      WITH input AS (
        SELECT
          (value->>'relationshipId')::BIGINT AS relationship_id,
          value->>'sourceKey' AS source_key,
          NULLIF(value->>'syncRunId', '')::BIGINT AS sync_run_id,
          NULLIF(value->>'sourceRecordKey', '') AS source_record_key,
          value->>'evidenceType' AS evidence_type,
          NULLIF(value->>'evidenceCode', '') AS evidence_code,
          NULLIF(value->>'confidenceScore', '')::NUMERIC(5,4) AS confidence_score,
          NULLIF(value->>'provenanceUrl', '') AS provenance_url,
          COALESCE(value->'payload', '{}'::jsonb) AS payload_json
        FROM jsonb_array_elements($1::jsonb) AS value
      ),
      updated AS (
        UPDATE relationship_evidence target
        SET
          sync_run_id = input.sync_run_id,
          confidence_score = COALESCE(input.confidence_score, target.confidence_score),
          provenance_url = COALESCE(input.provenance_url, target.provenance_url),
          payload_json = target.payload_json || input.payload_json,
          observed_at = NOW()
        FROM input
        WHERE target.relationship_id = input.relationship_id
          AND target.source_key = input.source_key
          AND COALESCE(target.source_record_key, '') = COALESCE(input.source_record_key, '')
          AND target.evidence_type = input.evidence_type
          AND COALESCE(target.evidence_code, '') = COALESCE(input.evidence_code, '')
        RETURNING
          target.relationship_id,
          target.source_key,
          COALESCE(target.source_record_key, '') AS source_record_key,
          target.evidence_type,
          COALESCE(target.evidence_code, '') AS evidence_code
      )
      INSERT INTO relationship_evidence (
        relationship_id,
        source_key,
        sync_run_id,
        source_record_key,
        evidence_type,
        evidence_code,
        confidence_score,
        provenance_url,
        payload_json
      )
      SELECT
        relationship_id,
        source_key,
        sync_run_id,
        source_record_key,
        evidence_type,
        evidence_code,
        confidence_score,
        provenance_url,
        payload_json
      FROM input
      WHERE NOT EXISTS (
        SELECT 1
        FROM updated
        WHERE updated.relationship_id = input.relationship_id
          AND updated.source_key = input.source_key
          AND updated.source_record_key = COALESCE(input.source_record_key, '')
          AND updated.evidence_type = input.evidence_type
          AND updated.evidence_code = COALESCE(input.evidence_code, '')
      )
    `,
    [JSON.stringify(evidenceRows)]
  );
}
export async function upsertRelationshipEvidence(client, evidence) {
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
        payload_json
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
      ON CONFLICT (relationship_id, source_key, source_record_key, evidence_type, evidence_code)
      DO UPDATE SET
        sync_run_id = EXCLUDED.sync_run_id,
        confidence_score = COALESCE(EXCLUDED.confidence_score, relationship_evidence.confidence_score),
        provenance_url = COALESCE(EXCLUDED.provenance_url, relationship_evidence.provenance_url),
        payload_json = relationship_evidence.payload_json || EXCLUDED.payload_json,
        observed_at = NOW()
    `,
    [
      evidence.relationshipId,
      evidence.sourceKey,
      evidence.syncRunId,
      evidence.sourceRecordKey || null,
      evidence.evidenceType,
      evidence.evidenceCode || null,
      confidenceOrNull(evidence.confidenceScore),
      evidence.provenanceUrl || null,
      JSON.stringify(evidence.payload || {})
    ]
  );
}


export async function listKnowledgeSummary(client) {
  const entities = await client.query(`
    SELECT entity_type, COUNT(*)::INTEGER AS count
    FROM entities
    GROUP BY entity_type
    ORDER BY entity_type ASC
  `);
  const relationships = await client.query(`
    SELECT predicate_key, COUNT(*)::INTEGER AS count
    FROM relationships
    GROUP BY predicate_key
    ORDER BY predicate_key ASC
  `);
  let clinicalEvidence = [];
  try {
    const clinicalEvidenceResult = await client.query(`
      SELECT 'clinical_phenotype_assertions' AS table_name, COUNT(*)::INTEGER AS count
      FROM clinical_phenotype_assertions
      UNION ALL
      SELECT 'clinical_natural_history_assertions' AS table_name, COUNT(*)::INTEGER AS count
      FROM clinical_natural_history_assertions
      UNION ALL
      SELECT 'clinical_gene_disease_validity_assertions' AS table_name, COUNT(*)::INTEGER AS count
      FROM clinical_gene_disease_validity_assertions
      UNION ALL
      SELECT 'clinical_variant_disease_assertions' AS table_name, COUNT(*)::INTEGER AS count
      FROM clinical_variant_disease_assertions
      ORDER BY table_name ASC
    `);
    clinicalEvidence = clinicalEvidenceResult.rows;
  } catch (error) {
    if (error?.code !== '42P01') {
      throw error;
    }
    console.warn('[genovy] clinical evidence summary unavailable before migration', {
      error: error.message || String(error)
    });
  }
  return {
    entities: entities.rows,
    relationships: relationships.rows,
    clinicalEvidence
  };
}

export async function searchKnowledgeEntities(client, { query, entityType = '', limit = SEARCH_RESULT_LIMIT_DEFAULT }) {
  const rawQuery = String(query || '').trim();
  const normalizedQuery = normalizeLabel(rawQuery);
  if (!rawQuery || (!normalizedQuery && !rawQuery.includes(':'))) {
    return [];
  }

  const normalizedEntityType = String(entityType || '').trim();
  const resolvedCurie = normalizeCurie(rawQuery) || rawQuery.toUpperCase();
  const cappedLimit = Math.max(1, Math.min(SEARCH_RESULT_LIMIT_MAX, Number(limit) || SEARCH_RESULT_LIMIT_DEFAULT));
  const normalizedPrefix = `${normalizedQuery}%`;
  const normalizedContains = `%${normalizedQuery}%`;
  const curiePrefix = `${resolvedCurie}%`;

  const result = await client.query(
    `
      WITH candidate_matches AS (
        SELECT
          e.entity_id,
          CASE
            WHEN e.canonical_curie = $2 THEN 140
            WHEN e.canonical_curie ILIKE $3 THEN 120
            WHEN e.normalized_label = $4 THEN 110
            WHEN e.normalized_label LIKE $5 THEN 100
            WHEN e.normalized_label LIKE $6 THEN 80
            ELSE 0
          END AS match_rank
        FROM entities e
        WHERE ($1 = '' OR e.entity_type = $1)
          AND (
            e.canonical_curie ILIKE $3
            OR e.normalized_label = $4
            OR e.normalized_label LIKE $5
            OR e.normalized_label LIKE $6
          )

        UNION ALL

        SELECT
          e.entity_id,
          CASE
            WHEN a.normalized_alias = $4 THEN 105
            WHEN a.normalized_alias LIKE $5 THEN 95
            WHEN a.normalized_alias LIKE $6 THEN 75
            ELSE 0
          END AS match_rank
        FROM entity_aliases a
        INNER JOIN entities e ON e.entity_id = a.entity_id
        WHERE ($1 = '' OR e.entity_type = $1)
          AND (
            a.normalized_alias = $4
            OR a.normalized_alias LIKE $5
            OR a.normalized_alias LIKE $6
          )
      ),
      ranked AS (
        SELECT
          entity_id,
          MAX(match_rank)::INTEGER AS match_rank
        FROM candidate_matches
        GROUP BY entity_id
      )
      SELECT
        e.entity_type,
        e.canonical_curie,
        e.canonical_label,
        e.description,
        e.is_placeholder,
        r.match_rank,
        (
          SELECT COUNT(*)::INTEGER
          FROM relationships rel
          WHERE rel.subject_entity_id = e.entity_id
        ) AS outbound_count,
        (
          SELECT COUNT(*)::INTEGER
          FROM relationships rel
          WHERE rel.object_entity_id = e.entity_id
        ) AS inbound_count
      FROM ranked r
      INNER JOIN entities e ON e.entity_id = r.entity_id
      ORDER BY
        r.match_rank DESC,
        e.is_placeholder ASC,
        e.canonical_label ASC
      LIMIT $7
    `,
    [normalizedEntityType, resolvedCurie, curiePrefix, normalizedQuery, normalizedPrefix, normalizedContains, cappedLimit]
  );

  return result.rows;
}

export async function getEntityDetail(client, curie) {
  const resolved = await resolveEntityByCurie(client, curie);
  if (!resolved) return null;

  const entity = await client.query(
    `
      SELECT *
      FROM entities
      WHERE entity_id = $1
      LIMIT 1
    `,
    [resolved.entity_id]
  );
  const aliases = await client.query(
    `
      SELECT alias_label, alias_type, source_key
      FROM entity_aliases
      WHERE entity_id = $1
      ORDER BY alias_label ASC
    `,
    [resolved.entity_id]
  );
  const xrefs = await client.query(
    `
      SELECT xref_curie, xref_type, source_key
      FROM entity_xrefs
      WHERE entity_id = $1
      ORDER BY xref_curie ASC
    `,
    [resolved.entity_id]
  );
  const counts = await client.query(
    `
      SELECT
        (
          SELECT COUNT(*)::INTEGER
          FROM relationships
          WHERE subject_entity_id = $1
        ) AS outbound_count,
        (
          SELECT COUNT(*)::INTEGER
          FROM relationships
          WHERE object_entity_id = $1
        ) AS inbound_count
    `,
    [resolved.entity_id]
  );
  const outbound = await client.query(
    `
      SELECT
        r.predicate_key,
        o.canonical_curie AS object_curie,
        o.canonical_label AS object_label,
        r.qualifiers_json
      FROM relationships r
      INNER JOIN entities o ON o.entity_id = r.object_entity_id
      WHERE r.subject_entity_id = $1
      ORDER BY r.predicate_key, o.canonical_label
      LIMIT 100
    `,
    [resolved.entity_id]
  );
  const inbound = await client.query(
    `
      SELECT
        r.predicate_key,
        s.canonical_curie AS subject_curie,
        s.canonical_label AS subject_label,
        r.qualifiers_json
      FROM relationships r
      INNER JOIN entities s ON s.entity_id = r.subject_entity_id
      WHERE r.object_entity_id = $1
      ORDER BY r.predicate_key, s.canonical_label
      LIMIT 100
    `,
    [resolved.entity_id]
  );

  return {
    entity: entity.rows[0],
    aliases: aliases.rows,
    xrefs: xrefs.rows,
    outboundCount: counts.rows[0]?.outbound_count || 0,
    inboundCount: counts.rows[0]?.inbound_count || 0,
    outboundRelationships: outbound.rows,
    inboundRelationships: inbound.rows
  };
}

async function loadStructuredClinicalPhenotypeRows(client, entityId, limit) {
  try {
    const result = await client.query(
      `
        SELECT
          clinical_phenotype_assertions.source_record_key,
          clinical_phenotype_assertions.evidence_code,
          clinical_phenotype_assertions.confidence_score,
          clinical_phenotype_assertions.provenance_url,
          clinical_phenotype_assertions.reference_text AS reference,
          CASE clinical_phenotype_assertions.presence_status
            WHEN 'absent' THEN 'lacks_phenotype'
            ELSE 'has_phenotype'
          END AS predicate_key,
          jsonb_strip_nulls(
            jsonb_build_object(
              'onset', onset.canonical_curie,
              'frequency', frequency.canonical_curie,
              'modifier', modifier.canonical_curie,
              'sex', clinical_phenotype_assertions.sex,
              'aspect', clinical_phenotype_assertions.aspect,
              'reference', clinical_phenotype_assertions.reference_text
            )
          ) AS qualifiers_json,
          phenotype.canonical_curie AS phenotype_curie,
          phenotype.canonical_label AS phenotype_label
        FROM clinical_phenotype_assertions
        INNER JOIN entities phenotype
          ON phenotype.entity_id = clinical_phenotype_assertions.phenotype_entity_id
        LEFT JOIN entities onset
          ON onset.entity_id = clinical_phenotype_assertions.onset_entity_id
        LEFT JOIN entities frequency
          ON frequency.entity_id = clinical_phenotype_assertions.frequency_entity_id
        LEFT JOIN entities modifier
          ON modifier.entity_id = clinical_phenotype_assertions.modifier_entity_id
        WHERE clinical_phenotype_assertions.subject_entity_id = $1
        ORDER BY phenotype.canonical_label ASC
        LIMIT $2
      `,
      [entityId, limit]
    );

    return result.rows;
  } catch (error) {
    if (error?.code === '42P01') {
      console.warn('[genovy] structured clinical phenotype table unavailable, falling back to relationships', {
        error: error.message || String(error)
      });
      return [];
    }
    throw error;
  }
}

export async function getClinicalProfile(client, { curie, limit = CLINICAL_PROFILE_CONSTANTS.defaultLimit }) {
  const resolved = await resolveEntityByCurie(client, curie);
  if (!resolved) {
    return null;
  }

  const entityResult = await client.query(
    `
      SELECT entity_id, entity_type, canonical_curie, canonical_label, description
      FROM entities
      WHERE entity_id = $1
      LIMIT 1
    `,
    [resolved.entity_id]
  );
  const entity = entityResult.rows[0];
  if (!entity) {
    return null;
  }

  const cappedLimit = Math.max(
    1,
    Math.min(CLINICAL_PROFILE_CONSTANTS.maxLimit, Number(limit) || CLINICAL_PROFILE_CONSTANTS.defaultLimit)
  );
  let profileRows = await loadStructuredClinicalPhenotypeRows(client, resolved.entity_id, cappedLimit);
  if (!profileRows.length) {
    const profileRowsResult = await client.query(
      `
        SELECT
          rel.relationship_id,
          rel.predicate_key,
          rel.qualifiers_json,
          phenotype.canonical_curie AS phenotype_curie,
          phenotype.canonical_label AS phenotype_label,
          evidence.evidence_code,
          evidence.confidence_score,
          evidence.provenance_url,
          evidence.source_record_key,
          COALESCE(evidence.payload_json->>'reference', '') AS reference
        FROM relationships rel
        INNER JOIN entities phenotype
          ON phenotype.entity_id = rel.object_entity_id
        LEFT JOIN LATERAL (
          SELECT
            relationship_evidence.evidence_code,
            relationship_evidence.confidence_score,
            relationship_evidence.provenance_url,
            relationship_evidence.source_record_key,
            relationship_evidence.payload_json
          FROM relationship_evidence
          WHERE relationship_evidence.relationship_id = rel.relationship_id
          ORDER BY relationship_evidence.confidence_score DESC NULLS LAST, relationship_evidence.observed_at DESC
          LIMIT 1
        ) AS evidence
          ON TRUE
        WHERE rel.subject_entity_id = $1
          AND rel.predicate_key = ANY($2::TEXT[])
        ORDER BY phenotype.canonical_label ASC
        LIMIT $3
      `,
      [
        resolved.entity_id,
        CLINICAL_PROFILE_CONSTANTS.profileRelationshipPredicates,
        cappedLimit
      ]
    );
    profileRows = profileRowsResult.rows;
  }

  const qualifierCuries = collectQualifierCuries(profileRows);
  let qualifierLabelByCurie = new Map();
  if (qualifierCuries.length) {
    const qualifierRows = await client.query(
      `
        SELECT canonical_curie, canonical_label
        FROM entities
        WHERE canonical_curie = ANY($1::TEXT[])
      `,
      [qualifierCuries]
    );
    qualifierLabelByCurie = new Map(
      qualifierRows.rows.map((row) => [row.canonical_curie, row.canonical_label])
    );
  }

  const [naturalHistory, geneDiseaseValidity, variantAssertions] = await Promise.all([
    listNaturalHistoryByEntity(client, resolved.entity_id, CLINICAL_PROFILE_CONSTANTS.naturalHistoryLimit),
    listGeneDiseaseValidityByEntity(client, resolved.entity_id, CLINICAL_PROFILE_CONSTANTS.geneDiseaseValidityLimit),
    listVariantDiseaseAssertionsByEntity(client, resolved.entity_id, CLINICAL_PROFILE_CONSTANTS.variantAssertionLimit)
  ]);

  return {
    entity,
    ...summarizeProfileRows(profileRows, qualifierLabelByCurie),
    naturalHistory,
    geneDiseaseValidity,
    variantAssertions
  };
}

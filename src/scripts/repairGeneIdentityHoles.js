import { assertRequiredEnv } from '../config/env.js';
import { withClient } from '../db/pool.js';
import {
  upsertEntity,
  upsertEntityAlias,
  upsertEntityXref,
  upsertSourceRecord
} from '../repositories/knowledgeRepository.js';
import {
  createSyncRun,
  ensureSourceCatalog,
  finalizeSyncRun,
  markSourceSyncState
} from '../repositories/sourceRepository.js';
import { rebuildCanonicalLayer } from '../services/canonicalResolutionService.js';
import { SOURCE_KEYS } from '../constants/sourceCatalog.js';

const SOURCE_KEY = SOURCE_KEYS.GENE_IDENTITY_REPAIR;

const GENE_FIXTURES = Object.freeze([
  Object.freeze({
    symbol: 'U2AF2',
    hgncCurie: 'HGNC:23156',
    ncbiCurie: 'NCBIGene:11338',
    ensemblCurie: 'ENSEMBL:ENSG00000063244',
    omimCurie: 'OMIM:191318',
    aliases: Object.freeze([
      'U2AF65',
      'U2 small nuclear ribonucleoprotein auxiliary factor (65kD)',
      'splicing factor U2AF 65 kD subunit',
      'U2 snRNP auxiliary factor large subunit'
    ]),
    description: 'U2 small nuclear RNA auxiliary factor 2.',
    hpoCoverage: Object.freeze({
      geneDisease: false,
      genePhenotype: false
    })
  }),
  Object.freeze({
    symbol: 'RPGRIP1',
    hgncCurie: 'HGNC:13436',
    ncbiCurie: 'NCBIGene:57096',
    ensemblCurie: 'ENSEMBL:ENSG00000092200',
    omimCurie: 'OMIM:605446',
    aliases: Object.freeze(['RGI1', 'LCA6', 'CORD13']),
    description: 'RPGR interacting protein 1.',
    hpoCoverage: Object.freeze({
      geneDisease: true,
      genePhenotype: true
    })
  })
]);

function parseArgs(argv) {
  return {
    execute: argv.includes('--execute')
  };
}

async function loadEntityRows(client, canonicalCuries) {
  const result = await client.query(
    `
      SELECT
        e.entity_id,
        e.entity_type,
        e.canonical_curie,
        e.canonical_label,
        COUNT(DISTINCT CASE WHEN r.subject_entity_id = e.entity_id THEN r.relationship_id END)::INTEGER AS outbound_count,
        COUNT(DISTINCT CASE WHEN r.object_entity_id = e.entity_id THEN r.relationship_id END)::INTEGER AS inbound_count
      FROM entities e
      LEFT JOIN relationships r
        ON r.subject_entity_id = e.entity_id
        OR r.object_entity_id = e.entity_id
      WHERE e.canonical_curie = ANY($1::TEXT[])
      GROUP BY e.entity_id, e.entity_type, e.canonical_curie, e.canonical_label
      ORDER BY e.entity_id ASC
    `,
    [canonicalCuries]
  );

  return result.rows.map((row) => ({
    entityId: row.entity_id,
    entityType: row.entity_type,
    canonicalCurie: row.canonical_curie,
    canonicalLabel: row.canonical_label,
    outboundCount: Number(row.outbound_count || 0),
    inboundCount: Number(row.inbound_count || 0)
  }));
}

async function loadCrossTypeMembershipCount(client) {
  const result = await client.query(
    `
      SELECT COUNT(*)::INTEGER AS mismatch_count
      FROM canonical_concept_memberships membership
      INNER JOIN canonical_concepts concept
        ON concept.concept_id = membership.concept_id
      INNER JOIN entities entity
        ON entity.entity_id = membership.entity_id
      WHERE concept.concept_type <> entity.entity_type
    `
  );

  return Number(result.rows[0]?.mismatch_count || 0);
}

async function loadCanonicalConceptByCurie(client, canonicalCurie) {
  const result = await client.query(
    `
      SELECT
        concept.concept_id,
        concept.concept_type,
        concept.canonical_curie,
        concept.canonical_label,
        COALESCE(concept.metadata_json, '{}'::jsonb) AS metadata_json,
        COUNT(DISTINCT membership.entity_id)::INTEGER AS member_count,
        COUNT(DISTINCT relationship.canonical_relationship_id)::INTEGER AS canonical_relationship_count
      FROM canonical_concepts concept
      LEFT JOIN canonical_concept_memberships membership
        ON membership.concept_id = concept.concept_id
      LEFT JOIN canonical_relationships relationship
        ON relationship.subject_concept_id = concept.concept_id
        OR relationship.object_concept_id = concept.concept_id
      WHERE concept.canonical_curie = $1
      GROUP BY concept.concept_id, concept.concept_type, concept.canonical_curie, concept.canonical_label, concept.metadata_json
      LIMIT 1
    `,
    [canonicalCurie]
  );

  return result.rows[0] || null;
}

async function loadCanonicalConceptMembers(client, conceptId) {
  const result = await client.query(
    `
      SELECT entity.entity_type, entity.canonical_curie, entity.canonical_label
      FROM canonical_concept_memberships membership
      INNER JOIN entities entity
        ON entity.entity_id = membership.entity_id
      WHERE membership.concept_id = $1
      ORDER BY entity.entity_type ASC, entity.canonical_curie ASC
    `,
    [conceptId]
  );

  return result.rows;
}

async function upsertGeneFixture(client, syncRunId, fixture) {
  const trackedCuries = [fixture.hgncCurie, fixture.ncbiCurie];
  const beforeRows = await loadEntityRows(client, trackedCuries);
  const beforeByCurie = new Map(beforeRows.map((row) => [row.canonicalCurie, row]));

  const sharedMetadata = {
    geneSymbol: fixture.symbol,
    hgncCurie: fixture.hgncCurie,
    ncbiGeneCurie: fixture.ncbiCurie,
    ensemblCurie: fixture.ensemblCurie,
    omimCurie: fixture.omimCurie,
    hpoCoverage: fixture.hpoCoverage,
    repairSource: 'hgnc_reference'
  };

  const ncbiEntity = await upsertEntity(client, {
    entityType: 'gene',
    canonicalCurie: fixture.ncbiCurie,
    canonicalLabel: fixture.symbol,
    description: fixture.description,
    metadata: sharedMetadata,
    primarySourceKey: SOURCE_KEY,
    isPlaceholder: false
  });

  const hgncEntity = await upsertEntity(client, {
    entityType: 'gene',
    canonicalCurie: fixture.hgncCurie,
    canonicalLabel: fixture.symbol,
    description: fixture.description,
    metadata: sharedMetadata,
    primarySourceKey: SOURCE_KEY,
    isPlaceholder: false
  });

  const entityIds = [ncbiEntity.entity_id, hgncEntity.entity_id];
  const xrefsByEntityId = new Map([
    [
      ncbiEntity.entity_id,
      [fixture.hgncCurie, fixture.ensemblCurie, fixture.omimCurie]
    ],
    [
      hgncEntity.entity_id,
      [fixture.ncbiCurie, fixture.ensemblCurie, fixture.omimCurie]
    ]
  ]);

  for (const entityId of entityIds) {
    for (const xrefCurie of xrefsByEntityId.get(entityId) || []) {
      if (!xrefCurie) {
        continue;
      }

      await upsertEntityXref(client, {
        entityId,
        xrefCurie,
        sourceKey: SOURCE_KEY,
        xrefType: 'cross_reference'
      });
    }

    await upsertEntityAlias(client, {
      entityId,
      aliasLabel: fixture.symbol,
      aliasType: 'symbol',
      sourceKey: SOURCE_KEY
    });

    for (const aliasLabel of fixture.aliases) {
      await upsertEntityAlias(client, {
        entityId,
        aliasLabel,
        aliasType: 'synonym',
        sourceKey: SOURCE_KEY
      });
    }
  }

  await upsertSourceRecord(client, {
    sourceKey: SOURCE_KEY,
    syncRunId,
    recordType: 'gene_identity_repair',
    sourceRecordKey: `gene:${fixture.symbol}`,
    canonicalCurie: fixture.hgncCurie,
    payload: {
      ...sharedMetadata,
      aliases: fixture.aliases,
      description: fixture.description
    }
  });

  const afterRows = await loadEntityRows(client, trackedCuries);
  const createdCuries = trackedCuries.filter((curie) => !beforeByCurie.has(curie));

  return {
    symbol: fixture.symbol,
    createdCuries,
    entityRows: afterRows,
    hpoCoverage: fixture.hpoCoverage
  };
}

async function runRepair({ execute }) {
  assertRequiredEnv();

  return withClient(async (client) => {
    await ensureSourceCatalog(client);

    if (!execute) {
      return {
        execute: false,
        sourceKey: SOURCE_KEY,
        fixtures: GENE_FIXTURES.map((fixture) => ({
          symbol: fixture.symbol,
          hgncCurie: fixture.hgncCurie,
          ncbiCurie: fixture.ncbiCurie,
          hpoCoverage: fixture.hpoCoverage
        }))
      };
    }

    const crossTypeMismatchBefore = await loadCrossTypeMembershipCount(client);
    const syncRun = await createSyncRun(client, SOURCE_KEY, {
      triggerMode: 'manual',
      requestedBy: 'codex-step-3',
      options: {
        genes: GENE_FIXTURES.map((fixture) => fixture.symbol)
      }
    });

    try {
      const geneSummaries = [];

      await client.query('BEGIN');
      for (const fixture of GENE_FIXTURES) {
        geneSummaries.push(await upsertGeneFixture(client, syncRun.sync_run_id, fixture));
      }
      await client.query('COMMIT');

      const canonicalSummary = await rebuildCanonicalLayer({
        triggerMode: 'manual',
        requestedBy: 'codex-step-3',
        options: {
          repairSyncRunId: syncRun.sync_run_id,
          repairSourceKey: SOURCE_KEY
        }
      });

      const crossTypeMismatchAfter = await loadCrossTypeMembershipCount(client);
      if (crossTypeMismatchAfter > 0) {
        throw new Error(`Cross-type canonical memberships remain after rebuild: ${crossTypeMismatchAfter}`);
      }

      const u2af2Concept = await loadCanonicalConceptByCurie(client, 'HGNC:23156');
      const rpgrip1Concept = await loadCanonicalConceptByCurie(client, 'HGNC:13436');
      const rpgrip1lConcept = await loadCanonicalConceptByCurie(client, 'HGNC:29168');

      const conceptMembers = {
        U2AF2: u2af2Concept ? await loadCanonicalConceptMembers(client, u2af2Concept.concept_id) : [],
        RPGRIP1: rpgrip1Concept ? await loadCanonicalConceptMembers(client, rpgrip1Concept.concept_id) : [],
        RPGRIP1L: rpgrip1lConcept ? await loadCanonicalConceptMembers(client, rpgrip1lConcept.concept_id) : []
      };

      const summary = {
        sourceKey: SOURCE_KEY,
        crossTypeMismatchBefore,
        crossTypeMismatchAfter,
        geneSummaries,
        canonicalSummary: {
          canonicalResolutionRunId: canonicalSummary.canonicalResolutionRunId,
          conceptCount: canonicalSummary.conceptCount,
          membershipCount: canonicalSummary.membershipCount,
          aliasCount: canonicalSummary.aliasCount
        },
        verification: {
          U2AF2: {
            concept: u2af2Concept,
            members: conceptMembers.U2AF2
          },
          RPGRIP1: {
            concept: rpgrip1Concept,
            members: conceptMembers.RPGRIP1
          },
          RPGRIP1L: {
            concept: rpgrip1lConcept,
            members: conceptMembers.RPGRIP1L
          }
        }
      };

      await finalizeSyncRun(client, syncRun.sync_run_id, {
        status: 'completed',
        sourceVersion: 'step3-gene-identity-repair-v1',
        summary
      });
      await markSourceSyncState(client, SOURCE_KEY, syncRun.sync_run_id, 'step3-gene-identity-repair-v1', summary);

      return summary;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      await finalizeSyncRun(client, syncRun.sync_run_id, {
        status: 'failed',
        sourceVersion: 'step3-gene-identity-repair-v1',
        summary: {},
        errorMessage: error.message || 'Gene identity repair failed.'
      });
      throw error;
    }
  });
}

const args = parseArgs(process.argv.slice(2));

runRepair(args)
  .then((summary) => {
    console.log(JSON.stringify(summary, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

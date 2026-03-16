import { withClient } from '../db/pool.js';
import { normalizeLabel } from '../lib/curies.js';
import { groupEntitiesIntoCanonicalConcepts } from '../lib/canonicalResolution.js';
import {
  clearCanonicalLayer,
  completeCanonicalResolutionRun,
  failCanonicalResolutionRun,
  getCanonicalConceptDetail,
  insertCanonicalAliases,
  insertCanonicalConcepts,
  insertCanonicalMemberships,
  listCanonicalSummary,
  listEntityAliasesForCanonicalization,
  listEntityRecordsForCanonicalization,
  rebuildCanonicalRelationships,
  searchCanonicalConcepts,
  startCanonicalResolutionRun
} from '../repositories/canonicalRepository.js';

const INSERT_BATCH_SIZE = 1000;
const CANONICAL_STRATEGY_KEY = 'identifier_and_gene_symbol_v2';

function chunkArray(values, size = INSERT_BATCH_SIZE) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function buildAliasRows(groupsByConceptKey, aliasRows, conceptIdByKey) {
  const conceptIdByEntityId = new Map();
  const aliasesByConceptId = new Map();

  for (const group of groupsByConceptKey) {
    const conceptId = conceptIdByKey.get(group.canonicalKey);
    if (!conceptId) {
      continue;
    }

    const rows = aliasesByConceptId.get(conceptId) || [];
    rows.push({
      conceptId,
      aliasLabel: group.canonicalLabel,
      normalizedAlias: normalizeLabel(group.canonicalLabel),
      aliasType: 'canonical_label',
      sourceKey: null
    });
    aliasesByConceptId.set(conceptId, rows);

    for (const memberEntityId of group.memberEntityIds) {
      conceptIdByEntityId.set(memberEntityId, conceptId);
    }
  }

  for (const alias of aliasRows) {
    const conceptId = conceptIdByEntityId.get(alias.entityId);
    if (!conceptId) {
      continue;
    }

    const rows = aliasesByConceptId.get(conceptId) || [];
    rows.push({
      conceptId,
      aliasLabel: alias.aliasLabel,
      normalizedAlias: normalizeLabel(alias.aliasLabel),
      aliasType: alias.aliasType || 'aggregated_alias',
      sourceKey: alias.sourceKey || null
    });
    aliasesByConceptId.set(conceptId, rows);
  }

  return Array.from(aliasesByConceptId.values()).flat();
}

function buildConceptPayloads(groups) {
  return groups.map((group) => ({
    conceptType: group.conceptType,
    canonicalKey: group.canonicalKey,
    preferredEntityId: group.preferredEntity.entityId,
    canonicalCurie: group.canonicalCurie || '',
    canonicalLabel: group.canonicalLabel,
    normalizedLabel: group.normalizedLabel,
    resolutionStrategy: group.resolutionStrategy,
    confidenceScore: group.confidenceScore,
    metadata: {
      memberCount: group.members.length,
      identifierCuries: group.identifierCuries
    }
  }));
}

function buildMembershipPayloads(groups, conceptIdByKey, canonicalResolutionRunId) {
  return groups.flatMap((group) => {
    const conceptId = conceptIdByKey.get(group.canonicalKey);
    if (!conceptId) {
      return [];
    }

    return group.members.map((member) => ({
      conceptId,
      entityId: member.entityId,
      membershipRole: member.entityId === group.preferredEntity.entityId ? 'preferred' : 'member',
      resolutionStrategy: member.seed.resolutionStrategy,
      confidenceScore: member.seed.confidenceScore,
      matchedOn: member.seed.matchedOn,
      sourceResolutionRunId: canonicalResolutionRunId
    }));
  });
}

async function insertInBatches(client, rows, insertFn) {
  for (const batch of chunkArray(rows)) {
    await insertFn(client, batch);
  }
}

async function insertConceptsInBatches(client, rows) {
  const inserted = [];
  for (const batch of chunkArray(rows)) {
    const batchRows = await insertCanonicalConcepts(client, batch);
    inserted.push(...batchRows);
  }
  return inserted;
}

export async function rebuildCanonicalLayer(
  { triggerMode = 'manual', requestedBy = '', options = {} } = {}
) {
  return withClient(async (client) => {
    const canonicalResolutionRunId = await startCanonicalResolutionRun(client, {
      triggerMode,
      requestedBy,
      strategyKey: CANONICAL_STRATEGY_KEY,
      options
    });

    try {
      await client.query('BEGIN');

      const [entityRows, aliasRows] = await Promise.all([
        listEntityRecordsForCanonicalization(client),
        listEntityAliasesForCanonicalization(client)
      ]);

      const groupedConcepts = groupEntitiesIntoCanonicalConcepts(entityRows);
      const conceptPayloads = buildConceptPayloads(groupedConcepts);

      await clearCanonicalLayer(client);

      const insertedConcepts = await insertConceptsInBatches(client, conceptPayloads);
      const conceptIdByKey = new Map(insertedConcepts.map((row) => [row.canonical_key, row.concept_id]));

      const membershipPayloads = buildMembershipPayloads(
        groupedConcepts,
        conceptIdByKey,
        canonicalResolutionRunId
      );
      const aliasPayloads = buildAliasRows(groupedConcepts, aliasRows, conceptIdByKey);

      await insertInBatches(client, membershipPayloads, insertCanonicalMemberships);
      await insertInBatches(client, aliasPayloads, insertCanonicalAliases);
      await rebuildCanonicalRelationships(client);

      const summary = await listCanonicalSummary(client);
      const runSummary = {
        conceptCount: conceptPayloads.length,
        membershipCount: membershipPayloads.length,
        aliasCount: aliasPayloads.length,
        conceptBreakdown: summary.concepts,
        relationshipBreakdown: summary.relationships
      };
      await completeCanonicalResolutionRun(client, canonicalResolutionRunId, {
        ...runSummary
      });

      await client.query('COMMIT');

      return {
        canonicalResolutionRunId,
        ...runSummary,
        summary
      };
    } catch (error) {
      await client.query('ROLLBACK');
      await failCanonicalResolutionRun(client, canonicalResolutionRunId, error.message || 'Canonical rebuild failed.');
      throw error;
    }
  });
}

export async function loadCanonicalSummary() {
  return withClient((client) => listCanonicalSummary(client));
}

export async function searchCanonicalKnowledge({ query, conceptType = '', limit = 8 }) {
  return withClient((client) =>
    searchCanonicalConcepts(client, {
      query,
      conceptType,
      limit
    })
  );
}

export async function loadCanonicalConceptDetail(conceptId) {
  return withClient((client) => getCanonicalConceptDetail(client, conceptId));
}

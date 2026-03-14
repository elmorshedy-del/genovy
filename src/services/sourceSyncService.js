import { BOOTSTRAP_SOURCE_ORDER, SOURCE_CATALOG, SOURCE_KEYS } from '../constants/sourceCatalog.js';
import { withClient } from '../db/pool.js';
import {
  ensureSourceCatalog,
  createSyncRun,
  finalizeSyncRun,
  markSourceSyncState,
  supersedeRunningSyncRunsForSource
} from '../repositories/sourceRepository.js';
import {
  resolveOrCreateEntity,
  upsertEntity,
  upsertEntityAlias,
  upsertEntityXref,
  upsertResolvedRelationship,
  upsertRelationshipEvidence,
  upsertSourceRecord
} from '../repositories/knowledgeRepository.js';
import { fetchMondoDataset } from './sources/mondoSource.js';
import { fetchHpoOntologyDataset } from './sources/hpoOntologySource.js';
import { fetchHpoDiseasePhenotypeDataset } from './sources/hpoAnnotationSource.js';
import { fetchHpoGeneDiseaseDataset } from './sources/hpoGeneDiseaseSource.js';
import { fetchHpoGenePhenotypeDataset } from './sources/hpoGenePhenotypeSource.js';
import { fetchClinvarGeneDiseaseDataset } from './sources/clinvarGeneDiseaseSource.js';
import { fetchClinicalTrialsDataset } from './sources/clinicalTrialsSource.js';
import { normalizeCurie, normalizeLabel } from '../lib/curies.js';

const SYNC_HANDLERS = Object.freeze({
  [SOURCE_KEYS.MONDO_ONTOLOGY]: fetchMondoDataset,
  [SOURCE_KEYS.HPO_ONTOLOGY]: fetchHpoOntologyDataset,
  [SOURCE_KEYS.HPO_DISEASE_PHENOTYPE]: fetchHpoDiseasePhenotypeDataset,
  [SOURCE_KEYS.HPO_GENE_DISEASE]: fetchHpoGeneDiseaseDataset,
  [SOURCE_KEYS.HPO_GENE_PHENOTYPE]: fetchHpoGenePhenotypeDataset,
  [SOURCE_KEYS.CLINVAR_GENE_DISEASE]: fetchClinvarGeneDiseaseDataset,
  [SOURCE_KEYS.CLINICAL_TRIALS]: fetchClinicalTrialsDataset
});

const CLINICAL_TRIALS_DEFAULTS = Object.freeze({
  maxPages: 5,
  pageSize: 100
});

const ACTIVE_SOURCE_SYNCS = new Map();

function resolveSourceOrThrow(sourceKey) {
  const source = SOURCE_CATALOG[sourceKey];
  const handler = SYNC_HANDLERS[sourceKey];
  if (!source || !handler) {
    throw new Error(`Unsupported source key: ${sourceKey}`);
  }
  return { source, handler };
}

async function applyDataset(client, source, syncRunId, dataset) {
  const entityIdByCurie = new Map();
  const entityIdByLabel = new Map();
  const counters = {
    entities: 0,
    aliases: 0,
    xrefs: 0,
    relationships: 0,
    sourceRecords: 0
  };

  for (const entity of dataset.entities || []) {
    const persisted = await upsertEntity(client, entity);
    const canonicalCurie = normalizeCurie(entity.canonicalCurie);
    entityIdByCurie.set(canonicalCurie, persisted.entity_id);
    entityIdByLabel.set(`${entity.entityType}|${normalizeLabel(entity.canonicalLabel || canonicalCurie)}`, persisted.entity_id);
    counters.entities += 1;
  }

  for (const alias of dataset.aliases || []) {
    const canonicalCurie = normalizeCurie(alias.canonicalCurie);
    let entityId = entityIdByCurie.get(canonicalCurie);
    if (!entityId) {
      const persisted = await upsertEntity(client, {
        entityType: 'unknown',
        canonicalCurie,
        canonicalLabel: canonicalCurie,
        primarySourceKey: source.sourceKey,
        isPlaceholder: true
      });
      entityId = persisted.entity_id;
      entityIdByCurie.set(canonicalCurie, entityId);
    }
    await upsertEntityAlias(client, {
      entityId,
      aliasLabel: alias.aliasLabel,
      aliasType: alias.aliasType,
      sourceKey: alias.sourceKey || source.sourceKey
    });
    counters.aliases += 1;
  }

  for (const xref of dataset.xrefs || []) {
    const canonicalCurie = normalizeCurie(xref.canonicalCurie);
    let entityId = entityIdByCurie.get(canonicalCurie);
    if (!entityId) {
      const persisted = await upsertEntity(client, {
        entityType: 'unknown',
        canonicalCurie,
        canonicalLabel: canonicalCurie,
        primarySourceKey: source.sourceKey,
        isPlaceholder: true
      });
      entityId = persisted.entity_id;
      entityIdByCurie.set(canonicalCurie, entityId);
    }
    await upsertEntityXref(client, {
      entityId,
      xrefCurie: xref.xrefCurie,
      xrefType: xref.xrefType,
      sourceKey: xref.sourceKey || source.sourceKey
    });
    counters.xrefs += 1;
  }

  for (const sourceRecord of dataset.sourceRecords || []) {
    await upsertSourceRecord(client, {
      ...sourceRecord,
      sourceKey: source.sourceKey,
      syncRunId
    });
    counters.sourceRecords += 1;
  }

  for (const relationship of dataset.relationships || []) {
    const subject = await resolveRelationshipEntity(
      client,
      relationship.subjectRef,
      source.sourceKey,
      entityIdByCurie,
      entityIdByLabel
    );
    const object = await resolveRelationshipEntity(
      client,
      relationship.objectRef,
      source.sourceKey,
      entityIdByCurie,
      entityIdByLabel
    );
    const persisted = await upsertResolvedRelationship(
      client,
      {
        subjectEntityId: subject.entity_id,
        predicateKey: relationship.predicateKey,
        objectEntityId: object.entity_id,
        qualifiers: relationship.qualifiers || {}
      },
      source.sourceKey
    );
    await upsertRelationshipEvidence(client, {
      relationshipId: persisted.relationship_id,
      sourceKey: source.sourceKey,
      syncRunId,
      sourceRecordKey: relationship.evidence?.sourceRecordKey || null,
      evidenceType: relationship.evidence?.evidenceType || 'source_record',
      evidenceCode: relationship.evidence?.evidenceCode || null,
      provenanceUrl: relationship.evidence?.provenanceUrl || source.homepageUrl,
      payload: relationship.evidence?.payload || relationship.qualifiers || {}
    });
    counters.relationships += 1;
  }

  return counters;
}

function buildEntityLabelCacheKey(ref) {
  if (!ref?.label) return '';
  return `${ref.entityType}|${normalizeLabel(ref.label)}`;
}

async function resolveRelationshipEntity(client, ref, sourceKey, entityIdByCurie, entityIdByLabel) {
  const normalizedCurie = normalizeCurie(ref?.curie || '');
  if (normalizedCurie && entityIdByCurie.has(normalizedCurie)) {
    return {
      entity_id: entityIdByCurie.get(normalizedCurie),
      canonical_curie: normalizedCurie
    };
  }

  const labelKey = buildEntityLabelCacheKey(ref);
  if (labelKey && entityIdByLabel.has(labelKey)) {
    return {
      entity_id: entityIdByLabel.get(labelKey),
      canonical_curie: normalizedCurie
    };
  }

  const resolved = await resolveOrCreateEntity(client, ref, sourceKey);
  if (resolved.canonical_curie) {
    entityIdByCurie.set(normalizeCurie(resolved.canonical_curie), resolved.entity_id);
  }
  if (labelKey) {
    entityIdByLabel.set(labelKey, resolved.entity_id);
  }
  return resolved;
}

async function createSourceSyncRun(sourceKey, options, requestedBy) {
  return withClient(async (client) => {
    await ensureSourceCatalog(client);
    await supersedeRunningSyncRunsForSource(client, sourceKey, SUPERSEDED_SYNC_MESSAGE);
    return createSyncRun(client, sourceKey, {
      triggerMode: options.triggerMode || 'manual',
      requestedBy,
      options
    });
  });
}

async function markSyncRunFailed(syncRunId, error) {
  return withClient((client) =>
    finalizeSyncRun(client, syncRunId, {
      status: 'failed',
      errorMessage: error.message || String(error),
      summary: {}
    })
  );
}

async function executeSourceSync(sourceKey, options, syncRunId) {
  const { source, handler } = resolveSourceOrThrow(sourceKey);
  const dataset = await handler(source, options);

  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      const counters = await applyDataset(client, source, syncRunId, dataset);
      await client.query('COMMIT');

      const summary = {
        ...counters,
        ...(dataset.summary || {})
      };
      await finalizeSyncRun(client, syncRunId, {
        status: 'completed',
        sourceVersion: dataset.sourceVersion || '',
        summary
      });
      await markSourceSyncState(client, sourceKey, syncRunId, dataset.sourceVersion || '', summary);

      return {
        syncRunId: syncRunId,
        sourceKey,
        sourceVersion: dataset.sourceVersion || '',
        summary
      };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('[genovy] source sync rollback failed', {
          sourceKey,
          syncRunId,
          error: rollbackError.message || String(rollbackError)
        });
      }
      await finalizeSyncRun(client, syncRunId, {
        status: 'failed',
        errorMessage: error.message || String(error),
        summary: {}
      });
      throw error;
    }
  });
}

async function runRegisteredSourceSync(sourceKey, options, syncRunId) {
  try {
    return await executeSourceSync(sourceKey, options, syncRunId);
  } catch (error) {
    try {
      await markSyncRunFailed(syncRunId, error);
    } catch (finalizeError) {
      console.error('[genovy] source sync finalize failed', {
        sourceKey,
        syncRunId,
        error: finalizeError.message || String(finalizeError)
      });
    }
    throw error;
  } finally {
    ACTIVE_SOURCE_SYNCS.delete(sourceKey);
  }
}

export function listActiveSourceSyncs() {
  return Array.from(ACTIVE_SOURCE_SYNCS.values()).map((entry) => ({
    sourceKey: entry.sourceKey,
    syncRunId: entry.syncRunId,
    requestedBy: entry.requestedBy,
    startedAt: entry.startedAt
  }));
}

export async function queueSourceSync(sourceKey, options = {}, requestedBy = 'api') {
  resolveSourceOrThrow(sourceKey);
  const existing = ACTIVE_SOURCE_SYNCS.get(sourceKey);
  if (existing) {
    return {
      sourceKey,
      syncRunId: existing.syncRunId,
      status: 'already_running'
    };
  }

  const syncRun = await createSourceSyncRun(sourceKey, options, requestedBy);
  const entry = {
    sourceKey,
    syncRunId: syncRun.sync_run_id,
    requestedBy,
    startedAt: syncRun.started_at,
    promise: null
  };

  const promise = runRegisteredSourceSync(sourceKey, options, syncRun.sync_run_id);
  entry.promise = promise;
  ACTIVE_SOURCE_SYNCS.set(sourceKey, entry);

  promise.catch((error) => {
    console.error('[genovy] queued source sync failed', {
      sourceKey,
      syncRunId: syncRun.sync_run_id,
      error: error.message || String(error)
    });
  });

  return {
    sourceKey,
    syncRunId: syncRun.sync_run_id,
    status: 'running'
  };
}

export async function syncSource(sourceKey, options = {}, requestedBy = 'api') {
  const queued = await queueSourceSync(sourceKey, options, requestedBy);
  if (queued.status === 'already_running') {
    return queued;
  }
  const active = ACTIVE_SOURCE_SYNCS.get(sourceKey);
  return active.promise;
}

function buildClinicalTrialsOptions(options, conditionQuery) {
  return {
    conditionQuery,
    maxPages: options.clinicalTrialsMaxPages || CLINICAL_TRIALS_DEFAULTS.maxPages,
    pageSize: options.clinicalTrialsPageSize || CLINICAL_TRIALS_DEFAULTS.pageSize
  };
}

export async function bootstrapKnowledgeNetwork(options = {}, requestedBy = 'api') {
  const results = [];
  for (const sourceKey of BOOTSTRAP_SOURCE_ORDER) {
    const sourceOptions = options[sourceKey] || {};
    const result = await syncSource(sourceKey, sourceOptions, requestedBy);
    results.push(result);
  }

  if (Array.isArray(options.clinicalTrialsQueries)) {
    for (const conditionQuery of options.clinicalTrialsQueries) {
      const result = await syncSource(
        SOURCE_KEYS.CLINICAL_TRIALS,
        buildClinicalTrialsOptions(options, conditionQuery),
        requestedBy
      );
      results.push(result);
    }
  }

  return results;
}

export async function queueBootstrapKnowledgeNetwork(options = {}, requestedBy = 'api') {
  const results = [];
  for (const sourceKey of BOOTSTRAP_SOURCE_ORDER) {
    const sourceOptions = options[sourceKey] || {};
    const result = await queueSourceSync(sourceKey, sourceOptions, requestedBy);
    results.push(result);
  }

  if (Array.isArray(options.clinicalTrialsQueries)) {
    for (const conditionQuery of options.clinicalTrialsQueries) {
      const result = await queueSourceSync(
        SOURCE_KEYS.CLINICAL_TRIALS,
        buildClinicalTrialsOptions(options, conditionQuery),
        requestedBy
      );
      results.push(result);
    }
  }

  return results;
}
const SUPERSEDED_SYNC_MESSAGE = 'Superseded by a newer sync request.';

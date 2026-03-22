import { BOOTSTRAP_SOURCE_ORDER, SOURCE_CATALOG, SOURCE_KEYS } from '../constants/sourceCatalog.js';
import { withClient } from '../db/pool.js';
import {
  ensureSourceCatalog,
  abandonRunningSyncRuns,
  createSyncRun,
  finalizeSyncRun,
  getSourceByKey,
  listActiveSourceKeys,
  listSuccessfulSourceKeys,
  markSourceSyncState,
  supersedeRunningSyncRunsForSource
} from '../repositories/sourceRepository.js';
import {
  resolveOrCreateEntity,
  resolveEntitiesByCurieBatch,
  upsertEntity,
  upsertEntitiesBatch,
  upsertEntityAlias,
  upsertEntityXref,
  upsertEntityXrefsBatch,
  upsertRelationshipEvidenceBatch,
  upsertResolvedRelationships,
  upsertSourceRecord,
  upsertSourceRecordsBatch
} from '../repositories/knowledgeRepository.js';
import {
  replaceClinicalNaturalHistoryTerms,
  upsertClinicalNaturalHistoryAssertion,
  upsertClinicalPhenotypeAssertionsBatch,
  upsertGeneDiseaseValidityAssertionsBatch,
  upsertVariantDiseaseAssertionsBatch
} from '../repositories/clinicalEvidenceRepository.js';
import { fetchMondoDataset } from './sources/mondoSource.js';
import { fetchHpoOntologyDataset } from './sources/hpoOntologySource.js';
import { fetchHpoDiseasePhenotypeDataset } from './sources/hpoAnnotationSource.js';
import { fetchOrphadataNaturalHistoryDataset } from './sources/orphadataNaturalHistorySource.js';
import { fetchHpoGeneDiseaseDataset } from './sources/hpoGeneDiseaseSource.js';
import { fetchHpoGenePhenotypeDataset } from './sources/hpoGenePhenotypeSource.js';
import { fetchClinGenGeneDiseaseValidityDataset } from './sources/clingenGeneDiseaseValiditySource.js';
import { fetchClinvarGeneDiseaseDataset } from './sources/clinvarGeneDiseaseSource.js';
import { fetchClinVarVariantSummaryDataset } from './sources/clinvarVariantSummarySource.js';
import { fetchClinicalTrialsDataset } from './sources/clinicalTrialsSource.js';
import { normalizeCurie, normalizeLabel, stableHash } from '../lib/curies.js';
import { filterBootstrapSourceKeys, shouldSkipCompletedSources } from '../lib/bootstrapSources.js';
import { stableJson } from '../lib/json.js';
import { dedupeEvidenceRows, dedupeRelationshipsByKey } from '../lib/syncBatchDedup.js';

const SYNC_HANDLERS = Object.freeze({
  [SOURCE_KEYS.MONDO_ONTOLOGY]: fetchMondoDataset,
  [SOURCE_KEYS.HPO_ONTOLOGY]: fetchHpoOntologyDataset,
  [SOURCE_KEYS.HPO_DISEASE_PHENOTYPE]: fetchHpoDiseasePhenotypeDataset,
  [SOURCE_KEYS.ORPHADATA_NATURAL_HISTORY]: fetchOrphadataNaturalHistoryDataset,
  [SOURCE_KEYS.HPO_GENE_DISEASE]: fetchHpoGeneDiseaseDataset,
  [SOURCE_KEYS.HPO_GENE_PHENOTYPE]: fetchHpoGenePhenotypeDataset,
  [SOURCE_KEYS.CLINGEN_GENE_DISEASE_VALIDITY]: fetchClinGenGeneDiseaseValidityDataset,
  [SOURCE_KEYS.CLINVAR_GENE_DISEASE]: fetchClinvarGeneDiseaseDataset,
  [SOURCE_KEYS.CLINVAR_VARIANT_SUMMARY]: fetchClinVarVariantSummaryDataset,
  [SOURCE_KEYS.CLINICAL_TRIALS]: fetchClinicalTrialsDataset
});

const CLINICAL_TRIALS_DEFAULTS = Object.freeze({
  maxPages: 5,
  pageSize: 100
});

const BOOTSTRAP_DEFAULTS = Object.freeze({
  skipCompletedSources: true
});

const RELATIONSHIP_BATCH_SIZE = 500;
const CLINICAL_ASSERTION_BATCH_SIZE = 500;
const ACTIVE_SOURCE_SYNCS = new Map();

function dedupeRowsByKey(rows, buildKey) {
  const deduped = new Map();
  for (const row of rows) {
    deduped.set(buildKey(row), row);
  }
  return [...deduped.values()];
}

function addRefCurie(target, ref) {
  const normalizedCurie = normalizeCurie(ref?.curie || '');
  if (normalizedCurie) {
    target.add(normalizedCurie);
  }
}

function collectDatasetReferenceCuries(dataset) {
  const curies = new Set();

  for (const relationship of dataset.relationships || []) {
    addRefCurie(curies, relationship.subjectRef);
    addRefCurie(curies, relationship.objectRef);
  }

  for (const assertion of dataset.clinicalPhenotypeAssertions || []) {
    addRefCurie(curies, assertion.subjectRef);
    addRefCurie(curies, assertion.phenotypeRef);
    addRefCurie(curies, assertion.onsetRef);
    addRefCurie(curies, assertion.frequencyRef);
    addRefCurie(curies, assertion.modifierRef);
  }

  for (const assertion of dataset.clinicalNaturalHistoryAssertions || []) {
    addRefCurie(curies, assertion.diseaseRef);
    for (const termEntry of assertion.termRefs || []) {
      addRefCurie(curies, termEntry.termRef);
    }
  }

  for (const assertion of dataset.geneDiseaseValidityAssertions || []) {
    addRefCurie(curies, assertion.geneRef);
    addRefCurie(curies, assertion.diseaseRef);
  }

  for (const assertion of dataset.clinicalVariantDiseaseAssertions || []) {
    addRefCurie(curies, assertion.variantRef);
    addRefCurie(curies, assertion.diseaseRef);
    addRefCurie(curies, assertion.geneRef);
  }

  return [...curies];
}

async function preloadEntityResolutionCache(client, dataset, entityIdByCurie) {
  const pendingCuries = collectDatasetReferenceCuries(dataset).filter((curie) => !entityIdByCurie.has(curie));
  if (!pendingCuries.length) {
    return;
  }

  const resolvedEntities = await resolveEntitiesByCurieBatch(client, pendingCuries);
  for (const resolved of resolvedEntities) {
    const matchedCurie = normalizeCurie(resolved.matched_curie || '');
    const canonicalCurie = normalizeCurie(resolved.canonical_curie || '');
    if (matchedCurie) {
      entityIdByCurie.set(matchedCurie, resolved.entity_id);
    }
    if (canonicalCurie) {
      entityIdByCurie.set(canonicalCurie, resolved.entity_id);
    }
  }
}

function resolveSourceOrThrow(sourceKey) {
  const source = SOURCE_CATALOG[sourceKey];
  const handler = SYNC_HANDLERS[sourceKey];
  if (!source || !handler) {
    throw new Error(`Unsupported source key: ${sourceKey}`);
  }
  return { source, handler };
}

function buildDisabledSourceResult(sourceKey) {
  return {
    sourceKey,
    status: 'disabled'
  };
}

async function applyDataset(client, source, syncRunId, dataset) {
  const entityIdByCurie = new Map();
  const entityIdByLabel = new Map();
  const counters = {
    entities: 0,
    aliases: 0,
    xrefs: 0,
    relationships: 0,
    sourceRecords: 0,
    clinicalPhenotypeAssertions: 0,
    clinicalNaturalHistoryAssertions: 0,
    clinicalGeneDiseaseValidityAssertions: 0,
    clinicalVariantDiseaseAssertions: 0
  };

  const dedupedEntities = dedupeRowsByKey(
    (dataset.entities || []).filter((entity) => normalizeCurie(entity.canonicalCurie)),
    (entity) => normalizeCurie(entity.canonicalCurie)
  );

  if (dedupedEntities.length) {
    const persistedEntities = await upsertEntitiesBatch(client, dedupedEntities);
    const entityByCurie = new Map(
      dedupedEntities.map((entity) => [normalizeCurie(entity.canonicalCurie), entity])
    );

    for (const persisted of persistedEntities) {
      const sourceEntity = entityByCurie.get(persisted.canonical_curie);
      if (!sourceEntity) {
        continue;
      }
      entityIdByCurie.set(persisted.canonical_curie, persisted.entity_id);
      entityIdByLabel.set(
        `${sourceEntity.entityType}|${normalizeLabel(sourceEntity.canonicalLabel || persisted.canonical_curie)}`,
        persisted.entity_id
      );
    }
    counters.entities += dedupedEntities.length;
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

  const pendingXrefs = [];
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
    pendingXrefs.push({
      entityId,
      xrefCurie: xref.xrefCurie,
      xrefType: xref.xrefType,
      sourceKey: xref.sourceKey || source.sourceKey
    });
    counters.xrefs += 1;
  }

  if (pendingXrefs.length) {
    await upsertEntityXrefsBatch(client, pendingXrefs);
  }

  const dedupedSourceRecords = dedupeRowsByKey(
    dataset.sourceRecords || [],
    (sourceRecord) => sourceRecord.sourceRecordKey
  );

  if (dedupedSourceRecords.length) {
    await upsertSourceRecordsBatch(
      client,
      dedupedSourceRecords.map((sourceRecord) => ({
        ...sourceRecord,
        sourceKey: source.sourceKey,
        syncRunId
      }))
    );
    counters.sourceRecords += dedupedSourceRecords.length;
  }

  await preloadEntityResolutionCache(client, dataset, entityIdByCurie);

  const pendingRelationships = [];
  const pendingEvidence = [];

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
    if (!subject || !object) {
      continue;
    }
    const qualifiers = relationship.qualifiers || {};
    const relationshipKey = buildResolvedRelationshipKey(
      subject.entity_id,
      relationship.predicateKey,
      object.entity_id,
      qualifiers
    );

    pendingRelationships.push({
      relationshipKey,
      subjectEntityId: subject.entity_id,
      predicateKey: relationship.predicateKey,
      objectEntityId: object.entity_id,
      qualifiers
    });
    pendingEvidence.push({
      relationshipKey,
      sourceKey: source.sourceKey,
      syncRunId,
      sourceRecordKey: relationship.evidence?.sourceRecordKey || null,
      evidenceType: relationship.evidence?.evidenceType || 'source_record',
      evidenceCode: relationship.evidence?.evidenceCode || null,
      confidenceScore: relationship.evidence?.confidenceScore || null,
      provenanceUrl: relationship.evidence?.provenanceUrl || source.homepageUrl,
      payload: relationship.evidence?.payload || qualifiers
    });

    if (pendingRelationships.length >= RELATIONSHIP_BATCH_SIZE) {
      await flushRelationshipBatch(
        client,
        pendingRelationships,
        pendingEvidence,
        source.sourceKey,
        counters
      );
    }
  }

  if (pendingRelationships.length) {
    await flushRelationshipBatch(client, pendingRelationships, pendingEvidence, source.sourceKey, counters);
  }

  if (dataset.clinicalPhenotypeAssertions?.length) {
    counters.clinicalPhenotypeAssertions += await persistClinicalPhenotypeAssertions(
      client,
      dataset.clinicalPhenotypeAssertions,
      source.sourceKey,
      syncRunId,
      entityIdByCurie,
      entityIdByLabel
    );
  }

  if (dataset.clinicalNaturalHistoryAssertions?.length) {
    counters.clinicalNaturalHistoryAssertions += await persistClinicalNaturalHistoryAssertions(
      client,
      dataset.clinicalNaturalHistoryAssertions,
      source.sourceKey,
      syncRunId,
      entityIdByCurie,
      entityIdByLabel
    );
  }

  if (dataset.geneDiseaseValidityAssertions?.length) {
    counters.clinicalGeneDiseaseValidityAssertions += await persistGeneDiseaseValidityAssertions(
      client,
      dataset.geneDiseaseValidityAssertions,
      source.sourceKey,
      syncRunId,
      entityIdByCurie,
      entityIdByLabel
    );
  }

  if (dataset.clinicalVariantDiseaseAssertions?.length) {
    counters.clinicalVariantDiseaseAssertions += await persistVariantDiseaseAssertions(
      client,
      dataset.clinicalVariantDiseaseAssertions,
      source.sourceKey,
      syncRunId,
      entityIdByCurie,
      entityIdByLabel
    );
  }

  return counters;
}

function buildResolvedRelationshipKey(subjectEntityId, predicateKey, objectEntityId, qualifiers) {
  return stableHash(`${subjectEntityId}|${predicateKey}|${objectEntityId}|${stableJson(qualifiers)}`);
}

async function flushRelationshipBatch(client, pendingRelationships, pendingEvidence, sourceKey, counters) {
  const dedupedRelationships = dedupeRelationshipsByKey(pendingRelationships);
  const persistedRelationships = await upsertResolvedRelationships(client, dedupedRelationships, sourceKey);
  const relationshipIdByKey = new Map(
    persistedRelationships.map((relationship) => [relationship.relationship_key, relationship.relationship_id])
  );

  const evidenceRows = [];
  for (const evidence of pendingEvidence) {
    const relationshipId = relationshipIdByKey.get(evidence.relationshipKey);
    if (!relationshipId) {
      throw new Error(`Failed to resolve relationship id for key ${evidence.relationshipKey}`);
    }

    evidenceRows.push({
      relationshipId,
      sourceKey: evidence.sourceKey,
      syncRunId: evidence.syncRunId,
      sourceRecordKey: evidence.sourceRecordKey,
      evidenceType: evidence.evidenceType,
      evidenceCode: evidence.evidenceCode,
      confidenceScore: evidence.confidenceScore,
      provenanceUrl: evidence.provenanceUrl,
      payload: evidence.payload
    });
  }

  await upsertRelationshipEvidenceBatch(client, dedupeEvidenceRows(evidenceRows));
  counters.relationships += dedupedRelationships.length;
  pendingRelationships.length = 0;
  pendingEvidence.length = 0;
}

function cacheResolvedEntity(ref, resolved, entityIdByCurie, entityIdByLabel) {
  if (!resolved) {
    return;
  }

  const normalizedCurie = normalizeCurie(resolved.canonical_curie || ref?.curie || '');
  if (normalizedCurie) {
    entityIdByCurie.set(normalizedCurie, resolved.entity_id);
  }

  const labelKey = buildEntityLabelCacheKey(ref);
  if (labelKey) {
    entityIdByLabel.set(labelKey, resolved.entity_id);
  }
}

async function resolveOptionalClinicalEntity(client, ref, sourceKey, entityIdByCurie, entityIdByLabel) {
  if (!ref) {
    return null;
  }

  const resolved = await resolveRelationshipEntity(client, ref, sourceKey, entityIdByCurie, entityIdByLabel);
  if (!resolved) {
    return null;
  }

  cacheResolvedEntity(ref, resolved, entityIdByCurie, entityIdByLabel);
  return resolved;
}

async function persistClinicalPhenotypeAssertions(
  client,
  assertions,
  sourceKey,
  syncRunId,
  entityIdByCurie,
  entityIdByLabel
) {
  const pendingRows = [];
  let persistedCount = 0;

  for (const assertion of assertions) {
    const subject = await resolveRelationshipEntity(client, assertion.subjectRef, sourceKey, entityIdByCurie, entityIdByLabel);
    const phenotype = await resolveRelationshipEntity(
      client,
      assertion.phenotypeRef,
      sourceKey,
      entityIdByCurie,
      entityIdByLabel
    );
    if (!subject || !phenotype) {
      continue;
    }

    const onset = await resolveOptionalClinicalEntity(
      client,
      assertion.onsetRef,
      sourceKey,
      entityIdByCurie,
      entityIdByLabel
    );
    const frequency = await resolveOptionalClinicalEntity(
      client,
      assertion.frequencyRef,
      sourceKey,
      entityIdByCurie,
      entityIdByLabel
    );
    const modifier = await resolveOptionalClinicalEntity(
      client,
      assertion.modifierRef,
      sourceKey,
      entityIdByCurie,
      entityIdByLabel
    );

    pendingRows.push({
      subjectEntityId: subject.entity_id,
      phenotypeEntityId: phenotype.entity_id,
      presenceStatus: assertion.presenceStatus,
      sourceKey,
      syncRunId,
      sourceRecordKey: assertion.sourceRecordKey,
      evidenceCode: assertion.evidenceCode || '',
      confidenceScore: assertion.confidenceScore ?? '',
      onsetEntityId: onset?.entity_id || '',
      frequencyEntityId: frequency?.entity_id || '',
      modifierEntityId: modifier?.entity_id || '',
      sex: assertion.sex || '',
      aspect: assertion.aspect || '',
      referenceText: assertion.referenceText || '',
      provenanceUrl: assertion.provenanceUrl || '',
      payload: assertion.payload || {}
    });

    if (pendingRows.length >= CLINICAL_ASSERTION_BATCH_SIZE) {
      await upsertClinicalPhenotypeAssertionsBatch(client, pendingRows);
      persistedCount += pendingRows.length;
      pendingRows.length = 0;
    }
  }

  if (pendingRows.length) {
    await upsertClinicalPhenotypeAssertionsBatch(client, pendingRows);
    persistedCount += pendingRows.length;
  }

  return persistedCount;
}

async function persistClinicalNaturalHistoryAssertions(
  client,
  assertions,
  sourceKey,
  syncRunId,
  entityIdByCurie,
  entityIdByLabel
) {
  let persistedCount = 0;

  for (const assertion of assertions) {
    const disease = await resolveRelationshipEntity(client, assertion.diseaseRef, sourceKey, entityIdByCurie, entityIdByLabel);
    if (!disease) {
      continue;
    }

    const naturalHistoryAssertionId = await upsertClinicalNaturalHistoryAssertion(client, {
      diseaseEntityId: disease.entity_id,
      sourceKey,
      syncRunId,
      sourceRecordKey: assertion.sourceRecordKey,
      validationStatus: assertion.validationStatus || '',
      expertLink: assertion.expertLink || '',
      sourceText: assertion.sourceText || '',
      provenanceUrl: assertion.provenanceUrl || '',
      payload: assertion.payload || {}
    });

    const terms = [];
    for (const termEntry of assertion.termRefs || []) {
      const term = await resolveOptionalClinicalEntity(
        client,
        termEntry.termRef,
        sourceKey,
        entityIdByCurie,
        entityIdByLabel
      );
      terms.push({
        termRole: termEntry.termRole,
        termEntityId: term?.entity_id || '',
        termLabel: termEntry.termRef?.label || term?.canonical_curie || '',
        sortOrder: termEntry.sortOrder ?? 0
      });
    }

    await replaceClinicalNaturalHistoryTerms(client, naturalHistoryAssertionId, terms);
    persistedCount += 1;
  }

  return persistedCount;
}

async function persistGeneDiseaseValidityAssertions(
  client,
  assertions,
  sourceKey,
  syncRunId,
  entityIdByCurie,
  entityIdByLabel
) {
  const pendingRows = [];
  let persistedCount = 0;

  for (const assertion of assertions) {
    const gene = await resolveRelationshipEntity(client, assertion.geneRef, sourceKey, entityIdByCurie, entityIdByLabel);
    const disease = await resolveRelationshipEntity(client, assertion.diseaseRef, sourceKey, entityIdByCurie, entityIdByLabel);
    if (!gene || !disease) {
      continue;
    }

    pendingRows.push({
      geneEntityId: gene.entity_id,
      diseaseEntityId: disease.entity_id,
      sourceKey,
      syncRunId,
      sourceRecordKey: assertion.sourceRecordKey,
      classification: assertion.classification || '',
      modeOfInheritance: assertion.modeOfInheritance || '',
      curationSop: assertion.curationSop || '',
      classificationDate: assertion.classificationDate || '',
      gcep: assertion.gcep || '',
      onlineReportUrl: assertion.onlineReportUrl || '',
      provenanceUrl: assertion.provenanceUrl || '',
      payload: assertion.payload || {}
    });

    if (pendingRows.length >= CLINICAL_ASSERTION_BATCH_SIZE) {
      const dedupedRows = dedupeRowsByKey(
        pendingRows,
        (row) =>
          `${row.sourceKey}|${row.sourceRecordKey}|${row.geneEntityId}|${row.diseaseEntityId}|${row.classification}`
      );
      await upsertGeneDiseaseValidityAssertionsBatch(client, dedupedRows);
      persistedCount += dedupedRows.length;
      pendingRows.length = 0;
    }
  }

  if (pendingRows.length) {
    const dedupedRows = dedupeRowsByKey(
      pendingRows,
      (row) => `${row.sourceKey}|${row.sourceRecordKey}|${row.geneEntityId}|${row.diseaseEntityId}|${row.classification}`
    );
    await upsertGeneDiseaseValidityAssertionsBatch(client, dedupedRows);
    persistedCount += dedupedRows.length;
  }

  return persistedCount;
}

async function persistVariantDiseaseAssertions(
  client,
  assertions,
  sourceKey,
  syncRunId,
  entityIdByCurie,
  entityIdByLabel
) {
  const pendingRows = [];
  let persistedCount = 0;

  for (const assertion of assertions) {
    const variant = await resolveRelationshipEntity(client, assertion.variantRef, sourceKey, entityIdByCurie, entityIdByLabel);
    const disease = await resolveRelationshipEntity(client, assertion.diseaseRef, sourceKey, entityIdByCurie, entityIdByLabel);
    const gene = await resolveOptionalClinicalEntity(client, assertion.geneRef, sourceKey, entityIdByCurie, entityIdByLabel);
    if (!variant || !disease) {
      continue;
    }

    pendingRows.push({
      variantEntityId: variant.entity_id,
      diseaseEntityId: disease.entity_id,
      geneEntityId: gene?.entity_id || '',
      sourceKey,
      syncRunId,
      sourceRecordKey: assertion.sourceRecordKey,
      alleleId: assertion.alleleId || '',
      variationId: assertion.variationId || '',
      variantName: assertion.variantName || '',
      variationType: assertion.variationType || '',
      clinicalSignificance: assertion.clinicalSignificance || '',
      clinicalSignificanceSimple: assertion.clinicalSignificanceSimple || '',
      reviewStatus: assertion.reviewStatus || '',
      numberSubmitters: assertion.numberSubmitters || '',
      origin: assertion.origin || '',
      originSimple: assertion.originSimple || '',
      assembly: assertion.assembly || '',
      lastEvaluated: assertion.lastEvaluated || '',
      rcvAccession: assertion.rcvAccession || '',
      phenotypeIds: assertion.phenotypeIds || '',
      phenotypeList: assertion.phenotypeList || '',
      provenanceUrl: assertion.provenanceUrl || '',
      payload: assertion.payload || {}
    });

    if (pendingRows.length >= CLINICAL_ASSERTION_BATCH_SIZE) {
      const dedupedRows = dedupeRowsByKey(
        pendingRows,
        (row) =>
          `${row.sourceKey}|${row.sourceRecordKey}|${row.variantEntityId}|${row.diseaseEntityId}|${row.assembly}`
      );
      await upsertVariantDiseaseAssertionsBatch(client, dedupedRows);
      persistedCount += dedupedRows.length;
      pendingRows.length = 0;
    }
  }

  if (pendingRows.length) {
    const dedupedRows = dedupeRowsByKey(
      pendingRows,
      (row) => `${row.sourceKey}|${row.sourceRecordKey}|${row.variantEntityId}|${row.diseaseEntityId}|${row.assembly}`
    );
    await upsertVariantDiseaseAssertionsBatch(client, dedupedRows);
    persistedCount += dedupedRows.length;
  }

  return persistedCount;
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
  if (!resolved) {
    return null;
  }
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
    const sourceState = await getSourceByKey(client, sourceKey);
    if (!sourceState) {
      throw new Error(`Unknown source key: ${sourceKey}`);
    }
    if (!sourceState.is_active) {
      throw new Error(`Source ${sourceKey} is disabled. Re-enable it before syncing.`);
    }
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

async function resolveBootstrapSourceOrder(options = {}) {
  const effectiveOptions = {
    ...BOOTSTRAP_DEFAULTS,
    ...options
  };

  const activeSourceKeys = await withClient(async (client) => {
    await ensureSourceCatalog(client);
    return listActiveSourceKeys(client, BOOTSTRAP_SOURCE_ORDER);
  });

  const activeSourceSet = new Set(activeSourceKeys);
  const activeBootstrapSources = BOOTSTRAP_SOURCE_ORDER.filter((sourceKey) => activeSourceSet.has(sourceKey));

  if (!shouldSkipCompletedSources(effectiveOptions)) {
    return activeBootstrapSources;
  }

  const successfulSourceKeys = await withClient(async (client) => {
    await ensureSourceCatalog(client);
    return listSuccessfulSourceKeys(client, activeBootstrapSources);
  });

  return filterBootstrapSourceKeys(activeBootstrapSources, successfulSourceKeys, effectiveOptions);
}

export async function bootstrapKnowledgeNetwork(options = {}, requestedBy = 'api') {
  const results = [];
  const sourceOrder = await resolveBootstrapSourceOrder(options);
  const activeSourceKeys = new Set(
    await withClient(async (client) => {
      await ensureSourceCatalog(client);
      return listActiveSourceKeys(client, [SOURCE_KEYS.CLINICAL_TRIALS]);
    })
  );
  for (const sourceKey of sourceOrder) {
    const sourceOptions = options[sourceKey] || {};
    const result = await syncSource(sourceKey, sourceOptions, requestedBy);
    results.push(result);
  }

  if (Array.isArray(options.clinicalTrialsQueries)) {
    if (!activeSourceKeys.has(SOURCE_KEYS.CLINICAL_TRIALS)) {
      results.push(buildDisabledSourceResult(SOURCE_KEYS.CLINICAL_TRIALS));
      return results;
    }
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
  const sourceOrder = await resolveBootstrapSourceOrder(options);
  const activeSourceKeys = new Set(
    await withClient(async (client) => {
      await ensureSourceCatalog(client);
      return listActiveSourceKeys(client, [SOURCE_KEYS.CLINICAL_TRIALS]);
    })
  );
  for (const sourceKey of sourceOrder) {
    const sourceOptions = options[sourceKey] || {};
    const result = await queueSourceSync(sourceKey, sourceOptions, requestedBy);
    results.push(result);
  }

  if (Array.isArray(options.clinicalTrialsQueries)) {
    if (!activeSourceKeys.has(SOURCE_KEYS.CLINICAL_TRIALS)) {
      results.push(buildDisabledSourceResult(SOURCE_KEYS.CLINICAL_TRIALS));
      return results;
    }
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

export async function abandonInterruptedSourceSyncs() {
  return withClient(async (client) => {
    await ensureSourceCatalog(client);
    return abandonRunningSyncRuns(client, 'Abandoned after service restart before sync completed.');
  });
}

const SUPERSEDED_SYNC_MESSAGE = 'Superseded by a newer sync request.';

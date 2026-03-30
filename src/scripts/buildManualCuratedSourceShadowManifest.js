import fs from 'node:fs/promises';
import path from 'node:path';
import { withClient } from '../db/pool.js';
import { loadDxDiseasePhenotypeRows } from '../repositories/dxRepository.js';
import { resolveEntitiesByCurieBatch, resolveEntityByLabel } from '../repositories/knowledgeRepository.js';
import { normalizeCurie, normalizeLabel } from '../lib/curies.js';
import { SOURCE_KEYS } from '../constants/sourceCatalog.js';

const DEFAULTS = Object.freeze({
  outputJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-curated-source-shadow-manifest-20260329.json',
  generatedAt: '2026-03-29',
  sourceKey: SOURCE_KEYS.MANUAL_CURATED_SOURCE_SHADOW
});

const ASSERTION_STATUS = Object.freeze({
  PRESENT: 'present',
  ABSENT: 'absent'
});

const HPO_FREQUENCY_CURIES = Object.freeze({
  obligate: 'HP:0040280',
  veryFrequent: 'HP:0040281',
  frequent: 'HP:0040282',
  occasional: 'HP:0040283',
  veryRare: 'HP:0040284',
  excluded: 'HP:0040285'
});

const MANUAL_SOURCES = Object.freeze([
  {
    kind: 'scenario_shadow',
    filePath:
      '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-setd2-symmetric-source-terms-20260326.json',
    scenarioId: 'omim_gene_reviews_setd2_tcf20',
    sideByDiseaseCurie: {
      'MONDO:0014791': 'truth-side',
      'MONDO:0032745': 'rival-side'
    },
    caseIds: ['PMID_33766796_16'],
    evidenceTag: 'manual_setd2_omim_genereviews_shadow'
  },
  {
    kind: 'scenario_shadow',
    filePath:
      '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-socs1-symmetric-source-terms-20260326.json',
    scenarioId: 'omim_literal_socs1_ctla4',
    sideByDiseaseCurie: {
      'MONDO:0800130': 'truth-side',
      'MONDO:0014493': 'rival-side'
    },
    caseIds: ['PMID_32929212_P1'],
    evidenceTag: 'manual_socs1_omim_pmid_shadow'
  },
  {
    kind: 'u2af2_shadow',
    filePath:
      '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-u2af2-symmetric-source-terms-20260327.json',
    evidenceTag: 'manual_u2af2_omim_shadow'
  },
  {
    kind: 'scenario_shadow',
    filePath:
      '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-ppp2r1a-truth-source-terms-20260327.json',
    scenarioId: 'omim_gene_reviews_paper_ppp2r1a_truth_only',
    sideByDiseaseCurie: {
      'MONDO:0014605': 'truth-side'
    },
    caseIds: ['PMID_37761890_22', 'PMID_37761890_43'],
    evidenceTag: 'manual_ppp2r1a_omim_genereviews_pmid_shadow'
  },
  {
    kind: 'rere_case_series',
    filePath:
      '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-rere-symmetric-case-series-terms-20260326.json',
    sideByDiseaseCurie: {
      'MONDO:0014857': 'truth-side',
      'MONDO:0032485': 'rival-side'
    },
    evidenceTag: 'manual_rere_case_series_shadow'
  },
  {
    kind: 'scenario_shadow',
    filePath:
      '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-rere-symmetric-omim-terms-20260326.json',
    scenarioId: 'omim_literal_rere_med13',
    sideByDiseaseCurie: {
      'MONDO:0014857': 'truth-side',
      'MONDO:0032485': 'rival-side'
    },
    caseIds: ['PMID_29330883_Subject9'],
    evidenceTag: 'manual_rere_omim_shadow'
  }
]);

function parseArgs(argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      flags[key] = true;
    } else {
      flags[key] = next;
      index += 1;
    }
  }
  return flags;
}

function slugify(value) {
  return String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function normalizeFrequency(rawLabel = '') {
  const value = String(rawLabel || '').trim().toLowerCase();
  if (!value) return { frequencyCurie: '', frequencyLabel: '' };
  if (value.includes('obligate') || value.includes('100%')) {
    return { frequencyCurie: HPO_FREQUENCY_CURIES.obligate, frequencyLabel: 'Obligate' };
  }
  if (value.includes('very frequent') || value.includes('80-99%')) {
    return { frequencyCurie: HPO_FREQUENCY_CURIES.veryFrequent, frequencyLabel: 'Very frequent' };
  }
  if (value.includes('frequent') || value.includes('30-79%')) {
    return { frequencyCurie: HPO_FREQUENCY_CURIES.frequent, frequencyLabel: 'Frequent' };
  }
  if (value.includes('occasional') || value.includes('5-29%')) {
    return { frequencyCurie: HPO_FREQUENCY_CURIES.occasional, frequencyLabel: 'Occasional' };
  }
  if (value.includes('very rare') || value.includes('1-4%')) {
    return { frequencyCurie: HPO_FREQUENCY_CURIES.veryRare, frequencyLabel: 'Very rare' };
  }
  if (value.includes('excluded') || value === '0%') {
    return { frequencyCurie: HPO_FREQUENCY_CURIES.excluded, frequencyLabel: 'Excluded' };
  }
  return { frequencyCurie: '', frequencyLabel: String(rawLabel || '').trim() };
}

function buildExistingDirectKey(diseaseCurie, phenotypeCurie, presenceStatus) {
  return `${diseaseCurie}|${phenotypeCurie}|${presenceStatus}`;
}

function buildManifestEntry({
  diseaseEntity,
  phenotypeEntity,
  caseIds,
  side,
  sourceKey,
  evidenceTag,
  sourceReference,
  referenceText,
  sourceFile,
  generatedAt,
  originalSourceKey = '',
  frequencyCurie = '',
  frequencyLabel = '',
  sourcePayload = {}
}) {
  return {
    diseaseEntityId: diseaseEntity.entity_id,
    diseaseCurie: diseaseEntity.canonical_curie,
    diseaseLabel: diseaseEntity.canonical_label,
    phenotypeEntityId: phenotypeEntity.entity_id,
    phenotypeCurie: phenotypeEntity.canonical_curie,
    phenotypeLabel: phenotypeEntity.canonical_label,
    assertionPresenceStatus: ASSERTION_STATUS.PRESENT,
    packetPresenceStatus: '',
    sourceKey,
    sourceReference,
    referenceText,
    phenotypeEdgeOrigin: 'direct',
    frequencyCurie,
    frequencyLabel,
    onsetCurie: '',
    onsetLabel: '',
    side,
    caseId: caseIds.join(','),
    dateAdded: generatedAt,
    evidenceTag,
    sourceRecordKey: `${slugify(sourceKey)}:${slugify(diseaseEntity.canonical_curie)}:${slugify(phenotypeEntity.canonical_curie)}:${slugify(evidenceTag)}`,
    payload: {
      sourceFile,
      originalSourceKey,
      sourcePayload
    }
  };
}

async function resolveDiseaseEntities(client, diseaseCuries) {
  const resolved = await resolveEntitiesByCurieBatch(client, diseaseCuries);
  const entityIdByCurie = new Map();
  for (const row of resolved) {
    entityIdByCurie.set(row.matched_curie, row.entity_id);
    entityIdByCurie.set(row.canonical_curie, row.entity_id);
  }

  const { rows } = await client.query(
    `
      SELECT entity_id, canonical_curie, canonical_label
      FROM entities
      WHERE entity_id = ANY($1::BIGINT[])
    `,
    [[...new Set(entityIdByCurie.values())]]
  );

  return new Map(rows.map((row) => [row.canonical_curie, row]));
}

async function resolvePhenotypeByCurieOrLabel(client, phenotypeCurie, phenotypeLabel) {
  const normalizedCurie = normalizeCurie(phenotypeCurie || '');
  if (normalizedCurie) {
    const resolved = await resolveEntitiesByCurieBatch(client, [normalizedCurie]);
    const entityId = resolved[0]?.entity_id;
    if (entityId) {
      const { rows } = await client.query(
        `
          SELECT entity_id, canonical_curie, canonical_label
          FROM entities
          WHERE entity_id = $1
          LIMIT 1
        `,
        [entityId]
      );
      if (rows[0]) return rows[0];
    }
  }

  const entity = await resolveEntityByLabel(client, {
    label: phenotypeLabel,
    entityType: 'phenotype'
  });
  if (entity) {
    return {
      entity_id: entity.entity_id,
      canonical_curie: entity.canonical_curie,
      canonical_label: entity.canonical_label
    };
  }

  return null;
}

async function buildScenarioShadowEntries(client, source, diseaseEntityByCurie, existingDirectKeys) {
  const payload = JSON.parse(await fs.readFile(source.filePath, 'utf8'));
  const scenario = (payload.scenarios || []).find((row) => row.id === source.scenarioId);
  if (!scenario) {
    throw new Error(`Scenario ${source.scenarioId} not found in ${source.filePath}`);
  }

  const entries = [];
  const skipped = [];

  for (const row of scenario.shadowAddedTerms || []) {
    const diseaseCurie = normalizeCurie(row.disease_curie);
    const phenotypeCurie = normalizeCurie(row.phenotype_curie);
    const diseaseEntity = diseaseEntityByCurie.get(diseaseCurie);
    const phenotypeEntity = await resolvePhenotypeByCurieOrLabel(client, phenotypeCurie, row.phenotype_label);
    const presenceStatus = row.presence_status || ASSERTION_STATUS.PRESENT;

    if (!diseaseEntity || !phenotypeEntity) {
      skipped.push({
        sourceFile: source.filePath,
        diseaseCurie,
        phenotypeCurie,
        phenotypeLabel: row.phenotype_label,
        reason: 'Could not resolve disease or phenotype against the staged graph.'
      });
      continue;
    }

    if (existingDirectKeys.has(buildExistingDirectKey(diseaseCurie, phenotypeEntity.canonical_curie, presenceStatus))) {
      skipped.push({
        sourceFile: source.filePath,
        diseaseCurie,
        phenotypeCurie: phenotypeEntity.canonical_curie,
        phenotypeLabel: phenotypeEntity.canonical_label,
        reason: 'Already present on direct disease surface after structured import.'
      });
      continue;
    }

    entries.push(
      buildManifestEntry({
        diseaseEntity,
        phenotypeEntity,
        caseIds: source.caseIds || [],
        side: source.sideByDiseaseCurie[diseaseCurie] || '',
        sourceKey: DEFAULTS.sourceKey,
        evidenceTag: source.evidenceTag,
        sourceReference: row.reference_text || source.scenarioId,
        referenceText: row.reference_text || source.scenarioId,
        sourceFile: path.basename(source.filePath),
        generatedAt: DEFAULTS.generatedAt,
        originalSourceKey: row.source_key || source.scenarioId,
        frequencyCurie: normalizeCurie(row.frequency_curie || ''),
        frequencyLabel: row.frequency_label || '',
        sourcePayload: {
          originalSourceRecordKey: row.source_record_key || '',
          scenarioId: source.scenarioId
        }
      })
    );
  }

  return { entries, skipped };
}

async function buildU2af2Entries(client, source, diseaseEntityByCurie, existingDirectKeys) {
  const payload = JSON.parse(await fs.readFile(source.filePath, 'utf8'));
  const buckets = [
    {
      rows: payload.truthShadow?.added || [],
      diseaseCurie: normalizeCurie(payload.truthDiseaseCurie),
      side: 'truth-side'
    },
    {
      rows: payload.rivalShadow?.added || [],
      diseaseCurie: normalizeCurie(payload.rivalDiseaseCurie),
      side: 'rival-side'
    }
  ];

  const entries = [];
  const skipped = [];

  for (const bucket of buckets) {
    const diseaseEntity = diseaseEntityByCurie.get(bucket.diseaseCurie);
    for (const row of bucket.rows) {
      const phenotypeEntity = await resolvePhenotypeByCurieOrLabel(client, row.phenotypeCurie, row.phenotypeLabel);
      if (!diseaseEntity || !phenotypeEntity) {
        skipped.push({
          sourceFile: source.filePath,
          diseaseCurie: bucket.diseaseCurie,
          phenotypeCurie: row.phenotypeCurie,
          phenotypeLabel: row.phenotypeLabel,
          reason: 'Could not resolve U2AF2 disease or phenotype in staged graph.'
        });
        continue;
      }

      if (existingDirectKeys.has(buildExistingDirectKey(bucket.diseaseCurie, phenotypeEntity.canonical_curie, ASSERTION_STATUS.PRESENT))) {
        skipped.push({
          sourceFile: source.filePath,
          diseaseCurie: bucket.diseaseCurie,
          phenotypeCurie: phenotypeEntity.canonical_curie,
          phenotypeLabel: phenotypeEntity.canonical_label,
          reason: 'Already present on direct disease surface after structured import.'
        });
        continue;
      }

      entries.push(
        buildManifestEntry({
          diseaseEntity,
          phenotypeEntity,
          caseIds: [payload.caseId].filter(Boolean),
          side: bucket.side,
          sourceKey: DEFAULTS.sourceKey,
          evidenceTag: source.evidenceTag,
          sourceReference: row.referenceText || 'U2AF2 manual source shadow',
          referenceText: row.referenceText || 'U2AF2 manual source shadow',
          sourceFile: path.basename(source.filePath),
          generatedAt: DEFAULTS.generatedAt,
          sourcePayload: {
            sourceStack: payload.sourceStack,
            shadowBucket: bucket.side
          }
        })
      );
    }
  }

  return { entries, skipped };
}

async function buildRereCaseSeriesEntries(client, source, diseaseEntityByCurie, existingDirectKeys) {
  const payload = JSON.parse(await fs.readFile(source.filePath, 'utf8'));
  const frequencyByKey = new Map(
    (payload.frequency?.added || []).map((row) => {
      const key = `${normalizeCurie(row.disease)}|${normalizeLabel(row.term)}`;
      return [key, normalizeFrequency(row.frequency)];
    })
  );

  const entries = [];
  const skipped = [];

  for (const row of payload.presence?.added || []) {
    const diseaseCurie = normalizeCurie(row.disease);
    const diseaseEntity = diseaseEntityByCurie.get(diseaseCurie);
    const phenotypeEntity = await resolvePhenotypeByCurieOrLabel(client, '', row.term);
    const frequencyInfo = frequencyByKey.get(`${diseaseCurie}|${normalizeLabel(row.term)}`) || {
      frequencyCurie: '',
      frequencyLabel: ''
    };

    if (!diseaseEntity || !phenotypeEntity) {
      skipped.push({
        sourceFile: source.filePath,
        diseaseCurie,
        phenotypeLabel: row.term,
        reason: 'Could not resolve RERE case-series disease or phenotype in staged graph.'
      });
      continue;
    }

    if (existingDirectKeys.has(buildExistingDirectKey(diseaseCurie, phenotypeEntity.canonical_curie, ASSERTION_STATUS.PRESENT))) {
      skipped.push({
        sourceFile: source.filePath,
        diseaseCurie,
        phenotypeCurie: phenotypeEntity.canonical_curie,
        phenotypeLabel: phenotypeEntity.canonical_label,
        reason: 'Already present on direct disease surface after structured import.'
      });
      continue;
    }

    entries.push(
      buildManifestEntry({
        diseaseEntity,
        phenotypeEntity,
        caseIds: [payload.caseId].filter(Boolean),
        side: source.sideByDiseaseCurie[diseaseCurie] || '',
        sourceKey: DEFAULTS.sourceKey,
        evidenceTag: source.evidenceTag,
        sourceReference: row.referenceText || 'RERE case series shadow',
        referenceText: row.referenceText || 'RERE case series shadow',
        sourceFile: path.basename(source.filePath),
        generatedAt: DEFAULTS.generatedAt,
        frequencyCurie: frequencyInfo.frequencyCurie,
        frequencyLabel: frequencyInfo.frequencyLabel,
        sourcePayload: {
          originalTerm: row.term
        }
      })
    );
  }

  return { entries, skipped };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const outputJson = flags.output || DEFAULTS.outputJson;
  const generatedAt = flags['generated-at'] || DEFAULTS.generatedAt;
  const sourceKey = flags['source-key'] || DEFAULTS.sourceKey;

  const result = await withClient(async (client) => {
    const dx = await loadDxDiseasePhenotypeRows(client);
    const dxRows = dx.rows || [];
    const existingDirectKeys = new Set(
      dxRows
        .filter((row) => (row.phenotype_edge_origin || 'direct') === 'direct')
        .map((row) =>
          buildExistingDirectKey(
            normalizeCurie(row.disease_curie),
            normalizeCurie(row.phenotype_curie),
            row.presence_status || ASSERTION_STATUS.PRESENT
          )
        )
    );

    const allDiseaseCuries = new Set();
    for (const source of MANUAL_SOURCES) {
      if (source.sideByDiseaseCurie) {
        for (const diseaseCurie of Object.keys(source.sideByDiseaseCurie)) {
          const normalized = normalizeCurie(diseaseCurie);
          if (normalized) allDiseaseCuries.add(normalized);
        }
        continue;
      }

      if (source.kind === 'u2af2_shadow') {
        const payload = JSON.parse(await fs.readFile(source.filePath, 'utf8'));
        for (const diseaseCurie of [payload.truthDiseaseCurie, payload.rivalDiseaseCurie]) {
          const normalized = normalizeCurie(diseaseCurie);
          if (normalized) allDiseaseCuries.add(normalized);
        }
      }
    }

    const diseaseEntityByCurie = await resolveDiseaseEntities(client, [...allDiseaseCuries]);
    const entries = [];
    const skipped = [];

    for (const source of MANUAL_SOURCES) {
      let built;
      if (source.kind === 'scenario_shadow') {
        built = await buildScenarioShadowEntries(client, source, diseaseEntityByCurie, existingDirectKeys);
      } else if (source.kind === 'u2af2_shadow') {
        built = await buildU2af2Entries(client, source, diseaseEntityByCurie, existingDirectKeys);
      } else if (source.kind === 'rere_case_series') {
        built = await buildRereCaseSeriesEntries(client, source, diseaseEntityByCurie, existingDirectKeys);
      } else {
        throw new Error(`Unsupported manual source kind: ${source.kind}`);
      }

      for (const entry of built.entries) {
        entry.sourceKey = sourceKey;
        entry.dateAdded = generatedAt;
      }
      entries.push(...built.entries);
      skipped.push(...built.skipped);
    }

    const deduped = new Map();
    for (const entry of entries) {
      const key = `${entry.diseaseCurie}|${entry.phenotypeCurie}|${entry.assertionPresenceStatus}|${entry.evidenceTag}`;
      deduped.set(key, entry);
    }

    return {
      createdAt: generatedAt,
      sourceKey,
      strategy: 'manual_curated_source_shadow_overlay',
      description:
        'Overlay manual source-backed OMIM/GeneReviews/PMID shadow additions on top of the structured staging graph, keeping full provenance per term.',
      inputs: MANUAL_SOURCES.map((source) => ({
        kind: source.kind,
        filePath: source.filePath,
        evidenceTag: source.evidenceTag
      })),
      entryCount: deduped.size,
      skippedCount: skipped.length,
      skipped,
      entries: [...deduped.values()].sort((left, right) => {
        if (left.diseaseCurie !== right.diseaseCurie) return left.diseaseCurie.localeCompare(right.diseaseCurie);
        return left.phenotypeCurie.localeCompare(right.phenotypeCurie);
      })
    };
  });

  await fs.mkdir(path.dirname(outputJson), { recursive: true });
  await fs.writeFile(outputJson, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error('[build-manual-curated-source-shadow-manifest] failed:', error);
  process.exit(1);
});

import fs from 'node:fs/promises';
import path from 'node:path';
import { withClient } from '../db/pool.js';
import { loadDxDiseasePhenotypeRows } from '../repositories/dxRepository.js';
import {
  resolveEntitiesByCurieBatch,
  resolveEntityByLabel,
  searchKnowledgeEntities
} from '../repositories/knowledgeRepository.js';
import { normalizeCurie, normalizeLabel } from '../lib/curies.js';

const DEFAULTS = Object.freeze({
  inputDir: '/Users/ahmedelmorshedy/Downloads/files (4)/gr_output_label_only_20260329',
  outputJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-global-shadow-manifest-20260329.json',
  generatedAt: '2026-03-29'
});

const SOURCE_KEY = 'genereviews_nlp';

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

const HPO_FREQUENCY_LABELS = Object.freeze({
  [HPO_FREQUENCY_CURIES.obligate]: 'Obligate',
  [HPO_FREQUENCY_CURIES.veryFrequent]: 'Very frequent',
  [HPO_FREQUENCY_CURIES.frequent]: 'Frequent',
  [HPO_FREQUENCY_CURIES.occasional]: 'Occasional',
  [HPO_FREQUENCY_CURIES.veryRare]: 'Very rare',
  [HPO_FREQUENCY_CURIES.excluded]: 'Excluded'
});

function parseArgs(argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      flags[key] = true;
      continue;
    }
    flags[key] = next;
    index += 1;
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

function asPresenceStatus(status) {
  return String(status || '').trim().toLowerCase() === 'excluded'
    ? ASSERTION_STATUS.ABSENT
    : ASSERTION_STATUS.PRESENT;
}

function buildLabelCandidates(label) {
  const raw = String(label || '').trim();
  const candidates = new Set();
  if (!raw) return [];
  candidates.add(raw);

  if (raw.endsWith('ies') && raw.length > 3) {
    candidates.add(`${raw.slice(0, -3)}y`);
  }
  if (raw.endsWith('s') && !raw.endsWith('ss') && raw.length > 3) {
    candidates.add(raw.slice(0, -1));
  }
  if (raw.includes(' abnormalities')) {
    candidates.add(raw.replace(' abnormalities', ' abnormality'));
  }
  if (raw.includes(' abnormality')) {
    candidates.add(raw.replace(' abnormality', ' abnormalities'));
  }
  return [...candidates];
}

function normalizeTextFrequency(rawValue) {
  const value = String(rawValue || '').trim().toLowerCase();
  if (!value) return '';
  if (value === '100%' || value === 'all') return HPO_FREQUENCY_CURIES.obligate;
  if (value.includes('very frequent') || value.includes('80-99%') || value.includes('≥80')) {
    return HPO_FREQUENCY_CURIES.veryFrequent;
  }
  if (
    value.includes('frequent') ||
    value.includes('common') ||
    value.includes('often') ||
    value.includes('most') ||
    value.includes('30-79%')
  ) {
    return HPO_FREQUENCY_CURIES.frequent;
  }
  if (value.includes('occasional') || value.includes('5-29%')) {
    return HPO_FREQUENCY_CURIES.occasional;
  }
  if (
    value.includes('rare') ||
    value.includes('minority') ||
    value.includes('few') ||
    value.includes('1-4%') ||
    value.includes('fewer than')
  ) {
    return HPO_FREQUENCY_CURIES.veryRare;
  }
  return '';
}

function normalizeRatioFrequency(rawValue) {
  const value = String(rawValue || '').trim();
  const ratio = value.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!ratio) return '';
  const numerator = Number(ratio[1]);
  const denominator = Number(ratio[2]);
  if (!denominator) return '';
  const percentage = (numerator / denominator) * 100;
  if (percentage === 100) return HPO_FREQUENCY_CURIES.obligate;
  if (percentage >= 80) return HPO_FREQUENCY_CURIES.veryFrequent;
  if (percentage >= 30) return HPO_FREQUENCY_CURIES.frequent;
  if (percentage >= 5) return HPO_FREQUENCY_CURIES.occasional;
  if (percentage >= 1) return HPO_FREQUENCY_CURIES.veryRare;
  return HPO_FREQUENCY_CURIES.excluded;
}

function buildFrequencyInfo(rawValue) {
  const raw = String(rawValue || '').trim();
  const curie = normalizeTextFrequency(raw) || normalizeRatioFrequency(raw);
  return {
    frequency: raw || null,
    frequencyCurie: curie || '',
    frequencyLabel: curie ? HPO_FREQUENCY_LABELS[curie] || raw : raw || ''
  };
}

async function loadEntityRows(client, curies) {
  const normalized = [...new Set((curies || []).map((value) => normalizeCurie(value)).filter(Boolean))];
  if (!normalized.length) return [];
  const result = await client.query(
    `
      SELECT entity_id, canonical_curie, canonical_label, entity_type
      FROM entities
      WHERE canonical_curie = ANY($1::text[])
      ORDER BY canonical_curie ASC
    `,
    [normalized]
  );
  return result.rows;
}

async function resolvePhenotypeEntity(client, label, entityByCurie) {
  for (const labelCandidate of buildLabelCandidates(label)) {
    const exact = await resolveEntityByLabel(client, labelCandidate, 'phenotype');
    if (exact) {
      const exactCurie = normalizeCurie(exact.canonical_curie);
      let entity = entityByCurie.get(exactCurie);
      if (!entity) {
        const [loaded] = await loadEntityRows(client, [exactCurie]);
        if (loaded) {
          entity = loaded;
          entityByCurie.set(exactCurie, loaded);
        }
      }
      if (entity) {
        return {
          entity,
          mappingMode:
            normalizeLabel(labelCandidate) === normalizeLabel(label)
              ? 'label_exact_or_alias'
              : 'label_variant_exact_or_alias'
        };
      }
    }
  }

  const diagnostics = await searchKnowledgeEntities(client, {
    query: label,
    entityType: 'phenotype',
    limit: 3
  });

  return {
    entity: null,
    mappingMode: '',
    diagnostics: diagnostics.map((row) => ({
      canonicalCurie: row.canonical_curie,
      canonicalLabel: row.canonical_label,
      matchRank: row.match_rank
    }))
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const inputDir = flags.inputDir || DEFAULTS.inputDir;
  const outputJson = flags.output || DEFAULTS.outputJson;

  const entries = await fs.readdir(inputDir);
  const extractedFiles = entries
    .filter((fileName) => fileName.endsWith('.json') && !fileName.includes('summary'))
    .sort();

  const extractedPayloads = [];
  for (const fileName of extractedFiles) {
    const payload = JSON.parse(await fs.readFile(path.join(inputDir, fileName), 'utf8'));
    if (!payload?.disease_curie) continue;
    extractedPayloads.push({
      fileName,
      payload
    });
  }

  const result = await withClient(async (client) => {
    const { rows: dxRows } = await loadDxDiseasePhenotypeRows(client);
    const directDiseasePhenotypes = new Set(
      dxRows
        .filter((row) => (row.phenotype_edge_origin || 'direct') === 'direct')
        .map((row) => `${row.disease_curie}|${row.phenotype_curie}|${row.presence_status || ASSERTION_STATUS.PRESENT}`)
    );

    const diseaseCuries = [...new Set(extractedPayloads.map((row) => normalizeCurie(row.payload.disease_curie)).filter(Boolean))];
    const resolvedDiseaseRows = await resolveEntitiesByCurieBatch(client, diseaseCuries);
    const diseaseEntityRows = await loadEntityRows(
      client,
      resolvedDiseaseRows.flatMap((row) => [row.matched_curie, row.canonical_curie])
    );
    const entityByCurie = new Map(diseaseEntityRows.map((row) => [row.canonical_curie, row]));

    const manifestEntries = [];
    const skipped = [];

    for (const extracted of extractedPayloads) {
      const diseaseCurie = normalizeCurie(extracted.payload.disease_curie);
      const diseaseEntity = entityByCurie.get(diseaseCurie);
      if (!diseaseEntity) {
        skipped.push({
          scope: 'chapter',
          fileName: extracted.fileName,
          chapterTitle: extracted.payload.chapter_title,
          diseaseCurie,
          reason: 'Mapped disease curie could not be resolved in the staged graph.'
        });
        continue;
      }

      for (const feature of extracted.payload.features || []) {
        const label = String(feature.label || '').trim();
        if (!label) {
          skipped.push({
            scope: 'feature',
            fileName: extracted.fileName,
            chapterTitle: extracted.payload.chapter_title,
            diseaseCurie,
            reason: 'Feature label was empty after extraction.'
          });
          continue;
        }

        const presenceStatus = asPresenceStatus(feature.status);
        const phenotypeResolution = await resolvePhenotypeEntity(client, label, entityByCurie);
        const phenotypeEntity = phenotypeResolution.entity;

        if (!phenotypeEntity) {
          skipped.push({
            scope: 'feature',
            fileName: extracted.fileName,
            chapterTitle: extracted.payload.chapter_title,
            diseaseCurie,
            reviewedPhenotypeLabel: label,
            reason: 'Reviewed phenotype label could not be grounded safely in the staged graph.',
            mappingDiagnostics: phenotypeResolution.diagnostics || []
          });
          continue;
        }

        const existingKey = `${diseaseCurie}|${phenotypeEntity.canonical_curie}|${presenceStatus}`;
        if (directDiseasePhenotypes.has(existingKey)) {
          skipped.push({
            scope: 'feature',
            fileName: extracted.fileName,
            chapterTitle: extracted.payload.chapter_title,
            diseaseCurie,
            reviewedPhenotypeLabel: label,
            phenotypeCurie: phenotypeEntity.canonical_curie,
            reason: 'Phenotype already exists on the current direct disease surface.'
          });
          continue;
        }

        const frequencyInfo = buildFrequencyInfo(feature.frequency);
        manifestEntries.push({
          chapterTitle: extracted.payload.chapter_title || '',
          diseaseEntityId: diseaseEntity.entity_id,
          diseaseCurie: diseaseEntity.canonical_curie,
          diseaseLabel: diseaseEntity.canonical_label,
          phenotypeCurie: phenotypeEntity.canonical_curie,
          phenotypeLabel: phenotypeEntity.canonical_label,
          assertionPresenceStatus: presenceStatus,
          sourceKey: SOURCE_KEY,
          sourceReference: extracted.payload.nbk_id || '',
          referenceText: `GeneReviews:${extracted.payload.nbk_id || ''}`,
          phenotypeEdgeOrigin: 'direct',
          frequency: frequencyInfo.frequency,
          frequencyCurie: frequencyInfo.frequencyCurie,
          frequencyLabel: frequencyInfo.frequencyLabel,
          onset: feature.onset || null,
          side: 'global-source',
          dateAdded: DEFAULTS.generatedAt,
          evidenceTag: `genereviews_nlp_${slugify(extracted.payload.nbk_id || extracted.payload.chapter_title || extracted.fileName)}`,
          sourceRecordKey: `genereviews-nlp:${slugify(
            extracted.payload.chapter_title || extracted.fileName
          )}:${slugify(diseaseEntity.canonical_curie)}:${slugify(phenotypeEntity.canonical_curie)}:${presenceStatus}`,
          provenanceUrl: extracted.payload.chapter_path
            ? `https://www.ncbi.nlm.nih.gov${extracted.payload.chapter_path}`
            : `https://www.ncbi.nlm.nih.gov/books/${extracted.payload.nbk_id || ''}/`,
          payload: {
            extractedPhenotypeLabel: label,
            extractedConfidence: feature.confidence || '',
            sourceSentence: feature.source_sentence || '',
            chapterPath: extracted.payload.chapter_path || '',
            chapterTitle: extracted.payload.chapter_title || '',
            mappingMode: phenotypeResolution.mappingMode
          }
        });
      }
    }

    manifestEntries.sort((left, right) => {
      return (
        left.diseaseCurie.localeCompare(right.diseaseCurie) ||
        left.phenotypeCurie.localeCompare(right.phenotypeCurie)
      );
    });

    return {
      entries: manifestEntries,
      skipped
    };
  });

  const payload = {
    createdAt: DEFAULTS.generatedAt,
    sourceKey: SOURCE_KEY,
    sourceDir: inputDir,
    entryCount: result.entries.length,
    skippedCount: result.skipped.length,
    entries: result.entries,
    skipped: result.skipped
  };

  await fs.writeFile(outputJson, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        outputJson,
        entryCount: payload.entryCount,
        skippedCount: payload.skippedCount
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

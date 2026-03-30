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
  rosterJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-global-roster-20260329.json',
  policyJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/data/source-enrichment/genereviews-chapter-policy-template-20260329.json',
  outputJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-honest-symmetric-shadow-manifest-20260329.json',
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

function extractNbkId(value) {
  const match = String(value || '').match(/(NBK\d+)/i);
  return match ? match[1].toUpperCase() : '';
}

function buildChapterKey(...values) {
  for (const value of values) {
    const slug = slugify(value);
    if (slug) return slug;
  }
  return '';
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

function asPresenceStatus(status) {
  return String(status || '').trim().toLowerCase() === 'excluded'
    ? ASSERTION_STATUS.ABSENT
    : ASSERTION_STATUS.PRESENT;
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

function getPolicyEntry(policyPayload, chapterIdentity) {
  const chapters = Array.isArray(policyPayload?.chapters) ? policyPayload.chapters : [];
  return (
    chapters.find((chapter) => {
      const chapterNbkId = extractNbkId(chapter.nbkId || chapter.chapterPath || chapter.chapterTitle);
      if (chapterIdentity.nbkId && chapterNbkId && chapterIdentity.nbkId === chapterNbkId) {
        return true;
      }

      const chapterKey = buildChapterKey(
        chapter.chapterKey,
        chapter.chapterTitle,
        chapter.chapterPath,
        chapter.nbkId
      );
      return Boolean(chapterIdentity.chapterKey && chapterIdentity.chapterKey === chapterKey);
    }) || null
  );
}

function getPolicyConfig(policyEntry, policyPayload) {
  const defaults = policyPayload?.defaults || {};
  const policy = policyEntry?.policy || {};
  return {
    ingestionDecision: String(policy.ingestionDecision || defaults.ingestionDecision || '').trim(),
    chapterScope: String(policy.chapterScope || defaults.chapterScope || '').trim(),
    targetingMode: String(policy.targetingMode || defaults.targetingMode || '').trim(),
    diseaseTargets: (policy.diseaseTargets || []).map((value) => normalizeCurie(value)).filter(Boolean),
    notes: String(policy.notes || defaults.notes || '').trim()
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const inputDir = flags.inputDir || DEFAULTS.inputDir;
  const rosterJson = flags.roster || DEFAULTS.rosterJson;
  const policyJson = flags.policy || DEFAULTS.policyJson;
  const outputJson = flags.output || DEFAULTS.outputJson;

  const roster = JSON.parse(await fs.readFile(rosterJson, 'utf8'));
  const policyPayload = JSON.parse(await fs.readFile(policyJson, 'utf8'));

  const rosterByChapterIdentity = new Map();
  for (const chapter of Array.isArray(roster.chapters) ? roster.chapters : []) {
    const nbkId = extractNbkId(chapter.chapterPath);
    const chapterKey = buildChapterKey(chapter.chapterTitle, chapter.chapterPath, nbkId);
    if (!chapterKey) continue;
    rosterByChapterIdentity.set(chapterKey, {
      ...chapter,
      nbkId,
      chapterKey
    });
  }

  const inputEntries = await fs.readdir(inputDir);
  const extractedByChapterIdentity = new Map();
  for (const fileName of inputEntries.filter((value) => value.endsWith('.json') && !value.includes('summary'))) {
    const payload = JSON.parse(await fs.readFile(path.join(inputDir, fileName), 'utf8'));
    const nbkId = extractNbkId(payload?.nbk_id || fileName);
    const chapterKey = buildChapterKey(payload?.chapter_title, payload?.disease_name, fileName.replace(/\.json$/i, ''));
    if (!nbkId && !chapterKey) continue;
    extractedByChapterIdentity.set(chapterKey || nbkId, {
      fileName,
      payload,
      nbkId,
      chapterKey
    });
  }

  const result = await withClient(async (client) => {
    const { rows: dxRows } = await loadDxDiseasePhenotypeRows(client);
    const directDiseasePhenotypes = new Set(
      dxRows
        .filter((row) => (row.phenotype_edge_origin || 'direct') === 'direct')
        .map((row) => `${row.disease_curie}|${row.phenotype_curie}|${row.presence_status || ASSERTION_STATUS.PRESENT}`)
    );

    const allTargetCuries = [];
    for (const chapter of rosterByChapterIdentity.values()) {
      const policyEntry = getPolicyEntry(policyPayload, {
        nbkId: chapter.nbkId,
        chapterKey: chapter.chapterKey
      });
      const policy = getPolicyConfig(policyEntry, policyPayload);
      allTargetCuries.push(...policy.diseaseTargets);
    }

    const resolvedDiseaseRows = await resolveEntitiesByCurieBatch(client, allTargetCuries);
    const diseaseEntityRows = await loadEntityRows(
      client,
      resolvedDiseaseRows.flatMap((row) => [row.matched_curie, row.canonical_curie])
    );
    const entityByCurie = new Map(diseaseEntityRows.map((row) => [row.canonical_curie, row]));

    const acceptedEntries = [];
    const reviewQueue = [];
    const coverageGaps = [];
    const skipped = [];
    const chapterAudit = [];
    const manifestKeys = new Set();

    for (const chapter of rosterByChapterIdentity.values()) {
      const chapterIdentityKey = chapter.chapterKey || chapter.nbkId;
      const extracted = extractedByChapterIdentity.get(chapterIdentityKey) || null;
      const nbkId = chapter.nbkId || extracted?.nbkId || '';
      const policyEntry = getPolicyEntry(policyPayload, {
        nbkId,
        chapterKey: chapter.chapterKey
      });
      const policy = getPolicyConfig(policyEntry, policyPayload);
      let acceptedCount = 0;
      let reviewCount = 0;
      let gapCount = 0;

      if (chapter.mappingStatus !== 'exact_label_or_alias') {
        coverageGaps.push({
          nbkId,
          chapterTitle: chapter.chapterTitle || '',
          chapterPath: chapter.chapterPath || '',
          coverageStatus: 'mapping_gap',
          reason:
            chapter.mappingStatus === 'needs_review'
              ? 'Chapter title maps to multiple or uncertain diseases and cannot be used symmetrically without manual targeting.'
              : 'Chapter title does not resolve to a disease in the current graph.'
        });
        gapCount += 1;
      } else if (!extracted) {
        coverageGaps.push({
          nbkId,
          chapterTitle: chapter.chapterTitle || '',
          chapterPath: chapter.chapterPath || '',
          coverageStatus: 'extraction_missing',
          reason: 'Chapter is known, but no extracted GeneReviews payload was provided for this NBK entry.'
        });
        gapCount += 1;
      } else if (policy.ingestionDecision !== 'auto_accept') {
        reviewQueue.push({
          scope: 'chapter',
          nbkId,
          chapterTitle: chapter.chapterTitle || '',
          chapterPath: chapter.chapterPath || '',
          reviewReason:
            policy.ingestionDecision
              ? `Policy decision is ${policy.ingestionDecision}; explicit review is still required before ingestion.`
              : 'No explicit chapter policy exists yet for this chapter.',
          rosterMappingStatus: chapter.mappingStatus || '',
          proposedDiseaseCurie: chapter.diseaseCurie || '',
          policy
        });
        reviewCount += 1;
      } else if (!policy.diseaseTargets.length) {
        coverageGaps.push({
          nbkId,
          chapterTitle: chapter.chapterTitle || '',
          chapterPath: chapter.chapterPath || '',
          coverageStatus: 'target_gap',
          reason: 'Chapter policy allows auto-accept, but no disease targets were supplied.'
        });
        gapCount += 1;
      } else {
        const targetEntities = policy.diseaseTargets
          .map((curie) => entityByCurie.get(curie))
          .filter(Boolean);

        if (!targetEntities.length) {
          coverageGaps.push({
            nbkId,
            chapterTitle: chapter.chapterTitle || '',
            chapterPath: chapter.chapterPath || '',
            coverageStatus: 'target_resolution_gap',
            reason: 'Policy disease targets could not be resolved in the staged graph.',
            policy
          });
          gapCount += 1;
        } else {
          for (const feature of extracted.payload.features || []) {
            const label = String(feature.label || '').trim();
            if (!label) {
              reviewQueue.push({
                scope: 'feature',
                nbkId,
                chapterTitle: chapter.chapterTitle || '',
                reviewReason: 'Feature label was empty after extraction.',
                feature
              });
              reviewCount += 1;
              continue;
            }

            const presenceStatus = asPresenceStatus(feature.status);
            const phenotypeResolution = await resolvePhenotypeEntity(client, label, entityByCurie);
            if (!phenotypeResolution.entity) {
              reviewQueue.push({
                scope: 'feature',
                nbkId,
                chapterTitle: chapter.chapterTitle || '',
                reviewReason: 'Feature label could not be grounded safely to a phenotype in the graph.',
                extractedPhenotypeLabel: label,
                mappingDiagnostics: phenotypeResolution.diagnostics || [],
                feature
              });
              reviewCount += 1;
              continue;
            }

            const phenotypeEntity = phenotypeResolution.entity;
            const frequencyInfo = buildFrequencyInfo(feature.frequency);

            for (const diseaseEntity of targetEntities) {
              const existingKey = `${diseaseEntity.canonical_curie}|${phenotypeEntity.canonical_curie}|${presenceStatus}`;
              if (directDiseasePhenotypes.has(existingKey)) {
                skipped.push({
                  scope: 'feature',
                  nbkId,
                  chapterTitle: chapter.chapterTitle || '',
                  diseaseCurie: diseaseEntity.canonical_curie,
                  phenotypeCurie: phenotypeEntity.canonical_curie,
                  reason: 'Phenotype already exists on the current direct disease surface.'
                });
                continue;
              }

              const manifestKey = `${nbkId}|${diseaseEntity.canonical_curie}|${phenotypeEntity.canonical_curie}|${presenceStatus}`;
              if (manifestKeys.has(manifestKey)) {
                continue;
              }
              manifestKeys.add(manifestKey);

              acceptedEntries.push({
                chapterTitle: chapter.chapterTitle || extracted.payload.disease_name || '',
                diseaseEntityId: diseaseEntity.entity_id,
                diseaseCurie: diseaseEntity.canonical_curie,
                diseaseLabel: diseaseEntity.canonical_label,
                phenotypeCurie: phenotypeEntity.canonical_curie,
                phenotypeLabel: phenotypeEntity.canonical_label,
                assertionPresenceStatus: presenceStatus,
                sourceKey: SOURCE_KEY,
                sourceReference: nbkId,
                referenceText: `GeneReviews:${nbkId}`,
                phenotypeEdgeOrigin: 'direct',
                frequency: frequencyInfo.frequency,
                frequencyCurie: frequencyInfo.frequencyCurie,
                frequencyLabel: frequencyInfo.frequencyLabel,
                onset: feature.onset || null,
                side: 'global-source',
                dateAdded: DEFAULTS.generatedAt,
                evidenceTag: `genereviews_nlp_${slugify(nbkId)}`,
                sourceRecordKey: `genereviews-nlp:${slugify(nbkId)}:${slugify(
                  diseaseEntity.canonical_curie
                )}:${slugify(phenotypeEntity.canonical_curie)}:${presenceStatus}`,
                provenanceUrl: chapter.chapterUrl || `https://www.ncbi.nlm.nih.gov/books/${nbkId}/`,
                payload: {
                  extractedPhenotypeLabel: label,
                  extractedConfidence: feature.confidence || '',
                  sourceSentence: feature.source_sentence || '',
                  chapterPath: chapter.chapterPath || '',
                  chapterTitle: chapter.chapterTitle || '',
                  mappingMode: phenotypeResolution.mappingMode,
                  chapterScope: policy.chapterScope,
                  targetingMode: policy.targetingMode,
                  policyNotes: policy.notes,
                  rosterMappingStatus: chapter.mappingStatus || '',
                  diseaseTargetCount: targetEntities.length
                }
              });
              acceptedCount += 1;
            }
          }
        }
      }

      chapterAudit.push({
        nbkId,
        chapterTitle: chapter.chapterTitle || '',
        chapterPath: chapter.chapterPath || '',
        rosterMappingStatus: chapter.mappingStatus || '',
        extracted: Boolean(extracted),
        policyDecision: policy.ingestionDecision || '',
        chapterScope: policy.chapterScope || '',
        targetCount: policy.diseaseTargets.length,
        acceptedEntryCount: acceptedCount,
        reviewItemCount: reviewCount,
        coverageGapCount: gapCount
      });
    }

    acceptedEntries.sort((left, right) => {
      return (
        left.diseaseCurie.localeCompare(right.diseaseCurie) ||
        left.phenotypeCurie.localeCompare(right.phenotypeCurie)
      );
    });

    chapterAudit.sort((left, right) => left.nbkId.localeCompare(right.nbkId));

    return {
      acceptedEntries,
      reviewQueue,
      coverageGaps,
      skipped,
      chapterAudit
    };
  });

  const payload = {
    createdAt: DEFAULTS.generatedAt,
    sourceKey: SOURCE_KEY,
    inputDir,
    rosterJson,
    policyJson,
    acceptedEntryCount: result.acceptedEntries.length,
    reviewCount: result.reviewQueue.length,
    coverageGapCount: result.coverageGaps.length,
    skippedCount: result.skipped.length,
    acceptedEntries: result.acceptedEntries,
    reviewQueue: result.reviewQueue,
    coverageGaps: result.coverageGaps,
    skipped: result.skipped,
    chapterAudit: result.chapterAudit
  };

  await fs.mkdir(path.dirname(outputJson), { recursive: true });
  await fs.writeFile(outputJson, `${JSON.stringify(payload, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        outputJson,
        acceptedEntryCount: payload.acceptedEntryCount,
        reviewCount: payload.reviewCount,
        coverageGapCount: payload.coverageGapCount,
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

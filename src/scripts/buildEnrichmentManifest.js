import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { withClient } from '../db/pool.js';
import {
  buildAncestorMap,
  buildNormalFindingOverride,
  createStageTracker,
  ensureDir,
  isReviewDecision,
  loadPhenotypeOntologyRows,
  loadPhenotypeRows,
  normalizeText,
  loadPolicyFile,
  parseArgs,
  pickRichest,
  sliceChapters,
  toBaseName,
  writeJson
} from '../lib/genereviewsPipeline.js';

const DEFAULTS = Object.freeze({
  policyJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/data/source-enrichment/genereviews-chapter-policy-template-20260329.json',
  enrichedDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-20260329/stage5_enriched',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-20260329/stage6_manifest',
  start: 0,
  limit: 20,
  minIc: 0.5,
  sourceKey: 'genereviews_nlp'
});

const MIN_LLM_CANDIDATE_TRUST = 'high';
const LOW_PRECISION_FREQUENCY_VALUES = new Set(['all', 'most', 'many', 'some', 'few', 'minority', 'common', 'uncommon']);
const SEVERITY_TERMS = ['mild', 'moderate', 'severe', 'profound'];

function sanitizeSeverity(feature) {
  const severity = String(feature.severity_raw || '').trim();
  if (!severity) return;
  const lower = severity.toLowerCase();
  const lowerLabel = String(feature.hpo_label || '').toLowerCase();
  const lowerContext = String(feature.local_context || feature.source_sentence || '').toLowerCase();
  if (SEVERITY_TERMS.some((term) => lower.includes(term) && lowerLabel.includes(term))) {
    feature.severity_raw = null;
    feature.severity_trust = null;
    return;
  }
  if (lower.includes(',') || /\bor\b/.test(lower) || lower.includes('and/or')) {
    feature.severity_raw = null;
    feature.severity_trust = null;
    return;
  }
  const severityTermsInContext = new Set(SEVERITY_TERMS.filter((term) => lowerContext.includes(term)));
  if (severityTermsInContext.size > 1 && (lowerContext.includes(',') || /\bor\b/.test(lowerContext))) {
    feature.severity_raw = null;
    feature.severity_trust = null;
  }
}

function mergeByHpo(features) {
  const map = new Map();
  for (const feature of features) {
    map.set(feature.hpo_id, pickRichest(map.get(feature.hpo_id), feature));
  }
  return [...map.values()];
}

function mergeByNormalizedLabel(features) {
  const map = new Map();
  for (const feature of features) {
    const key = `${normalizeText(feature.hpo_label)}::${feature.status || 'present'}`;
    map.set(key, pickRichest(map.get(key), feature));
  }
  return [...map.values()];
}

function collapseParentChild(features, ancestorMap) {
  const kept = new Map(features.map((feature) => [feature.hpo_id, feature]));
  for (const feature of features) {
    for (const other of features) {
      if (feature.hpo_id === other.hpo_id) continue;
      const ancestors = ancestorMap.get(other.hpo_id) || new Set();
      if (!ancestors.has(feature.hpo_id)) continue;
      const mergedChild = pickRichest(other, feature);
      kept.set(other.hpo_id, mergedChild);
      kept.delete(feature.hpo_id);
    }
  }
  return [...kept.values()];
}

function cleanupFeatures(features, phenotypeMetaByCurie, ancestorMap, minIc) {
  const normalized = [];
  for (const feature of features) {
    const override = buildNormalFindingOverride(feature.hpo_label);
    const next = override
      ? {
          ...feature,
          hpo_id: override.target_hpo_id,
          hpo_label: override.target_label,
          status: override.status
        }
      : feature;
    if (LOW_PRECISION_FREQUENCY_VALUES.has(String(next.frequency_value || '').toLowerCase())) {
      next.frequency_value = null;
      next.frequency_raw = null;
      next.frequency_trust = null;
    }
    sanitizeSeverity(next);
    normalized.push(next);
  }

  const deduped = mergeByHpo(normalized);
  const collapsed = collapseParentChild(deduped, ancestorMap);
  const mergedByLabel = mergeByNormalizedLabel(collapsed);
  return mergedByLabel.filter((feature) => {
    const meta = phenotypeMetaByCurie.get(feature.hpo_id);
    if (!meta) return false;
    if (meta.is_inheritance || meta.is_clinical_modifier) return false;
    if ((meta.ic_score || 0) < minIc) return false;
    if (feature.anchor_source === 'llm_candidate' && feature.hpo_mapping_trust !== MIN_LLM_CANDIDATE_TRUST) return false;
    const lower = String(feature.hpo_label || '').toLowerCase();
    if (lower === 'healthy') return false;
    if (lower.startsWith('obsolete ')) return false;
    if (lower.startsWith('normal ')) return false;
    if (lower.includes('response to') || lower.includes('therapy')) return false;
    if (lower.includes('side effect')) return false;
    if (lower.includes('requirement for')) return false;
    return true;
  });
}

function buildManifestRows(chapter, features, sourceKey) {
  const policy = chapter.policy || {};
  const diseaseTargets = Array.isArray(policy.diseaseTargets) ? policy.diseaseTargets : [];
  const provenanceUrl = chapter.nbkId ? `https://www.ncbi.nlm.nih.gov/books/${chapter.nbkId}/` : chapter.chapterUrl || '';
  const rows = [];
  for (const diseaseTarget of diseaseTargets) {
    for (const feature of features) {
      rows.push({
        nbk_id: chapter.nbkId || '',
        chapter_title: chapter.chapterTitle || '',
        disease_targets: [diseaseTarget],
        hpo_id: feature.hpo_id,
        hpo_label: feature.hpo_label,
        status: feature.status || 'present',
        frequency_value: feature.frequency_value || null,
        frequency_raw: feature.frequency_raw || null,
        frequency_trust: feature.frequency_trust || null,
        onset_hpo_id: feature.onset_hpo_id || null,
        onset_label: feature.onset_label || null,
        onset_raw: feature.onset_raw || null,
        onset_trust: feature.onset_trust || null,
        severity_raw: feature.severity_raw || null,
        severity_trust: feature.severity_trust || null,
        subtype_raw: feature.subtype_raw || null,
        progression_raw: feature.progression_raw || null,
        treatment_response_raw: feature.treatment_response_raw || null,
        source_sentence: feature.source_sentence || '',
        source_key: sourceKey,
        reference_text: `GeneReviews:${chapter.nbkId || chapter.chapterKey}`,
        anchor_source: feature.anchor_source || 'graph_exact_anchor',
        hpo_mapping_trust: feature.hpo_mapping_trust || 'high',
        provenance_url: provenanceUrl
      });
    }
  }
  return rows;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const policyJson = flags.policy || DEFAULTS.policyJson;
  const enrichedDir = flags.input || DEFAULTS.enrichedDir;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const phenotypesJson = flags.phenotypesJson || '';
  const start = Number.parseInt(flags.start || `${DEFAULTS.start}`, 10) || 0;
  const limit = Number.parseInt(flags.limit || `${DEFAULTS.limit}`, 10) || DEFAULTS.limit;
  const minIc = Number.parseFloat(flags.minIc || `${DEFAULTS.minIc}`);
  const sourceKey = flags.sourceKey || DEFAULTS.sourceKey;
  await ensureDir(outputDir);

  const { chapters } = await loadPolicyFile(policyJson);
  const slice = sliceChapters(chapters, start, limit);
  const phenotypeRows = phenotypesJson
    ? (JSON.parse(await fsp.readFile(phenotypesJson, 'utf8')).phenotype_rows || [])
    : await withClient((client) => loadPhenotypeRows(client));
  const ontologyRows = await withClient((client) => loadPhenotypeOntologyRows(client));
  const phenotypeMetaByCurie = new Map(phenotypeRows.map((row) => [row.canonical_curie, row]));
  const ancestorMap = buildAncestorMap(ontologyRows);
  const tracker = createStageTracker(outputDir, 'manifest_progress.json');
  const progress = await tracker.load();
  const manifest = [];
  const reviewQueue = [];
  const extractionSummary = [];

  for (let offset = 0; offset < slice.length; offset += 1) {
    const chapter = slice[offset];
    const absoluteIndex = start + offset;
    const fileStem = chapter.nbkId || toBaseName(chapter, `chapter_${absoluteIndex + 1}`);
    const enrichedPath = path.join(enrichedDir, `${fileStem}_enriched.json`);
    console.log(`[${absoluteIndex + 1}/${chapters.length}] ${chapter.chapterTitle || chapter.chapterKey}`);

    try {
      if (!fs.existsSync(enrichedPath)) {
        throw new Error(`Missing enriched file: ${enrichedPath}`);
      }
      const enriched = JSON.parse(await fsp.readFile(enrichedPath, 'utf8'));
      const cleaned = cleanupFeatures(enriched.features || [], phenotypeMetaByCurie, ancestorMap, minIc);
      const rows = buildManifestRows(chapter, cleaned, sourceKey);

      if (isReviewDecision(chapter)) {
        reviewQueue.push({
          chapter_key: chapter.chapterKey,
          nbk_id: chapter.nbkId || '',
          chapter_title: chapter.chapterTitle || '',
          cleaned_features: cleaned
        });
      } else {
        manifest.push(...rows);
      }

      extractionSummary.push({
        chapter_key: chapter.chapterKey,
        nbk_id: chapter.nbkId || '',
        chapter_title: chapter.chapterTitle || '',
        feature_count_before_cleanup: (enriched.features || []).length,
        feature_count_after_cleanup: cleaned.length,
        metadata_frequency_covered: cleaned.filter((row) => row.frequency_value).length,
        metadata_onset_covered: cleaned.filter((row) => row.onset_hpo_id || row.onset_raw).length,
        candidate_count: null,
        anchor_count: null
      });

      progress.results.push({
        chapterKey: chapter.chapterKey,
        nbkId: chapter.nbkId || '',
        cleanedFeatureCount: cleaned.length,
        manifestRowCount: rows.length,
        reviewDecision: isReviewDecision(chapter)
      });
      progress.total_processed += 1;
      progress.last_index = absoluteIndex;
      progress.last_chapter_key = chapter.chapterKey;
      await tracker.save(progress);
    } catch (error) {
      progress.errors.push({ chapterKey: chapter.chapterKey, nbkId: chapter.nbkId || '', error: error.message || String(error) });
      progress.total_errors += 1;
      progress.last_index = absoluteIndex;
      progress.last_chapter_key = chapter.chapterKey;
      await tracker.save(progress);
      console.error(`  ERROR: ${error.message}`);
    }
  }

  await writeJson(path.join(outputDir, 'genereviews_enrichment_manifest.json'), manifest);
  await writeJson(path.join(outputDir, 'genereviews_review_queue.json'), reviewQueue);
  await writeJson(path.join(outputDir, 'genereviews_extraction_summary.json'), extractionSummary);
  await writeJson(path.join(outputDir, 'manifest_summary.json'), {
    created_at: new Date().toISOString(),
    stage: 'manifest',
    total_processed: progress.total_processed,
    total_errors: progress.total_errors,
    manifest_rows: manifest.length,
    review_rows: reviewQueue.length,
    results: progress.results,
    errors: progress.errors
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

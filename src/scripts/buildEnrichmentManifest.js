import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { withClient } from '../db/pool.js';
import { SERVICE_FLAGS } from '../config/env.js';
import {
  buildAncestorMap,
  buildNormalFindingOverride,
  createStageTracker,
  ensureDir,
  extractGeneSymbolsFromGeneReviewsRawHtml,
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
import {
  buildApiAssertionRows,
  buildChapterExport,
  chapterExportPath
} from '../lib/genereviewsApiExports.js';
import { listCrossSourcePhenotypeConcordance } from '../repositories/clinicalEvidenceRepository.js';

const DEFAULTS = Object.freeze({
  policyJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/data/source-enrichment/genereviews-chapter-policy-template-20260329.json',
  enrichedDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-20260329/stage5_enriched',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-20260329/stage6_manifest',
  verificationDir: '',
  phenotypesJson: '',
  ontologyJson: '',
  clinicalDir: '',
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
    const key = `${feature.hpo_id}::${feature.status || 'present'}`;
    map.set(key, pickRichest(map.get(key), feature));
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
  const kept = new Map(features.map((feature) => [`${feature.hpo_id}::${feature.status || 'present'}`, feature]));
  for (const feature of features) {
    for (const other of features) {
      if (feature.hpo_id === other.hpo_id) continue;
      if ((feature.status || 'present') !== (other.status || 'present')) continue;
      const ancestors = ancestorMap.get(other.hpo_id) || new Set();
      if (!ancestors.has(feature.hpo_id)) continue;
      const mergedChild = pickRichest(other, feature);
      kept.set(`${other.hpo_id}::${other.status || 'present'}`, mergedChild);
      kept.delete(`${feature.hpo_id}::${feature.status || 'present'}`);
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
    const icScore = meta.ic_score == null ? null : Number(meta.ic_score);
    if (icScore != null && Number.isFinite(icScore) && icScore < minIc) return false;
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
        progression_evidence: feature.progression_evidence || null,
        progression_char_start: feature.progression_char_start ?? null,
        progression_char_end: feature.progression_char_end ?? null,
        treatment_response_raw: feature.treatment_response_raw || null,
        treatment_response_evidence: feature.treatment_response_evidence || null,
        treatment_response_char_start: feature.treatment_response_char_start ?? null,
        treatment_response_char_end: feature.treatment_response_char_end ?? null,
        local_clinical_domains: feature.local_clinical_domains || [],
        section_id: feature.section_id || null,
        section_heading: feature.section_heading || null,
        paragraph_id: feature.paragraph_id || null,
        paragraph_char_start: feature.paragraph_char_start ?? null,
        paragraph_char_end: feature.paragraph_char_end ?? null,
        source_sentence: feature.source_sentence || '',
        sentence_id: feature.sentence_id || null,
        sentence_char_start: feature.sentence_char_start ?? null,
        sentence_char_end: feature.sentence_char_end ?? null,
        match_char_start: feature.match_char_start ?? null,
        match_char_end: feature.match_char_end ?? null,
        source_key: sourceKey,
        reference_text: `GeneReviews:${chapter.nbkId || chapter.chapterKey}`,
        anchor_source: feature.anchor_source || 'graph_exact_anchor',
        hpo_mapping_trust: feature.hpo_mapping_trust || 'high',
        provenance_url: provenanceUrl,
        auto_accept_eligible: feature.auto_accept_eligible ?? false,
        auto_accept_reasons: feature.auto_accept_reasons || [],
        verification_verdict: feature.verification_verdict || null
      });
    }
  }
  return rows;
}

function buildFeatureContractKey(feature) {
  return `${feature.hpo_id}::${feature.status || 'present'}`;
}

function buildVerificationByKey(verificationPayload) {
  return new Map((verificationPayload?.verifications || []).map((item) => [`${item.hpo_id}::${item.status || 'present'}`, item]));
}

function buildHumanReviewQueueItems(features, verificationByKey) {
  return features.map((feature) => {
    const verification = verificationByKey.get(buildFeatureContractKey(feature));
    const review = verification?.human_review || null;
    return {
      hpo_id: feature.hpo_id,
      hpo_label: feature.hpo_label,
      status: feature.status || 'present',
      verdict: feature.verification_verdict || verification?.verdict || null,
      auto_accept_eligible: feature.auto_accept_eligible ?? false,
      auto_accept_reasons: feature.auto_accept_reasons || verification?.auto_accept_reasons || [],
      local_clinical_domains: feature.local_clinical_domains || [],
      section_heading: feature.section_heading || review?.section_heading || null,
      paragraph_id: feature.paragraph_id || review?.paragraph_id || null,
      sentence_id: feature.sentence_id || review?.sentence_id || null,
      source_sentence: feature.source_sentence || review?.sentence_text || '',
      review_href: review?.review_href || null,
      hosted_review_href: review?.hosted_review_href || null,
      review_id: review?.review_id || null,
      failed_checks: review?.failed_checks || [],
      flagged_checks: review?.flagged_checks || [],
      spans: review?.spans || []
    };
  });
}

function applyVerificationContract(features, verificationPayload) {
  const verificationByKey = buildVerificationByKey(verificationPayload);
  return features.map((feature) => {
    const verification = verificationByKey.get(buildFeatureContractKey(feature));
    return {
      ...feature,
      auto_accept_eligible: verification?.auto_accept_eligible ?? false,
      auto_accept_reasons: verification?.auto_accept_reasons || (verification ? [] : ['verification_missing']),
      verification_verdict: verification?.verdict || null,
      review_href: verification?.human_review?.review_href || null,
      review_id: verification?.human_review?.review_id || null
    };
  });
}

function resolveChapterMetadata(chapter, enriched, verificationPayload) {
  return {
    ...chapter,
    nbkId: enriched?.nbk_id || verificationPayload?.nbk_id || chapter.nbkId || '',
    chapterTitle: enriched?.chapter_title || verificationPayload?.chapter_title || chapter.chapterTitle || ''
  };
}

async function loadSnapshotRows(filePath, preferredKey) {
  const payload = JSON.parse(await fsp.readFile(filePath, 'utf8'));
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[preferredKey])) return payload[preferredKey];
  if (Array.isArray(payload?.rows)) return payload.rows;
  throw new Error(`Snapshot file ${filePath} does not contain an array under "${preferredKey}" or "rows".`);
}

function buildConcordanceKey(diseaseCurie, phenotypeCurie, status) {
  return `${String(diseaseCurie || '').trim()}::${String(phenotypeCurie || '').trim()}::${String(status || 'present').trim()}`;
}

function candidateStage1RawHtmlPaths(clinicalDir, chapter, fileStem) {
  if (!clinicalDir) return [];
  const candidates = [
    fileStem,
    chapter.nbkId || '',
    toBaseName(chapter, ''),
    toBaseName({ chapterTitle: chapter.chapterTitle }, '')
  ].filter(Boolean);
  return [...new Set(candidates)].map((base) => path.join(clinicalDir, `${base}_raw.html`));
}

function candidateStage1StructurePaths(clinicalDir, chapter, fileStem) {
  if (!clinicalDir) return [];
  const candidates = [
    fileStem,
    chapter.nbkId || '',
    toBaseName(chapter, ''),
    toBaseName({ chapterTitle: chapter.chapterTitle }, '')
  ].filter(Boolean);
  return [...new Set(candidates)].map((base) => path.join(clinicalDir, `${base}_clinical_structure.json`));
}

async function loadChapterGeneSymbols(clinicalDir, chapter, fileStem) {
  for (const filePath of candidateStage1RawHtmlPaths(clinicalDir, chapter, fileStem)) {
    if (!fs.existsSync(filePath)) continue;
    const rawHtml = await fsp.readFile(filePath, 'utf8');
    const geneSymbols = extractGeneSymbolsFromGeneReviewsRawHtml(rawHtml);
    if (geneSymbols.length) {
      return geneSymbols;
    }
  }
  return [];
}

async function loadChapterDomains(clinicalDir, chapter, fileStem) {
  for (const filePath of candidateStage1StructurePaths(clinicalDir, chapter, fileStem)) {
    if (!fs.existsSync(filePath)) continue;
    const structure = JSON.parse(await fsp.readFile(filePath, 'utf8'));
    return {
      chapterDomains: Array.isArray(structure?.chapter_domains) ? structure.chapter_domains : [],
      headingInventory: Array.isArray(structure?.heading_inventory) ? structure.heading_inventory : [],
      clinicalStructure: structure
    };
  }
  return {
    chapterDomains: [],
    headingInventory: [],
    clinicalStructure: null
  };
}

function attachLocalClinicalDomains(features, clinicalStructure) {
  const paragraphDomainMap = new Map(
    (clinicalStructure?.paragraphs || []).map((paragraph) => [paragraph.paragraph_id, paragraph.local_clinical_domains || []])
  );
  return (features || []).map((feature) => ({
    ...feature,
    local_clinical_domains:
      Array.isArray(feature.local_clinical_domains) && feature.local_clinical_domains.length
        ? feature.local_clinical_domains
        : paragraphDomainMap.get(feature.paragraph_id) || []
  }));
}

async function buildCrossSourceConcordanceMap(chapter, features, sourceKey) {
  if (!SERVICE_FLAGS.hasDatabase) {
    return new Map();
  }
  const diseaseContexts = [];
  const policyTargets = Array.isArray(chapter?.policy?.diseaseTargets) ? chapter.policy.diseaseTargets : [];
  for (const target of policyTargets) {
    if (target.disease_curie || target.diseaseCurie) {
      diseaseContexts.push(String(target.disease_curie || target.diseaseCurie || '').trim());
    }
  }
  if (chapter.rosterMappedDiseaseCurie) {
    diseaseContexts.push(String(chapter.rosterMappedDiseaseCurie).trim());
  }
  const uniqueDiseaseCuries = [...new Set(diseaseContexts.filter(Boolean))];
  if (!uniqueDiseaseCuries.length || !features.length) {
    return new Map();
  }

  const pairs = [];
  for (const diseaseCurie of uniqueDiseaseCuries) {
    for (const feature of features) {
      if (!feature.hpo_id) continue;
      pairs.push({
        diseaseCurie,
        phenotypeCurie: feature.hpo_id,
        presenceStatus: feature.status === 'excluded' ? 'absent' : 'present'
      });
    }
  }
  if (!pairs.length) return new Map();

  const rows = await withClient((client) =>
    listCrossSourcePhenotypeConcordance(client, pairs, {
      excludeSourceKeys: [sourceKey, 'phenotype_propagation']
    })
  );

  const map = new Map();
  for (const row of rows) {
    const key = buildConcordanceKey(
      row.diseaseCurie,
      row.phenotypeCurie,
      row.presenceStatus === 'absent' ? 'excluded' : 'present'
    );
    const existing = map.get(key) || [];
    if (!existing.includes(row.sourceKey)) {
      existing.push(row.sourceKey);
      map.set(key, existing);
    }
  }
  return map;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const policyJson = flags.policy || DEFAULTS.policyJson;
  const enrichedDir = flags.input || DEFAULTS.enrichedDir;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const verificationDir = flags.verificationDir || DEFAULTS.verificationDir;
  const phenotypesJson = flags.phenotypesJson || DEFAULTS.phenotypesJson;
  const ontologyJson = flags.ontologyJson || DEFAULTS.ontologyJson;
  const clinicalDir = flags.clinicalDir || DEFAULTS.clinicalDir;
  const start = Number.parseInt(flags.start || `${DEFAULTS.start}`, 10) || 0;
  const limit = Number.parseInt(flags.limit || `${DEFAULTS.limit}`, 10) || DEFAULTS.limit;
  const minIc = Number.parseFloat(flags.minIc || `${DEFAULTS.minIc}`);
  const sourceKey = flags.sourceKey || DEFAULTS.sourceKey;
  const noResume = Boolean(flags.noResume);
  await ensureDir(outputDir);
  await ensureDir(path.join(outputDir, 'api_exports'));

  const { chapters } = await loadPolicyFile(policyJson);
  const slice = sliceChapters(chapters, start, limit);
  const phenotypeRows = phenotypesJson
    ? await loadSnapshotRows(phenotypesJson, 'phenotype_rows')
    : await withClient((client) => loadPhenotypeRows(client));
  const ontologyRows = ontologyJson
    ? await loadSnapshotRows(ontologyJson, 'ontology_rows')
    : await withClient((client) => loadPhenotypeOntologyRows(client));
  const phenotypeMetaByCurie = new Map(phenotypeRows.map((row) => [row.canonical_curie, row]));
  const ancestorMap = buildAncestorMap(ontologyRows);
  const tracker = createStageTracker(outputDir, 'manifest_progress.json');
  const progress = noResume
    ? {
        total_processed: 0,
        total_errors: 0,
        last_index: -1,
        last_chapter_key: null,
        results: [],
        errors: []
      }
    : await tracker.load();
  const manifest = [];
  const reviewQueue = [];
  const extractionSummary = [];
  const apiAssertions = [];
  const apiChapterIndex = [];

  for (let offset = 0; offset < slice.length; offset += 1) {
    const chapter = slice[offset];
    const absoluteIndex = start + offset;
    const fileStem = chapter.nbkId || toBaseName(chapter, `chapter_${absoluteIndex + 1}`);
    const enrichedPath = path.join(enrichedDir, `${fileStem}_enriched.json`);
    const verificationPath = verificationDir ? path.join(verificationDir, `${fileStem}_verification.json`) : '';
    console.log(`[${absoluteIndex + 1}/${chapters.length}] ${chapter.chapterTitle || chapter.chapterKey}`);

    try {
      if (!fs.existsSync(enrichedPath)) {
        throw new Error(`Missing enriched file: ${enrichedPath}`);
      }
      const enriched = JSON.parse(await fsp.readFile(enrichedPath, 'utf8'));
      const cleaned = cleanupFeatures(enriched.features || [], phenotypeMetaByCurie, ancestorMap, minIc);
      const verificationPayload =
        verificationPath && fs.existsSync(verificationPath)
          ? JSON.parse(await fsp.readFile(verificationPath, 'utf8'))
          : null;
      const resolvedChapter = resolveChapterMetadata(chapter, enriched, verificationPayload);
      resolvedChapter.geneSymbols = await loadChapterGeneSymbols(clinicalDir, resolvedChapter, fileStem);
      const chapterStructureSignals = await loadChapterDomains(clinicalDir, resolvedChapter, fileStem);
      resolvedChapter.chapterDomains = chapterStructureSignals.chapterDomains;
      resolvedChapter.headingInventory = chapterStructureSignals.headingInventory;
      const verificationByKey = buildVerificationByKey(verificationPayload);
      const featuresWithDomains = attachLocalClinicalDomains(cleaned, chapterStructureSignals.clinicalStructure);
      const featuresWithContract = applyVerificationContract(featuresWithDomains, verificationPayload);
      const eligibleFeatures = featuresWithContract.filter((feature) => feature.auto_accept_eligible);
      const reviewFeatures = featuresWithContract.filter((feature) => !feature.auto_accept_eligible);
      const eligibleRows = buildManifestRows(resolvedChapter, eligibleFeatures, sourceKey);
      const concordanceMap = await buildCrossSourceConcordanceMap(resolvedChapter, featuresWithContract, sourceKey);
      const chapterAssertions = buildApiAssertionRows({
        chapter: resolvedChapter,
        features: featuresWithContract,
        verificationByKey,
        sourceKey,
        concordanceMap
      });
      const chapterApiExport = buildChapterExport({
        chapter: resolvedChapter,
        assertions: chapterAssertions
      });
      const requiresReview = isReviewDecision(resolvedChapter);
      const routedToReview = requiresReview || !verificationPayload || reviewFeatures.length > 0;

      if (requiresReview) {
        reviewQueue.push({
          chapter_key: resolvedChapter.chapterKey,
          nbk_id: resolvedChapter.nbkId || '',
          chapter_title: resolvedChapter.chapterTitle || '',
          review_page_path: verificationPayload?.review_page_path || null,
          review_items: buildHumanReviewQueueItems(featuresWithContract, verificationByKey),
          cleaned_features: featuresWithContract,
          review_reason: 'policy_review_required'
        });
      } else {
        if (!verificationPayload) {
          reviewQueue.push({
            chapter_key: resolvedChapter.chapterKey,
            nbk_id: resolvedChapter.nbkId || '',
            chapter_title: resolvedChapter.chapterTitle || '',
            review_page_path: null,
            review_items: buildHumanReviewQueueItems(featuresWithContract, verificationByKey),
            cleaned_features: featuresWithContract,
            review_reason: 'verification_required_for_auto_accept'
          });
        } else {
          manifest.push(...eligibleRows);
          if (reviewFeatures.length) {
            reviewQueue.push({
              chapter_key: resolvedChapter.chapterKey,
              nbk_id: resolvedChapter.nbkId || '',
              chapter_title: resolvedChapter.chapterTitle || '',
              review_page_path: verificationPayload?.review_page_path || null,
              review_items: buildHumanReviewQueueItems(reviewFeatures, verificationByKey),
              cleaned_features: reviewFeatures,
              review_reason: 'auto_accept_contract_failed'
            });
          }
        }
      }

      extractionSummary.push({
        chapter_key: resolvedChapter.chapterKey,
        nbk_id: resolvedChapter.nbkId || '',
        chapter_title: resolvedChapter.chapterTitle || '',
        feature_count_before_cleanup: (enriched.features || []).length,
        feature_count_after_cleanup: featuresWithContract.length,
        metadata_frequency_covered: featuresWithContract.filter((row) => row.frequency_value).length,
        metadata_onset_covered: featuresWithContract.filter((row) => row.onset_hpo_id || row.onset_raw).length,
        auto_accept_eligible_count: featuresWithContract.filter((row) => row.auto_accept_eligible).length,
        candidate_count: null,
        anchor_count: null
      });
      apiAssertions.push(...chapterAssertions);
      apiChapterIndex.push({
        nbk_id: chapterApiExport.nbk_id,
        chapter_title: chapterApiExport.chapter_title,
        source_url: chapterApiExport.source_url,
        total_assertions: chapterApiExport.total_assertions,
        summary_stats: chapterApiExport.summary_stats
      });
      await writeJson(chapterExportPath(path.join(outputDir, 'api_exports'), fileStem), chapterApiExport);

      progress.results.push({
        chapterKey: resolvedChapter.chapterKey,
        nbkId: resolvedChapter.nbkId || '',
        cleanedFeatureCount: featuresWithContract.length,
        manifestRowCount: requiresReview ? 0 : eligibleRows.length,
        reviewFeatureCount: requiresReview ? featuresWithContract.length : reviewFeatures.length,
        autoAcceptEligibleCount: featuresWithContract.filter((row) => row.auto_accept_eligible).length,
        reviewDecision: routedToReview
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
  await writeJson(path.join(outputDir, 'api_exports', 'genereviews_api_assertions.json'), apiAssertions);
  await fsp.writeFile(
    path.join(outputDir, 'api_exports', 'genereviews_api_assertions.jsonl'),
    `${apiAssertions.map((row) => JSON.stringify(row)).join('\n')}${apiAssertions.length ? '\n' : ''}`
  );
  await writeJson(path.join(outputDir, 'api_exports', 'genereviews_api_chapters.json'), apiChapterIndex);
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

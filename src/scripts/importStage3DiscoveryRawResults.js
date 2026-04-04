import path from 'node:path';
import fsp from 'node:fs/promises';
import {
  ensureDir,
  parseArgs,
  writeJson
} from '../lib/genereviewsPipeline.js';
import {
  candidateMatches,
  dedupeGroundedCandidates,
  normalizeText,
  validateGroundedCandidate
} from '../lib/stage3DiscoveryGroundedEval.js';

const DEFAULTS = Object.freeze({
  auditCache:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealAuditCacheLatest10.json',
  rawResults:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_real_latest10_medgemma_clinician_20260402/medgemma_real_latest10_raw_results.json',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_real_latest10_imported_raw_20260404'
});

async function loadJson(filePath) {
  return JSON.parse(await fsp.readFile(filePath, 'utf8'));
}

function buildSentenceMap(clinicalStructure) {
  const direct = Array.isArray(clinicalStructure?.sentences) ? clinicalStructure.sentences : [];
  if (direct.length) {
    return new Map(
      direct
        .map((sentence) => [sentence?.sentence_id, sentence?.text])
        .filter(([sentenceId, text]) => sentenceId && typeof text === 'string')
    );
  }

  return new Map(
    (clinicalStructure?.paragraphs || []).flatMap((paragraph) =>
      Array.isArray(paragraph?.sentences)
        ? paragraph.sentences
            .map((sentence) => [sentence?.sentence_id, sentence?.text])
            .filter(([sentenceId, text]) => sentenceId && typeof text === 'string')
        : []
    )
  );
}

function anchorMatchesText(anchor, text) {
  if (!text) return false;
  if (
    candidateMatches(
      { label: text, status: anchor.status || 'present' },
      { label: anchor.hpo_label, status: anchor.status || 'present' }
    )
  ) {
    return true;
  }

  return (anchor.occurrences || []).some((occurrence) =>
    candidateMatches(
      { label: text, status: occurrence.status || anchor.status || 'present' },
      { label: occurrence.match_text, status: occurrence.status || anchor.status || 'present' }
    )
  );
}

function classifyPredictions(predictions, anchors, sentenceMap) {
  const validations = predictions.map((prediction) => ({
    prediction,
    ...validateGroundedCandidate(
      {
        clinical_structure: {
          paragraphs: [],
          sentences: [...sentenceMap.entries()].map(([sentence_id, text]) => ({ sentence_id, text }))
        }
      },
      prediction
    )
  }));

  const duplicateAnchorLeaks = predictions.filter((prediction) =>
    anchors.some((anchor) => anchorMatchesText(anchor, prediction.evidence_text || prediction.label))
  );
  const nonduplicatePredictions = predictions.filter((prediction) => !duplicateAnchorLeaks.includes(prediction));

  return {
    grounding: {
      total: validations.length,
      valid_sentence_id: validations.filter((item) => item.validSentenceId).length,
      valid_evidence_text: validations.filter((item) => item.validEvidenceText).length,
      valid_grounding: validations.filter((item) => item.validGrounding).length
    },
    duplicate_anchor_leaks: duplicateAnchorLeaks,
    nonduplicate_predictions: nonduplicatePredictions
  };
}

function normalizeAnchorLeak(prediction) {
  return {
    label: prediction.label,
    status: prediction.status,
    sentence_id: prediction.sentence_id,
    evidence_text: prediction.evidence_text,
    normalized_evidence: normalizeText(prediction.evidence_text || prediction.label)
  };
}

function buildSummary(chapterReports, auditCachePath, rawResultsPath) {
  const summary = {
    created_at: new Date().toISOString(),
    stage: 'stage3_imported_grounded_raw',
    audit_cache_path: auditCachePath,
    raw_results_path: rawResultsPath,
    chapter_count: chapterReports.length,
    prediction_total: chapterReports.reduce((sum, item) => sum + item.prediction_count, 0),
    duplicate_anchor_leak_total: chapterReports.reduce((sum, item) => sum + item.duplicate_anchor_leak_total, 0),
    nonduplicate_prediction_total: chapterReports.reduce((sum, item) => sum + item.nonduplicate_prediction_total, 0),
    grounding: {
      total: chapterReports.reduce((sum, item) => sum + item.grounding.total, 0),
      valid_sentence_id: chapterReports.reduce((sum, item) => sum + item.grounding.valid_sentence_id, 0),
      valid_evidence_text: chapterReports.reduce((sum, item) => sum + item.grounding.valid_evidence_text, 0),
      valid_grounding: chapterReports.reduce((sum, item) => sum + item.grounding.valid_grounding, 0)
    },
    by_chapter: chapterReports.map((item) => ({
      nbk_id: item.nbk_id,
      chapter_key: item.chapter_key,
      prediction_count: item.prediction_count,
      duplicate_anchor_leak_total: item.duplicate_anchor_leak_total,
      nonduplicate_prediction_total: item.nonduplicate_prediction_total,
      valid_grounding: item.grounding.valid_grounding,
      grounding_total: item.grounding.total,
      missing_raw_result: item.missing_raw_result
    }))
  };

  summary.valid_grounding_rate = summary.grounding.total
    ? Number((summary.grounding.valid_grounding / summary.grounding.total).toFixed(4))
    : 1;

  return summary;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const auditCachePath = path.resolve(flags.auditCache || DEFAULTS.auditCache);
  const rawResultsPath = path.resolve(flags.rawResults || DEFAULTS.rawResults);
  const outputDir = path.resolve(flags.output || DEFAULTS.outputDir);

  const auditCache = await loadJson(auditCachePath);
  const rawResults = await loadJson(rawResultsPath);
  const rawById = new Map(
    (Array.isArray(rawResults) ? rawResults : [])
      .map((item) => [String(item?.id || '').trim(), item])
      .filter(([id]) => id)
  );

  const chapterReports = [];

  for (const chapter of auditCache?.chapters || []) {
    const [clinicalStructure, anchorPayload] = await Promise.all([
      loadJson(chapter.structure_path),
      loadJson(chapter.anchors_path)
    ]);

    const sentenceMap = buildSentenceMap(clinicalStructure);
    const rawPredicted = rawById.get(chapter.nbk_id) || null;
    const predictions = dedupeGroundedCandidates(
      Array.isArray(rawPredicted?.predictedCandidates) ? rawPredicted.predictedCandidates : []
    );
    const classified = classifyPredictions(predictions, anchorPayload?.anchors || [], sentenceMap);

    chapterReports.push({
      nbk_id: chapter.nbk_id,
      chapter_key: chapter.chapter_key,
      chapter_title: chapter.chapter_title,
      structure_path: chapter.structure_path,
      anchors_path: chapter.anchors_path,
      anchor_count: Array.isArray(anchorPayload?.anchors) ? anchorPayload.anchors.length : 0,
      prediction_count: predictions.length,
      duplicate_anchor_leak_total: classified.duplicate_anchor_leaks.length,
      nonduplicate_prediction_total: classified.nonduplicate_predictions.length,
      grounding: classified.grounding,
      predictions,
      duplicate_anchor_leaks: classified.duplicate_anchor_leaks.map(normalizeAnchorLeak),
      nonduplicate_predictions: classified.nonduplicate_predictions,
      raw_preview: rawPredicted?.rawPreview || rawPredicted?.raw_preview || null,
      missing_raw_result: !rawPredicted
    });
  }

  const summary = buildSummary(chapterReports, auditCachePath, rawResultsPath);
  await ensureDir(outputDir);
  await writeJson(path.join(outputDir, 'stage3_imported_grounded_raw_summary.json'), summary);
  await writeJson(path.join(outputDir, 'stage3_imported_grounded_raw_report.json'), chapterReports);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

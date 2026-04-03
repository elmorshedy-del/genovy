import path from 'node:path';
import fsp from 'node:fs/promises';
import {
  callGeminiJson,
  ensureDir,
  parseArgs,
  sleep,
  writeJson
} from '../lib/genereviewsPipeline.js';
import {
  candidateMatches,
  dedupeGroundedCandidates,
  normalizeText,
  validateGroundedCandidate
} from '../lib/stage3DiscoveryGroundedEval.js';

const DEFAULTS = Object.freeze({
  manifest:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealHoldoutNext5Manifest.json',
  anchorsDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-review-first-50-20260331/stage2_anchors',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_real_next5_grounded_raw_20260402',
  model: 'gemini-2.5-pro',
  pauseMs: 400,
  thinkingBudget: 1024,
  limit: 0
});

const GROUNDED_DISCOVERY_PROMPT = `You are a clinical genetics expert reading GeneReviews clinical text.

Each input item contains:
- id
- chapter_title
- existing_anchors
- clinical_structure.sentences

TASK:
Find additional phenotype findings that are described in the provided sentences but are NOT already covered by the supplied anchor list.

CRITICAL RULE:
- Extract the evidence phrase exactly as written in the source sentence.
- Do NOT rename, paraphrase, normalize, or map to HPO.

OUTPUT RULES:
1. Return only findings grounded to exactly one provided sentence_id
2. evidence_text must be copied exactly from that sentence
3. label should repeat the exact evidence phrase; do not rewrite it
4. status must be exactly "present" or "excluded"
5. Do NOT return duplicate findings already covered by existing_anchors
6. Do NOT return:
   - inheritance patterns
   - gene names, variants, molecular findings
   - lab tests, assay names, imaging studies, procedures, analytes, or raw measurements
   - treatment, management, devices, feeding routes, supports, or interventions
   - disease labels or syndrome names
   - normal/preserved/intact findings
   - future risk / complication statements unless the phenotype is explicitly asserted as present now
7. Use "excluded" only when an abnormal clinical feature is explicitly said to be absent / not present / not reported / not a feature
8. If uncertain whether something is a true phenotype finding, omit it
9. Prefer omission over speculation

OUTPUT FORMAT (JSON array only):
[
  {
    "id": "case id",
    "predictedCandidates": [
      {
        "label": "exact evidence phrase",
        "status": "present",
        "sentence_id": "p1_s2",
        "evidence_text": "exact evidence phrase"
      }
    ]
  }
]`;

function resolveEnvValue(...names) {
  for (const name of names) {
    if (!name) continue;
    const value = process.env[name];
    if (value) return value;
  }
  return '';
}

async function loadJson(filePath) {
  return JSON.parse(await fsp.readFile(filePath, 'utf8'));
}

async function loadIndexByNbkId(directoryPath) {
  const fileNames = (await fsp.readdir(directoryPath))
    .filter((name) => name.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right));
  const byNbkId = new Map();
  for (const fileName of fileNames) {
    const filePath = path.join(directoryPath, fileName);
    const payload = await loadJson(filePath);
    const nbkId = String(payload?.nbk_id || '').trim();
    if (!nbkId) continue;
    byNbkId.set(nbkId, { filePath, payload });
  }
  return byNbkId;
}

function toExistingAnchors(anchorPayload) {
  return (anchorPayload?.anchors || []).map((anchor) => ({
    hpo_label: anchor.hpo_label,
    match_texts: [...new Set((anchor.occurrences || []).map((occurrence) => occurrence.match_text).filter(Boolean))]
  }));
}

function buildSentenceMap(clinicalStructure) {
  return new Map(
    (clinicalStructure?.paragraphs || []).flatMap((paragraph) =>
      Array.isArray(paragraph?.sentences)
        ? paragraph.sentences
            .map((sentence) => [sentence.sentence_id, sentence.text])
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

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const manifestPath = flags.manifest || DEFAULTS.manifest;
  const anchorsDir = flags.anchors || DEFAULTS.anchorsDir;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const model = flags.model || DEFAULTS.model;
  const pauseMs = Math.max(0, Number.parseInt(flags.pauseMs || `${DEFAULTS.pauseMs}`, 10) || DEFAULTS.pauseMs);
  const thinkingBudget = Number.parseInt(flags.thinkingBudget || `${DEFAULTS.thinkingBudget}`, 10) || 0;
  const limit = Math.max(0, Number.parseInt(flags.limit || `${DEFAULTS.limit}`, 10) || DEFAULTS.limit);
  const apiKey = flags.apiKey || resolveEnvValue(flags.apiKeyEnv, 'GOOGLE_API_KEY', 'GEMINI_API_KEY');

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is required.');
  }

  await ensureDir(outputDir);
  const manifest = await loadJson(manifestPath);
  const anchorIndex = await loadIndexByNbkId(anchorsDir);
  const chapters = limit > 0 ? manifest.chapters.slice(0, limit) : manifest.chapters;
  const chapterReports = [];

  for (let index = 0; index < chapters.length; index += 1) {
    const chapter = chapters[index];
    const anchorEntry = anchorIndex.get(chapter.nbk_id);
    if (!anchorEntry) throw new Error(`Missing anchors for ${chapter.nbk_id}`);

    const clinicalStructure = await loadJson(chapter.structure_path);
    const sentenceMap = buildSentenceMap(clinicalStructure);
    console.log(`[${index + 1}/${chapters.length}] ${chapter.chapter_title}`);
    const { parsed, usage, rawOutput } = await callGeminiJson({
      apiKey,
      model,
      systemPrompt: GROUNDED_DISCOVERY_PROMPT,
      userPayload: {
        cases: [
          {
            id: chapter.nbk_id,
            chapter_title: chapter.chapter_title,
            existing_anchors: toExistingAnchors(anchorEntry.payload),
            clinical_structure: {
              sentences: [...sentenceMap.entries()].map(([sentence_id, text]) => ({
                sentence_id,
                text
              }))
            }
          }
        ]
      },
      temperature: 0.1,
      thinkingBudget
    });

    const parsedBatch = Array.isArray(parsed) ? parsed : [];
    const rawPredicted = parsedBatch.find((item) => item?.id === chapter.nbk_id) || {};
    const predictions = dedupeGroundedCandidates(
      Array.isArray(rawPredicted?.predictedCandidates) ? rawPredicted.predictedCandidates : []
    );

    const classified = classifyPredictions(predictions, anchorEntry.payload.anchors || [], sentenceMap);
    chapterReports.push({
      nbk_id: chapter.nbk_id,
      chapter_key: chapter.chapter_key,
      chapter_title: chapter.chapter_title,
      structure_path: chapter.structure_path,
      anchor_count: Array.isArray(anchorEntry.payload.anchors) ? anchorEntry.payload.anchors.length : 0,
      prediction_count: predictions.length,
      duplicate_anchor_leak_total: classified.duplicate_anchor_leaks.length,
      nonduplicate_prediction_total: classified.nonduplicate_predictions.length,
      grounding: classified.grounding,
      predictions,
      duplicate_anchor_leaks: classified.duplicate_anchor_leaks.map(normalizeAnchorLeak),
      nonduplicate_predictions: classified.nonduplicate_predictions,
      usage,
      raw_output: rawOutput
    });

    if (pauseMs > 0 && index < chapters.length - 1) {
      await sleep(pauseMs);
    }
  }

  const summary = {
    created_at: new Date().toISOString(),
    model,
    manifest_path: manifestPath,
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
      grounding_total: item.grounding.total
    }))
  };
  summary.valid_grounding_rate = summary.grounding.total
    ? Number((summary.grounding.valid_grounding / summary.grounding.total).toFixed(4))
    : 1;

  await writeJson(path.join(outputDir, 'stage3_real_grounded_raw_summary.json'), summary);
  await writeJson(path.join(outputDir, 'stage3_real_grounded_raw_report.json'), chapterReports);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

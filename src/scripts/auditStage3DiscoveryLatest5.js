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
  loadCaseReport,
  normalizeText,
  validateGroundedCandidate
} from '../lib/stage3DiscoveryGroundedEval.js';

const DEFAULTS = Object.freeze({
  realManifest:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealHoldoutManifest.json',
  anchorsDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-latest5-settled-20260330/stage2_anchors',
  verificationDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/bucket-critical/20260331-genereviews-latest5-readiness/stage7_verify_medgemma',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_latest5_grounded_audit_20260402',
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

function toVerificationStatus(rawStatus) {
  return rawStatus === 'excluded' ? 'excluded' : 'present';
}

function anchorMatchesText(anchor, text) {
  if (!text) return false;
  if (candidateMatches({ label: text, status: anchor.status || 'present' }, { label: anchor.hpo_label, status: anchor.status || 'present' })) {
    return true;
  }
  return (anchor.occurrences || []).some((occurrence) =>
    candidateMatches(
      { label: text, status: occurrence.status || anchor.status || 'present' },
      { label: occurrence.match_text, status: occurrence.status || anchor.status || 'present' }
    )
  );
}

function verificationCoveredByAnchors(verification, anchors) {
  return anchors.some((anchor) => {
    if (anchorMatchesText(anchor, verification.match_text)) return true;
    if (anchorMatchesText(anchor, verification.hpo_label)) return true;
    return false;
  });
}

function predictionMatchesVerification(prediction, verification) {
  const expectedStatus = toVerificationStatus(verification.status);
  if (
    candidateMatches(prediction, {
      label: verification.match_text,
      status: expectedStatus
    })
  ) {
    return true;
  }
  if (
    verification?.hpo_label &&
    candidateMatches(prediction, {
      label: verification.hpo_label,
      status: expectedStatus
    })
  ) {
    return true;
  }
  const evidence = normalizeText(prediction.evidence_text || prediction.label);
  const sentence = normalizeText(verification.source_sentence || '');
  const matchText = normalizeText(verification.match_text || '');
  if (!evidence || !sentence) return false;
  return sentence.includes(evidence) && (!matchText || matchText.includes(evidence) || evidence.includes(matchText));
}

function pickMatchedPrediction(predictions, verification) {
  return predictions.find((prediction) => predictionMatchesVerification(prediction, verification)) || null;
}

function summarizeChapterAudit(chapter, predictions, anchors, verificationPayload, sentenceMap) {
  const grounding = predictions.map((prediction) => ({
    prediction,
    ...validateGroundedCandidate(
      { clinical_structure: { paragraphs: [], sentences: [...sentenceMap].map(([sentence_id, text]) => ({ sentence_id, text })) } },
      prediction
    )
  }));
  const verifications = Array.isArray(verificationPayload?.verifications) ? verificationPayload.verifications : [];
  const verified = verifications.filter((item) => item.verdict === 'VERIFIED');
  const failed = verifications.filter((item) => item.verdict === 'FAILED');
  const flagged = verifications.filter((item) => item.verdict === 'FLAGGED');
  const discoveryTargets = verified.filter((item) => !verificationCoveredByAnchors(item, anchors));
  const matchedVerifiedTargets = [];
  const missedVerifiedTargets = [];
  for (const item of discoveryTargets) {
    const matchedPrediction = pickMatchedPrediction(predictions, item);
    if (matchedPrediction) {
      matchedVerifiedTargets.push({
        verification: item,
        prediction: matchedPrediction
      });
    } else {
      missedVerifiedTargets.push(item);
    }
  }

  const duplicateAnchorLeaks = predictions.filter((prediction) =>
    anchors.some((anchor) => anchorMatchesText(anchor, prediction.evidence_text || prediction.label))
  );
  const overlapsFailed = predictions.filter((prediction) =>
    failed.some((item) => predictionMatchesVerification(prediction, item))
  );
  const overlapsFlagged = predictions.filter((prediction) =>
    flagged.some((item) => predictionMatchesVerification(prediction, item))
  );

  const unmatchedPredictions = predictions.filter((prediction) => {
    if (duplicateAnchorLeaks.includes(prediction)) return false;
    if (overlapsFailed.includes(prediction)) return false;
    if (matchedVerifiedTargets.some((match) => match.prediction === prediction)) return false;
    return true;
  });

  return {
    chapter_key: chapter.chapter_key,
    nbk_id: chapter.nbk_id,
    chapter_title: chapter.chapter_title,
    prediction_count: predictions.length,
    grounding: {
      total: grounding.length,
      valid_sentence_id: grounding.filter((item) => item.validSentenceId).length,
      valid_evidence_text: grounding.filter((item) => item.validEvidenceText).length,
      valid_grounding: grounding.filter((item) => item.validGrounding).length
    },
    verification: {
      total: verifications.length,
      verified_total: verified.length,
      failed_total: failed.length,
      flagged_total: flagged.length,
      verified_anchor_covered_total: verified.length - discoveryTargets.length,
      verified_discovery_target_total: discoveryTargets.length,
      matched_verified_target_total: matchedVerifiedTargets.length,
      missed_verified_target_total: missedVerifiedTargets.length
    },
    duplicate_anchor_leak_total: duplicateAnchorLeaks.length,
    overlaps_failed_total: overlapsFailed.length,
    overlaps_flagged_total: overlapsFlagged.length,
    unmatched_prediction_total: unmatchedPredictions.length,
    matched_verified_targets: matchedVerifiedTargets,
    missed_verified_targets: missedVerifiedTargets,
    duplicate_anchor_leaks: duplicateAnchorLeaks,
    overlaps_failed: overlapsFailed,
    overlaps_flagged: overlapsFlagged,
    unmatched_predictions: unmatchedPredictions
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const realManifestPath = flags.manifest || DEFAULTS.realManifest;
  const anchorsDir = flags.anchors || DEFAULTS.anchorsDir;
  const verificationDir = flags.verification || DEFAULTS.verificationDir;
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
  const manifest = await loadJson(realManifestPath);
  const anchorIndex = await loadIndexByNbkId(anchorsDir);
  const verificationIndex = await loadIndexByNbkId(verificationDir);
  const chapters = limit > 0 ? manifest.chapters.slice(0, limit) : manifest.chapters;
  const chapterAudits = [];

  for (let index = 0; index < chapters.length; index += 1) {
    const chapter = chapters[index];
    const anchorEntry = anchorIndex.get(chapter.nbk_id);
    const verificationEntry = verificationIndex.get(chapter.nbk_id);
    if (!anchorEntry) throw new Error(`Missing anchors for ${chapter.nbk_id}`);
    if (!verificationEntry) throw new Error(`Missing verification for ${chapter.nbk_id}`);

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

    const audit = summarizeChapterAudit(
      chapter,
      predictions,
      anchorEntry.payload.anchors || [],
      verificationEntry.payload,
      sentenceMap
    );

    chapterAudits.push({
      ...audit,
      usage,
      raw_output: rawOutput,
      predictions
    });

    if (pauseMs > 0 && index < chapters.length - 1) {
      await sleep(pauseMs);
    }
  }

  const summary = {
    created_at: new Date().toISOString(),
    model,
    chapter_count: chapterAudits.length,
    prediction_total: chapterAudits.reduce((sum, item) => sum + item.prediction_count, 0),
    verified_discovery_target_total: chapterAudits.reduce(
      (sum, item) => sum + item.verification.verified_discovery_target_total,
      0
    ),
    matched_verified_target_total: chapterAudits.reduce(
      (sum, item) => sum + item.verification.matched_verified_target_total,
      0
    ),
    missed_verified_target_total: chapterAudits.reduce(
      (sum, item) => sum + item.verification.missed_verified_target_total,
      0
    ),
    duplicate_anchor_leak_total: chapterAudits.reduce((sum, item) => sum + item.duplicate_anchor_leak_total, 0),
    overlaps_failed_total: chapterAudits.reduce((sum, item) => sum + item.overlaps_failed_total, 0),
    overlaps_flagged_total: chapterAudits.reduce((sum, item) => sum + item.overlaps_flagged_total, 0),
    unmatched_prediction_total: chapterAudits.reduce((sum, item) => sum + item.unmatched_prediction_total, 0),
    grounding: {
      total: chapterAudits.reduce((sum, item) => sum + item.grounding.total, 0),
      valid_sentence_id: chapterAudits.reduce((sum, item) => sum + item.grounding.valid_sentence_id, 0),
      valid_evidence_text: chapterAudits.reduce((sum, item) => sum + item.grounding.valid_evidence_text, 0),
      valid_grounding: chapterAudits.reduce((sum, item) => sum + item.grounding.valid_grounding, 0)
    },
    by_chapter: chapterAudits.map((item) => ({
      chapter_key: item.chapter_key,
      nbk_id: item.nbk_id,
      prediction_count: item.prediction_count,
      verified_discovery_target_total: item.verification.verified_discovery_target_total,
      matched_verified_target_total: item.verification.matched_verified_target_total,
      missed_verified_target_total: item.verification.missed_verified_target_total,
      duplicate_anchor_leak_total: item.duplicate_anchor_leak_total,
      overlaps_failed_total: item.overlaps_failed_total,
      overlaps_flagged_total: item.overlaps_flagged_total,
      unmatched_prediction_total: item.unmatched_prediction_total
    }))
  };
  summary.verified_discovery_target_recall = summary.verified_discovery_target_total
    ? Number((summary.matched_verified_target_total / summary.verified_discovery_target_total).toFixed(4))
    : 1;
  summary.valid_grounding_rate = summary.grounding.total
    ? Number((summary.grounding.valid_grounding / summary.grounding.total).toFixed(4))
    : 1;

  await writeJson(path.join(outputDir, 'latest5_direct_grounded_audit_summary.json'), summary);
  await writeJson(path.join(outputDir, 'latest5_direct_grounded_audit_report.json'), chapterAudits);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

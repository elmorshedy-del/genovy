import path from 'node:path';
import fsp from 'node:fs/promises';
import vm from 'node:vm';
import {
  callGeminiJson,
  ensureDir,
  parseArgs,
  sleep,
  writeJson
} from '../lib/genereviewsPipeline.js';

const DEFAULTS = Object.freeze({
  benchmark: '/Users/ahmedelmorshedy/Downloads/anchor_benchmark (1).js',
  stage2Report:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage2_anchor_gemini_probe_full_20260402/stage2_anchor_gemini_report.json',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage2_flash_stack_probe_20260402',
  model: 'gemini-2.5-flash',
  batchSize: 8,
  pauseMs: 400,
  thinkingBudget: 0
});

const ASSERTION_PROMPT = `You are evaluating the truth status of already-detected phenotype anchors from biomedical sentences.

Each case contains:
- id
- label
- sentence
- modelStatus
- matchedText

Your task:
Classify the final anchor status for each case using exactly one of:
- "present" = keep as a positive phenotype finding
- "excluded" = keep, but mark as explicitly absent / not present
- "rejected" = do not keep as a phenotype anchor because the sentence is normal/preserved, conditional/risk-only, diagnosis-context only, or otherwise not asserting the phenotype as part of the disease

Rules:
1. If the sentence clearly says the finding is absent, not observed, not reported, ruled out, or not a feature, output "excluded".
2. If the sentence says the feature is normal, preserved, intact, unaffected, maintained, unremarkable, or within the reference range, output "rejected".
3. If the sentence is only about risk, predisposition, susceptibility, possible future development, unclear modifier effects, or whether a subgroup may develop something, output "rejected".
4. If the sentence is mainly naming a disease/disorder/diagnostic category rather than asserting the phenotype as a finding, output "rejected".
5. If the label itself is an abnormal phenotype that uses absence/loss/lack language, and the sentence describes that abnormal state as truly present, output "present".
6. Respect modelStatus:
   - if modelStatus is "excluded" and the sentence supports exclusion, keep outcome "excluded" and origin "model_excluded"
   - otherwise infer from the sentence

Return JSON only as an array. One object per input item in the same order.

Each object must be:
{
  "id": "case id",
  "predictedOutcome": "present|excluded|rejected",
  "predictedOrigin": "default_present|sentence_negation_inferred|model_excluded",
  "predictedReason": "explicit_negative_local_context|normal_or_preserved_context|conditional_or_risk_context|diagnosis_only_context|null",
  "confidence": 0.0
}

Reason mapping:
- excluded from sentence-level negation => origin "sentence_negation_inferred", reason "explicit_negative_local_context"
- excluded because input modelStatus is already excluded and sentence supports that => origin "model_excluded", reason "explicit_negative_local_context"
- rejected because preserved/normal => origin "default_present", reason "normal_or_preserved_context"
- rejected because risk/conditional => origin "default_present", reason "conditional_or_risk_context"
- rejected because diagnosis-only context => origin "default_present", reason "diagnosis_only_context"
- present => origin "default_present", reason null

Do not add any explanation text.`;

const DISEASE_NAME_BLOCKERS = Object.freeze([
  {
    reason: 'type_number_disease_context',
    sentence: /\btype\s+\d+\b/i,
    span: /ataxia/i
  },
  {
    reason: 'classified_under_context',
    sentence: /\bclassified under\b/i
  },
  {
    reason: 'gene_cause_context',
    sentence: /\bpathogenic variants? in\b/i
  },
  {
    reason: 'cause_of_diagnosis_context',
    sentence: /\bmost common cause of\b/i,
    span: /\bhearing loss\b/i
  }
]);

function resolveEnvValue(...names) {
  for (const name of names) {
    if (!name) continue;
    const value = process.env[name];
    if (value) return value;
  }
  return '';
}

async function loadAnchorCases(filePath) {
  const raw = await fsp.readFile(filePath, 'utf8');
  const sandbox = {
    module: { exports: {} },
    exports: {}
  };
  vm.createContext(sandbox);
  vm.runInContext(`${raw}\nthis.__cases = module.exports?.ANCHOR_BENCHMARK || ANCHOR_BENCHMARK || null;`, sandbox, {
    timeout: 1000,
    filename: filePath
  });
  const loaded = sandbox.__cases;
  if (!Array.isArray(loaded)) {
    throw new Error(`Failed to load ANCHOR_BENCHMARK from ${filePath}`);
  }
  return loaded;
}

async function loadStage2Report(filePath) {
  return JSON.parse(await fsp.readFile(filePath, 'utf8'));
}

function chunk(items, size) {
  const output = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

function normalizeText(value) {
  return `${value || ''}`
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function textsComparable(left, right) {
  const leftNorm = normalizeText(left);
  const rightNorm = normalizeText(right);
  if (!leftNorm || !rightNorm) return false;
  return leftNorm === rightNorm || leftNorm.includes(rightNorm) || rightNorm.includes(leftNorm);
}

function compareAnchors(expectedCase, predictedCase) {
  const expectedAnchors = Array.isArray(expectedCase.expectedAnchors) ? expectedCase.expectedAnchors : [];
  const expectedRejected = Array.isArray(expectedCase.expectedRejected) ? expectedCase.expectedRejected : [];
  const predictedAnchors = Array.isArray(predictedCase?.predictedAnchors) ? predictedCase.predictedAnchors : [];

  const consumed = new Set();
  const matchedExpectedAnchors = [];
  const missedExpectedAnchors = [];

  for (const expectedAnchor of expectedAnchors) {
    let foundIndex = -1;
    let foundAnchor = null;
    for (let index = 0; index < predictedAnchors.length; index += 1) {
      if (consumed.has(index)) continue;
      const predictedAnchor = predictedAnchors[index];
      if ((predictedAnchor.status || 'present') !== (expectedAnchor.status || 'present')) continue;
      if (
        textsComparable(predictedAnchor.match_text, expectedAnchor.match_text) ||
        textsComparable(predictedAnchor.hpo_label, expectedAnchor.hpo_label) ||
        textsComparable(predictedAnchor.match_text, expectedAnchor.hpo_label)
      ) {
        foundIndex = index;
        foundAnchor = predictedAnchor;
        break;
      }
    }
    if (foundIndex >= 0) {
      consumed.add(foundIndex);
      matchedExpectedAnchors.push({ expected: expectedAnchor, predicted: foundAnchor });
    } else {
      missedExpectedAnchors.push(expectedAnchor);
    }
  }

  const mustNotAnchorViolations = [];
  for (const rejected of expectedRejected) {
    const violation = predictedAnchors.find((predictedAnchor, index) => {
      if (consumed.has(index)) return false;
      return (
        textsComparable(predictedAnchor.match_text, rejected.label) ||
        textsComparable(predictedAnchor.hpo_label, rejected.label)
      );
    });
    if (violation) {
      mustNotAnchorViolations.push({
        label: rejected.label,
        reason: rejected.reason,
        predicted_anchor: violation
      });
    }
  }

  const unexpectedPredictedAnchors = predictedAnchors.filter((_, index) => !consumed.has(index));

  return {
    matchedExpectedAnchors,
    missedExpectedAnchors,
    mustNotAnchorViolations,
    unexpectedPredictedAnchors,
    exactCaseMatch:
      missedExpectedAnchors.length === 0 &&
      mustNotAnchorViolations.length === 0 &&
      unexpectedPredictedAnchors.length === 0
  };
}

function buildSummary(cases, predictionsById) {
  const summary = {
    total: cases.length,
    exactMatchCount: 0,
    expectedAnchorTotal: 0,
    matchedExpectedAnchorTotal: 0,
    mustNotAnchorTotal: 0,
    mustNotAnchorViolationTotal: 0,
    byCategory: {}
  };

  for (const item of cases) {
    const predicted = predictionsById.get(item.id) || { predictedAnchors: [] };
    const comparison = compareAnchors(item, predicted);
    summary.expectedAnchorTotal += (item.expectedAnchors || []).length;
    summary.matchedExpectedAnchorTotal += comparison.matchedExpectedAnchors.length;
    summary.mustNotAnchorTotal += (item.expectedRejected || []).length;
    summary.mustNotAnchorViolationTotal += comparison.mustNotAnchorViolations.length;
    if (comparison.exactCaseMatch) summary.exactMatchCount += 1;

    const category = item.category || 'unknown';
    const bucket = summary.byCategory[category] || {
      total: 0,
      exactMatchCount: 0,
      expectedAnchorTotal: 0,
      matchedExpectedAnchorTotal: 0,
      mustNotAnchorTotal: 0,
      mustNotAnchorViolationTotal: 0
    };

    bucket.total += 1;
    if (comparison.exactCaseMatch) bucket.exactMatchCount += 1;
    bucket.expectedAnchorTotal += (item.expectedAnchors || []).length;
    bucket.matchedExpectedAnchorTotal += comparison.matchedExpectedAnchors.length;
    bucket.mustNotAnchorTotal += (item.expectedRejected || []).length;
    bucket.mustNotAnchorViolationTotal += comparison.mustNotAnchorViolations.length;
    summary.byCategory[category] = bucket;
  }

  summary.exactMatchRate = summary.total ? Number((summary.exactMatchCount / summary.total).toFixed(4)) : 0;
  summary.anchorRecall = summary.expectedAnchorTotal
    ? Number((summary.matchedExpectedAnchorTotal / summary.expectedAnchorTotal).toFixed(4))
    : 0;
  summary.mustNotAnchorPassRate = summary.mustNotAnchorTotal
    ? Number(((summary.mustNotAnchorTotal - summary.mustNotAnchorViolationTotal) / summary.mustNotAnchorTotal).toFixed(4))
    : 1;

  for (const bucket of Object.values(summary.byCategory)) {
    bucket.exactMatchRate = bucket.total ? Number((bucket.exactMatchCount / bucket.total).toFixed(4)) : 0;
    bucket.anchorRecall = bucket.expectedAnchorTotal
      ? Number((bucket.matchedExpectedAnchorTotal / bucket.expectedAnchorTotal).toFixed(4))
      : 0;
    bucket.mustNotAnchorPassRate = bucket.mustNotAnchorTotal
      ? Number(((bucket.mustNotAnchorTotal - bucket.mustNotAnchorViolationTotal) / bucket.mustNotAnchorTotal).toFixed(4))
      : 1;
  }

  return summary;
}

function applyDiseaseNameBlocker(anchor, sentence) {
  const matchText = `${anchor?.match_text || ''}`;
  const sentenceText = `${sentence || ''}`;
  for (const rule of DISEASE_NAME_BLOCKERS) {
    if (!rule.sentence.test(sentenceText)) continue;
    if (rule.span && !rule.span.test(matchText)) continue;
    return {
      blocked: true,
      reason: rule.reason
    };
  }
  return {
    blocked: false,
    reason: null
  };
}

function buildAssertionCases(rawCases) {
  const assertionCases = [];
  for (const rawCase of rawCases) {
    const keptAnchors = [];
    const droppedByBlocker = [];
    const predictedAnchors = Array.isArray(rawCase.predictedAnchors) ? rawCase.predictedAnchors : [];
    for (const anchor of predictedAnchors) {
      const decision = applyDiseaseNameBlocker(anchor, rawCase.sentence);
      if (decision.blocked) {
        droppedByBlocker.push({
          anchor,
          reason: decision.reason
        });
        continue;
      }
      keptAnchors.push(anchor);
      assertionCases.push({
        id: `${rawCase.id}__${keptAnchors.length - 1}`,
        parentCaseId: rawCase.id,
        label: anchor.hpo_label || anchor.match_text || '',
        sentence: rawCase.sentence,
        modelStatus: anchor.status || 'present',
        matchedText: anchor.match_text || '',
        currentAnchor: anchor
      });
    }
    rawCase._keptAnchors = keptAnchors;
    rawCase._droppedByBlocker = droppedByBlocker;
  }
  return assertionCases;
}

async function runAssertionPass({ cases, model, apiKey, batchSize, pauseMs, thinkingBudget }) {
  const batches = chunk(cases, batchSize);
  const predictions = [];
  const batchReports = [];

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    console.log(`Gemini assertion batch ${index + 1}/${batches.length} (${batch.length} anchors)`);
    const { parsed, usage, rawOutput } = await callGeminiJson({
      apiKey,
      model,
      systemPrompt: ASSERTION_PROMPT,
      userPayload: {
        batch_index: index + 1,
        anchors: batch.map((item) => ({
          id: item.id,
          label: item.label,
          sentence: item.sentence,
          modelStatus: item.modelStatus,
          matchedText: item.matchedText
        }))
      },
      temperature: 0,
      thinkingBudget
    });

    const parsedBatch = Array.isArray(parsed) ? parsed : [];
    predictions.push(...parsedBatch);
    batchReports.push({
      batchIndex: index + 1,
      anchorIds: batch.map((item) => item.id),
      usage,
      rawOutput,
      parsedCount: parsedBatch.length
    });

    if (pauseMs > 0 && index < batches.length - 1) {
      await sleep(pauseMs);
    }
  }

  return {
    predictions,
    batchReports
  };
}

function buildFinalPredictionMap(rawCases, assertionPredictionsById) {
  const predictionsById = new Map();

  for (const rawCase of rawCases) {
    const finalAnchors = [];
    for (let index = 0; index < rawCase._keptAnchors.length; index += 1) {
      const anchor = rawCase._keptAnchors[index];
      const assertionId = `${rawCase.id}__${index}`;
      const prediction = assertionPredictionsById.get(assertionId);
      if (!prediction) {
        finalAnchors.push(anchor);
        continue;
      }
      if (prediction.predictedOutcome === 'rejected') continue;
      finalAnchors.push({
        ...anchor,
        status: prediction.predictedOutcome === 'excluded' ? 'excluded' : 'present',
        assertion_origin: prediction.predictedOrigin || null,
        assertion_reason: prediction.predictedReason ?? null,
        assertion_confidence: prediction.confidence ?? null
      });
    }
    predictionsById.set(rawCase.id, {
      predictedAnchors: finalAnchors,
      droppedByBlocker: rawCase._droppedByBlocker
    });
  }

  return predictionsById;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const benchmark = flags.benchmark || DEFAULTS.benchmark;
  const stage2Report = flags.report || DEFAULTS.stage2Report;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const model = flags.model || DEFAULTS.model;
  const batchSize = Math.max(1, Number.parseInt(flags.batchSize || `${DEFAULTS.batchSize}`, 10) || DEFAULTS.batchSize);
  const pauseMs = Math.max(0, Number.parseInt(flags.pauseMs || `${DEFAULTS.pauseMs}`, 10) || DEFAULTS.pauseMs);
  const thinkingBudget = Number.parseInt(flags.thinkingBudget || `${DEFAULTS.thinkingBudget}`, 10) || 0;
  const apiKey = flags.apiKey || resolveEnvValue(flags.apiKeyEnv, 'GOOGLE_API_KEY', 'GEMINI_API_KEY');

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is required.');
  }

  await ensureDir(outputDir);
  const benchmarkCases = await loadAnchorCases(benchmark);
  const stage2 = await loadStage2Report(stage2Report);
  const stage2Cases = Array.isArray(stage2?.cases) ? stage2.cases : [];
  const stage2ById = new Map(stage2Cases.map((item) => [item.id, item]));
  const rawCases = benchmarkCases.map((item) => {
    const predicted = stage2ById.get(item.id);
    return {
      ...item,
      predictedAnchors: Array.isArray(predicted?.predictedAnchors) ? predicted.predictedAnchors : []
    };
  });

  const assertionCases = buildAssertionCases(rawCases);
  const { predictions, batchReports } = await runAssertionPass({
    cases: assertionCases,
    model,
    apiKey,
    batchSize,
    pauseMs,
    thinkingBudget
  });

  const assertionPredictionsById = new Map(
    predictions
      .filter((item) => item && item.id)
      .map((item) => [
        item.id,
        {
          predictedOutcome: item.predictedOutcome,
          predictedOrigin: item.predictedOrigin,
          predictedReason: item.predictedReason ?? null,
          confidence: item.confidence ?? null
        }
      ])
  );

  const finalPredictionsById = buildFinalPredictionMap(rawCases, assertionPredictionsById);
  const evaluatedCases = rawCases.map((item) => {
    const predicted = finalPredictionsById.get(item.id) || { predictedAnchors: [] };
    const comparison = compareAnchors(item, predicted);
    return {
      ...item,
      predictedAnchors: predicted.predictedAnchors,
      droppedByBlocker: predicted.droppedByBlocker || [],
      ...comparison
    };
  });

  const summary = buildSummary(benchmarkCases, finalPredictionsById);
  const questionableIds = new Set(['anc-060', 'anc-063', 'anc-079', 'anc-089', 'anc-098']);
  const focusCases = evaluatedCases.filter((item) => questionableIds.has(item.id));

  const report = {
    created_at: new Date().toISOString(),
    benchmark,
    stage2Report,
    model,
    summary,
    assertion_case_count: assertionCases.length,
    focusCases,
    cases: evaluatedCases,
    assertionBatchReports: batchReports
  };

  await writeJson(path.join(outputDir, 'stage2_flash_stack_summary.json'), summary);
  await writeJson(path.join(outputDir, 'stage2_flash_stack_report.json'), report);

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

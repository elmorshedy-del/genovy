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
  input: '/Users/ahmedelmorshedy/Downloads/stage3_regression_cases.js',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_assertion_gemini_probe_20260401',
  model: 'gemini-2.5-flash',
  batchSize: 8,
  pauseMs: 400,
  thinkingBudget: 0
});

const SYSTEM_PROMPT = `You are evaluating Stage 3 phenotype assertion decisions for a rare-disease extraction pipeline.

Each case contains:
- id
- label
- sentence
- modelStatus

Your task:
Classify the final pipeline outcome for each case using exactly one of:
- "present" = keep as a positive phenotype finding
- "excluded" = keep, but mark as explicitly absent / not present
- "rejected" = do not keep as a phenotype finding because the sentence is normal/preserved, conditional/risk-only, or otherwise not asserting the phenotype as part of the disease

Rules:
1. If the sentence clearly says the finding is absent, not observed, not reported, ruled out, or not a feature, output "excluded".
2. If the sentence says the feature is normal, preserved, intact, unaffected, maintained, within the reference range, or similar, output "rejected".
3. If the sentence is only about risk, predisposition, susceptibility, conditional future development, or what may happen if untreated, output "rejected".
4. If the label itself is an abnormal phenotype that uses absence/loss/lack language (for example "Absence of speech"), and the sentence is describing that abnormal state as truly present, output "present".
5. Respect modelStatus:
   - if modelStatus is "excluded" and the sentence supports exclusion, keep outcome "excluded" and origin "model_excluded"
   - otherwise infer from the sentence

Return JSON only as an array. One object per input item in the same order.

Each object must be:
{
  "id": "case id",
  "predictedOutcome": "present|excluded|rejected",
  "predictedOrigin": "default_present|sentence_negation_inferred|model_excluded",
  "predictedReason": "explicit_negative_local_context|normal_or_preserved_context|conditional_or_risk_context|null",
  "confidence": 0.0
}

Reason mapping:
- excluded from sentence-level negation => origin "sentence_negation_inferred", reason "explicit_negative_local_context"
- excluded because input modelStatus is already excluded and sentence supports that => origin "model_excluded", reason "explicit_negative_local_context"
- rejected because preserved/normal => origin "default_present", reason "normal_or_preserved_context"
- rejected because risk/conditional => origin "default_present", reason "conditional_or_risk_context"
- present => origin "default_present", reason null

Do not add any explanation text.`;

function resolveEnvValue(...names) {
  for (const name of names) {
    if (!name) continue;
    const value = process.env[name];
    if (value) return value;
  }
  return '';
}

async function loadRegressionCases(filePath) {
  const raw = await fsp.readFile(filePath, 'utf8');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(
    `${raw}; globalThis.__cases = typeof stage3RealFormatCases !== 'undefined' ? stage3RealFormatCases : (typeof stage3TrickyCases !== 'undefined' ? stage3TrickyCases : (typeof stage3RegressionCases !== 'undefined' ? stage3RegressionCases : null));`,
    sandbox,
    { timeout: 1000 }
  );
  const loaded = sandbox.__cases;
  if (!Array.isArray(loaded)) {
    throw new Error(`Failed to load array "stage3RealFormatCases", "stage3TrickyCases", or "stage3RegressionCases" from ${filePath}`);
  }
  return loaded.map((item, index) => {
    if (item && item.input && item.expected) {
      return {
        id: item.id || item.input.sentence_id || item.input.paragraph_id || `realfmt-${index + 1}`,
        category: item.category || 'real_format',
        label: item.input.label,
        sentence: item.input.source_sentence,
        modelStatus: item.input.status,
        expectedOutcome: item.expected.outcome,
        expectedOrigin: item.expected.origin,
        expectedReason: item.expected.reason ?? null,
        pipelineInput: item.input
      };
    }
    return {
      ...item,
      expectedReason: item.expectedReason ?? null,
      pipelineInput: item.pipelineInput || null
    };
  });
}

function chunk(items, size) {
  const output = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

function normalizeReason(value) {
  return value == null ? null : String(value);
}

function comparePrediction(expected, predicted) {
  const expectedReason = normalizeReason(expected.expectedReason);
  const predictedReason = normalizeReason(predicted.predictedReason);
  return {
    exactMatch:
      expected.expectedOutcome === predicted.predictedOutcome &&
      expected.expectedOrigin === predicted.predictedOrigin &&
      expectedReason === predictedReason,
    outcomeMatch: expected.expectedOutcome === predicted.predictedOutcome
  };
}

function buildSummary(cases, predictionsById) {
  const summary = {
    total: cases.length,
    exactMatchCount: 0,
    outcomeMatchCount: 0,
    failedIds: [],
    outcomeFailedIds: [],
    byCategory: {}
  };

  for (const item of cases) {
    const predicted = predictionsById.get(item.id);
    const category = item.category || 'unknown';
    if (!summary.byCategory[category]) {
      summary.byCategory[category] = {
        total: 0,
        exactMatchCount: 0,
        outcomeMatchCount: 0,
        failedIds: [],
        outcomeFailedIds: []
      };
    }

    const bucket = summary.byCategory[category];
    bucket.total += 1;

    if (!predicted) {
      summary.failedIds.push(item.id);
      summary.outcomeFailedIds.push(item.id);
      bucket.failedIds.push(item.id);
      bucket.outcomeFailedIds.push(item.id);
      continue;
    }

    const comparison = comparePrediction(item, predicted);
    if (comparison.exactMatch) {
      summary.exactMatchCount += 1;
      bucket.exactMatchCount += 1;
    } else {
      summary.failedIds.push(item.id);
      bucket.failedIds.push(item.id);
    }

    if (comparison.outcomeMatch) {
      summary.outcomeMatchCount += 1;
      bucket.outcomeMatchCount += 1;
    } else {
      summary.outcomeFailedIds.push(item.id);
      bucket.outcomeFailedIds.push(item.id);
    }
  }

  return summary;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const input = flags.input || DEFAULTS.input;
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
  const cases = await loadRegressionCases(input);
  const batches = chunk(cases, batchSize);
  const predictions = [];
  const batchReports = [];

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    console.log(`Gemini batch ${index + 1}/${batches.length} (${batch.length} cases)`);
    const { parsed, usage, rawOutput } = await callGeminiJson({
      apiKey,
      model,
      systemPrompt: SYSTEM_PROMPT,
      userPayload: {
        batch_index: index + 1,
        cases: batch.map((item) => ({
          id: item.id,
          label: item.label,
          sentence: item.sentence,
          modelStatus: item.modelStatus,
          pipelineInput: item.pipelineInput || null
        }))
      },
      temperature: 0,
      thinkingBudget
    });

    const parsedBatch = Array.isArray(parsed) ? parsed : [];
    predictions.push(...parsedBatch);
    batchReports.push({
      batchIndex: index + 1,
      caseIds: batch.map((item) => item.id),
      usage,
      rawOutput,
      parsedCount: parsedBatch.length
    });

    if (pauseMs > 0 && index < batches.length - 1) {
      await sleep(pauseMs);
    }
  }

  const predictionsById = new Map(
    predictions
      .filter((item) => item && item.id)
      .map((item) => [
        item.id,
        {
          predictedOutcome: item.predictedOutcome,
          predictedOrigin: item.predictedOrigin,
          predictedReason: normalizeReason(item.predictedReason),
          confidence: item.confidence
        }
      ])
  );

  const evaluatedCases = cases.map((item) => {
    const predicted = predictionsById.get(item.id) || null;
    const comparison = predicted ? comparePrediction(item, predicted) : { exactMatch: false, outcomeMatch: false };
    return {
      ...item,
      predictedOutcome: predicted?.predictedOutcome || null,
      predictedOrigin: predicted?.predictedOrigin || null,
      predictedReason: predicted?.predictedReason ?? null,
      confidence: predicted?.confidence ?? null,
      exactMatch: comparison.exactMatch,
      outcomeMatch: comparison.outcomeMatch
    };
  });

  const summary = buildSummary(cases, predictionsById);
  const report = {
    created_at: new Date().toISOString(),
    model,
    input,
    batch_size: batchSize,
    total_predictions_returned: predictions.length,
    summary,
    cases: evaluatedCases,
    batches: batchReports
  };

  await writeJson(path.join(outputDir, 'stage3_regression_cases_gemini_flash_report.json'), report);
  await writeJson(path.join(outputDir, 'stage3_regression_cases_gemini_flash_summary.json'), {
    created_at: report.created_at,
    model,
    input,
    batch_size: batchSize,
    total_predictions_returned: predictions.length,
    summary
  });

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

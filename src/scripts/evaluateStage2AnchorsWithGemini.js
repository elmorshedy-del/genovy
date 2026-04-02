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
  input: '/Users/ahmedelmorshedy/Downloads/anchor_benchmark (1).js',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage2_anchor_gemini_probe_20260402',
  model: 'gemini-2.5-flash',
  batchSize: 5,
  pauseMs: 400,
  thinkingBudget: 0,
  limit: 50
});

const SYSTEM_PROMPT = `You are evaluating Stage 2 phenotype anchor extraction from single biomedical sentences.

Each case contains:
- id
- sentence

Your task:
Return phenotype anchors directly supported by the sentence.

Rules:
1. Return an anchor only if the sentence is actually expressing a phenotype-like abnormal clinical feature or explicitly stating that the feature is absent/not present.
2. If the sentence says the phenotype is absent, not reported, not observed, or not a feature, keep the anchor but mark status as "excluded".
3. If the sentence says the finding is normal, preserved, intact, within normal range, unremarkable, or only conditional/risk-only, do not return it as an anchor.
4. If the sentence describes an abnormal absence or loss phenotype such as "absence of speech", "loss of ambulation", or "lack of eye contact", that is a real positive phenotype and should be returned with status "present".
5. Ignore disease names, gene names, and broad disorder labels unless they are also explicit phenotype findings in the sentence.
6. Return the minimal set of anchors supported by the sentence.
7. Use the exact matched phrase from the sentence as "match_text".
8. Use the best HPO-like label you can infer, but do not invent many extra anchors.

Return JSON only as an array. One object per input item in the same order.

Each object must be:
{
  "id": "case id",
  "predictedAnchors": [
    {
      "hpo_label": "best phenotype label",
      "status": "present|excluded",
      "match_text": "exact phrase from sentence"
    }
  ]
}

Do not add explanation text.`;

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

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const input = flags.input || DEFAULTS.input;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const model = flags.model || DEFAULTS.model;
  const batchSize = Math.max(1, Number.parseInt(flags.batchSize || `${DEFAULTS.batchSize}`, 10) || DEFAULTS.batchSize);
  const pauseMs = Math.max(0, Number.parseInt(flags.pauseMs || `${DEFAULTS.pauseMs}`, 10) || DEFAULTS.pauseMs);
  const thinkingBudget = Number.parseInt(flags.thinkingBudget || `${DEFAULTS.thinkingBudget}`, 10) || 0;
  const limit = Math.max(1, Number.parseInt(flags.limit || `${DEFAULTS.limit}`, 10) || DEFAULTS.limit);
  const apiKey = flags.apiKey || resolveEnvValue(flags.apiKeyEnv, 'GOOGLE_API_KEY', 'GEMINI_API_KEY');

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is required.');
  }

  await ensureDir(outputDir);
  const allCases = await loadAnchorCases(input);
  const categories = [...new Set(allCases.map((item) => item.category))];
  const selected = [];
  let cursor = 0;
  while (selected.length < Math.min(limit, allCases.length)) {
    const category = categories[cursor % categories.length];
    const next = allCases.find((item) => item.category === category && !selected.includes(item));
    if (next) selected.push(next);
    cursor += 1;
    if (cursor > allCases.length * categories.length) break;
  }
  const cases = selected;
  const batches = chunk(cases, batchSize);
  const predictions = [];
  const batchReports = [];

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    console.log(`Gemini Stage 2 batch ${index + 1}/${batches.length} (${batch.length} cases)`);
    const { parsed, usage, rawOutput } = await callGeminiJson({
      apiKey,
      model,
      systemPrompt: SYSTEM_PROMPT,
      userPayload: {
        batch_index: index + 1,
        cases: batch.map((item) => ({
          id: item.id,
          sentence: item.sentence
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
          predictedAnchors: Array.isArray(item.predictedAnchors)
            ? item.predictedAnchors.map((anchor) => ({
                hpo_label: anchor?.hpo_label || '',
                status: anchor?.status || 'present',
                match_text: anchor?.match_text || ''
              }))
            : []
        }
      ])
  );

  const evaluatedCases = cases.map((item) => {
    const predicted = predictionsById.get(item.id) || { predictedAnchors: [] };
    const comparison = compareAnchors(item, predicted);
    return {
      ...item,
      ...predicted,
      ...comparison
    };
  });

  const summary = buildSummary(cases, predictionsById);

  await writeJson(path.join(outputDir, 'stage2_anchor_gemini_summary.json'), summary);
  await writeJson(path.join(outputDir, 'stage2_anchor_gemini_report.json'), {
    created_at: new Date().toISOString(),
    input_file: input,
    case_count: cases.length,
    cases: evaluatedCases,
    batchReports
  });

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(`[evaluateStage2AnchorsWithGemini] ${error.stack || error.message}`);
  process.exitCode = 1;
});

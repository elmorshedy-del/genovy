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
  input:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryBenchmarkFull.js',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_gemini_benchmark_20260402',
  model: 'gemini-2.5-flash',
  batchSize: 4,
  pauseMs: 400,
  thinkingBudget: 0,
  limit: 0,
  promptMode: 'canonical'
});

const CANDIDATE_DISCOVERY_PROMPT = `You are a clinical genetics expert reading GeneReviews chapters.

Each input item contains:
- id
- chapter_title
- existing_anchors
- clinical_text

TASK: For each input item, find additional clinical phenotype features described in the text that are NOT already covered by the supplied anchor list. Include features that are implied but not explicitly named (e.g., "the child never walked independently" = inability to walk).

RULES:
1. Output one feature per line as a short plain English phrase
2. Mark each as "present" or "excluded":
   - present = described in patients with this disease
   - excluded = explicitly stated as NOT present or absent
3. Do NOT output:
   - Inheritance patterns (autosomal dominant, X-linked, etc.)
   - Gene names, variant descriptions, molecular findings
   - Laboratory methods, test procedures, assay names, imaging studies, or raw analyte names/measurements unless the text states a recognized clinical abnormality rather than just the test
   - Treatment responses, management recommendations, devices, feeding routes, educational supports, or interventions
   - Broad disease/disorder labels, gene syndromes, or future risk/complication statements unless the phenotype itself is clearly described as present now
   - Normal, preserved, intact, or unremarkable findings. Do not convert normal statements into excluded pseudo-features
   - Anything already captured by the anchor list, including broader/narrower restatements of the same finding
4. Use "excluded" ONLY when an abnormal clinical feature is explicitly stated as absent / not present / not reported / not a feature. Do NOT emit excluded items for normal tests, normal hearing/vision/cognition, or preserved function.
5. Prefer standard clinical phenotype names over descriptive wording when the mapping is obvious:
   - "widely spaced eyes" -> "hypertelorism"
   - "low-set posteriorly rotated ears" -> "low-set ears"
   - "never spoke" / "completely nonverbal" -> "absent speech"
   - "fragmented sleep" / "frequent nighttime awakenings" -> "sleep disturbance"
   - "no interest in other children" -> "social withdrawal"
   - "repetitive spinning of objects" -> "repetitive behaviors"
6. Do NOT output HPO IDs or attempt to map to any ontology
7. If a feature appears multiple times in the text, output it only once
8. Be specific, but prefer concise canonical phenotype phrases over long descriptive clauses
9. When uncertain whether something is a phenotype versus a lab/test/management/risk statement, omit it

OUTPUT FORMAT (JSON array, no other text, no markdown fences):
[
  {
    "id": "case id",
    "predictedCandidates": [
      { "label": "short phrase", "status": "present" },
      { "label": "other phrase", "status": "excluded" }
    ]
  }
]`;

const EXACT_SPAN_DISCOVERY_PROMPT = `You are a clinical genetics expert reading GeneReviews chapters.

Each input item contains:
- id
- chapter_title
- existing_anchors
- clinical_text

TASK: For each input item, find additional clinical phenotype features described in the text that are NOT already covered by the supplied anchor list.

CRITICAL EXTRACTION RULE:
- Return each phenotype as an exact evidence phrase copied from the source text whenever possible.
- Do NOT rename, paraphrase, normalize, or map the phrase to HPO wording.
- If the text says "widely spaced eyes", return "widely spaced eyes", not "hypertelorism".
- If the text says "delayed puberty", return "delayed puberty", not "delayed pubertal development".

RULES:
1. Output only grounded phenotype evidence phrases taken directly from the chapter text whenever possible
2. Mark each as "present" or "excluded":
   - present = described in patients with this disease
   - excluded = explicitly stated as NOT present or absent
3. Do NOT output:
   - Inheritance patterns (autosomal dominant, X-linked, etc.)
   - Gene names, variant descriptions, molecular findings
   - Laboratory methods, assay names, imaging studies, raw analytes, raw measurements, or test result labels even if abnormal
   - Treatment responses, management recommendations, devices, feeding routes, or interventions
   - Broad disease/disorder labels, syndrome names, or future risk/complication statements
   - Normal, preserved, intact, or unremarkable findings
   - Anything already captured by the anchor list, including broader/narrower restatements of the same finding
4. Use "excluded" ONLY when an abnormal clinical feature is explicitly stated as absent / not present / not reported / not a feature
5. If the text offers multiple overlapping ways to say the same finding, return the shortest exact source phrase that best captures the phenotype and output it only once
6. Do NOT output HPO IDs or ontology mappings
7. If uncertain whether something is a phenotype versus a lab/test/management/risk statement, omit it

OUTPUT FORMAT (JSON array, no other text, no markdown fences):
[
  {
    "id": "case id",
    "predictedCandidates": [
      { "label": "exact quoted source phrase", "status": "present" },
      { "label": "exact quoted source phrase", "status": "excluded" }
    ]
  }
]`;

function getDiscoveryPrompt(promptMode) {
  if (promptMode === 'exact-span') return EXACT_SPAN_DISCOVERY_PROMPT;
  return CANDIDATE_DISCOVERY_PROMPT;
}

function resolveEnvValue(...names) {
  for (const name of names) {
    if (!name) continue;
    const value = process.env[name];
    if (value) return value;
  }
  return '';
}

async function loadBenchmark(filePath) {
  const raw = await fsp.readFile(filePath, 'utf8');
  const sandbox = {
    module: { exports: {} },
    exports: {}
  };
  vm.createContext(sandbox);
  vm.runInContext(
    `${raw}\nthis.__cases = typeof DISCOVERY_BENCHMARK !== 'undefined' ? DISCOVERY_BENCHMARK : (module.exports?.DISCOVERY_BENCHMARK || null);`,
    sandbox,
    {
      timeout: 1000,
      filename: filePath
    }
  );
  const loaded = sandbox.__cases;
  if (!Array.isArray(loaded)) {
    throw new Error(`Failed to load DISCOVERY_BENCHMARK from ${filePath}`);
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
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function diceCoefficient(left, right) {
  const leftNorm = normalizeText(left);
  const rightNorm = normalizeText(right);
  if (!leftNorm || !rightNorm) return 0;
  const leftTokens = new Set(leftNorm.split(' '));
  const rightTokens = new Set(rightNorm.split(' '));
  if (!leftTokens.size || !rightTokens.size) return 0;
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return (2 * overlap) / (leftTokens.size + rightTokens.size);
}

function candidateMatches(candidate, expected) {
  const candidateStatus = candidate?.status || 'present';
  const expectedStatus = expected?.status || 'present';
  if (candidateStatus !== expectedStatus) return false;
  const left = candidate?.label || '';
  const right = expected?.label || '';
  if (!left || !right) return false;
  const leftNorm = normalizeText(left);
  const rightNorm = normalizeText(right);
  return (
    leftNorm === rightNorm ||
    leftNorm.includes(rightNorm) ||
    rightNorm.includes(leftNorm) ||
    diceCoefficient(left, right) >= 0.8
  );
}

function dedupeCandidates(items) {
  const byKey = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    if (!item?.label) continue;
    const key = `${normalizeText(item.label)}::${item.status || 'present'}`;
    if (!byKey.has(key)) {
      byKey.set(key, {
        label: String(item.label).trim(),
        status: item.status === 'excluded' ? 'excluded' : 'present'
      });
    }
  }
  return [...byKey.values()];
}

function evaluateCase(testCase, predictedCandidates) {
  const expected = Array.isArray(testCase.expectedNewCandidates) ? testCase.expectedNewCandidates : [];
  const mustNot = Array.isArray(testCase.mustNotPropose) ? testCase.mustNotPropose : [];
  const acceptable = Array.isArray(testCase.acceptableExtraCandidates) ? testCase.acceptableExtraCandidates : [];

  const consumed = new Set();
  const matchedExpectedCandidates = [];
  const missedExpectedCandidates = [];

  for (const expectedCandidate of expected) {
    let foundIndex = -1;
    let foundCandidate = null;
    for (let index = 0; index < predictedCandidates.length; index += 1) {
      if (consumed.has(index)) continue;
      const candidate = predictedCandidates[index];
      if (candidateMatches(candidate, expectedCandidate)) {
        foundIndex = index;
        foundCandidate = candidate;
        break;
      }
    }
    if (foundIndex >= 0) {
      consumed.add(foundIndex);
      matchedExpectedCandidates.push({ expected: expectedCandidate, predicted: foundCandidate });
    } else {
      missedExpectedCandidates.push(expectedCandidate);
    }
  }

  const mustNotProposeViolations = [];
  for (const blocked of mustNot) {
    const violation = predictedCandidates.find((candidate, index) => {
      if (consumed.has(index)) return false;
      return candidateMatches(candidate, { label: blocked.label, status: 'present' });
    });
    if (violation) {
      mustNotProposeViolations.push({
        label: blocked.label,
        reason: blocked.reason,
        predicted: violation
      });
    }
  }

  const acceptableExtraMatches = [];
  const unexpectedPredictedCandidates = [];
  for (let index = 0; index < predictedCandidates.length; index += 1) {
    if (consumed.has(index)) continue;
    const candidate = predictedCandidates[index];
    const acceptableMatch = acceptable.find((alt) => candidateMatches(candidate, alt));
    if (acceptableMatch) {
      acceptableExtraMatches.push({ expected: acceptableMatch, predicted: candidate });
      continue;
    }
    unexpectedPredictedCandidates.push(candidate);
  }

  return {
    matchedExpectedCandidates,
    missedExpectedCandidates,
    mustNotProposeViolations,
    acceptableExtraMatches,
    unexpectedPredictedCandidates,
    strictExactCaseMatch:
      missedExpectedCandidates.length === 0 &&
      mustNotProposeViolations.length === 0 &&
      unexpectedPredictedCandidates.length === 0,
    acceptableExactCaseMatch:
      missedExpectedCandidates.length === 0 &&
      mustNotProposeViolations.length === 0
  };
}

function buildSummary(cases, evaluatedCases) {
  const summary = {
    total: cases.length,
    strictExactMatchCount: 0,
    acceptableExactMatchCount: 0,
    expectedCandidateTotal: 0,
    matchedExpectedCandidateTotal: 0,
    mustNotProposeTotal: 0,
    mustNotProposeViolationTotal: 0,
    byCategory: {}
  };

  for (let index = 0; index < cases.length; index += 1) {
    const testCase = cases[index];
    const evaluated = evaluatedCases[index];
    const category = String(testCase.id || 'unknown').split('-')[0];
    const bucket = summary.byCategory[category] || {
      total: 0,
      strictExactMatchCount: 0,
      acceptableExactMatchCount: 0,
      expectedCandidateTotal: 0,
      matchedExpectedCandidateTotal: 0,
      mustNotProposeTotal: 0,
      mustNotProposeViolationTotal: 0
    };

    bucket.total += 1;
    summary.expectedCandidateTotal += (testCase.expectedNewCandidates || []).length;
    summary.matchedExpectedCandidateTotal += evaluated.matchedExpectedCandidates.length;
    summary.mustNotProposeTotal += (testCase.mustNotPropose || []).length;
    summary.mustNotProposeViolationTotal += evaluated.mustNotProposeViolations.length;
    bucket.expectedCandidateTotal += (testCase.expectedNewCandidates || []).length;
    bucket.matchedExpectedCandidateTotal += evaluated.matchedExpectedCandidates.length;
    bucket.mustNotProposeTotal += (testCase.mustNotPropose || []).length;
    bucket.mustNotProposeViolationTotal += evaluated.mustNotProposeViolations.length;

    if (evaluated.strictExactCaseMatch) {
      summary.strictExactMatchCount += 1;
      bucket.strictExactMatchCount += 1;
    }
    if (evaluated.acceptableExactCaseMatch) {
      summary.acceptableExactMatchCount += 1;
      bucket.acceptableExactMatchCount += 1;
    }

    summary.byCategory[category] = bucket;
  }

  summary.strictExactMatchRate = summary.total
    ? Number((summary.strictExactMatchCount / summary.total).toFixed(4))
    : 0;
  summary.acceptableExactMatchRate = summary.total
    ? Number((summary.acceptableExactMatchCount / summary.total).toFixed(4))
    : 0;
  summary.expectedCandidateRecall = summary.expectedCandidateTotal
    ? Number((summary.matchedExpectedCandidateTotal / summary.expectedCandidateTotal).toFixed(4))
    : 0;
  summary.mustNotProposePassRate = summary.mustNotProposeTotal
    ? Number(
        (
          (summary.mustNotProposeTotal - summary.mustNotProposeViolationTotal) /
          summary.mustNotProposeTotal
        ).toFixed(4)
      )
    : 1;

  for (const bucket of Object.values(summary.byCategory)) {
    bucket.strictExactMatchRate = bucket.total
      ? Number((bucket.strictExactMatchCount / bucket.total).toFixed(4))
      : 0;
    bucket.acceptableExactMatchRate = bucket.total
      ? Number((bucket.acceptableExactMatchCount / bucket.total).toFixed(4))
      : 0;
    bucket.expectedCandidateRecall = bucket.expectedCandidateTotal
      ? Number((bucket.matchedExpectedCandidateTotal / bucket.expectedCandidateTotal).toFixed(4))
      : 0;
    bucket.mustNotProposePassRate = bucket.mustNotProposeTotal
      ? Number(
          (
            (bucket.mustNotProposeTotal - bucket.mustNotProposeViolationTotal) /
            bucket.mustNotProposeTotal
          ).toFixed(4)
        )
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
  const limit = Math.max(0, Number.parseInt(flags.limit || `${DEFAULTS.limit}`, 10) || DEFAULTS.limit);
  const promptMode = flags.promptMode || DEFAULTS.promptMode;
  const apiKey = flags.apiKey || resolveEnvValue(flags.apiKeyEnv, 'GOOGLE_API_KEY', 'GEMINI_API_KEY');

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is required.');
  }

  await ensureDir(outputDir);
  let benchmark = await loadBenchmark(input);
  if (limit > 0) benchmark = benchmark.slice(0, limit);
  const batches = chunk(benchmark, batchSize);
  const predictions = [];
  const batchReports = [];

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    console.log(`Gemini discovery batch ${index + 1}/${batches.length} (${batch.length} cases)`);
    const { parsed, usage, rawOutput } = await callGeminiJson({
      apiKey,
      model,
      systemPrompt: getDiscoveryPrompt(promptMode),
      userPayload: {
        batch_index: index + 1,
        cases: batch.map((testCase) => ({
          id: testCase.id,
          chapter_title: testCase.chapter_title,
          existing_anchors: testCase.existing_anchors,
          clinical_text: testCase.clinical_text
        }))
      },
      temperature: 0.1,
      thinkingBudget
    });

    const parsedBatch = Array.isArray(parsed) ? parsed : [];
    predictions.push(
      ...batch.map((testCase) => {
        const rawPredicted = parsedBatch.find((item) => item?.id === testCase.id);
        const predictedCandidates = dedupeCandidates(
          Array.isArray(rawPredicted)
            ? rawPredicted
            : Array.isArray(rawPredicted?.predictedCandidates)
              ? rawPredicted.predictedCandidates
              : []
        );
        return {
          id: testCase.id,
          predictedCandidates
        };
      })
    );

    batchReports.push({
      batchIndex: index + 1,
      caseIds: batch.map((testCase) => testCase.id),
      usage,
      rawOutput
    });

    if (pauseMs > 0 && index < batches.length - 1) {
      await sleep(pauseMs);
    }
  }

  const predictionById = new Map(predictions.map((item) => [item.id, item]));
  const evaluatedCases = benchmark.map((testCase) => {
    const predicted = predictionById.get(testCase.id) || { predictedCandidates: [] };
    return {
      id: testCase.id,
      chapter_title: testCase.chapter_title,
      predictedCandidates: predicted.predictedCandidates,
      ...evaluateCase(testCase, predicted.predictedCandidates)
    };
  });

  const summary = buildSummary(benchmark, evaluatedCases);
  summary.model = model;
  summary.promptMode = promptMode;
  await writeJson(path.join(outputDir, 'stage3_discovery_gemini_summary.json'), summary);
  await writeJson(
    path.join(outputDir, 'stage3_discovery_gemini_report.json'),
    benchmark.map((testCase, index) => ({
      ...testCase,
      ...evaluatedCases[index]
    }))
  );
  await writeJson(path.join(outputDir, 'stage3_discovery_gemini_batches.json'), batchReports);

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

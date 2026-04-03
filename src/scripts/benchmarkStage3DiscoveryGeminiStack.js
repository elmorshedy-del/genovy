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
  generatorReport:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_gemini_25_flash_tuned_20260402/stage3_discovery_gemini_report.json',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_gemini_stack_20260402',
  reviewerModel: 'gemini-3-flash-preview',
  batchSize: 2,
  pauseMs: 400,
  thinkingBudget: 0
});

const REVIEW_PROMPT = `You are reviewing candidate clinical phenotype findings from a first-pass rare-disease extraction model.

Each case contains:
- id
- chapter_title
- existing_anchors
- clinical_text
- generated_candidates

Your job is NOT to discover new findings. Your job is only to review the supplied generated candidates and decide which ones should survive.

Review standard:
- Approve a candidate if it is a real phenotype / clinical finding supported by the text, even if phrased imperfectly.
- Reject a candidate only if it is clearly one of these:
  - already covered by the existing anchor list
  - a lab value, assay, test procedure, imaging study, or raw measurement rather than a phenotype
  - treatment, management, intervention, education/support, or device
  - gene / variant / inheritance / molecular finding
  - a normal, preserved, intact, or unremarkable finding
  - a future risk, complication risk, predisposition, or diagnosis/disease label not being asserted as a phenotype finding now
- Do NOT reject a candidate just because it is broader, narrower, or slightly differently phrased than you would prefer.
- If uncertain, KEEP it.

Return JSON only as an array, one object per case in the same order:
[
  {
    "id": "case id",
    "reviews": [
      {
        "label": "candidate label exactly as given",
        "status": "present|excluded",
        "decision": "keep|reject",
        "reason": "already_in_anchors|lab_or_test_method|treatment_or_management|gene_or_variant|normal_or_preserved|conditional_or_risk_only|not_a_phenotype|null"
      }
    ]
  }
]

Rules:
- Preserve the candidate label exactly as given.
- Preserve the candidate status exactly as given.
- Use reason null when decision is "keep".
- Only use the listed reason codes.
- Do not add explanation text.`;

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
    { timeout: 1000, filename: filePath }
  );
  const loaded = sandbox.__cases;
  if (!Array.isArray(loaded)) {
    throw new Error(`Failed to load DISCOVERY_BENCHMARK from ${filePath}`);
  }
  return loaded;
}

async function loadGeneratorReport(filePath) {
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
  const generatorReportPath = flags.generatorReport || DEFAULTS.generatorReport;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const reviewerModel = flags.reviewerModel || DEFAULTS.reviewerModel;
  const batchSize = Math.max(1, Number.parseInt(flags.batchSize || `${DEFAULTS.batchSize}`, 10) || DEFAULTS.batchSize);
  const pauseMs = Math.max(0, Number.parseInt(flags.pauseMs || `${DEFAULTS.pauseMs}`, 10) || DEFAULTS.pauseMs);
  const thinkingBudget = Number.parseInt(flags.thinkingBudget || `${DEFAULTS.thinkingBudget}`, 10) || 0;
  const apiKey = flags.apiKey || resolveEnvValue(flags.apiKeyEnv, 'GOOGLE_API_KEY', 'GEMINI_API_KEY');

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is required.');
  }

  await ensureDir(outputDir);
  const benchmark = await loadBenchmark(input);
  const generatorReport = await loadGeneratorReport(generatorReportPath);
  const generatedById = new Map(generatorReport.map((item) => [item.id, item]));

  const reviewInputCases = benchmark.map((testCase) => ({
    id: testCase.id,
    chapter_title: testCase.chapter_title,
    existing_anchors: testCase.existing_anchors,
    clinical_text: testCase.clinical_text,
    generated_candidates: (generatedById.get(testCase.id)?.predictedCandidates || []).map((candidate) => ({
      label: candidate.label,
      status: candidate.status || 'present'
    }))
  }));

  const batches = chunk(reviewInputCases, batchSize);
  const reviewReports = [];
  const keptById = new Map();

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    console.log(`Gemini review batch ${index + 1}/${batches.length} (${batch.length} cases)`);
    const { parsed, usage, rawOutput } = await callGeminiJson({
      apiKey,
      model: reviewerModel,
      systemPrompt: REVIEW_PROMPT,
      userPayload: {
        batch_index: index + 1,
        cases: batch
      },
      temperature: 0,
      thinkingBudget
    });

    const parsedBatch = Array.isArray(parsed) ? parsed : [];
    for (const testCase of batch) {
      const review = parsedBatch.find((item) => item?.id === testCase.id);
      const reviews = Array.isArray(review?.reviews) ? review.reviews : [];
      const keepKeys = new Set();
      const rejected = [];
      for (const item of reviews) {
        const key = `${normalizeText(item?.label)}::${item?.status === 'excluded' ? 'excluded' : 'present'}`;
        if (item?.decision === 'reject') {
          rejected.push({
            label: item.label,
            status: item.status === 'excluded' ? 'excluded' : 'present',
            reason: item.reason || null
          });
          continue;
        }
        keepKeys.add(key);
      }

      const kept = testCase.generated_candidates.filter((candidate) => {
        const key = `${normalizeText(candidate.label)}::${candidate.status === 'excluded' ? 'excluded' : 'present'}`;
        return reviews.length === 0 ? true : keepKeys.has(key);
      });

      keptById.set(testCase.id, {
        predictedCandidates: kept,
        reviewerRejectedCandidates: rejected,
        rawReviews: reviews
      });
    }

    reviewReports.push({
      batchIndex: index + 1,
      caseIds: batch.map((testCase) => testCase.id),
      usage,
      rawOutput
    });

    if (pauseMs > 0 && index < batches.length - 1) {
      await sleep(pauseMs);
    }
  }

  const evaluatedCases = benchmark.map((testCase) => {
    const reviewed = keptById.get(testCase.id) || {
      predictedCandidates: generatedById.get(testCase.id)?.predictedCandidates || [],
      reviewerRejectedCandidates: [],
      rawReviews: []
    };
    return {
      id: testCase.id,
      chapter_title: testCase.chapter_title,
      predictedCandidates: reviewed.predictedCandidates,
      reviewerRejectedCandidates: reviewed.reviewerRejectedCandidates,
      rawReviews: reviewed.rawReviews,
      ...evaluateCase(testCase, reviewed.predictedCandidates)
    };
  });

  const summary = buildSummary(benchmark, evaluatedCases);
  await writeJson(path.join(outputDir, 'stage3_discovery_gemini_stack_summary.json'), summary);
  await writeJson(
    path.join(outputDir, 'stage3_discovery_gemini_stack_report.json'),
    benchmark.map((testCase, index) => ({
      ...testCase,
      ...evaluatedCases[index]
    }))
  );
  await writeJson(path.join(outputDir, 'stage3_discovery_gemini_stack_batches.json'), reviewReports);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

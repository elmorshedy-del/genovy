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
  firstPassReport:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_gliner_benchmark_20260402/stage3_discovery_gliner_report.json',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_gliner_smallold_gemini25pro_residual_20260402',
  model: 'gemini-2.5-pro',
  batchSize: 4,
  pauseMs: 400,
  thinkingBudget: 1024,
  limit: 0
});

const RESIDUAL_DISCOVERY_PROMPT = `You are a clinical genetics expert reading GeneReviews discovery cases.

Each input item contains:
- id
- chapter_title
- existing_anchors
- already_found_candidates
- clinical_structure.sentences

TASK:
Find additional phenotype findings that are described in the provided sentences but are NOT already covered by:
- existing_anchors
- already_found_candidates

Return only the remaining findings that the first pass missed.

OUTPUT RULES:
1. Each returned item must be grounded to exactly one provided sentence_id
2. evidence_text must be copied exactly from that sentence
3. label should be a concise canonical phenotype phrase when the mapping is obvious
4. status must be "present" or "excluded"
5. Do NOT return duplicate findings already covered by existing_anchors or already_found_candidates
6. Do NOT return:
   - inheritance patterns
   - gene names, variants, molecular findings
   - lab tests, imaging studies, procedures, analytes, or raw measurements
   - treatment, management, devices, or support interventions
   - disease labels or syndrome names
   - normal/preserved/intact findings
   - future risk / complication statements unless the phenotype is asserted as present now
7. Use "excluded" only when the abnormal clinical feature is explicitly said to be absent / not present / not reported / not a feature
8. If uncertain whether something is a true phenotype finding, omit it

OUTPUT FORMAT (JSON array, no other text):
[
  {
    "id": "case id",
    "predictedCandidates": [
      {
        "label": "canonical phenotype phrase",
        "status": "present",
        "sentence_id": "p1_s2",
        "evidence_text": "exact quote from that sentence"
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
  if (!Array.isArray(sandbox.__cases)) {
    throw new Error(`Failed to load DISCOVERY_BENCHMARK from ${filePath}`);
  }
  return sandbox.__cases;
}

async function loadFirstPassReport(filePath) {
  const raw = JSON.parse(await fsp.readFile(filePath, 'utf8'));
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.cases)) return raw.cases;
  throw new Error(`Unsupported first-pass report shape: ${filePath}`);
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
    const status = item.status === 'excluded' ? 'excluded' : 'present';
    const key = `${normalizeText(item.label)}::${status}`;
    if (byKey.has(key)) continue;
    byKey.set(key, {
      label: String(item.label).trim(),
      status,
      sentence_id: item.sentence_id || null,
      evidence_text: item.evidence_text || null
    });
  }
  return [...byKey.values()];
}

function buildSentenceList(testCase) {
  const direct = Array.isArray(testCase?.clinical_structure?.sentences)
    ? testCase.clinical_structure.sentences
    : [];
  if (direct.length) {
    return direct.map((sentence) => ({
      sentence_id: sentence.sentence_id,
      text: sentence.text
    }));
  }
  const paragraphs = Array.isArray(testCase?.clinical_structure?.paragraphs)
    ? testCase.clinical_structure.paragraphs
    : [];
  return paragraphs.flatMap((paragraph) =>
    Array.isArray(paragraph.sentences)
      ? paragraph.sentences.map((sentence) => ({
          sentence_id: sentence.sentence_id,
          text: sentence.text
        }))
      : []
  );
}

function evaluateCase(testCase, predictedCandidates) {
  const expected = Array.isArray(testCase.expectedNewCandidates) ? testCase.expectedNewCandidates : [];
  const mustNot = Array.isArray(testCase.mustNotPropose) ? testCase.mustNotPropose : [];
  const acceptable = Array.isArray(testCase.acceptableExtraCandidates)
    ? testCase.acceptableExtraCandidates
    : [];

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

function evaluateResidualCase(testCase, firstPassCandidates, residualCandidates) {
  const firstPassEval = evaluateCase(testCase, firstPassCandidates);
  const combinedCandidates = dedupeCandidates([...firstPassCandidates, ...residualCandidates]);
  const combinedEval = evaluateCase(testCase, combinedCandidates);

  const residualExpected = firstPassEval.missedExpectedCandidates;
  const residualMatchedExpectedCandidates = [];
  const residualMissedExpectedCandidates = [];
  const consumed = new Set();
  for (const expectedCandidate of residualExpected) {
    let foundIndex = -1;
    let foundCandidate = null;
    for (let index = 0; index < residualCandidates.length; index += 1) {
      if (consumed.has(index)) continue;
      const candidate = residualCandidates[index];
      if (candidateMatches(candidate, expectedCandidate)) {
        foundIndex = index;
        foundCandidate = candidate;
        break;
      }
    }
    if (foundIndex >= 0) {
      consumed.add(foundIndex);
      residualMatchedExpectedCandidates.push({
        expected: expectedCandidate,
        predicted: foundCandidate
      });
    } else {
      residualMissedExpectedCandidates.push(expectedCandidate);
    }
  }

  const firstPassViolationLabels = new Set(
    firstPassEval.mustNotProposeViolations.map((item) => normalizeText(item.label))
  );
  const residualMustNot = (testCase.mustNotPropose || []).filter(
    (item) => !firstPassViolationLabels.has(normalizeText(item.label))
  );
  const residualMustNotProposeViolations = [];
  for (const blocked of residualMustNot) {
    const violation = residualCandidates.find((candidate) =>
      candidateMatches(candidate, { label: blocked.label, status: 'present' })
    );
    if (violation) {
      residualMustNotProposeViolations.push({
        label: blocked.label,
        reason: blocked.reason,
        predicted: violation
      });
    }
  }

  const sentenceById = new Map(
    buildSentenceList(testCase).map((sentence) => [sentence.sentence_id, sentence.text])
  );
  const groundedResidualCandidates = residualCandidates.map((candidate) => {
    const sentenceText = sentenceById.get(candidate.sentence_id || '');
    const sentenceIdValid = Boolean(sentenceText);
    const evidenceTextValid = sentenceIdValid
      ? normalizeText(sentenceText).includes(normalizeText(candidate.evidence_text || ''))
      : false;
    return {
      ...candidate,
      grounding: {
        sentenceIdValid,
        evidenceTextValid
      }
    };
  });

  return {
    firstPassEval,
    residualExpectedCandidates: residualExpected,
    residualMatchedExpectedCandidates,
    residualMissedExpectedCandidates,
    residualMustNot,
    residualMustNotProposeViolations,
    groundedResidualCandidates,
    combinedCandidates,
    combinedEval
  };
}

function buildSummary(cases, evaluatedCases) {
  const summary = {
    total: cases.length,
    firstPass: {
      expectedCandidateTotal: 0,
      matchedExpectedCandidateTotal: 0,
      mustNotProposeTotal: 0,
      mustNotProposeViolationTotal: 0,
      strictExactMatchCount: 0,
      acceptableExactMatchCount: 0
    },
    residual: {
      expectedCandidateTotal: 0,
      matchedExpectedCandidateTotal: 0,
      mustNotProposeTotal: 0,
      mustNotProposeViolationTotal: 0,
      candidateTotal: 0,
      sentenceIdValidTotal: 0,
      evidenceTextValidTotal: 0
    },
    combined: {
      expectedCandidateTotal: 0,
      matchedExpectedCandidateTotal: 0,
      mustNotProposeTotal: 0,
      mustNotProposeViolationTotal: 0,
      strictExactMatchCount: 0,
      acceptableExactMatchCount: 0
    }
  };

  for (let index = 0; index < cases.length; index += 1) {
    const testCase = cases[index];
    const evaluated = evaluatedCases[index];

    summary.firstPass.expectedCandidateTotal += (testCase.expectedNewCandidates || []).length;
    summary.firstPass.matchedExpectedCandidateTotal +=
      evaluated.firstPassEval.matchedExpectedCandidates.length;
    summary.firstPass.mustNotProposeTotal += (testCase.mustNotPropose || []).length;
    summary.firstPass.mustNotProposeViolationTotal +=
      evaluated.firstPassEval.mustNotProposeViolations.length;
    if (evaluated.firstPassEval.strictExactCaseMatch) summary.firstPass.strictExactMatchCount += 1;
    if (evaluated.firstPassEval.acceptableExactCaseMatch) {
      summary.firstPass.acceptableExactMatchCount += 1;
    }

    summary.residual.expectedCandidateTotal += evaluated.residualExpectedCandidates.length;
    summary.residual.matchedExpectedCandidateTotal +=
      evaluated.residualMatchedExpectedCandidates.length;
    summary.residual.mustNotProposeTotal += evaluated.residualMustNot.length;
    summary.residual.mustNotProposeViolationTotal +=
      evaluated.residualMustNotProposeViolations.length;
    const residualCandidates = Array.isArray(evaluated.residualPredictedCandidates)
      ? evaluated.residualPredictedCandidates
      : [];
    summary.residual.candidateTotal += residualCandidates.length;
    summary.residual.sentenceIdValidTotal += residualCandidates.filter(
      (candidate) => candidate.grounding.sentenceIdValid
    ).length;
    summary.residual.evidenceTextValidTotal += residualCandidates.filter(
      (candidate) => candidate.grounding.evidenceTextValid
    ).length;

    summary.combined.expectedCandidateTotal += (testCase.expectedNewCandidates || []).length;
    summary.combined.matchedExpectedCandidateTotal +=
      evaluated.combinedEval.matchedExpectedCandidates.length;
    summary.combined.mustNotProposeTotal += (testCase.mustNotPropose || []).length;
    summary.combined.mustNotProposeViolationTotal +=
      evaluated.combinedEval.mustNotProposeViolations.length;
    if (evaluated.combinedEval.strictExactCaseMatch) summary.combined.strictExactMatchCount += 1;
    if (evaluated.combinedEval.acceptableExactCaseMatch) {
      summary.combined.acceptableExactMatchCount += 1;
    }
  }

  for (const bucket of [summary.firstPass, summary.residual, summary.combined]) {
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

  summary.firstPass.strictExactMatchRate = summary.total
    ? Number((summary.firstPass.strictExactMatchCount / summary.total).toFixed(4))
    : 0;
  summary.firstPass.acceptableExactMatchRate = summary.total
    ? Number((summary.firstPass.acceptableExactMatchCount / summary.total).toFixed(4))
    : 0;
  summary.combined.strictExactMatchRate = summary.total
    ? Number((summary.combined.strictExactMatchCount / summary.total).toFixed(4))
    : 0;
  summary.combined.acceptableExactMatchRate = summary.total
    ? Number((summary.combined.acceptableExactMatchCount / summary.total).toFixed(4))
    : 0;
  summary.residual.sentenceIdValidRate = summary.residual.candidateTotal
    ? Number((summary.residual.sentenceIdValidTotal / summary.residual.candidateTotal).toFixed(4))
    : 1;
  summary.residual.evidenceTextValidRate = summary.residual.candidateTotal
    ? Number((summary.residual.evidenceTextValidTotal / summary.residual.candidateTotal).toFixed(4))
    : 1;

  return summary;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const input = flags.input || DEFAULTS.input;
  const firstPassReportPath = flags.firstPassReport || DEFAULTS.firstPassReport;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const model = flags.model || DEFAULTS.model;
  const batchSize =
    Math.max(1, Number.parseInt(flags.batchSize || `${DEFAULTS.batchSize}`, 10)) ||
    DEFAULTS.batchSize;
  const pauseMs =
    Math.max(0, Number.parseInt(flags.pauseMs || `${DEFAULTS.pauseMs}`, 10)) || DEFAULTS.pauseMs;
  const thinkingBudget =
    Number.parseInt(flags.thinkingBudget || `${DEFAULTS.thinkingBudget}`, 10) || 0;
  const limit = Math.max(0, Number.parseInt(flags.limit || `${DEFAULTS.limit}`, 10) || 0);
  const apiKey = flags.apiKey || resolveEnvValue(flags.apiKeyEnv, 'GOOGLE_API_KEY', 'GEMINI_API_KEY');

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is required.');
  }

  await ensureDir(outputDir);
  let benchmark = await loadBenchmark(input);
  if (limit > 0) benchmark = benchmark.slice(0, limit);
  const firstPassReport = await loadFirstPassReport(firstPassReportPath);
  const firstPassById = new Map(firstPassReport.map((item) => [item.id, item]));

  const residualInputCases = benchmark.map((testCase) => ({
    id: testCase.id,
    chapter_title: testCase.chapter_title,
    existing_anchors: testCase.existing_anchors,
    already_found_candidates: (firstPassById.get(testCase.id)?.predictedCandidates || []).map(
      (candidate) => ({
        label: candidate.label,
        status: candidate.status || 'present'
      })
    ),
    clinical_structure: {
      sentences: buildSentenceList(testCase)
    }
  }));

  const batches = chunk(residualInputCases, batchSize);
  const residualPredictions = [];
  const batchReports = [];

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    console.log(`Gemini residual batch ${index + 1}/${batches.length} (${batch.length} cases)`);
    const { parsed, usage, rawOutput } = await callGeminiJson({
      apiKey,
      model,
      systemPrompt: RESIDUAL_DISCOVERY_PROMPT,
      userPayload: {
        batch_index: index + 1,
        cases: batch
      },
      temperature: 0.1,
      thinkingBudget
    });

    const parsedBatch = Array.isArray(parsed) ? parsed : [];
    residualPredictions.push(
      ...batch.map((testCase) => {
        const rawPredicted = parsedBatch.find((item) => item?.id === testCase.id);
        return {
          id: testCase.id,
          predictedCandidates: dedupeCandidates(
            Array.isArray(rawPredicted?.predictedCandidates) ? rawPredicted.predictedCandidates : []
          )
        };
      })
    );

    batchReports.push({
      batchIndex: index + 1,
      caseIds: batch.map((testCase) => testCase.id),
      usage,
      rawOutput
    });
    await writeJson(path.join(outputDir, 'stage3_discovery_residual_batches.json'), batchReports);

    if (pauseMs > 0 && index < batches.length - 1) {
      await sleep(pauseMs);
    }
  }

  const residualById = new Map(residualPredictions.map((item) => [item.id, item]));
  const evaluatedCases = benchmark.map((testCase) => {
    const firstPassCandidates = dedupeCandidates(firstPassById.get(testCase.id)?.predictedCandidates || []);
    const residualCandidates = dedupeCandidates(residualById.get(testCase.id)?.predictedCandidates || []);
    const evaluation = evaluateResidualCase(testCase, firstPassCandidates, residualCandidates);
    return {
      id: testCase.id,
      chapter_title: testCase.chapter_title,
      firstPassCandidates,
      residualPredictedCandidates: evaluation.groundedResidualCandidates,
      combinedPredictedCandidates: evaluation.combinedCandidates,
      firstPassEval: evaluation.firstPassEval,
      residualExpectedCandidates: evaluation.residualExpectedCandidates,
      residualMatchedExpectedCandidates: evaluation.residualMatchedExpectedCandidates,
      residualMissedExpectedCandidates: evaluation.residualMissedExpectedCandidates,
      residualMustNot: evaluation.residualMustNot,
      residualMustNotProposeViolations: evaluation.residualMustNotProposeViolations,
      combinedEval: evaluation.combinedEval
    };
  });

  const summary = buildSummary(benchmark, evaluatedCases);
  summary.model = model;
  summary.firstPassReport = firstPassReportPath;
  summary.residualPromptMode = 'grounded-sentence-id';
  await writeJson(path.join(outputDir, 'stage3_discovery_residual_summary.json'), summary);
  await writeJson(
    path.join(outputDir, 'stage3_discovery_residual_report.json'),
    benchmark.map((testCase, index) => ({
      ...testCase,
      ...evaluatedCases[index]
    }))
  );
  await writeJson(path.join(outputDir, 'stage3_discovery_residual_batches.json'), batchReports);

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

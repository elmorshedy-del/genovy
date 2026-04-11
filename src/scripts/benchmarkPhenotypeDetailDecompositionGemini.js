import path from 'node:path';
import {
  ensureDir,
  normalizeText,
  parseArgs,
  readJson,
  writeJson
} from '../lib/genereviewsPipeline.js';
import { runSchemaGuardedPhenotypeDetailDecomposition } from '../lib/phenotypeDetailDecomposition.js';

const DEFAULTS = Object.freeze({
  fixture:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/phenotypeDetailDecompositionBenchmark.json',
  output:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/google-phenotype-decomposition-20260406/gemini_detail_decomposition_benchmark.json',
  models:
    'gemini-2.5-flash,gemini-2.5-flash-lite,gemini-2.5-pro,gemini-3-flash-preview,gemini-3-pro-preview,gemini-3.1-pro-preview,gemini-3.1-flash-lite-preview',
  thinkingBudget: 128
});

function resolveEnvValue(...names) {
  for (const name of names) {
    if (!name) continue;
    const value = process.env[name];
    if (value) return value;
  }
  return '';
}

function normalizeForCompare(value) {
  return normalizeText(value).replace(/\s+/g, ' ').trim();
}

function resolveModelThinkingBudget(model, requestedBudget) {
  if (String(model || '').trim() === 'gemini-2.5-flash-lite') {
    return Math.max(512, requestedBudget);
  }
  return requestedBudget;
}

function matchesAcceptedOption(value, acceptedOptions) {
  const normalized = normalizeForCompare(value);
  return acceptedOptions.some((option) => normalizeForCompare(option) === normalized);
}

function scoreResult(caseDef, result) {
  const expectedDetails = Array.isArray(caseDef.expected_modifier_details) ? caseDef.expected_modifier_details : [];
  const observedDetails = Array.isArray(result?.modifier_details) ? result.modifier_details : [];

  const coreProblemMatched = matchesAcceptedOption(
    result?.core_problem || '',
    Array.isArray(caseDef.accepted_core_problem_options) ? caseDef.accepted_core_problem_options : []
  );

  let matchedExpectedDetailCount = 0;
  const matchedObservedIndexes = new Set();

  for (const expected of expectedDetails) {
    const matchIndex = observedDetails.findIndex((observed, index) => {
      if (matchedObservedIndexes.has(index)) return false;
      if (String(observed?.detail_type || '') !== String(expected.detail_type || '')) return false;
      return matchesAcceptedOption(observed?.value_text || '', expected.accepted_value_options || []);
    });

    if (matchIndex >= 0) {
      matchedExpectedDetailCount += 1;
      matchedObservedIndexes.add(matchIndex);
    }
  }

  const unexpectedDetails = observedDetails.filter((_, index) => !matchedObservedIndexes.has(index));
  const exactDetailMatch = matchedExpectedDetailCount === expectedDetails.length && unexpectedDetails.length === 0;
  const detailRecall = expectedDetails.length === 0 ? 1 : matchedExpectedDetailCount / expectedDetails.length;
  const extraDetailPenalty = unexpectedDetails.length * 0.15;
  const caseScore = Math.max(0, (coreProblemMatched ? 1 : 0) + detailRecall - extraDetailPenalty);

  return {
    candidate_label: caseDef.candidate_label,
    core_problem_expected: caseDef.accepted_core_problem_options,
    core_problem_observed: result?.core_problem || '',
    core_problem_matched: coreProblemMatched,
    expected_modifier_details: expectedDetails,
    observed_modifier_details: observedDetails,
    matched_expected_detail_count: matchedExpectedDetailCount,
    expected_detail_count: expectedDetails.length,
    unexpected_modifier_details: unexpectedDetails,
    exact_detail_match: exactDetailMatch,
    case_score: Number(caseScore.toFixed(4))
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const apiKey = flags.apiKey || resolveEnvValue(flags.apiKeyEnv, 'GOOGLE_API_KEY', 'GEMINI_API_KEY');
  if (!apiKey) throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is required.');

  const fixturePath = flags.fixture || DEFAULTS.fixture;
  const outputPath = flags.output || DEFAULTS.output;
  const models = String(flags.models || DEFAULTS.models)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const thinkingBudget =
    Number.parseInt(flags['thinking-budget'] || flags.thinkingBudget || `${DEFAULTS.thinkingBudget}`, 10) ||
    DEFAULTS.thinkingBudget;
  const fixture = await readJson(fixturePath);
  const cases = Array.isArray(fixture?.cases) ? fixture.cases : [];
  if (!cases.length) throw new Error('Benchmark fixture has no cases.');

  const outputs = [];
  for (const model of models) {
    try {
      const modelThinkingBudget = resolveModelThinkingBudget(model, thinkingBudget);
      const run = await runSchemaGuardedPhenotypeDetailDecomposition({
        apiKey,
        model,
        thinkingBudget: modelThinkingBudget,
        temperature: 0,
        cases
      });

      const normalizedResults = Array.isArray(run.normalized?.results) ? run.normalized.results : [];
      const scoredCases = cases.map((caseDef, index) => scoreResult(caseDef, normalizedResults[index] || null));
      const totalScore = scoredCases.reduce((sum, row) => sum + row.case_score, 0);
      const maxScore = cases.length * 2;

      outputs.push({
        model,
        status: 'ok',
        thinking_budget: modelThinkingBudget,
        primary_usage: run.primary?.usage || null,
        repaired_usage: run.repaired?.usage || null,
        repaired_output_used: Boolean(run.repaired),
        validation_issues: run.normalized?.issues || [],
        total_score: Number(totalScore.toFixed(4)),
        max_nominal_score: maxScore,
        scored_cases: scoredCases,
        normalized_results: normalizedResults
      });
    } catch (error) {
      outputs.push({
        model,
        status: 'error',
        thinking_budget: resolveModelThinkingBudget(model, thinkingBudget),
        error: error.message || String(error),
        total_score: -1,
        max_nominal_score: cases.length * 2,
        scored_cases: [],
        normalized_results: []
      });
    }
  }

  outputs.sort((left, right) => right.total_score - left.total_score);

  await ensureDir(path.dirname(outputPath));
  await writeJson(outputPath, {
    created_at: new Date().toISOString(),
    stage: 'gemini_phenotype_detail_decomposition_benchmark',
    fixture_path: fixturePath,
    case_count: cases.length,
    thinking_budget: thinkingBudget,
    models: outputs
  });

  for (const output of outputs) {
    if (output.status === 'error') {
      console.log(`${output.model}\tstatus=error\tmessage=${output.error}`);
      continue;
    }
    console.log(`${output.model}\ttotal_score=${output.total_score}\trepair_used=${output.repaired_output_used}\tissues=${output.validation_issues.length}`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

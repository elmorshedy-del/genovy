import path from 'node:path';
import { ensureDir, normalizeText, parseArgs, readJson, writeJson } from '../lib/genereviewsPipeline.js';
import { runSchemaGuardedPhenopacketFeatureDecomposition } from '../lib/phenopacketFeatureDecomposition.js';

const DEFAULTS = Object.freeze({
  fixture:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/phenotypeDetailDecompositionBenchmark.json',
  output:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/google-phenotype-decomposition-20260406/gemini_phenopacket_feature_benchmark.json',
  models: 'gemini-2.5-flash,gemini-2.5-pro,gemini-3-flash-preview,gemini-3-pro-preview,gemini-3.1-pro-preview',
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

function matchesAcceptedOption(value, acceptedOptions) {
  const normalized = normalizeForCompare(value);
  return acceptedOptions.some((option) => normalizeForCompare(option) === normalized);
}

function resolveModelThinkingBudget(model, requestedBudget) {
  if (String(model || '').trim() === 'gemini-2.5-flash-lite') {
    return Math.max(512, requestedBudget);
  }
  return requestedBudget;
}

function scoreFeature(caseDef, result) {
  const feature = result?.phenotypic_feature || {};
  const modifiers = Array.isArray(feature.modifiers) ? feature.modifiers : [];
  const coreProblemMatched = matchesAcceptedOption(
    feature?.type?.label || '',
    Array.isArray(caseDef.accepted_core_problem_options) ? caseDef.accepted_core_problem_options : []
  );

  const expectedDetails = Array.isArray(caseDef.expected_modifier_details) ? caseDef.expected_modifier_details : [];
  const matchedIndexes = new Set();
  let matchedExpectedDetailCount = 0;

  for (const expected of expectedDetails) {
    const matchedIndex = modifiers.findIndex((modifier, index) => {
      if (matchedIndexes.has(index)) return false;
      if (String(modifier?.modifier_kind || '') !== String(expected.detail_type || '')) return false;
      return matchesAcceptedOption(modifier?.label || '', expected.accepted_value_options || []);
    });
    if (matchedIndex >= 0) {
      matchedIndexes.add(matchedIndex);
      matchedExpectedDetailCount += 1;
    }
  }

  const severityExpected = expectedDetails.find((detail) => detail.detail_type === 'severity_domain');
  const onsetExpected = expectedDetails.find((detail) => detail.detail_type === 'temporal_qualifier');
  const severityMatched =
    !severityExpected ||
    matchesAcceptedOption(feature?.severity?.label || '', severityExpected.accepted_value_options || []);
  const onsetMatched =
    !onsetExpected ||
    matchesAcceptedOption(feature?.onset?.label || '', onsetExpected.accepted_value_options || []);

  const unexpectedModifiers = modifiers.filter((_, index) => !matchedIndexes.has(index));
  const evidencePresent = Boolean(feature?.evidence?.evidence_text && feature?.evidence?.source_sentence);

  const caseScore =
    (coreProblemMatched ? 1 : 0) +
    (severityMatched ? 0.25 : 0) +
    (onsetMatched ? 0.25 : 0) +
    matchedExpectedDetailCount / Math.max(1, expectedDetails.length) +
    (evidencePresent ? 0.5 : 0) -
    unexpectedModifiers.length * 0.1;

  return {
    candidate_label: caseDef.candidate_label,
    type_label_observed: feature?.type?.label || '',
    core_problem_matched: coreProblemMatched,
    severity_observed: feature?.severity?.label || '',
    onset_observed: feature?.onset?.label || '',
    matched_expected_detail_count: matchedExpectedDetailCount,
    expected_detail_count: expectedDetails.length,
    unexpected_modifiers: unexpectedModifiers,
    evidence_present: evidencePresent,
    case_score: Number(Math.max(0, caseScore).toFixed(4))
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const apiKey = flags.apiKey || resolveEnvValue(flags.apiKeyEnv, 'GOOGLE_API_KEY', 'GEMINI_API_KEY');
  if (!apiKey) throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is required.');

  const fixturePath = flags.fixture || DEFAULTS.fixture;
  const outputPath = flags.output || DEFAULTS.output;
  const thinkingBudget =
    Number.parseInt(flags['thinking-budget'] || flags.thinkingBudget || `${DEFAULTS.thinkingBudget}`, 10) ||
    DEFAULTS.thinkingBudget;
  const models = String(flags.models || DEFAULTS.models)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const fixture = await readJson(fixturePath);
  const cases = Array.isArray(fixture?.cases) ? fixture.cases : [];
  if (!cases.length) throw new Error('Benchmark fixture has no cases.');

  const outputs = [];
  for (const model of models) {
    try {
      const modelThinkingBudget = resolveModelThinkingBudget(model, thinkingBudget);
      const run = await runSchemaGuardedPhenopacketFeatureDecomposition({
        apiKey,
        model,
        thinkingBudget: modelThinkingBudget,
        temperature: 0,
        cases
      });

      const normalizedResults = Array.isArray(run.normalized?.results) ? run.normalized.results : [];
      const scoredCases = cases.map((caseDef, index) => scoreFeature(caseDef, normalizedResults[index] || null));
      const totalScore = scoredCases.reduce((sum, row) => sum + row.case_score, 0);

      outputs.push({
        model,
        status: 'ok',
        thinking_budget: modelThinkingBudget,
        primary_usage: run.primary?.usage || null,
        repaired_usage: run.repaired?.usage || null,
        repaired_output_used: Boolean(run.repaired),
        validation_issues: run.normalized?.issues || [],
        total_score: Number(totalScore.toFixed(4)),
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
        scored_cases: [],
        normalized_results: []
      });
    }
  }

  outputs.sort((left, right) => right.total_score - left.total_score);

  await ensureDir(path.dirname(outputPath));
  await writeJson(outputPath, {
    created_at: new Date().toISOString(),
    stage: 'gemini_phenopacket_feature_benchmark',
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

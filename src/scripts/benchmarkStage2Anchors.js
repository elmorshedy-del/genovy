import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {
  buildClinicalTextStructure,
  buildPhenotypeLexicon,
  extractAnchorOccurrences,
  parseArgs,
  writeJson
} from '../lib/genereviewsPipeline.js';

const DEFAULTS = Object.freeze({
  benchmarkJs: '/Users/ahmedelmorshedy/Downloads/anchor_benchmark (1).js',
  phenotypesJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-latest5-settled-20260330/stage2_anchors_patchcheck_20260401/phenotype_rows_snapshot.json',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage2_anchor_benchmark_20260402',
  maxAnchorWords: 8,
  minIc: 0
});

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

function loadBenchmarkCases(filePath) {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Benchmark file not found: ${resolvedPath}`);
  }
  const code = fs.readFileSync(resolvedPath, 'utf8');
  const context = {
    module: { exports: {} },
    exports: {}
  };
  vm.createContext(context);
  vm.runInContext(`${code}\nthis.__stage2_benchmark_module = module.exports || exports;`, context, {
    filename: resolvedPath
  });
  const loaded = context.__stage2_benchmark_module;
  const benchmark =
    loaded?.ANCHOR_BENCHMARK ||
    loaded?.default ||
    loaded?.anchorBenchmark ||
    loaded;
  if (!Array.isArray(benchmark)) {
    throw new Error(`Benchmark file did not export an array: ${resolvedPath}`);
  }
  return benchmark;
}

function loadPhenotypeRows(filePath) {
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (Array.isArray(payload?.phenotype_rows)) return payload.phenotype_rows;
  if (Array.isArray(payload)) return payload;
  throw new Error(`Could not find phenotype rows in ${filePath}`);
}

function flattenPredictedAnchors(anchorRows) {
  const flattened = [];
  for (const row of anchorRows || []) {
    const occurrences = Array.isArray(row.occurrences) && row.occurrences.length ? row.occurrences : [null];
    for (const occurrence of occurrences) {
      flattened.push({
        hpo_id: row.hpo_id,
        hpo_label: row.hpo_label,
        status: row.status || 'present',
        match_text: occurrence?.match_text || row.hpo_label,
        sentence: occurrence?.sentence || '',
        match_type: occurrence?.match_type || null
      });
    }
  }
  return flattened;
}

function findExpectedAnchorMatch(expectedAnchor, predictedAnchors, consumedIndexes) {
  for (let index = 0; index < predictedAnchors.length; index += 1) {
    if (consumedIndexes.has(index)) continue;
    const predicted = predictedAnchors[index];
    if (predicted.hpo_id !== expectedAnchor.hpo_id) continue;
    if ((predicted.status || 'present') !== (expectedAnchor.status || 'present')) continue;
    if (
      textsComparable(predicted.match_text, expectedAnchor.match_text) ||
      textsComparable(predicted.hpo_label, expectedAnchor.hpo_label) ||
      textsComparable(predicted.match_text, expectedAnchor.hpo_label)
    ) {
      return { index, predicted };
    }
  }
  return null;
}

function findMustNotAnchorViolations(expectedRejected, predictedAnchors, consumedIndexes) {
  const violations = [];
  for (const rejected of expectedRejected || []) {
    const match = predictedAnchors.find((predicted, index) => {
      if (consumedIndexes.has(index)) return false;
      return (
        textsComparable(predicted.match_text, rejected.label) ||
        textsComparable(predicted.hpo_label, rejected.label)
      );
    });
    if (match) {
      violations.push({
        label: rejected.label,
        reason: rejected.reason || 'must_not_anchor',
        predicted_anchor: {
          hpo_id: match.hpo_id,
          hpo_label: match.hpo_label,
          status: match.status,
          match_text: match.match_text
        }
      });
    }
  }
  return violations;
}

function evaluateCase(anchorCase, lexicon, minIc) {
  const structure = buildClinicalTextStructure(anchorCase.sentence || '');
  const predictedRows = extractAnchorOccurrences(structure.paragraphs || [], lexicon, { minIc });
  const predictedAnchors = flattenPredictedAnchors(predictedRows);
  const expectedAnchors = Array.isArray(anchorCase.expectedAnchors) ? anchorCase.expectedAnchors : [];
  const expectedRejected = Array.isArray(anchorCase.expectedRejected) ? anchorCase.expectedRejected : [];

  const consumedIndexes = new Set();
  const matchedExpectedAnchors = [];
  const missedExpectedAnchors = [];

  for (const expectedAnchor of expectedAnchors) {
    const match = findExpectedAnchorMatch(expectedAnchor, predictedAnchors, consumedIndexes);
    if (match) {
      consumedIndexes.add(match.index);
      matchedExpectedAnchors.push({
        expected: expectedAnchor,
        predicted: match.predicted
      });
    } else {
      missedExpectedAnchors.push(expectedAnchor);
    }
  }

  const mustNotAnchorViolations = findMustNotAnchorViolations(expectedRejected, predictedAnchors, consumedIndexes);
  const unexpectedPredictedAnchors = predictedAnchors.filter((_, index) => !consumedIndexes.has(index));

  return {
    id: anchorCase.id,
    category: anchorCase.category,
    sentence: anchorCase.sentence,
    expectedAnchors,
    expectedRejected,
    predictedAnchors,
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

function summarizeResults(results, metadata) {
  const byCategory = new Map();
  let expectedAnchorTotal = 0;
  let matchedExpectedAnchorTotal = 0;
  let mustNotAnchorTotal = 0;
  let mustNotAnchorViolationTotal = 0;
  let unexpectedPredictedAnchorTotal = 0;
  let exactCaseMatchTotal = 0;

  for (const result of results) {
    expectedAnchorTotal += result.expectedAnchors.length;
    matchedExpectedAnchorTotal += result.matchedExpectedAnchors.length;
    mustNotAnchorTotal += result.expectedRejected.length;
    mustNotAnchorViolationTotal += result.mustNotAnchorViolations.length;
    unexpectedPredictedAnchorTotal += result.unexpectedPredictedAnchors.length;
    exactCaseMatchTotal += result.exactCaseMatch ? 1 : 0;

    const bucket = byCategory.get(result.category) || {
      case_total: 0,
      exact_case_matches: 0,
      expected_anchor_total: 0,
      matched_expected_anchor_total: 0,
      must_not_anchor_total: 0,
      must_not_anchor_violation_total: 0,
      unexpected_predicted_anchor_total: 0
    };

    bucket.case_total += 1;
    bucket.exact_case_matches += result.exactCaseMatch ? 1 : 0;
    bucket.expected_anchor_total += result.expectedAnchors.length;
    bucket.matched_expected_anchor_total += result.matchedExpectedAnchors.length;
    bucket.must_not_anchor_total += result.expectedRejected.length;
    bucket.must_not_anchor_violation_total += result.mustNotAnchorViolations.length;
    bucket.unexpected_predicted_anchor_total += result.unexpectedPredictedAnchors.length;
    byCategory.set(result.category, bucket);
  }

  return {
    benchmark_file: metadata.benchmarkFile,
    phenotype_rows_file: metadata.phenotypeRowsFile,
    total_cases: results.length,
    exact_case_matches: exactCaseMatchTotal,
    exact_case_match_rate: results.length ? Number((exactCaseMatchTotal / results.length).toFixed(4)) : 0,
    expected_anchor_total: expectedAnchorTotal,
    matched_expected_anchor_total: matchedExpectedAnchorTotal,
    anchor_recall: expectedAnchorTotal ? Number((matchedExpectedAnchorTotal / expectedAnchorTotal).toFixed(4)) : 0,
    must_not_anchor_total: mustNotAnchorTotal,
    must_not_anchor_violation_total: mustNotAnchorViolationTotal,
    must_not_anchor_pass_rate:
      mustNotAnchorTotal ? Number(((mustNotAnchorTotal - mustNotAnchorViolationTotal) / mustNotAnchorTotal).toFixed(4)) : 1,
    unexpected_predicted_anchor_total: unexpectedPredictedAnchorTotal,
    by_category: Object.fromEntries(
      [...byCategory.entries()].map(([category, bucket]) => [
        category,
        {
          ...bucket,
          exact_case_match_rate: bucket.case_total ? Number((bucket.exact_case_matches / bucket.case_total).toFixed(4)) : 0,
          anchor_recall:
            bucket.expected_anchor_total
              ? Number((bucket.matched_expected_anchor_total / bucket.expected_anchor_total).toFixed(4))
              : 0,
          must_not_anchor_pass_rate:
            bucket.must_not_anchor_total
              ? Number(
                  ((bucket.must_not_anchor_total - bucket.must_not_anchor_violation_total) / bucket.must_not_anchor_total).toFixed(4)
                )
              : 1
        }
      ])
    )
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const benchmarkFile = flags.benchmark || DEFAULTS.benchmarkJs;
  const phenotypeRowsFile = flags.phenotypesJson || DEFAULTS.phenotypesJson;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const maxAnchorWords = Number.parseInt(flags.maxAnchorWords || `${DEFAULTS.maxAnchorWords}`, 10) || DEFAULTS.maxAnchorWords;
  const minIc = Number.parseFloat(flags.minIc || `${DEFAULTS.minIc}`);

  fs.mkdirSync(outputDir, { recursive: true });

  const cases = loadBenchmarkCases(benchmarkFile);
  const phenotypeRows = loadPhenotypeRows(phenotypeRowsFile);
  const lexicon = buildPhenotypeLexicon(phenotypeRows, maxAnchorWords);
  const results = cases.map((anchorCase) => evaluateCase(anchorCase, lexicon, minIc));
  const summary = summarizeResults(results, {
    benchmarkFile,
    phenotypeRowsFile
  });

  const misses = results.filter(
    (result) => !result.exactCaseMatch || result.missedExpectedAnchors.length || result.mustNotAnchorViolations.length
  );

  await writeJson(path.join(outputDir, 'stage2_anchor_benchmark_summary.json'), summary);
  await writeJson(path.join(outputDir, 'stage2_anchor_benchmark_cases.json'), {
    created_at: new Date().toISOString(),
    benchmark_file: benchmarkFile,
    case_count: cases.length,
    cases
  });
  await writeJson(path.join(outputDir, 'stage2_anchor_benchmark_report.json'), {
    created_at: new Date().toISOString(),
    benchmark_file: benchmarkFile,
    phenotype_rows_file: phenotypeRowsFile,
    results
  });
  await writeJson(path.join(outputDir, 'stage2_anchor_benchmark_failures.json'), {
    created_at: new Date().toISOString(),
    failure_count: misses.length,
    failures: misses
  });

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(`[benchmarkStage2Anchors] ${error.stack || error.message}`);
  process.exitCode = 1;
});

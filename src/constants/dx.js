export const DX_QUERY_DEFAULTS = Object.freeze({
  defaultLimit: 10,
  maxLimit: 250,
  minPhenotypeTerms: 1,
  maxPhenotypeTerms: 64,
  cacheTtlMs: 15 * 60 * 1000,
  traceTermsPerDisease: 8
});

export const DX_SIMILARITY_DEFAULTS = Object.freeze({
  rootSimilarityFloor: 0,
  normalizedScorePrecision: 6
});

export const DX_BENCHMARK_DEFAULTS = Object.freeze({
  maxCases: 250,
  minDiseasePhenotypeCount: 5,
  minQueryPhenotypeCount: 3,
  maxQueryPhenotypeCount: 10,
  minCoverageRatio: 0.4,
  maxCoverageRatio: 0.8,
  noisePhenotypeRatio: 0.1,
  recallCutoffs: Object.freeze([1, 5, 10]),
  seed: 20260315
});

export const DX_PHEVAL_DEFAULTS = Object.freeze({
  scoreField: 'normalizedScore',
  recallCutoffs: Object.freeze([1, 5, 10]),
  rawResultsDirname: 'raw_results',
  diseaseResultsDirname: 'pheval_disease_results',
  toolInputCommandsDirname: 'tool_input_commands'
});

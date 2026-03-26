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
  normalizedScorePrecision: 6,
  defaultPhenotypeWeight: 1,
  patientExcludedContradictionPenaltyWeight: 0.3,
  diseaseExcludedContradictionPenaltyWeight: 0.2,
  specificDirectHandoffOverride: Object.freeze({
    enabled: true,
    weightFloor: 1,
    minDirectPhenotypeEdges: 1,
    minExactDirectOverlap: 1
  }),
  frequencyWeights: Object.freeze({
    obligate: 1,
    veryFrequent: 0.95,
    frequent: 0.85,
    occasional: 0.65,
    veryRare: 0.45,
    excluded: 0
  }),
  hpoFrequencyCuries: Object.freeze({
    obligate: 'HP:0040280',
    veryFrequent: 'HP:0040281',
    frequent: 'HP:0040282',
    occasional: 'HP:0040283',
    veryRare: 'HP:0040284',
    excluded: 'HP:0040285'
  })
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

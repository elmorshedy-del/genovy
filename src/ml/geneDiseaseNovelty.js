import fs from 'fs';
import path from 'path';
import { readCsv, writeCsv } from '../lib/csv.js';
import {
  buildGeneDiseaseExampleSummary,
  classifyGeneDiseaseCandidate,
  GENE_DISEASE_RELATION_BUCKETS,
  GENE_DISEASE_SCIENTIFIC_DEFAULTS,
  loadGeneDiseaseScientificContext
} from './geneDiseaseScientificContext.js';

export const GENE_DISEASE_NOVELTY_DEFAULTS = Object.freeze({
  ...GENE_DISEASE_SCIENTIFIC_DEFAULTS,
  topK: 250
});

export const NOVELTY_BUCKETS = GENE_DISEASE_RELATION_BUCKETS;

export const NOVELTY_SCORE_MULTIPLIERS = Object.freeze({
  [NOVELTY_BUCKETS.knownExact]: 0,
  [NOVELTY_BUCKETS.knownEquivalent]: 0,
  [NOVELTY_BUCKETS.underNormalizedDiseaseIdentity]: 0,
  [NOVELTY_BUCKETS.sameFamilyAncestorLink]: 0.2,
  [NOVELTY_BUCKETS.sameFamilyDescendantLink]: 0.2,
  [NOVELTY_BUCKETS.sameFamilySharedAncestor]: 0.25,
  [NOVELTY_BUCKETS.novelCandidate]: 1
});

const RESOLVE_CANDIDATES_QUERY = `
  WITH candidate_pairs AS (
    SELECT *
    FROM jsonb_to_recordset($1::jsonb) AS candidate_pair(
      pair_id TEXT,
      rank INTEGER,
      prediction_score DOUBLE PRECISION,
      gene_concept_id BIGINT,
      gene_curie TEXT,
      gene_label TEXT,
      disease_concept_id BIGINT,
      disease_curie TEXT,
      disease_label TEXT,
      seed_phenotype_count INTEGER,
      seed_phenotype_rarity_score DOUBLE PRECISION,
      shared_phenotype_count INTEGER,
      shared_phenotype_rarity_score DOUBLE PRECISION,
      phenotype_jaccard DOUBLE PRECISION
    )
  )
  SELECT
    candidate_pairs.*,
    COALESCE(candidate_pairs.gene_concept_id, gene_concept.concept_id) AS resolved_gene_concept_id,
    COALESCE(candidate_pairs.disease_concept_id, disease_concept.concept_id) AS resolved_disease_concept_id
  FROM candidate_pairs
  LEFT JOIN canonical_concepts gene_concept
    ON gene_concept.concept_type = 'gene'
    AND gene_concept.canonical_curie = candidate_pairs.gene_curie
  LEFT JOIN canonical_concepts disease_concept
    ON disease_concept.concept_type = 'disease'
    AND disease_concept.canonical_curie = candidate_pairs.disease_curie
`;

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePositiveFloat(value, fallback = 0) {
  const parsed = Number.parseFloat(String(value ?? fallback));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function buildNoveltyAnnotation(candidateRow, context, options = {}) {
  const resolvedOptions = {
    ...GENE_DISEASE_NOVELTY_DEFAULTS,
    ...options
  };
  const classification = classifyGeneDiseaseCandidate(
    {
      geneConceptId: candidateRow.geneConceptId,
      diseaseConceptId: candidateRow.diseaseConceptId
    },
    context,
    resolvedOptions
  );
  const noveltyBucket = classification.relationBucket;
  const predictionScore = parsePositiveFloat(candidateRow.prediction_score);
  const noveltyAdjustedScore = predictionScore * NOVELTY_SCORE_MULTIPLIERS[noveltyBucket];
  const exampleSummary = buildGeneDiseaseExampleSummary(
    classification,
    resolvedOptions.maxExistingExamples
  );

  return {
    ...candidateRow,
    geneConceptId: candidateRow.geneConceptId,
    diseaseConceptId: candidateRow.diseaseConceptId,
    novelty_bucket: noveltyBucket,
    strict_novelty_pass: classification.strictNoveltyPass,
    novelty_adjusted_score: Number(noveltyAdjustedScore.toFixed(6)),
    exact_match_count: classification.exactMatches.length,
    equivalent_match_count: classification.equivalentMatches.length,
    ancestor_match_count: classification.ancestorMatches.length,
    descendant_match_count: classification.descendantMatches.length,
    shared_family_match_count: classification.sharedAncestorMatches.length,
    existing_match_examples: exampleSummary.existingMatchExamples,
    shared_family_examples: exampleSummary.sharedFamilyExamples
  };
}

function buildSummary(annotatedRows) {
  const noveltyBucketCounts = {};
  for (const row of annotatedRows) {
    noveltyBucketCounts[row.novelty_bucket] = (noveltyBucketCounts[row.novelty_bucket] || 0) + 1;
  }

  return {
    inputCandidateCount: annotatedRows.length,
    strictNovelCount: annotatedRows.filter((row) => row.strict_novelty_pass).length,
    sameFamilyCount: annotatedRows.filter((row) =>
      [
        NOVELTY_BUCKETS.sameFamilyAncestorLink,
        NOVELTY_BUCKETS.sameFamilyDescendantLink,
        NOVELTY_BUCKETS.sameFamilySharedAncestor
      ].includes(row.novelty_bucket)
    ).length,
    underNormalizedDiseaseIdentityCount: annotatedRows.filter((row) =>
      row.novelty_bucket === NOVELTY_BUCKETS.underNormalizedDiseaseIdentity
    ).length,
    noveltyBucketCounts
  };
}

function normalizeCandidateRow(rawRow) {
  return {
    rank: parsePositiveInteger(rawRow.rank, 0),
    prediction_score: parsePositiveFloat(rawRow.prediction_score, 0),
    pair_id: rawRow.pair_id,
    geneConceptId: parsePositiveInteger(rawRow.gene_concept_id, 0),
    gene_curie: rawRow.gene_curie,
    gene_label: rawRow.gene_label,
    diseaseConceptId: parsePositiveInteger(rawRow.disease_concept_id, 0),
    disease_curie: rawRow.disease_curie,
    disease_label: rawRow.disease_label,
    seed_phenotype_count: parsePositiveInteger(rawRow.seed_phenotype_count, 0),
    seed_phenotype_rarity_score: parsePositiveFloat(rawRow.seed_phenotype_rarity_score, 0),
    shared_phenotype_count: parsePositiveInteger(rawRow.shared_phenotype_count, 0),
    shared_phenotype_rarity_score: parsePositiveFloat(rawRow.shared_phenotype_rarity_score, 0),
    phenotype_jaccard: parsePositiveFloat(rawRow.phenotype_jaccard, 0)
  };
}

export async function annotateGeneDiseaseNovelty(client, rankedCandidates, options = {}) {
  const resolvedOptions = {
    ...GENE_DISEASE_NOVELTY_DEFAULTS,
    ...options
  };
  const candidateRows = rankedCandidates
    .map(normalizeCandidateRow)
    .sort((left, right) => left.rank - right.rank)
    .slice(0, resolvedOptions.topK);

  if (!candidateRows.length) {
    return {
      annotatedRows: [],
      strictNovelRows: [],
      familyExpansionRows: [],
      summary: buildSummary([])
    };
  }

  const resolvedCandidatesResult = await client.query(
    RESOLVE_CANDIDATES_QUERY,
    [JSON.stringify(candidateRows)]
  );

  const candidateRowByPairId = new Map(candidateRows.map((candidateRow) => [candidateRow.pair_id, candidateRow]));
  const resolvedCandidateRows = resolvedCandidatesResult.rows
    .map((row) => ({
      ...candidateRowByPairId.get(row.pair_id),
      geneConceptId: Number(row.resolved_gene_concept_id || row.gene_concept_id),
      diseaseConceptId: Number(row.resolved_disease_concept_id || row.disease_concept_id)
    }))
    .filter((row) =>
      Number.isFinite(row.geneConceptId)
      && row.geneConceptId > 0
      && Number.isFinite(row.diseaseConceptId)
      && row.diseaseConceptId > 0
    );

  const scientificContext = await loadGeneDiseaseScientificContext(client, {
    geneConceptIds: resolvedCandidateRows.map((row) => row.geneConceptId),
    candidateDiseaseConceptIds: resolvedCandidateRows.map((row) => row.diseaseConceptId),
    options: resolvedOptions
  });

  const annotatedRows = resolvedCandidateRows.map((candidateRow) =>
    buildNoveltyAnnotation(candidateRow, scientificContext, resolvedOptions)
  );

  annotatedRows.sort((left, right) => {
    if (right.novelty_adjusted_score !== left.novelty_adjusted_score) {
      return right.novelty_adjusted_score - left.novelty_adjusted_score;
    }
    return left.rank - right.rank;
  });

  return {
    annotatedRows,
    strictNovelRows: annotatedRows.filter((row) => row.strict_novelty_pass),
    familyExpansionRows: annotatedRows.filter((row) =>
      [
        NOVELTY_BUCKETS.sameFamilyAncestorLink,
        NOVELTY_BUCKETS.sameFamilyDescendantLink,
        NOVELTY_BUCKETS.sameFamilySharedAncestor
      ].includes(row.novelty_bucket)
    ),
    summary: buildSummary(annotatedRows)
  };
}

export function persistGeneDiseaseNoveltyAnalysis(outputDirectory, analysisResult) {
  fs.mkdirSync(outputDirectory, { recursive: true });

  const annotatedCsvPath = path.join(outputDirectory, 'gene_disease_novelty_annotated.csv');
  const strictNovelCsvPath = path.join(outputDirectory, 'gene_disease_novel_candidates.csv');
  const familyExpansionCsvPath = path.join(outputDirectory, 'gene_disease_family_expansion_candidates.csv');
  const summaryPath = path.join(outputDirectory, 'gene_disease_novelty_summary.json');

  const columns = [
    'rank',
    'prediction_score',
    'novelty_adjusted_score',
    'novelty_bucket',
    'strict_novelty_pass',
    'pair_id',
    'geneConceptId',
    'gene_curie',
    'gene_label',
    'diseaseConceptId',
    'disease_curie',
    'disease_label',
    'seed_phenotype_count',
    'seed_phenotype_rarity_score',
    'shared_phenotype_count',
    'shared_phenotype_rarity_score',
    'phenotype_jaccard',
    'exact_match_count',
    'equivalent_match_count',
    'ancestor_match_count',
    'descendant_match_count',
    'shared_family_match_count',
    'existing_match_examples',
    'shared_family_examples'
  ];

  writeCsv(annotatedCsvPath, analysisResult.annotatedRows, columns);
  writeCsv(strictNovelCsvPath, analysisResult.strictNovelRows, columns);
  writeCsv(familyExpansionCsvPath, analysisResult.familyExpansionRows, columns);
  fs.writeFileSync(summaryPath, `${JSON.stringify(analysisResult.summary, null, 2)}\n`, 'utf8');

  return {
    annotatedCsvPath,
    strictNovelCsvPath,
    familyExpansionCsvPath,
    summaryPath
  };
}

export function loadRankedGeneDiseaseCandidates(rankedCandidatesPath) {
  return readCsv(rankedCandidatesPath);
}

import fs from 'fs';
import path from 'path';
import { writeCsv } from '../lib/csv.js';
import {
  classifyGeneDiseaseCandidate,
  GENE_DISEASE_SCIENTIFIC_DEFAULTS,
  loadGeneDiseaseScientificContext
} from './geneDiseaseScientificContext.js';

export const GENE_DISEASE_LINK_DEFAULTS = Object.freeze({
  maxPositiveRows: 30000,
  negativeRatio: 2,
  candidateLimit: 15000,
  seedPhenotypeLimitPerGene: 8,
  candidateSeedLimitPerGene: 80,
  negativePoolBufferMultiplier: 6
});

export const DATASET_METADATA_COLUMNS = Object.freeze([
  'pair_id',
  'label',
  'gene_concept_id',
  'gene_curie',
  'gene_label',
  'disease_concept_id',
  'disease_curie',
  'disease_label'
]);

export const FEATURE_COLUMNS = Object.freeze([
  'seed_phenotype_count',
  'seed_phenotype_rarity_score',
  'shared_phenotype_count',
  'shared_phenotype_rarity_score',
  'phenotype_jaccard',
  'shared_ratio_to_gene',
  'shared_ratio_to_disease',
  'gene_alias_count',
  'gene_member_count',
  'gene_xref_count',
  'gene_phenotype_count',
  'gene_out_degree',
  'disease_alias_count',
  'disease_member_count',
  'disease_xref_count',
  'disease_phenotype_count',
  'disease_lacks_phenotype_count',
  'disease_in_degree',
  'disease_out_degree',
  'disease_trial_count'
]);

const GENE_STATS_CTE = `
  gene_base AS (
    SELECT
      concept_id AS gene_concept_id,
      canonical_curie AS gene_curie,
      canonical_label AS gene_label
    FROM canonical_concepts
    WHERE concept_type = 'gene'
  ),
  gene_alias_counts AS (
    SELECT concept_id AS gene_concept_id, COUNT(*)::INTEGER AS gene_alias_count
    FROM canonical_concept_aliases
    GROUP BY concept_id
  ),
  gene_member_counts AS (
    SELECT concept_id AS gene_concept_id, COUNT(*)::INTEGER AS gene_member_count
    FROM canonical_concept_memberships
    GROUP BY concept_id
  ),
  gene_xref_counts AS (
    SELECT membership.concept_id AS gene_concept_id, COUNT(DISTINCT xref.xref_curie)::INTEGER AS gene_xref_count
    FROM canonical_concept_memberships membership
    INNER JOIN entity_xrefs xref ON xref.entity_id = membership.entity_id
    GROUP BY membership.concept_id
  ),
  gene_phenotype_counts AS (
    SELECT subject_concept_id AS gene_concept_id, COUNT(*)::INTEGER AS gene_phenotype_count
    FROM canonical_relationships
    WHERE predicate_key = 'associated_with_phenotype'
    GROUP BY subject_concept_id
  ),
  gene_out_degree_counts AS (
    SELECT subject_concept_id AS gene_concept_id, COUNT(*)::INTEGER AS gene_out_degree
    FROM canonical_relationships
    GROUP BY subject_concept_id
  ),
  gene_stats AS (
    SELECT
      gene_base.gene_concept_id,
      gene_base.gene_curie,
      gene_base.gene_label,
      COALESCE(gene_alias_counts.gene_alias_count, 0) AS gene_alias_count,
      COALESCE(gene_member_counts.gene_member_count, 0) AS gene_member_count,
      COALESCE(gene_xref_counts.gene_xref_count, 0) AS gene_xref_count,
      COALESCE(gene_phenotype_counts.gene_phenotype_count, 0) AS gene_phenotype_count,
      COALESCE(gene_out_degree_counts.gene_out_degree, 0) AS gene_out_degree
    FROM gene_base
    LEFT JOIN gene_alias_counts
      ON gene_alias_counts.gene_concept_id = gene_base.gene_concept_id
    LEFT JOIN gene_member_counts
      ON gene_member_counts.gene_concept_id = gene_base.gene_concept_id
    LEFT JOIN gene_xref_counts
      ON gene_xref_counts.gene_concept_id = gene_base.gene_concept_id
    LEFT JOIN gene_phenotype_counts
      ON gene_phenotype_counts.gene_concept_id = gene_base.gene_concept_id
    LEFT JOIN gene_out_degree_counts
      ON gene_out_degree_counts.gene_concept_id = gene_base.gene_concept_id
  )
`;

const DISEASE_STATS_CTE = `
  linked_diseases AS (
    SELECT DISTINCT object_concept_id AS disease_concept_id
    FROM canonical_relationships
    WHERE predicate_key = 'associated_with_disease'
  ),
  disease_base AS (
    SELECT
      concept_id AS disease_concept_id,
      canonical_curie AS disease_curie,
      canonical_label AS disease_label
    FROM canonical_concepts
    WHERE concept_type = 'disease'
  ),
  disease_alias_counts AS (
    SELECT concept_id AS disease_concept_id, COUNT(*)::INTEGER AS disease_alias_count
    FROM canonical_concept_aliases
    GROUP BY concept_id
  ),
  disease_member_counts AS (
    SELECT concept_id AS disease_concept_id, COUNT(*)::INTEGER AS disease_member_count
    FROM canonical_concept_memberships
    GROUP BY concept_id
  ),
  disease_xref_counts AS (
    SELECT membership.concept_id AS disease_concept_id, COUNT(DISTINCT xref.xref_curie)::INTEGER AS disease_xref_count
    FROM canonical_concept_memberships membership
    INNER JOIN entity_xrefs xref ON xref.entity_id = membership.entity_id
    GROUP BY membership.concept_id
  ),
  disease_phenotype_counts AS (
    SELECT subject_concept_id AS disease_concept_id, COUNT(*)::INTEGER AS disease_phenotype_count
    FROM canonical_relationships
    WHERE predicate_key = 'has_phenotype'
    GROUP BY subject_concept_id
  ),
  disease_lacks_phenotype_counts AS (
    SELECT subject_concept_id AS disease_concept_id, COUNT(*)::INTEGER AS disease_lacks_phenotype_count
    FROM canonical_relationships
    WHERE predicate_key = 'lacks_phenotype'
    GROUP BY subject_concept_id
  ),
  disease_out_degree_counts AS (
    SELECT subject_concept_id AS disease_concept_id, COUNT(*)::INTEGER AS disease_out_degree
    FROM canonical_relationships
    GROUP BY subject_concept_id
  ),
  disease_in_degree_counts AS (
    SELECT object_concept_id AS disease_concept_id, COUNT(*)::INTEGER AS disease_in_degree
    FROM canonical_relationships
    GROUP BY object_concept_id
  ),
  disease_trial_counts AS (
    SELECT object_concept_id AS disease_concept_id, COUNT(*)::INTEGER AS disease_trial_count
    FROM canonical_relationships
    WHERE predicate_key = 'recruits_for_disease'
    GROUP BY object_concept_id
  ),
  disease_stats AS (
    SELECT
      disease_base.disease_concept_id,
      disease_base.disease_curie,
      disease_base.disease_label,
      COALESCE(disease_alias_counts.disease_alias_count, 0) AS disease_alias_count,
      COALESCE(disease_member_counts.disease_member_count, 0) AS disease_member_count,
      COALESCE(disease_xref_counts.disease_xref_count, 0) AS disease_xref_count,
      COALESCE(disease_phenotype_counts.disease_phenotype_count, 0) AS disease_phenotype_count,
      COALESCE(disease_lacks_phenotype_counts.disease_lacks_phenotype_count, 0) AS disease_lacks_phenotype_count,
      COALESCE(disease_in_degree_counts.disease_in_degree, 0) AS disease_in_degree,
      COALESCE(disease_out_degree_counts.disease_out_degree, 0) AS disease_out_degree,
      COALESCE(disease_trial_counts.disease_trial_count, 0) AS disease_trial_count
    FROM disease_base
    INNER JOIN linked_diseases
      ON linked_diseases.disease_concept_id = disease_base.disease_concept_id
    LEFT JOIN disease_alias_counts
      ON disease_alias_counts.disease_concept_id = disease_base.disease_concept_id
    LEFT JOIN disease_member_counts
      ON disease_member_counts.disease_concept_id = disease_base.disease_concept_id
    LEFT JOIN disease_xref_counts
      ON disease_xref_counts.disease_concept_id = disease_base.disease_concept_id
    LEFT JOIN disease_phenotype_counts
      ON disease_phenotype_counts.disease_concept_id = disease_base.disease_concept_id
    LEFT JOIN disease_lacks_phenotype_counts
      ON disease_lacks_phenotype_counts.disease_concept_id = disease_base.disease_concept_id
    LEFT JOIN disease_in_degree_counts
      ON disease_in_degree_counts.disease_concept_id = disease_base.disease_concept_id
    LEFT JOIN disease_out_degree_counts
      ON disease_out_degree_counts.disease_concept_id = disease_base.disease_concept_id
    LEFT JOIN disease_trial_counts
      ON disease_trial_counts.disease_concept_id = disease_base.disease_concept_id
  )
`;

function buildPhenotypeSupportCte(seedPhenotypeLimitParameter) {
  return `
    phenotype_disease_frequency AS (
      SELECT
        object_concept_id AS phenotype_concept_id,
        COUNT(DISTINCT subject_concept_id)::NUMERIC AS disease_count
      FROM canonical_relationships
      WHERE predicate_key = 'has_phenotype'
      GROUP BY object_concept_id
    ),
    gene_seed_phenotypes AS (
      SELECT
        ranked_seed_phenotypes.gene_concept_id,
        ranked_seed_phenotypes.phenotype_concept_id,
        ranked_seed_phenotypes.disease_count
      FROM (
        SELECT
          gene_rel.subject_concept_id AS gene_concept_id,
          gene_rel.object_concept_id AS phenotype_concept_id,
          COALESCE(freq.disease_count, 999999)::NUMERIC AS disease_count,
          ROW_NUMBER() OVER (
            PARTITION BY gene_rel.subject_concept_id
            ORDER BY COALESCE(freq.disease_count, 999999)::NUMERIC ASC, gene_rel.object_concept_id ASC
          ) AS phenotype_rank
        FROM canonical_relationships gene_rel
        LEFT JOIN phenotype_disease_frequency freq
          ON freq.phenotype_concept_id = gene_rel.object_concept_id
        WHERE gene_rel.predicate_key = 'associated_with_phenotype'
      ) AS ranked_seed_phenotypes
      WHERE ranked_seed_phenotypes.phenotype_rank <= $${seedPhenotypeLimitParameter}
    ),
    candidate_seed_pairs AS (
      SELECT
        gene_seed_phenotypes.gene_concept_id,
        disease_rel.subject_concept_id AS disease_concept_id,
        COUNT(DISTINCT gene_seed_phenotypes.phenotype_concept_id)::INTEGER AS seed_phenotype_count,
        COALESCE(
          SUM(1.0 / NULLIF(gene_seed_phenotypes.disease_count, 0)),
          0
        )::DOUBLE PRECISION AS seed_phenotype_rarity_score
      FROM gene_seed_phenotypes
      INNER JOIN canonical_relationships disease_rel
        ON disease_rel.object_concept_id = gene_seed_phenotypes.phenotype_concept_id
        AND disease_rel.predicate_key = 'has_phenotype'
      INNER JOIN linked_diseases
        ON linked_diseases.disease_concept_id = disease_rel.subject_concept_id
      GROUP BY gene_seed_phenotypes.gene_concept_id, disease_rel.subject_concept_id
    )
  `;
}

function buildPairFeatureCte(pairSourceName) {
  return `
    pair_overlap_features AS (
      SELECT
        pair_source.gene_concept_id,
        pair_source.disease_concept_id,
        COUNT(DISTINCT gene_rel.object_concept_id)::INTEGER AS shared_phenotype_count,
        COALESCE(
          SUM(1.0 / NULLIF(freq.disease_count, 0)),
          0
        )::DOUBLE PRECISION AS shared_phenotype_rarity_score
      FROM ${pairSourceName} AS pair_source
      INNER JOIN canonical_relationships gene_rel
        ON gene_rel.subject_concept_id = pair_source.gene_concept_id
        AND gene_rel.predicate_key = 'associated_with_phenotype'
      INNER JOIN canonical_relationships disease_rel
        ON disease_rel.subject_concept_id = pair_source.disease_concept_id
        AND disease_rel.predicate_key = 'has_phenotype'
        AND disease_rel.object_concept_id = gene_rel.object_concept_id
      LEFT JOIN phenotype_disease_frequency freq
        ON freq.phenotype_concept_id = gene_rel.object_concept_id
      GROUP BY pair_source.gene_concept_id, pair_source.disease_concept_id
    )
  `;
}

function buildFeatureSelect(pairSourceName, pairIdExpression, includeLabel) {
  const labelColumns = includeLabel ? `${pairSourceName}.label,\n    ` : '';
  return `
  SELECT
    ${pairIdExpression} AS pair_id,
    ${labelColumns}gene_stats.gene_concept_id,
    gene_stats.gene_curie,
    gene_stats.gene_label,
    disease_stats.disease_concept_id,
    disease_stats.disease_curie,
    disease_stats.disease_label,
    COALESCE(${pairSourceName}.seed_phenotype_count, 0)::INTEGER AS seed_phenotype_count,
    COALESCE(${pairSourceName}.seed_phenotype_rarity_score, 0)::DOUBLE PRECISION AS seed_phenotype_rarity_score,
    COALESCE(pair_overlap_features.shared_phenotype_count, 0)::INTEGER AS shared_phenotype_count,
    COALESCE(pair_overlap_features.shared_phenotype_rarity_score, 0)::DOUBLE PRECISION AS shared_phenotype_rarity_score,
    CASE
      WHEN (
        gene_stats.gene_phenotype_count
        + disease_stats.disease_phenotype_count
        - COALESCE(pair_overlap_features.shared_phenotype_count, 0)
      ) > 0
      THEN COALESCE(pair_overlap_features.shared_phenotype_count, 0)::DOUBLE PRECISION
        / (
          gene_stats.gene_phenotype_count
          + disease_stats.disease_phenotype_count
          - COALESCE(pair_overlap_features.shared_phenotype_count, 0)
        )::DOUBLE PRECISION
      ELSE 0
    END AS phenotype_jaccard,
    CASE
      WHEN gene_stats.gene_phenotype_count > 0
      THEN COALESCE(pair_overlap_features.shared_phenotype_count, 0)::DOUBLE PRECISION
        / gene_stats.gene_phenotype_count::DOUBLE PRECISION
      ELSE 0
    END AS shared_ratio_to_gene,
    CASE
      WHEN disease_stats.disease_phenotype_count > 0
      THEN COALESCE(pair_overlap_features.shared_phenotype_count, 0)::DOUBLE PRECISION
        / disease_stats.disease_phenotype_count::DOUBLE PRECISION
      ELSE 0
    END AS shared_ratio_to_disease,
    gene_stats.gene_alias_count,
    gene_stats.gene_member_count,
    gene_stats.gene_xref_count,
    gene_stats.gene_phenotype_count,
    gene_stats.gene_out_degree,
    disease_stats.disease_alias_count,
    disease_stats.disease_member_count,
    disease_stats.disease_xref_count,
    disease_stats.disease_phenotype_count,
    disease_stats.disease_lacks_phenotype_count,
    disease_stats.disease_in_degree,
    disease_stats.disease_out_degree,
    disease_stats.disease_trial_count
  FROM ${pairSourceName}
  INNER JOIN gene_stats
    ON gene_stats.gene_concept_id = ${pairSourceName}.gene_concept_id
  INNER JOIN disease_stats
    ON disease_stats.disease_concept_id = ${pairSourceName}.disease_concept_id
  LEFT JOIN pair_overlap_features
    ON pair_overlap_features.gene_concept_id = ${pairSourceName}.gene_concept_id
    AND pair_overlap_features.disease_concept_id = ${pairSourceName}.disease_concept_id
`;
}

const TRAINING_QUERY = `
  WITH
  ${GENE_STATS_CTE},
  ${DISEASE_STATS_CTE},
  ${buildPhenotypeSupportCte(3)},
  positive_links AS (
    SELECT
      rel.subject_concept_id AS gene_concept_id,
      rel.object_concept_id AS disease_concept_id,
      ROW_NUMBER() OVER (
        ORDER BY rel.source_relationship_count DESC, rel.subject_concept_id ASC, rel.object_concept_id ASC
      ) AS positive_rank
    FROM canonical_relationships rel
    INNER JOIN gene_stats
      ON gene_stats.gene_concept_id = rel.subject_concept_id
    INNER JOIN disease_stats
      ON disease_stats.disease_concept_id = rel.object_concept_id
    WHERE rel.predicate_key = 'associated_with_disease'
  ),
  selected_positive_links AS (
    SELECT
      positive_links.gene_concept_id,
      positive_links.disease_concept_id,
      COALESCE(candidate_seed_pairs.seed_phenotype_count, 0)::INTEGER AS seed_phenotype_count,
      COALESCE(candidate_seed_pairs.seed_phenotype_rarity_score, 0)::DOUBLE PRECISION AS seed_phenotype_rarity_score
    FROM positive_links
    LEFT JOIN candidate_seed_pairs
      ON candidate_seed_pairs.gene_concept_id = positive_links.gene_concept_id
      AND candidate_seed_pairs.disease_concept_id = positive_links.disease_concept_id
    WHERE positive_rank <= $1
  ),
  ranked_negative_seed_pairs AS (
    SELECT
      candidate_seed_pairs.gene_concept_id,
      candidate_seed_pairs.disease_concept_id,
      candidate_seed_pairs.seed_phenotype_count,
      candidate_seed_pairs.seed_phenotype_rarity_score,
      ROW_NUMBER() OVER (
        PARTITION BY candidate_seed_pairs.gene_concept_id
        ORDER BY
          candidate_seed_pairs.seed_phenotype_count DESC,
          candidate_seed_pairs.seed_phenotype_rarity_score DESC,
          candidate_seed_pairs.disease_concept_id ASC
      ) AS gene_seed_rank
    FROM candidate_seed_pairs
    LEFT JOIN selected_positive_links
      ON selected_positive_links.gene_concept_id = candidate_seed_pairs.gene_concept_id
      AND selected_positive_links.disease_concept_id = candidate_seed_pairs.disease_concept_id
    WHERE selected_positive_links.gene_concept_id IS NULL
  ),
  negative_seed_pool AS (
    SELECT
      ranked_negative_seed_pairs.gene_concept_id,
      ranked_negative_seed_pairs.disease_concept_id,
      ranked_negative_seed_pairs.seed_phenotype_count,
      ranked_negative_seed_pairs.seed_phenotype_rarity_score
    FROM ranked_negative_seed_pairs
    WHERE ranked_negative_seed_pairs.gene_seed_rank <= $4
  ),
  selected_negative_links AS (
    SELECT
      negative_seed_pool.gene_concept_id,
      negative_seed_pool.disease_concept_id,
      negative_seed_pool.seed_phenotype_count,
      negative_seed_pool.seed_phenotype_rarity_score
    FROM negative_seed_pool
    ORDER BY
      negative_seed_pool.seed_phenotype_count DESC,
      negative_seed_pool.seed_phenotype_rarity_score DESC,
      negative_seed_pool.gene_concept_id ASC,
      negative_seed_pool.disease_concept_id ASC
    LIMIT $2
  ),
  training_pairs AS (
    SELECT
      selected_positive_links.gene_concept_id,
      selected_positive_links.disease_concept_id,
      1 AS label,
      selected_positive_links.seed_phenotype_count,
      selected_positive_links.seed_phenotype_rarity_score
    FROM selected_positive_links
    UNION ALL
    SELECT
      selected_negative_links.gene_concept_id,
      selected_negative_links.disease_concept_id,
      0 AS label,
      selected_negative_links.seed_phenotype_count,
      selected_negative_links.seed_phenotype_rarity_score
    FROM selected_negative_links
  ),
  ${buildPairFeatureCte('training_pairs')}
  ${buildFeatureSelect(
    'training_pairs',
    `md5(
      training_pairs.gene_concept_id::TEXT
      || ':'
      || training_pairs.disease_concept_id::TEXT
      || ':'
      || training_pairs.label::TEXT
    )`,
    true
  )}
  ORDER BY training_pairs.label DESC, shared_phenotype_count DESC, pair_id ASC
`;

const CANDIDATE_QUERY = `
  WITH
  ${GENE_STATS_CTE},
  ${DISEASE_STATS_CTE},
  ${buildPhenotypeSupportCte(2)},
  known_links AS (
    SELECT
      rel.subject_concept_id AS gene_concept_id,
      rel.object_concept_id AS disease_concept_id
    FROM canonical_relationships rel
    INNER JOIN gene_stats
      ON gene_stats.gene_concept_id = rel.subject_concept_id
    INNER JOIN disease_stats
      ON disease_stats.disease_concept_id = rel.object_concept_id
    WHERE rel.predicate_key = 'associated_with_disease'
  ),
  ranked_candidate_seed_pairs AS (
    SELECT
      candidate_seed_pairs.gene_concept_id,
      candidate_seed_pairs.disease_concept_id,
      candidate_seed_pairs.seed_phenotype_count,
      candidate_seed_pairs.seed_phenotype_rarity_score,
      ROW_NUMBER() OVER (
        PARTITION BY candidate_seed_pairs.gene_concept_id
        ORDER BY
          candidate_seed_pairs.seed_phenotype_count DESC,
          candidate_seed_pairs.seed_phenotype_rarity_score DESC,
          candidate_seed_pairs.disease_concept_id ASC
      ) AS gene_seed_rank
    FROM candidate_seed_pairs
    LEFT JOIN known_links
      ON known_links.gene_concept_id = candidate_seed_pairs.gene_concept_id
      AND known_links.disease_concept_id = candidate_seed_pairs.disease_concept_id
    WHERE known_links.gene_concept_id IS NULL
  ),
  candidate_pairs AS (
    SELECT
      ranked_candidate_seed_pairs.gene_concept_id,
      ranked_candidate_seed_pairs.disease_concept_id,
      ranked_candidate_seed_pairs.seed_phenotype_count,
      ranked_candidate_seed_pairs.seed_phenotype_rarity_score
    FROM ranked_candidate_seed_pairs
    WHERE ranked_candidate_seed_pairs.gene_seed_rank <= $3
    ORDER BY
      ranked_candidate_seed_pairs.seed_phenotype_count DESC,
      ranked_candidate_seed_pairs.seed_phenotype_rarity_score DESC,
      ranked_candidate_seed_pairs.gene_concept_id ASC,
      ranked_candidate_seed_pairs.disease_concept_id ASC
    LIMIT $1
  ),
  ${buildPairFeatureCte('candidate_pairs')}
  ${buildFeatureSelect(
    'candidate_pairs',
    `md5(
      candidate_pairs.gene_concept_id::TEXT
      || ':'
      || candidate_pairs.disease_concept_id::TEXT
    )`,
    false
  )}
  ORDER BY shared_phenotype_count DESC, shared_phenotype_rarity_score DESC, pair_id ASC
`;

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePositiveFloat(value, fallback) {
  const parsed = Number.parseFloat(String(value ?? fallback));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function filterScientificNegativeRows(negativeRows, scientificContext, options = {}) {
  const resolvedOptions = {
    ...GENE_DISEASE_SCIENTIFIC_DEFAULTS,
    negativeRowLimit: negativeRows.length,
    ...options
  };
  const exclusionBucketCounts = {};
  const scientificallyEligibleRows = [];

  for (const row of negativeRows) {
    const classification = classifyGeneDiseaseCandidate(
      {
        geneConceptId: Number(row.gene_concept_id),
        diseaseConceptId: Number(row.disease_concept_id)
      },
      scientificContext,
      resolvedOptions
    );

    if (classification.strictNoveltyPass) {
      scientificallyEligibleRows.push(row);
      continue;
    }

    exclusionBucketCounts[classification.relationBucket] =
      (exclusionBucketCounts[classification.relationBucket] || 0) + 1;
  }

  return {
    selectedRows: scientificallyEligibleRows.slice(0, resolvedOptions.negativeRowLimit),
    scientificallyEligibleRowCount: scientificallyEligibleRows.length,
    scientificExcludedRowCount: negativeRows.length - scientificallyEligibleRows.length,
    exclusionBucketCounts
  };
}

export async function exportGeneDiseaseLinkDataset(client, options = {}) {
  const maxPositiveRows = parsePositiveInteger(
    options.maxPositiveRows,
    GENE_DISEASE_LINK_DEFAULTS.maxPositiveRows
  );
  const negativeRatio = parsePositiveFloat(
    options.negativeRatio,
    GENE_DISEASE_LINK_DEFAULTS.negativeRatio
  );
  const negativeRowLimit = Math.max(1, Math.round(maxPositiveRows * negativeRatio));
  const candidateLimit = parsePositiveInteger(
    options.candidateLimit,
    GENE_DISEASE_LINK_DEFAULTS.candidateLimit
  );
  const seedPhenotypeLimitPerGene = parsePositiveInteger(
    options.seedPhenotypeLimitPerGene,
    GENE_DISEASE_LINK_DEFAULTS.seedPhenotypeLimitPerGene
  );
  const candidateSeedLimitPerGene = parsePositiveInteger(
    options.candidateSeedLimitPerGene,
    GENE_DISEASE_LINK_DEFAULTS.candidateSeedLimitPerGene
  );
  const negativePoolBufferMultiplier = parsePositiveInteger(
    options.negativePoolBufferMultiplier,
    GENE_DISEASE_LINK_DEFAULTS.negativePoolBufferMultiplier
  );
  const bufferedNegativePoolLimit = Math.max(
    negativeRowLimit,
    negativeRowLimit * negativePoolBufferMultiplier
  );

  const queryParameters = [
    maxPositiveRows,
    bufferedNegativePoolLimit,
    seedPhenotypeLimitPerGene,
    candidateSeedLimitPerGene
  ];

  const trainingRowsResult = await client.query(TRAINING_QUERY, queryParameters);
  const candidateRowsResult = await client.query(CANDIDATE_QUERY, [
    candidateLimit,
    seedPhenotypeLimitPerGene,
    candidateSeedLimitPerGene
  ]);

  const rawTrainingRows = trainingRowsResult.rows;
  const candidateRows = candidateRowsResult.rows;
  const positiveTrainingRows = rawTrainingRows.filter((row) => Number(row.label) === 1);
  const negativeTrainingRows = rawTrainingRows.filter((row) => Number(row.label) === 0);
  const scientificContext = await loadGeneDiseaseScientificContext(client, {
    geneConceptIds: rawTrainingRows.map((row) => row.gene_concept_id),
    candidateDiseaseConceptIds: negativeTrainingRows.map((row) => row.disease_concept_id),
    options
  });
  const filteredNegativeRows = filterScientificNegativeRows(
    negativeTrainingRows,
    scientificContext,
    {
      ...options,
      negativeRowLimit
    }
  );
  const trainingRows = positiveTrainingRows.concat(filteredNegativeRows.selectedRows);

  return {
    trainingRows,
    candidateRows,
    metadata: {
      featureColumns: FEATURE_COLUMNS,
      datasetColumns: [...DATASET_METADATA_COLUMNS, ...FEATURE_COLUMNS],
      maxPositiveRows,
      negativeRatio,
      negativeRowLimit,
      negativePoolBufferMultiplier,
      bufferedNegativePoolLimit,
      candidateLimit,
      seedPhenotypeLimitPerGene,
      candidateSeedLimitPerGene,
      trainingRowCount: trainingRows.length,
      positiveRowCount: positiveTrainingRows.length,
      negativeRowCount: filteredNegativeRows.selectedRows.length,
      rawNegativePoolRowCount: negativeTrainingRows.length,
      scientificallyEligibleNegativeRowCount: filteredNegativeRows.scientificallyEligibleRowCount,
      scientificExcludedNegativeRowCount: filteredNegativeRows.scientificExcludedRowCount,
      negativeScientificExclusionCounts: filteredNegativeRows.exclusionBucketCounts,
      candidateRowCount: candidateRows.length
    }
  };
}

export function persistGeneDiseaseLinkDataset(outputDirectory, exportResult) {
  ensureDirectory(outputDirectory);

  const trainingCsvPath = path.join(outputDirectory, 'gene_disease_train.csv');
  const candidateCsvPath = path.join(outputDirectory, 'gene_disease_candidates.csv');
  const metadataPath = path.join(outputDirectory, 'gene_disease_dataset_metadata.json');

  writeCsv(trainingCsvPath, exportResult.trainingRows, [...DATASET_METADATA_COLUMNS, ...FEATURE_COLUMNS]);
  writeCsv(
    candidateCsvPath,
    exportResult.candidateRows,
    DATASET_METADATA_COLUMNS.filter((column) => column !== 'label').concat(FEATURE_COLUMNS)
  );
  fs.writeFileSync(metadataPath, `${JSON.stringify(exportResult.metadata, null, 2)}\n`, 'utf8');

  return {
    trainingCsvPath,
    candidateCsvPath,
    metadataPath
  };
}

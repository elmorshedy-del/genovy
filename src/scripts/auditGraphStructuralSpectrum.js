import fs from 'node:fs/promises';
import path from 'node:path';
import { assertRequiredEnv } from '../config/env.js';
import { withClient } from '../db/pool.js';

const DEFAULT_OUTPUT_DIR = path.resolve('output/ops');

const BASELINE_STRUCTURAL_BUCKET_COUNTS = Object.freeze({
  totalLogicalGenes: 5705,
  hollowShell: 23,
  sparseOneSided: 426,
  poorlyEnrichedTwoSided: 777,
  betterCovered: 4479
});

const BASELINE_POORLY_ENRICHED_CUTOFFS = Object.freeze({
  diseaseLinkCountMax: 3,
  phenotypeLinkCountMax: 19
});

const CLINVAR_DERIVED_EVIDENCE_TYPE = 'clinvar_variant_derived';

function parseArgs(argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const nextToken = argv[index + 1];
    if (!nextToken || nextToken.startsWith('--')) {
      flags[key] = true;
      continue;
    }

    flags[key] = nextToken;
    index += 1;
  }
  return flags;
}

function resolveOutputPath(outputDir, fileName) {
  return path.isAbsolute(fileName) ? fileName : path.join(outputDir, fileName);
}

function buildOutputPaths(flags) {
  const outputDir = flags['output-dir'] ? path.resolve(flags['output-dir']) : DEFAULT_OUTPUT_DIR;
  const runLabel = String(flags['run-label'] || 'graph-structural-spectrum-post-clinvar').trim();
  return {
    outputDir,
    summaryJson: resolveOutputPath(outputDir, `${runLabel}.summary.json`),
    genesJson: resolveOutputPath(outputDir, `${runLabel}.genes.json`),
    markdown: resolveOutputPath(outputDir, `${runLabel}.md`)
  };
}

function toNumber(value) {
  return Number.parseInt(String(value || '0'), 10) || 0;
}

function formatPercent(count, total) {
  if (!total) {
    return 0;
  }
  return Number(((count / total) * 100).toFixed(2));
}

function percentileDisc(sortedValues, percentile) {
  if (!sortedValues.length) {
    return 0;
  }
  const bounded = Math.min(Math.max(percentile, 0), 1);
  const index = Math.max(0, Math.ceil(sortedValues.length * bounded) - 1);
  return sortedValues[index];
}

function classifyBucket(gene, cutoffs) {
  const { diseaseLinkCount, phenotypeLinkCount } = gene;
  if (diseaseLinkCount === 0 && phenotypeLinkCount === 0) {
    return 'hollow_shell';
  }
  if (diseaseLinkCount === 0 || phenotypeLinkCount === 0) {
    return 'sparse_one_sided';
  }
  if (
    diseaseLinkCount <= cutoffs.diseaseLinkCountMax &&
    phenotypeLinkCount <= cutoffs.phenotypeLinkCountMax
  ) {
    return 'poorly_enriched_two_sided';
  }
  return 'better_covered';
}

function buildBucketSummary(genes, cutoffs) {
  const counts = {
    hollow_shell: 0,
    sparse_one_sided: 0,
    poorly_enriched_two_sided: 0,
    better_covered: 0
  };

  for (const gene of genes) {
    counts[classifyBucket(gene, cutoffs)] += 1;
  }

  return {
    cutoffs,
    totalLogicalGenes: genes.length,
    buckets: {
      hollowShell: {
        count: counts.hollow_shell,
        sharePct: formatPercent(counts.hollow_shell, genes.length)
      },
      sparseOneSided: {
        count: counts.sparse_one_sided,
        sharePct: formatPercent(counts.sparse_one_sided, genes.length)
      },
      poorlyEnrichedTwoSided: {
        count: counts.poorly_enriched_two_sided,
        sharePct: formatPercent(counts.poorly_enriched_two_sided, genes.length)
      },
      betterCovered: {
        count: counts.better_covered,
        sharePct: formatPercent(counts.better_covered, genes.length)
      }
    }
  };
}

function buildDeltaVsBaseline(summary) {
  return {
    totalLogicalGenes: summary.totalLogicalGenes - BASELINE_STRUCTURAL_BUCKET_COUNTS.totalLogicalGenes,
    hollowShell: summary.buckets.hollowShell.count - BASELINE_STRUCTURAL_BUCKET_COUNTS.hollowShell,
    sparseOneSided: summary.buckets.sparseOneSided.count - BASELINE_STRUCTURAL_BUCKET_COUNTS.sparseOneSided,
    poorlyEnrichedTwoSided:
      summary.buckets.poorlyEnrichedTwoSided.count - BASELINE_STRUCTURAL_BUCKET_COUNTS.poorlyEnrichedTwoSided,
    betterCovered: summary.buckets.betterCovered.count - BASELINE_STRUCTURAL_BUCKET_COUNTS.betterCovered
  };
}

function buildProvenanceSlice(genes) {
  const genesWithClinvarVariantDerivedDiseaseSupport = genes.filter(
    (gene) => gene.clinvarVariantDerivedDiseaseLinkCount > 0
  );
  const genesWhoseOnlyDiseaseSupportIsClinvarVariantDerived = genesWithClinvarVariantDerivedDiseaseSupport.filter(
    (gene) => gene.diseaseLinkCount > 0 && gene.diseaseLinkCount === gene.clinvarVariantDerivedDiseaseLinkCount
  );

  return {
    genesWithClinvarVariantDerivedDiseaseSupport: genesWithClinvarVariantDerivedDiseaseSupport.length,
    genesWhoseOnlyDiseaseSupportIsClinvarVariantDerived:
      genesWhoseOnlyDiseaseSupportIsClinvarVariantDerived.length,
    genesWithClinvarVariantDerivedAndPhenotypeSupport: genesWithClinvarVariantDerivedDiseaseSupport.filter(
      (gene) => gene.phenotypeLinkCount > 0
    ).length
  };
}

function buildMarkdownReport(report) {
  const baseline = report.baselineAligned;
  const currentQuartile = report.currentQuartileAligned;
  return [
    '# Graph Structural Spectrum Audit',
    '',
    `Run label: ${report.runLabel}`,
    `Generated at: ${report.generatedAt}`,
    '',
    '## Baseline-Aligned Structural Spectrum',
    '',
    '| Bucket | Count | Share | Delta vs prior audit |',
    '| --- | ---: | ---: | ---: |',
    `| Hollow shell | ${baseline.buckets.hollowShell.count} | ${baseline.buckets.hollowShell.sharePct}% | ${report.deltaVsBaseline.hollowShell} |`,
    `| Sparse one-sided | ${baseline.buckets.sparseOneSided.count} | ${baseline.buckets.sparseOneSided.sharePct}% | ${report.deltaVsBaseline.sparseOneSided} |`,
    `| Poorly enriched two-sided | ${baseline.buckets.poorlyEnrichedTwoSided.count} | ${baseline.buckets.poorlyEnrichedTwoSided.sharePct}% | ${report.deltaVsBaseline.poorlyEnrichedTwoSided} |`,
    `| Better covered | ${baseline.buckets.betterCovered.count} | ${baseline.buckets.betterCovered.sharePct}% | ${report.deltaVsBaseline.betterCovered} |`,
    '',
    `Cutoffs used: disease links <= ${baseline.cutoffs.diseaseLinkCountMax}, phenotype links <= ${baseline.cutoffs.phenotypeLinkCountMax}`,
    '',
    '## Current Quartile Reference',
    '',
    `Two-sided Q1 disease cutoff: ${currentQuartile.cutoffs.diseaseLinkCountMax}`,
    `Two-sided Q1 phenotype cutoff: ${currentQuartile.cutoffs.phenotypeLinkCountMax}`,
    '',
    '## ClinVar-Derived Disease Support Slice',
    '',
    `Genes with ClinVar-derived disease support: ${report.provenanceSlice.genesWithClinvarVariantDerivedDiseaseSupport}`,
    `Genes whose only disease support is ClinVar-derived: ${report.provenanceSlice.genesWhoseOnlyDiseaseSupportIsClinvarVariantDerived}`,
    `Genes with ClinVar-derived disease support and phenotype support: ${report.provenanceSlice.genesWithClinvarVariantDerivedAndPhenotypeSupport}`,
    '',
    '## Evidence Boundaries',
    '',
    '- Inspected: canonical gene concepts, normalized-label matched live gene entities, live relationship counts for associated_with_disease and associated_with_phenotype, relationship evidence flags for clinvar_variant_derived.',
    '- Not inspected: raw ClinVar rows, raw HPO files, per-gene manual curation quality, benchmark phenopackets.',
    '- Confidence: high for structural counts; structural thinness is still not the same as clinical benchmark failure.'
  ].join('\n');
}

async function loadGeneSupportRows(client) {
  const result = await client.query(
    `
      SELECT
        gene.concept_id,
        gene.normalized_label AS logical_gene_key,
        COALESCE(
          gene.canonical_curie,
          MIN(CASE WHEN entity_gene.canonical_curie LIKE 'NCBIGene:%' THEN entity_gene.canonical_curie END),
          MIN(entity_gene.canonical_curie)
        ) AS gene_curie,
        gene.canonical_label AS gene_label,
        COUNT(
          DISTINCT CASE
            WHEN rel.predicate_key = 'associated_with_disease'
              AND object_entity.entity_type = 'disease'
              AND object_entity.is_placeholder = FALSE
            THEN object_entity.entity_id
            ELSE NULL
          END
        ) AS disease_link_count,
        COUNT(
          DISTINCT CASE
            WHEN rel.predicate_key = 'associated_with_phenotype'
              AND object_entity.entity_type = 'phenotype'
            THEN object_entity.entity_id
            ELSE NULL
          END
        ) AS phenotype_link_count,
        COUNT(
          DISTINCT CASE
            WHEN rel.predicate_key = 'associated_with_disease'
              AND object_entity.entity_type = 'disease'
              AND object_entity.is_placeholder = FALSE
              AND derived_evidence.relationship_id IS NOT NULL
            THEN object_entity.entity_id
            ELSE NULL
          END
        ) AS clinvar_variant_derived_disease_link_count
      FROM canonical_concepts gene
      LEFT JOIN entities entity_gene
        ON entity_gene.entity_type = 'gene'
       AND entity_gene.is_placeholder = FALSE
       AND entity_gene.normalized_label = gene.normalized_label
      LEFT JOIN relationships rel
        ON rel.subject_entity_id = entity_gene.entity_id
       AND rel.predicate_key IN ('associated_with_disease', 'associated_with_phenotype')
      LEFT JOIN entities object_entity
        ON object_entity.entity_id = rel.object_entity_id
      LEFT JOIN LATERAL (
        SELECT relationship_id
        FROM relationship_evidence
        WHERE relationship_id = rel.relationship_id
          AND evidence_type = $1
        LIMIT 1
      ) AS derived_evidence
        ON TRUE
      WHERE gene.concept_type = 'gene'
      GROUP BY gene.concept_id, gene.normalized_label, gene.canonical_curie, gene.canonical_label
      ORDER BY gene.canonical_label ASC, gene.concept_id ASC
    `,
    [CLINVAR_DERIVED_EVIDENCE_TYPE]
  );

  return result.rows.map((row) => ({
    conceptId: toNumber(row.concept_id),
    logicalGeneKey: row.logical_gene_key || '',
    geneCurie: row.gene_curie || '',
    geneLabel: row.gene_label || '',
    diseaseLinkCount: toNumber(row.disease_link_count),
    phenotypeLinkCount: toNumber(row.phenotype_link_count),
    clinvarVariantDerivedDiseaseLinkCount: toNumber(row.clinvar_variant_derived_disease_link_count)
  }));
}

async function main() {
  assertRequiredEnv({ requireAdminToken: false });
  const flags = parseArgs(process.argv.slice(2));
  const outputPaths = buildOutputPaths(flags);
  await fs.mkdir(outputPaths.outputDir, { recursive: true });

  const genes = await withClient((client) => loadGeneSupportRows(client));
  const twoSidedGenes = genes.filter((gene) => gene.diseaseLinkCount > 0 && gene.phenotypeLinkCount > 0);
  const sortedTwoSidedDiseaseCounts = [...twoSidedGenes].map((gene) => gene.diseaseLinkCount).sort((a, b) => a - b);
  const sortedTwoSidedPhenotypeCounts = [...twoSidedGenes]
    .map((gene) => gene.phenotypeLinkCount)
    .sort((a, b) => a - b);

  const currentQuartileCutoffs = Object.freeze({
    diseaseLinkCountMax: percentileDisc(sortedTwoSidedDiseaseCounts, 0.25),
    phenotypeLinkCountMax: percentileDisc(sortedTwoSidedPhenotypeCounts, 0.25)
  });

  const baselineAligned = buildBucketSummary(genes, BASELINE_POORLY_ENRICHED_CUTOFFS);
  const currentQuartileAligned = buildBucketSummary(genes, currentQuartileCutoffs);

  const report = {
    runLabel: String(flags['run-label'] || 'graph-structural-spectrum-post-clinvar'),
    generatedAt: new Date().toISOString(),
    baselineReference: {
      bucketCounts: BASELINE_STRUCTURAL_BUCKET_COUNTS,
      poorlyEnrichedCutoffs: BASELINE_POORLY_ENRICHED_CUTOFFS
    },
    baselineAligned,
    deltaVsBaseline: buildDeltaVsBaseline(baselineAligned),
    currentQuartileAligned,
    provenanceSlice: buildProvenanceSlice(genes)
  };

  await fs.writeFile(outputPaths.summaryJson, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(outputPaths.genesJson, `${JSON.stringify(genes, null, 2)}\n`);
  await fs.writeFile(outputPaths.markdown, `${buildMarkdownReport(report)}\n`);

  console.log(
    JSON.stringify(
      {
        outputPaths,
        report
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error('[audit-graph-structural-spectrum] failed:', error);
  process.exit(1);
});

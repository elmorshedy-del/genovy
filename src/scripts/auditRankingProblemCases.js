import fs from 'node:fs/promises';
import path from 'node:path';
import { withClient } from '../db/pool.js';
import { extractDxPhenotypeInput, validateDxPhenotypeInput } from '../lib/phenopackets.js';
import { loadDxSimilarityIndex, rankGenesByPhenotypeSimilarity } from '../services/dx/similarityEngine.js';
import { extractTruthGeneKeys, normalizeGeneKey, parseArgs } from './lib/shadowBenchmarkUtils.js';

const DEFAULTS = Object.freeze({
  phenopacketDir: '/Users/ahmedelmorshedy/Genovy/output/pheval-official-sample-100/phenopackets',
  benchmarkJson: '/Users/ahmedelmorshedy/Genovy/output/official-benchmark-post-clinvar-run54.json',
  outputJson: '/Users/ahmedelmorshedy/Genovy/output/ranked-output-audit-ranking-problem-cases-20260324.json',
  outputMd: '/Users/ahmedelmorshedy/Genovy/output/ranked-output-audit-ranking-problem-cases-20260324.md',
  topCompetitors: 20,
  rankingLimit: 10000
});

const TARGET_CASES = Object.freeze([
  {
    caseId: 'PMID_33731876_fam421',
    truthGene: 'SCN2A'
  },
  {
    caseId: 'PMID_36331550_Family16Patient21',
    truthGene: 'SPTAN1'
  },
  {
    caseId: 'PMID_37761890_41',
    truthGene: 'PPP2R1A'
  },
  {
    caseId: 'PMID_37761890_43',
    truthGene: 'PPP2R1A'
  },
  {
    caseId: 'PMID_30580808_Lo_twin_2-Fam-52',
    truthGene: 'SMARCC2'
  }
]);

function buildBenchmarkReferenceMap(report) {
  return new Map(
    (report?.per_case || []).map((row) => [
      row.case_id,
      {
        current_genovy_rank: row.genovy_rank ?? null,
        baseline_genovy_rank: row.baseline_genovy_rank ?? null,
        exomiser_rank: row.exomiser_rank ?? null
      }
    ])
  );
}

function buildDiseaseProfileMaps(index) {
  const profileByCurie = new Map();
  const directPhenotypeSetByCurie = new Map();
  const propagatedOnlyPhenotypeSetByCurie = new Map();

  for (const profile of index.diseaseProfiles) {
    profileByCurie.set(profile.entityCurie, profile);
    const directSet = new Set();
    const propagatedOnlySet = new Set();

    for (const phenotype of profile.phenotypes) {
      if (phenotype.edgeOrigin === 'propagated') {
        propagatedOnlySet.add(phenotype.phenotypeCurie);
      } else {
        directSet.add(phenotype.phenotypeCurie);
      }
    }

    for (const curie of directSet) {
      propagatedOnlySet.delete(curie);
    }

    directPhenotypeSetByCurie.set(profile.entityCurie, directSet);
    propagatedOnlyPhenotypeSetByCurie.set(profile.entityCurie, propagatedOnlySet);
  }

  return { profileByCurie, directPhenotypeSetByCurie, propagatedOnlyPhenotypeSetByCurie };
}

function buildChildCountMap(rows) {
  return new Map(rows.map((row) => [row.disease_curie, Number(row.child_count || 0)]));
}

function supportDiseaseKind(childCount) {
  return childCount > 0 ? 'umbrella' : 'leaf';
}

function supportEvidenceMode(row) {
  const directCount = row.supportingDiseaseDirectPhenotypeCount || 0;
  const propagatedCount = row.supportingDiseasePropagatedPhenotypeCount || 0;
  if (directCount > 0 && propagatedCount > 0) return 'mixed';
  if (directCount > 0) return 'direct';
  if (propagatedCount > 0) return 'propagated-only';
  return 'none';
}

function countOverlap(patientPhenotypeSet, diseasePhenotypeSet) {
  if (!diseasePhenotypeSet) return 0;
  let count = 0;
  for (const phenotypeCurie of patientPhenotypeSet) {
    if (diseasePhenotypeSet.has(phenotypeCurie)) {
      count += 1;
    }
  }
  return count;
}

function findTruthRow(rows, truthGeneKeys) {
  const truthSet = new Set(truthGeneKeys);
  return (
    rows.find((row) =>
      [
        normalizeGeneKey(row.geneSymbol),
        normalizeGeneKey(row.geneLabel),
        normalizeGeneKey(row.geneCurie),
        normalizeGeneKey(row.geneIdentifier)
      ].some((key) => truthSet.has(key))
    ) || null
  );
}

function buildCompetitorRow({
  row,
  patientPhenotypeSet,
  childCountMap,
  profileByCurie,
  directPhenotypeSetByCurie,
  propagatedOnlyPhenotypeSetByCurie
}) {
  const supportDiseaseCurie = row.supportingDiseaseCurie || '';
  const supportDiseaseProfile = profileByCurie.get(supportDiseaseCurie) || null;
  const supportDiseaseChildCount = childCountMap.get(supportDiseaseCurie) || 0;
  const exactDirectOverlapCount = countOverlap(
    patientPhenotypeSet,
    directPhenotypeSetByCurie.get(supportDiseaseCurie) || new Set()
  );
  const exactPropagatedOnlyOverlapCount = countOverlap(
    patientPhenotypeSet,
    propagatedOnlyPhenotypeSetByCurie.get(supportDiseaseCurie) || new Set()
  );

  return {
    rank: row.rank,
    geneCurie: row.geneCurie,
    geneLabel: row.geneLabel,
    normalizedScore: row.normalizedScore,
    directNormalizedScore: row.directNormalizedScore,
    diseaseSupportScore: row.diseaseSupportScore,
    supportingDiseaseCurie: supportDiseaseCurie,
    supportingDiseaseLabel: row.supportingDiseaseLabel || '',
    supportingDiseaseEvidenceMode: supportEvidenceMode(row),
    supportingDiseaseKind: supportDiseaseKind(supportDiseaseChildCount),
    supportingDiseaseChildCount: supportDiseaseChildCount,
    supportingDiseaseDirectPhenotypeCount: row.supportingDiseaseDirectPhenotypeCount || 0,
    supportingDiseasePropagatedPhenotypeCount: row.supportingDiseasePropagatedPhenotypeCount || 0,
    supportingDiseasePhenotypeCount: supportDiseaseProfile?.phenotypes.length || 0,
    exactDirectOverlapCount,
    exactPropagatedOnlyOverlapCount,
    matchedPhenotypeCount: row.matchedPhenotypeCount || 0
  };
}

function buildPatternSummary(topCompetitors, truthRank) {
  const rowsAboveTruth =
    truthRank == null ? topCompetitors : topCompetitors.filter((row) => row.rank < truthRank);

  return {
    competitorCountInspected: topCompetitors.length,
    competitorsAboveTruthCount: rowsAboveTruth.length,
    broadPropagatedZeroDirectCount: rowsAboveTruth.filter(
      (row) =>
        row.supportingDiseaseKind === 'umbrella' &&
        row.supportingDiseaseEvidenceMode === 'propagated-only' &&
        row.exactDirectOverlapCount === 0 &&
        row.exactPropagatedOnlyOverlapCount > 0
    ).length,
    specificDirectMatchCount: rowsAboveTruth.filter(
      (row) =>
        row.supportingDiseaseKind === 'leaf' &&
        row.supportingDiseaseEvidenceMode !== 'propagated-only' &&
        row.exactDirectOverlapCount > 0
    ).length,
    noSupportDiseaseCount: rowsAboveTruth.filter((row) => !row.supportingDiseaseCurie).length
  };
}

function buildCaseMarkdown(caseAudit) {
  const lines = [
    `## ${caseAudit.case_id}`,
    '',
    `Truth gene: ${caseAudit.truth_gene}`,
    `Current Genovy rank: ${caseAudit.reference_current_genovy_rank ?? 'miss'}`,
    `Full-rank truth position: ${caseAudit.truth_gene_row?.rank ?? 'not ranked'}`,
    `Exomiser rank: ${caseAudit.exomiser_rank ?? 'miss'}`,
    `Patient present terms: ${caseAudit.patient_present_phenotype_count}`,
    `Patient excluded terms: ${caseAudit.patient_excluded_phenotype_count}`,
    '',
    'Pattern summary:',
    `- competitors inspected: ${caseAudit.pattern_summary.competitorCountInspected}`,
    `- competitors above truth: ${caseAudit.pattern_summary.competitorsAboveTruthCount}`,
    `- broad propagated zero-direct competitors above truth: ${caseAudit.pattern_summary.broadPropagatedZeroDirectCount}`,
    `- specific direct-match competitors above truth: ${caseAudit.pattern_summary.specificDirectMatchCount}`,
    `- competitors with no support disease above truth: ${caseAudit.pattern_summary.noSupportDiseaseCount}`,
    '',
    '| Rank | Gene | Score | Support disease | Mode | Kind | Direct overlap | Prop-only overlap | Direct terms | Prop terms |',
    '|---:|---|---:|---|---|---|---:|---:|---:|---:|'
  ];

  for (const row of caseAudit.top_competitors) {
    lines.push(
      `| ${row.rank} | ${row.geneLabel} | ${row.normalizedScore} | ${row.supportingDiseaseCurie || ''} ${row.supportingDiseaseLabel || ''} | ${row.supportingDiseaseEvidenceMode} | ${row.supportingDiseaseKind} | ${row.exactDirectOverlapCount} | ${row.exactPropagatedOnlyOverlapCount} | ${row.supportingDiseaseDirectPhenotypeCount} | ${row.supportingDiseasePropagatedPhenotypeCount} |`
    );
  }

  if (caseAudit.truth_gene_row && caseAudit.truth_gene_row.rank > caseAudit.top_competitors.length) {
    const row = caseAudit.truth_gene_row;
    lines.push('', 'Truth row outside top 20:', '');
    lines.push(
      `- rank ${row.rank}: ${row.geneLabel} via ${row.supportingDiseaseCurie || 'no support disease'} (${row.supportingDiseaseEvidenceMode}, ${row.supportingDiseaseKind}), direct overlap ${row.exactDirectOverlapCount}, propagated-only overlap ${row.exactPropagatedOnlyOverlapCount}`
    );
  }

  return lines.join('\n');
}

async function loadChildCountRows() {
  return withClient(async (client) => {
    const result = await client.query(`
      SELECT
        parent.canonical_curie AS disease_curie,
        COUNT(*)::int AS child_count
      FROM relationships rel
      JOIN entities child ON child.entity_id = rel.subject_entity_id
      JOIN entities parent ON parent.entity_id = rel.object_entity_id
      WHERE rel.predicate_key = 'is_a'
        AND child.entity_type = 'disease'
        AND parent.entity_type = 'disease'
      GROUP BY parent.canonical_curie
    `);
    return result.rows;
  });
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const config = {
    phenopacketDir: flags['phenopacket-dir'] || DEFAULTS.phenopacketDir,
    benchmarkJson: flags['benchmark-json'] || DEFAULTS.benchmarkJson,
    outputJson: flags['output-json'] || DEFAULTS.outputJson,
    outputMd: flags['output-md'] || DEFAULTS.outputMd,
    topCompetitors: Number.parseInt(String(flags['top-competitors'] || DEFAULTS.topCompetitors), 10),
    rankingLimit: Number.parseInt(String(flags['ranking-limit'] || DEFAULTS.rankingLimit), 10)
  };

  const benchmarkReference = buildBenchmarkReferenceMap(
    JSON.parse(await fs.readFile(config.benchmarkJson, 'utf8'))
  );
  const [index, childCountRows] = await Promise.all([
    withClient((client) => loadDxSimilarityIndex(client, { forceRefresh: true })),
    loadChildCountRows()
  ]);
  const childCountMap = buildChildCountMap(childCountRows);
  const { profileByCurie, directPhenotypeSetByCurie, propagatedOnlyPhenotypeSetByCurie } =
    buildDiseaseProfileMaps(index);

  const casesById = new Map(TARGET_CASES.map((row) => [row.caseId, row]));
  const caseAudits = [];
  const phenopacketFiles = (await fs.readdir(config.phenopacketDir)).filter((name) => name.endsWith('.json')).sort();

  for (const fileName of phenopacketFiles) {
    const caseId = fileName.replace(/\.json$/, '');
    const target = casesById.get(caseId);
    if (!target) continue;

    const payload = JSON.parse(await fs.readFile(path.join(config.phenopacketDir, fileName), 'utf8'));
    const phenopacket = payload?.phenopacket || payload;
    const input = extractDxPhenotypeInput({ phenopacket });
    if (validateDxPhenotypeInput(input)) continue;

    const truthGeneKeys = extractTruthGeneKeys(phenopacket);
    const patientPhenotypeSet = new Set(input.presentPhenotypeCuries);
    const ranking = rankGenesByPhenotypeSimilarity(index, {
      phenotypeCuries: input.presentPhenotypeCuries,
      excludedPhenotypeCuries: input.excludedPhenotypeCuries,
      limit: config.rankingLimit
    });
    const topCompetitors = ranking.results.slice(0, config.topCompetitors).map((row) =>
      buildCompetitorRow({
        row,
        patientPhenotypeSet,
        childCountMap,
        profileByCurie,
        directPhenotypeSetByCurie,
        propagatedOnlyPhenotypeSetByCurie
      })
    );
    const truthRowRaw = findTruthRow(ranking.results, truthGeneKeys);
    const truthGeneRow = truthRowRaw
      ? buildCompetitorRow({
          row: truthRowRaw,
          patientPhenotypeSet,
          childCountMap,
          profileByCurie,
          directPhenotypeSetByCurie,
          propagatedOnlyPhenotypeSetByCurie
        })
      : null;
    const reference = benchmarkReference.get(caseId) || {};

    caseAudits.push({
      case_id: caseId,
      truth_gene: target.truthGene,
      truth_gene_keys: truthGeneKeys,
      patient_present_phenotype_count: input.presentPhenotypeCuries.length,
      patient_excluded_phenotype_count: input.excludedPhenotypeCuries.length,
      patient_present_phenotype_curies: input.presentPhenotypeCuries,
      reference_current_genovy_rank: reference.current_genovy_rank ?? null,
      reference_baseline_genovy_rank: reference.baseline_genovy_rank ?? null,
      exomiser_rank: reference.exomiser_rank ?? null,
      top_competitors: topCompetitors,
      truth_gene_row: truthGeneRow,
      pattern_summary: buildPatternSummary(topCompetitors, truthGeneRow?.rank ?? null)
    });
  }

  caseAudits.sort((left, right) => left.case_id.localeCompare(right.case_id));

  const report = {
    created_at: new Date().toISOString(),
    benchmark_json: config.benchmarkJson,
    top_competitors_limit: config.topCompetitors,
    ranking_limit: config.rankingLimit,
    target_cases: TARGET_CASES,
    case_audits: caseAudits
  };

  const markdown = [
    '# Ranked Output Audit For Ranking-Problem Cases',
    '',
    `Created: ${report.created_at}`,
    `Top competitors inspected per case: ${config.topCompetitors}`,
    '',
    ...caseAudits.flatMap((caseAudit) => [buildCaseMarkdown(caseAudit), ''])
  ].join('\n');

  await fs.writeFile(config.outputJson, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(config.outputMd, `${markdown}\n`);

  console.log(
    JSON.stringify(
      {
        outputJson: config.outputJson,
        outputMd: config.outputMd,
        caseCount: caseAudits.length
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error('[audit-ranking-problem-cases] failed:', error);
  process.exit(1);
});

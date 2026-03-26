import fs from 'node:fs/promises';
import path from 'node:path';
import { withClient } from '../db/pool.js';
import { extractDxPhenotypeInput, validateDxPhenotypeInput } from '../lib/phenopackets.js';
import {
  computeDiseaseSupportEvidenceWeight,
  loadDxSimilarityIndex,
  rankDiseasesByPhenotypeSimilarity,
  rankGenesByPhenotypeSimilarity,
  shouldReplaceSupportingDisease
} from '../services/dx/similarityEngine.js';
import {
  buildShadowMarkdown,
  compareBaselineVsShadow,
  extractTruthGeneKeys,
  findTruthRank,
  normalizeGeneKey,
  parseArgs,
  summarizeRun,
  topMoves
} from './lib/shadowBenchmarkUtils.js';

const DEFAULTS = Object.freeze({
  phenopacketDir: '/Users/ahmedelmorshedy/Genovy/output/pheval-official-sample-100/phenopackets',
  benchmarkJson: '/Users/ahmedelmorshedy/Genovy/output/official-benchmark-post-clinvar-run54.json',
  outputJson: '/Users/ahmedelmorshedy/Genovy/output/shadow-generic-specific-direct-handoff-floor-20260325.json',
  outputMd: '/Users/ahmedelmorshedy/Genovy/output/shadow-generic-specific-direct-handoff-floor-20260325.md',
  limit: 100,
  overrideWeightFloor: 0.9
});

function roundScore(value) {
  return Number((value || 0).toFixed(6));
}

function buildBenchmarkReferenceMap(report) {
  if (!report?.per_case || !Array.isArray(report.per_case)) {
    return new Map();
  }
  return new Map(
    report.per_case.map((row) => [
      row.case_id,
      {
        current_genovy_rank: row.genovy_rank ?? null,
        exomiser_rank: row.exomiser_rank ?? null
      }
    ])
  );
}

function countExactOverlap(patientTerms, phenotypeRows, { directOnly = false } = {}) {
  const patientSet = new Set(patientTerms);
  let overlap = 0;
  for (const row of phenotypeRows || []) {
    if (directOnly && row.edgeOrigin === 'propagated') continue;
    if (patientSet.has(row.phenotypeCurie)) {
      overlap += 1;
    }
  }
  return overlap;
}

function chooseBestSupportCandidate(candidates) {
  if (!candidates.length) return null;
  let bestCandidate = candidates[0];
  for (let index = 1; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    if (shouldReplaceSupportingDisease(bestCandidate, candidate)) {
      bestCandidate = candidate;
    }
  }
  return bestCandidate;
}

function buildEmptyGeneRow(candidate) {
  return {
    rank: 0,
    geneCurie: candidate?.geneCurie || '',
    geneLabel: candidate?.geneLabel || candidate?.geneCurie || '',
    geneSymbol: candidate?.geneLabel || candidate?.geneCurie || '',
    geneEntityId: candidate?.geneEntityId || 0,
    bmaScore: 0,
    normalizedScore: 0,
    patientAverageScore: 0,
    phenotypeAverageScore: 0,
    directPhenotypeCount: 0,
    matchedPhenotypeCount: 0,
    trace: [],
    directNormalizedScore: 0,
    diseaseSupportScore: 0,
    supportingDiseaseEvidenceWeight: 0,
    supportingDiseaseCurie: '',
    supportingDiseaseLabel: '',
    supportingDiseaseClassification: '',
    supportingDiseaseDirectPhenotypeCount: 0,
    supportingDiseasePropagatedPhenotypeCount: 0
  };
}

function buildSupportCandidate(link, diseaseResult, diseaseProfile, patientTerms, overrideWeightFloor) {
  const directPhenotypeEdgeCount = diseaseResult.profileDirectPhenotypeCount || 0;
  const propagatedPhenotypeEdgeCount = diseaseResult.profilePropagatedPhenotypeCount || 0;
  const phenotypeCount =
    diseaseResult.phenotypeCount || directPhenotypeEdgeCount + propagatedPhenotypeEdgeCount;
  const evidenceWeight = computeDiseaseSupportEvidenceWeight({
    normalizedScore: diseaseResult.normalizedScore,
    phenotypeCount,
    matchedPhenotypeCount: diseaseResult.matchedPhenotypeCount,
    directPhenotypeEdgeCount,
    propagatedPhenotypeEdgeCount
  });
  const exactDirectPatientOverlap = countExactOverlap(patientTerms, diseaseProfile?.phenotypes, { directOnly: true });
  const overrideApplied =
    directPhenotypeEdgeCount > 0 &&
    exactDirectPatientOverlap > 0 &&
    (link.supportWeight || 0) < overrideWeightFloor;
  const supportWeight = overrideApplied ? overrideWeightFloor : link.supportWeight || 0;

  return {
    geneCurie: link.geneCurie,
    geneLabel: link.geneLabel,
    geneEntityId: link.geneEntityId,
    diseaseCurie: link.diseaseCurie,
    diseaseLabel: link.diseaseLabel,
    classification: link.classification || '',
    supportWeight,
    originalSupportWeight: link.supportWeight || 0,
    overrideApplied,
    evidenceWeight,
    normalizedScore: diseaseResult.normalizedScore,
    diseaseSupportScore: roundScore(diseaseResult.normalizedScore * supportWeight * evidenceWeight),
    directPhenotypeEdgeCount,
    propagatedPhenotypeEdgeCount,
    exactPatientOverlap: countExactOverlap(patientTerms, diseaseProfile?.phenotypes),
    exactDirectPatientOverlap
  };
}

function buildShadowGeneRanking(index, { phenotypeCuries, excludedPhenotypeCuries = [], limit, overrideWeightFloor }) {
  const directOnlyIndex = {
    ...index,
    geneDiseaseSupportIndex: new Map()
  };
  const directRanking = rankGenesByPhenotypeSimilarity(directOnlyIndex, {
    phenotypeCuries,
    excludedPhenotypeCuries,
    limit: index.totalGenes || limit
  });
  const diseaseRanking = rankDiseasesByPhenotypeSimilarity(index, {
    phenotypeCuries,
    excludedPhenotypeCuries,
    limit: index.totalDiseases || limit
  });
  const diseaseProfileMap = new Map(index.diseaseProfiles.map((profile) => [profile.entityCurie, profile]));
  const directRowsByGeneKey = new Map();
  const supportCandidatesByGeneKey = new Map();
  const stats = {
    support_candidates_with_override: 0,
    genes_with_override_applied: 0
  };

  for (const row of directRanking.results) {
    const geneKey = normalizeGeneKey(row.geneCurie) || normalizeGeneKey(row.geneLabel);
    if (!geneKey) continue;
    directRowsByGeneKey.set(geneKey, { ...row });
  }

  for (const diseaseResult of diseaseRanking.results) {
    const links = index.geneDiseaseSupportIndex.get(diseaseResult.diseaseCurie) || [];
    if (!links.length) continue;
    const diseaseProfile = diseaseProfileMap.get(diseaseResult.diseaseCurie);
    for (const link of links) {
      const geneKey = normalizeGeneKey(link.geneCurie) || normalizeGeneKey(link.geneLabel);
      if (!geneKey) continue;
      if (!supportCandidatesByGeneKey.has(geneKey)) {
        supportCandidatesByGeneKey.set(geneKey, []);
      }
      const candidate = buildSupportCandidate(link, diseaseResult, diseaseProfile, phenotypeCuries, overrideWeightFloor);
      if (candidate.overrideApplied) {
        stats.support_candidates_with_override += 1;
      }
      supportCandidatesByGeneKey.get(geneKey).push(candidate);
    }
  }

  const allGeneKeys = new Set([...directRowsByGeneKey.keys(), ...supportCandidatesByGeneKey.keys()]);
  const shadowResults = [];

  for (const geneKey of allGeneKeys) {
    const directRow = directRowsByGeneKey.get(geneKey);
    const supportCandidates = supportCandidatesByGeneKey.get(geneKey) || [];
    const shadowSupport = chooseBestSupportCandidate(supportCandidates);
    if (shadowSupport?.overrideApplied) {
      stats.genes_with_override_applied += 1;
    }
    const baseRow = directRow ? { ...directRow } : buildEmptyGeneRow(shadowSupport);
    baseRow.diseaseSupportScore = shadowSupport?.diseaseSupportScore || 0;
    baseRow.supportingDiseaseEvidenceWeight = shadowSupport?.evidenceWeight || 0;
    baseRow.supportingDiseaseCurie = shadowSupport?.diseaseCurie || '';
    baseRow.supportingDiseaseLabel = shadowSupport?.diseaseLabel || '';
    baseRow.supportingDiseaseClassification = shadowSupport?.classification || '';
    baseRow.supportingDiseaseDirectPhenotypeCount = shadowSupport?.directPhenotypeEdgeCount || 0;
    baseRow.supportingDiseasePropagatedPhenotypeCount = shadowSupport?.propagatedPhenotypeEdgeCount || 0;
    baseRow.normalizedScore = roundScore(
      Math.max(baseRow.directNormalizedScore || 0, baseRow.diseaseSupportScore || 0)
    );
    baseRow._shadowSupport = shadowSupport || null;
    shadowResults.push(baseRow);
  }

  const cappedLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : DEFAULTS.limit;
  const rankedResults = shadowResults
    .sort((left, right) => {
      if (right.normalizedScore !== left.normalizedScore) {
        return right.normalizedScore - left.normalizedScore;
      }
      if ((right.directNormalizedScore || 0) !== (left.directNormalizedScore || 0)) {
        return (right.directNormalizedScore || 0) - (left.directNormalizedScore || 0);
      }
      if ((right.diseaseSupportScore || 0) !== (left.diseaseSupportScore || 0)) {
        return (right.diseaseSupportScore || 0) - (left.diseaseSupportScore || 0);
      }
      return String(left.geneLabel || '').localeCompare(String(right.geneLabel || ''));
    })
    .slice(0, cappedLimit)
    .map((result, indexValue) => ({
      ...result,
      rank: indexValue + 1
    }));

  return {
    results: rankedResults,
    stats
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const config = {
    phenopacketDir: flags['phenopacket-dir'] || DEFAULTS.phenopacketDir,
    benchmarkJson: flags['benchmark-json'] || DEFAULTS.benchmarkJson,
    outputJson: flags['output-json'] || DEFAULTS.outputJson,
    outputMd: flags['output-md'] || DEFAULTS.outputMd,
    limit: Number.parseInt(String(flags.limit || DEFAULTS.limit), 10),
    overrideWeightFloor: Number(flags['override-weight-floor'] || DEFAULTS.overrideWeightFloor)
  };

  const benchmarkReference = buildBenchmarkReferenceMap(
    JSON.parse(await fs.readFile(config.benchmarkJson, 'utf8'))
  );
  const index = await withClient((client) => loadDxSimilarityIndex(client, { forceRefresh: true }));
  const phenopacketFiles = (await fs.readdir(config.phenopacketDir)).filter((name) => name.endsWith('.json')).sort();

  const baselineRanks = {};
  const shadowRanks = {};
  const perCase = [];
  const aggregateStats = {
    support_candidates_with_override: 0,
    genes_with_override_applied: 0
  };

  for (let indexValue = 0; indexValue < phenopacketFiles.length; indexValue += 1) {
    const fileName = phenopacketFiles[indexValue];
    const payload = JSON.parse(await fs.readFile(path.join(config.phenopacketDir, fileName), 'utf8'));
    const phenopacket = payload?.phenopacket || payload;
    const input = extractDxPhenotypeInput({ phenopacket });
    if (validateDxPhenotypeInput(input)) continue;

    const caseId = fileName.replace(/\.json$/, '');
    const truthGeneKeys = extractTruthGeneKeys(phenopacket);
    const baseline = rankGenesByPhenotypeSimilarity(index, {
      phenotypeCuries: input.presentPhenotypeCuries,
      excludedPhenotypeCuries: input.excludedPhenotypeCuries,
      limit: config.limit
    });
    const shadow = buildShadowGeneRanking(index, {
      phenotypeCuries: input.presentPhenotypeCuries,
      excludedPhenotypeCuries: input.excludedPhenotypeCuries,
      limit: config.limit,
      overrideWeightFloor: config.overrideWeightFloor
    });

    baselineRanks[caseId] = findTruthRank(baseline.results, truthGeneKeys);
    shadowRanks[caseId] = findTruthRank(shadow.results, truthGeneKeys);
    aggregateStats.support_candidates_with_override += shadow.stats.support_candidates_with_override;
    aggregateStats.genes_with_override_applied += shadow.stats.genes_with_override_applied;

    const reference = benchmarkReference.get(caseId) || {};
    const baselineTruthRow =
      baseline.results.find((row) => findTruthRank([row], truthGeneKeys) != null) || null;
    const shadowTruthRow =
      shadow.results.find((row) => findTruthRank([row], truthGeneKeys) != null) || null;

    perCase.push({
      case_id: caseId,
      truth_gene_keys: truthGeneKeys,
      baseline_rank: baselineRanks[caseId],
      shadow_rank: shadowRanks[caseId],
      exomiser_rank: reference.exomiser_rank ?? null,
      reference_current_genovy_rank: reference.current_genovy_rank ?? null,
      baseline_supporting_disease_curie: baselineTruthRow?.supportingDiseaseCurie || '',
      shadow_supporting_disease_curie: shadowTruthRow?.supportingDiseaseCurie || '',
      override_applied: Boolean(shadowTruthRow?._shadowSupport?.overrideApplied)
    });

    console.log(
      `[${indexValue + 1}/${phenopacketFiles.length}] ${fileName} baseline=${baselineRanks[caseId] ?? 'miss'} shadow=${shadowRanks[caseId] ?? 'miss'}`
    );
  }

  const baselineSummary = summarizeRun(baselineRanks);
  const shadowSummary = summarizeRun(shadowRanks);
  const deltas = compareBaselineVsShadow(perCase);
  const metadataLines = [
    `Support handoff floor: ${config.overrideWeightFloor}`,
    `Support candidates with override: ${aggregateStats.support_candidates_with_override}`,
    `Genes with override-applied winning support: ${aggregateStats.genes_with_override_applied}`
  ];

  const report = {
    experiment: 'shadow-generic-specific-direct-handoff-floor',
    title: 'Shadow Generic Specific Direct Handoff Floor',
    created_at: new Date().toISOString(),
    metadata_lines: metadataLines,
    baseline_summary: baselineSummary,
    shadow_summary: shadowSummary,
    delta_vs_baseline: deltas,
    top_improvements: topMoves(perCase, 'improved'),
    top_regressions: topMoves(perCase, 'worsened'),
    per_case: perCase
  };

  await fs.writeFile(config.outputJson, `${JSON.stringify(report, null, 2)}\n`);
  const markdown = buildShadowMarkdown({
    title: report.title,
    createdAt: report.created_at,
    baselineSummary,
    shadowSummary,
    deltas,
    metadataLines
  });
  await fs.writeFile(config.outputMd, `${markdown}\n`);

  console.log(`JSON_OUT=${config.outputJson}`);
  console.log(`MD_OUT=${config.outputMd}`);
}

main().catch((error) => {
  console.error('[shadow-generic-specific-direct-handoff-floor] failed:', error);
  process.exit(1);
});

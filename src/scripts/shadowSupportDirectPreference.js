import fs from 'node:fs/promises';
import path from 'node:path';
import { DX_SIMILARITY_DEFAULTS } from '../constants/dx.js';
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
  selectShardFiles,
  summarizeRun,
  topMoves
} from './lib/shadowBenchmarkUtils.js';

const DEFAULTS = Object.freeze({
  phenopacketDir: '/Users/ahmedelmorshedy/Genovy/output/pheval-official-sample-100/phenopackets',
  outputJson: '/Users/ahmedelmorshedy/Genovy/output/shadow-support-direct-preference.json',
  outputMd: '/Users/ahmedelmorshedy/Genovy/output/shadow-support-direct-preference.md',
  limit: 100,
  shardIndex: 0,
  shardCount: 1
});

function roundScore(value) {
  return Number((value || 0).toFixed(DX_SIMILARITY_DEFAULTS.normalizedScorePrecision));
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

function buildSupportCandidate(link, diseaseResult, diseaseProfile, patientTerms) {
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
  const supportWeight = link.supportWeight || 0;

  return {
    geneCurie: link.geneCurie,
    geneLabel: link.geneLabel,
    geneEntityId: link.geneEntityId,
    diseaseCurie: link.diseaseCurie,
    diseaseLabel: link.diseaseLabel,
    classification: link.classification || '',
    supportWeight,
    evidenceWeight,
    normalizedScore: diseaseResult.normalizedScore,
    diseaseSupportScore: roundScore(diseaseResult.normalizedScore * supportWeight * evidenceWeight),
    directPhenotypeEdgeCount,
    propagatedPhenotypeEdgeCount,
    exactPatientOverlap: countExactOverlap(patientTerms, diseaseProfile?.phenotypes),
    exactDirectPatientOverlap: countExactOverlap(patientTerms, diseaseProfile?.phenotypes, { directOnly: true })
  };
}

function buildShadowGeneRanking(index, { phenotypeCuries, excludedPhenotypeCuries = [], limit }) {
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
      supportCandidatesByGeneKey
        .get(geneKey)
        .push(buildSupportCandidate(link, diseaseResult, diseaseProfile, phenotypeCuries));
    }
  }

  let genesWithDirectExactAlternative = 0;
  let genesWithPropagatedWinnerVetoed = 0;
  let vetoedPropagatedOnlySupportCandidates = 0;

  const allGeneKeys = new Set([...directRowsByGeneKey.keys(), ...supportCandidatesByGeneKey.keys()]);
  const shadowResults = [];

  for (const geneKey of allGeneKeys) {
    const directRow = directRowsByGeneKey.get(geneKey);
    const supportCandidates = supportCandidatesByGeneKey.get(geneKey) || [];
    const baselineSupport = chooseBestSupportCandidate(supportCandidates);
    const hasDirectExactAlternative = supportCandidates.some(
      (candidate) =>
        (candidate.directPhenotypeEdgeCount || 0) > 0 && (candidate.exactDirectPatientOverlap || 0) > 0
    );

    let shadowCandidates = supportCandidates;
    if (hasDirectExactAlternative) {
      genesWithDirectExactAlternative += 1;
      shadowCandidates = supportCandidates.filter((candidate) => (candidate.directPhenotypeEdgeCount || 0) > 0);
      vetoedPropagatedOnlySupportCandidates += supportCandidates.length - shadowCandidates.length;
    }

    const shadowSupport = chooseBestSupportCandidate(shadowCandidates);
    if (
      hasDirectExactAlternative &&
      baselineSupport &&
      shadowSupport &&
      baselineSupport.diseaseCurie !== shadowSupport.diseaseCurie &&
      (baselineSupport.directPhenotypeEdgeCount || 0) === 0
    ) {
      genesWithPropagatedWinnerVetoed += 1;
    }

    const baseRow = directRow ? { ...directRow } : buildEmptyGeneRow(shadowSupport || baselineSupport);
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
    stats: {
      genes_with_direct_exact_alternative: genesWithDirectExactAlternative,
      genes_with_propagated_winner_vetoed: genesWithPropagatedWinnerVetoed,
      vetoed_propagated_only_support_candidates: vetoedPropagatedOnlySupportCandidates
    }
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const config = {
    phenopacketDir: flags['phenopacket-dir'] || DEFAULTS.phenopacketDir,
    outputJson: flags['output-json'] || DEFAULTS.outputJson,
    outputMd: flags['output-md'] || DEFAULTS.outputMd,
    limit: Number.parseInt(String(flags.limit || DEFAULTS.limit), 10),
    shardIndex: Number.parseInt(String(flags['shard-index'] || DEFAULTS.shardIndex), 10),
    shardCount: Number.parseInt(String(flags['shard-count'] || DEFAULTS.shardCount), 10)
  };

  const index = await withClient((client) => loadDxSimilarityIndex(client, { forceRefresh: true }));
  const phenopacketFiles = selectShardFiles(
    (await fs.readdir(config.phenopacketDir)).filter((name) => name.endsWith('.json')).sort(),
    config.shardIndex,
    config.shardCount
  );

  const baselineRanks = {};
  const shadowRanks = {};
  const perCase = [];
  const aggregateStats = {
    genes_with_direct_exact_alternative: 0,
    genes_with_propagated_winner_vetoed: 0,
    vetoed_propagated_only_support_candidates: 0
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
      limit: config.limit
    });

    baselineRanks[caseId] = findTruthRank(baseline.results, truthGeneKeys);
    shadowRanks[caseId] = findTruthRank(shadow.results, truthGeneKeys);

    aggregateStats.genes_with_direct_exact_alternative += shadow.stats.genes_with_direct_exact_alternative;
    aggregateStats.genes_with_propagated_winner_vetoed += shadow.stats.genes_with_propagated_winner_vetoed;
    aggregateStats.vetoed_propagated_only_support_candidates += shadow.stats.vetoed_propagated_only_support_candidates;

    perCase.push({
      case_id: caseId,
      truth_gene_keys: truthGeneKeys,
      baseline_rank: baselineRanks[caseId],
      shadow_rank: shadowRanks[caseId]
    });

    console.log(
      `[${indexValue + 1}/${phenopacketFiles.length}] ${fileName} baseline=${baselineRanks[caseId] ?? 'miss'} shadow=${shadowRanks[caseId] ?? 'miss'}`
    );
  }

  const baselineSummary = summarizeRun(baselineRanks);
  const shadowSummary = summarizeRun(shadowRanks);
  const deltas = compareBaselineVsShadow(perCase);
  const metadataLines = [
    `Shard ${config.shardIndex + 1}/${config.shardCount}`,
    `Genes with direct exact alternative: ${aggregateStats.genes_with_direct_exact_alternative}`,
    `Genes with propagated-only winner vetoed: ${aggregateStats.genes_with_propagated_winner_vetoed}`,
    `Vetoed propagated-only support candidates: ${aggregateStats.vetoed_propagated_only_support_candidates}`
  ];

  const report = {
    experiment: 'shadow-support-direct-preference',
    title: 'Shadow Support Direct Preference',
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
  console.error('[shadow-support-direct-preference] failed:', error);
  process.exit(1);
});

import fs from 'node:fs/promises';
import path from 'node:path';
import { withClient, getPool } from '../db/pool.js';
import { extractDxPhenotypeInput, validateDxPhenotypeInput } from '../lib/phenopackets.js';
import {
  loadDxSimilarityIndex,
  rankDiseasesByPhenotypeSimilarity,
  rankGenesByPhenotypeSimilarity
} from '../services/dx/similarityEngine.js';
import { DX_SIMILARITY_DEFAULTS } from '../constants/dx.js';

const DEFAULTS = Object.freeze({
  phenopacketDir: '/Users/ahmedelmorshedy/Genovy/output/pheval-official-sample-100/phenopackets',
  outputJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/contradiction-penalty-sweep-four-cases-20260328.json',
  outputMd:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/contradiction-penalty-sweep-four-cases-20260328.md'
});

const TARGET_CASES = Object.freeze([
  {
    caseId: 'PMID_29330883_Subject9',
    label: 'RERE',
    truthGeneKey: 'symbol:RERE'
  },
  {
    caseId: 'PMID_37962958_43',
    label: 'U2AF2',
    truthGeneKey: 'symbol:U2AF2'
  },
  {
    caseId: 'PMID_36331550_Family16Patient21',
    label: 'SPTAN1',
    truthGeneKey: 'symbol:SPTAN1'
  },
  {
    caseId: 'PMID_30580808_Lo_twin_2-Fam-52',
    label: 'SMARCC2',
    truthGeneKey: 'symbol:SMARCC2'
  }
]);

const PENALTY_PROFILES = Object.freeze([
  {
    profileId: 'baseline',
    displayLabel: 'Baseline (no contradiction discount)',
    patientExcludedWeight: 0,
    diseaseExcludedWeight: 0
  },
  {
    profileId: 'soft_half_current',
    displayLabel: 'Soft half-current',
    patientExcludedWeight: 0.15,
    diseaseExcludedWeight: 0.1
  },
  {
    profileId: 'current_weights_discounted',
    displayLabel: 'Current weights discounted',
    patientExcludedWeight: DX_SIMILARITY_DEFAULTS.patientExcludedContradictionPenaltyWeight,
    diseaseExcludedWeight: DX_SIMILARITY_DEFAULTS.diseaseExcludedContradictionPenaltyWeight
  },
  {
    profileId: 'medium',
    displayLabel: 'Medium',
    patientExcludedWeight: 0.45,
    diseaseExcludedWeight: 0.3
  },
  {
    profileId: 'strong',
    displayLabel: 'Strong',
    patientExcludedWeight: 0.6,
    diseaseExcludedWeight: 0.4
  }
]);

function parseArgs(argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      flags[key] = true;
    } else {
      flags[key] = next;
      index += 1;
    }
  }
  return flags;
}

function normalizeGeneKey(value) {
  if (value == null) return '';
  const text = String(value).trim();
  if (!text) return '';
  const lower = text.toLowerCase();
  if (lower.startsWith('symbol:')) return `symbol:${text.split(':', 2)[1].toUpperCase()}`;
  if (lower.startsWith('ncbigene:')) return `ncbigene:${text.split(':', 2)[1]}`;
  if (lower.startsWith('hgnc:')) return `hgnc:${text.split(':', 2)[1]}`;
  if (lower.startsWith('ensembl:')) return `ensembl:${text.split(':', 2)[1].toUpperCase()}`;
  if (text.toUpperCase().startsWith('ENSG')) return `ensembl:${text.toUpperCase()}`;
  return `symbol:${text.toUpperCase()}`;
}

function clamp(value, minValue, maxValue) {
  return Math.max(minValue, Math.min(maxValue, value));
}

function resolveGeneKey(row) {
  return (
    normalizeGeneKey(row.geneSymbol) ||
    normalizeGeneKey(row.geneLabel) ||
    normalizeGeneKey(row.geneCurie) ||
    normalizeGeneKey(row.geneIdentifier)
  );
}

function buildAdjustedResults(results, profile) {
  return results
    .map((row) => {
      const contradictionPenalty =
        (row.patientExcludedVsDiseasePresentPenalty || 0) * profile.patientExcludedWeight +
        (row.patientPresentVsDiseaseAbsentPenalty || 0) * profile.diseaseExcludedWeight;
      const adjustedScore = clamp((row.normalizedScore || 0) * (1 - contradictionPenalty), 0, 1);
      return {
        ...row,
        contradictionPenaltyShadow: Number(contradictionPenalty.toFixed(6)),
        adjustedScore: Number(adjustedScore.toFixed(6))
      };
    })
    .sort((left, right) => {
      if (right.adjustedScore !== left.adjustedScore) {
        return right.adjustedScore - left.adjustedScore;
      }
      if ((right.normalizedScore || 0) !== (left.normalizedScore || 0)) {
        return (right.normalizedScore || 0) - (left.normalizedScore || 0);
      }
      if ((right.matchedPhenotypeCount || 0) !== (left.matchedPhenotypeCount || 0)) {
        return (right.matchedPhenotypeCount || 0) - (left.matchedPhenotypeCount || 0);
      }
      return String(left.geneLabel || '').localeCompare(String(right.geneLabel || ''));
    })
    .map((row, index) => ({
      ...row,
      shadowRank: index + 1
    }));
}

function computeCustomPenalty(row, profile) {
  return Number(
    (
      ((row?.patientExcludedVsDiseasePresentPenalty || 0) * profile.patientExcludedWeight) +
      ((row?.patientPresentVsDiseaseAbsentPenalty || 0) * profile.diseaseExcludedWeight)
    ).toFixed(6)
  );
}

function inferSupportWeight(row, diseaseRow) {
  const denominator =
    (diseaseRow?.normalizedScore || 0) * (row?.supportingDiseaseEvidenceWeight || 0);
  if (!denominator) {
    return 0;
  }
  return (row?.diseaseSupportScore || 0) / denominator;
}

function buildAdjustedGeneResults(geneResults, diseaseRowsByCurie, profile) {
  return geneResults
    .map((row) => {
      const diseaseRow = diseaseRowsByCurie.get(row.supportingDiseaseCurie) || null;
      const supportingDiseaseContradictionPenalty = diseaseRow ? computeCustomPenalty(diseaseRow, profile) : 0;
      const adjustedSupportingDiseaseNormalizedScore = diseaseRow
        ? clamp((diseaseRow.normalizedScore || 0) * (1 - supportingDiseaseContradictionPenalty), 0, 1)
        : 0;
      const supportWeight = diseaseRow ? inferSupportWeight(row, diseaseRow) : 0;
      const adjustedDiseaseSupportScore = Number(
        (
          adjustedSupportingDiseaseNormalizedScore *
          supportWeight *
          (row.supportingDiseaseEvidenceWeight || 0)
        ).toFixed(6)
      );
      const adjustedScore = Number(
        Math.max(row.directNormalizedScore || 0, adjustedDiseaseSupportScore).toFixed(6)
      );
      return {
        ...row,
        supportingDiseaseContradictionPenalty,
        adjustedSupportingDiseaseNormalizedScore,
        adjustedDiseaseSupportScore,
        adjustedScore
      };
    })
    .sort((left, right) => {
      if (right.adjustedScore !== left.adjustedScore) {
        return right.adjustedScore - left.adjustedScore;
      }
      if ((right.directNormalizedScore || 0) !== (left.directNormalizedScore || 0)) {
        return (right.directNormalizedScore || 0) - (left.directNormalizedScore || 0);
      }
      if ((right.adjustedDiseaseSupportScore || 0) !== (left.adjustedDiseaseSupportScore || 0)) {
        return (right.adjustedDiseaseSupportScore || 0) - (left.adjustedDiseaseSupportScore || 0);
      }
      return String(left.geneLabel || '').localeCompare(String(right.geneLabel || ''));
    })
    .map((row, index) => ({
      ...row,
      shadowRank: index + 1
    }));
}

function pickTruthRow(rows, truthGeneKey) {
  return rows.find((row) => resolveGeneKey(row) === truthGeneKey) || null;
}

function pickTopRivalRow(rows, truthGeneKey) {
  return rows.find((row) => resolveGeneKey(row) !== truthGeneKey) || null;
}

function buildMarkdown(report) {
  const lines = [
    '# Contradiction Penalty Sweep',
    '',
    `Generated at: ${report.generatedAt}`,
    '',
    'Profiles tested:',
    ...report.penaltyProfiles.map(
      (profile) =>
        `- ${profile.displayLabel}: patientExcludedWeight=${profile.patientExcludedWeight}, diseaseExcludedWeight=${profile.diseaseExcludedWeight}`
    ),
    ''
  ];

  for (const caseReport of report.cases) {
    lines.push(`## ${caseReport.caseId} / ${caseReport.label}`);
    lines.push('');
    lines.push(
      '| Profile | Truth rank | Truth gene | Truth adjusted | Top rival | Rival adjusted | Top-1 gene |'
    );
    lines.push('|---|---:|---|---:|---|---:|---|');
    for (const sweep of caseReport.sweeps) {
      lines.push(
        `| ${sweep.profile.displayLabel} | ${sweep.truth?.shadowRank ?? 'miss'} | ${sweep.truth?.geneLabel || caseReport.label} | ${
          sweep.truth?.adjustedScore ?? ''
        } | ${sweep.topRival?.geneLabel || ''} | ${sweep.topRival?.adjustedScore ?? ''} | ${sweep.top1?.geneLabel || ''} |`
      );
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const phenopacketDir = flags['phenopacket-dir'] || DEFAULTS.phenopacketDir;
  const outputJson = flags['output-json'] || DEFAULTS.outputJson;
  const outputMd = flags['output-md'] || DEFAULTS.outputMd;

  const index = await withClient((client) => loadDxSimilarityIndex(client, { forceRefresh: true }));
  const cases = [];

  for (const target of TARGET_CASES) {
    const filePath = path.join(phenopacketDir, `${target.caseId}.json`);
    const payload = JSON.parse(await fs.readFile(filePath, 'utf8'));
    const phenopacket = payload?.phenopacket || payload;
    const input = extractDxPhenotypeInput({ phenopacket });
    const validationError = validateDxPhenotypeInput(input);
    if (validationError) {
      throw new Error(`${target.caseId}: ${validationError}`);
    }

    const ranking = rankGenesByPhenotypeSimilarity(index, {
      phenotypeCuries: input.presentPhenotypeCuries,
      excludedPhenotypeCuries: input.excludedPhenotypeCuries,
      limit: index.totalGenes || 5000
    });
    const diseaseRanking = rankDiseasesByPhenotypeSimilarity(index, {
      phenotypeCuries: input.presentPhenotypeCuries,
      excludedPhenotypeCuries: input.excludedPhenotypeCuries,
      limit: index.totalDiseases || 5000
    });
    const diseaseRowsByCurie = new Map(diseaseRanking.results.map((row) => [row.diseaseCurie, row]));

    const sweeps = PENALTY_PROFILES.map((profile) => {
      const adjustedRows = buildAdjustedGeneResults(ranking.results, diseaseRowsByCurie, profile);
      return {
        profile,
        top1: adjustedRows[0] || null,
        topRival: pickTopRivalRow(adjustedRows, target.truthGeneKey),
        truth: pickTruthRow(adjustedRows, target.truthGeneKey)
      };
    });

    cases.push({
      caseId: target.caseId,
      label: target.label,
      presentPhenotypeCount: input.presentPhenotypeCuries.length,
      excludedPhenotypeCount: input.excludedPhenotypeCuries.length,
      sweeps
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    penaltyProfiles: PENALTY_PROFILES,
    cases
  };

  await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(outputMd, buildMarkdown(report));
  console.log(JSON.stringify({ outputJson, outputMd }, null, 2));
  await getPool().end().catch(() => {});
}

main().catch((error) => {
  console.error('[shadow-contradiction-penalty-sweep] failed:', error);
  getPool()
    .end()
    .catch(() => {})
    .finally(() => process.exit(1));
});

import { DX_PHEVAL_DEFAULTS } from '../../constants/dx.js';
import { rankDiseasesByPhenotypeSimilarity } from './similarityEngine.js';

function median(values) {
  if (!values.length) {
    return null;
  }

  const ordered = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(ordered.length / 2);
  if (ordered.length % 2 === 0) {
    return (ordered[midpoint - 1] + ordered[midpoint]) / 2;
  }
  return ordered[midpoint];
}

export function normalizeDxScoreField(rawValue) {
  return rawValue === 'bmaScore' ? 'bmaScore' : DX_PHEVAL_DEFAULTS.scoreField;
}

export function buildPhevalDiseaseRows(ranking, options = {}) {
  const scoreField = normalizeDxScoreField(options.scoreField);

  return ranking.results.map((result) => ({
    disease_identifier: result.diseaseCurie,
    score: Number(result[scoreField] ?? 0)
  }));
}

export function serializePhevalDiseaseRowsToTsv(rows) {
  const body = rows.map((row) => `${row.disease_identifier}\t${row.score}`).join('\n');
  return `disease_identifier\tscore${body ? `\n${body}` : ''}\n`;
}

export function buildDxCaseEvaluation({ caseId, fileName, truthDiseaseCuries, ranking }) {
  const truthSet = new Set(truthDiseaseCuries);
  const rankedMatch = ranking.results.find((result) => truthSet.has(result.diseaseCurie));

  return {
    caseId,
    fileName,
    truthDiseaseCuries,
    rank: rankedMatch?.rank || null,
    matchedDiseaseCurie: rankedMatch?.diseaseCurie || '',
    topDiseaseCurie: ranking.results[0]?.diseaseCurie || '',
    topDiseaseLabel: ranking.results[0]?.diseaseLabel || ''
  };
}

export function summarizeDxPhevalEvaluations(caseEvaluations, options = {}) {
  const recallCutoffs = options.recallCutoffs || DX_PHEVAL_DEFAULTS.recallCutoffs;
  const scorableCases = caseEvaluations.filter((caseEvaluation) => caseEvaluation.truthDiseaseCuries.length > 0);
  const resolvedRanks = scorableCases
    .map((caseEvaluation) => caseEvaluation.rank)
    .filter((rank) => Number.isInteger(rank));

  const recallAt = {};
  for (const cutoff of recallCutoffs) {
    recallAt[`top${cutoff}`] =
      scorableCases.filter((caseEvaluation) => caseEvaluation.rank && caseEvaluation.rank <= cutoff).length /
      (scorableCases.length || 1);
  }

  return {
    caseCount: caseEvaluations.length,
    scoredCaseCount: scorableCases.length,
    unscoredCaseCount: caseEvaluations.length - scorableCases.length,
    unresolvedCaseCount: scorableCases.length - resolvedRanks.length,
    medianRank: median(resolvedRanks),
    recallAt,
    failures: scorableCases
      .filter((caseEvaluation) => !caseEvaluation.rank || caseEvaluation.rank > recallCutoffs[recallCutoffs.length - 1])
      .slice(0, 25)
  };
}

export function runDxPhevalCases(index, cases, options = {}) {
  const resultLimit =
    Number.isInteger(options.resultLimit) && options.resultLimit > 0 ? options.resultLimit : index.totalDiseases;
  const scoreField = normalizeDxScoreField(options.scoreField);

  const caseReports = cases.map((dxCase) => {
    const ranking = rankDiseasesByPhenotypeSimilarity(index, {
      phenotypeCuries: dxCase.input.presentPhenotypeCuries,
      limit: resultLimit
    });

    const diseaseRows = buildPhevalDiseaseRows(ranking, { scoreField });
    const evaluation = buildDxCaseEvaluation({
      caseId: dxCase.caseId,
      fileName: dxCase.fileName,
      truthDiseaseCuries: dxCase.truthDiseaseCuries,
      ranking
    });

    return {
      ...dxCase,
      ranking,
      diseaseRows,
      evaluation
    };
  });

  return {
    scoreField,
    caseReports,
    summary: summarizeDxPhevalEvaluations(
      caseReports.map((caseReport) => caseReport.evaluation),
      options
    )
  };
}

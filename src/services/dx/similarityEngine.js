import { DX_BENCHMARK_DEFAULTS, DX_QUERY_DEFAULTS, DX_SIMILARITY_DEFAULTS } from '../../constants/dx.js';
import {
  loadDxDiseasePhenotypeRows,
  loadDxGeneDiseaseSupportRows,
  loadDxGenePhenotypeRows,
  loadDxPhenotypeOntologyRows
} from '../../repositories/dxRepository.js';

function average(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

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

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, minValue, maxValue) {
  return Math.max(minValue, Math.min(maxValue, value));
}

const DISEASE_SUPPORT_HEURISTICS = Object.freeze({
  directEvidenceWeight: 1,
  propagatedEvidenceMinWeight: 0.25,
  propagatedEvidenceMaxWeight: 0.85,
  propagatedMatchedDensityWeight: 0.45,
  propagatedCompactnessWeight: 0.35,
  propagatedSimilarityWeight: 0.2
});

function safeRatio(numerator, denominator) {
  if (!denominator) {
    return 0;
  }
  return numerator / denominator;
}

function sampleWithoutReplacement(values, count, random) {
  const pool = [...values];
  const selected = [];
  while (pool.length && selected.length < count) {
    const index = Math.floor(random() * pool.length);
    selected.push(pool[index]);
    pool.splice(index, 1);
  }
  return selected;
}

function buildParentMap(ontologyRows) {
  const parentMap = new Map();
  const labelByCurie = new Map();

  for (const row of ontologyRows) {
    if (!parentMap.has(row.child_curie)) {
      parentMap.set(row.child_curie, new Set());
    }
    parentMap.get(row.child_curie).add(row.parent_curie);
    labelByCurie.set(row.child_curie, row.child_label);
    labelByCurie.set(row.parent_curie, row.parent_label);
  }

  return { parentMap, labelByCurie };
}

function normalizePresenceStatus(value) {
  return String(value || '').trim().toLowerCase() === 'absent' ? 'absent' : 'present';
}

function weightedAverage(entries) {
  if (!entries.length) {
    return 0;
  }

  const totalWeight = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight || 0), 0);
  if (totalWeight <= 0) {
    return 0;
  }

  return entries.reduce((sum, entry) => sum + (entry.value || 0) * Math.max(0, entry.weight || 0), 0) / totalWeight;
}

function resolveFrequencyWeight(row) {
  if (normalizePresenceStatus(row.presence_status) === 'absent') {
    return DX_SIMILARITY_DEFAULTS.frequencyWeights.excluded;
  }

  const normalizedCandidates = [row.frequency_curie, row.frequency_label]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);
  const { hpoFrequencyCuries, frequencyWeights } = DX_SIMILARITY_DEFAULTS;

  for (const value of normalizedCandidates) {
    if (value === hpoFrequencyCuries.obligate.toLowerCase() || value.includes('obligate') || value.includes('100%')) {
      return frequencyWeights.obligate;
    }
    if (
      value === hpoFrequencyCuries.veryFrequent.toLowerCase() ||
      value.includes('very frequent') ||
      value.includes('80-99%')
    ) {
      return frequencyWeights.veryFrequent;
    }
    if (value === hpoFrequencyCuries.frequent.toLowerCase() || value.includes('frequent') || value.includes('30-79%')) {
      return frequencyWeights.frequent;
    }
    if (
      value === hpoFrequencyCuries.occasional.toLowerCase() ||
      value.includes('occasional') ||
      value.includes('5-29%')
    ) {
      return frequencyWeights.occasional;
    }
    if (
      value === hpoFrequencyCuries.veryRare.toLowerCase() ||
      value.includes('very rare') ||
      value.includes('1-4%')
    ) {
      return frequencyWeights.veryRare;
    }
    if (value === hpoFrequencyCuries.excluded.toLowerCase() || value.includes('excluded') || value === '0%') {
      return frequencyWeights.excluded;
    }
  }

  return DX_SIMILARITY_DEFAULTS.defaultPhenotypeWeight;
}

function buildEntityProfiles(
  rows,
  { entityIdKey, entityCurieKey, entityLabelKey, referenceTextKey = 'reference_text' }
) {
  const profilesByCurie = new Map();

  for (const row of rows) {
    const entityCurie = row[entityCurieKey];
    if (!entityCurie) {
      continue;
    }

    if (!profilesByCurie.has(entityCurie)) {
      profilesByCurie.set(entityCurie, {
        entityId: Number(row[entityIdKey]),
        entityCurie,
        entityLabel: row[entityLabelKey] || entityCurie,
        phenotypes: [],
        absentPhenotypes: [],
        directPhenotypeEdgeCount: 0,
        propagatedPhenotypeEdgeCount: 0,
        directAbsentPhenotypeEdgeCount: 0,
        propagatedAbsentPhenotypeEdgeCount: 0
      });
    }

    const profile = profilesByCurie.get(entityCurie);
    const phenotypeEdgeOrigin = row.phenotype_edge_origin || 'direct';
    const presenceStatus = normalizePresenceStatus(row.presence_status);
    const phenotypeWeight = resolveFrequencyWeight(row);
    const phenotypeRecord = {
      phenotypeEntityId: Number(row.phenotype_entity_id),
      phenotypeCurie: row.phenotype_curie,
      phenotypeLabel: row.phenotype_label,
      evidenceCode: row.evidence_code || '',
      referenceText: row[referenceTextKey] || '',
      edgeOrigin: phenotypeEdgeOrigin,
      presenceStatus,
      onsetCurie: row.onset_curie || '',
      onsetLabel: row.onset_label || row.onset_curie || '',
      frequencyCurie: row.frequency_curie || '',
      frequencyLabel: row.frequency_label || row.frequency_curie || '',
      modifierCurie: row.modifier_curie || '',
      modifierLabel: row.modifier_label || row.modifier_curie || '',
      sex: row.sex || '',
      aspect: row.aspect || '',
      phenotypeWeight
    };

    if (presenceStatus === 'absent') {
      profile.absentPhenotypes.push(phenotypeRecord);
      if (phenotypeEdgeOrigin === 'propagated') {
        profile.propagatedAbsentPhenotypeEdgeCount += 1;
      } else {
        profile.directAbsentPhenotypeEdgeCount += 1;
      }
    } else {
      profile.phenotypes.push(phenotypeRecord);
      if (phenotypeEdgeOrigin === 'propagated') {
        profile.propagatedPhenotypeEdgeCount += 1;
      } else {
        profile.directPhenotypeEdgeCount += 1;
      }
    }
  }

  return [...profilesByCurie.values()];
}

function classificationWeight(classification, evidenceCode) {
  const normalizedClassification = String(classification || '').trim().toLowerCase();
  if (normalizedClassification === 'definitive') return 1;
  if (normalizedClassification === 'strong') return 0.92;
  if (normalizedClassification === 'moderate') return 0.84;
  if (normalizedClassification === 'limited') return 0.76;
  if (normalizedClassification === 'disputed') return 0.35;
  if (normalizedClassification === 'refuted') return 0.1;

  const normalizedEvidenceCode = String(evidenceCode || '').trim().toLowerCase();
  if (normalizedEvidenceCode.includes('causal')) return 0.82;
  if (normalizedEvidenceCode.includes('pathogenic')) return 0.8;
  return 0.68;
}

function normalizeGeneKey(label, curie) {
  const normalizedLabel = String(label || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
  return normalizedLabel || String(curie || '').trim().toUpperCase();
}

function geneCuriePriority(curie) {
  if (String(curie || '').startsWith('HGNC:')) return 3;
  if (String(curie || '').startsWith('NCBIGene:')) return 2;
  return 1;
}

function buildGeneDiseaseSupportIndex(rows) {
  const diseaseToGeneLinks = new Map();
  for (const row of rows) {
    if (!diseaseToGeneLinks.has(row.disease_curie)) {
      diseaseToGeneLinks.set(row.disease_curie, []);
    }

    diseaseToGeneLinks.get(row.disease_curie).push({
      geneCurie: row.gene_curie,
      geneLabel: row.gene_label || row.gene_curie,
      geneEntityId: Number(row.gene_entity_id),
      diseaseCurie: row.disease_curie,
      diseaseLabel: row.disease_label || row.disease_curie,
      classification: row.classification || '',
      modeOfInheritance: row.mode_of_inheritance || '',
      evidenceCode: row.evidence_code || '',
      supportWeight: classificationWeight(row.classification, row.evidence_code)
    });
  }

  return diseaseToGeneLinks;
}

function createAncestorResolver(parentMap) {
  const cache = new Map();

  function resolve(curie) {
    if (cache.has(curie)) {
      return cache.get(curie);
    }

    const ancestors = new Set([curie]);
    const stack = [...(parentMap.get(curie) || [])];

    while (stack.length) {
      const next = stack.pop();
      if (ancestors.has(next)) {
        continue;
      }
      ancestors.add(next);
      for (const parent of parentMap.get(next) || []) {
        stack.push(parent);
      }
    }

    cache.set(curie, ancestors);
    return ancestors;
  }

  return resolve;
}

function computeInfoContentByPhenotype(diseaseProfiles, resolveAncestors) {
  const annotationCountByCurie = new Map();
  for (const profile of diseaseProfiles) {
    const propagated = new Set();
    for (const phenotype of profile.phenotypes) {
      for (const ancestorCurie of resolveAncestors(phenotype.phenotypeCurie)) {
        propagated.add(ancestorCurie);
      }
    }

    for (const ancestorCurie of propagated) {
      annotationCountByCurie.set(ancestorCurie, (annotationCountByCurie.get(ancestorCurie) || 0) + 1);
    }
  }

  const infoContentByCurie = new Map();
  const totalDiseases = diseaseProfiles.length || 1;

  for (const [curie, count] of annotationCountByCurie.entries()) {
    infoContentByCurie.set(curie, -Math.log(count / totalDiseases));
  }

  return {
    infoContentByCurie,
    annotationCountByCurie,
    totalDiseases
  };
}

function createSimilarityResolver(resolveAncestors, infoContentByCurie) {
  const similarityCache = new Map();

  return function resolveSimilarity(leftCurie, rightCurie) {
    const cacheKey =
      leftCurie <= rightCurie ? `${leftCurie}|${rightCurie}` : `${rightCurie}|${leftCurie}`;

    if (similarityCache.has(cacheKey)) {
      return similarityCache.get(cacheKey);
    }

    const leftAncestors = resolveAncestors(leftCurie);
    const rightAncestors = resolveAncestors(rightCurie);
    const smaller = leftAncestors.size <= rightAncestors.size ? leftAncestors : rightAncestors;
    const larger = smaller === leftAncestors ? rightAncestors : leftAncestors;

    let bestCurie = '';
    let bestScore = DX_SIMILARITY_DEFAULTS.rootSimilarityFloor;

    for (const ancestorCurie of smaller) {
      if (!larger.has(ancestorCurie)) {
        continue;
      }
      const score = infoContentByCurie.get(ancestorCurie) || DX_SIMILARITY_DEFAULTS.rootSimilarityFloor;
      if (score > bestScore) {
        bestScore = score;
        bestCurie = ancestorCurie;
      }
    }

    const result = {
      score: bestScore,
      micaCurie: bestCurie
    };
    similarityCache.set(cacheKey, result);
    return result;
  };
}

export function buildDxSimilarityIndex({
  ontologyRows,
  diseasePhenotypeRows,
  genePhenotypeRows = [],
  geneDiseaseSupportRows = [],
  generatedAt = new Date().toISOString()
}) {
  const { parentMap, labelByCurie } = buildParentMap(ontologyRows);
  const diseaseProfiles = buildEntityProfiles(diseasePhenotypeRows, {
    entityIdKey: 'disease_entity_id',
    entityCurieKey: 'disease_curie',
    entityLabelKey: 'disease_label'
  });
  const geneProfiles = buildEntityProfiles(genePhenotypeRows, {
    entityIdKey: 'gene_entity_id',
    entityCurieKey: 'gene_curie',
    entityLabelKey: 'gene_label',
    referenceTextKey: 'reference_context'
  });
  const geneDiseaseSupportIndex = buildGeneDiseaseSupportIndex(geneDiseaseSupportRows);
  const resolveAncestors = createAncestorResolver(parentMap);
  const { infoContentByCurie, annotationCountByCurie, totalDiseases } = computeInfoContentByPhenotype(
    diseaseProfiles,
    resolveAncestors
  );
  const resolveSimilarity = createSimilarityResolver(resolveAncestors, infoContentByCurie);

  let maxInfoContent = 0;
  for (const value of infoContentByCurie.values()) {
    if (value > maxInfoContent) {
      maxInfoContent = value;
    }
  }

  return {
    generatedAt,
    sourceMode: '',
    totalDiseases,
    totalGenes: geneProfiles.length,
    phenotypeCount: labelByCurie.size,
    maxInfoContent,
    parentMap,
    labelByCurie,
    diseaseProfiles,
    geneProfiles,
    geneDiseaseSupportIndex,
    annotationCountByCurie,
    infoContentByCurie,
    resolveAncestors,
    resolveSimilarity
  };
}

function buildPatientPhenotypeTerms(index, phenotypeCuries) {
  return phenotypeCuries
    .filter((curie) => index.labelByCurie.has(curie))
    .map((curie) => ({
      phenotypeCurie: curie,
      phenotypeLabel: index.labelByCurie.get(curie) || curie
    }));
}

function normalizeSimilarityScore(index, rawScore) {
  if (index.maxInfoContent <= 0) {
    return 0;
  }
  return rawScore / index.maxInfoContent;
}

function buildBestTermMatch(index, queryTerm, diseasePhenotypes) {
  let bestMatch = {
    patientPhenotypeCurie: queryTerm.phenotypeCurie,
    patientPhenotypeLabel: queryTerm.phenotypeLabel,
    diseasePhenotypeCurie: '',
    diseasePhenotypeLabel: '',
    micaCurie: '',
    micaLabel: '',
    score: DX_SIMILARITY_DEFAULTS.rootSimilarityFloor,
    weightedScore: DX_SIMILARITY_DEFAULTS.rootSimilarityFloor,
    phenotypeWeight: 0,
    evidenceCode: '',
    referenceText: '',
    presenceStatus: 'present',
    frequencyCurie: '',
    frequencyLabel: ''
  };

  for (const diseasePhenotype of diseasePhenotypes) {
    const similarity = index.resolveSimilarity(queryTerm.phenotypeCurie, diseasePhenotype.phenotypeCurie);
    const weightedScore = similarity.score * (diseasePhenotype.phenotypeWeight || DX_SIMILARITY_DEFAULTS.defaultPhenotypeWeight);
    if (weightedScore < bestMatch.weightedScore) {
      continue;
    }

    bestMatch = {
      patientPhenotypeCurie: queryTerm.phenotypeCurie,
      patientPhenotypeLabel: queryTerm.phenotypeLabel,
      diseasePhenotypeCurie: diseasePhenotype.phenotypeCurie,
      diseasePhenotypeLabel: diseasePhenotype.phenotypeLabel,
      micaCurie: similarity.micaCurie,
      micaLabel: index.labelByCurie.get(similarity.micaCurie) || similarity.micaCurie,
      score: similarity.score,
      weightedScore,
      phenotypeWeight: diseasePhenotype.phenotypeWeight || DX_SIMILARITY_DEFAULTS.defaultPhenotypeWeight,
      evidenceCode: diseasePhenotype.evidenceCode,
      referenceText: diseasePhenotype.referenceText,
      presenceStatus: diseasePhenotype.presenceStatus || 'present',
      frequencyCurie: diseasePhenotype.frequencyCurie || '',
      frequencyLabel: diseasePhenotype.frequencyLabel || ''
    };
  }

  return bestMatch;
}

function buildSymmetricDiseaseMatch(index, diseasePhenotype, queryPhenotypes) {
  let bestScore = DX_SIMILARITY_DEFAULTS.rootSimilarityFloor;
  for (const queryPhenotype of queryPhenotypes) {
    const similarity = index.resolveSimilarity(diseasePhenotype.phenotypeCurie, queryPhenotype.phenotypeCurie);
    if (similarity.score > bestScore) {
      bestScore = similarity.score;
    }
  }
  return {
    score: bestScore,
    weightedScore: bestScore * (diseasePhenotype.phenotypeWeight || DX_SIMILARITY_DEFAULTS.defaultPhenotypeWeight),
    phenotypeWeight: diseasePhenotype.phenotypeWeight || DX_SIMILARITY_DEFAULTS.defaultPhenotypeWeight
  };
}

function buildContradictionScore(index, queryPhenotypes, diseasePhenotypes) {
  if (!queryPhenotypes.length || !diseasePhenotypes.length) {
    return 0;
  }

  const matches = queryPhenotypes.map((queryPhenotype) => buildBestTermMatch(index, queryPhenotype, diseasePhenotypes));
  return weightedAverage(matches.map((match) => ({ value: match.score, weight: match.phenotypeWeight || 0 })));
}

function computeDiseaseSupportEvidenceWeight(diseaseResult) {
  const directCount = diseaseResult.directPhenotypeEdgeCount || 0;
  const propagatedCount = diseaseResult.propagatedPhenotypeEdgeCount || 0;
  const phenotypeCount = diseaseResult.phenotypeCount || directCount + propagatedCount;
  const totalCount = phenotypeCount || directCount + propagatedCount;

  if (totalCount <= 0) {
    return DISEASE_SUPPORT_HEURISTICS.propagatedEvidenceMinWeight;
  }

  const directRatio = safeRatio(directCount, totalCount);
  if (directRatio >= 1) {
    return DISEASE_SUPPORT_HEURISTICS.directEvidenceWeight;
  }

  const matchedDensity = safeRatio(diseaseResult.matchedPhenotypeCount || 0, totalCount);
  const compactness = 1 / Math.log2(totalCount + 1);
  const similarityStrength = clamp(diseaseResult.normalizedScore || 0, 0, 1);

  const propagatedEvidenceWeight = clamp(
    DISEASE_SUPPORT_HEURISTICS.propagatedEvidenceMinWeight +
      matchedDensity * DISEASE_SUPPORT_HEURISTICS.propagatedMatchedDensityWeight +
      compactness * DISEASE_SUPPORT_HEURISTICS.propagatedCompactnessWeight +
      similarityStrength * DISEASE_SUPPORT_HEURISTICS.propagatedSimilarityWeight,
    DISEASE_SUPPORT_HEURISTICS.propagatedEvidenceMinWeight,
    DISEASE_SUPPORT_HEURISTICS.propagatedEvidenceMaxWeight
  );

  return Number(
    (
      directRatio * DISEASE_SUPPORT_HEURISTICS.directEvidenceWeight +
      (1 - directRatio) * propagatedEvidenceWeight
    ).toFixed(DX_SIMILARITY_DEFAULTS.normalizedScorePrecision)
  );
}

function shouldReplaceSupportingDisease(currentResult, candidateResult) {
  if ((candidateResult.diseaseSupportScore || 0) !== (currentResult.diseaseSupportScore || 0)) {
    return (candidateResult.diseaseSupportScore || 0) > (currentResult.diseaseSupportScore || 0);
  }
  if ((candidateResult.evidenceWeight || 0) !== (currentResult.evidenceWeight || 0)) {
    return (candidateResult.evidenceWeight || 0) > (currentResult.evidenceWeight || 0);
  }
  if ((candidateResult.directPhenotypeEdgeCount || 0) !== (currentResult.directPhenotypeEdgeCount || 0)) {
    return (candidateResult.directPhenotypeEdgeCount || 0) > (currentResult.directPhenotypeEdgeCount || 0);
  }
  if ((candidateResult.propagatedPhenotypeEdgeCount || 0) !== (currentResult.propagatedPhenotypeEdgeCount || 0)) {
    return (candidateResult.propagatedPhenotypeEdgeCount || 0) < (currentResult.propagatedPhenotypeEdgeCount || 0);
  }
  if ((candidateResult.normalizedScore || 0) !== (currentResult.normalizedScore || 0)) {
    return (candidateResult.normalizedScore || 0) > (currentResult.normalizedScore || 0);
  }
  return String(candidateResult.supportingDiseaseLabel || '').localeCompare(
    String(currentResult.supportingDiseaseLabel || '')
  ) < 0;
}

function buildRankedResults(index, profiles, { phenotypeCuries, excludedPhenotypeCuries = [], limit }) {
  const queryPhenotypes = buildPatientPhenotypeTerms(index, phenotypeCuries);
  const excludedQueryPhenotypes = buildPatientPhenotypeTerms(index, excludedPhenotypeCuries);
  if (!queryPhenotypes.length) {
    return {
      queryPhenotypes: [],
      excludedQueryPhenotypes: [],
      results: []
    };
  }

  const results = [];

  for (const profile of profiles) {
    const patientToDiseaseMatches = queryPhenotypes.map((queryPhenotype) =>
      buildBestTermMatch(index, queryPhenotype, profile.phenotypes)
    );
    const diseaseToPatientMatches = profile.phenotypes.map((diseasePhenotype) =>
      buildSymmetricDiseaseMatch(index, diseasePhenotype, queryPhenotypes)
    );

    const patientAverageScore = average(patientToDiseaseMatches.map((match) => match.weightedScore));
    const diseaseAverageScore = weightedAverage(
      diseaseToPatientMatches.map((match) => ({ value: match.score, weight: match.phenotypeWeight }))
    );
    const bmaScore = (patientAverageScore + diseaseAverageScore) / 2;
    const patientPresentVsDiseaseAbsentPenalty = buildContradictionScore(index, queryPhenotypes, profile.absentPhenotypes);
    const patientExcludedVsDiseasePresentPenalty = buildContradictionScore(
      index,
      excludedQueryPhenotypes,
      profile.phenotypes
    );
    const contradictionPenalty =
      patientPresentVsDiseaseAbsentPenalty * DX_SIMILARITY_DEFAULTS.diseaseExcludedContradictionPenaltyWeight +
      patientExcludedVsDiseasePresentPenalty * DX_SIMILARITY_DEFAULTS.patientExcludedContradictionPenaltyWeight;
    const normalizedScore = clamp(normalizeSimilarityScore(index, bmaScore), 0, 1);

    results.push({
      entityCurie: profile.entityCurie,
      entityLabel: profile.entityLabel,
      entityId: profile.entityId,
      bmaScore,
      normalizedScore: Number(normalizedScore.toFixed(DX_SIMILARITY_DEFAULTS.normalizedScorePrecision)),
      patientAverageScore,
      diseaseAverageScore,
      phenotypeCount: profile.phenotypes.length,
      absentPhenotypeCount: profile.absentPhenotypes.length,
      directPhenotypeEdgeCount: profile.directPhenotypeEdgeCount,
      propagatedPhenotypeEdgeCount: profile.propagatedPhenotypeEdgeCount,
      directPhenotypeCount: profile.phenotypes.length,
      matchedPhenotypeCount: patientToDiseaseMatches.filter((match) => match.score > 0).length,
      contradictionPenalty: Number(contradictionPenalty.toFixed(DX_SIMILARITY_DEFAULTS.normalizedScorePrecision)),
      patientPresentVsDiseaseAbsentPenalty: Number(
        patientPresentVsDiseaseAbsentPenalty.toFixed(DX_SIMILARITY_DEFAULTS.normalizedScorePrecision)
      ),
      patientExcludedVsDiseasePresentPenalty: Number(
        patientExcludedVsDiseasePresentPenalty.toFixed(DX_SIMILARITY_DEFAULTS.normalizedScorePrecision)
      ),
      trace: patientToDiseaseMatches
        .sort((left, right) => right.weightedScore - left.weightedScore)
        .slice(0, DX_QUERY_DEFAULTS.traceTermsPerDisease)
    });
  }

  results.sort((left, right) => {
    if (right.normalizedScore !== left.normalizedScore) {
      return right.normalizedScore - left.normalizedScore;
    }
    if (right.bmaScore !== left.bmaScore) {
      return right.bmaScore - left.bmaScore;
    }
    if (right.matchedPhenotypeCount !== left.matchedPhenotypeCount) {
      return right.matchedPhenotypeCount - left.matchedPhenotypeCount;
    }
    return left.entityLabel.localeCompare(right.entityLabel);
  });

  const cappedLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : DX_QUERY_DEFAULTS.defaultLimit;
  const rankedResults = results.slice(0, cappedLimit).map((result, indexValue) => ({
    rank: indexValue + 1,
    ...result
  }));

  return {
    queryPhenotypes,
    excludedQueryPhenotypes,
    results: rankedResults
  };
}

function buildEngineSummary(index) {
  return {
    diseaseCount: index.totalDiseases,
    geneCount: index.totalGenes,
    phenotypeCount: index.phenotypeCount,
    sourceMode: index.sourceMode,
    generatedAt: index.generatedAt
  };
}

export function rankDiseasesByPhenotypeSimilarity(
  index,
  { phenotypeCuries, excludedPhenotypeCuries = [], limit = DX_QUERY_DEFAULTS.defaultLimit }
) {
  const ranking = buildRankedResults(index, index.diseaseProfiles, {
    phenotypeCuries,
    excludedPhenotypeCuries,
    limit
  });
  return {
    ...ranking,
    results: ranking.results.map((result) => ({
      rank: result.rank,
      diseaseCurie: result.entityCurie,
      diseaseLabel: result.entityLabel,
      diseaseEntityId: result.entityId,
      bmaScore: result.bmaScore,
      normalizedScore: result.normalizedScore,
      patientAverageScore: result.patientAverageScore,
      diseaseAverageScore: result.diseaseAverageScore,
      phenotypeCount: result.phenotypeCount,
      absentPhenotypeCount: result.absentPhenotypeCount,
      directPhenotypeCount: result.directPhenotypeCount,
      profileDirectPhenotypeCount: result.directPhenotypeEdgeCount,
      profilePropagatedPhenotypeCount: result.propagatedPhenotypeEdgeCount,
      matchedPhenotypeCount: result.matchedPhenotypeCount,
      contradictionPenalty: result.contradictionPenalty,
      patientPresentVsDiseaseAbsentPenalty: result.patientPresentVsDiseaseAbsentPenalty,
      patientExcludedVsDiseasePresentPenalty: result.patientExcludedVsDiseasePresentPenalty,
      trace: result.trace
    })),
    engineSummary: {
      ...buildEngineSummary(index)
    }
  };
}

export function rankGenesByPhenotypeSimilarity(
  index,
  { phenotypeCuries, excludedPhenotypeCuries = [], limit = DX_QUERY_DEFAULTS.defaultLimit }
) {
  const directRanking = buildRankedResults(index, index.geneProfiles, {
    phenotypeCuries,
    excludedPhenotypeCuries,
    limit: index.totalGenes || limit
  });
  const diseaseRanking = buildRankedResults(index, index.diseaseProfiles, {
    phenotypeCuries,
    excludedPhenotypeCuries,
    limit: index.totalDiseases || limit
  });
  const combinedByGeneKey = new Map();

  for (const result of directRanking.results) {
    const geneKey = normalizeGeneKey(result.entityLabel, result.entityCurie);
    const existing = combinedByGeneKey.get(geneKey);
    if (!existing || result.normalizedScore > existing.directNormalizedScore) {
      combinedByGeneKey.set(geneKey, {
        rank: 0,
        geneCurie:
          existing && geneCuriePriority(existing.geneCurie) > geneCuriePriority(result.entityCurie)
            ? existing.geneCurie
            : result.entityCurie,
        geneLabel: result.entityLabel,
        geneSymbol: result.entityLabel,
        geneEntityId: result.entityId,
        bmaScore: result.bmaScore,
        normalizedScore: result.normalizedScore,
        patientAverageScore: result.patientAverageScore,
        phenotypeAverageScore: result.diseaseAverageScore,
        directPhenotypeCount: result.directPhenotypeCount,
        matchedPhenotypeCount: result.matchedPhenotypeCount,
        trace: result.trace,
        directNormalizedScore: result.normalizedScore,
        diseaseSupportScore: existing?.diseaseSupportScore || 0,
        supportingDiseaseEvidenceWeight: existing?.supportingDiseaseEvidenceWeight || 0,
        supportingDiseaseCurie: existing?.supportingDiseaseCurie || '',
        supportingDiseaseLabel: existing?.supportingDiseaseLabel || '',
        supportingDiseaseClassification: existing?.supportingDiseaseClassification || '',
        supportingDiseaseDirectPhenotypeCount: existing?.supportingDiseaseDirectPhenotypeCount || 0,
        supportingDiseasePropagatedPhenotypeCount: existing?.supportingDiseasePropagatedPhenotypeCount || 0
      });
    }
  }

  for (const diseaseResult of diseaseRanking.results) {
    const links = index.geneDiseaseSupportIndex.get(diseaseResult.entityCurie) || [];
    for (const link of links) {
      const supportingDiseaseEvidenceWeight = computeDiseaseSupportEvidenceWeight(diseaseResult);
      const diseaseSupportScore = Number(
        (diseaseResult.normalizedScore * link.supportWeight * supportingDiseaseEvidenceWeight).toFixed(
          DX_SIMILARITY_DEFAULTS.normalizedScorePrecision
        )
      );
      const geneKey = normalizeGeneKey(link.geneLabel, link.geneCurie);
      const existing =
        combinedByGeneKey.get(geneKey) ||
        {
          rank: 0,
          geneCurie: link.geneCurie,
          geneLabel: link.geneLabel,
          geneSymbol: link.geneLabel,
          geneEntityId: link.geneEntityId,
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

      if (geneCuriePriority(link.geneCurie) > geneCuriePriority(existing.geneCurie)) {
        existing.geneCurie = link.geneCurie;
      }
      if (!existing.geneLabel && link.geneLabel) {
        existing.geneLabel = link.geneLabel;
        existing.geneSymbol = link.geneLabel;
      }

      const candidateSupport = {
        diseaseSupportScore,
        evidenceWeight: supportingDiseaseEvidenceWeight,
        directPhenotypeEdgeCount: diseaseResult.directPhenotypeEdgeCount || 0,
        propagatedPhenotypeEdgeCount: diseaseResult.propagatedPhenotypeEdgeCount || 0,
        normalizedScore: diseaseResult.normalizedScore,
        supportingDiseaseLabel: link.diseaseLabel
      };
      const currentSupport = {
        diseaseSupportScore: existing.diseaseSupportScore || 0,
        evidenceWeight: existing.supportingDiseaseEvidenceWeight || 0,
        directPhenotypeEdgeCount: existing.supportingDiseaseDirectPhenotypeCount || 0,
        propagatedPhenotypeEdgeCount: existing.supportingDiseasePropagatedPhenotypeCount || 0,
        normalizedScore: existing.normalizedScore || 0,
        supportingDiseaseLabel: existing.supportingDiseaseLabel || ''
      };

      if (shouldReplaceSupportingDisease(currentSupport, candidateSupport)) {
        existing.diseaseSupportScore = diseaseSupportScore;
        existing.supportingDiseaseEvidenceWeight = supportingDiseaseEvidenceWeight;
        existing.supportingDiseaseCurie = link.diseaseCurie;
        existing.supportingDiseaseLabel = link.diseaseLabel;
        existing.supportingDiseaseClassification = link.classification;
        existing.supportingDiseaseDirectPhenotypeCount = diseaseResult.directPhenotypeEdgeCount || 0;
        existing.supportingDiseasePropagatedPhenotypeCount = diseaseResult.propagatedPhenotypeEdgeCount || 0;
      }

      existing.normalizedScore = Number(
        Math.max(existing.directNormalizedScore, existing.diseaseSupportScore).toFixed(
          DX_SIMILARITY_DEFAULTS.normalizedScorePrecision
        )
      );
      combinedByGeneKey.set(geneKey, existing);
    }
  }

  const rankedResults = [...combinedByGeneKey.values()]
    .sort((left, right) => {
      if (right.normalizedScore !== left.normalizedScore) {
        return right.normalizedScore - left.normalizedScore;
      }
      if (right.directNormalizedScore !== left.directNormalizedScore) {
        return right.directNormalizedScore - left.directNormalizedScore;
      }
      if (right.diseaseSupportScore !== left.diseaseSupportScore) {
        return right.diseaseSupportScore - left.diseaseSupportScore;
      }
      return left.geneLabel.localeCompare(right.geneLabel);
    })
    .slice(0, Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : DX_QUERY_DEFAULTS.defaultLimit)
    .map((result, indexValue) => ({
      ...result,
      rank: indexValue + 1
    }));

  return {
    queryPhenotypes: directRanking.queryPhenotypes,
    results: rankedResults,
    engineSummary: {
      ...buildEngineSummary(index)
    }
  };
}

export function buildSyntheticDxBenchmarkCases(index, options = {}) {
  const config = {
    ...DX_BENCHMARK_DEFAULTS,
    ...options
  };
  const random = createSeededRandom(config.seed);
  const diseaseProfiles = index.diseaseProfiles.filter(
    (profile) => profile.phenotypes.length >= config.minDiseasePhenotypeCount
  );
  const phenotypeUniverse = [...index.labelByCurie.keys()];

  return sampleWithoutReplacement(diseaseProfiles, Math.min(config.maxCases, diseaseProfiles.length), random).map(
    (profile) => {
      const requestedCount = Math.round(
        profile.phenotypes.length *
          (config.minCoverageRatio + random() * (config.maxCoverageRatio - config.minCoverageRatio))
      );
      const queryCount = clamp(
        requestedCount,
        config.minQueryPhenotypeCount,
        Math.min(config.maxQueryPhenotypeCount, profile.phenotypes.length)
      );
      const sampledPhenotypes = sampleWithoutReplacement(profile.phenotypes, queryCount, random).map(
        (phenotype) => phenotype.phenotypeCurie
      );

      const noiseCount = Math.round(queryCount * config.noisePhenotypeRatio);
      const noiseTerms = sampleWithoutReplacement(
        phenotypeUniverse.filter((curie) => !sampledPhenotypes.includes(curie)),
        noiseCount,
        random
      );

      return {
        diseaseCurie: profile.entityCurie,
        diseaseLabel: profile.entityLabel,
        phenotypeCuries: [...new Set([...sampledPhenotypes, ...noiseTerms])]
      };
    }
  );
}

export function benchmarkDxSimilarityIndex(index, options = {}) {
  const config = {
    ...DX_BENCHMARK_DEFAULTS,
    ...options
  };
  const cases = buildSyntheticDxBenchmarkCases(index, config);
  const rankResults = [];

  for (const dxCase of cases) {
    const ranking = rankDiseasesByPhenotypeSimilarity(index, {
      phenotypeCuries: dxCase.phenotypeCuries,
      limit: index.totalDiseases
    });
    const match = ranking.results.find((result) => result.diseaseCurie === dxCase.diseaseCurie);
    rankResults.push({
      diseaseCurie: dxCase.diseaseCurie,
      diseaseLabel: dxCase.diseaseLabel,
      phenotypeCount: dxCase.phenotypeCuries.length,
      rank: match?.rank || null
    });
  }

  const recallAt = {};
  for (const cutoff of config.recallCutoffs) {
    recallAt[`top${cutoff}`] = rankResults.filter((result) => result.rank && result.rank <= cutoff).length / (rankResults.length || 1);
  }

  const resolvedRanks = rankResults.map((result) => result.rank).filter((rank) => Number.isInteger(rank));

  return {
    caseCount: rankResults.length,
    recallAt,
    medianRank: median(resolvedRanks),
    unresolvedCaseCount: rankResults.length - resolvedRanks.length,
    rankResults
  };
}

let cachedDxIndex = null;
let cachedAt = 0;

export async function loadDxSimilarityIndex(client, { forceRefresh = false } = {}) {
  if (!forceRefresh && cachedDxIndex && Date.now() - cachedAt < DX_QUERY_DEFAULTS.cacheTtlMs) {
    return cachedDxIndex;
  }

  const ontologyRows = await loadDxPhenotypeOntologyRows(client);
  const diseasePhenotypeResult = await loadDxDiseasePhenotypeRows(client);
  const genePhenotypeResult = await loadDxGenePhenotypeRows(client);
  const geneDiseaseSupportRows = await loadDxGeneDiseaseSupportRows(client);

  const index = buildDxSimilarityIndex({
    ontologyRows,
    diseasePhenotypeRows: diseasePhenotypeResult.rows,
    genePhenotypeRows: genePhenotypeResult.rows,
    geneDiseaseSupportRows
  });
  index.sourceMode = {
    disease: diseasePhenotypeResult.sourceMode,
    gene: genePhenotypeResult.sourceMode
  };

  cachedDxIndex = index;
  cachedAt = Date.now();
  return index;
}

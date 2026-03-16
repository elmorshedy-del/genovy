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
        phenotypes: []
      });
    }

    profilesByCurie.get(entityCurie).phenotypes.push({
      phenotypeEntityId: Number(row.phenotype_entity_id),
      phenotypeCurie: row.phenotype_curie,
      phenotypeLabel: row.phenotype_label,
      evidenceCode: row.evidence_code || '',
      referenceText: row[referenceTextKey] || ''
    });
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

function buildBestTermMatch(index, queryTerm, diseasePhenotypes) {
  let bestMatch = {
    patientPhenotypeCurie: queryTerm.phenotypeCurie,
    patientPhenotypeLabel: queryTerm.phenotypeLabel,
    diseasePhenotypeCurie: '',
    diseasePhenotypeLabel: '',
    micaCurie: '',
    micaLabel: '',
    score: DX_SIMILARITY_DEFAULTS.rootSimilarityFloor,
    evidenceCode: '',
    referenceText: ''
  };

  for (const diseasePhenotype of diseasePhenotypes) {
    const similarity = index.resolveSimilarity(queryTerm.phenotypeCurie, diseasePhenotype.phenotypeCurie);
    if (similarity.score < bestMatch.score) {
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
      evidenceCode: diseasePhenotype.evidenceCode,
      referenceText: diseasePhenotype.referenceText
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
  return bestScore;
}

function buildRankedResults(index, profiles, { phenotypeCuries, limit }) {
  const queryPhenotypes = buildPatientPhenotypeTerms(index, phenotypeCuries);
  if (!queryPhenotypes.length) {
    return {
      queryPhenotypes: [],
      results: []
    };
  }

  const results = [];

  for (const profile of profiles) {
    const patientToDiseaseMatches = queryPhenotypes.map((queryPhenotype) =>
      buildBestTermMatch(index, queryPhenotype, profile.phenotypes)
    );
    const diseaseToPatientScores = profile.phenotypes.map((diseasePhenotype) =>
      buildSymmetricDiseaseMatch(index, diseasePhenotype, queryPhenotypes)
    );

    const patientAverageScore = average(patientToDiseaseMatches.map((match) => match.score));
    const diseaseAverageScore = average(diseaseToPatientScores);
    const bmaScore = (patientAverageScore + diseaseAverageScore) / 2;
    const normalizedScore = index.maxInfoContent > 0 ? bmaScore / index.maxInfoContent : 0;

    results.push({
      entityCurie: profile.entityCurie,
      entityLabel: profile.entityLabel,
      entityId: profile.entityId,
      bmaScore,
      normalizedScore: Number(normalizedScore.toFixed(DX_SIMILARITY_DEFAULTS.normalizedScorePrecision)),
      patientAverageScore,
      diseaseAverageScore,
      directPhenotypeCount: profile.phenotypes.length,
      matchedPhenotypeCount: patientToDiseaseMatches.filter((match) => match.score > 0).length,
      trace: patientToDiseaseMatches
        .sort((left, right) => right.score - left.score)
        .slice(0, DX_QUERY_DEFAULTS.traceTermsPerDisease)
    });
  }

  results.sort((left, right) => {
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

export function rankDiseasesByPhenotypeSimilarity(index, { phenotypeCuries, limit = DX_QUERY_DEFAULTS.defaultLimit }) {
  const ranking = buildRankedResults(index, index.diseaseProfiles, { phenotypeCuries, limit });
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
      directPhenotypeCount: result.directPhenotypeCount,
      matchedPhenotypeCount: result.matchedPhenotypeCount,
      trace: result.trace
    })),
    engineSummary: {
      ...buildEngineSummary(index)
    }
  };
}

export function rankGenesByPhenotypeSimilarity(index, { phenotypeCuries, limit = DX_QUERY_DEFAULTS.defaultLimit }) {
  const directRanking = buildRankedResults(index, index.geneProfiles, {
    phenotypeCuries,
    limit: index.totalGenes || limit
  });
  const diseaseRanking = buildRankedResults(index, index.diseaseProfiles, {
    phenotypeCuries,
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
        supportingDiseaseCurie: existing?.supportingDiseaseCurie || '',
        supportingDiseaseLabel: existing?.supportingDiseaseLabel || '',
        supportingDiseaseClassification: existing?.supportingDiseaseClassification || ''
      });
    }
  }

  for (const diseaseResult of diseaseRanking.results) {
    const links = index.geneDiseaseSupportIndex.get(diseaseResult.entityCurie) || [];
    for (const link of links) {
      const diseaseSupportScore = Number(
        (diseaseResult.normalizedScore * link.supportWeight).toFixed(DX_SIMILARITY_DEFAULTS.normalizedScorePrecision)
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
          supportingDiseaseCurie: '',
          supportingDiseaseLabel: '',
          supportingDiseaseClassification: ''
        };

      if (geneCuriePriority(link.geneCurie) > geneCuriePriority(existing.geneCurie)) {
        existing.geneCurie = link.geneCurie;
      }
      if (!existing.geneLabel && link.geneLabel) {
        existing.geneLabel = link.geneLabel;
        existing.geneSymbol = link.geneLabel;
      }

      if (diseaseSupportScore > existing.diseaseSupportScore) {
        existing.diseaseSupportScore = diseaseSupportScore;
        existing.supportingDiseaseCurie = link.diseaseCurie;
        existing.supportingDiseaseLabel = link.diseaseLabel;
        existing.supportingDiseaseClassification = link.classification;
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

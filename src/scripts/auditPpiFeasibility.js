import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import { pipeline } from 'node:stream/promises';
import zlib from 'node:zlib';
import { assertRequiredEnv } from '../config/env.js';
import { withClient } from '../db/pool.js';
import { loadDxSimilarityIndex, rankGenesByPhenotypeSimilarity } from '../services/dx/similarityEngine.js';

const DEFAULTS = Object.freeze({
  caseInputJson: 'input/ranking-pressure-cases.json',
  rankingAuditMarkdown: 'input/audit-ranking-pressure.md',
  outputMarkdown: 'output/audit-ppi-feasibility.md',
  cacheDir: 'cache/string-v12',
  linksUrl: 'https://stringdb-downloads.org/download/protein.links.v12.0/9606.protein.links.v12.0.txt.gz',
  aliasesUrl: 'https://stringdb-downloads.org/download/protein.aliases.v12.0/9606.protein.aliases.v12.0.txt.gz',
  minCombinedScore: 700,
  restartProbability: 0.7,
  seedCount: 10,
  maxIterations: 50,
  convergenceTolerance: 1e-10
});

function progress(message) {
  console.error(`[ppi-feasibility] ${message}`);
}

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

function resolvePath(rawValue, fallback) {
  const value = String(rawValue || fallback || '').trim();
  if (!value) {
    return '';
  }
  return path.isAbsolute(value) ? value : path.resolve(value);
}

async function ensureDirectory(dirPath) {
  await fsPromises.mkdir(dirPath, { recursive: true });
}

async function downloadFile(url, destinationPath) {
  if (fs.existsSync(destinationPath)) {
    return destinationPath;
  }

  await ensureDirectory(path.dirname(destinationPath));
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
  }

  await pipeline(response.body, fs.createWriteStream(destinationPath));
  return destinationPath;
}

function normalizeGeneKey(rawValue) {
  if (rawValue == null) {
    return '';
  }

  const text = String(rawValue).trim();
  if (!text) {
    return '';
  }

  const lower = text.toLowerCase();
  if (lower.startsWith('symbol:')) {
    return `symbol:${text.split(':', 2)[1].toUpperCase()}`;
  }
  if (lower.startsWith('ncbigene:')) {
    return `ncbigene:${text.split(':', 2)[1]}`;
  }
  if (lower.startsWith('hgnc:')) {
    return `hgnc:${text.split(':', 2)[1]}`;
  }
  if (lower.startsWith('ensembl:')) {
    return `ensembl:${text.split(':', 2)[1].toUpperCase()}`;
  }
  if (text.toUpperCase().startsWith('ENSG')) {
    return `ensembl:${text.toUpperCase()}`;
  }
  return `symbol:${text.toUpperCase()}`;
}

function escapeMarkdown(rawValue) {
  return String(rawValue ?? '').replace(/\|/g, '\\|');
}

function formatScore(value, digits = 6) {
  if (!Number.isFinite(value)) {
    return '';
  }
  return Number(value).toFixed(digits);
}

function formatPercent(numerator, denominator, digits = 1) {
  if (!denominator) {
    return '0.0%';
  }
  return `${((numerator / denominator) * 100).toFixed(digits)}%`;
}

function buildCandidateKeys(candidate) {
  return new Set(
    [normalizeGeneKey(candidate.geneSymbol), normalizeGeneKey(candidate.geneCurie), normalizeGeneKey(candidate.geneLabel)].filter(
      Boolean
    )
  );
}

function findTruthGeneResult(results, truthGeneKeys) {
  const truthKeySet = new Set((truthGeneKeys || []).map((key) => normalizeGeneKey(key)).filter(Boolean));
  return (
    results.find((candidate) => {
      for (const key of buildCandidateKeys(candidate)) {
        if (truthKeySet.has(key)) {
          return true;
        }
      }
      return false;
    }) || null
  );
}

function parsePatternACaseIds(markdown) {
  const caseIds = [];
  for (const line of markdown.split('\n')) {
    if (!line.startsWith('| PMID_')) {
      continue;
    }

    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (cells.length < 2) {
      continue;
    }

    if (cells[1] === 'A') {
      caseIds.push(cells[0]);
    }
  }

  return caseIds;
}

function extractIdentifierCuries(concept) {
  const identifiers = new Set();
  if (concept.canonicalCurie) {
    identifiers.add(concept.canonicalCurie);
  }
  for (const identifier of concept.identifierCuries || []) {
    if (identifier) {
      identifiers.add(identifier);
    }
  }
  return [...identifiers];
}

async function loadCanonicalGeneConcepts(client) {
  const result = await client.query(
    `
      SELECT
        concept_id,
        canonical_curie,
        canonical_label,
        COALESCE(metadata_json->'identifierCuries', '[]'::jsonb) AS identifier_curies
      FROM canonical_concepts
      WHERE concept_type = 'gene'
      ORDER BY concept_id ASC
    `
  );

  return result.rows.map((row) => ({
    conceptId: Number(row.concept_id),
    canonicalCurie: row.canonical_curie || '',
    canonicalLabel: row.canonical_label || '',
    identifierCuries: Array.isArray(row.identifier_curies) ? row.identifier_curies : []
  }));
}

function buildGeneConceptLookups(concepts) {
  const conceptById = new Map();
  const conceptByKey = new Map();
  const conceptIdByNcbiCurie = new Map();

  for (const concept of concepts) {
    conceptById.set(concept.conceptId, concept);

    const keys = new Set([
      normalizeGeneKey(concept.canonicalCurie),
      normalizeGeneKey(concept.canonicalLabel)
    ]);

    for (const identifier of extractIdentifierCuries(concept)) {
      const normalizedKey = normalizeGeneKey(identifier);
      if (normalizedKey) {
        keys.add(normalizedKey);
      }

      if (String(identifier).startsWith('NCBIGene:')) {
        conceptIdByNcbiCurie.set(identifier, concept.conceptId);
      }
    }

    for (const key of keys) {
      if (key) {
        conceptByKey.set(key, concept);
      }
    }
  }

  return {
    conceptById,
    conceptByKey,
    conceptIdByNcbiCurie
  };
}

async function loadStringProteinToConceptMap(aliasPath, conceptIdByNcbiCurie) {
  const proteinToConcepts = new Map();
  const input = fs.createReadStream(aliasPath).pipe(zlib.createGunzip());
  const lineReader = readline.createInterface({ input, crlfDelay: Infinity });
  let lineCount = 0;

  for await (const line of lineReader) {
    lineCount += 1;
    if (!line || line.startsWith('#')) {
      continue;
    }

    const [proteinId, alias, source] = line.split('\t');
    if (!proteinId || !alias || !source) {
      continue;
    }

    if (!/geneid|entrez/i.test(source)) {
      continue;
    }

    if (!/^\d+$/.test(alias)) {
      continue;
    }

    const conceptId = conceptIdByNcbiCurie.get(`NCBIGene:${alias}`);
    if (!conceptId) {
      continue;
    }

    const concepts = proteinToConcepts.get(proteinId) || new Set();
    concepts.add(conceptId);
    proteinToConcepts.set(proteinId, concepts);

    if (lineCount % 500000 === 0) {
      progress(`parsed ${lineCount} alias rows`);
    }
  }

  const proteinToConceptId = new Map();
  for (const [proteinId, conceptSet] of proteinToConcepts.entries()) {
    if (conceptSet.size === 1) {
      proteinToConceptId.set(proteinId, [...conceptSet][0]);
    }
  }

  return proteinToConceptId;
}

async function buildStringGraph(linksPath, proteinToConceptId, minCombinedScore) {
  const edgeWeightByPair = new Map();
  const coveredConceptIds = new Set();
  let highConfidenceProteinEdges = 0;
  let lineCount = 0;

  const input = fs.createReadStream(linksPath).pipe(zlib.createGunzip());
  const lineReader = readline.createInterface({ input, crlfDelay: Infinity });

  for await (const line of lineReader) {
    lineCount += 1;
    if (!line || line.startsWith('protein1 ')) {
      continue;
    }

    const [protein1, protein2, combinedScoreRaw] = line.split(' ');
    const combinedScore = Number.parseInt(combinedScoreRaw, 10);
    if (!protein1 || !protein2 || !Number.isFinite(combinedScore)) {
      continue;
    }

    if (combinedScore <= minCombinedScore) {
      continue;
    }

    highConfidenceProteinEdges += 1;

    const concept1 = proteinToConceptId.get(protein1);
    const concept2 = proteinToConceptId.get(protein2);
    if (!concept1 || !concept2 || concept1 === concept2) {
      continue;
    }

    coveredConceptIds.add(concept1);
    coveredConceptIds.add(concept2);

    const left = Math.min(concept1, concept2);
    const right = Math.max(concept1, concept2);
    const key = `${left}|${right}`;
    const weight = combinedScore / 1000;
    if (!edgeWeightByPair.has(key) || weight > edgeWeightByPair.get(key).weight) {
      edgeWeightByPair.set(key, { left, right, weight });
    }

    if (lineCount % 500000 === 0) {
      progress(`parsed ${lineCount} STRING links, kept ${highConfidenceProteinEdges} high-confidence protein edges`);
    }
  }

  const adjacency = new Map();
  for (const { left, right, weight } of edgeWeightByPair.values()) {
    const leftNeighbors = adjacency.get(left) || [];
    leftNeighbors.push({ conceptId: right, weight });
    adjacency.set(left, leftNeighbors);

    const rightNeighbors = adjacency.get(right) || [];
    rightNeighbors.push({ conceptId: left, weight });
    adjacency.set(right, rightNeighbors);
  }

  return {
    highConfidenceProteinEdges,
    mappedGeneEdges: edgeWeightByPair.size,
    coveredConceptIds,
    adjacency
  };
}

function lookupConceptForCandidate(candidate, conceptByKey) {
  for (const key of buildCandidateKeys(candidate)) {
    const concept = conceptByKey.get(key);
    if (concept) {
      return concept;
    }
  }
  return null;
}

function computeCaseRanking(caseInput, index, conceptByKey) {
  const ranking = rankGenesByPhenotypeSimilarity(index, {
    phenotypeCuries: caseInput.phenotypeCuries,
    excludedPhenotypeCuries: caseInput.excludedPhenotypeCuries || [],
    limit: 999999
  });

  const scoreByConceptId = new Map();
  const rankedConcepts = [];

  for (const candidate of ranking.results) {
    const concept = lookupConceptForCandidate(candidate, conceptByKey);
    if (!concept) {
      continue;
    }

    const existing = scoreByConceptId.get(concept.conceptId);
    if (!existing || candidate.normalizedScore > existing.dxSimScore) {
      const row = {
        conceptId: concept.conceptId,
        geneCurie: candidate.geneCurie,
        geneLabel: candidate.geneLabel,
        dxSimScore: candidate.normalizedScore,
        rank: candidate.rank
      };
      scoreByConceptId.set(concept.conceptId, row);
    }
  }

  for (const row of scoreByConceptId.values()) {
    rankedConcepts.push(row);
  }

  rankedConcepts.sort((left, right) => {
    if (right.dxSimScore !== left.dxSimScore) {
      return right.dxSimScore - left.dxSimScore;
    }
    return left.geneLabel.localeCompare(right.geneLabel);
  });

  rankedConcepts.forEach((row, indexValue) => {
    row.rank = indexValue + 1;
  });

  const truthCandidate = findTruthGeneResult(ranking.results, caseInput.truthGeneKeys);
  const truthConcept = caseInput.truthGeneKeys
    .map((key) => conceptByKey.get(normalizeGeneKey(key)))
    .find(Boolean);
  const truthConceptScore = truthConcept ? scoreByConceptId.get(truthConcept.conceptId) || null : null;

  return {
    ranking,
    rankedConcepts,
    scoreByConceptId,
    truthCandidate,
    truthConcept,
    truthConceptScore
  };
}

function buildStep4bCaseRows(caseInputs, patternACaseIds, index, conceptByKey, adjacency, conceptById) {
  const missCases = caseInputs.filter((caseInput) => caseInput.bucket === 'miss');
  const selectedCaseIds = new Set([...missCases.map((caseInput) => caseInput.caseId), ...patternACaseIds]);
  const selectedCases = caseInputs.filter((caseInput) => selectedCaseIds.has(caseInput.caseId));
  const rows = [];
  let casesWithNeighbors = 0;
  let casesWithNeighborAboveTruth = 0;
  let casesWithTop10Neighbor = 0;

  for (let caseIndex = 0; caseIndex < selectedCases.length; caseIndex += 1) {
    const caseInput = selectedCases[caseIndex];
    const caseRanking = computeCaseRanking(caseInput, index, conceptByKey);
    const truthConceptId = caseRanking.truthConcept?.conceptId || null;
    const truthScore = caseRanking.truthConceptScore?.dxSimScore || 0;
    const neighbors = truthConceptId ? adjacency.get(truthConceptId) || [] : [];

    let bestNeighbor = null;
    for (const neighbor of neighbors) {
      const neighborScore = caseRanking.scoreByConceptId.get(neighbor.conceptId);
      if (!neighborScore) {
        continue;
      }

      if (!bestNeighbor || neighborScore.dxSimScore > bestNeighbor.dxSimScore) {
        bestNeighbor = {
          conceptId: neighbor.conceptId,
          geneLabel: conceptById.get(neighbor.conceptId)?.canonicalLabel || neighborScore.geneLabel,
          dxSimScore: neighborScore.dxSimScore,
          dxSimRank: neighborScore.rank
        };
      }
    }

    if (neighbors.length) {
      casesWithNeighbors += 1;
    }
    if (bestNeighbor && bestNeighbor.dxSimScore > truthScore) {
      casesWithNeighborAboveTruth += 1;
    }
    if (bestNeighbor && bestNeighbor.dxSimRank <= 10) {
      casesWithTop10Neighbor += 1;
    }

    rows.push({
      caseId: caseInput.caseId,
      truthGene: caseInput.truthGene,
      truthDxSimScore: truthScore,
      ppiNeighborCount: neighbors.length,
      bestNeighborGene: bestNeighbor?.geneLabel || '',
      bestNeighborDxSimScore: bestNeighbor?.dxSimScore || 0,
      bestNeighborDxSimRank: bestNeighbor?.dxSimRank || null
    });

    progress(`step 4b case ${caseIndex + 1}/${selectedCases.length}: ${caseInput.caseId}`);
  }

  rows.sort((left, right) => left.caseId.localeCompare(right.caseId));

  return {
    selectedCases,
    rows,
    casesWithNeighbors,
    casesWithNeighborAboveTruth,
    casesWithTop10Neighbor
  };
}

function buildSparseGraph(adjacency, coveredConceptIds) {
  const conceptIds = [...coveredConceptIds].sort((left, right) => left - right);
  const nodeIndexByConceptId = new Map(conceptIds.map((conceptId, index) => [conceptId, index]));
  const transitions = Array.from({ length: conceptIds.length }, () => []);

  for (const conceptId of conceptIds) {
    const sourceIndex = nodeIndexByConceptId.get(conceptId);
    const neighbors = adjacency.get(conceptId) || [];
    const totalWeight = neighbors.reduce((sum, neighbor) => sum + neighbor.weight, 0);
    if (!totalWeight) {
      continue;
    }

    transitions[sourceIndex] = neighbors
      .filter((neighbor) => nodeIndexByConceptId.has(neighbor.conceptId))
      .map((neighbor) => ({
        index: nodeIndexByConceptId.get(neighbor.conceptId),
        probability: neighbor.weight / totalWeight
      }));
  }

  return {
    conceptIds,
    nodeIndexByConceptId,
    transitions
  };
}

function runRandomWalkWithRestart(graph, seedConceptIds, seedWeights, restartProbability, maxIterations, tolerance) {
  const nodeCount = graph.conceptIds.length;
  if (!nodeCount || !seedConceptIds.length) {
    return new Float64Array(nodeCount);
  }

  const seedVector = new Float64Array(nodeCount);
  let totalSeedWeight = 0;

  for (let index = 0; index < seedConceptIds.length; index += 1) {
    const nodeIndex = graph.nodeIndexByConceptId.get(seedConceptIds[index]);
    if (nodeIndex == null) {
      continue;
    }
    const weight = seedWeights[index];
    if (!Number.isFinite(weight) || weight <= 0) {
      continue;
    }
    seedVector[nodeIndex] += weight;
    totalSeedWeight += weight;
  }

  if (!totalSeedWeight) {
    return new Float64Array(nodeCount);
  }

  for (let index = 0; index < nodeCount; index += 1) {
    seedVector[index] /= totalSeedWeight;
  }

  let current = Float64Array.from(seedVector);
  let next = new Float64Array(nodeCount);

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    next.fill(0);

    for (let sourceIndex = 0; sourceIndex < nodeCount; sourceIndex += 1) {
      const sourceWeight = current[sourceIndex];
      if (!sourceWeight) {
        continue;
      }

      const outgoing = graph.transitions[sourceIndex];
      if (!outgoing.length) {
        continue;
      }

      for (const edge of outgoing) {
        next[edge.index] += (1 - restartProbability) * sourceWeight * edge.probability;
      }
    }

    let delta = 0;
    for (let index = 0; index < nodeCount; index += 1) {
      next[index] += restartProbability * seedVector[index];
      delta += Math.abs(next[index] - current[index]);
    }

    if (delta <= tolerance) {
      return next;
    }

    const swap = current;
    current = next;
    next = swap;
  }

  return current;
}

function buildStep4cSummary(caseInputs, index, conceptByKey, graph, conceptById, config) {
  const rows = [];
  let top1 = 0;
  let top5 = 0;
  let top10 = 0;
  let truthWithPpiCoverage = 0;

  for (let caseIndex = 0; caseIndex < caseInputs.length; caseIndex += 1) {
    const caseInput = caseInputs[caseIndex];
    const caseRanking = computeCaseRanking(caseInput, index, conceptByKey);
    const truthConceptId = caseRanking.truthConcept?.conceptId || null;
    const truthNodeIndex = truthConceptId == null ? null : graph.nodeIndexByConceptId.get(truthConceptId);

    const seedRows = caseRanking.rankedConcepts
      .filter((candidate) => graph.nodeIndexByConceptId.has(candidate.conceptId) && candidate.dxSimScore > 0)
      .slice(0, config.seedCount);

    const seedConceptIds = seedRows.map((row) => row.conceptId);
    const seedWeights = seedRows.map((row) => row.dxSimScore);
    const vector = runRandomWalkWithRestart(
      graph,
      seedConceptIds,
      seedWeights,
      config.restartProbability,
      config.maxIterations,
      config.convergenceTolerance
    );

    const ranked = [];
    for (let indexValue = 0; indexValue < graph.conceptIds.length; indexValue += 1) {
      ranked.push({
        conceptId: graph.conceptIds[indexValue],
        score: vector[indexValue],
        label: conceptById.get(graph.conceptIds[indexValue])?.canonicalLabel || ''
      });
    }

    ranked.sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.label.localeCompare(right.label);
    });

    let truthRank = null;
    let truthScore = 0;
    if (truthNodeIndex != null) {
      truthWithPpiCoverage += 1;
      truthScore = vector[truthNodeIndex];
      truthRank =
        ranked.findIndex((row) => row.conceptId === truthConceptId) + 1 || null;
    }

    if (truthRank === 1) {
      top1 += 1;
    }
    if (truthRank && truthRank <= 5) {
      top5 += 1;
    }
    if (truthRank && truthRank <= 10) {
      top10 += 1;
    }

    rows.push({
      caseId: caseInput.caseId,
      truthGene: caseInput.truthGene,
      truthDxPpiScore: truthScore,
      truthDxPpiRank: truthRank,
      seedGenes: seedRows.map((row) => row.geneLabel)
    });

    progress(`step 4c case ${caseIndex + 1}/${caseInputs.length}: ${caseInput.caseId}`);
  }

  rows.sort((left, right) => left.caseId.localeCompare(right.caseId));

  return {
    rows,
    top1,
    top5,
    top10,
    truthWithPpiCoverage
  };
}

function buildMarkdownReport({ config, step4a, step4b, step4c }) {
  const lines = [
    '# PPI Feasibility Audit',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    '## Inputs',
    '',
    `- STRING links: ${config.linksUrl}`,
    `- STRING aliases: ${config.aliasesUrl}`,
    `- High-confidence threshold: combined score > ${config.minCombinedScore}`,
    `- Restart probability: ${config.restartProbability}`,
    `- Seed gene count: ${config.seedCount}`,
    '',
    '## Step 4a: STRING Coverage',
    '',
    '| Metric | Value |',
    '|---|---:|',
    `| Canonical gene concepts in live graph | ${step4a.totalGeneConcepts} |`,
    `| High-confidence STRING protein edges | ${step4a.highConfidenceProteinEdges} |`,
    `| Mapped gene-gene edges after alias resolution | ${step4a.mappedGeneEdges} |`,
    `| Gene concepts with >=1 STRING edge | ${step4a.genesWithPpi} |`,
    `| Gene concepts with zero STRING coverage | ${step4a.genesWithoutPpi} |`,
    '',
    '## Step 4b: PPI Neighborhood Check',
    '',
    `- Rich-support miss cases: ${step4b.missCaseCount}`,
    `- Pattern A cases from ranking audit: ${step4b.patternACaseCount}`,
    `- Unique cases evaluated in this table: ${step4b.uniqueCaseCount}`,
    `- Cases where the truth gene has at least one STRING neighbor: ${step4b.casesWithNeighbors}`,
    `- Cases where the best STRING neighbor scores above the truth gene in DX-Sim: ${step4b.casesWithNeighborAboveTruth}`,
    `- Cases where the best STRING neighbor is already in the DX-Sim top 10: ${step4b.casesWithTop10Neighbor}`,
    '',
    '| Case ID | Truth gene | Truth gene DX-Sim score | PPI neighbors in STRING | Best-scoring PPI neighbor | That neighbor DX-Sim score |',
    '|---|---|---:|---:|---|---:|'
  ];

  for (const row of step4b.rows) {
    lines.push(
      `| ${escapeMarkdown(row.caseId)} | ${escapeMarkdown(row.truthGene)} | ${formatScore(row.truthDxSimScore)} | ${row.ppiNeighborCount} | ${escapeMarkdown(row.bestNeighborGene || '')} | ${formatScore(row.bestNeighborDxSimScore)} |`
    );
  }

  lines.push('', '## Step 4c: Minimal RWR Prototype', '');
  lines.push(`Promising enough to run RWR: ${step4b.casesWithNeighborAboveTruth > 0 ? 'Yes' : 'No'}`);
  lines.push('');
  lines.push('| Metric | Count | Percentage of 41 cases |');
  lines.push('|---|---:|---:|');
  lines.push(`| Truth gene in DX-PPI top 1 | ${step4c.top1} | ${formatPercent(step4c.top1, step4c.totalCases)} |`);
  lines.push(`| Truth gene in DX-PPI top 5 | ${step4c.top5} | ${formatPercent(step4c.top5, step4c.totalCases)} |`);
  lines.push(`| Truth gene in DX-PPI top 10 | ${step4c.top10} | ${formatPercent(step4c.top10, step4c.totalCases)} |`);
  lines.push(`| Truth genes with any STRING node coverage | ${step4c.truthWithPpiCoverage} | ${formatPercent(step4c.truthWithPpiCoverage, step4c.totalCases)} |`);
  lines.push('');
  lines.push('| Case ID | Truth gene | Truth DX-PPI score | Truth DX-PPI rank | Seed genes |');
  lines.push('|---|---|---:|---:|---|');

  for (const row of step4c.rows) {
    lines.push(
      `| ${escapeMarkdown(row.caseId)} | ${escapeMarkdown(row.truthGene)} | ${formatScore(row.truthDxPpiScore, 8)} | ${row.truthDxPpiRank ?? ''} | ${escapeMarkdown(row.seedGenes.join(', '))} |`
    );
  }

  return lines.join('\n');
}

async function main() {
  assertRequiredEnv();

  const flags = parseArgs(process.argv.slice(2));
  const config = {
    ...DEFAULTS,
    caseInputJson: resolvePath(flags['case-input-json'], DEFAULTS.caseInputJson),
    rankingAuditMarkdown: resolvePath(flags['ranking-audit-markdown'], DEFAULTS.rankingAuditMarkdown),
    outputMarkdown: resolvePath(flags['output-markdown'], DEFAULTS.outputMarkdown),
    cacheDir: resolvePath(flags['cache-dir'], DEFAULTS.cacheDir)
  };

  await ensureDirectory(config.cacheDir);
  await ensureDirectory(path.dirname(config.outputMarkdown));

  const [caseInputJson, rankingAuditMarkdown] = await Promise.all([
    fsPromises.readFile(config.caseInputJson, 'utf8'),
    fsPromises.readFile(config.rankingAuditMarkdown, 'utf8')
  ]);
  progress('loaded case inputs');

  const caseInputs = JSON.parse(caseInputJson);
  const patternACaseIds = parsePatternACaseIds(rankingAuditMarkdown);

  const [linksPath, aliasesPath] = await Promise.all([
    downloadFile(config.linksUrl, path.join(config.cacheDir, path.basename(config.linksUrl))),
    downloadFile(config.aliasesUrl, path.join(config.cacheDir, path.basename(config.aliasesUrl)))
  ]);
  progress('STRING files ready');

  const dbData = await withClient(async (client) => {
    const [index, geneConcepts] = await Promise.all([loadDxSimilarityIndex(client), loadCanonicalGeneConcepts(client)]);
    return { index, geneConcepts };
  });
  progress(`loaded live graph index with ${dbData.geneConcepts.length} canonical gene concepts`);

  const { conceptById, conceptByKey, conceptIdByNcbiCurie } = buildGeneConceptLookups(dbData.geneConcepts);
  const proteinToConceptId = await loadStringProteinToConceptMap(aliasesPath, conceptIdByNcbiCurie);
  progress(`resolved ${proteinToConceptId.size} STRING proteins to canonical genes`);
  const stringGraph = await buildStringGraph(linksPath, proteinToConceptId, config.minCombinedScore);
  progress(
    `built STRING graph with ${stringGraph.highConfidenceProteinEdges} high-confidence protein edges and ${stringGraph.mappedGeneEdges} mapped gene edges`
  );
  const sparseGraph = buildSparseGraph(stringGraph.adjacency, stringGraph.coveredConceptIds);

  const step4a = {
    totalGeneConcepts: dbData.geneConcepts.length,
    highConfidenceProteinEdges: stringGraph.highConfidenceProteinEdges,
    mappedGeneEdges: stringGraph.mappedGeneEdges,
    genesWithPpi: stringGraph.coveredConceptIds.size,
    genesWithoutPpi: dbData.geneConcepts.length - stringGraph.coveredConceptIds.size
  };

  const step4bAnalysis = buildStep4bCaseRows(
    caseInputs,
    patternACaseIds,
    dbData.index,
    conceptByKey,
    stringGraph.adjacency,
    conceptById
  );
  const step4b = {
    missCaseCount: caseInputs.filter((caseInput) => caseInput.bucket === 'miss').length,
    patternACaseCount: patternACaseIds.length,
    uniqueCaseCount: step4bAnalysis.rows.length,
    casesWithNeighbors: step4bAnalysis.casesWithNeighbors,
    casesWithNeighborAboveTruth: step4bAnalysis.casesWithNeighborAboveTruth,
    casesWithTop10Neighbor: step4bAnalysis.casesWithTop10Neighbor,
    rows: step4bAnalysis.rows
  };

  const step4cAnalysis = buildStep4cSummary(
    caseInputs,
    dbData.index,
    conceptByKey,
    sparseGraph,
    conceptById,
    config
  );
  const step4c = {
    totalCases: caseInputs.length,
    top1: step4cAnalysis.top1,
    top5: step4cAnalysis.top5,
    top10: step4cAnalysis.top10,
    truthWithPpiCoverage: step4cAnalysis.truthWithPpiCoverage,
    rows: step4cAnalysis.rows
  };

  const markdown = buildMarkdownReport({
    config,
    step4a,
    step4b,
    step4c
  });
  await fsPromises.writeFile(config.outputMarkdown, markdown, 'utf8');

  console.log(
    JSON.stringify(
      {
        outputMarkdown: config.outputMarkdown,
        step4a,
        step4b: {
          missCaseCount: step4b.missCaseCount,
          patternACaseCount: step4b.patternACaseCount,
          uniqueCaseCount: step4b.uniqueCaseCount,
          casesWithNeighbors: step4b.casesWithNeighbors,
          casesWithNeighborAboveTruth: step4b.casesWithNeighborAboveTruth,
          casesWithTop10Neighbor: step4b.casesWithTop10Neighbor
        },
        step4c: {
          totalCases: step4c.totalCases,
          top1: step4c.top1,
          top5: step4c.top5,
          top10: step4c.top10,
          truthWithPpiCoverage: step4c.truthWithPpiCoverage
        }
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

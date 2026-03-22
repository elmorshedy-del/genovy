import fs from 'node:fs/promises';
import path from 'node:path';
import { withClient } from '../db/pool.js';
import { extractDxPhenotypeInput, validateDxPhenotypeInput } from '../lib/phenopackets.js';
import {
  loadDxDiseasePhenotypeRows,
  loadDxGeneDiseaseSupportRows,
  loadDxGenePhenotypeRows,
  loadDxPhenotypeOntologyRows
} from '../repositories/dxRepository.js';
import { buildDxSimilarityIndex, rankGenesByPhenotypeSimilarity } from '../services/dx/similarityEngine.js';
import {
  buildShadowMarkdown,
  compareBaselineVsShadow,
  extractTruthGeneKeys,
  findTruthRank,
  parseArgs,
  selectShardFiles,
  summarizeRun,
  topMoves
} from './lib/shadowBenchmarkUtils.js';

const DEFAULTS = Object.freeze({
  phenopacketDir: '/Users/ahmedelmorshedy/Genovy/output/pheval-official-sample-100/phenopackets',
  outputJson: '/Users/ahmedelmorshedy/Genovy/output/shadow-child-profile-borrow.json',
  outputMd: '/Users/ahmedelmorshedy/Genovy/output/shadow-child-profile-borrow.md',
  limit: 100
});

const PRESENT_STATUS = 'present';
const PROPAGATED_EDGE_ORIGIN = 'propagated';
const SHADOW_ROW_SOURCE_MODE = 'shadow_child_profile_borrow';
const SHADOW_REFERENCE_PREFIX = '[shadow child-direct borrow]';

function buildDiseaseIsAQuery() {
  return `
    SELECT
      child.entity_id AS child_entity_id,
      child.canonical_curie AS child_curie,
      child.canonical_label AS child_label,
      parent.entity_id AS parent_entity_id,
      parent.canonical_curie AS parent_curie,
      parent.canonical_label AS parent_label
    FROM relationships rel
    INNER JOIN entities child
      ON child.entity_id = rel.subject_entity_id
    INNER JOIN entities parent
      ON parent.entity_id = rel.object_entity_id
    WHERE rel.predicate_key = 'is_a'
      AND child.entity_type = 'disease'
      AND parent.entity_type = 'disease'
  `;
}

function buildParentChildMaps(diseaseIsARows) {
  const childrenByParent = new Map();
  for (const row of diseaseIsARows) {
    if (!childrenByParent.has(row.parent_curie)) {
      childrenByParent.set(row.parent_curie, []);
    }
    childrenByParent.get(row.parent_curie).push(row);
  }
  return { childrenByParent };
}

function buildShadowDiseaseRows(diseasePhenotypeRows, geneDiseaseSupportRows, diseaseIsARows) {
  const { childrenByParent } = buildParentChildMaps(diseaseIsARows);
  const existingKeys = new Set(
    diseasePhenotypeRows.map((row) => `${row.disease_entity_id}|${row.phenotype_entity_id}|${row.presence_status || PRESENT_STATUS}`)
  );
  const directPresentCountByDisease = new Map();
  const directPresentRowsByDisease = new Map();
  const diseaseMetaByCurie = new Map();
  const supportedDiseaseCuries = new Set();

  for (const row of diseasePhenotypeRows) {
    diseaseMetaByCurie.set(row.disease_curie, {
      disease_entity_id: row.disease_entity_id,
      disease_curie: row.disease_curie,
      disease_label: row.disease_label
    });

    const isDirectPresent = row.presence_status === PRESENT_STATUS && row.phenotype_edge_origin === 'direct';
    if (!isDirectPresent) continue;

    directPresentCountByDisease.set(row.disease_curie, (directPresentCountByDisease.get(row.disease_curie) || 0) + 1);
    if (!directPresentRowsByDisease.has(row.disease_curie)) {
      directPresentRowsByDisease.set(row.disease_curie, []);
    }
    directPresentRowsByDisease.get(row.disease_curie).push(row);
  }

  for (const row of geneDiseaseSupportRows) {
    supportedDiseaseCuries.add(row.disease_curie);
    if (!diseaseMetaByCurie.has(row.disease_curie)) {
      diseaseMetaByCurie.set(row.disease_curie, {
        disease_entity_id: row.disease_entity_id,
        disease_curie: row.disease_curie,
        disease_label: row.disease_label
      });
    }
  }

  const borrowedRows = [];
  let borrowedParentDiseaseCount = 0;
  let borrowedChildDiseaseCount = 0;
  let skippedDuplicateBorrowRows = 0;

  for (const parentCurie of supportedDiseaseCuries) {
    if ((directPresentCountByDisease.get(parentCurie) || 0) > 0) continue;

    const parentMeta = diseaseMetaByCurie.get(parentCurie);
    const childRows = childrenByParent.get(parentCurie) || [];
    if (!parentMeta || !childRows.length) continue;

    let parentBorrowed = false;
    const usedChildCuries = new Set();

    for (const childRow of childRows) {
      const childDirectRows = directPresentRowsByDisease.get(childRow.child_curie) || [];
      if (!childDirectRows.length) continue;

      for (const sourceRow of childDirectRows) {
        const borrowedKey = `${parentMeta.disease_entity_id}|${sourceRow.phenotype_entity_id}|${sourceRow.presence_status || PRESENT_STATUS}`;
        if (existingKeys.has(borrowedKey)) {
          skippedDuplicateBorrowRows += 1;
          continue;
        }

        borrowedRows.push({
          ...sourceRow,
          disease_entity_id: parentMeta.disease_entity_id,
          disease_curie: parentMeta.disease_curie,
          disease_label: parentMeta.disease_label,
          phenotype_edge_origin: PROPAGATED_EDGE_ORIGIN,
          row_source_mode: SHADOW_ROW_SOURCE_MODE,
          reference_text: `${SHADOW_REFERENCE_PREFIX} borrowed direct phenotype from ${childRow.child_curie}${sourceRow.reference_text ? ` | ${sourceRow.reference_text}` : ''}`
        });
        existingKeys.add(borrowedKey);
        parentBorrowed = true;
        usedChildCuries.add(childRow.child_curie);
      }
    }

    if (parentBorrowed) {
      borrowedParentDiseaseCount += 1;
      borrowedChildDiseaseCount += usedChildCuries.size;
    }
  }

  return {
    shadowDiseasePhenotypeRows: [...diseasePhenotypeRows, ...borrowedRows],
    borrowedParentDiseaseCount,
    borrowedChildDiseaseCount,
    borrowedPhenotypeRows: borrowedRows.length,
    skippedDuplicateBorrowRows
  };
}

async function loadShadowInputs() {
  return withClient(async (client) => {
    const ontologyRows = await loadDxPhenotypeOntologyRows(client);
    const diseasePhenotypeResult = await loadDxDiseasePhenotypeRows(client);
    const genePhenotypeResult = await loadDxGenePhenotypeRows(client);
    const geneDiseaseSupportRows = await loadDxGeneDiseaseSupportRows(client);
    const diseaseIsARows = await client.query(buildDiseaseIsAQuery()).then((result) => result.rows);

    return {
      ontologyRows,
      diseasePhenotypeRows: diseasePhenotypeResult.rows,
      genePhenotypeRows: genePhenotypeResult.rows,
      geneDiseaseSupportRows,
      diseaseIsARows
    };
  });
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const config = {
    phenopacketDir: flags['phenopacket-dir'] || DEFAULTS.phenopacketDir,
    outputJson: flags['output-json'] || DEFAULTS.outputJson,
    outputMd: flags['output-md'] || DEFAULTS.outputMd,
    limit: Number.parseInt(String(flags.limit || DEFAULTS.limit), 10),
    shardIndex: Number.parseInt(String(flags['shard-index'] ?? 0), 10),
    shardCount: Number.parseInt(String(flags['shard-count'] ?? 1), 10)
  };

  const { ontologyRows, diseasePhenotypeRows, genePhenotypeRows, geneDiseaseSupportRows, diseaseIsARows } =
    await loadShadowInputs();

  const baselineIndex = buildDxSimilarityIndex({
    ontologyRows,
    diseasePhenotypeRows,
    genePhenotypeRows,
    geneDiseaseSupportRows
  });

  const {
    shadowDiseasePhenotypeRows,
    borrowedParentDiseaseCount,
    borrowedChildDiseaseCount,
    borrowedPhenotypeRows,
    skippedDuplicateBorrowRows
  } = buildShadowDiseaseRows(diseasePhenotypeRows, geneDiseaseSupportRows, diseaseIsARows);

  const shadowIndex = buildDxSimilarityIndex({
    ontologyRows,
    diseasePhenotypeRows: shadowDiseasePhenotypeRows,
    genePhenotypeRows,
    geneDiseaseSupportRows
  });

  const baselineRanks = {};
  const shadowRanks = {};
  const perCase = [];
  const allPhenopacketFiles = (await fs.readdir(config.phenopacketDir)).filter((name) => name.endsWith('.json')).sort();
  const phenopacketFiles = selectShardFiles(allPhenopacketFiles, config.shardIndex, config.shardCount);

  for (let indexValue = 0; indexValue < phenopacketFiles.length; indexValue += 1) {
    const fileName = phenopacketFiles[indexValue];
    const payload = JSON.parse(await fs.readFile(path.join(config.phenopacketDir, fileName), 'utf8'));
    const phenopacket = payload?.phenopacket || payload;
    const input = extractDxPhenotypeInput({ phenopacket });
    if (validateDxPhenotypeInput(input)) continue;

    const caseId = fileName.replace(/\.json$/, '');
    const truthGeneKeys = extractTruthGeneKeys(phenopacket);

    const baseline = rankGenesByPhenotypeSimilarity(baselineIndex, {
      phenotypeCuries: input.presentPhenotypeCuries,
      excludedPhenotypeCuries: input.excludedPhenotypeCuries,
      limit: config.limit
    });

    const shadow = rankGenesByPhenotypeSimilarity(shadowIndex, {
      phenotypeCuries: input.presentPhenotypeCuries,
      excludedPhenotypeCuries: input.excludedPhenotypeCuries,
      limit: config.limit
    });

    const baselineRank = findTruthRank(baseline.results, truthGeneKeys);
    const shadowRank = findTruthRank(shadow.results, truthGeneKeys);

    baselineRanks[caseId] = baselineRank;
    shadowRanks[caseId] = shadowRank;
    perCase.push({
      case_id: caseId,
      truth_gene_keys: truthGeneKeys,
      baseline_rank: baselineRank,
      shadow_rank: shadowRank
    });

    console.log(
      `[${indexValue + 1}/${phenopacketFiles.length}] ${fileName} baseline=${baselineRank ?? 'miss'} shadow=${shadowRank ?? 'miss'}`
    );
  }

  const baselineSummary = summarizeRun(baselineRanks);
  const shadowSummary = summarizeRun(shadowRanks);
  const deltas = compareBaselineVsShadow(perCase);
  const report = {
    experiment: 'child-direct-shadow-profile-borrow',
    created_at: new Date().toISOString(),
    shard_index: config.shardIndex,
    shard_count: config.shardCount,
    borrowed_parent_disease_count: borrowedParentDiseaseCount,
    borrowed_child_disease_count: borrowedChildDiseaseCount,
    borrowed_phenotype_rows: borrowedPhenotypeRows,
    skipped_duplicate_borrow_rows: skippedDuplicateBorrowRows,
    baseline_summary: baselineSummary,
    shadow_summary: shadowSummary,
    delta_vs_baseline: deltas,
    top_improvements: topMoves(perCase, 'improved'),
    top_regressions: topMoves(perCase, 'worsened'),
    per_case: perCase
  };

  await fs.writeFile(config.outputJson, `${JSON.stringify(report, null, 2)}\n`);

  const markdown = buildShadowMarkdown({
    title: 'Child-Direct Profile Borrow',
    createdAt: report.created_at,
    baselineSummary,
    shadowSummary,
    deltas,
    metadataLines: [
      `Shard: ${config.shardIndex + 1}/${config.shardCount}`,
      `Borrowed parent diseases: ${borrowedParentDiseaseCount}`,
      `Borrowed child diseases: ${borrowedChildDiseaseCount}`,
      `Borrowed phenotype rows: ${borrowedPhenotypeRows}`,
      `Skipped duplicate rows: ${skippedDuplicateBorrowRows}`
    ]
  });

  await fs.writeFile(config.outputMd, `${markdown}\n`);

  console.log(`JSON_OUT=${config.outputJson}`);
  console.log(`MD_OUT=${config.outputMd}`);
}

main().catch((error) => {
  console.error('[shadow-child-profile-borrow] failed:', error);
  process.exit(1);
});

import fs from 'node:fs/promises';
import path from 'node:path';
import { withClient } from '../db/pool.js';
import { extractDxPhenotypeInput, validateDxPhenotypeInput } from '../lib/phenopackets.js';
import { loadDxSimilarityIndex, rankGenesByPhenotypeSimilarity } from '../services/dx/similarityEngine.js';
import {
  buildShadowMarkdown,
  compareBaselineVsShadow,
  extractTruthGeneKeys,
  findTruthRank,
  parseArgs,
  summarizeRun,
  topMoves
} from './lib/shadowBenchmarkUtils.js';

const DEFAULTS = Object.freeze({
  phenopacketDir: '/Users/ahmedelmorshedy/Genovy/output/pheval-official-sample-100/phenopackets',
  outputJson: '/Users/ahmedelmorshedy/Genovy/output/shadow-child-direct-reroute.json',
  outputMd: '/Users/ahmedelmorshedy/Genovy/output/shadow-child-direct-reroute.md',
  limit: 100
});

function buildShadowSupportIndex(index, diseaseIsARows) {
  const diseaseProfileByCurie = new Map(index.diseaseProfiles.map((profile) => [profile.entityCurie, profile]));
  const directChildrenByParent = new Map();

  for (const row of diseaseIsARows) {
    const childProfile = diseaseProfileByCurie.get(row.child_curie);
    if (!childProfile || (childProfile.directPhenotypeEdgeCount || 0) <= 0) continue;
    if (!directChildrenByParent.has(row.parent_curie)) {
      directChildrenByParent.set(row.parent_curie, new Set());
    }
    directChildrenByParent.get(row.parent_curie).add(row.child_curie);
  }

  const shadowSupportIndex = new Map(
    [...index.geneDiseaseSupportIndex.entries()].map(([curie, links]) => [curie, links.map((link) => ({ ...link }))])
  );

  let reroutedParentDiseaseCount = 0;
  let addedShadowLinks = 0;
  let skippedDuplicateLinks = 0;

  for (const [parentCurie, links] of index.geneDiseaseSupportIndex.entries()) {
    const parentProfile = diseaseProfileByCurie.get(parentCurie);
    if (!parentProfile || (parentProfile.directPhenotypeEdgeCount || 0) > 0) continue;

    const childCuries = [...(directChildrenByParent.get(parentCurie) || [])];
    if (!childCuries.length) continue;

    reroutedParentDiseaseCount += 1;

    for (const childCurie of childCuries) {
      const childProfile = diseaseProfileByCurie.get(childCurie);
      if (!childProfile) continue;

      const childLinks = shadowSupportIndex.get(childCurie) || [];
      const existingGeneCuries = new Set(childLinks.map((link) => link.geneCurie));

      for (const link of links) {
        if (existingGeneCuries.has(link.geneCurie)) {
          skippedDuplicateLinks += 1;
          continue;
        }

        childLinks.push({
          ...link,
          diseaseCurie: childCurie,
          diseaseLabel: childProfile.entityLabel || childCurie,
          shadowInheritedFromParentDiseaseCurie: parentCurie
        });
        existingGeneCuries.add(link.geneCurie);
        addedShadowLinks += 1;
      }

      shadowSupportIndex.set(childCurie, childLinks);
    }
  }

  return {
    shadowSupportIndex,
    reroutedParentDiseaseCount,
    addedShadowLinks,
    skippedDuplicateLinks
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const config = {
    phenopacketDir: flags['phenopacket-dir'] || DEFAULTS.phenopacketDir,
    outputJson: flags['output-json'] || DEFAULTS.outputJson,
    outputMd: flags['output-md'] || DEFAULTS.outputMd,
    limit: Number.parseInt(String(flags.limit || DEFAULTS.limit), 10)
  };

  const index = await withClient((client) => loadDxSimilarityIndex(client, { forceRefresh: true }));
  const diseaseIsARows = await withClient((client) =>
    client
      .query(`
        SELECT
          child.canonical_curie AS child_curie,
          parent.canonical_curie AS parent_curie
        FROM relationships rel
        INNER JOIN entities child
          ON child.entity_id = rel.subject_entity_id
        INNER JOIN entities parent
          ON parent.entity_id = rel.object_entity_id
        WHERE rel.predicate_key = 'is_a'
          AND child.entity_type = 'disease'
          AND parent.entity_type = 'disease'
      `)
      .then((result) => result.rows)
  );

  const {
    shadowSupportIndex,
    reroutedParentDiseaseCount,
    addedShadowLinks,
    skippedDuplicateLinks
  } = buildShadowSupportIndex(index, diseaseIsARows);

  const shadowIndex = {
    ...index,
    geneDiseaseSupportIndex: shadowSupportIndex
  };

  const baselineRanks = {};
  const shadowRanks = {};
  const perCase = [];
  const phenopacketFiles = (await fs.readdir(config.phenopacketDir)).filter((name) => name.endsWith('.json')).sort();

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

    console.log(`[${indexValue + 1}/${phenopacketFiles.length}] ${fileName} baseline=${baselineRank ?? 'miss'} shadow=${shadowRank ?? 'miss'}`);
  }

  const baselineSummary = summarizeRun(baselineRanks);
  const shadowSummary = summarizeRun(shadowRanks);
  const deltas = compareBaselineVsShadow(perCase);

  const report = {
    experiment: 'child-direct-shadow-reroute',
    created_at: new Date().toISOString(),
    rerouted_parent_disease_count: reroutedParentDiseaseCount,
    added_shadow_links: addedShadowLinks,
    skipped_duplicate_links: skippedDuplicateLinks,
    baseline_summary: baselineSummary,
    shadow_summary: shadowSummary,
    delta_vs_baseline: deltas,
    top_improvements: topMoves(perCase, 'improved'),
    top_regressions: topMoves(perCase, 'worsened'),
    per_case: perCase
  };

  await fs.writeFile(config.outputJson, `${JSON.stringify(report, null, 2)}\n`);

  const markdown = buildShadowMarkdown({
    title: 'Child-Direct Shadow Reroute',
    createdAt: report.created_at,
    baselineSummary,
    shadowSummary,
    deltas,
    metadataLines: [
      `Rerouted parent diseases: ${reroutedParentDiseaseCount}`,
      `Added shadow links: ${addedShadowLinks}`,
      `Skipped duplicates: ${skippedDuplicateLinks}`
    ]
  });

  await fs.writeFile(config.outputMd, `${markdown}\n`);

  console.log(`JSON_OUT=${config.outputJson}`);
  console.log(`MD_OUT=${config.outputMd}`);
}

main().catch((error) => {
  console.error('[shadow-child-direct-reroute] failed:', error);
  process.exit(1);
});

import fs from 'node:fs/promises';
import path from 'node:path';
import { getPool, withClient } from '../db/pool.js';
import { extractDxPhenotypeInput, validateDxPhenotypeInput } from '../lib/phenopackets.js';
import { loadDxSimilarityIndex, rankGenesByPhenotypeSimilarity } from '../services/dx/similarityEngine.js';

const DEFAULTS = Object.freeze({
  phenopacketDir: '/Users/ahmedelmorshedy/Genovy/output/pheval-official-sample-100/phenopackets',
  exomiserResultsDir:
    '/Users/ahmedelmorshedy/Genovy/output/pheval-paper-results/exomiser-14.0.2-2406/phenopacket_store_0.1.11_phenotypes/pheval_gene_results',
  baselineJson: '/Users/ahmedelmorshedy/Genovy/output/genovy-vs-exomiser-official-100-direct-edge-fix.json',
  outputJson: '/Users/ahmedelmorshedy/Genovy/output/genovy-vs-exomiser-official-100-propagation-weight-heuristic.json',
  outputMd: '/Users/ahmedelmorshedy/Genovy/output/propagation-weight-heuristic-benchmark.md',
  limit: 100
});

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) flags[key] = true;
    else {
      flags[key] = next;
      i += 1;
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
  if (lower.startsWith('ensembl:')) return `ensembl:${text.split(':', 2)[1]}`;
  if (text.toUpperCase().startsWith('ENSG')) return `ensembl:${text.toUpperCase()}`;
  return `symbol:${text.toUpperCase()}`;
}

function extractTruthGeneKeys(phenopacket) {
  const keys = new Set();
  for (const interpretation of phenopacket?.interpretations || []) {
    const diagnoses = [];
    if (interpretation?.diagnosis) diagnoses.push(interpretation.diagnosis);
    diagnoses.push(...(interpretation?.diagnoses || []));
    for (const diagnosis of diagnoses) {
      for (const genomicInterpretation of diagnosis?.genomicInterpretations || []) {
        const geneContext = genomicInterpretation?.variantInterpretation?.variationDescriptor?.geneContext || {};
        for (const rawValue of [geneContext?.valueId, geneContext?.symbol, ...(geneContext?.alternateIds || [])]) {
          const key = normalizeGeneKey(rawValue);
          if (key) keys.add(key);
        }
      }
    }
  }
  return [...keys].sort();
}

function findTruthRank(rows, truthGeneKeys) {
  const truthSet = new Set(truthGeneKeys);
  for (const row of rows) {
    for (const key of [
      normalizeGeneKey(row.geneSymbol),
      normalizeGeneKey(row.geneLabel),
      normalizeGeneKey(row.geneCurie),
      normalizeGeneKey(row.geneIdentifier)
    ]) {
      if (truthSet.has(key)) return row.rank;
    }
  }
  return null;
}

function summarizeRun(rankByCase) {
  const caseIds = Object.keys(rankByCase);
  const total = caseIds.length;
  const found = caseIds.map((caseId) => rankByCase[caseId]).filter((rank) => rank != null);
  const ordered = [...found].sort((a, b) => a - b);
  const mid = Math.floor(ordered.length / 2);
  const medianRank = !ordered.length ? null : ordered.length % 2 === 0 ? (ordered[mid - 1] + ordered[mid]) / 2 : ordered[mid];
  const pct = (count) => (total ? Number(((count / total) * 100).toFixed(2)) : 0);
  const countAt = (n) => found.filter((rank) => rank <= n).length;
  return {
    case_count: total,
    found_count: found.length,
    found_pct: pct(found.length),
    top1_count: countAt(1),
    top1_pct: pct(countAt(1)),
    top3_count: countAt(3),
    top3_pct: pct(countAt(3)),
    top5_count: countAt(5),
    top5_pct: pct(countAt(5)),
    top10_count: countAt(10),
    top10_pct: pct(countAt(10)),
    median_rank: medianRank,
    mrr: total ? Number((found.reduce((sum, rank) => sum + 1 / rank, 0) / total).toFixed(6)) : 0
  };
}

function compareRuns(genovyRanks, exomiserRanks) {
  const summary = {
    genovy_better_count: 0,
    exomiser_better_count: 0,
    tie_count: 0,
    genovy_found_exomiser_missed_count: 0,
    exomiser_found_genovy_missed_count: 0
  };
  for (const caseId of [...new Set([...Object.keys(genovyRanks), ...Object.keys(exomiserRanks)])]) {
    const genovyRank = genovyRanks[caseId] ?? null;
    const exomiserRank = exomiserRanks[caseId] ?? null;
    if (genovyRank != null && exomiserRank == null) summary.genovy_found_exomiser_missed_count += 1;
    else if (exomiserRank != null && genovyRank == null) summary.exomiser_found_genovy_missed_count += 1;
    else if (genovyRank == null && exomiserRank == null) summary.tie_count += 1;
    else if (genovyRank < exomiserRank) summary.genovy_better_count += 1;
    else if (exomiserRank < genovyRank) summary.exomiser_better_count += 1;
    else summary.tie_count += 1;
  }
  return summary;
}

function parseTsvRows(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];
  const headers = lines[0].split('\t');
  return lines.slice(1).filter(Boolean).map((line) => {
    const values = line.split('\t');
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const config = {
    phenopacketDir: flags['phenopacket-dir'] || DEFAULTS.phenopacketDir,
    exomiserResultsDir: flags['exomiser-results-dir'] || DEFAULTS.exomiserResultsDir,
    baselineJson: flags['baseline-json'] || DEFAULTS.baselineJson,
    outputJson: flags['output-json'] || DEFAULTS.outputJson,
    outputMd: flags['output-md'] || DEFAULTS.outputMd,
    limit: Number.parseInt(String(flags.limit || DEFAULTS.limit), 10)
  };
  const baseline = JSON.parse(await fs.readFile(config.baselineJson, 'utf8'));
  const baselineRanks = Object.fromEntries(baseline.per_case.map((row) => [row.case_id, row.genovy_rank]));
  const exomiserByCase = {};
  for (const fileName of (await fs.readdir(config.exomiserResultsDir)).filter((name) => name.endsWith('.tsv'))) {
    const caseId = fileName.replace(/-pheval_gene_result\.tsv$/, '');
    exomiserByCase[caseId] = parseTsvRows(await fs.readFile(path.join(config.exomiserResultsDir, fileName), 'utf8'));
  }

  const index = await withClient((client) => loadDxSimilarityIndex(client, { forceRefresh: true }));
  const genovyRanks = {};
  const exomiserRanks = {};
  const perCase = [];

  for (const fileName of (await fs.readdir(config.phenopacketDir)).filter((name) => name.endsWith('.json')).sort()) {
    const payload = JSON.parse(await fs.readFile(path.join(config.phenopacketDir, fileName), 'utf8'));
    const phenopacket = payload?.phenopacket || payload;
    const input = extractDxPhenotypeInput({ phenopacket });
    if (validateDxPhenotypeInput(input)) continue;
    const caseId = fileName.replace(/\.json$/, '');
    const truthGeneKeys = extractTruthGeneKeys(phenopacket);
    const ranking = rankGenesByPhenotypeSimilarity(index, { phenotypeCuries: input.presentPhenotypeCuries, excludedPhenotypeCuries: input.excludedPhenotypeCuries, limit: config.limit });
    const genovyRank = findTruthRank(ranking.results, truthGeneKeys);
    const exomiserRank = findTruthRank(
      (exomiserByCase[caseId] || []).map((row) => ({ rank: Number(row.rank), geneSymbol: row.gene_symbol, geneCurie: row.gene_identifier })),
      truthGeneKeys
    );
    genovyRanks[caseId] = genovyRank;
    exomiserRanks[caseId] = exomiserRank;
    perCase.push({
      case_id: caseId,
      file_name: fileName,
      truth_gene_keys: truthGeneKeys,
      baseline_genovy_rank: baselineRanks[caseId] ?? null,
      genovy_rank: genovyRank,
      exomiser_rank: exomiserRank
    });
  }

  const deltas = { improved: 0, worsened: 0, unchanged: 0, recovered_from_miss: 0, regressed_to_miss: 0 };
  for (const row of perCase) {
    const before = row.baseline_genovy_rank;
    const after = row.genovy_rank;
    if (before == null && after != null) {
      deltas.improved += 1;
      deltas.recovered_from_miss += 1;
    } else if (before != null && after == null) {
      deltas.worsened += 1;
      deltas.regressed_to_miss += 1;
    } else if (before == null && after == null) {
      deltas.unchanged += 1;
    } else if (after < before) {
      deltas.improved += 1;
    } else if (after > before) {
      deltas.worsened += 1;
    } else {
      deltas.unchanged += 1;
    }
  }

  const report = {
    heuristic: {
      directEvidenceWeight: 1,
      propagatedEvidenceMinWeight: 0.25,
      propagatedEvidenceMaxWeight: 0.85,
      propagatedMatchedDensityWeight: 0.45,
      propagatedCompactnessWeight: 0.35,
      propagatedSimilarityWeight: 0.2
    },
    phenopacket_dir: config.phenopacketDir,
    exomiser_results_dir: config.exomiserResultsDir,
    genovy_summary: summarizeRun(genovyRanks),
    exomiser_summary: summarizeRun(exomiserRanks),
    head_to_head: compareRuns(genovyRanks, exomiserRanks),
    delta_vs_direct_edge_fix: deltas,
    notable_cases: perCase.filter((row) =>
      [
        'PMID_34521999_43',
        'PMID_34521999_50',
        'PMID_34521999_32',
        'PMID_33731876_fam421',
        'PMID_35190816_STX_Syrbe_6',
        'PMID_37761890_41',
        'PMID_12789647_K16IV-1'
      ].includes(row.case_id)
    ),
    per_case: perCase
  };

  await fs.writeFile(config.outputJson, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(
    config.outputMd,
    [
      '# Propagation Weight Heuristic Benchmark',
      '',
      `Found: ${baseline.genovy_summary.found_pct}% -> ${report.genovy_summary.found_pct}%`,
      `Top-1: ${baseline.genovy_summary.top1_pct}% -> ${report.genovy_summary.top1_pct}%`,
      `Top-5: ${baseline.genovy_summary.top5_pct}% -> ${report.genovy_summary.top5_pct}%`,
      `Top-10: ${baseline.genovy_summary.top10_pct}% -> ${report.genovy_summary.top10_pct}%`,
      `MRR: ${baseline.genovy_summary.mrr} -> ${report.genovy_summary.mrr}`,
      '',
      `Improved: ${deltas.improved}`,
      `Worsened: ${deltas.worsened}`,
      `Recovered from miss: ${deltas.recovered_from_miss}`,
      `Regressed to miss: ${deltas.regressed_to_miss}`
    ].join('\n') + '\n'
  );

  console.log(JSON.stringify({ outputJson: config.outputJson, outputMd: config.outputMd, report }, null, 2));
}

main()
  .then(async () => {
    await getPool().end().catch(() => {});
    process.exit(0);
  })
  .catch((error) => {
    console.error('[benchmark-official-gene-run] failed:', error);
    getPool()
      .end()
      .catch(() => {})
      .finally(() => process.exit(1));
  });

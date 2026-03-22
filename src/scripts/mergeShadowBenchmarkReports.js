import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildShadowMarkdown,
  compareBaselineVsShadow,
  parseArgs,
  summarizeRun,
  topMoves
} from './lib/shadowBenchmarkUtils.js';

async function loadPartReports(inputDir) {
  const fileNames = (await fs.readdir(inputDir)).filter((name) => name.endsWith('.json')).sort();
  if (!fileNames.length) {
    throw new Error(`No JSON part files found in ${inputDir}`);
  }

  return Promise.all(fileNames.map((fileName) => fs.readFile(path.join(inputDir, fileName), 'utf8').then(JSON.parse)));
}

function buildMetadataLines(report, shardCount) {
  if (Array.isArray(report.metadata_lines) && report.metadata_lines.length) {
    return [`Shards merged: ${shardCount}`, ...report.metadata_lines.filter(Boolean)];
  }

  if (report.borrowed_parent_disease_count != null) {
    return [
      `Shards merged: ${shardCount}`,
      `Borrowed parent diseases: ${report.borrowed_parent_disease_count}`,
      `Borrowed child diseases: ${report.borrowed_child_disease_count}`,
      `Borrowed phenotype rows: ${report.borrowed_phenotype_rows}`,
      `Skipped duplicate rows: ${report.skipped_duplicate_borrow_rows}`
    ];
  }

  return [`Shards merged: ${shardCount}`];
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const inputDir = flags['input-dir'];
  const outputJson = flags['output-json'];
  const outputMd = flags['output-md'];

  if (!inputDir || !outputJson || !outputMd) {
    throw new Error('Usage: node mergeShadowBenchmarkReports.js --input-dir <dir> --output-json <file> --output-md <file>');
  }

  const partReports = await loadPartReports(inputDir);
  const firstReport = partReports[0];
  const perCase = partReports.flatMap((report) => report.per_case || []).sort((left, right) =>
    left.case_id.localeCompare(right.case_id)
  );

  const baselineRanks = Object.fromEntries(perCase.map((row) => [row.case_id, row.baseline_rank]));
  const shadowRanks = Object.fromEntries(perCase.map((row) => [row.case_id, row.shadow_rank]));
  const baselineSummary = summarizeRun(baselineRanks);
  const shadowSummary = summarizeRun(shadowRanks);
  const deltas = compareBaselineVsShadow(perCase);
  const metadataLines = buildMetadataLines(firstReport, partReports.length);
  const title = firstReport.title || 'Shadow Benchmark';

  const report = {
    experiment: firstReport.experiment,
    title,
    created_at: new Date().toISOString(),
    shard_count: partReports.length,
    metadata_lines: metadataLines,
    baseline_summary: baselineSummary,
    shadow_summary: shadowSummary,
    delta_vs_baseline: deltas,
    top_improvements: topMoves(perCase, 'improved'),
    top_regressions: topMoves(perCase, 'worsened'),
    per_case: perCase
  };

  await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`);

  const markdown = buildShadowMarkdown({
    title,
    createdAt: report.created_at,
    baselineSummary,
    shadowSummary,
    deltas,
    metadataLines
  });

  await fs.writeFile(outputMd, `${markdown}\n`);
}

main().catch((error) => {
  console.error('[merge-shadow-benchmark-reports] failed:', error);
  process.exit(1);
});

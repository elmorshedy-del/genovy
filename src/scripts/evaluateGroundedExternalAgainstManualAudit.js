import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { parseArgs, writeJson } from '../lib/genereviewsPipeline.js';
import { evaluateGroundedExternalReportsAgainstManualAudit } from '../lib/externalPhenotypeExtractionEval.js';

const DEFAULTS = Object.freeze({
  manualAudit:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealLatest10ManualAudit.json',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_external_real_recall_eval_20260403'
});

async function loadJson(filePath) {
  return JSON.parse(await fsp.readFile(filePath, 'utf8'));
}

async function loadGroundedReports(inputPath) {
  const stats = await fsp.stat(inputPath);
  if (stats.isFile()) {
    return [await loadJson(inputPath)];
  }

  const fileNames = (await fsp.readdir(inputPath))
    .filter((name) => name.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right));

  const reports = [];
  for (const fileName of fileNames) {
    const filePath = path.join(inputPath, fileName);
    const payload = await loadJson(filePath);
    if (payload?.stage !== 'external_extraction_grounded') continue;
    reports.push(payload);
  }
  return reports;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const input = flags.input;
  const manualAuditPath = flags.manualAudit || DEFAULTS.manualAudit;
  const outputDir = path.resolve(flags.output || DEFAULTS.outputDir);

  if (!input) {
    throw new Error(
      'Usage: node src/scripts/evaluateGroundedExternalAgainstManualAudit.js --input <grounded.json|grounded_dir> [--manualAudit <manual_audit.json>] [--output <output_dir>]'
    );
  }

  const inputPath = path.resolve(input);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Missing grounded extraction input: ${inputPath}`);
  }
  if (!fs.existsSync(manualAuditPath)) {
    throw new Error(`Missing manual audit file: ${manualAuditPath}`);
  }

  const reports = await loadGroundedReports(inputPath);
  const manualAudit = await loadJson(manualAuditPath);
  const evaluation = evaluateGroundedExternalReportsAgainstManualAudit(reports, manualAudit);

  const summary = {
    created_at: new Date().toISOString(),
    stage: 'external_extraction_real_recall_eval',
    input_path: inputPath,
    manual_audit_path: manualAuditPath,
    grounded_report_total: reports.length,
    total_chapters_evaluated: evaluation.total_chapters_evaluated,
    useful_new_target_total: evaluation.useful_new_target_total,
    matched_useful_new_total: evaluation.matched_useful_new_total,
    useful_new_recall: evaluation.useful_new_recall
  };

  await fsp.mkdir(outputDir, { recursive: true });
  await writeJson(path.join(outputDir, 'external_real_recall_summary.json'), summary);
  await writeJson(path.join(outputDir, 'external_real_recall_report.json'), evaluation.chapter_reports);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

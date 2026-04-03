import path from 'node:path';
import {
  parseArgs,
  writeJson
} from '../lib/genereviewsPipeline.js';
import fsp from 'node:fs/promises';

const DEFAULTS = Object.freeze({
  latest5AuditSummary:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_latest5_grounded_audit_20260402/latest5_direct_grounded_audit_summary.json',
  next5RawSummary:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_real_next5_grounded_raw_20260402/stage3_real_grounded_raw_summary.json',
  manualAudit:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealLatest10ManualAudit.json',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_real_latest10_manual_audit_20260402'
});

async function loadJson(filePath) {
  return JSON.parse(await fsp.readFile(filePath, 'utf8'));
}

function increment(map, key, amount = 1) {
  map[key] = Number(map[key] || 0) + amount;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const latest5AuditSummaryPath = flags.latest5AuditSummary || DEFAULTS.latest5AuditSummary;
  const next5RawSummaryPath = flags.next5RawSummary || DEFAULTS.next5RawSummary;
  const manualAuditPath = flags.manualAudit || DEFAULTS.manualAudit;
  const outputDir = flags.output || DEFAULTS.outputDir;

  const latest5AuditSummary = await loadJson(latest5AuditSummaryPath);
  const next5RawSummary = await loadJson(next5RawSummaryPath);
  const manualAudit = await loadJson(manualAuditPath);

  const exactDuplicateAnchorTotal =
    Number(latest5AuditSummary.duplicate_anchor_leak_total || 0) +
    Number(next5RawSummary.duplicate_anchor_leak_total || 0);
  const rawPredictionTotal =
    Number(latest5AuditSummary.prediction_total || 0) +
    Number(next5RawSummary.prediction_total || 0);

  const bucketCounts = {};
  const byChapter = [];
  let manuallyAuditedNonduplicateTotal = 0;

  for (const chapter of manualAudit.chapters || []) {
    const chapterBucketCounts = {};
    for (const entry of chapter.entries || []) {
      manuallyAuditedNonduplicateTotal += 1;
      increment(bucketCounts, entry.bucket);
      increment(chapterBucketCounts, entry.bucket);
    }
    byChapter.push({
      chapter_key: chapter.chapter_key,
      entry_count: Array.isArray(chapter.entries) ? chapter.entries.length : 0,
      bucket_counts: chapterBucketCounts
    });
  }

  const semanticAnchorCoveredTotal = Number(bucketCounts.anchor_covered_semantic || 0);
  const usefulNewTotal = Number(bucketCounts.useful_new || 0);
  const broadOrRedundantTotal = Number(bucketCounts.broad_or_redundant || 0);
  const junkOrContextOnlyTotal = Number(bucketCounts.junk_or_context_only || 0);
  const totalAnchorCovered = exactDuplicateAnchorTotal + semanticAnchorCoveredTotal;

  const summary = {
    created_at: new Date().toISOString(),
    scope: 'stage3_real_latest10_manual_truth_summary_v1',
    source_paths: {
      latest5_audit_summary: latest5AuditSummaryPath,
      next5_raw_summary: next5RawSummaryPath,
      manual_audit: manualAuditPath
    },
    totals: {
      raw_prediction_total: rawPredictionTotal,
      exact_duplicate_anchor_total: exactDuplicateAnchorTotal,
      manually_audited_nonduplicate_total: manuallyAuditedNonduplicateTotal,
      useful_new_total: usefulNewTotal,
      semantic_anchor_covered_total: semanticAnchorCoveredTotal,
      total_anchor_covered_total: totalAnchorCovered,
      broad_or_redundant_total: broadOrRedundantTotal,
      junk_or_context_only_total: junkOrContextOnlyTotal
    },
    rates: {
      useful_new_over_raw: Number((usefulNewTotal / rawPredictionTotal).toFixed(4)),
      useful_new_over_nonduplicate: Number((usefulNewTotal / manuallyAuditedNonduplicateTotal).toFixed(4)),
      total_anchor_covered_over_raw: Number((totalAnchorCovered / rawPredictionTotal).toFixed(4)),
      broad_or_redundant_over_raw: Number((broadOrRedundantTotal / rawPredictionTotal).toFixed(4)),
      junk_or_context_only_over_raw: Number((junkOrContextOnlyTotal / rawPredictionTotal).toFixed(4))
    },
    by_chapter: byChapter
  };

  await fsp.mkdir(outputDir, { recursive: true });
  await writeJson(path.join(outputDir, 'latest10_manual_truth_summary.json'), summary);
  await writeJson(path.join(outputDir, 'latest10_manual_truth_audit.json'), manualAudit);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

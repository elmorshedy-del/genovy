import path from 'node:path';
import fsp from 'node:fs/promises';
import {
  ensureDir,
  parseArgs,
  writeJson
} from '../lib/genereviewsPipeline.js';

const DEFAULTS = Object.freeze({
  realManifest:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealHoldoutManifest.json',
  anchorsDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-latest5-settled-20260330/stage2_anchors',
  verificationDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/bucket-critical/20260331-genereviews-latest5-readiness/stage7_verify_medgemma',
  auditOutputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_latest5_grounded_audit_20260402',
  outputPath:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealAuditCacheLatest5.json'
});

const NEXT5_SELECTION_SLOTS = Object.freeze([
  {
    slot_id: 'next5_anchor_heavy',
    target_profile: 'anchor_heavy',
    rationale: 'Stress duplicate-anchor leakage and residual-awareness failures.',
    selection_status: 'pending'
  },
  {
    slot_id: 'next5_narrative_implied',
    target_profile: 'narrative_implied',
    rationale: 'Stress implied phenotypes and non-literal clinical reading.',
    selection_status: 'pending'
  },
  {
    slot_id: 'next5_lab_management_junk',
    target_profile: 'lab_management_junk',
    rationale: 'Stress lab/test/treatment/management leakage and junk rejection.',
    selection_status: 'pending'
  },
  {
    slot_id: 'next5_exclusion_normal',
    target_profile: 'exclusion_normal',
    rationale: 'Stress exclusions, preserved findings, and false excluded pseudo-features.',
    selection_status: 'pending'
  },
  {
    slot_id: 'next5_morphology_dense',
    target_profile: 'morphology_dense',
    rationale: 'Stress multi-feature dense chapters with many phenotype spans per section.',
    selection_status: 'pending'
  }
]);

async function loadJson(filePath) {
  return JSON.parse(await fsp.readFile(filePath, 'utf8'));
}

function toBaseName(value) {
  return String(value || '')
    .replace(/\s*-\s*GeneReviews.*$/i, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function exists(filePath) {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function enrichChapter(chapter, anchorsDir, verificationDir) {
  const candidates = [
    toBaseName(chapter.chapter_title),
    toBaseName(chapter.chapter_key),
    toBaseName(chapter.nbk_id)
  ].filter(Boolean);

  let anchorsPath = null;
  let verificationPath = null;
  for (const base of candidates) {
    const candidatePath = path.join(anchorsDir, `${base}_anchors.json`);
    if (await exists(candidatePath)) {
      anchorsPath = candidatePath;
      break;
    }
  }
  for (const base of candidates) {
    const candidatePath = path.join(verificationDir, `${base}_verification.json`);
    if (await exists(candidatePath)) {
      verificationPath = candidatePath;
      break;
    }
  }

  const anchorExists = Boolean(anchorsPath);
  const verificationExists = Boolean(verificationPath);
  let anchorCount = null;
  let verificationSummary = null;

  if (anchorExists) {
    const anchorPayload = await loadJson(anchorsPath);
    anchorCount = Array.isArray(anchorPayload?.anchors) ? anchorPayload.anchors.length : 0;
  }

  if (verificationExists) {
    const verificationPayload = await loadJson(verificationPath);
    verificationSummary = {
      feature_count: Number(verificationPayload?.feature_count || 0),
      table_count: Number(verificationPayload?.table_count || 0),
      summary: verificationPayload?.summary || null
    };
  }

  return {
    ...chapter,
    anchors_path: anchorExists ? anchorsPath : null,
    anchors_cached: anchorExists,
    anchor_count: anchorCount,
    verification_path: verificationExists ? verificationPath : null,
    verification_cached: verificationExists,
    verification_summary: verificationSummary
  };
}

async function buildAuditOutputs(auditOutputDir) {
  const summaryPath = path.join(auditOutputDir, 'latest5_direct_grounded_audit_summary.json');
  const reportPath = path.join(auditOutputDir, 'latest5_direct_grounded_audit_report.json');
  if (!(await exists(summaryPath)) || !(await exists(reportPath))) {
    return {
      available: false,
      summary_path: null,
      report_path: null,
      summary: null
    };
  }
  return {
    available: true,
    summary_path: summaryPath,
    report_path: reportPath,
    summary: await loadJson(summaryPath)
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const realManifestPath = flags.manifest || DEFAULTS.realManifest;
  const anchorsDir = flags.anchors || DEFAULTS.anchorsDir;
  const verificationDir = flags.verification || DEFAULTS.verificationDir;
  const auditOutputDir = flags.auditOutput || DEFAULTS.auditOutputDir;
  const outputPath = flags.output || DEFAULTS.outputPath;

  const realManifest = await loadJson(realManifestPath);
  const chapters = [];
  for (const chapter of realManifest.chapters || []) {
    chapters.push(await enrichChapter(chapter, anchorsDir, verificationDir));
  }

  const auditOutputs = await buildAuditOutputs(auditOutputDir);
  const payload = {
    created_at: new Date().toISOString(),
    cache_kind: 'stage3_real_discovery_audit_latest5',
    source_manifest_path: realManifestPath,
    chapter_count: chapters.length,
    chapters,
    cached_outputs: {
      anchors_dir: anchorsDir,
      verification_dir: verificationDir,
      direct_audit: auditOutputs
    },
    next5_selection_template: NEXT5_SELECTION_SLOTS.map((slot) => ({
      ...slot,
      nbk_id: null,
      chapter_key: null,
      chapter_title: null,
      structure_path: null,
      notes: null
    }))
  };

  await ensureDir(path.dirname(outputPath));
  await writeJson(outputPath, payload);
  process.stdout.write(`${JSON.stringify({ outputPath, chapter_count: chapters.length, audit_cached: auditOutputs.available }, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

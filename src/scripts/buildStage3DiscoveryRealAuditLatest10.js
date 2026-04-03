import path from 'node:path';
import fsp from 'node:fs/promises';
import {
  ensureDir,
  parseArgs,
  writeJson
} from '../lib/genereviewsPipeline.js';

const DEFAULTS = Object.freeze({
  latest5Cache:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealAuditCacheLatest5.json',
  next5Stage1Dir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-review-first-50-20260331/stage1_fetch',
  next5AnchorsDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-review-first-50-20260331/stage2_anchors',
  next5RawOutputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_real_next5_grounded_raw_20260402',
  next5ManifestPath:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealHoldoutNext5Manifest.json',
  latest10ManifestPath:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealHoldoutLatest10Manifest.json',
  latest10CachePath:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealAuditCacheLatest10.json'
});

const NEXT5_SELECTIONS = Object.freeze([
  {
    slot_id: 'next5_anchor_heavy',
    target_profile: 'anchor_heavy',
    chapter_title: 'Williams Syndrome',
    anchors_file: 'Williams_Syndrome_anchors.json',
    notes: 'Highest anchor-count chapter in the reusable review-first-50 batch; best stress test for duplicate-anchor leakage.'
  },
  {
    slot_id: 'next5_narrative_implied',
    target_profile: 'narrative_implied',
    chapter_title: 'USP7-Related Hao-Fountain Syndrome',
    anchors_file: 'USP7_Related_Hao_Fountain_Syndrome_anchors.json',
    notes:
      'Narrative neurodevelopmental chapter with milestone-age sentences, nonverbal severity phrasing, and implied residual findings.'
  },
  {
    slot_id: 'next5_lab_management_junk',
    target_profile: 'lab_management_junk',
    chapter_title: 'VEXAS Syndrome',
    anchors_file: 'VEXAS_Syndrome_anchors.json',
    notes:
      'Dense lab/test/treatment leakage surface with biopsy, laboratory findings, hematologic descriptors, and treatment-failure language.'
  },
  {
    slot_id: 'next5_exclusion_normal',
    target_profile: 'exclusion_normal',
    chapter_title: 'Very Long-Chain Acyl-Coenzyme A Dehydrogenase Deficiency',
    anchors_file: 'Very_Long_Chain_Acyl_Coenzyme_A_Dehydrogenase_Deficiency_anchors.json',
    notes:
      'Strong normal/preserved/risk-only surface: asymptomatic newborn-screen positives, normal cognitive outcome, and without-cardiomyopathy language.'
  },
  {
    slot_id: 'next5_morphology_dense',
    target_profile: 'morphology_dense',
    chapter_title: 'Weiss-Kruszka Syndrome',
    anchors_file: 'Weiss_Kruszka_Syndrome_anchors.json',
    notes:
      'Morphology-heavy craniofacial chapter with dense short phenotype spans and dysmorphology wording.'
  }
]);

async function loadJson(filePath) {
  return JSON.parse(await fsp.readFile(filePath, 'utf8'));
}

async function exists(filePath) {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function toManifestChapter(chapter) {
  return {
    nbk_id: chapter.nbk_id,
    chapter_key: chapter.chapter_key,
    chapter_title: chapter.chapter_title,
    provenance_url: chapter.provenance_url,
    structure_path: chapter.structure_path,
    text_sha256: chapter.text_sha256,
    section_count: chapter.section_count,
    paragraph_count: chapter.paragraph_count,
    sentence_count: chapter.sentence_count
  };
}

async function buildSelectedNext5(stage1Dir, anchorsDir) {
  const selected = [];
  for (const slot of NEXT5_SELECTIONS) {
    const anchorPath = path.join(anchorsDir, slot.anchors_file);
    const anchorPayload = await loadJson(anchorPath);
    const structurePath = path.join(stage1Dir, `${anchorPayload.nbk_id}_clinical_structure.json`);
    const structure = await loadJson(structurePath);
    const sectionCount = Array.isArray(structure.sections) ? structure.sections.length : 0;
    const paragraphCount = Array.isArray(structure.paragraphs) ? structure.paragraphs.length : 0;
    const sentenceCount = (structure.paragraphs || []).reduce(
      (sum, paragraph) => sum + (Array.isArray(paragraph.sentences) ? paragraph.sentences.length : 0),
      0
    );

    selected.push({
      slot_id: slot.slot_id,
      target_profile: slot.target_profile,
      selection_status: 'selected',
      rationale: slot.notes,
      nbk_id: String(anchorPayload.nbk_id || '').trim(),
      chapter_key: String(anchorPayload.chapter_title || '')
        .replace(/\s*-\s*GeneReviews.*$/i, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, ''),
      chapter_title: anchorPayload.chapter_title,
      provenance_url: anchorPayload.provenance_url || null,
      structure_path: structurePath,
      text_sha256: structure.text_sha256 || null,
      section_count: sectionCount,
      paragraph_count: paragraphCount,
      sentence_count: sentenceCount,
      anchors_path: anchorPath,
      anchors_cached: true,
      anchor_count: Array.isArray(anchorPayload.anchors) ? anchorPayload.anchors.length : 0,
      verification_path: null,
      verification_cached: false,
      verification_summary: null,
      source_batch: 'review_first_50_20260331'
    });
  }
  return selected;
}

async function loadCachedRawOutputs(next5RawOutputDir) {
  const summaryPath = path.join(next5RawOutputDir, 'stage3_real_grounded_raw_summary.json');
  const reportPath = path.join(next5RawOutputDir, 'stage3_real_grounded_raw_report.json');
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
  const latest5CachePath = flags.latest5Cache || DEFAULTS.latest5Cache;
  const next5Stage1Dir = flags.next5Stage1 || DEFAULTS.next5Stage1Dir;
  const next5AnchorsDir = flags.next5Anchors || DEFAULTS.next5AnchorsDir;
  const next5RawOutputDir = flags.next5RawOutput || DEFAULTS.next5RawOutputDir;
  const next5ManifestPath = flags.next5Manifest || DEFAULTS.next5ManifestPath;
  const latest10ManifestPath = flags.latest10Manifest || DEFAULTS.latest10ManifestPath;
  const latest10CachePath = flags.latest10Cache || DEFAULTS.latest10CachePath;

  const latest5Cache = await loadJson(latest5CachePath);
  const next5Selections = await buildSelectedNext5(next5Stage1Dir, next5AnchorsDir);
  const next5Manifest = {
    created_at: new Date().toISOString(),
    source_dir: next5Stage1Dir,
    chapter_count: next5Selections.length,
    source_batch: 'review_first_50_20260331',
    chapters: next5Selections.map(toManifestChapter)
  };

  const latest10Manifest = {
    created_at: new Date().toISOString(),
    source_dir: 'mixed_latest5_plus_selected_review_first_50',
    chapter_count: latest5Cache.chapters.length + next5Selections.length,
    source_batches: [
      'latest5_readiness_20260331',
      'review_first_50_20260331'
    ],
    chapters: [
      ...latest5Cache.chapters.map(toManifestChapter),
      ...next5Selections.map(toManifestChapter)
    ]
  };

  const next5RawOutputs = await loadCachedRawOutputs(next5RawOutputDir);
  const latest10Cache = {
    created_at: new Date().toISOString(),
    cache_kind: 'stage3_real_discovery_audit_latest10',
    source_manifest_paths: [
      latest5Cache.source_manifest_path,
      next5ManifestPath
    ],
    chapter_count: latest10Manifest.chapters.length,
    chapters: [
      ...latest5Cache.chapters,
      ...next5Selections
    ],
    cached_outputs: {
      latest5_cached_outputs: latest5Cache.cached_outputs || null,
      next5_raw_direct: next5RawOutputs
    },
    selection_summary: NEXT5_SELECTIONS.map((slot) => {
      const selected = next5Selections.find((item) => item.slot_id === slot.slot_id);
      return {
        slot_id: slot.slot_id,
        target_profile: slot.target_profile,
        chapter_key: selected?.chapter_key || null,
        chapter_title: selected?.chapter_title || null,
        nbk_id: selected?.nbk_id || null,
        notes: slot.notes
      };
    })
  };

  await ensureDir(path.dirname(next5ManifestPath));
  await writeJson(next5ManifestPath, next5Manifest);
  await writeJson(latest10ManifestPath, latest10Manifest);
  await writeJson(latest10CachePath, latest10Cache);

  process.stdout.write(
    `${JSON.stringify(
      {
        next5ManifestPath,
        latest10ManifestPath,
        latest10CachePath,
        chapter_count: latest10Manifest.chapters.length,
        next5_raw_cached: next5RawOutputs.available
      },
      null,
      2
    )}\n`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

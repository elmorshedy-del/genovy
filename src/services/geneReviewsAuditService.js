import path from 'node:path';
import fsp from 'node:fs/promises';
import fs from 'node:fs';
import { ENV } from '../config/env.js';

const OUTPUT_ROOT = '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output';
const DEFAULT_RUN_NAME = 'genereviews-pipeline-review-first-50-20260331';
const MEDGEMMA_HEALTH_URL = 'https://z2m4kqae0vudzx4y.us-east-1.aws.endpoints.huggingface.cloud/health';

function reviewQueuePath() {
  return path.join(ENV.geneReviewsAuditManifestDir, 'genereviews_review_queue.json');
}

function manifestSummaryPath() {
  return path.join(ENV.geneReviewsAuditManifestDir, 'manifest_summary.json');
}

function chapterExportsDir() {
  return path.join(ENV.geneReviewsAuditManifestDir, 'api_exports', 'chapters');
}

function reviewDataDir() {
  return path.join(ENV.geneReviewsAuditVerifyDir, 'review_data');
}

async function readJson(filePath) {
  return JSON.parse(await fsp.readFile(filePath, 'utf8'));
}

async function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return readJson(filePath);
}

function safeRunName(value) {
  const raw = String(value || DEFAULT_RUN_NAME).trim();
  const normalized = raw.replace(/[^a-zA-Z0-9._-]/g, '');
  return normalized || DEFAULT_RUN_NAME;
}

async function countFiles(dirPath, predicate = () => true) {
  if (!fs.existsSync(dirPath)) return 0;
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && predicate(entry.name)).length;
}

async function latestMtimeIso(dirPath) {
  if (!fs.existsSync(dirPath)) return null;
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  let latest = 0;
  for (const entry of entries) {
    const target = path.join(dirPath, entry.name);
    const stat = await fsp.stat(target);
    latest = Math.max(latest, stat.mtimeMs);
  }
  return latest ? new Date(latest).toISOString() : null;
}

function inferStageStatus({ dirExists, summary, fileCount }) {
  if (summary?.total_errors) return 'errors';
  if (summary?.total_processed && fileCount > 0) return 'completed';
  if (dirExists && fileCount > 0) return 'running';
  if (dirExists) return 'initialized';
  return 'pending';
}

async function loadMedGemmaHealth() {
  try {
    const response = await fetch(MEDGEMMA_HEALTH_URL);
    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { raw: text };
    }
    if (response.status === 200) {
      return { state: 'ready', http_status: 200, payload };
    }
    if (response.status === 503) {
      return { state: 'warming', http_status: 503, payload };
    }
    if (response.status === 400 && /paused/i.test(text)) {
      return { state: 'paused', http_status: 400, payload };
    }
    return { state: 'unknown', http_status: response.status, payload };
  } catch (error) {
    return {
      state: 'unreachable',
      http_status: null,
      payload: { error: error.message || String(error) }
    };
  }
}

function buildChapterSlug(queueEntry) {
  return queueEntry.chapter_key || queueEntry.nbk_id || '';
}

async function loadChapterExportByIdentity(chapter) {
  const dir = chapterExportsDir();
  if (!fs.existsSync(dir)) return null;
  const filenames = await fsp.readdir(dir);
  for (const filename of filenames) {
    if (!filename.endsWith('_chapter.json')) continue;
    const payload = await readJson(path.join(dir, filename));
    if (
      payload?.chapter_key === chapter.chapter_key ||
      payload?.nbk_id === chapter.nbk_id ||
      payload?.chapter_title === chapter.chapter_title
    ) {
      return payload;
    }
  }
  return null;
}

export async function loadGeneReviewsAuditIndex() {
  if (!fs.existsSync(reviewQueuePath())) {
    return {
      ready: false,
      chapters: [],
      summary: null,
      message: 'GeneReviews audit artifacts are not available on this deployment.'
    };
  }

  const [queue, summary] = await Promise.all([
    readJson(reviewQueuePath()),
    fs.existsSync(manifestSummaryPath()) ? readJson(manifestSummaryPath()) : Promise.resolve(null)
  ]);

  const chapters = (Array.isArray(queue) ? queue : []).map((entry) => ({
    chapter_key: entry.chapter_key || '',
    chapter_slug: buildChapterSlug(entry),
    nbk_id: entry.nbk_id || '',
    chapter_title: entry.chapter_title || '',
    review_reason: entry.review_reason || '',
    review_page_path: entry.review_page_path || null,
    review_item_count: Array.isArray(entry.review_items) ? entry.review_items.length : 0,
    eligible_count: Array.isArray(entry.review_items)
      ? entry.review_items.filter((item) => item.auto_accept_eligible).length
      : 0,
    failed_count: Array.isArray(entry.review_items)
      ? entry.review_items.filter((item) => item.verdict === 'FAILED').length
      : 0,
    flagged_count: Array.isArray(entry.review_items)
      ? entry.review_items.filter((item) => item.verdict === 'FLAGGED').length
      : 0
  }));

  return {
    ready: true,
    chapters,
    summary
  };
}

export async function loadGeneReviewsAuditChapter(chapterKeyOrNbkId) {
  const index = await loadGeneReviewsAuditIndex();
  if (!index.ready) {
    return null;
  }

  const chapter = index.chapters.find(
    (entry) => entry.chapter_key === chapterKeyOrNbkId || entry.nbk_id === chapterKeyOrNbkId || entry.chapter_slug === chapterKeyOrNbkId
  );
  if (!chapter) return null;

  const chapterExport = await loadChapterExportByIdentity(chapter);
  const enrichedChapter = chapterExport
    ? {
        ...chapter,
        genes: Array.isArray(chapterExport.genes) ? chapterExport.genes : [],
        chapter_domains: Array.isArray(chapterExport.chapter_domains) ? chapterExport.chapter_domains : [],
        heading_inventory: Array.isArray(chapterExport.heading_inventory) ? chapterExport.heading_inventory : []
      }
    : chapter;

  const reviewJsonPath = path.join(reviewDataDir(), `${chapter.chapter_slug}_review.json`);
  if (!fs.existsSync(reviewJsonPath)) {
    return {
      chapter: enrichedChapter,
      payload: null
    };
  }

  return {
    chapter: enrichedChapter,
    payload: await readJson(reviewJsonPath)
  };
}

export async function loadGeneReviewsRunStatus(runNameInput) {
  const runName = safeRunName(runNameInput);
  const runDir = path.join(OUTPUT_ROOT, runName);
  const stageDefs = [
    {
      key: 'stage1_fetch',
      label: 'Stage 1 Fetch',
      summaryFile: null,
      filePredicate: (name) => name.endsWith('_clinical_structure.json')
    },
    {
      key: 'stage2b_phenotagger_local',
      label: 'Stage 2b PhenoTagger',
      summaryFile: 'phenotagger_local_summary.json',
      filePredicate: (name) => name.endsWith('_phenotagger_anchors.json')
    },
    {
      key: 'stage2_anchors',
      label: 'Stage 2 Anchors',
      summaryFile: 'anchors_summary.json',
      filePredicate: (name) => name.endsWith('_anchors.json')
    },
    {
      key: 'stage3_candidates',
      label: 'Stage 3 Candidates',
      summaryFile: 'candidates_summary.json',
      filePredicate: (name) => name.endsWith('_candidates.json')
    },
    {
      key: 'stage4_mapped_candidates',
      label: 'Stage 4 Mapping',
      summaryFile: 'mapped_candidates_summary.json',
      filePredicate: (name) => name.endsWith('_mapped_candidates.json')
    },
    {
      key: 'stage5_enriched_medgemma',
      label: 'Stage 5 Metadata',
      summaryFile: 'metadata_summary.json',
      filePredicate: (name) => name.endsWith('_enriched.json')
    },
    {
      key: 'stage7_verify_medgemma',
      label: 'Stage 7 Verify',
      summaryFile: 'verification_summary.json',
      filePredicate: (name) => name.endsWith('_verification.json')
    },
    {
      key: 'stage6_manifest_medgemma',
      label: 'Stage 6 Manifest',
      summaryFile: 'manifest_summary.json',
      filePredicate: (name) => name.endsWith('.json')
    }
  ];

  const stages = [];
  for (const stageDef of stageDefs) {
    const dirPath = path.join(runDir, stageDef.key);
    const dirExists = fs.existsSync(dirPath);
    const fileCount = await countFiles(dirPath, stageDef.filePredicate);
    const summary = stageDef.summaryFile ? await readJsonIfExists(path.join(dirPath, stageDef.summaryFile)) : null;
    stages.push({
      key: stageDef.key,
      label: stageDef.label,
      dir_exists: dirExists,
      dir_path: dirPath,
      file_count: fileCount,
      summary,
      latest_mtime: await latestMtimeIso(dirPath),
      status: inferStageStatus({ dirExists, summary, fileCount })
    });
  }

  return {
    ready: fs.existsSync(runDir),
    run_name: runName,
    run_dir: runDir,
    generated_at: new Date().toISOString(),
    medgemma: await loadMedGemmaHealth(),
    stages
  };
}

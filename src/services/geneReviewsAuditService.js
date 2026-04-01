import path from 'node:path';
import fsp from 'node:fs/promises';
import fs from 'node:fs';
import { ENV } from '../config/env.js';

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

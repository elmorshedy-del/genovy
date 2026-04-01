import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import {
  buildAncestorMap,
  createStageTracker,
  ensureDir,
  loadPolicyFile,
  parseArgs,
  sliceChapters,
  toBaseName,
  writeJson
} from '../lib/genereviewsPipeline.js';
import { summarizeFeatureVerifications, verifyFeatureDeterministically } from '../lib/genereviewsVerification.js';
import { buildChapterReviewArtifacts } from '../lib/genereviewsHumanReview.js';

const DEFAULTS = Object.freeze({
  policyJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/data/source-enrichment/genereviews-chapter-policy-template-20260329.json',
  clinicalDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-20260329/stage1_fetch',
  enrichedDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-20260329/stage5_enriched',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-20260329/stage7_verify',
  start: 0,
  limit: 20
});

function attachLocalClinicalDomains(features, clinicalStructure) {
  const paragraphDomainMap = new Map(
    (clinicalStructure?.paragraphs || []).map((paragraph) => [paragraph.paragraph_id, paragraph.local_clinical_domains || []])
  );
  return (features || []).map((feature) => ({
    ...feature,
    local_clinical_domains:
      Array.isArray(feature.local_clinical_domains) && feature.local_clinical_domains.length
        ? feature.local_clinical_domains
        : paragraphDomainMap.get(feature.paragraph_id) || []
  }));
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const policyJson = flags.policy || DEFAULTS.policyJson;
  const clinicalDir = flags.clinical || DEFAULTS.clinicalDir;
  const enrichedDir = flags.enriched || DEFAULTS.enrichedDir;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const ontologyJson = flags.ontologyJson || '';
  const start = Number.parseInt(flags.start || `${DEFAULTS.start}`, 10) || 0;
  const limit = Number.parseInt(flags.limit || `${DEFAULTS.limit}`, 10) || DEFAULTS.limit;
  const noResume = Boolean(flags.noResume);
  await ensureDir(outputDir);
  await ensureDir(path.join(outputDir, 'review_pages'));
  await ensureDir(path.join(outputDir, 'review_data'));

  const { chapters } = await loadPolicyFile(policyJson);
  const slice = sliceChapters(chapters, start, limit);
  const ontologyPayload =
    ontologyJson && fs.existsSync(ontologyJson)
      ? JSON.parse(await fsp.readFile(ontologyJson, 'utf8'))
      : null;
  const ontologyRows = Array.isArray(ontologyPayload?.ontology_rows)
    ? ontologyPayload.ontology_rows
    : Array.isArray(ontologyPayload?.rows)
      ? ontologyPayload.rows
      : Array.isArray(ontologyPayload)
        ? ontologyPayload
        : [];
  const ancestorMap = buildAncestorMap(ontologyRows);
  const tracker = createStageTracker(outputDir, 'verification_progress.json');
  const progress = noResume
    ? {
        total_processed: 0,
        total_errors: 0,
        last_index: -1,
        last_chapter_key: null,
        results: [],
        errors: []
      }
    : await tracker.load();

  for (let offset = 0; offset < slice.length; offset += 1) {
    const chapter = slice[offset];
    const absoluteIndex = start + offset;
    const fileStem = chapter.nbkId || toBaseName(chapter, `chapter_${absoluteIndex + 1}`);
    const clinicalPath = path.join(clinicalDir, `${fileStem}_clinical_text.txt`);
    const structurePath = path.join(clinicalDir, `${fileStem}_clinical_structure.json`);
    const tablesPath = path.join(clinicalDir, `${fileStem}_tables.json`);
    const enrichedPath = path.join(enrichedDir, `${fileStem}_enriched.json`);
    const outputPath = path.join(outputDir, `${fileStem}_verification.json`);
    const reviewPagePath = path.join(outputDir, 'review_pages', `${fileStem}_review.html`);
    const reviewDataPath = path.join(outputDir, 'review_data', `${fileStem}_review.json`);
    console.log(`[${absoluteIndex + 1}/${chapters.length}] ${chapter.chapterTitle || chapter.chapterKey}`);

    try {
      if (!fs.existsSync(clinicalPath)) throw new Error(`Missing clinical text: ${clinicalPath}`);
      if (!fs.existsSync(structurePath)) throw new Error(`Missing clinical structure: ${structurePath}`);
      if (!fs.existsSync(enrichedPath)) throw new Error(`Missing enriched file: ${enrichedPath}`);
      if (!noResume && fs.existsSync(outputPath)) {
        progress.results.push({ chapterKey: chapter.chapterKey, nbkId: chapter.nbkId || '', resumed: true });
        progress.total_processed += 1;
        progress.last_index = absoluteIndex;
        progress.last_chapter_key = chapter.chapterKey;
        await tracker.save(progress);
        continue;
      }

      const clinicalText = await fsp.readFile(clinicalPath, 'utf8');
      const clinicalStructure = JSON.parse(await fsp.readFile(structurePath, 'utf8'));
      const tablesPayload = fs.existsSync(tablesPath) ? JSON.parse(await fsp.readFile(tablesPath, 'utf8')) : { tables: [] };
      const enriched = JSON.parse(await fsp.readFile(enrichedPath, 'utf8'));
      const resolvedChapter = {
        ...chapter,
        nbkId: enriched.nbk_id || tablesPayload.nbk_id || chapter.nbkId || '',
        chapterTitle: enriched.chapter_title || tablesPayload.chapter_title || chapter.chapterTitle || ''
      };
      const features = attachLocalClinicalDomains(Array.isArray(enriched.features) ? enriched.features : [], clinicalStructure);
      const baseVerifications = features.map((feature) =>
        verifyFeatureDeterministically(feature, clinicalText, {
          tables: tablesPayload.tables || [],
          ancestorMap
        })
      );
      const { reviewItems, payload, html } = buildChapterReviewArtifacts({
        chapter: resolvedChapter,
        features,
        verifications: baseVerifications,
        chapterText: clinicalText,
        clinicalStructure,
        reviewPagePath
      });
      await fsp.writeFile(reviewPagePath, html, 'utf8');
      await writeJson(reviewDataPath, payload);
      const verifications = baseVerifications.map((verification, index) => ({
        ...verification,
        human_review: reviewItems[index]
      }));
      const summary = summarizeFeatureVerifications(verifications);

      await writeJson(outputPath, {
        created_at: new Date().toISOString(),
        stage: 'verify',
        chapter_key: chapter.chapterKey,
        nbk_id: resolvedChapter.nbkId || '',
        chapter_title: resolvedChapter.chapterTitle || '',
        review_page_path: reviewPagePath,
        review_data_path: reviewDataPath,
        feature_count: features.length,
        table_count: Array.isArray(tablesPayload.tables) ? tablesPayload.tables.length : 0,
        summary,
        verifications
      });

      progress.results.push({
        chapterKey: chapter.chapterKey,
        nbkId: resolvedChapter.nbkId || '',
        reviewPagePath: reviewPagePath,
        featureCount: features.length,
        verified: summary.verified,
        flagged: summary.flagged,
        failed: summary.failed,
        autoAcceptEligible: summary.autoAcceptEligible
      });
      progress.total_processed += 1;
      progress.last_index = absoluteIndex;
      progress.last_chapter_key = chapter.chapterKey;
      await tracker.save(progress);
    } catch (error) {
      progress.errors.push({ chapterKey: chapter.chapterKey, nbkId: chapter.nbkId || '', error: error.message || String(error) });
      progress.total_errors += 1;
      progress.last_index = absoluteIndex;
      progress.last_chapter_key = chapter.chapterKey;
      await tracker.save(progress);
      console.error(`  ERROR: ${error.message}`);
    }
  }

  const totals = progress.results.reduce(
    (acc, row) => {
      acc.featureCount += Number(row.featureCount || 0);
      acc.verified += Number(row.verified || 0);
      acc.flagged += Number(row.flagged || 0);
      acc.failed += Number(row.failed || 0);
      acc.autoAcceptEligible += Number(row.autoAcceptEligible || 0);
      return acc;
    },
    { featureCount: 0, verified: 0, flagged: 0, failed: 0, autoAcceptEligible: 0 }
  );

  await writeJson(path.join(outputDir, 'verification_summary.json'), {
    created_at: new Date().toISOString(),
    stage: 'verify',
    total_processed: progress.total_processed,
    total_errors: progress.total_errors,
    results: progress.results,
    totals,
    errors: progress.errors
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

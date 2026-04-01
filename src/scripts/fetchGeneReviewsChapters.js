import path from 'node:path';
import fs from 'node:fs';
import {
  buildClinicalTextStructureFromSections,
  buildClinicalTextStructure,
  createStageTracker,
  ensureDir,
  fetchGeneReviewsChapter,
  loadPolicyFile,
  parseGeneReviewsChapterHtml,
  parseArgs,
  sliceChapters,
  toBaseName,
  writeJson,
  writeText
} from '../lib/genereviewsPipeline.js';

const DEFAULTS = Object.freeze({
  policyJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/data/source-enrichment/genereviews-chapter-policy-template-20260329.json',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-20260329/stage1_fetch',
  start: 0,
  limit: 20,
  ncbiDelayMs: 400
});

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const policyJson = flags.policy || DEFAULTS.policyJson;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const start = Number.parseInt(flags.start || `${DEFAULTS.start}`, 10) || 0;
  const limit = Number.parseInt(flags.limit || `${DEFAULTS.limit}`, 10) || DEFAULTS.limit;
  const noResume = Boolean(flags.noResume);
  const reuseRaw = Boolean(flags.reuseRaw);
  await ensureDir(outputDir);

  const { chapters } = await loadPolicyFile(policyJson);
  const slice = sliceChapters(chapters, start, limit);
  const tracker = createStageTracker(outputDir, 'fetch_progress.json');
  const progress = await tracker.load();

  for (let offset = 0; offset < slice.length; offset += 1) {
    const chapter = slice[offset];
    const absoluteIndex = start + offset;
    const fallbackBase = toBaseName(chapter, `chapter_${absoluteIndex + 1}`);
    console.log(`[${absoluteIndex + 1}/${chapters.length}] ${chapter.chapterTitle || chapter.chapterKey}`);

    try {
      const expectedStem = chapter.nbkId || fallbackBase;
      const textPath = path.join(outputDir, `${expectedStem}_clinical_text.txt`);
      const structurePath = path.join(outputDir, `${expectedStem}_clinical_structure.json`);
      const tablePath = path.join(outputDir, `${expectedStem}_tables.json`);
      const rawPath = path.join(outputDir, `${expectedStem}_raw.html`);
      if (!noResume) {
        const fs = await import('node:fs');
        if (fs.existsSync(textPath) && fs.existsSync(structurePath) && fs.existsSync(tablePath) && fs.existsSync(rawPath)) {
          progress.results.push({
            chapterKey: chapter.chapterKey,
            nbkId: chapter.nbkId || '',
            resumed: true
          });
          progress.total_processed += 1;
          progress.last_index = absoluteIndex;
          progress.last_chapter_key = chapter.chapterKey;
          await tracker.save(progress);
          continue;
        }
      }

      const fetched =
        reuseRaw && fs.existsSync(rawPath)
          ? parseGeneReviewsChapterHtml(chapter, await fs.promises.readFile(rawPath, 'utf8'))
          : await fetchGeneReviewsChapter(chapter, DEFAULTS.ncbiDelayMs);
      const fileStem = fetched.resolvedNbkId || expectedStem;
      const stems = [...new Set([fileStem, expectedStem].filter(Boolean))];
      const clinicalStructure = Array.isArray(fetched.clinicalSections) && fetched.clinicalSections.length
        ? buildClinicalTextStructureFromSections(fetched.clinicalSections)
        : buildClinicalTextStructure(fetched.clinicalText);
      for (const stem of stems) {
        await writeText(path.join(outputDir, `${stem}_clinical_text.txt`), fetched.clinicalText);
        await writeJson(path.join(outputDir, `${stem}_clinical_structure.json`), {
          created_at: new Date().toISOString(),
          nbk_id: fetched.resolvedNbkId,
          chapter_title: fetched.chapterTitle,
          chapter_key: chapter.chapterKey,
          provenance_url: fetched.provenanceUrl,
          heading_inventory: fetched.headingInventory || [],
          chapter_domains: fetched.chapterDomains || [],
          ...clinicalStructure
        });
        await writeJson(path.join(outputDir, `${stem}_tables.json`), {
          created_at: new Date().toISOString(),
          nbk_id: fetched.resolvedNbkId,
          chapter_title: fetched.chapterTitle,
          chapter_key: chapter.chapterKey,
          tables: fetched.tables
        });
        await writeText(path.join(outputDir, `${stem}_raw.html`), fetched.rawHtml);
      }

      progress.results.push({
        chapterKey: chapter.chapterKey,
        nbkId: fetched.resolvedNbkId,
        chapterTitle: fetched.chapterTitle,
        proseChars: fetched.clinicalText.length,
        tableCount: fetched.tables.length,
        rawHtmlChars: fetched.rawHtml.length
      });
      progress.total_processed += 1;
      progress.last_index = absoluteIndex;
      progress.last_chapter_key = chapter.chapterKey;
      await tracker.save(progress);
    } catch (error) {
      progress.errors.push({
        chapterKey: chapter.chapterKey,
        nbkId: chapter.nbkId || '',
        error: error.message || String(error)
      });
      progress.total_errors += 1;
      progress.last_index = absoluteIndex;
      progress.last_chapter_key = chapter.chapterKey;
      await tracker.save(progress);
      console.error(`  ERROR: ${error.message}`);
    }
  }

  await writeJson(path.join(outputDir, 'fetch_summary.json'), {
    created_at: new Date().toISOString(),
    stage: 'fetch',
    total_processed: progress.total_processed,
    total_errors: progress.total_errors,
    results: progress.results,
    errors: progress.errors
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

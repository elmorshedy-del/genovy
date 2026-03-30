import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { withClient } from '../db/pool.js';
import {
  buildPhenotypeLexicon,
  createStageTracker,
  ensureDir,
  extractAnchorOccurrences,
  loadPhenotypeBaseRows,
  loadPolicyFile,
  parseArgs,
  sliceChapters,
  splitParagraphs,
  toBaseName,
  writeJson
} from '../lib/genereviewsPipeline.js';

const DEFAULTS = Object.freeze({
  policyJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/data/source-enrichment/genereviews-chapter-policy-template-20260329.json',
  inputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-20260329/stage1_fetch',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-20260329/stage2_anchors',
  start: 0,
  limit: 20,
  minIc: 0,
  maxAnchorWords: 8
});

function mergeAnchorSets(localAnchors, supplementAnchors, phenotypeByCurie) {
  const merged = new Map();

  function upsert(anchor, sourceLabel) {
    const meta = phenotypeByCurie.get(anchor.hpo_id);
    if (!meta) return;
    const existing = merged.get(anchor.hpo_id) || {
      hpo_id: anchor.hpo_id,
      hpo_label: meta.canonical_label,
      ic_score: Number(meta.ic_score || 0),
      match_types: new Set(),
      occurrences: []
    };

    for (const matchType of anchor.match_types || []) {
      existing.match_types.add(matchType);
    }
    if (!anchor.match_types?.length && sourceLabel) {
      existing.match_types.add(sourceLabel);
    }
    for (const occurrence of anchor.occurrences || []) {
      existing.occurrences.push({
        ...occurrence,
        match_type: occurrence.match_type || sourceLabel
      });
    }
    merged.set(anchor.hpo_id, existing);
  }

  for (const anchor of localAnchors || []) upsert(anchor, null);
  for (const anchor of supplementAnchors || []) upsert(anchor, 'phenotagger_api');

  return [...merged.values()]
    .map((anchor) => ({
      ...anchor,
      match_types: [...anchor.match_types].sort(),
      occurrences: (anchor.occurrences || []).sort((left, right) => {
        const leftIndex = Number(left.paragraph_index || 0);
        const rightIndex = Number(right.paragraph_index || 0);
        return leftIndex - rightIndex;
      })
    }))
    .sort((left, right) => left.hpo_label.localeCompare(right.hpo_label));
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const policyJson = flags.policy || DEFAULTS.policyJson;
  const inputDir = flags.input || DEFAULTS.inputDir;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const supplementDir = flags.supplementDir || '';
  const start = Number.parseInt(flags.start || `${DEFAULTS.start}`, 10) || 0;
  const limit = Number.parseInt(flags.limit || `${DEFAULTS.limit}`, 10) || DEFAULTS.limit;
  const minIc = Number.parseFloat(flags.minIc || `${DEFAULTS.minIc}`);
  const noResume = Boolean(flags.noResume);
  await ensureDir(outputDir);

  const phenotypeRows = await withClient((client) => loadPhenotypeBaseRows(client));
  await writeJson(path.join(outputDir, 'phenotype_rows_snapshot.json'), {
    created_at: new Date().toISOString(),
    phenotype_row_count: phenotypeRows.length,
    phenotype_rows: phenotypeRows
  });
  const lexicon = buildPhenotypeLexicon(phenotypeRows, DEFAULTS.maxAnchorWords);
  const phenotypeByCurie = new Map(phenotypeRows.map((row) => [row.canonical_curie, row]));

  const { chapters } = await loadPolicyFile(policyJson);
  const slice = sliceChapters(chapters, start, limit);
  const tracker = createStageTracker(outputDir, 'anchors_progress.json');
  const progress = await tracker.load();

  for (let offset = 0; offset < slice.length; offset += 1) {
    const chapter = slice[offset];
    const absoluteIndex = start + offset;
    const fileStem = chapter.nbkId || toBaseName(chapter, `chapter_${absoluteIndex + 1}`);
    const textPath = path.join(inputDir, `${fileStem}_clinical_text.txt`);
    const outputPath = path.join(outputDir, `${fileStem}_anchors.json`);
    console.log(`[${absoluteIndex + 1}/${chapters.length}] ${chapter.chapterTitle || chapter.chapterKey}`);

    try {
      if (!fs.existsSync(textPath)) {
        throw new Error(`Missing clinical text: ${textPath}`);
      }
      if (!noResume && fs.existsSync(outputPath)) {
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

      const clinicalText = await fsp.readFile(textPath, 'utf8');
      const paragraphs = splitParagraphs(clinicalText);
      const localAnchors = extractAnchorOccurrences(paragraphs, lexicon, { minIc });
      let supplementAnchors = [];
      if (supplementDir) {
        const supplementPath = path.join(supplementDir, `${fileStem}_phenotagger_anchors.json`);
        if (fs.existsSync(supplementPath)) {
          const supplementPayload = JSON.parse(await fsp.readFile(supplementPath, 'utf8'));
          supplementAnchors = Array.isArray(supplementPayload?.anchors) ? supplementPayload.anchors : [];
        }
      }
      const anchors = mergeAnchorSets(localAnchors, supplementAnchors, phenotypeByCurie);

      const payload = {
        created_at: new Date().toISOString(),
        stage: 'anchors',
        chapter_key: chapter.chapterKey,
        nbk_id: chapter.nbkId || '',
        chapter_title: chapter.chapterTitle || '',
        chapter_path: chapter.chapterPath || '',
        roster_mapping_status: chapter.rosterMappingStatus || '',
        disease_curie: chapter.rosterMappedDiseaseCurie || '',
        disease_label: chapter.rosterMappedDiseaseLabel || '',
        min_ic_filter: minIc,
        local_anchor_count: localAnchors.length,
        supplement_anchor_count: supplementAnchors.length,
        anchor_count: anchors.length,
        anchors
      };
      await writeJson(outputPath, payload);

      progress.results.push({
        chapterKey: chapter.chapterKey,
        nbkId: chapter.nbkId || '',
        anchorCount: anchors.length
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

  await writeJson(path.join(outputDir, 'anchors_summary.json'), {
    created_at: new Date().toISOString(),
    stage: 'anchors',
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

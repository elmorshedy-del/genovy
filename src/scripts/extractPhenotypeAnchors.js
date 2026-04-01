import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { withClient } from '../db/pool.js';
import {
  buildClinicalTextStructure,
  buildPhenotypeLexicon,
  createStageTracker,
  ensureDir,
  extractAnchorOccurrences,
  loadPhenotypeBaseRows,
  loadPhenotypeOntologyRows,
  loadPolicyFile,
  parseArgs,
  sliceChapters,
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
  const buildAnchorKey = (anchor) => `${anchor.hpo_id}::${anchor.status || 'present'}`;

  function upsert(anchor, sourceLabel) {
    const meta = phenotypeByCurie.get(anchor.hpo_id);
    if (!meta) return;
    const anchorStatus = anchor.status === 'excluded' ? 'excluded' : 'present';
    const anchorKey = buildAnchorKey({ ...anchor, status: anchorStatus });
    const existing = merged.get(anchorKey) || {
      hpo_id: anchor.hpo_id,
      hpo_label: meta.canonical_label,
      status: anchorStatus,
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
        status: occurrence.status === 'excluded' ? 'excluded' : anchorStatus,
        match_type: occurrence.match_type || sourceLabel
      });
    }
    merged.set(anchorKey, existing);
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
  const phenotypesJson = flags.phenotypesJson || path.join(outputDir, 'phenotype_rows_snapshot.json');
  const ontologyJson = flags.ontologyJson || path.join(outputDir, 'ontology_rows_snapshot.json');
  const start = Number.parseInt(flags.start || `${DEFAULTS.start}`, 10) || 0;
  const limit = Number.parseInt(flags.limit || `${DEFAULTS.limit}`, 10) || DEFAULTS.limit;
  const minIc = Number.parseFloat(flags.minIc || `${DEFAULTS.minIc}`);
  const noResume = Boolean(flags.noResume);
  await ensureDir(outputDir);

  const phenotypeRows = fs.existsSync(phenotypesJson)
    ? (JSON.parse(await fsp.readFile(phenotypesJson, 'utf8')).phenotype_rows || [])
    : await withClient((client) => loadPhenotypeBaseRows(client));
  let ontologyRows = [];
  if (fs.existsSync(ontologyJson)) {
    ontologyRows = JSON.parse(await fsp.readFile(ontologyJson, 'utf8')).ontology_rows || [];
  } else {
    try {
      ontologyRows = await withClient((client) => loadPhenotypeOntologyRows(client));
    } catch (error) {
      console.warn(`[extractPhenotypeAnchors] ontology snapshot unavailable, continuing without ontology rows: ${error.message}`);
      ontologyRows = [];
    }
  }
  await writeJson(path.join(outputDir, 'phenotype_rows_snapshot.json'), {
    created_at: new Date().toISOString(),
    phenotype_row_count: phenotypeRows.length,
    phenotype_rows: phenotypeRows
  });
  await writeJson(path.join(outputDir, 'ontology_rows_snapshot.json'), {
    created_at: new Date().toISOString(),
    ontology_row_count: ontologyRows.length,
    ontology_rows: ontologyRows
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
    const structurePath = path.join(inputDir, `${fileStem}_clinical_structure.json`);
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

      const clinicalStructure = fs.existsSync(structurePath)
        ? JSON.parse(await fsp.readFile(structurePath, 'utf8'))
        : buildClinicalTextStructure(await fsp.readFile(textPath, 'utf8'));
      const resolvedNbkId = clinicalStructure.nbk_id || chapter.nbkId || '';
      const resolvedChapterTitle = clinicalStructure.chapter_title || chapter.chapterTitle || '';
      const localAnchors = extractAnchorOccurrences(clinicalStructure.paragraphs || [], lexicon, { minIc });
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
        nbk_id: resolvedNbkId,
        chapter_title: resolvedChapterTitle,
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
        nbkId: resolvedNbkId,
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

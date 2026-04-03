import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { withClient } from '../db/pool.js';
import {
  buildEmbeddingText,
  callGeminiBatchEmbeddings,
  cosineSimilarity,
  createStageTracker,
  ensureDir,
  loadPhenotypeBaseRows,
  loadPolicyFile,
  parseArgs,
  sleep,
  sliceChapters,
  toBaseName,
  writeJson
} from '../lib/genereviewsPipeline.js';

const execFileAsync = promisify(execFile);

const DEFAULTS = Object.freeze({
  policyJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/data/source-enrichment/genereviews-chapter-policy-template-20260329.json',
  candidatesDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-20260329/stage3_candidates',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-20260329/stage4_mapped_candidates',
  embeddingsJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-20260329/stage4_mapped_candidates/hpo_embeddings.json',
  provider: 'biolord',
  embeddingModel: 'gemini-embedding-001',
  biolordModel: 'FremyCompany/BioLORD-2023',
  start: 0,
  limit: 20,
  batchSize: 64
});

const BIOLORD_HELPER =
  '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/mapCandidatesToHPOBioLORD.py';
const DEFAULT_BIOLORD_PYTHON = '/Users/ahmedelmorshedy/.cache/biolord/.venv/bin/python';
const BIOLORD_PYTHON =
  process.env.BIOLORD_PYTHON || (fs.existsSync(DEFAULT_BIOLORD_PYTHON) ? DEFAULT_BIOLORD_PYTHON : 'python3');

function trustFromScore(score) {
  if (score >= 0.92) return 'high';
  if (score >= 0.85) return 'medium';
  return 'reject';
}

function parseRetryDelayMs(error) {
  const message = String(error?.message || '');
  const secondsMatch = message.match(/retry in\s+(\d+(?:\.\d+)?)s/i);
  if (secondsMatch) {
    return Math.ceil(Number(secondsMatch[1]) * 1000);
  }
  const altMatch = message.match(/retryDelay\":\s*\"(\d+)s\"/i);
  if (altMatch) {
    return Number(altMatch[1]) * 1000;
  }
  return 30000;
}

function isQuotaError(error) {
  const message = String(error?.message || '');
  return message.includes('RESOURCE_EXHAUSTED') || message.includes('429') || message.includes('quota');
}

async function embedTextsWithRetry({ apiKey, model, texts, label }) {
  for (;;) {
    try {
      const response = await callGeminiBatchEmbeddings({
        apiKey,
        model,
        texts
      });
      return response.embeddings;
    } catch (error) {
      if (!isQuotaError(error)) throw error;
      const retryDelayMs = parseRetryDelayMs(error);
      console.warn(`[mapCandidatesToHPO] quota backoff ${retryDelayMs}ms for ${label}`);
      await sleep(retryDelayMs);
    }
  }
}

function insertTopMatch(matches, candidate) {
  matches.push(candidate);
  matches.sort((left, right) => right.score - left.score);
  if (matches.length > 3) matches.length = 3;
}

async function embedCandidateJobs({ candidateJobs, apiKey, embeddingModel, batchSize }) {
  for (let index = 0; index < candidateJobs.length; index += batchSize) {
    const batch = candidateJobs.slice(index, index + batchSize);
    const embeddings = await embedTextsWithRetry({
      apiKey,
      model: embeddingModel,
      texts: batch.map((job) => job.label),
      label: `candidate batch ${index}`
    });
    for (let offset = 0; offset < batch.length; offset += 1) {
      batch[offset].embedding = embeddings[offset] || [];
    }
  }
}

async function streamHpoMatches({ candidateJobs, phenotypeRows, apiKey, embeddingModel, batchSize }) {
  if (!candidateJobs.length) return;

  await embedCandidateJobs({ candidateJobs, apiKey, embeddingModel, batchSize });

  for (let index = 0; index < phenotypeRows.length; index += batchSize) {
    const batchRows = phenotypeRows.slice(index, index + batchSize);
    const embeddings = await embedTextsWithRetry({
      apiKey,
      model: embeddingModel,
      texts: batchRows.map((row) => buildEmbeddingText(row)),
      label: `hpo batch ${index}`
    });

    for (let candidateIndex = 0; candidateIndex < candidateJobs.length; candidateIndex += 1) {
      const candidate = candidateJobs[candidateIndex];
      for (let rowIndex = 0; rowIndex < batchRows.length; rowIndex += 1) {
        const row = batchRows[rowIndex];
        const score = cosineSimilarity(candidate.embedding, embeddings[rowIndex] || []);
        insertTopMatch(candidate.top_matches, {
          hpo_id: row.canonical_curie,
          hpo_label: row.canonical_label,
          score
        });
      }
    }

    if ((index / batchSize) % 25 === 0 || index + batchRows.length >= phenotypeRows.length) {
      console.log(
        `[mapCandidatesToHPO] streamed ${Math.min(index + batchRows.length, phenotypeRows.length)}/${phenotypeRows.length} HPO rows`
      );
    }
  }
}

function finalizeCandidate(candidate) {
  const best = candidate.top_matches[0] || null;
  const trust = best ? trustFromScore(best.score) : 'reject';
  return {
    label: candidate.label,
    status: candidate.status,
    source: candidate.source,
    source_sentence: candidate.source_sentence,
    paragraph: candidate.paragraph,
    local_clinical_domains: candidate.local_clinical_domains || [],
    section_id: candidate.section_id || null,
    section_heading: candidate.section_heading || null,
    paragraph_id: candidate.paragraph_id || null,
    paragraph_index: candidate.paragraph_index || null,
    paragraph_char_start: candidate.paragraph_char_start ?? null,
    paragraph_char_end: candidate.paragraph_char_end ?? null,
    sentence_id: candidate.sentence_id || null,
    sentence_index: candidate.sentence_index || null,
    sentence_char_start: candidate.sentence_char_start ?? null,
    sentence_char_end: candidate.sentence_char_end ?? null,
    match_char_start: candidate.match_char_start ?? null,
    match_char_end: candidate.match_char_end ?? null,
    assertion_status_origin: candidate.assertion_status_origin || null,
    assertion_reason: candidate.assertion_reason || null,
    assertion_evidence: candidate.assertion_evidence || '',
    top_matches: candidate.top_matches,
    mapped_hpo_id: trust === 'reject' ? null : best.hpo_id,
    mapped_hpo_label: trust === 'reject' ? null : best.hpo_label,
    hpo_mapping_trust: trust
  };
}

function simplifyPhenotypeRows(rows) {
  return rows.map((row) => ({
    canonical_curie: row.canonical_curie,
    canonical_label: row.canonical_label,
    description: row.description || '',
    aliases: row.aliases || []
  }));
}

function resolveBioLordCacheDir(outputDir) {
  const cacheCandidates = [
    path.join(outputDir, 'biolord_cache'),
    path.join(outputDir, 'biolord_cache_py310_np'),
    path.join(outputDir, 'biolord_cache_py310')
  ];
  for (const candidate of cacheCandidates) {
    if (
      fs.existsSync(path.join(candidate, 'biolord_embeddings.npy')) &&
      fs.existsSync(path.join(candidate, 'biolord_index_metadata.json'))
    ) {
      return candidate;
    }
  }
  return path.join(outputDir, 'biolord_cache');
}

async function runBioLordMapper({ outputDir, phenotypeRows, chapterJobs, biolordModel }) {
  const requestPath = path.join(outputDir, 'biolord_request.json');
  const phenotypePath = path.join(outputDir, 'biolord_phenotypes.json');
  const responsePath = path.join(outputDir, 'biolord_response.json');
  const cacheDir = resolveBioLordCacheDir(outputDir);

  await writeJson(phenotypePath, simplifyPhenotypeRows(phenotypeRows));
  await writeJson(requestPath, {
    chapters: chapterJobs.map((chapterJob) => ({
      chapter_key: chapterJob.chapter.chapterKey,
      nbk_id: chapterJob.chapter.nbkId || '',
      chapter_title: chapterJob.chapter.chapterTitle || '',
      candidates: chapterJob.payload.candidates || []
    }))
  });

  await execFileAsync(BIOLORD_PYTHON, [
    BIOLORD_HELPER,
    '--request',
    requestPath,
    '--phenotypes',
    phenotypePath,
    '--cache-dir',
    cacheDir,
    '--output',
    responsePath,
    '--model',
    biolordModel
  ], {
    maxBuffer: 1024 * 1024 * 32
  });

  return JSON.parse(await fsp.readFile(responsePath, 'utf8'));
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const policyJson = flags.policy || DEFAULTS.policyJson;
  const candidatesDir = flags.input || DEFAULTS.candidatesDir;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const embeddingsJson = flags.embeddings || DEFAULTS.embeddingsJson;
  const phenotypesJson = flags.phenotypesJson || '';
  const provider = String(flags.provider || DEFAULTS.provider).toLowerCase();
  const embeddingModel = flags.embeddingModel || DEFAULTS.embeddingModel;
  const biolordModel = flags.biolordModel || DEFAULTS.biolordModel;
  const apiKey = flags.apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';
  const start = Number.parseInt(flags.start || `${DEFAULTS.start}`, 10) || 0;
  const limit = Number.parseInt(flags.limit || `${DEFAULTS.limit}`, 10) || DEFAULTS.limit;
  const batchSize = Number.parseInt(flags.batchSize || `${DEFAULTS.batchSize}`, 10) || DEFAULTS.batchSize;
  const noResume = Boolean(flags.noResume);
  if (provider === 'gemini' && !apiKey) {
    throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is required.');
  }
  await ensureDir(outputDir);

  console.log('[mapCandidatesToHPO] loading phenotype rows');
  const phenotypeRows = phenotypesJson
    ? (() => {
        const parsed = JSON.parse(fs.readFileSync(phenotypesJson, 'utf8'));
        if (Array.isArray(parsed)) return parsed;
        if (Array.isArray(parsed?.phenotype_rows)) return parsed.phenotype_rows;
        return [];
      })()
    : await withClient((client) => loadPhenotypeBaseRows(client));
  console.log(`[mapCandidatesToHPO] loaded ${phenotypeRows.length} phenotype rows`);
  const { chapters } = await loadPolicyFile(policyJson);
  const slice = sliceChapters(chapters, start, limit);
  const tracker = createStageTracker(outputDir, 'mapped_candidates_progress.json');
  const progress = await tracker.load();
  const chapterJobs = [];
  const candidateJobs = [];

  for (let offset = 0; offset < slice.length; offset += 1) {
    const chapter = slice[offset];
    const absoluteIndex = start + offset;
    const fileStem = chapter.nbkId || toBaseName(chapter, `chapter_${absoluteIndex + 1}`);
    const inputPath = path.join(candidatesDir, `${fileStem}_candidates.json`);
    const outputPath = path.join(outputDir, `${fileStem}_mapped_candidates.json`);
    console.log(`[${absoluteIndex + 1}/${chapters.length}] ${chapter.chapterTitle || chapter.chapterKey}`);

    try {
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Missing candidates: ${inputPath}`);
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

      const payload = JSON.parse(await fsp.readFile(inputPath, 'utf8'));
      const resolvedChapter = {
        ...chapter,
        nbkId: payload.nbk_id || chapter.nbkId || '',
        chapterTitle: payload.chapter_title || chapter.chapterTitle || ''
      };
      const chapterJob = {
        chapter: resolvedChapter,
        absoluteIndex,
        fileStem,
        outputPath,
        payload,
        candidateIndexes: []
      };
      for (const candidate of payload.candidates || []) {
        chapterJob.candidateIndexes.push(candidateJobs.length);
        candidateJobs.push({
          chapter_key: chapter.chapterKey,
          label: candidate.label,
          status: candidate.status === 'excluded' ? 'excluded' : 'present',
          source: candidate.source || 'llm_candidate',
          source_sentence: candidate.source_sentence || '',
          paragraph: candidate.paragraph || '',
          section_id: candidate.section_id || null,
          section_heading: candidate.section_heading || null,
          paragraph_id: candidate.paragraph_id || null,
          paragraph_index: candidate.paragraph_index || null,
          paragraph_char_start: candidate.paragraph_char_start ?? null,
          paragraph_char_end: candidate.paragraph_char_end ?? null,
          sentence_id: candidate.sentence_id || null,
          sentence_index: candidate.sentence_index || null,
          sentence_char_start: candidate.sentence_char_start ?? null,
          sentence_char_end: candidate.sentence_char_end ?? null,
          match_char_start: candidate.match_char_start ?? null,
          match_char_end: candidate.match_char_end ?? null,
          assertion_status_origin: candidate.assertion_status_origin || null,
          assertion_reason: candidate.assertion_reason || null,
          assertion_evidence: candidate.assertion_evidence || '',
          embedding: [],
          top_matches: []
        });
      }
      chapterJobs.push(chapterJob);
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

  console.log(`[mapCandidatesToHPO] prepared ${chapterJobs.length} chapter jobs and ${candidateJobs.length} candidates`);
  let mappedByChapterKey = new Map();
  if (provider === 'biolord') {
    if (candidateJobs.length > 0) {
      console.log('[mapCandidatesToHPO] starting BioLORD mapper');
      const response = await runBioLordMapper({
        outputDir,
        phenotypeRows,
        chapterJobs,
        biolordModel
      });
      console.log('[mapCandidatesToHPO] BioLORD mapper finished');
      mappedByChapterKey = new Map(
        (response.chapter_results || []).map((chapterResult) => [chapterResult.chapter_key, chapterResult.mapped_candidates || []])
      );
    }
  } else {
    await streamHpoMatches({
      candidateJobs,
      phenotypeRows,
      apiKey,
      embeddingModel,
      batchSize
    });
  }

  for (const chapterJob of chapterJobs) {
    const mappedCandidates =
      provider === 'biolord'
        ? mappedByChapterKey.get(chapterJob.chapter.chapterKey) || []
        : chapterJob.candidateIndexes.map((index) => finalizeCandidate(candidateJobs[index]));
    await writeJson(chapterJob.outputPath, {
      created_at: new Date().toISOString(),
      stage: 'mapped_candidates',
      chapter_key: chapterJob.chapter.chapterKey,
      nbk_id: chapterJob.chapter.nbkId || '',
      chapter_title: chapterJob.chapter.chapterTitle || '',
      embedding_model: provider === 'biolord' ? biolordModel : embeddingModel,
      mapping_provider: provider,
      candidate_count: mappedCandidates.length,
      mapped_candidates: mappedCandidates
    });

    progress.results.push({
      chapterKey: chapterJob.chapter.chapterKey,
      nbkId: chapterJob.chapter.nbkId || '',
      candidateCount: mappedCandidates.length,
      acceptedHigh: mappedCandidates.filter((row) => row.hpo_mapping_trust === 'high').length,
      reviewMedium: mappedCandidates.filter((row) => row.hpo_mapping_trust === 'medium').length
    });
    progress.total_processed += 1;
    progress.last_index = chapterJob.absoluteIndex;
    progress.last_chapter_key = chapterJob.chapter.chapterKey;
    await tracker.save(progress);
  }

  await writeJson(embeddingsJson, {
    created_at: new Date().toISOString(),
    embedding_model: embeddingModel,
    mode: 'streamed_topk_no_cache',
    phenotype_row_count: phenotypeRows.length,
    candidate_row_count: candidateJobs.length,
    batch_size: batchSize
  });

  await writeJson(path.join(outputDir, 'mapped_candidates_summary.json'), {
    created_at: new Date().toISOString(),
    stage: 'mapped_candidates',
    total_processed: progress.total_processed,
    total_errors: progress.total_errors,
    embeddings_json: embeddingsJson,
    results: progress.results,
    errors: progress.errors
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import {
  buildClinicalTextStructure,
  callOpenAiCompatJson,
  createStageTracker,
  ensureDir,
  locateCandidateContext,
  matchesExistingAnchor,
  parseArgs,
  writeJson
} from '../lib/genereviewsPipeline.js';

const DEFAULTS = Object.freeze({
  clinicalDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-latest5-20260330/stage1_fetch',
  anchorsDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-latest5-20260330/stage2_anchors',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-qwen-latest5-20260330/stage3_candidates',
  providerName: 'dashscope',
  baseUrl: '',
  model: '',
  limit: 5
});

const CANDIDATE_DISCOVERY_PROMPT = `You are a clinical genetics expert reading a GeneReviews chapter.

TASK: List every clinical phenotype feature described in this text. Include features that are implied but not explicitly named (e.g., "the child never walked independently" = inability to walk).

RULES:
1. Output one feature per line as a short plain English phrase
2. Mark each as "present" or "excluded":
   - present = described in patients with this disease
   - excluded = explicitly stated as NOT present or absent
3. Do NOT output:
   - Inheritance patterns (autosomal dominant, X-linked, etc.)
   - Gene names, variant descriptions, molecular findings
   - Laboratory methods or test procedures
   - Treatment responses or management recommendations
   - Normal findings (output these ONLY if they are explicitly contrasted with an abnormality)
4. Do NOT output HPO IDs or attempt to map to any ontology
5. If a feature appears multiple times in the text, output it only once
6. Be specific: "infantile muscular hypotonia" not "hypotonia"

OUTPUT FORMAT (JSON object, no other text, no markdown fences):
{
  "features": [
    { "label": "short phrase", "status": "present" },
    { "label": "other phrase", "status": "excluded" }
  ]
}`;

async function listChapterJobs(clinicalDir, anchorsDir, limit) {
  const anchorNames = (await fsp.readdir(anchorsDir))
    .filter((name) => name.endsWith('_anchors.json'))
    .sort((left, right) => left.localeCompare(right))
    .slice(0, limit);
  return anchorNames
    .map((name) => {
      const stem = name.replace(/_anchors\.json$/i, '');
      return {
        stem,
        clinicalPath: path.join(clinicalDir, `${stem}_clinical_text.txt`),
        structurePath: path.join(clinicalDir, `${stem}_clinical_structure.json`),
        anchorsPath: path.join(anchorsDir, name)
      };
    })
    .filter((job) => fs.existsSync(job.clinicalPath));
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const clinicalDir = flags.clinical || DEFAULTS.clinicalDir;
  const anchorsDir = flags.anchors || DEFAULTS.anchorsDir;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const providerName = flags.provider || DEFAULTS.providerName;
  const baseUrl =
    flags.baseUrl || process.env.DASHSCOPE_BASE_URL || process.env.OPENAI_COMPAT_BASE_URL || DEFAULTS.baseUrl;
  const model = flags.model || process.env.DASHSCOPE_MODEL || DEFAULTS.model;
  const apiKey =
    flags.apiKey || process.env.DASHSCOPE_API_KEY || process.env.OPENAI_COMPAT_API_KEY || process.env.OPENAI_API_KEY || '';
  const limit = Number.parseInt(flags.limit || `${DEFAULTS.limit}`, 10) || DEFAULTS.limit;
  const noResume = Boolean(flags.noResume);

  if (!baseUrl) throw new Error('base URL is required via --baseUrl or DASHSCOPE_BASE_URL.');
  if (!apiKey) throw new Error('API key is required via --apiKey or DASHSCOPE_API_KEY.');
  if (!model) throw new Error('model is required via --model or DASHSCOPE_MODEL.');

  await ensureDir(outputDir);
  const jobs = await listChapterJobs(clinicalDir, anchorsDir, limit);
  const tracker = createStageTracker(outputDir, 'candidates_progress.json');
  const progress = await tracker.load();

  for (let index = 0; index < jobs.length; index += 1) {
    const job = jobs[index];
    const outputPath = path.join(outputDir, `${job.stem}_candidates.json`);
    console.log(`[${index + 1}/${jobs.length}] ${job.stem}`);

    try {
      if (!noResume && fs.existsSync(outputPath)) {
        progress.results.push({ stem: job.stem, resumed: true });
        progress.total_processed += 1;
        progress.last_index = index;
        progress.last_chapter_key = job.stem;
        await tracker.save(progress);
        continue;
      }

      const clinicalText = await fsp.readFile(job.clinicalPath, 'utf8');
      const clinicalStructure = fs.existsSync(job.structurePath)
        ? JSON.parse(await fsp.readFile(job.structurePath, 'utf8'))
        : buildClinicalTextStructure(clinicalText);
      const anchorPayload = JSON.parse(await fsp.readFile(job.anchorsPath, 'utf8'));
      const resolvedNbkId = clinicalStructure.nbk_id || anchorPayload.nbk_id || '';
      const resolvedChapterTitle = clinicalStructure.chapter_title || anchorPayload.chapter_title || job.stem;
      const { parsed, usage, rawOutput } = await callOpenAiCompatJson({
        baseUrl,
        apiKey,
        model,
        systemPrompt: CANDIDATE_DISCOVERY_PROMPT,
        userPayload: {
          chapter_title: resolvedChapterTitle,
          clinical_text: clinicalText
        },
        temperature: 0.1
      });

      const rawCandidates = Array.isArray(parsed?.features) ? parsed.features : [];
      const anchors = anchorPayload.anchors || [];
      const candidates = [];
      for (const candidate of rawCandidates) {
        const label = String(candidate?.label || '').trim();
        const status = String(candidate?.status || 'present').trim().toLowerCase() === 'excluded' ? 'excluded' : 'present';
        if (!label) continue;
        if (matchesExistingAnchor(label, anchors)) continue;
        const context = locateCandidateContext(clinicalStructure, label);
        candidates.push({
          label,
          status,
          source: `${providerName}_candidate`,
          source_sentence: context.source_sentence,
          paragraph: context.paragraph,
          section_id: context.section_id,
          section_heading: context.section_heading,
          paragraph_id: context.paragraph_id,
          paragraph_index: context.paragraph_index,
          paragraph_char_start: context.paragraph_char_start,
          paragraph_char_end: context.paragraph_char_end,
          sentence_id: context.sentence_id,
          sentence_index: context.sentence_index,
          sentence_char_start: context.sentence_char_start,
          sentence_char_end: context.sentence_char_end,
          match_char_start: context.match_char_start,
          match_char_end: context.match_char_end
        });
      }

      await writeJson(outputPath, {
        created_at: new Date().toISOString(),
        stage: 'candidates',
        provider: providerName,
        model,
        chapter_stem: job.stem,
        nbk_id: resolvedNbkId,
        chapter_title: resolvedChapterTitle,
        usage,
        raw_output: rawOutput,
        candidate_count: candidates.length,
        candidates
      });

      progress.results.push({
        stem: job.stem,
        candidateCount: candidates.length
      });
      progress.total_processed += 1;
      progress.last_index = index;
      progress.last_chapter_key = job.stem;
      await tracker.save(progress);
    } catch (error) {
      progress.errors.push({
        stem: job.stem,
        error: error.message || String(error)
      });
      progress.total_errors += 1;
      progress.last_index = index;
      progress.last_chapter_key = job.stem;
      await tracker.save(progress);
      console.error(`  ERROR: ${error.message}`);
    }
  }

  await writeJson(path.join(outputDir, 'candidates_summary.json'), {
    created_at: new Date().toISOString(),
    stage: 'candidates',
    provider: providerName,
    model,
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

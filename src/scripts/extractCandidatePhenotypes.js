import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import {
  buildClinicalTextStructure,
  callGeminiJson,
  createStageTracker,
  ensureDir,
  finalizePhenotypeCandidates,
  loadPolicyFile,
  parseArgs,
  sliceChapters,
  toBaseName,
  writeJson
} from '../lib/genereviewsPipeline.js';

const DEFAULTS = Object.freeze({
  policyJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/data/source-enrichment/genereviews-chapter-policy-template-20260329.json',
  clinicalDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-20260329/stage1_fetch',
  anchorsDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-20260329/stage2_anchors',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-20260329/stage3_candidates',
  model: 'gemini-2.5-flash',
  start: 0,
  limit: 20,
  thinkingBudget: 0
});

function resolveEnvValue(...names) {
  for (const name of names) {
    if (!name) continue;
    const value = process.env[name];
    if (value) return value;
  }
  return '';
}

const CANDIDATE_DISCOVERY_PROMPT = `You are a clinical genetics expert reading a GeneReviews chapter.

TASK: Find additional clinical phenotype features described in the text that are NOT already covered by the supplied anchor list. Include features that are implied but not explicitly named (e.g., "the child never walked independently" = inability to walk).

RULES:
1. Output one feature per line as a short plain English phrase
2. Mark each as "present" or "excluded":
   - present = described in patients with this disease
   - excluded = explicitly stated as NOT present or absent
3. Do NOT output:
   - Inheritance patterns (autosomal dominant, X-linked, etc.)
   - Gene names, variant descriptions, molecular findings
   - Laboratory methods, test procedures, assay names, imaging studies, or raw analyte names/measurements unless the text states a recognized clinical abnormality rather than just the test
   - Treatment responses, management recommendations, devices, feeding routes, educational supports, or interventions
   - Broad disease/disorder labels, gene syndromes, or future risk/complication statements unless the phenotype itself is clearly described as present now
   - Normal, preserved, intact, or unremarkable findings. Do not convert normal statements into excluded pseudo-features
   - Anything already captured by the anchor list, including broader/narrower restatements of the same finding
4. Use "excluded" ONLY when an abnormal clinical feature is explicitly stated as absent / not present / not reported / not a feature. Do NOT emit excluded items for normal tests, normal hearing/vision/cognition, or preserved function.
5. Prefer standard clinical phenotype names over descriptive wording when the mapping is obvious:
   - "widely spaced eyes" -> "hypertelorism"
   - "low-set posteriorly rotated ears" -> "low-set ears"
   - "never spoke" / "completely nonverbal" -> "absent speech"
   - "fragmented sleep" / "frequent nighttime awakenings" -> "sleep disturbance"
   - "no interest in other children" -> "social withdrawal"
   - "repetitive spinning of objects" -> "repetitive behaviors"
6. Do NOT output HPO IDs or attempt to map to any ontology
7. If a feature appears multiple times in the text, output it only once
8. Be specific, but prefer concise canonical phenotype phrases over long descriptive clauses
9. When uncertain whether something is a phenotype versus a lab/test/management/risk statement, omit it

OUTPUT FORMAT (JSON array, no other text, no markdown fences):
[
  { "label": "short phrase", "status": "present" },
  { "label": "other phrase", "status": "excluded" }
]`;

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const policyJson = flags.policy || DEFAULTS.policyJson;
  const clinicalDir = flags.clinical || DEFAULTS.clinicalDir;
  const anchorsDir = flags.anchors || DEFAULTS.anchorsDir;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const model = flags.model || DEFAULTS.model;
  const apiKey = flags.apiKey || resolveEnvValue(flags.apiKeyEnv, 'GOOGLE_API_KEY', 'GEMINI_API_KEY');
  const thinkingBudget = Number.parseInt(flags.thinkingBudget || `${DEFAULTS.thinkingBudget}`, 10);
  const start = Number.parseInt(flags.start || `${DEFAULTS.start}`, 10) || 0;
  const limit = Number.parseInt(flags.limit || `${DEFAULTS.limit}`, 10) || DEFAULTS.limit;
  const noResume = Boolean(flags.noResume);
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is required.');
  }
  await ensureDir(outputDir);

  const { chapters } = await loadPolicyFile(policyJson);
  const slice = sliceChapters(chapters, start, limit);
  const tracker = createStageTracker(outputDir, 'candidates_progress.json');
  const progress = await tracker.load();

  for (let offset = 0; offset < slice.length; offset += 1) {
    const chapter = slice[offset];
    const absoluteIndex = start + offset;
    const fileStem = chapter.nbkId || toBaseName(chapter, `chapter_${absoluteIndex + 1}`);
    const clinicalPath = path.join(clinicalDir, `${fileStem}_clinical_text.txt`);
    const structurePath = path.join(clinicalDir, `${fileStem}_clinical_structure.json`);
    const anchorsPath = path.join(anchorsDir, `${fileStem}_anchors.json`);
    const outputPath = path.join(outputDir, `${fileStem}_candidates.json`);
    console.log(`[${absoluteIndex + 1}/${chapters.length}] ${chapter.chapterTitle || chapter.chapterKey}`);

    try {
      if (!fs.existsSync(clinicalPath)) {
        throw new Error(`Missing clinical text: ${clinicalPath}`);
      }
      if (!fs.existsSync(anchorsPath)) {
        throw new Error(`Missing anchors: ${anchorsPath}`);
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

      const clinicalText = await fsp.readFile(clinicalPath, 'utf8');
      const clinicalStructure = fs.existsSync(structurePath)
        ? JSON.parse(await fsp.readFile(structurePath, 'utf8'))
        : buildClinicalTextStructure(clinicalText);
      const anchorPayload = JSON.parse(await fsp.readFile(anchorsPath, 'utf8'));
      const resolvedNbkId = clinicalStructure.nbk_id || anchorPayload.nbk_id || chapter.nbkId || '';
      const resolvedChapterTitle = clinicalStructure.chapter_title || anchorPayload.chapter_title || chapter.chapterTitle || '';
      const existingAnchors = (anchorPayload.anchors || []).map((anchor) => ({
        hpo_label: anchor.hpo_label,
        match_texts: [...new Set((anchor.occurrences || []).map((occurrence) => occurrence.match_text).filter(Boolean))]
      }));
      const { parsed, usage, rawOutput } = await callGeminiJson({
        apiKey,
        model,
        systemPrompt: CANDIDATE_DISCOVERY_PROMPT,
        userPayload: {
          chapter_title: resolvedChapterTitle || chapter.chapterKey,
          existing_anchors: existingAnchors,
          clinical_text: clinicalText
        },
        temperature: 0.1,
        thinkingBudget
      });
      const rawCandidates = Array.isArray(parsed) ? parsed : [];
      const anchors = anchorPayload.anchors || [];
      const { candidates, rejectedCandidates } = finalizePhenotypeCandidates(rawCandidates, anchors, clinicalStructure, 'llm_candidate');

      await writeJson(outputPath, {
        created_at: new Date().toISOString(),
        stage: 'candidates',
        chapter_key: chapter.chapterKey,
        nbk_id: resolvedNbkId,
        chapter_title: resolvedChapterTitle,
        model,
        usage,
        raw_output: rawOutput,
        raw_candidate_count: rawCandidates.length,
        candidate_count: candidates.length,
        rejected_candidate_count: rejectedCandidates.length,
        rejected_candidates: rejectedCandidates,
        candidates
      });

      progress.results.push({
        chapterKey: chapter.chapterKey,
        nbkId: resolvedNbkId,
        candidateCount: candidates.length
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

  await writeJson(path.join(outputDir, 'candidates_summary.json'), {
    created_at: new Date().toISOString(),
    stage: 'candidates',
    provider: 'gemini',
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

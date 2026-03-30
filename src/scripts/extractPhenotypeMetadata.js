import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import {
  callOpenAiCompatJson,
  callGeminiJson,
  createStageTracker,
  ensureDir,
  extractLocalMatchWindow,
  extractScopedFrequency,
  extractScopedOnset,
  loadPolicyFile,
  normalizeText,
  parseArgs,
  pickRichest,
  sliceChapters,
  splitSentences,
  toBaseName,
  writeJson
} from '../lib/genereviewsPipeline.js';

const DEFAULTS = Object.freeze({
  policyJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/data/source-enrichment/genereviews-chapter-policy-template-20260329.json',
  anchorsDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-20260329/stage2_anchors',
  mappedDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-20260329/stage4_mapped_candidates',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-20260329/stage5_enriched',
  provider: 'medgemma',
  model: 'gemini-2.5-flash',
  medgemmaModel: 'google/medgemma-27b-text-it',
  start: 0,
  limit: 20,
  thinkingBudget: 0,
  metadataBatchSize: 25
});

const METADATA_FALLBACK_PROMPT = `For each phenotype feature below, extract frequency, onset, severity, subtype, progression, and treatment_response only if the metadata clearly applies to that exact feature label.

Use the local_context first. If the local_context is insufficient, you may consult the source_sentence. If the sentence describes multiple findings and you cannot safely attach the metadata to the named feature, return null. Do not guess or infer disease-wide metadata for one feature.

OUTPUT (JSON array, same order, no other text):
[
  {
    "frequency": "85%" or null,
    "onset": "infantile" or null,
    "severity": "severe" or null,
    "subtype": "infantile spasms" or null,
    "progression": "progressive" or null,
    "treatment_response": "drug-resistant" or null
  }
]`;

const MEDGEMMA_METADATA_PROMPT = `You are an expert medical geneticist and clinical data abstractor.

Return EXACTLY one valid JSON object and nothing else.
Do not use markdown fences.
Do not add commentary.
Use only the provided text.
Do not infer beyond the text.
If a field is not explicitly stated, return null.
Copy the exact supporting sentence from the provided text for every evidence field.
If you cannot copy an exact supporting sentence, return null for that field and its evidence.
Distinguish disease-level management from phenotype-specific treatment response.
Distinguish disease-level progression from phenotype-specific progression.
Keep percentages as percentages, not decimals.`;

const MEDGEMMA_PLACEHOLDER_EVIDENCE = new Set(['text', 'sentence', 'source sentence', 'provided text', 'the text']);
const METADATA_CONTEXT_KEYWORDS = [
  'progress',
  'worsen',
  'improv',
  'responsive',
  'resistant',
  'therapy',
  'treatment',
  '%',
  'infancy',
  'childhood',
  'adult',
  'congenital',
  'neonatal'
];

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

async function callMetadataFallbackWithRetry({ apiKey, model, userPayload, thinkingBudget }) {
  for (;;) {
    try {
      return await callGeminiJson({
        apiKey,
        model,
        systemPrompt: METADATA_FALLBACK_PROMPT,
        userPayload,
        temperature: 0,
        thinkingBudget
      });
    } catch (error) {
      if (!isQuotaError(error)) throw error;
      const retryDelayMs = parseRetryDelayMs(error);
      console.warn(`[extractPhenotypeMetadata] quota backoff ${retryDelayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
}

async function callMedGemmaMetadataWithRetry({ baseUrl, apiKey, model, userPayload }) {
  for (;;) {
    try {
      return await callOpenAiCompatJson({
        baseUrl,
        apiKey,
        model,
        systemPrompt: MEDGEMMA_METADATA_PROMPT,
        userPayload,
        temperature: 0,
        extraBody: {
          max_tokens: 512
        }
      });
    } catch (error) {
      if (!isQuotaError(error)) throw error;
      const retryDelayMs = parseRetryDelayMs(error);
      console.warn(`[extractPhenotypeMetadata] medgemma quota backoff ${retryDelayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
}

function uniqueSentences(values) {
  const seen = new Set();
  const ordered = [];
  for (const value of values) {
    const trimmed = String(value || '').trim();
    if (!trimmed) continue;
    const normalized = normalizeText(trimmed);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    ordered.push(trimmed);
  }
  return ordered;
}

function buildMedGemmaContext(feature) {
  const sourceSentence = String(feature.source_sentence || '').trim();
  const paragraphSentences = splitSentences(feature.paragraph || '');
  const normalizedMatch = normalizeText(feature.match_text || feature.hpo_label || '');
  const scored = paragraphSentences
    .map((sentence) => {
      const normalizedSentence = normalizeText(sentence);
      const hasMatch = normalizedMatch && normalizedSentence.includes(normalizedMatch);
      const hasKeyword = METADATA_CONTEXT_KEYWORDS.some((keyword) => normalizedSentence.includes(keyword));
      return {
        sentence,
        score: (hasMatch ? 2 : 0) + (hasKeyword ? 1 : 0)
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  return uniqueSentences([sourceSentence, ...scored.map((entry) => entry.sentence)]).slice(0, 3);
}

function hasValidEvidenceSentence(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return false;
  if (MEDGEMMA_PLACEHOLDER_EVIDENCE.has(normalizeText(trimmed))) return false;
  return /[.!?]$/.test(trimmed);
}

function applyEvidenceBackedFrequency(target, llm) {
  if (target.frequency_value) return;
  if (!hasValidEvidenceSentence(llm.evidence_frequency)) return;
  const parsed = extractScopedFrequency(llm.evidence_frequency, target.match_text || target.hpo_label);
  if (!parsed.frequency_value) return;
  target.frequency_value = parsed.frequency_value;
  target.frequency_raw = llm.frequency_raw || parsed.frequency_raw;
  target.frequency_trust = 'medium';
  target.frequency_evidence = llm.evidence_frequency;
}

function applyEvidenceBackedOnset(target, llm) {
  if (target.onset_hpo_id || target.onset_raw) return;
  if (!hasValidEvidenceSentence(llm.evidence_onset)) return;
  const parsed = extractScopedOnset(llm.evidence_onset, target.match_text || target.hpo_label);
  if (parsed.onset_hpo_id || llm.onset_raw || llm.onset_normalized) {
    target.onset_hpo_id = parsed.onset_hpo_id || null;
    target.onset_label = parsed.onset_label || llm.onset_normalized || llm.onset_raw || null;
    target.onset_raw = llm.onset_raw || parsed.onset_raw || null;
    target.onset_trust = 'medium';
    target.onset_evidence = llm.evidence_onset;
  }
}

function applyEvidenceBackedFreeText(target, field, evidenceField, value, evidence, trust) {
  if (!value || !hasValidEvidenceSentence(evidence)) return;
  target[field] = value;
  target[evidenceField] = evidence;
  target[`${field.replace(/_raw$/, '')}_trust`] = trust;
}

function mergeSourceFeatures(anchorPayload, mappedPayload) {
  const features = [];
  for (const anchor of anchorPayload.anchors || []) {
    const occurrence = (anchor.occurrences || [])[0] || {};
    features.push({
      hpo_id: anchor.hpo_id,
      hpo_label: anchor.hpo_label,
      status: 'present',
      anchor_source: anchor.match_types?.includes('exact_label') ? 'graph_exact_anchor' : 'graph_alias_anchor',
      hpo_mapping_trust: 'high',
      source_sentence: occurrence.sentence || '',
      paragraph: occurrence.paragraph || '',
      match_text: occurrence.match_text || ''
    });
  }
  for (const candidate of mappedPayload.mapped_candidates || []) {
    if (!candidate.mapped_hpo_id) continue;
    features.push({
      hpo_id: candidate.mapped_hpo_id,
      hpo_label: candidate.mapped_hpo_label,
      status: candidate.status === 'excluded' ? 'excluded' : 'present',
      anchor_source: 'llm_candidate',
      hpo_mapping_trust: candidate.hpo_mapping_trust,
      source_sentence: candidate.source_sentence || '',
      paragraph: candidate.paragraph || '',
      match_text: candidate.label || ''
    });
  }
  return features;
}

function applyDeterministicMetadata(feature) {
  const localContext = extractLocalMatchWindow(feature.source_sentence || feature.paragraph || '', feature.match_text || feature.hpo_label);
  const deterministicText = localContext || feature.source_sentence || '';
  const frequency = extractScopedFrequency(deterministicText, feature.match_text || feature.hpo_label);
  const onset = extractScopedOnset(deterministicText, feature.match_text || feature.hpo_label);
  return {
    ...feature,
    local_context: localContext,
    ...frequency,
    ...onset,
    severity_raw: null,
    severity_trust: null,
    subtype_raw: null,
    progression_raw: null,
    progression_evidence: null,
    progression_trust: null,
    treatment_response_raw: null,
    treatment_response_evidence: null,
    treatment_response_trust: null,
    frequency_evidence: null,
    onset_evidence: null
  };
}

function hasFrequencyEvidence(text, matchText) {
  return Boolean(extractScopedFrequency(text, matchText).frequency_value);
}

function hasOnsetEvidence(text, matchText) {
  return Boolean(extractScopedOnset(text, matchText).onset_hpo_id);
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const policyJson = flags.policy || DEFAULTS.policyJson;
  const anchorsDir = flags.anchors || DEFAULTS.anchorsDir;
  const mappedDir = flags.mapped || DEFAULTS.mappedDir;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const provider = String(
    flags.provider ||
      process.env.GENEREVIEWS_METADATA_PROVIDER ||
      (process.env.MEDGEMMA_BASE_URL || process.env.HUGGINGFACE_BASE_URL ? DEFAULTS.provider : 'gemini')
  ).toLowerCase();
  const model = flags.model || DEFAULTS.model;
  const medgemmaModel = flags.medgemmaModel || process.env.MEDGEMMA_MODEL || DEFAULTS.medgemmaModel;
  const medgemmaBaseUrl = flags.baseUrl || process.env.MEDGEMMA_BASE_URL || process.env.HUGGINGFACE_BASE_URL || '';
  const geminiApiKey = flags.apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';
  const medgemmaApiKey = flags.medgemmaApiKey || process.env.MEDGEMMA_API_KEY || process.env.HUGGINGFACE_API_KEY || '';
  const thinkingBudget = Number.parseInt(flags.thinkingBudget || `${DEFAULTS.thinkingBudget}`, 10);
  const metadataBatchSize = Number.parseInt(flags.metadataBatchSize || `${DEFAULTS.metadataBatchSize}`, 10) || DEFAULTS.metadataBatchSize;
  const start = Number.parseInt(flags.start || `${DEFAULTS.start}`, 10) || 0;
  const limit = Number.parseInt(flags.limit || `${DEFAULTS.limit}`, 10) || DEFAULTS.limit;
  const noResume = Boolean(flags.noResume);
  if (provider === 'gemini' && !geminiApiKey) throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is required.');
  if (provider === 'medgemma' && (!medgemmaBaseUrl || !medgemmaApiKey)) {
    throw new Error('MEDGEMMA_BASE_URL/HUGGINGFACE_BASE_URL and MEDGEMMA_API_KEY/HUGGINGFACE_API_KEY are required.');
  }
  await ensureDir(outputDir);

  const { chapters } = await loadPolicyFile(policyJson);
  const slice = sliceChapters(chapters, start, limit);
  const tracker = createStageTracker(outputDir, 'metadata_progress.json');
  const progress = await tracker.load();

  for (let offset = 0; offset < slice.length; offset += 1) {
    const chapter = slice[offset];
    const absoluteIndex = start + offset;
    const fileStem = chapter.nbkId || toBaseName(chapter, `chapter_${absoluteIndex + 1}`);
    const anchorsPath = path.join(anchorsDir, `${fileStem}_anchors.json`);
    const mappedPath = path.join(mappedDir, `${fileStem}_mapped_candidates.json`);
    const outputPath = path.join(outputDir, `${fileStem}_enriched.json`);
    console.log(`[${absoluteIndex + 1}/${chapters.length}] ${chapter.chapterTitle || chapter.chapterKey}`);

    try {
      if (!fs.existsSync(anchorsPath)) throw new Error(`Missing anchors: ${anchorsPath}`);
      if (!fs.existsSync(mappedPath)) throw new Error(`Missing mapped candidates: ${mappedPath}`);
      if (!noResume && fs.existsSync(outputPath)) {
        progress.results.push({ chapterKey: chapter.chapterKey, nbkId: chapter.nbkId || '', resumed: true });
        progress.total_processed += 1;
        progress.last_index = absoluteIndex;
        progress.last_chapter_key = chapter.chapterKey;
        await tracker.save(progress);
        continue;
      }

      const anchorPayload = JSON.parse(await fsp.readFile(anchorsPath, 'utf8'));
      const mappedPayload = JSON.parse(await fsp.readFile(mappedPath, 'utf8'));
      const merged = mergeSourceFeatures(anchorPayload, mappedPayload).map(applyDeterministicMetadata);
      const fallbackTargets =
        provider === 'medgemma'
          ? merged
              .map((feature, featureIndex) => ({
                featureIndex,
                feature,
                text: buildMedGemmaContext(feature)
              }))
              .filter(({ text }) => text.length)
              .map(({ featureIndex, feature, text }) => ({
                featureIndex,
                hpo_id: feature.hpo_id,
                label: feature.hpo_label,
                match_text: feature.match_text || feature.hpo_label,
                source_sentence: feature.source_sentence || '',
                text
              }))
          : merged
              .map((feature, featureIndex) => ({
                featureIndex,
                feature
              }))
              .filter(({ feature }) => (!feature.frequency_value || !feature.onset_hpo_id) && feature.source_sentence)
              .map(({ featureIndex, feature }) => ({
                featureIndex,
                hpo_id: feature.hpo_id,
                label: feature.hpo_label,
                match_text: feature.match_text || feature.hpo_label,
                local_context: feature.local_context || '',
                source_sentence: feature.source_sentence || ''
              }));

      if (fallbackTargets.length) {
        if (provider === 'medgemma') {
          for (const targetInfo of fallbackTargets) {
            const target = merged[targetInfo.featureIndex];
            if (!target) continue;
            const { parsed } = await callMedGemmaMetadataWithRetry({
              baseUrl: medgemmaBaseUrl,
              apiKey: medgemmaApiKey,
              model: medgemmaModel,
              userPayload: {
                disease_name: chapter.chapterTitle || chapter.chapterKey,
                phenotype_label: target.hpo_label,
                text: targetInfo.text,
                required_output_keys: [
                  'phenotype_label',
                  'frequency_raw',
                  'frequency_normalized',
                  'onset_raw',
                  'onset_normalized',
                  'progression_raw',
                  'treatment_response_raw',
                  'evidence_frequency',
                  'evidence_onset',
                  'evidence_progression',
                  'evidence_treatment_response'
                ]
              }
            });
            const llm = parsed && typeof parsed === 'object' ? parsed : {};
            applyEvidenceBackedFrequency(target, llm);
            applyEvidenceBackedOnset(target, llm);
            applyEvidenceBackedFreeText(
              target,
              'progression_raw',
              'progression_evidence',
              llm.progression_raw,
              llm.evidence_progression,
              'low'
            );
            applyEvidenceBackedFreeText(
              target,
              'treatment_response_raw',
              'treatment_response_evidence',
              llm.treatment_response_raw,
              llm.evidence_treatment_response,
              'low'
            );
          }
        } else {
          for (let batchStart = 0; batchStart < fallbackTargets.length; batchStart += metadataBatchSize) {
            const batch = fallbackTargets.slice(batchStart, batchStart + metadataBatchSize);
            const { parsed } = await callMetadataFallbackWithRetry({
              apiKey: geminiApiKey,
              model,
              userPayload: batch,
              thinkingBudget
            });
            const rows = Array.isArray(parsed) ? parsed : [];
            for (let index = 0; index < batch.length; index += 1) {
              const target = merged[batch[index].featureIndex];
              const llm = rows[index] || {};
              if (!target) continue;
              const validationText = target.local_context || target.source_sentence || '';
              const validationMatchText = target.match_text || target.hpo_label;
              if (!target.frequency_value && llm.frequency && hasFrequencyEvidence(validationText, validationMatchText)) {
                target.frequency_value = llm.frequency;
                target.frequency_raw = llm.frequency;
                target.frequency_trust = 'medium';
              }
              if (!target.onset_hpo_id && llm.onset && hasOnsetEvidence(validationText, validationMatchText)) {
                target.onset_raw = llm.onset;
                target.onset_label = llm.onset;
                target.onset_trust = 'medium';
              }
              if (llm.severity) {
                target.severity_raw = llm.severity;
                target.severity_trust = 'medium';
              }
              if (llm.subtype) target.subtype_raw = llm.subtype;
              if (llm.progression) target.progression_raw = llm.progression;
              if (llm.treatment_response) target.treatment_response_raw = llm.treatment_response;
            }
          }
        }
      }

      const deduped = new Map();
      for (const feature of merged) {
        deduped.set(feature.hpo_id, pickRichest(deduped.get(feature.hpo_id), feature));
      }
      const features = [...deduped.values()].sort((left, right) => left.hpo_label.localeCompare(right.hpo_label));
      await writeJson(outputPath, {
        created_at: new Date().toISOString(),
        stage: 'enriched',
        chapter_key: chapter.chapterKey,
        nbk_id: chapter.nbkId || '',
        chapter_title: chapter.chapterTitle || '',
        feature_count: features.length,
        metadata_provider: provider,
        metadata_fallback_count: fallbackTargets.length,
        features
      });

      progress.results.push({
        chapterKey: chapter.chapterKey,
        nbkId: chapter.nbkId || '',
        featureCount: features.length,
        metadataFallbackCount: fallbackTargets.length,
        frequencyCovered: features.filter((row) => row.frequency_value).length,
        onsetCovered: features.filter((row) => row.onset_hpo_id || row.onset_raw).length
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

  await writeJson(path.join(outputDir, 'metadata_summary.json'), {
    created_at: new Date().toISOString(),
    stage: 'metadata',
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

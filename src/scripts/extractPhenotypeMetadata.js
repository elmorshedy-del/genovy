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
  medgemmaBaseUrl: 'https://z2m4kqae0vudzx4y.us-east-1.aws.endpoints.huggingface.cloud',
  start: 0,
  limit: 20,
  thinkingBudget: 0,
  metadataBatchSize: 25,
  medgemmaReadyTimeoutMs: 5 * 60 * 1000,
  medgemmaReadyPollMs: 10 * 1000,
  medgemmaReadyProbeMaxTokens: 8
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
Only assign onset if the onset phrase clearly modifies the target phenotype itself.
If the sentence lists multiple phenotypes and the onset phrase clearly belongs to a different phenotype, return null for onset.
Do not use disease subtype adjectives or disorder names as phenotype onset.
Distinguish disease-level management from phenotype-specific treatment response.
Only fill treatment_response when the text explicitly describes response, resistance, or failure relative to a treatment or therapy.
Do not use prognosis, fertility compatibility, or untreated natural-history language as treatment_response.
Distinguish disease-level progression from phenotype-specific progression.
Keep percentages as percentages, not decimals.`;

const MEDGEMMA_BATCH_METADATA_PROMPT = `You are an expert medical geneticist and clinical data abstractor.

Return EXACTLY one valid JSON object and nothing else.
Do not use markdown fences.
Do not add commentary.
Use only the provided text for each item.
Do not infer beyond the text.
For every item, preserve input order.
If a field is not explicitly stated, return null.
Copy the exact supporting sentence from the provided text for every evidence field.
If you cannot copy an exact supporting sentence, return null for that field and its evidence.
Only assign onset if the onset phrase clearly modifies the target phenotype itself.
If the sentence describes multiple findings and the onset phrase clearly belongs to a different phenotype, return null for onset.
Do not use disease subtype adjectives or disorder names as phenotype onset.
Distinguish disease-level management from phenotype-specific treatment response.
Only fill treatment_response when the text explicitly describes response, resistance, or failure relative to a treatment or therapy.
Do not use prognosis, fertility compatibility, or untreated natural-history language as treatment_response.
Distinguish disease-level progression from phenotype-specific progression.
Keep percentages as percentages, not decimals.

Return JSON with this shape:
{
  "items": [
    {
      "phenotype_label": "exact input phenotype label",
      "frequency_raw": null,
      "frequency_normalized": null,
      "onset_raw": null,
      "onset_normalized": null,
      "progression_raw": null,
      "treatment_response_raw": null,
      "evidence_frequency": null,
      "evidence_onset": null,
      "evidence_progression": null,
      "evidence_treatment_response": null
    }
  ]
}`;

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

function resolveEnvValue(...names) {
  for (const name of names) {
    if (!name) continue;
    const value = process.env[name];
    if (value) return value;
  }
  return '';
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

function isTransientOpenAiCompatError(error) {
  const message = String(error?.message || '');
  return /\b(408|500|502|503|504)\b/.test(message) || /internal server error/i.test(message);
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

async function callMedGemmaJsonWithRetry({ baseUrl, apiKey, model, systemPrompt, userPayload, extraBody = {} }) {
  for (;;) {
    try {
      return await callOpenAiCompatJson({
        baseUrl,
        apiKey,
        model,
        systemPrompt,
        userPayload,
        temperature: 0,
        extraBody
      });
    } catch (error) {
      if (!isQuotaError(error) && !isTransientOpenAiCompatError(error)) throw error;
      const retryDelayMs = isQuotaError(error) ? parseRetryDelayMs(error) : 10000;
      console.warn(`[extractPhenotypeMetadata] medgemma retry backoff ${retryDelayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
}

function normalizeOpenAiCompatBaseUrl(baseUrl) {
  return String(baseUrl || '').replace(/\/+$/g, '');
}

function resolveOpenAiCompatChatUrl(baseUrl) {
  const normalizedBaseUrl = normalizeOpenAiCompatBaseUrl(baseUrl);
  if (normalizedBaseUrl.endsWith('/chat/completions')) return normalizedBaseUrl;
  if (normalizedBaseUrl.endsWith('/v1')) return `${normalizedBaseUrl}/chat/completions`;
  return `${normalizedBaseUrl}/v1/chat/completions`;
}

function resolveOpenAiCompatHealthUrl(baseUrl) {
  const normalizedBaseUrl = normalizeOpenAiCompatBaseUrl(baseUrl);
  if (normalizedBaseUrl.endsWith('/v1')) {
    return normalizedBaseUrl.slice(0, -3) + '/health';
  }
  if (normalizedBaseUrl.endsWith('/chat/completions')) {
    return normalizedBaseUrl.replace(/\/chat\/completions$/i, '/health');
  }
  return `${normalizedBaseUrl}/health`;
}

function isWarmupStatus(status) {
  return status === 400 || status === 401 || status === 403 || status === 404 || status === 429 || status === 503;
}

async function probeMedGemmaReady({ baseUrl, apiKey, model, maxTokens }) {
  const healthResponse = await fetch(resolveOpenAiCompatHealthUrl(baseUrl), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });
  const healthOk = healthResponse.ok;
  if (!healthOk) {
    return {
      ready: false,
      stage: 'health',
      status: healthResponse.status,
      detail: await healthResponse.text()
    };
  }

  const response = await fetch(resolveOpenAiCompatChatUrl(baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: 'Reply with exactly ok' }]
    })
  });
  const detail = await response.text();
  if (!response.ok) {
    return {
      ready: false,
      stage: 'chat',
      status: response.status,
      detail
    };
  }
  return {
    ready: true,
    stage: 'chat',
    status: response.status,
    detail
  };
}

async function waitForMedGemmaReady({
  baseUrl,
  apiKey,
  model,
  timeoutMs,
  pollMs,
  maxTokens
}) {
  const startedAt = Date.now();
  let lastProbe = null;
  while (Date.now() - startedAt < timeoutMs) {
    lastProbe = await probeMedGemmaReady({ baseUrl, apiKey, model, maxTokens });
    if (lastProbe.ready) return lastProbe;
    if (!isWarmupStatus(lastProbe.status)) {
      throw new Error(
        `MedGemma readiness probe failed at ${lastProbe.stage}: ${lastProbe.status} ${String(lastProbe.detail || '').slice(0, 300)}`
      );
    }
    console.warn(
      `[extractPhenotypeMetadata] medgemma warming (${lastProbe.stage} ${lastProbe.status}) waiting ${pollMs}ms`
    );
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
  throw new Error(
    `MedGemma did not become ready within ${timeoutMs}ms. Last probe: ${lastProbe?.stage || 'unknown'} ${lastProbe?.status || 'n/a'}`
  );
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

function resolveSentenceSpanWithinParagraph(target, sentence) {
  const rawSentence = String(sentence || '').trim();
  const paragraph = String(target.paragraph || '');
  if (!rawSentence || !paragraph || target.paragraph_char_start == null) {
    return { charStart: null, charEnd: null };
  }
  const sentenceIndex = paragraph.toLowerCase().indexOf(rawSentence.toLowerCase());
  if (sentenceIndex === -1) {
    return { charStart: null, charEnd: null };
  }
  const charStart = Number(target.paragraph_char_start) + sentenceIndex;
  return {
    charStart,
    charEnd: charStart + rawSentence.length
  };
}

function resolvePhraseSpanInSentence(target, sentence, phrases) {
  const rawSentence = String(sentence || '').trim();
  if (!rawSentence) {
    return { charStart: null, charEnd: null, matchedPhrase: '' };
  }
  const sentenceSpan = resolveSentenceSpanWithinParagraph(target, rawSentence);
  if (sentenceSpan.charStart == null) {
    return { charStart: null, charEnd: null, matchedPhrase: '' };
  }
  for (const phrase of phrases) {
    const rawPhrase = String(phrase || '').trim();
    if (!rawPhrase) continue;
    const phraseIndex = rawSentence.toLowerCase().indexOf(rawPhrase.toLowerCase());
    if (phraseIndex === -1) continue;
    const charStart = sentenceSpan.charStart + phraseIndex;
    return {
      charStart,
      charEnd: charStart + rawPhrase.length,
      matchedPhrase: rawPhrase
    };
  }
  return { charStart: null, charEnd: null, matchedPhrase: '' };
}

function maybePromoteEvidenceSentence(target, evidence) {
  const rawEvidence = String(evidence || '').trim();
  if (!hasValidEvidenceSentence(rawEvidence)) return;
  const phrases = uniqueSentences([target.match_text, target.hpo_label]);
  const phraseSpan = resolvePhraseSpanInSentence(target, rawEvidence, phrases);
  if (phraseSpan.charStart == null) return;
  const sentenceSpan = resolveSentenceSpanWithinParagraph(target, rawEvidence);
  if (sentenceSpan.charStart == null) return;
  target.source_sentence = rawEvidence;
  target.sentence_char_start = sentenceSpan.charStart;
  target.sentence_char_end = sentenceSpan.charEnd;
  target.match_char_start = phraseSpan.charStart;
  target.match_char_end = phraseSpan.charEnd;
  if (phraseSpan.matchedPhrase) {
    target.match_text = phraseSpan.matchedPhrase;
  }
}

function applyEvidenceBackedFrequency(target, llm) {
  if (target.frequency_value) return;
  if (!hasValidEvidenceSentence(llm.evidence_frequency)) return;
  maybePromoteEvidenceSentence(target, llm.evidence_frequency);
  const parsed = extractScopedFrequency(llm.evidence_frequency, target.match_text || target.hpo_label);
  if (!parsed.frequency_value) return;
  target.frequency_value = parsed.frequency_value;
  target.frequency_raw = llm.frequency_raw || parsed.frequency_raw;
  target.frequency_trust = 'medium';
  target.frequency_evidence = llm.evidence_frequency;
  const span = resolveFieldValueSpan(target, target.frequency_raw || target.frequency_value, llm.evidence_frequency);
  target.frequency_char_start = span.charStart;
  target.frequency_char_end = span.charEnd;
}

function applyEvidenceBackedOnset(target, llm) {
  if (target.onset_hpo_id || target.onset_raw) return;
  if (!hasValidEvidenceSentence(llm.evidence_onset)) return;
  maybePromoteEvidenceSentence(target, llm.evidence_onset);
  const parsed = extractScopedOnset(llm.evidence_onset, target.match_text || target.hpo_label);
  if (parsed.onset_hpo_id || llm.onset_raw || llm.onset_normalized) {
    target.onset_hpo_id = parsed.onset_hpo_id || null;
    target.onset_label = parsed.onset_label || llm.onset_normalized || llm.onset_raw || null;
    target.onset_raw = llm.onset_raw || parsed.onset_raw || null;
    target.onset_trust = 'medium';
    target.onset_evidence = llm.evidence_onset;
    const span = resolveFieldValueSpan(target, target.onset_raw || target.onset_label, llm.evidence_onset);
    target.onset_char_start = span.charStart;
    target.onset_char_end = span.charEnd;
  }
}

function resolveFieldValueSpan(target, value, evidence) {
  const rawValue = String(value || '').trim();
  const rawEvidence = String(evidence || '').trim();
  if (!rawValue || !rawEvidence) {
    return { charStart: null, charEnd: null };
  }

  const sourceSentence = String(target.source_sentence || '');
  if (sourceSentence && target.sentence_char_start != null) {
    const evidenceIndex = sourceSentence.toLowerCase().indexOf(rawEvidence.toLowerCase());
    const valueIndex = rawEvidence.toLowerCase().indexOf(rawValue.toLowerCase());
    if (evidenceIndex !== -1 && valueIndex !== -1) {
      const charStart = Number(target.sentence_char_start) + evidenceIndex + valueIndex;
      return {
        charStart,
        charEnd: charStart + rawValue.length
      };
    }
  }

  const paragraph = String(target.paragraph || '');
  if (paragraph && target.paragraph_char_start != null) {
    const evidenceIndex = paragraph.toLowerCase().indexOf(rawEvidence.toLowerCase());
    const valueIndex = rawEvidence.toLowerCase().indexOf(rawValue.toLowerCase());
    if (evidenceIndex !== -1 && valueIndex !== -1) {
      const charStart = Number(target.paragraph_char_start) + evidenceIndex + valueIndex;
      return {
        charStart,
        charEnd: charStart + rawValue.length
      };
    }
  }

  return { charStart: null, charEnd: null };
}

function applyEvidenceBackedFreeText(target, field, evidenceField, value, evidence, trust) {
  if (!value || !hasValidEvidenceSentence(evidence)) return;
  maybePromoteEvidenceSentence(target, evidence);
  target[field] = value;
  target[evidenceField] = evidence;
  target[`${field.replace(/_raw$/, '')}_trust`] = trust;
  const span = resolveFieldValueSpan(target, value, evidence);
  target[`${field.replace(/_raw$/, '')}_char_start`] = span.charStart;
  target[`${field.replace(/_raw$/, '')}_char_end`] = span.charEnd;
}

function buildFeatureKey(feature) {
  return `${feature.hpo_id}::${feature.status || 'present'}`;
}

function pickDeterministicEvidence(sourceSentence, matchText, extractor, extractedValueKey, extractedValue) {
  if (!extractedValue) return null;
  const sentence = String(sourceSentence || '').trim();
  if (!sentence) return null;
  const reExtracted = extractor(sentence, matchText);
  return reExtracted?.[extractedValueKey] === extractedValue ? sentence : null;
}

function mergeSourceFeatures(anchorPayload, mappedPayload) {
  const features = [];
  for (const anchor of anchorPayload.anchors || []) {
    const occurrence = (anchor.occurrences || [])[0] || {};
    features.push({
      hpo_id: anchor.hpo_id,
      hpo_label: anchor.hpo_label,
      status: anchor.status === 'excluded' ? 'excluded' : 'present',
      anchor_source: anchor.match_types?.includes('exact_label') ? 'graph_exact_anchor' : 'graph_alias_anchor',
      hpo_mapping_trust: 'high',
      source_sentence: occurrence.sentence || '',
      paragraph: occurrence.paragraph || '',
      match_text: occurrence.match_text || '',
      local_clinical_domains: occurrence.local_clinical_domains || [],
      section_id: occurrence.section_id || null,
      section_heading: occurrence.section_heading || null,
      paragraph_id: occurrence.paragraph_id || null,
      paragraph_index: occurrence.paragraph_index || null,
      paragraph_char_start: occurrence.paragraph_char_start ?? null,
      paragraph_char_end: occurrence.paragraph_char_end ?? null,
      sentence_id: occurrence.sentence_id || null,
      sentence_index: occurrence.sentence_index || null,
      sentence_char_start: occurrence.sentence_char_start ?? null,
      sentence_char_end: occurrence.sentence_char_end ?? null,
      match_char_start: occurrence.match_char_start ?? null,
      match_char_end: occurrence.match_char_end ?? null
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
      match_text: candidate.label || '',
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
      match_char_end: candidate.match_char_end ?? null
    });
  }
  return features;
}

function applyDeterministicMetadata(feature) {
  const localContext = extractLocalMatchWindow(feature.source_sentence || feature.paragraph || '', feature.match_text || feature.hpo_label);
  if (feature.status === 'excluded') {
    return {
      ...feature,
      local_context: localContext,
      frequency_value: null,
      frequency_raw: null,
      frequency_trust: 'not_applicable_excluded',
      frequency_evidence: null,
      frequency_char_start: null,
      frequency_char_end: null,
      onset_hpo_id: null,
      onset_label: null,
      onset_raw: null,
      onset_trust: 'not_applicable_excluded',
      onset_evidence: null,
      onset_char_start: null,
      onset_char_end: null,
      severity_raw: null,
      severity_trust: null,
      subtype_raw: null,
      progression_raw: null,
      progression_evidence: null,
      progression_char_start: null,
      progression_char_end: null,
      progression_trust: null,
      treatment_response_raw: null,
      treatment_response_evidence: null,
      treatment_response_char_start: null,
      treatment_response_char_end: null,
      treatment_response_trust: null
    };
  }
  const deterministicText = localContext || feature.source_sentence || '';
  const sourceSentenceFrequency = extractScopedFrequency(feature.source_sentence || '', feature.match_text || feature.hpo_label, {
    baseOffset: feature.sentence_char_start ?? 0
  });
  const localFrequency = !sourceSentenceFrequency.frequency_value
    ? extractScopedFrequency(deterministicText, feature.match_text || feature.hpo_label)
    : null;
  const frequency = sourceSentenceFrequency.frequency_value ? sourceSentenceFrequency : (localFrequency || sourceSentenceFrequency);
  const sourceSentenceOnset = extractScopedOnset(feature.source_sentence || '', feature.match_text || feature.hpo_label, {
    baseOffset: feature.sentence_char_start ?? 0
  });
  const localOnset = !sourceSentenceOnset.onset_hpo_id
    ? extractScopedOnset(deterministicText, feature.match_text || feature.hpo_label)
    : null;
  const onset = sourceSentenceOnset.onset_hpo_id ? sourceSentenceOnset : (localOnset || sourceSentenceOnset);
  const frequencyEvidence =
    pickDeterministicEvidence(
      feature.source_sentence,
      feature.match_text || feature.hpo_label,
      extractScopedFrequency,
      'frequency_value',
      frequency.frequency_value
    ) || (frequency.frequency_value ? deterministicText : null);
  const onsetEvidence =
    pickDeterministicEvidence(
      feature.source_sentence,
      feature.match_text || feature.hpo_label,
      extractScopedOnset,
      'onset_hpo_id',
      onset.onset_hpo_id
    ) || (onset.onset_hpo_id ? deterministicText : null);
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
    progression_char_start: null,
    progression_char_end: null,
    progression_trust: null,
    treatment_response_raw: null,
    treatment_response_evidence: null,
    treatment_response_char_start: null,
    treatment_response_char_end: null,
    treatment_response_trust: null,
    frequency_evidence: frequencyEvidence,
    onset_evidence: onsetEvidence
  };
}

function hasFrequencyEvidence(text, matchText) {
  return Boolean(extractScopedFrequency(text, matchText).frequency_value);
}

function hasOnsetEvidence(text, matchText) {
  return Boolean(extractScopedOnset(text, matchText).onset_hpo_id);
}

function buildMedGemmaBatchPayload(chapter, batch) {
  return {
    disease_name: chapter.chapterTitle || chapter.chapterKey,
    items: batch.map((targetInfo) => ({
      phenotype_label: targetInfo.label,
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
    }))
  };
}

function extractMedGemmaBatchRows(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.items)) return parsed.items;
  return [];
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
  const medgemmaBaseUrl =
    flags.baseUrl ||
    resolveEnvValue(flags.baseUrlEnv, 'MEDGEMMA_BASE_URL', 'HUGGINGFACE_BASE_URL') ||
    DEFAULTS.medgemmaBaseUrl;
  const geminiApiKey = flags.apiKey || resolveEnvValue(flags.apiKeyEnv, 'GOOGLE_API_KEY', 'GEMINI_API_KEY');
  const medgemmaApiKey =
    flags.medgemmaApiKey || resolveEnvValue(flags.medgemmaApiKeyEnv, 'MEDGEMMA_API_KEY', 'HUGGINGFACE_API_KEY');
  const thinkingBudget = Number.parseInt(flags.thinkingBudget || `${DEFAULTS.thinkingBudget}`, 10);
  const metadataBatchSize = Number.parseInt(flags.metadataBatchSize || `${DEFAULTS.metadataBatchSize}`, 10) || DEFAULTS.metadataBatchSize;
  const medgemmaReadyTimeoutMs =
    Number.parseInt(flags.medgemmaReadyTimeoutMs || `${DEFAULTS.medgemmaReadyTimeoutMs}`, 10) ||
    DEFAULTS.medgemmaReadyTimeoutMs;
  const medgemmaReadyPollMs =
    Number.parseInt(flags.medgemmaReadyPollMs || `${DEFAULTS.medgemmaReadyPollMs}`, 10) || DEFAULTS.medgemmaReadyPollMs;
  const medgemmaReadyProbeMaxTokens =
    Number.parseInt(flags.medgemmaReadyProbeMaxTokens || `${DEFAULTS.medgemmaReadyProbeMaxTokens}`, 10) ||
    DEFAULTS.medgemmaReadyProbeMaxTokens;
  const start = Number.parseInt(flags.start || `${DEFAULTS.start}`, 10) || 0;
  const limit = Number.parseInt(flags.limit || `${DEFAULTS.limit}`, 10) || DEFAULTS.limit;
  const noResume = Boolean(flags.noResume);
  if (provider === 'gemini' && !geminiApiKey) throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is required.');
  if (provider === 'medgemma' && (!medgemmaBaseUrl || !medgemmaApiKey)) {
    throw new Error('MEDGEMMA_BASE_URL/HUGGINGFACE_BASE_URL and MEDGEMMA_API_KEY/HUGGINGFACE_API_KEY are required.');
  }
  await ensureDir(outputDir);

  if (provider === 'medgemma') {
    await waitForMedGemmaReady({
      baseUrl: medgemmaBaseUrl,
      apiKey: medgemmaApiKey,
      model: medgemmaModel,
      timeoutMs: medgemmaReadyTimeoutMs,
      pollMs: medgemmaReadyPollMs,
      maxTokens: medgemmaReadyProbeMaxTokens
    });
  }

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
      const resolvedChapter = {
        ...chapter,
        nbkId: anchorPayload.nbk_id || mappedPayload.nbk_id || chapter.nbkId || '',
        chapterTitle: anchorPayload.chapter_title || mappedPayload.chapter_title || chapter.chapterTitle || ''
      };
      const merged = mergeSourceFeatures(anchorPayload, mappedPayload).map(applyDeterministicMetadata);
      const fallbackTargets =
        provider === 'medgemma'
          ? merged
              .map((feature, featureIndex) => ({
                featureIndex,
                feature,
                text: buildMedGemmaContext(feature)
              }))
              .filter(({ feature, text }) => feature.status !== 'excluded' && text.length)
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
              .filter(
                ({ feature }) =>
                  feature.status !== 'excluded' &&
                  (!feature.frequency_value || !feature.onset_hpo_id) &&
                  feature.source_sentence
              )
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
          for (let batchStart = 0; batchStart < fallbackTargets.length; batchStart += metadataBatchSize) {
            const batch = fallbackTargets.slice(batchStart, batchStart + metadataBatchSize);
            const { parsed } = await callMedGemmaJsonWithRetry({
              baseUrl: medgemmaBaseUrl,
              apiKey: medgemmaApiKey,
              model: medgemmaModel,
              systemPrompt: MEDGEMMA_BATCH_METADATA_PROMPT,
              userPayload: buildMedGemmaBatchPayload(resolvedChapter, batch),
              extraBody: {
                max_tokens: 512 * Math.max(1, batch.length)
              }
            });
            const rows = extractMedGemmaBatchRows(parsed);
            for (let index = 0; index < batch.length; index += 1) {
              const target = merged[batch[index].featureIndex];
              const llm = rows[index] && typeof rows[index] === 'object' ? rows[index] : {};
              if (!target) continue;
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
                target.frequency_char_start = null;
                target.frequency_char_end = null;
              }
              if (!target.onset_hpo_id && llm.onset && hasOnsetEvidence(validationText, validationMatchText)) {
                target.onset_raw = llm.onset;
                target.onset_label = llm.onset;
                target.onset_trust = 'medium';
                target.onset_char_start = null;
                target.onset_char_end = null;
              }
              if (llm.severity) {
                target.severity_raw = llm.severity;
                target.severity_trust = 'medium';
              }
              if (llm.subtype) target.subtype_raw = llm.subtype;
              if (llm.progression) {
                target.progression_raw = llm.progression;
                target.progression_char_start = null;
                target.progression_char_end = null;
              }
              if (llm.treatment_response) {
                target.treatment_response_raw = llm.treatment_response;
                target.treatment_response_char_start = null;
                target.treatment_response_char_end = null;
              }
            }
          }
        }
      }

      const deduped = new Map();
      for (const feature of merged) {
        const featureKey = buildFeatureKey(feature);
        deduped.set(featureKey, pickRichest(deduped.get(featureKey), feature));
      }
      const features = [...deduped.values()].sort((left, right) => left.hpo_label.localeCompare(right.hpo_label));
      await writeJson(outputPath, {
        created_at: new Date().toISOString(),
        stage: 'enriched',
        chapter_key: chapter.chapterKey,
        nbk_id: resolvedChapter.nbkId || '',
        chapter_title: resolvedChapter.chapterTitle || '',
        feature_count: features.length,
        metadata_provider: provider,
        metadata_model: provider === 'medgemma' ? medgemmaModel : model,
        metadata_fallback_count: fallbackTargets.length,
        features
      });

      progress.results.push({
        chapterKey: chapter.chapterKey,
        nbkId: resolvedChapter.nbkId || '',
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
    provider,
    model: provider === 'medgemma' ? medgemmaModel : model,
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

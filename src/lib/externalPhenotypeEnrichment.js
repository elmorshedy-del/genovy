import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { withClient } from '../db/pool.js';
import { loadPhenotypeBaseRows, normalizeText, readJson, writeJson } from './genereviewsPipeline.js';
import {
  deterministicallyRouteEnrichmentReviewResults,
  runSchemaGuardedEnrichmentReview
} from './enrichmentReviewer.js';

const execFileAsync = promisify(execFile);

const BIOLORD_HELPER =
  '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/mapCandidatesToHPOBioLORD.py';
const DEFAULT_BIOLORD_PYTHON = '/Users/ahmedelmorshedy/.cache/biolord/.venv/bin/python';
const BIOLORD_PYTHON =
  process.env.BIOLORD_PYTHON || (fs.existsSync(DEFAULT_BIOLORD_PYTHON) ? DEFAULT_BIOLORD_PYTHON : 'python3');
const DEFAULT_BIOLORD_MODEL = 'FremyCompany/BioLORD-2023';
const GOOGLE_HEALTHCARE_API_ROOT = 'https://healthcare.googleapis.com/v1';
const DEFAULT_GOOGLE_HEALTHCARE_LOCATION = 'us-central1';

function parseJsonLike(value, label) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  }
  throw new Error(`Expected ${label} to be a JSON object.`);
}

function coerceString(value) {
  const text = String(value || '').trim();
  return text || null;
}

function coerceArray(value) {
  return Array.isArray(value) ? value : [];
}

function coercePhenotypeRows(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.phenotype_rows)) return value.phenotype_rows;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

function inferEvidenceScope(row) {
  const explicit = coerceString(row?.evidence_scope || row?.evidenceScope);
  if (explicit) return explicit;
  if (coerceString(row?.sentence_id) || row?.sentence_char_start != null || row?.sentence_char_end != null) {
    return 'sentence';
  }
  if (coerceString(row?.paragraph_id) || row?.paragraph_char_start != null || row?.paragraph_char_end != null) {
    return 'paragraph';
  }
  if (coerceString(row?.section_id)) {
    return 'section';
  }
  return 'label_only';
}

function buildChapterRecord(payload) {
  const chapter = payload?.chapter || {};
  return {
    chapter_key:
      coerceString(chapter.chapter_key || payload.chapter_key || payload.chapterKey) ||
      coerceString(chapter.nbk_id || payload.nbk_id) ||
      coerceString(chapter.title || payload.chapter_title) ||
      'external_chapter',
    nbk_id: coerceString(chapter.nbk_id || payload.nbk_id),
    title: coerceString(chapter.title || payload.chapter_title),
    source_url: coerceString(chapter.source_url || payload.chapter_url || payload.provenance_url)
  };
}

function buildSourceLocation(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    section_id: coerceString(row.source_location?.section_id || row.section_id),
    section_heading: coerceString(row.source_location?.section_heading || row.section_heading),
    paragraph_id: coerceString(row.source_location?.paragraph_id || row.paragraph_id),
    paragraph_index:
      row.source_location?.paragraph_index != null
        ? row.source_location.paragraph_index
        : row.paragraph_index ?? null,
    sentence_id: coerceString(row.source_location?.sentence_id || row.sentence_id)
  };
}

function buildSourceSection(row) {
  if (!row || typeof row !== 'object') return null;
  return (
    coerceString(row.source_section || row.sourceSection) ||
    coerceString(row.source_location?.section_heading || row.section_heading) ||
    coerceString(row.source_location?.section_id || row.section_id)
  );
}

function groundedCandidateRows(payload, { includeRejected = false } = {}) {
  const grounded = coerceArray(payload?.grounded_candidates || payload?.candidates);
  const rejected = includeRejected ? coerceArray(payload?.rejected_candidates) : [];
  return [...grounded, ...rejected];
}

export function buildExternalCandidateSignature(candidate) {
  return [
    normalizeText(candidate?.label),
    normalizeText(candidate?.status || 'present'),
    normalizeText(candidate?.sentence_id),
    normalizeText(candidate?.paragraph_id),
    normalizeText(candidate?.section_id),
    normalizeText(candidate?.source_sentence)
  ].join('::');
}

export function deriveExternalMappingInputPath(inputPath, explicitOutput = '') {
  if (explicitOutput) return path.resolve(explicitOutput);
  const resolvedInput = path.resolve(inputPath);
  const baseName = path.basename(resolvedInput, path.extname(resolvedInput));
  const nextBase = baseName.endsWith('_grounded') ? `${baseName.slice(0, -9)}_mapping_input` : `${baseName}_mapping_input`;
  return path.join(path.dirname(resolvedInput), `${nextBase}.json`);
}

export function deriveExternalEnrichmentCasesPath(inputPath, explicitOutput = '') {
  if (explicitOutput) return path.resolve(explicitOutput);
  const resolvedInput = path.resolve(inputPath);
  const baseName = path.basename(resolvedInput, path.extname(resolvedInput));
  const nextBase = baseName.endsWith('_mapped') ? `${baseName.slice(0, -7)}_enrichment_cases` : `${baseName}_enrichment_cases`;
  return path.join(path.dirname(resolvedInput), `${nextBase}.json`);
}

export function deriveExternalMappedOutputPath(inputPath, explicitOutput = '') {
  if (explicitOutput) return path.resolve(explicitOutput);
  const resolvedInput = path.resolve(inputPath);
  const baseName = path.basename(resolvedInput, path.extname(resolvedInput));
  const nextBase = baseName.endsWith('_mapping_input') ? `${baseName.slice(0, -14)}_mapped` : `${baseName}_mapped`;
  return path.join(path.dirname(resolvedInput), `${nextBase}.json`);
}

export function deriveExternalReviewOutputPath(inputPath, explicitOutput = '') {
  if (explicitOutput) return path.resolve(explicitOutput);
  const resolvedInput = path.resolve(inputPath);
  const baseName = path.basename(resolvedInput, path.extname(resolvedInput));
  const nextBase = baseName.includes('_enrichment_cases')
    ? baseName.replace('_enrichment_cases', '_enrichment_review')
    : `${baseName}_review`;
  return path.join(path.dirname(resolvedInput), `${nextBase}.json`);
}

export function buildExternalMappingInputPayload(groundedPayload, options = {}) {
  const payload = parseJsonLike(groundedPayload, 'grounded payload');
  const chapter = buildChapterRecord(payload);
  const candidates = groundedCandidateRows(payload, {
    includeRejected: Boolean(options.includeRejected)
  }).map((row, index) => ({
    candidate_index: index,
    candidate_signature: buildExternalCandidateSignature(row),
    label: String(row.label || '').trim(),
    status: String(row.status || row.extraction_bucket || 'present').trim() || 'present',
    source: String(row.source || 'external_grounded_candidate').trim() || 'external_grounded_candidate',
    source_quote: String(row.source_quote || '').trim(),
    source_section: buildSourceSection(row),
    evidence_scope: inferEvidenceScope(row),
    source_location: buildSourceLocation(row),
    source_sentence: String(row.source_sentence || '').trim(),
    paragraph: String(row.paragraph || row.source_sentence || '').trim(),
    local_clinical_domains: coerceArray(row.local_clinical_domains),
    section_id: coerceString(row.section_id),
    section_heading: coerceString(row.section_heading),
    paragraph_id: coerceString(row.paragraph_id),
    paragraph_index: row.paragraph_index ?? null,
    paragraph_char_start: row.paragraph_char_start ?? null,
    paragraph_char_end: row.paragraph_char_end ?? null,
    sentence_id: coerceString(row.sentence_id),
    sentence_index: row.sentence_index ?? null,
    sentence_char_start: row.sentence_char_start ?? null,
    sentence_char_end: row.sentence_char_end ?? null,
    match_char_start: row.match_char_start ?? null,
    match_char_end: row.match_char_end ?? null,
    assertion_status_origin: coerceString(row.assertion_status_origin) || `external_${String(row.status || 'present').toLowerCase()}`,
    assertion_reason: coerceString(row.assertion_reason),
    assertion_evidence: String(row.source_quote || row.source_sentence || row.label || '').trim(),
    detail_types: coerceArray(row.detail_types),
    ancillary_evidence_types: coerceArray(row.ancillary_evidence_types),
    trajectory: row.trajectory || null,
    reason: coerceString(row.reason),
    verification_verdict: coerceString(row.verification_verdict),
    auto_accept_eligible: row.auto_accept_eligible ?? null,
    auto_accept_reasons: coerceArray(row.auto_accept_reasons),
    review_id: coerceString(row.review_id),
    review_href: coerceString(row.review_href)
  }));

  return {
    created_at: new Date().toISOString(),
    stage: 'external_grounded_mapping_input',
    source_stage: coerceString(payload.stage),
    chapter_key: chapter.chapter_key,
    nbk_id: chapter.nbk_id,
    chapter_title: chapter.title,
    chapter,
    candidate_count: candidates.length,
    candidates
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

export function buildExternalBioLordRequestPayload(mappingInputPayload) {
  const payload = parseJsonLike(mappingInputPayload, 'mapping input payload');
  return {
    chapters: [
      {
        chapter_key: payload.chapter_key || payload.chapter?.chapter_key || '',
        nbk_id: payload.nbk_id || payload.chapter?.nbk_id || '',
        chapter_title: payload.chapter_title || payload.chapter?.title || '',
        candidates: coerceArray(payload.candidates)
      }
    ]
  };
}

function buildExactPhenotypeLookup(phenotypeRows) {
  const lookup = new Map();
  for (const row of phenotypeRows) {
    const canonical = normalizeText(row?.canonical_label);
    if (canonical && !lookup.has(canonical)) {
      lookup.set(canonical, row);
    }
    for (const alias of coerceArray(row?.aliases)) {
      const aliasLabel = normalizeText(alias?.alias_label);
      if (aliasLabel && !lookup.has(aliasLabel)) {
        lookup.set(aliasLabel, row);
      }
    }
  }
  return lookup;
}

function buildPhenotypeRowsByCurie(phenotypeRows) {
  const lookup = new Map();
  for (const row of phenotypeRows) {
    const curie = coerceString(row?.canonical_curie);
    if (!curie || lookup.has(curie)) continue;
    lookup.set(curie, row);
  }
  return lookup;
}

function normalizeHpoVocabularyCode(code) {
  const match = String(code || '').trim().match(/^HPO\/(HP:\d+)$/i);
  return match ? match[1].toUpperCase() : null;
}

function tokenizeNormalizedText(value) {
  return normalizeText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean);
}

function computeTokenOverlap(left, right) {
  const leftTokens = new Set(tokenizeNormalizedText(left));
  const rightTokens = new Set(tokenizeNormalizedText(right));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  let shared = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) shared += 1;
  }
  return shared / Math.max(leftTokens.size, rightTokens.size);
}

function scoreGoogleHealthcareMention(candidate, mention) {
  const labelText = normalizeText(candidate?.label);
  const quoteText = normalizeText(candidate?.source_quote);
  const mentionText = normalizeText(mention?.text?.content);
  if (!mentionText) return { score: -1, overlap: 0 };

  const labelOverlap = computeTokenOverlap(labelText, mentionText);
  const quoteOverlap = computeTokenOverlap(quoteText, mentionText);
  const overlap = Math.max(labelOverlap, quoteOverlap);
  let score = Number(mention?.confidence || 0);

  if (labelText && mentionText === labelText) {
    score += 4;
  } else if (labelText && (labelText.includes(mentionText) || mentionText.includes(labelText))) {
    score += 2.5;
  }

  if (quoteText && mentionText && (quoteText.includes(mentionText) || mentionText.includes(quoteText))) {
    score += 1.25;
  }

  score += overlap * 2;
  return { score, overlap };
}

function trustFromGoogleHealthcareMatch(bestMatch) {
  if (!bestMatch || !Array.isArray(bestMatch.topMatches) || bestMatch.topMatches.length === 0) return 'reject';
  if (bestMatch.overlap >= 0.5 && bestMatch.confidence >= 0.6 && bestMatch.score >= 3.5) return 'high';
  if (bestMatch.overlap >= 0.34 && bestMatch.confidence >= 0.45 && bestMatch.score >= 2.25) return 'medium';
  return 'reject';
}

function buildGoogleHealthcareTopMatches(mention, entitiesById, phenotypeRowsByCurie) {
  const mentionConfidence = Number(mention?.confidence || 0);
  const topMatches = [];

  for (const linkedEntity of coerceArray(mention?.linkedEntities)) {
    const entity = entitiesById.get(String(linkedEntity?.entityId || '').trim());
    if (!entity) continue;
    for (const vocabularyCode of coerceArray(entity?.vocabularyCodes)) {
      const hpoId = normalizeHpoVocabularyCode(vocabularyCode);
      if (!hpoId) continue;
      const phenotypeRow = phenotypeRowsByCurie.get(hpoId);
      topMatches.push({
        hpo_id: hpoId,
        hpo_label: phenotypeRow?.canonical_label || entity?.preferredTerm || hpoId,
        score: mentionConfidence
      });
    }
  }

  const deduped = new Map();
  for (const match of topMatches) {
    const prior = deduped.get(match.hpo_id);
    if (!prior || Number(match.score || 0) > Number(prior.score || 0)) {
      deduped.set(match.hpo_id, match);
    }
  }

  return [...deduped.values()].sort((left, right) => Number(right.score || 0) - Number(left.score || 0));
}

function buildGoogleHealthcareResponseLookup(responseEntries) {
  const lookup = new Map();
  for (const entry of coerceArray(responseEntries)) {
    const documentContent = coerceString(entry?.document_content || entry?.documentContent);
    if (!documentContent) continue;
    lookup.set(documentContent, entry.response || entry.analyze_entities_response || {});
  }
  return lookup;
}

async function resolveGoogleCloudProject(options = {}) {
  const explicit =
    coerceString(options.googleCloudProject) ||
    coerceString(process.env.GOOGLE_CLOUD_PROJECT) ||
    coerceString(process.env.GCLOUD_PROJECT) ||
    coerceString(process.env.GOOGLE_PROJECT_ID);
  if (explicit) return explicit;

  const { stdout } = await execFileAsync('gcloud', ['config', 'get-value', 'project'], {
    maxBuffer: 1024 * 1024
  });
  const project = coerceString(stdout);
  if (!project) {
    throw new Error('Unable to resolve Google Cloud project for Google Healthcare NLP.');
  }
  return project;
}

async function resolveGoogleHealthcareNlpService(options = {}) {
  const explicit = coerceString(options.healthcareNlpService) || coerceString(process.env.GOOGLE_HEALTHCARE_NLP_SERVICE);
  if (explicit) return explicit;

  const project = await resolveGoogleCloudProject(options);
  const location =
    coerceString(options.googleCloudLocation) ||
    coerceString(process.env.GOOGLE_HEALTHCARE_LOCATION) ||
    coerceString(process.env.GOOGLE_CLOUD_LOCATION) ||
    DEFAULT_GOOGLE_HEALTHCARE_LOCATION;
  return `projects/${project}/locations/${location}/services/nlp`;
}

async function resolveGoogleAccessToken(options = {}) {
  const explicit =
    coerceString(options.googleAccessToken) ||
    coerceString(process.env.GOOGLE_CLOUD_ACCESS_TOKEN) ||
    coerceString(process.env.GOOGLE_HEALTHCARE_ACCESS_TOKEN);
  if (explicit) return explicit;

  const commandCandidates = [
    ['auth', 'print-access-token'],
    ['auth', 'application-default', 'print-access-token']
  ];

  for (const args of commandCandidates) {
    try {
      const { stdout } = await execFileAsync('gcloud', args, {
        maxBuffer: 1024 * 1024
      });
      const token = coerceString(stdout);
      if (token) return token;
    } catch {
      // try the next token source
    }
  }

  throw new Error('Unable to resolve a Google access token for Google Healthcare NLP.');
}

async function callGoogleHealthcareAnalyzeEntities({ accessToken, nlpService, documentContent }) {
  const response = await fetch(`${GOOGLE_HEALTHCARE_API_ROOT}/${nlpService}:analyzeEntities`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      documentContent,
      licensedVocabularies: [],
      alternativeOutputFormat: 'ALTERNATIVE_OUTPUT_FORMAT_UNSPECIFIED'
    })
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(`Google Healthcare API error ${response.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

function toExternalMappedPayload({ inputPayload, mappingProvider, embeddingModel, mappedCandidates }) {
  return {
    created_at: new Date().toISOString(),
    stage: 'external_mapped_candidates',
    chapter_key: inputPayload.chapter_key || inputPayload.chapter?.chapter_key || '',
    nbk_id: inputPayload.nbk_id || inputPayload.chapter?.nbk_id || '',
    chapter_title: inputPayload.chapter_title || inputPayload.chapter?.title || '',
    mapping_provider: mappingProvider,
    embedding_model: embeddingModel || null,
    candidate_count: mappedCandidates.length,
    mapped_candidates: mappedCandidates
  };
}

function mergeRow(left, right, mappedPayload) {
  return {
    ...left,
    label: right.label || left.label,
    status: right.status || left.status,
    source: right.source || left.source || 'external_grounded_candidate',
    source_sentence: right.source_sentence || left.source_sentence || '',
    source_section: buildSourceSection(right) || buildSourceSection(left),
    evidence_scope: coerceString(right.evidence_scope) || coerceString(left.evidence_scope),
    source_location: buildSourceLocation(right) || buildSourceLocation(left),
    paragraph: right.paragraph || left.paragraph || '',
    section_id: right.section_id ?? left.section_id ?? null,
    section_heading: right.section_heading ?? left.section_heading ?? null,
    paragraph_id: right.paragraph_id ?? left.paragraph_id ?? null,
    paragraph_index: right.paragraph_index ?? left.paragraph_index ?? null,
    paragraph_char_start: right.paragraph_char_start ?? left.paragraph_char_start ?? null,
    paragraph_char_end: right.paragraph_char_end ?? left.paragraph_char_end ?? null,
    sentence_id: right.sentence_id ?? left.sentence_id ?? null,
    sentence_index: right.sentence_index ?? left.sentence_index ?? null,
    sentence_char_start: right.sentence_char_start ?? left.sentence_char_start ?? null,
    sentence_char_end: right.sentence_char_end ?? left.sentence_char_end ?? null,
    match_char_start: right.match_char_start ?? left.match_char_start ?? null,
    match_char_end: right.match_char_end ?? left.match_char_end ?? null,
    top_matches: coerceArray(right.top_matches),
    mapped_hpo_id: coerceString(right.mapped_hpo_id),
    mapped_hpo_label: coerceString(right.mapped_hpo_label),
    hpo_mapping_trust: coerceString(right.hpo_mapping_trust),
    detail_types: coerceArray(right.detail_types).length ? coerceArray(right.detail_types) : coerceArray(left.detail_types),
    ancillary_evidence_types: coerceArray(right.ancillary_evidence_types).length
      ? coerceArray(right.ancillary_evidence_types)
      : coerceArray(left.ancillary_evidence_types),
    trajectory: right.trajectory || left.trajectory || null,
    reason: coerceString(right.reason) || coerceString(left.reason),
    mapping_provider: coerceString(mappedPayload.mapping_provider || mappedPayload.provider),
    embedding_model: coerceString(mappedPayload.embedding_model || mappedPayload.model)
  };
}

export function mergeExternalMappedCandidates(groundedPayload, mappedPayload) {
  const grounded = parseJsonLike(groundedPayload, 'grounded payload');
  const mapped = parseJsonLike(mappedPayload, 'mapped payload');
  const groundedRows = groundedCandidateRows(grounded);
  const mappedRows = coerceArray(mapped.mapped_candidates);

  if (!mappedRows.length) {
    return {
      created_at: new Date().toISOString(),
      stage: 'external_grounded_mapped_candidates',
      source_grounded_stage: coerceString(grounded.stage),
      source_mapping_stage: coerceString(mapped.stage),
      chapter: buildChapterRecord(grounded),
      candidate_count: 0,
      merge_strategy: 'empty',
      mapped_candidates: [],
      candidates: []
    };
  }

  if (groundedRows.length !== mappedRows.length) {
    throw new Error(
      `Grounded/mapped candidate count mismatch: grounded=${groundedRows.length} mapped=${mappedRows.length}`
    );
  }

  const signaturesAligned = mappedRows.every(
    (row, index) => buildExternalCandidateSignature(row) === buildExternalCandidateSignature(groundedRows[index])
  );

  let mergeStrategy = 'index';
  let mergedRows;

  if (signaturesAligned) {
    mergedRows = mappedRows.map((row, index) => mergeRow(groundedRows[index], row, mapped));
  } else {
    mergeStrategy = 'signature';
    const queuesBySignature = new Map();
    for (const row of groundedRows) {
      const signature = buildExternalCandidateSignature(row);
      const bucket = queuesBySignature.get(signature) || [];
      bucket.push(row);
      queuesBySignature.set(signature, bucket);
    }

    mergedRows = mappedRows.map((row) => {
      const signature = buildExternalCandidateSignature(row);
      const bucket = queuesBySignature.get(signature) || [];
      const groundedMatch = bucket.shift();
      if (!groundedMatch) {
        throw new Error(`Unable to merge mapped candidate by signature: ${signature}`);
      }
      return mergeRow(groundedMatch, row, mapped);
    });
  }

  return {
    created_at: new Date().toISOString(),
    stage: 'external_grounded_mapped_candidates',
    source_grounded_stage: coerceString(grounded.stage),
    source_mapping_stage: coerceString(mapped.stage),
    chapter: buildChapterRecord(grounded),
    candidate_count: mergedRows.length,
    merge_strategy: mergeStrategy,
    mapped_candidates: mergedRows,
    candidates: mergedRows
  };
}

export function buildExternalAnchorContext(anchorsPayload, candidate) {
  const payload = parseJsonLike(anchorsPayload || {}, 'anchors payload');
  const sameSentence = [];
  const sameParagraph = [];

  for (const anchor of coerceArray(payload.anchors)) {
    for (const occurrence of coerceArray(anchor.occurrences)) {
      const row = {
        hpo_id: anchor.hpo_id,
        hpo_label: anchor.hpo_label,
        match_text: occurrence.match_text,
        sentence_id: coerceString(occurrence.sentence_id),
        paragraph_id: coerceString(occurrence.paragraph_id)
      };

      if (row.sentence_id && row.sentence_id === candidate.sentence_id) {
        sameSentence.push(row);
        continue;
      }

      if (row.paragraph_id && candidate.paragraph_id && row.paragraph_id === candidate.paragraph_id) {
        sameParagraph.push(row);
      }
    }
  }

  const dedupe = (rows) => {
    const seen = new Set();
    return rows.filter((row) => {
      const key = `${row.hpo_id}::${normalizeText(row.match_text)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return {
    same_sentence_anchors: dedupe(sameSentence).slice(0, 12),
    same_paragraph_anchors: dedupe(sameParagraph).slice(0, 12)
  };
}

export function buildExternalEnrichmentCases(mergedPayload, anchorsPayload, options = {}) {
  const payload = parseJsonLike(mergedPayload, 'merged payload');
  const chapter = buildChapterRecord(payload);
  const includeExcluded = Boolean(options.includeExcluded);
  const includeUncertain = options.includeUncertain !== false;
  const rows = coerceArray(payload.mapped_candidates || payload.candidates).filter((row) => {
    const status = String(row.status || 'present').toLowerCase();
    if (status === 'excluded' && !includeExcluded) return false;
    if (status === 'uncertain' && !includeUncertain) return false;
    return true;
  });

  const cases = rows.map((row, index) => ({
    case_index: index,
    candidate: {
      label: String(row.label || '').trim(),
      status: String(row.status || 'present').trim() || 'present',
      source_quote: String(row.source_quote || '').trim(),
      source_sentence: String(row.source_sentence || '').trim(),
      source_section: buildSourceSection(row),
      evidence_scope: inferEvidenceScope(row),
      source_location: buildSourceLocation(row),
      detail_types: coerceArray(row.detail_types),
      ancillary_evidence_types: coerceArray(row.ancillary_evidence_types),
      trajectory: row.trajectory || null,
      reason: coerceString(row.reason),
      sentence_id: coerceString(row.sentence_id),
      sentence_index: row.sentence_index ?? null,
      sentence_char_start: row.sentence_char_start ?? null,
      sentence_char_end: row.sentence_char_end ?? null,
      paragraph_id: coerceString(row.paragraph_id),
      paragraph_index: row.paragraph_index ?? null,
      paragraph_char_start: row.paragraph_char_start ?? null,
      paragraph_char_end: row.paragraph_char_end ?? null,
      section_id: coerceString(row.section_id),
      section_heading: coerceString(row.section_heading),
      match_char_start: row.match_char_start ?? null,
      match_char_end: row.match_char_end ?? null,
      mapped_hpo_id: coerceString(row.mapped_hpo_id),
      mapped_hpo_label: coerceString(row.mapped_hpo_label),
      hpo_mapping_trust: coerceString(row.hpo_mapping_trust),
      verification_verdict: coerceString(row.verification_verdict),
      auto_accept_eligible: Boolean(row.auto_accept_eligible),
      auto_accept_reasons: coerceArray(row.auto_accept_reasons)
    },
    anchor_context: buildExternalAnchorContext(anchorsPayload, row),
    mapping_context: {
      mapped_hpo_id: coerceString(row.mapped_hpo_id),
      mapped_hpo_label: coerceString(row.mapped_hpo_label),
      hpo_mapping_trust: coerceString(row.hpo_mapping_trust),
      top_matches: coerceArray(row.top_matches)
    },
    verification_context: {
      verdict: coerceString(row.verification_verdict),
      auto_accept_eligible: Boolean(row.auto_accept_eligible),
      auto_accept_reasons: coerceArray(row.auto_accept_reasons),
      review_id: coerceString(row.review_id),
      review_href: coerceString(row.review_href)
    }
  }));

  return {
    created_at: new Date().toISOString(),
    stage: 'external_enrichment_review_cases',
    chapter,
    candidate_count: rows.length,
    case_count: cases.length,
    cases
  };
}

export async function buildExternalMappingInputFromPath(inputPath, outputPath = '', options = {}) {
  const grounded = await readJson(path.resolve(inputPath), null);
  if (!grounded) {
    throw new Error(`Unable to read grounded payload: ${path.resolve(inputPath)}`);
  }
  const payload = buildExternalMappingInputPayload(grounded, options);
  const resolvedOutputPath = deriveExternalMappingInputPath(inputPath, outputPath);
  await writeJson(resolvedOutputPath, payload);
  return {
    payload,
    outputPath: resolvedOutputPath
  };
}

export async function mapExternalMappingInputWithBioLordFromPath(inputPath, options = {}) {
  const payload = await readJson(path.resolve(inputPath), null);
  if (!payload) {
    throw new Error(`Unable to read external mapping input: ${path.resolve(inputPath)}`);
  }

  const phenotypeRows = options.phenotypesJson
    ? coercePhenotypeRows(await readJson(path.resolve(options.phenotypesJson), null))
    : await withClient((client) => loadPhenotypeBaseRows(client));
  if (!Array.isArray(phenotypeRows) || phenotypeRows.length === 0) {
    throw new Error('No phenotype rows were available for BioLORD mapping.');
  }

  const outputPath = deriveExternalMappedOutputPath(inputPath, options.outputPath || '');
  const outputDir = path.dirname(outputPath);
  const cacheDir = path.resolve(options.cacheDir || path.join(outputDir, 'biolord_cache_external'));
  const requestPath = path.join(outputDir, `${path.basename(outputPath, path.extname(outputPath))}_biolord_request.json`);
  const phenotypePath = path.join(outputDir, `${path.basename(outputPath, path.extname(outputPath))}_biolord_phenotypes.json`);
  const responsePath = path.join(outputDir, `${path.basename(outputPath, path.extname(outputPath))}_biolord_response.json`);
  const requestPayload = buildExternalBioLordRequestPayload(payload);

  await fsp.mkdir(outputDir, { recursive: true });
  await fsp.mkdir(cacheDir, { recursive: true });
  await writeJson(requestPath, requestPayload);
  await writeJson(phenotypePath, simplifyPhenotypeRows(phenotypeRows));

  const biolordModel = options.biolordModel || DEFAULT_BIOLORD_MODEL;
  await execFileAsync(
    BIOLORD_PYTHON,
    [
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
    ],
    {
      maxBuffer: 1024 * 1024 * 32
    }
  );

  const response = await readJson(responsePath, null);
  const mappedCandidates = coerceArray(response?.chapter_results?.[0]?.mapped_candidates);
  const mappedPayload = toExternalMappedPayload({
    inputPayload: payload,
    mappingProvider: 'biolord',
    embeddingModel: biolordModel,
    mappedCandidates
  });

  await writeJson(outputPath, mappedPayload);
  return {
    payload: mappedPayload,
    outputPath
  };
}

export async function mapExternalMappingInputExactFromPath(inputPath, options = {}) {
  const payload = await readJson(path.resolve(inputPath), null);
  if (!payload) {
    throw new Error(`Unable to read external mapping input: ${path.resolve(inputPath)}`);
  }

  if (!options.phenotypesJson) {
    throw new Error('phenotypesJson is required for exact mapping.');
  }

  const phenotypeRows = coercePhenotypeRows(await readJson(path.resolve(options.phenotypesJson), null));
  if (!Array.isArray(phenotypeRows) || phenotypeRows.length === 0) {
    throw new Error('No phenotype rows were available for exact mapping.');
  }

  const lookup = buildExactPhenotypeLookup(phenotypeRows);
  const mappedCandidates = coerceArray(payload.candidates).map((candidate) => {
    const row = lookup.get(normalizeText(candidate.label));
    return {
      label: candidate.label || '',
      status: candidate.status || 'present',
      source: candidate.source || 'external_grounded_candidate',
      source_sentence: candidate.source_sentence || '',
      source_section: candidate.source_section || buildSourceSection(candidate),
      evidence_scope: candidate.evidence_scope || null,
      source_location: candidate.source_location || buildSourceLocation(candidate),
      paragraph: candidate.paragraph || '',
      section_id: candidate.section_id ?? null,
      section_heading: candidate.section_heading ?? null,
      paragraph_id: candidate.paragraph_id ?? null,
      paragraph_index: candidate.paragraph_index ?? null,
      paragraph_char_start: candidate.paragraph_char_start ?? null,
      paragraph_char_end: candidate.paragraph_char_end ?? null,
      sentence_id: candidate.sentence_id ?? null,
      sentence_index: candidate.sentence_index ?? null,
      sentence_char_start: candidate.sentence_char_start ?? null,
      sentence_char_end: candidate.sentence_char_end ?? null,
      match_char_start: candidate.match_char_start ?? null,
      match_char_end: candidate.match_char_end ?? null,
      assertion_status_origin: candidate.assertion_status_origin || null,
      assertion_reason: candidate.assertion_reason || null,
      assertion_evidence: candidate.assertion_evidence || '',
      detail_types: coerceArray(candidate.detail_types),
      ancillary_evidence_types: coerceArray(candidate.ancillary_evidence_types),
      trajectory: candidate.trajectory || null,
      reason: candidate.reason || null,
      top_matches: row
        ? [
            {
              hpo_id: row.canonical_curie,
              hpo_label: row.canonical_label,
              score: 1
            }
          ]
        : [],
      mapped_hpo_id: row ? row.canonical_curie : null,
      mapped_hpo_label: row ? row.canonical_label : null,
      hpo_mapping_trust: row ? 'high' : 'reject'
    };
  });

  const outputPath = deriveExternalMappedOutputPath(inputPath, options.outputPath || '');
  const mappedPayload = toExternalMappedPayload({
    inputPayload: payload,
    mappingProvider: 'exact_lexical',
    embeddingModel: null,
    mappedCandidates
  });

  await writeJson(outputPath, mappedPayload);
  return {
    payload: mappedPayload,
    outputPath
  };
}

export function mapExternalCandidatesWithGoogleHealthcareResponses(mappingInputPayload, responseEntries, phenotypeRows) {
  const payload = parseJsonLike(mappingInputPayload, 'mapping input payload');
  const responseLookup = buildGoogleHealthcareResponseLookup(responseEntries);
  const phenotypeRowsByCurie = buildPhenotypeRowsByCurie(phenotypeRows);

  return coerceArray(payload.candidates).map((candidate) => {
    const documentContent =
      String(candidate.source_sentence || '').trim() ||
      String(candidate.source_quote || '').trim() ||
      String(candidate.label || '').trim();
    const response = responseLookup.get(documentContent) || {};
    const entitiesById = new Map(
      coerceArray(response.entities).map((entity) => [String(entity?.entityId || '').trim(), entity])
    );

    const rankedMentions = coerceArray(response.entityMentions)
      .map((mention) => {
        const topMatches = buildGoogleHealthcareTopMatches(mention, entitiesById, phenotypeRowsByCurie);
        const { score, overlap } = scoreGoogleHealthcareMention(candidate, mention);
        return {
          mention,
          topMatches,
          score,
          overlap,
          confidence: Number(mention?.confidence || 0)
        };
      })
      .filter((row) => row.topMatches.length > 0)
      .sort((left, right) => Number(right.score || 0) - Number(left.score || 0));

    const bestMatch = rankedMentions[0] || null;
    const trust = trustFromGoogleHealthcareMatch(bestMatch);
    const bestTopMatch = bestMatch?.topMatches?.[0] || null;
    const bestMention = bestMatch?.mention || null;

    return {
      label: candidate.label || '',
      status: candidate.status || 'present',
      source: candidate.source || 'external_grounded_candidate',
      source_sentence: candidate.source_sentence || '',
      paragraph: candidate.paragraph || '',
      section_id: candidate.section_id ?? null,
      section_heading: candidate.section_heading ?? null,
      paragraph_id: candidate.paragraph_id ?? null,
      paragraph_index: candidate.paragraph_index ?? null,
      paragraph_char_start: candidate.paragraph_char_start ?? null,
      paragraph_char_end: candidate.paragraph_char_end ?? null,
      sentence_id: candidate.sentence_id ?? null,
      sentence_index: candidate.sentence_index ?? null,
      sentence_char_start: candidate.sentence_char_start ?? null,
      sentence_char_end: candidate.sentence_char_end ?? null,
      match_char_start: candidate.match_char_start ?? null,
      match_char_end: candidate.match_char_end ?? null,
      assertion_status_origin: candidate.assertion_status_origin || null,
      assertion_reason: candidate.assertion_reason || null,
      assertion_evidence: candidate.assertion_evidence || '',
      top_matches: bestMatch?.topMatches || [],
      mapped_hpo_id: trust === 'reject' ? null : bestTopMatch?.hpo_id || null,
      mapped_hpo_label: trust === 'reject' ? null : bestTopMatch?.hpo_label || null,
      hpo_mapping_trust: trust,
      healthcare_mention_text: coerceString(bestMention?.text?.content),
      healthcare_mention_type: coerceString(bestMention?.type),
      healthcare_mention_confidence: bestMention ? Number(bestMention.confidence || 0) : null,
      healthcare_entity_ids: coerceArray(bestMention?.linkedEntities)
        .map((item) => coerceString(item?.entityId))
        .filter(Boolean),
      healthcare_document_content: documentContent
    };
  });
}

export async function mapExternalMappingInputWithGoogleHealthcareFromPath(inputPath, options = {}) {
  const payload = await readJson(path.resolve(inputPath), null);
  if (!payload) {
    throw new Error(`Unable to read external mapping input: ${path.resolve(inputPath)}`);
  }

  if (!options.phenotypesJson) {
    throw new Error('phenotypesJson is required for Google Healthcare mapping.');
  }

  const phenotypeRows = coercePhenotypeRows(await readJson(path.resolve(options.phenotypesJson), null));
  if (!Array.isArray(phenotypeRows) || phenotypeRows.length === 0) {
    throw new Error('No phenotype rows were available for Google Healthcare mapping.');
  }

  const outputPath = deriveExternalMappedOutputPath(inputPath, options.outputPath || '');
  const outputDir = path.dirname(outputPath);
  const responsePath = path.join(
    outputDir,
    `${path.basename(outputPath, path.extname(outputPath))}_google_healthcare_response.json`
  );
  const accessToken = await resolveGoogleAccessToken(options);
  const nlpService = await resolveGoogleHealthcareNlpService(options);
  const responseEntries = [];
  const seenDocuments = new Set();

  for (const candidate of coerceArray(payload.candidates)) {
    const documentContent =
      String(candidate.source_sentence || '').trim() ||
      String(candidate.source_quote || '').trim() ||
      String(candidate.label || '').trim();
    if (!documentContent || seenDocuments.has(documentContent)) continue;
    seenDocuments.add(documentContent);
    const response = await callGoogleHealthcareAnalyzeEntities({
      accessToken,
      nlpService,
      documentContent
    });
    responseEntries.push({
      document_content: documentContent,
      response
    });
  }

  await writeJson(responsePath, {
    created_at: new Date().toISOString(),
    stage: 'external_google_healthcare_response',
    chapter_key: payload.chapter_key || payload.chapter?.chapter_key || '',
    nlp_service: nlpService,
    response_count: responseEntries.length,
    responses: responseEntries
  });

  const mappedCandidates = mapExternalCandidatesWithGoogleHealthcareResponses(payload, responseEntries, phenotypeRows);
  const mappedPayload = toExternalMappedPayload({
    inputPayload: payload,
    mappingProvider: 'google_healthcare_nlp',
    embeddingModel: nlpService,
    mappedCandidates
  });

  await writeJson(outputPath, mappedPayload);
  return {
    payload: mappedPayload,
    outputPath
  };
}

export async function buildExternalEnrichmentCasesFromPaths({
  groundedPath,
  mappedPath,
  anchorsPath,
  outputPath = '',
  includeExcluded = false,
  includeUncertain = true
}) {
  const [grounded, mapped, anchors] = await Promise.all([
    readJson(path.resolve(groundedPath), null),
    readJson(path.resolve(mappedPath), null),
    readJson(path.resolve(anchorsPath), null)
  ]);

  if (!grounded) throw new Error(`Unable to read grounded payload: ${path.resolve(groundedPath)}`);
  if (!mapped) throw new Error(`Unable to read mapped payload: ${path.resolve(mappedPath)}`);
  if (!anchors) throw new Error(`Unable to read anchors payload: ${path.resolve(anchorsPath)}`);

  const merged = mergeExternalMappedCandidates(grounded, mapped);
  const payload = buildExternalEnrichmentCases(merged, anchors, {
    includeExcluded,
    includeUncertain
  });
  const resolvedOutputPath = deriveExternalEnrichmentCasesPath(mappedPath, outputPath);
  await writeJson(resolvedOutputPath, payload);
  return {
    merged,
    payload,
    outputPath: resolvedOutputPath
  };
}

export async function runExternalEnrichmentReviewFromPath(inputPath, options = {}) {
  const reviewCases = await readJson(path.resolve(inputPath), null);
  if (!reviewCases) {
    throw new Error(`Unable to read enrichment review cases: ${path.resolve(inputPath)}`);
  }

  const cases = coerceArray(reviewCases.cases);
  if (cases.length === 0) {
    throw new Error('No enrichment review cases were available for external review.');
  }

  const chapter = buildChapterRecord(reviewCases);
  const chapterKey = chapter.chapter_key || chapter.nbk_id || chapter.title || 'external_chapter';
  const modelNames = Array.isArray(options.models)
    ? options.models.map((value) => String(value || '').trim()).filter(Boolean)
    : String(options.models || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

  if (modelNames.length === 0) {
    throw new Error('At least one review model is required.');
  }

  const modelOutputs = [];
  for (const model of modelNames) {
    const reviewed = await runSchemaGuardedEnrichmentReview({
      apiKey: options.apiKey,
      model,
      thinkingBudget: options.thinkingBudget ?? 256,
      temperature: options.temperature ?? 0,
      chapterKey,
      cases
    });
    const routed = deterministicallyRouteEnrichmentReviewResults(cases, reviewed.normalized.results);
    modelOutputs.push({
      model,
      primary_usage: reviewed.primary.usage || null,
      repaired_usage: reviewed.repaired?.usage || null,
      validation_issues: reviewed.normalized.issues,
      repaired_output_used: Boolean(reviewed.repaired),
      normalized_results: reviewed.normalized.results,
      routed_results: routed.results,
      routing_adjustments: routed.adjustments
    });
  }

  const outputPath = deriveExternalReviewOutputPath(inputPath, options.outputPath || '');
  const payload = {
    created_at: new Date().toISOString(),
    stage: 'external_enrichment_review_outputs',
    source_stage: coerceString(reviewCases.stage),
    chapter,
    case_count: cases.length,
    models: modelNames,
    outputs: modelOutputs
  };
  await writeJson(outputPath, payload);
  return {
    payload,
    outputPath
  };
}

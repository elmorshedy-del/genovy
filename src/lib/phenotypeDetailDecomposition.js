import { callGeminiJson } from './genereviewsPipeline.js';
import {
  ENRICHMENT_DETAIL_TYPES,
  buildEnrichmentDetailTypeSchemaText,
  canonicalizeDetailType
} from './enrichmentReviewer.js';

export const DECOMPOSITION_EVIDENCE_SCOPES = Object.freeze([
  'sentence',
  'paragraph',
  'section',
  'chapter',
  'label_only'
]);

function canonicalizeEvidenceScope(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!normalized) return null;
  if (DECOMPOSITION_EVIDENCE_SCOPES.includes(normalized)) return normalized;
  if (normalized === 'quote_only') return 'label_only';
  if (normalized === 'sentence_only') return 'sentence';
  return null;
}

function inferEvidenceScope(row) {
  const explicit = canonicalizeEvidenceScope(row?.evidence_scope);
  if (explicit) return explicit;
  if (String(row?.sentence_id || '').trim()) return 'sentence';
  if (String(row?.paragraph_id || '').trim()) return 'paragraph';
  if (String(row?.section_id || '').trim()) return 'section';
  return 'label_only';
}

function buildSourceLocation(row) {
  return {
    section_id: String(row?.section_id || '').trim() || null,
    section_heading: String(row?.section_heading || '').trim() || null,
    paragraph_id: String(row?.paragraph_id || '').trim() || null,
    paragraph_index: row?.paragraph_index ?? null,
    sentence_id: String(row?.sentence_id || '').trim() || null
  };
}

export function buildPhenotypeDetailDecompositionPrompt() {
  return `You are decomposing phenotype candidate labels into a core finding plus source-faithful retained detail.

Return JSON with a top-level key "results" containing one item per case in the same order.
Each result must contain:
- candidate_label
- sentence_id
- evidence_scope
- source_location
- core_problem
- modifier_details
- notes

Each modifier_details item must contain:
- detail_type
- value_text
- evidence_text

Allowed detail_type values:
${buildEnrichmentDetailTypeSchemaText()}

Rules:
- Preserve source meaning.
- Do not replace the phrase with a different diagnosis, syndrome, or ontology concept.
- Keep the core_problem minimal but clinically faithful.
- Extract only clinically meaningful residual detail that is directly supported by the candidate label or source sentence.
- If a phrase is not safely decomposable, keep the original candidate_label as core_problem and return an empty modifier_details array.
- Do not invent detail_type labels outside the allowed list.
- evidence_scope must be one of: sentence, paragraph, section, chapter, label_only.
- source_location must preserve the provided sentence_id, paragraph_id, paragraph_index, section_id, and section_heading when available.
- Use clinical_course for behavior over time after onset, such as recurrent, episodic, progressive, persistent, relapsing, transient, stable, or regressive.
- Use temporal_qualifier for onset timing such as neonatal, infantile, childhood-onset, adult-onset, early-onset, or late-onset.
- Use anatomical_subsite for named subregions; use distribution for extent or gradient terms such as proximal, distal, focal, diffuse, central, or peripheral when they describe spread or gradient rather than a named subsite.

Output JSON only.`;
}

export function normalizePhenotypeDetailDecompositionPayload(payload, expectedCount = null) {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.results)
      ? payload.results
      : [];

  const results = [];
  const issues = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] || {};
    const modifierDetails = Array.isArray(row.modifier_details) ? row.modifier_details : [];
    const normalizedModifierDetails = [];
    const invalidDetailTypes = [];
    const seen = new Set();

    for (const detail of modifierDetails) {
      const detailType = canonicalizeDetailType(detail?.detail_type);
      if (!detailType || !ENRICHMENT_DETAIL_TYPES.includes(detailType)) {
        invalidDetailTypes.push(detail?.detail_type || null);
        continue;
      }

      const valueText = String(detail?.value_text || '').trim();
      const evidenceText = String(detail?.evidence_text || '').trim();
      if (!valueText || !evidenceText) continue;

      const dedupeKey = `${detailType}::${valueText.toLowerCase()}::${evidenceText.toLowerCase()}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      normalizedModifierDetails.push({
        detail_type: detailType,
        value_text: valueText,
        evidence_text: evidenceText
      });
    }

    if (invalidDetailTypes.length > 0) {
      issues.push({
        index,
        type: 'invalid_detail_types',
        value: invalidDetailTypes
      });
    }

    const candidateLabel = String(row.candidate_label || '').trim();
    const sentenceId = String(row.sentence_id || '').trim();
    const coreProblem = String(row.core_problem || '').trim();
    const evidenceScope = inferEvidenceScope(row);
    const sourceLocation = buildSourceLocation(row.source_location || row);
    const notes = Array.isArray(row.notes) ? row.notes.map((note) => String(note || '').trim()).filter(Boolean) : [];

    if (!candidateLabel) issues.push({ index, type: 'missing_candidate_label' });
    if (!sentenceId) issues.push({ index, type: 'missing_sentence_id' });
    if (!coreProblem) issues.push({ index, type: 'missing_core_problem' });
    if (!evidenceScope) issues.push({ index, type: 'invalid_evidence_scope', value: row.evidence_scope || null });

    results.push({
      candidate_label: candidateLabel,
      sentence_id: sentenceId,
      evidence_scope: evidenceScope,
      source_location: sourceLocation,
      core_problem: coreProblem,
      modifier_details: normalizedModifierDetails,
      notes
    });
  }

  if (expectedCount !== null && rows.length !== expectedCount) {
    issues.push({
      type: 'wrong_result_count',
      value: {
        expected: expectedCount,
        received: rows.length
      }
    });
  }

  const valid =
    issues.length === 0 &&
    results.every((row) => row.candidate_label && row.sentence_id && row.core_problem);

  return {
    valid,
    issues,
    results
  };
}

function buildRepairPrompt(normalizedPayload) {
  return `Repair the JSON so it matches the required schema exactly.

Allowed detail_type values:
${buildEnrichmentDetailTypeSchemaText()}

Current validation issues:
${JSON.stringify(normalizedPayload.issues, null, 2)}

Rules:
- Keep the same number of results.
- Preserve candidate_label and sentence_id.
- Preserve evidence_scope and source_location when present.
- Every modifier_details item must use only an allowed detail_type.
- Remove invalid modifier_details items instead of inventing replacements when uncertain.
- If a row cannot be safely decomposed, keep candidate_label as core_problem and use an empty modifier_details array.

Return JSON only with a top-level "results" key.`;
}

export async function runSchemaGuardedPhenotypeDetailDecomposition({
  apiKey,
  model,
  thinkingBudget = 0,
  temperature = 0,
  cases
}) {
  const payloadCases = Array.isArray(cases) ? cases : [];
  const primary = await callGeminiJson({
    apiKey,
    model,
    thinkingBudget,
    temperature,
    systemPrompt: buildPhenotypeDetailDecompositionPrompt(),
    userPayload: { cases: payloadCases }
  });

  const normalized = normalizePhenotypeDetailDecompositionPayload(primary.parsed, payloadCases.length);
  if (normalized.valid) {
    return {
      primary,
      repaired: null,
      normalized
    };
  }

  const repaired = await callGeminiJson({
    apiKey,
    model,
    thinkingBudget: 0,
    temperature: 0,
    systemPrompt: buildRepairPrompt(normalized),
    userPayload: {
      cases: payloadCases,
      invalid_output: primary.rawOutput
    }
  });

  return {
    primary,
    repaired,
    normalized: normalizePhenotypeDetailDecompositionPayload(repaired.parsed, payloadCases.length)
  };
}

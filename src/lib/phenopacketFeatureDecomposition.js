import { callGeminiJson } from './genereviewsPipeline.js';

const EVIDENCE_SCOPES = Object.freeze([
  'sentence',
  'paragraph',
  'section',
  'chapter',
  'label_only'
]);

function canonicalizeEvidenceScope(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!normalized) return null;
  if (EVIDENCE_SCOPES.includes(normalized)) return normalized;
  if (normalized === 'quote_only') return 'label_only';
  if (normalized === 'sentence_only') return 'sentence';
  return null;
}

function inferEvidenceScope(row, feature) {
  const explicit = canonicalizeEvidenceScope(feature?.evidence?.evidence_scope || row?.evidence_scope);
  if (explicit) return explicit;
  if (String(row?.sentence_id || '').trim()) return 'sentence';
  if (String(row?.paragraph_id || '').trim()) return 'paragraph';
  if (String(row?.section_id || '').trim()) return 'section';
  return 'label_only';
}

function allowedModifierKindsText() {
  return [
    '- subtype',
    '- pattern',
    '- morphology',
    '- distribution',
    '- laterality',
    '- modality',
    '- temporal_qualifier',
    '- clinical_course',
    '- trigger',
    '- quantitative',
    '- anatomical_subsite',
    '- severity_domain',
    '- pathophysiology',
    '- etiology'
  ].join('\n');
}

export function buildPhenopacketFeaturePrompt() {
  return `You are converting phenotype phrases into a Phenopacket-aligned PhenotypicFeature-like JSON object.

Return JSON with a top-level key "results" containing one item per case in the same order.
Each result must contain:
- candidate_label
- sentence_id
- phenotypic_feature
- notes

phenotypic_feature must contain:
- type: { id: string|null, label: string }
- excluded: boolean
- severity: { label: string } | null
- onset: { label: string } | null
- modifiers: [{ modifier_kind: string, label: string, evidence_text: string }]
- evidence: {
    evidence_text: string,
    source_sentence: string,
    evidence_scope: "sentence"|"paragraph"|"section"|"chapter"|"label_only",
    sentence_id: string|null,
    paragraph_id: string|null,
    paragraph_index: number|null,
    section_id: string|null,
    section_heading: string|null
  }

Rules:
- Preserve source meaning.
- Use a base phenotype label for phenotypic_feature.type.label. Do not replace the phrase with a different diagnosis or syndrome.
- Leave type.id as null unless the source phrase itself already safely implies a canonical HPO-like anchor label. Do not invent ontology ids.
- Use severity only for severity terms such as mild, marked, severe, profound.
- Use onset only for onset/timing terms such as neonatal, infantile, childhood-onset, adult-onset.
- Put the remaining retained detail in modifiers.
- Preserve sentence_id, paragraph_id, paragraph_index, section_id, and section_heading when provided.
- Allowed modifier_kind values:
${allowedModifierKindsText()}
- Prefer an empty modifiers array instead of inventing weak structure.

Output JSON only.`;
}

export function normalizePhenopacketFeaturePayload(payload, expectedCount = null) {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.results)
      ? payload.results
      : [];

  const results = [];
  const issues = [];

  const allowedModifierKinds = new Set([
    'subtype',
    'pattern',
    'morphology',
    'distribution',
    'laterality',
    'modality',
    'temporal_qualifier',
    'clinical_course',
    'trigger',
    'quantitative',
    'anatomical_subsite',
    'severity_domain',
    'pathophysiology',
    'etiology'
  ]);

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] || {};
    const feature = row.phenotypic_feature || {};
    const type = feature.type || {};
    const severity = feature.severity || null;
    const onset = feature.onset || null;
    const evidence = feature.evidence || {};
    const modifiers = Array.isArray(feature.modifiers) ? feature.modifiers : [];

    const normalizedModifiers = [];
    const invalidModifierKinds = [];

    for (const modifier of modifiers) {
      const modifierKind = String(modifier?.modifier_kind || '').trim();
      if (!allowedModifierKinds.has(modifierKind)) {
        invalidModifierKinds.push(modifierKind || null);
        continue;
      }
      const label = String(modifier?.label || '').trim();
      const evidenceText = String(modifier?.evidence_text || '').trim();
      if (!label || !evidenceText) continue;
      normalizedModifiers.push({
        modifier_kind: modifierKind,
        label,
        evidence_text: evidenceText
      });
    }

    if (invalidModifierKinds.length > 0) {
      issues.push({
        index,
        type: 'invalid_modifier_kinds',
        value: invalidModifierKinds
      });
    }

    const candidateLabel = String(row.candidate_label || '').trim();
    const sentenceId = String(row.sentence_id || '').trim();
    const typeLabel = String(type.label || '').trim();
    const evidenceText = String(evidence.evidence_text || '').trim();
    const sourceSentence = String(evidence.source_sentence || '').trim();
    const evidenceScope = inferEvidenceScope(row, feature);
    const sentenceLocationId = String(evidence.sentence_id || row.sentence_id || '').trim() || null;
    const paragraphLocationId = String(evidence.paragraph_id || row.paragraph_id || '').trim() || null;
    const sectionLocationId = String(evidence.section_id || row.section_id || '').trim() || null;
    const sectionHeading = String(evidence.section_heading || row.section_heading || '').trim() || null;
    const paragraphIndex = evidence.paragraph_index ?? row.paragraph_index ?? null;

    if (!candidateLabel) issues.push({ index, type: 'missing_candidate_label' });
    if (!sentenceId) issues.push({ index, type: 'missing_sentence_id' });
    if (!typeLabel) issues.push({ index, type: 'missing_type_label' });
    if (!evidenceText) issues.push({ index, type: 'missing_evidence_text' });
    if (!sourceSentence) issues.push({ index, type: 'missing_source_sentence' });
    if (!evidenceScope) issues.push({ index, type: 'invalid_evidence_scope', value: feature?.evidence?.evidence_scope || row?.evidence_scope || null });

    results.push({
      candidate_label: candidateLabel,
      sentence_id: sentenceId,
      phenotypic_feature: {
        type: {
          id: type.id == null ? null : String(type.id).trim() || null,
          label: typeLabel
        },
        excluded: Boolean(feature.excluded),
        severity:
          severity && typeof severity === 'object' && String(severity.label || '').trim()
            ? { label: String(severity.label).trim() }
            : null,
        onset:
          onset && typeof onset === 'object' && String(onset.label || '').trim()
            ? { label: String(onset.label).trim() }
            : null,
        modifiers: normalizedModifiers,
        evidence: {
          evidence_text: evidenceText,
          source_sentence: sourceSentence,
          evidence_scope: evidenceScope,
          sentence_id: sentenceLocationId,
          paragraph_id: paragraphLocationId,
          paragraph_index: paragraphIndex,
          section_id: sectionLocationId,
          section_heading: sectionHeading
        }
      },
      notes: Array.isArray(row.notes) ? row.notes.map((note) => String(note || '').trim()).filter(Boolean) : []
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
    results.every(
      (row) =>
        row.candidate_label &&
        row.sentence_id &&
        row.phenotypic_feature.type.label &&
        row.phenotypic_feature.evidence.evidence_text &&
        row.phenotypic_feature.evidence.source_sentence
    );

  return {
    valid,
    issues,
    results
  };
}

function buildRepairPrompt(normalizedPayload) {
  return `Repair the JSON so it matches the required Phenopacket-aligned schema exactly.

Allowed modifier_kind values:
${allowedModifierKindsText()}

Current validation issues:
${JSON.stringify(normalizedPayload.issues, null, 2)}

Rules:
- Keep the same number of results.
- Preserve candidate_label and sentence_id.
- Every result must include evidence.evidence_text, evidence.source_sentence, and evidence.evidence_scope.
- Preserve evidence location ids when present.
- Remove invalid modifier entries instead of inventing replacements when uncertain.
- Keep type.id null unless the current output already provides a safe value.

Return JSON only with a top-level "results" key.`;
}

export async function runSchemaGuardedPhenopacketFeatureDecomposition({
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
    systemPrompt: buildPhenopacketFeaturePrompt(),
    userPayload: { cases: payloadCases }
  });

  const normalized = normalizePhenopacketFeaturePayload(primary.parsed, payloadCases.length);
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
    normalized: normalizePhenopacketFeaturePayload(repaired.parsed, payloadCases.length)
  };
}

export const ENRICHMENT_REVIEW_BUCKETS = Object.freeze([
  'keep_enrichment',
  'collapse_to_anchor',
  'broad_or_redundant',
  'junk_or_context_only'
]);

export const ENRICHMENT_DETAIL_TYPE_DEFINITIONS = Object.freeze({
  subtype:
    'A named clinical subtype or child concept within a broader anchor. Use when the candidate names a more specific type of the anchored finding.',
  pattern:
    'A recognizable visual, spatial, or descriptive gestalt that adds clinically meaningful source detail beyond the anchor.',
  morphology:
    'A structural, shape, contour, or architectural description of the finding that adds clinically meaningful specificity.',
  distribution:
    'An extent or gradient qualifier such as proximal/distal, focal/diffuse, central/peripheral, or similar distributional detail.',
  laterality:
    'A left/right, unilateral/bilateral, or asymmetric detail that adds clinically meaningful specificity.',
  modality:
    'A detail describing which functional or physiologic channel is affected within a broader anchor, such as sensory vs motor or conductive vs sensorineural.',
  temporal_qualifier:
    'A timing or onset qualifier that says when the finding appears, such as neonatal, infantile, childhood, adult-onset, early-onset, or late-onset.',
  clinical_course:
    'A trajectory or behavior-over-time qualifier after onset, such as progressive, recurrent, relapsing, episodic, transient, persistent, stable, or regressive. Use this for how the finding behaves over time, not for age of onset.',
  trigger:
    'A trigger, provocation, or precipitating condition that makes the finding occur or worsen, such as exercise-induced, febrile-triggered, or fasting-provoked.',
  quantitative:
    'A quantitative or threshold-like detail that adds magnitude or measurable specificity beyond the anchor.',
  anatomical_subsite:
    'A named subregion within a broader organ, structure, or system that localizes the finding more precisely than the anchor.',
  severity_domain:
    'A clinically meaningful severity qualifier such as mild, severe, profound, or marked when it changes the retained specificity of the finding.',
  pathophysiology:
    'An underlying biological, developmental, or physiologic abnormality that directly explains the retained finding and is described in the source as clinically meaningful disease detail. Use for within-patient mechanism or abnormal process, not for upstream root cause labels.',
  etiology:
    'An explicitly stated causal basis for the retained finding when that cause itself adds clinically meaningful specificity beyond the anchor and is not merely a gene, variant, inheritance pattern, or broad diagnosis label.',
  none:
    'Use only when no valid detail type applies. Prefer an empty detail_types array when the bucket is not keep_enrichment.'
});

export const ENRICHMENT_DETAIL_TYPES = Object.freeze(
  Object.keys(ENRICHMENT_DETAIL_TYPE_DEFINITIONS).filter((key) => key !== 'none')
);

export const ENRICHMENT_DETAIL_TYPE_ALIASES = Object.freeze({
  severity: 'severity_domain',
  severity_qualifier: 'severity_domain',
  onset: 'temporal_qualifier',
  temporal: 'temporal_qualifier',
  temporal_onset: 'temporal_qualifier',
  temporal_course: 'clinical_course',
  course: 'clinical_course',
  trajectory: 'clinical_course',
  clinical_trajectory: 'clinical_course',
  progression: 'clinical_course',
  pathology: 'pathophysiology',
  pathologic_process: 'pathophysiology',
  pathobiology: 'pathophysiology',
  mechanism: 'pathophysiology',
  physiologic_mechanism: 'pathophysiology',
  anatomic_subsite: 'anatomical_subsite',
  location: 'anatomical_subsite',
  anatomical_location: 'anatomical_subsite',
  quantity: 'quantitative'
});

export function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function canonicalizeDetailType(value) {
  const normalized = normalizeText(value).replace(/\s+/g, '_');
  if (!normalized) return null;
  if (ENRICHMENT_DETAIL_TYPES.includes(normalized)) return normalized;
  return ENRICHMENT_DETAIL_TYPE_ALIASES[normalized] || null;
}

export function buildEnrichmentDetailTypeSchemaText() {
  return ENRICHMENT_DETAIL_TYPES.map((detailType) => {
    const definition = ENRICHMENT_DETAIL_TYPE_DEFINITIONS[detailType];
    return `- ${detailType}: ${definition}`;
  }).join('\n');
}

export function normalizeEnrichmentReviewPayload(payload, expectedCount = null) {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.results)
      ? payload.results
      : [];

  const results = [];
  const issues = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] || {};
    const bucket = ENRICHMENT_REVIEW_BUCKETS.includes(row.bucket) ? row.bucket : null;
    const detailTypes = Array.isArray(row.detail_types)
      ? [...new Set(row.detail_types.map(canonicalizeDetailType).filter(Boolean))]
      : [];
    const invalidDetailTypes = Array.isArray(row.detail_types)
      ? row.detail_types.filter((detailType) => !canonicalizeDetailType(detailType))
      : [];

    if (!bucket) {
      issues.push({
        index,
        type: 'invalid_bucket',
        value: row.bucket || null
      });
    }

    if (invalidDetailTypes.length > 0) {
      issues.push({
        index,
        type: 'invalid_detail_types',
        value: invalidDetailTypes
      });
    }

    results.push({
      candidate_label: String(row.candidate_label || ''),
      sentence_id: String(row.sentence_id || ''),
      bucket,
      adds_detail_beyond_anchor: Boolean(row.adds_detail_beyond_anchor),
      detail_types: detailTypes,
      same_finding_as_anchor_labels: Array.isArray(row.same_finding_as_anchor_labels)
        ? row.same_finding_as_anchor_labels.map((item) => String(item || '')).filter(Boolean)
        : [],
      reason: String(row.reason || '').trim()
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
    results.every((row) => row.bucket && row.candidate_label && row.sentence_id && row.reason);

  return {
    valid,
    issues,
    results
  };
}

export function buildSchemaRepairPrompt() {
  return `You are repairing a prior GeneReviews enrichment review output to satisfy a strict schema.

Return JSON with a top-level key "results" containing one item per case in the same order.
Do not drop or reorder cases.
Do not invent candidate labels or sentence IDs.

Allowed buckets:
- keep_enrichment
- collapse_to_anchor
- broad_or_redundant
- junk_or_context_only

Allowed detail_types:
${buildEnrichmentDetailTypeSchemaText()}

Repair rules:
- Every detail_types item must be from the allowed list above.
- If a prior value is close but not exact, map it to the closest allowed value.
- Examples of valid repairs:
  - severity -> severity_domain
  - pathology -> pathophysiology
  - progression -> clinical_course
- If no valid detail type remains, return an empty detail_types array.
- Keep the bucket and reasoning aligned with the repaired detail types.
- Output JSON only.`;
}

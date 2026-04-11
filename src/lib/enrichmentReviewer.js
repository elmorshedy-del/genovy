import { callGeminiJson } from './genereviewsPipeline.js';

export const ENRICHMENT_REVIEW_BUCKETS = Object.freeze([
  'keep_enrichment',
  'retain_as_ancillary',
  'collapse_to_anchor',
  'broad_or_redundant',
  'junk_or_context_only'
]);

export const ENRICHMENT_RETENTION_LAYERS = Object.freeze([
  'phenotype_enrichment',
  'ancillary_clinical_evidence',
  'discarded'
]);

export const ENRICHMENT_EVIDENCE_SCOPES = Object.freeze([
  'sentence',
  'paragraph',
  'section',
  'chapter',
  'label_only'
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

export const ANCILLARY_EVIDENCE_TYPE_DEFINITIONS = Object.freeze({
  laboratory:
    'A lab value, biomarker, metabolite, antibody, enzyme, or other laboratory-only evidence that is clinically useful but not itself a phenotype enrichment row.',
  imaging:
    'A radiology, scan, or other imaging-specific characterization that is clinically useful but should be retained outside phenotype enrichment.',
  pathology:
    'A histopathology, marrow, biopsy, tissue, or other pathology-only finding that is clinically useful but should be retained outside phenotype enrichment.',
  electrophysiology:
    'An EEG, EMG, NCS, ERG, ECG, or other electrophysiologic characterization that is clinically useful but should be retained outside phenotype enrichment.',
  treatment_response:
    'A medication, procedure, or response-to-treatment observation that is clinically useful but is not itself a phenotype enrichment row.',
  clinical_test:
    'A formal bedside or specialty test result that is clinically useful but not itself a phenotype enrichment row.',
  management_context:
    'A management, support, or surveillance detail that could matter in a future patient-facing interface but is not phenotype enrichment.',
  other:
    'Clinically useful non-phenotype evidence that should be retained outside enrichment when no narrower ancillary evidence type fits.'
});

export const ANCILLARY_EVIDENCE_TYPES = Object.freeze(
  Object.keys(ANCILLARY_EVIDENCE_TYPE_DEFINITIONS)
);

export const ENRICHMENT_DETAIL_TYPE_ALIASES = Object.freeze({
  severity: 'severity_domain',
  severity_qualifier: 'severity_domain',
  onset: 'temporal_qualifier',
  temporal: 'temporal_qualifier',
  temporal_onset: 'temporal_qualifier',
  temporal_course: 'clinical_course',
  course: 'clinical_course',
  frequency: 'clinical_course',
  trajectory: 'clinical_course',
  clinical_trajectory: 'clinical_course',
  progression: 'clinical_course',
  pathology: 'pathophysiology',
  pathologic_process: 'pathophysiology',
  pathobiology: 'pathophysiology',
  mechanism: 'pathophysiology',
  physiologic_mechanism: 'pathophysiology',
  anatomic_subsite: 'anatomical_subsite',
  body_site: 'anatomical_subsite',
  location: 'anatomical_subsite',
  anatomical_location: 'anatomical_subsite',
  quantity: 'quantitative'
});

export const ANCILLARY_EVIDENCE_TYPE_ALIASES = Object.freeze({
  lab: 'laboratory',
  labs: 'laboratory',
  biomarker: 'laboratory',
  biomarkers: 'laboratory',
  biochemical: 'laboratory',
  serology: 'laboratory',
  antibody: 'laboratory',
  antibodies: 'laboratory',
  imaging_characterization: 'imaging',
  radiology: 'imaging',
  radiologic: 'imaging',
  histology: 'pathology',
  histopathology: 'pathology',
  biopsy: 'pathology',
  pathology_only: 'pathology',
  eeg: 'electrophysiology',
  emg: 'electrophysiology',
  ncs: 'electrophysiology',
  erg: 'electrophysiology',
  ecg: 'electrophysiology',
  treatment: 'treatment_response',
  therapy_response: 'treatment_response',
  treatment_effect: 'treatment_response',
  medication_response: 'treatment_response',
  clinical_exam: 'clinical_test',
  exam: 'clinical_test',
  management: 'management_context',
  surveillance: 'management_context',
  support: 'management_context'
});

const ANCILLARY_EVIDENCE_TEXT_PATTERNS = Object.freeze({
  laboratory: Object.freeze([
    /\bautoantibod(?:y|ies)\b/i,
    /\bantibod(?:y|ies)\b/i,
    /viremia\b/i,
    /\bbiomarker\b/i,
    /\bmetabolite\b/i,
    /\benzyme\b/i,
    /\btransaminase\b/i,
    /\bcreatine kinase\b/i,
    /\bck\b/i,
    /\bserum\b/i,
    /\bplasma\b/i,
    /\bcsf\b/i
  ]),
  imaging: Object.freeze([/\bmri\b/i, /\bct\b/i, /\bpet\b/i, /\bultrasound\b/i, /\bscan\b/i, /\bimaging\b/i, /\bradiograph/i]),
  pathology: Object.freeze([/\bhistopath/i, /\bhistology\b/i, /\bbiopsy\b/i, /\bmarrow\b/i, /\bvacuol/i, /\bpathology\b/i]),
  electrophysiology: Object.freeze([/\beeg\b/i, /\bemg\b/i, /\bncs\b/i, /\berg\b/i, /\becg\b/i, /\belectrophysi/i]),
  treatment_response: Object.freeze([
    /\btreatment[- ]refractory\b/i,
    /\bresistant to therapy\b/i,
    /\bsteroid[- ]responsive\b/i,
    /\bglucocorticoid[- ]responsive\b/i,
    /\bresponsive to treatment\b/i
  ]),
  clinical_test: Object.freeze([
    /\baudiometry\b/i,
    /\bpulmonary function test\b/i,
    /\bformal testing\b/i,
    /\bneuropsychological testing\b/i
  ]),
  management_context: Object.freeze([
    /\bmanagement\b/i,
    /\bsurveillance\b/i,
    /\bfeeding tube\b/i,
    /\bgastrostomy\b/i,
    /\btracheostomy\b/i,
    /\bventilation dependency\b/i
  ]),
  other: Object.freeze([])
});

const ANCILLARY_ONLY_LABEL_PATTERNS = Object.freeze({
  laboratory: ANCILLARY_EVIDENCE_TEXT_PATTERNS.laboratory,
  imaging: ANCILLARY_EVIDENCE_TEXT_PATTERNS.imaging,
  pathology: ANCILLARY_EVIDENCE_TEXT_PATTERNS.pathology,
  electrophysiology: ANCILLARY_EVIDENCE_TEXT_PATTERNS.electrophysiology,
  treatment_response: Object.freeze([
    /^treatment[- ]refractory\b/i,
    /^therapy[- ]resistant\b/i,
    /^steroid[- ]responsive\b/i,
    /^glucocorticoid[- ]responsive\b/i,
    /\bresponse to treatment\b/i
  ]),
  clinical_test: ANCILLARY_EVIDENCE_TEXT_PATTERNS.clinical_test,
  management_context: ANCILLARY_EVIDENCE_TEXT_PATTERNS.management_context,
  other: Object.freeze([])
});

const DISCARDED_BUCKETS = Object.freeze([
  'collapse_to_anchor',
  'broad_or_redundant',
  'junk_or_context_only'
]);

const TREATMENT_RESPONSE_OBJECT_PATTERN =
  /(?:therapy|treatment|medication|drug|drugs|steroid|steroids|corticosteroid(?:s)?|antibiotic(?:s)?|antiepileptic(?:s)?|anticonvulsant(?:s)?|intervention|chemotherapy|immunotherapy|supplement(?:ation)?|levodopa|pyridoxine|biotin|carbamazepine)\b/i;

const POST_NOMINAL_TREATMENT_RESPONSE_PATTERN = new RegExp(
  String.raw`\b(?:resistant|refractory|responsive|sensitive|unresponsive|amenable)\s+to\s+(?:(?:[A-Za-z0-9-]+\s+){0,4})${TREATMENT_RESPONSE_OBJECT_PATTERN.source}`,
  'i'
);

const PRENOMINAL_TREATMENT_RESPONSE_PATTERN = new RegExp(
  String.raw`\b(?:(?:treatment|drug|therapy|steroid|steroids|medication|corticosteroid(?:s)?|antibiotic(?:s)?|antiepileptic(?:s)?|anticonvulsant(?:s)?|levodopa|pyridoxine|biotin|carbamazepine|chemotherapy|immunotherapy|supplement(?:ation)?)\s*[- ]\s*(?:resistant|refractory|responsive|sensitive|unresponsive|amenable))\b`,
  'i'
);

const CLINICAL_COURSE_SIGNAL_PATTERN =
  /\b(persistent|recurrent|progressive|relapsing|episodic|transient|stable|regressive|chronic)\b/i;

function canonicalizeEvidenceScope(value) {
  const normalized = normalizeText(value).replace(/\s+/g, '_');
  if (!normalized) return null;
  if (ENRICHMENT_EVIDENCE_SCOPES.includes(normalized)) return normalized;
  if (normalized === 'quote_only') return 'label_only';
  if (normalized === 'sentence_only') return 'sentence';
  return null;
}

function inferEvidenceScope(row) {
  const explicit = canonicalizeEvidenceScope(row?.evidence_scope);
  if (explicit) return explicit;
  if (String(row?.sentence_id || '').trim()) return 'sentence';
  if (String(row?.paragraph_id || row?.source_location?.paragraph_id || '').trim()) return 'paragraph';
  if (String(row?.section_id || row?.source_location?.section_id || '').trim()) return 'section';
  return 'label_only';
}

function buildSourceLocation(row) {
  const source = row?.source_location || row || {};
  return {
    section_id: String(source.section_id || row?.section_id || '').trim() || null,
    section_heading: String(source.section_heading || row?.section_heading || '').trim() || null,
    paragraph_id: String(source.paragraph_id || row?.paragraph_id || '').trim() || null,
    paragraph_index: source.paragraph_index ?? row?.paragraph_index ?? null,
    sentence_id: String(source.sentence_id || row?.sentence_id || '').trim() || null
  };
}

function mergeSourceLocationWithCandidate(row, candidate) {
  return buildSourceLocation({
    section_id: row?.source_location?.section_id ?? row?.section_id ?? candidate?.section_id ?? null,
    section_heading: row?.source_location?.section_heading ?? row?.section_heading ?? candidate?.section_heading ?? null,
    paragraph_id: row?.source_location?.paragraph_id ?? row?.paragraph_id ?? candidate?.paragraph_id ?? null,
    paragraph_index: row?.source_location?.paragraph_index ?? row?.paragraph_index ?? candidate?.paragraph_index ?? null,
    sentence_id: row?.source_location?.sentence_id ?? row?.sentence_id ?? candidate?.sentence_id ?? null
  });
}

function buildSourceSection(row, candidate = null) {
  return (
    String(row?.source_section || candidate?.source_section || '').trim() ||
    String(row?.source_location?.section_heading || row?.section_heading || candidate?.section_heading || '').trim() ||
    String(row?.source_location?.section_id || row?.section_id || candidate?.section_id || '').trim() ||
    null
  );
}

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

export function canonicalizeAncillaryEvidenceType(value) {
  const normalized = normalizeText(value).replace(/\s+/g, '_');
  if (!normalized) return null;
  if (ANCILLARY_EVIDENCE_TYPES.includes(normalized)) return normalized;
  return ANCILLARY_EVIDENCE_TYPE_ALIASES[normalized] || null;
}

export function buildEnrichmentDetailTypeSchemaText() {
  return ENRICHMENT_DETAIL_TYPES.map((detailType) => {
    const definition = ENRICHMENT_DETAIL_TYPE_DEFINITIONS[detailType];
    return `- ${detailType}: ${definition}`;
  }).join('\n');
}

export function buildAncillaryEvidenceTypeSchemaText() {
  return ANCILLARY_EVIDENCE_TYPES.map((evidenceType) => {
    const definition = ANCILLARY_EVIDENCE_TYPE_DEFINITIONS[evidenceType];
    return `- ${evidenceType}: ${definition}`;
  }).join('\n');
}

function matchesAnyPattern(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function inferAncillaryEvidenceTypesFromTexts(...texts) {
  const joinedText = texts
    .map((text) => String(text || '').trim())
    .filter(Boolean)
    .join(' ');

  return ANCILLARY_EVIDENCE_TYPES.filter((evidenceType) =>
    matchesAnyPattern(joinedText, ANCILLARY_EVIDENCE_TEXT_PATTERNS[evidenceType] || [])
  );
}

function cleanupPhenotypeCoreLabel(label) {
  return String(label || '')
    .replace(/^[\s,;:\-]+/, '')
    .replace(/[\s,;:\-]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function extractMixedTreatmentResponseSplit(label) {
  const sourceLabel = String(label || '').trim();
  if (!sourceLabel) return null;

  for (const [pattern, source] of [
    [POST_NOMINAL_TREATMENT_RESPONSE_PATTERN, 'post_nominal_treatment_response_splitter'],
    [PRENOMINAL_TREATMENT_RESPONSE_PATTERN, 'prenominal_treatment_response_splitter']
  ]) {
    const match = sourceLabel.match(pattern);
    if (!match || !match[0]) continue;

    const qualifierText = match[0].trim();
    const phenotypeCoreLabel = cleanupPhenotypeCoreLabel(
      sourceLabel.replace(match[0], ' ')
    );

    if (!phenotypeCoreLabel || phenotypeCoreLabel.toLowerCase() === sourceLabel.toLowerCase()) {
      continue;
    }

    return {
      source,
      phenotype_core_label: phenotypeCoreLabel,
      derived_ancillary_evidence: [
        {
          ancillary_evidence_type: 'treatment_response',
          value_text: qualifierText,
          source
        }
      ]
    };
  }

  return null;
}

function isHighConfidenceAncillaryOnlyLabel(label, inferredTypes) {
  const labelText = String(label || '').trim();
  if (!labelText || inferredTypes.length === 0) return false;
  return inferredTypes.some((evidenceType) =>
    matchesAnyPattern(labelText, ANCILLARY_ONLY_LABEL_PATTERNS[evidenceType] || [])
  );
}

export function deterministicallyRouteEnrichmentReviewResults(cases, results) {
  const routedResults = [];
  const adjustments = [];

  for (let index = 0; index < results.length; index += 1) {
    const row = results[index] || {};
    const inputCase = cases[index] || {};
    const candidate = inputCase.candidate || {};
    const inferredAncillaryTypes = [
      ...new Set(
        [
          ...(row.ancillary_evidence_types || []),
          ...inferAncillaryEvidenceTypesFromTexts(candidate.label, candidate.source_sentence, row.reason)
        ].map(canonicalizeAncillaryEvidenceType).filter(Boolean)
      )
    ];
    const routedRow = {
      ...row,
      source_section: buildSourceSection(row, candidate),
      resolved_candidate_label: candidate.label || row.candidate_label || '',
      derived_ancillary_evidence: [],
      detail_types: Array.isArray(row.detail_types) ? [...row.detail_types] : [],
      ancillary_evidence_types: Array.isArray(row.ancillary_evidence_types)
        ? [...row.ancillary_evidence_types]
        : []
    };
    delete routedRow.evidence_scope;
    delete routedRow.source_location;
    delete routedRow.section_id;
    delete routedRow.section_heading;
    delete routedRow.paragraph_id;
    delete routedRow.paragraph_index;
    delete routedRow.sentence_id;
    const splitTreatmentResponse =
      row.bucket === 'keep_enrichment' ? extractMixedTreatmentResponseSplit(candidate.label) : null;

    if (splitTreatmentResponse) {
      routedRow.resolved_candidate_label = splitTreatmentResponse.phenotype_core_label;
      routedRow.derived_ancillary_evidence = splitTreatmentResponse.derived_ancillary_evidence;

      if (
        routedRow.detail_types.includes('clinical_course') &&
        !CLINICAL_COURSE_SIGNAL_PATTERN.test(splitTreatmentResponse.phenotype_core_label)
      ) {
        routedRow.detail_types = routedRow.detail_types.filter((detailType) => detailType !== 'clinical_course');
      }

      adjustments.push({
        index,
        candidate_label: candidate.label || row.candidate_label || '',
        sentence_id: row.sentence_id || candidate.sentence_id || '',
        source_location: mergeSourceLocationWithCandidate(row, candidate),
        original_bucket: row.bucket || null,
        original_retention_layer: row.retention_layer || null,
        routed_bucket: routedRow.bucket,
        routed_retention_layer: routedRow.retention_layer,
        derived_ancillary_evidence: splitTreatmentResponse.derived_ancillary_evidence,
        resolved_candidate_label: splitTreatmentResponse.phenotype_core_label,
        reason: splitTreatmentResponse.source
      });
    }

    const shouldRouteToAncillary =
      isHighConfidenceAncillaryOnlyLabel(candidate.label, inferredAncillaryTypes) &&
      (row.bucket === 'keep_enrichment' || DISCARDED_BUCKETS.includes(row.bucket));

    if (shouldRouteToAncillary) {
      routedRow.bucket = 'retain_as_ancillary';
      routedRow.retention_layer = 'ancillary_clinical_evidence';
      routedRow.adds_detail_beyond_anchor = false;
      routedRow.detail_types = [];
      routedRow.ancillary_evidence_types = inferredAncillaryTypes;

      adjustments.push({
        index,
        candidate_label: candidate.label || row.candidate_label || '',
        sentence_id: row.sentence_id || candidate.sentence_id || '',
        source_location: mergeSourceLocationWithCandidate(row, candidate),
        original_bucket: row.bucket || null,
        original_retention_layer: row.retention_layer || null,
        routed_bucket: routedRow.bucket,
        routed_retention_layer: routedRow.retention_layer,
        ancillary_evidence_types: inferredAncillaryTypes,
        reason: 'high_confidence_ancillary_only_label'
      });
    } else if (row.bucket === 'retain_as_ancillary') {
      routedRow.retention_layer = 'ancillary_clinical_evidence';
      routedRow.detail_types = [];
      routedRow.ancillary_evidence_types = inferredAncillaryTypes;
    }

    routedResults.push(routedRow);
  }

  return {
    results: routedResults,
    adjustments
  };
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
    const retentionLayer = ENRICHMENT_RETENTION_LAYERS.includes(row.retention_layer)
      ? row.retention_layer
      : null;
    const detailTypes = Array.isArray(row.detail_types)
      ? [...new Set(row.detail_types.map(canonicalizeDetailType).filter(Boolean))]
      : [];
    const invalidDetailTypes = Array.isArray(row.detail_types)
      ? row.detail_types.filter((detailType) => !canonicalizeDetailType(detailType))
      : [];
    const ancillaryEvidenceTypes = Array.isArray(row.ancillary_evidence_types)
      ? [...new Set(row.ancillary_evidence_types.map(canonicalizeAncillaryEvidenceType).filter(Boolean))]
      : [];
    const invalidAncillaryEvidenceTypes = Array.isArray(row.ancillary_evidence_types)
      ? row.ancillary_evidence_types.filter((evidenceType) => !canonicalizeAncillaryEvidenceType(evidenceType))
      : [];

    if (!bucket) {
      issues.push({
        index,
        type: 'invalid_bucket',
        value: row.bucket || null
      });
    }

    if (!retentionLayer) {
      issues.push({
        index,
        type: 'invalid_retention_layer',
        value: row.retention_layer || null
      });
    }

    if (invalidDetailTypes.length > 0) {
      issues.push({
        index,
        type: 'invalid_detail_types',
        value: invalidDetailTypes
      });
    }

    if (invalidAncillaryEvidenceTypes.length > 0) {
      issues.push({
        index,
        type: 'invalid_ancillary_evidence_types',
        value: invalidAncillaryEvidenceTypes
      });
    }

    if (bucket === 'keep_enrichment' && retentionLayer && retentionLayer !== 'phenotype_enrichment') {
      issues.push({
        index,
        type: 'bucket_retention_conflict',
        value: {
          bucket,
          retentionLayer
        }
      });
    }

    if (bucket === 'retain_as_ancillary' && retentionLayer && retentionLayer !== 'ancillary_clinical_evidence') {
      issues.push({
        index,
        type: 'bucket_retention_conflict',
        value: {
          bucket,
          retentionLayer
        }
      });
    }

    if (
      bucket &&
      bucket !== 'keep_enrichment' &&
      bucket !== 'retain_as_ancillary' &&
      retentionLayer &&
      retentionLayer !== 'discarded'
    ) {
      issues.push({
        index,
        type: 'bucket_retention_conflict',
        value: {
          bucket,
          retentionLayer
        }
      });
    }

    results.push({
      candidate_label: String(row.candidate_label || ''),
      source_section: buildSourceSection(row),
      bucket,
      retention_layer: retentionLayer,
      adds_detail_beyond_anchor: Boolean(row.adds_detail_beyond_anchor),
      detail_types: bucket === 'keep_enrichment' ? detailTypes : [],
      ancillary_evidence_types:
        bucket === 'retain_as_ancillary' ? ancillaryEvidenceTypes : [],
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
    results.every(
      (row) =>
        row.bucket &&
        row.retention_layer &&
        row.candidate_label &&
        row.reason
    );

  return {
    valid,
    issues,
    results
  };
}

export function buildEnrichmentReviewPrompt() {
  return `You are reviewing grounded GeneReviews candidates under an enrichment-first policy.

Return JSON with a top-level key "results" containing one item per case in the same order.
Each result must contain:
- candidate_label
- source_section
- bucket
- retention_layer
- adds_detail_beyond_anchor
- detail_types
- ancillary_evidence_types
- same_finding_as_anchor_labels
- reason

Allowed buckets:
- keep_enrichment
- retain_as_ancillary
- collapse_to_anchor
- broad_or_redundant
- junk_or_context_only

Allowed retention_layer values:
- phenotype_enrichment
- ancillary_clinical_evidence
- discarded

Allowed detail_types:
${buildEnrichmentDetailTypeSchemaText()}

Allowed ancillary_evidence_types:
${buildAncillaryEvidenceTypeSchemaText()}

Policy:
- Preserve clinically meaningful source detail beyond flattened HPO anchors.
- Keep subtype, pattern, morphology, distribution, laterality, modality, temporal qualifier, anatomical subsite, trigger, quantitative, pathophysiology, etiology, and clinical course detail when the source supports it.
- pathophysiology means an underlying biological, developmental, or physiologic abnormality within the patient that directly explains the retained finding and is itself clinically meaningful disease detail.
- etiology means an explicitly stated causal basis for the retained finding when that cause adds clinically meaningful specificity beyond the anchor and is not merely a gene, variant, inheritance pattern, or broad diagnosis label.
- clinical_course means the behavior of the finding over time after onset, such as recurrent, relapsing, transient, persistent, progressive, regressive, or episodic. It is not the same as age of onset.
- Do not collapse a candidate just because a broader anchor exists.
- Collapse only if the candidate is effectively the same anchored finding and adds no clinically meaningful specificity.
- Broad umbrella phrases go to broad_or_redundant.
- If a row is clinically useful but not phenotype enrichment because it is lab-only, imaging-only, pathology-only, electrophysiology-only, treatment-response, management, or clinical-test evidence, use retain_as_ancillary with retention_layer=ancillary_clinical_evidence and the best ancillary_evidence_types values.
- Use junk_or_context_only only for rows that should be discarded entirely, not for clinically useful ancillary evidence.
- If a candidate adds source-faithful differentiating detail that could matter later for mapping or disease differentiation, prefer keep_enrichment.
- Preserve the provided source_section field from the input case when it is available.

Retention-layer rules:
- keep_enrichment -> phenotype_enrichment
- retain_as_ancillary -> ancillary_clinical_evidence
- collapse_to_anchor, broad_or_redundant, junk_or_context_only -> discarded

Before you finalize the answer, do a schema pass:
- verify every retention_layer matches the bucket rules above
- verify every detail_types item is exactly one of the allowed values above
- verify every ancillary_evidence_types item is exactly one of the allowed values above
- if a detail_types or ancillary_evidence_types item is close but not exact, rewrite it to the closest allowed value or remove it
- do not invent any other detail_types labels
- do not invent any other ancillary_evidence_types labels

Output JSON only.`;
}

export async function runSchemaGuardedEnrichmentReview({
  apiKey,
  model,
  thinkingBudget,
  temperature,
  chapterKey,
  cases
}) {
  const primary = await callGeminiJson({
    apiKey,
    model,
    systemPrompt: buildEnrichmentReviewPrompt(),
    userPayload: {
      chapter_key: chapterKey,
      cases
    },
    temperature,
    thinkingBudget
  });

  let normalized = normalizeEnrichmentReviewPayload(primary.parsed, cases.length);
  let repaired = null;

  if (!normalized.valid) {
    repaired = await callGeminiJson({
      apiKey,
      model,
      systemPrompt: buildSchemaRepairPrompt(),
      userPayload: {
        chapter_key: chapterKey,
        cases,
        prior_output: primary.rawOutput,
        validation_issues: normalized.issues
      },
      temperature,
      thinkingBudget
    });
    normalized = normalizeEnrichmentReviewPayload(repaired.parsed, cases.length);
  }

  return {
    model,
    primary,
    repaired,
    normalized
  };
}

export function buildSchemaRepairPrompt() {
  return `You are repairing a prior GeneReviews enrichment review output to satisfy a strict schema.

Return JSON with a top-level key "results" containing one item per case in the same order.
Do not drop or reorder cases.
Do not invent candidate labels.
Preserve source_section when present.

Allowed buckets:
- keep_enrichment
- retain_as_ancillary
- collapse_to_anchor
- broad_or_redundant
- junk_or_context_only

Allowed retention_layer values:
- phenotype_enrichment
- ancillary_clinical_evidence
- discarded

Allowed detail_types:
${buildEnrichmentDetailTypeSchemaText()}

Allowed ancillary_evidence_types:
${buildAncillaryEvidenceTypeSchemaText()}

Repair rules:
- Every detail_types item must be from the allowed list above.
- Every ancillary_evidence_types item must be from the allowed list above.
- Every result must include a retention_layer consistent with the bucket.
- keep_enrichment -> phenotype_enrichment
- retain_as_ancillary -> ancillary_clinical_evidence
- collapse_to_anchor, broad_or_redundant, junk_or_context_only -> discarded
- If a prior value is close but not exact, map it to the closest allowed value.
- Examples of valid repairs:
  - severity -> severity_domain
  - pathology -> pathophysiology
  - progression -> clinical_course
- If no valid detail type remains, return an empty detail_types array.
- If no valid ancillary evidence type remains, return an empty ancillary_evidence_types array.
- Keep the bucket and reasoning aligned with the repaired detail types.
- Output JSON only.`;
}

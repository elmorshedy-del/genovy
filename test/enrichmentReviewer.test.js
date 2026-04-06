import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canonicalizeAncillaryEvidenceType,
  canonicalizeDetailType,
  deterministicallyRouteEnrichmentReviewResults,
  normalizeEnrichmentReviewPayload
} from '../src/lib/enrichmentReviewer.js';

test('canonicalizeDetailType maps close synonyms into the strict schema', () => {
  assert.equal(canonicalizeDetailType('severity'), 'severity_domain');
  assert.equal(canonicalizeDetailType('pathology'), 'pathophysiology');
  assert.equal(canonicalizeDetailType('progression'), 'clinical_course');
  assert.equal(canonicalizeDetailType('anatomic subsite'), 'anatomical_subsite');
  assert.equal(canonicalizeDetailType('made_up_label'), null);
});

test('canonicalizeAncillaryEvidenceType maps close synonyms into the strict schema', () => {
  assert.equal(canonicalizeAncillaryEvidenceType('lab'), 'laboratory');
  assert.equal(canonicalizeAncillaryEvidenceType('histopathology'), 'pathology');
  assert.equal(canonicalizeAncillaryEvidenceType('medication_response'), 'treatment_response');
  assert.equal(canonicalizeAncillaryEvidenceType('exam'), 'clinical_test');
  assert.equal(canonicalizeAncillaryEvidenceType('made_up_label'), null);
});

test('normalizeEnrichmentReviewPayload repairs aliases and reports invalid detail types', () => {
  const payload = {
    results: [
      {
        candidate_label: 'leopard spot pigmentary retinopathy',
        sentence_id: 'p6_s4',
        bucket: 'keep_enrichment',
        retention_layer: 'phenotype_enrichment',
        adds_detail_beyond_anchor: true,
        detail_types: ['pattern', 'pathology', 'not_real'],
        ancillary_evidence_types: ['lab'],
        same_finding_as_anchor_labels: ['Pigmentary retinopathy'],
        reason: 'Adds a distinct retinal pattern.'
      }
    ]
  };

  const normalized = normalizeEnrichmentReviewPayload(payload, 1);
  assert.equal(normalized.valid, false);
  assert.deepEqual(normalized.results[0].detail_types, ['pattern', 'pathophysiology']);
  assert.deepEqual(normalized.results[0].ancillary_evidence_types, []);
  assert.deepEqual(normalized.issues, [
    {
      index: 0,
      type: 'invalid_detail_types',
      value: ['not_real']
    }
  ]);
});

test('normalizeEnrichmentReviewPayload canonicalizes ancillary rows and preserves ancillary evidence types', () => {
  const payload = {
    results: [
      {
        candidate_label: 'autoantibodies to factor VIII',
        sentence_id: 'p3_s8',
        bucket: 'retain_as_ancillary',
        retention_layer: 'ancillary_clinical_evidence',
        adds_detail_beyond_anchor: false,
        detail_types: ['pattern'],
        ancillary_evidence_types: ['lab', 'histopathology', 'made_up_label'],
        same_finding_as_anchor_labels: [],
        reason: 'Clinically useful laboratory and pathology evidence outside phenotype enrichment.'
      }
    ]
  };

  const normalized = normalizeEnrichmentReviewPayload(payload, 1);
  assert.equal(normalized.valid, false);
  assert.deepEqual(normalized.results[0].detail_types, []);
  assert.deepEqual(normalized.results[0].ancillary_evidence_types, ['laboratory', 'pathology']);
  assert.deepEqual(normalized.issues, [
    {
      index: 0,
      type: 'invalid_ancillary_evidence_types',
      value: ['made_up_label']
    }
  ]);
});

test('normalizeEnrichmentReviewPayload reports bucket and retention-layer conflicts', () => {
  const payload = {
    results: [
      {
        candidate_label: 'persistent dermatitis resistant to therapy',
        sentence_id: 'p3_s4',
        bucket: 'retain_as_ancillary',
        retention_layer: 'discarded',
        adds_detail_beyond_anchor: false,
        detail_types: [],
        ancillary_evidence_types: ['treatment'],
        same_finding_as_anchor_labels: [],
        reason: 'Treatment-response detail should be ancillary, not discarded.'
      }
    ]
  };

  const normalized = normalizeEnrichmentReviewPayload(payload, 1);
  assert.equal(normalized.valid, false);
  assert.deepEqual(normalized.results[0].ancillary_evidence_types, ['treatment_response']);
  assert.deepEqual(normalized.issues, [
    {
      index: 0,
      type: 'bucket_retention_conflict',
      value: {
        bucket: 'retain_as_ancillary',
        retentionLayer: 'discarded'
      }
    }
  ]);
});

test('deterministicallyRouteEnrichmentReviewResults reroutes pure ancillary-only rows', () => {
  const cases = [
    {
      candidate: {
        label: 'autoantibodies to factor VIII',
        sentence_id: 'p33_s1',
        source_sentence: 'Some individuals developed autoantibodies to factor VIII.'
      }
    },
    {
      candidate: {
        label: 'polyomaviremia',
        sentence_id: 'p34_s1',
        source_sentence: 'Polyomaviremia was detected during follow-up.'
      }
    }
  ];
  const results = [
    {
      candidate_label: 'autoantibodies to factor VIII',
      sentence_id: 'p33_s1',
      bucket: 'junk_or_context_only',
      retention_layer: 'discarded',
      adds_detail_beyond_anchor: false,
      detail_types: [],
      ancillary_evidence_types: [],
      same_finding_as_anchor_labels: [],
      reason: 'Laboratory evidence.'
    },
    {
      candidate_label: 'polyomaviremia',
      sentence_id: 'p34_s1',
      bucket: 'keep_enrichment',
      retention_layer: 'phenotype_enrichment',
      adds_detail_beyond_anchor: true,
      detail_types: ['etiology'],
      ancillary_evidence_types: [],
      same_finding_as_anchor_labels: [],
      reason: 'Detected virus in blood.'
    }
  ];

  const routed = deterministicallyRouteEnrichmentReviewResults(cases, results);
  assert.equal(routed.adjustments.length, 2);
  assert.deepEqual(
    routed.results.map((row) => ({
      bucket: row.bucket,
      retention_layer: row.retention_layer,
      ancillary_evidence_types: row.ancillary_evidence_types,
      detail_types: row.detail_types
    })),
    [
      {
        bucket: 'retain_as_ancillary',
        retention_layer: 'ancillary_clinical_evidence',
        ancillary_evidence_types: ['laboratory'],
        detail_types: []
      },
      {
        bucket: 'retain_as_ancillary',
        retention_layer: 'ancillary_clinical_evidence',
        ancillary_evidence_types: ['laboratory'],
        detail_types: []
      }
    ]
  );
});

test('deterministicallyRouteEnrichmentReviewResults leaves non-split phenotype rows untouched', () => {
  const cases = [
    {
      candidate: {
        label: 'recurrent lower-respiratory disease',
        sentence_id: 'p27_s1',
        source_sentence: 'Recurrent lower-respiratory disease was reported.'
      }
    }
  ];
  const results = [
    {
      candidate_label: 'recurrent lower-respiratory disease',
      sentence_id: 'p27_s1',
      bucket: 'keep_enrichment',
      retention_layer: 'phenotype_enrichment',
      adds_detail_beyond_anchor: true,
      detail_types: ['clinical_course'],
      ancillary_evidence_types: [],
      same_finding_as_anchor_labels: [],
      reason: 'Recurrent disease adds clinical course detail.'
    }
  ];

  const routed = deterministicallyRouteEnrichmentReviewResults(cases, results);
  assert.equal(routed.adjustments.length, 0);
  assert.equal(routed.results[0].bucket, 'keep_enrichment');
  assert.equal(routed.results[0].retention_layer, 'phenotype_enrichment');
  assert.deepEqual(routed.results[0].detail_types, ['clinical_course']);
  assert.deepEqual(routed.results[0].ancillary_evidence_types, []);
});

test('deterministicallyRouteEnrichmentReviewResults splits post-nominal treatment-response qualifiers', () => {
  const cases = [
    {
      candidate: {
        label: 'persistent dermatitis resistant to therapy',
        sentence_id: 'p27_s1',
        source_sentence: 'Persistent dermatitis resistant to therapy was reported.'
      }
    }
  ];
  const results = [
    {
      candidate_label: 'persistent dermatitis resistant to therapy',
      sentence_id: 'p27_s1',
      bucket: 'keep_enrichment',
      retention_layer: 'phenotype_enrichment',
      adds_detail_beyond_anchor: true,
      detail_types: ['clinical_course'],
      ancillary_evidence_types: [],
      same_finding_as_anchor_labels: ['Dermatitis'],
      reason: 'Persistent dermatitis is phenotype enrichment.'
    }
  ];

  const routed = deterministicallyRouteEnrichmentReviewResults(cases, results);
  assert.equal(routed.results[0].resolved_candidate_label, 'persistent dermatitis');
  assert.deepEqual(routed.results[0].detail_types, ['clinical_course']);
  assert.deepEqual(routed.results[0].derived_ancillary_evidence, [
    {
      ancillary_evidence_type: 'treatment_response',
      value_text: 'resistant to therapy',
      source: 'post_nominal_treatment_response_splitter'
    }
  ]);
});

test('deterministicallyRouteEnrichmentReviewResults splits prenominal treatment-response qualifiers and clears unsupported course tags', () => {
  const cases = [
    {
      candidate: {
        label: 'treatment-refractory immune thrombocytopenia',
        sentence_id: 'p32_s1',
        source_sentence: 'Treatment-refractory immune thrombocytopenia was observed.'
      }
    }
  ];
  const results = [
    {
      candidate_label: 'treatment-refractory immune thrombocytopenia',
      sentence_id: 'p32_s1',
      bucket: 'keep_enrichment',
      retention_layer: 'phenotype_enrichment',
      adds_detail_beyond_anchor: true,
      detail_types: ['clinical_course'],
      ancillary_evidence_types: [],
      same_finding_as_anchor_labels: ['Immune thrombocytopenia'],
      reason: 'Immune thrombocytopenia with treatment refractoriness.'
    }
  ];

  const routed = deterministicallyRouteEnrichmentReviewResults(cases, results);
  assert.equal(routed.results[0].resolved_candidate_label, 'immune thrombocytopenia');
  assert.deepEqual(routed.results[0].detail_types, []);
  assert.deepEqual(routed.results[0].derived_ancillary_evidence, [
    {
      ancillary_evidence_type: 'treatment_response',
      value_text: 'treatment-refractory',
      source: 'prenominal_treatment_response_splitter'
    }
  ]);
});

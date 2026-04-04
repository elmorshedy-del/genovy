import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canonicalizeDetailType,
  normalizeEnrichmentReviewPayload
} from '../src/lib/enrichmentReviewer.js';

test('canonicalizeDetailType maps close synonyms into the strict schema', () => {
  assert.equal(canonicalizeDetailType('severity'), 'severity_domain');
  assert.equal(canonicalizeDetailType('pathology'), 'pathophysiology');
  assert.equal(canonicalizeDetailType('progression'), 'clinical_course');
  assert.equal(canonicalizeDetailType('anatomic subsite'), 'anatomical_subsite');
  assert.equal(canonicalizeDetailType('made_up_label'), null);
});

test('normalizeEnrichmentReviewPayload repairs aliases and reports invalid detail types', () => {
  const payload = {
    results: [
      {
        candidate_label: 'leopard spot pigmentary retinopathy',
        sentence_id: 'p6_s4',
        bucket: 'keep_enrichment',
        adds_detail_beyond_anchor: true,
        detail_types: ['pattern', 'pathology', 'not_real'],
        same_finding_as_anchor_labels: ['Pigmentary retinopathy'],
        reason: 'Adds a distinct retinal pattern.'
      }
    ]
  };

  const normalized = normalizeEnrichmentReviewPayload(payload, 1);
  assert.equal(normalized.valid, false);
  assert.deepEqual(normalized.results[0].detail_types, ['pattern', 'pathophysiology']);
  assert.deepEqual(normalized.issues, [
    {
      index: 0,
      type: 'invalid_detail_types',
      value: ['not_real']
    }
  ]);
});

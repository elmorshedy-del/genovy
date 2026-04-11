import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPhenopacketFeaturePrompt,
  normalizePhenopacketFeaturePayload
} from '../src/lib/phenopacketFeatureDecomposition.js';

test('buildPhenopacketFeaturePrompt includes Phenopacket-aligned schema contract', () => {
  const prompt = buildPhenopacketFeaturePrompt();
  assert.match(prompt, /phenotypic_feature/);
  assert.match(prompt, /type: \{ id: string\|null, label: string \}/);
  assert.match(prompt, /severity/);
  assert.match(prompt, /onset/);
  assert.match(prompt, /modifiers/);
});

test('normalizePhenopacketFeaturePayload validates modifier kinds and required evidence fields', () => {
  const normalized = normalizePhenopacketFeaturePayload({
    results: [
      {
        candidate_label: 'progressive sensorineural hearing loss',
        sentence_id: 's1',
        paragraph_id: 'p1',
        paragraph_index: 1,
        section_id: 'clinical_description',
        section_heading: 'Clinical Description',
        phenotypic_feature: {
          type: { id: null, label: 'hearing loss' },
          excluded: false,
          severity: null,
          onset: null,
          modifiers: [
            {
              modifier_kind: 'clinical_course',
              label: 'progressive',
              evidence_text: 'progressive'
            },
            {
              modifier_kind: 'bad_kind',
              label: 'wrong',
              evidence_text: 'wrong'
            }
          ],
          evidence: {
            evidence_text: 'progressive sensorineural hearing loss',
            source_sentence: 'The patient has progressive sensorineural hearing loss.',
            evidence_scope: 'sentence'
          }
        },
        notes: []
      }
    ]
  }, 1);

  assert.equal(normalized.valid, false);
  assert.deepEqual(normalized.results[0].phenotypic_feature.modifiers, [
    {
      modifier_kind: 'clinical_course',
      label: 'progressive',
      evidence_text: 'progressive'
    }
  ]);
  assert.deepEqual(normalized.issues, [
    {
      index: 0,
      type: 'invalid_modifier_kinds',
      value: ['bad_kind']
    }
  ]);
  assert.equal(normalized.results[0].phenotypic_feature.evidence.evidence_scope, 'sentence');
  assert.equal(normalized.results[0].phenotypic_feature.evidence.paragraph_id, 'p1');
  assert.equal(normalized.results[0].phenotypic_feature.evidence.section_id, 'clinical_description');
});

test('normalizePhenopacketFeaturePayload reports missing core fields', () => {
  const normalized = normalizePhenopacketFeaturePayload({
    results: [
      {
        candidate_label: '',
        sentence_id: '',
        phenotypic_feature: {
          type: { id: null, label: '' },
          excluded: false,
          severity: null,
          onset: null,
          modifiers: [],
          evidence: {
            evidence_text: '',
            source_sentence: ''
          }
        },
        notes: []
      }
    ]
  }, 1);

  assert.deepEqual(
    normalized.issues.map((issue) => issue.type),
    ['missing_candidate_label', 'missing_sentence_id', 'missing_type_label', 'missing_evidence_text', 'missing_source_sentence']
  );
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPhenotypeDetailDecompositionPrompt,
  normalizePhenotypeDetailDecompositionPayload
} from '../src/lib/phenotypeDetailDecomposition.js';

test('buildPhenotypeDetailDecompositionPrompt includes strict detail type contract', () => {
  const prompt = buildPhenotypeDetailDecompositionPrompt();
  assert.match(prompt, /core_problem/);
  assert.match(prompt, /modifier_details/);
  assert.match(prompt, /severity_domain/);
  assert.match(prompt, /clinical_course/);
  assert.match(prompt, /temporal_qualifier/);
  assert.match(prompt, /Output JSON only/);
});

test('normalizePhenotypeDetailDecompositionPayload canonicalizes close detail aliases and drops invalid types', () => {
  const normalized = normalizePhenotypeDetailDecompositionPayload({
    results: [
      {
        candidate_label: 'progressive sensorineural hearing loss',
        sentence_id: 's1',
        paragraph_id: 'p1',
        paragraph_index: 1,
        section_id: 'clinical_description',
        section_heading: 'Clinical Description',
        core_problem: 'sensorineural hearing loss',
        modifier_details: [
          {
            detail_type: 'progression',
            value_text: 'progressive',
            evidence_text: 'progressive'
          },
          {
            detail_type: 'onset',
            value_text: 'childhood-onset',
            evidence_text: 'childhood-onset'
          },
          {
            detail_type: 'made_up',
            value_text: 'bad',
            evidence_text: 'bad'
          }
        ],
        notes: ['ok']
      }
    ]
  }, 1);

  assert.equal(normalized.valid, false);
  assert.deepEqual(normalized.results[0].modifier_details, [
    {
      detail_type: 'clinical_course',
      value_text: 'progressive',
      evidence_text: 'progressive'
    },
    {
      detail_type: 'temporal_qualifier',
      value_text: 'childhood-onset',
      evidence_text: 'childhood-onset'
    }
  ]);
  assert.deepEqual(normalized.issues, [
    {
      index: 0,
      type: 'invalid_detail_types',
      value: ['made_up']
    }
  ]);
  assert.equal(normalized.results[0].evidence_scope, 'sentence');
  assert.deepEqual(normalized.results[0].source_location, {
    section_id: 'clinical_description',
    section_heading: 'Clinical Description',
    paragraph_id: 'p1',
    paragraph_index: 1,
    sentence_id: 's1'
  });
});

test('normalizePhenotypeDetailDecompositionPayload dedupes modifier rows and reports missing required fields', () => {
  const normalized = normalizePhenotypeDetailDecompositionPayload({
    results: [
      {
        candidate_label: '',
        sentence_id: '',
        core_problem: '',
        modifier_details: [
          {
            detail_type: 'severity_domain',
            value_text: 'severe',
            evidence_text: 'severe'
          },
          {
            detail_type: 'severity_domain',
            value_text: 'severe',
            evidence_text: 'severe'
          }
        ],
        notes: []
      }
    ]
  }, 1);

  assert.equal(normalized.results[0].modifier_details.length, 1);
  assert.deepEqual(
    normalized.issues.map((issue) => issue.type),
    ['missing_candidate_label', 'missing_sentence_id', 'missing_core_problem']
  );
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractDxPhenotypeInput,
  extractPhenopacketCaseId,
  extractPhenopacketDiseaseCuries,
  parseDxLimit,
  validateDxPhenotypeInput
} from '../src/lib/phenopackets.js';

test('extractDxPhenotypeInput reads present and excluded HPO terms from a Phenopacket', () => {
  const input = extractDxPhenotypeInput({
    phenopacket: {
      phenotypicFeatures: [
        { type: { id: 'HP:0001250' } },
        { type: { id: 'http://purl.obolibrary.org/obo/HP_0000256' } },
        { type: { id: 'HP:0001290' }, excluded: true },
        { type: { id: 'MONDO:0007739' } }
      ]
    }
  });

  assert.deepEqual(input.presentPhenotypeCuries, ['HP:0001250', 'HP:0000256']);
  assert.deepEqual(input.excludedPhenotypeCuries, ['HP:0001290']);
  assert.equal(input.sourceFormat, 'phenopacket');
});

test('extractDxPhenotypeInput supports plain HPO term arrays', () => {
  const input = extractDxPhenotypeInput({
    hpoTerms: ['HP:0001250', { id: 'HP:0000256' }, { curie: 'HP:0001290' }]
  });

  assert.deepEqual(input.presentPhenotypeCuries, ['HP:0001250', 'HP:0000256', 'HP:0001290']);
  assert.equal(input.sourceFormat, 'hpo_terms');
});

test('parseDxLimit clamps invalid and oversized values', () => {
  assert.equal(parseDxLimit(undefined), 10);
  assert.equal(parseDxLimit('0'), 10);
  assert.equal(parseDxLimit('999'), 250);
  assert.equal(parseDxLimit('7'), 7);
});

test('extractPhenopacketDiseaseCuries reads diseases and diagnoses from a Phenopacket', () => {
  const diseaseCuries = extractPhenopacketDiseaseCuries({
    diseases: [
      { term: { id: 'MONDO:0007739' } },
      { term: { identifier: 'OMIM:143100' }, excluded: true }
    ],
    interpretations: [
      {
        diagnosis: {
          disease: {
            term: { id: 'ORPHA:399' }
          }
        }
      }
    ]
  });

  assert.deepEqual(diseaseCuries, ['MONDO:0007739', 'ORPHA:399']);
});

test('extractPhenopacketCaseId prefers packet id and falls back safely', () => {
  assert.equal(extractPhenopacketCaseId({ id: 'case-123', subject: { id: 'subject-1' } }), 'case-123');
  assert.equal(extractPhenopacketCaseId({ subject: { id: 'subject-1' } }), 'subject-1');
  assert.equal(extractPhenopacketCaseId({}, 'fallback-case'), 'fallback-case');
});

test('validateDxPhenotypeInput rejects empty requests', () => {
  const error = validateDxPhenotypeInput({
    presentPhenotypeCuries: [],
    excludedPhenotypeCuries: [],
    sourceFormat: 'unknown'
  });

  assert.match(error, /At least 1 HPO term is required/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLINICAL_PROFILE_CONSTANTS,
  collectQualifierCuries,
  parseProfileLimit,
  summarizeProfileRows
} from '../src/lib/clinicalProfiles.js';

test('parseProfileLimit clamps invalid and oversized values', () => {
  assert.equal(parseProfileLimit(undefined), CLINICAL_PROFILE_CONSTANTS.defaultLimit);
  assert.equal(parseProfileLimit('0'), CLINICAL_PROFILE_CONSTANTS.defaultLimit);
  assert.equal(parseProfileLimit('-5'), CLINICAL_PROFILE_CONSTANTS.defaultLimit);
  assert.equal(parseProfileLimit('99999'), CLINICAL_PROFILE_CONSTANTS.maxLimit);
  assert.equal(parseProfileLimit('25'), 25);
});

test('collectQualifierCuries normalizes unique qualifier values', () => {
  const curies = collectQualifierCuries([
    {
      qualifiers_json: {
        onset: 'http://purl.obolibrary.org/obo/HP_0011460',
        frequency: 'HP:0040281',
        modifier: 'HP:0012823'
      }
    },
    {
      qualifiers_json: {
        onset: 'HP:0011460',
        modifier: 'HP:0012823'
      }
    }
  ]);

  assert.deepEqual(curies.sort(), ['HP:0011460', 'HP:0012823', 'HP:0040281']);
});

test('summarizeProfileRows splits supporting and excluding observations', () => {
  const qualifierLabels = new Map([
    ['HP:0011460', 'Childhood onset'],
    ['HP:0040281', 'Frequent'],
    ['HP:0012823', 'Progressive']
  ]);

  const summary = summarizeProfileRows(
    [
      {
        predicate_key: 'has_phenotype',
        phenotype_curie: 'HP:0001250',
        phenotype_label: 'Seizure',
        qualifiers_json: {
          onset: 'HP:0011460',
          frequency: 'HP:0040281',
          modifier: 'HP:0012823',
          sex: 'female'
        },
        evidence_code: 'IEA',
        confidence_score: '0.82',
        provenance_url: 'https://example.test/source',
        source_record_key: 'row-1'
      },
      {
        predicate_key: 'lacks_phenotype',
        phenotype_curie: 'HP:0001290',
        phenotype_label: 'Generalized hypotonia',
        qualifiers_json: {},
        evidence_code: 'TAS',
        confidence_score: null,
        provenance_url: '',
        source_record_key: 'row-2'
      }
    ],
    qualifierLabels
  );

  assert.equal(summary.positivePhenotypeCount, 1);
  assert.equal(summary.negativePhenotypeCount, 1);
  assert.equal(summary.positiveObservations[0].onset.label, 'Childhood onset');
  assert.equal(summary.positiveObservations[0].frequency.label, 'Frequent');
  assert.equal(summary.positiveObservations[0].modifier.label, 'Progressive');
  assert.equal(summary.negativeObservations[0].phenotypeLabel, 'Generalized hypotonia');
});

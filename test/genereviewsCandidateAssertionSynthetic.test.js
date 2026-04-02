import test from 'node:test';
import assert from 'node:assert/strict';
import { finalizePhenotypeCandidates } from '../src/lib/genereviewsPipeline.js';
import {
  EXPECTED_SYNTHETIC_ASSERTION_CASE_COUNT,
  GENEREVIEWS_CANDIDATE_ASSERTION_SYNTHETIC_CASES
} from './fixtures/genereviewsCandidateAssertionSynthetic.js';

function buildSyntheticClinicalStructure(sentence) {
  return {
    chapter_title: 'Synthetic Assertion Regression',
    paragraphs: [
      {
        text: sentence,
        section_id: 'synthetic_section',
        section_heading: 'Clinical Description',
        paragraph_id: 'synthetic_paragraph_1',
        paragraph_index: 0,
        char_start: 0,
        char_end: sentence.length,
        local_clinical_domains: ['Synthetic'],
        sentences: [
          {
            text: sentence,
            sentence_id: 'synthetic_sentence_1',
            sentence_index: 0,
            char_start: 0,
            char_end: sentence.length
          }
        ]
      }
    ]
  };
}

function resolveSyntheticOutcome(result) {
  if (result.candidates.length === 1 && result.rejectedCandidates.length === 0) {
    const candidate = result.candidates[0];
    return {
      outcome: candidate.status === 'excluded' ? 'excluded' : 'present',
      row: candidate
    };
  }

  if (result.candidates.length === 0 && result.rejectedCandidates.length === 1) {
    return {
      outcome: 'rejected',
      row: result.rejectedCandidates[0]
    };
  }

  assert.fail(`Unexpected synthetic result shape: ${JSON.stringify(result)}`);
}

test('synthetic candidate assertion fixture contains exactly 100 cases', () => {
  assert.equal(GENEREVIEWS_CANDIDATE_ASSERTION_SYNTHETIC_CASES.length, EXPECTED_SYNTHETIC_ASSERTION_CASE_COUNT);
});

test('synthetic candidate assertion cases produce expected Stage 3 outcomes', async (t) => {
  for (const fixture of GENEREVIEWS_CANDIDATE_ASSERTION_SYNTHETIC_CASES) {
    await t.test(`${fixture.id} ${fixture.category}`, () => {
      const result = finalizePhenotypeCandidates(
        [
          {
            label: fixture.label,
            status: fixture.modelStatus
          }
        ],
        [],
        buildSyntheticClinicalStructure(fixture.sentence),
        'llm_candidate'
      );

      const resolved = resolveSyntheticOutcome(result);
      assert.equal(resolved.outcome, fixture.expectedOutcome);

      if (fixture.expectedOrigin !== undefined) {
        assert.equal(resolved.row.assertion_status_origin ?? null, fixture.expectedOrigin);
      }

      if (fixture.expectedReason !== undefined) {
        assert.equal(resolved.row.assertion_reason ?? null, fixture.expectedReason);
      }

      if (resolved.outcome === 'rejected') {
        assert.equal(resolved.row.source_sentence, fixture.sentence);
      } else {
        assert.equal(resolved.row.source_sentence, fixture.sentence);
        assert.equal(
          String(resolved.row.assertion_evidence || '').toLowerCase().includes(String(fixture.label || '').toLowerCase()),
          true
        );
      }
    });
  }
});

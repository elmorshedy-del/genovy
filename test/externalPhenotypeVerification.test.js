import test from 'node:test';
import assert from 'node:assert/strict';

import { buildExternalGroundingReviewArtifacts } from '../src/lib/externalPhenotypeVerification.js';

function buildClinicalStructure(sentence) {
  return {
    paragraphs: [
      {
        text: sentence,
        char_start: 0,
        char_end: sentence.length,
        section_id: 'clinical_description',
        section_heading: 'Clinical Description',
        paragraph_id: 'p1',
        sentences: [
          {
            text: sentence,
            char_start: 0,
            char_end: sentence.length,
            sentence_id: 'p1_s1'
          }
        ]
      }
    ]
  };
}

function buildGroundedPayload(overrides = {}) {
  const sentence = 'Affected individuals often have global delay.';
  const matchText = 'Affected individuals often have global delay';
  const matchStart = sentence.indexOf(matchText);

  return {
    chapter: {
      chapter_key: 'williams_syndrome',
      nbk_id: 'NBK1249',
      title: 'Williams Syndrome',
      source_url: 'https://www.ncbi.nlm.nih.gov/books/NBK1249/'
    },
    grounded_candidates: [
      {
        label: 'developmental delay',
        status: 'present',
        source_quote: matchText,
        source_sentence: sentence,
        section_id: 'clinical_description',
        section_heading: 'Clinical Description',
        paragraph_id: 'p1',
        sentence_id: 'p1_s1',
        sentence_char_start: 0,
        sentence_char_end: sentence.length,
        match_char_start: matchStart,
        match_char_end: matchStart + matchText.length,
        quote_match_type: 'source_quote_exact',
        grounding_confidence: 'high',
        ...overrides
      }
    ],
    rejected_candidates: []
  };
}

test('buildExternalGroundingReviewArtifacts verifies source_quote verbatim in chapter text', () => {
  const sentence = 'Affected individuals often have global delay.';
  const result = buildExternalGroundingReviewArtifacts(buildGroundedPayload(), buildClinicalStructure(sentence));
  const exactCheck = result.candidateVerifications[0].checks.find((check) => check.name === 'source_quote_verbatim_chapter');

  assert.equal(exactCheck?.status, 'pass');
  assert.equal(exactCheck?.occurrence_count, 1);
  assert.equal(result.candidateVerifications[0].verdict, 'VERIFIED');
});

test('buildExternalGroundingReviewArtifacts repairs normalized-but-not-verbatim source quotes from match span', () => {
  const sentence = 'Affected individuals often have global delay.';
  const result = buildExternalGroundingReviewArtifacts(
    buildGroundedPayload({
      source_quote: 'Affected individuals  often have global delay',
      quote_match_type: 'source_quote_loose'
    }),
    buildClinicalStructure(sentence)
  );

  const repairCheck = result.candidateVerifications[0].checks.find((check) => check.name === 'source_quote_repair');
  const exactCheck = result.candidateVerifications[0].checks.find((check) => check.name === 'source_quote_verbatim_chapter');
  const supportCheck = result.candidateVerifications[0].checks.find((check) => check.name === 'source_quote_support');

  assert.equal(repairCheck?.status, 'pass');
  assert.equal(repairCheck?.repaired_quote, 'Affected individuals often have global delay');
  assert.equal(exactCheck?.status, 'pass');
  assert.equal(supportCheck?.status, 'pass');
  assert.equal(result.candidateVerifications[0].verdict, 'VERIFIED');
  assert.equal(result.groundedCandidatesWithReview[0].source_quote, 'Affected individuals often have global delay');
  assert.equal(result.groundedCandidatesWithReview[0].source_quote_original, 'Affected individuals  often have global delay');
  assert.equal(result.groundedCandidatesWithReview[0].source_quote_repaired, true);
});

test('buildExternalGroundingReviewArtifacts still fails unrepairable non-verbatim source quotes', () => {
  const sentence = 'Affected individuals often have global delay.';
  const result = buildExternalGroundingReviewArtifacts(
    buildGroundedPayload({
      source_quote: 'Affected individuals  often have global delay',
      quote_match_type: 'source_quote_loose',
      match_char_start: null,
      match_char_end: null
    }),
    buildClinicalStructure(sentence)
  );

  const repairCheck = result.candidateVerifications[0].checks.find((check) => check.name === 'source_quote_repair');
  const exactCheck = result.candidateVerifications[0].checks.find((check) => check.name === 'source_quote_verbatim_chapter');

  assert.equal(repairCheck?.status, 'flag');
  assert.equal(exactCheck?.status, 'fail');
  assert.equal(result.candidateVerifications[0].verdict, 'FAILED');
});

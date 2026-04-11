import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  buildExternalCandidateSignature,
  buildExternalBioLordRequestPayload,
  buildExternalEnrichmentCases,
  buildExternalMappingInputPayload,
  deriveExternalReviewOutputPath,
  mapExternalCandidatesWithGoogleHealthcareResponses,
  mapExternalMappingInputExactFromPath,
  mergeExternalMappedCandidates
} from '../src/lib/externalPhenotypeEnrichment.js';

test('deriveExternalReviewOutputPath rewrites enrichment case filenames into review output filenames', () => {
  const derived = deriveExternalReviewOutputPath('/tmp/Williams_Syndrome_enrichment_cases_biolord.json');
  assert.equal(derived, '/tmp/Williams_Syndrome_enrichment_review_biolord.json');
});

test('mapExternalCandidatesWithGoogleHealthcareResponses converts Healthcare NLP HPO codes into mapped candidates', () => {
  const mappingInput = {
    chapter_key: 'williams_syndrome',
    chapter_title: 'Williams Syndrome',
    candidates: [
      {
        label: 'progressive sensorineural hearing loss',
        status: 'present',
        source: 'external_grounded_candidate',
        source_quote: 'Progressive sensorineural hearing loss has been observed',
        source_sentence: 'Progressive sensorineural hearing loss has been observed.',
        sentence_id: 'p5_s4',
        paragraph_id: 'p5'
      },
      {
        label: 'born post-term',
        status: 'present',
        source: 'external_grounded_candidate',
        source_quote: 'born post-term',
        source_sentence: 'Infants with WS are often born post-term.',
        sentence_id: 'p15_s2',
        paragraph_id: 'p15'
      }
    ]
  };

  const responseEntries = [
    {
      document_content: 'Progressive sensorineural hearing loss has been observed.',
      response: {
        entityMentions: [
          {
            type: 'PROBLEM',
            text: { content: 'sensorineural hearing loss', beginOffset: 12 },
            linkedEntities: [{ entityId: 'UMLS/C0018784' }],
            confidence: 0.7665
          }
        ],
        entities: [
          {
            entityId: 'UMLS/C0018784',
            preferredTerm: 'Sensorineural Hearing Loss (disorder)',
            vocabularyCodes: ['HPO/HP:0000407', 'ICD10CM/H90.5']
          }
        ]
      }
    },
    {
      document_content: 'Infants with WS are often born post-term.',
      response: {
        entityMentions: [],
        entities: []
      }
    }
  ];

  const phenotypeRows = [
    {
      canonical_curie: 'HP:0000407',
      canonical_label: 'Sensorineural hearing impairment',
      aliases: []
    }
  ];

  const mapped = mapExternalCandidatesWithGoogleHealthcareResponses(mappingInput, responseEntries, phenotypeRows);
  assert.equal(mapped[0].mapped_hpo_id, 'HP:0000407');
  assert.equal(mapped[0].mapped_hpo_label, 'Sensorineural hearing impairment');
  assert.equal(mapped[0].hpo_mapping_trust, 'high');
  assert.equal(mapped[0].healthcare_mention_text, 'sensorineural hearing loss');
  assert.deepEqual(mapped[0].top_matches, [
    {
      hpo_id: 'HP:0000407',
      hpo_label: 'Sensorineural hearing impairment',
      score: 0.7665
    }
  ]);
  assert.equal(mapped[1].mapped_hpo_id, null);
  assert.equal(mapped[1].hpo_mapping_trust, 'reject');
});

test('buildExternalMappingInputPayload preserves quote-first grounded evidence for HPO mapping', () => {
  const grounded = {
    stage: 'external_extraction_grounded',
    chapter: {
      chapter_key: 'williams_syndrome',
      nbk_id: 'NBK1249',
      title: 'Williams Syndrome'
    },
    grounded_candidates: [
      {
        label: 'developmental delay',
        status: 'present',
        source_quote: 'Williams syndrome (WS) is characterized by developmental delay',
        source_sentence: 'Williams syndrome (WS) is characterized by developmental delay.',
        sentence_id: 'p1_s1',
        paragraph_id: 'p1',
        section_id: 'clinical_description',
        assertion_status_origin: 'external_present',
        verification_verdict: 'VERIFIED',
        auto_accept_eligible: true,
        auto_accept_reasons: []
      },
      {
        label: 'cataracts',
        status: 'uncertain',
        source_quote: 'Cataracts have been reported in adults',
        source_sentence: 'Cataracts have been reported in adults.',
        sentence_id: 'p22_s4',
        paragraph_id: 'p22',
        section_id: 'ocular',
        verification_verdict: 'FLAGGED',
        auto_accept_eligible: false,
        auto_accept_reasons: ['uncertain_bucket_requires_review']
      }
    ]
  };

  const payload = buildExternalMappingInputPayload(grounded);
  assert.equal(payload.stage, 'external_grounded_mapping_input');
  assert.equal(payload.chapter_key, 'williams_syndrome');
  assert.equal(payload.candidate_count, 2);
  assert.deepEqual(
    payload.candidates.map((row) => ({
      label: row.label,
      status: row.status,
      assertion_evidence: row.assertion_evidence,
      verification_verdict: row.verification_verdict,
      auto_accept_eligible: row.auto_accept_eligible
    })),
    [
      {
        label: 'developmental delay',
        status: 'present',
        assertion_evidence: 'Williams syndrome (WS) is characterized by developmental delay',
        verification_verdict: 'VERIFIED',
        auto_accept_eligible: true
      },
      {
        label: 'cataracts',
        status: 'uncertain',
        assertion_evidence: 'Cataracts have been reported in adults',
        verification_verdict: 'FLAGGED',
        auto_accept_eligible: false
      }
    ]
  );
  assert.ok(payload.candidates.every((row) => row.candidate_signature));
});

test('mergeExternalMappedCandidates falls back to signature-based merge when mapped rows are reordered', () => {
  const grounded = {
    chapter: {
      chapter_key: 'williams_syndrome',
      nbk_id: 'NBK1249',
      title: 'Williams Syndrome'
    },
    grounded_candidates: [
      {
        label: 'developmental delay',
        status: 'present',
        source_quote: 'Williams syndrome (WS) is characterized by developmental delay',
        source_sentence: 'Williams syndrome (WS) is characterized by developmental delay.',
        sentence_id: 'p1_s1',
        paragraph_id: 'p1',
        review_id: 'review-1',
        review_href: '#review-1'
      },
      {
        label: 'hypercalcemia',
        status: 'present',
        source_quote: 'Hypercalcemia is more common in infancy but may recur in adults',
        source_sentence: 'Hypercalcemia is more common in infancy but may recur in adults.',
        sentence_id: 'p7_s2',
        paragraph_id: 'p7',
        review_id: 'review-2',
        review_href: '#review-2'
      }
    ]
  };

  const mapped = {
    stage: 'mapped_candidates',
    mapping_provider: 'biolord',
    embedding_model: 'FremyCompany/BioLORD-2023',
    mapped_candidates: [
      {
        label: 'hypercalcemia',
        status: 'present',
        source_sentence: 'Hypercalcemia is more common in infancy but may recur in adults.',
        sentence_id: 'p7_s2',
        paragraph_id: 'p7',
        mapped_hpo_id: 'HP:0003074',
        mapped_hpo_label: 'Hypercalcemia',
        hpo_mapping_trust: 'high',
        top_matches: [{ hpo_id: 'HP:0003074', hpo_label: 'Hypercalcemia', score: 1 }]
      },
      {
        label: 'developmental delay',
        status: 'present',
        source_sentence: 'Williams syndrome (WS) is characterized by developmental delay.',
        sentence_id: 'p1_s1',
        paragraph_id: 'p1',
        mapped_hpo_id: 'HP:0001263',
        mapped_hpo_label: 'Developmental delay',
        hpo_mapping_trust: 'high',
        top_matches: [{ hpo_id: 'HP:0001263', hpo_label: 'Developmental delay', score: 1 }]
      }
    ]
  };

  const merged = mergeExternalMappedCandidates(grounded, mapped);
  assert.equal(merged.merge_strategy, 'signature');
  assert.deepEqual(
    merged.mapped_candidates.map((row) => ({
      label: row.label,
      mapped_hpo_id: row.mapped_hpo_id,
      source_quote: row.source_quote,
      review_id: row.review_id
    })),
    [
      {
        label: 'hypercalcemia',
        mapped_hpo_id: 'HP:0003074',
        source_quote: 'Hypercalcemia is more common in infancy but may recur in adults',
        review_id: 'review-2'
      },
      {
        label: 'developmental delay',
        mapped_hpo_id: 'HP:0001263',
        source_quote: 'Williams syndrome (WS) is characterized by developmental delay',
        review_id: 'review-1'
      }
    ]
  );
});

test('buildExternalEnrichmentCases prepares anchor-aware review cases and skips excluded rows by default', () => {
  const merged = {
    chapter: {
      chapter_key: 'williams_syndrome',
      nbk_id: 'NBK1249',
      title: 'Williams Syndrome'
    },
    mapped_candidates: [
      {
        label: 'progressive sensorineural hearing loss',
        status: 'present',
        source_quote: 'Progressive sensorineural hearing loss has been observed',
        source_sentence: 'Progressive sensorineural hearing loss has been observed.',
        section_id: 'hearing',
        section_heading: 'Hearing',
        sentence_id: 'p19_s4',
        sentence_index: 4,
        sentence_char_start: 912,
        sentence_char_end: 964,
        paragraph_id: 'p19',
        paragraph_index: 19,
        paragraph_char_start: 880,
        paragraph_char_end: 980,
        match_char_start: 912,
        match_char_end: 949,
        mapped_hpo_id: 'HP:0000407',
        mapped_hpo_label: 'Sensorineural hearing impairment',
        hpo_mapping_trust: 'medium',
        top_matches: [{ hpo_id: 'HP:0000407', hpo_label: 'Sensorineural hearing impairment', score: 0.9 }],
        verification_verdict: 'FLAGGED',
        auto_accept_eligible: false,
        auto_accept_reasons: ['source_quote_strength:flag'],
        review_id: 'review-19',
        review_href: '#review-19'
      },
      {
        label: 'hearing loss',
        status: 'excluded',
        source_quote: 'Hearing loss has not been described in affected individuals',
        source_sentence: 'Hearing loss has not been described in affected individuals.',
        sentence_id: 'p8_s2',
        paragraph_id: 'p8',
        mapped_hpo_id: 'HP:0000365',
        mapped_hpo_label: 'Hearing impairment',
        hpo_mapping_trust: 'high'
      }
    ]
  };

  const anchors = {
    anchors: [
      {
        hpo_id: 'HP:0000407',
        hpo_label: 'Sensorineural hearing impairment',
        occurrences: [
          {
            match_text: 'hearing loss',
            sentence_id: 'p19_s4',
            paragraph_id: 'p19'
          }
        ]
      },
      {
        hpo_id: 'HP:0001263',
        hpo_label: 'Developmental delay',
        occurrences: [
          {
            match_text: 'developmental delay',
            sentence_id: 'p1_s1',
            paragraph_id: 'p1'
          }
        ]
      }
    ]
  };

  const payload = buildExternalEnrichmentCases(merged, anchors);
  assert.equal(payload.case_count, 1);
  assert.equal(payload.cases[0].candidate.label, 'progressive sensorineural hearing loss');
  assert.equal(payload.cases[0].candidate.mapped_hpo_id, 'HP:0000407');
  assert.equal(payload.cases[0].candidate.evidence_scope, 'sentence');
  assert.equal(payload.cases[0].candidate.section_id, 'hearing');
  assert.equal(payload.cases[0].candidate.section_heading, 'Hearing');
  assert.equal(payload.cases[0].candidate.paragraph_index, 19);
  assert.equal(payload.cases[0].candidate.sentence_index, 4);
  assert.equal(payload.cases[0].candidate.sentence_char_start, 912);
  assert.equal(payload.cases[0].candidate.match_char_end, 949);
  assert.equal(payload.cases[0].verification_context.verdict, 'FLAGGED');
  assert.deepEqual(payload.cases[0].anchor_context.same_sentence_anchors, [
    {
      hpo_id: 'HP:0000407',
      hpo_label: 'Sensorineural hearing impairment',
      match_text: 'hearing loss',
      sentence_id: 'p19_s4',
      paragraph_id: 'p19'
    }
  ]);
});

test('buildExternalCandidateSignature is stable across equivalent row shapes', () => {
  const left = {
    label: 'Developmental delay',
    status: 'present',
    sentence_id: 'p1_s1',
    paragraph_id: 'p1',
    section_id: 'clinical',
    source_sentence: 'Williams syndrome (WS) is characterized by developmental delay.'
  };
  const right = {
    label: 'developmental   delay',
    status: 'present',
    sentence_id: 'p1_s1',
    paragraph_id: 'p1',
    section_id: 'clinical',
    source_sentence: 'Williams syndrome (WS) is characterized by developmental delay.'
  };

  assert.equal(buildExternalCandidateSignature(left), buildExternalCandidateSignature(right));
});

test('buildExternalBioLordRequestPayload preserves the single-chapter mapping contract', () => {
  const mappingInput = {
    chapter_key: 'williams_syndrome',
    nbk_id: 'NBK1249',
    chapter_title: 'Williams Syndrome',
    candidates: [
      {
        label: 'developmental delay',
        status: 'present',
        sentence_id: 'p1_s1'
      }
    ]
  };

  assert.deepEqual(buildExternalBioLordRequestPayload(mappingInput), {
    chapters: [
      {
        chapter_key: 'williams_syndrome',
        nbk_id: 'NBK1249',
        chapter_title: 'Williams Syndrome',
        candidates: [
          {
            label: 'developmental delay',
            status: 'present',
            sentence_id: 'p1_s1'
          }
        ]
      }
    ]
  });
});

test('mapExternalMappingInputExactFromPath accepts phenotype snapshot objects and resolves exact labels', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'external-exact-map-'));
  const inputPath = path.join(tempDir, 'mapping_input.json');
  const phenotypePath = path.join(tempDir, 'phenotype_rows_snapshot.json');
  const outputPath = path.join(tempDir, 'mapped.json');

  await fs.writeFile(
    inputPath,
    JSON.stringify({
      chapter_key: 'weiss_kruszka_syndrome',
      nbk_id: 'NBK549204',
      chapter_title: 'Weiss-Kruszka Syndrome',
      candidates: [
        {
          label: 'bulbous nose',
          status: 'present',
          source_sentence: 'Short upturned nose with bulbous tip.',
          sentence_id: 'p16_s1'
        },
        {
          label: 'made up phenotype',
          status: 'present',
          source_sentence: 'Made up phenotype was reported.',
          sentence_id: 'p99_s1'
        }
      ]
    })
  );

  await fs.writeFile(
    phenotypePath,
    JSON.stringify({
      phenotype_rows: [
        {
          canonical_curie: 'HP:0000414',
          canonical_label: 'Bulbous nose',
          description: '',
          aliases: [{ alias_label: 'bulbous nasal tip', alias_type: 'exact' }]
        }
      ]
    })
  );

  const result = await mapExternalMappingInputExactFromPath(inputPath, {
    outputPath,
    phenotypesJson: phenotypePath
  });

  assert.equal(result.payload.mapping_provider, 'exact_lexical');
  assert.equal(result.payload.mapped_candidates[0].mapped_hpo_id, 'HP:0000414');
  assert.equal(result.payload.mapped_candidates[0].hpo_mapping_trust, 'high');
  assert.equal(result.payload.mapped_candidates[1].mapped_hpo_id, null);
  assert.equal(result.payload.mapped_candidates[1].hpo_mapping_trust, 'reject');
});

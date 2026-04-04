import test from 'node:test';
import assert from 'node:assert/strict';
import { finalizePhenotypeCandidates } from '../src/lib/genereviewsPipeline.js';
import {
  enrichFinalizedCandidates,
  normalizeExternalPhenotypeExtraction,
  toFinalizeCandidateRows
} from '../src/lib/externalPhenotypeExtraction.js';

function buildClinicalStructure(sentences) {
  let cursor = 0;
  const sentenceEntries = sentences.map((sentence, index) => {
    const entry = {
      text: sentence,
      sentence_id: `sentence_${index + 1}`,
      sentence_index: index,
      char_start: cursor,
      char_end: cursor + sentence.length
    };
    cursor += sentence.length + 1;
    return entry;
  });

  const paragraphText = sentences.join(' ');
  return {
    chapter_title: 'External Extraction Test',
    paragraphs: [
      {
        text: paragraphText,
        section_id: 'clinical_description',
        section_heading: 'Clinical Description',
        paragraph_id: 'paragraph_1',
        paragraph_index: 0,
        char_start: 0,
        char_end: paragraphText.length,
        local_clinical_domains: ['Synthetic'],
        sentences: sentenceEntries
      }
    ]
  };
}

test('normalizeExternalPhenotypeExtraction normalizes grouped bucket payloads', () => {
  const payload = {
    chapter: {
      nbk_id: 'NBK619577',
      title: 'USP7-Related Hao-Fountain Syndrome',
      mode: 'discovery'
    },
    phenotypes: {
      present: [
        { label: 'developmental delay', category: 'neurodevelopmental', details: 'Present in 100% of individuals' },
        'hypotonia'
      ],
      excluded: [{ label: 'seizures', category: 'neurologic' }],
      uncertain: [{ label: 'brain MRI anomalies', category: 'brain_mri' }]
    },
    context_metadata: {
      inheritance: 'autosomal dominant'
    },
    context_notes: ['Broad umbrella rows were moved out of present.']
  };

  const normalized = normalizeExternalPhenotypeExtraction(payload);
  assert.deepEqual(normalized.chapter, {
    chapter_key: 'USP7_Related_Hao_Fountain_Syndrome',
    ...payload.chapter
  });
  assert.equal(normalized.phenotypes.present.length, 2);
  assert.equal(normalized.phenotypes.excluded.length, 1);
  assert.equal(normalized.phenotypes.uncertain.length, 1);
  assert.equal(normalized.phenotypes.present[0].status, 'present');
  assert.equal(normalized.phenotypes.excluded[0].status, 'excluded');
  assert.equal(normalized.context_notes[0], 'Broad umbrella rows were moved out of present.');

  const groundingRows = toFinalizeCandidateRows(normalized);
  assert.deepEqual(
    groundingRows.map((row) => [row.label, row.status, row.extraction_bucket]),
    [
      ['developmental delay', 'present', 'present'],
      ['hypotonia', 'present', 'present'],
      ['seizures', 'excluded', 'excluded']
    ]
  );

  const withUncertain = toFinalizeCandidateRows(normalized, { includeUncertain: true });
  assert.equal(withUncertain.length, 4);
  assert.equal(withUncertain.at(-1).label, 'brain MRI anomalies');
  assert.equal(withUncertain.at(-1).status, 'present');
});

test('normalizeExternalPhenotypeExtraction supports flat phenotype payloads', () => {
  const payload = {
    chapter: 'USP7-Related Hao-Fountain Syndrome',
    phenotypes: [
      { term: 'developmental delay', category: 'Neurodevelopmental', details: 'Present in 100% of individuals' },
      { term: 'hypotonia', category: 'Neurologic', details: null }
    ],
    metadata: {
      onset: {
        typical_age: 'Infancy or early childhood'
      }
    },
    negative_or_contrastive_findings: [
      {
        finding: 'absence of major organ malformations',
        context: 'Distinguishes this syndrome from other severe neurodevelopmental syndromes'
      }
    ]
  };

  const normalized = normalizeExternalPhenotypeExtraction(payload);
  assert.equal(normalized.chapter.title, 'USP7-Related Hao-Fountain Syndrome');
  assert.equal(normalized.phenotypes.present.length, 2);
  assert.deepEqual(normalized.context_metadata, payload.metadata);
  assert.deepEqual(normalized.negative_or_contrastive_findings, payload.negative_or_contrastive_findings);
});

test('grouped external extraction rows ground through finalizePhenotypeCandidates', () => {
  const payload = {
    chapter: {
      nbk_id: 'NBK000000',
      title: 'Synthetic Chapter',
      mode: 'discovery'
    },
    phenotypes: {
      present: [{ label: 'developmental delay', category: 'neurodevelopmental' }],
      excluded: [{ label: 'seizures', category: 'neurologic' }]
    }
  };
  const normalized = normalizeExternalPhenotypeExtraction(payload);
  const groundingRows = toFinalizeCandidateRows(normalized);
  const clinicalStructure = buildClinicalStructure([
    'Affected individuals have developmental delay.',
    'Seizures have not been described in affected individuals.'
  ]);

  const result = finalizePhenotypeCandidates(groundingRows, [], clinicalStructure, 'external_extraction');
  const candidates = enrichFinalizedCandidates(result.candidates, groundingRows);

  assert.equal(candidates.length, 2);

  const presentRow = candidates.find((row) => row.label === 'developmental delay');
  const excludedRow = candidates.find((row) => row.label === 'seizures');

  assert.ok(presentRow);
  assert.equal(presentRow.status, 'present');
  assert.equal(presentRow.category, 'neurodevelopmental');
  assert.equal(presentRow.extraction_bucket, 'present');
  assert.equal(presentRow.sentence_id, 'sentence_1');
  assert.equal(presentRow.sentence_index, 0);

  assert.ok(excludedRow);
  assert.equal(excludedRow.status, 'excluded');
  assert.equal(excludedRow.category, 'neurologic');
  assert.equal(excludedRow.extraction_bucket, 'excluded');
  assert.equal(excludedRow.sentence_id, 'sentence_2');
  assert.equal(excludedRow.sentence_index, 1);
});

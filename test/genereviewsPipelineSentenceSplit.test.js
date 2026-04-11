import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildClinicalTextStructureFromSections,
  splitSentenceEntries,
  splitSentences
} from '../src/lib/genereviewsPipeline.js';

test('splitSentenceEntries keeps U.S. continuation in one sentence', () => {
  const entries = splitSentenceEntries(
    'In 2018, the U.S. Food and Drug Administration approved DBS as adjunctive therapy. Another sentence.'
  );
  assert.equal(entries.length, 2);
  assert.equal(
    entries[0].text,
    'In 2018, the U.S. Food and Drug Administration approved DBS as adjunctive therapy.'
  );
  assert.equal(entries[1].text, 'Another sentence.');
});

test('splitSentences does not split after title abbreviations', () => {
  const sentences = splitSentences('Dr. Smith reported improvement. Another sentence.');
  assert.deepEqual(sentences, ['Dr. Smith reported improvement.', 'Another sentence.']);
});

test('buildClinicalTextStructureFromSections preserves merged abbreviation sentence ids', () => {
  const structure = buildClinicalTextStructureFromSections([
    {
      section_id: 'section_Surgical_Therapies',
      section_heading: 'Surgical Therapies',
      text: 'In 2018, the U.S. Food and Drug Administration approved DBS as adjunctive therapy for patients with partial seizures that are refractory to three or more AEDs.'
    }
  ]);

  assert.equal(structure.sentence_count, 1);
  assert.equal(structure.paragraphs.length, 1);
  assert.equal(structure.paragraphs[0].sentences.length, 1);
  assert.equal(structure.paragraphs[0].sentences[0].sentence_id, 'p1_s1');
  assert.equal(
    structure.paragraphs[0].sentences[0].text,
    'In 2018, the U.S. Food and Drug Administration approved DBS as adjunctive therapy for patients with partial seizures that are refractory to three or more AEDs.'
  );
});

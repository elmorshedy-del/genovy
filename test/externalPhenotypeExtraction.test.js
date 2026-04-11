import test from 'node:test';
import assert from 'node:assert/strict';
import { finalizePhenotypeCandidates } from '../src/lib/genereviewsPipeline.js';
import {
  enrichFinalizedCandidates,
  freezeExternalPhenotypeExtraction,
  normalizeExternalPhenotypeExtraction,
  parseExternalPhenotypeExtractionPayload,
  reconcileGroundingCoverage,
  toFinalizeCandidateRows
} from '../src/lib/externalPhenotypeExtraction.js';
import { groundExternalExtractionFromValue } from '../src/lib/externalPhenotypePipeline.js';

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

function buildClinicalStructureFromParagraphs(paragraphs) {
  let charCursor = 0;
  let sentenceCounter = 0;

  return {
    chapter_title: 'External Extraction Test',
    paragraphs: paragraphs.map((paragraph, paragraphIndex) => {
      const sentenceEntries = [];
      let localCursor = charCursor;
      const paragraphSentences = paragraph.sentences || [];
      const paragraphText = paragraphSentences.join(' ');

      for (const sentence of paragraphSentences) {
        sentenceEntries.push({
          text: sentence,
          sentence_id: `sentence_${sentenceCounter + 1}`,
          sentence_index: sentenceCounter,
          char_start: localCursor,
          char_end: localCursor + sentence.length
        });
        localCursor += sentence.length + 1;
        sentenceCounter += 1;
      }

      const paragraphEntry = {
        text: paragraphText,
        section_id: paragraph.sectionId || `section_${paragraphIndex + 1}`,
        section_heading: paragraph.sectionHeading || 'Clinical Description',
        paragraph_id: `paragraph_${paragraphIndex + 1}`,
        paragraph_index: paragraphIndex,
        char_start: charCursor,
        char_end: charCursor + paragraphText.length,
        local_clinical_domains: paragraph.localClinicalDomains || ['Synthetic'],
        sentences: sentenceEntries
      };

      charCursor += paragraphText.length + 2;
      return paragraphEntry;
    })
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
    ...payload.chapter,
    source: null,
    source_url: null,
    last_updated: null
  });
  assert.equal(normalized.phenotypes.present.length, 2);
  assert.equal(normalized.phenotypes.excluded.length, 1);
  assert.equal(normalized.phenotypes.uncertain.length, 1);
  assert.equal(normalized.phenotypes.present[0].status, 'present');
  assert.equal(normalized.phenotypes.excluded[0].status, 'excluded');
  assert.equal(normalized.context_notes[0], 'Broad umbrella rows were moved out of present.');
  assert.deepEqual(normalized.grounding_hints, { phenotypes: [] });

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
  assert.equal(withUncertain.at(-1).status, 'uncertain');
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
  assert.deepEqual(normalized.context_metadata, {
    onset_typical_age: 'Infancy or early childhood'
  });
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

test('quote-first grounding localizes source_quote before lexical fallback', () => {
  const payload = {
    chapter: {
      nbk_id: 'NBK000010',
      title: 'Synthetic Quote-First Chapter',
      mode: 'discovery'
    },
    phenotypes: {
      present: [
        {
          label: 'developmental delay',
          source_quote: 'global delay'
        }
      ]
    }
  };

  const normalized = normalizeExternalPhenotypeExtraction(payload);
  const groundingRows = toFinalizeCandidateRows(normalized);
  const clinicalStructure = buildClinicalStructure([
    'Affected individuals often have global delay.',
    'Hearing loss has not been described.'
  ]);

  const result = finalizePhenotypeCandidates(
    groundingRows,
    [],
    clinicalStructure,
    'external_extraction',
    {
      allowExistingAnchors: true,
      preserveInputStatus: true
    }
  );

  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].sentence_id, 'sentence_1');
  assert.equal(result.candidates[0].source_quote, 'global delay');
  assert.equal(result.candidates[0].quote_match_type, 'source_quote_exact');
  assert.equal(result.candidates[0].source_sentence, 'Affected individuals often have global delay.');
});

test('freeze and grounding preserve enum-rich phenotype metadata', async () => {
  const payload = {
    chapter: {
      title: 'Dravet Syndrome',
      mode: 'discovery',
      source: 'PMC',
      source_url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6713249/',
      last_updated: '2019-06-26'
    },
    phenotypes: {
      present: [
        {
          label: 'hemiclonic seizures',
          source_quote: 'Patients with DS usually begin experiencing seizures during the first year of life.',
          evidence_scope: 'sentence',
          source_location: {
            section_id: 'clinical_presentation',
            section_heading: 'Clinical Presentation',
            paragraph_id: 'p1',
            paragraph_index: 1,
            sentence_id: 'p1_s1'
          },
          detail_types: ['temporal_qualifier', 'trigger'],
          ancillary_evidence_types: ['other'],
          trajectory: {
            direction: 'age_dependent_onset',
            timing: 'first year of life',
            note: null
          }
        }
      ]
    }
  };

  const frozen = freezeExternalPhenotypeExtraction(payload);
  assert.equal(frozen.chapter.source, 'PMC');
  assert.equal(frozen.chapter.source_url, 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6713249/');
  assert.equal(frozen.chapter.last_updated, '2019-06-26');
  assert.equal(frozen.phenotypes.present[0].evidence_scope, 'sentence');
  assert.equal(frozen.phenotypes.present[0].source_location.section_id, 'clinical_presentation');
  assert.deepEqual(frozen.phenotypes.present[0].detail_types, ['temporal_qualifier', 'trigger']);
  assert.deepEqual(frozen.phenotypes.present[0].ancillary_evidence_types, ['other']);
  assert.equal(frozen.phenotypes.present[0].trajectory.direction, 'age_dependent_onset');

  const grounded = await groundExternalExtractionFromValue(frozen, {
    clinicalStructure: buildClinicalStructure([
      'Patients with DS usually begin experiencing seizures during the first year of life.'
    ])
  });

  assert.equal(grounded.grounded_candidates.length, 1);
  assert.equal(grounded.grounded_candidates[0].evidence_scope, 'sentence');
  assert.equal(grounded.grounded_candidates[0].source_location.section_id, 'clinical_presentation');
  assert.deepEqual(grounded.grounded_candidates[0].detail_types, ['temporal_qualifier', 'trigger']);
  assert.deepEqual(grounded.grounded_candidates[0].ancillary_evidence_types, ['other']);
  assert.equal(grounded.grounded_candidates[0].trajectory.direction, 'age_dependent_onset');
});

test('external sidecar grounding preserves frozen statuses and does not skip anchor-matching rows', () => {
  const payload = {
    chapter: {
      nbk_id: 'NBK000001',
      title: 'Synthetic Chapter With Anchors',
      mode: 'discovery'
    },
    phenotypes: {
      present: [{ label: 'developmental delay', category: 'neurodevelopmental' }],
      uncertain: [{ label: 'hearing loss', category: 'otologic' }]
    }
  };

  const normalized = normalizeExternalPhenotypeExtraction(payload);
  const groundingRows = toFinalizeCandidateRows(normalized, { includeUncertain: true });
  const clinicalStructure = buildClinicalStructure([
    'Affected individuals have developmental delay.',
    'Hearing loss has rarely been reported.'
  ]);
  const anchors = [
    {
      hpo_label: 'developmental delay',
      occurrences: [{ match_text: 'developmental delay' }]
    }
  ];

  const result = finalizePhenotypeCandidates(
    groundingRows,
    anchors,
    clinicalStructure,
    'external_extraction',
    {
      allowExistingAnchors: true,
      preserveInputStatus: true
    }
  );
  const candidates = enrichFinalizedCandidates(result.candidates, groundingRows);

  assert.equal(candidates.length, 2);

  const presentRow = candidates.find((row) => row.label === 'developmental delay');
  const uncertainRow = candidates.find((row) => row.label === 'hearing loss');

  assert.ok(presentRow);
  assert.equal(presentRow.status, 'present');
  assert.equal(presentRow.extraction_bucket, 'present');
  assert.equal(presentRow.sentence_id, 'sentence_1');

  assert.ok(uncertainRow);
  assert.equal(uncertainRow.status, 'uncertain');
  assert.equal(uncertainRow.extraction_bucket, 'uncertain');
  assert.equal(uncertainRow.sentence_id, 'sentence_2');
});

test('polarity validation rejects excluded rows whose grounded evidence is affirmative', () => {
  const groundingRows = [
    {
      label: 'seizures',
      status: 'excluded',
      extraction_bucket: 'excluded',
      source_quote: 'Seizures are common'
    }
  ];

  const clinicalStructure = buildClinicalStructure([
    'Seizures are common in affected individuals.'
  ]);

  const result = finalizePhenotypeCandidates(
    groundingRows,
    [],
    clinicalStructure,
    'external_extraction',
    {
      allowExistingAnchors: true,
      preserveInputStatus: true
    }
  );

  assert.equal(result.candidates.length, 0);
  assert.equal(result.rejectedCandidates.length, 1);
  assert.equal(result.rejectedCandidates[0].reason, 'excluded_bucket_without_negative_evidence');
});

test('freezeExternalPhenotypeExtraction reroutes ancillary-like phenotype rows and strips extra fields', () => {
  const payload = {
    chapter: {
      nbk_id: 'NBK614471',
      title: 'VEXAS Syndrome',
      mode: 'discovery'
    },
    phenotypes: {
      present: [
        { label: 'recurrent fever', category: 'constitutional' },
        { label: 'recurrent CMV viremia', category: 'infectious' },
        { label: 'autoantibodies to factor VIII', category: 'hematologic' }
      ],
      excluded: [{ label: 'decreased B cell counts', category: 'laboratory' }],
      uncertain: [{ label: 'immune dysregulation', category: 'broad' }]
    },
    ancillary_clinical_evidence: {
      laboratory: ['polyomaviremia']
    },
    context_metadata: {
      onset: {
        typical_presentation: 'late adulthood'
      }
    }
  };

  const frozen = freezeExternalPhenotypeExtraction(payload);
  assert.deepEqual(frozen.chapter, {
    nbk_id: 'NBK614471',
    title: 'VEXAS Syndrome',
    mode: 'discovery',
    source: '',
    source_url: '',
    last_updated: ''
  });
  assert.deepEqual(frozen.phenotypes.present.map((row) => row.label), ['recurrent fever']);
  assert.deepEqual(frozen.phenotypes.excluded.map((row) => row.label), []);
  assert.deepEqual(frozen.phenotypes.uncertain.map((row) => row.label), ['immune dysregulation']);
  assert.deepEqual(frozen.ancillary_clinical_evidence.laboratory, [
    'polyomaviremia',
    'recurrent CMV viremia',
    'autoantibodies to factor VIII'
  ]);
  assert.equal(frozen.context_metadata.onset_typical_presentation, 'late adulthood');
  assert.ok(
    frozen.context_notes.some((note) => note.includes('Non-phenotype rows were rerouted from phenotype buckets'))
  );
  assert.ok(
    frozen.context_notes.some((note) => note.includes('Non-phenotype contrast rows were omitted from phenotypes.excluded'))
  );
});

test('freezeExternalPhenotypeExtraction keeps diagnosis-like deficiency and dysplasia rows in phenotypes', () => {
  const payload = {
    chapter: {
      nbk_id: 'NBK618356',
      title: 'Zhu-Tokita-Takenouchi-Kim Syndrome',
      mode: 'discovery'
    },
    phenotypes: {
      present: [
        { label: 'IgA deficiency' },
        { label: 'IgG deficiency' },
        { label: 'kidney dysplasia' }
      ]
    },
    ancillary_clinical_evidence: {
      laboratory: ['IgA deficiency and IgG deficiency reported in 15/46 assessed individuals'],
      pathology: ['kidney dysplasia']
    }
  };

  const frozen = freezeExternalPhenotypeExtraction(payload);

  assert.deepEqual(
    frozen.phenotypes.present.map((row) => row.label),
    ['IgA deficiency', 'IgG deficiency', 'kidney dysplasia']
  );
  assert.deepEqual(frozen.ancillary_clinical_evidence.laboratory, [
    'IgA deficiency and IgG deficiency reported in 15/46 assessed individuals'
  ]);
  assert.deepEqual(frozen.ancillary_clinical_evidence.pathology, []);
});

test('grounding prefers descriptive clinical sentences over management sentences when both match exactly', () => {
  const groundingRows = [
    {
      label: 'strabismus',
      status: 'present',
      extraction_bucket: 'present'
    }
  ];

  const clinicalStructure = buildClinicalStructureFromParagraphs([
    {
      sectionHeading: 'Summary',
      sentences: [
        'Supportive measures include treatment of refractive errors and strabismus per ophthalmologist.'
      ]
    },
    {
      sectionHeading: 'Clinical Description',
      sentences: [
        'Ophthalmologic involvement.',
        'More than half of the individuals who reported vision abnormalities presented with strabismus.'
      ]
    }
  ]);

  const result = finalizePhenotypeCandidates(
    groundingRows,
    [],
    clinicalStructure,
    'external_extraction',
    {
      allowExistingAnchors: true,
      preserveInputStatus: true
    }
  );

  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].source_sentence, 'More than half of the individuals who reported vision abnormalities presented with strabismus.');
  assert.equal(result.candidates[0].section_heading, 'Clinical Description');
});

test('grounding avoids heading-only anchors when a descriptive sentence in the same paragraph supports the label', () => {
  const groundingRows = [
    {
      label: 'depressed nasal bridge',
      status: 'present',
      extraction_bucket: 'present'
    }
  ];

  const clinicalStructure = buildClinicalStructureFromParagraphs([
    {
      sectionHeading: 'Clinical Description',
      sentences: [
        'Craniofacial features.',
        'Some combination of characteristic facial features have been reported including depressed or other abnormality of the nasal bridge.'
      ]
    }
  ]);

  const result = finalizePhenotypeCandidates(
    groundingRows,
    [],
    clinicalStructure,
    'external_extraction',
    {
      allowExistingAnchors: true,
      preserveInputStatus: true
    }
  );

  assert.equal(result.candidates.length, 1);
  assert.equal(
    result.candidates[0].source_sentence,
    'Some combination of characteristic facial features have been reported including depressed or other abnormality of the nasal bridge.'
  );
});

test('reconcileGroundingCoverage adds an explicit rejection for unaccounted frozen rows', () => {
  const inputRows = [
    { label: 'developmental delay', status: 'present', extraction_bucket: 'present' },
    { label: 'hearing loss', status: 'uncertain', extraction_bucket: 'uncertain' }
  ];

  const reconciled = reconcileGroundingCoverage(
    inputRows,
    [{ label: 'developmental delay', status: 'present', extraction_bucket: 'present' }],
    []
  );

  assert.equal(reconciled.candidates.length, 1);
  assert.equal(reconciled.rejectedCandidates.length, 1);
  assert.equal(reconciled.rejectedCandidates[0].label, 'hearing loss');
  assert.equal(reconciled.rejectedCandidates[0].status, 'uncertain');
  assert.equal(reconciled.rejectedCandidates[0].extraction_bucket, 'uncertain');
  assert.equal(reconciled.rejectedCandidates[0].category, null);
  assert.equal(reconciled.rejectedCandidates[0].details, null);
  assert.equal(reconciled.rejectedCandidates[0].source_quote, null);
  assert.equal(reconciled.rejectedCandidates[0].reason, 'no_supporting_sentence_found');
  assert.deepEqual(reconciled.rejectedCandidates[0].detail_types, []);
  assert.deepEqual(reconciled.rejectedCandidates[0].ancillary_evidence_types, []);
});

test('freezeExternalPhenotypeExtraction normalizes treatment-response qualifiers and reroutes non-qualifiers', () => {
  const payload = {
    chapter: {
      nbk_id: 'NBK6816',
      title: 'Very Long-Chain Acyl-Coenzyme A Dehydrogenase Deficiency',
      mode: 'discovery'
    },
    phenotypes: {
      present: [{ label: 'exercise-induced rhabdomyolysis' }]
    },
    ancillary_clinical_evidence: {
      treatment_response: [
        'persistent dermatitis resistant to therapy',
        'treatment-refractory immune thrombocytopenia',
        'responsive to co-trimoxazole and IVIG prophylaxis',
        'cardiomyopathy may be reversible with early intensive supportive care and diet modification',
        'following BCG vaccination'
      ]
    }
  };

  const frozen = freezeExternalPhenotypeExtraction(payload);
  assert.deepEqual(frozen.ancillary_clinical_evidence.treatment_response, [
    'resistant to therapy',
    'treatment-refractory',
    'responsive to co-trimoxazole and IVIG prophylaxis'
  ]);
  assert.ok(
    frozen.ancillary_clinical_evidence.management_context.includes(
      'cardiomyopathy may be reversible with early intensive supportive care and diet modification'
    )
  );
  assert.ok(frozen.ancillary_clinical_evidence.other.includes('following BCG vaccination'));
});

test('freezeExternalPhenotypeExtraction splits bundled rows, promotes structural imaging phenotypes, and reroutes recommendation-style tests', () => {
  const payload = {
    chapter: {
      nbk_id: 'NBK549204',
      title: 'Weiss-Kruszka Syndrome',
      mode: 'discovery'
    },
    phenotypes: {
      present: [
        { label: 'global delay' },
        { label: 'craniosynostosis involving the metopic or lambdoid suture' }
      ],
      excluded: [],
      uncertain: []
    },
    ancillary_clinical_evidence: {
      imaging: [
        'abnormalities of the corpus callosum',
        'corpus callosum dysgenesis',
        'agenesis of the corpus callosum'
      ],
      clinical_test: ['radiographic swallowing study if clinical signs or symptoms of dysphagia']
    }
  };

  const frozen = freezeExternalPhenotypeExtraction(payload);

  assert.deepEqual(
    frozen.phenotypes.present.map((row) => row.label),
    [
      'developmental delay',
      'metopic craniosynostosis',
      'lambdoid craniosynostosis',
      'corpus callosum dysgenesis',
      'agenesis of the corpus callosum'
    ]
  );
  assert.deepEqual(frozen.ancillary_clinical_evidence.imaging, []);
  assert.deepEqual(frozen.ancillary_clinical_evidence.clinical_test, []);
  assert.ok(
    frozen.ancillary_clinical_evidence.management_context.includes(
      'radiographic swallowing study if clinical signs or symptoms of dysphagia'
    )
  );
  assert.ok(
    frozen.context_notes.some((note) =>
      note.includes('Structural imaging findings were promoted to phenotype rows during finalization')
    )
  );
  assert.ok(
    frozen.context_notes.some((note) =>
      note.includes('Recommendation-style clinical test entries were rerouted to management_context during finalization')
    )
  );
});

test('freezeExternalPhenotypeExtraction canonicalizes residual craniosynostosis wording and drops broad corpus-callosum imaging parent', () => {
  const payload = {
    chapter: {
      nbk_id: 'NBK549204',
      title: 'Weiss-Kruszka Syndrome',
      mode: 'discovery'
    },
    phenotypes: {
      present: [
        { label: 'metopic synostosis' },
        { label: 'craniosynostosis involving the lambdoid suture' }
      ],
      excluded: [],
      uncertain: []
    },
    ancillary_clinical_evidence: {
      imaging: ['corpus callosum abnormalities'],
      other: []
    }
  };

  const frozen = freezeExternalPhenotypeExtraction({
    ...payload,
    ancillary_clinical_evidence: {
      ...payload.ancillary_clinical_evidence,
      imaging: [
        'corpus callosum abnormalities',
        'corpus callosum dysgenesis',
        'agenesis of the corpus callosum'
      ]
    }
  });

  assert.ok(
    frozen.phenotypes.present.some((row) => row.label === 'metopic craniosynostosis')
  );
  assert.ok(
    frozen.phenotypes.present.some((row) => row.label === 'lambdoid craniosynostosis')
  );
  assert.ok(
    !frozen.phenotypes.present.some((row) => row.label === 'metopic synostosis')
  );
  assert.ok(
    !frozen.phenotypes.present.some((row) => row.label === 'craniosynostosis involving the lambdoid suture')
  );
  assert.deepEqual(frozen.ancillary_clinical_evidence.imaging, []);
});

test('freezeExternalPhenotypeExtraction preserves transformed grounding hints for grounded follow-up', () => {
  const payload = {
    chapter: {
      nbk_id: 'NBK549204',
      title: 'Weiss-Kruszka Syndrome',
      mode: 'discovery'
    },
    phenotypes: {
      present: [
        { label: 'global delay', source_quote: 'global delay' },
        {
          label: 'craniosynostosis involving the metopic or lambdoid suture',
          source_quote: 'craniosynostosis involving the metopic or lambdoid suture'
        }
      ]
    }
  };

  const frozen = freezeExternalPhenotypeExtraction(payload);

  assert.deepEqual(frozen.grounding_hints, {
    phenotypes: [
      {
        label: 'developmental delay',
        source_quote: 'global delay',
        extraction_bucket: 'present',
        status: 'present'
      },
      {
        label: 'metopic craniosynostosis',
        source_quote: 'craniosynostosis involving the metopic or lambdoid suture',
        extraction_bucket: 'present',
        status: 'present'
      },
      {
        label: 'lambdoid craniosynostosis',
        source_quote: 'craniosynostosis involving the metopic or lambdoid suture',
        extraction_bucket: 'present',
        status: 'present'
      }
    ]
  });
});

test('parseExternalPhenotypeExtractionPayload extracts the first JSON object from model output text', () => {
  const raw = `Here is the result:\n{\n  "chapter": {"title": "Williams Syndrome"},\n  "phenotypes": {"present": [{"label": "developmental delay"}], "excluded": [], "uncertain": []}\n}\nAdditional notes after the JSON.`;

  const parsed = parseExternalPhenotypeExtractionPayload(raw);
  assert.equal(parsed.chapter.title, 'Williams Syndrome');
  assert.equal(parsed.phenotypes.present[0].label, 'developmental delay');
});

test('groundExternalExtractionFromValue attaches verification and review contract to grounded candidates', async () => {
  const payload = {
    chapter: {
      nbk_id: 'NBK000020',
      title: 'Synthetic Verified Chapter',
      mode: 'discovery'
    },
    phenotypes: {
      present: [
        {
          label: 'developmental delay',
          source_quote: 'Affected individuals often have global delay'
        }
      ],
      excluded: [
        {
          label: 'hearing loss',
          source_quote: 'Hearing loss has not been described in affected individuals'
        }
      ]
    }
  };

  const clinicalStructure = buildClinicalStructure([
    'Affected individuals often have global delay.',
    'Hearing loss has not been described in affected individuals.'
  ]);

  const grounded = await groundExternalExtractionFromValue(payload, {
    clinicalStructure,
    includeUncertain: false
  });

  assert.equal(grounded.grounded_candidates.length, 2);
  assert.equal(grounded.verifications.length, 2);
  assert.equal(grounded.verification_summary.candidates.verified, 2);
  assert.equal(grounded.verification_summary.candidates.flagged, 0);
  assert.equal(grounded.review_page_path, null);
  assert.equal(grounded.review_data_path, null);
  assert.ok(grounded.grounded_candidates.every((row) => row.review_id));
  assert.ok(grounded.grounded_candidates.every((row) => row.review_href));
  assert.deepEqual(
    grounded.grounded_candidates.map((row) => row.verification_verdict),
    ['VERIFIED', 'VERIFIED']
  );
});

test('groundExternalExtractionFromValue flags short table-style evidence for review', async () => {
  const payload = {
    chapter: {
      nbk_id: 'NBK000021',
      title: 'Synthetic Table Chapter',
      mode: 'discovery'
    },
    phenotypes: {
      present: [
        {
          label: 'hypertension',
          source_quote: 'Hypertension'
        }
      ]
    }
  };

  const clinicalStructure = buildClinicalStructureFromParagraphs([
    {
      sectionHeading: 'Clinical Description',
      sentences: ['Hypertension\t50%\tRenal artery stenosis may contribute']
    }
  ]);

  const grounded = await groundExternalExtractionFromValue(payload, {
    clinicalStructure,
    includeUncertain: false
  });

  assert.equal(grounded.grounded_candidates.length, 1);
  assert.equal(grounded.grounded_candidates[0].verification_verdict, 'FLAGGED');
  assert.equal(grounded.grounded_candidates[0].auto_accept_eligible, false);
  assert.equal(grounded.verification_summary.candidates.flagged, 1);
  assert.ok(
    grounded.verifications[0].checks.some(
      (check) => check.name === 'source_quote_strength' && check.status === 'flag'
    )
  );
  assert.ok(
    grounded.verifications[0].checks.some(
      (check) => check.name === 'evidence_surface' && check.status === 'flag'
    )
  );
});

test('groundExternalExtractionFromValue produces explicit review records for rejected candidates', async () => {
  const payload = {
    chapter: {
      nbk_id: 'NBK000022',
      title: 'Synthetic Rejected Chapter',
      mode: 'discovery'
    },
    phenotypes: {
      present: [
        {
          label: 'seizures',
          source_quote: 'Seizures are common'
        }
      ]
    }
  };

  const clinicalStructure = buildClinicalStructure([
    'Affected individuals often have developmental delay.',
    'Hearing loss has not been described in affected individuals.'
  ]);

  const grounded = await groundExternalExtractionFromValue(payload, {
    clinicalStructure,
    includeUncertain: false
  });

  assert.equal(grounded.grounded_candidates.length, 0);
  assert.equal(grounded.rejected_candidates.length, 1);
  assert.equal(grounded.rejected_candidate_reviews.length, 1);
  assert.equal(grounded.rejected_candidate_reviews[0].verdict, 'FAILED');
  assert.equal(grounded.rejected_candidates[0].verification_verdict, 'FAILED');
  assert.ok(grounded.rejected_candidates[0].review_id);
  assert.ok(
    grounded.rejected_candidate_reviews[0].auto_accept_reasons.some((reason) =>
      reason.startsWith('grounding_rejected:')
    )
  );
});

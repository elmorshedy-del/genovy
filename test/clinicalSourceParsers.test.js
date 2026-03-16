import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNaturalHistoryTermEntries } from '../src/services/sources/orphadataNaturalHistorySource.js';
import {
  parseClinGenDate,
  stripClinGenCsvPreamble
} from '../src/services/sources/clingenGeneDiseaseValiditySource.js';
import {
  buildGeneEntityXrefs,
  buildDiseaseRefs,
  parseClinVarDate
} from '../src/services/sources/clinvarVariantSummarySource.js';

test('buildNaturalHistoryTermEntries extracts onset and inheritance terms from Orphadata disorder nodes', () => {
  const entries = buildNaturalHistoryTermEntries({
    AverageAgeOfOnsetList: {
      AverageAgeOfOnset: [
        {
          '@_id': '23522',
          Name: { '@_lang': 'en', $text: 'Infancy' }
        }
      ]
    },
    TypeOfInheritanceList: {
      TypeOfInheritance: {
        '@_id': '23417',
        Name: { '@_lang': 'en', $text: 'Autosomal recessive' }
      }
    }
  });

  assert.deepEqual(
    entries.map((entry) => ({
      termRole: entry.termRole,
      curie: entry.ref.curie,
      label: entry.ref.label
    })),
    [
      {
        termRole: 'average_age_of_onset',
        curie: 'ORPHAAGE:23522',
        label: 'Infancy'
      },
      {
        termRole: 'inheritance_mode',
        curie: 'ORPHAINHERITANCE:23417',
        label: 'Autosomal recessive'
      }
    ]
  );
});

test('stripClinGenCsvPreamble starts parsing at the real header row', () => {
  const cleaned = stripClinGenCsvPreamble(
    '"CLINGEN GENE DISEASE VALIDITY CURATIONS","",""\n' +
      '"FILE CREATED: 2026-03-15","",""\n' +
      '"GENE SYMBOL","GENE ID (HGNC)","DISEASE ID (MONDO)"\n' +
      '"AARS1","HGNC:20","MONDO:0013212"\n'
  );

  assert.equal(
    cleaned,
    '"GENE SYMBOL","GENE ID (HGNC)","DISEASE ID (MONDO)"\n"AARS1","HGNC:20","MONDO:0013212"\n'
  );
  assert.equal(parseClinGenDate('2024-03-14T16:00:00.000Z'), '2024-03-14');
});

test('buildDiseaseRefs prefers stable disease identifiers from ClinVar phenotype buckets', () => {
  const refs = buildDiseaseRefs({
    PhenotypeIDS: 'MONDO:MONDO:0013342,MedGen:C3150901,OMIM:613647,Orphanet:306511||MedGen:C3661900',
    PhenotypeList: 'Hereditary spastic paraplegia 48|Macular dystrophy with or without extraocular features|not provided'
  });

  assert.deepEqual(refs, [
    {
      curie: 'MONDO:0013342',
      entityType: 'disease',
      label: 'Hereditary spastic paraplegia 48',
      isPlaceholder: true
    }
  ]);
  assert.equal(parseClinVarDate('Dec 17, 2024'), '2024-12-17');
});

test('buildGeneEntityXrefs bridges HGNC and NCBIGene identifiers for ClinVar genes', () => {
  const xrefs = buildGeneEntityXrefs(
    {
      HGNC_ID: 'HGNC:11444',
      GeneID: '6812'
    },
    'HGNC:11444'
  );

  assert.deepEqual(xrefs, [
    {
      canonicalCurie: 'HGNC:11444',
      xrefCurie: 'NCBIGene:6812',
      xrefType: 'cross_reference'
    }
  ]);
});

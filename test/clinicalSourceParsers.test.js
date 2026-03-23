import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNaturalHistoryTermEntries } from '../src/services/sources/orphadataNaturalHistorySource.js';
import {
  parseClinGenDate,
  stripClinGenCsvPreamble
} from '../src/services/sources/clingenGeneDiseaseValiditySource.js';
import {
  buildDerivedGeneDiseaseRelationship,
  buildGeneEntityXrefs,
  buildDiseaseRefs,
  parseClinVarDate,
  resolveClinVarVariantSummaryOptions,
  supportsDerivedClinVarGeneDiseaseBridge
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

test('resolveClinVarVariantSummaryOptions defaults to uncapped full-file sync with bounded batch size', () => {
  assert.deepEqual(resolveClinVarVariantSummaryOptions({}), {
    preferredAssembly: 'GRCh38',
    allowedOriginSimple: 'germline',
    localPath: '',
    maxRowsPerSync: 0,
    batchSize: 5000
  });

  assert.deepEqual(
    resolveClinVarVariantSummaryOptions({
      maxRowsPerSync: '250',
      batchSize: '750',
      localPath: ' /tmp/clinvar_variant_summary.txt.gz '
    }),
    {
      preferredAssembly: 'GRCh38',
      allowedOriginSimple: 'germline',
      localPath: '/tmp/clinvar_variant_summary.txt.gz',
      maxRowsPerSync: 250,
      batchSize: 750
    }
  );
});

test('buildDerivedGeneDiseaseRelationship emits a typed ClinVar-backed gene-disease support edge', () => {
  const relationship = buildDerivedGeneDiseaseRelationship({
    source: {
      homepageUrl: 'https://www.ncbi.nlm.nih.gov/clinvar/docs/maintenance_use/'
    },
    sourceRecordKey: 'clinvar-variant:1495164:MONDO:0957810:GRCh38',
    geneRef: {
      curie: 'HGNC:23156',
      entityType: 'gene',
      label: 'U2AF2'
    },
    diseaseRef: {
      curie: 'MONDO:0957810',
      entityType: 'disease',
      label: 'Developmental delay, dysmorphic facies, and brain anomalies'
    },
    variantCurie: 'CLINVAR:1495164',
    variantLabel: 'NM_007279.3(U2AF2):c.446C>T (p.Arg149Trp)',
    row: {
      VariationID: '1495164',
      AlleleID: '1433188',
      Type: 'single nucleotide variant',
      ClinicalSignificance: 'Pathogenic',
      ClinSigSimple: '1',
      ReviewStatus: 'criteria provided, single submitter',
      NumberSubmitters: '1',
      LastEvaluated: 'Sep 19, 2023',
      PhenotypeIDS: 'MONDO:MONDO:0957810,MedGen:C5882698,OMIM:620535',
      PhenotypeList: 'Developmental delay, dysmorphic facies, and brain anomalies',
      Assembly: 'GRCh38',
      OriginSimple: 'germline'
    }
  });

  assert.deepEqual(relationship, {
    predicateKey: 'associated_with_disease',
    subjectRef: {
      curie: 'HGNC:23156',
      entityType: 'gene',
      label: 'U2AF2'
    },
    objectRef: {
      curie: 'MONDO:0957810',
      entityType: 'disease',
      label: 'Developmental delay, dysmorphic facies, and brain anomalies'
    },
    qualifiers: {
      derivation: 'clinvar_variant_summary'
    },
    evidence: {
      sourceRecordKey: 'clinvar-variant:1495164:MONDO:0957810:GRCh38',
      evidenceType: 'clinvar_variant_derived',
      evidenceCode: 'Pathogenic',
      provenanceUrl: 'https://www.ncbi.nlm.nih.gov/clinvar/docs/maintenance_use/',
      payload: {
        variationId: '1495164',
        alleleId: '1433188',
        variantCurie: 'CLINVAR:1495164',
        variantName: 'NM_007279.3(U2AF2):c.446C>T (p.Arg149Trp)',
        variationType: 'single nucleotide variant',
        clinicalSignificance: 'Pathogenic',
        clinicalSignificanceSimple: '1',
        reviewStatus: 'criteria provided, single submitter',
        numberSubmitters: '1',
        lastEvaluated: '2023-09-19',
        phenotypeIds: 'MONDO:MONDO:0957810,MedGen:C5882698,OMIM:620535',
        phenotypeList: 'Developmental delay, dysmorphic facies, and brain anomalies',
        assembly: 'GRCh38',
        originSimple: 'germline'
      }
    }
  });
});

test('supportsDerivedClinVarGeneDiseaseBridge keeps pathogenic assertions but excludes noisy categories', () => {
  assert.equal(supportsDerivedClinVarGeneDiseaseBridge({ ClinicalSignificance: 'Pathogenic' }), true);
  assert.equal(supportsDerivedClinVarGeneDiseaseBridge({ ClinicalSignificance: 'Likely pathogenic' }), true);
  assert.equal(
    supportsDerivedClinVarGeneDiseaseBridge({ ClinicalSignificance: 'Pathogenic/Likely pathogenic' }),
    true
  );
  assert.equal(
    supportsDerivedClinVarGeneDiseaseBridge({
      ClinicalSignificance: 'Conflicting classifications of pathogenicity'
    }),
    false
  );
  assert.equal(supportsDerivedClinVarGeneDiseaseBridge({ ClinicalSignificance: 'Uncertain significance' }), false);
  assert.equal(supportsDerivedClinVarGeneDiseaseBridge({ ClinicalSignificance: 'Benign/Likely benign' }), false);
});

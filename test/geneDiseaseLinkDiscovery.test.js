import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  DATASET_METADATA_COLUMNS,
  FEATURE_COLUMNS,
  filterScientificNegativeRows,
  persistGeneDiseaseLinkDataset
} from '../src/ml/geneDiseaseLinkDiscovery.js';

test('persistGeneDiseaseLinkDataset writes training, candidate, and metadata files', () => {
  const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'genovy-ml-'));
  const result = persistGeneDiseaseLinkDataset(outputDirectory, {
    trainingRows: [
      {
        pair_id: 'pair-1',
        label: 1,
        gene_concept_id: 10,
        gene_curie: 'NCBIGene:1',
        gene_label: 'GENE1',
        disease_concept_id: 20,
        disease_curie: 'MONDO:1',
        disease_label: 'Disease 1',
        seed_phenotype_count: 2,
        seed_phenotype_rarity_score: 0.45,
        shared_phenotype_count: 3,
        shared_phenotype_rarity_score: 0.8,
        phenotype_jaccard: 0.5,
        shared_ratio_to_gene: 0.75,
        shared_ratio_to_disease: 0.6,
        gene_alias_count: 2,
        gene_member_count: 1,
        gene_xref_count: 3,
        gene_phenotype_count: 4,
        gene_out_degree: 6,
        disease_alias_count: 1,
        disease_member_count: 1,
        disease_xref_count: 2,
        disease_phenotype_count: 5,
        disease_lacks_phenotype_count: 0,
        disease_in_degree: 3,
        disease_out_degree: 10,
        disease_trial_count: 1
      }
    ],
    candidateRows: [
      {
        pair_id: 'pair-2',
        gene_concept_id: 11,
        gene_curie: 'NCBIGene:2',
        gene_label: 'GENE2',
        disease_concept_id: 21,
        disease_curie: 'MONDO:2',
        disease_label: 'Disease 2',
        seed_phenotype_count: 1,
        seed_phenotype_rarity_score: 0.15,
        shared_phenotype_count: 1,
        shared_phenotype_rarity_score: 0.1,
        phenotype_jaccard: 0.2,
        shared_ratio_to_gene: 0.33,
        shared_ratio_to_disease: 0.25,
        gene_alias_count: 1,
        gene_member_count: 1,
        gene_xref_count: 2,
        gene_phenotype_count: 3,
        gene_out_degree: 5,
        disease_alias_count: 1,
        disease_member_count: 1,
        disease_xref_count: 2,
        disease_phenotype_count: 4,
        disease_lacks_phenotype_count: 1,
        disease_in_degree: 2,
        disease_out_degree: 8,
        disease_trial_count: 0
      }
    ],
    metadata: {
      featureColumns: FEATURE_COLUMNS,
      datasetColumns: [...DATASET_METADATA_COLUMNS, ...FEATURE_COLUMNS]
    }
  });

  assert.equal(fs.existsSync(result.trainingCsvPath), true);
  assert.equal(fs.existsSync(result.candidateCsvPath), true);
  assert.equal(fs.existsSync(result.metadataPath), true);

  const trainingCsv = fs.readFileSync(result.trainingCsvPath, 'utf8');
  const candidateCsv = fs.readFileSync(result.candidateCsvPath, 'utf8');

  assert.match(trainingCsv, /pair-1/);
  assert.match(trainingCsv.split('\n')[0], /label/);
  assert.match(candidateCsv, /pair-2/);
  assert.equal(candidateCsv.split('\n')[0].split(',').includes('label'), false);
});

test('filterScientificNegativeRows drops same-family and equivalent negatives', () => {
  const negativeRows = [
    {
      gene_concept_id: 10,
      disease_concept_id: 100,
      seed_phenotype_count: 4
    },
    {
      gene_concept_id: 10,
      disease_concept_id: 101,
      seed_phenotype_count: 3
    },
    {
      gene_concept_id: 10,
      disease_concept_id: 102,
      seed_phenotype_count: 2
    }
  ];

  const scientificContext = {
    existingLinksByGene: new Map([
      [10, [{ diseaseConceptId: 201 }]]
    ]),
    ancestorDepthByDisease: new Map([
      [100, new Map([[100, 0], [210, 1]])],
      [101, new Map([[101, 0]])],
      [102, new Map([[102, 0]])],
      [201, new Map([[201, 0], [210, 1]])]
    ]),
    descendantDepthByDisease: new Map([
      [100, new Map([[100, 0]])],
      [101, new Map([[101, 0]])],
      [102, new Map([[102, 0]])],
      [201, new Map([[201, 0]])]
    ]),
    diseaseMetadataById: new Map([
      [
        100,
        {
          conceptId: 100,
          canonicalCurie: 'MONDO:100',
          canonicalLabel: 'Fanconi anemia complementation group A',
          normalizedLabel: 'fanconi anemia complementation group a',
          normalizedAliases: ['fanconi anemia complementation group a'],
          identifierCuries: ['MONDO:100']
        }
      ],
      [
        101,
        {
          conceptId: 101,
          canonicalCurie: 'ORPHA:586',
          canonicalLabel: 'ORPHA:586',
          normalizedLabel: 'orpha 586',
          normalizedAliases: ['cystic fibrosis'],
          identifierCuries: ['ORPHA:586', 'MONDO:0009061']
        }
      ],
      [
        102,
        {
          conceptId: 102,
          canonicalCurie: 'MONDO:102',
          canonicalLabel: 'Clean novel disease',
          normalizedLabel: 'clean novel disease',
          normalizedAliases: ['clean novel disease'],
          identifierCuries: ['MONDO:102']
        }
      ],
      [
        201,
        {
          conceptId: 201,
          canonicalCurie: 'MONDO:201',
          canonicalLabel: 'Fanconi anemia complementation group J',
          normalizedLabel: 'fanconi anemia complementation group j',
          normalizedAliases: ['fanconi anemia complementation group j', 'cystic fibrosis'],
          identifierCuries: ['MONDO:201', 'MONDO:0009061']
        }
      ],
      [
        210,
        {
          conceptId: 210,
          canonicalCurie: 'MONDO:210',
          canonicalLabel: 'Fanconi anemia complementation group',
          normalizedLabel: 'fanconi anemia complementation group',
          normalizedAliases: ['fanconi anemia complementation group'],
          identifierCuries: ['MONDO:210']
        }
      ]
    ])
  };

  const result = filterScientificNegativeRows(negativeRows, scientificContext, {
    negativeRowLimit: 2
  });

  assert.equal(result.selectedRows.length, 1);
  assert.equal(result.selectedRows[0].disease_concept_id, 102);
  assert.deepEqual(result.exclusionBucketCounts, {
    same_family_shared_ancestor: 1,
    known_equivalent: 1
  });
});

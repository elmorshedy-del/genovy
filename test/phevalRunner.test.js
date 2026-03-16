import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPhevalDiseaseRows,
  runDxPhevalCases,
  serializePhevalDiseaseRowsToTsv,
  summarizeDxPhevalEvaluations
} from '../src/services/dx/phevalRunner.js';
import { buildDxSimilarityIndex } from '../src/services/dx/similarityEngine.js';

function buildToyIndex() {
  return buildDxSimilarityIndex({
    ontologyRows: [
      {
        child_curie: 'HP:0001250',
        child_label: 'Seizure',
        parent_curie: 'HP:0000118',
        parent_label: 'Phenotypic abnormality'
      },
      {
        child_curie: 'HP:0002376',
        child_label: 'Developmental regression',
        parent_curie: 'HP:0001263',
        parent_label: 'Global developmental delay'
      },
      {
        child_curie: 'HP:0001263',
        child_label: 'Global developmental delay',
        parent_curie: 'HP:0000118',
        parent_label: 'Phenotypic abnormality'
      }
    ],
    diseasePhenotypeRows: [
      {
        disease_entity_id: 1,
        disease_curie: 'MONDO:1',
        disease_label: 'Disease One',
        phenotype_entity_id: 101,
        phenotype_curie: 'HP:0001250',
        phenotype_label: 'Seizure',
        evidence_code: 'PCS',
        reference_text: 'PMID:1'
      },
      {
        disease_entity_id: 1,
        disease_curie: 'MONDO:1',
        disease_label: 'Disease One',
        phenotype_entity_id: 102,
        phenotype_curie: 'HP:0002376',
        phenotype_label: 'Developmental regression',
        evidence_code: 'PCS',
        reference_text: 'PMID:2'
      },
      {
        disease_entity_id: 2,
        disease_curie: 'MONDO:2',
        disease_label: 'Disease Two',
        phenotype_entity_id: 103,
        phenotype_curie: 'HP:0001263',
        phenotype_label: 'Global developmental delay',
        evidence_code: 'PCS',
        reference_text: 'PMID:3'
      }
    ]
  });
}

test('buildPhevalDiseaseRows exports disease identifiers and scores', () => {
  const rows = buildPhevalDiseaseRows(
    {
      results: [
        { diseaseCurie: 'MONDO:1', bmaScore: 2.1, normalizedScore: 0.8 },
        { diseaseCurie: 'MONDO:2', bmaScore: 1.4, normalizedScore: 0.5 }
      ]
    },
    { scoreField: 'normalizedScore' }
  );

  assert.deepEqual(rows, [
    { disease_identifier: 'MONDO:1', score: 0.8 },
    { disease_identifier: 'MONDO:2', score: 0.5 }
  ]);
  assert.match(serializePhevalDiseaseRowsToTsv(rows), /disease_identifier\tscore/);
});

test('summarizeDxPhevalEvaluations computes recall metrics from case ranks', () => {
  const summary = summarizeDxPhevalEvaluations([
    { caseId: 'a', truthDiseaseCuries: ['MONDO:1'], rank: 1 },
    { caseId: 'b', truthDiseaseCuries: ['MONDO:2'], rank: 5 },
    { caseId: 'c', truthDiseaseCuries: ['MONDO:3'], rank: null },
    { caseId: 'd', truthDiseaseCuries: [], rank: null }
  ]);

  assert.equal(summary.caseCount, 4);
  assert.equal(summary.scoredCaseCount, 3);
  assert.equal(summary.unscoredCaseCount, 1);
  assert.equal(summary.unresolvedCaseCount, 1);
  assert.equal(summary.recallAt.top1, 1 / 3);
  assert.equal(summary.recallAt.top5, 2 / 3);
});

test('runDxPhevalCases ranks phenopacket cases and preserves evaluation truth', () => {
  const index = buildToyIndex();
  index.sourceMode = 'typed_assertions';

  const run = runDxPhevalCases(index, [
    {
      caseId: 'case-1',
      fileName: 'case-1.json',
      input: {
        presentPhenotypeCuries: ['HP:0001250', 'HP:0002376'],
        excludedPhenotypeCuries: [],
        sourceFormat: 'phenopacket'
      },
      truthDiseaseCuries: ['MONDO:1']
    }
  ]);

  assert.equal(run.caseReports.length, 1);
  assert.equal(run.caseReports[0].evaluation.rank, 1);
  assert.equal(run.caseReports[0].diseaseRows[0].disease_identifier, 'MONDO:1');
  assert.equal(run.summary.recallAt.top1, 1);
});

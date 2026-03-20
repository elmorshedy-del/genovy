import test from 'node:test';
import assert from 'node:assert/strict';
import {
  benchmarkDxSimilarityIndex,
  buildDxSimilarityIndex,
  rankDiseasesByPhenotypeSimilarity,
  rankGenesByPhenotypeSimilarity
} from '../src/services/dx/similarityEngine.js';

function buildToyIndex() {
  return buildDxSimilarityIndex({
    ontologyRows: [
      { child_curie: 'HP:0001', child_label: 'Seizures', parent_curie: 'HP:0000', parent_label: 'Neurologic finding' },
      { child_curie: 'HP:0002', child_label: 'Macrocephaly', parent_curie: 'HP:0000', parent_label: 'Neurologic finding' },
      { child_curie: 'HP:0003', child_label: 'Ataxia', parent_curie: 'HP:0000', parent_label: 'Neurologic finding' },
      { child_curie: 'HP:0004', child_label: 'Hypotonia', parent_curie: 'HP:0000', parent_label: 'Neurologic finding' }
    ],
    diseasePhenotypeRows: [
      {
        disease_entity_id: 1,
        disease_curie: 'MONDO:1',
        disease_label: 'Disease A',
        phenotype_entity_id: 11,
        phenotype_curie: 'HP:0001',
        phenotype_label: 'Seizures',
        evidence_code: 'TAS',
        reference_text: 'PMID:1',
        frequency_curie: 'HP:0040280',
        frequency_label: 'Obligate',
        presence_status: 'present'
      },
      {
        disease_entity_id: 1,
        disease_curie: 'MONDO:1',
        disease_label: 'Disease A',
        phenotype_entity_id: 12,
        phenotype_curie: 'HP:0002',
        phenotype_label: 'Macrocephaly',
        evidence_code: 'TAS',
        reference_text: 'PMID:1',
        frequency_curie: 'HP:0040283',
        frequency_label: 'Occasional',
        presence_status: 'present'
      },
      {
        disease_entity_id: 2,
        disease_curie: 'MONDO:2',
        disease_label: 'Disease B',
        phenotype_entity_id: 13,
        phenotype_curie: 'HP:0003',
        phenotype_label: 'Ataxia',
        evidence_code: 'TAS',
        reference_text: 'PMID:2',
        frequency_curie: 'HP:0040282',
        frequency_label: 'Frequent',
        presence_status: 'present'
      },
      {
        disease_entity_id: 2,
        disease_curie: 'MONDO:2',
        disease_label: 'Disease B',
        phenotype_entity_id: 14,
        phenotype_curie: 'HP:0004',
        phenotype_label: 'Hypotonia',
        evidence_code: 'TAS',
        reference_text: 'PMID:2',
        frequency_curie: 'HP:0040282',
        frequency_label: 'Frequent',
        presence_status: 'present'
      },
      {
        disease_entity_id: 1,
        disease_curie: 'MONDO:1',
        disease_label: 'Disease A',
        phenotype_entity_id: 13,
        phenotype_curie: 'HP:0003',
        phenotype_label: 'Ataxia',
        evidence_code: 'TAS',
        reference_text: 'PMID:1',
        presence_status: 'absent'
      }
    ],
    genePhenotypeRows: [
      {
        gene_entity_id: 101,
        gene_curie: 'HGNC:GENEA',
        gene_label: 'GENEA',
        phenotype_entity_id: 11,
        phenotype_curie: 'HP:0001',
        phenotype_label: 'Seizures',
        evidence_code: 'Frequent',
        reference_context: 'MONDO:1'
      },
      {
        gene_entity_id: 101,
        gene_curie: 'HGNC:GENEA',
        gene_label: 'GENEA',
        phenotype_entity_id: 12,
        phenotype_curie: 'HP:0002',
        phenotype_label: 'Macrocephaly',
        evidence_code: 'Frequent',
        reference_context: 'MONDO:1'
      },
      {
        gene_entity_id: 102,
        gene_curie: 'HGNC:GENEB',
        gene_label: 'GENEB',
        phenotype_entity_id: 13,
        phenotype_curie: 'HP:0003',
        phenotype_label: 'Ataxia',
        evidence_code: 'Frequent',
        reference_context: 'MONDO:2'
      },
      {
        gene_entity_id: 102,
        gene_curie: 'HGNC:GENEB',
        gene_label: 'GENEB',
        phenotype_entity_id: 14,
        phenotype_curie: 'HP:0004',
        phenotype_label: 'Hypotonia',
        evidence_code: 'Frequent',
        reference_context: 'MONDO:2'
      }
    ]
  });
}

test('rankDiseasesByPhenotypeSimilarity ranks the closest disease first', () => {
  const index = buildToyIndex();
  const result = rankDiseasesByPhenotypeSimilarity(index, {
    phenotypeCuries: ['HP:0001', 'HP:0002'],
    limit: 2
  });

  assert.equal(result.results[0].diseaseCurie, 'MONDO:1');
  assert.equal(result.results[0].trace[0].diseasePhenotypeCurie, 'HP:0001');
  assert.equal(result.results[0].trace[0].micaCurie, 'HP:0001');
});

test('rankGenesByPhenotypeSimilarity ranks the closest gene first', () => {
  const index = buildToyIndex();
  const result = rankGenesByPhenotypeSimilarity(index, {
    phenotypeCuries: ['HP:0001', 'HP:0002'],
    limit: 2
  });

  assert.equal(result.results[0].geneCurie, 'HGNC:GENEA');
  assert.equal(result.results[0].geneSymbol, 'GENEA');
  assert.equal(result.results[0].trace[0].diseasePhenotypeCurie, 'HP:0001');
});

test('rankDiseasesByPhenotypeSimilarity falls back to ontology ancestor overlap', () => {
  const index = buildToyIndex();
  const result = rankDiseasesByPhenotypeSimilarity(index, {
    phenotypeCuries: ['HP:0001', 'HP:0004'],
    limit: 2
  });

  assert.equal(result.results.length, 2);
  assert.equal(result.results[0].matchedPhenotypeCount >= 1, true);
  assert.equal(result.results[0].trace.some((entry) => entry.micaCurie === 'HP:0000' || entry.micaCurie === 'HP:0001'), true);
});

test('benchmarkDxSimilarityIndex reports recall metrics on synthetic subsets', () => {
  const index = buildToyIndex();
  const benchmark = benchmarkDxSimilarityIndex(index, {
    maxCases: 2,
    minDiseasePhenotypeCount: 2,
    minQueryPhenotypeCount: 1,
    maxQueryPhenotypeCount: 2,
    minCoverageRatio: 0.5,
    maxCoverageRatio: 1,
    noisePhenotypeRatio: 0,
    seed: 42
  });

  assert.equal(benchmark.caseCount, 2);
  assert.equal(benchmark.recallAt.top1 > 0, true);
  assert.equal(Array.isArray(benchmark.rankResults), true);
});

test('rankDiseasesByPhenotypeSimilarity downweights occasional phenotypes against obligate matches', () => {
  const index = buildToyIndex();
  const result = rankDiseasesByPhenotypeSimilarity(index, {
    phenotypeCuries: ['HP:0001'],
    limit: 2
  });

  assert.equal(result.results[0].diseaseCurie, 'MONDO:1');
  assert.equal(result.results[0].trace[0].frequencyCurie, 'HP:0040280');
});

test('rankDiseasesByPhenotypeSimilarity surfaces contradictions from excluded patient phenotypes without applying a penalty', () => {
  const index = buildToyIndex();
  const withoutExclusion = rankDiseasesByPhenotypeSimilarity(index, {
    phenotypeCuries: ['HP:0002'],
    limit: 2
  });
  const withExclusion = rankDiseasesByPhenotypeSimilarity(index, {
    phenotypeCuries: ['HP:0002'],
    excludedPhenotypeCuries: ['HP:0001'],
    limit: 2
  });

  assert.equal(withoutExclusion.results[0].diseaseCurie, 'MONDO:1');
  assert.equal(withExclusion.results[0].diseaseCurie, 'MONDO:1');
  assert.equal(withExclusion.results[0].contradictionPenalty > 0, true);
  assert.equal(withExclusion.results[0].normalizedScore, withoutExclusion.results[0].normalizedScore);
});

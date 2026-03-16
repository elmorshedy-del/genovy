import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNoveltyAnnotation,
  NOVELTY_BUCKETS
} from '../src/ml/geneDiseaseNovelty.js';

function buildDiseaseMetadata(conceptId, canonicalLabel, normalizedLabel, aliases = []) {
  return {
    conceptId,
    canonicalCurie: canonicalLabel.startsWith('MONDO:') || canonicalLabel.startsWith('ORPHA:')
      ? canonicalLabel
      : `MONDO:${conceptId}`,
    canonicalLabel,
    normalizedLabel,
    normalizedAliases: aliases,
    identifierCuries: []
  };
}

test('buildNoveltyAnnotation marks same normalized disease identity as known equivalent', () => {
  const candidateRow = {
    rank: 1,
    prediction_score: 0.7,
    pair_id: 'pair-1',
    geneConceptId: 10,
    gene_curie: 'NCBIGene:10',
    gene_label: 'GENE10',
    diseaseConceptId: 100,
    disease_curie: 'MONDO:100',
    disease_label: 'Cystic fibrosis'
  };

  const context = {
    existingLinksByGene: new Map([
      [10, [{ diseaseConceptId: 101 }]]
    ]),
    ancestorDepthByDisease: new Map([
      [100, new Map([[100, 0]])],
      [101, new Map([[101, 0]])]
    ]),
    descendantDepthByDisease: new Map([
      [100, new Map([[100, 0]])],
      [101, new Map([[101, 0]])]
    ]),
    diseaseMetadataById: new Map([
      [100, buildDiseaseMetadata(100, 'Cystic fibrosis', 'cystic fibrosis', ['cystic fibrosis'])],
      [101, buildDiseaseMetadata(101, 'ORPHA:586', 'orpha 586', ['cystic fibrosis'])]
    ])
  };

  const annotation = buildNoveltyAnnotation(candidateRow, context);

  assert.equal(annotation.novelty_bucket, NOVELTY_BUCKETS.knownEquivalent);
  assert.equal(annotation.strict_novelty_pass, false);
  assert.equal(annotation.equivalent_match_count, 1);
});

test('buildNoveltyAnnotation marks shared disease identifiers as known equivalent', () => {
  const candidateRow = {
    rank: 1,
    prediction_score: 0.72,
    pair_id: 'pair-1b',
    geneConceptId: 11,
    gene_curie: 'NCBIGene:11',
    gene_label: 'GENE11',
    diseaseConceptId: 110,
    disease_curie: 'MONDO:110',
    disease_label: 'Shared identifier disease'
  };

  const context = {
    existingLinksByGene: new Map([
      [11, [{ diseaseConceptId: 111 }]]
    ]),
    ancestorDepthByDisease: new Map([
      [110, new Map([[110, 0]])],
      [111, new Map([[111, 0]])]
    ]),
    descendantDepthByDisease: new Map([
      [110, new Map([[110, 0]])],
      [111, new Map([[111, 0]])]
    ]),
    diseaseMetadataById: new Map([
      [
        110,
        {
          ...buildDiseaseMetadata(110, 'Disease Alpha', 'disease alpha', ['disease alpha']),
          identifierCuries: ['MONDO:110', 'OMIM:123456']
        }
      ],
      [
        111,
        {
          ...buildDiseaseMetadata(111, 'Disease Beta', 'disease beta', ['disease beta']),
          identifierCuries: ['ORPHA:111', 'OMIM:123456']
        }
      ]
    ])
  };

  const annotation = buildNoveltyAnnotation(candidateRow, context);

  assert.equal(annotation.novelty_bucket, NOVELTY_BUCKETS.knownEquivalent);
  assert.equal(annotation.strict_novelty_pass, false);
  assert.equal(annotation.equivalent_match_count, 1);
});

test('buildNoveltyAnnotation marks same-family sibling diseases via shared close ancestor', () => {
  const candidateRow = {
    rank: 1,
    prediction_score: 0.6,
    pair_id: 'pair-2',
    geneConceptId: 20,
    gene_curie: 'NCBIGene:20',
    gene_label: 'GENE20',
    diseaseConceptId: 200,
    disease_curie: 'MONDO:200',
    disease_label: 'Fanconi anemia complementation group A'
  };

  const context = {
    existingLinksByGene: new Map([
      [20, [{ diseaseConceptId: 201 }]]
    ]),
    ancestorDepthByDisease: new Map([
      [200, new Map([[200, 0], [210, 1]])],
      [201, new Map([[201, 0], [210, 1]])]
    ]),
    descendantDepthByDisease: new Map([
      [200, new Map([[200, 0]])],
      [201, new Map([[201, 0]])]
    ]),
    diseaseMetadataById: new Map([
      [
        200,
        buildDiseaseMetadata(
          200,
          'Fanconi anemia complementation group A',
          'fanconi anemia complementation group a',
          ['fanconi anemia complementation group a']
        )
      ],
      [
        201,
        buildDiseaseMetadata(
          201,
          'Fanconi anemia complementation group J',
          'fanconi anemia complementation group j',
          ['fanconi anemia complementation group j']
        )
      ],
      [
        210,
        buildDiseaseMetadata(
          210,
          'Fanconi anemia complementation group',
          'fanconi anemia complementation group',
          ['fanconi anemia complementation group']
        )
      ]
    ])
  };

  const annotation = buildNoveltyAnnotation(candidateRow, context);

  assert.equal(annotation.novelty_bucket, NOVELTY_BUCKETS.sameFamilySharedAncestor);
  assert.equal(annotation.strict_novelty_pass, false);
  assert.equal(annotation.shared_family_match_count, 1);
});

test('buildNoveltyAnnotation keeps truly unmatched candidates as novel', () => {
  const candidateRow = {
    rank: 1,
    prediction_score: 0.55,
    pair_id: 'pair-3',
    geneConceptId: 30,
    gene_curie: 'NCBIGene:30',
    gene_label: 'GENE30',
    diseaseConceptId: 300,
    disease_curie: 'MONDO:300',
    disease_label: 'Novel disease'
  };

  const context = {
    existingLinksByGene: new Map([[30, [{ diseaseConceptId: 301 }]]]),
    ancestorDepthByDisease: new Map([
      [300, new Map([[300, 0], [320, 3]])],
      [301, new Map([[301, 0], [321, 3]])]
    ]),
    descendantDepthByDisease: new Map([
      [300, new Map([[300, 0]])],
      [301, new Map([[301, 0]])]
    ]),
    diseaseMetadataById: new Map([
      [300, buildDiseaseMetadata(300, 'Novel disease', 'novel disease', ['novel disease'])],
      [301, buildDiseaseMetadata(301, 'Different disease', 'different disease', ['different disease'])],
      [320, buildDiseaseMetadata(320, 'Remote ancestor', 'remote ancestor', ['remote ancestor'])],
      [321, buildDiseaseMetadata(321, 'Other remote ancestor', 'other remote ancestor', ['other remote ancestor'])]
    ])
  };

  const annotation = buildNoveltyAnnotation(candidateRow, context);

  assert.equal(annotation.novelty_bucket, NOVELTY_BUCKETS.novelCandidate);
  assert.equal(annotation.strict_novelty_pass, true);
  assert.equal(annotation.novelty_adjusted_score, 0.55);
});

test('buildNoveltyAnnotation flags code-like disease concepts as under-normalized', () => {
  const candidateRow = {
    rank: 1,
    prediction_score: 0.48,
    pair_id: 'pair-4',
    geneConceptId: 40,
    gene_curie: 'NCBIGene:40',
    gene_label: 'GENE40',
    diseaseConceptId: 400,
    disease_curie: 'ORPHA:586',
    disease_label: 'ORPHA:586'
  };

  const context = {
    existingLinksByGene: new Map(),
    ancestorDepthByDisease: new Map([[400, new Map([[400, 0]])]]),
    descendantDepthByDisease: new Map([[400, new Map([[400, 0]])]]),
    diseaseMetadataById: new Map([
      [400, buildDiseaseMetadata(400, 'ORPHA:586', 'orpha 586', ['orpha 586'])]
    ])
  };

  const annotation = buildNoveltyAnnotation(candidateRow, context);

  assert.equal(annotation.novelty_bucket, NOVELTY_BUCKETS.underNormalizedDiseaseIdentity);
  assert.equal(annotation.strict_novelty_pass, false);
  assert.equal(annotation.novelty_adjusted_score, 0);
});

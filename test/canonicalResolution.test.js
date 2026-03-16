import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CANONICAL_RESOLUTION_STRATEGY,
  buildCanonicalSeed,
  groupEntitiesIntoCanonicalConcepts,
  selectPreferredEntity
} from '../src/lib/canonicalResolution.js';

test('buildCanonicalSeed prefers official identifiers over label fallback', () => {
  const seed = buildCanonicalSeed({
    entityType: 'disease',
    canonicalCurie: 'PLACEHOLDER:DISEASE:abc',
    canonicalLabel: 'Breast carcinoma',
    xrefCuries: ['OMIM:114480', 'MONDO:0007254']
  });

  assert.equal(seed.canonicalKey, 'identifier:MONDO:0007254');
  assert.equal(seed.canonicalCurie, 'MONDO:0007254');
  assert.equal(seed.resolutionStrategy, CANONICAL_RESOLUTION_STRATEGY.EXACT_IDENTIFIER);
});

test('buildCanonicalSeed falls back to exact normalized label when no trusted identifier exists', () => {
  const seed = buildCanonicalSeed({
    entityType: 'disease',
    canonicalCurie: 'PLACEHOLDER:DISEASE:abc',
    canonicalLabel: 'Congenital myasthenic syndrome',
    xrefCuries: []
  });

  assert.equal(seed.canonicalKey, 'label:disease:congenital myasthenic syndrome');
  assert.equal(seed.resolutionStrategy, CANONICAL_RESOLUTION_STRATEGY.EXACT_LABEL);
});

test('selectPreferredEntity favors non-placeholder official entities', () => {
  const selected = selectPreferredEntity([
    {
      entityId: 11,
      entityType: 'gene',
      canonicalLabel: 'BRCA1',
      description: '',
      isPlaceholder: true,
      seed: {
        canonicalCurie: '',
        resolutionStrategy: CANONICAL_RESOLUTION_STRATEGY.EXACT_LABEL
      }
    },
    {
      entityId: 4,
      entityType: 'gene',
      canonicalLabel: 'BRCA1',
      description: 'breast cancer type 1 susceptibility gene',
      isPlaceholder: false,
      seed: {
        canonicalCurie: 'HGNC:1100',
        resolutionStrategy: CANONICAL_RESOLUTION_STRATEGY.EXACT_IDENTIFIER
      }
    }
  ]);

  assert.equal(selected.entityId, 4);
});

test('groupEntitiesIntoCanonicalConcepts merges exact identifier matches into one concept', () => {
  const groups = groupEntitiesIntoCanonicalConcepts([
    {
      entityId: 1,
      entityType: 'gene',
      canonicalCurie: 'HGNC:1100',
      canonicalLabel: 'BRCA1',
      description: '',
      isPlaceholder: false,
      xrefCuries: ['NCBIGene:672']
    },
    {
      entityId: 2,
      entityType: 'gene',
      canonicalCurie: 'PLACEHOLDER:GENE:1',
      canonicalLabel: 'Breast cancer 1 gene',
      description: '',
      isPlaceholder: true,
      xrefCuries: ['HGNC:1100']
    }
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].canonicalCurie, 'HGNC:1100');
  assert.deepEqual(groups[0].memberEntityIds, [1, 2]);
});

test('groupEntitiesIntoCanonicalConcepts bridges HGNC and NCBIGene genes by exact symbol', () => {
  const groups = groupEntitiesIntoCanonicalConcepts([
    {
      entityId: 10,
      entityType: 'gene',
      canonicalCurie: 'NCBIGene:6812',
      canonicalLabel: 'STXBP1',
      description: '',
      isPlaceholder: false,
      xrefCuries: []
    },
    {
      entityId: 11,
      entityType: 'gene',
      canonicalCurie: 'HGNC:11444',
      canonicalLabel: 'STXBP1',
      description: '',
      isPlaceholder: false,
      xrefCuries: []
    }
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].canonicalCurie, 'HGNC:11444');
  assert.equal(groups[0].resolutionStrategy, CANONICAL_RESOLUTION_STRATEGY.GENE_SYMBOL_BRIDGE);
  assert.deepEqual(groups[0].memberEntityIds, [10, 11]);
});

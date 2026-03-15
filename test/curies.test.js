import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlaceholderCurie, normalizeCurie, normalizeLabel } from '../src/lib/curies.js';

test('normalizeCurie compacts OBO URLs', () => {
  assert.equal(
    normalizeCurie('http://purl.obolibrary.org/obo/MONDO_0000001'),
    'MONDO:0000001'
  );
  assert.equal(
    normalizeCurie('https://purl.obolibrary.org/obo/HP_0001250'),
    'HP:0001250'
  );
  assert.equal(normalizeCurie('NCBIGene:NCBIGene:1134'), 'NCBIGene:1134');
  assert.equal(normalizeCurie('OMIM:OMIM:114480'), 'OMIM:114480');
});

test('normalizeLabel collapses whitespace and case', () => {
  assert.equal(normalizeLabel('  Rare   Disease  '), 'rare disease');
});

test('buildPlaceholderCurie is deterministic', () => {
  assert.equal(
    buildPlaceholderCurie('disease', 'Rare Disease Example'),
    buildPlaceholderCurie('disease', 'Rare Disease Example')
  );
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { filterBootstrapSourceKeys, shouldSkipCompletedSources } from '../src/lib/bootstrapSources.js';

test('shouldSkipCompletedSources defaults to true', () => {
  assert.equal(shouldSkipCompletedSources({}), true);
  assert.equal(shouldSkipCompletedSources({ skipCompletedSources: false }), false);
  assert.equal(shouldSkipCompletedSources({ includeCompletedSources: true }), false);
});

test('filterBootstrapSourceKeys removes already-successful sources by default', () => {
  const filtered = filterBootstrapSourceKeys(
    ['mondo_ontology', 'hpo_ontology', 'clinvar_gene_disease'],
    ['mondo_ontology']
  );

  assert.deepEqual(filtered, ['hpo_ontology', 'clinvar_gene_disease']);
});

test('filterBootstrapSourceKeys keeps all sources when includeCompletedSources is set', () => {
  const filtered = filterBootstrapSourceKeys(
    ['mondo_ontology', 'hpo_ontology'],
    ['mondo_ontology'],
    { includeCompletedSources: true }
  );

  assert.deepEqual(filtered, ['mondo_ontology', 'hpo_ontology']);
});

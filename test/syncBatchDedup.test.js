import test from 'node:test';
import assert from 'node:assert/strict';
import { dedupeEvidenceRows, dedupeRelationshipsByKey } from '../src/lib/syncBatchDedup.js';

test('dedupeRelationshipsByKey keeps one row per relationship key', () => {
  const rows = dedupeRelationshipsByKey([
    { relationshipKey: 'a', subjectEntityId: 1 },
    { relationshipKey: 'a', subjectEntityId: 1 },
    { relationshipKey: 'b', subjectEntityId: 2 }
  ]);

  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((row) => row.relationshipKey).sort(),
    ['a', 'b']
  );
});

test('dedupeEvidenceRows merges duplicate evidence keys', () => {
  const rows = dedupeEvidenceRows([
    {
      relationshipId: 1,
      sourceKey: 'hpo',
      sourceRecordKey: 'record-1',
      evidenceType: 'annotation',
      evidenceCode: 'IEA',
      confidenceScore: null,
      provenanceUrl: '',
      payload: { first: true }
    },
    {
      relationshipId: 1,
      sourceKey: 'hpo',
      sourceRecordKey: 'record-1',
      evidenceType: 'annotation',
      evidenceCode: 'IEA',
      confidenceScore: 0.9,
      provenanceUrl: 'https://example.com',
      payload: { second: true }
    }
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].confidenceScore, 0.9);
  assert.equal(rows[0].provenanceUrl, 'https://example.com');
  assert.deepEqual(rows[0].payload, { first: true, second: true });
});

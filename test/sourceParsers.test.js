import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDelimitedText } from '../src/lib/parseDelimited.js';

test('parseDelimitedText handles metadata comments and rows', () => {
  const parsed = parseDelimitedText(
    '#version: 2026-01-01\n#note: test\nid\tlabel\nA1\tAlpha\nA2\tBeta\n'
  );
  assert.equal(parsed.metadata.version, '2026-01-01');
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[0].id, 'A1');
});

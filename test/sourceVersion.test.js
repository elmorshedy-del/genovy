import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractClinGenFileCreated,
  extractHeaderSourceVersion,
  pickSourceVersion
} from '../src/lib/sourceVersion.js';

test('pickSourceVersion returns the first non-empty candidate', () => {
  assert.equal(pickSourceVersion('', '  ', '2026-03-22', 'fallback'), '2026-03-22');
});

test('extractHeaderSourceVersion prefers Last-Modified before ETag', () => {
  const headers = new Headers({
    'last-modified': 'Sun, 22 Mar 2026 14:17:20 GMT',
    etag: '"abc123"'
  });
  assert.equal(extractHeaderSourceVersion(headers), 'Sun, 22 Mar 2026 14:17:20 GMT');
});

test('extractClinGenFileCreated parses file-created preamble dates', () => {
  const text = [
    '"CLINGEN GENE DISEASE VALIDITY CURATIONS","",""',
    '"FILE CREATED: 2026-03-22","",""',
    '"GENE SYMBOL","GENE ID (HGNC)"'
  ].join('\n');

  assert.equal(extractClinGenFileCreated(text), '2026-03-22');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'zlib';
import { isGzipBuffer } from '../src/lib/sourceFetch.js';

test('gzip magic bytes are required before gunzip logic should matter', () => {
  const gzipped = zlib.gzipSync(Buffer.from('hello world', 'utf8'));
  const plain = Buffer.from('hello world', 'utf8');

  assert.equal(isGzipBuffer(gzipped), true);
  assert.equal(isGzipBuffer(plain), false);
});

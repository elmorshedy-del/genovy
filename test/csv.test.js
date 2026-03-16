import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv } from '../src/lib/csv.js';

test('parseCsv handles quoted commas and newlines', () => {
  const rows = parseCsv(
    'name,label\n' +
      'gene1,"Fanconi anemia, complementation group A"\n' +
      'gene2,"line one\nline two"\n'
  );

  assert.deepEqual(rows, [
    {
      name: 'gene1',
      label: 'Fanconi anemia, complementation group A'
    },
    {
      name: 'gene2',
      label: 'line one\nline two'
    }
  ]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { pickLangName, xmlText } from '../src/lib/xml.js';

test('xmlText handles primitive numeric nodes from XML parsers', () => {
  assert.equal(xmlText(166024), '166024');
  assert.equal(xmlText(true), 'true');
});

test('pickLangName prefers the requested language and falls back safely', () => {
  assert.equal(
    pickLangName({
      Name: [
        { '@_lang': 'fr', $text: 'Nom' },
        { '@_lang': 'en', $text: 'Name' }
      ]
    }),
    'Name'
  );
});

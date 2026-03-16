import { XMLParser } from 'fast-xml-parser';

const XML_PARSER = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '$text',
  trimValues: true
});

export function parseXmlDocument(xmlText) {
  return XML_PARSER.parse(xmlText);
}

export function asArray(value) {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

export function xmlText(value) {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  if (typeof value.$text === 'string') {
    return value.$text.trim();
  }
  return '';
}

export function pickLangName(node, fieldName = 'Name', lang = 'en') {
  const options = asArray(node?.[fieldName]);
  if (!options.length) {
    return '';
  }

  const preferred = options.find((entry) => String(entry?.['@_lang'] || '').toLowerCase() === lang.toLowerCase());
  return xmlText(preferred || options[0]);
}

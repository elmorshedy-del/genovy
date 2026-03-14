import crypto from 'crypto';

const OBO_PREFIXES = Object.freeze({
  HP: 'HP:',
  MONDO: 'MONDO:',
  ORPHA: 'ORPHA:',
  OMIM: 'OMIM:'
});

function compactOboIdentifier(rawValue) {
  for (const [fragment, prefix] of Object.entries(OBO_PREFIXES)) {
    const marker = `${fragment}_`;
    if (rawValue.includes(marker)) {
      const suffix = rawValue.split(marker).pop();
      return `${prefix}${suffix}`;
    }
  }
  return rawValue;
}

export function normalizeCurie(rawValue) {
  if (!rawValue) return '';
  const trimmed = String(rawValue).trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://purl.obolibrary.org/obo/')) {
    return compactOboIdentifier(trimmed);
  }
  if (trimmed.startsWith('https://purl.obolibrary.org/obo/')) {
    return compactOboIdentifier(trimmed);
  }
  if (trimmed.startsWith('http://identifiers.org/hgnc/')) {
    return `HGNC:${trimmed.split('/').pop()}`;
  }
  if (/^[A-Z][A-Z0-9_]+:\S+$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

export function normalizeLabel(rawValue) {
  return String(rawValue || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function stableHash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export function buildPlaceholderCurie(entityType, label) {
  const digest = stableHash(`${entityType}|${normalizeLabel(label)}`).slice(0, 16);
  return `PLACEHOLDER:${entityType.toUpperCase()}:${digest}`;
}

export function splitCuriePrefix(curie) {
  const normalized = normalizeCurie(curie);
  if (!normalized.includes(':')) {
    return { prefix: '', localId: normalized };
  }
  const separatorIndex = normalized.indexOf(':');
  return {
    prefix: normalized.slice(0, separatorIndex),
    localId: normalized.slice(separatorIndex + 1)
  };
}

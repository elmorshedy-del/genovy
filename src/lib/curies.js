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

function collapseRepeatedPrefix(rawValue) {
  let value = rawValue;
  let match = value.match(/^([A-Za-z][A-Za-z0-9_]+):\1:(.+)$/);

  while (match) {
    value = `${match[1]}:${match[2]}`;
    match = value.match(/^([A-Za-z][A-Za-z0-9_]+):\1:(.+)$/);
  }

  return value;
}

export function normalizeCurie(rawValue) {
  if (!rawValue) return '';
  const trimmed = String(rawValue).trim();
  if (!trimmed) return '';
  if (/^Orphanet:/i.test(trimmed)) {
    return `ORPHA:${trimmed.split(':').slice(1).join(':')}`;
  }
  if (trimmed.startsWith('http://purl.obolibrary.org/obo/')) {
    return compactOboIdentifier(trimmed);
  }
  if (trimmed.startsWith('https://purl.obolibrary.org/obo/')) {
    return compactOboIdentifier(trimmed);
  }
  if (trimmed.startsWith('http://identifiers.org/hgnc/')) {
    return `HGNC:${trimmed.split('/').pop()}`;
  }
  if (/^[A-Za-z][A-Za-z0-9_]+:\S+$/.test(trimmed)) {
    return collapseRepeatedPrefix(trimmed);
  }
  return trimmed;
}

export function normalizeNcbiGeneCurie(rawValue) {
  const normalized = normalizeCurie(rawValue);
  if (normalized.startsWith('NCBIGene:')) {
    return normalized;
  }

  const trimmed = String(rawValue || '').trim();
  if (/^\d+$/.test(trimmed)) {
    return `NCBIGene:${trimmed}`;
  }

  return '';
}

export function isLikelyGeneSymbol(rawValue) {
  const trimmed = String(rawValue || '').trim();
  if (!trimmed || /\s/.test(trimmed) || trimmed.includes(':')) {
    return false;
  }

  return /^[A-Za-z0-9][A-Za-z0-9-]*$/.test(trimmed);
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

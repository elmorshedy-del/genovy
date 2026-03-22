export function normalizeSourceVersion(value) {
  return String(value || '').trim();
}

export function pickSourceVersion(...values) {
  for (const value of values) {
    const normalized = normalizeSourceVersion(value);
    if (normalized) {
      return normalized;
    }
  }
  return '';
}

export function extractHeaderSourceVersion(headers) {
  return pickSourceVersion(
    headers?.get?.('last-modified'),
    headers?.get?.('etag')
  );
}

export function extractClinGenFileCreated(text) {
  const match = String(text || '').match(/"FILE CREATED:\s*([^"]+)"/i);
  return match ? normalizeSourceVersion(match[1]) : '';
}

import { extractNbkId, normalizeText, slugify } from './genereviewsPipeline.js';

function coerceArray(value) {
  return Array.isArray(value) ? value : [];
}

function coerceString(value) {
  const text = String(value || '').trim();
  return text || null;
}

function normalizeChapter(chapterValue, payload = {}) {
  if (chapterValue && typeof chapterValue === 'object' && !Array.isArray(chapterValue)) {
    const title = coerceString(chapterValue.title || chapterValue.chapter_title || chapterValue.name);
    const nbkId = coerceString(chapterValue.nbk_id || chapterValue.nbkId || extractNbkId(title || ''));
    const chapterKey = coerceString(chapterValue.chapter_key || chapterValue.chapterKey || deriveChapterKey(title));
    const mode = coerceString(chapterValue.mode || payload.mode);
    return {
      chapter_key: chapterKey,
      nbk_id: nbkId,
      title,
      mode
    };
  }

  if (typeof chapterValue === 'string') {
    const title = coerceString(chapterValue);
    return {
      chapter_key: coerceString(deriveChapterKey(title)),
      nbk_id: coerceString(extractNbkId(title || '')),
      title,
      mode: coerceString(payload.mode)
    };
  }

  const fallbackTitle = coerceString(payload.title || payload.chapter_title);
  return {
    chapter_key: coerceString(payload.chapter_key || payload.chapterKey || deriveChapterKey(fallbackTitle)),
    nbk_id: coerceString(payload.nbk_id || payload.nbkId || extractNbkId(fallbackTitle || '')),
    title: fallbackTitle,
    mode: coerceString(payload.mode)
  };
}

function deriveChapterKey(title) {
  const baseTitle = String(title || '')
    .split(' - ')[0]
    .trim();
  return slugify(baseTitle || '');
}

function normalizePhenotypeEntry(entry, bucket, inputIndex) {
  if (typeof entry === 'string') {
    const label = coerceString(entry);
    if (!label) return null;
    return {
      label,
      category: null,
      details: null,
      extraction_bucket: bucket,
      status: bucket === 'excluded' ? 'excluded' : 'present',
      input_index: inputIndex
    };
  }

  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;

  const label = coerceString(entry.label || entry.term || entry.finding || entry.name);
  if (!label) return null;

  return {
    label,
    category: coerceString(entry.category),
    details: coerceString(entry.details || entry.modifier || entry.context),
    extraction_bucket: bucket,
    status: bucket === 'excluded' ? 'excluded' : 'present',
    input_index: inputIndex
  };
}

function mergeRowsByKey(rows) {
  const ordered = [];
  const rowByKey = new Map();

  for (const row of rows) {
    const key = `${normalizeText(row.label)}::${row.extraction_bucket}`;
    const existing = rowByKey.get(key);
    if (!existing) {
      const next = { ...row };
      rowByKey.set(key, next);
      ordered.push(next);
      continue;
    }
    if (!existing.category && row.category) existing.category = row.category;
    if (!existing.details && row.details) existing.details = row.details;
  }

  return ordered;
}

function normalizeGroupedPhenotypes(phenotypes) {
  const rawRows = [];
  const buckets = ['present', 'excluded', 'uncertain'];

  for (const bucket of buckets) {
    const entries = coerceArray(phenotypes?.[bucket]);
    entries.forEach((entry, index) => {
      const normalized = normalizePhenotypeEntry(entry, bucket, index);
      if (normalized) rawRows.push(normalized);
    });
  }

  const deduped = mergeRowsByKey(rawRows);
  return {
    present: deduped.filter((row) => row.extraction_bucket === 'present'),
    excluded: deduped.filter((row) => row.extraction_bucket === 'excluded'),
    uncertain: deduped.filter((row) => row.extraction_bucket === 'uncertain')
  };
}

function normalizeFlatPhenotypes(phenotypes) {
  const rows = mergeRowsByKey(
    coerceArray(phenotypes)
      .map((entry, index) => normalizePhenotypeEntry(entry, 'present', index))
      .filter(Boolean)
  );

  return {
    present: rows,
    excluded: [],
    uncertain: []
  };
}

function normalizeNoteEntry(entry) {
  if (typeof entry === 'string') return coerceString(entry);
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  return coerceString(entry.note || entry.text || entry.context || entry.finding);
}

function normalizeNegativeEntry(entry) {
  if (typeof entry === 'string') {
    const finding = coerceString(entry);
    return finding ? { finding, context: null } : null;
  }

  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;

  const finding = coerceString(entry.finding || entry.label || entry.term || entry.name);
  if (!finding) return null;

  return {
    finding,
    context: coerceString(entry.context || entry.details || entry.note)
  };
}

export function normalizeExternalPhenotypeExtraction(payload) {
  const normalizedPhenotypes = Array.isArray(payload?.phenotypes)
    ? normalizeFlatPhenotypes(payload.phenotypes)
    : normalizeGroupedPhenotypes(payload?.phenotypes || {});

  return {
    chapter: normalizeChapter(payload?.chapter, payload || {}),
    phenotypes: normalizedPhenotypes,
    context_metadata:
      payload?.context_metadata && typeof payload.context_metadata === 'object' && !Array.isArray(payload.context_metadata)
        ? payload.context_metadata
        : payload?.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
          ? payload.metadata
          : {},
    context_notes: coerceArray(payload?.context_notes).map(normalizeNoteEntry).filter(Boolean),
    negative_or_contrastive_findings: coerceArray(payload?.negative_or_contrastive_findings)
      .map(normalizeNegativeEntry)
      .filter(Boolean)
  };
}

export function toFinalizeCandidateRows(normalizedPayload, options = {}) {
  const includeUncertain = Boolean(options.includeUncertain);
  const rows = [
    ...coerceArray(normalizedPayload?.phenotypes?.present),
    ...coerceArray(normalizedPayload?.phenotypes?.excluded),
    ...(includeUncertain ? coerceArray(normalizedPayload?.phenotypes?.uncertain) : [])
  ];

  return rows.map((row) => ({
    label: row.label,
    status: row.status,
    category: row.category,
    details: row.details,
    extraction_bucket: row.extraction_bucket
  }));
}

export function enrichFinalizedCandidates(finalizedRows, inputRows) {
  const queues = new Map();

  for (const row of inputRows || []) {
    const key = `${normalizeText(row.label)}::${String(row.status || 'present').toLowerCase()}`;
    const queue = queues.get(key) || [];
    queue.push(row);
    queues.set(key, queue);
  }

  return (finalizedRows || []).map((row) => {
    const key = `${normalizeText(row.label)}::${String(row.status || 'present').toLowerCase()}`;
    const queue = queues.get(key) || [];
    const sourceRow = queue.length > 0 ? queue.shift() : null;
    if (!sourceRow) return row;
    return {
      ...row,
      category: sourceRow.category || null,
      details: sourceRow.details || null,
      extraction_bucket: sourceRow.extraction_bucket || null
    };
  });
}

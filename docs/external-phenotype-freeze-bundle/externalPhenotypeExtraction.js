import { extractNbkId, normalizeText, slugify } from './genereviewsPipeline.js';

const PHENOTYPE_BUCKETS = Object.freeze(['present', 'excluded', 'uncertain']);

const ANCILLARY_BUCKETS = Object.freeze([
  'laboratory',
  'imaging',
  'pathology',
  'electrophysiology',
  'treatment_response',
  'clinical_test',
  'management_context',
  'other'
]);

const STANDARD_CONTEXT_METADATA_KEYS = Object.freeze([
  'onset',
  'inheritance',
  'gene',
  'prevalence',
  'prognosis',
  'natural_history',
  'family_risk',
  'founder_variant'
]);

const ANCILLARY_LABEL_PATTERNS = Object.freeze({
  laboratory: Object.freeze([
    /\bviremia\b/i,
    /\bautoantibod(?:y|ies)\b/i,
    /\bantibod(?:y|ies)\b/i,
    /\b(acylcarnitine|immunoglobulin|macrocytosis|monocytopenia|lymphopenia|hypogammaglobulinemia)\b/i,
    /\b(cd[0-9]+\+?|t[- ]?cell|b[- ]?cell|nk[- ]?cell)\b/i,
    /\b(count|counts|level|levels|profile|proliferation|expression|fraction|fractions|karyotype)\b/i,
    /\b(trec|tsh|iga|igm|ige|igg|cpk|creatine phosphokinase|transaminases?)\b/i
  ]),
  imaging: Object.freeze([
    /\bon (?:brain )?mri\b/i,
    /\bon chest ct\b/i,
    /\bon ct\b/i,
    /\bon ultrasound\b/i,
    /\bon x[- ]?ray\b/i,
    /\bimaging\b/i,
    /\bmri\b/i,
    /\bct\b/i,
    /\bangiograph/i,
    /\bradiograph/i
  ]),
  pathology: Object.freeze([
    /\bbiopsy\b/i,
    /\bbone marrow\b/i,
    /\bhistopath/i,
    /\bhistolog/i,
    /\bdysplasia\b/i,
    /\bvacuol/i,
    /\bhypercellular/i,
    /\binterstitial nephritis\b/i
  ]),
  electrophysiology: Object.freeze([
    /\beeg\b/i,
    /\bemg\b/i,
    /\bncs\b/i,
    /\berg\b/i,
    /\becg\b/i,
    /\bacoustic reflex/i,
    /\belectrophysi/i
  ]),
  clinical_test: Object.freeze([
    /\bnewborn screening\b/i,
    /\bscreening\b/i,
    /\burodynamic/i,
    /\btest(?:ing)?\b/i,
    /\banalysis\b/i,
    /\bobserved on\b/i,
    /\bdetected on\b/i
  ]),
  management_context: Object.freeze([
    /\btreated with\b/i,
    /\btherapy\b/i,
    /\btherapies\b/i,
    /\btreatment\b/i,
    /\bmanagement\b/i,
    /\bprophylaxis\b/i,
    /\bhsct\b/i,
    /\btransplant\b/i,
    /\bconditioning\b/i,
    /\bgvhd\b/i,
    /\bfundoplication\b/i,
    /\bgastrostomy\b/i,
    /\bavoid\b/i,
    /\brecommended\b/i,
    /\brequire(?:d|s)?\b/i,
    /\bcurative\b/i,
    /\bsurgical correction\b/i,
    /\bdiet\b/i,
    /\bsupplementation\b/i
  ]),
  other: Object.freeze([])
});

const NON_PHENOTYPE_EXCLUDED_PATTERNS = Object.freeze([
  /\b(count|counts|level|levels|profile|expression|repertoire|fraction|fractions)\b/i,
  /\b(cd[0-9]+\+?|t[- ]?cell|b[- ]?cell|nk[- ]?cell)\b/i,
  /\bnormal\b/i,
  /\bpreserved\b/i,
  /\bintact\b/i,
  /\bunaffected\b/i
]);

const EXPOSURE_OR_TRIGGER_CONTEXT_PATTERNS = Object.freeze([
  /\bfollowing\b/i,
  /\bdue to\b/i,
  /\bafter\b/i,
  /\btrigger(?:ed)? by\b/i,
  /\bprovoked by\b/i,
  /\bpost[- ]/i
]);

const TREATMENT_RESPONSE_QUALIFIER_PATTERNS = Object.freeze([
  /\b(?:treatment|therapy|drug|steroid|glucocorticoid|medication|dmard|dmards|immunosuppressive)\s*[- ]\s*(?:resistant|refractory|responsive|sensitive|unresponsive|amenable|dependent)\b/i,
  /\b(?:resistant|refractory|responsive|sensitive|unresponsive|amenable|dependent)\s+to\s+[^,;]+/i,
  /\bfailure to respond to\s+[^,;]+/i,
  /\bglucocorticoid[- ]sensitive\b/i,
  /\bsteroid[- ]responsive\b/i
]);

function coerceArray(value) {
  return Array.isArray(value) ? value : [];
}

function coerceString(value) {
  const text = String(value || '').trim();
  return text || null;
}

function emptyAncillaryBuckets() {
  return Object.fromEntries(ANCILLARY_BUCKETS.map((bucket) => [bucket, []]));
}

function deriveChapterKey(title) {
  const baseTitle = String(title || '')
    .split(' - ')[0]
    .trim();
  return slugify(baseTitle || '');
}

function normalizeChapter(chapterValue, payload = {}) {
  if (chapterValue && typeof chapterValue === 'object' && !Array.isArray(chapterValue)) {
    const title = coerceString(chapterValue.title || chapterValue.chapter_title || chapterValue.name);
    const nbkId = coerceString(chapterValue.nbk_id || chapterValue.nbkId || extractNbkId(title || ''));
    const chapterKey = coerceString(chapterValue.chapter_key || chapterValue.chapterKey || deriveChapterKey(title));
    const mode = coerceString(chapterValue.mode || payload.mode || 'discovery');
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
      mode: coerceString(payload.mode || 'discovery')
    };
  }

  const fallbackTitle = coerceString(payload.title || payload.chapter_title);
  return {
    chapter_key: coerceString(payload.chapter_key || payload.chapterKey || deriveChapterKey(fallbackTitle)),
    nbk_id: coerceString(payload.nbk_id || payload.nbkId || extractNbkId(fallbackTitle || '')),
    title: fallbackTitle,
    mode: coerceString(payload.mode || 'discovery')
  };
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

  for (const bucket of PHENOTYPE_BUCKETS) {
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

function normalizeAncillaryEntry(entry) {
  if (typeof entry === 'string') return coerceString(entry);
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  return coerceString(entry.text || entry.label || entry.finding || entry.note || entry.context || entry.name);
}

function normalizeAncillaryEvidence(payload) {
  const ancillary = emptyAncillaryBuckets();
  const source = payload?.ancillary_clinical_evidence || {};

  for (const bucket of ANCILLARY_BUCKETS) {
    ancillary[bucket] = dedupeStrings(
      coerceArray(source?.[bucket]).map(normalizeAncillaryEntry).filter(Boolean)
    );
  }

  return ancillary;
}

function normalizeMetadataKeySegment(key) {
  return String(key || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function flattenMetadataObject(value, prefix = '', output = {}) {
  if (value === null || value === undefined) return output;

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    if (prefix) output[prefix] = String(value);
    return output;
  }

  if (Array.isArray(value)) {
    if (prefix) {
      output[prefix] = value.every((entry) => ['string', 'number', 'boolean'].includes(typeof entry))
        ? value.map((entry) => String(entry)).join('; ')
        : JSON.stringify(value);
    }
    return output;
  }

  if (typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      const segment = normalizeMetadataKeySegment(key);
      if (!segment) continue;
      const nextPrefix = prefix ? `${prefix}_${segment}` : segment;
      flattenMetadataObject(nestedValue, nextPrefix, output);
    }
  }

  return output;
}

function normalizeContextMetadata(payload) {
  const source =
    payload?.context_metadata && typeof payload.context_metadata === 'object' && !Array.isArray(payload.context_metadata)
      ? payload.context_metadata
      : payload?.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
        ? payload.metadata
        : {};

  const flattened = flattenMetadataObject(source);
  const ordered = {};

  for (const key of STANDARD_CONTEXT_METADATA_KEYS) {
    if (flattened[key]) ordered[key] = flattened[key];
  }

  for (const key of Object.keys(flattened).sort()) {
    if (ordered[key]) continue;
    ordered[key] = flattened[key];
  }

  return ordered;
}

function dedupeStrings(values) {
  const seen = new Set();
  const deduped = [];

  for (const value of values || []) {
    const text = coerceString(value);
    if (!text) continue;
    const key = normalizeText(text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(text);
  }

  return deduped;
}

function matchesAnyPattern(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function inferAncillaryBucket(text) {
  if (!text) return null;
  if (matchesAnyPattern(text, ANCILLARY_LABEL_PATTERNS.laboratory)) return 'laboratory';
  if (matchesAnyPattern(text, ANCILLARY_LABEL_PATTERNS.imaging)) return 'imaging';
  if (matchesAnyPattern(text, ANCILLARY_LABEL_PATTERNS.pathology)) return 'pathology';
  if (matchesAnyPattern(text, ANCILLARY_LABEL_PATTERNS.electrophysiology)) return 'electrophysiology';
  if (matchesAnyPattern(text, ANCILLARY_LABEL_PATTERNS.clinical_test)) return 'clinical_test';
  if (matchesAnyPattern(text, ANCILLARY_LABEL_PATTERNS.management_context)) return 'management_context';
  return null;
}

function extractTreatmentResponseQualifier(text) {
  for (const pattern of TREATMENT_RESPONSE_QUALIFIER_PATTERNS) {
    const match = String(text || '').match(pattern);
    if (match?.[0]) return coerceString(match[0]);
  }
  return null;
}

function normalizeTreatmentResponseEntries(entries, ancillaryEvidence, contextNotes) {
  const kept = [];

  for (const entry of entries) {
    const text = coerceString(entry);
    if (!text) continue;

    if (matchesAnyPattern(text, EXPOSURE_OR_TRIGGER_CONTEXT_PATTERNS)) {
      ancillaryEvidence.other.push(text);
      continue;
    }

    const qualifier = extractTreatmentResponseQualifier(text);
    if (qualifier) {
      kept.push(qualifier);
      continue;
    }

    if (matchesAnyPattern(text, ANCILLARY_LABEL_PATTERNS.management_context)) {
      ancillaryEvidence.management_context.push(text);
      continue;
    }

    contextNotes.push(`Dropped non-qualifier treatment-response entry during finalization: ${text}`);
  }

  ancillaryEvidence.treatment_response = dedupeStrings(kept);
}

function normalizePhenotypeBucketsForFinal(phenotypes, ancillaryEvidence, contextNotes) {
  const finalPhenotypes = {
    present: [],
    excluded: [],
    uncertain: []
  };

  const movedRows = [];
  const omittedExcludedRows = [];

  for (const bucket of PHENOTYPE_BUCKETS) {
    for (const row of coerceArray(phenotypes?.[bucket])) {
      const label = coerceString(row?.label);
      if (!label) continue;

      if (bucket === 'excluded' && matchesAnyPattern(label, NON_PHENOTYPE_EXCLUDED_PATTERNS)) {
        omittedExcludedRows.push(label);
        continue;
      }

      const ancillaryBucket = inferAncillaryBucket(label);
      if (ancillaryBucket) {
        ancillaryEvidence[ancillaryBucket].push(label);
        movedRows.push({ label, from: bucket, to: ancillaryBucket });
        continue;
      }

      finalPhenotypes[bucket].push({ label });
    }
  }

  for (const bucket of PHENOTYPE_BUCKETS) {
    finalPhenotypes[bucket] = dedupePhenotypeLabelObjects(finalPhenotypes[bucket]);
  }

  if (movedRows.length > 0) {
    contextNotes.push(
      `Non-phenotype rows were rerouted from phenotype buckets to ancillary evidence during finalization (${movedRows.length} row${movedRows.length === 1 ? '' : 's'}).`
    );
  }

  if (omittedExcludedRows.length > 0) {
    contextNotes.push(
      `Non-phenotype contrast rows were omitted from phenotypes.excluded during finalization: ${omittedExcludedRows.join('; ')}.`
    );
  }

  return finalPhenotypes;
}

function dedupePhenotypeLabelObjects(rows) {
  const seen = new Set();
  const deduped = [];

  for (const row of rows || []) {
    const label = coerceString(row?.label);
    if (!label) continue;
    const key = normalizeText(label);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push({ label });
  }

  return deduped;
}

function removeCrossLayerDuplicates(finalPhenotypes, ancillaryEvidence) {
  const phenotypeKeys = new Set(
    PHENOTYPE_BUCKETS.flatMap((bucket) => finalPhenotypes[bucket].map((row) => normalizeText(row.label)))
  );

  for (const bucket of ANCILLARY_BUCKETS) {
    ancillaryEvidence[bucket] = dedupeStrings(ancillaryEvidence[bucket]).filter(
      (entry) => !phenotypeKeys.has(normalizeText(entry))
    );
  }
}

function sortAncillaryBuckets(ancillaryEvidence) {
  for (const bucket of ANCILLARY_BUCKETS) {
    ancillaryEvidence[bucket] = dedupeStrings(ancillaryEvidence[bucket]);
  }
}

function buildFrozenChapter(chapter) {
  return {
    nbk_id: chapter.nbk_id || '',
    title: chapter.title || '',
    mode: chapter.mode || 'discovery'
  };
}

function extractFirstJSONObject(text) {
  const source = String(text || '');
  const start = source.indexOf('{');
  if (start === -1) {
    throw new Error('No JSON object found in external extraction payload.');
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === '{') {
      depth += 1;
      continue;
    }

    if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  throw new Error('Unable to find a balanced JSON object in external extraction payload.');
}

export function parseExternalPhenotypeExtractionPayload(rawValue) {
  if (rawValue && typeof rawValue === 'object') return rawValue;

  const source = String(rawValue || '').trim();
  if (!source) {
    throw new Error('External extraction payload is empty.');
  }

  try {
    return JSON.parse(source);
  } catch (error) {
    const objectText = extractFirstJSONObject(source);
    return JSON.parse(objectText);
  }
}

export function normalizeExternalPhenotypeExtraction(payload) {
  const parsedPayload = parseExternalPhenotypeExtractionPayload(payload);
  const normalizedPhenotypes = Array.isArray(parsedPayload?.phenotypes)
    ? normalizeFlatPhenotypes(parsedPayload.phenotypes)
    : normalizeGroupedPhenotypes(parsedPayload?.phenotypes || {});

  return {
    chapter: normalizeChapter(parsedPayload?.chapter, parsedPayload || {}),
    phenotypes: normalizedPhenotypes,
    ancillary_clinical_evidence: normalizeAncillaryEvidence(parsedPayload),
    context_metadata: normalizeContextMetadata(parsedPayload),
    context_notes: dedupeStrings(coerceArray(parsedPayload?.context_notes).map(normalizeNoteEntry).filter(Boolean)),
    negative_or_contrastive_findings: coerceArray(parsedPayload?.negative_or_contrastive_findings)
      .map(normalizeNegativeEntry)
      .filter(Boolean)
  };
}

export function freezeExternalPhenotypeExtraction(payload) {
  const normalized = normalizeExternalPhenotypeExtraction(payload);
  const ancillaryEvidence = {
    ...emptyAncillaryBuckets(),
    ...normalized.ancillary_clinical_evidence
  };
  const contextNotes = [...normalized.context_notes];

  const phenotypes = normalizePhenotypeBucketsForFinal(normalized.phenotypes, ancillaryEvidence, contextNotes);
  normalizeTreatmentResponseEntries(ancillaryEvidence.treatment_response, ancillaryEvidence, contextNotes);
  removeCrossLayerDuplicates(phenotypes, ancillaryEvidence);
  sortAncillaryBuckets(ancillaryEvidence);

  return {
    chapter: buildFrozenChapter(normalized.chapter),
    phenotypes,
    ancillary_clinical_evidence: ancillaryEvidence,
    context_metadata: normalized.context_metadata,
    context_notes: dedupeStrings(contextNotes)
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

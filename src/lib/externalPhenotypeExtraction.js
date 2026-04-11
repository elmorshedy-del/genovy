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

const PHENOTYPE_LABEL_NORMALIZATION_MAP = Object.freeze(
  new Map([
    ['global delay', 'developmental delay'],
    ['metopic synostosis', 'metopic craniosynostosis']
  ])
);

const RECOMMENDATION_STYLE_CLINICAL_TEST_PATTERNS = Object.freeze([
  /\bif clinical signs?\b/i,
  /\bif clinical symptoms?\b/i,
  /\bfor those with\b/i,
  /\bmay be helpful\b/i,
  /\breferral\b/i,
  /\bstudy if\b/i
]);

const STRUCTURAL_IMAGING_TO_PHENOTYPE_PATTERNS = Object.freeze([
  {
    pattern: /\bagenesis of the corpus callosum\b/i,
    label: 'agenesis of the corpus callosum'
  },
  {
    pattern: /\bcorpus callosum dysgenesis\b/i,
    label: 'corpus callosum dysgenesis'
  },
  {
    pattern: /\babnormalities of the corpus callosum\b/i,
    label: 'corpus callosum abnormalities'
  }
]);

function phenotypeStatusForBucket(bucket) {
  if (bucket === 'excluded') return 'excluded';
  if (bucket === 'uncertain') return 'uncertain';
  return 'present';
}

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
      mode,
      source: coerceString(chapterValue.source || payload.source),
      source_url: coerceString(chapterValue.source_url || chapterValue.sourceUrl || payload.source_url || payload.sourceUrl),
      last_updated: coerceString(
        chapterValue.last_updated || chapterValue.lastUpdated || payload.last_updated || payload.lastUpdated
      )
    };
  }

  if (typeof chapterValue === 'string') {
    const title = coerceString(chapterValue);
    return {
      chapter_key: coerceString(deriveChapterKey(title)),
      nbk_id: coerceString(extractNbkId(title || '')),
      title,
      mode: coerceString(payload.mode || 'discovery'),
      source: coerceString(payload.source),
      source_url: coerceString(payload.source_url || payload.sourceUrl),
      last_updated: coerceString(payload.last_updated || payload.lastUpdated)
    };
  }

  const fallbackTitle = coerceString(payload.title || payload.chapter_title);
  return {
    chapter_key: coerceString(payload.chapter_key || payload.chapterKey || deriveChapterKey(fallbackTitle)),
    nbk_id: coerceString(payload.nbk_id || payload.nbkId || extractNbkId(fallbackTitle || '')),
    title: fallbackTitle,
    mode: coerceString(payload.mode || 'discovery'),
    source: coerceString(payload.source),
    source_url: coerceString(payload.source_url || payload.sourceUrl),
    last_updated: coerceString(payload.last_updated || payload.lastUpdated)
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
      source_quote: null,
      extraction_bucket: bucket,
      status: phenotypeStatusForBucket(bucket),
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
    source_quote: coerceString(
      entry.source_quote ||
        entry.sourceQuote ||
        entry.evidence_text ||
        entry.evidenceText ||
        entry.supporting_quote ||
        entry.supportingQuote
    ),
    source_section: coerceString(
      entry.source_section ||
        entry.sourceSection ||
        entry.source_location?.section_heading ||
        entry.source_location?.sectionHeading ||
        entry.section_heading ||
        entry.sectionHeading ||
        entry.section
    ),
    evidence_scope: coerceString(entry.evidence_scope || entry.evidenceScope),
    source_location:
      entry.source_location && typeof entry.source_location === 'object' && !Array.isArray(entry.source_location)
        ? {
            section_id: coerceString(entry.source_location.section_id || entry.source_location.sectionId),
            section_heading: coerceString(
              entry.source_location.section_heading || entry.source_location.sectionHeading
            ),
            paragraph_id: coerceString(entry.source_location.paragraph_id || entry.source_location.paragraphId),
            paragraph_index:
              Number.isFinite(Number(entry.source_location.paragraph_index || entry.source_location.paragraphIndex))
                ? Number(entry.source_location.paragraph_index || entry.source_location.paragraphIndex)
                : null,
            sentence_id: coerceString(entry.source_location.sentence_id || entry.source_location.sentenceId)
          }
        : null,
    detail_types: Array.isArray(entry.detail_types || entry.detailTypes)
      ? [...new Set((entry.detail_types || entry.detailTypes).map((value) => String(value || '').trim()).filter(Boolean))]
      : [],
    ancillary_evidence_types: Array.isArray(entry.ancillary_evidence_types || entry.ancillaryEvidenceTypes)
      ? [
          ...new Set(
            (entry.ancillary_evidence_types || entry.ancillaryEvidenceTypes)
              .map((value) => String(value || '').trim())
              .filter(Boolean)
          )
        ]
      : [],
    reason: coerceString(entry.reason),
    trajectory:
      entry.trajectory && typeof entry.trajectory === 'object' && !Array.isArray(entry.trajectory)
        ? {
            direction: coerceString(entry.trajectory.direction),
            timing: coerceString(entry.trajectory.timing),
            note: coerceString(entry.trajectory.note)
          }
        : null,
    extraction_bucket: bucket,
    status: phenotypeStatusForBucket(bucket),
    input_index: inputIndex
  };
}

function mergeRowsByKey(rows) {
  const ordered = [];
  const rowByKey = new Map();

  for (const row of rows) {
    const key = [
      normalizeText(row.label),
      row.extraction_bucket,
      normalizeText(row.details),
      normalizeText(row.source_quote)
    ].join('::');
    const existing = rowByKey.get(key);
    if (!existing) {
      const next = { ...row };
      rowByKey.set(key, next);
      ordered.push(next);
      continue;
    }
    if (!existing.category && row.category) existing.category = row.category;
    if (!existing.details && row.details) existing.details = row.details;
    if (!existing.source_quote && row.source_quote) existing.source_quote = row.source_quote;
    if (!existing.source_section && row.source_section) existing.source_section = row.source_section;
    if (!existing.evidence_scope && row.evidence_scope) existing.evidence_scope = row.evidence_scope;
    if (!existing.source_location && row.source_location) existing.source_location = row.source_location;
    if ((!existing.detail_types || existing.detail_types.length === 0) && row.detail_types?.length) {
      existing.detail_types = [...row.detail_types];
    }
    if (
      (!existing.ancillary_evidence_types || existing.ancillary_evidence_types.length === 0) &&
      row.ancillary_evidence_types?.length
    ) {
      existing.ancillary_evidence_types = [...row.ancillary_evidence_types];
    }
    if (!existing.reason && row.reason) existing.reason = row.reason;
    if (!existing.trajectory && row.trajectory) existing.trajectory = row.trajectory;
  }

  return ordered;
}

function normalizeGroundingHintEntry(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  const label = coerceString(entry.label || entry.term || entry.finding || entry.name);
  const sourceQuote = coerceString(
    entry.source_quote ||
      entry.sourceQuote ||
      entry.evidence_text ||
      entry.evidenceText ||
      entry.supporting_quote ||
      entry.supportingQuote
  );
  if (!label || !sourceQuote) return null;

  const extractionBucket =
    coerceString(entry.extraction_bucket || entry.bucket) ||
    (String(entry.status || '').trim().toLowerCase() === 'excluded'
      ? 'excluded'
      : String(entry.status || '').trim().toLowerCase() === 'uncertain'
        ? 'uncertain'
        : 'present');

  return {
    label,
    source_quote: sourceQuote,
    extraction_bucket: extractionBucket,
    status: phenotypeStatusForBucket(extractionBucket)
  };
}

function buildGroundingHintKey(entry) {
  return `${normalizeText(entry?.label)}::${String(
    entry?.status || phenotypeStatusForBucket(entry?.extraction_bucket)
  ).toLowerCase()}::${normalizeText(entry?.source_quote)}`;
}

function dedupeGroundingHintObjects(entries) {
  return dedupeByKey(entries, buildGroundingHintKey);
}

function normalizeGroundingHints(payload, normalizedPhenotypes) {
  const hintEntries = [];
  const payloadHints = payload?.grounding_hints?.phenotypes;

  for (const bucket of PHENOTYPE_BUCKETS) {
    for (const row of coerceArray(normalizedPhenotypes?.[bucket])) {
      if (!row?.source_quote) continue;
      hintEntries.push({
        label: row.label,
        source_quote: row.source_quote,
        extraction_bucket: row.extraction_bucket || bucket,
        status: row.status || phenotypeStatusForBucket(row.extraction_bucket || bucket)
      });
    }
  }

  for (const entry of coerceArray(payloadHints)) {
    const normalizedEntry = normalizeGroundingHintEntry(entry);
    if (normalizedEntry) hintEntries.push(normalizedEntry);
  }

  return {
    phenotypes: dedupeGroundingHintObjects(hintEntries)
  };
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

function dedupeByKey(values, keyFn) {
  const seen = new Set();
  const deduped = [];

  for (const value of values || []) {
    const key = keyFn(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(value);
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

function shouldKeepPhenotypeLabelInPhenotypeLayer(text, ancillaryBucket) {
  const source = coerceString(text);
  if (!source || !ancillaryBucket) return false;

  if (ancillaryBucket === 'laboratory' && /\bdeficiency\b/i.test(source)) {
    return true;
  }

  if (ancillaryBucket === 'pathology' && /\bdysplasia\b/i.test(source)) {
    return true;
  }

  return false;
}

function extractTreatmentResponseQualifier(text) {
  for (const pattern of TREATMENT_RESPONSE_QUALIFIER_PATTERNS) {
    const match = String(text || '').match(pattern);
    if (match?.[0]) return coerceString(match[0]);
  }
  return null;
}

function normalizePhenotypeLabel(label) {
  const text = coerceString(label);
  if (!text) return null;
  return PHENOTYPE_LABEL_NORMALIZATION_MAP.get(normalizeText(text)) || text;
}

function splitPhenotypeLabel(label) {
  const text = coerceString(label);
  if (!text) return [];

  const craniosynostosisMatch = text.match(
    /^craniosynostosis involving the ([a-z-]+) or ([a-z-]+) sutures?$/i
  );
  if (craniosynostosisMatch) {
    return [craniosynostosisMatch[1], craniosynostosisMatch[2]].map(
      (segment) => `${String(segment).toLowerCase()} craniosynostosis`
    );
  }

  const singleCraniosynostosisMatch = text.match(/^craniosynostosis involving the ([a-z-]+) sutures?$/i);
  if (singleCraniosynostosisMatch) {
    return [`${String(singleCraniosynostosisMatch[1]).toLowerCase()} craniosynostosis`];
  }

  return [text];
}

function extractStructuralPhenotypeFromImagingEntry(text) {
  const source = coerceString(text);
  if (!source) return null;

  for (const matcher of STRUCTURAL_IMAGING_TO_PHENOTYPE_PATTERNS) {
    if (matcher.pattern.test(source)) {
      return matcher.label;
    }
  }

  return null;
}

function isRecommendationStyleClinicalTest(text) {
  const source = coerceString(text);
  return Boolean(source && matchesAnyPattern(source, RECOMMENDATION_STYLE_CLINICAL_TEST_PATTERNS));
}

function normalizeAncillaryBucketsForFinal(ancillaryEvidence, finalPhenotypes, contextNotes, groundingHints) {
  const reroutedPhenotypeLabels = [];
  const movedClinicalTestRecommendations = [];

  ancillaryEvidence.imaging = dedupeStrings(ancillaryEvidence.imaging).filter((entry) => {
    const phenotypeLabel = extractStructuralPhenotypeFromImagingEntry(entry);
    if (!phenotypeLabel) return true;
    finalPhenotypes.present.push({ label: phenotypeLabel });
    if (coerceString(entry)) {
      groundingHints.push({
        label: phenotypeLabel,
        source_quote: entry,
        extraction_bucket: 'present',
        status: 'present'
      });
    }
    reroutedPhenotypeLabels.push(phenotypeLabel);
    return false;
  });

  ancillaryEvidence.clinical_test = dedupeStrings(ancillaryEvidence.clinical_test).filter((entry) => {
    if (!isRecommendationStyleClinicalTest(entry)) return true;
    ancillaryEvidence.management_context.push(entry);
    movedClinicalTestRecommendations.push(entry);
    return false;
  });

  for (const bucket of ANCILLARY_BUCKETS) {
    ancillaryEvidence[bucket] = dedupeStrings(ancillaryEvidence[bucket]);
  }

  finalPhenotypes.present = dedupePhenotypeLabelObjects(finalPhenotypes.present);
  removeOverlappingPhenotypeEntries(finalPhenotypes);

  if (reroutedPhenotypeLabels.length > 0) {
    contextNotes.push(
      `Structural imaging findings were promoted to phenotype rows during finalization: ${dedupeStrings(reroutedPhenotypeLabels).join('; ')}.`
    );
  }

  if (movedClinicalTestRecommendations.length > 0) {
    contextNotes.push(
      `Recommendation-style clinical test entries were rerouted to management_context during finalization (${movedClinicalTestRecommendations.length} row${movedClinicalTestRecommendations.length === 1 ? '' : 's'}).`
    );
  }
}

function removeOverlappingAncillaryEntries(ancillaryEvidence) {
  ancillaryEvidence.imaging = dedupeByKey(ancillaryEvidence.imaging, (entry) => {
    const text = normalizeText(entry);
    if (!text) return null;
    if (text.includes('corpus callosum')) return 'corpus_callosum_structural';
    return text;
  });
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
  const groundingHints = [];

  const movedRows = [];
  const omittedExcludedRows = [];

  for (const bucket of PHENOTYPE_BUCKETS) {
    for (const row of coerceArray(phenotypes?.[bucket])) {
      const rawLabel = coerceString(row?.label);
      if (!rawLabel) continue;

      const splitLabels = splitPhenotypeLabel(rawLabel)
        .map(normalizePhenotypeLabel)
        .filter(Boolean);

      for (const label of splitLabels) {
        if (bucket === 'excluded' && matchesAnyPattern(label, NON_PHENOTYPE_EXCLUDED_PATTERNS)) {
          omittedExcludedRows.push(label);
          continue;
        }

        const ancillaryBucket = inferAncillaryBucket(label);
        if (ancillaryBucket && !shouldKeepPhenotypeLabelInPhenotypeLayer(label, ancillaryBucket)) {
          ancillaryEvidence[ancillaryBucket].push(label);
          movedRows.push({ label, from: bucket, to: ancillaryBucket });
          continue;
        }

        finalPhenotypes[bucket].push({
          ...row,
          label
        });
        if (row?.source_quote) {
          groundingHints.push({
            label,
            source_quote: row.source_quote,
            extraction_bucket: bucket,
            status: phenotypeStatusForBucket(bucket)
          });
        }
      }
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

  return {
    phenotypes: finalPhenotypes,
    grounding_hints: dedupeGroundingHintObjects(groundingHints)
  };
}

function dedupePhenotypeLabelObjects(rows) {
  const seen = new Set();
  const deduped = [];

  for (const row of rows || []) {
    const label = coerceString(row?.label);
    if (!label) continue;
    const key = [normalizeText(label), normalizeText(row?.details), normalizeText(row?.source_quote)].join('::');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push({
      ...row,
      label
    });
  }

  return deduped;
}

function removeOverlappingPhenotypeEntries(finalPhenotypes) {
  const presentKeys = new Set(finalPhenotypes.present.map((row) => normalizeText(row.label)));
  const hasSpecificCorpusCallosumFinding =
    presentKeys.has(normalizeText('corpus callosum dysgenesis')) ||
    presentKeys.has(normalizeText('agenesis of the corpus callosum'));

  if (hasSpecificCorpusCallosumFinding) {
    finalPhenotypes.present = finalPhenotypes.present.filter(
      (row) => normalizeText(row.label) !== normalizeText('corpus callosum abnormalities')
    );
  }
}

function removeCrossLayerDuplicates(finalPhenotypes, ancillaryEvidence) {
  const phenotypeKeys = new Set(
    PHENOTYPE_BUCKETS.flatMap((bucket) => finalPhenotypes[bucket].map((row) => normalizeText(row.label)))
  );
  const hasSpecificCorpusCallosumPhenotype =
    phenotypeKeys.has(normalizeText('corpus callosum dysgenesis')) ||
    phenotypeKeys.has(normalizeText('agenesis of the corpus callosum'));

  for (const bucket of ANCILLARY_BUCKETS) {
    ancillaryEvidence[bucket] = dedupeStrings(ancillaryEvidence[bucket]).filter(
      (entry) => {
        const normalizedEntry = normalizeText(entry);
        if (phenotypeKeys.has(normalizedEntry)) return false;
        if (bucket === 'imaging' && hasSpecificCorpusCallosumPhenotype && normalizedEntry.includes('corpus callosum')) {
          return false;
        }
        return true;
      }
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
    mode: chapter.mode || 'discovery',
    source: chapter.source || '',
    source_url: chapter.source_url || '',
    last_updated: chapter.last_updated || ''
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
    grounding_hints: normalizeGroundingHints(parsedPayload, normalizedPhenotypes),
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

  const phenotypeFinalization = normalizePhenotypeBucketsForFinal(
    normalized.phenotypes,
    ancillaryEvidence,
    contextNotes
  );
  const phenotypes = phenotypeFinalization.phenotypes;
  const groundingHints = [...phenotypeFinalization.grounding_hints];
  normalizeAncillaryBucketsForFinal(ancillaryEvidence, phenotypes, contextNotes, groundingHints);
  normalizeTreatmentResponseEntries(ancillaryEvidence.treatment_response, ancillaryEvidence, contextNotes);
  removeCrossLayerDuplicates(phenotypes, ancillaryEvidence);
  removeOverlappingAncillaryEntries(ancillaryEvidence);
  sortAncillaryBuckets(ancillaryEvidence);

  const frozen = {
    chapter: buildFrozenChapter(normalized.chapter),
    phenotypes,
    ancillary_clinical_evidence: ancillaryEvidence,
    context_metadata: normalized.context_metadata,
    context_notes: dedupeStrings(contextNotes)
  };

  const dedupedGroundingHints = dedupeGroundingHintObjects(groundingHints);
  if (dedupedGroundingHints.length > 0) {
    frozen.grounding_hints = {
      phenotypes: dedupedGroundingHints
    };
  }

  return frozen;
}

export function toFinalizeCandidateRows(normalizedPayload, options = {}) {
  const includeUncertain = Boolean(options.includeUncertain);
  const rows = [
    ...coerceArray(normalizedPayload?.phenotypes?.present),
    ...coerceArray(normalizedPayload?.phenotypes?.excluded),
    ...(includeUncertain ? coerceArray(normalizedPayload?.phenotypes?.uncertain) : [])
  ];
  const hintQueues = new Map();

  for (const hint of coerceArray(normalizedPayload?.grounding_hints?.phenotypes)) {
    const key = `${normalizeText(hint?.label)}::${String(
      hint?.status || phenotypeStatusForBucket(hint?.extraction_bucket)
    ).toLowerCase()}`;
    const queue = hintQueues.get(key) || [];
    queue.push(hint);
    hintQueues.set(key, queue);
  }

  return rows.map((row) => {
    const status = coerceString(row.status) || phenotypeStatusForBucket(row.extraction_bucket);
    const key = `${normalizeText(row.label)}::${String(status).toLowerCase()}`;
    const hintQueue = hintQueues.get(key) || [];
    const hint = hintQueue.length > 0 ? hintQueue.shift() : null;

    return {
      label: row.label,
      status,
      category: row.category,
      details: row.details,
      source_quote: row.source_quote || hint?.source_quote || null,
      source_section: row.source_section || row.source_location?.section_heading || null,
      evidence_scope: row.evidence_scope || null,
      source_location: row.source_location || null,
      detail_types: Array.isArray(row.detail_types) ? [...row.detail_types] : [],
      ancillary_evidence_types: Array.isArray(row.ancillary_evidence_types)
        ? [...row.ancillary_evidence_types]
        : [],
      reason: row.reason || null,
      trajectory: row.trajectory || null,
      extraction_bucket: row.extraction_bucket
    };
  });
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
      source_quote: sourceRow.source_quote || null,
      source_section: sourceRow.source_section || sourceRow.source_location?.section_heading || null,
      evidence_scope: sourceRow.evidence_scope || null,
      source_location: sourceRow.source_location || null,
      detail_types: Array.isArray(sourceRow.detail_types) ? [...sourceRow.detail_types] : [],
      ancillary_evidence_types: Array.isArray(sourceRow.ancillary_evidence_types)
        ? [...sourceRow.ancillary_evidence_types]
        : [],
      reason: sourceRow.reason || null,
      trajectory: sourceRow.trajectory || null,
      extraction_bucket: sourceRow.extraction_bucket || null
    };
  });
}

function buildGroundingCoverageKey(row) {
  return `${normalizeText(row?.label)}::${String(row?.status || phenotypeStatusForBucket(row?.extraction_bucket)).toLowerCase()}`;
}

export function reconcileGroundingCoverage(inputRows, groundedRows, rejectedRows) {
  const groundedQueues = new Map();
  const rejectedQueues = new Map();

  for (const row of groundedRows || []) {
    const key = buildGroundingCoverageKey(row);
    const queue = groundedQueues.get(key) || [];
    queue.push(row);
    groundedQueues.set(key, queue);
  }

  for (const row of rejectedRows || []) {
    const key = buildGroundingCoverageKey(row);
    const queue = rejectedQueues.get(key) || [];
    queue.push(row);
    rejectedQueues.set(key, queue);
  }

  const finalRejectedRows = [...(rejectedRows || [])];

  for (const inputRow of inputRows || []) {
    const key = buildGroundingCoverageKey(inputRow);
    const groundedQueue = groundedQueues.get(key) || [];
    if (groundedQueue.length > 0) {
      groundedQueue.shift();
      continue;
    }

    const rejectedQueue = rejectedQueues.get(key) || [];
    if (rejectedQueue.length > 0) {
      rejectedQueue.shift();
      continue;
    }

    finalRejectedRows.push({
      label: inputRow.label,
      status: inputRow.status || phenotypeStatusForBucket(inputRow.extraction_bucket),
      extraction_bucket: inputRow.extraction_bucket || null,
      category: inputRow.category || null,
      details: inputRow.details || null,
      source_quote: inputRow.source_quote || null,
      source_section: inputRow.source_section || inputRow.source_location?.section_heading || null,
      evidence_scope: inputRow.evidence_scope || null,
      source_location: inputRow.source_location || null,
      detail_types: Array.isArray(inputRow.detail_types) ? [...inputRow.detail_types] : [],
      ancillary_evidence_types: Array.isArray(inputRow.ancillary_evidence_types)
        ? [...inputRow.ancillary_evidence_types]
        : [],
      trajectory: inputRow.trajectory || null,
      reason: 'no_supporting_sentence_found'
    });
  }

  return {
    candidates: groundedRows || [],
    rejectedCandidates: finalRejectedRows
  };
}

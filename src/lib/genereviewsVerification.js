import { extractScopedFrequency, extractScopedOnset, normalizeText } from './genereviewsPipeline.js';

const HARD_BOUNDARY_REGEX = /[;:.!?]/;
const SOFT_BOUNDARY_REGEX = /\b(?:but|however|although|whereas|while)\b/i;
const DISEASE_TERM_REGEX = /\b(?:syndrome|disease|disorder|deficiency|condition|cid|adrenoleukodystrophy)\b/i;
const MAX_ALIAS_SHADOW_PREFIX_WORDS = 3;
const SHADOW_STOPWORDS = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'from', 'have', 'has', 'had', 'in', 'into', 'of', 'on', 'or', 'the', 'to', 'with']);
const NON_SHADOW_MODIFIERS = new Set([
  'acute',
  'adult',
  'boy',
  'child',
  'adult',
  'chronic',
  'childhood',
  'congenital',
  'drug-resistant',
  'drug-refractory',
  'girl',
  'individual',
  'infantile',
  'infant',
  'isolated',
  'man',
  'mild',
  'moderate',
  'neonatal',
  'patient',
  'person',
  'persistent',
  'progressive',
  'recurrent',
  'refractory',
  'resistant',
  'severe',
  'sib',
  'silent',
  'treatment-refractory',
  'treatment-resistant',
  'woman'
]);
const TABLE_FREQUENCY_HEADER_REGEX = /\b(?:frequency|prevalence|percentage|percent|proportion|occurrence)\b/i;
const TABLE_PHENOTYPE_HEADER_REGEX = /\b(?:feature|finding|manifestation|phenotype|symptom|clinical)\b/i;
const SECTION_BRANCH_RULES = Object.freeze([
  { pattern: /\b(?:ophthalm|ocular|vision|eye)\b/i, rootCurie: 'HP:0000478', label: 'Abnormality of the eye' },
  { pattern: /\b(?:neuro|brain|behavior|behaviour|psychiatric|movement|seizure)\b/i, rootCurie: 'HP:0000707', label: 'Abnormality of the nervous system' },
  { pattern: /\b(?:skeletal|bone|musculoskeletal|radiographic)\b/i, rootCurie: 'HP:0000924', label: 'Abnormality of the skeletal system' },
  { pattern: /\b(?:cardiac|cardio|heart)\b/i, rootCurie: 'HP:0001626', label: 'Abnormality of the cardiovascular system' },
  { pattern: /\b(?:craniofacial|facial|head|neck)\b/i, rootCurie: 'HP:0000152', label: 'Abnormality of the head or neck' },
  { pattern: /\b(?:genitourinary|kidney|renal|testicular|urologic)\b/i, rootCurie: 'HP:0000119', label: 'Abnormality of the genitourinary system' }
]);

function buildCheck(name, status, detail, extra = {}) {
  return {
    name,
    status,
    detail,
    ...extra
  };
}

function uniqueNormalizedPhrases(values) {
  const seen = new Set();
  const ordered = [];
  for (const value of values) {
    const raw = String(value || '').trim();
    const normalized = normalizeText(raw);
    if (!raw || !normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    ordered.push(raw);
  }
  return ordered;
}

function extractSpanText(chapterText, start, end) {
  const source = String(chapterText || '');
  const startIndex = Number(start);
  const endIndex = Number(end);
  if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex)) return '';
  if (startIndex < 0 || endIndex <= startIndex || endIndex > source.length) return '';
  return source.slice(startIndex, endIndex);
}

function resolveSentenceEvidence(feature, chapterText) {
  const spanText = extractSpanText(chapterText, feature.sentence_char_start, feature.sentence_char_end).trim();
  if (spanText) {
    return {
      text: spanText,
      source: 'span'
    };
  }
  return {
    text: String(feature.source_sentence || '').trim(),
    source: 'stored'
  };
}

function resolveMatchEvidence(feature, chapterText) {
  return extractSpanText(chapterText, feature.match_char_start, feature.match_char_end).trim();
}

function normalizeComparableFrequency(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const normalized = normalizeText(raw);
  const percent = raw.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percent) return `${percent[1]}%`;
  const fraction = raw.match(/(\d+)\s*\/\s*(\d+)/);
  if (fraction) return `${fraction[1]}/${fraction[2]}`;
  return normalized;
}

function normalizeComparableFreeText(value) {
  return normalizeText(String(value || '').trim());
}

function sentenceContainsAnyPhrase(sentence, phrases) {
  const normalizedSentence = normalizeText(sentence);
  for (const phrase of phrases) {
    const normalizedPhrase = normalizeText(phrase);
    if (normalizedPhrase && normalizedSentence.includes(normalizedPhrase)) {
      return phrase;
    }
  }
  return '';
}

function findRawPhraseIndex(text, phrase) {
  const rawText = String(text || '');
  const rawPhrase = String(phrase || '').trim();
  if (!rawText || !rawPhrase) return -1;
  return rawText.toLowerCase().indexOf(rawPhrase.toLowerCase());
}

function hasBoundaryBetween(text, startIndex, endIndex) {
  if (startIndex < 0 || endIndex < 0) return false;
  const [left, right] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
  const between = text.slice(left, right);
  return HARD_BOUNDARY_REGEX.test(between) || SOFT_BOUNDARY_REGEX.test(between);
}

function findAliasShadow(sentence, phrases) {
  const rawSentence = String(sentence || '');
  for (const phrase of phrases) {
    const rawPhrase = String(phrase || '').trim();
    if (!rawPhrase) continue;
    const escapedPhrase = rawPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b((?:[A-Za-z-]+\\s+){1,${MAX_ALIAS_SHADOW_PREFIX_WORDS}})${escapedPhrase}\\b`, 'i');
    const match = rawSentence.match(pattern);
    if (!match) continue;
    const prefixWords = String(match[1] || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!prefixWords.length) continue;
    const nearestPrefixWord = prefixWords[prefixWords.length - 1]?.toLowerCase() || '';
    if (SHADOW_STOPWORDS.has(nearestPrefixWord)) continue;
    if (prefixWords.every((word) => SHADOW_STOPWORDS.has(word.toLowerCase()))) continue;
    const contentPrefixWords = prefixWords.filter((word) => !SHADOW_STOPWORDS.has(word.toLowerCase()));
    if (contentPrefixWords.length && contentPrefixWords.every((word) => NON_SHADOW_MODIFIERS.has(word.toLowerCase()))) {
      continue;
    }
    const extended = `${prefixWords.join(' ')} ${rawPhrase}`.trim();
    if (normalizeText(extended) !== normalizeText(rawPhrase)) {
      return extended;
    }
  }
  return '';
}

function hasDiseaseSubtypeLeak(sentence, onsetRaw, matchedPhrase) {
  const rawSentence = String(sentence || '');
  const rawOnset = String(onsetRaw || '').trim();
  if (!rawSentence || !rawOnset) return false;
  const onsetIndex = findRawPhraseIndex(rawSentence, rawOnset);
  if (onsetIndex === -1) return false;
  const matchIndex = findRawPhraseIndex(rawSentence, matchedPhrase);
  const tail = rawSentence.slice(onsetIndex, Math.min(rawSentence.length, onsetIndex + 80));
  if (!DISEASE_TERM_REGEX.test(tail)) return false;
  if (matchIndex !== -1 && Math.abs(matchIndex - onsetIndex) <= 32) return false;
  return true;
}

function buildPhraseCandidates(feature) {
  return uniqueNormalizedPhrases([
    feature.match_text,
    feature.hpo_label
  ]);
}

function buildTableEntries(tables) {
  const entries = [];
  for (const table of tables || []) {
    const rows = Array.isArray(table?.rows) ? table.rows : [];
    if (!rows.length) continue;
    const headerRow = rows[0].map((cell) => String(cell || '').trim());
    const hasHeaderSignals = headerRow.some((cell) => TABLE_FREQUENCY_HEADER_REGEX.test(cell) || TABLE_PHENOTYPE_HEADER_REGEX.test(cell));
    const phenotypeCol = hasHeaderSignals
      ? Math.max(0, headerRow.findIndex((cell) => TABLE_PHENOTYPE_HEADER_REGEX.test(cell)))
      : 0;
    const frequencyCol = hasHeaderSignals
      ? headerRow.findIndex((cell) => TABLE_FREQUENCY_HEADER_REGEX.test(cell))
      : -1;
    const dataRows = hasHeaderSignals ? rows.slice(1) : rows;

    for (const row of dataRows) {
      if (!Array.isArray(row) || !row.length) continue;
      const phenotypeText = String(row[phenotypeCol] || row[0] || '').trim();
      if (!phenotypeText) continue;
      const frequencyText = frequencyCol >= 0 ? String(row[frequencyCol] || '').trim() : '';
      entries.push({
        table_caption: String(table.caption || '').trim(),
        phenotype_text: phenotypeText,
        frequency_text: frequencyText || null
      });
    }
  }
  return entries;
}

function inferSectionBranchRule(sectionHeading) {
  const heading = String(sectionHeading || '').trim();
  if (!heading) return null;
  return SECTION_BRANCH_RULES.find((rule) => rule.pattern.test(heading)) || null;
}

function findMatchingTableEntry(feature, tableEntries) {
  const phrases = buildPhraseCandidates(feature).map((phrase) => normalizeText(phrase));
  return tableEntries.find((entry) => {
    const phenotype = normalizeText(entry.phenotype_text);
    if (!phenotype) return false;
    return phrases.some((phrase) => phrase && (phenotype.includes(phrase) || phrase.includes(phenotype)));
  }) || null;
}

function verifySourceSpan(feature, chapterText) {
  if (feature.sentence_char_start == null || feature.sentence_char_end == null) {
    return buildCheck('source_span', 'skip', 'No sentence span recorded.');
  }
  const spanText = extractSpanText(chapterText, feature.sentence_char_start, feature.sentence_char_end).trim();
  if (!spanText) {
    return buildCheck('source_span', 'fail', 'Sentence span does not resolve inside cached chapter text.');
  }
  if (feature.source_sentence && normalizeText(spanText) !== normalizeText(feature.source_sentence)) {
    return buildCheck('source_span', 'flag', 'Sentence span resolves, but differs from stored source_sentence.', {
      span_text: spanText
    });
  }
  return buildCheck('source_span', 'pass', 'Sentence span resolves inside cached chapter text.', {
    span_text: spanText
  });
}

function verifyPhenotypePresence(feature, chapterText) {
  const phrases = buildPhraseCandidates(feature);
  const sentenceEvidence = resolveSentenceEvidence(feature, chapterText);
  const sentence = sentenceEvidence.text;
  const chapterHit = sentence && normalizeText(chapterText).includes(normalizeText(sentence));
  const matchedPhrase = sentenceContainsAnyPhrase(sentence, phrases);
  const matchEvidence = resolveMatchEvidence(feature, chapterText);

  if (!sentence) {
    return buildCheck('phenotype_presence', 'fail', 'Missing source sentence.');
  }
  if (!chapterHit) {
    return buildCheck('phenotype_presence', 'fail', 'Source sentence not found in cached chapter text.');
  }
  if (matchEvidence) {
    const matchedSpanPhrase = sentenceContainsAnyPhrase(matchEvidence, phrases);
    if (!matchedSpanPhrase) {
      return buildCheck('phenotype_presence', 'fail', 'Match span does not contain the phenotype label or stored match_text.', {
        phrases,
        match_span_text: matchEvidence
      });
    }
    return buildCheck('phenotype_presence', 'pass', `Matched "${matchedSpanPhrase}" at recorded span.`, {
      matched_phrase: matchedSpanPhrase,
      evidence_source: sentenceEvidence.source,
      match_span_text: matchEvidence
    });
  }
  if (!matchedPhrase) {
    return buildCheck('phenotype_presence', 'fail', 'No lexical match for phenotype label or match_text in source sentence.', {
      phrases
    });
  }
  return buildCheck('phenotype_presence', 'pass', `Matched "${matchedPhrase}" in source sentence.`, {
    matched_phrase: matchedPhrase,
    evidence_source: sentenceEvidence.source
  });
}

function verifyFrequency(feature, chapterText) {
  if (!feature.frequency_value && !feature.frequency_raw) {
    return buildCheck('frequency_support', 'skip', 'No frequency claimed.');
  }
  const spanText = extractSpanText(chapterText, feature.frequency_char_start, feature.frequency_char_end).trim();
  const claimed = normalizeComparableFrequency(feature.frequency_value || feature.frequency_raw);
  if (spanText) {
    const spanComparable = normalizeComparableFrequency(spanText);
    if (spanComparable === claimed) {
      return buildCheck('frequency_support', 'pass', `Frequency verified at recorded span as "${claimed}".`, {
        span_text: spanText
      });
    }
    return buildCheck('frequency_support', 'fail', `Frequency span text "${spanText}" does not match claimed frequency "${feature.frequency_value || feature.frequency_raw}".`);
  }
  const candidates = [
    extractScopedFrequency(feature.local_context || '', feature.match_text || feature.hpo_label),
    extractScopedFrequency(feature.source_sentence || '', feature.match_text || feature.hpo_label)
  ];
  const matched = candidates.find((candidate) => normalizeComparableFrequency(candidate.frequency_value || candidate.frequency_raw) === claimed);
  if (matched) {
    return buildCheck('frequency_support', 'pass', `Frequency verified as "${claimed}".`);
  }
  return buildCheck(
    'frequency_support',
    'fail',
    `Claimed frequency "${feature.frequency_value || feature.frequency_raw}" not deterministically reproduced from source sentence/local context.`
  );
}

function verifyOnset(feature, chapterText) {
  if (!feature.onset_hpo_id && !feature.onset_raw) {
    return buildCheck('onset_support', 'skip', 'No onset claimed.');
  }
  const sentence = resolveSentenceEvidence(feature, chapterText).text || String(feature.source_sentence || '');
  const matchedPhrase = sentenceContainsAnyPhrase(sentence, buildPhraseCandidates(feature)) || feature.match_text || feature.hpo_label;
  const parsed = extractScopedOnset(sentence || feature.local_context || '', matchedPhrase);
  const claimedRaw = String(feature.onset_raw || '').trim();
  const claimedId = String(feature.onset_hpo_id || '').trim();
  const onsetPresent = claimedRaw ? sentenceContainsAnyPhrase(sentence, [claimedRaw]) : '';
  const onsetSpanText = extractSpanText(chapterText, feature.onset_char_start, feature.onset_char_end).trim();

  if (onsetSpanText) {
    if (claimedRaw && normalizeText(onsetSpanText) === normalizeText(claimedRaw)) {
      return buildCheck('onset_support', 'pass', `Onset verified at recorded span as "${claimedRaw}".`, {
        span_text: onsetSpanText
      });
    }
    const spanParsed = extractScopedOnset(onsetSpanText, matchedPhrase);
    if (claimedId && spanParsed.onset_hpo_id === claimedId) {
      return buildCheck('onset_support', 'pass', `Onset verified at recorded span as "${feature.onset_raw || feature.onset_label || claimedId}".`, {
        span_text: onsetSpanText
      });
    }
    return buildCheck(
      'onset_support',
      'fail',
      `Onset span text "${onsetSpanText}" does not match claimed onset "${feature.onset_raw || feature.onset_label || claimedId}".`
    );
  }

  if (claimedId && parsed.onset_hpo_id === claimedId) {
    return buildCheck('onset_support', 'pass', `Onset verified as "${feature.onset_raw || feature.onset_label || claimedId}".`);
  }
  if (!claimedId && onsetPresent && !hasBoundaryBetween(sentence, findRawPhraseIndex(sentence, matchedPhrase), findRawPhraseIndex(sentence, claimedRaw))) {
    return buildCheck('onset_support', 'pass', `Onset keyword "${claimedRaw}" found in same clause.`);
  }
  return buildCheck(
    'onset_support',
    'fail',
    `Claimed onset "${feature.onset_raw || feature.onset_label || claimedId}" not deterministically reproduced from source sentence.`
  );
}

function verifyClauseAttachment(feature, chapterText) {
  if (!feature.onset_raw) {
    return buildCheck('clause_attachment', 'skip', 'No onset attachment to verify.');
  }
  const sentence = resolveSentenceEvidence(feature, chapterText).text || String(feature.source_sentence || '');
  const matchedPhrase = sentenceContainsAnyPhrase(sentence, buildPhraseCandidates(feature)) || feature.match_text || feature.hpo_label;
  const sentenceBase = Number.isFinite(Number(feature.sentence_char_start)) ? Number(feature.sentence_char_start) : 0;
  const phraseIndex =
    feature.match_char_start != null && feature.match_char_end != null && sentenceBase >= 0
      ? Number(feature.match_char_start) - sentenceBase
      : findRawPhraseIndex(sentence, matchedPhrase);
  const onsetIndex = findRawPhraseIndex(sentence, feature.onset_raw);
  if (phraseIndex === -1 || onsetIndex === -1) {
    return buildCheck('clause_attachment', 'flag', 'Unable to locate phenotype or onset span for clause check.');
  }
  if (hasBoundaryBetween(sentence, phraseIndex, onsetIndex)) {
    return buildCheck('clause_attachment', 'fail', 'Phenotype and onset are separated by a clause boundary.');
  }
  return buildCheck('clause_attachment', 'pass', 'Phenotype and onset occur in the same clause window.');
}

function verifyAliasShadow(feature, chapterText) {
  const sentence = resolveSentenceEvidence(feature, chapterText).text || String(feature.source_sentence || '');
  const shadow = findAliasShadow(sentence, buildPhraseCandidates(feature));
  if (!shadow) {
    return buildCheck('alias_shadow', 'pass', 'No longer enclosing phenotype phrase detected.');
  }
  return buildCheck('alias_shadow', 'flag', `Potential alias-shadow overlap inside "${shadow}".`, {
    enclosing_phrase: shadow
  });
}

function verifyDiseaseSubtypeLeak(feature, chapterText) {
  if (!feature.onset_raw) {
    return buildCheck('disease_subtype_leak', 'skip', 'No onset claimed.');
  }
  const sentence = resolveSentenceEvidence(feature, chapterText).text || String(feature.source_sentence || '');
  const matchedPhrase = sentenceContainsAnyPhrase(sentence, buildPhraseCandidates(feature)) || feature.match_text || feature.hpo_label;
  if (!hasDiseaseSubtypeLeak(sentence, feature.onset_raw, matchedPhrase)) {
    return buildCheck('disease_subtype_leak', 'pass', 'No disease-subtype leakage pattern detected.');
  }
  return buildCheck('disease_subtype_leak', 'flag', 'Onset keyword appears inside a nearby disease/subtype phrase.');
}

function verifyExcludedStatus(feature, chapterText) {
  if (feature.status !== 'excluded') {
    return buildCheck('excluded_status', 'skip', 'Feature is present, not excluded.');
  }
  const sentence = resolveSentenceEvidence(feature, chapterText).text || String(feature.source_sentence || '');
  const normalized = normalizeText(sentence);
  if (/\bno\b|\bwithout\b|\babsence of\b|\bnot present\b|\bnever had\b/.test(normalized)) {
    return buildCheck('excluded_status', 'pass', 'Negative lexical marker present in source sentence.');
  }
  return buildCheck('excluded_status', 'flag', 'Excluded feature lacks an obvious negative lexical marker in source sentence.');
}

function verifyProgression(feature, chapterText) {
  if (!feature.progression_raw) {
    return buildCheck('progression_support', 'skip', 'No progression claimed.');
  }
  const spanText = extractSpanText(chapterText, feature.progression_char_start, feature.progression_char_end).trim();
  const claimed = normalizeComparableFreeText(feature.progression_raw);
  if (spanText) {
    if (normalizeComparableFreeText(spanText) === claimed) {
      return buildCheck('progression_support', 'pass', `Progression verified at recorded span as "${feature.progression_raw}".`, {
        span_text: spanText
      });
    }
    return buildCheck('progression_support', 'fail', `Progression span text "${spanText}" does not match claimed progression "${feature.progression_raw}".`);
  }
  const evidence = String(feature.progression_evidence || '').trim();
  if (evidence && normalizeComparableFreeText(evidence).includes(claimed) && normalizeComparableFreeText(chapterText).includes(normalizeComparableFreeText(evidence))) {
    return buildCheck('progression_support', 'flag', 'Progression text is supported by evidence sentence but lacks a recorded field span.');
  }
  return buildCheck('progression_support', 'fail', `Claimed progression "${feature.progression_raw}" not deterministically proved from stored evidence.`);
}

function verifyTreatmentResponse(feature, chapterText) {
  if (!feature.treatment_response_raw) {
    return buildCheck('treatment_response_support', 'skip', 'No treatment response claimed.');
  }
  const spanText = extractSpanText(chapterText, feature.treatment_response_char_start, feature.treatment_response_char_end).trim();
  const claimed = normalizeComparableFreeText(feature.treatment_response_raw);
  if (spanText) {
    if (normalizeComparableFreeText(spanText) === claimed) {
      return buildCheck('treatment_response_support', 'pass', `Treatment response verified at recorded span as "${feature.treatment_response_raw}".`, {
        span_text: spanText
      });
    }
    return buildCheck('treatment_response_support', 'fail', `Treatment-response span text "${spanText}" does not match claimed value "${feature.treatment_response_raw}".`);
  }
  const evidence = String(feature.treatment_response_evidence || '').trim();
  if (evidence && normalizeComparableFreeText(evidence).includes(claimed) && normalizeComparableFreeText(chapterText).includes(normalizeComparableFreeText(evidence))) {
    return buildCheck('treatment_response_support', 'flag', 'Treatment-response text is supported by evidence sentence but lacks a recorded field span.');
  }
  return buildCheck('treatment_response_support', 'fail', `Claimed treatment response "${feature.treatment_response_raw}" not deterministically proved from stored evidence.`);
}

function verifyTableConcordance(feature, tables) {
  const tableEntries = buildTableEntries(tables);
  if (!tableEntries.length) {
    return buildCheck('table_concordance', 'skip', 'No parsed GeneReviews tables available.');
  }
  const match = findMatchingTableEntry(feature, tableEntries);
  if (!match) {
    return buildCheck('table_concordance', 'skip', 'No matching table row found for this phenotype.');
  }
  if (feature.frequency_value && match.frequency_text) {
    const rowFrequency = normalizeComparableFrequency(match.frequency_text);
    const featureFrequency = normalizeComparableFrequency(feature.frequency_value || feature.frequency_raw);
    if (rowFrequency === featureFrequency) {
      return buildCheck('table_concordance', 'pass', `Table row supports phenotype and frequency in "${match.table_caption || 'table'}".`, {
        table_phenotype: match.phenotype_text,
        table_frequency: match.frequency_text
      });
    }
    return buildCheck('table_concordance', 'flag', `Matching table row found, but table frequency "${match.frequency_text}" differs from claimed frequency "${feature.frequency_value || feature.frequency_raw}".`, {
      table_phenotype: match.phenotype_text,
      table_frequency: match.frequency_text
    });
  }
  return buildCheck('table_concordance', 'pass', `Phenotype appears in "${match.table_caption || 'table'}".`, {
    table_phenotype: match.phenotype_text,
    table_frequency: match.frequency_text
  });
}

function verifySectionBranchConsistency(feature, options = {}) {
  const rule = inferSectionBranchRule(feature.section_heading);
  if (!rule) {
    return buildCheck('section_branch_consistency', 'skip', 'Section heading does not map to a supported audit branch.');
  }
  const ancestorMap = options.ancestorMap;
  if (!(ancestorMap instanceof Map) || ancestorMap.size === 0) {
    return buildCheck('section_branch_consistency', 'skip', 'No ontology ancestor map is available for branch validation.');
  }
  const ancestors = ancestorMap.get(feature.hpo_id) || new Set();
  if (feature.hpo_id === rule.rootCurie || ancestors.has(rule.rootCurie)) {
    return buildCheck(
      'section_branch_consistency',
      'pass',
      `Phenotype aligns with section branch ${rule.label}.`,
      { expected_root_curie: rule.rootCurie, expected_root_label: rule.label }
    );
  }
  return buildCheck(
    'section_branch_consistency',
    'flag',
    `Phenotype does not fall under expected section branch ${rule.label}.`,
    { expected_root_curie: rule.rootCurie, expected_root_label: rule.label }
  );
}

function determineAutoAcceptEligibility(feature, checks) {
  const checksByName = new Map(checks.map((check) => [check.name, check]));
  const reasons = [];

  if (String(feature.hpo_mapping_trust || '').toLowerCase() !== 'high') {
    reasons.push('hpo_mapping_not_high');
  }

  const requiredPassChecks = ['source_span', 'phenotype_presence', 'alias_shadow', 'table_concordance'];
  for (const name of requiredPassChecks) {
    const check = checksByName.get(name);
    if (!check) {
      reasons.push(`missing_check:${name}`);
      continue;
    }
    if (name === 'table_concordance') {
      if (check.status === 'flag' || check.status === 'fail') {
        reasons.push(`table_conflict:${check.status}`);
      }
      continue;
    }
    if (check.status !== 'pass') {
      reasons.push(`${name}:${check.status}`);
    }
  }

  const conditionalPassChecks = [
    ['frequency_value', 'frequency_support'],
    ['onset_raw', 'onset_support'],
    ['onset_raw', 'clause_attachment'],
    ['onset_raw', 'disease_subtype_leak'],
    ['progression_raw', 'progression_support'],
    ['treatment_response_raw', 'treatment_response_support']
  ];

  for (const [field, checkName] of conditionalPassChecks) {
    if (!feature[field] && !(field === 'onset_raw' && feature.onset_hpo_id)) continue;
    const check = checksByName.get(checkName);
    if (!check || check.status !== 'pass') {
      reasons.push(`${checkName}:${check?.status || 'missing'}`);
    }
  }

  if (feature.status === 'excluded') {
    const excludedCheck = checksByName.get('excluded_status');
    if (!excludedCheck || excludedCheck.status !== 'pass') {
      reasons.push(`excluded_status:${excludedCheck?.status || 'missing'}`);
    }
  }

  const hasCriticalFail = checks.some((check) => check.status === 'fail');
  if (hasCriticalFail) {
    reasons.push('contains_failed_check');
  }

  return {
    eligible: reasons.length === 0,
    reasons
  };
}

export function verifyFeatureDeterministically(feature, chapterText, options = {}) {
  const checks = [
    verifySourceSpan(feature, chapterText),
    verifyPhenotypePresence(feature, chapterText),
    verifyFrequency(feature, chapterText),
    verifyOnset(feature, chapterText),
    verifyProgression(feature, chapterText),
    verifyTreatmentResponse(feature, chapterText),
    verifyClauseAttachment(feature, chapterText),
    verifyAliasShadow(feature, chapterText),
    verifyDiseaseSubtypeLeak(feature, chapterText),
    verifyExcludedStatus(feature, chapterText),
    verifyTableConcordance(feature, options.tables || []),
    verifySectionBranchConsistency(feature, options)
  ];

  const hasFail = checks.some((check) => check.status === 'fail');
  const hasFlag = checks.some((check) => check.status === 'flag');
  const verdict = hasFail ? 'FAILED' : hasFlag ? 'FLAGGED' : 'VERIFIED';
  const autoAccept = determineAutoAcceptEligibility(feature, checks);

  return {
    hpo_id: feature.hpo_id,
    hpo_label: feature.hpo_label,
    status: feature.status || 'present',
    source_sentence: feature.source_sentence || '',
    match_text: feature.match_text || '',
    verdict,
    auto_accept_eligible: autoAccept.eligible,
    auto_accept_reasons: autoAccept.reasons,
    checks
  };
}

export function summarizeFeatureVerifications(verifications) {
  return verifications.reduce(
    (summary, item) => {
      summary.total += 1;
      if (item.verdict === 'VERIFIED') summary.verified += 1;
      if (item.verdict === 'FLAGGED') summary.flagged += 1;
      if (item.verdict === 'FAILED') summary.failed += 1;
      if (item.auto_accept_eligible) summary.autoAcceptEligible += 1;
      return summary;
    },
    { total: 0, verified: 0, flagged: 0, failed: 0, autoAcceptEligible: 0 }
  );
}

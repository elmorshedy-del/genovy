import { summarizeFeatureVerifications } from './genereviewsVerification.js';
import { buildChapterReviewArtifacts } from './genereviewsHumanReview.js';
import { normalizeText, slugify } from './genereviewsPipeline.js';

const NEGATIVE_STATUS_PATTERNS = Object.freeze([
  /\bno\b/i,
  /\bwithout\b/i,
  /\babsence of\b/i,
  /\bnot (?:been )?(?:described|reported|observed|seen|present|identified)\b/i,
  /\bnever\b/i
]);

const UNCERTAIN_STATUS_PATTERNS = Object.freeze([
  /\brare(?:ly)? reported\b/i,
  /\bhave been reported\b/i,
  /\bmay\b/i,
  /\bmight\b/i,
  /\bcan\b/i,
  /\bpossible\b/i,
  /\bfound in some\b/i,
  /\bin some affected individuals\b/i,
  /\bimplicated\b/i
]);

const CLAUSE_LIKE_QUOTE_PATTERNS = Object.freeze([
  /\b(?:is|are|was|were|occurs?|reported|common|seen|found|detected|observed|includes?|include|present)\b/i,
  /\d+(?:\.\d+)?\s*%/,
  /\b\d+\s*(?:of|in)\b/i
]);

const TABLE_LIKE_TEXT_PATTERNS = Object.freeze([
  /\t/,
  /\b\d+(?:\.\d+)?%\b/,
  /\b(?:feature|comment|system)\b.*\b(?:frequency|persons)\b/i
]);

const MIN_STRONG_QUOTE_TOKENS = 3;
const MIN_STRONG_QUOTE_CHARS = 18;

function buildCheck(name, status, detail, extra = {}) {
  return {
    name,
    status,
    detail,
    ...extra
  };
}

function extractSpanText(chapterText, start, end) {
  const source = String(chapterText || '');
  const startIndex = Number(start);
  const endIndex = Number(end);
  if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex)) return '';
  if (startIndex < 0 || endIndex <= startIndex || endIndex > source.length) return '';
  return source.slice(startIndex, endIndex);
}

function createAhoNode() {
  return {
    next: new Map(),
    fail: null,
    outputs: []
  };
}

function buildAhoCorasickMatcher(patterns) {
  const root = createAhoNode();
  const uniquePatterns = [...new Set((patterns || []).map((value) => String(value || '')).filter(Boolean))];

  for (const pattern of uniquePatterns) {
    let node = root;
    for (const char of pattern) {
      if (!node.next.has(char)) node.next.set(char, createAhoNode());
      node = node.next.get(char);
    }
    node.outputs.push(pattern);
  }

  const queue = [];
  for (const child of root.next.values()) {
    child.fail = root;
    queue.push(child);
  }
  root.fail = root;

  while (queue.length > 0) {
    const node = queue.shift();
    for (const [char, child] of node.next.entries()) {
      let failure = node.fail;
      while (failure !== root && !failure.next.has(char)) {
        failure = failure.fail;
      }
      if (failure.next.has(char) && failure.next.get(char) !== child) {
        child.fail = failure.next.get(char);
      } else {
        child.fail = root;
      }
      child.outputs = child.outputs.concat(child.fail.outputs || []);
      queue.push(child);
    }
  }

  return {
    root,
    patterns: uniquePatterns
  };
}

function searchAhoCorasick(text, matcher) {
  const source = String(text || '');
  const root = matcher?.root;
  const matches = new Map((matcher?.patterns || []).map((pattern) => [pattern, []]));
  if (!root) return matches;

  let node = root;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    while (node !== root && !node.next.has(char)) {
      node = node.fail;
    }
    if (node.next.has(char)) {
      node = node.next.get(char);
    } else {
      node = root;
    }
    for (const pattern of node.outputs) {
      const start = index - pattern.length + 1;
      matches.get(pattern)?.push({
        char_start: start,
        char_end: index + 1
      });
    }
  }

  return matches;
}

function buildExactSourceQuoteMatchIndex(chapterText, rows) {
  const patterns = (rows || []).map((row) => String(row?.source_quote || '').trim()).filter(Boolean);
  const matcher = buildAhoCorasickMatcher(patterns);
  return searchAhoCorasick(chapterText, matcher);
}

function matchesAnyPattern(text, patterns) {
  const source = String(text || '');
  return patterns.some((pattern) => pattern.test(source));
}

function reconstructChapterTextFromStructure(clinicalStructure) {
  const paragraphs = Array.isArray(clinicalStructure?.paragraphs) ? clinicalStructure.paragraphs : [];
  const maxLength = paragraphs.reduce((maxValue, paragraph) => {
    const paragraphEnd = Number(paragraph?.char_end || 0);
    return Math.max(maxValue, Number.isFinite(paragraphEnd) ? paragraphEnd : 0);
  }, 0);

  if (!maxLength) {
    return paragraphs.map((paragraph) => String(paragraph?.text || '')).join('\n\n');
  }

  const buffer = Array(maxLength).fill(' ');
  for (const paragraph of paragraphs) {
    const start = Number(paragraph?.char_start);
    const text = String(paragraph?.text || '');
    if (!Number.isFinite(start) || start < 0 || !text) continue;
    for (let index = 0; index < text.length && start + index < buffer.length; index += 1) {
      buffer[start + index] = text[index];
    }
  }

  return buffer.join('');
}

function buildExternalAssertionId(label, status, kind) {
  return `EXT:${kind}:${slugify(`${label}-${status}`)}`;
}

function buildExternalFeature(row, kind) {
  return {
    hpo_id: buildExternalAssertionId(row.label, row.status || row.extraction_bucket || 'present', kind),
    hpo_label: row.label,
    status: row.status || 'present',
    source_sentence: row.source_sentence || '',
    match_text: row.source_quote || row.label,
    local_clinical_domains: Array.isArray(row.local_clinical_domains) ? row.local_clinical_domains : [],
    section_id: row.section_id || null,
    section_heading: row.section_heading || null,
    paragraph_id: row.paragraph_id || null,
    sentence_id: row.sentence_id || null,
    paragraph_char_start: row.paragraph_char_start ?? null,
    paragraph_char_end: row.paragraph_char_end ?? null,
    sentence_char_start: row.sentence_char_start ?? null,
    sentence_char_end: row.sentence_char_end ?? null,
    match_char_start: row.match_char_start ?? null,
    match_char_end: row.match_char_end ?? null
  };
}

function verifySourceSpan(row, chapterText) {
  if (row.sentence_char_start == null || row.sentence_char_end == null) {
    if (row.source_sentence) {
      return buildCheck('source_span', 'flag', 'Source sentence is stored, but no sentence span was recorded.', {
        span_text: row.source_sentence
      });
    }
    return buildCheck('source_span', 'fail', 'No sentence span or stored source sentence is available.');
  }

  const spanText = extractSpanText(chapterText, row.sentence_char_start, row.sentence_char_end).trim();
  if (!spanText) {
    return buildCheck('source_span', 'fail', 'Sentence span does not resolve inside cached chapter text.');
  }

  if (row.source_sentence && normalizeText(spanText) !== normalizeText(row.source_sentence)) {
    return buildCheck('source_span', 'flag', 'Sentence span resolves, but differs from stored source_sentence.', {
      span_text: spanText
    });
  }

  return buildCheck('source_span', 'pass', 'Sentence span resolves inside cached chapter text.', {
    span_text: spanText
  });
}

function verifyQuoteSupport(row, chapterText) {
  const sourceQuote = String(row.source_quote || '').trim();
  if (!sourceQuote) {
    return buildCheck('source_quote_support', 'fail', 'Candidate does not carry a source_quote.');
  }

  const sentenceText =
    extractSpanText(chapterText, row.sentence_char_start, row.sentence_char_end).trim() ||
    String(row.source_sentence || '').trim();
  const normalizedSentence = normalizeText(sentenceText);
  const normalizedQuote = normalizeText(sourceQuote);
  const matchSpanText = extractSpanText(chapterText, row.match_char_start, row.match_char_end).trim();
  const quoteMatchType = String(row.quote_match_type || '').trim();

  if (quoteMatchType.startsWith('source_quote_') && normalizedSentence.includes(normalizedQuote)) {
    return buildCheck('source_quote_support', 'pass', `Source quote grounded via ${quoteMatchType}.`, {
      matched_phrase: sourceQuote,
      match_span_text: matchSpanText || sourceQuote
    });
  }

  if (normalizedSentence && normalizedSentence.includes(normalizedQuote)) {
    return buildCheck('source_quote_support', 'flag', 'Source quote is present in the sentence, but quote-first grounding metadata is missing or downgraded.', {
      matched_phrase: sourceQuote,
      match_span_text: matchSpanText || sourceQuote
    });
  }

  return buildCheck('source_quote_support', 'fail', 'Source quote could not be reproduced from the grounded sentence.', {
    matched_phrase: sourceQuote,
    match_span_text: matchSpanText || null
  });
}

function verifyQuoteVerbatimInChapter(row, chapterText, exactQuoteMatches) {
  const sourceQuote = String(row.source_quote || '').trim();
  if (!sourceQuote) {
    return buildCheck('source_quote_verbatim_chapter', 'fail', 'Candidate does not carry a source_quote.');
  }

  let matches = exactQuoteMatches?.get(sourceQuote) || [];
  if (matches.length === 0) {
    const firstIndex = String(chapterText || '').indexOf(sourceQuote);
    if (firstIndex >= 0) {
      matches = [
        {
          char_start: firstIndex,
          char_end: firstIndex + sourceQuote.length
        }
      ];
    }
  }
  if (matches.length === 0) {
    return buildCheck(
      'source_quote_verbatim_chapter',
      'fail',
      'Source quote does not appear verbatim in the reconstructed chapter text.'
    );
  }
  return buildCheck(
    'source_quote_verbatim_chapter',
    'pass',
    'Source quote appears verbatim in the reconstructed chapter text.',
    {
      occurrence_count: matches.length,
      first_match_start: matches[0]?.char_start ?? null,
      first_match_end: matches[0]?.char_end ?? null
    }
  );
}

function attemptQuoteRepair(row, chapterText, exactQuoteMatches) {
  const originalQuote = String(row.source_quote || '').trim();
  const currentVerbatimCheck = verifyQuoteVerbatimInChapter(row, chapterText, exactQuoteMatches);
  if (currentVerbatimCheck.status === 'pass') {
    return {
      repairedRow: row,
      check: buildCheck('source_quote_repair', 'pass', 'No quote repair needed.')
    };
  }

  const repairedQuote = extractSpanText(chapterText, row.match_char_start, row.match_char_end).trim();
  if (repairedQuote) {
    return {
      repairedRow: {
        ...row,
        source_quote: repairedQuote,
        source_quote_original: originalQuote || null,
        source_quote_repaired: true,
        source_quote_repair_strategy: 'match_span'
      },
      check: buildCheck('source_quote_repair', 'pass', 'Recovered a verbatim source quote from the grounded match span.', {
        original_quote: originalQuote || null,
        repaired_quote: repairedQuote,
        strategy: 'match_span'
      })
    };
  }

  return {
    repairedRow: row,
    check: buildCheck(
      'source_quote_repair',
      'flag',
      'Source quote is not verbatim and no deterministic quote repair was available.',
      {
        original_quote: originalQuote || null
      }
    )
  };
}

function verifyQuoteStrength(row) {
  const sourceQuote = String(row.source_quote || '').trim();
  if (!sourceQuote) {
    return buildCheck('source_quote_strength', 'fail', 'Source quote is missing.');
  }

  const tokenCount = normalizeText(sourceQuote)
    .split(' ')
    .filter(Boolean).length;

  if (
    tokenCount >= MIN_STRONG_QUOTE_TOKENS ||
    sourceQuote.length >= MIN_STRONG_QUOTE_CHARS ||
    matchesAnyPattern(sourceQuote, CLAUSE_LIKE_QUOTE_PATTERNS)
  ) {
    return buildCheck('source_quote_strength', 'pass', 'Source quote is long enough to stand alone as audit evidence.', {
      quote_token_count: tokenCount
    });
  }

  return buildCheck('source_quote_strength', 'flag', 'Source quote is short or generic and should be reviewed for clause-level sufficiency.', {
    quote_token_count: tokenCount
  });
}

function verifyStatusSupport(row, chapterText, options = {}) {
  const sourceSentence =
    extractSpanText(chapterText, row.sentence_char_start, row.sentence_char_end).trim() ||
    String(row.source_sentence || '').trim();
  const normalizedSentence = normalizeText(sourceSentence);
  const status = String(row.status || 'present').toLowerCase();

  if (!normalizedSentence) {
    return buildCheck('status_support', 'flag', 'No grounded sentence is available for status review.');
  }

  if (status === 'excluded') {
    return matchesAnyPattern(sourceSentence, NEGATIVE_STATUS_PATTERNS)
      ? buildCheck('status_support', 'pass', 'Excluded status is supported by negative language in the sentence.')
      : buildCheck('status_support', 'fail', 'Excluded status is not supported by obvious negative language in the sentence.');
  }

  if (status === 'uncertain') {
    return matchesAnyPattern(sourceSentence, UNCERTAIN_STATUS_PATTERNS)
      ? buildCheck('status_support', 'pass', 'Uncertain status is supported by hedged or weak-establishment language.')
      : buildCheck('status_support', 'flag', 'Uncertain status is not obviously supported by hedged language in the sentence.');
  }

  if (options.isRejected) {
    return buildCheck('status_support', 'flag', 'Row was rejected during grounding and should be manually reviewed before reuse.');
  }

  return matchesAnyPattern(sourceSentence, NEGATIVE_STATUS_PATTERNS)
    ? buildCheck('status_support', 'fail', 'Present status conflicts with negative language in the grounded sentence.')
    : buildCheck('status_support', 'pass', 'Present status is consistent with the grounded sentence.');
}

function verifyEvidenceSurface(row) {
  const sectionHeading = String(row.section_heading || '').trim();
  const sourceSentence = String(row.source_sentence || '').trim();
  const quoteMatchType = String(row.quote_match_type || '').trim();
  const groundingConfidence = String(row.grounding_confidence || '').trim().toLowerCase();

  if (sectionHeading.toLowerCase().startsWith('table ') || matchesAnyPattern(sourceSentence, TABLE_LIKE_TEXT_PATTERNS)) {
    return buildCheck('evidence_surface', 'flag', 'Grounding relies on table-style evidence and should stay in review.', {
      evidence_surface: 'table'
    });
  }

  if (quoteMatchType === 'source_quote_paragraph') {
    return buildCheck('evidence_surface', 'flag', 'Grounding fell back to paragraph-level quote localization.', {
      evidence_surface: 'paragraph_fallback'
    });
  }

  if (groundingConfidence === 'low') {
    return buildCheck('evidence_surface', 'flag', 'Grounding confidence is low.', {
      evidence_surface: 'low_confidence'
    });
  }

  if (groundingConfidence === 'medium') {
    return buildCheck('evidence_surface', 'flag', 'Grounding confidence is medium and should be reviewed before auto-accept.', {
      evidence_surface: 'medium_confidence'
    });
  }

  return buildCheck('evidence_surface', 'pass', 'Evidence surface is narrative and quote-localized.');
}

function verifyGroundingResolution(row, options = {}) {
  if (!options.isRejected) {
    return buildCheck('grounding_resolution', 'pass', 'Row was retained by the grounding step.');
  }

  return buildCheck('grounding_resolution', 'fail', `Row was rejected during grounding (${row.reason || 'unspecified_reason'}).`, {
    rejection_reason: row.reason || 'unspecified_reason'
  });
}

function determineAutoAcceptEligibility(checks, row, options = {}) {
  const reasons = [];

  if (options.isRejected) {
    reasons.push(`grounding_rejected:${row.reason || 'unspecified_reason'}`);
  }

  for (const check of checks) {
    if (check.status === 'fail') reasons.push(`${check.name}:fail`);
    if (check.status === 'flag') reasons.push(`${check.name}:flag`);
  }

  if (String(row.status || '').toLowerCase() === 'uncertain') {
    reasons.push('uncertain_bucket_requires_review');
  }

  return {
    eligible: reasons.length === 0,
    reasons
  };
}

function buildVerificationVerdict(checks) {
  if (checks.some((check) => check.status === 'fail')) return 'FAILED';
  if (checks.some((check) => check.status === 'flag')) return 'FLAGGED';
  return 'VERIFIED';
}

function verifyExternalRow(row, chapterText, options = {}) {
  const quoteRepair = attemptQuoteRepair(row, chapterText, options.exactQuoteMatches);
  const effectiveRow = quoteRepair.repairedRow || row;
  const checks = [
    verifyGroundingResolution(row, options),
    verifySourceSpan(effectiveRow, chapterText),
    quoteRepair.check,
    verifyQuoteVerbatimInChapter(effectiveRow, chapterText, options.exactQuoteMatches),
    verifyQuoteSupport(effectiveRow, chapterText),
    verifyQuoteStrength(effectiveRow),
    verifyStatusSupport(effectiveRow, chapterText, options),
    verifyEvidenceSurface(effectiveRow)
  ];

  const autoAccept = determineAutoAcceptEligibility(checks, effectiveRow, options);

  return {
    hpo_id: buildExternalAssertionId(row.label, row.status || row.extraction_bucket || 'present', options.isRejected ? 'rejected' : 'candidate'),
    hpo_label: row.label,
    status: row.status || 'present',
    source_sentence: effectiveRow.source_sentence || '',
    match_text: effectiveRow.source_quote || row.label,
    repaired_row: effectiveRow,
    verdict: options.isRejected ? 'FAILED' : buildVerificationVerdict(checks),
    auto_accept_eligible: autoAccept.eligible,
    auto_accept_reasons: autoAccept.reasons,
    checks
  };
}

function attachReviewContract(rows, verifications, reviewItems) {
  return (rows || []).map((row, index) => {
    const verification = verifications[index] || {};
    const repairedRow = verification.repaired_row || row;
    return {
      ...repairedRow,
      verification_verdict: verification?.verdict || null,
      auto_accept_eligible: verification?.auto_accept_eligible ?? false,
      auto_accept_reasons: verification?.auto_accept_reasons || [],
      review_href: reviewItems[index]?.review_href || null,
      hosted_review_href: reviewItems[index]?.hosted_review_href || null,
      review_id: reviewItems[index]?.review_id || null
    };
  });
}

export function buildExternalGroundingReviewArtifacts(groundedPayload, clinicalStructure, options = {}) {
  const chapterText = reconstructChapterTextFromStructure(clinicalStructure);
  const groundedCandidates = Array.isArray(groundedPayload?.grounded_candidates) ? groundedPayload.grounded_candidates : [];
  const rejectedCandidates = Array.isArray(groundedPayload?.rejected_candidates) ? groundedPayload.rejected_candidates : [];
  const exactQuoteMatches = buildExactSourceQuoteMatchIndex(chapterText, [...groundedCandidates, ...rejectedCandidates]);

  const candidateVerifications = groundedCandidates.map((row) =>
    verifyExternalRow(row, chapterText, { exactQuoteMatches })
  );
  const rejectedVerifications = rejectedCandidates.map((row) =>
    verifyExternalRow(row, chapterText, { isRejected: true, exactQuoteMatches })
  );

  const verifications = [...candidateVerifications, ...rejectedVerifications];
  const repairedGroundedCandidates = groundedCandidates.map((row, index) => candidateVerifications[index]?.repaired_row || row);
  const repairedRejectedCandidates = rejectedCandidates.map((row, index) => rejectedVerifications[index]?.repaired_row || row);
  const features = [
    ...repairedGroundedCandidates.map((row) => buildExternalFeature(row, 'candidate')),
    ...repairedRejectedCandidates.map((row) => buildExternalFeature(row, 'rejected'))
  ];
  const chapter = {
    chapterKey: groundedPayload?.chapter?.chapter_key || groundedPayload?.chapter?.nbk_id || groundedPayload?.chapter?.title || '',
    nbkId: groundedPayload?.chapter?.nbk_id || '',
    chapterTitle: groundedPayload?.chapter?.title || '',
    chapterUrl: groundedPayload?.chapter?.source_url || ''
  };

  const { reviewItems, payload, html } = buildChapterReviewArtifacts({
    chapter,
    features,
    verifications,
    chapterText,
    clinicalStructure,
    reviewPagePath: options.reviewPagePath || ''
  });

  const candidateReviewItems = reviewItems.slice(0, groundedCandidates.length);
  const rejectedReviewItems = reviewItems.slice(groundedCandidates.length);

  return {
    candidateVerifications,
    rejectedVerifications,
    reviewItems,
    reviewPayload: payload,
    reviewHtml: html,
    reviewSummary: {
      candidates: summarizeFeatureVerifications(candidateVerifications),
      rejected_candidates: summarizeFeatureVerifications(rejectedVerifications),
      overall: summarizeFeatureVerifications(verifications)
    },
    groundedCandidatesWithReview: attachReviewContract(repairedGroundedCandidates, candidateVerifications, candidateReviewItems),
    rejectedCandidatesWithReview: attachReviewContract(repairedRejectedCandidates, rejectedVerifications, rejectedReviewItems)
  };
}

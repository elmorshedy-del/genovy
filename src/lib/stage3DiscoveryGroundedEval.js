import fsp from 'node:fs/promises';
import vm from 'node:vm';

export async function loadDiscoveryBenchmark(filePath) {
  const raw = await fsp.readFile(filePath, 'utf8');
  const sandbox = {
    module: { exports: {} },
    exports: {}
  };
  vm.createContext(sandbox);
  vm.runInContext(
    `${raw}\nthis.__cases = typeof DISCOVERY_BENCHMARK !== 'undefined' ? DISCOVERY_BENCHMARK : (module.exports?.DISCOVERY_BENCHMARK || null);`,
    sandbox,
    { timeout: 1000, filename: filePath }
  );
  const loaded = sandbox.__cases;
  if (!Array.isArray(loaded)) {
    throw new Error(`Failed to load DISCOVERY_BENCHMARK from ${filePath}`);
  }
  return loaded;
}

export async function loadCaseReport(filePath) {
  const raw = JSON.parse(await fsp.readFile(filePath, 'utf8'));
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.cases)) return raw.cases;
  throw new Error(`Unsupported report shape: ${filePath}`);
}

export function chunk(items, size) {
  const output = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

export function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function diceCoefficient(left, right) {
  const leftNorm = normalizeText(left);
  const rightNorm = normalizeText(right);
  if (!leftNorm || !rightNorm) return 0;
  const leftTokens = new Set(leftNorm.split(' '));
  const rightTokens = new Set(rightNorm.split(' '));
  if (!leftTokens.size || !rightTokens.size) return 0;
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return (2 * overlap) / (leftTokens.size + rightTokens.size);
}

export function candidateTextVariants(candidate) {
  return [...new Set([candidate?.evidence_text, candidate?.label].map((value) => String(value || '').trim()).filter(Boolean))];
}

export function candidateMatches(candidate, expected) {
  const candidateStatus = candidate?.status || 'present';
  const expectedStatus = expected?.status || 'present';
  if (candidateStatus !== expectedStatus) return false;
  const right = expected?.label || '';
  if (!right) return false;
  for (const left of candidateTextVariants(candidate)) {
    const leftNorm = normalizeText(left);
    const rightNorm = normalizeText(right);
    if (!leftNorm || !rightNorm) continue;
    if (
      leftNorm === rightNorm ||
      leftNorm.includes(rightNorm) ||
      rightNorm.includes(leftNorm) ||
      diceCoefficient(left, right) >= 0.8
    ) {
      return true;
    }
  }
  return false;
}

export function dedupeGroundedCandidates(items) {
  const byKey = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    const evidenceText = String(item?.evidence_text || '').trim();
    const label = String(item?.label || '').trim();
    const status = item?.status === 'excluded' ? 'excluded' : 'present';
    const sentenceId = String(item?.sentence_id || '').trim() || null;
    const dedupeBase = evidenceText || label;
    if (!dedupeBase) continue;
    const key = `${normalizeText(dedupeBase)}::${status}`;
    if (byKey.has(key)) continue;
    byKey.set(key, {
      label: label || evidenceText,
      status,
      sentence_id: sentenceId,
      evidence_text: evidenceText || null
    });
  }
  return [...byKey.values()];
}

export function buildSentenceMap(testCase) {
  const direct = Array.isArray(testCase?.clinical_structure?.sentences)
    ? testCase.clinical_structure.sentences
    : [];
  if (direct.length) {
    return new Map(
      direct
        .map((sentence) => [sentence?.sentence_id, sentence?.text])
        .filter(([sentenceId, text]) => sentenceId && typeof text === 'string')
    );
  }
  const paragraphs = Array.isArray(testCase?.clinical_structure?.paragraphs)
    ? testCase.clinical_structure.paragraphs
    : [];
  return new Map(
    paragraphs.flatMap((paragraph) =>
      Array.isArray(paragraph?.sentences)
        ? paragraph.sentences
            .map((sentence) => [sentence?.sentence_id, sentence?.text])
            .filter(([sentenceId, text]) => sentenceId && typeof text === 'string')
        : []
    )
  );
}

export function validateGroundedCandidate(testCase, candidate) {
  const sentenceMap = buildSentenceMap(testCase);
  const sentenceText = sentenceMap.get(candidate?.sentence_id) || '';
  const evidenceText = String(candidate?.evidence_text || '').trim();
  const validSentenceId = Boolean(candidate?.sentence_id && sentenceText);
  const validEvidenceText = Boolean(
    validSentenceId &&
      evidenceText &&
      sentenceText.toLowerCase().includes(evidenceText.toLowerCase())
  );
  return {
    validSentenceId,
    validEvidenceText,
    validGrounding: validSentenceId && validEvidenceText
  };
}

export function evaluateGroundedCase(testCase, predictedCandidates) {
  const expected = Array.isArray(testCase.expectedNewCandidates) ? testCase.expectedNewCandidates : [];
  const mustNot = Array.isArray(testCase.mustNotPropose) ? testCase.mustNotPropose : [];
  const acceptable = Array.isArray(testCase.acceptableExtraCandidates)
    ? testCase.acceptableExtraCandidates
    : [];

  const grounding = predictedCandidates.map((candidate) => ({
    candidate,
    ...validateGroundedCandidate(testCase, candidate)
  }));

  const consumed = new Set();
  const matchedExpectedCandidates = [];
  const missedExpectedCandidates = [];

  for (const expectedCandidate of expected) {
    let foundIndex = -1;
    let foundCandidate = null;
    for (let index = 0; index < predictedCandidates.length; index += 1) {
      if (consumed.has(index)) continue;
      const candidate = predictedCandidates[index];
      if (candidateMatches(candidate, expectedCandidate)) {
        foundIndex = index;
        foundCandidate = candidate;
        break;
      }
    }
    if (foundIndex >= 0) {
      consumed.add(foundIndex);
      matchedExpectedCandidates.push({ expected: expectedCandidate, predicted: foundCandidate });
    } else {
      missedExpectedCandidates.push(expectedCandidate);
    }
  }

  const mustNotProposeViolations = [];
  for (const blocked of mustNot) {
    const violation = predictedCandidates.find((candidate, index) => {
      if (consumed.has(index)) return false;
      return candidateMatches(candidate, { label: blocked.label, status: 'present' });
    });
    if (violation) {
      mustNotProposeViolations.push({
        label: blocked.label,
        reason: blocked.reason,
        predicted: violation
      });
    }
  }

  const acceptableExtraMatches = [];
  const unexpectedPredictedCandidates = [];
  for (let index = 0; index < predictedCandidates.length; index += 1) {
    if (consumed.has(index)) continue;
    const candidate = predictedCandidates[index];
    const acceptableMatch = acceptable.find((alt) => candidateMatches(candidate, alt));
    if (acceptableMatch) {
      acceptableExtraMatches.push({ expected: acceptableMatch, predicted: candidate });
      continue;
    }
    unexpectedPredictedCandidates.push(candidate);
  }

  return {
    grounding,
    matchedExpectedCandidates,
    missedExpectedCandidates,
    mustNotProposeViolations,
    acceptableExtraMatches,
    unexpectedPredictedCandidates,
    strictExactCaseMatch:
      missedExpectedCandidates.length === 0 &&
      mustNotProposeViolations.length === 0 &&
      unexpectedPredictedCandidates.length === 0,
    acceptableExactCaseMatch:
      missedExpectedCandidates.length === 0 &&
      mustNotProposeViolations.length === 0
  };
}

export function buildGroundedSummary(cases, evaluatedCases) {
  const summary = {
    total: cases.length,
    strictExactMatchCount: 0,
    acceptableExactMatchCount: 0,
    expectedCandidateTotal: 0,
    matchedExpectedCandidateTotal: 0,
    mustNotProposeTotal: 0,
    mustNotProposeViolationTotal: 0,
    groundedCandidateTotal: 0,
    validSentenceIdTotal: 0,
    validEvidenceTextTotal: 0,
    validGroundingTotal: 0
  };

  for (let index = 0; index < cases.length; index += 1) {
    const testCase = cases[index];
    const evaluated = evaluatedCases[index];
    summary.expectedCandidateTotal += (testCase.expectedNewCandidates || []).length;
    summary.matchedExpectedCandidateTotal += evaluated.matchedExpectedCandidates.length;
    summary.mustNotProposeTotal += (testCase.mustNotPropose || []).length;
    summary.mustNotProposeViolationTotal += evaluated.mustNotProposeViolations.length;
    summary.groundedCandidateTotal += evaluated.grounding.length;
    summary.validSentenceIdTotal += evaluated.grounding.filter((item) => item.validSentenceId).length;
    summary.validEvidenceTextTotal += evaluated.grounding.filter((item) => item.validEvidenceText).length;
    summary.validGroundingTotal += evaluated.grounding.filter((item) => item.validGrounding).length;

    if (evaluated.strictExactCaseMatch) summary.strictExactMatchCount += 1;
    if (evaluated.acceptableExactCaseMatch) summary.acceptableExactMatchCount += 1;
  }

  summary.strictExactMatchRate = summary.total
    ? Number((summary.strictExactMatchCount / summary.total).toFixed(4))
    : 0;
  summary.acceptableExactMatchRate = summary.total
    ? Number((summary.acceptableExactMatchCount / summary.total).toFixed(4))
    : 0;
  summary.expectedCandidateRecall = summary.expectedCandidateTotal
    ? Number((summary.matchedExpectedCandidateTotal / summary.expectedCandidateTotal).toFixed(4))
    : 0;
  summary.mustNotProposePassRate = summary.mustNotProposeTotal
    ? Number(
        (
          (summary.mustNotProposeTotal - summary.mustNotProposeViolationTotal) /
          summary.mustNotProposeTotal
        ).toFixed(4)
      )
    : 1;
  summary.validSentenceIdRate = summary.groundedCandidateTotal
    ? Number((summary.validSentenceIdTotal / summary.groundedCandidateTotal).toFixed(4))
    : 1;
  summary.validEvidenceTextRate = summary.groundedCandidateTotal
    ? Number((summary.validEvidenceTextTotal / summary.groundedCandidateTotal).toFixed(4))
    : 1;
  summary.validGroundingRate = summary.groundedCandidateTotal
    ? Number((summary.validGroundingTotal / summary.groundedCandidateTotal).toFixed(4))
    : 1;

  return summary;
}

import { candidateMatches, normalizeText } from './stage3DiscoveryGroundedEval.js';
import { slugify } from './genereviewsPipeline.js';

function normalizeChapterKey(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return slugify(raw.split(' - ')[0]).toLowerCase();
}

function normalizeEvidenceKey(sentenceId, text, status = 'present') {
  return `${String(sentenceId || '').trim()}::${normalizeText(text)}::${String(status || 'present').toLowerCase()}`;
}

function toCandidateComparable(candidate) {
  return {
    label: candidate?.label || candidate?.evidence_text || '',
    status: candidate?.status === 'excluded' ? 'excluded' : 'present',
    evidence_text: candidate?.evidence_text || candidate?.label || '',
    sentence_id: candidate?.sentence_id || null
  };
}

function getReportCandidates(report) {
  if (Array.isArray(report?.candidates)) return report.candidates;
  if (Array.isArray(report?.nonduplicate_predictions)) return report.nonduplicate_predictions;
  if (Array.isArray(report?.predictions)) return report.predictions;
  return [];
}

function targetMatchesCandidate(target, candidate) {
  if (String(candidate?.sentence_id || '').trim() !== String(target?.sentence_id || '').trim()) {
    return false;
  }
  return candidateMatches(
    toCandidateComparable(candidate),
    {
      label: target?.evidence_text || '',
      status: target?.status || 'present'
    }
  );
}

export function buildManualAuditTargetIndex(manualAudit) {
  const chapters = Array.isArray(manualAudit?.chapters) ? manualAudit.chapters : [];
  const index = new Map();

  for (const chapter of chapters) {
    const chapterKey = normalizeChapterKey(chapter?.chapter_key);
    if (!chapterKey) continue;
    const entries = Array.isArray(chapter?.entries) ? chapter.entries : [];
    index.set(chapterKey, {
      chapter_key: chapter.chapter_key,
      useful_new_targets: entries
        .filter((entry) => entry?.bucket === 'useful_new')
        .map((entry) => ({
          sentence_id: entry.sentence_id || null,
          evidence_text: entry.evidence_text || '',
          status: 'present',
          notes: entry.notes || null
        })),
      entries
    });
  }

  return index;
}

export function evaluateGroundedExternalChapter(report, manualChapter) {
  const candidates = getReportCandidates(report);
  const usefulTargets = Array.isArray(manualChapter?.useful_new_targets) ? manualChapter.useful_new_targets : [];
  const consumed = new Set();
  const matchedTargets = [];
  const missedTargets = [];

  for (const target of usefulTargets) {
    let foundIndex = -1;
    for (let index = 0; index < candidates.length; index += 1) {
      if (consumed.has(index)) continue;
      if (targetMatchesCandidate(target, candidates[index])) {
        foundIndex = index;
        break;
      }
    }

    if (foundIndex >= 0) {
      consumed.add(foundIndex);
      matchedTargets.push({
        target,
        predicted: candidates[foundIndex]
      });
    } else {
      missedTargets.push(target);
    }
  }

  const matchedKeys = new Set(
    matchedTargets.map(({ predicted }) =>
      normalizeEvidenceKey(predicted?.sentence_id, predicted?.evidence_text || predicted?.label, predicted?.status)
    )
  );

  const unmatchedPredictedCandidates = candidates.filter((candidate) => {
    const key = normalizeEvidenceKey(candidate?.sentence_id, candidate?.evidence_text || candidate?.label, candidate?.status);
    return !matchedKeys.has(key);
  });

  const targetTotal = usefulTargets.length;
  const matchedTotal = matchedTargets.length;

  return {
    chapter_key: manualChapter?.chapter_key || null,
    useful_new_target_total: targetTotal,
    matched_useful_new_total: matchedTotal,
    useful_new_recall: targetTotal ? Number((matchedTotal / targetTotal).toFixed(4)) : null,
    matched_targets: matchedTargets,
    missed_targets: missedTargets,
    unmatched_predicted_candidates: unmatchedPredictedCandidates
  };
}

export function evaluateGroundedExternalReportsAgainstManualAudit(reports, manualAudit) {
  const manualIndex = buildManualAuditTargetIndex(manualAudit);
  const chapterReports = [];
  let usefulNewTargetTotal = 0;
  let matchedUsefulNewTotal = 0;

  for (const report of Array.isArray(reports) ? reports : []) {
    const chapterKey = normalizeChapterKey(
      report?.chapter?.chapter_key || report?.chapter_key || report?.chapter?.title || report?.chapter_title
    );
    if (!chapterKey) continue;

    const manualChapter = manualIndex.get(chapterKey);
    if (!manualChapter) {
      chapterReports.push({
        chapter_key: report?.chapter?.chapter_key || chapterKey,
        skipped: true,
        reason: 'manual_audit_chapter_not_found'
      });
      continue;
    }

    const evaluation = evaluateGroundedExternalChapter(report, manualChapter);
    usefulNewTargetTotal += evaluation.useful_new_target_total;
    matchedUsefulNewTotal += evaluation.matched_useful_new_total;
    chapterReports.push(evaluation);
  }

  return {
    total_chapters_evaluated: chapterReports.filter((chapter) => !chapter.skipped).length,
    useful_new_target_total: usefulNewTargetTotal,
    matched_useful_new_total: matchedUsefulNewTotal,
    useful_new_recall: usefulNewTargetTotal
      ? Number((matchedUsefulNewTotal / usefulNewTargetTotal).toFixed(4))
      : null,
    chapter_reports: chapterReports
  };
}

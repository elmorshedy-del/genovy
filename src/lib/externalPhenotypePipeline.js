import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {
  buildClinicalTextStructure,
  finalizePhenotypeCandidates,
  readJson,
  writeJson
} from './genereviewsPipeline.js';
import {
  enrichFinalizedCandidates,
  freezeExternalPhenotypeExtraction,
  normalizeExternalPhenotypeExtraction,
  parseExternalPhenotypeExtractionPayload,
  reconcileGroundingCoverage,
  toFinalizeCandidateRows
} from './externalPhenotypeExtraction.js';
import { buildExternalGroundingReviewArtifacts } from './externalPhenotypeVerification.js';

export function requireExistingPath(filePath, label = 'file') {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Missing ${label}: ${resolved}`);
  }
  return resolved;
}

export function deriveFreezeOutputPath(inputPath, explicitOutput = '') {
  if (explicitOutput) return path.resolve(explicitOutput);
  return path.join(path.dirname(inputPath), `${path.basename(inputPath, path.extname(inputPath))}_frozen.json`);
}

export function deriveGroundedOutputPath(inputPath, explicitOutput = '') {
  if (explicitOutput) return path.resolve(explicitOutput);

  const baseName = path.basename(inputPath, path.extname(inputPath));
  const groundedBase = baseName.endsWith('_frozen') ? `${baseName.slice(0, -7)}_grounded` : `${baseName}_grounded`;
  return path.join(path.dirname(inputPath), `${groundedBase}.json`);
}

export async function loadClinicalStructure(filePath) {
  const resolvedPath = requireExistingPath(filePath, 'clinical source');

  if (String(resolvedPath).toLowerCase().endsWith('.txt')) {
    const clinicalText = await fsp.readFile(resolvedPath, 'utf8');
    return buildClinicalTextStructure(clinicalText);
  }

  const payload = await readJson(resolvedPath, null);
  if (!payload) {
    throw new Error(`Unable to read clinical structure: ${resolvedPath}`);
  }
  return payload;
}

export async function loadAnchors(filePath) {
  if (!filePath) return [];
  const resolvedPath = requireExistingPath(filePath, 'anchors JSON');
  const payload = await readJson(resolvedPath, null);
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.anchors)) return payload.anchors;
  return [];
}

export function summarizeCandidateBuckets(rows) {
  const summary = {
    present: 0,
    excluded: 0,
    uncertain: 0
  };

  for (const row of rows || []) {
    const bucket = row.extraction_bucket || 'present';
    if (summary[bucket] !== undefined) summary[bucket] += 1;
  }

  return summary;
}

export async function freezeExternalExtractionFromRaw(rawPayload, options = {}) {
  const parsedPayload = parseExternalPhenotypeExtractionPayload(rawPayload);
  const frozen = freezeExternalPhenotypeExtraction(parsedPayload);

  if (options.outputPath) {
    await writeJson(path.resolve(options.outputPath), frozen);
  }

  return frozen;
}

export async function freezeExternalExtractionFromPath(inputPath, outputPath = '') {
  const resolvedInputPath = requireExistingPath(inputPath, 'input file');
  const resolvedOutputPath = deriveFreezeOutputPath(resolvedInputPath, outputPath);
  const rawPayload = await fsp.readFile(resolvedInputPath, 'utf8');
  const frozen = await freezeExternalExtractionFromRaw(rawPayload, { outputPath: resolvedOutputPath });

  return {
    frozen,
    inputPath: resolvedInputPath,
    outputPath: resolvedOutputPath
  };
}

export async function groundExternalExtractionFromValue(extractionValue, options) {
  const normalizedExtraction = normalizeExternalPhenotypeExtraction(extractionValue);
  const candidateRows = toFinalizeCandidateRows(normalizedExtraction, {
    includeUncertain: Boolean(options.includeUncertain)
  });
  const clinicalStructure = options.clinicalStructure || (await loadClinicalStructure(options.clinicalPath));
  const anchors = options.anchors || (await loadAnchors(options.anchorsPath));
  const { candidates, rejectedCandidates } = finalizePhenotypeCandidates(
    candidateRows,
    anchors,
    clinicalStructure,
    'external_extraction',
    {
      allowExistingAnchors: true,
      preserveInputStatus: true
    }
  );

  const enrichedCandidates = enrichFinalizedCandidates(candidates, candidateRows);
  const enrichedRejectedCandidates = enrichFinalizedCandidates(rejectedCandidates, candidateRows);
  const reconciledGrounding = reconcileGroundingCoverage(candidateRows, enrichedCandidates, enrichedRejectedCandidates);
  const finalCandidates = reconciledGrounding.candidates;
  const finalRejectedCandidates = reconciledGrounding.rejectedCandidates;

  const reviewOutputPath = options.outputPath ? path.resolve(options.outputPath) : '';
  const outputDir = reviewOutputPath ? path.dirname(reviewOutputPath) : '';
  const fileStem = reviewOutputPath ? path.basename(reviewOutputPath, path.extname(reviewOutputPath)) : '';
  const reviewPagePath = outputDir ? path.join(outputDir, 'review_pages', `${fileStem}_review.html`) : '';
  const reviewDataPath = outputDir ? path.join(outputDir, 'review_data', `${fileStem}_review.json`) : '';

  const reviewArtifacts = buildExternalGroundingReviewArtifacts(
    {
      chapter: normalizedExtraction.chapter,
      grounded_candidates: finalCandidates,
      rejected_candidates: finalRejectedCandidates
    },
    clinicalStructure,
    {
      reviewPagePath
    }
  );

  const grounded = {
    created_at: new Date().toISOString(),
    stage: 'external_extraction_grounded',
    input_path: options.inputPath ? path.resolve(options.inputPath) : null,
    clinical_path: options.clinicalPath ? path.resolve(options.clinicalPath) : null,
    anchors_path: options.anchorsPath ? path.resolve(options.anchorsPath) : null,
    include_uncertain: Boolean(options.includeUncertain),
    chapter: normalizedExtraction.chapter,
    context_metadata: normalizedExtraction.context_metadata,
    context_notes: normalizedExtraction.context_notes,
    negative_or_contrastive_findings: normalizedExtraction.negative_or_contrastive_findings,
    normalized_counts: {
      present: normalizedExtraction.phenotypes.present.length,
      excluded: normalizedExtraction.phenotypes.excluded.length,
      uncertain: normalizedExtraction.phenotypes.uncertain.length,
      candidate_rows_for_grounding: candidateRows.length
    },
    grounded_counts: {
      candidates: reviewArtifacts.groundedCandidatesWithReview.length,
      rejected_candidates: reviewArtifacts.rejectedCandidatesWithReview.length,
      candidates_by_bucket: summarizeCandidateBuckets(reviewArtifacts.groundedCandidatesWithReview)
    },
    review_page_path: reviewPagePath || null,
    review_data_path: reviewDataPath || null,
    verification_summary: reviewArtifacts.reviewSummary,
    grounded_candidates: reviewArtifacts.groundedCandidatesWithReview,
    candidates: reviewArtifacts.groundedCandidatesWithReview,
    verifications: reviewArtifacts.candidateVerifications,
    rejected_candidates: reviewArtifacts.rejectedCandidatesWithReview,
    rejected_candidate_reviews: reviewArtifacts.rejectedVerifications
  };

  if (options.outputPath) {
    await fsp.mkdir(path.dirname(reviewPagePath), { recursive: true });
    await fsp.mkdir(path.dirname(reviewDataPath), { recursive: true });
    await fsp.writeFile(reviewPagePath, reviewArtifacts.reviewHtml, 'utf8');
    await writeJson(reviewDataPath, reviewArtifacts.reviewPayload);
    await writeJson(path.resolve(options.outputPath), grounded);
  }

  return grounded;
}

export async function groundExternalExtractionFromPath(inputPath, options) {
  const resolvedInputPath = requireExistingPath(inputPath, 'input file');
  const resolvedOutputPath = deriveGroundedOutputPath(resolvedInputPath, options.outputPath || '');
  const rawPayload = await fsp.readFile(resolvedInputPath, 'utf8');

  const grounded = await groundExternalExtractionFromValue(rawPayload, {
    ...options,
    inputPath: resolvedInputPath,
    outputPath: resolvedOutputPath
  });

  return {
    grounded,
    inputPath: resolvedInputPath,
    outputPath: resolvedOutputPath
  };
}

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {
  buildClinicalTextStructure,
  finalizePhenotypeCandidates,
  parseArgs,
  readJson,
  writeJson
} from '../lib/genereviewsPipeline.js';
import {
  enrichFinalizedCandidates,
  normalizeExternalPhenotypeExtraction,
  toFinalizeCandidateRows
} from '../lib/externalPhenotypeExtraction.js';

function usage() {
  return [
    'Usage:',
    '  node src/scripts/groundExternalPhenotypeExtraction.js --input <extraction.json> --clinical <clinical_structure.json|clinical_text.txt> [--anchors <anchors.json>] [--output <output.json>] [--include-uncertain]'
  ].join('\n');
}

async function loadClinicalStructure(filePath) {
  if (String(filePath).toLowerCase().endsWith('.txt')) {
    const clinicalText = await fsp.readFile(filePath, 'utf8');
    return buildClinicalTextStructure(clinicalText);
  }

  const payload = await readJson(filePath, null);
  if (!payload) {
    throw new Error(`Unable to read clinical structure: ${filePath}`);
  }
  return payload;
}

async function loadAnchors(filePath) {
  if (!filePath) return [];
  const payload = await readJson(filePath, null);
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.anchors)) return payload.anchors;
  return [];
}

function summarizeCandidateBuckets(rows) {
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

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const inputPath = flags.input;
  const clinicalPath = flags.clinical || flags['clinical-structure'];
  const anchorsPath = flags.anchors || '';
  const includeUncertain = Boolean(flags['include-uncertain'] || flags.includeUncertain);

  if (!inputPath || !clinicalPath) {
    throw new Error(usage());
  }

  const resolvedInputPath = path.resolve(inputPath);
  const resolvedClinicalPath = path.resolve(clinicalPath);
  const resolvedAnchorsPath = anchorsPath ? path.resolve(anchorsPath) : '';
  const resolvedOutputPath = path.resolve(
    flags.output ||
      path.join(
        path.dirname(resolvedInputPath),
        `${path.basename(resolvedInputPath, path.extname(resolvedInputPath))}_grounded.json`
      )
  );

  if (!fs.existsSync(resolvedInputPath)) {
    throw new Error(`Missing extraction JSON: ${resolvedInputPath}`);
  }
  if (!fs.existsSync(resolvedClinicalPath)) {
    throw new Error(`Missing clinical source: ${resolvedClinicalPath}`);
  }
  if (resolvedAnchorsPath && !fs.existsSync(resolvedAnchorsPath)) {
    throw new Error(`Missing anchors JSON: ${resolvedAnchorsPath}`);
  }

  const extractionPayload = JSON.parse(await fsp.readFile(resolvedInputPath, 'utf8'));
  const normalizedExtraction = normalizeExternalPhenotypeExtraction(extractionPayload);
  const candidateRows = toFinalizeCandidateRows(normalizedExtraction, { includeUncertain });
  const clinicalStructure = await loadClinicalStructure(resolvedClinicalPath);
  const anchors = await loadAnchors(resolvedAnchorsPath);
  const { candidates, rejectedCandidates } = finalizePhenotypeCandidates(
    candidateRows,
    anchors,
    clinicalStructure,
    'external_extraction'
  );

  const enrichedCandidates = enrichFinalizedCandidates(candidates, candidateRows);
  const enrichedRejectedCandidates = enrichFinalizedCandidates(rejectedCandidates, candidateRows);

  await writeJson(resolvedOutputPath, {
    created_at: new Date().toISOString(),
    stage: 'external_extraction_grounded',
    input_path: resolvedInputPath,
    clinical_path: resolvedClinicalPath,
    anchors_path: resolvedAnchorsPath || null,
    include_uncertain: includeUncertain,
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
      candidates: enrichedCandidates.length,
      rejected_candidates: enrichedRejectedCandidates.length,
      candidates_by_bucket: summarizeCandidateBuckets(enrichedCandidates)
    },
    candidates: enrichedCandidates,
    rejected_candidates: enrichedRejectedCandidates
  });

  console.log(`Wrote grounded external extraction: ${resolvedOutputPath}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

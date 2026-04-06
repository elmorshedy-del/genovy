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
  freezeExternalPhenotypeExtraction,
  normalizeExternalPhenotypeExtraction,
  parseExternalPhenotypeExtractionPayload,
  toFinalizeCandidateRows
} from '../lib/externalPhenotypeExtraction.js';

const SUPPORTED_MODES = new Set(['freeze', 'ground', 'freeze-and-ground']);

function usage() {
  return [
    'Usage:',
    '  node src/scripts/externalPhenotypePipeline.js freeze --input <raw.json|txt> [--output <frozen.json>]',
    '  node src/scripts/externalPhenotypePipeline.js ground --input <frozen.json> --clinical <clinical_structure.json|clinical_text.txt> [--anchors <anchors.json>] [--output <grounded.json>] [--include-uncertain]',
    '  node src/scripts/externalPhenotypePipeline.js freeze-and-ground --input <raw.json|txt> --clinical <clinical_structure.json|clinical_text.txt> [--anchors <anchors.json>] [--frozen-output <frozen.json>] [--grounded-output <grounded.json>] [--include-uncertain]'
  ].join('\n');
}

function ensureMode(argv) {
  const mode = String(argv[0] || '').trim();
  if (!SUPPORTED_MODES.has(mode)) {
    throw new Error(usage());
  }
  return mode;
}

function resolveInputPath(filePath) {
  if (!filePath) throw new Error(usage());
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Missing input file: ${resolved}`);
  }
  return resolved;
}

function deriveFreezeOutputPath(inputPath, explicitOutput = '') {
  if (explicitOutput) return path.resolve(explicitOutput);
  return path.join(path.dirname(inputPath), `${path.basename(inputPath, path.extname(inputPath))}_frozen.json`);
}

function deriveGroundedOutputPath(inputPath, explicitOutput = '') {
  if (explicitOutput) return path.resolve(explicitOutput);

  const baseName = path.basename(inputPath, path.extname(inputPath));
  const groundedBase = baseName.endsWith('_frozen') ? `${baseName.slice(0, -7)}_grounded` : `${baseName}_grounded`;
  return path.join(path.dirname(inputPath), `${groundedBase}.json`);
}

async function loadClinicalStructure(filePath) {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Missing clinical source: ${resolvedPath}`);
  }

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

async function loadAnchors(filePath) {
  if (!filePath) return [];
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Missing anchors JSON: ${resolvedPath}`);
  }
  const payload = await readJson(resolvedPath, null);
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

async function freezeToPath(inputPath, outputPath) {
  const rawPayload = await fsp.readFile(inputPath, 'utf8');
  const parsedPayload = parseExternalPhenotypeExtractionPayload(rawPayload);
  const frozen = freezeExternalPhenotypeExtraction(parsedPayload);
  await writeJson(outputPath, frozen);
  return frozen;
}

async function groundToPath(inputPath, outputPath, options) {
  const extractionPayload = parseExternalPhenotypeExtractionPayload(await fsp.readFile(inputPath, 'utf8'));
  const normalizedExtraction = normalizeExternalPhenotypeExtraction(extractionPayload);
  const candidateRows = toFinalizeCandidateRows(normalizedExtraction, {
    includeUncertain: Boolean(options.includeUncertain)
  });
  const clinicalStructure = await loadClinicalStructure(options.clinicalPath);
  const anchors = await loadAnchors(options.anchorsPath);
  const { candidates, rejectedCandidates } = finalizePhenotypeCandidates(
    candidateRows,
    anchors,
    clinicalStructure,
    'external_extraction'
  );

  const enrichedCandidates = enrichFinalizedCandidates(candidates, candidateRows);
  const enrichedRejectedCandidates = enrichFinalizedCandidates(rejectedCandidates, candidateRows);

  const grounded = {
    created_at: new Date().toISOString(),
    stage: 'external_extraction_grounded',
    input_path: inputPath,
    clinical_path: path.resolve(options.clinicalPath),
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
      candidates: enrichedCandidates.length,
      rejected_candidates: enrichedRejectedCandidates.length,
      candidates_by_bucket: summarizeCandidateBuckets(enrichedCandidates)
    },
    candidates: enrichedCandidates,
    rejected_candidates: enrichedRejectedCandidates
  };

  await writeJson(outputPath, grounded);
  return grounded;
}

async function main() {
  const mode = ensureMode(process.argv.slice(2));
  const flags = parseArgs(process.argv.slice(3));

  if (mode === 'freeze') {
    const inputPath = resolveInputPath(flags.input);
    const outputPath = deriveFreezeOutputPath(inputPath, flags.output);
    await freezeToPath(inputPath, outputPath);
    console.log(`Wrote frozen external extraction: ${outputPath}`);
    return;
  }

  if (mode === 'ground') {
    const inputPath = resolveInputPath(flags.input);
    const outputPath = deriveGroundedOutputPath(inputPath, flags.output);
    if (!flags.clinical) {
      throw new Error(usage());
    }
    await groundToPath(inputPath, outputPath, {
      clinicalPath: flags.clinical,
      anchorsPath: flags.anchors || '',
      includeUncertain: Boolean(flags['include-uncertain'] || flags.includeUncertain)
    });
    console.log(`Wrote grounded external extraction: ${outputPath}`);
    return;
  }

  if (flags.output) {
    throw new Error('Use --frozen-output and/or --grounded-output with freeze-and-ground.');
  }

  const inputPath = resolveInputPath(flags.input);
  if (!flags.clinical) {
    throw new Error(usage());
  }

  const frozenOutputPath = deriveFreezeOutputPath(inputPath, flags['frozen-output'] || flags.frozenOutput);
  const groundedOutputPath = deriveGroundedOutputPath(inputPath, flags['grounded-output'] || flags.groundedOutput);

  await freezeToPath(inputPath, frozenOutputPath);
  await groundToPath(frozenOutputPath, groundedOutputPath, {
    clinicalPath: flags.clinical,
    anchorsPath: flags.anchors || '',
    includeUncertain: Boolean(flags['include-uncertain'] || flags.includeUncertain)
  });

  console.log(`Wrote frozen external extraction: ${frozenOutputPath}`);
  console.log(`Wrote grounded external extraction: ${groundedOutputPath}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

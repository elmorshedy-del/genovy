import { parseArgs } from '../lib/genereviewsPipeline.js';
import {
  deriveFreezeOutputPath,
  deriveGroundedOutputPath,
  freezeExternalExtractionFromPath,
  groundExternalExtractionFromPath,
  requireExistingPath
} from '../lib/externalPhenotypePipeline.js';

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

async function main() {
  const mode = ensureMode(process.argv.slice(2));
  const flags = parseArgs(process.argv.slice(3));

  if (mode === 'freeze') {
    if (!flags.input) throw new Error(usage());
    const inputPath = requireExistingPath(flags.input, 'input file');
    const outputPath = deriveFreezeOutputPath(inputPath, flags.output);
    await freezeExternalExtractionFromPath(inputPath, outputPath);
    console.log(`Wrote frozen external extraction: ${outputPath}`);
    return;
  }

  if (mode === 'ground') {
    if (!flags.input) throw new Error(usage());
    const inputPath = requireExistingPath(flags.input, 'input file');
    const outputPath = deriveGroundedOutputPath(inputPath, flags.output);
    if (!flags.clinical) {
      throw new Error(usage());
    }
    await groundExternalExtractionFromPath(inputPath, {
      outputPath,
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

  if (!flags.input) throw new Error(usage());
  const inputPath = requireExistingPath(flags.input, 'input file');
  if (!flags.clinical) {
    throw new Error(usage());
  }

  const frozenOutputPath = deriveFreezeOutputPath(inputPath, flags['frozen-output'] || flags.frozenOutput);
  const groundedOutputPath = deriveGroundedOutputPath(inputPath, flags['grounded-output'] || flags.groundedOutput);

  await freezeExternalExtractionFromPath(inputPath, frozenOutputPath);
  await groundExternalExtractionFromPath(frozenOutputPath, {
    outputPath: groundedOutputPath,
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

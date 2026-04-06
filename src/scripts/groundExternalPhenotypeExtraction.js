import fs from 'node:fs';
import path from 'node:path';
import {
  deriveGroundedOutputPath,
  groundExternalExtractionFromPath,
  requireExistingPath
} from '../lib/externalPhenotypePipeline.js';
import { parseArgs } from '../lib/genereviewsPipeline.js';

function usage() {
  return [
    'Usage:',
    '  node src/scripts/groundExternalPhenotypeExtraction.js --input <extraction.json> --clinical <clinical_structure.json|clinical_text.txt> [--anchors <anchors.json>] [--output <output.json>] [--include-uncertain]'
  ].join('\n');
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

  const resolvedInputPath = requireExistingPath(inputPath, 'input file');
  const resolvedClinicalPath = requireExistingPath(clinicalPath, 'clinical source');
  const resolvedAnchorsPath = anchorsPath ? path.resolve(anchorsPath) : '';
  const resolvedOutputPath = deriveGroundedOutputPath(resolvedInputPath, flags.output || '');

  if (resolvedAnchorsPath && !fs.existsSync(resolvedAnchorsPath)) {
    throw new Error(`Missing anchors JSON: ${resolvedAnchorsPath}`);
  }

  await groundExternalExtractionFromPath(resolvedInputPath, {
    outputPath: resolvedOutputPath,
    clinicalPath: resolvedClinicalPath,
    anchorsPath: resolvedAnchorsPath,
    includeUncertain
  });

  console.log(`Wrote grounded external extraction: ${resolvedOutputPath}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

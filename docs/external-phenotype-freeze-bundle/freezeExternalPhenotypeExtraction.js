import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { parseArgs, writeJson } from '../lib/genereviewsPipeline.js';
import {
  freezeExternalPhenotypeExtraction,
  parseExternalPhenotypeExtractionPayload
} from '../lib/externalPhenotypeExtraction.js';

function usage() {
  return [
    'Usage:',
    '  node src/scripts/freezeExternalPhenotypeExtraction.js --input <raw-extraction.json|txt> [--output <frozen.json>]'
  ].join('\n');
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const inputPath = flags.input;

  if (!inputPath) {
    throw new Error(usage());
  }

  const resolvedInputPath = path.resolve(inputPath);
  const resolvedOutputPath = path.resolve(
    flags.output ||
      path.join(
        path.dirname(resolvedInputPath),
        `${path.basename(resolvedInputPath, path.extname(resolvedInputPath))}_frozen.json`
      )
  );

  if (!fs.existsSync(resolvedInputPath)) {
    throw new Error(`Missing extraction file: ${resolvedInputPath}`);
  }

  const rawPayload = await fsp.readFile(resolvedInputPath, 'utf8');
  const parsedPayload = parseExternalPhenotypeExtractionPayload(rawPayload);
  const frozen = freezeExternalPhenotypeExtraction(parsedPayload);

  await writeJson(resolvedOutputPath, frozen);
  console.log(`Wrote frozen external extraction: ${resolvedOutputPath}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

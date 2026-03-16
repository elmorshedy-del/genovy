import path from 'path';
import { assertRequiredEnv } from '../config/env.js';
import { withClient } from '../db/pool.js';
import {
  exportGeneDiseaseLinkDataset,
  GENE_DISEASE_LINK_DEFAULTS,
  persistGeneDiseaseLinkDataset
} from '../ml/geneDiseaseLinkDiscovery.js';

const DEFAULT_OUTPUT_DIRECTORY = path.join(process.cwd(), 'output', 'ml', 'gene-disease-link-discovery');

function printHelp() {
  console.log(`
Export a CatBoost-ready gene-disease link dataset from Genovy's canonical graph.

Usage:
  node src/scripts/exportGeneDiseaseLinkDataset.js [--output-dir path] [--max-positives 30000] [--negative-ratio 2] [--candidate-limit 15000] [--seed-phenotypes-per-gene 8] [--candidate-seeds-per-gene 80] [--negative-buffer-multiplier 6]

Environment:
  DATABASE_URL   Postgres connection string for the Genovy knowledge database

Examples:
  NODE_ENV=production DATABASE_URL=... node src/scripts/exportGeneDiseaseLinkDataset.js
  NODE_ENV=production DATABASE_URL=... node src/scripts/exportGeneDiseaseLinkDataset.js --output-dir output/ml/run-01 --max-positives 12000 --negative-ratio 1.5 --seed-phenotypes-per-gene 10 --candidate-seeds-per-gene 50 --negative-buffer-multiplier 8
`.trim());
}

function parseArgs(argv) {
  const flags = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const nextToken = argv[index + 1];
    if (!nextToken || nextToken.startsWith('--')) {
      flags[key] = true;
      continue;
    }

    flags[key] = nextToken;
    index += 1;
  }

  return flags;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));

  if (flags.help) {
    printHelp();
    return;
  }

  assertRequiredEnv({ requireAdminToken: false });

  const outputDirectory = String(flags['output-dir'] || DEFAULT_OUTPUT_DIRECTORY);
  const maxPositiveRows = Number.parseInt(
    String(flags['max-positives'] || GENE_DISEASE_LINK_DEFAULTS.maxPositiveRows),
    10
  );
  const negativeRatio = Number.parseFloat(
    String(flags['negative-ratio'] || GENE_DISEASE_LINK_DEFAULTS.negativeRatio)
  );
  const candidateLimit = Number.parseInt(
    String(flags['candidate-limit'] || GENE_DISEASE_LINK_DEFAULTS.candidateLimit),
    10
  );
  const seedPhenotypeLimitPerGene = Number.parseInt(
    String(flags['seed-phenotypes-per-gene'] || GENE_DISEASE_LINK_DEFAULTS.seedPhenotypeLimitPerGene),
    10
  );
  const candidateSeedLimitPerGene = Number.parseInt(
    String(flags['candidate-seeds-per-gene'] || GENE_DISEASE_LINK_DEFAULTS.candidateSeedLimitPerGene),
    10
  );
  const negativePoolBufferMultiplier = Number.parseInt(
    String(flags['negative-buffer-multiplier'] || GENE_DISEASE_LINK_DEFAULTS.negativePoolBufferMultiplier),
    10
  );

  const exportResult = await withClient((client) =>
    exportGeneDiseaseLinkDataset(client, {
      maxPositiveRows,
      negativeRatio,
      candidateLimit,
      seedPhenotypeLimitPerGene,
      candidateSeedLimitPerGene,
      negativePoolBufferMultiplier
    })
  );

  const persisted = persistGeneDiseaseLinkDataset(outputDirectory, exportResult);

  console.log(
    JSON.stringify(
      {
        outputDirectory,
        files: persisted,
        metadata: exportResult.metadata
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error('[gene-disease-export] failed:', error);
  process.exit(1);
});

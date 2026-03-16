import path from 'path';
import { assertRequiredEnv } from '../config/env.js';
import { withClient } from '../db/pool.js';
import {
  annotateGeneDiseaseNovelty,
  GENE_DISEASE_NOVELTY_DEFAULTS,
  loadRankedGeneDiseaseCandidates,
  persistGeneDiseaseNoveltyAnalysis
} from '../ml/geneDiseaseNovelty.js';

const DEFAULT_INPUT_PATH = path.join(
  process.cwd(),
  'output',
  'ml',
  'gene-disease-link-discovery',
  'model',
  'top_candidate_links.csv'
);

const DEFAULT_OUTPUT_DIRECTORY = path.join(
  process.cwd(),
  'output',
  'ml',
  'gene-disease-link-discovery',
  'novelty'
);

function printHelp() {
  console.log(`
Analyze ranked gene-disease candidates against the current Genovy graph without writing back to the database.

Usage:
  node src/scripts/analyzeGeneDiseaseNovelty.js [--ranked-candidates path] [--output-dir path] [--top-k 250]

Environment:
  DATABASE_URL   Postgres connection string for the Genovy knowledge database

Examples:
  NODE_ENV=production DATABASE_URL=... node src/scripts/analyzeGeneDiseaseNovelty.js
  NODE_ENV=production DATABASE_URL=... node src/scripts/analyzeGeneDiseaseNovelty.js --ranked-candidates output/ml/run-01/model/top_candidate_links.csv --top-k 100
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

  const rankedCandidatesPath = String(flags['ranked-candidates'] || DEFAULT_INPUT_PATH);
  const outputDirectory = String(flags['output-dir'] || DEFAULT_OUTPUT_DIRECTORY);
  const topK = Number.parseInt(String(flags['top-k'] || GENE_DISEASE_NOVELTY_DEFAULTS.topK), 10);

  const rankedCandidates = loadRankedGeneDiseaseCandidates(rankedCandidatesPath);

  const analysisResult = await withClient(async (client) => {
    await client.query('BEGIN READ ONLY');
    try {
      const result = await annotateGeneDiseaseNovelty(client, rankedCandidates, { topK });
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });

  const files = persistGeneDiseaseNoveltyAnalysis(outputDirectory, analysisResult);

  console.log(
    JSON.stringify(
      {
        rankedCandidatesPath,
        outputDirectory,
        files,
        summary: analysisResult.summary
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error('[gene-disease-novelty] failed:', error);
  process.exit(1);
});

import { assertRequiredEnv } from '../config/env.js';
import { withClient } from '../db/pool.js';
import { DX_BENCHMARK_DEFAULTS } from '../constants/dx.js';
import { benchmarkDxSimilarityIndex, loadDxSimilarityIndex } from '../services/dx/similarityEngine.js';

function printHelp() {
  console.log(`
Run a synthetic phenotype-only benchmark against the live Genovy graph.

Usage:
  node src/scripts/benchmarkDxSim.js [--max-cases 250] [--min-disease-phenotypes 5] [--noise-ratio 0.1] [--seed 20260315]

Environment:
  DATABASE_URL   Postgres connection string for the Genovy knowledge database
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

  const benchmark = await withClient(async (client) => {
    const index = await loadDxSimilarityIndex(client, {
      forceRefresh: Boolean(flags.refresh)
    });

    return benchmarkDxSimilarityIndex(index, {
      maxCases: Number.parseInt(String(flags['max-cases'] || DX_BENCHMARK_DEFAULTS.maxCases), 10),
      minDiseasePhenotypeCount: Number.parseInt(
        String(flags['min-disease-phenotypes'] || DX_BENCHMARK_DEFAULTS.minDiseasePhenotypeCount),
        10
      ),
      minQueryPhenotypeCount: Number.parseInt(
        String(flags['min-query-phenotypes'] || DX_BENCHMARK_DEFAULTS.minQueryPhenotypeCount),
        10
      ),
      maxQueryPhenotypeCount: Number.parseInt(
        String(flags['max-query-phenotypes'] || DX_BENCHMARK_DEFAULTS.maxQueryPhenotypeCount),
        10
      ),
      minCoverageRatio: Number.parseFloat(
        String(flags['min-coverage-ratio'] || DX_BENCHMARK_DEFAULTS.minCoverageRatio)
      ),
      maxCoverageRatio: Number.parseFloat(
        String(flags['max-coverage-ratio'] || DX_BENCHMARK_DEFAULTS.maxCoverageRatio)
      ),
      noisePhenotypeRatio: Number.parseFloat(
        String(flags['noise-ratio'] || DX_BENCHMARK_DEFAULTS.noisePhenotypeRatio)
      ),
      seed: Number.parseInt(String(flags.seed || DX_BENCHMARK_DEFAULTS.seed), 10)
    });
  });

  console.log(JSON.stringify(benchmark, null, 2));
}

main().catch((error) => {
  console.error('[dx-benchmark] failed:', error);
  process.exit(1);
});

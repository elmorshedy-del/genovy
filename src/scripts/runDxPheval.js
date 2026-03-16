import fs from 'node:fs/promises';
import path from 'node:path';
import { assertRequiredEnv } from '../config/env.js';
import { DX_PHEVAL_DEFAULTS } from '../constants/dx.js';
import { withClient } from '../db/pool.js';
import {
  extractDxPhenotypeInput,
  extractPhenopacketCaseId,
  extractPhenopacketDiseaseCuries,
  validateDxPhenotypeInput
} from '../lib/phenopackets.js';
import { loadDxSimilarityIndex } from '../services/dx/similarityEngine.js';
import { runDxPhevalCases, serializePhevalDiseaseRowsToTsv } from '../services/dx/phevalRunner.js';

function printHelp() {
  console.log(`
Run Genovy DX against a directory of GA4GH Phenopackets and emit PhEval-style disease result files.

Usage:
  node src/scripts/runDxPheval.js --phenopacket-dir ./phenopackets --output-dir ./output/pheval/genovy-dx [--score-field normalizedScore] [--top-k 0]

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

function sanitizeCaseFilename(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

async function collectPhenopacketFiles(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectPhenopacketFiles(absolutePath)));
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.json')) {
      continue;
    }

    files.push(absolutePath);
  }

  files.sort((left, right) => left.localeCompare(right));
  return files;
}

async function loadPhenopacketCases(phenopacketDir, options = {}) {
  const files = await collectPhenopacketFiles(phenopacketDir);
  const cases = [];
  const skippedCases = [];
  const caseLimit = Number.isInteger(options.caseLimit) && options.caseLimit > 0 ? options.caseLimit : files.length;

  for (const filePath of files.slice(0, caseLimit)) {
    const payload = JSON.parse(await fs.readFile(filePath, 'utf8'));
    const phenopacket = payload?.phenopacket || payload;
    const input = extractDxPhenotypeInput({ phenopacket });
    const validationError = validateDxPhenotypeInput(input);
    if (validationError) {
      skippedCases.push({
        fileName: path.basename(filePath),
        reason: validationError
      });
      continue;
    }

    const fallbackId = path.basename(filePath, path.extname(filePath));
    cases.push({
      filePath,
      fileName: path.basename(filePath),
      caseId: extractPhenopacketCaseId(phenopacket, fallbackId),
      input,
      truthDiseaseCuries: extractPhenopacketDiseaseCuries(phenopacket),
      phenopacket
    });
  }

  return { cases, skippedCases };
}

function buildRunMetadata({
  phenopacketDir,
  outputDir,
  scoreField,
  topK,
  refresh,
  skippedCases,
  summary,
  engineSummary
}) {
  return {
    generatedAt: new Date().toISOString(),
    engine: 'genovy-dx-sim',
    scoreField,
    refresh,
    phenopacketDir,
    outputDir,
    topK,
    skippedCases,
    summary,
    engineSummary
  };
}

function buildYamlManifest(metadata) {
  const recallEntries = Object.entries(metadata.summary.recallAt || {})
    .map(([key, value]) => `  ${key}: ${value}`)
    .join('\n');

  return [
    `generated_at: "${metadata.generatedAt}"`,
    `engine: "${metadata.engine}"`,
    `score_field: "${metadata.scoreField}"`,
    `phenopacket_dir: "${metadata.phenopacketDir}"`,
    `output_dir: "${metadata.outputDir}"`,
    `top_k: ${metadata.topK}`,
    `refresh: ${metadata.refresh ? 'true' : 'false'}`,
    'summary:',
    `  case_count: ${metadata.summary.caseCount}`,
    `  scored_case_count: ${metadata.summary.scoredCaseCount}`,
    `  unscored_case_count: ${metadata.summary.unscoredCaseCount}`,
    `  unresolved_case_count: ${metadata.summary.unresolvedCaseCount}`,
    `  median_rank: ${metadata.summary.medianRank ?? 'null'}`,
    '  recall_at:',
    recallEntries || '    {}',
    'engine_summary:',
    `  disease_count: ${metadata.engineSummary.diseaseCount}`,
    `  phenotype_count: ${metadata.engineSummary.phenotypeCount}`,
    `  source_mode: "${metadata.engineSummary.sourceMode}"`,
    `  generated_at: "${metadata.engineSummary.generatedAt}"`
  ].join('\n');
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.help) {
    printHelp();
    return;
  }

  const phenopacketDir = flags['phenopacket-dir'];
  const outputDir = flags['output-dir'];
  if (!phenopacketDir || !outputDir) {
    throw new Error('Both --phenopacket-dir and --output-dir are required.');
  }

  assertRequiredEnv({ requireAdminToken: false });

  const { cases, skippedCases } = await loadPhenopacketCases(phenopacketDir, {
    caseLimit: Number.parseInt(String(flags['case-limit'] || '0'), 10)
  });

  const scoreField = flags['score-field'] || DX_PHEVAL_DEFAULTS.scoreField;
  const topK = Number.parseInt(String(flags['top-k'] || '0'), 10);
  const refresh = Boolean(flags.refresh);

  const results = await withClient(async (client) => {
    const index = await loadDxSimilarityIndex(client, { forceRefresh: refresh });
    return {
      index,
      run: runDxPhevalCases(index, cases, {
        scoreField,
        resultLimit: Number.isInteger(topK) && topK > 0 ? topK : index.totalDiseases
      })
    };
  });

  const rawResultsDir = path.join(outputDir, DX_PHEVAL_DEFAULTS.rawResultsDirname);
  const diseaseResultsDir = path.join(outputDir, DX_PHEVAL_DEFAULTS.diseaseResultsDirname);
  const toolInputCommandsDir = path.join(outputDir, DX_PHEVAL_DEFAULTS.toolInputCommandsDirname);

  await fs.mkdir(rawResultsDir, { recursive: true });
  await fs.mkdir(diseaseResultsDir, { recursive: true });
  await fs.mkdir(toolInputCommandsDir, { recursive: true });

  for (const caseReport of results.run.caseReports) {
    const safeCaseId = sanitizeCaseFilename(caseReport.caseId || path.basename(caseReport.fileName, '.json'));

    const rawPayload = {
      generatedAt: new Date().toISOString(),
      caseId: caseReport.caseId,
      fileName: caseReport.fileName,
      filePath: caseReport.filePath,
      input: caseReport.input,
      truthDiseaseCuries: caseReport.truthDiseaseCuries,
      ranking: caseReport.ranking,
      evaluation: caseReport.evaluation
    };

    await fs.writeFile(
      path.join(rawResultsDir, `${safeCaseId}.json`),
      `${JSON.stringify(rawPayload, null, 2)}\n`
    );
    await fs.writeFile(
      path.join(diseaseResultsDir, `${safeCaseId}-disease_result.tsv`),
      serializePhevalDiseaseRowsToTsv(caseReport.diseaseRows)
    );
  }

  const metadata = buildRunMetadata({
    phenopacketDir,
    outputDir,
    scoreField: results.run.scoreField,
    topK: Number.isInteger(topK) && topK > 0 ? topK : results.index.totalDiseases,
    refresh,
    skippedCases,
    summary: results.run.summary,
    engineSummary: {
      diseaseCount: results.index.totalDiseases,
      phenotypeCount: results.index.phenotypeCount,
      sourceMode: results.index.sourceMode,
      generatedAt: results.index.generatedAt
    }
  });

  await fs.writeFile(path.join(outputDir, 'run_summary.json'), `${JSON.stringify(metadata, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'pheval_run_manifest.yaml'), `${buildYamlManifest(metadata)}\n`);
  await fs.writeFile(
    path.join(toolInputCommandsDir, 'tool_input_commands.txt'),
    `${['node', 'src/scripts/runDxPheval.js', ...process.argv.slice(2)].join(' ')}\n`
  );

  console.log(JSON.stringify(metadata, null, 2));
}

main().catch((error) => {
  console.error('[dx-pheval] failed:', error);
  process.exit(1);
});

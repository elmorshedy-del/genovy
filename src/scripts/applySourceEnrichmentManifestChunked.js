import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const DEFAULTS = Object.freeze({
  manifestJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-manifest-structured-global-20260329.json',
  logJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-apply-log-structured-global-20260329.json',
  chunkSize: 5000
});

const APPLY_SCRIPT_PATH =
  '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/applySourceEnrichmentManifest.js';
const REPO_CWD = '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914';

function parseArgs(argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      flags[key] = true;
    } else {
      flags[key] = next;
      index += 1;
    }
  }
  return flags;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function buildChunkManifest(manifestMeta, entries, index, start, end) {
  return {
    ...manifestMeta,
    chunkIndex: index,
    chunkStart: start,
    chunkEnd: end,
    entryCount: entries.length,
    entries
  };
}

async function loadManifestMeta(manifestPath) {
  const { stdout } = await execFileAsync('jq', ['-c', 'del(.entries)', manifestPath], {
    maxBuffer: 1024 * 1024 * 32
  });
  return JSON.parse(stdout);
}

async function *streamManifestEntries(manifestPath) {
  const child = spawn('jq', ['-c', '.entries[]', manifestPath], {
    cwd: REPO_CWD,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  const rl = readline.createInterface({
    input: child.stdout,
    crlfDelay: Infinity
  });

  try {
    for await (const line of rl) {
      if (!line) continue;
      yield JSON.parse(line);
    }
  } finally {
    rl.close();
  }

  const exitCode = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', resolve);
  });

  if (exitCode !== 0) {
    throw new Error(`jq failed while streaming manifest entries: ${stderr.trim() || `exit ${exitCode}`}`);
  }
}

async function applyChunk(chunkManifestPath, chunkLogPath) {
  await execFileAsync(process.execPath, [APPLY_SCRIPT_PATH, '--manifest', chunkManifestPath, '--log', chunkLogPath], {
    cwd: REPO_CWD,
    env: process.env,
    maxBuffer: 1024 * 1024 * 32
  });
  return JSON.parse(await fs.readFile(chunkLogPath, 'utf8'));
}

function mergeSourceSummary(sourceSummaryByKey, summary) {
  const current = sourceSummaryByKey.get(summary.sourceKey) || {
    sourceKey: summary.sourceKey,
    manifestEntries: 0,
    sourceRecords: 0,
    relationships: 0,
    evidenceRows: 0,
    clinicalAssertions: 0
  };
  current.manifestEntries += summary.manifestEntries || 0;
  current.sourceRecords += summary.sourceRecords || 0;
  current.relationships += summary.relationships || 0;
  current.evidenceRows += summary.evidenceRows || 0;
  current.clinicalAssertions += summary.clinicalAssertions || 0;
  sourceSummaryByKey.set(summary.sourceKey, current);
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const manifestPath = flags.manifest || DEFAULTS.manifestJson;
  const logPath = flags.log || DEFAULTS.logJson;
  const chunkSize = Math.max(1, Number.parseInt(String(flags['chunk-size'] || DEFAULTS.chunkSize), 10) || DEFAULTS.chunkSize);
  const manifestMeta = await loadManifestMeta(manifestPath);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'genovy-source-enrichment-apply-'));

  const chunkLogs = [];
  const sourceSummaryByKey = new Map();
  let applied = 0;
  let chunkCount = 0;
  let totalEntries = 0;
  let chunkEntries = [];

  async function flushChunk() {
    if (!chunkEntries.length) return;
    chunkCount += 1;
    const chunkManifestPath = path.join(tempDir, `manifest-${chunkCount}.json`);
    const chunkLogPath = path.join(tempDir, `apply-log-${chunkCount}.json`);
    const chunkStart = totalEntries - chunkEntries.length;
    const chunkEnd = totalEntries;

    await fs.writeFile(
      chunkManifestPath,
      `${JSON.stringify(buildChunkManifest(manifestMeta, chunkEntries, chunkCount, chunkStart, chunkEnd), null, 2)}\n`
    );

    const chunkResult = await applyChunk(chunkManifestPath, chunkLogPath);
    applied += chunkResult.applied || 0;
    chunkLogs.push({
      chunkIndex: chunkCount,
      chunkManifestPath,
      chunkLogPath,
      entryCount: chunkEntries.length,
      applied: chunkResult.applied || 0
    });
    for (const summary of chunkResult.sourceSummaries || []) {
      mergeSourceSummary(sourceSummaryByKey, summary);
    }
    chunkEntries = [];
  }

  try {
    for await (const entry of streamManifestEntries(manifestPath)) {
      chunkEntries.push(entry);
      totalEntries += 1;
      if (chunkEntries.length >= chunkSize) {
        await flushChunk();
      }
    }
    await flushChunk();

    const result = {
      manifestPath,
      logPath,
      chunkSize,
      chunkCount,
      totalEntries,
      applied,
      sourceSummaries: [...sourceSummaryByKey.values()].sort((left, right) =>
        left.sourceKey.localeCompare(right.sourceKey)
      ),
      chunkLogs
    };

    await ensureDir(path.dirname(logPath));
    await fs.writeFile(logPath, `${JSON.stringify(result, null, 2)}\n`);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error('[apply-source-enrichment-manifest-chunked] failed:', error);
  process.exit(1);
});

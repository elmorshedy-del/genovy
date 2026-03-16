import fs from 'node:fs/promises';
import path from 'node:path';
import { DX_PHEVAL_DEFAULTS } from '../constants/dx.js';
import {
  extractPhenopacketCaseId,
  extractPhenopacketDiseaseCuries,
  validateDxPhenotypeInput,
  extractDxPhenotypeInput
} from '../lib/phenopackets.js';
import { summarizeDxPhevalEvaluations } from '../services/dx/phevalRunner.js';

function printHelp() {
  console.log(`
Benchmark a running Genovy DX API against a directory of Phenopackets.

Usage:
  node src/scripts/benchmarkDxPhenopackets.js --phenopacket-dir ./phenopackets [--base-url https://genovy-production.up.railway.app] [--case-limit 100] [--request-timeout-ms 15000]
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

async function collectPhenopacketFiles(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectPhenopacketFiles(absolutePath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(absolutePath);
    }
  }

  files.sort((left, right) => left.localeCompare(right));
  return files;
}

async function resolveEquivalentDiseaseCuries(baseUrl, curie, requestTimeoutMs, cache) {
  if (cache.has(curie)) {
    return cache.get(curie);
  }

  let resolved = [curie];

  try {
    const response = await fetch(`${baseUrl}/api/knowledge/entities/${encodeURIComponent(curie)}`, {
      signal: AbortSignal.timeout(requestTimeoutMs)
    });

    if (response.ok) {
      const payload = await response.json();
      const detail = payload?.detail;
      const expanded = new Set([curie]);
      if (detail?.entity?.canonical_curie) {
        expanded.add(detail.entity.canonical_curie);
      }
      for (const xref of detail?.xrefs || []) {
        if (xref?.xref_curie) {
          expanded.add(xref.xref_curie);
        }
      }
      resolved = [...expanded];
    }
  } catch {
    resolved = [curie];
  }

  cache.set(curie, resolved);
  return resolved;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.help) {
    printHelp();
    return;
  }

  const phenopacketDir = flags['phenopacket-dir'];
  if (!phenopacketDir) {
    throw new Error('--phenopacket-dir is required.');
  }

  const baseUrl = String(flags['base-url'] || 'https://genovy-production.up.railway.app').replace(/\/$/, '');
  const caseLimit = Number.parseInt(String(flags['case-limit'] || '0'), 10);
  const topK = Number.parseInt(String(flags['top-k'] || '25'), 10);
  const requestTimeoutMs = Number.parseInt(String(flags['request-timeout-ms'] || '15000'), 10);
  const files = await collectPhenopacketFiles(phenopacketDir);
  const selectedFiles = Number.isInteger(caseLimit) && caseLimit > 0 ? files.slice(0, caseLimit) : files;

  const evaluations = [];
  const skippedCases = [];
  const truthCurieCache = new Map();

  for (const filePath of selectedFiles) {
    const payload = JSON.parse(await fs.readFile(filePath, 'utf8'));
    const phenopacket = payload?.phenopacket || payload;
    const input = extractDxPhenotypeInput({ phenopacket });
    const validationError = validateDxPhenotypeInput(input);
    if (validationError) {
      skippedCases.push({ fileName: path.basename(filePath), reason: validationError });
      continue;
    }

    let response;
    try {
      response = await fetch(`${baseUrl}/api/dx/rank`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phenopacket,
          limit: topK
        }),
        signal: AbortSignal.timeout(requestTimeoutMs)
      });
    } catch (error) {
      skippedCases.push({
        fileName: path.basename(filePath),
        reason: error?.name === 'TimeoutError' ? `Timeout after ${requestTimeoutMs}ms` : error.message
      });
      continue;
    }

    if (!response.ok) {
      skippedCases.push({
        fileName: path.basename(filePath),
        reason: `HTTP ${response.status}`
      });
      continue;
    }

    const rankingPayload = await response.json();
    const truthDiseaseCuries = extractPhenopacketDiseaseCuries(phenopacket);
    const resolvedTruthDiseaseCuries = [
      ...new Set(
        (
          await Promise.all(
            truthDiseaseCuries.map((curie) =>
              resolveEquivalentDiseaseCuries(baseUrl, curie, requestTimeoutMs, truthCurieCache)
            )
          )
        ).flat()
      )
    ];
    const truthSet = new Set(resolvedTruthDiseaseCuries);
    const rankingResults = rankingPayload?.ranking?.results || [];
    const rankedMatch = rankingResults.find((result) => truthSet.has(result.diseaseCurie));

    evaluations.push({
      caseId: extractPhenopacketCaseId(phenopacket, path.basename(filePath, '.json')),
      fileName: path.basename(filePath),
      truthDiseaseCuries,
      resolvedTruthDiseaseCuries,
      rank: rankedMatch?.rank || null
    });
  }

  const summary = summarizeDxPhevalEvaluations(evaluations, {
    recallCutoffs: DX_PHEVAL_DEFAULTS.recallCutoffs
  });

  console.log(
    JSON.stringify(
      {
        baseUrl,
        phenopacketDir,
        topK,
        requestTimeoutMs,
        skippedCases,
        ...summary
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error('[dx-phenopacket-benchmark] failed:', error);
  process.exit(1);
});

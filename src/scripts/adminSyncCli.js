import { BOOTSTRAP_SOURCE_ORDER, SOURCE_CATALOG, SOURCE_KEYS } from '../constants/sourceCatalog.js';
import { filterBootstrapSourceKeys, shouldSkipCompletedSources } from '../lib/bootstrapSources.js';

const CLI_DEFAULTS = Object.freeze({
  baseUrl: process.env.GENOVY_BASE_URL || `http://127.0.0.1:${process.env.PORT || '3100'}`,
  pollIntervalMs: Number(process.env.GENOVY_SYNC_POLL_MS || 5000),
  sourceWaitTimeoutMs: Number(process.env.GENOVY_SYNC_TIMEOUT_MS || 45 * 60 * 1000)
});

function printHelp() {
  console.log(`
Genovy admin sync operator

Usage:
  npm run ops:admin -- sources
  npm run ops:admin -- summary
  npm run ops:admin -- canonical-summary
  npm run ops:admin -- canonicalize
  npm run ops:admin -- sync-source <sourceKey> [--wait] [--body '{"conditionQuery":"rare disease"}']
  npm run ops:admin -- sync-run <syncRunId>
  npm run ops:admin -- bootstrap [--wait] [--include-completed] [--trials-query "rare disease"] [--trials-query "genetic disease"]

Environment:
  GENOVY_BASE_URL       Base URL of the Genovy app
  GENOVY_ADMIN_TOKEN    Admin token for protected endpoints
  GENOVY_SYNC_POLL_MS   Poll interval for waiting commands
  GENOVY_SYNC_TIMEOUT_MS Timeout for waiting commands
`.trim());
}

function parseArgs(argv) {
  const positionals = [];
  const flags = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }

    const raw = token.slice(2);
    const separatorIndex = raw.indexOf('=');
    if (separatorIndex >= 0) {
      const key = raw.slice(0, separatorIndex);
      const value = raw.slice(separatorIndex + 1);
      flags[key] = flags[key] ? [].concat(flags[key], value) : value;
      continue;
    }

    const nextToken = argv[index + 1];
    if (!nextToken || nextToken.startsWith('--')) {
      flags[raw] = true;
      continue;
    }

    flags[raw] = flags[raw] ? [].concat(flags[raw], nextToken) : nextToken;
    index += 1;
  }

  return {
    command: positionals[0] || '',
    args: positionals.slice(1),
    flags
  };
}

function readAdminToken() {
  return process.env.GENOVY_ADMIN_TOKEN || process.env.RARE_DISEASE_ADMIN_TOKEN || '';
}

function buildUrl(pathname) {
  return new URL(pathname, `${CLI_DEFAULTS.baseUrl}/`).toString();
}

async function requestJson(pathname, { method = 'GET', body = null, authRequired = false } = {}) {
  const headers = {
    accept: 'application/json'
  };
  if (body != null) {
    headers['content-type'] = 'application/json';
  }
  if (authRequired) {
    const adminToken = readAdminToken();
    if (!adminToken) {
      throw new Error('Missing GENOVY_ADMIN_TOKEN or RARE_DISEASE_ADMIN_TOKEN.');
    }
    headers['x-admin-token'] = adminToken;
  }

  const response = await fetch(buildUrl(pathname), {
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }
  return payload;
}

function parseJsonBody(rawValue) {
  if (!rawValue) return {};
  try {
    return JSON.parse(rawValue);
  } catch (error) {
    throw new Error(`Invalid JSON body: ${error.message}`);
  }
}

async function waitForSyncRun(syncRunId) {
  const deadline = Date.now() + CLI_DEFAULTS.sourceWaitTimeoutMs;

  while (Date.now() <= deadline) {
    const payload = await requestJson(`/api/admin/sync-runs/${syncRunId}`, { authRequired: true });
    const run = payload.run;
    if (run.status !== 'running') {
      return run;
    }
    console.log(`[ops] sync run ${syncRunId} still running for ${run.source_key}`);
    await new Promise((resolve) => setTimeout(resolve, CLI_DEFAULTS.pollIntervalMs));
  }

  throw new Error(`Timed out waiting for sync run ${syncRunId}.`);
}

async function runSyncSource(sourceKey, flags) {
  if (!SOURCE_CATALOG[sourceKey]) {
    throw new Error(`Unknown source key: ${sourceKey}`);
  }

  const body = parseJsonBody(flags.body || '');
  const payload = await requestJson(`/api/admin/sources/${sourceKey}/sync/async`, {
    method: 'POST',
    body,
    authRequired: true
  });

  console.log(JSON.stringify(payload.result, null, 2));

  if (!flags.wait) {
    return payload.result;
  }

  const run = await waitForSyncRun(payload.result.syncRunId);
  console.log(JSON.stringify(run, null, 2));
  return run;
}

function collectTrialsQueries(flags) {
  const value = flags['trials-query'];
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function buildClinicalTrialsBody(flags, conditionQuery) {
  const body = {
    conditionQuery
  };

  if (flags['max-pages']) {
    body.maxPages = Number(flags['max-pages']);
  }
  if (flags['page-size']) {
    body.pageSize = Number(flags['page-size']);
  }

  return body;
}

async function runBootstrap(flags) {
  const results = [];
  const queuedSources = await requestJson('/api/admin/sources', { authRequired: true });
  const successfulSourceKeys = (queuedSources.sources || [])
    .filter((source) => source.last_successful_at)
    .map((source) => source.source_key);
  const sourceOrder = filterBootstrapSourceKeys(BOOTSTRAP_SOURCE_ORDER, successfulSourceKeys, {
    skipCompletedSources: shouldSkipCompletedSources(flags),
    includeCompletedSources: Boolean(flags['include-completed'])
  });
  const sourceOrderSet = new Set(sourceOrder);

  for (const sourceKey of BOOTSTRAP_SOURCE_ORDER) {
    if (!sourceOrderSet.has(sourceKey)) {
      console.log(`[ops] skipping ${sourceKey} because it already has a successful sync`);
      continue;
    }
    console.log(`[ops] queueing ${sourceKey}`);
    const result = await runSyncSource(sourceKey, { ...flags, body: '{}' });
    results.push(result);
  }

  const clinicalTrialsQueries = collectTrialsQueries(flags);
  for (const conditionQuery of clinicalTrialsQueries) {
    console.log(`[ops] queueing ${SOURCE_KEYS.CLINICAL_TRIALS} for "${conditionQuery}"`);
    const result = await requestJson(`/api/admin/sources/${SOURCE_KEYS.CLINICAL_TRIALS}/sync/async`, {
      method: 'POST',
      body: buildClinicalTrialsBody(flags, conditionQuery),
      authRequired: true
    });

    console.log(JSON.stringify(result.result, null, 2));
    if (flags.wait) {
      const run = await waitForSyncRun(result.result.syncRunId);
      console.log(JSON.stringify(run, null, 2));
      results.push(run);
    } else {
      results.push(result.result);
    }
  }

  const summary = await requestJson('/api/knowledge/summary');
  console.log(JSON.stringify(summary.summary, null, 2));
  return results;
}

async function runCanonicalize(flags) {
  const payload = await requestJson('/api/admin/canonical/rebuild', {
    method: 'POST',
    body: parseJsonBody(flags.body || ''),
    authRequired: true
  });
  console.log(JSON.stringify(payload.result, null, 2));
  return payload.result;
}

async function main() {
  const { command, args, flags } = parseArgs(process.argv.slice(2));

  if (!command || command === 'help') {
    printHelp();
    return;
  }

  if (command === 'sources') {
    const payload = await requestJson('/api/admin/sources', { authRequired: true });
    console.log(JSON.stringify(payload.sources, null, 2));
    return;
  }

  if (command === 'summary') {
    const payload = await requestJson('/api/knowledge/summary');
    console.log(JSON.stringify(payload.summary, null, 2));
    return;
  }

  if (command === 'canonical-summary') {
    const payload = await requestJson('/api/knowledge/canonical/summary');
    console.log(JSON.stringify(payload.summary, null, 2));
    return;
  }

  if (command === 'sync-run') {
    const syncRunId = args[0];
    if (!syncRunId) {
      throw new Error('sync-run requires a syncRunId argument.');
    }
    const payload = await requestJson(`/api/admin/sync-runs/${syncRunId}`, { authRequired: true });
    console.log(JSON.stringify(payload.run, null, 2));
    return;
  }

  if (command === 'sync-source') {
    const sourceKey = args[0];
    if (!sourceKey) {
      throw new Error('sync-source requires a sourceKey argument.');
    }
    await runSyncSource(sourceKey, flags);
    return;
  }

  if (command === 'bootstrap') {
    await runBootstrap(flags);
    return;
  }

  if (command === 'canonicalize') {
    await runCanonicalize(flags);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(`[ops] ${error.message || String(error)}`);
  process.exit(1);
});

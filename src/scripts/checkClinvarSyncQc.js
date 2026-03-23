import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const execFileAsync = promisify(execFile);

const CLINVAR_SOURCE_KEY = 'clinvar_variant_summary';
const U2AF2_ACCEPTED_ROW_LOWER_BOUND = 1_119_619;
const STALL_WARNING_MINUTES = 20;
const PROJECT_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const DEFAULT_STATE_PATH = path.join(PROJECT_ROOT, 'output', 'ops', 'clinvar-sync-qc-state.json');
const PROCESS_PATTERN =
  'syncSource\\(SOURCE_KEYS\\.CLINVAR_VARIANT_SUMMARY|variant_summary\\.txt\\.gz|clinvar_variant_summary';

function parseArgs(argv) {
  return {
    json: argv.includes('--json'),
    noState: argv.includes('--no-state'),
    statePath: resolveFlagValue(argv, '--state-path') || DEFAULT_STATE_PATH
  };
}

function resolveFlagValue(argv, flag) {
  const index = argv.indexOf(flag);
  if (index === -1 || index === argv.length - 1) {
    return '';
  }
  return argv[index + 1];
}

async function readPreviousState(statePath) {
  try {
    const raw = await fs.readFile(statePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeState(statePath, state) {
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(statePath, JSON.stringify(state, null, 2));
}

async function queryLatestClinVarRuns(client) {
  const result = await client.query(
    `
      select sync_run_id, status, started_at, completed_at, source_version, error_message, summary_json
      from sync_runs
      where source_key = $1
      order by sync_run_id desc
      limit 2
    `,
    [CLINVAR_SOURCE_KEY]
  );
  return result.rows;
}

async function detectClinVarProcess() {
  try {
    const { stdout } = await execFileAsync('pgrep', ['-af', PROCESS_PATTERN]);
    const lines = String(stdout || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    return {
      active: lines.length > 0,
      matches: lines
    };
  } catch (error) {
    if (error.code === 1) {
      return {
        active: false,
        matches: []
      };
    }
    return {
      active: false,
      matches: [],
      error: error.message || String(error)
    };
  }
}

function toNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildSnapshot(run, processInfo, previousState) {
  const summary = run?.summary_json || {};
  const checkedAt = new Date().toISOString();
  const variantRowsProcessed = toNumber(summary.variantRowsProcessed);
  const batchesApplied = toNumber(summary.batchesApplied);
  const relationships = toNumber(summary.relationships);
  const clinicalVariantDiseaseAssertions = toNumber(summary.clinicalVariantDiseaseAssertions);

  const prevCheckedAt = previousState?.checkedAt ? Date.parse(previousState.checkedAt) : NaN;
  const currentCheckedAt = Date.parse(checkedAt);
  const minutesSincePrevious = Number.isFinite(prevCheckedAt)
    ? Math.max(0, (currentCheckedAt - prevCheckedAt) / 60000)
    : null;

  const sameRun = previousState?.syncRunId === run?.sync_run_id;
  const deltaVariantRows = sameRun ? variantRowsProcessed - toNumber(previousState?.variantRowsProcessed) : null;
  const deltaBatches = sameRun ? batchesApplied - toNumber(previousState?.batchesApplied) : null;
  const advancedSincePrevious = sameRun
    ? deltaVariantRows > 0 || deltaBatches > 0 || relationships > toNumber(previousState?.relationships)
    : Boolean(run);

  const roughPercentCompleteLowerBound = variantRowsProcessed
    ? Math.min(100, (variantRowsProcessed / U2AF2_ACCEPTED_ROW_LOWER_BOUND) * 100)
    : 0;
  const roughPercentLeftLowerBound = Math.max(0, 100 - roughPercentCompleteLowerBound);

  const progressStatus = summary.progressStatus || run?.status || 'unknown';
  const dbActive = run?.status === 'running';
  const runnerSignal = processInfo.active ? 'os_detected' : dbActive ? 'db_running' : 'inactive';
  const possibleStall =
    dbActive &&
    sameRun &&
    minutesSincePrevious != null &&
    minutesSincePrevious >= STALL_WARNING_MINUTES &&
    !advancedSincePrevious;

  return {
    checkedAt,
    syncRunId: run?.sync_run_id || null,
    status: run?.status || 'missing',
    startedAt: run?.started_at || null,
    completedAt: run?.completed_at || null,
    sourceVersion: run?.source_version || summary.sourceVersion || '',
    errorMessage: run?.error_message || '',
    progressStatus,
    dbActive,
    processActive: processInfo.active,
    runnerSignal,
    processMatches: processInfo.matches,
    processError: processInfo.error || '',
    batchesApplied,
    variantRowsProcessed,
    relationships,
    clinicalVariantDiseaseAssertions,
    roughPercentCompleteLowerBound: Number(roughPercentCompleteLowerBound.toFixed(1)),
    roughPercentLeftLowerBound: Number(roughPercentLeftLowerBound.toFixed(1)),
    advancedSincePrevious,
    deltaVariantRows,
    deltaBatches,
    minutesSincePrevious,
    possibleStall,
    previousRun: previousState?.syncRunId && previousState.syncRunId !== run?.sync_run_id
      ? {
          syncRunId: previousState.syncRunId,
          status: previousState.status
        }
      : null
  };
}

function buildHumanSummary(snapshot, previousRun) {
  const parts = [
    `sync_run_id=${snapshot.syncRunId ?? 'none'}`,
    `status=${snapshot.status}`,
    `progress=${snapshot.progressStatus}`,
    `runner=${snapshot.runnerSignal}`,
    `batches=${snapshot.batchesApplied}`,
    `rows=${snapshot.variantRowsProcessed}`,
    `relationships=${snapshot.relationships}`,
    `clinicalVariantDiseaseAssertions=${snapshot.clinicalVariantDiseaseAssertions}`,
    `rough_complete_lb=${snapshot.roughPercentCompleteLowerBound}%`,
    `rough_left_lb=${snapshot.roughPercentLeftLowerBound}%`
  ];

  if (snapshot.errorMessage) {
    parts.push(`error=${snapshot.errorMessage}`);
  }
  if (snapshot.advancedSincePrevious === true && snapshot.deltaVariantRows != null) {
    parts.push(`delta_rows=${snapshot.deltaVariantRows}`);
  }
  if (snapshot.possibleStall) {
    parts.push('stall_warning=true');
  }
  if (previousRun) {
    parts.push(`previous_run=${previousRun.sync_run_id}:${previousRun.status}`);
  }

  return parts.join(' | ');
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const args = parseArgs(process.argv.slice(2));
  const previousState = args.noState ? null : await readPreviousState(args.statePath);
  const processInfo = await detectClinVarProcess();

  const db = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await db.connect();

  try {
    const [currentRun, previousRun] = await queryLatestClinVarRuns(db);
    const snapshot = buildSnapshot(currentRun, processInfo, previousState);
    const output = {
      snapshot,
      previousRun: previousRun || null,
      humanSummary: buildHumanSummary(snapshot, previousRun || null)
    };

    if (!args.noState) {
      await writeState(args.statePath, snapshot);
    }

    if (args.json) {
      console.log(JSON.stringify(output, null, 2));
      return;
    }

    console.log(output.humanSummary);
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exitCode = 1;
});

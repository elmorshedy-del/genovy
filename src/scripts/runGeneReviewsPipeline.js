import { spawn } from 'node:child_process';
import path from 'node:path';
import {
  getGeneReviewsPipelineProfile,
  listGeneReviewsPipelineProfiles,
  resolvePolicyJsonForProfile,
  resolveStageArgs
} from '../lib/genereviewsPipelineProfiles.js';
import { parseArgs } from '../lib/genereviewsPipeline.js';

const MEDGEMMA_PREWARM_DEFAULTS = Object.freeze({
  endpointName: 'medgemma-27b-text-it-hgw',
  endpointOwner: 'elmorshedyahmed'
});

function printUsage() {
  console.log(`Usage:
  node src/scripts/runGeneReviewsPipeline.js --list
  node src/scripts/runGeneReviewsPipeline.js --profile <name> [--stage <stage[,stage2]>] [--dryRun]

Flags:
  --list            Show known profiles
  --profile         Named pipeline profile to run
  --stage           One stage or a comma-separated list. Default: profile defaultStages
  --dryRun          Print commands without executing them
  --start           Override --start for all executed stages
  --limit           Override --limit for all executed stages
  --noResume        Pass through to executed stages

Examples:
  node src/scripts/runGeneReviewsPipeline.js --list
  node src/scripts/runGeneReviewsPipeline.js --profile latest5-settled-20260330 --dryRun
  node src/scripts/runGeneReviewsPipeline.js --profile latest5-gemini-20260330 --dryRun
  node src/scripts/runGeneReviewsPipeline.js --profile autoaccept-batch1-20-20260330 --stage fetch,anchors
`);
}

function cliArgsFromObject(args) {
  const entries = [];
  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || value === null || value === false || value === '') continue;
    entries.push(`--${key}`);
    if (value !== true) entries.push(String(value));
  }
  return entries;
}

async function runCommand({ command, script, args, dryRun }) {
  const cliArgs = [script, ...cliArgsFromObject(args)];
  const pretty = [command, ...cliArgs].join(' ');
  console.log(pretty);
  if (dryRun) return;

  await new Promise((resolve, reject) => {
    const child = spawn(command, cliArgs, {
      stdio: 'inherit',
      env: process.env
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(script)} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

function resolveEnvValue(...names) {
  for (const name of names) {
    if (!name) continue;
    if (process.env[name]) return process.env[name];
  }
  return '';
}

async function prewarmMedGemmaEndpoint({ dryRun }) {
  const endpointName = resolveEnvValue('MEDGEMMA_ENDPOINT_NAME') || MEDGEMMA_PREWARM_DEFAULTS.endpointName;
  const endpointOwner = resolveEnvValue('MEDGEMMA_ENDPOINT_OWNER') || MEDGEMMA_PREWARM_DEFAULTS.endpointOwner;
  const apiKey = resolveEnvValue('MEDGEMMA_API_KEY', 'HUGGINGFACE_API_KEY');
  if (!endpointName || !endpointOwner || !apiKey) {
    console.warn('[runGeneReviewsPipeline] skipping MedGemma prewarm because endpoint or API key env is missing');
    return;
  }
  const requestUrl = `https://api.endpoints.huggingface.co/v2/endpoint/${endpointOwner}/${endpointName}/resume`;
  const pretty = `POST ${requestUrl}`;
  console.log(`[runGeneReviewsPipeline] prewarm ${pretty}`);
  if (dryRun) return;
  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });
  if (!response.ok) {
    const body = await response.text();
    if (response.status === 400 && /already running/i.test(body)) {
      console.log('[runGeneReviewsPipeline] MedGemma endpoint already running');
      return;
    }
    throw new Error(`MedGemma prewarm failed: ${response.status} ${body}`);
  }
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.list) {
    console.log(JSON.stringify(listGeneReviewsPipelineProfiles(), null, 2));
    return;
  }

  const profileName = String(flags.profile || '').trim();
  if (!profileName) {
    printUsage();
    throw new Error('--profile is required unless --list is used.');
  }

  const profile = getGeneReviewsPipelineProfile(profileName);
  const policyJson = await resolvePolicyJsonForProfile(profile);
  const selectedStages = String(flags.stage || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const stages = selectedStages.length ? selectedStages : profile.defaultStages;
  const dryRun = Boolean(flags.dryRun);
  const commonOverrides = {
    start: flags.start,
    limit: flags.limit,
    noResume: flags.noResume ? true : undefined
  };

  console.log(
    JSON.stringify(
      {
        profile: profileName,
        description: profile.description,
        policyJson,
        stages
      },
      null,
      2
    )
  );

  if (stages.includes('metadata-medgemma')) {
    await prewarmMedGemmaEndpoint({ dryRun });
  }

  for (const stageName of stages) {
    const stageConfig = profile.stages[stageName];
    if (!stageConfig) {
      throw new Error(`Profile "${profileName}" does not define stage "${stageName}".`);
    }
    const args = resolveStageArgs(stageConfig, policyJson, commonOverrides);
    await runCommand({
      command: stageConfig.command || 'node',
      script: stageConfig.script,
      args,
      dryRun
    });
  }
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});

import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs, ensureDir, writeJson } from '../lib/genereviewsPipeline.js';

const API_BASE_URL = 'https://api.anthropic.com/v1';
const ANTHROPIC_VERSION = '2023-06-01';
const FILES_BETA = 'files-api-2025-04-14';
const MANAGED_AGENTS_BETA = 'managed-agents-2026-04-01';

const DEFAULTS = Object.freeze({
  briefFile:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/anthropic-opus-audit-brief-v1-20260410.md',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/anthropic-managed-audit-runs'
});

function fail(message) {
  throw new Error(message);
}

function toAbsolute(value) {
  const text = String(value || '').trim();
  return text ? path.resolve(text) : '';
}

function inferMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.json') return 'application/json';
  if (extension === '.md') return 'text/markdown';
  if (extension === '.txt') return 'text/plain';
  return 'application/octet-stream';
}

async function assertReadable(filePath) {
  try {
    await fs.access(filePath);
  } catch {
    fail(`File not found or unreadable: ${filePath}`);
  }
}

async function inferAuditFiles(chapterFolder, briefFile) {
  const folder = toAbsolute(chapterFolder);
  if (!folder) fail('Pass --chapterFolder /abs/path/to/next-chapter-...');
  const entries = await fs.readdir(folder);

  const recoveredClinicalStructure = entries
    .filter((entry) => entry.endsWith('_recovered_clinical_structure.json'))
    .sort()[0];
  if (!recoveredClinicalStructure) {
    fail(`Could not find *_recovered_clinical_structure.json in ${folder}`);
  }

  const chapterCandidates = entries
    .filter((entry) => entry.endsWith('.json'))
    .filter((entry) => entry.includes('_regime_ready_'))
    .filter((entry) => !entry.includes('_clinical_structure'))
    .sort((left, right) => {
      const leftReviewed = left.includes('-opus4.6-reviewed');
      const rightReviewed = right.includes('-opus4.6-reviewed');
      if (leftReviewed !== rightReviewed) return rightReviewed - leftReviewed;
      return right.localeCompare(left);
    });
  const chapterFile = chapterCandidates[0];
  if (!chapterFile) {
    fail(`Could not find *_regime_ready_*.json in ${folder}`);
  }

  const readme = entries.includes('README.md') ? path.join(folder, 'README.md') : null;

  return {
    chapterFile: path.join(folder, chapterFile),
    sourceFile: path.join(folder, recoveredClinicalStructure),
    briefFile: toAbsolute(briefFile),
    readmeFile: readme
  };
}

function buildMountPath(filePath) {
  return `/workspace/${path.basename(filePath)}`;
}

async function uploadFile(apiKey, filePath) {
  const bytes = await fs.readFile(filePath);
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: inferMimeType(filePath) }), path.basename(filePath));

  const response = await fetch(`${API_BASE_URL}/files`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-beta': FILES_BETA
    },
    body: form
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    fail(`Files API upload failed for ${filePath}: ${response.status} ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function createSession(apiKey, { agentId, environmentId, resources }) {
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-beta': MANAGED_AGENTS_BETA,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      agent: agentId,
      environment_id: environmentId,
      resources
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    fail(`Session creation failed: ${response.status} ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function sendUserMessage(apiKey, sessionId, text) {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/events`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-beta': MANAGED_AGENTS_BETA,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      events: [
        {
          type: 'user.message',
          content: [{ type: 'text', text }]
        }
      ]
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    fail(`Sending user.message failed: ${response.status} ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function streamSessionUntilIdle(apiKey, sessionId) {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/stream?beta=true`, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-beta': MANAGED_AGENTS_BETA,
      Accept: 'text/event-stream'
    }
  });

  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => ({}));
    fail(`Opening session stream failed: ${response.status} ${JSON.stringify(payload)}`);
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = '';
  const events = [];
  const agentTextChunks = [];

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const splitIndex = buffer.indexOf('\n\n');
      if (splitIndex === -1) break;
      const rawEvent = buffer.slice(0, splitIndex);
      buffer = buffer.slice(splitIndex + 2);

      const lines = rawEvent.split('\n');
      let eventType = '';
      let dataText = '';
      for (const line of lines) {
        if (line.startsWith('event:')) eventType = line.slice(6).trim();
        if (line.startsWith('data:')) dataText += `${line.slice(5).trim()}\n`;
      }
      dataText = dataText.trim();
      if (!dataText) continue;

      let payload;
      try {
        payload = JSON.parse(dataText);
      } catch {
        continue;
      }
      events.push({ event: eventType || payload.type || 'unknown', payload });

      if (payload.type === 'agent.message' && Array.isArray(payload.content)) {
        for (const block of payload.content) {
          if (block?.type === 'text' && typeof block.text === 'string') {
            agentTextChunks.push(block.text);
          }
        }
      }

      if (payload.type === 'session.status_idle') {
        return {
          events,
          agent_text: agentTextChunks.join('\n').trim()
        };
      }
    }
  }

  return {
    events,
    agent_text: agentTextChunks.join('\n').trim()
  };
}

function buildAuditPrompt({ chapterMountPath, sourceMountPath, briefMountPath, readmeMountPath }) {
  const readmeLine = readmeMountPath
    ? `If needed for path status or prior notes, you may also inspect ${readmeMountPath}.`
    : 'There is no README mounted for this request.';

  return [
    `Read ${briefMountPath} first and follow it as the current Genovy audit context.`,
    `Treat ${chapterMountPath} as the candidate chapter output.`,
    `Treat ${sourceMountPath} as the recovered full-source clinical surface and source of truth.`,
    readmeLine,
    'Audit the candidate output against the recovered source surface.',
    'Return JSON only with these top-level keys:',
    '- high_priority_fixes',
    '- missing_supported_findings',
    '- routing_or_schema_fixes',
    '- policy_dependent_calls',
    '- reject_or_ignore',
    '- final_verdict',
    'Each concrete item should cite sentence IDs from the recovered source file.',
    'Do not import content from other diseases, stale memory, or older Genovy policy.'
  ].join('\n');
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const agentId = String(flags.agent || flags.agentId || '').trim();
  const environmentId = String(flags.environment || flags.environmentId || '').trim();
  const dryRun = Boolean(flags.dryRun);
  const outputDir = toAbsolute(flags.outputDir || DEFAULTS.outputDir);
  if (!agentId && !dryRun) fail('Pass --agent <agent_id> or run with --dryRun.');
  if (!environmentId && !dryRun) fail('Pass --environment <environment_id> or run with --dryRun.');

  const files = await inferAuditFiles(flags.chapterFolder, flags.briefFile || DEFAULTS.briefFile);
  await assertReadable(files.chapterFile);
  await assertReadable(files.sourceFile);
  await assertReadable(files.briefFile);
  if (files.readmeFile) await assertReadable(files.readmeFile);

  const auditFiles = [files.chapterFile, files.sourceFile, files.briefFile, files.readmeFile].filter(Boolean);

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          chapter_folder: toAbsolute(flags.chapterFolder),
          audit_files: auditFiles,
          agent_required: true,
          environment_required: true
        },
        null,
        2
      )
    );
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) fail('Set ANTHROPIC_API_KEY in the environment before running this script.');

  const uploads = [];
  for (const filePath of auditFiles) {
    const uploaded = await uploadFile(apiKey, filePath);
    uploads.push({
      local_path: filePath,
      file_id: uploaded.id,
      mount_path: buildMountPath(filePath)
    });
  }

  const resources = uploads.map((entry) => ({
    type: 'file',
    file_id: entry.file_id,
    mount_path: entry.mount_path
  }));

  const session = await createSession(apiKey, { agentId, environmentId, resources });

  const chapterMountPath = buildMountPath(files.chapterFile);
  const sourceMountPath = buildMountPath(files.sourceFile);
  const briefMountPath = buildMountPath(files.briefFile);
  const readmeMountPath = files.readmeFile ? buildMountPath(files.readmeFile) : null;
  const promptText = buildAuditPrompt({ chapterMountPath, sourceMountPath, briefMountPath, readmeMountPath });
  const eventResponse = await sendUserMessage(apiKey, session.id, promptText);
  const streamResult = await streamSessionUntilIdle(apiKey, session.id);

  await ensureDir(outputDir);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(outputDir, `managed-audit-${stamp}.json`);
  await writeJson(outputPath, {
    created_at: new Date().toISOString(),
    session_id: session.id,
    agent_id: agentId,
    environment_id: environmentId,
    uploads,
    prompt_text: promptText,
    session_response: session,
    event_response: eventResponse,
    stream_result: streamResult
  });

  console.log(
    JSON.stringify(
      {
        session_id: session.id,
        output_path: outputPath,
        uploads,
        agent_text: streamResult.agent_text || null
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});

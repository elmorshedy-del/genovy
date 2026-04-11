import fs from 'node:fs';
import path from 'node:path';
import {
  ensureDir,
  parseArgs,
  sleep,
  slugify,
  writeJson,
  writeText
} from '../lib/genereviewsPipeline.js';

const DEFAULTS = Object.freeze({
  baseUrl: 'https://router.huggingface.co/v1',
  model: 'zai-org/GLM-5.1:novita',
  outputDir: '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/hf-router-chat-runs',
  system: 'You are a precise assistant. Follow the user instruction exactly.',
  temperature: 0,
  maxTokens: 2200,
  timeoutSeconds: 180,
  retryAttempts: 3,
  retryBackoffSeconds: 2
});

const RETRYABLE_STATUS_CODES = new Set([408, 409, 429, 500, 502, 503, 504]);

class HttpError extends Error {
  constructor(status, body) {
    super(`HF router API error: ${status} ${body}`);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

function readMaybeFile(filePath) {
  return filePath ? fs.readFileSync(filePath, 'utf8') : '';
}

function collectPositionalPrompt(argv) {
  const chunks = [];
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith('--')) {
      const next = argv[index + 1];
      if (next && !next.startsWith('--')) index += 1;
      continue;
    }
    chunks.push(token);
  }
  return chunks.join(' ').trim();
}

async function readPrompt(argv, flags) {
  const fromFile = readMaybeFile(flags['prompt-file'] || '');
  if (fromFile.trim()) return fromFile;
  const positional = collectPositionalPrompt(argv);
  if (positional) return positional;
  if (!process.stdin.isTTY) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return chunks.join('').trim();
  }
  return '';
}

function buildRequestUrl(baseUrl) {
  const normalized = String(baseUrl || '').replace(/\/+$/g, '');
  if (normalized.endsWith('/chat/completions')) return normalized;
  if (normalized.endsWith('/v1')) return `${normalized}/chat/completions`;
  return `${normalized}/v1/chat/completions`;
}

function getResponseContent(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((entry) => {
        if (typeof entry === 'string') return entry;
        if (typeof entry?.text === 'string') return entry.text;
        return '';
      })
      .join('\n')
      .trim();
  }
  return '';
}

function parseJsonContent(rawContent) {
  const cleaned = String(rawContent || '').replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url, options, timeoutSeconds) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callHfRouter({
  requestUrl,
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  temperature,
  maxTokens,
  timeoutSeconds,
  jsonMode
}) {
  const body = {
    model,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  };

  if (jsonMode) body.response_format = { type: 'json_object' };

  const response = await fetchWithTimeout(
    requestUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    },
    timeoutSeconds
  );

  if (!response.ok) {
    throw new HttpError(response.status, await response.text());
  }

  const data = await response.json();
  const rawContent = getResponseContent(data);
  return {
    requestBody: body,
    responseBody: data,
    rawContent,
    parsed: jsonMode ? parseJsonContent(rawContent) : null,
    usage: data?.usage || null
  };
}

function shouldRetry(error) {
  if (error instanceof HttpError) return RETRYABLE_STATUS_CODES.has(error.status);
  return error?.name === 'AbortError' || error instanceof TypeError;
}

async function main() {
  const argv = process.argv.slice(2);
  const flags = parseArgs(argv);
  const prompt = await readPrompt(argv, flags);
  if (!prompt) {
    throw new Error('Provide a prompt via positional text, --prompt-file, or stdin.');
  }

  const apiKey = process.env.HF_TOKEN || '';
  if (!apiKey) {
    throw new Error('HF_TOKEN is not set.');
  }

  const systemPrompt = readMaybeFile(flags['system-file'] || '') || String(flags.system || DEFAULTS.system);
  const model = String(flags.model || DEFAULTS.model);
  const requestUrl = buildRequestUrl(flags['base-url'] || DEFAULTS.baseUrl);
  const outputDir = String(flags['output-dir'] || DEFAULTS.outputDir);
  const saveStem =
    String(flags['save-stem'] || '').trim() ||
    `${slugify(model).toLowerCase() || 'hf_router'}_${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const runDir = path.join(outputDir, saveStem);
  const temperature = Number(flags.temperature ?? DEFAULTS.temperature);
  const maxTokens = Number(flags['max-tokens'] ?? DEFAULTS.maxTokens);
  const timeoutSeconds = Number(flags['timeout-seconds'] ?? DEFAULTS.timeoutSeconds);
  const retryAttempts = Number(flags['retry-attempts'] ?? DEFAULTS.retryAttempts);
  const retryBackoffSeconds = Number(flags['retry-backoff-seconds'] ?? DEFAULTS.retryBackoffSeconds);
  const jsonMode = Boolean(flags['json-mode']);

  await ensureDir(runDir);
  await writeText(path.join(runDir, 'system_prompt.txt'), systemPrompt);
  await writeText(path.join(runDir, 'user_prompt.txt'), prompt);

  let attempt = 0;
  let result = null;
  let lastError = null;
  const startedAt = Date.now();

  while (attempt < retryAttempts) {
    attempt += 1;
    try {
      result = await callHfRouter({
        requestUrl,
        apiKey,
        model,
        systemPrompt,
        userPrompt: prompt,
        temperature,
        maxTokens,
        timeoutSeconds,
        jsonMode
      });
      break;
    } catch (error) {
      lastError = error;
      if (!shouldRetry(error) || attempt >= retryAttempts) break;
      await sleep(retryBackoffSeconds * 1000 * attempt);
    }
  }

  const meta = {
    model,
    request_url: requestUrl,
    json_mode: jsonMode,
    temperature,
    max_tokens: maxTokens,
    timeout_seconds: timeoutSeconds,
    retry_attempts: retryAttempts,
    attempts_used: attempt,
    started_at: new Date(startedAt).toISOString(),
    completed_at: new Date().toISOString(),
    duration_ms: Date.now() - startedAt
  };

  if (!result) {
    meta.error = {
      name: lastError?.name || 'Error',
      message: lastError?.message || String(lastError || 'Unknown error'),
      status: lastError instanceof HttpError ? lastError.status : null,
      body: lastError instanceof HttpError ? lastError.body : null
    };
    await writeJson(path.join(runDir, 'meta.json'), meta);
    throw lastError || new Error('HF router call failed.');
  }

  await writeJson(path.join(runDir, 'request_body.json'), result.requestBody);
  await writeJson(path.join(runDir, 'response_body.json'), result.responseBody);
  await writeText(path.join(runDir, 'response_content.txt'), `${result.rawContent}\n`);
  if (jsonMode && result.parsed) {
    await writeJson(path.join(runDir, 'response_parsed.json'), result.parsed);
  }

  meta.usage = result.usage;
  meta.output_dir = runDir;
  meta.parsed_json = Boolean(result.parsed);
  await writeJson(path.join(runDir, 'meta.json'), meta);

  process.stderr.write(`HF router run saved to ${runDir}\n`);
  process.stdout.write(`${result.rawContent}\n`);
}

main().catch((error) => {
  process.stderr.write(`Error: ${error?.message || error}\n`);
  process.exit(1);
});

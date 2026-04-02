import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEFAULT_SCISPACY_PYTHON = '/Users/ahmedelmorshedy/.cache/phenotagger/.venv/bin/python';
const DEFAULT_SCISPACY_PYTHONPATH = path.join(REPO_ROOT, '.deps', 'scispacy_probe');
const DEFAULT_SCISPACY_SCRIPT = path.join(REPO_ROOT, 'src', 'scripts', 'validateMetadataAttachmentSciSpacy.py');
const DEFAULT_SCISPACY_TIMEOUT_MS = 30_000;

function mergePythonPath(basePath, existingPath = '') {
  const paths = [basePath, existingPath].filter(Boolean);
  return paths.join(':');
}

export function scispaCyValidatorAvailable({
  pythonPath = DEFAULT_SCISPACY_PYTHON,
  pythonModulePath = DEFAULT_SCISPACY_PYTHONPATH,
  scriptPath = DEFAULT_SCISPACY_SCRIPT
} = {}) {
  return fs.existsSync(pythonPath) && fs.existsSync(pythonModulePath) && fs.existsSync(scriptPath);
}

export async function runSciSpacyAttachmentValidation(
  items,
  {
    pythonPath = DEFAULT_SCISPACY_PYTHON,
    pythonModulePath = DEFAULT_SCISPACY_PYTHONPATH,
    scriptPath = DEFAULT_SCISPACY_SCRIPT,
    timeoutMs = DEFAULT_SCISPACY_TIMEOUT_MS
  } = {}
) {
  if (!items?.length) {
    return [];
  }

  return await new Promise((resolve, reject) => {
    const child = spawn(pythonPath, [scriptPath], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        PYTHONPATH: mergePythonPath(pythonModulePath, process.env.PYTHONPATH)
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGKILL');
      reject(new Error(`SciSpacy validator timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`SciSpacy validator failed with code ${code}: ${stderr.trim() || stdout.trim()}`));
        return;
      }
      try {
        const parsed = JSON.parse(stdout || '{}');
        resolve(Array.isArray(parsed.items) ? parsed.items : []);
      } catch (error) {
        reject(new Error(`SciSpacy validator returned invalid JSON: ${error.message}`));
      }
    });

    child.stdin.end(`${JSON.stringify({ items })}\n`);
  });
}

export const SCISPACY_ATTACHMENT_DEFAULTS = Object.freeze({
  pythonPath: DEFAULT_SCISPACY_PYTHON,
  pythonModulePath: DEFAULT_SCISPACY_PYTHONPATH,
  scriptPath: DEFAULT_SCISPACY_SCRIPT,
  timeoutMs: DEFAULT_SCISPACY_TIMEOUT_MS
});

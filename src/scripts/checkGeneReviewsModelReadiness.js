import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_PHENOTAGGER_HOME =
  process.env.PHENOTAGGER_HOME || '/Users/ahmedelmorshedy/.cache/phenotagger';
const DEFAULT_PHENOTAGGER_PYTHON =
  process.env.PHENOTAGGER_PYTHON || '/Users/ahmedelmorshedy/.cache/phenotagger/.venv/bin/python';

function previewSecret(value) {
  if (!value) return null;
  return value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-4)}` : 'SET';
}

async function checkPhenotaggerLocal() {
  const requiredPaths = [
    path.join(DEFAULT_PHENOTAGGER_HOME, 'src'),
    path.join(DEFAULT_PHENOTAGGER_HOME, 'dict', 'noabb_lemma.dic'),
    path.join(DEFAULT_PHENOTAGGER_HOME, 'dict', 'word_id_map.json'),
    path.join(DEFAULT_PHENOTAGGER_HOME, 'dict', 'id_word_map.json'),
    path.join(DEFAULT_PHENOTAGGER_HOME, 'models', 'pubmedbert_PT_v1.2.h5'),
    path.join(
      DEFAULT_PHENOTAGGER_HOME,
      'models',
      'BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext',
      'config.json'
    ),
    DEFAULT_PHENOTAGGER_PYTHON
  ];
  const missing = requiredPaths.filter((filePath) => !fs.existsSync(filePath));
  return {
    mode: 'local',
    home: DEFAULT_PHENOTAGGER_HOME,
    python: DEFAULT_PHENOTAGGER_PYTHON,
    ok: missing.length === 0,
    missing,
    diagnosis:
      missing.length === 0
        ? 'local PhenoTagger install looks complete'
        : `missing ${missing.length} required local asset(s)`
  };
}

async function main() {
  const phenotagger = await checkPhenotaggerLocal();

  const payload = {
    created_at: new Date().toISOString(),
    gemini: {
      apiKeyPresent: Boolean(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY),
      apiKeyPreview: previewSecret(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY),
      candidateModel: 'gemini-2.5-flash'
    },
    geminiPreview: {
      apiKeyPresent: Boolean(process.env.GEMINI_31_PREVIEW_API_KEY || process.env.GEMINI_PRO_PREVIEW_API_KEY),
      apiKeyPreview: previewSecret(process.env.GEMINI_31_PREVIEW_API_KEY || process.env.GEMINI_PRO_PREVIEW_API_KEY),
      modelHint: 'gemini-3-pro-preview'
    },
    qwen: {
      apiKeyPresent: Boolean(process.env.DASHSCOPE_API_KEY),
      apiKeyPreview: previewSecret(process.env.DASHSCOPE_API_KEY),
      baseUrlPresent: Boolean(process.env.DASHSCOPE_BASE_URL || process.env.OPENAI_COMPAT_BASE_URL),
      baseUrl: process.env.DASHSCOPE_BASE_URL || process.env.OPENAI_COMPAT_BASE_URL || null,
      candidateModel: process.env.DASHSCOPE_MODEL || 'qwen-max-latest'
    },
    phenotagger: phenotagger,
    medgemma: {
      apiKeyPresent: Boolean(process.env.MEDGEMMA_API_KEY || process.env.HUGGINGFACE_API_KEY),
      apiKeyPreview: previewSecret(process.env.MEDGEMMA_API_KEY || process.env.HUGGINGFACE_API_KEY),
      baseUrlPresent: Boolean(process.env.MEDGEMMA_BASE_URL || process.env.HUGGINGFACE_BASE_URL),
      baseUrl: process.env.MEDGEMMA_BASE_URL || process.env.HUGGINGFACE_BASE_URL || null,
      model: process.env.MEDGEMMA_MODEL || 'google/medgemma-27b-text-it'
    }
  };

  payload.summary = {
    geminiReady: payload.gemini.apiKeyPresent,
    geminiPreviewReady: payload.geminiPreview.apiKeyPresent,
    qwenReady: payload.qwen.apiKeyPresent && payload.qwen.baseUrlPresent,
    phenotaggerReady: payload.phenotagger.ok,
    medgemmaReady: payload.medgemma.apiKeyPresent && payload.medgemma.baseUrlPresent
  };

  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});

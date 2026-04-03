import path from 'node:path';
import {
  callGeminiJson,
  ensureDir,
  parseArgs,
  sleep,
  writeJson
} from '../lib/genereviewsPipeline.js';
import {
  buildGroundedSummary,
  chunk,
  dedupeGroundedCandidates,
  evaluateGroundedCase,
  loadDiscoveryBenchmark
} from '../lib/stage3DiscoveryGroundedEval.js';

const DEFAULTS = Object.freeze({
  input:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryBenchmarkHoldout80.js',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_grounded_gemini_25_pro_holdout80_20260402',
  model: 'gemini-2.5-pro',
  batchSize: 4,
  pauseMs: 400,
  thinkingBudget: 1024,
  limit: 0
});

const GROUNDED_DISCOVERY_PROMPT = `You are a clinical genetics expert reading GeneReviews clinical text.

Each input item contains:
- id
- chapter_title
- existing_anchors
- clinical_structure.sentences

TASK:
Find additional phenotype findings that are described in the provided sentences but are NOT already covered by the supplied anchor list.

CRITICAL RULE:
- Extract the evidence phrase exactly as written in the source sentence.
- Do NOT rename, paraphrase, normalize, or map to HPO.

OUTPUT RULES:
1. Return only findings grounded to exactly one provided sentence_id
2. evidence_text must be copied exactly from that sentence
3. label should repeat the exact evidence phrase; do not rewrite it
4. status must be exactly "present" or "excluded"
5. Do NOT return duplicate findings already covered by existing_anchors
6. Do NOT return:
   - inheritance patterns
   - gene names, variants, molecular findings
   - lab tests, assay names, imaging studies, procedures, analytes, or raw measurements
   - treatment, management, devices, feeding routes, supports, or interventions
   - disease labels or syndrome names
   - normal/preserved/intact findings
   - future risk / complication statements unless the phenotype is explicitly asserted as present now
7. Use "excluded" only when an abnormal clinical feature is explicitly said to be absent / not present / not reported / not a feature
8. If uncertain whether something is a true phenotype finding, omit it
9. Prefer omission over speculation

OUTPUT FORMAT (JSON array, no other text):
[
  {
    "id": "case id",
    "predictedCandidates": [
      {
        "label": "exact evidence phrase",
        "status": "present",
        "sentence_id": "p1_s2",
        "evidence_text": "exact evidence phrase"
      }
    ]
  }
]`;

function resolveEnvValue(...names) {
  for (const name of names) {
    if (!name) continue;
    const value = process.env[name];
    if (value) return value;
  }
  return '';
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const input = flags.input || DEFAULTS.input;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const model = flags.model || DEFAULTS.model;
  const batchSize = Math.max(1, Number.parseInt(flags.batchSize || `${DEFAULTS.batchSize}`, 10) || DEFAULTS.batchSize);
  const pauseMs = Math.max(0, Number.parseInt(flags.pauseMs || `${DEFAULTS.pauseMs}`, 10) || DEFAULTS.pauseMs);
  const thinkingBudget = Number.parseInt(flags.thinkingBudget || `${DEFAULTS.thinkingBudget}`, 10) || 0;
  const limit = Math.max(0, Number.parseInt(flags.limit || `${DEFAULTS.limit}`, 10) || DEFAULTS.limit);
  const apiKey = flags.apiKey || resolveEnvValue(flags.apiKeyEnv, 'GOOGLE_API_KEY', 'GEMINI_API_KEY');

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is required.');
  }

  await ensureDir(outputDir);
  let benchmark = await loadDiscoveryBenchmark(input);
  if (limit > 0) benchmark = benchmark.slice(0, limit);
  const batches = chunk(benchmark, batchSize);
  const predictions = [];
  const batchReports = [];

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    console.log(`Grounded Gemini discovery batch ${index + 1}/${batches.length} (${batch.length} cases)`);
    const { parsed, usage, rawOutput } = await callGeminiJson({
      apiKey,
      model,
      systemPrompt: GROUNDED_DISCOVERY_PROMPT,
      userPayload: {
        batch_index: index + 1,
        cases: batch.map((testCase) => ({
          id: testCase.id,
          chapter_title: testCase.chapter_title,
          existing_anchors: testCase.existing_anchors,
          clinical_structure: {
            sentences:
              Array.isArray(testCase?.clinical_structure?.sentences)
                ? testCase.clinical_structure.sentences.map((sentence) => ({
                    sentence_id: sentence.sentence_id,
                    text: sentence.text
                  }))
                : []
          }
        }))
      },
      temperature: 0.1,
      thinkingBudget
    });

    const parsedBatch = Array.isArray(parsed) ? parsed : [];
    predictions.push(
      ...batch.map((testCase) => {
        const rawPredicted = parsedBatch.find((item) => item?.id === testCase.id);
        const predictedCandidates = dedupeGroundedCandidates(
          Array.isArray(rawPredicted)
            ? rawPredicted
            : Array.isArray(rawPredicted?.predictedCandidates)
              ? rawPredicted.predictedCandidates
              : []
        );
        return {
          id: testCase.id,
          predictedCandidates
        };
      })
    );

    batchReports.push({
      batchIndex: index + 1,
      caseIds: batch.map((testCase) => testCase.id),
      usage,
      rawOutput
    });

    if (pauseMs > 0 && index < batches.length - 1) {
      await sleep(pauseMs);
    }
  }

  const predictionById = new Map(predictions.map((item) => [item.id, item]));
  const evaluatedCases = benchmark.map((testCase) => {
    const predicted = predictionById.get(testCase.id) || { predictedCandidates: [] };
    return {
      id: testCase.id,
      chapter_title: testCase.chapter_title,
      predictedCandidates: predicted.predictedCandidates,
      ...evaluateGroundedCase(testCase, predicted.predictedCandidates)
    };
  });

  const summary = buildGroundedSummary(benchmark, evaluatedCases);
  summary.model = model;
  summary.mode = 'grounded_direct';
  await writeJson(path.join(outputDir, 'stage3_discovery_grounded_gemini_summary.json'), summary);
  await writeJson(
    path.join(outputDir, 'stage3_discovery_grounded_gemini_report.json'),
    benchmark.map((testCase, index) => ({
      ...testCase,
      ...evaluatedCases[index]
    }))
  );
  await writeJson(path.join(outputDir, 'stage3_discovery_grounded_gemini_batches.json'), batchReports);

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

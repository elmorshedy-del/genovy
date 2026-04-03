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
  loadCaseReport,
  loadDiscoveryBenchmark
} from '../lib/stage3DiscoveryGroundedEval.js';

const DEFAULTS = Object.freeze({
  input:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryBenchmarkHoldout80.js',
  firstPassReport:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_gliner_large_two_0p4_holdout80_20260402/stage3_discovery_gliner_report.json',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_grounded_gliner_gemini25pro_holdout80_20260402',
  model: 'gemini-2.5-pro',
  batchSize: 2,
  pauseMs: 400,
  thinkingBudget: 1024,
  limit: 0
});

const REVIEW_AND_ADD_PROMPT = `You are a clinical genetics expert doing SECOND-PASS phenotype discovery after a first-pass extractor.

Each input item contains:
- id
- chapter_title
- existing_anchors
- first_pass_candidates
- clinical_structure.sentences

Your job has TWO parts:

PART A: Review first-pass candidates
- KEEP the candidate if it is a real phenotype finding supported by the text.
- REJECT the candidate if it is junk, duplicate, too broad, normal/preserved, risk-only, lab/test content, management content, gene/molecular content, or disease-label leakage.

PART B: Add missed findings
- Find any additional phenotype findings that are clearly present in the provided sentences but were missed by both:
  - existing_anchors
  - kept first-pass candidates

CRITICAL RULE:
- For every kept or added finding, return the evidence phrase exactly as written in the source sentence.
- Do NOT rename, paraphrase, normalize, or map to HPO.

Allowed reject reasons:
- already_in_anchors
- duplicate_of_other_candidate
- too_broad_or_unspecific
- lab_or_test_method
- treatment_or_management
- gene_or_variant
- normal_or_preserved
- conditional_or_risk_only
- not_a_phenotype

Output rules:
1. Every kept or added finding must be grounded to exactly one provided sentence_id
2. evidence_text must be copied exactly from that sentence
3. For kept findings, preserve the original status unless the text clearly requires "excluded"
4. Do not add or keep duplicates already covered by existing_anchors or other kept findings
5. Do not output inheritance patterns, gene names, variants, molecular findings, lab/test content, treatment/management content, disease labels, normal findings, or future risk-only statements
6. Use "excluded" only when an abnormal clinical feature is explicitly said to be absent / not present / not reported / not a feature
7. If uncertain, prefer omission over speculation

OUTPUT FORMAT (JSON array only):
[
  {
    "id": "case id",
    "reviewed_candidates": [
      {
        "input_label": "candidate exactly as given",
        "decision": "keep",
        "reason": null,
        "status": "present",
        "sentence_id": "p1_s2",
        "evidence_text": "exact evidence phrase"
      },
      {
        "input_label": "candidate exactly as given",
        "decision": "reject",
        "reason": "lab_or_test_method",
        "status": null,
        "sentence_id": null,
        "evidence_text": null
      }
    ],
    "added_candidates": [
      {
        "status": "present",
        "sentence_id": "p1_s4",
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

function buildFirstPassPayload(firstPassCase) {
  return Array.isArray(firstPassCase?.predictedCandidates)
    ? firstPassCase.predictedCandidates.map((candidate) => ({
        label: candidate.label,
        status: candidate.status || 'present',
        source_sentence: candidate.source_sentence || null
      }))
    : [];
}

function buildFinalCandidates(reviewed = [], added = []) {
  const kept = reviewed
    .filter((item) => item?.decision === 'keep' && item?.evidence_text && item?.sentence_id)
    .map((item) => ({
      label: String(item.evidence_text).trim(),
      status: item.status === 'excluded' ? 'excluded' : 'present',
      sentence_id: item.sentence_id,
      evidence_text: String(item.evidence_text).trim()
    }));
  const addedCandidates = (Array.isArray(added) ? added : [])
    .filter((item) => item?.evidence_text && item?.sentence_id)
    .map((item) => ({
      label: String(item.evidence_text).trim(),
      status: item.status === 'excluded' ? 'excluded' : 'present',
      sentence_id: item.sentence_id,
      evidence_text: String(item.evidence_text).trim()
    }));
  return dedupeGroundedCandidates([...kept, ...addedCandidates]);
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const input = flags.input || DEFAULTS.input;
  const firstPassReport = flags.firstPassReport || DEFAULTS.firstPassReport;
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
  const firstPassCases = await loadCaseReport(firstPassReport);
  const firstPassById = new Map(firstPassCases.map((item) => [item.id, item]));
  const batches = chunk(benchmark, batchSize);
  const batchReports = [];
  const finalCases = [];

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    console.log(`Grounded GLiNER->Gemini batch ${index + 1}/${batches.length} (${batch.length} cases)`);
    const { parsed, usage, rawOutput } = await callGeminiJson({
      apiKey,
      model,
      systemPrompt: REVIEW_AND_ADD_PROMPT,
      userPayload: {
        batch_index: index + 1,
        cases: batch.map((testCase) => ({
          id: testCase.id,
          chapter_title: testCase.chapter_title,
          existing_anchors: testCase.existing_anchors,
          first_pass_candidates: buildFirstPassPayload(firstPassById.get(testCase.id)),
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
    for (const testCase of batch) {
      const rawCase = parsedBatch.find((item) => item?.id === testCase.id) || {};
      finalCases.push({
        id: testCase.id,
        reviewed_candidates: Array.isArray(rawCase.reviewed_candidates) ? rawCase.reviewed_candidates : [],
        added_candidates: Array.isArray(rawCase.added_candidates) ? rawCase.added_candidates : [],
        predictedCandidates: buildFinalCandidates(rawCase.reviewed_candidates, rawCase.added_candidates)
      });
    }

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

  const finalById = new Map(finalCases.map((item) => [item.id, item]));
  const evaluatedCases = benchmark.map((testCase) => {
    const stackCase = finalById.get(testCase.id) || {
      predictedCandidates: [],
      reviewed_candidates: [],
      added_candidates: []
    };
    return {
      id: testCase.id,
      chapter_title: testCase.chapter_title,
      reviewed_candidates: stackCase.reviewed_candidates,
      added_candidates: stackCase.added_candidates,
      predictedCandidates: stackCase.predictedCandidates,
      ...evaluateGroundedCase(testCase, stackCase.predictedCandidates)
    };
  });

  const summary = buildGroundedSummary(benchmark, evaluatedCases);
  summary.model = model;
  summary.mode = 'grounded_gliner_cleanup_add';
  await writeJson(path.join(outputDir, 'stage3_discovery_grounded_stack_summary.json'), summary);
  await writeJson(
    path.join(outputDir, 'stage3_discovery_grounded_stack_report.json'),
    benchmark.map((testCase, index) => ({
      ...testCase,
      firstPassCandidates: buildFirstPassPayload(firstPassById.get(testCase.id)),
      ...evaluatedCases[index]
    }))
  );
  await writeJson(path.join(outputDir, 'stage3_discovery_grounded_stack_batches.json'), batchReports);

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

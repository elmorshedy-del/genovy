import path from 'node:path';
import {
  callGeminiJson,
  ensureDir,
  parseArgs,
  readJson,
  writeJson
} from '../lib/genereviewsPipeline.js';
import {
  buildEnrichmentDetailTypeSchemaText,
  buildSchemaRepairPrompt,
  normalizeEnrichmentReviewPayload
} from '../lib/enrichmentReviewer.js';

const DEFAULTS = Object.freeze({
  chapterKey: 'zellweger_spectrum_disorder',
  inputReport:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_first5_gemini_independent_eval_20260404/grounded_raw_manual_eval_report.json',
  auditFixture:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryFirst5IndependentAudit.json',
  structurePath:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/bucket-critical/20260331-genereviews-latest5-readiness/stage1_fetch/NBK1448_clinical_structure.json',
  anchorsPath:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-latest5-settled-20260330/stage2_anchors/Zellweger_Spectrum_Disorder_anchors.json',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/chapter_trial_zellweger_enrichment_20260404',
  models: 'gemini-2.5-pro,gemini-3-pro-preview',
  thinkingBudget: 256,
  temperature: 0
});

function resolveEnvValue(...names) {
  for (const name of names) {
    if (!name) continue;
    const value = process.env[name];
    if (value) return value;
  }
  return '';
}

function buildSentenceMap(structure) {
  const sentenceMap = new Map();
  for (const paragraph of structure.paragraphs || []) {
    for (const sentence of paragraph.sentences || []) {
      sentenceMap.set(sentence.sentence_id, sentence.text);
    }
  }
  return sentenceMap;
}

function buildAuditMap(auditChapter) {
  return new Map(
    (auditChapter.entries || []).map((entry) => [
      `${entry.sentence_id}::${String(entry.evidence_text || '').toLowerCase()}`,
      entry
    ])
  );
}

function buildAnchorContext(anchorsPayload, candidate) {
  const sameSentence = [];
  const sameParagraph = [];

  for (const anchor of anchorsPayload.anchors || []) {
    for (const occurrence of anchor.occurrences || []) {
      const row = {
        hpo_id: anchor.hpo_id,
        hpo_label: anchor.hpo_label,
        match_text: occurrence.match_text,
        sentence_id: occurrence.sentence_id || null,
        paragraph_id: occurrence.paragraph_id || null
      };
      if (row.sentence_id === candidate.sentence_id) {
        sameSentence.push(row);
        continue;
      }
      if (row.paragraph_id && candidate.sentence_id?.startsWith(`${row.paragraph_id}_`)) {
        sameParagraph.push(row);
      }
    }
  }

  const dedupe = (rows) => {
    const seen = new Set();
    return rows.filter((row) => {
      const key = `${row.hpo_id}::${row.match_text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return {
    same_sentence_anchors: dedupe(sameSentence).slice(0, 12),
    same_paragraph_anchors: dedupe(sameParagraph).slice(0, 12)
  };
}

function buildCases({ chapterReport, auditChapter, sentenceMap, anchorsPayload }) {
  const auditMap = buildAuditMap(auditChapter);
  const rawCandidates = [
    ...chapterReport.matched_targets.map((pair) => pair.predicted),
    ...chapterReport.unmatched_predicted_candidates
  ];

  return rawCandidates.map((candidate) => {
    const auditKey = `${candidate.sentence_id}::${String(candidate.evidence_text || '').toLowerCase()}`;
    const auditEntry = auditMap.get(auditKey) || null;
    return {
      candidate: {
        label: candidate.label,
        sentence_id: candidate.sentence_id,
        source_sentence: sentenceMap.get(candidate.sentence_id) || '',
        status: candidate.status || 'present',
        evidence_text: candidate.evidence_text || candidate.label
      },
      anchor_context: buildAnchorContext(anchorsPayload, candidate),
      prior_audit_bucket: auditEntry?.bucket || null,
      prior_audit_notes: auditEntry?.notes || null
    };
  });
}

function buildReviewPrompt() {
  return `You are reviewing grounded GeneReviews candidates under an enrichment-first policy.

Return JSON with a top-level key "results" containing one item per case in the same order.
Each result must contain:
- candidate_label
- sentence_id
- bucket
- adds_detail_beyond_anchor
- detail_types
- same_finding_as_anchor_labels
- reason

Allowed buckets:
- keep_enrichment
- collapse_to_anchor
- broad_or_redundant
- junk_or_context_only

Allowed detail_types:
${buildEnrichmentDetailTypeSchemaText()}

Policy:
- Preserve clinically meaningful source detail beyond flattened HPO anchors.
- Keep subtype, pattern, morphology, distribution, laterality, modality, temporal qualifier, anatomical subsite, trigger, quantitative, pathophysiology, etiology, and clinical course detail when the source supports it.
- pathophysiology means an underlying biological, developmental, or physiologic abnormality within the patient that directly explains the retained finding and is itself clinically meaningful disease detail.
- etiology means an explicitly stated causal basis for the retained finding when that cause adds clinically meaningful specificity beyond the anchor and is not merely a gene, variant, inheritance pattern, or broad diagnosis label.
- clinical_course means the behavior of the finding over time after onset, such as recurrent, relapsing, transient, persistent, progressive, regressive, or episodic. It is not the same as age of onset.
- Do not collapse a candidate just because a broader anchor exists.
- Collapse only if the candidate is effectively the same anchored finding and adds no clinically meaningful specificity.
- Broad umbrella phrases go to broad_or_redundant.
- Lab-only, support-only, context-only, or pathology-only outputs go to junk_or_context_only unless they are clearly patient-facing phenotype enrichment.
- If a candidate adds source-faithful differentiating detail that could matter later for mapping or disease differentiation, prefer keep_enrichment.

Before you finalize the answer, do a schema pass:
- verify every detail_types item is exactly one of the allowed values above
- if not, rewrite it to the closest allowed value or remove it
- do not invent any other detail_types labels

Output JSON only.`;
}

async function runSchemaGuardedReview({
  apiKey,
  model,
  thinkingBudget,
  temperature,
  chapterKey,
  cases
}) {
  const primary = await callGeminiJson({
    apiKey,
    model,
    systemPrompt: buildReviewPrompt(),
    userPayload: {
      chapter_key: chapterKey,
      cases
    },
    temperature,
    thinkingBudget
  });

  let normalized = normalizeEnrichmentReviewPayload(primary.parsed, cases.length);
  let repaired = null;

  if (!normalized.valid) {
    repaired = await callGeminiJson({
      apiKey,
      model,
      systemPrompt: buildSchemaRepairPrompt(),
      userPayload: {
        chapter_key: chapterKey,
        cases,
        prior_output: primary.rawOutput,
        validation_issues: normalized.issues
      },
      temperature,
      thinkingBudget
    });
    normalized = normalizeEnrichmentReviewPayload(repaired.parsed, cases.length);
  }

  return {
    model,
    primary,
    repaired,
    normalized
  };
}

function compareAgainstPriorAudit(cases, results) {
  const output = [];
  for (let index = 0; index < cases.length; index += 1) {
    const inputCase = cases[index];
    const row = results[index] || null;
    output.push({
      candidate_label: inputCase.candidate.label,
      sentence_id: inputCase.candidate.sentence_id,
      prior_audit_bucket: inputCase.prior_audit_bucket,
      reviewer_bucket: row?.bucket || null,
      detail_types: row?.detail_types || [],
      changed_vs_prior_audit:
        inputCase.prior_audit_bucket !== null && inputCase.prior_audit_bucket !== row?.bucket
    });
  }
  return output;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const chapterKey = flags.chapterKey || DEFAULTS.chapterKey;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const modelNames = String(flags.models || DEFAULTS.models)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const thinkingBudget =
    Number.parseInt(flags.thinkingBudget || `${DEFAULTS.thinkingBudget}`, 10) || DEFAULTS.thinkingBudget;
  const temperature = Number.parseFloat(flags.temperature || `${DEFAULTS.temperature}`);
  const apiKey = flags.apiKey || resolveEnvValue(flags.apiKeyEnv, 'GOOGLE_API_KEY', 'GEMINI_API_KEY');

  if (!apiKey) throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is required.');

  await ensureDir(outputDir);

  const [report, audit, structure, anchorsPayload] = await Promise.all([
    readJson(flags.inputReport || DEFAULTS.inputReport),
    readJson(flags.audit || DEFAULTS.auditFixture),
    readJson(flags.structure || DEFAULTS.structurePath),
    readJson(flags.anchors || DEFAULTS.anchorsPath)
  ]);

  const chapterReport = report.find((item) => item.chapter_key === chapterKey);
  const auditChapter = audit.chapters.find((item) => item.chapter_key === chapterKey);
  if (!chapterReport || !auditChapter) {
    throw new Error(`Missing chapter report or audit chapter for ${chapterKey}`);
  }

  const sentenceMap = buildSentenceMap(structure);
  const cases = buildCases({
    chapterReport,
    auditChapter,
    sentenceMap,
    anchorsPayload
  });

  const modelOutputs = [];
  for (const model of modelNames) {
    const reviewed = await runSchemaGuardedReview({
      apiKey,
      model,
      thinkingBudget,
      temperature,
      chapterKey,
      cases
    });

    const comparison = compareAgainstPriorAudit(cases, reviewed.normalized.results);
    modelOutputs.push({
      model,
      primary_usage: reviewed.primary.usage || null,
      repaired_usage: reviewed.repaired?.usage || null,
      validation_issues: reviewed.normalized.issues,
      repaired_output_used: Boolean(reviewed.repaired),
      normalized_results: reviewed.normalized.results,
      comparison
    });
  }

  await writeJson(path.join(outputDir, 'chapter_enrichment_trial_input.json'), {
    chapter_key: chapterKey,
    cases
  });
  await writeJson(path.join(outputDir, 'chapter_enrichment_trial_outputs.json'), modelOutputs);

  for (const output of modelOutputs) {
    console.log(`MODEL ${output.model}`);
    console.log(`repair_used=${output.repaired_output_used}`);
    for (const row of output.comparison) {
      console.log(
        `${row.sentence_id}\t${row.candidate_label}\tprior=${row.prior_audit_bucket}\tnow=${row.reviewer_bucket}\tdetail=${row.detail_types.join('|')}`
      );
    }
    console.log('---');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

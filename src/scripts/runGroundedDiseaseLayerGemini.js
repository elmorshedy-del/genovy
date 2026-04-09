import fs from 'node:fs';
import path from 'node:path';
import {
  callGeminiJson,
  ensureDir,
  parseArgs,
  readJson,
  sleep,
  slugify,
  writeJson,
  writeText
} from '../lib/genereviewsPipeline.js';

const DEFAULTS = Object.freeze({
  input:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-williams-syndrome/NBK1249_opus_input.json',
  prompt:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/genereviews-opus-grounded-disease-layer-strict-prompt-v1-20260409.md',
  template:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genereviews-grounded-disease-layer-template-v1-20260408.json',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-gemini-runs',
  model: 'gemini-2.5-pro',
  temperature: 0,
  thinkingBudget: 1024,
  pauseMs: 300
});

const SCHEMA_VERSION = 'grounded_disease_layer_v1';
const EXTRACTION_POLICY_VERSION = 'strict_grounded_v1';

const PHENOTYPE_QUALIFIER_KEYS = Object.freeze([
  'onset',
  'frequency',
  'severity',
  'progression',
  'trigger',
  'treatment_response',
  'pathophysiology',
  'laterality',
  'distribution',
  'anatomical_site',
  'morphology',
  'subtype_context'
]);

const ANCILLARY_QUALIFIER_KEYS = Object.freeze(['timing', 'frequency', 'severity', 'method', 'specimen', 'subtype_context']);
const CONTEXT_FIELDS = new Set([
  'onset',
  'inheritance',
  'gene',
  'prevalence',
  'prognosis',
  'natural_history',
  'family_risk',
  'founder_variant',
  'biomarker',
  'therapeutic_landscape',
  'penetrance'
]);
const ALLOWED_STATUSES = new Set(['present', 'uncertain', 'excluded']);
const ALLOWED_CLINICAL_ROLES = new Set(['primary', 'descriptor', 'complication']);
const ALLOWED_ANCILLARY_DOMAINS = new Set([
  'laboratory',
  'imaging',
  'pathology',
  'electrophysiology',
  'treatment_response',
  'clinical_test',
  'management_context',
  'other'
]);

const PASS_DEFINITIONS = Object.freeze([
  {
    key: 'phenotype',
    outputKey: 'phenotype_assertions',
    outputFileSuffix: 'phenotypes',
    instruction: [
      'You are the phenotype worker in a task-scoped extraction pipeline.',
      'Return only phenotype assertions.',
      'Do not return ancillary assertions, context assertions, trajectory assertions, extraction notes, or source_document.',
      'Use `status` carefully: `present`, `uncertain`, or `excluded` only when directly supported.',
      'Split coordinated findings only when they are clearly distinct manifestations.'
    ].join(' ')
  },
  {
    key: 'ancillary',
    outputKey: 'ancillary_assertions',
    outputFileSuffix: 'ancillary',
    instruction: [
      'You are the ancillary worker in a task-scoped extraction pipeline.',
      'Return only ancillary assertions.',
      'Use the domain rules conservatively.',
      'Do not emit phenotype assertions, context assertions, trajectory assertions, extraction notes, or source_document.'
    ].join(' ')
  },
  {
    key: 'context',
    outputKey: 'context_assertions',
    outputFileSuffix: 'context',
    instruction: [
      'You are the context worker in a task-scoped extraction pipeline.',
      'Return only grounded disease-level context assertions.',
      'Do not emit unsupported context fields.',
      'Do not emit phenotype assertions, ancillary assertions, trajectory assertions, extraction notes, or source_document.'
    ].join(' ')
  },
  {
    key: 'trajectory',
    outputKey: 'trajectory_assertions',
    outputFileSuffix: 'trajectory',
    instruction: [
      'You are the trajectory worker in a task-scoped extraction pipeline.',
      'Return only trajectory assertions when the source explicitly describes staged disease course.',
      'If staged disease course is not explicit, return an empty array.',
      'Do not emit phenotype assertions, ancillary assertions, context assertions, extraction notes, or source_document.'
    ].join(' ')
  },
  {
    key: 'notes',
    outputKey: 'extraction_notes',
    outputFileSuffix: 'notes',
    instruction: [
      'You are the extraction-notes worker in a task-scoped extraction pipeline.',
      'Return only concise source-backed routing or ambiguity notes.',
      'Do not restate the chapter, and do not invent notes just to fill the field.',
      'Do not emit phenotype assertions, ancillary assertions, context assertions, trajectory assertions, or source_document.'
    ].join(' ')
  }
]);

function resolveEnvValue(...names) {
  for (const name of names) {
    if (!name) continue;
    const value = process.env[name];
    if (value) return value;
  }
  return '';
}

function fail(message) {
  throw new Error(message);
}

function ensureWrapperShape(wrapper, inputPath) {
  if (!wrapper || typeof wrapper !== 'object') fail(`Invalid input wrapper: ${inputPath}`);
  if (!wrapper.chapter || typeof wrapper.chapter !== 'object') fail(`Missing chapter block: ${inputPath}`);
  if (!Array.isArray(wrapper.sentence_index)) fail(`Missing sentence_index array: ${inputPath}`);
}

function uniqueSentenceRefs(refs, validIds) {
  const output = [];
  const seen = new Set();
  for (const value of Array.isArray(refs) ? refs : []) {
    const id = String(value || '').trim();
    if (!id || seen.has(id)) continue;
    if (!validIds.has(id)) fail(`Unknown evidence sentence id: ${id}`);
    seen.add(id);
    output.push(id);
  }
  return output;
}

function toNullableString(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function buildDocumentStem(wrapper) {
  const nbkId = String(wrapper?.chapter?.nbk_id || '').trim();
  const titleSlug = slugify(wrapper?.chapter?.title || 'chapter').toLowerCase() || 'chapter';
  return `${nbkId || 'chapter'}_${titleSlug}`;
}

function buildScopedTemplate(template, outputKey) {
  return {
    [outputKey]: Array.isArray(template?.[outputKey]) ? template[outputKey] : []
  };
}

function buildScopedPassPrompt(basePrompt, template, pass) {
  const scopedTemplate = buildScopedTemplate(template, pass.outputKey);
  return [
    basePrompt.trim(),
    '',
    'Scoped worker override:',
    pass.instruction,
    '',
    'Return only this JSON shape and nothing else:',
    JSON.stringify(scopedTemplate, null, 2)
  ].join('\n');
}

function normalizeSourceDocument(sourceDocument, wrapper, sentenceIndex) {
  const block = sourceDocument && typeof sourceDocument === 'object' ? sourceDocument : {};
  const chapter = wrapper.chapter || {};
  const documentStem = buildDocumentStem(wrapper);
  return {
    document_local_id: String(block.document_local_id || documentStem).trim(),
    disease_local_id: String(block.disease_local_id || documentStem).trim(),
    nbk_id: toNullableString(block.nbk_id) || toNullableString(chapter.nbk_id),
    title: String(block.title || chapter.title || '').trim(),
    mode: String(block.mode || chapter.mode || 'discovery').trim() || 'discovery',
    source: toNullableString(block.source) || toNullableString(chapter.source) || 'GeneReviews',
    source_url: toNullableString(block.source_url) || toNullableString(chapter.source_url),
    source_date: toNullableString(block.source_date) || toNullableString(chapter.source_date),
    sentence_index: sentenceIndex
  };
}

function normalizePhenotypeRow(row, validIds) {
  const qualifiers = row?.qualifiers && typeof row.qualifiers === 'object' ? row.qualifiers : {};
  return {
    assertion_local_id: String(row?.assertion_local_id || '').trim(),
    label_raw: String(row?.label_raw || '').trim(),
    status: ALLOWED_STATUSES.has(row?.status) ? row.status : 'present',
    clinical_role: ALLOWED_CLINICAL_ROLES.has(row?.clinical_role) ? row.clinical_role : 'primary',
    evidence_sentence_ids: uniqueSentenceRefs(row?.evidence_sentence_ids, validIds),
    qualifiers: Object.fromEntries(
      PHENOTYPE_QUALIFIER_KEYS.map((key) => [key, toNullableString(qualifiers[key])])
    )
  };
}

function normalizeAncillaryRow(row, validIds) {
  const qualifiers = row?.qualifiers && typeof row.qualifiers === 'object' ? row.qualifiers : {};
  return {
    ancillary_local_id: String(row?.ancillary_local_id || '').trim(),
    domain: ALLOWED_ANCILLARY_DOMAINS.has(row?.domain) ? row.domain : 'other',
    finding_raw: String(row?.finding_raw || '').trim(),
    status: ALLOWED_STATUSES.has(row?.status) ? row.status : 'present',
    evidence_sentence_ids: uniqueSentenceRefs(row?.evidence_sentence_ids, validIds),
    related_phenotype_assertion_ids: [...new Set((Array.isArray(row?.related_phenotype_assertion_ids) ? row.related_phenotype_assertion_ids : []).map((value) => String(value || '').trim()).filter(Boolean))],
    qualifiers: Object.fromEntries(ANCILLARY_QUALIFIER_KEYS.map((key) => [key, toNullableString(qualifiers[key])]))
  };
}

function normalizeContextRow(row, validIds) {
  const fieldName = String(row?.field_name || '').trim();
  if (!CONTEXT_FIELDS.has(fieldName)) return null;
  return {
    context_local_id: String(row?.context_local_id || '').trim(),
    field_name: fieldName,
    value: String(row?.value || '').trim(),
    evidence_sentence_ids: uniqueSentenceRefs(row?.evidence_sentence_ids, validIds)
  };
}

function normalizeTrajectoryRow(row, validIds) {
  return {
    trajectory_local_id: String(row?.trajectory_local_id || '').trim(),
    stage_order: Number.isFinite(Number(row?.stage_order)) ? Number(row.stage_order) : 0,
    age_window: String(row?.age_window || '').trim(),
    summary: String(row?.summary || '').trim(),
    manifestation_labels: [...new Set((Array.isArray(row?.manifestation_labels) ? row.manifestation_labels : []).map((value) => String(value || '').trim()).filter(Boolean))],
    evidence_sentence_ids: uniqueSentenceRefs(row?.evidence_sentence_ids, validIds)
  };
}

function normalizeNoteRow(row, validIds) {
  return {
    note_local_id: String(row?.note_local_id || '').trim(),
    decision: String(row?.decision || '').trim(),
    rationale: String(row?.rationale || '').trim(),
    evidence_sentence_ids: uniqueSentenceRefs(row?.evidence_sentence_ids, validIds)
  };
}

function validateNonEmptyRows(rows, requiredKeys, rowType) {
  for (const row of rows) {
    for (const key of requiredKeys) {
      const value = row[key];
      if (Array.isArray(value) && value.length === 0) fail(`${rowType} row has empty ${key}`);
      if (!Array.isArray(value) && typeof value === 'string' && !value.trim()) fail(`${rowType} row has empty ${key}`);
    }
  }
}

function dedupeRows(rows, keyBuilder) {
  const seen = new Set();
  const output = [];
  for (const row of rows) {
    const key = keyBuilder(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(row);
  }
  return output;
}

function mergePassOutputs(passPayloads) {
  return {
    schema_version: SCHEMA_VERSION,
    extraction_policy_version: EXTRACTION_POLICY_VERSION,
    phenotype_assertions: passPayloads.phenotype_assertions || [],
    ancillary_assertions: passPayloads.ancillary_assertions || [],
    context_assertions: passPayloads.context_assertions || [],
    trajectory_assertions: passPayloads.trajectory_assertions || [],
    extraction_notes: passPayloads.extraction_notes || []
  };
}

function normalizeGroundedDiseaseLayer(raw, wrapper) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail('Gemini output is not a JSON object');

  const sentenceIndex = wrapper.sentence_index.map((row) => ({
    sentence_id: String(row?.sentence_id || '').trim(),
    section: row?.section == null ? null : String(row.section),
    text: String(row?.text || '').trim(),
    section_id: row?.section_id == null ? null : String(row.section_id),
    paragraph_id: row?.paragraph_id == null ? null : String(row.paragraph_id),
    char_start: row?.char_start == null ? null : Number(row.char_start),
    char_end: row?.char_end == null ? null : Number(row.char_end)
  }));
  const validIds = new Set(sentenceIndex.map((row) => row.sentence_id).filter(Boolean));

  const normalized = {
    schema_version: SCHEMA_VERSION,
    extraction_policy_version: EXTRACTION_POLICY_VERSION,
    source_document: normalizeSourceDocument(raw.source_document, wrapper, sentenceIndex),
    phenotype_assertions: dedupeRows(
      (Array.isArray(raw.phenotype_assertions) ? raw.phenotype_assertions : []).map((row) =>
        normalizePhenotypeRow(row, validIds)
      ),
      (row) => `${row.assertion_local_id}|${row.label_raw}|${row.status}|${row.clinical_role}|${row.evidence_sentence_ids.join(',')}`
    ),
    ancillary_assertions: dedupeRows(
      (Array.isArray(raw.ancillary_assertions) ? raw.ancillary_assertions : []).map((row) =>
        normalizeAncillaryRow(row, validIds)
      ),
      (row) =>
        `${row.ancillary_local_id}|${row.domain}|${row.finding_raw}|${row.status}|${row.evidence_sentence_ids.join(',')}|${row.related_phenotype_assertion_ids.join(',')}`
    ),
    context_assertions: dedupeRows(
      (Array.isArray(raw.context_assertions) ? raw.context_assertions : []).map((row) =>
        normalizeContextRow(row, validIds)
      ).filter(Boolean),
      (row) => `${row.context_local_id}|${row.field_name}|${row.evidence_sentence_ids.join(',')}`
    ),
    trajectory_assertions: dedupeRows(
      (Array.isArray(raw.trajectory_assertions) ? raw.trajectory_assertions : []).map((row) =>
        normalizeTrajectoryRow(row, validIds)
      ),
      (row) => `${row.trajectory_local_id}|${row.stage_order}|${row.age_window}|${row.evidence_sentence_ids.join(',')}`
    ),
    extraction_notes: dedupeRows(
      (Array.isArray(raw.extraction_notes) ? raw.extraction_notes : []).map((row) =>
        normalizeNoteRow(row, validIds)
      ),
      (row) => `${row.note_local_id}|${row.decision}|${row.evidence_sentence_ids.join(',')}`
    )
  };

  if (raw.schema_version && String(raw.schema_version).trim() !== SCHEMA_VERSION) {
    fail(`Unexpected schema_version: ${String(raw.schema_version).trim()}`);
  }
  if (raw.extraction_policy_version && String(raw.extraction_policy_version).trim() !== EXTRACTION_POLICY_VERSION) {
    fail(`Unexpected extraction_policy_version: ${String(raw.extraction_policy_version).trim()}`);
  }

  validateNonEmptyRows(normalized.phenotype_assertions, ['assertion_local_id', 'label_raw', 'evidence_sentence_ids'], 'phenotype');
  validateNonEmptyRows(normalized.ancillary_assertions, ['ancillary_local_id', 'finding_raw', 'evidence_sentence_ids'], 'ancillary');
  validateNonEmptyRows(normalized.context_assertions, ['context_local_id', 'field_name', 'value', 'evidence_sentence_ids'], 'context');
  validateNonEmptyRows(normalized.trajectory_assertions, ['trajectory_local_id', 'age_window', 'summary', 'evidence_sentence_ids'], 'trajectory');
  validateNonEmptyRows(normalized.extraction_notes, ['note_local_id', 'decision', 'rationale', 'evidence_sentence_ids'], 'note');

  return normalized;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const inputPath = flags.input || DEFAULTS.input;
  const promptPath = flags.prompt || DEFAULTS.prompt;
  const templatePath = flags.template || DEFAULTS.template;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const model = flags.model || DEFAULTS.model;
  const temperature = Number.parseFloat(flags.temperature || `${DEFAULTS.temperature}`);
  const thinkingBudget = Number.parseInt(flags.thinkingBudget || flags['thinking-budget'] || `${DEFAULTS.thinkingBudget}`, 10);
  const pauseMs = Math.max(0, Number.parseInt(flags.pauseMs || `${DEFAULTS.pauseMs}`, 10) || DEFAULTS.pauseMs);
  const apiKey = flags.apiKey || resolveEnvValue(flags.apiKeyEnv, 'GOOGLE_API_KEY', 'GEMINI_API_KEY');

  if (!apiKey) fail('GOOGLE_API_KEY or GEMINI_API_KEY is required.');
  if (!fs.existsSync(promptPath)) fail(`Prompt file not found: ${promptPath}`);
  if (!fs.existsSync(templatePath)) fail(`Template file not found: ${templatePath}`);

  const wrapper = await readJson(inputPath);
  ensureWrapperShape(wrapper, inputPath);
  const prompt = fs.readFileSync(promptPath, 'utf8').trim();
  const template = await readJson(templatePath);
  const titleSlug = slugify(wrapper.chapter.title || path.basename(inputPath, '.json')).toLowerCase() || 'chapter';
  const nbkId = String(wrapper.chapter.nbk_id || '').trim() || path.basename(inputPath, '.json');
  const runDir = path.join(outputDir, `${nbkId}_${titleSlug}`);

  await ensureDir(runDir);

  const outputPath = path.join(runDir, `${nbkId}_${titleSlug}_grounded_disease_layer.json`);
  const passPayloads = {};
  const passMeta = {};

  for (let index = 0; index < PASS_DEFINITIONS.length; index += 1) {
    const pass = PASS_DEFINITIONS[index];
    const passPrompt = buildScopedPassPrompt(prompt, template, pass);
    const promptSnapshotPath = path.join(runDir, `${nbkId}_${titleSlug}_${pass.outputFileSuffix}_system_prompt.txt`);
    const rawOutputPath = path.join(runDir, `${nbkId}_${titleSlug}_${pass.outputFileSuffix}_raw_text.txt`);
    const partialJsonPath = path.join(runDir, `${nbkId}_${titleSlug}_${pass.outputFileSuffix}.json`);
    const partialMetaPath = path.join(runDir, `${nbkId}_${titleSlug}_${pass.outputFileSuffix}_meta.json`);

    console.log(`[${index + 1}/${PASS_DEFINITIONS.length}] ${pass.key}`);

    const result = await callGeminiJson({
      apiKey,
      model,
      systemPrompt: passPrompt,
      userPayload: wrapper,
      temperature: Number.isFinite(temperature) ? temperature : DEFAULTS.temperature,
      thinkingBudget: Number.isFinite(thinkingBudget) ? thinkingBudget : DEFAULTS.thinkingBudget
    });

    await writeText(promptSnapshotPath, passPrompt);
    await writeText(rawOutputPath, result.rawOutput || '');
    await writeJson(partialMetaPath, {
      input: inputPath,
      prompt: promptPath,
      template: templatePath,
      pass: pass.key,
      model,
      temperature: Number.isFinite(temperature) ? temperature : DEFAULTS.temperature,
      thinkingBudget: Number.isFinite(thinkingBudget) ? thinkingBudget : DEFAULTS.thinkingBudget,
      parsed: result.parsed != null,
      usage: result.usage || null
    });

    if (!result.parsed || typeof result.parsed !== 'object' || Array.isArray(result.parsed)) {
      fail(`Gemini returned non-parseable JSON for pass ${pass.key}. Raw output saved to ${rawOutputPath}`);
    }

    const partialPayload = {
      [pass.outputKey]: Array.isArray(result.parsed?.[pass.outputKey]) ? result.parsed[pass.outputKey] : []
    };
    passPayloads[pass.outputKey] = partialPayload[pass.outputKey];
    passMeta[pass.key] = {
      parsed: result.parsed != null,
      usage: result.usage || null,
      output: partialJsonPath
    };
    await writeJson(partialJsonPath, partialPayload);

    if (pauseMs > 0 && index < PASS_DEFINITIONS.length - 1) {
      await sleep(pauseMs);
    }
  }

  const merged = mergePassOutputs(passPayloads);
  const normalized = normalizeGroundedDiseaseLayer(merged, wrapper);
  await writeJson(outputPath, normalized);
  await writeJson(path.join(runDir, `${nbkId}_${titleSlug}_meta.json`), {
    input: inputPath,
    prompt: promptPath,
    template: templatePath,
    model,
    strategy: 'task_scoped_multipass',
    pass_count: PASS_DEFINITIONS.length,
    temperature: Number.isFinite(temperature) ? temperature : DEFAULTS.temperature,
    thinkingBudget: Number.isFinite(thinkingBudget) ? thinkingBudget : DEFAULTS.thinkingBudget,
    pauseMs,
    passes: passMeta
  });

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        input: inputPath,
        prompt: promptPath,
        model,
        strategy: 'task_scoped_multipass',
        output: outputPath,
        phenotype_count: normalized.phenotype_assertions.length,
        ancillary_count: normalized.ancillary_assertions.length,
        context_count: normalized.context_assertions.length,
        trajectory_count: normalized.trajectory_assertions.length,
        note_count: normalized.extraction_notes.length
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

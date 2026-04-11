import path from 'node:path';
import {
  callGeminiJson,
  ensureDir,
  normalizeText,
  parseArgs,
  readJson,
  sleep,
  writeJson,
  writeText
} from '../lib/genereviewsPipeline.js';

const DEFAULTS = Object.freeze({
  input:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/opus-11-20-inputs/NBK618356_zhu_tokita_takenouchi_kim_syndrome_opus_input.json',
  outputDir:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws',
  model: 'gemini-3.1-pro-preview',
  temperature: 0.1,
  thinkingBudget: 65535,
  pauseMs: 800,
  compareOneShot:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK618356_zhu_tokita_takenouchi_kim_syndrome_gemini31_raw.json',
  comparePreferred:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK618356_zhu_tokita_takenouchi_kim_syndrome_complemented_raw.json'
});

const QUALIFIER_KEYS = Object.freeze([
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

const ANCILLARY_BUCKETS = Object.freeze([
  'laboratory',
  'imaging',
  'pathology',
  'electrophysiology',
  'treatment_response',
  'clinical_test',
  'management_context',
  'other'
]);

const CONTEXT_KEYS = Object.freeze([
  'onset',
  'inheritance',
  'gene',
  'prevalence',
  'prognosis',
  'natural_history',
  'family_risk',
  'founder_variant',
  'biomarker',
  'therapeutic_landscape'
]);

const CONTEXT_NOTE_LIMIT = 5;

const PASSES = Object.freeze([
  {
    key: 'present',
    outputSuffix: 'present',
    prompt: `You are extracting only core present phenotype rows from indexed GeneReviews chapter text.

Return EXACTLY this JSON shape and nothing else:
{
  "phenotypes": {
    "present": [
      {
        "label": "string",
        "clinical_role": "primary | complication | descriptor",
        "evidence_refs": ["p1_s1"],
        "qualifiers": {
          "onset": null,
          "frequency": null,
          "severity": null,
          "progression": null,
          "trigger": null,
          "treatment_response": null,
          "pathophysiology": null,
          "laterality": null,
          "distribution": null,
          "anatomical_site": null,
          "morphology": null,
          "subtype_context": null
        }
      }
    ]
  }
}

NON-NEGOTIABLE RULES
- Output only phenotypes.present. Do not return excluded, uncertain, ancillary, or context fields.
- Use only sentence IDs provided in the input sentence_index.
- Prefer conservative syndrome-level manifestations that are described as general disease findings.
- Do not place lab findings, imaging findings, test findings, inheritance, gene, prevalence, prognosis, management, or treatment into phenotypes.
- Do not promote one-off case reports or single-individual severe complications into present.
- For list-style dysmorphology or long anatomy enumerations, prefer omission here unless the feature is independently characterized as a recurring syndrome manifestation.
- If unsure whether a row belongs in present, omit it.

CHAPTER-SPECIFIC BIAS FOR THIS RUN
- Keep generalized neurodevelopmental findings, hypotonia, feeding difficulties, speech delay, seizures, growth findings, recurrent infections, structural heart anomalies, common ophthalmologic findings, major GI findings, and clearly generalized endocrine findings.
- Do not include MRI/radiographic findings here.
- Do not include immunoglobulin deficiencies or thrombocytopenia here.
- Do not include prognosis or lifespan statements here.`
  },
  {
    key: 'uncertain',
    outputSuffix: 'uncertain',
    prompt: `You are extracting only non-core or uncertain phenotype rows from indexed GeneReviews chapter text.

Return EXACTLY this JSON shape and nothing else:
{
  "phenotypes": {
    "excluded": [],
    "uncertain": [
      {
        "label": "string",
        "clinical_role": "primary | complication | descriptor",
        "evidence_refs": ["p1_s1"],
        "qualifiers": {
          "onset": null,
          "frequency": null,
          "severity": null,
          "progression": null,
          "trigger": null,
          "treatment_response": null,
          "pathophysiology": null,
          "laterality": null,
          "distribution": null,
          "anatomical_site": null,
          "morphology": null,
          "subtype_context": null
        }
      }
    ]
  }
}

NON-NEGOTIABLE RULES
- Output only phenotypes.excluded and phenotypes.uncertain.
- Use only sentence IDs provided in the input sentence_index.
- Leave excluded empty unless there is an explicit negation sentence.
- Use uncertain for thinly documented, list-only, case-report, one-individual, or subgroup-only findings.
- Do not include lab findings, imaging findings, test findings, inheritance, gene, prevalence, prognosis, management, or treatment.
- Prefer aggregated uncertain rows over exploding every single small facial or distal limb feature into separate rows.

CHAPTER-SPECIFIC BIAS FOR THIS RUN
- Uncertain is appropriate for long craniofacial enumerations, skeletal enumerations, genitourinary enumerations, seizure subtype lists, movement-disorder details, hearing loss from one report, hemiplegic migraine from one individual, and downstream severe complications.
- If unsure whether something should be uncertain or omitted, choose uncertain only if it is a real phenotype finding; otherwise omit it.`
  },
  {
    key: 'ancillary',
    outputSuffix: 'ancillary',
    prompt: `You are extracting only ancillary clinical evidence from indexed GeneReviews chapter text.

Return EXACTLY this JSON shape and nothing else:
{
  "ancillary_clinical_evidence": {
    "laboratory": [
      {
        "finding": "string",
        "assertion": "present | absent | uncertain",
        "evidence_refs": ["p1_s1"]
      }
    ],
    "imaging": [],
    "pathology": [],
    "electrophysiology": [],
    "treatment_response": [],
    "clinical_test": [],
    "management_context": [],
    "other": []
  }
}

NON-NEGOTIABLE RULES
- Output only ancillary_clinical_evidence.
- Every ancillary item must be an object with finding, assertion, and evidence_refs.
- Use only sentence IDs provided in the input sentence_index.
- Do not return phenotype rows.
- Route MRI findings and radiographic findings to imaging.
- Route immunoglobulin deficiencies, thrombocytopenia, and similar measurement/state findings to laboratory.
- Do not include inheritance, gene, prevalence, prognosis, or management recommendations.
- Do not use plain strings for imaging or any other ancillary bucket.

CHAPTER-SPECIFIC BIAS FOR THIS RUN
- Brain MRI abnormalities and radiographic skeletal findings belong in imaging.
- Immunoglobulin A deficiency, immunoglobulin G deficiency, and thrombocytopenia belong in laboratory.
- Leave treatment_response empty unless the chapter explicitly states response to a treatment in the disease course text.`
  },
  {
    key: 'context',
    outputSuffix: 'context',
    prompt: `You are extracting only context metadata from indexed GeneReviews chapter text.

Return EXACTLY this JSON shape and nothing else:
{
  "context_metadata": {
    "onset": "",
    "inheritance": "",
    "gene": "",
    "prevalence": "",
    "prognosis": "",
    "natural_history": "",
    "family_risk": "",
    "founder_variant": "",
    "biomarker": "",
    "therapeutic_landscape": ""
  },
  "context_evidence_refs": {
    "onset": [],
    "inheritance": [],
    "gene": [],
    "prevalence": [],
    "prognosis": [],
    "natural_history": [],
    "family_risk": [],
    "founder_variant": [],
    "biomarker": [],
    "therapeutic_landscape": []
  },
  "context_notes": []
}

NON-NEGOTIABLE RULES
- Output only context_metadata, context_evidence_refs, and context_notes.
- Use only sentence IDs provided in the input sentence_index.
- Every non-empty context_metadata field must have at least one matching evidence ref.
- Leave a field empty if the chapter text in this input surface does not support it.
- Do not move phenotype, ancillary, lab, imaging, or treatment rows into context.
- context_notes should be brief, factual, and optional.

CHAPTER-SPECIFIC BIAS FOR THIS RUN
- Inheritance for this chapter is that it is typically caused by a de novo pathogenic variant and most probands are simplex.
- Gene is SON.
- Prevalence may use the approximate reported case counts if directly stated.
- Prognosis/natural history should remain conservative because the chapter explicitly says longitudinal data are sparse and prognosis is not uniformly severe or lethal.
- Founder variant and biomarker should likely stay empty unless clearly stated in the provided text.`
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

function createEmptyQualifiers() {
  return Object.fromEntries(QUALIFIER_KEYS.map((key) => [key, null]));
}

function uniqueRefs(refs) {
  return [...new Set((Array.isArray(refs) ? refs : []).filter((value) => typeof value === 'string' && value.trim()))];
}

function normalizePhenotypeRow(row) {
  const qualifiers = row?.qualifiers && typeof row.qualifiers === 'object' ? row.qualifiers : {};
  return {
    label: String(row?.label || '').trim(),
    clinical_role: ['primary', 'complication', 'descriptor'].includes(row?.clinical_role) ? row.clinical_role : 'primary',
    evidence_refs: uniqueRefs(row?.evidence_refs),
    qualifiers: {
      ...createEmptyQualifiers(),
      ...Object.fromEntries(
        QUALIFIER_KEYS.map((key) => {
          const value = qualifiers[key];
          return [key, value == null || value === '' ? null : String(value)];
        })
      )
    }
  };
}

function normalizeAncillaryEntry(entry) {
  return {
    finding: String(entry?.finding || '').trim(),
    assertion: ['present', 'absent', 'uncertain'].includes(entry?.assertion) ? entry.assertion : 'present',
    evidence_refs: uniqueRefs(entry?.evidence_refs)
  };
}

function dedupePhenotypeRows(rows) {
  const seen = new Set();
  const output = [];
  for (const row of rows.map(normalizePhenotypeRow)) {
    if (!row.label || row.evidence_refs.length === 0) continue;
    const key = `${normalizeText(row.label)}|${row.clinical_role}|${row.evidence_refs.join(',')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(row);
  }
  return output;
}

function dedupeAncillaryEntries(entries) {
  const seen = new Set();
  const output = [];
  for (const entry of entries.map(normalizeAncillaryEntry)) {
    if (!entry.finding || entry.evidence_refs.length === 0) continue;
    const key = `${normalizeText(entry.finding)}|${entry.assertion}|${entry.evidence_refs.join(',')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(entry);
  }
  return output;
}

function normalizeContextPayload(payload) {
  const contextMetadata = payload?.context_metadata && typeof payload.context_metadata === 'object' ? payload.context_metadata : {};
  const contextEvidenceRefs =
    payload?.context_evidence_refs && typeof payload.context_evidence_refs === 'object' ? payload.context_evidence_refs : {};
  return {
    context_metadata: Object.fromEntries(
      CONTEXT_KEYS.map((key) => [key, contextMetadata[key] == null ? '' : String(contextMetadata[key]).trim()])
    ),
    context_evidence_refs: Object.fromEntries(CONTEXT_KEYS.map((key) => [key, uniqueRefs(contextEvidenceRefs[key])])),
    context_notes: (Array.isArray(payload?.context_notes) ? payload.context_notes : [])
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .slice(0, CONTEXT_NOTE_LIMIT)
  };
}

function mergePassOutputs({ chapter, passResults }) {
  const present = dedupePhenotypeRows(passResults.present?.parsed?.phenotypes?.present || []);
  const excluded = dedupePhenotypeRows(passResults.uncertain?.parsed?.phenotypes?.excluded || []);
  const uncertain = dedupePhenotypeRows(passResults.uncertain?.parsed?.phenotypes?.uncertain || []);
  const ancillaryRaw =
    passResults.ancillary?.parsed?.ancillary_clinical_evidence &&
    typeof passResults.ancillary.parsed.ancillary_clinical_evidence === 'object'
      ? passResults.ancillary.parsed.ancillary_clinical_evidence
      : {};
  const ancillary = Object.fromEntries(
    ANCILLARY_BUCKETS.map((bucket) => [bucket, dedupeAncillaryEntries(ancillaryRaw[bucket] || [])])
  );
  const context = normalizeContextPayload(passResults.context?.parsed || {});

  return {
    chapter,
    phenotypes: {
      present,
      excluded,
      uncertain
    },
    ancillary_clinical_evidence: ancillary,
    context_metadata: context.context_metadata,
    context_evidence_refs: context.context_evidence_refs,
    context_notes: context.context_notes
  };
}

function buildLabelSet(rows, field = 'label') {
  return new Set(
    (Array.isArray(rows) ? rows : [])
      .map((row) => normalizeText(row?.[field] || ''))
      .filter(Boolean)
  );
}

function compareSets(candidate, reference) {
  const overlap = [...candidate].filter((value) => reference.has(value));
  return {
    candidate_count: candidate.size,
    reference_count: reference.size,
    overlap_count: overlap.length,
    precision: candidate.size ? overlap.length / candidate.size : 0,
    recall: reference.size ? overlap.length / reference.size : 0,
    overlap: overlap.sort(),
    candidate_only: [...candidate].filter((value) => !reference.has(value)).sort(),
    reference_only: [...reference].filter((value) => !candidate.has(value)).sort()
  };
}

function gatherInvalidAncillaryShape(raw) {
  const ancillary = raw?.ancillary_clinical_evidence;
  if (!ancillary || typeof ancillary !== 'object') return [];
  const problems = [];
  for (const bucket of ANCILLARY_BUCKETS) {
    const items = ancillary[bucket];
    if (!Array.isArray(items)) continue;
    if (items.some((item) => typeof item === 'string')) problems.push(bucket);
  }
  return problems;
}

function analyzeModelAgainstPreferred(modelRaw, preferredRaw) {
  const modelPresent = buildLabelSet(modelRaw?.phenotypes?.present);
  const preferredPresent = buildLabelSet(preferredRaw?.phenotypes?.present);
  const modelUncertain = buildLabelSet(modelRaw?.phenotypes?.uncertain);
  const preferredUncertain = buildLabelSet(preferredRaw?.phenotypes?.uncertain);
  const preferredAncillaryLab = new Set([
    ...buildLabelSet(preferredRaw?.ancillary_clinical_evidence?.laboratory, 'finding'),
    ...buildLabelSet(preferredRaw?.ancillary_clinical_evidence?.clinical_test, 'finding')
  ]);
  const presentLabLeakLabels = [...modelPresent].filter((label) => preferredAncillaryLab.has(label)).sort();
  return {
    present_vs_preferred: compareSets(modelPresent, preferredPresent),
    uncertain_vs_preferred: compareSets(modelUncertain, preferredUncertain),
    present_lab_leaks_against_preferred_ancillary: presentLabLeakLabels,
    invalid_ancillary_string_buckets: gatherInvalidAncillaryShape(modelRaw)
  };
}

async function runPass({ pass, apiKey, model, userPayload, temperature, thinkingBudget }) {
  const result = await callGeminiJson({
    apiKey,
    model,
    systemPrompt: pass.prompt,
    userPayload,
    temperature,
    thinkingBudget
  });
  return result;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const inputPath = flags.input || DEFAULTS.input;
  const outputDir = flags.output || DEFAULTS.outputDir;
  const model = flags.model || DEFAULTS.model;
  const temperature = Number.parseFloat(flags.temperature || `${DEFAULTS.temperature}`) || DEFAULTS.temperature;
  const thinkingBudget =
    Number.parseInt(flags['thinking-budget'] || flags.thinkingBudget || `${DEFAULTS.thinkingBudget}`, 10) ||
    DEFAULTS.thinkingBudget;
  const pauseMs = Math.max(0, Number.parseInt(flags.pauseMs || `${DEFAULTS.pauseMs}`, 10) || DEFAULTS.pauseMs);
  const compareOneShotPath = flags.compareOneShot || DEFAULTS.compareOneShot;
  const comparePreferredPath = flags.comparePreferred || DEFAULTS.comparePreferred;
  const apiKey = flags.apiKey || resolveEnvValue(flags.apiKeyEnv, 'GOOGLE_API_KEY', 'GEMINI_API_KEY');

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is required.');
  }

  const wrapper = await readJson(inputPath);
  if (!wrapper?.chapter || !Array.isArray(wrapper?.sentence_index)) {
    throw new Error(`Invalid wrapper input: ${inputPath}`);
  }

  const nbkId = String(wrapper.chapter.nbk_id || '').trim() || path.basename(inputPath, '.json');
  const baseName =
    `${nbkId}_${String(wrapper.chapter.title || 'chapter')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 100)}` || nbkId;
  const prefix = path.join(outputDir, `${baseName}_gemini31_multipass`);
  await ensureDir(outputDir);

  const passResults = {};
  for (let index = 0; index < PASSES.length; index += 1) {
    const pass = PASSES[index];
    console.log(`[${index + 1}/${PASSES.length}] ${pass.key}`);
    const result = await runPass({
      pass,
      apiKey,
      model,
      userPayload: wrapper,
      temperature,
      thinkingBudget
    });
    passResults[pass.key] = result;
    await writeJson(`${prefix}_${pass.outputSuffix}.json`, result.parsed);
    await writeText(`${prefix}_${pass.outputSuffix}_raw_text.txt`, result.rawOutput || '');
    await writeJson(`${prefix}_${pass.outputSuffix}_meta.json`, {
      usage: result.usage || null,
      parsed: result.parsed != null
    });
    if (pauseMs > 0 && index < PASSES.length - 1) {
      await sleep(pauseMs);
    }
  }

  const merged = mergePassOutputs({
    chapter: wrapper.chapter,
    passResults
  });

  await writeJson(`${prefix}_merged.json`, merged);

  const oneShotRaw = await readJson(compareOneShotPath, null);
  const preferredRaw = await readJson(comparePreferredPath, null);
  const comparison = {
    model: model,
    thinkingBudget,
    chapter: wrapper.chapter,
    files: {
      input: inputPath,
      compare_one_shot: compareOneShotPath,
      compare_preferred: comparePreferredPath,
      merged: `${prefix}_merged.json`
    },
    usage_by_pass: Object.fromEntries(
      Object.entries(passResults).map(([key, value]) => [key, value.usage || null])
    ),
    parsed_by_pass: Object.fromEntries(
      Object.entries(passResults).map(([key, value]) => [key, value.parsed != null])
    ),
    one_shot_vs_preferred: oneShotRaw ? analyzeModelAgainstPreferred(oneShotRaw, preferredRaw) : null,
    multipass_vs_preferred: preferredRaw ? analyzeModelAgainstPreferred(merged, preferredRaw) : null
  };

  await writeJson(`${prefix}_comparison.json`, comparison);
  console.log(JSON.stringify(comparison, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

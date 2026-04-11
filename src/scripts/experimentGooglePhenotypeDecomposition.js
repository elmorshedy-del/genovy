import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  ensureDir,
  parseArgs,
  readJson,
  writeJson
} from '../lib/genereviewsPipeline.js';
import { runSchemaGuardedPhenotypeDetailDecomposition } from '../lib/phenotypeDetailDecomposition.js';

const execFileAsync = promisify(execFile);

const DEFAULTS = Object.freeze({
  model: 'gemini-2.5-flash',
  output:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/google-phenotype-decomposition-20260406/google_structured_vs_healthcare.json',
  googleCloudProject: 'codex-autosave-backup',
  googleCloudLocation: 'us-central1',
  cases: [
    'severe distal muscle weakness',
    'progressive sensorineural hearing loss',
    'childhood-onset bilateral sensorineural hearing loss',
    'recurrent seizures triggered by fever',
    'exercise-induced muscle weakness',
    'marked distal lower-limb weakness',
    'sensory defensiveness'
  ]
});

function usage() {
  return [
    'Usage:',
    '  node src/scripts/experimentGooglePhenotypeDecomposition.js [--cases-json <cases.json>] [--output <output.json>] [--model <gemini-model>] [--google-cloud-project <project>] [--google-cloud-location <location>]'
  ].join('\n');
}

function resolveEnvValue(...names) {
  for (const name of names) {
    if (!name) continue;
    const value = process.env[name];
    if (value) return value;
  }
  return '';
}

function buildHealthcareSentence(input) {
  const sourceValue =
    typeof input === 'object' && input !== null
      ? input.source_sentence || input.candidate_label || input.label || ''
      : input;
  const trimmed = String(sourceValue || '').trim();
  if (!trimmed) return '';
  if (/[.!?]$/.test(trimmed)) return trimmed;
  return `The patient has ${trimmed}.`;
}

function coerceCases(payload) {
  const values = Array.isArray(payload) ? payload : Array.isArray(payload?.cases) ? payload.cases : [];
  return values
    .map((value, index) => {
      if (typeof value === 'string') {
        const candidateLabel = String(value || '').trim();
        if (!candidateLabel) return null;
        return {
          candidate_label: candidateLabel,
          sentence_id: `case_${index + 1}`,
          paragraph_id: `case_p${index + 1}`,
          paragraph_index: index + 1,
          section_id: 'experiment_cases',
          section_heading: 'Experiment Cases',
          source_sentence: buildHealthcareSentence(candidateLabel)
        };
      }
      if (value && typeof value === 'object') {
        const candidateLabel = String(value.candidate_label || value.label || '').trim();
        if (!candidateLabel) return null;
        return {
          candidate_label: candidateLabel,
          sentence_id: String(value.sentence_id || `case_${index + 1}`).trim(),
          paragraph_id: String(value.paragraph_id || `case_p${index + 1}`).trim(),
          paragraph_index: value.paragraph_index ?? index + 1,
          section_id: String(value.section_id || 'experiment_cases').trim(),
          section_heading: String(value.section_heading || 'Experiment Cases').trim(),
          source_sentence: String(value.source_sentence || buildHealthcareSentence(candidateLabel)).trim()
        };
      }
      return null;
    })
    .filter(Boolean);
}

function resolveModelThinkingBudget(model) {
  const normalized = String(model || '').trim();
  if (normalized === 'gemini-3.1-pro-preview' || normalized === 'gemini-3-pro-preview') {
    return 128;
  }
  return 0;
}

async function resolveGoogleAccessToken() {
  const explicit =
    resolveEnvValue('GOOGLE_CLOUD_ACCESS_TOKEN', 'GOOGLE_HEALTHCARE_ACCESS_TOKEN') || '';
  if (explicit) return explicit;

  const commandCandidates = [
    ['auth', 'print-access-token'],
    ['auth', 'application-default', 'print-access-token']
  ];

  for (const args of commandCandidates) {
    try {
      const { stdout } = await execFileAsync('gcloud', args, { maxBuffer: 1024 * 1024 });
      const token = String(stdout || '').trim();
      if (token) return token;
    } catch {
      // try next token source
    }
  }

  throw new Error('Unable to resolve a Google access token.');
}

async function callGoogleHealthcareAnalyzeEntities({ accessToken, service, documentContent }) {
  const response = await fetch(`https://healthcare.googleapis.com/v1/${service}:analyzeEntities`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      documentContent,
      licensedVocabularies: [],
      alternativeOutputFormat: 'ALTERNATIVE_OUTPUT_FORMAT_UNSPECIFIED'
    })
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(`Google Healthcare API error ${response.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

function simplifyHealthcareResponse(documentContent, response) {
  const mentions = Array.isArray(response?.entityMentions)
    ? response.entityMentions.map((mention) => ({
        mention_id: mention.mentionId || null,
        text: mention.text?.content || '',
        type: mention.type || '',
        confidence: mention.confidence ?? null,
        linked_entity_ids: Array.isArray(mention.linkedEntities)
          ? mention.linkedEntities.map((linked) => linked.entityId).filter(Boolean)
          : []
      }))
    : [];

  const mentionById = new Map(mentions.map((mention) => [mention.mention_id, mention]));
  const entities = Array.isArray(response?.entities)
    ? response.entities.map((entity) => ({
        entity_id: entity.entityId || null,
        preferred_term: entity.preferredTerm || '',
        vocabulary_codes: Array.isArray(entity.vocabularyCodes) ? entity.vocabularyCodes : []
      }))
    : [];
  const entityById = new Map(entities.map((entity) => [entity.entity_id, entity]));

  const relations = Array.isArray(response?.relationships)
    ? response.relationships.map((relation) => {
        const subject = mentionById.get(relation.subjectId) || null;
        const object = mentionById.get(relation.objectId) || null;
        return {
          subject_id: relation.subjectId || null,
          subject_text: subject?.text || null,
          subject_type: subject?.type || null,
          object_id: relation.objectId || null,
          object_text: object?.text || null,
          object_type: object?.type || null,
          confidence: relation.confidence ?? null
        };
      })
    : [];

  return {
    document_content: documentContent,
    mentions,
    relations,
    entities,
    problems: mentions
      .filter((mention) => mention.type === 'PROBLEM')
      .map((mention) => ({
        text: mention.text,
        confidence: mention.confidence,
        linked_entities: mention.linked_entity_ids.map((entityId) => entityById.get(entityId)).filter(Boolean)
      })),
    attached_modifiers: relations
      .filter((relation) => relation.subject_type === 'PROBLEM' && relation.object_type && relation.object_type !== 'PROBLEM')
      .map((relation) => ({
        problem_text: relation.subject_text,
        modifier_type: relation.object_type,
        modifier_text: relation.object_text,
        confidence: relation.confidence
      }))
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const apiKey = flags.apiKey || resolveEnvValue(flags.apiKeyEnv, 'GOOGLE_API_KEY', 'GEMINI_API_KEY');
  if (!apiKey) throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is required.');

  const cases = flags['cases-json']
    ? coerceCases(await readJson(flags['cases-json']))
    : DEFAULTS.cases;
  if (!cases.length) throw new Error(`No cases supplied.\n${usage()}`);

  const model = String(flags.model || DEFAULTS.model).trim();
  const outputPath = String(flags.output || DEFAULTS.output).trim();
  const googleCloudProject = String(flags['google-cloud-project'] || DEFAULTS.googleCloudProject).trim();
  const googleCloudLocation = String(flags['google-cloud-location'] || DEFAULTS.googleCloudLocation).trim();
  const healthcareService = `projects/${googleCloudProject}/locations/${googleCloudLocation}/services/nlp`;

  const geminiRun = await runSchemaGuardedPhenotypeDetailDecomposition({
    apiKey,
    model,
    temperature: 0,
    thinkingBudget: resolveModelThinkingBudget(model),
    cases
  });

  const geminiResults = Array.isArray(geminiRun.normalized?.results) ? geminiRun.normalized.results : [];
  const geminiByInput = new Map(geminiResults.map((row) => [String(row.candidate_label || '').trim(), row]));

  const accessToken = await resolveGoogleAccessToken();
  const combinedResults = [];
  for (const input of cases) {
    const documentContent = buildHealthcareSentence(input);
    const healthcareResponse = await callGoogleHealthcareAnalyzeEntities({
      accessToken,
      service: healthcareService,
      documentContent
    });

    combinedResults.push({
      input: input.candidate_label,
      source_location: {
        sentence_id: input.sentence_id,
        paragraph_id: input.paragraph_id,
        paragraph_index: input.paragraph_index,
        section_id: input.section_id,
        section_heading: input.section_heading
      },
      gemini: geminiByInput.get(input.candidate_label) || null,
      healthcare: simplifyHealthcareResponse(documentContent, healthcareResponse)
    });
  }

  await ensureDir(path.dirname(outputPath));
  await writeJson(outputPath, {
    created_at: new Date().toISOString(),
    stage: 'google_phenotype_decomposition_experiment',
    model,
    healthcare_service: healthcareService,
    case_count: combinedResults.length,
    gemini_usage: geminiRun.primary?.usage || null,
    gemini_repaired_usage: geminiRun.repaired?.usage || null,
    gemini_validation_issues: geminiRun.normalized?.issues || [],
    raw_gemini_output: geminiRun.primary?.rawOutput || '',
    results: combinedResults
  });

  console.log(`Wrote Google decomposition experiment: ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

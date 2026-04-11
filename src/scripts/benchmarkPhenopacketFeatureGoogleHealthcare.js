import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ensureDir, normalizeText, parseArgs, readJson, writeJson } from '../lib/genereviewsPipeline.js';

const execFileAsync = promisify(execFile);

const DEFAULTS = Object.freeze({
  fixture:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/phenotypeDetailDecompositionBenchmark.json',
  output:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/google-phenotype-decomposition-20260406/google_healthcare_phenopacket_feature_benchmark.json',
  googleCloudProject: 'codex-autosave-backup',
  googleCloudLocation: 'us-central1'
});

function normalizeForCompare(value) {
  return normalizeText(value).replace(/\s+/g, ' ').trim();
}

function matchesAcceptedOption(value, acceptedOptions) {
  const normalized = normalizeForCompare(value);
  return (acceptedOptions || []).some((option) => normalizeForCompare(option) === normalized);
}

async function resolveGoogleAccessToken() {
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
      // try next source
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

function buildMentionTable(response) {
  return (response?.entityMentions || []).map((mention, index) => ({
    order: index,
    mention_id: mention.mentionId || null,
    text: mention.text?.content || '',
    type: mention.type || '',
    confidence: mention.confidence ?? 0,
    linked_entity_ids: Array.isArray(mention.linkedEntities)
      ? mention.linkedEntities.map((linked) => linked.entityId).filter(Boolean)
      : []
  }));
}

function buildRelationTable(response, mentionsById) {
  return (response?.relationships || []).map((relation) => {
    const subject = mentionsById.get(relation.subjectId) || null;
    const object = mentionsById.get(relation.objectId) || null;
    return {
      subject_id: relation.subjectId || null,
      subject_text: subject?.text || '',
      subject_type: subject?.type || '',
      object_id: relation.objectId || null,
      object_text: object?.text || '',
      object_type: object?.type || '',
      confidence: relation.confidence ?? 0
    };
  });
}

function selectPrimaryProblem(mentions) {
  return mentions.find((mention) => mention.type === 'PROBLEM') || null;
}

function maybeSplitAnatomicalModifier(text) {
  const normalized = String(text || '').trim();
  const match = normalized.match(/^(distal|proximal|central|peripheral|focal|diffuse)\s+(.+)$/i);
  if (!match) {
    return {
      distribution: null,
      anatomical_subsite: normalized || null
    };
  }

  return {
    distribution: match[1],
    anatomical_subsite: match[2]
  };
}

function buildPhenopacketFeature(caseDef, mentions, relations) {
  const primaryProblem = selectPrimaryProblem(mentions);
  const attachedRelations = primaryProblem
    ? relations.filter((relation) => relation.subject_id === primaryProblem.mention_id)
    : [];

  const feature = {
    type: {
      id: null,
      label: primaryProblem?.text || caseDef.candidate_label
    },
    excluded: false,
    severity: null,
    onset: null,
    modifiers: [],
    evidence: {
      evidence_text: caseDef.candidate_label,
      source_sentence: caseDef.source_sentence || `The patient has ${caseDef.candidate_label}.`,
      evidence_scope: caseDef.sentence_id ? 'sentence' : caseDef.paragraph_id ? 'paragraph' : caseDef.section_id ? 'section' : 'label_only',
      sentence_id: caseDef.sentence_id || null,
      paragraph_id: caseDef.paragraph_id || null,
      paragraph_index: caseDef.paragraph_index ?? null,
      section_id: caseDef.section_id || null,
      section_heading: caseDef.section_heading || null
    }
  };

  for (const relation of attachedRelations) {
    if (relation.object_type === 'SEVERITY') {
      feature.severity = { label: relation.object_text };
      continue;
    }

    if (relation.object_type === 'ANATOMICAL_STRUCTURE') {
      const split = maybeSplitAnatomicalModifier(relation.object_text);
      if (split.distribution) {
        feature.modifiers.push({
          modifier_kind: 'distribution',
          label: split.distribution,
          evidence_text: relation.object_text
        });
      }
      if (split.anatomical_subsite) {
        feature.modifiers.push({
          modifier_kind: 'anatomical_subsite',
          label: split.anatomical_subsite,
          evidence_text: relation.object_text
        });
      }
    }
  }

  return feature;
}

function scoreFeature(caseDef, result) {
  const feature = result?.phenotypic_feature || {};
  const modifiers = Array.isArray(feature.modifiers) ? feature.modifiers : [];
  const coreProblemMatched = matchesAcceptedOption(
    feature?.type?.label || '',
    Array.isArray(caseDef.accepted_core_problem_options) ? caseDef.accepted_core_problem_options : []
  );

  const expectedDetails = Array.isArray(caseDef.expected_modifier_details) ? caseDef.expected_modifier_details : [];
  const matchedIndexes = new Set();
  let matchedExpectedDetailCount = 0;

  for (const expected of expectedDetails) {
    if (expected.detail_type === 'severity_domain') {
      const severityMatched = matchesAcceptedOption(feature?.severity?.label || '', expected.accepted_value_options || []);
      if (severityMatched) matchedExpectedDetailCount += 1;
      continue;
    }
    if (expected.detail_type === 'temporal_qualifier') {
      const onsetMatched = matchesAcceptedOption(feature?.onset?.label || '', expected.accepted_value_options || []);
      if (onsetMatched) matchedExpectedDetailCount += 1;
      continue;
    }

    const matchedIndex = modifiers.findIndex((modifier, index) => {
      if (matchedIndexes.has(index)) return false;
      if (String(modifier?.modifier_kind || '') !== String(expected.detail_type || '')) return false;
      return matchesAcceptedOption(modifier?.label || '', expected.accepted_value_options || []);
    });

    if (matchedIndex >= 0) {
      matchedIndexes.add(matchedIndex);
      matchedExpectedDetailCount += 1;
    }
  }

  const unexpectedModifiers = modifiers.filter((_, index) => !matchedIndexes.has(index));
  const evidencePresent = Boolean(feature?.evidence?.evidence_text && feature?.evidence?.source_sentence);
  const caseScore =
    (coreProblemMatched ? 1 : 0) +
    matchedExpectedDetailCount / Math.max(1, expectedDetails.length) +
    (evidencePresent ? 0.5 : 0) -
    unexpectedModifiers.length * 0.1;

  return {
    candidate_label: caseDef.candidate_label,
    type_label_observed: feature?.type?.label || '',
    core_problem_matched: coreProblemMatched,
    severity_observed: feature?.severity?.label || '',
    onset_observed: feature?.onset?.label || '',
    matched_expected_detail_count: matchedExpectedDetailCount,
    expected_detail_count: expectedDetails.length,
    unexpected_modifiers: unexpectedModifiers,
    evidence_present: evidencePresent,
    case_score: Number(Math.max(0, caseScore).toFixed(4))
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const fixturePath = flags.fixture || DEFAULTS.fixture;
  const outputPath = flags.output || DEFAULTS.output;
  const googleCloudProject = String(flags['google-cloud-project'] || DEFAULTS.googleCloudProject).trim();
  const googleCloudLocation = String(flags['google-cloud-location'] || DEFAULTS.googleCloudLocation).trim();
  const service = `projects/${googleCloudProject}/locations/${googleCloudLocation}/services/nlp`;

  const fixture = await readJson(fixturePath);
  const cases = Array.isArray(fixture?.cases) ? fixture.cases : [];
  if (!cases.length) throw new Error('Benchmark fixture has no cases.');

  const accessToken = await resolveGoogleAccessToken();
  const normalizedResults = [];
  const scoredCases = [];

  for (const caseDef of cases) {
    const response = await callGoogleHealthcareAnalyzeEntities({
      accessToken,
      service,
      documentContent: caseDef.source_sentence || `The patient has ${caseDef.candidate_label}.`
    });

    const mentions = buildMentionTable(response);
    const mentionsById = new Map(mentions.map((mention) => [mention.mention_id, mention]));
    const relations = buildRelationTable(response, mentionsById);
    const phenotypicFeature = buildPhenopacketFeature(caseDef, mentions, relations);
    const result = {
      candidate_label: caseDef.candidate_label,
      sentence_id: caseDef.sentence_id,
      phenotypic_feature: phenotypicFeature,
      notes: [],
      healthcare_mentions: mentions,
      healthcare_relations: relations
    };
    normalizedResults.push(result);
    scoredCases.push(scoreFeature(caseDef, result));
  }

  const totalScore = scoredCases.reduce((sum, row) => sum + row.case_score, 0);

  await ensureDir(path.dirname(outputPath));
  await writeJson(outputPath, {
    created_at: new Date().toISOString(),
    stage: 'google_healthcare_phenopacket_feature_benchmark',
    fixture_path: fixturePath,
    healthcare_service: service,
    case_count: cases.length,
    total_score: Number(totalScore.toFixed(4)),
    scored_cases: scoredCases,
    normalized_results: normalizedResults
  });

  console.log(`google-healthcare\ttotal_score=${Number(totalScore.toFixed(4))}\toutput=${outputPath}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

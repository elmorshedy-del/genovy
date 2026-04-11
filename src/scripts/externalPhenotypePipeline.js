import { parseArgs } from '../lib/genereviewsPipeline.js';
import {
  deriveFreezeOutputPath,
  deriveGroundedOutputPath,
  freezeExternalExtractionFromPath,
  groundExternalExtractionFromPath,
  requireExistingPath
} from '../lib/externalPhenotypePipeline.js';
import {
  buildExternalEnrichmentCasesFromPaths,
  buildExternalMappingInputFromPath,
  deriveExternalEnrichmentCasesPath,
  deriveExternalMappedOutputPath,
  deriveExternalMappingInputPath,
  deriveExternalReviewOutputPath,
  mapExternalMappingInputExactFromPath,
  mapExternalMappingInputWithGoogleHealthcareFromPath,
  mapExternalMappingInputWithBioLordFromPath,
  runExternalEnrichmentReviewFromPath
} from '../lib/externalPhenotypeEnrichment.js';

const SUPPORTED_MODES = new Set([
  'freeze',
  'ground',
  'freeze-and-ground',
  'mapping-input',
  'map-hpo',
  'review-cases',
  'review-enrichment'
]);

const REVIEW_DEFAULTS = Object.freeze({
  models: 'gemini-2.5-pro',
  thinkingBudget: 256,
  temperature: 0
});

function usage() {
  return [
    'Usage:',
    '  node src/scripts/externalPhenotypePipeline.js freeze --input <raw.json|txt> [--output <frozen.json>]',
    '  node src/scripts/externalPhenotypePipeline.js ground --input <frozen.json> --clinical <clinical_structure.json|clinical_text.txt> [--anchors <anchors.json>] [--output <grounded.json>] [--include-uncertain]',
    '  node src/scripts/externalPhenotypePipeline.js freeze-and-ground --input <raw.json|txt> --clinical <clinical_structure.json|clinical_text.txt> [--anchors <anchors.json>] [--frozen-output <frozen.json>] [--grounded-output <grounded.json>] [--include-uncertain]',
    '  node src/scripts/externalPhenotypePipeline.js mapping-input --input <grounded.json> [--output <mapping_input.json>]',
    '  node src/scripts/externalPhenotypePipeline.js map-hpo --input <mapping_input.json> [--provider <biolord|exact|google-healthcare>] [--output <mapped.json>] [--phenotypes-json <phenotypes.json>] [--cache-dir <dir>] [--biolord-model <model>] [--healthcare-nlp-service <service>] [--google-cloud-project <project>] [--google-cloud-location <location>]',
    '  node src/scripts/externalPhenotypePipeline.js review-cases --grounded <grounded.json> --mapped <mapped.json> --anchors <anchors.json> [--output <enrichment_cases.json>] [--include-excluded] [--exclude-uncertain]',
    '  node src/scripts/externalPhenotypePipeline.js review-enrichment --input <enrichment_cases.json> [--models <model1,model2>] [--thinking-budget <n>] [--temperature <n>] [--output <review.json>]'
  ].join('\n');
}

function ensureMode(argv) {
  const mode = String(argv[0] || '').trim();
  if (!SUPPORTED_MODES.has(mode)) {
    throw new Error(usage());
  }
  return mode;
}

function resolveEnvValue(...names) {
  for (const name of names) {
    if (!name) continue;
    const value = process.env[name];
    if (value) return value;
  }
  return '';
}

async function main() {
  const mode = ensureMode(process.argv.slice(2));
  const flags = parseArgs(process.argv.slice(3));

  if (mode === 'freeze') {
    if (!flags.input) throw new Error(usage());
    const inputPath = requireExistingPath(flags.input, 'input file');
    const outputPath = deriveFreezeOutputPath(inputPath, flags.output);
    await freezeExternalExtractionFromPath(inputPath, outputPath);
    console.log(`Wrote frozen external extraction: ${outputPath}`);
    return;
  }

  if (mode === 'ground') {
    if (!flags.input) throw new Error(usage());
    const inputPath = requireExistingPath(flags.input, 'input file');
    const outputPath = deriveGroundedOutputPath(inputPath, flags.output);
    if (!flags.clinical) {
      throw new Error(usage());
    }
    await groundExternalExtractionFromPath(inputPath, {
      outputPath,
      clinicalPath: flags.clinical,
      anchorsPath: flags.anchors || '',
      includeUncertain: Boolean(flags['include-uncertain'] || flags.includeUncertain)
    });
    console.log(`Wrote grounded external extraction: ${outputPath}`);
    return;
  }

  if (mode === 'mapping-input') {
    if (!flags.input) throw new Error(usage());
    const inputPath = requireExistingPath(flags.input, 'grounded input file');
    const outputPath = deriveExternalMappingInputPath(inputPath, flags.output);
    await buildExternalMappingInputFromPath(inputPath, outputPath);
    console.log(`Wrote external mapping input: ${outputPath}`);
    return;
  }

  if (mode === 'review-cases') {
    if (!flags.grounded || !flags.mapped || !flags.anchors) {
      throw new Error(usage());
    }
    const groundedPath = requireExistingPath(flags.grounded, 'grounded input file');
    const mappedPath = requireExistingPath(flags.mapped, 'mapped input file');
    const anchorsPath = requireExistingPath(flags.anchors, 'anchors input file');
    const outputPath = deriveExternalEnrichmentCasesPath(mappedPath, flags.output);
    await buildExternalEnrichmentCasesFromPaths({
      groundedPath,
      mappedPath,
      anchorsPath,
      outputPath,
      includeExcluded: Boolean(flags['include-excluded'] || flags.includeExcluded),
      includeUncertain: !Boolean(flags['exclude-uncertain'] || flags.excludeUncertain)
    });
    console.log(`Wrote external enrichment review cases: ${outputPath}`);
    return;
  }

  if (mode === 'review-enrichment') {
    if (!flags.input) throw new Error(usage());
    const inputPath = requireExistingPath(flags.input, 'enrichment review cases file');
    const outputPath = deriveExternalReviewOutputPath(inputPath, flags.output);
    const apiKey = flags.apiKey || resolveEnvValue(flags.apiKeyEnv, 'GOOGLE_API_KEY', 'GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY is required.');
    }
    const thinkingBudget =
      Number.parseInt(
        flags['thinking-budget'] || flags.thinkingBudget || `${REVIEW_DEFAULTS.thinkingBudget}`,
        10
      ) || REVIEW_DEFAULTS.thinkingBudget;
    const temperature = Number.parseFloat(flags.temperature || `${REVIEW_DEFAULTS.temperature}`);
    const models = flags.models || REVIEW_DEFAULTS.models;

    await runExternalEnrichmentReviewFromPath(inputPath, {
      outputPath,
      apiKey,
      models,
      thinkingBudget,
      temperature
    });
    console.log(`Wrote external enrichment review output: ${outputPath}`);
    return;
  }

  if (mode === 'map-hpo') {
    if (!flags.input) throw new Error(usage());
    const inputPath = requireExistingPath(flags.input, 'mapping input file');
    const outputPath = deriveExternalMappedOutputPath(inputPath, flags.output);
    const provider = String(flags.provider || 'biolord').toLowerCase();
    if (provider === 'exact') {
      await mapExternalMappingInputExactFromPath(inputPath, {
        outputPath,
        phenotypesJson: flags['phenotypes-json'] || flags.phenotypesJson || ''
      });
    } else if (provider === 'google-healthcare' || provider === 'healthcare') {
      await mapExternalMappingInputWithGoogleHealthcareFromPath(inputPath, {
        outputPath,
        phenotypesJson: flags['phenotypes-json'] || flags.phenotypesJson || '',
        healthcareNlpService: flags['healthcare-nlp-service'] || flags.healthcareNlpService || '',
        googleCloudProject: flags['google-cloud-project'] || flags.googleCloudProject || '',
        googleCloudLocation: flags['google-cloud-location'] || flags.googleCloudLocation || '',
        googleAccessToken: flags['google-access-token'] || flags.googleAccessToken || ''
      });
    } else {
      await mapExternalMappingInputWithBioLordFromPath(inputPath, {
        outputPath,
        phenotypesJson: flags['phenotypes-json'] || flags.phenotypesJson || '',
        cacheDir: flags['cache-dir'] || flags.cacheDir || '',
        biolordModel: flags['biolord-model'] || flags.biolordModel || ''
      });
    }
    console.log(`Wrote external mapped candidates: ${outputPath}`);
    return;
  }

  if (flags.output) {
    throw new Error('Use --frozen-output and/or --grounded-output with freeze-and-ground.');
  }

  if (!flags.input) throw new Error(usage());
  const inputPath = requireExistingPath(flags.input, 'input file');
  if (!flags.clinical) {
    throw new Error(usage());
  }

  const frozenOutputPath = deriveFreezeOutputPath(inputPath, flags['frozen-output'] || flags.frozenOutput);
  const groundedOutputPath = deriveGroundedOutputPath(inputPath, flags['grounded-output'] || flags.groundedOutput);

  await freezeExternalExtractionFromPath(inputPath, frozenOutputPath);
  await groundExternalExtractionFromPath(frozenOutputPath, {
    outputPath: groundedOutputPath,
    clinicalPath: flags.clinical,
    anchorsPath: flags.anchors || '',
    includeUncertain: Boolean(flags['include-uncertain'] || flags.includeUncertain)
  });

  console.log(`Wrote frozen external extraction: ${frozenOutputPath}`);
  console.log(`Wrote grounded external extraction: ${groundedOutputPath}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

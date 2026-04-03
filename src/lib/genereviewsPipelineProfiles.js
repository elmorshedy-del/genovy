import fs from 'node:fs/promises';
import path from 'node:path';

const REPO_ROOT = '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914';
const DATA_ROOT = path.join(REPO_ROOT, 'data', 'source-enrichment');
const OUTPUT_ROOT = path.join(REPO_ROOT, 'output');
const SCRIPT_ROOT = path.join(REPO_ROOT, 'src', 'scripts');

const POLICY_TOKEN = '$POLICY_JSON';
const GEMINI_FLASH_MODEL = 'gemini-2.5-flash';
const GEMINI_PREVIEW_MODEL = 'gemini-3-pro-preview';
const GEMINI_PREVIEW_THINKING_BUDGET = 128;
const ACTIVE_MEDGEMMA_BASE_URL = 'https://z2m4kqae0vudzx4y.us-east-1.aws.endpoints.huggingface.cloud';
const PHENOTAGGER_PYTHON =
  process.env.PHENOTAGGER_PYTHON || '/Users/ahmedelmorshedy/.cache/phenotagger/.venv/bin/python';
const PHENOTAGGER_HOME =
  process.env.PHENOTAGGER_HOME || '/Users/ahmedelmorshedy/.cache/phenotagger';

function buildArgs(entries) {
  return Object.fromEntries(Object.entries(entries).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

function buildManifestArgs({ pipelineDir, input, output, limit, sourceKey = 'genereviews_nlp', verificationDir = '' }) {
  const anchorsDir = path.join(OUTPUT_ROOT, pipelineDir, 'stage2_anchors');
  return buildArgs({
    policy: POLICY_TOKEN,
    input,
    output,
    verificationDir,
    sourceKey,
    limit,
    clinicalDir: path.join(OUTPUT_ROOT, pipelineDir, 'stage1_fetch'),
    phenotypesJson: path.join(anchorsDir, 'phenotype_rows_snapshot.json'),
    ontologyJson: path.join(anchorsDir, 'ontology_rows_snapshot.json')
  });
}

function defineProfile(config) {
  return Object.freeze(config);
}

export const GENEREVIEWS_PIPELINE_PROFILES = Object.freeze({
  'review-first-50-20260331': defineProfile({
    description:
      'March 31 review-first 50-chapter settled run: local PhenoTagger anchors, Gemini Flash candidate discovery, MedGemma metadata, deterministic verify, and local Stage 6 manifest/api exports.',
    derivedPolicy: {
      templateJson: path.join(DATA_ROOT, 'genereviews-chapter-policy-template-20260329.json'),
      outputJson: path.join(DATA_ROOT, 'genereviews-chapter-policy-review-first-50-20260331.generated.json'),
      mode: 'tail',
      limit: 50
    },
    defaultStages: [
      'fetch',
      'phenotagger-local',
      'anchors',
      'candidates-gemini-flash',
      'map',
      'metadata-medgemma',
      'verify-medgemma',
      'manifest-medgemma'
    ],
    stages: {
      fetch: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'fetchGeneReviewsChapters.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-review-first-50-20260331', 'stage1_fetch'),
          limit: 50
        })
      },
      'phenotagger-local': {
        command: PHENOTAGGER_PYTHON,
        script: path.join(SCRIPT_ROOT, 'extractPhenotypeAnchorsPhenoTaggerLocal.py'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-review-first-50-20260331', 'stage1_fetch'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-review-first-50-20260331', 'stage2b_phenotagger_local'),
          limit: 50,
          phenotaggerRoot: PHENOTAGGER_HOME
        })
      },
      anchors: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractPhenotypeAnchors.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-review-first-50-20260331', 'stage1_fetch'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-review-first-50-20260331', 'stage2_anchors'),
          supplementDir: path.join(
            OUTPUT_ROOT,
            'genereviews-pipeline-review-first-50-20260331',
            'stage2b_phenotagger_local'
          ),
          limit: 50
        })
      },
      'candidates-gemini-flash': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractCandidatePhenotypes.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          clinical: path.join(OUTPUT_ROOT, 'genereviews-pipeline-review-first-50-20260331', 'stage1_fetch'),
          anchors: path.join(OUTPUT_ROOT, 'genereviews-pipeline-review-first-50-20260331', 'stage2_anchors'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-review-first-50-20260331', 'stage3_candidates'),
          limit: 50,
          model: GEMINI_FLASH_MODEL,
          apiKeyEnv: 'GEMINI_API_KEY',
          thinkingBudget: 0
        })
      },
      map: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'mapCandidatesToHPO.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-review-first-50-20260331', 'stage3_candidates'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-review-first-50-20260331', 'stage4_mapped_candidates'),
          phenotypesJson: path.join(
            OUTPUT_ROOT,
            'genereviews-pipeline-review-first-50-20260331',
            'stage2_anchors',
            'phenotype_rows_snapshot.json'
          ),
          embeddings: path.join(
            OUTPUT_ROOT,
            'genereviews-pipeline-review-first-50-20260331',
            'stage4_mapped_candidates',
            'hpo_embeddings.json'
          ),
          provider: 'biolord',
          limit: 50
        })
      },
      'metadata-medgemma': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractPhenotypeMetadata.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          anchors: path.join(OUTPUT_ROOT, 'genereviews-pipeline-review-first-50-20260331', 'stage2_anchors'),
          mapped: path.join(OUTPUT_ROOT, 'genereviews-pipeline-review-first-50-20260331', 'stage4_mapped_candidates'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-review-first-50-20260331', 'stage5_enriched_medgemma'),
          provider: 'medgemma',
          medgemmaApiKeyEnv: 'MEDGEMMA_API_KEY',
          baseUrl: ACTIVE_MEDGEMMA_BASE_URL,
          limit: 50
        })
      },
      'verify-medgemma': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'verifyGeneReviewsEnrichment.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          clinical: path.join(OUTPUT_ROOT, 'genereviews-pipeline-review-first-50-20260331', 'stage1_fetch'),
          enriched: path.join(OUTPUT_ROOT, 'genereviews-pipeline-review-first-50-20260331', 'stage5_enriched_medgemma'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-review-first-50-20260331', 'stage7_verify_medgemma'),
          ontologyJson: path.join(
            OUTPUT_ROOT,
            'genereviews-pipeline-review-first-50-20260331',
            'stage2_anchors',
            'ontology_rows_snapshot.json'
          ),
          limit: 50
        })
      },
      'manifest-medgemma': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'buildEnrichmentManifest.js'),
        args: buildManifestArgs({
          pipelineDir: 'genereviews-pipeline-review-first-50-20260331',
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-review-first-50-20260331', 'stage5_enriched_medgemma'),
          verificationDir: path.join(OUTPUT_ROOT, 'genereviews-pipeline-review-first-50-20260331', 'stage7_verify_medgemma'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-review-first-50-20260331', 'stage6_manifest_medgemma'),
          limit: 50
        })
      }
    }
  }),
  'latest5-settled-20260330': defineProfile({
    description:
      'Fresh latest5 settled-architecture run with Gemini Flash discovery plus Gemini preview or MedGemma metadata branches on new output paths.',
    policyJson: path.join(DATA_ROOT, 'genereviews-chapter-policy-latest5-20260330.json'),
    defaultStages: ['fetch', 'phenotagger-local', 'anchors', 'candidates-gemini-flash', 'map', 'metadata-gemini-preview', 'manifest-gemini-preview'],
    stages: {
      fetch: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'fetchGeneReviewsChapters.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage1_fetch'),
          limit: 5
        })
      },
      'phenotagger-local': {
        command: PHENOTAGGER_PYTHON,
        script: path.join(SCRIPT_ROOT, 'extractPhenotypeAnchorsPhenoTaggerLocal.py'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage1_fetch'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage2b_phenotagger_local'),
          limit: 5,
          phenotaggerRoot: PHENOTAGGER_HOME
        })
      },
      anchors: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractPhenotypeAnchors.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage1_fetch'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage2_anchors'),
          supplementDir: path.join(
            OUTPUT_ROOT,
            'genereviews-pipeline-latest5-settled-20260330',
            'stage2b_phenotagger_local'
          ),
          limit: 5
        })
      },
      'candidates-gemini-flash': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractCandidatePhenotypes.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          clinical: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage1_fetch'),
          anchors: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage2_anchors'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage3_candidates'),
          limit: 5,
          model: GEMINI_FLASH_MODEL,
          apiKeyEnv: 'GEMINI_API_KEY',
          thinkingBudget: 0
        })
      },
      map: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'mapCandidatesToHPO.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage3_candidates'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage4_mapped_candidates'),
          phenotypesJson: path.join(
            OUTPUT_ROOT,
            'genereviews-pipeline-latest5-settled-20260330',
            'stage2_anchors',
            'phenotype_rows_snapshot.json'
          ),
          embeddings: path.join(
            OUTPUT_ROOT,
            'genereviews-pipeline-latest5-settled-20260330',
            'stage4_mapped_candidates',
            'hpo_embeddings.json'
          ),
          provider: 'biolord',
          limit: 5
        })
      },
      'metadata-gemini-preview': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractPhenotypeMetadata.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          anchors: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage2_anchors'),
          mapped: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage4_mapped_candidates'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage5_enriched_gemini_preview'),
          provider: 'gemini',
          model: GEMINI_PREVIEW_MODEL,
          apiKeyEnv: 'GEMINI_31_PREVIEW_API_KEY',
          limit: 5,
          thinkingBudget: GEMINI_PREVIEW_THINKING_BUDGET
        })
      },
      'manifest-gemini-preview': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'buildEnrichmentManifest.js'),
        args: buildManifestArgs({
          pipelineDir: 'genereviews-pipeline-latest5-settled-20260330',
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage5_enriched_gemini_preview'),
          verificationDir: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage7_verify_gemini_preview'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage6_manifest_gemini_preview'),
          limit: 5
        })
      },
      'verify-gemini-preview': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'verifyGeneReviewsEnrichment.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          clinical: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage1_fetch'),
          enriched: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage5_enriched_gemini_preview'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage7_verify_gemini_preview'),
          ontologyJson: path.join(
            OUTPUT_ROOT,
            'genereviews-pipeline-latest5-settled-20260330',
            'stage2_anchors',
            'ontology_rows_snapshot.json'
          ),
          limit: 5
        })
      },
      'metadata-medgemma': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractPhenotypeMetadata.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          anchors: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage2_anchors'),
          mapped: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage4_mapped_candidates'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage5_enriched_medgemma'),
          provider: 'medgemma',
          medgemmaApiKeyEnv: 'MEDGEMMA_API_KEY',
          baseUrl: ACTIVE_MEDGEMMA_BASE_URL,
          limit: 5
        })
      },
      'manifest-medgemma': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'buildEnrichmentManifest.js'),
        args: buildManifestArgs({
          pipelineDir: 'genereviews-pipeline-latest5-settled-20260330',
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage5_enriched_medgemma'),
          verificationDir: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage7_verify_medgemma'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage6_manifest_medgemma'),
          limit: 5
        })
      },
      'verify-medgemma': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'verifyGeneReviewsEnrichment.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          clinical: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage1_fetch'),
          enriched: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage5_enriched_medgemma'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-settled-20260330', 'stage7_verify_medgemma'),
          ontologyJson: path.join(
            OUTPUT_ROOT,
            'genereviews-pipeline-latest5-settled-20260330',
            'stage2_anchors',
            'ontology_rows_snapshot.json'
          ),
          limit: 5
        })
      }
    }
  }),
  'latest5-gemini-20260330': defineProfile({
    description: 'March 30 saved latest5 main review-first pipeline using Gemini 2.5 Flash for candidate discovery.',
    policyJson: path.join(DATA_ROOT, 'genereviews-chapter-policy-latest5-20260330.json'),
    defaultStages: ['fetch', 'anchors', 'candidates-gemini', 'map', 'metadata-gemini', 'manifest'],
    stages: {
      fetch: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'fetchGeneReviewsChapters.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage1_fetch'),
          limit: 5
        })
      },
      anchors: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractPhenotypeAnchors.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage1_fetch'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage2_anchors'),
          limit: 5
        })
      },
      'candidates-gemini': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractCandidatePhenotypes.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          clinical: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage1_fetch'),
          anchors: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage2_anchors'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage3_candidates'),
          limit: 5,
          model: 'gemini-2.5-flash',
          thinkingBudget: 0
        })
      },
      'candidates-gliner': {
        command: 'python3',
        script: path.join(SCRIPT_ROOT, 'extractCandidatePhenotypesGLiNER.py'),
        args: buildArgs({
          clinical: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage1_fetch'),
          anchors: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage2_anchors'),
          output: path.join(OUTPUT_ROOT, 'genereviews-gliner-latest5-20260330', 'stage3_candidates'),
          limit: 5
        })
      },
      map: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'mapCandidatesToHPO.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage3_candidates'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage4_mapped_candidates'),
          embeddings: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage4_mapped_candidates', 'hpo_embeddings.json'),
          provider: 'biolord',
          limit: 5
        })
      },
      'metadata-gemini': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractPhenotypeMetadata.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          anchors: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage2_anchors'),
          mapped: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage4_mapped_candidates'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage5_enriched'),
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          limit: 5,
          thinkingBudget: 0
        })
      },
      manifest: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'buildEnrichmentManifest.js'),
        args: buildManifestArgs({
          pipelineDir: 'genereviews-pipeline-latest5-20260330',
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage5_enriched'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage6_manifest'),
          limit: 5
        })
      }
    }
  }),
  'latest5-qwen-20260330': defineProfile({
    description: 'March 30 latest5 Qwen comparison branch for candidate discovery only.',
    policyJson: path.join(DATA_ROOT, 'genereviews-chapter-policy-latest5-20260330.json'),
    defaultStages: ['fetch', 'anchors', 'candidates-qwen'],
    stages: {
      fetch: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'fetchGeneReviewsChapters.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage1_fetch'),
          limit: 5
        })
      },
      anchors: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractPhenotypeAnchors.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage1_fetch'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage2_anchors'),
          limit: 5
        })
      },
      'candidates-qwen': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractCandidatePhenotypesOpenAiCompat.js'),
        args: buildArgs({
          clinical: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage1_fetch'),
          anchors: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage2_anchors'),
          output: path.join(OUTPUT_ROOT, 'genereviews-qwen-latest5-20260330', 'stage3_candidates'),
          provider: 'dashscope',
          limit: 5
        })
      }
    }
  }),
  'latest5-gliner-20260330': defineProfile({
    description: 'March 30 latest5 GLiNER comparison branch for candidate discovery only.',
    policyJson: path.join(DATA_ROOT, 'genereviews-chapter-policy-latest5-20260330.json'),
    defaultStages: ['fetch', 'anchors', 'candidates-gliner'],
    stages: {
      fetch: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'fetchGeneReviewsChapters.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage1_fetch'),
          limit: 5
        })
      },
      anchors: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractPhenotypeAnchors.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage1_fetch'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage2_anchors'),
          limit: 5
        })
      },
      'candidates-gliner': {
        command: 'python3',
        script: path.join(SCRIPT_ROOT, 'extractCandidatePhenotypesGLiNER.py'),
        args: buildArgs({
          clinical: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage1_fetch'),
          anchors: path.join(OUTPUT_ROOT, 'genereviews-pipeline-latest5-20260330', 'stage2_anchors'),
          output: path.join(OUTPUT_ROOT, 'genereviews-gliner-latest5-20260330', 'stage3_candidates'),
          limit: 5
        })
      }
    }
  }),
  'hybrid-latest10-20260330': defineProfile({
    description:
      'March 30 hybrid latest10 review-first stack: Gemini main path, with attempted PhenoTagger and MedGemma side branches preserved as optional stages.',
    derivedPolicy: {
      templateJson: path.join(DATA_ROOT, 'genereviews-chapter-policy-template-20260329.json'),
      outputJson: path.join(DATA_ROOT, 'genereviews-chapter-policy-hybrid-latest10-20260330.generated.json'),
      mode: 'tail',
      limit: 10
    },
    defaultStages: ['fetch', 'anchors', 'candidates-gemini', 'map-gemini', 'metadata-gemini', 'manifest-gemini'],
    stages: {
      fetch: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'fetchGeneReviewsChapters.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage1_fetch'),
          limit: 10
        })
      },
      anchors: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractPhenotypeAnchors.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage1_fetch'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage2_anchors'),
          supplementDir: path.join(
            OUTPUT_ROOT,
            'genereviews-pipeline-hybrid-latest10-20260330',
            'stage2b_phenotagger_local'
          ),
          limit: 10
        })
      },
      'phenotagger-local': {
        command: PHENOTAGGER_PYTHON,
        script: path.join(SCRIPT_ROOT, 'extractPhenotypeAnchorsPhenoTaggerLocal.py'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage1_fetch'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage2b_phenotagger_local'),
          limit: 10,
          phenotaggerRoot: PHENOTAGGER_HOME
        })
      },
      'candidates-gemini': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractCandidatePhenotypes.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          clinical: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage1_fetch'),
          anchors: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage2_anchors'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage3_candidates'),
          model: 'gemini-2.5-flash',
          limit: 10,
          thinkingBudget: 0
        })
      },
      'map-gemini': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'mapCandidatesToHPO.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage3_candidates'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage4_mapped_candidates_gemini'),
          embeddings: path.join(
            OUTPUT_ROOT,
            'genereviews-pipeline-hybrid-latest10-20260330',
            'stage4_mapped_candidates_gemini',
            'hpo_embeddings.json'
          ),
          provider: 'biolord',
          limit: 10
        })
      },
      'metadata-gemini': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractPhenotypeMetadata.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          anchors: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage2_anchors'),
          mapped: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage4_mapped_candidates_gemini'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage5_enriched_gemini'),
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          limit: 10,
          thinkingBudget: 0
        })
      },
      'metadata-medgemma': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractPhenotypeMetadata.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          anchors: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage2_anchors'),
          mapped: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage4_mapped_candidates_gemini'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage5_enriched_medgemma'),
          provider: 'medgemma',
          baseUrl: ACTIVE_MEDGEMMA_BASE_URL,
          limit: 10
        })
      },
      'manifest-gemini': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'buildEnrichmentManifest.js'),
        args: buildManifestArgs({
          pipelineDir: 'genereviews-pipeline-hybrid-latest10-20260330',
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage5_enriched_gemini'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage6_manifest_gemini'),
          limit: 10
        })
      },
      'manifest-medgemma': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'buildEnrichmentManifest.js'),
        args: buildManifestArgs({
          pipelineDir: 'genereviews-pipeline-hybrid-latest10-20260330',
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage5_enriched_medgemma'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-hybrid-latest10-20260330', 'stage6_manifest_medgemma'),
          limit: 10
        })
      }
    }
  }),
  'autoaccept-batch1-20-20260330': defineProfile({
    description: 'March 30 batch1 autoaccept pipeline for 20 early chapters with direct manifest output.',
    policyJson: path.join(DATA_ROOT, 'genereviews-chapter-policy-autoaccept-batch1-20-20260330.json'),
    defaultStages: ['fetch', 'anchors', 'candidates-gemini', 'map', 'metadata-gemini', 'manifest'],
    stages: {
      fetch: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'fetchGeneReviewsChapters.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-autoaccept-batch1-20-20260330', 'stage1_fetch'),
          limit: 20
        })
      },
      anchors: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractPhenotypeAnchors.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-autoaccept-batch1-20-20260330', 'stage1_fetch'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-autoaccept-batch1-20-20260330', 'stage2_anchors'),
          limit: 20
        })
      },
      'candidates-gemini': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractCandidatePhenotypes.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          clinical: path.join(OUTPUT_ROOT, 'genereviews-pipeline-autoaccept-batch1-20-20260330', 'stage1_fetch'),
          anchors: path.join(OUTPUT_ROOT, 'genereviews-pipeline-autoaccept-batch1-20-20260330', 'stage2_anchors'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-autoaccept-batch1-20-20260330', 'stage3_candidates'),
          model: 'gemini-2.5-flash',
          limit: 20,
          thinkingBudget: 0
        })
      },
      map: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'mapCandidatesToHPO.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-autoaccept-batch1-20-20260330', 'stage3_candidates'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-autoaccept-batch1-20-20260330', 'stage4_mapped_candidates'),
          embeddings: path.join(
            OUTPUT_ROOT,
            'genereviews-pipeline-autoaccept-batch1-20-20260330',
            'stage4_mapped_candidates',
            'hpo_embeddings.json'
          ),
          provider: 'biolord',
          limit: 20
        })
      },
      'metadata-gemini': {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'extractPhenotypeMetadata.js'),
        args: buildArgs({
          policy: POLICY_TOKEN,
          anchors: path.join(OUTPUT_ROOT, 'genereviews-pipeline-autoaccept-batch1-20-20260330', 'stage2_anchors'),
          mapped: path.join(OUTPUT_ROOT, 'genereviews-pipeline-autoaccept-batch1-20-20260330', 'stage4_mapped_candidates'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-autoaccept-batch1-20-20260330', 'stage5_enriched'),
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          limit: 20,
          thinkingBudget: 0
        })
      },
      manifest: {
        command: 'node',
        script: path.join(SCRIPT_ROOT, 'buildEnrichmentManifest.js'),
        args: buildManifestArgs({
          pipelineDir: 'genereviews-pipeline-autoaccept-batch1-20-20260330',
          input: path.join(OUTPUT_ROOT, 'genereviews-pipeline-autoaccept-batch1-20-20260330', 'stage5_enriched'),
          output: path.join(OUTPUT_ROOT, 'genereviews-pipeline-autoaccept-batch1-20-20260330', 'stage6_manifest'),
          limit: 20
        })
      }
    }
  })
});

export function listGeneReviewsPipelineProfiles() {
  return Object.entries(GENEREVIEWS_PIPELINE_PROFILES).map(([name, profile]) => ({
    name,
    description: profile.description,
    defaultStages: [...profile.defaultStages]
  }));
}

export function getGeneReviewsPipelineProfile(name) {
  const profile = GENEREVIEWS_PIPELINE_PROFILES[name];
  if (!profile) {
    const known = Object.keys(GENEREVIEWS_PIPELINE_PROFILES).sort().join(', ');
    throw new Error(`Unknown GeneReviews pipeline profile "${name}". Known profiles: ${known}`);
  }
  return profile;
}

export async function resolvePolicyJsonForProfile(profile) {
  if (profile.policyJson) return profile.policyJson;
  if (!profile.derivedPolicy) throw new Error('Profile has neither policyJson nor derivedPolicy.');

  const { templateJson, outputJson, mode, limit } = profile.derivedPolicy;
  const payload = JSON.parse(await fs.readFile(templateJson, 'utf8'));
  const chapters = Array.isArray(payload.chapters) ? payload.chapters : [];
  const sliced =
    mode === 'tail'
      ? chapters.slice(-limit)
      : chapters.slice(0, limit);

  const derived = {
    ...payload,
    createdAt: new Date().toISOString().slice(0, 10),
    derivedFrom: templateJson,
    derivedMode: mode,
    derivedLimit: limit,
    chapters: sliced
  };

  await fs.mkdir(path.dirname(outputJson), { recursive: true });
  await fs.writeFile(outputJson, `${JSON.stringify(derived, null, 2)}\n`);
  return outputJson;
}

export function resolveStageArgs(stageConfig, policyJson, overrides = {}) {
  const next = {};
  for (const [key, value] of Object.entries(stageConfig.args || {})) {
    if (typeof value === 'string' && value === POLICY_TOKEN) {
      next[key] = policyJson;
      continue;
    }
    next[key] = value;
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === null || value === '') continue;
    next[key] = value;
  }

  return next;
}

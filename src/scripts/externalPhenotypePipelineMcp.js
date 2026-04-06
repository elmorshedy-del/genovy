#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as z from 'zod/v4';
import {
  deriveFreezeOutputPath,
  deriveGroundedOutputPath,
  freezeExternalExtractionFromPath,
  freezeExternalExtractionFromRaw,
  groundExternalExtractionFromPath,
  groundExternalExtractionFromValue,
  requireExistingPath
} from '../lib/externalPhenotypePipeline.js';

function usage() {
  return [
    'Usage:',
    '  node src/scripts/externalPhenotypePipelineMcp.js',
    '  node src/scripts/externalPhenotypePipelineMcp.js --help'
  ].join('\n');
}

function requireOneInput({ inputPath, rawText, frozenJson }, label) {
  const provided = [inputPath, rawText, frozenJson].filter((value) => String(value || '').trim()).length;
  if (provided !== 1) {
    throw new Error(`${label}: provide exactly one of input_path, raw_text, or frozen_json.`);
  }
}

function buildFrozenSummary(frozen, outputPath = null) {
  const ancillaryCounts = Object.fromEntries(
    Object.entries(frozen.ancillary_clinical_evidence || {}).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])
  );

  return {
    output_path: outputPath,
    chapter_title: frozen.chapter?.title || '',
    nbk_id: frozen.chapter?.nbk_id || '',
    present_count: Array.isArray(frozen.phenotypes?.present) ? frozen.phenotypes.present.length : 0,
    excluded_count: Array.isArray(frozen.phenotypes?.excluded) ? frozen.phenotypes.excluded.length : 0,
    uncertain_count: Array.isArray(frozen.phenotypes?.uncertain) ? frozen.phenotypes.uncertain.length : 0,
    ancillary_counts: ancillaryCounts
  };
}

function buildGroundedSummary(grounded, outputPath = null) {
  return {
    output_path: outputPath,
    chapter_title: grounded.chapter?.title || '',
    nbk_id: grounded.chapter?.nbk_id || '',
    candidate_count: grounded.grounded_counts?.candidates || 0,
    rejected_candidate_count: grounded.grounded_counts?.rejected_candidates || 0,
    candidate_bucket_counts: grounded.grounded_counts?.candidates_by_bucket || {},
    review_page_path: grounded.review_page_path || null,
    review_data_path: grounded.review_data_path || null,
    verification_summary: grounded.verification_summary || null
  };
}

function buildToolResponse(fullObject, summary) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(fullObject, null, 2)
      }
    ],
    structuredContent: summary
  };
}

export async function createServer() {
  const server = new McpServer({
    name: 'genovy-external-phenotype-pipeline',
    version: '0.1.0'
  });

  server.registerTool(
    'freeze_external_phenotype_extraction',
    {
      description:
        'Freeze raw external chapter extraction output into the canonical Genovy discovery schema. Accepts either an input file path or raw extraction text.',
      inputSchema: {
        input_path: z.string().optional().describe('Path to raw external extraction JSON or prose-wrapped JSON output.'),
        raw_text: z
          .string()
          .optional()
          .describe('Raw external extraction text containing exactly one JSON object, optionally wrapped by prose.'),
        output_path: z.string().optional().describe('Optional path to write the frozen canonical chapter JSON.')
      }
    },
    async ({ input_path: inputPath, raw_text: rawText, output_path: outputPath }) => {
      requireOneInput({ inputPath, rawText }, 'freeze_external_phenotype_extraction');

      if (inputPath) {
        const resolvedInputPath = requireExistingPath(inputPath, 'input file');
        const resolvedOutputPath = outputPath ? deriveFreezeOutputPath(resolvedInputPath, outputPath) : null;
        const result = await freezeExternalExtractionFromPath(resolvedInputPath, resolvedOutputPath || '');
        return buildToolResponse(result.frozen, buildFrozenSummary(result.frozen, result.outputPath));
      }

      const frozen = await freezeExternalExtractionFromRaw(rawText, {
        outputPath: outputPath ? outputPath : undefined
      });
      return buildToolResponse(
        frozen,
        buildFrozenSummary(frozen, outputPath ? requireExistingPath(outputPath, 'output file') : null)
      );
    }
  );

  server.registerTool(
    'ground_external_phenotype_extraction',
    {
      description:
        'Ground a frozen external chapter extraction against clinical structure text and produce a sentence-level verification sidecar.',
      inputSchema: {
        input_path: z.string().optional().describe('Path to a frozen chapter JSON file.'),
        frozen_json: z.string().optional().describe('Frozen chapter JSON text if not using an input file.'),
        clinical_path: z.string().describe('Path to clinical structure JSON or plain clinical text file.'),
        anchors_path: z.string().optional().describe('Optional path to chapter anchors JSON.'),
        output_path: z.string().optional().describe('Optional path to write the grounded verification sidecar.'),
        include_uncertain: z.boolean().optional().describe('Whether to include uncertain phenotype rows in grounding.')
      }
    },
    async ({
      input_path: inputPath,
      frozen_json: frozenJson,
      clinical_path: clinicalPath,
      anchors_path: anchorsPath,
      output_path: outputPath,
      include_uncertain: includeUncertain
    }) => {
      requireOneInput({ inputPath, frozenJson }, 'ground_external_phenotype_extraction');

      if (inputPath) {
        const resolvedInputPath = requireExistingPath(inputPath, 'input file');
        const resolvedOutputPath = outputPath ? deriveGroundedOutputPath(resolvedInputPath, outputPath) : null;
        const result = await groundExternalExtractionFromPath(resolvedInputPath, {
          outputPath: resolvedOutputPath || '',
          clinicalPath,
          anchorsPath: anchorsPath || '',
          includeUncertain: Boolean(includeUncertain)
        });
        return buildToolResponse(result.grounded, buildGroundedSummary(result.grounded, result.outputPath));
      }

      const grounded = await groundExternalExtractionFromValue(frozenJson, {
        clinicalPath,
        anchorsPath: anchorsPath || '',
        includeUncertain: Boolean(includeUncertain),
        outputPath: outputPath || undefined
      });
      return buildToolResponse(grounded, buildGroundedSummary(grounded, outputPath || null));
    }
  );

  server.registerTool(
    'freeze_and_ground_external_phenotype_extraction',
    {
      description:
        'Run the full external chapter pipeline: freeze raw extraction output into the canonical schema, then ground it against the clinical structure.',
      inputSchema: {
        input_path: z.string().optional().describe('Path to raw external extraction JSON or prose-wrapped JSON output.'),
        raw_text: z
          .string()
          .optional()
          .describe('Raw external extraction text containing exactly one JSON object, optionally wrapped by prose.'),
        clinical_path: z.string().describe('Path to clinical structure JSON or plain clinical text file.'),
        anchors_path: z.string().optional().describe('Optional path to chapter anchors JSON.'),
        frozen_output_path: z.string().optional().describe('Optional path to write the frozen canonical chapter JSON.'),
        grounded_output_path: z.string().optional().describe('Optional path to write the grounded verification sidecar.'),
        include_uncertain: z.boolean().optional().describe('Whether to include uncertain phenotype rows in grounding.')
      }
    },
    async ({
      input_path: inputPath,
      raw_text: rawText,
      clinical_path: clinicalPath,
      anchors_path: anchorsPath,
      frozen_output_path: frozenOutputPath,
      grounded_output_path: groundedOutputPath,
      include_uncertain: includeUncertain
    }) => {
      requireOneInput({ inputPath, rawText }, 'freeze_and_ground_external_phenotype_extraction');

      if (inputPath) {
        const resolvedInputPath = requireExistingPath(inputPath, 'input file');
        const resolvedFrozenOutputPath = deriveFreezeOutputPath(resolvedInputPath, frozenOutputPath || '');
        const freezeResult = await freezeExternalExtractionFromPath(resolvedInputPath, resolvedFrozenOutputPath);
        const resolvedGroundedOutputPath = deriveGroundedOutputPath(
          freezeResult.outputPath,
          groundedOutputPath || ''
        );
        const groundResult = await groundExternalExtractionFromPath(freezeResult.outputPath, {
          outputPath: resolvedGroundedOutputPath,
          clinicalPath,
          anchorsPath: anchorsPath || '',
          includeUncertain: Boolean(includeUncertain)
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  frozen: freezeResult.frozen,
                  grounded: groundResult.grounded
                },
                null,
                2
              )
            }
          ],
          structuredContent: {
            frozen: buildFrozenSummary(freezeResult.frozen, freezeResult.outputPath),
            grounded: buildGroundedSummary(groundResult.grounded, groundResult.outputPath)
          }
        };
      }

      const frozen = await freezeExternalExtractionFromRaw(rawText, {
        outputPath: frozenOutputPath || undefined
      });
      const grounded = await groundExternalExtractionFromValue(frozen, {
        clinicalPath,
        anchorsPath: anchorsPath || '',
        includeUncertain: Boolean(includeUncertain),
        outputPath: groundedOutputPath || undefined
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ frozen, grounded }, null, 2)
          }
        ],
        structuredContent: {
          frozen: buildFrozenSummary(frozen, frozenOutputPath || null),
          grounded: buildGroundedSummary(grounded, groundedOutputPath || null)
        }
      };
    }
  );

  return server;
}

async function main() {
  if (process.argv.includes('--help')) {
    console.log(usage());
    process.exit(0);
  }

  const server = await createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Genovy external phenotype pipeline MCP server running on stdio');
}

const isDirectExecution = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error?.stack || error?.message || String(error));
    process.exit(1);
  });
}

# External Phenotype Freeze Bundle

This folder is a working reference bundle for the external chapter finalization flow.

It contains copies of the core files for the current workflow plus a unified CLI and MCP server:

- `externalPhenotypeExtraction.js`
- `freezeExternalPhenotypeExtraction.js`
- `groundExternalPhenotypeExtraction.js`
- `externalPhenotypePipeline.js`
- `externalPhenotypePipelineMcp.js`
- `externalPhenotypePipelineHttpMcp.js`

These copies are for reading, consolidation, or turning into one standalone program.
The canonical in-repo sources still live at:

- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/externalPhenotypeExtraction.js`
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/freezeExternalPhenotypeExtraction.js`
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/groundExternalPhenotypeExtraction.js`
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/externalPhenotypePipeline.js`
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/externalPhenotypePipelineMcp.js`
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/externalPhenotypePipelineHttpMcp.js`

## Fastest Entry Point

If you want one command surface instead of calling the split scripts directly, use:

- `externalPhenotypePipeline.js`

Supported modes:

- `freeze`
- `ground`
- `freeze-and-ground`

Usage:

```bash
node src/scripts/externalPhenotypePipeline.js freeze --input raw.json
node src/scripts/externalPhenotypePipeline.js ground --input chapter_frozen.json --clinical chapter_clinical_structure.json
node src/scripts/externalPhenotypePipeline.js freeze-and-ground --input raw.json --clinical chapter_clinical_structure.json
```

The split scripts are still useful when you want exact stage control, but the unified CLI is now the easiest operational entry point.

## MCP Entry Point

If you want the same workflow exposed as MCP tools instead of terminal commands, use:

- `externalPhenotypePipelineMcp.js`

Run it on stdio:

```bash
npm run gr:external-pipeline:mcp
```

or:

```bash
node src/scripts/externalPhenotypePipelineMcp.js
```

Exposed MCP tools:

- `freeze_external_phenotype_extraction`
- `ground_external_phenotype_extraction`
- `freeze_and_ground_external_phenotype_extraction`

The MCP server wraps the same shared pipeline logic as the CLI. It does not introduce a second normalization path.

## HTTP MCP URL

If you want a real URL instead of stdio, run:

```bash
npm run gr:external-pipeline:mcp:http
```

Default local endpoint:

```text
http://127.0.0.1:8787/mcp
```

Health check:

```text
http://127.0.0.1:8787/health
```

You can override host, port, and path with:

```bash
MCP_HOST=0.0.0.0 MCP_PORT=8787 MCP_PATH=/mcp npm run gr:external-pipeline:mcp:http
```

## Purpose

The workflow is intentionally split into two outputs:

1. frozen final chapter JSON
2. grounded verification sidecar

The frozen final JSON is the canonical chapter artifact. It stays schema-clean and does not contain provenance fields like `sentence_id`.

The grounded sidecar is the verification artifact. It uses the frozen JSON plus the chapter clinical structure to find supporting sentences and attach `sentence_id` and related grounding data.

## How The Core Files Work

### `externalPhenotypeExtraction.js`

This is the core library.

It does three jobs:

1. parses raw external model output
2. normalizes and freezes it into the locked schema
3. prepares phenotype rows for downstream grounding

Key exported functions:

- `parseExternalPhenotypeExtractionPayload(rawValue)`
  - accepts either an object or raw model text
  - extracts the first balanced JSON object
  - lets you recover from outputs that contain prose before or after the JSON

- `normalizeExternalPhenotypeExtraction(payload)`
  - accepts grouped or flat phenotype payloads
  - normalizes chapter metadata
  - normalizes phenotype buckets
  - normalizes ancillary evidence buckets
  - flattens nested `context_metadata`

- `freezeExternalPhenotypeExtraction(payload)`
  - produces the final canonical chapter JSON
  - strips unsupported row fields
  - reroutes ancillary-like phenotype rows into ancillary buckets
  - removes non-phenotype rows from `phenotypes.excluded`
  - normalizes `treatment_response` down to qualifier-only strings where possible
  - removes exact duplicates across phenotype and ancillary layers

- `toFinalizeCandidateRows(normalizedPayload, options)`
  - converts normalized phenotype rows into candidate rows for grounding

- `enrichFinalizedCandidates(finalizedRows, inputRows)`
  - reattaches category/detail context after grounding when available

### `freezeExternalPhenotypeExtraction.js`

This is the CLI wrapper for the freeze step.

Input:

- raw external chapter output

Output:

- canonical frozen chapter JSON

What it does:

1. reads the raw file
2. parses the first JSON object from it
3. runs `freezeExternalPhenotypeExtraction(...)`
4. writes `<input>_frozen.json` unless `--output` is provided

Usage:

```bash
node src/scripts/freezeExternalPhenotypeExtraction.js \
  --input raw_chapter_output.json \
  --output chapter_frozen.json
```

This is the step you use when Opus or ChatGPT gives you chapter JSON that needs to become final and pipeline-safe.

### `groundExternalPhenotypeExtraction.js`

This is the grounding and verification CLI.

Input:

- frozen chapter JSON
- clinical structure JSON or clinical text
- optional anchors JSON

Output:

- grounded sidecar JSON

What it does:

1. reads the frozen chapter JSON
2. converts phenotype rows into grounding candidates
3. loads the chapter clinical structure
4. optionally loads anchors
5. runs `finalizePhenotypeCandidates(...)`
6. writes a sidecar with:
   - grounded `candidates`
   - `rejected_candidates`
   - `sentence_id`
   - `sentence_index`
   - bucket counts
   - carried-through `context_metadata`
   - carried-through `context_notes`

Usage:

```bash
node src/scripts/groundExternalPhenotypeExtraction.js \
  --input chapter_frozen.json \
  --clinical chapter_clinical_structure.json \
  --anchors chapter_anchors.json \
  --output chapter_grounded.json
```

## Recommended Data Flow

```text
raw model output
  -> parseExternalPhenotypeExtractionPayload
  -> freezeExternalPhenotypeExtraction
  -> frozen final chapter JSON
  -> toFinalizeCandidateRows
  -> finalizePhenotypeCandidates
  -> grounded verification sidecar
```

## Unified CLI

The merged program now exists as `externalPhenotypePipeline.js`.

It supports:

- `freeze`
  - raw model output -> frozen chapter JSON

- `ground`
  - frozen chapter JSON -> grounded sidecar

- `freeze-and-ground`
  - raw model output -> frozen chapter JSON -> grounded sidecar

## MCP Workflow Shape

The MCP server exposes the same three stages as tools:

- `freeze_external_phenotype_extraction`
  - raw model output -> frozen chapter JSON

- `ground_external_phenotype_extraction`
  - frozen chapter JSON -> grounded sidecar

- `freeze_and_ground_external_phenotype_extraction`
  - raw model output -> frozen chapter JSON -> grounded sidecar

## Important Boundary

Do not put `sentence_id` into the frozen final chapter JSON.

Keep these separate:

- frozen final chapter JSON = canonical artifact
- grounded sidecar JSON = verification artifact

That separation is what keeps the chapter schema stable while still preserving evidence traceability when you need it.

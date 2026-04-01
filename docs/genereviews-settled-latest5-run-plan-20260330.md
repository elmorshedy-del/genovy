# GeneReviews Settled Latest5 Run Plan

Date: 2026-03-30

## Goal

Run a fresh `latest5` slice on the settled architecture with clean output paths, while keeping the two historically blocked late-branch options explicit:

- `PhenoTagger` anchor supplement
- `MedGemma` anchor-level metadata fallback

## Stable Core

The stable core path is:

1. fetch
2. anchors
3. Gemini `2.5 Flash` candidate discovery
4. BioLORD mapping
5. Gemini `3 Pro Preview` metadata fallback
6. preview-manifest

This is the path that should be run next once the working Genovy `DATABASE_URL` is restored.

Current blocker:

- anchor extraction still depends on the phenotype graph DB
- the current shell has no working `DATABASE_URL`, so the full `latest5` settled run still stops at anchors

## Optional Branches

### `PhenoTagger`

Position in pipeline:

- after fetch
- before anchors

Anchors are configured to read a supplement directory. If `PhenoTagger` outputs are present, they are merged into the anchor surface. If they are absent, the same anchor stage still runs local-only.

### `MedGemma`

Position in pipeline:

- after mapped candidates
- as a separate metadata branch

### `Gemini Preview`

Position in pipeline:

- after mapped candidates
- as the main narrow metadata branch for the settled run

Role:

- this is the late, tighter reasoning/metadata step
- it is separate from the earlier Flash candidate-discovery step
- it is the right place to compare against `MedGemma`

This branch should only run when:

- endpoint is live
- API key is present
- base URL is present

## Readiness Gate

Use:

```bash
npm run gr:check
```

This reports:

- Gemini Flash readiness
- Gemini preview readiness
- Qwen readiness
- PhenoTagger submit-endpoint availability
- MedGemma endpoint/key availability

It does not validate:

- working graph DB connectivity for the anchor stage

## Current Expected Read

Based on the latest live preflight and saved March 30 evidence:

- Gemini Flash: ready
- Gemini preview: ready
- Qwen: ready
- PhenoTagger public phenotype submit endpoint: currently unavailable
- MedGemma key: present
- MedGemma custom endpoint:
  - endpoint name: `medgemma-27b-text-it-wgl`
  - endpoint URL: `https://aro6p9a835d7pnd5.us-east-1.aws.endpoints.huggingface.cloud`
  - control test: create -> pause -> resume -> pause succeeded with the HF token
  - final state left intentionally: `paused`
  - base URL is known now, but not yet exported into the shell env by default

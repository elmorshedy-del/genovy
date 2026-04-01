# GeneReviews Latest Engineering Pipeline

Date: 2026-03-30

## Purpose

The repository already contains the GeneReviews stage scripts and the March 29-30 policy files. The missing engineering piece was a single durable runner that can execute the saved pipeline profiles without re-discovering dated paths by hand.

This document defines the current durable pipeline shape.

## Current Settled Split

The settled architecture is now:

- early broad step:
  - `Gemini 2.5 Flash` for candidate discovery
- later narrow metadata step:
  - `Gemini 3 Pro Preview` as the main late metadata branch
  - `MedGemma` as the comparison metadata branch

That split matters because `Flash` is not playing the same role as the late metadata model.

## What Already Existed In GitHub

Recent committed GeneReviews lineage in git history:

- `4629bcb` `Add GeneReviews NLP shadow manifest builder`
- `e46aebd` `Add GeneReviews global shadow tools`
- `1c044e6` `Add GeneReviews enrichment pipeline and archive artifact storage`

Those commits already contained:
- core library:
  - `src/lib/genereviewsPipeline.js`
- stage scripts:
  - `fetchGeneReviewsChapters.js`
  - `extractPhenotypeAnchors.js`
  - `extractCandidatePhenotypes.js`
  - `extractCandidatePhenotypesOpenAiCompat.js`
  - `extractCandidatePhenotypesGLiNER.py`
  - `mapCandidatesToHPO.js`
  - `extractPhenotypeMetadata.js`
  - `buildEnrichmentManifest.js`
- policy files:
  - `data/source-enrichment/genereviews-chapter-policy-template-20260329.json`
  - `data/source-enrichment/genereviews-chapter-policy-seeded-20260329.json`
  - `data/source-enrichment/genereviews-chapter-policy-latest5-20260330.json`
  - `data/source-enrichment/genereviews-chapter-policy-autoaccept-batch1-20-20260330.json`

So the work was not missing. It was fragmented.

## What Was Added Now

Durable orchestration layer:
- `src/lib/genereviewsPipelineProfiles.js`
- `src/scripts/runGeneReviewsPipeline.js`

Package entrypoint:
- `npm run gr:pipeline`

## Primary-Source Correction

Saved March 30 bucket artifacts show the following:

- the saved `latest5` main end-to-end review-first run used `Gemini 2.5 Flash` for candidate discovery
- `Qwen` and `GLiNER` existed as saved comparison branches for candidate discovery, not as the authoritative main `latest5` pipeline
- the saved `hybrid latest10` main candidate path also used `Gemini 2.5 Flash`
- `PhenoTagger` and `MedGemma` were attempted side branches in `hybrid latest10`, but both were operationally blocked in the saved artifacts

So this runner now reflects the saved branch roles more accurately than the earlier draft did.

## Durable Profiles

### `latest5-gemini-20260330`

Meaning:
- March 30 latest5 review-first stack
- main saved candidate-discovery branch
- Gemini `2.5 Flash` candidate discovery
- BioLORD mapping
- Gemini metadata
- manifest remains review-first

Default stages:
- `fetch`
- `anchors`
- `candidates-gemini`
- `map`
- `metadata-gemini`
- `manifest`

### `latest5-qwen-20260330`

Meaning:
- March 30 `latest5` Qwen comparison branch
- candidate discovery only
- saved as a side comparison against the main Gemini branch

Default stages:
- `fetch`
- `anchors`
- `candidates-qwen`

### `latest5-gliner-20260330`

Meaning:
- March 30 `latest5` GLiNER comparison branch
- candidate discovery only
- saved as the sparse comparison baseline

Default stages:
- `fetch`
- `anchors`
- `candidates-gliner`

### `hybrid-latest10-20260330`

Meaning:
- March 30 latest10 hybrid engineering stack
- review-first policy slice over the last 10 chapters
- main Gemini candidate branch
- BioLORD mapping
- optional attempted side branches:
  - PhenoTagger API supplement anchors
  - MedGemma metadata fallback

Default stages:
- `fetch`
- `anchors`
- `candidates-gemini`
- `map-gemini`
- `metadata-gemini`
- `manifest-gemini`

Implementation note:
- this profile derives its policy JSON from the March 29 template by slicing the last 10 chapters and writing:
  - `data/source-enrichment/genereviews-chapter-policy-hybrid-latest10-20260330.generated.json`
- optional stages remain available for explicit reproduction of the saved blocked branches:
  - `phenotagger-api`
  - `metadata-medgemma`
  - `manifest-medgemma`

### `latest5-settled-20260330`

Meaning:
- fresh rerun profile on new output paths
- `Gemini 2.5 Flash` for candidate discovery
- BioLORD mapping
- `Gemini 3 Pro Preview` for the late metadata step
- optional blocked/side branches:
  - `PhenoTagger` anchor supplement
  - `MedGemma` metadata comparison branch

Default stages:
- `fetch`
- `anchors`
- `candidates-gemini-flash`
- `map`
- `metadata-gemini-preview`
- `manifest-gemini-preview`

### `autoaccept-batch1-20-20260330`

Meaning:
- March 30 20-chapter autoaccept batch
- explicit autoaccept policy file
- direct manifest-producing run

Default stages:
- `fetch`
- `anchors`
- `candidates-gemini`
- `map`
- `metadata-gemini`
- `manifest`

## Runner Usage

List profiles:

```bash
npm run gr:pipeline -- --list
```

Dry-run one profile:

```bash
npm run gr:pipeline -- --profile latest5-gemini-20260330 --dryRun
```

Run selected stages only:

```bash
npm run gr:pipeline -- --profile autoaccept-batch1-20-20260330 --stage fetch,anchors
```

Override slice window:

```bash
npm run gr:pipeline -- --profile latest5-qwen-20260330 --stage fetch,anchors --start 0 --limit 5
```

## Why This Matters

Before this runner, the pipeline existed as many strong but date-stamped stage scripts with hardcoded output paths. That was enough to run experiments and not enough to preserve operational clarity.

Now the pipeline has:
- named profiles
- one entrypoint
- one place for stage-path/provider configuration
- one place to see which March 30 stack is which

## What This Does Not Pretend

This runner does not magically collapse all March 29-30 work into one benchmark state.

It preserves the real distinction between:
- review-first latest5 main Gemini path
- latest5 comparison branches
- hybrid latest10 experimentation
- autoaccept batch1-20

That distinction is important because the saved bucket artifacts show those were different engineering branches with different goals.

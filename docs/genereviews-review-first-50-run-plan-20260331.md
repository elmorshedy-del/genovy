# GeneReviews Review-First 50 Run Plan

Date: 2026-03-31

## Purpose

Run the settled GeneReviews pipeline on 50 chapters in review-first mode to measure:

- operational stability at meaningful scale
- verifier pass/flag/fail distribution
- review queue shape
- MedGemma warmup/batching behavior
- storage growth and artifact volume

This is **not** an auto-accept or ingestion run.

## Profile

- profile: `review-first-50-20260331`
- policy source: `data/source-enrichment/genereviews-chapter-policy-template-20260329.json`
- derived policy output: `data/source-enrichment/genereviews-chapter-policy-review-first-50-20260331.generated.json`
- chapter selection mode: `tail`
- chapter count: `50`

## Architecture

Stages:

1. `fetch`
2. `phenotagger-local`
3. `anchors`
4. `candidates-gemini-flash`
5. `map`
6. `metadata-medgemma`
7. `verify-medgemma`
8. `manifest-medgemma`

Key properties:

- local PhenoTagger supplement enabled
- Gemini Flash used for candidate discovery
- MedGemma used for metadata extraction
- deterministic verifier runs before Stage 6 manifest/export
- Stage 6 uses local phenotype and ontology snapshots, not Railway
- output remains review-first

## Expected Output Root

`output/genereviews-pipeline-review-first-50-20260331/`

Primary subdirectories:

- `stage1_fetch/`
- `stage2_anchors/`
- `stage2b_phenotagger_local/`
- `stage3_candidates/`
- `stage4_mapped_candidates/`
- `stage5_enriched_medgemma/`
- `stage7_verify_medgemma/`
- `stage6_manifest_medgemma/`

## Pre-Run Checks

1. Readiness:

```bash
npm run gr:check
```

Need:

- `geminiReady = true`
- `phenotaggerReady = true`
- `medgemmaReady = true`

2. Dry run:

```bash
node src/scripts/runGeneReviewsPipeline.js --profile review-first-50-20260331 --dryRun
```

3. Disk check:

- keep at least ~10 GiB free before starting
- watch growth under `output/genereviews-pipeline-review-first-50-20260331/`

4. Operational note:

- MedGemma prewarm is triggered automatically before `metadata-medgemma`
- do not rely on pause/resume mid-run

## Execution Command

```bash
node src/scripts/runGeneReviewsPipeline.js --profile review-first-50-20260331
```

## Success Criteria

The run is successful if:

- all 50 chapters complete through Stage 6
- Stage 7 summaries are written without fatal verifier failure
- Stage 6 writes both:
  - conservative manifest/review outputs
  - API export artifacts
- no storage regression destabilizes the host

## Review Outputs To Inspect First

1. `stage7_verify_medgemma/verification_summary.json`
2. `stage6_manifest_medgemma/manifest_summary.json`
3. `stage6_manifest_medgemma/genereviews_review_queue.json`
4. `stage6_manifest_medgemma/api_exports/genereviews_api_chapters.json`
5. `stage6_manifest_medgemma/api_exports/genereviews_api_assertions.json`

## Decision After Run

After the 50 run, evaluate:

- pass / flag / fail ratios
- auto-accept-eligible share
- cross-source concordance coverage
- local clinical domain coverage
- audit UI usefulness on a larger review queue
- MedGemma throughput and stability

If stable, proceed to the `100` review-first run.

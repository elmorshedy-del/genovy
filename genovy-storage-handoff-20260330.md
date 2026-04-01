# Genovy Storage Handoff

## What stayed in GitHub

These are source-of-truth repo files and belong in GitHub:

- pipeline code in `src/lib/` and `src/scripts/`
- policy/config files in `data/source-enrichment/`
- docs and prompt specs in `docs/`

Key pipeline files added/pushed:

- `src/lib/genereviewsPipeline.js`
- `src/scripts/fetchGeneReviewsChapters.js`
- `src/scripts/extractPhenotypeAnchors.js`
- `src/scripts/extractCandidatePhenotypes.js`
- `src/scripts/mapCandidatesToHPO.js`
- `src/scripts/extractPhenotypeMetadata.js`
- `src/scripts/buildEnrichmentManifest.js`

Key docs/policy files added/pushed:

- `docs/artifact-storage-20260330.md`
- `docs/genereviews-symmetric-honest-pipeline-20260329.md`
- `docs/medgemma-anchor-metadata-prompt-20260330.md`
- `data/source-enrichment/genereviews-chapter-policy-template-20260329.json`
- `data/source-enrichment/genereviews-chapter-policy-seeded-20260329.json`
- `data/source-enrichment/genereviews-chapter-policy-latest5-20260330.json`
- `data/source-enrichment/genereviews-chapter-policy-autoaccept-batch1-20-20260330.json`

GitHub delivery:

- branch: `codex/non-negotiable-phase0-20260322-1605`
- commit: `1c044e6`
- PR: `https://github.com/elmorshedy-del/genovy/pull/15`

## What moved to cloud storage

Large generated artifacts were archived to Google Cloud Storage:

- `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/output/`
- `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/downloads-files-4/`

These cloud paths contain:

- generated pipeline outputs from `output/`
- large manifests
- cached chapter text / raw HTML / tables
- old GeneReviews pilot folders from `Downloads/files (4)`

## What remains local

Kept locally for active review:

- `output/genereviews-pipeline-hybrid-latest10-20260330`

Deleted locally after cloud verification:

- older `output/` artifacts
- `/Users/ahmedelmorshedy/Downloads/files (4)`

## Important note

There are still unrelated unstaged local modifications in the repo that were not included in this storage/code handoff.

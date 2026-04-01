# GeneReviews Engineering Progression Recovery

Date: 2026-03-30

## Purpose

Reconstruct the GeneReviews engineering progression from saved GitHub code plus March 29-30 bucket artifacts, with the run-by-run JSON evidence attached to the architectural read.

This document corrects one overstatement from the earlier recovery:

- `Qwen` was not the recovered main `latest5` branch
- the saved main `latest5` and `latest10` candidate paths were both `Gemini 2.5 Flash`
- `Qwen` and `GLiNER` survive as candidate-discovery comparison branches
- `MedGemma` survives as a metadata-fallback experiment, not a successful main pipeline branch

## Evidence Surfaces

GitHub commits re-read:

- `4629bcb` `Add GeneReviews NLP shadow manifest builder`
- `e46aebd` `Add GeneReviews global shadow tools`
- `1c044e6` `Add GeneReviews enrichment pipeline and archive artifact storage`

Repo files re-read:

- `docs/genereviews-symmetric-honest-pipeline-20260329.md`
- `docs/medgemma-anchor-metadata-prompt-20260330.md`
- `docs/artifact-storage-20260330.md`
- `src/lib/genereviewsPipeline.js`
- `src/scripts/extractPhenotypeAnchors.js`
- `src/scripts/extractPhenotypeAnchorsPhenoTaggerApi.py`
- `src/scripts/extractCandidatePhenotypes.js`
- `src/scripts/extractCandidatePhenotypesOpenAiCompat.js`
- `src/scripts/extractCandidatePhenotypesGLiNER.py`
- `src/scripts/mapCandidatesToHPO.js`
- `src/scripts/mapCandidatesToHPOBioLORD.py`
- `src/scripts/extractPhenotypeMetadata.js`

Saved bucket artifact families re-read:

- broad raw extraction
- Gemini flash pilot10
- Gemini anchor-first pilots
- `latest5` main + `Qwen` + `GLiNER`
- `hybrid latest10`
- `autoaccept batch1-20`

## Run-By-Run JSON Audit

### Broad Raw Global Run

Artifact:

- `downloads-files-4/gr_output_global_exact_20260329/extraction_summary.json`

Read:

- `200` chapters processed
- `245` errors
- `4034` extracted features
- summary does not stamp a surviving model name
- first saved error is an OpenAI quota failure

Interpretation:

- this is the broad early raw extraction branch
- it was operationally noisy
- it predates the cleaner staged March 30 pipeline shape

### Gemini Flash Pilot10

Artifact:

- `downloads-files-4/gr_output_global_exact_gemini_flash_pilot10_20260329/extraction_summary.json`

Read:

- provider: `gemini`
- model: `gemini-2.5-flash`
- `10` chapters
- `0` errors
- `778` extracted features
- extremely large chapter feature counts, including:
  - `22q11.2 Deletion Syndrome: 107`
  - `Achondroplasia: 168`

Interpretation:

- this was a real Gemini branch
- it was broad and high-recall
- it also looked too loose for direct ingestion

### Gemini Anchor-First Pilot10 V2

Artifact:

- `downloads-files-4/gr_output_global_exact_gemini_anchor_pilot10_v2_20260329/extraction_summary.json`

Read:

- pipeline: `anchor_first_metadata`
- provider: `gemini`
- model: `gemini-2.5-flash`
- `10` chapters
- `0` errors
- `189` extracted features
- `thoughts_tokens: 115886`

Interpretation:

- this is the first clearly more disciplined Gemini architecture branch
- it narrows candidate discovery around anchor blocks instead of broad chapter-wide dumping

### Gemini Anchor-First Pilot3 No-Thinking

Artifact:

- `downloads-files-4/gr_output_global_exact_gemini_anchor_pilot3_no_thinking_20260329/extraction_summary.json`

Read:

- pipeline: `anchor_first_metadata`
- provider: `gemini`
- model: `gemini-2.5-flash`
- `3` chapters
- `0` errors
- `79` extracted features
- `thoughts_tokens: 0`

Interpretation:

- same anchor-first design
- explicit no-thinking variant

### Gemini Anchor-First Batch2 No-Thinking

Artifact:

- `downloads-files-4/gr_output_global_exact_gemini_anchor_batch2_no_thinking_20260329/extraction_summary.json`

Read:

- pipeline: `anchor_first_metadata`
- provider: `gemini`
- model: `gemini-2.5-flash`
- `10` chapters
- `0` errors
- `99` extracted features
- `thoughts_tokens: 0`

Interpretation:

- anchor-first architecture persisted
- thinking-budget variants were being compared explicitly

### Latest5 Main Saved Pipeline

Artifacts:

- `output/genereviews-pipeline-latest5-20260330/stage3_candidates/candidates_summary.json`
- `output/genereviews-pipeline-latest5-20260330/stage3_candidates/ZAP70_Related_Combined_Immunodeficiency_candidates.json`
- `output/genereviews-pipeline-latest5-20260330/stage5_enriched/metadata_summary.json`
- `output/genereviews-pipeline-latest5-20260330/stage6_manifest/manifest_summary.json`

Read:

- stage3 summary:
  - `5` processed
  - `0` errors
  - candidate counts:
    - `17`
    - `4`
    - `64`
    - `16`
    - `43`
- example candidate JSON stamps:
  - model: `gemini-2.5-flash`
- stage5 metadata summary:
  - `25` processed
  - `0` errors
  - chapter rows repeated multiple times
- stage6 manifest summary:
  - `35` processed
  - `0` errors
  - `0` manifest rows
  - `5` review rows
  - chapter rows repeated multiple times

Interpretation:

- this is the recovered main `latest5` pipeline branch
- it is review-first and end-to-end
- the stage5 and stage6 summaries are real but resume-duplicated, so they are not clean per-chapter counters
- the authoritative outcome is still:
  - review-only
  - `5` chapters
  - no accepted manifest rows

### Latest5 Qwen Comparison Branch

Artifacts:

- `output/genereviews-qwen-latest5-20260330/stage3_candidates/candidates_summary.json`
- `output/genereviews-qwen-latest5-20260330/stage3_candidates/ZAP70_Related_Combined_Immunodeficiency_candidates.json`

Read:

- provider: `dashscope`
- model: `qwen-max-latest`
- `5` processed
- `0` errors
- candidate counts:
  - `6`
  - `14`
  - `41`
  - `13`
  - `25`

Interpretation:

- this branch is real
- it is a saved candidate-discovery comparison branch
- it beat `GLiNER` on breadth
- it did not replace the saved main Gemini branch

### Latest5 GLiNER Comparison Branch

Artifacts:

- `output/genereviews-gliner-latest5-20260330/stage3_candidates/candidates_summary.json`
- `output/genereviews-gliner-latest5-20260330/stage3_candidates/ZAP70_Related_Combined_Immunodeficiency_candidates.json`

Read:

- provider: `gliner`
- model: `Ihor/gliner-biomed-small-v1.0`
- `5` processed
- `0` errors
- candidate counts:
  - `5`
  - `0`
  - `2`
  - `7`
  - `6`

Interpretation:

- clearly much sparser than both Gemini and Qwen
- useful as a comparison baseline, not as the winning candidate branch

### Latest5 Qwen Probe

Artifact:

- `output/genereviews-qwen-probe-latest5-20260330/stage3_candidates/candidates_summary.json`

Read:

- provider: `dashscope`
- model: `qwen-max-latest`
- `1` processed
- candidate count: `5`

Interpretation:

- this was a small probe, not the main saved run

### Hybrid Latest10 Main Branch

Artifacts:

- `output/genereviews-pipeline-hybrid-latest10-20260330/stage2b_phenotagger_api/phenotagger_api_summary.json`
- `output/genereviews-pipeline-hybrid-latest10-20260330/stage3_candidates/candidates_summary.json`
- `output/genereviews-pipeline-hybrid-latest10-20260330/stage3_candidates/YARS1_Deficiency_candidates.json`
- `output/genereviews-pipeline-hybrid-latest10-20260330/stage5_enriched_gemini/metadata_summary.json`
- `output/genereviews-pipeline-hybrid-latest10-20260330/stage5_enriched_medgemma/metadata_summary.json`
- `output/genereviews-pipeline-hybrid-latest10-20260330/stage6_manifest_gemini/manifest_summary.json`

Read:

- PhenoTagger stage:
  - `0` processed
  - `10` errors
  - all saved errors: `HTTP Error 404: Not Found`
- stage3 summary:
  - `10` processed
  - `0` errors
  - candidate counts:
    - `4`
    - `5`
    - `20`
    - `4`
    - `47`
    - `4`
    - `11`
    - `51`
    - `9`
    - `24`
- example candidate JSON stamps:
  - model: `gemini-2.5-flash`
- stage5 Gemini metadata:
  - `10` processed
  - `0` errors
- stage5 MedGemma metadata:
  - `0` processed
  - `10` errors
  - all saved errors: endpoint paused / `BAD_REQUEST`
- stage6 Gemini manifest:
  - `0` manifest rows
  - `10` review rows

Interpretation:

- saved main hybrid path is still Gemini
- PhenoTagger and MedGemma were attempted but blocked
- hybrid latest10 remained review-only

### Autoaccept Batch1-20

Artifacts:

- `output/genereviews-pipeline-autoaccept-batch1-20-20260330/batch1_actual_summary.json`
- `output/genereviews-pipeline-autoaccept-batch1-20-20260330/stage3_candidates/candidates_summary.json`
- `output/genereviews-pipeline-autoaccept-batch1-20-20260330/stage3_candidates/Achondroplasia_candidates.json`
- `output/genereviews-pipeline-autoaccept-batch1-20-20260330/stage5_enriched/metadata_summary.json`
- `output/genereviews-pipeline-autoaccept-batch1-20-20260330/stage6_manifest/manifest_summary.json`

Read:

- authoritative saved batch summary:
  - `20` chapters
  - `679` manifest rows
  - `0` review rows
  - `41` frequency-covered rows
  - `10` onset-covered rows
- example candidate JSON stamps:
  - model: `gemini-2.5-flash`
- stage3 summary is mixed:
  - `20` processed
  - `20` errors
  - candidate files are present
  - all saved errors say:
    - `Budget 0 is invalid. This model only works in thinking mode.`
- stage5 summary is mixed:
  - `20` processed
  - `20` errors
  - saved errors are missing mapped-candidate file paths
- stage6 summary is mixed:
  - `679` manifest rows
  - `0` review rows
  - also `20` saved errors for missing enriched files

Interpretation:

- the `batch1_actual_summary.json` is the authoritative evidence surface
- the stage summaries contain later rerun or bookkeeping noise layered on top of successful saved outputs
- the branch is still real and materially successful

## What Was Missing Or Blocked

Across the recovered runs:

- broad raw early extraction:
  - high parse noise
  - quota failures
- latest5 main:
  - no autoaccepted rows
  - review-only
  - duplicated stage summaries
- Qwen:
  - no saved proof that it became the main branch
- GLiNER:
  - clearly sparse recall
- hybrid latest10:
  - PhenoTagger API blocked by `404`
  - MedGemma endpoint paused
  - still review-only
- autoaccept batch1-20:
  - authoritative batch summary is strong
  - stage-level rerun summaries are noisy and cannot be read naively

## Recovered Engineering Progression

The saved progression now reads coherently:

1. broad raw extraction
2. honest roster / policy / review-first control plane
3. Gemini flash high-recall pilot10
4. Gemini anchor-first refinement
5. full `latest5` review-first staged pipeline with Gemini as the main candidate branch
6. Qwen and GLiNER side comparisons on the same `latest5` slice
7. hybrid latest10 with attempted PhenoTagger and MedGemma side branches
8. autoaccept batch1-20, where the authoritative batch summary shows real manifest output despite later rerun noise in stage summaries

## Recovered Model Roles

Best recovered read from saved primary sources:

- deterministic anchors:
  - local graph lexicon first
- candidate discovery main branch:
  - `Gemini 2.5 Flash`
- candidate comparison branches:
  - `Qwen Max Latest`
  - `GLiNER`
- HPO mapping:
  - lexical plus `BioLORD-2023`
- metadata:
  - deterministic first
  - Gemini metadata path in successful saved runs
  - MedGemma only as guarded fallback experiment

## Evidence Not Recovered

From the GitHub and bucket artifact surfaces inspected in this recovery, I did not recover saved primary-source evidence for:

- `Gemini Pro`
- `Gemini 3.1 Pro`

That does not prove those tests never happened. It means they do not survive in the inspected saved artifact surfaces strongly enough to be treated as recovered project memory.

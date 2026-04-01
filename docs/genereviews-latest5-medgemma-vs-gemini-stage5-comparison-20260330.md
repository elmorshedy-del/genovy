# GeneReviews `latest5` Stage-5 Comparison (`Gemini Preview` vs `MedGemma`)

## Scope

This comparison reused the already repaired settled `latest5` outputs for:

- `stage1_fetch`
- `stage2b_phenotagger_local`
- `stage2_anchors`
- `stage3_candidates`
- `stage4_mapped_candidates`

Only the tricky stages were rerun:

- Stage 5 metadata extraction
- Stage 6 manifest/review cleanup

No upstream fetch, anchor, candidate, or mapping stages were rerun.

## Required Fixes Before The Comparison

Two concrete issues had to be fixed before the MedGemma branch could run honestly:

1. `MedGemma` endpoint path
   - the Hugging Face vLLM endpoint serves OpenAI-compatible chat at:
     - `/v1/chat/completions`
   - the shared helper was posting to:
     - `/chat/completions`
   - fix applied in:
     - `src/lib/genereviewsPipeline.js`

2. Manifest DB environment
   - `buildEnrichmentManifest.js` needs phenotype and ontology rows from the enrichment graph
   - local direct execution fell back to localhost Postgres
   - the clean manifest run was executed through:
     - `railway run -e v1-enrich-0328 -s Postgres-Enrichment-Symmetry -- ...`

## Commands Actually Run

Metadata:

```bash
MEDGEMMA_BASE_URL='https://aro6p9a835d7pnd5.us-east-1.aws.endpoints.huggingface.cloud' \
node src/scripts/extractPhenotypeMetadata.js \
  --policy data/source-enrichment/genereviews-chapter-policy-latest5-20260330.json \
  --anchors output/genereviews-pipeline-latest5-settled-20260330/stage2_anchors \
  --mapped output/genereviews-pipeline-latest5-settled-20260330/stage4_mapped_candidates \
  --output output/genereviews-pipeline-latest5-settled-20260330/stage5_enriched_medgemma_clean \
  --provider medgemma \
  --medgemmaApiKeyEnv MEDGEMMA_API_KEY \
  --baseUrlEnv MEDGEMMA_BASE_URL \
  --limit 5
```

Manifest:

```bash
railway run -e v1-enrich-0328 -s Postgres-Enrichment-Symmetry -- \
node src/scripts/buildEnrichmentManifest.js \
  --policy data/source-enrichment/genereviews-chapter-policy-latest5-20260330.json \
  --input output/genereviews-pipeline-latest5-settled-20260330/stage5_enriched_medgemma_clean \
  --output output/genereviews-pipeline-latest5-settled-20260330/stage6_manifest_medgemma_clean \
  --sourceKey genereviews_nlp \
  --limit 5
```

Endpoint was resumed before the run and paused again after completion.

## Authoritative Artifacts

Gemini preview:

- `output/genereviews-pipeline-latest5-settled-20260330/stage5_enriched_gemini_preview/metadata_summary_clean.json`
- `output/genereviews-pipeline-latest5-settled-20260330/stage6_manifest_gemini_preview_clean/manifest_summary.json`

MedGemma:

- `output/genereviews-pipeline-latest5-settled-20260330/stage5_enriched_medgemma_clean/metadata_summary.json`
- `output/genereviews-pipeline-latest5-settled-20260330/stage6_manifest_medgemma_clean/manifest_summary.json`

## Aggregate Result

| Metric | Gemini preview | MedGemma | Read |
|---|---:|---:|---|
| Chapters processed | 5 | 5 | tie |
| Stage-5 errors | 0 | 0 | tie |
| Frequency covered | 37 | 40 | MedGemma +3 |
| Onset covered | 4 | 34 | MedGemma +30 |
| Cleaned features after Stage 6 | 179 | 179 | tie |
| Review rows | 5 | 5 | tie |
| Manifest rows | 0 | 0 | tie |

## Chapter-Level Differences

| Chapter | Gemini freq | MedGemma freq | Gemini onset | MedGemma onset | Gemini cleaned | MedGemma cleaned |
|---|---:|---:|---:|---:|---:|---:|
| `y_chromosome_infertility` | 0 | 0 | 0 | 0 | 4 | 5 |
| `yif1b_related_neurodevelopmental_disorder` | 2 | 2 | 1 | 1 | 32 | 32 |
| `zap70_related_combined_immunodeficiency` | 4 | 4 | 1 | 12 | 28 | 27 |
| `zellweger_spectrum_disorder` | 2 | 2 | 0 | 12 | 20 | 20 |
| `zhu_tokita_takenouchi_kim_syndrome` | 29 | 32 | 2 | 9 | 95 | 95 |

## Concrete Evidence Read

The MedGemma improvement is not just synthetic count inflation. It produced plausible onset grounding that the preview branch largely missed.

Examples:

- `ZAP70`
  - MedGemma extracted onset-backed rows such as:
    - `Autoimmunity -> older age`
    - `Colitis -> infantile`
    - `Lymphoma -> infancy`
  - Gemini preview only surfaced one onset-backed row there:
    - `Cerebral infarct -> Congenital onset`

- `Zellweger`
  - MedGemma surfaced onset-backed rows such as:
    - `Adrenal insufficiency -> Childhood`
    - `Feeding difficulties -> Neonatal`
    - `Neonatal seizure -> Neonatal`
    - `Pigmentary retinopathy -> neonatal`
  - Gemini preview surfaced no onset-backed rows in that chapter

The final Stage-6 routing remained conservative for both models:

- `0` manifest rows
- `5` review rows

So MedGemma improved metadata recall without changing the review-first posture of the slice.

## Decision Read

Current evidence on the repaired settled `latest5` slice favors:

- `Gemini Flash` for Stage 3 candidate discovery
- `MedGemma` as the current leader for Stage 5 metadata extraction

This is not yet a claim that every future slice will behave identically, but it is enough to treat MedGemma as the active default candidate for Stage 5 while the next blocker is addressed.

## Remaining Open Blocker Before Scale-Out

The main unresolved launch blocker is no longer the Stage-5 model choice.

It is:

- a stable explicit negation / excluded-finding layer

That should now be built and tested on this same fixed settled `latest5` slice before expanding to a larger pilot.

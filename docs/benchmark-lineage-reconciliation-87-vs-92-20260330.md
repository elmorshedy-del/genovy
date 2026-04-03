# Benchmark Lineage Reconciliation: 87% vs 92%

Date: 2026-03-30

## Purpose

This document reconciles the two benchmark states that were getting mentally conflated:

- the current real working baseline at `87% found`
- the saved March 29 historical branch at `92% found`

The goal is to make the upgrade path explicit without pretending these are already the same lineage.

## State A: Current Working Baseline

Artifact:
- `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/output/official-real-v1-working-handoff-floor-1.0-20260326.json`

Saved topline:
- `case_count: 100`
- `found_count: 87`
- `top1_count: 42`
- `top3_count: 51`
- `top5_count: 53`
- `top10_count: 62`
- `median_rank: 2`
- `mrr: 0.4887`
- `miss_count: 13`
- `>100 but found count: 0`

Interpretation:
- this is the clean current no-regression working line
- it is the safe baseline for future shadows and replays
- it already contains the real `1.0` handoff-floor working state

## State B: Saved March 29 Stronger Historical Branch

Artifact:
- `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/output/official-v1-enrich-structured-plus-manual-curated-20260329.json`

Saved topline:
- `case_count: 100`
- `found_count: 92`
- `top1_count: 42`
- `top3_count: 53`
- `top5_count: 57`
- `top10_count: 65`
- `median_rank: 2`
- `mrr: 0.503832`
- `miss_count: 8`
- `>100 but found count: 0`

Interpretation:
- this is a stronger saved benchmark state
- it is real
- it is not the same thing as the current working baseline

## What Actually Produced The 92% State

The March 29 uplift came from two layers together, not one:

### 1. Structured global enrichment layer

Artifacts:
- `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/output/official-v1-enrich-structured-global-20260329.json`
- `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/output/source-enrichment-manifest-structured-global-20260329.json`

Saved benchmark state for this layer alone:
- `86 found`
- `43 top-1`
- `51 top-3`
- `55 top-5`
- `63 top-10`
- `MRR 0.499033`

Meaning:
- this was a whole-graph structured source import
- it improved some things
- by itself it did not reach `92%`

### 2. Manual curated overlay layer

Artifact:
- `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/output/manual-curated-source-shadow-manifest-20260329.json`

Saved manifest facts:
- `entryCount: 26`
- `skippedCount: 7`
- `sourceKey: manual_curated_source_shadow`
- `strategy: manual_curated_source_shadow_overlay`

Inputs recorded in the manifest:
- `shadow-setd2-symmetric-source-terms-20260326.json`
- `shadow-socs1-symmetric-source-terms-20260326.json`
- `shadow-u2af2-symmetric-source-terms-20260327.json`
- `shadow-ppp2r1a-truth-source-terms-20260327.json`
- `shadow-rere-symmetric-case-series-terms-20260326.json`
- `shadow-rere-symmetric-omim-terms-20260326.json`

Meaning:
- the saved uplift was not a vague tweak
- it was a provenance-carrying overlay on top of the structured graph
- that overlay is what closed the gap from `86` to `92`

## What This Means Operationally

The difference between `87%` and `92%` is not “mystery drift.”

It is mostly:
- one current safe working scorer lineage
- versus
- one saved stronger enrichment branch built from:
  - structured global enrichment
  - plus a 26-entry manual curated overlay

So the real bridge is not “just rerun benchmark.”
The real bridge is:

1. recreate or recover the structured global layer in the current working environment
2. recreate or recover the 26-entry manual curated overlay in the current working environment
3. rerun the official benchmark on the current working line
4. compare case-by-case against the saved `92%` artifact

## What Needs To Be Reapplied Or Reconstructed

### Already understood and saved

- the current working scorer baseline
- the March 29 stronger result
- the exact manual curated manifest shape
- the broad structured global branch as a distinct layer

### Still needed for a safe catch-up

- a current-environment replay path for the March 29 structured global import
- a current-environment replay path for the March 29 26-entry manual curated overlay
- a direct case-by-case diff between:
  - current `87%` working baseline
  - replayed branch
  - saved `92%` branch

## Guardrails

The replay must preserve these rules:

- no scorer edits while replaying enrichment lineage
- no hand-added undocumented rows
- only provenance-carrying manifests
- every replay must be benchmarked against the current `87%` baseline
- the March 29 saved state is a target for reconstruction, not a license to silently mix lineages

## Current Best Read

We now know the honest answer:

- the current working line is safe but not yet caught up
- the saved `92%` line is stronger but historically separate
- the gap is mostly an enrichment-lineage replay problem, not a forgotten scorer trick

That means the next engineering move is not theory.
It is reconstruction:

- make the enrichment replay path durable
- replay it on the real current line
- verify whether the working line can safely inherit the March 29 uplift

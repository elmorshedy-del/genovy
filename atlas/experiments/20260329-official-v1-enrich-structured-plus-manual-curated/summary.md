# 2026-03-29 Official `v1` Enrich Structured Plus Manual Curated

## Question

What was the saved stronger benchmark branch after the March 29 enrichment work, and how did it differ from the later safe `87 found` working floor?

## Lineage

- saved March 29 historical enrichment branch
- enrichment layers:
  - structured global enrichment
  - provenance-carrying manual curated overlay

## Files generated together

- saved benchmark artifact:
  - `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/output/official-v1-enrich-structured-plus-manual-curated-20260329.json`
- structured global benchmark precursor:
  - `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/output/official-v1-enrich-structured-global-20260329.json`
- manual curated overlay manifest:
  - `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/output/manual-curated-source-shadow-manifest-20260329.json`
- machine-readable local mirror:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260329-official-v1-enrich-structured-plus-manual-curated/artifacts.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260329-official-v1-enrich-structured-plus-manual-curated/artifacts.json)
- local artifact index:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260329-official-v1-enrich-structured-plus-manual-curated/artifact-index.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260329-official-v1-enrich-structured-plus-manual-curated/artifact-index.md)
- reconciliation anchor:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/benchmark-lineage-reconciliation-87-vs-92-20260330.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/benchmark-lineage-reconciliation-87-vs-92-20260330.md)

## Result

Saved March 29 Genovy benchmark:

- found: `92`
- top-1: `42`
- top-3: `53`
- top-5: `57`
- top-10: `65`
- median rank: `2`
- MRR: `0.503832`
- miss count: `8`

Against the later safe current baseline:

- current safe baseline:
  - `87 / 42 / 51 / 53 / 62 / 0.4887`
- saved March 29 branch:
  - `92 / 42 / 53 / 57 / 65 / 0.503832`

Direct delta versus the current safe baseline:

- found: `87 -> 92`
- top-3: `51 -> 53`
- top-5: `53 -> 57`
- top-10: `62 -> 65`
- MRR: `0.4887 -> 0.503832`
- misses: `13 -> 8`

## Why it matters

This is the strongest saved benchmark state currently documented in the project. It is historically separate from the later safe working floor and should be cited as the saved March 29 enrichment branch, not as the present no-regression baseline.

The uplift did not come from one vague GeneReviews policy change. It came from two explicit layers together:

- `official-v1-enrich-structured-global-20260329.json`:
  - `86 found`
- plus the saved `26`-entry manual curated overlay:
  - this is what closed the gap to `92 found`

## Status

- `saved stronger historical branch`

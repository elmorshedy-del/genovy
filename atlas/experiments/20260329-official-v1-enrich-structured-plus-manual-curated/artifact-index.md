# 2026-03-29 Saved `92 Found` Artifact Index

This index preserves the exact historical artifact family that produced the saved March 29 stronger benchmark branch.

## Primary saved benchmark artifact

- final saved branch:
  - `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/output/official-v1-enrich-structured-plus-manual-curated-20260329.json`
  - role:
    - saved stronger historical benchmark branch
    - topline: `92 / 42 / 53 / 57 / 65 / 0.503832`

## Direct precursor artifacts

- structured global enrichment branch:
  - `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/output/official-v1-enrich-structured-global-20260329.json`
  - role:
    - benchmark precursor before the manual curated overlay
    - topline: `86 found`

- structured global enrichment manifest:
  - `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/output/source-enrichment-manifest-structured-global-20260329.json`
  - role:
    - provenance-carrying manifest for the structured global layer

- manual curated overlay manifest:
  - `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/output/manual-curated-source-shadow-manifest-20260329.json`
  - role:
    - provenance-carrying overlay manifest that closed the gap from `86` to `92`
  - saved manifest facts:
    - `entryCount: 26`
    - `skippedCount: 7`
    - `sourceKey: manual_curated_source_shadow`
    - `strategy: manual_curated_source_shadow_overlay`

## Manual curated overlay inputs recorded in the saved manifest

- `shadow-setd2-symmetric-source-terms-20260326.json`
- `shadow-socs1-symmetric-source-terms-20260326.json`
- `shadow-u2af2-symmetric-source-terms-20260327.json`
- `shadow-ppp2r1a-truth-source-terms-20260327.json`
- `shadow-rere-symmetric-case-series-terms-20260326.json`
- `shadow-rere-symmetric-omim-terms-20260326.json`

## Local anchor docs

- machine-readable mirror:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260329-official-v1-enrich-structured-plus-manual-curated/artifacts.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260329-official-v1-enrich-structured-plus-manual-curated/artifacts.json)
- benchmark summary:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260329-official-v1-enrich-structured-plus-manual-curated/summary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260329-official-v1-enrich-structured-plus-manual-curated/summary.md)
- reconciliation doc:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/benchmark-lineage-reconciliation-87-vs-92-20260330.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/benchmark-lineage-reconciliation-87-vs-92-20260330.md)
- bucket path slice:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/gcs-march29-30-path-slice.txt](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/gcs-march29-30-path-slice.txt)
- bucket understanding report:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/march29-30-bucket-understanding-report-20260330.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/march29-30-bucket-understanding-report-20260330.md)

## Important limitation

These artifacts are preserved here as an explicit local index of the historical bucket objects and their roles.

They are not downloaded local JSON copies in the repo working tree.

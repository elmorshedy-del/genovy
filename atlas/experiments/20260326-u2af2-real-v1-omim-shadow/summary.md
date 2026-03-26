# 2026-03-26 U2AF2 Real `v1` OMIM Shadow

## Question

On the real `v1-working` lineage, does OMIM-backed shadow enrichment help the hard U2AF2 case once the gene is known to be reachable?

## Lineage

- real Railway `genovy-v1-working-20260322`
- large lineage:
  - `3,251,168` entities

## Files generated together

- OMIM extract:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/u2af2-manual-omim-extract-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/u2af2-manual-omim-extract-20260326.md)
- baseline real-lineage rerun:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/u2af2-real-v1-working-handoff-floor-1.0-20260326.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/u2af2-real-v1-working-handoff-floor-1.0-20260326.json)
- OMIM shadow rerun:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/u2af2-real-v1-working-omim-shadow-20260326.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/u2af2-real-v1-working-omim-shadow-20260326.json)
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/u2af2-real-v1-working-omim-shadow-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/u2af2-real-v1-working-omim-shadow-20260326.md)

## Result

Baseline on real `v1`:

- `PMID_36747105_proband`: `rank 1`
- `PMID_37962958_43`: `rank 958`

OMIM-backed shadow:

- `PMID_36747105_proband`: `1 -> 1`
- `PMID_37962958_43`: `958 -> 2`

## Why it matters

This is the corrected U2AF2 story.

The earlier “U2AF2 is invisible and OMIM does nothing” conclusion only applied to the wrong small lineage. On the real working DB, U2AF2 is reachable, and OMIM-backed disease-profile enrichment is highly effective for the hard case.

## Status

- `kept`

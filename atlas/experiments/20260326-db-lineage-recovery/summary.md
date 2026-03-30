# 2026-03-26 DB Lineage Recovery

## Question

Why were the project conclusions drifting, and were the ClinVar bridge and later U2AF2 findings actually gone or just being queried from the wrong place?

## Lineage

- preservation and integrity recovery phase

## Files generated together

- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/db-lineage-audit-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/db-lineage-audit-20260326.md)
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/integrity-findings-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/integrity-findings-20260326.md)
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/railway-ops-map-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/railway-ops-map-20260326.md)

## Result

Main correction:

- `production` and `v0-freeze` were the small lineage:
  - `81,870` entities
- real `genovy-v1-working-20260322` was the large lineage:
  - `3,251,168` entities

Consequences:

- earlier “U2AF2 has zero relationships” was a wrong-lineage result
- earlier “ClinVar bridge disappeared” was also a wrong-lineage result
- real `v1-working` still had:
  - live ClinVar-derived bridge surface
  - direct U2AF2 `associated_with_disease` edges

Operational correction:

- the canonical working clone was relinked explicitly to:
  - `invigorating-integrity / genovy-v1-working-20260322`
- the dangerous Railway fallback to `just-grace` was removed from the home-directory mapping

## Why it matters

This is the key integrity bundle. It restored trust in the late March work and explains why some earlier conclusions had to be withdrawn or re-labeled as small-lineage-only.

## Status

- `current structural anchor`

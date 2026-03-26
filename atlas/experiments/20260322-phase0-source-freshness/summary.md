# 2026-03-22 Phase 0 Source Freshness Audit

## Question

Which source surfaces were actually stale, and was the freeze split operationally real?

## Lineage

- small working clone lineage at the time:
  - `81,870` entities
- environment:
  - `genovy-v1-working-20260322`

## Files generated together

- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/source-freshness-audit-phase0-20260322.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/source-freshness-audit-phase0-20260322.md)
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genovy-non-negotiable-fixes.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genovy-non-negotiable-fixes.md)

## Result

Proved:

- `v0` freeze and `v1-working` split were real
- MONDO and main HPO surfaces were current
- the obvious freshness gaps were:
  - `clingen_gene_disease_validity`
  - `clinvar_gene_disease`
  - `clinvar_variant_summary`
- provenance capture was incomplete on several important sources

## Why it matters

This is the formal pivot away from blind scorer tuning toward a disciplined sequence:

1. preserve the baseline
2. repair freshness and provenance
3. then revisit the miss tail

## Status

- `kept`

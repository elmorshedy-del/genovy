# Graph Structural Spectrum Audit

Run label: post-clinvar-run54
Generated at: 2026-03-24T00:07:32.328Z

## Baseline-Aligned Structural Spectrum

| Bucket | Count | Share | Delta vs prior audit |
| --- | ---: | ---: | ---: |
| Hollow shell | 148 | 2.59% | 125 |
| Sparse one-sided | 504 | 8.83% | 78 |
| Poorly enriched two-sided | 1207 | 21.16% | 430 |
| Better covered | 3846 | 67.41% | -633 |

Cutoffs used: disease links <= 3, phenotype links <= 19

## Current Quartile Reference

Two-sided Q1 disease cutoff: 1
Two-sided Q1 phenotype cutoff: 18

## ClinVar-Derived Disease Support Slice

Genes with ClinVar-derived disease support: 4671
Genes whose only disease support is ClinVar-derived: 2759
Genes with ClinVar-derived disease support and phenotype support: 4594

## Evidence Boundaries

- Inspected: canonical gene concepts, normalized-label matched live gene entities, live relationship counts for associated_with_disease and associated_with_phenotype, relationship evidence flags for clinvar_variant_derived.
- Not inspected: raw ClinVar rows, raw HPO files, per-gene manual curation quality, benchmark phenopackets.
- Confidence: high for structural counts; structural thinness is still not the same as clinical benchmark failure.

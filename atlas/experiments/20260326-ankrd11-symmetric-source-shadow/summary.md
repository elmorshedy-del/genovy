# 2026-03-26 ANKRD11 Symmetric Source Shadow

## Question

If we add only source-backed missing terms symmetrically to both the true disease and the outranker disease, will the current scorer choose the true `ANKRD11` branch?

## Lineage

- real Railway `genovy-v1-working-20260322`

## Files generated together

- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/ankrd11-symmetric-source-shadow-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/ankrd11-symmetric-source-shadow-20260326.md)
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowAnkrd11SymmetricSourceTerms.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowAnkrd11SymmetricSourceTerms.js)
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-ankrd11-symmetric-source-terms-20260326.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-ankrd11-symmetric-source-terms-20260326.json)

## Result

`PMID_36446582_Goldenberg2016_P13`

- `ANKRD11` rank `395 -> 312`
- winner stayed `GDF5`

`PMID_36446582_Miyatake2017_P1`

- `ANKRD11` rank `176 -> 112`
- winner stayed `GAL`

## Why it matters

This was the first fair test of the “no cheating, add terms symmetrically” rule on ANKRD11. It helped both cases, but it did not flip them. That established that ANKRD11 is not a pure hidden-term case.

## Status

- `kept`

# ANKRD11 Symmetric OMIM Shadow

Created: 2026-03-26T16:23:43.758Z

## Scenarios

### OMIM Literal Structural Terms

Only add strict OMIM-backed structural terms that are explicitly described on the truth and outranker disease branches and are currently absent from the live direct profile.

Added terms: 2
Skipped existing: 1
Missing from ontology: 0
Found: 100% -> 100%
Top-1: 0% -> 0%
MRR: 0.003576 -> 0.003576

- PMID_36446582_Goldenberg2016_P13: truth 696 -> 696; top1 GDF5 -> GDF5
- PMID_36446582_Miyatake2017_P1: truth 175 -> 175; top1 GAL -> GAL

### OMIM Cumulative With Prior Source Shadow

Start from the earlier symmetric source-backed additions, then layer in the strict new OMIM structural terms on top of both the truth and outranker branches.

Added terms: 7
Skipped existing: 1
Missing from ontology: 0
Found: 100% -> 100%
Top-1: 0% -> 0%
MRR: 0.003576 -> 0.0064

- PMID_36446582_Goldenberg2016_P13: truth 696 -> 696; top1 GDF5 -> GDF5
- PMID_36446582_Miyatake2017_P1: truth 175 -> 88; top1 GAL -> GAL


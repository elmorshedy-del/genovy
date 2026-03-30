# 2026-03-23 Post-ClinVar Run54

## Question

After the full ClinVar bridge pass, did the graph and the benchmark actually improve?

## Lineage

- post-ClinVar working state as captured by run54 artifacts

## Files generated together

- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/post-clinvar-run54-audit-and-benchmark.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/post-clinvar-run54-audit-and-benchmark.md)
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326/official-benchmark-post-clinvar-run54.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326/official-benchmark-post-clinvar-run54.json)
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326/official-benchmark-post-clinvar-run54.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326/official-benchmark-post-clinvar-run54.md)

## Result

- found: `82 -> 83`
- top-10: `58 -> 57`
- MRR: `0.409669 -> 0.410153`
- recovered:
  - `U2AF2 PMID_36747105_proband: miss -> 30`

Graph-side read from the same run:

- genes with ClinVar-derived disease support: `4671`
- only-disease-support-from-ClinVar genes: `2759`

## Why it matters

This experiment proved the ClinVar bridge was real. It did not transform the whole benchmark, but it closed a real official-source gap and expanded disease support across the graph.

## Status

- `kept`

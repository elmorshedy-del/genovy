# 2026-03-20 Child-Direct Walkback

## Question

Would rerouting parent diseases down into child direct links rescue the benchmark tail?

## Lineage

- pre-freeze benchmark artifact surface
- preserved from:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326)

## Files generated together

- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326/shadow-child-direct-20260320-154908.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326/shadow-child-direct-20260320-154908.json)
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326/shadow-child-direct-20260320-154908.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326/shadow-child-direct-20260320-154908.md)

## Result

- found: `82 -> 83`
- top-1: `34 -> 31`
- top-10: `57 -> 56`
- MRR: `0.409646 -> 0.381731`
- recovered from miss: `6`
- regressed to miss: `5`

## Why it matters

This experiment looked tempting because it recovered some misses, but it damaged the benchmark too broadly. It became an early warning that path surgery could buy isolated wins while making the overall ranking surface worse.

## Status

- `disproved`

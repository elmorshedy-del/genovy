# 2026-03-21 Support-Direct Walkback

## Question

If the scorer simply preferred direct support over propagated-only support, would the remaining miss tail shrink?

## Lineage

- pre-freeze benchmark artifact surface
- preserved from:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326)

## Files generated together

- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326/shadow-support-direct-par-1.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326/shadow-support-direct-par-1.json)
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326/shadow-support-direct-par-1.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326/shadow-support-direct-par-1.md)

## Result

- found: `82 -> 82`
- top-10: `57 -> 57`
- MRR: `0.409646 -> 0.409646`
- improved: `0`
- worsened: `0`

## Why it matters

This falsified a very clean theory. Pure direct-over-propagated preference by itself moved `0/100` cases. That mattered later when the project returned to the handoff leak: the useful lever turned out to be disease-to-gene handoff weight, not simple support selection.

## Status

- `disproved`

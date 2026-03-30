# Gene Index

This is the fastest lookup path when you know the gene first and want the most relevant docs, shadows, and corrections.

## U2AF2

Current read:
- on real `v1-working`, one case is already rank `1`
- the harder case is reachable but weak
- OMIM shadow can move the hard case sharply upward

Key files:
- real `v1` benchmark:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-real-v1-working-handoff-floor-1.0-20260326.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-real-v1-working-handoff-floor-1.0-20260326.json)
- real `v1` OMIM shadow:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260326-u2af2-real-v1-omim-shadow/summary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260326-u2af2-real-v1-omim-shadow/summary.md)
- lineage correction:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260326-db-lineage-recovery/summary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260326-db-lineage-recovery/summary.md)

## STXBP1

Current read:
- mixed branch-thinness plus scorer geometry
- targeted branch enrichment helps the disease branch
- handoff leak was real and helped inspire the global `1.0` rule

Key files:
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-single-case-audit-20260325.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-single-case-audit-20260325.md)
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-disease-branch-audit-20260325.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-disease-branch-audit-20260325.md)
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-discriminating-term-shadow-test-20260325.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-discriminating-term-shadow-test-20260325.md)
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326/shadow-stxbp1-case-slice-handoff-floor-20260325-limit100.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326/shadow-stxbp1-case-slice-handoff-floor-20260325-limit100.md)

## ANKRD11

Current read:
- one case is mostly truth-branch thinness
- one case is hybrid: real KBG support exists, but narrow sharper branches still win

Key files:
- symmetric source shadow:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260326-ankrd11-symmetric-source-shadow/summary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260326-ankrd11-symmetric-source-shadow/summary.md)
- manual OMIM extract:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/ankrd11-manual-omim-extract-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/ankrd11-manual-omim-extract-20260326.md)
- symmetric OMIM shadow:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260326-ankrd11-symmetric-omim-shadow/summary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260326-ankrd11-symmetric-omim-shadow/summary.md)

## PPP2R1A

Current read:
- mixed ranking plus truth-profile weakness
- not a clean “just add terms” case

Key files:
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/sptan1-topk-shadow-and-ppp2r1a-reassessment-20260325.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/sptan1-topk-shadow-and-ppp2r1a-reassessment-20260325.md)
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/official-handoff-floor-1.0-benchmark-20260325.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/official-handoff-floor-1.0-benchmark-20260325.md)

## SPTAN1

Current read:
- real ranking and specificity leftover
- top-k profile softening helped but did not rescue it

Key files:
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/sptan1-topk-shadow-and-ppp2r1a-reassessment-20260325.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/sptan1-topk-shadow-and-ppp2r1a-reassessment-20260325.md)

## RERE

Current read:
- current miss-tail candidate that still looks like a clean undercovered truth branch

Key files:
- miss-tail anchor:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-real-v1-working-handoff-floor-1.0-20260326.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-real-v1-working-handoff-floor-1.0-20260326.json)

## WWOX

Current read:
- major beneficiary of the handoff-floor change
- useful positive example of a truth branch that was already there and just needed better scorer geometry

Key files:
- generic `1.0` shadow:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260325-generic-handoff-floor-w1-shadow/summary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260325-generic-handoff-floor-w1-shadow/summary.md)

## SCN2A

Current read:
- another major beneficiary of the handoff-floor change
- useful positive example that the global scorer fix mattered beyond STXBP1

Key files:
- generic `1.0` shadow:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260325-generic-handoff-floor-w1-shadow/summary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260325-generic-handoff-floor-w1-shadow/summary.md)

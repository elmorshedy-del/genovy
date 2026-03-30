# 2026-03-25 Generic Handoff Floor `1.0` Shadow

## Question

If the disease-to-gene handoff floor is globally raised to `1.0` for already-specific direct disease matches, how much benchmark lift is available before any real scorer patch is shipped?

## Lineage

- shadow benchmark surface from the March 25 scorer investigation phase

## Files generated together

- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/generic-specific-direct-handoff-floor-shadow-20260325-w1.0.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/generic-specific-direct-handoff-floor-shadow-20260325-w1.0.md)
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326/shadow-generic-specific-direct-handoff-floor-20260325-w1.0.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326/shadow-generic-specific-direct-handoff-floor-20260325-w1.0.json)
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326/shadow-generic-specific-direct-handoff-floor-20260325-w1.0.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326/shadow-generic-specific-direct-handoff-floor-20260325-w1.0.md)

## Result

- found: `82 -> 84`
- top-1: `34 -> 42`
- top-3: `43 -> 52`
- top-5: `46 -> 53`
- top-10: `57 -> 60`
- MRR: `0.409646 -> 0.485974`
- improved: `21`
- worsened: `14`
- recovered from miss: `2`
- regressed to miss: `0`

## Why it matters

This was the clearest proof that the handoff leak was real and high leverage. It also showed the tradeoff: the upside was large, but the regression surface expanded too much to treat the shadow result as safe by itself.

## Status

- `kept as causal proof`

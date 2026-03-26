# 2026-03-26 Official Real `v1` Handoff Floor `1.0`

## Question

On the real `v1-working` lineage, what is the file-backed official benchmark state of the current `1.0` scorer?

## Lineage

- real Railway `genovy-v1-working-20260322`
- large lineage:
  - `3,251,168` entities

## Files generated together

- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-real-v1-working-handoff-floor-1.0-20260326.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-real-v1-working-handoff-floor-1.0-20260326.json)
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-real-v1-working-handoff-floor-1.0-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-real-v1-working-handoff-floor-1.0-20260326.md)
- lineage anchor:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/db-lineage-audit-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/db-lineage-audit-20260326.md)

## Result

Current Genovy benchmark:

- found: `87`
- top-1: `42`
- top-3: `51`
- top-5: `53`
- top-10: `62`
- median rank: `2`
- MRR: `0.4887`

Against Exomiser:

- Exomiser found: `100`
- Exomiser top-1: `39`
- Exomiser top-3: `46`
- Exomiser top-5: `48`
- Exomiser top-10: `55`
- Exomiser MRR: `0.447212`

Delta vs the earlier `handoff-floor-1.0` artifact surface:

- found: `84 -> 87`
- top-10: `60 -> 62`
- MRR: `0.485974 -> 0.4887`
- recovered from miss: `3`
- regressed to miss: `0`

Recovered from miss in this real-lineage rerun:

- `WWOX` `PMID_27495153_Patient1`
- `STXBP1` `PMID_35190816_STX_Syrbe_6`
- `U2AF2` `PMID_36747105_proband`

## Why it matters

This is the current best file-backed benchmark in the project. It is the cleanest line to cite when describing the present Genovy scorer state, because it is explicitly tied to the corrected real `v1-working` lineage.

## Status

- `current baseline`

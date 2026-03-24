# Ranked Output Audit: Ranking-Problem Cases

Date:
- 2026-03-24

Question:
- For the cases previously labeled as ranking-problem cases, what actually beats the truth gene in the live post-ClinVar graph?

Evidence surface:
- live working-graph similarity index built from:
  - disease phenotype rows
  - gene phenotype rows
  - gene disease support rows
- target case phenopackets from the official 100-case benchmark slice
- full ranked gene output up to `10,000` genes per case
- audit artifacts:
  - [ranked-output-audit-ranking-problem-cases-20260324.json](/Users/ahmedelmorshedy/Genovy/output/ranked-output-audit-ranking-problem-cases-20260324.json)
  - [ranked-output-audit-ranking-problem-cases-20260324.md](/Users/ahmedelmorshedy/Genovy/output/ranked-output-audit-ranking-problem-cases-20260324.md)

Intentionally not inspected:
- unofficial enrichment sources
- semantic-nearest-neighbor analysis
- non-target ranking cases outside this set

## Cases Audited
- `PMID_33731876_fam421` (`SCN2A`)
- `PMID_36331550_Family16Patient21` (`SPTAN1`)
- `PMID_37761890_41` (`PPP2R1A`)
- `PMID_37761890_43` (`PPP2R1A`)
- `PMID_30580808_Lo_twin_2-Fam-52` (`SMARCC2`)

## Aggregate Read
Across the `100` top-competitor slots above the truth genes:
- broad propagated zero-direct competitors: `1`
- specific direct-match competitors: `66`
- competitors with no support disease: `2`

This is the main result.

Interpretation:
- the propagation penalty is not the main bottleneck in these cases
- the leftover problem is mostly not “broad propagated umbrella diseases are cheating”
- most winning competitors are specific leaf diseases with direct phenotype profiles

## Case Reads

### `SCN2A` — `PMID_33731876_fam421`
- current Genovy benchmark status:
  - miss in top `100`
  - full-rank truth position: `108`
- patient packet:
  - `1` present term
  - `1` excluded term
- truth support:
  - support disease: `MONDO:0007295`
  - `self-limited epilepsy with centrotemporal spikes`
  - support kind: `umbrella`
  - exact direct overlap: `0`
- competitor pattern:
  - almost entirely direct leaf epilepsy diseases
  - only `1` broad propagated zero-direct competitor in the top `20`
- read:
  - this is not a propagation-penalty problem
  - it is a sparse one-term seizure packet, and the chosen truth support disease is itself generic / non-specific
  - `SCN2A` still looks like a support-selection-plus-sparse-signal case
- priority:
  - lower
  - Exomiser is also terrible here (`4248`)

### `SPTAN1` — `PMID_36331550_Family16Patient21`
- current Genovy benchmark status:
  - miss in top `100`
  - full-rank truth position: `322`
- patient packet:
  - `2` present terms
  - `19` excluded terms
- truth support:
  - support disease: `MONDO:0957815`
  - `developmental delay with or without epilepsy`
  - support kind: `leaf`
  - exact direct overlap: `2`
- competitor pattern:
  - top `20` is dominated by specific leaf diseases
  - many have `1-2` exact direct overlaps, not dramatically more than the truth
- read:
  - this remains the cleanest pure ranking problem
  - `SPTAN1` is not losing because of propagated umbrellas
  - it is losing because the current normalization/specificity balance favors many smaller competing leaf profiles over its broader truthful profile
- priority:
  - highest
  - Exomiser ranks it `1`

### `PPP2R1A` — `PMID_37761890_41`
- current Genovy benchmark status:
  - miss in top `100`
  - full-rank truth position: `256`
- patient packet:
  - `9` present terms
- truth support:
  - support disease: `MONDO:0014605`
  - `Houge-Janssens syndrome 2`
  - support kind: `leaf`
  - exact direct overlap: `3`
- competitor pattern:
  - all top `20` competitors are direct leaf matches
  - many have `4-8` exact direct overlaps
- read:
  - this no longer looks like a pure ranking problem
  - the truth profile is simply weaker on direct overlap than many competitors
  - this is more like a mixed support-selection / profile-quality problem
- priority:
  - medium
  - Exomiser is also poor here (`399`)

### `PPP2R1A` — `PMID_37761890_43`
- current Genovy benchmark status:
  - miss in top `100`
  - full-rank truth position: `109`
- patient packet:
  - `9` present terms
- truth support:
  - support disease: `MONDO:0014605`
  - `Houge-Janssens syndrome 2`
  - support kind: `leaf`
  - exact direct overlap: `5`
- competitor pattern:
  - all top `20` competitors are direct leaf matches
  - several have `6-9` exact direct overlaps
- read:
  - again, not a propagation problem
  - this is mixed: the truth disease is usable but not competitive enough against other highly matching direct leaf profiles
  - stronger truth-branch phenotype coverage or better semantic matching may be needed
- priority:
  - medium-high
  - Exomiser gets to `39`, so this is more salvageable than case `41`

### `SMARCC2` — `PMID_30580808_Lo_twin_2-Fam-52`
- current Genovy benchmark status:
  - miss in top `100`
  - full-rank truth position: `423`
- patient packet:
  - `1` present term
  - `6` excluded terms
- truth support:
  - support disease: `MONDO:0007617`
  - `Coffin-Siris syndrome 1`
  - support kind: `leaf`
  - exact direct overlap: `1`
- competitor pattern:
  - top of the ranking is dominated by autism / intellectual disability leaf diseases with the same minimal single-term signal
- read:
  - this is a one-term sparse-packet problem more than a scorer bug
  - there is not enough phenotype specificity here to separate `SMARCC2` strongly
- priority:
  - low
  - Exomiser is also poor (`927`)

## Decision
- Do not spend the next cycle tuning the propagation penalty.
- The ranked-output audit falsifies that as the main explanation for this leftover set.

Next fix targets should be:
1. `SPTAN1`
   - direct ranking/specificity analysis
   - inspect why a truthful `2`-overlap leaf disease loses so badly to many smaller leaf profiles
2. `PPP2R1A`
   - reclassify from “pure ranking” to “mixed ranking + truth-profile weakness”
   - inspect whether semantic similarity or better truth-side phenotype coverage would matter more
3. `SCN2A` and `SMARCC2`
   - deprioritize as algorithm targets for now
   - both are sparse packets with weak discriminative signal, and Exomiser is also poor

Own commentary / alternatives:
- This was the right next move after the STXBP1 negative result because it cleanly separated “real ranking bug” from “hard low-information case.”
- The biggest update is that `PPP2R1A` should probably not stay in the same conceptual bucket as `SPTAN1`.
- If there is one immediate scoring case worth opening next, it is `SPTAN1`, not `SCN2A` or `SMARCC2`.

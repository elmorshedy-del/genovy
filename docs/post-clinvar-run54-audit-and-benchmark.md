# Post-ClinVar Run 54 Audit And Benchmark

Date: `2026-03-23`

## Scope
- Full official `clinvar_variant_summary` coverage completed successfully via `sync_run_id = 54`.
- Post-sync structural spectrum rerun:
  - [post-clinvar-run54.summary.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/ops/post-clinvar-run54.summary.json)
  - [post-clinvar-run54.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/ops/post-clinvar-run54.md)
- Post-sync official 100-case benchmark rerun:
  - [official-benchmark-post-clinvar-run54.json](/Users/ahmedelmorshedy/Genovy/output/official-benchmark-post-clinvar-run54.json)
  - [official-benchmark-post-clinvar-run54.md](/Users/ahmedelmorshedy/Genovy/output/official-benchmark-post-clinvar-run54.md)

## Structural Audit
The baseline-aligned structural spectrum now comes out to:

| Bucket | Count | Share |
| --- | ---: | ---: |
| Hollow shell | `148` | `2.59%` |
| Sparse one-sided | `504` | `8.83%` |
| Poorly enriched two-sided | `1207` | `21.16%` |
| Better covered | `3846` | `67.41%` |

Compared with the earlier baseline bucket counts:
- hollow shells: `23 -> 148`
- sparse one-sided: `426 -> 504`
- poorly enriched two-sided: `777 -> 1207`
- better covered: `4479 -> 3846`

Important sanity check:
- logical gene denominator remains `5705`
- `5701` logical genes have at least one matched live non-placeholder gene entity
- only `4` logical genes have no matched live gene entity at all
- so the larger hollow bucket is not just a missing-entity artifact

Current two-sided Q1 cutoffs on the repaired graph:
- disease links `<= 1`
- phenotype links `<= 18`

ClinVar-derived support slice:
- genes with ClinVar-derived disease support: `4671`
- genes whose only disease support is ClinVar-derived: `2759`
- genes with ClinVar-derived disease support and phenotype support: `4594`

Interpretation:
- the full ClinVar bridge materially expanded official disease support across the graph
- but the graph remains structurally thinner than the older audit snapshot suggested
- this means the earlier `23 / 426 / 777 / 4479` picture should no longer be treated as the live state

## Benchmark
Against the current rerun:
- found: `83 / 100`
- top-1: `34`
- top-3: `43`
- top-5: `46`
- top-10: `57`
- median rank: `3`
- MRR: `0.410153`

Exomiser on the same benchmark:
- found: `100 / 100`
- top-10: `55`
- MRR: `0.447212`

Head-to-head:
- Genovy better: `32`
- Exomiser better: `23`
- tie: `28`
- Exomiser found while Genovy missed: `17`

## Comparison To Frozen `v0`
Frozen `v0` propagation-weight baseline:
- found: `82`
- top-1: `34`
- top-3: `43`
- top-5: `46`
- top-10: `58`
- MRR: `0.409669`

Post-ClinVar run `54`:
- found: `83`
- top-1: `34`
- top-3: `43`
- top-5: `46`
- top-10: `57`
- MRR: `0.410153`

So versus frozen `v0`:
- found `+1`
- top-10 `-1`
- MRR `+0.000484`

Net read:
- the ClinVar bridge produced a real recall gain
- but the improvement is narrow rather than transformative at benchmark level
- the score surface changed enough to recover one previously missed `v0` case, but not enough to move the whole miss tail

## Recovered And Worsened Cases Vs Frozen `v0`
Recovered from miss:
- `PMID_36747105_proband` (`U2AF2`): `miss -> rank 30`

Worsened:
- `PMID_24736735_G068`: `9 -> 11`
- `PMID_33731876_fam163`: `92 -> 93`

No case regressed from found to miss versus frozen `v0`.

## Remaining Miss Tail
Still missed after the ClinVar repair:
- `17` cases

Notable unchanged miss categories still present:
- `STXBP1` miss cluster remains
- `SPTAN1` remains missed
- one `U2AF2` case remains missed
- `SOCS1`, `SETD2`, and multiple `PPP2R1A` misses remain

Interpretation:
- the bridge fixed a real official-source gap
- but the remaining miss tail is still largely an enrichment / branch-quality / ranking problem
- this justifies moving from pipeline repair to leftover-case analysis rather than continuing to speculate about stale official ClinVar coverage

## Confidence And Boundaries
Inspected:
- live `sync_runs` completion for `54`
- live post-sync graph counts through the new structural audit script
- official benchmark rerun artifacts

Intentionally not inspected:
- raw ClinVar rows after final completion
- deep case-by-case leftover diagnosis in this pass
- any new unofficial enrichment sources

Confidence:
- high on the ClinVar completion result
- high on the benchmark outcome
- medium-high on the structural spectrum interpretation because it differs materially from the earlier doc snapshot and will need follow-up explanation, even though the query itself was sanity-checked

# GeneReviews Latest5 Tightened Validation 2026-03-30

## Scope
- reran the fixed `latest5` slice into a fresh output family:
  - `output/genereviews-pipeline-latest5-tightened-20260330`
- evidence surface used:
  - tightened stage outputs only
  - comparison against the prior settled MedGemma control slice
  - narrow source-truth spot checks on the previously known bad rows

## What was rerun
- `Stage 2` anchors under Railway enrichment env:
  - `v1-enrich-0328`
  - `Postgres-Enrichment-Symmetry`
- `Stage 3` Gemini Flash candidate discovery
- `Stage 4` BioLORD mapping
- `Stage 5` MedGemma metadata extraction
- `Stage 6` manifest/review build under Railway enrichment env

## Operational result
- `Stage 2`: clean
- `Stage 3`: clean
- `Stage 4`: clean after reusing the matching BioLORD cache from the settled run
- `Stage 5`: `5/5` processed, `0` errors
- `Stage 6`: `5/5` processed, `0` errors

## Stage 5 comparison vs prior settled MedGemma run
- `Y chromosome infertility`
  - features: `6 -> 6`
  - frequency covered: `0 -> 0`
  - onset covered: `0 -> 0`
  - treatment covered: `1 -> 0`
  - important change:
    - the bad `Oligozoospermia -> treatment_response` leak is gone

- `YIF1B`
  - features: `41 -> 41`
  - frequency covered: `2 -> 2`
  - onset covered: `1 -> 1`
  - no material drift found in the narrow diff

- `ZAP70`
  - features: `45 -> 45`
  - frequency covered: `4 -> 4`
  - onset covered: `12 -> 10`
  - treatment covered: `4 -> 5`
  - important improvement:
    - the bad `Cerebral infarct -> congenital onset` leak is gone
  - follow-up note:
    - some onset assignments were conservatively removed; these should be reviewed in the `100`-chapter review-first run rather than treated as regressions automatically

- `Zellweger`
  - features: `27 -> 27`
  - frequency covered: `2 -> 2`
  - onset covered: `12 -> 10`
  - important improvement:
    - `Pigmentary retinopathy` no longer inherits `neonatal`
    - it now carries `transient`, which is attached to the phenotype phrase itself

- `ZTTK`
  - features: `139 -> 139`
  - frequency covered: `32 -> 33`
  - onset covered: `9 -> 8`
  - important improvement:
    - `Cerebral visual impairment` no longer inherits `childhood onset`
  - residual issue:
    - `Visual impairment` still inherits `childhood`
    - this is the last clear shared-sentence onset over-attachment still visible in the tightened slice

## Stage 6 comparison vs prior settled MedGemma run
- both runs remain fully review-first:
  - manifest rows: `0 -> 0`
  - review rows: `5 -> 5`
- cleaned feature counts:
  - `Y chromosome infertility`: `5 -> 4`
  - `YIF1B`: `32 -> 32`
  - `ZAP70`: `27 -> 27`
  - `Zellweger`: `20 -> 20`
  - `ZTTK`: `95 -> 95`

## Main conclusion
- the tightened pass is materially better than the settled pass
- the known bad cases that motivated the fixes were corrected in the right direction:
  - `Oligozoospermia -> treatment_response` removed
  - `Cerebral infarct -> congenital onset` removed
  - `Pigmentary retinopathy -> neonatal` removed
  - `Cerebral visual impairment -> childhood onset` removed
- one residual onset leak remains:
  - `ZTTK Visual impairment -> childhood`

## Decision read
- safe for:
  - `100`-chapter `review-first` run
- not yet safe for:
  - broad `autoaccept`
  - authoritative publish without review

## Why the `100` run is still justified
- the review gate remained conservative:
  - no manifest promotion happened
  - all chapters stayed in review
- the tightened logic reduced known bad metadata without causing manifest-level drift
- the remaining issue is narrow enough to monitor during the `100` review-first pilot

## Next move
- launch the `100`-chapter review-first run on the tightened architecture
- track these exact failure classes during review:
  - shared-sentence onset over-attachment
  - parent/alias phenotype overreach in ophthalmology / vision rows
  - any new excluded/present merge conflict

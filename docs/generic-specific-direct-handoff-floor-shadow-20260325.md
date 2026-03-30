# Generic Specific Direct Handoff Floor Shadow

## Goal
- Test the broader scorer-side question before spending more time on STXBP1-specific enrichment:
  - make no disease-profile enrichment changes
  - keep the live graph exactly as-is
  - apply one generic shadow rule across the full 100-case benchmark
  - measure whether a stronger disease-to-gene handoff for already-specific direct disease matches has global value

## Script and artifacts
- Script:
  - [shadowGenericSpecificDirectHandoffFloor.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowGenericSpecificDirectHandoffFloor.js)
- Output artifacts:
  - [shadow-generic-specific-direct-handoff-floor-20260325.json](/Users/ahmedelmorshedy/Genovy/output/shadow-generic-specific-direct-handoff-floor-20260325.json)
  - [shadow-generic-specific-direct-handoff-floor-20260325.md](/Users/ahmedelmorshedy/Genovy/output/shadow-generic-specific-direct-handoff-floor-20260325.md)
- Baseline benchmark reference:
  - [official-benchmark-post-clinvar-run54.json](/Users/ahmedelmorshedy/Genovy/output/official-benchmark-post-clinvar-run54.json)

## Policy tested
- No STXBP1-specific terms
- No disease-branch enrichment
- No new source data
- One generic override only:
  - if a support disease already has:
    - direct phenotype edges
    - and at least one exact direct patient overlap
  - then raise its disease-to-gene handoff floor to `0.9` when the existing support weight is lower

## Full 100-case shadow result

### Baseline
- `Found = 82%`
- `Top-1 = 34%`
- `Top-3 = 43%`
- `Top-5 = 46%`
- `Top-10 = 57%`
- `Median rank = 3`
- `MRR = 0.409646`

### Shadow
- `Found = 83%`
- `Top-1 = 36%`
- `Top-3 = 47%`
- `Top-5 = 51%`
- `Top-10 = 60%`
- `Median rank = 2`
- `MRR = 0.437917`

### Delta
- `Improved = 9`
- `Worsened = 2`
- `Recovered from miss = 1`
- `Regressed to miss = 0`

## Most important case movements

### Strong improvements
- `PMID_35190816_STX_27159321_LD_0358` (`STXBP1`)
  - `miss -> 96`
- `PMID_24369382_Family1II4` (`WWOX`)
  - `33 -> 2`
- `PMID_33731876_fam163` (`SCN2A`)
  - `92 -> 52`
- `PMID_21683322_25` (`FBN1`)
  - `10 -> 1`
- `PMID_18551513_3` (`LMNA`)
  - `17 -> 4`
- `PMID_35484142_F6P7` (`HNRNPA2B1`)
  - `4 -> 1`

### Mild regressions
- `PMID_31021519_individualfromTrakadisetal` (`SATB2`)
  - `65 -> 67`
- `PMID_37761890_22` (`PPP2R1A`)
  - `79 -> 80`

## Interpretation
- This is the first broad March 25 scorer-side shadow that produced a clearly positive full-benchmark movement without any enrichment.
- That matters because it means the handoff leak is not just an STXBP1 curiosity.
- The rule helps genes that already have a real specific direct disease match in the graph, but were being damped too aggressively before their signal reached gene level.
- The recovered `STXBP1` case is especially important:
  - the generic rule alone, without any extra DEE4 terms, is enough to pull one STXBP1 miss into the benchmark-visible range.

## Practical conclusion
- The generic handoff-floor idea is now stronger than the STXBP1-only `4-term + 0.9 floor` result.
- It should be treated as a serious candidate for the next scorer-side experiment.
- It is not a ship decision yet because:
  - it is still a shadow benchmark
  - the override is broad and needs guardrail review
  - the two regressions still need inspection
- But it has now earned priority over more narrow STXBP1-specific enrichment work.

## Best next tests
- Test the same generic rule at `1.0` instead of `0.9`
- Audit the `2` worsened cases to see whether they reveal a real guardrail requirement
- Compare improved cases to see what common profile shape benefits most from the rule

## Evidence boundaries
- Inspected:
  - full 100-case shadow benchmark
  - official post-ClinVar baseline benchmark
  - live scorer behavior under the generic handoff-floor override
- Intentionally not inspected:
  - no disease-profile enrichment
  - no source refresh
  - no raw DB dump crawl
  - no production scorer patch
- Confidence:
  - high for the benchmark shadow numbers
  - medium-high for the policy interpretation, pending the `1.0` ablation and regression review

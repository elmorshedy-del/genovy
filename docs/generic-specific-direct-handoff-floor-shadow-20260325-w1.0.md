# Generic Specific Direct Handoff Floor Shadow (`1.0`)

## Goal
- Follow the positive `0.9` full-benchmark shadow with the stronger version of the same rule:
  - no enrichment
  - no source changes
  - no graph edits
  - only raise the disease-to-gene handoff floor for already-specific direct disease matches
- Determine whether `1.0` is materially better than `0.9`, and whether that extra lift comes with unacceptable regressions.

## Script and artifacts
- Script:
  - [shadowGenericSpecificDirectHandoffFloor.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowGenericSpecificDirectHandoffFloor.js)
- Output artifacts:
  - [shadow-generic-specific-direct-handoff-floor-20260325-w1.0.json](/Users/ahmedelmorshedy/Genovy/output/shadow-generic-specific-direct-handoff-floor-20260325-w1.0.json)
  - [shadow-generic-specific-direct-handoff-floor-20260325-w1.0.md](/Users/ahmedelmorshedy/Genovy/output/shadow-generic-specific-direct-handoff-floor-20260325-w1.0.md)
- Comparison benchmark artifacts:
  - [shadow-generic-specific-direct-handoff-floor-20260325.json](/Users/ahmedelmorshedy/Genovy/output/shadow-generic-specific-direct-handoff-floor-20260325.json)
  - [official-benchmark-post-clinvar-run54.json](/Users/ahmedelmorshedy/Genovy/output/official-benchmark-post-clinvar-run54.json)

## Policy tested
- If a support disease already has:
  - direct phenotype edges
  - and at least one exact direct patient overlap
- then raise its disease-to-gene handoff floor to `1.0`

## Baseline vs `1.0` shadow

### Baseline
- `Found = 82%`
- `Top-1 = 34%`
- `Top-3 = 43%`
- `Top-5 = 46%`
- `Top-10 = 57%`
- `Median rank = 3`
- `MRR = 0.409646`

### `1.0` shadow
- `Found = 84%`
- `Top-1 = 42%`
- `Top-3 = 52%`
- `Top-5 = 53%`
- `Top-10 = 60%`
- `Median rank = 1.5`
- `MRR = 0.485974`

### Delta vs baseline
- `Improved = 21`
- `Worsened = 14`
- `Recovered from miss = 2`
- `Regressed to miss = 0`

## Comparison vs the `0.9` shadow

### `0.9`
- `Found = 83%`
- `Top-1 = 36%`
- `Top-3 = 47%`
- `Top-5 = 51%`
- `Top-10 = 60%`
- `Median rank = 2`
- `MRR = 0.437917`
- `Improved = 9`
- `Worsened = 2`

### `1.0`
- `Found = 84%`
- `Top-1 = 42%`
- `Top-3 = 52%`
- `Top-5 = 53%`
- `Top-10 = 60%`
- `Median rank = 1.5`
- `MRR = 0.485974`
- `Improved = 21`
- `Worsened = 14`

### What changed
- `1.0` is clearly stronger on raw benchmark lift than `0.9`
- But it is also much less restrained:
  - larger win surface
  - much larger regression surface

## Most important wins
- `PMID_35190816_STX_27159321_LD_0358` (`STXBP1`)
  - `miss -> 25`
- `PMID_33731876_fam421` (`SCN2A`)
  - `miss -> 43`
- `PMID_33731876_fam163` (`SCN2A`)
  - `92 -> 20`
- `PMID_31021519_individualfromTrakadisetal` (`SATB2`)
  - `65 -> 24`
- `PMID_24369382_Family1II4` (`WWOX`)
  - `33 -> 1`
- `PMID_18551513_3` (`LMNA`)
  - `17 -> 1`

## Most important regressions
- `PMID_37761890_22` (`PPP2R1A`)
  - `79 -> 90`
- `PMID_32154675_Family4Patient11`
  - `33 -> 39`
- `PMID_29122497_29122497_P1`
  - `75 -> 79`
- `PMID_35190816_STX_25818041_Patient_20` (`STXBP1`)
  - `66 -> 70`
- `PMID_35190816_STX_23934111_fh` (`STXBP1`)
  - `28 -> 31`

## Interpretation
- `1.0` beats `0.9` decisively on headline benchmark strength.
- It recovers one additional miss and sharply improves several difficult truth genes, including both `STXBP1` and `SCN2A`.
- But it also expands the downside surface too much to treat it as a safe blind upgrade.
- So the broad scorer read is now:
  - the generic handoff-floor idea is real
  - `1.0` may be too aggressive as an unconditional global rule
  - the next question is no longer “does this family of rules matter?”
  - it is “what guardrail keeps most of the `1.0` upside without accepting all of its regressions?”

## Practical conclusion
- Do not ship `1.0` blindly.
- It is the strongest scorer-side shadow so far, but it has crossed into clearly mixed territory.
- The next clean step is regression diagnosis, not more raw escalation.

## Best next tests
- Inspect the worsened `PPP2R1A` and the next-largest regression for a guardrail pattern
- Compare the improved cases against the worsened cases to see whether the benefit clusters on:
  - direct leaf diseases with compact profiles
  - versus broad or mixed-profile branches that become over-amplified
- Consider a conditional rule stronger than `0.9` but narrower than unconditional `1.0`

## Evidence boundaries
- Inspected:
  - full 100-case `1.0` shadow benchmark
  - direct comparison against the earlier `0.9` shadow
  - case-level improvement and regression lists
- Intentionally not inspected:
  - no disease-profile enrichment
  - no source changes
  - no raw DB dump crawl
  - no production scorer patch
- Confidence:
  - high for the benchmark numbers
  - medium-high for the interpretation, pending regression guardrail review

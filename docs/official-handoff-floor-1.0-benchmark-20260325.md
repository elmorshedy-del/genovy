# Official Handoff Floor `1.0` Benchmark

## Goal
- Replace the generic `1.0` handoff-floor shadow with a real scorer patch on the working branch.
- Re-run the official 100-case phenotype-only benchmark end to end.
- Measure the true post-patch result against:
  - the current working baseline:
    - [official-benchmark-post-clinvar-run54.json](/Users/ahmedelmorshedy/Genovy/output/official-benchmark-post-clinvar-run54.json)
  - Exomiser on the same benchmark

## Code change
- Added a named scorer rule in:
  - [dx.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/constants/dx.js)
  - [similarityEngine.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/services/dx/similarityEngine.js)
- Rule:
  - if a support disease already has:
    - direct phenotype edges
    - and at least one exact direct patient overlap
  - then raise its disease-to-gene handoff floor to `1.0`
- Added focused unit coverage in:
  - [dxSimilarity.test.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/dxSimilarity.test.js)

## Test status
- Passed:
  - `node --test test/dxSimilarity.test.js`

## Official benchmark artifacts
- JSON:
  - [handoff-floor-1.0.json](/Users/ahmedelmorshedy/Genovy/output/handoff-floor-1.0.json)
- Markdown:
  - [handoff-floor-1.0.md](/Users/ahmedelmorshedy/Genovy/output/handoff-floor-1.0.md)

## Baseline vs patched scorer

### Baseline (`post-clinvar-run54`)
- `Found = 83%`
- `Top-1 = 34%`
- `Top-3 = 43%`
- `Top-5 = 46%`
- `Top-10 = 57%`
- `MRR = 0.410153`

### Patched scorer (`handoff-floor-1.0`)
- `Found = 84%`
- `Top-1 = 42%`
- `Top-3 = 52%`
- `Top-5 = 53%`
- `Top-10 = 60%`
- `Median rank = 1.5`
- `MRR = 0.485974`

### Delta vs baseline
- `Improved = 21`
- `Worsened = 15`
- `Recovered from miss = 2`
- `Regressed to miss = 1`

## Exomiser comparison
- Exomiser:
  - `Found = 100%`
  - `Top-1 = 39%`
  - `Top-3 = 46%`
  - `Top-5 = 48%`
  - `Top-10 = 55%`
  - `MRR = 0.447212`

So the patched Genovy scorer is now ahead of Exomiser on:
- `Top-1`
- `Top-3`
- `Top-5`
- `Top-10`
- `MRR`

But still behind on:
- total recall / found rate

## Important nuance vs the earlier shadow
- The official scorer patch did **not** match the earlier `1.0` shadow perfectly.
- The biggest difference is:
  - `PMID_36747105_proband` (`U2AF2`)
  - baseline `30`
  - patched scorer `miss`
- So the official scorer result is still very strong, but slightly less clean than the pure shadow estimate.

## Important wins
- `STXBP1` `PMID_35190816_STX_27159321_LD_0358`
  - `miss -> 25`
- `SCN2A` `PMID_33731876_fam421`
  - `miss -> 43`
- `SCN2A` `PMID_33731876_fam163`
  - `93 -> 20`
- `WWOX` `PMID_24369382_Family1II4`
  - `17 -> 1`
- `LMNA` `PMID_18551513_3`
  - `17 -> 1`

## Important regressions
- `U2AF2` `PMID_36747105_proband`
  - `30 -> miss`
- `PPP2R1A` `PMID_37761890_22`
  - `79 -> 90`
- `SCN2A` `PMID_33731876_fam341`
  - `5 -> 7`
- `ANKRD11` `PMID_36446582_Gnazzo2020_P1`
  - `10 -> 11`

## Interpretation
- This is the strongest real rule-based scorer result in the project so far.
- It confirms that disease-to-gene handoff geometry was a major bottleneck.
- It also confirms the broad story from the shadow work:
  - the rule is real
  - the upside is large
  - but it is not perfectly clean and still needs guardrails or follow-up triage
- The most important new caution is that `U2AF2` regressed in the real scorer run, which means source-model / attachment-fragile genes can still be harmed by a broad scorer change even when the global benchmark improves.

## Practical conclusion
- Keep this as the new strongest scorer candidate, not yet as unquestioned final.
- The immediate next work is:
  1. inspect the real regressed-to-miss `U2AF2` case
  2. inspect `PPP2R1A`
  3. then decide whether to keep `1.0` as-is, add a guardrail, or hybridize it with the earlier `0.9` restraint

## Evidence boundaries
- Inspected:
  - real scorer patch
  - focused unit tests
  - official 100-case benchmark rerun
- Intentionally not inspected:
  - no new source ingestion
  - no new enrichment
  - no OMIM/manual source intervention for this step
- Confidence:
  - high for the benchmark result
  - medium-high for the next-step interpretation until `U2AF2` and `PPP2R1A` are inspected under the new scorer

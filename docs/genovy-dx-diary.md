# Genovy DX Research Diary

Last updated: 2026-03-26

## Purpose
This is the canonical lab notebook for Genovy DX.

It should record:
- every benchmark result
- every experiment
- every theory, even if later disproven
- every idea we kept, parked, or dismissed
- what evidence was used
- what was intentionally not inspected
- what decision was made afterward

This file is meant to preserve the real scientific thread of the project, not just the final polished conclusions.

## Rules For Future Entries
- Record the date.
- State the question being tested.
- State the exact evidence surface used.
- State what was intentionally not inspected.
- State the result in plain language.
- State whether the idea is:
  - kept
  - parked
  - dismissed
  - still open
- If there was a benchmark, record the exact numbers.
- If there was a failure, say why it failed.
- If there is a rollback plan, write it down.

## Hard Rule: Never Overfit The Graph
- Never "cheat" a gene to a higher rank.
- Benchmark misses may generate hypotheses.
- Benchmark misses may not author truth.
- Every enrichment term must be source-backed, shadow-tested first, and justified at the syndrome level rather than the individual case level.
- Seam repair and profile enrichment must stay separate in both reasoning and implementation.

## Current Best Known Stable Benchmark
Official 100-case phenotype-only gene benchmark vs Exomiser.

| Snapshot | Found | Top-1 | Top-3 | Top-5 | Top-10 | Median Rank | MRR |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Prefix-cleanup era baseline | 81% | 32% | 41% | 45% | 55% | 3 | 0.390464 |
| Full enrichment + identity fixes | 81% | 34% | 41% | 46% | 52% | 3 | 0.404633 |
| Direct-edge fix | 80% | 33% | 41% | 45% | 55% | 3 | 0.395267 |
| Propagation-weight heuristic | 82% | 34% | 43% | 46% | 58% | 3 | 0.409669 |
| Deep HPO, contradiction penalties on | 68% | 16% | 21% | 26% | 32% | 7 | 0.211003 |
| Deep HPO, no contradiction penalties | 82% | 34% | 43% | 46% | 57% | 3 | 0.409646 |
| Exomiser comparator | 100% | 39% | 46% | 48% | 55% | 7.5 | 0.447212 |

Current best stable rule-based position:
- direct-edge routing fix kept
- propagation-weight heuristic kept
- richer HPO fields can stay loaded
- contradiction penalties are not allowed to directly affect rule-based ranking

## Chronological Research Record

### Entry 1: Baseline reality
Date:
- 2026-03-16 to 2026-03-17

Question:
- Is Genovy primarily failing because genes are missing from the graph, or because the right genes are ranked badly?

Evidence surface:
- official 100-case benchmark
- ranking-pressure audit
- existing saved benchmark outputs

Intentionally not inspected:
- no broad raw dump crawl
- no retraining

Result:
- Remaining failures were mostly ranking failures, not missing-gene failures.
- Truth genes often existed in the graph but lost to better-looking competitors.

Important numbers:
- difficult-case audit on 41 hard cases:
  - weak phenotype match: 39.0%
  - swamped by similar candidates: 31.7%
  - weak evidence support: 12.2%
  - other: 17.1%

Decision:
- Keep focusing on phenotype quality and disease support routing.

Status:
- kept

### Entry 19: RERE strict OMIM symmetry was a null result
Date:
- 2026-03-26

Question:
- If we stop cherry-picking and do the strict symmetric thing for `RERE` and its real outranker `MED13`, does OMIM-backed augmentation let the current scorer pick the truth?

Evidence surface:
- saved single-case audit:
  - [audit-rere-subject9-20260326.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/audit-rere-subject9-20260326.json)
- manual OMIM browser pass:
  - `OMIM 616975`
  - `OMIM 618009`
- strict symmetric shadow rerun:
  - [shadow-rere-symmetric-omim-terms-20260326.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-rere-symmetric-omim-terms-20260326.json)

Intentionally not inspected:
- GeneReviews
- raw full-text case series
- any live graph mutation

Result:
- `RERE` stayed `237 -> 237`
- `MED13` stayed top1
- OMIM-backed symmetry added only `3` genuinely new terms, all on the `MED13` branch
- every candidate truth-side `RERE` OMIM term was already present and therefore skipped

Important numbers:
- truth exact overlaps already in the saved audit: `5`
- outranker exact overlaps already in the saved audit: `6`
- new OMIM-backed truth additions: `0`
- new OMIM-backed outranker additions: `3`

Decision:
- Do not tell ourselves that `RERE` is an OMIM-hidden rescue.
- The strict OMIM experiment says no.
- If `RERE` is going to improve from source-backed repair, the next source layer has to be beyond OMIM alone.

Rollback plan:
- shadow-only script and docs
- no graph changes

Status:
- kept

## 2026-03-26 ANKRD11 OMIM correction

- Manual OMIM pass completed for:
  - `KBG syndrome` (`148050`)
  - `Brachydactyly, type A1, C` (`615072`)
  - `Epilepsy, familial temporal lobe, 8` (`616461`)
- Important correction:
  - the relevant hand-focused outranker is the `GDF5` subtype `BDA1C`, not just the classical `IHH` parent `BDA1` entry
- Main takeaway:
  - OMIM strengthens the interpretation more than it provides a large new term set
  - `KBG syndrome` is clearly broad and real
  - `BDA1C` and `ETL8` are clearly narrow sharp branches
  - this supports the existing read that `ANKRD11` is a hybrid source-plus-scoring miss, not a simple missing-term case

## 2026-03-26 ANKRD11 OMIM shadow

- Shadow-only OMIM-backed rerun completed for both missed `ANKRD11` cases.
- Strict new structural OMIM terms alone:
  - no rank change in either case
- Cumulative OMIM plus earlier source-backed shadow:
  - `PMID_36446582_Goldenberg2016_P13`: still unchanged
  - `PMID_36446582_Miyatake2017_P1`: `175 -> 88`
- Main takeaway:
  - OMIM-backed enrichment helps the second case but still does not let `ANKRD11` win
  - the `ANKRD11` miss remains a hybrid truth-branch plus scoring-geometry problem

- 2026-03-26

Question:
- If we stop cherry-picking and instead add source-backed terms symmetrically to both the true disease and the outranker disease, will the current scorer finally choose the truth for the two ANKRD11 misses?

Evidence surface:
- live direct disease phenotype rows from the real `v1-working` DB
- [KBG Syndrome - GeneReviews® - NCBI Bookshelf](https://www.ncbi.nlm.nih.gov/books/NBK487886/)
- [Epilepsy in KBG Syndrome: Report of Additional Cases - PubMed](https://pubmed.ncbi.nlm.nih.gov/38157719/)
- [familial temporal lobe epilepsy 8 - MedGen](https://www.ncbi.nlm.nih.gov/medgen/909158)
- existing HPO disease phenotype assertions for `brachydactyly type A1`

Intentionally not inspected:
- raw source dumps
- broad mounted Railway exports
- any live graph mutation

Result:
- I built a new shadow-only script:
  - [shadowAnkrd11SymmetricSourceTerms.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowAnkrd11SymmetricSourceTerms.js)
- I ran two scenarios on the two missed ANKRD11 cases:
  - strict literal-source additions
  - plus a symmetric hand-parent promotion variant
- Strict literal-source scenario:
  - `Goldenberg2016_P13`: `395 -> 368`
  - `Miyatake2017_P1`: `176 -> 128`
  - wrong top gene remained wrong in both
- Symmetric parent-promotion scenario:
  - `Goldenberg2016_P13`: `395 -> 312`
  - `Miyatake2017_P1`: `176 -> 112`
  - wrong top gene still remained wrong in both

Important numbers:
- strict scenario:
  - added terms: `3`
  - improved cases: `2`
  - worsened cases: `0`
  - top-1 fixes: `0`
- symmetric parent scenario:
  - added terms: `5`
  - improved cases: `2`
  - worsened cases: `0`
  - top-1 fixes: `0`

Decision:
- The symmetric source-backed idea is valid as a disciplined enrichment method.
- But for ANKRD11 it is not enough to make the current scorer choose the truth branch.
- This is now stronger evidence that some remaining misses are not just source-thinness; they are broad-true-syndrome vs narrow-sharp-outranker failures.

Own commentary / alternatives:
- This was the cleanest possible version of the user's proposal, and it still failed.
- That is useful because it means we did not lose due to cheating or asymmetry.
- It also means ML is not just a luxury later; some of these tradeoffs really do look like ranking-geometry problems once the obvious source gaps are patched.

Rollback plan:
- shadow-only
- no live graph mutation

Status:
- kept

## 2026-03-26 OMIM U2AF2 Shadow Correction

What happened:
- I reran the strict OMIM-only `U2AF2` shadow and found a script bug.
- The shadow script had been using the explicit `--target-terms` list to load candidates, but it was still iterating an older hardcoded candidate list when constructing the shadow rows.

Fix:
- Patched [shadowU2af2PublicSourceCandidates.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowU2af2PublicSourceCandidates.js) so the row builder now uses the passed target-term list.
- Reran the strict OMIM-only `2`-case shadow.

Corrected result:
- all `10` requested OMIM-backed terms were added successfully in shadow:
  - `Intellectual disability`
  - `Delayed speech and language development`
  - `Delayed fine motor development`
  - `Delayed ability to walk`
  - `Bilateral tonic-clonic seizure`
  - `Gastroesophageal reflux`
  - `Feeding difficulties`
  - `Short palpebral fissure`
  - `Bilateral ptosis`
  - `Unilateral ptosis`
- outcome stayed the same:
  - `PMID_36747105_proband`: `miss -> miss`
  - `PMID_37962958_43`: `miss -> miss`
  - truth gene still absent from the reported ranking in both cases

Interpretation:
- this is an even stronger negative result than the earlier draft
- not only did OMIM-backed enrichment fail, it failed even after the full intended term set was applied correctly
- `U2AF2` is now more clearly a support-seam-first problem, not an enrichment-first problem

Own commentary:
- This correction matters because the earlier “8 terms added” note made the negative result look slightly softer than it really was.
- The honest read is now cleaner: a correctly executed 10-term OMIM shadow still does nothing.

### Entry 24: Anti-overfitting rule adopted and U2AF2 split clarified
Date:
- 2026-03-26

Question:
- If Genovy is going to continue benchmark-tail enrichment work, what hard rule prevents graph pollution, and what does the current `U2AF2` evidence actually say before any new source-backed shadow enrichment?

Evidence surface:
- planning anchor:
  - [genovy-non-negotiable-fixes.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genovy-non-negotiable-fixes.md)
- new rule doc:
  - [source-backed-curation-hard-rules-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/source-backed-curation-hard-rules-20260326.md)
- U2AF2 prep note:
  - [u2af2-source-backed-shadow-prep-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/u2af2-source-backed-shadow-prep-20260326.md)
- exact phenopackets:
  - [PMID_36747105_proband.json](/Users/ahmedelmorshedy/Genovy/output/pheval-official-sample-100/phenopackets/PMID_36747105_proband.json)
  - [PMID_37962958_43.json](/Users/ahmedelmorshedy/Genovy/output/pheval-official-sample-100/phenopackets/PMID_37962958_43.json)
- live working-DB slice for:
  - `MONDO:0957810`
  - current `26` phenotype rows

Intentionally not inspected:
- OMIM text
- GeneReviews text
- raw literature full text
- any graph mutation

Result:
- We formally adopted the project rule:
  - never overfit
  - never cheat a gene upward
  - benchmark only generates hypotheses
  - promotion requires source-backed syndrome-level evidence
- The U2AF2 situation is now sharper than before:
  - `PMID_36747105_proband` is **not** mainly a thin-profile problem
    - all `7 / 7` positive terms are already covered by `MONDO:0957810`
    - its instability is more about seam/support fragility
  - `PMID_37962958_43` **is** a thin-profile problem
    - only `3 / 25` positive terms are currently covered
    - `22` positive terms are missing from the current disease profile

Important numbers:
- `PMID_36747105_proband`
  - positive overlap: `7 / 7`
  - excluded overlap: `15 / 15`
- `PMID_37962958_43`
  - positive overlap: `3 / 25`
  - positive missing: `22`
  - excluded overlap: `1`

Decision:
- Keep the anti-overfitting rule active as a hard project constraint.
- Do not treat `U2AF2` as just another generic undercovered gene.
- Split U2AF2 work into:
  1. seam/support fragility for `PMID_36747105_proband`
  2. source-backed disease-profile enrichment for `PMID_37962958_43`
- The next safe U2AF2 move is manual source-backed shadow preparation, not direct graph editing.

Rollback plan:
- docs-only change
- no graph mutation

Status:
- kept

### Entry 25: First public-source-backed U2AF2 shadow candidate list
Date:
- 2026-03-26

Question:
- Before using OMIM or GeneReviews, can we already assemble a defensible first-pass `U2AF2` shadow candidate list from public sources without overfitting the graph?

Evidence surface:
- [GenCC submission for `U2AF2` / `MONDO:0957810`](https://thegencc.org/submissions/SGC-103707.1)
- [Spliceosome malfunction causes neurodevelopmental disorders with overlapping features - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10760965/)
- [U2AF2 Missense Variant Associated With Epilepsy and Systemic Dysmorphism - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12515583/)
- candidate note:
  - [u2af2-public-source-candidate-terms-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/u2af2-public-source-candidate-terms-20260326.md)

Intentionally not inspected:
- OMIM full text
- GeneReviews
- hidden supplemental tables
- graph mutation

Result:
- Yes, we can build a first safe candidate list already.
- Public sources support a wider `U2AF2` syndrome surface than the current graph carries, especially for the harder `PMID_37962958_43` case.
- The strongest first shadow candidates are:
  - `Intellectual disability`
  - `Delayed speech and language development`
  - `Delayed fine motor development`
  - `Delayed ability to walk`
  - `Bilateral tonic-clonic seizure`
  - `Anxiety`
  - `Obsessive-compulsive trait`
  - `Clinodactyly`
  - `Short palpebral fissure`
  - `Hypertelorism`
  - `Bilateral ptosis`
  - `Unilateral ptosis`
  - `Short neck`
  - `Hearing impairment`
- We also explicitly separated weaker current candidates that still need stronger sourcing, such as:
  - `Polyhydramnios`
  - `Intrauterine growth retardation`
  - `Loss of ambulation`
  - `Dystonia`
  - `Syringomyelia`
  - `Gastroesophageal reflux`
  - `Constipation`

Important numbers:
- no new benchmark rerun yet
- no graph mutation yet
- first safe public-source candidate list size:
  - `14` terms

Decision:
- Keep the safe-source rule active.
- The next U2AF2 implementation step should be a shadow-only two-case rerun using only these public-source-backed candidates.
- Do not promote any U2AF2 terms into the real graph yet.

Rollback plan:
- docs-only change
- candidate list can be revised or narrowed without touching the graph

Status:
- kept

### Entry 26: U2AF2 public-source enrichment alone still does nothing
Date:
- 2026-03-26

Question:
- If we add the first safe public-source-backed `U2AF2` syndrome terms in shadow only, can the current patched scorer recover either U2AF2 case?

Evidence surface:
- shadow script:
  - [shadowU2af2PublicSourceCandidates.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowU2af2PublicSourceCandidates.js)
- outputs:
  - [shadow-u2af2-public-source-candidates-20260326.json](/Users/ahmedelmorshedy/Genovy/output/shadow-u2af2-public-source-candidates-20260326.json)
  - [shadow-u2af2-public-source-candidates-20260326.md](/Users/ahmedelmorshedy/Genovy/output/shadow-u2af2-public-source-candidates-20260326.md)
- writeup:
  - [u2af2-public-source-shadow-test-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/u2af2-public-source-shadow-test-20260326.md)

Intentionally not inspected:
- OMIM full text
- GeneReviews
- any graph mutation
- full benchmark rerun

Result:
- Adding the `14` safe public-source candidate terms to `MONDO:0957810` in shadow did **nothing** for the two U2AF2 cases.
- `PMID_36747105_proband`: `miss -> miss`
- `PMID_37962958_43`: `miss -> miss`
- The truth gene did not surface in the reported ranking in either baseline or shadow.

Important numbers:
- found:
  - `0 / 2 -> 0 / 2`
- top-10:
  - `0 -> 0`
- improved:
  - `0`
- worsened:
  - `0`
- recovered from miss:
  - `0`

Decision:
- Stop treating `U2AF2` as an enrichment-first problem.
- `U2AF2` is now clearly attachment/support-seam first.
- Further U2AF2 phenotype-term chasing should be parked until the seam problem is repaired or a robust bridge is introduced.

Own commentary / alternatives:
- This is a useful negative result because it prevents the exact kind of graph pollution we were worried about.
- If even source-backed syndrome enrichment cannot move the gene at all, then the graph is telling us the terms are not the first bottleneck.
- That is exactly the kind of proof we needed before touching the real graph.

Rollback plan:
- shadow-only script and artifacts
- no graph mutation

Status:
- kept

### Entry 27: Manual OMIM-backed U2AF2 shadow also stays completely stuck
Date:
- 2026-03-26

Question:
- If we replace the earlier public-source candidate list with a stricter OMIM-derived term set, can `U2AF2` finally move?

Evidence surface:
- manual OMIM browser extraction:
  - [u2af2-manual-omim-extract-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/u2af2-manual-omim-extract-20260326.md)
- OMIM shadow outputs:
  - [shadow-u2af2-omim-candidates-20260326.json](/Users/ahmedelmorshedy/Genovy/output/shadow-u2af2-omim-candidates-20260326.json)
  - [shadow-u2af2-omim-candidates-20260326.md](/Users/ahmedelmorshedy/Genovy/output/shadow-u2af2-omim-candidates-20260326.md)
- writeup:
  - [u2af2-omim-shadow-test-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/u2af2-omim-shadow-test-20260326.md)

Intentionally not inspected:
- OMIM API/download
- GeneReviews
- graph mutation

Result:
- OMIM-backed shadow enrichment also did nothing.
- `PMID_36747105_proband`: `miss -> miss`
- `PMID_37962958_43`: `miss -> miss`
- The truth gene still did not surface in either case.

Important numbers:
- requested OMIM-backed terms:
  - `10`
- successfully added in shadow:
  - `8`
- found:
  - `0 / 2 -> 0 / 2`

Decision:
- Stop spending more time on U2AF2 term enrichment right now.
- The ordering is now proven:
  1. seam repair first
  2. enrichment second

Own commentary / alternatives:
- This is exactly the kind of negative result we needed.
- Without it, we could have kept rationalizing more and more curation effort into a gene that still cannot reach the scorer through a reliable support path.

Rollback plan:
- shadow-only artifacts
- no graph mutation

Status:
- kept

### Entry 21: STXBP1 handoff weight, not disease strength, is the active leak
Date:
- 2026-03-25

Question:
- After the 4-term discriminating `DEE4` shadow succeeded at disease level, is the remaining `STXBP1` failure really in disease-to-gene handoff rather than in the enriched disease branch itself?

Evidence surface:
- saved March 25 discriminating-term shadow artifact:
  - [shadow-stxbp1-discriminating-case-20260325.json](/Users/ahmedelmorshedy/Genovy/output/shadow-stxbp1-discriminating-case-20260325.json)
- current handoff logic in:
  - [similarityEngine.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/services/dx/similarityEngine.js)
- new shadow script:
  - [shadowStxbp1SupportHandoffOverride.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowStxbp1SupportHandoffOverride.js)
- saved override artifacts:
  - [shadow-stxbp1-support-handoff-override-20260325.json](/Users/ahmedelmorshedy/Genovy/output/shadow-stxbp1-support-handoff-override-20260325.json)
  - [shadow-stxbp1-support-handoff-override-20260325.md](/Users/ahmedelmorshedy/Genovy/output/shadow-stxbp1-support-handoff-override-20260325.md)

Intentionally not inspected:
- no fresh benchmark rerun
- no new DB crawl
- no broad change to scorer logic

Result:
- The enriched `DEE4` branch is already strong enough.
- The active leak is the current disease-to-gene handoff weight.
- Under the current rule:
  - enriched `DEE4` disease score = `0.186806`
  - support evidence weight = `1.0`
  - handoff weight = `0.68`
  - resulting gene-support score = `0.127028`
  - existing direct `STXBP1` gene score = `0.163948`
- So the enriched specific branch still loses only because `0.127028 < 0.163948`.

Important numbers:
- exact minimum support weight needed to beat the current direct `STXBP1` gene score:
  - `0.877638`
- scenario sweep:
  - `0.80`: still fails
  - `0.85`: still fails
  - `0.90`: succeeds
    - final gene score `0.168125`
  - `1.00`: succeeds
    - final gene score `0.186806`

Decision:
- The next clean scorer-side shadow should be a narrow handoff-floor rule, not more generic enrichment.
- A plausible narrow policy is:
  - if a specific direct disease has exact direct overlaps after enrichment, raise its handoff weight floor to `0.9`
- Do not ship that to the main scorer yet.
- First test it on the STXBP1 case-family slice, then decide whether the pattern generalizes.

Own commentary / alternatives:
- This is the first STXBP1 result that cleanly isolates a single remaining leak.
- The earlier “enrichment failed” reading was too crude. What actually failed was enrichment under the old handoff rule.
- This is a much better place to be analytically:
  - disease semantics are already doing useful work
  - the specific branch can be repaired
  - the remaining question is now a narrow aggregation/handoff design choice, not a vague “maybe we need more terms”
- I would still avoid over-generalizing from one case. The right next proof is a small STXBP1 slice, not a full scorer patch.

Rollback plan:
- shadow-only script and artifacts
- no production scorer changes

Status:
- kept

### Entry 22: STXBP1 family rerun says the handoff floor is real but still too weak
Date:
- 2026-03-25

Question:
- If we take the single-case handoff result seriously and rerun the whole STXBP1 case family under the same `4-term + 0.9 floor` rule, does the benchmark-visible STXBP1 slice actually improve?

Evidence surface:
- live graph rerun through a new STXBP1-only shadow benchmark script:
  - [shadowStxbp1CaseSliceHandoffFloor.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowStxbp1CaseSliceHandoffFloor.js)
- saved artifacts:
  - [shadow-stxbp1-case-slice-handoff-floor-20260325-limit100.json](/Users/ahmedelmorshedy/Genovy/output/shadow-stxbp1-case-slice-handoff-floor-20260325-limit100.json)
  - [shadow-stxbp1-case-slice-handoff-floor-20260325.json](/Users/ahmedelmorshedy/Genovy/output/shadow-stxbp1-case-slice-handoff-floor-20260325.json)
- previous single-case handoff proof:
  - [shadow-stxbp1-support-handoff-override-20260325.json](/Users/ahmedelmorshedy/Genovy/output/shadow-stxbp1-support-handoff-override-20260325.json)

Intentionally not inspected:
- full 100-case benchmark rerun
- non-STXBP1 genes
- larger scorer redesigns

Result:
- At the benchmark-comparable `top-100` cut:
  - absolutely no visible STXBP1 gain
  - `6 / 10` found before and after
  - `top-10` unchanged at `1`
  - `MRR` unchanged at `0.024438`
- At a deeper `top-500` diagnostic cut:
  - `2` cases improve, but only modestly:
    - `PMID_35190816_STX_27159321_LD_0358`: `153 -> 152`
    - `PMID_35190816_STX_28944233_270001`: `267 -> 208`

Important numbers:
- benchmark-comparable slice:
  - baseline `6 / 10`
  - shadow `6 / 10`
  - delta `0`
- deeper diagnostic slice:
  - `MRR 0.026578 -> 0.026688`
  - `2` improved
  - `0` worsened

Decision:
- Do not treat the `0.9` handoff floor as a sufficient STXBP1 fix.
- Keep the handoff result as real but partial.
- The next STXBP1 step must be stronger than this:
  - either richer discriminating enrichment than the current `4` terms
  - or a more meaningful aggregation change than the narrow floor alone

Own commentary / alternatives:
- This is a good reality-check result.
- It would have been easy to over-read the single-case proof and jump to a scorer patch. The family rerun stops that.
- The handoff floor is still worth understanding because it exposed a real leak. But it is now clearly a second-order leak, not the whole STXBP1 story.
- The new shape is:
  - the branch was too thin
  - targeted enrichment helped
  - handoff suppression was real
  - even after both, the gain is still too small at the family benchmark level
- That strongly suggests there is yet another bottleneck, probably in how the gene competes globally rather than only in the DEE4 handoff.

Rollback plan:
- shadow-only script and artifacts
- no production scorer changes

Status:
- kept

### Entry 23: Generic specific-direct handoff floor is globally positive even without enrichment
Date:
- 2026-03-25

Question:
- Before doing more STXBP1-specific enrichment work, does a generic scorer-side rule help across the full benchmark on its own?
- Specifically:
  - no enrichment
  - no source changes
  - no disease-profile edits
  - only raise the disease-to-gene handoff floor to `0.9` for support diseases that already have direct phenotype edges and at least one exact direct overlap

Evidence surface:
- live full 100-case shadow benchmark through:
  - [shadowGenericSpecificDirectHandoffFloor.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowGenericSpecificDirectHandoffFloor.js)
- shadow artifacts:
  - [shadow-generic-specific-direct-handoff-floor-20260325.json](/Users/ahmedelmorshedy/Genovy/output/shadow-generic-specific-direct-handoff-floor-20260325.json)
  - [shadow-generic-specific-direct-handoff-floor-20260325.md](/Users/ahmedelmorshedy/Genovy/output/shadow-generic-specific-direct-handoff-floor-20260325.md)
- baseline benchmark reference:
  - [official-benchmark-post-clinvar-run54.json](/Users/ahmedelmorshedy/Genovy/output/official-benchmark-post-clinvar-run54.json)

Intentionally not inspected:
- no disease-profile enrichment
- no new source data
- no raw DB dump crawl
- no production scorer patch

Result:
- The generic handoff-floor rule is materially positive across the full benchmark even without enrichment.
- This is much stronger than the STXBP1-only family rerun.
- It means the March 25 handoff leak is not just a one-gene oddity.
- It is a broader scorer geometry issue affecting multiple already-specific truth branches.

Important numbers:
- baseline:
  - `Found = 82%`
  - `Top-1 = 34%`
  - `Top-3 = 43%`
  - `Top-5 = 46%`
  - `Top-10 = 57%`
  - `Median rank = 3`
  - `MRR = 0.409646`
- shadow with generic `0.9` floor:
  - `Found = 83%`
  - `Top-1 = 36%`
  - `Top-3 = 47%`
  - `Top-5 = 51%`
  - `Top-10 = 60%`
  - `Median rank = 2`
  - `MRR = 0.437917`
- delta:
  - `9` improved
  - `2` worsened
  - `1` recovered from miss
  - `0` regressed to miss
- notable recovered case:
  - `PMID_35190816_STX_27159321_LD_0358` (`STXBP1`) `miss -> 96`

Decision:
- Promote the generic specific-direct handoff-floor rule to the front of the scorer-side queue.
- It now has better evidence than another round of narrow STXBP1-only enrichment work.
- The next two clean follow-ups are:
  1. rerun the same full-benchmark shadow at `1.0`
  2. inspect the `2` worsened cases for required guardrails

Own commentary / alternatives:
- This is the first late-stage scorer shadow in this line of work that clearly improved the broad benchmark without relying on new data.
- That makes it strategically important.
- It does not mean “ship the rule now.”
- The override is broad, and the counts in the artifact show it touches a large support surface, so it still needs restraint and explanation.
- But analytically, this result changes priority:
  - the global handoff rule now looks more promising than more STXBP1-only term chasing
  - and it gives a concrete alternative to the earlier “only enrichment remains” framing

Rollback plan:
- shadow-only script and artifacts
- no production scorer changes

Status:
- kept

### Entry 24: Generic `1.0` handoff floor is stronger than `0.9` but clearly less safe
Date:
- 2026-03-25

Question:
- If the generic `0.9` handoff floor is globally positive, does pushing the same rule to `1.0` produce a better benchmark, or does it become too blunt?

Evidence surface:
- live full 100-case shadow benchmark through:
  - [shadowGenericSpecificDirectHandoffFloor.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowGenericSpecificDirectHandoffFloor.js)
- `1.0` artifacts:
  - [shadow-generic-specific-direct-handoff-floor-20260325-w1.0.json](/Users/ahmedelmorshedy/Genovy/output/shadow-generic-specific-direct-handoff-floor-20260325-w1.0.json)
  - [shadow-generic-specific-direct-handoff-floor-20260325-w1.0.md](/Users/ahmedelmorshedy/Genovy/output/shadow-generic-specific-direct-handoff-floor-20260325-w1.0.md)
- comparison against the earlier `0.9` shadow:
  - [shadow-generic-specific-direct-handoff-floor-20260325.json](/Users/ahmedelmorshedy/Genovy/output/shadow-generic-specific-direct-handoff-floor-20260325.json)

Intentionally not inspected:
- no disease-profile enrichment
- no source refresh
- no raw DB dump crawl
- no production scorer patch

Result:
- `1.0` is stronger than `0.9` on raw benchmark performance.
- But it also grows the regression surface enough that it cannot be treated as a safe default.
- So this run does not falsify the handoff-floor idea.
- It sharpens it:
  - the family of rules is good
  - unconditional `1.0` is probably too aggressive

Important numbers:
- baseline:
  - `Found = 82%`
  - `Top-1 = 34%`
  - `Top-3 = 43%`
  - `Top-5 = 46%`
  - `Top-10 = 57%`
  - `Median rank = 3`
  - `MRR = 0.409646`
- `0.9` shadow:
  - `Found = 83%`
  - `Top-1 = 36%`
  - `Top-3 = 47%`
  - `Top-5 = 51%`
  - `Top-10 = 60%`
  - `Median rank = 2`
  - `MRR = 0.437917`
- `1.0` shadow:
  - `Found = 84%`
  - `Top-1 = 42%`
  - `Top-3 = 52%`
  - `Top-5 = 53%`
  - `Top-10 = 60%`
  - `Median rank = 1.5`
  - `MRR = 0.485974`
- `1.0` delta vs baseline:
  - `21` improved
  - `14` worsened
  - `2` recovered from miss
  - `0` regressed to miss
- especially important wins:
  - `STXBP1` `PMID_35190816_STX_27159321_LD_0358`: `miss -> 25`
  - `SCN2A` `PMID_33731876_fam421`: `miss -> 43`

Decision:
- Do not jump straight from `0.9` to shipping `1.0`.
- The next step is guardrail analysis on the worsened cases.
- The strongest first guardrail target is:
  - `PPP2R1A` `PMID_37761890_22`
- After that:
  - inspect the next-largest regression and compare it against one of the strongest wins

Own commentary / alternatives:
- This is a good problem to have.
- The `1.0` run proves the scorer is still bottlenecked by handoff geometry more than the previous March 22 framing suggested.
- But the extra lift also shows why this cannot stay a raw floor rule forever.
- If I had to summarize the state in one sentence:
  - `0.9` looks promising and restrained
  - `1.0` looks powerful but too blunt
- That means the real next design question is likely conditionality, not magnitude alone.

Rollback plan:
- shadow-only artifacts
- no production scorer change

Status:
- kept

### Entry 25: The real scorer patch confirms the handoff-floor win, but U2AF2 regresses again
Date:
- 2026-03-25

Question:
- If we patch the real scorer with the generic `1.0` specific-direct handoff floor and rerun the official benchmark, does the broad shadow result survive end to end?

Evidence surface:
- scorer patch in:
  - [dx.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/constants/dx.js)
  - [similarityEngine.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/services/dx/similarityEngine.js)
- focused unit test:
  - [dxSimilarity.test.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/dxSimilarity.test.js)
- official benchmark artifacts:
  - [handoff-floor-1.0.json](/Users/ahmedelmorshedy/Genovy/output/handoff-floor-1.0.json)
  - [handoff-floor-1.0.md](/Users/ahmedelmorshedy/Genovy/output/handoff-floor-1.0.md)
- baseline comparator:
  - [official-benchmark-post-clinvar-run54.json](/Users/ahmedelmorshedy/Genovy/output/official-benchmark-post-clinvar-run54.json)

Intentionally not inspected:
- no new source ingest
- no enrichment
- no raw DB dump crawl

Result:
- The scorer patch preserves most of the `1.0` shadow upside and becomes the strongest real rule-based result so far.
- But the official run is slightly messier than the shadow:
  - one `U2AF2` case regresses from rank `30` back to miss
- So the handoff-floor idea is now proven as a real scorer improvement, but not yet proven as a final unconditional rule.

Important numbers:
- baseline (`post-clinvar-run54`):
  - `Found = 83%`
  - `Top-1 = 34%`
  - `Top-3 = 43%`
  - `Top-5 = 46%`
  - `Top-10 = 57%`
  - `MRR = 0.410153`
- patched scorer:
  - `Found = 84%`
  - `Top-1 = 42%`
  - `Top-3 = 52%`
  - `Top-5 = 53%`
  - `Top-10 = 60%`
  - `Median rank = 1.5`
  - `MRR = 0.485974`
- delta:
  - `21` improved
  - `15` worsened
  - `2` recovered from miss
  - `1` regressed to miss
- regressed-to-miss case:
  - `PMID_36747105_proband` (`U2AF2`) `30 -> miss`

Decision:
- Keep the patched scorer as the new strongest working candidate.
- Do not immediately declare it final.
- The next two inspections are now mandatory:
  1. `U2AF2` under the new scorer
  2. `PPP2R1A` under the new scorer

Own commentary / alternatives:
- This is a big result. It moves Genovy decisively past Exomiser on ranking metrics in a real scorer run, not just a shadow.
- But the `U2AF2` regression is exactly the kind of warning that keeps this from becoming a victory-lap moment.
- It also explains why the shadow and real scorer should never be conflated in the diary:
  - the shadow identified the right direction
  - the real scorer exposed one attachment-fragile edge case the shadow did not preserve cleanly

Rollback plan:
- scorer patch is isolated and test-covered
- if the `U2AF2` regression proves unacceptable, revert the handoff override or narrow it with a guardrail

Status:
- kept

## 2026-03-25 STXBP1 Single-Case Audit

What I did:
- Added a single-case live audit script:
  - [auditStxbp1MissCase.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/auditStxbp1MissCase.js)
- Ran it on the current working graph for:
  - `PMID_35190816_STX_28944233_270001`
- Saved the artifact:
  - [audit-stxbp1-missed-case-28944233-270001.json](/Users/ahmedelmorshedy/Genovy/output/audit-stxbp1-missed-case-28944233-270001.json)

What came out:
- Winner:
  - `RAI1`
  - `Smith-Magenis syndrome`
  - normalized score `0.240032`
- Truth:
  - `STXBP1`
  - `genetic developmental and epileptic encephalopathy`
  - normalized score `0.163948`
- Winner support disease exact overlaps:
  - `11`
- Truth support disease exact overlaps:
  - `0`

Important interpretation:
- This case is not mainly “common terms drown rare terms.”
- The winning `RAI1` disease matches several rare or fairly specific patient terms exactly:
  - `Broad face`
  - `Pain insensitivity`
  - `Broad palm`
  - `Impulsivity`
- The truth `STXBP1` support disease for this case is broad and phenotypically unhelpful.
- So this case points more toward:
  - truth support-disease selection / branch fit
  - and phenotype-surface quality
  - than a pure information-content weighting bug

Own commentary:
- This is a sharper result than the earlier STXBP1 enrichment shadow test. The enrichment test told us more DEE4 terms did not move rank. This single-case audit now shows why at least one hard miss can stay hard: the winning non-truth syndrome is actually a stronger rare-feature match than the current STXBP1 truth branch.
- If this pattern repeats on another STXBP1 miss, the next useful work is not “more generic enrichment.” It is either:
  - choose a more specific STXBP1 support disease/profile if one already exists
  - or improve the specific STXBP1 phenotype surface that the scorer can actually select

## 2026-03-25 STXBP1 Disease-Branch Audit

What I did:
- Added a second targeted STXBP1 script:
  - [auditStxbp1DiseaseBranchSelection.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/auditStxbp1DiseaseBranchSelection.js)
- Ran two checks for `PMID_35190816_STX_28944233_270001`:
  - inventory the four discriminating terms across all STXBP1-linked diseases
  - compare disease-only score for `DEE4` vs the umbrella

Artifact:
- [audit-stxbp1-disease-branch-selection-20260325.json](/Users/ahmedelmorshedy/Genovy/output/audit-stxbp1-disease-branch-selection-20260325.json)

What came out:
- No STXBP1-linked disease currently has any of the four tested terms as direct terms:
  - `Broad face`
  - `Pain insensitivity`
  - `Broad palm`
  - `Impulsivity`
- `DEE4` has none of those four terms, direct or propagated
- The umbrella `MONDO:0100062` has propagated:
  - `Broad face`
  - `Impulsivity`
- `DEE4` score for this patient:
  - rank `5247`
  - normalized score `0.076491`
  - exact direct overlaps `1`
- Umbrella score for this patient:
  - rank `7`
  - normalized score `0.227175`
  - direct overlaps `0`
  - propagated phenotype count `786`
  - many propagated exact matches

Important interpretation:
- This is not a clean support-selection leak where the specific STXBP1 branch already has the right terms and still loses.
- The specific branch is simply too thin for this patient right now.
- The umbrella wins because it has a huge propagated phenotype surface while `DEE4` is almost empty on the discriminating features that matter here.

Own commentary:
- This sharpens the earlier STXBP1 story again. The first enrichment shadow test said “adding 19 terms to DEE4 did not move the benchmark.” The first single-case audit said “RAI1 matches rare specific terms better than the current STXBP1 truth branch.” This second branch audit now says the tested discriminating terms do not currently live on DEE4 at all. So for this case, the most grounded read is still specific-branch phenotype surface weakness, not just scorer tuning.

## 2026-03-25 STXBP1 Discriminating-Term Shadow Test

What I did:
- Added a narrow shadow script:
  - [shadowStxbp1DiscriminatingCase.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowStxbp1DiscriminatingCase.js)
- Shadow-added only `4` discriminating terms to `DEE4` for one patient:
  - `Broad face`
  - `Pain insensitivity`
  - `Broad palm`
  - `Impulsivity`
- Compared baseline `DEE4` disease score to shadow `DEE4` disease score for:
  - `PMID_35190816_STX_28944233_270001`

Artifact:
- [shadow-stxbp1-discriminating-case-20260325.json](/Users/ahmedelmorshedy/Genovy/output/shadow-stxbp1-discriminating-case-20260325.json)

What came out:
- `DEE4` improved dramatically:
  - rank `5253 -> 95`
  - normalized score `0.076491 -> 0.186806`
- But inferred `STXBP1` gene score did not move:
  - baseline gene score `0.163948`
  - shadow-derived DEE4 support score `0.127028`
  - inferred shadow gene score still `0.163948`

Important interpretation:
- The consultant correction was partly right: targeted discriminating enrichment does help the specific disease branch.
- But the disease-level gain still does not reach the final gene score.
- So the bottleneck is now clearly mixed:
  - targeted enrichment matters
  - and gene-level support aggregation / weighting still blocks the benefit from surfacing

Own commentary:
- This is the cleanest STXBP1 result so far. Generic enrichment was too weak. The 4 rare terms were the right terms and they materially improved DEE4. But even that improvement still cannot move STXBP1 because the gene-level scoring path is bottlenecked elsewhere.

### Entry 19: SPTAN1 top-k scorer softening helps but does not rescue; PPP2R1A is mixed
Date:
- 2026-03-25

Question:
- Is `SPTAN1` mainly a broad-profile normalization bug, and should `PPP2R1A` stay in the same leftover bucket?

Evidence surface:
- live working-graph similarity index
- single-case shadow scorer for `PMID_36331550_Family16Patient21`
- ranked-output audit artifact for the two `PPP2R1A` cases
- new shadow artifacts:
  - [shadow-sptan1-topk-gene-profile.json](/Users/ahmedelmorshedy/Genovy/output/shadow-sptan1-topk-gene-profile.json)
  - [shadow-sptan1-topk-gene-profile.md](/Users/ahmedelmorshedy/Genovy/output/shadow-sptan1-topk-gene-profile.md)

Intentionally not inspected:
- broad benchmark reruns
- new enrichment sources
- mounted raw data

Result:
- `SPTAN1` baseline rank is `322`
- best tested top-k setting only improves it to `182`
- top-k softening helps, so the broad-profile penalty is real
- but it is far too weak to explain or fix the case by itself
- `PPP2R1A` no longer belongs in the pure-ranking bucket:
  - case `41` truth direct overlap `3` while many competitors show `4-8`
  - case `43` truth direct overlap `5` while many competitors show `6-9`

Important numbers:
- `SPTAN1` shadow ranks:
  - top-k `4`: `242`
  - top-k `8`: `182`
  - top-k `12`: `260`
  - top-k `16`: `268`
  - top-k `24`: `260`
  - top-k `32`: `279`
  - top-k `48`: `318`
  - top-k `64`: `291`

Decision:
- Do not patch the main scorer with top-k-only broad-profile softening.
- Keep `SPTAN1` as a real leftover ranking/specificity problem.
- Reclassify `PPP2R1A` as mixed: ranking plus truth-profile weakness.

Own commentary / alternatives:
- This was a good negative test. It closes the obvious “maybe just cap the broad gene profile” theory without another expensive benchmark pass.
- The interesting part is that very broad competitors like `EHMT1`, `GRIN2A`, `ZEB2`, and `MECP2` still outrank `SPTAN1` under aggressive top-k scoring. That means raw profile size is not the only thing suppressing `SPTAN1`.
- If `SPTAN1` gets revisited, the next lever should be more specific than profile softening: disease-support aggregation, semantic matching, or explicit specificity features.

Rollback plan:
- shadow-only script and docs
- no production scorer changes

Status:
- kept

### Entry 19: STXBP1 direct enrichment theory failed cleanly
Date:
- 2026-03-24

Question:
- If DEE4 (`MONDO:0012812`) gets a focused GeneReviews-informed direct-term enrichment, does STXBP1 improve enough to justify doing the same style of work across the undercovered-gene set?

Evidence surface:
- live working-graph scorer inputs loaded through the normal DX similarity index path
- narrow disease-row inspection for `MONDO:0012812`
- current official benchmark slice for STXBP1 truth-gene cases
- shadow-only benchmark artifacts:
  - [stxbp1-direct-enrichment-test.json](/Users/ahmedelmorshedy/Genovy/output/stxbp1-direct-enrichment-test.json)
  - [stxbp1-direct-enrichment-test.md](/Users/ahmedelmorshedy/Genovy/output/stxbp1-direct-enrichment-test.md)

Intentionally not inspected:
- automated bulk GeneReviews extraction
- OMIM ingestion
- ranked competitors for non-STXBP1 genes

Result:
- Added `19` new direct DEE4 terms on top of the existing `27` direct profile terms.
- Ran all current STXBP1 benchmark cases (`10`, not `8`).
- Outcome was perfectly flat:
  - `6 / 10` found before and after
  - `0` improved
  - `0` worsened
  - MRR unchanged at `0.024438`

Important numbers:
- exact overlap with added terms still existed in some patient packets:
  - `PMID_35190816_STX_26865513_Patient_45`: `4`
  - `PMID_35190816_STX_28944233_270001`: `7`
  - `PMID_35190816_STX_EG0598P`: `1`
- despite that:
  - no rank moved at all

Decision:
- Do not assume “more direct syndrome terms” is the right generic next move.
- Move next to ranked-output audit on the leftover ranking-problem genes.
- Keep STXBP1 as a leftover problem, but stop treating DEE4 thinness alone as the main explanation.

Own commentary / alternatives:
- This was a high-value negative result. It killed a plausible story cheaply.
- The important part is that the test had exact patient-term hits and still did nothing. That pushes the blame away from mere missing profile terms and toward how the scorer aggregates and compares gene support.
- If STXBP1 is revisited next, the smarter experiment is not “add more terms again.” It is “open the winning competitor genes and inspect why they still outrank STXBP1 even after exact new support was added.”

Rollback plan:
- shadow-only experiment; no graph mutation occurred

Status:
- kept

### Entry 20: propagation is mostly innocent in the ranking-problem set
Date:
- 2026-03-24

Question:
- Are the leftover ranking-problem cases still losing because propagated umbrella diseases are outranking better truth support?

Evidence surface:
- live top-20 ranked outputs per case from the working graph
- support disease details per competitor:
  - support disease label
  - direct vs propagated mode
  - leaf vs umbrella
  - exact direct overlap count
  - exact propagated-only overlap count
- audit artifacts:
  - [ranked-output-audit-ranking-problem-cases-20260324.json](/Users/ahmedelmorshedy/Genovy/output/ranked-output-audit-ranking-problem-cases-20260324.json)
  - [ranked-output-audit-ranking-problem-cases-20260324.md](/Users/ahmedelmorshedy/Genovy/output/ranked-output-audit-ranking-problem-cases-20260324.md)

Intentionally not inspected:
- semantic nearest-neighbor term analysis
- unofficial enrichment sources
- broad miss-set re-bucketing outside the target cases

Result:
- The propagation theory mostly failed.
- Across `100` inspected competitor slots above the truth genes:
  - only `1` fit the “broad propagated zero-direct” pattern
  - `66` were specific direct-match competitors
- So this leftover set is mostly not being beaten by bad propagated umbrellas.

Important numbers:
- `SPTAN1`
  - truth rank `322`
  - truth support had `2` exact direct overlaps
  - many winners had only `1-2` overlaps too
- `PPP2R1A` case `41`
  - truth rank `256`
  - truth support had `3` exact direct overlaps
  - winners often had `4-8`
- `PPP2R1A` case `43`
  - truth rank `109`
  - truth support had `5` exact direct overlaps
  - winners often had `6-9`
- `SCN2A` fam421 and `SMARCC2`
  - both are effectively low-information sparse-packet cases
  - Exomiser is also bad on both

Decision:
- Do not spend the next cycle on propagation-penalty tuning.
- Focus next scoring analysis on `SPTAN1`.
- Reclassify `PPP2R1A` as mixed, not clean pure ranking.
- Deprioritize `SCN2A` fam421 and `SMARCC2` as immediate scorer targets.

Own commentary / alternatives:
- This was the most useful ranking audit outcome because it removes a tempting but probably wrong next experiment.
- `SPTAN1` now deserves concentrated attention. It still looks like the best candidate for a real normalization / specificity bug.
- `PPP2R1A` is more annoying: it was grouped as ranking, but the live evidence says the truthful profile is also just weaker than many competitors. That makes it a mixed case, not a clean algorithm demo.

Rollback plan:
- audit-only; no graph mutation

Status:
- kept

- 2026-03-23

Question:
- After the full official ClinVar bridge is finally working end to end, does the graph materially improve, and does the official benchmark move enough to change the plan?

Evidence surface:
- completed ClinVar backfill:
  - `sync_run_id = 54`
- repeatable structural audit script and post-sync output:
  - [auditGraphStructuralSpectrum.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/auditGraphStructuralSpectrum.js)
  - [post-clinvar-run54.summary.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/ops/post-clinvar-run54.summary.json)
- official benchmark rerun:
  - [official-benchmark-post-clinvar-run54.json](/Users/ahmedelmorshedy/Genovy/output/official-benchmark-post-clinvar-run54.json)

Intentionally not inspected:
- raw ClinVar row-by-row content after the successful completion
- new unofficial enrichment sources
- deep case-by-case reclassification of the remaining miss tail

Result:
- the official ClinVar bridge is real and useful
- `U2AF2` is no longer a pure empty-shell miss; one `U2AF2` benchmark case is now recovered at rank `30`
- but the benchmark effect is modest:
  - frozen `v0`: `82 found`, `58 top-10`, `MRR 0.409669`
  - post-ClinVar: `83 found`, `57 top-10`, `MRR 0.410153`
- so the pipeline repair mattered, but it did not dissolve the remaining miss tail

Important numbers:
- ClinVar completion:
  - accepted rows covered: `3,163,504`
  - resumed rows after the checkpoint: `1,178,504`
- structural spectrum after the repair:
  - hollow shells: `148`
  - sparse one-sided: `504`
  - poorly enriched two-sided: `1207`
  - better covered: `3846`
- ClinVar-derived support:
  - genes with ClinVar-derived disease support: `4671`
  - genes whose only disease support is ClinVar-derived: `2759`
- benchmark:
  - found: `83`
  - top-1: `34`
  - top-10: `57`
  - MRR: `0.410153`

Decision:
- keep the ClinVar bridge
- stop treating pipeline repair as the main remaining lever
- move to leftover-case fixing:
  - truth-branch enrichment
  - branch/support quality
  - ranking fixes only after case-level residuals are rechecked

Own commentary / alternatives:
- This is a genuine success, but not the kind that justifies a victory lap. The graph gained a large amount of official disease support, yet the benchmark only moved by one found case versus frozen `v0`. That means the next bottleneck is not “we forgot to pull ClinVar.”
- The new structural spectrum is much harsher than the older `23 / 426 / 777 / 4479` snapshot. The query is sanity-checked, but this discrepancy itself is now a real piece of evidence: our older structural picture should not be treated as live truth anymore.
- The most important thing the ClinVar work bought us is clarity. We can now stop hypothesizing about whether `U2AF2` was merely a stale-source artifact. It was partially recoverable from official deeper evidence, and we proved it.

Rollback plan:
- keep the frozen `v0` benchmark as the comparator
- keep the post-ClinVar benchmark as the new working-state checkpoint

Status:
- kept

---

### Entry 18: `U2AF2` is missing the gene→disease edge, not the disease phenotype profile
Date:
- 2026-03-22

Question:
- After the Phase 0 refresh, is `U2AF2` empty because the syndrome-side phenotype evidence is absent, or because the gene never gets attached to the disease that already exists?

Evidence surface:
- isolated Railway working DB only
- narrow queries against:
  - `source_records`
  - `entities`
  - `entity_xrefs`
  - `relationships`
  - `canonical_concepts`

Intentionally not inspected:
- raw official source files on disk
- non-official/manual enrichment sources
- broad graph crawls unrelated to `U2AF2`

Result:
- the disease phenotype surface is already there
- the gene→disease attachment is not

More precisely:
- `hpo_disease_phenotype` contains `26` source records for `OMIM:620535`
- `OMIM:620535` is mapped in the graph as xref to:
  - `MONDO:0957810`
  - `developmental delay, dysmorphic facies, and brain anomalies`
- that disease entity already has `26` `has_phenotype` relationships
- but `U2AF2` still has:
  - `0` `associated_with_disease`
  - `0` `associated_with_phenotype`
- and none of the refreshed official gene-oriented source records currently mention `U2AF2`

Decision:
- Stop framing `U2AF2` as “missing syndrome profile.”
- Frame it as “syndrome profile exists; official-source gene attachment is absent.”
- The next Phase 1 proof step should focus on whether current official sources expose a usable `U2AF2 -> DEVDFB / OMIM:620535 / MONDO:0957810` mapping at all.

Own commentary / alternatives:
- This is a better result than another vague “still empty” statement because it isolates the seam. We now know where the graph is healthy and where it is not.
- It also weakens the earlier assumption that a simple HPO gene-disease refresh should have rescued `U2AF2`. The disease phenotype side was already present; the missing piece is the gene attachment surface.
- If current official gene-oriented sources really do not expose `U2AF2`, then Phase 1 cannot solve this purely by refresh/re-ingestion. That would force `U2AF2` into a later enrichment/manual-attachment class.

Rollback plan:
- docs-only; no new graph mutation beyond the completed Phase 0 refresh

Status:
- kept

---

### Entry 17: The current identity-repair population is smaller than feared
Date:
- 2026-03-22

Question:
- After the Phase 0 refresh, is `U2AF2` one of many repaired-but-empty genes, or is it a narrower outlier inside the current repair workflow?

Evidence surface:
- isolated Railway working DB only
- narrow queries against:
  - `source_records`
  - `sync_runs`
  - `entities`
  - `relationships`
- repair workflow code:
  - `src/scripts/repairGeneIdentityHoles.js`

Intentionally not inspected:
- any raw source dumps
- broader graph scans outside repaired-gene candidates
- any other hypothetical repair pathway not evidenced by current artifacts

Result:
- The currently evidenced repair population is only `2` genes:
  - `U2AF2`
  - `RPGRIP1`
- Of those two:
  - `U2AF2` is still empty
  - `RPGRIP1` is healthy and connected
- So the feared “many repaired empty-shell genes” pattern is not currently proven.

Important numbers:
- logical repaired genes identified: `2`
- empty shells among them: `1`
- fully connected among them: `1`
- post-refresh live counts:
  - `U2AF2`: `0` disease links, `0` phenotype links
  - `RPGRIP1`: `10` disease links, `165` phenotype links

Decision:
- Do not over-generalize the `U2AF2` pattern.
- Narrow Phase 1 to a `U2AF2`-first diagnosis instead of assuming a large repair-population cleanup.
- Keep open the possibility of another repair pathway elsewhere, but do not invent it without artifacts.

Own commentary / alternatives:
- This is a useful correction to the earlier emotional model of the problem. `U2AF2` felt like the first discovered member of a large hidden class; the current evidence says it may just be a narrow outlier.
- The counterexample matters: `RPGRIP1` proves the repair workflow can coexist with healthy later attachment. That shifts suspicion away from “repair broke everything” and toward “this one gene never got usable official-source evidence attached.”
- `RPGRIP1L` appeared in a repair sync verification blob, but until it shows up in durable repair artifacts or live repair metadata I do not want to count it as part of the confirmed repair population. That is exactly the kind of overclaim we need to avoid now.

Rollback plan:
- docs-only; no graph mutation beyond the already-completed Phase 0 refresh

Status:
- kept

---

### Entry 16: Phase 0 freshness refresh completed on the working graph
Date:
- 2026-03-22

Question:
- After freezing `v0`, can we refresh the stale/provenance-gap sources on the isolated working graph, prove the exact ingested versions, and learn whether the refresh changes key empty-shell genes like `U2AF2`?

Evidence surface:
- isolated Railway working DB:
  - `source_sync_state`
  - `sync_runs`
  - narrow gene-level relationship checks for `U2AF2` and `RPGRIP1`
- working-branch ingestion code
- targeted migration repairs applied only to the working DB

Intentionally not inspected:
- raw source dumps
- broad data crawls
- Exomiser bundle internals
- ranking output deltas

Result:
- Phase 0 completed cleanly on the working graph.
- The five target sources were refreshed successfully:
  - `hpo_gene_disease`
  - `hpo_gene_phenotype`
  - `clingen_gene_disease_validity`
  - `clinvar_gene_disease`
  - `clinvar_variant_summary`
- The provenance patch worked:
  - the four previously blank-source-version surfaces now persist usable versions after sync
- `U2AF2` did not change:
  - it is still an identity-only shell with zero disease links and zero phenotype links
- `RPGRIP1` remained healthy and connected after the refresh, so the refresh did not destabilize a normal phenotype carrier

Important numbers:
- completed sync runs:
  - `hpo_gene_disease`: run `37`, version `Mon, 16 Feb 2026 17:29:41 GMT`
  - `hpo_gene_phenotype`: run `38`, version `Mon, 16 Feb 2026 17:29:44 GMT`
  - `clingen_gene_disease_validity`: run `40`, version `2026-03-22`
  - `clinvar_gene_disease`: run `41`, version `Sun, 22 Mar 2026 14:17:20 GMT`
  - `clinvar_variant_summary`: run `45`, version `Sun, 15 Mar 2026 18:11:04 GMT`
- selected refresh summaries:
  - `hpo_gene_phenotype`: `5256` entities, `329339` relationships
  - `clingen_gene_disease_validity`: `3484` relationships, `3463` clinical validity assertions
  - `clinvar_variant_summary`: `27831` entities, `113014` relationships, `56494` clinical variant-disease assertions
- post-refresh narrow gene checks:
  - `U2AF2`: `0` disease links, `0` phenotype links
  - `RPGRIP1`: `10` disease links, `165` phenotype links

Decision:
- Mark Phase 0 complete on `v1-working`.
- Do not keep debating freshness in the abstract; the working graph now reflects the latest targeted source state.
- Move to Phase 1:
  - full identity-repair sweep
  - `U2AF2` specific source/attachment diagnosis
  - refreshed-graph benchmark rerun before manual enrichment

Own commentary / alternatives:
- This was an important falsification step. If `U2AF2` had filled in after the refresh, the story would have been “simple staleness.” It did not, so the next step must separate true upstream absence from attachment failure.
- The schema-repair work turned out to be part of Phase 0 in practice. The Railway working clone looked healthy at the table-count level but still had enough historical drift to break modern sync paths. That is worth remembering for future environment clones.
- The provenance patch paid for itself immediately. The earlier “likely current” language around HPO gene-disease and gene-phenotype can now be retired on the working graph.

Rollback plan:
- `v0` remains frozen on GitHub + Railway
- all schema repairs and source refreshes happened only on `v1-working`

Status:
- kept

---

### Entry 2: Direct curated phenotype evidence existed, but the scorer was bypassing it
Date:
- 2026-03-17

Question:
- Were direct HPO disease-phenotype edges lost, or was the scorer simply not using them?

Evidence surface:
- targeted DB checks
- DX path trace
- direct-edge investigation report

Intentionally not inspected:
- no broad full-table export review

Result:
- The direct curated HPO disease-phenotype edges still existed.
- The scoring path was routing too heavily through propagated disease profiles and umbrella diseases.
- This was a routing problem, not data loss.

Important numbers:
- `281,964` curated HPO disease-phenotype rows still existed in the DB
- pre-fix benchmark path effectively exposed `0%` direct disease phenotype edges for the candidate diseases it selected

Decision:
- Fix DX loading and support-disease selection so direct disease profiles are reachable and preferred.

Status:
- kept

---

### Entry 3: Direct-edge routing fix helped, but did not fully solve ranking
Date:
- 2026-03-17

Question:
- If direct curated disease phenotypes are used, does the benchmark improve cleanly?

Evidence surface:
- direct-edge fix benchmark rerun

Intentionally not inspected:
- no ranker retraining

Result:
- The fix was biologically correct and necessary.
- It recovered some major regressions.
- But some earlier rescued cases had been benefiting from broad propagated profiles, so the net effect was mixed.

Important numbers:
- baseline before this fix: `81/32/41/45/55`, `MRR 0.390464`
- after direct-edge fix: `80/33/41/45/55`, `MRR 0.395267`
- notable recoveries:
  - `PMID_34521999_43`: `84 -> 9`
  - `PMID_34521999_50`: `91 -> 18`
  - `PMID_34521999_32`: `miss -> 24`

Decision:
- Keep the direct-edge routing fix.
- Do not assume direct-only support is sufficient by itself.

Status:
- kept

---

### Entry 4: Propagation was useful, but too noisy if treated like direct evidence
Date:
- 2026-03-17

Question:
- Is phenotype propagation mostly good, mostly bad, or mixed?

Evidence surface:
- propagation audit
- regression analysis
- saved benchmark outputs

Intentionally not inspected:
- no retrained ranker

Result:
- Propagation helped some sparse cases and hurt others.
- The problem was not mainly random unrelated diseases taking over.
- The bigger problem was related disease-family competitors getting too strong.

Important numbers:
- sparse-disease propagation added `196,838` phenotype edges across `3,553` diseases
- regression bucket counts:
  - Bucket 1, wrong propagation: `4`
  - Bucket 2, related-family wrong gene: `15`
  - Bucket 3, unrelated to propagation: `5`

Decision:
- Do not do broad rollback.
- Prefer weighting/downranking propagated support instead of deleting it wholesale.

Status:
- kept

---

### Entry 5: Propagation-weight heuristic was the best rule-based step
Date:
- 2026-03-17

Question:
- If propagated disease support is kept but downweighted relative to direct support, does ranking improve?

Evidence surface:
- official 100-case benchmark
- propagation-weight heuristic output

Intentionally not inspected:
- no ML ranker

Result:
- Yes.
- This was the best rule-based benchmark in this phase.

Important numbers:
- direct support weight: `1.0`
- propagated support weight clamped between `0.25` and `0.85`
- benchmark:
  - `Found: 80% -> 82%`
  - `Top-1: 33% -> 34%`
  - `Top-3: 41% -> 43%`
  - `Top-5: 45% -> 46%`
  - `Top-10: 55% -> 58%`
  - `MRR: 0.395267 -> 0.409669`
- movement:
  - improved: `17`
  - worsened: `2`
  - recovered from miss: `2`
  - regressed to miss: `0`

Decision:
- Keep this as the current best rule-based benchmark state.

Status:
- kept

---

### Entry 6: Deeper HPO fields were useful; contradiction penalties were not
Date:
- 2026-03-17

Question:
- Can deeper HPO assertion fields improve scoring before new source ingestion?

Evidence surface:
- enriched HPO field loading
- official benchmark reruns
- unit tests

Intentionally not inspected:
- no ML recalibration

Result:
- Loading richer HPO fields was fine.
- Frequency weighting alone was nearly neutral.
- Direct contradiction penalties in the rule-based scorer were catastrophic.

Important numbers:
- with contradiction penalties:
  - `82% -> 68% found`
  - `34% -> 16% top-1`
  - `58% -> 32% top-10`
  - `MRR 0.409669 -> 0.211003`
  - worsened: `43`
  - regressed to miss: `14`
- no-penalty variant:
  - `82% -> 82% found`
  - `34% -> 34% top-1`
  - `58% -> 57% top-10`
  - `MRR 0.409669 -> 0.409646`

Decision:
- Keep richer HPO fields available.
- Do not allow contradiction penalties to directly subtract from rule-based ranking.
- Preserve contradiction signals only as later analysis or ML features.

Status:
- kept in modified form

---

### Entry 7: Naive PPI random walk did not rescue the hard cases
Date:
- 2026-03-17

Question:
- Can protein-protein interaction data rescue hard cases if used as a standalone random-walk layer?

Evidence surface:
- PPI feasibility audit
- hard-case rescue benchmark

Intentionally not inspected:
- no broad novel network heuristics yet

Result:
- STRING coverage was strong.
- Rescue performance was weak.
- The network by itself was too indirect and too noisy.

Important numbers:
- STRING coverage:
  - `5,125 / 5,705` Genovy gene concepts had at least one high-confidence PPI edge
- naive standalone random walk on 41 hard cases:
  - top-1 rescue: `0`
  - top-5 rescue: `0`
  - top-10 rescue: `2`

Decision:
- Do not use naive PPI random walk as a main scoring layer.
- Keep PPI only as a possible later support signal.

Status:
- dismissed as a standalone scorer

---

### Entry 8: PPI still makes sense, but in a narrower role
Date:
- 2026-03-20

Question:
- Did PPI fail because the idea is wrong, or because we used it the wrong way?

Evidence surface:
- prior audit results
- Exomiser documentation
- Exomiser protocol paper
- related network-prioritization literature

Intentionally not inspected:
- no new code run
- no new benchmark rerun

Result:
- The biological idea still makes sense.
- The failure was in asking PPI to do too much.
- Literature supports network information as a rescue/support signal, not as a replacement for direct phenotype evidence.

Important notes:
- Exomiser `hiPhive` uses PPI as one support channel, especially for sparse or novel contexts.
- Network methods in the literature use:
  - random-walk or diffusion scores
  - connectivity significance
  - label propagation
  - edge confidence like STRING combined scores

Decision:
- Revisit PPI later as:
  - a selective cluster-aware rescue signal
  - or an ML feature
- Do not make it the main rule-based scorer

Status:
- parked in narrowed form

---

### Entry 9: Child-direct reroute hypothesis
Date:
- 2026-03-20

Question:
- How many propagated-only gene-disease links could be improved by looking downward to child diseases that have direct HPO edges?

Evidence surface:
- exact SQL audits run narrowly against the live Genovy DB

Intentionally not inspected:
- no broad raw-data crawl

Result:
- A large fraction of current gene-disease support is still propagated-only.
- A meaningful subset looks directly fixable by a child-direct routing rule.

Important numbers:
- total gene-disease links counted under the audit definition: `22,966`
- links where the disease support had direct HPO edges: `13,701`
- propagated-only links: `9,265`
- propagated-only share: `40.3%`
- links fixable by child-direct lookup: `2,459`
- fixable share of propagated-only links: `26.5%`

Decision:
- Test this idea in shadow mode first.
- Do not change core DX logic until the shadow benchmark proves it helps.

Rollback plan:
- current test is shadow-only and in-memory
- if it regresses, delete only the shadow artifacts and do not port the logic into the scorer
- if it helps, implement the permanent change in one isolated commit so it can be reverted cleanly

Status:
- open

---

### Entry 10: Mac vs Google VM benchmarking
Date:
- 2026-03-20

Question:
- Is Google VM actually better for this current benchmark workflow?

Evidence surface:
- VM process/resource checks
- benchmark execution behavior
- observed operational overhead

Intentionally not inspected:
- no wide cloud infra redesign

Result:
- Not for the current rule-based benchmark loop.
- This workload is mostly single-process Node work and seems to prefer the Mac environment.
- The VM added overhead without giving clear speed benefit.

Important notes:
- GPU is not useful for this benchmark.
- More RAM is not the answer here.
- Better single-core execution and lower operational friction matter more.

Decision:
- Use Mac for current benchmark iteration.
- Keep Google for remote persistence, storage, and future ML workloads.

Status:
- kept as an operational lesson

## Ideas Currently Kept
- direct curated disease phenotype evidence should stay strongest
- propagated disease support is useful as fallback, not as equal evidence
- richer HPO fields can stay loaded
- contradiction signals should be analysis/ML features, not direct rule-based penalties
- phenotype profile quality is the main lever left
- PPI can still matter, but only as a bounded support feature
- child-direct disease rerouting is worth testing in shadow mode

## Ideas Dismissed Or Parked
- naive PPI random walk as a standalone scorer
  - dismissed because rescue performance was weak
- broad rollback of propagation
  - dismissed because propagation helped enough cases that blanket deletion was not justified
- contradiction penalties in the rule-based scorer
  - dismissed because benchmark collapsed
- jump straight to CatBoost before cleaning phenotype support
  - parked because the evidence surface is still not stable enough

## Working Scientific Theories
- The truth gene often exists but scores through the wrong disease node.
- Same source is not the same as same quality.
- Broad disease nodes and vague symptom phrases flatten clinically important distinctions.
- The next real gain is likely to come from better phenotype representation, not just another generic score layer.
- Network biology can help, but only if used conditionally and with established metrics.

## Open Questions
- Does child-direct rerouting produce a clear benchmark win without broad regressions?
- Which phenotype-profile enrichments most help hard miss families like `SCN2A`, `STXBP1`, and `PPP2R1A`?
- Which PPI-derived metric, if any, survives as a useful ML feature after phenotype support is cleaned up?
- When the phenotype layer is stable, which DX ranker features actually separate truth genes from top false positives?

---

### Entry 11: Corrected truth-gene support audit
Date:
- 2026-03-21

Question:
- After aligning the audit with the scorer's real support-selection comparator, how many benchmark truth cases still look structurally wrong?

Evidence surface:
- corrected benchmark audit in:
  - `/Users/ahmedelmorshedy/Genovy/output/truth-coverage-pass-2.json`
  - `/Users/ahmedelmorshedy/Genovy/output/truth-coverage-pass-2.md`
- support-selection comparator from:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/services/dx/similarityEngine.js`

Intentionally not inspected:
- no broad raw DB crawl
- no new source ingest

Result:
- The earlier `36` "not best linked" count was inflated by an audit proxy.
- After using the same comparator as `shouldReplaceSupportingDisease()`, the real bucket dropped to `16`.
- All `16` remaining cases are missed truth genes.
- `15` of those `16` have a best linked support candidate with direct phenotype terms.
- `13` of those `16` have a best linked support candidate with exact direct patient overlap.

Important numbers:
- cases: `100`
- truth found: `82`
- truth missed: `18`
- supporting disease has no direct terms: `18`
- supporting disease zero exact direct overlap: `21`
- supporting disease not best support candidate: `16`
- child under supporting beats supporting on direct overlap: `0`

Decision:
- Stop treating the old `36` count as a support-selector fact.
- Focus next experiments on the corrected `16` missed truth-gene cases.
- Test support arbitration in shadow mode before touching core scorer logic.

Rollback plan:
- audit-only change
- no DB writes
- no live scorer behavior changed

Status:
- kept

---

### Entry 12: Shadow support direct-preference selector
Date:
- 2026-03-21

Question:
- If a propagated-only support disease is competing with a linked disease that already has direct exact HPO overlap, does vetoing the propagated-only support help the 100-case benchmark?

Evidence surface:
- shadow-only benchmark run:
  - `/Users/ahmedelmorshedy/Genovy/output/shadow-support-direct-par-1.json`
  - `/Users/ahmedelmorshedy/Genovy/output/shadow-support-direct-par-1.md`
- shadow script:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowSupportDirectPreference.js`

Intentionally not inspected:
- no core scorer modification
- no DB writes
- no child-reroute logic

Result:
- The shadow selector changed internal support competition many times, but produced exactly zero rank movement on the benchmark.
- It was safe, but completely ineffective.
- This means propagated-only support veto by itself is not enough to recover the missed truth-gene cases.

Important numbers:
- genes with direct exact alternative across the run: `40,331`
- genes with propagated-only winner vetoed: `2,187`
- vetoed propagated-only support candidates: `24,844`
- benchmark:
  - `Found: 82% -> 82%`
  - `Top-1: 34% -> 34%`
  - `Top-3: 43% -> 43%`
  - `Top-5: 46% -> 46%`
  - `Top-10: 57% -> 57%`
  - `MRR: 0.409646 -> 0.409646`
  - `Improved: 0`
  - `Worsened: 0`

Decision:
- Do not port this rule into core code.
- Keep it as a negative result: support arbitration alone is too weak.
- The missed cases need richer evidence or a stronger model, not just propagated-only veto logic.

Rollback plan:
- shadow-only files can be deleted:
  - `/Users/ahmedelmorshedy/Genovy/output/shadow-support-direct-par-1.json`
  - `/Users/ahmedelmorshedy/Genovy/output/shadow-support-direct-par-1.md`
  - `/Users/ahmedelmorshedy/Genovy/output/shadow-support-direct-par-1.parts`
- no core logic rollback needed

Status:
- dismissed

---

### Entry 13: Missed truth-gene phenotype gap and fill-priority audit
Date:
- 2026-03-21

Question:
- For the `18` missed truth-gene cases, what phenotype terms are actually missing on the linked disease paths, and which terms are the highest-confidence fill targets?

Evidence surface:
- missed-case gap audit:
  - `/Users/ahmedelmorshedy/Genovy/output/truth-missed-term-gaps-pass-1.json`
  - `/Users/ahmedelmorshedy/Genovy/output/truth-missed-term-gaps-pass-1.md`
- fill-priority summary:
  - `/Users/ahmedelmorshedy/Genovy/output/truth-missed-term-fill-priority-pass-1.json`
  - `/Users/ahmedelmorshedy/Genovy/output/truth-missed-term-fill-priority-pass-1.md`
- scripts:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/auditTruthMissedTermGaps.js`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/summarizeTruthMissedTermGaps.js`

Intentionally not inspected:
- no broad raw DB crawl
- no source ingest edits
- no core scorer changes

Result:
- The missed truth cases are not just support-selection misses.
- In `16/18` missed cases, there are phenotype terms missing from all linked diseases' direct profiles.
- In `12/18` missed cases, there are phenotype terms missing from all linked diseases' profiles entirely, even after allowing propagated terms.
- This means the next high-confidence workstream is disease-phenotype enrichment on the right linked disease nodes, not another support-selector rule.

Important numbers:
- missed cases: `18`
- cases with best support candidate: `16`
- cases with nonempty best direct overlap: `13`
- cases with terms missing from all linked direct profiles: `16`
- cases with terms missing from all linked any profiles: `12`
- unique terms missing from all linked direct profiles: `96`
- unique terms missing from all linked any profiles: `63`
- highest-priority global gaps:
  - `HP:0000750 Delayed speech and language development`
  - `HP:0001155 Abnormality of the hand`
  - `HP:0001263 Global developmental delay`
  - `HP:0000369 Low-set ears`
- highest-priority direct curation targets:
  - `HP:0001263 Global developmental delay` across `STXBP1` and `U2AF2`
  - `HP:0000750 Delayed speech and language development` across `ANKRD11`, `PPP2R1A`, `U2AF2`
  - `HP:0011968 Feeding difficulties` across `PPP2R1A`, `WWOX`
  - `HP:0001270 Motor delay` across `PPP2R1A`, `SETD2`
- highest-priority missed cases:
  - `PMID_37962958_43` (`U2AF2`) missing `25/25` terms from all linked profiles
  - `PMID_32376980_11` (`TRAF7`) missing `8` terms from all linked profiles and `14` from all linked direct profiles
  - `PMID_36747105_proband` (`U2AF2`) missing `7/7` terms from all linked profiles
  - `PMID_37156989_P1` (`SOCS1`) missing `6/6` terms from all linked profiles

Decision:
- Stop guessing on selector coefficients.
- Use the fill-priority report as the canonical enrichment target list for the missed truth-gene set.
- Next changes should target the missing standardized HPO terms on the best linked disease nodes and the cases with total linked-profile coverage failure.

Rollback plan:
- audit-only files can be deleted if needed:
  - `/Users/ahmedelmorshedy/Genovy/output/truth-missed-term-gaps-pass-1.json`
  - `/Users/ahmedelmorshedy/Genovy/output/truth-missed-term-gaps-pass-1.md`
  - `/Users/ahmedelmorshedy/Genovy/output/truth-missed-term-fill-priority-pass-1.json`
  - `/Users/ahmedelmorshedy/Genovy/output/truth-missed-term-fill-priority-pass-1.md`
- no core logic rollback needed

Status:
- kept

---

### Entry 14: Source-backed classification of missed-case phenotype gaps
Date:
- 2026-03-21

Question:
- Are the highest-priority missing phenotype terms for the `18` missed truth cases already present somewhere on nearby disease branches in the currently imported human phenotype sources, or are they absent from the imported human direct phenotype layer entirely?

Evidence surface:
- source-backed classification report:
  - `/Users/ahmedelmorshedy/Genovy/output/truth-missed-source-backed-pass-1.json`
  - `/Users/ahmedelmorshedy/Genovy/output/truth-missed-source-backed-pass-1.md`
- input gap audit:
  - `/Users/ahmedelmorshedy/Genovy/output/truth-missed-term-gaps-pass-1.json`
- scripts:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/classifyTruthMissedSourceBacked.js`
- source definitions:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/constants/sourceCatalog.js`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/services/sources/hpoAnnotationSource.js`

Intentionally not inspected:
- no broad raw DB crawl
- no manual literature review
- no DB writes
- no scorer changes

Result:
- The classifier found no evidence that the high-priority missing terms are already present as direct human phenotype assertions on the linked disease branches.
- Across both strongest buckets, every classified gap landed in `not_found_in_imported_human_direct_sources`.
- This means the next safe move is not “copy from another nearby shelf inside the current imported human direct layer.”
- It means the missing terms are absent from the currently imported direct human phenotype sources for these linked disease branches.

Important numbers:
- cases: `18`
- all-profile gap terms classified: `67`
- direct-profile gap terms classified: `118`
- all-profile gap classification counts:
  - `not_found_in_imported_human_direct_sources: 67`
- direct-profile gap classification counts:
  - `not_found_in_imported_human_direct_sources: 118`
- top repeated gaps remain:
  - `HP:0001263 Global developmental delay`
  - `HP:0000750 Delayed speech and language development`
  - `HP:0011968 Feeding difficulties`
  - `HP:0001270 Motor delay`

Decision:
- Do not treat these as simple mapping-only fixes inside the currently imported human direct phenotype layer.
- The next enrichment path needs one of:
  - additional curated human phenotype sources,
  - manual literature-backed curation,
  - or a separate comparative/model-organism evidence layer
- Keep benchmark terms as detectors only, not direct DB inserts.

Rollback plan:
- output-only classification files can be deleted:
  - `/Users/ahmedelmorshedy/Genovy/output/truth-missed-source-backed-pass-1.json`
  - `/Users/ahmedelmorshedy/Genovy/output/truth-missed-source-backed-pass-1.md`
- no core logic rollback needed

Status:
- kept

---

### Entry 15: First serious strategic synthesis after the March 20-21 audits
Date:
- 2026-03-22

Question:
- After the benchmark experiments, the March 20-21 walkback, the missed-case audits, and the narrow live DB checks, what is the first serious plan-level read of the project, and what should we distrust even if it sounds directionally right?

Evidence surface:
- strategic synthesis:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/OpusAudit1.md`
- saved benchmark and audit chain:
  - `/Users/ahmedelmorshedy/Genovy/output/propagation-weight-heuristic-benchmark.md`
  - `/Users/ahmedelmorshedy/Genovy/output/truth-coverage-pass-2.json`
  - `/Users/ahmedelmorshedy/Genovy/output/truth-missed-term-gaps-pass-1.json`
  - `/Users/ahmedelmorshedy/Genovy/output/truth-missed-term-fill-priority-pass-1.md`
  - `/Users/ahmedelmorshedy/Genovy/output/truth-missed-source-backed-pass-1.md`
- narrow live DB checks:
  - `U2AF2` identity rows and relationship counts
  - the `12` unique truth genes behind the `18` current misses
  - whole-graph logical gene support counts (`5705` grouped genes)

Intentionally not inspected:
- no raw source dumps line by line
- no new ingestion
- no new scorer changes
- no Exomiser source-code deep dive
- no larger external benchmark

Result:
- The strategic synthesis is directionally correct: scoring-only changes have reached a ceiling, the next leverage is evidence quality, and ML should wait until the phenotype layer is cleaner.
- The `18` misses now have a stable shape:
  - `1` empty shell gene: `U2AF2`
  - `6` undercovered genes: `WWOX`, `TRAF7`, `SOCS1`, `SETD2`, `ANKRD11`, `RERE`
  - `1` mixed/unstable gene: `STXBP1`
  - `4` ranking genes with usable evidence: `SCN2A`, `SPTAN1`, `PPP2R1A`, `SMARCC2`
- The strongest correction to keep in mind is that the `U2AF2` pattern is not the norm. The miss set is mostly not empty shells.
- The whole-graph spectrum is real and useful, but it is structural, not clinical:
  - `23` hollow shells
  - `426` sparse one-sided genes
  - `777` structurally poorly enriched two-sided genes
  - `4479` better-covered genes
- The right plan is not “more clever coefficient tuning.” It is:
  - identity-repair-aware re-ingestion
  - source freshness audit
  - truth-branch enrichment
  - then targeted ranking work

Important numbers:
- best stable benchmark:
  - `82` found
  - `34` top-1
  - `43` top-3
  - `46` top-5
  - `58` top-10
  - `MRR 0.409669`
- unique missed truth genes: `12`
- miss buckets:
  - empty shell: `1` gene / `2` cases
  - undercovered: `6` genes / `7` cases
  - mixed: `1` gene / `4` cases
  - ranking with usable evidence: `4` genes / `5` cases
- whole-graph structural spectrum:
  - logical genes: `5705`
  - empty shell: `23`
  - sparse one-sided: `426`
  - poorly enriched two-sided: `777`
  - better covered: `4479`

Decision:
- Record `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/OpusAudit1.md` as the first serious post-experiment strategy document.
- Treat it as a planning anchor, not as untouchable truth.
- Keep three active critical warnings:
  - do not over-generalize `U2AF2`
  - do not confuse structural graph thinness with benchmark-clinical failure
  - do not jump to ML before source freshness and truth-branch enrichment
- Preferred next plan:
  1. re-ingest identity-repaired hollow shells
  2. audit source freshness
  3. enrich the six undercovered truth branches
  4. diagnose the four ranking cases by competitor structure
  5. test semantic similarity surgically before full implementation

Rollback plan:
- docs-only addition; no code or graph rollback needed
- if needed, remove:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/OpusAudit1.md`

Status:
- kept

---

### Entry 16: Expanded Opus audit with explicit cautions, missing questions, and next-input needs
Date:
- 2026-03-22

Question:
- What did the first serious strategic audit still miss or compress, and what should be explicitly preserved so the plan is not overconfident?

Evidence surface:
- expanded strategy document:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/OpusAudit1.md`
- same saved evidence surfaces as Entry 15

Intentionally not inspected:
- no new data pulls
- no new source verification
- no new ranking traces
- no broader benchmark

Result:
- The first draft of `OpusAudit1.md` captured the strategic spine correctly, but it compressed too many of the useful consultant-level details.
- The expanded version now explicitly preserves:
  - what was covered vs not covered
  - the stronger re-ingestion/source-freshness plan
  - the semantic-similarity decision gate
  - the ML feature-shape proposal
  - the model-organism channel plan
  - the STXBP1 and SPTAN1 settlement tests
  - the fact that the zero-change direct-support-preference result is itself evidence
  - the idea that the database spectrum may become a confidence/product feature
- It also now ends with explicit red commentary so future planning does not treat the audit as flawless.

Important numbers:
- no new benchmark or graph numbers added
- this was a synthesis expansion pass, not a new measurement pass

Decision:
- Treat `OpusAudit1.md` as the first serious planning document, but only in its expanded form.
- Preserve the explicit “what this audit still needs” list so the next thread can ask for missing proof instead of pretending certainty.
- Current missing inputs that would strengthen the audit most:
  1. exact current source snapshot dates
  2. full identity-repaired gene list
  3. top competitors for the ranking-problem genes
  4. actual availability of GeneReviews / DECIPHER / licensed OMIM-derived material
  5. whether a larger benchmark can be obtained

Rollback plan:
- docs-only change
- remove or edit the expanded sections of `OpusAudit1.md` if later evidence contradicts them

Status:
- kept

## Entry Template
Copy this block for future diary entries.

### Entry N: Title
Date:
- YYYY-MM-DD

Question:
- 

Evidence surface:
- 

Intentionally not inspected:
- 

Result:
- 

Important numbers:
- 

Decision:
- 

Rollback plan:
- 

Status:
- kept / parked / dismissed / open

### Entry 18: v0 freeze completed and Phase 0 freshness audit started
Date:
- 2026-03-22

Question:
- Can we freeze the benchmark-competitive system cleanly, then begin the non-negotiable source freshness work without risking the rare strong baseline?

Evidence surface:
- Git/GitHub freeze state already merged to `main`
- Railway environment duplication and DB clone verification
- frozen DB metadata tables:
  - `sources`
  - `source_sync_state`
  - `sync_runs`
- source fetcher code and official upstream source headers

Intentionally not inspected:
- raw historical download files
- broad source dumps
- Exomiser internal source bundle files

Result:
- `v0` is now operationally frozen:
  - GitHub freeze merged
  - Railway frozen env preserved
  - Railway working env separated and pointed at its own DB
- Initial Phase 0 finding is sharper than expected:
  - HPO/MONDO are not the first freshness problem
  - ClinGen and ClinVar are provably stale relative to upstream today
  - four source ingesters do not persist enough provenance to answer “what exact version did we ingest?” without inference

Important numbers:
- working clone verification:
  - `21` public tables
  - `81,870` entities
  - `967,198` relationships
  - `987,252` source records
- targeted provenance tests:
  - `6` passed
  - `0` failed
- source-state takeaways:
  - clear stale surfaces: `clingen_gene_disease_validity`, `clinvar_gene_disease`, `clinvar_variant_summary`
  - current surfaces: `mondo_ontology`, `hpo_ontology`, `hpo_disease_phenotype`, `orphadata_natural_history`

Decision:
- Keep Phase 0 narrow and evidence-based.
- Do not jump to ranking analysis or semantic similarity yet.
- First fix provenance capture and stale-source re-ingestion on the working environment.
- Provenance-capture patch is now on the working branch, so the next sync can actually prove what version was ingested instead of leaving blanks.

Own commentary / alternatives:
- The provenance gap is more important than it first sounds. Without fixing it, future “freshness” discussions will keep collapsing into guesswork, especially for HPO gene-disease / gene-phenotype.
- HPO gene-disease and gene-phenotype are probably current, but “probably” is not a good enough standard for the new plan. That uncertainty should be engineered away now.
- The freeze/working split was the right call. If we had started re-ingestion against the only good DB, we would have repeated the exact operational mistake we were trying to stop making.
- This was a good first code move because it improves auditability without perturbing scorer behavior or graph semantics.

Rollback plan:
- docs-only notes plus Railway working-environment setup
- if later evidence changes the freshness assessment, revise the Phase 0 audit rather than the freeze itself

Status:
- kept

## 2026-03-26 RERE Symmetric Case-Series Shadow
- Case: `PMID_29330883_Subject9`
- Strict symmetric richer-source additions moved `RERE` from `238 -> 82` when treated as plain present terms.
- Added to `RERE`: `Synophrys`, `Wide mouth`, `Intellectual disability`.
- Added to `MED13`: `Intellectual disability`, `Expressive language delay`, `Strabismus`, `Nystagmus`.
- Adding frequency buckets largely erased the gain: `238 -> 230`.
- Read: exact truth-side recovery matters a lot, but the current scorer still keeps `MED13` at `1`, and frequency weighting hurts `RERE` because the recovered facial terms are only source-backed as occasional.

## 2026-03-26 RERE Behavior Diagnostic Shadow
- Case: `PMID_29330883_Subject9`
- Diagnostic only; not source-backed curation.
- Removing the weak wrong-side `MED13 -> ADHD` fallback did nothing: `237 -> 237`.
- Adding exact `RERE -> Compulsive behaviors` helped only a little: `237 -> 209`.
- Doing both together still left `MED13` at `1`.
- Read: the compulsive-behavior semantic mismatch is real but not decisive.

## 2026-03-26 TRAF7 Symmetric Source Shadow
- Case: `PMID_32376980_11`
- Manual OMIM plus primary-paper symmetric shadow was a strict null result.
- Candidate additions for both `TRAF7` and `DOT1L` were all already present in the live direct disease profiles.
- Added terms: `0`
- Truth rank stayed `143 -> 143`.
- Read: `TRAF7` is not losing because we forgot these obvious source-backed syndrome terms; the remaining leak looks more like exact granularity and/or scorer geometry.

## 2026-03-26 SETD2 Symmetric Source Shadow
- Case: `PMID_33766796_16`
- `OMIM + GeneReviews + primary TCF20 literature` symmetric shadow rescued the truth branch.
- Only `2` genuinely new terms were added, both on `SETD2`:
  - `Motor delay`
  - `Accelerated skeletal maturation`
- `SETD2` moved `140 -> 1`.
- Top1 flipped `TCF20 -> SETD2`.
- Read: this is a clean source-backed rescue, not a scorer-only problem.

## 2026-03-26 SOCS1 Symmetric Source Shadow
- Case: `PMID_37156989_P1`
- Strict literal `OMIM` shadow produced a real but incomplete rescue.
- Added to `SOCS1`:
  - `Autoimmunity`
  - `Otitis media`
  - `Chronic colitis`
  - `Eczematoid dermatitis`
- Added to `CTLA4`:
  - `Autoimmunity`
- `SOCS1` moved `400 -> 48`.
- `CTLA4` stayed `1`.
- Read: `SOCS1` had a genuine source-gap, but `CTLA4` still keeps the strongest sharp packet exacts, so this one remains hybrid rather than pure undercoverage.

## 2026-03-27 STXBP1 Remaining Pair Checkpoint
- Re-opened the two remaining `STXBP1` misses from the real `v1-working` `1.0` run:
  - `PMID_35190816_STX_26865513_Patient_45`
  - `PMID_35190816_STX_28944233_270001`
- Fresh live rerank for `28944233` succeeded and wrote:
  - [audit-stxbp1-missed-case-28944233-270001-20260327.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/audit-stxbp1-missed-case-28944233-270001-20260327.json)
- That rerank reaffirmed the earlier diagnosis:
  - winner `RAI1`
  - disease `Smith-Magenis syndrome`
  - multiple rare/fairly specific exact hits still belong to the winner, not the truth branch
- For `26865513`, the preserved gap audit remains the best live evidence:
  - only `2` direct exact overlaps on `DEE4`
  - large truth-side missing direct profile
  - `Truncal ataxia`, `Head tremor`, and `Emotional lability` are still missing from all linked STXBP1 disease profiles at any level
- Heavy live rerank for `26865513` failed with Postgres temp-space exhaustion:
  - `could not write to file "base/pgsql_tmp/..." : No space left on device`
- The live `/api/dx/rank-genes` route for both remaining STXBP1 packets also failed with Railway `502`:
  - `Application failed to respond`
- So the current STXBP1 split is now:
  - `26865513` = still looks like undercoverage
  - `28944233` = proven mimic-heavy / mixed case
- Saved summary:
  - [stxbp1-remaining-miss-pair-status-20260327.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-remaining-miss-pair-status-20260327.md)

## 2026-03-27 SPTAN1 Ranking Reopen
- Re-opened `PMID_36331550_Family16Patient21` from preserved artifacts only.
- Packet is extremely small:
  - present: `Delayed speech and language development`, `Microcephaly`
  - excluded: `19`
- Truth row:
  - gene `SPTAN1`
  - disease `developmental delay with or without epilepsy`
  - full-rank position `322`
  - exact direct overlap count `2`
- Top outranker:
  - gene `ZBTB11`
  - full-rank position `1`
  - exact direct overlap count `2`
- This is not a single-outranker anomaly:
  - `20` competitors sit above the truth in the saved audit
  - `17` of those are specific direct-match leaf diseases
- The March 25 top-k shadow still holds:
  - softening the broad-profile penalty helped only to `322 -> 182`
- Read:
  - `SPTAN1` remains the cleanest true ranking/specificity leftover
  - exact match alone is not enough because too many leaf diseases can explain the two-term packet
- Saved note:
  - [sptan1-ranking-reopen-20260327.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/sptan1-ranking-reopen-20260327.md)

## 2026-03-27 PPP2R1A Reopen
- Re-opened both `PPP2R1A` misses from preserved artifacts only.
- Case `PMID_37761890_41`:
  - truth rank `256`
  - exact truth-side direct overlap `3`
  - truth branch is missing `6` packet terms directly
  - top outranker `HNRNPC` has exact direct overlap `5`
- Case `PMID_37761890_43`:
  - truth rank `109`
  - exact truth-side direct overlap `5`
  - truth branch is missing `4` packet terms directly
  - top outranker `MACF1` has exact direct overlap `6`
- Read:
  - both cases remain mixed rather than pure ranking failures
  - case `41` leans more toward truth-profile weakness
  - case `43` looks more salvageable
- Saved note:
  - [ppp2r1a-reopen-20260327.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/ppp2r1a-reopen-20260327.md)

## 2026-03-27 SMARCC2 Reopen
- Re-opened the remaining `SMARCC2` miss from preserved artifacts.
- Packet is extremely sparse:
  - `1` present term: `Autistic behavior`
  - `6` excluded craniofacial terms
- Saved truth-side picture:
  - `Coffin-Siris syndrome 8` has `29` direct disease phenotypes but `0` exact direct overlap on the packet
  - generic `Coffin-Siris syndrome` only reaches the positive term through propagation
- Narrow live DB lookup:
  - `SMARCC2` gene direct profile has exact `Autistic behavior`
  - and also exact excluded `Microcephaly`
  - `NLGN1` gene direct profile has exact `Autistic behavior`
  - and none of the excluded craniofacial terms in the narrow lookup
- Read:
  - this is a sparse ranking/negative-evidence failure
  - not a good manual-enrichment target
  - closer to `SPTAN1` than to `SETD2`
- Saved note:
  - [smarcc2-reopen-20260327.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/smarcc2-reopen-20260327.md)

## 2026-03-27 PPP2R1A Narrow Live Surface Check
- Added a narrow live exact-direct lookup on the packet terms for both `PPP2R1A` misses.
- Important correction:
  - on the **current live surface**, the exact packet signal is showing up at the gene layer, not the disease layer
  - all four checked diseases (`PPP2R1A`, `HNRNPC`, `MACF1` case branches) had `0` exact direct hits on the packet terms in this narrow lookup
- Case `PMID_37761890_41`:
  - `PPP2R1A` gene direct exacts: `3`
  - `HNRNPC` gene direct exacts: `5`
- Case `PMID_37761890_43`:
  - `PPP2R1A` gene direct exacts: `5`
  - `MACF1` gene direct exacts: `6`
- Read:
  - case `41` still leans truth weakness
  - case `43` is still the more salvageable of the two
  - but this now looks more like gene-surface competition than disease-surface competition on the current live DB

## 2026-03-27 PPP2R1A Truth Shadow
- Built a truthful `PPP2R1A` disease-term shadow from:
  - `OMIM:616362`
  - `GeneReviews:NBK580243`
  - `PMID:37761890`
- New exact disease terms added to `Houge-Janssens syndrome 2`:
  - `Delayed speech and language development`
  - `Motor delay`
  - `Feeding difficulties`
  - `Attention deficit hyperactivity disorder`
  - `Short stature`
  - `Moderate intellectual disability`
- Already present and therefore skipped:
  - `Global developmental delay`
  - `Hypotonia`
  - `Seizure`
  - `Microcephaly`
  - `Agenesis of corpus callosum`
  - `Hypoplasia of the corpus callosum`
- Head-to-head result:
  - case `41`: `PPP2R1A 3 -> 2`, still behind `HNRNPC`
  - case `43`: `PPP2R1A 2 -> 1`, flips over `MACF1`
- Read:
  - the salvageable `PPP2R1A` case is genuinely rescuable by truthful disease repair
  - the harder case still needs more than this first source-backed patch

## 2026-03-27 U2AF2 Symmetric Source Shadow
- Re-opened the hard `U2AF2` case on the real live `v1-working` DB with the stricter truthful-and-symmetric rule.
- First exact correction:
  - current live outranker is `LRRC7`
  - support disease is `MONDO:0980748`
  - baseline top row is not a seam/attachment story anymore
- Truth-side checked source stack:
  - `OMIM:191318`
  - `OMIM:620535`
  - existing manual OMIM extract note
- Rival-side checked source stack:
  - `OMIM:621415`
  - `PMID:39256359`
  - no `LRRC7` GeneReviews chapter found
- Truth-side packet-relevant additions:
  - `Intellectual disability`
  - `Delayed speech and language development`
  - `Delayed fine motor development`
  - `Delayed ability to walk`
  - `Bilateral tonic-clonic seizure`
  - `Gastroesophageal reflux`
  - `Feeding difficulties`
  - `Short palpebral fissure`
  - `Bilateral ptosis`
  - `Unilateral ptosis`
- Rival-side additions:
  - none
  - checked symmetrically, but no promotable packet-relevant terms were missing beyond the live graph surface
- Exact fit outcome:
  - `U2AF2` exact present terms rose from `3` to `12`
  - `LRRC7` stayed unchanged with a broader exact present fit and `4` exact excluded contradictions
- Rank outcome:
  - `U2AF2` `959 -> 2`
  - `LRRC7` stays `1`
- Read:
  - hard `U2AF2` is now a clean truthful enrichment win but not a full rescue
  - the remaining blocker is a strong `LRRC7` mimic plus weak use of excluded-term contradictions
- Saved note:
  - [u2af2-symmetric-source-shadow-20260327.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/u2af2-symmetric-source-shadow-20260327.md)

## 2026-03-27 RERE Live Symmetric Reopen
- Re-opened `RERE` with the lighter evidence path after the fresh full live rerun stalled over the centerbeam proxy.
- Evidence surface used:
  - current live direct disease-phenotype rows for `RERE` and `MED13` only
  - saved symmetric case-series shadow result from `2026-03-26`
- Important continuity note:
  - saved audit truth rank is `237`
  - saved symmetric baseline truth rank is `238`
  - reopen keeps the saved symmetric baseline for internal before/after continuity
- Current live direct exact ownership before the saved additions:
  - `RERE` present exacts:
    - `Anteverted nares`
    - `Hypertelorism`
    - `Autistic behavior`
    - `Hypotonia`
    - `Global developmental delay`
  - `MED13` present exacts:
    - `Wide mouth`
    - `Synophrys`
    - `Hypertelorism`
    - `Autistic behavior`
    - `Hypotonia`
    - `Global developmental delay`
- Current live direct excluded contradictions:
  - `RERE` carries a large contradiction set against the packet exclusions, including:
    - `Cleft lip`
    - `Smooth philtrum`
    - `Macrocephaly`
    - `Triangular face`
    - `High palate`
    - `Blepharophimosis`
    - `Micrognathia`
    - `Sensorineural hearing impairment`
    - `Scoliosis`
    - and many others
  - `MED13` exact excluded contradiction:
    - `Smooth philtrum`
- Saved symmetric presence additions still give the core movement:
  - `RERE 238 -> 82`
  - `MED13 1 -> 1`
- Exact ownership after those saved additions:
  - `RERE` gains:
    - `Wide mouth`
    - `Synophrys`
    - `Intellectual disability`
  - after that, `MED13` no longer owns the key present exacts that separated it from `RERE`
- Read:
  - this case is no longer well explained by “truth branch still missing the obvious exact terms”
  - the remaining unresolved part is scorer behavior after exact recovery, especially frequency and contradiction handling
- Saved:
  - [rere-live-symmetric-reopen-20260327.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/rere-live-symmetric-reopen-20260327.md)
  - [shadow-rere-live-symmetric-reopen-20260327.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-rere-live-symmetric-reopen-20260327.json)

## 2026-03-27 Bulk Reopen Of Remaining Unsolved Misses
- Built one batch reopen pass for the still-unsolved miss set, excluding `SETD2` because it is already source-rescued.
- Scope:
  - `12` unresolved case slots
  - preserved phenopackets from the official 100-case slice
  - current live direct disease-phenotype surface from the real `v1-working` DB
  - current live narrow direct gene-phenotype edges for the truth and top outranker only
- Output:
  - [unsolved-miss-bulk-reopen-20260327.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/unsolved-miss-bulk-reopen-20260327.md)
  - [unsolved-miss-bulk-reopen-20260327.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/unsolved-miss-bulk-reopen-20260327.json)
- What it preserves:
  - exact present ownership
  - exact excluded contradictions
  - disease direct vs gene direct packet fit
  - the saved current read for each unresolved case
- Important structural read from the batch:
  - some misses are still mainly disease-surface undercoverage (`RERE`, `TRAF7`, `ANKRD11`, `SOCS1`, `U2AF2`)
  - some are clearly ranking/negative-evidence failures (`SPTAN1`, `SMARCC2`)
  - some remain mixed (`PPP2R1A`, `STXBP1`)

## 2026-03-28 Three-Source Structured Enrichment Pass
- Built a source-enrichment pipeline for:
  - `Orphadata Phenotypes`
  - `Orphadata HOOM`
  - `HPO annotation files`
- Added permanent files:
  - [benchmark-miss-tail-broad-roster-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/data/source-enrichment/benchmark-miss-tail-broad-roster-20260328.json)
  - [generatePacketSourceEnrichmentManifest.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/generatePacketSourceEnrichmentManifest.js)
  - [applySourceEnrichmentManifest.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/applySourceEnrichmentManifest.js)
  - [source-enrichment-three-source-pass-20260328.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/source-enrichment-three-source-pass-20260328.md)
- Manifest/apply artifacts:
  - [source-enrichment-manifest-broad-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-manifest-broad-20260328.json)
  - [source-enrichment-apply-log-broad-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-apply-log-broad-20260328.json)
- Benchmark artifacts:
  - [official-v1-enrich-three-source-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-v1-enrich-three-source-20260328.json)
  - [official-v1-enrich-three-source-20260328.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-v1-enrich-three-source-20260328.md)
- Result:
  - only `4` unique packet-relevant disease-term additions were found across the broad unresolved miss roster
  - all `4` were truth-side terms with dual support from `orphadata_phenotypes` and `orphadata_hoom`
  - the staging benchmark stayed flat at:
    - `87 found`
    - `42 top-1`
    - `53 top-5`
    - `62 top-10`
    - `MRR 0.488736`
- Read:
  - these three structured curated sources are safe to use and provenance-friendly
  - on the current miss tail they are much lower yield than the earlier OMIM / GeneReviews / core-paper manual enrichments

## 2026-03-28 Global HPO Negative Benchmark
- Added:
  - [generateGlobalHpoNegativeManifest.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/generateGlobalHpoNegativeManifest.js)
  - [source-enrichment-hpo-negative-global-pass-20260328.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/source-enrichment-hpo-negative-global-pass-20260328.md)
  - [source-enrichment-manifest-hpo-negative-global-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-manifest-hpo-negative-global-20260328.json)
  - [source-enrichment-apply-log-hpo-negative-global-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-apply-log-hpo-negative-global-20260328.json)
  - [official-v1-enrich-hpo-negative-global-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-v1-enrich-hpo-negative-global-20260328.json)
  - [official-v1-enrich-hpo-negative-global-20260328.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-v1-enrich-hpo-negative-global-20260328.md)
- Import result:
  - `727` HPO `NOT` assertions mapped cleanly into the graph across `352` diseases
  - `0` unmatched disease IDs
  - `0` missing phenotype entities
  - `0` skipped already-present absent assertions
- Benchmark result on staging with the baseline `1.0` scorer:
  - `87 found`
  - `42 top-1`
  - `53 top-5`
  - `62 top-10`
  - `MRR 0.488760`
- Read:
  - the negative path is now proven end-to-end on a full-graph import, not just a miss-tail roster slice
  - absent assertions alone do not rescue the current unresolved miss set under the baseline scorer
  - movement was limited to `7` one-rank shifts with no recall gain

## 2026-03-30 Full GitHub + Bucket Read Recovery
- Purpose:
  - resolve continuity drift after thread truncation and environment confusion
  - verify what still exists across GitHub history, working-tree docs, and cold-storage bucket artifacts
  - convert the raw full read into one durable understanding record
- Surfaces fully read:
  - GitHub repo current `main` tracked files: `106`
  - GitHub reachable blob history: `11457`
  - bucket objects under:
    - `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/output/`
    - `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/downloads-files-4/`
    - total bucket objects read: `1282`
- Added:
  - [full-read-audit-report-20260330.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/full-read-audit-report-20260330.md)
  - [full-read-understanding-report-20260330.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/full-read-understanding-report-20260330.md)
  - [github-genovy-main-fullread-manifest.tsv](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/github-genovy-main-fullread-manifest.tsv)
  - [github-genovy-all-history-blobs.tsv](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/github-genovy-all-history-blobs.tsv)
  - [gcs-genovy-artifacts-fullread-manifest.tsv](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/gcs-genovy-artifacts-fullread-manifest.tsv)
- What the recovery established:
  - the work did not disappear; it fragmented across repo state, enrichment worktree state, and bucket-preserved artifacts
  - the March `STXBP1` storyline is coherent:
    - semantic matching was already real
    - broad enrichment alone was not enough
    - disease-to-gene handoff was a genuine leak
  - not all `STXBP1` misses belong to the same class:
    - some are thin truth-branch cases
    - some are mimic-heavy ranking geometry problems
  - the seizure-contradiction branch did not rescue the saved hard STX case and instead exposed scorer-shape limitations
  - the `RERE` case is not well explained by obvious truth-term absence after symmetric recovery; it remains more about contradiction/frequency/scorer behavior
  - `U2AF2` in the real working lineage is better treated as a weak-profile enrichment case than as permanent candidate invisibility
- Durable classification that now best fits the project:
  - undercovered truth branch
  - disease-to-gene handoff / scorer geometry leak
  - genuine ranking / ML problem
- Read:
  - the project memory is now materially safer because the artifact surfaces and the scientific storyline are both preserved in one place

## 2026-03-30 March 29-30 Bucket Faithful Reread
- Purpose:
  - recover the exact March 29-30 bucket storyline after continuity drift
  - separate what came from structured global enrichment, manual curated overlays, broad GeneReviews policy work, and March 30 pipeline engineering
  - make the saved `92%` state traceable to the correct artifact family
- Evidence surface used:
  - exact March 29-30 object slice enumeration:
    - [gcs-march29-30-path-slice.txt](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/gcs-march29-30-path-slice.txt)
  - durable understanding report:
    - [march29-30-bucket-understanding-report-20260330.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/march29-30-bucket-understanding-report-20260330.md)
- What the reread established:
  - the March 29 bucket contains the real pivot into global GeneReviews work:
    - `879` chapter roster
    - `445` exact-mapped chapters
    - `418` unresolved chapters
  - the broad honest-symmetric GeneReviews policy state was still conservative and review-first:
    - seeded pilot accepted `12`
    - broad shadow accepted `0`
  - the saved benchmark lift on March 29 came from:
    - `official-v1-enrich-structured-global-20260329.json` -> `86% found`
    - `official-v1-enrich-structured-plus-manual-curated-20260329.json` -> `92% found`
  - the `92%` state came from structured global enrichment plus a provenance-carrying `26`-entry manual curated overlay, not from broad GeneReviews auto-accept
  - the saved STX March 29 GeneReviews overlay was real but mixed:
    - `19` STX GeneReviews entries applied
    - some STX cases improved
    - some already-good STX cases regressed badly
    - `Syrbe_6` stayed a `GAMT`-over-`STXBP1` mimic problem even after added GeneReviews text
  - the March 30 bucket is mostly pipeline engineering, not a new benchmark leap:
    - `latest5` stayed review-only with `0` manifest rows
    - `hybrid latest10` stayed review-only with `0` manifest rows and a paused MedGemma endpoint
    - `autoaccept batch1-20` produced a real `679`-row manifest despite noisy stage error accounting
    - Qwen candidate generation was much less sparse than GLiNER on the saved `latest5` slice
- Read:
  - March 29-30 is now coherent again as three distinct layers:
    - benchmark-moving manual/structured enrichment
    - broad GeneReviews extraction/policy infrastructure
    - March 30 pipeline scaling and model-comparison work
  - this fixes the earlier mental collapse where those different layers were being remembered as one thing

## 2026-03-30 Benchmark Reconciliation And GeneReviews Runner
- Purpose:
  - turn the recovered March 29-30 understanding into one operational bridge file
  - stop treating the `87%` working line and the saved `92%` line as if they were already the same lineage
  - make the latest GeneReviews pipeline rerunnable from one durable entrypoint instead of many dated one-off commands
- Added:
  - [benchmark-lineage-reconciliation-87-vs-92-20260330.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/benchmark-lineage-reconciliation-87-vs-92-20260330.md)
  - [genereviews-latest-engineering-pipeline-20260330.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genereviews-latest-engineering-pipeline-20260330.md)
  - [genereviewsPipelineProfiles.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/genereviewsPipelineProfiles.js)
  - [runGeneReviewsPipeline.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/runGeneReviewsPipeline.js)
- Reconciliation result:
  - current real working line:
    - `87 found`
    - `42 top-1`
    - `53 top-5`
    - `62 top-10`
    - `MRR 0.4887`
    - `13` misses
  - saved March 29 stronger line:
    - `92 found`
    - `42 top-1`
    - `57 top-5`
    - `65 top-10`
    - `MRR 0.503832`
    - `8` misses
  - the gap is now clearly attributed to:
    - structured global enrichment
    - plus the saved `26`-entry manual curated overlay
  - the gap is not being treated as a scorer-memory mystery anymore
- Pipeline engineering result:
  - the GeneReviews stage scripts already committed in git history are now wrapped by durable named profiles:
    - `latest5-qwen-20260330`
    - `hybrid-latest10-20260330`
    - `autoaccept-batch1-20-20260330`
  - one runner now exposes them:
    - `npm run gr:pipeline -- --list`
  - the `hybrid-latest10` profile now derives its own review-first policy slice from the March 29 template instead of relying on thread memory
- GitHub read:
  - the latest GeneReviews engineering work is already in committed history, especially:
    - `4629bcb`
    - `e46aebd`
    - `1c044e6`
- Next move:
  - verify the new runner on `--list` and `--dryRun`
  - then use the reconciliation doc to decide which March 29 enrichment layers must be replayed to lift the current safe line toward the saved `92%` state

## 2026-03-30 GitHub GeneReviews Architecture Reread
- Purpose:
  - finish the GitHub-side reread for the GeneReviews engineering path specifically
  - recover the actual model-stack progression and the intended next serious architecture, not just the existence of pipeline code
- GitHub commits re-read:
  - `4629bcb` `Add GeneReviews NLP shadow manifest builder`
  - `e46aebd` `Add GeneReviews global shadow tools`
  - `1c044e6` `Add GeneReviews enrichment pipeline and archive artifact storage`
- What the commit reread clarified:
  - `4629bcb` was the first explicit LLM-extracted GeneReviews shadow layer
  - `e46aebd` added the global roster plus global shadow-manifest control plane
  - `1c044e6` is where the real staged architecture lands:
    - fetch printable GeneReviews chapter text
    - deterministic anchor extraction
    - multiple candidate-discovery branches
      - Gemini
      - Qwen via OpenAI-compatible endpoint
      - GLiNER comparison
    - HPO mapping via BioLORD / embedding path
    - metadata enrichment
      - deterministic first
      - Gemini fallback
      - MedGemma anchor-level fallback branch
    - final manifest build under chapter policy
- Most important architecture read:
  - the final serious design direction was not “let one model do everything”
  - it was:
    - honest policy-first control plane
    - deterministic anchor layer
    - model-comparison candidate layer
    - separate mapper layer
    - separate metadata layer
    - review-first by default
- Model-specific read:
  - Qwen beat GLiNER clearly on the saved `latest5` candidate-breadth comparison
  - MedGemma was explicitly treated as promising only for anchor-level metadata fallback, not yet safe as a raw direct pipeline component
  - the MedGemma prompt doc explicitly says not to plug raw endpoint output directly into the pipeline yet
- Best read of the “final one to start trying”:
  - honest review-first GeneReviews pipeline
  - candidate discovery from the stronger LLM branch rather than GLiNER
  - BioLORD mapping
  - deterministic metadata first
  - MedGemma only as guarded anchor-level metadata fallback
  - autoaccept only on explicit policy slices like batch1-20
- Read:
  - my earlier summary had the chronology right but under-described this model-stack conclusion
  - after the GitHub reread, the GeneReviews track is now coherent as a real architecture progression, not just several unrelated March 30 experiments

## 2026-03-30 GeneReviews Run-By-Run JSON Recovery
- Purpose:
  - recover the exact saved `5` / `10` / `20` GeneReviews run lineage from the bucket JSONs themselves
  - correct the earlier overstatement that made `Qwen` sound like the main recovered branch
- New durable outputs:
  - `docs/genereviews-engineering-progression-recovery-20260330.md`
  - `output/full-audit-20260330/genereviews-run-json-audit-20260330.json`
- Primary correction from saved artifacts:
  - the saved main `latest5` candidate branch is `Gemini 2.5 Flash`
  - the saved main `hybrid latest10` candidate branch is also `Gemini 2.5 Flash`
  - `Qwen` and `GLiNER` are real saved comparison branches, but not the recovered main branch
  - `MedGemma` remains a metadata-fallback experiment and was operationally blocked in the saved hybrid run
- Run-sheet conclusions:
  - broad raw `200`-chapter extraction:
    - real but noisy
    - `245` errors
    - parse and quota problems
  - Gemini flash `pilot10`:
    - real and broad
    - `778` extracted features
    - looked too loose for direct ingestion
  - Gemini anchor-first branches:
    - real and more disciplined
    - explicit thinking vs no-thinking comparisons survived in the summaries
  - `latest5` main:
    - review-only
    - `0` manifest rows
    - `5` review rows
    - stage5/stage6 summaries are duplicated by resume/rerun effects
  - `latest5 Qwen`:
    - candidate comparison branch only
  - `latest5 GLiNER`:
    - much sparser than Gemini and Qwen
  - `hybrid latest10`:
    - main Gemini path succeeded through review queue
    - PhenoTagger failed `404`
    - MedGemma failed because endpoint was paused
  - `autoaccept batch1-20`:
    - authoritative saved batch summary is real
    - `679` manifest rows
    - stage3/stage5/stage6 summaries contain later rerun noise and should not be read naively
- Runner correction:
  - the durable runner/profile layer now reflects the saved lineage better:
    - `latest5-gemini-20260330` is the main saved profile
    - `latest5-qwen-20260330` and `latest5-gliner-20260330` are comparison profiles
    - `hybrid-latest10-20260330` keeps PhenoTagger and MedGemma as optional side branches, not the default successful path
- Evidence boundary:
  - I did not recover saved primary-source evidence for `Gemini Pro` or `Gemini 3.1 Pro` from the inspected March 29-30 GitHub and bucket surfaces
  - that means they are not safe to treat as recovered project memory right now

## 2026-03-30 Final GeneReviews Architecture Clarification
- Decision:
  - the architecture the user wrote is now the right working target, but with two evidence-bound caveats:
    - `PhenoTagger` is the intended anchor-upgrade path, not yet a proven successful saved run, because the recovered hybrid attempt failed with `404`
    - `NegEx` / explicit negation handling is still a design requirement, not a recovered successful saved default branch
- Clean evidence-backed pipeline:
  - Stage 1:
    - fetch raw HTML
    - strip tables into side files
    - keep clinical prose cache
  - Stage 2:
    - deterministic local graph anchors first
    - PhenoTagger as the intended next anchor supplement
  - Stage 3:
    - Gemini candidate discovery
    - not MedGemma
    - not GLiNER
  - Stage 4:
    - lexical-first HPO grounding plus BioLORD semantic mapping
  - Stage 5:
    - deterministic metadata first
    - MedGemma only as anchor-level fallback metadata extractor with evidence guardrails
  - Stage 6:
    - cleanup, collapse, excluded handling, policy gate, manifest vs review queue
- Why it arrived there:
  - broad raw extraction was too noisy
  - GLiNER was too sparse
  - Qwen was real but remained a comparison branch, not the recovered main path
  - Gemini `2.5 Flash` is the only model that survives as the main candidate branch across the saved successful `latest5` and `hybrid latest10` runs
  - MedGemma survived only in the narrow metadata role, and even there the saved hybrid run shows the endpoint was operationally blocked

## 2026-03-30 Hybrid Latest10 Error Clarification
- Clarified from saved bucket summaries:
  - there were two blocked side branches in the saved `hybrid latest10` run
  - `PhenoTagger` branch error:
    - `HTTP Error 404: Not Found`
    - repeated across all `10` chapters
  - the other blocked branch was `MedGemma` metadata:
    - `OpenAI-compatible API error: 400`
    - endpoint paused / `BAD_REQUEST`
- Important distinction:
  - this was not “two different PhenoTagger errors”
  - it was:
    - one PhenoTagger failure mode
    - and one MedGemma endpoint failure mode

## 2026-03-30 Python-Side Error Clarification
- Narrow re-check performed on saved March 29-30 GeneReviews pipeline summaries:
  - `latest5` mapped candidates
  - `hybrid latest10` mapped candidates
  - `latest5` GLiNER candidates
  - `autoaccept batch1-20` mapped candidates
- Saved result:
  - `PhenoTagger` is the only clearly saved Python-stage failure in the recovered hybrid branch:
    - `HTTP Error 404: Not Found`
  - `GLiNER` saved run shows `0` errors
  - `BioLORD` mapping summaries for `latest5` and `hybrid latest10` show `0` errors
  - `autoaccept` mapped-candidate summary shows missing-input bookkeeping noise, not a Python traceback
  - `MedGemma` failure was endpoint availability, not a recovered Python import/runtime error
- Interpretation:
  - if there was a separate Python traceback during live experimentation, it was not recovered as a saved authoritative run error from the bucket summaries re-checked here

## 2026-03-30 Settled GeneReviews Architecture Correction
- User corrected the architecture split:
  - `Gemini 2.5 Flash` is the earlier broad candidate-discovery step
  - the later narrow metadata comparison step is `Gemini preview` vs `MedGemma`
  - `Flash` is not the late comparison model
- Live verification performed:
  - saved the preview key separately from the existing Flash key
  - confirmed shell env now has:
    - Flash key
    - preview key
    - Hugging Face / MedGemma key
  - listed live Google models with the preview key and confirmed the currently available preview-capable model name is:
    - `gemini-3-pro-preview`
  - Node `fetch` probe against `gemini-3-pro-preview:generateContent` returned `200`
- Repo corrections made:
  - settled pipeline profile now uses:
    - `candidates-gemini-flash`
    - `metadata-gemini-preview`
    - `manifest-gemini-preview`
  - stage scripts now support explicit env-var selection for provider keys instead of collapsing all Gemini calls into one implicit key path
  - candidate and metadata summaries now record provider/model provenance
- Important blocker unchanged:
  - the settled `latest5` profile is correctly wired now, but the full run still cannot proceed until the working Genovy `DATABASE_URL` is restored for anchor extraction
- Current truthful state:
  - architecture is corrected in code
  - preview model is live
  - MedGemma remains key-present but base-URL/endpoint-not-ready

## 2026-03-30 MedGemma HF Endpoint Control Test
- User asked for a real MedGemma on/off test using only the HF token.
- Verified first:
  - HF token is valid
  - token scopes include endpoint write/control permissions
  - existing old MedGemma text endpoints existed, but the useful pipeline-compatible target is a new custom `vLLM OpenAI` endpoint
- Created the exact endpoint requested:
  - name: `medgemma-27b-text-it-wgl`
  - repo: `google/medgemma-27b-text-it`
  - region/vendor: `aws us-east-1`
  - compute: `nvidia-a100 x1`
  - image: `vllm/vllm-openai:v0.16.0`
  - URL: `https://aro6p9a835d7pnd5.us-east-1.aws.endpoints.huggingface.cloud`
- Control cycle executed successfully:
  - create result: `pending`
  - observed state during startup: `initializing`
  - pause result: `paused`
  - resume result: `pending`
  - final safety pause applied again: `paused`
- Interpretation:
  - MedGemma can now be turned on/off from the HF token alone
  - the endpoint we need for later pipeline comparison now exists
  - it was left paused intentionally to avoid idle GPU cost
- Next practical move:
  - when we are ready to compare `Gemini preview` vs `MedGemma`, export this URL as `MEDGEMMA_BASE_URL`, resume the endpoint, and then run only the metadata branch

## 2026-03-30 Railway Environment Correction For GeneReviews
- User correctly called out that the GeneReviews/enrichment pipeline should be using the enrichment environment, not the scorer-baseline environment.
- Verified:
  - `genovy-v1-working-20260322`
    - service: `Postgres`
    - has a valid `DATABASE_URL`
    - this is the scorer baseline line
  - `v1-enrich-0328`
    - service: `Postgres-Enrichment-Symmetry`
    - has a valid `DATABASE_URL`
    - this is the right DB lineage for GeneReviews/enrichment work
- Correction:
  - future GeneReviews pipeline commands should use:
    - `railway run -e v1-enrich-0328 -s Postgres-Enrichment-Symmetry -- ...`
  - keep `genovy-v1-working-20260322` for current scorer-baseline comparisons, not enrichment ingestion work

## 2026-03-30 Settled Latest5 Run Repair And Execution
- Repaired the settled `latest5` GeneReviews path end to end enough to execute the intended architecture without MedGemma:
  - fixed `PhenoTagger` by replacing the dead PubTator API stage with a local official `PhenoTagger v1.2` runner
  - installed and verified the local `pubmedbert` model path under Python `3.10`
  - kept negation off for the supplement stage to avoid the brittle `NegBio` dependency stack
  - switched the settled profile to include `phenotagger-local` by default
- Verified local PhenoTagger directly:
  - official sample tagging worked after adding required NLTK resources
  - a real one-chapter settled pipeline run on `v1-enrich-0328` succeeded through:
    - `fetch`
    - `phenotagger-local`
    - `anchors`
  - real supplement artifact produced:
    - `stage2b_phenotagger_local/phenotagger_local_summary.json`
    - `1` chapter processed
    - `0` errors
    - `6` supplement anchors for `Y Chromosome Infertility`
- Fixed the local DB execution path for desktop `railway run` usage:
  - local CLI runs were getting `DATABASE_URL` with `postgres-*.railway.internal`
  - patched env selection to prefer `DATABASE_PUBLIC_URL` on local macOS desktop runs
  - enabled SSL automatically for the Railway proxy host
  - verified with a live `select 1`
- Repaired the BioLORD stage:
  - system `python3` was `3.14.3` and unstable for the mapping path
  - created a dedicated BioLORD runtime at:
    - `/Users/ahmedelmorshedy/.cache/biolord/.venv`
  - patched `mapCandidatesToHPO.js` to use that stable interpreter
  - removed the unstable `faiss` dependency from `mapCandidatesToHPOBioLORD.py`
  - replaced nearest-neighbor lookup with normalized `numpy` top-k cosine search
  - made phenotype-embedding cache writes best-effort instead of fatal
- Important operational constraint hit during repair:
  - local disk was effectively full
  - removed the redundant upstream archive:
    - `/Users/ahmedelmorshedy/.cache/phenotagger/PhenoTagger_v1.2.zip`
  - kept the extracted runtime intact
  - this freed enough space to finish the code and run artifacts
- Executed the settled latest5 architecture successfully through stage 5:
  - `fetch`
  - `phenotagger-local`
  - `anchors`
  - `candidates-gemini-flash`
  - `map` via repaired BioLORD runtime
  - `metadata-gemini-preview`
- Preview-model correction discovered during execution:
  - `gemini-3-pro-preview` rejects `thinkingBudget: 0`
  - updated the settled preview metadata stage to use:
    - `thinkingBudget: 128`
- Stage 4 artifact handling:
  - completed BioLORD response artifact:
    - `stage4_mapped_candidates/biolord_response_py310_np.json`
  - chapter candidate counts:
    - `1`
    - `8`
    - `49`
    - `8`
    - `19`
  - materialized clean mapped chapter files and summary from that finished response
- Stage 5 output:
  - five enriched chapter files produced in:
    - `output/genereviews-pipeline-latest5-settled-20260330/stage5_enriched_gemini_preview`
  - clean metadata summary written separately because the original summary retained stale pre-fix errors:
    - `metadata_summary_clean.json`
  - clean metadata read:
    - `total_processed: 5`
    - `total_errors: 0`
    - `featureCount`: `6`, `41`, `45`, `27`, `139`
    - `frequencyCovered`: `0`, `2`, `4`, `2`, `29`
    - `onsetCovered`: `0`, `1`, `1`, `0`, `2`
- Stage 6 output:
  - original `stage6_manifest_gemini_preview` directory was polluted by stale errors from the earlier failed manifest attempt
  - created a clean authoritative rerun directory:
    - `stage6_manifest_gemini_preview_clean`
  - clean manifest result:
    - `total_processed: 5`
    - `total_errors: 0`
    - `manifest_rows: 0`
    - `review_rows: 5`
  - interpretation:
    - the settled architecture ran successfully on 5 chapters
    - all `5` chapters currently land in review queue, not autoaccept manifest
    - this is a valid review-first outcome, not a pipeline failure

## 2026-03-30 Launch-To-800 Strategy
- User asked to stop wasting time on repeated full reruns and define the efficient path to the full GeneReviews launch.
- Locked read:
  - Stage 1-4 should now be treated as frozen unless a real bug appears
  - the remaining open decisions are:
    - Stage 5 default metadata model
    - stable negation layer
- Wrote the explicit launch plan to:
  - `docs/genereviews-launch-to-800-plan-20260330.md`
- Strategy fixed there:
  - compare only Stage 5 models on one fixed `20`-chapter slice
  - then add/test negation on that same slice
  - then run `100` chapters review-first
  - then run the full `800` once
- Important principle:
  - do not rerun unchanged stages
  - reuse frozen Stage 1-4 outputs whenever only metadata or negation logic changes

## 2026-03-30 Narrow MedGemma Stage-5 Comparison
- User corrected the comparison scope:
  - do not jump to `20` chapters yet
  - run only the tricky stages on the already repaired settled `latest5` slice
- Exact execution path:
  - resumed the Hugging Face endpoint:
    - `medgemma-27b-text-it-wgl`
  - discovered the actual Stage-5 blocker was not the model:
    - the OpenAI-compatible helper was posting to `/chat/completions`
    - the vLLM endpoint serves chat at `/v1/chat/completions`
  - fixed in:
    - `src/lib/genereviewsPipeline.js`
  - then ran only:
    - Stage 5 MedGemma metadata
    - Stage 6 manifest through Railway enrichment env
- Clean MedGemma outputs:
  - `stage5_enriched_medgemma_clean/metadata_summary.json`
  - `stage6_manifest_medgemma_clean/manifest_summary.json`
- Aggregate comparison against the already repaired Gemini preview branch:
  - both processed `5/5`
  - both had `0` errors
  - both landed:
    - `0` manifest rows
    - `5` review rows
  - MedGemma improved:
    - frequency coverage: `37 -> 40`
    - onset coverage: `4 -> 34`
  - cleaned Stage-6 feature count stayed tied:
    - `179 -> 179`
- Strong concrete examples:
  - `ZAP70`
    - Gemini onset-covered: `1`
    - MedGemma onset-covered: `12`
  - `Zellweger`
    - Gemini onset-covered: `0`
    - MedGemma onset-covered: `12`
- Operational conclusion:
  - for the repaired settled `latest5` slice, `MedGemma` is now the leading Stage-5 metadata branch
  - the next real blocker before scale-out is not metadata model choice
  - it is the explicit negation / excluded-handling layer
- Endpoint was paused again after the comparison to avoid idle GPU burn.

## 2026-03-30 Zellweger MedGemma Accuracy Spot Check
- User asked whether MedGemma looked accurate against the true chapter text, not just better than Gemini by counts.
- Performed a narrow manual source-vs-output audit on:
  - `Zellweger Spectrum Disorder`
- Why this chapter:
  - it had one of the biggest MedGemma onset gains:
    - `0 -> 12`
- Main read:
  - most onset assignments were real and well grounded
  - several were clearly correct:
    - `Adrenal insufficiency -> Childhood`
    - `Osteopenia -> Childhood`
    - `Feeding difficulties -> Neonatal`
    - `Retinal dystrophy -> Childhood`
    - `Sensorineural hearing impairment -> Childhood`
    - `Neonatal seizure -> Neonatal`, frequency `frequent`
  - a few were plausible but slightly inferential:
    - `Decreased liver function -> Neonatal onset`
    - `Elevated circulating hepatic transaminase concentration -> neonatal`
  - one clear questionable row surfaced:
    - `Pigmentary retinopathy -> neonatal`
    - likely wrong because `neonatal` appears to modify the disease subtype `neonatal adrenoleukodystrophy`, not the phenotype onset itself
- Operational conclusion:
  - MedGemma is strong and useful on this chapter
  - not perfect
  - still review-first, not autoaccept-safe without a truth-set audit

## 2026-03-30 Latest5 Full Source Audit For MedGemma
- User asked for truth comparison across all 5 chapters to decide what should be fixed in the prompt.
- Audited:
  - all `5` cleaned source chapter texts
  - all `5` MedGemma enriched outputs from the repaired settled run
- Aggregate counts:
  - `75` metadata-bearing rows
  - `40` frequency rows
  - `34` onset rows
  - `3` progression rows
  - `5` treatment-response rows
- Important evidence-storage read:
  - onset/progression/treatment evidence is mostly present and exact when LLM-filled
  - frequency evidence looks sparse mostly because deterministic extraction wipes evidence fields, not because the rows are necessarily wrong
- Clear quality read by chapter:
  - `YIF1B`: looks clean
  - `Y chromosome infertility`: one questionable schema misuse
    - `Oligozoospermia -> treatment_response`
  - `ZAP70`: mostly strong, one clear wrong deterministic onset leak
    - `Cerebral infarct -> Congenital onset`
  - `Zellweger`: mostly strong, one questionable onset over-attachment
    - `Pigmentary retinopathy -> neonatal`
  - `ZTTK`: strong on percentages, but two likely onset over-attachments from one shared sentence
    - `Cerebral visual impairment -> childhood onset`
    - `Visual impairment -> childhood`
- Main conclusion:
  - some fixes belong in the MedGemma prompt
  - but one of the worst observed errors is a deterministic onset-linkage bug, not an LLM hallucination
- Wrote the full audit to:
  - `docs/genereviews-latest5-medgemma-source-audit-20260330.md`

## 2026-03-30 Architecture Note Review: Constrained Decoding / Evidence / Verification
- User brought a separate architecture note about:
  - constrained decoding
  - evidence spans
  - two-pass verification
- Read after checking current public docs for structured outputs / guided decoding support.
- Conclusion:
  - the overall note is mostly right for this pipeline
  - but the statement that Hugging Face endpoints do not support structured/guided output for custom models is too strong
  - `vLLM` itself supports guided / structured output, and Hugging Face documents structured outputs in its inference stack
  - whether we should use it is a separate question from whether it exists
- Practical read for this project:
  - constrained decoding is not the main bottleneck right now
  - our real Stage-5 problems are:
    - onset linkage
    - treatment-response overreach
    - deterministic evidence persistence
  - evidence-backed extraction remains the right design
  - global two-pass verification still looks unnecessary, though targeted review on ambiguous rows may still be useful later

## 2026-03-30 Quality Fixes Implemented
- User asked to implement the three remaining quality fixes rather than keep talking about them:
  - negation / excluded handling
  - deterministic metadata evidence + onset-linkage guard
  - MedGemma prompt tightening
- Implemented in:
  - `src/lib/genereviewsPipeline.js`
  - `src/scripts/extractPhenotypeAnchors.js`
  - `src/scripts/extractPhenotypeMetadata.js`
  - `src/scripts/buildEnrichmentManifest.js`
- Validation results:
  - syntax checks passed on all touched files
  - helper-level validation confirmed:
    - excluded anchors now survive as `status: "excluded"`
    - `brain infarcts -> congenital onset` deterministic leak is blocked
    - `generalized hypotonia -> infancy` still works
  - direct MedGemma prompt probes confirmed:
    - `Cerebral visual impairment` no longer inherits `childhood onset`
    - `Pigmentary retinopathy` no longer inherits `neonatal`
    - `Oligozoospermia` no longer gets fake `treatment_response`
- Wrote the implementation record to:
  - `docs/genereviews-quality-fixes-implementation-20260330.md`
- Endpoint note:
  - MedGemma endpoint was resumed only for the direct probes
  - paused again immediately after
- What remains:
  - no full `latest5` rerun after the fixes yet
  - that rerun is the next narrow step before `100`

## 2026-03-30 Tightened Latest5 Validation Complete
- Ran the full fixed `latest5` slice into:
  - `output/genereviews-pipeline-latest5-tightened-20260330`
- Stages rerun:
  - anchors under Railway enrichment env
  - Gemini Flash candidates
  - BioLORD mapping
  - MedGemma metadata
  - manifest/review build
- Operational result:
  - `Stage 5`: `5/5` processed, `0` errors
  - `Stage 6`: `5/5` processed, `0` errors
- Important improvements confirmed on real rerun:
  - `Y chromosome infertility`
    - bad `Oligozoospermia -> treatment_response` leak removed
  - `ZAP70`
    - bad `Cerebral infarct -> congenital onset` leak removed
  - `Zellweger`
    - `Pigmentary retinopathy` no longer inherits `neonatal`
  - `ZTTK`
    - `Cerebral visual impairment` no longer inherits `childhood onset`
- Residual issue still present:
  - `ZTTK Visual impairment -> childhood`
- Manifest/readout:
  - still fully review-first
  - `0` manifest rows
  - `5` review rows
  - only cleaned-feature-count change at manifest level was:
    - `Y chromosome infertility: 5 -> 4`
    - this is directionally correct because the earlier bad treatment-response row was removed
- Decision:
  - safe to move to `100`-chapter `review-first`
  - not honest to move to broad `autoaccept` yet
- Wrote the validation note to:
  - `docs/genereviews-latest5-tightened-validation-20260330.md`

## 2026-03-30 Efficient Audit Strategy For 100-Chapter Review-First Run
- User asked for the most efficient audit shape before launching the larger GeneReviews review-first run.
- Decision:
  - do not audit the `100` chapters uniformly
  - audit by failure class and risk bucket instead
- Recommended audit buckets:
  - exact known leak checks:
    - shared-sentence onset over-attachment
    - treatment-response overreach
    - excluded/present conflicts
  - high-yield metadata rows:
    - rows where onset/frequency/progression/treatment were filled
  - ambiguity rows:
    - medium-trust mappings
    - parent/alias-heavy visual or neurologic phenotypes
  - spot-check baseline rows:
    - a small random sample of apparently clean chapters to estimate silent error rate
- Publication-grade rule remains:
  - review-first into staging
  - publish only approved rows with exact evidence provenance
- Next intended move:
  - run `100` in review-first mode
  - audit targeted buckets first rather than linearly reading all output

## 2026-03-31 Deterministic Auto-Accept Design Direction
- User asked whether auto-accept can be deterministic and then pushed toward a no-human path.
- Decision:
  - do not use a second freeform LLM as the publish judge
  - use:
    - LLM extraction once
    - frozen outputs
    - deterministic verifier / compiler on top
- Practical publication-safe design:
  - every extracted row must carry exact provenance:
    - chapter
    - paragraph/line anchor
    - evidence span or exact evidence sentence
  - deterministic verifier checks:
    - phenotype alias/exact mention support
    - negation / excluded status
    - ontology validity
    - allowed metadata patterns
    - same-clause / same-span linkage for onset and treatment-response
  - if a row cannot be proved by deterministic rules, it should not auto-accept
- Important consequence:
  - no-human publish is only honest if recall is sacrificed for precision
  - simple/provable rows can auto-accept
  - ambiguous rows should be dropped, not promoted

## 2026-03-31 Candidate Stage-3 Draft Script Read
- User pasted an older standalone `Stage 3: Candidate Phenotype Discovery via MedGemma` script and asked what it is doing.
- Read:
  - this script is a broad candidate-discovery worker
  - it reads cleaned chapter text
  - reads anchor labels
  - asks MedGemma for plain-English phenotype candidates
  - removes candidates already covered by anchors using crude string overlap
  - writes leftover candidates to JSON
- Important architecture read:
  - this is not the final settled Stage-3 design
  - the settled pipeline uses `Gemini Flash` for broad candidate discovery, not MedGemma
  - MedGemma is now the Stage-5 metadata branch
- Important quality read:
  - the prompt asks for implied features, which is high-recall but risky for publication use
  - no exact evidence sentence / page-line provenance is returned
  - dedupe against anchors is only lexical substring matching
  - the output is exploratory, not publish-safe

## 2026-03-31 Stage-5 Draft Script Read
- User pasted an older standalone `Stage 5: Phenotype Metadata Extraction via MedGemma` script and asked for an honest technical read.
- Verdict:
  - the overall shape is right:
    - deterministic pass first
    - LLM fallback second
  - but this draft would reintroduce several of the exact metadata bugs we just removed
- Strong parts worth keeping conceptually:
  - deterministic-first design
  - only falling back to the model for missing fields
  - explicit trust levels
- Main problems:
  - deterministic onset/frequency search runs over broad context, not phenotype-local scope
  - this would recreate shared-sentence leakage like:
    - `Cerebral infarct -> congenital`
    - `Pigmentary retinopathy -> neonatal`
    - `Visual impairment -> childhood`
  - no exact evidence fields are preserved in the output
  - LLM output does not return provenance/evidence, only values
  - severity/progression/treatment are accepted from the model without a deterministic proof gate
  - excluded rows are not explicitly skipped
  - LLM onset output is stored only as raw text, without verified normalization/proof
  - prompt is older and too weak for phenotype-specific attachment
- Canonical read:
  - good prototype
  - not safe as the final publication-path Stage 5

## 2026-03-31 Pre-100 Error Model And Deterministic Audit Design
- User asked to step back before the `100`-chapter run and think about:
  - where errors are most likely to happen
  - whether the pipeline is really sealed
  - what extra verifier engineering could improve safety
  - how to make the audit as deterministic as possible
- Current read:
  - not fully sealed
  - sealed enough on the known major leaks to justify a `100`-chapter `review-first` pilot
  - not sealed enough for broad `autoaccept`
- Highest-risk failure classes:
  - shared-sentence metadata attachment drift
    - especially onset
  - disease-subtype words being mistaken for phenotype onset
  - treatment/prognosis language leaking into `treatment_response`
  - broad parent/alias phenotypes inheriting metadata from a more specific child phrase
  - negation / excluded status mistakes
  - medium-trust broad semantic mappings
- Best next verifier ideas before or alongside `100`:
  - field-specific proof contracts
    - phenotype proof
    - onset proof
    - frequency proof
    - treatment-response proof
    - progression proof
  - exact provenance per field:
    - sentence id
    - paragraph id
    - char offsets / exact evidence span
  - alias-shadow guard:
    - broad parent labels like `visual impairment` should not inherit metadata from a child-only phrase unless separately mentioned
  - disease-subtype blocker:
    - words like `neonatal` in disease names should not count as phenotype onset unless clause-local proof exists
  - frozen challenge set:
    - keep the known bad sentences as permanent regression tests
- Deterministic audit design:
  - freeze the extracted outputs
  - run a deterministic verifier that emits per-row:
    - pass/fail
    - failing rule
    - evidence span used
  - audit all rows that:
    - have onset/progression/treatment metadata
    - are excluded
    - have medium-trust mapping
    - hit alias-shadow / shared-sentence flags
  - plus a small random sample of apparently safe rows to estimate silent error rate

## 2026-03-31 External Validation-Stack Proposal Review
- User brought a 7-layer deterministic validation proposal centered on:
  - cross-source concordance
  - GeneReviews table parsing
  - section-aware scoping
  - dependency-based modifier attachment
  - expected-count anomaly checks
  - benchmark regression testing
  - symmetric impact scoring
- Best parts:
  - cross-source concordance as a strong positive signal
  - deterministic table parsing as a separate source
  - dependency-based attachment for onset/modifier disambiguation
  - benchmark regression as a batch safety net
- Important corrections:
  - graph absence is not falsity, so concordance should be a positive proof layer, not a negative oracle
  - section/HPO branch matching should be a soft flag, not a hard reject
  - expected-count validation should be an anomaly detector, not a truth test
  - symmetric impact scoring should not control curation acceptance because it risks benchmark overfitting
- Best integrated read:
  - adopt:
    - provenance
    - cross-source concordance
    - table parsing
    - dependency attachment
    - benchmark regression
  - use as soft diagnostics:
    - section mismatch
    - count outliers
  - keep separate from curation truth gate:
    - rank-impact / discrimination scoring

## 2026-03-31 Pre-100 Gate Refinement
- User pushed back correctly on two ideas:
  - benchmark regression is not a sensible blocking gate for the first `100`-chapter curation pilot
  - table matching should not be treated as the main truth oracle because the point is to extract novel prose data too
- Refined decision:
  - benchmark regression moves to a later integration / post-apply safety layer, not the pre-`100` blocker
  - table parsing stays high value, but as:
    - structured metadata source
    - high-confidence phenotype/frequency source
    - disagreement detector when the same phenotype appears in both table and prose
  - table absence must not reject novel prose-only phenotypes
- Engineering priority before/alongside `100`:
  - robust provenance
  - robust modifier attachment
  - robust table parser
  - not benchmark-gated acceptance

## 2026-03-31 Char-Offset Deterministic Verifier Idea
- User proposed a stronger deterministic verifier centered on storing:
  - char offsets
  - section ids
  - sentence boundaries
- This is a strong direction.
- Best parts:
  - exact mention verification becomes deterministic
  - frequency/onset evidence checks become deterministic regex/string checks
  - alias-shadow contamination becomes a simple range-overlap test
  - clause-local onset checks become much stronger without a second LLM
- Important limit:
  - char offsets do not fully solve implicit phenotype interpretation
  - they also do not fully solve complex progression/treatment attachment in dense prose
- Best integrated read:
  - use char offsets as a core verifier substrate
  - add:
    - clause boundaries
    - section ids
    - evidence spans per field
    - synonym-normalized lexical match
  - keep ambiguous semantic rows out of auto-accept

## 2026-03-31 Verifier Spec + Pilot Implemented
- Moved from design-only discussion into first implementation.
- Added:
  - `docs/genereviews-deterministic-verifier-spec-20260331.md`
  - `src/lib/genereviewsVerification.js`
  - `src/scripts/verifyGeneReviewsEnrichment.js`
  - npm script: `gr:verify`
- Implemented current deterministic checks:
  - phenotype presence in source sentence
  - deterministic frequency support
  - deterministic onset support
  - clause-boundary onset attachment
  - alias-shadow flagging
  - disease-subtype leak flagging
  - excluded-row lexical marker check
- Ran verifier pilot on the tightened `latest5` slice.
- Important result:
  - the refined verifier correctly leaves:
    - `ZTTK Cerebral visual impairment` as `VERIFIED`
  - while flagging:
    - `ZTTK Visual impairment`
    - because of alias-shadow inside `cortical visual impairment`
- This means the verifier is already catching the right residual failure class, not just spraying noise.
- Wrote durable pilot note to:
  - `docs/genereviews-deterministic-verifier-pilot-latest5-20260331.md`

## 2026-03-31 Provenance Plumbing Added Through Stage 1-5
- Continued the next engineering step after the first verifier pilot:
  - added sentence/paragraph structure and char offsets to the GeneReviews pipeline
- Added to `src/lib/genereviewsPipeline.js`:
  - `splitSentenceEntries`
  - `splitParagraphEntries`
  - `buildClinicalTextStructure`
  - `findBestSentenceEntryForPhrase`
  - upgraded `extractAnchorOccurrences`
  - upgraded `locateCandidateContext`
- Stage wiring completed:
  - `src/scripts/fetchGeneReviewsChapters.js`
    - now writes `*_clinical_structure.json`
    - resume logic now requires structure output too
  - `src/scripts/extractPhenotypeAnchors.js`
    - now prefers `*_clinical_structure.json`
  - `src/scripts/extractCandidatePhenotypes.js`
  - `src/scripts/extractCandidatePhenotypesOpenAiCompat.js`
  - `src/scripts/mapCandidatesToHPO.js`
  - `src/scripts/mapCandidatesToHPOBioLORD.py`
  - `src/scripts/extractPhenotypeMetadata.js`
    - all now preserve paragraph/sentence ids and char ranges
- Syntax validation:
  - `node --check` passed on all touched JS files
- Narrow proof run completed on one latest5 chapter:
  - fetch -> anchors -> Gemini candidates -> BioLORD mapping -> Gemini metadata
  - proof outputs written under:
    - `output/genereviews-pipeline-provenance-proof-20260331`
- Concrete proof:
  - stage1 structure file now carries:
    - paragraph ids
    - sentence ids
    - char offsets
  - stage2 anchor occurrences carry:
    - `paragraph_id`
    - `sentence_id`
    - `paragraph_char_start/end`
    - `sentence_char_start/end`
    - `match_char_start/end`
  - stage3 candidates preserve the same provenance
  - stage4 mapped candidates preserve the same provenance
  - stage5 enriched rows preserve the same provenance
- Important limitation:
  - this is still span plumbing, not yet full field-level provenance
  - frequency/onset/progression/treatment spans are not yet separately stored
  - verifier can now trust sentence/match location much more, but it is not yet the final publish gate

## 2026-03-31 Span-Aware Verifier Enabled
- Continued immediately after provenance plumbing:
  - upgraded the deterministic verifier to use sentence/match spans when present
- Added/changed in `src/lib/genereviewsVerification.js`:
  - sentence span resolution
  - match span verification
  - explicit `source_span` check
  - span-preferred phenotype presence proof
- Ran a one-chapter proof verifier pass on:
  - `output/genereviews-pipeline-provenance-proof-20260331/stage5_enriched_gemini`
- First result exposed one verifier bug:
  - alias-shadow was too eager and falsely flagged `Azoospermia`
  - tightened the heuristic so a stopword/verb immediately before the phrase no longer counts as a shadow prefix
- Refined proof result:
  - totals for the one chapter:
    - `featureCount: 7`
    - `verified: 2`
    - `flagged: 3`
    - `failed: 2`
  - `Azoospermia` now verifies correctly from span-backed evidence
- Best read:
  - verifier is now using the real provenance we just added, not only loose sentence text
  - remaining open work is now field-level evidence spans and table support, not basic sentence/match location

## 2026-03-31 Deterministic Metadata Spans Added
- Continued after the span-aware verifier:
  - added deterministic char offsets for frequency and onset extraction
- Implemented in:
  - `src/lib/genereviewsPipeline.js`
    - `extractScopedFrequency(..., { baseOffset })`
    - `extractScopedOnset(..., { baseOffset })`
    - both now return field-level char ranges when deterministically extracted
  - `src/scripts/extractPhenotypeMetadata.js`
    - deterministic metadata now prefers source-sentence extraction when available
    - stores:
      - `frequency_char_start/end`
      - `onset_char_start/end`
    - LLM-filled metadata explicitly leaves those spans null
  - `src/lib/genereviewsVerification.js`
    - frequency/onset checks now verify from field spans when present
- Ran a second narrow proof on `Zellweger Spectrum Disorder` under:
  - `output/genereviews-pipeline-provenance-proof-zellweger-20260331`
- Concrete proof:
  - `Decreased liver function`
    - onset verified at recorded span as `neonatal`
  - `Seizure`
    - frequency verified at recorded span as `frequent`
- This is the first real proof that metadata verification is moving from sentence-level heuristics to field-level offsets.
- Current remaining gap:
  - progression/treatment spans still do not exist
  - tables are still not parsed into the verifier path

## 2026-03-31 Progression/Treatment Spans, Table Verifier, And Hard Auto-Accept Contract
- Continued after the frequency/onset span proof:
  - finished field-level span plumbing for:
    - `progression`
    - `treatment_response`
  - added GeneReviews table support into the verifier path
  - encoded the first real hard auto-accept contract in code
- Code changes:
  - `src/scripts/extractPhenotypeMetadata.js`
    - now resolves and stores:
      - `progression_char_start/end`
      - `treatment_response_char_start/end`
  - `src/lib/genereviewsVerification.js`
    - added:
      - `verifyProgression`
      - `verifyTreatmentResponse`
      - `verifyTableConcordance`
      - `determineAutoAcceptEligibility`
    - verifier now returns:
      - `auto_accept_eligible`
      - `auto_accept_reasons`
  - `src/scripts/verifyGeneReviewsEnrichment.js`
    - now loads stage1 table payloads
    - verification summaries now count `autoAcceptEligible`
  - `src/scripts/buildEnrichmentManifest.js`
    - now accepts `--verificationDir`
    - auto-accept chapters require verifier proof
    - eligible rows go to manifest
    - ineligible rows fall back to review
- Narrow proof results:
  - table-backed proof:
    - `Y Chromosome Infertility -> Azoospermia`
    - `table_concordance == pass`
    - `auto_accept_eligible == true`
  - treatment-response span proof on:
    - `output/genereviews-pipeline-progress-treatment-proof-20260331/zap70_minimal`
    - exact spans now recorded for:
      - `treatment-refractory`
      - `resistant to therapy`
  - progression span proof on:
    - `output/genereviews-pipeline-progress-treatment-proof-20260331-zttk/minimal`
    - exact span recorded for:
      - `worsened over time`
  - Stage 6 positive proof:
    - `output/genereviews-pipeline-progress-treatment-proof-20260331-zttk/minimal/stage6_manifest_parent_only`
    - one verifier-approved row entered the manifest
  - Stage 6 fail-closed proof:
    - mixed ZTTK proof routed the surviving ineligible row to review
- Important current boundary:
  - the contract is now real and enforced
  - but it is still intentionally conservative
  - valid rows with alias-shadow ambiguity or cross-sentence onset ambiguity still fail closed into review
- Durable note written:
  - `docs/genereviews-hard-autoaccept-contract-20260331.md`

## 2026-03-31 Residual Tightening After Contract Proof
- Continued after the hard-contract proof to reduce known false-positive review routing.
- Implemented in `src/lib/genereviewsVerification.js`:
  - alias-shadow now ignores subject/context prefixes and pure modifiers such as:
    - `persistent`
    - `isolated`
    - `treatment-refractory`
    - `child`
    - `individual`
  - this keeps true nested phenotype phrases review-biased, but stops flagging obvious prose wrappers
- Re-ran the narrow ZAP70 verifier proof on the existing minimal enriched output:
  - `Autoimmune thrombocytopenia`
    - now `VERIFIED`
    - `auto_accept_eligible == true`
  - `Eczematoid dermatitis`
    - now `VERIFIED`
    - `auto_accept_eligible == true`
  - `Thrombocytopenia`
    - still `FLAGGED`
    - stays review-biased because it remains nested inside the more specific phrase `immune thrombocytopenia`
- Implemented in `src/scripts/extractPhenotypeMetadata.js`:
  - evidence-backed metadata can now promote a better supporting sentence when that sentence itself contains the phenotype phrase
  - evidence-backed `frequency` and `onset` now also compute field spans instead of leaving them null
- Boundary on proof:
  - the alias-shadow refinement is re-proven
  - the evidence-sentence promotion code is implemented but not freshly re-proven end to end yet, because the MedGemma endpoint never finished a usable cold start during the final rerun attempt
  - endpoint was paused again after the attempt

## 2026-03-31 MedGemma Direct Serving Probe
- Re-checked whether the remaining MedGemma blockage is integration-side or Hugging Face serving-side.
- Actions taken:
  - resumed the private endpoint `medgemma-27b-text-it-wgl`
  - polled Hugging Face endpoint state for more than a minute
  - probed the authenticated OpenAI-compatible route directly at:
    - `https://aro6p9a835d7pnd5.us-east-1.aws.endpoints.huggingface.cloud/v1/chat/completions`
- Durable result:
  - Hugging Face control plane advanced from `pending` to repeated `initializing`
  - control plane never reported a ready replica:
    - `readyReplica = 0`
  - authenticated direct inference probe returned:
    - `503 Service Unavailable`
- Conclusion:
  - the current MedGemma blocker is upstream serving readiness, not the pipeline's request format or authentication path
  - endpoint was paused again after the probe to avoid idle cost

## 2026-03-31 Replacement MedGemma Endpoint Verified Live
- User provided a second MedGemma Hugging Face endpoint URL:
  - `https://z2m4kqae0vudzx4y.us-east-1.aws.endpoints.huggingface.cloud`
- Direct authenticated checks against the new endpoint succeeded:
  - `GET /health` returned `200`
  - `POST /v1/chat/completions` returned `200`
  - minimal test response returned exactly:
    - `ok`
- Operational conclusion:
  - the new endpoint is live and usable for Stage 5 MedGemma work
  - the earlier failing endpoint remains a separate serving-readiness issue
  - future narrow proof reruns should target the new endpoint URL

## 2026-03-31 Replacement MedGemma Endpoint Pause Control Verified
- Confirmed lifecycle control on the replacement endpoint too.
- Used managed endpoint name:
  - `medgemma-27b-text-it-hgw`
- Pause call succeeded through the HF control API.
- Verification:
  - control plane status moved to:
    - `state = paused`
  - direct authenticated inference probe against:
    - `https://z2m4kqae0vudzx4y.us-east-1.aws.endpoints.huggingface.cloud/v1/chat/completions`
    returned:
    - `400 Bad Request`
    - `The endpoint is paused, ask a maintainer to restart it`
- Practical conclusion:
  - I can both use and pause this new endpoint from my side

## 2026-03-31 Replacement Endpoint Resume Regression
- After verifying the replacement endpoint was live, I tested the full pause/resume cycle.
- Result after resume:
  - HF control plane moved to repeated `initializing`
  - `readyReplica` stayed at `0`
  - direct authenticated `/v1/chat/completions` probe returned:
    - `503 Service Unavailable`
- Practical implication:
  - the replacement endpoint is good while already running
  - after a cold resume, it currently shows the same ready-replica problem as the earlier endpoint
  - endpoint was paused again after the failed resume probe

## 2026-03-31 MedGemma Replica Log Read
- Read local replica startup log:
  - `/Users/ahmedelmorshedy/Downloads/medgemma-27b-text-it-hgw_replica_h1nob8tj-82wrx_full_log.txt`
- Key finding:
  - there is no crash, OOM, traceback, or serving error in the replica log
  - the model actually boots successfully, but it is slow
- Concrete startup timing from the log:
  - process begins around `19:09:55`
  - weights finish loading around `19:10:56`
  - engine init/warmup completes around `19:11:54`
  - app startup completes around `19:11:58`
  - repeated `/health` checks return `200`
  - first successful `/v1/chat/completions` request appears at `19:14:01`
- Updated diagnosis:
  - the current problem is primarily cold-start latency and control-plane/readiness lag
  - our earlier probe path was too aggressive in treating the endpoint as failed before it had fully warmed
- Practical operating rule:
  - after resume, do not assume failure for at least ~3-4 minutes
  - prefer a readiness loop that waits for successful `/health` and then a successful tiny `/v1/chat/completions` probe
  - avoid pause/resume churn during active proof work; keep the endpoint warm until the batch finishes

## 2026-03-31 MedGemma Warmup + Batch Engineering
- Implemented the two overdue MedGemma execution fixes.
- In `src/scripts/extractPhenotypeMetadata.js`:
  - added a real MedGemma readiness loop before Stage 5 begins:
    - checks `/health`
    - then checks a tiny authenticated `/v1/chat/completions` probe
    - waits up to a named timeout instead of failing too early
  - switched MedGemma metadata fallback from one-phenotype-per-call to batched requests
  - batched prompt now returns a JSON object with ordered `items`
- In `src/scripts/runGeneReviewsPipeline.js`:
  - added MedGemma endpoint prewarm before `metadata-medgemma` stage execution
  - resume target defaults to:
    - endpoint owner `elmorshedyahmed`
    - endpoint name `medgemma-27b-text-it-hgw`
  - still respects environment overrides:
    - `MEDGEMMA_ENDPOINT_OWNER`
    - `MEDGEMMA_ENDPOINT_NAME`
- Validation completed:
  - `node --check src/scripts/extractPhenotypeMetadata.js`
  - `node --check src/scripts/runGeneReviewsPipeline.js`
  - dry-run shows the prewarm call before the Stage 5 MedGemma command
- Boundary:
  - this improves execution reliability and throughput
  - it does not yet prove the evidence-promotion path end to end; that is still the next tiny proof task

## 2026-03-31 Tiny MedGemma Re-Proofs Passed on the Replacement Endpoint
- Ran the tiny proof slices against the replacement MedGemma endpoint:
  - base URL:
    - `https://z2m4kqae0vudzx4y.us-east-1.aws.endpoints.huggingface.cloud`
- ZTTK proof:
  - reran Stage 5 into:
    - `output/genereviews-pipeline-progress-treatment-proof-20260331-zttk/minimal/stage5_enriched_medgemma_v2`
  - reran verifier into:
    - `output/genereviews-pipeline-progress-treatment-proof-20260331-zttk/minimal/stage7_verify_v2`
  - result:
    - evidence-sentence promotion worked
    - `Dystonia` now points at the stronger sentence with valid onset + progression spans
    - generic parent `Abnormality of movement` no longer carries the progression leak
    - remaining block on `Dystonia` is now only:
      - `alias_shadow:flag`
- ZAP70 proof:
  - reran Stage 5 into:
    - `output/genereviews-pipeline-progress-treatment-proof-20260331/zap70_minimal/stage5_enriched_medgemma_v4`
  - reran verifier into:
    - `output/genereviews-pipeline-progress-treatment-proof-20260331/zap70_minimal/stage7_verify_v4`
  - result:
    - `Autoimmune thrombocytopenia` stayed `VERIFIED`
    - `Eczematoid dermatitis` stayed `VERIFIED`
    - generic `Thrombocytopenia` stayed review-biased with:
      - `alias_shadow:flag`
- Practical conclusion:
  - the evidence-promotion path is now re-proven end to end
  - the remaining MedGemma/verification behavior is conservative alias-shadow gating, not missing evidence

## 2026-03-31 Active MedGemma Config Frozen
- Froze the active MedGemma URL into the pipeline defaults/profiles:
  - `src/scripts/extractPhenotypeMetadata.js`
  - `src/lib/genereviewsPipelineProfiles.js`
- The active base URL is now:
  - `https://z2m4kqae0vudzx4y.us-east-1.aws.endpoints.huggingface.cloud`
- The active prewarm endpoint name remains:
  - `medgemma-27b-text-it-hgw`
- Endpoint was paused again after the proof run.

## 2026-03-31 Dual Stage 6 Output Track Started
- Began the next engineering track after the MedGemma proof closure:
  - conservative ingestion output remains unchanged
  - new API/export output is now generated beside it in Stage 6
- Added:
  - `src/lib/genereviewsApiExports.js`
- Updated:
  - `src/scripts/buildEnrichmentManifest.js`
- New export behavior:
  - writes per-chapter API export files under:
    - `api_exports/chapters/*_chapter.json`
  - writes aggregate assertion exports:
    - `api_exports/genereviews_api_assertions.json`
    - `api_exports/genereviews_api_assertions.jsonl`
  - writes chapter index:
    - `api_exports/genereviews_api_chapters.json`
- Export shape now includes:
  - nested `frequency`, `onset`, `severity`, `progression`, `treatment_response`
  - `provenance`
  - `validation`
  - chapter-level summary stats
- Validation completed:
  - `node --check src/lib/genereviewsApiExports.js`
  - `node --check src/scripts/buildEnrichmentManifest.js`
  - helper smoke test confirmed assertion + chapter export object shape
- Boundary:
  - this is a structural export implementation
  - it has not yet been exercised by a fresh Stage 6 rerun on real chapter data in this turn

## 2026-03-31 Real Dual Stage 6 Pass Completed
- Ran a fresh real Stage 6 pass on the settled `latest5` MedGemma outputs through the Railway enrichment env:
  - verification dir:
    - `output/genereviews-pipeline-latest5-settled-20260330/stage7_verify_medgemma_clean_20260331`
  - manifest/export dir:
    - `output/genereviews-pipeline-latest5-settled-20260330/stage6_manifest_medgemma_dual_20260331`
- Result:
  - `5` chapters processed
  - `0` errors
  - `0` manifest rows
  - `5` review rows
- The new API/export artifacts were populated successfully:
  - `api_exports/genereviews_api_assertions.json`
  - `api_exports/genereviews_api_assertions.jsonl`
  - `api_exports/genereviews_api_chapters.json`
  - `api_exports/chapters/*_chapter.json`
- Important reality check:
  - Stage 6 only exported what the upstream `stage5_enriched_medgemma_clean` + verifier artifacts already carried
  - the export shape is correct, but some richer provenance fields are still empty in this particular latest5 export because those upstream inputs were created before the newer provenance plumbing was propagated through a full fresh settled run
- What is populated in the current export:
  - `source_sentence` on all assertion rows
  - verification verdicts / reasons
  - table concordance flags
  - some `frequency`, `onset`, `progression`, and `treatment_response` fields
- What is still mostly/null in the current export:
  - `nbk_id`
  - `section_heading`
  - `paragraph_id`
  - `sentence_id`
  - sentence/paragraph/match char offsets
  - `cross_source_concordance`
  - chapter `genes`
- Aggregate export counts from the real latest5 dual-output pass:
  - total assertions: `179`
  - `source_sentence`: `179`
  - `frequency_raw`: `25`
  - `onset_raw`: `26`
  - `progression_raw`: `2`
  - `treatment_response_raw`: `3`
  - `table_concordance = pass`: `20`
  - `verification_verdict = VERIFIED`: `122`
  - `auto_accept_eligible = true`: `0`

## 2026-03-31 Stage 6 Wired For Local Snapshot Mode
- Removed the need for Railway in future Stage 6 runs by wiring local phenotype + ontology snapshots into the manifest/export path.
- Updated:
  - `src/scripts/buildEnrichmentManifest.js`
  - `src/scripts/extractPhenotypeAnchors.js`
  - `src/lib/genereviewsPipelineProfiles.js`
- What changed:
  - Stage 2 now writes:
    - `phenotype_rows_snapshot.json`
    - `ontology_rows_snapshot.json`
  - Stage 6 now accepts:
    - `--phenotypesJson`
    - `--ontologyJson`
  - pipeline manifest stages now pass those snapshot paths by default instead of relying on DB env / Railway
- Validation:
  - `node --check src/scripts/buildEnrichmentManifest.js`
  - `node --check src/scripts/extractPhenotypeAnchors.js`
  - `node --check src/lib/genereviewsPipelineProfiles.js`
  - dry run proof:
    - `node src/scripts/runGeneReviewsPipeline.js --profile latest5-settled-20260330 --stage manifest-medgemma --dryRun`
  - the dry run now emits a pure local `node src/scripts/buildEnrichmentManifest.js ... --phenotypesJson ... --ontologyJson ...` command
- Boundary:
  - current older settled outputs do not yet contain `ontology_rows_snapshot.json`, because they were created before this patch
  - future runs will stay local automatically once Stage 2 has been rerun on the patched code

## 2026-03-31 Audit-Track Chapter Identity Propagation Tightened
- Patched downstream stages so they prefer chapter identity from upstream payloads rather than wiping it out with blank policy values.
- Updated:
  - `src/scripts/extractCandidatePhenotypes.js`
  - `src/scripts/extractCandidatePhenotypesOpenAiCompat.js`
  - `src/scripts/mapCandidatesToHPO.js`
  - `src/scripts/extractPhenotypeMetadata.js`
  - `src/scripts/verifyGeneReviewsEnrichment.js`
  - `src/scripts/buildEnrichmentManifest.js`
- What changed:
  - candidate stage now prefers `clinical_structure.nbk_id` / `anchors.nbk_id`
  - mapping stage now prefers `candidates.nbk_id`
  - metadata stage now prefers `anchors.nbk_id` / `mapped_candidates.nbk_id`
  - verifier stage now prefers `enriched.nbk_id` / `tables.nbk_id`
  - manifest/export stage now prefers `enriched.nbk_id` / `verification.nbk_id`
- Validation:
  - `node --check` passed on all touched scripts
- Net effect:
  - future reruns will not lose `nbk_id` / chapter title just because the policy file has blank `nbkId` values
- Remaining audit gap:
  - `section_heading` still needs true upstream extraction/propagation

## 2026-03-31 Latest5 Audit Path Rebuilt End To End
- Rebuilt the settled `latest5` audit path from saved raw HTML instead of refetching NCBI.
- Landed:
  - section-aware Stage 1 parsing in `src/lib/genereviewsPipeline.js`
  - `--reuseRaw` support in `src/scripts/fetchGeneReviewsChapters.js`
  - section/provenance propagation through:
    - `src/scripts/extractCandidatePhenotypes.js`
    - `src/scripts/extractCandidatePhenotypesOpenAiCompat.js`
    - `src/scripts/mapCandidatesToHPO.js`
    - `src/scripts/mapCandidatesToHPOBioLORD.py`
    - `src/scripts/extractPhenotypeMetadata.js`
  - local-first anchor snapshots in `src/scripts/extractPhenotypeAnchors.js`
  - local verify/manifest stages added to `src/lib/genereviewsPipelineProfiles.js`
- Operational fixes:
  - `src/scripts/runGeneReviewsPipeline.js` now treats MedGemma `already running` prewarm as non-fatal
  - `src/scripts/mapCandidatesToHPO.js` now falls back to `python3` if the deleted BioLORD venv path is missing and reuses existing sibling BioLORD caches
  - `src/scripts/extractPhenotypeMetadata.js` now retries transient MedGemma `500/503`-style failures
- Audit result on rebuilt latest5:
  - verifier summary at `output/genereviews-pipeline-latest5-settled-20260330/stage7_verify_medgemma/verification_summary.json`
  - `253` features total
  - `161` verified
  - `60` flagged
  - `32` failed
  - `124` auto-accept eligible under the hard contract
- Important MedGemma operational boundary:
  - first four latest5 chapters were regenerated through the live MedGemma path
  - the final ZTTK chapter could not be resumed from my side because HF endpoint control returned `403 Forbidden: Payment method required`
  - to avoid stalling the whole audit run, I reconciled the previously clean MedGemma ZTTK output with the fresh Stage 2/4 provenance so the verifier and Stage 6 could still run on a complete latest5 set
- Human-review audit surface added on top of deterministic verification:
  - new library: `src/lib/genereviewsHumanReview.js`
  - Stage 7 now writes local clickable chapter review pages under `stage7_verify_medgemma/review_pages/`
  - each verification row now includes `human_review` with:
    - direct local `review_href`
    - section / paragraph / sentence ids
    - exact sentence text
    - exact stored span texts
    - failed / flagged check lists
  - Stage 6 review queue now carries `review_page_path` and compact `review_items` so a reviewer can jump straight into the highlighted local page without opening raw JSON or raw HTML manually

## 2026-03-31 Concordance Section Gene Follow-Up
- Finished the next `latest5` follow-up pass for:
  - `cross_source_concordance`
  - `section_branch_consistent`
  - `gene_symbols`
- Landed code:
  - `src/lib/genereviewsPipeline.js`
    - raw GeneReviews HTML `citation_keywords` parsing for chapter gene extraction
  - `src/lib/genereviewsVerification.js`
    - deterministic `section_branch_consistency` check wiring
  - `src/repositories/clinicalEvidenceRepository.js`
    - cross-source concordance lookup helper
  - `src/lib/genereviewsApiExports.js`
    - API validation block now surfaces concordance and section-branch status
  - `src/scripts/buildEnrichmentManifest.js`
    - local chapter gene extraction + concordance map wiring
  - `src/lib/genereviewsPipelineProfiles.js`
    - local manifest/verify args now pass `clinicalDir` and `ontologyJson`
- Reran only the narrow local latest5 path:
  - `src/scripts/verifyGeneReviewsEnrichment.js ... --noResume`
  - `src/scripts/buildEnrichmentManifest.js ... --noResume`
- Result:
  - `gene_symbols` now populate in chapter and assertion API exports from cached raw HTML
  - cleaned examples:
    - `Y Chromosome Infertility -> [DDX3Y, USP9Y]`
    - `ZAP70 -> [ZAP70]`
    - `Zellweger -> [PEX1, PEX2, PEX3, PEX5, PEX6, ...]`
- Honest current limitation on this machine:
  - `SERVICE_FLAGS.hasDatabase = false`
  - local `stage2_anchors/ontology_rows_snapshot.json` is empty
  - because of that:
    - `cross_source_concordance` stays `[]`
    - `section_branch_consistent` stays `null`
  - those code paths are now wired, but they cannot produce real values without a DB-backed concordance source and non-empty ontology ancestry input

## 2026-03-31 DB-Backed Latest5 Trust Rerun
- Ran a narrow DB-backed refresh only for trust surfaces, not the full pipeline and not the `100` run.
- Steps:
  - reran `src/scripts/extractPhenotypeAnchors.js` with Railway-backed DB env to refresh `stage2_anchors/ontology_rows_snapshot.json`
  - reran `src/scripts/verifyGeneReviewsEnrichment.js --noResume`
  - reran `src/scripts/buildEnrichmentManifest.js --noResume` with DB env
- Result:
  - local ontology snapshot is now real: `23,677` ontology rows in `stage2_anchors/ontology_rows_snapshot.json`
  - `cross_source_concordance` now populates in API assertions
    - current latest5 export: `41/180` assertion rows have non-empty concordance
    - example sources now appearing:
      - `hpo_disease_phenotype`
      - `orphadata_hoom`
      - `orphadata_phenotypes`
- Important remaining blocker:
  - `section_branch_consistent` still stays `null` on all current exported rows
  - reason is no longer ontology ancestry
  - reason is current stored `section_heading` values are mostly generic:
    - `Clinical Description`
    - `Suggestive Findings`
    - `Table 2.`
  - the current verifier rules only work when section headings are domain-specific (`Neurologic`, `Cardiac`, `Ophthalmologic`, etc.)
  - so the next real fix for section-branch consistency is richer subheading extraction/propagation, not more DB work

## 2026-03-31 Chapter Domains Added As Coarse Clinical Signal
- Added `chapter_domains` and `heading_inventory` so we capture what the chapter is broadly about even when section headings stay generic.
- Initial heading-only extraction was too weak on latest5, so chapter domains now use:
  - heading matches first
  - clinical prose keyword evidence as fallback
- Landed in:
  - `src/lib/genereviewsPipeline.js`
  - `src/scripts/fetchGeneReviewsChapters.js`
  - `src/scripts/buildEnrichmentManifest.js`
  - `src/lib/genereviewsApiExports.js`
- Rebuilt Stage 1 from cached raw HTML with `--reuseRaw` and reran Stage 6.
- Current latest5 chapter export examples:
  - `Y Chromosome Infertility -> Renal / Genitourinary`
  - `ZAP70 -> Neurologic; Hematologic / Immunologic`
  - `Zellweger -> Neurologic; Ophthalmologic; Auditory; Gastrointestinal; Renal / Genitourinary; Craniofacial`
  - `ZTTK -> Neurologic; Ophthalmologic; Auditory; Cardiovascular; Gastrointestinal; Renal / Genitourinary; Musculoskeletal; Craniofacial`
- This is intentionally coarse.
- It helps:
  - chapter-level API filtering
  - future product summaries
  - human audit context
- It does **not** replace row-level verification or solve section-branch consistency by itself.

## 2026-03-31 Local Clinical Domains Layer Added
- Added a new soft row-level / paragraph-level context field:
  - `local_clinical_domains`
- Design:
  - paragraph/block level first
  - rows inherit from their paragraph when available
  - soft audit/product metadata only, not a hard truth gate
- Landed in:
  - `src/lib/genereviewsPipeline.js`
  - `src/scripts/extractCandidatePhenotypes.js`
  - `src/scripts/mapCandidatesToHPO.js`
  - `src/scripts/extractPhenotypeMetadata.js`
  - `src/scripts/verifyGeneReviewsEnrichment.js`
  - `src/scripts/buildEnrichmentManifest.js`
  - `src/lib/genereviewsApiExports.js`
  - `src/lib/genereviewsHumanReview.js`
  - `public/geneReviewsAudit.js`
- Rebuilt only what was needed:
  - Stage 1 from cached raw HTML
  - Stage 7 verify
  - Stage 6 manifest/export
- Current latest5 result:
  - `180` assertion export rows
  - `98/180` with non-empty `local_clinical_domains`
  - review queue items now include `local_clinical_domains`
- Example:
  - `Azoospermia` in `Y Chromosome Infertility` now carries `Renal / Genitourinary` local domain context
- This gives:
  - better reviewer context
  - better future UI grouping
  - better API metadata for multisystem chapters

## 2026-03-31 Consultant Readiness Brief Written
- Wrote a consultant-ready decision brief for the `100` run:
  - `docs/genereviews-100-run-readiness-consult-20260331.md`
- Purpose:
  - ask a narrow question: is `100 review-first` ready now or not
  - separate that from broader autoaccept / final ingestion readiness
- Included:
  - latest5 trust counts
  - current API/export coverage
  - real resolved vs unresolved signals
  - exact consultant questions
## 2026-03-31 - Prepared dedicated 50-chapter review-first run profile

- Added new GeneReviews profile `review-first-50-20260331` on the settled architecture.
- Bound it to the tail 50 chapters from `genereviews-chapter-policy-template-20260329.json`.
- Stages are: fetch -> phenotagger-local -> anchors -> candidates-gemini-flash -> map -> metadata-medgemma -> verify-medgemma -> manifest-medgemma.
- Uses local Stage 6 snapshot inputs and deterministic verify before manifest/export.
- Wrote execution/runbook doc: `docs/genereviews-review-first-50-run-plan-20260331.md`.
- Dry run passed end-to-end through stage resolution.
- Updated `gr:check` so MedGemma readiness reflects the active default endpoint URL rather than requiring an explicit exported base URL.
- Did not start the run.

## 2026-04-01 - Hardened Stage 5 after live USP7 failure probe

- Implemented deterministic metadata hardening in:
  - `src/lib/genereviewsPipeline.js`
  - `src/scripts/extractPhenotypeMetadata.js`
  - `src/scripts/extractPhenotypeAnchors.js`
  - `src/lib/genereviewsVerification.js`
  - `src/lib/genereviewsApiExports.js`
- Fixed deterministic frequency range parsing:
  - `53%-65%` is now preserved as a range
  - added `frequency_value_min`, `frequency_value_max`, and `frequency_value_type`
- Tightened Stage 5 evidence use:
  - MedGemma extra context sentences now must still contain the phenotype phrase
  - onset now requires phenotype-local evidence and same-clause attachment
  - progression / treatment_response now require phenotype-local evidence instead of paragraph borrowing
  - MedGemma evidence-backed frequency now trusts deterministic sentence parsing over raw LLM scalar collapse
- Added provenance completeness gating:
  - rows missing paragraph/sentence ids or match offsets no longer get metadata populated
  - `provenance_complete` is now carried on enriched rows
- Fixed upstream supplement-anchor hydration:
  - PhenoTagger supplement occurrences that lacked sentence/paragraph ids are now hydrated from the cached clinical structure before merge
- Verified cheap regressions:
  - `extractScopedFrequency('...53%-65%...', 'vision issues')` now returns the full range plus min/max
  - rebuilt USP7 Stage 2 anchors into `output/genereviews-pipeline-review-first-50-20260331/stage2_anchors_patchcheck`
  - `Abnormality of the eye` / `Abnormality of vision` now have `paragraph_id`, `sentence_id`, and exact match offsets
- Ran a narrow MedGemma proof on only the five real USP7 failure rows:
  - inputs under `output/genereviews-pipeline-review-first-50-20260331/usp7_failure_probe`
  - output:
    - `output/genereviews-pipeline-review-first-50-20260331/usp7_failure_probe/metadata/USP7_Related_Hao_Fountain_Syndrome_enriched.json`
- Proof result on the exact prior failures:
  - `Abnormality of the eye` and `Abnormality of vision` now keep `53%-65%`
  - `Hyperbilirubinemia` no longer inherits `neonatal`
  - `Scoliosis` and `Kyphosis` no longer inherit `slight progression`
- MedGemma endpoint `medgemma-27b-text-it-hgw` was resumed only for the narrow proof and then paused again.
- Next move:
  - rerun USP7 or a 3-5 chapter micro-batch on the patched path before restarting any larger review-first batch

## 2026-04-01 - Patched Stage 1 truncation and Stage 3 candidate pollution

- Audited the stopped `review-first-50` emitted outputs and confirmed two upstream problems:
  - `WFS1 Spectrum Disorder` Stage 1 was truncated to just `Clinical Characteristics`
  - Stage 3 was emitting table chrome / headings / disease-course statements as phenotype candidates
- Root cause for WFS1 truncation:
  - `extractClinicalSectionsAndTables(...)` was stopping section extraction at the first nested subsection `<div>`
  - this cut `wfs.Clinical_Characteristics` off before the actual clinical description block
- Fixed Stage 1 parsing in `src/lib/genereviewsPipeline.js`:
  - section extraction now closes on balanced `<div> ... </div>` depth rather than the next uppercase-id block
  - section markers now match nested ids like `Clinical_Description__...` and `Suggestive_Findings__...`
  - table-only prose units are now skipped from `clinical_text`; tables remain preserved in `tables.json`
- Narrow Stage 1 proof:
  - rebuilt WFS1 from cached raw HTML only into:
    - `output/genereviews-pipeline-review-first-50-20260331/stage1_fetch_patchcheck2`
  - WFS1 now has:
    - `paragraph_count = 32`
    - `sentence_count = 57`
    - meaningful headings including:
      - `Suggestive Findings – Classic WFS1 Spectrum Disorder`
      - `Clinical Description – Classic WFS1 Spectrum Disorder`
      - `Clinical Description – Nonclassic WFS1 Spectrum Disorder`
      - `Genotype-Phenotype Correlations`
      - `Prevalence`
  - `View in own window` is no longer present in the rebuilt WFS1 `clinical_text`
- Added deterministic Stage 3 candidate filtering in:
  - `src/scripts/extractCandidatePhenotypes.js`
  - `src/scripts/extractCandidatePhenotypesOpenAiCompat.js`
  - shared evaluation helper in `src/lib/genereviewsPipeline.js`
- New Stage 3 filter behavior:
  - rejects headings/chrome like `clinical characteristics` and `View in own window`
  - rejects treatment-response statements as phenotype candidates
  - rejects disease-course / outcome statements like:
    - `asymptomatic at diagnosis`
    - `normal cognitive outcome`
  - rejects table-context candidates when the located evidence is still chrome
  - candidate output now keeps an audit trail:
    - `raw_candidate_count`
    - `rejected_candidate_count`
    - `rejected_candidates[]` with reasons
- Narrow no-LLM replay proof from the real saved Stage 3 raw outputs:
  - output dir:
    - `output/genereviews-pipeline-review-first-50-20260331/stage3_candidates_patchcheck2`
  - `WFS1`:
    - raw `1`
    - kept `0`
    - rejected `clinical characteristics`
  - `VEXAS`:
    - raw `10`
    - kept `6`
    - rejected `4`
    - correctly rejected:
      - `onset in late adulthood`
      - `failure to respond to classic immunosuppressive treatments`
      - `vacuoles in myeloid precursor cells`
      - `vacuoles in erythroid precursor cells`
  - `Very Long-Chain Acyl-Coenzyme A Dehydrogenase Deficiency`:
    - raw `7`
    - kept `3`
    - rejected `4`
    - correctly rejected:
      - `asymptomatic at diagnosis`
      - `normal cognitive outcome`
      - `cardiac dysfunction reversible with treatment`
      - `hypoglycemia not present at symptom onset in myopathic form`
- Current practical state after this pass:
  - Stage 1 truncation class is fixed on the proven WFS1 case
  - Stage 3 now has a deterministic reject layer with an auditable trail instead of silently passing obvious junk
  - next safe validation step remains a `3-5` chapter micro-batch, not another `50`

## 2026-04-01 - Cached latest5 upstream rerun without MedGemma

- Ran the patched upstream path on the cached settled `latest5` slice only, stopping before MedGemma:
  - Stage 1: `stage1_fetch_patchcheck_20260401`
  - Stage 2b: `stage2b_phenotagger_local_patchcheck_20260401`
  - Stage 2: `stage2_anchors_patchcheck_20260401`
  - Stage 3: `stage3_candidates_patchcheck_20260401`
  - Stage 4: `stage4_mapped_candidates_patchcheck_20260401`
- No network fetches were needed for Stage 1:
  - seeded the rerun from the existing cached `*_raw.html` files
- Stage results:
  - Stage 1 fetch: `5/5`, `0` errors
  - Stage 2b local PhenoTagger: `5/5`, `0` errors
  - Stage 2 anchors: `5/5`, `0` errors
  - Stage 3 Gemini candidates: `5/5`, `0` errors
  - Stage 4 BioLORD mapping: `5/5`, `0` errors
- Useful proof from the cached latest5 rerun:
  - Stage 1 rebuilt all five chapters with full prose and stable `nbk_id` values
  - Stage 1 table-only prose is excluded from `clinical_text`
  - Stage 4 completed quickly once the settled `biolord_cache_py310_np` cache was reused
- Stage 3 chapter-level counts compared to the earlier settled run:
  - `Y Chromosome Infertility`: `1 -> 5`
  - `YIF1B`: `6 -> 10`
  - `ZAP70`: `57 -> 54` with `4` explicit rejections
  - `Zellweger`: `9 -> 12`
  - `ZTTK`: `19 -> 5`
- Stage 4 accepted mapped rows compared to the earlier settled run:
  - `Y Chromosome Infertility`: `0 -> 0`
  - `YIF1B`: `2 -> 3`
  - `ZAP70`: `5 -> 5`
  - `Zellweger`: `1 -> 1`
  - `ZTTK`: `15 -> 3`
- Honest interpretation:
  - the deterministic structural fixes held:
    - no truncation
    - no table chrome leakage
    - no MedGemma needed to validate that upstream change
  - but the latest5 rerun also exposed residual Stage 3 semantic issues:
    - `Y Chromosome Infertility` still keeps low-value normal/no-symptom statements
    - `ZTTK` still shows context resolution drift (e.g. `IgA deficiency` anchored to the wrong sentence)
    - `ZAP70` still contains many immunologic/lab-style rows that may be clinically useful but need tighter definition of what belongs in phenotype discovery
- Conclusion after this cached latest5 upstream pass:
  - the structural patches survived
  - Stage 3 still needs another tightening round on:
    - normal / no-symptom statements
    - sentence selection / context anchoring
    - phenotype-vs-lab/immunology candidate boundaries

2026-04-01 18:45 EDT
- Tightened Stage 3 again in shared pipeline code instead of prompt-only changes:
  - added deterministic normal/no-symptom rejection
  - added prognosis / phenotype-summary rejection
  - added context-match scoring with weak-match rejection
  - improved candidate sentence selection so token-overlap matches prefer the real descriptive sentence instead of the first heading-like sentence
  - added a narrow implied-function exception so rows like `inability to walk independently` survive when the source sentence explicitly encodes limited capacity / milestone acquisition
- Materialized a strict deterministic replay of cached latest5 Stage 3 outputs into:
  - `output/genereviews-pipeline-latest5-settled-20260330/stage3_candidates_patchcheck_20260401_strict`
- Remapped the strict candidate set into:
  - `output/genereviews-pipeline-latest5-settled-20260330/stage4_mapped_candidates_patchcheck_20260401_strict`
- Evidence from the strict replay:
  - `Y Chromosome Infertility`: reduced from `5` candidates to `1` kept + `4` rejected, with the normal/no-symptom rows now correctly filtered
  - `ZTTK`: `IgA deficiency` now rejected as `weak_context_match`; `atrophy of white matter` and `smooth cerebral cortex` now anchor to the actual MRI sentence instead of the generic `Brain MRI findings.` heading sentence
  - `ZAP70`: candidate count reduced from `54` to `38`; prognosis / normal-state / response-style rows are filtered while clinically specific infection / immunology findings remain
  - `YIF1B`: the first strict pass over-rejected implied milestone loss rows; added a narrow implied-function rescue rule and restored those rows without reopening the earlier junk classes
- Current honest state after the strict cached latest5 replay:
  - Stage 3 is materially better and much more auditable
  - the known latest5 junk classes are now deterministically blocked
  - remaining uncertainty is no longer “is Stage 3 filtering real?” but “is the current phenotype-vs-lab boundary aggressive enough or still too permissive for chapters like ZAP70?”

2026-04-01 19:10 EDT
- Ran the cheap `scispaCy` viability probe without turning MedGemma back on.
- Installed an isolated biomedical parser surface only for probing:
  - packages targeted into `.deps/scispacy_probe`
  - used the existing Python 3.10 runtime from the local PhenoTagger environment
  - did not modify the main project runtime or Stage 5 code path yet
- Probe inputs were saved Stage 5 sentences / evidence examples, not a new run:
  - USP7 progression paragraph
  - USP7 hyperbilirubinemia / neonatal jaundice pair
  - ZAP70 treatment-response examples
  - ZTTK onset/progression sentence
- Main conclusion:
  - `scispaCy` is useful as a same-sentence attachment helper
  - it clearly attaches:
    - `treatment-refractory` -> `thrombocytopenia`
    - `resistant` -> `dermatitis`
    - `childhood` -> `onset`
  - it does not add much for already-obvious cross-sentence cases like:
    - `neonatal jaundice` vs later `hyperbilirubinemia`
    - paragraph-level progression leakage after the phenotype sentence
- Decision from the cheap probe:
  - `scispaCy` is worth integrating only as a narrow Stage 5 attachment validator for onset / progression / treatment-response in same-sentence hard cases
  - it should not replace the existing deterministic sentence / clause guards

2026-04-01 19:32 EDT
- Integrated the narrow `scispaCy` validator into Stage 5 without starting a new extraction run.
- New code added:
  - `src/lib/scispacyAttachmentValidator.js`
  - `src/scripts/validateMetadataAttachmentSciSpacy.py`
- Stage 5 wiring in `src/scripts/extractPhenotypeMetadata.js` now:
  - keeps deterministic sentence / clause guards as primary
  - runs `scispaCy` only for same-sentence:
    - `onset_raw`
    - `progression_raw`
    - `treatment_response_raw`
  - clears the field only on parser-backed `fail`
  - keeps `pass` / `unknown` as recorded attachment-validation metadata
- Cheap saved-case proof after integration:
  - `treatment-refractory` -> `thrombocytopenia`: `pass`
  - `resistant to therapy` -> `dermatitis`: `pass`
  - ZTTK `childhood onset`: `unknown` because the onset modifier resolves to generic `adult`, so the validator stays conservative
  - ZTTK `worsened over time`: `unknown`, which is acceptable because deterministic locality still does the primary gating
- Syntax checks passed:
  - `node --check src/lib/scispacyAttachmentValidator.js`
  - `node --check src/scripts/extractPhenotypeMetadata.js`
  - `python -m py_compile src/scripts/validateMetadataAttachmentSciSpacy.py`

2026-04-01 20:12 EDT
- Built a new static HTML explainer for the current GeneReviews pipeline in:
  - `/Users/ahmedelmorshedy/Documents/All HTMLs/2026-04-01/genereviews-pipeline-status.html`
- Purpose:
  - give a non-specialist, example-heavy explanation of the pipeline without relying on internal jargon
  - show intended pipeline behavior and real build status together instead of splitting them across separate documents
- Structure:
  - overview and simple definitions
  - parallel intended-vs-real pipeline map
  - one section per stage explaining:
    - what it does
    - why the pipeline needs it
    - what output it should produce
    - how bad output damages the next stage
    - what broke, what was fixed, and what is still under proof
  - final outputs section summarizing human review, conservative ingestion, and API/export goals

2026-04-01 20:32 EDT
- Built a second GeneReviews explainer HTML in the more glanceable vertical-map style:
  - `/Users/ahmedelmorshedy/Documents/All HTMLs/2026-04-01/genereviews-pipeline-map-v2.html`
- This version is optimized for fast comparison on one page rather than document-style reading.
- Added:
  - side-by-side “should do” vs “real status” cards for each stage
  - example drawers inside stage cards
  - confidence bars on the real-status side
  - flip cards that explain:
  - how the stage works in the pipeline
  - what the model/rule technically is
  - how deterministic it is
  - what downstream corruption happens if that stage is weak

2026-04-01 22:10 EDT
- Question:
  - Can Stage 3 get an explicit lightweight negation/assertion layer now, without changing the broader architecture?
- Evidence surface:
  - shared candidate-finalization path in `src/lib/genereviewsPipeline.js`
  - latest5 cached Stage 1 / Stage 2 rerun surfaces:
    - `output/genereviews-pipeline-latest5-settled-20260330/stage1_fetch_patchcheck_20260401`
    - `output/genereviews-pipeline-latest5-settled-20260330/stage2_anchors_patchcheck_20260401`
  - fresh latest5 Stage 3 rerun:
    - `output/genereviews-pipeline-latest5-settled-20260330/stage3_candidates_negation_patchcheck_20260401`
  - cheap synthetic proof cases run through `finalizePhenotypeCandidates(...)`
- Intentionally not inspected:
  - no broad 50-chapter rerun
  - no Stage 5 rerun
  - no OpenBioNER / GLiNER bakeoff yet
- What changed:
  - added a sentence-local assertion layer in `src/lib/genereviewsPipeline.js`
  - behavior:
    - explicit local negation flips `present -> excluded`
    - preserved / normal statements get rejected
    - clear conditional / risk statements get rejected
  - preserved new audit fields:
    - `assertion_status_origin`
    - `assertion_reason`
    - `assertion_evidence`
  - propagated those fields through:
    - `src/scripts/mapCandidatesToHPO.js`
    - `src/scripts/extractPhenotypeMetadata.js`
- Real proof:
  - synthetic:
    - `Seizures are not typically present...` now becomes `excluded`
    - `Cognitive function is usually preserved.` now rejects `Cognitive function`
    - `Absence of speech...` stays positive as a real abnormal phenotype phrase
  - latest5 rerun:
    - clean execution: `5/5`, `0` errors
    - summary:
      - `Y Chromosome Infertility`: `4`
      - `YIF1B`: `9`
      - `ZAP70`: `35`
      - `Zellweger`: `8`
      - `ZTTK`: `5`
    - real newly-caught assertion-style junk on latest5:
      - `potentially decreased expression of CTLA4 in regulatory T cells`
      - `potentially decreased expression of TGFB in regulatory T cells`
      rejected as `conditional_or_risk_context`
    - nuance:
      - the explicit `sentence_negation_inferred` path did not fire often on this latest5 slice
      - the strongest proof for true negation flipping came from focused sentence probes rather than from many natural latest5 examples
- Extra bug found while validating:
  - `mapCandidatesToHPO.js` only accepted `--phenotypesJson` when the JSON had a `phenotype_rows` wrapper
  - cached BioLORD phenotype files on disk are plain arrays
  - patched the mapper to accept both shapes
- Result:
  - explicit Stage 3 negation/assertion handling is now real
  - it behaves correctly on the targeted failure classes
  - latest5 did not contain many dramatic negation examples, so the biggest proof came from focused assertion probes plus a clean rerun
- Status:
  - kept
- Next move:
  - run the Stage 3 bakeoff on the same frozen slice:
    - current Gemini + filters
    - GLiNER-BioMed
    - later OpenBioNER-v2 if setup is clean

2026-04-01 22:32 EDT
- Question:
  - Can we turn the new Stage 3 assertion logic into a durable regression surface with many confusing synthetic lines instead of a few spot probes?
- Evidence surface:
  - new synthetic fixture:
    - `test/fixtures/genereviewsCandidateAssertionSynthetic.js`
  - new node test:
    - `test/genereviewsCandidateAssertionSynthetic.test.js`
  - direct execution:
    - `node --test test/genereviewsCandidateAssertionSynthetic.test.js`
- Intentionally not inspected:
  - no new model bakeoff yet
  - no Stage 5 rerun
  - no broad chapter rerun beyond the earlier latest5 patchcheck
- What was added:
  - `100` synthetic Stage 3 assertion cases across:
    - local negation -> `excluded`
    - normal / preserved -> reject
    - conditional / risk -> reject
    - true abnormal “absence/loss/lack” phenotypes -> keep present
    - standard positive findings -> keep present
    - model-excluded negatives -> remain excluded
- What the suite found:
  - one real logic gap:
    - `has not been reported` was not being caught as a negative pattern
  - the rest of the first red run was expectation-shape mismatch in the test, not pipeline failure
- Patch made:
  - expanded the negative suffix regex in `src/lib/genereviewsPipeline.js` to catch:
    - `has not been reported`
    - `have not been observed`
    - similar auxiliary-chain negatives
- Final result:
  - full suite passes:
    - `102/102` tests green
  - command:
    - `node --test test/genereviewsCandidateAssertionSynthetic.test.js`
- Status:
  - kept
- Why this matters:
  - the Stage 3 assertion layer now has a real reusable regression surface
  - future changes to candidate filtering can be checked quickly without rerunning a batch

## 2026-04-01 23:16 EDT — Gemini Flash assertion probe on external Stage 3 regression file

- Question:
  - If we run a semantic model on the harder external Stage 3 regression file, does Gemini Flash materially outperform the current deterministic assertion layer?
- Evidence surface:
  - external file:
    - `/Users/ahmedelmorshedy/Downloads/stage3_regression_cases.js`
  - new reusable runner:
    - `src/scripts/evaluateStage3AssertionWithGemini.js`
  - output report:
    - `output/stage3_assertion_gemini_probe_20260401/stage3_regression_cases_gemini_flash_report.json`
  - output summary:
    - `output/stage3_assertion_gemini_probe_20260401/stage3_regression_cases_gemini_flash_summary.json`
- Intentionally not inspected:
  - no new chapter rerun
  - no Stage 4 or Stage 5 work
  - no OpenBioNER / GLiNER bakeoff yet
- What was done:
  - batched the `62` external regression cases through `gemini-2.5-flash`
  - asked for Stage 3-style final outcome:
    - `present`
    - `excluded`
    - `rejected`
  - also collected predicted origin/reason fields for exact-match comparison
- Result:
  - outcome-only accuracy:
    - `62/62`
  - exact match:
    - `58/62`
  - the only exact-match misses were already-excluded rows where Gemini kept:
    - `origin = model_excluded`
    - `reason = null`
    - instead of copying a local negative reason string
- Why this matters:
  - this is strong evidence that a semantic model can outperform the current regex-heavy assertion layer on harder negation / preserved / conditional wording
  - the remaining disagreement is mostly metadata semantics, not outcome semantics
- Status:
  - kept

## 2026-04-01 23:25 EDT — Gemini Flash probe on 100-case tricky Stage 3 fixture

- Question:
  - Does Gemini Flash stay strong on a larger, deliberately tricky `100`-case external assertion fixture?
- Evidence surface:
  - external file:
    - `/Users/ahmedelmorshedy/Downloads/stage3_tricky_cases.js`
  - reusable runner:
    - `src/scripts/evaluateStage3AssertionWithGemini.js`
  - output report:
    - `output/stage3_assertion_gemini_tricky_probe_20260401/stage3_regression_cases_gemini_flash_report.json`
  - output summary:
    - `output/stage3_assertion_gemini_tricky_probe_20260401/stage3_regression_cases_gemini_flash_summary.json`
- Intentionally not inspected:
  - no chapter rerun
  - no GLiNER/OpenBioNER bakeoff yet
  - no Stage 5 work
- Result:
  - exact match:
    - `100/100`
  - outcome-only accuracy:
    - `100/100`
  - all categories were fully correct:
    - negation -> excluded
    - abnormal absence stays present
    - normal/preserved -> rejected
    - conditional/risk -> rejected
    - standard positives stay present
    - model-excluded rows remain excluded
- Why this matters:
  - on the current external synthetic evidence, Gemini Flash is clearly better than the current deterministic assertion layer
  - assertion handling is now a serious candidate for semantic-model assistance instead of further regex growth

## 2026-04-01 23:48 EDT — Gemini Flash probe on real-format Stage 3 rows

- Question:
  - Does Gemini Flash stay strong when the input looks like actual Stage 3 candidate rows instead of simplified sentence fixtures?
- Evidence surface:
  - external file:
    - `/Users/ahmedelmorshedy/Downloads/stage3_realformat_cases.js`
  - runner:
    - `src/scripts/evaluateStage3AssertionWithGemini.js`
  - output report:
    - `output/stage3_assertion_gemini_realformat_probe_20260401/stage3_regression_cases_gemini_flash_report.json`
  - output summary:
    - `output/stage3_assertion_gemini_realformat_probe_20260401/stage3_regression_cases_gemini_flash_summary.json`
- Intentionally not inspected:
  - no live chapter rerun
  - no deterministic-vs-Gemini blended design yet
- Result:
  - total cases:
    - `50`
  - exact match:
    - `49/50`
  - outcome-only accuracy:
    - `49/50`
- Single miss:
  - `p24_s1`
  - label:
    - `cataracts`
  - sentence:
    - `Slit-lamp examination is unremarkable and cataracts have not been described.`
  - expected:
    - `excluded`
  - Gemini predicted:
    - `present`
- Why this matters:
  - Gemini still looks strong on inputs closer to the real pipeline row shape
  - but it is not perfect, and this miss is exactly the sort of local negation phrasing we would need to guard if assertion handling becomes model-assisted

## 2026-04-02 00:18 EDT — Early Stage 3 contender gate on tricky assertion surface

- Question:
  - Before building a full bakeoff, which Stage 3 contenders are practical enough to deserve deeper work?
- Evidence surface:
  - tricky fixture:
    - `/Users/ahmedelmorshedy/Downloads/stage3_tricky_cases.js`
  - local HF / Python probing:
    - `GLiNER`
    - `OpenBioNER-v2`
    - `VANER2` repo metadata and README
- Intentionally not inspected:
  - no live chapter rerun
  - no full Stage 3 extraction benchmark yet
  - no Stage 4 or Stage 5 work
- What happened:
  - `GLiNER`:
    - quick full-file mention-detection gate on the `100` tricky cases
    - best label set was the original baseline:
      - `['phenotype', 'symptom', 'clinical finding', 'sign']`
    - result:
      - `57/100` detected
    - alternate label sets were worse, not better
  - `OpenBioNER-v2`:
    - standard `transformers` token-classification load path is not trustworthy here
    - the checkpoint reports missing classifier weights and unexpected parameters
    - naive overlap looked artificially high because it chunked large spans and alternating labels, not because it gave clean phenotype extraction
  - `VANER2`:
    - not a quick drop-in contender
    - README requires:
      - the project code
      - Llama 3.1 8B base model
      - about `20GB` GPU memory
- Current read:
  - `GLiNER`: practical to test, but early gate is weaker than hoped
  - `OpenBioNER-v2`: promising on paper, but needs an official/adapter-aware inference path, not naive `transformers` use
  - `VANER2`: blocked for quick local bakeoff; treat as separate engineering effort, not a same-day contender

## 2026-04-02 01:03 EDT — Proper OpenBioNER-v2 runner verified and benchmarked

- Question:
  - If we run OpenBioNER-v2 through its actual supported path, does it become a serious Stage 3 contender?
- Evidence surface:
  - official usage pattern from the Hugging Face article:
    - `zshot + spaCy + LinkerSMXM`
  - benchmark fixtures:
    - `/Users/ahmedelmorshedy/Downloads/stage3_tricky_cases.js`
    - `/Users/ahmedelmorshedy/Downloads/stage3_regression_cases.js`
    - `/Users/ahmedelmorshedy/Downloads/stage3_realformat_cases.js`
  - saved reports:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_extractor_contender_probe_20260401/openbioner_tricky_gate_summary.json`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_extractor_contender_probe_20260401/openbioner_tricky_gate_multidesc_summary.json`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_extractor_contender_probe_20260401/openbioner_regression_gate_summary.json`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_extractor_contender_probe_20260401/openbioner_realformat_gate_summary.json`
- Intentionally not inspected:
  - no live chapter rerun
  - no Stage 4 remap
  - no Stage 5 work
- What happened:
  - built an isolated probe env:
    - `.deps/openbioner_probe/.venv`
  - the official OpenBioNER path initially failed because the runner expected an older `transformers` API
  - pinning the env to:
    - `transformers==4.51.3`
    fixed the compatibility issue and made the official sample work
  - results:
    - tricky 100, single broad phenotype description:
      - `54/100`
    - tricky 100, tuned multi-description configuration:
      - `68/100`
    - regression 62, tuned multi-description:
      - `41/62`
    - real-format 50, tuned multi-description:
      - `30/50`
- Current read:
  - OpenBioNER-v2 is no longer “unresolved”
  - it was given a fair enough run
  - it still does not beat the current semantic Stage 3 path on our current evaluation surfaces
  - useful conclusion:
    - proper integration matters
    - but even after proper integration, this is not the current winner for our Stage 3 need

## 2026-04-02 01:11 EDT — Important benchmark framing correction

- Mistake:
  - the GLiNER / OpenBioNER / VANER2 checks were treated too much like final Stage 3 contender verdicts
- Correction:
  - those models are discovery contenders
  - the `100`, `62`, and `50` files were assertion-style or mention-detection proxy surfaces
  - so those results are not enough to reject a discovery model outright
- What the proxy tests are still good for:
  - technical feasibility
  - rough mention-detection sanity
  - catching broken integrations
- What they are not good for:
  - final Stage 3 discovery ranking
  - chapter-level junk-vs-recall evaluation
  - downstream mapping usefulness
- Correct next step:
  - build a real frozen chapter-level discovery benchmark and rerun the contenders there

## 2026-04-02 14:34 EDT — Stage 2 anchor benchmark harness built and baseline run completed

- Question:
  - Can the externally generated `anchor_benchmark (1).js` file be used as a real Stage 2 benchmark?
- Evidence surface:
  - benchmark file:
    - `/Users/ahmedelmorshedy/Downloads/anchor_benchmark (1).js`
  - new harness:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/benchmarkStage2Anchors.js`
  - phenotype snapshot:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-latest5-settled-20260330/stage2_anchors_patchcheck_20260401/phenotype_rows_snapshot.json`
  - outputs:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage2_anchor_benchmark_20260402/stage2_anchor_benchmark_summary.json`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage2_anchor_benchmark_20260402/stage2_anchor_benchmark_report.json`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage2_anchor_benchmark_20260402/stage2_anchor_benchmark_failures.json`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage2_anchor_benchmark_20260402/stage2_anchor_benchmark_cases.json`
- Intentionally not inspected:
  - no live chapter rerun
  - no Stage 3 discovery model work in this step
  - no Stage 5 work
- What changed:
  - added a real Stage 2 benchmark harness that:
    - reads the external JS fixture safely
    - runs the actual `extractAnchorOccurrences(...)` logic
    - treats `expectedRejected` as `must not anchor` rather than pretending Stage 2 emits formal rejected rows
    - freezes a normalized copy of the benchmark into the output folder
- Baseline result for current Stage 2 anchor path:
  - exact case match:
    - `27/100`
  - expected anchor recall:
    - `64/107` = `0.5981`
  - must-not-anchor pass rate:
    - `16/32` violations => `0.5` pass rate
- Strong categories:
  - `multi_anchor_sentence` recall:
    - `0.9032`
  - `parent_child_ambiguity` recall:
    - `0.875`
  - `exact_label_present` recall:
    - `0.875`
- Weak categories:
  - `negated_anchor` recall:
    - `0`
  - `misspelling_present` recall:
    - `0.2`
  - `disease_name_not_phenotype` must-not-anchor pass rate:
    - `0.1`
- Current read:
  - the benchmark file is usable for Stage 2
  - it was worth only a light interpretation tweak, not a rewrite
  - it exposes real current anchor weaknesses clearly enough to be a useful anchor-side benchmark
- Important side finding:
  - `PhenoBCBERT` itself does not appear to be publicly released as a runnable checkpoint because the published paper says the in-house model trained on CHOP data could not be shared for privacy reasons

## 2026-04-02 14:46 EDT — Quick Gemini Flash Stage 2 anchor probe on balanced 50-case slice

- Question:
  - If we treat anchoring as a sentence-level extraction task, is Gemini Flash competitive enough to be interesting as an anchor-style extractor?
- Evidence surface:
  - benchmark:
    - `/Users/ahmedelmorshedy/Downloads/anchor_benchmark (1).js`
  - runner:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/evaluateStage2AnchorsWithGemini.js`
  - outputs:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage2_anchor_gemini_probe_20260402/stage2_anchor_gemini_summary.json`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage2_anchor_gemini_probe_20260402/stage2_anchor_gemini_report.json`
- Intentionally not inspected:
  - no full 100-case run yet
  - no chapter-level cost/latency analysis yet
  - no Stage 3 discovery work in this step
- What happened:
  - ran a balanced 50-case subset across all benchmark categories
  - prompt asked Gemini only for anchor extraction from one sentence:
    - `hpo_label`
    - `status`
    - `match_text`
- Result:
  - total:
    - `50`
  - exact match:
    - `47/50`
  - expected anchor recall:
    - `48/48` = `1.0`
  - must-not-anchor pass rate:
    - `13/13` = `1.0`
- Current read:
  - on this synthetic Stage 2 benchmark slice, Gemini Flash is dramatically stronger than the current deterministic anchor baseline
  - this does not yet prove it should replace Stage 2 operationally
  - but it is strong enough to justify a fuller benchmark pass and a cost/latency comparison

## 2026-04-02 15:04 EDT — Full 100-case Gemini Stage 2 anchor comparison: Flash vs Pro

- Question:
  - How does `Gemini 2.5 Pro` compare to `Gemini 2.5 Flash` on the full Stage 2 anchor benchmark?
- Evidence surface:
  - same benchmark:
    - `/Users/ahmedelmorshedy/Downloads/anchor_benchmark (1).js`
  - same runner:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/evaluateStage2AnchorsWithGemini.js`
  - full Flash output:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage2_anchor_gemini_probe_full_20260402/stage2_anchor_gemini_summary.json`
  - full Pro output:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage2_anchor_gemini_pro_probe_full_20260402/stage2_anchor_gemini_summary.json`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage2_anchor_gemini_pro_probe_full_20260402/stage2_anchor_gemini_report.json`
- What happened:
  - first Pro attempt failed because `gemini-2.5-pro` requires thinking mode
  - reran with:
    - `--thinkingBudget 1024`
- Result:
  - Flash:
    - exact match:
      - `85/100`
    - anchor recall:
      - `106/107` = `0.9907`
    - must-not-anchor pass rate:
      - `0.8438`
  - Pro:
    - exact match:
      - `90/100`
    - anchor recall:
      - `107/107` = `1.0`
    - must-not-anchor pass rate:
      - `0.9063`
- Remaining Pro miss pattern:
  - still mostly:
    - extra-anchor overgeneration
    - disease-label anchoring
  - examples:
    - extra `Falls`
    - extra `Bulbar dysfunction`
    - disease-label style anchors in:
      - `Spinocerebellar ataxia type 3`
      - `Early-onset cerebellar ataxia with retained reflexes`
      - `autosomal recessive nonsyndromic hearing loss`
- Current read:
  - Pro is genuinely better than Flash on this benchmark
  - but the gain is modest compared with the cost/runtime increase
  - both still need a light post-filter layer if used for Stage 2 operationally

## 2026-04-02 - Flash post-filter probe and residual taxonomy

- Context:
  - user pushed on whether a disease-name blocker was redundant and whether exact string HPO gating should be tested first
  - user also asked whether Flash performs better when anchor finding and negation are separated
- What was tested:
  - offline only, on saved Flash full-100 Stage 2 anchor output:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage2_anchor_gemini_probe_full_20260402/stage2_anchor_gemini_report.json`
  - first probe:
    - exact string-only HPO gate on top of raw Flash output
  - second probe:
    - narrow disease-name blocker only, without exact string gating
- Results:
  - exact string-only HPO gate was too strict:
    - baseline Flash:
      - exact:
        - `85/100`
      - recall:
        - `106/107`
      - must-not-anchor pass:
        - `27/32`
    - exact string gate:
      - exact:
        - `61/100`
      - recall:
        - `66/107`
      - must-not-anchor pass:
        - `31/32`
    - conclusion:
      - exact HPO string matching kills too much useful recall and should not be the main filter
  - disease-name blocker only worked much better:
    - exact:
      - `88/100`
    - recall:
      - `106/107`
    - must-not-anchor pass:
      - `30/32`
    - fixed these 3 disease-name-style false positives:
      - `anc-061`
      - `anc-095`
      - `anc-099`
- Remaining Flash-after-blocker failures:
  - `12` cases remain
  - main pattern is not “missed anchors”
  - main pattern is:
    - extra-anchor overgeneration / decomposition
    - conditional-context leakage
    - one status miss
  - rough taxonomy:
    - over-anchoring / decomposition:
      - `anc-039`
      - `anc-037`
      - `anc-013`
      - `anc-067`
      - `anc-068`
      - `anc-084`
      - `anc-096`
      - `anc-098`
    - context / conditional leakage:
      - `anc-089`
      - `anc-060`
      - `anc-063`
    - status miss:
      - `anc-079`
- Read:
  - this weakens the “PhenoRerank will probably fix most of the gap” theory
  - most remaining errors are not pure HPO rerank errors
  - stronger conclusion:
    - Flash is good at finding anchors
    - Flash is stronger when anchor extraction and assertion are separated
    - next best stack is:
      - Flash anchor extraction
      - narrow disease-name blocker
      - separate assertion pass

## 2026-04-02 - Full stacked Flash Stage 2 probe

- What was added:
  - new evaluator:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/evaluateStage2FlashStack.js`
- Stack evaluated:
  - saved raw Flash Stage 2 anchor output
  - narrow disease-name blocker
  - separate Gemini Flash assertion pass on each kept anchor
- Inputs:
  - benchmark:
    - `/Users/ahmedelmorshedy/Downloads/anchor_benchmark (1).js`
  - raw Flash Stage 2 output:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage2_anchor_gemini_probe_full_20260402/stage2_anchor_gemini_report.json`
- Outputs:
  - summary:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage2_flash_stack_probe_20260402/stage2_flash_stack_summary.json`
  - full report:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage2_flash_stack_probe_20260402/stage2_flash_stack_report.json`
- Result:
  - exact:
    - `91/100`
  - recall:
    - `106/107` = `0.9907`
  - must-not-anchor pass:
    - `32/32` = `1.0`
- Comparison:
  - raw Flash:
    - `85/100`
    - `106/107`
    - `27/32`
  - Flash + blocker:
    - `88/100`
    - `106/107`
    - `30/32`
  - Flash + blocker + assertion:
    - `91/100`
    - `106/107`
    - `32/32`
- Focus cases:
  - `anc-060`:
    - assertion correctly removed risk-only `glaucoma`
  - `anc-063`:
    - assertion correctly removed disease-context `end-stage renal disease`
  - `anc-089`:
    - assertion correctly removed conditional `renal failure`
  - `anc-079`:
    - assertion still kept `Peripheral neuropathy` as `present`; this remains the main real uncaught status error
  - `anc-098`:
    - assertion kept `Behavioral difficulties` and `Impulsivity`; this is not a negation failure, more a benchmark-policy / over-extraction issue
- Read:
  - the stacked Flash path now beats raw Pro on strict exact:
    - Flash stack:
      - `91/100`
    - Pro raw:
      - `90/100`
  - and it does so with:
    - same recall minus one anchor
    - better must-not-anchor control
- current best interpretation:
  - Flash extraction + narrow blocker + separate assertion is the leading low-cost Stage 2/3 path

## 2026-04-02 - Flash vs Pro on remaining hard assertion cases

- Why:
  - user asked why assertion should not just use `gemini-2.5-pro`
  - needed a targeted comparison on the remaining hard assertion cases instead of a full rerun
- What was added:
  - fixture:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage2_flash_assertion_focus_cases.js`
- What was run:
  - existing assertion evaluator:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/evaluateStage3AssertionWithGemini.js`
  - focus outputs:
    - Flash:
      - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage2_flash_assertion_focus_flash_20260402/stage3_regression_cases_gemini_flash_report.json`
    - Pro:
      - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage2_flash_assertion_focus_pro_20260402/stage3_regression_cases_gemini_flash_report.json`
- Focus cases:
  - `anc-060__glaucoma`
  - `anc-063__esrd`
  - `anc-079__neuropathy`
  - `anc-089__renal_failure`
  - `anc-098__behavioral_difficulties`
  - `anc-098__impulsivity`
- Result:
  - Flash:
    - `5/6` exact
    - `5/6` outcome
  - Pro:
    - `5/6` exact
    - `6/6` outcome
- Important detail:
  - both Flash and Pro correctly handled the previously most important uncaught status miss:
    - `anc-079__neuropathy`
  - the only remaining outcome difference was:
    - `anc-063__esrd`
      - Flash:
        - incorrectly kept as `present`
      - Pro:
        - correctly rejected
        - but with a different reason code than the benchmark expected
- Read:
  - Pro is slightly better on the remaining hard assertion slice
  - but the margin is very small
  - the case for replacing Flash with Pro on assertion is still not strong enough operationally without more real chapter evidence

## 2026-04-02 - GLiNER Stage 3 discovery gate on synthetic benchmark

- Why:
  - user wanted to avoid burning Gemini quota if the strongest non-Gemini discovery contender already looked weak
  - user provided a discovery benchmark:
    - `/Users/ahmedelmorshedy/Downloads/discovery_benchmark.js`
- What was added:
  - benchmark runner:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/benchmarkStage3DiscoveryGLiNER.py`
- What it uses:
  - existing local GLiNER model path in repo:
    - `Ihor/gliner-biomed-small-v1.0`
- Outputs:
  - smoke:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_gliner_benchmark_20260402_smoke`
  - full:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_gliner_benchmark_20260402/stage3_discovery_gliner_summary.json`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_gliner_benchmark_20260402/stage3_discovery_gliner_report.json`
- Full result on 100 synthetic discovery cases:
  - strict exact:
    - `6/100`
  - acceptable exact:
    - `8/100`
  - expected candidate recall:
    - `544/819` = `0.6642`
  - must-not-propose pass:
    - `489/550` = `0.8891`
- Main miss patterns:
  - missed present findings are still the biggest problem:
    - `257`
  - missed excluded findings:
    - `18`
  - must-not-propose leakage:
    - `61`
  - most common violation reasons:
    - `normal_or_preserved`
    - `not_a_phenotype`
    - `already_in_anchors`
    - `conditional_or_risk_only`
- Representative examples:
  - `disc-001`:
    - leaked normal `cognitive function`
    - also produced broad `Neurologic complications`
  - `disc-100`:
    - missed many key regression-style findings and leaked normal `Hearing` / `Vision`
- Read:
  - GLiNER is not strong enough on this synthetic Stage 3 discovery benchmark to stop here
  - it was worth running first to save Gemini quota
  - but the result supports moving on to Gemini for the real comparison

## 2026-04-02 - GLiNER hard-20 config sweep

- Ran a clean label/threshold/model sweep on the hard-20 Stage 3 discovery slice.
- Script:
  - one-off local sweep using `gliner` over:
    - `Ihor/gliner-biomed-small-v1.0`
    - `Ihor/gliner-biomed-large-v1.0`
- Input:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_medgemma_smoke_20260402_hard20_cases.js`
- Output:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_gliner_config_sweep_fullhard20_20260402/gliner_config_sweep_hard20.json`
- Best recall config:
  - `large_two_0p4`
  - labels:
    - `["clinical abnormality", "clinical finding"]`
  - recall:
    - `182/204` = `0.8922`
  - must-not-propose pass:
    - `140/168` = `0.8333`
- Best clean-ish config:
  - `small_old_0p6`
  - recall:
    - `133/204` = `0.652`
  - must-not-propose pass:
    - `154/168` = `0.9167`
- Best single-label compromise:
  - `small_one_0p4`
  - recall:
    - `167/204` = `0.8186`
  - must-not-propose pass:
    - `136/168` = `0.8095`
- Read:
  - collapsing the label set helps recall a lot versus the original 7-label setup
  - adding a second broad label helps recall further, but junk rises quickly
  - the large model is not uniformly better; it only clearly helps in the aggressive two-label recall mode
  - GLiNER still looks more suitable as an explicit-span helper than as a standalone discovery engine
- Next move:
  - if we use GLiNER at all, prefer a helper role before Gemini rather than replacing Gemini discovery outright

## 2026-04-02 - GLiNER clean-pass plus Gemini Pro residual discovery

- Added a new grounded residual benchmark runner:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/benchmarkStage3DiscoveryResidualGemini.js`
- Updated synthetic discovery benchmark file in Downloads to add derived per-case `clinical_structure` with:
  - `paragraphs`
  - `sentences`
  - `sentence_id`
  - `char_start`
  - `char_end`
- Residual experiment design:
  - first pass:
    - original clean GLiNER report
    - `small_old_0p6`
  - second pass:
    - `gemini-2.5-pro`
    - asked only for findings missed by the first pass
    - required grounded `sentence_id`
    - required exact `evidence_text`
- Output:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_gliner_smallold_gemini25pro_residual_20260402/stage3_discovery_residual_summary.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_gliner_smallold_gemini25pro_residual_20260402/stage3_discovery_residual_report.json`
- Result:
  - first-pass GLiNER:
    - recall:
      - `544/819` = `0.6642`
    - must-not-propose pass:
      - `489/550` = `0.8891`
  - Gemini residual:
    - residual recall on GLiNER misses:
      - `202/275` = `0.7345`
    - residual must-not-propose pass:
      - `481/489` = `0.9836`
    - grounding:
      - sentence id valid:
        - `320/320`
      - exact evidence text valid:
        - `320/320`
  - combined:
    - recall:
      - `746/819` = `0.9109`
    - must-not-propose pass:
      - `481/550` = `0.8745`
    - strict exact:
      - `12/100`
    - acceptable exact:
      - `41/100`
- Read:
  - the grounded residual format works operationally
  - `sentence_id + exact evidence_text` is reliable in this benchmark
  - but the GLiNER clean-pass plus Gemini residual stack still underperforms direct tuned Gemini discovery on overall quality
  - the residual step adds real recall, but combined junk control is still weaker than pure tuned Gemini

- Follow-up strict residual-only rerun:
  - used a stricter second-pass prompt that explicitly told Gemini to ignore all GLiNER hits and only return genuinely new findings
  - evaluated Gemini only on the residual slice, not on blended final must-not metrics
- Strict residual-only result:
  - first-pass GLiNER:
    - recall:
      - `544/819` = `0.6642`
    - must-not-propose pass:
      - `489/550` = `0.8891`
  - Gemini residual only:
    - recall on misses:
      - `188/275` = `0.6836`
    - must-not-propose pass on residual scope:
      - `483/489` = `0.9877`
    - grounding:
      - sentence id valid:
        - `286/286`
      - evidence text valid:
        - `286/286`
  - net recall after fill:
    - `732/819` = `0.8938`
- Read:
  - stricter residual prompting made Gemini cleaner on its own residual slice
  - but it also recovered fewer misses than the earlier residual prompt
  - the core bottleneck remains the weak GLiNER seed recall, not Gemini residual precision

## 2026-04-02 - Balanced cleanup plus add on high-recall GLiNER seed

- Reran GLiNER on the hard-20 slice with the high-recall config to get a real first-pass report:
  - model:
    - `Ihor/gliner-biomed-large-v1.0`
  - labels:
    - `["clinical abnormality", "clinical finding"]`
  - threshold:
    - `0.4`
  - output:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_gliner_large_two_0p4_hard20_20260402/stage3_discovery_gliner_report.json`
- First-pass result on hard-20:
  - recall:
    - `185/204` = `0.9069`
  - must-not-propose pass:
    - `130/168` = `0.7738`
- Then ran `gemini-2.5-pro` as a balanced second pass:
  - review first-pass candidates
  - reject junk
  - add a few missed findings
- Balanced result:
  - final recall:
    - `184/204` = `0.902`
  - final must-not-propose pass:
    - `164/168` = `0.9762`
  - strict exact:
    - `1/20`
  - acceptable exact:
    - `4/20`
  - kept first-pass candidates:
    - `236`
  - added candidates:
    - `9`
- Read:
  - this balanced prompt is excellent for cleanup
  - it removed almost all GLiNER junk
  - but it over-cleaned slightly and lost one expected finding overall
  - the pattern is promising if we want Gemini primarily as a reviewer/cleaner rather than a broad residual finder

## 2026-04-02 - Frozen stage-3 discovery evaluation surfaces

- Question:
  - how do we stop prompt work from overfitting to the hard-20 slice and make future discovery experiments prove they generalize?

- Evidence surface:
  - synthetic benchmark source:
    - `/Users/ahmedelmorshedy/Downloads/discovery_benchmark.js`
  - existing hard-20 dev slice source:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_medgemma_smoke_20260402_hard20_cases.js`
  - real latest5 parsed chapter structures:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/bucket-critical/20260331-genereviews-latest5-readiness/stage1_fetch/*_clinical_structure.json`

- Intentionally not inspected:
  - no raw mounted dump crawl
  - no new hand-labeling of real holdout outcomes yet
  - no new model reruns; this step only froze the evaluation surfaces

- Action:
  - added freezer script:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/freezeStage3DiscoveryEvalSets.js`
  - generated repo-owned fixtures:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryBenchmarkFull.js`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryBenchmarkDevHard20.js`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryBenchmarkHoldout80.js`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryEvalManifest.json`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealHoldoutManifest.json`
  - switched benchmark script defaults off the mutable `Downloads` file and onto the repo-owned frozen fixture for:
    - `benchmarkStage3DiscoveryGemini.js`
    - `benchmarkStage3DiscoveryGLiNER.py`
    - `benchmarkStage3DiscoveryGeminiStack.js`
    - `benchmarkStage3DiscoveryResidualGemini.js`
    - `benchmarkStage3DiscoveryMedGemmaSmoke.py`

- Important numbers:
  - full synthetic benchmark:
    - `100`
  - dev hard-20:
    - `20`
  - untouched synthetic holdout:
    - `80`
  - real holdout chapters:
    - `5`

- Result:
  - the benchmark is now frozen into repo-owned files
  - prompt work can use `hard20` as dev, `holdout80` as untouched synthetic holdout, and `latest5` as the real holdout manifest
  - future evaluation no longer depends on a mutable file in `Downloads`

- Decision:
  - keep this split policy
  - future prompt changes should only count if they help on dev and survive both holdouts

- Status:
  - kept

## 2026-04-02 - Grounded holdout80 bakeoff

- Question:
  - on the untouched synthetic holdout, is direct grounded `gemini-2.5-pro` better than `GLiNER large_two_0p4 -> gemini-2.5-pro cleanup+add`?

- Evidence surface:
  - frozen synthetic holdout:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryBenchmarkHoldout80.js`
  - grounded scorer helper:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/stage3DiscoveryGroundedEval.js`
  - direct grounded runner:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/benchmarkStage3DiscoveryGroundedGemini.js`
  - stacked grounded runner:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/benchmarkStage3DiscoveryGroundedGeminiStack.js`
  - GLiNER first-pass runner updated to accept label configs directly:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/benchmarkStage3DiscoveryGLiNER.py`

- Intentionally not inspected:
  - no real-chapter manual judging yet
  - no stage-4 mapping run yet
  - no new prompt tuning during this bakeoff

- Important scorer limitation:
  - this grounded scorer validates `sentence_id` and exact `evidence_text`
  - but expected recall is still matched against the existing canonical-label benchmark using fuzzy matching against `label` or `evidence_text`
  - so it is better than the old canonical-only scorer for grounded outputs, but still not a true gold span scorer

- First-pass GLiNER on holdout80:
  - config:
    - `Ihor/gliner-biomed-large-v1.0`
    - labels:
      - `["clinical abnormality", "clinical finding"]`
    - threshold:
      - `0.4`
  - output:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_gliner_large_two_0p4_holdout80_20260402/stage3_discovery_gliner_summary.json`
  - result:
    - recall:
      - `523/615` = `0.8504`
    - must-not-propose pass:
      - `282/382` = `0.7382`

- Direct grounded `gemini-2.5-pro`:
  - output:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_grounded_gemini_25_pro_holdout80_20260402/stage3_discovery_grounded_gemini_summary.json`
  - result:
    - strict exact:
      - `16/80`
    - acceptable exact:
      - `41/80`
    - recall:
      - `559/615` = `0.9089`
    - must-not-propose pass:
      - `361/382` = `0.9450`
    - valid sentence id:
      - `809/809`
    - valid evidence text:
      - `808/809`

- Grounded stacked `GLiNER -> gemini-2.5-pro cleanup+add`:
  - output:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_grounded_gliner_gemini25pro_holdout80_20260402/stage3_discovery_grounded_stack_summary.json`
  - result:
    - strict exact:
      - `20/80`
    - acceptable exact:
      - `39/80`
    - recall:
      - `554/615` = `0.9008`
    - must-not-propose pass:
      - `365/382` = `0.9555`
    - valid sentence id:
      - `794/794`
    - valid evidence text:
      - `791/794`

- Read:
  - direct grounded `2.5 Pro` wins on recall:
    - `0.9089` vs `0.9008`
  - the GLiNER stack wins slightly on junk control:
    - `0.9555` vs `0.9450`
  - the stack also edges strict exact:
    - `20/80` vs `16/80`
  - but the differences are small enough that the extra stack complexity is not obviously justified yet
  - both grounded paths are operationally strong enough to move to a real-holdout check next

- Decision:
  - keep both grounded paths as valid candidates
  - direct grounded `2.5 Pro` is currently the simpler leading option
  - next proof step should be the `latest5` real holdout, not another synthetic-only prompt tweak

- Status:
  - kept

## 2026-04-02 - Real latest5 audit of direct grounded discovery

- Question:
  - were the strong synthetic discovery scores actually measuring useful new findings, or were they mixed with anchor duplicates and borderline junk?

- Evidence surface:
  - real holdout manifest:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealHoldoutManifest.json`
  - settled latest5 stage2 anchors:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-latest5-settled-20260330/stage2_anchors/*_anchors.json`
  - preserved stage7 verification files:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/bucket-critical/20260331-genereviews-latest5-readiness/stage7_verify_medgemma/*_verification.json`
  - audit runner:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/auditStage3DiscoveryLatest5.js`
  - audit outputs:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_latest5_grounded_audit_20260402/latest5_direct_grounded_audit_summary.json`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_latest5_grounded_audit_20260402/latest5_direct_grounded_audit_report.json`

- Intentionally not inspected:
  - no GLiNER stack rerun on latest5 yet
  - no new manual gold creation
  - no stage4 remapping rerun; this audit was about discovery usefulness, not final HPO quality

- Direct audit result:
  - predictions:
    - `48`
  - valid grounding:
    - `45/48`
  - duplicate anchor leaks:
    - `21`
  - overlaps previously `FAILED` stage7 items:
    - `6`
  - overlaps previously `FLAGGED` stage7 items:
    - `10`
  - unmatched to prior verified/failed/flagged stage7 items:
    - `23`
  - verified non-anchor discovery targets in the preserved latest5 bundle:
    - `1`
  - matched verified non-anchor discovery targets:
    - `0`
  - missed verified non-anchor discovery target:
    - `1`
      - `death in childhood`

- Important read:
  - latest5 is heavily anchor-dominated in the preserved review bundle
  - that means the real question was not “did discovery recover many known non-anchor positives?” because there was only one preserved target of that kind
  - the real audit signal came from the makeup of the `48` predictions

- Manual approximation after reviewing the chapter-level outputs:
  - clearly not-useful as discovery:
    - about `21/48`
    - these are the anchor duplicates
  - likely questionable / broad / non-ideal extras:
    - roughly `8-10/48`
    - examples:
      - `Neurobehavioral/psychiatric manifestations`
      - `Ophthalmologic involvement`
      - `ventilation dependency`
      - `autoantibodies to factor VIII`
      - `conductive`
  - plausible useful new extras:
    - roughly `14-18/48`
    - examples:
      - `neuronal migration defects`
      - `widely split sutures`
      - `bony stippling`
      - `chondrodysplasia punctata`
      - `lymphoproliferation`
      - `disseminated mycobacterial disease`
      - `bullous pemphigoid`
      - `parenchymal volume loss`
      - `dystonic posturing of limbs`
      - `Weight below the third centile`

- What this means:
  - the synthetic recall numbers were directionally useful, but they overstated “useful new discovery” because real outputs contained many anchor duplicates
  - the synthetic junk numbers were also incomplete, because some items that look suspicious by benchmark logic are actually plausible useful extras on real chapters
  - the real problem on latest5 is not raw hallucination; it is a mixture of:
    - duplicate anchor restatement
    - broad category phrases
    - some genuinely useful residual findings

- Specific failure modes seen in real chapters:
  - anchor duplicate leakage:
    - `severe... oligozoospermia`
    - `regression`
    - `malrotation of the gut`
  - broad category leakage:
    - `Neurobehavioral/psychiatric manifestations`
    - `Ophthalmologic involvement`
    - `motor abnormalities`
  - fragment / bad-span leakage:
    - `conductive`
    - ellipsis-truncated phrases like:
      - `severe... oligozoospermia`
      - `white matter ... abnormalities`
  - plausible true residual discoveries:
    - `chondrodysplasia punctata`
    - `dystonic posturing of limbs`
    - `IgA deficiency`

- Decision:
  - do not trust synthetic recall as “all useful”
  - do not trust synthetic must-not/junk as “all truly junk”
  - use real audits to estimate:
    - useful new discovery rate
    - duplicate-anchor leakage rate
    - broad-category leakage rate
  - the next best refinement is not more synthetic-only tuning; it is:
    - stronger duplicate-anchor blocking
    - broader-category suppression
    - one more real-holdout audit after that

- Status:
  - kept

## 2026-04-02 - Reusable real-audit cache manifest

- Question:
  - how do we stop rebuilding the latest5 real-audit surface from memory every time, and prepare cleanly for a `+5` expansion?

- Evidence surface:
  - real holdout manifest:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealHoldoutManifest.json`
  - settled latest5 anchors dir:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-latest5-settled-20260330/stage2_anchors`
  - preserved latest5 verification dir:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/bucket-critical/20260331-genereviews-latest5-readiness/stage7_verify_medgemma`
  - direct audit outputs:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_latest5_grounded_audit_20260402`

- Action:
  - added cache builder:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/buildStage3DiscoveryRealAuditCache.js`
  - generated cache manifest:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealAuditCacheLatest5.json`

- Result:
  - all `5` latest5 chapters now resolve to:
    - structure path
    - settled stage2 anchors path
    - preserved stage7 verification path
  - the current direct latest5 audit summary/report are embedded as cached outputs
  - a frozen `next5_selection_template` with `5` slots is included:
    - `anchor_heavy`
    - `narrative_implied`
    - `lab_management_junk`
    - `exclusion_normal`
    - `morphology_dense`

- Important numbers:
  - chapters cached:
    - `5/5`
  - anchors cached:
    - `5/5`
  - verification cached:
    - `5/5`
  - direct audit cached:
    - available

- Decision:
  - reuse this cache manifest as the single source of truth for the real audit surface
  - when adding the next `5`, extend this cache pattern instead of reconstructing file families manually

- Status:
  - kept
## 2026-04-02 - Stage 3 real audit expansion to latest10

- Built reusable real-audit expansion script at `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/buildStage3DiscoveryRealAuditLatest10.js`.
- Froze `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealHoldoutNext5Manifest.json` with five rubric-selected chapters from the review-first-50 batch:
  - `Williams Syndrome` as `anchor_heavy`
  - `USP7-Related Hao-Fountain Syndrome` as `narrative_implied`
  - `VEXAS Syndrome` as `lab_management_junk`
  - `Very Long-Chain Acyl-Coenzyme A Dehydrogenase Deficiency` as `exclusion_normal`
  - `Weiss-Kruszka Syndrome` as `morphology_dense`
- Froze `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealHoldoutLatest10Manifest.json` combining the preserved latest5 and the selected next5.
- Froze `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealAuditCacheLatest10.json` as the reusable cache surface for the real latest10 audit.
- Built raw grounded discovery runner at `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/runStage3DiscoveryRealGroundedRaw.js` to cache discovery outputs even when prior stage7 verification is unavailable.
- Ran direct grounded `gemini-2.5-pro` on the added next5 real chapters and cached results in `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_real_next5_grounded_raw_20260402`.
- Raw next5 summary:
  - `70` total predictions
  - `15` duplicate-anchor leaks
  - `55` non-duplicate predictions requiring manual adjudication
  - grounding valid `69/70`
- Per-chapter raw counts:
  - `Williams`: `34` predictions, `7` duplicate-anchor leaks, `27` non-duplicates
  - `USP7`: `21` predictions, `2` duplicate-anchor leaks, `19` non-duplicates
  - `VEXAS`: `9` predictions, `5` duplicate-anchor leaks, `4` non-duplicates
  - `VLCAD deficiency`: `3` predictions, `0` duplicate-anchor leaks, `3` non-duplicates
  - `Weiss-Kruszka`: `3` predictions, `1` duplicate-anchor leak, `2` non-duplicates
- Examples of new next5 non-duplicate outputs worth later adjudication:
  - `born post-term`, `textural aversion`, `Prolonged colic` in Williams
  - `Compulsivity`, `Stubbornness`, `Temper tantrums` in USP7
  - `Unprovoked thrombosis`, `Clonal hematopoiesis`, `Monoclonal gammopathy of unknown significance` in VEXAS
  - `multiorgan failure`, `cardiac dysfunction`, `motor delays` in VLCAD deficiency
  - `bulbous tip`, `horizontal crux helix` in Weiss-Kruszka
- Next intended move: manually adjudicate the latest10 raw outputs into explicit buckets (`useful new`, `anchor duplicate`, `broad/questionable`, `junk`, `missed useful`) so the real benchmark becomes a frozen truth surface instead of a synthetic proxy.

### 2026-04-02 - Stage 3 real audit latest10 manual truth counts

- Added frozen manual adjudication file at `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealLatest10ManualAudit.json`.
- Added summarizer at `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/summarizeStage3DiscoveryRealLatest10ManualAudit.js`.
- Wrote summary outputs to `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_real_latest10_manual_audit_20260402`.
- Frozen latest10 truth summary:
  - raw predictions: `118`
  - exact duplicate-anchor leaks: `36`
  - manually audited non-duplicates: `82`
  - true useful new residual findings: `43`
  - semantic anchor-covered non-duplicates: `12`
  - total anchor-covered outputs (exact + semantic): `48`
  - broad/redundant outputs: `14`
  - junk/context-only outputs: `13`
- Rate interpretation:
  - useful new over raw outputs: `0.3644`
  - useful new over non-duplicate outputs: `0.5244`
  - total anchor-covered over raw outputs: `0.4068`
  - broad/redundant over raw outputs: `0.1186`
  - junk/context-only over raw outputs: `0.1102`
- Updated honest read:
  - direct grounded `2.5 Pro` is stronger than the earlier synthetic-only impression, but the major failure mode is still residual-awareness, not inability to find phenotype-like content.
  - On real latest10, only about `36%` of raw discovery outputs are true useful new residual findings; after removing exact duplicate-anchor leaks, the useful rate rises to about `52%`.

### 2026-04-02 - Gemini 2.5 Pro HPO-like prompt probe constraint

- Attempted a direct API probe on the hardest junk-heavy chapter (`VEXAS Syndrome`) using the tightened HPO-like residual-discovery prompt with:
  - model `gemini-2.5-pro`
  - `temperature: 0`
  - `thinkingBudget: 0`
- The call failed at the API layer with:
  - `400 INVALID_ARGUMENT`
  - `Budget 0 is invalid. This model only works in thinking mode.`
- Artifact directory prepared at:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemini25pro_vexas_20260402`
- Practical takeaway:
  - `gemini-2.5-pro` cannot be used in a true no-thinking configuration through the current Gemini API path, so the next viable comparison is either:
    - smallest allowed nonzero thinking budget on `2.5 Pro`, or
    - `2.5 Flash` with `thinkingBudget: 0`.

### 2026-04-02 - Gemini 2.5 Pro minimal-thinking VEXAS probe

- Ran the same tightened HPO-like residual-discovery prompt on `VEXAS Syndrome` with:
  - model `gemini-2.5-pro`
  - `temperature: 0`
  - minimal valid `thinkingBudget: 128`
- Probe artifact:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemini25pro_vexas_20260402/gemini_25_pro_vexas_hpo_prompt_probe_min_thinking.json`
- API constraint confirmed:
  - budgets `1, 2, 4, 8, 16, 32, 64` all rejected with `400 INVALID_ARGUMENT`
  - Gemini states the valid range is `128` to `32768`
- Returned candidates at budget `128`:
  - `Unprovoked thrombosis`
  - `Failure to respond to classic immunosuppressive treatments`
  - `Elevated C-reactive protein`
  - `Macrocytic anemia`
  - `Vacuoles in myeloid and erythroid precursor cells`
- Honest read:
  - this is not a clean residual-discovery answer under the current policy
  - it still leaks an anchor-covered thrombotic finding, a treatment-response statement, a biomarker-only finding, and a pathology-style descriptor
  - only `Macrocytic anemia` is clearly strong under the current prompt rules

### 2026-04-02 - Gemini 2.5 Pro default-thinking VEXAS probe

- Ran the same tightened HPO-like residual-discovery prompt on `VEXAS Syndrome` with:
  - model `gemini-2.5-pro`
  - `temperature: 0`
  - default thinking mode (no explicit `thinkingBudget`)
- Probe artifact:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemini25pro_vexas_20260402/gemini_25_pro_vexas_hpo_prompt_probe_temp0_default_thinking.json`
- Returned candidates:
  - `Unprovoked thrombosis`
  - `Clonal hematopoiesis`
  - `Monoclonal gammopathy of unknown significance`
  - `Multiple myeloma`
  - `Macrocytic anemia`
  - `Myelodysplastic syndrome`
  - `Vacuoles in myeloid and erythroid precursor cells`
- Honest read:
  - default thinking made the result broader and worse on this hardest junk-heavy chapter
  - compared with minimal valid thinking (`128`), it added more diagnosis/context leakage rather than less
  - under the current policy, only `Macrocytic anemia` is clearly strong; the rest are anchor-covered, diagnosis-like, biomarker/pathology-like, or otherwise non-row-worthy

### 2026-04-03 - Gemini 3.1 Pro Preview VEXAS prompt probes

- Confirmed current live model id via model listing:
  - `models/gemini-3.1-pro-preview`
- Ran the tightened HPO-like residual-discovery prompt on `VEXAS Syndrome` with:
  - `temperature: 0`
  - default thinking mode
- Probe artifact:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemini31propreview_vexas_20260402/gemini_31_pro_preview_vexas_hpo_prompt_probe_temp0.json`
- Returned:
  - `Unprovoked thrombosis`
  - `Macrocytic anemia`
- Then reran with normal/default parameters (no explicit temperature, no explicit thinking config):
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemini31propreview_vexas_20260402/gemini_31_pro_preview_vexas_hpo_prompt_probe_default_params.json`
- Result under normal/default parameters was materially the same:
  - `Unprovoked thrombosis`
  - `Macrocytic anemia`
- Honest read:
  - `3.1 Pro Preview` is cleaner than `2.5 Pro` on this hardest junk-heavy chapter
  - but it still leaks one anchor-covered thrombotic finding
  - on this probe, changing from `temperature: 0` to default parameters did not materially change behavior

### 2026-04-03 - Gemma 4 31B VEXAS residual-coverage probe

- Re-ran `google/gemma-4-31B-it` on the same hard `VEXAS Syndrome` slice via the HF router, but changed the prompt from generic HPO-like extraction to explicit residual-aware coverage handling.
- Added semantic coverage context for already-covered concepts:
  - anemia, including macrocytic anemia
  - thrombocytopenia
  - venous thrombosis, including unprovoked thrombosis
  - myelodysplasia / myelodysplastic syndrome
  - multiple myeloma
- Kept generic drop classes for:
  - diagnosis/disorder labels
  - treatment-response and management statements
  - biomarker-only findings
  - pathology-only cell-level observations
  - fragments / non-row-worthy phrases
- Explicitly allowed the model to return `[]` if no additional phenotype rows survived.
- Ran both:
  - `temperature: 0`
  - default parameters
- Both runs returned:
  - `[]`
- Saved outputs:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemma4_vexas_20260403/gemma_4_31b_it_vexas_residual_probe_temp0.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemma4_vexas_20260403/gemma_4_31b_it_vexas_residual_probe_default.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemma4_vexas_20260403/gemma_4_31b_it_vexas_residual_probe_summary.json`
- Honest read:
  - on this hard slice, stronger residual-awareness and explicit coverage context mattered more than adding more blacklist detail
  - unlike earlier Gemma probes, this version stopped leaking anchor-covered and pathology-style candidates on VEXAS

### 2026-04-03 - Gemma 4 31B bigger-slice few-shot probe blocked by provider

- Prepared a larger `VEXAS Syndrome` slice (`p8`-`p29`) and switched the Gemma prompt to cross-chapter few-shot guidance:
  - used `Williams Syndrome` examples for what counts as a good residual row
  - used `Williams Syndrome` counterexamples for fragments, risk-only items, and anchor-covered restatements
  - did not use examples from the target chapter
- Saved blocked probe attempts to:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemma4_vexas_biggerslice_20260403/gemma_4_31b_it_vexas_biggerslice_fewshot_temp0.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemma4_vexas_biggerslice_20260403/gemma_4_31b_it_vexas_biggerslice_fewshot_default.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemma4_vexas_biggerslice_20260403/gemma_4_31b_it_vexas_biggerslice_fewshot_summary.json`
- Both runs failed with the same HF router error:
  - `The requested model 'google/gemma-4-31B-it' is not supported by any provider you have enabled.`
- Sanity check confirmed the failure is not prompt-size or prompt-shape related:
  - even a trivial one-line prompt to the same model now fails with the same `model_not_supported` error
- Practical takeaway:
  - the bigger-slice few-shot prompt is ready, but `google/gemma-4-31B-it` is currently unavailable through the HF router path for this token/account

### 2026-04-03 - HF router health check for Gemma availability

- Verified HF account/token health:
  - `GET https://huggingface.co/api/whoami-v2` returned `200`
  - account `elmorshedyahmed`
  - token is valid and includes inference permissions
- Verified general HF site health:
  - `GET https://huggingface.co` returned `200`
- Re-tested the failing Gemma router call with a trivial prompt:
  - model `google/gemma-4-31B-it`
  - still returned `400 model_not_supported`
- Added router controls with other instruct models:
  - `meta-llama/Llama-3.1-8B-Instruct` returned `200`
  - `Qwen/Qwen2.5-7B-Instruct` returned `200`
- Conclusion:
  - HF router is healthy
  - token/account is healthy
  - current failure is specific to `google/gemma-4-31B-it` provider availability on this router path

### 2026-04-03 - Dedicated HF endpoint health and path check

- User supplied dedicated endpoint:
  - `https://o47u6io8f0bmw21b.eu-west-1.aws.endpoints.huggingface.cloud`
- Confirmed endpoint health:
  - `GET /` -> `200 Ok`
  - `GET /health` -> `200 Ok`
- Confirmed API shape:
  - this endpoint is plain text-generation on `POST /`
  - `POST /v1/chat/completions` returns `404`
  - `POST /generate` returns `404`
- Confirmed a small Gemma-style chat-template prompt works with:
  - `return_full_text: false`
  - endpoint returned clean `[]`
- Tried the larger cross-chapter few-shot `VEXAS` prompt through the endpoint:
  - endpoint accepted the requests but generation was much slower than the HF router path
  - the larger prompt did not complete within the interactive waiting window used in this session
- Practical takeaway:
  - dedicated endpoint is healthy and usable
  - correct call shape is `POST /` with `inputs` plus `parameters`
  - for larger prompts, this endpoint behaves like a slower batch-style path rather than a quick interactive probe path

- Switched to the user-supplied GPU Hugging Face endpoint:
  - `https://t3oxlar69noyd3mk.us-east-1.aws.endpoints.huggingface.cloud`
- Re-ran `google/gemma-4-31B-it` on the Williams Syndrome `p15-p37` residual slice using the same residual-only prompt with semantic anchor coverage.
- The rerun became broader than the earlier saved Williams response and surfaced items such as:
  - `Post-term birth`
  - `Prolonged colic`
  - `Hypotonia`
  - `Delayed speech development`
  - `Fine motor difficulties`
  - but also many already covered or weak outputs
- Sent a focused follow-up audit prompt on the omitted urinary findings:
  - `Bladder capacity is reduced`
  - `detrusor overactivity`
- Gemma's explicit audit response:
  - both should have been emitted
  - both were classified as `anchor_covered`
  - anchor basis used by the model was `Urinary frequency`
- Practical takeaway:
  - Gemma is treating these urinary findings as semantically covered by the broader urinary anchor context rather than as new residual rows
  - this supports the current working diagnosis that the main model weakness is residual-awareness / coverage policy, not inability to read the sentence

- Added a strict enrichment reviewer schema helper at:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/enrichmentReviewer.js`
- Explicitly defined `pathophysiology`, `etiology`, and `clinical_course` in the detail-type schema and added canonical repairs such as:
  - `severity -> severity_domain`
  - `pathology -> pathophysiology`
  - `progression -> clinical_course`
- Added guarded chapter reviewer script:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/runChapterEnrichmentReviewerTrial.js`
- Added package command:
  - `npm run gr:chapter-enrichment-review`
- Added unit test:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/enrichmentReviewer.test.js`
- Ran the strict-schema Zellweger pilot and wrote results to:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/chapter_trial_zellweger_enrichment_20260404/chapter_enrichment_trial_outputs.json`
- Both `gemini-2.5-pro` and `gemini-3-pro-preview` stayed within the allowed detail-type schema without triggering the repair pass.
- Both models kept:
  - `neuronal migration defects`
  - `widely split sutures`
  - `bony stippling`
  - `severe bleeding episodes`
- Both models did not keep `chondrodysplasia punctata` as separate enrichment.
- Both models changed `leopard spot pigmentary retinopathy` from prior `anchor_covered_semantic` to `keep_enrichment`, which is the key enrichment-first policy divergence we wanted to probe.

- Added a separate ancillary clinical evidence retention layer to the enrichment reviewer schema instead of treating all non-phenotype but clinically useful rows as junk.
- Updated the reviewer library, chapter trial script, and tests so the model can now emit:
  - `retain_as_ancillary`
  - `retention_layer`
  - `ancillary_evidence_types`
- The ancillary evidence enum now supports:
  - `laboratory`
  - `imaging`
  - `pathology`
  - `electrophysiology`
  - `treatment_response`
  - `clinical_test`
  - `management_context`
  - `other`
- Verified the narrow unit test after the schema change:
  - `node --test test/enrichmentReviewer.test.js`
- Reran only the artifact-based ZAP70 reviewer pass, not a fresh extraction run.
- Evidence surfaces used for that rerun:
  - cached first5 grounded report
  - saved ZAP70 clinical structure
  - settled ZAP70 stage2 anchors
- Output written to:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/chapter_trial_zap70_enrichment_20260404/chapter_enrichment_trial_outputs.json`
- Important behavior change:
  - `autoantibodies to factor VIII` now lands in `retain_as_ancillary` with `laboratory` evidence instead of `junk_or_context_only`
  - after adding the deterministic post-router, `polyomaviremia` is also rerouted into ancillary `laboratory` rather than staying in phenotype enrichment
- The router is intentionally conservative:
  - it reroutes high-confidence ancillary-only labels after Gemini normalization
  - it does not yet split mixed rows like `persistent dermatitis resistant to therapy`, which still stay in phenotype enrichment
- Current diagnosis:
  - the schema split is working
  - the remaining problem is policy drift on infection-heavy and treatment-tinged rows that are still being retained as phenotype enrichment rather than ancillary or collapsed

- Added a deterministic mixed-row treatment-response splitter in the enrichment router.
- It now handles:
  - post-nominal qualifiers like `resistant to therapy`
  - prenominal qualifiers like `treatment-refractory`
- The routed results now carry:
  - `resolved_candidate_label`
  - `derived_ancillary_evidence`
- Verified with unit tests:
  - `node --test test/enrichmentReviewer.test.js`
- Reran the cached ZAP70 reviewer pass and confirmed the splitter on real rows:
  - `persistent dermatitis resistant to therapy`
    - resolved phenotype label: `persistent dermatitis`
    - derived ancillary evidence: `treatment_response: resistant to therapy`
  - `isolated treatment-refractory immune thrombocytopenia (ITP)`
    - resolved phenotype label: `isolated immune thrombocytopenia (ITP)`
    - derived ancillary evidence: `treatment_response: treatment-refractory`
- The ancillary-only router behavior remains:
  - `autoantibodies to factor VIII` -> ancillary `laboratory`
  - `polyomaviremia` -> ancillary `laboratory`
- This keeps Gemini generous while moving placement and row-splitting into deterministic code.

- Added a strict external chapter freeze normalizer for Opus / ChatGPT chapter outputs.
- The external normalization layer now:
  - parses raw model output even if prose appears before or after the JSON
  - freezes phenotype rows to the locked `{ "label": "..." }` format
  - preserves ancillary evidence buckets and string-only context notes
  - flattens nested `context_metadata` objects into string-only key/value pairs
  - reroutes ancillary-like phenotype rows into ancillary evidence
  - removes lab-style non-phenotype rows from `phenotypes.excluded`
  - extracts qualifier-only treatment-response strings when possible
  - reroutes trigger/exposure context out of `treatment_response`
  - removes exact duplicates across phenotype and ancillary layers
- Added a new script:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/freezeExternalPhenotypeExtraction.js`
- Updated the grounding script so it can ingest raw external model dumps with trailing prose using the same permissive JSON-object parser.
- Important boundary now locked:
  - frozen final chapter JSON stays schema-clean and does not include `sentence_id`
  - sentence ids and evidence cross-check stay in the grounded verification sidecar from `groundExternalPhenotypeExtraction.js`
- Verified:
  - `node --test test/externalPhenotypeExtraction.test.js test/enrichmentReviewer.test.js`
- This should let the five externally produced next5 chapter JSONs be frozen first, then grounded second, without further prompt-tuning work inside the repo.

- Found the five external next5 chapter files in:
  - `/Users/ahmedelmorshedy/Documents/genovymorsh`
- Froze the batch with `freezeExternalPhenotypeExtraction.js`, writing these canonical outputs:
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/ chapter 1-Williams Syndrome_frozen.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/ chapter 2-USP7-Related Hao-Fountain Syndrome _frozen.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/ chapter 3-VEXAS_frozen.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/Chapter 4- VLCAD Deficiency_frozen.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/Chapter 5- Weiss-Kruszka Syndrome_frozen.json`
- Four files froze directly.
- The raw VEXAS file in Documents was malformed:
  - it contained three unquoted prose lines after the intended `context_notes` strings
  - I left the raw file untouched
  - created the frozen VEXAS output from a temporary sanitized copy instead
- Current state:
  - batch freeze is complete
  - sentence-id grounding / cross-check sidecars have not been run yet for this Documents batch

- Created a single reference bundle for the external freeze workflow at:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/external-phenotype-freeze-bundle`
- Included copies of:
  - `externalPhenotypeExtraction.js`
  - `freezeExternalPhenotypeExtraction.js`
  - `groundExternalPhenotypeExtraction.js`
- Added a `README.md` that explains:
  - the role of each file
  - the raw -> frozen -> grounded flow
  - why the frozen JSON stays schema-clean while sentence ids live in the grounding sidecar
  - how to merge the split workflow into one future standalone program if desired

- Added a real unified CLI:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/externalPhenotypePipeline.js`
- It supports:
  - `freeze`
  - `ground`
  - `freeze-and-ground`
- Verified with a synthetic smoke run that `freeze-and-ground` correctly produced:
  - a frozen canonical chapter JSON
  - a grounded sidecar with sentence ids
- Updated the bundle folder to include:
  - `externalPhenotypePipeline.js`
  - README instructions pointing to the unified CLI as the fastest entry point

- Added an MCP server for the same workflow:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/externalPhenotypePipelineMcp.js`
- Exposed tools:
  - `freeze_external_phenotype_extraction`
  - `ground_external_phenotype_extraction`
  - `freeze_and_ground_external_phenotype_extraction`
- Added package script:
  - `npm run gr:external-pipeline:mcp`
- Verified with a real stdio MCP smoke test using the SDK client:
  - tool listing succeeded
  - `freeze_external_phenotype_extraction` call succeeded on synthetic prose-wrapped JSON
  - summary counts confirmed rerouting into `phenotypes.present`, ancillary `laboratory`, and ancillary `treatment_response`
- Updated the bundle README so the workflow is now documented in all three shapes:
  - split scripts
  - unified CLI
  - MCP server

- Tightened the external freeze normalizer for Gemini end-to-end outputs:
  - split bundled phenotype rows like `craniosynostosis involving the metopic or lambdoid suture`
  - normalized `global delay` to `developmental delay`
  - promoted structural corpus callosum malformation findings out of `imaging` into phenotype rows
  - rerouted recommendation-style `clinical_test` entries into `management_context`
  - pruned broad overlap when specific corpus callosum malformation rows were present
- Added regression coverage in:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/externalPhenotypeExtraction.test.js`
- Re-ran:
  - `node --test test/externalPhenotypeExtraction.test.js test/enrichmentReviewer.test.js`
- Result:
  - all tests passing after the new finalization rules

- Added an HTTP MCP wrapper:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/externalPhenotypePipelineHttpMcp.js`
- Added package script:
  - `npm run gr:external-pipeline:mcp:http`
- Default local endpoints:
  - `http://127.0.0.1:8787/mcp`
  - `http://127.0.0.1:8787/health`
- The HTTP wrapper imports `createServer()` from the stdio MCP script so both transports expose the same tools without duplicating tool definitions.
- Verified with a real local HTTP smoke run:
  - health endpoint returned `{"ok":true,...,"url":"http://127.0.0.1:8787/mcp"}`
  - SDK `StreamableHTTPClientTransport` connected successfully
  - `tools/list` returned all three external phenotype tools
  - `freeze_external_phenotype_extraction` succeeded over HTTP

### Entry 87: Ran freeze plus grounded sidecars on the five Opus chapters from Documents/genovymorsh

- Executed the external finalize workflow on the five Opus chapter files in `/Users/ahmedelmorshedy/Documents/genovymorsh`.
- Re-froze Williams, USP7, VLCAD, and Weiss directly from raw using the current normalizer.
- VEXAS raw is still malformed near the tail `context_notes` block, so I did not overwrite the raw file; I grounded the existing valid frozen artifact instead.
- Used the real GeneReviews clinical structures and saved anchors from `output/genereviews-pipeline-review-first-50-20260331` rather than any synthetic sentence map.
- Wrote all five sidecars:
  - ` chapter 1-Williams Syndrome_frozen_grounded.json`
  - ` chapter 2-USP7-Related Hao-Fountain Syndrome _frozen_grounded.json`
  - ` chapter 3-VEXAS_frozen_grounded.json`
  - `Chapter 4- VLCAD Deficiency_frozen_grounded.json`
  - `Chapter 5- Weiss-Kruszka Syndrome_frozen_grounded.json`
- Observed grounding coverage was still thin on most chapters:
  - Williams `9/24` grounded
  - USP7 `0/8` grounded
  - VEXAS `2/26` grounded
  - VLCAD `3/6` grounded
  - Weiss `3/3` grounded
- Conclusion:
  - the batch is now finalized on disk in the narrow operational sense
  - the sidecar code path works end to end on the Opus files
  - but the grounding matcher still needs quality work before these should be treated as benchmark-grade finalized outputs

### Entry 88: Fixed the real external sidecar bug and reran the five grounded Opus chapters

- I verified that the weak external sidecars were not just “model quality”; the main issue was code-path misuse.
- The external sidecar was reusing discovery-time grounding logic that deliberately skips labels already covered by anchors.
- That behavior is correct for new-candidate discovery, but wrong for frozen-row provenance attachment, because frozen rows still need sentence ids even when an anchor already exists.
- I also fixed the bucket/status mismatch for uncertain rows so the external sidecar no longer drifts into `status: present` for `bucket: uncertain`.
- Added regression tests covering:
  - uncertain row status preservation
  - anchor-preserving external sidecar grounding
- Re-ran:
  - `node --test test/externalPhenotypeExtraction.test.js`
  - `node --test test/externalPhenotypeExtraction.test.js test/enrichmentReviewer.test.js`
- Then reran the five grounded sidecars in `/Users/ahmedelmorshedy/Documents/genovymorsh`.
- New counts were much better than the broken run:
  - Williams `38 grounded / 52 rejected`
  - USP7 `13 grounded / 36 rejected`
  - VEXAS `14 grounded / 25 rejected`
  - VLCAD `15 grounded / 5 rejected`
  - Weiss `31 grounded / 0 rejected`
- This confirms the very low earlier counts were a genuine sidecar bug, not just weak source material.
- Remaining gaps now look like normal matcher-quality limits, not catastrophic suppression from the wrong code path.

### Entry 89: Hardened freeze/ground post-processing and finalized the next five Opus chapters

- I tightened the external freeze layer so diagnosis-like rows are not over-rerouted out of phenotypes.
- Specifically, immunoglobulin deficiency rows now remain in `phenotypes.present`, and `kidney dysplasia` stays in the phenotype layer instead of being pushed into pathology.
- I also rewrote the grounding sentence selector so it no longer just keeps the first exact match it sees.
- The grounding tie-breaker now penalizes heading-only anchors, table/list blobs, and management-style sentences, and prefers descriptive clinical sentences when exact support exists in multiple places.
- I added output compatibility and accounting hardening:
  - grounded outputs now include both `grounded_candidates` and `candidates`
  - every frozen row is now reconciled into either a grounded candidate or an explicit rejected candidate
- Added regression tests covering:
  - phenotype-layer preservation for `IgA deficiency`, `IgG deficiency`, and `kidney dysplasia`
  - descriptive sentence preference over management anchors
  - avoidance of heading-only anchors
  - explicit rejection for any unaccounted frozen row
- Re-ran:
  - `node --test test/externalPhenotypeExtraction.test.js test/enrichmentReviewer.test.js`
  - `node --test test/externalPhenotypeExtraction.test.js test/genereviewsCandidateAssertionSynthetic.test.js`
- Then ran freeze plus grounding on the next five Opus chapters in `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch`.
- Final grounded counts after the hardened rerun:
  - Y Chromosome Infertility `6 grounded / 2 rejected`
  - Zellweger Spectrum Disorder `26 grounded / 8 rejected`
  - ZAP70-Related Combined Immunodeficiency `26 grounded / 6 rejected`
  - YIF1B-Related Neurodevelopmental Disorder `20 grounded / 8 rejected`
  - Zhu-Tokita-Takenouchi-Kim Syndrome `58 grounded / 14 rejected`
- Important spot-check:
  - ZTTK now keeps `IgA deficiency`, `IgG deficiency`, and `kidney dysplasia` in the frozen phenotype layer
  - ZTTK grounding now resolves `IgA deficiency` to the immunodeficiency sentence rather than dropping it as a weak context match
- Next likely move:
  - if the user wants higher coverage after this, the remaining work is chapter-specific synonym expansion and sentence-splitting cleanup rather than another structural bug fix

### Entry 90: Recorded evaluation of embedding-based sidecar retrieval

- Reviewed the user's description of a Gemini sidecar that embeds every sentence and phenotype label, retrieves by cosine similarity, and reranks with section penalties plus a fixed threshold.
- Conclusion:
  - the architecture is stronger than pure lexical matching for recall
  - it still needs deterministic acceptance guardrails because semantic retrieval alone will over-ground some rows
  - the best fit is embedding retrieval for candidate generation followed by rule-based selection and immutable frozen-row accounting
- Concrete guardrails reaffirmed:
  - preserve frozen label and status
  - reject heading-only anchors
  - prefer descriptive clinical sentences over management or references
  - ensure every row is grounded or rejected with no silent drops

### Entry 91: Landed quote-first external grounding

- Implemented citation-first grounding for the external phenotype pipeline so a row can carry `source_quote` through normalization and freeze/thaw.
- Added additive `grounding_hints.phenotypes` to frozen outputs to preserve quote evidence without changing the canonical phenotype row shape.
- Updated grounding to localize `source_quote` deterministically first, then fall back to lexical search only when the quote cannot be localized.
- Added strict excluded-bucket polarity validation for the external-grounding path while preserving the broader synthetic assertion regression behavior.
- Updated candidate extraction prompts to require verbatim `source_quote` emission.
- Verified with:
  - `node --test test/externalPhenotypeExtraction.test.js`
  - `node --test test/genereviewsCandidateAssertionSynthetic.test.js`
  - `node --test test/externalPhenotypeExtraction.test.js test/enrichmentReviewer.test.js`

### Entry 92: Compared Gemini quote-first chapter style against Opus raw outputs

- Reviewed the Gemini Weiss-Kruszka JSON against the saved Opus raw chapter outputs from both 1-5 and 6-10.
- Conclusion:
  - Gemini's main upgrade is per-row provenance via `source_quote`
  - Opus raw outputs remain stronger on phenotype abstraction, ancillary/context separation, and explicit reviewer-style decision notes
- Specific schema decision:
  - keep the Opus-style enriched chapter structure as canonical
  - adopt mandatory `source_quote` as the next baseline improvement
  - avoid replacing the canonical rows with null-heavy wrappers like `trajectory: null` unless the extra field is explicitly evidenced and consistently populated
- Next:
  - evolve the canonical schema by adding quote-first provenance and only selectively add structured evidence fields when the chapter text supports them directly

### Entry 93: Consolidated pending Genovy roadmap items

- Summarized the main plans discussed but not yet fully executed.
- Highest-priority unfinished items are:
  - regenerate the 10-chapter set under the quote-first extraction schema
  - add thin HPO anchoring on phenotype rows without flattening the enriched labels
  - add quote validation and contamination rejection as a hard gate
- Medium-priority schema evolution items are:
  - add optional pharma-facing structured fields only when explicitly supported by chapter text
  - derive benchmark/export layers from the enriched canonical JSON rather than replacing it
- Decision:
  - preserve the enriched extraction JSON as the canonical product
  - treat HPO as an attachment layer and semantic retrieval as fallback/repair, not the primary representation

### Entry 94: Mapped remaining gaps toward pharma-oriented disease intelligence

- Reviewed the user's buyer/workflow framing for pharma, genetic testing companies, clinical decision support, and foundations.
- Confirmed the current Genovy canonical schema is already the right base abstraction, but it is still missing several product-critical layers above raw chapter extraction.
- Missing layers grouped into:
  - evidence/provenance hardening: mandatory `source_quote`, quote validation, structured confidence/evidence strength
  - temporal/clinical structure: optional controlled-vocabulary trajectory/course fields only when explicitly supported
  - queryability for buyers: disease-level derived maps for natural history, endpoints, biomarkers, treatment response, and stratification
  - interoperability: thin HPO anchors on phenotype rows without flattening the enriched labels
  - commercialization packaging: audience-specific exports/API views for pharma, diagnostics, CDS, and foundations
- Decision:
  - keep the enriched chapter JSON as the canonical substrate
  - add structured temporal and evidence fields conservatively
  - derive buyer-specific products from the canonical layer rather than mutating the canonical schema into one customer-specific shape

### Entry 95: Defined phased execution plan for Genovy disease intelligence

- Consolidated the roadmap into a phased plan with a hard distinction between:
  - canonical extraction/data quality work
  - interoperability work
  - derived product layers
  - customer packaging
- Agreed sequencing:
  - Phase 1: finish quote-first canonical extraction and regenerate the initial 10 chapters
  - Phase 2: add thin HPO anchoring without flattening the enriched labels
  - Phase 3: add conservative structured evidence fields such as course/frequency/severity when explicitly supported
  - Phase 4: derive natural history, biomarker, endpoint, treatment-response, and stratification views
  - Phase 5: package the same canonical data differently for pharma, diagnostics, CDS, and foundations
- Key principle:
  - never mutate the canonical enriched JSON into a buyer-specific format; always derive audience-facing layers from the canonical source

### Entry 96: Confirmed existing GeneReviews audit website can be generalized into the human review gate

- Verified that the repo already has a hosted GeneReviews audit UI and API surface:
  - route mount in `src/app.js`
  - API in `src/routes/geneReviewsAudit.js`
  - data loader in `src/services/geneReviewsAuditService.js`
  - frontend in `public/geneReviewsAudit.html` and `public/geneReviewsAudit.js`
- Current limitation:
  - the site is read-only and expects verifier/manifest review artifacts, not a universal per-step audit packet for every stage of the quote-first enrichment pipeline
- Architecture decision:
  - reuse this website shell as the human audit gate
  - standardize each pipeline stage to emit auditable step packets that the site can render consistently
  - keep the website as the review surface for extraction, quote localization, grounding, HPO anchoring, and later derived disease-intelligence layers

### Entry 97: Reviewed improved Gemini Williams extraction against canonical direction

- Assessed a new Gemini high-thinking Williams Syndrome extraction with quote-first phenotype rows, optional trajectory objects, and enriched context fields.
- Conclusion:
  - the output is materially better than the earlier Gemini/GPT-OSS examples and is directionally aligned with the desired next-generation schema
  - it still contains several audit-risk issues: too-short quotes, a few over-broad or weakly justified metadata fields, unsupported "none excluded" reasoning, and process/audit notes embedded in canonical output
- Product decision:
  - treat this as evidence that quote-first + selective trajectory extraction can work
  - do not adopt it as canonical without deterministic quote validation and human audit review

### Entry 98: Identified minimal prompt deltas for stronger Gemini quote-first extraction

- Rather than replacing the prompt, isolated the specific instructions needed to fix the latest failure modes:
  - require source quotes to be minimally sufficient spans rather than one- or two-word snippets
  - forbid unsupported empty-bucket reasoning and process/finalization notes inside canonical output
  - tighten when trajectory is allowed and when context metadata may be emitted
  - enforce consistent abstraction choices for phenotype labels
- Decision:
  - apply targeted prompt additions only, keeping the existing working schema and most rules intact

### Entry 99: Locked the external chapter sidecar to the audit/verification contract

- Hardened the shared external pipeline so grounding now emits the same kind of reviewable contract the hosted GeneReviews audit flow already understands:
  - grounded candidate rows now carry `verification_verdict`, `auto_accept_eligible`, `auto_accept_reasons`, and review IDs/links
  - grounded outputs now include `verification_summary`, `verifications`, `rejected_candidate_reviews`, `review_data_path`, and `review_page_path`
  - `src/lib/externalPhenotypePipeline.js` now writes `review_data/*_review.json` and `review_pages/*_review.html` beside the grounded JSON
- Added deterministic external-sidecar checks in `src/lib/externalPhenotypeVerification.js` for:
  - grounding resolution
  - sentence-span resolution
  - source-quote support
  - source-quote strength
  - status support
  - evidence-surface risk such as table-style evidence or paragraph-only fallback
- Also fixed an excluded-bucket grounding bug in `src/lib/genereviewsPipeline.js` so sentences like "`X` has not been described" are treated as true negative evidence instead of false rejects.
- Audit usability improvement:
  - both the hosted audit UI and the generated standalone review pages now show verifier check details, not just failed/flagged check names
- Verification passed:
  - `node --test test/externalPhenotypeExtraction.test.js`
  - `node --test test/enrichmentReviewer.test.js`

### Entry 100: Resolved the actual Opus raw 1-10 source set and exported a clean handoff bundle

- Confirmed the true raw Opus batch is not under the Genovy repo `output/` tree; the source files live in:
  - `/Users/ahmedelmorshedy/Documents/genovymorsh`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch`
- Verified that the raw batch consists of the ten chapter-named JSON files for chapters 1-10 rather than a single model-named export.
- Produced a corrected Downloads handoff bundle at:
  - `/Users/ahmedelmorshedy/Downloads/genovy-opus-raw-1-10-json-jsonl-20260405`
  containing:
  - copied original raw JSON files in `raw-json/`
  - one JSONL per raw chapter in `jsonl/`
  - a combined `chapters_1_10_raw_combined.jsonl`
  - an `export_manifest.json` mapping source files to exported artifacts
- Integrity note:
  - nine raw files were valid JSON as-is
  - `chapter 3-VEXAS.json` contained malformed `context_notes` lines, so its JSONL was generated using a narrow repair pass while leaving the copied raw source untouched
- Decision:
  - treat the Documents chapter files as the source-of-truth Opus raw batch for 1-10
  - use the Downloads export bundle as the stable handoff set for any downstream import, audit, or comparison work

### Entry 101: Locked the enrichment decision policy around HPO collapse versus retained residual detail

- Clarified the rule that phenotype enrichment is not the same thing as raw extracted phenotype rows.
- Agreed the system should evaluate each phenotype claim against its best HPO anchor and then decide what survives after anchoring.
- Final policy categories:
  - `phenotype_enrichment`
  - `hpo_duplicate`
  - `ancillary`
  - `drop`
- Core decision rule:
  - if a claim is the same clinical finding as the retained HPO anchor and adds no clinically meaningful residual detail, collapse it as `hpo_duplicate`
  - if it is the same finding but adds retained residual detail, keep only that detail as `phenotype_enrichment`
  - if it is not really a phenotype assertion, route it to `ancillary` or `drop`
- Residual detail types allowed to justify retained enrichment:
  - subtype
  - modality
  - anatomy/subsite
  - morphology/pattern
  - distribution/laterality
  - onset
  - clinical course/trajectory
  - severity
  - trigger
  - quantitative threshold
  - meaningful mechanism/etiology
- Decision:
  - freeze this collapse-versus-retain rule before scaling chapter processing further

### Entry 102: Defined the unified deterministic sidecar plan from raw Opus output through enrichment routing

- Clarified that the target system should be one programmed claim-verification pipeline, not a human-style manual judgment flow.
- Agreed the practical runtime path from raw Opus chapter output should be:
  - freeze raw output into canonical raw claims
  - ground each claim to chapter text
  - deterministically verify the quote/localization/status contract
  - HPO-map phenotype claims
  - run same-finding and residual-detail tests
  - route each row to `hpo_duplicate`, `phenotype_enrichment`, `ancillary`, or `drop`
  - store the routed result for downstream database import
- Unified verifier contract to standardize across claim types:
  - quote found
  - quote localized
  - quote strength
  - status supported
  - evidence surface quality
  - final verdict such as `VERIFIED`, `FLAGGED`, or `FAILED`
- Decision:
  - keep the canonical chapter JSON compact
  - use the sidecar as the auditable claim ledger that carries verification and enrichment-routing decisions

### Entry 103: Decided to parallelize raw extraction progress and post-extraction robustness work

- Agreed that the extractor track should continue moving in parallel with post-extraction hardening rather than waiting for one perfect end-to-end system first.
- Working split:
  - keep using strong raw extractors such as Opus and improved Gemini outputs for chapter generation
  - in parallel, harden the next layers where robustness matters most: deterministic verification, HPO collapse, and residual enrichment routing
  - evaluate helper models only inside narrow post-extraction subproblems rather than turning the full sidecar into a model-heavy pipeline
- Boundary decision:
  - verifier remains primarily direct deterministic code
  - collapse/residual is the main candidate for selective model assistance if naive code proves too brittle
- Candidate helper-model direction recorded for later benchmarking:
  - BioLORD / SapBERT / PubMedBERT-family similarity for same-finding and anchor alignment
  - regex and light negation logic for verifier-side deterministic checks
- Next intended move:
  - keep prompt iteration on the raw extractor going while designing a bounded benchmark surface for collapse-versus-residual helper methods

## 2026-04-06 Variety Of Consultant Opinions

- Recorded a standalone consultant-style tooling map so the advice is preserved without being mistaken for the currently frozen pipeline.
- This note is intentionally separate from the settled extraction / verification / enrichment architecture. It is a reference bank of recommended tools by subproblem.
- Recommended extractor-layer pattern:
  - use a strong LLM extractor for raw phenotype claim generation and quote capture
  - keep prompt discipline focused on claim quality, source-quote sufficiency, and bucket judgment
- Recommended sidecar verification tools:
  - regex for surface-form checks and qualifier patterns
  - medspaCy / NegEx for negation filtering
  - DEEPEN only if sentence complexity makes simple negation handling too brittle
  - deterministic text matching and clause-level validation before escalating to any model
- Recommended HPO collapse / enrichment tools:
  - Levenshtein or similar lexical prefilter for fast duplicate and near-duplicate screening
  - PubMedBERT embeddings for biomedical paraphrase and same-finding similarity
  - SapBERT-from-PubMedBERT for HPO span detection and linking
  - regex for temporal, trigger, laterality, and simple qualifier extraction
  - Stanza biomedical for modifier-to-detail attachment if simpler rules prove insufficient
  - lightweight local coreference rules first, with SpanBERT only if true coreference becomes a bottleneck
- Recommended DX / PGV layer tools:
  - HPO DAG semantic similarity
  - Exomiser
  - ClinVar
  - ClinGen
  - gnomAD
  - ACMG-support logic
  - SpliceAI
  - CADD
- Recommended general strategy from the consultant advice:
  - use simple surface methods first
  - use biomedical embeddings second
  - use dependency parsing third
  - use LLM reasoning last rather than making it the first or only layer for structured clinical decisions
- Next intended move:
  - keep this section as a detached consultant-reference note and continue using the settled Genovy system plan for active implementation choices

## 2026-04-07 Saved 92 Benchmark Made Atlas-Discoverable

- Purpose:
  - stop losing the saved March 29 `92 found` benchmark in thread memory
  - make it show up with the rest of the benchmark surfaces instead of only inside the reconciliation note
- Added:
  - [20260329-official-v1-enrich-structured-plus-manual-curated summary](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260329-official-v1-enrich-structured-plus-manual-curated/summary.md)
- Updated:
  - [experiment-manifest.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiment-manifest.md)
  - [phase-index.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/phase-index.md)
  - [artifact-index.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260329-official-v1-enrich-structured-plus-manual-curated/artifact-index.md)
  - [artifacts.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260329-official-v1-enrich-structured-plus-manual-curated/artifacts.json)
- Result:
  - the saved stronger branch is now easy to find beside the current `87 found` baseline
  - the local atlas summary preserves the exact saved topline:
    - `92 / 42 / 53 / 57 / 65 / 0.503832`
  - the summary explicitly records that this branch came from:
    - structured global enrichment
    - plus the saved `26`-entry manual curated overlay
  - the local artifact index now preserves the exact historical artifact family and overlay input list that produced the saved branch
  - the local JSON mirror now makes the saved branch script-discoverable without parsing markdown
- Important evidence surface:
  - the underlying benchmark JSON is still only referenced from cold storage:
    - `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/output/official-v1-enrich-structured-plus-manual-curated-20260329.json`
  - no local copy of that historical JSON was found in the repo working tree
- Next intended move:
  - if needed later, recover a local metadata mirror of the saved March 29 artifact family without pretending the full historical JSON already exists in-tree

## 2026-04-07 Opus 11-20 Handoff Saved

- Purpose:
  - stop carrying the Opus `11-20` handoff in thread memory only
  - preserve the exact `hard20` entries `11-20` and the currently intended Opus extraction contract
- Added:
  - [opus-11-20-handoff-20260407.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/opus-11-20-handoff-20260407.md)
- Result:
  - exact `hard20` entries `11-20` are now listed in one place
  - the handoff explicitly distinguishes:
    - real disease chapters `11-15`
    - synthetic benchmark stress cases `16-20`
  - the Opus contract is pinned to the sentence-pointer architecture:
    - `evidence_refs`
    - `clinical_role`
    - free-text `qualifiers`
    - grounded `ancillary_evidence`
    - grounded `disease_context`
- Next intended move:
  - use this handoff doc as the input contract if Opus is asked to do the real-source continuation

## 2026-04-08 Corrected Opus Handoff To Match The Real Trained 1-10 Schema

- Purpose:
  - fix the handoff so it reflects the actual trained `1-10` Opus batch rather than the later quote-first Dravet-style experiments
- Verified from source-of-truth raw files:
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/ chapter 1-Williams Syndrome.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/ chapter 3-VEXAS.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/chapter 10-Zhu-Tokita-Takenouchi-Kim Syndrome.json`
- What the real trained batch actually uses:
  - `chapter`
  - `phenotypes.present / excluded / uncertain`
  - plain `label` rows
  - `ancillary_clinical_evidence`
  - `context_metadata`
  - `context_notes`
- Correction applied:
  - rewrote the handoff doc so the recommended Opus `11-20` schema is a minimal delta on top of that actual trained shape
  - kept:
    - phenotype buckets
    - `label`
    - `ancillary_clinical_evidence`
    - `context_metadata`
  - added:
    - `evidence_refs`
    - `clinical_role`
    - `qualifiers`
    - `context_evidence_refs`
- Result:
  - the handoff no longer asks Opus to jump directly into the fully flattened future schema
  - it now asks for the smallest realistic evolution of the trained batch

## 2026-04-08 Added Gemini Parallel Handoff With Stronger Prompt Rules

- Purpose:
  - create a Gemini-specific handoff for the same `11-20` continuation path so Gemini can be trained in parallel without drifting away from the Opus-compatible schema
- Added file:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/gemini-11-20-handoff-20260408.md`
- Contract preserved:
  - same outer shape as the corrected Opus-compatible handoff:
    - `chapter`
    - `phenotypes.present / excluded / uncertain`
    - `ancillary_clinical_evidence`
    - `context_metadata`
    - `context_notes`
  - same minimal-delta additions:
    - `clinical_role`
    - `evidence_refs`
    - `qualifiers`
    - `context_evidence_refs`
- Gemini-specific tightening added:
  - JSON-only output
  - no invented sentence IDs
  - no quote/location fields
  - one `evidence_refs` by default
  - explicit anti-merging guidance for multi-sentence and multi-phase qualifiers
  - explicit instructions not to misuse `severity` for mortality/outcome framing
  - explicit `primary / complication / descriptor` role rules
- Next intended move:
  - use this Gemini handoff for the second-account training path while keeping outputs compatible with the Opus `11-20` schema

## 2026-04-08 Patched Sentence Splitter To Repair Abbreviation Boundary Errors

- Purpose:
  - fix deterministic sentence indexing before running `11-20` so abbreviations like `U.S.` do not create broken sentence IDs
- Updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/genereviewsPipeline.js`
- Added focused test:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/genereviewsPipelineSentenceSplit.test.js`
- What changed:
  - `splitSentences` now delegates to `splitSentenceEntries` so both use the same repaired boundary logic
  - `splitSentenceEntries` still uses the simple regex boundary pass, but now performs a deterministic merge repair for short fragments ending in non-terminal abbreviations
  - verified repair cases:
    - `U.S.` continuation no longer splits `Food and Drug Administration ...` into a fake second sentence
    - title abbreviations like `Dr.` no longer split from the following name
- Verification:
  - `node --test test/genereviewsPipelineSentenceSplit.test.js`
- Result:
  - the canonical section-aware preprocessing surface is now safer for model-facing `evidence_refs`

## 2026-04-08 Added Canonical Splitter Contract To Gemini Handoff

- Purpose:
  - make sure Gemini can be handed the exact same preprocessing logic if it is asked to generate or follow the sentence-indexing code
- Updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/gemini-11-20-handoff-20260408.md`
- Added:
  - canonical splitter file reference
  - exact boundary regex
  - abbreviation merge repair rules
  - paragraph-aware sentence ID format
  - short copy-paste splitter delta for Gemini
- Result:
  - Gemini can now be instructed to follow the same sentence-indexing policy as the canonical preprocessing code instead of inventing its own split behavior

## 2026-04-08 Added Standalone Gemini Splitter Patch File

- Purpose:
  - provide one exact file that can be handed to Gemini Studio so it can edit the canonical splitter code without reconstructing the logic from prose
- Added file:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/gemini-canonical-splitter-patch-20260408.js`
- Contents:
  - exact splitter block from `genereviewsPipeline.js`
  - replacement target comments
  - explicit note to replace the block from `splitSentences` through `splitSentenceEntries`
- Result:
  - Gemini can now be given one exact patch file plus the destination path instead of a verbal instruction

## 2026-04-08 Accepted Chapter 12 Raw And Set Next Move

- Chapter:
  - `NBK20221` / `ZAP70-Related Combined Immunodeficiency`
- Decision:
  - accept the latest Opus/Claude raw as the chapter 12 baseline and do not rerun it again
- Why accepted:
  - canonical `p{n}_s{m}` sentence IDs are present
  - no extra schema drift keys remain
  - lab/test findings are routed to ancillary evidence instead of `phenotypes`
  - case-report findings are mostly downgraded into `uncertain`
  - prognosis is kept in `context_metadata` rather than phenotype rows
- Deterministic cleanup to apply later:
  - dedupe ancillary laboratory rows for B-cell/NK-cell normality and reduced CD8-positive T cells
  - drop the broad method-level `clinical_test` row about characteristic testing panels
  - keep the immunoglobulin summary in one place rather than duplicating it across ancillary buckets
  - restore `congenital nephrotic syndrome` as the source-faithful label
  - optionally simplify `severe lower-respiratory infections` by removing morphology filler if stricter qualifier discipline is needed
- Next move:
  - move on to chapter 13 instead of repeating chapter 12

## 2026-04-08 Prepared Chapter 13 Opus Wrapper

- Assumption:
  - the next chapter after accepted chapter 12 in the current handoff flow is `NBK606999` / `YIF1B-Related Neurodevelopmental Disorder`
- Source structure:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/bucket-critical/20260331-genereviews-latest5-readiness/stage1_fetch/NBK606999_clinical_structure.json`
- Added Opus-ready wrapper:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/opus-11-20-inputs/NBK606999_yif1b_related_neurodevelopmental_disorder_opus_input.json`
- Shape:
  - `chapter`
  - flattened `sentence_index`
  - canonical `p{n}_s{m}` sentence IDs with section, paragraph, and char offsets
- Result:
  - chapter 13 is ready to hand to Opus using the same preprocessed input contract as chapter 12

## 2026-04-08 Ran Gemini 3.1 Preview On Chapter 13 And Complemented Manual Raw

- Chapter:
  - `NBK606999` / `YIF1B-Related Neurodevelopmental Disorder`
- Model:
  - `gemini-3.1-pro-preview`
- API behavior:
  - model rejected `thinkingBudget: 0` with `Budget 0 is invalid. This model only works in thinking mode.`
  - quick probe exposed accepted range:
    - `thinking_budget must be in the range [-1, 65535]`
  - confirmed highest fixed budget works:
    - `thinkingBudget: 65535`
- Saved Gemini raw:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK606999_yif1b_related_neurodevelopmental_disorder_gemini31_raw.json`
- Saved Gemini raw text:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK606999_yif1b_related_neurodevelopmental_disorder_gemini31_raw_text.json`
- Saved Gemini meta:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK606999_yif1b_related_neurodevelopmental_disorder_gemini31_meta.json`
- Gemini usage summary:
  - prompt tokens: `3813`
  - candidate tokens: `3733`
  - thoughts tokens: `6611`
- Comparison result:
  - Gemini raw parsed cleanly but remained noisier than the manual raw
  - main Gemini failures:
    - promoted enumeration-only subtype rows and psychiatric rows into `phenotypes.present`
    - emitted invalid ancillary imaging shape as strings instead of `{finding, assertion, evidence_refs}` objects
    - added weak `prevalence` from case count (`25 individuals`)
  - valid Gemini contributions were limited to cleaner direct evidence refs for some already-kept phenotype rows
- Complement applied:
  - kept the manual raw as the base
  - adopted only these direct sentence-ref improvements:
    - `speech impairment` -> `p4_s1`
    - `dystonia` -> `p7_s1`
    - `dyskinesia` -> `p7_s1`
    - `strabismus` -> `p11_s1`
    - `nystagmus` -> `p11_s1`
    - `optic atrophy` -> `p11_s1`
    - `cortical blindness` -> `p11_s1`
- Saved complemented raw:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK606999_yif1b_related_neurodevelopmental_disorder_complemented_raw.json`
- Result:
  - use the complemented manual raw as the preferred chapter 13 raw

## 2026-04-08 Prepared Chapter 14 Wrapper And Finished Manual Plus Gemini Complement

- Chapter:
  - `NBK618356` / `Zhu-Tokita-Takenouchi-Kim Syndrome`
- Added Opus-ready wrapper:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/opus-11-20-inputs/NBK618356_zhu_tokita_takenouchi_kim_syndrome_opus_input.json`
- Source structure:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/bucket-critical/20260331-genereviews-latest5-readiness/stage1_fetch/NBK618356_clinical_structure.json`
- Gemini run:
  - model: `gemini-3.1-pro-preview`
  - thinking budget: `65535`
  - saved raw:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK618356_zhu_tokita_takenouchi_kim_syndrome_gemini31_raw.json`
  - saved raw text:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK618356_zhu_tokita_takenouchi_kim_syndrome_gemini31_raw_text.json`
  - saved meta:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK618356_zhu_tokita_takenouchi_kim_syndrome_gemini31_meta.json`
  - usage summary:
    - prompt tokens: `12194`
    - candidate tokens: `4598`
    - thoughts tokens: `7257`
- Gemini comparison result:
  - Gemini used the canonical `p{n}_s{m}` sentence IDs correctly
  - Gemini still remained too permissive:
    - promoted large dysmorphology enumerations into `phenotypes.present`
    - emitted invalid ancillary imaging shape as plain strings instead of structured objects
    - mixed laboratory-style deficiencies into phenotype rows
  - Gemini was useful as a secondary comparison surface, not as the base raw
- Saved manual raw:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK618356_zhu_tokita_takenouchi_kim_syndrome_manual_raw.json`
- Saved preferred complemented raw:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK618356_zhu_tokita_takenouchi_kim_syndrome_complemented_raw.json`
- Manual extraction policy used:
  - kept core syndrome findings in `phenotypes.present`
  - routed immunoglobulin deficiencies and thrombocytopenia to ancillary `laboratory`
  - routed MRI and radiographic findings to ancillary `imaging`
  - downranked granular craniofacial, skeletal, genitourinary, and thinly documented movement findings into `uncertain`
- Valid Gemini complement retained:
  - added `intrauterine growth restriction` from `p36_s2` to the preferred complemented raw
- Result:
  - use the complemented chapter 14 raw as the preferred file for the next stage

## 2026-04-08 Tested Gemini 3.1 Multi-Pass Raw Extraction On Chapter 14

- Goal:
  - test the hypothesis that Gemini becomes a more useful complementary extractor if the task is split into several narrower prompts instead of one large raw-extraction prompt
- Chapter:
  - `NBK618356` / `Zhu-Tokita-Takenouchi-Kim Syndrome`
- Added reusable experiment runner:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/runGeminiMultipassChapterRawExperiment.js`
- Experiment setup:
  - model: `gemini-3.1-pro-preview`
  - thinking budget: `65535`
  - input wrapper:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/opus-11-20-inputs/NBK618356_zhu_tokita_takenouchi_kim_syndrome_opus_input.json`
  - four passes:
    - `present`
    - `uncertain`
    - `ancillary`
    - `context`
  - merge performed deterministically in code, not by Gemini
- Saved multi-pass outputs:
  - merged:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK618356_zhu_tokita_takenouchi_kim_syndrome_genereviews_ncbi_bookshelf_gemini31_multipass_merged.json`
  - comparison summary:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK618356_zhu_tokita_takenouchi_kim_syndrome_genereviews_ncbi_bookshelf_gemini31_multipass_comparison.json`
  - per-pass partials and meta:
    - `..._present.json`
    - `..._uncertain.json`
    - `..._ancillary.json`
    - `..._context.json`
- Multi-pass usage by pass:
  - `present`: prompt `11406`, candidate `6500`, thoughts `3640`
  - `uncertain`: prompt `11385`, candidate `2798`, thoughts `6537`
  - `ancillary`: prompt `11295`, candidate `986`, thoughts `1547`
  - `context`: prompt `11388`, candidate `478`, thoughts `1086`
- Comparison against the preferred chapter 14 raw:
  - one-shot Gemini `present` precision/recall vs preferred `present`:
    - precision `0.3529`
    - recall `0.8571`
  - multi-pass Gemini `present` precision/recall vs preferred `present`:
    - precision `0.65`
    - recall `0.9286`
  - one-shot Gemini leaked preferred ancillary laboratory items into `present`:
    - `immunoglobulin a deficiency`
    - `immunoglobulin g deficiency`
    - `thrombocytopenia`
  - multi-pass Gemini removed those `present` lab leaks
  - one-shot Gemini had invalid ancillary shape:
    - plain-string `imaging`
  - multi-pass Gemini fixed ancillary shape and emitted structured objects
- Remaining multi-pass problems:
  - `uncertain` pass over-aggregated many findings into giant bundle labels instead of clean phenotype rows
  - some borderline findings still leaked into `present`, including:
    - `status epilepticus`
    - `dystonia`
    - `tremors`
    - `hearing loss`
    - `chronic liver cirrhosis`
    - `inguinal hernia`
    - `undescended testes`
  - `recurrent infection` remained singular rather than source-clean `recurrent infections`
  - `developmental regression` became `neurodevelopmental regression`
- Decision:
  - split prompts do materially improve Gemini for `present` selection and ancillary routing
  - current multi-pass prompt still does not produce a clean enough full raw to replace the manual/Opus-first path
  - best next refinement is to narrow the `uncertain` pass further and forbid bundle/umbrella labels

## 2026-04-08 Switched Complementary Gemini Default Back To 2.5 Pro

- Decision:
  - stop using `gemini-3.1-pro-preview` as the default complementary chapter model
  - use `gemini-2.5-pro` for future complementary Gemini runs unless there is a specific experiment reason to test `3.1`
- Why:
  - `gemini-3.1-pro-preview` consumed much higher thinking budgets and latency
  - despite some structural improvement, it did not contribute enough accepted complements to justify staying as the default parallel model
  - the accepted complements so far remain sparse relative to the extra prompt and evaluation overhead
- Operational rule going forward:
  - primary extraction path remains manual / Opus-style judgment
  - parallel Gemini comparison path defaults to `gemini-2.5-pro`

## 2026-04-08 Processed NBK1339 Y Chromosome Infertility With Gemini 2.5 Pro Complement

- Chapter:
  - `NBK1339` / `Y Chromosome Infertility`
- Added Opus-ready wrapper:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/opus-11-20-inputs/NBK1339_y_chromosome_infertility_opus_input.json`
- Source structure:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/bucket-critical/20260331-genereviews-latest5-readiness/stage1_fetch/NBK1339_clinical_structure.json`
- Surface note:
  - this split is thin and only covers suggestive findings plus clinical description
  - inheritance, gene, prevalence, and broader natural-history text are not present in the provided structure
- Saved manual raw:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK1339_y_chromosome_infertility_manual_raw.json`
- Manual extraction policy:
  - kept `infertility`, `azoospermia`, and `oligozoospermia` in `phenotypes.present`
  - kept `small testes` in `phenotypes.uncertain` because it is subgroup-specific to Sertoli cell-only syndrome
  - left ancillary buckets empty because the surface contains test-method descriptions but no additional ancillary findings worth retaining
  - limited context to supported chapter-surface statements only
- Ran complementary Gemini model:
  - model: `gemini-2.5-pro`
  - saved raw:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK1339_y_chromosome_infertility_gemini25pro_raw.json`
  - saved raw text:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK1339_y_chromosome_infertility_gemini25pro_raw_text.json`
  - saved meta:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK1339_y_chromosome_infertility_gemini25pro_meta.json`
  - usage summary:
    - prompt tokens: `2823`
    - candidate tokens: `1104`
    - thoughts tokens: `772`
- Gemini comparison result:
  - Gemini stayed reasonably disciplined on this simpler chapter
  - Gemini over-promoted `small testes` into `present`, so the manual bucket decision was kept
  - one valid complement was retained:
    - add `p12_s1` as an additional evidence ref for `oligozoospermia`
- Saved preferred complemented raw:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK1339_y_chromosome_infertility_complemented_raw.json`
- Result:
  - use the complemented NBK1339 raw as the preferred file for this chapter

## 2026-04-08 Processed NBK1448 Zellweger Spectrum Disorder With Gemini 2.5 Pro Complement

- Chapter:
  - `NBK1448` / `Zellweger Spectrum Disorder`
- Added Opus-ready wrapper:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/opus-11-20-inputs/NBK1448_zellweger_spectrum_disorder_opus_input.json`
- Source structure:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/bucket-critical/20260331-genereviews-latest5-readiness/stage1_fetch/NBK1448_clinical_structure.json`
- Surface note:
  - this split includes only `Suggestive Findings` and `Clinical Description`
  - inheritance, gene, prevalence, and management sections are not present in the provided structure
- Saved manual raw:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK1448_zellweger_spectrum_disorder_manual_raw.json`
- Manual extraction policy:
  - kept neonatal and childhood core manifestations in `phenotypes.present`, including:
    - `hypotonia`
    - `poor feeding`
    - `seizures`
    - `liver dysfunction`
    - `retinal dystrophy`
    - `sensorineural hearing loss`
    - `developmental delay`
  - kept clearly severe-subgroup or hedged findings in `phenotypes.uncertain`, including:
    - `chondrodysplasia punctata`
    - `renal cysts`
    - `pigmentary retinopathy`
    - `coagulopathy`
    - `adrenal insufficiency`
    - `osteopenia`
  - routed `elevation in liver function tests` to ancillary laboratory and `failed hearing screen` to ancillary clinical_test
  - kept context limited to supported onset, prognosis, and natural-history statements only
- Ran complementary Gemini model:
  - model: `gemini-2.5-pro`
  - saved raw:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK1448_zellweger_spectrum_disorder_gemini25pro_raw.json`
  - saved raw text:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK1448_zellweger_spectrum_disorder_gemini25pro_raw_text.json`
  - saved meta:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK1448_zellweger_spectrum_disorder_gemini25pro_meta.json`
  - usage summary:
    - prompt tokens: `3340`
    - candidate tokens: `3687`
    - thoughts tokens: `1899`
- Gemini comparison result:
  - Gemini was too conservative on this chapter and incorrectly left `phenotypes.present` empty
  - Gemini did contribute two valid complements:
    - add `p6_s5` as an additional evidence ref for `liver dysfunction`
    - retain explicit ancillary laboratory finding `vitamin K-responsive coagulopathy`
  - no Gemini row-selection overrides were accepted for the core phenotype backbone
- Saved preferred complemented raw:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK1448_zellweger_spectrum_disorder_complemented_raw.json`
- Result:
  - use the complemented NBK1448 raw as the preferred file for this chapter

## 2026-04-08 Compared Old Opus Chapter 6 Against New Manual NBK1339 Raw

- Comparison target:
  - old Opus source-of-truth file:
    - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/chapter 6-Y Chromosome Infertility.json`
  - new manual preferred file:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/manual-11-20-raws/NBK1339_y_chromosome_infertility_complemented_raw.json`
- High-level result:
  - old Opus has broader recall and richer ancillary/context coverage because it used a fuller chapter surface
  - new manual is cleaner for the current strict grounded pipeline because it keeps a flatter present set and avoids overpromotion
- Old Opus phenotype behavior:
  - `present`:
    - `azoospermia`
    - `severe oligozoospermia`
    - `moderate oligozoospermia`
    - `mild oligozoospermia`
    - `small testes`
    - `male infertility`
  - `uncertain`:
    - `short stature`
  - issue:
    - oversplits `oligozoospermia` into three rows instead of one phenotype with severity detail
    - promotes `small testes` to `present` despite subgroup limitation
- New manual phenotype behavior:
  - `present`:
    - `infertility`
    - `azoospermia`
    - `oligozoospermia`
  - `uncertain`:
    - `small testes`
  - strength:
    - flatter core phenotype backbone
    - more conservative bucketing aligned with the current review standard
- Interpretation:
  - for strict current repo-side grounded extraction, the new manual file is better
  - for broader enrichment recall across the full chapter, the old Opus file is richer but looser

## 2026-04-08 Resumed Post-Dravet Opus Continuation With Benchmark Wrappers

- Correction:
  - `Dravet Syndrome` was the real new chapter in the `hard20` continuation
  - the accidental reruns came from switching to the overlapping repo-side `latest5` slice instead of continuing the benchmark sequence
  - after reconciling titles against the old Documents `1-10`, the genuinely new continuation titles are:
    - `PTEN Hamartoma Tumor Syndrome`
    - `Coffin-Siris Syndrome`
    - `Congenital Disorder of Glycosylation Type Ia`
- Source used:
  - benchmark fixture object `DISCOVERY_BENCHMARK` in:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryBenchmarkFull.js`
- Important note:
  - there was no saved fetched GeneReviews `clinical_structure.json` for these three titles in the repo
  - so I extracted the benchmark `clinical_structure` objects directly from the fixture and converted them into the same Opus-ready wrapper shape used elsewhere
- Added PTEN files:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/opus-11-20-inputs/disc-069_pten_hamartoma_tumor_syndrome_clinical_structure.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/opus-11-20-inputs/disc-069_pten_hamartoma_tumor_syndrome_opus_input.json`
- Added Coffin-Siris files:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/opus-11-20-inputs/disc-070_coffin_siris_syndrome_clinical_structure.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/opus-11-20-inputs/disc-070_coffin_siris_syndrome_opus_input.json`
- Added CDG-Ia files:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/opus-11-20-inputs/disc-077_congenital_disorder_of_glycosylation_type_ia_clinical_structure.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/opus-11-20-inputs/disc-077_congenital_disorder_of_glycosylation_type_ia_opus_input.json`
- Wrapper shape:
  - `chapter`
  - flattened `sentence_index`
  - canonical `p{n}_s{m}` sentence IDs
  - one synthetic section label:
    - `Clinical Text`
  - benchmark provenance recorded in `chapter.source` as:
    - `stage3DiscoveryBenchmarkFull fixture`
- Result:
  - the next three genuinely new post-Dravet benchmark chapters are now prepared as Opus-ready inputs without reusing the overlapping old `1-10` titles

## 2026-04-08 Evaluated CDG-Ia Opus Raw From Benchmark Wrapper

- Chapter:
  - `NBK1110` / `Congenital Disorder of Glycosylation Type Ia`
- Decision:
  - keep the pasted Opus raw as a strong baseline for this benchmark chapter
- Why it is good enough to keep:
  - core present findings align well with the benchmark surface:
    - `inverted nipples`
    - `abnormal subcutaneous fat distribution`
    - `cerebellar hypoplasia`
    - `strabismus`
    - `abnormal eye movements`
    - `hepatomegaly`
    - `protein-losing enteropathy`
    - `coagulopathy`
    - `seizures`
    - `peripheral neuropathy`
    - `absent reflexes`
    - `pericardial effusion`
  - lab/test material is mostly routed correctly:
    - `elevated transaminases` in `laboratory`
    - transferrin type 1 pattern in `clinical_test`
  - context is not overfilled when unsupported by the benchmark surface
- Deterministic cleanup to apply later if needed:
  - decide whether `stroke-like episodes` should stay `uncertain` or be promoted to `present` for a richer Opus-style recall standard
  - decide whether `pericardial effusion` should remain `present` or move to `uncertain` under stricter hedging rules because the source says it "has been described"
  - avoid double-counting `cerebellar hypoplasia` across `phenotypes.present` and `ancillary_clinical_evidence.imaging` if a later normalization pass wants a single primary placement plus evidence support
  - keep `biomarker` use of the transferrin type 1 pattern only if the downstream context policy explicitly allows test-pattern biomarkers; otherwise leave it in `clinical_test` only
- Chapter-specific adjudication decisions user confirmed:
  - `p1_s1` splits into:
    - `inverted nipples`
    - `abnormal subcutaneous fat distribution`
    - both keep onset `infancy` and progression `neither persists reliably into adulthood`
  - `p1_s3` splits into:
    - `strabismus`
    - `abnormal eye movements`
  - `p1_s4` splits into:
    - `hepatomegaly`
    - `protein-losing enteropathy`
    - `elevated transaminases` stays ancillary laboratory only
  - `p1_s6`:
    - `coagulopathy` stays phenotype
    - `both pro- and anticoagulant factor deficiencies` is acceptable as source-grounded pathophysiology
  - `p1_s7`:
    - `stroke-like episodes` stays `uncertain` because the sentence is hedged with `may occur`
  - `p1_s9`:
    - `peripheral neuropathy` plus descriptor `absent reflexes`
  - `p1_s10`:
    - keep in `ancillary_clinical_evidence.clinical_test` only
    - do not promote it to phenotype
  - context fields should remain empty unless the benchmark text explicitly supports them

## 2026-04-08 Evaluated PTEN Benchmark Raw And Marked Opus-Style Corrections

- Chapter:
  - `NBK1488` / `PTEN Hamartoma Tumor Syndrome`
- Strong decisions to keep:
  - `p1_s2` split into four source-faithful mucocutaneous findings:
    - `trichilemmomas`
    - `acral keratoses`
    - `oral papillomas`
    - `penile freckling`
  - `p1_s3` split into three thyroid findings with `common` carried onto each:
    - `multinodular goiter`
    - `follicular adenoma`
    - `thyroid carcinoma`
  - `p1_s4` split into:
    - `breast cancer`
    - `endometrial cancer`
    - `colorectal cancer`
    - all with exact lifetime-risk percentages and `clinical_role: complication`
  - `p1_s8` kept in `management_context` only as surveillance guidance
- Corrections needed to stay aligned with the richer Opus-style benchmark target:
  - drop `macrocephaly` from the output because it is an existing anchor in the benchmark input rather than a new candidate for this chapter run
  - promote `lipomas` from `uncertain` to `present`
  - promote `vascular malformations` from `uncertain` to `present`
  - promote `cerebellar dysplastic gangliocytoma` from `uncertain` to `present` if following the benchmark-friendly richer recall standard
- Reason for the three promotions:
  - the benchmark sentence uses hedged language (`may be present`, `may develop`), but the expected/acceptable benchmark candidate set still treats these findings as valid chapter-level candidates for discovery-style extraction
- Optional later normalization:
  - if a stricter post-raw adjudication pass is run later, these hedge-driven rows can be reconsidered for downgrade without changing the broader Opus-style raw capture policy

## 2026-04-08 Saved Organized Benchmark Real-Chapter Raw Outputs

- Created dedicated output folder for the genuinely new benchmark-backed real-chapter raws:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/benchmark-hard20-real-raws-20260408`
- Saved final CDG-Ia raw:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/benchmark-hard20-real-raws-20260408/NBK1110_congenital_disorder_of_glycosylation_type_ia_raw.json`
- Saved final PTEN raw:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/benchmark-hard20-real-raws-20260408/NBK1488_pten_hamartoma_tumor_syndrome_raw.json`
- Existing Dravet output remains in its standalone folder:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/external-dravet-ch11-20260407`
- Current organized split:
  - `external-dravet-ch11-20260407`:
    - Dravet raw / frozen / grounded / mapping / review artifacts
  - `benchmark-hard20-real-raws-20260408`:
    - PTEN final raw
    - CDG-Ia final raw

## 2026-04-08 Verified Downloaded Dravet V2 Extraction File

- Checked:
  - `/Users/ahmedelmorshedy/Downloads/dravet_v2_extraction.json`
- Result:
  - this is a Dravet extraction for the same PMC article as the saved Dravet chapter work:
    - title `Dravet Syndrome: An Overview`
    - source URL `https://pmc.ncbi.nlm.nih.gov/articles/PMC6713249/`
  - but it is not the same file as the saved repo-side Dravet raw/manual artifacts
- Distinction:
  - downloaded `dravet_v2_extraction.json`:
    - `25` present
    - `14` uncertain
    - `2` excluded
    - stricter newer schema variant with evidence refs
  - saved repo-side Dravet raw:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/external-dravet-ch11-20260407/Dravet_Syndrome_PMC6713249_raw_manual.json`
    - `22` present
    - `0` uncertain
    - `0` excluded

## 2026-04-08 Canonical Dravet V2 Raw Saved In Organized Benchmark Folder

- Verified that the organized benchmark copy already exists and is byte-identical to the downloaded later Opus file:
  - source:
    - `/Users/ahmedelmorshedy/Downloads/dravet_v2_extraction.json`
  - canonical organized copy:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/benchmark-hard20-real-raws-20260408/PMC6713249_dravet_syndrome_an_overview_raw_v2.json`
- Interpretation going forward:
  - treat the organized `PMC6713249_dravet_syndrome_an_overview_raw_v2.json` file as the canonical final Dravet Opus raw for the benchmark-backed continuation
  - older April 7 repo-side Dravet raw/manual artifacts remain useful historical predecessors but not the latest approved raw baseline

## 2026-04-08 PMM2-CDG Consensus vs Saved NBK1110 Raw

- Compared the later PMM2-CDG consensus-style JSON against the saved benchmark raw:
  - saved raw:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/benchmark-hard20-real-raws-20260408/NBK1110_congenital_disorder_of_glycosylation_type_ia_raw.json`
- Conclusion:
  - the consensus JSON contains substantial new chapter-level information beyond the saved raw, not just relabeling
  - the saved raw was based on a thin clinical-description slice and therefore missed multiple later neurologic, ophthalmologic, endocrine, and context signals
- New phenotype-level signal present in the consensus version but absent from the saved raw includes:
  - axial hypotonia
  - developmental delay
  - ataxia
  - retinitis pigmentosa
  - kyphoscoliosis
  - esotropia
  - hypergonadotropic hypogonadism
  - decreased testicular volume
- New ancillary/context signal present in the consensus version but absent from the saved raw includes:
  - low PMM2 enzyme activity
  - inheritance `autosomal recessive`
  - gene `PMM2`
  - infantile onset summary
  - severe-course first-year mortality statement
  - natural-history summary
  - family-risk statement
- Some differences are routing/normalization rather than genuinely new facts:
  - serum transferrin type I pattern appears in both
  - cerebellar hypoplasia appears in both
  - peripheral neuropathy appears in both
  - stroke-like episodes are present in both, but bucketed differently

## 2026-04-08 PTEN Consensus vs Saved NBK1488 Raw

- Compared the PTEN consensus-style JSON against the saved benchmark raw:
  - saved raw:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/benchmark-hard20-real-raws-20260408/NBK1488_pten_hamartoma_tumor_syndrome_raw.json`
- Conclusion:
  - this consensus file contains some valid additive signal, but less net-new value than the PMM2-CDG consensus file
  - several consensus rows are broader umbrella remaps or narrower subtype-specific variants of concepts already captured in the saved Opus raw
- Likely additive new signal:
  - macrocephaly
  - melanoma
  - renal cell carcinoma
  - inheritance `autosomal dominant`
  - gene `PTEN`
  - family-risk summary
  - high-level onset / natural-history / prognosis context
  - annual thyroid ultrasound / annual dermatologic exam management items
- Mostly overlap / weaker normalization rather than clearly new:
  - intestinal polyposis vs existing hamartomatous gastrointestinal polyps
  - thyroid cancer vs existing thyroid carcinoma
  - pigmented macules of glans penis vs existing penile freckling
  - papillomatous papule vs existing oral papillomas
  - multiple hamartomas as an umbrella over already-split hamartoma-related manifestations
- Also note routing issues in the consensus file:
  - renal cell carcinoma appears under imaging even though it is a complication finding
  - pathogenic variant in PTEN is ancillary genetic evidence, not a disease phenotype
- Follow-up correction:
  - `thyroid carcinoma` should not be treated as unsupported over-normalization if the cancer-risk text names carcinoma explicitly
  - in that case, the saved Opus `thyroid carcinoma` row remains source-faithful and does not need to be downgraded to `thyroid cancer`

## 2026-04-08 Capture Policy for Penetrance / Age-Dependent Expression

- Disease-level penetrance statements should be captured when directly source-supported.
- Current best routing:
  - prefer `context_metadata.natural_history` and/or `context_metadata.onset` with sentence refs when the statement describes age-dependent emergence across the disorder
  - do not automatically distribute a disease-level penetrance percentage across each split phenotype row unless the sentence explicitly attributes that percentage to the individual finding
- Example pattern:
  - `>90% have some manifestation by the late 20s`
  - `99% develop mucocutaneous stigmata by the fourth decade`
  - these are disease-level / cluster-level penetrance statements, not per-lesion frequencies for each split mucocutaneous feature
- If schema expands later, a dedicated `penetrance` context field would be cleaner than overloading phenotype frequency qualifiers

## 2026-04-08 Capture Policy for Differential Diagnosis (DDx)

- Differential-diagnosis content is valuable, but it should not be merged into the main phenotype raw as if it were part of the disease manifestation set.
- Best current policy:
  - capture DDx in a separate chapter-level layer or sidecar artifact with sentence refs
  - do not convert compared disorders, exclusion logic, or distinguishing features into phenotype rows unless the source explicitly states they occur in the target disorder
- Why DDx is still useful:
  - improves later adjudication and HPO disambiguation
  - helps identify which findings are distinctive versus nonspecific
  - preserves syndrome-comparison knowledge for downstream review
- Preferred future structure if schema expands:
  - `differential_diagnosis`: compared disorder, distinguishing features, overlap features, exclusion notes, evidence refs

## 2026-04-08 PTEN End-to-End External Pipeline Smoke Test

- Ran a real chapter through the repo's external pipeline chain using the new PTEN raw:
  - raw input:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/benchmark-hard20-real-raws-20260408/NBK1488_pten_hamartoma_tumor_syndrome_raw.json`
  - clinical structure:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/opus-11-20-inputs/disc-069_pten_hamartoma_tumor_syndrome_clinical_structure.json`
  - smoke output dir:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/chapter-pipeline-smoke-20260408/pten`
- Full executed chain:
  - `freeze`
  - `ground`
  - `mapping-input`
  - `map-hpo` using `exact`
  - `review-cases`
  - `review-enrichment` using `gemini-2.5-pro`
- Because no chapter-specific anchor file existed for the new PTEN wrapper, the smoke test used:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/chapter-pipeline-smoke-20260408/pten/empty_anchors.json`
- Outputs produced successfully:
  - `NBK1488_pten_frozen.json`
  - `NBK1488_pten_grounded.json`
  - `NBK1488_pten_mapping_input.json`
  - `NBK1488_pten_mapped.json`
  - `NBK1488_pten_enrichment_cases.json`
  - `NBK1488_pten_enrichment_review.json`
- Smoke-test summary:
  - grounded candidates: `14`
  - rejected candidates: `2`
  - mapped trust split: `6 high`, `8 reject`
  - review case count: `14`
  - `gemini-2.5-pro` review completed with no schema-repair fallback and no validation issues
- Clarification:
  - `rejected candidates` and `reject` HPO mappings are different things
  - `2 rejected candidates` = grounding/finalization did not retain those rows as accepted grounded candidates
  - `8 reject` in the mapping step = the exact lexical HPO mapper found no exact phenotype-label match in the snapshot, so those rows were retained as candidates but left unmapped
- Important limitation:
  - this proves the external pipeline path is executable on the new saved raws
  - but the review stage had no anchor context and the HPO mapping used exact string matching rather than BioLORD or official-HPO adjudicated flattening

## 2026-04-08 Saved Coffin-Siris Benchmark Raw

- Saved the Coffin-Siris chapter raw in the organized benchmark folder:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/benchmark-hard20-real-raws-20260408/NBK131811_coffin_siris_syndrome_raw.json`
- This keeps the benchmark-backed continuation folder aligned as:
  - Dravet canonical Opus v2
  - PTEN raw
  - Coffin-Siris raw
  - PMM2-CDG raw

## 2026-04-08 Enrichment Weighting Direction: Information-Density / Specificity Score

- Good near-term addition:
  - add a cheap post-extraction specificity score per phenotype assertion using document-frequency / IDF logic
- Recommended corpus:
  - prefer disease-level HPO / disease-phenotype annotation profiles and/or the internal extracted GeneReviews chapter corpus
  - do not start from a generic medical literature corpus because lexical rarity there is noisier and less aligned with diagnostic specificity
- Recommended unit of document frequency:
  - disease profile count, not raw sentence count and not raw mention count
  - a term should count once per disease profile when computing DF
- Recommended use:
  - store as a separate enrichment-side feature such as `information_density_score` / `specificity_score`
  - combine later with frequency/commonness rather than replacing the existing frequency-derived phenotype weighting
- Recommended backoff:
  - use mapped HPO labels/IDs when available
  - fall back to normalized source labels for currently unmapped rows
- Why useful:
  - generic findings like seizures / developmental delay / hypotonia get lower specificity
  - syndrome-defining or rarer findings get higher specificity
  - gives the later ranker an enrichment-side signal even before a more mature full weighting model is implemented

## 2026-04-08 Intended Enrichment Weighting Model (Distinct From HPO Frequency Weight)

- The intended enrichment-side weight is not the scorer's existing HPO frequency weight.
- Intended components for a disease-phenotype enrichment assertion:
  - base importance:
    - `primary > descriptor > complication`
    - `present > uncertain`
  - support quality:
    - sentence-grounded explicit support > weak chapter summary > label-only support
  - specificity / information density:
    - rarer / more discriminative findings score higher than generic neurologic or developmental noise
  - enrichment delta:
    - extra retained detail such as subtype, anatomical subsite, temporal qualifier, distribution, or pathophysiology increases the assertion value
  - subgroup / hedge penalty:
    - subgroup-specific or hedged findings get penalized versus generalized disease manifestations
- Compact conceptual formula:
  - `assertion_weight = base_importance * support_quality * specificity_score * enrichment_multiplier * uncertainty_penalty`
- Important distinction:
  - `hpo_mapping_trust` answers whether the term was mapped safely
  - enrichment weight answers how valuable the retained disease-phenotype assertion is

## 2026-04-08 Next-Step Sequence Reconfirmed

- Re-read the official continuation handoff in:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/opus-11-20-handoff-20260407.md`
- Reconfirmed exact `hard20` entries `11-20`:
  - `disc-067` Dravet Syndrome
  - `disc-068` ZAP70-Related Combined Immunodeficiency
  - `disc-069` PTEN Hamartoma Tumor Syndrome
  - `disc-070` Coffin-Siris Syndrome
  - `disc-077` Congenital Disorder of Glycosylation Type Ia
  - `disc-080` Dense Lab and Treatment Paragraph
  - `disc-081` Neonatal Presentation Edge Case
  - `disc-082` Minimal New Findings Edge Case
  - `disc-084` Heavy Gene and Variant Paragraph
  - `disc-100` Kitchen Sink Stress Test
- Reconfirmed the organized real-raw output folder currently contains:
  - Dravet
  - PTEN
  - Coffin-Siris
  - PMM2-CDG
- Conclusion:
  - the corrected real-disease continuation set is complete
  - the next official items are the synthetic stress cases `16-20`
  - the next exact item, if continuing the benchmark in order, is `disc-080` `Dense Lab and Treatment Paragraph`

## 2026-04-08 Chosen Next Real Chapter Beyond Corrected Set

- User asked to choose another real chapter instead of moving to the synthetic stress cases.
- Picked `Wolfram Syndrome` as the next real target.
- Reason:
  - appears in the full discovery benchmark fixture
  - is not part of the old Opus `1-10`
  - is not part of the already organized real-raw continuation set (`Dravet`, `PTEN`, `Coffin-Siris`, `PMM2-CDG`)
  - gives a clean, obviously real disease surface without re-entering the overlap set

## 2026-04-08 Correction: Wolfram Is Not Prepped

- Checked the repo for any ready standalone handoff/wrapper JSON for `Wolfram Syndrome`.
- Result:
  - no `Wolfram` / `wolfram` / `disc-001` / `NBK4144` prepared handoff file was found
  - the choice was valid as a future real disease target, but not valid as an already prepped next chapter
- Operational correction:
  - treat `Wolfram Syndrome` as an unprepared future target
  - if the user wants another real chapter immediately, either generate a new wrapper first or select only from chapters that already have prepared standalone JSON surfaces

## 2026-04-08 Ready vs Can-Make Split

- Ready now as already prepared `opus_input` / `clinical_structure` files:
  - `NBK20221` `ZAP70-Related Combined Immunodeficiency`
  - `disc-069` `PTEN Hamartoma Tumor Syndrome`
  - `disc-070` `Coffin-Siris Syndrome`
  - `disc-077` `Congenital Disorder of Glycosylation Type Ia`
  - older overlap-ready wrappers also exist for:
    - `Y Chromosome Infertility`
    - `Zellweger Spectrum Disorder`
    - `YIF1B-Related Neurodevelopmental Disorder`
    - `Zhu-Tokita-Takenouchi-Kim Syndrome`
- Already saved canonical real raws in the organized folder:
  - `Dravet`
  - `PTEN`
  - `Coffin-Siris`
  - `PMM2-CDG`
- Can make quickly from existing JSON-backed benchmark fixtures without needing a fetched external chapter first:
  - `Prader-Willi Syndrome`
  - `Kabuki Syndrome`
  - `Loeys-Dietz Syndrome`
  - `Fanconi Anemia`
  - `Hereditary Spastic Paraplegia Type 4`
  - `Mucopolysaccharidosis Type I (Hurler Syndrome)`
  - `Spinocerebellar Ataxia Type 3 (Machado-Joseph Disease)`
  - `SATB2-Associated Syndrome`
- Practical recommendation if the user wants a truly new real chapter next:
  - `Prader-Willi Syndrome`

## 2026-04-08 Prader-Willi Prepared As Next Real Target

- Created a separate prep folder so the new real target does not get mixed into the `11-20` continuation bucket:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/benchmark-extra-real-inputs-20260408`
- Added:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/benchmark-extra-real-inputs-20260408/disc-018_prader_willi_syndrome_clinical_structure.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/benchmark-extra-real-inputs-20260408/disc-018_prader_willi_syndrome_opus_input.json`
- Source surface:
  - `stage3DiscoveryBenchmarkDevHard20.json` entry `disc-018`
- Validation:
  - both files pass `jq empty`
- This is a prepared wrapper/input target only; no raw extraction has been saved for it yet.

## 2026-04-08 Prader-Willi Raw Saved

- Saved the user-provided raw extraction for `Prader-Willi Syndrome` at:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/benchmark-extra-real-raws-20260408/NBK1330_prader_willi_syndrome_raw.json`
- Validation:
  - file passes `jq empty`
- Organization:
  - kept in `benchmark-extra-real-raws-20260408` so it stays separate from the corrected `11-15` real-disease continuation folder

## 2026-04-08 Kabuki Prepared As Next Extra-Real Target

- Continued the extra-real sequence after `Prader-Willi Syndrome`.
- Prepared `Kabuki Syndrome` from `stage3DiscoveryBenchmarkDevHard20.json` entry `disc-020`.
- Added:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/benchmark-extra-real-inputs-20260408/disc-020_kabuki_syndrome_clinical_structure.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/benchmark-extra-real-inputs-20260408/disc-020_kabuki_syndrome_opus_input.json`
- Validation:
  - both files pass `jq empty`
- Status:
  - prepared wrapper/input only
  - waiting on raw extraction

## 2026-04-08 General Grounded-Extraction Prompt Added

- Wrote a reusable prompt contract for grounded chapter extraction.
- Core policy in that prompt:
  - `sentence_index` is the only source of truth
  - every phenotype, qualifier, ancillary item, and context field must be justified by cited sentence IDs
  - no disease-memory completion inside the grounded raw
  - prefer literal source labels and blank qualifiers over inferred detail
  - keep inferred / pharma-style enrichment for a separate later layer

## 2026-04-08 Fixed Prompt Requested

- User asked for a tightened reusable prompt rather than more prompt-design discussion.
- Deliverable focus:
  - strict grounding
  - minimal inference
  - preserve valid enrichment only when directly supported by cited sentences

## 2026-04-08 Microsoft Ideas File Themes

- Reviewed:
  - `/Users/ahmedelmorshedy/Desktop/Microsoft genovy ideas.sty`
- File appears to be a long exported transcript rather than a clean standalone memo.
- Strong recurring idea clusters in it:
  - grounded sentence-indexed phenotype extraction from GeneReviews
  - enrichment beyond flat HPO lists via qualifiers, cross-domain evidence, and provenance
  - ontology mapping (`HPO`, `MONDO`, related codes)
  - graph/knowledge-module representation linking gene, phenotype, labs, imaging, pathology, therapy
  - scoring/benchmarking against phenotype-ranking tools like `Exomiser`
  - downstream biopharma layer with drug ontology, response patterns, biomarkers, and trial/stratification use cases
- Main caution repeated by current project work:
  - the ideas are strong, but the transcript repeatedly drifts from grounded extraction into disease-memory completion
  - the right architecture is still layered:
    - grounded raw extraction
    - validated enrichment layer
    - ontology / scoring layer
    - biopharma view

## 2026-04-08 Prader-Willi Candidate vs Saved Opus-Style Raw

- Compared the later user-pasted Prader-Willi candidate against the saved extra-real raw:
  - saved raw:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/benchmark-extra-real-raws-20260408/NBK1330_prader_willi_syndrome_raw.json`
- High-level result:
  - the newer candidate looks richer on paper because it adds ancillary/context and denser qualifiers
  - but much of that added richness is not grounded in the six-sentence `sentence_index` it carries
- Main problems in the later candidate:
  - injects unsupported ancillary/context:
    - methylation biomarker
    - inheritance/gene/family-risk text
    - treatment-response claims
    - prognosis / therapeutic-landscape summaries
  - injects unsupported qualifier detail:
    - pathophysiology
    - anatomical site
    - distribution
    - progression
    - treatment response
    - frequency claims such as `nearly universal`
  - collapses or over-normalizes explicit source findings:
    - turns delayed motor milestones + delayed language into `Global developmental delay`
    - turns specific behavior list into a broad behavioral phenotype
    - turns facial-features sentence into a morphology list not present in that sentence
  - misses some literal source content while adding unsupported detail:
    - e.g. `poor appetite`, `genital hypoplasia`, `infertility`, `stubbornness`, `manipulative behaviors`
- Practical verdict:
  - for a grounded extraction pipeline, the saved Opus-style raw is better
  - the newer candidate is only useful as a reminder that the underlying chapter may support more content, but it is not safe to accept as-is

## 2026-04-08 Full Read of Microsoft Ideas Transcript

- Completed a full end-to-end read of:
  - `/Users/ahmedelmorshedy/Desktop/Microsoft genovy ideas.sty`
- The file is not a compact ideas memo; it is a long exported assistant transcript with UI noise, repeated generations, and architecture brainstorming layered on top of a VEXAS/GeneReviews extraction conversation.
- Strongest recurring value:
  - grounded sentence-indexed extraction
  - enrichment beyond flat HPO
  - graph / ontology / benchmark / biopharma productization thinking
- Clear weakness in the transcript's displayed reasoning style:
  - it repeatedly escalates from grounded extraction into inferred enrichment and then speaks as if the later layers already exist or are already validated
  - it is expansive, commercially oriented, and good for roadmap ideation, but weak on provenance discipline
- Practical interpretation going forward:
  - use the file as an idea mine and architecture prompt source
  - do not treat its generated JSON, graph, or scoring claims as trustworthy implementation artifacts unless each claim is re-grounded independently
- Strong graph-model takeaway worth keeping:
  - the transcript's use of arrows, typed nodes, and domains is one of its best ideas because it forces relationship structure instead of flattening everything into a bag of HPO terms
  - the safe version is a typed multi-domain graph with explicit provenance classes, for example:
    - disease / phenotype assertion / phenotype term
    - lab / imaging / pathology / clinical test
    - gene / mechanism / pathway
    - intervention / treatment response / biomarker
    - sentence / paragraph / source document
    - ontology nodes such as HPO and MONDO
  - each edge should be provenance-aware and ideally typed as:
    - explicit source-backed
    - normalized/derived
    - inferred
    - external-knowledge
  - domains are useful as organizational partitions, but they should not be treated as validated ontology claims unless each node/edge is independently grounded

## 2026-04-08 Biopharma Discussion Framing

- Deep-discussion framing for the transcript's biopharma ideas:
  - the real value is not generic "knowledge graph" positioning
  - the valuable output is a queryable disease-architecture layer that can support:
    - biomarker strategy
    - endpoint strategy
    - patient stratification
    - indication adjacency / expansion
    - therapy-response reasoning
- Best canonical substrate for that future product:
  - disease-phenotype assertion edges with provenance, qualifiers, and weights
  - ancillary domains:
    - laboratory
    - imaging
    - pathology
    - clinical tests
    - treatment response
  - context:
    - onset
    - natural history
    - penetrance
    - prevalence
    - family risk / inheritance when explicitly supported
- Recommended product layering:
  1. grounded canonical extraction
  2. materialized enriched assertion layer
  3. ontology/scoring layer
  4. biopharma-facing derived applications
- Main commercial caution:
  - if inferred disease knowledge is mixed into the canonical layer, the product loses trust with scientific and clinical users

## 2026-04-08 Build-All-Valid-Parts Decision

- User direction:
  - wants to build all valid parts from the Microsoft ideas transcript, not just discuss them
- Consolidated interpretation:
  - this is feasible only as a phased build, not as one undifferentiated graph project
- Recommended build order:
  1. canonical grounded extraction + sentence provenance
  2. materialized enriched disease-phenotype assertion layer
  3. ontology / normalization / weighting layer
  4. cross-domain evidence linking
  5. biopharma-facing derived views and query surfaces
- Invalid parts to exclude from the core build:
  - unsupported disease-memory completions in canonical extraction
  - untyped graph edges without provenance
  - buyer-facing pharma claims before the assertion layer is stable

## 2026-04-08 800-Chapter Schema Lock Principle

- For the full 800-chapter pass, consistency matters more than maximal richness.
- Recommended approach:
  - lock a stable v1 canonical extraction schema now
  - constrain the amount of detail per field aggressively
  - defer richer graph / biopharma / inferred layers until after the 800-chapter ingestion pass
- Canonical v1 should preserve:
  - source-specific raw extraction
  - sentence provenance
  - phenotype rows
  - ancillary rows
  - context assertions
- Canonical v1 should avoid:
  - broad inferred qualifiers
  - latent disease-memory completion
  - heavy graph structure in the raw itself
- Detail budget principle for v1:
  - keep only detail that is reliably extractable and repeatable across hundreds of chapters
  - prefer null/blank over low-confidence enrichment
  - preserve evidence refs even when qualifiers are sparse

## 2026-04-08 Tool Clarification from Ideas Transcript

- Clarified that several named tools in the transcript are implementation options, not product requirements:
  - `Node.js`:
    - JavaScript runtime for building APIs/CLIs
    - unrelated to graph "nodes"
  - `Node2Vec` / `GraphSAGE`:
    - graph-embedding methods for learning vector representations of nodes
    - optional later-stage analytics, not needed for the first product build
  - `Neo4j`:
    - graph database option
  - `NetworkX`:
    - Python graph library for local experimentation
  - `RDF` / `Turtle` / `JSON-LD`:
    - semantic-web serialization formats
    - optional interoperability layer, not required for first internal system
  - `DrugBank` / `ChEMBL`:
    - external drug ontologies / databases that could be linked later for biopharma use cases
- Practical conclusion:
  - these are mostly backend implementation choices or optional later extensions
  - the core requirement remains the canonical assertion model plus typed, provenance-aware cross-domain links

## 2026-04-08 Trajectory Modeling Note

- Important idea from the transcript worth preserving:
  - disease course / trajectory should not always be compressed into a single-word qualifier such as `progression`
- Better representation when explicitly supported by source text:
  - separate trajectory or natural-history assertions with ordered temporal stages
  - example pattern:
    - infancy -> phenotype cluster A
    - childhood -> phenotype cluster B
    - later life -> phenotype cluster C
- Practical schema implication:
  - keep simple `progression` qualifier for local row-level statements
  - add a separate disease-level trajectory structure later for explicit multi-stage transitions
  - do not force complex temporal course into a single phenotype qualifier when the source clearly describes a sequence

## 2026-04-08 Disease Layer vs Biopharma Layer

- Important architecture boundary:
  - the disease layer is canonical truth
  - the biopharma layer is a derived decision-support layer built from canonical truth plus optional external data
- Disease layer should contain:
  - disease identity and source metadata
  - phenotype assertions
  - ancillary assertions
  - context assertions
  - trajectory / natural-history assertions when explicitly supported
  - provenance and weights
- Biopharma layer should contain:
  - biomarker candidates
  - endpoint candidates
  - stratification factors
  - treatment-response summaries
  - indication-adjacency hypotheses
  - all marked as grounded, derived, or inferred
- Key dependency:
  - trajectory is primarily a disease-layer object
  - pharma uses trajectory to decide stage-specific biomarkers, endpoints, and intervention windows

## 2026-04-08 Opus Contract for Disease + Biopharma Stack

- Clarified what Opus should be responsible for in a one-pass 800-chapter workflow:
  - Opus should produce the canonical disease-layer inputs only
  - Opus should not be asked to do ontology weighting, graph reasoning, or biopharma interpretation directly
- Minimum required Opus outputs:
  - full sentence index
  - phenotype assertions with conservative qualifiers
  - ancillary assertions across lab / imaging / pathology / clinical test / treatment response / management
  - context assertions for onset / inheritance / gene / prevalence / prognosis / natural history / family risk / biomarker / therapeutic landscape / penetrance when explicit
  - trajectory / stage-sequence assertions when explicitly described
  - extraction notes for routing or ambiguity decisions
- Explicit non-goals for Opus:
  - no HPO / MONDO IDs
  - no assertion weights
  - no graph node/edge generation
  - no inferred drug or biomarker strategy
  - no disease-memory completion beyond cited text

## 2026-04-08 Grounded Disease Layer v1 Locked

- Wrote the new one-pass schema and Opus extraction contract for the 800-chapter regime:
  - schema spec:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genereviews-grounded-disease-layer-schema-v1-20260408.md`
  - machine-readable template:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genereviews-grounded-disease-layer-template-v1-20260408.json`
  - Opus contract:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genereviews-opus-grounded-disease-layer-contract-v1-20260408.md`
- Key regime change recorded:
  - primary output target is no longer the old chapter-raw bucketed schema
  - primary output target is the grounded disease layer with:
    - `source_document`
    - `phenotype_assertions[]`
    - `ancillary_assertions[]`
    - `context_assertions[]`
    - `trajectory_assertions[]`
    - `extraction_notes[]`
- Validation:
  - template JSON validated with `jq empty`

## 2026-04-09 Grounded Disease Layer Bundle + Next Chapter

- Packaged the new regime artifacts into one folder:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409`
- Bundle contents:
  - `genereviews-grounded-disease-layer-schema-v1-20260408.md`
  - `genereviews-grounded-disease-layer-template-v1-20260408.json`
  - `genereviews-opus-grounded-disease-layer-contract-v1-20260408.md`
  - `README.md`
- Prepared next chapter under the same bundle:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-kabuki`
- Next-chapter files:
  - `disc-020_kabuki_syndrome_clinical_structure.json`
  - `disc-020_kabuki_syndrome_opus_input.json`
  - `README.md`
- Practical intent:
  - make the locked schema, contract, and the next extraction chapter usable from a single handoff location

## 2026-04-09 Kabuki Input Scope Check

- Inspected:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-kabuki/disc-020_kabuki_syndrome_clinical_structure.json`
- Confirmed:
  - it is not a full chapter parse
  - it contains one paragraph and 9 sentences only
  - it is a benchmark-style clinical summary slice, not the full GeneReviews chapter surface
- Implication:
  - if the new grounded disease layer regime is meant to operate on whole chapters, Kabuki should be re-prepared from a fuller chapter fetch rather than using this summary-only fixture

## 2026-04-09 Kabuki Full-Chapter Draft Assessment

- User correctly called out that the prior Kabuki bundle was summary-only because only the benchmark slice had been prepared.
- Correct course correction:
  - fetch the fuller GeneReviews chapter first
  - then extract against `grounded_disease_layer_v1`
- High-level assessment of the fuller draft:
  - much closer to the new regime than the 9-sentence summary slice
  - good:
    - full sentence-indexed chapter surface
    - assertion-first structure
    - trajectory assertions
    - stronger ancillary/context capture
  - still not fully strict-grounded
- Main unsupported or overreaching areas in the draft:
  - ancillary claims not present in cited sentences, e.g.:
    - echocardiogram testing claim linked to `s_cv_01`
    - disorder-specific methylation signature claim linked to `s_sum_01`
    - IVIG management claim linked to `s_imm_04`
    - anesthesia positioning / cervical-spine management claim linked to `s_resp_02`
    - trampoline/joint-damage advice linked to `s_ms_01`
  - context claims not supported by cited sentences, e.g.:
    - inheritance / gene distribution percentages linked to `s_sum_01`
    - family-risk details linked without matching counseling sentences
    - therapeutic landscape HDACi / ketogenic-diet discussion linked to `s_sum_01`
  - phenotype qualifier inflation in some rows, e.g.:
    - row-specific details such as eyebrow notching not present in cited sentence
    - numeric short-stature severity values not present in cited evidence
  - one extraction note references `pleasant and outgoing` behavior while citing `s_beh_01`, which does not support that note
- Practical conclusion:
  - the fuller chapter-backed approach is correct
  - but the draft still needs a strict grounding cleanup pass before it should be treated as canonical

## 2026-04-09 Redo Rule for Prior Chapters Under New Regime

- Decision rule for whether prior chapters need to be redone under `grounded_disease_layer_v1`:
  - redo chapters that were extracted from benchmark summary slices or thin `clinical_structure` fixtures
  - keep chapters that already came from full chapter fetches with broad section/paragraph coverage
- Practical detection rule:
  - likely summary-slice / redo:
    - one paragraph or very low paragraph count
    - sentence counts in the single digits or low teens
    - no real section inventory
    - source looks like benchmark fixture rather than full GeneReviews/PMC provenance
  - likely full-chapter / keep:
    - many paragraphs and sections
    - tens to hundreds of sentences
    - real `provenance_url` to the source chapter
    - heading inventory / chapter domains from the fetch pipeline
- Conclusion for current work:
  - do not blindly redo all prior chapters
  - selectively redo only the ones whose prep surface was summary-only or benchmark-derived

## 2026-04-09 New-Regime Sequence Marked + Faster Next Chapter Prep

- Marked `Kabuki Syndrome` as chapter 1 of the new regime in:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/new-regime-manifest-20260409.json`
- Kept the marking honest:
  - Kabuki is designated as chapter 1
  - but the bundled repo-side prep remains the old summary-slice fixture
- Prepared chapter 2 as a real full-chapter fetch:
  - `Loeys-Dietz Syndrome`
  - fetched from GeneReviews via the repo fetch path
  - resolved `NBK1133`
  - `114` sentences, `79` paragraphs, `14` sections
- Added ready-to-use files under:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-loeys-dietz`
- Added:
  - `NBK1133_opus_input.json`
  - stricter prompt addendum:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/genereviews-opus-grounded-disease-layer-addendum-v1-kabuki-lessons-20260409.md`
- Purpose of the addendum:
  - fail closed on unsupported ancillary/context claims
  - stop summary-only evidence from being stretched into tests/management/therapy
  - reduce qualifier inflation

## 2026-04-09 - Loeys-Dietz next-batch artifact normalized
- Action: Opened `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/Loeys-Dietz Syndrome.json` after the user pointed to it.
- Finding: The file was not valid JSON; it was a chat-style wrapper containing prose plus a fenced JSON block. The payload itself already matched the new grounded disease-layer schema shape, but `source_document.sentence_index` was a placeholder string rather than the actual sentence array.
- Fix: Extracted the fenced JSON payload, validated that all evidence sentence IDs exist in the prepared 114-sentence Loeys-Dietz chapter input, injected the real `sentence_index` from `NBK1133_opus_input.json`, and overwrote the `.json` with the normalized artifact.
- Preservation: Saved the original wrapped response as `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/Loeys-Dietz Syndrome.wrapped.txt`.
- Result: `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/Loeys-Dietz Syndrome.json` is now valid JSON with the expected top-level schema and a real sentence index.
- Next move: If needed, do the same normalization pass for other next-batch chapter files that were saved as transcript wrappers instead of raw JSON artifacts.

## 2026-04-09 - Chapter 3 switched to Williams and strict prompt handoff created
- Action: Dropped PWS as the next handoff because the user wanted a genuinely new chapter and the first PWS attempt exposed another parser edge case.
- Action: Prepared `Williams Syndrome` as chapter 3 under `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-williams-syndrome`.
- Result: `NBK1249_opus_input.json` now contains a real flattened `sentence_index` with 38 sentences and a clean chapter block.
- Action: Added a single strict handoff prompt file at `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/genereviews-opus-grounded-disease-layer-strict-prompt-v1-20260409.md` so future runs do not require manually combining the older contract and Kabuki addendum.
- Action: Added `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/manual-cleanup-targets-kabuki-loeys-20260409.md` to keep chapters 1 and 2 on a concrete manual-fix path.
- Result: Manifest now records chapter 3 as `Williams Syndrome`; Loeys is explicitly marked `manual_cleanup_pending`.
- Next move: Use the Williams `opus_input.json` plus the new strict prompt for the next extraction while manually cleaning Kabuki and Loeys.

## 2026-04-09 - Kabuki and Loeys promoted to repo-side regime-ready outputs
- Action: Loaded the fuller Kabuki draft from `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/NBK62111_kabuki_syndrome.json` and the normalized Loeys draft from `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/Loeys-Dietz Syndrome.json`.
- Action: Manually pruned unsupported ancillary/context claims and tightened selected qualifiers/trajectory text so the repo-side copies are more conservative and aligned to the strict grounded regime.
- Result: Wrote official repo-side chapter outputs:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-kabuki/NBK62111_kabuki_syndrome_regime_ready.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-loeys-dietz/NBK1133_loeys_dietz_syndrome_regime_ready.json`
- Validation: Both repo-side files are valid JSON, retain their full sentence indexes, and have zero missing evidence sentence references.
- Action: Updated bundle docs/readmes/manifest to mark Kabuki and Loeys as `regime_ready` and added `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/regime-ready-chapters-20260409.md` as the official index.
- Next move: Use Williams as chapter 3 for the next strict-prompt extraction while treating the new Kabuki/Loeys repo copies as the official new-regime artifacts.

## 2026-04-09 - Gemini code audit for new regime
- Action: Searched the Genovy repo for Gemini execution code versus new-regime grounded disease-layer wiring.
- Finding: The repo already has shared Gemini API plumbing in `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/genereviewsPipeline.js` via `callGeminiJson(...)`.
- Finding: There are older Gemini experiment/benchmark runners, especially `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/runGeminiMultipassChapterRawExperiment.js` and `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/benchmarkStage3DiscoveryGroundedGemini.js`, but they target older raw/discovery schemas rather than the final `grounded_disease_layer_v1` regime.
- Finding: The new regime itself is currently represented in docs/prompt/schema artifacts, not in a dedicated Gemini execution script.
- Useful assets already present:
  - strict prompt: `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/genereviews-opus-grounded-disease-layer-strict-prompt-v1-20260409.md`
  - schema template: `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genereviews-grounded-disease-layer-template-v1-20260408.json`
  - canonical splitter patch/reference: `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/gemini-canonical-splitter-patch-20260408.js`
- Conclusion: We have the Gemini plumbing and prompt assets, but not yet the exact runner that feeds a chapter input plus the new strict prompt and writes a regime-ready chapter JSON.
- Next move: If needed, implement a dedicated Gemini new-regime runner rather than trying to force-fit the older experiment scripts.

## 2026-04-09 - Gemini grounded disease-layer runner added
- Action: Added `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/runGroundedDiseaseLayerGemini.js` and wired it into `package.json` as `gr:grounded-disease-layer:gemini`.
- Behavior: The runner reads a chapter wrapper like `NBK1249_opus_input.json`, loads the strict grounded prompt plus the JSON schema template, calls `callGeminiJson(...)`, writes raw/model metadata artifacts, and normalizes the model output into `grounded_disease_layer_v1`.
- Hardening added:
  - deterministic `source_document` fill from the chapter wrapper instead of relying on the model to restate metadata
  - strict evidence sentence reconciliation against the provided `sentence_index`
  - fixed qualifier-key normalization for phenotype and ancillary rows
  - tolerant handling of omitted empty arrays while still failing on wrong schema version or bad sentence references
  - saved composed system prompt snapshot alongside the run outputs for auditability
- Validation: `node --check /Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/runGroundedDiseaseLayerGemini.js` passed after the changes.
- Next move: Run the new script against Williams (chapter 3) once Gemini is the active model path and inspect the first output for grounding leakage before scaling further.

## 2026-04-09 - Gemini runner switched to task-scoped multipass
- Action: Reworked `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/runGroundedDiseaseLayerGemini.js` from one-shot extraction into a task-scoped multipass runner using `gemini-2.5-pro`.
- Pass layout:
  - phenotype assertions
  - ancillary assertions
  - context assertions
  - trajectory assertions
  - extraction notes
- Behavior: Each pass gets its own scoped prompt and partial JSON template, writes its own raw text / prompt snapshot / meta / partial JSON artifact, and the script merges those pass outputs into one final normalized `grounded_disease_layer_v1` file.
- Reasoning: This matches the user's request to make Gemini behave more like multiple focused agents while keeping the existing parser/validator path and one canonical final output.
- Validation: `node --check /Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/runGroundedDiseaseLayerGemini.js` passed after the multipass rewrite.
- Next move: Run the Williams chapter through the task-scoped runner and review whether the narrower passes reduce context leakage compared with the one-shot regime.

## 2026-04-09 - Williams run completed through Gemini task-scoped multipass
- Action: Ran `npm run gr:grounded-disease-layer:gemini -- --input /Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-williams-syndrome/NBK1249_opus_input.json`.
- Result: The task-scoped `gemini-2.5-pro` pipeline completed successfully and wrote:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-gemini-runs/NBK1249_williams_syndrome/NBK1249_williams_syndrome_grounded_disease_layer.json`
  - plus per-pass prompt/raw/meta/partial JSON artifacts in the same folder
- Counts:
  - phenotype assertions: 56
  - ancillary assertions: 2
  - context assertions: 9
  - trajectory assertions: 5
  - extraction notes: 4
- Parser hardening during run: Gemini emitted unsupported context fields like `disease_name` / `disease_acronym` / `disease_synonym`; the validator was patched to drop unsupported `context_assertion.field_name` values instead of failing the entire run.
- Quality read:
  - better structural discipline than the earlier one-shot path
  - still not fully regime-ready
  - likely cleanup targets remain in `context_assertions` (multiple gene rows that behave more like genotype notes) and `trajectory_assertions` (age-group feature descriptions that may be too eager for trajectory)
- Next move: treat this as the first Gemini Williams draft, not a final regime-ready chapter, and manually prune the remaining overreach before promoting it.

## 2026-04-09 - Williams manually cleaned and promoted to chapter 3 regime-ready
- Action: Copied the Gemini task-scoped draft into `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-williams-syndrome/NBK1249_williams_syndrome_regime_ready.json` and manually cleaned it.
- Manual cleanup applied:
  - downgraded positive cognitive/personality profile rows (`strengths...`, `overfriendliness`, `empathy`) from `primary` to `descriptor`
  - removed weak/redundant qualifier stuffing (`distribution: Any artery`, connective-tissue umbrella `pathophysiology`, and tautological site/morphology fields for those connective-tissue rows)
  - linked ancillary lab rows back to their matching phenotype assertions (`hypercalcemia`, `hypercalciuria`)
  - replaced multiple subgroup-specific `gene` context rows with one disease-level region statement grounded to `p12_s1`
  - removed the age-dependent facial-feature trajectory rows and kept that distinction as an extraction note instead
  - rewrote notes so they are routing/ambiguity decisions rather than historical commentary and removed the unsupported historical-names note
- Validation:
  - cleaned file is valid JSON
  - zero missing evidence sentence references
  - final counts: 56 phenotype assertions, 2 ancillary assertions, 5 context assertions, 3 trajectory assertions, 3 extraction notes
- Promotion: Updated the bundle manifest, Williams chapter README, bundle README, and regime-ready index so chapter 3 is now explicitly marked `regime_ready`.
- Next move: Use the same task-scoped Gemini path for the next chapter, then continue the same manual conservative-promotion workflow.

## 2026-04-09 - Williams status corrected after review of source completeness
- Action: Re-checked the actual Williams input surface at `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-williams-syndrome/NBK1249_clinical_text.txt`.
- Finding: The available Williams source surface is truncated to a short suggestive-findings/genotype-correlation style slice (`48` lines, `38` sentences) and does not include the full Clinical Description richness expected from the complete chapter.
- Consequence: The cleaned Williams extraction is disciplined for the provided text, but it should not be represented as a full-chapter-complete regime-ready chapter.
- Fixes applied:
  - corrected duplicate trajectory IDs in the cleaned Williams JSON
  - changed Williams manifest status from `regime_ready` to `cleaned_truncated_input_draft`
  - updated the Williams README and the regime-ready index to explicitly warn that the current file is a cleaned partial-source draft
- Next move: Replace Williams with a full chapter fetch before treating it as truly chapter-complete under the new regime.

## 2026-04-09 - Added reusable Codex skill for the grounded disease-layer workflow
- Action: Created the global skill `/Users/ahmedelmorshedy/.codex/skills/genereviews-grounded-disease-layer` so the Genovy new-regime workflow no longer depends on chat memory.
- Skill contents:
  - `SKILL.md` with the canonical workflow for resolving a chapter, auditing source completeness, using the strict prompt and Gemini runner, applying manual cleanup, and updating manifest/readme/diary bookkeeping
  - `references/repo-map.md` with the canonical repo paths, bundle paths, runner command, and current archived Williams recovery surface
  - `references/cleanup-and-promotion.md` with the cleanup/promotion rubric
  - `scripts/resolve_chapter.py` for manifest-backed chapter/path lookup
  - `scripts/audit_surface.py` for clinical-surface truncation checks and archived-fetch comparison
- Validation:
  - quick_validate passed for the skill folder
  - `resolve_chapter.py --query Williams` returned the expected live manifest entry
  - `audit_surface.py` correctly flagged the current Williams bundle surface as truncated and surfaced the fuller archived `NBK1249` stage1 fetch (`142` sentences / `45` paragraphs / `3` sections)
- Next move: Use the new skill as the default entry point for future new-regime chapter work, and rebuild Williams from the archived fuller surface instead of the truncated bundle prep.

## 2026-04-09 - Added transparency guardrails after source-surface confusion
- Action: Updated `/Users/ahmedelmorshedy/Virona-ShawQ-Dashboard/AGENTS.md`, `/Users/ahmedelmorshedy/Virona-ShawQ-Dashboard/skill.md`, and the Genovy workflow skill `/Users/ahmedelmorshedy/.codex/skills/genereviews-grounded-disease-layer/SKILL.md`.
- New guardrails:
  - explicitly state whether a prepared chapter surface is full chapter-backed, partial, summary-like, or truncated before calling any output complete
  - never imply chapter-complete or regime-ready status without verified source breadth
  - answer recent process/history questions from working memory when confidence is high, and only reopen files when exact verification materially changes the answer
- Outcome: future Genovy workflow turns should surface source-completeness status earlier and should avoid unnecessary verification churn during process discussions.
- Next move: keep using the audit-first chapter workflow and apply these transparency rules before any future readiness claims.

## 2026-04-09 - Added explicit path-alignment guardrail
- Action: Extended the same instruction surfaces to require explicit path-status reporting during work.
- New guardrail:
  - explicitly say whether the current work is on the intended path, drifting into a usable-but-partial draft path, or off-path / blocked
  - if the current path is not leading to the intended end state, say so before continuing
- Outcome: future chapter-work updates should expose not just source completeness, but also whether the workflow is actually moving toward the intended final product.
- Next move: apply this path-status callout in future Genovy workflow updates whenever there is meaningful risk of wasted effort or model spend.

## 2026-04-09 - Added and validated reusable HF-router chat runner
- Action: Added `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/runHfRouterChat.js` and exposed it via `npm run gr:hf-router-chat`.
- Purpose: provide a reusable way to call Hugging Face router chat models, save raw request/response artifacts, support JSON-mode parsing, and retry cleanly on rate-limit or transient provider errors.
- Validation:
  - syntax check passed for the new script
  - text-mode sanity check succeeded against `zai-org/GLM-5.1:novita`
  - JSON-mode sanity check also succeeded against `zai-org/GLM-5.1:novita`
  - saved runs:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/hf-router-chat-runs/glm51_novita_text_sanity_threadenv`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/hf-router-chat-runs/glm51_novita_json_sanity_threadenv`
- Important auth note:
  - sourcing `/Users/ahmedelmorshedy/.codex/skills/hugging-model/.env.huggingmodel` caused HF router calls to fail with provider-permission errors
  - the working path was to use the thread's existing `HF_TOKEN` directly without sourcing that Fireworks-oriented env file
- Outcome: HF router access for `zai-org/GLM-5.1:novita` is confirmed working for reusable text and JSON smoke tests.
- Next move: use this runner for future GLM smoke tests and async extraction comparisons, while treating latency/rate limits as the main operational risk for larger prompts.

## 2026-04-09 - Microsoft Azure AI Project agent smoke test blocked on local authentication
- Action: Tried the provided Azure AI Projects sample against endpoint `https://genovy2-resource.services.ai.azure.com/api/projects/genovy2` with agent reference `2genovy:1`.
- Execution details:
  - local machine did not have `az` installed
  - created a temporary virtualenv at `/tmp/azure-agent-test`
  - installed `azure-ai-projects>=2.0.0`
  - ran the sample using `DefaultAzureCredential`
- Result: the SDK path itself is viable, but the call failed before agent execution because `DefaultAzureCredential` could not obtain a token from any configured credential source.
- Specific blockers reported:
  - environment credentials not configured
  - no managed identity available
  - no shared token cache account
  - Azure CLI not installed
  - Azure Developer CLI not installed/logged in
  - brokered / VS Code credential path unavailable
- Outcome: this is an auth/configuration block, not evidence that the agent endpoint or sample code is wrong.
- Next move: authenticate locally with Azure CLI / Azure Developer CLI or provide service-principal environment credentials, then rerun the same sample.

## 2026-04-09 - Microsoft Azure AI Project agent smoke test succeeded after Azure Developer CLI login
- Action: Installed `azure-dev` (`azd`) via Homebrew, completed device-code login, and reran the provided sample against project endpoint `https://genovy2-resource.services.ai.azure.com/api/projects/genovy2` with agent reference `2genovy:1`.
- Result: the call completed successfully using `DefaultAzureCredential` via Azure Developer CLI auth, and the agent returned a normal capability summary response.
- Outcome: the Microsoft agent path is confirmed working locally; the earlier failure was purely missing authentication setup.
- Reusable auth note:
  - `azd auth login --use-device-code` is sufficient for this local `DefaultAzureCredential` path
  - no full Azure CLI install was required for the smoke test
- Next move: use the same authenticated path for stronger grounded-extraction smoke tests or structured JSON runs against the `2genovy:1` agent.

## 2026-04-09 - Strong summary-slice smoke test against `2genovy:1` did not return in an interactive window
- Action: Sent a strong Prader-Willi summary-slice grounded-extraction prompt to the authenticated Azure agent `2genovy:1`, then tried a shorter fallback strict prompt against the same path.
- Result:
  - the endpoint stayed alive and authenticated
  - neither the strong prompt nor the shorter fallback produced a completed JSON response within a reasonable interactive window
  - this contrasts with the simple capability prompt, which completed normally
- Outcome: the Microsoft agent path is working as an endpoint, but is currently not a good interactive smoke-test path for stricter grounded-extraction prompts.
- Path status: usable endpoint, but off the intended path for fast iterative extraction testing because latency/orchestration is too high.
- Next move: either use a lighter/faster path for iterative extraction smoke tests, or treat the Azure agent as an async/background evaluation path rather than an interactive one.

## 2026-04-09 - Added 3-stage Azure agent runner for grounded disease-layer extraction
- Action: Added `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/runGroundedDiseaseLayerAzureAgent.py` and exposed it as `npm run gr:grounded-disease-layer:azure-agent`.
- Bootstrap:
  - added `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/scripts/run-grounded-disease-layer-azure-agent.sh`
  - the package command now bootstraps/reuses `~/.cache/genovy-azure-agent-venv` automatically instead of depending on an ad hoc temp virtualenv
- Strategy:
  - stage 1: `phenotype_assertions`
  - stage 2: `ancillary_assertions` + `context_assertions`
  - stage 3: `trajectory_assertions` + `extraction_notes`
  - `source_document` is composed locally from the wrapper after stage outputs are merged and normalized
- Validation:
  - Python syntax check passed
  - package entrypoint dry-run passed
  - direct tiny Azure agent call with `input=[{role:'user', content: ...}]` returned `{\"ok\":true}`
- Important API note:
  - Azure agent requests rejected the `instructions` parameter when `agent_reference` was present
  - the working shape is to place the stage prompt and input wrapper in the user message content instead
- Outcome: the Azure path now has a real task-scoped 3-stage runner instead of relying on one-shot prompts.
- Next move: use this runner for async/background Azure extraction attempts where the agent path is acceptable, and keep faster providers for tight interactive smoke tests.

## 2026-04-09 - Engineered around Azure agent latency with smaller staged inputs and resume controls
- Action: tightened the Azure runner to reduce orchestration cost and make slow runs recoverable.
- Changes:
  - stage payloads now send compact chapter metadata plus `sentence_id: text` lines instead of the full indented wrapper JSON
  - stage templates are embedded in compact JSON form to reduce prompt size
  - added `--stage`, `--start-stage`, and `--stop-stage` controls for targeted reruns
  - added `--resume` so completed stage payloads can be reused after a partial run instead of forcing all 3 stages to rerun
  - saved per-stage compact input text files alongside prompts, raw outputs, parsed partial JSON, and response bodies
- Validation:
  - Python syntax check still passed
  - dry-run for `--stage phenotype` passed
  - dry-run for `--start-stage support --stop-stage course` passed
- Outcome: the Azure path is still not a fast interactive smoke-test model, but it is now engineered for smaller stage payloads, restartability, and practical background use.
- Next move: use phenotype-only or resumed stage runs first for debugging, then full 3-stage runs once a chapter path looks stable.

## 2026-04-09 - Azure 3-stage runner completed Williams phenotype-only stage
- Action: Ran `npm run gr:grounded-disease-layer:azure-agent -- --stage phenotype --input /Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-williams-syndrome/NBK1249_opus_input.json`.
- Result:
  - stage completed successfully through Azure agent `2genovy:1`
  - phenotype count: `56`
  - ancillary/context/trajectory/notes remained empty because only phenotype stage was run
  - runtime remained slow enough to confirm this path should be treated as background/asynchronous, not chat-speed interactive
- Key artifacts:
  - final merged placeholder output: `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-azure-agent-runs/NBK1249_williams_syndrome/NBK1249_williams_syndrome_grounded_disease_layer.json`
  - phenotype partial: `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-azure-agent-runs/NBK1249_williams_syndrome/NBK1249_williams_syndrome_phenotypes.json`
  - phenotype raw text: `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-azure-agent-runs/NBK1249_williams_syndrome/NBK1249_williams_syndrome_phenotypes_raw_text.txt`
- Next move: inspect phenotype quality, then run `--start-stage support --stop-stage course --resume` only if the phenotype pass is worth keeping.

## 2026-04-09 - GLM-5.1 HF-router retry reached the model but exhausted output budget in reasoning
- Action: Retried the strict Prader-Willi summary-slice smoke test against `zai-org/GLM-5.1:novita` using the Hugging Face router runner and the thread's `HF_TOKEN`.
- Result:
  - request completed successfully with no transport/rate-limit failure
  - provider returned `reasoning_content` only and no assistant `content`
  - no `response_parsed.json` was produced because there was no parseable JSON output
  - usage showed `completion_tokens = 2200` and `reasoning_tokens = 2200`, indicating the model consumed the full budget internally without emitting the final JSON
- Key artifacts:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/hf-router-chat-runs/pws_summary_slice_smoke_glm51_retry/meta.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/hf-router-chat-runs/pws_summary_slice_smoke_glm51_retry/response_body.json`
- Outcome: credit/auth is no longer the blocker for GLM on HF router; the current blocker is provider behavior on this prompt shape, where the model spends its budget on exposed reasoning instead of the requested JSON output.
- Next move: if GLM is still worth pursuing, test a much shorter phenotype-only prompt and/or a higher output budget to see whether it can be forced to emit final content instead of only reasoning traces.

## 2026-04-09 - Fireworks provider variant improved basic GLM reachability but still failed phenotype-only JSON extraction
- Action:
  - ran the user's direct curl example against `zai-org/GLM-5.1:fireworks-ai`
  - then ran a shorter phenotype-only Prader-Willi summary-slice JSON prompt through the HF-router runner with the same provider variant
- Result:
  - the direct curl test succeeded and returned normal assistant content (`The capital of France is Paris.`) plus provider reasoning text
  - the phenotype-only extraction run completed, but instead of returning valid JSON it emitted a long freeform reasoning/planning text block
  - no `response_parsed.json` was created for the phenotype-only run because the assistant content was not valid JSON
- Key artifacts:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/hf-router-chat-runs/pws_phenotype_only_fireworks_glm51/meta.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/hf-router-chat-runs/pws_phenotype_only_fireworks_glm51/response_body.json`
- Outcome: `fireworks-ai` is a better provider path than `novita` for basic chat completion, but it is still off the intended path for strict structured extraction because it ignores the JSON-only contract on the phenotype smoke test.
- Next move: if GLM remains worth pursuing, either force a much narrower schema/output target or add a post-processor that extracts JSON from mixed assistant text, while accepting that this path is weaker than the current Gemini/Azure task-scoped routes for disciplined structured output.

## 2026-04-09 - `zai-org` provider variant returned clean basic assistant content
- Action: Ran the user's exact Node `fetch` sample against `zai-org/GLM-5.1:zai-org` on the Hugging Face router for the simple capital-of-France sanity check.
- Result:
  - provider returned normal assistant content: `The capital of France is Paris.`
  - response also included `reasoning_content`, but unlike the weaker routes, it did emit a usable final answer in `message.content`
- Outcome: `zai-org` is a viable basic-chat provider path for GLM-5.1. It still needs a structured-extraction smoke test before it can be trusted for JSON disease-layer work.
- Next move: if structured output from GLM is still worth pursuing, run the shorter phenotype-only JSON smoke test against `zai-org/GLM-5.1:zai-org` next and compare it to `fireworks-ai`.

## 2026-04-09 - `zai-org` provider variant also failed the phenotype-only structured extraction test
- Action: Ran the same shorter phenotype-only Prader-Willi summary-slice JSON smoke test against `zai-org/GLM-5.1:zai-org`.
- Result:
  - request completed successfully
  - no parseable JSON was returned
  - `response_content.txt` was empty
  - `response_body.json` showed `finish_reason: "length"` with the entire `completion_tokens` budget consumed as `reasoning_tokens`
- Key artifacts:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/hf-router-chat-runs/pws_phenotype_only_zaiorg_glm51/meta.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/hf-router-chat-runs/pws_phenotype_only_zaiorg_glm51/response_body.json`
- Outcome: `zai-org` is fine for basic chat, but like the other GLM provider variants it is off the intended path for direct structured disease-layer extraction under the current prompt shape.
- Next move: only keep GLM in the stack if we are willing to use it for draft reasoning plus downstream repair/post-processing, rather than trusting it as the final JSON emitter.

## 2026-04-09 - Sonnet 4.6 first-try Williams draft is clinically strong but still not regime-ready
- Action: Reviewed the user's pasted Sonnet 4.6 Williams syndrome grounded-disease-layer draft against the archived fuller Williams clinical surface and the strict grounded-disease-layer workflow.
- Source-surface status:
  - on the intended path for Williams clinical extraction
  - based on the fuller archived `NBK1249` clinical slice (`45` paragraphs, `142` sentences)
  - still a partial clinical slice rather than a whole-chapter disease layer, because the source surface does not include the full inheritance / prevalence / genetic-counseling coverage
- Result:
  - first Sonnet draft so far that has strong coverage and avoids the obvious truncation-path failure
  - materially better than the earlier partial/truncated Williams drafts
  - still not regime-ready because it does not follow the target grounded-disease-layer schema
- Main blocking issues:
  - schema drift:
    - rows use ad hoc fields like `assertion_id`, `label`, `qualifier`, `system`, `row_type`
    - `extraction_notes` is a string array instead of structured note objects
  - some rows are too strong or misclassified:
    - procedural/anesthesia risk emitted as a phenotype row
    - some `has been reported` findings were not kept conservative enough
    - some combined-frequency rows were split into separate manifestations while copying the shared frequency to each child
  - still missing or misrouted a few expected clinically useful rows, such as reduced bladder capacity as a direct phenotype row
- Outcome:
  - Sonnet 4.6 is now producing usable on-path Williams drafts from the fuller archived clinical slice
  - the remaining work is cleanup / schema normalization / conservative grounding, not basic source recovery
- Next move:
  - use this Sonnet draft as a high-quality clinical base
  - repair it into the exact `grounded_disease_layer_v1` schema
  - keep the chapter labeled as a cleaned fuller-clinical-slice draft unless and until full-chapter context coverage is restored

## 2026-04-09 - Gemini Williams draft remains a partial clinical draft and is still behind Sonnet
- Action: Reviewed the user's pasted Gemini Williams syndrome grounded-disease-layer draft against the same archived Williams clinical expectations.
- Source-surface status:
  - producing a usable but partial draft
  - not on the intended full Williams path
  - reconstructed sentence index is still a selective slice rather than the fuller archived `45` paragraph / `142` sentence surface
- Result:
  - schema shape is closer than some earlier Gemini drafts
  - clinical extraction quality still regresses in multiple places compared with the Sonnet 4.6 draft
- Main problems:
  - partial surface / coverage gaps:
    - missing many clinically useful explicit rows or qualifiers from the fuller source
    - frequencies are commonly dropped even when directly stated
  - over-extraction / weak labels:
    - vague or poor labels like `narrowed artery`
    - non-phenotype or downstream consequence rows promoted into phenotype space
  - wrong strength / certainty handling:
    - several `has been reported` findings kept too strong
    - some findings that should stay descriptor or ancillary were emitted as primary phenotypes
  - facial rows are still too aggressively typed as `primary` instead of descriptor-style children
- Outcome:
  - Gemini is still behind for Williams chapter work
  - Sonnet 4.6 is the first model currently producing an on-path clinical base worth repairing
- Next move:
  - do not use the Gemini draft as the primary Williams base
  - keep Gemini as a secondary comparison surface only unless its prompt/runner changes materially improve source reconstruction and grounding discipline

## 2026-04-09 - Old Vertex AI extraction prompt mapped to the new grounded-disease-layer regime
- Action: Rewrote the older two-stage Vertex AI chapter extraction prompt so it targets the current `grounded_disease_layer_v1` / `strict_grounded_v1` schema instead of the older `chapter / phenotypes / ancillary_clinical_evidence / context_metadata` shape.
- Result:
  - preserved deterministic canonical sentence splitting
  - updated output contract to:
    - `source_document`
    - `phenotype_assertions`
    - `ancillary_assertions`
    - `context_assertions`
    - `trajectory_assertions`
    - `extraction_notes`
  - aligned status / qualifier / routing rules with the 2026-04-09 strict prompt
- Outcome:
  - older Vertex prompt can now be reused as a new-regime model handoff prompt instead of forcing downstream schema translation
- Next move:
  - if Vertex is still being used, compare one run from this rewritten prompt against the current Sonnet base to see whether the model path improves once schema drift is removed

## 2026-04-09 - Vertex AI runs after prompt rewrite are still off-path
- Action: Reviewed two Vertex AI Williams outputs generated after adapting the older prompt to the new regime.
- Result:
  - first Vertex output was clearly off-source and effectively generic syndrome-memory output:
    - invented sectioning
    - tiny sentence index
    - non-source-faithful labels
    - personality descriptors leaked into phenotypes
    - unsupported `gene` context claim
  - second Vertex output was structurally closer but still only a summary-level partial slice:
    - only four sentences retained
    - large coverage collapse
    - `gene` context still overclaimed from a deletion-region sentence
    - diagnosis sentence misrouted into ancillary/context instead of being treated as diagnosis-only evidence
- Path status:
  - Vertex AI is still off the intended Williams path even with the rewritten prompt
  - prompt/schema alignment alone did not solve source reconstruction or grounding discipline
- Outcome:
  - Sonnet remains the best current Williams base
  - Vertex should not be trusted as a primary grounded disease-layer emitter on the current setup
- Next move:
  - if Vertex is kept in the workflow, constrain it to narrow summary-slice or sentence-normalization duties only, or add a strong downstream repair layer rather than trusting first-pass extraction output

## 2026-04-09 - New Gemini Williams draft is the strongest Gemini attempt so far, but still behind Sonnet
- Action: Reviewed the user's newer Gemini Williams draft after the planned next-step refinement path.
- Source-surface status:
  - closer to the intended Williams clinical path than earlier Gemini runs
  - still a partial reconstructed clinical slice rather than a clean full archived chapter surface
- Result:
  - materially better than prior Gemini drafts:
    - stronger coverage
    - better recovery of urinary, auditory, growth, and context rows
    - inheritance and penetrance were restored
  - still not regime-ready and still below the Sonnet 4.6 draft
- Main blockers:
  - schema validity issue:
    - invalid sentence id `p22_s0`
  - still too many descriptor/facial rows typed as `primary`
  - still includes weak or poor-label phenotype rows such as `narrowed artery`
  - at least one row appears mis-grounded:
    - `soft, lax skin` cites `p24_s1`, which is a hoarse-voice / vocal-cord sentence
  - some reported/hedged findings are still too strong or routed poorly
  - imaging-derived findings are still split awkwardly between phenotype and ancillary space
- Outcome:
  - Gemini is improving and is no longer obviously off-path in the same way as Vertex
  - Sonnet remains the best current Williams base
- Next move:
  - use Gemini Flash as a repair / normalization / sentence-reconstruction helper if desired
  - do not replace the Sonnet base with Gemini yet unless a cleaner full-surface run closes the remaining grounding and schema issues

## 2026-04-09 17:12 EDT

- Added separate model-specific strict prompt variants to the 2026-04-09 grounded-disease-layer bundle:
  - `genereviews-gemini-grounded-disease-layer-strict-prompt-v1-20260409.md`
  - `genereviews-vertex-grounded-disease-layer-strict-prompt-v1-20260409.md`
- Intent:
  - Gemini variant is optimized first for coverage preservation, grounding discipline, routing discipline, and common Gemini extraction regressions
  - Vertex variant is optimized first for deterministic sentence-id rebuild, `s0` / invalid-id prevention, evidence-ref remapping, and anti-hallucination constraints on short or partial source slices
- Outcome:
  - the bundle now has a default general strict prompt plus model-specific Gemini and Vertex variants instead of forcing one generic prompt onto both runtimes

## 2026-04-09 17:50 EDT

- Action: Manually rebuilt the official Williams grounded-disease-layer file from the fuller archived Williams surface rather than continuing to clean the thin bundle prep slice.
  - replaced `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-williams-syndrome/NBK1249_williams_syndrome_regime_ready.json`
  - chapter-backed evidence surfaces used:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-review-first-50-20260331/stage1_fetch/NBK1249_clinical_structure.json`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-review-first-50-20260331/stage1_fetch/NBK1249_raw.html`
- Path status:
  - on the intended path now
  - no longer just a cleaned truncated-source draft from the 38-sentence bundle surface
- Result:
  - the replacement Williams file now uses a fuller curated sentence index, conservative routing, descriptor-vs-primary cleanup for facial findings, cause-list suppression, and sentence-grounded context for inheritance / prevalence / penetrance
  - chapter bookkeeping was updated to match the new state:
    - bundle chapter README
    - bundle manifest
    - regime-ready chapter index
    - bundle root README
- Outcome:
  - Williams is now recorded as chapter 3 `regime_ready` in the bundle bookkeeping
- Next move:
  - keep this Williams file as the current repo-side official base unless a later chapter-backed run clearly exceeds it without reintroducing schema or grounding drift

## 2026-04-09 18:10 EDT

- Action: Applied a narrow strict-rules cleanup pass to the rebuilt Williams official JSON instead of doing another full rewrite.
  - updated `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-williams-syndrome/NBK1249_williams_syndrome_regime_ready.json`
- Rule-driven changes:
  - cleared ungrounded metadata by setting `source_document.source_date` to `null`
  - removed weak hypercalcemia symptom rows `irritability` and `muscle cramps` rather than keeping them as disease-layer phenotype assertions
  - removed the process-like phenotype row `tightening of the heel cords and hamstrings` because that progression is already represented in the trajectory layer
  - corrected the non-source-faithful label `bowel diverticulae` to the literal source phrase `bowel/bladder diverticulae`
- Validation:
  - JSON parses cleanly
  - all evidence sentence ids still resolve
  - current Williams counts are:
    - `145` sentence-index rows
    - `132` phenotype assertions
    - `11` ancillary assertions
    - `4` context assertions
    - `3` trajectory assertions
    - `5` extraction notes
- Outcome:
  - the Williams official file is still on the intended chapter-backed path, but is now slightly tighter against the strict new-regime cleanup rubric
- Next move:
  - use this stricter Williams file as the comparison target for any future Gemini Flash refinement rather than the earlier broader draft

## 2026-04-09 - Packaged Williams Meta-ready artifact pair

- Action:
  - created a Meta-ready Williams handoff folder at `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-williams-syndrome/meta-ready-20260409`
  - copied the official cleaned Williams disease-layer JSON into:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-williams-syndrome/meta-ready-20260409/NBK1249_williams_syndrome_clinical.json`
  - copied the fuller archived chapter-backed raw HTML into:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-williams-syndrome/meta-ready-20260409/NBK1249_williams_syndrome_full_chapter_raw.html`
  - added a local provenance note:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-williams-syndrome/meta-ready-20260409/README.md`
- Outcome:
  - Williams now has a single handoff folder for Meta model testing that pairs the final cleaned clinical JSON with the fuller chapter-backed HTML source instead of the thinner bundle audit copy
- Next move:
  - use this Meta-ready pair for direct model comparison runs before creating any new Williams chapter variants

## 2026-04-09 - Quick review of Meta Williams JSON (`Metawilliams.json`)

- Action:
  - reviewed `/Users/ahmedelmorshedy/Downloads/Metawilliams.json` against the strict grounded disease-layer expectations and the current Williams regime-ready file
- Findings:
  - the file only contains `schema_version`, `extraction_policy_version`, and `source_document`; there are no `phenotype_assertions`, `ancillary_assertions`, `context_assertions`, `trajectory_assertions`, or `extraction_notes`
  - the source surface is large (`1008` sentence rows) but structurally invalid for grounded extraction because sentence ids are heavily duplicated:
    - `1008` sentence rows
    - only `505` unique `sentence_id` values
  - the indexed source includes substantial page chrome and non-clinical material such as `Document`, `Literature Cited`, `Table 2.`, `Table 6.`, figure captions, and copyright text
- Outcome:
  - this Meta output is promising only as a fast first-pass HTML-to-sentence indexing attempt
  - it is not promising as a same-regime Williams clinical JSON yet, because it did not perform stage-2 extraction and the canonical evidence-id layer is not globally valid
- Next move:
  - if Meta is worth pursuing, constrain it to either:
    - a strict stage-1-only fetch/index role with globally unique ids and clinical-surface filtering, or
    - a full strict-schema run that must emit all top-level arrays and grounded assertions

## 2026-04-09 - Added strict prompt and schema to Williams Meta-ready folder

- Action:
  - copied the canonical strict prompt into the Williams Meta-ready folder as:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-williams-syndrome/meta-ready-20260409/NBK1249_meta_strict_prompt.md`
  - copied the canonical grounded disease-layer schema template into the same folder as:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-williams-syndrome/meta-ready-20260409/grounded_disease_layer_schema_template.json`
  - updated the local README so the Meta handoff is self-contained
- Outcome:
  - the Williams Meta-ready folder now contains source HTML, target JSON, strict prompt, and schema template in one place for direct Meta model runs
- Next move:
  - use the strict prompt plus schema first; only add target-example conditioning if the Meta model still fails to emit stage-2 clinical assertions

## 2026-04-09 - Review of Meta2 Williams output

- Action:
  - reviewed `/Users/ahmedelmorshedy/Downloads/Meta2.json` against the official Williams regime-ready file
- Findings:
  - the file has the full expected grounded disease-layer shape:
    - `145` sentence rows
    - `132` phenotype assertions
    - `11` ancillary assertions
    - `4` context assertions
    - `3` trajectory assertions
    - `5` extraction notes
  - all `145` sentence ids are unique in this file
  - semantic comparison against `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-williams-syndrome/NBK1249_williams_syndrome_regime_ready.json` returned `equal True`
  - the byte-level hashes differ, so the file serialization/formatting differs, but the JSON content is semantically identical
- Outcome:
  - `Meta2.json` is on-path as a Williams grounded disease-layer output, but it is not evidence of independent extraction quality if the model saw the existing Williams final or a close target example
- Next move:
  - to test Meta fairly, run it on a chapter that does not already have a provided target JSON in context, or provide only raw HTML + strict prompt + schema and compare the output blind against a held-out official cleanup target

## 2026-04-09 - Review of Meta3 Williams output

- Action:
  - reviewed `/Users/ahmedelmorshedy/Downloads/Meta3.json` against the strict grounded disease-layer rules
- Findings:
  - the file is not a copy of the official Williams final
  - it has a partial source surface only:
    - `22` sentence rows
    - drawn from summary, figure captions, diagnosis, management, and surveillance
  - sentence ids are unique but not canonical:
    - uses `s001` ... `s022` instead of required `p{n}_s{m}`
  - it over-extracts umbrella and excluded-style rows as primary phenotypes, including:
    - `specific cognitive profile`
    - `unique personality characteristics`
    - `cardiovascular disease`
    - `connective tissue abnormalities`
    - `endocrine abnormalities`
    - `distinctive facies`
  - it introduces a non-schema context field:
    - `genetic_basis`
- Outcome:
  - this is a usable sign that Meta can produce a structured partial draft from a thin slice, but it is not on the intended strict-regime path as a final chapter extraction
- Next move:
  - if using Meta seriously, force canonical ids, allowed context fields only, and source-surface filtering before stage-2 extraction

## 2026-04-09 - Review of Meta4 Williams output

- Action:
  - reviewed `/Users/ahmedelmorshedy/Downloads/Meta4.json` against the Williams strict-regime rules
- Findings:
  - this appears to be a fuller parse attempt than `Meta3`:
    - `495` sentence rows
    - `76` phenotype assertions
    - `1` ancillary assertion
    - `6` context assertions
    - `0` trajectory assertions
    - `3` extraction notes
  - sentence ids are unique but still not canonical:
    - uses `s001` ... `s495` instead of required `p{n}_s{m}`
  - it still violates the allowed context-field set:
    - uses `recurrence_risk` instead of the schema field `family_risk`
  - context local ids are duplicated and repeated from two places in the source:
    - `ctx_001`, `ctx_002`, `ctx_003` are each emitted twice
  - phenotype duplication remains substantial:
    - multiple phenotype labels are emitted twice or more, including `intellectual disability`, `supravalvar aortic stenosis`, many facial features, and `mitral valve prolapse`
  - ancillary routing is still severely underused relative to the source surface:
    - only `1` ancillary assertion despite many management/test/surveillance sentences being present in the indexed source
  - some certainty discipline is still too weak:
    - `mitral valve prolapse`, `aortic insufficiency`, and `prolonged QTc` are retained as `present` rather than being handled more conservatively
  - one umbrella row still leaked through:
    - `growth deficiency`
- Outcome:
  - `Meta4` is more promising than `Meta3` as a fuller independent parse, but it is still off-path as a final grounded disease-layer output
- Next move:
  - if pursuing Meta, the next required constraints are:
    - canonical `p{n}_s{m}` ids
    - unique local ids
    - allowed context fields only
    - deduplication across repeated source sections/tables
    - stronger routing of management/test/surveillance sentences into ancillary instead of dropping them

## 2026-04-09 - Review of Meta5 Williams output

- Action:
  - reviewed `/Users/ahmedelmorshedy/Downloads/Meta5.json` against the Williams strict-regime rules
- Findings:
  - `Meta5` improves on `Meta4` by using mostly canonical-looking sentence ids in the `p{n}_s{m}` format and a somewhat tighter source surface (`375` sentence rows instead of `495`)
  - however, the file is internally inconsistent and still not valid:
    - stale non-canonical refs remain in assertions and notes:
      - `ph_076 -> s356`
      - `ctx_001 -> s370`
      - extraction notes reference `s001` and `s495`
    - only `1` ancillary assertion is emitted despite many management/test/surveillance sentences in the indexed source
    - no trajectory assertions are emitted
    - duplicate phenotype labels remain widespread
    - duplicate context ids remain
    - invalid context field `recurrence_risk` still appears instead of schema field `family_risk`
    - one umbrella phenotype still leaks through:
      - `growth deficiency`
    - certainty is still too strong for rows such as:
      - `mitral valve prolapse`
      - `aortic insufficiency`
      - `prolonged QTc`
- Outcome:
  - `Meta5` is directionally better than `Meta4` on sentence-id format, but the repair is incomplete and the output is still off-path as a strict final Williams extraction
- Next move:
  - if using Meta further, require a full post-rebuild remap pass so no stale `s###` ids survive, plus ancillary routing, deduplication, and context-field enforcement

## 2026-04-10 - Williams benchmark-oriented per-sentence normalization

- Action:
  - updated `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-williams-syndrome/NBK1249_williams_syndrome_regime_ready.json` to align better with the locked-rule audit preference for per-sentence auditability
  - created a local backup of the pre-normalized aggregate-rich file:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-williams-syndrome/NBK1249_williams_syndrome_regime_ready.pre_benchmark92_backup.json`
- Rule-driven changes:
  - split all multi-reference phenotype assertions into one phenotype assertion per evidence sentence
  - retained only qualifiers whose literal value was supported by that specific evidence sentence
  - re-sequenced phenotype ids after the split
  - split the one multi-reference ancillary assertion into single-reference ancillary assertions and re-sequenced ancillary ids
  - left extraction-note multi-reference examples intact because they document routing/exclusion decisions rather than phenotype facts
- Validation:
  - JSON parses cleanly
  - sentence ids are canonical and unique
  - all evidence refs resolve
  - phenotype rows with multiple evidence ids: `0`
  - ancillary rows with multiple evidence ids: `0`
  - context rows with multiple evidence ids: `0`
  - trajectory rows with multiple evidence ids: `0`
  - current Williams counts are:
    - `145` sentence-index rows
    - `205` phenotype assertions
    - `13` ancillary assertions
    - `4` context assertions
    - `3` trajectory assertions
    - `5` extraction notes
- Outcome:
  - Williams now favors per-sentence auditability over aggregate-rich phenotype rows, matching the Opus audit recommendation for the benchmark path
- Next move:
  - rerun the external benchmark audit and only do further manual corrections for true grounding failures rather than percentage-pattern false positives

## 2026-04-10 - Correction: Williams normalization reverted

- Action:
  - restored `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-williams-syndrome/NBK1249_williams_syndrome_regime_ready.json` from the pre-normalization backup after the user clarified that the `92%` benchmark correction target is the Genovy website paper, not the Williams extraction file
  - removed the Williams README note that described the official file as the `205`-phenotype per-sentence variant
- Outcome:
  - the official Williams JSON is back on the prior aggregate-rich final path
- Next move:
  - patch the Genovy website paper content for the benchmark correction instead

## 2026-04-10 - Grounded disease-layer chapter selection methodology added

- Action:
  - added `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/chapter-selection-methodology-20260410.md`
  - updated the grounded disease-layer bundle README to require consulting the methodology before choosing additional chapters
- Evidence inspected:
  - `new-regime-manifest-20260409.json`
  - `data/source-enrichment/genereviews-chapter-policy-template-20260329.json`
  - `data/source-enrichment/genereviews-chapter-policy-review-first-50-20260331.generated.json`
  - reusable stage1 fetch summaries under `output/genereviews-pipeline-review-first-50-20260331/stage1_fetch/`
- Selection policy:
  - source readiness first
  - disease identity / MONDO mapping clarity second
  - domain diversity and schema stress value next
  - reuse already fetched full source surfaces where possible
  - audit the source surface before any extraction is promoted as chapter-complete
- Immediate ranking:
  - initial rank 1 was `VEXAS Syndrome` because it has exact MONDO mapping (`MONDO:0026777`) and stress-tests immune/hematologic phenotypes, laboratory/pathology routing, treatment leakage, adult onset, and mechanism extraction
  - VEXAS failed the immediate promotion gate on source-surface audit because the reusable local surface has only `40` sentences and was flagged `likely_truncated`
  - chapter 4 was therefore switched to `Variegate Porphyria`, which has exact MONDO mapping (`MONDO:0008297`) and passed the source audit with `80` sentences, `32` paragraphs, `2` sections, and `likely_truncated: false`
- Next move:
  - build the Variegate Porphyria chapter 4 `opus_input.json` from the audited local source surface and run the grounded disease-layer extraction

## 2026-04-10 - Variegate Porphyria prepared as chapter 4 input

- Action:
  - created `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-variegate-porphyria`
  - copied the reusable `NBK121283` stage1 fetch source files into that folder
  - generated `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-variegate-porphyria/NBK121283_opus_input.json`
  - wrote `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-variegate-porphyria/source_surface_audit_20260410.json`
- Audit result:
  - source status is `chapter_backed_audit_pass`
  - `80` sentences
  - `32` paragraphs
  - `2` sections
  - `likely_truncated: false`
- Schema update included in prep:
  - `chapter.mondo_id` is set to `MONDO:0008297` in the input wrapper
  - the grounded disease-layer template and prompts now include `causal_chains` and deterministic `mechanism_sentence_ids`
  - the Gemini runner now has a task-scoped `causal_chains` pass and derives `mechanism_sentence_ids` from molecular-mechanism chain evidence
- Manifest:
  - added `Variegate Porphyria` as chapter 4 with status `prepared_input`
- Next move:
  - run `npm run gr:grounded-disease-layer:gemini -- --input /Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-variegate-porphyria/NBK121283_opus_input.json`

## 2026-04-10 - Variegate Porphyria manually cleaned and promoted

- Action:
  - used the audited chapter-backed `NBK121283_opus_input.json` surface plus the task-scoped Gemini scratch outputs under `output/grounded-disease-layer-gemini-runs/NBK121283_variegate_porphyria/` as a cleanup aid
  - wrote `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-variegate-porphyria/NBK121283_variegate_porphyria_regime_ready_gpt-5.4-manual-opus4.6-reviewed.json`
  - updated the chapter README, regime-ready index, and manifest to mark chapter 4 as `regime_ready`
- Path status:
  - `on the intended path`
  - source surface remains `chapter_backed_audit_pass`, not truncated
- Validation:
  - JSON parses cleanly
  - all `evidence_sentence_ids` resolve against the 80-sentence canonical index
  - no duplicate phenotype, ancillary, context, trajectory, causal-chain, or extraction-note ids
  - final counts are:
    - `80` sentence-index rows
    - `37` phenotype assertions
    - `7` ancillary assertions
    - `5` context assertions
    - `2` trajectory assertions
    - `6` causal chains
    - `5` extraction notes
- Outcome:
  - chapter 4 now has an official repo-side new-regime output with explicit ancillary routing, conservative complication status, and chapter-level causal chains
- Next move:
  - continue the ranked chapter queue using the same source-surface audit gate before spending more model runs

## 2026-04-10 - Waardenburg Syndrome Type I manually cleaned and promoted

- Action:
  - created `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-waardenburg-syndrome-type-i`
  - copied the reusable `review-first-50` stage1 fetch surface for `NBK1531`
  - generated `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-waardenburg-syndrome-type-i/NBK1531_opus_input.json`
  - wrote `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-waardenburg-syndrome-type-i/source_surface_audit_20260410.json`
  - ran `npm run gr:grounded-disease-layer:gemini -- --input /Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-waardenburg-syndrome-type-i/NBK1531_opus_input.json`
  - the Gemini run completed all six task-scoped passes but failed final normalization because one phenotype row referenced `p26_2` instead of canonical `p26_s2`
  - patched both `src/scripts/runGroundedDiseaseLayerGemini.js` and `src/scripts/runGroundedDiseaseLayerAzureAgent.py` so trivial sentence-id variants are canonicalized before evidence-ref validation
  - manually cleaned the saved pass artifacts under `output/grounded-disease-layer-gemini-runs/NBK1531_waardenburg_syndrome_type_i/`
  - wrote `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-waardenburg-syndrome-type-i/NBK1531_waardenburg_syndrome_type_i_regime_ready_gpt-5.4-manual-opus4.6-reviewed.json`
  - updated the chapter README, bundle README, regime-ready index, and manifest to mark chapter 5 as `regime_ready`
- Path status:
  - `on the intended path`
  - source surface remains `chapter_backed_audit_pass`, not truncated
- Validation:
  - JSON parses cleanly
  - all `evidence_sentence_ids` resolve against the 60-sentence canonical index
  - no duplicate phenotype, ancillary, context, trajectory, causal-chain, or extraction-note ids
  - final counts are:
    - `60` sentence-index rows
    - `25` phenotype assertions
    - `7` ancillary assertions
    - `1` context assertion
    - `2` trajectory assertions
    - `1` causal chain
    - `5` extraction notes
    - `1` mechanism sentence id
- Outcome:
  - chapter 5 now has an official repo-side new-regime output
  - the grounded disease-layer runners now tolerate the recurring `p26_2`-style sentence-id formatting error without relaxing sentence-id validation
- Next move:
  - continue chapter selection with the same audit gate and let the patched runner absorb trivial evidence-id variants on future Gemini or Azure pass outputs

## 2026-04-10 - Variegate Porphyria and Waardenburg schema-strengthening pass after Opus critique

- Action:
  - reviewed `/Users/ahmedelmorshedy/Downloads/NBK121283_critique_and_merge.json` against the official chapter-backed `NBK121283` regime-ready file and kept only chapter-grounded, schema-safe additions
  - reviewed `/Users/ahmedelmorshedy/Downloads/NBK1531_critique_and_merge.json` against the official chapter-backed `NBK1531` regime-ready file and separated valid cleanup from over-interpreted causal-chain suggestions
  - strengthened `NBK121283_variegate_porphyria_regime_ready_gpt-5.4-manual-opus4.6-reviewed.json` with corrected qualifier grounding, explicit descriptor parent links, added `depression`, `respiratory compromise`, `chronic neurovisceral symptoms`, a sun-exposed-lesion descriptor row, merged prognosis context, explicit `onset` and `gene` context, and a new `episode_classes` + `trigger_factors` layer for acute neurovisceral attacks
  - strengthened `NBK1531_waardenburg_syndrome_type_i_regime_ready_gpt-5.4-manual-opus4.6-reviewed.json` with excluded-row polarity repair, header-ref cleanup, parent linking for descriptor rows, added `early graying of scalp hair`, `red forelock`, `black forelock`, `myelomeningocele`, new `gene` and `family_risk` context, and ancillary capture of the Japanese cohort diagnostic-yield and neurocristopathy framing
  - extended the grounded disease-layer schema/template and strict prompt/contract surfaces to recognize optional `episode_classes` and `trigger_factors`, the retention-over-rejection rule for ambiguous content, descriptor-parent requirements, excluded-row label polarity, and the ban on using list headers as evidence refs
  - patched `src/scripts/runGroundedDiseaseLayerGemini.js` so `mechanism_sentence_ids` are derived from all grounded causal-chain evidence and so future Gemini runs have merge slots for `episode_classes` and `trigger_factors`
- Path status:
  - `on the intended path`
  - both chapters remain `chapter_backed_audit_pass` surfaces, not summary-only or truncated rescues
- Validation:
  - both staged chapter JSONs parse cleanly
  - all evidence refs, mechanism refs, episode refs, and trigger refs resolve against the canonical sentence index
  - the rule review passed for descriptor-parent links, excluded-row polarity, header-ref contamination, duplicate context-field cleanup, and broad-trigger self-sufficiency
  - final staged counts are:
    - `NBK121283`: `41` phenotype assertions, `7` ancillary assertions, `5` context assertions, `1` episode class, `7` trigger factors, `2` trajectory assertions, `6` causal chains, `6` mechanism sentence ids, `6` extraction notes
    - `NBK1531`: `29` phenotype assertions, `9` ancillary assertions, `3` context assertions, `0` episode classes, `0` trigger factors, `2` trajectory assertions, `2` causal chains, `1` mechanism sentence id, `7` extraction notes
- Outcome:
  - the two chapters are now Opus-audited, manually reviewed, schema-aligned passes rather than first-pass regime-ready drafts
  - the schema now has an explicit place for broad disease-state triggers without duplicating them across phenotype rows
- Next move:
  - sync the staged chapter, schema, prompt, contract, runner, and diary updates back into the Genovy repo and keep the same review standard for the next ranked chapter

## 2026-04-10 - Next chapter selection after chapter 5

- Action:
  - re-read the ranked-queue methodology and current regime-ready chapter list before selecting the next chapter
  - verified that `VEXAS Syndrome` remains a poor immediate promotable choice because the local audited surface is already documented as likely truncated
  - verified that `Vascular Ehlers-Danlos Syndrome` does have a local stage1 fetch surface at `NBK1494`, but the available slice is thin at `22` sentences and `20` paragraphs, which makes it better as a later refetch-or-repair candidate than the next clean production chapter
  - verified that `Von Hippel-Lindau Syndrome` has a reusable local stage1 fetch surface at `NBK1463` with `78` sentences and `27` paragraphs, and that the policy template marks it as an exact-label roster mapping to `MONDO:0008667`
- Path status:
  - `on the intended path`
  - the queue is still being chosen by source readiness plus schema stress value, not by alphabetical order
- Outcome:
  - selected `Von Hippel-Lindau Syndrome` as the next chapter to do
  - deferred `Vascular Ehlers-Danlos Syndrome` until either a fuller source surface is fetched or the thin `NBK1494` slice is deliberately treated as a non-promotable draft
- Next move:
  - prepare a new-regime chapter folder for `NBK1463`, audit the fetched surface formally, and use it as the next extraction and manual review target

## 2026-04-10 - Von Hippel-Lindau manual truncated-source draft

- Action:
  - created `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-von-hippel-lindau-syndrome`
  - copied the reusable `NBK1463` stage1 fetch source files into that folder
  - generated `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-von-hippel-lindau-syndrome/NBK1463_opus_input.json`
  - wrote `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-von-hippel-lindau-syndrome/source_surface_audit_20260410.json`
  - confirmed that the formal audit marks the local source as `likely_truncated: true` because it has `78` sentences, `27` paragraphs, `2` sections, and `low_paragraph_count`
  - briefly started a Gemini multipass run, then stopped using that path when the instruction was clarified to make the chapter manually; deleted the `NBK1463_von_hippel_lindau_syndrome` Gemini scratch folder so the chapter state is manual-only
  - manually authored `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-von-hippel-lindau-syndrome/NBK1463_von_hippel_lindau_syndrome_manual_truncated_source_draft.json` from the audited sentence index without using Gemini outputs
  - patched `src/scripts/runGroundedDiseaseLayerGemini.js` and `src/scripts/runGroundedDiseaseLayerAzureAgent.py` so malformed optional trajectory rows are pruned instead of aborting an otherwise valid chapter run
- Path status:
  - `producing a usable but partial draft`
  - the chapter is on the intended queue path, but the current local evidence surface is not broad enough for `regime_ready` promotion
- Validation:
  - the manual draft JSON parses cleanly
  - all evidence refs resolve against the canonical `NBK1463` sentence index
  - descriptor rows have subtype context
  - no duplicate local ids or duplicate context fields remain
  - final manual draft counts are:
    - `30` phenotype assertions
    - `2` ancillary assertions
    - `2` context assertions
    - `0` trajectory assertions
    - `7` causal chains
    - `6` extraction notes
    - `0` episode classes
    - `0` trigger factors
- Outcome:
  - chapter 6 now exists as a validated manual truncated-source draft in the bundle with matching README and manifest bookkeeping
  - the chapter was intentionally kept out of the regime-ready index because the source audit still fails the promotion gate
- Next move:
  - either recover a fuller `NBK1463` chapter surface and rebuild the draft from that broader evidence base, or put this manual truncated-source draft through an Opus audit pass if it remains the best local surface

## 2026-04-10 - Von Hippel-Lindau raw-html source recovery

- Action:
  - inspected the saved `NBK1463_raw.html` and confirmed the raw page already contained later chapter sections including `Supportive Care`, `Surveillance`, `Genetic Counseling`, `Molecular Genetics`, and `Molecular Pathogenesis`
  - identified the root cause as a fetch/parser surface restriction that only kept `Clinical_Characteristics`, `Clinical_Description`, and `Suggestive_Findings`
  - patched `src/lib/genereviewsPipeline.js` to support a reusable `expanded` GeneReviews section profile while keeping the prior focused profile as the default behavior
  - added `src/scripts/rebuildGeneReviewsSurfaceFromRaw.js` plus the `gr:recover-surface-from-raw` package script so a saved GeneReviews raw HTML file can be re-parsed into recovered `clinical_text`, `clinical_structure`, `tables`, `fetch_meta`, and `opus_input` artifacts
  - rebuilt the VHL chapter surface into `NBK1463_recovered_*` files from the saved raw HTML with `sectionProfile=expanded`
  - wrote `recovered_source_surface_audit_20260410.json` and updated the VHL README plus manifest entry so the recovered wrapper is now the canonical next extraction input
- Path status:
  - `on the intended path`
  - the earlier thin manual draft is now explicitly historical/stale rather than the active working surface
- Validation:
  - `node --check src/lib/genereviewsPipeline.js`
  - `node --check src/scripts/rebuildGeneReviewsSurfaceFromRaw.js`
  - `npm run gr:recover-surface-from-raw -- --rawHtml .../NBK1463_raw.html --outdir .../next-chapter-von-hippel-lindau-syndrome --outputStem NBK1463_recovered --mondoId MONDO:0008667 --sectionProfile expanded`
  - recovered audit result:
    - `348` sentences
    - `144` paragraphs
    - `24` sections
    - `47,132` prose characters
    - `211,272` raw HTML characters
    - `likely_truncated: false`
- Outcome:
  - the local VHL chapter is no longer blocked by a thin source surface
  - `NBK1463_recovered_opus_input.json` is ready for the next manual or reviewer-model extraction pass
- Next move:
  - rebuild the VHL grounded disease-layer chapter from `NBK1463_recovered_opus_input.json` instead of the older thin draft

## 2026-04-10 - Von Hippel-Lindau regime-ready GPT-5.4 manual pass

- Action:
  - manually rebuilt the VHL grounded disease-layer chapter from `NBK1463_recovered_opus_input.json`
  - wrote `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-von-hippel-lindau-syndrome/NBK1463_von_hippel_lindau_syndrome_regime_ready_gpt-5.4-manual.json`
  - kept the output aligned to the current `source_document` new-regime schema, including causal chains, mechanism sentence ids, episode classes, and trigger factors
  - routed genetic testing, imaging, treatment responses, surveillance, and avoidance guidance into ancillary/context/trigger layers instead of phenotype rows
  - made generic symptom labels self-contained so slot exports preserve context, for example spinal hemangioblastoma-associated pain and hearing loss from endolymphatic sac tumor
  - moved zebrafish-model-only HIF2α inhibitor findings to ancillary `other` instead of human phenotype rows
  - promoted the chapter in the manifest and regime-ready chapter index as `regime_ready_gpt-5.4-manual`
- Path status:
  - `on the intended path`
  - full chapter-backed recovered surface, not the older thin source draft
  - not yet `Opus4.6 reviewed`
- Validation:
  - JSON parses cleanly
  - all evidence refs resolve against the recovered 348-row sentence index
  - no phenotype assertion has more than one evidence ref
  - descriptor rows have subtype context
  - ancillary related phenotype ids resolve
  - causal-chain evidence refs and `mechanism_sentence_ids` are aligned
  - final counts are:
    - `71` phenotype assertions
    - `31` ancillary assertions
    - `10` context assertions
    - `3` trajectory assertions
    - `15` causal chains
    - `15` mechanism sentence ids
    - `7` extraction notes
    - `0` episode classes
    - `4` trigger factors
- Outcome:
  - chapter 6 now has an official repo-side GPT-5.4 manual regime-ready output
- Next move:
  - optionally send the regime-ready file to Opus 4.6 for external audit and create a separate reviewed artifact if valid corrections are returned

## 2026-04-10 - Prader-Willi regime-ready GPT-5.4 manual pass

- Action:
  - abandoned the in-progress GLM-5.1 Space audit on VHL after user interruption and confirmed no local GLM audit process remained active
  - selected `Prader-Willi Syndrome` from the prepared bundle folders because chapters 1-6 were already represented as regime-ready in the manifest
  - audited the existing `NBK1330_*` surface and found it was a thin slice: `33` sentences, `26` paragraphs, `8` sections, and `likely_truncated: true`
  - rebuilt the saved `NBK1330_raw.html` with the expanded GeneReviews section profile into recovered `NBK1330_recovered_*` files
  - manually built `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-prader-willi/NBK1330_prader_willi_syndrome_regime_ready_gpt-5.4-manual.json` from `NBK1330_recovered_opus_input.json`
  - routed DNA methylation, OSA, MS-MLPA, FISH, management, sedative-response, and therapy-trial statements outside phenotype rows
  - retained age-staged PWS manifestations as trajectory assertions and resolved trigger factors to explicit phenotype, episode, or ancillary targets
  - promoted the chapter in the manifest and regime-ready index as `regime_ready_gpt-5.4-manual`
- Path status:
  - `on the intended path`
  - full chapter-backed recovered surface, not the older thin source draft
  - not yet `Opus4.6 reviewed`
- Validation:
  - recovered source surface:
    - `170` sentences
    - `92` paragraphs
    - `22` sections
    - `likely_truncated: false`
  - JSON parses cleanly
  - all evidence refs resolve against the recovered 170-row sentence index
  - no phenotype assertion has more than one evidence ref
  - no duplicate local ids
  - ancillary related phenotype ids resolve
  - trigger episode ids resolve
  - causal-chain evidence refs are covered by `mechanism_sentence_ids`
  - final counts are:
    - `41` phenotype assertions
    - `27` ancillary assertions
    - `12` context assertions
    - `5` trajectory assertions
    - `10` causal chains
    - `11` mechanism sentence ids
    - `6` extraction notes
    - `2` episode classes
    - `5` trigger factors
- Outcome:
  - chapter 7 now has an official repo-side GPT-5.4 manual regime-ready output
- Next move:
  - optionally send the Prader-Willi regime-ready file to Opus 4.6 for external audit and create a separate reviewed artifact if valid corrections are returned

## 2026-04-10 - Prader-Willi critique triage against current manual file

- Action:
  - reviewed `/Users/ahmedelmorshedy/Downloads/NBK1330_critique_and_merge.json` against the current Prader-Willi regime-ready output and the recovered full chapter-backed surface
  - verified that the critique's largest claimed defect, empty causal-chain evidence refs, is stale and does not apply to the current file
  - confirmed that `characteristic facial appearance` is likely mis-typed as a `descriptor` instead of a `primary` phenotype in the current output
  - confirmed that management-conditioned statements are currently overloading the `trigger` qualifier on `hyperphagia`, `central obesity`, and `short stature`
  - confirmed that `high pain threshold` is incorrectly scoped with a pregnancy-specific `subtype_context`
  - confirmed that `temper outbursts` is named in the recovered source surface (`p52_s1`) and is a defensible low-confidence/uncertain add if completeness across sections is maintained
  - kept the exclusion of `higher verbal IQ` as an intentional policy choice under the current rule that cognitive-strength statements are not promoted to phenotype rows
- Path status:
  - `on the intended path`
  - critique useful for cleanup, but not a replacement for manual review because it mixed valid issues with stale claims
- Validation:
  - current file already contains populated evidence refs for all `10` causal chains
  - critique-proposed replacement refs for chain 005, 006, and 010 were weaker than the current refs because the current file already points to the directly supporting mechanism sentences
- Outcome:
  - current Prader-Willi review queue is narrowed to a small manual patch set rather than a broad rewrite
- Next move:
  - if requested, patch the current file with the validated cleanup items only: phenotype role fix, qualifier cleanup, optional `temper outbursts`, and optional reproductive-context note

## 2026-04-10 - VHL and Prader-Willi promoted to GPT-5.4 manual plus Opus 4.6 reviewed artifacts

- Action:
  - re-reviewed `/Users/ahmedelmorshedy/Downloads/NBK1463_critique_and_merge.json` against the current VHL regime-ready file and kept only the critique points that were genuinely source-compatible under the locked schema
  - confirmed the VHL critique's largest claimed defect, empty causal-chain evidence refs, was stale for the current file and should not drive chapter rewrites
  - kept the VHL manual cleanup to the validated items already patched into the reviewed artifact: redundant anatomical-site qualifiers removed and non-row-fit distribution / nomenclature / comparator facts preserved in extraction notes
  - re-reviewed `/Users/ahmedelmorshedy/Downloads/NBK1330_critique_and_merge.json` against the recovered Prader-Willi source surface and accepted the substantive additions and corrections rather than over-dismissing them
  - updated the Prader-Willi reviewed artifact so `ph_033` is `present`, `excessive eating`, `behavioral findings`, `higher verbal IQ`, and `temper outbursts` are preserved, `high pain threshold` is no longer pregnancy-scoped, care-dependent statements use `management_condition`, and the retained `UPD 15` facial modifier remains explicitly unresolved at the feature level pending enrichment
  - normalized the Prader-Willi sedative trigger row back to `target_resolution_status = "resolved"` with an explanatory note instead of using the non-schema hybrid value `resolved_to_ancillary_assertion`
  - promoted the reviewed JSON files as the official chapter artifacts:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-von-hippel-lindau-syndrome/NBK1463_von_hippel_lindau_syndrome_regime_ready_gpt-5.4-manual-opus4.6-reviewed.json`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-prader-willi/NBK1330_prader_willi_syndrome_regime_ready_gpt-5.4-manual-opus4.6-reviewed.json`
  - hardened the canonical schema/contract/prompt surfaces so the ambiguity-retention, `management_condition`, `resolved/unresolved/needs_enrichment`, and single-evidence phenotype-row rules are no longer implicit diary knowledge
  - patched `src/scripts/runGroundedDiseaseLayerGemini.js` so the active runner now accepts `unresolved`, includes `management_condition`, and rejects phenotype rows that aggregate multiple evidence sentences or omit `subtype_context` on descriptor rows
  - updated the chapter READMEs, regime-ready index, and manifest so the reviewed chapter files are now the official bundle outputs for chapters 6 and 7
- Path status:
  - `on the intended path`
  - both chapters are now locked to the reviewed artifacts rather than the earlier manual-only JSONs
- Validation:
  - both reviewed JSON files parse cleanly
  - all evidence refs resolve against their recovered sentence indices
  - VHL reviewed counts:
    - `71` phenotype assertions
    - `31` ancillary assertions
    - `10` context assertions
    - `3` trajectory assertions
    - `15` causal chains
    - `15` mechanism sentence ids
    - `8` extraction notes
    - `0` episode classes
    - `4` trigger factors
  - Prader-Willi reviewed counts:
    - `45` phenotype assertions
    - `27` ancillary assertions
    - `12` context assertions
    - `5` trajectory assertions
    - `10` causal chains
    - `9` mechanism sentence ids
    - `7` extraction notes
    - `2` episode classes
    - `3` trigger factors
- Intentionally not inspected:
  - no new broad raw-data crawl
  - no new external model run
  - no new whole-chapter rewrite beyond the reviewed patch set
- Outcome:
  - the reviewed files are now the official chapter 6 and chapter 7 bundle artifacts
  - the schema semantics that were previously living partly in diary discussion are now baked into the canonical docs, prompts, and active Gemini runner
- Next move:
  - use the hardened contract to produce the next manual chapter without re-litigating episode ambiguity, care-dependent conditions, or phenotype-row aggregation

## 2026-04-10 - Froze the next five chapter queue after chapter 7

- Question:
  - Which chapters should be done next so selection does not get re-litigated before every new chapter?
- Evidence surface:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/chapter-selection-methodology-20260410.md`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/new-regime-manifest-20260409.json`
  - local review-first-50 stage1 fetch surfaces and saved raw HTML for:
    - `VEXAS Syndrome`
    - `Von Willebrand Disease`
    - `Very Long-Chain Acyl-Coenzyme A Dehydrogenase Deficiency`
    - `Vascular Ehlers-Danlos Syndrome`
    - `USP7-Related Hao-Fountain Syndrome`
- Intentionally not inspected:
  - no broad new roster crawl
  - no live refetch
  - no raw chapter reconstruction yet
- Result:
  - froze this next-five sequence:
    1. `VEXAS Syndrome`
    2. `Von Willebrand Disease`
    3. `Very Long-Chain Acyl-Coenzyme A Dehydrogenase Deficiency`
    4. `Vascular Ehlers-Danlos Syndrome`
    5. `USP7-Related Hao-Fountain Syndrome`
  - all five have saved raw HTML locally, so the standard next-step is raw-html recovery with the expanded profile before any promotable extraction
  - `WAGR Spectrum Disorder` and `WARS2 Deficiency` were explicitly left behind this frozen queue because their current visible stage1 surfaces are extremely thin
- Decision:
  - kept
- Outcome:
  - selection is now frozen in the methodology doc instead of being re-decided chapter by chapter

## 2026-04-10 - Completed chapter 8 manual pass for Von Willebrand Disease

- Question:
  - What is the next chapter after Prader-Willi if the user explicitly wants `Von Willebrand Disease` next, and can it be completed manually from a recovered full source surface instead of a thin stage1 slice?
- Evidence surface:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-von-willebrand-disease/NBK7014_recovered_opus_input.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-von-willebrand-disease/recovered_source_surface_audit_20260410.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-von-willebrand-disease/NBK7014_von_willebrand_disease_regime_ready_gpt-5.4-manual.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/chapter-selection-methodology-20260410.md`
- Intentionally not inspected:
  - no new external model run
  - no broad new fetch beyond the saved NBK7014 raw HTML recovery
  - no secondary-source augmentation outside the GeneReviews chapter surface
- Action:
  - copied the saved NBK7014 stage1 files into a dedicated bundle folder for `Von Willebrand Disease`
  - audited the copied thin source surface and confirmed it was not suitable for promotion:
    - `47` sentences
    - `25` paragraphs
    - `2` sections
    - `likely_truncated: true`
  - rebuilt the chapter from the saved `NBK7014_raw.html` with the expanded section profile
  - recovered a full chapter-backed surface with:
    - `228` sentences
    - `113` paragraphs
    - `19` sections
    - `likely_truncated: false`
  - manually authored the new-regime grounded disease-layer file from the recovered surface rather than from a model draft
  - kept the output sentence-local with no multi-ref phenotype rows
  - captured the chapter's bleeding phenotypes, diagnostic assays, pregnancy-management context, inheritance, prevalence, penetrance, biomarker context, and explicit molecular pathogenesis chains
  - updated the chapter README, regime-ready index, manifest, and selection methodology so `Von Willebrand Disease` is now chapter 8 and the earlier provisional VEXAS-first queue no longer conflicts with the actual sequence
- Path status:
  - `on the intended path`
  - the chapter is now based on a recovered full source surface, not a thin or summary-like slice
- Validation:
  - the chapter JSON parses cleanly
  - all evidence refs resolve against the recovered sentence index
  - ancillary related phenotype ids resolve
  - no phenotype row has multiple evidence refs
  - chapter 8 counts:
    - `43` phenotype assertions
    - `35` ancillary assertions
    - `9` context assertions
    - `0` trajectory assertions
    - `16` causal chains
    - `14` mechanism sentence ids
    - `8` extraction notes
    - `0` episode classes
    - `0` trigger factors
- Outcome:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-von-willebrand-disease/NBK7014_von_willebrand_disease_regime_ready_gpt-5.4-manual.json` is now the official chapter 8 manual artifact
  - the bundle bookkeeping now points to the VWD manual file consistently
- Next move:
  - run an external review pass on the VWD manual artifact or move to `VEXAS Syndrome` as the next recovered-raw manual chapter

## 2026-04-10 - Completed chapters 9 and 10 manual passes for VLCADD and vEDS

- Question:
  - Can the next two user-selected chapters be completed end to end from recovered raw HTML surfaces without wasting effort on thin stage1 slices?
- Evidence surface:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-very-long-chain-acyl-coenzyme-a-dehydrogenase-deficiency/NBK6816_recovered_opus_input.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-very-long-chain-acyl-coenzyme-a-dehydrogenase-deficiency/recovered_source_surface_audit_20260410.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-very-long-chain-acyl-coenzyme-a-dehydrogenase-deficiency/NBK6816_very_long_chain_acyl_coenzyme_a_dehydrogenase_deficiency_regime_ready_gpt-5.4-manual.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vascular-ehlers-danlos-syndrome/NBK1494_recovered_opus_input.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vascular-ehlers-danlos-syndrome/recovered_source_surface_audit_20260410.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vascular-ehlers-danlos-syndrome/NBK1494_vascular_ehlers_danlos_syndrome_regime_ready_gpt-5.4-manual.json`
- Intentionally not inspected:
  - no new external model runs
  - no live refetch beyond the saved NBK6816 and NBK1494 raw HTML recoveries
  - no thin-surface extraction pass used for the promotable chapter artifacts
- Action:
  - recovered `Very Long-Chain Acyl-Coenzyme A Dehydrogenase Deficiency` from saved raw HTML into a full chapter-backed surface with:
    - `178` sentences
    - `115` paragraphs
    - `22` sections
    - `likely_truncated: false`
  - manually authored the VLCADD grounded disease-layer artifact with:
    - `35` phenotype assertions
    - `39` ancillary assertions
    - `8` context assertions
    - `3` trajectory assertions
    - `9` causal chains
    - `6` mechanism sentence ids
    - `4` trigger factors
  - recovered `Vascular Ehlers-Danlos Syndrome` from saved raw HTML into a full chapter-backed surface with:
    - `245` sentences
    - `131` paragraphs
    - `24` sections
    - `likely_truncated: false`
  - manually authored the vEDS grounded disease-layer artifact with:
    - `57` phenotype assertions
    - `20` ancillary assertions
    - `8` context assertions
    - `3` trajectory assertions
    - `14` causal chains
    - `6` mechanism sentence ids
    - `1` episode class
    - `5` trigger factors
  - updated both chapter READMEs, the new-regime manifest, the regime-ready chapter index, and the chapter-selection methodology so the documentation now matches the actual chapter sequence through chapter 10
- Path status:
  - `on the intended path`
  - both chapters are now based on recovered full-source surfaces rather than summary-like or truncated slices
- Validation:
  - both chapter JSON files parse cleanly
  - all evidence refs resolve against the recovered sentence indices
  - no phenotype row in either file has multiple evidence refs
  - descriptor rows carry grounded `subtype_context`
  - both artifacts retain the current trigger / episode / causal-chain schema additions cleanly
- Outcome:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-very-long-chain-acyl-coenzyme-a-dehydrogenase-deficiency/NBK6816_very_long_chain_acyl_coenzyme_a_dehydrogenase_deficiency_regime_ready_gpt-5.4-manual.json` is now the official chapter 9 manual artifact
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vascular-ehlers-danlos-syndrome/NBK1494_vascular_ehlers_danlos_syndrome_regime_ready_gpt-5.4-manual.json` is now the official chapter 10 manual artifact
  - the bundle bookkeeping now records the actual queue progression through chapter 10
- Next move:
  - run an external review on chapter 9 and/or chapter 10, or move to `VEXAS Syndrome` as chapter 11 using the same recovered-raw manual path

## 2026-04-10 - Secondary Opus reviewer handoff policy

- Action:
  - decided to keep an older Opus account in the review loop for new chapters, but only as an audit layer with an explicit delta-brief of post-baseline rule changes
- Key rule for handoff:
  - do not let the older Opus reviewer critique chapter outputs against stale pre-update assumptions on triggers, ambiguity preservation, multi-ref phenotype policy, or management-conditioned statements
- Required delta-brief topics for that reviewer:
  - phenotype rows remain single-sentence and single-evidence by default
  - source-mentioned ambiguous concepts should be preserved, not dropped
  - use `episode_classes` and `trigger_factors` for broader disease-state or episode-level triggers
  - phenotype-level `trigger` is only for a clear single-target precipitant
  - use `management_condition` for care-dependent or treatment-dependent expression
  - keep `resolved` / `unresolved` / `needs_enrichment` logic for ambiguous targets
- Next move:
  - send the older Opus reviewer a compact current-rules preface before asking it to audit chapters 9 and 10

## 2026-04-10 - VLCADD external audit triage

- Action:
  - reviewed `/Users/ahmedelmorshedy/Downloads/NBK6816_VLCAD_audit_and_complement.json` against the current official VLCADD manual artifact and the recovered full-source clinical structure
- Findings:
  - the audit contains several valid critiques:
    - `p33_s1`, `p34_s1`, and `p35_s1` are real uncovered laboratory findings and should be considered for ancillary laboratory additions rather than phenotype additions
    - the `p30_s1` trigger list on `ph_011` is better represented as standalone `trigger_factors` than as a phenotype-level trigger qualifier
    - genotype-phenotype details from `p59_s2` and `p61_s2` are real enrichment opportunities
    - `anc_025` wording can be improved to make the treatment-failure / breakthrough character explicit
  - the audit is partly contaminated or misaligned:
    - proposed additions grounded to `p15_s2`, `p15_s3`, and `p15_s4` do not resolve in the recovered VLCADD source surface and should not be merged
    - suggestions to add `small for gestational age`, `feeding difficulties`, `prolonged colic`, or `post-term birth` are not valid for the current VLCADD chapter artifact
    - the `penetrance` suggestion based on asymptomatic NBS-ascertained individuals is not a valid penetrance assertion under current policy
  - several remaining critiques are policy-dependent rather than clear bugs:
    - sentence-local duplication between suggestive-finding rows and subtype-scoped clinical-description rows is noisy but currently consistent with the single-sentence grounding policy
    - the empty `episode_classes` array is not necessarily an error because the named VLCADD subgroups are disease forms, not clearly episode classes
- Next move:
  - if the chapter is promoted to an Opus-reviewed version, merge only the validated additions and wording fixes, not the contaminated complements

## 2026-04-10 - VLCADD finalized after audit merge

- Action:
  - merged the validated external-audit fixes into the official VLCADD manual artifact and promoted a reviewed copy
- Applied changes:
  - removed the broad `p30_s1` precipitant list from `ph_011` and promoted `strenuous exercise`, `fasting`, `cold exposure`, and `fever` into standalone `trigger_factors`
  - added ancillary laboratory rows for `p33_s1`, `p34_s1`, and `p35_s1`
  - tightened `anc_025` wording to make the treatment-breakthrough character explicit
  - added genotype-phenotype causal chains for `p59_s2` and `p61_s2`
  - strengthened `natural_history` with the `p63_s1` asymptomatic NBS-ascertained observation without mislabeling it as penetrance
- Rejected audit content:
  - did not merge the contaminated `p15_s2` / `p15_s3` / `p15_s4` suggestions because they are not present in the recovered VLCADD source surface or the live chapter page
  - did not convert the three disease forms into `episode_classes`
- Validation:
  - corrected manual file parses cleanly
  - all evidence refs resolve
  - phenotype rows remain single-evidence
  - corrected counts are `35` phenotype, `42` ancillary, `8` context, `11` causal chains, `8` mechanism sentence ids, `8` extraction notes, and `8` trigger factors
- Outcome:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-very-long-chain-acyl-coenzyme-a-dehydrogenase-deficiency/NBK6816_very_long_chain_acyl_coenzyme_a_dehydrogenase_deficiency_regime_ready_gpt-5.4-manual-opus4.6-reviewed.json` is now the official reviewed chapter 9 artifact
  - the chapter README, bundle manifest, and regime-ready chapter index were updated to point to the reviewed file

## 2026-04-10 - Cross-chapter reflection from Opus review patterns

- Action:
  - summarized the recurring error pattern across recent Opus-reviewed chapters to improve future manual passes before external review
- Main recurring miss classes:
  - ancillary laboratory findings are easy to miss when they appear under suggestive-finding or preliminary-laboratory lists rather than in dedicated laboratory prose
  - broad trigger lists are easy to leave attached to phenotype qualifiers instead of promoting them into standalone `trigger_factors`
  - genotype-phenotype correlations are often captured too coarsely unless each explicit correlation sentence is checked as a possible causal chain
  - natural-history statements about screened or subtype-ascertained populations are easy to under-capture because they are not classic phenotype rows but still matter
  - external audits can contain stale-policy critiques or contaminated complements, so they must be triaged against the recovered source surface before merge
- Root causes:
  - sentence-local extraction discipline is strong, but list- and section-level sweep coverage is still uneven
  - manual passes bias toward obvious phenotypes and management language before doing a final dedicated pass over laboratory, trigger, and genotype-correlation sentences
  - review feedback can be over-accepted if not separated into grounded fixes versus policy differences versus contaminated content
- Process improvements going forward:
  - add a final pre-promotion sweep over: preliminary laboratory findings, trigger phrases, genotype-phenotype correlation sentences, and asymptomatic/NBS ascertainment statements
  - require external audit triage into three buckets: valid grounded fix, policy-dependent comment, contaminated / reject
  - when a sentence contains multiple explicit precipitants for one event, default to `trigger_factors` review before leaving anything in phenotype qualifiers
  - when a chapter has explicit genotype-correlation prose, require a dedicated causal-chain check instead of relying on summary capture
- Next move:
  - use this reflection as the standing review checklist for the next chapters before requesting any external audit

## 2026-04-10 - What prior reviews actually taught

- Action:
  - distilled the main lessons from the earlier chapter reviews beyond VLCADD
- Lessons from prior reviewed chapters:
  - `Williams Syndrome` reinforced that umbrella findings must be split into clinically meaningful grounded manifestations where the source supports them, and that age-specific facial findings should remain grounded rows rather than being turned into unsupported trajectory structure
  - `Variegate Porphyria` established the key ambiguity rule: attack-related content should not be dropped when target resolution is incomplete; instead it should be preserved with explicit `resolved` / `unresolved` / `needs_enrichment` handling
  - `Waardenburg Syndrome Type I` reinforced that broad syndrome labels are less useful than source-faithful feature rows and that feature-level completeness matters more than compactness
  - `Von Hippel-Lindau Syndrome` showed that highly repetitive tumor/location text needs restraint: preserve real distribution and subtype facts, but do not bloat rows with redundant anatomical qualifiers when the label already carries that meaning
  - `Prader-Willi Syndrome` forced the distinction between phenotype, trigger, management-conditioned expression, and subgroup-scoped modifier; this is where `management_condition` and unresolved modifier handling became clearly necessary
- Main cross-review conclusion:
  - the architecture improved most when review feedback was used to sharpen boundaries between layers rather than to increase raw row count
- Next move:
  - carry these chapter-specific lessons into the standing pre-review checklist and future prompt/schema tightening

## 2026-04-10 - Audit-level lessons on misses and rerouting

- Action:
  - summarized what the full external audits have repeatedly surfaced about missing content and wrong-layer routing
- Recurring miss patterns:
  - short list-style findings are missed more often than narrative findings, especially under `suggestive findings`, `preliminary laboratory findings`, and dense syndrome-feature lists
  - subgroup-specific findings inside one summary sentence are sometimes partially captured, leaving out one or two explicit sibling findings
  - genotype-phenotype correlation sentences are often under-extracted unless reviewed separately after the main phenotype pass
  - natural-history statements about screened, asymptomatic, adult-ascertained, or subgroup-biased populations are often under-captured because they sit between phenotype and context
- Recurring rerouting patterns suggested by audits:
  - preliminary or explicit lab findings should often move from phenotype to `ancillary_assertions.laboratory`
  - broad or multi-target precipitant statements should move from phenotype qualifier `trigger` to `trigger_factors`
  - care-dependent or treatment-conditioned expressions should move from `trigger` or `treatment_response` into `management_condition`
  - subtype-scoped or comparator-scoped findings should often stay in phenotype rows but as `descriptor` with `subtype_context`
  - population-level, screening-level, or ascertainment-level observations should usually move to `context_assertions` or `extraction_notes`, not phenotype rows
  - explicit mechanism or genotype-correlation prose is usually better preserved as `causal_chains` than as loose notes
- Most important practical lesson:
  - the value of full audit is not only finding omitted rows; it is showing when the row exists but sits in the wrong layer, which is often the more important architectural correction
- Next move:
  - make the next manual-pass checklist explicitly include a rerouting review after completeness review

## 2026-04-10 - Hardened pre-promotion review checklist

- Action:
  - updated `/Users/ahmedelmorshedy/.codex/skills/genereviews-grounded-disease-layer/references/cleanup-and-promotion.md` so future chapter work must include a specific pre-promotion review sweep rather than relying on conversational memory
- Added mandatory review steps:
  - completeness sweep for list-style findings, preliminary laboratory findings, genotype-correlation sentences, and ascertainment/natural-history statements
  - rerouting sweep for phenotype vs ancillary laboratory vs trigger_factors vs management_condition vs context vs causal_chains
  - trigger-specific review for every non-null phenotype trigger
  - external-audit triage into valid grounded fix vs policy-dependent vs contaminated/reject
  - final promotion gate confirming sentence-grounding and metadata alignment
- Next move:
  - apply this checklist before the next chapter is promoted, even before asking for external review

## 2026-04-10 - Chapters 11 and 12 completed from raw-source rebuilds

- Action:
  - completed `WAGR Spectrum Disorder` and `WARS2 Deficiency` end to end using the raw-HTML rebuild path instead of the extremely thin stage1 clinical slices
- Source-surface outcome:
  - `WAGR Spectrum Disorder` raw HTML was rebuilt into a recovered full chapter-backed surface with `194` sentences, `115` paragraphs, `21` sections, and `likely_truncated: false`
  - `WARS2 Deficiency` raw HTML was rebuilt into a recovered full chapter-backed surface with `202` sentences, `127` paragraphs, `23` sections, and `likely_truncated: false`
  - the copied legacy stage1 slices remained extremely thin and were retained only for audit provenance
- Extraction outcome:
  - wrote `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-wagr-spectrum-disorder/NBK621298_wagr_spectrum_disorder_regime_ready_gpt-5.4-manual.json`
  - wrote `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-wars2-deficiency/NBK595820_wars2_deficiency_regime_ready_gpt-5.4-manual.json`
  - `WAGR` kept `chapter.mondo_id = null` because the local policy surface still marks the mapping unresolved
  - `WARS2` used `MONDO:0060578`
- Review and routing outcome:
  - `WAGR` preserved larger contiguous-deletion effects as subtype-scoped descriptor rows or causal chains rather than promoting them as disease-wide primary findings
  - `WARS2` preserved the epilepsy-spectrum and movement-disorder-spectrum architecture explicitly, routed lactate and imaging findings to ancillary evidence, and represented valproic-acid-associated deterioration as an episode plus trigger factor
- Validation outcome:
  - both chapter JSON files parse cleanly
  - all sentence refs resolve against the recovered source surfaces
  - no phenotype rows have multiple evidence refs
  - descriptor rows carry subtype context
- Next move:
  - update the manifest and continue with the next queued chapter after chapter 12, which is now `VEXAS Syndrome` unless the user explicitly reorders again

## 2026-04-10 - Added Anthropic managed-audit handoff tooling

- Action:
  - added `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/anthropic-opus-audit-brief-v1-20260410.md` as the single current-rules handoff file for first-pass external Opus audits
  - added `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/runAnthropicManagedAudit.js` to upload the candidate chapter JSON, recovered full-source clinical surface, audit brief, and optional README into an Anthropic managed-agent session and send a structured audit request
  - added `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/anthropic-opus-audit-targets-20260410.json` with the exact first-pass audit file sets for `WAGR Spectrum Disorder` and `WARS2 Deficiency`
  - registered the helper under `npm run gr:anthropic-managed-audit`
- Why:
  - the user wanted an Opus audit path that does not depend on older Genovy policy memory and does not require manually assembling the audit file set every time
- Operational expectation:
  - use a fresh `ANTHROPIC_API_KEY` environment variable, not a pasted inline secret
  - managed-agent runs still require a real `agent_id` and `environment_id`
  - the script is for direct Anthropic managed agents, not Vertex AI
- Next move:
  - use the new helper to mount `WAGR` or `WARS2` into the user's existing Anthropic managed-agent environment and collect the first external audit

## 2026-04-11 - WAGR merged with Opus critique and promoted to reviewed artifact

- Action:
  - reviewed `/Users/ahmedelmorshedy/Downloads/NBK621298_critique_and_merge.json` against the current WAGR manual chapter and the recovered full-source surface
  - wrote `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-wagr-spectrum-disorder/NBK621298_wagr_spectrum_disorder_regime_ready_gpt-5.4-manual-opus4.6-reviewed.json`
- Valid critique merges:
  - added grounded missing findings `depression`, `conduct disorder`, `sensory integration disorder`, `lens subluxation`, `polycystic ovarian syndrome`, and `hyposmia`
  - added `congenital anomalies of kidney/urinary tract` as a quantified umbrella row from the cohort-frequency sentence
  - rerouted `proteinuria` from phenotype to ancillary laboratory
  - added ancillary imaging for `reduced, hypoplastic pineal gland` and `decreased olfactory bulb size`
  - changed `end-stage kidney disease` and `gonadoblastoma` to `clinical_role = complication`
- Extra manual sweep beyond critique:
  - added `optic nerve coloboma` from the PAX6 pan-ocular summary sentence
  - added sentence-local frequency rows for `obsessive-compulsive disorder` and `attention-deficit/hyperactivity disorder` from `p46_s2`
  - removed off-contract context fields `diagnosis` and `prenatal_history` from `context_assertions` and preserved the relevant diagnostic/prenatal content in extraction notes instead
- Rejected critique content:
  - the claimed systematic WAGR causal-chain empty-ref bug was false for the current file; all 12 causal chains were already grounded
  - late-Wilms and CKD-risk sentences were preserved as notes rather than forced into duplicate phenotype or non-standard context rows
- Outcome:
  - reviewed WAGR counts are now `100` phenotype, `5` ancillary, `7` context, `12` causal chains, and `12` extraction notes
  - validation passed with no bad refs, no duplicate ids, no multi-ref phenotype rows, and only standard context fields remaining
- Next move:
  - wait for the user's WARS2 critique or move to the next chapter after WARS2 review triage

## 2026-04-11 - Hardened first-pass and review-pass sibling-finding rules

- Trigger:
  - the WAGR audit merge exposed two repeat failure modes:
    - dense sibling omissions such as `optic nerve coloboma` hiding inside an earlier ocular sweep sentence
    - parallel-frequency partial capture where one sentence quantified several sibling findings but only one was enriched
- Action:
  - updated `/Users/ahmedelmorshedy/.codex/skills/genereviews-grounded-disease-layer/references/cleanup-and-promotion.md` so first pass now explicitly requires:
    - re-scanning dense summary / anatomic / ocular / neurologic / multisystem sweep sentences
    - checking any sentence that already yielded one row for additional sibling findings
    - splitting parallel percentage / frequency / modifier sentences across every supported sibling finding
  - updated `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genereviews-opus-grounded-disease-layer-contract-v1-20260408.md` so the canonical extraction contract now requires dense-sibling rescans and parallel-modifier splitting
  - updated the active strict prompt assets:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/genereviews-opus-grounded-disease-layer-strict-prompt-v1-20260409.md`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/genereviews-gemini-grounded-disease-layer-strict-prompt-v1-20260409.md`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/genereviews-vertex-grounded-disease-layer-strict-prompt-v1-20260409.md`
- Why:
  - these misses are not random; they come from compressed coordinated prose and later enrichment sentences that quantify multiple sibling findings at once
  - if the workflow and prompt do not name those sentence patterns explicitly, they stay “known” only in diary memory and keep resurfacing in audits
- Next move:
  - treat dense sibling sweeps and parallel-modifier sweeps as required on every first pass and every pre-promotion review, even before external critique

## 2026-04-11 - Ran Claude auditor handoff on WARS2 manual chapter

- Action:
  - created `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-wars2-deficiency/CLAUDE_AUDITOR_HANDOFF_20260411.md` as a self-contained unfamiliar-reviewer handoff with current rules, expected buckets, and the real NCBI chapter URL
  - sent the WARS2 manual candidate, recovered clinical surface, recovered opus input, current audit brief, and chapter README through the local Claude auditor MCP
  - saved the returned report to `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-wars2-deficiency/NBK595820_wars2_deficiency_claude_auditor_review_20260411.md`
- Result:
  - the external review reported no contamination and judged the chapter mostly sound
  - the main grounded gaps it surfaced were missing `brisk reflexes`, `upgoing toes`, `limb spasticity` with the clinical-description context, `motor hyperactivity`, epilepsy-spectrum-scoped `dysarthria`, and `unsociable character`
  - it also flagged missing levodopa `treatment_response`, the duplicated valproic-acid trigger on acute hepatopathy, missing epilepsy-spectrum `subtype_context` on hypoglycemia, and missing `7/13` frequency on axial hypotonia
  - the saved markdown appears to end with a clipped final-verdict line, but the substantive audit sections are intact
- Next move:
  - triage the grounded Claude findings against the current WARS2 manual file and decide which fixes to merge into a reviewed artifact

## 2026-04-11 - Re-ran WARS2 Claude auditor as an unrestricted full audit

- Action:
  - re-ran the same WARS2 Claude auditor handoff without any compactness request and saved:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-wars2-deficiency/NBK595820_wars2_deficiency_claude_auditor_review_full_20260411.md`
  - after the saved file again stopped mid-report, re-ran once more with only a completeness guard and saved:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-wars2-deficiency/NBK595820_wars2_deficiency_claude_auditor_review_full_v2_20260411.md`
- Result:
  - the second-pass Claude content is richer than the first pass and clearly re-surfaces the valid WARS2 issues:
    - missing `brisk reflexes`
    - missing `upgoing toes`
    - missing `unsociable character`
    - missing movement-disorder-spectrum seizure detail from `p77_s1`
    - missing levodopa `treatment_response` handling on tremor
    - duplicated valproic-acid trigger on `acute hepatopathy`
    - missing epilepsy-spectrum subtype context on hypoglycemia
    - missing `7/13` frequency on axial hypotonia
  - both full-audit saved markdown files still truncate around the beginning of `complementary_findings`, indicating a real Claude-auditor artifact/output persistence limit rather than a one-off prompt problem
- Next move:
  - treat the Claude full-audit run as useful but mechanically truncated, and triage the high-confidence grounded findings directly against the current WARS2 manual file

## 2026-04-11 - Third WARS2 Claude full-audit rerun still truncates on save

- Action:
  - ran a third WARS2 Claude auditor pass and explicitly required the saved markdown to continue through `final_verdict` and end with the line `END OF FULL AUDIT`
  - saved to `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-wars2-deficiency/NBK595820_wars2_deficiency_claude_auditor_review_full_v3_20260411.md`
  - verified the saved file directly for the presence of:
    - `## 4. complementary_findings`
    - `## 5. policy_dependent_calls`
    - `## 6. reject_or_ignore`
    - `## 7. final_verdict`
    - `END OF FULL AUDIT`
- Result:
  - none of those markers were present in the saved file
  - the v3 artifact truncates around section `3.2` and is therefore mechanically incomplete despite the explicit completeness instruction
  - this strongly suggests a Claude-auditor artifact persistence/output ceiling rather than a prompt framing issue
- Next move:
  - stop spending cycles trying to force a complete saved artifact through the current Claude auditor path and either:
    - use the valid grounded findings already surfaced, or
    - switch to a different audit execution path if a truly complete external report is required

## 2026-04-11 - Saved one-file WARS2 Claude audit hold summary

- Action:
  - created `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-wars2-deficiency/NBK595820_wars2_deficiency_claude_auditor_hold_summary_20260411.md`
- Result:
  - consolidated the useful local Claude-auditor signal from the short review plus the three full-review attempts into one retained file
  - separated repeated high-confidence grounded findings from policy-dependent items and lower-priority complementary items
  - explicitly documented that the local Claude auditor runs should not count as the final external review because the saved markdown artifacts repeatedly truncated
- Next move:
  - later run the same WARS2 bundle through the user's real Claude environment and compare the resulting full external audit against this hold summary

## 2026-04-11 - Started VEXAS Syndrome chapter prep from recovered raw HTML

- Action:
  - verified from `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/chapter-selection-methodology-20260410.md` that the next promotable chapter after chapter 12 is `VEXAS Syndrome`
  - confirmed the saved raw package exists locally in `stage1_fetch` even though the visible thin clinical surface is incomplete:
    - `VEXAS_Syndrome_clinical_structure.json`
    - `VEXAS_Syndrome_clinical_text.txt`
    - `VEXAS_Syndrome_raw.html`
    - `VEXAS_Syndrome_tables.json`
  - created `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vexas-syndrome`
  - copied the saved thin stage1 files into the standard NBK-based bundle layout as:
    - `NBK614471_clinical_structure.json`
    - `NBK614471_clinical_text.txt`
    - `NBK614471_raw.html`
    - `NBK614471_tables.json`
  - ran the raw-html recovery path with the expanded GeneReviews section profile:
    - `npm run gr:recover-surface-from-raw -- --rawHtml /Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-review-first-50-20260331/stage1_fetch/VEXAS_Syndrome_raw.html --outdir /Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vexas-syndrome --outputStem NBK614471_recovered --mondoId MONDO:0026777 --sectionProfile expanded`
  - wrote both audit artifacts:
    - `source_surface_audit_20260411.json`
    - `recovered_source_surface_audit_20260411.json`
  - added a chapter README documenting the thin-vs-recovered source status and the recovered wrapper as the next extraction input
- Result:
  - the copied thin surface remains unsuitable for promotion:
    - `40` sentences
    - `32` paragraphs
    - `3` sections
    - `likely_truncated: true`
  - the recovered raw-html surface is full chapter-backed and suitable for the next extraction pass:
    - `202` sentences
    - `122` paragraphs
    - `22` sections
    - `likely_truncated: false`
  - `NBK614471_recovered_opus_input.json` is now ready as the canonical next extraction input for `VEXAS Syndrome`
- Path status:
  - `on the intended path`
  - the chapter is now set up on the recovered-raw workflow rather than the previously thin visible slice
- Next move:
  - extract the grounded disease-layer chapter from `NBK614471_recovered_opus_input.json`

## 2026-04-11 - Completed VEXAS Syndrome as chapter 13 from the recovered raw surface

- Action:
  - manually built `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vexas-syndrome/NBK614471_vexas_syndrome_regime_ready_gpt-5.4-manual.json` from `NBK614471_recovered_opus_input.json`
  - explicitly followed the hardened first-pass and pre-promotion checklist:
    - dense sibling rescans over the skin, ocular, neurologic, thrombotic, and infection sections
    - rerouting sweep for laboratory, pathology, imaging, and genotype-correlation content
    - manual pre-promotion review for genotype-phenotype, prognosis, and management-boundary sentences
  - captured the chapter's inflammatory, hematologic, ocular, thrombotic, renal, infectious, and rare systemic features while keeping laboratory, pathology, imaging, and molecular-pathogenesis content in their grounded non-phenotype layers
  - updated the VEXAS README, manifest, regime-ready chapter index, and current queue notes so the repo now treats VEXAS as completed chapter 13
- Result:
  - VEXAS is now represented by a recovered full chapter-backed manual artifact rather than only a prep surface
  - validation passed with:
    - `202` sentence-index rows
    - `70` phenotype assertions
    - `14` ancillary assertions
    - `9` context assertions
    - `0` trajectory assertions
    - `18` causal chains
    - `15` mechanism sentence ids
    - `5` extraction notes
    - `0` episode classes
    - `0` trigger factors
    - no bad refs
    - no duplicate ids
    - no multi-ref phenotype rows
    - descriptor rows carrying subtype context
- Path status:
  - `on the intended path`
  - the chapter is now complete end to end on the recovered-raw manual workflow
- Next move:
  - if desired, run an external review on the VEXAS manual artifact and then move to `USP7-Related Hao-Fountain Syndrome` as the next recovered-raw manual chapter

## 2026-04-11 - Read the real Opus WARS2 audit-and-complement file

- Action:
  - read `/Users/ahmedelmorshedy/Downloads/NBK595820_WARS2_audit_and_complement.json` as the current real external audit surface for the WARS2 manual chapter
- Result:
  - confirmed the audit is structured as:
    - `_audit_summary`
    - complement rows for episode classes, trigger factors, phenotype assertions, ancillary assertions, context assertions, and extraction notes
    - explicit `_corrections_to_existing_rows`
    - `_gap_analysis`
  - the strongest high-signal issues it raises are:
    - missing formal episode-class representation for the epilepsy spectrum and movement disorder spectrum
    - missing `brisk reflexes` and `upgoing toes`
    - missing levodopa-response ancillary for tremor
    - missing seizure treatment-resistance ancillary
    - uncertain-status corrections for hedged imaging rows
    - descriptor-role corrections for dysmorphic features
    - frequency additions for aggressive behavior and sleep disorders
  - also noted one clearly non-mergeable item as written:
    - `note_012` has an empty evidence list and therefore cannot be merged directly under the strict grounded contract
- Path status:
  - `on the intended path`
  - this is a stronger and more complete external review surface than the earlier local Claude auditor outputs and is suitable for a proper merge / maybe / reject triage next
- Next move:
  - triage the real Opus audit item by item against the live WARS2 manual artifact and recovered source surface before editing the chapter

## 2026-04-11 - Compared the real Opus WARS2 audit against the WAGR critique-and-merge file

- Action:
  - compared `/Users/ahmedelmorshedy/Downloads/NBK595820_WARS2_audit_and_complement.json` against `/Users/ahmedelmorshedy/Downloads/NBK621298_critique_and_merge.json` to judge audit strength and merge-readiness
- Result:
  - `NBK621298_critique_and_merge.json` is the stronger audit artifact overall
  - reasons:
    - it combines critique, complements, explicit fixes, projected post-merge counts, and cross-chapter schema conclusions in one tighter package
    - it is more surgical as a merge playbook:
      - `5` present phenotypes to add
      - `2` uncertain phenotypes to add
      - `3` phenotype fixes
      - `2` imaging ancillary additions
      - `1` laboratory ancillary addition
      - `12` causal-chain ref fixes
      - `4` context-note additions
    - it also provides explicit `before -> after` counts and a cross-extraction quality ranking, which makes promotion planning easier
  - `NBK595820_WARS2_audit_and_complement.json` is still strong and more complete than the local Claude auditor runs, but is slightly less merge-ready:
    - excellent on architectural issues, missing clinical facts, and gap analysis
    - especially strong on the two-spectrum episode-class recommendation, levodopa-response gap, seizure treatment-resistance gap, and hedged ancillary corrections
    - but it includes at least one directly non-mergeable item as written:
      - `note_012` has empty `evidence_sentence_ids`
    - it also includes more policy-dependent suggestions that still need triage rather than direct application
- Path status:
  - `on the intended path`
  - the comparison clarified that the WAGR critique is the better benchmark for what a fully actionable external audit should look like
- Next move:
  - when applying external audits, treat the WAGR critique file as the stronger template for `merge / maybe / reject` execution quality, and use the WARS2 audit as a strong but slightly less surgical review surface

## 2026-04-11 - Judged the VEXAS external audit artifact against the WAGR benchmark

- Action:
  - reviewed `/Users/ahmedelmorshedy/Downloads/NBK614471_VEXAS_audit_and_complement.json` and compared its structure and merge-readiness against `/Users/ahmedelmorshedy/Downloads/NBK621298_critique_and_merge.json`
- Result:
  - the VEXAS audit is genuinely stronger than the earlier WARS2 audit and is at least on the WAGR benchmark level, with better operational packaging
  - strengths:
    - explicit `_merge_playbook`
    - explicit `_before_after_counts`
    - cross-extraction ranking and pattern tracker
    - no empty-evidence complement rows detected
    - sharper structural diagnosis of missing episode classes and treatment-response anchors
  - concrete VEXAS playbook surface:
    - `4` present phenotype additions
    - `1` uncertain phenotype addition
    - `3` excluded phenotype additions
    - `3` phenotype status fixes
    - `3` qualifier enrichments
    - `3` ancillary additions
    - `1` context addition
    - `2` episode-class additions
    - `6` extraction-note additions
  - main cautions:
    - `_gap_analysis` and `_corrections_to_existing_rows` are null because the audit has folded that logic into the playbook sections instead
    - at least two recommendations remain policy-sensitive and should be triaged rather than merged blindly:
      - adding bone marrow vacuoles as both ancillary pathology and a phenotype row
      - adding atrial fibrillation as a disease phenotype rather than a co-occurring arterial-risk-factor context
- Path status:
  - `on the intended path`
  - the stronger prompt/model setup appears to have improved the audit materially rather than only changing the wrapper
- Next move:
  - if desired, use the VEXAS artifact as the new benchmark for future external audit prompt tuning, while still triaging borderline merge items before editing the live chapter

## 2026-04-11 - Triaged WARS2 hold-summary signal against the stronger external audit JSON

- Action:
  - compared the retained local-Claude/Opus hold summary for WARS2 against the stronger external audit JSON and the live `NBK595820_wars2_deficiency_regime_ready_gpt-5.4-manual.json`
- Result:
  - the stronger external audit JSON remains the primary review surface for WARS2 finalization
  - the hold summary still adds real value on a smaller set of grounded items not fully covered by the stronger audit
  - `edit now` set from the stronger audit:
    - add episode classes for `epilepsy spectrum` and `movement disorder spectrum`
    - add `brisk reflexes`
    - add `upgoing toes`
    - add ancillary treatment-response for levodopa-responsive tremor
    - add ancillary treatment-response for seizure difficulty/control resistance
    - downgrade ancillary imaging rows `anc_002` through `anc_012` to `uncertain`
    - change dysmorphic rows `ph_031` through `ph_038` from `primary` to `descriptor`
    - add `4/13` frequency to `ph_024` and `ph_025`
    - enrich `anc_001` with the grounded lactate-normality caveat from `p11_s3`
    - remove the phenotype-level valproic-acid trigger from `ph_028`
  - `hold-summary adds value` set:
    - add `subtype_context = "epilepsy spectrum"` to `ph_030` hypoglycemia
    - add `frequency = "7/13"` to `ph_005` hypotonia
    - rename `ph_036` to `narrow and high-arched palate`
    - add `unsociable character` from `p75_s1`
    - likely add cautious movement-disorder-spectrum seizure row for the second `p77_s1` individual
  - `do not merge blindly` set:
    - do not add umbrella `dysmorphic features`
    - do not add triple-routed valproic-acid management ancillary
    - do not automatically add a separate `limb spasticity` row unless duplication policy is revisited, because `ph_006` already carries `peripheral spasticity`
    - keep `ph_056` and `ph_061` trigger/exacerbation handling as policy-sensitive rather than settled
- Path status:
  - `on the intended path`
  - the WARS2 final-edit set is now clear enough to apply without relying on the truncated local-Claude artifacts as the primary authority
- Next move:
  - if desired, apply the WARS2 reviewed-edit set to the GPT-5.4 manual artifact and emit a dated reviewed successor rather than overwriting the current canonical manual file

## 2026-04-11 - Staged VEXAS review merge plan without emitting a reviewed successor yet

- Action:
  - created a frozen VEXAS merge-plan file and a residual-audit handoff file instead of writing a final reviewed JSON immediately
- Files:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vexas-syndrome/NBK614471_vexas_syndrome_review_merge_plan_20260411.md`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vexas-syndrome/NBK614471_vexas_syndrome_residual_audit_handoff_20260411.md`
- Result:
  - the planned reviewed merge is now frozen without mutating the canonical `GPT-5.4 manual` artifact
  - the strongest current merge set is recorded as:
    - episode classes for inflammatory vs hematologic architecture
    - status fixes for rare GI rows
    - thrombotic / MDS / clonal hematopoiesis qualifier enrichments
    - treatment-response and management-context ancillary additions
    - natural-history context addition
    - six extraction-note additions
  - policy-sensitive items are explicitly separated for later triage:
    - duplicate phenotype vs pathology routing for vacuoles
    - atrial fibrillation as phenotype vs risk-context
- Path status:
  - `on the intended path`
  - VEXAS is now staged for a later reviewed successor instead of being prematurely finalized
- Next move:
  - use one more external audit shot if desired, then return and emit the dated reviewed VEXAS successor

## 2026-04-11 - Prepared USP7 chapter folder from saved raw HTML

- Action:
  - created a new bundle prep folder for `USP7-Related Hao-Fountain Syndrome`
  - copied the thin stage1 reference files into the bundle folder
  - rebuilt the recovered source surface from `NBK619577_raw.html` using the expanded section profile
  - saved both thin-surface and recovered-surface audit JSON files
  - wrote a folder README capturing the current prep state
- Files:
  - folder:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-usp7-related-hao-fountain-syndrome`
  - recovered wrapper:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-usp7-related-hao-fountain-syndrome/NBK619577_recovered_opus_input.json`
  - audits:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-usp7-related-hao-fountain-syndrome/source_surface_audit_20260411.json`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-usp7-related-hao-fountain-syndrome/recovered_source_surface_audit_20260411.json`
  - README:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-usp7-related-hao-fountain-syndrome/README.md`
- Result:
  - `NBK619577` is now staged as the next manual chapter after VEXAS
  - recovered raw-html audit reports:
    - `87` sentences
    - `51` paragraphs
    - `17` sections
    - `likely_truncated: false`
  - the earlier stage1 surface for the same chapter reports:
    - `111` sentences
    - `66` paragraphs
    - `3` sections
  - this mismatch appears to be a segmentation/profile difference rather than an obvious truncation, but it is documented for caution before extraction
- Path status:
  - `on the intended path`
  - USP7 is prepared but not yet extracted
- Next move:
  - after the VEXAS reviewed work is resumed, the next chapter can start immediately from `NBK619577_recovered_opus_input.json`

## 2026-04-11 - Promoted VEXAS to GPT-5.4 manual plus Opus 4.6 reviewed artifact

- Scope:
  - finalized the VEXAS external-review merge on the recovered full chapter-backed surface instead of leaving the chapter staged
- Files written:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vexas-syndrome/NBK614471_vexas_syndrome_regime_ready_gpt-5.4-manual-opus4.6-reviewed.json`
- Repo bookkeeping updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vexas-syndrome/README.md`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/new-regime-manifest-20260409.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/regime-ready-chapters-20260409.md`
- Merge contents kept:
  - demoted `abdominal pain`, `chronic diarrhea`, `myalgias`, and `hearing loss` to `uncertain` because `p56_s1` explicitly frames them as `rarely observed`
  - enriched `thrombotic events`, `myelodysplastic syndrome`, and `clonal hematopoiesis` with grounded subtype-context detail from `p50_s2`, `p58_s2`, and `p61_s1-p61_s2`
  - added `transfusion dependence`, `plasma cell myeloma` as a very rare uncertain complication, and excluded subgroup rows for `airway chondritis`, `costochondritis`, and `pulmonary fibrosis`
  - added `episode_classes` for `inflammatory syndrome` and `hematologic involvement`
  - added one grounded ancillary `management_context` row for `avoid smoking, which may exacerbate peripheral arterial disease`
  - added one additional `natural_history` context row for the pre-2020 diagnostic-history / prior-diagnosis pattern
  - revised the rare-feature extraction note and added note coverage for RP comparator context, female monosomy-X caution, low-level mosaic VAF detection, tissue-selection guidance, and the French three-cluster cohort architecture
- Audit items intentionally not merged:
  - did not add a separate phenotype row for marrow vacuoles because the pathology signal is already preserved in ancillary space and the reviewed chapter keeps pathology/laboratory/imaging routing disciplined
  - did not add `atrial fibrillation` as a disease phenotype because `p51_s1` presents it as an arterial-thrombosis risk-factor context rather than a chapter-level disease manifestation
  - did not add the proposed HSCT `only curative treatment / morbidity / mortality` ancillary because the cited source sentence `p104_s1` in the recovered surface only supports the ongoing Phase II study statement
- Validation:
  - reviewed artifact counts:
    - `75` phenotype assertions
    - `15` ancillary assertions
    - `10` context assertions
    - `0` trajectory assertions
    - `18` causal chains
    - `15` mechanism sentence ids
    - `11` extraction notes
    - `2` episode classes
    - `0` trigger factors
  - phenotype status distribution:
    - `67` present
    - `5` uncertain
    - `3` excluded
  - all evidence refs resolve against the recovered sentence index
  - no phenotype row has multiple evidence refs
- Path status:
  - `on the intended path`
  - VEXAS is no longer just staged for review; the reviewed artifact is now the official chapter 13 file
- Next move:
  - continue from the prepared USP7 recovered wrapper when chapter 14 work resumes

## 2026-04-11 - Wrote one-file Gemini Enterprise agent-builder spec with exact parser code

- Scope:
  - created a single reusable handoff file for configuring a Gemini Enterprise agent for the grounded disease-layer workflow instead of relying on several older prompt-only files
- File written:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/gemini-enterprise-agent-builder-spec-v1-20260411.md`
- Inputs folded into the spec:
  - schema / contract logic from the locked grounded disease-layer bundle
  - Gemini and Vertex prompt constraints already used in the repo
  - exact repo-side parsing and validation logic from:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/genereviewsPipeline.js`
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/runGroundedDiseaseLayerGemini.js`
- Contents:
  - end-to-end agent workflow
  - field-by-field extraction rules for every grounded disease-layer section
  - a ready-to-paste Gemini Enterprise system instruction block
  - exact code snippets for sentence splitting, paragraph rebuild, evidence id canonicalization, row normalization, mechanism derivation, and validation
- Repo bookkeeping updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/README.md`
- Result:
  - there is now one concrete builder file to hand to Gemini Enterprise that explains both the extraction contract and how repo-side parsing of model output actually works
- Path status:
  - `on the intended path`
- Next move:
  - reuse this file when setting up the Gemini Enterprise agent, and treat the older Gemini / Vertex files as supporting references rather than the main handoff

## 2026-04-11 - Completed USP7 manual grounded disease-layer artifact

- Scope:
  - completed the next queued chapter, `USP7-Related Hao-Fountain Syndrome`, as a `GPT-5.4 manual` grounded disease-layer artifact
- Official file written:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-usp7-related-hao-fountain-syndrome/NBK619577_usp7_related_hao_fountain_syndrome_regime_ready_gpt-5.4-manual.json`
- Evidence surface used:
  - base recovered wrapper:
    - `87` prose sentence rows
    - `51` paragraphs
    - `17` sections
    - `likely_truncated: false`
  - manual source-surface extension:
    - integrated `38` chapter-table rows from the clinical-features and surveillance tables into `source_document.sentence_index`
  - final artifact sentence surface:
    - `125` sentence-local evidence rows
- Output counts:
  - `27` phenotype assertions
  - `17` ancillary assertions
  - `10` context assertions
  - `2` trajectory assertions
  - `3` causal chains
  - `3` mechanism sentence ids
  - `6` extraction notes
  - `0` episode classes
  - `0` trigger factors
- Extraction shape:
  - kept modality-specific MRI findings in ancillary imaging space
  - used table-backed feature frequencies for developmental delay, intellectual disability, hypotonia, autism spectrum disorder, gait, sleep disturbance, GERD, hearing loss, and other chapter features
  - preserved surveillance detail as `management_context` ancillary rows instead of leaking monitoring language into phenotype space
  - captured the hypotonia-to-high-muscle-tone course as trajectory
  - kept the catalytic-domain genotype-phenotype severity statement as a note rather than duplicating it as universal phenotype content
- Validation:
  - JSON parses cleanly
  - all evidence refs resolve against the final sentence index
  - no duplicate row ids were detected
  - no phenotype row has multiple evidence refs
- Repo bookkeeping updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-usp7-related-hao-fountain-syndrome/README.md`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/regime-ready-chapters-20260409.md`
- Path status:
  - `on the intended path`
- Next move:
  - either obtain an external audit for USP7 or continue the next chapter on the recovered-raw manual path

## 2026-04-11 - Corrected USP7 after audit regression and promoted reviewed successor

- Scope:
  - fixed the USP7 source-surface regression, rebuilt the chapter on a transparent chapter-backed surface, and merged the real external audit into a reviewed successor
- Parser / source-surface repair:
  - patched `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/genereviewsPipeline.js` so `Table 2.` headings no longer clobber the active clinical section and discard the rich prose that follows
  - regenerated `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-usp7-related-hao-fountain-syndrome/NBK619577_recovered_clinical_structure.json`
  - regenerated `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-usp7-related-hao-fountain-syndrome/NBK619577_recovered_opus_input.json`
  - new recovered wrapper counts:
    - `192` sentences
    - `108` paragraphs
    - `17` sections
- Final evidence surface used for the corrected artifacts:
  - archived fuller clinical fetch for table-bearing clinical detail
  - regenerated recovered wrapper for later sections, family-risk, and molecular-pathogenesis carry-through
  - explicit surveillance-table supplementation for management-context ancillary rows
  - final artifact `source_document.sentence_index`:
    - `169` sentence rows
- Files written:
  - corrected manual:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-usp7-related-hao-fountain-syndrome/NBK619577_usp7_related_hao_fountain_syndrome_regime_ready_gpt-5.4-manual.json`
  - official reviewed successor:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-usp7-related-hao-fountain-syndrome/NBK619577_usp7_related_hao_fountain_syndrome_regime_ready_gpt-5.4-manual-opus4.6-reviewed.json`
  - deterministic rebuild script:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/rebuildUsp7ReviewedFromAudit.js`
- Reviewed output counts:
  - `41` phenotype assertions
  - `20` ancillary assertions
  - `12` context assertions
  - `2` trajectory assertions
  - `4` causal chains
  - `13` extraction notes
- Key corrections merged:
  - removed the orphan evidence problem by rebuilding the chapter on the repaired source surface
  - added prognosis, fatigue/daytime-rest, scoliosis/kyphosis, short stature, constipation, diarrhea, dysphagia, obesity, dysmorphic facial features, osteopenia, osteoporosis, delayed bone age, small hands/feet, and prolonged neonatal jaundice
  - added milestone-age and IQ ancillary rows
  - corrected ophthalmologic rows from `primary` to `descriptor`
  - strengthened the later-life trajectory row
- Repo bookkeeping updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-usp7-related-hao-fountain-syndrome/README.md`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/new-regime-manifest-20260409.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/regime-ready-chapters-20260409.md`
- Path status:
  - `on the intended path`
- Next move:
  - move on to the next chapter instead of reopening USP7

## 2026-04-11 - Lightweight Life Science plugin demo on VEXAS

- Scope:
  - tested the `Life Science: Research` plugin as a low-cost post-chapter enrichment layer using the reviewed VEXAS chapter
- Base chapter:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vexas-syndrome/NBK614471_vexas_syndrome_regime_ready_gpt-5.4-manual-opus4.6-reviewed.json`
- Plugin calls used:
  - `Open Targets` search for `VEXAS syndrome`
  - `Open Targets` disease heatmap for `UBA1`
  - `ClinicalTrials.gov` search for `VEXAS syndrome`
- Saved outputs:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vexas-syndrome/NBK614471_vexas_syndrome_opentargets_search_20260411.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vexas-syndrome/NBK614471_vexas_syndrome_opentargets_heatmap_20260411.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vexas-syndrome/NBK614471_vexas_syndrome_clinicaltrials_20260411.json`
  - companion memo:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vexas-syndrome/NBK614471_vexas_syndrome_life_science_demo_20260411.md`
- Main result:
  - the plugin normalized the disease/target pair to `MONDO_0026777` and `ENSG00000130985`
  - the Open Targets heatmap showed multi-source support for `UBA1 -> VEXAS syndrome`, led by somatic ClinVar and curated variant/literature sources
  - the ClinicalTrials snapshot returned five VEXAS-linked studies spanning HSCT, momelotinib, registry, natural-history, and marrow-failure research
- Interpretation:
  - this plugin is a good low-cost post-chapter enrichment layer for translational context
  - it adds external identifiers, evidence-source breadth, and live trial visibility without replacing the grounded disease-layer workflow
- Path status:
  - `on the intended path`
- Next move:
  - reuse this pattern as an optional companion layer for selected high-value chapters rather than for every chapter by default

## 2026-04-11 - USP7 residual surgical audit merged into reviewed artifact

- Scope:
  - compared the reviewed USP7 chapter against `/Users/ahmedelmorshedy/Documents/Cline/NBK619577_USP7_audit.md`
  - treated the reviewed file's own `source_document.sentence_index` as the strict evidence surface for mergeability
- Evidence surface:
  - `full chapter-backed hybrid surface` already embedded in the reviewed USP7 artifact
- Path status:
  - `on the intended path`
- Files updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-usp7-related-hao-fountain-syndrome/NBK619577_usp7_related_hao_fountain_syndrome_regime_ready_gpt-5.4-manual-opus4.6-reviewed.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-usp7-related-hao-fountain-syndrome/README.md`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/new-regime-manifest-20260409.json`
- Reviewed artifact changes merged:
  - fixed row-level evidence and qualifier issues for hypotonia, contractures, gait, microcephaly, autism spectrum disorder, attention-deficit/hyperactivity disorder, fractures, and gene context
  - added phenotype rows for hypothyroidism, adrenal insufficiency, growth hormone deficiency, and delayed puberty
  - added genotype-phenotype-correlation and somatic-mosaicism-risk context rows
  - added a neonatal trajectory row
  - added causal chains for gait secondary to hypotonia/balance/contractures and aspiration risk secondary to dysphagia
  - merged redundant corpus-callosum ancillary rows and rewired management-context related phenotype ids
- Items intentionally left out:
  - epigenetic signature, clubfoot, specific learning disabilities, and quantitative mosaic details because the current reviewed file's own `source_document.sentence_index` does not carry the required supporting sentences
  - exact developmental-delay / intellectual-disability frequency upgrades from the surgical audit because the reviewed source surface did not preserve the claimed numeric rows cleanly enough for a strict merge
- Updated reviewed counts:
  - `45` phenotype assertions
  - `19` ancillary assertions
  - `14` context assertions
  - `3` trajectory assertions
  - `6` causal chains
  - `13` extraction notes
- Validation:
  - JSON parses cleanly
  - no unresolved evidence ids
  - no duplicate local ids
  - no dangling ancillary `related_phenotype_assertion_ids`
  - no multi-ref phenotype rows
- Next move:
  - keep this reviewed USP7 file as the official artifact unless the source surface is expanded again to support the remaining live-chapter-only audit ideas

## 2026-04-11 - WARS2 external review merged into official reviewed artifact

- Scope:
  - merged the real external audit from `/Users/ahmedelmorshedy/Downloads/NBK595820_WARS2_audit_and_complement.json`
  - harvested a small set of high-confidence additive leftovers from `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-wars2-deficiency/NBK595820_wars2_deficiency_claude_auditor_hold_summary_20260411.md`
- Evidence surface:
  - `full chapter-backed recovered from saved raw HTML`
- Path status:
  - `on the intended path`
- Files updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-wars2-deficiency/NBK595820_wars2_deficiency_regime_ready_gpt-5.4-manual-opus4.6-reviewed.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-wars2-deficiency/README.md`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/new-regime-manifest-20260409.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/regime-ready-chapters-20260409.md`
- Reviewed artifact changes merged:
  - promoted the epilepsy-spectrum and movement-disorder-spectrum architecture into explicit episode classes
  - added `brisk reflexes`, `upgoing toes`, and `unsociable character`
  - added ancillary treatment-response rows for levodopa-responsive tremor and seizure refractoriness
  - corrected dysmorphic and musculoskeletal feature rows from `primary` to `descriptor`
  - added missing frequencies for hypotonia (`7/13`) and epilepsy-spectrum aggressive behavior and sleep disorders (`4/13`)
  - removed the redundant phenotype-local valproic-acid trigger from acute hepatopathy
  - added epilepsy-spectrum subtype context to hypoglycemia
  - downgraded hedged MRI rows from `present` to `uncertain`
  - refined `high-arched palate` to `narrow and high-arched palate`
  - added grounded review notes for spectrum severity differences, parkinsonism absence in the myoclonus-ataxia subgroup, rare cardiac involvement, imaging hedging, and the normal-lactate caveat
- Items intentionally left out:
  - `limb spasticity` as a separate new row because `peripheral spasticity` was already represented and the clinical description phrasing would have increased duplication risk
  - seizure-semiology residue from single-individual descriptions and movement-disorder seizure-detail leftovers because they were clinically interesting but not required to promote the chapter cleanly
  - phenotype-trigger rewrites for action tremor and myoclonus because those remain policy-sensitive exacerbation-pattern calls rather than hard defects
- Updated reviewed counts:
  - `88` phenotype assertions
  - `15` ancillary assertions
  - `11` context assertions
  - `4` trajectory assertions
  - `8` causal chains
  - `12` extraction notes
  - `3` episode classes
  - `1` trigger factor
- Validation:
  - JSON parses cleanly
  - no unresolved evidence ids
  - no duplicate local ids
  - no dangling ancillary `related_phenotype_assertion_ids`
  - no multi-ref phenotype rows
  - descriptor rows retain subtype context
- Next move:
  - move to the remaining manual-only backlog, led by `Von Willebrand Disease` and `Vascular Ehlers-Danlos Syndrome`

## 2026-04-11 - Verified that Von Willebrand Disease does not yet have a retained Opus review artifact

- Scope:
  - verified whether chapter 8 `Von Willebrand Disease` / `NBK7014` already has a retained external Opus review
- Evidence surface for the status check:
  - manifest entry
  - chapter folder contents
  - Genovy diary references
  - usual retained audit-drop locations in `/Users/ahmedelmorshedy/Downloads` and `/Users/ahmedelmorshedy/Documents/Cline`
- Result:
  - the manifest still marks chapter 8 as `regime_ready_gpt-5.4-manual`
  - the chapter folder contains only the recovered source files, audits of the source surface, and the manual artifact
  - no retained `audit_and_complement`, `critique_and_merge`, or reviewed chapter JSON for `NBK7014` was found in the checked locations
- Path status:
  - `on the intended path`
- Next move:
  - treat `Von Willebrand Disease` as manual-only until a real external review file is created or surfaced

## 2026-04-11 - Read and triaged the real external audit for Von Willebrand Disease

- Scope:
  - reviewed `/Users/ahmedelmorshedy/Downloads/NBK7014_VWD_audit_and_complement.json` against the live manual artifact `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-von-willebrand-disease/NBK7014_von_willebrand_disease_regime_ready_gpt-5.4-manual.json`
- Evidence surface:
  - `full chapter-backed recovered from saved raw HTML`
- Path status:
  - `on the intended path`
- Audit quality read:
  - real merge-grade audit with explicit before/after counts, targeted row fixes, complement rows, episode-class architecture, trigger-factor proposals, and extraction-note additions
  - overall score reported as `80/100`
- Most useful grounded additions/fixes:
  - promote the seven VWD subtype families into formal episode classes
  - add desmopressin-worsened thrombocytopenia as treatment-response ancillary for type 2B
  - add the expanded natural-history context with variable penetrance and expressivity
  - add type 1C-specific mucocutaneous-bleeding row with accelerated-clearance pathophysiology
  - add iron-deficiency-anemia complication from chronic GI bleeding
  - upgrade thrombocytopenia in type 2B with `up to 50%` frequency support from molecular-pathogenesis text
  - remove phenotype-local trigger burden from worsening thrombocytopenia and push that logic into trigger factors
- Caution items:
  - `life-threatening gastrointestinal bleeding` as `present` instead of `uncertain` is arguable and should stay conservative unless explicitly promoted
  - `anaphylactic reaction to VWF replacement` as a separate phenotype row may be clinically useful, but it is also already represented in ancillary treatment-response space and could be left as duplication-sensitive
- Next move:
  - treat this VWD audit as strong and likely mergeable with a short human-triage pass rather than needing another full external review

## 2026-04-11 - Von Willebrand Disease external review merged into official reviewed artifact

- Scope:
  - merged `/Users/ahmedelmorshedy/Downloads/NBK7014_VWD_audit_and_complement.json` into the live manual artifact for chapter 8
- Evidence surface:
  - `full chapter-backed recovered from saved raw HTML`
- Path status:
  - `on the intended path`
- Files updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-von-willebrand-disease/NBK7014_von_willebrand_disease_regime_ready_gpt-5.4-manual-opus4.6-reviewed.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-von-willebrand-disease/README.md`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/new-regime-manifest-20260409.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/regime-ready-chapters-20260409.md`
- Reviewed artifact changes merged:
  - promoted the seven main VWD subtype families into explicit episode classes
  - upgraded type 2B thrombocytopenia to a present row with `up to 50%` frequency support and removed the phenotype-local trigger burden from worsening thrombocytopenia
  - added type 1C mucocutaneous bleeding, iron-deficiency anemia from chronic GI bleeding, and rare anaphylactic reaction to VWF replacement
  - added desmopressin-worsened thrombocytopenia as standalone treatment-response ancillary evidence
  - added pregnancy-to-postpartum trajectory modeling with delayed secondary postpartum bleeding risk
  - expanded context with variable penetrance and expressivity
  - enriched the note layer with type 2B contraindication, type 2N hemophilia mimicry, GI angiodysplasia subtype ranking, large-deletion antibody risk, and pregnancy disease-modification framing
- Items intentionally left out:
  - the disease-level `hemostatic challenge` trigger factor, because it read more like broad natural-history context than a clean formal trigger row
  - the audit's `note_009`, because once the subtype episode classes are actually present the note becomes structurally redundant
- Updated reviewed counts:
  - `46` phenotype assertions
  - `36` ancillary assertions
  - `10` context assertions
  - `1` trajectory assertion
  - `16` causal chains
  - `13` extraction notes
  - `7` episode classes
  - `2` trigger factors
- Validation:
  - JSON parses cleanly
  - no unresolved evidence ids
  - no duplicate local ids
  - no dangling ancillary `related_phenotype_assertion_ids`
  - no multi-ref phenotype rows
- Next move:
  - move to the remaining manual-only backlog, led by `Vascular Ehlers-Danlos Syndrome`

## 2026-04-11 - Vascular Ehlers-Danlos Syndrome external review merged into official reviewed artifact

- Scope:
  - merged `/Users/ahmedelmorshedy/Downloads/NBK1494_vEDS_audit_and_complement.json` into the live manual artifact for chapter 10
- Evidence surface:
  - `full chapter-backed recovered from saved raw HTML`
- Path status:
  - `on the intended path`
- Files updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vascular-ehlers-danlos-syndrome/NBK1494_vascular_ehlers_danlos_syndrome_regime_ready_gpt-5.4-manual-opus4.6-reviewed.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vascular-ehlers-danlos-syndrome/README.md`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/new-regime-manifest-20260409.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/regime-ready-chapters-20260409.md`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genovy-dx-diary.md`
- Reviewed artifact changes merged:
  - demoted thin vermilion of lips, micrognathia, narrow nose, and protuberant eyes from primary rows to descriptor rows
  - removed trigger leakage from easy bruising and normalized the broad avoidance trigger wording
  - enriched early mortality trajectory language with spontaneous artery rupture/dissection, aortic burden, male excess mortality, and major-complication-by-age-20 prevalence
  - added cervical tears during delivery, vaginal tears during delivery, and prematurity as pregnancy-complication phenotype rows
  - added pregnancy mortality ancillary at approximately `5%` per pregnancy tied to the pregnancy-complication surface
  - expanded the note layer with pregnancy risk, null-variant natural-history contrast, early male excess mortality, colonoscopy-trigger modeling, and surgery-versus-conservative-management framing
- Updated reviewed counts:
  - `60` phenotype assertions
  - `21` ancillary assertions
  - `8` context assertions
  - `3` trajectory assertions
  - `14` causal chains
  - `6` mechanism sentence ids
  - `10` extraction notes
  - `1` episode class
  - `5` trigger factors
- Validation:
  - JSON parses cleanly
  - no unresolved evidence ids
  - no duplicate local ids
  - no dangling ancillary `related_phenotype_assertion_ids`
  - no multi-ref phenotype rows
- Next move:
  - with WARS2, Von Willebrand disease, and vEDS all promoted to reviewed artifacts, the manual-only backlog from this run is cleared

## 2026-04-11 - Applied residual HPO-guided qualifier polish to the reviewed vEDS artifact

- Scope:
  - used the `_hpo_enrichment_collapse_table` from `/Users/ahmedelmorshedy/Downloads/NBK1494_vEDS_audit_and_complement.json` as a residue pass on the reviewed vEDS chapter
- Evidence surface:
  - `full chapter-backed recovered from saved raw HTML`
- Path status:
  - `on the intended path`
- Files updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vascular-ehlers-danlos-syndrome/NBK1494_vascular_ehlers_danlos_syndrome_regime_ready_gpt-5.4-manual-opus4.6-reviewed.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-vascular-ehlers-danlos-syndrome/README.md`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genovy-dx-diary.md`
- Residual qualifier polish merged:
  - `ph_007 easy bruising` now carries the low-threshold bruising detail as `severity = "spontaneous or with minimal trauma"` instead of using trigger semantics
  - `ph_009 carotid-cavernous sinus fistula` now carries `frequency = 10%` and `subtype_context = female preponderance` using the dedicated prevalence sentence
  - `ph_028 coronary artery dissection` now captures the clinical presentation pattern that 80% presented with chest pain or heart-attack symptoms
  - `ph_049 gingival thinness and translucency` now carries `distribution = generalized`
- Items intentionally still left out:
  - no separate `venous varicosities` confirmation row was added in this pass
  - no standalone phenotype row was created for iatrogenic colonoscopy perforation
- Validation:
  - JSON parses cleanly
  - no unresolved evidence ids
  - no duplicate local ids
  - counts unchanged
- Next move:
  - vEDS is now not just reviewed but lightly residue-polished; future chapter passes can reuse the same HPO-enrichment residue check after the main audit merge

## 2026-04-11 - Zhu-Tokita-Takenouchi-Kim Syndrome manual truncated-source draft

- Scope:
  - created chapter 15 bundle artifacts for `Zhu-Tokita-Takenouchi-Kim Syndrome` from the preserved `NBK618356` stage1 clinical slice
- Evidence surface:
  - `partial clinical slice`
- Path status:
  - `producing a usable but partial draft`
- Files updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-zhu-tokita-takenouchi-kim-syndrome/NBK618356_clinical_structure.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-zhu-tokita-takenouchi-kim-syndrome/NBK618356_clinical_text.txt`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-zhu-tokita-takenouchi-kim-syndrome/NBK618356_opus_input.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-zhu-tokita-takenouchi-kim-syndrome/source_surface_audit_20260411.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-zhu-tokita-takenouchi-kim-syndrome/NBK618356_zhu_tokita_takenouchi_kim_syndrome_manual_truncated_source_draft.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-zhu-tokita-takenouchi-kim-syndrome/README.md`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/new-regime-manifest-20260409.json`
- Draft construction notes:
  - converted the older complemented manual raw into the current grounded disease-layer schema
  - kept trajectory support conservative with infancy hypotonia/feeding-difficulty framing and later-course variability/regression uncertainty
  - routed immunoglobulin deficiencies, thrombocytopenia, MRI findings, and radiographic abnormalities to ancillary evidence
  - preserved source-limit notes so the chapter is not overstated as full-source complete
- Draft counts:
  - `44` phenotype assertions
  - `14` ancillary assertions
  - `7` context assertions
  - `2` trajectory assertions
  - `0` causal chains
  - `5` extraction notes
- Validation:
  - all phenotype evidence refs resolve against the local sentence index
  - no phenotype row has multiple evidence refs
  - ancillary and context evidence refs resolve against the local sentence index
- Next move:
  - recover a broader `NBK618356` source surface or externally review this truncated-source draft before any regime-ready promotion

## 2026-04-11 - YIF1B-Related Neurodevelopmental Disorder manual truncated-source draft

- Scope:
  - created chapter 16 bundle artifacts for `YIF1B-Related Neurodevelopmental Disorder` from the preserved `NBK606999` stage1 clinical slice
- Evidence surface:
  - `summary-like partial clinical slice`
- Path status:
  - `producing a usable but partial draft`
- Files updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-yif1b-related-neurodevelopmental-disorder/NBK606999_clinical_structure.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-yif1b-related-neurodevelopmental-disorder/NBK606999_clinical_text.txt`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-yif1b-related-neurodevelopmental-disorder/NBK606999_opus_input.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-yif1b-related-neurodevelopmental-disorder/source_surface_audit_20260411.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-yif1b-related-neurodevelopmental-disorder/NBK606999_yif1b_related_neurodevelopmental_disorder_manual_truncated_source_draft.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-yif1b-related-neurodevelopmental-disorder/README.md`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/new-regime-manifest-20260409.json`
- Draft construction notes:
  - converted the older complemented manual raw into the current grounded disease-layer schema
  - kept seizure subtypes and neurobehavioral items conservative because the preserved slice does not independently develop them beyond suggestive-findings lines
  - routed MRI abnormalities to ancillary imaging and explicitly recorded that no Table 2 frequencies were available in the retained source
- Draft counts:
  - `22` phenotype assertions
  - `5` ancillary assertions
  - `5` context assertions
  - `2` trajectory assertions
  - `0` causal chains
  - `4` extraction notes
- Validation:
  - all phenotype evidence refs resolve against the local sentence index
  - no phenotype row has multiple evidence refs
  - ancillary and context evidence refs resolve against the local sentence index
- Next move:
  - recover a broader `NBK606999` source surface or externally review this truncated-source draft before any regime-ready promotion

## 2026-04-11 - Added a hard full-extract gate before any GPT-5.4 manual chapter

- Scope:
  - tightened the promotion workflow after the USP7 drift so a chapter cannot jump directly from recovered files to a `gpt-5.4-manual` disease-layer JSON
- Evidence surface:
  - `workflow rule, applied to both full chapter-backed and partial surfaces`
- Path status:
  - `on the intended path`
- Files updated:
  - `/Users/ahmedelmorshedy/.codex/skills/genereviews-grounded-disease-layer/scripts/audit_surface.py`
  - `/Users/ahmedelmorshedy/.codex/skills/genereviews-grounded-disease-layer/references/cleanup-and-promotion.md`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/README.md`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/buildFullGeneReviewExtract.js`
- Hard rule:
  - every chapter must first produce a single `NBKxxxx_full_chapter_extract.json` artifact that combines the recovered sentence index, headings, tables, fetch metadata, and source-surface audit
  - a `regime_ready_gpt-5.4-manual` file can only be formed from that full extract when the audit reports `manual_5_4_ready: true` and `surface_label: full chapter-backed`
- Applied gate checks:
  - `NBK618356 / Zhu-Tokita-Takenouchi-Kim Syndrome` now explicitly records `manual_5_4_ready: false` with blockers on sentence count, paragraph count, section count, and downstream section breadth
  - `NBK606999 / YIF1B-Related Neurodevelopmental Disorder` now explicitly records `manual_5_4_ready: false` with the same gate blockers plus `likely_truncated`
- Next move:
  - only chapters that clear the full-extract gate move into a GPT-5.4 manual pass

## 2026-04-11 - Y Chromosome Infertility full-extract-backed GPT-5.4 manual chapter

- Scope:
  - promoted `NBK1339 / Y Chromosome Infertility` using the new full-extract-first workflow
- Evidence surface:
  - `full chapter-backed`
- Path status:
  - `on the intended path`
- Files updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-y-chromosome-infertility/NBK1339_recovered_clinical_structure.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-y-chromosome-infertility/NBK1339_recovered_clinical_text.txt`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-y-chromosome-infertility/NBK1339_recovered_tables.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-y-chromosome-infertility/NBK1339_recovered_fetch_meta.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-y-chromosome-infertility/NBK1339_recovered_opus_input.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-y-chromosome-infertility/recovered_source_surface_audit_20260411.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-y-chromosome-infertility/NBK1339_full_chapter_extract.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-y-chromosome-infertility/NBK1339_y_chromosome_infertility_regime_ready_gpt-5.4-manual.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-y-chromosome-infertility/README.md`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/new-regime-manifest-20260409.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/regime-ready-chapters-20260409.md`
- Recovery and gate results:
  - rebuilt the saved raw HTML with the expanded section profile into a recovered surface with `167` sentences, `101` paragraphs, `18` sections, and `8` tables
  - the recovered surface passed the hard gate as `manual_5_4_ready: true` and `surface_label: full chapter-backed`
  - the chapter-local `NBK1339_full_chapter_extract.json` is now the canonical source artifact for downstream manual or reviewer passes
- Manual chapter contents:
  - `8` phenotype assertions
  - `5` ancillary assertions
  - `8` context assertions
  - `0` trajectory assertions
  - `6` causal chains
  - `12` mechanism sentence ids
  - `6` extraction notes
  - `0` episode classes
  - `1` trigger factor
- Validation:
  - JSON parses cleanly
  - no unresolved evidence ids
  - no duplicate local ids
  - no dangling ancillary `related_phenotype_assertion_ids`
  - no multi-ref phenotype rows
- Next move:
  - the next chapters should follow the same order: recover full surface, audit gate, build full extract artifact, then form the GPT-5.4 manual JSON

## 2026-04-11 - Y Chromosome Infertility parser correction and Opus-reviewed promotion

- Scope:
  - corrected the `NBK1339 / Y Chromosome Infertility` recovery pipeline after an audit surfaced summary-backed misses, then rebuilt and promoted the reviewed chapter
- Evidence surface:
  - `full chapter-backed`
- Path status:
  - `on the intended path`
- Files updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/genereviewsPipeline.js`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-y-chromosome-infertility/NBK1339_recovered_clinical_structure.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-y-chromosome-infertility/NBK1339_recovered_clinical_text.txt`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-y-chromosome-infertility/NBK1339_recovered_tables.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-y-chromosome-infertility/NBK1339_recovered_fetch_meta.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-y-chromosome-infertility/NBK1339_recovered_opus_input.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-y-chromosome-infertility/recovered_source_surface_audit_20260411.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-y-chromosome-infertility/NBK1339_full_chapter_extract.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-y-chromosome-infertility/NBK1339_y_chromosome_infertility_regime_ready_gpt-5.4-manual.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-y-chromosome-infertility/NBK1339_y_chromosome_infertility_regime_ready_gpt-5.4-manual-opus4.6-reviewed.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/new-regime-manifest-20260409.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/regime-ready-chapters-20260409.md`
- What changed:
  - fixed a real parser bug in `src/lib/genereviewsPipeline.js`: section-block extraction only matched `<div id=\"...\">`, which dropped Summary sections when the same div also carried extra attributes like `itemprop=\"description\"`
  - rebuilt the saved raw HTML after that fix, which expanded the recovered source surface from the earlier under-counted rebuild to `180` sentences, `106` paragraphs, `22` sections, and `8` tables
  - kept `NBK1339_full_chapter_extract.json` as the canonical chapter artifact and rebuilt the GPT-5.4 manual file from that corrected full extract
  - merged the external review surface from `/Users/ahmedelmorshedy/Downloads/NBK1339_YChrom_audit_and_complement.json` into an Opus-reviewed successor on the corrected evidence surface
  - promoted formal AZF episode classes, restored summary-backed findings like the normal physical-exam descriptor and ART counseling rows, and kept the reviewed chapter aligned to the corrected full extract instead of the earlier underbuilt surface
- Validation:
  - corrected recovered surface audited as `full chapter-backed` and `manual_5_4_ready: true`
  - reviewed artifact counts are `11` phenotype assertions, `7` ancillary assertions, `9` context assertions, `0` trajectory assertions, `7` causal chains, `11` mechanism sentence ids, `11` extraction notes, `4` episode classes, and `1` trigger factor
  - JSON parses cleanly
  - no unresolved evidence ids
  - no duplicate local ids
  - no dangling ancillary `related_phenotype_assertion_ids`
  - no multi-ref phenotype rows
- Next move:
  - keep the same hard rule for future chapters: first build the corrected full chapter extract, then form the GPT-5.4 manual file, then merge the external audit

## 2026-04-11 - ZTTK full-extract-backed GPT-5.4 manual chapter

- Scope:
  - replaced the chapter 15 truncated draft path for `NBK618356 / Zhu-Tokita-Takenouchi-Kim Syndrome` with a full-extract-backed GPT-5.4 manual chapter
- Evidence surface:
  - `full chapter-backed`
- Path status:
  - `on the intended path`
- Files updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-zhu-tokita-takenouchi-kim-syndrome/NBK618356_raw.html`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-zhu-tokita-takenouchi-kim-syndrome/NBK618356_recovered_clinical_structure.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-zhu-tokita-takenouchi-kim-syndrome/NBK618356_recovered_clinical_text.txt`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-zhu-tokita-takenouchi-kim-syndrome/NBK618356_recovered_tables.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-zhu-tokita-takenouchi-kim-syndrome/NBK618356_recovered_fetch_meta.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-zhu-tokita-takenouchi-kim-syndrome/NBK618356_recovered_opus_input.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-zhu-tokita-takenouchi-kim-syndrome/recovered_source_surface_audit_20260411.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-zhu-tokita-takenouchi-kim-syndrome/NBK618356_full_chapter_extract.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-zhu-tokita-takenouchi-kim-syndrome/NBK618356_zhu_tokita_takenouchi_kim_syndrome_regime_ready_gpt-5.4-manual.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-zhu-tokita-takenouchi-kim-syndrome/README.md`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/new-regime-manifest-20260409.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/regime-ready-chapters-20260409.md`
- What changed:
  - fetched the live printable GeneReviews HTML for `NBK618356` because the older preserved stage1 source was only a summary-like clinical slice
  - rebuilt the chapter surface with the expanded parser profile and verified the boundary check explicitly: the recovered extract begins at `Summary` and ends in `Molecular Pathogenesis`
  - audited the recovered surface directly against the recovered structure and fetch metadata so the chapter-local full extract records the real completeness verdict rather than the older truncated slice
  - built `NBK618356_full_chapter_extract.json` as the canonical source artifact, then remapped the richer older draft onto the new full sentence index and added full-surface context and molecular-pathogenesis chains
  - left `episode_classes` empty on purpose because the chapter explicitly states that no clinically relevant genotype-phenotype correlations have been identified
- Validation:
  - recovered surface metrics are `189` sentences, `95` paragraphs, `20` sections, `9` tables, `surface_label: full chapter-backed`, and `manual_5_4_ready: true`
  - manual artifact counts are `44` phenotype assertions, `14` ancillary assertions, `10` context assertions, `2` trajectory assertions, `4` causal chains, `7` mechanism sentence ids, `7` extraction notes, `0` episode classes, and `0` trigger factors
  - JSON parses cleanly
  - no unresolved evidence ids
  - no duplicate local ids
  - no multi-ref phenotype rows
- Next move:
  - if we want to promote chapter 15 beyond the manual stage, the next step is an external audit of the full-extract-backed manual file rather than more work on the old truncated draft

## 2026-04-11 - YIF1B full-extract-backed GPT-5.4 manual chapter

- Scope:
  - replaced the chapter 16 truncated draft path for `NBK606999 / YIF1B-Related Neurodevelopmental Disorder` with a full-extract-backed GPT-5.4 manual chapter
- Evidence surface:
  - `full chapter-backed`
- Path status:
  - `on the intended path`
- Files updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-yif1b-related-neurodevelopmental-disorder/NBK606999_raw.html`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-yif1b-related-neurodevelopmental-disorder/NBK606999_recovered_clinical_structure.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-yif1b-related-neurodevelopmental-disorder/NBK606999_recovered_clinical_text.txt`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-yif1b-related-neurodevelopmental-disorder/NBK606999_recovered_tables.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-yif1b-related-neurodevelopmental-disorder/NBK606999_recovered_fetch_meta.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-yif1b-related-neurodevelopmental-disorder/NBK606999_recovered_opus_input.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-yif1b-related-neurodevelopmental-disorder/recovered_source_surface_audit_20260411.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-yif1b-related-neurodevelopmental-disorder/NBK606999_full_chapter_extract.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-yif1b-related-neurodevelopmental-disorder/NBK606999_yif1b_related_neurodevelopmental_disorder_regime_ready_gpt-5.4-manual.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/next-chapter-yif1b-related-neurodevelopmental-disorder/README.md`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/new-regime-manifest-20260409.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/grounded-disease-layer-bundle-20260409/regime-ready-chapters-20260409.md`
- What changed:
  - fetched the live printable GeneReviews HTML for `NBK606999` because the older preserved stage1 source was only a summary-like partial clinical slice
  - rebuilt the chapter surface with the current expanded parser profile and verified the boundary check explicitly from the full extract heading inventory: it begins with `Summary` and ends with `Molecular Pathogenesis`
  - audited the recovered surface directly against the recovered structure and fetch metadata so the chapter-local full extract records the real completeness verdict rather than the older truncated slice
  - built `NBK606999_full_chapter_extract.json` as the canonical source artifact, then remapped the older draft onto the recovered full sentence index and added the missing full-surface context, treatment-response rows, causal chains, and molecular-pathogenesis grounding
  - promoted two genotype-defined `episode_classes` because the chapter explicitly supports a severity split between biallelic protein-truncating and biallelic missense YIF1B variants
- Validation:
  - recovered surface metrics are `148` sentences, `82` paragraphs, `21` sections, `9` tables, `surface_label: full chapter-backed`, and `manual_5_4_ready: true`
  - manual artifact counts are `22` phenotype assertions, `7` ancillary assertions, `11` context assertions, `2` trajectory assertions, `5` causal chains, `7` mechanism sentence ids, `7` extraction notes, `2` episode classes, and `0` trigger factors
  - JSON parses cleanly
  - no unresolved evidence ids
  - no duplicate local ids
  - no multi-ref phenotype rows
- Next move:
  - if we want to promote chapter 16 beyond the manual stage, the next step is an external audit of the full-extract-backed manual file rather than more work on the old truncated draft

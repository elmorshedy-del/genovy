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

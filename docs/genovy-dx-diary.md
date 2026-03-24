# Genovy DX Research Diary

Last updated: 2026-03-22

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

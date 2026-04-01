# Genovy DX Project Log

Last updated: 2026-03-26

## Purpose
This file is the running memory for Genovy DX. It records concrete changes, benchmark results, hypotheses, failed ideas, and next-step logic so progress is not lost between sessions.

Canonical detailed diary:
- [genovy-dx-diary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genovy-dx-diary.md)

## Benchmark Snapshots
Official 100-case phenotype-only gene benchmark vs Exomiser.

| Snapshot | Found | Top-1 | Top-3 | Top-5 | Top-10 | Median Rank | MRR |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Prefix-cleanup era baseline | 81% | 32% | 41% | 45% | 55% | 3 | 0.390464 |
| Full enrichment + identity fixes | 81% | 34% | 41% | 46% | 52% | 3 | 0.404633 |
| Direct-edge fix | 80% | 33% | 41% | 45% | 55% | 3 | 0.395267 |
| Propagation-weight heuristic | 82% | 34% | 43% | 46% | 58% | 3 | 0.409669 |
| Exomiser comparator | 100% | 39% | 46% | 48% | 55% | 7.5 | 0.447212 |

## Current Read
- The main problem is no longer missing genes. It is ranking pressure caused by weak, generic, or poorly connected phenotype profiles for the true gene.
- The most effective fixes so far have been evidence-surface fixes, not ML.
- The propagation-weight heuristic is the current best rule-based result because it improved recall and top-10 without introducing broad regressions.
- New hard rule:
  - never overfit the graph
  - never cheat a gene upward just because a benchmark case wants it
  - benchmark only generates hypotheses; source-backed curation authors truth
- The March 20-22 audits sharpened that further:
  - the `18` misses collapse to `12` unique truth genes
  - only `U2AF2` is a true empty shell
  - most remaining misses are undercovered truth branches, not disconnected genes
  - a smaller set is real ranking/support-selection failure

## Major Findings

### 1. Ranking pressure, not pure absence
- Ranking-pressure audit on 41 difficult cases:
  - Pattern A, weak phenotype match: 39.0%
  - Pattern C, swamped by similar candidates: 31.7%
  - Pattern D, other: 17.1%
  - Pattern B, weak evidence support: 12.2%
- Key implication: the truth gene often exists in the graph but loses because its disease profile is thinner or less specific than a competitor.

### 2. Direct phenotype evidence was being bypassed
- We confirmed 281,964 curated HPO disease-phenotype rows still existed in `relationships` / `relationship_evidence`.
- The DX path was routing too heavily through propagation-backed typed assertions and umbrella diseases instead of the direct curated disease profile.
- Fixing that recovered important regressions but also exposed that some previously rescued cases only looked good because broad propagated profiles were helping them.

### 3. Propagation helped and hurt
- Sparse-disease propagation added 196,838 phenotype edges across 3,553 diseases.
- Breakdown:
  - Xref propagation: 54,858 edges across 2,134 diseases
  - Parent propagation: 16,028 edges across 899 diseases
  - Gene-mediated propagation: 125,952 edges across 940 diseases
- Net effect: sharper ranking in some areas, but enough noise in others to create regressions.

### 4. Identity repairs mattered
- Fixed doubled-prefix cleanup for `NCBIGene:NCBIGene:*` records.
- Fixed cross-type canonical contamination.
- `RPGRIP1` canonical identity repair produced a real benchmark win.
- `U2AF2` identity now exists correctly in the graph, but HPO gene-disease / gene-phenotype source coverage is still missing, so ranking remains weak there.

### 5. PPI fallback is not solved yet
- STRING coverage was strong: 5,125 of 5,705 gene concepts had at least one high-confidence edge.
- But naive standalone random walk with restart was weak:
  - Top-1 rescue on 41 hard cases: 0
  - Top-5 rescue: 0
  - Top-10 rescue: 2
- Conclusion: PPI may help as a supporting feature, but not as a simple drop-in standalone signal.

## Important Concrete Fixes
- Source-control path added on 2026-03-17:
  - stable source ID is `source_key`
  - sources can be turned on/off via `sources.is_active`
  - disabled sources are skipped by bootstrap
  - direct sync attempts on disabled sources fail with a clear message
  - admin API and CLI support source enable/disable operations
- Phenotype propagation script added and run.
- Canonical cross-type merge bug fixed.
- Direct disease phenotype rows merged back into DX loading path.
- Support-disease selection now tracks direct vs propagated counts explicitly.
- Current heuristic weighting added for disease support evidence:
  - fully direct disease support weight = 1.0
  - propagated support weight is clamped between 0.25 and 0.85
  - weight depends on:
    - matched phenotype density
    - profile compactness
    - normalized phenotype similarity
    - direct-to-total phenotype edge ratio

## Propagation-Weight Heuristic Result
- Improved cases vs direct-edge baseline: 17
- Worsened cases: 2
- Recovered from miss: 2
- Regressed to miss: 0
- Notable wins:
  - `PMID_34521999_43`: 9 -> 1
  - `PMID_34521999_32`: 24 -> 12
  - `PMID_34521999_50`: 18 -> 10
  - `PMID_33731876_fam163`: miss -> 92
  - `PMID_37761890_22`: miss -> 80
- Minor worsened cases:
  - `PMID_31021519_individualfromTrakadisetal`: 64 -> 65
  - `PMID_31239556_individual2Gregoretal`: 48 -> 49

## Hard Miss Families Still Open
- `SCN2A` difficult cases, especially `PMID_33731876_fam421`
- `STXBP1` difficult cases, especially `PMID_35190816_STX_Syrbe_6`
- `PPP2R1A` difficult cases, especially `PMID_37761890_41`
- Additional sparse-profile genes still seen in earlier audits: `RERE`, `SETD2`, `SMARCC2`, `TRAF7`, `WWOX`, `U2AF2`

## Current Theory
- Same-source data is not the same as same-quality data.
- The truth gene often scores through a weaker disease node than the competitor.
- Broad clinical phrases and broad disease nodes flatten distinctions that matter:
  - progressive vs non-progressive
  - distal vs proximal vs limb-girdle
  - early infantile vs childhood onset
  - autistic features vs global developmental delay
  - psychiatric features vs generic neurodevelopmental phenotype
- The strongest next leverage is richer clinical profile quality, not another generic model layer.

## Source Strategy Hypothesis
- Best narrative source: GeneReviews
- Best structured rare-disease source: Orphadata / Orphanet
- Best computable phenotype backbone: HPO disease annotations
- Best validity guardrail: ClinGen
- Best patient-level edge-case nuance: DECIPHER
- Working hypothesis: build a two-layer phenotype system
  - structured assertions with qualifiers
  - literal source phrases with semantic embeddings and provenance

## Working Rule
- Do not jump to ML ranker training while the phenotype evidence surface is still obviously distorted.
- Fix phenotype profile quality first.
- Then train the learned ranker on cleaner evidence tiers.

## Current Best Next Moves
- Build richer clinical assertions with qualifiers like onset, progression, distribution, severity, and neuropsychiatric context.
- Keep direct curated assertions strongest, but let the eventual ranker learn the final blend across direct, extracted, propagated, and embedding-based matches.
- Use semantic retrieval to map vague patient language to specific clinical assertions.
- Revisit ML ranking only after the new phenotype layer is stable.

## 2026-03-22 Strategic Synthesis
- New planning anchor:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/OpusAudit1.md`
- Main take:
  - scoring-only experimentation has reached its ceiling on current evidence
  - the next leverage is pipeline completeness plus truth-branch enrichment
- Current miss-set split:
  - empty shell:
    - `U2AF2`
  - undercovered linked disease branches:
    - `WWOX`
    - `TRAF7`
    - `SOCS1`
    - `SETD2`
    - `ANKRD11`
    - `RERE`
  - mixed / unstable support surface:
    - `STXBP1`
  - ranking problem with usable evidence:
    - `SCN2A`
    - `SPTAN1`
    - `PPP2R1A`
    - `SMARCC2`
- Whole-graph structural spectrum over `5705` logical genes:
  - hollow shells: `23`
  - sparse one-sided: `426`
  - poorly enriched two-sided: `777`
  - better covered: `4479`
- Critical caution:
  - the `777` number is structural graph thinness, not a direct clinical-failure count
  - do not over-generalize the `U2AF2` pattern
- Current priority order:
  1. identity-repair-aware re-ingestion
  2. source freshness audit
  3. enrich the six undercovered truth branches
  4. inspect competitors for the four ranking cases
  5. test semantic similarity surgically
  6. train a ranker only after the evidence layer is cleaner
- Expanded same-day additions now preserved in `OpusAudit1.md`:
  - covered vs partially covered vs not-covered question inventory
  - semantic-similarity gate test
  - ML feature-shape proposal
  - model-organism channel proposal
  - STXBP1 and SPTAN1 concrete settlement tests
  - explicit caution that the database spectrum may become a confidence/product feature
  - explicit open-info list for what the audit still needs

## 2026-03-17 Deep HPO Usage Pass
- Goal: improve scoring without a new source ingest by using richer HPO fields already stored in `clinical_phenotype_assertions`.
- Code changes:
  - `dxRepository` now carries:
    - `presence_status`
    - `frequency_curie` / `frequency_label`
    - `onset`, `modifier`, `sex`, `aspect`
    - fallback rows now include both `has_phenotype` and `lacks_phenotype`
  - `similarityEngine` now:
    - separates disease present vs absent phenotype assertions
    - weights phenotype matches by HPO frequency tiers
    - applies contradiction penalties for:
      - patient present term vs disease absent term
      - patient excluded term vs disease present term
    - passes excluded HPO terms through disease and gene ranking paths
- Frequency weights used:
  - obligate `1.00`
  - very frequent `0.95`
  - frequent `0.85`
  - occasional `0.65`
  - very rare `0.45`
- Contradiction penalty weights used:
  - patient excluded vs disease present `0.30`
  - patient present vs disease absent `0.20`
- Verification:
  - targeted tests passed with `~/.nvm/versions/node/v22.22.0/bin/node --test`
  - added tests for:
    - obligate vs occasional weighting
    - excluded-phenotype contradiction penalty
- Final result with contradiction penalties enabled:
  - `Found: 82% -> 68%`
  - `Top-1: 34% -> 16%`
  - `Top-5: 46% -> 26%`
  - `Top-10: 58% -> 32%`
  - `MRR: 0.409669 -> 0.211003`
  - `Improved: 4`
  - `Worsened: 43`
  - `Recovered from miss: 0`
  - `Regressed to miss: 14`
- Interpretation:
  - loading richer HPO fields was fine
  - directly subtracting contradiction penalties in the rule-based scorer was not
  - the main damage came from changing score geometry before a trained ranker exists

## 2026-03-17 Deep HPO No-Penalty Variant
- Change:
  - kept richer HPO fields and frequency weighting
  - stopped subtracting contradiction penalties from `normalizedScore`
  - still exposed contradiction metrics in traces/results for later analysis
- Validation:
  - `~/.nvm/versions/node/v22.22.0/bin/node --test test/dxSimilarity.test.js test/phenopackets.test.js`
  - all `12` tests passed
- Official 100-case benchmark result:
  - `Found: 82% -> 82%`
  - `Top-1: 34% -> 34%`
  - `Top-5: 46% -> 46%`
  - `Top-10: 58% -> 57%`
  - `MRR: 0.409669 -> 0.409646`
  - `Improved: 5`
  - `Worsened: 1`
  - `Recovered from miss: 0`
  - `Regressed to miss: 0`
- Interpretation:
  - the collapse came from the contradiction penalties, not from carrying richer HPO fields themselves
  - without penalties, the scorer returns almost exactly to the propagation-weight heuristic baseline
  - frequency weighting alone is nearly neutral on this benchmark

## 2026-03-22 v0 Freeze and Phase 0 Start
- GitHub:
  - merged the freeze bundle into `main`
  - preserved the current code/docs/audit/walkback state as the `v0` file baseline
- Railway:
  - created frozen environment `genovy-v0-freeze-20260322`
  - created working environment `genovy-v1-working-20260322`
  - cloned the frozen DB into the working DB and repointed the working app service to its own Postgres
  - verified working clone counts:
    - `21` public tables
    - `81,870` entities
    - `967,198` relationships
    - `987,252` source records
- Phase 0 source freshness audit started and recorded in:
  - `docs/source-freshness-audit-phase0-20260322.md`
- Phase 0 provenance patch added on working branch:
  - source-version fallback now captured for:
    - `hpo_gene_disease`
    - `hpo_gene_phenotype`
    - `clingen_gene_disease_validity`
    - `clinvar_gene_disease`
  - targeted tests:
    - `node --test test/sourceFetch.test.js test/sourceParsers.test.js test/sourceVersion.test.js`
    - `6` passed, `0` failed
- Initial freshness findings:
  - current:
    - `mondo_ontology`
    - `hpo_ontology`
    - `hpo_disease_phenotype`
    - `orphadata_natural_history`
  - provably stale:
    - `clingen_gene_disease_validity`
    - `clinvar_gene_disease`
    - `clinvar_variant_summary`
  - provenance gap:
    - `hpo_gene_disease`
    - `hpo_gene_phenotype`
    - `clingen_gene_disease_validity`
    - `clinvar_gene_disease`
    do not currently persist a reliable source-version string in the graph
- Interpretation:
  - the first non-negotiable target is no longer vague
  - stale-source re-ingestion is warranted
  - provenance capture also needs fixing so future audits stop depending on inference

## 2026-03-22 Phase 0 Refresh Completion on `v1-working`
- Working DB only:
  - completed refreshes for:
    - `hpo_gene_disease` (`run 37`)
    - `hpo_gene_phenotype` (`run 38`)
    - `clingen_gene_disease_validity` (`run 40`)
    - `clinvar_gene_disease` (`run 41`)
    - `clinvar_variant_summary` (`run 45`)
- Recorded source versions now visible in `source_sync_state`:
  - `hpo_gene_disease`: `Mon, 16 Feb 2026 17:29:41 GMT`
  - `hpo_gene_phenotype`: `Mon, 16 Feb 2026 17:29:44 GMT`
  - `clingen_gene_disease_validity`: `2026-03-22`
  - `clinvar_gene_disease`: `Sun, 22 Mar 2026 14:17:20 GMT`
  - `clinvar_variant_summary`: `Sun, 15 Mar 2026 18:11:04 GMT`
- Selected completed refresh summaries:
  - `hpo_gene_disease`:
    - `5510` entities
    - `15913` relationships
    - `15914` source records
  - `hpo_gene_phenotype`:
    - `5256` entities
    - `329339` relationships
    - `329339` source records
  - `clingen_gene_disease_validity`:
    - `3484` relationships
    - `3463` clinical validity assertions
  - `clinvar_gene_disease`:
    - `5123` entities
    - `12818` relationships
  - `clinvar_variant_summary`:
    - `27831` entities
    - `104497` xrefs
    - `113014` relationships
    - `56494` clinical variant-disease assertions
- Working-clone schema repairs required before the refresh could complete:
  - repaired missing constraints on `relationships`
  - realigned sync-path sequences
  - repaired missing conflict targets on `clinical_variant_disease_assertions`
  - repaired missing keys/indexes on `entity_xrefs`
- Post-refresh narrow verification:
  - `U2AF2` remains an empty identity shell:
    - `0` disease links
    - `0` phenotype links
  - `RPGRIP1` remains a connected healthy comparator:
    - `10` disease links
    - `165` phenotype links
- Interpretation:
  - Phase 0 is complete on the working graph
  - provenance is now recorded cleanly for the previously blank surfaces
  - the `U2AF2` miss is not explained away by freshness alone
  - the next move is Phase 1:
    - full identity-repair sweep
    - `U2AF2` source/attachment diagnosis
    - refreshed-graph benchmark rerun before enrichment

## 2026-03-22 Phase 1 Initial Identity-Repair Sweep
- Evidence surfaces used:
  - `source_records` for `source_key = gene_identity_repair`
  - `sync_runs` for `source_key = gene_identity_repair`
  - live `entities.metadata_json.repairSource`
  - narrow `relationships` link counts
- Current confirmed repair-population result:
  - `2` logical repaired genes identified:
    - `U2AF2`
    - `RPGRIP1`
  - `1` empty shell:
    - `U2AF2`
  - `1` fully connected repaired gene:
    - `RPGRIP1`
- Live repaired-gene counts:
  - `U2AF2`:
    - `0` disease links
    - `0` phenotype links
    - still sourced only by `gene_identity_repair`
  - `RPGRIP1`:
    - `10` disease links
    - `165` phenotype links
    - later attached by real source ingestion
- Important caveat:
  - `sync_run 32` verification also mentioned `RPGRIP1L`
  - but `RPGRIP1L` does not currently appear in durable repair artifacts (`source_records`) or live `repairSource` metadata
  - so it is not counted in the confirmed repair population yet
- Interpretation:
  - the current repair-population problem is smaller than feared
  - there is not yet evidence of a broad class of repaired-but-empty genes
  - Phase 1 should narrow to:
    - `U2AF2` source/attachment diagnosis first
    - only broaden the sweep if another repair pathway or artifact set appears

## 2026-03-22 `U2AF2` Attachment Diagnosis
- Narrow official-source checks on the refreshed working graph:
  - no `source_records` hits for `U2AF2` or its main gene identifiers in:
    - `hpo_gene_disease`
    - `hpo_gene_phenotype`
    - `clingen_gene_disease_validity`
    - `clinvar_gene_disease`
    - `clinvar_variant_summary`
- But syndrome-side disease evidence does exist:
  - `hpo_disease_phenotype` contains `26` source records for `OMIM:620535`
  - `OMIM:620535` exists as xref on disease entity:
    - `MONDO:0957810`
    - `developmental delay, dysmorphic facies, and brain anomalies`
  - that disease entity already has:
    - `26` `has_phenotype` relationships
- Missing seam:
  - there are still no `associated_with_disease` links from `U2AF2` to `MONDO:0957810`
  - `U2AF2` remains at `0` disease links and `0` phenotype links overall
- Interpretation:
  - the graph already contains the syndrome phenotype profile
  - the failure is specifically the absence of a gene→disease attachment for `U2AF2`
  - Phase 1 should now answer one exact question:
    - do current official gene-oriented sources actually expose a usable `U2AF2 -> DEVDFB / OMIM:620535 / MONDO:0957810` mapping?

## 2026-03-23 Post-ClinVar Run `54` Audit And Benchmark
- Full official `clinvar_variant_summary` backfill completed successfully on `sync_run_id = 54`
  - source version: `Sun, 22 Mar 2026 06:46:45 GMT`
  - total accepted rows covered across the landed path: `3,163,504`
- Structural audit rerun is now scripted and repeatable:
  - [auditGraphStructuralSpectrum.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/auditGraphStructuralSpectrum.js)
  - output:
    - [post-clinvar-run54.summary.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/ops/post-clinvar-run54.summary.json)
- Baseline-aligned structural spectrum now reads:
  - hollow shells: `148`
  - sparse one-sided: `504`
  - poorly enriched two-sided: `1207`
  - better covered: `3846`
- Official 100-case benchmark rerun:
  - [official-benchmark-post-clinvar-run54.json](/Users/ahmedelmorshedy/Genovy/output/official-benchmark-post-clinvar-run54.json)
  - found: `83 / 100`
  - top-10: `57`
  - MRR: `0.410153`
- Versus frozen `v0` propagation-weight baseline:
  - found: `82 -> 83`
  - top-10: `58 -> 57`
  - MRR: `0.409669 -> 0.410153`
- Clean recovered miss versus frozen `v0`:
  - `PMID_36747105_proband` (`U2AF2`) now found at rank `30`
- Still-missed tail remains `17` cases, so the next phase should move to leftover-case fixing rather than more ClinVar transport work
- Detailed read preserved in:
  - [post-clinvar-run54-audit-and-benchmark.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/post-clinvar-run54-audit-and-benchmark.md)

## 2026-03-24 STXBP1 Direct Enrichment Shadow Test
- Shadow-only benchmark on current working graph:
  - target disease: `MONDO:0012812`
  - current direct disease profile: `27` terms
  - added GeneReviews-informed direct terms: `19`
- Current STXBP1 benchmark slice contains `10` truth-gene cases, so the test ran all `10`, not the older `8`-case subset.
- Final result:
  - found: `6 / 10 -> 6 / 10`
  - top-10: `1 -> 1`
  - median rank: `31 -> 31`
  - MRR: `0.024438 -> 0.024438`
  - improved: `0`
  - worsened: `0`
  - recovered from miss: `0`
- Important sanity check:
  - some patient packets do contain exact matches to the added terms:
    - `PMID_35190816_STX_26865513_Patient_45`: `4`
    - `PMID_35190816_STX_28944233_270001`: `7`
    - `PMID_35190816_STX_EG0598P`: `1`
  - despite that, ranks did not move
- Interpretation:
  - direct DEE4 enrichment alone does not rescue STXBP1 under the current scorer
  - this makes ranked-output auditing more urgent than broad manual enrichment
- Artifacts:
  - [stxbp1-direct-enrichment-shadow-test-20260324.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-direct-enrichment-shadow-test-20260324.md)
  - [stxbp1-direct-enrichment-test.json](/Users/ahmedelmorshedy/Genovy/output/stxbp1-direct-enrichment-test.json)

## 2026-03-24 Ranked Output Audit For Ranking-Problem Cases
- Added repeatable script:
  - [auditRankingProblemCases.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/auditRankingProblemCases.js)
- Audited live top-20 ranked competitors for:
  - `PMID_33731876_fam421` (`SCN2A`)
  - `PMID_36331550_Family16Patient21` (`SPTAN1`)
  - `PMID_37761890_41` (`PPP2R1A`)
  - `PMID_37761890_43` (`PPP2R1A`)
  - `PMID_30580808_Lo_twin_2-Fam-52` (`SMARCC2`)
- Aggregate finding across `100` top-competitor slots above truth:
  - broad propagated zero-direct competitors: `1`
  - specific direct-match competitors: `66`
  - no-support competitors: `2`
- Interpretation:
  - propagation penalty is not the main issue in this leftover set
  - `SPTAN1` remains the cleanest pure ranking problem
  - `PPP2R1A` now looks mixed: ranking plus truth-profile weakness
  - `SCN2A` and `SMARCC2` are sparse-packet cases with weak discriminative signal
- Detailed read:
  - [ranked-output-audit-ranking-problem-cases-20260324.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/ranked-output-audit-ranking-problem-cases-20260324.md)

## 2026-03-25 SPTAN1 Top-K Shadow And PPP2R1A Reassessment
- Added targeted shadow scorer:
  - [shadowSptan1TopKGeneProfile.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowSptan1TopKGeneProfile.js)
- Added package runner:
  - `npm run dx:shadow:sptan1-topk`
- `SPTAN1` test setup:
  - keep disease-support path unchanged
  - change only the direct gene-profile scorer
  - replace full phenotype-side averaging with top-k averaging
- `SPTAN1` result:
  - baseline rank `322`
  - best tested top-k rank: `182` at top-k `8`
  - other tested settings:
    - top-k `4`: `242`
    - top-k `12`: `260`
    - top-k `16`: `268`
    - top-k `24`: `260`
    - top-k `32`: `279`
    - top-k `48`: `318`
    - top-k `64`: `291`
- Interpretation:
  - broad gene-profile penalty is real
  - but top-k softening alone is far too weak to rescue `SPTAN1`
  - this should stay a leftover problem, not a ready-to-ship scorer patch
- `PPP2R1A` reassessment:
  - case `41` truth overlap `3` while many competitors have `4-8`
  - case `43` truth overlap `5` while many competitors have `6-9`
  - reclassify as mixed:
    - not pure ranking
    - truth-profile weakness is part of the problem
- Detailed writeup:
  - [sptan1-topk-shadow-and-ppp2r1a-reassessment-20260325.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/sptan1-topk-shadow-and-ppp2r1a-reassessment-20260325.md)

## 2026-03-25 STXBP1 Single-Case Audit
- Added targeted live audit script:
  - [auditStxbp1MissCase.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/auditStxbp1MissCase.js)
- Target case:
  - `PMID_35190816_STX_28944233_270001`
  - `18` present patient terms
- Live comparison:
  - winner `RAI1` / `Smith-Magenis syndrome`
  - truth `STXBP1` / `genetic developmental and epileptic encephalopathy`
- Score comparison:
  - winner normalized score `0.240032`
  - truth normalized score `0.163948`
  - winner disease support score `0.222258`
  - truth disease support score `0.077722`
- Exact direct support overlap:
  - winner: `11`
  - truth: `0`
- Interpretation:
  - this case does not support the simple “common terms are overweighted” theory
  - the winner owns multiple rare/fairly specific exact matches
  - the current truth support disease is broad and phenotypically weak for this patient
  - strongest next STXBP1 question is support-disease selection / truth-branch quality, not generic enrichment
- Detailed writeup:
  - [stxbp1-single-case-audit-20260325.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-single-case-audit-20260325.md)

## 2026-03-25 STXBP1 Disease-Branch Audit
- Added targeted branch-selection script:
  - [auditStxbp1DiseaseBranchSelection.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/auditStxbp1DiseaseBranchSelection.js)
- Target case:
  - `PMID_35190816_STX_28944233_270001`
- Check 1 result:
  - across all STXBP1-linked diseases, none of the four tested discriminating terms appear as direct terms
  - `DEE4` has none of the four terms, direct or propagated
  - only propagated appearances found were:
    - umbrella `MONDO:0100062`: `Broad face`, `Impulsivity`
    - `autism spectrum disorder`: `Pain insensitivity`, `Impulsivity`
- Check 2 result:
  - `DEE4` rank `5247`, normalized score `0.076491`, exact direct overlaps `1`
  - umbrella rank `7`, normalized score `0.227175`, direct overlaps `0`, propagated phenotype count `786`
- Interpretation:
  - this is not “specific branch already has the right features and still loses”
  - the specific STXBP1 branch is still too thin for this patient
  - umbrella support is compensating through a very large propagated phenotype surface
- Detailed writeup:
  - [stxbp1-disease-branch-audit-20260325.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-disease-branch-audit-20260325.md)

## 2026-03-25 STXBP1 Discriminating-Term Shadow Test
- Added targeted shadow script:
  - [shadowStxbp1DiscriminatingCase.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowStxbp1DiscriminatingCase.js)
- Target case:
  - `PMID_35190816_STX_28944233_270001`
- Added only four discriminating terms to `DEE4` in shadow:
  - `Broad face`
  - `Pain insensitivity`
  - `Broad palm`
  - `Impulsivity`
- Disease-level result:
  - `DEE4` rank `5253 -> 95`
  - `DEE4` normalized score `0.076491 -> 0.186806`
- Gene-level consequence:
  - baseline STXBP1 gene score `0.163948`
  - shadow-derived DEE4 support score `0.127028`
  - inferred STXBP1 gene score unchanged at `0.163948`
- Interpretation:
  - targeted discriminating enrichment does help the disease branch
  - but support aggregation/weighting still prevents that gain from changing the final STXBP1 gene score
- Detailed writeup:
  - [stxbp1-discriminating-term-shadow-test-20260325.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-discriminating-term-shadow-test-20260325.md)

## 2026-03-25 STXBP1 Support-Handoff Override Shadow
- Added follow-up shadow script:
  - [shadowStxbp1SupportHandoffOverride.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowStxbp1SupportHandoffOverride.js)
- Source artifact reused:
  - [shadow-stxbp1-discriminating-case-20260325.json](/Users/ahmedelmorshedy/Genovy/output/shadow-stxbp1-discriminating-case-20260325.json)
- Purpose:
  - test whether the remaining leak is the disease-to-gene handoff weight rather than the enriched `DEE4` branch itself
- Critical numbers:
  - enriched `DEE4` disease score: `0.186806`
  - support evidence weight: `1.0`
  - current support weight: `0.68`
  - current handoff score: `0.127028`
  - baseline direct `STXBP1` gene score: `0.163948`
  - exact minimum support weight to beat the current direct gene score: `0.877638`
- Scenario results:
  - `0.80` and `0.85` still fail
  - `0.90` succeeds:
    - handoff `0.168125`
    - final `STXBP1` gene score changes
  - `1.00` succeeds:
    - handoff `0.186806`
- Interpretation:
  - the March 25 discriminating enrichment was already strong enough
  - the real remaining leak is the current disease-to-gene handoff weight
  - a narrow floor override at `0.9` is sufficient to let the improved specific branch beat the existing direct `STXBP1` gene score
- Detailed writeup:
  - [stxbp1-support-handoff-override-shadow-20260325.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-support-handoff-override-shadow-20260325.md)

## 2026-03-25 STXBP1 Case-Slice Handoff Floor Shadow
- Added STXBP1 family rerun script:
  - [shadowStxbp1CaseSliceHandoffFloor.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowStxbp1CaseSliceHandoffFloor.js)
- Shadow policy:
  - same `4` discriminating `DEE4` terms
  - same narrow `0.9` handoff floor
  - rerun only the `10` STXBP1 benchmark cases
- Benchmark-comparable result (`limit=100`):
  - baseline unchanged:
    - `6 / 10` found
    - `top-10 = 1`
    - `MRR = 0.024438`
  - shadow unchanged:
    - `6 / 10` found
    - `top-10 = 1`
    - `MRR = 0.024438`
  - delta:
    - `0` improved
    - `0` worsened
- Full-rank diagnostic result (`limit=500`):
  - `2` cases improved slightly:
    - `PMID_35190816_STX_27159321_LD_0358`: `153 -> 152`
    - `PMID_35190816_STX_28944233_270001`: `267 -> 208`
  - `MRR 0.026578 -> 0.026688`
- Interpretation:
  - the single-case handoff leak is real
  - but `4-term + 0.9 floor` is still not enough to produce a visible top-100 STXBP1 benchmark gain
  - so the next STXBP1 lever is likely stronger branch enrichment or a stronger aggregation change than the narrow floor alone
- Detailed writeup:
  - [stxbp1-case-slice-handoff-floor-shadow-20260325.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-case-slice-handoff-floor-shadow-20260325.md)

## 2026-03-25 Generic Specific-Direct Handoff Floor Shadow
- Added full-benchmark shadow script:
  - [shadowGenericSpecificDirectHandoffFloor.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowGenericSpecificDirectHandoffFloor.js)
- Shadow policy:
  - no enrichment
  - no graph edits
  - no source refresh
  - raise disease-to-gene handoff floor to `0.9` when a support disease already has:
    - direct phenotype edges
    - and at least one exact direct patient overlap
- Full 100-case result:
  - baseline:
    - `Found = 82%`
    - `Top-1 = 34%`
    - `Top-3 = 43%`
    - `Top-5 = 46%`
    - `Top-10 = 57%`
    - `Median rank = 3`
    - `MRR = 0.409646`
  - shadow:
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
- Important wins:
  - `STXBP1` `PMID_35190816_STX_27159321_LD_0358`: `miss -> 96`
  - `WWOX` `PMID_24369382_Family1II4`: `33 -> 2`
  - `SCN2A` `PMID_33731876_fam163`: `92 -> 52`
  - `FBN1` `PMID_21683322_25`: `10 -> 1`
- Mild regressions:
  - `SATB2` `PMID_31021519_individualfromTrakadisetal`: `65 -> 67`
  - `PPP2R1A` `PMID_37761890_22`: `79 -> 80`
- Interpretation:
  - the handoff leak is a real global scorer issue, not just an STXBP1-specific oddity
  - this generic rule is more promising than the narrow STXBP1 `4-term + 0.9 floor` slice
  - it is the strongest March 25 scorer-side shadow so far that improves the benchmark without new data
  - still not a ship signal yet:
    - it remains a shadow benchmark
    - it needs a `1.0` ablation
    - the `2` regressions need inspection
- Detailed writeup:
  - [generic-specific-direct-handoff-floor-shadow-20260325.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/generic-specific-direct-handoff-floor-shadow-20260325.md)

## 2026-03-25 Generic Specific-Direct Handoff Floor Shadow (`1.0`)
- Reused the same full-benchmark shadow script:
  - [shadowGenericSpecificDirectHandoffFloor.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowGenericSpecificDirectHandoffFloor.js)
- Shadow policy:
  - same generic condition as the `0.9` run
  - stronger handoff floor:
    - `1.0` instead of `0.9`
- Full 100-case result:
  - baseline:
    - `Found = 82%`
    - `Top-1 = 34%`
    - `Top-3 = 43%`
    - `Top-5 = 46%`
    - `Top-10 = 57%`
    - `Median rank = 3`
    - `MRR = 0.409646`
  - shadow:
    - `Found = 84%`
    - `Top-1 = 42%`
    - `Top-3 = 52%`
    - `Top-5 = 53%`
    - `Top-10 = 60%`
    - `Median rank = 1.5`
    - `MRR = 0.485974`
  - delta:
    - `21` improved
    - `14` worsened
    - `2` recovered from miss
    - `0` regressed to miss
- Important wins:
  - `STXBP1` `PMID_35190816_STX_27159321_LD_0358`: `miss -> 25`
  - `SCN2A` `PMID_33731876_fam421`: `miss -> 43`
  - `SCN2A` `PMID_33731876_fam163`: `92 -> 20`
  - `SATB2` `PMID_31021519_individualfromTrakadisetal`: `65 -> 24`
  - `WWOX` `PMID_24369382_Family1II4`: `33 -> 1`
- Important regressions:
  - `PPP2R1A` `PMID_37761890_22`: `79 -> 90`
  - `PMID_32154675_Family4Patient11`: `33 -> 39`
  - `PMID_29122497_29122497_P1`: `75 -> 79`
  - `STXBP1` `PMID_35190816_STX_25818041_Patient_20`: `66 -> 70`
- Interpretation:
  - `1.0` is stronger than `0.9` on the benchmark headline metrics
  - but it is also clearly less restrained
  - so the next work is not more escalation
  - it is regression inspection and guardrail design
- Detailed writeup:
  - [generic-specific-direct-handoff-floor-shadow-20260325-w1.0.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/generic-specific-direct-handoff-floor-shadow-20260325-w1.0.md)

## 2026-03-25 Official Handoff Floor `1.0` Benchmark
- Patched the real scorer with a named specific-direct handoff override:
  - [dx.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/constants/dx.js)
  - [similarityEngine.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/services/dx/similarityEngine.js)
- Added focused unit coverage:
  - [dxSimilarity.test.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/dxSimilarity.test.js)
- Test status:
  - `node --test test/dxSimilarity.test.js` passed
- Official benchmark rerun artifacts:
  - [handoff-floor-1.0.json](/Users/ahmedelmorshedy/Genovy/output/handoff-floor-1.0.json)
  - [handoff-floor-1.0.md](/Users/ahmedelmorshedy/Genovy/output/handoff-floor-1.0.md)
- Baseline vs patched scorer:
  - baseline:
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
- Exomiser comparison:
  - Genovy now leads on:
    - `Top-1`
    - `Top-3`
    - `Top-5`
    - `Top-10`
    - `MRR`
  - Exomiser still leads on:
    - total recall / found rate
- Important nuance:
  - the real scorer run is slightly less clean than the earlier `1.0` shadow
  - `U2AF2` `PMID_36747105_proband` regressed from `30 -> miss`
- Interpretation:
  - this is the strongest real rule-based scorer result so far
  - the handoff-floor family is now proven in production-like evaluation, not just in shadow
  - but `U2AF2` shows the rule still needs follow-up triage before it can be treated as final
- Detailed writeup:
  - [official-handoff-floor-1.0-benchmark-20260325.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/official-handoff-floor-1.0-benchmark-20260325.md)

## 2026-03-26 Anti-Overfitting Rule + U2AF2 Safe Start
- Added explicit curation hard rules:
  - [source-backed-curation-hard-rules-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/source-backed-curation-hard-rules-20260326.md)
- Also embedded the same rule into:
  - [genovy-non-negotiable-fixes.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genovy-non-negotiable-fixes.md)
- Rule in plain language:
  - benchmark can point to a missing syndrome feature
  - benchmark cannot define truth
  - no direct graph mutation from benchmark pressure
  - every added term must be source-backed and shadow-tested first
- Started the safe U2AF2 workflow with a prep note:
  - [u2af2-source-backed-shadow-prep-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/u2af2-source-backed-shadow-prep-20260326.md)
- Important new U2AF2 split:
  - `PMID_36747105_proband`
    - current disease profile already covers all `7 / 7` positive terms
    - this is mainly seam/support fragility, not missing positive terms
  - `PMID_37962958_43`
    - current disease profile covers only `3 / 25` positive terms
    - this is a real undercoverage case and a valid target for source-backed shadow enrichment
- Interpretation:
  - `U2AF2` is not one homogeneous failure mode
  - the earlier hope that ClinVar should have cleanly yielded `+2` was too simplistic
  - one case needed a stronger seam
  - the other needs a richer syndrome surface

## 2026-03-26 U2AF2 Public-Source Candidate List Started
- Added:
  - [u2af2-public-source-candidate-terms-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/u2af2-public-source-candidate-terms-20260326.md)
- Evidence used:
  - GenCC
  - public PMC cohort/review papers
- No graph mutation performed.
- First safe shadow-candidate set for the harder `U2AF2` case:
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
- Important discipline point:
  - these are only safe **shadow** candidates
  - several tempting terms remain intentionally excluded until stronger source proof exists

## 2026-03-26 U2AF2 Public-Source Shadow Result
- Added:
  - [shadowU2af2PublicSourceCandidates.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowU2af2PublicSourceCandidates.js)
  - [u2af2-public-source-shadow-test-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/u2af2-public-source-shadow-test-20260326.md)
- Result on the `2` U2AF2 cases:
  - `miss -> miss`
  - `miss -> miss`
  - no truth-gene recovery at all
- Interpretation:
  - public-source-backed disease enrichment alone is not enough for `U2AF2`
  - this is now a stronger proof that `U2AF2` is seam/support-path first, not enrichment first
- Practical consequence:
  - park more U2AF2 term-chasing
  - move next to support-seam repair for `U2AF2`

## 2026-03-26 U2AF2 Manual OMIM Shadow Result
- Added:
  - [u2af2-manual-omim-extract-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/u2af2-manual-omim-extract-20260326.md)
  - [u2af2-omim-shadow-test-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/u2af2-omim-shadow-test-20260326.md)
- OMIM-backed shadow set:
  - requested `10` terms
  - corrected rerun: all `10` were actually added in shadow
- Result:
  - still `miss -> miss`
  - still `miss -> miss`
  - truth gene absent from the reported ranking in both U2AF2 cases
- Interpretation:
  - even manual OMIM syndrome enrichment does not move U2AF2 while the seam remains weak
  - this is now strong evidence that U2AF2 should move to the support-seam repair track, not the enrichment track

## 2026-03-26 U2AF2 OMIM Shadow Script Correction
- Fixed:
  - [shadowU2af2PublicSourceCandidates.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowU2af2PublicSourceCandidates.js)
- Bug:
  - the script accepted `--target-terms` for candidate loading but still iterated an older hardcoded candidate list when constructing shadow rows
- Corrected rerun:
  - all `10` requested OMIM-backed terms were added successfully
  - result remained unchanged:
    - `PMID_36747105_proband`: `miss -> miss`
    - `PMID_37962958_43`: `miss -> miss`
- Practical consequence:
  - the negative U2AF2 OMIM result is now stronger, not weaker
  - do not spend more time on U2AF2 term enrichment before support-seam repair

## 2026-03-26 ANKRD11 Symmetric Source Shadow
- Added:
  - [shadowAnkrd11SymmetricSourceTerms.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowAnkrd11SymmetricSourceTerms.js)
  - [ankrd11-symmetric-source-shadow-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/ankrd11-symmetric-source-shadow-20260326.md)
- Strict literal-source scenario:
  - added `3` terms
  - `PMID_36446582_Goldenberg2016_P13`: `395 -> 368`
  - `PMID_36446582_Miyatake2017_P1`: `176 -> 128`
  - winner stayed wrong in both cases
- Symmetric parent-promotion scenario:
  - added `5` terms
  - `PMID_36446582_Goldenberg2016_P13`: `395 -> 312`
  - `PMID_36446582_Miyatake2017_P1`: `176 -> 112`
  - winner still stayed wrong in both cases
- Interpretation:
  - the user's symmetric source-backed addition idea improves both ANKRD11 misses
  - but current scorer geometry still does not let the broad true KBG branch win
  - ANKRD11 is now stronger evidence that source repair alone is not sufficient for every remaining miss

## 2026-03-26 ANKRD11 Manual OMIM Truth/Outranker Pass
- Added:
  - [ankrd11-manual-omim-extract-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/ankrd11-manual-omim-extract-20260326.md)
- OMIM entries inspected manually in browser:
  - `148050` `KBG syndrome`
  - `615072` `Brachydactyly, type A1, C`
  - `616461` `Epilepsy, familial temporal lobe, 8`
- Important correction:
  - the actual hand-focused outranker is the `GDF5` subtype `BDA1C`, not only the classical `IHH` parent `BDA1` entry
- Main read:
  - OMIM strongly confirms `KBG syndrome` as a broad hand-anomaly + short stature + developmental delay + seizure syndrome
  - OMIM strongly confirms `ETL8` as a very narrow epilepsy branch
  - OMIM confirms `BDA1C` as a narrow hand-focused brachydactyly branch with short stature
- Interpretation:
  - OMIM adds confidence and disease-shape clarity more than a large hidden term haul
  - this reinforces the current read that `ANKRD11` is a hybrid miss: real source-backed truth support exists, but current scorer geometry still favors narrower sharper branches

## 2026-03-26 ANKRD11 Symmetric OMIM Shadow
- Added:
  - [shadowAnkrd11SymmetricOmimTerms.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowAnkrd11SymmetricOmimTerms.js)
  - [ankrd11-symmetric-omim-shadow-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/ankrd11-symmetric-omim-shadow-20260326.md)
- Strict literal OMIM structural scenario:
  - `PMID_36446582_Goldenberg2016_P13`: `696 -> 696`
  - `PMID_36446582_Miyatake2017_P1`: `175 -> 175`
  - winner stayed wrong in both cases
- OMIM cumulative with prior source shadow:
  - `PMID_36446582_Goldenberg2016_P13`: `696 -> 696`
  - `PMID_36446582_Miyatake2017_P1`: `175 -> 88`
  - winner still stayed wrong in both cases
- Interpretation:
  - literal new OMIM structural terms do essentially nothing
  - cumulative OMIM-backed truth/outranker additions materially improve the second case
  - but `ANKRD11` still does not flip, reinforcing that this is a hybrid source-plus-scoring miss rather than a simple hidden-term miss

## 2026-03-26 RERE Manual OMIM Pass And Symmetric Shadow
- Added:
  - [rere-manual-omim-extract-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/rere-manual-omim-extract-20260326.md)
  - [shadowRereSymmetricOmimTerms.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowRereSymmetricOmimTerms.js)
  - [rere-symmetric-omim-shadow-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/rere-symmetric-omim-shadow-20260326.md)
- OMIM truth/outranker read:
  - `RERE` `OMIM 616975` supports broad dysmorphology and neurodevelopmental features
  - `MED13` `OMIM 618009` explicitly supports the outranking facial terms `Synophrys` and `Wide mouth`
  - strict OMIM does **not** expose those same exact discriminators on the `RERE` truth branch
- Symmetric shadow result:
  - truth rank stayed `237 -> 237`
  - top1 stayed `MED13 -> MED13`
  - only `3` genuinely new OMIM terms were added, all on the `MED13` branch
  - all candidate `RERE` OMIM terms were already present in the live direct profile and therefore skipped
- Interpretation:
  - this is a strong negative result for an OMIM-only `RERE` rescue
  - the asymmetry is real, not a reading artifact
  - if `RERE` improves via source-backed enrichment, the next honest source layer is likely `GeneReviews` or the core case series rather than OMIM alone

## 2026-03-26 RERE Symmetric Case-Series Shadow
- Added:
  - [shadowRereSymmetricCaseSeriesTerms.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowRereSymmetricCaseSeriesTerms.js)
  - [shadow-rere-symmetric-case-series-terms-20260326.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-rere-symmetric-case-series-terms-20260326.json)
  - [shadow-rere-symmetric-case-series-terms-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-rere-symmetric-case-series-terms-20260326.md)
  - [rere-symmetric-case-series-shadow-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/rere-symmetric-case-series-shadow-20260326.md)
- Result:
  - baseline `RERE` rank: `238`
  - symmetric case-series presence shadow: `82`
  - symmetric case-series + frequency shadow: `230`
  - `MED13` stayed `1` in both scenarios
- Interpretation:
  - broader source-backed symmetric enrichment proved the truth branch can move strongly once it gets the exact discriminators `Synophrys` and `Wide mouth`
  - but the current scorer still does not choose the truth
  - frequency handling is now a confirmed part of the remaining `RERE` failure mode, not just a theory

## 2026-03-26 RERE Behavior Diagnostic Shadow
- Added:
  - [shadowRereBehaviorDiagnostic.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowRereBehaviorDiagnostic.js)
  - [rere-behavior-diagnostic-shadow-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/rere-behavior-diagnostic-shadow-20260326.md)
- Result:
  - baseline `RERE`: `237`
  - remove `MED13 -> ADHD` only: `237`
  - add exact `RERE -> Compulsive behaviors` only: `209`
  - do both together: `209`
  - `MED13` stayed `1` in every scenario
- Interpretation:
  - the behavior semantic mismatch is real but not decisive
  - it is not the main reason `MED13` wins

## 2026-03-26 TRAF7 Symmetric Source Shadow
- Added:
  - [shadowTraf7SymmetricSourceTerms.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowTraf7SymmetricSourceTerms.js)
  - [traf7-symmetric-source-shadow-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/traf7-symmetric-source-shadow-20260326.md)
  - [shadow-traf7-symmetric-source-terms-20260326.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-traf7-symmetric-source-terms-20260326.json)
  - [shadow-traf7-symmetric-source-terms-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-traf7-symmetric-source-terms-20260326.md)
- OMIM literal scenario:
  - added terms: `0`
  - truth rank `143 -> 143`
  - winner stayed `DOT1L`
- OMIM plus primary-paper scenario:
  - added terms: `0`
  - truth rank `143 -> 143`
  - winner stayed `DOT1L`
- Interpretation:
  - these obvious source-backed syndrome terms were already present on both branches
  - there was no disease-specific `GeneReviews` chapter to add for either branch
  - `TRAF7` is not losing because of a missed OMIM / primary-paper term haul
  - remaining leak is more likely finer exact granularity plus scorer geometry

## 2026-03-26 SETD2 Symmetric Source Shadow
- Added:
  - [shadowSetd2SymmetricSourceTerms.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowSetd2SymmetricSourceTerms.js)
  - [setd2-symmetric-source-shadow-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/setd2-symmetric-source-shadow-20260326.md)
  - [shadow-setd2-symmetric-source-terms-20260326.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-setd2-symmetric-source-terms-20260326.json)
  - [shadow-setd2-symmetric-source-terms-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-setd2-symmetric-source-terms-20260326.md)
- Result:
  - added terms: `2`
  - skipped existing terms: `8`
  - new truth-side terms:
    - `Motor delay`
    - `Accelerated skeletal maturation`
  - `SETD2` rank: `140 -> 1`
  - top1 flipped: `TCF20 -> SETD2`
- Interpretation:
  - this is a clean source-backed rescue
  - `SETD2` was mainly missing the two sharp exact terms that mattered most
  - once those exact truth-side terms were restored, the current scorer chose the truth correctly

## 2026-03-26 SOCS1 Symmetric Source Shadow
- Added:
  - [shadowSocs1SymmetricSourceTerms.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowSocs1SymmetricSourceTerms.js)
  - [socs1-symmetric-source-shadow-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/socs1-symmetric-source-shadow-20260326.md)
  - [shadow-socs1-symmetric-source-terms-20260326.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-socs1-symmetric-source-terms-20260326.json)
  - [shadow-socs1-symmetric-source-terms-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-socs1-symmetric-source-terms-20260326.md)
- Result:
  - added terms: `5`
  - new truth-side exact terms:
    - `Autoimmunity`
    - `Otitis media`
    - `Chronic colitis`
    - `Eczematoid dermatitis`
  - new outranker-side exact term:
    - `Autoimmunity`
  - `SOCS1` rank: `400 -> 48`
  - top1 stayed `CTLA4`
- Interpretation:
  - this is a real source-backed lift, not a null result
  - `SOCS1` was materially undercovered on the disease surface
  - but `CTLA4` still keeps the sharpest exact packet terms, so the case remains mixed rather than fully rescued

## 2026-03-27 STXBP1 Remaining Pair Status
- Added:
  - [stxbp1-remaining-miss-pair-status-20260327.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-remaining-miss-pair-status-20260327.md)
- Result:
  - fresh `28944233` live rerank succeeded and confirmed the older March 25 story still holds:
    - top outranker `RAI1`
    - support disease `Smith-Magenis syndrome`
    - winner still owns many rare/specific exact overlaps
  - `26865513` still has the preserved undercoverage profile:
    - only `2` direct exact overlaps on the best STXBP1 support disease
    - many truth terms absent from the specific direct branch
    - `Truncal ataxia`, `Head tremor`, `Emotional lability` absent from all linked STXBP1 disease profiles at any level
  - heavy full-index single-case rerank for `26865513` failed with Postgres temp-space exhaustion
  - live `/api/dx/rank-genes` returned Railway `502` on both remaining STXBP1 packets
- Interpretation:
  - do not force more heavy live reranks right now
  - keep `28944233` classified as the stronger mimic-heavy STXBP1 miss
  - treat `26865513` as the likely undercoverage STXBP1 miss until a lighter audit path is built

## 2026-03-27 SPTAN1 Ranking Reopen
- Added:
  - [sptan1-ranking-reopen-20260327.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/sptan1-ranking-reopen-20260327.md)
- Result:
  - packet has only `2` present terms and `19` excluded terms
  - truth `SPTAN1` row still has exact direct overlap `2` yet sits at rank `322`
  - top outranker `ZBTB11` also has exact direct overlap `2` and sits at rank `1`
  - there are `20` competitors above truth, and `17` are specific direct-match leaf diseases
- Interpretation:
  - this is still the cleanest genuine ranking/specificity leftover
  - not a propagated-umbrella bug
  - not a clean source-gap case
  - and the earlier top-k scorer softening test remains too weak to rescue it

## 2026-03-27 PPP2R1A Reopen
- Added:
  - [ppp2r1a-reopen-20260327.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/ppp2r1a-reopen-20260327.md)
- Result:
  - case `41`:
    - truth rank `256`
    - truth exact direct overlap `3`
    - top outranker `HNRNPC` exact direct overlap `5`
  - case `43`:
    - truth rank `109`
    - truth exact direct overlap `5`
    - top outranker `MACF1` exact direct overlap `6`
- Interpretation:
  - `PPP2R1A` still should not sit in the same bucket as `SPTAN1`
  - both cases are mixed
  - truth-side disease profile weakness is real in both
  - case `43` looks more salvageable than case `41`

## 2026-03-27 SMARCC2 Reopen
- Added:
  - [smarcc2-reopen-20260327.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/smarcc2-reopen-20260327.md)
- Result:
  - packet has only `1` present term and `6` excluded craniofacial terms
  - truth `SMARCC2` remains a benchmark miss while Exomiser is also poor at `927`
  - saved truth disease routing is weak:
    - `Coffin-Siris syndrome 8` direct branch has `0` exact direct overlap
    - generic `Coffin-Siris syndrome` only helps through propagation
  - narrow live lookup shows:
    - both `SMARCC2` and `NLGN1` genes directly match `Autistic behavior`
    - only `SMARCC2` picks up excluded `Microcephaly`
- Interpretation:
  - this is a sparse ranking plus negative-evidence problem
  - not a promising manual-enrichment target
  - better left for negative-evidence/scorer work or later ML

## 2026-03-27 PPP2R1A Narrow Live Surface Check
- Updated:
  - [ppp2r1a-reopen-20260327.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/ppp2r1a-reopen-20260327.md)
- Result:
  - narrow live lookup on exact packet terms only
  - current disease branches for truth and top outrankers showed `0` exact direct packet hits
  - exact packet coverage is currently carried by the gene direct layer instead:
    - case `41`: `PPP2R1A 3` vs `HNRNPC 5`
    - case `43`: `PPP2R1A 5` vs `MACF1 6`
- Interpretation:
  - `PPP2R1A` remains mixed
  - case `41` is still the weaker truth branch
  - case `43` is still the better salvage target

## 2026-03-27 PPP2R1A Truth Shadow
- Updated:
  - [ppp2r1a-reopen-20260327.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/ppp2r1a-reopen-20260327.md)
- Added scripts:
  - [shadowPpp2r1aTruthSourceTerms.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowPpp2r1aTruthSourceTerms.js)
  - [shadowPpp2r1aTruthHeadToHead.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowPpp2r1aTruthHeadToHead.js)
- Added outputs:
  - [shadow-ppp2r1a-truth-headtohead-20260327.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-ppp2r1a-truth-headtohead-20260327.json)
  - [shadow-ppp2r1a-truth-headtohead-20260327.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-ppp2r1a-truth-headtohead-20260327.md)
- Result:
  - truthful disease repair flips case `43` locally:
    - `PPP2R1A 2 -> 1` over `MACF1`
  - truthful disease repair improves but does not rescue case `41`:
    - `PPP2R1A 3 -> 2`, still behind `HNRNPC`
- Interpretation:
  - this confirms `PPP2R1A` is a mixed gene with one clearly salvageable case
  - and that truthful branch repair can matter materially here

## 2026-03-27 U2AF2 Symmetric Source Shadow
- Added:
  - [u2af2-symmetric-source-shadow-20260327.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/u2af2-symmetric-source-shadow-20260327.md)
- Added script:
  - [shadowU2af2SymmetricSourceTerms.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/shadowU2af2SymmetricSourceTerms.js)
- Added outputs:
  - [shadow-u2af2-symmetric-source-terms-20260327.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-u2af2-symmetric-source-terms-20260327.json)
  - [shadow-u2af2-symmetric-source-terms-20260327.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-u2af2-symmetric-source-terms-20260327.md)
- Result:
  - current live hard-case outranker identified exactly:
    - `LRRC7`
    - `MONDO:0980748`
    - `intellectual developmental disorder, autosomal dominant 77`
  - strict symmetric source check found:
    - `10` promotable truth-side additions for `U2AF2`
    - `0` new packet-relevant rival additions for `LRRC7`
  - rank outcome:
    - `U2AF2 959 -> 2`
    - `LRRC7 1 -> 1`
- Interpretation:
  - this confirms the hard `U2AF2` case is not blocked by missing rival curation
  - it is a real truthful enrichment win that still loses to a strong mimic under the current scorer
  - `LRRC7` staying top despite multiple exact excluded-term contradictions keeps this case in the future negative-evidence / ranking bucket

## 2026-03-27 RERE Live Symmetric Reopen
- Added:
  - [rere-live-symmetric-reopen-20260327.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/rere-live-symmetric-reopen-20260327.md)
  - [shadow-rere-live-symmetric-reopen-20260327.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-rere-live-symmetric-reopen-20260327.json)
- Result:
  - used a narrow live direct disease-surface lookup for `RERE` and `MED13` only
  - did not rely on a second heavy full rerank after the fresh centerbeam path stalled
  - confirmed baseline direct exact ownership before the saved additions:
    - `RERE` owns `Anteverted nares`
    - `MED13` owns `Wide mouth` and `Synophrys`
    - both share `Hypertelorism`, `Autistic behavior`, `Hypotonia`, `Global developmental delay`
  - confirmed direct exact excluded contradictions are highly asymmetric on the current live surface:
    - `RERE` carries a large excluded-contradiction set
    - `MED13` carries only `Smooth philtrum`
  - preserved the saved symmetric case-series movement:
    - `RERE 238 -> 82`
    - `MED13 1 -> 1`
  - after the saved additions, `MED13` no longer owns the main present exact discriminators
- Interpretation:
  - this means the remaining `RERE` miss is no longer well explained by obvious truth-side exact-term absence
  - the unresolved piece is now how the scorer handles the case after exact recovery, especially contradiction and frequency behavior

## 2026-03-27 Bulk Reopen Of Remaining Unsolved Misses
- Added:
  - [unsolved-miss-bulk-reopen-20260327.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/unsolved-miss-bulk-reopen-20260327.md)
  - [unsolved-miss-bulk-reopen-20260327.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/unsolved-miss-bulk-reopen-20260327.json)
  - [generateUnsolvedMissBulkReopen.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/generateUnsolvedMissBulkReopen.js)
- Scope:
  - `12` unresolved case slots from the real current miss set
  - skipped `SETD2` because the saved symmetric source shadow already rescues it
- Result:
  - one consistent reopen artifact now exists for the remaining unresolved cases
  - each case preserves:
    - packet present/excluded terms
    - disease direct exact present/excluded ownership
    - gene direct exact present/excluded ownership
    - the saved current read from earlier case work
- Interpretation:
  - this turns the remaining miss tail into one standardized evidence surface instead of fragmented case notes
  - it should make the next prioritization pass much cleaner because all unresolved cases now share the same reopen format

## 2026-03-28 Three-Source Structured Enrichment Pass
- Added:
  - [benchmark-miss-tail-broad-roster-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/data/source-enrichment/benchmark-miss-tail-broad-roster-20260328.json)
  - [generatePacketSourceEnrichmentManifest.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/generatePacketSourceEnrichmentManifest.js)
  - [applySourceEnrichmentManifest.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/applySourceEnrichmentManifest.js)
  - [source-enrichment-three-source-pass-20260328.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/source-enrichment-three-source-pass-20260328.md)
  - [source-enrichment-manifest-broad-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-manifest-broad-20260328.json)
  - [source-enrichment-apply-log-broad-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-apply-log-broad-20260328.json)
  - [official-v1-enrich-three-source-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-v1-enrich-three-source-20260328.json)
  - [official-v1-enrich-three-source-20260328.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-v1-enrich-three-source-20260328.md)
- Result:
  - created a provenance-carrying manifest model that records:
    - disease entity
    - phenotype
    - side (`truth-side` / `rival-side`)
    - date added
    - evidence tag
    - supporting source rows
  - applied the structured-source manifest on the staging clone only
  - reran the full official benchmark immediately after with no other changes
- Outcome:
  - only `4` unique packet-relevant additions were discovered across the broad unresolved roster
  - benchmark stayed flat at `87 found`, `42 top-1`, `MRR 0.488736`
- Interpretation:
  - these structured sources are worth keeping as reproducible, provenance-rich enrichment infrastructure
  - but they did not recover any additional misses on their own in this pass

## 2026-03-28 Global HPO Negative Benchmark
- Added:
  - [generateGlobalHpoNegativeManifest.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/generateGlobalHpoNegativeManifest.js)
  - [source-enrichment-hpo-negative-global-pass-20260328.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/source-enrichment-hpo-negative-global-pass-20260328.md)
  - [source-enrichment-manifest-hpo-negative-global-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-manifest-hpo-negative-global-20260328.json)
  - [source-enrichment-apply-log-hpo-negative-global-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-apply-log-hpo-negative-global-20260328.json)
  - [official-v1-enrich-hpo-negative-global-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-v1-enrich-hpo-negative-global-20260328.json)
  - [official-v1-enrich-hpo-negative-global-20260328.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-v1-enrich-hpo-negative-global-20260328.md)
- Result:
  - imported `727` new HPO negative assertions from `phenotype.hpoa`
  - all `727` mapped into existing graph diseases cleanly
  - reran the official `100` immediately after on staging with the same `1.0` scorer
- Outcome:
  - topline benchmark stayed flat at `87 found`, `42 top-1`, `53 top-5`, `62 top-10`
  - `MRR` nudged from `0.488736` to `0.488760`
  - `5` cases improved by one rank and `2` worsened by one rank
- Interpretation:
  - full-graph HPO negatives are now operational in the enrichment pipeline
  - but absent assertions by themselves are not enough to close the remaining recall gap

## 2026-03-30 Full Read Recovery And Continuity Audit
- Added:
  - [full-read-audit-report-20260330.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/full-read-audit-report-20260330.md)
  - [full-read-understanding-report-20260330.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/full-read-understanding-report-20260330.md)
  - [github-genovy-main-fullread-summary.txt](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/github-genovy-main-fullread-summary.txt)
  - [github-genovy-main-fullread-manifest.tsv](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/github-genovy-main-fullread-manifest.tsv)
  - [github-genovy-all-history-blobs-summary.txt](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/github-genovy-all-history-blobs-summary.txt)
  - [github-genovy-all-history-blobs.tsv](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/github-genovy-all-history-blobs.tsv)
  - [gcs-genovy-artifacts-fullread-summary.txt](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/gcs-genovy-artifacts-fullread-summary.txt)
  - [gcs-genovy-artifacts-fullread-manifest.tsv](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/gcs-genovy-artifacts-fullread-manifest.tsv)
- Verified coverage:
  - GitHub repo `main` tracked files fully read: `106`
  - GitHub reachable blob history fully read: `11457`
  - bucket objects fully read: `1282`
- Operational result:
  - continuity is no longer dependent on thread memory alone
  - the exact file/object surfaces that were inspected are now preserved in manifests
  - the synthesis of what those files say is captured in one durable report
- Scientific continuity result:
  - `STXBP1` March 24-25 logic remains coherent: semantic matching real, broad enrichment insufficient, handoff leak real
  - later STX work confirms mixed case classes rather than one single failure mode
  - `RERE` remains a scorer-behavior problem after exact recovery rather than a plain missing-term problem
  - `U2AF2` is better placed in the weak-truth-profile bucket in the real working lineage
- Interpretation:
  - the main damage was fragmentation of evidence across repo, worktree, and bucket, not disappearance of the work itself
  - the project now has a durable read-backed continuity anchor

## 2026-03-30 March 29-30 Bucket Reread
- Added:
  - [march29-30-bucket-understanding-report-20260330.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/march29-30-bucket-understanding-report-20260330.md)
  - supporting slice inventory:
    - [gcs-march29-30-path-slice.txt](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/gcs-march29-30-path-slice.txt)
- Verified state:
  - March 29 bucket holds the real global GeneReviews pivot:
    - roster `879`
    - exact-mapped `445`
    - unresolved `418`
  - broad honest-symmetric GeneReviews work was still conservative:
    - seeded pilot accepted `12`
    - shadow manifest accepted `0`
  - March 29 benchmark state separates cleanly into:
    - structured global only -> `86 found`
    - structured global + manual curated -> `92 found`
  - manual curated uplift is traceable to a provenance-carrying `26`-entry overlay, not an undocumented tweak
  - STX March 29 GeneReviews work was mixed:
    - `19` entries applied
    - hard STX misses like `Syrbe_6` were not resolved
    - some already-good STX cases worsened
  - March 30 bucket is primarily pipeline engineering:
    - `latest5` review-only
    - `hybrid latest10` review-only
    - MedGemma branch blocked by paused endpoint
    - `autoaccept batch1-20` produced `679` manifest rows
    - Qwen outperformed GLiNER in candidate breadth on the saved `latest5` comparison
- Interpretation:
  - the saved `92%` state belongs to the structured-plus-manual branch, not to broad GeneReviews auto-accept
  - the bucket now supports a coherent chronology from March 29 benchmark gains into March 30 pipeline scaling work

## 2026-03-30 Benchmark Reconciliation Plus GeneReviews Latest Runner
- Added:
  - [benchmark-lineage-reconciliation-87-vs-92-20260330.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/benchmark-lineage-reconciliation-87-vs-92-20260330.md)
  - [genereviews-latest-engineering-pipeline-20260330.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genereviews-latest-engineering-pipeline-20260330.md)
  - [genereviewsPipelineProfiles.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/genereviewsPipelineProfiles.js)
  - [runGeneReviewsPipeline.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/runGeneReviewsPipeline.js)
- Reconciled state:
  - current working safe baseline:
    - `87 found`
    - `13` misses
    - `0` found-but-`>100`
  - saved March 29 stronger historical branch:
    - `92 found`
    - `8` misses
    - `0` found-but-`>100`
  - bridge identified:
    - structured global enrichment layer
    - plus saved `26`-entry manual curated overlay
- Engineering result:
  - the GeneReviews pipeline is no longer only a set of dated stage scripts
  - it now has one durable profile runner with named March 30 stack profiles:
    - `latest5-qwen-20260330`
    - `hybrid-latest10-20260330`
    - `autoaccept-batch1-20-20260330`
  - package entrypoint:
    - `npm run gr:pipeline -- --list`
- GitHub continuity result:
  - the latest GeneReviews engineering branch is confirmed in committed history, especially:
    - `4629bcb` `Add GeneReviews NLP shadow manifest builder`
    - `e46aebd` `Add GeneReviews global shadow tools`
    - `1c044e6` `Add GeneReviews enrichment pipeline and archive artifact storage`
- Interpretation:
  - the project now has both:
    - a durable explanation of how to catch the current `87%` line up to the saved `92%` branch safely
    - and a durable entrypoint for the latest GeneReviews extraction engineering stack

## 2026-03-30 GitHub Commit Reread For GeneReviews Architecture
- Re-read commits:
  - `4629bcb` `Add GeneReviews NLP shadow manifest builder`
  - `e46aebd` `Add GeneReviews global shadow tools`
  - `1c044e6` `Add GeneReviews enrichment pipeline and archive artifact storage`
- Operational conclusion:
  - the GeneReviews engineering path was a real staged architecture progression, not just scattered experiments
  - the stages that land in git are:
    - chapter fetch
    - anchor extraction
    - candidate extraction
    - HPO mapping
    - metadata enrichment
    - policy-controlled manifest build
- Model-stack conclusion:
  - GLiNER was a comparison branch, not the main intended winner
  - Qwen was stronger than GLiNER on the saved `latest5` candidate-breadth run
  - MedGemma was explicitly positioned as an anchor-level metadata fallback candidate only, with validation guardrails, not as a raw whole-pipeline model
  - review-first policy remained the default architecture, with autoaccept restricted to explicit chapter-policy slices
- Interpretation:
  - the intended next serious GeneReviews branch was a controlled hybrid stack:
    - honest review-first policy
    - deterministic anchors
    - stronger LLM candidate branch
    - BioLORD mapping
    - deterministic metadata first
    - guarded MedGemma fallback
  - this is now reflected better in the runner and pipeline docs than in the earlier thread memory

## 2026-03-30 GeneReviews Run JSON Audit And Runner Correction
- Added:
  - [genereviews-engineering-progression-recovery-20260330.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genereviews-engineering-progression-recovery-20260330.md)
  - [genereviews-run-json-audit-20260330.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/full-audit-20260330/genereviews-run-json-audit-20260330.json)
- Corrected:
  - [genereviews-latest-engineering-pipeline-20260330.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genereviews-latest-engineering-pipeline-20260330.md)
  - [genereviewsPipelineProfiles.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/genereviewsPipelineProfiles.js)
  - [runGeneReviewsPipeline.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/runGeneReviewsPipeline.js)
- Recovered JSON-level conclusions:
  - recovered main `latest5` candidate branch:
    - `Gemini 2.5 Flash`
  - recovered main `hybrid latest10` candidate branch:
    - `Gemini 2.5 Flash`
  - recovered comparison branches:
    - `Qwen Max Latest`
    - `GLiNER`
  - recovered MedGemma role:
    - anchor-level metadata fallback experiment only
    - saved hybrid run blocked by paused endpoint
- Saved run-state read:
  - broad `200`-chapter raw run:
    - real but noisy
  - Gemini `pilot10`:
    - broad high-recall branch
  - Gemini anchor-first pilots:
    - more disciplined branch
  - `latest5` main:
    - review-only
    - duplicated summary counters from resume/rerun effects
  - `latest5 Qwen` and `latest5 GLiNER`:
    - candidate comparison branches
  - `hybrid latest10`:
    - main Gemini path real
    - PhenoTagger `404`
    - MedGemma paused
  - `autoaccept batch1-20`:
    - authoritative batch summary real at `679` manifest rows
    - stage-level summaries mixed with later rerun noise
- Runner alignment result:
  - added `latest5-gemini-20260330` as the main saved profile
  - kept `latest5-qwen-20260330` and `latest5-gliner-20260330` as comparison profiles
  - narrowed `hybrid-latest10-20260330` defaults to the successful saved Gemini path while keeping blocked PhenoTagger/MedGemma branches optional

## 2026-03-30 Final GeneReviews Architecture Decision
- Final working architecture:
  - Stage 1: fetch + clean prose cache with tables split out
  - Stage 2: deterministic anchors first, with PhenoTagger as the intended anchor-recall upgrade
  - Stage 3: Gemini candidate discovery for missed phenotypes
  - Stage 4: lexical + BioLORD HPO mapping
  - Stage 5: deterministic metadata first, MedGemma only as narrow anchor-level fallback
  - Stage 6: cleanup + policy-gated manifest/review split
- Why this survived:
  - Gemini `2.5 Flash` is the recovered main candidate model in saved `latest5` and `hybrid latest10`
  - Qwen and GLiNER survive only as comparison branches
  - broad raw extraction was too noisy
  - MedGemma survived only as metadata-fallback architecture, not main extraction
- Caveat kept explicit:
  - PhenoTagger and negation handling remain intended architecture components, but not fully validated successful saved branches yet

## 2026-03-30 Hybrid Latest10 Blocked Branch Clarification
- Saved artifact clarification:
  - the two blocked branches in `hybrid latest10` were:
    - `PhenoTagger`: `HTTP Error 404: Not Found`
    - `MedGemma`: endpoint paused / `BAD_REQUEST`
- Interpretation:
  - one failure was API route availability
  - the other was inference endpoint availability
  - they should be retried separately, not treated as one shared model failure

## 2026-03-30 Saved Python Error Surface Clarification
- Re-checked saved summaries for Python-backed stages:
  - `GLiNER`: no saved errors
  - `BioLORD` mapping in `latest5` and `hybrid latest10`: no saved errors
  - `PhenoTagger`: saved `404` failure
  - `autoaccept` mapped-candidate stage: missing-file bookkeeping noise, not a saved Python traceback
- Conclusion:
  - the recovered authoritative Python-side failure is `PhenoTagger`
  - any other Python traceback remembered from experimentation is not currently recovered from the saved March 29-30 bucket summaries

## 2026-03-30 Settled Architecture Wiring
- Corrected the GeneReviews settled architecture in code and docs:
  - early broad step:
    - `Gemini 2.5 Flash`
  - late narrow metadata step:
    - `Gemini 3 Pro Preview`
    - optional `MedGemma` comparison branch
- Implementation changes:
  - added explicit env-var key selection to:
    - `extractCandidatePhenotypes.js`
    - `extractPhenotypeMetadata.js`
  - updated the settled profile to default to:
    - `fetch`
    - `anchors`
    - `candidates-gemini-flash`
    - `map`
    - `metadata-gemini-preview`
    - `manifest-gemini-preview`
  - updated readiness reporting to use the actual live preview model name:
    - `gemini-3-pro-preview`
- Live checks:
  - `npm run gr:check`
    - Flash ready
    - preview ready
    - Qwen ready
    - PhenoTagger still `404`
    - MedGemma key present but base URL absent
  - `npm run gr:pipeline -- --profile latest5-settled-20260330 --dryRun`
    - confirmed the corrected stage order and key-routing args
  - Node `fetch` probe to `gemini-3-pro-preview`
    - returned `200`
    - valid JSON output
- Remaining blocker:
  - full settled run still blocked by missing working `DATABASE_URL` for the anchor stage

## 2026-03-30 MedGemma Endpoint Provisioning And Toggle
- Provisioned a new custom HF Inference Endpoint for the pipeline comparison branch:
  - `medgemma-27b-text-it-wgl`
  - `google/medgemma-27b-text-it`
  - `aws us-east-1`
  - `nvidia-a100 x1`
  - custom image: `vllm/vllm-openai:v0.16.0`
  - endpoint URL: `https://aro6p9a835d7pnd5.us-east-1.aws.endpoints.huggingface.cloud`
- Verified token/control surface with `huggingface_hub`:
  - token valid
  - `create_inference_endpoint`, `pause_inference_endpoint`, `resume_inference_endpoint`, and `list_inference_endpoints` all available
- Executed control cycle:
  - created endpoint -> `pending`
  - paused -> `paused`
  - resumed -> `pending`
  - paused again for cost safety -> `paused`
- Important state:
  - endpoint now exists and is controllable
  - it is not left running
  - base URL is known but not yet exported into default shell env

## 2026-03-30 Railway Env Lineage Correction
- Corrected the DB target for GeneReviews work:
  - `v1-enrich-0328` / `Postgres-Enrichment-Symmetry` is the right environment for enrichment/GeneReviews pipeline runs
  - `genovy-v1-working-20260322` / `Postgres` is the scorer baseline environment
- Verified both environments expose valid `DATABASE_URL` values through Railway.
- Operational consequence:
  - use `railway run -e v1-enrich-0328 -s Postgres-Enrichment-Symmetry -- ...` for GeneReviews pipeline execution

## 2026-03-30 Settled Latest5 Run Repaired
- Replaced the dead `PhenoTagger` API stage with a local official `PhenoTagger v1.2` runner:
  - new script:
    - `src/scripts/extractPhenotypeAnchorsPhenoTaggerLocal.py`
  - settled profile now uses:
    - `phenotagger-local`
  - readiness check now validates the local install instead of the dead NCBI endpoint
- Local desktop Railway DB access repaired:
  - env selection now prefers `DATABASE_PUBLIC_URL` when local runs receive a `*.railway.internal` host
  - SSL now turns on automatically for Railway proxy hosts
- BioLORD repaired for local execution:
  - new dedicated runtime:
    - `/Users/ahmedelmorshedy/.cache/biolord/.venv`
  - `mapCandidatesToHPO.js` now calls that interpreter
  - `mapCandidatesToHPOBioLORD.py` no longer uses `faiss`
  - nearest-neighbor mapping is now pure normalized `numpy` top-k cosine
  - cache writes are best-effort instead of fatal
- Preview metadata stage corrected:
  - `gemini-3-pro-preview` now runs with a real thinking budget
  - settled profile changed from `thinkingBudget: 0` to `thinkingBudget: 128`
- Disk-space intervention:
  - removed only the redundant upstream archive:
    - `~/.cache/phenotagger/PhenoTagger_v1.2.zip`
  - kept extracted runtime intact
- Settled latest5 execution result:
  - stage 1-5 completed successfully on the intended architecture:
    - fetch
    - local PhenoTagger supplement
    - DB-backed anchors
    - Gemini Flash candidates
    - BioLORD mapping
    - Gemini preview metadata
  - clean stage 4 response:
    - `stage4_mapped_candidates/biolord_response_py310_np.json`
  - clean stage 5 summary:
    - `stage5_enriched_gemini_preview/metadata_summary_clean.json`
    - `5` chapters processed
    - `0` errors
  - clean stage 6 summary:
    - `stage6_manifest_gemini_preview_clean/manifest_summary.json`
    - `5` chapters processed
    - `0` errors
    - `0` manifest rows
    - `5` review rows
- Operational read:
  - the settled architecture is now executable on the current machine
  - current outcome for the 5-chapter slice is fully review-first, not autoaccept
  - MedGemma comparison has not been run in this repaired path yet

## 2026-03-30 Launch-To-800 Plan Added
- Added:
  - `docs/genereviews-launch-to-800-plan-20260330.md`
- Decision:
  - stop rerunning the full pipeline for every open question
  - freeze repaired Stage 1-4 as the working base
  - compare only Stage 5 models on a fixed `20`-chapter slice
  - then validate a lightweight negation layer on the same slice
  - then run a `100`-chapter review-first pilot
  - then launch the full `800`
- This is now the controlling execution strategy for GeneReviews scale-out unless a real upstream stage bug reopens.

## 2026-03-30 MedGemma Narrow Comparison Completed
- User narrowed the comparison back down to the repaired settled `latest5` slice rather than a new `20`-chapter slice.
- Only the tricky stages were run:
  - Stage 5 metadata
  - Stage 6 manifest
- Upstream stages were intentionally reused unchanged:
  - fetch
  - local PhenoTagger
  - anchors
  - Gemini Flash candidates
  - BioLORD mapping
- Required code fix:
  - `src/lib/genereviewsPipeline.js`
  - OpenAI-compatible helper now routes root endpoint URLs to:
    - `/v1/chat/completions`
  - this was the exact cause of the earlier MedGemma `404`
- Required execution fix:
  - manifest must run through:
    - `railway run -e v1-enrich-0328 -s Postgres-Enrichment-Symmetry -- ...`
  - otherwise the cleanup stage falls back to localhost Postgres
- Clean MedGemma outputs produced:
  - `output/genereviews-pipeline-latest5-settled-20260330/stage5_enriched_medgemma_clean/metadata_summary.json`
  - `output/genereviews-pipeline-latest5-settled-20260330/stage6_manifest_medgemma_clean/manifest_summary.json`
- Comparison read vs Gemini preview clean outputs:
  - processed: `5 vs 5`
  - errors: `0 vs 0`
  - frequency coverage: `37 -> 40`
  - onset coverage: `4 -> 34`
  - cleaned Stage-6 features: `179 -> 179`
  - manifest rows: `0 vs 0`
  - review rows: `5 vs 5`
- Current decision read:
  - `Gemini Flash` remains the Stage-3 discovery branch
  - `MedGemma` now leads the Stage-5 metadata branch on the settled control slice
  - next unresolved blocker before `100` and then `800` is stable negation / excluded handling, not the metadata model

## 2026-03-30 Zellweger Source-Truth Spot Check
- Added a narrow manual chapter audit:
  - `docs/genereviews-zellweger-medgemma-spotcheck-20260330.md`
- Evidence surface:
  - chapter clinical text
  - MedGemma enriched output for the same chapter
- Result:
  - MedGemma was mostly accurate and clearly useful on this chapter
  - one clear questionable onset assignment was found:
    - `Pigmentary retinopathy -> neonatal`
  - so MedGemma is strong enough to lead Stage 5, but not honest to call perfect

## 2026-03-30 Latest5 MedGemma Full Source Audit
- Added:
  - `docs/genereviews-latest5-medgemma-source-audit-20260330.md`
- Scope:
  - all 5 source texts
  - all 5 MedGemma enriched outputs
- Main engineering read:
  - MedGemma remains the Stage-5 leader
  - but the residual errors split into:
    - prompt/model linkage errors
    - deterministic post-processing linkage errors
- Highest-signal prompt issues:
  - over-attaching onset from a shared sentence to neighboring phenotypes
  - allowing non-treatment prognosis/fertility compatibility into `treatment_response`
- Highest-signal post-processing issue:
  - deterministic frequency/onset extraction currently drops evidence fields and can over-attach onset in multi-clause sentences

## 2026-03-30 Architecture Note Review
- Reviewed an external architecture note covering:
  - constrained decoding
  - evidence spans
  - two-pass verification
- Decision:
  - keep evidence-backed extraction as-is
  - do not treat constrained decoding as the immediate priority
  - do not add global two-pass verification now
- Correction to the note:
  - structured/guided output support should not be described as impossible on custom hosted stacks in general
  - the better read is:
    - it may be available depending on serving stack
    - but it is not the main blocker for this pipeline today

## 2026-03-30 Quality Fixes Shipped
- Implemented the pending quality work instead of leaving it as design notes:
  - explicit negation / excluded handling in anchor extraction
  - deterministic onset-linkage guard
  - deterministic evidence preservation
  - excluded-row skip during metadata fallback
  - MedGemma prompt tightening on onset and treatment-response scope
  - status-aware cleanup so present/excluded rows are not merged away
- Validation:
  - all touched JS files passed `node --check`
  - direct helper validation showed:
    - `no spasticity -> excluded`
    - `brain infarcts -> congenital onset` blocked
  - direct MedGemma probes showed the tightened prompt now returns `null` for the previously bad overreach cases
- Added implementation record:
  - `docs/genereviews-quality-fixes-implementation-20260330.md`
- Operational status:
  - MedGemma endpoint paused again after validation
  - next execution step is a fixed `latest5` rerun, not a broad architecture change

## 2026-03-30 Tightened Latest5 Validation
- Completed the full fixed `latest5` rerun after the quality-fix patch set.
- Output family:
  - `output/genereviews-pipeline-latest5-tightened-20260330`
- Important operational note:
  - `Stage 4` was initially slow because the fresh output folder started with an empty BioLORD cache
  - seeded the tightened run with the matching settled-run BioLORD cache to avoid re-embedding the full phenotype catalog
- Final execution result:
  - `Stage 5`: `5/5` processed, `0` errors
  - `Stage 6`: `5/5` processed, `0` errors
- Quality outcome against the earlier settled MedGemma control slice:
  - fixed:
    - `Oligozoospermia -> treatment_response`
    - `Cerebral infarct -> congenital onset`
    - `Pigmentary retinopathy -> neonatal`
    - `Cerebral visual impairment -> childhood onset`
  - residual:
    - `ZTTK Visual impairment -> childhood`
- Manifest behavior:
  - remained fully review-first
  - `manifest_rows = 0`
  - `review_rows = 5`
  - no unsafe promotion drift was introduced
- Decision:
  - good enough to proceed to a `100`-chapter `review-first` pilot
  - not good enough to call the metadata layer publish-safe without review
- Added durable record:
  - `docs/genereviews-latest5-tightened-validation-20260330.md`

## 2026-03-30 Audit Method Decision For 100-Chapter Pilot
- Do not treat the next audit as a uniform chapter-by-chapter reread.
- Efficient audit shape:
  - risk-bucket review
  - metadata-bearing row review
  - anomaly-triggered review
  - small random clean-sample review
- Highest-priority buckets:
  - onset over-attachment
  - treatment-response misuse
  - excluded/present status mistakes
  - medium-trust semantic mappings in broad phenotype families
- Reason:
  - this yields higher error discovery per minute than reading every row evenly
  - it matches the actual residual failure modes from the tightened `latest5` validation

## 2026-03-31 Auto-Accept Gate Direction
- User asked for a no-human path that is still publication-safe.
- Agreed direction:
  - LLMs may still draft rows
  - but auto-accept itself should be deterministic
  - no second unconstrained LLM judge at publish time
- Required shape:
  - frozen extraction outputs
  - exact provenance per row
  - deterministic verifier over evidence spans / clause-local metadata support
- Rule:
  - auto-accept only rows that can be positively proved by deterministic checks
  - drop ambiguous rows rather than trying to auto-approve them

## 2026-03-31 Old Stage-3 Script Interpretation
- Reviewed an older standalone candidate-discovery script using MedGemma.
- Conclusion:
  - good for understanding the broad discovery concept
  - not the final pipeline shape
- Why:
  - it uses MedGemma in the broad-discovery role
  - prompt explicitly asks for implied features
  - output lacks exact evidence spans / deterministic-proof hooks
  - anchor dedupe is only substring-based
- Canonical architecture remains:
  - Stage 3: `Gemini Flash`
  - Stage 5: `MedGemma`

## 2026-03-31 Old Stage-5 Script Interpretation
- Reviewed an older standalone MedGemma metadata script.
- Core assessment:
  - the pipeline shape is directionally right
  - the implementation is not safe enough for the current publication-oriented path
- Why it is unsafe as-is:
  - deterministic metadata extraction is not phenotype-local
  - no evidence-bearing output contract
  - no deterministic proof gate on LLM-filled metadata
  - broad paragraph context encourages metadata attachment drift
  - excluded rows are not explicitly screened out before fallback
- Result:
  - treat it as a useful prototype pattern, not the final Stage-5 implementation

## 2026-03-31 Pre-100 Verifier / Audit Direction
- Before the `100`-chapter run, the correct mental model is:
  - extraction may stay probabilistic
  - publishability must become deterministic
- Highest-probability error surfaces:
  - onset attachment drift in shared sentences
  - disease-subtype onset leakage
  - parent/alias overreach
  - treatment-response misuse
  - excluded/present mistakes
- Engineering direction:
  - add deterministic field-level proof contracts
  - keep exact provenance on every metadata field
  - add alias-shadow and disease-subtype blockers
  - preserve a frozen challenge set from the latest5 known failure sentences
- Audit direction:
  - not uniform row reading
  - deterministic verifier over frozen outputs
  - mandatory audit buckets:
    - all onset/progression/treatment rows
    - all excluded rows
    - all medium-trust mapping rows
    - all alias-shadow/shared-sentence flagged rows
  - plus a small random clean sample

## 2026-03-31 Review Of Proposed 7-Layer Validation Stack
- Overall judgment:
  - strong proposal
  - but some layers belong in the curation gate and some should remain diagnostics only
- Keep in the deterministic publish path:
  - row-level provenance
  - cross-source concordance
  - deterministic table parsing
  - dependency-based modifier attachment
  - benchmark regression after batch apply
- Keep as soft warnings / audit prioritizers:
  - section-to-HPO branch mismatch
  - expected phenotype-count outliers
- Do not use as curation accept/reject:
  - symmetric impact scoring
- Reason:
  - impact scoring mixes truth curation with benchmark optimization and creates overfitting pressure

## 2026-03-31 Pre-100 Scope Correction
- Corrected the pre-`100` gating plan:
  - benchmark regression should not block the first `100`-chapter curation pilot
  - use it later for integration safety, not row-level or pilot-level truth validation
- Also corrected table-role framing:
  - table parsing is valuable
  - but table absence cannot be treated as a negative oracle because the goal includes recovering prose-only novel assertions
- Best immediate engineering targets remain:
  - provenance/evidence precision
  - modifier attachment robustness
  - deterministic table extraction

## 2026-03-31 Char-Offset Verifier Direction
- Reviewed the proposal to store char offsets, section ids, and sentence boundaries for every extracted row.
- Judgment:
  - strong and practical
  - likely the best deterministic verifier substrate discussed so far
- What becomes deterministic with this design:
  - exact mention existence
  - frequency regex verification
  - onset keyword verification
  - alias-shadow range overlap
  - clause-local attachment heuristics
  - section-aware checks
- What still remains partially semantic:
  - implicit phenotype interpretation
  - complex progression/treatment attachment in dense multi-phenotype prose
- Practical implication:
  - this is a good candidate for the permanent publish gate architecture
  - ambiguous rows should still fail closed rather than auto-accept

## 2026-03-31 Deterministic Verifier First Implementation
- Added a first real verifier instead of keeping the idea at the whiteboard level:
  - `src/lib/genereviewsVerification.js`
  - `src/scripts/verifyGeneReviewsEnrichment.js`
  - `gr:verify`
- Current verifier works on frozen enriched outputs and cached chapter text only.
- It does not change ingestion behavior.
- Pilot run on tightened `latest5`:
  - total rows: `258`
  - verified: `121`
  - flagged: `116`
  - failed: `21`
- Best signal:
  - residual `ZTTK Visual impairment -> childhood` style issue is correctly surfaced as alias-shadow contamination
  - corresponding `Cerebral visual impairment` row remains verified
- Current boundary:
  - useful audit engine now
  - not yet the final publish gate because spans/offsets are still missing

## 2026-03-31 Provenance/Offset Plumbing Through Stage 1-5
- Implemented the next engineering layer after the verifier pilot:
  - sentence/paragraph ids and char offsets now flow through the GeneReviews pipeline
- Core helper changes in `src/lib/genereviewsPipeline.js`:
  - `splitSentenceEntries`
  - `splitParagraphEntries`
  - `buildClinicalTextStructure`
  - `findBestSentenceEntryForPhrase`
  - upgraded anchor/context helpers to return offsets
- Stage changes:
  - `fetchGeneReviewsChapters.js`
    - writes `*_clinical_structure.json`
  - `extractPhenotypeAnchors.js`
    - reads structure when available and emits occurrence offsets
  - both candidate scripts preserve context offsets
  - stage4 mapping preserves candidate offsets
  - stage5 enriched rows preserve the same provenance
- Proof run:
  - executed a one-chapter latest5 slice into:
    - `output/genereviews-pipeline-provenance-proof-20260331`
  - verified real output rows now carry:
    - `paragraph_id`
    - `sentence_id`
    - `paragraph_char_start/end`
    - `sentence_char_start/end`
    - `match_char_start/end`
- Operational note:
  - BioLORD again needed a warm cache
  - reused the settled latest5 cache to avoid a cold rebuild
- Current boundary after this step:
  - sentence/match provenance is now real and no longer just a design idea
  - field-level evidence spans and table parsing are still the next engineering tasks before a serious deterministic auto-accept gate

## 2026-03-31 Verifier Switched To Span-Backed Proof
- Upgraded `src/lib/genereviewsVerification.js` so the verifier now prefers:
  - `sentence_char_start/end`
  - `match_char_start/end`
  over loose stored sentence text when available
- Added a new `source_span` check and span-backed phenotype presence validation.
- Ran a one-chapter proof verifier pass on the provenance-bearing output tree:
  - `output/genereviews-pipeline-provenance-proof-20260331/stage7_verify`
- Immediate verifier bug found and fixed:
  - alias-shadow heuristic over-flagged `Azoospermia`
  - tightened prefix handling and reran into:
    - `output/genereviews-pipeline-provenance-proof-20260331/stage7_verify_refined`
- Refined one-chapter totals:
  - verified: `2`
  - flagged: `3`
  - failed: `2`
- Practical meaning:
  - verifier is now anchored to real offsets
  - next gains will come from field-level spans and table parsing, not from re-arguing sentence provenance

## 2026-03-31 Frequency/Onset Field Spans Wired
- Added deterministic field-level spans for the two metadata fields we can currently prove well:
  - `frequency_char_start/end`
  - `onset_char_start/end`
- Pipeline changes:
  - `extractScopedFrequency` and `extractScopedOnset` now accept `baseOffset`
  - stage5 now records deterministic metadata spans when extracted from the source sentence
  - LLM-filled metadata intentionally leaves those span fields null
- Verifier changes:
  - `frequency_support` now passes directly on exact frequency span text when present
  - `onset_support` now passes directly on exact onset span text when present
- Proof run on a real metadata-bearing chapter:
  - `output/genereviews-pipeline-provenance-proof-zellweger-20260331`
- Concrete proof rows:
  - `Decreased liver function`
    - onset verified at span `neonatal`
  - `Seizure`
    - frequency verified at span `frequent`
- Current next gap is now narrower:
  - progression/treatment spans
  - table parsing
  - then a stronger auto-accept contract

## 2026-03-31 Hard Auto-Accept Contract Proved Narrowly
- Implemented the next deterministic gate layer:
  - progression/treatment field spans
  - table-aware verifier checks
  - verifier-computed `auto_accept_eligible`
  - Stage 6 manifest routing that depends on verifier output
- Evidence surface used:
  - narrow synthetic proof slices only
  - no 100-chapter run
  - no live DB ingestion
- Key proof artifacts:
  - treatment-response proof:
    - `output/genereviews-pipeline-progress-treatment-proof-20260331/zap70_minimal`
  - progression proof:
    - `output/genereviews-pipeline-progress-treatment-proof-20260331-zttk/minimal`
  - contract note:
    - `docs/genereviews-hard-autoaccept-contract-20260331.md`
- Concrete outcomes:
  - `Azoospermia` now verifies with table support and is auto-accept eligible in the Y proof slice
  - ZAP70 treatment-response rows now carry exact spans for:
    - `treatment-refractory`
    - `resistant to therapy`
  - ZTTK progression rows now carry exact spans for:
    - `worsened over time`
  - one-row positive Stage 6 proof successfully emitted a manifest row when verifier eligibility was true
  - mixed ZTTK proof routed the surviving ineligible row to review when onset proof failed
- Practical current boundary:
  - the deterministic publish gate now exists and is executable
  - it is still conservative
  - alias-shadow ambiguity and cross-sentence onset ambiguity remain review-biased rather than publish-biased

## 2026-03-31 Alias-Shadow Refinement Re-Proved
- Follow-up tightening after the hard-contract proof:
  - refined alias-shadow to ignore subject/context wrappers and metadata-like modifiers instead of treating them as stronger phenotype phrases
- Narrow re-proof on:
  - `output/genereviews-pipeline-progress-treatment-proof-20260331/zap70_minimal/stage7_verify_v3`
- Outcome:
  - `Autoimmune thrombocytopenia` moved to:
    - `VERIFIED`
    - `auto_accept_eligible = true`
  - `Eczematoid dermatitis` moved to:
    - `VERIFIED`
    - `auto_accept_eligible = true`
  - generic `Thrombocytopenia` remained review-biased, which is correct because it still sits inside the more specific phrase `immune thrombocytopenia`
- Additional implementation landed:
  - evidence-backed metadata now has code to promote stronger evidence sentences and compute spans for evidence-backed onset/frequency too
- Current proof boundary:
  - alias-shadow refinement is re-proven
  - evidence-sentence promotion is implemented but not freshly re-proven yet because the MedGemma endpoint never reached a usable ready state during the final cold-start attempt
  - endpoint was paused again at the end

## 2026-03-31 MedGemma Ready-Replica Probe
- Ran a direct serving check to separate infrastructure readiness from pipeline behavior.
- Probe details:
  - resumed HF endpoint `medgemma-27b-text-it-wgl`
  - polled endpoint state through the HF control API
  - issued an authenticated direct request to:
    - `https://aro6p9a835d7pnd5.us-east-1.aws.endpoints.huggingface.cloud/v1/chat/completions`
- Result:
  - endpoint never moved past `initializing`
  - `readyReplica` stayed at `0`
  - direct authenticated inference returned `503 Service Unavailable`
- Operational conclusion:
  - current MedGemma failure mode is HF serving readiness
  - it is not currently attributable to the Genovy Stage 5 request path
  - endpoint was paused again after the probe

## 2026-03-31 Replacement MedGemma Endpoint Confirmed
- A second HF MedGemma endpoint was provided and tested directly:
  - `https://z2m4kqae0vudzx4y.us-east-1.aws.endpoints.huggingface.cloud`
- Direct authenticated checks:
  - `/health` => `200`
  - `/v1/chat/completions` => `200`
  - model returned the expected minimal response on a one-line probe
- Current practical decision:
  - use the new endpoint URL as the active MedGemma base for the next narrow proof rerun
  - do not rely on the earlier `aro6...` endpoint until its replica readiness issue is resolved

## 2026-03-31 Replacement MedGemma Pause Path Confirmed
- Managed endpoint name:
  - `medgemma-27b-text-it-hgw`
- Tested control action:
  - `pause`
- Outcome:
  - HF control API reported `state = paused`
  - direct authenticated OpenAI-compatible probe returned the expected paused-endpoint error:
    - `Bad Request: The endpoint is paused, ask a maintainer to restart it`
- Operational meaning:
  - the replacement endpoint supports both inference and pause control from the current token/session

## 2026-03-31 Replacement Endpoint Cold-Resume Failure
- Follow-up test on the replacement endpoint:
  - resumed `medgemma-27b-text-it-hgw`
  - polled state through the HF control API
  - probed direct authenticated inference again
- Outcome:
  - control plane remained in `initializing`
  - `readyReplica = 0`
  - direct inference returned `503 Service Unavailable`
- Current read:
  - the replacement endpoint was usable while already warm/running
  - its cold resume path is currently unreliable
  - this blocks using it as a dependable on-demand MedGemma worker until the HF serving behavior stabilizes

## 2026-03-31 Replica Log Reclassified the Failure Mode
- Inspected replica log:
  - `/Users/ahmedelmorshedy/Downloads/medgemma-27b-text-it-hgw_replica_h1nob8tj-82wrx_full_log.txt`
- Important result:
  - the replica did not crash
  - it fully loaded the model, completed warmup, exposed `/health`, and later served a successful `/v1/chat/completions` request
- Observed timeline:
  - model load + warmup took roughly 2 minutes
  - first confirmed successful chat request arrived a little over 4 minutes after process start
- Revised conclusion:
  - the issue is not a deterministic startup failure
  - it is a slow cold-start path plus readiness/control-plane lag
  - our automation should wait longer and verify actual endpoint readiness before declaring the endpoint unusable

## 2026-03-31 MedGemma Execution Layer Tightened
- Implemented two operational fixes instead of changing model behavior:
  - prewarm MedGemma before Stage 5
  - batch MedGemma metadata requests during Stage 5
- File changes:
  - `src/scripts/extractPhenotypeMetadata.js`
  - `src/scripts/runGeneReviewsPipeline.js`
- New behavior:
  - pipeline runner resumes HF endpoint `medgemma-27b-text-it-hgw` ahead of `metadata-medgemma`
  - Stage 5 waits for actual MedGemma readiness using:
    - `/health`
    - then a tiny authenticated chat probe
  - MedGemma fallback now processes ordered batches instead of strictly one phenotype per request
- Validation:
  - both edited scripts pass `node --check`
  - `runGeneReviewsPipeline --dryRun` shows the prewarm call before MedGemma Stage 5
- Immediate next queued work remains:
  - rerun tiny ZTTK/ZAP70 proof slices on the live endpoint
  - if clean, freeze the active MedGemma config to the new URL
  - then start dual Stage 6 outputs

## 2026-03-31 MedGemma Tiny Re-Proofs Closed the Loop
- Replacement endpoint used for the proof reruns:
  - `https://z2m4kqae0vudzx4y.us-east-1.aws.endpoints.huggingface.cloud`
- ZTTK:
  - `Dystonia` now uses the stronger evidence sentence itself
  - onset + progression spans verify from that promoted sentence
  - residual routing is conservative `alias_shadow`, not evidence loss
- ZAP70:
  - verified treatment-response rows remained stable after batching/warmup changes:
    - `Autoimmune thrombocytopenia`
    - `Eczematoid dermatitis`
  - generic `Thrombocytopenia` still fails closed on alias-shadow as intended
- Updated practical read:
  - Stage 5 MedGemma path is operational again
  - the new execution fixes did not regress the narrow proof slices

## 2026-03-31 Active MedGemma Base Frozen
- The active MedGemma base URL is now frozen into the settled pipeline defaults:
  - `https://z2m4kqae0vudzx4y.us-east-1.aws.endpoints.huggingface.cloud`
- Files updated for the freeze:
  - `src/scripts/extractPhenotypeMetadata.js`
  - `src/lib/genereviewsPipelineProfiles.js`
- The prewarm control target remains:
  - `medgemma-27b-text-it-hgw`
- After the proof run, the endpoint was paused again to avoid idle A100 cost.

## 2026-03-31 Dual Stage 6 Outputs Implemented Structurally
- Started the post-MedGemma engineering track:
  - keep conservative ingestion outputs
  - add API/export outputs in the same Stage 6 pass
- New module:
  - `src/lib/genereviewsApiExports.js`
- Manifest builder updates:
  - `src/scripts/buildEnrichmentManifest.js` now emits:
    - chapter JSON exports
    - aggregate assertion JSON
    - aggregate assertion JSONL
    - chapter index JSON
- Export content includes:
  - self-contained assertion rows with:
    - disease context
    - phenotype context
    - nested metadata blocks
    - provenance
    - validation summary
- Validation:
  - syntax checks passed
  - standalone helper smoke test produced the intended nested export shape
- Current boundary:
  - the dual-output layer is implemented
  - it still needs a real Stage 6 rerun to populate fresh export artifacts from real chapter outputs

## 2026-03-31 Dual Stage 6 Outputs Proven On Real Latest5 Data
- Completed the pending real Stage 6 rerun against:
  - input:
    - `output/genereviews-pipeline-latest5-settled-20260330/stage5_enriched_medgemma_clean`
  - verification:
    - `output/genereviews-pipeline-latest5-settled-20260330/stage7_verify_medgemma_clean_20260331`
  - output:
    - `output/genereviews-pipeline-latest5-settled-20260330/stage6_manifest_medgemma_dual_20260331`
- Stage 6 result stayed conservative:
  - `0` manifest rows
  - `5` review rows
  - `0` processing errors
- New API/export artifacts are now real, not just structural:
  - `api_exports/genereviews_api_assertions.json`
  - `api_exports/genereviews_api_assertions.jsonl`
  - `api_exports/genereviews_api_chapters.json`
  - per-chapter export files
- Actual export coverage on the latest5 rerun:
  - `179` total assertions
  - `179` rows with `source_sentence`
  - `25` rows with `frequency.raw`
  - `26` rows with `onset.raw`
  - `2` rows with `progression.raw`
  - `3` rows with `treatment_response.raw`
  - `20` rows with `table_concordance = pass`
  - `122` rows with `verification_verdict = VERIFIED`
- Important limitation:
  - this specific export still has empty positional provenance (`nbk_id`, section ids, sentence ids, char offsets, etc.) because the settled `stage5_enriched_medgemma_clean` inputs predate the newer end-to-end provenance plumbing
  - the dual-output writer is correct; a later fresh settled rerun is what will populate those newer provenance fields into API exports

## 2026-03-31 Stage 6 Local Snapshot Path Added
- Wired the manifest/export stage so it no longer needs Railway by default on future runs.
- Manifest builder changes:
  - `src/scripts/buildEnrichmentManifest.js` now supports local `phenotype_rows` and `ontology_rows` snapshots via `--phenotypesJson` and `--ontologyJson`
- Stage 2 changes:
  - `src/scripts/extractPhenotypeAnchors.js` now writes:
    - `phenotype_rows_snapshot.json`
    - `ontology_rows_snapshot.json`
- Profile changes:
  - `src/lib/genereviewsPipelineProfiles.js` now passes those snapshot files into every manifest stage by default
- Proof:
  - dry run of `latest5-settled-20260330` `manifest-medgemma` now emits a local `node src/scripts/buildEnrichmentManifest.js ... --phenotypesJson ... --ontologyJson ...` command with no Railway wrapper
- Remaining practical caveat:
  - existing older settled output directories still need a fresh Stage 2 run to materialize the new ontology snapshot file before those exact artifacts can use the local Stage 6 path end to end

## 2026-03-31 Downstream Chapter Metadata Propagation Fixed
- Fixed a separate audit/export issue: blank policy `nbkId` values were still overwriting real chapter identity downstream.
- Touched:
  - `src/scripts/extractCandidatePhenotypes.js`
  - `src/scripts/extractCandidatePhenotypesOpenAiCompat.js`
  - `src/scripts/mapCandidatesToHPO.js`
  - `src/scripts/extractPhenotypeMetadata.js`
  - `src/scripts/verifyGeneReviewsEnrichment.js`
  - `src/scripts/buildEnrichmentManifest.js`
- New rule:
  - downstream stages now prefer `nbk_id` / `chapter_title` from upstream stage payloads over the raw policy chapter object
- Validation:
  - `node --check` passed on all touched files
- Why it matters:
  - this is an audit-track fix first
  - it prevents future settled reruns from losing source chapter identity in verification and API export artifacts just because the chapter policy row has blank `nbkId`
- Still pending:
  - real section-heading extraction/propagation
  - fresh rerun on the patched settled path so these improved metadata fields show up in actual artifacts

## 2026-03-31 Latest5 API Export Regenerated On Audit-Ready Artifacts
- Finished the missing audit rerun on the settled latest5 slice without using Railway:
  - Stage 1 rebuilt from saved `*_raw.html` via `--reuseRaw`
  - Stage 2 reran locally with phenotype snapshot reuse and an empty local ontology snapshot fallback when DB was unavailable
  - Stage 3 and Stage 4 reran on the rebuilt provenance path
  - Stage 7 verifier reran on the regenerated Stage 5 set
  - Stage 6 reran locally against verification output plus local snapshots
- Manifest/export bug fixed:
  - `src/scripts/buildEnrichmentManifest.js` no longer drops every feature when `ic_score` is missing in the local phenotype snapshot; the IC filter now applies only when a real score exists
- API export polish:
  - `src/lib/genereviewsApiExports.js` now strips the `- GeneReviews® - NCBI Bookshelf` suffix from public chapter titles
  - chapter export now includes `chapter_key`
- Current latest5 API export state:
  - file: `output/genereviews-pipeline-latest5-settled-20260330/stage6_manifest_medgemma/api_exports/genereviews_api_assertions.json`
  - `244` assertion rows
  - `244/244` with `nbk_id`
  - `193/244` with `section_heading`
  - `193/244` with `section_id`
  - `193/244` with paragraph/sentence ids
  - `179/244` with match offsets
  - `123/244` marked `auto_accept_eligible`
- Clean manifest summary after resetting stale progress bookkeeping:
  - `output/genereviews-pipeline-latest5-settled-20260330/stage6_manifest_medgemma/manifest_summary.json`
  - `5` processed
  - `0` errors
  - `0` manifest rows
  - `5` review rows
- Remaining API-only gaps:
  - `gene_symbols` are still empty on this latest5 export because the current chapter policy surface does not carry gene metadata
  - `cross_source_concordance` is still a placeholder array
  - `section_branch_consistent` remains null because the verifier does not yet implement section-to-HPO branch checking
- Human-review outputs are now first-class audit artifacts:
  - `stage7_verify_medgemma/review_pages/*_review.html` provides a local clickable chapter review page with assertion sidebar and sentence/span highlighting
  - `*_verification.json` rows now include `human_review.review_href`
  - `stage6_manifest_medgemma/genereviews_review_queue.json` now includes:
    - `review_page_path`
    - compact `review_items` with direct local links, exact sentence text, span texts, and failed/flagged checks

## 2026-03-31 Latest5 API Fields Tightened Again
- Follow-up implementation finished for three previously open fields:
  - `gene_symbols`
  - `cross_source_concordance`
  - `section_branch_consistent`
- Local latest5 reruns completed successfully:
  - `stage7_verify_medgemma`
  - `stage6_manifest_medgemma`
- Verified current export state:
  - `genereviews_api_assertions.json`
    - `244` rows
    - `244/244` with `gene_symbols`
    - `0/244` with populated `cross_source_concordance`
    - `244/244` with `section_branch_consistent = null`
  - chapter gene exports now resolve from cached GeneReviews raw HTML:
    - `Y_Chromosome_Infertility -> [DDX3Y, USP9Y]`
    - `YIF1B -> [YIF1B]`
    - `ZAP70 -> [ZAP70]`
    - `Zellweger -> [PEX13, PEX14, PEX16, PEX1, PEX10, PEX11B, PEX12, PEX19, PEX2, PEX26, PEX3, PEX5, PEX6]`
    - `ZTTK -> [SON]`
- Boundary is now explicit rather than implicit:
  - the repository is running in `website_only` mode here (`SERVICE_FLAGS.hasDatabase = false`)
  - the local latest5 ontology snapshot is empty
  - therefore concordance and branch-consistency cannot be truthfully populated from this machine today
- Net result:
  - API gene context is now materially better
  - concordance and section-branch support are coded and ready
  - but they still need a real database/ontology surface before they can emit non-empty values

## 2026-03-31 Concordance Became Real, Section Branch Still Blocked By Heading Granularity
- Ran the narrow latest5 trust rerun against Railway-backed DB env.
- Trust-side outcome:
  - `stage2_anchors/ontology_rows_snapshot.json` now contains `23,677` ontology rows instead of `0`
  - Stage 6 API export now has real `validation.cross_source_concordance` on `41/180` rows
- Example concordance now present in exported assertions:
  - `Absent gallbladder` for `ZTTK syndrome`
  - concordant with:
    - `HPO Disease Phenotype Annotations`
    - `Orphadata HOOM`
    - `Orphadata Phenotypes`
- Section-branch status did **not** become real yet:
  - verifier check `section_branch_consistency` still reports `skip` on all `253` verified features
  - exported `validation.section_branch_consistent` remains `null` on all `180` assertion rows
- Root cause identified:
  - stored section headings are currently too coarse/generic (`Clinical Description`, `Suggestive Findings`, `Table 2.`)
  - the branch rule engine needs specialty subheadings like `Neurologic`, `Ophthalmologic`, `Cardiac`, etc.
  - therefore the remaining work is upstream section-subheading extraction/propagation, not more ontology loading

## 2026-03-31 Chapter Domains Now Exported
- Added a coarse chapter-level clinical-system layer to the exports:
  - `chapter_domains`
  - `heading_inventory`
- Latest5 refresh completed:
  - Stage 1 rebuilt from cached raw HTML
  - Stage 6 rerun with the same DB-backed trust wiring
- Result:
  - chapter exports now expose a useful broad profile even when local subsection headings are generic
  - this gives immediate product value without pretending `section_branch_consistent` is stronger than it is
- Current examples from `api_exports/chapters/*_chapter.json`:
  - `Y_Chromosome_Infertility -> Renal / Genitourinary`
  - `ZAP70 -> Neurologic; Hematologic / Immunologic`
  - `Zellweger -> Neurologic; Ophthalmologic; Auditory; Gastrointestinal; Renal / Genitourinary; Craniofacial`
  - `ZTTK -> Neurologic; Ophthalmologic; Auditory; Cardiovascular; Gastrointestinal; Renal / Genitourinary; Musculoskeletal; Craniofacial`

## 2026-03-31 Local Clinical Domains Flow Through Audit And API
- Implemented `local_clinical_domains` as a paragraph/block-level soft context layer and propagated it into:
  - verifier review payloads
  - review queue items
  - API assertion exports
- Latest5 current counts:
  - `180` API assertion rows
  - `98/180` with non-empty `local_clinical_domains`
- Example current row state:
  - `Azoospermia` in `Y Chromosome Infertility` now carries local domain `Renal / Genitourinary`
- Practical meaning:
  - the system now has both:
    - coarse `chapter_domains`
    - more granular `local_clinical_domains`
  - this is useful for audit and product grouping even though it is still intentionally soft and incomplete

## 2026-03-31 100-Run Consultant Brief Added
- Added:
  - `docs/genereviews-100-run-readiness-consult-20260331.md`
- This is the current structured handoff document to ask an external consultant whether the pipeline is ready for a `100`-chapter `review-first` run.
- It explicitly separates:
  - `100 review-first readiness`
  - `broad autoaccept readiness`
  - `final ingestion/publish readiness`

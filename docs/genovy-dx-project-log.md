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
## 2026-03-31 - 50 chapter review-first run prep

- Created profile `review-first-50-20260331` in `src/lib/genereviewsPipelineProfiles.js`.
- Purpose: meaningful-scale operational run before the consultant-approved 100 review-first batch.
- Uses settled stack with MedGemma metadata and explicit verify + manifest stages.
- Added runbook `docs/genereviews-review-first-50-run-plan-20260331.md`.
- Verified `node src/scripts/runGeneReviewsPipeline.js --profile review-first-50-20260331 --dryRun`.
- Updated `src/scripts/checkGeneReviewsModelReadiness.js` so readiness reflects the pinned MedGemma endpoint.
- No batch execution yet.

## 2026-04-01 - USP7 live-failure hardening and narrow proof

- After the live 50-run was stopped on the first Stage 5 chapter, implemented a targeted hardening pass instead of resuming the large batch.
- Patched deterministic frequency extraction in `src/lib/genereviewsPipeline.js` so percentage ranges are preserved:
  - example fixed class: `53%-65%` no longer collapses to `53%`
- Added richer frequency metadata fields:
  - `frequency_value_min`
  - `frequency_value_max`
  - `frequency_value_type`
- Tightened Stage 5 evidence attachment in `src/scripts/extractPhenotypeMetadata.js`:
  - no evidence-backed metadata without complete provenance
  - onset requires phenotype-local evidence plus same-clause attachment
  - progression and treatment response require phenotype-local evidence instead of paragraph-level borrowing
  - extra MedGemma context sentences now must still contain the phenotype phrase
- Fixed upstream supplement-anchor provenance hydration in `src/scripts/extractPhenotypeAnchors.js`:
  - PhenoTagger supplement rows now recover sentence/paragraph ids and match offsets from the structured chapter text before anchor merge
- Verified the provenance hydration fix by rebuilding USP7 anchors to:
  - `output/genereviews-pipeline-review-first-50-20260331/stage2_anchors_patchcheck/USP7_Related_Hao_Fountain_Syndrome_anchors.json`
  - `Abnormality of the eye` and `Abnormality of vision` now have:
    - `paragraph_id = p51`
    - `sentence_id = p51_s2`
    - real `match_char_start/end`
- Ran a narrow MedGemma proof only on the five real USP7 failure rows:
  - proof root:
    - `output/genereviews-pipeline-review-first-50-20260331/usp7_failure_probe`
  - output:
    - `output/genereviews-pipeline-review-first-50-20260331/usp7_failure_probe/metadata/USP7_Related_Hao_Fountain_Syndrome_enriched.json`
- Narrow proof outcome:
  - `Abnormality of the eye` -> frequency preserved as `53%-65%`
  - `Abnormality of vision` -> frequency preserved as `53%-65%`
  - `Hyperbilirubinemia` -> `onset_raw = null` (no more neonatal borrowing)
  - `Scoliosis` -> `progression_raw = null`
  - `Kyphosis` -> `progression_raw = null`
- MedGemma endpoint `medgemma-27b-text-it-hgw` was resumed for the proof, used, then paused again successfully.
- Resulting project state:
  - the exact first-live USP7 metadata failure classes are now covered by code plus a narrow end-to-end proof
  - the next safe validation step is no longer another 50-chapter run
  - it is a patched USP7 rerun or a 3-5 chapter micro-batch on the new path

## 2026-04-01 - Upstream hardening after emitted-output audit

- Performed a real emitted-output audit on the stopped `review-first-50` run rather than waiting for a back review.
- Confirmed two upstream issues:
  - Stage 1 truncation on `WFS1 Spectrum Disorder`
  - Stage 3 candidate pollution from headings, table chrome, treatment-response statements, and disease-course statements

### Stage 1 parsing fix
- Patched `src/lib/genereviewsPipeline.js`:
  - replaced naive section end detection with balanced `<div>` extraction
  - broadened marker matching to nested ids:
    - `Clinical_Description__...`
    - `Suggestive_Findings__...`
  - stopped injecting table-only prose into `clinical_text`; tables still go to `tables.json`
- Narrow proof:
  - rebuilt WFS1 from cached raw HTML into:
    - `output/genereviews-pipeline-review-first-50-20260331/stage1_fetch_patchcheck2`
  - result:
    - no longer truncated to a 24-character chapter
    - `paragraph_count = 32`
    - `sentence_count = 57`
    - `View in own window` removed from `clinical_text`

### Stage 3 candidate filter
- Added deterministic post-filtering in:
  - `src/scripts/extractCandidatePhenotypes.js`
  - `src/scripts/extractCandidatePhenotypesOpenAiCompat.js`
  - shared helper in `src/lib/genereviewsPipeline.js`
- Candidate files now preserve both:
  - accepted candidates
  - rejected candidates with explicit reasons
- New rejection classes:
  - `heading_or_chrome`
  - `context_chrome`
  - `table_context`
  - `treatment_response_statement`
  - `disease_course_statement`
  - `onset_statement`
  - `negated_course_statement`

### Narrow replay proof from saved raw Stage 3 outputs
- Wrote replay artifacts to:
  - `output/genereviews-pipeline-review-first-50-20260331/stage3_candidates_patchcheck2`
- Results:
  - `WFS1`:
    - raw `1`
    - kept `0`
    - rejected `1` (`clinical characteristics`)
  - `VEXAS`:
    - raw `10`
    - kept `6`
    - rejected `4`
    - rejected:
      - `onset in late adulthood`
      - `failure to respond to classic immunosuppressive treatments`
      - `vacuoles in myeloid precursor cells`
      - `vacuoles in erythroid precursor cells`
  - `VLCAD deficiency`:
    - raw `7`
    - kept `3`
    - rejected `4`
    - rejected:
      - `asymptomatic at diagnosis`
      - `normal cognitive outcome`
      - `cardiac dysfunction reversible with treatment`
      - `hypoglycemia not present at symptom onset in myopathic form`

### Updated state
- The live 50-run audit no longer points only at Stage 5.
- The upstream path is now materially tighter:
  - Stage 1 no longer truncates the proven WFS1 case
  - Stage 3 no longer passes the observed junk classes silently
- Remaining safe next step:
  - run a `3-5` chapter micro-batch on the patched path and audit each stage live as outputs land

## 2026-04-01 - Cached latest5 upstream rerun completed without MedGemma

- Executed the patched upstream path on the cached settled `latest5` slice while intentionally skipping metadata / MedGemma.
- Rerun artifacts:
  - `output/genereviews-pipeline-latest5-settled-20260330/stage1_fetch_patchcheck_20260401`
  - `output/genereviews-pipeline-latest5-settled-20260330/stage2b_phenotagger_local_patchcheck_20260401`
  - `output/genereviews-pipeline-latest5-settled-20260330/stage2_anchors_patchcheck_20260401`
  - `output/genereviews-pipeline-latest5-settled-20260330/stage3_candidates_patchcheck_20260401`
  - `output/genereviews-pipeline-latest5-settled-20260330/stage4_mapped_candidates_patchcheck_20260401`

### Execution results
- Stage 1 fetch (from cached raw html only): `5/5`, `0` errors
- Stage 2b local PhenoTagger: `5/5`, `0` errors
- Stage 2 anchors: `5/5`, `0` errors
- Stage 3 Gemini Flash candidates: `5/5`, `0` errors
- Stage 4 BioLORD mapping: `5/5`, `0` errors

### Practical note
- The first patchcheck Stage 4 attempt started with an empty BioLORD cache and wasted CPU.
- Reused the settled cache:
  - `output/genereviews-pipeline-latest5-settled-20260330/stage4_mapped_candidates/biolord_cache_py310_np`
- With that cache seeded into the patchcheck dir, the remap completed immediately.

### What held
- The Stage 1 structural patch survived the real cached latest5 slice:
  - chapters rebuilt with proper `nbk_id` values and full prose
  - table-only prose stayed out of `clinical_text`
- The Stage 3 reject layer is real and auditable in the rebuilt candidate files:
  - `raw_candidate_count`
  - `rejected_candidate_count`
  - `rejected_candidates[]`

### Stage 3 count comparison vs earlier settled run
- `Y Chromosome Infertility`: `1 -> 5`
- `YIF1B`: `6 -> 10`
- `ZAP70`: `57 -> 54` with `4` explicit rejections
- `Zellweger`: `9 -> 12`
- `ZTTK`: `19 -> 5`

### Stage 4 accepted mapped rows vs earlier settled run
- `Y Chromosome Infertility`: `0 -> 0`
- `YIF1B`: `2 -> 3`
- `ZAP70`: `5 -> 5`
- `Zellweger`: `1 -> 1`
- `ZTTK`: `15 -> 3`

### Key interpretation
- The structural fixes are stable.
- The cached latest5 rerun also surfaced residual upstream semantic issues that were not solved by the first Stage 3 filter:
  - `Y Chromosome Infertility` still contains low-value normal/no-symptom candidates
  - `ZTTK` still shows context anchoring drift, e.g. `IgA deficiency` attached to an endocrinology sentence
  - `ZAP70` continues to raise the unresolved boundary question between phenotype discovery and immunologic/laboratory readouts

### Current conclusion
- Good news:
  - Stage 1 truncation/table-chrome class is fixed on real cached settled chapters
  - upstream reruns are now cheap and reproducible without MedGemma
- Remaining work before another larger batch:
  - tighten Stage 3 around:
    - normal/no-symptom statements
    - sentence/context anchoring
    - phenotype-vs-lab/immunology candidate scope

### 2026-04-01 18:45 EDT - Stage 3 strict replay on cached latest5

#### Code changes
- Hardened shared Stage 3 candidate finalization in `src/lib/genereviewsPipeline.js`:
  - added deterministic reject rules for:
    - normal / no-symptom statements
    - prognosis / disease-course statements
    - phenotype-summary statements like `attenuated clinical phenotype`
  - added context scoring fields:
    - `context_match_score`
    - `context_match_type`
    - token match counts
  - changed candidate sentence selection to use content-token overlap rather than always falling back to the first sentence in the paragraph
  - added weak-context rejection for candidates that cannot be grounded to the chapter text
  - added a narrow implied-function escape hatch for true milestone/ability inferences (e.g. `inability to walk independently` from explicit limited-capacity wording)
- Refactored both Stage 3 scripts to use the shared `finalizePhenotypeCandidates(...)` path:
  - `src/scripts/extractCandidatePhenotypes.js`
  - `src/scripts/extractCandidatePhenotypesOpenAiCompat.js`

#### Strict deterministic replay artifacts
- Stage 3 strict replay:
  - `output/genereviews-pipeline-latest5-settled-20260330/stage3_candidates_patchcheck_20260401_strict`
- Stage 4 remap from the strict candidates:
  - `output/genereviews-pipeline-latest5-settled-20260330/stage4_mapped_candidates_patchcheck_20260401_strict`

#### Strict replay results
- Stage 3 strict candidate counts:
  - `Y Chromosome Infertility`: `1` kept, `4` rejected
  - `YIF1B`: `10` kept, `0` rejected after the implied-function rescue rule
  - `ZAP70`: `38` kept, `20` rejected
  - `Zellweger`: `8` kept, `4` rejected
  - `ZTTK`: `4` kept, `1` rejected
- Stage 4 strict remap summary:
  - `Y Chromosome Infertility`: `0` high, `0` medium
  - `YIF1B`: `1` high, `2` medium
  - `ZAP70`: `3` high, `2` medium
  - `Zellweger`: `0` high, `0` medium
  - `ZTTK`: `0` high, `2` medium

#### What the strict replay fixed
- `Y Chromosome Infertility`
  - normal / no-symptom rows are now deterministically filtered out
  - only `mature arrest` remains as a candidate
- `ZTTK`
  - `IgA deficiency` is now rejected with `weak_context_match`
  - MRI-derived rows now anchor to the actual descriptive sentence instead of the generic `Brain MRI findings.` heading sentence
- `ZAP70`
  - normal-state rows such as `normal total lymphocyte counts`, `normal CD3 cell counts`, `normal immunoglobulin levels`
  - response-style rows such as `functional antibody responses to immunization`
  - prognosis/summary rows such as `death from infection`, `declining quality of life`, `attenuated clinical phenotype`
  are now filtered before Stage 4

#### What this did not solve yet
- The phenotype-vs-lab boundary is still a policy question, not just a bug:
  - `high total lymphocyte counts`
  - `elevated IgM`
  - `elevated IgE`
  still survive in ZAP70 because they are well-anchored and map to phenotype-like HPO terms
- That means the next decision is no longer “fix the broken filter,” but:
  - decide whether these laboratory/immunology readouts belong in phenotype discovery at all, or should be routed to a separate assay/lab channel

### 2026-04-01 19:10 EDT - Cheap scispaCy attachment probe

#### Setup
- Did not turn MedGemma back on.
- Installed an isolated biomedical parsing surface into:
  - `.deps/scispacy_probe`
- Used:
  - `spacy==3.7.5`
  - `en_core_sci_sm==0.5.4`
- Reused the existing Python 3.10 runtime from the local PhenoTagger environment so the probe stayed isolated from the main project runtime.

#### Evidence surface
- Probed only saved Stage 5 text/evidence cases:
  - USP7 progression leakage paragraph
  - USP7 hyperbilirubinemia vs neonatal jaundice pair
  - ZAP70 treatment-response sentences
  - ZTTK progression/onset sentence
- No new extraction batch was run.

#### Probe findings
- Same-sentence attachment is where the biomedical parser adds value:
  - `treatment-refractory` parses as an adjectival modifier of `thrombocytopenia`
  - `resistant` parses as an adjectival modifier of `dermatitis`, with `therapy` attached under that modifier
  - in the ZTTK sentence, `childhood` attaches to `onset`, while `worsened` is a later parataxis verb referring back to the clause
- Cross-sentence cases are still mostly solved by deterministic guards, not by the parser:
  - the USP7 progression sentence is simply separate from the scoliosis/kyphosis sentence
  - `neonatal` is clearly an adjectival modifier of `jaundice`, not of `hyperbilirubinemia`, but the main protection there is still sentence/clause locality

#### Conclusion
- `scispaCy` is worth integrating only as a narrow Stage 5 attachment helper for hard same-sentence cases:
  - onset
  - progression
  - treatment_response
- It should stay additive:
  - keep the existing deterministic sentence/clause guards
  - use the biomedical parser where those guards are not enough

## 2026-04-01 19:32 EDT — Narrow Stage 5 `scispaCy` integration

### What changed
- Added a small Python validator:
  - `src/scripts/validateMetadataAttachmentSciSpacy.py`
- Added a Node wrapper for isolated execution:
  - `src/lib/scispacyAttachmentValidator.js`
- Wired Stage 5 MedGemma enrichment to call the validator after evidence-backed merge in:
  - `src/scripts/extractPhenotypeMetadata.js`

### Scope
- The parser runs only on same-sentence attachment cases, not on all metadata.
- Fields covered:
  - `onset_raw`
  - `progression_raw`
  - `treatment_response_raw`
- The existing deterministic sentence/clause guards remain primary.
- The parser only blocks the field on explicit `fail`.
- `pass` and `unknown` are recorded as attachment-validation state but do not broaden extraction.

### Cheap proof
- Saved-case validator results:
  - ZAP70 `treatment-refractory immune thrombocytopenia` -> `pass`
  - ZAP70 `persistent dermatitis resistant to therapy` -> `pass`
  - ZTTK `childhood onset` in the dystonia sentence -> `unknown`
  - ZTTK `worsened over time` in the same sentence -> `unknown`
- Interpretation:
  - the parser adds real value on tight same-sentence modifier attachment
  - it stays conservative on harder parataxis / generic-person cases

### Verification
- `node --check src/lib/scispacyAttachmentValidator.js`
- `node --check src/scripts/extractPhenotypeMetadata.js`
- `python -m py_compile src/scripts/validateMetadataAttachmentSciSpacy.py`

### Operational note
- No MedGemma rerun was started for this step.
- The next meaningful proof would be a tiny patched rerun on:
  - USP7
  - ZAP70
  - ZTTK

## 2026-04-01 20:12 EDT — Static GeneReviews pipeline explainer HTML

### Output
- Created:
  - `/Users/ahmedelmorshedy/Documents/All HTMLs/2026-04-01/genereviews-pipeline-status.html`

### Why
- The running implementation discussion had become too hard to follow conversationally.
- The goal of the HTML was to make the current GeneReviews pipeline understandable to a reader who is unfamiliar with:
  - HPO
  - phenotype extraction
  - source-location tracking
  - the difference between intended design and real build status

### What the page contains
- same visual language as the earlier `genovy-pipeline.html`
- overview with simplified definitions
- two-lane pipeline map:
  - intended / clean flow
  - real build status
- one section per stage with:
  - local purpose
  - whole-pipeline purpose
  - expected output
  - dependency on the next stage
  - concrete examples of good and bad output
  - what broke, what was fixed, and current confidence
- final output section covering:
  - human review
  - conservative ingestion
  - API/export outputs

### Design note
- Kept technical language but replaced jargon-heavy terms such as “provenance” with simpler wording like “source location” and “exact source place” so the page can serve non-specialist explanation, not just internal engineering reference.

## 2026-04-01 20:32 EDT — Vertical map explainer upgrade

### Output
- Created / upgraded:
  - `/Users/ahmedelmorshedy/Documents/All HTMLs/2026-04-01/genereviews-pipeline-map-v2.html`

### Why
- The first HTML was better for reading, but not as strong for rapid visual comparison.
- A second version was needed that lets a reader glance at:
  - what each stage should do
  - what actually broke
  - what changed
  - and how each stage affects the next one
  all on one long page.

### Added interaction and explanation
- Example drawers inside main stage cards
- Confidence bars on the real-status side
- Flip cards for the major stages explaining:
  - the stage’s role inside the pipeline
  - the technical type of model/rule being used
  - how deterministic that component is
  - what downstream corruption happens if the stage is weak

### Reader model
- Designed for a reader unfamiliar with:
  - phenotype extraction
  - HPO normalization
  - “source location” / provenance concepts
  - the difference between intended pipeline design and current build reality

## 2026-04-01 22:10 EDT — Stage 3 negation/assertion layer

### Output
- Added a lightweight explicit Stage 3 negation/assertion pass in:
  - `src/lib/genereviewsPipeline.js`
- Preserved the new audit fields through downstream handoff in:
  - `src/scripts/mapCandidatesToHPO.js`
  - `src/scripts/extractPhenotypeMetadata.js`
- Fresh latest5 rerun output:
  - `output/genereviews-pipeline-latest5-settled-20260330/stage3_candidates_negation_patchcheck_20260401`

### What the layer does
- flips obvious sentence-local negative claims from `present` to `excluded`
- rejects preserved / normal statements that should not become phenotype candidates
- rejects clear conditional / risk-style statements
- records:
  - `assertion_status_origin`
  - `assertion_reason`
  - `assertion_evidence`

### Cheap proof
- `Seizures are not typically present...` now becomes `excluded`
- `Cognitive function is usually preserved.` now rejects `Cognitive function`
- `Absence of speech...` still stays positive as a real abnormal phenotype phrase

### Latest5 rerun result
- clean run: `5/5`, `0` errors
- candidate counts:
  - `Y Chromosome Infertility`: `4`
  - `YIF1B`: `9`
  - `ZAP70`: `35`
  - `Zellweger`: `8`
  - `ZTTK`: `5`
- concrete new cleanup from real latest5 text:
  - `potentially decreased expression of CTLA4 in regulatory T cells`
  - `potentially decreased expression of TGFB in regulatory T cells`
  were rejected as `conditional_or_risk_context`
- nuance:
  - the latest5 slice did not contain many natural explicit-negation cases
  - so the strongest proof of `present -> excluded` flipping came from focused sentence probes, while the natural slice mainly proved the new assertion filters did not destabilize Stage 3

### Extra robustness fix found during validation
- `mapCandidatesToHPO.js` had an offline replay bug:
  - `--phenotypesJson` only worked when the JSON had a `phenotype_rows` wrapper
  - cached BioLORD phenotype files are plain arrays
- patched the loader to accept both shapes

### Current read
- Stage 3 now has an explicit negation/assertion guard instead of relying only on prompt behavior and downstream rejection.
- This is a real architectural improvement, not a chapter-specific patch.
- The next agreed step is still the same:
  - Stage 3 bakeoff on the frozen slice
  - keep Stage 5 for later

## 2026-04-01 22:32 EDT — 100-case synthetic Stage 3 assertion regression suite

### Output
- Added:
  - `test/fixtures/genereviewsCandidateAssertionSynthetic.js`
  - `test/genereviewsCandidateAssertionSynthetic.test.js`

### Scope
- `100` synthetic sentences intentionally built to stress:
  - explicit local negation
  - preserved / normal contexts
  - conditional / risk contexts
  - true positive “absence/loss/lack” abnormal phenotypes
  - straightforward positive findings
  - already-excluded negatives

### What the first run found
- one real logic miss:
  - `has not been reported` was not being caught
- the remaining red cases were test expectation-shape mismatches rather than bad assertion behavior

### Patch
- updated the Stage 3 negative suffix regex in `src/lib/genereviewsPipeline.js` to catch auxiliary-chain negatives such as:
  - `has not been reported`
  - `have not been observed`

### Final result
- `node --test test/genereviewsCandidateAssertionSynthetic.test.js`
- result:
  - `102/102` passing

### Why it matters
- Stage 3 assertion logic now has a durable regression surface instead of only ad hoc sentence probes.
- This reduces the risk of later Stage 3 cleanup work silently reintroducing negation/assertion regressions.

## 2026-04-01 23:16 EDT — Gemini Flash semantic assertion probe

### Output
- Added:
  - `src/scripts/evaluateStage3AssertionWithGemini.js`
- Produced:
  - `output/stage3_assertion_gemini_probe_20260401/stage3_regression_cases_gemini_flash_report.json`
  - `output/stage3_assertion_gemini_probe_20260401/stage3_regression_cases_gemini_flash_summary.json`

### Scope
- Ran `gemini-2.5-flash` on the external Stage 3 regression file:
  - `/Users/ahmedelmorshedy/Downloads/stage3_regression_cases.js`
- The file contains `62` hard assertion cases, not `100`.
- Gemini was asked to classify the same Stage 3 final outcome space:
  - `present`
  - `excluded`
  - `rejected`

### Result
- outcome-only accuracy:
  - `62/62`
- exact match:
  - `58/62`
- the only exact-match misses were already-excluded rows where Gemini preserved the correct final outcome but left:
  - `predictedReason = null`
  - instead of mirroring a local negative reason string

### Why it matters
- This is strong evidence that semantic classification can outperform the current deterministic assertion layer on harder negation / preserved / conditional wording.
- The result shifts the Stage 3 plan:
  - assertion handling is now a realistic candidate for semantic-model assistance
  - not just additional regex growth

## 2026-04-01 23:25 EDT — 100-case tricky assertion fixture with Gemini Flash

### Output
- Reused:
  - `src/scripts/evaluateStage3AssertionWithGemini.js`
- Produced:
  - `output/stage3_assertion_gemini_tricky_probe_20260401/stage3_regression_cases_gemini_flash_report.json`
  - `output/stage3_assertion_gemini_tricky_probe_20260401/stage3_regression_cases_gemini_flash_summary.json`

### Scope
- Ran `gemini-2.5-flash` on the external tricky assertion file:
  - `/Users/ahmedelmorshedy/Downloads/stage3_tricky_cases.js`
- This fixture contains `100` cases across:
  - negation
  - abnormal absence staying present
  - preserved/normal rejection
  - conditional/risk rejection
  - standard positives
  - model-excluded stability

### Result
- exact match:
  - `100/100`
- outcome-only accuracy:
  - `100/100`

### Why it matters
- On the current external synthetic evidence, Gemini Flash clearly outperforms the current deterministic assertion layer.
- This strengthens the case for making Stage 3 assertion handling semantic-model-assisted instead of continuing regex growth as the main strategy.

## 2026-04-01 23:48 EDT — Real-format Stage 3 row probe with Gemini Flash

### Output
- Reused:
  - `src/scripts/evaluateStage3AssertionWithGemini.js`
- Produced:
  - `output/stage3_assertion_gemini_realformat_probe_20260401/stage3_regression_cases_gemini_flash_report.json`
  - `output/stage3_assertion_gemini_realformat_probe_20260401/stage3_regression_cases_gemini_flash_summary.json`

### Scope
- Ran Gemini Flash on:
  - `/Users/ahmedelmorshedy/Downloads/stage3_realformat_cases.js`
- This fixture uses a more realistic Stage 3 candidate row shape:
  - `label`
  - `status`
  - `source_sentence`
  - `paragraph`
  - `section_heading`
  - ids / match fields

### Result
- total cases:
  - `50`
- exact match:
  - `49/50`
- outcome-only accuracy:
  - `49/50`

### Single miss
- id:
  - `p24_s1`
- sentence:
  - `Slit-lamp examination is unremarkable and cataracts have not been described.`
- expected:
  - `excluded`
- predicted:
  - `present`

### Why it matters
- Gemini remains strong on inputs closer to the actual pipeline row format.
- The single failure shows the likely future shape:
  - semantic assertion can help a lot
  - but it still needs deterministic guardrails or fallback review for local negation edge phrasing

## 2026-04-02 01:03 EDT — OpenBioNER-v2 properly integrated and benchmarked

### Output
- Produced:
  - `output/stage3_extractor_contender_probe_20260401/openbioner_tricky_gate_summary.json`
  - `output/stage3_extractor_contender_probe_20260401/openbioner_tricky_gate_report.json`
  - `output/stage3_extractor_contender_probe_20260401/openbioner_tricky_gate_multidesc_summary.json`
  - `output/stage3_extractor_contender_probe_20260401/openbioner_tricky_gate_multidesc_report.json`
  - `output/stage3_extractor_contender_probe_20260401/openbioner_regression_gate_summary.json`
  - `output/stage3_extractor_contender_probe_20260401/openbioner_regression_gate_report.json`
  - `output/stage3_extractor_contender_probe_20260401/openbioner_realformat_gate_summary.json`
  - `output/stage3_extractor_contender_probe_20260401/openbioner_realformat_gate_report.json`
  - `output/stage3_extractor_contender_probe_20260401/contender_gate_summary.md`

### Scope
- Ran `disi-unibo-nlp/openbioner-base-v2` through the official `zshot + spaCy + LinkerSMXM` path rather than the earlier naive `transformers` token-classification path.
- Benchmarked it on:
  - `/Users/ahmedelmorshedy/Downloads/stage3_tricky_cases.js`
  - `/Users/ahmedelmorshedy/Downloads/stage3_regression_cases.js`
  - `/Users/ahmedelmorshedy/Downloads/stage3_realformat_cases.js`

### Integration note
- The official runner did not work cleanly with the newer `transformers` line that `zshot` first pulled in.
- Pinning the probe env to:
  - `transformers==4.51.3`
  restored compatibility.

### Result
- tricky 100:
  - single broad phenotype description:
    - `54/100`
  - tuned multi-description configuration:
    - `68/100`
- regression 62:
  - tuned multi-description:
    - `41/62`
- real-format 50:
  - tuned multi-description:
    - `30/50`

### Why it matters
- OpenBioNER-v2 is no longer blocked by “unfair integration” or the wrong inference path.
- After a fair run, it still does not outperform the current semantic Stage 3 path on our current benchmark surfaces.
- That makes the current conclusion cleaner:
  - `GLiNER` underperformed
  - `OpenBioNER-v2` is fairly tested and still not strong enough
  - `VANER2` remains too heavy for the quick contender pass

## 2026-04-02 01:11 EDT — Correction: contender tests were proxy surfaces, not final discovery benchmark

### Correction
- The GLiNER / OpenBioNER / VANER2 checks above should not be treated as final Stage 3 discovery verdicts.
- Those models are discovery contenders.
- The `100`, `62`, and `50` files used here were assertion-style or mention-detection proxy surfaces, not a real chapter-level discovery benchmark.

### What the proxy tests do tell us
- whether a model is technically runnable
- whether an integration path is broken
- whether the model can at least detect phenotype-like spans in hard local sentences

### What they do not tell us
- full chapter discovery quality
- candidate junk rate on GeneReviews prose
- chapter-level recall vs overgeneration
- downstream usefulness for Stage 4 mapping

### Updated interpretation
- `GLiNER`:
  - weak on the proxy gate
  - not yet formally rejected as a discovery contender
- `OpenBioNER-v2`:
  - technically integrated and proxy-tested
  - not yet formally rejected as a discovery contender
- `VANER2`:
  - still blocked for the quick pass

### Correct next step
- Build a frozen chapter-level discovery benchmark and compare:
  - current Gemini Stage 3 discovery
  - GLiNER-BioMed
  - OpenBioNER-v2
- Keep the semantic assertion work separate from the discovery comparison.

## 2026-04-02 14:34 EDT — Stage 2 anchor benchmark harness and baseline

### Output
- Added:
  - `src/scripts/benchmarkStage2Anchors.js`
- Produced:
  - `output/stage2_anchor_benchmark_20260402/stage2_anchor_benchmark_summary.json`
  - `output/stage2_anchor_benchmark_20260402/stage2_anchor_benchmark_cases.json`
  - `output/stage2_anchor_benchmark_20260402/stage2_anchor_benchmark_report.json`
  - `output/stage2_anchor_benchmark_20260402/stage2_anchor_benchmark_failures.json`

### Scope
- Used benchmark:
  - `/Users/ahmedelmorshedy/Downloads/anchor_benchmark (1).js`
- Evaluated the actual current Stage 2 anchor logic:
  - `extractAnchorOccurrences(...)`
- Used phenotype rows snapshot:
  - `output/genereviews-pipeline-latest5-settled-20260330/stage2_anchors_patchcheck_20260401/phenotype_rows_snapshot.json`

### Benchmark interpretation choice
- The external fixture includes:
  - `expectedAnchors`
  - `expectedRejected`
- For Stage 2 scoring, `expectedRejected` was interpreted as:
  - `must not anchor`
- This is the correct adaptation because Stage 2 does not naturally emit formal rejected rows.

### Result
- exact case match:
  - `27/100`
- expected anchor recall:
  - `64/107` = `0.5981`
- must-not-anchor pass rate:
  - `0.5`
- unexpected predicted anchors:
  - `77`

### Category highlights
- strong:
  - `multi_anchor_sentence` recall:
    - `0.9032`
  - `parent_child_ambiguity` recall:
    - `0.875`
  - `exact_label_present` recall:
    - `0.875`
- weak:
  - `negated_anchor` recall:
    - `0`
  - `misspelling_present` recall:
    - `0.2`
  - `disease_name_not_phenotype` must-not-anchor pass rate:
    - `0.1`

### Why it matters
- The benchmark file is usable for Stage 2 with only a light interpretation tweak.
- It now gives a real baseline for the current anchor path.
- This is enough to support a future anchor-side comparison against any public challenger.

### Important side note on PhenoBCBERT
- The PhenoBCBERT paper is real, but the paper states the in-house model trained on CHOP data could not be shared for privacy reasons.
- So the immediate deliverable here is the benchmark harness and current baseline, not a direct public PhenoBCBERT comparison.

## 2026-04-02 14:46 EDT — Gemini Flash quick anchor probe on balanced 50-case benchmark slice

### Output
- Added:
  - `src/scripts/evaluateStage2AnchorsWithGemini.js`
- Produced:
  - `output/stage2_anchor_gemini_probe_20260402/stage2_anchor_gemini_summary.json`
  - `output/stage2_anchor_gemini_probe_20260402/stage2_anchor_gemini_report.json`

### Scope
- Ran Gemini Flash on a balanced 50-case subset of:
  - `/Users/ahmedelmorshedy/Downloads/anchor_benchmark (1).js`
- Prompted only for sentence-level anchor extraction:
  - `hpo_label`
  - `status`
  - `match_text`

### Result
- total:
  - `50`
- exact match:
  - `47/50`
- anchor recall:
  - `48/48` = `1.0`
- must-not-anchor pass rate:
  - `13/13` = `1.0`

### Why it matters
- On this Stage 2 synthetic surface, Gemini Flash is far stronger than the current deterministic anchor baseline.
- This does not settle the final Stage 2 design, because we still need:
  - full 100-case pass
  - cost/latency read
  - chapter-level realism check
- But it is strong enough that Gemini is now a legitimate anchor-side contender, not just an assertion model.

## 2026-04-02 15:04 EDT — Full 100-case Stage 2 anchor benchmark: Gemini Flash vs Gemini Pro

### Output
- Produced:
  - `output/stage2_anchor_gemini_probe_full_20260402/stage2_anchor_gemini_summary.json`
  - `output/stage2_anchor_gemini_probe_full_20260402/stage2_anchor_gemini_report.json`
  - `output/stage2_anchor_gemini_pro_probe_full_20260402/stage2_anchor_gemini_summary.json`
  - `output/stage2_anchor_gemini_pro_probe_full_20260402/stage2_anchor_gemini_report.json`

### Scope
- Same benchmark:
  - `/Users/ahmedelmorshedy/Downloads/anchor_benchmark (1).js`
- Same runner:
  - `src/scripts/evaluateStage2AnchorsWithGemini.js`
- Pro run required:
  - `--thinkingBudget 1024`

### Result
- Gemini Flash:
  - exact match:
    - `85/100`
  - anchor recall:
    - `106/107`
  - must-not-anchor pass rate:
    - `0.8438`
- Gemini Pro:
  - exact match:
    - `90/100`
  - anchor recall:
    - `107/107`
  - must-not-anchor pass rate:
    - `0.9063`

### Residual error family
- Both models still mainly fail by:
  - over-anchoring extra phenotype-like findings
  - anchoring disease-label style spans that should stay out
- Pro reduces those errors somewhat but does not eliminate them.

### Why it matters
- A model-assisted Stage 2 is now clearly viable on the synthetic anchor benchmark.
- Pro is better than Flash, but only modestly.
- The likely practical path is:
  - Flash or Pro
  - plus a light post-filter layer for disease-name blocking and extra-anchor pruning

## 2026-04-02 - Offline post-filter probe on Flash Stage 2 anchor output

### Evidence surface
- Saved Flash full-100 output only:
  - `output/stage2_anchor_gemini_probe_full_20260402/stage2_anchor_gemini_report.json`
- No new model call for this probe.

### Question
- Whether an exact HPO string gate should be used first.
- Whether a narrow disease-name blocker is redundant or materially helpful.

### Result
- Exact HPO string-only gate:
  - exact:
    - `61/100`
  - recall:
    - `66/107`
  - must-not-anchor pass:
    - `31/32`
  - verdict:
    - too strict; unacceptable recall loss
- Narrow disease-name blocker only:
  - exact:
    - `88/100`
  - recall:
    - `106/107`
  - must-not-anchor pass:
    - `30/32`
  - verdict:
    - worthwhile

### What the blocker actually fixed
- `anc-061`
- `anc-095`
- `anc-099`

These were disease/diagnosis-style contexts, not generic HPO-string errors.

### Remaining 12-case taxonomy after blocker
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
- status error:
  - `anc-079`

### Decision implication
- This does not support “PhenoRerank probably fixes most of the remaining gap.”
- The stronger next-stack hypothesis is:
  - Flash for anchor extraction
  - narrow disease-name blocker
  - separate assertion pass

## 2026-04-02 - Stacked Flash Stage 2 evaluation

### Added
- `src/scripts/evaluateStage2FlashStack.js`

### Stack
- raw Flash Stage 2 anchor extraction
- narrow disease-name blocker
- separate Gemini Flash assertion pass

### Evidence
- benchmark:
  - `/Users/ahmedelmorshedy/Downloads/anchor_benchmark (1).js`
- raw Flash report:
  - `output/stage2_anchor_gemini_probe_full_20260402/stage2_anchor_gemini_report.json`
- stacked outputs:
  - `output/stage2_flash_stack_probe_20260402/stage2_flash_stack_summary.json`
  - `output/stage2_flash_stack_probe_20260402/stage2_flash_stack_report.json`

### Result
- raw Flash:
  - exact:
    - `85/100`
  - recall:
    - `106/107`
  - must-not-anchor pass:
    - `27/32`
- Flash + blocker:
  - exact:
    - `88/100`
  - recall:
    - `106/107`
  - must-not-anchor pass:
    - `30/32`
- Flash + blocker + assertion:
  - exact:
    - `91/100`
  - recall:
    - `106/107`
  - must-not-anchor pass:
    - `32/32`

### What assertion fixed
- `anc-060`
- `anc-063`
- `anc-089`

### What still remains
- main real uncaught status miss:
  - `anc-079`
- remaining non-exact cases are mostly over-extraction / policy-level benchmark disagreements rather than simple must-not-anchor leaks

### Working conclusion
- Current leading low-cost path:
  - Flash extraction
  - narrow disease-name blocker
  - separate assertion pass
- This is now stronger on the benchmark than raw Pro under the current strict scoring.

## 2026-04-02 - Tiny Flash vs Pro assertion bakeoff

### Added
- `test/fixtures/stage2_flash_assertion_focus_cases.js`

### Scope
- Only the remaining hard assertion cases from the stacked Flash Stage 2 probe.
- Evaluated with the existing assertion script, once with Flash and once with Pro.

### Result
- Flash:
  - exact:
    - `5/6`
  - outcome:
    - `5/6`
- Pro:
  - exact:
    - `5/6`
  - outcome:
    - `6/6`

### Important detail
- Both models correctly fixed:
  - `anc-079__neuropathy`
- The only outcome advantage for Pro was:
  - `anc-063__esrd`

### Decision impact
- Pro is slightly better on this narrow assertion slice.
- The gain is real but small.
- Current evidence still favors keeping Flash as the default assertion path until broader real-chapter evidence says Pro is worth the cost.

## 2026-04-02 - GLiNER discovery benchmark gate

### Added
- `src/scripts/benchmarkStage3DiscoveryGLiNER.py`

### Input
- `/Users/ahmedelmorshedy/Downloads/discovery_benchmark.js`

### Model
- `Ihor/gliner-biomed-small-v1.0`

### Outputs
- `output/stage3_discovery_gliner_benchmark_20260402/stage3_discovery_gliner_summary.json`
- `output/stage3_discovery_gliner_benchmark_20260402/stage3_discovery_gliner_report.json`

### Result
- strict exact:
  - `6/100`
- acceptable exact:
  - `8/100`
- expected candidate recall:
  - `544/819`
  - `0.6642`
- must-not-propose pass:
  - `489/550`
  - `0.8891`

### Main failure profile
- too many missed expected discovery candidates
- normal/preserved leakage still present
- duplicate/anchor-collision leakage still present
- broad/non-phenotype phrases still present in some cases

### Decision implication
- Running GLiNER first was worth it as a quota-saving gate.
- It is not strong enough on this discovery benchmark to replace a Gemini comparison.
- Next Stage 3 move should be Gemini on the same benchmark if we want the actual contender answer.

## 2026-04-02 - GLiNER hard-20 config sweep

### Input
- `output/stage3_discovery_medgemma_smoke_20260402_hard20_cases.js`

### Output
- `output/stage3_discovery_gliner_config_sweep_fullhard20_20260402/gliner_config_sweep_hard20.json`

### Configs compared
- `small_old_0p6`
- `small_one_0p4`
- `small_one_0p5`
- `small_one_0p6`
- `small_two_0p4`
- `small_two_0p5`
- `small_two_0p6`
- `large_one_0p4`
- `large_one_0p5`
- `large_one_0p6`
- `large_two_0p4`
- `large_two_0p5`
- `large_two_0p6`

### Best recall
- `large_two_0p4`
- labels:
  - `["clinical abnormality", "clinical finding"]`
- expected candidate recall:
  - `182/204`
  - `0.8922`
- must-not-propose pass:
  - `140/168`
  - `0.8333`

### Best single-label compromise
- `small_one_0p4`
- labels:
  - `["clinical abnormality"]`
- expected candidate recall:
  - `167/204`
  - `0.8186`
- must-not-propose pass:
  - `136/168`
  - `0.8095`

### Main read
- The original `small + 7 labels + 0.6` setup was too restrictive and understated GLiNER recall.
- Label simplification improved recall materially.
- Two-label configs improved recall most but leaked too much junk.
- Large model only clearly outperformed when run in the aggressive two-label recall mode.

### Decision implication
- GLiNER is still not clean enough to replace Gemini discovery.
- If used, it should be as a cheap explicit-span helper ahead of Gemini, not the main discovery engine.

## 2026-04-02 - Grounded residual discovery benchmark

### Added
- `src/scripts/benchmarkStage3DiscoveryResidualGemini.js`

### Inputs
- `/Users/ahmedelmorshedy/Downloads/discovery_benchmark.js`
- first-pass report:
  - `output/stage3_discovery_gliner_benchmark_20260402/stage3_discovery_gliner_report.json`

### Setup
- first pass:
  - original GLiNER clean config
  - `small_old_0p6`
- residual pass:
  - `gemini-2.5-pro`
  - grounded output required:
    - `sentence_id`
    - exact `evidence_text`

### Outputs
- `output/stage3_discovery_gliner_smallold_gemini25pro_residual_20260402/stage3_discovery_residual_summary.json`
- `output/stage3_discovery_gliner_smallold_gemini25pro_residual_20260402/stage3_discovery_residual_report.json`

### Result
- first-pass GLiNER:
  - recall:
    - `544/819`
    - `0.6642`
  - must-not-propose pass:
    - `489/550`
    - `0.8891`
- residual Gemini Pro on GLiNER misses:
  - residual recall:
    - `202/275`
    - `0.7345`
  - residual must-not-propose pass:
    - `481/489`
    - `0.9836`
  - grounding validity:
    - `sentence_id`:
      - `320/320`
    - `evidence_text`:
      - `320/320`
- combined:
  - recall:
    - `746/819`
    - `0.9109`
  - must-not-propose pass:
    - `481/550`
    - `0.8745`
  - strict exact:
    - `12/100`
  - acceptable exact:
    - `41/100`

### Representative grounded recoveries
- `disc-004`
  - recovered:
    - `autism spectrum disorder`
  - sentence id:
    - `p1_s8`
- `disc-005`
  - recovered:
    - `dysarthria`
    - `absent deep tendon reflexes`
    - `dysphagia`
    - `diabetes mellitus`
- `disc-007`
  - recovered:
    - `ataxic gait`

### Decision implication
- Grounded `sentence_id + evidence_text` discovery output works and is benchmarkable.
- The clean GLiNER pre-pass does not improve the overall stack enough to beat direct tuned Gemini discovery.
- Best use of this experiment is architectural proof for grounded outputs, not evidence that GLiNER-first is the superior discovery stack.

### Strict residual-only rerun
- Gemini was rerun with a stricter residual prompt:
  - ignore all `already_found_candidates`
  - return only genuinely new findings
  - do not review or restate GLiNER hits
- Residual-only result:
  - recall on GLiNER misses:
    - `188/275`
    - `0.6836`
  - residual must-not-propose pass:
    - `483/489`
    - `0.9877`
  - grounding validity:
    - sentence id:
      - `286/286`
    - evidence text:
      - `286/286`
  - net recall after residual fill:
    - `732/819`
    - `0.8938`

### Interpretation
- This is the fairer metric for Gemini as a residual completer.
- Gemini is very clean on the residual scope when forced to ignore GLiNER hits.
- Net performance still lags direct tuned Gemini because the GLiNER seed leaves too many misses up front.

## 2026-04-02 - Balanced second-pass on high-recall GLiNER hard-20

### First pass
- GLiNER config:
  - `Ihor/gliner-biomed-large-v1.0`
  - labels:
    - `["clinical abnormality", "clinical finding"]`
  - threshold:
    - `0.4`
- Output:
  - `output/stage3_discovery_gliner_large_two_0p4_hard20_20260402/stage3_discovery_gliner_report.json`
- Result:
  - recall:
    - `185/204`
    - `0.9069`
  - must-not-propose pass:
    - `130/168`
    - `0.7738`

### Second pass
- `gemini-2.5-pro`
- prompt role:
  - review first-pass candidates
  - reject junk
  - add missed findings

### Final result
- recall:
  - `184/204`
  - `0.902`
- must-not-propose pass:
  - `164/168`
  - `0.9762`
- strict exact:
  - `1/20`
- acceptable exact:
  - `4/20`
- kept candidates:
  - `236`
- added candidates:
  - `9`

### Decision implication
- This balanced prompt is a strong cleaner.
- It fixes most of GLiNER's junk explosion.
- It is slightly too conservative as written because it gives up one matched expected finding.
- Best next refinement, if needed, is to make the prompt a little less eager to reject borderline-but-valid first-pass phenotypes.

## 2026-04-02 - Frozen stage-3 discovery evaluation setup

### Added
- freezer script:
  - `src/scripts/freezeStage3DiscoveryEvalSets.js`
- frozen synthetic fixtures:
  - `test/fixtures/stage3DiscoveryBenchmarkFull.js`
  - `test/fixtures/stage3DiscoveryBenchmarkDevHard20.js`
  - `test/fixtures/stage3DiscoveryBenchmarkHoldout80.js`
- frozen manifests:
  - `test/fixtures/stage3DiscoveryEvalManifest.json`
  - `test/fixtures/stage3DiscoveryRealHoldoutManifest.json`

### Verification
- generated counts:
  - full:
    - `100`
  - dev:
    - `20`
  - synthetic holdout:
    - `80`
  - real holdout chapters:
    - `5`
- real holdout source:
  - `preservation/bucket-critical/20260331-genereviews-latest5-readiness/stage1_fetch/*_clinical_structure.json`

### Script default changes
- switched benchmark defaults from the mutable `Downloads/discovery_benchmark.js` file to:
  - `test/fixtures/stage3DiscoveryBenchmarkFull.js`
- switched MedGemma smoke default cases file to:
  - `test/fixtures/stage3DiscoveryBenchmarkDevHard20.json`

### Decision implication
- Prompt work should tune on `hard20`, then re-check on `holdout80`, then re-check on the real latest5 manifest before calling the change real.
- This removes the current dependence on an ad hoc `Downloads` benchmark file for default runs.

## 2026-04-02 - Grounded holdout80 bakeoff

### Added
- grounded scorer helper:
  - `src/lib/stage3DiscoveryGroundedEval.js`
- direct grounded runner:
  - `src/scripts/benchmarkStage3DiscoveryGroundedGemini.js`
- stacked grounded runner:
  - `src/scripts/benchmarkStage3DiscoveryGroundedGeminiStack.js`
- GLiNER runner now accepts explicit label config via `--labels`

### Holdout80 first-pass GLiNER
- config:
  - `Ihor/gliner-biomed-large-v1.0`
  - labels:
    - `clinical abnormality,clinical finding`
  - threshold:
    - `0.4`
- result:
  - recall:
    - `523/615`
    - `0.8504`
  - must-not-propose pass:
    - `282/382`
    - `0.7382`

### Holdout80 direct grounded Gemini
- model:
  - `gemini-2.5-pro`
- result:
  - strict exact:
    - `16/80`
  - acceptable exact:
    - `41/80`
  - recall:
    - `559/615`
    - `0.9089`
  - must-not-propose pass:
    - `361/382`
    - `0.9450`
  - grounding:
    - valid sentence id:
      - `809/809`
    - valid evidence text:
      - `808/809`

### Holdout80 grounded GLiNER -> Gemini stack
- model:
  - `gemini-2.5-pro`
- role:
  - review first-pass candidates
  - reject junk
  - add missed findings
- result:
  - strict exact:
    - `20/80`
  - acceptable exact:
    - `39/80`
  - recall:
    - `554/615`
    - `0.9008`
  - must-not-propose pass:
    - `365/382`
    - `0.9555`
  - grounding:
    - valid sentence id:
      - `794/794`
    - valid evidence text:
      - `791/794`

### Interpretation
- Direct grounded `2.5 Pro` is still the simpler leading option because it wins recall and stays very clean.
- The GLiNER stack slightly improves junk control and strict exact, but not by enough yet to clearly justify the extra moving parts.
- The next decision surface should be the real latest5 holdout, not more synthetic-only tuning.

## 2026-04-02 - Real latest5 discovery audit

### Added
- audit runner:
  - `src/scripts/auditStage3DiscoveryLatest5.js`

### Real latest5 direct grounded audit result
- model:
  - `gemini-2.5-pro`
- outputs:
  - `output/stage3_discovery_latest5_grounded_audit_20260402/latest5_direct_grounded_audit_summary.json`
  - `output/stage3_discovery_latest5_grounded_audit_20260402/latest5_direct_grounded_audit_report.json`
- totals:
  - predictions:
    - `48`
  - valid grounding:
    - `45/48`
  - duplicate anchor leaks:
    - `21`
  - overlaps failed stage7 items:
    - `6`
  - overlaps flagged stage7 items:
    - `10`
  - unmatched to preserved verified/failed/flagged items:
    - `23`
  - preserved verified non-anchor discovery targets:
    - `1`
  - matched:
    - `0`
  - missed:
    - `1`
    - `death in childhood`

### Interpretation
- The latest5 bundle is heavily anchor-dominated, so synthetic recall overstated how much “useful new discovery” was really happening.
- The direct grounded model is not mostly hallucinating; the bigger issue is anchor restatement plus some broad-category leakage.
- Manual skim of the real outputs suggests:
  - about `21/48` are clearly not useful because they duplicate anchors
  - about `8-10/48` are broad/questionable/non-ideal
  - about `14-18/48` look like plausible useful residual findings

### Failure patterns
- duplicate anchor leakage:
  - `severe... oligozoospermia`
  - `regression`
  - `malrotation of the gut`
- broad category leakage:
  - `Neurobehavioral/psychiatric manifestations`
  - `Ophthalmologic involvement`
  - `motor abnormalities`
- fragment / formatting leakage:
  - `conductive`
  - ellipsis-truncated evidence strings

### Decision implication
- Synthetic scores are still directionally useful, but they are not honest proxies for “useful new discovery” on their own.
- The next refinement should target duplicate-anchor blocking and broad-category suppression, then rerun the real latest5 audit.

## 2026-04-02 - Cached real-audit surface

### Added
- cache builder:
  - `src/scripts/buildStage3DiscoveryRealAuditCache.js`
- cache manifest:
  - `test/fixtures/stage3DiscoveryRealAuditCacheLatest5.json`

### What is cached
- all latest5 chapter structure paths
- all settled latest5 stage2 anchor paths
- all preserved latest5 stage7 verification paths
- current direct latest5 audit summary/report paths and summary payload
- next5 selection template with `5` frozen rubric slots

### Verification
- chapters cached:
  - `5/5`
- anchors cached:
  - `5/5`
- verification cached:
  - `5/5`
- direct audit cached:
  - available

### Decision implication
- We no longer need to reconstruct the latest5 real-audit surface by hand.
- The next `+5` expansion can plug into the frozen `next5_selection_template` instead of starting from scratch.
## 2026-04-02 - Real discovery audit latest10 scaffold

- Added reusable builder script: `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/buildStage3DiscoveryRealAuditLatest10.js`
- Added reusable raw real-holdout grounded runner: `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/runStage3DiscoveryRealGroundedRaw.js`
- New frozen fixtures:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealHoldoutNext5Manifest.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealHoldoutLatest10Manifest.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealAuditCacheLatest10.json`
- Selected next5 rubric mapping:
  - `anchor_heavy` -> `Williams Syndrome`
  - `narrative_implied` -> `USP7-Related Hao-Fountain Syndrome`
  - `lab_management_junk` -> `VEXAS Syndrome`
  - `exclusion_normal` -> `Very Long-Chain Acyl-Coenzyme A Dehydrogenase Deficiency`
  - `morphology_dense` -> `Weiss-Kruszka Syndrome`
- Cached next5 raw direct grounded discovery output:
  - output dir: `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_real_next5_grounded_raw_20260402`
  - summary file: `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_real_next5_grounded_raw_20260402/stage3_real_grounded_raw_summary.json`
  - report file: `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_real_next5_grounded_raw_20260402/stage3_real_grounded_raw_report.json`
- Current reusable real audit surface:
  - preserved latest5 audit cache: `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealAuditCacheLatest5.json`
  - expanded latest10 audit cache: `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealAuditCacheLatest10.json`
- Current limitation:
  - latest5 has prior stage7 verification surfaces
  - next5 currently has raw grounded discovery only
  - latest10 still needs manual adjudication to become the “true honest” residual benchmark

## 2026-04-02 - Real discovery audit latest10 manual truth summary

- Added manual adjudication fixture:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryRealLatest10ManualAudit.json`
- Added summarizer:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/summarizeStage3DiscoveryRealLatest10ManualAudit.js`
- Added output summary:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_real_latest10_manual_audit_20260402/latest10_manual_truth_summary.json`
- Manual latest10 truth totals:
  - raw outputs `118`
  - exact duplicate-anchor `36`
  - semantic anchor-covered `12`
  - true useful new residual `43`
  - broad/redundant `14`
  - junk/context-only `13`
- Key conclusion:
  - discovery quality is materially better than “mostly junk,” but raw direct discovery is still heavily diluted by anchor duplication
  - the strongest next engineering lever remains harder anchor-awareness / anchor-exclusion, not basic discovery model replacement

## 2026-04-02 - Gemini 2.5 Pro no-thinking API constraint

- Ran a direct `gemini-2.5-pro` prompt probe on `VEXAS Syndrome` with the tightened HPO-like residual-discovery prompt.
- Requested configuration:
  - `temperature: 0`
  - `thinkingBudget: 0`
- Result:
  - Gemini API rejected the request with `400 INVALID_ARGUMENT`
  - error text: `Budget 0 is invalid. This model only works in thinking mode.`
- Saved target output directory for this probe:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemini25pro_vexas_20260402`
- Immediate implication:
  - true no-thinking testing is not available on `gemini-2.5-pro`; future apples-to-apples probes must use either a minimal nonzero thinking budget on Pro or move the no-thinking comparison to Flash.

## 2026-04-02 - Gemini 2.5 Pro minimum-thinking VEXAS result

- Probed the same `VEXAS Syndrome` HPO-like residual-discovery prompt with:
  - `temperature: 0`
  - minimal valid `thinkingBudget: 128`
- Saved output:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemini25pro_vexas_20260402/gemini_25_pro_vexas_hpo_prompt_probe_min_thinking.json`
- Returned list:
  - `Unprovoked thrombosis`
  - `Failure to respond to classic immunosuppressive treatments`
  - `Elevated C-reactive protein`
  - `Macrocytic anemia`
  - `Vacuoles in myeloid and erythroid precursor cells`
- Interpretation:
  - even with the tightened prompt, `2.5 Pro` still did not conform cleanly to the residual/HPO-like policy on the hardest junk-heavy chapter
  - the response still contains anchor-covered, treatment-response, biomarker-only, and pathology-style outputs
  - `Macrocytic anemia` is the only clearly strong survivor under the current policy

## 2026-04-02 - Gemini 2.5 Pro default-thinking VEXAS result

- Ran the same tightened HPO-like prompt on `VEXAS Syndrome` with:
  - `temperature: 0`
  - default thinking mode (no explicit budget)
- Saved output:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemini25pro_vexas_20260402/gemini_25_pro_vexas_hpo_prompt_probe_temp0_default_thinking.json`
- Returned list:
  - `Unprovoked thrombosis`
  - `Clonal hematopoiesis`
  - `Monoclonal gammopathy of unknown significance`
  - `Multiple myeloma`
  - `Macrocytic anemia`
  - `Myelodysplastic syndrome`
  - `Vacuoles in myeloid and erythroid precursor cells`
- Interpretation:
  - default thinking performed worse than minimal valid thinking on this chapter
  - it reintroduced more diagnosis/context leakage rather than improving adherence to the HPO-like residual policy

## 2026-04-03 - Gemini 3.1 Pro Preview VEXAS result

- Live model listing confirmed:
  - `models/gemini-3.1-pro-preview`
- Ran the tightened HPO-like residual-discovery prompt on `VEXAS Syndrome` with:
  - `temperature: 0`
  - default thinking mode
- Saved output:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemini31propreview_vexas_20260402/gemini_31_pro_preview_vexas_hpo_prompt_probe_temp0.json`
- Returned list:
  - `Unprovoked thrombosis`
  - `Macrocytic anemia`
- Reran with normal/default parameters:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemini31propreview_vexas_20260402/gemini_31_pro_preview_vexas_hpo_prompt_probe_default_params.json`
- Result was materially the same:
  - `Unprovoked thrombosis`
  - `Macrocytic anemia`
- Interpretation:
  - `3.1 Pro Preview` is materially cleaner than the comparable `2.5 Pro` probes on the hardest junk-heavy chapter
  - remaining error is still anchor-covered leakage (`Unprovoked thrombosis`)

## 2026-04-03 - Gemma 4 31B VEXAS residual-coverage result

- Re-ran `google/gemma-4-31B-it` on the hard `VEXAS Syndrome` slice via the HF router with a revised prompt focused on residual-awareness rather than broad HPO-like extraction.
- New prompt changes:
  - gave explicit semantic coverage context for already-covered anchors:
    - anemia including macrocytic anemia
    - thrombocytopenia
    - venous thrombosis including unprovoked thrombosis
    - myelodysplasia / myelodysplastic syndrome
    - multiple myeloma
  - asked for only additional phenotype rows that survive review
  - kept generic drop classes for diagnosis/disorder labels, treatment-response, biomarker-only findings, pathology-only observations, and non-row-worthy fragments
  - explicitly allowed returning `[]` when nothing survived
- Ran both:
  - `temperature: 0`
  - default parameters
- Both runs returned:
  - `[]`
- Saved outputs:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemma4_vexas_20260403/gemma_4_31b_it_vexas_residual_probe_temp0.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemma4_vexas_20260403/gemma_4_31b_it_vexas_residual_probe_default.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemma4_vexas_20260403/gemma_4_31b_it_vexas_residual_probe_summary.json`
- Interpretation:
  - on this slice, Gemma only became clean after the prompt explicitly framed covered concepts as semantic coverage rather than leaving it as a raw anchor list
  - this suggests the main lever for Gemma is stronger residual-awareness / coverage framing, not simply adding more medical-role wording

## 2026-04-03 - Gemma 4 31B bigger-slice few-shot attempt blocked

- Prepared a larger `VEXAS Syndrome` slice (`p8`-`p29`) and a cross-chapter few-shot prompt for `google/gemma-4-31B-it`:
  - used `Williams Syndrome` examples of good residual rows
  - used `Williams Syndrome` examples of bad fragments / risk-only / anchor-covered outputs
  - explicitly avoided using examples from the target chapter
- Attempted both:
  - `temperature: 0`
  - default parameters
- Both failed at the HF router layer with:
  - `The requested model 'google/gemma-4-31B-it' is not supported by any provider you have enabled.`
- Sanity check on a trivial one-line prompt produced the same error, so the block is provider/model availability rather than prompt content.
- Logged files:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemma4_vexas_biggerslice_20260403/gemma_4_31b_it_vexas_biggerslice_fewshot_temp0.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemma4_vexas_biggerslice_20260403/gemma_4_31b_it_vexas_biggerslice_fewshot_default.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_prompt_probe_gemma4_vexas_biggerslice_20260403/gemma_4_31b_it_vexas_biggerslice_fewshot_summary.json`

## 2026-04-03 - Hugging Face router health check

- Verified account/token health:
  - `GET https://huggingface.co/api/whoami-v2` returned `200`
  - account `elmorshedyahmed`
  - token is valid and includes inference permissions
- Verified general HF site health:
  - `GET https://huggingface.co` returned `200`
- Re-tested `google/gemma-4-31B-it` with a trivial prompt:
  - still returned `400 model_not_supported`
- Added router control calls:
  - `meta-llama/Llama-3.1-8B-Instruct` -> `200`
  - `Qwen/Qwen2.5-7B-Instruct` -> `200`
- Interpretation:
  - the HF router is healthy
  - the token/account is healthy
  - the current issue is specific to `google/gemma-4-31B-it` provider availability on this router path

## 2026-04-03 - Dedicated Hugging Face endpoint health check

- Used dedicated endpoint provided by user:
  - `https://o47u6io8f0bmw21b.eu-west-1.aws.endpoints.huggingface.cloud`
- Health/path checks:
  - `GET /` -> `200 Ok`
  - `GET /health` -> `200 Ok`
  - `GET /docs` -> `404`
  - `POST /v1/chat/completions` -> `404`
  - `POST /generate` -> `404`
  - `POST /` with text-generation payload -> `200`
- Small Gemma-style prompt using chat-template text on `POST /` worked and returned clean `[]` when `return_full_text: false` was set.
- Larger cross-chapter few-shot `VEXAS` prompt was accepted by the endpoint but did not complete within the interactive waiting window of this session, so the endpoint appears healthy but comparatively slow for long prompts.
- Practical use note:
  - this endpoint should be treated as a direct text-generation endpoint on `POST /`, not as an OpenAI-compatible chat endpoint

## 2026-04-03 - GPU endpoint Williams rerun and omission audit

- Used GPU endpoint provided by user:
  - `https://t3oxlar69noyd3mk.us-east-1.aws.endpoints.huggingface.cloud`
- Re-ran `google/gemma-4-31B-it` on the Williams Syndrome `p15-p37` residual-discovery slice with:
  - residual-only prompt
  - semantic anchor coverage list
  - `temperature: 0`
  - plain `POST /` text-generation call
- The rerun returned a broader set than the first saved Williams probe, including:
  - `Post-term birth`
  - `Poor weight gain`
  - `Prolonged colic`
  - `Hypotonia`
  - `Hyperextensible joints`
  - `Delayed motor milestones`
  - `Delayed speech development`
  - `Fine motor difficulties`
  - plus additional broader/covered outputs
- Sent a follow-up omission-audit prompt asking specifically why Gemma did not emit:
  - `Bladder capacity is reduced`
  - `detrusor overactivity`
- Gemma's structured omission audit said:
  - both candidates `should_have_emitted: true`
  - both were classified as `anchor_covered`
  - cited sentence:
    - `p37_s4`
  - anchor basis used by the model:
    - `Urinary frequency`
- Interpretation:
  - the model is semantically collapsing the more specific urinary findings under the broader anchored urinary concept
  - this is direct evidence that coverage-policy / residual-awareness is the limiting factor in these probes

## 2026-04-04 - Strict enrichment reviewer schema and Zellweger pilot

- Added strict enrichment reviewer schema helper:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/enrichmentReviewer.js`
- The schema now explicitly defines and allows:
  - `pathophysiology`
  - `etiology`
  - `clinical_course`
- Added canonical alias normalization so off-schema outputs can still be repaired into the enum:
  - `severity -> severity_domain`
  - `pathology -> pathophysiology`
  - `progression -> clinical_course`
- Added guarded chapter-review script:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/runChapterEnrichmentReviewerTrial.js`
- Added package command:
  - `npm run gr:chapter-enrichment-review`
- Added schema-normalizer unit test:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/enrichmentReviewer.test.js`
- Ran strict-schema Zellweger chapter review using cached grounded candidates plus source sentences and settled stage2 anchors.
- Output written to:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/chapter_trial_zellweger_enrichment_20260404/chapter_enrichment_trial_outputs.json`
- Result:
  - both `gemini-2.5-pro` and `gemini-3-pro-preview` stayed inside the strict detail-type schema without needing the repair fallback
  - both models kept:
    - `neuronal migration defects`
    - `widely split sutures`
    - `bony stippling`
    - `severe bleeding episodes`
  - both did not retain `chondrodysplasia punctata` as separate enrichment
  - both changed `leopard spot pigmentary retinopathy` from the prior `anchor_covered_semantic` audit bucket to `keep_enrichment`
- Practical takeaway:
  - the schema guard prevents ad hoc detail-type invention
  - the enrichment-first policy materially changes at least one clinically important Zellweger decision
  - `gemini-3-pro-preview` still gives the cleaner structured reviewer output shape, but `gemini-2.5-pro` also behaved once the schema and definitions were explicit

## 2026-04-04 - Ancillary clinical evidence retention layer

- Extended the enrichment reviewer schema to preserve clinically useful non-phenotype evidence in a separate retention layer instead of discarding it.
- Updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/enrichmentReviewer.js`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/runChapterEnrichmentReviewerTrial.js`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/enrichmentReviewer.test.js`
- Added:
  - new bucket: `retain_as_ancillary`
  - retention layers:
    - `phenotype_enrichment`
    - `ancillary_clinical_evidence`
    - `discarded`
  - ancillary evidence types:
    - `laboratory`
    - `imaging`
    - `pathology`
    - `electrophysiology`
    - `treatment_response`
    - `clinical_test`
    - `management_context`
    - `other`
- Added alias normalization and validation so off-schema ancillary labels repair into the allowed enum.
- Verified unit tests:
  - `node --test test/enrichmentReviewer.test.js`
- Ran an artifact-only ZAP70 chapter review using cached grounded candidates, saved clinical structure, and settled stage2 anchors. No fresh extraction rerun was performed.
- Evidence surfaces inspected:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_first5_gemini_independent_eval_20260404/grounded_raw_manual_eval_report.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/bucket-critical/20260331-genereviews-latest5-readiness/stage1_fetch/NBK20221_clinical_structure.json`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-latest5-settled-20260330/stage2_anchors/ZAP70_Related_Combined_Immunodeficiency_anchors.json`
- Output overwritten at:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/chapter_trial_zap70_enrichment_20260404/chapter_enrichment_trial_outputs.json`
- Key result:
  - `autoantibodies to factor VIII` now lands in `retain_as_ancillary` with `ancillary_evidence_types=["laboratory"]` rather than being discarded as junk
  - after adding a deterministic post-router, `polyomaviremia` also gets rerouted from phenotype enrichment to ancillary `laboratory`
- Deterministic routing rule added:
  - high-confidence ancillary-only labels are rerouted after Gemini output normalization instead of being prompt-tuned away
  - current router is intentionally conservative and leaves mixed phenotype-plus-treatment rows such as `persistent dermatitis resistant to therapy` in phenotype enrichment for now
- Remaining issue:
  - several infection-heavy or treatment-tinged rows are still being kept as phenotype enrichment, so the next improvement should target deterministic post-collapse or tighter phenotype-vs-ancillary policy, not schema repair

## 2026-04-04 - Deterministic mixed-row treatment-response splitter

- Extended the enrichment router to split mixed phenotype + treatment-response rows instead of forcing them into a single placement.
- Updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/enrichmentReviewer.js`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/runChapterEnrichmentReviewerTrial.js`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/enrichmentReviewer.test.js`
- Added deterministic handling for:
  - post-nominal treatment-response qualifiers like `resistant to therapy`
  - prenominal treatment-response qualifiers like `treatment-refractory`
- The router now emits:
  - `resolved_candidate_label`
  - `derived_ancillary_evidence`
- Verified unit tests:
  - `node --test test/enrichmentReviewer.test.js`
- Reran only the artifact-based ZAP70 chapter review on the same cached report, structure, and anchors as above.
- Key result on real cached rows:
  - `persistent dermatitis resistant to therapy`
    - resolves to phenotype label `persistent dermatitis`
    - derives ancillary evidence `treatment_response: resistant to therapy`
  - `isolated treatment-refractory immune thrombocytopenia (ITP)`
    - resolves to phenotype label `isolated immune thrombocytopenia (ITP)`
    - derives ancillary evidence `treatment_response: treatment-refractory`
  - `autoantibodies to factor VIII`
    - still routes to ancillary `laboratory`
  - `polyomaviremia`
    - still routes to ancillary `laboratory`
- Scope intentionally kept narrow:
  - this splitter only covers treatment-response phrasing for now
  - it does not yet split trigger / etiology / consequence mixed rows

## 2026-04-04 - External chapter freeze normalizer for Opus/ChatGPT outputs

- Built a strict finalization layer for external chapter JSON so externally prompted chapter outputs can be frozen into the canonical discovery schema before grounding.
- Updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/externalPhenotypeExtraction.js`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/groundExternalPhenotypeExtraction.js`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/freezeExternalPhenotypeExtraction.js`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/externalPhenotypeExtraction.test.js`
- The new freeze layer now does all of the following deterministically:
  - parses raw model dumps even when the model added prose before or after the JSON
  - strips unsupported per-row fields from phenotype rows and freezes them to `{ "label": "..." }`
  - preserves the locked top-level schema:
    - `chapter`
    - `phenotypes`
    - `ancillary_clinical_evidence`
    - `context_metadata`
    - `context_notes`
  - reroutes ancillary-like phenotype rows into the correct ancillary bucket
    - e.g. `recurrent CMV viremia`
    - `polyomaviremia`
    - `autoantibodies to factor VIII`
  - removes non-phenotype lab-style rows from `phenotypes.excluded`
  - normalizes treatment-response rows so only qualifier strings remain when a clean qualifier is extractable
  - reroutes trigger/exposure strings out of `treatment_response`
  - flattens nested `context_metadata` objects into string-only key/value pairs
  - removes exact duplicate concepts across phenotype and ancillary layers
- Important architectural decision:
  - frozen final chapter JSON does **not** carry `sentence_id`
  - sentence grounding and verification remain a separate sidecar step using the saved clinical structure
- Updated grounding behavior:
  - `groundExternalPhenotypeExtraction.js` now accepts raw model output files with trailing prose by using the same permissive JSON-object extraction as the freeze step
- Added test coverage for:
  - grouped bucket normalization
  - flat payload normalization
  - ancillary rerouting from phenotype buckets
  - treatment-response qualifier cleanup
  - raw JSON extraction from prose-wrapped model outputs
- Verified:
  - `node --test test/externalPhenotypeExtraction.test.js test/enrichmentReviewer.test.js`
- This gives a clean external workflow:
  - raw model chapter output -> `freezeExternalPhenotypeExtraction.js` -> canonical final chapter JSON
  - canonical final chapter JSON -> `groundExternalPhenotypeExtraction.js` -> grounded verification sidecar with sentence ids

## 2026-04-04 - Froze external next5 chapter batch from Documents/genovymorsh

- Located the five external chapter files in:
  - `/Users/ahmedelmorshedy/Documents/genovymorsh`
- Ran the freeze script over the batch and wrote canonical `_frozen.json` outputs alongside the raw files:
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/ chapter 1-Williams Syndrome_frozen.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/ chapter 2-USP7-Related Hao-Fountain Syndrome _frozen.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/ chapter 3-VEXAS_frozen.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/Chapter 4- VLCAD Deficiency_frozen.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/Chapter 5- Weiss-Kruszka Syndrome_frozen.json`
- Four chapter files froze directly.
- The raw VEXAS file was malformed on disk:
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/ chapter 3-VEXAS.json`
  - it contained three unquoted explanation lines embedded inside `context_notes`
  - I did **not** edit the raw file
  - instead I generated the frozen output from a sanitized temporary copy with those prose lines removed
- Batch freeze outcome:
  - the five raw external chapter outputs now have pipeline-safe frozen counterparts
  - sentence grounding / verification has not yet been run on this Documents batch
- Next step, if needed:
  - run `groundExternalPhenotypeExtraction.js` per frozen chapter using the saved clinical structure and anchors for sentence-level verification sidecars

## 2026-04-04 - Created bundled reference folder for external freeze workflow

- Added a single reference folder for the three external-finalization files plus workflow documentation:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/external-phenotype-freeze-bundle`
- Bundle contents:
  - `externalPhenotypeExtraction.js`
  - `freezeExternalPhenotypeExtraction.js`
  - `groundExternalPhenotypeExtraction.js`
  - `README.md`
- Purpose of the bundle:
  - make it easier to turn the current split freeze/ground workflow into one standalone program later
  - keep the role of each file explicit without hunting through the repo
- The README documents:
  - what each file does
  - the raw -> frozen -> grounded data flow
  - the boundary between canonical frozen chapter JSON and grounded verification sidecar
  - a suggested future unified CLI shape (`freeze`, `ground`, `freeze-and-ground`)
- Important note:
  - the bundle contains copies for reference/consolidation work
  - the canonical implementation files remain in `src/lib` and `src/scripts`

## 2026-04-04 - Added unified external phenotype pipeline CLI

- Added:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/externalPhenotypePipeline.js`
- Purpose:
  - provide one command surface for the external chapter workflow instead of manually calling separate freeze and grounding scripts
- Supported modes:
  - `freeze`
  - `ground`
  - `freeze-and-ground`
- Behavior:
  - `freeze`
    - raw model output -> frozen canonical chapter JSON
  - `ground`
    - frozen chapter JSON -> grounded verification sidecar
  - `freeze-and-ground`
    - raw model output -> frozen chapter JSON -> grounded verification sidecar
- The CLI reuses the same library logic rather than duplicating normalization rules.
- Verified with a synthetic end-to-end smoke run:
  - raw prose-wrapped JSON input
  - synthetic clinical text input
  - `freeze-and-ground` produced both:
    - frozen canonical chapter JSON
    - grounded sidecar with `sentence_id`
- Added the unified CLI copy to the external workflow bundle and updated the bundle README:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/external-phenotype-freeze-bundle`

## 2026-04-04 - Added MCP server for external phenotype pipeline

- Added:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/externalPhenotypePipelineMcp.js`
- Package script added:
  - `npm run gr:external-pipeline:mcp`
- MCP tools exposed:
  - `freeze_external_phenotype_extraction`
  - `ground_external_phenotype_extraction`
  - `freeze_and_ground_external_phenotype_extraction`
- Purpose:
  - expose the same raw -> frozen -> grounded workflow through MCP stdio instead of only through terminal CLI commands
  - keep the workflow on one shared implementation path by reusing `src/lib/externalPhenotypePipeline.js`
- Verified with a real SDK-based stdio smoke test:
  - listed tools successfully
  - called `freeze_external_phenotype_extraction`
  - confirmed frozen output summary counts matched expected rerouting behavior
- Updated the external workflow bundle README to document the MCP entry point and tool surface.

## 2026-04-04 - Tightened external freeze normalizer for Gemini end-to-end outputs

- Updated:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/externalPhenotypeExtraction.js`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/externalPhenotypeExtraction.test.js`
- Added deterministic freeze rules for:
  - splitting bundled phenotype rows such as `craniosynostosis involving the metopic or lambdoid suture`
  - normalizing weak phenotype wording such as `global delay` -> `developmental delay`
  - promoting structural malformation findings out of `ancillary_clinical_evidence.imaging` into phenotype rows when they are true disease manifestations
  - rerouting recommendation-style `clinical_test` entries into `management_context`
  - pruning broad overlap when specific corpus callosum malformation rows are present
- Verified with:
  - `node --test test/externalPhenotypeExtraction.test.js test/enrichmentReviewer.test.js`

## 2026-04-04 - Added HTTP MCP endpoint for external phenotype pipeline

- Added:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/externalPhenotypePipelineHttpMcp.js`
- Package script added:
  - `npm run gr:external-pipeline:mcp:http`
- Purpose:
  - expose the external phenotype MCP tools through a real local HTTP endpoint instead of only stdio transport
- Default URL surface:
  - `http://127.0.0.1:8787/mcp`
  - health check at `http://127.0.0.1:8787/health`
- Implementation note:
  - the HTTP wrapper reuses the exact same MCP tool registration by importing `createServer()` from `externalPhenotypePipelineMcp.js`
  - this keeps stdio MCP and HTTP MCP on one shared tool-definition path
- Verified with:
  - `npm run gr:external-pipeline:mcp:http -- --help`
  - real local streamable HTTP smoke against `http://127.0.0.1:8787/mcp`
  - successful `tools/list`
  - successful `freeze_external_phenotype_extraction` call over HTTP transport

## 2026-04-05 - Finalized grounded sidecars for the Documents/genovymorsh Opus batch

- Re-ran external freeze plus grounding on the five Opus chapter files in:
  - `/Users/ahmedelmorshedy/Documents/genovymorsh`
- Grounding used the real GeneReviews clinical structures and anchor files from:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-review-first-50-20260331/stage1_fetch`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-review-first-50-20260331/stage2_anchors`
- Final grounded outputs written:
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/ chapter 1-Williams Syndrome_frozen_grounded.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/ chapter 2-USP7-Related Hao-Fountain Syndrome _frozen_grounded.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/ chapter 3-VEXAS_frozen_grounded.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/Chapter 4- VLCAD Deficiency_frozen_grounded.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/Chapter 5- Weiss-Kruszka Syndrome_frozen_grounded.json`
- Freeze rerun status:
  - Williams, USP7, VLCAD, and Weiss were re-frozen successfully from the raw Opus files
  - VEXAS raw remained malformed on disk, so grounding used the already-valid frozen artifact:
    - `/Users/ahmedelmorshedy/Documents/genovymorsh/ chapter 3-VEXAS_frozen.json`
- Grounding counts from this run:
  - Williams: `9` grounded, `15` rejected
  - USP7: `0` grounded, `8` rejected
  - VEXAS: `2` grounded, `24` rejected
  - VLCAD: `3` grounded, `3` rejected
  - Weiss-Kruszka: `3` grounded, `0` rejected
- Operational note:
  - the sidecar pipeline executed successfully, but grounding coverage is still sparse on several chapters, so this batch is finalized as artifacts-on-disk rather than as a quality-approved benchmark set

## 2026-04-05 - Fixed external sidecar grounding to preserve frozen rows instead of discovery-skipping them

- Root cause confirmed in code:
  - the external sidecar path was reusing `finalizePhenotypeCandidates()` in discovery mode
  - discovery mode skips anchor-matching labels via `matchesExistingAnchor(...)`
  - this is correct for new candidate discovery but wrong for frozen-row provenance attachment
- Additional bug fixed:
  - uncertain external rows were still carrying `status: present`, which caused status/bucket drift during sidecar enrichment
- Code changes:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/externalPhenotypeExtraction.js`
    - normalized phenotype status from bucket consistently, including `uncertain`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/genereviewsPipeline.js`
    - added grounding-status normalization
    - allowed `finalizePhenotypeCandidates()` to run with:
      - `allowExistingAnchors: true`
      - `preserveInputStatus: true`
    - preserved `extraction_bucket` on both grounded and rejected rows
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/lib/externalPhenotypePipeline.js`
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/groundExternalPhenotypeExtraction.js`
    - switched external sidecar grounding to the preserved-status / allow-anchor path
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/externalPhenotypeExtraction.test.js`
    - added regression coverage for anchor-preserving sidecar grounding and uncertain-row status preservation
- Verified with:
  - `node --test test/externalPhenotypeExtraction.test.js`
  - `node --test test/externalPhenotypeExtraction.test.js test/enrichmentReviewer.test.js`
- Re-ran the five Documents/genovymorsh grounded sidecars after the fix.
- Coverage improved materially versus the pre-fix run:
  - Williams: `38` grounded, `52` rejected
  - USP7: `13` grounded, `36` rejected
  - VEXAS: `14` grounded, `25` rejected
  - VLCAD: `15` grounded, `5` rejected
  - Weiss-Kruszka: `31` grounded, `0` rejected
- Most important outcome:
  - Weiss now preserves excluded and uncertain rows in the sidecar (`29` present, `1` excluded, `1` uncertain)
  - the catastrophic low-coverage behavior was a real bug in the external sidecar path and is now corrected

## 2026-04-05 - Hardened external post-processing and finalized the next five Opus chapters

- Tightened external freeze normalization so diagnosis-like phenotype rows are not over-rerouted into ancillary buckets:
  - immunoglobulin deficiency rows now remain in phenotypes
  - organ dysplasia rows such as `kidney dysplasia` now remain in phenotypes
- Tightened grounding sentence selection in `genereviewsPipeline.js`:
  - sentence selection now prefers the best exact/descriptive support rather than the first exact support encountered
  - heading-only, table-like, and management-style anchors are penalized during tie-breaking
  - grounding now records `context_quality_score` and `grounding_confidence`
- Added external post-processing robustness features:
  - grounded outputs now expose both `grounded_candidates` and `candidates`
  - a reconciliation pass now guarantees every frozen row is either grounded or explicitly rejected
- Regression coverage added for:
  - keeping `IgA deficiency`, `IgG deficiency`, and `kidney dysplasia` in the phenotype layer
  - preferring descriptive clinical sentences over management sentences
  - avoiding heading-only anchors
  - explicit rejection of any unaccounted frozen rows
- Verified with:
  - `node --test test/externalPhenotypeExtraction.test.js test/enrichmentReviewer.test.js`
  - `node --test test/externalPhenotypeExtraction.test.js test/genereviewsCandidateAssertionSynthetic.test.js`
- Re-ran the five next-batch Opus chapters in:
  - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch`
- Finalized outputs written:
  - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/chapter 6-Y Chromosome Infertility_frozen.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/chapter 6-Y Chromosome Infertility_frozen_grounded.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/chapter 7-Zellweger Spectrum Disorder_frozen.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/chapter 7-Zellweger Spectrum Disorder_frozen_grounded.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/chapter 8-ZAP70-Related Combined Immunodeficiency_frozen.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/chapter 8-ZAP70-Related Combined Immunodeficiency_frozen_grounded.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/chapter 9-YIF1B-Related Neurodevelopmental Disorder_frozen.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/chapter 9-YIF1B-Related Neurodevelopmental Disorder_frozen_grounded.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/chapter 10-Zhu-Tokita-Takenouchi-Kim Syndrome_frozen.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/chapter 10-Zhu-Tokita-Takenouchi-Kim Syndrome_frozen_grounded.json`
- Grounding counts from the finalized rerun:
  - chapter 6 Y Chromosome Infertility: `6` grounded, `2` rejected
  - chapter 7 Zellweger Spectrum Disorder: `26` grounded, `8` rejected
  - chapter 8 ZAP70-Related Combined Immunodeficiency: `26` grounded, `6` rejected
  - chapter 9 YIF1B-Related Neurodevelopmental Disorder: `20` grounded, `8` rejected
  - chapter 10 Zhu-Tokita-Takenouchi-Kim Syndrome: `58` grounded, `14` rejected
- Spot-check outcome:
  - ZTTK now preserves `IgA deficiency`, `IgG deficiency`, and `kidney dysplasia` in the frozen phenotype layer
  - ZTTK grounding now links `IgA deficiency` to the descriptive immunodeficiency sentence instead of rejecting it

## 2026-04-05 - Evaluated Gemini embedding-based sidecar design

- Reviewed the user's description of a Gemini sidecar that uses sentence-level and label-level embeddings, cosine similarity retrieval, and rule-based reranking with section penalties and a hard acceptance threshold.
- Assessment:
  - this is directionally stronger than pure lexical matching because it improves semantic recall for paraphrased phenotype labels
  - it should still be treated as a retrieval layer rather than the final truth layer, with deterministic guardrails preserved on top
  - the weights and threshold should remain named config rather than hidden constants
- Recommended guardrails to preserve:
  - frozen label and status immutability
  - no heading-only anchors
  - prefer descriptive clinical sections over management when both support a row
  - every frozen row must end grounded or explicitly rejected
- Next likely move if adopted in code:
  - add embedding retrieval as an optional candidate-generation layer ahead of the existing rule-based context scorer, then compare chapter-level grounding quality against the current hardened lexical pipeline

## 2026-04-05 - Implemented quote-first grounding with deterministic localization

- Shifted the external phenotype grounding path toward citation-first evidence preservation instead of post-hoc recovery only.
- `source_quote` is now preserved through normalization, candidate enrichment, and coverage reconciliation in `src/lib/externalPhenotypeExtraction.js`.
- Frozen external chapter outputs can now carry additive `grounding_hints.phenotypes` rows so quote evidence survives freeze/thaw without changing the primary phenotype row shape.
- `src/lib/genereviewsPipeline.js` now:
  - prefers deterministic `source_quote` localization before lexical fallback
  - supports exact, loose, and paragraph-level quote localization
  - preserves `source_quote` and `quote_match_type` in grounded outputs
  - validates excluded-bucket polarity in strict external-grounding mode without breaking existing synthetic assertion behavior
- Updated extraction prompts in:
  - `src/scripts/extractCandidatePhenotypes.js`
  - `src/scripts/extractCandidatePhenotypesOpenAiCompat.js`
  to require verbatim `source_quote` emission per row.
- Verification passed:
  - `node --test test/externalPhenotypeExtraction.test.js`
  - `node --test test/genereviewsCandidateAssertionSynthetic.test.js`
  - `node --test test/externalPhenotypeExtraction.test.js test/enrichmentReviewer.test.js`
- Net result:
  - quote-first grounding is now the primary path when `source_quote` exists
  - lexical matching remains available as the fallback path for legacy outputs or quote localization misses

## 2026-04-05 - Locked external sidecar verification and review artifacts

- Extended the shared external pipeline so grounded chapter outputs now generate review-ready artifacts automatically:
  - `review_pages/*_review.html`
  - `review_data/*_review.json`
  - per-row verifier contract fields on grounded and rejected rows
- Added `src/lib/externalPhenotypeVerification.js` to deterministically grade external grounded rows on:
  - sentence-span resolution
  - quote support
  - quote strength
  - status support
  - evidence-surface risk
  - grounding-resolution outcome for rejected rows
- Updated `src/scripts/groundExternalPhenotypeExtraction.js` and the newer external pipeline helpers so the same verification/review behavior applies across the old script, the wrapper pipeline, and the MCP server.
- Fixed a real excluded-bucket bug in `src/lib/genereviewsPipeline.js`:
  - negative statements like "`phenotype` has not been described" now count as valid exclusion evidence
- Improved audit readability:
  - both `public/geneReviewsAudit.js` and the generated standalone review page now render full verifier check details instead of names only
- Targeted verification passed:
  - `node --test test/externalPhenotypeExtraction.test.js`
  - `node --test test/enrichmentReviewer.test.js`

## 2026-04-06 - Located the real Opus raw 1-10 chapter batch and exported JSON/JSONL handoff artifacts

- Verified that the actual raw Opus 1-10 batch is not the repo-side combined `medgemma_real_latest10_raw_results.json` import artifact.
- Confirmed the real source set lives in the user Documents folders as chapter-named raw files:
  - `/Users/ahmedelmorshedy/Documents/genovymorsh`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch`
- Source files resolved:
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/ chapter 1-Williams Syndrome.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/ chapter 2-USP7-Related Hao-Fountain Syndrome .json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/ chapter 3-VEXAS.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/Chapter 4- VLCAD Deficiency.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh/Chapter 5- Weiss-Kruszka Syndrome.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/chapter 6-Y Chromosome Infertility.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/chapter 7-Zellweger Spectrum Disorder.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/chapter 8-ZAP70-Related Combined Immunodeficiency.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/chapter 9-YIF1B-Related Neurodevelopmental Disorder.json`
  - `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/chapter 10-Zhu-Tokita-Takenouchi-Kim Syndrome.json`
- Exported a clean handoff bundle to:
  - `/Users/ahmedelmorshedy/Downloads/genovy-opus-raw-1-10-json-jsonl-20260405`
- Bundle contents:
  - copied original raw files in `raw-json/`
  - one JSONL per chapter in `jsonl/`
  - combined JSONL at `/Users/ahmedelmorshedy/Downloads/genovy-opus-raw-1-10-json-jsonl-20260405/chapters_1_10_raw_combined.jsonl`
  - source/output mapping in `/Users/ahmedelmorshedy/Downloads/genovy-opus-raw-1-10-json-jsonl-20260405/export_manifest.json`
- Validation outcome:
  - 9/10 raw chapter files parsed as strict JSON without changes
  - `chapter 3-VEXAS.json` failed JSON parsing because three unquoted `context_notes` lines were appended after the final quoted note
  - generated `chapter 3-VEXAS.jsonl` using a narrow `context_notes` repair pass only; the copied raw JSON in `raw-json/` remains byte-for-byte untouched
- Cleanup:
  - removed the earlier incorrect Downloads export that had been built from the wrong repo-side combined artifact so there is only one current handoff bundle
- Next intended move:
  - use the Documents raw batch and this Downloads bundle as the authoritative source set for any future batch import, audit comparison, or sidecar verification replay

## 2026-04-06 - Logged the missing planning decisions for unified verification and HPO-collapse enrichment routing

- Captured the planning decision that enrichment must be defined as:
  - verified grounded phenotype claim
  - minus what is already captured by the retained HPO anchor
  - equals the clinically meaningful residual detail that survives collapse
- Frozen routing categories for future implementation and import:
  - `phenotype_enrichment`
  - `hpo_duplicate`
  - `ancillary`
  - `drop`
- Frozen collapse rule:
  - same finding as HPO anchor plus no residual detail -> `hpo_duplicate`
  - same finding as HPO anchor plus retained residual detail -> `phenotype_enrichment`
  - non-phenotype evidence -> `ancillary`
  - unsupported/context-only row -> `drop`
- Residual detail types explicitly approved to justify retained enrichment:
  - subtype
  - modality
  - anatomical specificity
  - morphology/pattern
  - laterality/distribution
  - onset timing
  - clinical course
  - severity
  - trigger
  - quantitative threshold
  - meaningful mechanism/etiology
- Also captured the practical programmed runtime for the unified sidecar:
  - raw Opus output
  - freeze into canonical raw claims
  - deterministic grounding
  - deterministic quote/status verification
  - HPO mapping
  - same-finding test
  - residual-detail extraction
  - final routing/store
- Unified verifier contract logged for future code/database work:
  - quote found
  - quote localized
  - quote strength
  - status support
  - evidence surface quality
  - verdict
- Rationale:
  - these decisions materially affect downstream database integration and 900-chapter scaling, so they need to be preserved in continuity files rather than left only in conversation state
- Next intended move:
  - implement the unified claim-ledger/routing path in the sidecar so future batch imports can distinguish HPO duplicates from true retained enrichment deterministically

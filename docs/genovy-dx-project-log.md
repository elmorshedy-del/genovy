# Genovy DX Project Log

Last updated: 2026-03-22

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

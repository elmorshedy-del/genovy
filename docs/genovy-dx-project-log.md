# Genovy DX Project Log

Last updated: 2026-03-17

## Purpose
This file is the running memory for Genovy DX. It records concrete changes, benchmark results, hypotheses, failed ideas, and next-step logic so progress is not lost between sessions.

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

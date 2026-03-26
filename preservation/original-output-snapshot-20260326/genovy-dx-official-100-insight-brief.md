# Genovy DX Official 100-Case Benchmark Brief

## Scope

This file summarizes the current strongest benchmark comparison for Genovy DX:

- Task: `phenotype-only gene ranking`
- Evaluator: `PhEval-style` comparison on the same case IDs
- Corpus slice: `100` official cases from `phenopacket_store_0.1.11_phenotypes`
- Genovy output: local PhEval-compatible run
- Comparator: published `Exomiser 14.0.2-2406` phenotype-only gene results extracted from the PhEval paper archive for the exact same `100` case IDs

This is the current best apples-to-apples baseline available in the repo.

## Primary Artifacts

- Comparison report JSON: `/Users/ahmedelmorshedy/Genovy/output/genovy-vs-exomiser-official-100.json`
- Comparison script: `/Users/ahmedelmorshedy/Genovy/scripts/pheval/compare_official_gene_runs.py`
- Genovy result directory: `/Users/ahmedelmorshedy/Genovy/output/pheval-run-official-100/pheval_gene_results`
- Exomiser result directory: `/Users/ahmedelmorshedy/Genovy/output/pheval-paper-results/exomiser-14.0.2-2406/phenopacket_store_0.1.11_phenotypes/pheval_gene_results`
- Phenopacket sample directory: `/Users/ahmedelmorshedy/Genovy/output/pheval-official-sample-100/phenopackets`

## Headline Metrics

| Metric | Genovy | Exomiser |
|---|---:|---:|
| Case count | 100 | 100 |
| Found count | 67 | 100 |
| Found % | 67.0% | 100.0% |
| Top-1 | 34 | 39 |
| Top-1 % | 34.0% | 39.0% |
| Top-3 | 42 | 46 |
| Top-3 % | 42.0% | 46.0% |
| Top-5 | 46 | 48 |
| Top-5 % | 46.0% | 48.0% |
| Top-10 | 57 | 55 |
| Top-10 % | 57.0% | 55.0% |
| Median rank | 1 | 7.5 |
| MRR | 0.405671 | 0.447212 |

## Plain-Language Read

- Exomiser is stronger overall on this slice because it finds the truth gene in all `100` cases, while Genovy finds it in `67`.
- Genovy is not weak when it does find the truth. Its top-end ranking is competitive and often sharper.
- Genovy slightly beats Exomiser on full-sample `Top-10` count: `57` vs `55`.
- The main problem is recall and coverage, not pure ranking quality.

## Head-to-Head Summary

| Comparison | Count |
|---|---:|
| Genovy ranked the truth higher than Exomiser | 28 |
| Exomiser ranked the truth higher than Genovy | 15 |
| Ties | 24 |
| Genovy found, Exomiser missed | 0 |
| Exomiser found, Genovy missed | 33 |

## What Matters Most

### 1. The core gap is recall

Genovy misses `33` cases that Exomiser finds somewhere in its ranked list.

- Genovy found count: `67`
- Exomiser found count: `100`
- Genovy-only cases: `0`
- Exomiser-only rescue cases: `33`
- Both-miss cases: `0`

This is the biggest weakness right now.

### 2. When both tools find the truth, Genovy ranks it very well

Among the `67` shared-found cases:

| Cutoff | Genovy | Exomiser |
|---|---:|---:|
| Top-1 | 34 | 34 |
| Top-3 | 42 | 40 |
| Top-5 | 46 | 41 |
| Top-10 | 57 | 46 |
| Top-20 | 66 | 54 |
| Top-50 | 67 | 63 |
| Top-100 | 67 | 65 |

Shared-found rank quality:

- Genovy median rank on shared-found cases: `1`
- Exomiser median rank on shared-found cases: `1`
- Genovy mean rank on shared-found cases: `4.55`
- Exomiser mean rank on shared-found cases: `41.28`

Interpretation:

- Once Genovy gets the true gene into the candidate list, it often places it very close to the top.
- The current job is not to rebuild ranking from scratch. The current job is to widen candidate coverage without breaking this sharp top-end behavior.

### 3. Exomiser's 100% found rate is real, but many of its rescue cases are deep

For the `33` cases that Genovy misses and Exomiser finds:

- Exomiser median rescue rank: `54`
- Exomiser mean rescue rank: `368.21`

Distribution of those `33` rescue cases:

| Exomiser cutoff | Rescue count |
|---|---:|
| Top-1 | 5 |
| Top-3 | 6 |
| Top-5 | 7 |
| Top-10 | 9 |
| Top-20 | 11 |
| Top-50 | 16 |
| Top-100 | 22 |
| Top-500 | 28 |
| Top-1000 | 30 |

Interpretation:

- Some Exomiser rescues are strong and clinically meaningful.
- A non-trivial portion are technically "found" but buried deep.
- This means Genovy's full gap is not "rank quality everywhere"; it is mainly missing candidate coverage plus some specific family blind spots.

## Recurring Miss Clusters

Top truth genes that Exomiser finds and Genovy currently misses:

| Gene | Miss count |
|---|---:|
| STXBP1 | 9 |
| SCN2A | 3 |
| ANKRD11 | 3 |
| PPP2R1A | 3 |
| WWOX | 2 |
| SATB2 | 2 |
| U2AF2 | 2 |
| ISCA2 | 1 |
| RERE | 1 |
| SMARCC2 | 1 |
| CTCF | 1 |
| SMAD3 | 1 |
| TRAF7 | 1 |
| SETD2 | 1 |
| SPTAN1 | 1 |
| SOCS1 | 1 |

Interpretation:

- The misses are not random.
- There appear to be systematic blind spots around specific disease or phenotype families.
- `STXBP1`, `SCN2A`, `ANKRD11`, and `PPP2R1A` are the highest-priority targets for error analysis.

## Representative Genovy Wins

These are cases where both tools found the truth gene, but Genovy ranked it much higher:

| Case ID | Gene | Genovy rank | Exomiser rank |
|---|---|---:|---:|
| `PMID_30690882_nan` | `COG8` | 1 | 1686 |
| `PMID_34722527_individual_individual_1_Shiyuan_Wang1_Clinicalandge` | `RPGRIP1` | 1 | 441 |
| `PMID_29058101_Patient1` | `DOCK8` | 15 | 73 |
| `PMID_35190816_STX_23934111_dl` | `STXBP1` | 12 | 53 |
| `PMID_33731876_fam415` | `SCN2A` | 6 | 46 |
| `PMID_31239556_individual29` | `CTCF` | 1 | 41 |
| `PMID_31239556_individual30` | `CTCF` | 1 | 38 |
| `PMID_34521999_43` | `SON` | 1 | 25 |
| `PMID_23714749_23714749_P11` | `MPV17` | 3 | 27 |

Interpretation:

- Genovy already has real ranking strength on a subset of cases.
- The architecture is not fundamentally weak. It has sharp local signal that needs broader coverage.

## Representative Exomiser Wins

### Strong Exomiser-only rescues

These are the most meaningful misses because Exomiser finds the truth near the top while Genovy misses it entirely:

| Case ID | Gene | Genovy rank | Exomiser rank |
|---|---|---:|---:|
| `PMID_24369382_Family1II4` | `WWOX` | miss | 1 |
| `PMID_32154675_Family4Patient11` | `SMAD3` | miss | 1 |
| `PMID_36331550_Family16Patient21` | `SPTAN1` | miss | 1 |
| `PMID_36446582_Miyatake2017_P1` | `ANKRD11` | miss | 1 |
| `PMID_36747105_proband` | `U2AF2` | miss | 1 |
| `PMID_29330883_Subject9` | `RERE` | miss | 3 |
| `PMID_35190816_STX_23934111_fh` | `STXBP1` | miss | 5 |
| `PMID_33731876_fam163` | `SCN2A` | miss | 8 |
| `PMID_35190816_STX_P_20` | `STXBP1` | miss | 8 |

### Deep Exomiser-only rescues

These are still useful, but they suggest some of Exomiser's `found` advantage is coming from very deep candidate lists:

| Case ID | Gene | Genovy rank | Exomiser rank |
|---|---|---:|---:|
| `PMID_37761890_22` | `PPP2R1A` | miss | 231 |
| `PMID_37761890_41` | `PPP2R1A` | miss | 399 |
| `PMID_37156989_P1` | `SOCS1` | miss | 455 |
| `PMID_36446582_Willemsen2010_P2` | `ANKRD11` | miss | 520 |
| `PMID_30580808_Lo_twin_2-Fam-52` | `SMARCC2` | miss | 927 |
| `PMID_37962958_43` | `U2AF2` | miss | 1374 |
| `PMID_35190816_STX_28944233_270001` | `STXBP1` | miss | 2713 |
| `PMID_33731876_fam421` | `SCN2A` | miss | 4248 |

Interpretation:

- Exomiser clearly has a broader candidate universe today.
- But not every extra "found" case is a clinically strong near-top result.

## Current Diagnosis

If a consultant is judging where the engine stands today, the most important conclusion is:

1. `Genovy already has meaningful ranking signal.`
2. `The main bottleneck is recall, not top-end ordering.`
3. `The misses appear clustered, which makes them attackable.`
4. `The next iteration should focus on candidate coverage and miss-family debugging, while protecting the current sharp ranking behavior on found cases.`

## Most Likely High-Value Next Investigations

- Analyze why `STXBP1`, `SCN2A`, `ANKRD11`, and `PPP2R1A` cases fall out of the Genovy candidate set.
- Audit missing gene-phenotype edges and disease-family coverage for those miss clusters.
- Separate "candidate generation" improvements from "ranker" improvements so recall can increase without damaging current top-rank sharpness.
- Compare phenotype profile completeness and alias resolution for the recurring miss genes.
- Add explicit error buckets for:
  - gene absent from candidate pool
  - gene present but under-scored
  - phenotype normalization mismatch
  - ontology or synonym resolution gap

## Important Caveat

This comparison is rigorous at the level of:

- same official corpus family
- same `100` case IDs
- same phenotype-only gene-ranking task

But the comparator used here is:

- published Exomiser outputs extracted from the PhEval paper archive
- not a fresh local Exomiser rerun

That makes the result valid for current analysis, but the cleanest future benchmark will still be:

- local Genovy run
- local Exomiser run
- same evaluator
- same exact slice or full official corpus

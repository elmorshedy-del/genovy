# Ranker Feature Investigation

Generated at: 2026-03-16

## Scope

- Step: `Step 2` only
- Evidence sources inspected:
  - post-enrichment benchmark source: `/Users/ahmedelmorshedy/Genovy/output/genovy-vs-exomiser-official-100-full-enrichment.json`
  - public DX API: `POST /api/dx/rank-genes` with `limit=250` to recover additional truth genes beyond the benchmark top-100 slice
  - public knowledge entity/profile APIs for supporting disease metadata and phenotype-edge provenance
  - latest CatBoost artifact found in repo: `/Users/ahmedelmorshedy/Genovy/output/ml/gene-disease-link-discovery-wide-scientific-v2/model`
- Intentionally not inspected: raw mounted Railway data, private DB dumps, or broad recursive scans

## Critical Architecture Finding

The official 100-case benchmark path is not currently using a deployed CatBoost DX ranker.

Code evidence:
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/routes/dx.js` routes `/api/dx/rank-genes` directly to `rankGenesByPhenotypeSimilarity(...)`.
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/services/dx/similarityEngine.js` computes:
  - `DX-Sim = directNormalizedScore`
  - `DX-Graph = diseaseSupportScore`
  - `Total score = max(DX-Sim, DX-Graph)`
  - tie-breaks: DX-Sim, then DX-Graph, then gene label
- `/Users/ahmedelmorshedy/Genovy/src/scripts/auditRankingPressure.js` uses the same similarity engine fields as the post-fix score source.

So the benchmarked public path currently has no trainable CatBoost feature weights to inspect. The only CatBoost artifacts present in the repo are separate gene-disease link-discovery models under `output/ml`, not the live DX benchmark route.

## Step 2a: Feature Distribution Comparison

- Cases in benchmark: `100`
- Truth genes recovered in current public top-250 slice: `89`
- Rank-1 false positives: `66`
- Supporting-disease propagation counts are only available when a candidate exposes a `supportingDiseaseCurie`; that happened for `63` truth-gene rows and `61` rank-1 rows.

| Feature | Truth gene (median) | Truth gene (mean) | Rank 1 gene (median) | Rank 1 gene (mean) |
|---|---:|---:|---:|---:|
| DX-Sim score | 0.248188 | 0.250764 | 0.256552 | 0.259886 |
| DX-Graph score | 0.183376 | 0.148503 | 0.166849 | 0.131459 |
| Total combined score | 0.24986 | 0.255823 | 0.257043 | 0.26359 |
| Has propagated phenotype edges (0/1) | 1 | 1 | 1 | 1 |
| Propagated phenotype edge count | 100 | 99.333333 | 100 | 91.688525 |
| Direct phenotype edge count | 0 | 0 | 0 | 0 |

Plain-language reading:
- Rank-1 genes still have slightly higher phenotype-only scores on average than truth genes (`DX-Sim`), which is consistent with the Step 1 finding that phenotype fit is the main pressure point.
- Truth genes have slightly higher median `DX-Graph` support than rank-1 genes, but that graph signal is not strong enough to overcome the phenotype advantage.
- On the current public disease-support path, every candidate disease with a supporting disease exposure is fully propagation-backed (`propagated_edge_ratio = 1.0`, `direct_edge_count = 0`). That means this feature is saturated and currently non-discriminative.

## Step 2b: Feature Importance Check

### Deployed benchmark path

There are no CatBoost feature importances for the deployed benchmark path because the public route is not using a CatBoost model. The current scoring rule is deterministic:

| Score component | Current role |
|---|---|
| `directNormalizedScore` | DX-Sim phenotype similarity signal |
| `diseaseSupportScore` | DX-Graph disease-support signal |
| `normalizedScore` | `max(DX-Sim, DX-Graph)` |
| Tie-break 1 | higher `DX-Sim` |
| Tie-break 2 | higher `DX-Graph` |
| Tie-break 3 | alphabetical gene label |

### Latest CatBoost artifact found in repo (not the live DX benchmark ranker)

Artifact: `/Users/ahmedelmorshedy/Genovy/output/ml/gene-disease-link-discovery-wide-scientific-v2/model`
Validation AUC: `0.999421518054532`; Average precision: `0.9989913305819532`; Best iteration: `246`

| Feature | Importance |
|---|---:|
| shared_ratio_to_disease | 25.809890 |
| disease_phenotype_count | 21.445203 |
| disease_out_degree | 14.505779 |
| shared_phenotype_count | 7.357436 |
| disease_xref_count | 6.986981 |
| phenotype_jaccard | 6.538191 |
| shared_phenotype_rarity_score | 5.643850 |
| shared_ratio_to_gene | 4.669393 |
| disease_in_degree | 3.076902 |
| gene_out_degree | 1.235890 |
| gene_phenotype_count | 1.189265 |
| disease_alias_count | 1.081181 |
| disease_trial_count | 0.397537 |
| disease_lacks_phenotype_count | 0.062503 |
| gene_alias_count | 0.000000 |
| gene_member_count | 0.000000 |
| gene_xref_count | 0.000000 |
| disease_member_count | 0.000000 |

This CatBoost model is useful as a nearby ML artifact reference, but it is not the current official 100-case DX benchmark scorer.

## Step 2c: Candidate New Features

| Candidate feature | Truth genes (n) | Truth median | Truth mean | Rank 1 false positives (n) | False-positive median | False-positive mean | Separation verdict |
|---|---:|---:|---:|---:|---:|---:|---|
| Propagated edge ratio | 63 | 1 | 1 | 45 | 1 | 1 | No separation |
| Gene-phenotype overlap score | 89 | 0.248188 | 0.250764 | 66 | 0.220809 | 0.23231 | Separates, but already present |
| ClinGen confidence numeric | 100 | 0.5 | 1.91 | 66 | 3 | 2.136364 | Does not separate in the intended direction |
| Disease specificity score | 63 | 0.028571 | 0.192444 | 45 | 0.058824 | 0.39238 | Does not separate in the intended direction |

- `Propagated edge ratio`: Both truth and false-positive supporting diseases are saturated at 1.0 on the public disease-support path.
- `Gene-phenotype overlap score`: Truth genes score higher on average than rank-1 false positives, but this is already the current DX-Sim signal.
- `ClinGen confidence numeric`: Rank-1 false positives have slightly higher ClinGen scores on average, likely because family-neighbor genes are strongly curated.
- `Disease specificity score`: Rank-1 false positives are more disease-specific on average than truth genes, likely because truth support often routes through broader umbrella diseases.

## Step 2 Recommendation

Based on Step 2 alone:
- `Gene-phenotype overlap score` is the only candidate feature that clearly separates truth genes from rank-1 false positives, but it is already present as the current DX-Sim signal. It is not a genuinely new feature for Step 3.
- `Propagated edge ratio` is not useful in the current public disease-support path because it is saturated at `1.0` for both truth and false-positive candidates. If you want to use propagation awareness in Step 3, it will need a richer disease-support representation than the current one-generic-support-disease exposure.
- `ClinGen confidence numeric` should not be added blindly; in the current post-fix state it trends slightly higher for rank-1 false positives than for truth genes.
- `Disease specificity score` also should not be added blindly; it currently points the wrong way because false positives are often attached to narrower support diseases than the truth genes.

## Step 2 Takeaway

The strongest Step 2 finding is not “we need to retrain CatBoost immediately.” It is that the benchmarked public DX path is still a rule-based `max(DX-Sim, DX-Graph)` scorer, and its exposed disease-support signal is heavily dominated by propagation-only umbrella disease profiles. That means Step 3 needs to be careful: before retraining anything, we need to decide whether we are retraining a real new DX ranker or just rebranding the existing heuristic. The only clearly discriminative candidate feature from this analysis is the direct gene-phenotype overlap score, which is already in the current path.

# Gene-Disease Link Discovery

Genovy can export a feature-rich gene-disease dataset from the canonical graph and train a CatBoost model to rank plausible missing links.

## What the pipeline does

1. Pull known `gene -> disease` links from the canonical graph as positive labels.
2. Build seeded candidate pairs from each gene's rarest phenotype signals instead of joining every gene against every phenotype-sharing disease.
3. Over-sample seeded unlabeled pairs, then drop anything that looks exact, equivalent, or same-family to a gene's known disease links before selecting hard negatives.
3. Compute graph-derived features for each pair:
   - rare-phenotype seed count
   - rare-phenotype seed rarity score
   - shared phenotype count
   - phenotype Jaccard overlap
   - inverse disease-frequency score for shared phenotypes
   - gene and disease alias/member/xref counts
   - graph degree and trial counts
4. Train CatBoost to rank likely missing links.
5. Score unlabeled candidate pairs and export the top-ranked hypotheses.

## Export a dataset

Use the Node exporter against any Genovy Postgres database:

```bash
NODE_ENV=production \
DATABASE_URL=postgresql://... \
PATH=/opt/homebrew/bin:$PATH \
npm run ml:export-gene-disease -- \
  --output-dir output/ml/gene-disease-link-discovery \
  --max-positives 30000 \
  --negative-ratio 2 \
  --candidate-limit 15000 \
  --seed-phenotypes-per-gene 8 \
  --candidate-seeds-per-gene 80 \
  --negative-buffer-multiplier 6
```

Outputs:

- `gene_disease_train.csv`
- `gene_disease_candidates.csv`
- `gene_disease_dataset_metadata.json`

Tuning notes:

- `--seed-phenotypes-per-gene` controls how many rare phenotypes each gene contributes to candidate generation.
- `--candidate-seeds-per-gene` caps how many disease hypotheses survive per gene before full feature expansion.
- `--negative-buffer-multiplier` over-samples seeded negatives before the scientific filter removes same-family and equivalent disease identities.
- Smaller values make exports faster and more conservative. Larger values improve recall but increase query cost.

## Train CatBoost

Install the ML dependency:

```bash
python3 -m pip install -r requirements-ml.txt
```

Then train and score:

```bash
python3 scripts/ml/train_gene_disease_link_model.py \
  --train-dataset output/ml/gene-disease-link-discovery/gene_disease_train.csv \
  --candidate-dataset output/ml/gene-disease-link-discovery/gene_disease_candidates.csv \
  --output-dir output/ml/gene-disease-link-discovery/model
```

Outputs:

- `gene_disease_link_model.cbm`
- `metrics.json`
- `feature_importance.json`
- `top_candidate_links.csv`

The ranked CSV now includes `gene_concept_id` and `disease_concept_id` so later analysis can resolve candidates back into the canonical graph without fuzzy re-matching.

## Run the read-only novelty filter

This step separates:

- `strict novel` candidates with no known exact/equivalent/family link
- `same-family expansion` candidates that mostly indicate graph-completion or subtype/family leakage

Run it like this:

```bash
NODE_ENV=production \
DATABASE_URL=postgresql://... \
PATH=/opt/homebrew/bin:$PATH \
npm run ml:analyze-gene-disease-novelty -- \
  --ranked-candidates output/ml/gene-disease-link-discovery/model/top_candidate_links.csv \
  --output-dir output/ml/gene-disease-link-discovery/novelty \
  --top-k 250
```

Outputs:

- `gene_disease_novelty_annotated.csv`
- `gene_disease_novel_candidates.csv`
- `gene_disease_family_expansion_candidates.csv`
- `gene_disease_novelty_summary.json`

Safety rule:

- this script opens a `READ ONLY` transaction
- it never inserts, updates, or deletes from the Genovy database
- it only writes CSV/JSON artifacts under `output/`

Current limitations:

- if a disease concept exists in the graph only as a raw code-like label such as `ORPHA:586` and has no alias/xref bridge to an equivalent MONDO concept, the novelty filter cannot automatically detect that equivalence yet
- stronger negative filtering can make validation metrics look artificially excellent if the remaining negatives become too easy, so model quality should be judged with harder negative sampling and external review, not AUC alone
- these misses are analysis-layer false positives, not database mutations

## Current smoke-run baseline

On the current production graph, a smoke export with:

```bash
--max-positives 500 --negative-ratio 1 --candidate-limit 500 --seed-phenotypes-per-gene 5 --candidate-seeds-per-gene 20
```

completed successfully and produced train/candidate CSVs plus a CatBoost model artifact. That run is intentionally small and useful for validating the pipeline, not for judging real discovery quality.

## How to interpret the output

This is hypothesis generation, not proof. High-ranked links are useful for:

- literature review
- source-gap discovery
- internal graph completion candidates
- future expert review

They are not clinical truth by themselves.

#!/usr/bin/env python3
import argparse
import csv
import hashlib
import json
import math
from pathlib import Path
from typing import Dict, List, Sequence, Tuple

try:
    from catboost import CatBoostClassifier
except ImportError as error:  # pragma: no cover - import guard
    raise SystemExit(
        "catboost is not installed. Run `python3 -m pip install -r requirements-ml.txt` first."
    ) from error


IDENTIFIER_COLUMNS = {
    "pair_id",
    "label",
    "gene_concept_id",
    "gene_curie",
    "gene_label",
    "disease_concept_id",
    "disease_curie",
    "disease_label",
}

DEFAULT_ITERATIONS = 350
DEFAULT_LEARNING_RATE = 0.06
DEFAULT_DEPTH = 6
DEFAULT_RANDOM_SEED = 42
DEFAULT_TOP_K = 100
DEFAULT_VALIDATION_STRATEGY = "gene_holdout"
DEFAULT_FEATURE_SET = "robust_rerank"
VALIDATION_MODULUS = 5
DEFAULT_EARLY_STOPPING_ROUNDS = 50

FULL_FEATURE_SET_EXCLUSIONS = set()
ROBUST_RERANK_EXCLUSIONS = {
    "seed_phenotype_count",
    "seed_phenotype_rarity_score",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train a CatBoost model to rank likely missing gene-disease links."
    )
    parser.add_argument("--train-dataset", required=True, help="CSV exported by exportGeneDiseaseLinkDataset.js")
    parser.add_argument("--candidate-dataset", help="Optional unlabeled candidate CSV to score")
    parser.add_argument("--output-dir", required=True, help="Directory for model artifacts")
    parser.add_argument("--iterations", type=int, default=DEFAULT_ITERATIONS)
    parser.add_argument("--learning-rate", type=float, default=DEFAULT_LEARNING_RATE)
    parser.add_argument("--depth", type=int, default=DEFAULT_DEPTH)
    parser.add_argument("--random-seed", type=int, default=DEFAULT_RANDOM_SEED)
    parser.add_argument("--top-k", type=int, default=DEFAULT_TOP_K)
    parser.add_argument(
        "--validation-strategy",
        choices=["pair_hash", "gene_holdout", "disease_holdout"],
        default=DEFAULT_VALIDATION_STRATEGY,
        help="How to hold out validation rows to reduce leakage.",
    )
    parser.add_argument(
        "--feature-set",
        choices=["full", "robust_rerank"],
        default=DEFAULT_FEATURE_SET,
        help="Feature preset used for model training.",
    )
    parser.add_argument(
        "--exclude-features",
        default="",
        help="Comma-separated feature names to drop in addition to the selected feature preset.",
    )
    parser.add_argument(
        "--early-stopping-rounds",
        type=int,
        default=DEFAULT_EARLY_STOPPING_ROUNDS,
    )
    return parser.parse_args()


def deterministic_bucket(key: str) -> int:
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % VALIDATION_MODULUS


def load_csv_rows(csv_path: str) -> List[Dict[str, str]]:
    with open(csv_path, "r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader)


def parse_excluded_features(raw_value: str) -> List[str]:
    if not raw_value:
        return []
    return [value.strip() for value in raw_value.split(",") if value.strip()]


def resolve_feature_exclusions(feature_set: str, extra_exclusions: Sequence[str]) -> set[str]:
    exclusions = set(FULL_FEATURE_SET_EXCLUSIONS)
    if feature_set == "robust_rerank":
        exclusions.update(ROBUST_RERANK_EXCLUSIONS)
    exclusions.update(extra_exclusions)
    return exclusions


def infer_feature_columns(fieldnames: Sequence[str], excluded_features: Sequence[str]) -> List[str]:
    exclusion_set = set(excluded_features)
    return [
        name
        for name in fieldnames
        if name not in IDENTIFIER_COLUMNS and name not in exclusion_set
    ]


def convert_feature_rows(rows: Sequence[Dict[str, str]], feature_columns: Sequence[str]) -> List[List[float]]:
    converted = []
    for row in rows:
        converted.append([float(row[column] or 0) for column in feature_columns])
    return converted


def convert_labels(rows: Sequence[Dict[str, str]]) -> List[int]:
    return [int(row["label"]) for row in rows]


def resolve_validation_group_key(row: Dict[str, str], validation_strategy: str) -> str:
    if validation_strategy == "gene_holdout":
        return f"gene:{row['gene_concept_id']}"
    if validation_strategy == "disease_holdout":
        return f"disease:{row['disease_concept_id']}"
    return f"pair:{row['pair_id']}"


def split_rows(
    rows: Sequence[Dict[str, str]],
    validation_strategy: str,
) -> Tuple[List[Dict[str, str]], List[Dict[str, str]]]:
    train_rows: List[Dict[str, str]] = []
    validation_rows: List[Dict[str, str]] = []

    for row in rows:
        group_key = resolve_validation_group_key(row, validation_strategy)
        if deterministic_bucket(group_key) == 0:
            validation_rows.append(row)
        else:
            train_rows.append(row)

    if not validation_rows:
        validation_rows = list(rows[: max(1, len(rows) // VALIDATION_MODULUS)])
        train_rows = list(rows[len(validation_rows) :])

    return train_rows, validation_rows


def compute_auc(labels: Sequence[int], probabilities: Sequence[float]) -> float:
    positives = sum(labels)
    negatives = len(labels) - positives
    if positives == 0 or negatives == 0:
        return 0.0

    ranked = sorted(zip(probabilities, labels), key=lambda item: item[0])
    rank_sum = 0.0
    for index, (_, label) in enumerate(ranked, start=1):
        if label == 1:
            rank_sum += index

    return (rank_sum - positives * (positives + 1) / 2.0) / (positives * negatives)


def compute_logloss(labels: Sequence[int], probabilities: Sequence[float]) -> float:
    epsilon = 1e-15
    total = 0.0
    for label, probability in zip(labels, probabilities):
        clipped = min(max(probability, epsilon), 1.0 - epsilon)
        total += label * math.log(clipped) + (1 - label) * math.log(1.0 - clipped)
    return -total / max(1, len(labels))


def compute_average_precision(labels: Sequence[int], probabilities: Sequence[float]) -> float:
    positives = sum(labels)
    if positives == 0:
        return 0.0

    ranked = sorted(
        zip(probabilities, labels),
        key=lambda item: item[0],
        reverse=True,
    )

    true_positives = 0
    precision_sum = 0.0
    for index, (_, label) in enumerate(ranked, start=1):
        if label == 1:
            true_positives += 1
            precision_sum += true_positives / index

    return precision_sum / positives


def compute_brier_score(labels: Sequence[int], probabilities: Sequence[float]) -> float:
    if not labels:
        return 0.0
    total = 0.0
    for label, probability in zip(labels, probabilities):
        total += (probability - label) ** 2
    return total / len(labels)


def compute_precision_recall_at_k(
    labels: Sequence[int],
    probabilities: Sequence[float],
    k: int,
) -> Dict[str, float]:
    if not labels:
        return {
            "k": k,
            "precision": 0.0,
            "recall": 0.0,
            "positives_in_top_k": 0,
        }

    ranked = sorted(
        zip(probabilities, labels),
        key=lambda item: item[0],
        reverse=True,
    )[: min(k, len(labels))]
    positives_in_top_k = sum(label for _, label in ranked)
    total_positives = sum(labels)

    return {
        "k": k,
        "precision": positives_in_top_k / max(1, len(ranked)),
        "recall": positives_in_top_k / max(1, total_positives),
        "positives_in_top_k": positives_in_top_k,
    }


def ensure_directory(path_string: str) -> Path:
    path = Path(path_string)
    path.mkdir(parents=True, exist_ok=True)
    return path


def write_json(path: Path, payload: Dict) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_ranked_candidates(
    path: Path,
    rows: Sequence[Dict[str, str]],
    probabilities: Sequence[float],
    top_k: int,
) -> None:
    ranked = sorted(
        zip(rows, probabilities),
        key=lambda item: item[1],
        reverse=True,
    )[:top_k]

    fieldnames = [
        "rank",
        "prediction_score",
        "pair_id",
        "gene_concept_id",
        "gene_curie",
        "gene_label",
        "disease_concept_id",
        "disease_curie",
        "disease_label",
        "seed_phenotype_count",
        "seed_phenotype_rarity_score",
        "shared_phenotype_count",
        "shared_phenotype_rarity_score",
        "phenotype_jaccard",
    ]

    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for rank, (row, score) in enumerate(ranked, start=1):
            writer.writerow(
                {
                    "rank": rank,
                    "prediction_score": f"{score:.6f}",
                    "pair_id": row["pair_id"],
                    "gene_concept_id": row["gene_concept_id"],
                    "gene_curie": row["gene_curie"],
                    "gene_label": row["gene_label"],
                    "disease_concept_id": row["disease_concept_id"],
                    "disease_curie": row["disease_curie"],
                    "disease_label": row["disease_label"],
                    "seed_phenotype_count": row["seed_phenotype_count"],
                    "seed_phenotype_rarity_score": row["seed_phenotype_rarity_score"],
                    "shared_phenotype_count": row["shared_phenotype_count"],
                    "shared_phenotype_rarity_score": row["shared_phenotype_rarity_score"],
                    "phenotype_jaccard": row["phenotype_jaccard"],
                }
            )


def main() -> None:
    args = parse_args()
    output_dir = ensure_directory(args.output_dir)

    rows = load_csv_rows(args.train_dataset)
    if not rows:
        raise SystemExit("Training dataset is empty.")

    excluded_features = resolve_feature_exclusions(
        args.feature_set,
        parse_excluded_features(args.exclude_features),
    )
    feature_columns = infer_feature_columns(rows[0].keys(), excluded_features)
    if not feature_columns:
        raise SystemExit("No feature columns remain after applying exclusions.")

    train_rows, validation_rows = split_rows(rows, args.validation_strategy)

    train_features = convert_feature_rows(train_rows, feature_columns)
    train_labels = convert_labels(train_rows)
    validation_features = convert_feature_rows(validation_rows, feature_columns)
    validation_labels = convert_labels(validation_rows)

    model = CatBoostClassifier(
        iterations=args.iterations,
        learning_rate=args.learning_rate,
        depth=args.depth,
        loss_function="Logloss",
        eval_metric="AUC",
        random_seed=args.random_seed,
        auto_class_weights="Balanced",
        allow_writing_files=False,
        verbose=False,
    )
    model.fit(
        train_features,
        train_labels,
        eval_set=(validation_features, validation_labels),
        use_best_model=True,
        early_stopping_rounds=args.early_stopping_rounds,
    )

    validation_probabilities = [
        float(probability[1])
        for probability in model.predict_proba(validation_features)
    ]

    metrics = {
        "train_rows": len(train_rows),
        "validation_rows": len(validation_rows),
        "positive_rate_train": sum(train_labels) / max(1, len(train_labels)),
        "positive_rate_validation": sum(validation_labels) / max(1, len(validation_labels)),
        "feature_columns": feature_columns,
        "excluded_features": sorted(excluded_features),
        "feature_set": args.feature_set,
        "validation_strategy": args.validation_strategy,
        "auc": compute_auc(validation_labels, validation_probabilities),
        "average_precision": compute_average_precision(validation_labels, validation_probabilities),
        "logloss": compute_logloss(validation_labels, validation_probabilities),
        "brier_score": compute_brier_score(validation_labels, validation_probabilities),
        "precision_recall_at_k": [
            compute_precision_recall_at_k(validation_labels, validation_probabilities, k)
            for k in (10, 25, 50)
        ],
        "best_iteration": model.get_best_iteration(),
    }

    feature_importance = [
        {
            "feature": feature,
            "importance": float(importance),
        }
        for feature, importance in zip(
            feature_columns,
            model.get_feature_importance(type="FeatureImportance"),
        )
    ]
    feature_importance.sort(key=lambda item: item["importance"], reverse=True)

    model_path = output_dir / "gene_disease_link_model.cbm"
    model.save_model(str(model_path))
    write_json(output_dir / "metrics.json", metrics)
    write_json(output_dir / "feature_importance.json", {"feature_importance": feature_importance})

    result = {
        "model_path": str(model_path),
        "metrics_path": str(output_dir / "metrics.json"),
        "feature_importance_path": str(output_dir / "feature_importance.json"),
    }

    if args.candidate_dataset:
        candidate_rows = load_csv_rows(args.candidate_dataset)
        candidate_features = convert_feature_rows(candidate_rows, feature_columns)
        candidate_probabilities = [
            float(probability[1])
            for probability in model.predict_proba(candidate_features)
        ]
        ranked_candidates_path = output_dir / "top_candidate_links.csv"
        write_ranked_candidates(
            ranked_candidates_path,
            candidate_rows,
            candidate_probabilities,
            args.top_k,
        )
        result["ranked_candidates_path"] = str(ranked_candidates_path)

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
from pathlib import Path

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers.utils import logging as transformers_logging


os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BARS", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("TRANSFORMERS_NO_ADVISORY_WARNINGS", "1")
transformers_logging.set_verbosity_error()


DEFAULT_MODEL = "FremyCompany/BioLORD-2023"
TOP_K = 3
HIGH_TRUST_THRESHOLD = 0.92
MEDIUM_TRUST_THRESHOLD = 0.85


def parse_args():
    parser = argparse.ArgumentParser(description="Map GeneReviews phenotype candidates to HPO using BioLORD embeddings.")
    parser.add_argument("--request", required=True)
    parser.add_argument("--phenotypes", required=True)
    parser.add_argument("--cache-dir", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    return parser.parse_args()


def normalize_text(value):
    return " ".join(str(value or "").lower().split())


def build_embedding_text(row):
    aliases = [alias.get("alias_label", "") for alias in row.get("aliases", []) if alias.get("alias_label")]
    alias_text = f" Synonyms: {'; '.join(aliases)}" if aliases else ""
    description = row.get("description") or ""
    return f"{row.get('canonical_label', '')}. {description}{alias_text}".strip()


def fingerprint_rows(rows):
    digest = hashlib.sha256()
    for row in rows:
      aliases = sorted(alias.get("alias_label", "") for alias in row.get("aliases", []))
      digest.update(
          json.dumps(
              {
                  "id": row.get("canonical_curie"),
                  "label": row.get("canonical_label"),
                  "description": row.get("description") or "",
                  "aliases": aliases,
              },
              sort_keys=True,
          ).encode("utf-8")
      )
    return digest.hexdigest()


def normalize_embeddings(matrix):
    matrix = np.asarray(matrix, dtype="float32")
    faiss.normalize_L2(matrix)
    return matrix


def load_or_build_index(model_name, phenotype_rows, cache_dir):
    cache_dir.mkdir(parents=True, exist_ok=True)
    metadata_path = cache_dir / "biolord_index_metadata.json"
    embeddings_path = cache_dir / "biolord_embeddings.npy"
    fingerprint = fingerprint_rows(phenotype_rows)

    embeddings = None
    metadata = None
    if metadata_path.exists() and embeddings_path.exists():
        try:
            metadata = json.loads(metadata_path.read_text())
            if metadata.get("model") == model_name and metadata.get("fingerprint") == fingerprint:
                embeddings = np.load(embeddings_path)
        except Exception:
            embeddings = None

    if embeddings is None:
        model = SentenceTransformer(model_name)
        texts = [build_embedding_text(row) for row in phenotype_rows]
        embeddings = normalize_embeddings(model.encode(texts, batch_size=128, show_progress_bar=False))
        np.save(embeddings_path, embeddings)
        metadata = {
            "model": model_name,
            "fingerprint": fingerprint,
            "phenotype_count": len(phenotype_rows),
            "embedding_dim": int(embeddings.shape[1]) if len(embeddings.shape) > 1 else 0,
        }
        metadata_path.write_text(json.dumps(metadata, indent=2) + "\n")

    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)
    return index, embeddings


def build_exact_lookup(phenotype_rows):
    lookup = {}
    for row in phenotype_rows:
        canonical = normalize_text(row.get("canonical_label", ""))
        if canonical:
            lookup[canonical] = row
        for alias in row.get("aliases", []):
            alias_label = normalize_text(alias.get("alias_label", ""))
            if alias_label and alias_label not in lookup:
                lookup[alias_label] = row
    return lookup


def trust_from_score(score):
    if score >= HIGH_TRUST_THRESHOLD:
        return "high"
    if score >= MEDIUM_TRUST_THRESHOLD:
        return "medium"
    return "reject"


def top_matches_for_vector(index, query_vector, phenotype_rows):
    scores, indices = index.search(query_vector.reshape(1, -1), TOP_K)
    matches = []
    for score, row_index in zip(scores[0], indices[0]):
        if row_index < 0:
            continue
        row = phenotype_rows[int(row_index)]
        matches.append(
            {
                "hpo_id": row["canonical_curie"],
                "hpo_label": row["canonical_label"],
                "score": float(score),
            }
        )
    return matches


def map_candidates(request, phenotype_rows, cache_dir, model_name):
    if not any(chapter.get("candidates", []) for chapter in request.get("chapters", [])):
        return {
            "model": model_name,
            "chapter_results": [
                {
                    "chapter_key": chapter.get("chapter_key", ""),
                    "nbk_id": chapter.get("nbk_id", ""),
                    "chapter_title": chapter.get("chapter_title", ""),
                    "mapped_candidates": [],
                }
                for chapter in request.get("chapters", [])
            ],
        }

    exact_lookup = build_exact_lookup(phenotype_rows)
    index, _ = load_or_build_index(model_name, phenotype_rows, cache_dir)
    model = SentenceTransformer(model_name)

    chapter_results = []
    for chapter in request.get("chapters", []):
        mapped_candidates = []
        to_encode = []
        to_encode_positions = []

        for position, candidate in enumerate(chapter.get("candidates", [])):
            exact = exact_lookup.get(normalize_text(candidate.get("label", "")))
            if exact:
                mapped_candidates.append(
                    {
                        "label": candidate.get("label", ""),
                        "status": candidate.get("status", "present"),
                        "source": candidate.get("source", "llm_candidate"),
                        "source_sentence": candidate.get("source_sentence", ""),
                        "paragraph": candidate.get("paragraph", ""),
                        "top_matches": [
                            {
                                "hpo_id": exact["canonical_curie"],
                                "hpo_label": exact["canonical_label"],
                                "score": 1.0,
                            }
                        ],
                        "mapped_hpo_id": exact["canonical_curie"],
                        "mapped_hpo_label": exact["canonical_label"],
                        "hpo_mapping_trust": "high",
                    }
                )
            else:
                mapped_candidates.append(None)
                to_encode.append(candidate.get("label", ""))
                to_encode_positions.append(position)

        if to_encode:
            query_embeddings = normalize_embeddings(model.encode(to_encode, batch_size=64, show_progress_bar=False))
            for local_index, position in enumerate(to_encode_positions):
                candidate = chapter["candidates"][position]
                matches = top_matches_for_vector(index, query_embeddings[local_index], phenotype_rows)
                best = matches[0] if matches else None
                trust = trust_from_score(best["score"]) if best else "reject"
                mapped_candidates[position] = {
                    "label": candidate.get("label", ""),
                    "status": candidate.get("status", "present"),
                    "source": candidate.get("source", "llm_candidate"),
                    "source_sentence": candidate.get("source_sentence", ""),
                    "paragraph": candidate.get("paragraph", ""),
                    "top_matches": matches,
                    "mapped_hpo_id": None if trust == "reject" or not best else best["hpo_id"],
                    "mapped_hpo_label": None if trust == "reject" or not best else best["hpo_label"],
                    "hpo_mapping_trust": trust,
                }

        chapter_results.append(
            {
                "chapter_key": chapter.get("chapter_key", ""),
                "nbk_id": chapter.get("nbk_id", ""),
                "chapter_title": chapter.get("chapter_title", ""),
                "mapped_candidates": mapped_candidates,
            }
        )
    return {
        "model": model_name,
        "chapter_results": chapter_results,
    }


def main():
    args = parse_args()
    request = json.loads(Path(args.request).read_text())
    phenotype_rows = json.loads(Path(args.phenotypes).read_text())
    output = map_candidates(request, phenotype_rows, Path(args.cache_dir), args.model)
    Path(args.output).write_text(json.dumps(output, indent=2) + "\n")


if __name__ == "__main__":
    main()

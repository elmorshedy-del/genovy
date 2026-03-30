#!/usr/bin/env python3

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

from gliner import GLiNER


DEFAULT_CLINICAL_DIR = Path(
    "/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-latest5-20260330/stage1_fetch"
)
DEFAULT_ANCHORS_DIR = Path(
    "/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-latest5-20260330/stage2_anchors"
)
DEFAULT_OUTPUT_DIR = Path(
    "/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-gliner-latest5-20260330/stage3_candidates"
)
DEFAULT_MODEL = "Ihor/gliner-biomed-small-v1.0"
DEFAULT_LIMIT = 5
DEFAULT_THRESHOLD = 0.6

GLINER_LABELS = [
    "phenotype",
    "clinical feature",
    "symptom",
    "sign",
    "developmental abnormality",
    "behavioral abnormality",
    "morphologic abnormality",
]


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", value.lower())).strip()


def dice_coefficient(left: str, right: str) -> float:
    left_norm = normalize_text(left)
    right_norm = normalize_text(right)
    if not left_norm or not right_norm:
      return 0.0
    left_tokens = set(left_norm.split(" "))
    right_tokens = set(right_norm.split(" "))
    if not left_tokens or not right_tokens:
      return 0.0
    overlap = len(left_tokens & right_tokens)
    return (2 * overlap) / (len(left_tokens) + len(right_tokens))


def matches_existing_anchor(candidate_label: str, anchors: list[dict]) -> bool:
    normalized_candidate = normalize_text(candidate_label)
    if not normalized_candidate:
        return False
    for anchor in anchors:
        if normalize_text(anchor.get("hpo_label", "")) == normalized_candidate:
            return True
        for occurrence in anchor.get("occurrences", []):
            if normalize_text(occurrence.get("match_text", "")) == normalized_candidate:
                return True
        if dice_coefficient(candidate_label, anchor.get("hpo_label", "")) >= 0.85:
            return True
    return False


def split_sentences(text: str) -> list[str]:
    return [piece.strip() for piece in re.split(r"(?<=[.!?])\s+(?=[A-Z0-9])", text or "") if piece.strip()]


def split_paragraphs(text: str) -> list[str]:
    compact = re.sub(r"\n{3,}", "\n\n", text or "")
    return [piece.strip() for piece in re.split(r"\n{2,}", compact) if piece.strip()]


def find_best_sentence_for_phrase(paragraph: str, phrase: str) -> str:
    normalized_phrase = normalize_text(phrase)
    for sentence in split_sentences(paragraph):
        if normalized_phrase in normalize_text(sentence):
            return sentence
    sentences = split_sentences(paragraph)
    return sentences[0] if sentences else paragraph


def locate_candidate_context(clinical_text: str, candidate_label: str) -> dict:
    best_score = 0.0
    best_sentence = ""
    best_paragraph = ""
    for paragraph in split_paragraphs(clinical_text):
        sentence = find_best_sentence_for_phrase(paragraph, candidate_label)
        score = max(dice_coefficient(candidate_label, paragraph), dice_coefficient(candidate_label, sentence))
        if score > best_score:
            best_score = score
            best_sentence = sentence
            best_paragraph = paragraph
    return {"source_sentence": best_sentence, "paragraph": best_paragraph}


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def load_progress(path: Path) -> dict:
    if path.exists():
        return load_json(path)
    return {
        "created_at": now_iso(),
        "total_processed": 0,
        "total_errors": 0,
        "last_index": -1,
        "last_chapter_key": "",
        "results": [],
        "errors": [],
    }


def list_jobs(clinical_dir: Path, anchors_dir: Path, limit: int) -> list[dict]:
    jobs = []
    for anchors_path in sorted(anchors_dir.glob("*_anchors.json"))[:limit]:
        stem = anchors_path.name[: -len("_anchors.json")]
        clinical_path = clinical_dir / f"{stem}_clinical_text.txt"
        if not clinical_path.exists():
            continue
        jobs.append({"stem": stem, "clinical_path": clinical_path, "anchors_path": anchors_path})
    return jobs


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--clinical", default=str(DEFAULT_CLINICAL_DIR))
    parser.add_argument("--anchors", default=str(DEFAULT_ANCHORS_DIR))
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT)
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD)
    parser.add_argument("--noResume", action="store_true")
    args = parser.parse_args()

    clinical_dir = Path(args.clinical)
    anchors_dir = Path(args.anchors)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    model = GLiNER.from_pretrained(args.model)
    jobs = list_jobs(clinical_dir, anchors_dir, args.limit)
    progress_path = output_dir / "candidates_progress.json"
    progress = load_progress(progress_path)

    for index, job in enumerate(jobs):
        output_path = output_dir / f"{job['stem']}_candidates.json"
        print(f"[{index + 1}/{len(jobs)}] {job['stem']}")
        try:
            if output_path.exists() and not args.noResume:
                progress["results"].append({"stem": job["stem"], "resumed": True})
                progress["total_processed"] += 1
                progress["last_index"] = index
                progress["last_chapter_key"] = job["stem"]
                write_json(progress_path, progress)
                continue

            clinical_text = job["clinical_path"].read_text(encoding="utf-8")
            anchor_payload = load_json(job["anchors_path"])
            anchors = anchor_payload.get("anchors", [])

            entities = model.predict_entities(clinical_text, GLINER_LABELS, threshold=args.threshold)
            deduped = {}
            for entity in entities:
                label = str(entity.get("text", "")).strip()
                if not label:
                    continue
                if matches_existing_anchor(label, anchors):
                    continue
                normalized_label = normalize_text(label)
                entity_score = float(entity.get("score", 0.0))
                if normalized_label in deduped:
                    if entity_score <= deduped[normalized_label]["gliner_score"]:
                        continue
                context = locate_candidate_context(clinical_text, label)
                deduped[normalized_label] = {
                    "label": label,
                    "status": "present",
                    "source": "gliner_candidate",
                    "source_sentence": context["source_sentence"],
                    "paragraph": context["paragraph"],
                    "gliner_label": entity.get("label", ""),
                    "gliner_score": entity_score,
                }

            candidates = list(deduped.values())
            write_json(
                output_path,
                {
                    "created_at": now_iso(),
                    "stage": "candidates",
                    "provider": "gliner",
                    "model": args.model,
                    "chapter_stem": job["stem"],
                    "candidate_count": len(candidates),
                    "candidates": candidates,
                },
            )

            progress["results"].append({"stem": job["stem"], "candidateCount": len(candidates)})
            progress["total_processed"] += 1
            progress["last_index"] = index
            progress["last_chapter_key"] = job["stem"]
            write_json(progress_path, progress)
        except Exception as error:
            progress["errors"].append({"stem": job["stem"], "error": str(error)})
            progress["total_errors"] += 1
            progress["last_index"] = index
            progress["last_chapter_key"] = job["stem"]
            write_json(progress_path, progress)
            print(f"  ERROR: {error}")

    write_json(
        output_dir / "candidates_summary.json",
        {
            "created_at": now_iso(),
            "stage": "candidates",
            "provider": "gliner",
            "model": args.model,
            "total_processed": progress["total_processed"],
            "total_errors": progress["total_errors"],
            "results": progress["results"],
            "errors": progress["errors"],
        },
    )


if __name__ == "__main__":
    main()

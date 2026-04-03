#!/usr/bin/env python3

import argparse
import json
import re
import subprocess
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from gliner import GLiNER


DEFAULT_INPUT = Path(
    "/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test/fixtures/stage3DiscoveryBenchmarkFull.js"
)
DEFAULT_OUTPUT_DIR = Path(
    "/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/stage3_discovery_gliner_benchmark_20260402"
)
DEFAULT_MODEL = "Ihor/gliner-biomed-small-v1.0"
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


def parse_labels(raw_labels: str | None):
    if not raw_labels:
        return GLINER_LABELS
    labels = [item.strip() for item in str(raw_labels).split(",") if item.strip()]
    return labels or GLINER_LABELS


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", str(value or "").lower())).strip()


def load_benchmark(path: Path):
    node_code = f"""
const fs = require('fs');
const vm = require('vm');
const raw = fs.readFileSync({json.dumps(str(path))}, 'utf8');
const sandbox = {{ module: {{ exports: {{}} }}, exports: {{}} }};
vm.createContext(sandbox);
vm.runInContext(raw + "\\nthis.__cases = typeof DISCOVERY_BENCHMARK !== 'undefined' ? DISCOVERY_BENCHMARK : (module.exports?.DISCOVERY_BENCHMARK || null);", sandbox, {{
  timeout: 1000,
  filename: {json.dumps(str(path))}
}});
if (!Array.isArray(sandbox.__cases)) {{
  throw new Error('Failed to load DISCOVERY_BENCHMARK');
}}
process.stdout.write(JSON.stringify(sandbox.__cases));
"""
    result = subprocess.run(
        ["node", "-e", node_code],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


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


def split_sentences(text: str):
    return [piece.strip() for piece in re.split(r"(?<=[.!?])\s+(?=[A-Z0-9])", text or "") if piece.strip()]


def split_paragraphs(text: str):
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


def matches_existing_anchor(candidate_label: str, anchors: list[dict]) -> bool:
    normalized_candidate = normalize_text(candidate_label)
    if not normalized_candidate:
        return False
    for anchor in anchors:
        if normalize_text(anchor.get("hpo_label", "")) == normalized_candidate:
            return True
        for match_text in anchor.get("match_texts", []) or []:
            if normalize_text(match_text) == normalized_candidate:
                return True
        if dice_coefficient(candidate_label, anchor.get("hpo_label", "")) >= 0.85:
            return True
    return False


def predict_case(model, case, threshold: float, labels: list[str]):
    entities = model.predict_entities(case["clinical_text"], labels, threshold=threshold)
    deduped = {}
    for entity in entities:
        label = str(entity.get("text", "")).strip()
        if not label:
            continue
        if matches_existing_anchor(label, case.get("existing_anchors", [])):
            continue
        normalized_label = normalize_text(label)
        score = float(entity.get("score", 0.0))
        if normalized_label in deduped and score <= deduped[normalized_label]["gliner_score"]:
            continue
        context = locate_candidate_context(case["clinical_text"], label)
        deduped[normalized_label] = {
            "label": label,
            "status": "present",
            "source_sentence": context["source_sentence"],
            "paragraph": context["paragraph"],
            "gliner_label": entity.get("label", ""),
            "gliner_score": score,
        }
    return list(deduped.values())


def candidate_matches(candidate: dict, expected: dict) -> bool:
    if candidate.get("status", "present") != expected.get("status", "present"):
        return False
    left = candidate.get("label", "")
    right = expected.get("label", "")
    if not left or not right:
        return False
    return (
        normalize_text(left) == normalize_text(right)
        or normalize_text(left) in normalize_text(right)
        or normalize_text(right) in normalize_text(left)
        or dice_coefficient(left, right) >= 0.8
    )


def evaluate_case(case, predicted_candidates):
    expected = case.get("expectedNewCandidates", [])
    must_not = case.get("mustNotPropose", [])
    acceptable = case.get("acceptableExtraCandidates", [])

    consumed = set()
    matched_expected = []
    missed_expected = []
    for expected_candidate in expected:
        found_index = -1
        found_candidate = None
        for index, candidate in enumerate(predicted_candidates):
            if index in consumed:
                continue
            if candidate_matches(candidate, expected_candidate):
                found_index = index
                found_candidate = candidate
                break
        if found_index >= 0:
            consumed.add(found_index)
            matched_expected.append({"expected": expected_candidate, "predicted": found_candidate})
        else:
            missed_expected.append(expected_candidate)

    must_not_violations = []
    for blocked in must_not:
        for index, candidate in enumerate(predicted_candidates):
            if index in consumed:
                continue
            if candidate_matches(candidate, {"label": blocked["label"], "status": "present"}):
                must_not_violations.append(
                    {
                        "label": blocked["label"],
                        "reason": blocked["reason"],
                        "predicted": candidate,
                    }
                )
                break

    acceptable_matches = []
    unexpected = []
    for index, candidate in enumerate(predicted_candidates):
        if index in consumed:
            continue
        matched_alt = False
        for alt in acceptable:
            if candidate_matches(candidate, alt):
                acceptable_matches.append({"expected": alt, "predicted": candidate})
                matched_alt = True
                break
        if not matched_alt:
            unexpected.append(candidate)

    strict_exact = len(missed_expected) == 0 and len(must_not_violations) == 0 and len(unexpected) == 0
    acceptable_exact = len(missed_expected) == 0 and len(must_not_violations) == 0

    return {
        "matchedExpectedCandidates": matched_expected,
        "missedExpectedCandidates": missed_expected,
        "mustNotProposeViolations": must_not_violations,
        "acceptableExtraMatches": acceptable_matches,
        "unexpectedPredictedCandidates": unexpected,
        "strictExactCaseMatch": strict_exact,
        "acceptableExactCaseMatch": acceptable_exact,
    }


def build_summary(cases, evaluated_cases):
    summary = {
        "total": len(cases),
        "strictExactMatchCount": 0,
        "acceptableExactMatchCount": 0,
        "expectedCandidateTotal": 0,
        "matchedExpectedCandidateTotal": 0,
        "mustNotProposeTotal": 0,
        "mustNotProposeViolationTotal": 0,
        "byCategory": {},
    }

    for case, evaluated in zip(cases, evaluated_cases):
        category = case.get("id", "unknown").split("-")[0]
        bucket = summary["byCategory"].setdefault(
            category,
            {
                "total": 0,
                "strictExactMatchCount": 0,
                "acceptableExactMatchCount": 0,
                "expectedCandidateTotal": 0,
                "matchedExpectedCandidateTotal": 0,
                "mustNotProposeTotal": 0,
                "mustNotProposeViolationTotal": 0,
            },
        )
        bucket["total"] += 1
        summary["expectedCandidateTotal"] += len(case.get("expectedNewCandidates", []))
        summary["matchedExpectedCandidateTotal"] += len(evaluated["matchedExpectedCandidates"])
        summary["mustNotProposeTotal"] += len(case.get("mustNotPropose", []))
        summary["mustNotProposeViolationTotal"] += len(evaluated["mustNotProposeViolations"])
        bucket["expectedCandidateTotal"] += len(case.get("expectedNewCandidates", []))
        bucket["matchedExpectedCandidateTotal"] += len(evaluated["matchedExpectedCandidates"])
        bucket["mustNotProposeTotal"] += len(case.get("mustNotPropose", []))
        bucket["mustNotProposeViolationTotal"] += len(evaluated["mustNotProposeViolations"])

        if evaluated["strictExactCaseMatch"]:
            summary["strictExactMatchCount"] += 1
            bucket["strictExactMatchCount"] += 1
        if evaluated["acceptableExactCaseMatch"]:
            summary["acceptableExactMatchCount"] += 1
            bucket["acceptableExactMatchCount"] += 1

    summary["strictExactMatchRate"] = round(summary["strictExactMatchCount"] / summary["total"], 4) if summary["total"] else 0
    summary["acceptableExactMatchRate"] = round(summary["acceptableExactMatchCount"] / summary["total"], 4) if summary["total"] else 0
    summary["expectedCandidateRecall"] = (
        round(summary["matchedExpectedCandidateTotal"] / summary["expectedCandidateTotal"], 4)
        if summary["expectedCandidateTotal"]
        else 0
    )
    summary["mustNotProposePassRate"] = (
        round(
            (summary["mustNotProposeTotal"] - summary["mustNotProposeViolationTotal"]) / summary["mustNotProposeTotal"],
            4,
        )
        if summary["mustNotProposeTotal"]
        else 1
    )

    for bucket in summary["byCategory"].values():
        bucket["strictExactMatchRate"] = round(bucket["strictExactMatchCount"] / bucket["total"], 4) if bucket["total"] else 0
        bucket["acceptableExactMatchRate"] = (
            round(bucket["acceptableExactMatchCount"] / bucket["total"], 4) if bucket["total"] else 0
        )
        bucket["expectedCandidateRecall"] = (
            round(bucket["matchedExpectedCandidateTotal"] / bucket["expectedCandidateTotal"], 4)
            if bucket["expectedCandidateTotal"]
            else 0
        )
        bucket["mustNotProposePassRate"] = (
            round(
                (bucket["mustNotProposeTotal"] - bucket["mustNotProposeViolationTotal"]) / bucket["mustNotProposeTotal"],
                4,
            )
            if bucket["mustNotProposeTotal"]
            else 1
        )

    return summary


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default=str(DEFAULT_INPUT))
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD)
    parser.add_argument("--labels", default=",".join(GLINER_LABELS))
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()
    labels = parse_labels(args.labels)

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    benchmark = load_benchmark(Path(args.input))
    if args.limit and args.limit > 0:
        benchmark = benchmark[: args.limit]

    model = GLiNER.from_pretrained(args.model)
    evaluated_cases = []

    for index, case in enumerate(benchmark):
        print(f"[{index + 1}/{len(benchmark)}] {case['id']} {case['chapter_title']}")
        predicted = predict_case(model, case, args.threshold, labels)
        evaluation = evaluate_case(case, predicted)
        evaluated_cases.append(
            {
                **case,
                "predictedCandidates": predicted,
                **evaluation,
            }
        )

    summary = build_summary(benchmark, evaluated_cases)

    write_json(
        output_dir / "stage3_discovery_gliner_summary.json",
        {
            "created_at": now_iso(),
            "provider": "gliner",
            "model": args.model,
            "threshold": args.threshold,
            "labels": labels,
            "input": str(args.input),
            "summary": summary,
        },
    )
    write_json(
        output_dir / "stage3_discovery_gliner_report.json",
        {
            "created_at": now_iso(),
            "provider": "gliner",
            "model": args.model,
            "threshold": args.threshold,
            "labels": labels,
            "input": str(args.input),
            "case_count": len(benchmark),
            "cases": evaluated_cases,
        },
    )

    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
import argparse
import json
import re
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


PUBTATOR_SUBMIT_URL = "https://www.ncbi.nlm.nih.gov/research/pubtator-api/annotations/annotate/submit/Phenotype"
PUBTATOR_RETRIEVE_URL = "https://www.ncbi.nlm.nih.gov/research/pubtator-api/annotations/annotate/retrieve/"
SENTENCE_SPLIT_REGEX = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9])")
INSECURE_SSL_CONTEXT = ssl._create_unverified_context()


def parse_args():
    parser = argparse.ArgumentParser(description="Extract PhenoTagger phenotype anchors through the PubTator API.")
    parser.add_argument("--policy", required=True)
    parser.add_argument("--input", required=True, dest="input_dir")
    parser.add_argument("--output", required=True, dest="output_dir")
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--poll-seconds", type=int, default=30)
    parser.add_argument("--max-wait-seconds", type=int, default=1800)
    parser.add_argument("--no-resume", action="store_true")
    return parser.parse_args()


def normalize_text(value):
    return re.sub(r"\s+", " ", str(value or "").lower()).strip()


def slugify(value):
    return re.sub(r"[^A-Za-z0-9]+", "_", str(value or "")).strip("_")


def split_paragraphs(text):
    return [paragraph.strip() for paragraph in re.split(r"\n{2,}", str(text or "").strip()) if paragraph.strip()]


def split_sentences(text):
    return [sentence.strip() for sentence in SENTENCE_SPLIT_REGEX.split(str(text or "").strip()) if sentence.strip()]


def flatten_text(text):
    return re.sub(r"\s+", " ", str(text or "")).strip()


def submit_pubtator_record(record_text):
    request = urllib.request.Request(
        PUBTATOR_SUBMIT_URL,
        data=record_text.encode("utf-8"),
        method="POST",
        headers={"Content-Type": "text/plain; charset=utf-8"},
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            return response.read().decode("utf-8").strip()
    except urllib.error.URLError as error:
        if "CERTIFICATE_VERIFY_FAILED" not in str(error):
            raise
        with urllib.request.urlopen(request, timeout=120, context=INSECURE_SSL_CONTEXT) as response:
            return response.read().decode("utf-8").strip()


def retrieve_pubtator_result(session_id):
    url = f"{PUBTATOR_RETRIEVE_URL}{urllib.parse.quote(session_id)}"
    try:
        with urllib.request.urlopen(url, timeout=120) as response:
            return response.status, response.read().decode("utf-8")
    except urllib.error.URLError as error:
        if "CERTIFICATE_VERIFY_FAILED" not in str(error):
            raise
        with urllib.request.urlopen(url, timeout=120, context=INSECURE_SSL_CONTEXT) as response:
            return response.status, response.read().decode("utf-8")


def poll_result(session_id, poll_seconds, max_wait_seconds):
    started = time.time()
    while True:
        try:
            status, body = retrieve_pubtator_result(session_id)
            if status == 200 and body.strip():
                return body
        except urllib.error.HTTPError as error:
            if error.code not in (404, 503):
                raise
        if time.time() - started >= max_wait_seconds:
            raise TimeoutError(f"Timed out waiting for PubTator session {session_id}")
        time.sleep(poll_seconds)


def parse_pubtator_annotations(raw_text):
    annotations = []
    for line in raw_text.splitlines():
        if not line or "|t|" in line or "|a|" in line:
            continue
        parts = line.split("\t")
        if len(parts) < 5:
            continue
        mention = parts[3].strip()
        concept_type = parts[4].strip()
        remainder = "\t".join(parts[5:]).strip()
        if concept_type.lower() != "phenotype":
            continue
        hp_match = re.search(r"(HP:\d+)", remainder, flags=re.IGNORECASE)
        if not hp_match:
            continue
        annotations.append(
            {
                "hpo_id": hp_match.group(1).upper(),
                "mention": mention,
                "raw_remainder": remainder,
            }
        )
    return annotations


def locate_context(clinical_text, mention):
    normalized_mention = normalize_text(mention)
    paragraphs = split_paragraphs(clinical_text)
    for paragraph_index, paragraph in enumerate(paragraphs, start=1):
        if normalized_mention not in normalize_text(paragraph):
            continue
        for sentence in split_sentences(paragraph):
            if normalized_mention in normalize_text(sentence):
                return paragraph_index, sentence, paragraph
        return paragraph_index, split_sentences(paragraph)[0] if split_sentences(paragraph) else paragraph, paragraph

    fallback_sentence = split_sentences(clinical_text)
    return 1, fallback_sentence[0] if fallback_sentence else "", paragraphs[0] if paragraphs else clinical_text


def merge_annotations(annotations, clinical_text):
    merged = {}
    for annotation in annotations:
        paragraph_index, sentence, paragraph = locate_context(clinical_text, annotation["mention"])
        anchor = merged.setdefault(
            annotation["hpo_id"],
            {
                "hpo_id": annotation["hpo_id"],
                "match_types": ["phenotagger_api"],
                "occurrences": [],
            },
        )
        anchor["occurrences"].append(
            {
                "match_text": annotation["mention"],
                "sentence": sentence,
                "paragraph": paragraph,
                "match_type": "phenotagger_api",
                "paragraph_index": paragraph_index,
            }
        )
    return list(merged.values())


def main():
    args = parse_args()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    policy = json.loads(Path(args.policy).read_text())
    chapters = (policy.get("chapters") or [])[args.start : args.start + args.limit]
    progress_path = output_dir / "phenotagger_api_progress.json"
    progress = {"results": [], "errors": [], "total_processed": 0, "total_errors": 0}
    if progress_path.exists():
      try:
        progress = json.loads(progress_path.read_text())
      except Exception:
        pass

    for offset, chapter in enumerate(chapters):
        absolute_index = args.start + offset
        file_stem = chapter.get("nbkId") or slugify(
            chapter.get("chapterTitle")
            or chapter.get("chapter_title")
            or chapter.get("chapterKey")
            or f"chapter_{absolute_index + 1}"
        )
        text_path = Path(args.input_dir) / f"{file_stem}_clinical_text.txt"
        output_path = output_dir / f"{file_stem}_phenotagger_anchors.json"
        print(f"[{absolute_index + 1}] {chapter.get('chapterTitle') or chapter.get('chapterKey')}")

        try:
            if not text_path.exists():
                raise FileNotFoundError(f"Missing clinical text: {text_path}")
            if output_path.exists() and not args.no_resume:
                progress["results"].append({"chapterKey": chapter.get("chapterKey"), "nbkId": chapter.get("nbkId"), "resumed": True})
                progress["total_processed"] += 1
                progress_path.write_text(json.dumps(progress, indent=2) + "\n")
                continue

            clinical_text = text_path.read_text()
            flattened = flatten_text(clinical_text)
            pmid = str(absolute_index + 1)
            title = flatten_text(chapter.get("chapterTitle") or chapter.get("chapter_title") or chapter.get("chapterKey") or "GeneReviews chapter")
            record = f"{pmid}|t|{title}\n{pmid}|a|{flattened}\n"

            session_id = submit_pubtator_record(record)
            raw_result = poll_result(session_id, args.poll_seconds, args.max_wait_seconds)
            parsed_annotations = parse_pubtator_annotations(raw_result)
            anchors = merge_annotations(parsed_annotations, clinical_text)

            payload = {
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "stage": "phenotagger_api_anchors",
                "chapter_key": chapter.get("chapterKey", ""),
                "nbk_id": chapter.get("nbkId", ""),
                "chapter_title": chapter.get("chapterTitle") or chapter.get("chapter_title") or "",
                "session_id": session_id,
                "anchor_count": len(anchors),
                "anchors": anchors,
            }
            output_path.write_text(json.dumps(payload, indent=2) + "\n")
            progress["results"].append(
                {
                    "chapterKey": chapter.get("chapterKey"),
                    "nbkId": chapter.get("nbkId"),
                    "anchorCount": len(anchors),
                }
            )
            progress["total_processed"] += 1
            progress_path.write_text(json.dumps(progress, indent=2) + "\n")
        except Exception as error:
            progress["errors"].append(
                {
                    "chapterKey": chapter.get("chapterKey"),
                    "nbkId": chapter.get("nbkId"),
                    "error": str(error),
                }
            )
            progress["total_errors"] += 1
            progress_path.write_text(json.dumps(progress, indent=2) + "\n")
            print(f"  ERROR: {error}")

    summary = {
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "stage": "phenotagger_api_anchors",
        "total_processed": progress["total_processed"],
        "total_errors": progress["total_errors"],
        "results": progress["results"],
        "errors": progress["errors"],
    }
    (output_dir / "phenotagger_api_summary.json").write_text(json.dumps(summary, indent=2) + "\n")


if __name__ == "__main__":
    main()

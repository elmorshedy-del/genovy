#!/usr/bin/env python3
import json
import re
import sys

import spacy

MODEL_NAME = "en_core_sci_sm"
MODIFIER_DEPS = {"amod", "nmod", "compound", "appos"}
GENERIC_ONSET_HEADS = {"adult", "adults", "child", "children", "individual", "individuals", "person", "persons"}


def load_payload():
    raw = sys.stdin.read()
    if not raw.strip():
        return {"items": []}
    return json.loads(raw)


def normalize(text):
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", str(text or "").lower())).strip()


def find_case_insensitive_index(text, phrase):
    source = str(text or "")
    needle = str(phrase or "").strip()
    if not source or not needle:
        return -1
    return source.lower().find(needle.lower())


def build_char_span(doc, text, phrase):
    index = find_case_insensitive_index(text, phrase)
    if index == -1:
        return None
    return doc.char_span(index, index + len(phrase), alignment_mode="expand")


def span_head(span):
    if span is None or len(span) == 0:
        return None
    token_ids = {token.i for token in span}
    for token in span:
        if token.head.i not in token_ids:
            return token
    return span[-1]


def token_in_span(token, span):
    if token is None or span is None:
        return False
    return span.start <= token.i < span.end


def resolve_modifier_target(token):
    if token is None:
        return None
    current = token
    seen = set()
    while current is not None and current.i not in seen:
        seen.add(current.i)
        if current.dep_ in MODIFIER_DEPS and current.head is not current:
            return current.head
        if current.dep_ == "conj" and current.head is not current:
            current = current.head
            continue
        return None
    return None


def classify_item(nlp, item):
    sentence = str(item.get("sentence") or "").strip()
    phenotype_phrase = str(item.get("phenotype_phrase") or "").strip()
    metadata_phrase = str(item.get("metadata_phrase") or "").strip()
    field = str(item.get("field") or "").strip()

    if not sentence or not phenotype_phrase or not metadata_phrase:
        return {"id": item.get("id"), "verdict": "unknown", "reason": "missing_input"}

    doc = nlp(sentence)
    phenotype_span = build_char_span(doc, sentence, phenotype_phrase)
    metadata_span = build_char_span(doc, sentence, metadata_phrase)

    if phenotype_span is None:
        return {"id": item.get("id"), "verdict": "unknown", "reason": "phenotype_not_found"}
    if metadata_span is None:
        return {"id": item.get("id"), "verdict": "unknown", "reason": "metadata_not_found"}

    metadata_head = span_head(metadata_span)
    phenotype_head = span_head(phenotype_span)
    modifier_target = resolve_modifier_target(metadata_head)

    if modifier_target is not None:
        if token_in_span(modifier_target, phenotype_span):
            return {
                "id": item.get("id"),
                "verdict": "pass",
                "reason": "modifier_targets_phenotype",
                "metadata_head": metadata_head.text,
                "target_head": modifier_target.text
            }
        if field == "onset_raw" and normalize(modifier_target.text) in GENERIC_ONSET_HEADS:
            return {
                "id": item.get("id"),
                "verdict": "unknown",
                "reason": "onset_targets_generic_person",
                "metadata_head": metadata_head.text,
                "target_head": modifier_target.text
            }
        return {
            "id": item.get("id"),
            "verdict": "fail",
            "reason": "modifier_targets_other_noun",
            "metadata_head": metadata_head.text,
            "target_head": modifier_target.text
        }

    return {
        "id": item.get("id"),
        "verdict": "unknown",
        "reason": "no_resolved_modifier_target",
        "metadata_head": metadata_head.text if metadata_head is not None else None,
        "phenotype_head": phenotype_head.text if phenotype_head is not None else None
    }


def main():
    payload = load_payload()
    items = payload.get("items") or []
    nlp = spacy.load(MODEL_NAME)
    results = [classify_item(nlp, item) for item in items]
    sys.stdout.write(json.dumps({"items": results}))


if __name__ == "__main__":
    main()

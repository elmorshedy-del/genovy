#!/usr/bin/env python3
import argparse
import json
import os
import re
import sys
import time
from pathlib import Path


SENTENCE_SPLIT_REGEX = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9])")
DEFAULT_PHENOTAGGER_ROOT = os.environ.get(
    "PHENOTAGGER_HOME",
    "/Users/ahmedelmorshedy/.cache/phenotagger",
)
NLTK_RESOURCES = (
    ("tokenizers/punkt", "punkt"),
    ("taggers/averaged_perceptron_tagger", "averaged_perceptron_tagger"),
    ("corpora/wordnet", "wordnet"),
    ("corpora/omw-1.4", "omw-1.4"),
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Extract PhenoTagger phenotype anchors with the local official PhenoTagger release."
    )
    parser.add_argument("--policy", required=True)
    parser.add_argument("--input", required=True, dest="input_dir")
    parser.add_argument("--output", required=True, dest="output_dir")
    parser.add_argument("--phenotaggerRoot", default=DEFAULT_PHENOTAGGER_ROOT)
    parser.add_argument("--modelType", default="pubmedbert")
    parser.add_argument("--threshold", type=float, default=0.95)
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--no-resume", dest="no_resume", action="store_true")
    parser.add_argument("--noResume", dest="no_resume", action="store_true")
    return parser.parse_args()


def normalize_text(value):
    return re.sub(r"\s+", " ", str(value or "").lower()).strip()


def slugify(value):
    return re.sub(r"[^A-Za-z0-9]+", "_", str(value or "")).strip("_")


def split_paragraphs(text):
    return [paragraph.strip() for paragraph in re.split(r"\n{2,}", str(text or "").strip()) if paragraph.strip()]


def split_sentences(text):
    return [sentence.strip() for sentence in SENTENCE_SPLIT_REGEX.split(str(text or "").strip()) if sentence.strip()]


def ensure_phenotagger_root(phenotagger_root):
    root = Path(phenotagger_root).expanduser().resolve()
    src_dir = root / "src"
    if not src_dir.exists():
        raise FileNotFoundError(f"Missing PhenoTagger src directory: {src_dir}")
    if str(src_dir) not in sys.path:
        sys.path.insert(0, str(src_dir))
    return root


def ensure_nltk_resources():
    import nltk

    for resource_path, package_name in NLTK_RESOURCES:
        try:
            nltk.data.find(resource_path)
        except LookupError:
            nltk.download(package_name, quiet=True)


def build_model_paths(phenotagger_root, model_type):
    dict_root = phenotagger_root / "dict"
    model_root = phenotagger_root / "models"
    ontfiles = {
        "dic_file": str(dict_root / "noabb_lemma.dic"),
        "word_hpo_file": str(dict_root / "word_id_map.json"),
        "hpo_word_file": str(dict_root / "id_word_map.json"),
    }

    if model_type == "cnn":
        vocabfiles = {
            "w2vfile": str(model_root / "bio_embedding_intrinsic.d200"),
            "charfile": str(dict_root / "char.vocab"),
            "labelfile": str(dict_root / "lable.vocab"),
            "posfile": str(dict_root / "pos.vocab"),
        }
        modelfile = str(model_root / "cnn_hpo_v1.1.h5")
    elif model_type == "bioformer":
        vocabfiles = {
            "labelfile": str(dict_root / "lable.vocab"),
            "checkpoint_path": str(model_root / "bioformer-cased-v1.0"),
            "lowercase": False,
        }
        modelfile = str(model_root / "bioformer_PT_v1.2.h5")
    elif model_type == "biobert":
        vocabfiles = {
            "labelfile": str(dict_root / "lable.vocab"),
            "checkpoint_path": str(model_root / "biobert-base-cased-v1.2"),
            "lowercase": False,
        }
        modelfile = str(model_root / "biobert-PT.h5")
    else:
        vocabfiles = {
            "labelfile": str(dict_root / "lable.vocab"),
            "checkpoint_path": str(model_root / "BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext"),
            "lowercase": True,
        }
        modelfile = str(model_root / "pubmedbert_PT_v1.2.h5")

    return ontfiles, vocabfiles, modelfile


def load_phenotagger_runtime(phenotagger_root, model_type):
    ensure_nltk_resources()
    from dic_ner import dic_ont
    from nn_model import bioTag_BERT, bioTag_CNN
    from tagging_text import bioTag

    ontfiles, vocabfiles, model_file = build_model_paths(phenotagger_root, model_type)
    for required_path in [*ontfiles.values(), *vocabfiles.values(), model_file]:
        if not isinstance(required_path, (str, os.PathLike)):
            continue
        if not Path(required_path).exists():
            raise FileNotFoundError(f"Missing required PhenoTagger asset: {required_path}")

    biotag_dic = dic_ont(ontfiles)
    if model_type == "cnn":
        nn_model = bioTag_CNN(vocabfiles)
    else:
        nn_model = bioTag_BERT(vocabfiles)
    nn_model.load_model(model_file)
    return bioTag, biotag_dic, nn_model


def locate_context(clinical_text, mention):
    normalized_mention = normalize_text(mention)
    paragraphs = split_paragraphs(clinical_text)
    for paragraph_index, paragraph in enumerate(paragraphs, start=1):
        if normalized_mention not in normalize_text(paragraph):
            continue
        for sentence in split_sentences(paragraph):
            if normalized_mention in normalize_text(sentence):
                return paragraph_index, sentence, paragraph
        sentences = split_sentences(paragraph)
        return paragraph_index, sentences[0] if sentences else paragraph, paragraph

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
                "match_types": ["phenotagger_local"],
                "occurrences": [],
            },
        )
        anchor["occurrences"].append(
            {
                "match_text": annotation["mention"],
                "sentence": sentence,
                "paragraph": paragraph,
                "match_type": "phenotagger_local",
                "paragraph_index": paragraph_index,
                "start": annotation["start"],
                "end": annotation["end"],
                "score": annotation["score"],
            }
        )
    return list(merged.values())


def tag_annotations(clinical_text, bio_tag, biotag_dic, nn_model, threshold):
    raw_hits = bio_tag(
        clinical_text,
        biotag_dic,
        nn_model,
        onlyLongest=True,
        abbrRecog=True,
        Threshold=threshold,
    )
    annotations = []
    for start, end, hpo_id, score in raw_hits:
        start_int = int(start)
        end_int = int(end)
        annotations.append(
            {
                "hpo_id": str(hpo_id).upper(),
                "mention": clinical_text[start_int:end_int],
                "start": start_int,
                "end": end_int,
                "score": float(score),
            }
        )
    return annotations


def main():
    args = parse_args()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    phenotagger_root = ensure_phenotagger_root(args.phenotaggerRoot)
    policy = json.loads(Path(args.policy).read_text())
    chapters = (policy.get("chapters") or [])[args.start : args.start + args.limit]
    progress_path = output_dir / "phenotagger_local_progress.json"
    progress = {"results": [], "errors": [], "total_processed": 0, "total_errors": 0}
    if progress_path.exists():
        try:
            progress = json.loads(progress_path.read_text())
        except Exception:
            pass

    load_started = time.time()
    bio_tag, biotag_dic, nn_model = load_phenotagger_runtime(phenotagger_root, args.modelType)
    model_load_seconds = round(time.time() - load_started, 3)

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
                progress["results"].append(
                    {"chapterKey": chapter.get("chapterKey"), "nbkId": chapter.get("nbkId"), "resumed": True}
                )
                progress["total_processed"] += 1
                progress_path.write_text(json.dumps(progress, indent=2) + "\n")
                continue

            clinical_text = text_path.read_text()
            started = time.time()
            parsed_annotations = tag_annotations(clinical_text, bio_tag, biotag_dic, nn_model, args.threshold)
            anchors = merge_annotations(parsed_annotations, clinical_text)

            payload = {
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "stage": "phenotagger_local_anchors",
                "chapter_key": chapter.get("chapterKey", ""),
                "nbk_id": chapter.get("nbkId", ""),
                "chapter_title": chapter.get("chapterTitle") or chapter.get("chapter_title") or "",
                "phenotagger_root": str(phenotagger_root),
                "model_type": args.modelType,
                "threshold": args.threshold,
                "model_load_seconds": model_load_seconds,
                "tag_seconds": round(time.time() - started, 3),
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
        "stage": "phenotagger_local_anchors",
        "phenotagger_root": str(phenotagger_root),
        "model_type": args.modelType,
        "threshold": args.threshold,
        "model_load_seconds": model_load_seconds,
        "total_processed": progress["total_processed"],
        "total_errors": progress["total_errors"],
        "results": progress["results"],
        "errors": progress["errors"],
    }
    (output_dir / "phenotagger_local_summary.json").write_text(json.dumps(summary, indent=2) + "\n")


if __name__ == "__main__":
    main()

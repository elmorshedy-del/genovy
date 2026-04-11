#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path
from typing import Any

try:
    from azure.identity import DefaultAzureCredential
    from azure.ai.projects import AIProjectClient
except ImportError as exc:  # pragma: no cover - import guard
    raise SystemExit(
        "Missing Azure SDK dependencies. Install with: pip install 'azure-ai-projects>=2.0.0'"
    ) from exc


REPO_ROOT = Path("/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914")

DEFAULT_INPUT = REPO_ROOT / "output/grounded-disease-layer-bundle-20260409/next-chapter-williams-syndrome/NBK1249_opus_input.json"
DEFAULT_TEMPLATE = REPO_ROOT / "docs/genereviews-grounded-disease-layer-template-v1-20260408.json"
DEFAULT_OUTPUT_DIR = REPO_ROOT / "output/grounded-disease-layer-azure-agent-runs"
DEFAULT_ENDPOINT = "https://genovy2-resource.services.ai.azure.com/api/projects/genovy2"
DEFAULT_AGENT_NAME = "2genovy"
DEFAULT_AGENT_VERSION = "1"
DEFAULT_TIMEOUT_SECONDS = 240.0
DEFAULT_PAUSE_MS = 300
STAGE_ORDER = ["phenotype", "support", "course"]
SCHEMA_VERSION = "grounded_disease_layer_v1"
EXTRACTION_POLICY_VERSION = "strict_grounded_v1"

COMPACT_BASE_PROMPT = """You are extracting a grounded disease-layer record from GeneReviews text.

Use only the provided JSON wrapper. The wrapper contains `chapter` metadata and a `sentence_index`.
Do not use outside medical knowledge.
Do not invent tests, prevalence, penetrance, genes, inheritance, management, therapy, biomarkers, or family-risk claims.
If a field is not explicitly supported by cited sentences, leave it null or return an empty array for that layer.
Prefer literal or near-literal labels from the source.
Keep qualifiers sparse.
Every populated field must be justified by `evidence_sentence_ids`.
`source_document` will be constructed locally from the wrapper, so do not emit it.
Return JSON only."""

PHENOTYPE_QUALIFIER_KEYS = [
    "onset",
    "frequency",
    "severity",
    "progression",
    "trigger",
    "treatment_response",
    "pathophysiology",
    "laterality",
    "distribution",
    "anatomical_site",
    "morphology",
    "subtype_context",
]

ANCILLARY_QUALIFIER_KEYS = ["timing", "frequency", "severity", "method", "specimen", "subtype_context"]
CONTEXT_FIELDS = {
    "onset",
    "inheritance",
    "gene",
    "prevalence",
    "prognosis",
    "natural_history",
    "family_risk",
    "founder_variant",
    "biomarker",
    "therapeutic_landscape",
    "penetrance",
}
ALLOWED_STATUSES = {"present", "uncertain", "excluded"}
ALLOWED_CLINICAL_ROLES = {"primary", "descriptor", "complication"}
ALLOWED_ANCILLARY_DOMAINS = {
    "laboratory",
    "imaging",
    "pathology",
    "electrophysiology",
    "treatment_response",
    "clinical_test",
    "management_context",
    "other",
}

PASS_DEFINITIONS = [
    {
        "key": "phenotype",
        "output_keys": ["phenotype_assertions"],
        "output_file_suffix": "phenotypes",
        "max_output_tokens": 8000,
        "instruction": (
            "Stage 1 of 3. Return only `phenotype_assertions`. "
            "Split coordinated findings only when they are clearly distinct manifestations. "
            "Use `primary`, `descriptor`, and `complication` conservatively. "
            "Do not emit ancillary, context, trajectory, notes, or source_document."
        ),
    },
    {
        "key": "support",
        "output_keys": ["ancillary_assertions", "context_assertions"],
        "output_file_suffix": "support",
        "max_output_tokens": 4000,
        "instruction": (
            "Stage 2 of 3. Return only `ancillary_assertions` and `context_assertions`. "
            "Be strict. If unsupported, return empty arrays. "
            "Do not infer tests, management, prevalence, penetrance, inheritance, genes, or therapy claims."
        ),
    },
    {
        "key": "course",
        "output_keys": ["trajectory_assertions", "extraction_notes"],
        "output_file_suffix": "course",
        "max_output_tokens": 4000,
        "instruction": (
            "Stage 3 of 3. Return only `trajectory_assertions` and `extraction_notes`. "
            "Use trajectory only when staged disease course is explicit. "
            "Use notes only for real routing, ambiguity, or decomposition decisions."
        ),
    },
]


def fail(message: str) -> None:
    raise RuntimeError(message)


def slugify(value: Any) -> str:
    return re.sub(r"[^A-Za-z0-9]+", "_", str(value or "").strip()).strip("_")


def to_nullable_string(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.write_text(text, encoding="utf-8")


def read_json(path: Path) -> Any:
    return json.loads(read_text(path))


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the Genovy grounded disease-layer workflow via Azure AI Project agent in 3 stages.")
    parser.add_argument("--input", default=str(DEFAULT_INPUT))
    parser.add_argument("--template", default=str(DEFAULT_TEMPLATE))
    parser.add_argument("--prompt", default="")
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--endpoint", default=DEFAULT_ENDPOINT)
    parser.add_argument("--agent-name", default=DEFAULT_AGENT_NAME)
    parser.add_argument("--agent-version", default=DEFAULT_AGENT_VERSION)
    parser.add_argument("--agent-id", default="")
    parser.add_argument("--timeout-seconds", type=float, default=DEFAULT_TIMEOUT_SECONDS)
    parser.add_argument("--pause-ms", type=int, default=DEFAULT_PAUSE_MS)
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--stage", choices=STAGE_ORDER)
    parser.add_argument("--start-stage", choices=STAGE_ORDER)
    parser.add_argument("--stop-stage", choices=STAGE_ORDER)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args(argv)


def resolve_agent_parts(args: argparse.Namespace) -> tuple[str, str]:
    if args.agent_id:
        text = str(args.agent_id).strip()
        if ":" not in text:
            fail("--agent-id must be in name:version format")
        return tuple(text.split(":", 1))  # type: ignore[return-value]
    return str(args.agent_name).strip(), str(args.agent_version).strip()


def ensure_wrapper_shape(wrapper: Any, input_path: Path) -> None:
    if not isinstance(wrapper, dict):
        fail(f"Invalid input wrapper: {input_path}")
    if not isinstance(wrapper.get("chapter"), dict):
        fail(f"Missing chapter block: {input_path}")
    if not isinstance(wrapper.get("sentence_index"), list):
        fail(f"Missing sentence_index array: {input_path}")


def canonicalize_evidence_sentence_id(value: Any) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    normalized = re.sub(r"\s+", "", text.lower())
    repaired = re.fullmatch(r"p(\d+)[_-]?s?(\d+)", normalized)
    if repaired:
        return f"p{repaired.group(1)}_s{repaired.group(2)}"
    return normalized


def build_document_stem(wrapper: dict[str, Any]) -> str:
    nbk_id = str(wrapper.get("chapter", {}).get("nbk_id") or "").strip()
    title_slug = slugify(wrapper.get("chapter", {}).get("title") or "chapter").lower() or "chapter"
    return f"{nbk_id or 'chapter'}_{title_slug}"


def build_scoped_template(template: dict[str, Any], output_keys: list[str]) -> dict[str, Any]:
    return {key: template.get(key, []) if isinstance(template.get(key), list) else [] for key in output_keys}


def build_stage_prompt(base_prompt: str, template: dict[str, Any], stage: dict[str, Any]) -> str:
    scoped_template = build_scoped_template(template, stage["output_keys"])
    return "\n\n".join(
        [
            base_prompt.strip(),
            f"Scoped stage override: {stage['instruction']}",
            "Return only this JSON shape and nothing else:",
            json.dumps(scoped_template, separators=(",", ":"), ensure_ascii=False),
        ]
    )


def select_stages(args: argparse.Namespace) -> list[dict[str, Any]]:
    if args.stage:
        return [stage for stage in PASS_DEFINITIONS if stage["key"] == args.stage]
    start_index = STAGE_ORDER.index(args.start_stage) if args.start_stage else 0
    stop_index = STAGE_ORDER.index(args.stop_stage) if args.stop_stage else len(STAGE_ORDER) - 1
    if stop_index < start_index:
        fail("--stop-stage cannot come before --start-stage")
    allowed = set(STAGE_ORDER[start_index : stop_index + 1])
    return [stage for stage in PASS_DEFINITIONS if stage["key"] in allowed]


def build_stage_input_text(wrapper: dict[str, Any]) -> str:
    chapter = wrapper.get("chapter", {})
    metadata = {
        "nbk_id": chapter.get("nbk_id"),
        "title": chapter.get("title"),
        "mode": chapter.get("mode") or "discovery",
        "source": chapter.get("source") or "GeneReviews",
    }
    lines = ["Chapter metadata:", json.dumps(metadata, separators=(",", ":"), ensure_ascii=False), "", "Sentences:"]
    for row in wrapper.get("sentence_index", []):
        sentence_id = str((row or {}).get("sentence_id") or "").strip()
        text = str((row or {}).get("text") or "").strip()
        if sentence_id and text:
            lines.append(f"{sentence_id}: {text}")
    return "\n".join(lines)


def parse_json_content(raw_text: str) -> Any:
    text = str(raw_text or "").strip()
    if not text:
        return None
    cleaned = re.sub(r"```json\s*", "", text, flags=re.IGNORECASE)
    cleaned = re.sub(r"```\s*", "", cleaned).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        snippet = cleaned[start : end + 1]
        try:
            return json.loads(snippet)
        except json.JSONDecodeError:
            return None
    return None


def unique_sentence_refs(refs: Any, valid_ids: set[str]) -> list[str]:
    output: list[str] = []
    seen: set[str] = set()
    for value in refs if isinstance(refs, list) else []:
        sentence_id = canonicalize_evidence_sentence_id(value)
        if not sentence_id or sentence_id in seen:
            continue
        if sentence_id not in valid_ids:
            fail(f"Unknown evidence sentence id: {sentence_id}")
        seen.add(sentence_id)
        output.append(sentence_id)
    return output


def normalize_source_document(wrapper: dict[str, Any], sentence_index: list[dict[str, Any]]) -> dict[str, Any]:
    chapter = wrapper.get("chapter", {})
    stem = build_document_stem(wrapper)
    return {
        "document_local_id": str(chapter.get("document_local_id") or stem).strip(),
        "disease_local_id": str(chapter.get("disease_local_id") or stem).strip(),
        "nbk_id": to_nullable_string(chapter.get("nbk_id")),
        "title": str(chapter.get("title") or "").strip(),
        "mode": str(chapter.get("mode") or "discovery").strip() or "discovery",
        "source": to_nullable_string(chapter.get("source")) or "GeneReviews",
        "source_url": to_nullable_string(chapter.get("source_url")),
        "source_date": to_nullable_string(chapter.get("source_date")),
        "sentence_index": sentence_index,
    }


def normalize_phenotype_row(row: Any, valid_ids: set[str]) -> dict[str, Any]:
    qualifiers = row.get("qualifiers") if isinstance(row, dict) and isinstance(row.get("qualifiers"), dict) else {}
    status = row.get("status") if isinstance(row, dict) else None
    role = row.get("clinical_role") if isinstance(row, dict) else None
    return {
        "assertion_local_id": str((row or {}).get("assertion_local_id") or "").strip(),
        "label_raw": str((row or {}).get("label_raw") or "").strip(),
        "status": status if status in ALLOWED_STATUSES else "present",
        "clinical_role": role if role in ALLOWED_CLINICAL_ROLES else "primary",
        "evidence_sentence_ids": unique_sentence_refs((row or {}).get("evidence_sentence_ids"), valid_ids),
        "qualifiers": {key: to_nullable_string(qualifiers.get(key)) for key in PHENOTYPE_QUALIFIER_KEYS},
    }


def normalize_ancillary_row(row: Any, valid_ids: set[str]) -> dict[str, Any]:
    qualifiers = row.get("qualifiers") if isinstance(row, dict) and isinstance(row.get("qualifiers"), dict) else {}
    domain = row.get("domain") if isinstance(row, dict) else None
    status = row.get("status") if isinstance(row, dict) else None
    related = row.get("related_phenotype_assertion_ids") if isinstance(row, dict) else []
    related_ids = []
    seen = set()
    for value in related if isinstance(related, list) else []:
        text = str(value or "").strip()
        if text and text not in seen:
            seen.add(text)
            related_ids.append(text)
    return {
        "ancillary_local_id": str((row or {}).get("ancillary_local_id") or "").strip(),
        "domain": domain if domain in ALLOWED_ANCILLARY_DOMAINS else "other",
        "finding_raw": str((row or {}).get("finding_raw") or "").strip(),
        "status": status if status in ALLOWED_STATUSES else "present",
        "evidence_sentence_ids": unique_sentence_refs((row or {}).get("evidence_sentence_ids"), valid_ids),
        "related_phenotype_assertion_ids": related_ids,
        "qualifiers": {key: to_nullable_string(qualifiers.get(key)) for key in ANCILLARY_QUALIFIER_KEYS},
    }


def normalize_context_row(row: Any, valid_ids: set[str]) -> dict[str, Any] | None:
    field_name = str((row or {}).get("field_name") or "").strip()
    if field_name not in CONTEXT_FIELDS:
        return None
    return {
        "context_local_id": str((row or {}).get("context_local_id") or "").strip(),
        "field_name": field_name,
        "value": str((row or {}).get("value") or "").strip(),
        "evidence_sentence_ids": unique_sentence_refs((row or {}).get("evidence_sentence_ids"), valid_ids),
    }


def normalize_trajectory_row(row: Any, valid_ids: set[str]) -> dict[str, Any]:
    labels = []
    seen = set()
    for value in (row or {}).get("manifestation_labels") if isinstance((row or {}).get("manifestation_labels"), list) else []:
        text = str(value or "").strip()
        if text and text not in seen:
            seen.add(text)
            labels.append(text)
    try:
        stage_order = int((row or {}).get("stage_order"))
    except Exception:
        stage_order = 0
    return {
        "trajectory_local_id": str((row or {}).get("trajectory_local_id") or "").strip(),
        "stage_order": stage_order,
        "age_window": str((row or {}).get("age_window") or "").strip(),
        "summary": str((row or {}).get("summary") or "").strip(),
        "manifestation_labels": labels,
        "evidence_sentence_ids": unique_sentence_refs((row or {}).get("evidence_sentence_ids"), valid_ids),
    }


def normalize_note_row(row: Any, valid_ids: set[str]) -> dict[str, Any]:
    return {
        "note_local_id": str((row or {}).get("note_local_id") or "").strip(),
        "decision": str((row or {}).get("decision") or "").strip(),
        "rationale": str((row or {}).get("rationale") or "").strip(),
        "evidence_sentence_ids": unique_sentence_refs((row or {}).get("evidence_sentence_ids"), valid_ids),
    }


def validate_non_empty_rows(rows: list[dict[str, Any]], required_keys: list[str], row_type: str) -> None:
    for row in rows:
        for key in required_keys:
            value = row.get(key)
            if isinstance(value, list) and not value:
                fail(f"{row_type} row has empty {key}")
            if isinstance(value, str) and not value.strip():
                fail(f"{row_type} row has empty {key}")


def dedupe_rows(rows: list[dict[str, Any]], key_builder) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []
    seen: set[str] = set()
    for row in rows:
        key = key_builder(row)
        if not key or key in seen:
            continue
        seen.add(key)
        output.append(row)
    return output


def merge_pass_outputs(pass_payloads: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
    return {
        "schema_version": SCHEMA_VERSION,
        "extraction_policy_version": EXTRACTION_POLICY_VERSION,
        "phenotype_assertions": pass_payloads.get("phenotype_assertions", []),
        "ancillary_assertions": pass_payloads.get("ancillary_assertions", []),
        "context_assertions": pass_payloads.get("context_assertions", []),
        "trajectory_assertions": pass_payloads.get("trajectory_assertions", []),
        "extraction_notes": pass_payloads.get("extraction_notes", []),
    }


def normalize_grounded_disease_layer(raw: dict[str, Any], wrapper: dict[str, Any]) -> dict[str, Any]:
    sentence_index = []
    for row in wrapper.get("sentence_index", []):
        sentence_index.append(
            {
                "sentence_id": str((row or {}).get("sentence_id") or "").strip(),
                "section": None if (row or {}).get("section") is None else str(row.get("section")),
                "section_id": None if (row or {}).get("section_id") is None else str(row.get("section_id")),
                "paragraph_id": None if (row or {}).get("paragraph_id") is None else str(row.get("paragraph_id")),
                "char_start": None if (row or {}).get("char_start") is None else int(row.get("char_start")),
                "char_end": None if (row or {}).get("char_end") is None else int(row.get("char_end")),
                "text": str((row or {}).get("text") or "").strip(),
            }
        )

    valid_ids = {row["sentence_id"] for row in sentence_index if row["sentence_id"]}
    normalized = {
        "schema_version": SCHEMA_VERSION,
        "extraction_policy_version": EXTRACTION_POLICY_VERSION,
        "source_document": normalize_source_document(wrapper, sentence_index),
        "phenotype_assertions": dedupe_rows(
            [normalize_phenotype_row(row, valid_ids) for row in (raw.get("phenotype_assertions") or [])],
            lambda row: f"{row['assertion_local_id']}|{row['label_raw']}|{row['status']}|{row['clinical_role']}|{','.join(row['evidence_sentence_ids'])}",
        ),
        "ancillary_assertions": dedupe_rows(
            [normalize_ancillary_row(row, valid_ids) for row in (raw.get("ancillary_assertions") or [])],
            lambda row: f"{row['ancillary_local_id']}|{row['domain']}|{row['finding_raw']}|{row['status']}|{','.join(row['evidence_sentence_ids'])}|{','.join(row['related_phenotype_assertion_ids'])}",
        ),
        "context_assertions": dedupe_rows(
            [row for row in (normalize_context_row(entry, valid_ids) for entry in (raw.get("context_assertions") or [])) if row],
            lambda row: f"{row['context_local_id']}|{row['field_name']}|{','.join(row['evidence_sentence_ids'])}",
        ),
        "trajectory_assertions": dedupe_rows(
            # Trajectory is optional; drop malformed rows instead of aborting the whole chapter.
            [
                row
                for row in (normalize_trajectory_row(entry, valid_ids) for entry in (raw.get("trajectory_assertions") or []))
                if row["trajectory_local_id"] and row["age_window"] and row["summary"] and row["evidence_sentence_ids"]
            ],
            lambda row: f"{row['trajectory_local_id']}|{row['stage_order']}|{row['age_window']}|{','.join(row['evidence_sentence_ids'])}",
        ),
        "extraction_notes": dedupe_rows(
            [normalize_note_row(row, valid_ids) for row in (raw.get("extraction_notes") or [])],
            lambda row: f"{row['note_local_id']}|{row['decision']}|{','.join(row['evidence_sentence_ids'])}",
        ),
    }

    if raw.get("schema_version") and str(raw.get("schema_version")).strip() != SCHEMA_VERSION:
        fail(f"Unexpected schema_version: {raw.get('schema_version')}")
    if raw.get("extraction_policy_version") and str(raw.get("extraction_policy_version")).strip() != EXTRACTION_POLICY_VERSION:
        fail(f"Unexpected extraction_policy_version: {raw.get('extraction_policy_version')}")

    validate_non_empty_rows(normalized["phenotype_assertions"], ["assertion_local_id", "label_raw", "evidence_sentence_ids"], "phenotype")
    validate_non_empty_rows(normalized["ancillary_assertions"], ["ancillary_local_id", "finding_raw", "evidence_sentence_ids"], "ancillary")
    validate_non_empty_rows(normalized["context_assertions"], ["context_local_id", "field_name", "value", "evidence_sentence_ids"], "context")
    validate_non_empty_rows(normalized["trajectory_assertions"], ["trajectory_local_id", "age_window", "summary", "evidence_sentence_ids"], "trajectory")
    validate_non_empty_rows(normalized["extraction_notes"], ["note_local_id", "decision", "rationale", "evidence_sentence_ids"], "note")
    return normalized


def dump_response(response: Any) -> Any:
    if hasattr(response, "model_dump"):
        return response.model_dump()
    return {"raw_repr": repr(response)}


def run_stage(
    openai_client: Any,
    stage_input_text: str,
    stage_prompt: str,
    stage: dict[str, Any],
    agent_name: str,
    agent_version: str,
) -> tuple[str, Any]:
    response = openai_client.responses.create(
        input=[
            {
                "role": "user",
                "content": f"{stage_prompt}\n\n{stage_input_text}",
            }
        ],
        max_output_tokens=stage["max_output_tokens"],
        extra_body={"agent_reference": {"name": agent_name, "version": agent_version, "type": "agent_reference"}},
    )
    return response.output_text or "", response


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    input_path = Path(args.input)
    template_path = Path(args.template)
    output_dir = Path(args.output_dir)
    prompt_path = Path(args.prompt) if args.prompt else None
    agent_name, agent_version = resolve_agent_parts(args)

    if not input_path.exists():
        fail(f"Input file not found: {input_path}")
    if not template_path.exists():
        fail(f"Template file not found: {template_path}")
    if prompt_path and not prompt_path.exists():
        fail(f"Prompt file not found: {prompt_path}")

    wrapper = read_json(input_path)
    ensure_wrapper_shape(wrapper, input_path)
    template = read_json(template_path)
    base_prompt = read_text(prompt_path).strip() if prompt_path else COMPACT_BASE_PROMPT
    selected_stages = select_stages(args)
    stage_input_text = build_stage_input_text(wrapper)

    title_slug = slugify(wrapper["chapter"].get("title") or input_path.stem).lower() or "chapter"
    nbk_id = str(wrapper["chapter"].get("nbk_id") or input_path.stem).strip() or input_path.stem
    run_dir = output_dir / f"{nbk_id}_{title_slug}"
    ensure_dir(run_dir)

    output_path = run_dir / f"{nbk_id}_{title_slug}_grounded_disease_layer.json"
    pass_payloads: dict[str, list[dict[str, Any]]] = {}
    pass_meta: dict[str, Any] = {}

    if args.dry_run:
        for stage in selected_stages:
            prompt_text = build_stage_prompt(base_prompt, template, stage)
            write_text(run_dir / f"{nbk_id}_{title_slug}_{stage['output_file_suffix']}_system_prompt.txt", prompt_text)
            write_text(run_dir / f"{nbk_id}_{title_slug}_{stage['output_file_suffix']}_input.txt", stage_input_text)
        print(
            json.dumps(
                {
                    "status": "dry_run_ok",
                    "input": str(input_path),
                    "output_dir": str(run_dir),
                    "stage_count": len(selected_stages),
                    "stages": [stage["key"] for stage in selected_stages],
                },
                indent=2,
            )
        )
        return 0

    credential = DefaultAzureCredential()
    client = AIProjectClient(endpoint=str(args.endpoint), credential=credential)
    openai_client = client.get_openai_client(timeout=float(args.timeout_seconds))

    for index, stage in enumerate(selected_stages, start=1):
        print(f"[{index}/{len(selected_stages)}] {stage['key']}")
        stage_prompt = build_stage_prompt(base_prompt, template, stage)
        prompt_snapshot_path = run_dir / f"{nbk_id}_{title_slug}_{stage['output_file_suffix']}_system_prompt.txt"
        stage_input_path = run_dir / f"{nbk_id}_{title_slug}_{stage['output_file_suffix']}_input.txt"
        raw_output_path = run_dir / f"{nbk_id}_{title_slug}_{stage['output_file_suffix']}_raw_text.txt"
        partial_json_path = run_dir / f"{nbk_id}_{title_slug}_{stage['output_file_suffix']}.json"
        partial_meta_path = run_dir / f"{nbk_id}_{title_slug}_{stage['output_file_suffix']}_meta.json"
        raw_response_path = run_dir / f"{nbk_id}_{title_slug}_{stage['output_file_suffix']}_response_body.json"

        write_text(prompt_snapshot_path, stage_prompt)
        write_text(stage_input_path, stage_input_text)
        if args.resume and partial_json_path.exists():
            partial_payload = read_json(partial_json_path)
            if not isinstance(partial_payload, dict):
                fail(f"Resume payload is not a JSON object: {partial_json_path}")
            for key in stage["output_keys"]:
                pass_payloads[key] = partial_payload.get(key, []) if isinstance(partial_payload.get(key), list) else []
            pass_meta[stage["key"]] = {
                "output": str(partial_json_path),
                "response_body": str(raw_response_path) if raw_response_path.exists() else None,
                "duration_ms": None,
                "max_output_tokens": stage["max_output_tokens"],
                "resumed": True,
            }
            print(f"  resumed from {partial_json_path}")
        else:
            started_at = time.time()
            raw_text, response = run_stage(openai_client, stage_input_text, stage_prompt, stage, agent_name, agent_version)
            duration_ms = int((time.time() - started_at) * 1000)
            write_text(raw_output_path, f"{raw_text}\n")
            write_json(raw_response_path, dump_response(response))
            parsed = parse_json_content(raw_text)
            if not isinstance(parsed, dict):
                fail(f"Azure agent returned non-parseable JSON for stage {stage['key']}. Raw output saved to {raw_output_path}")

            partial_payload = {
                key: parsed.get(key, []) if isinstance(parsed.get(key), list) else [] for key in stage["output_keys"]
            }
            for key, rows in partial_payload.items():
                pass_payloads[key] = rows
            write_json(partial_json_path, partial_payload)
            pass_meta[stage["key"]] = {
                "output": str(partial_json_path),
                "response_body": str(raw_response_path),
                "duration_ms": duration_ms,
                "max_output_tokens": stage["max_output_tokens"],
                "resumed": False,
            }
            write_json(
                partial_meta_path,
                {
                    "input": str(input_path),
                    "stage_input": str(stage_input_path),
                    "endpoint": str(args.endpoint),
                    "agent_name": agent_name,
                    "agent_version": agent_version,
                    "stage": stage["key"],
                    "duration_ms": duration_ms,
                    "max_output_tokens": stage["max_output_tokens"],
                    "parsed": True,
                },
            )
        if args.pause_ms > 0 and index < len(selected_stages):
            time.sleep(args.pause_ms / 1000.0)

    merged = merge_pass_outputs(pass_payloads)
    normalized = normalize_grounded_disease_layer(merged, wrapper)
    write_json(output_path, normalized)
    write_json(
        run_dir / f"{nbk_id}_{title_slug}_meta.json",
        {
            "input": str(input_path),
            "template": str(template_path),
            "prompt": str(prompt_path) if prompt_path else None,
            "endpoint": str(args.endpoint),
            "agent_name": agent_name,
            "agent_version": agent_version,
            "strategy": "azure_agent_three_stage",
            "pass_count": len(selected_stages),
            "pause_ms": args.pause_ms,
            "timeout_seconds": args.timeout_seconds,
            "resume": args.resume,
            "passes": pass_meta,
        },
    )

    print(
        json.dumps(
            {
                "status": "ok",
                "input": str(input_path),
                "endpoint": str(args.endpoint),
                "agent_name": agent_name,
                "agent_version": agent_version,
                "strategy": "azure_agent_three_stage",
                "output": str(output_path),
                "phenotype_count": len(normalized["phenotype_assertions"]),
                "ancillary_count": len(normalized["ancillary_assertions"]),
                "context_count": len(normalized["context_assertions"]),
                "trajectory_count": len(normalized["trajectory_assertions"]),
                "note_count": len(normalized["extraction_notes"]),
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main(sys.argv[1:]))
    except Exception as exc:  # pragma: no cover - CLI error path
        print(exc, file=sys.stderr)
        raise SystemExit(1)

#!/usr/bin/env python3
import argparse
import base64
import importlib.util
import json
import os
import re
import time
import zlib
from pathlib import Path

from lightning_cloud.login import Auth
from lightning_cloud.openapi import CloudSpaceServiceApi
from lightning_cloud.openapi.models import CloudSpaceServiceExecuteCommandInCloudSpaceBody


DEFAULT_PROJECT_ID = "01kn74z54zyc69xskn1aqrcg7b"
DEFAULT_CLOUDSPACE_ID = "01kn77rsspvp5z1k4mdyec0kwk"
DEFAULT_AUDIT_CACHE_JSON = (
    "/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/"
    "test/fixtures/stage3DiscoveryRealAuditCacheLatest10.json"
)
DEFAULT_MANUAL_AUDIT_JSON = (
    "/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/"
    "test/fixtures/stage3DiscoveryRealLatest10ManualAudit.json"
)
DEFAULT_OUTPUT_DIR = (
    "/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/"
    "output/stage3_discovery_real_latest10_medgemma_clinician_20260402"
)
REMOTE_STUDIO_DIR = "/teamspace/studios/this_studio"
REMOTE_SCRIPT_PATH = f"{REMOTE_STUDIO_DIR}/medgemma_real_audit.py"
REMOTE_RESULTS_PATH = f"{REMOTE_STUDIO_DIR}/medgemma_real_audit_results.json"
REMOTE_RUN_LOG_PATH = f"{REMOTE_STUDIO_DIR}/medgemma_real_audit_run.log"

CLINICIAN_PROMPT = """You are a clinical geneticist reading GeneReviews clinical text.

Your task is to find additional clinically meaningful phenotype findings that are supported by the text and are not already adequately covered by the supplied anchor list.

Read this like a physician:
- keep findings that add real clinical information
- allow a more specific refinement if the text clearly supports it
- avoid restating findings that are already covered by the anchors
- prefer findings that would make sense as standalone phenotype rows in a patient profile
- avoid fragments, examples inside a longer clause, school-task snippets, and low-value context phrases

Ignore material that is not a phenotype finding, such as inheritance, genes, variants, tests, methods, analytes, raw measurements, treatment, management, devices, disease labels, future risk-only statements, possible complications, and normal or preserved findings.

Return JSON only:
[
  {
    "id": "case id",
    "predictedCandidates": [
      {
        "label": "short phenotype phrase",
        "status": "present",
        "sentence_id": "p1_s2",
        "evidence_text": "exact supporting quote from that sentence"
      }
    ]
  }
]

Requirements:
- status must be exactly "present" or "excluded"
- use "excluded" only when an abnormal feature is explicitly absent or not reported
- evidence_text must be copied from the cited sentence
- do not output HPO IDs
- no markdown fences and no explanation
"""


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-id", default=DEFAULT_PROJECT_ID)
    parser.add_argument("--cloudspace-id", default=DEFAULT_CLOUDSPACE_ID)
    parser.add_argument("--audit-cache-json", default=DEFAULT_AUDIT_CACHE_JSON)
    parser.add_argument("--manual-audit-json", default=DEFAULT_MANUAL_AUDIT_JSON)
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--lightning-user-id", default=os.environ.get("LIGHTNING_USER_ID", ""))
    parser.add_argument("--lightning-api-key", default=os.environ.get("LIGHTNING_API_KEY", ""))
    parser.add_argument("--max-new-tokens", type=int, default=1200)
    parser.add_argument("--temperature", type=float, default=0.1)
    parser.add_argument("--limit", type=int, default=0)
    return parser.parse_args()


def load_smoke_module():
    script_path = (
        "/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/"
        "src/scripts/benchmarkStage3DiscoveryMedGemmaSmoke.py"
    )
    spec = importlib.util.spec_from_file_location("medgemma_smoke", script_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def normalize_text(value):
    text = str(value or "").lower()
    text = re.sub(r"[^a-z0-9]+", " ", text).strip()
    return re.sub(r"\s+", " ", text)


def dice_coefficient(left, right):
    left_norm = normalize_text(left)
    right_norm = normalize_text(right)
    if not left_norm or not right_norm:
        return 0.0
    left_tokens = set(left_norm.split(" "))
    right_tokens = set(right_norm.split(" "))
    if not left_tokens or not right_tokens:
        return 0.0
    overlap = len([token for token in left_tokens if token in right_tokens])
    return (2 * overlap) / (len(left_tokens) + len(right_tokens))


def candidate_matches_text(left, right):
    left_norm = normalize_text(left)
    right_norm = normalize_text(right)
    if not left_norm or not right_norm:
        return False
    return (
        left_norm == right_norm
        or left_norm in right_norm
        or right_norm in left_norm
        or dice_coefficient(left, right) >= 0.8
    )


def create_api(args):
    if not args.lightning_user_id or not args.lightning_api_key:
        creds_path = Path("/Users/ahmedelmorshedy/.lightning/credentials.json")
        if not creds_path.exists():
            raise SystemExit("Missing Lightning credentials")
        creds = json.loads(creds_path.read_text())
        args.lightning_user_id = args.lightning_user_id or creds.get("user_id", "")
        args.lightning_api_key = args.lightning_api_key or creds.get("api_key", "")
    if not args.lightning_user_id or not args.lightning_api_key:
        raise SystemExit("LIGHTNING_USER_ID and LIGHTNING_API_KEY are required")
    auth = Auth()
    auth.user_id = args.lightning_user_id
    auth.api_key = args.lightning_api_key
    client = auth.create_api_client(override="api_key")
    return CloudSpaceServiceApi(client)


def exec_in_studio(api, project_id, cloudspace_id, command, session_name):
    response = api.cloud_space_service_execute_command_in_cloud_space(
        body=CloudSpaceServiceExecuteCommandInCloudSpaceBody(
            command=command,
            detached=False,
            session_name=session_name,
        ),
        project_id=project_id,
        id=cloudspace_id,
    )
    if response.exit_code not in (0, None):
        raise RuntimeError(response.output or f"Studio command failed with exit code {response.exit_code}")
    return response.output or ""


def ensure_server_healthy(api, project_id, cloudspace_id):
    command = (
        "bash -lc 'cd /teamspace/studios/this_studio && "
        "if [ -f start_medgemma.sh ]; then bash start_medgemma.sh; fi && "
        "for i in $(seq 1 24); do "
        "curl -sf http://127.0.0.1:8000/health >/dev/null && echo HEALTH_OK && exit 0; "
        "sleep 5; "
        "done; "
        "echo HEALTH_TIMEOUT; exit 1'"
    )
    output = exec_in_studio(api, project_id, cloudspace_id, command, "medgemma-real-audit-health")
    if "HEALTH_OK" not in output:
        raise RuntimeError(f"MedGemma server did not become healthy: {output[:500]}")


def build_cases(audit_cache, manual_audit, limit):
    manual_by_key = {chapter["chapter_key"]: chapter for chapter in manual_audit["chapters"]}
    selected = [chapter for chapter in audit_cache["chapters"] if chapter["chapter_key"] in manual_by_key]
    if limit > 0:
        selected = selected[:limit]

    cases = []
    local_context = []
    for chapter in selected:
        structure = json.loads(Path(chapter["structure_path"]).read_text())
        anchors_payload = json.loads(Path(chapter["anchors_path"]).read_text())
        sentences = []
        sentence_map = {}
        for paragraph in structure.get("paragraphs") or []:
            for sentence in paragraph.get("sentences") or []:
                sentence_id = sentence.get("sentence_id")
                text = sentence.get("text")
                if sentence_id and isinstance(text, str):
                    sentence_map[sentence_id] = text
                    sentences.append({"sentence_id": sentence_id, "text": text})
        existing_anchors = []
        for anchor in anchors_payload.get("anchors") or []:
            match_texts = []
            for occurrence in anchor.get("occurrences") or []:
                match_text = occurrence.get("match_text")
                if match_text:
                    match_texts.append(match_text)
            existing_anchors.append(
                {
                    "hpo_label": anchor.get("hpo_label"),
                    "match_texts": sorted(set(match_texts)),
                }
            )
        cases.append(
            {
                "id": chapter["nbk_id"],
                "chapter_key": chapter["chapter_key"],
                "chapter_title": chapter["chapter_title"],
                "existing_anchors": existing_anchors,
                "clinical_structure": {"sentences": sentences},
            }
        )
        local_context.append(
            {
                "nbk_id": chapter["nbk_id"],
                "chapter_key": chapter["chapter_key"],
                "chapter_title": chapter["chapter_title"],
                "sentence_map": sentence_map,
                "anchors_payload": anchors_payload,
                "manual_entries": manual_by_key[chapter["chapter_key"]]["entries"],
            }
        )
    return cases, local_context


def build_remote_script(cases, max_new_tokens, temperature):
    cases_b64 = base64.b64encode(json.dumps(cases).encode()).decode()
    prompt_b64 = base64.b64encode(CLINICIAN_PROMPT.encode()).decode()
    return f"""import base64
import json
import re
import urllib.request

cases = json.loads(base64.b64decode("{cases_b64}").decode())
prompt_prefix = base64.b64decode("{prompt_b64}").decode()

def parse_json_candidates(text):
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\\s*", "", cleaned)
    cleaned = re.sub(r"\\s*```$", "", cleaned)
    attempts = [cleaned]
    for open_char, close_char in [("[", "]"), ("{{", "}}")]:
        start = cleaned.find(open_char)
        end = cleaned.rfind(close_char)
        if start != -1 and end != -1 and end > start:
            attempts.append(cleaned[start:end+1])
    for candidate in attempts:
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, dict) and "predictedCandidates" in parsed:
                parsed = parsed["predictedCandidates"]
            elif (
                isinstance(parsed, list)
                and parsed
                and isinstance(parsed[0], dict)
                and "predictedCandidates" in parsed[0]
            ):
                parsed = parsed[0]["predictedCandidates"]
            if isinstance(parsed, list):
                output = []
                for item in parsed:
                    if not isinstance(item, dict):
                        continue
                    label = str(item.get("label") or "").strip()
                    if not label:
                        continue
                    status = "excluded" if item.get("status") == "excluded" else "present"
                    output.append({{
                        "label": label,
                        "status": status,
                        "sentence_id": str(item.get("sentence_id") or "").strip(),
                        "evidence_text": str(item.get("evidence_text") or "").strip(),
                    }})
                return output
        except Exception:
            pass
    return []

results = []
for case in cases:
    anchor_lines = []
    for anchor in case.get("existing_anchors") or []:
        label = anchor.get("hpo_label") or ""
        matches = ", ".join(anchor.get("match_texts") or [])
        anchor_lines.append(f"- {{label}}: {{matches}}")
    sentence_lines = []
    for sentence in case.get("clinical_structure", {{}}).get("sentences") or []:
        sentence_id = sentence.get("sentence_id") or ""
        text = sentence.get("text") or ""
        sentence_lines.append(f"- {{sentence_id}}: {{text}}")
    prompt = (
        prompt_prefix
        + "\\nCASE ID: " + str(case.get("id"))
        + "\\nCHAPTER TITLE: " + str(case.get("chapter_title"))
        + "\\nEXISTING ANCHORS:\\n" + ("\\n".join(anchor_lines) if anchor_lines else "- none")
        + "\\nSENTENCES:\\n" + ("\\n".join(sentence_lines) if sentence_lines else "- none")
    )
    body = json.dumps({{
        "input": prompt,
        "max_new_tokens": {max_new_tokens},
        "temperature": {temperature}
    }}).encode()
    req = urllib.request.Request(
        "http://127.0.0.1:8000/predict",
        data=body,
        headers={{"Content-Type": "application/json"}}
    )
    with urllib.request.urlopen(req, timeout=3600) as response:
        raw = json.loads(response.read().decode())
    text = raw.get("output") or ""
    results.append({{
        "id": case.get("id"),
        "predictedCandidates": parse_json_candidates(text),
        "rawPreview": text[:1200]
    }})

with open("{REMOTE_RESULTS_PATH}", "w") as handle:
    json.dump(results, handle)
print("REMOTE_RESULTS_WRITTEN")
"""


def run_remote_case(api, project_id, cloudspace_id, case, max_new_tokens, temperature):
    case_b64 = base64.b64encode(zlib.compress(json.dumps(case).encode(), level=9)).decode()
    prompt_b64 = base64.b64encode(zlib.compress(CLINICIAN_PROMPT.encode(), level=9)).decode()
    command = f"""python3 - <<'INNER'
import base64
import json
import re
import urllib.request
import zlib

case = json.loads(zlib.decompress(base64.b64decode("{case_b64}")).decode())
prompt_prefix = zlib.decompress(base64.b64decode("{prompt_b64}")).decode()

def parse_json_candidates(text):
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\\s*", "", cleaned)
    cleaned = re.sub(r"\\s*```$", "", cleaned)
    attempts = [cleaned]
    for open_char, close_char in [("[", "]"), ("{{", "}}")]:
        start = cleaned.find(open_char)
        end = cleaned.rfind(close_char)
        if start != -1 and end != -1 and end > start:
            attempts.append(cleaned[start:end+1])
    for candidate in attempts:
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, dict) and "predictedCandidates" in parsed:
                parsed = parsed["predictedCandidates"]
            elif (
                isinstance(parsed, list)
                and parsed
                and isinstance(parsed[0], dict)
                and "predictedCandidates" in parsed[0]
            ):
                parsed = parsed[0]["predictedCandidates"]
            if isinstance(parsed, list):
                output = []
                for item in parsed:
                    if not isinstance(item, dict):
                        continue
                    label = str(item.get("label") or "").strip()
                    if not label:
                        continue
                    output.append({{
                        "label": label,
                        "status": "excluded" if item.get("status") == "excluded" else "present",
                        "sentence_id": str(item.get("sentence_id") or "").strip(),
                        "evidence_text": str(item.get("evidence_text") or "").strip(),
                    }})
                return output
        except Exception:
            pass
    return []

anchor_lines = []
for anchor in case.get("existing_anchors") or []:
    label = anchor.get("hpo_label") or ""
    matches = ", ".join(anchor.get("match_texts") or [])
    anchor_lines.append(f"- {{label}}: {{matches}}")

sentence_lines = []
for sentence in case.get("clinical_structure", {{}}).get("sentences") or []:
    sentence_id = sentence.get("sentence_id") or ""
    text = sentence.get("text") or ""
    sentence_lines.append(f"- {{sentence_id}}: {{text}}")

prompt = (
    prompt_prefix
    + "\\nCASE ID: " + str(case.get("id"))
    + "\\nCHAPTER TITLE: " + str(case.get("chapter_title"))
    + "\\nEXISTING ANCHORS:\\n" + ("\\n".join(anchor_lines) if anchor_lines else "- none")
    + "\\nSENTENCES:\\n" + ("\\n".join(sentence_lines) if sentence_lines else "- none")
)

body = json.dumps({{
    "input": prompt,
    "max_new_tokens": {max_new_tokens},
    "temperature": {temperature}
}}).encode()

req = urllib.request.Request(
    "http://127.0.0.1:8000/predict",
    data=body,
    headers={{"Content-Type": "application/json"}}
)
with urllib.request.urlopen(req, timeout=3600) as response:
    raw = json.loads(response.read().decode())
text = raw.get("output") or ""
print(json.dumps({{
    "id": case.get("id"),
    "predictedCandidates": parse_json_candidates(text),
    "rawPreview": text[:1200]
}}))
INNER"""
    output = exec_in_studio(api, project_id, cloudspace_id, command, f"medgemma-real-case-{case['id']}")
    return json.loads(output)


def anchor_matches_prediction(anchors_payload, prediction):
    text = prediction.get("evidence_text") or prediction.get("label") or ""
    for anchor in anchors_payload.get("anchors") or []:
        if candidate_matches_text(text, anchor.get("hpo_label")):
            return True
        for occurrence in anchor.get("occurrences") or []:
            if candidate_matches_text(text, occurrence.get("match_text")):
                return True
    return False


def validate_prediction(prediction, sentence_map):
    sentence_id = prediction.get("sentence_id") or ""
    evidence_text = prediction.get("evidence_text") or ""
    sentence_text = sentence_map.get(sentence_id, "")
    valid_sentence_id = sentence_id in sentence_map
    valid_evidence_text = bool(evidence_text and sentence_text and evidence_text in sentence_text)
    return {
        "valid_sentence_id": valid_sentence_id,
        "valid_evidence_text": valid_evidence_text,
        "valid_grounding": valid_sentence_id and valid_evidence_text,
    }


def match_manual_entry(prediction, manual_entries):
    sentence_id = prediction.get("sentence_id") or ""
    evidence_text = prediction.get("evidence_text") or prediction.get("label") or ""
    for entry in manual_entries:
        if entry.get("sentence_id") != sentence_id:
            continue
        if candidate_matches_text(evidence_text, entry.get("evidence_text")):
            return entry
    return None


def dedupe_predictions(predictions):
    seen = {}
    for prediction in predictions or []:
        label = str(prediction.get("label") or "").strip()
        sentence_id = str(prediction.get("sentence_id") or "").strip()
        evidence_text = str(prediction.get("evidence_text") or "").strip()
        status = "excluded" if prediction.get("status") == "excluded" else "present"
        if not label:
            continue
        key = "::".join([normalize_text(label), normalize_text(sentence_id), normalize_text(evidence_text), status])
        if key not in seen:
            seen[key] = {
                "label": label,
                "status": status,
                "sentence_id": sentence_id,
                "evidence_text": evidence_text,
            }
    return list(seen.values())


def main():
    args = parse_args()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    audit_cache = json.loads(Path(args.audit_cache_json).read_text())
    manual_audit = json.loads(Path(args.manual_audit_json).read_text())
    cases, local_context = build_cases(audit_cache, manual_audit, args.limit)

    api = create_api(args)
    ensure_server_healthy(api, args.project_id, args.cloudspace_id)

    raw_results = []
    for index, case in enumerate(cases, start=1):
        print(f"[{index}/{len(cases)}] {case['chapter_title']}", flush=True)
        raw_results.append(
            run_remote_case(
                api,
                args.project_id,
                args.cloudspace_id,
                case,
                args.max_new_tokens,
                args.temperature,
            )
        )
    raw_by_id = {item["id"]: item for item in raw_results}
    context_by_id = {item["nbk_id"]: item for item in local_context}

    report = []
    totals = {
        "prediction_total": 0,
        "valid_grounding_total": 0,
        "valid_sentence_id_total": 0,
        "valid_evidence_text_total": 0,
        "anchor_duplicate_exact_total": 0,
        "useful_new_total": 0,
        "anchor_covered_semantic_or_refinement_total": 0,
        "broad_or_redundant_total": 0,
        "junk_or_context_only_total": 0,
        "unresolved_total": 0,
    }

    for case in cases:
        result = raw_by_id[case["id"]]
        context = context_by_id[case["id"]]
        predictions = dedupe_predictions(result.get("predictedCandidates") or [])
        chapter_counts = {
            "prediction_total": len(predictions),
            "valid_grounding_total": 0,
            "valid_sentence_id_total": 0,
            "valid_evidence_text_total": 0,
            "anchor_duplicate_exact_total": 0,
            "useful_new_total": 0,
            "anchor_covered_semantic_or_refinement_total": 0,
            "broad_or_redundant_total": 0,
            "junk_or_context_only_total": 0,
            "unresolved_total": 0,
        }
        classified_predictions = []

        for prediction in predictions:
            grounding = validate_prediction(prediction, context["sentence_map"])
            chapter_counts["valid_sentence_id_total"] += int(grounding["valid_sentence_id"])
            chapter_counts["valid_evidence_text_total"] += int(grounding["valid_evidence_text"])
            chapter_counts["valid_grounding_total"] += int(grounding["valid_grounding"])

            if anchor_matches_prediction(context["anchors_payload"], prediction):
                bucket = "anchor_duplicate_exact"
                chapter_counts["anchor_duplicate_exact_total"] += 1
            else:
                manual_entry = match_manual_entry(prediction, context["manual_entries"])
                if manual_entry:
                    source_bucket = manual_entry["bucket"]
                    if source_bucket == "useful_new":
                        bucket = "useful_new"
                        chapter_counts["useful_new_total"] += 1
                    elif source_bucket == "anchor_covered_semantic":
                        bucket = "anchor_covered_semantic_or_refinement"
                        chapter_counts["anchor_covered_semantic_or_refinement_total"] += 1
                    elif source_bucket == "broad_or_redundant":
                        bucket = "broad_or_redundant"
                        chapter_counts["broad_or_redundant_total"] += 1
                    elif source_bucket == "junk_or_context_only":
                        bucket = "junk_or_context_only"
                        chapter_counts["junk_or_context_only_total"] += 1
                    else:
                        bucket = "unresolved"
                        chapter_counts["unresolved_total"] += 1
                else:
                    bucket = "unresolved"
                    chapter_counts["unresolved_total"] += 1

            classified_predictions.append(
                {
                    **prediction,
                    "bucket": bucket,
                    **grounding,
                }
            )

        for key in totals:
            totals[key] += chapter_counts[key]

        report.append(
            {
                "nbk_id": case["id"],
                "chapter_key": case["chapter_key"],
                "chapter_title": case["chapter_title"],
                "prediction_total": len(predictions),
                "counts": chapter_counts,
                "predictions": classified_predictions,
                "rawPreview": result.get("rawPreview"),
            }
        )

    summary = {
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "model": "google/medgemma-27b-text-it",
        "prompt_style": "clinician",
        "scope": "stage3_real_latest10_medgemma_bucket_audit_v1",
        "chapter_count": len(cases),
        "totals": totals,
        "rates": {
            "useful_new_over_total": round(totals["useful_new_total"] / totals["prediction_total"], 4)
            if totals["prediction_total"]
            else 0.0,
            "nonduplicate_useful_over_nonduplicate_total": round(
                totals["useful_new_total"]
                / max(
                    1,
                    totals["prediction_total"] - totals["anchor_duplicate_exact_total"],
                ),
                4,
            ),
            "unresolved_over_total": round(totals["unresolved_total"] / totals["prediction_total"], 4)
            if totals["prediction_total"]
            else 0.0,
            "valid_grounding_rate": round(totals["valid_grounding_total"] / totals["prediction_total"], 4)
            if totals["prediction_total"]
            else 0.0,
        },
        "note": "anchor_covered_semantic_or_refinement remains a mixed bucket until the manual audit is re-labeled under the new refinement policy.",
    }

    (output_dir / "medgemma_real_latest10_bucket_summary.json").write_text(json.dumps(summary, indent=2))
    (output_dir / "medgemma_real_latest10_bucket_report.json").write_text(json.dumps(report, indent=2))
    (output_dir / "medgemma_real_latest10_raw_results.json").write_text(json.dumps(raw_results, indent=2))
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()

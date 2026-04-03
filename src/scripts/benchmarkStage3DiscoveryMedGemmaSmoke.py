#!/usr/bin/env python3
import argparse
import base64
import json
import os
import re
import sys
import time
from pathlib import Path

from lightning_cloud.login import Auth
from lightning_cloud.openapi import CloudSpaceServiceApi
from lightning_cloud.openapi.models import CloudSpaceServiceExecuteCommandInCloudSpaceBody


DEFAULT_PROJECT_ID = "01kn74z54zyc69xskn1aqrcg7b"
DEFAULT_CLOUDSPACE_ID = "01kn77rsspvp5z1k4mdyec0kwk"
DEFAULT_CASES_JSON = (
    "/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/"
    "test/fixtures/stage3DiscoveryBenchmarkDevHard20.json"
)
DEFAULT_OUTPUT_DIR = (
    "/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/"
    "output/stage3_discovery_medgemma_smoke_20260402_hard20"
)
REMOTE_STUDIO_DIR = "/teamspace/studios/this_studio"
REMOTE_SCRIPT_PATH = f"{REMOTE_STUDIO_DIR}/medgemma_discovery_smoke.py"
REMOTE_RESULTS_PATH = f"{REMOTE_STUDIO_DIR}/medgemma_discovery_smoke_results.json"
REMOTE_RUN_LOG_PATH = f"{REMOTE_STUDIO_DIR}/medgemma_discovery_smoke_run.log"

DISCOVERY_PROMPT_RULE_HEAVY = """You are a clinical genetics expert reading a GeneReviews chapter.

TASK: Find additional clinical phenotype features described in the text that are NOT already covered by the supplied anchor list. Include features that are implied but not explicitly named.

RULES:
1. Return JSON only.
2. Output a JSON array of objects with keys: label, status.
3. status must be exactly "present" or "excluded".
4. Do NOT output inheritance patterns, gene names, variants, molecular findings, lab methods, raw analytes, treatments, management actions, devices, broad disorder labels, future risk-only statements, or anything already covered by the anchors.
5. Do NOT output normal, preserved, intact, or unremarkable findings.
6. Use "excluded" only when an abnormal clinical feature is explicitly stated as absent / not present / not reported / not a feature.
7. Prefer concise canonical phenotype phrases when obvious.
8. Do NOT output HPO IDs.
9. If uncertain whether something is a phenotype versus a lab/test/management/risk statement, omit it.
10. Return only the JSON array, with no markdown fences and no explanation.
"""

DISCOVERY_PROMPT_CLINICIAN = """You are a clinical geneticist reading a GeneReviews chapter.

Your job is to find additional clinically meaningful phenotype findings that are supported by the text but are not already adequately covered by the supplied anchor list.

Read this like a physician, not like a string matcher:
- keep findings that add real clinical information
- allow more specific refinements if the text clearly supports them
- avoid restating broad findings that are already covered
- prefer phenotype concepts that would make sense in a patient's phenotype profile
- avoid fragments, examples inside a longer clause, and low-value school-task snippets

Ignore material that is not a phenotype finding, such as:
- inheritance, gene, or variant statements
- tests, methods, analytes, or raw measurements
- treatment, management, devices, or supports
- disease labels or syndrome names
- future risk, possible complications, or differential-style causes unless the text clearly asserts the finding is present now
- normal or preserved findings

Output:
- JSON only
- a JSON array of objects with keys: label, status
- status must be exactly "present" or "excluded"
- use "excluded" only when an abnormal feature is explicitly said to be absent or not reported
- do not output HPO IDs
- no markdown fences and no explanation
"""


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-id", default=DEFAULT_PROJECT_ID)
    parser.add_argument("--cloudspace-id", default=DEFAULT_CLOUDSPACE_ID)
    parser.add_argument("--cases-json", default=DEFAULT_CASES_JSON)
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--lightning-user-id", default=os.environ.get("LIGHTNING_USER_ID", ""))
    parser.add_argument("--lightning-api-key", default=os.environ.get("LIGHTNING_API_KEY", ""))
    parser.add_argument("--session-name", default="medgemma-smoke")
    parser.add_argument("--max-new-tokens", type=int, default=900)
    parser.add_argument("--temperature", type=float, default=0.1)
    parser.add_argument(
        "--prompt-style",
        choices=["clinician", "rule-heavy"],
        default="clinician",
    )
    return parser.parse_args()


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


def candidate_matches(candidate, expected):
    candidate_status = candidate.get("status") or "present"
    expected_status = expected.get("status") or "present"
    if candidate_status != expected_status:
        return False
    left = candidate.get("label") or ""
    right = expected.get("label") or ""
    left_norm = normalize_text(left)
    right_norm = normalize_text(right)
    return (
        left_norm == right_norm
        or left_norm in right_norm
        or right_norm in left_norm
        or dice_coefficient(left, right) >= 0.8
    )


def dedupe_candidates(items):
    seen = {}
    for item in items or []:
        label = str(item.get("label") or "").strip()
        if not label:
            continue
        status = "excluded" if item.get("status") == "excluded" else "present"
        key = f"{normalize_text(label)}::{status}"
        if key not in seen:
            seen[key] = {"label": label, "status": status}
    return list(seen.values())


def evaluate_case(test_case, predicted_candidates):
    expected = test_case.get("expectedNewCandidates") or []
    must_not = test_case.get("mustNotPropose") or []
    acceptable = test_case.get("acceptableExtraCandidates") or []

    consumed = set()
    matched_expected = []
    missed_expected = []

    for expected_candidate in expected:
        found_index = None
        for index, candidate in enumerate(predicted_candidates):
            if index in consumed:
                continue
            if candidate_matches(candidate, expected_candidate):
                found_index = index
                break
        if found_index is None:
            missed_expected.append(expected_candidate)
        else:
            consumed.add(found_index)
            matched_expected.append(
                {
                    "expected": expected_candidate,
                    "predicted": predicted_candidates[found_index],
                }
            )

    must_not_violations = []
    for blocked in must_not:
        violation = None
        for index, candidate in enumerate(predicted_candidates):
            if index in consumed:
                continue
            if candidate_matches(candidate, {"label": blocked["label"], "status": "present"}):
                violation = candidate
                break
        if violation:
            must_not_violations.append(
                {"label": blocked["label"], "reason": blocked["reason"], "predicted": violation}
            )

    acceptable_matches = []
    unexpected = []
    for index, candidate in enumerate(predicted_candidates):
        if index in consumed:
            continue
        acceptable_match = None
        for alternate in acceptable:
            if candidate_matches(candidate, alternate):
                acceptable_match = alternate
                break
        if acceptable_match:
            acceptable_matches.append({"expected": acceptable_match, "predicted": candidate})
        else:
            unexpected.append(candidate)

    return {
        "matchedExpectedCandidates": matched_expected,
        "missedExpectedCandidates": missed_expected,
        "mustNotProposeViolations": must_not_violations,
        "acceptableExtraMatches": acceptable_matches,
        "unexpectedPredictedCandidates": unexpected,
        "strictExactCaseMatch": (
            len(missed_expected) == 0
            and len(must_not_violations) == 0
            and len(unexpected) == 0
        ),
        "acceptableExactCaseMatch": len(missed_expected) == 0 and len(must_not_violations) == 0,
    }


def build_remote_script(cases, max_new_tokens, temperature, prompt_text):
    cases_b64 = base64.b64encode(json.dumps(cases).encode()).decode()
    prompt_b64 = base64.b64encode(prompt_text.encode()).decode()
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
            if isinstance(parsed, list):
                output = []
                for item in parsed:
                    if not isinstance(item, dict):
                        continue
                    label = str(item.get("label") or "").strip()
                    if not label:
                        continue
                    status = "excluded" if item.get("status") == "excluded" else "present"
                    output.append({{"label": label, "status": status}})
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
    prompt = (
        prompt_prefix
        + "\\nCASE ID: " + str(case.get("id"))
        + "\\nCHAPTER TITLE: " + str(case.get("chapter_title"))
        + "\\nEXISTING ANCHORS:\\n" + ("\\n".join(anchor_lines) if anchor_lines else "- none")
        + "\\nCLINICAL TEXT:\\n" + str(case.get("clinical_text") or "")
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
    with urllib.request.urlopen(req, timeout=1800) as response:
        raw = json.loads(response.read().decode())
    text = raw.get("output") or ""
    results.append({{
        "id": case.get("id"),
        "predictedCandidates": parse_json_candidates(text),
        "rawPreview": text[:1000]
    }})

with open("{REMOTE_RESULTS_PATH}", "w") as handle:
    json.dump(results, handle)
print("REMOTE_RESULTS_WRITTEN")
"""


def create_api(args):
    if not args.lightning_user_id or not args.lightning_api_key:
        raise SystemExit("LIGHTNING_USER_ID and LIGHTNING_API_KEY are required")
    auth = Auth()
    auth.user_id = args.lightning_user_id
    auth.api_key = args.lightning_api_key
    client = auth.create_api_client(override="api_key")
    return CloudSpaceServiceApi(client)


def wait_for_running(api, project_id, cloudspace_id, timeout_seconds=900):
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        status = api.cloud_space_service_get_cloud_space_instance_status(
            project_id=project_id,
            id=cloudspace_id,
        )
        inst = status.in_use
        phase = getattr(inst, "phase", None)
        message = getattr(inst, "status_message", None)
        print(f"studio_phase={phase} message={message}")
        if phase == "CLOUD_SPACE_INSTANCE_STATE_RUNNING":
            return
        time.sleep(10)
    raise RuntimeError("Timed out waiting for Lightning Studio to reach RUNNING")


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


def wait_for_remote_results(api, project_id, cloudspace_id, timeout_seconds=3600):
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        check_command = (
            "bash -lc 'python3 - <<\"INNER\"\n"
            "from pathlib import Path\n"
            f"results = Path(\"{REMOTE_RESULTS_PATH}\")\n"
            "if results.exists():\n"
            "    print(\"RESULTS_READY\")\n"
            "else:\n"
            f"    log = Path(\"{REMOTE_RUN_LOG_PATH}\")\n"
            "    print(\"RESULTS_PENDING\")\n"
            "    if log.exists():\n"
            "        text = log.read_text(errors=\"ignore\")\n"
            "        print(text[-1000:])\n"
            "INNER'"
        )
        output = exec_in_studio(
            api,
            project_id,
            cloudspace_id,
            check_command,
            "medgemma-smoke-poll",
        )
        if "RESULTS_READY" in output:
            return
        print(output.strip())
        time.sleep(20)
    raise RuntimeError("Timed out waiting for MedGemma smoke results file")


def main():
    args = parse_args()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    cases = json.loads(Path(args.cases_json).read_text())
    api = create_api(args)

    wait_for_running(api, args.project_id, args.cloudspace_id)

    health_command = (
        "bash -lc 'cd /teamspace/studios/this_studio && "
        "if [ -f serve.py ] && [ -f start_medgemma.sh ]; then "
        "bash start_medgemma.sh; "
        "else echo MISSING_SERVER_FILES; exit 2; fi && "
        "for i in $(seq 1 90); do "
        "curl -sf http://127.0.0.1:8000/health >/dev/null && echo HEALTH_OK && exit 0; "
        "sleep 10; "
        "done; "
        "echo HEALTH_TIMEOUT; exit 1'"
    )
    startup_output = exec_in_studio(
        api,
        args.project_id,
        args.cloudspace_id,
        health_command,
        "setup",
    )
    print(startup_output)
    if "HEALTH_OK" not in startup_output:
        raise RuntimeError("MedGemma server did not become healthy")

    prompt_text = (
        DISCOVERY_PROMPT_CLINICIAN
        if args.prompt_style == "clinician"
        else DISCOVERY_PROMPT_RULE_HEAVY
    )

    remote_script = build_remote_script(cases, args.max_new_tokens, args.temperature, prompt_text)
    remote_script_b64 = base64.b64encode(remote_script.encode()).decode()
    remote_command = (
        "bash -lc 'python3 - <<\"INNER\"\n"
        "import base64, pathlib\n"
        f"pathlib.Path(\"{REMOTE_SCRIPT_PATH}\").write_bytes(base64.b64decode(\"{remote_script_b64}\"))\n"
        "INNER\n"
        f"rm -f {REMOTE_RESULTS_PATH} {REMOTE_RUN_LOG_PATH}\n"
        f"nohup python3 {REMOTE_SCRIPT_PATH} > {REMOTE_RUN_LOG_PATH} 2>&1 &\n"
        "echo REMOTE_STARTED'"
    )
    remote_output = exec_in_studio(
        api,
        args.project_id,
        args.cloudspace_id,
        remote_command,
        args.session_name,
    )
    if "REMOTE_STARTED" not in remote_output:
        raise RuntimeError(f"Remote smoke script did not start cleanly: {remote_output[:500]}")

    wait_for_remote_results(api, args.project_id, args.cloudspace_id)

    fetch_command = (
        "bash -lc 'python3 - <<\"INNER\"\n"
        "import json\n"
        "from pathlib import Path\n"
        f"print(Path(\"{REMOTE_RESULTS_PATH}\").read_text())\n"
        "INNER'"
    )
    raw_output = exec_in_studio(
        api,
        args.project_id,
        args.cloudspace_id,
        fetch_command,
        "medgemma-smoke-fetch",
    )
    raw_results = json.loads(raw_output)

    report = []
    summary = {
        "total": len(cases),
        "strictExactMatchCount": 0,
        "acceptableExactMatchCount": 0,
        "expectedCandidateTotal": 0,
        "matchedExpectedCandidateTotal": 0,
        "mustNotProposeTotal": 0,
        "mustNotProposeViolationTotal": 0,
        "model": "google/medgemma-27b-text-it",
        "slice": "hardest_20_discovery_cases",
        "promptStyle": args.prompt_style,
    }

    for case in cases:
        result = next(item for item in raw_results if item["id"] == case["id"])
        predicted = dedupe_candidates(result.get("predictedCandidates") or [])
        evaluated = evaluate_case(case, predicted)
        summary["expectedCandidateTotal"] += len(case.get("expectedNewCandidates") or [])
        summary["matchedExpectedCandidateTotal"] += len(evaluated["matchedExpectedCandidates"])
        summary["mustNotProposeTotal"] += len(case.get("mustNotPropose") or [])
        summary["mustNotProposeViolationTotal"] += len(evaluated["mustNotProposeViolations"])
        if evaluated["strictExactCaseMatch"]:
            summary["strictExactMatchCount"] += 1
        if evaluated["acceptableExactCaseMatch"]:
            summary["acceptableExactMatchCount"] += 1
        report.append(
            {
                "id": case["id"],
                "chapter_title": case["chapter_title"],
                "predictedCandidates": predicted,
                "rawPreview": result.get("rawPreview"),
                **evaluated,
            }
        )

    summary["expectedCandidateRecall"] = (
        summary["matchedExpectedCandidateTotal"] / summary["expectedCandidateTotal"]
        if summary["expectedCandidateTotal"]
        else 0.0
    )
    summary["mustNotProposePassRate"] = (
        (summary["mustNotProposeTotal"] - summary["mustNotProposeViolationTotal"])
        / summary["mustNotProposeTotal"]
        if summary["mustNotProposeTotal"]
        else 0.0
    )

    (output_dir / "medgemma_hard20_summary.json").write_text(json.dumps(summary, indent=2))
    (output_dir / "medgemma_hard20_report.json").write_text(json.dumps(report, indent=2))
    (output_dir / "medgemma_hard20_raw_results.json").write_text(json.dumps(raw_results, indent=2))
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()

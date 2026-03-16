import json
from pathlib import Path

import requests
from pheval.utils.file_utils import files_with_suffix

from pheval_genovy.config import GenovyToolConfig


def resolve_dx_endpoint(config: GenovyToolConfig) -> str:
    if config.analysis_type == "gene":
        return "/api/dx/rank-genes"
    return "/api/dx/rank"


def prepare_command_logs(
    phenopacket_dir: Path,
    tool_input_commands_dir: Path,
    config: GenovyToolConfig,
) -> None:
    commands = []
    endpoint_path = resolve_dx_endpoint(config)
    for phenopacket_path in files_with_suffix(phenopacket_dir, ".json"):
        commands.append(
            "curl -X POST "
            f"{config.base_url}{endpoint_path} "
            "-H 'content-type: application/json' "
            f"--data @<{phenopacket_path.name}>"
        )

    tool_input_commands_dir.mkdir(parents=True, exist_ok=True)
    tool_input_commands_dir.joinpath("tool_input_commands.txt").write_text("\n".join(commands) + "\n")


def run_genovy_api(
    phenopacket_dir: Path,
    raw_results_dir: Path,
    tool_input_commands_dir: Path,
    config: GenovyToolConfig,
) -> None:
    raw_results_dir.mkdir(parents=True, exist_ok=True)
    prepare_command_logs(phenopacket_dir, tool_input_commands_dir, config)
    endpoint_path = resolve_dx_endpoint(config)

    for phenopacket_path in files_with_suffix(phenopacket_dir, ".json"):
        phenopacket = json.loads(phenopacket_path.read_text())
        response = requests.post(
            f"{config.base_url}{endpoint_path}",
            json={"phenopacket": phenopacket, "limit": config.top_k},
            timeout=config.request_timeout_seconds,
        )
        response.raise_for_status()
        raw_results_dir.joinpath(phenopacket_path.name).write_text(
            json.dumps(response.json(), indent=2) + "\n"
        )

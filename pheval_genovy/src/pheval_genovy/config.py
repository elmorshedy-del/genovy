from dataclasses import dataclass


@dataclass
class GenovyToolConfig:
    base_url: str = "https://genovy-production.up.railway.app"
    request_timeout_seconds: int = 60
    top_k: int = 100
    score_field: str = "normalizedScore"
    sort_order: str = "descending"
    analysis_type: str = "gene"


def parse_tool_config(raw_options: dict | None) -> GenovyToolConfig:
    raw_options = raw_options or {}
    return GenovyToolConfig(
        base_url=str(raw_options.get("base_url", "https://genovy-production.up.railway.app")).rstrip("/"),
        request_timeout_seconds=int(raw_options.get("request_timeout_seconds", 60)),
        top_k=int(raw_options.get("top_k", 100)),
        score_field=str(raw_options.get("score_field", "normalizedScore")),
        sort_order=str(raw_options.get("sort_order", "descending")),
        analysis_type=str(raw_options.get("analysis_type", "gene")).lower(),
    )

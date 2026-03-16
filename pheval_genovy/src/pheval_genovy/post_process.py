import json
from pathlib import Path

import polars as pl
from pheval.post_processing.post_processing import SortOrder, generate_disease_result, generate_gene_result
from pheval.utils.file_utils import files_with_suffix

from pheval_genovy.config import GenovyToolConfig


def extract_disease_results(raw_result: dict, score_field: str) -> pl.DataFrame:
    ranking_results = raw_result.get("ranking", {}).get("results", [])
    return pl.DataFrame(
        {
            "disease_identifier": [result["diseaseCurie"] for result in ranking_results],
            "score": [float(result.get(score_field, 0.0)) for result in ranking_results],
        }
    )


def extract_gene_results(raw_result: dict, score_field: str) -> pl.DataFrame:
    ranking_results = raw_result.get("ranking", {}).get("results", [])
    return pl.DataFrame(
        {
            "gene_symbol": [result.get("geneSymbol") or result.get("geneLabel", "") for result in ranking_results],
            "gene_identifier": [result.get("geneCurie", "") for result in ranking_results],
            "score": [float(result.get(score_field, 0.0)) for result in ranking_results],
        }
    )


def post_process_results(
    raw_results_dir: Path,
    output_dir: Path,
    phenopacket_dir: Path,
    config: GenovyToolConfig,
) -> None:
    sort_order = (
        SortOrder.ASCENDING if config.sort_order.lower() == "ascending" else SortOrder.DESCENDING
    )

    for raw_result_path in files_with_suffix(raw_results_dir, ".json"):
        raw_result = json.loads(raw_result_path.read_text())
        if config.analysis_type == "gene":
            generate_gene_result(
                results=extract_gene_results(raw_result, config.score_field),
                output_dir=output_dir,
                sort_order=sort_order,
                result_path=raw_result_path,
                phenopacket_dir=phenopacket_dir,
            )
        else:
            generate_disease_result(
                results=extract_disease_results(raw_result, config.score_field),
                output_dir=output_dir,
                sort_order=sort_order,
                result_path=raw_result_path,
                phenopacket_dir=phenopacket_dir,
            )

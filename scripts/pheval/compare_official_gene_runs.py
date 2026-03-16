#!/usr/bin/env python3
import argparse
import csv
import json
from pathlib import Path
from statistics import median

import pyarrow.parquet as pq


def normalize_gene_key(value):
    if value is None:
        return ""

    text = str(value).strip()
    if not text:
        return ""

    lower = text.lower()
    if lower.startswith("symbol:"):
        return f"symbol:{text.split(':', 1)[1].upper()}"
    if lower.startswith("ncbigene:"):
        return f"ncbigene:{text.split(':', 1)[1]}"
    if lower.startswith("hgnc:"):
        return f"hgnc:{text.split(':', 1)[1]}"
    if lower.startswith("ensembl:"):
        return f"ensembl:{text.split(':', 1)[1]}"
    if text.upper().startswith("ENSG"):
        return f"ensembl:{text.upper()}"
    return f"symbol:{text.upper()}"


def extract_truth_gene_keys(phenopacket):
    keys = set()

    interpretations = phenopacket.get("interpretations") or []
    for interpretation in interpretations:
        diagnoses = []
        if interpretation.get("diagnosis"):
            diagnoses.append(interpretation["diagnosis"])
        diagnoses.extend(interpretation.get("diagnoses") or [])

        for diagnosis in diagnoses:
            for genomic_interpretation in diagnosis.get("genomicInterpretations") or []:
                variation_descriptor = (
                    genomic_interpretation.get("variantInterpretation", {})
                    .get("variationDescriptor", {})
                )
                gene_context = variation_descriptor.get("geneContext") or {}

                for raw in [
                    gene_context.get("valueId"),
                    gene_context.get("symbol"),
                    *(gene_context.get("alternateIds") or []),
                ]:
                    key = normalize_gene_key(raw)
                    if key:
                        keys.add(key)

    return keys


def load_truth_cases(phenopacket_dir):
    truth_by_case = {}
    for phenopacket_path in sorted(Path(phenopacket_dir).glob("*.json")):
        phenopacket = json.loads(phenopacket_path.read_text())
        truth_by_case[phenopacket_path.stem] = {
            "file_name": phenopacket_path.name,
            "truth_gene_keys": extract_truth_gene_keys(phenopacket),
        }
    return truth_by_case


def load_genovy_rankings(results_dir):
    rankings = {}
    for parquet_path in sorted(Path(results_dir).glob("*.parquet")):
        case_id = parquet_path.name.removesuffix("-gene_result.parquet")
        table = pq.read_table(parquet_path)
        rows = table.to_pylist()
        rankings[case_id] = [
            {
                "rank": int(row["rank"]),
                "gene_symbol": str(row.get("gene_symbol") or ""),
                "gene_identifier": str(row.get("gene_identifier") or ""),
            }
            for row in rows
        ]
    return rankings


def load_exomiser_rankings(results_dir):
    rankings = {}
    for tsv_path in sorted(Path(results_dir).glob("*.tsv")):
        case_id = tsv_path.name.removesuffix("-pheval_gene_result.tsv")
        with tsv_path.open("r", newline="") as handle:
            reader = csv.DictReader(handle, delimiter="\t")
            rankings[case_id] = [
                {
                    "rank": int(float(row["rank"])),
                    "gene_symbol": row.get("gene_symbol") or "",
                    "gene_identifier": row.get("gene_identifier") or "",
                }
                for row in reader
            ]
    return rankings


def find_truth_rank(rows, truth_gene_keys):
    for row in rows:
        rank = int(row["rank"])
        if rank <= 0:
            continue
        candidate_keys = {
            normalize_gene_key(row.get("gene_symbol")),
            normalize_gene_key(row.get("gene_identifier")),
        }
        if candidate_keys & truth_gene_keys:
            return rank
    return None


def summarize_run(rank_by_case):
    total = len(rank_by_case)
    found_ranks = [rank for rank in rank_by_case.values() if rank is not None]

    def pct(count):
        return round((count / total) * 100, 2) if total else 0.0

    return {
        "case_count": total,
        "found_count": len(found_ranks),
        "found_pct": pct(len(found_ranks)),
        "top1_count": sum(1 for rank in found_ranks if rank <= 1),
        "top1_pct": pct(sum(1 for rank in found_ranks if rank <= 1)),
        "top3_count": sum(1 for rank in found_ranks if rank <= 3),
        "top3_pct": pct(sum(1 for rank in found_ranks if rank <= 3)),
        "top5_count": sum(1 for rank in found_ranks if rank <= 5),
        "top5_pct": pct(sum(1 for rank in found_ranks if rank <= 5)),
        "top10_count": sum(1 for rank in found_ranks if rank <= 10),
        "top10_pct": pct(sum(1 for rank in found_ranks if rank <= 10)),
        "median_rank": median(found_ranks) if found_ranks else None,
        "mrr": round(sum(1 / rank for rank in found_ranks) / total, 6) if total else 0.0,
    }


def compare_runs(genovy_ranks, exomiser_ranks):
    genovy_better = []
    exomiser_better = []
    ties = []
    genovy_only = []
    exomiser_only = []

    for case_id in sorted(set(genovy_ranks) | set(exomiser_ranks)):
        genovy_rank = genovy_ranks.get(case_id)
        exomiser_rank = exomiser_ranks.get(case_id)

        if genovy_rank is not None and exomiser_rank is None:
            genovy_only.append(case_id)
            continue
        if exomiser_rank is not None and genovy_rank is None:
            exomiser_only.append(case_id)
            continue
        if genovy_rank is None and exomiser_rank is None:
            ties.append(case_id)
            continue
        if genovy_rank < exomiser_rank:
            genovy_better.append(case_id)
        elif exomiser_rank < genovy_rank:
            exomiser_better.append(case_id)
        else:
            ties.append(case_id)

    return {
        "genovy_better_count": len(genovy_better),
        "exomiser_better_count": len(exomiser_better),
        "tie_count": len(ties),
        "genovy_found_exomiser_missed_count": len(genovy_only),
        "exomiser_found_genovy_missed_count": len(exomiser_only),
        "genovy_better_examples": genovy_better[:10],
        "exomiser_better_examples": exomiser_better[:10],
        "genovy_only_examples": genovy_only[:10],
        "exomiser_only_examples": exomiser_only[:10],
    }


def main():
    parser = argparse.ArgumentParser(
        description="Compare Genovy vs Exomiser on the official 100-case phenotype-only gene sample."
    )
    parser.add_argument(
        "--phenopacket-dir",
        default="output/pheval-official-sample-100/phenopackets",
    )
    parser.add_argument(
        "--genovy-results-dir",
        default="output/pheval-run-official-100/pheval_gene_results",
    )
    parser.add_argument(
        "--exomiser-results-dir",
        default="output/pheval-paper-results/exomiser-14.0.2-2406/phenopacket_store_0.1.11_phenotypes/pheval_gene_results",
    )
    parser.add_argument("--output-json", default="")
    args = parser.parse_args()

    truth_cases = load_truth_cases(args.phenopacket_dir)
    genovy_rankings = load_genovy_rankings(args.genovy_results_dir)
    exomiser_rankings = load_exomiser_rankings(args.exomiser_results_dir)

    genovy_ranks = {}
    exomiser_ranks = {}
    per_case = []

    for case_id, truth_case in truth_cases.items():
        truth_gene_keys = truth_case["truth_gene_keys"]
        genovy_rank = find_truth_rank(genovy_rankings.get(case_id, []), truth_gene_keys)
        exomiser_rank = find_truth_rank(exomiser_rankings.get(case_id, []), truth_gene_keys)
        genovy_ranks[case_id] = genovy_rank
        exomiser_ranks[case_id] = exomiser_rank
        per_case.append(
            {
                "case_id": case_id,
                "file_name": truth_case["file_name"],
                "truth_gene_keys": sorted(truth_gene_keys),
                "genovy_rank": genovy_rank,
                "exomiser_rank": exomiser_rank,
            }
        )

    report = {
        "phenopacket_dir": str(Path(args.phenopacket_dir).resolve()),
        "genovy_results_dir": str(Path(args.genovy_results_dir).resolve()),
        "exomiser_results_dir": str(Path(args.exomiser_results_dir).resolve()),
        "genovy_summary": summarize_run(genovy_ranks),
        "exomiser_summary": summarize_run(exomiser_ranks),
        "head_to_head": compare_runs(genovy_ranks, exomiser_ranks),
        "per_case": per_case,
    }

    if args.output_json:
        output_path = Path(args.output_json)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(report, indent=2))

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
import argparse
import csv
from pathlib import Path

try:
    import pyarrow as pa
    import pyarrow.parquet as pq
except ModuleNotFoundError as exc:
    raise SystemExit(
        "pyarrow is required to write PhEval parquet results. Install requirements-ml.txt first."
    ) from exc


def parse_args():
    parser = argparse.ArgumentParser(
        description="Convert Genovy DX TSV disease results into parquet files for PhEval workflows."
    )
    parser.add_argument("--results-dir", required=True, help="Directory containing *-disease_result.tsv files")
    return parser.parse_args()


def load_tsv_rows(tsv_path: Path):
    with tsv_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        rows = []
        for row in reader:
            rows.append(
                {
                    "disease_identifier": row["disease_identifier"],
                    "score": float(row["score"]),
                }
            )
    return rows


def main():
    args = parse_args()
    results_dir = Path(args.results_dir)
    files = sorted(results_dir.glob("*-disease_result.tsv"))
    if not files:
        raise SystemExit(f"No disease result TSV files found in {results_dir}")

    converted = 0
    for tsv_path in files:
        rows = load_tsv_rows(tsv_path)
        parquet_path = tsv_path.with_suffix(".parquet")
        table = pa.Table.from_pylist(rows, schema=pa.schema([
            ("disease_identifier", pa.string()),
            ("score", pa.float64()),
        ]))
        pq.write_table(table, parquet_path)
        converted += 1

    print(f"Converted {converted} TSV files to parquet in {results_dir}")


if __name__ == "__main__":
    main()

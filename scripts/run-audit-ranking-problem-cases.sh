#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/lib/benchmark-env.sh"
NODE_BIN="$(resolve_node_bin)"
OUTPUT_DIR="$(resolve_genovy_output_dir "$ROOT_DIR")"
JSON_OUT="${1:-$OUTPUT_DIR/ranked-output-audit-ranking-problem-cases-20260324.json}"
MD_OUT="${2:-$OUTPUT_DIR/ranked-output-audit-ranking-problem-cases-20260324.md}"
BENCHMARK_JSON="${GENOVY_RANKING_AUDIT_BENCHMARK_JSON:-$OUTPUT_DIR/official-benchmark-post-clinvar-run54.json}"
PHENOPACKET_DIR="${GENOVY_PHENOPACKET_DIR:-$OUTPUT_DIR/pheval-official-sample-100/phenopackets}"

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Put it in $ROOT_DIR/.env or export it first." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

"$NODE_BIN" "$ROOT_DIR/src/scripts/auditRankingProblemCases.js" \
  --phenopacket-dir "$PHENOPACKET_DIR" \
  --benchmark-json "$BENCHMARK_JSON" \
  --output-json "$JSON_OUT" \
  --output-md "$MD_OUT"

echo "Done."
echo "cat \"$MD_OUT\""

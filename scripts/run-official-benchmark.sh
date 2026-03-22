#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/lib/benchmark-env.sh"
NODE_BIN="$(resolve_node_bin)"
OUTPUT_DIR="$(resolve_genovy_output_dir "$ROOT_DIR")"
RUN_NAME="${1:-official-benchmark-$(date +%Y%m%d-%H%M%S)}"
JSON_OUT="$OUTPUT_DIR/${RUN_NAME}.json"
MD_OUT="$OUTPUT_DIR/${RUN_NAME}.md"
BASELINE_JSON="${GENOVY_BASELINE_JSON:-$OUTPUT_DIR/genovy-vs-exomiser-official-100-direct-edge-fix.json}"
PHENOPACKET_DIR="${GENOVY_PHENOPACKET_DIR:-$OUTPUT_DIR/pheval-official-sample-100/phenopackets}"
EXOMISER_DIR="${GENOVY_EXOMISER_DIR:-$OUTPUT_DIR/pheval-paper-results/exomiser-14.0.2-2406/phenopacket_store_0.1.11_phenotypes/pheval_gene_results}"

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

echo "Running official benchmark..."
echo "OUTPUT_DIR=$OUTPUT_DIR"
echo "JSON_OUT=$JSON_OUT"
echo "MD_OUT=$MD_OUT"

"$NODE_BIN" "$ROOT_DIR/src/scripts/benchmarkOfficialGeneRun.js" \
  --phenopacket-dir "$PHENOPACKET_DIR" \
  --exomiser-results-dir "$EXOMISER_DIR" \
  --baseline-json "$BASELINE_JSON" \
  --output-json "$JSON_OUT" \
  --output-md "$MD_OUT"

echo
echo "Done."
echo "cat \"$MD_OUT\""

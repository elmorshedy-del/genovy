#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/lib/benchmark-env.sh"
NODE_BIN="$(resolve_node_bin)"
OUTPUT_DIR="$(resolve_genovy_output_dir "$ROOT_DIR")"
RUN_NAME="${1:-truth-missed-source-backed-$(date +%Y%m%d-%H%M%S)}"
GAP_JSON="${GENOVY_TRUTH_MISSED_GAPS_JSON:-$OUTPUT_DIR/truth-missed-term-gaps-pass-1.json}"
JSON_OUT="$OUTPUT_DIR/${RUN_NAME}.json"
MD_OUT="$OUTPUT_DIR/${RUN_NAME}.md"

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

echo "Classifying missed truth-gene gaps against imported human phenotype sources..."
echo "GAP_JSON=$GAP_JSON"
echo "JSON_OUT=$JSON_OUT"
echo "MD_OUT=$MD_OUT"

"$NODE_BIN" "$ROOT_DIR/src/scripts/classifyTruthMissedSourceBacked.js" \
  --gap-json "$GAP_JSON" \
  --output-json "$JSON_OUT" \
  --output-md "$MD_OUT"

echo
echo "Done."
echo "cat \"$MD_OUT\""

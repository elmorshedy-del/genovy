#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/lib/benchmark-env.sh"
NODE_BIN="$(resolve_node_bin)"
OUTPUT_DIR="$(resolve_genovy_output_dir "$ROOT_DIR")"
RUN_NAME="${1:-truth-missed-term-fill-priority-$(date +%Y%m%d-%H%M%S)}"
GAP_JSON="${GENOVY_TRUTH_MISSED_GAPS_JSON:-$OUTPUT_DIR/truth-missed-term-gaps-pass-1.json}"
JSON_OUT="$OUTPUT_DIR/${RUN_NAME}.json"
MD_OUT="$OUTPUT_DIR/${RUN_NAME}.md"

mkdir -p "$OUTPUT_DIR"

echo "Summarizing missed truth-gene fill priorities..."
echo "GAP_JSON=$GAP_JSON"
echo "JSON_OUT=$JSON_OUT"
echo "MD_OUT=$MD_OUT"

"$NODE_BIN" "$ROOT_DIR/src/scripts/summarizeTruthMissedTermGaps.js" \
  --gap-json "$GAP_JSON" \
  --output-json "$JSON_OUT" \
  --output-md "$MD_OUT"

echo
echo "Done."
echo "cat \"$MD_OUT\""

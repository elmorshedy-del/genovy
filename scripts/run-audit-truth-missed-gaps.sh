#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/lib/benchmark-env.sh"
NODE_BIN="$(resolve_node_bin)"
OUTPUT_DIR="$(resolve_genovy_output_dir "$ROOT_DIR")"
RUN_NAME="${1:-truth-missed-term-gaps-$(date +%Y%m%d-%H%M%S)}"
JSON_OUT="$OUTPUT_DIR/${RUN_NAME}.json"
MD_OUT="$OUTPUT_DIR/${RUN_NAME}.md"
PHENOPACKET_DIR="${GENOVY_PHENOPACKET_DIR:-$OUTPUT_DIR/pheval-official-sample-100/phenopackets}"
AUDIT_JSON="${GENOVY_TRUTH_AUDIT_JSON:-$OUTPUT_DIR/truth-coverage-pass-2.json}"

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

echo "Running missed truth-gene term gap audit..."
echo "OUTPUT_DIR=$OUTPUT_DIR"
echo "AUDIT_JSON=$AUDIT_JSON"
echo "JSON_OUT=$JSON_OUT"
echo "MD_OUT=$MD_OUT"

"$NODE_BIN" "$ROOT_DIR/src/scripts/auditTruthMissedTermGaps.js" \
  --audit-json "$AUDIT_JSON" \
  --phenopacket-dir "$PHENOPACKET_DIR" \
  --output-json "$JSON_OUT" \
  --output-md "$MD_OUT"

echo
echo "Done."
echo "cat \"$MD_OUT\""

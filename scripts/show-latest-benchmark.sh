#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/lib/benchmark-env.sh"
OUTPUT_DIR="$(resolve_genovy_output_dir "$ROOT_DIR")"

LATEST_MD="$(ls -t "$OUTPUT_DIR"/*.md 2>/dev/null | head -n 1 || true)"
LATEST_JSON="$(ls -t "$OUTPUT_DIR"/*.json 2>/dev/null | head -n 1 || true)"

if [[ -n "$LATEST_MD" ]]; then
  cat "$LATEST_MD"
  exit 0
fi

if [[ -n "$LATEST_JSON" ]]; then
  jq . "$LATEST_JSON" | less -SR
  exit 0
fi

echo "No benchmark output files found in $OUTPUT_DIR" >&2
exit 1

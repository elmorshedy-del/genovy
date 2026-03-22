#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/lib/benchmark-env.sh"
NODE_BIN="$(resolve_node_bin)"
OUTPUT_DIR="$(resolve_genovy_output_dir "$ROOT_DIR")"
RUN_NAME="${1:-shadow-child-profile-borrow-$(date +%Y%m%d-%H%M%S)}"
JSON_OUT="$OUTPUT_DIR/${RUN_NAME}.json"
MD_OUT="$OUTPUT_DIR/${RUN_NAME}.md"
PHENOPACKET_DIR="${GENOVY_PHENOPACKET_DIR:-$OUTPUT_DIR/pheval-official-sample-100/phenopackets}"
WORKER_COUNT="${GENOVY_BENCHMARK_WORKERS:-1}"
PARTS_DIR="$OUTPUT_DIR/${RUN_NAME}.parts"

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Put it in $ROOT_DIR/.env or export it first." >&2
  exit 1
fi

if ! [[ "$WORKER_COUNT" =~ ^[1-9][0-9]*$ ]]; then
  echo "GENOVY_BENCHMARK_WORKERS must be a positive integer." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "Running child-direct profile borrow shadow..."
echo "OUTPUT_DIR=$OUTPUT_DIR"
echo "JSON_OUT=$JSON_OUT"
echo "MD_OUT=$MD_OUT"
echo "WORKERS=$WORKER_COUNT"

if (( WORKER_COUNT == 1 )); then
  "$NODE_BIN" "$ROOT_DIR/src/scripts/shadowChildProfileBorrow.js" \
    --phenopacket-dir "$PHENOPACKET_DIR" \
    --output-json "$JSON_OUT" \
    --output-md "$MD_OUT"
else
  rm -rf "$PARTS_DIR"
  mkdir -p "$PARTS_DIR"

  pids=()
  for (( shard_index=0; shard_index<WORKER_COUNT; shard_index+=1 )); do
    "$NODE_BIN" "$ROOT_DIR/src/scripts/shadowChildProfileBorrow.js" \
      --phenopacket-dir "$PHENOPACKET_DIR" \
      --output-json "$PARTS_DIR/part-$shard_index.json" \
      --output-md "$PARTS_DIR/part-$shard_index.md" \
      --shard-index "$shard_index" \
      --shard-count "$WORKER_COUNT" &
    pids+=("$!")
  done

  failed=0
  for pid in "${pids[@]}"; do
    if ! wait "$pid"; then
      failed=1
    fi
  done

  if (( failed == 1 )); then
    echo "One or more shard workers failed." >&2
    exit 1
  fi

  "$NODE_BIN" "$ROOT_DIR/src/scripts/mergeShadowBenchmarkReports.js" \
    --input-dir "$PARTS_DIR" \
    --output-json "$JSON_OUT" \
    --output-md "$MD_OUT"
fi

echo
echo "Done."
echo "cat \"$MD_OUT\""
echo "Rollback: rm -f \"$JSON_OUT\" \"$MD_OUT\" && rm -rf \"$PARTS_DIR\""

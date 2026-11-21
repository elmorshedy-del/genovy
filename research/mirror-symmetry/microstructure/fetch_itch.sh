#!/usr/bin/env bash
# Download Nasdaq TotalView-ITCH 5.0 sample days (resumable), extract a few symbols with itch_filter,
# then delete the raw file. Each raw day is 13-18 GB compressed; ~1.3-3 GB of events are kept.
# Usage: ./fetch_itch.sh            (defaults below)
#        ITCH_RAW_DIR=/big/disk ./fetch_itch.sh
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="${ITCH_OUT_DIR:-$HERE/../data/itch}"
RAW="${ITCH_RAW_DIR:-$HERE/../data/itch_raw}"
mkdir -p "$OUT" "$RAW"
[ -x "$HERE/itch_filter" ] || gcc -O3 -o "$HERE/itch_filter" "$HERE/itch_filter.c"
SYMS="${ITCH_SYMBOLS:-SPY QQQ IWM AAPL NVDA TSLA}"
BASE="https://emi.nasdaq.com/ITCH/Nasdaq%20ITCH"
# file on emi.nasdaq.com -> trading date (verified from prices inside the file for 05_15)
FILES=("itch50_05_15.gz:2026-05-15" "itch50_05_18.gz:2026-05-18" "S061226-v50.txt.gz:2026-06-12" "S121025-v50.txt.gz:2025-12-10")
for fl in "${FILES[@]}"; do
  f="${fl%%:*}"; d="${fl##*:}"
  if [ -s "$OUT/$d.events.bin" ] && [ -f "$OUT/$d.done" ]; then echo "$(date +%T) skip $d"; continue; fi
  echo "$(date +%T) downloading $f ($d)"
  for attempt in 1 2 3 4 5 6; do
    curl -s -C - --retry 5 --retry-delay 5 -o "$RAW/$f" "$BASE/$f" && break
    echo "$(date +%T) curl attempt $attempt failed, retrying"; sleep $((attempt*10))
  done
  echo "$(date +%T) filtering $d"
  gzip -dc "$RAW/$f" | "$HERE/itch_filter" "$OUT/$d" $SYMS
  status=$?
  echo "$(date +%T) filter exit $status"
  if [ $status -eq 0 ]; then touch "$OUT/$d.done"; rm -f "$RAW/$f"; fi
done
echo "$(date +%T) ALL DONE"

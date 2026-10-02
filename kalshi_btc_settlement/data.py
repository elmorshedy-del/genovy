"""Historical data for backtesting the settlement engine.

- Kalshi public REST: settled markets (official settlement averages in
  `expiration_value`) and per-market trades. No API key needed.
- Binance 1-second BTCUSDT klines (data-api.binance.vision) as a stand-in for
  historical BRTI, which is not publicly downloadable second by second. The
  USDT/USD basis is removed per window using the previous window's official
  settlement value, so no future information leaks in.

Responses are cached on disk under .cache/ so reruns are offline.
"""

from __future__ import annotations

import hashlib
import json
import time
from datetime import datetime
from pathlib import Path

import requests

KALSHI = "https://api.elections.kalshi.com/trade-api/v2"
BINANCE = "https://data-api.binance.vision/api/v3"
CACHE = Path(__file__).resolve().parent / ".cache"

_session = requests.Session()


def _get(url: str, params: dict, cache: bool = True) -> dict | list:
    key = hashlib.sha1((url + json.dumps(params, sort_keys=True)).encode()).hexdigest()
    path = CACHE / f"{key}.json"
    if cache and path.exists():
        return json.loads(path.read_text())
    for attempt in range(5):
        resp = _session.get(url, params=params, timeout=20)
        if resp.status_code == 429 or resp.status_code >= 500:
            time.sleep(2 ** attempt)
            continue
        resp.raise_for_status()
        data = resp.json()
        if cache:
            CACHE.mkdir(exist_ok=True)
            path.write_text(json.dumps(data))
        return data
    resp.raise_for_status()
    raise RuntimeError(f"giving up on {url}")


def iso_to_ts(value: str) -> float:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()


def settled_markets(series: str, min_close_ts: int, max_close_ts: int) -> list[dict]:
    markets, cursor = [], None
    while True:
        params = {"series_ticker": series, "status": "settled", "limit": 1000,
                  "min_close_ts": min_close_ts, "max_close_ts": max_close_ts}
        if cursor:
            params["cursor"] = cursor
        page = _get(f"{KALSHI}/markets", params)
        markets.extend(page["markets"])
        cursor = page.get("cursor")
        if not cursor or not page["markets"]:
            return markets


def market_trades(ticker: str, min_ts: int, max_ts: int) -> list[dict]:
    trades, cursor = [], None
    while True:
        params = {"ticker": ticker, "limit": 1000, "min_ts": min_ts, "max_ts": max_ts}
        if cursor:
            params["cursor"] = cursor
        page = _get(f"{KALSHI}/markets/trades", params)
        trades.extend(page["trades"])
        cursor = page.get("cursor")
        if not cursor or not page["trades"]:
            return trades


def binance_seconds(start_ts: int, end_ts: int) -> dict[int, float]:
    """{second: close price} for one-second klines with open time in [start_ts, end_ts)."""
    out: dict[int, float] = {}
    cursor = start_ts
    while cursor < end_ts:
        rows = _get(f"{BINANCE}/klines", {
            "symbol": "BTCUSDT", "interval": "1s",
            "startTime": cursor * 1000, "endTime": end_ts * 1000 - 1, "limit": 1000,
        })
        if not rows:
            break
        for row in rows:
            out[row[0] // 1000] = float(row[4])
        cursor = rows[-1][0] // 1000 + 1
    return out

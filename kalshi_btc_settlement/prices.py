"""Composite one-second BTC/USD reference price.

BTC spot is thin enough right now that any single venue's last trade sits
pinned for minutes and venues disagree by $20-40 at the same moment.
Chainlink's TWAP and CF's BRTI both aggregate many venues, so a single
exchange is a poor stand-in mid-window. This builds a per-second median
across several venues with public historical second-level data:

  Binance BTCUSDT 1s klines, OKX BTC-USDT and BTC-USDC 1s candles,
  Kraken XBTUSD trades, Gemini BTCUSD trades.

Each venue's last price is carried forward, and the median is taken over
venues that have printed at all. The result is cached per range.
"""

from __future__ import annotations

import gzip
import json
import statistics

from . import data

OKX = "https://www.okx.com/api/v5/market/history-candles"


def okx_seconds(inst: str, start: int, end: int) -> dict[int, float]:
    out: dict[int, float] = {}
    cursor = end + 1  # OKX pages backwards: candles strictly older than `after`
    while cursor > start:
        page = data._get(OKX, {"instId": inst, "bar": "1s", "after": cursor * 1000, "limit": 100})
        rows = page.get("data") or []
        if not rows:
            break
        for r in rows:
            out[int(r[0]) // 1000] = float(r[4])
        cursor = min(int(r[0]) // 1000 for r in rows)
    return {t: p for t, p in out.items() if start <= t < end}


def kraken_trades(start: int, end: int) -> list[tuple[float, float]]:
    out, since = [], start * 10**9
    while True:
        page = data._get("https://api.kraken.com/0/public/Trades",
                         {"pair": "XBTUSD", "since": since, "count": 1000})
        rows = page["result"]["XXBTZUSD"]
        out.extend((float(r[2]), float(r[0])) for r in rows)
        if not rows or float(rows[-1][2]) >= end or len(rows) < 1000:
            return [t for t in out if t[0] < end]
        since = int(page["result"]["last"])


def gemini_trades(start: int, end: int) -> list[tuple[float, float]]:
    out, ts = [], start
    while ts < end:
        rows = data._get("https://api.gemini.com/v1/trades/btcusd", {"timestamp": ts, "limit_trades": 500})
        if not rows:
            break
        out.extend((r["timestampms"] / 1000, float(r["price"])) for r in rows)
        newest = max(r["timestamp"] for r in rows)
        if len(rows) < 500 or newest <= ts:
            break
        ts = newest
    return [t for t in out if t[0] < end]


def _trades_to_seconds(trades: list[tuple[float, float]]) -> dict[int, float]:
    """Last trade price in each second (trade at 12.4s is visible at second 13)."""
    out: dict[int, float] = {}
    for t, p in sorted(trades):
        out[int(t) + 1] = p
    return out


def composite(start: int, end: int, lead: int = 600) -> dict[int, float]:
    """{second: median venue price} for seconds in [start, end).

    `lead` seconds before `start` are fetched so every venue has a last
    price to carry forward from the first second on.
    """
    path = data.CACHE / f"composite_{start}_{end}.json.gz"
    if path.exists():
        return {int(k): v for k, v in json.loads(gzip.decompress(path.read_bytes())).items()}
    a = start - lead
    # Binance kline t closes at the last trade before t+1, so it is visible at t+1.
    binance = {t + 1: p for t, p in data.binance_seconds(a - 1, end).items()}
    venues = [
        binance,
        {t + 1: p for t, p in okx_seconds("BTC-USDT", a - 1, end).items()},
        {t + 1: p for t, p in okx_seconds("BTC-USDC", a - 1, end).items()},
        _trades_to_seconds(kraken_trades(a, end)),
        _trades_to_seconds(gemini_trades(a, end)),
    ]
    last = [None] * len(venues)
    out: dict[int, float] = {}
    for t in range(a, end):
        for i, v in enumerate(venues):
            if t in v:
                last[i] = v[t]
        live = [p for p in last if p is not None]
        if t >= start and live:
            out[t] = statistics.median(live)
    data.CACHE.mkdir(exist_ok=True)
    path.write_bytes(gzip.compress(json.dumps(out).encode()))
    return out

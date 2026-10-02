"""Watch the live BRTI settlement input through Kalshi's websocket and run the engine.

Requires a Kalshi API key (any account; the CF Benchmarks channel is a
pass-through available to all users):

    export KALSHI_API_KEY_ID=...
    export KALSHI_PRIVATE_KEY_PATH=/path/to/kalshi-key.pem
    pip install websockets
    python -m kalshi_btc_settlement.live                 # next KXBTC15M market
    python -m kalshi_btc_settlement.live --ticker KXBTCD-26OCT0218-T84499.99

Every BRTI tick updates the engine; once the final minute starts it prints
the running settlement average, the average the remaining seconds would
need, how many sigmas away that is, and P(yes). It also prints Kalshi's own
`last_60s_windowed_average_15min`, which should match the engine's running
average; a mismatch means the window alignment is off.
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import json
import os
import time
from collections import deque

import requests

from .data import KALSHI, iso_to_ts
from .engine import SettlementWindow, estimate_sigma_per_sec

WS_URL = "wss://external-api-ws.kalshi.com/trade-api/ws/v2"
WS_PATH = "/trade-api/ws/v2"
VOL_LOOKBACK_SECONDS = 840


def parse_cf_message(raw: str | dict) -> dict | None:
    """Pull the fields the engine needs out of a `cfbenchmarks_value` frame."""
    msg = json.loads(raw) if isinstance(raw, str) else raw
    if msg.get("type") != "cfbenchmarks_value":
        return None
    body = msg["msg"]
    frame = json.loads(body["data"]) if isinstance(body.get("data"), str) else body.get("data") or {}
    window = body.get("last_60s_windowed_average_15min") or {}
    return {
        "index_id": body.get("index_id") or frame.get("id"),
        "ts": int(frame.get("time") or body["received_at"]) / 1000.0,
        "price": float(frame["value"]),
        "kalshi_window_avg": float(window["value"]) if window.get("value") else None,
        "kalshi_window_size": window.get("window_size"),
    }


def auth_headers(key_id: str, private_key_pem: bytes) -> dict:
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import ed25519, padding

    key = serialization.load_pem_private_key(private_key_pem, password=None)
    ts = str(int(time.time() * 1000))
    message = (ts + "GET" + WS_PATH).encode()
    if isinstance(key, ed25519.Ed25519PrivateKey):
        sig = key.sign(message)
    else:
        sig = key.sign(message, padding.PSS(mgf=padding.MGF1(hashes.SHA256()),
                                            salt_length=padding.PSS.DIGEST_LENGTH), hashes.SHA256())
    return {"KALSHI-ACCESS-KEY": key_id, "KALSHI-ACCESS-SIGNATURE": base64.b64encode(sig).decode(),
            "KALSHI-ACCESS-TIMESTAMP": ts}


def pick_market(series: str, ticker: str | None) -> dict:
    if ticker:
        return requests.get(f"{KALSHI}/markets/{ticker}", timeout=10).json()["market"]
    markets = requests.get(f"{KALSHI}/markets", params={"series_ticker": series, "status": "open", "limit": 200},
                           timeout=10).json()["markets"]
    return min(markets, key=lambda m: iso_to_ts(m["close_time"]))


def format_state(st, kalshi_avg) -> str:
    if st.final_value is not None:
        return f"FINAL {st.final_value:,.2f} -> {st.status}"
    if st.observed == 0:
        return "waiting for settlement minute"
    check = f" | kalshi avg {kalshi_avg:,.2f}" if kalshi_avg is not None else ""
    return (f"{st.observed:2d}/60 fixed | running avg {st.running_average:,.2f} | last {st.last_price:,.2f} | "
            f"remaining {st.remaining}s must avg {st.required_remaining_average:,.2f} "
            f"({st.required_move:+,.2f}, {st.required_move_sigmas:+.1f}σ) | P(yes) {st.p_yes:.4f} | {st.status}{check}")


async def run(args) -> None:
    import websockets

    market = pick_market(args.series, args.ticker)
    close = int(iso_to_ts(market["close_time"]))
    strike = market.get("floor_strike")
    print(f"{market['ticker']}: close {market['close_time']} strike {strike} ({market.get('strike_type')})")
    history: deque[tuple[int, float]] = deque(maxlen=VOL_LOOKBACK_SECONDS)
    window = None
    headers = auth_headers(os.environ["KALSHI_API_KEY_ID"], open(os.environ["KALSHI_PRIVATE_KEY_PATH"], "rb").read())
    async with websockets.connect(WS_URL, additional_headers=headers) as ws:
        await ws.send(json.dumps({"id": 1, "cmd": "subscribe",
                                  "params": {"channels": ["cfbenchmarks_value"], "index_ids": ["BRTI"]}}))
        async for raw in ws:
            tick = parse_cf_message(raw)
            if not tick or tick["index_id"] != "BRTI":
                continue
            second = int(tick["ts"])
            if not history or second > history[-1][0]:
                history.append((second, tick["price"]))
            if strike is None:
                # 15-minute strikes are only known once the previous window settles.
                strike = pick_market(args.series, market["ticker"]).get("floor_strike")
                if strike is None:
                    continue
            if window is None:
                window = SettlementWindow(strike=float(strike), close_ts=close, sigma_per_sec=1.0,
                                          strike_type=market.get("strike_type", "greater"),
                                          round_to_cents=market["ticker"].startswith("KXBTC15M"))
            window.sigma_per_sec = estimate_sigma_per_sec([p for s, p in history if s < window.start_ts])
            if window.in_window(second):
                window.add_tick(tick["ts"], tick["price"])
                print(time.strftime("%H:%M:%S", time.gmtime(second)), format_state(window.state(), tick["kalshi_window_avg"]))
            elif second < window.start_ts:
                p = window.forecast(tick["price"], seconds_until_window=window.start_ts - second)
                print(time.strftime("%H:%M:%S", time.gmtime(second)),
                      f"BRTI {tick['price']:,.2f} | {window.start_ts - second}s to window | σ/s {window.sigma_per_sec:.2f} | P(yes) {p:.4f}")
            if second >= close:
                print(format_state(window.state(), tick["kalshi_window_avg"]))
                return


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--series", default="KXBTC15M")
    ap.add_argument("--ticker", default=None)
    asyncio.run(run(ap.parse_args()))


if __name__ == "__main__":
    main()

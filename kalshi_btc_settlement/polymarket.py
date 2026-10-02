"""Find consistently profitable wallets in Polymarket's BTC 15-minute up/down
markets and reverse-engineer what they do.

Polymarket's trade tape is public down to the wallet, for takers and every
maker they hit. Since 7 Aug 2026 these markets settle on a 60-second Chainlink
BTC/USD TWAP at both ends (price to beat at the open, final price at the
close), the same structure as Kalshi's BRTI average, so the settlement engine
applies directly.

Steps:
  1. Collect every fill (maker and taker) for each btc-updown-15m market.
  2. Score each wallet: P&L after taker fees, per market and per day.
  3. Keep wallets that are profitable consistently, not in one lucky burst.
  4. Profile them: maker/taker mix, timing relative to the close, prices,
     and how their trades line up with the engine's P(win) at that moment.

Usage: python -m kalshi_btc_settlement.polymarket --days 7
"""

from __future__ import annotations

import argparse
import gzip
import json
import math
import statistics
import time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor

from . import data
from .engine import SettlementWindow, WINDOW_SECONDS, estimate_sigma_per_sec

GAMMA = "https://gamma-api.polymarket.com"
DATA_API = "https://data-api.polymarket.com"
WINDOW = 900
FEE_RATE = 0.07


def taker_fee(size: float, price: float) -> float:
    return FEE_RATE * size * price * (1 - price)


def load_market(start: int) -> dict | None:
    events = data._get(f"{GAMMA}/events", {"slug": f"btc-updown-15m-{start}"})
    if not events:
        return None
    ev = events[0]
    meta = ev.get("eventMetadata") or {}
    m = ev["markets"][0]
    prices = json.loads(m.get("outcomePrices") or "[]")
    if not ev.get("closed") or "finalPrice" not in meta or prices not in (["1", "0"], ["0", "1"]):
        return None
    return {"start": start, "end": start + WINDOW, "condition": m["conditionId"],
            "strike": float(meta["priceToBeat"]), "final": float(meta["finalPrice"]),
            "winner": "Up" if prices == ["1", "0"] else "Down"}


MAX_OFFSET = 10000  # data-api refuses offsets beyond this


def _trades_between(condition: str, taker_only: bool, lo: int, hi: int) -> list[dict] | None:
    """All trades with lo <= timestamp <= hi, or None if the slice is too big to page."""
    out, offset = [], 0
    while True:
        page = data._get(f"{DATA_API}/trades", {"market": condition, "limit": 500, "offset": offset,
                                                "takerOnly": "true" if taker_only else "false",
                                                "start": lo, "end": hi}, cache=False)
        out.extend(page)
        if len(page) < 500:
            return out
        offset += 500
        if offset >= MAX_OFFSET:
            return None


def _all_trades(condition: str, taker_only: bool, lo: int, hi: int) -> list[dict]:
    """Page through a market's trades, halving the time slice whenever it hits the offset cap."""
    got = _trades_between(condition, taker_only, lo, hi)
    if got is not None:
        return got
    if hi <= lo:
        raise RuntimeError(f"more than {MAX_OFFSET} trades in one second for {condition}")
    mid = (lo + hi) // 2
    return _all_trades(condition, taker_only, lo, mid) + _all_trades(condition, taker_only, mid + 1, hi)


def load_fills(mkt: dict) -> list[dict]:
    """Every fill from each participant's own side, flagged taker or maker.

    Raw pages run to ~7 MB a market, so only the compact fills are cached.
    """
    path = data.CACHE / f"pm_fills_{mkt['condition']}.json.gz"
    if path.exists():
        return json.loads(gzip.decompress(path.read_bytes()))
    lo, hi = mkt["start"] - 86400, mkt["end"] + 86400
    taker_keys = {(t["transactionHash"], t["proxyWallet"], t["asset"], t["side"])
                  for t in _all_trades(mkt["condition"], True, lo, hi)}
    fills = []
    seen = set()
    for t in _all_trades(mkt["condition"], False, lo, hi):
        key = (t["transactionHash"], t["proxyWallet"], t["asset"], t["side"], t["size"], t["price"])
        if key in seen:
            continue
        seen.add(key)
        fills.append({"wallet": t["proxyWallet"], "name": t.get("pseudonym") or t.get("name"),
                      "side": t["side"], "outcome": t["outcome"], "size": float(t["size"]),
                      "price": float(t["price"]), "ts": int(t["timestamp"]),
                      "taker": key[:4] in taker_keys})
    data.CACHE.mkdir(exist_ok=True)
    path.write_bytes(gzip.compress(json.dumps(fills).encode()))
    return fills


def fill_pnl(f: dict, winner: str) -> float:
    won = 1.0 if f["outcome"] == winner else 0.0
    gross = f["size"] * (won - f["price"]) if f["side"] == "BUY" else f["size"] * (f["price"] - won)
    return gross - (taker_fee(f["size"], f["price"]) if f["taker"] else 0.0)


def engine_path(mkt: dict) -> dict[int, float] | None:
    """Engine P(Up) for every second from the open to the close.

    Uses Binance 1-second prices shifted onto the Chainlink level with the
    published price to beat (the TWAP of the minute before the open). Before
    the final minute this is the engine's forecast; inside it, the running
    settlement average does the work.
    """
    s, e = mkt["start"], mkt["end"]
    proxy = data.binance_seconds(s - 70, e + 2)
    open_min = [proxy.get(t - 1) for t in range(s - 59, s + 1)]
    if None in open_min:
        return None
    basis = mkt["strike"] - sum(open_min) / len(open_min)
    px = {t: proxy[t - 1] + basis for t in range(s - 59, e + 1) if t - 1 in proxy}
    if len(px) < (e - s + 60) * 0.98:
        return None
    path = {}
    w = SettlementWindow(strike=mkt["strike"], close_ts=e, sigma_per_sec=1.0,
                         strike_type="greater_or_equal", value_noise=7.0)
    hist = []
    last = None
    for t in range(s, e):
        last = px.get(t, last)
        hist.append(last)
        w.sigma_per_sec = estimate_sigma_per_sec(hist[-600:]) if len(hist) > 30 else 3.0
        if t < w.start_ts:
            path[t] = w.forecast(last, seconds_until_window=w.start_ts - t)
        else:
            path[t] = w.state().p_yes if w.prices else w.forecast(last)
            w.add_tick(t, last)
    return path


def collect(days: float, workers: int = 8, end_days_ago: float = 0) -> list[dict]:
    end = int(time.time() - end_days_ago * 86400) // WINDOW * WINDOW - 2 * WINDOW
    starts = list(range(end - int(days * 86400), end, WINDOW))

    def one(start):
        try:
            mkt = load_market(start)
            if not mkt:
                return None
            mkt["fills"] = load_fills(mkt)
            mkt["path"] = engine_path(mkt)
            return mkt
        except Exception as exc:  # one bad market shouldn't kill a week of data
            print(f"skip {start}: {exc}")
            return None

    with ThreadPoolExecutor(workers) as pool:
        return [m for m in pool.map(one, starts) if m]


def proxy_check(markets: list[dict]) -> dict:
    """How well the proxy-driven engine called the final TWAP side."""
    errs, right = [], 0
    for m in markets:
        if m["path"]:
            p = m["path"][m["end"] - 1]
            right += (p >= 0.5) == (m["winner"] == "Up")
            errs.append(abs(m["final"] - m["strike"]))
    return {"markets_with_proxy": len(errs), "engine_side_at_last_second": right / max(len(errs), 1),
            "median_abs_final_minus_strike": statistics.median(errs) if errs else None}


def score_wallets(markets: list[dict]) -> dict[str, dict]:
    w = defaultdict(lambda: {"pnl": 0.0, "volume": 0.0, "fills": 0, "taker_fills": 0,
                             "per_market": defaultdict(float), "per_day": defaultdict(float), "name": None})
    for m in markets:
        day = time.strftime("%m-%d", time.gmtime(m["start"]))
        for f in m["fills"]:
            r = w[f["wallet"]]
            pnl = fill_pnl(f, m["winner"])
            r["pnl"] += pnl
            r["volume"] += f["size"] * f["price"]
            r["fills"] += 1
            r["taker_fills"] += f["taker"]
            r["per_market"][m["condition"]] += pnl
            r["per_day"][day] += pnl
            r["name"] = r["name"] or f["name"]
    return w


def consistency(r: dict, n_days: int) -> dict:
    pm = list(r["per_market"].values())
    mean = statistics.fmean(pm)
    sd = statistics.pstdev(pm) if len(pm) > 1 else 0.0
    return {"markets": len(pm), "t_stat": mean / (sd / math.sqrt(len(pm))) if sd else 0.0,
            "win_market_share": sum(p > 0 for p in pm) / len(pm),
            "profitable_days": sum(p > 0 for p in r["per_day"].values()), "active_days": len(r["per_day"]),
            "days": n_days}


def profile(wallet: str, markets: list[dict]) -> dict:
    """What a wallet does: maker/taker, timing, prices, side, engine alignment."""
    timing = Counter()
    rows = []
    for m in markets:
        for f in m["fills"]:
            if f["wallet"] != wallet:
                continue
            to_close = m["end"] - f["ts"]
            bucket = ("after_close" if to_close <= 0 else "final_60s" if to_close <= 60 else
                      "final_5m" if to_close <= 300 else "in_window" if f["ts"] >= m["start"] else "pre_open")
            timing[bucket] += 1
            # Direction the fill bets on: buying Up / selling Down are both long Up.
            long_up = (f["outcome"] == "Up") == (f["side"] == "BUY")
            p_up = m["path"].get(f["ts"]) if m["path"] else None
            price_up = f["price"] if f["outcome"] == "Up" else 1 - f["price"]
            p_bet = None if p_up is None else (p_up if long_up else 1 - p_up)
            price_bet = price_up if long_up else 1 - price_up
            rows.append({"bucket": bucket, "taker": f["taker"], "size": f["size"], "price_bet": price_bet,
                         "p_engine": p_bet, "pnl": fill_pnl(f, m["winner"]), "to_close": to_close,
                         "won": (m["winner"] == "Up") == long_up})
    usd = sum(r["size"] * r["price_bet"] for r in rows) or 1.0

    def split(sel):
        sub = [r for r in rows if sel(r)]
        if not sub:
            return None
        return {"fills": len(sub), "usd": round(sum(r["size"] * r["price_bet"] for r in sub)),
                "pnl": round(sum(r["pnl"] for r in sub), 2),
                "avg_price_paid": round(statistics.fmean(r["price_bet"] for r in sub), 3),
                "win_rate": round(statistics.fmean(r["won"] for r in sub), 3)}

    with_engine = [r for r in rows if r["p_engine"] is not None]
    edge = [r["p_engine"] - r["price_bet"] for r in with_engine]
    return {
        "fills": len(rows),
        "taker_share_of_fills": round(statistics.fmean(r["taker"] for r in rows), 3),
        "timing_share": {k: round(v / len(rows), 3) for k, v in timing.most_common()},
        "median_seconds_to_close": statistics.median(r["to_close"] for r in rows),
        "by_role": {"maker": split(lambda r: not r["taker"]), "taker": split(lambda r: r["taker"])},
        "by_timing": {b: split(lambda r, b=b: r["bucket"] == b) for b in
                      ("pre_open", "in_window", "final_5m", "final_60s", "after_close")},
        "by_price": {f"{lo:.1f}-{lo + 0.1:.1f}": split(lambda r, lo=lo: lo <= r["price_bet"] < lo + 0.1)
                     for lo in [i / 10 for i in range(10)]},
        "engine": None if not with_engine else {
            "fills_with_engine": len(with_engine),
            "avg_engine_edge_at_fill": round(statistics.fmean(edge), 4),
            "share_where_engine_agrees_(edge>0.02)": round(statistics.fmean(e > 0.02 for e in edge), 3),
            "share_where_engine_disagrees_(edge<-0.02)": round(statistics.fmean(e < -0.02 for e in edge), 3),
            "pnl_when_engine_agrees": round(sum(r["pnl"] for r, e in zip(with_engine, edge) if e > 0.02), 2),
            "pnl_when_engine_disagrees": round(sum(r["pnl"] for r, e in zip(with_engine, edge) if e < -0.02), 2),
            "pnl_when_neutral": round(sum(r["pnl"] for r, e in zip(with_engine, edge) if -0.02 <= e <= 0.02), 2),
        },
        "usd_traded": round(usd),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=float, default=7)
    ap.add_argument("--top", type=int, default=10)
    ap.add_argument("--min-markets", type=int, default=100)
    ap.add_argument("--profile", default="", help="comma-separated wallets to profile in addition to the top 5")
    ap.add_argument("--min-volume", type=float, default=5000)
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    t0 = time.time()
    markets = collect(args.days)
    n_days = len({time.strftime("%m-%d", time.gmtime(m["start"])) for m in markets})
    print(f"{len(markets)} markets, {sum(len(m['fills']) for m in markets)} fills in {time.time() - t0:.0f}s")
    print("proxy/engine check:", proxy_check(markets))

    wallets = score_wallets(markets)
    total_taker = sum(fill_pnl(f, m["winner"]) for m in markets for f in m["fills"] if f["taker"])
    total_maker = sum(fill_pnl(f, m["winner"]) for m in markets for f in m["fills"] if not f["taker"])
    print(f"all takers P&L {total_taker:,.0f}  all makers P&L {total_maker:,.0f}  wallets {len(wallets)}")

    ranked = []
    for addr, r in wallets.items():
        if len(r["per_market"]) < args.min_markets or r["volume"] < args.min_volume:
            continue
        c = consistency(r, n_days)
        ranked.append((addr, r, c))
    ranked.sort(key=lambda x: x[2]["t_stat"], reverse=True)

    leaderboard = []
    for addr, r, c in ranked[: args.top]:
        leaderboard.append({"wallet": addr, "name": r["name"], "pnl": round(r["pnl"]), "volume": round(r["volume"]),
                            "roi_on_volume": round(r["pnl"] / r["volume"], 4) if r["volume"] else None,
                            "taker_fill_share": round(r["taker_fills"] / r["fills"], 3), **c})
    top_pnl = sorted(wallets.items(), key=lambda kv: kv[1]["pnl"], reverse=True)[:10]
    out = {
        "markets": len(markets), "days": n_days,
        "proxy_check": proxy_check(markets),
        "all_takers_pnl": round(total_taker), "all_makers_pnl": round(total_maker),
        "wallets": len(wallets),
        "qualifying_wallets": len(ranked),
        "consistent_leaderboard": leaderboard,
        "biggest_pnl": [{"wallet": a, "name": r["name"], "pnl": round(r["pnl"]), "markets": len(r["per_market"]),
                         **consistency(r, n_days)} for a, r in top_pnl],
        "profiles": {w: profile(w, markets) for w in
                     [row["wallet"] for row in leaderboard[:5]] + [w for w in args.profile.split(",") if w]},
    }
    print(json.dumps(out, indent=1, default=str))
    if args.out:
        with open(args.out, "w") as fh:
            json.dump(out, fh, indent=2, default=str)


if __name__ == "__main__":
    main()

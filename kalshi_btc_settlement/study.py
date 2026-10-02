"""Who wins the final minute, and could the engine have been filled?

Kalshi's public trade tape has no account IDs, so individual traders can't
be followed. Each print does record the taker side, though, and that tells
us which resting liquidity existed: a taker buying YES at 0.93 hit a resting
offer to sell YES at 0.93. That gives four studies:

  fillable   Engine edge counted only on prints where the taker bought the
             side the engine wanted, i.e. liquidity we could have taken
             instead, at engine latencies of 0..5 seconds.
  takers     P&L of final-minute takers by second, split by whether the
             engine agreed with them. If agreeing takers win, someone is
             already running this logic.
  flips      Windows where the market's favourite (>= 80%) lost: did the
             engine see it coming at that moment?
  converge   Second at which the engine locks onto the eventual winner vs
             second at which the market price does.

Usage: python -m kalshi_btc_settlement.study --weeks 3
"""

from __future__ import annotations

import argparse
import json
import math
import statistics
from collections import defaultdict

from . import data
from .backtest import build_cases, clustered_ci, kalshi_taker_fee, proxy_error_report, replay
from .engine import WINDOW_SECONDS

LATENCIES = [0, 1, 2, 3, 5]


def load_trades(case: dict) -> list[dict]:
    start = case["close"] - WINDOW_SECONDS + 1
    out = []
    for t in data.market_trades(case["ticker"], start - 1, case["close"] + 1):
        ts = data.iso_to_ts(t["created_time"])
        n = math.floor(ts) - start
        if not 0 <= n < WINDOW_SECONDS:
            continue
        out.append({"ts": ts, "n": n, "yes": float(t["yes_price_dollars"]),
                    "side": t["taker_side"], "count": float(t.get("count_fp") or 0)})
    out.sort(key=lambda t: t["ts"])
    return out


def fillable(cases, paths, trades, margin: float) -> dict:
    res = {}
    for lat in LATENCIES:
        per_market = defaultdict(list)
        sized_pnl = contracts = 0.0
        by_bucket = defaultdict(list)
        for c in cases:
            pc = paths[c["ticker"]]
            for t in trades[c["ticker"]]:
                p_yes = pc["path"][max(t["n"] - lat, 0)]
                # Price we would pay for the side the taker bought.
                price = t["yes"] if t["side"] == "yes" else 1 - t["yes"]
                p_side = p_yes if t["side"] == "yes" else 1 - p_yes
                if p_side - price - kalshi_taker_fee(price) <= margin:
                    continue
                won = pc["y"] == (1 if t["side"] == "yes" else 0)
                pnl = (1.0 if won else 0.0) - price - kalshi_taker_fee(price)
                per_market[c["ticker"]].append(pnl)
                by_bucket[min(int(p_side * 10), 9) / 10].append(pnl)
                sized_pnl += pnl * t["count"]
                contracts += t["count"]
        n_sig = sum(len(v) for v in per_market.values())
        res[f"latency_{lat}s"] = {
            "signal_prints": n_sig,
            "markets": len(per_market),
            "markets_per_day": round(len(per_market) / (len(cases) / 96), 1),
            "contracts_available": round(contracts),
            "pnl_if_took_all_printed_size": round(sized_pnl, 0),
            "pnl_per_contract": round(sized_pnl / contracts, 4) if contracts else None,
            "market_clustered_pnl_95ci": clustered_ci(per_market),
            "by_engine_prob": {f"{k:.1f}": {"prints": len(v), "avg_pnl": round(statistics.fmean(v), 4)}
                               for k, v in sorted(by_bucket.items())},
        }
    return res


def takers(cases, paths, trades) -> dict:
    """Taker P&L by 10-second bucket, split by engine agreement (latency 0)."""
    agg = defaultdict(lambda: {"prints": 0, "contracts": 0.0, "pnl": 0.0, "markets": defaultdict(list)})
    for c in cases:
        pc = paths[c["ticker"]]
        for t in trades[c["ticker"]]:
            price = t["yes"] if t["side"] == "yes" else 1 - t["yes"]
            won = pc["y"] == (1 if t["side"] == "yes" else 0)
            pnl = (1.0 if won else 0.0) - price - kalshi_taker_fee(price)
            p_side = pc["path"][t["n"]] if t["side"] == "yes" else 1 - pc["path"][t["n"]]
            view = ("engine_agrees" if p_side - price > 0.02 else
                    "engine_disagrees" if price - p_side > 0.02 else "engine_neutral")
            for key in ((f"{t['n'] // 10 * 10:02d}s", "all"), ("all", view), ("all", "all")):
                a = agg[key]
                a["prints"] += 1
                a["contracts"] += t["count"]
                a["pnl"] += pnl * t["count"]
                a["markets"][c["ticker"]].append(pnl)
    return {f"{k[0]}|{k[1]}": {"prints": a["prints"], "contracts": round(a["contracts"]),
                               "taker_pnl_per_contract": round(a["pnl"] / a["contracts"], 4) if a["contracts"] else None,
                               "market_clustered_pnl_95ci": clustered_ci(a["markets"])}
            for k, a in sorted(agg.items())}


def market_path(trades: list[dict]) -> dict[int, float]:
    """Last traded YES price at the end of each second, carried forward."""
    last, out = None, {}
    by_n = defaultdict(list)
    for t in trades:
        by_n[t["n"]].append(t["yes"])
    for n in range(WINDOW_SECONDS):
        if by_n[n]:
            last = by_n[n][-1]
        if last is not None:
            out[n] = last
    return out


def flips(cases, paths, trades, fav: float = 0.8) -> dict:
    windows = []
    for c in cases:
        pc = paths[c["ticker"]]
        mp = market_path(trades[c["ticker"]])
        for n, yes in sorted(mp.items()):
            fav_yes = yes >= fav
            if not (fav_yes or yes <= 1 - fav):
                continue
            if pc["y"] == (1 if fav_yes else 0):
                continue
            # Market favourite at second n went on to lose.
            p_fav = pc["path"][n] if fav_yes else 1 - pc["path"][n]
            windows.append({"ticker": c["ticker"], "second": n, "market_fav_price": yes if fav_yes else 1 - yes,
                            "engine_p_fav": round(p_fav, 4)})
            break
    engine_side = [w for w in windows if w["engine_p_fav"] < 0.5]
    engine_doubt = [w for w in windows if w["engine_p_fav"] < w["market_fav_price"] - 0.1]
    # The mirror image: engine favourite >= fav that lost.
    engine_wrong = 0
    for c in cases:
        pc = paths[c["ticker"]]
        for n in range(WINDOW_SECONDS):
            p = pc["path"][n]
            if (p >= fav and pc["y"] == 0) or (p <= 1 - fav and pc["y"] == 1):
                engine_wrong += 1
                break
    return {
        "windows": len(cases),
        "market_favourite_lost": len(windows),
        "engine_already_favoured_eventual_winner": len(engine_side),
        "engine_at_least_10pts_less_sure_than_market": len(engine_doubt),
        "engine_favourite_lost_windows": engine_wrong,
        "examples": windows[:15],
    }


def converge(cases, paths, trades, level: float = 0.97) -> dict:
    gaps, engine_only, market_only = [], 0, 0
    for c in cases:
        pc = paths[c["ticker"]]
        mp = market_path(trades[c["ticker"]])
        win = lambda p: p if pc["y"] == 1 else 1 - p
        t_e = next((n for n in range(WINDOW_SECONDS)
                    if all(win(pc["path"][k]) >= level for k in range(n, WINDOW_SECONDS))), None)
        t_m = next((n for n in sorted(mp) if all(win(mp[k]) >= level for k in mp if k >= n)), None)
        if t_e is None or t_m is None:
            engine_only += t_e is not None and t_m is None
            market_only += t_m is not None and t_e is None
            continue
        if t_e == 0 and t_m == min(mp):
            continue  # both already there when the minute started: nothing to learn
        gaps.append(t_m - t_e)
    gaps.sort()
    q = lambda f: gaps[min(len(gaps) - 1, int(f * len(gaps)))] if gaps else None
    return {
        "level": level, "windows_compared": len(gaps),
        "market_minus_engine_seconds": {"p10": q(0.1), "p25": q(0.25), "median": q(0.5), "p75": q(0.75), "p90": q(0.9)},
        "engine_first": sum(g > 0 for g in gaps), "same_second": sum(g == 0 for g in gaps),
        "market_first": sum(g < 0 for g in gaps),
        "engine_locked_market_never": engine_only, "market_locked_engine_never": market_only,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--weeks", type=int, default=3)
    ap.add_argument("--margin", type=float, default=0.02)
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    out = {}
    for w in range(args.weeks):
        cases = build_cases(7, 0, end_days_ago=7 * w)
        proxy = proxy_error_report(cases)
        paths = {pc["ticker"]: pc for pc in
                 replay(cases, 4.0, "rms", proxy["median_abs_err"] * 1.4826)["per_case"]}
        trades = {c["ticker"]: load_trades(c) for c in cases}
        label = f"week_{w}_ago"
        out[label] = {
            "windows": len(cases),
            "fillable": fillable(cases, paths, trades, args.margin),
            "takers": takers(cases, paths, trades),
            "flips": flips(cases, paths, trades),
            "converge": converge(cases, paths, trades),
        }
        print(f"== {label}: {len(cases)} windows")
        print(json.dumps({k: v for k, v in out[label].items() if k != "flips"} | {
            "flips": {k: v for k, v in out[label]["flips"].items() if k != "examples"}}, indent=1))
    if args.out:
        with open(args.out, "w") as fh:
            json.dump(out, fh, indent=2)


if __name__ == "__main__":
    main()

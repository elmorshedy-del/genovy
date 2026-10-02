"""Backtest the settlement engine on settled KXBTC15M markets.

For every 15-minute market in the lookback:
  1. Rebuild the final minute from 1-second proxy prices, shifted onto the
     BRTI level using the previous window's official settlement (the market's
     own strike), so only information available before the window is used.
  2. Check how close the rebuilt average lands to Kalshi's official
     `expiration_value` (is the proxy good enough to test with at all?).
  3. Replay the minute second by second through SettlementWindow and score
     its P(yes) against the real result: calibration, and how often a
     "locked" call was wrong.
  4. Line the engine's P(yes) up against real Kalshi trades printed in the
     same final minute, and count how many traded at prices the engine
     considered mispriced by more than fees plus a margin.

Usage: python -m kalshi_btc_settlement.backtest --days 7
"""

from __future__ import annotations

import argparse
import json
import math
import random
import statistics
import time
from collections import defaultdict

from . import data
from .engine import SettlementWindow, WINDOW_SECONDS, estimate_sigma_per_sec

CHECKPOINTS = [0, 10, 20, 30, 40, 45, 50, 55, 58, 59]


def kalshi_taker_fee(price: float) -> float:
    """Per-contract taker fee, 0.07 * P * (1-P) (Kalshi's quadratic schedule).

    Kalshi rounds the fee up to the cent per order, not per contract, so for
    orders of more than a few contracts this unrounded value is the right one.
    """
    return 0.07 * price * (1 - price)


def window_prices(proxy: dict[int, float], start: int, end: int, shift: int) -> list[float] | None:
    out = []
    for s in range(start, end):
        p = proxy.get(s + shift)
        if p is None:
            return None
        out.append(p)
    return out


def build_cases(days: float, shift: int, end_days_ago: float = 0) -> list[dict]:
    end = int(time.time() - end_days_ago * 86400) // 900 * 900
    markets = data.settled_markets("KXBTC15M", end - int(days * 86400), end)
    cases = []
    for m in markets:
        if not m.get("expiration_value") or m.get("result") not in ("yes", "no"):
            continue
        close = int(data.iso_to_ts(m["close_time"]))
        # 16 minutes covers the previous settlement minute (for the basis) through this one.
        proxy = data.binance_seconds(close - 960 - 10, close + 2)
        # Settlement seconds are close-59 .. close inclusive.
        prev = window_prices(proxy, close - 959, close - 899, shift)
        cur = window_prices(proxy, close - 59, close + 1, shift)
        lead = window_prices(proxy, close - 899, close - 59, shift)
        if prev is None or cur is None or lead is None:
            continue
        strike = float(m["floor_strike"])
        basis = strike - sum(prev) / len(prev)
        cases.append({
            "ticker": m["ticker"], "close": close, "strike": strike,
            "strike_type": m.get("strike_type", "greater_or_equal"),
            "official": float(m["expiration_value"]), "result": m["result"],
            "basis": basis, "window": [p + basis for p in cur],
            "lead": [p + basis for p in lead],
        })
    return cases


def proxy_error_report(cases: list[dict]) -> dict:
    errs = [sum(c["window"]) / WINDOW_SECONDS - c["official"] for c in cases]
    abs_errs = sorted(abs(e) for e in errs)
    q = lambda f: abs_errs[min(len(abs_errs) - 1, int(f * len(abs_errs)))]
    side_match = sum(
        1 for c in cases
        if (round(sum(c["window"]) / WINDOW_SECONDS, 2) >= c["strike"]) == (c["result"] == "yes")
    )
    return {
        "n": len(cases), "mean_err": statistics.fmean(errs), "median_abs_err": q(0.5),
        "p90_abs_err": q(0.9), "p99_abs_err": q(0.99), "max_abs_err": abs_errs[-1],
        "proxy_side_matches_official_result": side_match / len(cases),
    }


def replay(cases: list[dict], lock_sigmas: float, sigma_method: str, proxy_noise: float) -> dict:
    """Score the engine at each checkpoint of the final minute.

    proxy_noise ($) is added in quadrature to the model uncertainty so the
    proxy's own tracking error is not mistaken for engine confidence. With
    the live BRTI feed this would be 0.
    """
    by_n = defaultdict(lambda: {"brier": 0.0, "logloss": 0.0, "count": 0, "correct_side": 0,
                                "locked": 0, "locked_wrong": 0, "bins": defaultdict(lambda: [0, 0])})
    per_case = []
    for c in cases:
        sigma = estimate_sigma_per_sec(c["lead"], method=sigma_method)
        y = 1 if c["result"] == "yes" else 0
        w = SettlementWindow(strike=c["strike"], close_ts=c["close"], sigma_per_sec=sigma,
                             strike_type=c["strike_type"], round_to_cents=True,
                             lock_sigmas=lock_sigmas, value_noise=proxy_noise)
        start = c["close"] - WINDOW_SECONDS + 1
        path = {}
        for n in range(0, WINDOW_SECONDS):
            if n > 0:
                w.add_tick(start + n - 1, c["window"][n - 1])
            if n == 0:
                p = w.forecast(c["lead"][-1], seconds_until_window=0)
                z = None
            else:
                st = w.state()
                z = st.required_move_sigmas
                p = st.p_yes
            path[n] = p
            if n in CHECKPOINTS:
                b = by_n[n]
                pc = min(max(p, 1e-6), 1 - 1e-6)
                b["brier"] += (p - y) ** 2
                b["logloss"] += -(y * math.log(pc) + (1 - y) * math.log(1 - pc))
                b["count"] += 1
                b["correct_side"] += int((p >= 0.5) == bool(y))
                if z is not None and abs(z) >= lock_sigmas:
                    b["locked"] += 1
                    b["locked_wrong"] += int((z < 0) != bool(y))
                b["bins"][min(int(p * 10), 9)][0] += 1
                b["bins"][min(int(p * 10), 9)][1] += y
        per_case.append({"ticker": c["ticker"], "close": c["close"], "y": y, "path": path, "sigma": sigma})
    report = {}
    for n in CHECKPOINTS:
        b = by_n[n]
        k = b["count"]
        report[n] = {
            "brier": b["brier"] / k, "logloss": b["logloss"] / k,
            "accuracy": b["correct_side"] / k,
            "locked_share": b["locked"] / k,
            "locked_wrong": b["locked_wrong"],
            "locked_count": b["locked"],
            "calibration": {f"{i/10:.1f}-{(i+1)/10:.1f}": (v[0], round(v[1] / v[0], 3) if v[0] else None)
                            for i, v in sorted(b["bins"].items())},
        }
    return {"by_checkpoint": report, "per_case": per_case}


def clustered_ci(per_market: dict[str, list[float]], draws: int = 2000) -> list[float] | None:
    """Mean P&L per market (each market weighted once) with a bootstrap 95% CI.

    Trades inside one market are highly correlated (same outcome), so the
    market, not the trade, is the independent unit.
    """
    means = [statistics.fmean(v) for v in per_market.values() if v]
    if len(means) < 2:
        return None
    rng = random.Random(0)
    boot = sorted(statistics.fmean(rng.choices(means, k=len(means))) for _ in range(draws))
    return [round(statistics.fmean(means), 4), round(boot[int(0.025 * draws)], 4), round(boot[int(0.975 * draws)], 4)]


CONFIDENCE_BANDS = [(0.5, 0.7), (0.7, 0.9), (0.9, 0.97), (0.97, 0.99), (0.99, 0.999), (0.999, 1.01)]


def market_comparison(cases: list[dict], per_case: list[dict], margin: float) -> dict:
    """Line the engine up against every real trade printed in the final minute.

    For a trade during second n of the window the engine has seen n fully
    printed seconds. Trades are grouped by how confident the engine was in
    its favoured side. Per band we report the average price the market
    charged for that side, how often that side actually won, and the P&L of
    buying the favoured side at the printed price after the taker fee.
    "signals" restricts that to trades where the engine's edge exceeded
    `margin` after fees.

    This is optimistic: a print shows a price existed, not that size was
    left for us, and we ignore our own latency.
    """
    paths = {pc["ticker"]: pc for pc in per_case}
    bands = {b: {"trades": 0, "contracts": 0.0, "price_sum": 0.0, "wins": 0, "pnl": 0.0,
                 "signals": 0, "signal_pnl": 0.0, "signal_contracts": 0.0, "signal_pnl_by_size": 0.0,
                 "signal_markets": set(), "per_market": defaultdict(list),
                 "signal_per_market": defaultdict(list)} for b in CONFIDENCE_BANDS}
    total_trades = 0
    for c in cases:
        pc = paths[c["ticker"]]
        start = c["close"] - WINDOW_SECONDS + 1
        for t in data.market_trades(c["ticker"], start - 1, c["close"] + 1):
            # Settlement seconds strictly before the trade's second count as seen;
            # the tick for the trade's own second may not have reached us yet.
            n = math.floor(data.iso_to_ts(t["created_time"])) - start
            if not 0 <= n < WINDOW_SECONDS:
                continue
            total_trades += 1
            p_yes = pc["path"][n]
            yes_price = float(t["yes_price_dollars"])
            count = float(t.get("count_fp") or t.get("count") or 0)
            fav_yes = p_yes >= 0.5
            p = p_yes if fav_yes else 1 - p_yes
            price = yes_price if fav_yes else 1 - yes_price
            won = pc["y"] == (1 if fav_yes else 0)
            pnl = (1.0 if won else 0.0) - price - kalshi_taker_fee(price)
            band = next(b for b in CONFIDENCE_BANDS if b[0] <= p < b[1])
            r = bands[band]
            r["trades"] += 1
            r["contracts"] += count
            r["price_sum"] += price
            r["wins"] += int(won)
            r["pnl"] += pnl
            r["per_market"][c["ticker"]].append(pnl)
            if p - price - kalshi_taker_fee(price) > margin:
                r["signals"] += 1
                r["signal_pnl"] += pnl
                r["signal_contracts"] += count
                r["signal_pnl_by_size"] += pnl * count
                r["signal_markets"].add(c["ticker"])
                r["signal_per_market"][c["ticker"]].append(pnl)
    out = {"markets": len(cases), "final_minute_trades": total_trades, "bands": {}}
    for (lo, hi), r in bands.items():
        k = r["trades"]
        if not k:
            continue
        out["bands"][f"{lo:.3f}-{min(hi, 1):.3f}"] = {
            "trades": k,
            "contracts": round(r["contracts"]),
            "avg_market_price_for_engine_side": round(r["price_sum"] / k, 4),
            "engine_side_win_rate": round(r["wins"] / k, 4),
            "avg_pnl_buying_engine_side": round(r["pnl"] / k, 4),
            "signals": r["signals"],
            "signal_markets": len(r["signal_markets"]),
            "signal_avg_pnl": round(r["signal_pnl"] / r["signals"], 4) if r["signals"] else None,
            "signal_contracts_printed": round(r["signal_contracts"]),
            "signal_pnl_if_filled_print_size": round(r["signal_pnl_by_size"], 2),
            "markets": len(r["per_market"]),
            "market_clustered_avg_pnl_95ci": clustered_ci(r["per_market"]),
            "signal_market_clustered_avg_pnl_95ci": clustered_ci(r["signal_per_market"]),
        }
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=float, default=7)
    ap.add_argument("--lock-sigmas", type=float, default=4.0)
    ap.add_argument("--sigma-method", choices=["rms", "mad"], default="rms")
    ap.add_argument("--margin", type=float, default=0.02)
    ap.add_argument("--shift", type=int, default=None, help="proxy second alignment; default picks best of -1/0/1")
    ap.add_argument("--end-days-ago", type=float, default=0, help="shift the lookback into the past (out-of-sample runs)")
    ap.add_argument("--no-trades", action="store_true")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    shifts = [args.shift] if args.shift is not None else [-1, 0, 1]
    best = None
    for shift in shifts:
        cases = build_cases(args.days, shift, args.end_days_ago)
        rep = proxy_error_report(cases)
        print(f"proxy shift {shift:+d}: {json.dumps(rep)}")
        if best is None or rep["median_abs_err"] < best[1]["median_abs_err"]:
            best = (shift, rep, cases)
    shift, proxy_rep, cases = best
    print(f"\nusing shift {shift:+d}; {len(cases)} windows")

    out = {"proxy": proxy_rep, "shift": shift}
    for noise_label, noise in (("raw", 0.0), ("proxy_noise_adjusted", proxy_rep["median_abs_err"] * 1.4826)):
        rep = replay(cases, args.lock_sigmas, args.sigma_method, noise)
        out[noise_label] = rep["by_checkpoint"]
        print(f"\n== engine replay ({noise_label}, extra noise ${noise:.2f}) ==")
        print(" n  brier   logloss  acc    locked  wrong")
        for n, r in rep["by_checkpoint"].items():
            print(f"{n:2d}  {r['brier']:.4f}  {r['logloss']:.4f}  {r['accuracy']:.3f}  "
                  f"{r['locked_share']:.3f}  {r['locked_wrong']}/{r['locked_count']}")
        if noise_label == "proxy_noise_adjusted":
            per_case = rep["per_case"]

    if not args.no_trades:
        cmp_ = market_comparison(cases, per_case, args.margin)
        out["market_comparison"] = cmp_
        print("\n== vs real Kalshi final-minute trades ==")
        print(json.dumps(cmp_, indent=2))

    if args.out:
        with open(args.out, "w") as fh:
            json.dump(out, fh, indent=2)


if __name__ == "__main__":
    main()

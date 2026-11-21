"""E10b - Analog base rates for the current QQQ / SPY state, done carefully:
analogs = completed double tops (real data, 57 assets) whose price reached the same fractional progress toward
the measured move AND whose mirror target (left-leg start) was still ahead at a comparable distance
(distance to L0 / distance N->MM within a factor 1.6 of the current value). Time caps: 20 / 60 / 120 days.
Also the mirror-timing ratio: (days from break to L0) / (days the left leg took from L0 up to the neckline level)."""
import os, sys, json
import numpy as np, pandas as pd
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ms import data
from scripts.e9_double_top import prep, find_patterns

RES = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "results")
rng = np.random.default_rng(23)
E10 = json.load(open(os.path.join(RES, "e10_tilt_and_state.json")))
targets = {}
for name in ("QQQ", "SPY"):
    st = E10[f"state_{name}"]
    lg = np.log
    targets[name] = {"prog": st["progress_to_MM"], "rel_mirror": lg(st["close"] / st["L0_mirror_target"]) / lg(st["N"] / st["MM_target"])}
print({k: {kk: round(vv, 3) for kk, vv in v.items()} for k, v in targets.items()})


def analog_stats(series_list, surrogate=False):
    res = {n: [] for n in targets}; timing = []
    for (lh, ll, lc, sig, cls) in series_list:
        for p in find_patterns(lh, ll, lc, sig):
            if not p.get("completed") or not p.get("left_starts_below_neckline"):
                continue
            H1, H2, N, L0 = lh[p["i_H1"]], lh[p["i_H2"]], ll[p["i_N"]], ll[p["i_L0"]]
            Hmax = max(H1, H2); Hbar = 0.5 * (H1 + H2); MM = N - (Hbar - N); b = p["i_break"]; n = len(lc)
            # mirror timing (completed mirrors): days break->L0 vs days left leg L0->first close >= N
            up = np.where(lc[p["i_L0"]:p["i_H1"] + 1] >= N)[0]
            left_days = int(up[0]) if len(up) else None
            hit = np.where(ll[b:min(n, b + 250)] <= L0)[0]
            hi = np.where(lc[b:min(n, b + 250)] > Hmax)[0]
            if left_days and len(hit) and (not len(hi) or hit[0] < hi[0]):
                timing.append(hit[0] / max(left_days, 1))
            for name, tg in targets.items():
                lvl = N - tg["prog"] * (N - MM)
                rel = (lvl - L0) / (N - MM)
                if not (tg["rel_mirror"] / 1.6 <= rel <= tg["rel_mirror"] * 1.6):
                    continue
                idx = np.where(lc[b:min(n, b + 120)] <= lvl)[0]
                if not len(idx):
                    continue
                t0 = b + idx[0]; stop = min(n, t0 + 250)
                h_ = np.where(lc[t0:stop] > Hmax)[0]; h_ = h_[0] if len(h_) else 10**9
                tm = np.where(ll[t0:stop] <= MM)[0]; tm = tm[0] if len(tm) else 10**9
                tr = np.where(ll[t0:stop] <= L0)[0]; tr = tr[0] if len(tr) else 10**9
                res[name].append({"mm": tm < h_, "mir": tr < h_, "tm": tm, "tr": tr, "eq": cls in ("us_equity_index", "intl_equity_index")})
    return res, np.array(timing)


series_real, series_sur = [], []
for t in [x for x in data.all_daily_tickers() if x != "^VIX"]:
    df = data.load_raw(t)
    df = df[(df["Close"] > 0) & (df["Low"] > 0) & (df["High"] >= df["Low"])].dropna(subset=["Close", "High", "Low"])
    if len(df) < 2500:
        continue
    sig = pd.Series(np.diff(np.log(df["Adj Close"].values))).rolling(252, min_periods=126).std().median()
    lh, ll, lc = prep(df); series_real.append((lh, ll, lc, sig, data.ASSET_CLASS.get(t)))
    for _ in range(6):
        a = prep(df, surrogate=True); series_sur.append((*a, sig, data.ASSET_CLASS.get(t)))
out = {"targets": targets}
for label, ser in (("real", series_real), ("surrogate", series_sur)):
    res, timing = analog_stats(ser)
    out[label] = {"mirror_timing_ratio_quantiles_25_50_75": np.quantile(timing, [.25, .5, .75]).round(2).tolist() if len(timing) else None, "n_timing": int(len(timing))}
    for name, rows in res.items():
        if not rows:
            continue
        mm = np.array([r["mm"] for r in rows]); mir = np.array([r["mir"] for r in rows])
        tm = np.array([r["tm"] for r in rows]); tr = np.array([r["tr"] for r in rows])
        d = {"n": len(rows), "p_mm_before_new_high": float(mm.mean()), "p_mirror_before_new_high": float(mir.mean())}
        for cap in (20, 60, 120):
            d[f"p_mm_within_{cap}"] = float(np.mean(mm & (tm <= cap))); d[f"p_mirror_within_{cap}"] = float(np.mean(mir & (tr <= cap)))
        d["median_days_mm_if_hit"] = float(np.median(tm[mm])) if mm.any() else None
        d["median_days_mirror_if_hit"] = float(np.median(tr[mir])) if mir.any() else None
        eq = np.array([r["eq"] for r in rows])
        if eq.sum() >= 10:
            d["eq_n"] = int(eq.sum()); d["eq_p_mm"] = float(mm[eq].mean()); d["eq_p_mirror"] = float(mir[eq].mean())
            d["eq_p_mirror_within_60"] = float(np.mean((mir & (tr <= 60))[eq]))
        out[label][name] = d
json.dump(out, open(os.path.join(RES, "e10b_conditional.json"), "w"), indent=1)
print(json.dumps(out, indent=1, default=lambda v: round(float(v), 3)))

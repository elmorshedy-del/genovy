"""E10 - (a) Is SPY's tilted double top QQQ's level double top seen through sector rotation?
(b) Where are QQQ and SPY now inside their patterns, and what do comparable historical patterns say?"""
import os, sys, json
import numpy as np, pandas as pd
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ms import data

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "results")
out = {}
px = {t: data.load_raw(t) for t in ["SPY", "QQQ", "RSP", "XLK", "XLF", "XLI", "XLV", "XLE", "XLU", "XLY", "XLP", "XLB", "IWM"]}
ret = pd.DataFrame({t: np.log(df["Adj Close"]).diff() for t, df in px.items()}).dropna()
r26 = ret.loc["2026-01-01":]
beta = float(np.polyfit(r26["QQQ"], r26["SPY"], 1)[0]); alpha = float(np.polyfit(r26["QQQ"], r26["SPY"], 1)[1])
resid = r26["SPY"] - beta * r26["QQQ"]                       # alpha left inside the residual: it IS the drift
r2 = float(1 - resid.var() / r26["SPY"].var())
cum_res = resid.cumsum()
key = {"H1 (Jun 2/3)": "2026-06-03", "QQQ neckline (Jul 29)": "2026-07-29", "H2 (Oct 6)": "2026-10-06", "Nov 20": "2026-11-20", "Mar 30 low": "2026-03-30"}
def val(series, d):
    return float(series.loc[:d].iloc[-1])
out["beta_spy_on_qqq_2026"] = beta; out["r2"] = r2
out["cum_residual_at"] = {k: val(cum_res, d) for k, d in key.items()}
seg = lambda a, b: {t: float(100 * (np.exp(ret[t].loc[a:b].iloc[1:].sum()) - 1)) for t in ret.columns}
out["returns_pct"] = {"Jun03->Jul29": seg("2026-06-03", "2026-07-29"), "Jul29->Oct06": seg("2026-07-29", "2026-10-06"),
                      "Jun03->Oct06": seg("2026-06-03", "2026-10-06"), "Oct06->Nov20": seg("2026-10-06", "2026-11-20"),
                      "Mar30->Jun03": seg("2026-03-30", "2026-06-03")}
# tilt accounting between the two top dates (closes)
q_tilt = float(np.log(px["QQQ"]["Close"].loc["2026-10-06"] / px["QQQ"]["Close"].loc["2026-06-03"]))
s_tilt = float(np.log(px["SPY"]["Close"].loc["2026-10-06"] / px["SPY"]["Close"].loc["2026-06-03"]))
res_drift = float(resid.loc["2026-06-04":"2026-10-06"].sum())
out["tilt_accounting_logs"] = {"spy_close_to_close": s_tilt, "qqq_close_to_close": q_tilt, "beta_times_qqq": beta * q_tilt,
                               "residual_drift": res_drift, "dividend_and_rounding_gap": s_tilt - beta * q_tilt - res_drift}
# QQQ-implied SPY (rotation removed): SPY path with the residual drift since Mar 30 subtracted
s = px["SPY"]["Close"].loc["2026-03-30":]
adj_path = np.exp(np.log(s) - (cum_res.loc["2026-03-30":] - val(cum_res, "2026-03-30")).reindex(s.index).ffill())
out["rotation_removed_spy"] = {"H1_Jun02_high": float(adj_path.loc["2026-05-28":"2026-06-05"].max()), "H2_Oct06_high": float(adj_path.loc["2026-10-01":"2026-10-10"].max()),
                                "Jul29_low": float(adj_path.loc["2026-07-20":"2026-08-05"].min()), "Nov20": float(adj_path.iloc[-1])}
out["rotation_removed_spy_series"] = {"date": [str(d.date()) for d in adj_path.index], "spy": s.round(2).tolist(), "spy_ex_rotation": adj_path.round(2).tolist(),
                                      "qqq": px["QQQ"]["Close"].loc["2026-03-30":].round(2).tolist(), "rsp": px["RSP"]["Close"].loc["2026-03-30":].round(2).tolist()}
sig = {t: float(pd.Series(ret[t].values).rolling(252, min_periods=126).std().median()) for t in ("SPY", "QQQ")}
for t in ("SPY", "QQQ"):
    h = px[t]
    H1 = float(h["High"].loc["2026-05-28":"2026-06-05"].max()); H2 = float(h["High"].loc["2026-10-01":"2026-10-10"].max())
    N = float(h["Low"].loc["2026-06-04":"2026-09-30"].min()) if t == "SPY" else float(h["Low"].loc["2026-07-20":"2026-08-05"].min())
    L0 = float(h["Low"].loc["2026-03-25":"2026-04-03"].min()); x = float(h["Close"].iloc[-1])
    Hbar = np.exp(0.5 * (np.log(H1) + np.log(H2))); MM = float(N * np.exp(-np.log(Hbar / N)))
    lg = lambda a, b: np.log(a / b)
    out[f"state_{t}"] = {"H1": H1, "H2": H2, "N": N, "L0_mirror_target": L0, "close": x, "MM_target": MM,
                         "tilt_sigma": float(lg(H2, H1) / sig[t]), "depth_sigma": float(lg(min(H1, H2), N) / sig[t]),
                         "progress_to_MM": float(lg(N, x) / lg(N, MM)), "pct_to_MM": float(100 * (MM / x - 1)), "pct_to_mirror": float(100 * (L0 / x - 1)),
                         "pct_to_H2": float(100 * (H2 / x - 1)),
                         "martingale_p_MM_before_H2": float(lg(H2, x) / lg(H2, MM)), "martingale_p_mirror_before_H2": float(lg(H2, x) / lg(H2, L0))}
# progress-conditioned empirical rates from E9 patterns (real data) - replay each completed pattern
E9 = json.load(open(os.path.join(RES, "e9_double_top.json")))
from scripts.e9_double_top import prep
cache = {}
cond = {"SPY": [], "QQQ": []}
for p in E9["patterns"]:
    if not p.get("left_starts_below_neckline"):
        continue
    t = p["ticker"]
    if t not in cache:
        df = data.load_raw(t); df = df[(df["Close"] > 0) & (df["Low"] > 0) & (df["High"] >= df["Low"])].dropna(subset=["Close", "High", "Low"])
        cache[t] = prep(df)
    lh, ll, lc = cache[t]
    H1, H2, N, L0 = lh[p["i_H1"]], lh[p["i_H2"]], ll[p["i_N"]], ll[p["i_L0"]]
    Hmax = max(H1, H2); Hbar = 0.5 * (H1 + H2); MM = N - (Hbar - N); b = p["i_break"]; n = len(lc)
    for name in ("SPY", "QQQ"):
        prog = out[f"state_{name}"]["progress_to_MM"]
        lvl = N - prog * (N - MM)                     # same fractional progress toward MM
        idx = np.where(lc[b:min(n, b + 120)] <= lvl)[0]
        if not len(idx):
            continue
        t0 = b + idx[0]
        stop = min(n, t0 + 250)
        hi = np.where(lc[t0:stop] > Hmax)[0]; hi = t0 + hi[0] if len(hi) else -1
        tm = np.where(ll[t0:stop] <= MM)[0]; tm = t0 + tm[0] if len(tm) else -1
        tr = np.where(ll[t0:stop] <= L0)[0]; tr = t0 + tr[0] if len(tr) else -1
        cond[name].append({"mm": bool(tm >= 0 and (hi < 0 or tm < hi)), "mirror": bool(tr >= 0 and (hi < 0 or tr < hi)),
                           "days_mm": int(tm - t0) if tm >= 0 else None, "days_mirror": int(tr - t0) if tr >= 0 else None,
                           "eq_index": p["class"] in ("us_equity_index", "intl_equity_index")})
for name in ("SPY", "QQQ"):
    c = cond[name]
    dm = [x["days_mm"] for x in c if x["mm"]]; dr = [x["days_mirror"] for x in c if x["mirror"]]
    out[f"conditional_{name}"] = {"n": len(c), "p_mm_before_new_high": float(np.mean([x["mm"] for x in c])),
                                  "p_mirror_before_new_high": float(np.mean([x["mirror"] for x in c])),
                                  "median_days_to_mm": float(np.median(dm)) if dm else None, "median_days_to_mirror": float(np.median(dr)) if dr else None,
                                  "eq_index_n": int(sum(x["eq_index"] for x in c)),
                                  "eq_index_p_mm": float(np.mean([x["mm"] for x in c if x["eq_index"]])) if any(x["eq_index"] for x in c) else None,
                                  "eq_index_p_mirror": float(np.mean([x["mirror"] for x in c if x["eq_index"]])) if any(x["eq_index"] for x in c) else None}
json.dump(out, open(os.path.join(RES, "e10_tilt_and_state.json"), "w"), indent=1)
for k in ("beta_spy_on_qqq_2026", "r2", "cum_residual_at", "tilt_accounting_logs", "rotation_removed_spy", "state_QQQ", "state_SPY", "conditional_QQQ", "conditional_SPY"):
    print(k, json.dumps(out[k], default=lambda v: round(v, 4)))
print("returns Jun03->Jul29", {k: round(v, 1) for k, v in out["returns_pct"]["Jun03->Jul29"].items()})
print("returns Jul29->Oct06", {k: round(v, 1) for k, v in out["returns_pct"]["Jul29->Oct06"].items()})
print("returns Oct06->Nov20", {k: round(v, 1) for k, v in out["returns_pct"]["Oct06->Nov20"].items()})

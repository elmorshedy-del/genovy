"""E2-B robustness: is the 'high past volume-at-price => slower traversal' effect still present when the
landscape is built only from bars older than LAG days (rules out short-run regime persistence)?"""
import os, sys, json
import numpy as np, pandas as pd
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ms import data
import scripts.e2_speed_memory as e2

RES = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "results")
rng = np.random.default_rng(21)

def design_lag(c, hi, lo, adj, vol, sig, lag, surrogate=False):
    # same as e2.e2b_design but with a configurable lag for the landscape
    r = np.diff(np.log(adj)); n = len(r)
    lr = np.log(hi[1:] / lo[1:])
    if surrogate:
        m = r.mean(); r = m + rng.choice([-1.0, 1.0], size=n) * np.abs(r - m)
    x = np.log(c[0]) + np.concatenate([[0.0], np.cumsum(r)]); xc = x[1:]
    hi_ = xc + np.log(hi[1:] / c[1:]); lo_ = xc + np.log(lo[1:] / c[1:])
    s = np.empty(n); s[0] = lr[:20].mean()
    for t in range(1, n):
        s[t] = 0.94 * s[t - 1] + 0.06 * lr[t - 1]
    u = lr / s
    w = 0.5 * sig; base = min(lo_.min(), xc.min()) - w
    binlo = np.floor((lo_ - base) / w).astype(np.int64); binhi = np.floor((hi_ - base) / w).astype(np.int64)
    nb = int(binhi.max() + 2)
    valid = np.isfinite(u) & (lr > 0) & (np.arange(n) > 60) & (binhi - binlo < 40)
    fs, fv, fc = e2.landscape_features(binlo, binhi, u, vol[1:].astype(np.float64), valid, nb, lag, 1.0)
    cum = np.concatenate([[0.0], np.cumsum(r)])[1:]
    dd = cum - np.maximum.accumulate(cum)
    rprev = np.concatenate([[0.0], r[:-1]]) / s
    X = np.column_stack([np.log(np.maximum(fv, 1e-3)), dd, dd ** 2, np.abs(rprev), np.minimum(rprev, 0)])
    return np.log(u), X

tick = ["SPY","QQQ","IWM","DIA","EFA","EEM","XLK","XLF","XLE","XLV","XLY","XLP","XLI","XLU","XLB",
        "AAPL","MSFT","AMZN","JPM","XOM","JNJ","PG","KO","WMT","GE","IBM","INTC","NVDA","CSCO","BA","CAT","MRK","PFE","HD","DIS",
        "TLT","IEF","HYG","GLD","SLV","USO","DBC","BTC-USD","ETH-USD"]
out = []
for t in tick:
    df = data.load_raw(t)
    df = df[(df["Close"] > 0) & (df["High"] >= df["Low"]) & (df["Low"] > 0) & (df["High"] > df["Low"])].dropna(subset=["Close","High","Low"])
    c = df["Close"].values.astype(float); hi = df["High"].values.astype(float); lo = df["Low"].values.astype(float)
    adj = df["Adj Close"].values.astype(float); vol = df["Volume"].values.astype(float)
    sig = pd.Series(np.diff(np.log(adj))).rolling(252, min_periods=126).std().median()
    rec = {"ticker": t, "class": data.ASSET_CLASS.get(t)}
    for lag in (5, 60, 250):
        y, X = design_lag(c, hi, lo, adj, vol, sig, lag)
        b, nobs = e2.regression_stats(y, X)
        nulls = []
        for _ in range(30):
            ys, Xs = design_lag(c, hi, lo, adj, vol, sig, lag, surrogate=True)
            bs, _ = e2.regression_stats(ys, Xs); nulls.append(bs[0])
        nulls = np.array(nulls)
        rec[f"lag{lag}"] = {"beta_vap": float(b[0]), "null_mean": float(nulls.mean()), "null_sd": float(nulls.std()),
                            "z": float((b[0] - nulls.mean()) / nulls.std()), "nobs": nobs}
    out.append(rec)
    print(f"{t:8s} " + "  ".join(f"lag{l}: b={rec[f'lag{l}']['beta_vap']:+.4f} z={rec[f'lag{l}']['z']:+.1f}" for l in (5,60,250)), flush=True)
json.dump(out, open(os.path.join(RES, "e2b_lag_robustness.json"), "w"), indent=1)
zs = {l: np.array([r[f"lag{l}"]["z"] for r in out]) for l in (5,60,250)}
for l in (5,60,250):
    print(f"lag {l}: mean z={zs[l].mean():+.2f}, share z<-2: {(zs[l]<-2).mean():.2f}, Stouffer z={zs[l].sum()/np.sqrt(len(zs[l])):+.1f}")

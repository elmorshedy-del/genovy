"""Falsification checks.
(1) Variance clock with distance-proportional clipping (f^2 r^2 for partial steps) for real assets and models.
(2) Long-lag volume-at-price regression (|r| version, close-level bins) on real SPY vs no-landscape models.
"""
import os, sys, json
import numpy as np, pandas as pd
from numba import njit
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ms import data
from ms.landscape import band_crossings
from scripts.model_lld import simulate, CONFIGS, SIG
from scripts.e2_speed_memory import landscape_features, regression_stats

RES = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "results")
rng = np.random.default_rng(99)


@njit(cache=True)
def durations_f2(x, cr, a, b, r2n):
    m = cr.shape[0]; out = np.zeros((m, 2))
    for j in range(m):
        s = cr[j, 0]; e = cr[j, 1]
        tc = 0.0; tv = 0.0
        for i in range(s, e):
            x0 = x[i]; x1 = x[i + 1]
            lo = min(x0, x1); hi = max(x0, x1)
            f = 1.0
            if hi - lo > 1e-15:
                f = max(min(hi, b) - max(lo, a), 0.0) / (hi - lo)
            tc += f; tv += f * f * r2n[i]
        out[j, 0] = tc; out[j, 1] = tv
    return out


def asym(x, r2n, W):
    lo, hi = x.min(), x.max(); D = []; T = []
    a = lo
    while a + W <= hi:
        cr = band_crossings(x, a, a + W)
        if len(cr):
            dd = durations_f2(x, cr, a, a + W, r2n); D.append(cr[:, 2]); T.append(dd)
        a += W / 2
    D = np.concatenate(D); T = np.vstack(T)
    up, dn = D == 1, D == -1
    return float(np.log(T[dn, 0]).mean() - np.log(T[up, 0]).mean()), float(np.log(T[dn, 1]).mean() - np.log(T[up, 1]).mean())


res = {"variance_clock_f2": {}, "long_lag_vap": {}}
for t in ["SPY", "^GSPC", "QQQ", "DIA", "EFA", "XLK", "XLF", "AAPL", "TLT", "EURUSD=X", "GLD", "^VIX"]:
    c = data.load_close(t); r = np.log(c).diff().dropna().values
    sig = pd.Series(r).rolling(252, min_periods=126).std().median()
    x = np.concatenate([[0.0], np.cumsum(r)])
    dc, dv = asym(x, r ** 2 / sig ** 2, 12 * sig)
    nulls = []
    for _ in range(100):
        m = r.mean(); rs = m + rng.choice([-1.0, 1.0], size=len(r)) * np.abs(r - m)
        xs = np.concatenate([[0.0], np.cumsum(rs)]); nulls.append(asym(xs, rs ** 2 / sig ** 2, 12 * sig)[1])
    nulls = np.array(nulls)
    res["variance_clock_f2"][t] = {"delta_cal": dc, "delta_var_f2": dv, "z_var": float((dv - nulls.mean()) / nulls.std())}
    print(f"{t:9s} dCal={dc:+.3f}  dVar(f2)={dv:+.3f}  z={res['variance_clock_f2'][t]['z_var']:+.2f}", flush=True)
for name in ["0_null_bm", "F_lev_only", "G_lev_dip_no_land", "A_static_landscape"]:
    vals = []
    for seed in range(12):
        p, r2, vol = simulate(9000, 1000 + seed, **CONFIGS[name])
        vals.append(asym(p, r2 / SIG ** 2, 12 * SIG))
    v = np.array(vals)
    res["variance_clock_f2"][name] = {"delta_cal": float(v[:, 0].mean()), "delta_var_f2": float(v[:, 1].mean()), "se_var": float(v[:, 1].std() / np.sqrt(len(v)))}
    print(f"{name:20s} dCal={v[:,0].mean():+.3f}  dVar(f2)={v[:,1].mean():+.3f} ± {v[:,1].std()/np.sqrt(len(v)):.3f}", flush=True)


def lag_vap_beta(x, absr, vol, sig, lag):
    """log(|r_t|/sigma_hat) on log past-volume share at the close's price bin (bars older than lag)."""
    n = len(absr)
    s = np.empty(n); s[0] = absr[:20].mean() + 1e-12
    for t in range(1, n):
        s[t] = 0.94 * s[t - 1] + 0.06 * absr[t - 1]
    u = (absr + 1e-4 * sig) / s
    w = 0.5 * sig; base = x.min() - w
    k = np.floor((x[1:] - base) / w).astype(np.int64)
    nb = int(k.max() + 2)
    valid = np.isfinite(u) & (np.arange(n) > 60)
    fs, fv, fc = landscape_features(k, k, u, vol.astype(np.float64), valid, nb, lag, 1.0)
    cum = x[1:] - x[0]; dd = cum - np.maximum.accumulate(cum)
    rp = np.concatenate([[0.0], (x[1:] - x[:-1])[:-1]]) / s
    X = np.column_stack([np.log(np.maximum(fv, 1e-3)), dd, dd ** 2, np.abs(rp), np.minimum(rp, 0)])
    b, nobs = regression_stats(np.log(u), X)
    return float(b[0])


df = data.load_raw("SPY"); c = df["Close"].values.astype(float); adj = df["Adj Close"].values.astype(float); vol = df["Volume"].values.astype(float)
r = np.diff(np.log(adj)); sig = r.std(); xr = np.log(c[0]) + np.concatenate([[0.0], np.cumsum(r)])
for lag in (60, 250):
    real_b = lag_vap_beta(xr, np.abs(r), vol[1:], sig, lag)
    nb = []
    for _ in range(40):
        m = r.mean(); rs = m + rng.choice([-1.0, 1.0], size=len(r)) * np.abs(r - m)
        xs = np.log(c[0]) + np.concatenate([[0.0], np.cumsum(rs)])
        nb.append(lag_vap_beta(xs, np.abs(rs), vol[1:], sig, lag))
    nb = np.array(nb)
    res["long_lag_vap"][f"SPY_lag{lag}"] = {"beta": real_b, "null_mean": float(nb.mean()), "null_sd": float(nb.std()), "z": float((real_b - nb.mean()) / nb.std())}
    print(f"SPY |r|-version lag{lag}: beta={real_b:+.4f} null={nb.mean():+.4f}±{nb.std():.4f} z={(real_b-nb.mean())/nb.std():+.2f}", flush=True)
    for name in ["G_lev_dip_no_land", "F_lev_only"]:
        bs = []
        for seed in range(12):
            p, r2, v = simulate(9000, 2000 + seed, **CONFIGS[name])
            rr = np.diff(p)
            bs.append(lag_vap_beta(p, np.abs(rr), v, SIG, lag))
        bs = np.array(bs)
        res["long_lag_vap"][f"{name}_lag{lag}"] = {"beta_mean": float(bs.mean()), "beta_se": float(bs.std() / np.sqrt(len(bs)))}
        print(f"   model {name} lag{lag}: beta={bs.mean():+.4f} ± {bs.std()/np.sqrt(len(bs)):.4f}", flush=True)
json.dump(res, open(os.path.join(RES, "checks_falsification.json"), "w"), indent=1)

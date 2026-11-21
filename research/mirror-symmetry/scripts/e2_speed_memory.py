"""E2 - Does the market carry a speed landscape in (raw) price space?

E2-A  Mirror of dwell profiles. For consecutive opposite crossings of the same band [a, a+W],
      compute time spent in each of M sub-bins, divide by the homogeneous-diffusion crossing shape
      (y(1-y)), and correlate the two log-profiles across sub-bins. Landscape theory: rho > 0
      (occupation density ~ 1/sigma(x)^2 in both directions). Null: sign-randomized surrogates.
      Note: the leverage effect biases rho downward (fast at bottom when falling, fast at top when
      rising), so a positive excess is conservative.
E2-B  Causal landscape regression on daily bars:
      log(range_t / sigma_hat_t) ~ log mean past normalized range at this price bin
                                   + log past volume-at-price share at this bin + controls.
"""
import os, sys, json
import numpy as np
import pandas as pd
from numba import njit
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ms import data
from ms.landscape import band_crossings, dwell_profile, expected_crossing_shape

RES = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "results")
rng = np.random.default_rng(11)


def mirror_profile_stat(x, W, M, min_len):
    shape = expected_crossing_shape(M)
    lo, hi = x.min(), x.max()
    rhos, gaps, dirs = [], [], []
    a = lo
    while a + W <= hi:
        cr = band_crossings(x, a, a + W)
        for j in range(len(cr) - 1):
            s1, e1, d1 = cr[j]; s2, e2, d2 = cr[j + 1]
            if e1 - s1 < min_len or e2 - s2 < min_len:
                continue
            p1 = dwell_profile(x, s1, e1, a, a + W, M); p2 = dwell_profile(x, s2, e2, a, a + W, M)
            p1 = p1 / p1.sum(); p2 = p2 / p2.sum()
            r1 = np.log((p1 + 1e-3) / shape); r2 = np.log((p2 + 1e-3) / shape)
            if r1.std() < 1e-9 or r2.std() < 1e-9:
                continue
            rhos.append(np.corrcoef(r1, r2)[0, 1]); gaps.append(s2 - e1); dirs.append(d1)
        a += W / 2
    return np.array(rhos), np.array(gaps), np.array(dirs)


@njit(cache=True)
def landscape_features(binlo, binhi, u, vol, valid, nb, lag, decay):
    """Online past-only features per bar: mean normalized range at the bar's bins and the
    (decayed) share of past volume located in those bins. Bars cover bins binlo..binhi."""
    n = len(u)
    sumu = np.zeros(nb); cnt = np.zeros(nb); vap = np.zeros(nb)
    totv = 0.0
    f_speed = np.full(n, np.nan); f_vap = np.full(n, np.nan); f_cnt = np.zeros(n)
    for t in range(n):
        s = t - lag
        if s >= 0 and valid[s]:
            k0 = binlo[s]; k1 = binhi[s]
            nk = k1 - k0 + 1
            for k in range(k0, k1 + 1):
                sumu[k] += u[s]; cnt[k] += 1.0
                vap[k] += vol[s] / nk
            totv += vol[s]
            if decay < 1.0:
                # decay applied lazily via global scaling would be faster; keep exact & simple
                pass
        if not valid[t]:
            continue
        k0 = binlo[t]; k1 = binhi[t]
        su = 0.0; c = 0.0; v = 0.0
        for k in range(k0, k1 + 1):
            su += sumu[k]; c += cnt[k]; v += vap[k]
        f_cnt[t] = c
        if c >= 3:
            f_speed[t] = su / c
        if totv > 0:
            f_vap[t] = v / totv / (k1 - k0 + 1) * nb
    return f_speed, f_vap, f_cnt


def regression_stats(y, X):
    ok = np.all(np.isfinite(X), axis=1) & np.isfinite(y)
    y = y[ok]; X = X[ok]
    X1 = np.column_stack([np.ones(len(y)), X])
    beta, *_ = np.linalg.lstsq(X1, y, rcond=None)
    return beta[1:], int(ok.sum())


def e2b_design(close_raw, high, low, adj, vol, sig_ref, rng_obj=None, surrogate=False):
    """Build y, X for the landscape regression (optionally on a sign-randomized surrogate path)."""
    r = np.diff(np.log(adj))
    n = len(r)
    lr = np.log(high[1:] / low[1:])                    # intrabar log range at bar t (t=1..)
    if surrogate:
        m = r.mean(); r = m + rng_obj.choice([-1.0, 1.0], size=n) * np.abs(r - m)
    x = np.log(close_raw[0]) + np.concatenate([[0.0], np.cumsum(r)])   # level path
    xc = x[1:]
    hi_ = xc + np.log(high[1:] / close_raw[1:]); lo_ = xc + np.log(low[1:] / close_raw[1:])
    # range normalised by a past-only EWMA of ranges
    lam = 0.94
    s = np.empty(n); s[0] = lr[:20].mean()
    for t in range(1, n):
        s[t] = lam * s[t - 1] + (1 - lam) * lr[t - 1]
    u = lr / s
    w = 0.5 * sig_ref
    base = min(lo_.min(), xc.min()) - w
    binlo = np.floor((lo_ - base) / w).astype(np.int64)
    binhi = np.floor((hi_ - base) / w).astype(np.int64)
    nb = int(binhi.max() + 2)
    valid = np.isfinite(u) & (lr > 0) & (np.arange(n) > 60) & (binhi - binlo < 40)
    fs, fv, fc = landscape_features(binlo, binhi, u, vol[1:].astype(np.float64), valid, nb, 5, 1.0)
    cummax = np.maximum.accumulate(np.concatenate([[0.0], np.cumsum(r)]))[1:]
    dd = np.concatenate([[0.0], np.cumsum(r)])[1:] - cummax
    rprev = np.concatenate([[0.0], r[:-1]]) / s
    X = np.column_stack([np.log(fs), np.log(np.maximum(fv, 1e-3)), dd, dd ** 2,
                         np.abs(rprev), np.minimum(rprev, 0)])
    y = np.log(u)
    return y, X


def analyse(ticker, nsurr=60):
    df = data.load_raw(ticker)
    df = df[(df["Close"] > 0) & (df["High"] >= df["Low"])].dropna(subset=["Close", "High", "Low"])
    c = df["Close"].values.astype(float); adj = df["Adj Close"].values.astype(float)
    hi = df["High"].values.astype(float); lo = df["Low"].values.astype(float)
    vol = df["Volume"].values.astype(float)
    if len(c) < 2500:
        return None
    r = np.diff(np.log(adj))
    sig = pd.Series(r).rolling(252, min_periods=126).std().median()
    out = {"ticker": ticker, "class": data.ASSET_CLASS.get(ticker, "?"), "n": int(len(c))}
    # ---------- E2-A ----------
    x = np.log(c)
    for W_mult, M, min_len in [(12, 6, 12), (24, 8, 24)]:
        rho, gaps, dirs = mirror_profile_stat(x, W_mult * sig, M, min_len)
        if len(rho) < 10:
            continue
        null_means = []
        for _ in range(nsurr):
            m = r.mean(); rs = m + rng.choice([-1.0, 1.0], size=len(r)) * np.abs(r - m)
            xs = x[0] + np.concatenate([[0.0], np.cumsum(rs)])
            rr, _, _ = mirror_profile_stat(xs, W_mult * sig, M, min_len)
            if len(rr) >= 5:
                null_means.append(rr.mean())
        nm = np.array(null_means)
        out[f"A_W{W_mult}"] = {"n_pairs": int(len(rho)), "mean_rho": float(rho.mean()),
                               "mean_rho_gap_lt60": float(rho[gaps < 60].mean()) if (gaps < 60).sum() > 3 else None,
                               "mean_rho_gap_ge60": float(rho[gaps >= 60].mean()) if (gaps >= 60).sum() > 3 else None,
                               "null_mean": float(nm.mean()), "null_sd": float(nm.std()),
                               "z": float((rho.mean() - nm.mean()) / nm.std()),
                               "p_one_sided": float((nm >= rho.mean()).mean())}
    # ---------- E2-B ----------
    has_vol = (vol > 0).mean() > 0.95
    if has_vol:
        y, X = e2b_design(c, hi, lo, adj, vol, sig)
        b, nobs = regression_stats(y, X)
        nb_speed, nb_vap = [], []
        for _ in range(nsurr):
            ys, Xs = e2b_design(c, hi, lo, adj, vol, sig, rng, surrogate=True)
            bs, _ = regression_stats(ys, Xs)
            nb_speed.append(bs[0]); nb_vap.append(bs[1])
        nb_speed = np.array(nb_speed); nb_vap = np.array(nb_vap)
        out["B"] = {"nobs": nobs, "beta_past_speed": float(b[0]), "beta_log_vap": float(b[1]),
                    "beta_dd": float(b[2]), "null_speed_mean": float(nb_speed.mean()), "null_speed_sd": float(nb_speed.std()),
                    "z_speed": float((b[0] - nb_speed.mean()) / nb_speed.std()),
                    "null_vap_mean": float(nb_vap.mean()), "null_vap_sd": float(nb_vap.std()),
                    "z_vap": float((b[1] - nb_vap.mean()) / nb_vap.std())}
    return out


if __name__ == "__main__":
    tickers = [t for t in data.all_daily_tickers() if t not in ("^VIX",)]
    results = []
    for t in tickers:
        try:
            o = analyse(t)
        except Exception as e:
            print(t, "ERR", repr(e)); continue
        if o is None:
            continue
        results.append(o)
        a = o.get("A_W12", {}); b = o.get("B", {})
        print(f"{t:9s} {o['class']:17s} A12: pairs={a.get('n_pairs',0):4d} rho={a.get('mean_rho',np.nan):+.3f} null={a.get('null_mean',np.nan):+.3f} z={a.get('z',np.nan):+.2f} | "
              f"B: speed={b.get('beta_past_speed',np.nan):+.3f} (z={b.get('z_speed',np.nan):+.1f}) vap={b.get('beta_log_vap',np.nan):+.3f} (z={b.get('z_vap',np.nan):+.1f})", flush=True)
        json.dump(results, open(os.path.join(RES, "e2_speed_memory.json"), "w"), indent=1)
    print("saved")

"""E1 - Reversibility test: do up- and down-crossings of the same price band take the same time?

Theory: in any time-homogeneous 1-D landscape diffusion dp = b(p)dt + s(p)dW (levels only), crossing
segments of a band are time-reversal images of each other, so up/down crossing durations are equal in
law (also with constant drift: drift +mu and -mu are Doob h-transforms of each other). In quadratic-
variation ("variance") time every continuous martingale is a Brownian motion (Dambis-Dubins-Schwarz), so
any remaining asymmetry in variance time must come from path-dependent drift.

Statistic per asset and band width W (in units of the asset's typical daily vol):
   Delta_X = mean log T_down - mean log T_up,   X in {calendar, variance, volume} time.
Null: sign-randomized surrogates (exact |r_t| path kept, directions randomized) -> p-value.
"""
import os, sys, json
import numpy as np
import pandas as pd
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ms import data
from ms.landscape import band_crossings, clipped_durations
from ms.nulls import sign_randomize

RES = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "results")
WIDTHS = [6.0, 12.0, 24.0]        # band width in typical daily standard deviations
NSURR = 200
rng = np.random.default_rng(7)


def crossing_stats(x, r2n, vn, W):
    """Return dict of arrays (dir, log Tcal, log Tvar, log Tvol) over all bands of width W.
    Durations count only the in-band part of each crossing (first/last steps clipped)."""
    lo, hi = x.min(), x.max()
    step = W / 2.0
    has_vol = vn is not None
    vv = vn if has_vol else np.zeros(len(r2n))
    dirs, tc, tv, tq = [], [], [], []
    a = lo
    while a + W <= hi:
        cr = band_crossings(x, a, a + W)
        if len(cr):
            d = clipped_durations(x, cr, a, a + W, r2n, vv, has_vol)
            dirs.append(cr[:, 2])
            tc.append(np.log(np.maximum(d[:, 0], 1e-6)))
            tv.append(np.log(np.maximum(d[:, 1], 1e-9)))
            if has_vol:
                tq.append(np.log(np.maximum(d[:, 2], 1e-9)))
        a += step
    if not dirs:
        return None
    out = {"dir": np.concatenate(dirs), "cal": np.concatenate(tc), "var": np.concatenate(tv)}
    if tq:
        out["vol"] = np.concatenate(tq)
    return out


def deltas(st):
    d = st["dir"]
    res = {"n_up": int((d == 1).sum()), "n_down": int((d == -1).sum())}
    for k in ("cal", "var", "vol"):
        if k in st and (d == 1).sum() >= 5 and (d == -1).sum() >= 5:
            res[k] = float(st[k][d == -1].mean() - st[k][d == 1].mean())
    return res


def leverage_tra(r, maxlag=20):
    """Sum over lags of corr(r_t, r_{t+k}^2) - corr(r_t^2, r_{t+k}): <0 => vol rises after falls."""
    r = (r - r.mean()) / r.std()
    r2 = r ** 2
    s = 0.0
    for k in range(1, maxlag + 1):
        s += np.corrcoef(r[:-k], r2[k:])[0, 1] - np.corrcoef(r2[:-k], r[k:])[0, 1]
    return float(s)


def analyse(ticker):
    df = data.load(ticker)
    df = df[~df.index.duplicated(keep="last")]
    c = df["Close"].astype(float)
    r = np.log(c).diff()
    ok = r.notna() & np.isfinite(r)
    r = r[ok]
    if len(r) < 2500:
        return None
    v = df["Volume"].astype(float).reindex(r.index)
    has_vol = (v > 0).mean() > 0.95
    sig = r.rolling(252, min_periods=126).std().median()
    rv = r.values
    vn = None
    if has_vol:
        vbar = v.rolling(252, min_periods=60).mean().bfill()
        vn = (v / vbar).fillna(1.0).values
    out = {"ticker": ticker, "class": data.ASSET_CLASS.get(ticker, "?"), "n": int(len(rv)),
           "start": str(r.index[0].date()), "sigma_d": float(sig), "has_volume": bool(has_vol),
           "leverage_tra": leverage_tra(rv), "skew_1d": float(pd.Series(rv).skew()),
           "skew_21d": float(pd.Series(rv).rolling(21).sum()[::21].skew())}
    r2n = rv ** 2 / sig ** 2
    for W in WIDTHS:
        Wl = W * sig
        x = np.concatenate([[0.0], np.cumsum(rv)])
        st = crossing_stats(x, r2n, vn, Wl)
        if st is None:
            continue
        real = deltas(st)
        null = {k: [] for k in ("cal", "var", "vol")}
        for _ in range(NSURR):
            rs = sign_randomize(rv, rng)
            xs = np.concatenate([[0.0], np.cumsum(rs)])
            sts = crossing_stats(xs, rs ** 2 / sig ** 2, vn, Wl)
            if sts is None:
                continue
            dd = deltas(sts)
            for k in null:
                if k in dd:
                    null[k].append(dd[k])
        rec = {"n_up": real["n_up"], "n_down": real["n_down"]}
        for k in ("cal", "var", "vol"):
            if k in real and len(null[k]) > 20:
                nk = np.array(null[k])
                rec[k] = {"delta": real[k], "null_mean": float(nk.mean()), "null_sd": float(nk.std()),
                          "z": float((real[k] - nk.mean()) / nk.std()),
                          "p_two_sided": float(2 * min((nk <= real[k]).mean(), (nk >= real[k]).mean()))}
        out[f"W{int(W)}"] = rec
    return out


if __name__ == "__main__":
    tick = [t for t in data.all_daily_tickers()]
    results = []
    for t in tick:
        try:
            o = analyse(t)
        except Exception as e:
            print(t, "ERR", e); continue
        if o is None:
            continue
        results.append(o)
        w = o.get("W12", {})
        cal = w.get("cal", {}); var = w.get("var", {}); vol = w.get("vol", {})
        print(f"{t:9s} {o['class']:17s} lev={o['leverage_tra']:+.3f} skew21={o['skew_21d']:+.2f} | W12 n={w.get('n_up',0)}/{w.get('n_down',0)} "
              f"cal={cal.get('delta',np.nan):+.3f} (z={cal.get('z',np.nan):+.1f})  var={var.get('delta',np.nan):+.3f} (z={var.get('z',np.nan):+.1f})  "
              f"vol={vol.get('delta',np.nan):+.3f} (z={vol.get('z',np.nan):+.1f})", flush=True)
    json.dump(results, open(os.path.join(RES, "e1_reversibility_clipped.json"), "w"), indent=1)
    print("saved")

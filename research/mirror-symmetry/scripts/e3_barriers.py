"""E3 - Do prior swing extremes act as liquidity barriers (double tops / double bottoms)?

For each swing high H (zigzag threshold h), after the decline that confirms it, take the first bar
whose high returns to within eps of H ("test"). From that bar's close race two symmetric barriers
(+-delta, log): REJECT if the lower one is hit first, BREAK if the upper one is. Mirror logic for
swing lows (bounce vs break). Placebo levels: L = H*exp(-u*sigma), u~U(1,3), with the same structure
(price must first trade h below L, then return within eps). Each test also records: volume at the
pivot (relative), prior number of tests of the level, the regime vol ratio, and the gap in bars.
Martingale benchmark: ~50% (minus drift). Surrogate: sign-randomized returns with the bar ranges and
volumes kept on the same dates.
"""
import os, sys, json
import numpy as np
import pandas as pd
from numba import njit
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ms import data
from ms.zigzag import zigzag

RES = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "results")
rng = np.random.default_rng(5)


@njit(cache=True)
def race(lc, start, level_up, level_dn, maxlen):
    n = len(lc)
    for t in range(start, min(n, start + maxlen)):
        if lc[t] >= level_up:
            return 1
        if lc[t] <= level_dn:
            return -1
    return 0


@njit(cache=True)
def test_level(lh, ll, lc, level, side, t0, h, eps, delta, maxwait, maxrace, maxtests):
    """side=+1: resistance at `level` (approached from below). Returns arrays of
    (test_idx, outcome[+1 reject/-1 break/0 censored], test_number). Repeats after each rejection
    (a rejection must again carry price h away before the next test counts)."""
    out = np.zeros((maxtests, 3), np.int64)
    k = 0
    n = len(lc)
    t = t0
    while k < maxtests and t < n:
        # need excursion of h away from the level first
        away = -1
        for i in range(t, min(n, t + maxwait)):
            if side == 1 and ll[i] <= level - h:
                away = i; break
            if side == -1 and lh[i] >= level + h:
                away = i; break
            if side == 1 and lh[i] > level + delta:      # broke above before a proper excursion
                return out[:k]
            if side == -1 and ll[i] < level - delta:
                return out[:k]
        if away < 0:
            return out[:k]
        tt = -1
        for i in range(away + 1, min(n, away + maxwait)):
            if side == 1 and lh[i] >= level - eps:
                tt = i; break
            if side == -1 and ll[i] <= level + eps:
                tt = i; break
        if tt < 0:
            return out[:k]
        res = race(lc, tt, lc[tt] + delta, lc[tt] - delta, maxrace)
        if side == 1:
            o = 1 if res == -1 else (-1 if res == 1 else 0)
        else:
            o = 1 if res == 1 else (-1 if res == -1 else 0)
        out[k, 0] = tt; out[k, 1] = o; out[k, 2] = k + 1
        k += 1
        if o != 1:
            return out[:k]
        t = tt + 1
    return out[:k]


def events(lh, ll, lc, vrel, s_reg, sig, hmult=4.0, epsm=0.5, deltam=2.0, placebo=False, rng_obj=None):
    h, eps, delta = hmult * sig, epsm * sig, deltam * sig
    piv = zigzag(lh, ll, h)
    rows = []
    for (pi, ptype, pconf) in piv:
        level = lh[pi] if ptype == 1 else ll[pi]
        if placebo:
            u = rng_obj.uniform(1.0, 3.0) * sig
            level = level - u if ptype == 1 else level + u
        res = test_level(lh, ll, lc, level, int(ptype), int(pi) + 1, h, eps, delta, 500, 60, 4)
        for (tt, o, kk) in res:
            if o == 0:
                continue
            rows.append((int(ptype), int(o == 1), int(kk), float(vrel[pi]), float(s_reg[tt]), int(tt - pi)))
    return np.array(rows, dtype=float).reshape(-1, 6)


def prep(df, surrogate=False, rng_obj=None):
    c = df["Close"].values.astype(float); hi = df["High"].values.astype(float); lo = df["Low"].values.astype(float)
    adj = df["Adj Close"].values.astype(float); vol = df["Volume"].values.astype(float)
    lc = np.log(c); lh = np.log(hi); ll = np.log(lo)
    if surrogate:
        r = np.diff(np.log(adj)); m = r.mean()
        r = m + rng_obj.choice([-1.0, 1.0], size=len(r)) * np.abs(r - m)
        lc_new = lc[0] + np.concatenate([[0.0], np.cumsum(r)])
        lh = lc_new + (lh - lc); ll = lc_new + (ll - lc); lc = lc_new
    v = pd.Series(vol)
    vrel = (v.rolling(5, center=True, min_periods=1).sum() / (v.rolling(100, min_periods=20).mean().shift(5) * 5)).fillna(1.0).values
    rr = pd.Series(np.concatenate([[0.0], np.diff(np.log(adj))]))
    s_reg = (rr.rolling(20, min_periods=5).std() / rr.rolling(252, min_periods=60).std()).fillna(1.0).values
    return lh, ll, lc, vrel, s_reg


def summarize(ev):
    if len(ev) == 0:
        return {}
    out = {"n": int(len(ev)), "p_reject": float(ev[:, 1].mean())}
    for side, name in [(1, "tops"), (-1, "bottoms")]:
        e = ev[ev[:, 0] == side]
        if len(e) < 5:
            continue
        d = {"n": int(len(e)), "p_reject": float(e[:, 1].mean())}
        for k in (1, 2, 3):
            ek = e[e[:, 2] == k]
            if len(ek) >= 5:
                d[f"p_test{k}"] = float(ek[:, 1].mean()); d[f"n_test{k}"] = int(len(ek))
        hv = e[:, 3] >= np.median(e[:, 3]); d["p_highvol_pivot"] = float(e[hv, 1].mean()); d["p_lowvol_pivot"] = float(e[~hv, 1].mean())
        hs = e[:, 4] >= 1.0; d["p_high_regime_vol"] = float(e[hs, 1].mean()) if hs.sum() > 3 else None
        d["p_low_regime_vol"] = float(e[~hs, 1].mean()) if (~hs).sum() > 3 else None
        out[name] = d
    return out


def analyse(ticker, nsurr=40):
    df = data.load_raw(ticker)
    df = df[(df["Close"] > 0) & (df["High"] >= df["Low"]) & (df["Low"] > 0)].dropna(subset=["Close", "High", "Low"])
    if len(df) < 2500:
        return None
    if (df["Volume"] > 0).mean() < 0.9:
        df = df.assign(Volume=1.0)
    adj = df["Adj Close"].values.astype(float)
    sig = pd.Series(np.diff(np.log(adj))).rolling(252, min_periods=126).std().median()
    lh, ll, lc, vrel, s_reg = prep(df)
    ev = events(lh, ll, lc, vrel, s_reg, sig)
    evp = np.vstack([events(lh, ll, lc, vrel, s_reg, sig, placebo=True, rng_obj=rng) for _ in range(5)])
    sur = []
    for _ in range(nsurr):
        a = prep(df, surrogate=True, rng_obj=rng)
        sur.append(events(*a, sig))
    sur = np.vstack(sur)
    return {"ticker": ticker, "class": data.ASSET_CLASS.get(ticker, "?"), "sigma_d": float(sig),
            "real": summarize(ev), "placebo": summarize(evp), "surrogate": summarize(sur),
            "events": ev.tolist()}


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
        R, P, S = o["real"], o["placebo"], o["surrogate"]
        def g(d, side, k="p_reject"):
            return d.get(side, {}).get(k, np.nan)
        print(f"{t:9s} tops: real={g(R,'tops'):.3f} (n={g(R,'tops','n')}) plac={g(P,'tops'):.3f} sur={g(S,'tops'):.3f} | "
              f"bottoms: real={g(R,'bottoms'):.3f} (n={g(R,'bottoms','n')}) plac={g(P,'bottoms'):.3f} sur={g(S,'bottoms'):.3f}", flush=True)
        json.dump(results, open(os.path.join(RES, "e3_barriers.json"), "w"))
    print("saved")

"""E6 - SPY May 2026 (up-pass) vs November 2026 (down-pass) through the same raw price band.

Band = [718.66, 756.48] = raw closes of Apr 30 and May 29 2026 (start/end of the May rally).
"""
import os, sys, json
import numpy as np
import pandas as pd
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ms import data
from ms.landscape import band_crossings, dwell_profile, expected_crossing_shape, volume_at_price, crossing_weights

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "results")
rng = np.random.default_rng(3)

h = pd.read_pickle(os.path.join(ROOT, "data", "SPY_1h_raw.pkl"))
h.index = h.index.tz_convert("America/New_York").tz_localize(None)
h = h[h["Volume"] > 0]
d = data.load_raw("SPY")
A, B = 718.66, 756.48
a, b = np.log(A), np.log(B)
out = {"band_raw": [A, B]}

# ---------- 1. crossing segments on hourly closes ----------
x = np.log(h["Close"].values)
cr = band_crossings(x, a, b)
times = h.index
segs = []
for s, e, dr in cr:
    segs.append({"start": str(times[s]), "end": str(times[e]), "dir": int(dr), "s": int(s), "e": int(e)})
may = [g for g in segs if g["dir"] == 1 and g["end"].startswith("2026-05")][-1]
nov = [g for g in segs if g["dir"] == -1 and g["end"].startswith("2026-11")][-1]
out["segments_all"] = [{k: v for k, v in g.items() if k not in ("s", "e")} for g in segs]
r = np.diff(x)                       # return from bar i to i+1
vol = h["Volume"].values.astype(float)


def seg_stats(g):
    s, e = g["s"], g["e"]
    w = crossing_weights(x, s, e, a, b)
    rr = r[s:e]; vv = vol[s + 1:e + 1]
    return {"start": g["start"], "end": g["end"], "hours_inband": float(w.sum()),
            "trading_days_approx": float(w.sum() / 7.0),
            "realized_var_inband": float((w * rr ** 2).sum()),
            "volume_inband_shares": float((w * vv).sum()),
            "realized_vol_ann": float(np.sqrt((w * rr ** 2).sum() / w.sum() * 7 * 252))}


out["may_up"] = seg_stats(may); out["nov_down"] = seg_stats(nov)
for k in ("hours_inband", "realized_var_inband", "volume_inband_shares"):
    out[f"ratio_nov_over_may_{k}"] = out["nov_down"][k] / out["may_up"][k]

# ---------- 2. dwell profiles (time spent per sub-band) ----------
M = 8
shape = expected_crossing_shape(M)
pm = dwell_profile(x, may["s"], may["e"], a, b, M); pn = dwell_profile(x, nov["s"], nov["e"], a, b, M)
out["dwell_may_hours"] = pm.tolist(); out["dwell_nov_hours"] = pn.tolist()
edges = np.exp(np.linspace(a, b, M + 1))
out["subband_edges"] = edges.round(2).tolist()
r1 = np.log((pm / pm.sum() + 1e-3) / shape); r2 = np.log((pn / pn.sum() + 1e-3) / shape)
out["mirror_rho_may_nov"] = float(np.corrcoef(r1, r2)[0, 1])
out["mirror_rho_raw_share"] = float(np.corrcoef(pm / pm.sum(), pn / pn.sum())[0, 1])


def mirror_rhos(xx, W, M, min_len):
    lo, hi = xx.min(), xx.max(); rh = []
    aa = lo
    while aa + W <= hi:
        c = band_crossings(xx, aa, aa + W)
        for j in range(len(c) - 1):
            s1, e1, _ = c[j]; s2, e2, _ = c[j + 1]
            if e1 - s1 < min_len or e2 - s2 < min_len:
                continue
            p1 = dwell_profile(xx, s1, e1, aa, aa + W, M); p2 = dwell_profile(xx, s2, e2, aa, aa + W, M)
            q1 = np.log((p1 / p1.sum() + 1e-3) / shape); q2 = np.log((p2 / p2.sum() + 1e-3) / shape)
            if q1.std() > 0 and q2.std() > 0:
                rh.append(np.corrcoef(q1, q2)[0, 1])
        aa += W / 4
    return np.array(rh)

W = b - a
real = mirror_rhos(x, W, M, 14)
nulls = []
for _ in range(100):
    m = r.mean(); rs = m + rng.choice([-1.0, 1.0], size=len(r)) * np.abs(r - m)
    xs = x[0] + np.concatenate([[0.0], np.cumsum(rs)])
    nulls.append(mirror_rhos(xs, W, M, 14))
nullcat = np.concatenate([n for n in nulls if len(n)])
out["hourly_all_pairs_mirror_rho_mean"] = float(real.mean()); out["hourly_n_pairs"] = int(len(real))
out["surrogate_mirror_rho_mean"] = float(nullcat.mean()); out["surrogate_mirror_rho_sd"] = float(nullcat.std())
out["may_nov_rho_percentile_vs_surrogate_pairs"] = float((nullcat < out["mirror_rho_may_nov"]).mean())
out["may_nov_rho_percentile_vs_real_pairs"] = float((real < out["mirror_rho_may_nov"]).mean())

# ---------- 3. price-space time histograms ($1 bins) for the two passes ----------
bins = np.arange(715, 761, 1.0)
def time_hist(s, e):
    hh = h.iloc[s:e + 1]
    t = np.zeros(len(bins) - 1)
    for lo_, hi_ in zip(hh["Low"].values, hh["High"].values):
        if hi_ <= lo_:
            continue
        ov = np.clip(np.minimum(hi_, bins[1:]) - np.maximum(lo_, bins[:-1]), 0, None)
        t += ov / (hi_ - lo_)
    return t
out["hist_bins"] = bins.tolist()
out["hist_may_hours"] = time_hist(may["s"], may["e"]).round(3).tolist()
out["hist_nov_hours"] = time_hist(nov["s"], nov["e"]).round(3).tolist()
out["hist_corr"] = float(np.corrcoef(out["hist_may_hours"], out["hist_nov_hours"])[0, 1])

# ---------- 4. volume-at-price landscape (hourly bars, raw) ----------
edges1 = np.arange(560, 800, 1.0)
def vap(df):
    return volume_at_price(df["Low"].values, df["High"].values, df["Volume"].values.astype(float), edges1)
out["vap_edges"] = edges1.tolist()
out["vap_all_to_nov20"] = vap(h).tolist()
out["vap_before_may"] = vap(h[h.index < "2026-05-01"]).tolist()
out["vap_may"] = vap(h[(h.index >= "2026-05-01") & (h.index < "2026-06-01")]).tolist()
out["vap_jun_oct"] = vap(h[(h.index >= "2026-06-01") & (h.index < "2026-11-01")]).tolist()
out["vap_dec25_feb26"] = vap(h[(h.index >= "2025-12-01") & (h.index < "2026-03-01")]).tolist()
out["vap_nov"] = vap(h[h.index >= "2026-11-01"]).tolist()
# daily-bar landscape further back (raw), 2021+
dd = d[d.index >= "2021-01-01"]
out["vap_daily_2021_on"] = volume_at_price(dd["Low"].values, dd["High"].values, dd["Volume"].values.astype(float), edges1).tolist()

# ---------- 5. intraday 1-minute November path through the band ----------
m1 = pd.read_pickle(os.path.join(ROOT, "data", "SPY_1m_30d.pkl"))
m1.index = m1.index.tz_convert("America/New_York").tz_localize(None)
nn = m1[(m1.index >= "2026-11-12") & (m1.index <= "2026-11-20 16:00")]
out["nov_1m_minutes_per_dollar"] = {}
t1 = np.zeros(len(bins) - 1)
for lo_, hi_ in zip(nn["Low"].values, nn["High"].values):
    if hi_ <= lo_:
        j = np.searchsorted(bins, lo_) - 1
        if 0 <= j < len(t1): t1[j] += 1
        continue
    t1 += np.clip(np.minimum(hi_, bins[1:]) - np.maximum(lo_, bins[:-1]), 0, None) / (hi_ - lo_)
out["hist_nov_minutes_1m"] = t1.round(2).tolist()

# ---------- 6. daily-path summary for plotting ----------
dd2 = d[(d.index >= "2025-09-01")]
out["daily_path"] = {"date": [str(i.date()) for i in dd2.index], "close": dd2["Close"].round(2).tolist(),
                     "high": dd2["High"].round(2).tolist(), "low": dd2["Low"].round(2).tolist(),
                     "volume": dd2["Volume"].astype(float).tolist()}
json.dump(out, open(os.path.join(RES, "e6_spy_2026.json"), "w"))
for k in ("may_up", "nov_down"):
    print(k, json.dumps(out[k]))
for k in ("ratio_nov_over_may_hours_inband", "ratio_nov_over_may_realized_var_inband", "ratio_nov_over_may_volume_inband_shares",
          "mirror_rho_may_nov", "mirror_rho_raw_share", "hist_corr", "hourly_all_pairs_mirror_rho_mean", "hourly_n_pairs",
          "surrogate_mirror_rho_mean", "surrogate_mirror_rho_sd", "may_nov_rho_percentile_vs_surrogate_pairs", "may_nov_rho_percentile_vs_real_pairs"):
    print(k, round(out[k], 4) if isinstance(out[k], float) else out[k])
print("edges", out["subband_edges"])
print("dwell may", np.round(pm, 1)); print("dwell nov", np.round(pn, 1))

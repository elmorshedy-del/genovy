"""E9 - Double tops as mirrors: historical test across 57 assets + the 2026 QQQ/SPY case.

Pattern (zigzag k = 6 daily sigma on raw highs/lows): L0 -> H1 -> N -> H2 with |ln(H2/H1)| <= 3 sigma.
Completion: first close below N after H2, before any close above max(H1, H2).
After completion:  MM   = measured-move target  ln N - (ln Hbar - ln N)
                   MIR  = mirror target = L0 (start of the leg into H1, i.e. full retracement)
Outcomes: reach MM before a new close above max(H1,H2) [and within 120 days]; reach MIR likewise [within 250 days].
Mirror speed: in the band [N, min(H1,H2)], time the left leg took to go up vs the right leg to come down.
Nulls: same procedure on sign-randomized surrogates (exact vol path kept, levels scrambled).
Martingale benchmark at completion: P(MM before new high) ~ (H - N)/(H - MM) ~ 1/2.
"""
import os, sys, json
import numpy as np, pandas as pd
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ms import data
from ms.zigzag import zigzag

RES = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "results")
rng = np.random.default_rng(17)


def first_index(cond, start, stop):
    idx = np.where(cond[start:stop])[0]
    return start + idx[0] if len(idx) else -1


def find_patterns(lh, ll, lc, sig, k=6.0, tol=3.0):
    piv = zigzag(lh, ll, k * sig)
    n = len(lc); out = []
    for j in range(len(piv) - 3):
        (i0, t0, _), (i1, t1, _), (i2, t2, _), (i3, t3, c3) = piv[j], piv[j + 1], piv[j + 2], piv[j + 3]
        if not (t0 == -1 and t1 == 1 and t2 == -1 and t3 == 1):
            continue
        L0, H1, N, H2 = ll[i0], lh[i1], ll[i2], lh[i3]
        if abs(H2 - H1) > tol * sig:
            continue
        Hmax = max(H1, H2); Hbar = 0.5 * (H1 + H2); Hmin = min(H1, H2)
        stop = min(n, i3 + 250)
        brk = first_index(lc < N, i3 + 1, stop)
        newhi = first_index(lc > Hmax, i3 + 1, stop)
        rec = {"i_L0": int(i0), "i_H1": int(i1), "i_N": int(i2), "i_H2": int(i3), "tilt_sigma": float((H2 - H1) / sig),
               "depth_sigma": float((Hmin - N) / sig), "left_leg_sigma": float((H1 - L0) / sig), "completed": False}
        if brk < 0 or (0 <= newhi < brk):
            out.append(rec); continue
        rec["completed"] = True; rec["i_break"] = int(brk)
        MM = N - (Hbar - N)
        stop2 = min(n, brk + 250)
        hi_after = first_index(lc > Hmax, brk + 1, stop2)
        t_mm = first_index(ll <= MM, brk, stop2); t_mir = first_index(ll <= L0, brk, stop2)
        def before(t, cap):
            return bool(t >= 0 and (hi_after < 0 or t < hi_after) and t - brk <= cap)
        rec["hit_mm_120"] = before(t_mm, 120); rec["hit_mirror_250"] = before(t_mir, 250)
        rec["new_high_first_250"] = bool(hi_after >= 0 and (t_mm < 0 or hi_after < t_mm))
        rec["left_starts_below_neckline"] = bool(L0 < N)
        # martingale benchmarks at completion (driftless, log scale, starting at N)
        rec["mg_mm"] = float((Hmax - N) / (Hmax - MM)); rec["mg_mirror"] = float((Hmax - N) / (Hmax - L0)) if L0 < N else None
        # mirror speed: crossing segments of the band [N, Hmin] (closes for the low edge, highs for the top edge)
        if L0 < N:
            below = np.where(lc[i0:i1 + 1] <= N)[0]
            left_start = i0 + int(below[-1]) if len(below) else i0
            left_end = first_index(lh >= Hmin, left_start, i1 + 1)
            above = np.where(lh[i3:brk + 1] >= Hmin)[0]
            right_start = i3 + int(above[-1]) if len(above) else i3
            if left_end > left_start and brk > right_start:
                rec["left_band_days"] = int(left_end - left_start); rec["right_band_days"] = int(brk - right_start)
                rec["log_speed_ratio_right_over_left"] = float(np.log(rec["left_band_days"] / rec["right_band_days"]))
        out.append(rec)
    return out


def summarize(pats):
    comp = [p for p in pats if p["completed"]]
    if not pats:
        return {}
    s = {"n_patterns": len(pats), "n_completed": len(comp), "p_completed": len(comp) / len(pats)}
    if comp:
        s["p_mm_120"] = float(np.mean([p["hit_mm_120"] for p in comp]))
        s["mg_mm"] = float(np.mean([p["mg_mm"] for p in comp]))
        s["p_new_high_first"] = float(np.mean([p["new_high_first_250"] for p in comp]))
        cm = [p for p in comp if p.get("left_starts_below_neckline")]
        s["n_completed_left_below"] = len(cm)
        if cm:
            s["p_mirror_250"] = float(np.mean([p["hit_mirror_250"] for p in cm]))
            s["mg_mirror"] = float(np.mean([p["mg_mirror"] for p in cm]))
            sp = [p for p in cm if "log_speed_ratio_right_over_left" in p]
            lsr = np.array([p["log_speed_ratio_right_over_left"] for p in sp])
            if len(lsr):
                s["median_speed_ratio_right_over_left"] = float(np.exp(np.median(lsr)))
                s["share_speed_within_20pct"] = float(np.mean(np.abs(lsr) <= np.log(1.2)))
                near = np.abs(lsr) <= np.log(1.25)
                if near.sum() >= 5 and (~near).sum() >= 5:
                    s["p_mirror_if_speed_matched"] = float(np.mean([p["hit_mirror_250"] for p, f in zip(sp, near) if f]))
                    s["p_mirror_if_speed_unmatched"] = float(np.mean([p["hit_mirror_250"] for p, f in zip(sp, near) if not f]))
                    s["n_speed_matched"] = int(near.sum())
    return s


def prep(df, surrogate=False):
    c = df["Close"].values.astype(float); hi = df["High"].values.astype(float); lo = df["Low"].values.astype(float)
    adj = df["Adj Close"].values.astype(float)
    lc, lh, ll = np.log(c), np.log(hi), np.log(lo)
    if surrogate:
        r = np.diff(np.log(adj)); m = r.mean(); r = m + rng.choice([-1.0, 1.0], size=len(r)) * np.abs(r - m)
        new = lc[0] + np.concatenate([[0.0], np.cumsum(r)]); lh = new + (lh - lc); ll = new + (ll - lc); lc = new
    return lh, ll, lc


if __name__ == "__main__":
    real_all, sur_all, per_asset = [], [], {}
    for t in [x for x in data.all_daily_tickers() if x != "^VIX"]:
        df = data.load_raw(t)
        df = df[(df["Close"] > 0) & (df["Low"] > 0) & (df["High"] >= df["Low"])].dropna(subset=["Close", "High", "Low"])
        if len(df) < 2500:
            continue
        sig = pd.Series(np.diff(np.log(df["Adj Close"].values))).rolling(252, min_periods=126).std().median()
        pats = find_patterns(*prep(df), sig)
        for p in pats:
            p["ticker"] = t; p["class"] = data.ASSET_CLASS.get(t)
        real_all += pats
        for _ in range(20):
            sur_all += find_patterns(*prep(df, surrogate=True), sig)
        per_asset[t] = summarize(pats)
    R, S = summarize(real_all), summarize(sur_all)
    eq = [p for p in real_all if p["class"] in ("us_equity_index", "intl_equity_index")]
    out = {"real": R, "surrogate": S, "equity_indices": summarize(eq), "per_asset": per_asset,
           "patterns": [{k: v for k, v in p.items()} for p in real_all if p["completed"]]}
    json.dump(out, open(os.path.join(RES, "e9_double_top.json"), "w"), indent=1)
    for name, s in (("REAL (all assets)", R), ("EQUITY INDICES", out["equity_indices"]), ("SURROGATE", S)):
        print(name, json.dumps({k: (round(v, 3) if isinstance(v, float) else v) for k, v in s.items()}))

"""E5 - Microstructure tests on Nasdaq TotalView-ITCH order-level data (SPY and others).

Usage: python3 scripts/e5_itch_micro.py 2026-05-15 SPY
Outputs results/e5_itch_<date>_<sym>.json and data/itch/<date>_<sym>_book.npz
"""
import os, sys, json, time
import numpy as np
import pandas as pd
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ms.itch_book import load_symbol, rebuild, OPEN_NS, CLOSE_NS
from ms.landscape import band_crossings, dwell_profile, expected_crossing_shape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "results"); DAT = os.path.join(ROOT, "data", "itch")


def ols(y, X):
    X1 = np.column_stack([np.ones(len(y)), X])
    b, *_ = np.linalg.lstsq(X1, y, rcond=None)
    resid = y - X1 @ b
    r2 = 1 - resid.var() / y.var()
    # HC0 standard errors
    XtX_inv = np.linalg.pinv(X1.T @ X1)
    meat = (X1 * resid[:, None] ** 2).T @ X1
    se = np.sqrt(np.diag(XtX_inv @ meat @ XtX_inv))
    return b, se, r2


def main(date, sym):
    t0 = time.time()
    rec = load_symbol(os.path.join(DAT, date), sym)
    d = rebuild(rec, snap_halfwidth=600)
    tb = d["tick_base"]
    print(f"{date} {sym}: {len(rec):,} msgs, rebuilt in {time.time()-t0:.1f}s, trades={len(d['tr_ts']):,}")
    # ---------- regular-session series ----------
    ts = d["tr_ts"]; px = (d["tr_px"] + tb) / 100.0; sz = d["tr_sz"].astype(float); sg = d["tr_sg"].astype(float)
    reg = (ts >= OPEN_NS) & (ts < CLOSE_NS)
    ts, px, sz, sg, kind = ts[reg], px[reg], sz[reg], sg[reg], d["tr_kind"][reg]
    qb = d["q_bid"]; qa = d["q_ask"]
    ok = (qb > 0) & (qa > qb)
    mid = np.where(ok, (qb + qa + 2 * tb) / 200.0, np.nan)
    mid = pd.Series(mid).ffill().bfill().values
    nsec = len(mid)
    sec = ((ts - OPEN_NS) // 10**9).astype(int)
    sec = np.clip(sec, 0, nsec - 1)
    sv = np.bincount(sec, weights=sz * sg, minlength=nsec)          # signed volume per second
    tv = np.bincount(sec, weights=sz, minlength=nsec)               # total volume per second
    nt = np.bincount(sec, minlength=nsec).astype(float)             # trade count per second
    out = {"date": date, "symbol": sym, "n_msgs": int(len(rec)), "n_trades_regular": int(len(ts)),
           "volume_regular": float(sz.sum()), "share_hidden": float(sz[kind == 2].sum() / sz.sum()),
           "open_mid": float(mid[0]), "close_mid": float(mid[-1]), "high_mid": float(mid.max()), "low_mid": float(mid.min()),
           "median_spread_cents": float(np.nanmedian(np.where(ok, qa - qb, np.nan))),
           "buy_share": float(sz[sg > 0].sum() / sz.sum())}
    # ---------- (a) flow -> price at several horizons ----------
    fp = {}
    for h in (1, 10, 60, 300):
        m = nsec // h
        dm = np.diff(mid[: m * h + 1: h]) if m * h + 1 <= nsec else np.diff(mid[::h][: m + 1])
        f = sv[: m * h].reshape(m, h).sum(1)[: len(dm)]
        if len(dm) > 20 and f.std() > 0:
            b, se, r2 = ols(dm * 100, f / 1e4)       # cents per 10k shares
            fp[f"{h}s"] = {"lambda_cents_per_10k": float(b[1]), "se": float(se[1]), "r2": float(r2), "n": int(len(dm))}
    out["flow_price"] = fp
    # ---------- (b) state function / hysteresis ----------
    csv = np.cumsum(sv)
    # pairs (t1, t2) separated by tau seconds; compare |dmid| when |dCSV| small vs large
    hyst = {}
    for tau in (60, 300, 1800):
        t1 = np.arange(0, nsec - tau, 7)
        dcsv = np.abs(csv[t1 + tau] - csv[t1]); dm = np.abs(mid[t1 + tau] - mid[t1])
        q20, q80 = np.quantile(dcsv, [0.2, 0.8])
        hyst[f"{tau}s"] = {"mean_abs_dmid_cents_flow_returned": float(dm[dcsv <= q20].mean() * 100),
                           "mean_abs_dmid_cents_flow_unreturned": float(dm[dcsv >= q80].mean() * 100),
                           "mean_abs_dmid_cents_all": float(dm.mean() * 100),
                           "corr_dmid_dcsv_signed": float(np.corrcoef(mid[t1 + tau] - mid[t1], csv[t1 + tau] - csv[t1])[0, 1])}
    out["hysteresis"] = hyst
    out["corr_mid_cumflow_levels"] = float(np.corrcoef(mid, csv)[0, 1])
    # ---------- (c) depth landscape memory ----------
    snaps = d["snaps"]; smid = d["snap_mid"]
    W = (snaps.shape[1] - 1) // 2
    nmin = snaps.shape[0]
    # executed volume by absolute tick, cumulative through each minute
    tick = np.round(px * 100).astype(int) - tb
    tmin = np.clip(((ts - OPEN_NS) // (60 * 10**9)).astype(int), 0, nmin - 1)
    lo_t, hi_t = tick.min() - W - 5, tick.max() + W + 5
    rows = []
    vap_cum = np.zeros(hi_t - lo_t + 1)
    order = np.argsort(tmin, kind="stable")
    tmin_s, tick_s, sz_s = tmin[order], tick[order], sz[order]
    j = 0
    rng = np.random.default_rng(0)
    for mnt in range(nmin):
        while j < len(tmin_s) and tmin_s[j] < mnt:
            vap_cum[tick_s[j] - lo_t] += sz_s[j]; j += 1
        if mnt < 30 or smid[mnt] <= 0:
            continue
        m0 = smid[mnt]
        offs = np.arange(-W, W + 1)
        lv = m0 + offs
        good = (np.abs(offs) >= 1) & (np.abs(offs) <= 300) & (lv - lo_t >= 0) & (lv - lo_t < len(vap_cum))
        sel = np.where(good)[0]
        sel = rng.choice(sel, size=min(120, len(sel)), replace=False)
        for k in sel:
            dep = abs(snaps[mnt, k])
            lev = lv[k]
            rows.append((mnt, offs[k], dep, vap_cum[lev - lo_t], (lev + tb) % 100 == 0, (lev + tb) % 50 == 0, (lev + tb) % 10 == 0))
    R = np.array(rows, dtype=float)
    if len(R) > 1000:
        dist = np.abs(R[:, 1]).astype(int)
        # distance fixed effects via demeaning within distance buckets (5-tick buckets) and side
        bucket = (dist // 5) * np.sign(R[:, 1])
        y = np.log1p(R[:, 2]); x1 = np.log1p(R[:, 3])
        dfm = pd.DataFrame({"b": bucket, "y": y, "x1": x1, "r100": R[:, 4], "r50": R[:, 5], "r10": R[:, 6]})
        for col in ["y", "x1", "r100", "r50", "r10"]:
            dfm[col + "_d"] = dfm[col] - dfm.groupby("b")[col].transform("mean")
        b, se, r2 = ols(dfm["y_d"].values, dfm[["x1_d", "r100_d", "r50_d", "r10_d"]].values)
        out["depth_memory"] = {"beta_log_prior_volume": float(b[1]), "se": float(se[1]),
                               "beta_round_dollar": float(b[2]), "se_round_dollar": float(se[2]),
                               "beta_round_50c": float(b[3]), "beta_round_10c": float(b[4]),
                               "n_obs": int(len(dfm)), "r2_within": float(r2)}
    # ---------- (d) dwell vs depth by price level ----------
    # seconds the mid spent at each cent level vs mean displayed depth at that level (when within 50 ticks)
    mid_tick = np.round(mid * 100).astype(int) - tb
    dwell = pd.Series(1.0, index=mid_tick).groupby(level=0).sum()
    dep_rows = []
    for mnt in range(nmin):
        if smid[mnt] <= 0:
            continue
        for k in range(W - 50, W + 51):
            dep_rows.append((smid[mnt] + k - W, abs(snaps[mnt, k])))
    dep = pd.DataFrame(dep_rows, columns=["lev", "dep"]).groupby("lev")["dep"].mean()
    vol_at = pd.Series(sz, index=tick).groupby(level=0).sum()
    j = pd.concat([dwell.rename("dwell"), dep.rename("depth"), vol_at.rename("vol")], axis=1).dropna()
    j = j[(j["dwell"] > 0) & (j["depth"] > 0)]
    if len(j) > 20:
        out["dwell_vs_depth"] = {"spearman_dwell_depth": float(j["dwell"].rank().corr(j["depth"].rank())),
                                 "spearman_dwell_volume": float(j["dwell"].rank().corr(j["vol"].rank())),
                                 "n_levels": int(len(j))}
    # ---------- (e) intraday crossings: clock vs volume vs trade-count time ----------
    lm = np.log(mid)
    cumv = np.concatenate([[0.0], np.cumsum(tv)])
    cumn = np.concatenate([[0.0], np.cumsum(nt)])
    cr_out = {}
    for width_c in (10, 20, 40):
        Wd = width_c / 100.0 / mid.mean()
        lo_, hi_ = lm.min(), lm.max()
        a = lo_; recs = []
        rhos = []
        shape = expected_crossing_shape(5)
        while a + Wd <= hi_:
            cr = band_crossings(lm, a, a + Wd)
            for (s, e, dd) in cr:
                recs.append((dd, e - s, cumv[e] - cumv[s] + 1, cumn[e] - cumn[s] + 1))
            for q in range(len(cr) - 1):
                s1, e1, _ = cr[q]; s2, e2, _ = cr[q + 1]
                if e1 - s1 >= 20 and e2 - s2 >= 20:
                    p1 = dwell_profile(lm, s1, e1, a, a + Wd, 5); p2 = dwell_profile(lm, s2, e2, a, a + Wd, 5)
                    r1 = np.log((p1 / p1.sum() + 1e-3) / shape); r2 = np.log((p2 / p2.sum() + 1e-3) / shape)
                    if r1.std() > 0 and r2.std() > 0:
                        rhos.append(np.corrcoef(r1, r2)[0, 1])
            a += Wd / 2
        if len(recs) > 10:
            A = np.array(recs, dtype=float)
            up, dn = A[:, 0] == 1, A[:, 0] == -1
            cr_out[f"{width_c}c"] = {"n_up": int(up.sum()), "n_down": int(dn.sum()),
                                     "delta_log_clock": float(np.log(A[dn, 1]).mean() - np.log(A[up, 1]).mean()),
                                     "delta_log_volume": float(np.log(A[dn, 2]).mean() - np.log(A[up, 2]).mean()),
                                     "delta_log_trades": float(np.log(A[dn, 3]).mean() - np.log(A[up, 3]).mean()),
                                     "mirror_rho_mean": float(np.mean(rhos)) if rhos else None, "n_pairs": len(rhos)}
    out["intraday_crossings"] = cr_out
    # ---------- (f) micro barriers: queue imbalance -> direction of next mid move ----------
    qbs = d["q_bsz"].astype(float); qas = d["q_asz"].astype(float)
    midc = np.round(mid * 200).astype(np.int64)          # half-cent units
    chg = np.where(np.diff(midc) != 0)[0] + 1             # seconds where mid changed
    nxt = np.full(nsec, -1, np.int64)
    if len(chg):
        pos = np.searchsorted(chg, np.arange(nsec), side="right")
        has = pos < len(chg)
        nxt[has] = chg[pos[has]]
    valid = ok & (nxt > 0) & (qbs + qas > 0)
    idxs = np.where(valid)[0]
    I = (qbs[idxs] - qas[idxs]) / (qbs[idxs] + qas[idxs])
    upmove = (midc[nxt[idxs]] > midc[idxs]).astype(float)
    bins = np.linspace(-1, 1, 11)
    qi = {}
    for k in range(10):
        m = (I >= bins[k]) & (I < bins[k + 1] if k < 9 else I <= bins[k + 1])
        if m.sum() > 30:
            qi[f"{bins[k]:+.1f}..{bins[k+1]:+.1f}"] = {"p_up": float(upmove[m].mean()), "n": int(m.sum())}
    out["queue_imbalance"] = {"bins": qi, "corr_I_up": float(np.corrcoef(I, upmove)[0, 1]) if len(I) > 10 else None}
    # ---------- (g) multi-level depth imbalance -> which side (+-X cents) is hit first ----------
    mb = {}
    for X in (5, 10, 25):
        rows2 = []
        for mnt in range(nmin):
            if smid[mnt] <= 0:
                continue
            s0 = (mnt + 1) * 60
            if s0 >= nsec - 1:
                break
            m0 = mid[s0]
            fut = mid[s0:min(nsec, s0 + 3600)]
            hu = np.where(fut >= m0 + X / 100)[0]; hd = np.where(fut <= m0 - X / 100)[0]
            if len(hu) == 0 and len(hd) == 0:
                continue
            up_first = 1.0 if (len(hd) == 0 or (len(hu) and hu[0] < hd[0])) else 0.0
            row = snaps[mnt]
            for kk in (5, 20, 60):
                pass
            bidd = np.clip(row[W - X:W], 0, None).sum(); askd = np.clip(-row[W + 1:W + X + 1], 0, None).sum()
            rows2.append(((bidd - askd) / max(bidd + askd, 1), up_first))
        if len(rows2) > 30:
            A2 = np.array(rows2)
            hi_b = A2[:, 0] > np.quantile(A2[:, 0], 0.7); lo_b = A2[:, 0] < np.quantile(A2[:, 0], 0.3)
            mb[f"{X}c"] = {"n": int(len(A2)), "corr": float(np.corrcoef(A2[:, 0], A2[:, 1])[0, 1]),
                           "p_up_when_bid_heavy": float(A2[hi_b, 1].mean()), "p_up_when_ask_heavy": float(A2[lo_b, 1].mean())}
    out["depth_imbalance_first_passage"] = mb
    # ---------- (h) where do NEW limit orders go? (latent liquidity placement) ----------
    addc = d["add_cnt"].astype(float)
    rows3 = []
    j = 0
    vap_cum2 = np.zeros(hi_t - lo_t + 1)
    for mnt in range(nmin):
        while j < len(tmin_s) and tmin_s[j] < mnt:
            vap_cum2[tick_s[j] - lo_t] += sz_s[j]; j += 1
        m0 = smid[max(mnt - 1, 0)]
        if mnt < 30 or m0 <= 0:
            continue
        for k in range(W - 300, W + 301, 3):
            off = k - W
            if off == 0:
                continue
            lev = m0 + off
            if lev - lo_t < 0 or lev - lo_t >= len(vap_cum2):
                continue
            rows3.append((off, addc[mnt, k], vap_cum2[lev - lo_t], (lev + tb) % 100 == 0, (lev + tb) % 50 == 0, (lev + tb) % 10 == 0))
    R3 = np.array(rows3, dtype=float)
    if len(R3) > 1000:
        bucket = (np.abs(R3[:, 0]).astype(int) // 5) * np.sign(R3[:, 0])
        dfa = pd.DataFrame({"b": bucket, "y": np.log1p(R3[:, 1]), "x1": np.log1p(R3[:, 2]), "r100": R3[:, 3], "r50": R3[:, 4], "r10": R3[:, 5]})
        for col in ["y", "x1", "r100", "r50", "r10"]:
            dfa[col + "_d"] = dfa[col] - dfa.groupby("b")[col].transform("mean")
        b3, se3, r23 = ols(dfa["y_d"].values, dfa[["x1_d", "r100_d", "r50_d", "r10_d"]].values)
        out["order_placement"] = {"beta_log_prior_volume": float(b3[1]), "se": float(se3[1]),
                                  "beta_round_dollar": float(b3[2]), "se_round_dollar": float(se3[2]),
                                  "beta_round_50c": float(b3[3]), "beta_round_10c": float(b3[4]), "n_obs": int(len(dfa))}
    # ---------- save ----------
    np.savez_compressed(os.path.join(DAT, f"{date}_{sym}_book.npz"), mid=mid, sv=sv, tv=tv, nt=nt,
                        snaps=snaps.astype(np.int32), snap_mid=smid, tick_base=tb,
                        tr_ts=ts, tr_px=px, tr_sz=sz, tr_sg=sg, add_cnt=d["add_cnt"].astype(np.int32))
    json.dump(out, open(os.path.join(RES, f"e5_itch_{date}_{sym}.json"), "w"), indent=1)
    print(json.dumps(out, indent=1))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

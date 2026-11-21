"""E8 - The 2026 structure in SPY and QQQ: which earlier leg is November undoing, and how exactly?

Legs (daily raw highs/lows, zigzag): left leg = Mar 30 2026 low -> top; right leg = Oct 6 2026 top -> Nov 20.
For each candidate leg: magnitude, trading days, %/day, realized variance (daily adj. returns), volume, and an
hourly level-crossing map: for every price level both legs traverse, when did each cross it. A perfect
reverse mirror makes the map a straight line with negative slope (slope = speed ratio)."""
import os, sys, json
import numpy as np, pandas as pd
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ms import data

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "results")

LEGS = {
    "SPY": {"Jan28-Mar30 (down)": ("2026-01-28", "2026-03-30"), "Mar30-Apr30 (April)": ("2026-03-30", "2026-04-30"),
            "Mar30-Jun02 (Apr-May)": ("2026-03-30", "2026-06-02"), "Jun26-Oct06 (summer)": ("2026-06-26", "2026-10-06"),
            "Mar30-Oct06 (whole rally)": ("2026-03-30", "2026-10-06"), "May01-Jun02 (May)": ("2026-05-01", "2026-06-02"),
            "Oct06-Nov20 (current)": ("2026-10-06", "2026-11-20"), "Nov12-Nov20 (last week)": ("2026-11-12", "2026-11-20")},
}
LEGS["QQQ"] = dict(LEGS["SPY"])
LEGS["QQQ"]["Jun26-Oct06 (summer)"] = ("2026-07-29", "2026-10-06")
LEGS["QQQ"] = {("Jul29-Oct06 (summer)" if k.startswith("Jun26") else k): v for k, v in LEGS["QQQ"].items()}
LEGS["QQQ"]["Nov11-Nov20 (last week)"] = LEGS["QQQ"].pop("Nov12-Nov20 (last week)")
LEGS["QQQ"]["Nov11-Nov20 (last week)"] = ("2026-11-11", "2026-11-20")


def leg_stats(df, s, e):
    seg = df.loc[s:e]
    up = seg["Close"].iloc[-1] >= seg["Close"].iloc[0]
    p0 = seg["Low"].iloc[0] if up else seg["High"].iloc[0]
    p1 = seg["High"].iloc[-1] if up else seg["Low"].iloc[-1]
    if s == "2026-10-06" or s.startswith("2026-11"):
        p0 = seg["High"].iloc[0]; p1 = seg["Close"].iloc[-1]
    r = np.log(seg["Adj Close"]).diff().dropna()
    n = len(seg) - 1
    mag = np.log(p1 / p0)
    return {"start": s, "end": e, "p0": round(float(p0), 2), "p1": round(float(p1), 2), "log_move": float(mag),
            "pct_move": float(100 * (p1 / p0 - 1)), "trading_days": int(n), "pct_per_day": float(100 * abs(mag) / n),
            "realized_vol_ann": float(r.std() * np.sqrt(252)), "qv": float((r ** 2).sum()), "efficiency": float(abs(mag) / np.sqrt((r ** 2).sum()) / np.sqrt(n)),
            "volume_bn": float(seg["Volume"].iloc[1:].sum() / 1e9)}


def crossing_map(h, s1, e1, s2, e2, step):
    """First hourly-bar time (in trading hours since leg start) at which each leg reaches each level."""
    a = h.loc[s1:e1 + " 23:59"]; b = h.loc[s2:e2 + " 23:59"]
    up_a = a["Close"].iloc[-1] > a["Close"].iloc[0]; up_b = b["Close"].iloc[-1] > b["Close"].iloc[0]
    lo = max(a["Low"].min(), b["Low"].min()); hi = min(a["High"].max(), b["High"].max())
    levels = np.arange(np.ceil(lo / step) * step, hi, step)
    def first_cross(seg, up):
        out = []
        for x in levels:
            hit = np.where(seg["High"].values >= x)[0] if up else np.where(seg["Low"].values <= x)[0]
            out.append(hit[0] if len(hit) else np.nan)
        return np.array(out, float)
    ta = first_cross(a, up_a); tb = first_cross(b, up_b)
    return levels, ta, tb, len(a), len(b)


out = {}
for t in ("SPY", "QQQ"):
    df = data.load_raw(t)
    h = pd.read_pickle(os.path.join(ROOT, "data", f"{t}_1h_raw.pkl")); h.index = h.index.tz_convert("America/New_York").tz_localize(None)
    res = {"legs": {}}
    for name, (s, e) in LEGS[t].items():
        res["legs"][name] = leg_stats(df, s, e)
    cur = res["legs"]["Oct06-Nov20 (current)"]
    for name, L in res["legs"].items():
        if name.startswith("Oct06") or "last week" in name:
            continue
        L["speed_ratio_current_over_leg"] = cur["pct_per_day"] / L["pct_per_day"]
        L["vol_ratio_current_over_leg"] = cur["realized_vol_ann"] / L["realized_vol_ann"]
        L["magnitude_ratio_current_over_leg"] = abs(cur["log_move"]) / abs(L["log_move"])
    # level-crossing maps vs the two main candidates
    step = 2.0 if t == "SPY" else 2.5
    maps = {}
    for name in ("Mar30-Jun02 (Apr-May)", "Jun26-Oct06 (summer)", "Jul29-Oct06 (summer)", "Mar30-Apr30 (April)"):
        if name not in LEGS[t]:
            continue
        s, e = LEGS[t][name]
        lv, ta, tb, na, nb = crossing_map(h, s, e, "2026-10-06", "2026-11-20", step)
        ok = np.isfinite(ta) & np.isfinite(tb)
        if ok.sum() < 5:
            continue
        slope, icpt = np.polyfit(ta[ok], tb[ok], 1)
        resid = tb[ok] - (slope * ta[ok] + icpt)
        # local speed (hours per level step) correlation = speed-profile mirror
        da = np.diff(ta[ok]); db = np.diff(tb[ok])
        rho = float(pd.Series(np.abs(da)).rank().corr(pd.Series(np.abs(db)).rank())) if len(da) > 4 else None
        maps[name] = {"levels": lv[ok].round(2).tolist(), "t_leg_hours": ta[ok].tolist(), "t_current_hours": tb[ok].tolist(),
                      "slope": float(slope), "r2": float(1 - resid.var() / tb[ok].var()), "speed_profile_spearman": rho,
                      "overlap_band": [float(lv[ok].min()), float(lv[ok].max())]}
    res["maps"] = maps
    out[t] = res
    print(f"===== {t}")
    for name, L in res["legs"].items():
        extra = "" if "speed_ratio_current_over_leg" not in L else f"  | current/leg: speed {L['speed_ratio_current_over_leg']:.2f}  vol {L['vol_ratio_current_over_leg']:.2f}  size {L['magnitude_ratio_current_over_leg']:.2f}"
        print(f"{name:27s} {L['p0']:8.2f} -> {L['p1']:8.2f} {L['pct_move']:+6.1f}% {L['trading_days']:3d}d {L['pct_per_day']:.2f}%/d  rv {100*L['realized_vol_ann']:4.1f}%  eff {L['efficiency']:.2f}  vol {L['volume_bn']:.2f}bn{extra}")
    for name, m in maps.items():
        print(f"  map vs {name}: band {m['overlap_band']}, slope {m['slope']:+.2f} (current hours per leg hour), linear R2 {m['r2']:.2f}, speed-profile rank corr {m['speed_profile_spearman']}")
json.dump(out, open(os.path.join(RES, "e8_structure_2026.json"), "w"), indent=1)

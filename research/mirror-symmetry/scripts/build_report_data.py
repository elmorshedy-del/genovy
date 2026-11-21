"""Collect the compact numbers and series the HTML report needs into report/report_data.json."""
import os, sys, json, glob
import numpy as np, pandas as pd
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ms import data
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "results"); OUT = os.path.join(ROOT, "report")
os.makedirs(OUT, exist_ok=True)
J = lambda f: json.load(open(os.path.join(RES, f)))
rep = {}

# E1 (clipped) + f2 variance clock
e1 = J("e1_reversibility_clipped.json")
rows = []
for o in e1:
    w = o.get("W12", {})
    if "cal" not in w:
        continue
    rows.append({"t": o["ticker"], "cls": o["class"], "lev": round(o["leverage_tra"], 3), "skew21": round(o["skew_21d"], 2),
                 "dcal": round(w["cal"]["delta"], 3), "zcal": round(w["cal"]["z"], 2),
                 "dvar": round(w["var"]["delta"], 3) if "var" in w else None, "zvar": round(w["var"]["z"], 2) if "var" in w else None,
                 "dvol": round(w["vol"]["delta"], 3) if "vol" in w else None, "zvol": round(w["vol"]["z"], 2) if "vol" in w else None,
                 "n": w["n_up"] + w["n_down"]})
rep["e1"] = rows
rep["e1_f2"] = J("checks_falsification.json")
# E2
e2 = J("e2_speed_memory.json")
rep["e2a"] = [{"t": o["ticker"], "cls": o["class"], "rho": round(o["A_W12"]["mean_rho"], 3), "null": round(o["A_W12"]["null_mean"], 3),
               "z": round(o["A_W12"]["z"], 2)} for o in e2 if "A_W12" in o]
lag = J("e2b_lag_robustness.json")
rep["e2b_lag"] = [{"t": o["ticker"], "cls": o["class"], "z5": round(o["lag5"]["z"], 2), "z60": round(o["lag60"]["z"], 2),
                   "z250": round(o["lag250"]["z"], 2), "b250": o["lag250"]["beta_vap"]} for o in lag]
# E3
e3 = J("e3_barriers.json")
def g(d, side, k="p_reject"):
    return d.get(side, {}).get(k)
rep["e3"] = [{"t": o["ticker"], "cls": o["class"],
              "tops_real": g(o["real"], "tops"), "tops_plac": g(o["placebo"], "tops"), "tops_null": g(o["surrogate"], "tops"),
              "bot_real": g(o["real"], "bottoms"), "bot_plac": g(o["placebo"], "bottoms"), "bot_null": g(o["surrogate"], "bottoms"),
              "n_tops": g(o["real"], "tops", "n"), "n_bot": g(o["real"], "bottoms", "n")} for o in e3]
# model
rep["model"] = J("model_lld.json")
# E5 micro
micro = {}
for f in sorted(glob.glob(os.path.join(RES, "e5_itch_*.json"))):
    d = json.load(open(f))
    key = f"{d['date']}_{d['symbol']}"
    micro[key] = {k: d.get(k) for k in ("date", "symbol", "n_msgs", "n_trades_regular", "volume_regular", "share_hidden", "open_mid",
                                         "close_mid", "high_mid", "low_mid", "median_spread_cents", "buy_share", "flow_price",
                                         "hysteresis", "depth_memory", "order_placement", "dwell_vs_depth", "intraday_crossings",
                                         "queue_imbalance", "depth_imbalance_first_passage")}
rep["micro"] = micro
# E6, E7
e6 = J("e6_spy_2026.json")
rep["e6"] = {k: e6[k] for k in ("band_raw", "may_up", "nov_down", "ratio_nov_over_may_hours_inband", "ratio_nov_over_may_realized_var_inband",
                                 "ratio_nov_over_may_volume_inband_shares", "mirror_rho_may_nov", "hist_corr", "subband_edges",
                                 "dwell_may_hours", "dwell_nov_hours", "hist_bins", "hist_may_hours", "hist_nov_hours",
                                 "hourly_all_pairs_mirror_rho_mean", "surrogate_mirror_rho_mean", "surrogate_mirror_rho_sd",
                                 "may_nov_rho_percentile_vs_surrogate_pairs")}
edges = np.array(e6["vap_edges"]); cen = (edges[:-1] + edges[1:]) / 2
def bands(v, lo=600, hi=780, step=5):
    v = np.array(v); out = []
    for b0 in range(lo, hi, step):
        m = (cen >= b0) & (cen < b0 + step); out.append(round(float(v[m].sum()) / 1e6, 1))
    return out
rep["landscape"] = {"band_lo": list(range(600, 780, 5)), "all_1h": bands(e6["vap_all_to_nov20"]), "daily_2021": bands(e6["vap_daily_2021_on"]),
                    "dec25_feb26": bands(e6["vap_dec25_feb26"]), "jun_oct26": bands(e6["vap_jun_oct"]), "may26": bands(e6["vap_may"]),
                    "nov26": bands(e6["vap_nov"])}
rep["daily_path"] = e6["daily_path"]
rep["e7"] = J("e7_mirror_recovery.json")
# the two clocks: May forward vs Nov reversed (hourly closes inside the band, raw)
h = pd.read_pickle(os.path.join(ROOT, "data", "SPY_1h_raw.pkl")); h.index = h.index.tz_convert("America/New_York").tz_localize(None)
def seg(start, end):
    s = h[(h.index >= start) & (h.index <= end)]
    c = s["Close"].values; r = np.diff(np.log(c), prepend=np.log(c[0]))
    return {"t": [str(i) for i in s.index], "close": [round(float(x), 2) for x in c],
            "hours": list(range(len(c))), "cumvar": np.round(np.cumsum(r ** 2) * 1e4, 3).tolist()}
rep["clock_may"] = seg("2026-05-04 15:30", "2026-05-29 09:30")
rep["clock_nov"] = seg("2026-11-12 15:30", "2026-11-19 14:30")
json.dump(rep, open(os.path.join(OUT, "report_data.json"), "w"), separators=(",", ":"))
print("bytes", os.path.getsize(os.path.join(OUT, "report_data.json")))

"""E7 - Mirror recovery clock: after a down-crossing of a band, how long does the up-crossing (the mirror)
take, in calendar time and in variance time? Empirical distribution for SPY (1993-) and ^GSPC (1928-),
used to make a pre-registered forecast for the band [689.81, 757.12] crossed down on Nov 12-20 2026."""
import os, sys, json
import numpy as np, pandas as pd
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ms import data
from ms.landscape import band_crossings, clipped_durations

RES = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "results")
out = {}
for t in ("SPY", "^GSPC"):
    c = data.load_close(t); r = np.log(c).diff().dropna().values
    sig = pd.Series(r).rolling(252, min_periods=126).std().median()
    x = np.concatenate([[0.0], np.cumsum(r)])
    W = np.log(757.12 / 689.81)                 # same log width as the November decline (~9.3%)
    lo, hi = x.min(), x.max(); a = lo
    pairs = []; never = 0; total_down = 0
    while a + W <= hi:
        cr = band_crossings(x, a, a + W)
        d = clipped_durations(x, cr, a, a + W, r ** 2, np.zeros(len(r)), False)
        for j in range(len(cr)):
            if cr[j, 2] == -1:
                total_down += 1
                if j + 1 < len(cr):
                    pairs.append((d[j, 0], d[j + 1, 0], d[j, 1], d[j + 1, 1], cr[j + 1, 0] - cr[j, 1]))
                else:
                    never += 1
        a += W / 3
    P = np.array(pairs)
    ratio_cal = P[:, 1] / P[:, 0]; ratio_var = P[:, 3] / P[:, 2]
    wait = P[:, 4]
    total_time_to_complete = P[:, 4] + P[:, 1]      # from the end of the decline to the end of the mirror
    out[t] = {"band_log_width": float(W), "band_width_in_daily_sigma": float(W / sig), "n_pairs": int(len(P)),
              "n_down_without_recovery_in_sample": int(never), "n_down": int(total_down),
              "ratio_cal_quantiles_10_25_50_75_90": np.quantile(ratio_cal, [.1, .25, .5, .75, .9]).round(2).tolist(),
              "ratio_var_quantiles_10_25_50_75_90": np.quantile(ratio_var, [.1, .25, .5, .75, .9]).round(2).tolist(),
              "p_ratio_cal_gt_1": float((ratio_cal > 1).mean()), "p_ratio_cal_gt_3": float((ratio_cal > 3).mean()),
              "p_ratio_var_gt_1": float((ratio_var > 1).mean()),
              "trading_days_from_low_to_full_recovery_quantiles_10_25_50_75_90": np.quantile(total_time_to_complete, [.1, .25, .5, .75, .9]).round(0).tolist(),
              "p_recovered_within_20d": float((total_time_to_complete <= 20).mean()),
              "p_recovered_within_60d": float((total_time_to_complete <= 60).mean()),
              "p_recovered_within_250d": float((total_time_to_complete <= 250).mean())}
    print(t, json.dumps(out[t], indent=1))
json.dump(out, open(os.path.join(RES, "e7_mirror_recovery.json"), "w"), indent=1)

# Mirror mechanics: why price action retraces itself

Research code for a liquidity-landscape theory of symmetric ("mirror") price action, tested on
Nasdaq TotalView-ITCH order-level data and 57 assets, and applied to SPY in May vs November 2026.
The write-up with all figures is `report/mirror_mechanics.html` (built from `report/template.html`
plus `report/report_data.json`).

This folder is self-contained and unrelated to the rest of the repository.

## The theory in one paragraph

Model log price as a one-dimensional diffusion in a price-level landscape (drift `b(p)` for
barriers/overhead supply, local speed `sigma(p)` inverse to liquidity) plus path-dependent forces
(leverage, stop cascades, news). Theorem 1: any diffusion whose coefficients depend only on the
price level is reversible with respect to its speed measure, `m(x) p_t(x,y) = m(y) p_t(y,x)`, so the
return leg through a band is statistically the mirror image of the outgoing leg, and up/down
crossing durations are equal in law (constant drift does not break this). Theorem 2: the time spent
near each level during a crossing is proportional to `(y-a)(b-y)/sigma(y)^2` in both directions.
Theorem 3 (Dambis-Dubins-Schwarz): on the realized-variance clock every continuous martingale is
Brownian, so any time asymmetry that vanishes on that clock comes from path-dependent volatility,
and any that survives comes from path-dependent drift. Levels alone can never create asymmetry.

## Headline results

| Test | Result |
|---|---|
| E1 crossing durations, calendar clock (band = 12 daily sd) | Equity indices: declines 2-4.5x faster (log ratio -0.8 to -1.5; 9 of 11 with z below -2 vs sign-randomized null). Treasuries and EUR/USD symmetric (-0.08). VIX reversed (+1.79, z +8.4). Asymmetry tracks the leverage statistic across assets. |
| E1 variance / volume clocks | Gap mostly closes on the variance clock (SPY -1.39 -> +0.40 with distance-weighted clipping); halves on the volume clock. Leverage-only model leaves +0.14, so ~+0.3 is path-dependent drift (choppier declines). |
| E2 volume landscape (causal regression) | Volume traded at a price predicts slower later traversal. With volume >= 250 days old: SPY beta -0.021 (z -4.7); a calibrated no-levels model reproduces about half (-0.0095 +- 0.004). Weak, real-ish, ~5% effect. |
| E2-A dwell-profile mirror | Positive in equity indices (SPY rho 0.20 vs null 0.05), but path dependence alone produces 0.16 in the model: weak evidence. |
| E3 double tops / bottoms | Retests of swing highs reject 44.6% vs 45.5% at placebo levels vs 48.0% null (mean across assets): swing extremes are not special barriers at daily scale. No depletion across 1st/2nd/3rd tests. |
| E5 ITCH, 15 May (6 symbols) + 18 May 2026 (3 symbols) | In 9/9 symbol-days: queue imbalance predicts the next mid move (SPY 15 May P(up) 0.39 -> 0.59); whole-dollar prices carry 2-17x the resting depth; price moves less when net flow returns. Business-time symmetry is day-dependent: volume-time asymmetry ~0 on 15 May, but -0.1 to -0.2 for SPY/QQQ on 18 May (a selloff day). Nasdaq-only flow explains 0-27% of 5-min moves. |
| Model check (`scripts/model_lld.py`) | Static landscape -> perfect mirror (symmetric durations, rho 0.20). Leverage -> calendar asymmetry. Barriers -> rejection above null (real data are below). Only path dependence + landscape matches SPY on all four measures. |
| E6 SPY May vs Nov 2026, band [718.66, 756.48] raw | Nov took 0.28x May's trading hours, 0.68x its realized variance, 0.35x its volume. Speed profiles inside the band did not mirror (rho -0.05). |
| E7 recovery base rates (9.3% band, fast declines) | SPY: median full recovery 24 trading days; 43% within 20 days, 74% within 60; up-leg takes 3.3x the decline. S&P 500 since 1928: 62 days; 30% / 49%; 2.8x. |

## Layout

```
ms/                  library
  data.py            Yahoo downloads + cache (adjusted and dividend-unadjusted)
  nulls.py           sign-randomized / block / iid surrogates
  landscape.py       band crossings, dwell profiles, volume-at-price (numba)
  zigzag.py          swing pivots
  itch_book.py       Nasdaq ITCH 5.0 order-book rebuild (numba)
microstructure/
  itch_filter.c      streams an ITCH .gz and keeps chosen symbols (gcc -O3)
  fetch_itch.sh      downloads sample days from emi.nasdaq.com and filters them
scripts/
  00_download.py     daily + intraday bars
  e1_reversibility.py        crossing durations on three clocks vs null
  e2_speed_memory.py         dwell-profile mirror + causal volume landscape regression
  e2b_lag_robustness.py      landscape effect with 5 / 60 / 250-day lags
  e3_barriers.py             double-top / double-bottom retest test vs placebo and null
  e5_itch_micro.py DATE SYM  order-level tests on one ITCH day
  e6_spy_2026.py             SPY May vs November 2026
  e7_mirror_recovery.py      recovery-time base rates
  model_lld.py               factorial liquidity-landscape diffusion simulation
  checks_falsification.py    stricter variance clock; long-lag effect vs no-landscape model
  build_report_data.py, build_report.py
results/             JSON outputs of every experiment (small, committed)
report/              HTML report, template and data
data/                raw downloads (gitignored)
```

## Reproduce

```
pip install numpy pandas scipy statsmodels matplotlib yfinance numba
python3 scripts/00_download.py
python3 -c "import sys; sys.path.insert(0,'.'); from ms import data; [data.download_daily_raw(t) for t in data.all_daily_tickers() if not t.startswith('^')]"
python3 scripts/e1_reversibility.py          # ~5 min
python3 scripts/e2_speed_memory.py
python3 scripts/e2b_lag_robustness.py
python3 scripts/e3_barriers.py
cd microstructure && gcc -O3 -o itch_filter itch_filter.c && ./fetch_itch.sh && cd ..
python3 scripts/e5_itch_micro.py 2026-05-15 SPY
python3 scripts/e6_spy_2026.py               # needs data/SPY_1h_raw.pkl and data/SPY_1m_30d.pkl
python3 scripts/e7_mirror_recovery.py
python3 scripts/model_lld.py && python3 scripts/checks_falsification.py
python3 scripts/build_report_data.py && python3 scripts/build_report.py
```

Hourly and 1-minute SPY bars come from Yahoo's rolling windows (730 days and 30 days), so re-running
later shifts those windows. Yahoo's 1-minute volume does not reconcile with its daily volume; only
within-day shares are used.

## Limits

Two ITCH days, Nasdaq venue only. No option open-interest data (dealer-gamma levels untested).
Cross-asset samples overlap, so pooled significance is overstated. The no-landscape null model was
calibrated by hand. Research, not investment advice.

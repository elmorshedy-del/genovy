# Kalshi BTC settlement engine

Kalshi settles its BTC hourly (`KXBTCD`) and 15-minute (`KXBTC15M`) markets on
the simple average of 60 one-second CF Benchmarks BRTI prints in the final
minute. Each print that lands fixes 1/60 of the result for good. So once the
minute starts, the engine stops forecasting BTC. It tracks the running
settlement average and works out what the remaining seconds would need to
average to flip the outcome, in dollars and in standard deviations.

## Files

| file | what |
| --- | --- |
| `engine.py` | Pure settlement math (`SettlementWindow`): running sum, required average for the remaining seconds, P(yes) and locked/open status. No I/O. |
| `live.py` | Kalshi websocket client for the `cfbenchmarks_value` BRTI feed. It drives the engine tick by tick and cross-checks against Kalshi's own `last_60s_windowed_average_15min`. Needs a Kalshi API key. |
| `backtest.py` | Replays settled `KXBTC15M` markets and scores the engine against official settlement values and real final-minute trades. |
| `data.py` | Cached fetchers: Kalshi public REST and Binance 1-second klines. |
| `test_engine.py` | Unit tests: window bounds, required average, rounding and strike type, variance formula, and calibration on simulated walks. |

```
pip install requests websockets cryptography
python -m unittest kalshi_btc_settlement.test_engine
python -m kalshi_btc_settlement.backtest --days 7 [--end-days-ago 7]
KALSHI_API_KEY_ID=... KALSHI_PRIVATE_KEY_PATH=key.pem python -m kalshi_btc_settlement.live
```

## The math

With `n` seconds fixed (sum `S`) and `R = 60 - n` remaining, the market is at
the strike `K` when the remaining seconds average `A* = (60K - S) / R`. If BRTI
is a random walk with per-second std `σ`, measured from the last print `P`,
the average of the next `R` prints has std `σ·sqrt((R+1)(2R+1)/(6R))`. So
`z = (A* - P) / that` and `P(yes) = 1 - Φ(z)`. The window is seconds
`close-59 … close` inclusive, following Kalshi's feed docs (`:01 → 1 … :59 →
59, close tick → 60`). `KXBTC15M` rounds the average to cents and uses `≥`;
`KXBTCD` uses `>`.

## What was verified

- Settlement rule. Confirmed from Kalshi's live API: series `product_metadata` and every market's `rules_primary`/`rules_secondary` say "60 RTI prices… the average of these prices".
- BRTI is available through Kalshi's API, on websocket channel `cfbenchmarks_value` (about 1 Hz) and `cfbenchmarks_value_5hz`. The handshake works, and it returns 401 without a key. It was not run live here because no key was available.
- Ground truth. Every settled market carries the official average in `expiration_value`. A 15-minute market's strike is the previous window's official average.

## Backtest results (KXBTC15M, two separate weeks, 665 windows each)

Historical second-by-second BRTI is not public, so the backtest uses Binance
BTCUSDT 1-second klines. They are shifted onto the BRTI level with the
previous window's official value, so no future data is used.

- **Proxy quality.** The rebuilt average lands within $3.3–3.8 (median) of
  the official value, with p99 around $16. It picks the right side in 98–99%
  of windows. The engine adds this as `value_noise` in quadrature. On the
  real feed that term would be ~0.
- **Engine accuracy.** Locked calls (≥4σ, noise-adjusted) were **0 wrong out
  of ~550 per week**. From the 10th second onward, about 65–83% of windows
  are locked. Brier score drops from ~0.03 at T-60s to ~0.01 near close.
  Every wrong call in the raw, noise-free run came from a window where the
  proxy itself was on the wrong side of the strike.
- **Most markets are decided before the final minute.** At T-60s, price is
  a median ~$66 from the strike against ~$2.7/s of volatility. Taking the
  side the price is on already wins ~95%.
- **Against real Kalshi trades** (about 1.25M prints in final minutes per week).
  P&L is for buying the side the engine favors at the printed price, after
  the taker fee. Each market counts once, with bootstrap 95% CIs:

| engine confidence | week of Sep 25–Oct 2 | week of Sep 18–25 |
| --- | --- | --- |
| 0.50–0.70 | +11.2¢ [+4.4, +17.9] | +3.8¢ [−3.7, +11.4] |
| 0.70–0.90 | +1.9¢ [−3.1, +6.7] | +10.4¢ [+6.8, +14.1] |
| 0.90–0.97 | +2.3¢ [−1.3, +5.4] | +5.5¢ [+3.4, +7.7] |
| 0.97–0.99 | −0.3¢ [−3.3, +2.3] | +2.2¢ [−0.8, +4.6] |
| 0.99–0.999 | −0.9¢ [−3.3, +1.1] | +2.4¢ [+1.8, +3.2] |
| ≥ 0.999 (locked) | +0.16¢ [+0.01, +0.26] | +0.31¢ [+0.24, +0.39] |

Reading this:

- The locked outcomes are real, but the market mostly prices them already.
  Prints run at ~99.1–99.3¢, which leaves a fraction of a cent.
- The edge, where there is one, is in contested windows (engine 50–97%).
  Positive bands don't repeat consistently across the two weeks.
- Making the proxy 2–5 s staler did not remove the contested-window edge,
  so it is not simply Binance leading BRTI by a second.

Caveats: these fills are optimistic. A print proves a price existed, not
that size was left for us. Latency is ignored, the data covers only two
weeks, and the proxy is not BRTI. The next step is to run `live.py` on the
real feed alongside the order book (`orderbook_delta`) for a few days and
log what the engine would have paid.

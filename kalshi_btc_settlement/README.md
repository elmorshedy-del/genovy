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
| `study.py` | Who wins the final minute: fillable edge vs engine latency, taker P&L, market flips, engine-vs-market convergence. |
| `data.py` | Cached fetchers: Kalshi public REST and Binance 1-second klines. |
| `test_engine.py` | Unit tests: window bounds, required average, rounding and strike type, variance formula, and calibration on simulated walks. |

```
pip install requests websockets cryptography
python -m unittest kalshi_btc_settlement.test_engine
python -m kalshi_btc_settlement.backtest --days 7 [--end-days-ago 7]
python -m kalshi_btc_settlement.study --weeks 3
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

## Study 2: who wins the final minute (`study.py`, 3 weeks, 1,995 windows)

Kalshi's trade tape has no account IDs, so individual profitable traders
can't be followed. Every print does record the taker side, which shows
which resting liquidity existed at that price. CIs below are bootstrap 95%
intervals, with each market counted once.

| | Sep 25–Oct 2 | Sep 18–25 | Sep 11–18 |
| --- | --- | --- | --- |
| **Fillable engine edge** (only prints where a taker bought the engine's side), 0 s latency | +0.9¢ [−0.9, +2.8] | +3.2¢ [+1.5, +4.9] | +0.6¢ [−1.6, +2.8] |
| same, 5 s latency | +0.3¢ [−1.4, +2.1] | +1.9¢ [+0.5, +3.4] | −0.6¢ [−2.4, +1.2] |
| **All final-minute takers**, P&L per contract | −0.25¢ [−0.31, −0.19] | −0.27¢ [−0.34, −0.21] | −0.35¢ [−0.44, −0.26] |
| Takers the engine **disagreed** with | −1.8¢ [−3.6, +0.1] | −3.9¢ [−5.3, −2.5] | −1.8¢ [−3.5, −0.1] |
| Takers the engine agreed with | +0.8¢ [−1.0, +2.6] | +2.9¢ [+1.2, +4.6] | +0.5¢ [−1.6, +2.6] |
| Market favourite (≥80¢) that lost | 17 windows | 14 | 30 |
| …of which the engine already favoured the winner | 4 | 6 | 0 |
| Engine favourite (≥80%) that lost | 20 | 15 | 46 |
| Engine reaches 97% before market (median lead) | +1 s | +1 s | +5 s |
| Market reached 97%, engine never did | 55 | 43 | 67 |

Findings:

1. **Takers lose in every 10-second bucket of every week, so the money in
   the final minute goes to makers.** The consistently profitable "trader"
   is whoever provides liquidity.
2. **Sniping with the engine (as a taker) is not consistently profitable.**
   It worked in one week out of three. Stale data costs about 0.1¢ per
   second.
3. **The engine is good at spotting losing taker flow.** Takers it disagreed
   with lost money in all three weeks. That is the signal a market maker
   needs: quote tighter or larger where the engine says incoming takers are
   wrong, and pull or skew quotes where it says they are right.
4. **On flips, the market beats the proxy-driven engine.** It reaches 97%
   first about 40% of the time and is fooled less often. Flips happen right
   at the strike, where the proxy's ~$5 error is decisive. Market
   participants are watching the real BRTI, so they know more than this
   engine does.

**Next test.** Record the real BRTI (5 Hz), `orderbook_delta` and trades
through `live.py` for a week, then rerun these studies on real BRTI. Then
simulate an engine-skewed maker strategy with queue position from the
order book. That needs a Kalshi API key.

## Study 3: Polymarket wallets (`polymarket.py`, `analysis/`)

Polymarket's BTC 15-minute up/down markets have settled on a 60-second
Chainlink BTC/USD TWAP at both ends since 7 Aug 2026, so the engine applies
unchanged. Its public trade tape names the wallet on both sides of every
fill. Data: 1,343 markets (Sep 18 – Oct 2), about 3.4M fills and about 6,400
wallets. Checks:

- Gross P&L sums to ~$0 per market.
- The final price of one market equals the next market's price to beat exactly.
- The TWAP window is the 60 s before each boundary: the proxy reproduces the published TWAP change to a $2.5 median.
- Market prices move about 2 s after Binance.

Findings:

1. **Fees take the pot.** Takers win before fees but pay about $213k a
   week. Makers lose before fees in aggregate, even counting their 20% fee
   rebate.
2. **One week's top wallets mostly don't repeat.** The biggest directional
   winners (Sardonic-Mink, Pricey-Standard, Acrobatic-Lifetime) called
   direction 61–80% of the time in their selection week. In the prior,
   unseen week it was 49–62%, with small or negative P&L. Most of that was
   luck.
3. **Top wallets as a group do persist.** Of the top 50 picked on one week,
   38/47 and 40/46 were profitable in the other week, against 40–52% of
   comparable wallets. Together they made $65k–$116k in the week they
   weren't picked on. Three types:
   - market makers that hedge (net/gross position about 0.5) and earn 4–5% on volume;
   - "lock" buyers taking 0.99 in the last few minutes, who win every time for about 1% a week;
   - mid-window directional takers with 13–38% ROI, profitable in both weeks.
4. **The directional takers buy after the price has moved against their side.**
   Their side's engine probability had dropped 9–27 points over the previous
   5 minutes. Across the whole market, the side that just fell wins 2–5 points
   more often than the random-walk engine predicts, in both weeks.
5. **Simply fading moves loses money.** After a ≥10–25 point move, buying
   the fallen side at the market price lost 3–8¢ per contract in both weeks.
   The market already prices in more than the reversion. Whatever the
   persistent takers do, it is more selective than that.
6. **Data caveat.** Spot BTC is thin in this period (about 1 BTC/min on
   Binance and Coinbase), and venues disagree by $20–40. A five-venue
   median (`prices.py`) tracks Chainlink only slightly better than Binance
   alone ($2.2 vs $2.5 median).

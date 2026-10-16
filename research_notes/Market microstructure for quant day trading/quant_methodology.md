# Quantitative Trading Research Methodology and Strategy Families (Intraday Focus, as of October 2026)

Scope note: These notes cover how professional quants go from idea to live strategy without fooling themselves. The emphasis is on intraday and short-horizon trading of US equities, ETFs and index futures by a small participant who is not colocated. Items under "Cited Findings" come from sources retrieved in this session. Items under "Inferences" are my own reasoning, worked arithmetic, or standard textbook background that I did not re-verify against a primary source this session. Where an inference rests on recalled background rather than a fetched source, it says so.

---

## 1. Strategy taxonomy: which families are viable intraday for a small, non-colocated participant, and which need HFT infrastructure?

### Takeaway
Latency arbitrage and passive market making in liquid US names are speed and queue-priority games. They are decided in microseconds and dominated by a handful of firms, so a non-colocated retail or small participant cannot realistically compete in them. What is viable is slower intraday work: intraday momentum and seasonality in index ETFs and futures, intraday mean reversion and stat-arb at holding periods of minutes to hours, and event-driven trades. These are only viable when the per-trade edge clearly exceeds a realistically modeled cost. Published anomalies decay, so every family should be treated as having a half-life.

### Cited Findings
- **Latency arbitrage is an HFT-only game.** Aquilina, Budish and O'Neill (QJE 2022) used London Stock Exchange message data. About 22% of FTSE 100 trading volume and 21% of trades occur in "races". The modal race lasts 5 to 10 millionths of a second, races happen about once per minute per symbol, and the top six firms account for over 80% of race wins and losses — [Harvard Law forum summary](https://corpgov.law.harvard.edu/2021/11/05/quantifying-the-high-frequency-trading-arms-race); [FCA Occasional Paper 50](https://www.fca.org.uk/publications/occasional-papers/occasional-paper-no-50-quantifying-high-frequency-trading-arms-race-new-methodology)
- The same study finds that eliminating latency-arbitrage races would cut the cost of liquidity by 17%. It puts the "latency arbitrage tax" at roughly 0.5 bp of trading volume, about $5bn a year across global equity markets — [FCA](https://www.fca.org.uk/publications/occasional-papers/occasional-paper-no-50-quantifying-high-frequency-trading-arms-race-new-methodology); [NBER w29011](https://www.nber.org/system/files/working_papers/w29011/w29011.pdf)
- **Market making depends on queue position and latency.** Backtesting tools built for market making, such as hftbacktest, explicitly model feed latency, order latency and queue position. Their built-in queue models use power-law fill probabilities, with exponents of 2 and 3 making fills harder deep in the queue. This shows that the profit and loss of passive limit-order strategies hinges on where you sit in the queue — [hftbacktest docs](https://hftbacktest.readthedocs.io/); [Quickstart](https://www.mintlify.com/nkaz001/hftbacktest/quickstart)
- **Intraday time-series momentum in index ETFs.** Gao, Han, Li and Zhou ("Market Intraday Momentum", JFE 2018) used SPY data from 1993 to 2013. The return from the prior close through the first half-hour predicts the last half-hour return. The effect is stronger on volatile, high-volume, recession and macro-news days, and it appears in ten other heavily traded ETFs. They attribute it to infrequent rebalancing (Bogousslavsky 2016) and late-informed trading — [Alpha Architect summary](https://alphaarchitect.com/2014/08/attention-prop-traders-the-first-half-hour-of-trading-predicts-the-last-half-hour/); [WUSTL record](https://profiles.wustl.edu/en/publications/market-intraday-momentum/)
- The effect size is small. An early draft reports an in-sample R² of about 0.02 for SPY — [working paper PDF](https://c.mql5.com/forextsd/forum/173/intraday_momentum_-_the_first_half-hour_return_predicts_the_last_half-hour_return.pdf). QuantConnect publishes a re-implementation as a strategy — [QuantConnect](https://www.quantconnect.com/learning/articles/investment-strategy-library/intraday-etf-momentum)
- **Pairs trading and stat-arb, at daily horizons.** Gatev, Goetzmann and Rouwenhorst used daily data from 1962 to 2002. Self-financing portfolios of pairs earned up to 11% annualized excess return, robust to conservative cost estimates. Raw profitability declined in the post-1988 subsample — [Alpha Architect](https://alphaarchitect.com/2013/06/pairs-trading-kicks-butt/); [NBER w7032](https://nber.org/papers/w7032); [CXO Advisory](https://www.cxoadvisory.com/technical-trading/classic-paper-matched-pairs-trading/)
- **Anomalies decay after publication.** McLean and Pontiff (JF 2016) studied 97 cross-sectional predictors. Portfolio returns were 26% lower out-of-sample but before publication, which they read as an upper bound on data mining, and 58% lower after publication. The difference of about 32% is attributed to investors trading on what was published — [McLean & Pontiff PDF](https://Www.Gwern.net/doc/economics/2016-mclean.pdf); [Ivey PDF](https://ivey.uwo.ca/media/3775549/pontiff.pdf)
- **Cross-sectional factors.** In ML studies of monthly stock returns, the strongest predictors are price trends (short-term reversal, stock and industry momentum), liquidity (market value, dollar volume, bid-ask spread) and volatility (return volatility, idiosyncratic volatility). These are the same raw ingredients intraday traders work with — [Gu, Kelly & Xiu, NBER w25398](https://www.nber.org/papers/w25398.pdf)

### Inferences
- **Viability ranking for a small, non-colocated participant** (my synthesis):
  - **Not viable:**
    - Latency arbitrage, including cross-venue and ETF-versus-futures lead-lag at sub-millisecond scale.
    - Passive market making in large-cap US stocks and ES/NQ futures. Queue priority goes to the fastest participants, and you are adversely selected by them.
  - **Marginal:**
    - Passive liquidity provision in wider-spread, less-contested names, where queue priority is cheaper. It needs a realistic queue and fill simulator such as hftbacktest or NautilusTrader with L2/L3 data.
    - Short-horizon order-book imbalance signals, whose alpha decays within seconds.
  - **Viable, if costs are modeled honestly:**
    - Intraday momentum and seasonality in index ETFs and futures (Gao et al.).
    - Opening-range and overnight-gap behavior.
    - Intraday mean reversion and pairs/stat-arb with holding periods of minutes to hours, for example ETF-versus-components or sector ETFs.
    - Event-driven trades around scheduled macro releases and earnings, at horizons where a few hundred milliseconds of latency does not matter.
    - Volatility-regime-conditioned trend or mean reversion on futures.
- **Volatility trading and dispersion** (index volatility versus single-name volatility) is mostly a days-to-weeks options strategy. Its intraday use for small players is mainly delta-hedging and volatility-regime filters. I found no source this session that quantifies its intraday viability.
- **Cross-sectional factors** such as value, quality and 12-month momentum are low-turnover strategies. At intraday horizons they are useful mainly as conditioning variables, for example trading only names in a particular momentum decile. The cross-sectional ingredient that transfers to short horizons is short-term reversal.
- **Time-series momentum / trend following** (Moskowitz, Ooi & Pedersen 2012 is the canonical daily-to-monthly reference) works mainly at daily-plus horizons in diversified futures. Its intraday analogue is the Gao et al. market intraday momentum effect. This is background; the 2012 paper was not fetched this session.
- The R² of 0.02 for the strongest well-known intraday ETF predictor is a useful anchor. A legitimate intraday signal explains a few percent of variance at most. Anything that backtests with much higher explanatory power at intraday horizons should be presumed to contain a bug or look-ahead.

### Gaps
- I found no sourced, quantitative 2025–2026 estimates of how much of the Gao et al. intraday momentum effect survives out-of-sample after 2013 and after costs. This should be verified directly, for example through follow-up replications.
- I did not retrieve sources on the current state of US retail-accessible event-driven strategies, such as news-latency competition, or on intraday dispersion trading.
- I did not retrieve Do and Faff's work on whether pairs trading survives costs after 2002, nor any intraday pairs-trading evidence.

---

## 2. Research workflow: hypothesis-first vs data-mining; intraday feature engineering; alternative bar types; stationarity and fractional differencing

### Takeaway
Professionals start with an economic hypothesis: who is on the other side of the trade, and why do they pay you? They then test it on data that has been sampled and transformed to be as close to IID and stationary as possible while keeping its memory. Activity-based bars (tick, volume, dollar) have better statistical properties than time bars. Several independent sources caution that this does not automatically make a strategy better. The goal of fractional differencing is the minimum differencing order that achieves stationarity.

### Cited Findings
- **Why hypothesis-first matters.** Harvey, Liu and Zhu catalogued 316 published factors. Accounting for the data mining across the whole literature, they argue that most claimed findings in financial economics are likely false and that new factors need a t-ratio above 3.0 — [NBER w20592](https://www.nber.org/papers/w20592); [SSRN](https://papers.ssrn.com/abstract=2513152)
- A hypothesis-driven, walk-forward framework for microstructure signals has been proposed explicitly as a remedy for over-optimistic ML backtests in this area — [arXiv 2512.12924](https://arxiv.org/pdf/2512.12924)
- **Bar types.** In an Alpaca tutorial's empirical comparison, dollar-bar returns are closest to normal, followed by tick and volume bars. Alternative bars show only a "partial recovery to normality" relative to time bars — [Alpaca Learn](https://alpaca.markets/learn/alternative-bars-02)
- The idea goes back to Clark (1973) on subordinated processes: price changes look closer to normal when measured per unit of volume rather than per unit of clock time. López de Prado's AFML (2018) re-popularized tick, volume and dollar bars — [LuxAlgo overview](https://www.luxalgo.com/library/concept/alternative-bar-types.md)
- A sizing heuristic attributed to the "Volume Clock" paper sets the dollar-bar threshold at about 1/50 of average daily dollar value. That works out to about 50 bars per day — [mlfinpy docs](https://mlfinpy.readthedocs.io/en/latest/FinancialDataStructure.html)
- **Caution.** An MQL5 study on EURUSD confirms that the improved statistical properties are real. It also finds that they do not carry through to better trend or mean-reversion strategy efficacy in the way retail users assume — [MQL5 article](https://www.mql5.com/en/articles/23310)
- **Fractional differencing.** AFML's workflow recommends choosing the minimum fractional-differencing order d that passes a stationarity test while keeping as much correlation with the original price level (memory) as possible — [AFML skill summary](https://skillsmp.com/creators/nutdnuy/afml-book-skill/github-skills-lopez-de-prado-financial-ml)
- **What actually predicts.** In large-scale ML return prediction, the dominant features are recent price trends and reversals, liquidity (dollar volume, spread, size) and volatility — [GKX NBER w25398](https://www.nber.org/papers/w25398.pdf)

### Inferences
- **Hypothesis-first checklist** (synthesis):
  1. State the economic mechanism: risk premium, behavioral bias, or structural flow such as index rebalancing, end-of-day pension or ETF flows, or option-hedging flows.
  2. Pre-register the test, including the universe, sample period, signal definition and success metric, before looking at results.
  3. Count every variant tried. The count is needed for the deflated Sharpe ratio (Section 5).
  4. Keep a final, untouched holdout, usually the most recent 6 to 12 months, to look at once.
  5. Paper-trade or trade very small size before scaling.
- **Intraday feature families** (standard practice; see also the separate microstructure notes in this folder):
  - Log returns at multiple lookbacks, for example 1, 5, 15 and 60 minutes and the overnight gap. Scale them by recent realized volatility so features are comparable across regimes.
  - Realized volatility, high-low range estimators (Parkinson, Garman-Klass) and a volatility-of-volatility proxy.
  - Volume and volatility normalized by time-of-day. Intraday volume and volatility follow a U-shape, so divide by the historical average for that minute of the day. Without this, a model "learns" the open and close rather than a signal.
  - Distance to VWAP, opening-range high and low, and prior-day levels.
  - Order-book features: top-of-book imbalance (bid size minus ask size over their sum), order-flow imbalance (Cont, Kukanov & Stoikov 2014, not fetched), microprice, spread in ticks, trade-sign imbalance.
  - Cross-asset lead-lag at the minute scale: ES leading SPY constituents, sector ETF versus its stocks.
  - Calendar and event flags: FOMC, CPI, NFP, earnings, options expiration, index rebalance days.
- **Practical bar guidance:** use dollar bars or volume bars for single-instrument ML datasets, because they partially equalize the information per sample. Keep clock-time bars, or event-time snapshots aligned across assets, for multi-asset cross-sectional work where synchronization matters.
- **Fractional differencing, recalled background:** AFML Chapter 5 reports that for E-mini S&P 500 log prices a d of roughly 0.3 to 0.4 already passes the ADF test while keeping very high correlation with the original series. Integer differencing (d=1, i.e., returns) discards that memory. This is recalled and not re-verified, so check the exact values.
- At intraday horizons, most predictive features are already near-stationary (returns, imbalances, normalized volume). Fractional differencing matters mainly when you want to use price levels or spreads (for example, pairs residuals) as features.

### Gaps
- I did not fetch AFML Chapter 2 (bars) or Chapter 5 (fractional differencing) directly, so the exact numeric results (d*, ADF statistics, correlation values) are unverified.
- I did not find a rigorous, peer-reviewed comparison of strategy out-of-sample performance using time bars versus dollar bars on US equity or futures data. The evidence found covers statistical properties, plus one negative strategy-level check on FX.

---

## 3. Labeling: fixed-horizon vs triple-barrier and meta-labeling; sample weights for overlapping labels

### Takeaway
Fixed-horizon labels, such as the sign of the return over the next h bars, ignore the path the price takes and the volatility regime. The triple-barrier method labels each event by which barrier the price touches first: a profit-take barrier, a stop-loss barrier (both scaled to volatility), or a time limit. This mirrors how a real trade exits. Meta-labeling separates two decisions. A primary model or rule decides the side, and a secondary model predicts whether to take the trade and how large to make it. Because labels overlap in time, samples are not independent, and they should be weighted by "average uniqueness".

### Cited Findings
- AFML's labeling stack has three parts: path-dependent triple-barrier labels, meta-labels for a secondary bet-sizing model, and overlap-aware sample weights — [fynance docs](https://fynance.readthedocs.io/en/latest/features.labels.html)
- **Average-uniqueness weights (AFML Chapter 4).** At each bar, a label's uniqueness is 1 divided by the number of labels active at that bar. A label's weight is its average uniqueness over its own [t_in, t_out] span, rescaled so the weights sum to n. Disjoint labels get weight 1, and heavier overlap lowers the weight — [fynance uniqueness_weights](https://fynance.readthedocs.io/en/master/generated/fynance.features.labels.uniqueness_weights.html)
- AFML recommends three things: event-specific triple barriers for path-dependent outcomes, separating side from size via meta-labeling, and uniqueness-based weights or a sequential bootstrap when bagging would otherwise resample redundant overlapping observations — [AFML skill summary](https://skillsmp.com/creators/nutdnuy/afml-book-skill/github-skills-lopez-de-prado-financial-ml)
- A university master's thesis applying the AFML pipeline is available as a worked example — [LMU thesis](https://epub.ub.uni-muenchen.de/69183/1/MA_BergerThomas.pdf)

### Inferences
- **Triple-barrier construction** (standard AFML recipe; book not re-read this session):
  1. Detect events, for example with a CUSUM filter on returns, or use every bar.
  2. Set the barriers at entry time t0, using an ex-ante volatility estimate σ_t0 such as an EWMA of returns:
     - upper barrier = P_t0 · (1 + pt · σ_t0)
     - lower barrier = P_t0 · (1 − sl · σ_t0)
     - vertical barrier = t0 + H
  3. Label the event +1 or −1 by whichever horizontal barrier is touched first. If the vertical barrier is hit first, label it 0, or use the sign of the return at that point.
  4. The label's end time t1 is needed later for purging (Section 5).
- **Meta-labeling in practice for intraday work:**
  1. Start with a simple, interpretable primary rule, for example "go long when the first-half-hour return is above zero" (Gao et al.) or an opening-range breakout. Tune it for high recall.
  2. Train a classifier, typically gradient boosting, on features at the time of the signal. It predicts whether the primary trade hits its profit-take before its stop.
  3. Use the predicted probability to filter trades and size positions. One AFML approach maps probability to size through a z-statistic and the normal CDF.
  4. This improves precision and gives an interpretable decomposition: the economic hypothesis sits in the primary rule, and the ML only decides when to trust it.
- **Overlap is severe intraday.** If a new label starts every minute and each label lasts 30 minutes, every bar is covered by about 30 labels. The effective sample size is then about 1/30 of the row count. Ignoring this overstates t-stats by roughly √30 ≈ 5.5×, and it makes random-forest bootstraps nearly identical.
- **Barrier width relative to costs:** profit-take and stop barriers that are only a few ticks wide produce labels dominated by bid-ask bounce and execution cost. Set the barriers at multiples of the round-trip cost, not just of volatility.

### Gaps
- I did not retrieve published empirical evidence quantifying how much meta-labeling improves out-of-sample Sharpe on US intraday data. The claims I found are methodological, not empirical.

---

## 4. Machine learning: gradient boosting vs deep learning vs linear models; GKX (2020); "virtue of complexity"; reinforcement learning; signal-to-noise

### Takeaway
Financial prediction has a tiny signal-to-noise ratio. Even the best ML models in Gu, Kelly and Xiu's landmark study explain only about 0.3–0.4% of monthly stock-return variance out of sample. Even so, nonlinear models (trees and neural nets) beat linear ones, mainly by capturing interactions between predictors, and small R² can translate into large Sharpe ratios. Kelly, Malamud and Zhou argue that heavily over-parameterized models can still improve out-of-sample prediction, but that claim is contested. For noisy tabular intraday features, gradient boosting with strong regularization is the pragmatic default. Reinforcement learning has credible results in execution, a narrow and well-defined problem with a clear benchmark. It is far less credible for alpha generation, where overfitting to a finite set of historical paths is a documented barrier to deployment.

### Cited Findings
- **GKX (RFS 2020), monthly out-of-sample R², all stocks:**
  - OLS with all predictors: −3.46%
  - OLS-3 (size, book-to-market, momentum): 0.16%
  - Elastic net: 0.11%
  - PCR: 0.26%; PLS: 0.27%
  - Generalized linear model: 0.19%
  - Random forest: 0.33%; boosted trees: 0.34%
  - Neural nets NN1–NN5: 0.33%, 0.39%, 0.40%, 0.39%, 0.36% (NN3 peaks at 0.40%)
  - Among the top 1,000 stocks by size, NN3 reaches 0.70%
  - Source: [GKX, NBER w25398, Table 1](https://www.nber.org/papers/w25398.pdf)
- **Economic value of a small R².** Timing the S&P 500 with NN forecasts raises the Sharpe ratio to 0.77, versus 0.51 for buy-and-hold. An NN4 long-short decile spread earns an annualized out-of-sample Sharpe of 1.35 value-weighted and 2.45 equal-weighted. The OLS-3 benchmark earns 0.61 and 0.83 — [GKX NBER w25398](https://www.nber.org/papers/w25398.pdf). The NBER working-paper figures may differ slightly from the published RFS 33 (2020) 2223–2273 version — [SSRN](https://papers.ssrn.com/abstract=3159577)
- GKX attribute the gains of nonlinear models to interactions among predictors. A generalized linear model with per-predictor splines but no interactions fails to beat linear models. The authors repeatedly stress the "tiny" and "notoriously low" signal-to-noise ratio of return prediction — [GKX NBER w25398](https://www.nber.org/papers/w25398.pdf)
- **Virtue of complexity.** Kelly, Malamud and Zhou (JF 2024, 79(1):459–503) show theoretically that simple models severely understate return predictability compared with "complex" models whose parameter count exceeds the number of observations. Empirically, they report large out-of-sample market-timing gains, driven largely by the models' ability to predict recessions — [SFI](https://www.sfi.ch/en/publications/the-virtue-of-complexity-in-return-prediction); [NBER w30217](https://nber.org/papers/w30217); [CEPR DP17194](https://repec.cepr.org/repec/cpr/ceprdp/DP17194.pdf). A companion paper extends the claim across asset classes — [SFI "Virtue of Complexity Everywhere"](https://www.sfi.ch/en/publications/n-22-57-the-virtue-of-complexity-everywhere)
- **RL for execution, a credible success.** Nevmyvaka, Feng and Kearns (ICML 2006) were the first large-scale empirical application of RL to optimized trade execution. They used 1.5 years of millisecond-level NASDAQ limit-order data — [Kearns page](https://www.cis.upenn.edu/~mkearns/papers/rlexec); [UT Austin abstract](https://www.cs.utexas.edu/~shivaram/readings/b2hd-NevmyvakaFK2006.html)
- Schnaubelt, using 18 months of high-frequency data, finds that PPO reliably learns better order-placement strategies than deep double Q-networks and other baselines — [FAU working paper](https://www.iwf.rw.fau.de/files/2020/04/05_2020.pdf)
- **RL's main failure mode.** Zhang et al. (IJCAI 2023) report that many RL execution methods "exhibit considerable overfitting which prevents them from real deployment". The cause is that simulators replay a finite set of historical context sequences, which agents memorize — [arXiv 2307.11685](https://arxiv.org/pdf/2307.11685); [IJCAI](https://ijcai.org/proceedings/2023/553)

### Inferences
- **Model choice for intraday tabular data** (synthesis):
  1. Start with regularized linear or logistic models, which are good for diagnosing whether any signal exists.
  2. Move to gradient-boosted trees (LightGBM, XGBoost, CatBoost) with shallow trees, strong subsampling, monotonic constraints where theory supports them, and early stopping on purged validation folds.
  3. Consider deep learning (LSTM, CNN or transformers on raw limit-order-book data) only with very large tick-level datasets and strict validation. The GKX ranking (trees ≈ NNs > penalized linear > OLS) was obtained with about 30,000 stocks over 60 years.
- **Translating R² into Sharpe.** For a single market-timing asset, the Campbell–Thompson logic applied in GKX gives approximately SR* = √((SR² + R²) / (1 − R²)), where SR is buy-and-hold and SR* is the timer. So a 0.4% R² compounded over many independent bets is valuable. This also means a well-specified intraday model should have a tiny R²; an intraday R² of 5% or more is a red flag for leakage.
- **On "virtue of complexity":** its gains appear in low-frequency market timing, with monthly data and recession prediction. They do not transfer automatically to intraday trading, where costs, non-stationarity and regime shifts dominate. For a small trader, complexity raises the variant-count N in the deflated Sharpe ratio, and it makes failures harder to diagnose.
- **RL for alpha** (end-to-end "learn to trade" agents) is where most published successes fail to replicate. Simulators replay historical paths without market impact or adverse selection, so the agent cannot change prices and fills are optimistic. Rewards are noisy, and the hyperparameter search is huge, which inflates N. The realistic uses of RL for a small intraday trader are execution scheduling and order placement, benchmarked against TWAP/VWAP or Almgren-Chriss.

### Gaps
- I did not retrieve published critiques of "virtue of complexity". I recall rebuttal papers arguing that the gains reduce to simpler volatility-timing or momentum-like behavior (for example, work by Stefan Nagel, around 2025), but I did not verify this in this session.
- I did not find a recent comprehensive survey quantifying deep RL trading results after costs. There are also no sources here on transformer or LLM-based limit-order-book models in 2025–2026.

---

## 5. Validation and overfitting: walk-forward, purged/embargoed k-fold, CPCV; PBO; deflated Sharpe ratio; Harvey-Liu-Zhu; minimum backtest length; McLean-Pontiff

### Takeaway
A single backtest Sharpe ratio means nothing without knowing how many variants were tried, how long the sample was, and how non-normal the returns are. Professionals use cross-validation with purging and embargoes (or combinatorial purged CV) to get a distribution of out-of-sample results. They estimate the probability of backtest overfitting (PBO), and they deflate the selected Sharpe ratio for the number of trials. A reasonable hurdle for a "new discovery" is a t-stat above 3, not 2. Even genuine anomalies lose about half their return after publication.

### Cited Findings
- **Expected maximum Sharpe ratio under the null** (Bailey & López de Prado, JPM 2014). Across N independent trials whose Sharpe estimates have variance V, the expected maximum Sharpe when the true Sharpe is zero is approximately:
  SR₀ = √V · [(1 − γ)·Z⁻¹(1 − 1/N) + γ·Z⁻¹(1 − 1/(N·e))]
  Here γ ≈ 0.5772 is the Euler–Mascheroni constant, Z⁻¹ is the standard normal quantile function, and e is Euler's number. Appendix 3 of the paper shows how to estimate an effective N when trials are correlated — [Bailey & López de Prado, "The Deflated Sharpe Ratio"](https://www.davidhbailey.com/dhbpapers/deflated-sharpe.pdf)
- **Deflated Sharpe ratio (DSR).** DSR is a Probabilistic Sharpe Ratio (PSR) whose rejection threshold is SR₀:
  DSR = Z[ (SR̂ − SR₀)·√(T − 1) / √(1 − γ̂₃·SR̂ + ((γ̂₄ − 1)/4)·SR̂²) ]
  SR̂ is non-annualized, T is the number of return observations, γ̂₃ is skewness and γ̂₄ is (non-excess) kurtosis. DSR deflates using five extra inputs: skewness, kurtosis, T, the variance of the tested Sharpe ratios, and N — [DSR paper](https://www.davidhbailey.com/dhbpapers/deflated-sharpe.pdf); see also [LuxAlgo](https://www.luxalgo.com/library/concept/deflated-sharpe-ratio.md)
- **The paper's worked example.**
  - Inputs: annualized SR̂ = 2.5 from 5 years of daily data (T = 1250), the best of N = 100 trials, variance of annualized trial Sharpes V = 0.5, skewness −3, kurtosis 10.
  - Result: SR₀ ≈ 0.1132 per day and DSR ≈ 0.90. That is below 95% confidence, so the investor declines.
  - With N = 46 trials, DSR would be 0.9505. With normal returns, DSR would reach 0.95 only after N = 88 trials.
  - I reproduced SR₀ = 0.11317 and DSR = 0.9004 numerically from these formulas — [DSR paper](https://www.davidhbailey.com/dhbpapers/deflated-sharpe.pdf)
- DSR is complementary to Harvey and Liu's (2014) Benjamini-Hochberg-style multiple-testing thresholds. The authors suggest computing it against both thresholds — [DSR paper](https://www.davidhbailey.com/dhbpapers/deflated-sharpe.pdf)
- **PBO and CSCV.** Bailey, Borwein, López de Prado and Zhu (Journal of Computational Finance 20(4), 2017) propose a model-free, nonparametric estimate of the probability of backtest overfitting via "combinatorially symmetric cross-validation" (CSCV). Overfitting probability rises with the number of configurations tried — [SSRN](https://papers.ssrn.com/abstract=2326253); [eScholarship PDF](https://escholarship.org/content/qt4w1110bb/qt4w1110bb.pdf); [Risk.net](https://www.risk.net/journal-of-computational-finance/2471206/the-probability-of-backtest-overfitting)
- The same research line derives a minimum backtest length as a function of the number of configurations tried — [CXO Advisory summary](https://www.cxoadvisory.com/big-ideas/insidiousness-of-overfitting-investment-strategies-via-iterative-backtests)
- **Harvey, Liu & Zhu (RFS 2016, 29:5–68).** Across 316 factors, a new factor should clear a t-ratio of 3.0 (p < 0.0027) rather than 2.0 — [NBER w20592](https://www.nber.org/papers/w20592); [SSRN](https://papers.ssrn.com/abstract=2513152). Counterpoint: a 2022 arXiv paper argues that most claimed cross-sectional predictability findings are likely true — [arXiv 2206.15365](https://arxiv.org/pdf/2206.15365)
- **Purged CV and CPCV.**
  - Conventional k-fold CV and single-path walk-forward give over-optimistic estimates because information leaks through overlapping labels.
  - Purging drops training observations whose label windows overlap the test period.
  - An embargo also drops a buffer of observations right after each test fold.
  - CPCV applies purging and embargo across all combinations of train/test groups. This produces many backtest paths and a distribution of performance rather than a single number.
  - Sources: [LuxAlgo purged CV](https://www.luxalgo.com/library/concept/purged-cross-validation.md); [Towards AI on CPCV](https://pub.towardsai.net/the-combinatorial-purged-cross-validation-method-363eb378a9c5)
- Arian et al. (2024), as cited in a 2025 arXiv paper, compare validation schemes. They find CPCV is superior at reducing overfitting risk, while walk-forward remains the industry standard for realistic trading simulation — [arXiv 2512.12924](https://arxiv.org/pdf/2512.12924). This is a secondhand citation; I did not retrieve the original.
- **McLean & Pontiff:** returns are 26% lower out-of-sample and 58% lower post-publication, across 97 predictors — [McLean & Pontiff](https://Www.Gwern.net/doc/economics/2016-mclean.pdf)

### Inferences
- **Minimum backtest length**, worked from the E[max SR] formula above with unit variance of annualized Sharpe ratios. MinBTL (years) ≈ [E[max]/SR_target]². Values below assume a target annualized in-sample Sharpe of 1.0 under a true Sharpe of zero:
  | Independent configurations N | MinBTL (years) | Upper bound 2·ln N |
  |---|---|---|
  | 10 | 2.5 | 4.6 |
  | 45 | 5.0 | 7.6 |
  | 100 | 6.4 | 9.2 |
  | 1000 | 10.6 | 13.8 |
  So with 5 years of data, trying more than about 45 independent configurations makes an in-sample Sharpe of 1 expected from pure noise. This reproduces the well-known Bailey et al. (2014, "Pseudo-Mathematics and Financial Charlatanism") example; I did not fetch that paper this session.
- **Intraday implication:** intraday strategies have many more observations per year than daily ones, so the "years" in MinBTL are less binding. The variant count N, however, tends to explode: lookbacks × thresholds × time-of-day windows × symbols. Researchers should log every run and estimate an effective N, for example by clustering correlated variants as in DSR Appendix 3.
- **CPCV path count** (standard AFML Chapter 12 result, recalled): with N groups and k test groups there are C(N, k) splits and φ = (k/N)·C(N, k) = C(N−1, k−1) backtest paths. For example, N = 6 and k = 2 gives 15 splits and 5 paths.
- **Sizing purge and embargo:** purge by each label's t1, the triple-barrier end time. A common embargo is about 1% of the sample, or at least the longest feature lookback plus the label horizon. Intraday, embargo across the overnight gap, or keep whole days in the same fold.
- **PBO interpretation** (standard definition from the paper, recalled): split the matrix of strategy-variant returns into S blocks. For each symmetric in-sample/out-of-sample combination, find the in-sample best variant and its out-of-sample rank. PBO is the share of combinations where that variant ranks below the out-of-sample median. A PBO above 0.5 means the selection process is worse than random.
- **Recommended gate sequence before going live:**
  1. Economic hypothesis.
  2. Purged/embargoed CV or CPCV on the development sample.
  3. DSR above 0.95 using the honest N.
  4. PBO below 0.2–0.3.
  5. One look at the untouched recent holdout.
  6. Paper or small live trading, monitoring live versus backtest slippage.
  7. Size up.
  8. Budget for roughly 50% decay of the backtested edge (McLean-Pontiff) when sizing.

### Gaps
- I did not retrieve the original Arian, Norouzi and Seco (2024) paper, so its exact quantitative findings are unverified.
- I did not fetch the PBO paper text to quote its exact definition and numeric examples, or the MinBTL paper (Notices of the AMS, 2014).

---

## 6. Backtesting pitfalls specific to intraday

### Takeaway
Intraday backtests fail mostly through execution assumptions, not signal math. The usual culprits are filling at mid or at the bar close, ignoring queue position and adverse selection on limit orders, ignoring latency, and trusting bad ticks. Bar-based (vectorized) backtests are fine for screening ideas. Strategies that use limit orders, trade within the spread, or hold for seconds to minutes need event-driven, tick-level or L2/L3 simulation with latency and queue models.

### Cited Findings
- hftbacktest is built around realistic short-horizon fill simulation. It models feed latency and order latency, which can come from a data file with interpolation. It models queue position with built-in power-law models (exponents 2.0 and 3.0, plus custom probability functions; higher exponents make fills harder deep in the queue). It supports exchange models with or without partial fills and maker/taker fees — [hftbacktest docs](https://hftbacktest.readthedocs.io/); [Quickstart](https://www.mintlify.com/nkaz001/hftbacktest/quickstart); [PyPI](https://pypi.org/project/hftbacktest)
- NautilusTrader is an event-driven engine that covers both simulation and live execution with the same code — [Groundy overview](https://groundy.com/articles/nautilustrader-building-production-ready-algorithmic/); [Quantt comparison](https://www.quantt.co.uk/resources/backtesting-platforms-comparison)
- Leakage and over-optimism from conventional validation are well documented (Section 5) — [LuxAlgo purged CV](https://www.luxalgo.com/library/concept/purged-cross-validation.md)

### Inferences
Pitfall checklist (standard practitioner knowledge; not individually sourced this session):
- **Look-ahead bias.**
  - Using a bar's close or high-low to decide a trade filled within that same bar.
  - Using daily volume or volatility before the day ends.
  - Normalizing features with full-sample statistics.
  - Using split- or dividend-adjusted prices computed with later information.
  - Timestamp misalignment between trades and quotes, or between venues and futures.
  - Fix: decide on bar t, fill at the next event at bar t+1 (or later, after latency), and compute all features with point-in-time, trailing windows only.
- **Survivorship bias:** universes built from today's constituents (e.g., current S&P 500 members), or from symbols still listed. Use point-in-time membership and include delisted names.
- **Mid-price or close fills.**
  - Market orders cross the spread. For a buy, fill at the ask plus slippage, plus impact for size above top-of-book depth.
  - Mid fills silently add one half-spread per side. For a strategy turning over many times a day, that is often the entire edge.
- **Limit-order fills.**
  - "Touch equals fill" is optimistic. The price can trade at your level while your order is still behind the queue.
  - Conservative rule: require the price to trade *through* your level. Better: track queue position, where your order sits behind the displayed size at entry and advances only as trades and cancels at that level occur (hftbacktest-style).
  - Limit fills are adversely selected. You get filled most often just before the price moves against you, so a limit-order backtest without adverse selection overstates profit and loss.
- **Latency:** add realistic decision-to-exchange latency. For a non-colocated retail API this is roughly tens to hundreds of milliseconds, an assumption that should be measured live. Signals whose alpha decays within that window are not tradable.
- **Partial fills and size:** cap simulated fills at a fraction of displayed or traded volume. Account for odd lots and minimum tick sizes.
- **Bad ticks and data quality:**
  - Filter trades with odd-lot or out-of-sequence condition codes, and prints far outside the NBBO.
  - Handle trading halts, LULD bands, auction prints (open and close crosses), and futures contract rolls.
  - Bad prints create phantom mean-reversion profits.
- **Session effects:** opening and closing auctions behave differently from continuous trading. MOC/LOC orders have cutoff times. Do not assume fills at the official close price unless the order type allows it.
- **Bar-based vs event-driven:** vectorized bar backtests (vectorbt-style) are fast for sweeping parameters on market-order strategies with holding periods well above the bar size. Event-driven tick or L2 backtests (NautilusTrader, hftbacktest, LEAN) are needed for limit orders, sub-minute holding, stop logic inside a bar, and realistic latency. A good workflow screens with bars, then re-tests the survivors event-driven, comparing the two to quantify how much execution assumptions inflate results.
- **Paper-to-live reconciliation:** log the decision price, order-send time, fill price and fill time for every live trade. Compute live-versus-backtest slippage per trade and refit the cost model.

### Gaps
- I found no peer-reviewed quantification of how much "touch equals fill" or mid-fill assumptions inflate intraday backtest Sharpe ratios on US equities. Practitioner write-ups exist but were not retrieved.
- I did not retrieve measured retail-API order latencies (Alpaca, IBKR) for 2026.

---

## 7. Transaction cost modeling: spread, fees, slippage, market impact (Almgren-Chriss), implementation shortfall; turnover sensitivity

### Takeaway
Total cost has four parts: the explicit fees; the half-spread; impact that grows roughly with the square root of order size relative to volume; and delay or opportunity cost. Implementation shortfall measures all of them against the decision price. Net Sharpe scales as (gross edge − cost)/σ × √(number of bets). A high-turnover, small-edge strategy is therefore hit hardest by costs: a cost equal to half the gross edge halves the Sharpe ratio, no matter how many trades there are.

### Cited Findings
- **Implementation shortfall** (Perold, "The Implementation Shortfall: Paper vs. Reality", JPM 14, Spring 1988, pp. 4–9). It is the difference between a "paper" portfolio executed at decision-time prices and the actual portfolio. Components:
  - explicit costs (commissions, taxes);
  - implicit costs (spread, impact);
  - delay and opportunity costs, including unexecuted shares.
  Today it is usually computed per order — [Quantitative Brokers history](https://www.quantitativebrokers.com/blog/a-brief-history-of-implementation-shortfall); [Hasbrouck NYU notes](https://pages.stern.nyu.edu/~jhasbrou/Teaching/POST%202015%20Fall/classNotes/STPPTradingCosts.pdf); [R. O'Connell summary](https://ryanoconnellfinance.com/implementation-shortfall/)
- **Almgren-Chriss.** The original framework gives closed-form optimal execution schedules when per-share impact is linear in trading rate. Extensions give explicit solutions for nonlinear impact, including the square-root law — [Fields Institute talk](https://www.fields.utoronto.ca/talks/Optimal-execution-nonlinear-cost-functions-and-trading-enhanced-risk); [IDEAS/arXiv 1412.4503](https://ideas.repec.org/p/arx/papers/1412.4503.html)
- **Square-root law.** Tóth, Bouchaud et al. explain it via a V-shaped latent order book that vanishes near the current price. The price impact of a metaorder scales as the square root of its size, with a prefactor of order one — [arXiv 1105.1694](https://www.arxiv.org/pdf/1105.1694)
- Empirical exponents range from about 0.4 to 0.7, typically close to 0.5. One study (Zarinelli et al.) finds the square root fits only over about two orders of magnitude of order size and prefers a logarithmic form — [arXiv 1412.2152](https://arxiv.org/pdf/1412.2152); [ar5iv](https://ar5iv.arxiv.org/html/1412.2152)
- **HFT tax on liquidity:** latency-arbitrage races impose about 0.5 bp of trading volume as a cost — [FCA OP50](https://www.fca.org.uk/publications/occasional-papers/occasional-paper-no-50-quantifying-high-frequency-trading-arms-race-new-methodology)

### Inferences
- **Per-trade cost model for a small intraday trader** (practical template):
  - Round-trip cost (bps) = 2 × half-spread (for market orders both ways) + 2 × fees + 2 × slippage + impact.
  - Impact (square-root form) ≈ Y · σ_daily · √(Q/ADV), with Y ≈ 0.5–1. For a small trader, Q/ADV is tiny in liquid ETFs and futures, so impact is negligible and spread plus fees dominate. Impact matters for small caps or for trading a meaningful fraction of displayed depth.
- **Almgren-Chriss essentials** (standard 2000 paper, not fetched):
  - Liquidate X shares over horizon T with trading rate v.
  - Permanent impact g(v) = γv; temporary impact h(v) = ε·sgn(v) + ηv.
  - Minimize E[cost] + λ·Var[cost].
  - The optimal holdings path is x(t) = X·sinh(κ(T−t))/sinh(κT), with κ ≈ √(λσ²/η).
  - Higher risk aversion front-loads trading; λ → 0 gives TWAP.
  - For a small intraday trader this matters mainly for sizing or scaling into positions near the close or in thin names.
- **Spread arithmetic** (illustrative; prices are assumptions):
  - A 1-cent spread on a $600 ETF is about 0.17 bp. A 3-cent spread on a $50 stock is 6 bp, paid once per round trip if you cross both times.
  - The ES futures tick is 0.25 points × $50 = $12.50. At an index level of about 6,500, that is roughly 0.38 bp of notional.
  - So index ETFs and futures are the cheapest instruments, and small-cap names can cost 10–50× more per round trip.
- **Turnover scaling:**
  - Annual cost drag ≈ round trips per year × cost per round trip.
  - Example: 10 round trips per day × 250 days × 1 bp = 25% of capital per year at 1× gross exposure.
  - Example: 1 round trip per day at 5 bp costs 12.5% per year.
- **Why small-edge strategies are fragile:**
  - With per-trade gross mean e, per-trade standard deviation s, cost c and n independent trades per year, net annual Sharpe ≈ ((e − c)/s)·√n.
  - Example: e = 2 bp, s = 20 bp, n = 2,500 gives a gross Sharpe of 5.0. With c = 1 bp it drops to 2.5; with c = 2 bp, to 0.
  - The breakeven cost equals the gross edge per trade. Use a cost-to-edge ratio of 0.5 or less as a design rule, and stress-test at 1.5–2× the estimated costs.
- **Measure live:** track implementation shortfall per order (decision price versus fill), then decompose it into spread, delay (signal-to-send) and slippage. Refit the backtest cost model monthly.

### Gaps
- I did not fetch the original Almgren-Chriss (2000/2001) paper or Kissell's books. The Almgren-Chriss formulas above are standard background.
- I did not verify current 2026 commission and exchange-fee schedules (e.g., CME ES/MES fees, SEC Section 31 fee rate, FINRA TAF) or current typical spreads; these belong to the microstructure and cost notes.

---

## 8. Risk and sizing: Kelly and fractional Kelly, volatility targeting, risk of ruin, drawdown control, expectancy; the fundamental law (IR ≈ IC × √breadth) and its limits

### Takeaway
Size positions as a fraction of Kelly, typically ¼ to ½. Full Kelly is only optimal when the edge is known exactly, and in a continuous model it carries about a 50% chance of a 50% drawdown. Half-Kelly keeps about 75% of the growth rate with about half the volatility. Grinold's fundamental law formalizes why many small, independent bets beat one big bet: IR ≈ IC × √breadth. Breadth shrinks fast when bets are correlated, and the transfer coefficient and costs cut into the result.

### Cited Findings
- **Half-Kelly tradeoff:** it retains roughly three-quarters of the optimal growth rate while cutting volatility and drawdowns substantially (roughly in half) — [LuxAlgo Kelly](https://www.luxalgo.com/library/concept/kelly-criterion.md); [fffinstill](https://fffinstill.com/learning/concepts/kelly-criterion)
- **Thorp's drawdown result (geometric Brownian motion):** the probability of ever experiencing a 50% drawdown is 50% at full Kelly and 12.5% at half Kelly, while long-term growth drops only 25% — [LuxAlgo Kelly](https://www.luxalgo.com/library/concept/kelly-criterion/); [MacLean, Thorp & Ziemba, Quantitative Finance 10(7), 2010](https://econpapers.repec.org/bookchap/wsiwsbook/7598.htm)
- **Overbetting is asymmetric:** the growth penalty for betting above the true optimum is severe, while betting below it costs little. Practitioners prefer fractional Kelly for this reason — [metricgate](https://metricgate.com/calculator/kelly-criterion); [LuxAlgo](https://www.luxalgo.com/library/concept/kelly-criterion.md)
- **Fundamental law:** IR ≈ IC × √BR, where IC is the correlation of forecasts with realized residual returns and BR is the number of independent bets per year. It assumes independent information sources and a constant IC across bets — [New Frontier Advisors paper](https://newfrontieradvisors.com/media/1744/fundamental-law-september-2019.pdf); [AnalystPrep](https://analystprep.com/study-notes/cfa-level-2/state-and-interpret-the-fundamental-law-of-active-portfolio-management-including-its-component-terms-transfer-coefficient-information-coefficient-breadth-and-active-risk-aggressiveness/)
- **Clarke, de Silva & Thorley (2002, 2006):**
  - IR = TC × IC × √BR, where the transfer coefficient TC is the correlation between implemented active weights and the unconstrained optimal ones. Constraints and frictions push TC below 1.
  - For correlated decisions, effective breadth is BR = N / [1 + (N − 1)ρ].
  - Sources: [JOIM CST 2006](https://joim.com/wp-content/uploads/emember/downloads/p0158.pdf); [AnalystPrep limits](https://analystprep.com/study-notes/cfa-level-2/describe-the-practical-strengths-and-limitations-of-the-fundamental-law-of-active-management/); [open-exam-prep](https://open-exam-prep.com/study-guides/cfa-level2/portfolio-management/active-portfolio-management)

### Inferences
- **Kelly formulas** (standard):
  - Binary bet with win probability p, loss probability q = 1 − p and payoff ratio b = W/L: f* = p − q/b = (bp − q)/b.
  - Continuous returns with mean excess return μ and variance σ²: f* = μ/σ², which is leverage equal to SR/σ.
  - Betting a fraction c of Kelly gives a growth rate of c(2 − c) times the maximum. So c = 0.5 gives 75%, and c = 0.25 gives about 44%. Volatility scales linearly with c.
  - Under geometric Brownian motion, the probability of ever falling to fraction x of the peak is x^(2/c − 1). At c = 1, P(50% drawdown) = 0.5; at c = 0.5, it is 0.5³ = 12.5%, matching the cited Thorp figures.
- **Expectancy and win rate:**
  - Expectancy per trade E = p·W − (1 − p)·L. Breakeven win rate p* = L/(W + L) = 1/(1 + b). With b = 1, p* = 50%; with b = 2, p* = 33%; with b = 0.5, p* = 67%.
  - Costs shift W down and L up. At intraday scale, a 1–2 tick cost on a 4-tick target can move p* by 10–20 percentage points.
  - High-win-rate, low-payoff strategies, such as many mean-reversion and short-volatility trades, have small expectancy per trade and fat left tails. Size them using tail-aware estimates rather than the win rate.
- **Fundamental law, worked intraday example:**
  - IC = 0.02 (a typical weak but real signal) on one asset, one bet per day (BR = 252): IR ≈ 0.02 × √252 ≈ 0.32.
  - The same IC on 100 independent bets per day (BR = 25,200): IR ≈ 3.2.
  - If those 100 simultaneous bets share pairwise correlation ρ = 0.2 (common in intraday equity signals driven by the market factor), effective N per day = 100/(1 + 99 × 0.2) ≈ 4.8. IR then falls to about 0.70.
  - Lesson: "many small bets" only helps if the bets are genuinely independent. Market-neutralizing and sector-neutralizing intraday signals raises effective breadth.
- **Limits of the fundamental law for intraday trading:**
  - Costs scale linearly with the number of bets, while gross IR scales only with √BR. Beyond some turnover, net IR falls.
  - IC is not constant across time-of-day or regimes.
  - Bets that overlap in time are not independent (see the labeling notes).
  - TC is below 1 for small accounts because of minimum lot sizes, buying-power limits, pattern-day-trader rules for US margin accounts under $25k, and short-sale constraints. (The PDT rule is background; check whether FINRA's proposed 2025–2026 changes have taken effect.)
- **Volatility targeting:** scale position size so ex-ante volatility is constant: position = target σ / forecast σ (EWMA or HAR realized volatility). Intraday, compute it on time-of-day-normalized volatility, and cap leverage.
- **Risk of ruin and drawdown controls:**
  - Hard daily loss limit, for example 2–3× daily σ, after which trading stops for the day.
  - Per-trade max loss via stops sized in volatility units.
  - Max gross and net exposure.
  - A kill-switch for data or connectivity faults.
  - A "strategy-level drawdown pause" when live drawdown exceeds about 1.5–2× the backtested max drawdown. This doubles as overfitting detection.
- **Sizing against estimation error:** estimate μ conservatively. Haircut the backtested Sharpe by about 50% (McLean-Pontiff decay) and use the DSR-adjusted Sharpe before applying Kelly, then apply a ¼–½ fraction on top.

### Gaps
- I did not fetch Thorp's or MacLean-Thorp-Ziemba's original text. The 50% and 12.5% figures come from secondary educational sources, though they match the standard GBM formula reproduced above.
- I did not verify the 2026 status of FINRA pattern-day-trader rule changes.

---

## 9. Practical tooling (2025–2026): open-source backtesters/frameworks and broker APIs

### Takeaway
Use a vectorized engine for fast research sweeps (vectorbt), an event-driven engine with backtest/live parity for production (NautilusTrader self-hosted, or QuantConnect LEAN in the cloud or self-hosted), and hftbacktest when queue position and latency matter. Backtrader is effectively unmaintained. For brokers, Alpaca, Interactive Brokers and Tradier are the common API-first choices, but the rankings found are from affiliate-driven sites.

### Cited Findings
- **Backtrader:** last commit and last PyPI release both April 19, 2023. Described as effectively unmaintained and suited to learning rather than production — [Quantt comparison](https://www.quantt.co.uk/resources/backtesting-platforms-comparison); [Stork.ai](https://www.stork.ai/alternatives/backtrader)
- **LEAN (QuantConnect):** the closest peer to NautilusTrader in production ambition, with live trading across multiple brokers. It is designed around QuantConnect's cloud, whereas NautilusTrader is infrastructure-agnostic. Porting from LEAN to Nautilus is "a migration project" — [Quantt comparison](https://www.quantt.co.uk/resources/backtesting-platforms-comparison)
- **NautilusTrader:** an open-source, event-driven engine covering simulation and live execution. For self-hosted, exchange-agnostic deployment, one review says it "currently has no direct open-source peer" — [Groundy](https://groundy.com/articles/nautilustrader-building-production-ready-algorithmic/); [Quantt](https://www.quantt.co.uk/resources/backtesting-platforms-comparison)
- **vectorbt:** popular for strategy research and hyperparameter sweeps — [Quantt](https://www.quantt.co.uk/resources/backtesting-platforms-comparison); [2026 tools deep-dive](https://www.youngju.dev/blog/culture/2026-05-16-trading-bots-quant-tools-2026-lean-quantconnect-backtrader-zipline-freqtrade-hummingbot-nautilus-vectorbt-deep-dive)
- **hftbacktest:** open-source Python (Numba) and Rust framework for HFT and market-making backtests, with queue and latency models. The Rust version adds multi-asset backtesting and live deployment for Binance Futures and Bybit, which are crypto venues, not US equities — [hftbacktest docs](https://hftbacktest.readthedocs.io/); [PyPI](https://pypi.org/project/hftbacktest); [Substack review](https://quantfinance.substack.com/p/hftbacktest-high-frequency-trading)
- **Alpaca:** named "Best Broker for Algorithmic Trading in 2026" by BrokerChooser (per Alpaca's own blog). It is commission-free and API-first, with a free paper-trading sandbox and an official MCP server — [Alpaca blog](https://alpaca.markets/blog/alpaca-recognized-as-best-broker-for-algorithmic-trading-in-2026-by-brokerchooser/); [Quantt brokers](https://www.quantt.co.uk/resources/best-brokers-for-algo-trading)
- **Interactive Brokers** is described as best for most algo traders, especially multi-asset (equities, options, futures). **Tradier** is noted for low stock and ETF fees and its API. These sources are affiliate or comparison sites — [Quantt brokers](https://www.quantt.co.uk/resources/best-brokers-for-algo-trading); [BrokerChooser](https://brokerchooser.com/best-brokers/best-brokers-for-algo-trading-in-peru); [gitnux](https://gitnux.org/best/api-trading-software/)

### Inferences
- **Suggested stack for a small intraday US equities/futures project:**
  - Data: tick or L1/L2 historical data (e.g., Databento or Polygon; covered in other notes) stored as Parquet.
  - Research: pandas/Polars, vectorbt for sweeps, LightGBM for models, custom purged-CV, DSR and PBO utilities (mlfinlab-style or self-written).
  - Event-driven validation and live trading: NautilusTrader (Rust core, Python API) or LEAN.
  - Microstructure-sensitive limit-order work: hftbacktest-style queue and latency modeling.
- **Broker choice by asset:**
  - Index futures (ES/MES/NQ/MNQ) need a futures broker. IBKR is the common API-accessible retail option; Alpaca's core offering is US equities, options and crypto.
  - Commission-free equity brokers typically route retail orders for payment for order flow. This can mean price improvement on small marketable orders, but less control over routing. Verify each broker's current Rule 606 disclosures.
- **Zipline-reloaded** is the maintained community fork of Quantopian's Zipline. It suits daily-frequency equity research and is a weaker fit for intraday tick work. This is background knowledge; no source was retrieved this session.

### Gaps
- No head-to-head benchmark of these frameworks (speed, fill-model realism) was found. Comparisons are from blogs and reviews.
- I did not retrieve the official NautilusTrader, vectorbt (including vectorbt PRO), LEAN or Zipline-reloaded documentation for current 2026 feature lists, supported brokers and data adapters.
- I did not verify current API latency, rate limits or futures support for Alpaca, IBKR or Tradier, or payment-for-order-flow practices.

---

## 10. "Quantum trading": term clarification and what quantum computing actually does in trading as of 2026

### Takeaway
"Quantum trading" is almost certainly a mix-up for "quant trading", meaning quantitative or systematic trading. As of October 2026, quantum computing has no demonstrated production advantage in trading. The headline result, HSBC and IBM in September 2025, was a research trial. It reported a 34% improvement in *predicting bond RFQ fill probability* using quantum-generated features. It was not a profit figure and not a proven quantum advantage, and prominent computer scientists criticized it sharply. Portfolio optimization remains experimental, with no independent benchmark beating strong classical solvers. The one rigorous "beyond-classical" finance-adjacent result, JPMorgan and Quantinuum's certified randomness (Nature, 2025), is a cryptographic primitive, not a trading tool.

### Cited Findings
- **HSBC and IBM (announced 25 September 2025; some sources say the 24th).**
  - HSBC called it the first known empirical evidence that current quantum computers can add value to algorithmic bond trading.
  - The 34% refers to better prediction of whether a quoted European corporate bond RFQ would be filled, compared with common classical techniques. It is not a return or profit number.
  - The trial was not live trading, though it used production-scale data.
  - Sources: [Markets Media](https://www.marketsmedia.com/hsbc-trials-quantum-enabled-algo-trading-with-ibm/); [IBM Quantum blog](https://www.ibm.com/quantum/blog/hsbc-algorithmic-bond-trading); [Yahoo/Reuters](https://finance.yahoo.com/news/hsbc-says-quantum-computing-trial-230522622.html); [The Standard HK](https://www.thestandard.com.hk/finance/article/312485/HSBC-says-quantum-computing-trial-helps-bond-trading)
- **Method.** IBM's Heron processor generated features fed into classical ML models: per one summary, 327 quantum-derived features per event from a 216-feature input snapshot. IBM states the gains came from real hardware runs and could not be reproduced by classical simulation of those circuits — [FI-Desk](https://www.fi-desk.com/?p=25977); [IBM blog](https://www.ibm.com/quantum/blog/hsbc-algorithmic-bond-trading)
- **Criticism.**
  - Scott Aaronson said the claim had "more red flags than a People's Liberation Army parade" and labeled it a "qombie": a quantum-advantage narrative without theoretical support.
  - Critics argue that if the boost comes from hardware noise acting as a regularizer or random feature map, a similar result could likely be obtained classically by injecting noise.
  - Sources: [FI-Desk](https://www.fi-desk.com/quantum-computing-breakthrough-has-more-red-flags-than-a-peoples-liberation-army-parade/); [Global Trading](https://www.globaltrading.net/?p=39719); [Kapronasia](https://kapronasia.com/insight/blogs/capital-markets-research/a-look-at-hsbcs-quantum-enabled-algorithmic-trading-announcement)
- **The authors themselves did not claim quantum advantage.** The stronger language came from social media and press coverage — [PostQuantum](https://postquantum.com/industry-news/hsbc-ibm-quantum-advantage/)
- **Market reaction:** IBM shares rose about 5% on the day of the announcement — [Kapronasia](https://kapronasia.com/insight/blogs/capital-markets-research/a-look-at-hsbcs-quantum-enabled-algorithmic-trading-announcement); [Global Trading](https://www.globaltrading.net/?p=39719)
- **JPMorgan, Quantinuum and US national labs (Nature, 26 March 2025).** A certified-randomness-expansion protocol ran on a 56-qubit trapped-ion machine and certified at least 71,313 bits of entropy against an adversary at least four times more powerful than the largest supercomputer. It is a cryptographic primitive with indirect finance relevance — [JPMorgan](https://www.jpmorgan.com/technology/news/certified-randomness); [R&D World](https://www.rdworldonline.com/?p=77714)
- **Portfolio optimization.**
  - A 2026 CFA Institute blog says institutions are *testing* quantum methods for portfolio optimization and trade-execution prediction, but reports no measured gains — [CFA Institute 2026](https://rpc.cfainstitute.org/index%2ephp/blogs/enterprising-investor/2026/quantum-computing-vs-ai-0)
  - Skeptics ask whether near-term algorithms are really "quantum-inspired" methods that do not need quantum hardware. Surveys distinguish near-term heuristics (QAOA, VQE, annealing) from provable speedups such as quantum amplitude estimation for Monte Carlo, which need large fault-tolerant machines — [Intellect EU](https://www.intellecteu.com/blog/quantum-inspired-improvement-of-portfolio-optimization); [arXiv 2201.02773 survey](https://arxiv.org/pdf/2201.02773)

### Inferences
- For someone building an intraday algorithm in 2026, quantum computing is irrelevant in practice. No broker, exchange or data vendor offers quantum-advantaged signals or execution, and the latency of cloud quantum hardware is incompatible with intraday decision loops. "Quantum-inspired" classical optimizers (tensor networks, simulated annealing) are ordinary classical algorithms.
- The HSBC case is itself a lesson in backtest methodology. A 34% relative improvement in fill-prediction accuracy over unspecified classical baselines, with no published ablation against classical noise-injected or random-feature baselines, is exactly the kind of claim the DSR and PBO framework (Section 5) asks you to discount.
- Retail products marketed as "Quantum AI" trading bots should be treated with strong suspicion. Such branding is commonly associated with investment scams. This is background caution only and was not verified with regulator sources this session.

### Gaps
- I did not retrieve the HSBC/IBM preprint itself (arXiv, September 2025), so the classical baselines, metrics and statistical significance are unverified.
- I found no independent 2025–2026 benchmark showing quantum hardware beating state-of-the-art classical solvers on a real portfolio optimization or trading problem.
- I did not verify regulator warnings (e.g., FCA, SEC, ASIC) specifically about "Quantum AI" trading scams.

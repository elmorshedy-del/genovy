# Market Context Layer for Intraday US Index Trading: Internals, Volatility Regimes, Cross-Asset Lead-Lag, Scheduled Events, News, and Time-of-Day (as of October 2026)

Scope note: Covers SPY, QQQ, SPX/XSP options, ES/NQ futures at intraday horizons. Evidence grading used throughout: **[R]** = peer-reviewed or central-bank/exchange research; **[WP]** = working paper or preprint; **[P]** = practitioner, vendor, or blog, which is lore until verified. Dates and sample periods are given so the reader can judge decay.

## 1. Market internals and breadth ($TICK, $ADD, $VOLD, TRIN, % above VWAP/MA, sector breadth, mega-cap concentration)

### Takeaway
Internals are well defined and widely watched, but I found **no rigorous peer-reviewed evidence that $TICK, $ADD or $VOLD predict intraday index returns**. The limited academic work on TRIN suggests its predictive power has **"drastically weakened" since the 2000s**. With the top 10 names near 39-41% of the S&P 500 in 2025-26, breadth and price can come apart for long stretches. So use internals to **diagnose participation and day type** (is the move broad or carried by a few mega caps?), not as standalone entry signals.

### Cited Findings
- **$TICK definition [P]:** At any moment, the number of NYSE stocks whose last trade was an uptick minus the number whose last trade was a downtick. Unchanged stocks are excluded. Nasdaq's equivalent is TICKQ. Traders also track a **cumulative TICK** (running sum) to spot trend days — [LuxAlgo TICK concept](https://www.luxalgo.com/library/concept/tick-index/); [TradingView NYSE TICK scripts](https://www.tradingview.com/scripts/nysetick/)
- **$TICK thresholds are a convention, not an official standard [P]:** ±1,000 is "generally treated as extreme." The index can theoretically exceed ±2,000. Sources disagree on the typical range (±1,000 vs ±1,500), and many traders recalibrate to recent readings because the range shifts with market structure and volatility — [TradingView NYSE TICK](https://www.tradingview.com/scripts/nysetick/); [thetrading.tools NYSE TICK](https://www.thetrading.tools/nyse-tick)
- **Regime-dependent use of TICK [P]:** Extreme prints can be fade candidates in balanced (range) markets and confirmation signals on trend days — [LuxAlgo TICK concept](https://www.luxalgo.com/library/concept/tick-index/)
- **Arms Index / TRIN [P definition]:** TRIN = (advancing issues / declining issues) / (advancing volume / declining volume). It is described as used "primarily on an intraday basis" — [StockTrak glossary](https://learn.stocktrak.com/glossary/arms-index/)
- **TRIN predictive power has decayed [P summarizing R]:** AAII reports that recent academic research finds TRIN's predictive power has "drastically weakened" since the 2000s. I could not retrieve the underlying paper (AAII page returned HTTP 503) — [AAII: Using the Arms Index (TRIN)](https://www.aaii.com/journal/article/322803-using-the-arms-index-trin-for-market-breadth-analysis)
- **Academic test of breadth/TRIN [R]:** A Montclair State study examines the return predictive power of index-specific market breadth, TRIN, and index-over-moving-average indicators. It also tests whether breadth computed on a broader universe beats breadth computed on the index itself. The abstract says only that "some technical strategies may be effective"; TRIN-specific numbers were not retrievable — [Montclair research record](https://researchwith.montclair.edu/en/publications/the-use-of-index-specific-market-breadth-and-index-over-moving-av/)
- **Anecdotal skepticism [P]:** An older Daily Speculations essay argues that TRIN's occasional famous calls "don't begin to make up for all the times it didn't work" — [Daily Speculations](https://dailyspeculations.com/about%20us/archives/archieve/An%20investing%20tool%20you%20can%20do%20without.htm)
- **Concentration, record level:** The top 10 stocks reached a record **40.7%** of the S&P 500 in December 2025 (vs ~26% at the 2000 dot-com peak and ~30% in 1963) — [Walnut Invest concentration stats](https://walnutinvest.com/stats/market-concentration-statistics); [ChartRow S&P 500 concentration](https://chartrow.com/sp500/concentration)
- **Concentration, 2026 readings:** Top 10 at **39.1%**, largest single name 8.4%, as of Sep 30, 2026. The figure is attributed to S&P DJI but comes from a crypto-exchange blog, so verify it. A separate source puts the top 10 at "almost 40%" in July 2026. Reuters reported 37.3% in July 2025 — [KuCoin blog citing S&P DJI](https://www.kucoin.com/blog/bd-nvidia-apple-and-microsoft-sp500-concentration); [Landmark Wealth](https://landmarkwealthmgmt.com/articles/the-evolution-of-sp-500-top-10-companies-how-tech-giants-captured-nearly-40-of-the-index-by-2026/); [Khaleej Times/Reuters](https://www.khaleejtimes.com/business/markets/us-stock-market-concentration-risks-come-to-fore-as-megacaps-report-earnings?amp=1)
- **Large stocks lead small stocks in price discovery [R]:** A NY Fed staff report finds that trading on common information appears first in large stocks and reaches smaller stocks with a lag — [NY Fed Staff Report 303](https://www.newyorkfed.org/medialibrary/media/research/staff_reports/sr303.pdf)

### Inferences
- **The concentration problem undermines equal-count breadth.** $TICK, $ADD and $VOLD weight every NYSE issue equally, including many non-S&P and closed-end/preferred listings, while SPX/NDX are cap-weighted. With ~40% of SPX in 10 names, SPX can rise on negative $ADD. A cap-weighted internal (e.g., % of index weight above VWAP, or a weighted "mega-cap 7" tick) is more relevant for SPX/QQQ. An equal-count internal is more relevant for gauging broad risk appetite or for IWM/RSP.
- **Practical encoding for an algorithm:** features such as (a) cumulative TICK slope over the first 60 min; (b) $ADD level and its monotonicity; (c) $VOLD ratio (up volume / down volume; NYSE ratio > ~3:1 or < 1:3 is practitioner shorthand for a one-sided day); (d) % of SPX constituents (cap-weighted and equal-weighted) above session VWAP. Feed them into a **day-type classifier**, not a direction signal. Any value must be shown out of sample, since no rigorous published evidence was found.
- **Divergence logic** (index makes a new high while $ADD/$TICK do not) is plausible as a mean-reversion context signal, but it is unvalidated. It also conflicts structurally with the concentration point above: divergences can persist for months when mega caps carry the index.

### Gaps
- No peer-reviewed study found that tests $TICK extremes (±1,000), cumulative TICK, $ADD or $VOLD as intraday predictors of SPX/ES returns or day type. Any claim of predictive value is lore.
- The specific post-2000 TRIN decay paper cited by AAII could not be identified or read.
- No rigorous source found on "% of stocks above VWAP" as a signal.
- No source quantified how often SPX and equal-weighted breadth diverge intraday under high concentration.

## 2. Volatility indices, term structure, and the expected daily move (VIX, VIX1D, VIX9D, VVIX, VRP)

### Takeaway
Implied vol is the single most useful "what kind of day" input. **VIX/√252 ≈ VIX/15.9** gives a ~1-sigma daily move (VIX 16 ≈ ±1%). **VIX1D** (SPX 0-1 DTE options, history from May 2022) prices today's event risk directly. Implied vol **systematically overstates realized** (the variance risk premium): the VIX-derived daily move exceeded the actual absolute S&P move ~80% of the time. Term-structure slope predicts **volatility asset returns** (Johnson 2017), not index direction. The best-supported use is **sizing and bracket width**, not directional prediction.

### Cited Findings
- **VIX methodology [R/exchange]:** Constant 30-day expected volatility from real-time mid-quotes of SPX options expiring 23-37 days out, in calendar time — [Cboe: What VIX and VIX1D measure](https://www.cboe.com/insights/posts/what-the-vix-and-vix-1-d-indices-attempt-to-measure-and-how-they-differ)
- **VIX1D methodology [R/exchange]:**
  - Built from P.M.-settled SPXW options expiring in 0 and 1 day, time-weighted. Early in the session it is almost entirely 0DTE, and the weight shifts to next-day expiries through the day.
  - Uses business days and business minutes.
  - With under 60 business minutes to near-term expiry (~3:00 pm ET), near-term vol is frozen at its last valid value and the index interpolates toward next-term vol. At 4:00 pm it fully converges to next-term vol; 4:00-4:15 pm uses next-term only.
  - Calculated during regular trading hours only.
  - Source: [Cboe: What VIX and VIX1D measure](https://www.cboe.com/insights/posts/what-the-vix-and-vix-1-d-indices-attempt-to-measure-and-how-they-differ)
- **VIX1D product facts [exchange/press]:** Developed by Cboe Labs; non-tradable, with no derivatives planned because of settlement difficulty. Daily history begins **May 13, 2022**, when daily SPXW expirations began — [Advisor Perspectives/Cboe](https://www.advisorperspectives.com/commentaries/2023/05/11/the-need-for-speed-how-cboes-new-volatility-index-is-built-to-track-next-day-expectations); [Cboe VIX1D in 11 charts](https://www.cboe.com/insights/posts/how-the-vix-1-d-index-performance-compares-to-the-vix-index-and-other-volatility-indices-in-11-charts/)
- **Expected-move conversion [exchange]:** Cboe's example: VIX 16 implies ±16% annualized, "a daily range of +/- ~1%" (16/√252 ≈ 1.01%) — [Cboe](https://www.cboe.com/insights/posts/what-the-vix-and-vix-1-d-indices-attempt-to-measure-and-how-they-differ)
- **VIX overshoots daily moves [P]:** An Advisor Perspectives analysis since 2004 found that the VIX-derived daily move exceeded the S&P 500's actual absolute daily move "just over 80% of the time." The implied daily *range* exceeded the actual range only **59%** of the time, so ranges breach the VIX band far more often than close-to-close moves do. I only saw the search snippet (page returned 403) — [Advisor Perspectives: Fear and Volatility](https://www.advisorperspectives.com/commentaries/2020/06/08/fear-and-volatility-1)
- **VIX1D overstates realized [WP]:** A TU Dresden paper reports that VIX1D "overestimates the volatility of the S&P 500 significantly" and proposes a volatility-risk-premium adjustment before using it as a forecast — [TU Dresden: "A new star is born"](https://fis.tu-dresden.de/portal/en/publications/a-new-star-is-born-does-the-vix1d-render-common-volatility-forecasting-models-for-the-us-equity-market-obsolete(cdf81654-bf7d-41b6-a165-af0168c8b016).html)
- **Implied vs realized in 2022 [exchange]:** VIX averaged ~23 and realized ~24, a near-zero or negative premium versus the historical 3-4 vol-point average. VRP can vanish in stress years — [Cboe](https://www.cboe.com/insights/posts/what-the-vix-and-vix-1-d-indices-attempt-to-measure-and-how-they-differ)
- **VIX1D event behavior [exchange]:**
  - Across 20 CPI and FOMC announcements (Jun 2022-May 2023), VIX1D averaged **+61.4% the day before** and **−24.8% on announcement day**; VIX moved +1.9% and −3.3%.
  - Largest VIX1D one-day jumps were +153.2% (Jan 11, 2023) and +132.6% (Dec 11, 2022), mostly on the eve of CPI or FOMC.
  - VIX1D close range 9.96-47.14 vs VIX 15.78-34.02 (May 2022-May 2023).
  - Correlation of VIX1D with SPX returns was only −0.20, vs < −0.70 for several longer-dated indices.
  - Source: [Cboe VIX1D in 11 charts](https://www.cboe.com/insights/posts/how-the-vix-1-d-index-performance-compares-to-the-vix-index-and-other-volatility-indices-in-11-charts/)
- **Stress example [exchange]:** March 8-13, 2023 bank stress: VIX +38.8% (19.11→26.52); backtested VIX1D +162.7% (15.30→40.19) — [Cboe](https://www.cboe.com/insights/posts/what-the-vix-and-vix-1-d-indices-attempt-to-measure-and-how-they-differ)
- **Variance risk premium [R]:** Bollerslev, Tauchen & Zhou (2009, RFS 22(11)) define VRP as model-free implied variance minus realized variance from high-frequency data. High (low) VRP predicts high (low) future equity returns, most strongly at **quarterly** horizons, where it dominates P/E, default spread and cay. Bollerslev, Marrone, Xu & Zhou (2014, JFQA) find the result robust to small-sample bias and present internationally. Critique: Bekaert et al. note the BTZ measure assumes conditional variance is a martingale, which may bias it — [Duke Scholars BTZ 2009](https://scholars.duke.edu/publication/732839); [Fed FEDS 2011-52 (BMXZ)](https://www.federalreserve.gov/pubs/feds/2011/201152/index.html); [Bekaert slides](https://www.netspar.nl/wp-content/uploads/035_Bekaert.pdf)
- **Term structure [R]:** Johnson (2017, JFQA) finds the VIX term-structure **SLOPE** (2nd principal component) carries information about the *price of variance risk*, not expected VIX changes. SLOPE predicts excess returns of variance swaps, VIX futures and SPX straddles at all maturities. Low slope (flat or backwardated) predicts higher vol-asset returns; the next-day lowest-vs-highest quintile gap ranges 0.29%-1.81% across 18 asset/maturity combos (1996-2013, per secondary summary) — [IDEAS: Johnson 2017](https://ideas.repec.org/a/cup/jfinqa/v52y2017i06p2461-2490_00.html); [CXO summary](https://www.cxoadvisory.com/volatility-effects/vix-term-structure-slope-and-variance-asset-future-returns/)
- **Contango frequency [exchange/P]:** Cboe says contango holds >80% of the time and backwardation <20% since 2010. OptionMetrics finds backwardation on 19% of days since Feb 2006, clustered in 2008-09 and March 2020. VIX/VIX3M ratio backwardation: 7.7% of days across 104 episodes since 2010. Definitions differ — [Barchart/OptionMetrics](https://www.barchart.com/story/news/31722367/vix-futures-curve-warning); [thetrading.tools VIX term structure](https://www.thetrading.tools/vix-term-structure); [Harbourfront Quant](https://harbourfrontquant.substack.com/p/examining-contango-and-backwardation)
- **Term structure as event map [exchange]:** On Jun 12, 2020 an "election bump" put VIX3M/VIX6M above VIX9D/VIX ahead of the Nov 3, 2020 election — [Cboe 11 charts](https://www.cboe.com/insights/posts/how-the-vix-1-d-index-performance-compares-to-the-vix-index-and-other-volatility-indices-in-11-charts/)
- **VVIX [R-WP]:** Park (Fed FEDS 2013-54) proposes VVIX (model-free vol-of-vol from VIX options). Higher VVIX predicts *lower* subsequent returns on tail-risk hedges over ~3-4 weeks, and VVIX beats VIX as a tail-risk gauge. A later JFM 2015 version is cited secondarily but unverified — [Fed FEDS 2013-54](https://www.federalreserve.gov/pubs/feds/2013/201354)
- **Event-day implied moves from straddles [P]:**
  - Over 12 CPI releases to late 2023, SPX averaged ±0.64% on CPI day vs ±1.07% on an average day in the same window, so CPI days were *calmer* than average in that sample.
  - By late 2024 the trailing 12-month CPI-day average was ±0.95%. Cheap pre-CPI straddles had mostly *over*priced subsequent moves.
  - Source: [Russell Rhoads Substack](https://russellrhoads.substack.com/p/historical-index-and-option-price); [Rhoads: CPI/PPI](https://russellrhoads.substack.com/p/cpi-ppi-plus-big-box-retail-earnings)
- **Variance-differencing method [P]:** ORATS extracts single-day implied moves by differencing variance across daily expiries: **0.62%** for CPI day (July 2026) vs 0.55-0.58% for midweek days — [ORATS blog](https://orats.com/blog/bank-earnings-cpi-straddles)
- **January 2025 example [press]:** Options implied ~±1% for SPX on the Jan 15, 2025 CPI, the largest implied CPI move since March 2023 (Citi's Stuart Kaiser) — [Bloomberg](https://www.bloomberg.com/news/articles/2025-01-14/traders-brace-for-s-p-500-s-busiest-cpi-day-since-march-2023); [BNN Bloomberg](https://bnnbloomberg.ca/investing/2025/01/22/traders-brace-for-sp-500s-busiest-cpi-day-since-march-2023)

### Inferences
- **Expected-move formulas for the algorithm:**
  - EM_day ≈ S × VIX1D/100 / √252 at the open (VIX1D is in business time; verify the annualization basis in the Cboe methodology PDF).
  - Alternatively EM ≈ 0.8 × ATM 0DTE straddle price; the 0.8 ≈ √(2/π) factor converts straddle value to an expected absolute move under normality.
  - EM from VIX is a 30-day average and blurs event days. VIX1D or the variance-differenced single-day move (ORATS method) isolates them.
- **Hit rates vs EM:** Because of VRP, close-to-close moves stay inside the ±1σ implied band more often than the normal 68%. The ~80% figure above is consistent with this. The intraday *range* breaches the band far more often (only 59% containment in the Advisor Perspectives snippet). So stops and targets keyed to EM should use the **range** distribution, not the close-to-close distribution.
- **Regime switches:**
  - VIX/VIX3M > 1 (backwardation) and VVIX spikes mark a stress regime with larger ranges, more mean-reverting intraday behavior (see LeBaron effect, Section 4), and wider spreads. Reduce size and widen brackets.
  - The VIX1D/VIX ratio is a clean "event-tomorrow" flag: a high ratio means event premium is concentrated in the current day.
- **No source found that VIX level or term structure predicts intraday *direction*.** The supported claims are about the *magnitude* of moves and returns of vol assets.

### Gaps
- No rigorous published hit-rate study found for SPX open-to-close or high-low range vs VIX1D-implied move (2022-2026). The reader must compute it. Data (VIX1D from May 2022, SPX OHLC) are public.
- The Cboe VIX1D methodology PDF was not read directly. Its "405-minute day" reference and the exact annualization basis were not verified.
- No rigorous evidence found that VIX9D/VIX ratios predict next-day SPX range beyond what VIX1D captures.

## 3. Realized volatility modeling for intraday use (clustering, HAR-RV, GARCH, intraday periodicity, sizing)

### Takeaway
The working toolkit is (1) a **daily vol forecast** from **HAR-RV**, still a hard-to-beat benchmark in 2025-26 studies; (2) a **deterministic intraday periodicity (U-shape) multiplier** (Andersen & Bollerslev 1997); and (3) event-day overrides from implied vol. Together they give a per-bar expected volatility for scaling stops, targets and position size.

### Cited Findings
- **HAR-RV [R]:** Corsi (2009, J. Financial Econometrics 7(2):174-196) models next-day realized variance as a linear function of daily, weekly (5-day mean) and monthly (22-day mean) RV, fitted by OLS. It is an "additive cascade" motivated by heterogeneous-horizon traders. It is not formally long-memory but reproduces the observed persistence — [Corsi 2009 PDF](https://statmath.wu.ac.at/~hauser/LVs/FinEtricsQF/References/Corsi2009JFinEtrics_LMmodelRealizedVola.pdf); [SSRN](https://papers.ssrn.com/abstract=1365738)
- **HAR remains a tough benchmark [WP]:** A 2025 arXiv study asks "Can anything beat the benchmark?" for out-of-sample RV prediction. "HARd to Beat" (2024) argues that rolling-window choice explains much of the apparent ML outperformance over HAR — [arXiv 2506.07928](https://arxiv.org/pdf/2506.07928); [arXiv 2406.08041](https://arxiv.org/pdf/2406.08041)
- **Caveat on OLS [WP]:** RV series are conditionally heteroskedastic and non-Gaussian, so OLS is not ideal. Log-RV or WLS variants are common — [HARNet arXiv 2205.07719](https://arxiv.org/pdf/2205.07719)
- **Intraday periodicity [R]:** Andersen & Bollerslev (1997, J. Empirical Finance 4:115-158) show that intraday periodicity strongly distorts the dynamics of high-frequency returns in FX and equities. It must be filtered out to see the true within-day volatility persistence. Their model: return = daily vol (from GARCH) × deterministic intraday periodic factor (estimated by flexible Fourier form) × i.i.d. shock / √N — [Kellogg abstract](https://www.kellogg.northwestern.edu/academics-research/research/detail/1997/intraday-periodicity-and-volatility-persistence-in-financial-markets/); [NBER w5752](https://www.nber.org/papers/w5752.pdf); [arXiv multiplicative component GARCH](https://arxiv.org/pdf/2111.02376)
- **U-shape [P/R summary]:** Averaged over many days, volume and range per time slot form the U-shaped curve documented in microstructure research — [LuxAlgo time-of-day](https://www.luxalgo.com/library/concept/intraday-time-of-day-effects.md)
- **Vol-scaled bands in practice [WP]:**
  - Zarattini, Aziz & Barbon's SPY intraday momentum strategy builds a **"Noise Area"**: open price of day t ± the average absolute move from the open to each minute HH:MM over the last 14 days (multiplier 1), adjusted for overnight gaps.
  - Breakouts beyond the band trigger trend-following entries with dynamic trailing stops (VWAP-based).
  - Reported 2007-early 2024 results, net of costs: Sharpe **1.33**, 19.6% annualized, 1,985% total.
  - Source: [SFI working paper 24-97](https://www.sfi.ch/de/publications/n-24-97-beat-the-market-an-effective-intraday-momentum-strategy-for-s-p500-etf-spy); [Concretum](https://concretumgroup.com/beat-the-market-an-effective-intraday-momentum-strategy-for-sp500-etf-spy/); [TradingView Concretum Bands](https://ar.tradingview.com/script/CUpWCZhe-Concretum-Bands)
- **Volatility-size feedback [R]:** In E-mini S&P futures, traders size orders by the risk of the position, so transaction size shrinks in more volatile environments (Andersen, Bondarenko, Kyle & Obizhaeva) — [as summarized in search; see W&M scholarworks](https://scholarworks.wm.edu/items/94312f18-f52b-45ab-82af-2d4960a18529)

### Inferences
- **Recommended pipeline:**
  - (a) HAR-RV (log form) on 5-min RV gives tomorrow's daily σ̂.
  - (b) Blend with VIX1D-implied σ after a VRP haircut (scale VIX1D down by its historical implied/realized ratio).
  - (c) Distribute across the day with a periodicity profile s(τ), estimated as mean |r| per 5-min bucket over 60-250 days, with separate profiles for event days (8:30 data, 2:00 FOMC).
  - (d) Expected vol for bar τ: σ̂_τ = σ̂_day × s(τ)/√(Σs²).
  - (e) Stops at k×σ̂ over the holding horizon; position size ∝ (risk budget) / (k × σ̂ × point value).
- **This is volatility targeting at intraday scale.** Its main benefit is stabilizing per-trade risk across regimes (VIX 12 vs VIX 35 days differ ~3× in range), not adding alpha.
- **GARCH(1,1) on intraday returns without removing periodicity gives misleading persistence estimates.** That is the core point of Andersen & Bollerslev 1997.

### Gaps
- No primary source retrieved that quantifies the SPY/ES intraday U-shape (e.g., volatility ratio of the first 30 min vs midday) for 2020-2026.
- Comparative evidence on GARCH vs HAR vs implied-vol blends for *intraday stop sizing* (as opposed to daily RV forecasting) was not found.

## 4. Regime detection: trend vs mean-reverting days, HMM, Hurst, variance ratios, efficiency ratio, ADX, initial balance

### Takeaway
The most robust published "regime" evidence at intraday horizons is (a) **market intraday momentum**: the first half-hour (and rest-of-day) return predicts the last half-hour, more strongly on high-volatility, high-volume and macro-news days, and is linked to gamma-hedging; and (b) the **LeBaron effect**: intraday serial correlation falls (more mean-reversion) when volatility is forecast high. HMM, Hurst and initial-balance day-type taxonomies are popular, but I found **no rigorous out-of-sample intraday evidence** for them. Naïve opening-range-breakout results fail an independent net-of-cost replication.

### Cited Findings
- **Market intraday momentum [R]:** Gao, Han, Li & Zhou (2018, JFE) find, using SPY 1993-2013, that the first half-hour return (measured from the prior close) predicts the last half-hour return. The effect is stronger on more volatile days, higher-volume days, recession periods, and major macro-news days — [WUSTL profile](https://profiles.wustl.edu/en/publications/market-intraday-momentum/); [Alpha Architect](https://alphaarchitect.com/2014/08/attention-prop-traders-the-first-half-hour-of-trading-predicts-the-last-half-hour/)
- **Effect size [R/P]:** Out-of-sample R² up to **1.8%** (first half-hour alone) and **2.7%** (first plus 12th half-hour) in an earlier version. A CXO replication for Aug 2012-May 2014 found a weaker fit (correlation 0.12, R² 0.014) and warned about data snooping and ignored frictions — [CXO Advisory](https://www.cxoadvisory.com/?p=25481); [CXO first/last half hours](https://cxoadvisory.com/calendar-effects/first-and-last-half-hours-of-trading-linked)
- **International replication [R]:** Significant first-to-last half-hour predictability in 12 of 16 markets — [as reported in search summary; Reading accepted version](https://reading-9.eprints-hosting.org/95566/1/Accepted-Version.pdf)
- **Mechanism, gamma hedging [R]:** Baltussen, Da, Lammers & Martens (2021, JFE 142:377-403):
  - Across 60+ futures (equity, bond, commodity, FX), 1974-2020, the rest-of-day return positively predicts the last 30 minutes.
  - The effect reverts over subsequent days.
  - It is tied to gamma hedging by option and leveraged-ETF market makers (negative dealer gamma means hedgers buy rallies and sell dips).
  - Source: [JFE PDF (nd.edu)](https://www3.nd.edu/~zda/intramom.pdf); [EUR repository](https://pure.eur.nl/en/publications/hedging-demand-and-market-intraday-momentum/)
- **0DTE dampening, contra amplification fears [WP]:**
  - Dim, Eraker & Vilkov (2024) find higher 0DTE open-interest gamma associates with **lower** same-day realized volatility, with no carry-over to overnight vol. They find no evidence that 0DTE delta hedging amplifies moves.
  - A related study finds the dampening fades after about an hour.
  - Dissent: a 2026 Princeton thesis finds the dealer-hedging channel adds little to intraday variance forecasts, and notes other studies find positive 0DTE-volatility links.
  - Source: [Harbourfront summary](https://harbourfrontquant.substack.com/p/impact-of-zero-dte-options-on-the); [Quantpedia](https://quantpedia.com/?p=43821); [Princeton thesis](https://theses-dissertations.princeton.edu/entities/publication/61115cd1-cb09-4a8b-9230-ff488fc2a386)
- **LeBaron effect / variance ratio [R]:** Bianco, Corsi & Renò (PNAS 2009) use overlapping-observation variance-ratio statistics on S&P 500 futures (1993-2007, 4,344 days, 5-min grid). Intraday serial correlation is **negatively** related to forecast volatility and **positively** related to unexpected volatility. A related study notes VR tests on index futures are reliable only at scales < ~20 min given heteroskedasticity — [arXiv 0810.4912](https://arxiv.org/pdf/0810.4912); [arXiv physics/0610023](https://arxiv.org/pdf/physics/0610023)
- **Hurst exponent pitfall [WP]:** On E-mini S&P 1-minute data (514 sessions, Apr 2024-Mar 2026), an R/S-based Hurst blend gives H ≈ **0.66**. The authors call this strongly upward-biased by short-range autocorrelation; the GPH estimator indicates near-random-walk behavior. Single preprint, not peer-reviewed — [SSRN 6809080](https://papers.ssrn.com/abstract=6809080)
- **Kaufman Efficiency Ratio [P definition]:** ER = |P_t − P_{t−n}| / Σ|P_i − P_{i−1}| over n bars. It ranges 0 (pure chop) to 1 (straight line). Origin: Kaufman, *Smarter Trading* (1995). Implementations differ on 0/0: StockSharp returns 0, TA-Lib returns 1 — [TA-Lib ER](https://ta-lib.org/functions/er.html); [StockSharp](https://doc.stocksharp.com/en/topics/api/indicators/list_of_indicators/kaufman_efficiency_ratio)
- **HMMs [P only]:** Sources are tutorials and blogs. Typical use is a 2-3 state volatility HMM that blocks trades in high-vol states. Out-of-sample tests found are informal, on daily data, or tiny (120 days of Indian equities). No rigorous S&P intraday HMM evidence was found — [QuantStart](https://www.quantstart.com/articles/market-regime-detection-using-hidden-markov-models-in-qstrader/); [QuantInsti](https://blog.quantinsti.com/market-regime-detection-hidden-markov-model-project-fahim/); [Capital Spectator](https://capitalspectator.com/?p=3722); [LSEG developer article](https://developers.lseg.com/en/article-catalog/article/market-regime-detection)
- **Market Profile day types [P]:**
  - Dalton's *Mind Over Markets* (building on Steidlmayer, CBOT) classifies sessions by range extension beyond the **initial balance (IB, first-hour range)**: Normal, Normal Variation, Trend, Double-Distribution Trend, Non-Trend, Neutral.
  - Trend days typically have a *narrow* IB and persistent one-way extension. Normal days have a wide IB and rotate inside it. Normal-variation days extend about 1× IB on one side.
  - Frequency claims (e.g., "normal day 50-60%") conflict and are unsourced.
  - Source: [LuxAlgo day-type taxonomy](https://www.luxalgo.com/library/concept/day-type-taxonomy/); [NexusFi](https://nexusfi.com/a/market-structure/market-profile-day-types); [Marketcalls](https://www.marketcalls.in/market-profile/market-profile-different-types-of-profile-days.html)
- **Opening-range breakout [WP vs replication]:**
  - Zarattini & Aziz ("Can Day Trading Really Be Profitable?", SSRN 4416622) trade the direction of the first 5-min candle, with a stop at the opposite extreme and a target of 10R or the close. Reported: 24% hit rate, +0.13R per trade, ~33%/yr on QQQ at 4× leverage. Commissions are charged but no spread or slippage, and there is no OOS period.
  - An independent replication on five index CFDs (2015-2026) reproduced the gross edge on NQ (+0.131R, 23.2% hits). Net of costs, no market differed from zero and four of five were negative.
  - Source: [MQL5 replication blog](https://www.mql5.com/en/blogs/post/776235)
- **Noise-area regime filter [WP]:** The Zarattini-Aziz-Barbon SPY strategy (Section 3) defines a "trend day" as a break of the 14-day average-move band. The paper tests performance across volatility regimes and against dealer gamma imbalance (details not retrieved) — [SFI WP 24-97](https://www.sfi.ch/de/publications/n-24-97-beat-the-market-an-effective-intraday-momentum-strategy-for-s-p500-etf-spy)

### Inferences
- **Early identification is partially possible, but only probabilistically.**
  - The first-30-min return explains only ~1-3% of last-30-min variance (R²). That is economically meaningful for an ES/SPY strategy with tiny costs, but the trend/range verdict stays uncertain until late in the day.
  - A practical classifier would combine: |first-hour move| / EM (Section 2); IB width relative to the 20-day average IB; ER over the first 60 one-minute bars; cumulative TICK slope and $ADD monotonicity (Section 1); dealer gamma sign (Section 6); and an event-day flag.
  - Label historical days ex post (e.g., close location in the range, range/EM, ER of the full session) and fit a logistic or gradient-boosted classifier using only first-hour features, then evaluate walk-forward.
- **ADX** (standard Wilder definition: DX = 100·|+DI − −DI| / (+DI + −DI), ADX = Wilder-smoothed DX, usually 14 periods). It measures trend strength without direction, like ER but laggier. This definition is from standard references and was not verified with a source in this session.
- **Lo-MacKinlay variance ratio:** VR(q) = Var(r_t + … + r_{t−q+1}) / (q·Var(r_t)). VR > 1 implies trending and VR < 1 mean-reverting. Use overlapping observations and heteroskedasticity-robust z-statistics (formula standard; not separately sourced here). Per Bianco et al., expect VR < 1 more often on high-vol days.
- **Hurst on 1-min data should be treated as unreliable** unless corrected for short memory (GPH or DFA with checks).

### Gaps
- No rigorous published study found that measures the accuracy of IB-based or first-hour trend-day classification for ES/SPY out of sample.
- No peer-reviewed intraday HMM study for US index products found.
- Post-2013 out-of-sample performance of Gao et al. intraday momentum in SPY (2014-2026) was not found in a rigorous source. It is unclear whether it decayed after publication, though the 2012-14 CXO replication was weaker.
- The full text of Zarattini-Aziz-Barbon 2024 (regime splits, gamma results) was not retrieved.

## 5. Cross-asset lead-lag at intraday horizons (ES vs SPY, NQ vs ES, Treasuries, DXY, VIX futures, oil, crypto, mega caps)

### Takeaway
Futures (ES, NQ) dominate index price discovery (Hasbrouck 2003). But the lead that was **20-45 minutes in the 1980s** (largely stale cash-index prices) had collapsed to a **median 97 ms in 2005 and 7 ms in 2011** for ES-SPY, and later microsecond-scale races. For a non-colocated trader, "ES leads SPY" is **not tradeable** as an arbitrage. Cross-asset signals (rates, dollar, crypto, mega caps) are useful only as **slower context** (risk-on/risk-off confirmation, macro-driver identification). I found no rigorous minute-scale exploitable lead from Treasuries, DXY, oil, crypto or mega caps to US index futures.

### Cited Findings
- **1980s lead [R]:** Kawaller, Koch & Koch (1987, JF 42(5):1309-1329), using minute data, found S&P 500 futures movements consistently led the cash index by **20-45 minutes**, while index moves rarely affected futures beyond 1 minute — [IDEAS](https://ideas.repec.org/a/bla/jfinan/v42y1987i5p1309-29.html); [abstract mirror](https://scholarhub.vn/publication/:slug/74c70296-143a-413d-818f-cedcf227bfb7)
- **E-mini dominance [R]:** Hasbrouck (2003, JF 58(6):2375-2400) finds that for the S&P 500 and Nasdaq-100, most price discovery occurs in the **E-mini** market, and E-mini price changes generally lead regular futures and ETFs (SPY, QQQ). For the S&P 400 MidCap, discovery is split between futures and the ETF. SPY contributes markedly to sector-ETF price discovery — [IDEAS](https://ideas.repec.org/a/bla/jfinan/v58y2003i6p2375-2400.html); [NYU working paper](https://archive.nyu.edu/jspui/bitstream/2451/27374/2/FIN-00-046.pdf)
- **Millisecond decay of the ES-SPY lag [R]:**
  - Budish, Cramton & Shim (2015, QJE), ES vs SPY 2005-2011: the pair is nearly perfectly correlated at minute, hour and day horizons, but the correlation "breaks down completely" at millisecond frequencies.
  - Median arbitrage duration fell from **97 ms (2005) to 7 ms (2011)** while arbitrage profitability stayed roughly constant: the arms race raised the speed bar without shrinking the prize.
  - Later LSE data (Aquilina, Budish & O'Neill) show modal race durations of **5-10 µs**.
  - Source: [Richmond Fed summary](https://www.richmondfed.org/publications/research/econ_focus/2015/q3/research_spotlight); [NY Fed slides](https://www.newyorkfed.org/medialibrary/media/newsevents/events/markets/2015/A-Market-Design-Perspective-HFT-Debate.pdf); [arXiv 2602.22350](https://arxiv.org/pdf/2602.22350)
- **Treasuries [R]:**
  - NY Fed: in Treasury cash vs futures, lead-lag direction flips at millisecond offsets; "the two markets can effectively be seen as one." Near-simultaneous cross-market trading is up to 20% of cash activity.
  - Dobrev & Schaumburg (Atlanta Fed conference paper) find price discovery in both Treasuries and equities happens primarily in **futures**. Cross-market activity tracks volatility, which matters for stress episodes (2010 flash crash, 2014 Treasury flash rally).
  - Source: [Liberty Street Economics 2015](https://libertystreeteconomics.newyorkfed.org/2015/08/high-frequency-cross-market-trading-in-us-treasury-markets); [Dobrev-Schaumburg](https://www.atlantafed.org/-/media/documents/news/conferences/2018/1018-financial-stability-implications-of-new-technology/papers/dobrev-schaumburg_high-frequency-cross-market-trading.pdf)
- **Crypto [R/WP]:** No study found that directly measures bitcoin futures vs ES lead-lag. Using 1-sec CME bitcoin futures and SPY (2017-2021), one study finds rising institutional futures share *lowers* the BTC-S&P correlation. Trading-hour mismatch (CME BTC nearly 24h vs SPY 9:30-16:00) complicates tests. Spot-vs-futures leadership within crypto is contested — [PMC 9476405](https://pmc.ncbi.nlm.nih.gov/articles/PMC9476405); [arXiv 2506.08718](https://arxiv.org/pdf/2506.08718)
- **Large stocks lead small [R]:** Common information is incorporated first in large stocks, then transmitted to small stocks with a lag — [NY Fed SR303](https://www.newyorkfed.org/medialibrary/media/research/staff_reports/sr303.pdf)
- **Non-US analogues [R]:**
  - Hang Seng: the cash index lags futures most, reflecting stale component prices; arbitrageurs trade the ETF and the largest constituents. Sampling frequency strongly affects measured lead-lag.
  - EuroStoxx50 futures significantly lead single stocks and the ETF at ultra-high frequency.
  - Source: [HKBU sampling frequency study](https://scholars.hkbu.edu.hk/en/publications/the-impact-of-sampling-frequency-on-intraday-correlation-and-lead-10/); [Frankfurt thesis](https://www.efinance.wiwi.uni-frankfurt.de/en/teaching/master-theses/selection-of-completed-theses/lead-lag-structures-in-ultra-high-frequency-trading.html); [IDEAS lead-lag arbitrage profitability](https://ideas.repec.org/p/ris/crcrmw/2022_005.html)

### Inferences
- **Why the 1987 lag vanished:** the 20-45 min lag was largely a *measurement artifact* of stale cash-index components (infrequent trading) plus pre-electronic frictions. Once components trade continuously and arbitrage is automated, the residual lag is a latency race (ms→µs) that a retail or non-colocated algorithm cannot win.
- **Practical uses for a non-HFT algo:**
  - (a) Use ES/NQ as the *signal* instrument even when trading SPY/QQQ or SPX options, since futures carry the freshest price and trade nearly 23h.
  - (b) Use 10Y/2Y yields (ZN/ZT futures), DXY and VIX futures as *driver identification*. On CPI/FOMC days, equity-yield correlation tells you whether the market is trading "rates" (inflation/discount-rate) or "growth."
  - (c) Use the NQ/ES ratio and mega-cap tape as a concentration gauge.
  - Minute-scale *predictive* leads from these markets should be assumed arbitraged away unless shown out of sample with realistic latency.
- **Mega caps (NVDA, AAPL, MSFT) vs index ETFs:** ETF and futures arbitrage links them at ms horizons. The index is mechanically the weighted sum, so a mega-cap "lead" over SPY at retail-tradeable horizons is unlikely except around single-name events such as earnings after the close, which move NQ/ES overnight.

### Gaps
- No rigorous study found that quantifies current (2020-2026) intraday lead-lag from Treasuries, DXY, oil or bitcoin to ES/NQ at 1-60 second or minute horizons.
- No US-specific study found on mega-cap single stocks leading SPY/QQQ intraday.
- NQ vs ES information share in recent years was not found.
- Budish et al.'s post-2011 ES-SPY race durations (US data) were not found. The µs figures are from LSE data.

## 6. Scheduled events and the macro calendar (FOMC, CPI/NFP/PCE, earnings, auctions, OPEX, triple witching, rebalances, month-end, turn-of-month)

### Takeaway
Calendar effects on the US index are real but **unstable after publication**:
- The **pre-FOMC drift** (≈50 bp, 1994-2011) persisted only for press-conference meetings to 2018 and then **essentially disappeared after 2015** (Kurov et al., through 2019).
- The **FOMC-cycle even-week** pattern and **turn-of-month** effect are strong in-sample, with no clean post-publication OOS test found.
- **Month-end reversals** (dash for cash) and **OPEX-week strength** are documented but modest.
- The most reliable event facts for an intraday algo are **mechanical**: volatility and implied-vol spikes into 8:30/2:00 releases, a brief liquidity withdrawal just before releases, sub-second repricing, and huge closing-auction volume on rebalance/expiry days.

### Cited Findings
- **Pre-FOMC drift, original [R]:** Lucca & Moench (2015, JF 70:329-371; NY Fed SR512):
  - Excess equity returns in the 24 hours before scheduled FOMC announcements account for >80% of the US equity premium over 1994-2011.
  - Similar effects appear in other international indices, but not in Treasuries, money-market futures or the dollar, and not before other macro releases.
  - Source: [NY Fed SR512](https://www.newyorkfed.org/medialibrary/media/research/staff_reports/sr512.pdf); [Kurov et al. summary](https://ideas.repec.org/a/eee/finlet/v40y2021ics1544612320315956.html)
- **NY Fed 2018 update [R]:**
  - Original sample: equities ended announcement day "almost 50 basis points" above the prior day's open.
  - April 2011-June 2018, **press-conference meetings**: ~40 bp drift from the prior day's open to about lunchtime on announcement day, plus ~30 bp more by the end of the press conference. The drift started earlier (prior morning), consistent with front-running.
  - Non-press-conference meetings: no excess returns before the statement.
  - All meetings have had press conferences since 2019.
  - Source: [Liberty Street Economics, Nov 2018](https://libertystreeteconomics.newyorkfed.org/2018/11/the-pre-fomc-announcement-drift-more-recent-evidence.html)
- **Disappearance [R]:** Kurov, Wolfe & Gilbert (2021, Finance Research Letters 40) extend to Dec 2019: the drift "essentially disappeared after 2015" for both press-conference and non-press-conference meetings, attributed to reduced uncertainty — [IDEAS](https://ideas.repec.org/a/eee/finlet/v40y2021ics1544612320315956.html); [Skidmore PDF](https://www.skidmore.edu/economics/documents/KurovWolfeGilbert-TheDisappearingPre-FOMC-Announce-Drift-200914.pdf)
- **Conditional drift [R/WP]:** Guo, Hung & Kontonikas (2020) find the drift only in high-sentiment / low-policy-uncertainty regimes. Ignatieva & Ohashi (2025) find a short-lived press-conference effect. Pan & Peng (data to Dec 2022) find a pre-FOMC drift in *long Treasuries* tied to uncertainty — [IDEAS Applied Economics 2025](https://ideas.repec.org/a/taf/applec/v57y2025i17p2021-2037.html); [Pan slides](https://en.saif.sjtu.edu.cn/junpan/slide_FOMC_AFA.pdf)
- **FOMC cycle [R]:** Cieslak, Morse & Vissing-Jorgensen (2019, JF 74(5)): since 1994 the equity premium is earned **entirely in even weeks (0, 2, 4, 6)** of FOMC-cycle time. They attribute it to Fed information flows (intermeeting changes, Board meetings) and unexpectedly accommodating policy. Robust across sub-periods; no holdout OOS test found — [Stern PDF](https://stern.nyu.edu/sites/default/files/assets/documents/cycle_paper_cieslak_morse_vissingjorgensen.pdf); [SSRN](https://papers.ssrn.com/abstract=2687614)
- **Implied vol around CPI/FOMC [exchange]:** VIX1D +61.4% the day before CPI/FOMC and −24.8% on the day (20 events, 2022-23). The VIX1D 20-day HV peaked at 572.6 on Feb 1, 2023 (FOMC day) — [Cboe 11 charts](https://www.cboe.com/insights/posts/how-the-vix-1-d-index-performance-compares-to-the-vix-index-and-other-volatility-indices-in-11-charts/)
- **CPI realized moves [P/press]:** November 2022 CPI: SPX +5.5%, the best first-day CPI reaction since at least 2003. Of 12 releases, SPX rose on 8 release days, and some large day-1 moves partly reversed over the following days — [Bloomberg](https://www.bloomberg.com/news/articles/2025-01-14/traders-brace-for-s-p-500-s-busiest-cpi-day-since-march-2023); [Rhoads](https://russellrhoads.substack.com/p/historical-index-and-option-price)
- **Liquidity at releases, E-mini 1-sec data 2008-2013 [WP]:**
  - Price impact rises *before* announcements (t−1 coefficient +0.129, p<0.01).
  - Flow impact and flow volatility *fall* before releases (strongest 8:55-9:00 CT), consistent with traders withholding orders. Return-innovation volatility spikes at release.
  - Shocks "dissipate almost entirely within a second."
  - Mean top-of-book depth was ~630 contracts; the spread was almost always 1 tick (0.25).
  - Covers 9:00 CT releases (ISM, consumer confidence, etc.), not 7:30 CT CPI/NFP.
  - Source: [arXiv 2508.06788](https://arxiv.org/html/2508.06788v2)
- **CME view [exchange, self-interested]:** A CME note reports strong ES liquidity throughout a jobs report. An Oct 2018 employment analysis found significant liquidity before and after — [Institutional Investor / CME](https://www.institutionalinvestor.com/index%2ephp/article/2bsw6tz7bhgc54eir52ps/innovation/on-jobs-report-day-s-p-500-futures-provide-a-liquid-market); [Risk Library](https://risklibrary.net/29616)
- **Unscheduled stress [P]:** E-mini order-book depth collapsed ~90% at the height of the April 2025 tariff turmoil — [Global Trading](https://www.globaltrading.net/?p=38057)
- **Turn of the month [R]:** McConnell & Xu (2008, FAJ 64(2)):
  - Over 1926-2005, nearly all US excess return accrued from the last trading day of the month through the 3rd trading day of the next month. Over 1987-2005, *all* of it did.
  - Present in 31 of 35 countries and in small and large caps. Volatility is not higher in that window, and volume/flow measures don't explain it.
  - First documented by Lakonishok & Smidt (1988).
  - Source: [CFA Institute FAJ](https://rpc.cfainstitute.org/research/financial-analysts-journal/2008/equity-returns-at-the-turn-of-the-month); [IDEAS](https://ideas.repec.org/a/taf/ufajxx/v64y2008i2p49-64.html)
- **Month-end liquidity, "dash for cash" [R]:** Etula, Rinne, Suominen & Vaittinen (2020, RFS 33(1):75-111): month-end payment cycles cause temporary spikes in the cost of debt and equity capital across liquid markets worldwide, driven by institutions. Slides describe a market-level return reversal around **T−4 before month-end**; the ~$30bn/yr cost estimate is from slides and unverified — [Aalto](https://research.aalto.fi/en/publications/dash-for-cash-monthly-market-impact-of-institutional-liquidity-ne/); [OUP RFS](https://academic.oup.com/rfs/article/33/1/75/5494694); [Aalto slides](https://mycourses.aalto.fi/mod/resource/view.php?id=440112)
- **OPEX week [R]:** Stivers & Sun (2013, JBF 37(11)) find option-expiration-week (third-Friday week) returns are high for S&P 100 stocks and the S&P 500 (1996-2008; not before 1983). The following week modestly underperforms. Proposed causes: market-maker delta-hedge rebalancing (unwinding short-stock hedges) and declining risk perceptions — [IDEAS](https://ideas.repec.org/a/eee/jbfina/v37y2013i11p4226-4240.html); [CXO drill-down](https://cxoadvisory.com/calendar-effects/option-expiration-week-stock-return-drill-down)
- **0DTE dominance [exchange]:** 0DTE reached a record **66.2%** of SPX options volume in July 2026, up from ~20% in 2020 and >50% by 2024. Record SPX 0DTE ADV of 3.4M contracts (Sept 2026) and 3.2M quarterly — [Trade Informer / Cboe July 2026](https://tradeinformer.com/institutional-trading/cboe-reports-july-options-and-fx-growth-as-0dte-reaches-66-2-of-spx-volume); [Cboe Sept 2026 metrics](https://www.cboe.com/insights/posts/market-metrics-that-matter-derivatives-september-2026-volume-highlights); [Schaeffer's](https://www.schaeffersresearch.com/content/bgs/2026/03/24/how-0dte-options-can-explain-market-movement)
- **Closing auctions and rebalances [P/exchange]:**
  - In 2024 the closing auction averaged ~$50bn per day, ~**9%** of daily volume, and about **20%** on index-rebalance or option-expiration days (BMLL).
  - The Nasdaq Closing Cross set a record of 4.59bn shares / **$334.0bn** at the June 2026 Russell reconstitution, vs ~2.51bn / $102.5bn in 2025. NYSE traded $114.7bn at the June 2025 close.
  - Source: [BMLL](https://www.bmlltech.com/news/market-insight/into-the-close-unpacking-u-s-closing-auction-dynamics-and-the-impact-of-the-russell-reconstitution); [Nasdaq/Barchart June 2026](https://www.barchart.com/story/news/36754045/record-trading-volume-on-the-nasdaq-closing-cross-during-the-june-2026-russell-us-indexes-reconstitution); [Markets Media](https://www.marketsmedia.com/record-trading-volume-on-nasdaq-closing-cross-in-russell-reconstitution/)
- **Russell goes semi-annual [exchange]:** The first December reconstitution in 30+ years takes effect after the close **Friday Dec 11, 2026**. Rank Day was Oct 30; preliminary lists Nov 13; lockdown from Nov 30 — [LSEG press release Sept 1, 2026](https://www.lseg.com/en/media-centre/press-releases/ftse-russell/2026/ftse-russell-announces-december-2026-russell-us-indexes-reconstitution-schedule); [LSEG research Dec 2025](https://lseg.com/en/ftse-russell/research/russell-us-indexes-move-to-semi-annual-reconstitution)
- **Intraday momentum stronger on macro-news days [R]:** Gao et al. (2018) — [WUSTL](https://profiles.wustl.edu/en/publications/market-intraday-momentum/)

### Inferences
- **Event-handling policy for the algorithm:**
  - (1) Maintain a calendar: CPI/NFP/PCE/PPI 8:30 ET; ISM/JOLTS/UMich 10:00; FOMC 2:00 statement / 2:30 presser; Treasury refunding and auctions (1:00 pm results); mega-cap earnings (usually after the close); monthly OPEX (3rd Friday); quarterly triple witching; S&P quarterly rebalances; Russell (June and now December); month-end (last day, plus T−4 reversal risk); turn-of-month window.
  - (2) **Flat or reduced size from ~T−2 min to T+1-5 min around tier-1 releases.** Pre-release book thinning and sub-second repricing (5 ms per Chordia et al., Section 7) mean no edge for non-colocated traders, and slippage risk is maximal.
  - (3) After the first impulse, **intraday momentum is stronger on news days** (Gao et al.), so post-release trend-following with vol-scaled stops is better supported than fading.
  - (4) Expect vol crush in 0DTE/VIX1D right after the event, which affects options strategies.
  - (5) On rebalance and expiry days, expect a disproportionate last-10-minute flow and closing-auction imbalance; MOC imbalance publications (NYSE/Nasdaq, ~3:50 pm ET) become key inputs.
- **Do not trade the pre-FOMC drift as a standalone strategy in 2026.** Post-2015 evidence says it vanished. If it is used at all, condition on regime (low uncertainty / high sentiment).
- **The FOMC-cycle and turn-of-month effects are daily-horizon tilts.** For an intraday algo they are, at best, size modifiers (e.g., slightly larger long bias in turn-of-month windows). They have no post-publication validation in what I found.

### Gaps
- No rigorous 2020-2026 subsample study of the pre-FOMC drift for US equities was found (Kurov et al. end in 2019).
- No out-of-sample test of the Cieslak et al. even-week pattern after 2016 was found.
- No 2015-2026 update of the turn-of-month effect from an academic source was found.
- No rigorous source quantified ES spread/depth at 8:30 CPI/NFP specifically for 2022-2026 (the arXiv study covers 9:00 CT releases, 2008-2013).
- Treasury-auction effects on intraday equities and mega-cap earnings spillovers to the index were not researched with sources.
- The triple-witching-specific volatility/return effect was not separately sourced.

## 7. News and sentiment at intraday horizons (speed of reaction, machine-readable news, social media)

### Takeaway
Scheduled macro news is priced in **~5 ms** in SPY and ES (Chordia, Green & Kottimukkalur 2018). E-mini order-flow shocks dissipate within about a second. Even a two-second early feed was monetized in milliseconds (Michigan sentiment 2013). A non-colocated trader therefore has **no edge on headline speed**. Social-media sentiment shows **weak, short-lived intraday predictability** (first-half-hour sentiment → last half-hour SPY return), which often reverses within the day.

### Cited Findings
- **Reaction speed [R]:** Chordia, Green & Kottimukkalur (2018, RFS 31(12):4650-4687):
  - SPY and ES respond to macro surprises **within 5 ms**, with trading intensity up more than **100-fold** after the release.
  - Low-latency profits are small: ~$19,000 per event (SPY) and ~$50,000 (ES). Speed rose without profits rising, and order flow became less informative, meaning prices jump on the news itself.
  - Earlier drafts reported ~0.1 s.
  - Source: [IDEAS](https://ideas.repec.org/a/oup/rfinst/v31y2018i12p4650-4687..html); [UNSW seminar PDF](https://www.unsw.edu.au/content/dam/pdfs/business/banking-finance/events/news-events/2021-10-busines-banking-finance-news-events-Low-Latency-Trading-on-Macroeconomic-Announcements.pdf)
- **Sub-second dissipation [WP]:** In E-mini 1-sec data, announcement shocks "dissipate almost entirely within a second" — [arXiv 2508.06788](https://arxiv.org/html/2508.06788v2)
- **Early-access episode [press]:** In 2013, Thomson Reuters gave paying clients University of Michigan sentiment data at 9:55 am (5 minutes early), and select high-speed clients **2 seconds** earlier still. Trading spiked within milliseconds of 9:54:58 — [Wikipedia: UMich sentiment](https://en.wikipedia.org/wiki/University_of_Michigan_Consumer_Sentiment_Index)
- **Latency race scale [R]:** ES-SPY arbitrage duration was a median 7 ms by 2011 (Budish et al.) — [Richmond Fed](https://www.richmondfed.org/publications/research/econ_focus/2015/q3/research_spotlight)
- **Social-media sentiment [R]:** Renault (2017, JBF) uses StockTwits and finds the first-half-hour change in online investor sentiment predicts the last-half-hour S&P 500 ETF return. A Glasgow thesis (30-min StockTwits) finds positive prediction that often **reverses within the same day**. Sun, Najand & Shen (MarketPsych/Thomson Reuters sentiment, 1998-2011) find prior-half-hour sentiment changes predict SPY half-hour returns, mostly in the final intervals — [AUT review](https://openrepository.aut.ac.nz/bitstreams/a167871d-2157-4ab4-9a9b-715166d4e8ed/download); [Glasgow thesis](https://theses.gla.ac.uk/84857); [CXO high-frequency sentiment](https://www.cxoadvisory.com/sentiment-indicators/high-frequency-investor-sentiment-and-stock-returns)
- **Horizon limits [R/WP]:** Individual-stock StockTwits sentiment predicts returns mainly within about an hour, not at the daily level — [CXO: distilling social media](https://www.cxoadvisory.com/sentiment-indicators/distilling-social-media-to-trade-the-stock-market/)

### Inferences
- **For a non-colocated algo, news is a *context and risk* input, not an alpha input:**
  - (a) Calendar-driven stand-aside windows (Section 6).
  - (b) Unscheduled-headline detection (e.g., a volatility burst or spread blowout in ES detected in real time) as a kill-switch or size-down trigger.
  - (c) Slow sentiment features (pre-open social/news sentiment, overnight move/EM) as day-type priors.
- **Machine-readable news (e.g., RavenPack, Bloomberg/Reuters feeds) helps mainly in classifying *what kind* of day it is**, such as a macro-driven tariff shock versus an idiosyncratic mega-cap event, rather than in racing the headline.

### Gaps
- No rigorous source found on Reddit/WallStreetBets sentiment predicting *index* (SPY/QQQ) intraday returns. Evidence is single-stock and meme-focused.
- No rigorous source retrieved on machine-readable news (RavenPack etc.) for index-level intraday returns.
- The academic Hu, Pan & Wang paper on the Michigan early-release episode could not be located through search. Only press-level facts were retrieved.

## 8. Time-of-day effects (open, lunch, power hour, closing auction; overnight vs intraday split; optimal windows)

### Takeaway
Volatility and volume are **U-shaped**. The open (first 30 min) carries the most information and the widest ranges. Midday is the lull. The last 30 minutes shows **momentum continuation** tied to gamma and leveraged-ETF hedging (Gao et al. 2018; Baltussen et al. 2021). The **closing auction** is ~9% of daily volume (~20% on rebalance/expiry days). Historically **most S&P 500 returns accrued overnight**, but the split is unstable in recent subperiods. The best-documented intraday windows to *act* are the **first 30-60 min** (information, setting day type) and the **last 30 min** (momentum), with the midday lull best reserved for mean-reversion or standing aside.

### Cited Findings
- **First half-hour → last half-hour [R]:** Gao et al. (2018, JFE), SPY 1993-2013. Out-of-sample R² up to 1.8%/2.7% (earlier version). Weaker in a 2012-2014 replication (R² 0.014) — [WUSTL](https://profiles.wustl.edu/en/publications/market-intraday-momentum/); [CXO](https://www.cxoadvisory.com/?p=25481)
- **Rest-of-day → last 30 min across 60+ futures [R]:** 1974-2020, reverting over subsequent days, linked to gamma hedging by option and leveraged-ETF market makers — [Baltussen et al. JFE 2021](https://www3.nd.edu/~zda/intramom.pdf)
- **Earlier entry can beat waiting for the last half hour [WP]:** The Zarattini-Aziz-Barbon SPY model enters as soon as price breaks the noise area rather than waiting for the final 30 minutes. Reported Sharpe 1.33 net (2007-2024). Not yet independently replicated in sources found — [SFI WP 24-97](https://www.sfi.ch/de/publications/n-24-97-beat-the-market-an-effective-intraday-momentum-strategy-for-s-p500-etf-spy)
- **Opening auction / early session [exchange]:** Higher volatility early in the day has traditionally made many participants reluctant to trade the first 15-30 minutes — [NYSE data insights](https://nyse.com/data-insights/opening-auction-filling-behaviors-opportunities-early-in-the-day)
- **U-shape [P summary of R]:** Volume and range per time slot form the documented U-shaped curve — [LuxAlgo](https://www.luxalgo.com/library/concept/intraday-time-of-day-effects.md)
- **Closing auction share [P/data vendor]:** ~$50bn per day, ~9% of daily volume in 2024; ~20% on rebalance/option-expiry days — [BMLL](https://www.bmlltech.com/news/market-insight/into-the-close-unpacking-u-s-closing-auction-dynamics-and-the-impact-of-the-russell-reconstitution)
- **Overnight vs intraday [R]:** Lou, Polk & Skouras (2019, JFE 134:192-213):
  - Momentum profits accrue almost entirely overnight; other strategies earn abnormal profits intraday, often with opposite signs across the two components.
  - Stronger for large-cap, high-price stocks.
  - Explained by investor heterogeneity: institutions trade intraday against momentum. Spread variation ~2%/month.
  - Source: [LSE PDF](https://personal.lse.ac.uk/polk/research/TugOfWar.pdf); [LSE Research Online](https://researchonline.lse.ac.uk/id/eprint/87481)
- **Index-level split [P]:** Over 30+ years, S&P 500 intraday (open-to-close) returns totaled only ~+12% while overnight compounded roughly 20-fold. Cliff, Cooper & Gulen (2008) are often cited for "all" equity returns coming overnight — [Nasdaq/Abstract Stocks](https://www.nasdaq.com/articles/like-night-and-day); [Alpha Architect](https://alphaarchitect.com/2015/02/overnight-momentum-vs-intraday-momentum/)
- **Instability [P]:** CXO finds the overnight advantage is not stable across arbitrary subperiods and does not hold in its most recent subperiod. The 1993-2006 ETF overnight-daytime spread averaged ~0.068% per day. SPY price-only results can differ from index results (dividend/methodology effects) — [CXO](https://www.cxoadvisory.com/?p=27932); [CXO 1993-2006](https://cxoadvisory.com/?p=1377); [FXStreet Aug 2025](https://www.fxstreet.com/analysis/who-is-getting-action-at-night-202508190629)
- **Day-of-week [P]:** A live tracker shows SPY intraday win rates of ~51-52% by weekday — [thetrading.tools weekday analysis](https://www.thetrading.tools/weekday-analysis)

### Inferences
- **Time-of-day policy:**
  - (1) 9:30-10:00 ET: highest information and range; the window for gauging day type (gap vs EM, IB building, internals, VWAP acceptance). Slippage is highest, so size down or use futures.
  - (2) ~11:30-13:30 ET: lull; lower vol, more chop (low ER). Favor mean-reversion or stand aside.
  - (3) 14:00 ET on FOMC days: event regime (Section 6).
  - (4) 15:30-16:00 ET: momentum continuation in the direction of the rest-of-day move, larger when dealer gamma is short or leveraged-ETF rebalancing is large (big day moves). MOC imbalances (~15:50) and quarter-end/rebalance flows dominate on calendar days.
- **The overnight/intraday asymmetry matters for strategy design.** An intraday-only, flat-overnight algorithm forgoes most of the historical equity premium, so its edge must come from intraday structure (momentum, vol-scaling, event avoidance), not from passive long exposure.
- **Because 0DTE now dominates SPX options volume (66% in July 2026)**, intraday dealer-hedging flows are a larger share of the time-of-day pattern than in the 1993-2013 samples. The academic evidence on whether 0DTE dampens or amplifies those flows is still contested (Section 4).

### Gaps
- No primary source retrieved that gives the 2024-2026 share of SPY/ES volume by half-hour (first 30 min, lunch, last 30 min).
- No rigorous 2015-2026 decomposition of SPX overnight vs intraday returns found. The reader should compute it from OHLC and dividend-adjusted data.
- No rigorous study found on an "optimal trading window" for retail-latency intraday index strategies net of costs, beyond the Gao/Baltussen/Zarattini results.
- The lunch-lull magnitude and power-hour effects beyond the last 30 minutes are not separately quantified in the sources found.

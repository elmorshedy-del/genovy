# Order Flow Analysis as a Short-Horizon Signal Source (US Equities and CME Equity Index Futures)

Scope note: Rigorous (peer-reviewed or academic working paper) evidence is kept apart from practitioner or vendor claims, and vendor material is labelled **[PRACTITIONER / NON-ACADEMIC]**. Horizons are given in the units each paper uses: clock time (ms, s, min), event time (number of mid-price changes or LOB updates), or "next mid-price move". Research cut-off: October 2026. Roughly 25 searches/fetches were run. Many full-text tables (for example the forecasting R² tables in Cont-Cucuringu-Zhang and Kolm et al.) could not be retrieved, and those gaps are flagged.

---

## 1. What "order flow" means quantitatively, and trade classification (aggressor side, Lee-Ready, tick test, BVC, CME aggressor flag)

### Takeaway
"Order flow" is used for several different measured quantities:
- **Signed trade flow.** Aggressor buy volume minus aggressor sell volume. Practitioners call this "delta" or CVD.
- **Order flow imbalance (OFI).** Net change in bid and ask queue sizes from limit orders, cancels and trades at the best quotes.
- **Multi-level or integrated OFI.**
- **Static queue or book imbalance.**
- **Volume-clock imbalance measures** such as VPIN.

In US equities the aggressor side has to be *inferred*:
- The tick rule gets about 77-79% of trades right.
- Lee-Ready gets about 87% with 1-second timestamps and about 94% with millisecond timestamps when tested against true signs.
- Bulk volume classification (BVC) is worse than the tick rule on equity data in the main US horse race. Its advocates argue it carries more "information" content.

CME MDP 3.0 publishes the aggressor side directly (tag 5797), so trade signing in index futures is close to exact. The exceptions are opening and auction trades and implied-liquidity trades.

### Cited Findings
**Definitions**
- Cont, Kukanov & Stoikov define OFI as the net order flow at the bid and ask, tracking changes in the size of the bid and ask queues. It "treats a market sell and a cancel buy of the same size as equivalent, since they have the same effect on the size of the bid queue." — [Cont, Kukanov & Stoikov, arXiv v3](https://arxiv.org/html/1011.6402v3)
- CKS argue that OFI is a more general supply/demand measure than the traditional trade imbalance, and that it captures the effect of trades on prices. They find the price-change vs. trade-volume relation "noisy and less robust" than the OFI relation. — [CKS slides (Columbia/Cornell)](https://www.smallake.kr/wp-content/uploads/2016/05/Kukanov.pdf); [Journal of Financial Econometrics abstract](https://academic.oup.com/jfec/article/12/1/47/816163)

**CME aggressor side (data fact)**
- In the MDP 3.0 Trade Summary message, tag 5797 AggressorSide takes the values 0 = no aggressor, 1 = buy, 2 = sell. Trades without an aggressor "occur at Market Open, after a Pre-Open or after a Pause, and also when the event includes customer order participation in a trade with a CME Globex-generated implied bid or offer." — [CME Client Systems Wiki, Trade Summary](https://cmegroupclientsite.atlassian.net/wiki/spaces/EPICSANDBOX/pages/457227733)
- CME defines an aggressor as "any customer order that triggers a trade immediately upon entering the book."
- All trades with a single aggressing order are reported together in one event.
- With Order Level Detail, the first Order Detail entry is the aggressor order (tag 346 NumberOfOrders gives the count of detail entries).
- Source for all three points: [CME Wiki, Trade Summary Order Level Detail](https://cmegroupclientsite.atlassian.net/wiki/spaces/EPICSANDBOX/pages/457225774/MDP+3.0+-+Trade+Summary+Order+Level+Detail)

**Accuracy of inferred classification, US equities**
- **Carrion & Kolay (Financial Review, online 2019).** Tested on a Nasdaq dataset with true trade signs (the Nasdaq HFT database):
  - tick rule correct on 78.62% of trades;
  - Lee-Ready with 1-second timestamps 86.88%;
  - Lee-Ready with millisecond timestamps 93.57%;
  - the Holden-Jacobsen interpolation method only 76.09%.
  - LR with ms data "shows little deterioration in performance in fast markets."
  - Source: [Carrion & Kolay, "Trade signing in fast markets"](https://doi.org/10.1111/fire.12218)
- **Chakrabarty, Pascual & Shkilko (2015, Journal of Financial Markets).** Using true classification from the Nasdaq INET order book:
  - tick rule 77.0% of volume correct in 2011 and 77.8% in 2005;
  - BVC 64.3% with 1-second bars up to 79.7% with roughly 1-hour bars, vs. 90.8% for a tick rule allowing offsetting at the 1-hour bar;
  - moving from TR to BVC raises misclassification by 7.4-16.3 percentage points (46%-291%);
  - ELO had reported BVC accuracy as high as 94.5% for E-mini S&P futures, which "suggests structural differences between equity and futures markets."
  - Source: [Chakrabarty, Pascual & Shkilko working paper](https://dee.uib.eu/digitalAssets/234/234006_Pascual.pdf); [RePEc abstract](https://ideas.repec.org/a/eee/finmar/v25y2015icp52-79.html)
- The same paper cites Chakrabarty et al. (2012): Lee-Ready misclassifies 21% at the trade level but has near-zero misclassification at the daily level, because errors offset. It also cites Holden & Jacobsen: withdrawn quotes and TAQ millisecond timestamp handling distort trade-quote matching. — [Chakrabarty, Pascual & Shkilko](https://dee.uib.eu/digitalAssets/234/234006_Pascual.pdf)
- **Panayides, Shohfi & Smith (Euronext Paris data).** They report that Lee-Ready underperforms, especially at high trade/quote frequency.
  - Volume-bar BVC improves on the tick test by up to 11.61%.
  - However, "bulk" tick (netted) beats BVC by 8.29-18.39% (time bars).
  - With calibrated bar sizes, the bulk tick advantage shrinks to about 1.49-1.72%.
  - BVC order imbalance correlates positively with the high-low range; tick-test imbalance correlates negatively.
  - Source: [Panayides, Shohfi & Smith](https://www.quantresearch.org/Panayides_Shohfi_Smith.pdf)
  - **Conflict:** Panayides et al. say they can identify the true trade initiator. Carrion & Kolay state that Panayides et al. "lack true trade signs in their data." — [Carrion & Kolay](https://doi.org/10.1111/fire.12218)
- **Easley, López de Prado & O'Hara ("Discerning Information from Trade Data").** Tick-rule approaches and BVC are "relatively good classifiers of the aggressor side," but BVC is better linked to proxies of information-based trading. — [SSRN 1989555](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1989555)

**CME E-mini, near-perfect classification (Andersen & Bondarenko, using CME BBO files)**
- Tick rule applied contract by contract misclassifies 11.6% of transactions. ELO report 13.6%.
- Applying the tick rule to aggregated flow misclassifies:
  - 24.8% at 1-second aggregation;
  - 38.7% at 60 seconds;
  - 43.1% at 300 seconds ("barely improving on random classification").
- The best time-bar BVC variant has a 23.2% failure rate.
- Source: [Andersen & Bondarenko, CREATES RP 2013-43](https://repec.econ.au.dk/repec/creates/rp/13/rp13_43.pdf)

**Data completeness**
- Odd-lot trades: median 24% of trades in O'Hara-Yao-Ye's sample, 60%+ in some stocks. They were then not reported to the consolidated tape or TAQ, they contribute 35% of price discovery, and "omitting odd-lot trades leads to inaccuracies in order imbalance measures." — [O'Hara, Yao & Ye, Journal of Finance 2014](https://onlinelibrary.wiley.com/doi/10.1111/jofi.12185)

### Inferences
- For CME index futures, measurement error in signed flow is mostly a non-issue except around opens, pauses and implied trades. For US equities, signed-flow features built from TAQ-style consolidated data carry roughly 7-23% trade-level sign error depending on method and timestamp quality. That error attenuates any measured predictive relation.
- Classification error also does not wash out at short horizons. Netting only helps over longer bars, while intraday signals live at the seconds level.
- Prefer direct exchange feeds for equities, for example Nasdaq ITCH: they carry the executed resting order's side, so aggressor = opposite side. This is the basis of the "true sign" datasets used above.

### Gaps
- The classic accuracy numbers were not retrieved directly: Lee & Ready (1991); Ellis, Michaely & O'Hara (2000); Odders-White (2000), often cited as about 85%.
- Not verified: whether odd lots are now fully on the consolidated tape and in TAQ. Odd lots were added to the tape after the O'Hara-Yao-Ye sample period, and SEC market-data reforms changed round-lot definitions, but neither point was confirmed in this session.

---

## 2. Order Flow Imbalance (OFI): contemporaneous explanatory power vs. forward-looking predictive power

### Takeaway
OFI explains a large share of *contemporaneous* mid-price changes:
- about 65% R² at 10-second intervals for best-level OFI (CKS 2014);
- about 71% in-sample for best-level OFI and about 87% for integrated multi-level OFI (CCZ 2023).

Its *predictive* power is an order of magnitude smaller and dies out quickly:
- CKS report about 3% R² for a 200 ms-ahead mid-price change following limit order executions.
- Cross-asset lagged OFI adds out-of-sample forecasting power at a 1-minute horizon that "decays rapidly."
- Deep models on order-flow inputs find the alpha term structure peaks at about two average price changes (Kolm et al. 2023).
- In E-mini futures, return-flow shocks dissipate almost entirely within one second (Takahashi 2025).

### Cited Findings
**Cont, Kukanov & Stoikov (2014, JFEc 12(1):47-88)**
- Data: TAQ quotes and trades for 50 US stocks randomly selected from the S&P 500, April 2010, with NBBO built from TAQ. Model: ΔP_k = β·OFI_k over 10-second intervals, with β estimated per 30-minute window (273 half-hour subsamples per stock, about 180 observations each). — [CKS slides](https://www.smallake.kr/wp-content/uploads/2016/05/Kukanov.pdf); [CKS arXiv](https://arxiv.org/html/1011.6402v3)
- Average R² is 65%. Adding a quadratic term lifts it only to 68%, so the relation is linear. β is significant in about 98% of subsamples. — [CKS arXiv](https://arxiv.org/html/1011.6402v3)
- Tautology check: excluding price-changing events from OFI lowers R² "but [it] remained in the 35%-60% region." — [CKS arXiv](https://arxiv.org/html/1011.6402v3)
- Robust from 10 quote updates (under half a second) up to 10 minutes; fit "generally increases with Δt." The slides also cite tests from 50 ms to 5 minutes. — [CKS arXiv](https://arxiv.org/html/1011.6402v3); [CKS slides](https://www.smallake.kr/wp-content/uploads/2016/05/Kukanov.pdf)
- The slope is inversely proportional to market depth. Order flow deeper in the book has "only a second-order effect" on price changes. — [JFEc abstract](https://academic.oup.com/jfec/article/12/1/47/816163); [CKS slides](https://www.smallake.kr/wp-content/uploads/2016/05/Kukanov.pdf)
- **Predictive test** (one month of Nasdaq ITCH for Schlumberger via LOBSTER): mid-price change over the 200 ms *after* each limit-order execution regressed on OFI in the 200 ms *before* it.
  - Average R² 2.93%, average t-stat 2.68, significant at 5% in 63% of subsamples.
  - "Stronger results are obtained with 50- and 100-millisecond windows."
  - OFI is "positively autocorrelated over very short time intervals."
  - Source: [CKS slides](https://www.smallake.kr/wp-content/uploads/2016/05/Kukanov.pdf)
- Order book event auto- and cross-correlations "typically vanish after 10 seconds." — [CKS arXiv](https://arxiv.org/html/1011.6402v3)

**Cont, Cucuringu & Zhang (2023, Quantitative Finance), "Cross-impact of order flow imbalance in equity markets"**
- Contemporaneous fit, in-sample adjusted R²:
  - best-level OFI 71.16%;
  - integrated OFI (combining the top levels) 87.14%, standard deviation 9.16%.
  - Adding cross-asset OFIs raises in-sample R² by only 0.71 points with integrated OFI, vs. 2.71 points with best-level OFI.
  - Source: [CCZ, Quantitative Finance full text](https://www.tandfonline.com/doi/full/10.1080/14697688.2023.2236159)
- Contemporaneous fit, out-of-sample (next 30 minutes): best-level price-impact model 64.64% vs. cross-impact 66.03%. With integrated OFI, cross-impact is slightly worse. The cross-impact model beats the own-impact model for 91.0% of stocks at 1% significance with best-level OFI, but only 28.1% with integrated OFI. — [CCZ](https://www.tandfonline.com/doi/full/10.1080/14697688.2023.2236159)
- Forecasting design:
  - 1-minute bins, with lags of {1, 2, 3, 5, 10, 20, 30} minutes;
  - parameters re-estimated on the previous 30 minutes and rolled forward each minute;
  - horizons of 1, 2, 3, 5, 10, 20 and 30 minutes.
  - Cross-impact models (lagged cross-asset OFI) achieve higher out-of-sample R² at the 1-minute horizon, significant across all stocks at 1%. This "leads to additional economic profits," but "predictability decays quickly through time" and the PnL of cross-asset models "declines more quickly over longer horizons."
  - The predictive content lasts "a short horizon of up to several minutes."
  - Source: [CCZ](https://www.tandfonline.com/doi/full/10.1080/14697688.2023.2236159); [arXiv 2112.13213](https://arxiv.org/abs/2112.13213)

**Kolm, Turiel & Westray (2023, Mathematical Finance), "Deep order flow imbalance"**
- Data: 115 Nasdaq stocks from LOBSTER, Jan 1 2019 to Jan 31 2020, nanosecond timestamps, no downsampling. — [Kolm, Turiel & Westray](https://doi.org/10.1111/mafi.12413)
- Models trained on stationary order-flow (OFI-type) inputs significantly outperform the same models trained on raw LOB states. The exact architecture is "of secondary importance": a simple LSTM matches CNN-LSTM. — [Kolm et al.](https://doi.org/10.1111/mafi.12413)
- Out-of-sample R² rises up to about two average price changes, then plateaus when horizons are extended to 10 price changes. "Stock-level alphas peak at a time scale of about two price changes and decline thereafter." — [Kolm et al.](https://doi.org/10.1111/mafi.12413)
- "Information-rich" stocks, meaning those with more order-book updates per price change, are forecast more accurately. — [Kolm et al.](https://onlinelibrary.wiley.com/doi/10.1111/mafi.12413)

**CME E-mini evidence (Takahashi, arXiv 2508.06788)**
- Structural VAR on 1-second BBO data for E-mini S&P 500, estimated per 15-minute interval.
- Price impact is significant in 64% of intervals, with mean 0.834.
- Impulse responses show "shocks dissipate almost entirely within a second."
- Price impact rises with reciprocal depth, close to the CKS benchmark. Around macroeconomic announcements, price impact rises and flow impact falls.
- Source: [Takahashi, "Returns and Order Flow Imbalances"](https://arxiv.org/pdf/2508.06788v4)

### Inferences
- The headline "OFI R² = 65-87%" is a *contemporaneous* fit. Most of that information is in the price by the end of the same interval. A trader who sees OFI with any latency is forecasting a residual worth single-digit R² at best.
- The documented forward horizon is about 50-200 ms (CKS), about 1-2 price changes (Kolm et al.), up to a few minutes for cross-asset effects (CCZ), and under 1 second in E-mini (Takahashi). That is short relative to a non-colocated trader's round trip and to one-tick spread costs.
- Probable use cases are execution timing (whether to post or cross, adverse-selection avoidance), which CKS themselves suggest, and cross-asset lead-lag at roughly 1-minute horizons. Directional taker strategies are less likely to fit.
- None of the retrieved OFI papers report results net of realistic spread, fees and latency. CCZ's "economic gains" appear to be gross of costs; this was not verified.

### Gaps
- The actual out-of-sample forecasting R² values were not retrieved: CCZ Table 8 (1-minute-ahead) and Kolm et al. Figure 2/8 levels. Both appear to be small (low single digits or below), but this is unverified.
- CCZ's sample (universe and period) was not confirmed in the retrieved text.
- No retrieved study measured OFI predictability directly on CME MBO data with direct aggressor flags at multiple horizons and with costs.

---

## 3. Order book / queue imbalance and the microprice as predictors of the next mid-price move

### Takeaway
Best-level queue imbalance, I = (bid size − ask size)/(bid size + ask size), is a strongly significant predictor of the *direction of the next mid-price move*:
- **Large-tick stocks:** out-of-sample AUC about 0.75-0.81; when I ≈ 1, P(up) ≈ 0.8-0.9.
- **Small-tick stocks:** AUC about 0.58-0.64.

Stoikov's microprice turns imbalance and spread into a martingale "fair price" that empirically beats the mid and the weighted mid as a short-term predictor. The prediction target, however, is a one-tick event whose size is comparable to the spread.

### Cited Findings
**Gould & Bonart (2016, Market Microstructure and Liquidity)**
- Logistic regressions of next-mid-move direction on queue imbalance for 10 liquid Nasdaq stocks.
  - Large-tick: MSFT, INTC, MU, CSCO, ORCL.
  - Small-tick: GOOG, AMZN, TSLA, PCLN, NFLX.
  - Source: [Gould & Bonart, arXiv HTML](https://arxiv.org/html/1512.03492); [MML journal page](https://www.worldscientific.com/doi/10.1142/S2382626616500064)
- Out-of-sample ROC AUC:

  | Large-tick | AUC | Small-tick | AUC |
  |---|---|---|---|
  | MSFT | 0.762 | GOOG | 0.581 |
  | INTC | 0.798 | AMZN | 0.642 |
  | MU | 0.752 | TSLA | 0.602 |
  | CSCO | 0.805 | PCLN | 0.583 |
  | ORCL | 0.770 | NFLX | 0.627 |

  In-sample values are very similar, so there is no evidence of overfitting. — [Gould & Bonart](https://arxiv.org/html/1512.03492)
- Against a null model, the binary classification improvement is about 50-60% for large-tick and 10-30% for small-tick stocks. The mean squared residual falls 20-30% (large-tick) and 2-6% (small-tick), against a null of exactly 0.25. — [Gould & Bonart](https://arxiv.org/html/1512.03492)
- Logistic slope x₁ is about 2-3 for large-tick and about 0.5-0.85 for small-tick stocks. When I is close to 1, P(up move) is about 0.8-0.9 for large-tick and about 0.6-0.7 for small-tick stocks. — [Gould & Bonart](https://arxiv.org/html/1512.03492)

**Stoikov microprice (Quantitative Finance 18(12):1959-1966, 2018)**
- Defined as "the limit of a sequence of expected mid-prices." It is "a martingale by construction" and is expressed as an adjustment to the mid-price based on spread and imbalance, estimated from high-frequency data. — [Stoikov, SSRN 2970694](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2970694)
- Shown empirically to be "a better predictor of short term prices than the mid-price or the weighted mid-price." Code and sample data are on GitHub (sstoikov/microprice). — [Stoikov SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2970694); [Quantitative Finance DOI](https://doi.org/10.1080/14697688.2018.1489139)

**Related deep-learning evidence on tick size (Briola, Bartolucci & Aste 2025)**
- For large-tick Nasdaq stocks, DeepLOB accuracy "exceed[s] 0.7 without thresholds and reach[es] over 0.9 with the application of probability thresholds," with F1 above 0.45 and 0.7 respectively. Yet "achieving high scores on these traditional machine learning metrics does not necessarily translate into the generation of actionable trading signals." — [Briola, Bartolucci & Aste, Quantitative Finance 2025](https://www.tandfonline.com/doi/full/10.1080/14697688.2025.2522911)

### Inferences
- Queue imbalance is most predictive exactly where it is least monetizable for a taker.
  - In large-tick names (spread usually one tick), the predicted move is one tick. Crossing the spread to capture it costs about one tick plus fees.
  - Practical value is in passive order placement and cancellation (avoid resting on the thin side, stay in queue on the thick side) and in short-horizon execution.
- E-mini S&P (ES) is a canonical large-tick, deep-queue contract, so Gould-Bonart-type imbalance is likely strongly predictive of the next tick there too. This was not directly measured in the retrieved sources, and displayed queues are exposed to spoofing (section 6) and hidden iceberg size (section 5).
- The microprice is better understood as a fair-value or mark estimator, for example for market making or as a de-noised target, than as a stand-alone alpha.

### Gaps
- Gould & Bonart's exact sample period and data source were not confirmed (likely LOBSTER).
- Stoikov's quantitative improvement figures and test stocks were not retrieved.
- No retrieved peer-reviewed study reports queue-imbalance hit rates specifically for ES or NQ futures.

---

## 4. VPIN and "flow toxicity" (Easley, López de Prado & O'Hara) and the critiques (Andersen & Bondarenko)

### Takeaway
VPIN measures absolute order imbalance over volume buckets. It was promoted as a real-time toxicity indicator that peaked before the May 6, 2010 flash crash and predicts short-term volatility. Andersen & Bondarenko show:
- VPIN's predictive content comes mainly from its mechanical link to trading intensity and volatility;
- it did not hit an all-time high before the crash;
- with accurate trade classification or fixed volume bins, its relation to volatility reverses or disappears;
- it has no incremental predictive power once volume and volatility are controlled for.

The dispute was public and unresolved between the parties. The independent equity horse race (Chakrabarty et al.) also found BVC-based VPIN less accurate than tick-rule VPIN.

### Cited Findings
**Construction**
- ELO set the volume bucket V = 1/50 of average daily volume. Classification is done over time or volume bars, and the order-imbalance measure is the volume-weighted average of absolute bar imbalances across buckets. — [Andersen & Bondarenko, CREATES RP 2013-43](https://repec.econ.au.dk/repec/creates/rp/13/rp13_43.pdf)
- VPIN is "a moving target":
  - ELO (2011a) used tick-rule VPIN on time bars;
  - ELO (2012a) used BV-VPIN with a normal-CDF transform of price changes;
  - ELO (2012b) used a Student-t CDF.
  - Source: [Andersen & Bondarenko, "Reflecting on the VPIN dispute"](https://www.sciencedirect.com/science/article/abs/pii/S1386418113000475)

**ELO claim**
- TR-VPIN for E-mini S&P reached an all-time high by 13:30 CT on May 6, 2010; the crash began at 13:32. TR-VPIN leads the VIX. — summarized in [Andersen & Bondarenko, JFM 2014](https://www.sciencedirect.com/science/article/abs/pii/S1386418113000189)

**Andersen & Bondarenko (Journal of Financial Markets 17:1-46, 2014)**
- VPIN "is a poor predictor of short run volatility." It "did not reach an all-time high prior, but rather after, the flash crash." Its predictive content is "due primarily to a mechanical relation with the underlying trading intensity." Traditional predictors including the VIX are "vastly superior... even for very short horizons." — [AB 2014](https://www.sciencedirect.com/science/article/abs/pii/S1386418113000189); [RePEc](https://ideas.repec.org/a/eee/finmar/v17y2014icp1-46.html)
- The mechanism: in time-bar VPIN, all trades in a bar are classified jointly. When trading is intense, there are fewer bars per bucket, which inflates measured imbalance "independently of the actual order flow imbalance." "Almost all systematic variation in TR-VPIN" is explained by trading pattern, and "trade classification plays a minimal role." — [AB 2014](https://www.sciencedirect.com/science/article/abs/pii/S1386418113000189)
- With fixed volume bins, VPIN shows "a pronounced negative association with volatility." VPIN is also sensitive to the starting point of the volume clock (idiosyncratic sampling noise). — [AB 2014](https://www.sciencedirect.com/science/article/abs/pii/S1386418113000189)
- A signed VPIN, which lets imbalances offset, "appears helpful in detecting the momentum in the order flow around the flash crash." — [AB 2014](https://www.sciencedirect.com/science/article/abs/pii/S1386418113000189)

**Andersen & Bondarenko, perfect classification (CME BBO files)**
- When VPIN is built from accurate classification, it "behaves in a diametrically opposite way to BVC-VPIN."
- BVC-VPIN has volatility forecast power "solely because it generates systematic classification errors that are correlated with trading volume and return volatility."
- "When controlling for trading intensity and volatility, the BVC-VPIN measure has no incremental predictive power."
- One hour before the crash, the VPIN level was exceeded on about 20% of sample days (about 50 times a year). At crash onset it was exceeded about 13 times a year.
- Source: [AB CREATES RP 2013-43](https://repec.econ.au.dk/repec/creates/rp/13/rp13_43.pdf)

**Rejoinder exchange**
- ELO's rejoinder said AB "attack a methodology we do not advocate." AB reply that VPIN "predicts neither crashes nor volatility better than regular market indicators," and that VPIN built with perfect trade classification contradicts the original evidence. — [AB, "Reflecting on the VPIN dispute"](https://www.sciencedirect.com/science/article/abs/pii/S1386418113000475)

**Independent evidence**
- In US equities, TR and LR produce more accurate VPIN estimates than BVC, and TR "fares better than BVC when used to identify periods of high and persistent order flow toxicity." — [Chakrabarty, Pascual & Shkilko](https://dee.uib.eu/digitalAssets/234/234006_Pascual.pdf)

### Inferences
- VPIN should not be treated as a validated short-horizon *directional* signal; it is unsigned by construction. Its validity as a *volatility or toxicity* signal beyond volume and realized volatility is contested, and the most careful independent test says no.
- Any intraday model using VPIN should include volume, realized volatility and spread controls before claiming incremental value.

### Gaps
- Post-2014 out-of-sample VPIN studies in US equities or futures (for example Wu, Bethel et al. on volume-bar BV-VPIN, and later ML uses) were not retrieved. The literature after the dispute is not summarized here.

---

## 5. Practitioner tools (footprint, delta/CVD, volume and market profile, VWAP/anchored VWAP, absorption, exhaustion, icebergs, tape reading, DOM and heatmaps): claims vs. evidence

### Takeaway
Vendor platforms (Bookmap, ATAS, Sierra Chart, Jigsaw, NinjaTrader, Quantower) visualize:
- signed trade flow (footprint bid×ask, delta, CVD);
- volume at price (profile, POC, high and low volume nodes);
- the history of displayed depth (heatmaps).

They make qualitative claims, for example that absorption or delta divergence "often precedes a reversal." **No peer-reviewed study was found that tests footprint, CVD-divergence, absorption, POC/value-area or anchored-VWAP rules as predictors with out-of-sample, net-of-cost results.**

The closest rigorous evidence is indirect:
- trade-only imbalance (what CVD measures) is a noisier price driver than OFI;
- iceberg detection on CME is feasible and material (icebergs are about 9% of ES book volume and about 12% of traded volume in 2011 data);
- VWAP appears in academic work as an execution benchmark, not as a support/resistance predictor.

### Cited Findings
**Practitioner claims [PRACTITIONER / NON-ACADEMIC]**
- **ATAS heatmap:** described as "a visualization of the limit side of the market over time... where large volumes were building in advance, where they were pulled at the last moment." — [ATAS Help, Heatmap](https://help.atas.net/en/support/solutions/articles/72000660059-heatmap)
- **ATAS CVD:** "Delta is the difference between aggressive buying and selling on each bar. Cumulative Volume Delta (CVD) sums that imbalance on a running basis." — [ATAS Help](https://help.atas.net/en/support/solutions/articles/72000660059-heatmap)
- **ATAS absorption:** "when aggressive market orders hit a level but price doesn't break through... delta diverges from price movement. It often precedes a reversal - but always requires confirmation." ATAS also cautions that "a bright zone on the map is a hypothesis, not a fact. Large orders sometimes get pulled at the last moment." — [ATAS Help](https://help.atas.net/en/support/solutions/articles/72000660059-heatmap)
- **ATAS footprint and MBO tools:** footprint shows bid/ask volume "at the level of individual price ticks," with "more than 400 variations of cluster charts." With MBO data ATAS offers an "Icebergs Tracker, Stops Tracker and Sweeps Tracker." — [ATAS Help](https://help.atas.net/en/support/solutions/articles/72000660059-heatmap)
- **ATAS imbalance rules:** imbalances are calculated "diagonally" (bid at price p vs. ask at price p+1), with 200% and 400% dominance thresholds, plus "stacked imbalances" and "finished vs unfinished auctions on CME." — [ATAS Learn, Volume Analysis](https://learn.atas.net/volume-basics/volume-analysis)
- **Bookmap CVD:** defined as cumulative market-buy minus market-sell volume. Claimed uses include:
  - "Price making a new high while CVD lags = buyer exhaustion (possible reversal)";
  - "Price dipping while CVD rises = absorption";
  - "VWAP reclaim with CVD confirmation."
  - Source: [Bookmap blog, CVD](https://bookmap.com/blog/how-cumulative-volume-delta-transform-your-trading-strategy)
- **Bookmap heatmap and footprint claims:** Bookmap claims its heatmap "allows traders to spot real support and resistance by showing where large limit orders are placed and whether they are sustained or canceled," and that it "helps identify... absorption, and spoofing." Footprint platforms named include Sierra Chart, ATAS and NinjaTrader. — [Bookmap, Comparing Bookmap to DOM, Footprint and Volume Profile](https://bookmap.com/blog/comparing-bookmap-to-dom-footprint-and-volume-profile)
- **Bookmap marketing:** markets "LOB data is intentional" and replay-based training ("16x replay speed... 104 hours of events"). — [Bookmap presentation PDF](https://bookmap.com/BMPS/Bookmap%20presentation%20(BMT).pdf)
- **Review sites:** describe absorption ("When the aggressor runs out of ammo, price snaps the other way") and delta divergence ("A classic early warning signal") as standard setups, and cover ATAS, Bookmap, Sierra Chart, Jigsaw and Quantower. — [OrderFlowGuide](https://orderflowguide.com/)

**Rigorous or adjacent evidence**
- Trade-volume-based price relations are "noisy and less robust" than OFI, which includes limit adds and cancels. CVD and delta use trades only. — [CKS, JFEc](https://academic.oup.com/jfec/article/12/1/47/816163)
- **Icebergs, Christensen & Woodmansey (2013, Journal of Trading)**, E-mini S&P 500, 2011:
  - an estimated 9% of LOB volume is iceberg orders;
  - the average ES iceberg has total size 62 with peak 5 (12× the average order size);
  - iceberg peaks are 3% of limit orders by number, but icebergs match against 12% of traded volume;
  - the paper proposes a GLOBEX-specific, millisecond-latency detection and prediction algorithm.
  - Source: [Christensen & Woodmansey, J. Trading DOI](https://doi.org/10.3905/jot.2013.8.3.068); [PM Research](https://www.pm-research.com/content/iijtrade/8/3/68)
- **CME iceberg detection (arXiv 1909.09495):**
  - native (exchange-managed) icebergs can be detected unambiguously from MBO data, because the order ID persists and trade summaries show trade sizes larger than the resting display;
  - synthetic (ISV-managed) icebergs can only be detected heuristically;
  - native icebergs are about 4% of traded volume, synthetic 3.3-14.3% depending on the minimum-tranche setting.
  - Source: [CME Iceberg Order Detection and Prediction](https://arxiv.org/html/1909.09495v1)
- **dxFeed [PRACTITIONER]** sells CME iceberg detection with predicted hidden size and repeats the native-vs-synthetic distinction. — [dxFeed](https://dxfeed.com/solutions/iceberg-detection-solution/)
- **VWAP in the academic literature** appears as an execution target, for example Cartea & Jaimungal's closed-form VWAP and POV strategies with relative error in bps. Net order flow enters as a permanent-impact driver (linear regression of midprice change on net market-order flow at 5-minute intervals). — [Cartea & Jaimungal, IPAM 2015 slides](https://helper.ipam.ucla.edu/publications/FMWS2/FMWS2_12685.pdf)
- **Terminology warning:** in academic work, "volume profile" often means the depth profile across LOB levels (heavy-tailed volume at book levels in CME, CBOT, Eurex and others), not volume-at-price over a session. — [Richards, Peters & Dunsmuir, arXiv 1210.7215](https://arxiv.org/abs/1210.7215)

### Inferences
- Footprint, delta and CVD are visualizations of signed trade flow. Their information content is bounded by the OFI evidence in section 2: strong contemporaneously, weak and fast-decaying predictively.
- "Absorption" is roughly the CKS observation that "high positive (negative) OFI without a price change suggests that prices are about to go up (down)" ([CKS slides](https://www.smallake.kr/wp-content/uploads/2016/05/Kukanov.pdf)). But CKS frame this as a sub-second adverse-selection effect with R² about 3%, not a reliable reversal setup.
- Heatmap and DOM reads of displayed depth are vulnerable to spoofing (section 6) and to hidden icebergs (about 9-12% of ES volume). Displayed size therefore misstates true supply and demand in both directions.
- The lack of published evidence is itself informative. These tools are widely marketed, but claims are illustrated with selected chart examples rather than out-of-sample statistics, so they should be treated as hypotheses to test, not established edges.

### Gaps
- No rigorous peer-reviewed evidence was found for:
  - POC, value area or high/low-volume nodes as support/resistance;
  - anchored VWAP as an attractor;
  - CVD divergence or absorption as reversal predictors;
  - stacked-imbalance rules;
  - "tape reading" performance.
  This reflects a targeted search, not an exhaustive one.
- The Market Profile "value area = 70% of volume/TPOs" convention and the Jigsaw and Sierra Chart feature specifics were not retrieved from primary vendor pages.

---

## 6. Spoofing, layering and fake liquidity: how displayed depth misleads, enforcement examples, implications for size-based signals

### Takeaway
Displayed depth, especially 2-5 ticks from the touch, is the layer that spoofers manipulate, and that layer is exactly what heatmaps and multi-level imbalance read. CME enforcement shows the pattern:
- large layered orders placed opposite a small genuine order;
- genuine order fills within milliseconds;
- spoof orders cancelled within under a second.

In the Sarao E-mini case, layered spoof orders made up 20-29% of the entire sell side of the book on May 6, 2010.

### Cited Findings
**Legal definition**
- CEA Section 4c(a)(5)(C), added by Dodd-Frank and applicable to conduct on or after July 16, 2011, prohibits spoofing, defined as "bidding or offering with the intent to cancel the bid or offer before execution." — [CFTC JPMorgan Order](https://www.cftc.gov/media/4826/enfjpmorganchaseorder092920/download)

**JPMorgan (2020)**
- Total of $920.2M, "the largest amount of monetary relief ever imposed by the CFTC":
  - restitution $311,737,008;
  - disgorgement $172,034,790;
  - civil monetary penalty $436,431,811.
- Conduct: "hundreds of thousands of spoof orders" in gold, silver, platinum, palladium, Treasury note and Treasury bond futures on COMEX, NYMEX and CBOT, from at least 2008 to 2016.
- Source: [CFTC Press Release 8260-20](https://www.cftc.gov/PressRoom/PressReleases/8260-20)
- Parallel DOJ deferred prosecution agreement on wire fraud charges. Separate SEC settlement with JPMS for $10M disgorgement and a $25M penalty. — [DOJ press release](https://www.justice.gov/archives/opa/pr/jpmorgan-chase-co-agrees-pay-920-million-connection-schemes-defraud-precious-metals-and-us)
- Order mechanics from the CFTC order:
  - A 100-lot genuine T-Bond sell, followed by six layered spoof buys totaling 1,800 lots. The genuine order filled "milliseconds after" the sixth spoof, and the spoofs were cancelled under one second after the fill.
  - A 10-lot genuine buy against a 1,000-lot spoof sell: filled in milliseconds, spoof cancelled under one second later.
  - A 50-lot genuine buy against a 3,000-lot spoof: spoof cancelled under 1/3 second after the fill.
  - Source: [CFTC JPMorgan Order](https://www.cftc.gov/media/4826/enfjpmorganchaseorder092920/download)

**Navinder Sarao (E-mini S&P)**
- The layering algorithm placed 4-6 "exceptionally large" sell orders, each one price level apart and at least 3-4 levels from the best ask. The orders were modified as price moved so they stayed visible but unlikely to fill. — [CFTC Press Release 7156-15](https://www.cftc.gov/PressRoom/PressReleases/7156-15)
- Used on over 400 trading days between April 2010 and April 2015, with about $40M of profit. — [CFTC Press Release 7156-15](https://www.cftc.gov/PressRoom/PressReleases/7156-15)
- May 6, 2010:
  - the layering program ran for more than 4h25m cumulatively;
  - orders were modified more than 81,000 times with only 81 lots executed;
  - the orders represented "approximately $170 million to over $200 million" of persistent downward pressure and "20-29% of the entire sell-side of the order book";
  - Sarao's activity "contributed to an extreme order book imbalance."
  - Source: [CFTC Press Release 7486-16](https://www.cftc.gov/PressRoom/PressReleases/7486-16)
- Example from May 4, 2010: four 600-lot orders placed within 0.002 s of each other, starting 3 ticks above the best ask, each modified 152 times, then cancelled unfilled after about 12 minutes, with notional over $140M. In his later personal account (2014-2015), Sarao cancelled "nearly 90% of certain size orders... often in less than one second." — [CFTC Sarao Complaint](https://www.cftc.gov/sites/default/files/idc/groups/public/@lrenforcementactions/documents/legalpleading/enfsaraocomplaint041715.pdf)
- Sanctions: $25.7M civil monetary penalty and $12.9M disgorgement (over $38M total), plus permanent trading bans. Sarao pleaded guilty to one count of spoofing and one count of wire fraud. — [CFTC Press Release 7486-16](https://www.cftc.gov/PressRoom/PressReleases/7486-16)

**Other non-genuine displayed volume**
- Christensen & Woodmansey list three reasons displayed GLOBEX liquidity differs from realizable liquidity: iceberg orders, unbroadcast (implied) orders and "phantom orders." — [Christensen & Woodmansey](https://www.pm-research.com/content/iijtrade/8/3/68)

### Inferences
- Signals built on displayed size away from the touch (heatmap "walls," deep-book imbalance, multi-level integrated OFI with large weights on levels 3-5) are the most exposed to manipulation. CKS's finding that deeper levels are second-order for price changes, plus the integrated-OFI gains in CCZ coming mostly from near levels, suggests near-touch information is both more predictive and harder to fake.
- Fill-and-cancel timing in the enforcement record (milliseconds to under one second) means a human reading a DOM or heatmap cannot reliably tell spoof liquidity from real liquidity in real time. A model that weights displayed size by order age or survival, using MBO order IDs, would be the principled countermeasure. This is an inference; no academic test was retrieved.
- Enforcement shows spoofing has occurred in index futures and has moved prices, but enforcement cases are a biased, lagged sample. Current prevalence is unknown.

### Gaps
- Not retrieved with primary sources:
  - Michael Coscia, often cited as the first criminal conviction under the Dodd-Frank anti-spoofing provision (2015);
  - Tower Research, Merrill Lynch and Bank of Nova Scotia spoofing settlements;
  - CME Rule 575 (disruptive practices).
- No academic paper was retrieved that quantifies how spoofing degrades imbalance-based predictors, or that estimates spoof-order prevalence in ES or NQ after 2020.

---

## 7. Deep learning on limit order books (DeepLOB, FI-2010, LOBSTER, LOBCAST benchmark, later results): real predictive power and survival after costs

### Takeaway
DeepLOB-type models report high F1 on the FI-2010 benchmark, but results do not transfer:
- In the LOBCAST benchmark of 15 models, DeepLOB's claimed 78.9 F1 on FI-2010 reproduced at 71.4.
- On fresh Nasdaq data (LOB-2021/2022) it reached only about 59.5 F1. All models fell to 48-61% F1.
- FI-2010 has structural flaws (pre-normalized, unrecoverable book, labels chosen to balance classes).

Later work finds:
- order-flow-derived inputs beat raw book inputs, and architecture matters little (Kolm et al.);
- predictability is concentrated in large-tick stocks;
- high classification accuracy "does not necessarily correspond to actionable trading signals" (Briola et al. 2025).

**No retrieved study shows DL-LOB predictions surviving realistic transaction costs.**

### Cited Findings
**DeepLOB**
- Zhang, Zohren & Roberts (IEEE Transactions on Signal Processing 67(11), June 2019): CNN for spatial LOB structure plus LSTM. Claims to outperform state-of-the-art on a benchmark LOB dataset, reports "stable out-of-sample accuracy" on one year of LSE data, and claims generalization to instruments not seen in training. — [DeepLOB arXiv 1808.03668](https://arxiv.org/abs/1808.03668)

**LOBCAST benchmark** (Prata et al., arXiv 2308.01915; "Matteo Prata and 8 others," including A. Briola; often cited as "Briola et al." or LOBCAST, 2024)
- 15 DL models; finding: "all models exhibit a significant performance drop when exposed to new data, thereby raising questions about their real-world market applicability." — [arXiv abstract](https://arxiv.org/abs/2308.01915)
- DeepLOB F1, averaged over horizons k ∈ {1, 2, 3, 5, 10}:
  - FI-2010 as originally claimed: 78.9 ± 4.4;
  - FI-2010 as reproduced by LOBCAST: 71.4 ± 5.3;
  - LOB-2021: 59.5 ± 3.0;
  - LOB-2022: 59.5 ± 2.9.
  - DeepLOB ranked 4th on FI-2010 but 1st on LOB-2022.
  - Source: [LOBCAST HTML v2](https://arxiv.org/html/2308.01915v2)
- DeepLOB per-horizon F1 (FI-2010 reproduced → LOB-2021):

  | k | FI-2010 | LOB-2021 |
  |---|---|---|
  | 1 | 71.1 | 55.0 |
  | 2 | 62.4 | 60.4 |
  | 3 | 70.8 | 62.7 |
  | 5 | 75.4 | 62.2 |
  | 10 | 77.6 | 57.4 |

  The largest drop is at k = 10 (about 20 points). — [LOBCAST HTML v2](https://arxiv.org/html/2308.01915v2)
- "Except for a few systems, there is a considerable difference between the claimed performances and those measured." The best FI-2010 models "may overfit the FI-2010 dataset." LOB-2021/2022 F1 scores "range 48-61%." — [LOBCAST HTML v2](https://arxiv.org/html/2308.01915v2)
- FI-2010 shortcomings, per LOBCAST:
  - the data is "already pre-processed (filtered, normalized, and labelled) so that the original LOB cannot be backtracked";
  - the labelling "is found to be prone to instability";
  - θ "was chosen to obtain a balanced dataset... for the horizon k=5" rather than for financial meaning;
  - per-stock information cannot be extracted.
  - Source: [LOBCAST HTML v2](https://arxiv.org/html/2308.01915v2)
- Backtests "confirm the challenging nature of the task... indicating that the models' profitability is far from guaranteed." — [LOBCAST HTML v2](https://arxiv.org/html/2308.01915v2)

**Kolm, Turiel & Westray (2023)**
- 115 Nasdaq stocks: order-flow inputs > raw LOB inputs; simple LSTM ≈ CNN-LSTM; the effective forecast horizon is about two average price changes. — [Kolm et al.](https://doi.org/10.1111/mafi.12413)

**Briola, Bartolucci & Aste (Quantitative Finance 2025; arXiv 2403.09267)**
- Setup: DeepLOB on 15 Nasdaq stocks, horizons of 10, 50 and 100 (LOB-update steps), with stocks split into small-, medium- and large-tick classes.
- Results:
  - "microstructural characteristics influence the efficacy of deep learning methods";
  - "high forecasting power does not necessarily correspond to actionable trading signals";
  - "traditional machine learning metrics fail to adequately assess the quality of forecasts."
- They propose p_T, the probability of correctly forecasting a complete transaction, and find that "the chronological positioning of correct forecasts is more critical than their sheer abundance."
- Trading-simulation results are explicitly not reported.
- Source: [Briola et al., Quantitative Finance full text](https://www.tandfonline.com/doi/full/10.1080/14697688.2025.2522911); [arXiv HTML](https://arxiv.org/html/2403.09267)
- The open-source LOBFrame supports DeepLOB, transformer, iTransformer, LOBTransformer, DLA, CNN1/2, BiN-TABL/CTABL, AxialLOB and HLOB, with a simulator/backtest module. — [LOBFrame GitHub](https://github.com/FinancialComputingUCL/LOBFrame)

### Inferences
- Realistic out-of-sample 3-class mid-price-direction F1 is about 50-60% on modern Nasdaq data, against a 33% random three-class baseline. Much of this skill concentrates in large-tick names, where the predicted move is about one tick, which again collides with spread cost.
- Most of the benefit of DL comes from good stationary features (order flow), not from architecture. Linear or OFI models plus gradient boosting are a reasonable baseline before investing in deep models.
- Treat FI-2010 results as non-informative about live tradability.

### Gaps
- FI-2010 composition (generally described as 5 Nasdaq Nordic/Helsinki stocks over 10 days in 2010) was not verified from Ntakaris et al. in this session.
- No retrieved paper reports DL-LOB strategy PnL net of spreads, fees and latency for US equities or CME futures.
- The LOBCAST Appendix G backtest numbers were truncated in retrieval.

---

## 8. Large trades, block and dark-pool prints, "unusual volume," trade-size clustering, and retail flow (BJZZ sub-penny method)

### Takeaway
Rigorous evidence says *medium-sized* trades, not blocks, carry most cumulative price change (the "stealth trading" pattern). Rounded and clustered trade sizes have extra price impact and persistence. Odd lots, which were then off the TAQ tape, contribute 35% of price discovery.

For retail flow:
- BJZZ's sub-penny method shows stocks with net retail marketable buying outperform by about 10 bps over the *next week*. That is a multi-day horizon, not intraday.
- A field validation (Barber et al. 2024) finds BJZZ identifies only 35% of retail trades and mis-signs 28%. A quote-midpoint signing fix cuts errors to 5%.

No rigorous evidence was found for intraday "unusual volume" or dark-print alerts as short-horizon signals.

### Cited Findings
**Stealth trading and trade size**
- Barclay & Warner (1993): medium-size trades (500-9,999 shares) accounted for 92.8% of the cumulative pre-announcement price change across 108 tender offers (1981-1984). — as reported in [Chakravarty (2001, JFE) working paper](https://econwpa.ub.uni-muenchen.de/econ-wp/fin/papers/0201/0201003.pdf)
- Chakravarty (2001, NYSE audit trail, 97 stocks): medium-size trades caused about 79% of cumulative price change while making up 57% of trades and 47% of volume. Large trades caused about 25% of price change with 6% of trades and 51% of volume; small trades about 4% (36% of trades, 3% of volume). The effect is driven by institutional trades. — [Chakravarty](https://econwpa.ub.uni-muenchen.de/econ-wp/fin/papers/0201/0201003.pdf)
- Alexander & Peterson (2007, JFE): NYSE and Nasdaq trades cluster at multiples of 500, 1,000 and 5,000 shares. Rounded trades have greater price impact. Medium rounded trades have greater relative impact than large rounded trades, and trade initiation is more persistent for rounded trades. — [Alexander & Peterson PDF](https://c.mql5.com/forextsd/forum/223/An%20analysis%20of%20trade-size%20clustering%20and%20its%20relation%20to%20stealth%20trading.pdf); DOI 10.1016/j.jfineco.2006.02.005
- Across 41 markets, "clustering trades are documented to predict price movements, to generate perpetual return impact." — [Chen (2020), International Journal of Finance & Economics](https://ideas.repec.org/a/wly/ijfiec/v25y2020i4p579-597.html)
- Odd lots: a median of 24% of trades (60%+ in some stocks), contributing 35% of price discovery, "consistent with informed traders using odd lots to avoid detection." — [O'Hara, Yao & Ye (2014, JF)](https://onlinelibrary.wiley.com/doi/10.1111/jofi.12185)

**Retail flow: BJZZ (Journal of Finance 76(5):2249-2305, 2021)**
- Identifies marketable retail trades as off-exchange (TRF) prints with sub-penny price improvement, excluding prints between $0.004 and $0.006 ("trades at or near the half-penny are likely to be from institutions"). — [Barber et al. 2024 description of BJZZ](https://onlinelibrary.wiley.com/doi/full/10.1111/jofi.13334)
- Results: "stocks with net buying by retail investors outperform stocks with negative imbalances by approximately 10 bps over the following week." Less than half of the predictive power comes from order-flow persistence, and there is "suggestive, but only suggestive" evidence of firm-level information. — [BJZZ, Journal of Finance](https://onlinelibrary.wiley.com/doi/10.1111/jofi.13033); [SSRN 2822105](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2822105)
- Secondary (student thesis): BJZZ's cross-validation against Nasdaq TRF reportedly matched the true sign 98.2% of the time vs. 96.7% for Lee-Ready, for stocks under $100. — [Birgersson & Carlén (2021, Univ. of Gothenburg thesis)](http://hdl.handle.net/2077/69113). Treat as secondary.

**Barber, Huang, Jorion, Odean & Schwarz (Journal of Finance 2024), "A (Sub)penny for Your Thoughts"**
- Placed 85,000 retail trades in six brokerage accounts, December 2021 to June 2022.
- BJZZ identification and signing:
  - identifies 35% as retail;
  - mis-signs 28% of identified trades;
  - gives uninformative order imbalance for 30% of stocks.
- By spread:
  - identification is about 40% for spreads ≤ 5¢ but 28% for spreads > 10¢;
  - signing accuracy is 93% at a 1¢ spread but only 52% at spreads ≥ 10¢.
- The quote-midpoint signing fix (excluding prints at 40-60% of the NBBO) achieves about 95% accuracy, uniform across spreads.
- BJZZ shows "little change in retail order imbalance during the infamous GameStop episode," whereas the midpoint method shows a dramatic increase.
- Source: [Barber et al. 2024](https://onlinelibrary.wiley.com/doi/full/10.1111/jofi.13334)
- Barber, Lin & Odean (JFQA 2023), "Resolving a Paradox: Retail Trades Positively Predict Returns but Are Not Profitable" (title as cited). — listed in [Barber et al. 2024 references](https://doi.org/10.1111/jofi.13334)

**Off-exchange prints in vendor data (data fact)**
- Massive (formerly Polygon) tags off-exchange prints as exchange 4, with a trf_id, in its trades endpoint. — [Massive KB](https://massive.com/knowledge-base/article/does-massive-offer-level-2-data)

### Inferences
- "Big print = smart money" is not supported. The academic pattern is that informed traders hide in medium and odd-lot sizes. Block prints (often negotiated off-book or reported late) are a poor real-time directional signal.
- Retail order imbalance is a days-to-weeks signal of about 10 bps per week in the long-short spread, too small and slow for intraday use after costs. Its measurement noise (28% mis-signing under BJZZ) requires the midpoint correction.
- For CME futures there is no equivalent retail identifier in public data. Trade-size buckets (1-lot vs. large) are the only crude proxy, and no rigorous evidence was retrieved on them.

### Gaps
- No rigorous evidence was retrieved on:
  - intraday "unusual volume" scanners;
  - dark-pool/ATS print alerts or block-print momentum at seconds-to-minutes horizons;
  - Comerton-Forde & Putniņš (dark trading and price discovery) or FINRA ATS transparency data.
- Not retrieved: the intraday horizon decay of the BJZZ signal, and post-2022 replications using the midpoint method.

---

## 9. Data needed to do this properly, and vendors/costs (2025-2026)

### Takeaway
Doing OFI, queue imbalance or MBO-based work properly requires order-level (L3/MBO) or at least depth (L2/MBP-10) data with exchange timestamps:
- Nasdaq TotalView-ITCH or NYSE Integrated for equities;
- CME MDP 3.0 MBO for futures.

Consolidated TAQ/SIP-style data (trades plus NBBO) supports Lee-Ready signing and best-level OFI only.

Retail-accessible pricing as of 2024-2026:
- **Databento:** historical CME MBO about $1.80/GB and Nasdaq ITCH MBO about $1.50/GB (Dec-2024 unit sheet). CME live is now subscription-only, with a Standard plan at $179/month from April 2025.
- **LOBSTER academic:** £7,499 per year per institution.
- **Massive (ex-Polygon):** trades and NBBO only, with no depth for any asset class.

### Cited Findings
**CME MDP 3.0 (data fact)**
- Provides Market By Order Full Depth (MBOFD), 10-deep Market By Price, statistics and Trade Summary over UDP multicast with Simple Binary Encoding. "CME Globex Market by Order (MBO) disseminates individual orders and quotes at every price level." — [CME MDP 3.0 overview](https://cmegroupclientsite.atlassian.net/wiki/spaces/EPICSANDBOX/pages/457219613)

**Databento**
- Covers CME Globex MDP 3.0 "since 2010," 650,000+ symbols, with schemas MBO (L3), MBP-10 (L2), MBP-1, trades and OHLCV. — [Databento Futures](https://databento.tech/futures); [Databento GLBX.MDP3 dataset](https://databento.com/datasets/GLBX.MDP3)
- Usage-based unit prices (December 11, 2024 sheet), historical / live per GB:

  | Dataset | MBO | MBP-10 | Trades |
  |---|---|---|---|
  | GLBX.MDP3 (CME) | $1.80 / $2.16 | $0.50 / $0.60 | $28.00 / $33.60 |
  | XNAS.ITCH (Nasdaq) | $1.50 / $1.80 | $0.70 / $0.84 | $12.00 / $14.40 |
  | DBEQ.BASIC | $2.00 / $2.40 | n/a | n/a |

  Source: [Databento Unit Pricing PDF (2024-12-11)](http://databento-media.s3-website-us-east-1.amazonaws.com/media/unit-pricing-2024-12-11.pdf)
- Pricing changes over time: rates were revised effective May 1, 2024, and live users can query the `metadata.get_cost` / `list_unit_price` API endpoints. — [Databento blog, pricing updates](https://databento.com/blog/pricing-plans-updates)
- April 16, 2025: new CME subscription plans, including a Standard plan at $179/month, with Enterprise renamed Plus and Unlimited. Usage-based *live* CME data was discontinued (existing users grandfathered), while pay-as-you-go *historical* data remains. — [Databento blog, CME pricing plans](https://databento.com/blog/introducing-new-cme-pricing-plans)
- Equities coverage includes Nasdaq TotalView-ITCH, Nasdaq PSX/Texas ITCH, NYSE, NYSE Arca, NYSE American and NYSE Texas Integrated, Cboe BZX/BYX/EDGA/EDGX Depth, MEMX MEMOIR, MIAX Pearl and IEX TOPS. Databento states: "If you need L2 (MBP-10) or L3 (MBO) data, Nasdaq TotalView-ITCH is our only real-time feed that offers this at the moment." — [Databento Equities](https://databento.com/equities)

**LOBSTER**
- Reconstructed Nasdaq limit order book data for the entire universe of Nasdaq-traded stocks:
  - up to 200 price levels;
  - nanosecond timestamps;
  - submissions, cancellations and executions (visible and hidden) uniquely identified;
  - academic provider since 2013, now also commercial.
  - Source: [LOBSTER, What is LOBSTER](https://data.lobsterdata.com/info/WhatIsLOBSTER.php)
- Academic 1-year institutional subscription is £7,499 excl. VAT: 10 accounts, unlimited tickers and periods, up to 200 levels, pre-open and post-close flow, 1,000 GB storage, extra sub-accounts £100 each, minimum one year with auto-renewal. — [LOBSTER price list PDF](https://data.lobsterdata.com/info/docs/legal/LOBSTER_priceList.pdf)
- Level-10 pay-per-use for students at 0.1 LDC/MB. Owners of Bouchaud et al.'s *Trades, Quotes and Prices* can request a sample LOBSTER dataset. — [lobsterdata.com](https://lobsterdata.com/)

**Massive (formerly Polygon.io)**
- "Massive publishes NBBO quotes... but not full market depth or an order book, for any asset class." Only the NBBO history and every trade with its exchange are available. — [Massive KB, Level 2](https://massive.com/knowledge-base/article/does-massive-offer-level-2-data)
- Five independent subscriptions: Stocks, Options, Indices, Currencies, Futures. Trades and quotes start at paid tiers, and professional use requires a business license. — [Massive KB, subscriptions](https://massive.com/knowledge-base/article/what-are-the-different-massive-subscriptions-i-can-use)
- Business add-ons: Full Market real-time trades and quotes $1,999/month; Full Market Delayed $499/month; Nasdaq Basic $1,999/month; Cboe EDGX $1,999/month; exchange fees extra. — [Massive Business Pricing](https://massive.com/business)

**TAQ-quality caveats**
- Holden & Jacobsen show that withdrawn and cancelled quotes and TAQ's millisecond timestamp handling distort trade-quote alignment methods such as Lee-Ready. — cited in [Chakrabarty, Pascual & Shkilko](https://dee.uib.eu/digitalAssets/234/234006_Pascual.pdf)

### Inferences
**Minimum viable research stack for this topic**
- CME: Databento GLBX.MDP3 MBO, or MBP-10 at about $0.50/GB.
- US equities: XNAS.ITCH MBO.
- Academic replication of the Nasdaq papers: LOBSTER (Kolm et al., Gould & Bonart and CKS's auxiliary data all use LOBSTER).

**Live trading**
- Retail-latency CME feeds through FCM-provided platforms (Rithmic, CQG) are used by footprint and heatmap tools. Their latency and conflation characteristics matter more than price for sub-second OFI signals.
- Massive/Polygon-type data cannot support depth- or OFI-based research beyond best-level NBBO changes.

### Gaps
- Not retrieved:
  - current Rithmic and CQG market-by-order fees and conflation details;
  - CME non-professional depth fees;
  - WRDS TAQ access terms;
  - Nasdaq TotalView direct licensing fees;
  - Databento's 2026 unit prices, if they changed after the December 2024 sheet.
- The Polygon-to-Massive rebrand date was not confirmed. Massive's own documentation confirms the current product scope.

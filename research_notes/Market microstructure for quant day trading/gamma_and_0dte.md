# Dealer Gamma Positioning (GEX, Vanna, Charm) and 0DTE Options as Inputs and Instruments for Intraday SPX/SPY/QQQ/ES Trading

Notes compiled 2026-10-16. Scope: US index options (SPX/SPXW, XSP, SPY, QQQ) and their hedging spillover to ES/MES. Sources are labeled by type: [ACADEMIC], [EXCHANGE/REGULATOR] (Cboe, SEC, CME), [VENDOR/PRACTITIONER] (SqueezeMetrics, SpotGamma, LuxAlgo, etc.), [PRESS/SECONDARY]. Cboe has a commercial interest in 0DTE being seen as benign; vendors have a commercial interest in gamma levels being seen as useful. Where a figure came only from a search-engine summary and not a page I opened, it is marked "(search summary)".

## 1. Mechanics: delta hedging, long vs short gamma regimes, gamma flip, call/put walls, vanna/charm, pinning, OPEX narratives

### Takeaway
The mechanism is real and sound in theory. A delta-hedging options market maker (OMM) who is net long gamma trades against price moves, which dampens them; one who is net short gamma trades with price moves, which amplifies them. The strength of the effect depends on how large the OMM's gamma is relative to underlying liquidity, and on whether OMMs actually rebalance. The "walls", "flip" levels, and vanna/charm/OPEX-window stories are practitioner extensions of this idea. I found no peer-reviewed validation of them as specific price levels.

### Cited Findings
- **Core hedging mechanics.** A market maker who sells a 20-delta put shorts about 20 shares to hedge. If the put delta rises to 50 as price falls, the MM must short 30 more shares; if price rises and delta falls to 0, the MM buys the shares back. The MM is therefore "committed to a predictable and quantifiable regimen of buying and selling stock." SPX hedging is done with futures — [VENDOR] [SqueezeMetrics GEX white paper, rev. Dec 2017](https://slopeofhope.com/wp-content/uploads/2020/11/GEX-white_paper.pdf)
- **Regime definitions.** Positive GEX means MMs hedge by "buying into lows, selling into highs", which suppresses volatility. Negative GEX means "selling into lows, buying into highs", which magnifies it. GEX near zero lets the market "move naturally" — [VENDOR] [SqueezeMetrics](https://slopeofhope.com/wp-content/uploads/2020/11/GEX-white_paper.pdf)
- **Academic statement of the same mechanism.** If aggregate OMM gamma is negative, OMMs "buy as the market moves up and sell as the market moves down"; if it is positive, rebalancing attenuates moves. "In both cases, the strength of the effect depends on the magnitude of OMM gamma, and on whether OMMs rebalance their delta hedges." Because ATM 0DTE gammas are very large, index moves across strikes can cause large changes in required hedges, likely executed in index futures — [ACADEMIC] [Amaya, Garcia-Ares, Pearson & Vasquez, Jan 2025, hosted by Cboe](https://cdn.cboe.com/resources/education/research_publications/gammasqueezes.pdf)
- **Theory lineage.** Jarrow (1994) and Frey (1998) show MM hedging can affect volatility "if the underlying market is imperfectly elastic" — [ACADEMIC] cited in [Adams, Dim, Eraker, Fontaine, Ornthanalai & Vilkov, July 2026](https://www.jean-sebastienfontaine.com/papers/0dte-options-volatility.pdf). Barbon & Buraschi's version relies on "limited liquidity of the underlying market" and is distinct from information frictions or margin shocks — [ACADEMIC] [Barbon, Gamma Fragility page](https://abarbon.com/papers/gamma-fragility)
- **Why 0DTE matters.** "Because an option's gamma is greatest at expiration, 0DTE contracts have far larger hedging needs than longer-dated options." This makes them "the single most potent source of intraday variation in market makers' hedging needs" — [ACADEMIC] [Adams et al. 2026](https://www.jean-sebastienfontaine.com/papers/0dte-options-volatility.pdf)
- **Call wall / put wall (vendor definitions).** The call wall is the strike with the largest concentration of call gamma and "often acts as resistance and a price magnet". The put wall is the put-side counterpart, typically support. SpotGamma itself says put-wall support is "conditional": in a forceful selloff into deep negative gamma, hedging flips from cushioning to amplifying and a put wall "can give way quickly" — [VENDOR] [SpotGamma, call/put wall explainer, updated Aug 2026](https://spotgamma.com/call-wall-put-wall-explained/)
- **Vanna and charm (practitioner framework).** Vanna: when implied volatility falls, OTM put deltas shrink and dealers buy back part of their short hedge. Charm: deltas decay with time into expiration, prompting further buybacks. Desks describe supportive vanna/charm flows building into monthly OPEX in quiet, falling-vol stretches, then a "window of weakness" after expiring positions roll off. These flows are "estimates, not measurements" — [PRACTITIONER] [LuxAlgo, vanna/charm flows](https://www.luxalgo.com/library/concept/vanna-charm-flows/)
- **"Vol-crush/vanna rally" narrative.** When IV drops sharply, outstanding put deltas shrink, so dealers short fewer futures, buy them back, and push prices up. SpotGamma cautions this is not a fundamental "all clear" — [VENDOR] [SpotGamma, "Will the vol crush rally last"](https://spotgamma.com/will-the-vol-crush-rally-last/)
- **Pinning in single stocks (academic).** Optionable stocks' closing prices cluster at strikes on expiration dates. Returns are shifted by at least 16.5 bp per expiration, an aggregate market-cap effect of about $9bn per expiration date. The authors attribute this to OMM hedge rebalancing and to manipulation by proprietary traders. Data: OptionMetrics, 1996–2002 — [ACADEMIC] [Ni, Pearson & Poteshman 2005, JFE 78(1)](https://ideas.repec.org/a/eee/jfinec/v78y2005i1p49-87.html) (magnitudes via search summary and [FirmTape lit sweep](https://firmtape.com/research/what-the-0dte-literature-claims)); slides in [NYU Avellaneda pinning deck](https://math.nyu.edu/inmemoriam/avellaneda/PinningSlides.pdf)
- **Pinning in index futures.** 13.56% of S&P futures settle within $0.25 of a strike on serial expiration, against 10% expected under independence — [ACADEMIC] Golez & Jackwerth (2012, JFE 106(3)), via [FirmTape](https://firmtape.com/research/what-the-0dte-literature-claims)
- **Theoretical pinning model.** Avellaneda & Lipkin (2003), "A market-induced mechanism for stock pinning", Quantitative Finance 3 — cited in [SqueezeMetrics references](https://slopeofhope.com/wp-content/uploads/2020/11/GEX-white_paper.pdf)

### Inferences
- The academic literature supports the *sign* logic (long gamma dampens, short gamma amplifies). It does not support the claim that a particular strike, "wall", or "flip" level acts as a deterministic price barrier. Those are heuristics built on top of an estimated, not observed, position map.
- Vanna and charm effects are mathematically real: delta depends on IV and time. Whether they drive the market depends on dealer inventory, which is unobserved. Treat OPEX-window and vanna-rally stories as narratives with no rigorous tests found.
- Pinning evidence is strongest for single stocks and at expiration. For SPX the index is cash-settled and hedged in ES, and the OMM book is usually long gamma (see section 3), which is the precondition for pinning. A modest pinning tendency near large ATM strikes late in the day is therefore plausible, but I found no modern SPX-specific magnitude.

### Gaps
- No peer-reviewed test found of the SpotGamma-style "call wall/put wall" or "zero-gamma flip" levels as support, resistance, or regime boundaries.
- No rigorous study found of the "OPEX window of weakness" or "vanna rally" in SPX after 2022.
- No modern (post-2022 daily-expiry) estimate of SPX pinning magnitude found.

## 2. How GEX is computed, the dealer-side assumption, open-interest staleness, vendor approaches, and failure modes

### Takeaway
Standard GEX is gamma × open interest × 100 × spot (× spot × 1% for a dollars-per-1%-move version), signed +1 for calls and −1 for puts. That sign rests on the assumption "dealers long all calls, short all puts". Two inputs are unobserved and partly wrong: OI does not reveal who holds the contract, and OCC OI is end-of-day. The best direct evidence (Cboe capacity-coded data) shows SPX market makers are net *long* gamma about 88% of the time. Customers as a group are *short* ATM 0DTE straddles, which the naive convention gets backward for the most important strikes.

### Cited Findings
- **Original formula.** For calls, GEX = Γ · OI · 100. For puts, GEX = Γ · OI · (−100), "because for market-makers, where calls represent long gamma, puts represent short gamma." The total is summed over every strike and expiration; SPX GEX is denominated in dollars — [VENDOR] [SqueezeMetrics 2017](https://slopeofhope.com/wp-content/uploads/2020/11/GEX-white_paper.pdf)
- **The four SqueezeMetrics assumptions.** (1) All traded options are facilitated by delta-hedgers. (2) Calls are sold by investors and bought by MMs, since call overwriting and collaring drive the call market. (3) Puts are bought by investors and sold by MMs. (4) MMs hedge exactly to delta; in reality they use "hedging bands" — [VENDOR] [SqueezeMetrics](https://slopeofhope.com/wp-content/uploads/2020/11/GEX-white_paper.pdf)
- **Common dollar-notional form.** Practitioner implementations use sign × γ × OI × multiplier × spot² × 0.01, i.e. dollars of hedging per 1% move — [VENDOR] [third-party methodology page and secondary sources (search summary)](https://slopeofhope.com/?p=187436)
- **Academic version of the naive measure.** NGE_call = Γ · OI · 100 · P_t and NGE_put = Γ · OI · (−100) · P_t, summed and divided by S&P 500 market value. The authors explicitly assume "option market makers are short all puts and long all calls", and say the data "misses many long puts and short calls typically done OTC by institutional investors." SqueezeMetrics data were used to extend OptionMetrics, with "virtually identical results" in 2002–2017. On the naive measure, 2,930 days had negative NGE and 3,158 positive (1996–May 2020) — [ACADEMIC] [Baltussen, Da, Lammers & Martens 2021, JFE 142](https://academicweb.nd.edu/~zda/intramom.pdf)
- **Measurement error acknowledged by later work.** The NGE assumption that MMs are short all puts and long all calls "introduces measurement errors." Barbon et al. (2021) use detailed positioning data instead — [ACADEMIC] [Baltussen, Da & Soebhag, "End-of-Day Reversal", Apr 2025](https://academicweb.nd.edu/~zda/EOD.pdf)
- **Direct evidence on the actual sign.** From Cboe Open-Close data (Jan 2018–Dec 2024), "The market makers' net gamma is positive on average and throughout most of our sample". Net Γ is positive in 88% of 10-minute intervals, and the monthly average of 0DTE plus non-0DTE is always positive — [ACADEMIC] [Adams et al. 2026](https://www.jean-sebastienfontaine.com/papers/0dte-options-volatility.pdf)
- **Customer 0DTE structure, which inverts the naive convention at ATM.** "Customers begin the day with significant short 0DTE positions in at-the-money (ATM) or slightly out-of-the-money (OTM) options but long positions in far-OTM options", resembling "iron butterfly" or "iron condor" holdings. "The Customers' aggregate short ATM straddle position explains the large positive 0DTE net gamma of market makers" — [ACADEMIC] [Adams et al. 2026](https://www.jean-sebastienfontaine.com/papers/0dte-options-volatility.pdf)
- **OMM gamma "while typically positive, is often negative".** This was built at one-minute frequency from Cboe trade records that carry trader capacity (Customer vs Market Maker), July 2020–June 2023 — [ACADEMIC] [Amaya et al. 2025](https://cdn.cboe.com/resources/education/research_publications/gammasqueezes.pdf)
- **Conflicting claim.** Beckmeyer, Branger & Gayda (2023) state end users buy more 0DTE than they sell, leaving MMs net short — [ACADEMIC/PRESS] [Bloomberg coverage](https://www.bloomberg.com/news/articles/2023-04-21/day-traders-lose-358-000-per-day-gambling-on-zero-day-options); [CXO summary](https://cxoadvisory.com/individual-investing/retail-0dte-option-trader-performance). Contradicted by Cboe's finding that flow is "remarkably balanced between buy vs. sell" — [EXCHANGE] [Cboe, Sep 2023](https://www.cboe.com/insights/posts/volatility-insights-evaluating-the-market-impact-of-spx-0-dte-options) — and by the positive MM gamma in [Adams et al. 2026](https://www.jean-sebastienfontaine.com/papers/0dte-options-volatility.pdf)
- **OI staleness.** OCC reports open interest end-of-day, reflecting the previous session's close, so intraday and 0DTE GEX readings are one session stale — [VENDOR] [FlashAlpha](https://flashalpha.com/articles/0dte-gamma-exposure-pin-risk-intraday-options-analytics)
- **Mitigating fact on staleness.** Most MM 0DTE gamma comes from "Stale" positions accumulated *before* the expiration day: daily average 0.39% (post-May 2022) versus 0.16% for new same-day positions, in % of S&P 500 shares to hedge a 1% move. Pre-existing positions raise hedging needs by 25 bp on expiration day; new 0DTE positions contribute 3 bp. MMs "net out the trading volumes across 0DTEs during the day" — [ACADEMIC] [Adams et al. 2026](https://www.jean-sebastienfontaine.com/papers/0dte-options-volatility.pdf)
- **Further failure modes cited by vendors.**
  - Dealer-side assumptions are "estimates stacked on assumptions" (which side dealers hold, how continuously they re-hedge, whether OI matches the convention), and the GEX sign describes hedging pressure, not direction: negative-gamma markets can rally violently — [VENDOR] [LuxAlgo, GEX](https://www.luxalgo.com/library/concept/gamma-exposure/)
  - The convention breaks under heavy institutional call buying or covered-call ETF growth; GEX omits OTC and structured-product hedges; basic GEX ignores vanna/charm — [VENDOR] [Tapeboard glossary](https://tapeboard.com/glossary/gamma-exposure)
- **Cross-product netting caveat.** Cboe's own gamma analysis covers only SPX 0DTE. MMs may hold offsetting positions in other expiries or products (E-mini options, SPY options) and may hedge with other options rather than futures — [EXCHANGE] [Cboe, Sep 2023](https://www.cboe.com/insights/posts/volatility-insights-evaluating-the-market-impact-of-spx-0-dte-options)
- **SpotGamma's approach.** It argues that most platforms rank strikes by OI or gamma "computed under a fixed assumption about who holds the contracts", which "misses the question that determines whether the wall actually holds". Its proprietary SGOI "estimates actual market-maker and buyside positioning per strike and per name" (method not public) — [VENDOR] [SpotGamma](https://spotgamma.com/call-wall-put-wall-explained/)
- **SpotGamma HIRO.** A real-time indicator that "measures and aggregates the delta notional value from every option trade" across 400+ tickers using a proprietary algorithm. SpotGamma calls it a "leading indicator"; I found no independent validation. A SpotGamma page reportedly says HIRO models dealers as short both calls and puts (search summary) — [VENDOR] [SpotGamma HIRO](https://spotgamma.com/hiro-indicator/); [HIRO user guide PDF](https://spotgamma.com/wp-content/uploads/2025/10/SpotGamma-HIRO-User-Guide-2.pdf)
- **Ground-truth data source.** Cboe "sees every SPX transaction and can identify customer vs. market maker, buy vs. sell, and open vs. close" and tracks MM net positions by strike. Outside estimates are "assumption-based". 98% of 0DTE volume trades electronically — [EXCHANGE] [Cboe, Sep 2023](https://www.cboe.com/insights/posts/volatility-insights-evaluating-the-market-impact-of-spx-0-dte-options). Academic studies use the Cboe Open-Close Volume Summary data — [ACADEMIC] [Adams et al. 2026](https://www.jean-sebastienfontaine.com/papers/0dte-options-volatility.pdf)

### Inferences
- A retail-computed GEX from public OCC OI with the "long calls/short puts" convention is a different variable from the MM net gamma used in the strongest academic studies. Those studies use capacity-coded Cboe data. Positive academic results do not automatically transfer to vendor or homemade GEX.
- For SPX 0DTE specifically, the naive convention likely assigns the wrong sign to the heaviest ATM strikes, since customers are net short ATM straddles. That makes naive "gamma flip" levels near spot especially unreliable on expiration days.
- Staleness matters less than commonly claimed, because start-of-day positions dominate 0DTE MM gamma. The *sign/side* problem matters more than the *timing* problem.
- SPX-only computations ignore SPY, QQQ, ES options and OTC books. A "flip" computed on one venue can be offset elsewhere.

### Gaps
- Menthor Q, Unusual Whales and other vendor methodologies were not found in primary documentation, so I cannot describe how they assign dealer side or handle intraday 0DTE.
- No published accuracy test was found comparing vendor GEX (SqueezeMetrics, SpotGamma SGOI, etc.) with Cboe Open-Close MM positions.
- The exact formula SpotGamma uses for its zero-gamma level was not found in public docs.
- Pricing and availability of Cboe Open-Close data to retail was not verified.

## 3. Academic evidence: effect of options hedging and 0DTE on intraday price dynamics (with magnitudes)

### Takeaway
The weight of the best-identified evidence says OMM hedging measurably affects intraday dynamics, and that in SPX the average effect *dampens* volatility. MMs are usually long gamma, and expiring 0DTE positions increase that long gamma. The effect reverses, raising volatility and momentum, when OMM gamma is negative. Magnitudes are modest on average (single-digit % of realized vol) but can be material in tails. One prominent paper (Brogaard, Han & Won) finds 0DTE trading *raises* volatility, so the literature is not unanimous.

### Cited Findings
- **Ni, Pearson, Poteshman & White** (RFS 2021, 34(4):1952–1986): a "noninformational channel through which option market maker hedge rebalancing affects stock return volatility and the probability of large stock price moves" — [ACADEMIC] [RePEc record](https://ideas.repec.org/a/oup/rfinst/v34y2021i4p1952-1986..html). Their 2006 working paper, using CBOE single-stock data 1990–2001 with MM vs non-MM positions, reports:
  - A one-standard-deviation shock to MM net-position gamma is associated with a −36.8 bp change in daily absolute return, about 11.8% of the 310 bp average.
  - The low-MM-gamma group's average daily absolute return is 100 bp greater than the high-gamma group's.
  - Source: [ACADEMIC] [Pearson, Poteshman & White WP, Jul 2006](https://ou.edu/dam/price/Finance/CFS/paper/pdf/pearsonPoteshmanWhite.pdf). The published RFS magnitudes may differ.
- **Baltussen, Da, Lammers & Martens** (JFE 2021, 142:377–403). Across 60+ futures, 1974–2020, the last-30-minute return is positively predicted by the rest-of-day return (rROD), and the effect reverts over the next days. For S&P 500 futures (1996–May 2020):
  - Conditioned on prior-day naive NGE ≥ 0: βROD = 0.82 (t = 1.03), R² = 0.05%, i.e. no significant intraday momentum.
  - Conditioned on NGE < 0: βROD = 6.63 (t = 4.78), R² = 3.58%. Coefficients are ×100, so a 1% rest-of-day move predicts about +6.6 bp in the last half hour.
  - Interaction NGE × rROD = −123 (t = −3.42).
  - Equity-futures timing strategy η(rROD): 6.86% annualized return, 3.96% volatility, Sharpe 1.73, 55% hit rate, before costs. The authors say S&P 500 futures still give a positive net Sharpe at a one-tick cost.
  - Leveraged ETF market share also strengthens momentum.
  - Source: [ACADEMIC] [paper PDF](https://academicweb.nd.edu/~zda/intramom.pdf)
- **Barbon & Buraschi, "Gamma Fragility"** (WP, rev. Mar 2021):
  - Negative ex-ante dealer gamma imbalance interacted with illiquidity is associated with intraday momentum; positive imbalance with reversal. The effect is stronger in the least liquid securities.
  - Gamma imbalance is related to the frequency and magnitude of flash crashes.
  - Source: [ACADEMIC] [abarbon.com](https://abarbon.com/papers/gamma-fragility). Gamma imbalance vs volatility level has t up to −5.07 per [FirmTape](https://firmtape.com/research/what-the-0dte-literature-claims).
- **Adams, Dim, Eraker, Fontaine, Ornthanalai & Vilkov, "Do S&P 500 Options Increase Market Volatility? Evidence from 0DTEs"** (draft July 15, 2026; merges Dim-Eraker-Vilkov "0DTEs: Trading, Gamma Risk and Volatility Propagation" and Adams-Fontaine-Ornthanalai "The Market for 0DTE...Volatility Attenuation"; SSRN 5641974). Source for all points: [ACADEMIC] [PDF](https://www.jean-sebastienfontaine.com/papers/0dte-options-volatility.pdf)
  - **Causal design:** uses exogenous Tue/Thu 0DTE presence before May 2022 (holidays, month/quarter ends). On days when 0DTEs expire, 10-minute S&P 500 realized volatility is lower by 61 annualized bp, about 7% of the 9.10% mean. The weekday difference disappears once daily expiries exist.
  - **Hedging needs:** MM hedging needs average about 1% of S&P 500 shares per 1% index move; 0DTE presence raises them by 0.15 pp. A two-stage multiplier of about −4: each 1 bp more counter-trend hedging is associated with 4 bp lower realized volatility.
  - **Predictive (non-causal) evidence in E-mini data:** a 1-SD shift in 0DTE net gamma in a 10-minute interval reduces next-10-minute realized volatility by about 23 bp annualized, persisting about an hour.
  - **Order flow:** elevated MM net gamma strengthens order-flow reversals for about 30 minutes, decaying within the hour.
  - **Momentum:** hour-to-hour momentum returns are positive when hedging needs are low and negative (reversal) when they are high.
  - **Average net hedging needs** (% of S&P 500 per 1% move): 0.88% before May 2022 and 1.42% after. The 0DTE share rose from 0.23% to 0.54%, about one-third of the total.
  - **Sample:** Jan 2018–Dec 2024.
- **Dim, Eraker & Vilkov abstract** (earlier, now merged): "high open interest gamma in 0DTEs does not propagate past volatility". Markets have become "more integrated over time, leading to a marginally stronger link between the index volatility and 0DTE trading". "Intraday 0DTE trading volume shocks do not amplify recent past index returns" — [ACADEMIC] [Oxford seminar listing](https://www.maths.ox.ac.uk/node/67396); [SSRN 4692190](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4692190)
- **Amaya, Garcia-Ares, Pearson & Vasquez, "0DTE Index Options and Market Volatility: How Large is Their Impact?"** (Jan 2025; Cboe-provided trade data, July 2020–June 2023, one-minute OMM gamma, GARCH plus a counterfactual simulation). Source: [ACADEMIC] [Cboe-hosted PDF](https://cdn.cboe.com/resources/education/research_publications/gammasqueezes.pdf)
  - Conditional variance is negatively related to lagged OMM gamma.
  - Median impact of OMM gamma: −0.08 pp of daily volatility.
  - Maximum impact: +3.3 pp of annualized realized daily volatility, and +6.4 pp of annualized 30-minute volatility, when OMM gamma is negative. The authors note 3.3 pp is "well within the range of daily changes".
- **Brogaard, Han & Won, "Does 0DTE Options Trading Increase Volatility?"** (SSRN 4426358, first April 2023, revised Jan 2026). Instruments the 0DTE volume share with the staggered introduction of SPXW weeklies. A 1-SD rise in 0DTE trading raises volatility by about 9.10% of its mean; the effect remains after controlling for gamma hedging and is attributed mainly to speculative retail — [ACADEMIC] [SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4426358) (search summary; SSRN returned 403)
  - Critique: their identification "relies on the assumption that the introduction decision is unrelated to market volatility", and the lower volatility Adams et al. find comes from accumulated positions, not 0DTE volume share — [ACADEMIC] [Adams et al. 2026](https://www.jean-sebastienfontaine.com/papers/0dte-options-volatility.pdf)
  - A non-peer-reviewed blog replication on 1,083 SPX sessions reports about +0.6% vs +9% — [PRACTITIONER] [DEV Community](https://dev.to/firmtape/does-0dte-options-trading-raise-volatility-a-published-9-claim-measures-06-on-1083-spx-nni). Low weight.
- **Cboe market-maker gamma (2023).**
  - Median MM net gamma at 3:30pm: +$173mm. Interquartile range −$1.1bn to +$2.4bn; whiskers −$5bn to +$7.7bn, which is 1.3–1.9% of daily S&P futures notional (about $400bn/day). Average 0.04–0.17% of futures liquidity.
  - No increase in 2-sigma one-minute gap moves over the past year. The gap between close-to-close and intraday realized volatility was 2.7 vol points YTD, matching the 10-year average.
  - Source: [EXCHANGE] [Cboe, "Much Ado About 0DTEs", Sep 8 2023](https://www.cboe.com/insights/posts/volatility-insights-evaluating-the-market-impact-of-spx-0-dte-options)
- **Cboe (May 2025).** "Net market maker gamma hedging remains de minimis, representing at best, just 0.2% of the SPX daily liquidity", even as SPX intraday volatility hit "2008 GFC highs" in early April 2025 — [EXCHANGE] [Cboe, "0DTEs Decoded", May 2 2025](https://www.cboe.com/insights/posts/0-dt-es-decoded-positioning-trends-and-market-impact)
- **Note on units.** Adams et al. say MM hedging needs of about 1–1.4% of S&P 500 shares per 1% move could make "the attenuating effect on volatility...empirically significant". Cboe frames 0DTE MM gamma as tiny relative to futures volume. These are different denominators (total MM book vs 0DTE-only; S&P market cap vs futures turnover) — [ACADEMIC] [Adams et al.](https://www.jean-sebastienfontaine.com/papers/0dte-options-volatility.pdf); [EXCHANGE] [Cboe 2023](https://www.cboe.com/insights/posts/volatility-insights-evaluating-the-market-impact-of-spx-0-dte-options)
- **Single-stock retail options.** Lipson, Tomio & Zhang (2023) find retail-platform demand for long-dated options induces MM short positions and raises underlying stock volatility. O'Donovan, Yu & Zhang (2024) find positive-gamma MMs stabilize individual stocks — [ACADEMIC] cited in [Adams et al. 2026](https://www.jean-sebastienfontaine.com/papers/0dte-options-volatility.pdf)
- **Bandi, Fusari & Renò, "0DTE Option Pricing"** (SSRN 4503344, 2023). An Edgeworth-like local-in-time expansion adds time-varying skewness (leverage) and kurtosis (vol-of-vol) to a locally Gaussian density, giving "considerable price improvements" over standard models. Suggestive near-instantaneous predictability from 0DTE return and variance risk premia — [ACADEMIC] [EconBiz record](https://econbiz.de/Record/0dte-option-pricing-bandi-federico/10014348685); [JHU Carey summary](https://carey.jhu.edu/articles/risk-reward-insights-0dte-option-trading). A 2026 follow-up, "Ultra-short-term volatility surfaces" (arXiv 2603.29430), is noted by [FirmTape](https://firmtape.com/research/what-the-0dte-literature-claims)
- **Almeida, Freire & Hizmeri, "0DTE Asset Pricing"** (draft May 23 2025). Source: [ACADEMIC] [FMA PDF](https://www.fma.org/assets/docs/Derivatives2025/Almeida.pdf)
  - 0DTE investors mainly require compensation for *upside* moves. The high 0DTE variance risk premium is driven by upside risk and negatively predicts market returns.
  - Most 0DTEs violate stochastic-dominance bounds, against about 97% of one-month options satisfying them.
  - A delta-hedged mispricing strategy was "highly profitable before 2022, but dissipates after the daily availability of 0DTEs".
  - [FirmTape](https://firmtape.com/research/what-the-0dte-literature-claims) reports annualized 0DTE VRP of 1.54–2.95% by entry time (vs 0.55% at 1DTE), about 70% bound violations, and after-cost Sharpe of 0.40–0.47 in low-RV states vs 0.004–0.08 in high-RV states.
- **End-of-day reversal (cross-section).** Individual stocks reverse in the last 30 minutes by 3.78–6.86 bp/day (9.5–17.3%/yr gross), and "the effect cannot be explained by liquidity- or gamma-hedging effects". Gamma hedging contributes when MMs are net long gamma, and LETF demand contributes to stock-level momentum — [ACADEMIC] [Baltussen, Da & Soebhag, Apr 2025](https://academicweb.nd.edu/~zda/EOD.pdf)
- **Low-weight items.**
  - A Princeton senior thesis (Apr 2026) finds the gamma-hedging channel adds no meaningful predictive power for intraday variance forecasts beyond benchmarks — [ACADEMIC, student] [Princeton thesis](https://theses-dissertations.princeton.edu/entities/publication/61115cd1-cb09-4a8b-9230-ff488fc2a386)
  - A self-published preprint (Elms 2026) finds the daily range 16.2% wider on high-OI days, with only 1 of 5 tests significant and SPY OI as proxy — [PRACTITIONER] via [FirmTape](https://firmtape.com/research/what-the-0dte-literature-claims)

### Inferences
- Consensus as of Oct 2026: on average, SPX 0DTE and dealer hedging dampen intraday volatility. MMs are typically long gamma because customers sell ATM premium (iron condors/butterflies). Negative-OMM-gamma episodes exist and raise volatility (up to about +3.3 pp daily annualized in 2020–2023), but they are minority states.
- The fragility narrative ("0DTE will cause a crash") is not supported as an average effect. Tail amplification on specific days remains possible and is not ruled out (Amaya et al.).
- The strongest *tradable* result is Baltussen et al.'s conditional intraday momentum, which exists only on negative-gamma days. But (a) it uses the naive NGE convention, (b) the sample ends May 2020, before daily expirations, and (c) Adams et al. find reversal rather than momentum when hedging needs are high in 2018–2024. Post-2022 persistence is not established.
- Magnitudes are small relative to total volatility: about 7% of mean 10-minute RV for 0DTE presence, and about 23 bp annualized per SD of net gamma on a base near 9%. Gamma is a *volatility-regime* variable with modest explanatory power, not a price-target generator.

### Gaps
- Published-journal versions and final magnitudes are pending for Brogaard-Han-Won and for the merged Adams et al. paper (said to be resubmitted to RFS per [Vilkov research page (search summary)](https://www.vilkov.net/research.html)).
- I could not open the published RFS 2021 NPPW tables; magnitudes above are from the 2006 working paper.
- The Barbon & Buraschi paper's coefficient magnitudes beyond the t-statistic were not retrieved.
- No academic out-of-sample test of Baltussen-style gamma-conditioned momentum after May 2022 was found.

## 4. 0DTE facts as of 2025–2026: market size, expirations, participants, spreads, theta and gamma behavior, retail outcomes

### Takeaway
0DTE is now the dominant SPX maturity: about 59% of SPX volume in 2025, a record 66.2% in July 2026, and a record 3.4M contracts/day in September 2026. Retail is estimated by Cboe at about 50–60% of SPX 0DTE volume, though academic estimates conflict sharply depending on how "retail" is identified. Over 95% of 0DTE trades are limited-risk. Quoted ATM spreads tightened to 1–2 ticks by 2023, and limit-order users can trade cheaply. Academic evidence on retail P&L (2021–2023 data) shows net losses, dominated by transaction costs. That evidence has itself been challenged on methodology.

### Cited Findings
**Size and share (SPX)**
- 0DTE share of SPX volume: 5% (2016), over 40% after Tue/Thu expiries (2022), about 50% (Aug 2023). 2023 average was over 1.23M contracts/day, about $500bn notional — [EXCHANGE] [Cboe, Sep 2023](https://www.cboe.com/insights/posts/volatility-insights-evaluating-the-market-impact-of-spx-0-dte-options)
- SPX 0DTE volume "grown more than five-fold over the past 3 years", averaging almost 2M/day (May 2025) — [EXCHANGE] [Cboe, May 2025](https://www.cboe.com/insights/posts/0-dt-es-decoded-positioning-trends-and-market-impact)
- May 2025: over 61% of SPX volume (record at the time), up 9 pp from April — [EXCHANGE] [Cboe, Jun 2 2025](https://www.cboe.com/insights/posts/spx-0-dte-options-jump-to-61-share-on-retail-resurgence)
- August 2025: 62.4% of SPX volume, about 2.4M/day — [EXCHANGE] [Cboe, Sep 2 2025](https://www.cboe.com/insights/posts/spx-0-dte-options-jump-to-record-62-share-in-august/)
- Full-year 2025: SPX 0DTE ADV of 2.3M, about 59% of SPX volume; Q4 2025 about 2.6M/day — [EXCHANGE] Cboe FY2025 volume release via [Mondo Visione (search summary)](https://m.mondovisione.com/news/cboe-global-markets-reports-trading-volume-for-december-and-full-year-2025-202616)
- February 2026: record monthly SPX 0DTE ADV of 3.0M, record 63% of SPX trading — [EXCHANGE] [Cboe IR, Feb 2026 (search summary)](https://ir.cboe.com/news/news-details/2026/Cboe-Global-Markets-Reports-Trading-Volume-for-February-2026/default.aspx)
- July 2026: record 66.2% of SPX volume. XSP 0DTE ADV 138k; XSP record month. Global Trading Hours record ADV 224k (SPX GTH 197k) — [EXCHANGE] [Cboe, Aug 11 2026](https://www.cboe.com/insights/posts/market-metrics-that-matter-derivatives-july-2026-volume-highlights)
- September 2026: record monthly SPX 0DTE ADV of 3.4M and record quarterly (Q3) ADV of 3.2M; SPX quarterly ADV 4.9M (implies about 65% 0DTE, my calculation) — [EXCHANGE] [Cboe, Oct 12 2026](https://www.cboe.com/insights/posts/market-metrics-that-matter-derivatives-september-2026-volume-highlights)
- Across all US options, 0DTE contracts went from 18% of volume (Jan 2023) to almost 30% (Mar 2026) — [INDUSTRY] [SIFMA Insights, Apr 2026 (search summary)](https://www.sifma.org/wp-content/uploads/2026/04/SIFMA-Insights-Equities-and-Options-Monthly-Metrics_April_2026.pdf)

**Expiration calendar**
- SPXW (PM-settled) expirations: Fridays from 2005; Mon/Wed from 2016; Tue (Apr 18, 2022) and Thu (May 11, 2022) added, completing daily expiries — [REGULATOR] [SEC DERA WP, Mar 2025](https://www.sec.gov/files/dera-hope-reasonable-prc-2503.pdf). Adams et al. give Apr 26 and May 19, 2022 as first regular Tue/Thu dates (likely first expirations vs listings) — [ACADEMIC] [Amaya et al.](https://cdn.cboe.com/resources/education/research_publications/gammasqueezes.pdf)
- SPY and QQQ Tuesday/Thursday expirations listed Nov 14, 2022, completing daily expiries — [EXCHANGE] [MIAX alert](https://miaxglobal.com/alert/2022/11/14/miax-exchange-group-options-markets-listing-tuesday-and-thursday-weekly). IWM had Mon/Wed from 2021; a 2024 filing proposed Tue/Thu — [REGULATOR] [Federal Register 2024-08570](https://public-inspection.federalregister.gov/2024-08570.pdf)
- XSP (1/10 SPX, $100 multiplier, European, cash- and PM-settled) weeklies expire Mon–Fri — [EXCHANGE] [Cboe XSP specs](https://www.cboe.com/tradable_products/sp_500/mini_spx_options/specifications)
- Single stocks: in January 2026 the SEC approved Nasdaq listing Monday and Wednesday expiries for nine widely traded stocks, "a step closer to daily expiries in single stock options" — [PRESS] [Bloomberg, Jan 16 2026](https://www.bloomberg.com/news/articles/2026-01-16/mag-7-stock-options-get-sec-nod-for-monday-wednesday-expiries). Cboe filed (immediately effective, Jan 16, 2026) Mon/Wed expiries for stocks with market cap over $700bn plus volume tests — [REGULATOR] [Federal Register via PolicyRisk](https://policyrisk.com/federal-register/2026-01374)
- Nasdaq ISE proposed AM-settled NDX expiries Mon–Fri (May 8, 2026; pending) — [REGULATOR] [PolicyRisk 2026-09122](https://policyrisk.com/federal-register/2026-09122)

**Who trades (conflicting estimates)**
- Cboe estimates retail at about 50–60% of SPX 0DTE. Retail fell from 57% to 47% in the early-April 2025 volatility, then rebounded to 60% — [EXCHANGE] [Cboe, May 2025](https://www.cboe.com/insights/posts/0-dt-es-decoded-positioning-trends-and-market-impact). Retail was 54% in May 2025 — [Cboe](https://www.cboe.com/insights/posts/spx-0-dte-options-jump-to-61-share-on-retail-resurgence) — and 53% in Aug 2025 — [Cboe](https://www.cboe.com/insights/posts/spx-0-dte-options-jump-to-record-62-share-in-august/)
- Conflict: "While 0DTE options account for more than 75% of retail trading in S&P 500 options, the vast majority of 0DTE S&P 500 trading (around 94%) is still attributable to institutional investors" (footnote, likely based on Beckmeyer et al.'s identification) — [ACADEMIC] [Almeida et al. 2025](https://www.fma.org/assets/docs/Derivatives2025/Almeida.pdf)
- Explanation for the conflict: Beckmeyer et al. assumed retail orders go largely to Price Improvement Auctions. The SEC DERA authors find a large volume of retail-sized customer non-marketable limit orders on the limit order book: 66% of MTO and 68% of PO fills are one contract, and another 23%/21% are 2–5 contracts. They conclude there is "likely much more retail trading through NMLOs on the LOB than retail trading with marketable orders on the PIA" — [REGULATOR/ACADEMIC] [SEC DERA WP](https://www.sec.gov/files/dera-hope-reasonable-prc-2503.pdf)
- Risk structure: "over 95% of all 0DTE trades are done in a limited risk format"; "Only 4% of SPX 0DTE trading is in naked short options" — [EXCHANGE] [Cboe, May 2025](https://www.cboe.com/insights/posts/0-dt-es-decoded-positioning-trends-and-market-impact)

**Spreads and costs**
- In July 2020, the ATM SPXW BBO around 1pm was one tick wide only 0.5% of the time and three or more ticks wide 76% of the time. By July 2023 it was one tick wide 64.7% and two ticks 35.3% of the time. Ticks are $0.05 for options below $3 and $0.10 above $3 — [REGULATOR] [SEC DERA WP](https://www.sec.gov/files/dera-hope-reasonable-prc-2503.pdf)
- Customer midpoint limit orders, two-tick spread, under $3: 50% fill (early period) rising to 62% (late). The all-in expected cost, including fallback to a marketable order, was $0.028 then $0.021, vs $0.05 for a marketable order. Counterparty realized spread one minute later was under a penny in the later period. "Any exploitation of customers by market makers is much less than first appears." Sample Jul 2020–Sep 2023 — [REGULATOR] [SEC DERA WP](https://www.sec.gov/files/dera-hope-reasonable-prc-2503.pdf)
- Data artifact: in OPRA data a trade's resulting new BBO often carries an earlier timestamp than the trade (89.3% of trades out of sequence in July 2020). That biases spread and cost comparisons "as in Beckmeyer, Branger and Gayda (2023)" — [REGULATOR] [SEC DERA WP](https://www.sec.gov/files/dera-hope-reasonable-prc-2503.pdf)
- Intraday spread profile: 0DTE volume is highest at open and close, which are also the times of the highest relative bid-ask spreads. Spreads are "relatively stable at [their] minimum between 10:00 and 14:00" — [ACADEMIC] [Almeida et al.](https://www.fma.org/assets/docs/Derivatives2025/Almeida.pdf)

**Retail outcomes**
- Beckmeyer, Branger & Gayda ("Retail Traders Love 0DTE Options... But Should They?", SSRN 4404704, Mar 2023; data about Jan 2021–Feb 2023). Sources: [PRESS] [Bloomberg](https://www.bloomberg.com/news/articles/2023-04-21/day-traders-lose-358-000-per-day-gambling-on-zero-day-options); [Medium summary](https://medium.com/@y125789/retail-traders-love-0dte-options-paper-summary-6da4a7ff7d72); [CXO](https://cxoadvisory.com/individual-investing/retail-0dte-option-trader-performance)
  - Retail lost more than $70M in total, of which more than $50M was transaction costs.
  - Average losses were $184k/day over the full sample and $358k/day after May 16, 2022; more than 60% of the daily loss was transaction costs.
  - More than 75% of retail S&P 500 option trades were 0DTE.
  - Cboe's changes lowered effective spreads, but not enough to offset risk.
  - I found no journal version.
- Option Alpha broker data: 49.64% of its 0DTE-strategy users are profitable, from a self-selected platform sample — [PRACTITIONER] [Option Alpha](https://optionalpha.com/blog/0dte-options-strategy-performance). Low weight.
- Simple 0DTE strategy returns, Vilkov "0DTE Trading Rules" (SPXW Sep 2016–Jan 2026, 10:00 entry held to close): the unconditional variance premium is too small to monetize after costs. Unconditional net Sharpe: straddle −0.51, iron butterfly/condor −0.96 — [ACADEMIC] [SSRN 4641356](https://dx.doi.org/10.2139/ssrn.4641356), magnitudes via [FirmTape](https://firmtape.com/research/what-the-0dte-literature-claims). The replication package claims conditional out-of-sample rules on selected structures reach Sharpe 1.0–1.3 — [ACADEMIC, author claim] [repo mirror](https://tomevault.io/tome/vilkovgr/0dte-strategies)

### Inferences
- The retail-share disagreement (about 50–60% by Cboe vs about 6% implied by Almeida et al.) is mostly definitional and methodological. Cboe sees capacity and origin; the academic estimate depends on a PIA-routing assumption the SEC DERA authors challenge. Treat Cboe's figure as the better current estimate of retail-originated volume, with the caveat that Cboe is not neutral.
- Retail losses in Beckmeyer et al. are dominated by transaction costs. Since then, ATM spreads have tightened and the DERA authors show limit orders roughly halve costs. A disciplined trader using limit orders in liquid ATM strikes faces much lower frictions than the 2021–2023 average retail trader. That does not create positive expected value: academic strategy tests show near-zero or negative unconditional after-cost Sharpe.
- The pre-2022 0DTE mispricing documented by Almeida et al. has been competed away. Expect any surviving edge to be conditional, small, and capacity-constrained.

### Gaps
- No SEC or FINRA dataset on realized retail 0DTE P&L was found; the SEC DERA paper covers costs, not P&L. No Cboe-published retail P&L study was found.
- No 2025–2026 retail-loss estimate found; Beckmeyer et al. data end around Feb 2023.
- SPY/QQQ 0DTE share of their own option volume and their typical 0DTE spreads in 2025–2026 were not found.
- Cboe SPX fees per contract and typical broker commissions in 2026 were not verified.
- The IWM Tue/Thu approval and exact launch date were not confirmed.

## 5. Practical: can a retail algo exploit gamma levels (support/resistance or volatility regime filter)? Does long gamma predict lower intraday realized volatility?

### Takeaway
As a *volatility-regime* conditioner there is credible evidence. Higher MM net gamma predicts lower near-term intraday realized vol and more mean reversion; negative gamma predicts more momentum and volatility. The effect is modest, short-lived (about 30–60 minutes for intraday shocks), and best documented with capacity-coded Cboe data, not public-OI GEX. As *price support/resistance* ("walls", "flip"), the evidence is vendor-only and unverified. A retail algo could plausibly use gamma as a filter (e.g. favor fading in long gamma, momentum in short gamma) but should expect small effects and must test it on its own data.

### Cited Findings
- **Long gamma → lower volatility and reversal (strongest evidence).** A 1-SD increase in 0DTE MM net gamma lowers next-10-minute S&P realized vol by about 23 bp annualized, persisting about an hour. High net gamma strengthens order-flow reversal for about 30 minutes. Hour-to-hour momentum turns into reversal when hedging needs are high (2018–2024; Cboe Open-Close plus E-mini data; "not causal") — [ACADEMIC] [Adams et al. 2026](https://www.jean-sebastienfontaine.com/papers/0dte-options-volatility.pdf)
- **Negative OMM gamma → higher volatility.** Volatility is elevated when OMM gamma is negative, by up to +3.3 pp annualized daily vol and +6.4 pp 30-minute vol (2020–2023) — [ACADEMIC] [Amaya et al. 2025](https://cdn.cboe.com/resources/education/research_publications/gammasqueezes.pdf)
- **Naive-GEX conditioning.** Last-half-hour momentum exists only on negative naive-NGE days (β = 6.63×10⁻², t = 4.78) and not on positive days (β = 0.82×10⁻², t = 1.03), in S&P futures 1996–2020 — [ACADEMIC] [Baltussen et al. 2021](https://academicweb.nd.edu/~zda/intramom.pdf)
- **Vendor claim.** The 1-day SPX return standard deviation was 0.55% after the highest GEX quartile vs 0.85% after the second-highest. For comparison, 0.51% vs 0.66% after the lowest and second-lowest VIX quartiles. Volatility rises "exponentially" as GEX goes below zero. Pre-2018 data, vendor-published, no out-of-sample or cost analysis — [VENDOR] [SqueezeMetrics](https://slopeofhope.com/wp-content/uploads/2020/11/GEX-white_paper.pdf)
- **Walls as support/resistance.** Vendor descriptions only; SpotGamma says support is "conditional" and walls "can give way quickly" — [VENDOR] [SpotGamma](https://spotgamma.com/call-wall-put-wall-explained/). An older SpotGamma study reportedly found the call wall breached on 17% of sessions; that is company-published and not independently checked (search summary of a [SpotGamma page](https://spotgamma.com/?p=7102))
- **GEX sign is not direction.** "Negative-gamma markets can rally violently too" — [VENDOR] [LuxAlgo](https://www.luxalgo.com/library/concept/gamma-exposure/). A negative regime is "more volatile but not inherently bearish" — [VENDOR] [Tapeboard](https://tapeboard.com/glossary/gamma-exposure)
- **Real-time visibility is limited.** No one has real-time visibility into full dealer inventory, and claims otherwise should be met with skepticism (vendor blog, search summary) — [VENDOR] [Tanuki Trade blog](https://blog.tanukitrade.com/the-most-dangerous-misconceptions-about-gamma-exposure-and-why-most-traders-get-gex-wrong-3837bc31bddb)
- **Edge decay.** 0DTE pricing mispricings were profitable pre-2022 but "dissipate after the daily availability of 0DTEs, consistent with growing integration with the underlying market" — [ACADEMIC] [Almeida et al. 2025](https://www.fma.org/assets/docs/Derivatives2025/Almeida.pdf). Dim, Eraker & Vilkov likewise note growing integration — [ACADEMIC] [Oxford listing](https://www.maths.ox.ac.uk/node/67396)
- **Cost of momentum-timing.** The Baltussen et al. strategies are pre-cost, though the authors claim a positive net Sharpe in S&P futures at a one-tick cost and suggest exploiting the effect by timing already-planned trades — [ACADEMIC] [Baltussen et al. 2021](https://academicweb.nd.edu/~zda/intramom.pdf)

### Inferences
- **Practitioner claims vs what is verified:**
  - Verified, with caveats: the regime effect (long gamma means lower vol and more reversal; short gamma means higher vol and more momentum), using good position data.
  - Partially verified: naive-GEX regime conditioning of end-of-day momentum (pre-2020).
  - Unverified: specific levels (call wall, put wall, zero-gamma flip, "vol trigger") as support or resistance; vanna/charm OPEX windows; HIRO as a leading indicator.
- A sensible retail use is as a regime or feature input to sizing and strategy selection, e.g.:
  - mean-reversion/fade logic and premium-selling more favorable when MM gamma is strongly positive;
  - breakout/momentum logic and wider stops when gamma is negative.
  - Not hard entry levels.
- Because the documented intraday effects decay within about an hour and are small (about 2–3% of RV per SD), the signal is likely to matter more for risk management (expected range, stop width) than for directional alpha after costs.
- If a homemade GEX uses the naive convention, validate its sign against an independent proxy before trusting it. Candidates: Cboe-published MM gamma commentary, or the realized autocorrelation of 5–10 minute returns, which should be negative in true long-gamma states. Expect disagreement on 0DTE-heavy days.
- Known trap: confirmation bias. Walls "work" in quiet markets (most days) and fail in the large-move days that dominate P&L.

### Gaps
- No independent out-of-sample backtest found of trading SPX/ES at vendor gamma levels after costs.
- No public study found that compares vendor GEX levels with Cboe Open-Close-based MM gamma for predictive power.
- No evidence found on whether the Baltussen negative-gamma momentum effect survived after 2020 using naive GEX.

## 6. Related predictable intraday flows: leveraged ETF rebalancing, vol-control funds, CTAs, MOC imbalances

### Takeaway
Leveraged/inverse ETF rebalancing is mechanically in the direction of the day's move and concentrated near the close. It is documented academically as a contributor to end-of-day market momentum, and its size has grown, with estimates ranging from about $1bn (2011) to about $7bn (2024) per 1% move. Vol-control and CTA flows are slower, multi-day, realized-volatility-triggered flows, estimated mainly by sell-side desks. Single-stock end-of-day reversal is largely not explained by hedging flows.

### Cited Findings
- **LETF mechanics.** Both bull and bear LETFs must rebalance "in the same direction as the underlying index's daily performance". Their market makers rebalance "near or at the market close", typically with total return swaps and futures. Higher LETF market share strengthens market intraday momentum — [ACADEMIC] [Baltussen et al. 2021](https://academicweb.nd.edu/~zda/intramom.pdf)
- **LETF size, 2011 data.** A 1% broad-market move implied about $1.04bn of LETF rebalancing demand, concentrated in the last hour. A 1% S&P rise led to a 6.9 bp price increase from LETF rebalancing, possibly an underestimate — [REGULATOR] [Federal Reserve FEDS 2013-48](https://www.federalreserve.gov/pubs/feds/2013/201348/) (search summary)
- **LETF size, later estimates.** About $971M (S&P 500) and $2.3bn (NDX) of buying or selling per 1% move (BofA estimate; date not shown) — [PRESS] [Seeking Alpha](https://seekingalpha.com/news/4505651-stocks-with-the-highest-amount-of-money-leveraged-that-could-sway-etfs-bofa). Morgan Stanley estimated almost $7bn of equities per 1% move, as LETF assets hit a record $117bn (Bloomberg, Sep 2024) — [PRESS] [Bloomberg via Tiger](https://www.itiger.com/news/2466019752)
- **Stock-level evidence.** LETF demand contributes to stock-level intraday momentum near the close — [ACADEMIC] [Baltussen, Da & Soebhag 2025](https://academicweb.nd.edu/~zda/EOD.pdf), citing Barbon, Beckmeyer, Buraschi & Moerke (2021), "Liquidity provision to leveraged ETFs and equity options rebalancing flows: Evidence from end-of-day stock prices"
- **End-of-day cross-sectional reversal.** 3.78–6.86 bp/day gross. It "cannot be explained by liquidity- or gamma-hedging effects"; the authors attribute it to attention-driven retail buying of intraday losers and short-seller risk management — [ACADEMIC] [Baltussen, Da & Soebhag 2025](https://academicweb.nd.edu/~zda/EOD.pdf)
- **Vol-control and CTA flows (Nomura, April 2026).** About $108bn of net equity sales since early March 2026, including $24bn in one week. Possible further sales of $48bn by end-April if volatility rose, or about $20bn of buying by early May if volatility held or eased. The pool is estimated at over $1tn — [PRESS] [Kitco/Reuters, Apr 8 2026](https://www.kitco.com/news/off-the-wire/2026-04-08/volatility-linked-funds-put-march-us-stock-selling-spree-rearview)
- **Momentum persistence.** Market intraday momentum "reverts over the next days" — [ACADEMIC] [Baltussen et al. 2021](https://academicweb.nd.edu/~zda/intramom.pdf)

### Inferences
- For an intraday ES/SPX algo, the most mechanical flow is LETF rebalancing into the close. On large-move days, rebalancing scales roughly with the square of the move times assets (since leverage L needs L(L−1) × return × AUM of rebalancing), and pushes in the direction of the move. Combined with negative dealer gamma, this is the classic setup for last-hour continuation. On long-gamma days, dealer flows offset it.
- Vol-control and CTA flows are multi-day and depend on realized vol; they are not intraday-timeable without model estimates (sell-side, not public).
- These flows are widely known. Any edge must come from better estimates of magnitude and timing, not from knowing they exist.

### Gaps
- No public data or study found on NYSE/Nasdaq MOC imbalance size or predictability for SPX/ES in 2025–2026.
- No independent (non-sell-side) estimate of 2025–2026 LETF rebalancing per 1% move for SPX/NDX, including the large single-stock LETF segment.
- The Barbon-Beckmeyer-Buraschi-Moerke LETF paper's magnitudes were not retrieved.

## 7. Instrument economics: scalping small moves with 0DTE options vs ES/MES futures

### Takeaway
An ATM SPX 0DTE option has roughly the same delta exposure as one ES contract (≈0.5 × $100 ≈ $50/pt). Its P&L is non-linear, though: it is long gamma and short theta, and theta accelerates sharply into the close. Small scalps are therefore asymmetric. A +5 pt move gains less than the futures, a −5 pt move loses more, and a flat hour bleeds hundreds of dollars per contract. A long 0DTE position is essentially a bet that *realized* volatility over the holding period exceeds *implied*. For pure small-move directional scalping, ES/MES give linear exposure with no decay. 0DTE buys defined risk and convexity at the cost of theta and wider relative spreads, especially OTM.

### Cited Findings
- **MES contract.** $5 × S&P 500 index, minimum tick 0.25 points = $1.25 — [EXCHANGE] [CME MES contract specs](https://cmegroup.com/markets/equities/sp/micro-e-mini-sandp-500.contractSpecs.html). MES is one-tenth the size of the E-mini (ES), which implies $50 × index and a $12.50 tick — [PRACTITIONER] [NexusFi](https://nexusfi.com/a/instruments/micro-e-mini-futures)
- **XSP contract.** 1/10 of SPX value, $100 multiplier, European, cash-settled, PM-settled, Mon–Fri weeklies. Minimum tick $0.01 — [EXCHANGE] [Cboe XSP specs](https://www.cboe.com/tradable_products/sp_500/mini_spx_options/specifications)
- **SPXW ticks and spreads.** Tick is $0.05 below $3 and $0.10 above $3. ATM BBO was one tick 64.7% and two ticks 35.3% of the time in July 2023. Customer midpoint limit orders cost roughly half a marketable order on an all-in basis — [REGULATOR] [SEC DERA WP](https://www.sec.gov/files/dera-hope-reasonable-prc-2503.pdf)
- **Intraday spread pattern.** Relative spreads are highest at open and close and lowest from 10:00 to 14:00 — [ACADEMIC] [Almeida et al.](https://www.fma.org/assets/docs/Derivatives2025/Almeida.pdf)
- **Transaction costs dominate retail losses.** More than 60% of the $358k/day retail 0DTE loss (2022–2023) was transaction costs — [PRESS] [CXO summary of Beckmeyer et al.](https://cxoadvisory.com/individual-investing/retail-0dte-option-trader-performance)
- **Defined risk is the norm.** Over 95% of 0DTE trades are limited-risk; "the max loss is known at the point of entry" — [EXCHANGE] [Cboe, May 2025](https://www.cboe.com/insights/posts/0-dt-es-decoded-positioning-trends-and-market-impact)
- **Gamma explodes at expiration.** "The gamma of ATM options starts growing exponentially as we near the expiration time, while the gamma of OTM options decays toward zero" — [ACADEMIC] [Adams et al. 2026](https://www.jean-sebastienfontaine.com/papers/0dte-options-volatility.pdf)
- **"One-or-zero bet."** Beckmeyer described 0DTE as a "one-or-zero bet" with large upside and downside — [PRESS] [Bloomberg, Apr 2023](https://www.bloomberg.com/news/articles/2023-04-21/day-traders-lose-358-000-per-day-gambling-on-zero-day-options)
- **Unconditional 0DTE structures underperform.** Straddles and condors held to close have negative after-cost Sharpe (−0.51 and −0.96), Sep 2016–Jan 2026 — [ACADEMIC] [Vilkov, SSRN 4641356](https://dx.doi.org/10.2139/ssrn.4641356) via [FirmTape](https://firmtape.com/research/what-the-0dte-literature-claims)

### Inferences
All figures below are my own Black-Scholes calculations, not from a source. Assumptions: SPX = 6000, ATM strike, r = 0, variance accruing only over a 6.5-hour session × 252 days. They show shape, not exact market prices; real 0DTE surfaces have skew, event variance and intraday IV changes (see Bandi et al.).
- **Premium and decay at IV 12%.** The ATM call is about $18.1 at the open, $14.2 with 4h left, $10.0 with 2h, $7.1 with 1h, and $3.6 with 15 minutes left. Theta per contract is about −$139/hr at the open, −$251/hr with 2h left, −$355/hr with 1h left, and about −$710/hr in the last 15 minutes. At IV 18%, theta runs from about −$209/hr to −$1,065/hr. ATM time value scales with √(time left), so decay per hour accelerates into the close.
- **Gamma.** At IV 12%, ATM gamma per index point rises from about 0.009 at the open to 0.022 with 1h left and 0.045 with 15 minutes left. A 10-point move shifts delta by about 0.09 at the open but about 0.45 near the close, which is the late-day "pin-or-explode" behavior.
- **Delta equivalence.** One ATM SPX 0DTE option has delta of about 0.5 × $100 = about $50/pt, roughly 1 ES or 10 MES, while risking only the premium (about $1,400–2,700 at mid-day IV 12–18%).
- **Scalp asymmetry.** Example: buy an ATM call with 4h left at IV 15%, about $17.7.

  | Outcome | ATM call P&L | ES P&L |
  |---|---|---|
  | +5 pt in 15 min | about +$206 | +$250 |
  | −5 pt in 15 min | about −$295 | −$250 |
  | Flat for 1h | about −$238 | $0 |
  | +5 pt after 1h | about +$26 | +$250 |
  | +20 pt in 15 min | about +$1,128 | +$1,000 |

  So 0DTE beats futures only for moves large relative to the time held.
- **Break-even rule.** For a long ATM option (delta-hedged view), gamma P&L ≈ ½Γ(ΔS)² beats theta only if the realized move over the holding window exceeds about σ_implied × S × √Δt. At IV 15% and S = 6000 that is about 22 SPX points per hour of session time. Buying 0DTE to scalp 3–5 point moves is structurally a losing proposition unless realized vol exceeds implied.
- **Spread cost vs futures.** For an ATM SPX option priced above $3, a 1–2 tick spread ($0.10–$0.20) means about $10–20 round-trip per contract when crossing. ES costs one tick ($12.50) round-trip for similar delta. Costs are comparable at ATM but far worse in percentage terms for cheap OTM "lottery" strikes, before per-contract exchange fees and commissions, which were not verified here. Limit orders at mid can roughly halve option costs (SEC DERA).
- **Risk profiles.**
  - Long 0DTE: defined loss, convex, but high probability of losing the full premium if timing is wrong.
  - Short 0DTE premium (what customers in aggregate do, per Adams et al.): high win rate with tail-loss exposure. Gamma risk near the close makes stops slippage-prone.
  - ES/MES: linear, no decay, tight spreads, but unlimited adverse exposure without stops, and intraday leverage via low margins (about $50 MES intraday margin at some brokers, per [NinjaTrader](https://ninjatrader.com/Futures/Blogs/What-are-Micro-E-mini-S-P-500-Futures-MES)).
- **XSP** gives 1/10 SPX sizing (about $5/pt delta for ATM) and makes small-account sizing feasible. Its liquidity (July 2026 0DTE ADV 138k vs SPX 0DTE in the millions) suggests wider relative spreads; not verified.
- **Bottom line for "edge or trap".**
  - Gamma levels have real but modest value as volatility-regime context. They have no demonstrated value as precise support/resistance.
  - 0DTE options are fairly priced to slightly rich after costs on average, and the documented pre-2022 mispricings are gone. They are a tool for expressing views on realized vs implied volatility over hours, not a cheaper way to scalp small directional moves, for which ES/MES are more efficient.
  - The trap is using naive GEX levels as deterministic barriers while buying short-dated convexity that bleeds theta.

### Gaps
- Current (2026) exchange and broker fee schedules for SPX, XSP, SPY options and ES/MES were not retrieved; all-in cost comparisons exclude fees.
- No 2025–2026 empirical data on typical XSP/SPY/QQQ 0DTE quoted spreads.
- No academic study found that directly compares retail scalping outcomes in 0DTE options vs micro futures.

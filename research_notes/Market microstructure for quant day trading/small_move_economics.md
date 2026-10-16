# Economics and Infrastructure of Scalping Small Intraday Moves (ES/MES/NQ/MNQ futures, 0DTE SPX/XSP/SPY/QQQ options), US retail perspective, as of Oct 2026

Note on sourcing: CME Group contract-spec and margin pages returned HTTP 503 and the IBKR commissions page returned HTTP 403 during this research, so some exchange and broker numbers come from official-site search snippets, broker pages, or prop-firm fee tables rather than the primary page. Each one is flagged. All worked calculations are mine; their inputs are cited.

## Q1. Futures contract specs, per-round-trip costs, margins, and breakeven win rates for 1–4 tick targets

### Takeaway
After fees, ES costs about 0.30 tick per round trip in exchange, NFA and broker fees, or about 1.3 ticks if the trader also crosses the 1-tick spread. MES costs about 1 tick in fees alone (about 2 ticks crossing the spread). MNQ costs about 2.4 ticks in fees alone. So for 1–2 tick targets, the breakeven win rate runs from about 58% in the best case (ES, passive fills, 2:2 bracket) to over 100% (any micro contract with a 1-tick target, or any contract that crosses the spread for a 1-tick target). Per dollar of notional, micros cost about 3.2× more than the full-size contracts.

### Cited Findings
**Contract specs**
- MNQ is $2 × the Nasdaq-100 index, with a 0.25 index-point minimum tick worth $0.50. NQ is $20 per point, so a tick is $5.00. MES is $5 per point with a 0.25 tick worth $1.25 — [CME MNQ contract specs (via search snippet)](https://cmegroup.com/trading/equity-index/us-index/micro-e-mini-nasdaq-100_contractSpecs_futures.html); [NexusFi tick-size wiki](https://nexusfi.com/wiki/trading-wiki/Tick-Size); [Ironbeam MNQ specs](https://www.ironbeam.com/knowledge-base/micro-e-mini-nasdaq-100-futures-mnq-contract-specifications/)
- ES has a $12.50 tick value. MNQ has a $0.50 tick value — [damnpropfirms, "Futures commissions explained" (Aug 22, 2026)](https://damnpropfirms.com/trading-guides/futures-commissions-explained-what-you-actually-pay/). (ES is $50 × index with a 0.25 tick; I could not reach the CME ES spec page because it returned 503.)

**Exchange, NFA and commission (per contract)**
- Topstep's fee table for TopstepX accounts (2026) gives these round-turn figures. ES: exchange $2.76 + NFA $0.02 + commission $1.00 = **$3.78**. MES: exchange $0.70 + NFA $0.02 + commission $0.50 = **$1.22**. NQ totals $3.78 and MNQ totals $1.22, with no breakdown. A CME exchange-fee increase dated Oct 1, 2026 applies only to MCL and MNG, not to the equity-index contracts — [Topstep Help Center: TopstepX commissions and fees](https://help.topstep.com/en/articles/8284213-topstepx-commissions-and-fees). (This implies a CME non-member exchange fee of about $1.38 per side for ES and $0.35 per side for MES.)
- 2026 all-in estimates at discount-broker tiers: ES/NQ $1.65–$2.65 per side ($3.30–$5.30 round trip) and MES/MNQ $0.30–$0.55 per side ($0.60–$1.10 round trip). Typical ranges per side: broker commission $0.09–$2.50, exchange fee $0.25–$1.60+, clearing $0.05–$0.20, NFA $0.02 per side ($0.04 round trip) — [damnpropfirms (Aug 2026; affiliate site, secondary sources)](https://damnpropfirms.com/trading-guides/futures-commissions-explained-what-you-actually-pay/). **Conflict:** Topstep lists the NFA fee as $0.02 per round turn, while damnpropfirms says $0.02 per side. The dollar difference is negligible.
- NinjaTrader commissions per side, plus exchange, clearing and NFA fees on top. Free plan: $0.39 micro / $1.29 standard. Monthly plan ($99/mo): $0.29 / $0.99. Lifetime plan ($1,499 one-time): $0.09 / $0.59. Top-of-book real-time data is included once the account is funded — [NinjaTrader pricing](https://ninjatrader.com/pricing/)
- Tradovate per side: ES $1.29 (free) / $0.99 (monthly). Micros are about $0.39 (free) / $0.09 (monthly). Plans cost $99/mo or $1,499 lifetime. The source's wording on the micro figures is ambiguous — [damnpropfirms (Aug 2026)](https://damnpropfirms.com/trading-guides/futures-commissions-explained-what-you-actually-pay/)
- IBKR US futures tiers per contract per side: $0.85 for ≤1,000 contracts per month, $0.65 for 1,001–10,000, $0.45 for 10,001–20,000, $0.25 for >20,000. Exchange and regulatory fees are extra — [IBKR futures commissions (official page, via search snippet)](https://www.interactivebrokers.com.sg/en/index.php?f=49560). For micros, secondary sources say about $0.25 per side plus fees, but their figures conflict — [NexusFi IBKR futures](https://nexusfi.com/a/brokers/interactive-brokers-futures-trading)
- AMP: one undated forum post reports "$1.67 per side all up" for ES, of which $0.50 is commission — [NexusFi thread](https://nexusfi.com/showthread.php?p=825022). I found no current official AMP commission table; AMP publishes data fees separately (see Q5).
- I did not find Optimus Futures or Edge Clear per-contract commissions in a primary source (see Gaps).

**Margins**
- NinjaTrader day-trade (intraday) margins: ES $500, MES $50 — [NinjaTrader pricing](https://ninjatrader.com/pricing/)
- TradeStation (undated): ES overnight maintenance $11,800, intraday maintenance $1,168 (a 10% intraday rate) — [TradeStation futures margin rates](https://www.tradestation.com/?p=42775). NexusFi gives about $11,300 maintenance and about $12,650 initial as "representative," undated — [NexusFi margin requirements](https://nexusfi.com/a/brokers/futures-margin-requirements). One outlier source claims $22,000–$24,500 maintenance in mid-2026; this is unverified and conflicts with the others — [LegalClarity](https://legalclarity.org/e-mini-futures-contract-specs-margins-and-taxes/). I could not retrieve CME's official margin page (503).

### Inferences
**Worked calculation A: round-trip (RT) cost in ticks and index points.** Inputs are the Topstep fee table (ES/NQ $3.78, MES/MNQ $0.50-commission tier at $1.22) and the tick values above. "+spread" means a market order in and a market order out, paying half the 1-tick spread on each side relative to mid, so 1 tick in total.

| Contract | Tick $ | RT fees $ | Fees in ticks | Fees in index pts | Fees + 1-tick spread (ticks / $ / pts) |
|---|---|---|---|---|---|
| ES | 12.50 | 3.78 | 0.30 | 0.076 | 1.30 t / $16.28 / 0.33 pts |
| MES | 1.25 | 1.22 | 0.98 | 0.244 | 1.98 t / $2.47 / 0.49 pts |
| NQ | 5.00 | 3.78 | 0.76 | 0.189 | 1.76 t / $8.78 / 0.44 pts |
| MNQ | 0.50 | 1.22 | 2.44 | 0.610 | 3.44 t / $1.72 / 0.86 pts |

Fee-only sensitivity across brokers and plans:
- ES runs from $3.30 to $5.38, which is 0.26–0.43 tick. The high end is the NinjaTrader free plan: $1.29×2 + $2.76 + $0.04.
- MES runs from $0.60 to $1.52, which is 0.48–1.22 ticks. The NinjaTrader lifetime plan gives $0.92 (0.74 tick); the free plan gives $1.52 (1.22 ticks).

Per unit of notional, MES costs $1.22 per $5/pt versus $3.78 per $50/pt for ES, so **MES is about 3.2× more expensive**. Ten MES contracts carry about $12.20 in fees against $3.78 for one ES.

**Worked calculation B: breakeven win rate.** Let T be the target in ticks and S the stop in ticks, both measured from the entry fill, and let C be the RT cost in ticks. Then expectancy per trade is E = p(T−C) − (1−p)(S+C) = p(T+S) − S − C, and the breakeven win rate is **p\* = (S+C)/(T+S)**.

| Case | 1:1 | 2:2 | 3:3 | 4:4 | T1/S4 | T2/S4 | T4/S2 | T1/S8 |
|---|---|---|---|---|---|---|---|---|
| ES, fees only (C=0.30), limit in and limit out | 65.1% | 57.6% | 55.0% | 53.8% | 86.0% | 71.7% | 38.4% | 92.2% |
| ES, fees + spread (C=1.30), market in and out | >100% | 82.6% | 71.7% | 66.3% | >100% | 88.4% | 55.0% | >100% |
| MES, fees only (C=0.98) | 98.8% | 74.4% | 66.3% | 62.2% | 99.5% | 82.9% | 49.6% | 99.7% |
| MES, fees + spread (C=1.98) | >100% | 99.4% | 82.9% | 74.7% | >100% | 99.6% | 66.3% | >100% |
| NQ, fees only (C=0.76) | 87.8% | 68.9% | 62.6% | 59.5% | 95.1% | 79.3% | 45.9% | 97.3% |
| MNQ, fees only (C=2.44) | >100% | >100% | 90.7% | 80.5% | >100% | >100% | 74.0% | >100% |

For a common real-world setup (passive limit entry, limit take-profit, stop-market exit that slips 1 tick on losers), the ES T1/S8 bracket's breakeven rises from 92.2% to 93.0%.

**Key structural point.** If price follows a driftless random walk, a T/S bracket wins with probability S/(T+S). Substituting that into the expectancy formula gives E = −C exactly. A high win rate is therefore a mechanical result of where the bracket is placed, not evidence of skill. The only thing that pays is the excess win rate above S/(T+S), and that excess must exceed C/(T+S). Examples: for ES 2:2, the win rate must be 7.6 points above 50%. For ES T1/S8, random already gives 88.9%, and 92.2% is needed.

**Leverage.** Assume SPX ≈ 7,700, the level used in the Concretum 2026 study in Q2. Then one ES has about $385k notional (MES about $38.5k), and a $500 day margin implies about 770× leverage. Consequences:
- One tick is 0.0032% of price, but it is 2.5% of the day margin.
- A 0.5% index move (154 ES ticks) is about $1,925, or 3.85× the day margin.
- Each round trip costs 0.76% of day margin in fees alone (fee-only ES), or 3.3% with spread crossing.

**Daily cost drag.** At 20 market-order round trips per day for 252 days, the drag per contract is about $82k per year for ES ($16.28 × 20 × 252) and about $12.4k per year for MES.

### Gaps
- I could not retrieve CME's official exchange fee schedule for ES/MES/NQ/MNQ (member versus non-member) or CME's official initial/maintenance margins for October 2026; the CME pages returned 503. The broker margin figures above are undated or broker-set.
- I found no current official commission pages for AMP, Optimus, Edge Clear or Tradovate. Those figures are from secondary or forum sources.
- I found no rigorous published statistic for typical ES market-order slippage beyond the spread, or for how often the ES spread is wider than 1 tick. The "1 tick" spread is the standard practitioner assumption; the only supporting data I found was single-stock evidence of about 98% one-tick time (Citigroup/GE, 2008) — [arXiv 1202.6412](https://arxiv.org/pdf/1202.6412). NQ/MNQ spreads are often reported anecdotally as 1–2 ticks, but I found no source.

## Q2. 0DTE options cost structure (SPX/XSP/SPY/QQQ): spreads, fees, theta/gamma intraday, and tax treatment

### Takeaway
For SPX 0DTE, the median ATM quoted spread is 0.20 point ($20), about 1% of premium at 10:00 ET and about 3% by 15:30. The ATM premium decays at roughly $190–$260 per hour per contract. On a delta-equivalent basis (one ATM SPX ≈ one ES), a round trip that crosses the spread costs about $22.50 before theta, roughly 1.8 ES ticks of underlying movement. Each minute held adds roughly $3–4 of theta. SPY/XSP spreads are pennies, but per-contract commissions are a large share of premium on cheap options. SPX and XSP get Section 1256 60/40 tax treatment; SPY and QQQ options do not.

### Cited Findings
**Spreads**
- SPXW 0DTE, Jan 2022–Aug 2026, 30-minute Cboe quote snapshots. The median ATM spread was **0.20 index points ($20/contract)** for both calls and puts. OTM medians (0.5–1.0% OTM) were 0.05–0.10 points ($5–$10). In basis points of strike, spreads were 0.10–0.34 bp — [Concretum Research, "SPX 0DTE Options" (practitioner, not peer-reviewed)](https://concretumgroup.substack.com/p/spx-0dte-options)
- The median ATM SPXW mid premium, in bp of strike, decays from about 24 bp at 10:00 ET (about 19 points or about $1,900 at a 7,700 strike) to about 18 bp at 12:00, about 13 bp at 14:00, and about 8 bp at 15:30. OTM decay is "even more aggressive." Spread by time of day was not reported — [Concretum Research](https://concretumgroup.substack.com/p/spx-0dte-options)
- SPY 0DTE ATM spreads are often 1 cent. A 2023 example showed a 0DTE quoted at $0.14/$0.15, where the 1-cent spread was about 6.7% of premium, against about 0.7% for the next-day expiry at $1.43/$1.44 — [Schaeffer's Research (Sept 2023)](https://www.schaeffersresearch.com/content/bgs/2023/09/22/0dte-options-are-higher-spreads-imminent). **Conflict:** FlashAlpha says ATM SPY 0DTE is typically $0.02–$0.05 wide and SPX $0.10–$0.30 — [FlashAlpha](https://flashalpha.com/articles/0dte-spy-complete-intraday-playbook-same-day-options)
- Typical option bid-ask spreads run "5% to 10% or more" of premium — [Bogousslavsky & Muravyev, "An Anatomy of Retail Option Trading" (Aug 2024 draft)](https://www.lsu.edu/business/files/event-files/2025-finance-mardi-gras/retail_option_trading_v2.pdf)
- I found no QQQ 0DTE-specific spread data. QQQ trades roughly 2–3M option contracts per day against SPY's 4–6M (commercial site, methodology unverified) — [ApexVol](https://apexvol.com/best/etfs-for-options-trading)

**Exchange and regulatory fees (Cboe Fees Schedule dated May 29, 2026, Exhibit 5 to an SEC filing)** — [Cboe Fees Schedule Exhibit 5, SEC 34-105669](https://www.sec.gov/files/rules/sro/cboe/2026/34-105669-ex5.pdf)
- Customer (capacity "C") SPX (including SPXW) transaction fee: **$0.36/contract** when premium is under $1.00 and **$0.45/contract** when premium is $1.00 or more.
- The **SPXW Execution Surcharge** is **$0.14** (electronic only) and applies to capacity codes that include C. The SPX "Index License" surcharge ($0.20) lists capacity codes FJLMBNU, which does not include C, so it does not apply to customers.
- XSP customer fee: **$0.07/contract for orders of 10+ contracts**, and a **$0.30 rebate per contract for orders under 10 contracts**. Whether a broker passes the rebate to the customer is a separate question.
- Exchange Options Regulatory Fees (ORF) from July 1, 2026 under the new on-exchange model, per contract side: BOX $0.02201, MEMX $0.0200, C2 $0.01417 (proposed), Emerald $0.0006 — [BOX Notice 2026-61](https://boxexchange.com/assets/Notice-2026-61-Options-Regulatory-Fee-Reminder.pdf); [MEMX filing 34-105952](https://www.sec.gov/files/rules/sro/memx/2026/34-105952-ex5.pdf); [C2 filing 34-105903](https://www.sec.gov/files/rules/sro/c2/2026/34-105903-ex5.pdf)

**Broker commissions**
- Schwab $0.65 per contract per side; IBKR top tier $0.15 per contract (third-party comparison dated Jan 28, 2026) — [TradeStation comparison](https://www.tradestation.com/promo/options-stars/)
- tastytrade broad-based index options: $1 per contract to open, $0 to close, plus exchange fees — [StockBrokers.com tastytrade review](https://stockbrokers.com/review/tastytrade); [InvestorMint](https://investormint.com/company/tastytrade)

**Volume and participants**
- 0DTE was about 61% of SPX volume in Q4 2025, up from 51% a year earlier (secondary summary of Cboe results) — [Fintool, Cboe Q4 2025](https://fintool.com/app/research/companies/CBOE/earnings/Q4%202025)
- Estimated retail share of SPX 0DTE was about 57% in June 2026, and SPX 0DTE ADV was about 3.1M contracts (secondary summary of the Cboe Q2 2026 call) — [Mitrade transcript](https://www.mitrade.com/insights/news/live-news/article-8-1978291-20260808); retail share was 54% in June 2025 — [Cboe insights](https://www.cboe.com/insights/posts/spx-0-dte-options-jump-to-61-share-on-retail-resurgence)

**Tax treatment**
- Section 1256 contracts include regulated futures and nonequity options such as broad-based index options. They are marked to market at year end and taxed 60% long-term / 40% short-term regardless of holding period, reported on Form 6781 — [TaxSlayer Pro, Form 6781](https://support.taxslayerpro.com/hc/en-us/articles/360040712794); [IRS draft Form 6781](https://www.stayexempt.irs.gov/pub/irs-dft/f6781--dft.pdf)
- Narrow-based indexes and individual equity options do not qualify — [CertFuel Series 7, Section 1256](https://app.certfuel.com/series7/learn/options/options-taxation-and-calculations/section-1256-contracts). The maximum blended federal rate is about 26.8%, versus 37% for short-term gains — [Beancount guide (May 2026)](https://beancount.io/blog/2026/05/14/section-1256-contracts-60-40-tax-treatment-futures-broad-based-index-options-regulated-forex-form-6781-mark-to-market-traders-guide)

### Inferences
**Worked calculation C: SPX 0DTE ATM scalp cost.** Inputs: Concretum premium path at a 7,700 strike; 0.20-point spread; Cboe customer fee $0.45 + $0.14 surcharge; an assumed $0.65 broker commission; about $0.02 ORF.
- Fees are about $1.26 per side, or $2.52 per round trip.
- The round trip that crosses the full spread (half on each side) costs **$20 + $2.52 = $22.52**.
- Theta from the premium path:
  - 10:00–12:00: about 2.31 points/hr, or **$231/hr (about $3.85/min)**.
  - 12:00–14:00: about $192/hr.
  - 14:00–15:30: about $257/hr.
- The spread as a share of premium, holding the median spread constant through the day, is about 1.1% at 10:00, 1.4% at 12:00, 2.0% at 14:00 and **3.25% at 15:30**.
- An ATM option has delta of about 0.5, and SPX is $100 × index, so one ATM SPX is about $50/pt of delta, the same as one ES.
- Breakeven underlying move with delta 0.5:
  - Spread and fees only: 0.45 SPX point, about 1.8 ES ticks. Compare ES at 0.33 point with market orders, or 0.076 with limits.
  - Plus theta for a 5-minute hold: about $42, or 0.84 point (3.3 ES ticks).
  - 15 minutes: about $80, or 1.6 points (6.4 ES ticks).
  - 30 minutes: about $138, or 2.8 points (11 ES ticks).

  Caveat: theta is the fair price of gamma, not a pure cost. If realized volatility equals implied, gamma P&L offsets theta on average. Spread and fees, however, are pure costs.
- **Gamma and why small moves give large percentage moves.** I backed out σ√T from the Concretum premium using ATM ≈ 0.4·S·σ√T (Black-Scholes approximation, my inference).
  - σ√T is about 0.006 at 10:00 and about 0.002 at 15:30.
  - ATM gamma is about 0.0086 per point at 10:00 and about 0.026 per point at 15:30, roughly 3× higher late in the day.
  - At 10:00, a 2-point SPX move gives about +1.02 points on the option, +5.5% of premium.
  - At 15:30, the same 2-point move gives about +1.05 points, **+17%** of premium; a 5-point move gives +46%.
  - In SPY terms, a 20-cent SPY move late in the day can mean +17% on an ATM 0DTE. But percentage spreads also widen as premium shrinks, and theta per hour stays high in dollars.
- **SPY/XSP at 1/10 the size.** Assume a 1-cent spread and Schwab's $0.65 commission, so each contract's round trip costs $1 of spread plus $1.30 of commission, $2.30 in total.
  - That is 15% of premium on a $0.15 option, 4.6% on a $0.50 option, and 2.3% on a $1.00 option.
  - Matching one SPX ATM's delta takes about 10 SPY or XSP contracts. That costs about $23 per round trip at $0.65 per contract per side, similar to SPX. A broker with $0.15 per contract or $0 to close changes this a lot.
- On XSP, the Cboe customer rebate for fewer than 10 contracts versus the fee for 10 or more may make 9-lot orders cheaper at the exchange level. Whether the customer sees this depends on broker pass-through.
- Tax: for a net-profitable trader at the top bracket, SPX/XSP (60/40, about 26.8% max blended federal) versus SPY/QQQ (short-term, 37%) is about a 10-point difference on net gains. ES/MES/NQ/MNQ futures also qualify for Section 1256.

### Gaps
- I found no source for SPX, XSP, SPY or QQQ spreads by time of day, or for effective (as opposed to quoted) spreads specifically for 0DTE.
- I found no QQQ 0DTE spread data and no published intraday theta or gamma tables. The Greeks above are my Black-Scholes approximations from Concretum's premium path.
- I could not retrieve OCC's 2026 per-contract clearing fee from OCC directly.
- IBKR's SPX pass-through fee schedule was not reachable (403).

## Q3. Expectancy math with costs, fragility of high-win-rate small-target strategies, risk of ruin, and required edge

### Takeaway
Costs are roughly fixed per trade, but the typical price move grows with the square root of the holding period. Shorter horizons therefore need sharply higher predictive accuracy per trade. For ES with market orders, a sign-forecast signal needs a correlation with the next move of about 0.10 at a 1-minute horizon and about 0.8 at 1 second, but only about 0.013 at 1 hour. High-win-rate, small-target brackets have thin margins over random-walk win rates. Estimating that margin reliably needs thousands of trades, and a 2–3 point error in win rate flips the sign of expectancy.

### Cited Findings
(The cost inputs and margins are cited in Q1 and Q2. The empirical evidence on fragility is in Q7.)
- Retail option round trips are short: median holding time is 0.54 hours for option trades and 0.12 hours for stock trades, and 68.8% of option trades are closed the same day (2020–2022 data) — [Bogousslavsky & Muravyev](https://www.lsu.edu/business/files/event-files/2025-finance-mardi-gras/retail_option_trading_v2.pdf)
- More than 60% of the estimated $358k per day of retail 0DTE losses were transaction costs — [Beckmeyer, Branger & Gayda (2023) via Neudata review](https://neudata.co/literature-reviews/zero-day-to-expiry-options-a-losing-bet-for-retail-traders); [BNN Bloomberg](https://www.bnnbloomberg.ca/day-traders-lose-358-000-per-day-gambling-on-zero-day-options-1.1910634)

### Inferences
**Worked calculation D: ES 2-tick target / 2-tick stop, fee-only cost C = 0.30 tick.**

| Win rate | Mean per trade | Mean $/trade |
|---|---|---|
| 55.0% | −0.10 tick | −$1.28 |
| 57.6% (breakeven) | 0 | $0 |
| 60.0% | +0.10 tick | +$1.22 |
| 62.0% | +0.18 tick | +$2.22 |
| 65.0% | +0.30 tick | +$3.72 |

The standard deviation is about 1.96 ticks per trade, so the per-trade Sharpe ratio is only about 0.05 at a 60% win rate.

- **Sample size.** The standard error of a win rate is √(p(1−p)/n). Telling a true 60% apart from the 57.6% breakeven at 2 standard errors needs **n ≈ 1,600 trades**, and that assumes stable conditions and independent trades. A 2.4-point change in win rate is the entire edge.
- **Risk of ruin (Brownian approximation P ≈ exp(−2μB/σ²)).** At a 60% win rate, a $2,000 account gives ruin probability of about 3×10⁻⁴, and a $5,000 account about 1.5×10⁻⁹. Ruin looks negligible only if μ is known. If the true win rate is 57% instead of the estimated 60%, μ turns negative and eventual ruin is certain. Capital does not protect against model error; the error in the edge estimate dominates.
- **High-win-rate scalper: ES T1/S8 with C = 0.30.**

  | Win rate | Mean per trade | Mean $/trade |
  |---|---|---|
  | 90% | −0.20 tick | −$2.53 |
  | 92% | −0.02 tick | −$0.28 |
  | 92.25% | breakeven | $0 |
  | 93% | +0.07 tick | +$0.85 |
  | 95% | +0.25 tick | +$3.09 |

  One loss erases 8.3 wins. With 1 tick of stop slippage, breakeven rises to 93.0%. If price gaps through the stop (news, liquidity holes), a few multi-tick slippages per 100 trades remove the edge. These are the fat-tailed losses that make such strategies fragile.
- **Horizon scaling.** This assumes 1% daily SPX volatility (about 77 points at 7,700), a random walk within the day, and a uniform 6.5-hour session; real intraday volatility is U-shaped and seconds-level returns include bid-ask bounce. The move needed is E|r|·IC ≥ C, so IC > C/(0.8·σ_h).

  | Horizon | σ (ES ticks) | Cost 1.30 tick as % of σ | IC needed, market orders | IC needed, limit orders (0.30 tick) |
  |---|---|---|---|---|
  | 1 s | 2.0 | 65% | 0.81 | 0.19 |
  | 10 s | 6.4 | 20% | 0.26 | 0.06 |
  | 1 min | 15.6 | 8.3% | 0.10 | 0.024 |
  | 5 min | 34.9 | 3.7% | 0.047 | 0.011 |
  | 15 min | 60.4 | 2.2% | 0.027 | 0.006 |
  | 1 h | 120.8 | 1.1% | 0.013 | 0.003 |
  | 1 day | 308 | 0.4% | 0.005 | 0.001 |

  This is the core test of the premise "many small predicted trades are easier." Breadth (more trades) raises the information ratio by √N only if the per-trade IC stays above the cost threshold. At horizons of seconds that threshold is very high, and limit-order assumptions are optimistic because of adverse selection (Q4).
- **Leverage scales costs and P&L together.** Leverage does not change expectancy per unit of risk, E/σ. It only scales the size of P&L, and therefore drawdowns and the probability of hitting a fixed loss limit such as a prop-firm trailing drawdown. With costs fixed in ticks, a micro contract at the same risk per trade has a cost/target ratio about 3.2× worse than ES (Q1).

### Gaps
- I found no published empirical distribution of retail ES scalper win rates, trade P&L, or slippage on stop orders.
- The volatility and IC analysis above is my illustrative model under stated assumptions, not a cited empirical result.

## Q4. Competition: who is on the other side, adverse selection, latency gap, and feasible horizons

### Takeaway
In ES, HFT firms earn very high risk-adjusted returns: a median Sharpe ratio of 4.3 in the published study, and 9.2 on average in an earlier draft. They take profits from every other trader category, and small traders lose the most per contract. Relative latency explains large differences in HFT performance. Colocated firms work in microseconds, a Chicago VPS is about 1–10 ms, and retail broker data and API paths are slower still (IBKR default quotes are 250 ms aggregated snapshots). So sub-second and seconds-scale scalping is structurally a contest a retail trader cannot win. Any plausible retail edge has to be at horizons of minutes to hours, where latency matters little and cost is a small share of the typical move.

### Cited Findings
- Baron, Brogaard, Hagströmer & Kirilenko, "Risk and Return in High-Frequency Trading" (JFQA 2019; CFTC working paper on E-mini S&P 500 futures over two years):
  - HFT revenue is concentrated in a few firms (winner-takes-all).
  - Median HFT Sharpe ratio is 4.3.
  - New entrants are less profitable and more likely to exit.
  - "Differences in relative latency account for large differences in HFT firms' trading performance."

  Sources: [CFTC OCE working paper](https://www.cftc.gov/idc/groups/public/@economicanalysis/documents/file/oce_riskandreturn0414.pdf); [IDEAS/RePEc JFQA](https://ideas.repec.org/a/cup/jfinqa/v54y2019i03p993-1024_00.html)
- Earlier draft (E-mini, August 2010):
  - HFTs earn profits from Opportunistic, Fundamental, Small, and Non-HFT Market Maker traders, mostly from Opportunistic traders.
  - "Small traders in particular suffer the highest loss to HFTs on a per contract basis."
  - The average HFT made over $46,000 per day in gross profit; aggressive HFTs made more than twice that.
  - Average annualized Sharpe ratio was 9.2 (interquartile range 2.23–13.89), against 0.31 for the S&P 500.

  Source: [Rajiv Sethi summary](https://rajivsethi.substack.com/p/risk-and-reward-in-high-frequency-12-12-07)
- Latency tiers. Colocated in Aurora: order-to-exchange round trip in microseconds. Chicago area, not colocated: 1–10 ms round trip — [NexusFi Nanoconda managed colocation](https://nexusfi.com/a/infrastructure/nanoconda-managed-colocation). Chicago VPS vendors claim sub-1 ms to CME (QuantVPS 0.52 ms; ChartVPS 0–1 ms; vendor self-reported) — [Optimus/QuantVPS](https://optimusfutures.com/quantvps.php); [ChartVPS](https://chartvps.com/futures). One anecdotal report cites spikes of 250 ms+ on a standard VPS versus 4 ms colocated (vendor blog, unverified) — [PickMyTrade on Rithmic latency](https://blog.pickmytrade.io/rithmic-latency-secrets-live-sim-fills-2025.md)
- IBKR's standard API market data is "not tick-by-tick but consists of aggregated snapshots," updating every 250 ms for stocks and futures and 100 ms for US options. True tick-by-tick needs reqTickByTickData, which has subscription caps tied to market-depth lines, purchasable via quote booster packs of 100 lines each (max 10). Tick-by-tick is not available for options — [IBKR TWS API docs: top data (deprecated page)](https://interactivebrokers.github.io/tws-api/top_data.html); [IBKR Campus](https://www.interactivebrokers.com/campus/ibkr-quant-news/ibkr-market-data-from-real-time-bars-to-ticks/)
- In 0DTE options, retail investors benefit from lower effective spreads because of price improvement, but they still suffer substantial losses. Quoted spreads overstate what retail actually pays — [ResearchGate summary of Beckmeyer et al.](https://www.researchgate.net/publication/370012499_Retail_Traders_Love_0DTE_Options_But_Should_They). (My inference: the price improvement comes from wholesaler and market-maker internalization of retail flow. The source does not say this.) Bogousslavsky & Muravyev find average retail option-trade losses (−0.9%) far smaller than quoted spreads (5–10%), likely because traders use limit orders — [Bogousslavsky & Muravyev](https://www.lsu.edu/business/files/event-files/2025-finance-mardi-gras/retail_option_trading_v2.pdf)

### Inferences
- **Adverse selection of retail limit orders.** In a 1-tick-wide queue-priority market like ES, a retail resting order sits behind faster participants. It tends to fill when informed or fast flow is about to push through the level, and to miss when price moves away in its favor. So the fee-only (C = 0.30 tick) rows in Q1 are an optimistic lower bound. Realized fill-conditional returns on passive orders are typically negative over short horizons. This is a standard microstructure result; I did not find an ES-retail-specific measurement in this pass.
- **Feasible horizons.** Latency differences are 1–4 orders of magnitude: microseconds colocated, about 1 ms on a Chicago VPS, tens to hundreds of ms on a home connection plus broker API (an inference; I found no rigorous retail benchmark). Combined with the IC thresholds in Q3:
  - Below about 10 seconds is effectively an HFT domain. Retail can neither react fast enough nor overcome a cost of 20–65% of σ.
  - About 1–15 minutes is marginal: costs are 2–8% of σ, and latency matters mainly through slippage in fast markets.
  - Hours to a full day: latency is mostly irrelevant, and costs are about 1% of σ or less.
- A Chicago VPS ($40–80/mo, Q5) removes most of the home-internet latency and outage risk. It does not close the gap to colocated market makers, and it does not fix the 250 ms data granularity of an IBKR-style feed.

### Gaps
- I found no published measurement of retail limit-order fill quality or adverse selection specifically in ES/MES.
- I found no rigorous benchmark of end-to-end retail order latency (home to broker to CME) for IBKR, Tradovate or Rithmic.
- I found no data on the identity or market share of market makers in SPX 0DTE beyond the retail share figures.

## Q5. Retail algo infrastructure (2025–2026): broker APIs, market data costs, VPS

### Takeaway
A retail algo stack costs roughly $50–$400 per month:
- CME non-professional exchange fees: $1.55 per month top-of-book and $12.10 depth, per exchange, in 2026, rising in January 2027.
- A data vendor, for example Databento CME Standard at $199/mo (since June 2026).
- Possibly a broker API add-on, for example Tradovate's $25/mo API access. CME licensing for real-time data via Tradovate's API has reportedly cost $290–$500/mo.
- A Chicago VPS at $40–80/mo.

The main technical limits are data granularity (IBKR's 250 ms snapshots) and API licensing, not raw compute.

### Cited Findings
- CME non-professional market data, per device per month, effective June 1, 2026 (same as January 2026): Depth of Market $12.10, Top of Book $1.55. All-exchange bundles (CME, CBOT, NYMEX, COMEX) are $36.50 for depth and $4.65 for top of book. The January 2027 list raises these to about $12.50 / $1.65 per exchange and $37.75 / $4.80 for bundles — [CME June 2026 market data fee list](https://www.cmegroup.com/market-data/files/june-2026-market-data-fee-list.pdf); [CME January 2027 fee list](https://www.cmegroup.com/market-data/files/january-2027-market-data-fee-list.pdf)
- AMP Futures' retail pricing, June 2026, including vendor markup: non-pro CME Level 1 $5/mo, Level 2 $17/mo; all-CME bundles $15 (L1) and $45 (L2) — [AMP platform and data fees](https://www.ampfutures.com/trading-info/platform-data-fees/)
- Databento CME Globex MDP 3.0 Standard plan: launched at $179/mo (April 2025) and listed at $199/mo after the June 22, 2026 update. Existing subscribers keep $179 for 12 months. Higher tiers cost $1,750 and $4,500 per month. Usage-based live CME pricing was discontinued; historical data remains pay-as-you-go — [Databento: new CME pricing plans](https://databento.com/blog/introducing-new-cme-pricing-plans); [Databento: subscription pricing updates](https://databento.com/blog/updates-to-subscription-pricing)
- Tradovate. Its API access add-on costs $25/mo; a funded account of at least $1,000 is reportedly required (vendor blog, unconfirmed). Since September 30, 2022, CME rules require users who want market data via the API to register as sub-vendors. Forum posts cite $290–$500/mo for that licensing; one user says $500/mo. Free 10-minute-delayed data is available — [Tradovate community: CME sub-vendor $290/mo](https://community.tradovate.com/t/is-cme-sub-vendor-requirement-for-api-access-is-290-per-month/6215); [Tradovate community: market subscriptions and API](https://community.tradovate.com/t/whats-the-deal-with-market-subscriptions-and-api-access-to-charts-do-we-need-another-payment/11039); [PickMyTrade (vendor)](https://blog.pickmytrade.trade/tradovate-api-access-without-1000-minimum-2026-options/)
- IBKR TWS API data limits are described in Q4: 250 ms snapshots by default, tick-by-tick capped by market-data lines — [IBKR API docs](https://interactivebrokers.github.io/tws-api/top_data.html)
- Polygon.io rebranded as Massive; sources date this to October 2025 or early 2026. The api.polygon.io host still works. Stock plans: $0 / $29 / $79 / $199 per month, with real-time from the $199 Advanced plan. Options (OPRA) are priced on a separate ladder that I could not verify — [apicostcalc on the Polygon/Massive rebrand](https://apicostcalc.com/blog/polygon-massive-rebrand-api-pricing.html)
- Chicago VPS is roughly $40–80/mo: QuantVPS Lite+ $63.99/mo, ChartVPS Alpha $70/mo, basic configurations $40–60/mo. The only Rithmic Aurora-server price found ($299/mo) is old and likely outdated. True colocation is negotiated, for example via Advantage Futures cabinets — [Optimus/QuantVPS](https://optimusfutures.com/quantvps.php); [ChartVPS](https://chartvps.com/futures); [Valebyte](https://www.valebyte.com/en/blog/best-vps-for-futures-trading-low-latency/); [EliteTrader CME colocation thread](https://elitetrader.com/et/threads/cme-co-location-services.207949/post-3785833)
- Equities and options APIs. Alpaca is rated highly for retail algo work (REST/WebSocket/SSE, paper trading). The Schwab API (successor to the TD Ameritrade API) is reported to need a manual authentication refresh every 7 days; its current status is described inconsistently. tastytrade, TradeStation and Tradier appear in 2026 API rankings without detail — [TradeAlgo 2026 broker APIs](https://www.tradealgo.com/trading-guides/tools/best-broker-apis-for-algorithmic-trading-in-2026); [schwabr README](https://archive.linux.duke.edu/cran/web/packages/schwabr/readme/README.html); [TradersPost on the TD Ameritrade API](https://blog.traderspost.io/article/does-td-ameritrade-have-api)

### Inferences
- A minimal futures stack might be NinjaTrader or Tradovate with bundled top-of-book, plus a Chicago VPS: about $60–$100 per month before commissions. A research-grade stack might be Databento ($199) plus a Rithmic- or IBKR-routed broker plus a VPS: about $250–$350 per month.
- For a scalper doing 20 ES round trips per day, these fixed costs are small next to trading costs (about $82k per year per contract in Q1). Infrastructure spend is not the binding constraint; cost per trade is.
- A backtest on 1-minute bars cannot assess tick-level scalping. You need MBO or MBP data (for example from Databento) and a queue-position fill model. IBKR's default 250 ms snapshot feed is unsuitable for queue-sensitive strategies.

### Gaps
- I found no verified 2026 pricing for IQFeed, OPRA real-time via Massive, CQG API, Rithmic R|API / R|Protocol licensing, TradeStation API, or the tastytrade API.
- I found no OPRA non-professional exchange fee figure in this pass.
- I found no independent latency benchmarks. All VPS latency figures are vendor-reported.

## Q6. Regulation and tax constraints (PDT, margin, wash sale, Section 1256, prop-firm model and CFTC scrutiny)

### Takeaway
The FINRA pattern-day-trader rule ($25k minimum) was removed:
- The SEC approved the change on April 14, 2026.
- It took effect June 4, 2026.
- Brokers can phase it in until October 20, 2027, so some may still enforce PDT-like limits during the transition.

An intraday margin-deficit standard replaced it for all margin accounts. Futures were never subject to PDT. Futures and SPX/XSP options get Section 1256 60/40 treatment and are generally outside the wash-sale rule; SPY/QQQ options are subject to both ordinary short-term rates and wash sales. Prop-firm "funded" evaluations have low payout rates (Topstep 2025: 33.3% of funded-level participants were paid; 0.71% reached a live account). The highest-profile CFTC prop-firm case (My Forex Funds) was dismissed with prejudice, and the court sanctioned the CFTC.

### Cited Findings
**PDT rule**
- The SEC approved amendments to FINRA Rule 4210 on April 14, 2026. They remove all day-trading concepts: the "pattern day trader" definition, the related account equity requirements, and day-trading buying power. In their place is a general intraday margin standard: firms must determine whether any margin account has an intraday margin deficit, whether or not the customer day trades. They can do this by blocking trades in real time, or by an end-of-day calculation followed by a margin call. Regulatory Notice 26-10 (April 20, 2026) sets the effective date at June 4, 2026, with optional phase-in ending October 20, 2027. The standard does not apply to portfolio margin or good-faith accounts, and maintenance requirements in Rule 4210(c) are unchanged — [WilmerHale client alert (Apr 23, 2026)](https://www.wilmerhale.com/en/insights/client-alerts/20260423-sec-approves-amendments-to-finra-rule-4210-replacing-day-trading-margin-requirements-with-a-modernized-intraday-margin-standard); see also [E*TRADE: PDT rule change](https://us.etrade.com/knowledge/library/margin/pattern-day-trading-rule-change)

**Tax**
- Section 1256: 60/40 treatment and year-end mark-to-market for regulated futures and broad-based index options; Form 6781 — [TaxSlayer Pro](https://support.taxslayerpro.com/hc/en-us/articles/360040712794); [IRS draft Form 6781](https://www.stayexempt.irs.gov/pub/irs-dft/f6781--dft.pdf)
- Wash sales: Section 1256 contracts are generally outside the wash-sale rule because of mark-to-market. Individual equity options remain subject to it, and straddle rules can still apply — [NexusFi: wash sale rule and Section 1256](https://nexusfi.com/a/regulation/wash-sale-rule-futures-section-1256); [Schwab: wash sales](https://www.schwab.com/learn/story/year-end-tax-trading-wash-sales-and-more); [CertFuel: wash sale and options](https://app.certfuel.com/series7/learn/options/options-taxation-and-calculations/wash-sale-rule-and-options). These are secondary sources; confirm against IRS Publication 550 and the Form 6781 instructions.

**Prop firms**
- Topstep's official 2025 disclosure covers January to December 2025:
  - 16.8% of Trading Combines started were completed (per account).
  - 51.8% of individual participants reached the Funded Level in at least one Combine.
  - **33.3% of individual Funded-Level participants received a payout.**
  - **0.71%** of Express Funded Account participants were called up to a Live Funded Account.
  - The statistics mix simulated and live trading.

  Marketing figures are different metrics: a "99.26% payout approval rate" counts approved payout *requests*. The payout split is 90/10, with caps per request (for example $2,000–$3,000 on a $50K XFA) — [Topstep Risk Disclosure](https://www.topstep.com/risk-disclosure); [Topstep payout policy](https://help.topstep.com/en/articles/8284233-topstep-payout-policy). Do not multiply 16.8% by 33.3%; the denominators differ — [Traders Second Brain](https://traderssecondbrain.com/guides/prop-firm-pass-rate)
- Industry data from FPFX Tech, a prop-firm software vendor with a commercial interest, covering 300,000+ accounts of 100,000 traders across 10 firms: 14% of traders passed and were funded; about 45% of those got a payout (**about 7% of all traders**); the average payout was about 4% of plan size; traders used 2.2 firms on average — [Finance Magnates exclusive](https://www.financemagnates.com/forex/exclusive-only-7-of-300000-prop-trading-accounts-achieved-payouts/)
- Apex reports only cumulative payouts (>$828M since 2022) — [Traders Second Brain payout proof](https://traderssecondbrain.com/guides/prop-firm-payout-proof). FTMO reports cumulative payouts of >$450M at 10 years (Sept 2025) and >$650M later, including about $14.4M across about 7,100 rewards in one month. Both are self-reported, with no share of traders paid disclosed — [Finance Magnates: FTMO 10 years](https://www.financemagnates.com/forex/ftmo-announces-over-450-million-paid-out-as-prop-trading-firm-turns-10/); [Finance Magnates: FTMO adds $200M](https://www.financemagnates.com/forex/ftmo-adds-200-million-to-lifetime-payouts-in-one-year-as-monthly-rewards-near-15-million/)

**CFTC and My Forex Funds**
- On May 13, 2025, Judge Edward S. Kiel adopted the Special Master's recommendation. He dismissed the CFTC's case against My Forex Funds' parent (Traders Global / Murtuza Kazmi) with prejudice and ordered the CFTC to pay fees related to the sanctions motion. The Special Master found the CFTC made "false representations" to the court and acted "willfully and in bad faith." The CFTC put four lawyers and one investigator on administrative leave — [Finance Magnates](https://www.financemagnates.com/forex/my-forex-funds-parent-defeats-cftc-in-court-as-judge-imposes-sanctions/); [Willkie Compliance Concourse](https://complianceconcourse.willkie.com/articles/new-jersey-federal-judge-dismisses-forex-case-with-prejudice-and-awards-attorney-fees/); [Quinn Emanuel](https://www.quinnemanuel.com/the-firm/publications/historic-rule-11-dismissal-and-fee-victory-against-the-commodity-futures-trading-commission-in-hotly-contested-fraud-case/)

### Inferences
- PDT removal mainly helps SPY/QQQ options and stock scalpers with under $25k. Futures and futures-options traders were never constrained. Because brokers can phase in until October 2027, check your own broker's implementation.
- The new intraday-margin standard means short 0DTE option positions and spreads in margin accounts will be checked for intraday deficits, either blocked in real time or margin-called.
- Cash accounts avoid margin rules but can only buy options and must use settled funds. Settlement mechanics were not researched in this pass.
- **Prop-firm economics.** Evaluation fees are the firm's main revenue, and most "funded" trading is simulated (Topstep: 0.71% reach live). The trader's real economics: expected payout ≈ P(funded) × P(paid | funded) × average payout, minus evaluation and reset fees. FPFX's figures (7% of traders paid, about 4% of plan size) suggest this is negative for most participants.
- Trailing-drawdown rules interact badly with high-win-rate, fat-tailed scalping (Q3). A single multi-tick slip can breach the drawdown limit.
- The MFF outcome reduced near-term enforcement momentum against prop firms, but the evaluation model remains a regulatory gray area.

### Gaps
- I did not retrieve the text of FINRA Regulatory Notice 26-10 itself.
- I did not research cash-account settlement rules for options or the margin treatment of short 0DTE positions (Cboe/FINRA strategy-based margin).
- I found no CFTC or SEC action on futures prop firms (Topstep, Apex and others) in 2025–2026 beyond the MFF case, and no evidence of any appeal of the MFF dismissal.
- Apex and MyFundedFutures publish no official payout rates; figures circulating online are community estimates.
- The IRS primary text (Publication 550, final 2025/2026 Form 6781 instructions) was not retrieved directly.

## Q7. Real-world benchmarks: published outcomes for retail day traders, scalpers, 0DTE traders, and prop traders

### Takeaway
Every large dataset found points the same way:
- Brazil mini-index futures day traders: 97% of those who persisted 300+ days lost money, and there was no evidence of learning.
- Retail 0DTE traders: losses of about $358k per day after daily expirations began, with more than 60% of it transaction costs; in trader-level data, 0DTE trades lost about 4.6% per trade.
- Prop-firm evaluations: about 7% of traders, or 33% of Topstep's funded participants, receive any payout.
- The counterparty side (HFTs in ES) earns median Sharpe ratios of about 4 or more.

### Cited Findings
- Chague, De-Losso & Giovannetti, "Day Trading for a Living?" Sample: 19,646 individuals who began day trading mini-Ibovespa futures in 2013–2015 (Brazilian regulator data). Results:
  - Among those who persisted at least 300 days, **97% lost money**.
  - Only 0.4% earned more than a bank teller's wage (about US$54 per day); the top individual earned about US$310 per day.
  - There was no evidence of learning.
  - In the June 2020 version, 1.1% earned more than the minimum wage and 0.5% more than a bank teller's starting salary.

  Sources: [FGV repository](https://repositorio.fgv.br/items/e87d04fc-4b4c-4a56-ab5a-1c84c1afde1b/full); [SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3423101); [CXO Advisory critique on representativeness](https://www.cxoadvisory.com/investing-expertise/day-trading-a-bust/)
- Beckmeyer, Branger & Gayda, "Retail Traders Love 0DTE Options… But Should They?" (2023). Average retail daily losses were $184k over the full sample (2005 to Feb 2023) and **$358k per day after May 16, 2022**, when daily expirations began. **More than 60%** of losses were transaction costs, and retail traders "neglect" spreads — [Neudata review](https://neudata.co/literature-reviews/zero-day-to-expiry-options-a-losing-bet-for-retail-traders); [BNN Bloomberg](https://www.bnnbloomberg.ca/day-traders-lose-358-000-per-day-gambling-on-zero-day-options-1.1910634); [ResearchGate](https://www.researchgate.net/publication/370012499_Retail_Traders_Love_0DTE_Options_But_Should_They)
- Bogousslavsky & Muravyev (Aug 2024 draft), trader-level data: about $15B of retail trades, 5,182 traders, about 890k option trades, 2020–2022, from a trading-journal provider:
  - The average option trade returned −0.9%. Option purchases returned −3.95%; naked option sales +20% (13% of trades).
  - 0DTE was 23% of option trades and lost **4.6% per trade** against about 0% for others (−2.95% with controls). 93.3% of 0DTE trades were purchases, and 62% were S&P 500/SPY. The average 0DTE trade size was $1,069.
  - The authors judge the sample "relatively sophisticated."

  Source: [Bogousslavsky & Muravyev PDF](https://www.lsu.edu/business/files/event-files/2025-finance-mardi-gras/retail_option_trading_v2.pdf)
- HFT counterparties in E-mini: median Sharpe 4.3 (published version), average 9.2 (2010 draft). Small traders take the highest per-contract loss to HFTs — [CFTC OCE paper](https://www.cftc.gov/idc/groups/public/@economicanalysis/documents/file/oce_riskandreturn0414.pdf); [Sethi summary](https://rajivsethi.substack.com/p/risk-and-reward-in-high-frequency-12-12-07)
- Prop-firm outcomes: Topstep 2025 had 33.3% of funded participants paid and 0.71% reaching a live account — [Topstep Risk Disclosure](https://www.topstep.com/risk-disclosure). FPFX data show about 7% of traders paid — [Finance Magnates](https://www.financemagnates.com/forex/exclusive-only-7-of-300000-prop-trading-accounts-achieved-payouts/)
- Systematic 0DTE strategy studies exist but were not retrieved: [Concretum SPX 0DTE](https://concretumgroup.substack.com/p/spx-0dte-options); [ResearchGate: profitability of selected 0DTE strategies](https://www.researchgate.net/publication/388321185_Profitability_of_selected_0DTE_index_options_strategies)

### Inferences
- The evidence matches the cost arithmetic in Q1–Q3:
  - Retail scalping losses are driven largely by costs (more than 60% for 0DTE).
  - Persistence does not produce learning (Brazil).
  - The counterparties who profit are speed-advantaged market makers.
- In the Bogousslavsky & Muravyev data, the one consistently profitable retail category was option *selling* (+20%). This fits a variance-risk-premium explanation and suggests that, at the retail level, short-premium positions have outperformed long-gamma scalping. Short premium carries its own fat-tail risk.
- For anyone testing the premise, a realistic prior is that fewer than 3–10% of retail scalpers are net profitable after costs. A credible strategy has to show an edge net of realistic fills (queue position, adverse selection, stop slippage) over at least 1,500–2,000 trades (Q3) before scaling up.

### Gaps
- I found no US-specific academic study of retail futures day-trader (ES/MES) profitability comparable to the Brazil or Taiwan studies. The Taiwan studies (Barber, Lee, Liu & Odean) were not retrieved in this pass.
- I found no published profitability data for retail "tick scalping" strategies specifically.
- I found no audited, cross-firm prop payout statistics. Topstep's figures are company-reported, and FPFX is a vendor.

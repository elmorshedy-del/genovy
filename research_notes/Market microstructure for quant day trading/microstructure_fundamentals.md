# Market Microstructure Fundamentals for Intraday Trading: US Equities and CME Equity Index Futures (state as of October 2026)

Research notes for the "microstructure" chapter. Dates matter in this topic, so older facts are flagged with their sample period. Note on sourcing: CME Group web pages returned HTTP 403/503 to direct fetches during this research, so CME contract figures come from CME pages as indexed by search (titles/snippets) plus CME rulebook excerpts; see the Gaps sections for what still needs checking against the live spec pages.

## 1. US equity market structure (2025-2026): venues, NBBO/SIP, Reg NMS, fees, dark pools, wholesalers, and the 2024 tick/fee/605 rules

### Takeaway
US equity trading is split across about 16-18 lit exchanges (plus the Texas Stock Exchange, live since July 2026) and an off-exchange segment that became the majority in 2025: 50.6% of consolidated volume, about 81% of it executed by principal dealers/wholesalers and about 19% on ATSs. The SEC's 2024 half-penny tick and 10-mil access-fee rule survived a court challenge (October 2025) but has been delayed twice. The SEC's June 11, 2026 order moved compliance to the first business day of November 2027, so as of October 2026 the tick is still $0.01 and the access-fee cap is still 30 mils. The round-lot redefinition (November 3, 2025) and fee determinability (February 2, 2026) are live. The amended Rule 605 started collecting data on August 1, 2026.

### Cited Findings
**Volumes and off-exchange share**
- 2025 US equities ADV was 17.6 billion shares (+44.6% YoY), average daily notional $1.1 trillion (+43.3%). The peak day was April 9, 2025 at 30.98 billion shares / $1.86 trillion — [Cboe 2025 U.S. Equities Year in Review](https://www.cboe.com/insights/posts/2025-u-s-equities-year-in-review)
- TRF (off-exchange) share rose 361 bps to 50.6% of total consolidated volume in 2025, the first year off-exchange exceeded half. Inside the TRF, 18.7% was on ATSs and 81.3% went through principal dealers — [Cboe 2025 YIR](https://www.cboe.com/insights/posts/2025-u-s-equities-year-in-review). An independent tally gives 50.61% for 2025 and 57.29% off-exchange in December 2025 — [Rosenblatt 2025 Year-in-Review](https://www.rblt.com/market-structure-reports/us-securities-volumes-2025-year-in-review)
- November 2024 was the first month ever with more volume executed off-exchange than on — [Nasdaq](https://www.nasdaq.com/articles/exchange-trading-increases-across-all-types-stocks). MEMX puts January 2025 off-exchange share at 51.6% (vs 44.1% a year earlier). It blames rising retail activity and exchanges' inability to quote inside a one-cent tick in stocks that would qualify for a half-cent increment — [MEMX](https://memx.com/insights/strong-volume-in-january-one-cent-tick-size-hurts-exchange-competitiveness)
- Non-displayed (hidden/midpoint) executions were 17.2% of volume on Cboe's own venues in 2025. Pre-market volume rose 111% YoY to 5.91% of consolidated volume, with 59.3% of pre-market volume in the 8:00-9:30 am window — [Cboe 2025 YIR](https://www.cboe.com/insights/posts/2025-u-s-equities-year-in-review)
- Retail-attested ADV on Cboe exchanges was 3.2% of consolidated volume in 2025. Retail flow was 30.4% of EDGX volume — [Cboe 2025 YIR](https://www.cboe.com/insights/posts/2025-u-s-equities-year-in-review)

**Exchanges (2025-2026 additions)**
- The SEC approved the Texas Stock Exchange (TXSE) on September 30, 2025, described as the 29th registered national securities exchange. That count covers all asset classes, not only equity venues — [Cozen O'Connor](https://www.cozen.com/news-resources/publications/2025/texas-stock-exchange-txse-approved-as-newest-national-securities-exchange)
- TXSE ran test-symbol trading July 6-9, 2026, then live trading in 5 NMS symbols from July 10, 2026, with all NMS symbols expected by end of July. ETP listings were targeted for September 2026 and corporate listings for October 2026 — [Venable](https://www.venable.com/insights/publications/2026/07/texas-stock-exchange-opens-for-trading); [Texas Tribune](https://www.texastribune.org/2026/07/03/texas-stock-exchange-launch-trading/)
- Extended hours: Cboe expects extended SIP hours "December 2026 or early 2027, pending SEC review". It plans 23x5 trading on EDGX, subject to SIP readiness — [Cboe 2025 YIR](https://www.cboe.com/insights/posts/2025-u-s-equities-year-in-review). Nasdaq's proposed schedule is 9:00 pm ET Sunday to 8:00 pm ET Friday with a one-hour daily pause, targeted to begin December 6, 2026 subject to SEC approval and SIP readiness. That is a law-firm summary of a target date, not a confirmed launch — [Cooley](https://governancebeat.cooley.com/24-hour-trading-nasdaqs-faqs-and-secs-roundtable/)

**Reg NMS baseline (2005) and the 2024 amendments**
- Reg NMS (2005) created the Order Protection Rule (Rule 611, no trade-throughs of protected top-of-book quotes), the Access Rule (Rule 610, fee cap of $0.003/share = 30 mils) and the Sub-Penny Rule (Rule 612, $0.01 minimum quoting increment for stocks ≥$1) — [SEC Reg NMS adopting release 34-51808](https://www.sec.gov/rules/final/34-51808.pdf)
- Adopted September 18, 2024 (Release 34-101070):
  - Rule 612 gains a second tick of $0.005 for stocks ≥$1 whose Time Weighted Average Quoted Spread during the Evaluation Period was ≤$0.015. Other stocks keep $0.01.
  - The Rule 610 access-fee cap falls from 30 mils to $0.001/share (10 mils) for stocks ≥$1, and to 0.1% of quote price for stocks below $1.
  - All exchange fees and rebates must be determinable at the time of execution, with volume tiers set from prior-period volume.
  - The round-lot and odd-lot-information definitions are accelerated, and best odd-lot orders are added to SIP data.
  - The original compliance date was the first business day of November 2025 (odd-lot info: May 2026).
  — [SEC fact sheet](https://www.sec.gov/files/34-101070-fact-sheet.pdf)
- Litigation and delay timeline:
  - December 12, 2024: the SEC partially stayed Rules 600(b)(89)(i)(F), 610(c) and 612.
  - October 14, 2025: the D.C. Circuit denied the petitions for review (Cboe Global Markets v. SEC).
  - October 31, 2025: the SEC extended compliance to the first business day of November 2026.
  - February 26, 2026: MEMX asked for a carve-out. It wanted the old caps kept for 1-cent-tick and sub-$1 stocks, and a $0.0015 cap for half-penny stocks.
  - June 11, 2026 (Release 34-105656): the SEC extended both the new tick (Rules 600(b)(89)(i)(F)/612) and the new access-fee caps (Rule 610(c)) to the first business day of November 2027. The reason given was the other 2026 implementations (23/5 trading, Rule 605, odd-lot quotes on the tapes).
  — [SEC Order 34-105656, Federal Register 2026-11997](https://public-inspection.federalregister.gov/2026-11997.pdf)
- Round lots went live November 3, 2025. Fee-transparency (Rule 610(d)) changes took effect February 2, 2026. The SEC held Rule 611 roundtables on September 18 and December 16, 2025 — [Cboe 2025 YIR](https://www.cboe.com/insights/posts/2025-u-s-equities-year-in-review). SIFMA (May 4, 2026) asked that 610/612 wait until the SEC's Rule 611 review is done — [SIFMA letter](https://www.sifma.org/advocacy/letters/supplemental-request-for-immediate-extension-of-tick-size-and-access-fee-compliance-dates)
- New round-lot tiers are set by average closing price and reset semiannually (first business day of May and November):
  - $0-$250: 100 shares
  - $250.01-$1,000: 40 shares
  - $1,000.01-$10,000: 10 shares
  - >$10,000: 1 share
  SIPs now show quote size in shares, rounded down to a multiple of the round lot, instead of in round-lot units — [CTA Round Lot FAQ](https://www.ctaplan.com/publicdocs/ctaplan/CTA_Round_Lot_Changes_FAQ.pdf); [FlexTrade](https://flextrade.com/?p=16366)
- The SEC estimated about 98.5% of NMS stocks are unaffected by the round-lot change. The ≤$250 stocks are 97.12% of share volume but only 71.93% of dollar volume — [SEC Order Competition Rule proposal, 34-96495](https://www.sec.gov/files/rules/proposed/2022/34-96495.pdf)

**Rule 605 (execution-quality disclosure)**
- The 2024 Rule 605 amendments:
  - Extend reporting to larger broker-dealers and single-dealer platforms, not only market centers.
  - Change order-size and order-type categories.
  - Require price-improvement statistics relative to the best available displayed price.
  - Add a summary report.
  Compliance moved from December 14, 2025 to August 1, 2026. Data collection began then, and the first detailed and summary reports (for August 2026 data) were due by end of September 2026 — [Federal Register 2025-19316](https://public-inspection.federalregister.gov/2025-19316.pdf)
- On April 1, 2026 the SEC granted limited Rule 605 exemptions, e.g., for certain OTC market-making activity, orders around trading halts, inactive securities and crossed markets (Release 34-105136) — [SEC Order 34-105136](https://www.sec.gov/files/rules/exorders/2026/34-105136.pdf)

**Wholesalers, internalization, PFOF (data mostly from Q1 2022; flagged as older)**
- From the SEC Order Competition proposal (Dec 2022, Q1 2022 data):
  - Brokers route more than 90% of individual investors' marketable orders in NMS stocks to six wholesalers. Two firms hold about 66% of wholesaler executed share volume.
  - Wholesalers internalize (principal) 90.44% of the dollar volume of marketable orders routed to them.
  - The six largest wholesalers paid $235M in PFOF in Q1 2022.
  - PFOF-accepting brokers account for 73.88% of the dollar volume routed to wholesalers.
  - Adverse selection (price impact) of retail marketable orders is 1.26 bps at wholesalers vs 4.40 bps on exchanges, 71% lower.
  - 83.17% of marketable orders at wholesalers got price improvement vs the round-lot NBBO, compared with 8.78% at exchanges.
  - The SEC estimated a "competitive shortfall" of 1.08 bps, about $1.5B/yr.
  — [SEC 34-96495](https://www.sec.gov/files/rules/proposed/2022/34-96495.pdf)
- On June 12, 2025 the SEC withdrew 14 proposals, including the Order Competition Rule (auctions before internalization) and Regulation Best Execution. Any revival needs a new proposal — [National Law Review](https://natlawreview.com/article/sec-formally-withdraws-fourteen-rule-proposals); [Proskauer](https://www.proskauer.com/alert/sec-withdraws-fourteen-rule-proposals)
- Citadel Securities says it executes "35%+" of daily US retail volume, based on competitors' Rule 605 marketable-order data as of May 2025 (self-reported). IFR describes it as about a quarter of all US equities trading — [Citadel Securities](https://www.citadelsecurities.com/news-and-insights/from-the-desk-of-jim-esposito/); [IFR](https://www.ifre.com/ifr-awards/2327839/flow-marketmaker-citadel-securities)
- Virtu's "brokerage, exchange, clearance fees and payments for order flow, net" was $259.0M in Q2 2026 vs $202.1M in Q2 2025 — [Virtu 10-Q Q2 2026](https://www.sec.gov/Archives/edgar/data/0001592386/000159238626000028/virt-20260630.htm)

**Maker-taker vs inverted**
- In a calibrated Nasdaq example (2013 data), Moallemi & Yuan treat the passive order's premium as half-spread plus a Nasdaq rebate of 0.3 ticks (about $0.003/share), i.e., 0.8 ticks — [Moallemi & Yuan](https://drupalgsb-test.paas.cc.columbia.edu/sites/default/files-efs/pubfiles/25461/queue-value-2016.pdf)
- Evidence on venue type is mixed and comes mostly from industry studies. An IEX study reports maker-taker venues have more adverse selection, longer queues and lower fill probability than inverted venues. A DFA study found all-in costs (net of fees, 5-minute VWAP markouts) statistically indistinguishable between the two. For sub-$25 stocks, maker-taker rebate capture beat inverted venues on an all-in basis despite worse gross prices. These are secondary summaries — [Markets Media](https://www.marketsmedia.com/quantifying-the-cost-of-maker-taker-markets/); [Nasdaq](https://www.nasdaq.com/articles/quantifying-the-cost-of-maker-taker-markets-2020-10-08)

**SIP vs direct feeds**
- The CTA and UTP plans publish "realized latency" from the exchange matching-engine event to SIP dissemination at the 10th/50th/99.9th percentiles. The CTA notes the event timestamp is not carried in the data message — [CTA latency charts](https://www.ctaplan.com/latency-charts); [UTP latency charts](https://utpplan.com/PageParts/LatencyCharts.html)
- Budish et al. note that, in their 2005-2011 data, the consolidated feed could be "hundreds of milliseconds delayed relative to the direct-feed data" — [Budish, Cramton & Shim (NBER version)](https://conference.nber.org/conf_papers/f69665.pdf)

### Inferences
- Implied split of 2025 consolidated volume: about 9.5% on ATSs (50.6% × 18.7%) and about 41% principal/wholesaler/single-dealer-platform (50.6% × 81.3%). Lit exchanges executed only about 49%, and part of that is hidden/midpoint.
- For a retail-sized algorithm: your marketable orders sent through a retail broker almost surely go to a wholesaler and never touch the lit book. A direct-market-access account routes to exchanges, where the 1.26 vs 4.40 bps price-impact gap shows the lit book is the toxic venue.
- Through at least November 2027 a half-penny tick will not exist on lit venues. Sub-penny price improvement keeps happening off-exchange (wholesalers, midpoint ATSs), which is a structural driver of the >50% off-exchange share.
- For tick-sensitive strategy design: when the half-penny tick does arrive (November 2027 at the earliest), queue lengths in the tightest names should shorten and rebates shrink from ~30 to ≤10 mils. That will change the economics of rebate capture and passive queueing.
- SIP-based signals are structurally late relative to direct feeds. Any backtest built on consolidated quotes overstates fillability of signals measured at sub-millisecond horizons.

### Gaps
- Exact current count of equity exchanges (roughly 16-18 plus TXSE, including 24X, MIAX Pearl Equities, LTSE, MEMX, IEX) was not verified against the SEC list. Exchange-group market shares for 2025 were not found in a primary source.
- Current (2025-2026) wholesaler concentration and the share of retail marketable flow internalized were not found in a primary source newer than the SEC's Q1 2022 data. The ">90%" figure is old.
- Whether odd-lot best-quote dissemination on the SIP went live in May 2026 was not confirmed (the NYSE comment letter references it as a 2026 initiative).
- Current SIP vs direct-feed median latency numbers in microseconds were not extracted (the CTA/UTP charts are JS-rendered).
- Current exchange fee/rebate schedules were not retrieved. The ~$0.0030 taker fee / ~$0.0020-0.0030 maker rebate typical for maker-taker venues is background knowledge only.

## 2. The limit order book: order types, priority, queue position, data levels

### Takeaway
Continuous double auctions with price-time (FIFO) priority dominate both US equities and CME index futures. In large-tick instruments the spread is pinned at one tick, so the game is largely about queue position. Being early in the queue can be worth a meaningful fraction of the spread.

### Cited Findings
- On CME Globex, FIFO matching uses price and time as the only criteria. An order loses its queue place if its quantity is increased, its price changed, or its account number changed — [CME Group developer documentation](https://cmegroupclientsite.atlassian.net/wiki/spaces/EPICSANDBOX/pages/457218479)
- Moallemi & Yuan model the value of queue position under price-time priority. It has a static part (spread earned minus adverse selection, with adverse selection increasing with queue position, because orders at the back of a long queue fill mainly against large, informed trades) and a dynamic part (option value of the locked-in position). Calibrated to large-tick Nasdaq stocks, the value difference between front of queue and an average-length queue was about 0.21-0.26 ticks. They find "queue value can be of the same order of magnitude as the bid-ask spread" for some large-tick stocks — [Moallemi & Yuan (2016/2017)](https://drupalgsb-test.paas.cc.columbia.edu/sites/default/files-efs/pubfiles/25461/queue-value-2016.pdf)
- A whole-book Glosten-Milgrom extension finds queue values at the best ask of the same order of magnitude as the spread — [arXiv 1902.10743](https://arxiv.org/pdf/1902.10743)
- Reg NMS order-protection and access rules are what make intermarket sweep orders (ISOs) necessary. An ISO lets a router take liquidity at one venue while simultaneously sweeping better-priced protected quotes elsewhere, instead of being blocked by Rule 611 — [SEC Reg NMS adopting release](https://www.sec.gov/rules/final/34-51808.pdf)
- Non-displayed executions (hidden, midpoint-peg) are 17.2% of volume on Cboe's exchanges — [Cboe 2025 YIR](https://www.cboe.com/insights/posts/2025-u-s-equities-year-in-review). Cboe also runs Periodic Auctions (+109% YoY in 2025) and a Retail Price Improvement program on BYX (695.2M shares executed in 2025) — same source
- The Order Competition proposal notes that the round-lot NBBO excludes odd-lot liquidity. That motivated the move to disseminating the best odd-lot quote and the redefinition of round lots for high-priced stocks — [SEC 34-96495](https://www.sec.gov/files/rules/proposed/2022/34-96495.pdf); [SEC fact sheet](https://www.sec.gov/files/34-101070-fact-sheet.pdf)
- Aquilina-Budish-O'Neill use exchange message data (every order, cancel and failed IOC, including the losers of races) rather than book snapshots. The key distinction is that "message data contain attempts to trade or cancel that fail", so races are visible only in full message (L3-like) data — [Aquilina, Budish & O'Neill (NBER WP 29011)](https://www.nber.org/system/files/working_papers/w29011/w29011.pdf)

### Inferences
- Order types a day-trading engine needs:
  - **Limit** (passive, earns the spread, faces adverse selection).
  - **Market/marketable limit** (pays the spread plus impact).
  - **IOC** (no resting; avoids being picked off but can miss).
  - **ISO** (sweep without Rule 611 blocking; broker-dealer privilege).
  - **Hidden/iceberg/reserve** (on US exchanges, displayed size at a price generally has priority over non-displayed size at the same price, so hidden orders sacrifice priority for invisibility).
  - **Midpoint peg** (trades at mid, usually non-displayed, and price improves both sides).
  - **Post-only/ALO** (guarantees maker status so the rebate is captured).
  - On CME: limit, market-with-protection, stop-limit, iceberg (display qty), FAK/FOK.
- Data levels:
  - **L1** = best bid/offer + last trade (SIP or top-of-book feed).
  - **L2** = aggregated depth per price level (market-by-price; e.g., CME MDP 3.0 MBP is 10-deep).
  - **L3** = market-by-order (every add/modify/cancel/execute with order IDs; e.g., Nasdaq TotalView-ITCH, CME MBO).
  Only L3 lets you reconstruct your own queue position and estimate fill probability realistically. Any passive-order backtest without queue modeling will overstate fills, especially in large-tick names.
- Queue position matters because:
  - Under FIFO, fill probability falls with position.
  - Adverse selection rises with position: you get filled at the back only when a large aggressor clears the whole level, which is often right before the price moves through.
  - Modifying an order sends it to the back of the queue.

### Gaps
- Exchange-specific priority rules (e.g., Nasdaq/NYSE/Cboe display-vs-non-display priority, midpoint priority, IEX's discretionary peg and speed bump) were not individually verified from rulebooks in this pass.
- CME MDP 3.0 book depth (10 levels MBP) and the MBO feed specifics are background knowledge, not verified in this pass.

## 3. CME equity index futures microstructure (ES, MES, NQ, MNQ)

### Takeaway
ES/NQ and their micros are quarterly, cash-settled, FIFO-matched contracts. Tick sizes are fixed at 0.25 index points: $12.50 ES, $1.25 MES, $5.00 NQ, $0.50 MNQ. They trade nearly 23 hours a day, 5 days a week. The E-mini has been the center of US index price discovery since about 2000, roughly 90% information share vs SPY then, and 91% of ES-SPY arbitrage opportunities in 2005-2011 were initiated by ES moves.

### Cited Findings
- Specs:
  - **ES**: $50 × S&P 500 futures price. Tick 0.25 index points = $12.50. Calendar-spread tick 0.05 = $2.50 — [CME E-mini FAQ](https://www.cmegroup.com/trading/equity-index/eminifaq.html); [CME E-mini S&P 500 overview](https://www.cmegroup.com/education/lessons/product-e-mini-s-and-p)
  - **NQ**: $20 × Nasdaq-100. Tick 0.25 = $5.00 — [CME E-mini Nasdaq-100 specs](https://www.cmegroup.com/markets/equities/nasdaq/e-mini-nasdaq-100.contractSpecs.html)
  - **MNQ**: $2 × Nasdaq-100. Tick 0.25 = $0.50. Calendar-spread tick 0.05 = $0.10 — [CME Micro E-mini Nasdaq-100 specs](https://www.cmegroup.com/markets/equities/nasdaq/micro-e-mini-nasdaq-100.contractSpecs.html); [CME Micro E-mini FAQ](https://www.cmegroup.com/articles/faqs/micro-e-mini-equity-index-futures-frequently-asked-questions.html)
  - **MES**: $5 × S&P 500. Tick 0.25 = $1.25 — [CME Micro E-mini S&P 500 specs](https://www.cmegroup.com/markets/equities/sp/micro-e-mini-sandp-500.contractSpecs.html) (page not fetchable; value is the CME-listed $5 multiplier × 0.25)
- Hours: Sunday-Friday 5:00 pm-4:00 pm Central Time, i.e., a daily 60-minute halt 4:00-5:00 pm CT (5-6 pm ET) — [CME E-mini S&P 500 overview](https://www.cmegroup.com/education/lessons/product-e-mini-s-and-p)
- Expiry and price limits:
  - Expiring ES contracts stop trading at the open of the primary listing exchange on the final settlement day (the third-Friday 9:30 am ET open). Final settlement is to the opening-based Special Opening Quotation.
  - Price limits of 7%/13%/20% are tied to the equity market-wide circuit breakers. Futures halt when the primary listing exchange declares a Level 1 (7%) regulatory halt and resume 10 minutes after the halt starts.
  — [CME Rulebook Ch. 358 (E-mini S&P 500)](https://www.cmegroup.com/rulebook/CME/IV/350/358/358.pdf)
- Matching: ES and NQ outrights are listed as pure FIFO products. FIFO covers about 70.3% of CME volume. Other algorithms (pro-rata, allocation/top-order, threshold pro-rata, LMM variants) are used mainly in STIR (SR3), Treasury (ZT), grains and options — [Databento: CME matching algorithms explained](https://databento.com/blog/cme-matching-algorithms-explained)
- Volume and growth:
  - Q2 2025: Micro E-mini ADV hit a record of over 3.4M contracts (+43% YoY). April 2025 Micro ADV was 4.6M. April 7, 2025 saw a single-day record of 8.1M micros — [CME Q2 2025 equity index recap](https://www.cmegroup.com/newsletters/quarterly-equity-index-recap/2025-july-equity-index-recap.html)
  - MNQ 2025 ADV was a record 1.8M contracts, 53% of the Micro suite — [CME 2025 equity insights report](https://www.cmegroup.com/news/2025/equity-insights-report.html) (as surfaced by search; not fetched)
  - July 2026: CME equity-index ADV 8.2M contracts (+48%). ES futures 1.4M (+24%). Micro equity futures+options 4.4M, i.e., 54% of equity-index ADV — [TradeInformer](https://www.tradeinformer.com/institutional-trading/cme-group-sets-july-volume-record-as-equity-index-trading-jumps-48)
- Price discovery, Hasbrouck (2003), sample March-May 2000:
  - The E-mini holds "roughly 90%" of S&P 500 price discovery (information share), with floor-traded SP and SPY splitting the remainder.
  - For the Nasdaq-100, NQ provides "over 80%".
  - For the S&P 400, where no E-mini traded then, the ETF provides substantial discovery.
  - Sector ETFs contribute only about 10% to S&P 500 price discovery.
  — [Hasbrouck working paper, NYU](https://archive.nyu.edu/jspui/bitstream/2451/27374/2/FIN-00-046.pdf); [J. Finance 58(6) 2003](https://ideas.repec.org/a/bla/jfinan/v58y2003i6p2375-2400.html)
- ES-SPY at high frequency, Budish, Cramton & Shim (2005-2011 data):
  - ES and SPY are nearly perfectly correlated at minute/hour/day horizons, but the 2011 median return correlation was only 0.0923 at 10 ms and 0.0073 at 1 ms.
  - 91% of ES-SPY arbitrage opportunities were initiated by ES, 9% by SPY.
  - The best cross-correlation fit treats Chicago events as about 8-9 ms earlier than New York.
  - Speed-of-light one-way Chicago-New York latency is about 4 ms.
  — [Budish, Cramton & Shim (NBER)](https://conference.nber.org/conf_papers/f69665.pdf); [QJE 130(4) 2015](https://ideas.repec.org/a/oup/qjecon/v130y2015i4p1547-1621.html)
- A later study notes price formation "is traditionally assumed to occur in the E-mini" but that trading in the component stocks or SPY may control "a non-negligible fraction" of price discovery — [arXiv 1408.3650](https://arxiv.org/pdf/1408.3650)

### Inferences
- Futures vs cash index: by cost-of-carry, fair value F ≈ S·e^{(r−q)T}, where r is the financing rate, q the dividend yield and T time to expiry. The basis (F − S) is mostly financing minus dividends and decays to zero at the SOQ. Intraday, the cash index is a stale weighted average of 500 last-trade prices, so it lags ES. Trade ES/SPY quotes, not the printed index.
- Tick in basis points: at an S&P level of about 6,000-7,000, one ES tick (0.25 pt) is about 0.36-0.42 bp. The spread is essentially always one tick, which makes ES an extreme large-tick, queue-driven instrument (see Section 7). NQ at about 20,000-25,000 has a 0.25-point tick of about 0.1 bp, so NQ is relatively less tick-constrained and has more frequent price changes per unit time.
- MES/MNQ share the ES/NQ tick in index points but have one-tenth the dollar value. Fixed per-contract commissions and exchange fees are therefore 10× larger as a fraction of a tick: on a micro, round-trip fees can approach or exceed one tick of P&L. This should be modeled explicitly.
- Rolls: liquidity migrates to the next quarterly (H/M/U/Z) contract in the days before expiry. Market practice is about 8 calendar days before expiry; this is background knowledge, not verified here. During roll week the calendar-spread book (0.05-pt tick) is a separate liquidity pool, linked to outrights via implied prices (see Gaps).

### Gaps
- CME implied-matching mechanics for ES/NQ (implied-in/implied-out between calendar-spread and outright books) and whether ES calendar spreads use FIFO or another algorithm were not verified from CME documentation (pages blocked).
- Current ES/NQ top-of-book depth, average spread in ticks, and 2025 full-year ES ADV were not retrieved from CME.
- No post-2015 primary estimate of the ES vs SPY/stocks information share was retrieved; the ~90% figure is from 2000 data.
- The exact roll convention and the SOQ calculation details should be checked in the current rulebook.

## 4. Core theory: spread decomposition, Glosten-Milgrom, Kyle, Roll, toxic flow, Avellaneda-Stoikov

### Takeaway
The spread compensates the liquidity provider for three costs: order processing, inventory risk, and adverse selection against better-informed traders. In modern large-cap markets the adverse-selection and latency-race components are what a small trader is exposed to. Kyle's λ and the Glosten-Milgrom model formalize how informed flow moves prices. Avellaneda-Stoikov is the canonical inventory-aware quoting model.

### Cited Findings
- **Inventory models (Ho & Stoll 1981)**: dealers skew quotes against their inventory, and the spread compensates for inventory risk — [Ho & Stoll (1981), JFE](https://doi.org/10.1016/0304-405X(81)90020-9)
- **Glosten-Milgrom (1985)**: a competitive, risk-neutral dealer facing a mix of informed and uninformed traders sets ask = E[V | buy] and bid = E[V | sell]. The spread exists purely from adverse selection, widens with the informed fraction, and transaction prices form a martingale — [Glosten & Milgrom (1985), JFE](https://doi.org/10.1016/0304-405X(85)90044-3)
- **Kyle (1985)**: one informed trader, noise traders, and competitive market makers who see only total order flow. Price moves linearly in net order flow, Δp = λ(x + u), with λ = σ_v/(2σ_u) in the one-shot model (σ_v = std of the value innovation, σ_u = std of noise-trader volume). In the continuous version, information is incorporated gradually and the insider trades so as to hide in noise — [Kyle (1985), Econometrica](https://doi.org/10.2307/1913210)
- **Roll (1984)**: with bid-ask bounce and no information, successive price changes are negatively autocorrelated. The effective spread estimator is s = 2·√(−Cov(Δp_t, Δp_{t−1})), undefined when the covariance is positive — [Roll (1984), J. Finance](https://doi.org/10.1111/j.1540-6261.1984.tb03897.x)
- **Huang & Stoll (1997)**: a general three-way decomposition. They find "a large order processing component and smaller, albeit significant adverse selection and inventory components" — [Huang & Stoll (1997), RFS](https://ideas.repec.org/a/oup/rfinst/v10y1997i4p995-1034.html). A secondary source reports the asymmetric-information component at 9.6% of the spread on average (range 1.4%-22%) — [Southampton working paper](https://eprints.soton.ac.uk/37345/1/CRR-05-07.pdf)
- **Hasbrouck (1991)**: a VAR of trades and quotes measures the permanent price impact (information content) of trades — [Hasbrouck (1991), J. Finance](https://doi.org/10.1111/j.1540-6261.1991.tb03749.x)
- **Measured adverse selection by venue (Q1 2022)**: 1.26 bps for retail marketable orders at wholesalers vs 4.40 bps on exchanges — [SEC 34-96495](https://www.sec.gov/files/rules/proposed/2022/34-96495.pdf). In UK data, latency-arbitrage races account for about 31% of all price impact and 33% of the effective spread — [Aquilina, Budish & O'Neill](https://www.nber.org/system/files/working_papers/w29011/w29011.pdf)
- **Flow toxicity (VPIN)**: Easley, López de Prado & O'Hara propose VPIN, a volume-synchronized probability of informed trading, as a real-time toxicity metric — [Easley, López de Prado & O'Hara (2012), RFS](https://doi.org/10.1093/rfs/hhs053). Andersen & Bondarenko dispute its predictive power around the 2010 flash crash — [Andersen & Bondarenko (2014), JFM](https://doi.org/10.1016/j.finmar.2013.05.005)
- **Avellaneda-Stoikov (2008)**: a market maker with exponential utility (risk aversion γ), mid following arithmetic Brownian motion (σ), and fills at Poisson intensity λ(δ) = A·exp(−kδ) at distance δ from mid. It quotes around a reservation (indifference) price r(s,q,t) = s − q·γ·σ²·(T−t), below mid when long and above when short, with total spread δ^a + δ^b = γσ²(T−t) + (2/γ)·ln(1 + γ/k) — [Avellaneda & Stoikov (2008), Quantitative Finance](https://www.math.nyu.edu/~avellane/HighFrequencyTrading.pdf)
- **Order-flow imbalance (Cont, Kukanov & Stoikov)**: over short intervals, mid-price changes are approximately linear in order-flow imbalance at the best quotes, with slope inversely proportional to depth — [Cont, Kukanov & Stoikov (arXiv 1011.6402)](https://arxiv.org/abs/1011.6402)
- Textbook references for the chapter:
  - [Bouchaud, Bonart, Donier & Gould, *Trades, Quotes and Prices* (CUP 2018)](https://doi.org/10.1017/9781316659335)
  - Hasbrouck, *Empirical Market Microstructure* (OUP 2007)
  - Cartea, Jaimungal & Penalva, *Algorithmic and High-Frequency Trading* (CUP 2015)
  - O'Hara, *Market Microstructure Theory* (1995)
  - Harris, *Trading and Exchanges* (OUP 2003)

### Inferences
- In practice: realized spread (spread captured minus subsequent mid move, e.g., over 1-5 s or 1-5 min) is the operational measure of maker profitability. Effective spread minus realized spread equals price impact, which is the adverse-selection part.
- Strategy diagnostic: a passive strategy with positive effective spread but negative realized spread is being picked off by informed/faster flow.
- Kyle λ is estimable intraday by regressing mid changes on signed volume (or OFI) per bucket. It rises at the open and around news, consistent with information concentration.
- Roll's estimator is a useful sanity check on bar data but breaks down when returns are momentum-correlated, e.g., during metaorder execution. With positive autocorrelation the estimator is undefined.
- Avellaneda-Stoikov intuition for an intraday maker:
  - Skew quotes against inventory, with the skew growing with γσ² and time remaining.
  - The base spread is set by the fill-intensity decay k.
  - In large-tick books (ES) the continuous-price assumption fails: you cannot quote "0.3 ticks" from mid. The model's decisions collapse into join, skip or cancel at fixed price levels, and queue position (Section 2) becomes the dominant variable.

### Gaps
- The full Huang-Stoll (1997) component split was not verified from the original tables. Commonly quoted values (order processing ~62%, inventory ~29%, adverse selection ~10% for 20 large NYSE stocks, 1992) are unverified recollection. Secondary sources conflict (one says order processing ~90%).
- No recent (post-2015) US decomposition of spreads into these components was retrieved.

## 5. Empirical regularities: impact (square-root law), transient vs permanent impact, order-flow memory, intraday patterns, auctions, microprice

### Takeaway
Metaorder impact is concave, roughly Δ ≈ Y·σ·√(Q/V) with Y of order 1 and exponents of 0.4-0.7. It is largely transient at the single-trade level, a consequence of long-memory order signs that are themselves caused by order splitting. Volume and volatility follow a U-shape through the day, and the closing auction is about 9-10% of daily volume. The micro-price (imbalance-adjusted mid) is a better short-horizon fair-value estimate than the mid or the naive size-weighted mid.

### Cited Findings
**Square-root impact**
- Tóth et al. (Capital Fund Management): average impact of a metaorder of size Q is Δ(Q) = Y·σ·√(Q/V), where σ is daily volatility, V daily volume, and Y "of order unity". More generally Δ ∝ Q^δ with δ between 0.4 and 0.7 across studies:
  - Almgren et al., about 700,000 Citigroup US stock orders: δ ≈ 0.6.
  - Moro et al.: Madrid δ ≈ 0.5, London δ ≈ 0.7.
  - CFM's own sample of about 500,000 futures trades: δ ≈ 0.5 for small-tick and δ ≈ 0.6 for large-tick contracts, for Q/V from a few 10⁻⁴ to a few %.
  — [Tóth et al. (2011), PRX, arXiv 1105.1694](https://www.arxiv.org/pdf/1105.1694)
- Explanation: the law arises because liquidity near the price is "anomalously small", giving a V-shaped latent supply/demand curve that vanishes at the current price. Real markets are "slow", with liquidity renewal time much longer than inter-trade time; the ratio r of order 10⁴ is a necessary condition for concave impact — [Tóth et al.](https://www.arxiv.org/pdf/1105.1694)
- Bitcoin: more than one million reconstructed metaorders confirm the square-root law over four decades of size, and it holds along the whole execution trajectory — [Donier & Bonart](https://ideas.repec.org/p/arx/papers/1412.4503.html)
- Dissent: Zarinelli et al. find the square-root form fits only about 2 orders of magnitude of size, while a logarithmic form fits about 5 — [arXiv 1412.2152](https://ar5iv.arxiv.org/html/1412.2152)
- Maitrier, Loeper, Kanazawa & Bouchaud (Tokyo Stock Exchange account-level data) conclude impact is "essentially mechanical" rather than due to information revelation as in Kyle — [arXiv 2502.16246](https://ideas.repec.org/p/arx/papers/2502.16246.html); [arXiv 2503.18199](https://ideas.repec.org/p/arx/papers/2503.18199.html)

**Long memory, order splitting, transient impact**
- Trade signs are long-range correlated, C(ℓ) ≈ ℓ^(−γ), with γ ≈ 0.5 for single stocks and γ ≈ 0.8 for futures — [Tóth et al.](https://www.arxiv.org/pdf/1105.1694)
- Lillo-Mike-Farmer: if metaorder sizes are power-law distributed with tail exponent α, splitting them produces sign autocorrelation decaying as τ^(−(α−1)). This is long memory for α < 2 — [Lillo, Mike & Farmer (2005), arXiv cond-mat/0412708](https://arxiv.org/abs/cond-mat/0412708). Account-level TSE data later gave direct quantitative validation — [Sato & Kanazawa (2023), PRL](https://link.aps.org/doi/10.1103/PhysRevLett.131.197401)
- Bouchaud et al. "propagator" model: each trade's impact decays over time (transient), and the decay is tuned against the long memory of order flow so that prices remain diffusive (statistically efficient) — [Bouchaud, Gefen, Potters & Wyart (2004), arXiv cond-mat/0307332](https://arxiv.org/abs/cond-mat/0307332)
- For large-tick stocks a model with permanent, non-fluctuating bare impact per event fits well. For small-tick stocks bare impact has a history-dependent component tied to book fluctuations — [Eisler, Bouchaud & Kockelkoren, arXiv 0904.0900](https://www.arxiv.org/abs/0904.0900v3)

**Intraday patterns, auctions, extended hours**
- Theory: Admati & Pfleiderer explain why trading concentrates at certain times of day: discretionary liquidity traders cluster, and informed traders follow them — [Admati & Pfleiderer (1988), RFS](https://doi.org/10.1093/rfs/1.1.3)
- Empirics: intraday volume and volatility are U-shaped. One Nasdaq study finds spreads highest at the open, falling after the first minutes and relatively flat until a slight decline at the close, rather than a symmetric U — [IUP Journal study of Nasdaq stocks](https://www.iupindia.in/908/IJAF_Nasdaq_Stocks_5.html). A 2025 RFS model generates U-shaped volume and spread patterns from oligopolistic market makers — [EBSCO summary](https://www.ebsco.com/articles/business-and-management/2409c82f-e2ef-5289-95b9-90e0e4821fb9/dynamic-market-making-with-asymmetric-information-and-market-power/)
- Closing auctions (2024 data):
  - About $50B notional on a typical 2024 day, roughly 9% of daily volume.
  - About 20% on index-rebalance and option-expiry days.
  - Record 9.44% of notional ($55.5B/day) in Q2 2024.
  — [BMLL](https://www.bmlltech.com/news/market-insight/into-the-close-unpacking-u-s-closing-auction-dynamics-and-the-impact-of-the-russell-reconstitution)
- Closing auction records: NYSE's three largest closing auctions ever occurred in 2025, with a single-day record of over $205B — [ICE/Business Wire, Jan 2026](https://www.businesswire.com/news/home/20260120664112/en). NYSE reported a record 605.5M shares (about $43B) daily in its Q1 2026 close, and a record 3.57B shares matched on March 20, 2026 — [NYSE insights](https://www.nyse.com/research/insights/behind-the-record-volumes-a-hidden-opportunity)
- Pre-market was 5.91% of 2025 consolidated volume — [Cboe 2025 YIR](https://www.cboe.com/insights/posts/2025-u-s-equities-year-in-review)

**Microprice**
- Stoikov's micro-price is defined as the limit of expected future mid-prices conditioned on order-book state (mid M, imbalance I = Q_b/(Q_b+Q_a), spread S): P_micro = M + Σ g_k(I,S), computed recursively from a Markov chain estimated on top-of-book data. Properties:
  - It is a martingale (the mid and the weighted mid are not).
  - It is fast to compute.
  - It predicts short-term prices better.
  - It was illustrated on BAC (large-tick) and CVX (small-tick), March 2011, with out-of-sample checks against 1-minute-ahead mid changes.
- The naive weighted mid I·P_a + (1−I)·P_b (Gatheral & Oomen) is noisy and can move counter-intuitively. Example: an ask-side cancel can lower the weighted mid.
  — [Stoikov, "The Micro-Price" (slides, Gatheral 60 conference)](https://www.ma.imperial.ac.uk/~ajacquie/Gatheral60/Slides/Gatheral60%20-%20Stoikov.pdf)

### Inferences
- Impact budgeting with the square-root law: an order of 1% of ADV in a stock with 2% daily vol costs roughly Y·2%·√0.01 ≈ 20 bps (Y≈1). A 0.01%-of-ADV order costs about 2 bps, usually less than half-spread plus fees in liquid large-caps. A small day trader is in the regime where spread, fees and adverse selection dominate and impact is second-order. Once size scales past about 0.1% of ADV per trade, impact must enter the alpha threshold.
- Because single-trade impact is largely transient, short-horizon mean-reversion signals after aggressive prints are partly real. They are also exactly what HFT market makers already trade at microsecond speed. Edge at a 1-5 minute horizon is more plausible for a slow participant than edge at 1-100 ms.
- Long memory of signs means order flow is predictable (one buy tends to follow another) while prices are not. Signed-volume and OFI features are therefore informative but mostly priced in by the time a slow trader observes them.
- In large-tick names (ES, SPY, low-priced stocks) the imbalance at the best quotes is the single most informative short-horizon predictor of the next mid move. The microprice is the principled way to use it. In small-tick names, deeper book levels and spread state matter more.
- The open (first ~30 min) has the widest spreads, highest volatility and highest λ. The close is dominated by MOC/LOC flow and the auction. Strategy parameters (thresholds, sizes, stop widths) should be time-of-day conditional.

### Gaps
- No primary 2024-2026 TAQ-based US intraday volume profile was retrieved, e.g., the share of volume in the first and last 30 minutes. The last-30-minutes share is a known gap in these notes.
- The 2025 closing-auction share of total consolidated volume was not found; the ~9% figure is from 2024.
- Specific estimated Y values by asset class, and the propagator decay exponent β (theory predicts β = (1−γ)/2), were not extracted from primary sources in this pass.

## 6. High-frequency trading: players, latency, latency arbitrage, and implications for small traders

### Takeaway
Liquidity in US equities and index futures is supplied mainly by a handful of electronic market makers. In equities these include Citadel Securities, Virtu, Jane Street, HRT, Susquehanna/SIG, Jump and Two Sigma. Their reaction times are in the tens of microseconds and they link Chicago and New Jersey at about 4 ms one way over microwave. Latency-arbitrage races are about 20% of volume, last microseconds, and tax trading by about 0.5 bp. A retail or small participant cannot win these races and should design strategies whose edge per trade is several multiples of the spread plus fees, at horizons of seconds to hours.

### Cited Findings
**Latency arbitrage magnitudes, Aquilina, Budish & O'Neill (LSE message data, FTSE 350; ~15,000 symbol-days, ~2.2B messages)**
- Frequency: the average FTSE 100 symbol has 537 races per day, about one per minute. There are about 71,000 races per day across all symbols.
- Duration: the modal margin between winner and first loser is 5-10 µs; the mean race duration is 79 µs.
- Speed: the minimum observed reaction time is 29 µs, and median actual observed latency is about 150 µs (90th percentile about 300 µs).
- Volume: races account for about 22% of volume and 21% of trades.
- Concentration: the top 6 firms account for over 80% of race wins and losses (82% of wins, 87% of losses). On net, top-6 firms take liquidity from everyone else, who provide about 58% of the liquidity taken in races.
- Size per race: about half a tick.
- Share of costs: races are about 31% of price impact and 33% of the effective spread.
- Tax: the "latency arbitrage tax" is 0.42 bp of total volume (0.53 bp on another basis).
- Welfare: eliminating latency arbitrage would cut the cost of liquidity by 17%.
- Total stakes: about $5B/yr in global equities (range $2.3-8.4B; about $7B in 2020).
— [Aquilina, Budish & O'Neill (NBER WP 29011 / QJE 2022)](https://www.nber.org/system/files/working_papers/w29011/w29011.pdf)

**ES-SPY arms race, Budish, Cramton & Shim (2005-2011)**
- The median duration of ES-SPY arbitrage opportunities fell from 97 ms (2005) to 7 ms (2011), while median profitability stayed about constant at about 0.08 index points per unit.
- There were about 900-1,000 opportunities per day. The average opportunity was 13 ES lots / 6,500 SPY shares, worth about $91.68.
- Profits were $82k per day on NYSE-only data, scaled to about $312k per day, or roughly $75M per year, for ES-SPY alone.
- The number of opportunities scales with volatility. The arms race "does not actually eliminate the arbitrage opportunities; rather, it just continually raises the bar".
- Spread Networks' roughly $300M Chicago-NY fiber cut round-trip time from 16 to 13 ms.
- The authors propose frequent batch auctions, e.g., every 100 ms.
— [Budish, Cramton & Shim (NBER)](https://conference.nber.org/conf_papers/f69665.pdf)

**Microwave links**
- Quincy Data: CME Aurora to Nasdaq Carteret is 3.982 ms one way, rack to rack (2016, down from 4.012 ms in July 2015). Routes to NY2/NYSE Mahwah are about 3.99-4.02 ms — [McKay Brothers/Quincy](https://mckay-brothers.com/quincy-latency-reductions-nearing-perfection-on-aurora-nj-data-network)
- Aurora to Secaucus NY5 is 4.056 ms; 350 E. Cermak to NY5 is 3.885 ms — [McKay Brothers](https://www.mckay-brothers.com/live-at-ny5)
- Academic measurement confirms the corridor runs extremely close to the speed of light — [Bhattacherjee et al. (Duke)](https://courses.cs.duke.edu/fall21/compsci514/internal/readings/BhattacherjeeAABSTACGLMS22.pdf)

**Players**
- Citadel Securities self-reports "35%+" of US retail volume and is described as about a quarter of all US equity trading — [Citadel Securities](https://www.citadelsecurities.com/news-and-insights/from-the-desk-of-jim-esposito/); [IFR](https://www.ifre.com/ifr-awards/2327839/flow-marketmaker-citadel-securities)
- Jane Street averaged about $2.4 trillion per month in global equity volume in 2024, more than 10% of the North American market — [Global Trading](https://www.globaltrading.net/?p=38181)
- Global Trading's Rule 605-based analysis names SIG and HRT as 2025's biggest net gainers in retail volume and execution quality (E/Q ratio) among retail market makers (Citadel, Virtu, Two Sigma, Jane Street, HRT, Susquehanna). The full figures are paywalled — [Global Trading](https://www.globaltrading.net/?p=39575)
- In the Q1 2022 SEC data, six wholesalers received more than 90% of retail marketable orders and two of them did about 66% of wholesaler volume — [SEC 34-96495](https://www.sec.gov/files/rules/proposed/2022/34-96495.pdf)

### Inferences
- Latency gap: a cloud- or home-hosted retail algo typically runs at 1-50 ms round trip to the exchange. That is about 2-3 orders of magnitude slower than the 29-150 µs reaction times above, and slower than the entire Chicago-NJ microwave hop (about 4 ms). Any signal visible in ES before SPY (or vice versa) at sub-10 ms horizons is unreachable.
- Selection effect: when a small trader's resting order fills during a fast move, it is disproportionately because the HFT that would have cancelled first was faster. Every resting limit order at the touch is a free option sold to faster participants (Budish's "sniping").
- Practical implications for strategy design:
  - Target edges of at least about 2-5× (half-spread + fees + expected adverse selection) per trade. In ES that means multi-tick targets, not 1-tick scalps.
  - Use holding periods of seconds to hours, where HFT inventory-driven mean reversion and impact decay can be harvested rather than raced.
  - Prefer passive entries only where queue position is attainable (e.g., join early at new price levels) and adverse selection is measured (markouts).
  - Avoid stale-quote exposure around scheduled news.
  - Use marketable orders when the predicted move over the holding horizon exceeds the spread by a wide margin.
- In futures, FIFO plus the large tick means HFTs with co-location at CME Aurora get to the front of new price levels first. A slow trader's queue position at a newly formed level is typically near the back, so its fills are adversely selected.

### Gaps
- No primary estimate of HFT share of total US equity or ES volume for 2024-2026 was found. Firm-level equity market shares beyond self-reports and press (e.g., HRT, Virtu, Jump, Tower) are not reliably sourced here. Figures circulating on vendor blogs (e.g., "HRT 15%, Virtu 20%") are unverified.
- No US-equity or CME-specific replication of the Aquilina et al. race measurement was found (their data are LSE).
- Current colocation/microwave latency figures post-2016, e.g., millimeter-wave or laser links, and current CME/NJ tick-to-trade benchmarks (sub-microsecond FPGA) were not sourced.

## 7. Tick size relative to price: large-tick vs small-tick instruments and queue dynamics

### Takeaway
Classify every instrument by spread-to-tick ratio. Large-tick assets (spread almost always 1 tick, e.g., ES, SPY, most low-priced stocks) have long queues, and queue position, imbalance and fees dominate them. Small-tick assets (spread of several ticks, e.g., high-priced stocks, NQ relatively) behave more like a continuous-price market, where spread state and deeper book matter. This choice determines which microstructure signals and which execution tactics work.

### Cited Findings
- Definition: "large tick stocks are such that the bid-ask spread is almost always equal to one tick, while small tick stocks have spreads that are typically a few ticks" — [Eisler, Bouchaud & Kockelkoren, arXiv 0904.0900](https://www.arxiv.org/abs/0904.0900v3); adopted by [Dayri & Rosenbaum, "Large tick assets: implicit spread and optimal tick size", arXiv 1207.6325](https://arxiv.org/pdf/1207.6325)
- For large-tick assets the observed spread is bounded below by one tick and stops being informative. Dayri & Rosenbaum propose an "implicit spread" (the spread that would prevail without the tick constraint) and use it to study optimal tick size — [Dayri & Rosenbaum](https://arxiv.org/pdf/1207.6325)
- Impact exponents differ by tick regime in CFM futures data: δ ≈ 0.6 for large-tick vs ≈ 0.5 for small-tick contracts — [Tóth et al.](https://www.arxiv.org/pdf/1105.1694)
- Queue value matters most in large-tick stocks: it can be "of the same order of magnitude as the bid-ask spread" — [Moallemi & Yuan](https://drupalgsb-test.paas.cc.columbia.edu/sites/default/files-efs/pubfiles/25461/queue-value-2016.pdf)
- Stoikov builds the micro-price to work for both regimes, illustrated with BAC (large tick) and CVX (small tick) — [Stoikov slides](https://www.ma.imperial.ac.uk/~ajacquie/Gatheral60/Slides/Gatheral60%20-%20Stoikov.pdf)
- Regulatory relevance: the SEC justified the half-penny tick by noting that a growing share of volume trades in stocks "that would likely be priced with tighter spreads if their pricing was not constrained by Rule 612". The half-penny tick targets stocks with TWAQS ≤ $0.015, i.e., tick-constrained ones — [SEC fact sheet](https://www.sec.gov/files/34-101070-fact-sheet.pdf). MEMX attributes part of the off-exchange shift to the one-cent tick in such names — [MEMX](https://memx.com/insights/strong-volume-in-january-one-cent-tick-size-hurts-exchange-competitiveness)

### Inferences
- Rule of thumb: compute tick/price in bps and the time-averaged spread in ticks.
  - **Large-tick**: average spread under about 1.2 ticks and tick at or above roughly 1-2 bps relative to volatility per trade.
    - Examples: a $20 stock with a 1¢ tick = 5 bps; SPY at about $650 with 1¢ ≈ 0.15 bp but a spread nearly always 1¢ because the book is very deep; ES at about 0.4 bp per tick with a 1-tick spread.
    - Price moves only when a queue depletes, so queue sizes and imbalance carry most of the short-horizon information.
    - Passive fills are valuable but rationed by queue position.
    - Strategies: queue-imbalance/microprice signals, joining new levels early, rebate-aware routing in equities.
  - **Small-tick**: spread of several ticks.
    - Examples: a $500+ stock with a 1¢ tick ≈ 0.2 bp and spreads of 5-20¢.
    - Prices move by quote revisions inside the spread, queues are short, and queue position matters less.
    - Spread state, deeper-level OFI and volatility are more informative.
    - The A-S continuous-quote logic is a closer approximation.
- For a small participant, large-tick books are where passive orders are most adversely selected at the back of the queue, and where crossing the spread is relatively expensive (1 tick is a large fraction of a typical move). Small-tick books make spread costs more continuous but expose you to more quote fading.
- When the half-penny tick takes effect (November 2027 at the earliest) many of today's large-tick stocks (TWAQS ≤ 1.5¢) will become "less large-tick". Queues and rebates shrink, and signal and execution logic calibrated under the 1¢ tick will need recalibration.
- ES vs NQ choice: ES (and MES) is the prototypical large-tick, deep-queue future. NQ/MNQ has a much smaller tick relative to price and volatility, so it moves more ticks per unit time with thinner queues. MNQ's $0.50 tick makes very fine-grained sizing possible but raises fees as a fraction of a tick.

### Gaps
- No primary source was retrieved giving a quantitative threshold (e.g., mean spread/tick < 1.5) used by exchanges or the SEC to classify large-tick stocks, beyond the SEC's TWAQS ≤ $0.015 criterion.
- No measured ES or NQ queue sizes, depletion rates or spread-in-ticks statistics were retrieved; these should be measured directly from CME MBO data.

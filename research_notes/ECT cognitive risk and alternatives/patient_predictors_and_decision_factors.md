# Patient-Level Predictors of ECT Response and Cognitive Vulnerability, the Cost of Untreated Chronic Depression, Relapse Prevention, and Real-World Outcomes: Decision Factors for a Young Adult With ~10 Years of TRD

Patient context used for relevance: a young adult who plans to attend medical school. They have had about 10 years of chronic treatment-resistant MDD, failed all antidepressant classes, are very side-effect prone, and have prominent psychomotor slowing and heavy "brain fog." rTMS failed completely.

Method note: Scite (`search_literature`) returned a paywall error ("MCP tools require a paid scite plan"), so it could not be used to verify papers. Papers were instead checked against PubMed/PMC abstracts, publisher pages, or full-text PDFs retrieved through Exa and Tavily. Where only a secondary source was available, this is flagged.

---

## 1. Predictors of ECT response, and the best estimate of response/remission for this patient

### Takeaway
Two predictors of lower ECT efficacy are well established. One is longer episode duration (responders average ~6.6 months, non-responders ~14 months). The other is prior medication failure (remission ~48% vs ~65%). This patient sits at the unfavorable extreme on both. Psychomotor retardation is a genuine favorable predictor; it largely explains why older patients do better. Young age itself mostly has no independent effect once symptom profile is accounted for. My best synthesized estimate for this patient, for an acute course, is response ≈35–55% and remission ≈20–40% (central ≈45% response, ≈30% remission). The confidence interval is wide because the best multivariable model explains only ~19% of outcome variance.

### Cited Findings

**Core meta-analyses**
- van Diermen et al. 2018 (BJP 212:71–80; 34 studies) found these predictors:
  - Psychotic features predict remission (OR 1.47, P=0.001) and response (OR 1.69, P<0.001).
  - Older age predicts both: SMD 0.26 for remission (95% CI 0.13–0.38) and 0.35 for response.
  - Depression severity predicts response (SMD 0.19) but not remission.
  - Data on melancholic features were "inconclusive."
  - Mean age was 59.7 years in remitters vs 55.4 in non-remitters, a gap of only 4.3 years. The authors call these "rather small effect sizes."
  - Source: [van Diermen 2018, BJP](https://www.cambridge.org/core/journals/the-british-journal-of-psychiatry/article/prediction-of-electroconvulsive-therapy-response-and-remission-in-major-depression-metaanalysis/259FD7600E652E9D272481FC6D87F4F9)
- In the same paper, the predictive effect of psychotic features was stronger in older patients and in samples with lower medication resistance. The authors note that psychomotor disturbance "proved to be a predictor of ECT response in previous studies" but was not meta-analysed separately. — [van Diermen 2018, BJP](https://www.cambridge.org/core/journals/the-british-journal-of-psychiatry/article/prediction-of-electroconvulsive-therapy-response-and-remission-in-major-depression-metaanalysis/259FD7600E652E9D272481FC6D87F4F9)
- Haq et al. 2015 (J Clin Psychiatry) reported:
  - Shorter episode duration predicted higher response (SMD −0.37; 7 studies; 702 subjects; P=4×10⁻⁶).
  - Medication failure in the current episode predicted lower response: 58% with vs 70% without (OR 0.56; 11 studies; 1,175 subjects).
  - Age and psychosis were only weakly associated, with notable heterogeneity.
  - Bipolar diagnosis, sex, age at onset, and number of previous episodes were not predictors.
  - Source: [Haq 2015, J Clin Psychiatry](https://www.psychiatrist.com/jcp/response-depression-electroconvulsive-therapy-meta/)
- As quoted in van Diermen 2018, the Haq analysis gave a weighted mean episode duration of 6.6 months for responders vs 14 months for non-responders (SMD −0.43). — [van Diermen 2018](https://www.cambridge.org/core/journals/the-british-journal-of-psychiatry/article/prediction-of-electroconvulsive-therapy-response-and-remission-in-major-depression-metaanalysis/259FD7600E652E9D272481FC6D87F4F9)
- Heijnen et al. 2010 (J Clin Psychopharmacol 30:616–9; 7 cohort studies) found remission of 48.0% (281/585) with prior pharmacotherapy failure vs 64.9% (242/373) without (OR 0.52, 95% CI 0.39–0.69). The authors caution that the finding comes from observational studies and could be confounded by psychosis or episode duration. — [PubMed 20814336](https://pubmed.ncbi.nlm.nih.gov/20814336)

**Psychomotor retardation and age (mediation)**
- Heijnen et al. 2019 (J Psychiatr Res 109:41–47) found a significant mediating pathway from age to ECT efficacy through psychomotor retardation (p=.049), with a trend through psychotic features (p=.071).
  - Patients with psychomotor retardation had significantly larger HAM-D reduction (medium effect size) and a trend toward higher remission.
  - The authors suggest obvious psychomotor retardation "may be an argument for treatment with ECT earlier in the treatment algorithm."
  - The young-adult subgroup (<50 years) was small (n=13).
  - Sources: [Heijnen thesis / J Psychiatr Res 2019](https://exa.ai/library/publication/d16mxln9w7l); [EUR record](https://pure.eur.nl/en/publications/influence-of-age-on-ect-efficacy-in-depression-and-the-mediating-/)
- van Diermen et al. 2020 (J Clin Psychiatry; n=73, path analysis):
  - Baseline psychomotor agitation, retardation, and/or psychosis ("core depression") strongly correlated with beneficial ECT outcome (z=0.84, SE 0.17, P<.001).
  - The age–outcome association was mediated by these features (z=0.53, P=.004), with no direct age effect (P=.479).
  - Episode duration had an independent negative effect (z=−0.38, P<.001).
  - The authors conclude that "age may heretofore have been given too much weight."
  - Source: [van Diermen 2020](https://www.psychiatrist.com/jcp/predictors-of-ect-treatment-response-in-depression/)
- An Irish pooled causal-mediation analysis (4 prospective studies; n=256) found HAM-D fell a further 1.74 points per additional 10 years of age. Of this age effect, 43.1% was explained by psychotic features, psychomotor retardation, psychomotor agitation, and episode duration. The authors recommend ECT "earlier in the episode." — [PubMed 40207565](https://pubmed.ncbi.nlm.nih.gov/40207565/)

**Multivariable and recent (2023–2026) evidence**
- The Dutch ECT Consortium (DEC) prediction model (Loef et al., online Oct 2024; n=1,892; 22 cohorts) identified these independent predictors of better outcome:
  - higher age
  - shorter current-episode duration
  - psychotic features
  - lower antidepressant resistance in the current episode
  - higher pre-ECT global cognition
  - absence of comorbid personality disorder
  - fewer failed psychotherapies
  - Optimism-adjusted R² was 19%. The remission model had a C-statistic of 0.696.
  - RMSE was 6.7 HDRS points. The authors note "a large proportion of the variance… remained unpredictable."
  - Source: [Loef et al., DEC prediction model](https://exa.ai/library/publication/hjlxldfdh8g)
- Rovers et al. 2023 (Dutch ECT cohort; n=440) used the DM-TRD score:
  - Each additional point lowered the odds of response (OR 0.821, 95% CI 0.760–0.888).
  - Longer current episode, failed antidepressants, failed augmentation, and failed psychotherapy were each associated with non-response.
  - High-TRD patients needed more sessions (16±7 vs 13±6) and were more often switched from RUL to bilateral placement (40% vs 29%).
  - A previous failed ECT course in the current episode did not predict outcome, but only n=20 had one.
  - Source: [Rovers 2023](https://exa.ai/library/publication/4ks3g7zrfd7)
- A 2026 narrative review (Translational Psychiatry) summarizes the pattern: "Older patients with psychotic and/or psychomotor symptoms mostly show a favorable response, while younger patients with comorbidities and longer episode duration tend to benefit less from ECT." It adds that "there are currently no biomarkers available" to guide decisions. — [Transl Psychiatry 2026 review](https://www.nature.com/articles/s41398-026-03900-2)
- The same review reports a Swedish registry finding: suicidal ideation was associated with lower ECT response, which was explained by higher rates of personality disorder and lower age. — [Transl Psychiatry 2026 review](https://www.nature.com/articles/s41398-026-03900-2)

**Real-world remission rates (benchmarks)**
- Swedish Quality Register (Brus et al. 2017, Eur Psychiatry; n=1,671): 42.8% self-rated remission (MADRS-S 0–10). Each of the following was associated with remission:
  - older age
  - more than 9 years of education
  - psychotic symptoms
  - shorter preceding antidepressant use
  - pulse width ≥0.50 ms
  - absence of substance use disorder, anxiety diagnosis, lamotrigine, and benzodiazepines
  - Source: [Brus 2017](https://www.sciencedirect.com/science/article/pii/S0924933817329176)
- A Dutch real-world vs research cohort analysis found response 63% and remission 47% overall: 59%/45% in real-world cohorts and 67%/50% in research cohorts. It cites prior meta-analytic ranges of response 58–70% and remission 48–65%. — [Utrecht repository PDF](https://dspace.library.uu.nl/server/api/core/bitstreams/f48154d8-d0b6-4fbf-94ab-9f47e2048673/content)
- A highly treatment-resistant US community ECT clinic (mean 5.3 prior antidepressant trials) reported response 54.3% and remission 31.4%. Patients with severe baseline anxiety were less likely to respond (P=.027). — [Prim Care Companion CNS Disord](https://www.psychiatrist.com/pcc/depression-remission-response-rates-anxiety-predictor-depression-response-ect)
- CORE (Husain 2004; bilateral ECT; n=253; a largely less-resistant trial population) reported:
  - 75% remission and 79% sustained response
  - 34% remitted by session 6 and 65% by session 10
  - Sources: [PubMed 15119910](https://pubmed.ncbi.nlm.nih.gov/15119910); [Psychiatric Times](https://www.psychiatrictimes.com/view/speed-response-ect)

**Young age specifically**
- Dutch multicenter chart review (J ECT 2024) compared young (15–25 y; n=57) with older (26–80 y; n=41) patients:
  - Response 40.4% vs 56.1% and remission 28.1% vs 39.0%; neither difference was significant.
  - After adjustment, the remission OR was 0.51 (95% CI 0.19–1.40), giving adjusted remission of 24.9% vs 39.5%.
  - Young patients had more personality, autism, and anxiety disorders.
  - Source: [J ECT 2024](https://journals.lww.com/ectjournal/fulltext/2024/09000/a_multicenter_retrospective_chart_review_on_the.2.aspx)
- In 424 patients aged 16–30 (Luccarelli et al.), age did not predict depression improvement (ΔQIDS −6.7 over 10 treatments) or cognitive change. — [PMC8669295](https://pmc.ncbi.nlm.nih.gov/articles/PMC8669295/)
- In a Swedish national psychotic-depression register study (2012–2020), 89.8% of ECT-treated patients responded and 48.4% remitted. Younger age was associated with lower odds of remission, and age 51–75 (vs ≤25) with higher odds of response. — [Al-Wandi & Nordenskjöld 2026, J Affect Disord](https://www.sciencedirect.com/science/article/pii/S016503272601253X)
- In a Chinese observational study, adolescents had lower remission than adults (mean age ~27): 28.1% vs 45.6%. — [J Affect Disord 2025](https://www.sciencedirect.com/science/article/abs/pii/S0165032725011425)

**Prior rTMS non-response**
- Dannon & Grunhaus 2001 (Int J Neuropsychopharmacol 4:265–8) switched 17 rTMS non-responders to ECT; 7/17 (~41%) responded (3/5 non-psychotic, 4/12 psychotic). The authors could not tell whether this reflected reduced ECT responsiveness or small sample size. — [Dannon 2001](https://exa.ai/library/publication/p3qzdxrhp8w)
- Yuan et al. 2020 (Neuromodulation) write: "Several small-scale studies suggest that patients who first failed a course of TMS therapy may be less likely to respond to a subsequent course of ECT." They nevertheless "consider ECT as an appropriate treatment recommendation for many TMS non-responders." — [PMC7131879](https://pmc.ncbi.nlm.nih.gov/articles/PMC7131879/)

**Second course after initial non-response**
- In ECT non-responders, a second course of high-dose brief-pulse bilateral ECT gave remission of about 60% (Columbia) and 40% (OPT-ECT). It also caused greater retrograde amnesia immediately and at 2 and 6 months. — [Sackeim et al. 2020, PubMed 32585354](https://pubmed.ncbi.nlm.nih.gov/32585354/)

**Expert framing**
- Thase's TRD staging slides state that ECT is "less effective in TRD than in uncomplicated depression (i.e., 50%-60% vs 90%)" and that it is the "treatment of choice for delusional and melancholic cases of TRD." These are slides, not peer-reviewed. — [Thase 2016 handout](https://www.ncpsychiatry.org/assets/2016AnnualMeeting/Handouts/2_treatment_resistant_depression-michael_thase.pdf)

### Inferences
- **Starting anchor.** The meta-analytic remission rate with prior medication failure is ~48% (Heijnen), and the response rate is ~58% (Haq). Real-world TRD samples run lower: 31–45% remission and 54–59% response.
- **Factors pushing this patient below the anchor:**
  - A ~10-year episode, far beyond the 14-month non-responder mean.
  - Failure of all antidepressant classes, which puts them at the top of DM-TRD/MSM-type scales.
  - Young age; its effect is largely mediated by symptom profile, but young samples show ~25–40% remission.
  - No psychosis.
  - Prior rTMS failure (weak evidence; n=17).
- **Factors pushing up:** prominent psychomotor retardation, a "core depression" feature that is the best-validated favorable symptom predictor. The absence (if true) of comorbid personality disorder, severe anxiety, substance use, and benzodiazepine use would also help.
- **Estimate.** Combining these, response ≈35–55% and remission ≈20–40%, with central estimates ≈45% response and ≈30% remission. This is a judgement synthesis, not a model output. Because R² is only ~19%, actual outcome cannot be well predicted for any individual.
- **"Long episode" vs "recurrent."** If the 10 years are actually recurrent episodes with a current episode of, say, <1–2 years, the duration penalty is smaller. Clarifying current-episode length matters.
- **Path after non-response.** Non-response to an initial RUL course is not the end of ECT options: a second bilateral course remits 40–60% of non-responders. That route carries more retrograde amnesia, which matters to someone protective of cognition.

### Gaps
- No meta-analysis specifically quantifies ECT outcome after rTMS failure. Only small case series exist (Dannon 2001, n=17), and the "several small-scale studies" cited by Yuan 2020 were not retrieved.
- No studies isolated ECT outcome in patients with a ≥10-year current episode. The episode-duration evidence is mostly in months.
- Atypical features as a predictor of ECT response were not found in retrieved sources.
- The specific Feske 2004 / Newton-Howes 2014 personality-disorder effect sizes were not retrieved. Only the DEC model and secondary mentions confirm the direction.
- The Heijnen 2019 J Psychiatr Res numbers come from the thesis version; the journal full text was not retrieved.

---

## 2. Predictors of cognitive side effects and whether high cognitive reserve is protective

### Takeaway
**Short-term effects.** Objective cognitive effects of modern ECT are concentrated in the first ~3 days. Most domains return to, or exceed, baseline within weeks to 6 months.

**Lasting effects.** The main durable risk is retrograde autobiographical amnesia for events around the treatment period. This is driven chiefly by technique: bilateral placement, sine wave, and number of bilateral sessions.

**Patient factors.**
- Higher premorbid IQ, education, occupational attainment, and baseline cognition are consistently associated with less retrograde amnesia and faster reorientation. This is relevant to an academically strong patient.
- Younger age predicts better long-term cognitive outcome. However, a 2024 Dutch study found younger patients show a larger acute drop on fluency and verbal recall, because they start from a more intact baseline.
- Long post-ictal reorientation time during the course is the best early-warning marker.

### Cited Findings

**Objective cognition over time**
- Semkovska & McLoughlin 2010 (Biol Psychiatry 68:568–77; 84 studies; N=2,981): "cognitive abnormalities associated with ECT are mainly limited to the first 3 days posttreatment… After 15 days, processing speed, working memory, anterograde memory, and some aspects of executive function improve beyond baseline levels." — [PubMed 20673880](https://pubmed.ncbi.nlm.nih.gov/20673880); [Psychiatric Times summary](https://www.psychiatrictimes.com/view/cognitive-effects-ect-tolerability-versus-safety)
- Loef et al. 2024 (J Affect Disord; DEC; n=634; 5 sites):
  - Directly after ECT, only verbal fluency (animal d −0.25; letter d −0.29) and verbal recall (d −0.26) declined.
  - At 3 and 6 months, performance in all domains improved, "even outperforming baseline levels."
  - "No other pre-treatment factor than a younger age predicted a larger deterioration… shortly after ECT." The authors attribute this to "more intact cognitive functioning prior to ECT."
  - The models' R² was low (0.02–0.08).
  - Source: [Loef 2024 PDF](https://dutchectconsortium.nl/wp-content/uploads/2024/01/1-s2.0-S0165032724000594-main.pdf)
- A Dutch longitudinal case-control study of bilateral ECT (48 patients) found transient deficits in verbal memory/learning and fluency, with "none of the cognitive domains… showing persisting impairments" at 6 months. Attrition was high and autobiographical memory was not assessed. — [Amsterdam UMC PDF](https://pure.amsterdamumc.nl/ws/portalfiles/portal/225199356/Immediate-and-long-term-effects-of-bilateral-electroconvulsive-therapy-on-cognitive-functioning-in-patients-with-a-depre.pdf)

**Persistent retrograde amnesia and its drivers (community practice)**
- Sackeim et al. 2007 (Neuropsychopharmacology 32:244–54; 347 patients; 7 New York facilities):
  - Bilateral ECT produced "more severe and persisting retrograde amnesia" than RUL. At 6 months, the amount of retrograde amnesia increased linearly with the number of bilateral treatments, but was unrelated to the number of RUL or bifrontal treatments.
  - Sine wave stimulation caused slowed reaction time at 6 months.
  - 38/306 (12.4%) met criteria for "marked and persistent retrograde amnesia." Of a variety of factors, "only receipt of BL treatment distinguished" this group, and 81.6% of it was women.
  - "Advancing age, lower premorbid intellectual function, and female gender were associated with greater cognitive deficits." The authors interpret the premorbid-IQ finding as suggesting that "individuals with greater premorbid abilities can better compensate."
  - Source: [Sackeim 2007](https://doi.org/10.1038/sj.npp.1301180) (full text mirror: [ectresources PDF](http://www.ectresources.org/ECTscience/Sackeim_et_al__2007___AAA___Long-term_memory_and_cognitive_dysfunction_____Bilateral_worse_.pdf))
- A second high-dose bilateral course after non-response produced greater retrograde amnesia at 2 and 6 months. — [PubMed 32585354](https://pubmed.ncbi.nlm.nih.gov/32585354/)

**Cognitive reserve / premorbid ability**
- Legendre et al. 2003 (J Neuropsychiatry Clin Neurosci; n=50; bilateral ECT): after 3 treatments, the high cognitive-reserve group (defined by education and occupation) forgot significantly less on delayed story recall than the low-reserve group (p<0.01). The groups did not differ at baseline. — [Legendre 2003](https://www.psychiatryonline.org/doi/10.1176/jnp.15.3.333)
- Massaneda-Tuneu, Loo & Martin 2024 (n=24): patients with higher combined education and occupation had less retrograde amnesia (AMI-SF consistency, P<0.05) and faster recovery of orientation (P=0.009). There was no difference in anterograde memory, fluency, or speed. — [Massaneda-Tuneu 2024](https://exa.ai/library/publication/4hs2t41h7v8)
- Martin, Gálvez & Loo 2015 (Int J Neuropsychopharmacol 18:pyv067):
  - Time to reorientation after ECT 6 was the strongest predictor of retrograde autobiographical memory change.
  - Baseline cognitive status (MMSE, "a proxy for cognitive reserve"), predicted premorbid IQ, electrode placement, pulse width, and anaesthetic type predicted reorientation time.
  - Unexpectedly, premorbid IQ was also directly associated with longer reorientation at ECT 3.
  - Source: [PMC4675978](https://pmc.ncbi.nlm.nih.gov/articles/PMC4675978/)
- Sobin et al. 1995 (cited in Martin 2015): patients with the longest reorientation times had the poorest retrograde autobiographical memory at 1 week and 2 months. — [PMC4675978](https://pmc.ncbi.nlm.nih.gov/articles/PMC4675978/)
- Brain reserve (Mathiassen et al. 2025, Frontiers; small sample): larger baseline cortical thickness of the right parahippocampal gyrus (r=0.517) and left ventrolateral PFC (r=0.530) correlated with less autobiographical-memory decline. Unexpectedly, a smaller right hippocampus did too (r=−0.416). This is preliminary. — [Frontiers 2025](https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2025.1699102/full)

**Young patients**
- Luccarelli et al. (n=424; age 16–30): MoCA went from 26.7 to 25.6 after 10 treatments, measured 48–72 h post-treatment. Only baseline MoCA predicted follow-up MoCA; age did not. The authors note baseline MoCA was already below population norms, possibly reflecting depression. — [PMC8669295](https://pmc.ncbi.nlm.nih.gov/articles/PMC8669295/)
- Dutch J ECT 2024: subjective cognitive impairment was reported less often in young patients (56.3%) than older adults (80.5%; P=0.001), even though 77.2% of the young received bitemporal ECT. The mean MMSE change was negligible. — [J ECT 2024](https://journals.lww.com/ectjournal/fulltext/2024/09000/a_multicenter_retrospective_chart_review_on_the.2.aspx)
- Swedish national adolescent cohort: a deterioration of memory compared with pre-treatment was reported in 6 of 105 patients. — [PMC10682289](https://pmc.ncbi.nlm.nih.gov/articles/PMC10682289)

**Subjective cognition**
- Semkovska et al. 2023 (ANZJP 57:21–33; 72 studies; n=5,699):
  - 48.1% of patients report cognitive complaints after ECT.
  - Pre–post subjective memory improved substantially on the Squire scale (g=0.81) but worsened slightly on 1-item scales (g=−0.48).
  - Improvement in depression correlated with reduction in complaints (r=0.46).
  - Source: [SDU record](https://portal.findresearcher.sdu.dk/en/publications/subjective-cognitive-complaints-and-subjective-cognition-followin/)

**Medications**
- CANMAT 2023: benzodiazepines and anticonvulsants may interfere with ECT efficacy. Lithium and cannabis may worsen cognitive side effects and "should be discontinued or held before ECT." Acute effects (disorientation, anterograde amnesia for events around the treatment period) "typically resolve within days to weeks." — [CANMAT 2023, PMC11351064](https://pmc.ncbi.nlm.nih.gov/articles/PMC11351064)

**Number of sessions**
- Higher treatment resistance predicted more sessions (16 vs 13) and more switches to bilateral placement. Rovers et al. note that more sessions and bilateral placement increase cognitive side effects. — [Rovers 2023](https://exa.ai/library/publication/4ks3g7zrfd7)

**Dementia**
- Osler et al. 2018 (Lancet Psychiatry; n=168,015 Danish patients; 5,901 with ECT):
  - ECT was not associated with dementia in patients aged <50 (age-adjusted HR 1.51, 95% CI 0.67–3.46).
  - Overall, after accounting for competing mortality, the subdistribution HR was 0.98 (0.76–1.26).
  - Only 0.1% of patients aged 10–49 developed dementia over a median 4.9 years.
  - Source: [Osler 2018](https://www.thelancet.com/journals/lanpsy/article/PIIS2215-0366(18)30056-7/abstract)

### Inferences
- **Patient-level risk factors.** For this patient (young, likely high premorbid IQ, high education), the established factors for persistent deficits — older age, lower premorbid IQ, low baseline cognition — mostly point toward lower risk of lasting impairment.
- **Two caveats:**
  - Female sex, if applicable, was overrepresented in persistent amnesia. This was likely a dosing-relative-to-seizure-threshold artifact of 2001-era practice.
  - Younger patients show a larger acute dip on fluency and recall, simply because they have more to lose from a higher baseline. They should expect a noticeable but temporary drop during the course.
- **Technique is the biggest controllable lever.** It matters more than patient factors: RUL brief-pulse, titrated dosing, avoiding bilateral or extended bilateral courses. Higher treatment resistance tends to lead to longer courses and bilateral switches, which raise risk for this specific patient.
- **No reliable figure for permanent memory loss under modern RUL technique.** The 12.4% "marked and persistent retrograde amnesia" rate comes from 2001-era community practice that included sine wave and frequent bilateral ECT. It should be treated as an upper bound, not a modern RUL estimate. Gaps for events near the treatment period (weeks to a few months before and during) should be expected and may be permanent for some events.
- **Monitoring during the course.** Reorientation time after early sessions (ECT 3–6) is a practical warning signal. If it is long, the patient can ask the team to adjust technique.
- **Brain fog is part of the baseline.** Because subjective cognition after ECT tracks mood improvement (r=0.46), a responder's perceived "brain fog" may improve. A non-responder is more likely to perceive ECT as having worsened cognition.

### Gaps
- No modern study gives a validated individual-level probability of permanent autobiographical memory loss under RUL brief-pulse ECT in young, high-IQ patients.
- The Sobin 1995 primary paper was not retrieved; its findings come via secondary citation.
- No studies were found of medical students or similarly high-cognitive-demand individuals with formal long-term (>1 year) neuropsychological follow-up after ECT.
- Effects of concomitant medications other than those named in CANMAT (e.g., anticholinergics, sedating antipsychotics) on ECT cognitive outcomes were not retrieved.

---

## 3. Cognitive and brain cost of depression itself, and long-term consequences of chronic untreated depression (cognition, hippocampus, career, dementia)

### Takeaway
Depression itself produces moderate cognitive deficits (d ≈ −0.34 to −0.65). Executive and attention deficits persist into remission (d ≈ −0.52 to −0.61), and memory deficits worsen with each additional episode. Hippocampal volume loss tracks cumulative days depressed, especially untreated days, and early-onset/recurrent illness. Depression diagnosed at age 18–44 is associated with a ~3-fold dementia hazard decades later. ECT itself shows no dementia signal. For someone with ~10 years of illness, "doing nothing" is not cognitively neutral.

### Cited Findings
- Rock et al. 2014 (Psychol Med 44:2029–40; CANTAB meta-analysis):
  - Patients with current depression showed moderate deficits in executive function, memory, and attention (d −0.34 to −0.65).
  - In remitted patients, executive and attention deficits persisted (d −0.52 to −0.61). Memory deficits were small to moderate and non-significant (d −0.22 to −0.54).
  - Source: [Rock 2014](https://www.cambridge.org/core/journals/psychological-medicine/article/abs/cognitive-impairment-in-depression-a-systematic-review-and-metaanalysis/0EE176727AC50D44326A3D8DF2AB88A7)
- Semkovska et al. 2019 (Lancet Psychiatry 6:851–61; 252 studies; 11,882 remitters):
  - Significant deficits after remission in 55/75 (73%) cognitive variables. Most were small (40%) or medium (29%).
  - Long-term memory deficits were large: logical memory immediate g=−0.81, delayed g=−0.88.
  - Number of previous episodes explained heterogeneity in most variables. Deficits "worsen with repeated episodes."
  - Intellectual function unconstrained by speed was preserved.
  - Source: [Semkovska 2019](https://www.thelancet.com/journals/lanpsy/article/PIIS2215-0366(19)30291-3/abstract)
- Loef 2024 (DEC): at 3 and 6 months after ECT, cognitive performance across all domains exceeded pre-ECT baseline. The authors suggest this confirms "the association between symptom severity in MDE and cognitive" function. — [Loef 2024](https://dutchectconsortium.nl/wp-content/uploads/2024/01/1-s2.0-S0165032724000594-main.pdf)
- Semkovska & McLoughlin 2010: 15+ days after ECT, processing speed, working memory, anterograde memory, and some executive functions improve beyond baseline. — [PubMed 20673880](https://pubmed.ncbi.nlm.nih.gov/20673880)

**Hippocampus**
- Sheline et al. 1996 (PNAS): in remitted women, left hippocampal volume correlated with total days depressed (r=−0.65). — [Sheline 1996](https://www.pnas.org/doi/10.1073/pnas.93.9.3908)
- Sheline et al. 1999 (J Neurosci; 24 women): total days depressed correlated with hippocampal volume (r=−0.60, p=0.002), but age did not. Post-depressed women had lower verbal memory scores. — [Sheline 1999](https://www.jneurosci.org/content/19/12/5034)
- Sheline et al. 2003 (Am J Psychiatry 160:1516–8; n=38): untreated days depressed predicted hippocampal volume (R²≈0.28, p=0.0006). Days depressed while on antidepressants did not. — [Sheline 2003](https://www.psychiatryonline.org/doi/full/10.1176/appi.ajp.160.8.1516)
- ENIGMA (Schmaal et al., Mol Psychiatry; 1,728 MDD vs 7,199 controls):
  - Hippocampal volume overall d=−0.14 (−1.24%), driven by recurrent MDD (d=−0.17) and onset ≤21 years (d=−0.20, −1.85%).
  - No difference in first-episode patients.
  - Source: [ENIGMA](https://www.nature.com/articles/mp201569)
- The Videbech & Ravnkilde 2004 meta-analysis found inconsistent duration correlations across studies. Number of episodes correlated with right-hippocampal volume reduction. — [Videbech 2004](https://psychiatryonline.org/doi/10.1176/appi.ajp.161.11.1957)

**Dementia**
- Elser et al. 2023 (JAMA Neurology; 246,499 with depression vs 1,190,302 controls; Denmark 1977–2018):
  - Dementia HR 2.41 (2.35–2.47) overall.
  - HR 3.08 (2.64–3.58) when depression was diagnosed at age 18–44.
  - The association persisted 20–39 years after diagnosis (HR 1.79).
  - Recurrent inpatient hospitalizations were associated with increasing risk.
  - Source: [Elser 2023](https://jamanetwork.com/journals/jamaneurology/fullarticle/2807208)
- Osler 2018: ECT not associated with increased dementia risk (competing-risk SHR 0.98). — [Osler 2018](https://www.thelancet.com/journals/lanpsy/article/PIIS2215-0366(18)30056-7/abstract)

**Career / occupational cost**
- Nordenskjöld et al. 2013 (Nord J Psychiatry 67:326–33; n=394 Swedish ECT patients): a longer duration of sick leave before ECT independently predicted slower return to occupational functioning. The authors suggest that sick-leave time "might be reduced if ECT is initiated within the first 3 months of sick leave." — [PubMed 23228156](https://pubmed.ncbi.nlm.nih.gov/23228156)
- Putman 2024 (Psychiatr Res Clin Pract, opinion): labeling cases as treatment-resistant "threatens to worsen prognosis by unnecessarily extending the length of an index or recurrent episode, and increases the risk of death and burden of disease by prolonging categorical and functional impairments." — [Putman 2024](https://www.psychiatryonline.org/doi/full/10.1176/appi.prcp.20240073)

### Inferences
- **Brain fog is expected from the illness.** The patient's "heavy brain fog" and psychomotor slowing are consistent with the cognitive profile of depression itself: slowed processing speed, attention, and memory.
- **This baseline deficit already exceeds ECT's typical acute effect.** The documented baseline deficit (d ≈ −0.3 to −0.9) is comparable to or larger than ECT's typical acute decrements (d ≈ −0.25 to −0.29 on fluency and recall), which are transient.
- **Expected effect of a successful course.** It would likely leave measured cognition at or above current baseline within weeks to months. Some depression-related deficits may persist into remission (Rock; Semkovska 2019).
- **Cost of continued illness.** Continued untreated or unremitted depression is associated with cumulative deficits that grow with episodes, hippocampal volume loss proportional to days depressed, and a ~3-fold dementia hazard for early-life depression. All of these are associations, not proven causal effects.
- **The comparison is not "cognitive risk vs no risk."** It is a bounded, mostly transient, technique-dependent ECT risk vs an ongoing, cumulative depression-associated cognitive burden.

### Gaps
- Snyder 2013 (Psychol Bull) executive-function meta-analysis effect sizes were not retrieved and are not cited here.
- No retrieved study directly compares long-term cognition in matched TRD patients who did vs did not receive ECT over ≥5 years.
- No quantitative data were found on career or earnings loss specifically attributable to chronic TRD in young adults or medical trainees.
- The causal direction of hippocampal and dementia associations (scar vs vulnerability) is unresolved, as ENIGMA acknowledges.

---

## 3b. Mortality and suicide risk of chronic TRD, and evidence that ECT reduces suicide or all-cause mortality

### Takeaway
Two large propensity-matched cohorts (Ontario 2022; Sweden 2021) associate ECT with ~28–47% lower suicide risk in the year after hospitalization, and with lower all-cause mortality. A VA risk-matched study found no reduction. In the Swedish data, the benefit was absent in patients ≤44 years (HR 1.22, NS). For a young outpatient, the suicide-prevention argument for ECT is therefore real but uncertain in magnitude. ECT carries very low medical risk.

### Cited Findings
- **Kaster et al. 2022** (Lancet Psychiatry; Ontario):
  - Population: 67,327 psychiatric hospitalizations for depression, 4,982 with ECT; mean age 45.1.
  - ECT was associated with lower suicide death within 365 days (csHR 0.53, 95% CI 0.31–0.92) and lower all-cause mortality (0.75, 0.58–0.97), but not non-suicide death (0.83, 0.61–1.12).
  - Crude suicide rates were 5.84 vs 7.26 per 1,000 person-years. The reduction was more pronounced in unipolar depression.
  - Sources: [ICES abstract](https://www.ices.on.ca/publications/journal-articles/risk-of-suicide-death-following-electroconvulsive-therapy-treatment-for-depression-a-propensity-score-weighted-retrospective-cohort-study-in-canada/); [Psychiatric News](https://www.psychiatryonline.org/doi/10.1176/appi.pn.2022.09.7.20)
- **Rönnqvist et al. 2021** (JAMA Netw Open 4:e2116589; Sweden):
  - Population: 28,557 inpatients; 5,525 matched pairs.
  - Suicide within 12 months was 1.1% with ECT vs 1.6% without (HR 0.72, 0.52–0.99).
  - Benefit was concentrated in psychotic features (HR 0.20), age 45–64 (HR 0.54), and age ≥65 (HR 0.30). There was no benefit at age ≤44 (HR 1.22, 0.68–2.16).
  - Source: [PMC8295734](https://pmc.ncbi.nlm.nih.gov/articles/PMC8295734)
- Carlat's summary of Rönnqvist reports all-cause mortality lower with ECT at 3 months (0.7% vs 2.9%) and 12 months (1.7% vs 4.3%), and no benefit for moderate depression (p=0.8). This is a secondary source. — [Carlat Report](https://www.thecarlatreport.com/articles/print/4348-electroconvulsive-therapy-and-risk-of-suicide-in-major-depression)
- A JAMA Netw Open commentary notes that the ECT benefit was reduced after controlling for lithium use during follow-up, which was more common in the ECT group. — [JAMA Netw Open commentary](https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2782146)
- **Peltzman, Shiner & Watts 2020** (J ECT 36:187–92; VA):
  - Population: 14,810 ECT patients vs 58,369 risk-matched controls.
  - The adjusted odds of suicide in the year after ECT did not differ (OR 1.31, 0.94–1.96; unadjusted 1.56). The authors interpret the elevated crude risk as reflecting the selection of high-risk patients for ECT.
  - The PDF is hosted on a plaintiff law-firm site, but its content matches the journal abstract.
  - Source: [Peltzman 2020 PDF](https://www.wisnerbaum.com/wp-content/uploads/52.-Peltzman-et-al.2020-Effects-of-Electroconvulsive-Therapy-on-short-term-suicide-mortality.pdf)
- **Kaster et al. 2021** (Lancet Psychiatry; 5,008 matched pairs): serious medical events within 30 days were 0.25 vs 0.33 per person-year (csHR 0.78, 0.61–1.00), showing no increased medical risk. Suicide was lower in the ECT group (≤5 vs 11 deaths). — [Kaster 2021](https://www.thelancet.com/journals/lanpsy/article/PIIS2215-0366(21)00168-1/abstract)
- ECT mortality is estimated at ~1 per 10,000 patients. No deaths occurred in 73,440 VA treatments from 1999 to 2010. This is a secondary source. — [Psychiatric Times](https://www.psychiatrictimes.com/view/cognitive-effects-ect-tolerability-versus-safety)

### Inferences
- The best data come from hospitalized, often older or psychotic patients. In the Swedish analysis, the ≤44-year subgroup showed no suicide benefit, and the VA risk-matched analysis showed none overall. For this young outpatient, a mortality benefit should not be assumed as the main argument for ECT.
- The more defensible argument for this patient is functional and cognitive: the cost of continued depression to cognition and life trajectory.
- If the patient has current suicidal ideation, the calculus shifts toward ECT, and lithium (anti-suicidal) becomes relevant for continuation.

### Gaps
- Suicide and all-cause mortality rates specific to chronic TRD cohorts (e.g., Swedish or Dutch TRD registers) were not retrieved, so the absolute risk this patient faces from continued TRD cannot be quoted.
- No randomized evidence exists on ECT and suicide.
- The Watts et al. 2022 J Clin Psychiatry VA follow-up ("ECT and Death by Suicide") was seen only via a critic site and not verified.

---

## 4. Relapse after ECT and implications for someone who has failed all medications

### Takeaway
Relapse is the Achilles heel of ECT.
- **Without continuation therapy:** about half of responders relapse within 3 months, and ~78–84% within 6 months on placebo.
- **With modern continuation pharmacotherapy:** relapse is ~38% at 6 months and ~51% at 12 months.
- **Best-evidenced strategies:** nortriptyline + lithium (39% at 24 weeks) and continuation ECT (37% at 6 months), ideally combined with medication.

For a patient who has failed all antidepressants, the plan cannot be "go back to the failed meds." A pre-planned continuation strategy should be agreed before starting the acute course, most plausibly lithium-based pharmacotherapy and/or tapered continuation ECT. No controlled data exist for rTMS or ketamine as post-ECT maintenance.

### Cited Findings
- **Jelovac, Kolshus & McLoughlin 2013** (Neuropsychopharmacology 38:2467–74; 32 studies):
  - Relapse on continuation pharmacotherapy: 37.7% at 6 months (95% CI 30.7–45.2%) and 51.1% at 12 months (44.7–57.4%); 27.1% at 3 months; 50.4% at 2 years.
  - Continuation ECT: 37.2% at 6 months. Continuation ECT alone without medication: 45.4%. Continuation ECT plus medication: 20.5% at 12 months (n=33; very wide CI).
  - Antidepressants vs placebo: RR 0.49 (NNT 3.3), mostly from tricyclic trials.
  - "In early trials where no continuation therapy was permitted, half of all patients who responded to ECT relapsed within 3 months."
  - Continuing the same medications that failed before ECT is "a counterintuitive strategy," and no evidence was found that it works.
  - Source: [PMC3799066](https://pmc.ncbi.nlm.nih.gov/articles/PMC3799066/)
- The Evidence-Based Mental Health abstract of Jelovac reports a 6-month relapse rate on placebo of 78% (95% CI 66.1–86.5%; 4 studies; n=65). — [EBMH abstract (mirror)](https://d.docksci.com/review-maintenance-antidepressants-reduce-risk-of-relapse-in-the-6-months-follow_5b0a4d57d64ab28e393873c7.html)
- **Sackeim et al. 2001** (JAMA 285:1299–307; n=84 remitters): over 24 weeks, relapse was 84% on placebo, 60% on nortriptyline, and 39% on nortriptyline + lithium. — [PubMed 11255384](https://pubmed.ncbi.nlm.nih.gov/11255384)
- **Kellner et al. 2006, CORE** (n=184 remitters after bilateral ECT): relapse was 37.1% with continuation ECT (10 sessions over ~5–6 months) vs 31.6% with nortriptyline + lithium, a non-significant difference. — [Rovers 2026 review, PMC12835720](https://pmc.ncbi.nlm.nih.gov/articles/PMC12835720/)
- **Rovers, van Zeijl & van Eijndhoven 2026** (BJPsych Open 12:e37; systematic review; 28 studies; N=11,119):
  - Lithium (alone or with antidepressants) was "most consistently associated with reduced relapse" (10 studies).
  - Continuation ECT plus pharmacotherapy also reduced relapse.
  - Psychotherapy evidence is limited to 2 studies, and "no studies on rTMS or ketamine were found."
  - One study found that no prior medication resistance (along with psychosis and greater severity) predicted lower relapse, limited to the nortriptyline arm.
  - Source: [PMC12835720](https://pmc.ncbi.nlm.nih.gov/articles/PMC12835720/)
- McCall 2004: 37% of ECT responders relapsed within the first month after ECT. — [McCall 2004, BJP](https://www.cambridge.org/core/journals/the-british-journal-of-psychiatry/article/quality-of-life-and-function-after-electroconvulsive-therapy/F6DADA0B841BBC01B728F274FF43F9E2)
- A typical maintenance ECT taper is weekly ×4, then every 2 weeks ×4, then every 3 weeks ×4, then monthly, with "no limit" on duration if effective. — [MUSC Health](https://muschealth.org/medical-services/behavioral-health/brain-stimulation/ect)
- Maintenance rTMS case series (Noda et al. 2013; n=6; ages 27–58): 5/6 maintained response for 6–13 months after acute plus continuation ECT. This is uncontrolled. — [Frontiers 2013](https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2013.00073/full)
- Anecdote: Kitty Dukakis receives maintenance ECT every 7–8 weeks and reports "minor memory lapses." Her psychiatrist describes depression as "a chronic and recurring illness that requires good lifetime management." — [Seattle Times / NYT](https://www.seattletimes.com/nation-world/michael-kitty-dukakis-emerge-as-evangelists-for-shock-therapy/)

### Inferences
- **Highest-risk relapse profile.** This patient's profile — failed all antidepressants, long episode, no psychosis — is the one with the highest expected relapse risk. A reasonable expectation is ≥50% relapse within 12 months even with continuation therapy, unless continuation ECT and/or lithium-based therapy is used.
- **Lithium matters here.** If lithium has never been tried, it is both the best-evidenced post-ECT continuation agent and an anti-suicidal agent. Its absence from the history is decision-relevant: see Section 7, and see Section 2 on holding it during the acute course because of cognitive side effects.
- **Continuation ECT has cognitive cost.** It extends exposure, though at much lower frequency. The cognitive cost of maintenance schedules (e.g., monthly) must be weighed against relapse.
- **Prepare a plan in advance.** The acute course should be framed as phase 1 of a 6–12-month plan, with the continuation strategy chosen before the first session.

### Gaps
- The PRIDE trial (Kellner 2016) numbers were not retrieved and are not cited. PRIDE enrolled older adults only, so it is of limited direct relevance.
- The Lambrichts et al. lithium meta-analysis effect sizes were not retrieved; it is known here only via the Rovers 2026 review.
- No controlled data exist on ketamine/esketamine or rTMS as post-ECT relapse prevention, per Rovers 2026.

---

## 5. Real-world functional, quality-of-life, academic, and career outcomes after ECT

### Takeaway
Quality of life is very poor before ECT and improves substantially afterward, with large effect sizes (SF-36 mental component g≈1.28). Patients with sustained remission reach general-population norms. Function lags symptoms by weeks to ~3 months, and return to work typically takes a few months (71% within 1 year among those on temporary sick leave). There are no systematic data on medical students, physicians, or academic performance after ECT. Public accounts (a Yale surgeon; a former First Lady) are positive, and at least one physician's account is negative. These are anecdotes only.

### Cited Findings
- **McCall, Dunn & Rosenquist 2004** (BJP 185:405–9; n=77): all quality-of-life and function outcomes improved at 2 and 4 weeks after ECT. IADL improvement related to improvement in global cognition (MMSE), and quality of life related to mood. A minority had worse scores, and these patients had less mood improvement and greater retrograde memory decrements. — [McCall 2004](https://www.cambridge.org/core/journals/the-british-journal-of-psychiatry/article/quality-of-life-and-function-after-electroconvulsive-therapy/F6DADA0B841BBC01B728F274FF43F9E2)
- **McCall et al. 2006** (J Affect Disord 90:269–74; community sample, n≈283): at 24 weeks, 78% had improved quality of life. SF-36 scores changed as follows:
  - vitality 20.4 → 40.1
  - social functioning 22.8 → 55.2
  - role-emotional 6.4 → 42.8
  - Source: [Wake Forest release](https://newsroom.wakehealth.edu/news-releases/2006/02/electroconvulsive-therapy-improves-quality-of-life-for-at-least-six-months); [record](https://exa.ai/library/publication/dlqxfd2g4d7)
- **McCall et al.** (PMID 23158959; effectiveness trial n=286, efficacy trial n=243): baseline SF-36 in ECT patients was lower than in depressed outpatients. "Among sustained remitters, average SF36 scores were no different from normative scores of the general adult population." — [PubMed 23158959](https://pubmed.ncbi.nlm.nih.gov/23158959/)
- An HRQoL meta-analysis (J ECT 2018; 4 studies) found SF-36 MCS g=1.28 and PCS g=0.97. Remitters improved more, and age did not moderate the improvement. — [PubMed 29461332](https://pubmed.ncbi.nlm.nih.gov/29461332/)
- In Lin & Yang 2017 (n=130), functioning improved more slowly than symptoms during acute ECT. McCall's reply cites earlier work showing that function "was not optimized until up to 3 months later" and was superior to medication-treated patients. — [PMC5492785](https://pmc.ncbi.nlm.nih.gov/articles/PMC5492785/); [McCall comment PMC5737640](https://pmc.ncbi.nlm.nih.gov/articles/PMC5737640/)
- **Nordenskjöld et al. 2013** (n=394; Sweden):
  - 71% of those on non-permanent sick leave regained occupational functioning within 1 year; it "usually takes a few months even in symptomatically improved patients."
  - Slower return was associated with longer pre-ECT sick leave, less complete improvement, benzodiazepines after ECT, and substance dependence.
  - Source: [PubMed 23228156](https://pubmed.ncbi.nlm.nih.gov/23228156)
- A Canadian community 2-year chart review (n=90) found 56.6% rated "much" or "very much improved" at 24 months, with psychosocial and occupational functioning improving across follow-up. — [Can J Psychiatry 2007](https://journals.sagepub.com/doi/10.1177/070674370705200908)
- Young people (16–25; n=190): ECT was associated with improvement in all 5 BASIS-24 domains by session 5, including depression/functioning (−0.84, p<0.001). — [Benson et al. 2019, PMC6581623](https://pmc.ncbi.nlm.nih.gov/articles/PMC6581623/)
- Analog only, not ECT: in a first-episode psychosis program, 56% of college students on leave returned to college, with a median of 18 months, and affective-psychosis patients returned faster (median 12 months). — [Shinn et al. 2020](https://exa.ai/library/publication/2pnyq4jxy64)

**Anecdotes (not evidence)**
- Sherwin Nuland (Yale surgeon and author), TED 2007: hospitalized in 1973 and considered for lobotomy, he received 20 ECT treatments. Response began around treatment 9–10. He "resuscitated the career, even better than it had been before. Went right back into the university and began to write books." He notes occasional residual low mood. — [TED talk](https://www.youtube.com/watch?v=oEZrAGdZ1i8)
- Kitty Dukakis: began ECT in 2001 at 64 after ~17 years of failed treatments, and receives maintenance ECT. She describes "some slight memory stuff," e.g., occasionally needing directions on a familiar route. Michael Dukakis: "I can't support the notion that you try everything else before you try ECT. Those 17 years… were brutal." — [NPR 2017](https://www.npr.org/2017/01/17/510204486/kitty-dukakis-electroshock-therapy-has-given-me-a-new-lease-on-life); [Seattle Times / NYT](https://www.seattletimes.com/nation-world/michael-kitty-dukakis-emerge-as-evangelists-for-shock-therapy/)
- Counter-anecdote: a physician, Dr. Barrie Baker, said: "After the first time, I couldn't remember the season or the year… I don't know if I've ever fully recovered." — [Boston.com / NYT](https://www.boston.com/news/local-news/2017/01/01/kitty-dukakis-beneficiary-of-electroshock-therapy-emerges-as-its-leading-evangelist/)

### Inferences
- **What a responder can expect.** Clear quality-of-life gains within weeks, but full occupational or academic function may take ~3 months after the course. Planning should assume a "symptoms first, function later" lag.
- **Remission vs partial response matters a great deal** for functional normalization (SF-36 norms were reached only among sustained remitters).
- **No data relevant to medical school.** The absence of data on medical trainees means the decision has to rest on general-population functional data plus individual cognitive monitoring.

### Gaps
- No studies were found of medical students, residents, physicians, or other high-cognitive-demand professionals as cohorts after ECT, nor any quantitative data on academic performance (grades, exam scores, degree completion) after ECT.
- No long-term (>2 year) employment or earnings data after ECT were retrieved.
- McCall 2013's exact journal citation was not verified beyond the PubMed ID.

---

## 6. Practical considerations for a future medical student (time off, driving, timing, licensing/disclosure)

### Takeaway
An acute course is typically 6–12 (sometimes up to ~20) sessions at 2–3 per week over ~3–4+ weeks. In CORE, 65% of remitters remitted by session 10. Driving is usually prohibited during the course and for ~1–2 weeks (sometimes up to a month) afterward. Function lags symptoms, and relapse risk peaks in the first 6 months. A sensible plan therefore places the course well before high-stakes cognitive demands (MCAT, matriculation, exams), with a recovery and consolidation buffer of ~3–6 months. US licensing barriers are falling: as of May 2026, 44 medical licensure boards had verified their applications are free of intrusive mental-health questions.

### Cited Findings
- **Schedule:**
  - "An acute series is usually 3 treatments a week for 6 to 12 treatments." Patients "are not allowed to drive during the entire ECT course and for 2 weeks after the last treatment"; maintenance patients can drive "except on the day of ECT." — [MUSC Health](https://muschealth.org/medical-services/behavioral-health/brain-stimulation/ect)
  - CORE: 34% remitted by session 6 and 65% by session 10. — [Psychiatric Times](https://www.psychiatrictimes.com/view/speed-response-ect)
  - Swedish adolescents had a median of 7 sessions. — [PMC10682289](https://pmc.ncbi.nlm.nih.gov/articles/PMC10682289)
  - In the Dutch cohort, high-TRD patients averaged 16±7 sessions vs 13±6 for low-TRD. — [Rovers 2023](https://exa.ai/library/publication/4ks3g7zrfd7)
- **Driving and work:**
  - Mayo Clinic advises not returning to work, making important decisions, or driving "until one to two weeks after the last ECT in a series." — [Mayo Clinic](https://www.mayoclinic.org/tests-procedures/electroconvulsive-therapy/about/pac-20393894)
  - UK (RCPsych/DVLA): no driving during a course; fitness afterward is decided with the DVLA. For maintenance ECT, no driving for at least 48 h after each treatment; ECT is usually given twice weekly. — [RCPsych](https://www.rcpsych.ac.uk/mental-health/treatments-and-wellbeing/ect)
  - UCLA: no driving until treatments are down to once every two weeks, with physician clearance. — [UCLA Health](https://www.uclahealth.org/hospitals/resnick/patient-care/electroconvulsive-therapy-ect/preparing-your-outpatient-ect)
- **Memory for the treatment period:** CANMAT 2023 notes "anterograde amnesia for events surrounding the treatment period" and potential retrograde amnesia for events before ECT. — [CANMAT 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC11351064)
- **Recovery timeline:**
  - Function is optimized up to ~3 months post-ECT. — [McCall comment PMC5737640](https://pmc.ncbi.nlm.nih.gov/articles/PMC5737640/)
  - Return to work "usually takes a few months." — [PubMed 23228156](https://pubmed.ncbi.nlm.nih.gov/23228156)
  - Relapse risk is highest in the first 6 months. — [Jelovac 2013](https://pmc.ncbi.nlm.nih.gov/articles/PMC3799066/)
- **Licensing:**
  - Dr. Lorna Breen Heroes' Foundation (May 27, 2026): "As of May 15, 2026… 44 medical licensure boards" (plus dental, nursing, pharmacy, and specialty boards) had verified that their applications exclude "intrusive, stigmatizing mental health and substance use questions." — [Lorna Breen Foundation 2026](https://drlornabreen.org/more-than-3-35-million-health-workers-now-practice-in-states-and-systems-that-support-their-mental-health)
  - The count was 43 boards as of Feb 2025. — [Lorna Breen 2025](https://drlornabreen.org/healthcare-community-makes-it-safer)
  - The AMA page cites the 2018 FSMB Workgroup recommendations and reported 40 medical boards verified as of September 2025. — [AMA](https://www.ama-assn.org/health-care-advocacy/administrative-burdens/are-licensingcredentialing-bodies-required-probe-past)

### Inferences
- **Timing.** A rough planning template is:
  - ~4 weeks of acute course (not driving; reduced capacity for new learning)
  - ~2–4 weeks before driving and demanding work
  - ~3 months for functional recovery
  - continuation treatment through ~6–12 months
  
  The acute course should not overlap with MCAT preparation or the first semester. Material studied during the course is likely to be poorly retained.
- **Licensing exposure.** Treatment received before medical school is rarely the subject of licensing questions. Most remaining questions, and all reformed ones, focus on current impairment. Because state boards vary, the patient should check the specific state's application language when the time comes.
- **Continuation ECT and the school calendar.** If continuation or maintenance ECT is needed, the schedule (e.g., weekly tapering to monthly) and the no-driving-on-treatment-day rule must fit around school. Outpatient scheduling is feasible but requires a driver each time.

### Gaps
- US state-specific driving laws after ECT were not systematically retrieved. Rules are mostly institution-level guidance rather than statute.
- No data were found on medical school (vs licensing board) application questions about mental-health treatment, or on ECT disclosure specifically.
- No source gives evidence-based "minimum buffer before exams." The timing advice above is inferred from functional-recovery and relapse curves.

---

## 7. Diagnostic re-checks before deciding on ECT, and where this patient sits on staging models

### Takeaway
Before concluding "true" TRD, guidelines and reviews stress excluding pseudo-resistance. In one inpatient series, 39% of apparent non-responders had had inadequate trials and then remitted at rates similar to non-resistant patients. The checklist covers:
- inadequate dose or duration
- non-adherence
- unrecognized bipolarity (up to 59% in one tertiary TRD cohort)
- medical contributors (e.g., thyroid)
- substance use
- untried evidence-based steps: lithium augmentation, MAOIs, and second-generation antipsychotic augmentation

On the **Maudsley Staging Method**, this patient likely scores in the moderate-to-severe range (~9–13/15) because of the chronic duration (>2 years = 3 points) and many failures. On **Thase–Rush**, they cannot be Stage IV–V if an MAOI and ECT have not been tried.

### Cited Findings
- **Pseudo-resistance (Italian inpatient series):** among 202 depressed inpatients, 44.5% were non-responders on admission, and 39.3% of these did not meet resistant criteria because of inadequate trials. This "pseudo-resistant" group was younger, had fewer episodes and more personality disorders, and had remission rates comparable to non-resistant patients and greater than truly resistant ones. — [PMC9567005](https://pmc.ncbi.nlm.nih.gov/articles/PMC9567005/)
- **Howes, Thase & Pillinger 2021** (Mol Psychiatry): causes of pseudo-resistance include misdiagnosed bipolar depression, inadequate dose or duration, non-adherence (reported in 10–60% of depressed patients), fast metabolism, and poor absorption. They recommend documenting dose and duration and measuring plasma levels where possible. — [Howes 2021](https://www.nature.com/articles/s41380-021-01200-3)
- **AAFP 2024:**
  - Up to 25% of primary-care patients presenting with depression or anxiety are diagnosed with bipolar disorder.
  - Antidepressant non-adherence is estimated at 46%.
  - TRD prevalence among MDD patients is 31%.
  - Source: [AAFP 2024](https://www.aafp.org/afp/2024/0500/treatment-resistant-depression)
- **Bipolarity in apparent TRD** (BJPsych Advances, 2026):
  - Sharma 2005 found that 59% of tertiary-referral "unipolar TRD" patients met bipolar criteria at follow-up.
  - Danish register (Musliner 2018): 4.3% conversion over ~7 years, with younger onset and psychotic features as predictors.
  - Mean diagnostic delay for bipolar disorder is ~10 years.
  - Source: [BJPsych Advances](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/77591DF60573D8DC3E9E49A1CA0AA6E9/S2056467826102321a.pdf/div-class-title-bipolar-spectrum-disorders-in-apparent-treatment-resistant-depression-diagnostic-pitfalls-and-implications-for-contemporary-psychiatric-practice-div.pdf)
- **Egyptian Psychiatric Association TRD guideline:** recommends hypomania checklist screening and thyroid testing, noting higher remission when hypothyroidism is treated (Kornstein). It also lists medication-induced depression (glucocorticoids) and comorbid anxiety, OCD, and eating, somatic, and personality disorders as contributors. — [Frontiers 2022](https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2022.797150/full)
- **Thase–Rush staging:**
  - Stage I: 1 class failed
  - Stage II: 2 distinct classes failed
  - Stage III: plus a TCA
  - Stage IV: plus an MAOI
  - Stage V: plus bilateral ECT
  - Source: [NCBI Bookshelf table](https://www.ncbi.nlm.nih.gov/books/NBK526364/table/table4/); [Thase slides](https://www.ncpsychiatry.org/assets/2016AnnualMeeting/Handouts/2_treatment_resistant_depression-michael_thase.pdf)
  - Criticism: the model's hierarchy is not evidence-based, though it "implies that MAOIs may be of benefit." — [MSM standardization paper, PMC5896127](https://pmc.ncbi.nlm.nih.gov/articles/PMC5896127/)
- **Maudsley Staging Method (Fekadu 2009):**
  - Duration of current episode: 1–3 points (≤12 months acute; 13–24 months subacute; >24 months chronic = 3)
  - Severity: 1–5 points (subsyndromal to severe with psychosis)
  - Antidepressant failures: 1–5 points
  - Augmentation used: +1
  - ECT used: +1
  - Total 3–15: mild 3–6, moderate 7–10, severe 11–15
  - Sources: [Fekadu 2009](https://www.psychiatrist.com/jcp/multidimensional-tool-quantify-treatment-resistance/); [NCBI table](https://www.ncbi.nlm.nih.gov/books/NBK526364/table/table4/); [Frontiers 2026](https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2026.1769246/full)
  - The MSM has predicted outcome better than Thase–Rush and is validated for predicting functional impairment, time depressed, and lower remission. — [NCBI table](https://www.ncbi.nlm.nih.gov/books/NBK526364/table/table4/); [Frontiers 2026](https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2026.1769246/full)
- **Lithium augmentation:**
  - Bauer & Döpfmer meta-analysis (9 RCTs; n=234): OR 3.31 at adequate dose (≥800 mg or level ≥0.5 mEq/L; ≥2 weeks), NNT 3.7. All studies: OR 3.89, NNT 3.4. — [DARE abstract](https://www.ncbi.nlm.nih.gov/books/NBK67614/)
  - A later meta-analysis (9 trials; n=237): OR 2.89 (1.65–5.05), effective with both TCAs and second-generation antidepressants. — [DARE abstract](https://www.ncbi.nlm.nih.gov/books/NBK291514/)
  - A 2026 bias-adjusted reappraisal (BMJ Mental Health; 56 RCTs) found lithium OR 2.06 (1.30–3.27) in conventional meta-analysis, but non-significant after trial-sequential or PET-PEESE adjustment.
  - Second-generation antipsychotic augmentation had robust evidence (OR 1.53; aripiprazole, quetiapine, brexpiprazole, cariprazine). — [BMJ Ment Health 2026](https://mentalhealth.bmj.com/content/29/1/e302656)
  - CANMAT 2023 lists lithium and T3 as second-line augmentation after aripiprazole and brexpiprazole. — [BMJ Ment Health 2026](https://mentalhealth.bmj.com/content/29/1/e302656)
- **ECT and CANMAT 2023:** the 2023 update covers ECT in detail. Its stated principles: hold benzodiazepines and anticonvulsants, which reduce efficacy, and hold lithium and cannabis, which worsen cognition. — [CANMAT 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC11351064)
- **Earlier ECT gives better outcomes:** less treatment resistance predicts better ECT outcome, and "reserving ECT as 'treatment-of-last-resort'… seems questionable." — [Rovers 2023](https://exa.ai/library/publication/4ks3g7zrfd7)

### Inferences
- **Approximate MSM score for this patient:**
  - Duration 3 (chronic)
  - Severity 3–4 (moderate to severe without psychosis)
  - Antidepressant failures likely 4–5 if more than ~7–10 medications have been tried; the exact cut-points were not verified in retrieved text
  - Augmentation +0/1
  - ECT 0
  - Total ≈ 10–13, i.e., the moderate-to-severe range, consistent with the poor-prognosis end of the ECT-predictor literature.
- **Thase–Rush.** If no MAOI has been tried, this patient is formally Stage III, not IV. Thase–Rush logic and some experts would advise an MAOI trial before or alongside considering ECT. The tradeoff is time: each additional 6–12-week trial lengthens an already ~10-year episode, and episode length itself lowers ECT response.
- **Re-checks especially relevant to this presentation (psychomotor slowing plus "brain fog" plus side-effect sensitivity):**
  - bipolar-spectrum screening with collateral history (antidepressant-induced activation, mixed features, family history)
  - thyroid function
  - review of whether each "failed" antidepressant reached an adequate dose and duration (≥4–6 weeks at minimum effective dose), given side-effect-driven early discontinuation
  - adherence and plasma levels
  - substance or cannabis use
  - sedating co-medications (benzodiazepines also reduce ECT efficacy)
  - medical causes of fatigue and slowing (sleep apnea, anemia, B12; see Gaps)
- **Pseudo-resistance in a side-effect-prone patient.** If "failed all classes" mostly means "could not tolerate adequate doses," the patient may be partly pseudo-resistant. That would argue for re-trials under careful titration, or for ECT on the grounds that it is better tolerated than sequential drug trials. It would not necessarily indicate that ECT is likely to fail.
- **Lithium.** If lithium has never been tried, it matters both as an acute augmentation option and as the best-evidenced post-ECT continuation agent. It should be held during the acute ECT course because of cognitive side effects.

### Gaps
- Specific prevalence data for obstructive sleep apnea, B12 deficiency, anemia, or ADHD in TRD or "brain fog" presentations were not retrieved, so no numbers can be given.
- MAOI efficacy data in TRD (e.g., tranylcypromine RCTs, STAR*D level 4) were not retrieved. Only the Thase–Rush positioning is documented here.
- The exact MSM antidepressant-failure cut-points (number of medications per point) were not confirmed in retrieved text.
- The NICE NG222 position on ECT for chronic or TRD depression was not retrieved.
- No data were retrieved on medication-induced cognitive dulling (e.g., from SSRIs or antipsychotics) as a mimic of depressive cognitive impairment.

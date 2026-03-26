# STXBP1 Support-Handoff Override Shadow

- Source artifact: `/Users/ahmedelmorshedy/Genovy/output/shadow-stxbp1-discriminating-case-20260325.json`
- Truth gene: `STXBP1`
- Target disease: `developmental and epileptic encephalopathy, 4` (`MONDO:0012812`)

## Baseline

- Baseline gene score: `0.163948`
- Baseline direct gene score: `0.163948`
- Enriched disease score: `0.186806`
- Disease support evidence weight: `1`
- Current support weight: `0.68`
- Current handoff score: `0.127028`

## Threshold

- Minimum support weight to beat the current direct STXBP1 gene score: `0.877638`

## Scenarios

- support weight 0.68: weight `0.68`, handoff `0.127028`, gene `0.163948`, changes final gene score: `false`
- support weight 0.8: weight `0.8`, handoff `0.149445`, gene `0.163948`, changes final gene score: `false`
- support weight 0.85: weight `0.85`, handoff `0.158785`, gene `0.163948`, changes final gene score: `false`
- exact threshold: weight `0.877638`, handoff `0.163948`, gene `0.163948`, changes final gene score: `false`
- support weight 0.9: weight `0.9`, handoff `0.168125`, gene `0.168125`, changes final gene score: `true`
- support weight 1: weight `1`, handoff `0.186806`, gene `0.186806`, changes final gene score: `true`

## Conclusion

- Current rule changes gene score: `false`
- Floor override (0.9) changes gene score: `true`
- Interpretation: The enriched specific disease is already strong enough; the current handoff weight is what suppresses it below the existing direct STXBP1 gene score.


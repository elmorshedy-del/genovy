# PPP2R1A Reopen

Date:
- 2026-03-27

Goal:
- Re-open the two `PPP2R1A` misses from preserved artifacts only.
- Preserve the packet/truth/outranker picture without touching the heavy live Railway path.

Cases:
- `PMID_37761890_41`
- `PMID_37761890_43`

Sources:
- [ranked-output-audit-ranking-problem-cases-20260324.json](/Users/ahmedelmorshedy/Genovy/output/ranked-output-audit-ranking-problem-cases-20260324.json)
- [ranked-output-audit-ranking-problem-cases-20260324.md](/Users/ahmedelmorshedy/Genovy/output/ranked-output-audit-ranking-problem-cases-20260324.md)
- [truth-missed-term-gaps-pass-1.json](/Users/ahmedelmorshedy/Genovy/output/truth-missed-term-gaps-pass-1.json)
- [sptan1-topk-shadow-and-ppp2r1a-reassessment-20260325.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/sptan1-topk-shadow-and-ppp2r1a-reassessment-20260325.md)

Truth gene:
- `PPP2R1A`

Truth disease:
- `MONDO:0014605`
- `Houge-Janssens syndrome 2`

## Case 1: PMID_37761890_41

Packet:
- `Intrauterine growth retardation`
- `Microcephaly`
- `Moderate intellectual disability`
- `Delayed speech and language development`
- `Motor delay`
- `Seizure`
- `Hypoplasia of the corpus callosum`
- `Attention deficit hyperactivity disorder`
- `Feeding difficulties`

Truth:
- rank: `256`
- exact direct overlap: `3`
- exact truth-side direct terms:
  - `Microcephaly`
  - `Seizure`
  - `Hypoplasia of the corpus callosum`

Truth-side direct gaps:
- `Intrauterine growth retardation`
- `Moderate intellectual disability`
- `Delayed speech and language development`
- `Motor delay`
- `Attention deficit hyperactivity disorder`
- `Feeding difficulties`

Top outranker:
- gene: `HNRNPC`
- disease: `intellectual developmental disorder, autosomal dominant 74`
- rank: `1`
- exact direct overlap: `5`

Read:
- this case is not losing by a tiny tie-break
- the truth branch is genuinely weaker than many competitors on direct packet coverage

## Case 2: PMID_37761890_43

Packet:
- `Short stature`
- `Microcephaly`
- `Global developmental delay`
- `Delayed speech and language development`
- `Motor delay`
- `Seizure`
- `Agenesis of corpus callosum`
- `Hypotonia`
- `Feeding difficulties`

Truth:
- rank: `109`
- exact direct overlap: `5`
- exact truth-side direct terms:
  - `Microcephaly`
  - `Global developmental delay`
  - `Seizure`
  - `Agenesis of corpus callosum`
  - `Hypotonia`

Truth-side direct gaps:
- `Short stature`
- `Delayed speech and language development`
- `Motor delay`
- `Feeding difficulties`

Top outranker:
- gene: `MACF1`
- disease: `lissencephaly 9 with complex brainstem malformation`
- rank: `1`
- exact direct overlap: `6`

Read:
- this case is more salvageable than case `41`
- but it is still not a pure ranking bug

## Bottom line

`PPP2R1A` should stay in the mixed bucket.

Why:
- both packets are real and moderately rich
- the truth branch is not empty
- but it is still missing several exact direct terms that top competitors already have
- competitors are not winning through propagation tricks; they are winning through stronger direct coverage

Current classification:
- `PMID_37761890_41` = mixed, leaning truth-profile weakness
- `PMID_37761890_43` = mixed, more salvageable

Practical implication:
- if `PPP2R1A` is revisited, truth-side profile inspection/enrichment comes before any scorer-only change

## Evidence boundaries

Inspected:
- preserved phenopackets
- saved ranked-output audit JSON/MD
- saved truth-gap audit JSON
- saved March 25 reassessment note

Intentionally not inspected:
- no fresh live Railway rerank
- no OMIM pass yet
- no broad raw data crawl

Confidence:
- high

# Genovy Benchmark Update

Date: 2026-03-16

## Current benchmark

Official phenotype-only 100-case gene benchmark against Exomiser:

| Metric | Genovy | Exomiser |
|---|---:|---:|
| Found | 81/100 (81.0%) | 100/100 (100.0%) |
| Top-1 | 32/100 (32.0%) | 39/100 (39.0%) |
| Top-3 | 41/100 (41.0%) | 46/100 (46.0%) |
| Top-5 | 45/100 (45.0%) | 48/100 (48.0%) |
| Top-10 | 55/100 (55.0%) | 55/100 (55.0%) |
| Median rank | 3 | 7.5 |
| MRR | 0.390464 | 0.447212 |

Head-to-head on the same 100 cases:

- Genovy ranked higher on 31 cases
- Exomiser ranked higher on 23 cases
- 27 ties
- Exomiser found 19 cases that Genovy missed
- Genovy found 0 that Exomiser missed

Interpretation:

- Genovy is already competitive on ranking sharpness when it finds the truth gene.
- Genovy is still weaker on recall and breadth.
- The interesting signal is that Genovy median rank is better (`3` vs `7.5`), but it is held back by 19 misses / deep-rank failures.

## What changed after the first fix cycle

The first cleanup cycle included the doubled-prefix `NCBIGene:NCBIGene:*` repair and canonical rebuild.

Benchmark impact after that cleanup:

- No change in headline benchmark metrics
- No recovered cases
- No regressions
- No rank movement among previously found cases

That means the remaining gap is no longer explained by the obvious prefix-fragmentation bug.

## What the ranking audit proved

We then ran a post-cleanup ranking pressure audit on the 41 problem cases:

- 15 cases that were previously classified as "rich graph support but missed"
- 26 cases where the truth gene was found but ranked too low

Most important result:

- All 15 rich-support misses appeared in uncapped reruns
- So those were not true candidate-generation failures
- They were ranking failures

Examples of true-gene ranks after uncapping:

- `SCN2A` at rank `103`
- `RERE` at rank `195`
- `TRAF7` at rank `232`
- `WWOX` at rank `542`

Pattern distribution across the 41 audited cases:

| Pattern | Meaning | Count | Share |
|---|---|---:|---:|
| A | Weak phenotype match | 16 | 39.0% |
| B | Weak graph / evidence support | 5 | 12.2% |
| C | Swamped by many near-tied candidates | 13 | 31.7% |
| D | Mixed / other | 7 | 17.1% |

Score-gap signal:

- Mean DX-Sim gap: `0.044588`
- Mean DX-Graph gap: `0.014400`
- Phenotype-side loss is about `3.1x` larger than graph-side loss

Interpretation:

- The main bottleneck is now phenotype modeling, not generic graph evidence
- Many truth genes lose because the disease phenotype profile attached to the correct gene is too weak, too sparse, or too generic for the specific patient

## Most significant structural finding

In the largest failure bucket (Pattern A), several truth-gene disease paths have definitive disease links but zero phenotype terms on that exact disease profile in the graph.

Examples seen in the audit:

- `RERE`
- `SMARCC2`
- `SETD2`
- `STXBP1`
- `PPP2R1A`
- parts of `SCN2A`

This is important because it means:

- the gene may be present
- the disease link may even be strong
- but the phenotype layer on the truth path is incomplete, so the ranker loses before graph evidence can rescue it

## Remaining concrete problem buckets

1. True graph / identity holes

- `U2AF2` missing from the searchable gene graph in 2 cases
- `RPGRIP1` canonical identity still broken in 1 case

2. Sparse phenotype coverage

- `SOCS1`

3. Rank pressure on rich but noisy genes

- `STXBP1`
- `SCN2A`
- `ANKRD11`
- `PPP2R1A`
- `RERE`
- `SPTAN1`
- `TRAF7`
- `SETD2`

## Best concise summary

Genovy is no longer mainly blocked by trivial graph-fragment bugs. The system is now at the stage where:

- recall is still below Exomiser (`81%` vs `100%`)
- top-10 is already matched (`55%` vs `55%`)
- median rank is actually better when Genovy finds the truth (`3` vs `7.5`)
- the next benchmark gains will come from fixing phenotype-profile completeness on the correct gene-disease paths, plus a small number of true identity holes

## Immediate next moves

1. Fix the true graph holes first: `U2AF2`, `RPGRIP1`
2. Enrich phenotype coverage for the biggest Pattern A genes: `STXBP1`, `SCN2A`, `ANKRD11`, `RERE`, `SETD2`, `PPP2R1A`
3. Then address noise compression / tie density for Pattern C cases once the truth paths are better populated

## Source files

- [genovy-vs-exomiser-official-100-prefix-cleanup.json](/Users/ahmedelmorshedy/Genovy/output/genovy-vs-exomiser-official-100-prefix-cleanup.json)
- [genovy-dx-official-100-prefix-cleanup-brief.md](/Users/ahmedelmorshedy/Genovy/output/genovy-dx-official-100-prefix-cleanup-brief.md)
- [genovy-dx-official-100-gap-buckets.md](/Users/ahmedelmorshedy/Genovy/output/genovy-dx-official-100-gap-buckets.md)
- [audit-ranking-pressure.md](/Users/ahmedelmorshedy/Genovy/output/audit-ranking-pressure.md)

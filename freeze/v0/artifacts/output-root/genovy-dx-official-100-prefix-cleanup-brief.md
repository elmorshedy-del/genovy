# Genovy DX Official 100-Case Prefix Cleanup Benchmark

Date: 2026-03-16

## Run

- Genovy results: `/Users/ahmedelmorshedy/Genovy/output/pheval-run-official-100-prefix-cleanup/pheval_gene_results`
- Comparator JSON: `/Users/ahmedelmorshedy/Genovy/output/genovy-vs-exomiser-official-100-prefix-cleanup.json`
- Exomiser results: `/Users/ahmedelmorshedy/Genovy/output/pheval-paper-results/exomiser-14.0.2-2406/phenopacket_store_0.1.11_phenotypes/pheval_gene_results`
- Baseline for comparison: `/Users/ahmedelmorshedy/Genovy/output/genovy-vs-exomiser-official-100-fragment-fix.json`

## Metrics

| Metric | Genovy | Exomiser |
|---|---:|---:|
| Found | 81/100 (81.0%) | 100/100 (100.0%) |
| Top-1 | 32/100 (32.0%) | 39/100 (39.0%) |
| Top-3 | 41/100 (41.0%) | 46/100 (46.0%) |
| Top-5 | 45/100 (45.0%) | 48/100 (48.0%) |
| Top-10 | 55/100 (55.0%) | 55/100 (55.0%) |
| MRR | 0.390464 | 0.447212 |

## Head-to-head

- Genovy ranked higher: 31
- Exomiser ranked higher: 23
- Ties: 27
- Exomiser found when Genovy missed: 19
- Genovy found when Exomiser missed: 0

## Prefix cleanup impact

- Summary changed vs fragment-fix baseline: False
- Cases recovered from missed to found: 0
- Cases regressed from found to missed: 0
- Previously-found cases with a different rank: 0

## Rich-support miss follow-up

- Previously-missed rich-support cases recovered: 0
- Still missed rich-support cases: 15

Recovered cases:
- none

Rank changes among previously-found cases:
- none

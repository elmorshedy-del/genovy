# Genovy DX Official 100-Case Full Enrichment Brief

Date: 2026-03-16

Comparator:
- Exomiser `14.0.2-2406`

Run inputs:
- Phenopackets: `/Users/ahmedelmorshedy/Genovy/output/pheval-official-sample-100/phenopackets`
- Genovy results: `/Users/ahmedelmorshedy/Genovy/output/pheval-run-official-100-full-enrichment/pheval_gene_results`
- Exomiser results: `/Users/ahmedelmorshedy/Genovy/output/pheval-paper-results/exomiser-14.0.2-2406/phenopacket_store_0.1.11_phenotypes/pheval_gene_results`
- DX-PPI integration: not included in this benchmark run

## Metrics

| Metric | Genovy (before) | Genovy (after) | Exomiser |
|---|---:|---:|---:|
| Found % | 81% | 81% | 100% |
| Top-1 % | 32% | 34% | 39% |
| Top-3 % | 41% | 41% | 46% |
| Top-5 % | 45% | 46% | 48% |
| Top-10 % | 55% | 52% | 55% |
| Median rank | 3 | 3 | 7.5 |
| MRR | 0.390 | 0.405 | 0.447 |

## What Changed

- Found rate stayed flat at `81/100`.
- Top-1 improved from `32` to `34`.
- Top-5 improved from `45` to `46`.
- Top-10 regressed from `55` to `52`.
- Median rank stayed at `3`.
- MRR improved from `0.390464` to `0.404633`.

This was a mixed result: enrichment and identity repair improved early precision, but some previously-found cases were pushed deeper and three cases fell out of the top 10 net.

## Head-to-Head

- Before: Genovy higher `31`, Exomiser higher `23`, ties `27`
- After: Genovy higher `32`, Exomiser higher `24`, ties `25`
- Exomiser-only found count stayed at `19`.

## Previously Missed Rich-Support Cases

- Newly found: `3/15`
- Still missed: `12/15`

Newly found cases:
- `PMID_33731876_fam421` -> `SCN2A` at rank `97`
- `PMID_35190816_STX_Syrbe_6` -> `STXBP1` at rank `55`
- `PMID_37761890_41` -> `PPP2R1A` at rank `86`

## Pattern-A Gene Follow-Up

Genes with at least one improved case: `STXBP1`, `SCN2A`, `ANKRD11`, `PPP2R1A`, `SPTAN1`

Genes with no observed improvement in this run: `RERE`, `SETD2`, `SMARCC2`

Notable improvements:
- `RPGRIP1` identity repair converted `PMID_34722527_individual_individual_1_Shiyuan_Wang1_Clinicalandge` from miss to rank `1`.
- `PPP2R1A` case `PMID_37761890_22` improved from rank `71` to `8`.
- `STXBP1` case `PMID_35190816_STX_EG0598P` improved from rank `34` to `4`.
- `SCN2A` case `PMID_33731876_fam9` improved from rank `86` to `49`.

## Regressions

- Previously found but now missed: `4`
- Largest regressions included:
- `PMID_34521999_43`: `1` -> `84`
- `PMID_34521999_50`: `10` -> `91`
- `PMID_32154675_Family4Patient11`: `32` -> `94`
- `PMID_36446582_Gnazzo2020_P1`: `9` -> `58`
- `PMID_33731876_fam341`: `4` -> `30`

The main negative movement came from top-10 losses, especially cases like `PMID_34521999_43` (`1 -> 84`) and `PMID_34521999_50` (`10 -> 91`).

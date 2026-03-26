# Genovy DX Official 100-Case Benchmark Update

Date: 2026-03-15

## What changed

This rerun used the same official 100-case phenotype-only gene benchmark slice as the prior run, but with two data-path fixes applied before rerunning Genovy against the live production API:

1. gene entity fragmentation fix
   - merged split gene identities across `HGNC:*`, `NCBIGene:*`, and malformed doubled-prefix `NCBIGene:NCBIGene:*` rows into single canonical concepts
2. benchmark delivery fix
   - increased the DX gene-result cap so the benchmark can receive up to the requested top-k instead of being truncated at 25 results

No changes were made to the ranking algorithm or scoring logic.

## Main files

- Before/after baseline comparator:
  - `/Users/ahmedelmorshedy/Genovy/output/genovy-vs-exomiser-official-100.json`
- Updated comparator after fragment fix:
  - `/Users/ahmedelmorshedy/Genovy/output/genovy-vs-exomiser-official-100-fragment-fix.json`
- Updated benchmark raw results:
  - `/Users/ahmedelmorshedy/Genovy/output/pheval-run-official-100-fragment-fix/raw_results`
- Updated processed gene results:
  - `/Users/ahmedelmorshedy/Genovy/output/pheval-run-official-100-fragment-fix/pheval_gene_results`

## Genovy before vs after

| Metric | Before | After | Delta |
|---|---:|---:|---:|
| Found | 67% | 81% | +14 pts |
| Top-1 | 34% | 32% | -2 pts |
| Top-3 | 42% | 41% | -1 pt |
| Top-5 | 46% | 45% | -1 pt |
| Top-10 | 57% | 55% | -2 pts |
| Median rank | 1 | 3 | worse |
| MRR | 0.405671 | 0.390464 | down |
| Misses | 33 | 19 | -14 |

Interpretation:

- The fix materially improved candidate coverage.
- It did not improve rank sharpness.
- The new recovered cases mostly entered deeper in the ranked list rather than near rank 1.

## Current Genovy vs Exomiser

Same official 100-case phenotype-only gene slice:

| Metric | Genovy | Exomiser 14.0.2 |
|---|---:|---:|
| Found | 81% | 100% |
| Top-1 | 32% | 39% |
| Top-3 | 41% | 46% |
| Top-5 | 45% | 48% |
| Top-10 | 55% | 55% |
| Median rank | 3 | 7.5 |
| MRR | 0.390464 | 0.447212 |

Head-to-head on the 100 cases:

- Genovy ranked the truth gene higher in 31 cases
- Exomiser ranked the truth gene higher in 23 cases
- 27 cases were ties
- Exomiser found the truth gene when Genovy missed it in 19 cases
- Genovy had 0 cases where it found the truth gene and Exomiser missed it

Interpretation:

- Genovy still loses overall because Exomiser has much better recall.
- On cases where Genovy does find the truth gene, it remains competitive and often ranks it sharply.
- The main remaining gap is still coverage, not scoring quality.

## Impact on the four miss-cluster genes

### STXBP1

Found cases improved from 1/10 to 6/10.

Recovered cases:

- `PMID_35190816_STX_20887364_Subject_2103` -> rank 33
- `PMID_35190816_STX_23934111_fh` -> rank 30
- `PMID_35190816_STX_25818041_Patient_20` -> rank 58
- `PMID_35190816_STX_EG0598P` -> rank 34
- `PMID_35190816_STX_P_20` -> rank 38

Still missed:

- `PMID_35190816_STX_26865513_Patient_45`
- `PMID_35190816_STX_27159321_LD_0358`
- `PMID_35190816_STX_28944233_270001`
- `PMID_35190816_STX_Syrbe_6`

### SCN2A

Found cases improved from 5/8 to 7/8.

Recovered cases:

- `PMID_33731876_fam163` -> rank 91
- `PMID_33731876_fam9` -> rank 86

Still missed:

- `PMID_33731876_fam421`

### ANKRD11

Found cases improved from 3/6 to 4/6.

Recovered case:

- `PMID_36446582_Willemsen2010_P2` -> rank 45

Still missed:

- `PMID_36446582_Goldenberg2016_P13`
- `PMID_36446582_Miyatake2017_P1`

### PPP2R1A

Found cases improved from 0/3 to 1/3.

Recovered case:

- `PMID_37761890_22` -> rank 71

Still missed:

- `PMID_37761890_41`
- `PMID_37761890_43`

## Net recovery summary

Recovered previously missed cases: 15

- `PMID_24369382_Family1II4`
- `PMID_29122497_29122497_P1`
- `PMID_31021519_Patient2fromKikuirietal`
- `PMID_31021519_individualfromTrakadisetal`
- `PMID_31239556_individual2Gregoretal`
- `PMID_32154675_Family4Patient11`
- `PMID_33731876_fam163`
- `PMID_33731876_fam9`
- `PMID_35190816_STX_20887364_Subject_2103`
- `PMID_35190816_STX_23934111_fh`
- `PMID_35190816_STX_25818041_Patient_20`
- `PMID_35190816_STX_EG0598P`
- `PMID_35190816_STX_P_20`
- `PMID_36446582_Willemsen2010_P2`
- `PMID_37761890_22`

One case regressed from found to missed:

- `PMID_34722527_individual_individual_1_Shiyuan_Wang1_Clinicalandge`

## Practical conclusion

The fragmentation diagnosis was real and fixing it mattered. The result was a major recall gain:

- miss count dropped from 33 to 19
- candidate coverage improved by 14 percentage points

But the rerun also clarified the next problem:

- the recovered genes usually land deep in the ranked list
- Genovy now needs recall-preserving rank refinement for these long-tail recovered cases

So the current state is:

- candidate assembly is substantially healthier
- benchmark recall is materially better
- Exomiser is still ahead overall because it finds the truth gene in more cases
- the next optimization target is turning recovered deep hits into top-10 and top-5 hits without losing the new coverage

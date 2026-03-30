# Genovy DX Official 100-Case Gap Buckets

Date: 2026-03-15

Reference comparator:
- `/Users/ahmedelmorshedy/Genovy/output/genovy-vs-exomiser-official-100-fragment-fix.json`

## Snapshot

After the fragment-resolution and top-k delivery fixes:

- Genovy `Found`: `81/100`
- Remaining full misses: `19`
- Recovered but still deep (`rank > 10`): `26`

This means the problem has cleanly split into two different buckets:

1. truth gene still absent from the ranked list
2. truth gene present, but too deep in the ranking to be clinically useful

## Bucket 1: Remaining full misses (`19`)

### A. True graph / identity holes (`3 cases`)

These are the clearest data-layer problems.

| Case | Gene | What the graph shows | Why it matters |
|---|---|---|---|
| `PMID_36747105_proband` | `U2AF2` | no gene entity or canonical concept found | real missing graph coverage |
| `PMID_37962958_43` | `U2AF2` | no gene entity or canonical concept found | same root cause |
| `PMID_34722527_individual_individual_1_Shiyuan_Wang1_Clinicalandge` | `RPGRIP1` | raw entities exist, but no canonical concept is returned for `RPGRIP1`; canonical search resolves to `RPGRIP1L` instead | identity/canonicalization gap |

Plain language:

- `U2AF2` is simply not represented in the current searchable gene graph.
- `RPGRIP1` exists as raw entities, but canonical consolidation/search is still broken for it.

### B. Sparse phenotype profile (`1 case`)

| Case | Gene | Phenotype edges | Disease edges | Direct HPO overlap |
|---|---|---:|---:|---:|
| `PMID_37156989_P1` | `SOCS1` | `22` | `4` | `0` |

Plain language:

- `SOCS1` exists, but its phenotype support is much thinner than the typical miss-cluster genes.
- This looks more like partial graph coverage than a ranking issue.

### C. Rich graph support, but still absent from top-100 (`15 cases`)

These genes are represented in the graph with substantial phenotype evidence, but still fail to enter the final ranked list for specific cases.

| Case | Gene | Phenotype edges | Disease edges | Direct HPO overlap | Exomiser rank |
|---|---|---:|---:|---:|---:|
| `PMID_27495153_Patient1` | `WWOX` | `92` | `10` | `3` | `84` |
| `PMID_29330883_Subject9` | `RERE` | `99` | `2` | `1` | `3` |
| `PMID_30580808_Lo_twin_2-Fam-52` | `SMARCC2` | `94` | `4` | `0` | `927` |
| `PMID_32376980_11` | `TRAF7` | `103` | `2` | `2` | `19` |
| `PMID_33731876_fam421` | `SCN2A` | `97` | `8` | `0` | `4248` |
| `PMID_33766796_16` | `SETD2` | `93` | `7` | `3` | `20` |
| `PMID_35190816_STX_26865513_Patient_45` | `STXBP1` | `96` | `5` | `4` | `21` |
| `PMID_35190816_STX_27159321_LD_0358` | `STXBP1` | `96` | `5` | `2` | `74` |
| `PMID_35190816_STX_28944233_270001` | `STXBP1` | `96` | `5` | `3` | `2713` |
| `PMID_35190816_STX_Syrbe_6` | `STXBP1` | `96` | `5` | `2` | `216` |
| `PMID_36331550_Family16Patient21` | `SPTAN1` | `95` | `6` | `1` | `1` |
| `PMID_36446582_Goldenberg2016_P13` | `ANKRD11` | `95` | `5` | `0` | `217` |
| `PMID_36446582_Miyatake2017_P1` | `ANKRD11` | `95` | `5` | `3` | `1` |
| `PMID_37761890_41` | `PPP2R1A` | `75` | `5` | `1` | `399` |
| `PMID_37761890_43` | `PPP2R1A` | `75` | `5` | `2` | `39` |

Plain language:

- These are not “gene missing from graph” failures.
- The graph has plenty of phenotype edges for them.
- The truth gene is still getting lost because the case-specific phenotype evidence is either weak, too generic, or not strong enough to push the gene into the top 100.

## Highest-priority remaining misses

These are the misses where Exomiser is strongest, so they are the most important to investigate next.

### Exomiser rank `1`

- `PMID_36331550_Family16Patient21` -> `SPTAN1`
- `PMID_36446582_Miyatake2017_P1` -> `ANKRD11`
- `PMID_36747105_proband` -> `U2AF2`

### Exomiser rank `<= 3`

- `PMID_29330883_Subject9` -> `RERE`

### Exomiser rank `<= 20`

- `PMID_32376980_11` -> `TRAF7`
- `PMID_33766796_16` -> `SETD2`

These six cases are the best next debugging set because Exomiser clearly sees something useful there and Genovy currently does not.

## Bucket 2: Recovered but still too deep (`26`)

These cases are no longer hard misses, but the truth gene rank is still weak enough to limit usefulness.

### Largest deep-rank clusters

| Gene | Deep cases (`rank > 10`) |
|---|---:|
| `STXBP1` | `6` |
| `SCN2A` | `4` |
| `SATB2` | `3` |
| `PTPN11` | `2` |
| `ANKRD11` | `2` |

Other single-case deep hits:

- `LMNA`
- `WWOX`
- `DOCK8`
- `ISCA2`
- `CTCF`
- `SPTAN1`
- `SMAD3`
- `SON`
- `PPP2R1A`

### Most important recovered-but-deep cases

These are worth attention because the fix recovered them, but not high enough:

- `PMID_35190816_STX_20887364_Subject_2103` -> `STXBP1` rank `33`
- `PMID_35190816_STX_23934111_fh` -> `STXBP1` rank `30`
- `PMID_35190816_STX_25818041_Patient_20` -> `STXBP1` rank `58`
- `PMID_35190816_STX_EG0598P` -> `STXBP1` rank `34`
- `PMID_35190816_STX_P_20` -> `STXBP1` rank `38`
- `PMID_33731876_fam163` -> `SCN2A` rank `91`
- `PMID_33731876_fam9` -> `SCN2A` rank `86`
- `PMID_37761890_22` -> `PPP2R1A` rank `71`

Plain language:

- The data fixes worked.
- These genes now enter the candidate list.
- The next problem is not “get them in” but “move them up.”

## What this says about the system

### Not the main problem anymore

- generic candidate truncation
- split `HGNC` / `NCBIGene` fragments for the major miss-cluster genes

### Still real problems

1. missing or broken gene identity
   - `U2AF2`
   - `RPGRIP1`

2. partial phenotype coverage
   - `SOCS1`

3. ranking pressure on rich-but-noisy genes
   - `STXBP1`
   - `SCN2A`
   - `ANKRD11`
   - `PPP2R1A`
   - `RERE`
   - `SPTAN1`
   - `TRAF7`
   - `SETD2`

## Practical next step

If the goal is maximum benchmark gain with minimal algorithm change, the next debugging order should be:

1. fix true graph/identity holes
   - `U2AF2`
   - `RPGRIP1`

2. inspect the six high-priority misses where Exomiser is `<= 20`
   - `SPTAN1`
   - `ANKRD11`
   - `U2AF2`
   - `RERE`
   - `TRAF7`
   - `SETD2`

3. focus rank refinement on the deep recovered clusters
   - `STXBP1`
   - `SCN2A`
   - `PPP2R1A`

That is the clearest remaining gap structure after the fragment fix.

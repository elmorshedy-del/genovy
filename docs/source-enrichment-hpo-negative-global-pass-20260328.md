# Global HPO Negative Pass

## Scope
- staging only:
  - Railway project: `invigorating-integrity`
  - environment: `v1-enrich-0328`
  - service: `Postgres-Enrichment-Symmetry`
- baseline scorer unchanged
- benchmark rerun immediately after applying the full HPO negative manifest

## Source
- [HPO `phenotype.hpoa`](https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/phenotype.hpoa)
- imported only `NOT` rows
- source key: `hpo_disease_phenotype_negative`

## Artifacts
- generator: [generateGlobalHpoNegativeManifest.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/generateGlobalHpoNegativeManifest.js)
- manifest: [source-enrichment-manifest-hpo-negative-global-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-manifest-hpo-negative-global-20260328.json)
- apply log: [source-enrichment-apply-log-hpo-negative-global-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-apply-log-hpo-negative-global-20260328.json)
- benchmark json: [official-v1-enrich-hpo-negative-global-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-v1-enrich-hpo-negative-global-20260328.json)
- benchmark md: [official-v1-enrich-hpo-negative-global-20260328.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-v1-enrich-hpo-negative-global-20260328.md)

## Import Summary
- raw HPO negative rows: `727`
- raw HPO diseases with negatives: `352`
- matched graph diseases: `352`
- unmatched disease IDs: `0`
- missing phenotype entities: `0`
- skipped already-present direct absent rows: `0`
- applied absent assertions: `727`

## Benchmark Result
Compared against the restored `v1-working` `1.0` floor:

| Metric | Baseline | After global HPO negatives |
|---|---:|---:|
| Found | `87` | `87` |
| Top-1 | `42` | `42` |
| Top-3 | `51` | `51` |
| Top-5 | `53` | `53` |
| Top-10 | `62` | `62` |
| Median rank | `2` | `2` |
| MRR | `0.488736` | `0.488760` |

## Case-Level Movement
Improved by one rank:
- `PMID_31239556_individual2Gregoretal`: `56 -> 55`
- `PMID_35190816_STX_20887364_Subject_2103`: `20 -> 19`
- `PMID_35190816_STX_23934111_fh`: `32 -> 31`
- `PMID_36446582_Goldenberg2016_P24`: `15 -> 14`
- `PMID_36446582_Willemsen2010_P2`: `59 -> 58`

Worsened by one rank:
- `PMID_29058101_Patient1`: `18 -> 19`
- `PMID_37761890_22`: `95 -> 96`

No cases flipped from miss to found, and no found cases regressed to miss.

## Read
- the full HPO negative import is real and correctly wired into the scoring path
- it does not rescue the current miss tail under the baseline scorer
- it produces only very small rank perturbations on the official `100`
- this supports the earlier shadow result: absent assertions alone are not enough without a better contradiction application policy

## Important Context
- this staging clone already contained the earlier small staged source additions from:
  - `Orphadata Phenotypes`
  - `Orphadata HOOM`
  - `PrimeKG`
- those earlier additions were already benchmark-flat on the restored `v1-working` floor
- so the observed movement here is attributable to the global HPO negative import layer, not to a new positive-source jump

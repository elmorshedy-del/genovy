# Step 1: Direct Disease Phenotype Edge Fix

## Diagnosis

- Evidence surfaces inspected:
  - live DX code path in `src/repositories/dxRepository.js` and `src/services/dx/similarityEngine.js`
  - one narrow TBX5 benchmark phenopacket trace (`PMID_12789647_K16IV-1`)
  - public knowledge profile API for `MONDO:0016432`, `MONDO:0007732`, and `OMIM:142900`
  - narrow Postgres queries against the live Railway database using the linked project/environment/service IDs
- Raw mounted exports were not recursively inspected.

### What was happening

- `loadDxDiseasePhenotypeRows()` used `clinical_phenotype_assertions` exclusively whenever that table had rows.
- The curated HPO disease-phenotype source was still present in the graph, but only in `relationships` + `relationship_evidence`, not in `clinical_phenotype_assertions`.
- Confirmed live counts:
  - `clinical_phenotype_assertions` with `source_key = 'hpo_disease_phenotype'`: `0`
  - `relationship_evidence` rows with `source_key = 'hpo_disease_phenotype'`: `281,964`
  - distinct disease-phenotype pairs from those relationship-backed HPO edges: `275,570`
- Example:
  - `MONDO:0007732` (`Holt-Oram syndrome`) had `119` direct relationship-backed phenotype edges and `0` propagated edges.
  - `MONDO:0016432` (`heart-hand syndrome`) had `621` propagated phenotype edges and `0` direct edges.

### Scenario

- This is **Scenario A**.
- Direct curated edges still existed in the database, but the DX disease scoring path was not reaching them reliably because it preferred the structured assertion table and then selected broad propagated support diseases when a gene linked to multiple diseases.

## Fix

### Code changes

- `src/repositories/dxRepository.js`
  - merged typed disease phenotype assertions with relationship-backed disease phenotype rows instead of treating relationships as a fallback-only path
  - classified disease phenotype rows as `direct` vs `propagated`
  - prioritized direct rows over propagated rows when the same disease-phenotype pair exists in both places
- `src/services/dx/similarityEngine.js`
  - tracked per-profile direct vs propagated phenotype edge counts
  - exposed disease result counts separately:
    - `profileDirectPhenotypeCount`
    - `profilePropagatedPhenotypeCount`
  - changed gene support disease selection to prefer the linked disease with the most direct phenotype edges first, then score, then lower propagated burden

### Verification

- Before fix, TBX5 used propagated support disease:
  - support disease: `MONDO:0016432` (`heart-hand syndrome`)
- After fix, TBX5 now supports through the direct curated disease:
  - support disease: `MONDO:0007732` (`Holt-Oram syndrome`)
  - `supportingDiseaseDirectPhenotypeCount = 119`
  - `supportingDiseasePropagatedPhenotypeCount = 0`
- In the disease ranking for the same case:
  - `MONDO:0007732` moved to rank `1`
  - `MONDO:0016432` dropped to rank `4`

## Benchmark

### Official 100-case gene benchmark vs Exomiser

| Metric | Before fix | After fix | Exomiser |
|--------|-----------:|----------:|---------:|
| Found % | 81% | 80% | 100% |
| Top-1 % | 34% | 33% | 39% |
| Top-5 % | 46% | 45% | 48% |
| Top-10 % | 52% | 55% | 55% |
| MRR | 0.405 | 0.395 | 0.447 |

### Head-to-head

- Before: `32 / 24 / 25` (`Genovy higher / Exomiser higher / ties`)
- After: `31 / 21 / 28`

### Rank movement vs post-enrichment baseline

- Cases improved in rank: `21`
- Cases worsened in rank: `24`
- Cases unchanged: `55`
- Recovered from miss to found: `4`
- Regressed from found to miss: `5`

### Regressions from the enrichment pass

- `PMID_34521999_43`: `84 -> 9`
- `PMID_34521999_50`: `91 -> 18`
- `PMID_34521999_32`: `miss -> 24`

These recovered strongly.

### Cases that had improved during enrichment

- `PMID_33731876_fam421`: `97 -> miss`
- `PMID_35190816_STX_Syrbe_6`: `55 -> miss`
- `PMID_37761890_41`: `86 -> miss`
- `PMID_34722527_individual_individual_1_Shiyuan_Wang1_Clinicalandge` (`RPGRIP1`): stayed at `1`

So the direct-edge fix recovered some SON-family regressions, but three enrichment rescues did not hold.

## Readout

- The direct curated disease phenotype routing bug was real and is now fixed.
- The API/scorer can now distinguish direct vs propagated disease phenotype support.
- The benchmark outcome is mixed:
  - broad recall did **not** improve
  - `top-10` recovered from `52%` to `55%`
  - `found`, `top-1`, and `MRR` got slightly worse
- This means the routing fix was necessary, but it is not sufficient on its own.
- The next step should not be training yet unless explicitly approved. The benchmark now says the disease-support selection and score composition still need analysis after the direct-edge fix.

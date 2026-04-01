# GeneReviews Hard Auto-Accept Contract (2026-03-31)

This note records the current deterministic auto-accept contract after the March 31 verifier and span-proof work.

## What is now implemented

The current proof surface includes:

- span-backed phenotype verification
- field-level spans for:
  - `frequency`
  - `onset`
  - `progression`
  - `treatment_response`
- GeneReviews table support inside the verifier path
- Stage 6 routing that respects verifier-gated `auto_accept_eligible`

## Current hard contract

A row is `auto_accept_eligible` only if all of the following are true:

1. `hpo_mapping_trust == high`
2. `source_span == pass`
3. `phenotype_presence == pass`
4. `alias_shadow == pass`
5. if `frequency` is claimed:
   - `frequency_support == pass`
6. if `onset` is claimed:
   - `onset_support == pass`
   - `clause_attachment == pass`
   - `disease_subtype_leak == pass`
7. if `progression` is claimed:
   - `progression_support == pass`
8. if `treatment_response` is claimed:
   - `treatment_response_support == pass`
9. if the row is `excluded`:
   - `excluded_status == pass`
10. `table_concordance` must not be `flag` or `fail`
    - `skip` is allowed
11. no check may be `fail`

Important boundary:

- absence of a matching table row does **not** block auto-accept
- table conflict **does** block auto-accept

## Narrow proof results

### 1. Table-backed verifier proof

One-chapter proof:

- `output/genereviews-pipeline-provenance-proof-20260331/stage7_verify_tables`

Concrete result:

- `Y Chromosome Infertility -> Azoospermia`
  - `source_span == pass`
  - `phenotype_presence == pass`
  - `table_concordance == pass`
  - `auto_accept_eligible == true`

This proves the table parser is now in the verifier path and contributes to the contract.

### 2. Treatment-response span proof

Minimal proof input:

- `output/genereviews-pipeline-progress-treatment-proof-20260331/zap70_minimal`

Concrete Stage 5 results:

- `Autoimmune thrombocytopenia`
  - `treatment_response_raw = treatment-refractory`
  - `treatment_response_char_start/end = 1487..1507`
- `Eczematoid dermatitis`
  - `treatment_response_raw = resistant to therapy`
  - `treatment_response_char_start/end = 759..779`
- `Thrombocytopenia`
  - `treatment_response_raw = treatment-refractory`
  - `treatment_response_char_start/end = 1487..1507`

Verifier result:

- `treatment_response_support == pass` on all three rows

Current boundary:

- these rows are still `FLAGGED`, not auto-accepted
- the current reason is conservative `alias_shadow` handling on phrases like:
  - `treatment-refractory immune thrombocytopenia`
  - `persistent dermatitis`

So the treatment-response spans are now real and deterministic, but the contract still routes these cases to review.

### 3. Progression span proof

Minimal proof input:

- `output/genereviews-pipeline-progress-treatment-proof-20260331-zttk/minimal`

Concrete Stage 5 results:

- `Abnormality of movement`
  - `progression_raw = worsened over time`
  - `progression_char_start/end = 2922..2940`
- `Dystonia`
  - `progression_raw = worsened over time`
  - `progression_char_start/end = 2922..2940`

Verifier result:

- `Abnormality of movement`
  - `progression_support == pass`
  - `auto_accept_eligible == true`
- `Dystonia`
  - `progression_support == pass`
  - but `onset_support == fail`
  - so `auto_accept_eligible == false`

This is the correct failure mode:

- progression was proved
- onset was **not** proved from the stored source sentence
- the row failed closed

## Stage 6 routing proof

### Manifest-positive proof

Proof policy:

- `data/source-enrichment/genereviews-chapter-policy-zttk-proof-autoaccept-20260331.json`

Positive manifest run:

- `output/genereviews-pipeline-progress-treatment-proof-20260331-zttk/minimal/stage6_manifest_parent_only`

Result:

- manifest rows: `1`
- review rows: `0`

Concrete row that entered the manifest:

- `Abnormality of movement`
  - `progression_raw = worsened over time`
  - `auto_accept_eligible = true`
  - `verification_verdict = VERIFIED`

### Review-fallback proof

Mixed run:

- `output/genereviews-pipeline-progress-treatment-proof-20260331-zttk/minimal/stage6_manifest`

Result:

- manifest rows: `0`
- review rows: `1`

Why:

- cleanup collapsed the generic parent row into the more specific child row
- the child row (`Dystonia`) failed the hard contract because its onset claim was not proved
- Stage 6 therefore routed the chapter output to review

This proves that Stage 6 is now verifier-gated rather than policy-only.

## Current residuals

The hard contract is now real, but still intentionally conservative.

The main remaining review-heavy cases are:

- alias-shadow false positives on rows with metadata-like prefixes
- multi-sentence onset attachment where the phenotype source sentence and the stronger metadata sentence differ

That means:

- the deterministic publish gate exists
- it is already able to pass clean rows and fail unsafe rows closed
- but it will still send some valid-but-ambiguous rows to review until alias-shadow and cross-sentence attachment are refined further

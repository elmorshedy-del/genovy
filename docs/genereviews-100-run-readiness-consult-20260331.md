# GeneReviews 100-Run Readiness Brief

Date: 2026-03-31

Purpose: provide a consultant-ready snapshot of the current GeneReviews pipeline state and ask a narrow decision question:

`Is the pipeline ready for a 100-chapter review-first run now, or is there still a critical blocker that should be fixed first?`

This document is not asking whether broad auto-accept or final ingestion is ready.
It is asking whether the current system is strong enough to justify a `100`-chapter `review-first` validation run.

## Decision To Make

Please answer one of these:

1. `Yes, start the 100-chapter review-first run now`
2. `Yes, but fix one or two specific blockers first`
3. `No, a larger unresolved quality problem still exists`

If you choose `2` or `3`, identify the exact blocker and whether it is:
- trust-critical
- audit-critical
- product-only
- optional for the `100` run

## Current Pipeline

Current shape:

1. Stage 1: fetch/clean GeneReviews chapter text and structure
2. Stage 2: phenotype anchors
3. Stage 3: candidate discovery
4. Stage 4: HPO mapping
5. Stage 5: metadata extraction
6. Stage 7: deterministic verifier
7. Stage 6: manifest/review routing plus API exports

Important operating mode:

- `review-first`
- no authoritative DB ingestion
- no `100` run has started yet

## What Is Already Implemented

### Core trust/audit layer

- deterministic verifier with:
  - source span checks
  - phenotype presence checks
  - frequency support
  - onset support
  - progression support
  - treatment-response support
  - clause attachment
  - alias-shadow detection
  - disease-subtype leakage checks
  - table concordance
- hard auto-accept contract exists, but the system is still running conservatively
- human-review audit UI exists with:
  - chapter review pages
  - exact sentence/span visibility
  - direct review links

### Provenance

- sentence ids
- paragraph ids
- sentence/paragraph char offsets
- phenotype match offsets
- field spans for:
  - frequency
  - onset
  - progression
  - treatment response

### DB-backed trust signals

- ontology snapshot refreshed from DB:
  - `23,677` ontology rows
- cross-source concordance now populates from DB-backed sources

### API/product outputs

- chapter exports exist
- assertion exports exist
- chapter genes now populate from cached GeneReviews raw HTML
- chapter-level domains now populate
- paragraph/block-level `local_clinical_domains` now populate on many rows

## Latest5 Current Evidence

Primary output base:

- verifier summary:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-latest5-settled-20260330/stage7_verify_medgemma/verification_summary.json`
- manifest summary:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-latest5-settled-20260330/stage6_manifest_medgemma/manifest_summary.json`
- API assertions:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-latest5-settled-20260330/stage6_manifest_medgemma/api_exports/genereviews_api_assertions.json`

Current latest5 counts:

- `253` total verified features seen by Stage 7
- `161` verified
- `60` flagged
- `32` failed
- `124` auto-accept eligible under the hard contract

Manifest routing result:

- `5` chapters processed
- `0` manifest rows
- `5` review rows

Interpretation:

- the system is still conservative
- nothing is being over-promoted into manifest
- latest5 remains fully review-routed

## Current Product/Export Coverage

Current API assertion export:

- `180` assertion rows
- `180/180` with `gene_symbols`
- `180/180` with `chapter_domains`
- `98/180` with non-empty `local_clinical_domains`
- `41/180` with non-empty `validation.cross_source_concordance`
- `180/180` with `validation.section_branch_consistent = null`

Interpretation:

- gene context is real
- coarse chapter system context is real
- partial local system context is real
- concordance is real
- section-branch consistency is still not useful

## What Became Real Recently

### Cross-source concordance

Now real in exported assertions.

Example now appearing:

- `Absent gallbladder` in `ZTTK syndrome`
- concordant with:
  - `HPO Disease Phenotype Annotations`
  - `Orphadata HOOM`
  - `Orphadata Phenotypes`

### Chapter domains

Examples from current chapter exports:

- `Y Chromosome Infertility -> Renal / Genitourinary`
- `ZAP70 -> Neurologic; Hematologic / Immunologic`
- `Zellweger -> Neurologic; Ophthalmologic; Auditory; Gastrointestinal; Renal / Genitourinary; Craniofacial`
- `ZTTK -> Neurologic; Ophthalmologic; Auditory; Cardiovascular; Gastrointestinal; Renal / Genitourinary; Musculoskeletal; Craniofacial`

### Local clinical domains

This is a soft paragraph/block-level context layer.

Example:

- `Azoospermia` in `Y Chromosome Infertility` now carries local domain:
  - `Renal / Genitourinary`

## Known Limitations

### 1. Section-branch consistency is still weak

The code path exists, but it still returns `null` on current exported rows.

Reason:

- local stored section headings are too generic, e.g.
  - `Clinical Description`
  - `Suggestive Findings`
  - `Table 2.`
- they are not rich enough for meaningful row-level branch validation

Current judgment:

- this is a soft audit signal problem
- not obviously a blocker for a `100` review-first run

### 2. Local clinical domains are useful but incomplete

- `98/180` assertion rows have them
- they are soft context, not truth
- they help review and product grouping, but should not be treated as a hard validator

### 3. No targeted spaCy/dependency attachment layer yet

Current attachment control is still:

- spans
- clause windows
- alias-shadow
- disease-subtype leakage

There is no targeted dependency-parse helper yet for ambiguous onset/progression/treatment attachment.

Current judgment:

- this may improve quality further
- unclear whether it is required before `100 review-first`

### 4. No broad auto-accept recommendation

The system has an auto-accept contract, but we are not claiming broad auto-accept readiness.

This brief is only about:

- `100 review-first`

not:

- autoaccept-at-scale
- final ingestion

## Current Audit/Human Review Surface

Human review is already supported with:

- hosted audit route
- direct review links
- exact sentence visibility
- stored span texts
- failed/flagged checks

Key review artifacts:

- review queue:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-latest5-settled-20260330/stage6_manifest_medgemma/genereviews_review_queue.json`
- example review page:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-latest5-settled-20260330/stage7_verify_medgemma/review_pages/Y_Chromosome_Infertility_review.html`

## My Current Internal Read

Current honest read:

- `review-first at 100`: likely ready
- `broad auto-accept`: not ready
- `final ingestion/publish`: not ready

The main remaining unresolved item looks like:

- better local subsection structure for row-level organ/system attribution

But that currently appears more like:

- audit refinement
- product refinement

than a clear blocker for a `100`-chapter review-first validation run.

## Specific Questions For Consultant

1. Based on the current latest5 evidence, is there any trust-critical blocker that should stop a `100`-chapter review-first run?

2. Is the current combination of:
   - deterministic verifier
   - concordance
   - table support
   - human-review UI
   - provenance/spans
   enough to justify `100 review-first`, even though `section_branch_consistent` is still weak?

3. Should a targeted `spaCy`/dependency attachment helper be treated as:
   - required before `100`
   - beneficial but optional before `100`
   - only needed before broader auto-accept

4. Is `section_branch_consistent` weak enough to defer, given that we now have:
   - `chapter_domains`
   - `local_clinical_domains`
   - row-level deterministic checks
   - cross-source concordance

5. If you would delay the `100` run, what exact one or two fixes should be done first?

## Requested Recommendation Format

Please answer in this format:

- `Decision:` start now / fix X first / not ready
- `Why:` 3-6 sentences max
- `Blockers:` exact blockers only
- `Not blockers:` things that are imperfect but should not stop the `100 review-first` run

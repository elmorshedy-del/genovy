# GeneReviews Deterministic Verifier Pilot On Latest5 2026-03-31

## What was implemented
- verifier spec:
  - `docs/genereviews-deterministic-verifier-spec-20260331.md`
- new library:
  - `src/lib/genereviewsVerification.js`
- new script:
  - `src/scripts/verifyGeneReviewsEnrichment.js`
- npm entry:
  - `gr:verify`

## What this verifier checks today
- phenotype presence in source sentence
- deterministic frequency support
- deterministic onset support
- clause-boundary onset attachment check
- alias-shadow flagging
- disease-subtype onset leakage flagging
- excluded-row lexical marker check

## Evidence surface
- cached Stage 1 clinical text
- tightened Stage 5 MedGemma outputs
- no DB writes
- no ingestion changes

## Pilot command
```bash
npm run gr:verify -- \
  --policy data/source-enrichment/genereviews-chapter-policy-latest5-20260330.json \
  --clinical output/genereviews-pipeline-latest5-settled-20260330/stage1_fetch \
  --enriched output/genereviews-pipeline-latest5-tightened-20260330/stage5_enriched_medgemma \
  --output output/genereviews-pipeline-latest5-tightened-20260330/stage7_verify_refined \
  --limit 5 \
  --noResume
```

## Summary result
- total features checked: `258`
- `VERIFIED`: `121`
- `FLAGGED`: `116`
- `FAILED`: `21`

Per chapter:
- `Y chromosome infertility`
  - verified `1`
  - flagged `5`
  - failed `0`
- `YIF1B`
  - verified `19`
  - flagged `21`
  - failed `1`
- `ZAP70`
  - verified `12`
  - flagged `28`
  - failed `5`
- `Zellweger`
  - verified `9`
  - flagged `18`
  - failed `0`
- `ZTTK`
  - verified `80`
  - flagged `44`
  - failed `15`

## Most important read
- the verifier is already useful as an audit surface
- it is not a final publish gate yet, because it still works from sentence-level evidence rather than field-level spans

## High-signal success case
- `ZTTK`
  - `Cerebral visual impairment`
    - `VERIFIED`
  - `Visual impairment`
    - `FLAGGED`
    - reason:
      - alias-shadow inside `cortical visual impairment`

This is important because it matches the real residual issue from the tightened `latest5` validation. The verifier is catching the right broad-parent contamination rather than failing both rows.

## Current limitation
- many rows are still only `FLAGGED`, not `VERIFIED`, because the current verifier does not yet have:
  - char offsets
  - field-level spans
  - section ids
  - table-derived support rows

## Practical conclusion
- the verifier is already strong enough to serve as:
  - an audit engine for the `100` review-first pilot
  - a regression harness for future verifier improvements
- it is not yet strong enough to be the final no-human auto-accept gate

## Next engineering step
- add field-level provenance / span storage so the verifier can move from sentence-level heuristics to exact proof checks

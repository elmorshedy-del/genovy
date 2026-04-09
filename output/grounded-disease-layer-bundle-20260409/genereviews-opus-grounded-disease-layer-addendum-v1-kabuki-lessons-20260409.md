# GeneReviews Opus Grounded Disease Layer Addendum v1 (Kabuki Lessons, 2026-04-09)

Use this addendum together with:
- `genereviews-opus-grounded-disease-layer-contract-v1-20260408.md`

Purpose:
- tighten extraction after the Kabuki full-chapter draft exposed recurring leakage patterns

## Extra hard rules

1. Do not create ancillary assertions for tests, management, or therapies unless the cited sentence explicitly states them.
   - bad pattern:
     - deriving `echocardiogram` from a sentence that only states frequency of congenital heart defects
   - bad pattern:
     - deriving `IVIG may be considered` from a sentence that only states immunoglobulin abnormalities

2. Do not create context assertions from summary knowledge unless the cited sentence explicitly supports the claim.
   - bad pattern:
     - family-risk text without a genetic-counseling sentence
   - bad pattern:
     - inheritance text from a general summary sentence that does not state inheritance
   - bad pattern:
     - therapeutic-landscape speculation from mechanism discussion

3. Do not use summary sentences as evidence for downstream testing, mechanism, management, or therapy claims unless those claims are literally present in the summary sentence.

4. Do not inflate phenotype qualifiers with numeric, mechanistic, or subtype details unless they appear in the cited sentence.
   - bad pattern:
     - adding numeric severity values not present in the row's evidence sentence
   - bad pattern:
     - adding morphologic details not present in the cited sentence

5. When a sentence lists findings in a "reported" or "rare" frame without clear prevalence, prefer:
   - `status = uncertain`
   - sparse qualifiers
   - no extra management or mechanism claims

6. Extraction notes must be source-faithful.
   - do not mention unsupported phrases in a note body
   - cite only the sentence(s) that actually justify the note

## Fast self-check before finalizing

For every ancillary, context, and note row, ask:
- does the cited sentence literally support this statement?
- or am I completing it from disease knowledge?

If it is disease-knowledge completion, delete it.

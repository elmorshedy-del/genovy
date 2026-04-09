# Manual Cleanup Targets: Kabuki + Loeys (2026-04-09)

Historical cleanup note: this work is now complete, and the official repo-side regime-ready outputs are listed in `regime-ready-chapters-20260409.md`.

## Kabuki Syndrome

Use the fuller chapter-backed draft, not the old summary-slice fixture:
- do not clean against `next-chapter-kabuki/disc-020_kabuki_syndrome_clinical_structure.json`
- that bundled file is only the earlier benchmark surface

Main cleanup goals:
- remove unsupported ancillary rows derived from management or testing claims not literally present
- remove unsupported context claims for inheritance, family risk, and therapeutic landscape
- prune inflated phenotype qualifiers
- keep the sentence-backed decomposition and trajectory

Known leak patterns from the fuller draft:
- unsupported ancillary/test/management claims
- unsupported inheritance/gene/family-risk expansions
- qualifier inflation inside phenotype rows

## Loeys-Dietz Syndrome

Working file used for cleanup:
- `/Users/ahmedelmorshedy/Documents/genovymorsh-next-batch/Loeys-Dietz Syndrome.json`

Historical state before cleanup:
- file format is fixed
- sentence index is real
- evidence sentence IDs resolve
- content still needs strict prompt cleanup

Priority fixes:
- prune qualifier inflation on vascular and skeletal rows
- remove or reroute genotype-comparison ancillary rows that are better as notes
- fix the `gene` context assertion so it only says what the cited sentences literally support
- tighten trajectory rows so they do not add unsupported manifestations

Specific Loeys rows to review first:
- `ph_001`
- `ph_003`
- `ph_012`
- `ph_014`
- `ph_015`
- `ph_019`
- `anc_006`
- `anc_007`
- `ctx_002`
- `traj_001`

## New chapter flow

After Kabuki and Loeys were cleaned, the next prepared chapter remained:
- next chapter input: `next-chapter-williams-syndrome/NBK1249_opus_input.json`
- strict prompt: `genereviews-opus-grounded-disease-layer-strict-prompt-v1-20260409.md`

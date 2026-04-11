# Grounded Disease Layer Bundle (2026-04-09)

This folder packages the locked grounded disease layer v1 schema and the first chapters in the new-regime sequence.

## Files

- `genereviews-grounded-disease-layer-schema-v1-20260408.md`
  - schema rationale and field rules
- `genereviews-grounded-disease-layer-template-v1-20260408.json`
  - machine-readable target shape
- `genereviews-opus-grounded-disease-layer-contract-v1-20260408.md`
  - exact Opus extraction contract
- `genereviews-opus-grounded-disease-layer-addendum-v1-kabuki-lessons-20260409.md`
  - stricter grounding addendum based on Kabuki failure modes
- `genereviews-opus-grounded-disease-layer-strict-prompt-v1-20260409.md`
  - single-file handoff prompt that merges the contract intent with the Kabuki anti-leakage rules
- `genereviews-gemini-grounded-disease-layer-strict-prompt-v1-20260409.md`
  - Gemini-oriented variant with stronger coverage / routing / grounding checks
- `genereviews-vertex-grounded-disease-layer-strict-prompt-v1-20260409.md`
  - Vertex-oriented variant with explicit canonical sentence-id rebuild and anti-hallucination rules
- `gemini-enterprise-agent-builder-spec-v1-20260411.md`
  - one-file Gemini Enterprise agent-builder handoff with workflow rules plus exact repo-side parsing, normalization, and validation code
- `manual-cleanup-targets-kabuki-loeys-20260409.md`
  - focused checklist for making Kabuki and Loeys regime-ready by hand
- `chapter-selection-methodology-20260410.md`
  - methodology for ranking and choosing the next grounded disease-layer chapters before more extraction work
- `regime-ready-chapters-20260409.md`
  - official repo-side list of chapters that are already cleaned and ready for the new regime

## New-regime sequence

Manifest:
- `new-regime-manifest-20260409.json`

Current sequence:
- chapter 1:
  - `Kabuki Syndrome`
  - regime-ready after manual cleanup
- chapter 2:
  - `Loeys-Dietz Syndrome`
  - regime-ready after manual cleanup
- chapter 3:
  - `Williams Syndrome`
  - regime-ready after manual rebuild and cleanup against the fuller archived Williams source surface
- chapter 4:
  - `Variegate Porphyria`
  - regime-ready after manual cleanup from the audited chapter-backed surface
- chapter 5:
  - `Waardenburg Syndrome Type I`
  - regime-ready after task-scoped Gemini extraction, sentence-id repair, and manual cleanup

Prepared folders:
- `next-chapter-kabuki/`
- `next-chapter-loeys-dietz/`
- `next-chapter-williams-syndrome/`
- `next-chapter-variegate-porphyria/`
- `next-chapter-waardenburg-syndrome-type-i/`

## Recommended use

1. Use `genereviews-opus-grounded-disease-layer-strict-prompt-v1-20260409.md` as the default extraction instructions.
2. Use `genereviews-gemini-grounded-disease-layer-strict-prompt-v1-20260409.md` for Gemini / Gemini Flash / Gemini Pro runs.
3. Use `genereviews-vertex-grounded-disease-layer-strict-prompt-v1-20260409.md` for Vertex AI runs that need stricter sentence-id repair and anti-hallucination control.
4. Use `gemini-enterprise-agent-builder-spec-v1-20260411.md` when configuring a reusable Gemini Enterprise agent and when you want the exact repo-side parser / normalizer logic in the same handoff file.
5. Use `genereviews-grounded-disease-layer-template-v1-20260408.json` as the required output shape.
6. Use `new-regime-manifest-20260409.json` as the sequence record.
7. Use `chapter-selection-methodology-20260410.md` before choosing or extracting additional chapters.
8. Use a chapter-local `NBKxxxx_opus_input.json` from one of the `next-chapter-*` folders when preparing the next extraction run.
9. Use `regime-ready-chapters-20260409.md` to find the official repo-side cleaned outputs for chapters 1 through 5.
10. The current sequence is now stable through chapter 5, with chapter 4 and chapter 5 both promoted.

## Hard promotion gate

Before forming any `regime_ready_gpt-5.4-manual` chapter, the source surface must pass the repo completeness gate:

- a chapter-local `NBKxxxx_full_chapter_extract.json` must exist as the main source artifact
- the manual disease-layer JSON must be derived from that full extract, not directly from scattered recovered files

- `manual_5_4_ready: true`
- `surface_label: "full chapter-backed"`
- `sentence_count >= 120`
- `paragraph_count >= 60`
- `section_count >= 8`
- `prose_chars >= 20000` when fetch metadata exists
- at least `3` downstream breadth headings such as diagnosis, surveillance, genetic counseling, molecular genetics, molecular pathogenesis, pregnancy management, or genotype-phenotype correlations

If the gate fails, the chapter stays a truncated-source draft even if the current slice is extractable.

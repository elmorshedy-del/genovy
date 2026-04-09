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
- `manual-cleanup-targets-kabuki-loeys-20260409.md`
  - focused checklist for making Kabuki and Loeys regime-ready by hand
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
  - regime-ready after Gemini task-scoped multipass plus manual cleanup

Prepared folders:
- `next-chapter-kabuki/`
- `next-chapter-loeys-dietz/`
- `next-chapter-williams-syndrome/`

## Recommended use

1. Use `genereviews-opus-grounded-disease-layer-strict-prompt-v1-20260409.md` as the extraction instructions.
2. Use `genereviews-grounded-disease-layer-template-v1-20260408.json` as the required output shape.
3. Use `new-regime-manifest-20260409.json` as the sequence record.
4. Use `regime-ready-chapters-20260409.md` to find the official repo-side cleaned outputs for chapters 1 and 2.
5. Williams is now chapter 3 and also listed in `regime-ready-chapters-20260409.md`.

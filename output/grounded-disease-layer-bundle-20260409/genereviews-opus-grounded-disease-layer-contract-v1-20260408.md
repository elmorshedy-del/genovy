# GeneReviews Opus Grounded Disease Layer Contract v1 (2026-04-08)

Purpose:
- Define exactly what Opus should produce for the one-pass 800-chapter GeneReviews run.
- Align extraction to `grounded_disease_layer_v1`.

## Opus job

Opus should produce the canonical grounded disease layer for a single chapter.

Opus is responsible for:
- sentence indexing
- phenotype decomposition
- ancillary evidence capture
- disease-level context capture
- trajectory capture when explicitly described
- ambiguity notes when needed

Opus is not responsible for:
- HPO or MONDO mapping
- assertion weights
- specificity scoring
- graph generation
- benchmark scoring
- biopharma interpretation
- inferred disease-memory completion beyond cited text

## Required output object

Opus must return exactly one JSON object matching:
- `grounded_disease_layer_v1`

Reference template:
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genereviews-grounded-disease-layer-template-v1-20260408.json`

## Hard extraction rules

1. Use only the provided chapter text and sentence index source material.
2. Every populated field must be justified by `evidence_sentence_ids`.
3. If a qualifier is not explicitly supported, leave it `null`.
4. If a disease-level field is not explicitly supported, do not emit a `context_assertion` for it.
5. Prefer literal or near-literal source labels over polished medical rewrites.
6. Split coordinated findings when the source clearly names distinct manifestations.
7. Keep umbrella findings only when the umbrella itself is clinically meaningful in the source.
8. Use `trajectory_assertions` only when the source explicitly describes staged disease course.
9. Use `extraction_notes` only for real routing or decomposition decisions.
10. Do not use outside disease knowledge to fill gaps.

## Status rules

Phenotype and ancillary `status`:
- `present`
  - directly stated as part of the disease
- `uncertain`
  - hedged or weakly generalized, e.g.:
    - `may`
    - `reported`
    - `variably described`
    - `in some individuals`
- `excluded`
  - explicit normality or explicit absence statement

Low frequency alone does not automatically mean `uncertain`.

## Clinical role rules

Allowed `clinical_role` values for phenotype assertions:
- `primary`
  - direct disease manifestation
- `descriptor`
  - descriptive feature or subordinate manifestation
- `complication`
  - downstream adverse manifestation or explicit risk outcome

Use these conservatively.

## Qualifier discipline

Phenotype qualifiers are fixed-slot and must remain conservative:

```json
{
  "onset": null,
  "frequency": null,
  "severity": null,
  "progression": null,
  "trigger": null,
  "treatment_response": null,
  "pathophysiology": null,
  "laterality": null,
  "distribution": null,
  "anatomical_site": null,
  "morphology": null,
  "subtype_context": null
}
```

Important:
- `null` means the slot exists but no grounded value is supported for that row
- do not invent values just because the disease is known
- do not fill anatomical, pathophysiologic, or treatment qualifiers unless explicit

## Ancillary domain rules

Allowed `domain` values:
- `laboratory`
- `imaging`
- `pathology`
- `electrophysiology`
- `treatment_response`
- `clinical_test`
- `management_context`
- `other`

Route facts by concept type:
- diagnostic tests -> `clinical_test`
- explicit lab abnormalities -> `laboratory`
- explicit imaging findings -> `imaging`
- explicit pathology findings -> `pathology`
- explicit response-to-therapy statements -> `treatment_response`
- surveillance or management guidance -> `management_context`

## Context rules

Allowed context fields:
- `onset`
- `inheritance`
- `gene`
- `prevalence`
- `prognosis`
- `natural_history`
- `family_risk`
- `founder_variant`
- `biomarker`
- `therapeutic_landscape`
- `penetrance`

Emit a `context_assertion` only when explicitly supported by the source.

## Suggested Opus prompt

```text
You are performing STRICTLY GROUNDED GeneReviews extraction.

Return exactly one JSON object matching the grounded_disease_layer_v1 schema.

Your only source of truth is the provided chapter text. Do not use outside medical knowledge, disease memory, or inferred canonical facts unless they are explicitly supported by cited sentences.

Requirements:
- build a full sentence_index
- extract phenotype_assertions with status, clinical_role, evidence_sentence_ids, and conservative qualifiers
- extract ancillary_assertions across the allowed domains
- extract context_assertions only when explicitly supported
- extract trajectory_assertions only when the chapter explicitly describes staged disease course
- use extraction_notes only for real ambiguity or routing decisions

Hard rules:
- every populated field must be justified by evidence_sentence_ids
- if unsupported, leave qualifier slots null or omit the row
- do not create ontology mappings
- do not create weights
- do not create graph edges
- do not create biopharma interpretations
- return JSON only
```

## Why this contract exists

This contract keeps Opus focused on the one thing it can do reliably at scale:
- grounded disease-layer extraction

Everything else:
- normalization
- weighting
- ontology
- graph projection
- biopharma intelligence

should be derived later by deterministic or reviewable downstream steps.

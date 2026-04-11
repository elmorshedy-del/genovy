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
- disease-state episode capture when explicitly named
- disease-level trigger capture when explicitly tied to a broader episode or attack state
- trajectory capture when explicitly described
- causal-chain capture when explicitly stated
- ambiguity notes when needed

Opus is not responsible for:
- HPO mapping
- MONDO mapping beyond preserving an explicitly supplied nullable `mondo_id` placeholder
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
9. Use `causal_chains` only when the source explicitly states a cause-effect link.
10. Leave `mechanism_sentence_ids` empty in model output; the runner derives it from grounded causal-chain evidence.
11. Use `extraction_notes` only for real routing or decomposition decisions.
12. Do not use outside disease knowledge to fill gaps.
13. If `status = "excluded"`, the label must name the abnormality being ruled out, not the normal attribute that remains.
14. If `clinical_role = "descriptor"`, `subtype_context` must be non-null and should name the grounded parent finding.
15. Do not use navigational list-header sentences such as `Major criteria`, `Minor criteria`, or `Occasional findings...` as evidence references.
16. Do not drop a source-mentioned concept only because it is ambiguous; retain it in the nearest grounded home and note unresolved targets when needed.
17. Use `management_condition` for care-dependent expression such as `if untreated`, `if not limited`, or `if uncontrolled externally` when the sentence is not describing a true precipitating trigger.
18. Every `causal_chain` row must include at least one grounded `evidence_sentence_ids` entry; if no sentence directly supports the link, omit the chain.
19. Phenotype rows must remain sentence-local and should carry exactly one `evidence_sentence_ids` value; if another sentence adds detail, split it into another row or preserve it in notes, trajectory, or context instead of aggregating.
20. During first pass, re-scan any sentence that already yielded one finding if it still contains additional coordinated abnormalities; dense summary, anatomic, ocular, neurologic, or multisystem sweep sentences must be decomposed sibling-by-sibling when clinically meaningful.
21. If one sentence gives parallel percentages, frequencies, severities, or other explicit modifiers for multiple named sibling findings, emit separate sentence-local support for each supported sibling instead of enriching only one sibling row.
22. Do not assume a child finding named in an early dense sentence will be restated later; if the source supports it once, capture it from that sentence or preserve the omission risk in an extraction note.

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
  "management_condition": null,
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
- keep `trigger` inside phenotype qualifiers only when the cited sentence clearly targets that single phenotype or symptom
- use `management_condition` when the source makes a finding contingent on treatment, supervision, restriction, or other care context rather than on an acute precipitating exposure

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

When multiple grounded statements populate the same `field_name`, prefer one coherent row with multiple evidence refs instead of fragmented duplicates.

## Episode-class rules

Use `episode_classes[]` when the chapter explicitly defines a broader attack state, episode class, or syndrome-level flare that would be too vague if exported as a bare phrase.

Rules:
- keep `label_raw` source-faithful
- use `label_normalized` only to preserve meaning after slot export
- `resolution_status = "resolved"` when the episode label is slot-safe on its own
- `resolution_status = "unresolved"` when the chapter mentions a broader state but does not resolve it to a slot-safe target
- `resolution_status = "needs_enrichment"` when the target is partly grounded but lacks the detail needed for safe downstream export

## Trigger-factor rules

Use `trigger_factors[]` when the trigger targets a broader episode class or disease state rather than a single phenotype row.

Rules:
- keep phenotype-level `trigger` only when the cited sentence clearly targets one phenotype or symptom
- use `target_episode_id` when the trigger points to a defined `episode_class`
- use `target_resolution_status = "unresolved"` when the trigger target does not resolve to one specific phenotype, episode, or disease-state target
- use `target_resolution_status = "needs_enrichment"` when the broad target is partly grounded but still lacks enough specificity for safe slot export
- do not discard vague targets; retain them with an explicit resolution status and a short `target_resolution_note`
- if the sentence states a care-dependent condition such as `if untreated`, `if not limited`, or `if uncontrolled externally`, do not force it into `trigger_factors`; prefer `management_condition` on the affected phenotype row

## Causal-chain rules

Allowed `chain_type` values:
- `molecular_mechanism`
- `clinical_consequence`

Use `causal_chains` only for explicit cause-effect links.

Rules:
- prefer `molecular_mechanism` for gene, protein, pathway, cellular, or tissue-dysfunction mechanisms
- use `clinical_consequence` only for clearly stated, sentence-local clinical cause-effect links
- do not convert every complication, risk, or weak `may contribute to` sentence into a causal chain
- do not infer mechanism from disease memory
- keep one cause-effect link per row
- each chain must keep at least one grounded `evidence_sentence_ids` value

## Suggested Opus prompt

```text
You are performing STRICTLY GROUNDED GeneReviews extraction.

Return exactly one JSON object matching the grounded_disease_layer_v1 schema.

Your only source of truth is the provided chapter text. Do not use outside medical knowledge, disease memory, or inferred canonical facts unless they are explicitly supported by cited sentences.

Requirements:
- build a full sentence_index
- extract phenotype_assertions with status, clinical_role, evidence_sentence_ids, and conservative qualifiers
- keep phenotype rows sentence-local instead of aggregating multiple evidence sentences into one phenotype row
- explicitly re-scan dense coordinated sentences for omitted sibling findings
- if one sentence gives parallel percentages or other explicit modifiers for multiple named siblings, create separate sentence-local support for each supported sibling
- extract ancillary_assertions across the allowed domains
- extract context_assertions only when explicitly supported
- extract `episode_classes` when the chapter explicitly names a broader attack or episode state
- extract `trigger_factors` when a trigger targets a broader attack or disease state rather than one phenotype
- extract trajectory_assertions only when the chapter explicitly describes staged disease course
- extract causal_chains only when the chapter explicitly states cause-effect links
- leave mechanism_sentence_ids empty; the runner derives it deterministically
- use extraction_notes only for real ambiguity or routing decisions

Hard rules:
- every populated field must be justified by evidence_sentence_ids
- if unsupported, leave qualifier slots null or omit the row
- do not create ontology mappings
- do not create weights
- do not create graph edges
- do not infer causal mechanisms
- do not create biopharma interpretations
- do not use list headers as evidence refs
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

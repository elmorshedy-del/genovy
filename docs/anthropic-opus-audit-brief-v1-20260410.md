# Anthropic Opus Audit Brief v1

Date: 2026-04-10

Purpose:
- Bring an external Opus audit session into the current Genovy grounded disease-layer workflow without relying on older project memory.
- Keep the audit focused on grounded defects, omissions, and rerouting problems.

Use this brief when auditing a chapter output against the recovered full-source clinical surface.

## Minimum file set for one chapter audit

Upload and mount exactly these files:
- the candidate chapter JSON
  - example: `NBK621298_wagr_spectrum_disorder_regime_ready_gpt-5.4-manual.json`
- the recovered full-source clinical surface
  - example: `NBK621298_recovered_clinical_structure.json`
- this audit brief

Optional:
- chapter `README.md` if the reviewer needs path status or chapter notes
- prior external critique JSON only for merge triage, not for first-pass audit

## Current Genovy rules that matter

1. Phenotype rows are sentence-local by default.
- A phenotype row should usually carry exactly one `evidence_sentence_ids` value.
- Do not ask for multi-sentence phenotype aggregation unless absolutely unavoidable.

2. Do not drop source-mentioned concepts just because they are ambiguous.
- Preserve them in the nearest grounded home.
- Use `resolved`, `unresolved`, or `needs_enrichment` logic where appropriate.

3. Broader disease-state or episode-level triggers do not belong inside phenotype rows.
- Use `episode_classes` for broader episodes, attacks, or state labels.
- Use `trigger_factors` for disease-level or episode-level precipitants.
- Keep phenotype-level `trigger` only when the sentence clearly points to one specific phenotype or symptom target.

4. Care-dependent expression should use `management_condition`, not `trigger`.
- Examples:
  - `if untreated`
  - `if not limited`
  - `if uncontrolled externally`
  - `with supervision`

5. `treatment_response` is only for actual therapy or intervention effect.
- Do not use it for absence of treatment.

6. Descriptor discipline matters.
- If `clinical_role = "descriptor"`, `subtype_context` should explain the grounded parent finding or subgroup scope.

7. Audit against the recovered full-source clinical surface.
- Do not critique against thin, summary-like, or older truncated surfaces.

8. Keep ambiguity explicit rather than pretending it is resolved.
- If a target is not slot-safe in isolation, preserve it as unresolved or needs-enrichment.

## What external Opus is most useful for

The reviewer is most valuable when checking:
- list-style findings that may have been skipped
- short laboratory-finding sentences
- genotype-phenotype correlation sentences
- natural-history or screening/ascertainment sentences
- misrouted rows, especially:
  - phenotype vs ancillary laboratory
  - phenotype trigger vs trigger_factors
  - trigger/treatment_response vs management_condition
  - subgroup facts that should be descriptor + subtype_context
  - mechanism or genotype-correlation sentences that should become `causal_chains`

## Contamination guard

Reject or flag as contaminated if:
- cited sentence IDs do not exist in the recovered source file
- the proposed finding is not on the recovered source surface
- the critique imports content from another disease or chapter
- the critique depends on older Genovy policy that no longer applies

Do not merge contaminated suggestions.

## Expected audit style

Separate real problems from preference differences.

Use these buckets:
- `high_priority_fixes`
- `missing_supported_findings`
- `routing_or_schema_fixes`
- `policy_dependent_calls`
- `reject_or_ignore`
- `final_verdict`

Each concrete fix should cite sentence IDs from the recovered source file.

## Audit posture

The audit should improve:
- grounded completeness
- correct routing
- correct qualifier usage
- correct ambiguity preservation

The audit should not push the chapter backward into:
- multi-ref phenotype aggregation
- generic umbrella inflation
- unsupported ontology or graph inferences
- penetrance claims inferred from ascertainment or early asymptomatic states alone

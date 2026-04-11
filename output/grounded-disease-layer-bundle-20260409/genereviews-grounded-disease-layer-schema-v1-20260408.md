# GeneReviews Grounded Disease Layer Schema v1 (2026-04-08)

Purpose:
- Lock the one-pass canonical extraction schema for the 800-chapter GeneReviews run.
- Preserve enough structure for later ontology, weighting, graph, and biopharma work without asking the extractor to perform those downstream tasks.

Core principle:
- This schema is the canonical grounded disease layer.
- It is not the final ontology layer.
- It is not the final graph layer.
- It is not the final biopharma layer.

## Regime change

This replaces the earlier chapter-raw shape as the primary output target.

Old shape:
- `chapter`
- `sentence_index`
- `phenotypes.present / uncertain / excluded`
- `ancillary_clinical_evidence` grouped by domain
- `context_metadata`
- `context_evidence_refs`
- `context_notes`

New shape:
- `source_document`
- `phenotype_assertions[]`
- `ancillary_assertions[]`
- `context_assertions[]`
- `episode_classes[]`
- `trigger_factors[]`
- `trajectory_assertions[]`
- `causal_chains[]`
- `mechanism_sentence_ids[]`
- `extraction_notes[]`

Main design change:
- status becomes a field on each assertion, not a bucket
- domain becomes a field on each ancillary row, not a bucket
- context becomes assertion rows, not one flat object
- broad disease-state triggers can be isolated without duplicating them across phenotype rows
- disease course can be represented as explicit staged trajectory rows

## Top-level object

```json
{
  "schema_version": "grounded_disease_layer_v1",
  "extraction_policy_version": "strict_grounded_v1",
  "source_document": {},
  "phenotype_assertions": [],
  "ancillary_assertions": [],
  "context_assertions": [],
  "episode_classes": [],
  "trigger_factors": [],
  "trajectory_assertions": [],
  "causal_chains": [],
  "mechanism_sentence_ids": [],
  "extraction_notes": []
}
```

## 1. `source_document`

Required fields:
- `document_local_id`
- `disease_local_id`
- `nbk_id`
- `title`
- `mondo_id`
- `mode`
- `source`
- `source_url`
- `source_date`
- `sentence_index`

Recommended ID convention:
- `document_local_id = <nbk_id_or_sourceid>_<slug>`
- `disease_local_id = <nbk_id_or_sourceid>_<slug>`

`sentence_index` row:

```json
{
  "sentence_id": "p1_s1",
  "section": "Clinical Characteristics",
  "section_id": "clinical_characteristics",
  "paragraph_id": "p1",
  "text": "..."
}
```

Rules:
- full sentence index is mandatory
- every later evidence reference must point to a valid `sentence_id` in this array
- `mondo_id` is a nullable placeholder for downstream disease-ontology mapping; extraction should leave it `null` unless the input wrapper already supplies an explicit value

## 2. `phenotype_assertions[]`

This is the core object for the disease layer.

Fields:
- `assertion_local_id`
- `label_raw`
- `status`
- `clinical_role`
- `evidence_sentence_ids`
- `qualifiers`

Allowed `status` values:
- `present`
- `uncertain`
- `excluded`

Allowed `clinical_role` values:
- `primary`
- `descriptor`
- `complication`

Phenotype assertion shape:

```json
{
  "assertion_local_id": "ph_001",
  "label_raw": "feeding difficulties",
  "status": "present",
  "clinical_role": "primary",
  "evidence_sentence_ids": ["p1_s1"],
  "qualifiers": {
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
}
```

Rules:
- one concept per row
- phenotype rows must remain sentence-local and should carry exactly one `evidence_sentence_ids` value
- split coordinated findings when explicit
- keep umbrella rows only when the umbrella itself is clinically meaningful in the source
- use `null` when the qualifier slot exists but no grounded value is supported
- do not infer canonical labels from disease memory
- if `status = "excluded"`, the label must name the abnormality being ruled out, not the normal attribute that remains
- if `clinical_role = "descriptor"`, `subtype_context` must be non-null and should name the grounded parent finding
- use `management_condition` when the source makes a finding contingent on treatment, supervision, restriction, or other care context rather than on an acute precipitating exposure

Detail budget:
- commonly filled:
  - `onset`
  - `frequency`
  - `severity`
  - `subtype_context`
- sometimes filled:
  - `progression`
  - `trigger`
  - `treatment_response`
  - `management_condition`
- rarely filled:
  - `pathophysiology`
  - `laterality`
  - `distribution`
  - `anatomical_site`
  - `morphology`

## 3. `ancillary_assertions[]`

Ancillary assertions capture non-phenotype clinical evidence and management context.

Fields:
- `ancillary_local_id`
- `domain`
- `finding_raw`
- `status`
- `evidence_sentence_ids`
- `related_phenotype_assertion_ids`
- `qualifiers`

Allowed `domain` values:
- `laboratory`
- `imaging`
- `pathology`
- `electrophysiology`
- `treatment_response`
- `clinical_test`
- `management_context`
- `other`

Allowed `status` values:
- `present`
- `uncertain`
- `excluded`

Ancillary assertion shape:

```json
{
  "ancillary_local_id": "anc_001",
  "domain": "clinical_test",
  "finding_raw": "DNA methylation analysis identifies maternal-only imprinting within the Prader-Willi critical region",
  "status": "present",
  "evidence_sentence_ids": ["p2_s2"],
  "related_phenotype_assertion_ids": [],
  "qualifiers": {
    "timing": null,
    "frequency": null,
    "severity": null,
    "method": null,
    "specimen": null,
    "subtype_context": null
  }
}
```

Rules:
- use ancillary rows only for direct non-phenotype statements
- do not restate a phenotype as ancillary unless the modality context adds distinct value
- if an ancillary finding clearly supports a phenotype assertion, populate `related_phenotype_assertion_ids`

## 4. `context_assertions[]`

Disease-level facts that are not clean phenotype or ancillary rows.

Fields:
- `context_local_id`
- `field_name`
- `value`
- `evidence_sentence_ids`

Allowed `field_name` values:
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

Context assertion shape:

```json
{
  "context_local_id": "ctx_001",
  "field_name": "prevalence",
  "value": "The estimated prevalence of PWS is between 1:10,000 and 1:30,000 individuals.",
  "evidence_sentence_ids": ["p5_s1"]
}
```

Rules:
- only emit a context assertion when the field is explicitly supported
- do not create empty context rows
- prefer source-faithful wording over polished summary wording
- when multiple grounded statements populate the same `field_name`, prefer one coherent row with multiple evidence refs instead of fragmented duplicates

## 5. `episode_classes[]`

Optional extension for disease-level episode or attack states that would otherwise become too vague after slot export.

Fields:
- `episode_local_id`
- `label_raw`
- `label_normalized`
- `evidence_sentence_ids`
- `linked_manifestation_labels`
- `resolution_status`
- `resolution_note`

Episode-class shape:

```json
{
  "episode_local_id": "ep_001",
  "label_raw": "acute attacks of neurovisceral manifestations",
  "label_normalized": "acute neurovisceral attack",
  "evidence_sentence_ids": ["p15_s2"],
  "linked_manifestation_labels": [
    "abdominal pain",
    "tachycardia"
  ],
  "resolution_status": "resolved",
  "resolution_note": null
}
```

Rules:
- use this only when the source describes a broader disease state, attack class, or episode class
- keep `label_raw` source-faithful
- use `label_normalized` only to make the state self-sufficient outside chapter context
- use `resolution_status = "resolved"` when the episode label is slot-safe on its own
- use `resolution_status = "unresolved"` when the chapter mentions a broader state but does not resolve it to a slot-safe target
- use `resolution_status = "needs_enrichment"` when the target is partly grounded but lacks the detail needed for safe downstream export

## 6. `trigger_factors[]`

Optional extension for disease-level triggers that target a broader episode class or disease state rather than one phenotype row.

Fields:
- `trigger_local_id`
- `trigger`
- `target_type`
- `target_label`
- `target_raw`
- `target_episode_id`
- `target_resolution_status`
- `target_resolution_note`
- `evidence_sentence_ids`

Trigger-factor shape:

```json
{
  "trigger_local_id": "trig_001",
  "trigger": "alcohol",
  "target_type": "episode_class",
  "target_label": "acute neurovisceral attack",
  "target_raw": "acute attacks of neurovisceral manifestations",
  "target_episode_id": "ep_001",
  "target_resolution_status": "resolved",
  "target_resolution_note": null,
  "evidence_sentence_ids": ["p28_s1"]
}
```

Rules:
- keep `trigger` on a phenotype row only when the sentence clearly targets that one phenotype or symptom
- use `trigger_factors[]` when the trigger targets a broader attack state, disease course state, or syndrome-level flare
- use `target_resolution_status = "unresolved"` when the trigger target does not resolve to one specific phenotype, episode, or disease-state target
- use `target_resolution_status = "needs_enrichment"` when the target is partly grounded but still lacks enough specificity for safe downstream export
- do not discard vague targets; retain them with an explicit resolution status and a short `target_resolution_note`
- if a trigger points to an `episode_class`, populate `target_episode_id` when possible
- if the sentence states a care-dependent condition such as `if untreated`, `if not limited`, or `if uncontrolled externally`, do not force it into `trigger_factors`; prefer `management_condition` on the affected phenotype row

## 7. `trajectory_assertions[]`

Use this only when the source explicitly describes a time-ordered disease course.

Fields:
- `trajectory_local_id`
- `stage_order`
- `age_window`
- `summary`
- `manifestation_labels`
- `evidence_sentence_ids`

Trajectory assertion shape:

```json
{
  "trajectory_local_id": "traj_001",
  "stage_order": 1,
  "age_window": "early infancy",
  "summary": "severe hypotonia, poor appetite, and feeding difficulties",
  "manifestation_labels": [
    "severe hypotonia",
    "poor appetite",
    "feeding difficulties"
  ],
  "evidence_sentence_ids": ["p1_s1"]
}
```

Rules:
- do not force every chapter to have trajectory rows
- use them only when the chapter explicitly provides staged sequence or transition
- row-level `progression` qualifier still exists for local statements; `trajectory_assertions` are for disease-course sequence

## 8. `causal_chains[]`

Use this only for explicitly stated cause-effect links.

Fields:
- `causal_chain_local_id`
- `chain_type`
- `cause`
- `effect`
- `evidence_sentence_ids`

Allowed `chain_type` values:
- `molecular_mechanism`
- `clinical_consequence`

Causal chain shape:

```json
{
  "causal_chain_local_id": "chain_001",
  "chain_type": "molecular_mechanism",
  "cause": "somatic UBA1 pathogenic variants in hematopoietic stem cells",
  "effect": "autoinflammatory syndrome",
  "evidence_sentence_ids": ["p12_s1"]
}
```

Rules:
- prefer `molecular_mechanism` for gene, protein, pathway, cellular, or tissue-dysfunction mechanisms
- use `clinical_consequence` only for clearly stated, sentence-local clinical cause-effect links that are clinically useful
- do not emit weak `may contribute to` chains unless the causal relationship is central enough to the source sentence to preserve
- do not turn every complication or risk sentence into a causal chain
- keep one cause-effect link per row
- each chain must keep at least one grounded `evidence_sentence_ids` value

## 9. `mechanism_sentence_ids[]`

This is deterministic metadata derived from `causal_chains`.

Rule:
- compute as the unique union of `evidence_sentence_ids` from all grounded causal chains
- do not ask the model to fill it independently

## 10. `extraction_notes[]`

Structured decisions for ambiguous routing or decomposition.

Fields:
- `note_local_id`
- `decision`
- `rationale`
- `evidence_sentence_ids`

Extraction note shape:

```json
{
  "note_local_id": "note_001",
  "decision": "behavioral umbrella not emitted as a standalone phenotype assertion",
  "rationale": "The source uses the umbrella only as a category header and explicitly names the subordinate findings.",
  "evidence_sentence_ids": ["p1_s7"]
}
```

Rules:
- use notes sparingly
- record only decisions a later reviewer would need to reconstruct

## Hard rules

1. Every populated field must be justified by cited sentence IDs.
2. If a field is unsupported, leave it `null`, omit the row, or omit the context assertion.
3. Do not use outside disease knowledge.
4. Do not perform HPO mapping or generate new MONDO mappings in this layer; only preserve an explicitly supplied `mondo_id` placeholder.
5. Do not assign weights in this layer.
6. Do not create graph edges in this layer.
7. Do not emit biopharma interpretations in this layer.
8. Do not emit causal chains unless the cause-effect link is explicit in the cited sentence.
9. Do not use navigational list-header sentences such as `Major criteria`, `Minor criteria`, or `Occasional findings...` as evidence references.
10. Do not drop source-mentioned ambiguous content; retain it in the nearest grounded home and mark unresolved episode or trigger targets with an enrichment note when needed.
11. Every retained slot should survive decontextualization on its own or carry an explicit parent or target link that restores the missing context.
12. Do not aggregate phenotype qualifiers across multiple evidence sentences; split them into sentence-local rows instead.

## Why this schema exists

This schema is intended to be:
- strict enough for a one-pass 800-chapter run
- rich enough to support later normalization and weighting
- stable enough to avoid schema churn mid-program

Downstream layers can later add:
- ontology IDs
- assertion weights
- relation edges
- graph projections
- biopharma signals

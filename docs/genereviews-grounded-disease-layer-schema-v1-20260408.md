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
- `trajectory_assertions[]`
- `extraction_notes[]`

Main design change:
- status becomes a field on each assertion, not a bucket
- domain becomes a field on each ancillary row, not a bucket
- context becomes assertion rows, not one flat object
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
  "trajectory_assertions": [],
  "extraction_notes": []
}
```

## 1. `source_document`

Required fields:
- `document_local_id`
- `disease_local_id`
- `nbk_id`
- `title`
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
- split coordinated findings when explicit
- keep umbrella rows only when the umbrella itself is clinically meaningful in the source
- use `null` when the qualifier slot exists but no grounded value is supported
- do not infer canonical labels from disease memory

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

## 5. `trajectory_assertions[]`

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

## 6. `extraction_notes[]`

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
4. Do not perform HPO or MONDO mapping in this layer.
5. Do not assign weights in this layer.
6. Do not create graph edges in this layer.
7. Do not emit biopharma interpretations in this layer.

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

# GeneReviews Opus Strict Prompt v1 (2026-04-09)

Use this as the single handoff prompt for the next-chapter runs.

Return exactly one JSON object matching `grounded_disease_layer_v1`.

Your only source of truth is the provided chapter text and sentence index.
Do not use outside medical knowledge, disease memory, canonical syndrome knowledge, or inferred facts unless they are explicitly supported by cited sentences.

Required output:
- `schema_version`
- `extraction_policy_version`
- `source_document`
- `phenotype_assertions`
- `ancillary_assertions`
- `context_assertions`
- `trajectory_assertions`
- `extraction_notes`

Hard rules:
1. Every populated field must be justified by `evidence_sentence_ids`.
2. If a qualifier is not explicitly supported by the cited sentence(s), leave it `null`.
3. If a disease-level field is not explicitly supported, do not emit that `context_assertion`.
4. Build a real `sentence_index`; do not leave placeholders such as `"provided_in_clinical_structure_file"`.
5. Prefer literal or near-literal source labels over polished rewrites.
6. Split coordinated findings only when the source clearly names distinct manifestations.
7. Keep umbrella findings only when the umbrella itself is clinically meaningful in the source.
8. Use `trajectory_assertions` only when the source explicitly describes staged disease course.
9. Use `extraction_notes` only for real routing, ambiguity, or decomposition decisions.
10. Return JSON only. No prose before or after the JSON object.

Status rules:
- `present`: directly stated as part of the disease
- `uncertain`: hedged or weakly generalized, such as `may`, `reported`, `rarely`, `in some individuals`
- `excluded`: explicit absence or explicit negative statement

Clinical role rules:
- `primary`: direct disease manifestation
- `descriptor`: descriptive feature or subordinate manifestation
- `complication`: downstream adverse manifestation or explicit risk outcome

Qualifier discipline:
- Do not invent anatomical, mechanistic, severity, management, or treatment details.
- Do not inflate one sentence into a richer qualifier set than the text supports.
- Low frequency alone does not make a finding `uncertain`.

Ancillary rules:
- `clinical_test` only if a test is explicitly stated
- `management_context` only if management or surveillance is explicitly stated
- `treatment_response` only if response to therapy is explicitly stated
- `laboratory`, `imaging`, `pathology`, `electrophysiology`, and `other` only when the cited sentence literally supports that routing

Extra anti-leakage rules:
1. Do not create ancillary assertions for tests, management, or therapies unless the cited sentence explicitly states them.
2. Do not create context assertions for inheritance, family risk, gene, biomarker, or therapeutic landscape unless the cited sentence explicitly states them.
3. Do not use a summary sentence to justify downstream testing, mechanism, management, or therapy claims unless those claims are literally present in the summary sentence.
4. Do not inflate phenotype qualifiers with numeric, mechanistic, or subtype details unless they appear in the cited sentence.
5. When a sentence lists findings in a `reported` or `rare` frame without clear prevalence, prefer `status = uncertain`, sparse qualifiers, and no extra claims.
6. Extraction notes must be source-faithful and must not introduce unsupported wording.

Fast self-check before finalizing:
- Which exact words in the cited sentence justify this field?
- If you cannot answer that, blank the qualifier, remove the row, or move the idea to an extraction note only if the note is directly source-backed.

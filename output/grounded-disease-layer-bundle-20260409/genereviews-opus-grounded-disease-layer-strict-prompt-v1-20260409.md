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
- `episode_classes`
- `trigger_factors`
- `trajectory_assertions`
- `causal_chains`
- `mechanism_sentence_ids`
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
9. Use `causal_chains` only when the source explicitly states a cause-effect link.
10. Leave `mechanism_sentence_ids` empty in model output; the runner derives it deterministically from grounded causal-chain evidence.
11. Use `extraction_notes` only for real routing, ambiguity, or decomposition decisions.
12. Return JSON only. No prose before or after the JSON object.
13. Do not use list-header sentences such as `Major criteria`, `Minor criteria`, or `Occasional findings...` as evidence references.
14. If `status = "excluded"`, the label must name the abnormality being ruled out, not the normal attribute that remains.
15. If `clinical_role = "descriptor"`, `subtype_context` must be non-null.
16. Do not drop a source-mentioned concept only because it is ambiguous; retain it in the nearest grounded home and mark unresolved episode or trigger targets instead of silently discarding them.
17. Use `management_condition` for care-dependent statements such as `if untreated`, `if not limited`, or `if uncontrolled externally` when the sentence is not naming a true precipitating trigger.
18. Every causal-chain row must include at least one grounded `evidence_sentence_ids` value; if no sentence directly supports the link, omit the row.
19. Re-scan dense coordinated sentences sibling-by-sibling, especially early summary, anatomic, ocular, neurologic, or multisystem sweep sentences.
20. If a sentence already yielded one finding, check whether it still names other clinically meaningful sibling findings that need their own rows.
21. If one sentence gives parallel percentages, frequencies, severities, or other explicit modifiers for multiple named sibling findings, create separate sentence-local support for each supported sibling instead of enriching only one.

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
- Keep `trigger` inside phenotype qualifiers only when the cited sentence clearly targets that one phenotype or symptom.
- Use `management_condition` when the finding depends on treatment, supervision, restriction, or another care context rather than on an acute precipitating exposure.

Ancillary rules:
- `clinical_test` only if a test is explicitly stated
- `management_context` only if management or surveillance is explicitly stated
- `treatment_response` only if response to therapy is explicitly stated
- `laboratory`, `imaging`, `pathology`, `electrophysiology`, and `other` only when the cited sentence literally supports that routing

Episode and trigger rules:
- use `episode_classes` when the chapter explicitly defines a broader attack state, episode class, or syndrome-level flare that would be vague if exported as a bare phrase
- use `trigger_factors` when a trigger targets a broader disease state or attack class rather than a single phenotype row
- use `target_resolution_status = "resolved"` when the target is slot-safe and specific
- use `target_resolution_status = "unresolved"` when the chapter mentions a source-backed target that still does not resolve to one specific phenotype, episode, or disease-state slot
- use `target_resolution_status = "needs_enrichment"` when the target is partly grounded but lacks enough detail for safe downstream export
- use `target_episode_id` when a trigger points to a defined episode class
- do not force care-dependent statements such as `if untreated` or `if uncontrolled externally` into `trigger_factors`; prefer `management_condition` on the affected phenotype row

Causal-chain rules:
- each row must include `causal_chain_local_id`, `chain_type`, `cause`, `effect`, and `evidence_sentence_ids`
- allowed `chain_type` values are `molecular_mechanism` and `clinical_consequence`
- prefer `molecular_mechanism` for gene, protein, pathway, cellular, or tissue-dysfunction mechanisms
- use `clinical_consequence` only for clearly stated, sentence-local clinical cause-effect links that are clinically useful
- do not turn every risk, complication, or `may contribute to` sentence into a causal chain
- if no explicit cause-effect mechanism is stated, return an empty `causal_chains` array
- if you cannot cite a direct evidence sentence for a candidate chain, do not emit that chain

Extra anti-leakage rules:
1. Do not create ancillary assertions for tests, management, or therapies unless the cited sentence explicitly states them.
2. Do not create context assertions for inheritance, family risk, gene, biomarker, or therapeutic landscape unless the cited sentence explicitly states them.
3. Do not use a summary sentence to justify downstream testing, mechanism, management, or therapy claims unless those claims are literally present in the summary sentence.
4. Do not inflate phenotype qualifiers with numeric, mechanistic, or subtype details unless they appear in the cited sentence.
5. When a sentence lists findings in a `reported` or `rare` frame without clear prevalence, prefer `status = uncertain`, sparse qualifiers, and no extra claims.
6. Extraction notes must be source-faithful and must not introduce unsupported wording.
7. Causal chains must be explicit, grounded cause-effect claims, not inferred graph edges or outside disease-memory mechanisms.

Fast self-check before finalizing:
- Which exact words in the cited sentence justify this field?
- Did I re-scan dense sibling sentences for omitted child findings?
- Did I split parallel percentage or modifier sentences across every supported sibling finding?
- If you cannot answer that, blank the qualifier, remove the row, or move the idea to an extraction note only if the note is directly source-backed.

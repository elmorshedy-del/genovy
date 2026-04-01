# GeneReviews Deterministic Verifier Spec 2026-03-31

## Goal
- keep LLM extraction as a drafting step
- make publishability a deterministic proof step

## Pre-100 implementation target
- do **not** change ingestion behavior yet
- add a deterministic verifier that audits current enriched outputs
- use the verifier to define the hard rules for future auto-accept

## Current verifier contract
The first implementation checks these rules per feature row:

1. `phenotype_presence`
- source sentence must exist in cached chapter text
- source sentence must contain either:
  - `match_text`
  - or `hpo_label`

2. `frequency_support`
- if a frequency is claimed, deterministic frequency extraction from the source sentence or local context must reproduce it

3. `onset_support`
- if an onset is claimed, deterministic onset extraction from the source sentence must reproduce it

4. `clause_attachment`
- if an onset is claimed, phenotype phrase and onset phrase must not be separated by a hard clause boundary

5. `alias_shadow`
- if the phenotype mention appears inside a longer enclosing phrase, flag it

6. `disease_subtype_leak`
- if the onset phrase appears inside a disease/subtype phrase rather than a phenotype-local phrase, flag it

7. `excluded_status`
- if a row is `excluded`, the sentence should contain an obvious negative lexical marker

## Output contract
The verifier emits, for each feature row:
- `VERIFIED`
- `FLAGGED`
- `FAILED`

plus:
- per-check status
- human-readable reason
- source sentence
- feature identifiers

## Why this is only phase 1
This verifier uses current sentence-level evidence fields.
It is useful immediately, but it is not the final publish gate because it does not yet have:
- char offsets
- field-level spans
- section ids
- table-derived support rows

## Phase 2 upgrades before serious auto-accept
1. add row-level provenance:
- `sentence_id`
- `section_id`
- `text_hash`

2. add field-level spans:
- `phenotype_span`
- `frequency_span`
- `onset_span`
- `progression_span`
- `treatment_response_span`

3. add deterministic table parser
- parse table phenotype/frequency rows as a separate source

4. add stronger attachment layer
- clause-local now
- dependency parse for ambiguous modifier cases later

## Auto-accept direction
Future auto-accept should require:
- deterministic verifier passes hard checks
- no alias-shadow flag
- no disease-subtype leakage flag
- no ambiguous attachment
- explicit disease target in policy

Anything ambiguous should fail closed.

## What this means for the 100-chapter run
- use the verifier as an audit engine
- keep the run review-first
- use verifier failures/flags to prioritize review
- do not auto-accept broadly yet

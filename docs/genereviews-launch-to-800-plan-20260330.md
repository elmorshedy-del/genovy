# GeneReviews Launch-To-800 Plan

## Goal

Launch the repaired GeneReviews enrichment pipeline across the full chapter set without repeatedly rerunning unchanged stages.

The immediate objective is not broad autoaccept.
The immediate objective is a stable, review-first production-style run across the full GeneReviews corpus with the current best architecture.

## Proven Components

These parts are already repaired enough to treat as the working base:

- Stage 1: fetch + clean GeneReviews clinical prose
- Stage 2: graph lexicon anchors + local PhenoTagger supplement
- Stage 3: Gemini Flash candidate discovery
- Stage 4: BioLORD mapping on the repaired local Python 3.10 + numpy top-k path
- Stage 6: review-first manifest gate

These should not be re-litigated unless a real bug appears.

## Open Decisions

Only two major choices are still open:

1. Stage 5 default metadata model
   - current proven path: `gemini-3-pro-preview`
   - intended comparison path: `medgemma-27b-text-it`

2. Stable negation/excluded handling layer
   - current stable path: no old NegBio parser stack
   - intended replacement: explicit lightweight negation layer on top of stable anchor extraction

## Efficiency Rule

Do not rerun the full pipeline when only one stage is under test.

Use this rule:

- if Stage 5 changes:
  - reuse Stage 1-4 outputs
  - rerun only Stage 5-6

- if negation logic changes:
  - rerun only the earliest stage it truly affects, then downstream stages
  - do not rerun fetch if the chapter text did not change

- do not run the full `800` until:
  - one metadata default is chosen
  - one stable negation strategy is chosen
  - one intermediate slice has completed cleanly

## Final Architecture For Launch

The launch architecture should currently be treated as:

1. fetch + clean chapter text
2. deterministic anchors
   - graph lexicon
   - local PhenoTagger supplement
3. broad candidate discovery
   - Gemini Flash
4. HPO mapping
   - lexical exact/synonym
   - BioLORD semantic mapping
5. metadata extraction
   - deterministic frequency/onset first
   - one narrow LLM fallback model
6. cleanup + review-first output
   - dedupe
   - parent/child collapse
   - excluded / negated handling
   - manifest vs review queue

For launch readiness, the only unresolved default in this architecture is the Stage 5 model and the final negation layer.

## Decision Procedure

### Step A: Freeze Stage 1-4

Treat the repaired Stage 1-4 outputs as frozen unless a concrete bug appears.

That means:

- local PhenoTagger path stays
- DB public proxy fallback stays
- repaired BioLORD Python path stays
- Gemini Flash stays for candidate discovery

### Step B: Run One Metadata Comparison Slice

Use a single fixed evaluation slice, not repeated changing slices.

Recommended slice:

- the repaired settled `latest5` slice
- reuse the already frozen Stage 1-4 outputs
- do not expand the comparison slice unless the Stage-5 choice remains ambiguous after this control run

Compare only:

- `gemini-3-pro-preview`
- `medgemma-27b-text-it`

on the same frozen Stage 1-4 outputs.

Evaluate:

- correctness of frequency/onset/progression/treatment-response extraction
- grounding to real evidence sentence
- hallucination rate
- JSON stability
- runtime
- cost

Pick one default.

### Step C: Add Negation On The Same Slice

Do not revive the old brittle NegBio parser chain.

Build a lightweight explicit negation layer that works on:

- matched phenotype mention
- local sentence window
- optional paragraph window

Apply it after anchor extraction and before final cleanup.

Test it only on the same fixed validation slice.

Goal:

- correctly mark explicit absence/exclusion cases
- avoid wiping out positive mentions through overbroad negation

### Step D: Run A Medium Review-First Pilot

Once Stage 5 default and negation are chosen:

- run `100` chapters review-first
- do not change architecture during that run

Check:

- crash-free execution
- output completeness
- review queue quality
- whether any stage summary is polluted by stale rerun artifacts

If clean, proceed.

### Step E: Launch The Full 800

Then run the full GeneReviews corpus:

- review-first mode
- with stable output directories
- with progress files per stage
- with no architecture changes during the run

This should be the first true full-corpus run after the decision gates are complete.

## Output Discipline

To avoid polluted summaries:

- when rerunning a stage after a failed run, prefer a fresh output directory or a clearly labeled clean rerun directory
- do not overwrite a mixed-error output and then trust the old summary
- keep old outputs for traceability, but mark clean authoritative reruns separately

## Practical Next Move

The next efficient move is:

1. reuse the repaired settled `latest5` slice as the control slice
2. reuse the frozen Stage 1-4 path
3. run only Stage 5-6 on that slice for the remaining model comparison
4. choose the Stage 5 default
5. implement the lightweight negation layer
6. run the same `latest5` slice again
7. if clean, run `100`
8. then launch `800`

## Current Read

As of the repaired `latest5` settled run:

- the pipeline is executable end to end in review-first mode
- current clean result is:
  - `5` chapters processed
  - `0` manifest rows
  - `5` review rows

This is acceptable for launch preparation.
It means the pipeline is working conservatively, which is the right bias before the full `800`.

Update after the narrow MedGemma comparison:

- the fixed settled `latest5` comparison is now done
- MedGemma matched Gemini on completion and review routing
- MedGemma improved metadata coverage:
  - frequency: `37 -> 40`
  - onset: `4 -> 34`
- the next real blocker before scale-out is negation / excluded-handling stability, not Stage 5 model selection

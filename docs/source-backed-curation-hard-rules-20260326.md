# Genovy DX Source-Backed Curation Hard Rules

Created:
- 2026-03-26

Purpose:
- Prevent benchmark-tail cleanup from polluting the Genovy knowledge graph.
- Keep enrichment work scientifically defensible and auditable.

## Core rule

The benchmark may identify a possible gap.

The benchmark may **not** author truth.

In plain language:
- never add a term because it helps a case
- never "cheat" a gene to a higher rank
- never mutate the graph directly from benchmark pressure

## Non-negotiable rules

1. Benchmark outputs are hypothesis generators only
- A miss can suggest:
  - the truth branch may be thin
  - the wrong disease branch may be winning
  - the support seam may be broken
- A miss cannot, by itself, justify a new phenotype assertion.

2. Every promoted term must be independently source-backed
- Valid promotion sources:
  - OMIM
  - GeneReviews
  - trusted disease curation
  - strong case-series literature
- Invalid promotion reason:
  - "this term helped the truth gene win"

3. Always distinguish seam repair from profile enrichment
- Seam repair:
  - restore or strengthen `gene -> disease` support
- Profile enrichment:
  - improve the phenotype surface of an already valid disease node
- Do not use enrichment to hide a broken support seam.

4. Shadow first, promote later
- New candidate terms go into a shadow profile first.
- No benchmark-tail enrichment goes directly into the real graph.
- Real graph promotion happens only after source proof and shadow validation.

5. Promote at the disease level, not the case level
- Terms belong to a syndrome profile, not to one benchmark patient.
- If a term is not defensible at the syndrome level, do not add it.

6. Validate at three levels
- target case
- full truth-gene family slice
- full 100-case benchmark

7. Keep provenance and rationale
- Every promoted term should have:
  - source
  - disease ID
  - reason it was added
  - date of addition

8. If source evidence is absent, record the gap instead of improvising
- "open evidence hole" is an acceptable outcome
- invented truth is not

## Safe workflow

1. Identify the miss
2. Inspect who beats the truth gene
3. Extract discriminating terms as a **hypothesis**
4. Check whether those terms are truly documented for the truth syndrome
5. Add only the source-backed subset into a shadow disease profile
6. Rerun:
- the target case
- all cases for the truth gene
- the full benchmark
7. Only then consider promotion

## Why this rule exists

The March 24-25 STXBP1 work proved two things at once:
- benchmark-driven inspection is useful for finding the missing surface
- naive benchmark-driven enrichment can easily drift toward overfit if it is not source-validated

The March 25 handoff-floor work proved a second point:
- scorer changes can unlock real value from existing evidence
- but they can also expose fragile cases like `U2AF2`

So Genovy now needs stronger curation discipline, not weaker discipline.

## Current immediate application

- `U2AF2`:
  - treat as seam repair plus possible profile enrichment
  - do not pretend it is just another undercovered branch
- `STXBP1`:
  - discriminating-term loop is allowed only when the terms are independently documented for `DEE4`
- all remaining misses:
  - same rule

## Status
- active hard rule

# GeneReviews Symmetric Honest Pipeline

## Goal

Engineer a GeneReviews enrichment path that is:

- symmetric across the graph, not truth-gene-only
- honest about where GeneReviews exists and where it does not
- explicit about mixed chapters versus disease-specific chapters
- reviewable before any staging apply

## Why the older global builder was not enough

The earlier global builder could take extracted chapter features and write them onto a disease as soon as the chapter title resolved. That is acceptable for pilot experiments and not acceptable for an honest whole-graph layer because it hides three different failure modes:

- chapter exists, but the disease mapping is ambiguous
- chapter is mixed or syndrome-level, so phenotype scope is not safe for auto-ingest
- chapter does not exist for the disease at all

Those need to stay visible as first-class outputs, not disappear as silent omissions.

## New design

### 1. Roster

The roster is the universe of known GeneReviews chapters plus current graph mapping status.

- built from the GeneReviews title index
- records chapter title, path, URL, and graph mapping status

### 2. Chapter policy

Every chapter now needs an explicit policy record before it can auto-ingest:

- `ingestionDecision`
- `chapterScope`
- `targetingMode`
- `diseaseTargets`
- `notes`

Default rule:

- no explicit policy means `review_required`

This is the honesty guardrail.

### 3. Honest manifest builder

The new builder joins:

- extracted GeneReviews payloads
- the roster
- the explicit chapter policy

and produces four separate outputs inside one JSON artifact:

- `acceptedEntries`
- `reviewQueue`
- `coverageGaps`
- `chapterAudit`

### 4. Auto-accept rule

A GeneReviews chapter only creates accepted disease-phenotype rows when all of the following are true:

- the chapter has an explicit policy
- `ingestionDecision = auto_accept`
- disease targets are explicitly listed
- the targets resolve in the graph
- each phenotype label grounds safely to an HPO entity

If any of those fail, the chapter or feature is routed to review or to coverage gaps.

## Symmetry rule

GeneReviews is not inherently symmetric because coverage is uneven. The engineering answer is not to pretend otherwise. The engineering answer is:

- define the full chapter roster
- define the full disease mapping state
- define the explicit coverage gaps
- apply accepted chapters uniformly wherever the same chapter policy says they belong

So symmetry here means:

- same rules for every chapter
- same provenance shape for every accepted row
- same explicit gap accounting for every missing or unsafe chapter

## Honesty rule

The builder must never infer more than the source actually says.

- if onset is not explicit, keep onset `null`
- if frequency is not explicit, keep frequency `null`
- if chapter scope is mixed, do not auto-ingest
- if disease mapping is ambiguous, do not auto-ingest
- if phenotype grounding is unsafe, route to review

## Provenance rule

Every accepted row carries:

- `sourceKey = genereviews_nlp`
- `referenceText = GeneReviews:NBKxxxxxx`
- `sourceRecordKey`
- `provenanceUrl`
- extracted sentence
- grounding mode
- chapter policy metadata in payload

## Scripts

- `src/scripts/generateGeneReviewsChapterPolicyTemplate.js`
  - creates the reviewable chapter-policy template from the roster

- `src/scripts/buildGeneReviewsHonestSymmetricManifest.js`
  - builds the honest review-first manifest using the roster, chapter policy, and extracted payloads

## Practical workflow

1. Build or refresh the roster.
2. Generate the chapter policy template.
3. Review and fill policy decisions for safe chapters.
4. Run the honest manifest builder.
5. Inspect `acceptedEntries`, `reviewQueue`, `coverageGaps`, and `chapterAudit`.
6. Only then consider staging apply.

This keeps GeneReviews as a controlled source layer instead of a silent asymmetric overlay.

# Phase Index

## 1. Pre-freeze heuristic and walkback

Purpose:
- early scorer and support-path experiments before the freeze split

Bundles:
- child-direct reroute:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260320-child-direct-walkback/summary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260320-child-direct-walkback/summary.md)
- child-profile borrow:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260320-child-borrow-walkback/summary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260320-child-borrow-walkback/summary.md)
- support-direct preference:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260321-support-direct-walkback/summary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260321-support-direct-walkback/summary.md)

Read:
- these experiments mostly falsified the idea that the remaining miss tail would be solved by another small support-path heuristic

## 2. Freeze and controlled split

Purpose:
- create a preserved benchmark baseline and separate working environment

Anchors:
- non-negotiable plan:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genovy-non-negotiable-fixes.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genovy-non-negotiable-fixes.md)
- phase 0 freshness audit:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260322-phase0-source-freshness/summary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260322-phase0-source-freshness/summary.md)
- phase 1 identity repair:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260322-phase1-identity-repair/summary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260322-phase1-identity-repair/summary.md)

Read:
- this is where `v0` freeze became real and `v1-working` became the mutation target

## 3. Post-ClinVar bridge and benchmark

Purpose:
- replay ClinVar bridge work and measure what it actually bought

Bundle:
- post-ClinVar run54:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260323-post-clinvar-run54/summary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260323-post-clinvar-run54/summary.md)

Read:
- ClinVar bridge was real and useful
- gain was narrow, not transformative

## 4. Handoff-floor scoring evolution

Purpose:
- isolate the disease-to-gene handoff leak and test how far a global rule can push the benchmark

Bundles:
- generic `1.0` shadow:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260325-generic-handoff-floor-w1-shadow/summary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260325-generic-handoff-floor-w1-shadow/summary.md)
- official real-`v1` benchmark:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260326-official-real-v1-handoff-floor-1.0/summary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260326-official-real-v1-handoff-floor-1.0/summary.md)

Read:
- this is the current strongest rule-based scorer lineage
- this is also where Genovy clearly beats Exomiser on ranking metrics

## 5. Integrity recovery and lineage correction

Purpose:
- explain the project-memory rupture, Railway drift, and DB-lineage confusion

Bundle:
- DB lineage recovery:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260326-db-lineage-recovery/summary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260326-db-lineage-recovery/summary.md)

Read:
- this is the main structural correction that restored trust in the later work

## 6. Gene-focused miss-tail investigations

Purpose:
- inspect the remaining misses without cheating or overfitting

Bundles in atlas now:
- U2AF2 real-`v1` OMIM shadow:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260326-u2af2-real-v1-omim-shadow/summary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260326-u2af2-real-v1-omim-shadow/summary.md)
- ANKRD11 symmetric source shadow:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260326-ankrd11-symmetric-source-shadow/summary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260326-ankrd11-symmetric-source-shadow/summary.md)
- ANKRD11 symmetric OMIM shadow:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260326-ankrd11-symmetric-omim-shadow/summary.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260326-ankrd11-symmetric-omim-shadow/summary.md)

Important direct docs not yet bundled separately:
- STXBP1 audits and shadows:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-single-case-audit-20260325.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-single-case-audit-20260325.md)
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-disease-branch-audit-20260325.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-disease-branch-audit-20260325.md)
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-discriminating-term-shadow-test-20260325.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/stxbp1-discriminating-term-shadow-test-20260325.md)

## 7. Preservation surfaces

Purpose:
- preserve the whole bibliotheca without deleting anything

Anchors:
- chronology manifest:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/chronology-manifest-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/chronology-manifest-20260326.md)
- artifact location map:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/artifact-location-map-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/artifact-location-map-20260326.md)
- backup verification:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/db-backup-verification-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/db-backup-verification-20260326.md)

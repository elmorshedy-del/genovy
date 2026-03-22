## Summary

Freeze the current Genovy DX benchmark state as a reproducible file-safe `v0` branch before new ingestion, freshness, enrichment, and scoring work starts.

This PR preserves:
- the active code and script state from the benchmark worktree
- the main DX docs, diary, handoff, and strategic audit
- the important root-level benchmark and audit artifacts that previously lived only in ignored `output/`
- the consultant packet and renamed walkback sequence
- the non-negotiable fixes plan that will drive the next iteration

## Why

The current build is a rare strong baseline:
- found: 82
- top-1: 34
- top-5: 46
- top-10: 58
- MRR: 0.4097

That state should be preserved before Phase 0+ work changes the codebase and graph again.

## Included

### Core docs
- `docs/genovy-dx-handoff.md`
- `docs/genovy-dx-project-log.md`
- `docs/genovy-dx-diary.md`
- `docs/OpusAudit1.md`
- `docs/genovy-non-negotiable-fixes.md`
- `docs/benchmark-commands.md`

### New/updated implementation files
- benchmark runner scripts
- truth coverage / missed-gap / source-backed audit scripts
- shadow benchmark scripts
- supporting script libraries
- current scorer/package changes already present in the active worktree

### Freeze bundle
- `freeze/v0/artifacts/output-root/`
  - important root-level benchmark JSONs, markdown audits, report TSV/TXT/YAML files, transcripts, and split-report directories copied out of ignored `output/`
- `freeze/v0/consultant/`
  - consultant source files, walkback sequence, and `missed-gene-buckets.html`

## Excluded on purpose

- bulky generated run directories under `output/`
- raw benchmark corpora/testdata directories
- live database state

## Follow-up after merge

1. create immutable `v0` tag from the merged commit
2. take a full matching database snapshot
3. clone the database into a working successor
4. start Phase 0 source freshness audit
5. then proceed through Phase 1 pipeline fixes, Phase 2 enrichment, and Phase 3 scoring work

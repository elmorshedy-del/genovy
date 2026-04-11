# Benchmark Source Of Truth

Date: 2026-04-09

## Purpose

This note locks the default Genovy benchmark reference to the file-backed March 29 saved branch instead of letting later conversations drift to the safer but weaker baseline.

## Default Benchmark

When someone says "the benchmark" or "the Genovy benchmark," use the saved March 29 stronger branch:

- found: `92`
- top-1: `42`
- top-3: `53`
- top-5: `57`
- top-10: `65`
- median rank: `2`
- MRR: `0.503832`

Rounded copy form is allowed:

- `92%`
- `42%`
- `53%`
- `57%`
- `65%`
- `median rank 2`
- `MRR 0.504`

## Trace Order

Always resolve the benchmark in this order:

1. Reconciliation anchor:
   - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/benchmark-lineage-reconciliation-87-vs-92-20260330.md`
2. Target branch summary:
   - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260329-official-v1-enrich-structured-plus-manual-curated/summary.md`
3. Machine-readable target artifact metadata:
   - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiments/20260329-official-v1-enrich-structured-plus-manual-curated/artifacts.json`
4. Experiment chooser / lineage map:
   - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiment-manifest.md`

Downstream website or presentation files are not source of truth. They are consumers.

## Alternate Benchmark States

These are real, but they are not the default benchmark unless the question explicitly asks for them.

### Current safe working baseline

Use only for questions about the current no-regression working line, replay safety, or current baseline status.

- file:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/benchmark-lineage-reconciliation-87-vs-92-20260330.md`
- benchmark:
  - `87 / 42 / 51 / 53 / 62 / 0.4887`

### Handoff-floor scorer slice

Use only for questions specifically about the handoff-floor scorer artifact.

- file:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/official-handoff-floor-1.0-benchmark-20260325.md`
- benchmark:
  - `84 / 42 / 52 / 53 / 60 / 0.485974`

## Resolution Rule

If multiple benchmark states are visible in the repo:

- do not choose the lowest or safest number by default
- do not treat "current baseline" as the same thing as the headline benchmark
- default to the March 29 saved stronger branch at `92%`
- mention `87%` or `84%` only as alternate lineage when the question explicitly asks for baseline or scorer-slice context

## Why This Exists

The project contains multiple valid benchmark states:

- saved stronger historical branch
- current safe working baseline
- handoff-floor scorer slice

The repeated failure mode was mentally collapsing these into one benchmark and then defaulting to the conservative line. This note prevents that.

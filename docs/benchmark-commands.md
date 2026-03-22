# Benchmark Commands

These commands run on your Mac terminal against the current repo code and whatever `DATABASE_URL` is in `.env`.

The wrappers auto-detect the real output folder:

- first choice: this worktree's `output/` if it contains the phenopackets
- fallback: `/Users/ahmedelmorshedy/Genovy/output`
- override anytime with `GENOVY_OUTPUT_DIR=/path/to/output`

## Official benchmark

```bash
cd /Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914
npm run dx:benchmark:official
```

Optional custom run name:

```bash
npm run dx:benchmark:official -- my-run-name
```

## Shadow test for child-direct reroute

This does not change DB rows or core DX code. It only writes timestamped output files.

```bash
cd /Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914
npm run dx:benchmark:shadow-child
```

Optional custom run name:

```bash
npm run dx:benchmark:shadow-child -- my-shadow-run
```

## Shadow test for child-direct profile borrow

This keeps the existing gene to disease support links and only borrows direct child-disease phenotype rows into propagated-only parent disease profiles in shadow mode.

Single-process:

```bash
cd /Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914
npm run dx:benchmark:shadow-child-borrow
```

Parallel example:

```bash
cd /Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914
GENOVY_BENCHMARK_WORKERS=4 npm run dx:benchmark:shadow-child-borrow -- my-borrow-run
```

This still does not change DB rows or core DX code. It shards the 100-case run into parallel workers and merges the final report.

## Show latest result

```bash
cd /Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914
npm run dx:benchmark:latest
```

## Rollback for a shadow run

Delete only the shadow output files:

```bash
rm -f /Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-child-direct-*.json \
      /Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-child-direct-*.md \
      /Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-child-profile-borrow-*.json \
      /Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/shadow-child-profile-borrow-*.md
```

The official and shadow commands both:

- source `.env` if present
- require `DATABASE_URL`
- use the local phenopackets and Exomiser result files already in `output/`

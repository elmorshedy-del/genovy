# Genovy v0 Freeze

This directory preserves the file-based state of the first serious Genovy DX benchmark build that became competitively close to Exomiser on the official 100-case run.

Canonical benchmark position at freeze time:
- found: 82
- top-1: 34
- top-5: 46
- top-10: 58
- MRR: 0.4097

Primary narrative docs:
- `../../docs/genovy-dx-handoff.md`
- `../../docs/genovy-dx-project-log.md`
- `../../docs/genovy-dx-diary.md`
- `../../docs/OpusAudit1.md`
- `../../docs/genovy-non-negotiable-fixes.md`

Included here:
- `artifacts/output-root/`
  - root-level benchmark summaries, audit reports, benchmark JSONs, transcripts, and split-report directories copied from the ignored `output/` tree
- `consultant/`
  - consultant packet source files, walkback sequence, and the missed-gene buckets HTML

Intentionally not included here:
- bulky generated run directories and testdata directories from `output/`
- raw benchmark corpora and large reproducible exports
- live database state

This freeze is file-safe, not database-complete. A full Genovy `v0` restore still requires a matching database snapshot.

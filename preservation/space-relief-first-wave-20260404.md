## Space Relief First Wave 2026-04-04

The following preservation items were moved out of this repository to free local disk space:

- `codex-rollout-2026-03-14-main-thread-20260326.jsonl`
- `codex-main-thread-split-20260326/`
- `original-output-snapshot-20260326/`

Archive destination:
- `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/preservation/20260404-first-wave-archive-from-canonical-repo/`

Detailed archive manifest:
- `gs://ahmed-cold-storage-20260326/genovy-artifacts-march-2026/preservation/20260404-first-wave-archive-from-canonical-repo/ARCHIVE_MANIFEST.md`

Bucket storage details:
- `original-output-snapshot-20260326` was stored in the bucket as `original-output-snapshot-20260326.tar`

What stayed here on purpose:
- `codex-rollout-2026-03-14-main-thread-20260326.jsonl.gz`
- `codex-genovy-thread-history-20260326/`
- `bucket-critical/`

Reason:
- keep one full preserved main-thread copy locally in-repo
- preserve active GeneReviews readiness artifacts
- move redundant and historical preservation copies off the active repo path

Local staging note:
- the temporary local staging folder under `/Users/ahmedelmorshedy/Genovy-preservation-backups/` was deleted after bucket verification

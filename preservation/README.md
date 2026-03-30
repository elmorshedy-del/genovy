## Genovy Preservation Library

This directory is the canonical local library for Genovy file-based preservation after the March 2026 continuity and environment drift issues.

Goals:
- preserve the pre-freeze, freeze, and post-freeze research/code/artifact lineage
- keep stranded original-repo outputs visible from the canonical clone
- preserve Codex thread history references alongside the engineering artifacts
- document database lineage so benchmark conclusions are tied to the correct DB state

Key local preservation roots:
- Canonical repo:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914`
- Timestamped local backup bundle:
  - `/Users/ahmedelmorshedy/Genovy-preservation-backups/20260326-024058`

Key preserved surfaces:
- `original-output-snapshot-20260326/`
  - clone copy of `/Users/ahmedelmorshedy/Genovy/output`
- `clone-output-snapshot-20260326/`
  - clone copy of `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output`
- `codex-rollout-2026-03-14-main-thread-20260326.jsonl`
  - clone copy of the main live Genovy Codex thread
- `codex-archived-sessions-20260326/`
  - clone copy of archived Codex side-thread sessions
- `codex-main-thread-split-20260326/`
  - GitHub-safe split form of the gzipped main Genovy Codex thread
- `codex-genovy-thread-history-20260326/`
  - small GitHub-safe subset of Genovy-specific archived thread files

Supporting manifests:
- `backup-state-20260326.md`
- `db-lineage-audit-20260326.md`
- `chronology-manifest-20260326.md`
- `git-history-audit-20260326.md`
- `artifact-location-map-20260326.md`
- `codex-genovy-thread-history-manifest-20260326.md`

Important rule:
- do not delete original sources after consolidation
- if duplicates are needed for clarity, keep both and label the preserved copy explicitly

GitHub rule:
- large raw local-only files may stay on disk untracked when a GitHub-safe split/manifest form exists
- database dumps stay outside the repo in the timestamped backup root

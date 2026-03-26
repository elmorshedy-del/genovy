## Backup State 2026-03-26

This document records the preservation actions taken before deeper reorganization/audit work.

### Local file backups

Timestamped backup root:
- `/Users/ahmedelmorshedy/Genovy-preservation-backups/20260326-024058`

Copied into that root:
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914`
- `/Users/ahmedelmorshedy/Genovy`
- Codex state metadata:
  - `session_index.jsonl`
  - `.codex-global-state.json`
  - `railway-config.json`

Preserved in the canonical clone via APFS clone copies:
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326`
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/clone-output-snapshot-20260326`
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/codex-rollout-2026-03-14-main-thread-20260326.jsonl`
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/codex-archived-sessions-20260326`

GitHub-safe split form created for the large main Genovy Codex thread:
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/codex-main-thread-split-20260326`

GitHub-safe project-specific Codex history subset:
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/codex-genovy-thread-history-20260326`

Sanitized Railway mapping snapshot copied into the canonical clone:
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/railway-config-sanitized-20260326.json`

### Codex chat durability

One-off Codex backup completed with:
- `python3 /Users/ahmedelmorshedy/.codex/skills/codex-chat-autosave/scripts/backup_codex_chat_state.py backup`

Resulting snapshot root:
- `/Users/ahmedelmorshedy/.codex/chat-autosave-backups`

Latest snapshot at time of preservation:
- `/Users/ahmedelmorshedy/.codex/chat-autosave-backups/snapshots/20260326T064120Z`

Latest full SQLite checkpoint at time of preservation:
- `/Users/ahmedelmorshedy/.codex/chat-autosave-backups/full/20260326T064146Z`

Recurring autosave installed:
- launchd label: `com.openai.codex-chat-autosave`
- plist:
  - `/Users/ahmedelmorshedy/Library/LaunchAgents/com.openai.codex-chat-autosave.plist`

### Railway preservation environments

Created labeled environment duplicates:
- `prod-pres-0326`
- `v0-pres-0326`
- `v1-pres-0326`

Important finding:
- Railway environment duplication preserves app/config state, but it is not sufficient by itself as a trusted database backup.
- The duplicated environments did not present the expected Genovy tables when queried through the app-selected DB service.

### True database backups

Authoritative DB backups are local compressed dumps written to:
- `/Users/ahmedelmorshedy/Genovy-preservation-backups/20260326-024058/db-dumps`

Target files:
- `genovy-production-20260326.dump`
- `genovy-v0-freeze-20260322-backup-20260326.dump`
- `genovy-v1-working-20260322-backup-20260326.dump`

At the time this document was written:
- production dump: completed
- v0 freeze dump: completed
- v1 working dump: in progress / verify final completion before closing the preservation phase

Important hard correction discovered during this backup phase:
- `production` and `v0-freeze` are the small `81,870`-entity lineage
- real Railway `v1-working` is the large `3,251,168`-entity lineage
- every future audit must state which lineage it queried

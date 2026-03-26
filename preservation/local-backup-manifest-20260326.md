## Local Backup Manifest 2026-03-26

This manifest describes the authoritative local preservation bundle created before deeper repair work resumed.

### Backup root

- `/Users/ahmedelmorshedy/Genovy-preservation-backups/20260326-024058`

### Main preserved directories

- `Genovy/`
  - local preservation copy of the original repo
- `Genovy-phenotype-enrichment-20260316-0914/`
  - local preservation copy of the canonical working clone
- `db-dumps/`
  - authoritative local Railway DB dumps

### Database dump targets

- `genovy-production-20260326.dump`
- `genovy-v0-freeze-20260322-backup-20260326.dump`
- `genovy-v1-working-20260322-backup-20260326.dump`

### Verification rule

This file must only be treated as complete once:
- all three dump files exist
- the `v1-working` dump has finished
- each dump has a recorded SHA-256 checksum
- each dump has been sanity-checked with `pg_restore -l`

### Notes

- Railway duplicate environments are useful labeled preservation copies for app/config, but they are not the authoritative DB backups.
- The authoritative DB preservation is the local dump set under `db-dumps/`.

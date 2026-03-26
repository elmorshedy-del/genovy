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

This file is complete once:
- all three dump files exist
- the `v1-working` dump has finished
- each dump has a recorded SHA-256 checksum
- each dump has been sanity-checked with `pg_restore -l`

### Final dump sizes

- `genovy-production-20260326.dump`
  - `210M`
- `genovy-v0-freeze-20260322-backup-20260326.dump`
  - `209M`
- `genovy-v1-working-20260322-backup-20260326.dump`
  - `2.3G`

### SHA-256 checksums

- `255284d540b1da9e9c4a35472867280caab6f26ed0f4efbd9bd16b2cfa86729e`
  - `genovy-production-20260326.dump`
- `bb07d43e59737eda2f2ec92a3ed4200d86720ddd1797698b53b8c61fa8c89b64`
  - `genovy-v0-freeze-20260322-backup-20260326.dump`
- `1a3963d9c07aeee478ef4032abe1a2c65b519c3e1a7087babc3dc850d73a79da`
  - `genovy-v1-working-20260322-backup-20260326.dump`

### Notes

- Railway duplicate environments are useful labeled preservation copies for app/config, but they are not the authoritative DB backups.
- The authoritative DB preservation is the local dump set under `db-dumps/`.

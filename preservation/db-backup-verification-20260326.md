## DB Backup Verification 2026-03-26

All three authoritative Railway DB backups completed and were verified after dump completion.

### Backup root

- `/Users/ahmedelmorshedy/Genovy-preservation-backups/20260326-024058/db-dumps`

### Verified dump set

- `genovy-production-20260326.dump`
- `genovy-v0-freeze-20260322-backup-20260326.dump`
- `genovy-v1-working-20260322-backup-20260326.dump`

### Verification performed

1. Confirmed all three files existed and stabilized at final size.
2. Ran `pg_restore -l` against each dump and captured the first lines in:
   - `db-dump-verify-production-20260326.txt`
   - `db-dump-verify-v0-freeze-20260326.txt`
   - `db-dump-verify-v1-working-20260326.txt`
3. Computed SHA-256 checksums in:
   - `db-dump-checksums-20260326.txt`

### Final sizes

- production: `210M`
- v0 freeze: `209M`
- real v1 working: `2.3G`

### Operational conclusion

The preservation phase now has:
- local full repo copies
- GitHub-pushed canonical file-state preservation
- Railway-labeled duplicate environments for app/config reference
- authoritative local verified DB dumps for production, freeze, and real working lineages

This means the structural preservation goal is satisfied without deleting or mutating the preserved states.

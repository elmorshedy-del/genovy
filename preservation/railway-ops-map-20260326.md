## Railway Ops Map 2026-03-26

This is the explicit operational map for the Genovy Railway project after relinking and lineage correction.

### Project

- project: `invigorating-integrity`

### App environments

- `production`
- `genovy-v0-freeze-20260322`
- `genovy-v1-working-20260322`

### Preservation duplicate environments

- `prod-pres-0326`
- `v0-pres-0326`
- `v1-pres-0326`

Use:
- preserve app/config labeling
- not trusted as standalone DB backups

### Canonical local paths and links

- original repo:
  - `/Users/ahmedelmorshedy/Genovy`
  - linked to `production`
- freeze ops path:
  - `/private/tmp/railway-genovy-freeze`
  - linked to `genovy-v0-freeze-20260322`
- working ops path:
  - `/private/tmp/railway-genovy-v1`
  - linked to `genovy-v1-working-20260322`
- canonical working clone:
  - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914`
  - relinked to `genovy-v1-working-20260322`

### App-selected DB services by lineage

Observed through Railway DB tunnel:

- `production`
  - app DB service host pattern: `postgres`
  - entity count: `81,870`

- `genovy-v0-freeze-20260322`
  - app DB service host pattern: `postgres-xnka`
  - entity count: `81,870`

- `genovy-v1-working-20260322`
  - app DB service host pattern: `postgres-jkzr`
  - entity count: `3,251,168`

### DB backup policy

Trusted:
- local `pg_dump` backups written under:
  - `/Users/ahmedelmorshedy/Genovy-preservation-backups/20260326-024058/db-dumps`

Not trusted alone:
- Railway environment duplication

### Operational rule

Before any future SQL audit or benchmark:
1. confirm local path link with `railway status`
2. confirm environment name
3. confirm DB lineage with a cheap count query
4. only then run deeper audit/benchmark logic

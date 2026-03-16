# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Genovy is a single Node.js/Express application (not a monorepo) with two runtime dependencies (`express`, `pg`) and no build step. See `README.md` for standard commands (`npm run dev`, `npm test`, `npm run migrate`, etc.).

### Services

| Service | How to start |
|---------|-------------|
| **PostgreSQL** | `sudo pg_ctlcluster 16 main start` |
| **Genovy (dev)** | `PORT=3100 DATABASE_URL=postgres://postgres:postgres@localhost:5432/genovy RARE_DISEASE_ADMIN_TOKEN=change-me npm run dev` |

### Non-obvious caveats

- **No dotenv loader**: The app does not auto-load `.env` files. You must export env vars or prefix commands with them. The `.env.example` file documents required variables (`PORT`, `DATABASE_URL`, `RARE_DISEASE_ADMIN_TOKEN`).
- **Service modes**: Without `DATABASE_URL`, the app boots in `website_only` mode (only static site + health). Without `RARE_DISEASE_ADMIN_TOKEN`, admin sync routes are disabled. Set both for full functionality.
- **Migrations**: Run `DATABASE_URL=... npm run migrate` before first use when PostgreSQL is available. The migration runner is idempotent.
- **Tests**: `npm test` uses Node.js built-in test runner (`node --test`). All tests are pure unit tests requiring no database or network.
- **PostgreSQL auth**: After fresh install, you may need to change `pg_hba.conf` from `peer` to `md5` for local TCP connections and set the postgres user password: `sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"`.
- **Hot reload**: `npm run dev` uses `node --watch` which watches for file changes automatically.

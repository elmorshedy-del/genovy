# Genovy

Rare-disease case-intelligence platform. Node.js/Express backend with PostgreSQL, serving a public marketing site and a knowledge-network API.

## Cursor Cloud specific instructions

### Services

| Service | How to run | Port |
|---------|-----------|------|
| Express server (dev) | `DATABASE_URL=postgres://postgres:postgres@localhost:5432/genovy RARE_DISEASE_ADMIN_TOKEN=change-me npm run dev` | 3100 |
| PostgreSQL | `sudo pg_ctlcluster 16 main start` | 5432 |

### Key caveats

- **No dotenv**: The app does not auto-load `.env` files. You must export `DATABASE_URL`, `RARE_DISEASE_ADMIN_TOKEN`, and optionally `PORT` as shell environment variables before running any npm script (`dev`, `migrate`, `test`, `ops:admin`).
- **PostgreSQL auth**: After installing PostgreSQL, the default `pg_hba.conf` uses `peer` auth for local connections. Change it to `md5` and set the `postgres` user password to `postgres` (matching `DATABASE_URL` default) for the app to connect over TCP.
- **Runtime modes**: Without `DATABASE_URL` the app starts in `website_only` mode (only static site + `/health`). With `DATABASE_URL` but without `RARE_DISEASE_ADMIN_TOKEN` it runs in `knowledge_only` mode. Both env vars enable `full` mode.
- **Migrations**: Run `npm run migrate` (with `DATABASE_URL` exported) before first start; the server also auto-runs migrations on boot.
- **Tests**: `npm test` runs pure-logic unit tests via Node.js built-in test runner (`node --test`). No database connection is needed for tests.
- **No linter configured**: The project has no ESLint/Prettier config.
- **Node.js ≥ 18 required**: Uses native `fetch`, ESM modules, `node --watch`, and `node --test`.

### Standard commands

See `package.json` scripts and `README.md` "Local setup" for the canonical commands (`npm run dev`, `npm run migrate`, `npm test`, `npm run ops:admin`).

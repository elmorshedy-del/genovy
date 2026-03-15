# Genovy

Genovy is a rare-disease case-intelligence platform. It turns fragmented records into a structured case history, connects that case to a refreshed knowledge network, and prepares the next step for patients and specialists.

## What is in this repo

- A polished public website served from the same Express app
- A Postgres-backed knowledge-network schema for diseases, phenotypes, genes, variants, relationships, evidence, and source sync state
- A canonical entity layer that resolves noisy source entities into auditable concepts, aliases, memberships, and concept-level relationships
- Admin sync endpoints for loading MONDO, HPO, ClinVar, and ClinicalTrials.gov data

## Current product direction

- Public surface: a premium landing page for the startup
- Platform backbone: source catalog, sync runs, normalized entities, cross-references, relationships, and provenance
- Next layer: patient record ingestion, case timelines, doctor summaries, and guided workup recommendations

## Local setup

1. Install dependencies:

```bash
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm install
```

2. Copy `.env.example` to `.env` and set:

- `PORT`
- `DATABASE_URL`
- `RARE_DISEASE_ADMIN_TOKEN`

3. Run migrations:

```bash
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run migrate
```

4. Start the app:

```bash
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run dev
```

If `DATABASE_URL` is missing, Genovy still boots the public website in `website_only` mode.
If `DATABASE_URL` exists but `RARE_DISEASE_ADMIN_TOKEN` is missing, the public site and knowledge API can run while admin sync routes stay disabled.

## Ingestion operator

Queue and monitor source syncs against a running Genovy instance:

```bash
GENOVY_BASE_URL=https://genovy-production.up.railway.app \
GENOVY_ADMIN_TOKEN=... \
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run ops:admin -- sources

GENOVY_BASE_URL=https://genovy-production.up.railway.app \
GENOVY_ADMIN_TOKEN=... \
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run ops:admin -- bootstrap --wait
```

Useful commands:

- `sources`
- `summary`
- `canonical-summary`
- `canonicalize`
- `sync-source <sourceKey> --wait`
- `sync-run <syncRunId>`
- `bootstrap --wait`

By default, `bootstrap` skips sources that already have a successful sync recorded. Add
`--include-completed` if you want to force a full bootstrap rerun.

## Routes

- `GET /` public website
- `GET /health`
- `GET /api/admin/sources`
- `GET /api/admin/sync-runs`
- `POST /api/admin/sources/:sourceKey/sync`
- `POST /api/admin/bootstrap`
- `POST /api/admin/canonical/rebuild`
- `GET /api/knowledge/summary`
- `GET /api/knowledge/canonical/summary`
- `GET /api/knowledge/canonical/search`
- `GET /api/knowledge/canonical/concepts/:conceptId`
- `GET /api/knowledge/entities/:curie`

Admin routes require `x-admin-token` to match `RARE_DISEASE_ADMIN_TOKEN`.

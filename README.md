# Genovy

Genovy is a rare-disease case-intelligence platform. It turns fragmented records into a structured case history, connects that case to a refreshed knowledge network, and prepares the next step for patients and specialists.

## What is in this repo

- A polished public website served from the same Express app
- A Postgres-backed knowledge-network schema for diseases, phenotypes, genes, variants, relationships, evidence, and source sync state
- A canonical entity layer that resolves noisy source entities into auditable concepts, aliases, memberships, and concept-level relationships
- A structured clinical-evidence layer for phenotype support/exclusion, natural history terms, gene-disease validity, and variant-disease assertions
- A first ML pipeline for gene-disease link discovery using exported graph features and CatBoost
- A read-only novelty analysis layer that filters scored candidates into strict-novel vs same-family buckets without writing back to the knowledge graph
- Admin sync endpoints for loading MONDO, HPO, Orphadata, ClinGen, ClinVar, and ClinicalTrials.gov data

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
- `GENOVY_READONLY_API_TOKEN`

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
If `DATABASE_URL` exists but `GENOVY_READONLY_API_TOKEN` is missing, the public site still runs but the token-protected versioned read-only API stays disabled.

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
- `npm run dx:benchmark-sim -- --max-cases 50`
- `npm run dx:benchmark-phenopackets -- --phenopacket-dir /path/to/phenopackets --case-limit 100`
- `npm run dx:run-pheval -- --phenopacket-dir ./phenopackets --output-dir output/pheval/genovy-dx`
- `npm run ml:export-gene-disease -- --output-dir output/ml/gene-disease-link-discovery`
- `npm run ml:analyze-gene-disease-novelty -- --ranked-candidates output/ml/gene-disease-link-discovery/model/top_candidate_links.csv`
- `sync-source <sourceKey> --wait`
- `sync-run <syncRunId>`
- `bootstrap --wait`

By default, `bootstrap` skips sources that already have a successful sync recorded. Add
`--include-completed` if you want to force a full bootstrap rerun.

## Routes

- `GET /` public website
- `GET /health`
- `GET /api/v1`
- `GET /api/v1/openapi.json`
- `GET /api/v1/health`
- `GET /api/v1/platform/overview`
- `GET /api/v1/knowledge/summary`
- `GET /api/v1/knowledge/search`
- `GET /api/v1/knowledge/entities/:curie`
- `GET /api/v1/knowledge/profiles/:curie`
- `GET /api/v1/knowledge/canonical/summary`
- `GET /api/v1/knowledge/canonical/search`
- `GET /api/v1/knowledge/canonical/concepts/:conceptId`
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
- `GET /api/knowledge/profiles/:curie`
- `POST /api/dx/rank`

Admin routes require `x-admin-token` to match `RARE_DISEASE_ADMIN_TOKEN`.

## Read-only API

Genovy now exposes a versioned read-only consultant-safe API under `/api/v1`.

Authentication:

- `Authorization: Bearer <GENOVY_READONLY_API_TOKEN>`
- or `X-API-Key: <GENOVY_READONLY_API_TOKEN>`

Docs:

- `GET /api/v1`
- `GET /api/v1/openapi.json`

Example:

```bash
curl https://genovy-production.up.railway.app/api/v1/platform/overview \
  -H 'Authorization: Bearer YOUR_READ_ONLY_TOKEN'
```

## Genovy DX

Genovy DX is the phenotype-only disease-ranking layer built on top of the live knowledge graph.

It currently includes:

- `DX-Sim`: Resnik / information-content semantic similarity over disease phenotype profiles
- `POST /api/dx/rank`: direct API ranking from HPO terms or a GA4GH Phenopacket payload
- `npm run dx:benchmark-sim`: synthetic internal benchmark over the live graph
- `npm run dx:benchmark-phenopackets`: benchmark a running Genovy DX API against a real phenopacket directory
- `npm run dx:run-pheval`: batch run over a directory of phenopackets with PhEval-style disease result TSV output

Example API call:

```bash
curl -X POST https://genovy-production.up.railway.app/api/dx/rank \
  -H 'content-type: application/json' \
  --data '{"hpoTerms":["HP:0001250","HP:0002376"],"limit":5}'
```

Batch PhEval-style run:

```bash
NODE_ENV=production \
DATABASE_URL=postgresql://... \
npm run dx:run-pheval -- \
  --phenopacket-dir ./phenopackets \
  --output-dir output/pheval/genovy-dx \
  --score-field normalizedScore
```

This writes:

- `raw_results/*.json`
- `pheval_disease_results/*-disease_result.tsv`
- `run_summary.json`
- `pheval_run_manifest.yaml`

If you want parquet conversion for downstream PhEval workflows:

```bash
python3 -m pip install -r requirements-ml.txt
python3 scripts/pheval/convert_tsv_results_to_parquet.py \
  --results-dir output/pheval/genovy-dx/pheval_disease_results
```

A first `pheval-genovy` plugin skeleton is also included at [pheval_genovy](/Users/ahmedelmorshedy/Genovy/pheval_genovy) so Genovy can move toward a native `pheval run --runner genovy ...` workflow instead of only ad hoc scripts.

## Structured clinical evidence

`GET /api/knowledge/profiles/:curie` now returns:

- supporting vs excluding phenotype observations
- natural history terms such as average onset and inheritance mode
- ClinGen gene-disease validity assertions
- ClinVar variant-disease assertions when available

The profile route prefers the typed clinical-evidence tables and falls back to the older relationship qualifiers if those tables have not been backfilled yet.

## New source notes

- `orphadata_natural_history` is in bootstrap and captures Orphadata onset/inheritance terms into typed natural-history tables.
- `clingen_gene_disease_validity` is in bootstrap and captures curated gene-disease validity classifications.
- `clinvar_variant_summary` is available as a manual source sync. It is intentionally bounded to a GRCh38 germline subset per sync so the first implementation does not try to ingest the full ClinVar variant feed into memory at once.

## ML link discovery

Genovy can export a CatBoost-ready gene-disease dataset from the canonical graph:

```bash
NODE_ENV=production \
DATABASE_URL=postgresql://... \
PATH=/opt/homebrew/bin:$PATH \
npm run ml:export-gene-disease -- \
  --output-dir output/ml/gene-disease-link-discovery \
  --max-positives 30000 \
  --negative-ratio 2 \
  --candidate-limit 15000 \
  --seed-phenotypes-per-gene 8 \
  --candidate-seeds-per-gene 80 \
  --negative-buffer-multiplier 6
```

The exporter now uses seeded phenotype candidates instead of an unconstrained graph-wide pair join, and it over-samples candidate negatives so it can discard same-family and equivalent disease pairs before training. That keeps production runs bounded while making the negative set more scientifically defensible on the live canonical graph.

Then train CatBoost:

```bash
python3 -m pip install -r requirements-ml.txt

python3 scripts/ml/train_gene_disease_link_model.py \
  --train-dataset output/ml/gene-disease-link-discovery/gene_disease_train.csv \
  --candidate-dataset output/ml/gene-disease-link-discovery/gene_disease_candidates.csv \
  --output-dir output/ml/gene-disease-link-discovery/model
```

Then run the strict novelty filter in read-only mode:

```bash
NODE_ENV=production \
DATABASE_URL=postgresql://... \
PATH=/opt/homebrew/bin:$PATH \
npm run ml:analyze-gene-disease-novelty -- \
  --ranked-candidates output/ml/gene-disease-link-discovery/model/top_candidate_links.csv \
  --output-dir output/ml/gene-disease-link-discovery/novelty \
  --top-k 250
```

This step does not write anything to the Genovy database. It only reads the canonical graph and writes separate analysis artifacts under `output/`.

Details: [docs/gene-disease-link-discovery.md](/Users/ahmedelmorshedy/Genovy/docs/gene-disease-link-discovery.md)

# Genovy DX Phase 0: Source Freshness Audit

Created:
- 2026-03-22

Question:
- What exact source snapshots are currently in the frozen Genovy graph, which ones are stale relative to upstream today, and where is version provenance currently missing?

Evidence surface:
- Frozen Railway DB metadata cloned from the benchmark-competitive graph:
  - `sources`
  - `source_sync_state`
  - `sync_runs`
- Source fetcher code:
  - `src/services/sources/*.js`
  - `src/lib/parseDelimited.js`
- Official upstream endpoints queried on 2026-03-22 via HTTP headers and first-line file inspection

Intentionally not inspected:
- raw historical download files on disk
- broad raw data dumps or caches
- Exomiser internal source bundle files

Status:
- active

## Environment split completed before Phase 0

Frozen reference environment:
- Railway env: `genovy-v0-freeze-20260322`
- app DB isolated from the original external benchmark DB

Working environment for all new changes:
- Railway env: `genovy-v1-working-20260322`
- app DB host now points to its own Railway Postgres
- verified clone counts:
  - `21` public tables
  - `81,870` entities
  - `967,198` relationships
  - `987,252` source records

This means Phase 0+ work can proceed without mutating the preserved `v0` database state.

## Current inventory from the frozen graph

| Source | Current ingested sync | Current stored source version | Latest upstream signal checked on 2026-03-22 | Initial status | Notes |
| --- | --- | --- | --- | --- | --- |
| `mondo_ontology` | 2026-03-14 18:06 UTC | `http://purl.obolibrary.org/obo/mondo/releases/2026-03-03/mondo.owl` | HTTP `Last-Modified: Tue, 03 Mar 2026 19:56:23 GMT` on latest release asset | Current | Exact version provenance is good. |
| `hpo_ontology` | 2026-03-14 18:33 UTC | `http://purl.obolibrary.org/obo/hp/releases/2026-02-16/hp.json` | HTTP `Last-Modified: Mon, 16 Feb 2026 17:29:25 GMT` on latest release asset | Current | Exact version provenance is good. |
| `hpo_disease_phenotype` | 2026-03-14 19:24 UTC | `2026-02-16` | File header shows `#version: 2026-02-16` on latest `phenotype.hpoa` | Current | Exact version provenance is good. |
| `hpo_gene_disease` | 2026-03-14 19:26 UTC | blank | Latest asset `Last-Modified: Mon, 16 Feb 2026 17:29:41 GMT` | Likely current, but not provable from stored metadata | Same HPO release family as the disease phenotype file, but current ingest did not persist a version string. |
| `hpo_gene_phenotype` | 2026-03-14 18:59 UTC | blank | Latest asset `Last-Modified: Mon, 16 Feb 2026 17:29:44 GMT` | Likely current, but not provable from stored metadata | Same HPO release family as the disease phenotype file, but current ingest did not persist a version string. |
| `orphadata_natural_history` | 2026-03-15 07:03 UTC | `1.3.42 / 4.1.8 [2025-03-03]` | Latest XML header shows `version="1.3.42 / 4.1.8 [2025-03-03]"` and `date="2025-12-09 07:10:28"` | Current | Upstream file was republished in Dec 2025, but the dataset version itself matches the ingested one. |
| `clingen_gene_disease_validity` | 2026-03-15 07:08 UTC | blank | Download header line shows `FILE CREATED: 2026-03-22` and filename `Clingen-Gene-Disease-Summary-2026-03-22.csv` | Stale | Upstream is newer than the graph, and current ingest stores no source version. |
| `clinvar_gene_disease` | 2026-03-14 19:28 UTC | blank | HTTP `Last-Modified: Sun, 22 Mar 2026 14:17:20 GMT` on `gene_condition_source_id` | Stale | Upstream is newer than the graph, and current ingest stores no source version. |
| `clinvar_variant_summary` | 2026-03-15 07:11 UTC | `Mon, 09 Mar 2026 07:01:57 GMT` | HTTP `Last-Modified: Sun, 15 Mar 2026 18:11:04 GMT` on latest `variant_summary.txt.gz` | Stale | Exact version provenance is good enough to prove a freshness gap. |

## Phase 0 findings

### 1. The `v0` freeze is now real, not conceptual

We now have:
- GitHub freeze already merged to `main`
- Railway frozen app/db environment
- Railway working app/db environment

That removes the main operational risk: further ingestion or enrichment work will not overwrite the rare benchmark-competitive state.

### 2. HPO and MONDO are not the first freshness problem

The ontology backbone and HPO disease phenotype annotations appear aligned with current upstream releases:
- MONDO current at `2026-03-03`
- HPO ontology current at `2026-02-16`
- HPO disease phenotype current at `2026-02-16`

This matters because it narrows Phase 1. The most obvious freshness gaps are not MONDO/HPO ontology drift.

### 3. ClinGen and ClinVar are already proven stale

The graph lags the currently available upstream files for:
- `clingen_gene_disease_validity`
- `clinvar_gene_disease`
- `clinvar_variant_summary`

So a stale-source re-ingestion pass is not speculative anymore. It is warranted.

### 4. Version provenance is incomplete for four important ingestion surfaces

Current ingests do not preserve a useful source version for:
- `hpo_gene_disease`
- `hpo_gene_phenotype`
- `clingen_gene_disease_validity`
- `clinvar_gene_disease`

That means future audits will keep re-solving the same question unless provenance capture is fixed in code.

## Why the provenance is missing

Code inspection shows three distinct causes:

1. `hpoGeneDiseaseSource.js`
- returns `sourceVersion: parsed.metadata.version || ''`
- but `genes_to_disease.txt` has no leading `#version:` metadata line
- result: blank version persisted

2. `hpoGenePhenotypeSource.js`
- returns `sourceVersion: parsed.metadata.version || ''`
- but `genes_to_phenotype.txt` has no leading `#version:` metadata line
- result: blank version persisted

3. `clingenGeneDiseaseValiditySource.js`
- hardcodes `sourceVersion: ''`
- even though the CSV itself exposes `FILE CREATED: YYYY-MM-DD`

4. `clinvarGeneDiseaseSource.js`
- returns `sourceVersion: parsed.metadata.version || ''`
- but `gene_condition_source_id` has no parsed version metadata line
- result: blank version persisted

This is not just a data issue. It is also a provenance-capture issue in the ingestion code.

## Immediate implications for the non-negotiable plan

### Confirmed for Phase 1
- `U2AF2` and the full identity-repair sweep remain high priority
- stale-source re-ingestion is now justified by evidence, not guesswork

### Confirmed for engineering work
- source-version capture should be fixed before or together with the next ingestion pass
- otherwise the next freshness audit will still be partly inferential
- working-branch patch now prepared:
  - `hpo_gene_disease`
  - `hpo_gene_phenotype`
  - `clingen_gene_disease_validity`
  - `clinvar_gene_disease`
  will persist usable source versions on the next sync instead of writing blanks

### Not yet completed
- delta counts of new assertions versus latest upstream
- exact full identity-repaired gene list
- Exomiser source-list comparison

## Recommended next commands

1. Pull the full identity-repaired gene list from the repair workflow artifacts or canonical repair script outputs.
2. Re-ingest stale sources on the working environment only:
   - ClinGen gene-disease validity
   - ClinVar gene-disease
   - ClinVar variant summary
3. Run the next sync with the new provenance patch so the four provenance-gap sources persist usable source versions.
4. Re-run the full benchmark after the working graph is refreshed.

## Confidence

High confidence:
- Railway `v0` / `v1-working` isolation is real
- current stale sources include ClinGen and at least two ClinVar surfaces
- MONDO/HPO ontology/HPO disease phenotype are current
- provenance capture is incomplete in code for four ingestion surfaces

Medium confidence:
- `hpo_gene_disease` and `hpo_gene_phenotype` are likely current because they share the same HPO release family as `phenotype.hpoa`
- but that remains an inference until source version capture is fixed

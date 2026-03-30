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
- completed on the working environment `genovy-v1-working-20260322`

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

## Phase 0 completion on the working environment

Using the isolated Railway working DB only, we completed the targeted refresh pass for the five Phase 0 sources that were either stale or missing usable provenance:

| Source | Working env sync run | Completed at (UTC) | Recorded source version after refresh | Outcome |
| --- | ---: | --- | --- | --- |
| `hpo_gene_disease` | `37` | `2026-03-22 21:40:29` | `Mon, 16 Feb 2026 17:29:41 GMT` | completed |
| `hpo_gene_phenotype` | `38` | `2026-03-22 21:46:31` | `Mon, 16 Feb 2026 17:29:44 GMT` | completed |
| `clingen_gene_disease_validity` | `40` | `2026-03-22 21:50:49` | `2026-03-22` | completed |
| `clinvar_gene_disease` | `41` | `2026-03-22 21:51:31` | `Sun, 22 Mar 2026 14:17:20 GMT` | completed |
| `clinvar_variant_summary` | `45` | `2026-03-22 22:05:49` | `Sun, 15 Mar 2026 18:11:04 GMT` | completed |

Important run summaries from the completed refreshes:
- `hpo_gene_disease` (`37`):
  - `entities: 5510`
  - `relationships: 15913`
  - `sourceRecords: 15914`
- `hpo_gene_phenotype` (`38`):
  - `entities: 5256`
  - `relationships: 329339`
  - `sourceRecords: 329339`
- `clingen_gene_disease_validity` (`40`):
  - `entities: 2868`
  - `relationships: 3484`
  - `sourceRecords: 3426`
  - `clinicalGeneDiseaseValidityAssertions: 3463`
- `clinvar_gene_disease` (`41`):
  - `entities: 5123`
  - `relationships: 12818`
  - `sourceRecords: 11160`
- `clinvar_variant_summary` (`45`):
  - `entities: 27831`
  - `xrefs: 104497`
  - `relationships: 113014`
  - `sourceRecords: 56490`
  - `clinicalVariantDiseaseAssertions: 56494`

### What Phase 0 proved

1. The stale-source refresh is now complete on `v1-working`
- The five target sources now have recorded source versions in `source_sync_state`.
- The two HPO gene surfaces are no longer inferential in the working graph; they now persist exact upstream timestamps.

2. Provenance capture was a real engineering defect
- Before this patch, `hpo_gene_disease`, `hpo_gene_phenotype`, `clingen_gene_disease_validity`, and `clinvar_gene_disease` left version provenance blank.
- After the patch and refresh, all four now persist usable source versions.
- This closes the biggest auditability gap from the initial Phase 0 findings.

3. Global freshness refresh did not solve the `U2AF2` problem
- Narrow post-refresh verification on the working graph still shows:
  - canonical `U2AF2` entities exist only as `gene_identity_repair` nodes
  - `associated_with_disease = 0`
  - `associated_with_phenotype = 0`
- This means `U2AF2` remains an identity-only shell even after the current-source refresh.
- So the `U2AF2` problem is not explained away by simple source staleness alone.

4. Healthy comparator genes remain connected after the refresh
- Narrow post-refresh verification on `RPGRIP1` shows:
  - one connected canonical gene node with:
    - `associated_with_disease = 10`
    - `associated_with_phenotype = 165`
  - linked direct disease profiles including:
    - `cone-rod dystrophy 13`
    - `Leber congenital amaurosis 6`
- This confirms the working graph refresh did not break a healthy disease/phenotype carrier gene while fixing the stale-source and provenance surfaces.

### Operational issues encountered and repaired during Phase 0

Refreshing the working graph exposed historical schema drift in the Railway clone. These were repaired in the working environment through targeted migrations before the refreshes could complete reliably:
- missing constraints and indexes on `relationships`
- sequence drift on sync-path tables
- missing conflict targets on `clinical_variant_disease_assertions`
- missing keys and lookup indexes on `entity_xrefs`

This matters because the Phase 0 refresh result is not just “sources are newer now.” It also proves the working clone can now execute the current ingestion path without tripping over legacy schema damage.

## Immediate implications for the non-negotiable plan

### Confirmed for Phase 1
- `U2AF2` and the full identity-repair sweep remain high priority
- stale-source re-ingestion is now complete on the working graph
- Phase 1 should now shift from freshness auditing to:
  - `U2AF2`-specific re-ingestion and support-path diagnosis
  - full identity-repaired gene sweep
  - before/after benchmark delta on the refreshed graph

### Confirmed for engineering work
- source-version capture patch is no longer just prepared; it has now been exercised successfully on the working graph
- future freshness audits for these five sources can rely on stored working-graph provenance instead of partial inference

### Not yet completed
- delta counts of new assertions versus latest upstream
- exact full identity-repaired gene list
- Exomiser source-list comparison

## Recommended next commands

1. Pull the full identity-repaired gene list from the repair workflow artifacts or canonical repair script outputs.
2. Run the `U2AF2`-specific Phase 1 check on the refreshed graph:
   - confirm whether the current HPO/ClinGen/ClinVar sources now contain any usable `U2AF2` assertions
   - if yes, diagnose why they still do not attach
   - if no, document that the gap survives the freshness refresh
3. Re-run the full benchmark on the refreshed working graph so the post-refresh baseline is recorded before any manual enrichment.
4. Only after that, proceed to the identity-repair sweep and Phase 2 enrichment tests.

## Confidence

High confidence:
- Railway `v0` / `v1-working` isolation is real
- the five Phase 0 target sources are now refreshed on the working graph
- MONDO/HPO ontology/HPO disease phenotype were already current
- provenance capture is now fixed for the four previously blank surfaces on the working graph
- `U2AF2` still has no disease or phenotype links after the refresh

Medium confidence:
- the Phase 1 diagnosis for `U2AF2` will still need one more narrow proof step:
  - whether refreshed upstream sources currently contain attachable assertions for `U2AF2`, or whether the gap survives upstream freshness entirely

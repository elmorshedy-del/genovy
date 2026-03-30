# 2026-03-28 Three-Source Enrichment Pass

- Scope:
  - staged only on `v1-enrich-0328`
  - sources limited to:
    - `Orphadata Phenotypes`
    - `Orphadata HOOM`
    - `HPO annotation files`
  - no OMIM / GeneReviews / manual PMID additions in this pass
- Permanent inputs:
  - roster: [benchmark-miss-tail-broad-roster-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/data/source-enrichment/benchmark-miss-tail-broad-roster-20260328.json)
  - generator: [generatePacketSourceEnrichmentManifest.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/generatePacketSourceEnrichmentManifest.js)
  - applier: [applySourceEnrichmentManifest.js](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts/applySourceEnrichmentManifest.js)
- Generated artifacts:
  - manifest: [source-enrichment-manifest-broad-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-manifest-broad-20260328.json)
  - apply log: [source-enrichment-apply-log-broad-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-apply-log-broad-20260328.json)
  - benchmark json: [official-v1-enrich-three-source-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-v1-enrich-three-source-20260328.json)
  - benchmark md: [official-v1-enrich-three-source-20260328.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-v1-enrich-three-source-20260328.md)

## What Was Added
- The three-source generator found only `4` unique disease-term additions across the broad unresolved miss roster.
- All `4` additions were truth-side only.
- Each term had `2` supporting source rows:
  - one from `orphadata_phenotypes`
  - one from `orphadata_hoom`
- No packet-relevant additions came from `phenotype.hpoa` beyond what the graph already carried.

## Added Terms
- `RERE` / `MONDO:0014857`
  - `HP:0000508` `Ptosis`
  - `HP:0001249` `Intellectual disability`
- `STXBP1` / `MONDO:0012812`
  - `HP:0001263` `Global developmental delay`
  - `HP:0011203` `EEG with abnormally slow frequencies`

## Apply Result
- Applied cleanly on staging after switching the clinical assertion writer to an update-or-insert path that matches the current staging schema.
- Source-backed writes:
  - `4` manifest term rows
  - `8` source records
  - `4` relationships
  - `8` relationship evidence rows
  - `8` clinical phenotype assertion rows

## Benchmark Result
- No benchmark movement.
- Summary after the three-source pass:
  - `found`: `87`
  - `top-1`: `42`
  - `top-5`: `53`
  - `top-10`: `62`
  - `MRR`: `0.488736`
- This matches the saved `v1-working` floor for the unresolved miss tail.
- The directly affected truth cases remained unchanged:
  - `PMID_29330883_Subject9` (`RERE`) unchanged
  - `PMID_35190816_STX_26865513_Patient_45` (`STXBP1`) unchanged

## Read
- These three curated structured sources are real and usable, but on the current miss tail they were sparse and low-yield compared with the earlier OMIM / GeneReviews / core-paper manual work.
- They are suitable as provenance-rich bulk evidence surfaces.
- They did not recover any additional benchmark misses on their own in this pass.

## Evidence Boundaries
- Inspected:
  - official source endpoints
  - permanent broad roster
  - generated manifest
  - staging DB writes
  - full official benchmark rerun on staging
- Intentionally not inspected:
  - raw recursive crawls of large mounted data
  - non-packet-relevant global source assertions
  - any live mutation on `Postgres-jkzR`

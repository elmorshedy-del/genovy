# PrimeKG + HPO Negative Pass

Date: `2026-03-28`

Scope:
- staging DB only: Railway `invigorating-integrity` / `v1-enrich-0328` / `Postgres-Enrichment-Symmetry`
- roster: [benchmark-miss-tail-broad-roster-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/data/source-enrichment/benchmark-miss-tail-broad-roster-20260328.json)
- sources:
  - `PrimeKG` positive/negative disease-phenotype rows from the Harvard Dataverse CSV
  - `HPO phenotype.hpoa` `NOT` rows directly from the official HPO release

What was inspected:
- existing manifest/apply pipeline
- official HPO `phenotype.hpoa` release file
- narrow streamed PrimeKG phenotype rows
- staging-only benchmark rerun

What was intentionally not inspected:
- no broad raw OMIM scrape
- no whole-graph raw data crawl outside the staging benchmark path

Implementation:
- added source keys:
  - `primekg`
  - `hpo_disease_phenotype_negative`
- manifest entries now preserve `assertionPresenceStatus` as `present` or `absent`
- apply step now writes:
  - `has_phenotype` for `present`
  - `lacks_phenotype` for `absent`
  - `clinical_phenotype_assertions.presence_status` accordingly
- benchmark utility now closes the DB pool on completion so scripted runs exit cleanly

Key source finding:
- the current official HPO `phenotype.hpoa` file already contains `NOT` rows, so a separate legacy `negative_phenotype_annotation.tab` download was not required for this pass

Manifest/output artifacts:
- manifest: [source-enrichment-manifest-primekg-hpo-negative-broad-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-manifest-primekg-hpo-negative-broad-20260328.json)
- apply log: [source-enrichment-apply-log-primekg-hpo-negative-broad-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-apply-log-primekg-hpo-negative-broad-20260328.json)
- benchmark json: [official-v1-enrich-primekg-hpo-negative-20260328.json](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-v1-enrich-primekg-hpo-negative-20260328.json)
- benchmark md: [official-v1-enrich-primekg-hpo-negative-20260328.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/official-v1-enrich-primekg-hpo-negative-20260328.md)

Yield:
- new manifest entries: `1`
- source distribution:
  - `primekg`: `1`
  - `hpo_disease_phenotype_negative`: `0`
- assertion distribution:
  - `present`: `1`
  - `absent`: `0`

The one applied row:
- case: `PMID_33766796_16`
- side: `rival-side`
- disease: `MONDO:0032745` `developmental delay with variable intellectual impairment and behavioral abnormalities`
- phenotype: `HP:0001999` `Abnormal facial shape`
- source: `PrimeKG:MONDO:32745`

Benchmark result vs current restored `v1-working` `1.0` floor:
- found: `87 -> 87`
- top-1: `42 -> 42`
- top-5: `53 -> 53`
- top-10: `62 -> 62`
- median rank: `2 -> 2`
- MRR: `0.488736 -> 0.488707`

Per-case churn:
- improved:
  - `PMID_35190816_STX_20887364_Subject_2103` `20 -> 19`
  - `PMID_35190816_STX_23934111_fh` `32 -> 31`
- worsened:
  - `PMID_29058101_Patient1` `18 -> 19`

Interpretation:
- this pass did not improve top-line benchmark performance
- the one new PrimeKG row did not rescue its touched case
- the only visible effect was tiny unrelated rank churn from global IC reweighting
- HPO negative rows are now structurally supported by the manifest/apply path, but they produced no packet-relevant additions on this unresolved miss roster

Confidence:
- high for the manifest/apply provenance and benchmark result
- medium for PrimeKG as an enrichment source, because this pass showed extremely low packet-relevant yield on the miss tail

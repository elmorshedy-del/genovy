# Genovy DX Phase 1: Identity-Repair Sweep

Created:
- 2026-03-22

Question:
- After the Phase 0 refresh, how many repaired genes are actually in the `U2AF2` pattern of "canonical identity exists but no disease/phenotype links are attached"?

Evidence surface:
- isolated Railway working DB only
- narrow metadata and summary queries against:
  - `source_records`
  - `sync_runs`
  - `entities`
  - `relationships`
- canonical repair workflow script:
  - `src/scripts/repairGeneIdentityHoles.js`

Intentionally not inspected:
- raw source dumps
- broad graph crawls outside repaired-gene candidates
- manual literature sources
- ranking outputs

Status:
- completed for the currently known `gene_identity_repair` pathway

## What counts as a repaired gene here

To avoid guessing from current `primary_source_key` alone, this sweep used three evidence surfaces:

1. `source_records` written by the `gene_identity_repair` workflow
2. `sync_runs` for `source_key = 'gene_identity_repair'`
3. live `entities.metadata_json.repairSource`

This matters because later source ingestions can overwrite a gene's `primary_source_key`, so a repaired gene may no longer appear as `primary_source_key = 'gene_identity_repair'` even though it came through the repair workflow.

## Current repaired-gene population

The explicit repair workflow artifacts currently identify only two repaired genes:

| Gene | Evidence of repair | Current state |
| --- | --- | --- |
| `U2AF2` | `source_records`, `sync_runs`, `repairSource` metadata | empty shell |
| `RPGRIP1` | `source_records`, `sync_runs`, `repairSource` metadata | connected and healthy |

Important detail:
- the repair script currently hardcodes only two fixtures:
  - `U2AF2`
  - `RPGRIP1`
- `sync_run 32` (`source_version = step3-gene-identity-repair-v1`) also reports verification for `RPGRIP1L`, but `RPGRIP1L` does not currently appear in `source_records` or in live `repairSource` metadata, so it should not yet be counted as part of the confirmed repaired-gene population.

## Sweep result

Using live link counts grouped at the logical-gene level across repaired-gene candidates:

| Metric | Count |
| --- | ---: |
| logical repaired genes identified | `2` |
| empty shell genes | `1` |
| phenotype-only genes | `0` |
| disease-only genes | `0` |
| fully connected genes | `1` |
| repaired genes with any HPO coverage gap flag | `1` |

## Gene-by-gene result

### `U2AF2`
- canonical rows:
  - `NCBIGene:11338`
  - `HGNC:23156`
- current primary source:
  - `gene_identity_repair`
- `hpoCoverage` flags:
  - `geneDisease = false`
  - `genePhenotype = false`
- current live graph state:
  - `associated_with_disease = 0`
  - `associated_with_phenotype = 0`

Interpretation:
- `U2AF2` remains a true empty shell after the Phase 0 source refresh.
- This is the exact `repair happened, clinical evidence still absent/unattached` case that Phase 1 needs to solve.

### `RPGRIP1`
- repair workflow evidence exists in `source_records` and the completed repair sync summary
- live graph state:
  - `associated_with_disease = 10`
  - `associated_with_phenotype = 165`
- current live disease carriers include:
  - `cone-rod dystrophy 13`
  - `Leber congenital amaurosis 6`

Interpretation:
- `RPGRIP1` is the counterexample that keeps us honest.
- The repair workflow itself is not inherently broken.
- A repaired gene can become fully usable once later source ingestion attaches real disease and phenotype evidence.

## Main conclusion

The currently evidenced repair population is smaller than feared:
- there is not yet evidence of a broad hidden class of many repaired-but-empty genes
- within the confirmed `gene_identity_repair` pathway, only `U2AF2` is empty

That means the Phase 1 priority should narrow to:
1. explain `U2AF2`
2. fix `U2AF2` if attachable assertions exist in current official sources
3. only broaden the sweep if another repair pathway or additional repaired-gene artifact set is discovered

## Narrow `U2AF2` attachment diagnosis

To avoid jumping straight into another blind re-ingestion pass, we ran one more narrow check on the refreshed working graph:

- searched official-source `source_records` for:
  - `U2AF2`
  - `HGNC:23156`
  - `NCBIGene:11338`
  - `ENSEMBL:ENSG00000063244`
  - `OMIM:191318`
  - `OMIM:620535`
  - `DEVDFB`
- checked `entities`, `entity_xrefs`, `canonical_concepts`, and `relationships` for the `OMIM:620535` disease path

### What this proved

1. `U2AF2` is absent from the refreshed official gene-oriented source records
- no hits were found in:
  - `hpo_gene_disease`
  - `hpo_gene_phenotype`
  - `clingen_gene_disease_validity`
  - `clinvar_gene_disease`
  - `clinvar_variant_summary`
for `U2AF2` or its main gene identifiers

2. The disease phenotype surface for the syndrome does exist
- `hpo_disease_phenotype` contains `26` source records for `OMIM:620535`
- `OMIM:620535` is present as an xref on:
  - `MONDO:0957810`
  - `developmental delay, dysmorphic facies, and brain anomalies`
- that disease entity already has:
  - `26` `has_phenotype` relationships

3. The missing edge is specifically the gene→disease attachment
- there are no `associated_with_disease` links from any `U2AF2` gene node to `MONDO:0957810`
- there are no other current gene→disease links on the `U2AF2` nodes either

### Interpretation

This materially changes the Phase 1 diagnosis:
- the syndrome-side disease phenotype evidence is not missing from the graph
- what is missing is an official-source gene→disease attachment for `U2AF2`

So the next question is no longer “did disease phenotype ingestion miss the syndrome?”

It is:
- do current official gene→disease sources actually expose a usable `U2AF2 -> DEVDFB / MONDO:0957810 / OMIM:620535` mapping?
- if not, then `U2AF2` cannot be fixed inside the current official-source stack by simple refresh alone
- if yes, then the attachment path still has a real ingestion/mapping bug

## Critical caveat

This does **not** prove there are no other identity/attachment failures elsewhere in the graph.

It only proves:
- within the currently evidenced `gene_identity_repair` workflow artifacts
- on the refreshed working graph
- `U2AF2` is the only confirmed repaired empty shell

If another repair pathway exists outside `gene_identity_repair`, it still needs separate inspection.

## Recommended next step

Run a `U2AF2`-specific source/attachment diagnosis on the refreshed working graph:
- check whether the refreshed official sources now contain attachable `U2AF2` assertions
- if yes, identify where the attachment path fails
- if no, document that the gap survives current official-source refresh and move the fix into later enrichment work

## Confidence

High confidence:
- `U2AF2` is still empty
- `RPGRIP1` is connected
- the currently evidenced repair population is very small

Medium confidence:
- there is no larger hidden repair population outside the current `gene_identity_repair` workflow
- that remains open until other repair artifacts or pathways are ruled out explicitly

High confidence:
- `OMIM:620535` / `MONDO:0957810` disease phenotype evidence is present in the graph
- the `U2AF2` problem is currently the absence of a gene→disease attachment, not the absence of a disease phenotype profile

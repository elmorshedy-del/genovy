## DB Lineage Audit 2026-03-26

This note records the most important structural correction from the preservation audit.

### Correct Railway mappings

Project:
- `invigorating-integrity`

Primary environments:
- `production`
- `genovy-v0-freeze-20260322`
- `genovy-v1-working-20260322`

The working clone path was relinked explicitly to:
- project: `invigorating-integrity`
- environment: `genovy-v1-working-20260322`
- service: `genovy`

This fixed the prior local Railway drift where the unlinked clone path inherited:
- `/Users/ahmedelmorshedy -> just-grace`

### The major lineage correction

Earlier SQL conclusions were taken from the wrong DB lineage.

Verified app DB entity counts via Railway DB tunnel:
- `production` app DB: `81,870`
- `genovy-v0-freeze-20260322` app DB: `81,870`
- `genovy-v1-working-20260322` app DB: `3,251,168`

So:
- `production` and `v0-freeze` are the small lineage
- real Railway `v1-working` is a different large lineage

This means several earlier conclusions drawn from the small lineage do not automatically apply to the real working environment.

### U2AF2 correction

Small lineage (`production` / `v0-freeze`):
- `U2AF2` entities: `2`
- `U2AF2` subject relationships: `0`

Real Railway `v1-working` lineage:
- `U2AF2` entities: `2`
- `U2AF2` subject relationships: `4`
- direct `associated_with_disease` edges observed from `clinvar_variant_summary`:
  - `MeSH:D030342` `Inborn genetic diseases`
  - `MONDO:0019046` `leukodystrophy`
  - `MONDO:0700092` `neurodevelopmental disorder`
  - `MONDO:0957810` `developmental delay, dysmorphic facies, and brain anomalies`

So the earlier “U2AF2 has zero relationships” conclusion was a wrong-DB artifact.

### ClinVar bridge correction

On the real Railway `v1-working` DB:
- `relationships` with:
  - `primary_source_key='clinvar_variant_summary'`
  - `predicate_key='associated_with_disease'`
  = `3,917,271`
- distinct subjects on that surface:
  = `3,168,234`
- distinct gene subjects on that surface:
  = `5,312`
- `relationship_evidence` rows with `evidence_type='clinvar_variant_derived'`
  = `340,179`

So the earlier zero-count ClinVar-derived bridge result also came from the wrong small DB lineage.

### Consequence

The main integrity problem is now understood more precisely:
- not “the ClinVar bridge was erased from code”
- not even necessarily “the bridge disappeared from the working DB”
- but “multiple DB lineages were being mixed together during analysis”

That must be resolved in every future benchmark/audit note:
- always record which DB lineage/environment was queried
- never compare small-lineage SQL directly to large-lineage benchmark claims without explicit lineage proof

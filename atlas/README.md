# Genovy Atlas

This atlas is a non-destructive library layer over the existing Genovy project history.

It does not rename, move, or delete the original files. Instead, it adds a lookup structure on top of them so the project can be searched by:

- phase
- gene
- experiment bundle
- lineage / environment correction

## Main lookup files

- Phase index:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/phase-index.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/phase-index.md)
- Gene index:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/gene-index.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/gene-index.md)
- Experiment manifest:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiment-manifest.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/atlas/experiment-manifest.md)

## Experiment bundles

Each folder under `atlas/experiments/` is a wrapper bundle for one experiment or recovery step.

Each bundle should contain:

- `summary.md`
- question
- lineage used
- original files generated together
- short conclusion
- current status:
  - `kept`
  - `superseded`
  - `current baseline`
  - `open`
  - `disproved`

## Lineage rule

This project now has multiple important DB lineages. Any future benchmark, audit, or shadow note should record:

- repo path
- git branch / commit
- Railway environment
- DB lineage
- output artifact path

Anchor docs:

- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/db-lineage-audit-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/db-lineage-audit-20260326.md)
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/integrity-findings-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/integrity-findings-20260326.md)
- [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/railway-ops-map-20260326.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/railway-ops-map-20260326.md)

## Naming rule going forward

Do not mass-rename old files.

For new wrapper bundles, prefer:

`YYYYMMDD-<experiment-name>/summary.md`

For new primary docs and outputs, prefer descriptive names that include:

- date
- scope or gene
- method
- lineage when relevant

Example:

- `20260326-official-real-v1-handoff-floor-1.0`
- `20260326-u2af2-real-v1-omim-shadow`
- `20260326-ankrd11-symmetric-omim-shadow`

## Preservation note

The old original repo and the preserved snapshots remain valid evidence surfaces:

- original output snapshot:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326)
- clone output snapshot:
  - [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/clone-output-snapshot-20260326](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/clone-output-snapshot-20260326)

This atlas points into those preserved surfaces when the original experiment files were not tracked directly in the working repo.

## Artifact Location Map 2026-03-26

This map explains where the Genovy artifact split existed at the start of preservation and how it is being normalized.

### Original repo output tree

Source path:
- `/Users/ahmedelmorshedy/Genovy/output`

This tree contains the most important late-stage benchmark and shadow outputs, including:
- `official-benchmark-post-clinvar-run54.json`
- `handoff-floor-1.0.json`
- `shadow-generic-specific-direct-handoff-floor-20260325.json`
- `shadow-generic-specific-direct-handoff-floor-20260325-w1.0.json`
- `shadow-stxbp1-support-handoff-override-20260325.json`
- `shadow-stxbp1-case-slice-handoff-floor-20260325*.json`
- `shadow-u2af2-public-source-candidates-20260326.json`
- `shadow-u2af2-omim-candidates-20260326.json`

Preserved in canonical repo as:
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326`

### Canonical clone output tree

Source path:
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output`

This tree is smaller and mainly holds:
- ClinVar run54 ops summaries
- small working-era ops artifacts
- consultant update JSON

Preserved in canonical repo as:
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/clone-output-snapshot-20260326`

### Docs and scripts

The later March 25-26 explanation layer lives directly in the canonical repo under:
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs`
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/scripts`
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/src/services`
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/test`

### Rule going forward

The canonical file-based library is:
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914`

The old original repo is preserved, not deleted, but future preservation references should point at the canonical repo and its `preservation/` snapshots.

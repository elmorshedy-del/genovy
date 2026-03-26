## Git History Audit 2026-03-26

This note pins the active Genovy code lineage and the current local/pushed split.

### Canonical active repository

- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914`
- remote:
  - `https://github.com/elmorshedy-del/genovy.git`
- active branch:
  - `codex/non-negotiable-phase0-20260322-1605`

### Original repository

- `/Users/ahmedelmorshedy/Genovy`
- local branch:
  - `main`
- role now:
  - legacy/original repo root
  - still holds a large output tree that was later cloned into:
    - `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation/original-output-snapshot-20260326`

### Key preserved commit chronology

- `7301663`
  - `Freeze Genovy v0 with audits and benchmark artifacts`
- `1f37a2a`
  - `Start Phase 0 source freshness audit`
- `31452c9`
  - `Complete Phase 0 source freshness refresh`
- `9d70617`
  - `Record Phase 1 identity repair findings`
- `e68cfda`
  - `Stream full ClinVar sync with derived gene-disease support`
- `de9ff5a`
  - `Harden ClinVar full sync transport and progress`
- `c050c8d`
  - `Add ClinVar sync QC checker`
- `07a4002`
  - `Add ClinVar resume checkpoint support`
- `a3b9204`
  - `Shorten ClinVar sync DB connection lifetime`
- `7a7c31b`
  - `Audit post-ClinVar graph state and benchmark`
- `4f95620`
  - `Run STXBP1 direct enrichment shadow test`
- `57c45ad`
  - `Audit ranked outputs for ranking-problem cases`
- `76dce6d`
  - `Probe SPTAN1 scorer and reassess PPP2R1A`
- `138d131`
  - `Audit STXBP1 single-case miss`
- `f324077`
  - `Audit STXBP1 disease branch selection`
- `c6364f5`
  - `Test STXBP1 discriminating-term shadow`

### Current uncommitted local state

The canonical repo currently contains uncommitted preservation-era work beyond `c6364f5`, including:

- the `1.0` specific-direct handoff scorer patch
- its associated test update
- March 25-26 writeups and shadow scripts
- preservation docs and snapshots

Those local changes are the file-based state that must now be committed and pushed so the latest benchmark-winning lineage is not stranded only on disk.

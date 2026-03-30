## Chronology Manifest 2026-03-26

This is the preservation-era chronological map for the major Genovy phases that need to remain visible together.

### 1. Pre-freeze competitive baseline

Preserve:
- early official benchmark outputs
- walkback experiments
- truth-side audit files
- consultant packets
- pre-freeze scoring iterations

Representative source surface:
- `/Users/ahmedelmorshedy/Genovy/output`

### 2. Freeze and controlled split

Preserve:
- GitHub freeze branch/tag state
- `freeze/v0/` materials
- non-negotiable plan
- Phase 0 source freshness audit
- Phase 1 identity repair audit

Representative docs:
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genovy-non-negotiable-fixes.md`
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/source-freshness-audit-phase0-20260322.md`
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/identity-repair-sweep-phase1-20260322.md`

### 3. Post-freeze ClinVar / targeted audit phase

Preserve:
- post-ClinVar run54 benchmark outputs
- ranking-problem audits
- STXBP1 / SPTAN1 / PPP2R1A / U2AF2 shadow tests
- diary and project-log updates

Representative outputs:
- `/Users/ahmedelmorshedy/Genovy/output/official-benchmark-post-clinvar-run54.json`
- `/Users/ahmedelmorshedy/Genovy/output/shadow-generic-specific-direct-handoff-floor-20260325-w1.0.json`
- `/Users/ahmedelmorshedy/Genovy/output/handoff-floor-1.0.json`

### 4. Preservation and integrity recovery phase

Preserve:
- local repo copies
- Codex session backups
- DB dump files
- DB-lineage correction docs
- Railway environment correction notes

Representative roots:
- `/Users/ahmedelmorshedy/Genovy-preservation-backups/20260326-024058`
- `/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/preservation`

### Rule for future chronology

Every benchmark or audit writeup must record:
- code commit / branch
- DB environment / lineage
- benchmark command
- artifact path
- whether the result belongs to small lineage (`81,870`) or large `v1-working` lineage (`3,251,168`)

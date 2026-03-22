# Genovy DX Handoff

Use this file to start fresh threads without relying on chat memory.

## Canonical Workspace
- Main repo with saved outputs: [/Users/ahmedelmorshedy/Genovy](/Users/ahmedelmorshedy/Genovy)
- Active implementation worktree: [/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914)
- Active branch: `codex/phenotype-enrichment-step2-20260316-0914`

## Current DX Reality
- The official 100-case DX benchmark path is still rule-based.
- The live benchmark path is not using a deployed CatBoost DX ranker.
- CatBoost artifacts in the repo belong to separate gene-disease link discovery work.
- Remaining failures are mostly ranking failures, not missing-gene failures.

## What Was Built
- Live graph includes:
  - MONDO
  - HPO ontology
  - HPO disease-phenotype
  - HPO gene-disease
  - HPO gene-phenotype
  - Orphadata natural history
  - ClinGen
  - ClinVar
  - ClinicalTrials.gov
- Maintenance workflows exist for:
  - phenotype propagation
  - gene identity repair
  - canonical resolution rebuild
  - source enable/disable at ingest time

## Benchmark Timeline

### Official baseline
Source: [genovy-vs-exomiser-official-100.json](/Users/ahmedelmorshedy/Genovy/output/genovy-vs-exomiser-official-100.json)
- Genovy: `81 found`, `32 top-1`, `41 top-3`, `45 top-5`, `55 top-10`, `median rank 3`, `MRR 0.390464`
- Exomiser: `100 found`, `39 top-1`, `46 top-3`, `48 top-5`, `55 top-10`, `median rank 7.5`, `MRR 0.447212`

### Full enrichment + identity fixes
Source: [genovy-vs-exomiser-official-100-full-enrichment.json](/Users/ahmedelmorshedy/Genovy/output/genovy-vs-exomiser-official-100-full-enrichment.json)
- Genovy: `81 found`, `34 top-1`, `41 top-3`, `46 top-5`, `52 top-10`, `MRR 0.404633`
- Interpretation: early ranks improved, recall did not

### Direct phenotype-edge fix
Source: [genovy-vs-exomiser-official-100-direct-edge-fix.json](/Users/ahmedelmorshedy/Genovy/output/genovy-vs-exomiser-official-100-direct-edge-fix.json)
- Diagnosis: direct HPO disease-phenotype edges still existed in the DB, but the scoring path was not reaching them correctly
- This was `Scenario A`: routing problem, not data loss
- Genovy after fix: `80 found`, `33 top-1`, `45 top-5`, `55 top-10`, `MRR 0.395267`

### Propagation-weight heuristic
Source: [genovy-vs-exomiser-official-100-propagation-weight-heuristic.json](/Users/ahmedelmorshedy/Genovy/output/genovy-vs-exomiser-official-100-propagation-weight-heuristic.json)
- This is the best rule-based benchmark reached in this phase
- Genovy: `82 found`, `34 top-1`, `43 top-3`, `46 top-5`, `58 top-10`, `median rank 3`, `MRR 0.409669`
- Head-to-head: `Genovy better 32`, `Exomiser better 24`, `ties 25`
- Interpretation: direct disease support should stay strongest; propagated disease support is useful as fallback but must be downweighted

### Deep HPO with contradiction penalties
Source: [genovy-vs-exomiser-official-100-deeper-hpo.json](/Users/ahmedelmorshedy/Genovy/output/genovy-vs-exomiser-official-100-deeper-hpo.json)
- Genovy collapsed to: `68 found`, `16 top-1`, `21 top-3`, `26 top-5`, `32 top-10`, `MRR 0.211003`
- Interpretation: loading richer HPO fields was fine; subtracting contradiction penalties in a rule-based scorer was not

### Deep HPO with no contradiction penalties
Source: [genovy-vs-exomiser-official-100-deeper-hpo-no-penalty.json](/Users/ahmedelmorshedy/Genovy/output/genovy-vs-exomiser-official-100-deeper-hpo-no-penalty.json)
- Genovy: `82 found`, `34 top-1`, `43 top-3`, `46 top-5`, `57 top-10`, `median rank 3`, `MRR 0.409646`
- Delta vs propagation heuristic: `5 improved`, `1 worsened`, `0 regressed to miss`
- Interpretation: richer HPO fields can stay loaded, but contradiction penalties should not directly affect rule-based ranking yet

## Current Recommended Stable Position
- Keep:
  - direct-edge routing fix
  - propagation weighting heuristic
  - richer HPO fields loaded into DX path
  - contradiction metrics visible for analysis
- Do not keep:
  - contradiction penalties as direct score subtraction

## Most Important Findings
- The remaining gap is mostly phenotype-profile quality, not graph absence.
- Truth genes often score through weaker or broader disease nodes than related competitors.
- PPI random walk by itself did not rescue the hard cases enough to justify integration.
- Broad propagated disease profiles can swamp specific truth-side profiles.

## Hard Miss Families Still Open
- `SCN2A`, especially `PMID_33731876_fam421`
- `STXBP1`, especially `PMID_35190816_STX_Syrbe_6`
- `PPP2R1A`, especially `PMID_37761890_41`
- Also difficult earlier: `RERE`, `SETD2`, `SMARCC2`, `TRAF7`, `WWOX`, `U2AF2`

## Best Supporting Reports
- [audit-ranking-pressure.md](/Users/ahmedelmorshedy/Genovy/output/audit-ranking-pressure.md)
- [audit-regression-analysis.md](/Users/ahmedelmorshedy/Genovy/output/audit-regression-analysis.md)
- [audit-ranker-features.md](/Users/ahmedelmorshedy/Genovy/output/audit-ranker-features.md)
- [audit-ppi-feasibility.md](/Users/ahmedelmorshedy/Genovy/output/audit-ppi-feasibility.md)
- [direct-phenotype-edge-fix-step1-report.md](/Users/ahmedelmorshedy/Genovy/output/direct-phenotype-edge-fix-step1-report.md)
- [genovy-dx-project-log.md](/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/docs/genovy-dx-project-log.md)

## Design Direction
- Build stronger phenotype profiles before ranker training.
- Strongest next source stack:
  - GeneReviews
  - Orphadata / Orphanet
  - HPO as computable backbone
  - ClinGen as validity guardrail
  - DECIPHER for patient-level nuance
- Target phenotype model:
  - structured assertions with qualifiers like onset, progression, severity, distribution, neuropsychiatric context
  - literal source phrases with provenance and embeddings

## Workflow Lessons
- Large databases do not burn tokens by themselves.
- Token burn came from long threads, repeated benchmark JSON inspection, and large outputs.
- Best low-burn workflow:
  - keep raw/heavy data in cloud
  - expose narrow summaries through APIs
  - use docs plus saved outputs as memory
  - start new threads by phase with this handoff file

## Do Not Repeat
- Do not re-run the contradiction-penalty variant as a viable benchmark candidate.
- Do not assume CatBoost is already in the live DX path.
- Do not assume broad propagated disease support is always beneficial.
- Do not hardcode secrets or DB URLs into docs or code.

## Best Next Steps
1. Use the stable rule-based scorer at the propagation-weight plus no-penalty position.
2. Finish any missing strict Step 1 reporting from existing artifacts only.
3. Improve phenotype profile quality before DX ranker training.
4. After phenotype profiles are stable, build the real DX learning-to-rank pipeline.

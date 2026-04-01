# GeneReviews Quality Fixes Implemented (`2026-03-30`)

## Scope

Implemented the three main unresolved quality fixes in the settled GeneReviews pipeline:

1. negation / excluded handling
2. deterministic metadata evidence preservation plus onset-linkage guard
3. MedGemma prompt tightening

This was done without rerunning the full repaired `latest5` slice end to end.

## Files Changed

- `src/lib/genereviewsPipeline.js`
- `src/scripts/extractPhenotypeAnchors.js`
- `src/scripts/extractPhenotypeMetadata.js`
- `src/scripts/buildEnrichmentManifest.js`

## What Changed

### 1. Explicit negation / excluded handling

Implemented a conservative sentence-scoped negation detector in the anchor extraction path.

Behavior:

- rows like `no spasticity` can now survive as:
  - `status: "excluded"`
- phrases that are intrinsically abnormal/negative phenotype labels such as:
  - `absence of speech`
  - `absent speech`
  are not auto-flipped into excluded status

The anchor pipeline now keeps anchors keyed by:

- `hpo_id + status`

instead of collapsing everything into a single positive row per HPO.

### 2. Deterministic onset-linkage guard

Tightened deterministic onset extraction so it does not bridge across unsafe clause boundaries.

New guard rejects onset attachment when the bridge between phenotype mention and onset phrase includes:

- sentence/clause boundaries like `;`, `:`, `.`
- explicit clause shifts like `one also had`
- overly long multi-word bridges

This specifically fixes the observed deterministic error:

- `Cerebral infarct -> Congenital onset`

from:

- `... silent brain infarcts; one also had congenital nephrotic syndrome ...`

### 3. Deterministic evidence preservation

Deterministic metadata rows now preserve evidence instead of wiping it.

Before:

- deterministic frequency/onset rows often had:
  - `frequency_evidence = null`
  - `onset_evidence = null`

After:

- when deterministic extraction succeeds, the pipeline keeps the source sentence or local deterministic text as evidence

### 4. Excluded rows no longer get metadata fallback

Stage 5 metadata fallback now skips rows with:

- `status: "excluded"`

This keeps the metadata phase focused on present phenotypes and avoids nonsense metadata on explicitly absent findings.

### 5. Prompt tightening for MedGemma

The MedGemma metadata prompt was tightened with explicit rules:

- only assign onset when the onset phrase clearly modifies the target phenotype
- if the onset belongs to a different phenotype in the same sentence, return `null`
- do not use disease subtype adjectives/disorder names as phenotype onset
- only use `treatment_response` for explicit response/resistance/failure relative to treatment
- do not use prognosis, fertility compatibility, or untreated natural-history phrasing as treatment response

### 6. Cleanup stage now preserves status distinctions

Stage 6 cleanup no longer merges:

- present and excluded versions of the same HPO row

Parent-child collapse is also now status-aware.

## Validation Run

### Syntax checks

Passed:

- `node --check src/scripts/extractPhenotypeMetadata.js`
- `node --check src/scripts/buildEnrichmentManifest.js`
- `node --check src/scripts/extractPhenotypeAnchors.js`
- `node --check src/lib/genereviewsPipeline.js`

### Local helper validation

Confirmed:

- `no spasticity` produces an anchor row with:
  - `status: "excluded"`
- deterministic onset no longer links:
  - `brain infarcts -> congenital`
- deterministic onset still preserves:
  - `generalized hypotonia -> infancy`

### Direct MedGemma prompt probes

Used the live endpoint only for the exact failure probes, then paused it again.

Probe results:

- `Cerebral visual impairment` with:
  - `Hypermetropia with childhood onset (20%) and cortical visual impairment (11%) have been reported.`
  - result:
    - `onset_raw = null`
  - read:
    - desired fix landed

- `Pigmentary retinopathy` with:
  - `A few children with a clinical diagnosis of neonatal adrenoleukodystrophy had transient leopard spot pigmentary retinopathy ...`
  - result:
    - `onset_raw = null`
  - read:
    - desired fix landed

- `Oligozoospermia` with:
  - `Oligozoospermia may be compatible with fertility when the female partner is very fertile.`
  - result:
    - `treatment_response_raw = null`
  - read:
    - desired fix landed

## What Was Not Done Yet

- no full `latest5` rerun after these fixes
- no `100`-chapter run
- no full negation-quality benchmark yet

## Practical Read

The highest-signal quality fixes are now implemented.

The remaining work is not architectural uncertainty anymore.
It is:

- rerun the fixed settled `latest5` slice
- inspect changed rows
- then move to the `100`-chapter review-first pilot if the slice stays clean

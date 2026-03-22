# Opus Audit 1

Date: 2026-03-22

Status:
- first serious strategic synthesis after the March 16-22 benchmarking, ingestion, routing, and audit cycle
- not a source of truth by itself; it summarizes and interprets the saved evidence surfaces

## Purpose
This document records the first integrated plan-level audit after days of:
- source ingestion
- graph shaping
- identity repair
- benchmark experiments
- missed-case audits
- database spectrum checks

It exists so future planning does not reset to case-by-case guessing.

## Evidence Boundary
Inspected:
- official 100-case phenotype-only benchmark outputs vs Exomiser
- March 20-21 missed-case audit chain
- narrow live DB checks for:
  - `U2AF2`
  - the 12 unique truth genes behind the 18 current misses
  - whole-graph logical gene support counts

Intentionally not inspected:
- raw source dumps line by line
- broad mounted database crawls
- Exomiser source code internals
- new external benchmarks
- any new ingest or code changes

Confidence:
- high on the benchmark history, missed-case bucket shape, and the `U2AF2` diagnosis
- medium-high on the whole-graph structural spectrum
- medium on claims about what Exomiser is doing internally until independently verified

## Executive Read
The macro direction is now clear:
- The current rule-based scorer has reached the ceiling of what scoring-only changes can achieve with the current evidence layer.
- The remaining problem is mostly not missing genes.
- The remaining problem is mostly phenotype evidence quality on truth-side disease branches, plus a smaller set of genuine ranking failures.

That means the next leverage is:
1. pipeline completeness and source freshness
2. truth-side phenotype enrichment
3. only then semantic similarity and a learned ranker

## Current Stable Benchmark Position
Best stable rule-based result against the official 100-case phenotype-only Exomiser benchmark:

Source:
- `/Users/ahmedelmorshedy/Genovy/output/propagation-weight-heuristic-benchmark.md`
- `/Users/ahmedelmorshedy/Genovy/output/genovy-vs-exomiser-official-100-propagation-weight-heuristic.json`

Numbers:
- Genovy:
  - Found: `82`
  - Top-1: `34`
  - Top-3: `43`
  - Top-5: `46`
  - Top-10: `58`
  - MRR: `0.409669`
- Exomiser:
  - Found: `100`
  - Top-1: `39`
  - Top-3: `46`
  - Top-5: `48`
  - Top-10: `55`
  - MRR: `0.447212`

Interpretation:
- Genovy is already competitive on upper-rank quality once a case is found.
- Genovy already beats Exomiser on Top-10 in this benchmark snapshot.
- The main remaining gap is evidence coverage plus some ranking calibration, not total irrelevance.

## What The Experiments Established
The shadow and scoring experiments already answered several important questions:

Kept:
- direct-edge routing fix
- propagation-weight heuristic
- richer HPO fields can stay loaded

Rejected or parked:
- contradiction penalties in the rule-based scorer
- naive child-direct reroute
- child-profile borrow as a primary fix
- simple direct-support preference as a broad solution

Meaning:
- the graph/routing layer needed correction
- but routing corrections alone do not solve the remaining misses
- the remaining ceiling is evidence quality

## The 18 Misses: Final Shape
The 18 current missed cases collapse to 12 unique truth genes.

### Gene-Level Buckets

| Bucket | Meaning | Genes | Case count |
| --- | --- | --- | ---: |
| Empty shell | gene identity exists, but there is no disease or phenotype evidence attached | `U2AF2` | 2 |
| Undercovered linked disease branches | gene is connected, but linked disease profiles are still missing important patient terms | `WWOX`, `TRAF7`, `SOCS1`, `SETD2`, `ANKRD11`, `RERE` | 7 |
| Mixed / unstable support surface | gene has support, but specific direct disease support and broad propagated umbrella support compete in unstable ways | `STXBP1` | 4 |
| Ranking problem with usable evidence | gene has usable truth-side evidence; the scorer still fails to rank it high enough | `SCN2A`, `SPTAN1`, `PPP2R1A`, `SMARCC2` | 5 |

### The Most Important Clarification
Only `U2AF2` is a true empty shell.

That matters because it means:
- the remaining misses are not a sea of disconnected genes
- most of the miss set already has graph support
- the main issue is what is attached to the truth-side disease branches and how the scorer uses it

## The `U2AF2` Proof
`U2AF2` is the cleanest pipeline/evidence absence case.

Narrow live DB finding:
- canonical `U2AF2` identity rows exist
- both are from `gene_identity_repair`
- both explicitly carry:
  - `hpoCoverage.geneDisease = false`
  - `hpoCoverage.genePhenotype = false`
- current live counts:
  - disease links: `0`
  - phenotype links: `0`

Meaning:
- the identity layer was repaired
- the clinical evidence layer was never populated

This is not a ranking problem.
This is not weak evidence.
This is an empty truth-side surface.

## The Undercovered Genes
These genes are not empty. Their truth-side branches are too thin.

### `WWOX`
- live counts: `11` disease links, `133` phenotype links
- still missing from all linked disease profiles:
  - `Respiratory insufficiency`
  - `Progressive muscle weakness`
  - `CNS demyelination`
  - `Vegetative state`
  - `Enlarged sylvian cistern`
- direct-only gaps also include:
  - `Optic disc pallor`
  - `Hypertonia`
  - `Generalized hypotonia`
  - `Myoclonus`
  - `Poor head control`
  - `Feeding difficulties`
- read:
  - connected gene
  - severe syndrome features missing from the truth branch

### `TRAF7`
- live counts: `5` disease links, `148` phenotype links
- still missing from all linked disease profiles:
  - `Hypoplastic labia minora`
  - `Mask-like facies`
  - `Conductive hearing impairment`
  - `Protruding ear`
  - `Amblyopia`
  - `Poor suck`
  - `High myopia`
  - `Narrow palpebral fissure`
- read:
  - the branch exists
  - the syndrome description in the graph is still thinner than the patient

### `SOCS1`
- live counts: `4` disease links, `22` phenotype links
- still missing from all linked disease profiles:
  - `Sinusitis`
  - `Otitis media`
  - `Autoimmunity`
  - `Psoriasiform dermatitis`
  - `Pyoderma gangrenosum`
  - `Crohn's disease`
- read:
  - this is one of the clearest truth-branch undercoverage cases after `U2AF2`

### `SETD2`
- live counts: `10` disease links, `109` phenotype links
- still missing from all linked disease profiles:
  - `Motor delay`
  - `Abnormal facial shape`
  - `Accelerated skeletal maturation`

### `ANKRD11`
- live counts: `5` disease links, `142` phenotype links
- still missing from all linked disease profiles:
  - `Delayed speech and language development`
  - `Abnormality of the hand`
  - `Focal-onset seizure`

### `RERE`
- live counts: `5` disease links, `241` phenotype links
- still missing from all linked disease profiles:
  - `Synophrys`
- still missing from all linked direct profiles:
  - `Wide mouth`
  - `Compulsive behaviors`
  - `Intellectual disability`
- read:
  - the branch is relatively stronger than the others
  - but it is still not complete enough

## The Mixed Gene

### `STXBP1`
- live counts: `5` disease links, `111` phenotype links
- support path alternates between:
  - a specific direct disease: `MONDO:0012812` with `27` direct terms
  - a broad umbrella disease: `MONDO:0100062` with `0` direct and `786` propagated terms
- persistent all-profile gaps include:
  - `Emotional lability`
  - `Broad palm`
  - `Truncal ataxia`
  - `Head tremor`
  - `Bruxism`
  - `Pain insensitivity`
  - `Broad hallux`
  - `Hyperintensity of cerebral white matter on MRI`

Read:
- this is not a simple empty-vs-covered distinction
- the specific direct profile is cleaner but thin
- the broad umbrella profile is richer but noisy
- this is exactly the kind of case where typed child/direct/propagated evidence matters

## The Ranking Cases
These genes already have usable evidence surfaces.

### `SCN2A`
- live counts: `17` disease links, `321` phenotype links
- audited case: only `Seizure`
- nothing missing from all linked disease profiles
- read:
  - the problem is not missing evidence
  - the packet is extremely sparse and the scorer does not separate `SCN2A` well enough from the seizure-gene crowd

### `SPTAN1`
- live counts: `10` disease links, `139` phenotype links
- audited case:
  - `Delayed speech and language development`
  - `Microcephaly`
- best support disease matched both exactly
- nothing missing from all linked disease profiles
- read:
  - this is the cleanest pure ranking problem in the miss set

### `PPP2R1A`
- live counts: `5` disease links, `75` phenotype links
- no term was missing from all linked disease profiles
- but the best direct support still misses direct developmental features such as:
  - `Delayed speech and language development`
  - `Motor delay`
  - `Intrauterine growth retardation`
  - `Moderate intellectual disability`
  - `Short stature`
  - `ADHD`
  - `Feeding difficulties`
- read:
  - evidence exists somewhere in the branch
  - support selection and ranking are not exploiting it well enough

### `SMARCC2`
- live counts: `4` disease links, `94` phenotype links
- audited case was effectively:
  - `Autistic behavior`
- nothing missing from all linked disease profiles
- read:
  - another sparse ranking problem

## Whole-Graph Structural Spectrum
Narrow whole-graph aggregate over logical genes grouped by symbol:

Total logical genes: `5705`

| Structural bucket | Definition used | Count | Share |
| --- | --- | ---: | ---: |
| Hollow shell | `0` disease links and `0` phenotype links | `23` | `0.4%` |
| Sparse one-sided | disease-only or phenotype-only | `426` | `7.5%` |
| Poorly enriched two-sided | both sides present, but bottom quartile on both | `777` | `13.6%` |
| Better covered | all others | `4479` | `78.5%` |

Cutoffs used for the bottom quartile two-sided bucket:
- disease links `<= 3`
- phenotype links `<= 19`

Critical caution:
- this is a structural graph spectrum
- it is not the same as a clinical benchmark-quality spectrum
- a gene can be structurally “better covered” and still have a weak truth-side disease branch

So this number is useful, but should not be oversold.

## General Take
The overall engineering and methodology are strong.

The strongest positive points are:
- the benchmark discipline was real, not anecdotal
- regressions were measured and rolled back instead of rationalized away
- the graph keeps evidence typed and source-auditable
- the shadow experiment framework prevented premature “fixes” from being mistaken for progress

That matters because the project is no longer in:
- random case debugging

It is now in:
- system-level evidence engineering

The honest read is:
- the architecture is good enough to support serious improvement
- the current weak spots are source freshness, ingestion completeness, truth-branch phenotype quality, and the fact that the live scorer is still rule-based

## Did The Conversations Cover All Raised Questions?

### Covered well
- why the `18` misses remain
- why direct-vs-propagated routing tweaks alone did not solve the problem
- the `U2AF2` root cause
- the whole-graph structural spectrum (`23` hollow, `426` sparse one-sided, `777` poorly enriched two-sided)
- the typed-evidence principle:
  - exact direct > child-direct > propagated > umbrella spillover

### Partially covered
- the remaining `17` misses were bucketed, but only `U2AF2` was proven at the same level of live-graph specificity
- the `777 poorly enriched` genes are only structurally classified, not yet benchmark-clinically filtered
- Exomiser's phenotype matching mechanics are still inferred, not independently verified

### Not covered enough yet
- a concrete re-ingestion plan with exact sources and exact repair-aware flow
- the final DX ranker training recipe under realistic data constraints
- exact model-organism integration structure in the current graph
- Exomiser's exact source list and how it differs from ours

## What Is Required Now, Ordered By Impact

### 1. Re-ingestion pass for identity-repaired genes
This remains the highest-ROI immediate systems task.

Why:
- `U2AF2` proved the pattern can exist:
  - identity repaired
  - source coverage absent on the repaired node
  - no disease or phenotype evidence attached

What to do:
- get the full list of identity-repaired genes
- cross-reference which currently have zero or near-zero support
- re-run:
  - HPO gene-disease
  - HPO gene-phenotype
  - ClinGen
  - ClinVar
  specifically against those repaired identities
- then re-benchmark

Expected value:
- pipeline-only recoveries
- no scorer change required

### 2. Source freshness audit
This should happen before major enrichment work.

Why:
- staleness can look like algorithm weakness
- it affects both the miss set and the long-tail thin-support genes

Concrete task:
- record the exact versions/dates of:
  - HPO disease-phenotype
  - HPO gene-disease
  - HPO gene-phenotype
  - ClinGen
  - ClinVar
- diff current graph coverage against the newest releases
- count:
  - new gene-disease assertions
  - new gene-phenotype assertions
  - new disease-phenotype assertions

Why this matters for `U2AF2`:
- if the relevant disease entry or annotation landed after the current source snapshot, then “missing evidence” is partly a freshness issue, not just a mapping issue

### 3. Per-miss root cause confirmation
The miss set now has a stable bucket shape, but the remaining `17` still need the same style of confirmation that `U2AF2` received.

For each missed truth gene, confirm which of these is true:
- data absent from graph and absent from sources
- data in sources but not ingested
- data in graph but too thin
- data in graph and adequate, so the problem is ranking

Why this matters:
- these four conditions imply four different fixes
- without this separation, enrichment work and scorer work get mixed together

### 4. Implement semantic similarity scoring, but only after a small test gate
This is the most plausible algorithmic improvement after the data fixes.

Why:
- the audit files show many cases where exact direct overlap is low but the clinical descriptions are clearly close
- a phenotype-only benchmark should reward near-ontology matches, not only exact code equality

Test before full implementation:
1. take 3 ranking-problem cases:
   - `SPTAN1`
   - `SCN2A`
   - one `STXBP1` case
2. compare patient HPO terms to the truth-side disease profile
3. count how many patient terms are within 1-2 ontology hops of a disease term even when exact overlap is zero

If the near-miss count is substantial:
- semantic similarity is worth implementing

If not:
- it is probably not the main next lever

### 5. Build the ML ranker feature set
The feature plan in the audit is strong and should be preserved, but only after the evidence layer is cleaner.

Feature families that should survive into implementation:

Current phenotype overlap:
- exact direct overlap count
- exact direct overlap ratio
- exact propagated overlap count
- semantic similarity score once implemented
- number of patient terms with zero match anywhere

Support-disease quality:
- direct term count on the chosen disease
- propagated term count
- disease specificity
- whether the support disease is a specific branch or a broad umbrella
- evidence tier of the support path

Gene-level support:
- number of linked diseases
- number of linked phenotypes
- whether the gene sits in the hollow / sparse / poorly enriched structural buckets
- source coverage count

Comparative evidence later:
- mouse phenotype overlap
- zebrafish phenotype overlap
- cross-species semantic overlap

Candidate model families:
- CatBoost
- XGBoost
- ranking loss such as LambdaMART or equivalent

But:
- do not train seriously on the current tiny evidence-cleanliness state
- do not let the model learn around fixable data gaps

### 6. Model organism integration architecture
This should be treated as a separate evidence channel, not merged directly into human disease profiles.

Preferred structure:
- gene -> model organism -> model phenotypes
- cross-species mapping layer
- resulting overlap scores become ranker features

Why:
- helps thin human profiles
- does not pollute human disease truth surfaces
- preserves provenance and evidence type

## Settling The Two Dilemmas

### STXBP1: thin specific vs broad noisy
This is not best solved by picking one disease and deleting the other.

The cleaner strategy is:
- keep the specific direct disease branch as primary truth support
- enrich it until it is competitive
- keep the broad umbrella as secondary, typed fallback evidence

Concrete test:
1. extract STXBP1-specific missing features from richer narrative sources
2. add them only to the specific direct branch in a shadow copy
3. rerun just the STXBP1 cases
4. measure whether ranks improve without letting the umbrella drive the result

If that works:
- enrichment is the fix

If it does not:
- the scoring path still needs work even after enrichment

### SPTAN1: right profile exists, does not win
This is the cleanest ranking problem in the current miss set.

Concrete test:
1. pull the full ranked list for the `SPTAN1` case
2. inspect the top competitors
3. check:
   - what disease supported them
   - how many exact direct overlaps they had
   - whether they were helped by broad propagated umbrellas

If propagated umbrellas dominate:
- the specificity/propagation balance is still wrong

If true specific direct competitors dominate:
- then `SPTAN1` is not losing because of a broken scorer alone

## Additional Observations Worth Preserving

### The current `82/100` found rate may be artificially low
At least one miss (`U2AF2`) is a pipeline/evidence-attachment problem, not a scorer problem.

If a few more misses share that pattern:
- the current found rate understates the true algorithmic position

This should be established, not assumed.

### The zero-change result from direct-support preference is more important than it first looked
The direct-support-preference experiment changed almost nothing.

That suggests:
- disease selection by itself is not the main remaining lever
- relative ordering among competitors is staying similar
- the overlap computation itself may need to get more discriminative

This is one of the strongest indirect arguments for semantic similarity.

### The benchmark is small
The official benchmark is still only `100` cases.

That means:
- small metric movements can be noisy
- ML training remains fragile
- any future learned ranker needs either:
  - more cases
  - stronger regularization and validation discipline

### The database spectrum is not only a diagnostic; it may become a product feature
The fact that Genovy can say:
- this gene is hollow
- this gene is sparse one-sided
- this gene is structurally thin but not empty

could become a useful confidence surface for users.

That is a genuine differentiator:
- not just ranking
- but ranking plus evidence-density transparency

## Design Rule Going Forward
Do not flatten all enrichment into one blob.

Keep these evidence tiers explicit:
- exact disease direct
- child disease direct
- propagated / inferred
- comparative/model-organism

This matters both for:
- rule-based transparency now
- ranker features later

## Critical Commentary
<span style="color:#b91c1c"><strong>Commentary 1.</strong> The `U2AF2` proof is solid, but it is also unusually clean. It should not be allowed to dominate our intuition about the rest of the miss set.</span>

<span style="color:#b91c1c"><strong>Commentary 2.</strong> The `777 poorly enriched` number is useful, but structurally weak support is not the same thing as clinically meaningful benchmark failure. We should resist treating it as a direct backlog size until it is intersected with clinically relevant rare-disease genes or benchmark-important branches.</span>

<span style="color:#b91c1c"><strong>Commentary 3.</strong> Semantic similarity is the most plausible algorithmic next step, but it is still a hypothesis. The small 1-2 hop test should be treated as a gate, not as a formality.</span>

<span style="color:#b91c1c"><strong>Commentary 4.</strong> The proposed ML ranker feature set is strong, but the dataset is still too small and too distorted to justify confidence in a learned model yet. A ranker trained too early will mostly learn workarounds for missing evidence.</span>

<span style="color:#b91c1c"><strong>Commentary 5.</strong> Source freshness may reduce uncertainty faster than almost any new scoring experiment. If the source snapshots are stale, we are currently arguing over algorithmic behavior on an avoidably incomplete evidence layer.</span>

<span style="color:#b91c1c"><strong>Commentary 6.</strong> `STXBP1` should be treated as the canonical typed-evidence case: specific direct support should be enriched, not replaced by broad umbrellas. If we solve that case cleanly, it will set the pattern for many future truth-branch problems.</span>

## What This Audit Still Needs
This audit is materially stronger than the earlier planning notes, but it still needs a few missing pieces before it should be treated as fully actionable.

Needed next:
1. exact source snapshot dates and versions for the currently ingested HPO / ClinGen / ClinVar surfaces
2. the full list of identity-repaired genes, so the re-ingestion target set is not guessed from one example
3. the top competitors and support paths for the four ranking-problem genes
4. confirmation of whether richer sources such as GeneReviews, DECIPHER, or licensed OMIM-derived material are operationally available for enrichment
5. whether a larger benchmark can be accessed, even if only for validation rather than development

## Strategic Bottom Line
The first serious plan after the experimentation phase is now:
1. fix identity-repair and stale-source pipeline gaps
2. enrich the thin truth branches
3. test semantic similarity surgically
4. then train the ranker only after the phenotype layer is cleaner

That is the plan this audit should currently lock in.

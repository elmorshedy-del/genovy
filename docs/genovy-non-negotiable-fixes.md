# Genovy DX: Non-Negotiable Fixes, Checks, and Audits

Created: 2026-03-22
Context: Full project audit across all benchmark files, experiment results, missed-gene bucketing, and database spectrum analysis.
Baseline position: 82 found, 34 top-1, 46 top-5, 58 top-10, MRR 0.4097 (propagation-weight heuristic, no contradiction penalties).

---

## Hard Rule: No Benchmark Cheating

This is non-negotiable for all future enrichment and curation work.

- The benchmark may generate hypotheses about missing syndrome features.
- The benchmark may **not** define truth.
- Never add a term, edge, or disease assertion just because it improves a benchmark case.
- Never "cheat" a gene to a higher rank by copying terms from a winning competitor into the truth profile unless those terms are independently documented for the truth syndrome.
- All enrichment must be:
  - source-backed
  - shadow-tested first
  - attached at the disease-profile level, not the individual case level
  - recorded with provenance and rationale
- Seam repair and profile enrichment are separate operations:
  - missing `gene -> disease` support must not be disguised as phenotype enrichment
  - phenotype enrichment must not be used to hide a broken attachment path
- Promotion rule:
  - first prove the terms in a shadow profile
  - then check the whole truth-gene family slice
  - then rerun the full benchmark
  - only then promote into the real graph or canonical source layer

If source evidence is absent, leave the gap open and record it as an unresolved evidence hole. Do not invent truth from benchmark pressure.

---

## Phase 0: Source Freshness Audit

Nothing else matters if the data you're scoring against is stale. Do this before any other work.

### 0.1 — Date-stamp every ingested source

Check the file date or version tag on every source currently in the graph:

- HPO gene-disease annotations (phenotype.hpoa or equivalent)
- HPO gene-phenotype annotations (genes_to_phenotype.txt or equivalent)
- ClinGen gene-disease validity
- ClinVar gene-disease
- MONDO ontology release
- HPO ontology release
- Orphadata natural history

For each: record the release date, record when you ingested it, record the current latest release available from the source.

### 0.2 — Diff against latest releases

For HPO gene-disease and HPO gene-phenotype specifically:

- Download the latest release from https://hpo.jax.org/data/annotations
- Count total gene-disease pairs in your current ingested version vs. the latest
- Count total gene-phenotype pairs in your current ingested version vs. the latest
- Compute the delta: how many new assertions exist that you don't have

This tells you the total gap from staleness alone, across all genes, not just the 18 misses.

### 0.3 — Check Exomiser's source list

Exomiser documents their data sources. Confirm which sources they use for phenotype matching by checking their documentation or release notes. Compare against your source list. Any source they have that you don't is a candidate for ingestion. Likely sources to check: OMIM morbidmap, HPO annotations, Orphanet gene-disease, DECIPHER.

### 0.4 — Confirmation gate

Do not proceed to Phase 1 until you have:

- [ ] A dated inventory of every source in the graph
- [ ] A delta count of missing assertions from stale sources
- [ ] A list of sources Exomiser uses that you do not

---

## Phase 1: Pipeline Fixes (Data Exists, Not Attached)

These are cases where the clinical data exists in your sources but is not connected to the gene in your graph, either because ingestion was never re-run after identity repair, or because the source was stale at ingestion time.

### 1.1 — U2AF2 re-ingestion

Gene: U2AF2
Status: Identity repaired, zero disease links, zero phenotype links.
Root cause confirmed: OMIM 620535 (DEVDFB — developmental delay, dysmorphic facies, and brain anomalies) exists and has HPO annotations. Your ingestion pipeline did not re-run after identity repair.
Affected benchmark cases: PMID_37962958_43 (25 patient terms), PMID_36747105_proband (7 patient terms).

Action:

- Re-run HPO gene-disease ingestion for U2AF2
- Re-run HPO gene-phenotype ingestion for U2AF2
- Re-run ClinGen and ClinVar ingestion for U2AF2
- Verify that MONDO:0000 entry for DEVDFB (or equivalent) is present and linked
- Verify that HPO terms from the DEVDFB phenotype annotation are now attached
- Re-run benchmark on these 2 cases specifically
- Expected outcome: both cases should now be found; rank depends on profile completeness

### 1.2 — Full identity-repair re-ingestion sweep

U2AF2 is confirmed. Other genes may have the same problem.

Action:

- Pull the full list of genes that went through identity repair
- For each, query the graph for disease_links and phenotype_links counts
- Cross-reference: any gene with identity repaired AND (disease_links = 0 OR phenotype_links = 0) is a candidate for the same pipeline gap
- For each candidate, check whether the latest HPO/ClinGen/ClinVar sources contain assertions for that gene
- Re-run ingestion for all confirmed gaps
- Re-benchmark

### 1.3 — Stale-source re-ingestion

If Phase 0 found significant deltas between your ingested source versions and the latest releases:

- Re-ingest HPO gene-disease from the latest release
- Re-ingest HPO gene-phenotype from the latest release
- Re-ingest ClinGen and ClinVar from latest releases
- Run a before/after diff: how many new gene-disease and gene-phenotype links were added
- Re-benchmark the full 100 cases
- Document which previously-missed cases are now found

### 1.4 — Confirmation gate

Do not proceed to Phase 2 until you have:

- [ ] U2AF2 re-ingested and both cases re-benchmarked
- [ ] All identity-repaired genes checked for pipeline gaps
- [ ] Sources updated to latest available releases
- [ ] Full 100-case benchmark re-run on updated graph
- [ ] New baseline numbers recorded (this becomes the real baseline going forward)

---

## Phase 2: Source Enrichment (Data Thin, Needs Richer Profiles)

These are the 6 undercovered genes plus STXBP1. They have disease links and phenotype links in the graph, but the disease profiles are missing terms that patients actually present with. The data exists in published literature and specialized databases but is not in your current source stack.

### 2.1 — GeneReviews as primary enrichment source

GeneReviews (https://www.ncbi.nlm.nih.gov/books/NBK1116/) contains expert-authored clinical descriptions for most established rare disease genes. These descriptions include phenotype features that go far beyond what structured databases like HPO annotations capture — behavioral features, GI symptoms, dysmorphic details, progression patterns.

Check GeneReviews coverage for each undercovered gene:

| Gene | Disease links | Phenotype links | Missing features (from audits) | GeneReviews entry exists? |
|------|--------------|-----------------|-------------------------------|--------------------------|
| WWOX | 11 | 133 | Respiratory insufficiency, progressive muscle weakness, CNS demyelination, vegetative state, enlarged sylvian cistern | Check |
| TRAF7 | 5 | 148 | Hypoplastic labia minora, mask-like facies, conductive hearing impairment, protruding ear, amblyopia, poor suck, high myopia, narrow palpebral fissure (14 of 26 patient terms missing) | Check |
| SOCS1 | 4 | 22 | Sinusitis, otitis media, autoimmunity, psoriasiform dermatitis, pyoderma gangrenosum, Crohn's disease (all 6 patient terms missing from every profile) | Check |
| SETD2 | 10 | 109 | Motor delay, abnormal facial shape, accelerated skeletal maturation | Check |
| ANKRD11 | 5 | 142 | Delayed speech and language development, abnormality of the hand, focal-onset seizure | Check |
| RERE | 5 | 241 | Synophrys, wide mouth, compulsive behaviors, intellectual disability (from direct profiles) | Check |
| STXBP1 | 5 | 111 | Emotional lability, broad palm, truncal ataxia, head tremor, bruxism, pain insensitivity, broad hallux, WM hyperintensity (plus GI and behavioral features across cases) | Check |

Action for each gene where GeneReviews entry exists:

- Extract all phenotype features from the clinical description
- Map each to HPO terms
- Identify which are already in the graph vs. which are new
- Add new HPO-disease assertions to the direct disease profile with source provenance tagged as "genereviews"
- Do NOT merge into propagated umbrella diseases — attach to the specific direct disease node

### 2.2 — STXBP1 targeted enrichment test

STXBP1 is the most instructive test case because it has 4 missed cases and 4 found-but-low-rank cases (ranks 10, 26, 28, 34, 39, 66). That gives you 8 data points to measure improvement.

Action:

- Pull STXBP1 clinical description from GeneReviews
- Extract all phenotype features, map to HPO
- Create a shadow copy of the database
- Add the new HPO terms to DEE4 (MONDO:0012812) direct profile only
- Re-benchmark all 8 STXBP1 cases (4 missed + 4 low-rank)
- Record: how many misses recovered? how much did ranks improve for found cases?
- This is the validation test for whether enrichment works before you do it at scale

Expected: if enrichment adds 15-20 terms to DEE4's direct profile, most of the 4 misses should become found, and the 4 low-rank cases should improve substantially. If this does NOT happen, the problem is in the scoring algorithm, not the data, and you should stop enrichment work and focus on semantic similarity first.

### 2.3 — SOCS1 special case

SOCS1 is the worst non-empty gene: 22 phenotype links, and all 6 patient terms missing from every linked profile. This looks like it may be a recently established gene-disease association where HPO annotations haven't caught up.

Action:

- Check when OMIM added the SOCS1 immunodysregulation entry
- Check whether HPO has annotated that entry with phenotype terms in their latest release
- If yes: this is a staleness fix (covered by Phase 1.3)
- If no: this requires manual curation or a new source. Check DECIPHER and Orphanet for SOCS1 phenotype data

### 2.4 — DECIPHER as secondary enrichment source

DECIPHER (https://www.deciphergenomics.org/) contains patient-level phenotype data from clinical genomics labs. It provides observed HPO terms per patient per gene, which is richer than curated disease-level profiles for rare genes with few reported cases.

Action:

- Check DECIPHER data access requirements (may require registration)
- For each undercovered gene, check whether DECIPHER has patient records with HPO terms
- If available, aggregate patient-level HPO terms into gene-level phenotype profiles
- These become a separate evidence channel: "decipher_patient_phenotype"
- Weight below direct disease assertions but above propagated umbrella assertions

### 2.5 — Confirmation gate

Do not proceed to Phase 3 until you have:

- [ ] GeneReviews coverage checked for all 7 genes
- [ ] STXBP1 enrichment test completed with measured results
- [ ] SOCS1 root cause confirmed (stale source vs. true gap)
- [ ] Full 100-case benchmark re-run on enriched graph
- [ ] New baseline numbers recorded
- [ ] Decision documented: does enrichment work well enough, or is scoring the bottleneck?

---

## Phase 3: Scoring Algorithm Fixes

Only start this after Phases 1-2 are complete and re-benchmarked. The 4 ranking-problem genes (SCN2A, SPTAN1, PPP2R1A, SMARCC2) need algorithm work, not data work. And the STXBP1 enrichment test result tells you whether algorithm work is also needed for the undercovered genes.

### 3.1 — Ranked output audit for all ranking-problem cases

You've diagnosed these as ranking problems but have not looked at what competitors beat them. This is the essential diagnostic.

For each ranking-problem case, pull the full ranked output (top 20 genes minimum):

| Case | Truth gene | Current rank | Action |
|------|-----------|-------------|--------|
| PMID_33731876_fam421 | SCN2A | miss | Pull top 20, examine competitor support paths |
| PMID_36331550_Family16Patient21 | SPTAN1 | miss | Pull top 20, examine competitor support paths |
| PMID_37761890_41 | PPP2R1A | miss | Pull top 20, examine competitor support paths |
| PMID_37761890_43 | PPP2R1A | miss | Pull top 20, examine competitor support paths |
| PMID_30580808_Lo_twin_2-Fam-52 | SMARCC2 | miss | Pull top 20, examine competitor support paths |

For each competitor gene in the top 20:

- What disease supported it?
- Direct or propagated?
- How many exact direct overlaps?
- How many propagated-only overlaps?
- Is the support disease a specific leaf disease or a broad umbrella?

Classification: if most competitors above the truth gene are scoring through broad propagated diseases with 0 exact direct overlap, the propagation penalty is too weak. If competitors have legitimate specific direct matches, the truth gene genuinely has a weaker profile for this patient.

### 3.2 — Semantic similarity evaluation

Your scorer currently requires exact HPO term match. Exomiser uses Resnik information content over the HPO ontology, giving partial credit for ontologically close terms.

Action:

- Pick 5 cases: 2 from ranking-problem bucket, 2 from undercovered bucket (post-enrichment), 1 from mixed (STXBP1 post-enrichment)
- For each case, pull the patient HPO terms and the truth gene's best support disease HPO terms
- For every patient term that has 0 exact match in the disease profile, find the closest term in the disease profile by HPO tree distance (number of hops to nearest common ancestor)
- Count: how many patient-disease term pairs are within 1-2 hops but not exact matches?
- If this count is substantial (say, 3+ near-miss pairs per case on average), semantic similarity will meaningfully improve scoring
- If near zero, the gap is not in term matching granularity

This is a manual check on 5 cases. It takes a few hours and tells you whether to invest in implementing semantic similarity before ML.

### 3.3 — Propagation penalty calibration

The direct-support-preference experiment (Phase 05 in your experiment sequence) showed zero change when vetoing propagated-only winners. But the ranked output audit (3.1) may reveal that the propagation weight heuristic isn't penalizing broad diseases enough for ranking-problem cases.

Action:

- After completing 3.1, if broad propagated diseases are the main competitors beating truth genes:
- Test 2-3 stronger propagation penalty values on the full benchmark
- Track both overall MRR and specifically the ranking-problem cases
- Accept the penalty value that helps ranking-problem cases without regressing overall performance

### 3.4 — Inverse specificity feature (pre-ML)

For single-term cases like SCN2A/fam421 ("seizure") and SMARCC2 ("autistic behavior"), raw overlap is useless — every epilepsy gene matches "seizure."

A discriminating signal: for a given gene's support disease, what fraction of the disease's profile does the patient's terms represent? Matching 1 of 14 terms on a specific epilepsy disease is a stronger signal than matching 1 of 786 terms on a broad umbrella.

This can be implemented as a simple scoring adjustment in the rule-based scorer:

```
specificity_bonus = exact_overlap / disease_direct_term_count
```

Action:

- Implement specificity bonus as an additive or multiplicative factor
- Test on the full benchmark
- Track SCN2A and SMARCC2 cases specifically

### 3.5 — Confirmation gate

Do not proceed to Phase 4 until you have:

- [ ] Ranked output pulled and analyzed for all 5 ranking-problem cases
- [ ] Semantic similarity evaluation completed on 5 cases with measured near-miss counts
- [ ] Decision documented: implement semantic similarity yes/no
- [ ] Propagation penalty recalibrated if needed
- [ ] Specificity bonus tested
- [ ] Full 100-case benchmark re-run with all scoring changes
- [ ] New baseline numbers recorded

---

## Phase 4: ML Ranker Preparation

Only start this after Phases 1-3 are complete. The data must be enriched and the scoring insights from Phase 3 must inform the feature set.

### 4.1 — Larger benchmark acquisition

100 cases (82 found post-enrichment, likely 85-90) is dangerously small for ML training. Gradient-boosted models will overfit.

Action:

- Investigate DDD (Deciphering Developmental Disorders) published phenotype-gene datasets
- Investigate Orphanet benchmark cases
- Investigate 100,000 Genomes Project phenotype data availability
- Target: 300+ cases minimum, 500+ preferred
- Ensure new benchmark cases have the same format: HPO term list + truth gene
- Run the rule-based scorer on the expanded benchmark to establish baseline

### 4.2 — Feature vector design

Based on all findings from Phases 1-3, the ML ranker feature set should include:

Phenotype overlap features (per candidate gene):

- exact_direct_overlap_count
- exact_direct_overlap_ratio (overlap / patient_terms)
- exact_propagated_overlap_count
- exact_propagated_overlap_ratio
- semantic_similarity_best_match (if implemented)
- semantic_similarity_average (if implemented)
- patient_terms_with_zero_match_anywhere
- patient_terms_with_near_match_only

Support disease features:

- support_disease_direct_term_count
- support_disease_propagated_term_count
- support_disease_is_leaf (boolean: specific vs. umbrella)
- support_disease_gene_exclusivity (how many genes link to this disease — 1 is highly informative, 50 is generic)
- specificity_bonus (overlap / disease_term_count)
- evidence_provenance_tier (direct = 3, child-direct = 2, propagated = 1)

Gene-level features:

- total_disease_links
- total_phenotype_links
- evidence_density_bucket (hollow / sparse / poorly_enriched / well_covered)
- source_coverage_count (how many of your N sources mention this gene)

Model organism features (when added):

- mouse_phenotype_overlap_count
- mouse_phenotype_semantic_similarity
- zebrafish_phenotype_overlap_count
- zebrafish_phenotype_semantic_similarity
- cross_species_evidence_exists (boolean)

Target variable: truth gene rank (for LambdaMART ranking loss), or binary top-5 hit (for classification).

### 4.3 — Model organism integration architecture

When mouse (MGI/MP ontology) and zebrafish (ZFIN/ZP ontology) data are added:

- Ingest as a separate evidence channel, NOT merged into human disease profiles
- Gene → mouse model → mouse phenotypes (MP terms)
- Gene → zebrafish model → zebrafish phenotypes (ZP terms)
- Use uPheno or HPO cross-species mappings to compute overlap with patient HPO terms
- Store as separate feature columns for the ML ranker
- The model learns how much to trust mouse vs. zebrafish vs. human evidence from training data

Do not allow cross-species terms to inflate human disease profiles. Keep provenance clean.

### 4.4 — Training protocol

- Use LambdaMART (CatBoost or XGBoost with ranking loss) as the primary model
- Validation: leave-one-out cross-validation given small dataset (switch to k-fold if benchmark exceeds 300 cases)
- Feature importance analysis via SHAP after training
- Ablation study: train with and without model organism features, with and without semantic similarity features, to quantify the contribution of each evidence channel
- Compare ML ranker against rule-based scorer on the same benchmark to measure true improvement

### 4.5 — Confirmation gate

Do not train the ML ranker until:

- [ ] Benchmark expanded to 300+ cases (or documented decision to proceed with 100 and accept overfitting risk)
- [ ] All data enrichment from Phase 2 is complete
- [ ] Semantic similarity implemented or explicitly excluded with documented reasoning
- [ ] Model organism data integrated (or excluded from first training round with plan to add later)
- [ ] Feature vector finalized and all features computable for every candidate gene in every benchmark case

---

## Phase 5: Ongoing Audits (Continuous)

These are not one-time fixes. They are recurring checks that should run every time you update sources, change scoring, or add new data.

### 5.1 — Regression benchmark

After every change (source update, scoring change, new data integration):

- Run full 100-case benchmark (and expanded benchmark when available)
- Compare against last recorded baseline
- Track: found rate, top-1, top-5, top-10, MRR, head-to-head vs. Exomiser
- Track per-case deltas: improved, worsened, recovered from miss, regressed to miss
- Document and store results with timestamp and description of change

Never ship a change that regresses overall MRR without explicit justification.

### 5.2 — Coverage spectrum re-audit

After every source ingestion or enrichment pass:

- Re-run the database spectrum query (hollow / sparse / poorly_enriched / well_covered)
- Compare against previous spectrum
- Track: did the number of hollow shells decrease? did poorly enriched genes improve?
- Flag any genes that moved backward (lost links due to re-ingestion bugs)

### 5.3 — Missed-case re-bucketing

After every benchmark run:

- Re-bucket all missed cases into: empty shell / undercovered / mixed / ranking problem
- Compare against previous bucketing
- Track: did any cases change buckets? (e.g., undercovered → ranking problem after enrichment)
- Prioritize remaining misses by bucket for next phase of work

### 5.4 — Source staleness check

Monthly or before any major benchmark push:

- Check release dates of HPO annotations, ClinGen, ClinVar, MONDO, Orphadata
- Compare against your ingested versions
- If any source is more than 3 months stale, flag for re-ingestion

---

## Appendix: Current State Reference

### Benchmark baseline (propagation-weight heuristic, pre-Phase-1)

| Metric | Genovy | Exomiser |
|--------|--------|----------|
| Found | 82 | 100 |
| Top-1 | 34 | 39 |
| Top-3 | 43 | 46 |
| Top-5 | 46 | 48 |
| Top-10 | 58 | 55 |
| Median rank | 3 | 7.5 |
| MRR | 0.4097 | 0.4472 |
| Head-to-head | Genovy 32 | Exomiser 24 |

### Missed gene bucketing (18 cases, 12 genes)

| Bucket | Genes | Cases | Fix type |
|--------|-------|-------|----------|
| Empty shell | U2AF2 | 2 | Pipeline re-ingestion |
| Undercovered | WWOX, TRAF7, SOCS1, SETD2, ANKRD11, RERE | 7 | Source enrichment |
| Mixed/unstable | STXBP1 | 4 | Enrichment + scoring |
| Ranking problem | SCN2A, SPTAN1, PPP2R1A, SMARCC2 | 5 | Algorithm fixes |

### Database spectrum (5,705 logical genes)

| Bucket | Count | Share |
|--------|-------|-------|
| Hollow shell | 23 | 0.4% |
| Sparse one-sided | 426 | 7.5% |
| Poorly enriched | 777 | 13.6% |
| Better covered | 4,479 | 78.5% |

### Experiment history (do not repeat failed experiments)

| Experiment | Result | Keep? |
|-----------|--------|-------|
| Propagation weight heuristic | +3 top-10, +17 improved, MRR 0.395→0.410 | YES — current baseline |
| Deeper HPO no penalty | Neutral (5 improved, 1 worsened) | YES — fields loaded |
| Deeper HPO with contradiction penalty | Catastrophic regression (MRR 0.410→0.211) | NO — reverted |
| Child-direct shadow reroute | Regression (31 worsened, 5 regressed to miss) | NO — reverted |
| Child-profile borrow | Flat (4 improved, 7 worsened) | NO — not worth complexity |
| Direct support preference | Zero change (0 improved, 0 worsened) | NO — proved routing is not the bottleneck |

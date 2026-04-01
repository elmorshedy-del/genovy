# GeneReviews `latest5` MedGemma Source Audit

## Scope

Manual-plus-structured accuracy audit of the repaired `latest5` MedGemma Stage-5 outputs against the true cleaned chapter text.

Inspected:

- `output/genereviews-pipeline-latest5-settled-20260330/stage1_fetch/*_clinical_text.txt`
- `output/genereviews-pipeline-latest5-settled-20260330/stage5_enriched_medgemma_clean/*_enriched.json`
- prior narrow comparison outputs for the same slice

Intentionally not inspected:

- no broader corpus beyond the fixed `latest5`
- no raw HTML beyond what was needed to confirm chapter text was present
- no new rerun

Evidence surface:

- source text
- structured MedGemma output
- targeted sentence-level spot checks

Confidence:

- medium-high for the concrete row-level failure patterns below
- not a full gold-label benchmark

## Aggregate Read

Across the 5 chapters, MedGemma produced:

- `75` metadata-bearing rows total
- `40` frequency rows
- `34` onset rows
- `3` progression rows
- `5` treatment-response rows

Evidence persistence as stored in the current output:

- frequency rows with exact stored evidence sentence present in source text: `3/40`
- onset rows with exact stored evidence sentence present in source text: `30/34`
- progression rows with exact stored evidence sentence present in source text: `3/3`
- treatment-response rows with exact stored evidence sentence present in source text: `5/5`

Important interpretation:

- the poor stored evidence rate for frequency is mostly a pipeline design issue, not necessarily a MedGemma issue
- deterministic metadata extraction currently nulls out `frequency_evidence` and `onset_evidence`
- so many correct deterministic rows appear evidence-less in the final JSON even when the source sentence is obvious

## Chapter-Level Read

### `YIF1B`

Rows with metadata:

- `Absent speech -> most`
- `Generalized hypotonia -> infancy`
- `Hypoventilation -> some`

Read:

- looks clean
- all 3 are strongly supported by the chapter text
- main issue is evidence persistence, not wrong value extraction

Examples from source:

- `absence of speech in most individuals`
- `Some individuals have hypoventilation.`
- `Generalized axial hypotonia of infancy`

### `Y Chromosome Infertility`

One metadata-bearing row:

- `Oligozoospermia -> treatment_response`

Read:

- questionable / likely wrong field assignment
- the source says:
  - `Oligozoospermia may be compatible with fertility when the female partner is very fertile.`
- this is prognosis / compatibility context
- it is not a treatment response

Conclusion:

- this is a schema/prompt boundary issue
- `treatment_response` is too permissive for non-treatment fertility/prognosis phrasing

### `ZAP70`

Overall read:

- mostly strong
- many onset assignments are genuinely useful and well grounded
- treatment-response rows are mostly reasonable
- one clear wrong onset came from deterministic leakage

Strong rows:

- `Autoimmunity -> older age`
- `Colitis -> infantile`
- `Congenital nephrotic syndrome -> Congenital`
- `Diarrhea -> first two years of life`
- `Failure to thrive -> first two years of life`
- `Lymphoma -> infancy`
- `treatment-refractory immune thrombocytopenia`
- `dermatitis resistant to therapy`

Clear wrong row:

- `Cerebral infarct -> Congenital onset`

Why it is wrong:

- source sentence:
  - `Two individuals presented with recurrent infections and silent brain infarcts; one also had congenital nephrotic syndrome and autoimmune hemolytic anemia ...`
- `congenital` modifies `nephrotic syndrome`
- it does not state congenital onset of `brain infarcts`

Conclusion:

- this is not a MedGemma hallucination
- it is a deterministic onset-linkage bug from a multi-clause sentence

### `Zellweger`

Overall read:

- strong chapter
- most added onset rows are useful and grounded
- one onset looks overcalled

Strong rows:

- `Adrenal insufficiency -> Childhood`
- `Osteopenia -> Childhood`
- `Feeding difficulties -> Neonatal`
- `Neonatal seizure -> Neonatal`, frequency `frequent`
- `Retinal dystrophy -> Childhood`
- `Sensorineural hearing impairment -> Childhood`
- `Jaundice -> neonatal`

Plausible but a bit inferential:

- `Decreased liver function -> Neonatal onset`
- `Elevated circulating hepatic transaminase concentration -> neonatal`

Questionable row:

- `Pigmentary retinopathy -> neonatal`

Why:

- source sentence:
  - `A few children with a clinical diagnosis of neonatal adrenoleukodystrophy had transient leopard spot pigmentary retinopathy ...`
- `neonatal` appears to describe the disease subtype
- it does not clearly state neonatal onset of the retinopathy itself

### `Zhu-Tokita-Takenouchi-Kim`

Overall read:

- strong on frequencies
- strong on some onset and progression rows
- but it shows another important onset over-attachment pattern

Strong rows:

- many percentage-backed frequency rows such as:
  - `vision abnormalities -> 58%`
  - `craniosynostosis -> 10%`
  - `IgG deficiency -> 15/46`
  - `heart defect -> 33%`
  - `microcephaly -> 11/40`
- onset/progression rows that look good:
  - `Seizure -> infancy to six years`
  - `Complex febrile seizure -> infancy to six years`
  - `Feeding difficulties -> Infancy`
  - `Dystonia -> childhood`, progression `worsened over time`

Questionable rows:

- `Cerebral visual impairment -> childhood onset`
- `Visual impairment -> childhood`

Why:

- source sentence:
  - `Hypermetropia with childhood onset (20%) and cortical visual impairment (11%) have been reported.`
- `with childhood onset` clearly attaches to `Hypermetropia`
- it does not clearly attach to `cortical visual impairment`
- the model over-propagated the onset to neighboring visual phenotypes in the same sentence

One important correction:

- `Generalized hypotonia -> Infantile onset` is defensible here
- the chapter contains:
  - `Generalized hypotonia of infancy`
- so that row should not be treated as an error

## What Is Actually Wrong

There are two different failure classes:

### 1. Prompt / model linkage errors

These are genuine extraction mistakes where onset is copied onto a nearby phenotype without a clear syntactic link.

Examples:

- `Pigmentary retinopathy -> neonatal`
- `Cerebral visual impairment -> childhood onset`
- `Visual impairment -> childhood`

### 2. Deterministic post-processing errors

These are not really MedGemma mistakes. They come from the deterministic metadata layer before fallback.

Examples:

- `Cerebral infarct -> Congenital onset`
- many rows with correct values but no stored evidence sentence

Root cause:

- `applyDeterministicMetadata()` populates frequency/onset from local text
- then explicitly sets:
  - `frequency_evidence = null`
  - `onset_evidence = null`

So the audit shows:

- some real prompt-level semantic leakage
- plus one clear post-processing observability leak

## Prompt Fixes Worth Making

### Prompt fix 1: explicit phenotype-linkage rule for onset

Add a rule like:

- only assign onset if the onset phrase clearly and directly modifies the target phenotype
- if one sentence lists multiple phenotypes and the onset phrase is clearly attached to only one of them, assign onset only to that phenotype
- otherwise return `null`

### Prompt fix 2: disease-subtype adjective guard

Add a rule like:

- do not use a disease subtype adjective as phenotype onset
- example:
  - `neonatal adrenoleukodystrophy` does not mean neonatal onset of every phenotype in that sentence

### Prompt fix 3: treatment-response restriction

Add a rule like:

- only fill `treatment_response_raw` when the text explicitly describes response, resistance, or failure relative to a treatment or therapy
- do not use fertility prognosis, compatibility, or disease outlook statements as treatment response

### Prompt fix 4: stronger null policy

Add a rule like:

- if onset or treatment linkage is ambiguous, return `null` even if a nearby phrase sounds medically plausible

## Post-Processing Fixes Worth Making

### Post-processing fix 1: preserve deterministic evidence

When deterministic frequency/onset extraction succeeds, store the actual source sentence or local match window into:

- `frequency_evidence`
- `onset_evidence`

This is needed for auditability and review safety.

### Post-processing fix 2: deterministic onset guard for multi-clause sentences

Do not assign deterministic onset when:

- the onset phrase is in a different clause after a semicolon/comma
- and appears to modify a different phenotype than the matched one

This is the exact issue behind:

- `Cerebral infarct -> Congenital onset`

### Post-processing fix 3: optional LLM validation only for ambiguous deterministic onset rows

Instead of sending everything back through the model, validate only deterministic onset rows that:

- come from a multi-phenotype sentence
- contain multiple candidate phenotypes
- or contain a disease-subtype adjective near the onset term

## Bottom Line

The truthful read across the `latest5` source audit is:

- MedGemma is good enough to remain the leading Stage-5 metadata branch
- it is not perfect
- the main remaining quality issues are narrow and actionable

Best next fix order:

1. preserve deterministic evidence
2. tighten deterministic onset linkage
3. tighten the MedGemma prompt on onset linkage and treatment-response scope
4. rerun the same `latest5` slice only

# MedGemma Spot Check: `Zellweger Spectrum Disorder`

## Scope

Narrow manual accuracy spot check of one chapter after the repaired settled `latest5` run.

Inspected:

- `output/genereviews-pipeline-latest5-settled-20260330/stage1_fetch/Zellweger_Spectrum_Disorder_clinical_text.txt`
- `output/genereviews-pipeline-latest5-settled-20260330/stage5_enriched_medgemma_clean/Zellweger_Spectrum_Disorder_enriched.json`

Intentionally not inspected:

- no other chapters
- no full gold-label adjudication
- no manifest promotion changes

Confidence:

- medium-high for this chapter-level spot check

## Why This Chapter

`Zellweger` was chosen because it showed one of the biggest MedGemma gains:

- Gemini preview onset-covered rows: `0`
- MedGemma onset-covered rows: `12`

So it is a strict test of whether MedGemma is truly finding grounded metadata or just overcalling.

## Manual Read

### Clearly correct or strongly defensible

- `Adrenal insufficiency -> Childhood`
  - source: `Older children may develop adrenal insufficiency ...`
  - read: correct

- `Osteopenia -> Childhood`
  - source: `Older children may develop adrenal insufficiency ... and osteopenia ...`
  - read: correct

- `Feeding difficulties -> Neonatal`
  - source: `Newborns are hypotonic with resultant poor feeding.`
  - read: correct

- `Neonatal seizure -> Neonatal`, frequency `frequent`
  - source: `Neonatal seizures are frequent ...`
  - read: correct

- `Seizure -> Neonatal`, frequency `frequent`
  - source: same sentence as above
  - read: defensible duplicate generalization from a more specific seizure row

- `Jaundice -> neonatal`
  - source: `Liver dysfunction may be evident as neonatal jaundice ...`
  - read: correct

- `Prolonged neonatal jaundice -> neonatal`
  - source: same sentence as above
  - read: defensible

- `Retinal dystrophy -> Childhood`
  - source: `Older children manifest retinal dystrophy ...`
  - read: correct

- `Sensorineural hearing impairment -> Childhood`
  - source: `Older children manifest ... sensorineural hearing loss ...`
  - read: correct

### Plausible but slightly inferential

- `Decreased liver function -> Neonatal onset`
  - source: `Liver dysfunction may be evident as neonatal jaundice and elevation in liver function tests.`
  - read: plausible, though the sentence describes neonatal evidence rather than a clean formal onset statement

- `Elevated circulating hepatic transaminase concentration -> neonatal`
  - source: same sentence as above
  - read: plausible, but still one step more inferential than the strongest rows

### Clearly questionable

- `Pigmentary retinopathy -> neonatal`
  - source: `A few children with a clinical diagnosis of neonatal adrenoleukodystrophy had transient leopard spot pigmentary retinopathy ...`
  - read: questionable / likely wrong as an onset assignment
  - reason:
    - `neonatal` here appears to modify the disease subtype `neonatal adrenoleukodystrophy`
    - it does not clearly state neonatal onset of pigmentary retinopathy itself

## Bottom Line

For this one chapter, MedGemma is:

- materially better on useful onset extraction than Gemini preview
- mostly grounded in real source sentences
- not perfect

Clean chapter-level read:

- strong / defensible rows: most
- slightly inferential rows: a few
- clearly wrong rows found in this spot check: `1`

So the honest interpretation is:

- MedGemma looks good enough to lead Stage 5
- but it still needs review-first handling and a later truth-set audit
- it should not be described as perfect

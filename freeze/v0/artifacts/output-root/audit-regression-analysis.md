# Regression Investigation

Generated at: 2026-03-16

## Scope

- Step: `Step 1` only
- Evidence sources inspected:
  - pre-enrichment saved raw DX traces under `/Users/ahmedelmorshedy/Genovy/output/pheval-run-official-100-prefix-cleanup/raw_results`
  - pre/post PhEval gene parquet outputs under `/Users/ahmedelmorshedy/Genovy/output/pheval-run-official-100-prefix-cleanup/pheval_gene_results` and `/Users/ahmedelmorshedy/Genovy/output/pheval-run-official-100-full-enrichment/pheval_gene_results`
  - live post-enrichment DX API: `POST /api/dx/rank-genes`
  - live post-enrichment public knowledge profiles: `GET /api/knowledge/profiles/:curie`
- Intentionally not inspected: raw mounted Railway data, private DB dumps, or recursive large-data scans

## High-Level Finding

- Regression cases after enrichment: `24`
- Cases where the post-rank-1 disease had matched propagated phenotype terms: `19/24`
- Matched propagation term mix: `propagated_from_gene=80`, `propagated_from_xref=8`, `propagated_from_parent=0`
- Bucket counts: `Bucket 1=4`, `Bucket 2=15`, `Bucket 3=5`

The largest bucket is `Bucket 2`: propagation mostly strengthened wrong-but-related disease-family competitors rather than completely unrelated diseases. The dominant mechanism was `propagated_from_gene`, not parent inheritance.

## Regression Table

| Case ID | Truth gene | Rank before | Rank after | New rank 1 gene | New rank 1 has propagated edges? | Propagation type | Specific propagated phenotype terms |
|---|---|---:|---:|---|---|---|---|
| PMID_10939567_EMD2_III-7 | LMNA | 6 | 13 | COL6A2 (same gene as before) | Yes | propagated_from_gene | propagated_from_gene: Ankle contracture -> Ankle contracture; propagated_from_gene: Spinal rigidity -> Spinal rigidity; propagated_from_gene: Proximal lower limb muscle weakness -> Quadriceps muscle weakness; propagated_from_gene: Generalized amyotrophy -> Generalized amyotrophy; propagated_from_gene: Stiff neck -> Neck joint contracture; propagated_from_gene: Elbow contracture -> Elbow contracture; propagated_from_gene: Proximal upper limb muscle weakness -> Progressive proximal muscle weakness |
| PMID_18551513_3 | LMNA | 17 | 32 | SELENON (same gene as before) | Yes | propagated_from_gene | propagated_from_gene: Axial muscle weakness -> Axial muscle weakness; propagated_from_gene: Muscle fiber atrophy -> Muscle fiber atrophy; propagated_from_gene: Muscular dystrophy -> Muscular dystrophy; propagated_from_gene: Respiratory insufficiency due to muscle weakness -> Intermittent episodes of respiratory insufficiency due to muscle weakness; propagated_from_gene: Poor head control -> Poor head control; propagated_from_gene: Delayed ability to walk -> Delayed ability to walk; propagated_from_gene: Decreased fetal movement -> Decreased fetal movement; propagated_from_gene: Proximal muscle weakness -> Gowers sign |
| PMID_21683322_25 | FBN1 | 7 | 8 | COL9A3 (new to post top-10 API slice; not in pre top-100) | Yes | propagated_from_gene, propagated_from_xref | propagated_from_gene: Internal notch of the femoral head -> Bilateral coxa valga; propagated_from_gene: Joint stiffness -> Limited knee extension; propagated_from_gene: Round face -> Flat face; propagated_from_gene: Long eyelashes -> Downslanted palpebral fissures; propagated_from_xref: Bulbous nose -> Depressed nasal bridge |
| PMID_26247899_P2-1 | SMAD2 | 1 | 2 | SMAD3 (was #2 before) | Yes | propagated_from_gene, propagated_from_xref | propagated_from_gene: Chronic fatigue -> Chronic fatigue; propagated_from_xref: Arachnodactyly -> Arachnodactyly |
| PMID_28074573_MA1 | PTPN11 | 14 | 16 | RAF1 (same gene as before) | Yes | propagated_from_xref | propagated_from_xref: Dysplastic pulmonary valve -> Abnormal pulmonary valve morphology; propagated_from_xref: Atrial septal defect -> Atrial septal defect |
| PMID_29058101_Patient1 | DOCK8 | 15 | 21 | DOCK11 (same gene as before) | No | — | — |
| PMID_29122497_29122497_P1 | ISCA2 | 78 | miss | PLP1 (was #3 before) | No | — | — |
| PMID_30356099_Patient7 | WWOX | 10 | 12 | FRRS1L (same gene as before) | Yes | propagated_from_gene | propagated_from_gene: Bilateral tonic-clonic seizure -> Bilateral tonic-clonic seizure; propagated_from_gene: EEG abnormality -> Continuous spike and waves during slow sleep; propagated_from_gene: Cerebral atrophy -> Cerebral atrophy |
| PMID_31021519_SATB2-29fromZarateetal2018aScottetal | SATB2 | 24 | 25 | ARHGAP29 (same gene as before) | Yes | propagated_from_gene | propagated_from_gene: Feeding difficulties in infancy -> Feeding difficulties in infancy; propagated_from_gene: Abnormality of the dentition -> Agenesis of lateral incisor; propagated_from_gene: Global developmental delay -> Delayed speech and language development |
| PMID_31239556_individual2Gregoretal | CTCF | 53 | 55 | CHAMP1 (same gene as before) | Yes | propagated_from_gene | propagated_from_gene: Delayed speech and language development -> Absent speech |
| PMID_32154675_Family4Patient11 | SMAD3 | 32 | 94 | BGN (same gene as before) | Yes | propagated_from_xref | propagated_from_xref: Arachnodactyly -> Arachnodactyly |
| PMID_33731876_fam115 | SCN2A | 6 | 11 | SCN1A (same gene as before) | Yes | propagated_from_gene | propagated_from_gene: Dysgenesis of the hippocampus -> Dysgenesis of the hippocampus; propagated_from_gene: Generalized tonic seizure -> Generalized tonic seizure; propagated_from_gene: Epileptic encephalopathy -> Epileptic encephalopathy; propagated_from_gene: Atonic seizure -> Atonic seizure; propagated_from_gene: Profound intellectual disability -> Profound intellectual disability; propagated_from_gene: Dyskinesia -> Dyskinesia; propagated_from_gene: EEG abnormality -> EEG with generalized sharp slow waves; propagated_from_gene: Abnormal cerebral white matter morphology -> Abnormal corpus callosum morphology |
| PMID_33731876_fam175 | SCN2A | 11 | 19 | KCNQ2 (same gene as before) | Yes | propagated_from_gene | propagated_from_gene: Focal tonic seizure -> Focal tonic seizure; propagated_from_gene: Generalized tonic seizure -> Generalized tonic seizure; propagated_from_gene: EEG with burst suppression -> EEG with burst suppression; propagated_from_gene: Multifocal epileptiform discharges -> Multifocal epileptiform discharges; propagated_from_gene: Epileptic encephalopathy -> Epileptic encephalopathy; propagated_from_gene: Hypsarrhythmia -> Hypsarrhythmia; propagated_from_gene: Infantile spasms -> Epileptic spasm; propagated_from_gene: EEG with generalized sharp slow waves -> EEG with burst suppression |
| PMID_33731876_fam220 | SCN2A | 12 | 13 | GNAO1 (same gene as before) | Yes | propagated_from_gene | propagated_from_gene: Hypsarrhythmia -> Hypsarrhythmia; propagated_from_gene: Infantile spasms -> Infantile spasms; propagated_from_gene: Dyskinesia -> Dyskinesia; propagated_from_gene: Chorea -> Chorea; propagated_from_gene: Hypoplasia of the corpus callosum -> Hypoplasia of the corpus callosum; propagated_from_gene: Cerebral atrophy -> Diffuse cerebral atrophy; propagated_from_gene: Global developmental delay -> Global developmental delay; propagated_from_gene: Intellectual disability -> Severe intellectual disability |
| PMID_33731876_fam341 | SCN2A | 4 | 30 | GABRA1 (same gene as before) | Yes | propagated_from_gene | propagated_from_gene: Epileptic encephalopathy -> Epileptic encephalopathy; propagated_from_gene: Apnea -> Apnea; propagated_from_gene: Corpus callosum atrophy -> Cerebral atrophy; propagated_from_gene: Spasticity -> Cogwheel rigidity |
| PMID_33731876_fam415 | SCN2A | 6 | 32 | SCN1A (same gene as before) | Yes | propagated_from_gene | propagated_from_gene: EEG with frontal sharp slow waves -> EEG with focal sharp slow waves; propagated_from_gene: Atypical absence seizure -> Atypical absence seizure; propagated_from_gene: Hyperkinetic movements -> Hyperkinetic movements; propagated_from_gene: Epileptic encephalopathy -> Epileptic encephalopathy; propagated_from_gene: EEG with abnormally slow frequencies -> EEG with generalized slow activity; propagated_from_gene: Profound intellectual disability -> Profound intellectual disability; propagated_from_gene: Gastrostomy tube feeding in infancy -> Gastrostomy tube feeding in infancy |
| PMID_33898683_43-year-oldman | PTPN11 | 5 | 11 | RYR2 (was #16 before) | Yes | propagated_from_gene, propagated_from_xref | propagated_from_gene: Mobitz I atrioventricular block -> Atrioventricular block; propagated_from_xref: Sensorineural hearing impairment -> Vertigo; propagated_from_xref: Low-set ears -> Vertigo; propagated_from_xref: Posteriorly rotated ears -> Vertigo; propagated_from_gene: Hypertelorism -> Bidirectional ventricular tachycardia; propagated_from_gene: Wide nasal bridge -> Bidirectional ventricular tachycardia; propagated_from_gene: Pectus excavatum -> Bidirectional ventricular tachycardia |
| PMID_34521999_32 | SON | 11 | miss | RNU4-2 (same gene as before) | No | — | — |
| PMID_34521999_43 | SON | 1 | 84 | DYRK1A (was #20 before) | Yes | propagated_from_gene | propagated_from_gene: Polymicrogyria -> Abnormality of neuronal migration |
| PMID_34521999_50 | SON | 10 | 91 | SATB1 (same gene as before) | Yes | propagated_from_gene | propagated_from_gene: Autistic behavior -> Autism; propagated_from_gene: Delayed speech and language development -> Absent speech; propagated_from_gene: Visual impairment -> Abnormality of vision |
| PMID_35190816_STX_23934111_fh | STXBP1 | 30 | miss | GABRG2 (same gene as before) | Yes | propagated_from_gene | propagated_from_gene: Absent speech -> Absent speech; propagated_from_gene: Exaggerated startle response -> Bradykinesia |
| PMID_36446582_Gnazzo2020_P1 | ANKRD11 | 9 | 58 | MBD5 (same gene as before) | Yes | — | — |
| PMID_36446582_Willemsen2010_P2 | ANKRD11 | 45 | miss | INTS1 (was #3 before) | No | — | — |
| PMID_36553465_P5 | SLC45A2 | 3 | 4 | MC1R (was #2 before) | Yes | propagated_from_gene | propagated_from_gene: White eyelashes -> White eyelashes; propagated_from_gene: White eyebrow -> White eyebrow; propagated_from_gene: Iris transillumination defect -> Iris transillumination defect; propagated_from_gene: Hypoplasia of the fovea -> Hypoplasia of the fovea; propagated_from_gene: Iris hypopigmentation -> Iris hypopigmentation; propagated_from_gene: Hypopigmentation of hair -> White hair; propagated_from_gene: Nevus -> Hyperpigmented nevi; propagated_from_gene: Reduced visual acuity -> Reduced visual acuity |

## Bucket Classification

- `Bucket 1`: `4` cases
  - Examples: `PMID_21683322_25`, `PMID_31021519_SATB2-29fromZarateetal2018aScottetal`, `PMID_33898683_43-year-oldman`, `PMID_36553465_P5`
- `Bucket 2`: `15` cases
  - Examples: `PMID_10939567_EMD2_III-7`, `PMID_18551513_3`, `PMID_26247899_P2-1`, `PMID_28074573_MA1`
- `Bucket 3`: `5` cases
  - Examples: `PMID_29058101_Patient1`, `PMID_29122497_29122497_P1`, `PMID_34521999_32`, `PMID_36446582_Gnazzo2020_P1`

## Bucket Notes

- `PMID_10939567_EMD2_III-7` -> `Bucket 2`: Same myopathy family; propagation strengthened a broader collagen VI disease profile rather than an unrelated disease.
- `PMID_18551513_3` -> `Bucket 2`: Same congenital myopathy family; propagation boosted a related muscle disease competitor.
- `PMID_21683322_25` -> `Bucket 1`: Stickler syndrome gained propagated craniofacial/skeletal terms that partially fit the case but point to the wrong disease family.
- `PMID_26247899_P2-1` -> `Bucket 2`: SMAD3 is a close pathway/disease-family competitor to SMAD2 in Loeys-Dietz/aortopathy space.
- `PMID_28074573_MA1` -> `Bucket 2`: RAF1 and PTPN11 are both Noonan/RASopathy genes; propagation helped the right disease family but wrong gene.
- `PMID_29058101_Patient1` -> `Bucket 3`: No matched propagated terms on the winning competitor; regression is not explained by propagation.
- `PMID_29122497_29122497_P1` -> `Bucket 3`: No matched propagated terms on the winning competitor; regression is not explained by propagation.
- `PMID_30356099_Patient7` -> `Bucket 2`: FRRS1L is another developmental/epileptic encephalopathy competitor; propagation favored the right family but wrong gene.
- `PMID_31021519_SATB2-29fromZarateetal2018aScottetal` -> `Bucket 1`: ARHGAP29 gained propagated cleft/feeding terms that match part of the phenotype but not the full SATB2 syndrome.
- `PMID_31239556_individual2Gregoretal` -> `Bucket 2`: CHAMP1 is a nearby neurodevelopmental syndrome competitor; propagation reinforced a generic NDD family match.
- `PMID_32154675_Family4Patient11` -> `Bucket 2`: BGN and SMAD3 are both connective tissue / aneurysm family competitors; propagation helped the family but wrong gene.
- `PMID_33731876_fam115` -> `Bucket 2`: SCN1A is a close epilepsy-family competitor to SCN2A, and gene-mediated propagation amplified that family-level overlap.
- `PMID_33731876_fam175` -> `Bucket 2`: KCNQ2 is a classic early epileptic encephalopathy competitor to SCN2A; propagation helped the right family but wrong gene.
- `PMID_33731876_fam220` -> `Bucket 2`: GNAO1 remained within the same early neurodevelopmental/epileptic disease family as SCN2A.
- `PMID_33731876_fam341` -> `Bucket 2`: GABRA1 stayed in the same epilepsy-family neighborhood; propagation strengthened that wrong-family competitor.
- `PMID_33731876_fam415` -> `Bucket 2`: SCN1A is a close epilepsy-family competitor to SCN2A, not an unrelated disease.
- `PMID_33898683_43-year-oldman` -> `Bucket 1`: RYR2 gained propagated terms that are not clinically coherent for the phenotype set and pulled an unrelated cardiac disease higher.
- `PMID_34521999_32` -> `Bucket 3`: No matched propagated terms on the winning competitor; regression is not explained by propagation.
- `PMID_34521999_43` -> `Bucket 2`: DYRK1A is another neurodevelopmental disorder competitor; propagation only nudged a generic NDD match higher.
- `PMID_34521999_50` -> `Bucket 2`: SATB1 is a neighboring neurodevelopmental disorder competitor rather than a completely unrelated disease.
- `PMID_35190816_STX_23934111_fh` -> `Bucket 2`: GABRG2 is a same-family epilepsy competitor to STXBP1, and propagation favored that family-level overlap.
- `PMID_36446582_Gnazzo2020_P1` -> `Bucket 3`: Winning competitor has propagated edges in its disease profile, but none of the matched trace terms came from propagation.
- `PMID_36446582_Willemsen2010_P2` -> `Bucket 3`: No matched propagated terms on the winning competitor; regression is not explained by propagation.
- `PMID_36553465_P5` -> `Bucket 1`: MC1R gained propagated pigmentation/vision terms that partially fit but point to the wrong disease concept.

## Bucket 1 Rollback Candidates

Bucket 1 is not the largest source of regressions, so a broad rollback is not justified from Step 1 alone. The most suspicious propagation-driven wrong-family boosts were:

- `PMID_21683322_25` / `COL9A3` / `Stickler syndrome`: propagated_from_gene: Internal notch of the femoral head -> Bilateral coxa valga; propagated_from_gene: Joint stiffness -> Limited knee extension; propagated_from_gene: Round face -> Flat face; propagated_from_gene: Long eyelashes -> Downslanted palpebral fissures; propagated_from_xref: Bulbous nose -> Depressed nasal bridge
- `PMID_31021519_SATB2-29fromZarateetal2018aScottetal` / `ARHGAP29` / `orofacial cleft`: propagated_from_gene: Feeding difficulties in infancy -> Feeding difficulties in infancy; propagated_from_gene: Abnormality of the dentition -> Agenesis of lateral incisor; propagated_from_gene: Global developmental delay -> Delayed speech and language development
- `PMID_33898683_43-year-oldman` / `RYR2` / `catecholaminergic polymorphic ventricular tachycardia`: propagated_from_gene: Mobitz I atrioventricular block -> Atrioventricular block; propagated_from_xref: Sensorineural hearing impairment -> Vertigo; propagated_from_xref: Low-set ears -> Vertigo; propagated_from_xref: Posteriorly rotated ears -> Vertigo; propagated_from_gene: Hypertelorism -> Bidirectional ventricular tachycardia; propagated_from_gene: Wide nasal bridge -> Bidirectional ventricular tachycardia; propagated_from_gene: Pectus excavatum -> Bidirectional ventricular tachycardia
- `PMID_36553465_P5` / `MC1R` / `melanoma, cutaneous malignant, susceptibility to, 5`: propagated_from_gene: White eyelashes -> White eyelashes; propagated_from_gene: White eyebrow -> White eyebrow; propagated_from_gene: Iris transillumination defect -> Iris transillumination defect; propagated_from_gene: Hypoplasia of the fovea -> Hypoplasia of the fovea; propagated_from_gene: Iris hypopigmentation -> Iris hypopigmentation; propagated_from_gene: Hypopigmentation of hair -> White hair; propagated_from_gene: Nevus -> Hyperpigmented nevi; propagated_from_gene: Reduced visual acuity -> Reduced visual acuity

## Step 1 Takeaway

Most regressions are not from obviously wrong unrelated diseases taking over. They are mostly from related disease-family competitors becoming stronger after gene-mediated phenotype propagation. That suggests Step 3 should prefer feature-level downweighting or retraining awareness of propagated edges over a broad rollback, unless Step 2 shows a cleaner feature-based separation.

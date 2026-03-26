# Ranking Pressure Audit

Generated at: 2026-03-16T11:36:52.457Z

## Scope

- Case input source: `/tmp/ranking-pressure-cases.json`
- Cases analyzed: 41
- Rich-support misses still unresolved after uncapped rerun: 0

## Step 3a: Score Comparison Table

| Case ID | Truth gene | Truth rank | Truth DX-Sim score | Truth DX-Graph score | Truth total score | Rank 1 gene | Rank 1 DX-Sim | Rank 1 DX-Graph | Rank 1 total |
|---|---|---:|---:|---:|---:|---|---:|---:|---:|
| PMID_27495153_Patient1 | WWOX | 542 | 0.155032 | 0.111819 | 0.155032 | PSAP | 0.241208 | 0.182545 | 0.241208 |
| PMID_29330883_Subject9 | RERE | 195 | 0.171308 | 0.108346 | 0.171308 | GATAD2B | 0.214651 | 0.220165 | 0.220165 |
| PMID_30580808_Lo_twin_2-Fam-52 | SMARCC2 | 392 | 0.180361 | 0.089476 | 0.180361 | NLGN1 | 0.252090 | 0.171421 | 0.252090 |
| PMID_32376980_11 | TRAF7 | 232 | 0.196823 | 0.138383 | 0.196823 | DOT1L | 0.239245 | 0.162687 | 0.239245 |
| PMID_33731876_fam421 | SCN2A | 103 | 0.111655 | 0.081349 | 0.111655 | GAL | 0.143623 | 0.097664 | 0.143623 |
| PMID_33766796_16 | SETD2 | 221 | 0.157920 | 0.113529 | 0.157920 | TCF20 | 0.223763 | 0.223763 | 0.223763 |
| PMID_35190816_STX_26865513_Patient_45 | STXBP1 | 113 | 0.204624 | 0.124080 | 0.204624 | TMEM106B | 0.251007 | 0.172541 | 0.251007 |
| PMID_35190816_STX_27159321_LD_0358 | STXBP1 | 172 | 0.152632 | 0.119290 | 0.152632 | RARS1 | 0.206069 | 0.109272 | 0.206069 |
| PMID_35190816_STX_28944233_270001 | STXBP1 | 287 | 0.181814 | 0.056849 | 0.181814 | RAI1 | 0.269026 | 0.256023 | 0.269026 |
| PMID_35190816_STX_Syrbe_6 | STXBP1 | 352 | 0.157297 | 0.112587 | 0.157297 | GAMT | 0.232479 | 0.230834 | 0.232479 |
| PMID_36331550_Family16Patient21 | SPTAN1 | 307 | 0.145438 | 0.098230 | 0.145438 | ZBTB11 | 0.168483 | 0.114568 | 0.168483 |
| PMID_36446582_Goldenberg2016_P13 | ANKRD11 | 358 | 0.103636 | 0.107090 | 0.107090 | GDF5 | 0.154827 | 0.118675 | 0.154827 |
| PMID_36446582_Miyatake2017_P1 | ANKRD11 | 156 | 0.137100 | 0.132787 | 0.137100 | GAL | 0.176941 | 0.120320 | 0.176941 |
| PMID_37761890_41 | PPP2R1A | 298 | 0.161547 | 0.098248 | 0.161547 | HNRNPC | 0.209888 | 0.142724 | 0.209888 |
| PMID_37761890_43 | PPP2R1A | 108 | 0.154573 | 0.104627 | 0.154573 | MACF1 | 0.172068 | 0.116066 | 0.172068 |
| PMID_18551513_3 | LMNA | 17 | 0.255338 | 0.216016 | 0.255338 | SELENON | 0.296910 | 0.168379 | 0.296910 |
| PMID_24369382_Family1II4 | WWOX | 37 | 0.198632 | 0.175977 | 0.198632 | SCN8A | 0.237753 | 0.132112 | 0.237753 |
| PMID_28074573_GB3 | PTPN11 | 16 | 0.204304 | 0.144193 | 0.204304 | CBL | 0.199866 | 0.224443 | 0.224443 |
| PMID_28074573_MA1 | PTPN11 | 14 | 0.226113 | 0.139316 | 0.226113 | RAF1 | 0.247930 | 0.160876 | 0.247930 |
| PMID_29058101_Patient1 | DOCK8 | 15 | 0.312294 | 0.313365 | 0.313365 | DOCK11 | 0.381905 | 0.351353 | 0.381905 |
| PMID_29122497_29122497_P1 | ISCA2 | 78 | 0.205062 | 0.139442 | 0.205062 | SELENOI | 0.272058 | 0.184405 | 0.272058 |
| PMID_31021519_Patient2fromKikuirietal | SATB2 | 31 | 0.145335 | 0.104391 | 0.145335 | ARHGAP29 | 0.185478 | 0.000000 | 0.185478 |
| PMID_31021519_SATB2-29fromZarateetal2018aScottetal | SATB2 | 24 | 0.164143 | 0.115678 | 0.164143 | ARHGAP29 | 0.204735 | 0.000000 | 0.204735 |
| PMID_31021519_individualfromTrakadisetal | SATB2 | 68 | 0.146129 | 0.105223 | 0.146129 | ARHGAP29 | 0.174761 | 0.000000 | 0.174761 |
| PMID_31239556_individual2Gregoretal | CTCF | 53 | 0.158012 | 0.108028 | 0.158012 | CHAMP1 | 0.175533 | 0.119362 | 0.175533 |
| PMID_31332438_CIII2 | SPTAN1 | 11 | 0.358613 | 0.272187 | 0.358613 | GNB4 | 0.403364 | 0.274288 | 0.403364 |
| PMID_32154675_Family4Patient11 | SMAD3 | 32 | 0.187536 | 0.193573 | 0.193573 | BGN | 0.218198 | 0.137373 | 0.218198 |
| PMID_33731876_fam163 | SCN2A | 91 | 0.198007 | 0.156979 | 0.198007 | SCN8A | 0.257185 | 0.136862 | 0.257185 |
| PMID_33731876_fam175 | SCN2A | 11 | 0.309029 | 0.127245 | 0.309029 | KCNQ2 | 0.325663 | 0.159743 | 0.325663 |
| PMID_33731876_fam220 | SCN2A | 12 | 0.241791 | 0.098087 | 0.241791 | GNAO1 | 0.258269 | 0.181827 | 0.258269 |
| PMID_33731876_fam9 | SCN2A | 86 | 0.285946 | 0.170785 | 0.285946 | GRIN2A | 0.404239 | 0.206042 | 0.404239 |
| PMID_34521999_32 | SON | 11 | 0.206090 | 0.206090 | 0.206090 | RNU4-2 | 0.236444 | 0.217528 | 0.236444 |
| PMID_35190816_STX_20887364_Subject_2103 | STXBP1 | 33 | 0.288665 | 0.200277 | 0.288665 | KCNQ2 | 0.353851 | 0.148139 | 0.353851 |
| PMID_35190816_STX_23934111_dl | STXBP1 | 12 | 0.281628 | 0.159580 | 0.281628 | GABRG2 | 0.301629 | 0.135642 | 0.301629 |
| PMID_35190816_STX_23934111_fh | STXBP1 | 30 | 0.250214 | 0.167336 | 0.250214 | GABRG2 | 0.294247 | 0.138219 | 0.294247 |
| PMID_35190816_STX_25818041_Patient_20 | STXBP1 | 58 | 0.221846 | 0.131773 | 0.221846 | GRIN2A | 0.284924 | 0.140797 | 0.284924 |
| PMID_35190816_STX_EG0598P | STXBP1 | 34 | 0.261692 | 0.145835 | 0.261692 | SCN1A | 0.305605 | 0.176578 | 0.305605 |
| PMID_35190816_STX_P_20 | STXBP1 | 38 | 0.240144 | 0.167128 | 0.240144 | KCNT1 | 0.287678 | 0.178879 | 0.287678 |
| PMID_36446582_Goldenberg2016_P24 | ANKRD11 | 15 | 0.173034 | 0.164912 | 0.173034 | MSX1 | 0.191424 | 0.065851 | 0.191424 |
| PMID_36446582_Willemsen2010_P2 | ANKRD11 | 45 | 0.191949 | 0.169849 | 0.191949 | SIN3A | 0.224639 | 0.153611 | 0.224639 |
| PMID_37761890_22 | PPP2R1A | 71 | 0.155990 | 0.081489 | 0.155990 | MACF1 | 0.187757 | 0.130272 | 0.187757 |

## Step 3b: Score Gaps

| Gap metric | Mean | Median |
|---|---:|---:|
| DX-Sim gap | 0.044588 | 0.042422 |
| DX-Graph gap | 0.014400 | 0.011751 |
| Total gap | 0.045065 | 0.042422 |

## Step 3c: Failure Pattern Assignment

| Case ID | Pattern | Why |
|---|---|---|
| PMID_27495153_Patient1 | A | Truth gene DX-Sim is more than 20% below rank 1. |
| PMID_29330883_Subject9 | A | Truth gene DX-Sim is more than 20% below rank 1. |
| PMID_30580808_Lo_twin_2-Fam-52 | A | Truth gene DX-Sim is more than 20% below rank 1. |
| PMID_32376980_11 | C | 1106 candidates score within 20% of the truth total score. |
| PMID_33731876_fam421 | A | Truth gene DX-Sim is more than 20% below rank 1. |
| PMID_33766796_16 | A | Truth gene DX-Sim is more than 20% below rank 1. |
| PMID_35190816_STX_26865513_Patient_45 | B | Truth gene DX-Sim is close to rank 1, but DX-Graph is more than 20% lower. |
| PMID_35190816_STX_27159321_LD_0358 | A | Truth gene DX-Sim is more than 20% below rank 1. |
| PMID_35190816_STX_28944233_270001 | A | Truth gene DX-Sim is more than 20% below rank 1. |
| PMID_35190816_STX_Syrbe_6 | A | Truth gene DX-Sim is more than 20% below rank 1. |
| PMID_36331550_Family16Patient21 | C | 1578 candidates score within 20% of the truth total score. |
| PMID_36446582_Goldenberg2016_P13 | A | Truth gene DX-Sim is more than 20% below rank 1. |
| PMID_36446582_Miyatake2017_P1 | A | Truth gene DX-Sim is more than 20% below rank 1. |
| PMID_37761890_41 | A | Truth gene DX-Sim is more than 20% below rank 1. |
| PMID_37761890_43 | C | 1312 candidates score within 20% of the truth total score. |
| PMID_18551513_3 | D | Scores are close, but the truth gene is still outside the clinically useful top ranks. |
| PMID_24369382_Family1II4 | C | 306 candidates score within 20% of the truth total score. |
| PMID_28074573_GB3 | B | Truth gene DX-Sim is close to rank 1, but DX-Graph is more than 20% lower. |
| PMID_28074573_MA1 | D | Scores are close, but the truth gene is still outside the clinically useful top ranks. |
| PMID_29058101_Patient1 | D | Scores are close, but the truth gene is still outside the clinically useful top ranks. |
| PMID_29122497_29122497_P1 | A | Truth gene DX-Sim is more than 20% below rank 1. |
| PMID_31021519_Patient2fromKikuirietal | A | Truth gene DX-Sim is more than 20% below rank 1. |
| PMID_31021519_SATB2-29fromZarateetal2018aScottetal | C | 615 candidates score within 20% of the truth total score. |
| PMID_31021519_individualfromTrakadisetal | C | 823 candidates score within 20% of the truth total score. |
| PMID_31239556_individual2Gregoretal | C | 1020 candidates score within 20% of the truth total score. |
| PMID_31332438_CIII2 | D | Scores are close, but the truth gene is still outside the clinically useful top ranks. |
| PMID_32154675_Family4Patient11 | C | 398 candidates score within 20% of the truth total score. |
| PMID_33731876_fam163 | A | Truth gene DX-Sim is more than 20% below rank 1. |
| PMID_33731876_fam175 | B | Truth gene DX-Sim is close to rank 1, but DX-Graph is more than 20% lower. |
| PMID_33731876_fam220 | B | Truth gene DX-Sim is close to rank 1, but DX-Graph is more than 20% lower. |
| PMID_33731876_fam9 | A | Truth gene DX-Sim is more than 20% below rank 1. |
| PMID_34521999_32 | D | Scores are close, but the truth gene is still outside the clinically useful top ranks. |
| PMID_35190816_STX_20887364_Subject_2103 | C | 163 candidates score within 20% of the truth total score. |
| PMID_35190816_STX_23934111_dl | D | Scores are close, but the truth gene is still outside the clinically useful top ranks. |
| PMID_35190816_STX_23934111_fh | C | 167 candidates score within 20% of the truth total score. |
| PMID_35190816_STX_25818041_Patient_20 | A | Truth gene DX-Sim is more than 20% below rank 1. |
| PMID_35190816_STX_EG0598P | C | 133 candidates score within 20% of the truth total score. |
| PMID_35190816_STX_P_20 | C | 197 candidates score within 20% of the truth total score. |
| PMID_36446582_Goldenberg2016_P24 | D | Scores are close, but the truth gene is still outside the clinically useful top ranks. |
| PMID_36446582_Willemsen2010_P2 | C | 400 candidates score within 20% of the truth total score. |
| PMID_37761890_22 | B | Truth gene DX-Sim is close to rank 1, but DX-Graph is more than 20% lower. |

## Step 3d: Pattern Distribution

| Pattern | Count | Percentage | Example case IDs |
|---|---:|---:|---|
| A | 16 | 39.0% | `PMID_27495153_Patient1`, `PMID_29330883_Subject9`, `PMID_30580808_Lo_twin_2-Fam-52` |
| B | 5 | 12.2% | `PMID_35190816_STX_26865513_Patient_45`, `PMID_28074573_GB3`, `PMID_33731876_fam175` |
| C | 13 | 31.7% | `PMID_32376980_11`, `PMID_36331550_Family16Patient21`, `PMID_37761890_43` |
| D | 7 | 17.1% | `PMID_18551513_3`, `PMID_28074573_MA1`, `PMID_29058101_Patient1` |

## Step 3e: Largest Pattern Detail

Largest pattern: A (16/41, 39.0%)

For each Pattern A case, the table below lists the truth gene-associated diseases, their phenotype coverage in the graph, and direct overlap with the patient HPO set.

### PMID_27495153_Patient1 (WWOX)
| Associated disease | ClinGen class | HPO terms in graph | Patient overlap |
|---|---|---:|---:|
| genetic developmental and epileptic encephalopathy (MONDO:0100062) | Definitive | 0 | 0 |
| autosomal recessive spinocerebellar ataxia 12 (MONDO:0013687) |  | 22 | 2 |
| developmental and epileptic encephalopathy, 28 (MONDO:0014533) |  | 50 | 6 |
| esophageal cancer (MONDO:0007576) |  | 2 | 0 |

### PMID_29330883_Subject9 (RERE)
| Associated disease | ClinGen class | HPO terms in graph | Patient overlap |
|---|---|---:|---:|
| complex neurodevelopmental disorder with or without congenital anomalies (MONDO:0100465) | Definitive | 0 | 0 |
| neurodevelopmental disorder with or without anomalies of the brain, eye, or heart (MONDO:0014857) |  | 90 | 5 |

### PMID_30580808_Lo_twin_2-Fam-52 (SMARCC2)
| Associated disease | ClinGen class | HPO terms in graph | Patient overlap |
|---|---|---:|---:|
| Coffin-Siris syndrome (MONDO:0015452) | Definitive | 0 | 0 |
| Coffin-Siris syndrome 8 (MONDO:0032702) |  | 29 | 0 |

### PMID_33731876_fam421 (SCN2A)
| Associated disease | ClinGen class | HPO terms in graph | Patient overlap |
|---|---|---:|---:|
| complex neurodevelopmental disorder (MONDO:0100038) | Definitive | 0 | 0 |
| benign familial infantile epilepsy (MONDO:0017615) |  | 0 | 0 |
| developmental and epileptic encephalopathy, 11 (MONDO:0013388) |  | 14 | 0 |
| episodic ataxia, type 9 (MONDO:0030064) |  | 16 | 1 |
| seizures, benign familial infantile, 3 (MONDO:0011904) |  | 9 | 0 |

### PMID_33766796_16 (SETD2)
| Associated disease | ClinGen class | HPO terms in graph | Patient overlap |
|---|---|---:|---:|
| SETD2-related neurodevelopmental disorder without or with macrocephaly/overgrowth (MONDO:0800477) | Definitive | 0 | 0 |
| SETD2-related microcephaly-severe intellectual disability-multiple congenital anomalies syndrome (MONDO:0035706) | Strong | 0 | 0 |
| intellectual developmental disorder, autosomal dominant 70 (MONDO:0859333) |  | 34 | 0 |
| Luscan-Lumish syndrome (MONDO:0014791) |  | 34 | 3 |
| Rabin-Pappas syndrome (MONDO:0859331) |  | 41 | 0 |

### PMID_35190816_STX_27159321_LD_0358 (STXBP1)
| Associated disease | ClinGen class | HPO terms in graph | Patient overlap |
|---|---|---:|---:|
| genetic developmental and epileptic encephalopathy (MONDO:0100062) | Definitive | 0 | 0 |
| developmental and epileptic encephalopathy, 4 (MONDO:0012812) |  | 27 | 1 |

### PMID_35190816_STX_28944233_270001 (STXBP1)
| Associated disease | ClinGen class | HPO terms in graph | Patient overlap |
|---|---|---:|---:|
| genetic developmental and epileptic encephalopathy (MONDO:0100062) | Definitive | 0 | 0 |
| developmental and epileptic encephalopathy, 4 (MONDO:0012812) |  | 27 | 1 |

### PMID_35190816_STX_Syrbe_6 (STXBP1)
| Associated disease | ClinGen class | HPO terms in graph | Patient overlap |
|---|---|---:|---:|
| genetic developmental and epileptic encephalopathy (MONDO:0100062) | Definitive | 0 | 0 |
| developmental and epileptic encephalopathy, 4 (MONDO:0012812) |  | 27 | 2 |

### PMID_36446582_Goldenberg2016_P13 (ANKRD11)
| Associated disease | ClinGen class | HPO terms in graph | Patient overlap |
|---|---|---:|---:|
| KBG syndrome (MONDO:0007846) | Definitive | 66 | 1 |

### PMID_36446582_Miyatake2017_P1 (ANKRD11)
| Associated disease | ClinGen class | HPO terms in graph | Patient overlap |
|---|---|---:|---:|
| KBG syndrome (MONDO:0007846) | Definitive | 66 | 5 |

### PMID_37761890_41 (PPP2R1A)
| Associated disease | ClinGen class | HPO terms in graph | Patient overlap |
|---|---|---:|---:|
| complex neurodevelopmental disorder (MONDO:0100038) | Definitive | 0 | 0 |
| Houge-Janssens syndrome (MONDO:0957553) |  | 0 | 0 |
| Houge-Janssens syndrome 2 (MONDO:0014605) |  | 37 | 3 |

### PMID_29122497_29122497_P1 (ISCA2)
| Associated disease | ClinGen class | HPO terms in graph | Patient overlap |
|---|---|---:|---:|
| mitochondrial disease (MONDO:0044970) | Definitive | 0 | 0 |
| multiple mitochondrial dysfunctions syndrome 4 (MONDO:0014611) |  | 16 | 3 |

### PMID_31021519_Patient2fromKikuirietal (SATB2)
| Associated disease | ClinGen class | HPO terms in graph | Patient overlap |
|---|---|---:|---:|
| SATB2 associated disorder (MONDO:0100147) | Definitive | 0 | 0 |
| chromosome 2q32-q33 deletion syndrome (MONDO:0012864) |  | 58 | 4 |

### PMID_33731876_fam163 (SCN2A)
| Associated disease | ClinGen class | HPO terms in graph | Patient overlap |
|---|---|---:|---:|
| complex neurodevelopmental disorder (MONDO:0100038) | Definitive | 0 | 0 |
| benign familial infantile epilepsy (MONDO:0017615) |  | 0 | 0 |
| developmental and epileptic encephalopathy, 11 (MONDO:0013388) |  | 14 | 2 |
| episodic ataxia, type 9 (MONDO:0030064) |  | 16 | 1 |
| seizures, benign familial infantile, 3 (MONDO:0011904) |  | 9 | 1 |

### PMID_33731876_fam9 (SCN2A)
| Associated disease | ClinGen class | HPO terms in graph | Patient overlap |
|---|---|---:|---:|
| complex neurodevelopmental disorder (MONDO:0100038) | Definitive | 0 | 0 |
| benign familial infantile epilepsy (MONDO:0017615) |  | 0 | 0 |
| developmental and epileptic encephalopathy, 11 (MONDO:0013388) |  | 14 | 0 |
| episodic ataxia, type 9 (MONDO:0030064) |  | 16 | 0 |
| seizures, benign familial infantile, 3 (MONDO:0011904) |  | 9 | 0 |

### PMID_35190816_STX_25818041_Patient_20 (STXBP1)
| Associated disease | ClinGen class | HPO terms in graph | Patient overlap |
|---|---|---:|---:|
| genetic developmental and epileptic encephalopathy (MONDO:0100062) | Definitive | 0 | 0 |
| developmental and epileptic encephalopathy, 4 (MONDO:0012812) |  | 27 | 1 |


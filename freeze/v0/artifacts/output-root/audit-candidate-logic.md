# Audit 3: Candidate Generation Logic Audit

## Scope

- Rich-support full misses analyzed: **15**
- Found-but-deep cases analyzed: **26**

Note: the current engine has no explicit disease-score threshold. For this audit, a disease was treated as a meaningful DX-Sim match when it appeared in the top 100 disease ranking for the case.

## Drop-out reason groups

- gene_present_but_outscored: **15**

## Rich-support miss table

| Case ID | Truth gene | Gene in graph? | Gene has phenotype edges? | Gene linked to a matching disease? | Top-100 gene candidates returned | Direct HPO overlap count | Best linked disease match | Drop-out reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PMID_27495153_Patient1 | WWOX | yes | yes (118) | no | 100 | 6 | none in top100 disease results | gene_present_but_outscored |
| PMID_29330883_Subject9 | RERE | yes | yes (182) | no | 100 | 6 | none in top100 disease results | gene_present_but_outscored |
| PMID_30580808_Lo_twin_2-Fam-52 | SMARCC2 | yes | yes (80) | no | 100 | 1 | none in top100 disease results | gene_present_but_outscored |
| PMID_32376980_11 | TRAF7 | yes | yes (147) | no | 100 | 12 | none in top100 disease results | gene_present_but_outscored |
| PMID_33731876_fam421 | SCN2A | yes | yes (208) | no | 100 | 1 | none in top100 disease results | gene_present_but_outscored |
| PMID_33766796_16 | SETD2 | yes | yes (67) | no | 100 | 3 | none in top100 disease results | gene_present_but_outscored |
| PMID_35190816_STX_26865513_Patient_45 | STXBP1 | yes | yes (97) | no | 100 | 4 | none in top100 disease results | gene_present_but_outscored |
| PMID_35190816_STX_27159321_LD_0358 | STXBP1 | yes | yes (97) | no | 100 | 3 | none in top100 disease results | gene_present_but_outscored |
| PMID_35190816_STX_28944233_270001 | STXBP1 | yes | yes (97) | no | 100 | 5 | none in top100 disease results | gene_present_but_outscored |
| PMID_35190816_STX_Syrbe_6 | STXBP1 | yes | yes (97) | no | 100 | 4 | none in top100 disease results | gene_present_but_outscored |
| PMID_36331550_Family16Patient21 | SPTAN1 | yes | yes (104) | no | 100 | 2 | none in top100 disease results | gene_present_but_outscored |
| PMID_36446582_Goldenberg2016_P13 | ANKRD11 | yes | yes (102) | no | 100 | 1 | none in top100 disease results | gene_present_but_outscored |
| PMID_36446582_Miyatake2017_P1 | ANKRD11 | yes | yes (102) | no | 100 | 6 | none in top100 disease results | gene_present_but_outscored |
| PMID_37761890_41 | PPP2R1A | yes | yes (50) | no | 100 | 3 | none in top100 disease results | gene_present_but_outscored |
| PMID_37761890_43 | PPP2R1A | yes | yes (50) | no | 100 | 5 | none in top100 disease results | gene_present_but_outscored |

## Found-but-deep cases

| Case ID | Truth gene | Truth rank | Truth DX-Sim / DX-Graph / total | Top 3 candidates above truth gene |
| --- | --- | --- | --- | --- |
| PMID_18551513_3 | LMNA | 17 | sim=0.255338 graph=0.216016 total=0.255338 | SELENON (#1, sim=0.296910, graph=0.168379, total=0.296910) ; ACTA1 (#2, sim=0.294237, graph=0.160656, total=0.294237) ; COL6A2 (#3, sim=0.284849, graph=0.152144, total=0.284849) |
| PMID_24369382_Family1II4 | WWOX | 37 | sim=0.198632 graph=0.175977 total=0.198632 | SCN8A (#1, sim=0.237753, graph=0.132112, total=0.237753) ; TMEM106B (#2, sim=0.228547, graph=0.212421, total=0.228547) ; SCN1A (#3, sim=0.228236, graph=0.129078, total=0.228236) |
| PMID_28074573_GB3 | PTPN11 | 16 | sim=0.204304 graph=0.144193 total=0.204304 | CBL (#1, sim=0.199866, graph=0.224443, total=0.224443) ; ANKRD11 (#2, sim=0.220886, graph=0.215843, total=0.220886) ; MAP2K2 (#3, sim=0.220537, graph=0.104613, total=0.220537) |
| PMID_28074573_MA1 | PTPN11 | 14 | sim=0.226113 graph=0.139316 total=0.226113 | RAF1 (#1, sim=0.247930, graph=0.160876, total=0.247930) ; SPRED2 (#2, sim=0.245347, graph=0.154578, total=0.245347) ; SOS1 (#3, sim=0.242499, graph=0.142326, total=0.242499) |
| PMID_29058101_Patient1 | DOCK8 | 15 | sim=0.312294 graph=0.313365 total=0.313365 | DOCK11 (#1, sim=0.381905, graph=0.351353, total=0.381905) ; CARD11 (#2, sim=0.347540, graph=0.376649, total=0.376649) ; CD247 (#3, sim=0.298953, graph=0.368606, total=0.368606) |
| PMID_29122497_29122497_P1 | ISCA2 | 78 | sim=0.205062 graph=0.139442 total=0.205062 | SELENOI (#1, sim=0.272058, graph=0.184405, total=0.272058) ; ACTL6B (#2, sim=0.267481, graph=0.161502, total=0.267481) ; PLP1 (#3, sim=0.265522, graph=0.202633, total=0.265522) |
| PMID_31021519_Patient2fromKikuirietal | SATB2 | 31 | sim=0.145335 graph=0.104391 total=0.145335 | ARHGAP29 (#1, sim=0.185478, graph=0.000000, total=0.185478) ; ARHGEF38 (#2, sim=0.185478, graph=0.000000, total=0.185478) ; COBLL1 (#3, sim=0.185478, graph=0.000000, total=0.185478) |
| PMID_31021519_SATB2-29fromZarateetal2018aScottetal | SATB2 | 24 | sim=0.164143 graph=0.115678 total=0.164143 | ARHGAP29 (#1, sim=0.204735, graph=0.000000, total=0.204735) ; ARHGEF38 (#2, sim=0.204735, graph=0.000000, total=0.204735) ; COBLL1 (#3, sim=0.204735, graph=0.000000, total=0.204735) |
| PMID_31021519_individualfromTrakadisetal | SATB2 | 68 | sim=0.146129 graph=0.105223 total=0.146129 | ARHGAP29 (#1, sim=0.174761, graph=0.000000, total=0.174761) ; ARHGEF38 (#2, sim=0.174761, graph=0.000000, total=0.174761) ; COBLL1 (#3, sim=0.174761, graph=0.000000, total=0.174761) |
| PMID_31239556_individual2Gregoretal | CTCF | 53 | sim=0.158012 graph=0.108028 total=0.158012 | CHAMP1 (#1, sim=0.175533, graph=0.119362, total=0.175533) ; BCL11B (#2, sim=0.175284, graph=0.170392, total=0.175284) ; WDR26 (#3, sim=0.168839, graph=0.166218, total=0.168839) |
| PMID_31332438_CIII2 | SPTAN1 | 11 | sim=0.358613 graph=0.272187 total=0.358613 | GNB4 (#1, sim=0.403364, graph=0.274288, total=0.403364) ; HSPB1 (#2, sim=0.390446, graph=0.380551, total=0.390446) ; GDAP1 (#3, sim=0.388265, graph=0.230204, total=0.388265) |
| PMID_32154675_Family4Patient11 | SMAD3 | 32 | sim=0.187536 graph=0.193573 total=0.193573 | BGN (#1, sim=0.218198, graph=0.137373, total=0.218198) ; COL11A1 (#2, sim=0.214542, graph=0.144380, total=0.214542) ; B4GALT7 (#3, sim=0.201550, graph=0.210029, total=0.210029) |
| PMID_33731876_fam163 | SCN2A | 91 | sim=0.198007 graph=0.156979 total=0.198007 | SCN8A (#1, sim=0.257185, graph=0.136862, total=0.257185) ; BAIAP2 (#2, sim=0.253185, graph=0.172166, total=0.253185) ; PCDH19 (#3, sim=0.252642, graph=0.189470, total=0.252642) |
| PMID_33731876_fam175 | SCN2A | 11 | sim=0.309029 graph=0.127245 total=0.309029 | KCNQ2 (#1, sim=0.325663, graph=0.159743, total=0.325663) ; GNAO1 (#2, sim=0.321693, graph=0.222375, total=0.321693) ; KCNT1 (#3, sim=0.317650, graph=0.210551, total=0.317650) |
| PMID_33731876_fam220 | SCN2A | 12 | sim=0.241791 graph=0.098087 total=0.241791 | GNAO1 (#1, sim=0.258269, graph=0.181827, total=0.258269) ; SLC25A22 (#2, sim=0.252923, graph=0.118859, total=0.252923) ; CACNA1E (#3, sim=0.249494, graph=0.126041, total=0.249494) |
| PMID_33731876_fam9 | SCN2A | 86 | sim=0.285946 graph=0.170785 total=0.285946 | GRIN2A (#1, sim=0.404239, graph=0.206042, total=0.404239) ; SCN8A (#2, sim=0.395167, graph=0.218168, total=0.395167) ; LGI1 (#3, sim=0.394808, graph=0.240975, total=0.394808) |
| PMID_34521999_32 | SON | 11 | sim=0.206090 graph=0.206090 total=0.206090 | RNU4-2 (#1, sim=0.236444, graph=0.217528, total=0.236444) ; GTF3C3 (#2, sim=0.218032, graph=0.148262, total=0.218032) ; RNU5B-1 (#3, sim=0.211955, graph=0.194999, total=0.211955) |
| PMID_35190816_STX_20887364_Subject_2103 | STXBP1 | 33 | sim=0.288665 graph=0.200277 total=0.288665 | KCNQ2 (#1, sim=0.353851, graph=0.148139, total=0.353851) ; GRIN1 (#2, sim=0.334916, graph=0.167671, total=0.334916) ; KCNT1 (#3, sim=0.334194, graph=0.211688, total=0.334194) |
| PMID_35190816_STX_23934111_dl | STXBP1 | 12 | sim=0.281628 graph=0.159580 total=0.281628 | GABRG2 (#1, sim=0.301629, graph=0.135642, total=0.301629) ; DNM1 (#2, sim=0.300599, graph=0.178932, total=0.300599) ; GABBR2 (#3, sim=0.295189, graph=0.189473, total=0.295189) |
| PMID_35190816_STX_23934111_fh | STXBP1 | 30 | sim=0.250214 graph=0.167336 total=0.250214 | GABRG2 (#1, sim=0.294247, graph=0.138219, total=0.294247) ; ARFGEF1 (#2, sim=0.273502, graph=0.185981, total=0.273502) ; PCDH19 (#3, sim=0.272714, graph=0.138683, total=0.272714) |
| PMID_35190816_STX_25818041_Patient_20 | STXBP1 | 58 | sim=0.221846 graph=0.131773 total=0.221846 | GRIN2A (#1, sim=0.284924, graph=0.140797, total=0.284924) ; AP2M1 (#2, sim=0.276245, graph=0.163874, total=0.276245) ; CHD2 (#3, sim=0.273257, graph=0.150715, total=0.273257) |
| PMID_35190816_STX_EG0598P | STXBP1 | 34 | sim=0.261692 graph=0.145835 total=0.261692 | SCN1A (#1, sim=0.305605, graph=0.176578, total=0.305605) ; ARFGEF1 (#2, sim=0.302669, graph=0.205815, total=0.302669) ; SCN2A (#3, sim=0.295977, graph=0.101546, total=0.295977) |
| PMID_35190816_STX_P_20 | STXBP1 | 38 | sim=0.240144 graph=0.167128 total=0.240144 | KCNT1 (#1, sim=0.287678, graph=0.178879, total=0.287678) ; PIGP (#2, sim=0.281400, graph=0.192849, total=0.281400) ; SCN2A (#3, sim=0.280127, graph=0.103344, total=0.280127) |
| PMID_36446582_Goldenberg2016_P24 | ANKRD11 | 15 | sim=0.173034 graph=0.164912 total=0.173034 | MSX1 (#1, sim=0.191424, graph=0.065851, total=0.191424) ; IRF6 (#2, sim=0.189974, graph=0.056811, total=0.189974) ; BRCA1 (#3, sim=0.155117, graph=0.181824, total=0.181824) |
| PMID_36446582_Willemsen2010_P2 | ANKRD11 | 45 | sim=0.191949 graph=0.169849 total=0.191949 | SIN3A (#1, sim=0.224639, graph=0.153611, total=0.224639) ; CTCF (#2, sim=0.224464, graph=0.155294, total=0.224464) ; INTS1 (#3, sim=0.224380, graph=0.152578, total=0.224380) |
| PMID_37761890_22 | PPP2R1A | 71 | sim=0.155990 graph=0.081489 total=0.155990 | MACF1 (#1, sim=0.187757, graph=0.130272, total=0.187757) ; DOHH (#2, sim=0.187498, graph=0.127499, total=0.187498) ; TMTC3 (#3, sim=0.183238, graph=0.103431, total=0.183238) |
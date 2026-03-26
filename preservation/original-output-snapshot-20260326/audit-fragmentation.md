# Audit 2: Fragmentation Audit

## Summary

- Gene symbols mapped to 2+ canonical concepts: **1**
- Gene entities with doubled-prefix CURIE bug (`NCBIGene:NCBIGene:*`): **5510**
- Distinct gene labels affected by doubled-prefix bug: **5505**

## Top fragmented genes by total outbound edge count

| Gene symbol | Concept count | Total outbound edges | Fragments |
| --- | --- | --- | --- |
| - | 6 | 9 | concept 50962: 3 edges -> NCBIGene:NCBIGene:105259599 ; concept 50964: 2 edges -> NCBIGene:NCBIGene:105804841 ; concept 50965: 1 edges -> NCBIGene:NCBIGene:109580095 ; concept 48600: 1 edges -> NCBIGene:NCBIGene:10108 ; concept 48076: 1 edges -> NCBIGene:NCBIGene:7467 ; concept 50967: 1 edges -> NCBIGene:NCBIGene:136932118 |

## Files

- Top fragmented genes TSV: [audit-fragmentation-top50.tsv](/Users/ahmedelmorshedy/Genovy/output/audit-fragmentation-top50.tsv)

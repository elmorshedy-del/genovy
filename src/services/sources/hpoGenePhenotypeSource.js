import { parseDelimitedText } from '../../lib/parseDelimited.js';
import { HTTP_CONSTANTS } from '../../constants/http.js';

export async function fetchHpoGenePhenotypeDataset(source) {
  const response = await fetch(source.accessUrl, {
    headers: { 'user-agent': HTTP_CONSTANTS.userAgent }
  });
  if (!response.ok) {
    throw new Error(`HPO gene-phenotype fetch failed: ${response.status}`);
  }
  const text = await response.text();
  const parsed = parseDelimitedText(text);

  const entities = [];
  const relationships = [];
  const sourceRecords = [];
  const seenGenes = new Set();

  for (const row of parsed.rows) {
    if (!row.ncbi_gene_id || !row.hpo_id) continue;
    const geneCurie = `NCBIGene:${row.ncbi_gene_id}`;
    const sourceRecordKey = `gene-phenotype:${geneCurie}:${row.hpo_id}:${row.disease_id || 'na'}`;

    if (!seenGenes.has(geneCurie)) {
      seenGenes.add(geneCurie);
      entities.push({
        entityType: 'gene',
        canonicalCurie: geneCurie,
        canonicalLabel: row.gene_symbol || geneCurie,
        description: '',
        primarySourceKey: source.sourceKey,
        metadata: {
          sourceType: 'hpo_gene_phenotype'
        }
      });
    }

    relationships.push({
      predicateKey: 'associated_with_phenotype',
      subjectRef: {
        curie: geneCurie,
        entityType: 'gene',
        label: row.gene_symbol || geneCurie
      },
      objectRef: {
        curie: row.hpo_id,
        entityType: 'phenotype',
        label: row.hpo_name || row.hpo_id
      },
      qualifiers: {
        frequency: row.frequency || '',
        diseaseId: row.disease_id || ''
      },
      evidence: {
        sourceRecordKey,
        evidenceType: 'gene_phenotype_association',
        evidenceCode: row.frequency || '',
        provenanceUrl: source.homepageUrl,
        payload: row
      }
    });

    sourceRecords.push({
      recordType: 'gene_phenotype',
      sourceRecordKey,
      canonicalCurie: geneCurie,
      payload: row
    });
  }

  return {
    sourceVersion: parsed.metadata.version || '',
    entities,
    aliases: [],
    xrefs: [],
    relationships,
    sourceRecords
  };
}

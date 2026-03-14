import { parseDelimitedText } from '../../lib/parseDelimited.js';
import { HTTP_CONSTANTS } from '../../constants/http.js';

export async function fetchHpoGeneDiseaseDataset(source) {
  const response = await fetch(source.accessUrl, {
    headers: { 'user-agent': HTTP_CONSTANTS.userAgent }
  });
  if (!response.ok) {
    throw new Error(`HPO gene-disease fetch failed: ${response.status}`);
  }
  const text = await response.text();
  const parsed = parseDelimitedText(text);

  const entities = [];
  const relationships = [];
  const sourceRecords = [];
  const seenGenes = new Set();

  for (const row of parsed.rows) {
    if (!row.ncbi_gene_id || !row.disease_id) continue;
    const geneCurie = `NCBIGene:${row.ncbi_gene_id}`;
    const sourceRecordKey = `gene-disease:${geneCurie}:${row.disease_id}:${row.association_type || 'na'}`;
    if (!seenGenes.has(geneCurie)) {
      seenGenes.add(geneCurie);
      entities.push({
        entityType: 'gene',
        canonicalCurie: geneCurie,
        canonicalLabel: row.gene_symbol || geneCurie,
        description: '',
        primarySourceKey: source.sourceKey,
        metadata: {
          sourceType: 'hpo_gene_disease'
        }
      });
    }

    relationships.push({
      predicateKey: 'associated_with_disease',
      subjectRef: {
        curie: geneCurie,
        entityType: 'gene',
        label: row.gene_symbol || geneCurie
      },
      objectRef: {
        curie: row.disease_id,
        entityType: 'disease',
        label: row.disease_id,
        isPlaceholder: true
      },
      qualifiers: {
        associationType: row.association_type || '',
        upstreamSource: row.source || ''
      },
      evidence: {
        sourceRecordKey,
        evidenceType: 'gene_disease_association',
        evidenceCode: row.association_type || '',
        provenanceUrl: row.source || source.homepageUrl,
        payload: row
      }
    });
    sourceRecords.push({
      recordType: 'gene_disease',
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

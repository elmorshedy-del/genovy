import { parseDelimitedText } from '../../lib/parseDelimited.js';
import { HTTP_CONSTANTS } from '../../constants/http.js';
import { normalizeNcbiGeneCurie } from '../../lib/curies.js';
import { extractHeaderSourceVersion, pickSourceVersion } from '../../lib/sourceVersion.js';

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
    const geneCurie = normalizeNcbiGeneCurie(row.ncbi_gene_id);
    if (!geneCurie || !row.disease_id) continue;
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
    sourceVersion: pickSourceVersion(parsed.metadata.version, extractHeaderSourceVersion(response.headers)),
    entities,
    aliases: [],
    xrefs: [],
    relationships,
    sourceRecords
  };
}

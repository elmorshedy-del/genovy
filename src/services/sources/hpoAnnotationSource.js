import { parseDelimitedText } from '../../lib/parseDelimited.js';
import { HTTP_CONSTANTS } from '../../constants/http.js';

function diseaseRefFromRow(row) {
  return {
    curie: row.database_id,
    entityType: 'disease',
    label: row.disease_name,
    isPlaceholder: true,
    metadata: {
      sourceDiseaseId: row.database_id
    }
  };
}

export async function fetchHpoDiseasePhenotypeDataset(source) {
  const response = await fetch(source.accessUrl, {
    headers: { 'user-agent': HTTP_CONSTANTS.userAgent }
  });
  if (!response.ok) {
    throw new Error(`HPO annotation fetch failed: ${response.status}`);
  }
  const text = await response.text();
  const parsed = parseDelimitedText(text);

  const relationships = [];
  const sourceRecords = [];
  for (const row of parsed.rows) {
    const diseaseId = row.database_id;
    const phenotypeId = row.hpo_id;
    if (!diseaseId || !phenotypeId) continue;
    const predicateKey = row.qualifier === 'NOT' ? 'lacks_phenotype' : 'has_phenotype';
    const sourceRecordKey = `annotation:${diseaseId}:${phenotypeId}:${row.reference || 'na'}`;

    relationships.push({
      predicateKey,
      subjectRef: diseaseRefFromRow(row),
      objectRef: {
        curie: phenotypeId,
        entityType: 'phenotype',
        label: row.hpo_id
      },
      qualifiers: {
        qualifier: row.qualifier || '',
        reference: row.reference || '',
        evidence: row.evidence || '',
        onset: row.onset || '',
        frequency: row.frequency || '',
        sex: row.sex || '',
        modifier: row.modifier || '',
        aspect: row.aspect || '',
        biocuration: row.biocuration || ''
      },
      evidence: {
        sourceRecordKey,
        evidenceType: 'disease_phenotype_annotation',
        evidenceCode: row.evidence || '',
        provenanceUrl: source.homepageUrl,
        payload: row
      }
    });
    sourceRecords.push({
      recordType: 'annotation',
      sourceRecordKey,
      canonicalCurie: diseaseId,
      payload: row
    });
  }

  return {
    sourceVersion: parsed.metadata.version || '',
    entities: [],
    aliases: [],
    xrefs: [],
    relationships,
    sourceRecords
  };
}

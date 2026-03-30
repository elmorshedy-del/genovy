import { parseDelimitedText } from '../../lib/parseDelimited.js';
import { HTTP_CONSTANTS } from '../../constants/http.js';
import { extractHeaderSourceVersion, pickSourceVersion } from '../../lib/sourceVersion.js';

function buildDiseaseCurie(row) {
  if (row.SourceID && row.SourceID.includes(':')) {
    return row.SourceID;
  }
  if (row.DiseaseMIM && /^\d+$/.test(row.DiseaseMIM)) {
    return `OMIM:${row.DiseaseMIM}`;
  }
  if (row.ConceptID && /^C\d+$/.test(row.ConceptID)) {
    return `MEDGEN:${row.ConceptID}`;
  }
  return '';
}

function pickGeneLabel(row) {
  const associated = row.AssociatedGenes || '';
  return associated.split(',').map((value) => value.trim()).find(Boolean) || `NCBIGene:${row.GeneID}`;
}

export async function fetchClinvarGeneDiseaseDataset(source) {
  const response = await fetch(source.accessUrl, {
    headers: { 'user-agent': HTTP_CONSTANTS.userAgent }
  });
  if (!response.ok) {
    throw new Error(`ClinVar gene-condition fetch failed: ${response.status}`);
  }
  const text = await response.text();
  const parsed = parseDelimitedText(text);

  const entities = [];
  const relationships = [];
  const sourceRecords = [];
  const seenGenes = new Set();

  for (const row of parsed.rows) {
    if (!row.GeneID) continue;
    const geneCurie = `NCBIGene:${row.GeneID}`;
    const geneLabel = pickGeneLabel(row);
    const diseaseCurie = buildDiseaseCurie(row);
    const sourceRecordKey = `clinvar:${geneCurie}:${row.ConceptID || diseaseCurie || row.DiseaseName}`;

    if (!seenGenes.has(geneCurie)) {
      seenGenes.add(geneCurie);
      entities.push({
        entityType: 'gene',
        canonicalCurie: geneCurie,
        canonicalLabel: geneLabel,
        description: '',
        primarySourceKey: source.sourceKey,
        metadata: {
          relatedGenes: row.RelatedGenes || ''
        }
      });
    }

    relationships.push({
      predicateKey: 'associated_with_disease',
      subjectRef: {
        curie: geneCurie,
        entityType: 'gene',
        label: geneLabel
      },
      objectRef: {
        curie: diseaseCurie,
        entityType: 'disease',
        label: row.DiseaseName || diseaseCurie || row.ConceptID,
        isPlaceholder: true,
        metadata: {
          conceptId: row.ConceptID || '',
          sourceName: row.SourceName || ''
        }
      },
      qualifiers: {
        conceptId: row.ConceptID || '',
        sourceName: row.SourceName || '',
        sourceId: row.SourceID || '',
        diseaseMim: row.DiseaseMIM || '',
        relatedGenes: row.RelatedGenes || '',
        lastUpdated: row.LastUpdated || ''
      },
      evidence: {
        sourceRecordKey,
        evidenceType: 'gene_disease_association',
        evidenceCode: row.SourceName || '',
        provenanceUrl: source.homepageUrl,
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

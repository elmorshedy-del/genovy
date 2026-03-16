import { parseCsv } from '../../lib/csv.js';
import { fetchSourceText } from '../../lib/sourceFetch.js';

const CLINGEN_HEADER_MARKER = '"GENE SYMBOL"';

export function stripClinGenCsvPreamble(text) {
  const markerIndex = text.indexOf(CLINGEN_HEADER_MARKER);
  if (markerIndex < 0) {
    return text;
  }
  return text.slice(markerIndex);
}

export function parseClinGenDate(rawValue) {
  const timestamp = Date.parse(String(rawValue || '').trim());
  if (Number.isNaN(timestamp)) {
    return '';
  }
  return new Date(timestamp).toISOString().slice(0, 10);
}

function isDividerValue(rawValue) {
  const value = String(rawValue || '').trim();
  return Boolean(value) && /^\++$/.test(value);
}

export async function fetchClinGenGeneDiseaseValidityDataset(source) {
  const text = await fetchSourceText(source.accessUrl);
  const rows = parseCsv(stripClinGenCsvPreamble(text)).filter((row) => {
    if (!row['GENE SYMBOL'] || !row['GENE ID (HGNC)'] || !row['DISEASE ID (MONDO)']) {
      return false;
    }

    return !isDividerValue(row['GENE SYMBOL']);
  });

  const entities = [];
  const relationships = [];
  const sourceRecords = [];
  const geneDiseaseValidityAssertions = [];
  const seenGenes = new Set();

  for (const row of rows) {
    const geneCurie = row['GENE ID (HGNC)'];
    const geneLabel = row['GENE SYMBOL'];
    const diseaseCurie = row['DISEASE ID (MONDO)'];
    const diseaseLabel = row['DISEASE LABEL'] || diseaseCurie;
    const sourceRecordKey = `clingen-validity:${geneCurie}:${diseaseCurie}`;

    if (!seenGenes.has(geneCurie)) {
      seenGenes.add(geneCurie);
      entities.push({
        entityType: 'gene',
        canonicalCurie: geneCurie,
        canonicalLabel: geneLabel,
        description: '',
        primarySourceKey: source.sourceKey,
        metadata: {
          sourceType: 'clingen_gene_disease_validity'
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
        label: diseaseLabel,
        isPlaceholder: true
      },
      qualifiers: {
        classification: row.CLASSIFICATION || '',
        modeOfInheritance: row.MOI || '',
        curationSop: row.SOP || '',
        classificationDate: parseClinGenDate(row['CLASSIFICATION DATE']),
        gcep: row.GCEP || '',
        onlineReportUrl: row['ONLINE REPORT'] || ''
      },
      evidence: {
        sourceRecordKey,
        evidenceType: 'gene_disease_validity',
        evidenceCode: row.CLASSIFICATION || '',
        provenanceUrl: row['ONLINE REPORT'] || source.homepageUrl,
        payload: row
      }
    });

    sourceRecords.push({
      recordType: 'gene_disease_validity',
      sourceRecordKey,
      canonicalCurie: geneCurie,
      payload: row
    });

    geneDiseaseValidityAssertions.push({
      geneRef: {
        curie: geneCurie,
        entityType: 'gene',
        label: geneLabel
      },
      diseaseRef: {
        curie: diseaseCurie,
        entityType: 'disease',
        label: diseaseLabel,
        isPlaceholder: true
      },
      sourceRecordKey,
      classification: row.CLASSIFICATION || '',
      modeOfInheritance: row.MOI || '',
      curationSop: row.SOP || '',
      classificationDate: parseClinGenDate(row['CLASSIFICATION DATE']),
      gcep: row.GCEP || '',
      onlineReportUrl: row['ONLINE REPORT'] || '',
      provenanceUrl: row['ONLINE REPORT'] || source.homepageUrl,
      payload: row
    });
  }

  return {
    sourceVersion: '',
    entities,
    aliases: [],
    xrefs: [],
    relationships,
    sourceRecords,
    geneDiseaseValidityAssertions,
    summary: {
      geneDiseaseValidityAssertions: geneDiseaseValidityAssertions.length
    }
  };
}

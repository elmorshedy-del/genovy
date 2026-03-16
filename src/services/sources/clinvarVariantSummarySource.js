import readline from 'readline';
import { Readable } from 'stream';
import zlib from 'zlib';
import { HTTP_CONSTANTS } from '../../constants/http.js';
import { normalizeCurie, normalizeNcbiGeneCurie } from '../../lib/curies.js';

const CLINVAR_VARIANT_SUMMARY_DEFAULTS = Object.freeze({
  preferredAssembly: 'GRCh38',
  allowedOriginSimple: 'germline',
  maxRowsPerSync: 25000,
  preferredDiseasePrefixes: Object.freeze(['MONDO', 'ORPHA', 'OMIM', 'MEDGEN'])
});

export function parseClinVarDate(rawValue) {
  const timestamp = Date.parse(String(rawValue || '').trim());
  if (Number.isNaN(timestamp)) {
    return '';
  }
  return new Date(timestamp).toISOString().slice(0, 10);
}

function splitPipeValues(rawValue) {
  return String(rawValue || '')
    .split('|')
    .map((value) => value.trim());
}

function splitCommaValues(rawValue) {
  return String(rawValue || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function choosePreferredDiseaseCurie(values) {
  const normalizedValues = values
    .map((value) => normalizeCurie(value))
    .filter(Boolean);

  for (const prefix of CLINVAR_VARIANT_SUMMARY_DEFAULTS.preferredDiseasePrefixes) {
    const match = normalizedValues.find((value) => value.startsWith(`${prefix}:`));
    if (match) {
      return match;
    }
  }

  return normalizedValues[0] || '';
}

function buildGeneRef(row) {
  const hgncCurie = normalizeCurie(row.HGNC_ID || '');
  if (hgncCurie) {
    return {
      curie: hgncCurie,
      entityType: 'gene',
      label: row.GeneSymbol || hgncCurie
    };
  }

  const ncbiGeneCurie = normalizeNcbiGeneCurie(row.GeneID || '');
  if (!ncbiGeneCurie) {
    return null;
  }

  return {
    curie: ncbiGeneCurie,
    entityType: 'gene',
    label: row.GeneSymbol || ncbiGeneCurie
  };
}

export function buildGeneEntityXrefs(row, geneCurie) {
  const xrefs = [];
  const normalizedGeneCurie = normalizeCurie(geneCurie);
  if (!normalizedGeneCurie) {
    return xrefs;
  }

  const hgncCurie = normalizeCurie(row.HGNC_ID || '');
  const ncbiGeneCurie = normalizeNcbiGeneCurie(row.GeneID || '');

  if (hgncCurie && hgncCurie !== normalizedGeneCurie) {
    xrefs.push({
      canonicalCurie: normalizedGeneCurie,
      xrefCurie: hgncCurie,
      xrefType: 'cross_reference'
    });
  }

  if (ncbiGeneCurie && ncbiGeneCurie !== normalizedGeneCurie) {
    xrefs.push({
      canonicalCurie: normalizedGeneCurie,
      xrefCurie: ncbiGeneCurie,
      xrefType: 'cross_reference'
    });
  }

  return xrefs;
}

export function buildDiseaseRefs(row) {
  const phenotypeIdBuckets = splitPipeValues(row.PhenotypeIDS);
  const phenotypeLabelBuckets = splitPipeValues(row.PhenotypeList);
  const results = [];

  for (let index = 0; index < phenotypeIdBuckets.length; index += 1) {
    const preferredCurie = choosePreferredDiseaseCurie(splitCommaValues(phenotypeIdBuckets[index]));
    if (!preferredCurie) {
      continue;
    }

    const diseaseLabel = phenotypeLabelBuckets[index] || preferredCurie;
    if (diseaseLabel.toLowerCase() === 'not provided') {
      continue;
    }

    results.push({
      curie: preferredCurie,
      entityType: 'disease',
      label: diseaseLabel,
      isPlaceholder: true
    });
  }

  return results;
}

function buildVariantXrefs(variantCurie, row) {
  const xrefs = [];
  const dbSnpId = String(row['RS# (dbSNP)'] || '').trim();
  if (dbSnpId && /^\d+$/.test(dbSnpId)) {
    xrefs.push({
      canonicalCurie: variantCurie,
      xrefCurie: `dbSNP:${dbSnpId}`,
      xrefType: 'cross_reference'
    });
  }

  for (const token of splitCommaValues(row.OtherIDs)) {
    if (!token.includes(':')) {
      continue;
    }
    xrefs.push({
      canonicalCurie: variantCurie,
      xrefCurie: normalizeCurie(token),
      xrefType: 'cross_reference'
    });
  }

  return xrefs;
}

function mapRowToRecord(headers, line) {
  const cells = line.split('\t');
  const row = {};
  headers.forEach((header, index) => {
    row[header] = (cells[index] || '').trim();
  });
  return row;
}

async function streamClinVarVariantSummary(source, onRow) {
  const response = await fetch(source.accessUrl, {
    headers: { 'user-agent': HTTP_CONSTANTS.userAgent }
  });
  if (!response.ok || !response.body) {
    throw new Error(`ClinVar variant summary fetch failed: ${response.status}`);
  }

  const gunzip = zlib.createGunzip();
  const inputStream = Readable.fromWeb(response.body).pipe(gunzip);
  const lineReader = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity
  });

  let headers = null;
  for await (const line of lineReader) {
    if (!headers) {
      headers = line.split('\t').map((header) => header.replace(/^#/, '').trim());
      continue;
    }

    if (!line.trim()) {
      continue;
    }

    const shouldStop = await onRow(mapRowToRecord(headers, line));
    if (shouldStop === true) {
      lineReader.close();
      break;
    }
  }

  return response.headers.get('last-modified') || '';
}

export async function fetchClinVarVariantSummaryDataset(source, options = {}) {
  const effectiveOptions = {
    preferredAssembly: options.preferredAssembly || CLINVAR_VARIANT_SUMMARY_DEFAULTS.preferredAssembly,
    allowedOriginSimple: options.allowedOriginSimple || CLINVAR_VARIANT_SUMMARY_DEFAULTS.allowedOriginSimple,
    maxRowsPerSync: Math.max(1, Number(options.maxRowsPerSync) || CLINVAR_VARIANT_SUMMARY_DEFAULTS.maxRowsPerSync)
  };

  const entities = [];
  const xrefs = [];
  const relationships = [];
  const sourceRecords = [];
  const clinicalVariantDiseaseAssertions = [];
  const seenVariantCuries = new Set();
  const seenGeneCuries = new Set();
  const seenVariantXrefs = new Set();
  let keptRows = 0;

  const sourceVersion = await streamClinVarVariantSummary(source, async (row) => {
    if (row.Assembly !== effectiveOptions.preferredAssembly) {
      return false;
    }
    if (String(row.OriginSimple || '').trim().toLowerCase() !== effectiveOptions.allowedOriginSimple.toLowerCase()) {
      return false;
    }

    const variationId = String(row.VariationID || '').trim();
    if (!variationId) {
      return false;
    }

    const diseaseRefs = buildDiseaseRefs(row);
    if (!diseaseRefs.length) {
      return false;
    }

    const variantCurie = `CLINVAR:${variationId}`;
    const variantLabel = row.Name || variantCurie;
    const geneRef = buildGeneRef(row);

    if (!seenVariantCuries.has(variantCurie)) {
      seenVariantCuries.add(variantCurie);
      entities.push({
        entityType: 'variant',
        canonicalCurie: variantCurie,
        canonicalLabel: variantLabel,
        description: '',
        primarySourceKey: source.sourceKey,
        metadata: {
          alleleId: row.AlleleID || '',
          variationType: row.Type || ''
        }
      });
    }

    if (geneRef && !seenGeneCuries.has(geneRef.curie)) {
      seenGeneCuries.add(geneRef.curie);
      entities.push({
        entityType: 'gene',
        canonicalCurie: geneRef.curie,
        canonicalLabel: geneRef.label,
        description: '',
        primarySourceKey: source.sourceKey,
        metadata: {}
      });
    }

    for (const xref of buildGeneEntityXrefs(row, geneRef?.curie || '')) {
      xrefs.push(xref);
    }

    for (const xref of buildVariantXrefs(variantCurie, row)) {
      const dedupeKey = `${xref.canonicalCurie}|${xref.xrefCurie}`;
      if (seenVariantXrefs.has(dedupeKey)) {
        continue;
      }
      seenVariantXrefs.add(dedupeKey);
      xrefs.push(xref);
    }

    for (const diseaseRef of diseaseRefs) {
      const sourceRecordKey = `clinvar-variant:${variationId}:${diseaseRef.curie}:${row.Assembly}`;

      relationships.push({
        predicateKey: 'associated_with_disease',
        subjectRef: {
          curie: variantCurie,
          entityType: 'variant',
          label: variantLabel
        },
        objectRef: diseaseRef,
        qualifiers: {
          clinicalSignificance: row.ClinicalSignificance || '',
          reviewStatus: row.ReviewStatus || '',
          assembly: row.Assembly || '',
          originSimple: row.OriginSimple || '',
          lastEvaluated: parseClinVarDate(row.LastEvaluated),
          sourceRecordKey
        },
        evidence: {
          sourceRecordKey,
          evidenceType: 'variant_disease_assertion',
          evidenceCode: row.ClinicalSignificance || '',
          provenanceUrl: source.homepageUrl,
          payload: row
        }
      });

      if (geneRef) {
        relationships.push({
          predicateKey: 'located_in_gene',
          subjectRef: {
            curie: variantCurie,
            entityType: 'variant',
            label: variantLabel
          },
          objectRef: geneRef,
          qualifiers: {
            assembly: row.Assembly || '',
            sourceRecordKey
          },
          evidence: {
            sourceRecordKey,
            evidenceType: 'variant_gene_assertion',
            provenanceUrl: source.homepageUrl,
            payload: {
              variationId,
              geneCurie: geneRef.curie
            }
          }
        });
      }

      sourceRecords.push({
        recordType: 'variant_disease',
        sourceRecordKey,
        canonicalCurie: variantCurie,
        payload: row
      });

      clinicalVariantDiseaseAssertions.push({
        variantRef: {
          curie: variantCurie,
          entityType: 'variant',
          label: variantLabel
        },
        diseaseRef,
        geneRef,
        sourceRecordKey,
        alleleId: row.AlleleID || '',
        variationId,
        variantName: variantLabel,
        variationType: row.Type || '',
        clinicalSignificance: row.ClinicalSignificance || '',
        clinicalSignificanceSimple: row.ClinSigSimple || '',
        reviewStatus: row.ReviewStatus || '',
        numberSubmitters: row.NumberSubmitters || '',
        origin: row.Origin || '',
        originSimple: row.OriginSimple || '',
        assembly: row.Assembly || '',
        lastEvaluated: parseClinVarDate(row.LastEvaluated),
        rcvAccession: splitPipeValues(row.RCVaccession)[0] || '',
        phenotypeIds: row.PhenotypeIDS || '',
        phenotypeList: row.PhenotypeList || '',
        provenanceUrl: source.homepageUrl,
        payload: row
      });
    }

    keptRows += 1;
    return keptRows >= effectiveOptions.maxRowsPerSync;
  });

  return {
    sourceVersion,
    entities,
    aliases: [],
    xrefs,
    relationships,
    sourceRecords,
    clinicalVariantDiseaseAssertions,
    summary: {
      variantRowsProcessed: keptRows,
      variantDiseaseAssertions: clinicalVariantDiseaseAssertions.length
    }
  };
}

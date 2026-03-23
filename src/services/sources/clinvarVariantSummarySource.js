import { createReadStream, createWriteStream, promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'readline';
import { Readable, Writable } from 'stream';
import { pipeline } from 'stream/promises';
import zlib from 'zlib';
import { HTTP_CONSTANTS } from '../../constants/http.js';
import { normalizeCurie, normalizeNcbiGeneCurie } from '../../lib/curies.js';

const CLINVAR_VARIANT_SUMMARY_DEFAULTS = Object.freeze({
  preferredAssembly: 'GRCh38',
  allowedOriginSimple: 'germline',
  maxRowsPerSync: 0,
  batchSize: 5000,
  downloadRetries: 3,
  preferredDiseasePrefixes: Object.freeze(['MONDO', 'ORPHA', 'OMIM', 'MEDGEN'])
});

const CLINVAR_VARIANT_SUMMARY_STAGE_PREFIX = 'genovy-clinvar-';

const CLINVAR_DERIVED_GENE_DISEASE_QUALIFIERS = Object.freeze({
  derivation: 'clinvar_variant_summary'
});

const CLINVAR_DERIVED_GENE_DISEASE_EXCLUDED_SIGNIFICANCE_TOKENS = Object.freeze([
  'benign',
  'uncertain',
  'conflicting',
  'risk factor',
  'drug response',
  'association',
  'protective',
  'affects',
  'other',
  'not provided'
]);

export function parseClinVarDate(rawValue) {
  const timestamp = Date.parse(String(rawValue || '').trim());
  if (Number.isNaN(timestamp)) {
    return '';
  }
  return new Date(timestamp).toISOString().slice(0, 10);
}

function parseOptionalNonNegativeInteger(rawValue, fallbackValue) {
  if (rawValue === '' || rawValue == null) {
    return fallbackValue;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallbackValue;
  }

  return Math.floor(parsed);
}

function parsePositiveInteger(rawValue, fallbackValue) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }

  return Math.floor(parsed);
}

export function resolveClinVarVariantSummaryOptions(options = {}) {
  return {
    preferredAssembly: options.preferredAssembly || CLINVAR_VARIANT_SUMMARY_DEFAULTS.preferredAssembly,
    allowedOriginSimple: options.allowedOriginSimple || CLINVAR_VARIANT_SUMMARY_DEFAULTS.allowedOriginSimple,
    localPath: String(options.localPath || '').trim(),
    maxRowsPerSync: parseOptionalNonNegativeInteger(
      options.maxRowsPerSync,
      CLINVAR_VARIANT_SUMMARY_DEFAULTS.maxRowsPerSync
    ),
    batchSize: parsePositiveInteger(options.batchSize, CLINVAR_VARIANT_SUMMARY_DEFAULTS.batchSize),
    downloadRetries: parsePositiveInteger(options.downloadRetries, CLINVAR_VARIANT_SUMMARY_DEFAULTS.downloadRetries)
  };
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

export function supportsDerivedClinVarGeneDiseaseBridge(row) {
  const normalizedClinicalSignificance = String(row?.ClinicalSignificance || '')
    .trim()
    .toLowerCase();
  if (!normalizedClinicalSignificance) {
    return false;
  }

  if (!normalizedClinicalSignificance.includes('pathogenic')) {
    return false;
  }

  return !CLINVAR_DERIVED_GENE_DISEASE_EXCLUDED_SIGNIFICANCE_TOKENS.some((token) =>
    normalizedClinicalSignificance.includes(token)
  );
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

export function buildDerivedGeneDiseaseRelationship({
  source,
  sourceRecordKey,
  geneRef,
  diseaseRef,
  variantCurie,
  variantLabel,
  row
}) {
  if (!geneRef || !diseaseRef) {
    return null;
  }

  return {
    predicateKey: 'associated_with_disease',
    subjectRef: geneRef,
    objectRef: diseaseRef,
    qualifiers: CLINVAR_DERIVED_GENE_DISEASE_QUALIFIERS,
    evidence: {
      sourceRecordKey,
      evidenceType: 'clinvar_variant_derived',
      evidenceCode: row.ClinicalSignificance || '',
      provenanceUrl: source.homepageUrl,
      payload: {
        variationId: String(row.VariationID || '').trim(),
        alleleId: row.AlleleID || '',
        variantCurie,
        variantName: variantLabel,
        variationType: row.Type || '',
        clinicalSignificance: row.ClinicalSignificance || '',
        clinicalSignificanceSimple: row.ClinSigSimple || '',
        reviewStatus: row.ReviewStatus || '',
        numberSubmitters: row.NumberSubmitters || '',
        lastEvaluated: parseClinVarDate(row.LastEvaluated),
        phenotypeIds: row.PhenotypeIDS || '',
        phenotypeList: row.PhenotypeList || '',
        assembly: row.Assembly || '',
        originSimple: row.OriginSimple || ''
      }
    }
  };
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

async function streamClinVarVariantSummary(source, onRow, options = {}) {
  const effectiveOptions = resolveClinVarVariantSummaryOptions(options);
  let sourceVersion = '';
  let sourceStream = null;
  let inputStream = null;
  let cleanup = async () => {};

  if (effectiveOptions.localPath) {
    const fileStats = await fs.stat(effectiveOptions.localPath);
    sourceVersion = fileStats.mtime.toUTCString();
    sourceStream = createReadStream(effectiveOptions.localPath);
    inputStream = sourceStream.pipe(zlib.createGunzip());
  } else {
    const stagedFile = await stageClinVarVariantSummaryFile(source, effectiveOptions);
    sourceVersion = stagedFile.sourceVersion;
    cleanup = stagedFile.cleanup;
    sourceStream = createReadStream(stagedFile.localPath);
    inputStream = sourceStream.pipe(zlib.createGunzip());
  }
  const lineReader = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity
  });
  let streamError = null;
  const errorHandler = (error) => {
    if (!streamError) {
      streamError = error;
    }
  };
  sourceStream.on('error', errorHandler);
  inputStream.on('error', errorHandler);
  lineReader.on('error', errorHandler);

  let headers = null;
  try {
    for await (const line of lineReader) {
      if (streamError) {
        throw streamError;
      }
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
  } finally {
    lineReader.close();
    await cleanup();
  }

  if (streamError) {
    throw streamError;
  }

  return sourceVersion;
}

async function removePathQuietly(targetPath) {
  if (!targetPath) {
    return;
  }
  try {
    await fs.rm(targetPath, { recursive: true, force: true });
  } catch {
    // Best-effort temp cleanup only.
  }
}

async function verifyClinVarVariantSummaryArchive(localPath) {
  await pipeline(
    createReadStream(localPath),
    zlib.createGunzip(),
    new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      }
    })
  );
}

async function downloadClinVarVariantSummaryArchive(source, destinationPath) {
  const response = await fetch(source.accessUrl, {
    headers: { 'user-agent': HTTP_CONSTANTS.userAgent }
  });
  if (!response.ok || !response.body) {
    throw new Error(`ClinVar variant summary fetch failed: ${response.status}`);
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(destinationPath));
  return response.headers.get('last-modified') || '';
}

async function stageClinVarVariantSummaryFile(source, effectiveOptions) {
  const stageDir = await fs.mkdtemp(path.join(os.tmpdir(), CLINVAR_VARIANT_SUMMARY_STAGE_PREFIX));
  const localPath = path.join(stageDir, 'variant_summary.txt.gz');
  let sourceVersion = '';
  let lastError = null;

  for (let attempt = 1; attempt <= effectiveOptions.downloadRetries; attempt += 1) {
    try {
      sourceVersion = await downloadClinVarVariantSummaryArchive(source, localPath);
      await verifyClinVarVariantSummaryArchive(localPath);
      return {
        localPath,
        sourceVersion,
        cleanup: async () => removePathQuietly(stageDir)
      };
    } catch (error) {
      lastError = error;
      await removePathQuietly(localPath);
    }
  }

  await removePathQuietly(stageDir);
  throw lastError || new Error('ClinVar variant summary staging failed.');
}

function createClinVarVariantSummaryBatch(source) {
  const entities = [];
  const xrefs = [];
  const relationships = [];
  const sourceRecords = [];
  const clinicalVariantDiseaseAssertions = [];
  const seenVariantCuries = new Set();
  const seenGeneCuries = new Set();
  const seenVariantXrefs = new Set();
  let acceptedRowCount = 0;

  return {
    addAcceptedRow(row) {
      const variationId = String(row.VariationID || '').trim();
      const diseaseRefs = buildDiseaseRefs(row);
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

          if (supportsDerivedClinVarGeneDiseaseBridge(row)) {
            const derivedGeneDiseaseRelationship = buildDerivedGeneDiseaseRelationship({
              source,
              sourceRecordKey,
              geneRef,
              diseaseRef,
              variantCurie,
              variantLabel,
              row
            });
            if (derivedGeneDiseaseRelationship) {
              relationships.push(derivedGeneDiseaseRelationship);
            }
          }
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

      acceptedRowCount += 1;
      return diseaseRefs.length;
    },
    flushDataset(summary = {}) {
      const dataset = {
        entities: [...entities],
        aliases: [],
        xrefs: [...xrefs],
        relationships: [...relationships],
        sourceRecords: [...sourceRecords],
        clinicalVariantDiseaseAssertions: [...clinicalVariantDiseaseAssertions],
        summary
      };

      entities.length = 0;
      xrefs.length = 0;
      relationships.length = 0;
      sourceRecords.length = 0;
      clinicalVariantDiseaseAssertions.length = 0;
      seenVariantCuries.clear();
      seenGeneCuries.clear();
      seenVariantXrefs.clear();
      acceptedRowCount = 0;

      return dataset;
    },
    get acceptedRowCount() {
      return acceptedRowCount;
    }
  };
}

function shouldKeepClinVarVariantSummaryRow(row, effectiveOptions) {
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

  return buildDiseaseRefs(row).length > 0;
}

export async function streamClinVarVariantSummaryBatches(source, options = {}, onBatch) {
  const effectiveOptions = resolveClinVarVariantSummaryOptions(options);
  let keptRows = 0;
  let variantDiseaseAssertions = 0;
  let batchBuilder = createClinVarVariantSummaryBatch(source);
  let sourceVersion = '';

  async function flushCurrentBatch() {
    if (!batchBuilder.acceptedRowCount) {
      return;
    }
    await onBatch(batchBuilder.flushDataset({
      variantRowsProcessed: batchBuilder.acceptedRowCount
    }), {
      sourceVersion,
      variantRowsProcessed: keptRows,
      variantDiseaseAssertions
    });
    batchBuilder = createClinVarVariantSummaryBatch(source);
  }

  sourceVersion = await streamClinVarVariantSummary(source, async (row) => {
    if (!shouldKeepClinVarVariantSummaryRow(row, effectiveOptions)) {
      return false;
    }

    variantDiseaseAssertions += batchBuilder.addAcceptedRow(row);
    keptRows += 1;

    if (batchBuilder.acceptedRowCount >= effectiveOptions.batchSize) {
      await flushCurrentBatch();
    }

    return effectiveOptions.maxRowsPerSync > 0 && keptRows >= effectiveOptions.maxRowsPerSync;
  }, effectiveOptions);

  await flushCurrentBatch();

  return {
    sourceVersion,
    summary: {
      variantRowsProcessed: keptRows,
      variantDiseaseAssertions
    }
  };
}

export async function fetchClinVarVariantSummaryDataset(source, options = {}) {
  const effectiveOptions = resolveClinVarVariantSummaryOptions(options);
  const batchBuilder = createClinVarVariantSummaryBatch(source);
  let keptRows = 0;
  let variantDiseaseAssertions = 0;

  const sourceVersion = await streamClinVarVariantSummary(source, async (row) => {
    if (!shouldKeepClinVarVariantSummaryRow(row, effectiveOptions)) {
      return false;
    }

    variantDiseaseAssertions += batchBuilder.addAcceptedRow(row);
    keptRows += 1;
    return effectiveOptions.maxRowsPerSync > 0 && keptRows >= effectiveOptions.maxRowsPerSync;
  }, effectiveOptions);

  const dataset = batchBuilder.flushDataset();

  return {
    sourceVersion,
    ...dataset,
    aliases: [],
    summary: {
      variantRowsProcessed: keptRows,
      variantDiseaseAssertions
    }
  };
}

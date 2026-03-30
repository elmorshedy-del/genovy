import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Readable } from 'node:stream';
import { XMLParser } from 'fast-xml-parser';
import { withClient } from '../db/pool.js';
import { SOURCE_CATALOG, SOURCE_KEYS } from '../constants/sourceCatalog.js';
import { normalizeCurie } from '../lib/curies.js';

const execFileAsync = promisify(execFile);

const DEFAULTS = Object.freeze({
  outputJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-manifest-structured-global-20260329.json',
  cacheDir: path.join(os.tmpdir(), 'genovy-source-enrichment-cache'),
  generatedAt: '2026-03-29'
});

const HPO_FREQUENCY_CURIES = Object.freeze({
  obligate: 'HP:0040280',
  veryFrequent: 'HP:0040281',
  frequent: 'HP:0040282',
  occasional: 'HP:0040283',
  veryRare: 'HP:0040284',
  excluded: 'HP:0040285'
});

const HPO_FREQUENCY_LABELS = Object.freeze({
  [HPO_FREQUENCY_CURIES.obligate]: 'Obligate',
  [HPO_FREQUENCY_CURIES.veryFrequent]: 'Very frequent',
  [HPO_FREQUENCY_CURIES.frequent]: 'Frequent',
  [HPO_FREQUENCY_CURIES.occasional]: 'Occasional',
  [HPO_FREQUENCY_CURIES.veryRare]: 'Very rare',
  [HPO_FREQUENCY_CURIES.excluded]: 'Excluded'
});

const HOOM_FREQUENCY_CODE_MAP = Object.freeze({
  OB: HPO_FREQUENCY_CURIES.obligate,
  VF: HPO_FREQUENCY_CURIES.veryFrequent,
  F: HPO_FREQUENCY_CURIES.frequent,
  OC: HPO_FREQUENCY_CURIES.occasional,
  VR: HPO_FREQUENCY_CURIES.veryRare,
  EX: HPO_FREQUENCY_CURIES.excluded
});

const ASSERTION_STATUS = Object.freeze({
  PRESENT: 'present',
  ABSENT: 'absent'
});

function parseArgs(argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      flags[key] = true;
    } else {
      flags[key] = next;
      index += 1;
    }
  }
  return flags;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function slugify(value) {
  return String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fetchCachedText(url, fileName, cacheDir) {
  await ensureDir(cacheDir);
  const filePath = path.join(cacheDir, fileName);
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {}

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const text = await response.text();
  await fs.writeFile(filePath, text);
  return text;
}

async function fetchCachedBuffer(url, fileName, cacheDir) {
  await ensureDir(cacheDir);
  const filePath = path.join(cacheDir, fileName);
  try {
    return await fs.readFile(filePath);
  } catch {}

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(filePath, buffer);
  return buffer;
}

async function unzipSingleFile(zipPath, memberName) {
  const { stdout } = await execFileAsync('unzip', ['-p', zipPath, memberName], {
    maxBuffer: 1024 * 1024 * 512
  });
  return stdout;
}

function mapTextFrequencyCurie(rawValue) {
  const value = String(rawValue || '').trim().toLowerCase();
  if (!value) return '';
  if (value.includes('obligate') || value.includes('100%')) return HPO_FREQUENCY_CURIES.obligate;
  if (value.includes('very frequent') || value.includes('80-99%') || value.includes('99-80%')) {
    return HPO_FREQUENCY_CURIES.veryFrequent;
  }
  if (value.includes('frequent') || value.includes('30-79%') || value.includes('79-30%')) {
    return HPO_FREQUENCY_CURIES.frequent;
  }
  if (value.includes('occasional') || value.includes('5-29%') || value.includes('29-5%')) {
    return HPO_FREQUENCY_CURIES.occasional;
  }
  if (value.includes('very rare') || value.includes('1-4%') || value.includes('<4-1%')) {
    return HPO_FREQUENCY_CURIES.veryRare;
  }
  if (value.includes('excluded') || value === '0%') return HPO_FREQUENCY_CURIES.excluded;
  return '';
}

function mapRatioFrequencyCurie(rawValue) {
  const value = String(rawValue || '').trim();
  const match = value.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match) return '';
  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  if (!denominator) return '';
  const pct = (numerator / denominator) * 100;
  if (pct === 100) return HPO_FREQUENCY_CURIES.obligate;
  if (pct >= 80) return HPO_FREQUENCY_CURIES.veryFrequent;
  if (pct >= 30) return HPO_FREQUENCY_CURIES.frequent;
  if (pct >= 5) return HPO_FREQUENCY_CURIES.occasional;
  if (pct >= 1) return HPO_FREQUENCY_CURIES.veryRare;
  return HPO_FREQUENCY_CURIES.excluded;
}

function buildFrequencyInfo(rawValue, fallbackCurie = '') {
  const curie =
    normalizeCurie(fallbackCurie || '') || mapTextFrequencyCurie(rawValue) || mapRatioFrequencyCurie(rawValue);
  return {
    curie,
    label: curie ? HPO_FREQUENCY_LABELS[curie] || String(rawValue || '').trim() || curie : String(rawValue || '').trim()
  };
}

function parseHpoPositiveAnnotations(text) {
  const byDiseaseId = new Map();
  let rawRows = 0;

  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const cols = line.split('\t');
    const diseaseId = normalizeCurie(cols[0] || '');
    const diseaseLabel = String(cols[1] || '').trim();
    const qualifier = String(cols[2] || '').trim();
    const phenotypeCurie = normalizeCurie(cols[3] || '');
    const reference = String(cols[4] || '').trim();
    const evidenceCode = String(cols[5] || '').trim();
    const frequencyRaw = String(cols[6] || '').trim();
    if (!diseaseId || !phenotypeCurie || qualifier === 'NOT') continue;

    rawRows += 1;
    const current = byDiseaseId.get(diseaseId) || [];
    current.push({
      sourceKey: SOURCE_KEYS.HPO_DISEASE_PHENOTYPE,
      assertionPresenceStatus: ASSERTION_STATUS.PRESENT,
      diseaseId,
      diseaseLabel,
      phenotypeCurie,
      sourceReference: reference || diseaseId,
      evidenceCode,
      frequency: buildFrequencyInfo(frequencyRaw),
      referenceText: reference,
      payload: {
        disease_id: diseaseId,
        disease_name: diseaseLabel,
        hpo_id: phenotypeCurie,
        reference,
        evidence: evidenceCode,
        frequency: frequencyRaw
      }
    });
    byDiseaseId.set(diseaseId, current);
  }

  return { byDiseaseId, rawRows };
}

function parseOrphadataPhenotypes(xmlText) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    parseTagValue: true,
    trimValues: true
  });
  const parsed = parser.parse(xmlText);
  const statuses = asArray(parsed?.JDBOR?.HPODisorderSetStatusList?.HPODisorderSetStatus);
  const byOrpha = new Map();
  let rawRows = 0;

  for (const status of statuses) {
    const disorder = status?.Disorder;
    const orphaCode = String(disorder?.OrphaCode || '').trim();
    if (!orphaCode) continue;
    const diseaseId = `ORPHANET:${orphaCode}`;
    const diseaseLabel = String(disorder?.Name?.['#text'] || disorder?.Name || '').trim();
    const sourceText = String(status?.Source || '').trim();
    const associations = asArray(disorder?.HPODisorderAssociationList?.HPODisorderAssociation);
    const rows = byOrpha.get(diseaseId) || [];

    for (const association of associations) {
      const phenotypeCurie = normalizeCurie(
        association?.HPO?.HPOId?.['#text'] || association?.HPO?.HPOId || ''
      );
      if (!phenotypeCurie) continue;
      rawRows += 1;
      const frequencyText = String(
        association?.HPOFrequency?.Name?.['#text'] || association?.HPOFrequency?.Name || ''
      ).trim();
      rows.push({
        sourceKey: SOURCE_KEYS.ORPHADATA_PHENOTYPES,
        assertionPresenceStatus: ASSERTION_STATUS.PRESENT,
        diseaseId,
        diseaseLabel,
        phenotypeCurie,
        sourceReference: diseaseId,
        evidenceCode: '',
        frequency: buildFrequencyInfo(frequencyText),
        referenceText: sourceText,
        payload: {
          disease_id: diseaseId,
          disease_name: diseaseLabel,
          phenotype_id: phenotypeCurie,
          frequency: frequencyText,
          source: sourceText
        }
      });
    }

    byOrpha.set(diseaseId, rows);
  }

  return { byDiseaseId: byOrpha, rawRows };
}

function parseHoom(text) {
  const byOrpha = new Map();
  let rawRows = 0;
  const regex = /#Orpha:(\d+)_HP:(\d{7})_Freq:([A-Z]+)/g;
  for (const match of text.matchAll(regex)) {
    const [, orphaCode, hpoDigits, frequencyCode] = match;
    const diseaseId = `ORPHANET:${orphaCode}`;
    const phenotypeCurie = `HP:${hpoDigits}`;
    const frequencyCurie = HOOM_FREQUENCY_CODE_MAP[frequencyCode] || '';
    rawRows += 1;
    const rows = byOrpha.get(diseaseId) || [];
    rows.push({
      sourceKey: SOURCE_KEYS.ORPHADATA_HOOM,
      assertionPresenceStatus: ASSERTION_STATUS.PRESENT,
      diseaseId,
      diseaseLabel: '',
      phenotypeCurie,
      sourceReference: diseaseId,
      evidenceCode: '',
      frequency: buildFrequencyInfo(HPO_FREQUENCY_LABELS[frequencyCurie] || frequencyCode, frequencyCurie),
      referenceText: `HOOM 2.4 frequency code ${frequencyCode}`,
      payload: {
        disease_id: diseaseId,
        phenotype_id: phenotypeCurie,
        frequency_code: frequencyCode
      }
    });
    byOrpha.set(diseaseId, rows);
  }

  return { byDiseaseId: byOrpha, rawRows };
}

async function loadDiseaseContext(client) {
  const diseaseRows = await client.query(
    `
      SELECT
        e.entity_id,
        e.canonical_curie,
        e.canonical_label,
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'xrefCurie', x.xref_curie,
              'sourceKey', x.source_key
            )
          ) FILTER (WHERE x.entity_xref_id IS NOT NULL),
          '[]'::jsonb
        ) AS xrefs,
        COALESCE(
          array_agg(DISTINCT phenotype.canonical_curie)
            FILTER (
              WHERE cpa.presence_status = 'present'
                AND phenotype.canonical_curie IS NOT NULL
                AND COALESCE(cpa.source_key, '') <> $1
                AND COALESCE(cpa.source_record_key, '') NOT LIKE 'phenotype-propagation:%'
            ),
          ARRAY[]::text[]
        ) AS direct_present_phenotype_curies
      FROM entities e
      LEFT JOIN entity_xrefs x
        ON x.entity_id = e.entity_id
      LEFT JOIN clinical_phenotype_assertions cpa
        ON cpa.subject_entity_id = e.entity_id
      LEFT JOIN entities phenotype
        ON phenotype.entity_id = cpa.phenotype_entity_id
      WHERE e.entity_type = 'disease'
        AND e.is_placeholder = FALSE
      GROUP BY e.entity_id, e.canonical_curie, e.canonical_label
    `,
    [SOURCE_KEYS.PHENOTYPE_PROPAGATION]
  );

  const phenotypeRows = await client.query(
    `
      SELECT canonical_curie
      FROM entities
      WHERE entity_type = 'phenotype'
    `
  );

  const diseases = diseaseRows.rows.map((row) => ({
    entityId: row.entity_id,
    diseaseCurie: row.canonical_curie,
    diseaseLabel: row.canonical_label,
    xrefs: row.xrefs || [],
    directPresentPhenotypes: new Set(row.direct_present_phenotype_curies || [])
  }));

  return {
    diseases,
    phenotypeSet: new Set(phenotypeRows.rows.map((row) => row.canonical_curie))
  };
}

function buildDiseaseLookup(diseases) {
  const byExternalCurie = new Map();

  for (const disease of diseases) {
    const curies = new Set([disease.diseaseCurie]);
    for (const xref of disease.xrefs || []) {
      const normalized = normalizeCurie(xref?.xrefCurie || '');
      if (!normalized) continue;
      curies.add(normalized);
      if (normalized.startsWith('ORPHA:')) {
        curies.add(normalized.replace(/^ORPHA:/, 'ORPHANET:'));
      } else if (normalized.startsWith('ORPHANET:')) {
        curies.add(normalized.replace(/^ORPHANET:/, 'ORPHA:'));
      }
    }

    for (const curie of curies) {
      const current = byExternalCurie.get(curie) || [];
      current.push(disease);
      byExternalCurie.set(curie, current);
    }
  }

  return byExternalCurie;
}

function buildManifestSupport(entry) {
  return {
    sourceKey: entry.sourceKey,
    sourceReference: entry.sourceReference,
    provenanceUrl: entry.provenanceUrl,
    evidenceCode: entry.evidenceCode,
    evidenceTag: entry.evidenceTag,
    frequencyCurie: entry.frequencyCurie,
    frequencyLabel: entry.frequencyLabel,
    referenceText: entry.referenceText,
    payload: entry.payload?.source || entry.payload || {}
  };
}

function dedupeManifestEntries(entries) {
  const byKey = new Map();
  for (const entry of entries) {
    const key = [
      entry.diseaseCurie,
      entry.phenotypeCurie,
      entry.assertionPresenceStatus,
      entry.frequencyCurie || ''
    ].join('|');
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, {
        ...entry,
        sourceCount: 1,
        supportingSources: [buildManifestSupport(entry)]
      });
      continue;
    }

    const supports = current.supportingSources || [];
    const supportKey = `${entry.sourceKey}|${entry.sourceReference}|${entry.evidenceTag}|${entry.frequencyCurie || ''}`;
    const seenSupport = new Set(
      supports.map(
        (support) =>
          `${support.sourceKey}|${support.sourceReference}|${support.evidenceTag}|${support.frequencyCurie || ''}`
      )
    );
    if (!seenSupport.has(supportKey)) {
      supports.push(buildManifestSupport(entry));
    }
    current.supportingSources = supports.sort((left, right) =>
      [left.sourceKey, left.sourceReference, left.evidenceTag].join('|').localeCompare(
        [right.sourceKey, right.sourceReference, right.evidenceTag].join('|')
      )
    );
    current.sourceCount = current.supportingSources.length;
  }

  return [...byKey.values()].sort((left, right) =>
    [
      left.diseaseCurie,
      left.phenotypeCurie,
      left.assertionPresenceStatus,
      left.frequencyCurie || ''
    ]
      .join('|')
      .localeCompare(
        [
          right.diseaseCurie,
          right.phenotypeCurie,
          right.assertionPresenceStatus,
          right.frequencyCurie || ''
        ].join('|')
      )
  );
}

function createManifestEntry({
  generatedAt,
  disease,
  sourceRow,
  sourceDiseaseId,
  importedMode
}) {
  const sourceDiseaseRef = sourceRow.sourceReference || sourceDiseaseId || disease.diseaseCurie;
  const evidenceTag = `${sourceRow.sourceKey}_${slugify(sourceDiseaseRef)}_${slugify(sourceRow.assertionPresenceStatus)}`;
  const sourceRecordKey = [
    importedMode,
    slugify(disease.diseaseCurie),
    slugify(sourceRow.phenotypeCurie),
    slugify(sourceRow.assertionPresenceStatus),
    slugify(sourceRow.sourceKey),
    slugify(sourceDiseaseRef),
    slugify(sourceRow.frequency?.curie || sourceRow.frequency?.label || 'no_frequency')
  ].join(':');

  return {
    caseId: 'global_structured_import',
    side: 'global_import',
    dateAdded: generatedAt,
    geneLabel: '',
    diseaseCurie: disease.diseaseCurie,
    diseaseLabel: disease.diseaseLabel,
    phenotypeCurie: sourceRow.phenotypeCurie,
    phenotypeLabel: sourceRow.phenotypeCurie,
    assertionPresenceStatus: sourceRow.assertionPresenceStatus || ASSERTION_STATUS.PRESENT,
    packetPresenceStatus: '',
    sourceKey: sourceRow.sourceKey,
    sourceReference: sourceDiseaseRef,
    provenanceUrl: SOURCE_CATALOG[sourceRow.sourceKey]?.accessUrl || SOURCE_CATALOG[sourceRow.sourceKey]?.homepageUrl || '',
    evidenceCode: sourceRow.evidenceCode || '',
    sourceRecordKey,
    evidenceTag,
    frequencyCurie: sourceRow.frequency?.curie || '',
    frequencyLabel: sourceRow.frequency?.label || '',
    referenceText: sourceRow.referenceText || sourceDiseaseRef,
    payload: {
      source: sourceRow.payload || {},
      note: 'Whole-graph structured phenotype enrichment manifest generated from Orphadata/HOOM/HPO.'
    }
  };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const outputPath = flags.output || DEFAULTS.outputJson;
  const generatedAt = flags.date || DEFAULTS.generatedAt;

  const [hpoText, orphadataXml, hoomZipBuffer] = await Promise.all([
    fetchCachedText(SOURCE_CATALOG[SOURCE_KEYS.HPO_DISEASE_PHENOTYPE].accessUrl, 'phenotype.hpoa', DEFAULTS.cacheDir),
    fetchCachedText(SOURCE_CATALOG[SOURCE_KEYS.ORPHADATA_PHENOTYPES].accessUrl, 'en_product4.xml', DEFAULTS.cacheDir),
    fetchCachedBuffer(SOURCE_CATALOG[SOURCE_KEYS.ORPHADATA_HOOM].accessUrl, 'hoom_orphanet_2.4.zip', DEFAULTS.cacheDir)
  ]);

  const hoomZipPath = path.join(DEFAULTS.cacheDir, 'hoom_orphanet_2.4.zip');
  await fs.writeFile(hoomZipPath, hoomZipBuffer);

  const [{ byDiseaseId: hpoByDiseaseId, rawRows: hpoRawRows }, { byDiseaseId: orphaByDiseaseId, rawRows: orphaRawRows }, { byDiseaseId: hoomByDiseaseId, rawRows: hoomRawRows }] =
    await Promise.all([
      Promise.resolve(parseHpoPositiveAnnotations(hpoText)),
      Promise.resolve(parseOrphadataPhenotypes(orphadataXml)),
      unzipSingleFile(hoomZipPath, 'hoom_orphanet.owl').then(parseHoom)
    ]);

  const { diseases, phenotypeSet } = await withClient((client) => loadDiseaseContext(client));
  const diseaseLookup = buildDiseaseLookup(diseases);

  const manifestEntries = [];
  const summary = {
    diseaseCount: diseases.length,
    phenotypeCount: phenotypeSet.size,
    sourceRows: {
      [SOURCE_KEYS.HPO_DISEASE_PHENOTYPE]: hpoRawRows,
      [SOURCE_KEYS.ORPHADATA_PHENOTYPES]: orphaRawRows,
      [SOURCE_KEYS.ORPHADATA_HOOM]: hoomRawRows
    },
    matchedDiseaseIds: {
      [SOURCE_KEYS.HPO_DISEASE_PHENOTYPE]: 0,
      [SOURCE_KEYS.ORPHADATA_PHENOTYPES]: 0,
      [SOURCE_KEYS.ORPHADATA_HOOM]: 0
    },
    unmatchedDiseaseIds: {
      [SOURCE_KEYS.HPO_DISEASE_PHENOTYPE]: 0,
      [SOURCE_KEYS.ORPHADATA_PHENOTYPES]: 0,
      [SOURCE_KEYS.ORPHADATA_HOOM]: 0
    },
    missingPhenotypeRows: {
      [SOURCE_KEYS.HPO_DISEASE_PHENOTYPE]: 0,
      [SOURCE_KEYS.ORPHADATA_PHENOTYPES]: 0,
      [SOURCE_KEYS.ORPHADATA_HOOM]: 0
    },
    skippedExistingRows: {
      [SOURCE_KEYS.HPO_DISEASE_PHENOTYPE]: 0,
      [SOURCE_KEYS.ORPHADATA_PHENOTYPES]: 0,
      [SOURCE_KEYS.ORPHADATA_HOOM]: 0
    },
    mappedRows: {
      [SOURCE_KEYS.HPO_DISEASE_PHENOTYPE]: 0,
      [SOURCE_KEYS.ORPHADATA_PHENOTYPES]: 0,
      [SOURCE_KEYS.ORPHADATA_HOOM]: 0
    }
  };

  const sourceMaps = [
    { sourceKey: SOURCE_KEYS.HPO_DISEASE_PHENOTYPE, byDiseaseId: hpoByDiseaseId, importedMode: 'global_hpo_positive_diff' },
    { sourceKey: SOURCE_KEYS.ORPHADATA_PHENOTYPES, byDiseaseId: orphaByDiseaseId, importedMode: 'global_orphadata_phenotypes' },
    { sourceKey: SOURCE_KEYS.ORPHADATA_HOOM, byDiseaseId: hoomByDiseaseId, importedMode: 'global_orphadata_hoom' }
  ];

  for (const { sourceKey, byDiseaseId, importedMode } of sourceMaps) {
    for (const [sourceDiseaseId, rows] of byDiseaseId.entries()) {
      const matchedDiseases = diseaseLookup.get(sourceDiseaseId) || [];
      if (!matchedDiseases.length) {
        summary.unmatchedDiseaseIds[sourceKey] += 1;
        continue;
      }

      summary.matchedDiseaseIds[sourceKey] += 1;

      for (const sourceRow of rows) {
        if (!phenotypeSet.has(sourceRow.phenotypeCurie)) {
          summary.missingPhenotypeRows[sourceKey] += 1;
          continue;
        }

        for (const disease of matchedDiseases) {
          if (
            sourceKey === SOURCE_KEYS.HPO_DISEASE_PHENOTYPE &&
            disease.directPresentPhenotypes.has(sourceRow.phenotypeCurie)
          ) {
            summary.skippedExistingRows[sourceKey] += 1;
            continue;
          }

          summary.mappedRows[sourceKey] += 1;
          manifestEntries.push(
            createManifestEntry({
              generatedAt,
              disease,
              sourceRow,
              sourceDiseaseId,
              importedMode
            })
          );
        }
      }
    }
  }

  const dedupedEntries = dedupeManifestEntries(manifestEntries);
  const bySourceEntryCount = Object.fromEntries(
    Object.values(SOURCE_KEYS)
      .filter((sourceKey) =>
        [SOURCE_KEYS.HPO_DISEASE_PHENOTYPE, SOURCE_KEYS.ORPHADATA_PHENOTYPES, SOURCE_KEYS.ORPHADATA_HOOM].includes(
          sourceKey
        )
      )
      .map((sourceKey) => [
        sourceKey,
        dedupedEntries.filter(
          (entry) => entry.sourceKey === sourceKey || (entry.supportingSources || []).some((support) => support.sourceKey === sourceKey)
        ).length
      ])
  );

  const manifestMeta = {
    createdAt: generatedAt,
    outputPath,
    sourceNotes: {
      [SOURCE_KEYS.HPO_DISEASE_PHENOTYPE]: SOURCE_CATALOG[SOURCE_KEYS.HPO_DISEASE_PHENOTYPE].accessUrl,
      [SOURCE_KEYS.ORPHADATA_PHENOTYPES]: SOURCE_CATALOG[SOURCE_KEYS.ORPHADATA_PHENOTYPES].accessUrl,
      [SOURCE_KEYS.ORPHADATA_HOOM]: SOURCE_CATALOG[SOURCE_KEYS.ORPHADATA_HOOM].accessUrl,
      importPolicy: [
        'Orphadata Phenotypes and HOOM are imported graph-wide as structured direct disease-to-phenotype evidence.',
        'HPO positive annotations are imported only when the exact phenotype is not already present as a current direct disease assertion.',
        'HPO negatives remain a separate manifest so contradiction effects stay separately measurable.'
      ],
      hoomAccessNote:
        'The HOOM landing page advertised hoom_orphanet_2.5.zip on 2026-03-28, but the direct file returned 404. The latest live official archive was hoom_orphanet_2.4.zip.'
    },
    summary: {
      ...summary,
      dedupedEntryCount: dedupedEntries.length,
      bySourceEntryCount
    }
  };

  await ensureDir(path.dirname(outputPath));
  await writeManifestJson(outputPath, manifestMeta, dedupedEntries);
  console.log(JSON.stringify(manifestMeta.summary, null, 2));
}

main().catch((error) => {
  console.error('[generate-global-structured-phenotype-manifest] failed:', error);
  process.exit(1);
});

async function writeManifestJson(outputPath, manifestMeta, entries) {
  await new Promise((resolve, reject) => {
    const stream = fsSync.createWriteStream(outputPath, { encoding: 'utf8' });
    stream.on('error', reject);
    stream.on('finish', resolve);

    const topLevel = { ...manifestMeta, entries: [] };
    const prefix = JSON.stringify(topLevel, null, 2);
    const entryArrayMarker = '"entries": []';
    const markerIndex = prefix.indexOf(entryArrayMarker);
    if (markerIndex === -1) {
      stream.destroy(new Error('Failed to locate entries marker while streaming manifest JSON'));
      return;
    }

    const before = prefix.slice(0, markerIndex);
    const after = prefix.slice(markerIndex + entryArrayMarker.length);
    stream.write(before);
    stream.write('"entries": [\n');

    for (let index = 0; index < entries.length; index += 1) {
      const entryText = JSON.stringify(entries[index], null, 2)
        .split('\n')
        .map((line) => `    ${line}`)
        .join('\n');
      stream.write(entryText);
      if (index < entries.length - 1) {
        stream.write(',\n');
      } else {
        stream.write('\n');
      }
    }

    stream.write(`  ]${after}\n`);
    stream.end();
  });
}

import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import readline from 'node:readline';
import { Readable } from 'node:stream';
import { XMLParser } from 'fast-xml-parser';
import { withClient } from '../db/pool.js';
import { loadDxDiseasePhenotypeRows } from '../repositories/dxRepository.js';
import { SOURCE_CATALOG, SOURCE_KEYS } from '../constants/sourceCatalog.js';
import { normalizeCurie } from '../lib/curies.js';

const execFileAsync = promisify(execFile);

const DEFAULTS = Object.freeze({
  rosterJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/data/source-enrichment/benchmark-packet-roster-20260328.json',
  outputJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-manifest-20260328.json',
  cacheDir: path.join(os.tmpdir(), 'genovy-source-enrichment-cache'),
  generatedAt: '2026-03-28'
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

const PRIMEKG_RELATION_TO_ASSERTION = Object.freeze({
  disease_phenotype_positive: ASSERTION_STATUS.PRESENT,
  disease_phenotype_negative: ASSERTION_STATUS.ABSENT
});

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      flags[key] = true;
    } else {
      flags[key] = next;
      i += 1;
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

function normalizeLabel(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

async function fetchCachedFile(url, fileName, cacheDir) {
  await ensureDir(cacheDir);
  const filePath = path.join(cacheDir, fileName);
  try {
    await fs.access(filePath);
    return filePath;
  } catch {}

  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  await new Promise((resolve, reject) => {
    const output = fsSync.createWriteStream(filePath);
    output.on('error', reject);
    output.on('finish', resolve);
    Readable.fromWeb(response.body).on('error', reject).pipe(output);
  });

  return filePath;
}

async function unzipSingleFile(zipPath, memberName) {
  const { stdout } = await execFileAsync('unzip', ['-p', zipPath, memberName], { maxBuffer: 1024 * 1024 * 512 });
  return stdout;
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function loadPhenopacketTerms(payload) {
  const phenopacket = payload?.phenopacket || payload;
  const present = [];
  const excluded = [];
  for (const feature of phenopacket?.phenotypicFeatures || []) {
    const curie = normalizeCurie(
      feature?.type?.id || feature?.type?.identifier || feature?.id || ''
    );
    if (!curie.startsWith('HP:')) continue;
    const term = {
      curie,
      label: String(feature?.type?.label || feature?.type?.name || feature?.label || curie)
    };
    if (feature?.excluded === true) excluded.push(term);
    else present.push(term);
  }
  return { present, excluded };
}

function createPacketLookupMap(terms) {
  return new Map(terms.map((term) => [term.curie, term.label]));
}

async function loadRostersAndPackets(rosterPath) {
  const roster = JSON.parse(await fs.readFile(rosterPath, 'utf8'));
  const byCase = new Map();
  for (const entry of roster.cases || []) {
    const existing = byCase.get(entry.caseId) || [];
    existing.push(entry);
    byCase.set(entry.caseId, existing);
  }

  for (const [caseId, entries] of byCase) {
    const phenopacketDir = roster.phenopacketDir;
    const filePath = path.join(phenopacketDir, `${caseId}.json`);
    const payload = JSON.parse(await fs.readFile(filePath, 'utf8'));
    const packet = loadPhenopacketTerms(payload);
    for (const entry of entries) {
      entry.packet = packet;
    }
  }

  return roster;
}

async function loadDiseaseContext(client, rosterCases) {
  const diseaseCuries = [...new Set((rosterCases || []).map((entry) => entry.diseaseCurie).filter(Boolean))];
  const diseaseRows = await client.query(
    `
      SELECT
        e.entity_id,
        e.canonical_curie,
        e.canonical_label,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'xrefCurie', x.xref_curie,
              'sourceKey', x.source_key
            )
          ) FILTER (WHERE x.entity_xref_id IS NOT NULL),
          '[]'::jsonb
        ) AS xrefs
      FROM entities e
      LEFT JOIN entity_xrefs x
        ON x.entity_id = e.entity_id
      WHERE e.entity_type = 'disease'
        AND e.canonical_curie = ANY($1::text[])
      GROUP BY e.entity_id, e.canonical_curie, e.canonical_label
    `,
    [diseaseCuries]
  );

  const dxRows = await loadDxDiseasePhenotypeRows(client);
  const directPhenotypesByDisease = new Map();
  for (const row of dxRows.rows) {
    if (row.phenotype_edge_origin !== 'direct') continue;
    const presenceStatus =
      String(row.presence_status || ASSERTION_STATUS.PRESENT).trim().toLowerCase() === ASSERTION_STATUS.ABSENT
        ? ASSERTION_STATUS.ABSENT
        : ASSERTION_STATUS.PRESENT;
    const current = directPhenotypesByDisease.get(row.disease_curie) || {
      [ASSERTION_STATUS.PRESENT]: new Set(),
      [ASSERTION_STATUS.ABSENT]: new Set()
    };
    current[presenceStatus].add(row.phenotype_curie);
    directPhenotypesByDisease.set(row.disease_curie, current);
  }

  const diseaseByCurie = new Map(
    diseaseRows.rows.map((row) => {
      const xrefs = row.xrefs || [];
      return [
        row.canonical_curie,
        {
          entityId: row.entity_id,
          diseaseCurie: row.canonical_curie,
          diseaseLabel: row.canonical_label,
          xrefs,
          omimXrefs: xrefs.map((xref) => normalizeCurie(xref.xrefCurie)).filter((xref) => xref.startsWith('OMIM:')),
          orphanetXrefs: xrefs
            .map((xref) => normalizeCurie(xref.xrefCurie))
            .filter((xref) => xref.startsWith('ORPHANET:') || xref.startsWith('ORPHA:')),
          directPhenotypes:
            directPhenotypesByDisease.get(row.canonical_curie) || {
              [ASSERTION_STATUS.PRESENT]: new Set(),
              [ASSERTION_STATUS.ABSENT]: new Set()
            }
        }
      ];
    })
  );

  return diseaseByCurie;
}

function parseHpoAnnotations(text) {
  const byDiseaseId = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const cols = line.split('\t');
    const diseaseId = normalizeCurie(cols[0] || '');
    const diseaseLabel = String(cols[1] || '');
    const qualifier = String(cols[2] || '');
    const phenotypeCurie = normalizeCurie(cols[3] || '');
    const reference = String(cols[4] || '');
    const evidenceCode = String(cols[5] || '');
    const frequencyRaw = String(cols[6] || '');
    if (!diseaseId || !phenotypeCurie) continue;
    const assertionPresenceStatus =
      qualifier === 'NOT' ? ASSERTION_STATUS.ABSENT : ASSERTION_STATUS.PRESENT;
    const sourceKey =
      assertionPresenceStatus === ASSERTION_STATUS.ABSENT
        ? SOURCE_KEYS.HPO_DISEASE_PHENOTYPE_NEGATIVE
        : SOURCE_KEYS.HPO_DISEASE_PHENOTYPE;

    const row = {
      sourceKey,
      assertionPresenceStatus,
      diseaseId,
      diseaseLabel,
      phenotypeCurie,
      sourceReference: reference || diseaseId,
      evidenceCode,
      frequencyRaw,
      frequency: buildFrequencyInfo(frequencyRaw),
      referenceText: reference,
      payload: {
        disease_id: diseaseId,
        disease_name: diseaseLabel,
        qualifier,
        hpo_id: phenotypeCurie,
        reference,
        evidence: evidenceCode,
        frequency: frequencyRaw
      }
    };

    const current = byDiseaseId.get(diseaseId) || [];
    current.push(row);
    byDiseaseId.set(diseaseId, current);
  }
  return byDiseaseId;
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

  for (const status of statuses) {
    const disorder = status?.Disorder;
    const orphaCode = String(disorder?.OrphaCode || '').trim();
    if (!orphaCode) continue;
    const diseaseId = `ORPHANET:${orphaCode}`;
    const diseaseLabel = String(disorder?.Name?.['#text'] || disorder?.Name || '');
    const sourceText = String(status?.Source || '').trim();
    const associations = asArray(disorder?.HPODisorderAssociationList?.HPODisorderAssociation);
    const rows = byOrpha.get(diseaseId) || [];

    for (const association of associations) {
      const phenotypeCurie = normalizeCurie(
        association?.HPO?.HPOId?.['#text'] || association?.HPO?.HPOId || ''
      );
      if (!phenotypeCurie) continue;
      const frequencyText = String(
        association?.HPOFrequency?.Name?.['#text'] || association?.HPOFrequency?.Name || ''
      );
      rows.push({
        sourceKey: SOURCE_KEYS.ORPHADATA_PHENOTYPES,
        assertionPresenceStatus: ASSERTION_STATUS.PRESENT,
        diseaseId,
        diseaseLabel,
        phenotypeCurie,
        sourceReference: diseaseId,
        evidenceCode: '',
        frequencyRaw: frequencyText,
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

  return byOrpha;
}

function parseHoom(text) {
  const byOrpha = new Map();
  const regex = /#Orpha:(\d+)_HP:(\d{7})_Freq:([A-Z]+)/g;
  for (const match of text.matchAll(regex)) {
    const [, orphaCode, hpoDigits, frequencyCode] = match;
    const diseaseId = `ORPHANET:${orphaCode}`;
    const phenotypeCurie = `HP:${hpoDigits}`;
    const frequencyCurie = HOOM_FREQUENCY_CODE_MAP[frequencyCode] || '';
    const rows = byOrpha.get(diseaseId) || [];
    rows.push({
      sourceKey: SOURCE_KEYS.ORPHADATA_HOOM,
      assertionPresenceStatus: ASSERTION_STATUS.PRESENT,
      diseaseId,
      diseaseLabel: '',
      phenotypeCurie,
      sourceReference: diseaseId,
      evidenceCode: '',
      frequencyRaw: frequencyCode,
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
  return byOrpha;
}

async function parsePrimeKgPhenotypeRows(csvPath, { targetDiseaseLabels, targetPhenotypeCuries }) {
  const byDiseaseLabel = new Map();
  const input = fsSync.createReadStream(csvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  let headers = [];

  for await (const line of rl) {
    if (!line) continue;
    if (!headers.length) {
      headers = parseCsvLine(line);
      continue;
    }

    const values = parseCsvLine(line);
    if (values.length !== headers.length) continue;
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    const assertionPresenceStatus = PRIMEKG_RELATION_TO_ASSERTION[row.relation];
    if (!assertionPresenceStatus) continue;
    if (row.x_type !== 'disease' || row.y_source !== 'HPO') continue;

    const normalizedDiseaseLabel = normalizeLabel(row.x_name);
    if (!targetDiseaseLabels.has(normalizedDiseaseLabel)) continue;

    const phenotypeCurie = normalizeCurie(
      String(row.y_id || '').startsWith('HP:') ? row.y_id : `HP:${String(row.y_id || '').padStart(7, '0')}`
    );
    if (!targetPhenotypeCuries.has(phenotypeCurie)) continue;

    const rows = byDiseaseLabel.get(normalizedDiseaseLabel) || [];
    rows.push({
      sourceKey: SOURCE_KEYS.PRIMEKG,
      assertionPresenceStatus,
      diseaseId: row.x_id,
      diseaseLabel: row.x_name,
      phenotypeCurie,
      sourceReference: `PrimeKG:${row.x_source}:${row.x_id}`,
      evidenceCode: '',
      frequencyRaw: '',
      frequency: buildFrequencyInfo(''),
      referenceText: row.display_relation || row.relation,
      payload: {
        relation: row.relation,
        display_relation: row.display_relation,
        disease_id: row.x_id,
        disease_name: row.x_name,
        disease_source: row.x_source,
        phenotype_id: phenotypeCurie,
        phenotype_name: row.y_name,
        phenotype_source: row.y_source
      }
    });
    byDiseaseLabel.set(normalizedDiseaseLabel, rows);
  }

  return byDiseaseLabel;
}

function collectSourceMatches(sourceRowsByDiseaseId, diseaseIds, packetLookup) {
  const matches = [];
  for (const diseaseId of diseaseIds) {
    for (const row of sourceRowsByDiseaseId.get(diseaseId) || []) {
      if (!packetLookup.has(row.phenotypeCurie)) continue;
      matches.push({
        sourceKey: row.sourceKey,
        assertionPresenceStatus: row.assertionPresenceStatus || ASSERTION_STATUS.PRESENT,
        provenanceUrl: SOURCE_CATALOG[row.sourceKey]?.homepageUrl || '',
        sourceReference: row.sourceReference,
        phenotypeCurie: row.phenotypeCurie,
        phenotypeLabel: packetLookup.get(row.phenotypeCurie) || row.phenotypeCurie,
        evidenceCode: row.evidenceCode || '',
        frequencyCurie: row.frequency?.curie || '',
        frequencyLabel: row.frequency?.label || '',
        referenceText: row.referenceText || '',
        payload: row.payload || {}
      });
    }
  }
  return matches;
}

function collectSourceMatchesByDiseaseLabel(sourceRowsByDiseaseLabel, diseaseLabels, packetLookup) {
  const matches = [];
  for (const diseaseLabel of diseaseLabels) {
    const normalizedDiseaseLabel = normalizeLabel(diseaseLabel);
    for (const row of sourceRowsByDiseaseLabel.get(normalizedDiseaseLabel) || []) {
      if (!packetLookup.has(row.phenotypeCurie)) continue;
      matches.push({
        sourceKey: row.sourceKey,
        assertionPresenceStatus: row.assertionPresenceStatus || ASSERTION_STATUS.PRESENT,
        provenanceUrl: SOURCE_CATALOG[row.sourceKey]?.homepageUrl || '',
        sourceReference: row.sourceReference,
        phenotypeCurie: row.phenotypeCurie,
        phenotypeLabel: packetLookup.get(row.phenotypeCurie) || row.phenotypeCurie,
        evidenceCode: row.evidenceCode || '',
        frequencyCurie: row.frequency?.curie || '',
        frequencyLabel: row.frequency?.label || '',
        referenceText: row.referenceText || '',
        payload: row.payload || {}
      });
    }
  }
  return matches;
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
      entry.caseId,
      entry.side,
      entry.diseaseCurie,
      entry.phenotypeCurie,
      entry.assertionPresenceStatus,
      entry.packetPresenceStatus,
      entry.frequencyCurie
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
    const supportKey = `${entry.sourceKey}|${entry.sourceReference}|${entry.evidenceTag}|${entry.frequencyCurie}`;
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
  return [...byKey.values()];
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const rosterPath = flags.roster || DEFAULTS.rosterJson;
  const outputPath = flags.output || DEFAULTS.outputJson;
  const generatedAt = flags.date || DEFAULTS.generatedAt;
  const roster = await loadRostersAndPackets(rosterPath);
  const targetDiseaseLabels = new Set((roster.cases || []).flatMap((entry) => [entry.diseaseLabel]).map(normalizeLabel));
  const targetPhenotypeCuries = new Set(
    (roster.cases || []).flatMap((entry) => [
      ...(entry.packet?.present || []).map((term) => term.curie),
      ...(entry.packet?.excluded || []).map((term) => term.curie)
    ])
  );

  const [hpoText, orphadataXml, hoomZipBuffer, primeKgCsvPath] = await Promise.all([
    fetchCachedText(SOURCE_CATALOG[SOURCE_KEYS.HPO_DISEASE_PHENOTYPE].accessUrl, 'phenotype.hpoa', DEFAULTS.cacheDir),
    fetchCachedText(SOURCE_CATALOG[SOURCE_KEYS.ORPHADATA_PHENOTYPES].accessUrl, 'en_product4.xml', DEFAULTS.cacheDir),
    fetchCachedBuffer(SOURCE_CATALOG[SOURCE_KEYS.ORPHADATA_HOOM].accessUrl, 'hoom_orphanet_2.4.zip', DEFAULTS.cacheDir),
    fetchCachedFile(SOURCE_CATALOG[SOURCE_KEYS.PRIMEKG].accessUrl, 'primekg.csv', DEFAULTS.cacheDir)
  ]);

  const hoomZipPath = path.join(DEFAULTS.cacheDir, 'hoom_orphanet_2.4.zip');
  await fs.writeFile(hoomZipPath, hoomZipBuffer);

  const [hpoRowsByDisease, orphadataRowsByDisease, hoomRowsByDisease, primeKgRowsByDiseaseLabel] = await Promise.all([
    Promise.resolve(parseHpoAnnotations(hpoText)),
    Promise.resolve(parseOrphadataPhenotypes(orphadataXml)),
    unzipSingleFile(hoomZipPath, 'hoom_orphanet.owl').then(parseHoom),
    parsePrimeKgPhenotypeRows(primeKgCsvPath, { targetDiseaseLabels, targetPhenotypeCuries })
  ]);

  const diseaseByCurie = await withClient((client) => loadDiseaseContext(client, roster.cases || []));

  const manifestEntries = [];
  for (const rosterEntry of roster.cases || []) {
    const diseaseContext = diseaseByCurie.get(rosterEntry.diseaseCurie);
    if (!diseaseContext) continue;

    const packetLookup = createPacketLookupMap([
      ...(rosterEntry.packet?.present || []),
      ...(rosterEntry.packet?.excluded || [])
    ]);
    const directPhenotypes = diseaseContext.directPhenotypes || {
      [ASSERTION_STATUS.PRESENT]: new Set(),
      [ASSERTION_STATUS.ABSENT]: new Set()
    };
    const omimIds = diseaseContext.omimXrefs;
    const orphanetIds = diseaseContext.orphanetXrefs.map((value) =>
      value.startsWith('ORPHA:') ? value.replace(/^ORPHA:/, 'ORPHANET:') : value
    );
    const diseaseLabels = [...new Set([diseaseContext.diseaseLabel, rosterEntry.diseaseLabel].filter(Boolean))];

    const sourceMatches = [
      ...collectSourceMatches(
        hpoRowsByDisease,
        [...omimIds, ...orphanetIds],
        packetLookup
      ),
      ...collectSourceMatches(
        orphadataRowsByDisease,
        orphanetIds,
        packetLookup
      ),
      ...collectSourceMatches(
        hoomRowsByDisease,
        orphanetIds,
        packetLookup
      ),
      ...collectSourceMatchesByDiseaseLabel(primeKgRowsByDiseaseLabel, diseaseLabels, packetLookup)
    ];

    for (const match of sourceMatches) {
      const existingForStatus = directPhenotypes[match.assertionPresenceStatus || ASSERTION_STATUS.PRESENT] || new Set();
      if (existingForStatus.has(match.phenotypeCurie)) {
        continue;
      }

      const sourceDiseaseRef = match.sourceReference || diseaseContext.diseaseCurie;
      const evidenceTag = `${match.sourceKey}_${slugify(sourceDiseaseRef)}_${match.assertionPresenceStatus || ASSERTION_STATUS.PRESENT}`;
      const sourceRecordKey = [
        'packet-source-enrichment',
        slugify(rosterEntry.caseId),
        slugify(rosterEntry.side),
        slugify(diseaseContext.diseaseCurie),
        slugify(match.phenotypeCurie),
        slugify(match.assertionPresenceStatus || ASSERTION_STATUS.PRESENT),
        slugify(match.sourceKey),
        slugify(match.sourceReference || 'na')
      ].join(':');

      manifestEntries.push({
        caseId: rosterEntry.caseId,
        side: rosterEntry.side,
        dateAdded: generatedAt,
        geneLabel: rosterEntry.geneLabel,
        diseaseCurie: diseaseContext.diseaseCurie,
        diseaseLabel: diseaseContext.diseaseLabel,
        phenotypeCurie: match.phenotypeCurie,
        phenotypeLabel: match.phenotypeLabel,
        assertionPresenceStatus: match.assertionPresenceStatus || ASSERTION_STATUS.PRESENT,
        packetPresenceStatus:
          (rosterEntry.packet?.present || []).some((term) => term.curie === match.phenotypeCurie) ? 'present' : 'excluded',
        sourceKey: match.sourceKey,
        sourceReference: match.sourceReference,
        provenanceUrl: match.provenanceUrl,
        evidenceCode: match.evidenceCode,
        sourceRecordKey,
        evidenceTag,
        frequencyCurie: match.frequencyCurie,
        frequencyLabel: match.frequencyLabel,
        referenceText: match.referenceText,
        payload: {
          roster: {
            caseId: rosterEntry.caseId,
            side: rosterEntry.side,
            geneLabel: rosterEntry.geneLabel
          },
          source: match.payload,
          note: 'Packet-relevant source enrichment manifest generated from HPO/Product4/HOOM/PrimeKG.'
        }
      });
    }
  }

  const entries = dedupeManifestEntries(manifestEntries).sort((left, right) =>
    [
      left.caseId,
      left.side,
      left.diseaseCurie,
      left.phenotypeCurie,
      left.assertionPresenceStatus,
      left.sourceKey,
      left.sourceReference
    ]
      .join('|')
      .localeCompare(
        [
          right.caseId,
          right.side,
          right.diseaseCurie,
          right.phenotypeCurie,
          right.assertionPresenceStatus,
          right.sourceKey,
          right.sourceReference
        ].join('|')
      )
  );

  const manifest = {
    createdAt: generatedAt,
    rosterPath,
    outputPath,
    sourceNotes: {
      [SOURCE_KEYS.HPO_DISEASE_PHENOTYPE]: SOURCE_CATALOG[SOURCE_KEYS.HPO_DISEASE_PHENOTYPE].accessUrl,
      [SOURCE_KEYS.HPO_DISEASE_PHENOTYPE_NEGATIVE]: 'Uses NOT-qualified rows from phenotype.hpoa.',
      [SOURCE_KEYS.ORPHADATA_PHENOTYPES]: SOURCE_CATALOG[SOURCE_KEYS.ORPHADATA_PHENOTYPES].accessUrl,
      [SOURCE_KEYS.ORPHADATA_HOOM]: SOURCE_CATALOG[SOURCE_KEYS.ORPHADATA_HOOM].accessUrl,
      [SOURCE_KEYS.PRIMEKG]: SOURCE_CATALOG[SOURCE_KEYS.PRIMEKG].accessUrl,
      hoomAccessNote:
        'The HOOM landing page advertised hoom_orphanet_2.5.zip on 2026-03-28, but the direct file returned 404. The latest live official archive was hoom_orphanet_2.4.zip.'
    },
    entryCount: entries.length,
    entries
  };

  await ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ outputPath, entryCount: entries.length }, null, 2));
}

main().catch((error) => {
  console.error('[generate-packet-source-enrichment-manifest] failed:', error);
  process.exit(1);
});

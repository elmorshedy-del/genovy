import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { withClient } from '../db/pool.js';
import { SOURCE_CATALOG, SOURCE_KEYS } from '../constants/sourceCatalog.js';
import { normalizeCurie } from '../lib/curies.js';

const DEFAULTS = Object.freeze({
  outputJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-manifest-hpo-negative-global-20260328.json',
  cacheDir: path.join(os.tmpdir(), 'genovy-source-enrichment-cache'),
  generatedAt: '2026-03-28'
});

const ASSERTION_STATUS = Object.freeze({
  PRESENT: 'present',
  ABSENT: 'absent'
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

function parseHpoNegativeAnnotations(text) {
  const byDiseaseId = new Map();
  const phenotypeCuries = new Set();
  let rawNegativeRows = 0;

  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const cols = line.split('\t');
    const diseaseId = normalizeCurie(cols[0] || '');
    const diseaseLabel = String(cols[1] || '').trim();
    const qualifier = String(cols[2] || '').trim();
    const phenotypeCurie = normalizeCurie(cols[3] || '');
    const reference = String(cols[4] || '').trim();
    const evidenceCode = String(cols[5] || '').trim();
    if (qualifier !== 'NOT' || !diseaseId || !phenotypeCurie) continue;

    const row = {
      diseaseId,
      diseaseLabel,
      phenotypeCurie,
      sourceReference: reference || diseaseId,
      evidenceCode,
      referenceText: reference,
      payload: {
        disease_id: diseaseId,
        disease_name: diseaseLabel,
        qualifier,
        hpo_id: phenotypeCurie,
        reference,
        evidence: evidenceCode
      }
    };

    phenotypeCuries.add(phenotypeCurie);
    rawNegativeRows += 1;
    const current = byDiseaseId.get(diseaseId) || [];
    current.push(row);
    byDiseaseId.set(diseaseId, current);
  }

  return { byDiseaseId, phenotypeCuries, rawNegativeRows };
}

async function loadDiseaseContext(client, phenotypeCuries) {
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
              WHERE cpa.presence_status = 'absent'
                AND phenotype.canonical_curie IS NOT NULL
            ),
          ARRAY[]::text[]
        ) AS direct_absent_phenotype_curies
      FROM entities e
      LEFT JOIN entity_xrefs x
        ON x.entity_id = e.entity_id
      LEFT JOIN clinical_phenotype_assertions cpa
        ON cpa.subject_entity_id = e.entity_id
       AND cpa.presence_status = 'absent'
      LEFT JOIN entities phenotype
        ON phenotype.entity_id = cpa.phenotype_entity_id
      WHERE e.entity_type = 'disease'
        AND e.is_placeholder = FALSE
      GROUP BY e.entity_id, e.canonical_curie, e.canonical_label
    `
  );

  const phenotypeRows = await client.query(
    `
      SELECT canonical_curie
      FROM entities
      WHERE entity_type = 'phenotype'
        AND canonical_curie = ANY($1::text[])
    `,
    [[...phenotypeCuries]]
  );

  const phenotypeSet = new Set(phenotypeRows.rows.map((row) => row.canonical_curie));
  const diseases = diseaseRows.rows.map((row) => ({
    entityId: row.entity_id,
    diseaseCurie: row.canonical_curie,
    diseaseLabel: row.canonical_label,
    xrefs: row.xrefs || [],
    directAbsentPhenotypes: new Set(row.direct_absent_phenotype_curies || [])
  }));

  return { diseases, phenotypeSet };
}

function buildDiseaseLookup(diseases) {
  const byExternalCurie = new Map();

  for (const disease of diseases) {
    const curies = new Set([disease.diseaseCurie]);
    for (const xref of disease.xrefs || []) {
      const normalized = normalizeCurie(xref?.xrefCurie || '');
      if (normalized) {
        curies.add(normalized);
        if (normalized.startsWith('ORPHA:')) {
          curies.add(normalized.replace(/^ORPHA:/, 'ORPHANET:'));
        } else if (normalized.startsWith('ORPHANET:')) {
          curies.add(normalized.replace(/^ORPHANET:/, 'ORPHA:'));
        }
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

function dedupeManifestEntries(entries) {
  const byKey = new Map();
  for (const entry of entries) {
    const key = [entry.diseaseCurie, entry.phenotypeCurie, entry.assertionPresenceStatus].join('|');
    const current = byKey.get(key);
    const support = {
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

    if (!current) {
      byKey.set(key, {
        ...entry,
        sourceCount: 1,
        supportingSources: [support]
      });
      continue;
    }

    const supports = current.supportingSources || [];
    const supportKey = [support.sourceKey, support.sourceReference, support.evidenceCode, support.referenceText].join('|');
    const seen = new Set(
      supports.map((item) => [item.sourceKey, item.sourceReference, item.evidenceCode, item.referenceText].join('|'))
    );
    if (!seen.has(supportKey)) {
      supports.push(support);
    }
    current.supportingSources = supports;
    current.sourceCount = supports.length;
  }

  return [...byKey.values()].sort((left, right) =>
    [left.diseaseCurie, left.phenotypeCurie].join('|').localeCompare([right.diseaseCurie, right.phenotypeCurie].join('|'))
  );
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const outputPath = flags.output || DEFAULTS.outputJson;
  const generatedAt = flags.date || DEFAULTS.generatedAt;
  const hpoText = await fetchCachedText(
    SOURCE_CATALOG[SOURCE_KEYS.HPO_DISEASE_PHENOTYPE_NEGATIVE].accessUrl,
    'phenotype.hpoa',
    DEFAULTS.cacheDir
  );

  const { byDiseaseId, phenotypeCuries, rawNegativeRows } = parseHpoNegativeAnnotations(hpoText);
  const { diseases, phenotypeSet } = await withClient((client) => loadDiseaseContext(client, phenotypeCuries));
  const diseaseLookup = buildDiseaseLookup(diseases);

  let unmatchedDiseaseIds = 0;
  let missingPhenotypeRows = 0;
  let skippedExistingRows = 0;
  let mappedRows = 0;
  const manifestEntries = [];

  for (const [sourceDiseaseId, rows] of byDiseaseId.entries()) {
    const matchedDiseases = diseaseLookup.get(sourceDiseaseId) || [];
    if (!matchedDiseases.length) {
      unmatchedDiseaseIds += 1;
      continue;
    }

    for (const row of rows) {
      if (!phenotypeSet.has(row.phenotypeCurie)) {
        missingPhenotypeRows += 1;
        continue;
      }

      for (const disease of matchedDiseases) {
        if (disease.directAbsentPhenotypes.has(row.phenotypeCurie)) {
          skippedExistingRows += 1;
          continue;
        }

        mappedRows += 1;
        const evidenceTag = `${SOURCE_KEYS.HPO_DISEASE_PHENOTYPE_NEGATIVE}_${slugify(sourceDiseaseId)}_absent`;
        const sourceRecordKey = [
          'global-hpo-negative-enrichment',
          slugify(disease.diseaseCurie),
          slugify(row.phenotypeCurie),
          'absent',
          slugify(sourceDiseaseId)
        ].join(':');

        manifestEntries.push({
          caseId: 'global_hpo_negative_import',
          side: 'global_import',
          dateAdded: generatedAt,
          geneLabel: '',
          diseaseCurie: disease.diseaseCurie,
          diseaseLabel: disease.diseaseLabel,
          phenotypeCurie: row.phenotypeCurie,
          phenotypeLabel: row.phenotypeCurie,
          assertionPresenceStatus: ASSERTION_STATUS.ABSENT,
          packetPresenceStatus: '',
          sourceKey: SOURCE_KEYS.HPO_DISEASE_PHENOTYPE_NEGATIVE,
          sourceReference: row.sourceReference,
          provenanceUrl: SOURCE_CATALOG[SOURCE_KEYS.HPO_DISEASE_PHENOTYPE_NEGATIVE].accessUrl,
          evidenceCode: row.evidenceCode || '',
          sourceRecordKey,
          evidenceTag,
          frequencyCurie: '',
          frequencyLabel: '',
          referenceText: row.referenceText || row.sourceReference,
          payload: {
            source: {
              diseaseId: sourceDiseaseId,
              qualifier: 'NOT',
              importedMode: 'global_hpo_negative_manifest'
            }
          }
        });
      }
    }
  }

  const dedupedEntries = dedupeManifestEntries(manifestEntries);
  const report = {
    generatedAt,
    outputPath,
    sourceUrls: {
      [SOURCE_KEYS.HPO_DISEASE_PHENOTYPE_NEGATIVE]:
        SOURCE_CATALOG[SOURCE_KEYS.HPO_DISEASE_PHENOTYPE_NEGATIVE].accessUrl
    },
    summary: {
      rawNegativeRows,
      rawNegativeDiseases: byDiseaseId.size,
      matchedGraphDiseases: new Set(dedupedEntries.map((entry) => entry.diseaseCurie)).size,
      unmatchedDiseaseIds,
      missingPhenotypeRows,
      skippedExistingRows,
      mappedRows,
      dedupedEntries: dedupedEntries.length
    },
    entries: dedupedEntries
  };

  await ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.summary, null, 2));
}

main().catch((error) => {
  console.error('[generate-global-hpo-negative-manifest] failed:', error);
  process.exit(1);
});

import fs from 'node:fs/promises';
import path from 'node:path';
import { withClient } from '../db/pool.js';
import { ensureSourceCatalog, createSyncRun, finalizeSyncRun, markSourceSyncState } from '../repositories/sourceRepository.js';
import {
  resolveEntitiesByCurieBatch,
  upsertResolvedRelationships,
  upsertRelationshipEvidenceBatch,
  upsertSourceRecordsBatch
} from '../repositories/knowledgeRepository.js';
import { upsertClinicalPhenotypeAssertionsBatch } from '../repositories/clinicalEvidenceRepository.js';
import { stableHash } from '../lib/curies.js';
import { stableJson } from '../lib/json.js';

const DEFAULTS = Object.freeze({
  manifestJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-manifest-20260328.json',
  logJson:
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/source-enrichment-apply-log-20260328.json'
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

function buildRelationshipKey(subjectEntityId, predicateKey, objectEntityId, qualifiers) {
  return stableHash(`${subjectEntityId}|${predicateKey}|${objectEntityId}|${stableJson(qualifiers)}`);
}

function dedupeByKey(rows, buildKey) {
  const deduped = new Map();
  for (const row of rows) {
    deduped.set(buildKey(row), row);
  }
  return [...deduped.values()];
}

function slugify(value) {
  return String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const manifestPath = flags.manifest || DEFAULTS.manifestJson;
  const logPath = flags.log || DEFAULTS.logJson;
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const entries = manifest.entries || [];

  if (!entries.length) {
    const emptyResult = { manifestPath, logPath, applied: 0, sourceSummaries: [] };
    await fs.writeFile(logPath, `${JSON.stringify(emptyResult, null, 2)}\n`);
    console.log(JSON.stringify(emptyResult, null, 2));
    return;
  }

  const result = await withClient(async (client) => {
    await client.query('BEGIN');
    try {
      await ensureSourceCatalog(client);

      const sourceKeys = [
        ...new Set(
          entries.flatMap((entry) =>
            (entry.supportingSources?.length ? entry.supportingSources : [entry])
              .map((source) => source.sourceKey)
              .filter(Boolean)
          )
        )
      ];
      const syncRuns = new Map();
      for (const sourceKey of sourceKeys) {
        const syncRun = await createSyncRun(client, sourceKey, {
          triggerMode: 'manual',
          requestedBy: 'codex',
          options: {
            strategy: 'source_enrichment_manifest',
            manifestPath
          }
        });
        syncRuns.set(sourceKey, syncRun);
      }

      const curies = [
        ...new Set(
          entries.flatMap((entry) => [entry.diseaseCurie, entry.phenotypeCurie, entry.frequencyCurie].filter(Boolean))
        )
      ];
      const resolved = await resolveEntitiesByCurieBatch(client, curies);
      const entityIdByCurie = new Map();
      for (const row of resolved) {
        entityIdByCurie.set(row.matched_curie, row.entity_id);
        entityIdByCurie.set(row.canonical_curie, row.entity_id);
      }

      const sourceRecords = [];
      const relationships = [];
      const relationshipEvidence = [];
      const clinicalRows = [];
      const summaryBySource = new Map(
        sourceKeys.map((sourceKey) => [
          sourceKey,
          {
            sourceKey,
            manifestEntries: 0,
            sourceRecords: 0,
            relationships: 0,
            evidenceRows: 0,
            clinicalAssertions: 0
          }
        ])
      );

      for (const entry of entries) {
        const diseaseEntityId = entityIdByCurie.get(entry.diseaseCurie);
        const phenotypeEntityId = entityIdByCurie.get(entry.phenotypeCurie);
        const frequencyEntityId = entry.frequencyCurie ? entityIdByCurie.get(entry.frequencyCurie) || '' : '';
        const supportingSources =
          entry.supportingSources?.length
            ? entry.supportingSources
            : [
                {
                  sourceKey: entry.sourceKey,
                  sourceReference: entry.sourceReference,
                  provenanceUrl: entry.provenanceUrl,
                  evidenceCode: entry.evidenceCode,
                  evidenceTag: entry.evidenceTag,
                  frequencyCurie: entry.frequencyCurie,
                  frequencyLabel: entry.frequencyLabel,
                  referenceText: entry.referenceText,
                  payload: entry.payload?.source || entry.payload || {}
                }
              ];

        if (!diseaseEntityId) {
          throw new Error(`Missing disease entity for ${entry.diseaseCurie}`);
        }
        if (!phenotypeEntityId) {
          throw new Error(`Missing phenotype entity for ${entry.phenotypeCurie}`);
        }

        const qualifiers = {
          frequency: entry.frequencyCurie || entry.frequencyLabel || '',
          packet_presence_status: entry.packetPresenceStatus || ''
        };
        const relationshipKey = buildRelationshipKey(diseaseEntityId, 'has_phenotype', phenotypeEntityId, qualifiers);

        relationships.push({
          relationshipKey,
          subjectEntityId: diseaseEntityId,
          predicateKey: 'has_phenotype',
          objectEntityId: phenotypeEntityId,
          qualifiers
        });

        for (const source of supportingSources) {
          const sourceKey = source.sourceKey;
          const syncRun = syncRuns.get(sourceKey);
          const sourceRecordKey = [
            entry.sourceRecordKey || 'source-enrichment-manifest',
            slugify(sourceKey),
            slugify(source.sourceReference || 'na')
          ].join(':');

          sourceRecords.push({
            sourceKey,
            syncRunId: syncRun?.sync_run_id || null,
            recordType: 'source_enrichment_manifest',
            sourceRecordKey,
            canonicalCurie: entry.diseaseCurie,
            payload: {
              diseaseCurie: entry.diseaseCurie,
              diseaseLabel: entry.diseaseLabel,
              phenotypeCurie: entry.phenotypeCurie,
              phenotypeLabel: entry.phenotypeLabel,
              sourceReference: source.sourceReference,
              side: entry.side,
              caseId: entry.caseId,
              dateAdded: entry.dateAdded,
              evidenceTag: source.evidenceTag,
              packetPresenceStatus: entry.packetPresenceStatus,
              referenceText: source.referenceText || '',
              frequencyCurie: entry.frequencyCurie || source.frequencyCurie || '',
              frequencyLabel: entry.frequencyLabel || source.frequencyLabel || '',
              sourcePayload: source.payload || {}
            }
          });

          relationshipEvidence.push({
            relationshipKey,
            sourceKey,
            syncRunId: syncRun?.sync_run_id || null,
            sourceRecordKey,
            evidenceType: 'source_enrichment_manifest',
            evidenceCode: source.evidenceCode || '',
            confidenceScore: '',
            provenanceUrl: source.provenanceUrl || '',
            payload: {
              caseId: entry.caseId,
              side: entry.side,
              dateAdded: entry.dateAdded,
              evidenceTag: source.evidenceTag,
              sourceReference: source.sourceReference,
              packetPresenceStatus: entry.packetPresenceStatus,
              frequencyCurie: entry.frequencyCurie || source.frequencyCurie || '',
              frequencyLabel: entry.frequencyLabel || source.frequencyLabel || '',
              referenceText: source.referenceText || ''
            }
          });

          clinicalRows.push({
            subjectEntityId: diseaseEntityId,
            phenotypeEntityId,
            presenceStatus: 'present',
            sourceKey,
            syncRunId: syncRun?.sync_run_id || null,
            sourceRecordKey,
            evidenceCode: source.evidenceCode || '',
            confidenceScore: '',
            onsetEntityId: '',
            frequencyEntityId,
            modifierEntityId: '',
            sex: '',
            aspect: '',
            referenceText: source.referenceText || source.sourceReference || '',
            provenanceUrl: source.provenanceUrl || '',
            payload: {
              caseId: entry.caseId,
              side: entry.side,
              dateAdded: entry.dateAdded,
              evidenceTag: source.evidenceTag,
              sourceReference: source.sourceReference,
              packetPresenceStatus: entry.packetPresenceStatus,
              frequency: entry.frequencyCurie || entry.frequencyLabel || '',
              phenotypeLabel: entry.phenotypeLabel,
              diseaseLabel: entry.diseaseLabel
            }
          });

          const summary = summaryBySource.get(sourceKey);
          summary.manifestEntries += 1;
        }
      }

      const dedupedSourceRecords = dedupeByKey(
        sourceRecords,
        (row) => `${row.sourceKey}|${row.sourceRecordKey}|${row.canonicalCurie}`
      );
      const dedupedRelationships = dedupeByKey(relationships, (row) => row.relationshipKey);
      const dedupedClinicalRows = dedupeByKey(
        clinicalRows,
        (row) => `${row.sourceKey}|${row.sourceRecordKey}|${row.subjectEntityId}|${row.phenotypeEntityId}|${row.presenceStatus}`
      );

      await upsertSourceRecordsBatch(client, dedupedSourceRecords);
      const persistedRelationships = await upsertResolvedRelationships(client, dedupedRelationships, '');
      const relationshipIdByKey = new Map(
        persistedRelationships.map((row) => [row.relationship_key, row.relationship_id])
      );

      const evidenceRows = dedupeByKey(
        relationshipEvidence.map((row) => ({
          relationshipId: relationshipIdByKey.get(row.relationshipKey),
          sourceKey: row.sourceKey,
          syncRunId: row.syncRunId,
          sourceRecordKey: row.sourceRecordKey,
          evidenceType: row.evidenceType,
          evidenceCode: row.evidenceCode,
          confidenceScore: row.confidenceScore,
          provenanceUrl: row.provenanceUrl,
          payload: row.payload
        })),
        (row) =>
          `${row.relationshipId}|${row.sourceKey}|${row.sourceRecordKey}|${row.evidenceType}|${row.evidenceCode || ''}`
      );

      await upsertRelationshipEvidenceBatch(client, evidenceRows);
      await upsertClinicalPhenotypeAssertionsBatch(client, dedupedClinicalRows);

      for (const summary of summaryBySource.values()) {
        summary.sourceRecords = dedupedSourceRecords.filter((row) => row.sourceKey === summary.sourceKey).length;
        summary.relationships = evidenceRows.filter((row) => row.sourceKey === summary.sourceKey).length;
        summary.evidenceRows = evidenceRows.filter((row) => row.sourceKey === summary.sourceKey).length;
        summary.clinicalAssertions = dedupedClinicalRows.filter((row) => row.sourceKey === summary.sourceKey).length;
      }

      for (const [sourceKey, syncRun] of syncRuns.entries()) {
        const summary = summaryBySource.get(sourceKey);
        await finalizeSyncRun(client, syncRun.sync_run_id, {
          status: 'completed',
          sourceVersion: manifest.createdAt || '',
          summary
        });
        await markSourceSyncState(client, sourceKey, syncRun.sync_run_id, manifest.createdAt || '', summary);
      }

      await client.query('COMMIT');
      return {
        manifestPath,
        logPath,
        applied: entries.length,
        sourceSummaries: [...summaryBySource.values()]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });

  await fs.mkdir(path.dirname(logPath), { recursive: true });
  await fs.writeFile(logPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error('[apply-source-enrichment-manifest] failed:', error);
  process.exit(1);
});

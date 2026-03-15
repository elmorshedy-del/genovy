import { SOURCE_CATALOG } from '../constants/sourceCatalog.js';
import { getRuntimeStatus } from '../config/env.js';
import { withClient } from '../db/pool.js';
import { listKnowledgeSummary } from '../repositories/knowledgeRepository.js';
import { listCanonicalSummary } from '../repositories/canonicalRepository.js';
import { listSourcesWithState, listSyncRuns } from '../repositories/sourceRepository.js';
import { listActiveSourceSyncs } from './sourceSyncService.js';

const RECENT_SYNC_RUN_LIMIT = 6;

function splitEntityScope(entityScope) {
  return String(entityScope || '')
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
}

function buildFallbackSources() {
  return Object.values(SOURCE_CATALOG).map((source) => ({
    sourceKey: source.sourceKey,
    displayName: source.displayName,
    description: source.description,
    homepageUrl: source.homepageUrl,
    accessUrl: source.accessUrl,
    updateFrequency: source.updateFrequency,
    entityScope: source.entityScope,
    entityScopeTokens: splitEntityScope(source.entityScope),
    lastSuccessfulSyncRunId: null,
    lastSuccessfulAt: null,
    lastSourceVersion: '',
    lastSummary: {},
    hasSuccessfulSync: false
  }));
}

function mapSourceRow(row) {
  return {
    sourceKey: row.source_key,
    displayName: row.display_name,
    description: row.description,
    homepageUrl: row.homepage_url,
    accessUrl: row.access_url,
    updateFrequency: row.update_frequency,
    entityScope: row.entity_scope,
    entityScopeTokens: splitEntityScope(row.entity_scope),
    lastSuccessfulSyncRunId: row.last_successful_sync_run_id,
    lastSuccessfulAt: row.last_successful_at,
    lastSourceVersion: row.last_source_version || '',
    lastSummary: row.last_summary || {},
    hasSuccessfulSync: Boolean(row.last_successful_at)
  };
}

function mapSyncRunRow(row) {
  return {
    syncRunId: row.sync_run_id,
    sourceKey: row.source_key,
    status: row.status,
    triggerMode: row.trigger_mode,
    requestedBy: row.requested_by || '',
    startedAt: row.started_at,
    completedAt: row.completed_at,
    sourceVersion: row.source_version || ''
  };
}

function buildFallbackOverview(runtime) {
  return {
    runtime,
    summary: {
      entities: [],
      relationships: [],
      canonical: {
        concepts: [],
        relationships: [],
        latestRun: null
      }
    },
    sources: buildFallbackSources(),
    activeSyncs: listActiveSourceSyncs(),
    recentSyncRuns: [],
    warning: ''
  };
}

export async function loadPlatformOverview() {
  const runtime = getRuntimeStatus();
  const fallbackOverview = buildFallbackOverview(runtime);

  if (!runtime.knowledgeApiReady) {
    return fallbackOverview;
  }

  try {
    const data = await withClient(async (client) => {
      const [summary, canonicalSummary, sources, recentSyncRuns] = await Promise.all([
        listKnowledgeSummary(client),
        listCanonicalSummary(client).catch(() => ({
          concepts: [],
          relationships: [],
          latestRun: null
        })),
        listSourcesWithState(client),
        listSyncRuns(client, { limit: RECENT_SYNC_RUN_LIMIT })
      ]);

      return {
        summary: {
          ...summary,
          canonical: canonicalSummary
        },
        sources: sources.map((source) => mapSourceRow(source)),
        recentSyncRuns: recentSyncRuns.map((run) => mapSyncRunRow(run))
      };
    });

    return {
      ...fallbackOverview,
      ...data,
      activeSyncs: listActiveSourceSyncs()
    };
  } catch (error) {
    console.error('[genovy] failed to load public platform overview', error);
    return {
      ...fallbackOverview,
      warning: 'Live platform data is temporarily unavailable.'
    };
  }
}

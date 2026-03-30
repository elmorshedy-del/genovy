import { SOURCE_CATALOG } from '../constants/sourceCatalog.js';

export async function ensureSourceCatalog(client) {
  for (const source of Object.values(SOURCE_CATALOG)) {
    await client.query(
      `
        INSERT INTO sources (
          source_key,
          display_name,
          description,
          homepage_url,
          access_url,
          update_frequency,
          entity_scope
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (source_key)
        DO UPDATE SET
          display_name = EXCLUDED.display_name,
          description = EXCLUDED.description,
          homepage_url = EXCLUDED.homepage_url,
          access_url = EXCLUDED.access_url,
          update_frequency = EXCLUDED.update_frequency,
          entity_scope = EXCLUDED.entity_scope,
          updated_at = NOW()
      `,
      [
        source.sourceKey,
        source.displayName,
        source.description,
        source.homepageUrl,
        source.accessUrl,
        source.updateFrequency,
        source.entityScope
      ]
    );

    await client.query(
      `
        INSERT INTO source_sync_state (source_key)
        VALUES ($1)
        ON CONFLICT (source_key) DO NOTHING
      `,
      [source.sourceKey]
    );
  }
}

export async function createSyncRun(client, sourceKey, { triggerMode = 'manual', requestedBy = null, options = {} } = {}) {
  const result = await client.query(
    `
      INSERT INTO sync_runs (
        source_key,
        status,
        trigger_mode,
        requested_by,
        options_json
      )
      VALUES ($1, 'running', $2, $3, $4::jsonb)
      RETURNING *
    `,
    [sourceKey, triggerMode, requestedBy, JSON.stringify(options)]
  );
  return result.rows[0];
}

export async function abandonRunningSyncRuns(client, errorMessage) {
  const result = await client.query(
    `
      UPDATE sync_runs
      SET
        status = 'abandoned',
        error_message = COALESCE(NULLIF(error_message, ''), $1),
        completed_at = NOW()
      WHERE status = 'running'
      RETURNING sync_run_id, source_key
    `,
    [errorMessage]
  );

  return result.rows;
}

export async function finalizeSyncRun(client, syncRunId, { status, sourceVersion = '', summary = {}, errorMessage = '' }) {
  const result = await client.query(
    `
      UPDATE sync_runs
      SET
        status = $2,
        source_version = NULLIF($3, ''),
        summary_json = $4::jsonb,
        error_message = NULLIF($5, ''),
        completed_at = NOW()
      WHERE sync_run_id = $1
      RETURNING *
    `,
    [syncRunId, status, sourceVersion, JSON.stringify(summary), errorMessage]
  );
  return result.rows[0];
}

export async function updateSyncRunProgress(client, syncRunId, { sourceVersion = '', summary = {} }) {
  const result = await client.query(
    `
      UPDATE sync_runs
      SET
        source_version = COALESCE(NULLIF($2, ''), source_version),
        summary_json = $3::jsonb
      WHERE sync_run_id = $1
        AND status = 'running'
      RETURNING *
    `,
    [syncRunId, sourceVersion, JSON.stringify(summary)]
  );
  return result.rows[0];
}

export async function markSourceSyncState(client, sourceKey, syncRunId, sourceVersion, summary) {
  await client.query(
    `
      UPDATE source_sync_state
      SET
        last_successful_sync_run_id = $2,
        last_successful_at = NOW(),
        last_source_version = NULLIF($3, ''),
        last_summary = $4::jsonb,
        updated_at = NOW()
      WHERE source_key = $1
    `,
    [sourceKey, syncRunId, sourceVersion, JSON.stringify(summary)]
  );
}

export async function listSourcesWithState(client) {
  const result = await client.query(`
    SELECT
      s.source_key AS source_id,
      s.*,
      st.last_successful_sync_run_id,
      st.last_successful_at,
      st.last_source_version,
      st.last_summary
    FROM sources s
    LEFT JOIN source_sync_state st ON st.source_key = s.source_key
    ORDER BY s.source_key ASC
  `);
  return result.rows;
}

export async function getSourceByKey(client, sourceKey) {
  const result = await client.query(
    `
      SELECT
        s.source_key AS source_id,
        s.*
      FROM sources s
      WHERE s.source_key = $1
      LIMIT 1
    `,
    [sourceKey]
  );

  return result.rowCount ? result.rows[0] : null;
}

export async function updateSourceActivation(client, sourceKey, isActive) {
  const result = await client.query(
    `
      UPDATE sources
      SET
        is_active = $2,
        updated_at = NOW()
      WHERE source_key = $1
      RETURNING
        source_key AS source_id,
        *
    `,
    [sourceKey, isActive]
  );

  return result.rowCount ? result.rows[0] : null;
}

export async function listActiveSourceKeys(client, sourceKeys = []) {
  if (!sourceKeys.length) {
    const result = await client.query(
      `
        SELECT source_key
        FROM sources
        WHERE is_active = TRUE
        ORDER BY source_key ASC
      `
    );
    return result.rows.map((row) => row.source_key);
  }

  const result = await client.query(
    `
      SELECT source_key
      FROM sources
      WHERE source_key = ANY($1::TEXT[])
        AND is_active = TRUE
      ORDER BY source_key ASC
    `,
    [sourceKeys]
  );

  return result.rows.map((row) => row.source_key);
}

export async function listSyncRuns(client, { sourceKey = '', limit = 20 } = {}) {
  const cappedLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  if (sourceKey) {
    const result = await client.query(
      `
        SELECT *
        FROM sync_runs
        WHERE source_key = $1
        ORDER BY started_at DESC
        LIMIT $2
      `,
      [sourceKey, cappedLimit]
    );
    return result.rows;
  }

  const result = await client.query(
    `
      SELECT *
      FROM sync_runs
      ORDER BY started_at DESC
      LIMIT $1
    `,
    [cappedLimit]
  );
  return result.rows;
}

export async function listSuccessfulSourceKeys(client, sourceKeys = []) {
  if (!sourceKeys.length) {
    return [];
  }

  const result = await client.query(
    `
      SELECT source_key
      FROM source_sync_state
      WHERE source_key = ANY($1::TEXT[])
        AND last_successful_at IS NOT NULL
      ORDER BY source_key ASC
    `,
    [sourceKeys]
  );

  return result.rows.map((row) => row.source_key);
}

export async function getSyncRunById(client, syncRunId) {
  const result = await client.query(
    `
      SELECT *
      FROM sync_runs
      WHERE sync_run_id = $1
      LIMIT 1
    `,
    [syncRunId]
  );
  return result.rowCount ? result.rows[0] : null;
}

export async function supersedeRunningSyncRunsForSource(client, sourceKey, errorMessage) {
  const result = await client.query(
    `
      UPDATE sync_runs
      SET
        status = 'superseded',
        error_message = $2,
        completed_at = NOW()
      WHERE source_key = $1
        AND status = 'running'
      RETURNING sync_run_id
    `,
    [sourceKey, errorMessage]
  );
  return result.rows;
}

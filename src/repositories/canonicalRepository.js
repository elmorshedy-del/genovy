import { normalizeLabel } from '../lib/curies.js';

const CANONICAL_SEARCH_LIMIT_DEFAULT = 8;
const CANONICAL_SEARCH_LIMIT_MAX = 12;

export async function startCanonicalResolutionRun(client, { triggerMode = 'manual', requestedBy = '', strategyKey, options = {} }) {
  const result = await client.query(
    `
      INSERT INTO canonical_resolution_runs (
        status,
        trigger_mode,
        requested_by,
        strategy_key,
        options_json
      )
      VALUES ('running', $1, $2, $3, $4::jsonb)
      RETURNING canonical_resolution_run_id
    `,
    [triggerMode, requestedBy || null, strategyKey, JSON.stringify(options)]
  );

  return result.rows[0].canonical_resolution_run_id;
}

export async function completeCanonicalResolutionRun(client, canonicalResolutionRunId, summary) {
  await client.query(
    `
      UPDATE canonical_resolution_runs
      SET
        status = 'completed',
        completed_at = NOW(),
        summary_json = $2::jsonb,
        error_message = NULL
      WHERE canonical_resolution_run_id = $1
    `,
    [canonicalResolutionRunId, JSON.stringify(summary)]
  );
}

export async function failCanonicalResolutionRun(client, canonicalResolutionRunId, errorMessage) {
  await client.query(
    `
      UPDATE canonical_resolution_runs
      SET
        status = 'failed',
        completed_at = NOW(),
        error_message = $2
      WHERE canonical_resolution_run_id = $1
    `,
    [canonicalResolutionRunId, errorMessage]
  );
}

export async function listEntityRecordsForCanonicalization(client) {
  const result = await client.query(
    `
      SELECT
        e.entity_id,
        e.entity_type,
        e.canonical_curie,
        e.canonical_label,
        e.normalized_label,
        e.description,
        e.is_placeholder,
        COALESCE(
          jsonb_agg(DISTINCT x.xref_curie) FILTER (WHERE x.xref_curie IS NOT NULL),
          '[]'::jsonb
        ) AS xref_curies
      FROM entities e
      LEFT JOIN entity_xrefs x ON x.entity_id = e.entity_id
      GROUP BY
        e.entity_id,
        e.entity_type,
        e.canonical_curie,
        e.canonical_label,
        e.normalized_label,
        e.description,
        e.is_placeholder
      ORDER BY e.entity_id ASC
    `
  );

  return result.rows.map((row) => ({
    entityId: row.entity_id,
    entityType: row.entity_type,
    canonicalCurie: row.canonical_curie,
    canonicalLabel: row.canonical_label,
    normalizedLabel: row.normalized_label,
    description: row.description || '',
    isPlaceholder: Boolean(row.is_placeholder),
    xrefCuries: Array.isArray(row.xref_curies) ? row.xref_curies : []
  }));
}

export async function listEntityAliasesForCanonicalization(client) {
  const result = await client.query(
    `
      SELECT
        entity_id,
        alias_label,
        alias_type,
        source_key
      FROM entity_aliases
      ORDER BY entity_id ASC, alias_label ASC
    `
  );

  return result.rows.map((row) => ({
    entityId: row.entity_id,
    aliasLabel: row.alias_label,
    aliasType: row.alias_type,
    sourceKey: row.source_key || null
  }));
}

export async function clearCanonicalLayer(client) {
  await client.query(`
    TRUNCATE TABLE
      canonical_relationship_support,
      canonical_relationships,
      canonical_concept_aliases,
      canonical_concept_memberships,
      canonical_concepts
    RESTART IDENTITY
  `);
}

export async function insertCanonicalConcepts(client, concepts) {
  if (!concepts.length) {
    return [];
  }

  const result = await client.query(
    `
      INSERT INTO canonical_concepts (
        concept_type,
        canonical_key,
        preferred_entity_id,
        canonical_curie,
        canonical_label,
        normalized_label,
        resolution_strategy,
        confidence_score,
        metadata_json
      )
      SELECT
        value->>'conceptType' AS concept_type,
        value->>'canonicalKey' AS canonical_key,
        NULLIF(value->>'preferredEntityId', '')::BIGINT AS preferred_entity_id,
        NULLIF(value->>'canonicalCurie', '') AS canonical_curie,
        value->>'canonicalLabel' AS canonical_label,
        value->>'normalizedLabel' AS normalized_label,
        value->>'resolutionStrategy' AS resolution_strategy,
        NULLIF(value->>'confidenceScore', '')::NUMERIC(5,4) AS confidence_score,
        COALESCE(value->'metadata', '{}'::jsonb) AS metadata_json
      FROM jsonb_array_elements($1::jsonb) AS value
      RETURNING concept_id, canonical_key
    `,
    [JSON.stringify(concepts)]
  );

  return result.rows;
}

export async function insertCanonicalMemberships(client, memberships) {
  if (!memberships.length) {
    return;
  }

  await client.query(
    `
      INSERT INTO canonical_concept_memberships (
        concept_id,
        entity_id,
        membership_role,
        resolution_strategy,
        confidence_score,
        matched_on_json,
        source_resolution_run_id
      )
      SELECT
        (value->>'conceptId')::BIGINT AS concept_id,
        (value->>'entityId')::BIGINT AS entity_id,
        value->>'membershipRole' AS membership_role,
        value->>'resolutionStrategy' AS resolution_strategy,
        NULLIF(value->>'confidenceScore', '')::NUMERIC(5,4) AS confidence_score,
        COALESCE(value->'matchedOn', '{}'::jsonb) AS matched_on_json,
        NULLIF(value->>'sourceResolutionRunId', '')::BIGINT AS source_resolution_run_id
      FROM jsonb_array_elements($1::jsonb) AS value
    `,
    [JSON.stringify(memberships)]
  );
}

export async function insertCanonicalAliases(client, aliases) {
  if (!aliases.length) {
    return;
  }

  await client.query(
    `
      INSERT INTO canonical_concept_aliases (
        concept_id,
        alias_label,
        normalized_alias,
        alias_type,
        source_key
      )
      SELECT
        (value->>'conceptId')::BIGINT AS concept_id,
        value->>'aliasLabel' AS alias_label,
        value->>'normalizedAlias' AS normalized_alias,
        value->>'aliasType' AS alias_type,
        NULLIF(value->>'sourceKey', '') AS source_key
      FROM jsonb_array_elements($1::jsonb) AS value
      ON CONFLICT (concept_id, normalized_alias, alias_type)
      DO NOTHING
    `,
    [JSON.stringify(aliases)]
  );
}

export async function rebuildCanonicalRelationships(client) {
  await client.query(
    `
      WITH grouped AS (
        SELECT
          md5(
            sm.concept_id::TEXT
            || '|' || r.predicate_key
            || '|' || om.concept_id::TEXT
            || '|' || COALESCE(COALESCE(r.qualifiers_json, '{}'::jsonb)::TEXT, '{}'::TEXT)
          ) AS canonical_relationship_key,
          sm.concept_id AS subject_concept_id,
          r.predicate_key,
          om.concept_id AS object_concept_id,
          COALESCE(r.qualifiers_json, '{}'::jsonb) AS qualifiers_json,
          COUNT(*)::INTEGER AS source_relationship_count,
          jsonb_build_object(
            'supportingSourceKeys',
            COALESCE(
              jsonb_agg(DISTINCT r.primary_source_key) FILTER (WHERE r.primary_source_key IS NOT NULL),
              '[]'::jsonb
            )
          ) AS metadata_json
        FROM relationships r
        INNER JOIN canonical_concept_memberships sm ON sm.entity_id = r.subject_entity_id
        INNER JOIN canonical_concept_memberships om ON om.entity_id = r.object_entity_id
        GROUP BY
          sm.concept_id,
          r.predicate_key,
          om.concept_id,
          COALESCE(r.qualifiers_json, '{}'::jsonb)
      )
      INSERT INTO canonical_relationships (
        canonical_relationship_key,
        subject_concept_id,
        predicate_key,
        object_concept_id,
        qualifiers_json,
        source_relationship_count,
        metadata_json
      )
      SELECT
        canonical_relationship_key,
        subject_concept_id,
        predicate_key,
        object_concept_id,
        qualifiers_json,
        source_relationship_count,
        metadata_json
      FROM grouped
    `
  );

  await client.query(
    `
      INSERT INTO canonical_relationship_support (
        canonical_relationship_id,
        relationship_id
      )
      SELECT
        cr.canonical_relationship_id,
        r.relationship_id
      FROM relationships r
      INNER JOIN canonical_concept_memberships sm ON sm.entity_id = r.subject_entity_id
      INNER JOIN canonical_concept_memberships om ON om.entity_id = r.object_entity_id
      INNER JOIN canonical_relationships cr
        ON cr.canonical_relationship_key = md5(
          sm.concept_id::TEXT
          || '|' || r.predicate_key
          || '|' || om.concept_id::TEXT
          || '|' || COALESCE(COALESCE(r.qualifiers_json, '{}'::jsonb)::TEXT, '{}'::TEXT)
        )
    `
  );
}

export async function listCanonicalSummary(client) {
  const concepts = await client.query(`
    SELECT
      c.concept_type,
      COUNT(*)::INTEGER AS concept_count,
      COUNT(m.entity_id)::INTEGER AS member_count
    FROM canonical_concepts c
    LEFT JOIN canonical_concept_memberships m ON m.concept_id = c.concept_id
    GROUP BY c.concept_type
    ORDER BY c.concept_type ASC
  `);

  const relationships = await client.query(`
    SELECT
      predicate_key,
      COUNT(*)::INTEGER AS count
    FROM canonical_relationships
    GROUP BY predicate_key
    ORDER BY predicate_key ASC
  `);

  const latestRun = await client.query(`
    SELECT
      canonical_resolution_run_id,
      status,
      trigger_mode,
      requested_by,
      strategy_key,
      started_at,
      completed_at,
      summary_json
    FROM canonical_resolution_runs
    ORDER BY canonical_resolution_run_id DESC
    LIMIT 1
  `);

  return {
    concepts: concepts.rows,
    relationships: relationships.rows,
    latestRun: latestRun.rows[0] || null
  };
}

export async function searchCanonicalConcepts(
  client,
  { query, conceptType = '', limit = CANONICAL_SEARCH_LIMIT_DEFAULT }
) {
  const rawQuery = String(query || '').trim();
  const normalizedQuery = normalizeLabel(rawQuery);
  if (!rawQuery || !normalizedQuery) {
    return [];
  }

  const normalizedConceptType = String(conceptType || '').trim();
  const cappedLimit = Math.max(1, Math.min(CANONICAL_SEARCH_LIMIT_MAX, Number(limit) || CANONICAL_SEARCH_LIMIT_DEFAULT));
  const normalizedPrefix = `${normalizedQuery}%`;
  const normalizedContains = `%${normalizedQuery}%`;

  const result = await client.query(
    `
      WITH candidate_matches AS (
        SELECT
          c.concept_id,
          CASE
            WHEN c.normalized_label = $2 THEN 110
            WHEN c.normalized_label LIKE $3 THEN 100
            WHEN c.normalized_label LIKE $4 THEN 80
            ELSE 0
          END AS match_rank
        FROM canonical_concepts c
        WHERE ($1 = '' OR c.concept_type = $1)
          AND (
            c.normalized_label = $2
            OR c.normalized_label LIKE $3
            OR c.normalized_label LIKE $4
          )

        UNION ALL

        SELECT
          c.concept_id,
          CASE
            WHEN a.normalized_alias = $2 THEN 105
            WHEN a.normalized_alias LIKE $3 THEN 95
            WHEN a.normalized_alias LIKE $4 THEN 75
            ELSE 0
          END AS match_rank
        FROM canonical_concept_aliases a
        INNER JOIN canonical_concepts c ON c.concept_id = a.concept_id
        WHERE ($1 = '' OR c.concept_type = $1)
          AND (
            a.normalized_alias = $2
            OR a.normalized_alias LIKE $3
            OR a.normalized_alias LIKE $4
          )
      ),
      ranked AS (
        SELECT concept_id, MAX(match_rank)::INTEGER AS match_rank
        FROM candidate_matches
        GROUP BY concept_id
      )
      SELECT
        c.concept_id,
        c.concept_type,
        c.canonical_key,
        c.canonical_curie,
        c.canonical_label,
        c.confidence_score,
        c.resolution_strategy,
        r.match_rank,
        (
          SELECT COUNT(*)::INTEGER
          FROM canonical_concept_memberships m
          WHERE m.concept_id = c.concept_id
        ) AS member_count,
        (
          SELECT COUNT(*)::INTEGER
          FROM canonical_relationships rel
          WHERE rel.subject_concept_id = c.concept_id
        ) AS outbound_count,
        (
          SELECT COUNT(*)::INTEGER
          FROM canonical_relationships rel
          WHERE rel.object_concept_id = c.concept_id
        ) AS inbound_count
      FROM ranked r
      INNER JOIN canonical_concepts c ON c.concept_id = r.concept_id
      ORDER BY
        r.match_rank DESC,
        c.canonical_label ASC
      LIMIT $5
    `,
    [normalizedConceptType, normalizedQuery, normalizedPrefix, normalizedContains, cappedLimit]
  );

  return result.rows;
}

export async function getCanonicalConceptDetail(client, conceptId) {
  const concept = await client.query(
    `
      SELECT
        c.*,
        pe.entity_type AS preferred_entity_type,
        pe.canonical_curie AS preferred_entity_curie,
        pe.canonical_label AS preferred_entity_label
      FROM canonical_concepts c
      LEFT JOIN entities pe ON pe.entity_id = c.preferred_entity_id
      WHERE c.concept_id = $1
      LIMIT 1
    `,
    [conceptId]
  );
  if (!concept.rowCount) {
    return null;
  }

  const aliases = await client.query(
    `
      SELECT alias_label, alias_type, source_key
      FROM canonical_concept_aliases
      WHERE concept_id = $1
      ORDER BY alias_label ASC
      LIMIT 250
    `,
    [conceptId]
  );

  const members = await client.query(
    `
      SELECT
        m.entity_id,
        e.entity_type,
        e.canonical_curie,
        e.canonical_label,
        e.is_placeholder,
        m.membership_role,
        m.resolution_strategy,
        m.confidence_score,
        m.matched_on_json
      FROM canonical_concept_memberships m
      INNER JOIN entities e ON e.entity_id = m.entity_id
      WHERE m.concept_id = $1
      ORDER BY
        CASE WHEN m.membership_role = 'preferred' THEN 0 ELSE 1 END,
        e.canonical_label ASC
      LIMIT 100
    `,
    [conceptId]
  );

  const xrefs = await client.query(
    `
      SELECT DISTINCT
        x.xref_curie,
        x.xref_type,
        x.source_key
      FROM canonical_concept_memberships m
      INNER JOIN entity_xrefs x ON x.entity_id = m.entity_id
      WHERE m.concept_id = $1
      ORDER BY x.xref_curie ASC
      LIMIT 250
    `,
    [conceptId]
  );

  const outbound = await client.query(
    `
      SELECT
        r.predicate_key,
        r.source_relationship_count,
        target.concept_id AS object_concept_id,
        target.canonical_label AS object_label,
        target.canonical_curie AS object_curie
      FROM canonical_relationships r
      INNER JOIN canonical_concepts target ON target.concept_id = r.object_concept_id
      WHERE r.subject_concept_id = $1
      ORDER BY r.source_relationship_count DESC, target.canonical_label ASC
      LIMIT 100
    `,
    [conceptId]
  );

  const inbound = await client.query(
    `
      SELECT
        r.predicate_key,
        r.source_relationship_count,
        source.concept_id AS subject_concept_id,
        source.canonical_label AS subject_label,
        source.canonical_curie AS subject_curie
      FROM canonical_relationships r
      INNER JOIN canonical_concepts source ON source.concept_id = r.subject_concept_id
      WHERE r.object_concept_id = $1
      ORDER BY r.source_relationship_count DESC, source.canonical_label ASC
      LIMIT 100
    `,
    [conceptId]
  );

  return {
    concept: concept.rows[0],
    aliases: aliases.rows,
    xrefs: xrefs.rows,
    members: members.rows,
    outboundRelationships: outbound.rows,
    inboundRelationships: inbound.rows
  };
}

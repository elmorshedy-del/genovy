CREATE TABLE IF NOT EXISTS schema_migrations (
  migration_name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sources (
  source_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  homepage_url TEXT,
  access_url TEXT,
  update_frequency TEXT,
  entity_scope TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_runs (
  sync_run_id BIGSERIAL PRIMARY KEY,
  source_key TEXT NOT NULL REFERENCES sources(source_key) ON DELETE CASCADE,
  status TEXT NOT NULL,
  trigger_mode TEXT NOT NULL DEFAULT 'manual',
  requested_by TEXT,
  options_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_version TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_runs_source_started
  ON sync_runs(source_key, started_at DESC);

CREATE TABLE IF NOT EXISTS source_sync_state (
  source_key TEXT PRIMARY KEY REFERENCES sources(source_key) ON DELETE CASCADE,
  last_successful_sync_run_id BIGINT REFERENCES sync_runs(sync_run_id),
  last_successful_at TIMESTAMPTZ,
  last_source_version TEXT,
  last_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  cursor_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entities (
  entity_id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  canonical_curie TEXT NOT NULL UNIQUE,
  canonical_label TEXT NOT NULL,
  normalized_label TEXT NOT NULL,
  description TEXT,
  primary_source_key TEXT REFERENCES sources(source_key),
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_placeholder BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entities_type_label
  ON entities(entity_type, normalized_label);

CREATE TABLE IF NOT EXISTS entity_aliases (
  entity_alias_id BIGSERIAL PRIMARY KEY,
  entity_id BIGINT NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
  alias_label TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  alias_type TEXT NOT NULL DEFAULT 'synonym',
  source_key TEXT REFERENCES sources(source_key),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entity_id, normalized_alias, alias_type)
);

CREATE INDEX IF NOT EXISTS idx_entity_aliases_normalized
  ON entity_aliases(normalized_alias);

CREATE TABLE IF NOT EXISTS entity_xrefs (
  entity_xref_id BIGSERIAL PRIMARY KEY,
  entity_id BIGINT NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
  xref_curie TEXT NOT NULL,
  source_key TEXT REFERENCES sources(source_key),
  xref_type TEXT NOT NULL DEFAULT 'cross_reference',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entity_id, xref_curie)
);

CREATE INDEX IF NOT EXISTS idx_entity_xrefs_curie
  ON entity_xrefs(xref_curie);

CREATE TABLE IF NOT EXISTS relationships (
  relationship_id BIGSERIAL PRIMARY KEY,
  relationship_key TEXT NOT NULL UNIQUE,
  subject_entity_id BIGINT NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
  predicate_key TEXT NOT NULL,
  object_entity_id BIGINT NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
  qualifiers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  primary_source_key TEXT REFERENCES sources(source_key),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relationships_subject_predicate
  ON relationships(subject_entity_id, predicate_key);

CREATE INDEX IF NOT EXISTS idx_relationships_object_predicate
  ON relationships(object_entity_id, predicate_key);

CREATE TABLE IF NOT EXISTS relationship_evidence (
  relationship_evidence_id BIGSERIAL PRIMARY KEY,
  relationship_id BIGINT NOT NULL REFERENCES relationships(relationship_id) ON DELETE CASCADE,
  source_key TEXT NOT NULL REFERENCES sources(source_key) ON DELETE CASCADE,
  sync_run_id BIGINT REFERENCES sync_runs(sync_run_id) ON DELETE SET NULL,
  source_record_key TEXT,
  evidence_type TEXT NOT NULL,
  evidence_code TEXT,
  confidence_score NUMERIC(5,4),
  provenance_url TEXT,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(relationship_id, source_key, source_record_key, evidence_type, evidence_code)
);

CREATE INDEX IF NOT EXISTS idx_relationship_evidence_relationship
  ON relationship_evidence(relationship_id, source_key);

CREATE TABLE IF NOT EXISTS source_records (
  source_record_id BIGSERIAL PRIMARY KEY,
  source_key TEXT NOT NULL REFERENCES sources(source_key) ON DELETE CASCADE,
  sync_run_id BIGINT REFERENCES sync_runs(sync_run_id) ON DELETE SET NULL,
  record_type TEXT NOT NULL,
  source_record_key TEXT NOT NULL,
  canonical_curie TEXT,
  payload_json JSONB NOT NULL,
  payload_hash TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_key, source_record_key)
);

CREATE INDEX IF NOT EXISTS idx_source_records_curie
  ON source_records(canonical_curie);

CREATE TABLE IF NOT EXISTS canonical_resolution_runs (
  canonical_resolution_run_id BIGSERIAL PRIMARY KEY,
  status TEXT NOT NULL,
  trigger_mode TEXT NOT NULL DEFAULT 'manual',
  requested_by TEXT,
  strategy_key TEXT NOT NULL DEFAULT 'exact_identifier_v1',
  options_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_canonical_resolution_runs_started
  ON canonical_resolution_runs(started_at DESC);

CREATE TABLE IF NOT EXISTS canonical_concepts (
  concept_id BIGSERIAL PRIMARY KEY,
  concept_type TEXT NOT NULL,
  canonical_key TEXT NOT NULL UNIQUE,
  preferred_entity_id BIGINT REFERENCES entities(entity_id) ON DELETE SET NULL,
  canonical_curie TEXT,
  canonical_label TEXT NOT NULL,
  normalized_label TEXT NOT NULL,
  resolution_strategy TEXT NOT NULL,
  confidence_score NUMERIC(5,4),
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canonical_concepts_type_label
  ON canonical_concepts(concept_type, normalized_label);

CREATE INDEX IF NOT EXISTS idx_canonical_concepts_preferred_entity
  ON canonical_concepts(preferred_entity_id);

CREATE TABLE IF NOT EXISTS canonical_concept_memberships (
  concept_membership_id BIGSERIAL PRIMARY KEY,
  concept_id BIGINT NOT NULL REFERENCES canonical_concepts(concept_id) ON DELETE CASCADE,
  entity_id BIGINT NOT NULL UNIQUE REFERENCES entities(entity_id) ON DELETE CASCADE,
  membership_role TEXT NOT NULL DEFAULT 'member',
  resolution_strategy TEXT NOT NULL,
  confidence_score NUMERIC(5,4),
  matched_on_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_resolution_run_id BIGINT REFERENCES canonical_resolution_runs(canonical_resolution_run_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(concept_id, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_canonical_memberships_concept
  ON canonical_concept_memberships(concept_id);

CREATE TABLE IF NOT EXISTS canonical_concept_aliases (
  canonical_concept_alias_id BIGSERIAL PRIMARY KEY,
  concept_id BIGINT NOT NULL REFERENCES canonical_concepts(concept_id) ON DELETE CASCADE,
  alias_label TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  alias_type TEXT NOT NULL DEFAULT 'aggregated',
  source_key TEXT REFERENCES sources(source_key),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(concept_id, normalized_alias, alias_type)
);

CREATE INDEX IF NOT EXISTS idx_canonical_aliases_normalized
  ON canonical_concept_aliases(normalized_alias);

CREATE TABLE IF NOT EXISTS canonical_relationships (
  canonical_relationship_id BIGSERIAL PRIMARY KEY,
  canonical_relationship_key TEXT NOT NULL UNIQUE,
  subject_concept_id BIGINT NOT NULL REFERENCES canonical_concepts(concept_id) ON DELETE CASCADE,
  predicate_key TEXT NOT NULL,
  object_concept_id BIGINT NOT NULL REFERENCES canonical_concepts(concept_id) ON DELETE CASCADE,
  qualifiers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_relationship_count INTEGER NOT NULL DEFAULT 0,
  confidence_score NUMERIC(5,4),
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canonical_relationships_subject_predicate
  ON canonical_relationships(subject_concept_id, predicate_key);

CREATE INDEX IF NOT EXISTS idx_canonical_relationships_object_predicate
  ON canonical_relationships(object_concept_id, predicate_key);

CREATE TABLE IF NOT EXISTS canonical_relationship_support (
  canonical_relationship_support_id BIGSERIAL PRIMARY KEY,
  canonical_relationship_id BIGINT NOT NULL REFERENCES canonical_relationships(canonical_relationship_id) ON DELETE CASCADE,
  relationship_id BIGINT NOT NULL REFERENCES relationships(relationship_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(canonical_relationship_id, relationship_id)
);

CREATE INDEX IF NOT EXISTS idx_canonical_relationship_support_relationship
  ON canonical_relationship_support(relationship_id);

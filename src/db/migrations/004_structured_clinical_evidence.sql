CREATE TABLE IF NOT EXISTS clinical_phenotype_assertions (
  clinical_phenotype_assertion_id BIGSERIAL PRIMARY KEY,
  subject_entity_id BIGINT NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
  phenotype_entity_id BIGINT NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
  presence_status TEXT NOT NULL CHECK (presence_status IN ('present', 'absent')),
  source_key TEXT NOT NULL REFERENCES sources(source_key) ON DELETE CASCADE,
  sync_run_id BIGINT REFERENCES sync_runs(sync_run_id) ON DELETE SET NULL,
  source_record_key TEXT NOT NULL,
  evidence_code TEXT,
  confidence_score NUMERIC(5,4),
  onset_entity_id BIGINT REFERENCES entities(entity_id) ON DELETE SET NULL,
  frequency_entity_id BIGINT REFERENCES entities(entity_id) ON DELETE SET NULL,
  modifier_entity_id BIGINT REFERENCES entities(entity_id) ON DELETE SET NULL,
  sex TEXT,
  aspect TEXT,
  reference_text TEXT,
  provenance_url TEXT,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_key, source_record_key, subject_entity_id, phenotype_entity_id, presence_status)
);

CREATE INDEX IF NOT EXISTS idx_clinical_phenotype_assertions_subject
  ON clinical_phenotype_assertions(subject_entity_id, presence_status);

CREATE INDEX IF NOT EXISTS idx_clinical_phenotype_assertions_phenotype
  ON clinical_phenotype_assertions(phenotype_entity_id, presence_status);

CREATE TABLE IF NOT EXISTS clinical_natural_history_assertions (
  clinical_natural_history_assertion_id BIGSERIAL PRIMARY KEY,
  disease_entity_id BIGINT NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
  source_key TEXT NOT NULL REFERENCES sources(source_key) ON DELETE CASCADE,
  sync_run_id BIGINT REFERENCES sync_runs(sync_run_id) ON DELETE SET NULL,
  source_record_key TEXT NOT NULL,
  validation_status TEXT,
  expert_link TEXT,
  source_text TEXT,
  provenance_url TEXT,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_key, source_record_key, disease_entity_id)
);

CREATE INDEX IF NOT EXISTS idx_clinical_natural_history_disease
  ON clinical_natural_history_assertions(disease_entity_id);

CREATE TABLE IF NOT EXISTS clinical_natural_history_terms (
  clinical_natural_history_term_id BIGSERIAL PRIMARY KEY,
  clinical_natural_history_assertion_id BIGINT NOT NULL REFERENCES clinical_natural_history_assertions(clinical_natural_history_assertion_id) ON DELETE CASCADE,
  term_role TEXT NOT NULL CHECK (
    term_role IN (
      'average_age_of_onset',
      'average_age_of_diagnosis',
      'average_age_of_death',
      'inheritance_mode'
    )
  ),
  term_entity_id BIGINT REFERENCES entities(entity_id) ON DELETE SET NULL,
  term_label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(clinical_natural_history_assertion_id, term_role, term_label)
);

CREATE INDEX IF NOT EXISTS idx_clinical_natural_history_terms_assertion
  ON clinical_natural_history_terms(clinical_natural_history_assertion_id, term_role, sort_order);

CREATE TABLE IF NOT EXISTS clinical_gene_disease_validity_assertions (
  clinical_gene_disease_validity_assertion_id BIGSERIAL PRIMARY KEY,
  gene_entity_id BIGINT NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
  disease_entity_id BIGINT NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
  source_key TEXT NOT NULL REFERENCES sources(source_key) ON DELETE CASCADE,
  sync_run_id BIGINT REFERENCES sync_runs(sync_run_id) ON DELETE SET NULL,
  source_record_key TEXT NOT NULL,
  classification TEXT NOT NULL,
  mode_of_inheritance TEXT,
  curation_sop TEXT,
  classification_date DATE,
  gcep TEXT,
  online_report_url TEXT,
  provenance_url TEXT,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_key, source_record_key, gene_entity_id, disease_entity_id, classification)
);

CREATE INDEX IF NOT EXISTS idx_clinical_gene_disease_validity_gene
  ON clinical_gene_disease_validity_assertions(gene_entity_id, classification);

CREATE INDEX IF NOT EXISTS idx_clinical_gene_disease_validity_disease
  ON clinical_gene_disease_validity_assertions(disease_entity_id, classification);

CREATE TABLE IF NOT EXISTS clinical_variant_disease_assertions (
  clinical_variant_disease_assertion_id BIGSERIAL PRIMARY KEY,
  variant_entity_id BIGINT NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
  disease_entity_id BIGINT NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
  gene_entity_id BIGINT REFERENCES entities(entity_id) ON DELETE SET NULL,
  source_key TEXT NOT NULL REFERENCES sources(source_key) ON DELETE CASCADE,
  sync_run_id BIGINT REFERENCES sync_runs(sync_run_id) ON DELETE SET NULL,
  source_record_key TEXT NOT NULL,
  allele_id TEXT,
  variation_id TEXT,
  variant_name TEXT,
  variation_type TEXT,
  clinical_significance TEXT,
  clinical_significance_simple INTEGER,
  review_status TEXT,
  number_submitters INTEGER,
  origin TEXT,
  origin_simple TEXT,
  assembly TEXT,
  last_evaluated DATE,
  rcv_accession TEXT,
  phenotype_ids TEXT,
  phenotype_list TEXT,
  provenance_url TEXT,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_key, source_record_key, variant_entity_id, disease_entity_id, assembly)
);

CREATE INDEX IF NOT EXISTS idx_clinical_variant_disease_variant
  ON clinical_variant_disease_assertions(variant_entity_id, clinical_significance);

CREATE INDEX IF NOT EXISTS idx_clinical_variant_disease_disease
  ON clinical_variant_disease_assertions(disease_entity_id, clinical_significance);

CREATE INDEX IF NOT EXISTS idx_clinical_variant_disease_gene
  ON clinical_variant_disease_assertions(gene_entity_id, clinical_significance);

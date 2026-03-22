DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.clinical_variant_disease_assertions'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.clinical_variant_disease_assertions
      ADD CONSTRAINT clinical_variant_disease_assertions_pkey
      PRIMARY KEY (clinical_variant_disease_assertion_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.clinical_variant_disease_assertions'::regclass
      AND conname = 'clinical_variant_disease_as_source_key_source_record_key__key'
  ) THEN
    ALTER TABLE public.clinical_variant_disease_assertions
      ADD CONSTRAINT clinical_variant_disease_as_source_key_source_record_key__key
      UNIQUE (source_key, source_record_key, variant_entity_id, disease_entity_id, assembly);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clinical_variant_disease_variant
  ON public.clinical_variant_disease_assertions(variant_entity_id, clinical_significance);

CREATE INDEX IF NOT EXISTS idx_clinical_variant_disease_disease
  ON public.clinical_variant_disease_assertions(disease_entity_id, clinical_significance);

CREATE INDEX IF NOT EXISTS idx_clinical_variant_disease_gene
  ON public.clinical_variant_disease_assertions(gene_entity_id, clinical_significance);

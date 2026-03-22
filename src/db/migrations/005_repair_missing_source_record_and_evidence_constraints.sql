DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.source_records'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.source_records
      ADD CONSTRAINT source_records_pkey PRIMARY KEY (source_record_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.source_records'::regclass
      AND conname = 'source_records_source_key_source_record_key_key'
  ) THEN
    ALTER TABLE public.source_records
      ADD CONSTRAINT source_records_source_key_source_record_key_key
      UNIQUE (source_key, source_record_key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_source_records_curie
  ON public.source_records(canonical_curie);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.relationship_evidence'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.relationship_evidence
      ADD CONSTRAINT relationship_evidence_pkey PRIMARY KEY (relationship_evidence_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.relationship_evidence'::regclass
      AND conname = 'relationship_evidence_relationship_id_source_key_source_reco_key'
  ) THEN
    ALTER TABLE public.relationship_evidence
      ADD CONSTRAINT relationship_evidence_relationship_id_source_key_source_reco_key
      UNIQUE (relationship_id, source_key, source_record_key, evidence_type, evidence_code);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_relationship_evidence_relationship
  ON public.relationship_evidence(relationship_id, source_key);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.relationships'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.relationships
      ADD CONSTRAINT relationships_pkey PRIMARY KEY (relationship_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.relationships'::regclass
      AND conname = 'relationships_relationship_key_key'
  ) THEN
    ALTER TABLE public.relationships
      ADD CONSTRAINT relationships_relationship_key_key
      UNIQUE (relationship_key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_relationships_subject_predicate
  ON public.relationships(subject_entity_id, predicate_key);

CREATE INDEX IF NOT EXISTS idx_relationships_object_predicate
  ON public.relationships(object_entity_id, predicate_key);

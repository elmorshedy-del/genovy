DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.entity_xrefs'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.entity_xrefs
      ADD CONSTRAINT entity_xrefs_pkey PRIMARY KEY (entity_xref_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.entity_xrefs'::regclass
      AND conname = 'entity_xrefs_entity_id_xref_curie_key'
  ) THEN
    ALTER TABLE public.entity_xrefs
      ADD CONSTRAINT entity_xrefs_entity_id_xref_curie_key
      UNIQUE (entity_id, xref_curie);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_entity_xrefs_curie
  ON public.entity_xrefs(xref_curie);

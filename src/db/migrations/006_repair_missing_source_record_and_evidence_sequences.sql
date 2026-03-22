CREATE SEQUENCE IF NOT EXISTS public.source_records_source_record_id_seq;

ALTER SEQUENCE public.source_records_source_record_id_seq
  OWNED BY public.source_records.source_record_id;

ALTER TABLE public.source_records
  ALTER COLUMN source_record_id
  SET DEFAULT nextval('public.source_records_source_record_id_seq');

SELECT setval(
  'public.source_records_source_record_id_seq',
  COALESCE((SELECT MAX(source_record_id) FROM public.source_records), 0) + 1,
  false
);

CREATE SEQUENCE IF NOT EXISTS public.relationship_evidence_relationship_evidence_id_seq;

ALTER SEQUENCE public.relationship_evidence_relationship_evidence_id_seq
  OWNED BY public.relationship_evidence.relationship_evidence_id;

ALTER TABLE public.relationship_evidence
  ALTER COLUMN relationship_evidence_id
  SET DEFAULT nextval('public.relationship_evidence_relationship_evidence_id_seq');

SELECT setval(
  'public.relationship_evidence_relationship_evidence_id_seq',
  COALESCE((SELECT MAX(relationship_evidence_id) FROM public.relationship_evidence), 0) + 1,
  false
);

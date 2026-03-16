CREATE INDEX IF NOT EXISTS idx_canonical_relationships_predicate_subject_object
  ON canonical_relationships(predicate_key, subject_concept_id, object_concept_id);

CREATE INDEX IF NOT EXISTS idx_canonical_relationships_predicate_object_subject
  ON canonical_relationships(predicate_key, object_concept_id, subject_concept_id);

DO $$
DECLARE
  entry RECORD;
  qualified_table TEXT;
  sequence_name TEXT;
BEGIN
  FOR entry IN
    SELECT *
    FROM (
      VALUES
        ('entities', 'entity_id'),
        ('entity_aliases', 'entity_alias_id'),
        ('entity_xrefs', 'entity_xref_id'),
        ('relationships', 'relationship_id'),
        ('relationship_evidence', 'relationship_evidence_id'),
        ('source_records', 'source_record_id'),
        ('sync_runs', 'sync_run_id'),
        ('clinical_phenotype_assertions', 'clinical_phenotype_assertion_id'),
        ('clinical_natural_history_assertions', 'clinical_natural_history_assertion_id'),
        ('clinical_natural_history_terms', 'clinical_natural_history_term_id'),
        ('clinical_gene_disease_validity_assertions', 'clinical_gene_disease_validity_assertion_id'),
        ('clinical_variant_disease_assertions', 'clinical_variant_disease_assertion_id')
    ) AS rows(table_name, column_name)
  LOOP
    qualified_table := format('public.%I', entry.table_name);
    IF to_regclass(qualified_table) IS NULL THEN
      CONTINUE;
    END IF;

    sequence_name := pg_get_serial_sequence(qualified_table, entry.column_name);
    IF sequence_name IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format(
      'SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %s), 0) + 1, false)',
      sequence_name,
      entry.column_name,
      qualified_table
    );
  END LOOP;
END $$;

async function loadTypedPhenotypeRows(client) {
  const result = await client.query(
    `
      SELECT DISTINCT ON (disease.entity_id, phenotype.entity_id)
        disease.entity_id AS disease_entity_id,
        disease.canonical_curie AS disease_curie,
        disease.canonical_label AS disease_label,
        phenotype.entity_id AS phenotype_entity_id,
        phenotype.canonical_curie AS phenotype_curie,
        phenotype.canonical_label AS phenotype_label,
        clinical_phenotype_assertions.reference_text AS reference_text,
        clinical_phenotype_assertions.evidence_code AS evidence_code
      FROM clinical_phenotype_assertions
      INNER JOIN entities disease
        ON disease.entity_id = clinical_phenotype_assertions.subject_entity_id
      INNER JOIN entities phenotype
        ON phenotype.entity_id = clinical_phenotype_assertions.phenotype_entity_id
      WHERE disease.entity_type = 'disease'
        AND disease.is_placeholder = FALSE
        AND clinical_phenotype_assertions.presence_status = 'present'
      ORDER BY disease.entity_id, phenotype.entity_id, clinical_phenotype_assertions.observed_at DESC
    `
  );

  return result.rows;
}

async function loadCanonicalGenePhenotypeRows(client) {
  const result = await client.query(
    `
      SELECT DISTINCT ON (gene.concept_id, phenotype.entity_id)
        gene.concept_id AS gene_entity_id,
        COALESCE(gene.canonical_curie, preferred_entity.canonical_curie, gene.canonical_label) AS gene_curie,
        gene.canonical_label AS gene_label,
        phenotype.entity_id AS phenotype_entity_id,
        phenotype.canonical_curie AS phenotype_curie,
        phenotype.canonical_label AS phenotype_label,
        COALESCE(evidence.payload_json->>'disease_id', '') AS reference_context,
        COALESCE(evidence.evidence_code, '') AS evidence_code
      FROM canonical_concepts gene
      INNER JOIN canonical_concept_memberships membership
        ON membership.concept_id = gene.concept_id
      INNER JOIN relationships rel
        ON rel.subject_entity_id = membership.entity_id
      INNER JOIN entities phenotype
        ON phenotype.entity_id = rel.object_entity_id
      LEFT JOIN entities preferred_entity
        ON preferred_entity.entity_id = gene.preferred_entity_id
      LEFT JOIN LATERAL (
        SELECT
          relationship_evidence.evidence_code,
          relationship_evidence.payload_json,
          relationship_evidence.observed_at
        FROM relationship_evidence
        WHERE relationship_evidence.relationship_id = rel.relationship_id
        ORDER BY relationship_evidence.observed_at DESC
        LIMIT 1
      ) AS evidence
        ON TRUE
      WHERE gene.concept_type = 'gene'
        AND rel.predicate_key = 'associated_with_phenotype'
        AND phenotype.entity_type = 'phenotype'
      ORDER BY gene.concept_id, phenotype.entity_id, evidence.observed_at DESC NULLS LAST
    `
  );

  return result.rows;
}

async function loadCanonicalGeneDiseaseSupportRows(client) {
  const result = await client.query(
    `
      SELECT DISTINCT ON (gene.concept_id, disease.entity_id)
        gene.concept_id AS gene_entity_id,
        COALESCE(gene.canonical_curie, preferred_entity.canonical_curie, gene.canonical_label) AS gene_curie,
        gene.canonical_label AS gene_label,
        disease.entity_id AS disease_entity_id,
        disease.canonical_curie AS disease_curie,
        disease.canonical_label AS disease_label,
        COALESCE(validity.classification, '') AS classification,
        COALESCE(validity.mode_of_inheritance, '') AS mode_of_inheritance,
        COALESCE(evidence.evidence_code, '') AS evidence_code
      FROM canonical_concepts gene
      INNER JOIN canonical_concept_memberships membership
        ON membership.concept_id = gene.concept_id
      INNER JOIN relationships rel
        ON rel.subject_entity_id = membership.entity_id
      INNER JOIN entities disease
        ON disease.entity_id = rel.object_entity_id
      LEFT JOIN entities preferred_entity
        ON preferred_entity.entity_id = gene.preferred_entity_id
      LEFT JOIN LATERAL (
        SELECT
          relationship_evidence.evidence_code,
          relationship_evidence.observed_at
        FROM relationship_evidence
        WHERE relationship_evidence.relationship_id = rel.relationship_id
        ORDER BY relationship_evidence.observed_at DESC
        LIMIT 1
      ) AS evidence
        ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          clinical_gene_disease_validity_assertions.classification,
          clinical_gene_disease_validity_assertions.mode_of_inheritance,
          clinical_gene_disease_validity_assertions.classification_date,
          clinical_gene_disease_validity_assertions.observed_at
        FROM clinical_gene_disease_validity_assertions
        INNER JOIN canonical_concept_memberships validity_membership
          ON validity_membership.entity_id = clinical_gene_disease_validity_assertions.gene_entity_id
        WHERE validity_membership.concept_id = gene.concept_id
          AND clinical_gene_disease_validity_assertions.disease_entity_id = disease.entity_id
        ORDER BY clinical_gene_disease_validity_assertions.classification_date DESC NULLS LAST,
          clinical_gene_disease_validity_assertions.observed_at DESC
        LIMIT 1
      ) AS validity
        ON TRUE
      WHERE gene.concept_type = 'gene'
        AND rel.predicate_key = 'associated_with_disease'
        AND disease.entity_type = 'disease'
        AND disease.is_placeholder = FALSE
      ORDER BY gene.concept_id, disease.entity_id,
        CASE COALESCE(validity.classification, '')
          WHEN 'Definitive' THEN 7
          WHEN 'Strong' THEN 6
          WHEN 'Moderate' THEN 5
          WHEN 'Limited' THEN 4
          WHEN 'Disputed' THEN 2
          WHEN 'Refuted' THEN 1
          ELSE 3
        END DESC,
        evidence.observed_at DESC NULLS LAST
    `
  );

  return result.rows;
}

async function loadFallbackPhenotypeRows(client) {
  const result = await client.query(
    `
      SELECT DISTINCT ON (disease.entity_id, phenotype.entity_id)
        disease.entity_id AS disease_entity_id,
        disease.canonical_curie AS disease_curie,
        disease.canonical_label AS disease_label,
        phenotype.entity_id AS phenotype_entity_id,
        phenotype.canonical_curie AS phenotype_curie,
        phenotype.canonical_label AS phenotype_label,
        COALESCE(evidence.payload_json->>'reference', '') AS reference_text,
        COALESCE(evidence.evidence_code, '') AS evidence_code
      FROM relationships rel
      INNER JOIN entities disease
        ON disease.entity_id = rel.subject_entity_id
      INNER JOIN entities phenotype
        ON phenotype.entity_id = rel.object_entity_id
      LEFT JOIN LATERAL (
        SELECT
          relationship_evidence.evidence_code,
          relationship_evidence.payload_json,
          relationship_evidence.observed_at
        FROM relationship_evidence
        WHERE relationship_evidence.relationship_id = rel.relationship_id
        ORDER BY relationship_evidence.observed_at DESC
        LIMIT 1
      ) AS evidence
        ON TRUE
      WHERE rel.predicate_key = 'has_phenotype'
        AND disease.entity_type = 'disease'
        AND disease.is_placeholder = FALSE
        AND phenotype.entity_type = 'phenotype'
      ORDER BY disease.entity_id, phenotype.entity_id, evidence.observed_at DESC NULLS LAST
    `
  );

  return result.rows;
}

export async function loadDxDiseasePhenotypeRows(client) {
  try {
    const typedRows = await loadTypedPhenotypeRows(client);
    if (typedRows.length) {
      return {
        sourceMode: 'typed_assertions',
        rows: typedRows
      };
    }
  } catch (error) {
    if (!['42P01', '42703'].includes(error?.code)) {
      throw error;
    }
  }

  return {
    sourceMode: 'relationship_fallback',
    rows: await loadFallbackPhenotypeRows(client)
  };
}

export async function loadDxGenePhenotypeRows(client) {
  try {
    const canonicalRows = await loadCanonicalGenePhenotypeRows(client);
    if (canonicalRows.length) {
      return {
        sourceMode: 'canonical_concepts',
        rows: canonicalRows
      };
    }
  } catch (error) {
    if (!['42P01', '42703'].includes(error?.code)) {
      throw error;
    }
  }

  const result = await client.query(
    `
      SELECT DISTINCT ON (gene.entity_id, phenotype.entity_id)
        gene.entity_id AS gene_entity_id,
        gene.canonical_curie AS gene_curie,
        gene.canonical_label AS gene_label,
        phenotype.entity_id AS phenotype_entity_id,
        phenotype.canonical_curie AS phenotype_curie,
        phenotype.canonical_label AS phenotype_label,
        COALESCE(evidence.payload_json->>'disease_id', '') AS reference_context,
        COALESCE(evidence.evidence_code, '') AS evidence_code
      FROM relationships rel
      INNER JOIN entities gene
        ON gene.entity_id = rel.subject_entity_id
      INNER JOIN entities phenotype
        ON phenotype.entity_id = rel.object_entity_id
      LEFT JOIN LATERAL (
        SELECT
          relationship_evidence.evidence_code,
          relationship_evidence.payload_json,
          relationship_evidence.observed_at
        FROM relationship_evidence
        WHERE relationship_evidence.relationship_id = rel.relationship_id
        ORDER BY relationship_evidence.observed_at DESC
        LIMIT 1
      ) AS evidence
        ON TRUE
      WHERE rel.predicate_key = 'associated_with_phenotype'
        AND gene.entity_type = 'gene'
        AND gene.is_placeholder = FALSE
        AND phenotype.entity_type = 'phenotype'
      ORDER BY gene.entity_id, phenotype.entity_id, evidence.observed_at DESC NULLS LAST
    `
  );

  return {
    sourceMode: 'relationship_fallback',
    rows: result.rows
  };
}

export async function loadDxGeneDiseaseSupportRows(client) {
  try {
    const canonicalRows = await loadCanonicalGeneDiseaseSupportRows(client);
    if (canonicalRows.length) {
      return canonicalRows;
    }
  } catch (error) {
    if (!['42P01', '42703'].includes(error?.code)) {
      throw error;
    }
  }

  const result = await client.query(
    `
      SELECT DISTINCT ON (gene.entity_id, disease.entity_id)
        gene.entity_id AS gene_entity_id,
        gene.canonical_curie AS gene_curie,
        gene.canonical_label AS gene_label,
        disease.entity_id AS disease_entity_id,
        disease.canonical_curie AS disease_curie,
        disease.canonical_label AS disease_label,
        COALESCE(validity.classification, '') AS classification,
        COALESCE(validity.mode_of_inheritance, '') AS mode_of_inheritance,
        COALESCE(evidence.evidence_code, '') AS evidence_code
      FROM relationships rel
      INNER JOIN entities gene
        ON gene.entity_id = rel.subject_entity_id
      INNER JOIN entities disease
        ON disease.entity_id = rel.object_entity_id
      LEFT JOIN LATERAL (
        SELECT
          relationship_evidence.evidence_code,
          relationship_evidence.observed_at
        FROM relationship_evidence
        WHERE relationship_evidence.relationship_id = rel.relationship_id
        ORDER BY relationship_evidence.observed_at DESC
        LIMIT 1
      ) AS evidence
        ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          clinical_gene_disease_validity_assertions.classification,
          clinical_gene_disease_validity_assertions.mode_of_inheritance,
          clinical_gene_disease_validity_assertions.classification_date
        FROM clinical_gene_disease_validity_assertions
        WHERE clinical_gene_disease_validity_assertions.gene_entity_id = gene.entity_id
          AND clinical_gene_disease_validity_assertions.disease_entity_id = disease.entity_id
        ORDER BY clinical_gene_disease_validity_assertions.classification_date DESC NULLS LAST,
          clinical_gene_disease_validity_assertions.observed_at DESC
        LIMIT 1
      ) AS validity
        ON TRUE
      WHERE rel.predicate_key = 'associated_with_disease'
        AND gene.entity_type = 'gene'
        AND gene.is_placeholder = FALSE
        AND disease.entity_type = 'disease'
        AND disease.is_placeholder = FALSE
      ORDER BY gene.entity_id, disease.entity_id,
        CASE COALESCE(validity.classification, '')
          WHEN 'Definitive' THEN 7
          WHEN 'Strong' THEN 6
          WHEN 'Moderate' THEN 5
          WHEN 'Limited' THEN 4
          WHEN 'Disputed' THEN 2
          WHEN 'Refuted' THEN 1
          ELSE 3
        END DESC,
        evidence.observed_at DESC NULLS LAST
    `
  );

  return result.rows;
}

export async function loadDxPhenotypeOntologyRows(client) {
  const result = await client.query(
    `
      SELECT
        child.canonical_curie AS child_curie,
        child.canonical_label AS child_label,
        parent.canonical_curie AS parent_curie,
        parent.canonical_label AS parent_label
      FROM relationships rel
      INNER JOIN entities child
        ON child.entity_id = rel.subject_entity_id
      INNER JOIN entities parent
        ON parent.entity_id = rel.object_entity_id
      WHERE rel.predicate_key = 'is_a'
        AND child.entity_type = 'phenotype'
        AND parent.entity_type = 'phenotype'
    `
  );

  return result.rows;
}

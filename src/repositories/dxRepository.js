import { SOURCE_KEYS } from '../constants/sourceCatalog.js';

const DX_DISEASE_EDGE_ORIGIN = Object.freeze({
  DIRECT: 'direct',
  PROPAGATED: 'propagated'
});

function diseasePhenotypeRowPriority(row) {
  const isPropagated = row.phenotype_edge_origin === DX_DISEASE_EDGE_ORIGIN.PROPAGATED;
  const isTyped = row.row_source_mode === 'typed_assertions';
  if (!isPropagated && isTyped) return 0;
  if (!isPropagated) return 1;
  if (isTyped) return 2;
  return 3;
}

function mergeDiseasePhenotypeRows(...rowGroups) {
  const mergedByPair = new Map();

  for (const rows of rowGroups) {
    for (const row of rows) {
      const key = `${row.disease_entity_id}|${row.phenotype_entity_id}|${row.presence_status || 'present'}`;
      const existing = mergedByPair.get(key);
      if (!existing) {
        mergedByPair.set(key, row);
        continue;
      }

      const existingPriority = diseasePhenotypeRowPriority(existing);
      const nextPriority = diseasePhenotypeRowPriority(row);
      if (nextPriority < existingPriority) {
        mergedByPair.set(key, row);
      }
    }
  }

  return [...mergedByPair.values()];
}

function normalizeSourceKeyFilter(values = []) {
  return [...new Set((values || []).map((value) => String(value || '').trim()).filter(Boolean))].sort();
}

function buildDisabledSourceKeyClause(expression, disabledSourceKeys, params) {
  if (!disabledSourceKeys.length) {
    return '';
  }
  params.push(disabledSourceKeys);
  return `\n        AND NOT (${expression} = ANY($${params.length}::text[]))`;
}

async function loadTypedPhenotypeRows(client, { disabledSourceKeys = [] } = {}) {
  const normalizedDisabledSourceKeys = normalizeSourceKeyFilter(disabledSourceKeys);
  const params = [SOURCE_KEYS.PHENOTYPE_PROPAGATION];
  const disabledClause = buildDisabledSourceKeyClause(
    'clinical_phenotype_assertions.source_key',
    normalizedDisabledSourceKeys,
    params
  );
  const result = await client.query(
    `
      SELECT DISTINCT ON (disease.entity_id, phenotype.entity_id, clinical_phenotype_assertions.presence_status)
        disease.entity_id AS disease_entity_id,
        disease.canonical_curie AS disease_curie,
        disease.canonical_label AS disease_label,
        phenotype.entity_id AS phenotype_entity_id,
        phenotype.canonical_curie AS phenotype_curie,
        phenotype.canonical_label AS phenotype_label,
        clinical_phenotype_assertions.presence_status AS presence_status,
        clinical_phenotype_assertions.source_key AS source_key,
        clinical_phenotype_assertions.source_record_key AS source_record_key,
        CASE
          WHEN clinical_phenotype_assertions.source_key = $1
            OR clinical_phenotype_assertions.source_record_key LIKE 'phenotype-propagation:%'
          THEN '${DX_DISEASE_EDGE_ORIGIN.PROPAGATED}'
          ELSE '${DX_DISEASE_EDGE_ORIGIN.DIRECT}'
        END AS phenotype_edge_origin,
        clinical_phenotype_assertions.reference_text AS reference_text,
        clinical_phenotype_assertions.evidence_code AS evidence_code,
        onset.canonical_curie AS onset_curie,
        onset.canonical_label AS onset_label,
        COALESCE(frequency.canonical_curie, NULLIF(clinical_phenotype_assertions.payload_json->>'frequency', '')) AS frequency_curie,
        COALESCE(frequency.canonical_label, NULLIF(clinical_phenotype_assertions.payload_json->>'frequency', '')) AS frequency_label,
        modifier.canonical_curie AS modifier_curie,
        modifier.canonical_label AS modifier_label,
        COALESCE(clinical_phenotype_assertions.sex, '') AS sex,
        COALESCE(clinical_phenotype_assertions.aspect, '') AS aspect
      FROM clinical_phenotype_assertions
      INNER JOIN entities disease
        ON disease.entity_id = clinical_phenotype_assertions.subject_entity_id
      INNER JOIN entities phenotype
        ON phenotype.entity_id = clinical_phenotype_assertions.phenotype_entity_id
      LEFT JOIN entities onset
        ON onset.entity_id = clinical_phenotype_assertions.onset_entity_id
      LEFT JOIN entities frequency
        ON frequency.entity_id = clinical_phenotype_assertions.frequency_entity_id
      LEFT JOIN entities modifier
        ON modifier.entity_id = clinical_phenotype_assertions.modifier_entity_id
      WHERE disease.entity_type = 'disease'
        AND disease.is_placeholder = FALSE
${disabledClause}
      ORDER BY disease.entity_id, phenotype.entity_id, clinical_phenotype_assertions.presence_status,
        CASE
          WHEN clinical_phenotype_assertions.source_key = $1
            OR clinical_phenotype_assertions.source_record_key LIKE 'phenotype-propagation:%'
          THEN 1
          ELSE 0
        END ASC,
        clinical_phenotype_assertions.observed_at DESC
    `,
    params
  );

  return result.rows.map((row) => ({
    ...row,
    row_source_mode: 'typed_assertions'
  }));
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

async function loadFallbackPhenotypeRows(client, { disabledSourceKeys = [] } = {}) {
  const normalizedDisabledSourceKeys = normalizeSourceKeyFilter(disabledSourceKeys);
  const params = [SOURCE_KEYS.PHENOTYPE_PROPAGATION];
  const disabledClause = buildDisabledSourceKeyClause(
    "COALESCE(evidence.source_key, rel.primary_source_key, '')",
    normalizedDisabledSourceKeys,
    params
  );
  const result = await client.query(
    `
      SELECT DISTINCT ON (disease.entity_id, phenotype.entity_id, rel.predicate_key)
        disease.entity_id AS disease_entity_id,
        disease.canonical_curie AS disease_curie,
        disease.canonical_label AS disease_label,
        phenotype.entity_id AS phenotype_entity_id,
        phenotype.canonical_curie AS phenotype_curie,
        phenotype.canonical_label AS phenotype_label,
        CASE
          WHEN rel.predicate_key = 'lacks_phenotype' THEN 'absent'
          ELSE 'present'
        END AS presence_status,
        COALESCE(evidence.source_key, rel.primary_source_key, '') AS source_key,
        COALESCE(evidence.source_record_key, '') AS source_record_key,
        CASE
          WHEN COALESCE(evidence.source_key, rel.primary_source_key, '') = $1
            OR COALESCE(evidence.source_record_key, '') LIKE 'phenotype-propagation:%'
          THEN '${DX_DISEASE_EDGE_ORIGIN.PROPAGATED}'
          ELSE '${DX_DISEASE_EDGE_ORIGIN.DIRECT}'
        END AS phenotype_edge_origin,
        COALESCE(evidence.payload_json->>'reference', '') AS reference_text,
        COALESCE(evidence.evidence_code, '') AS evidence_code,
        NULLIF(evidence.payload_json->>'onset', '') AS onset_curie,
        NULLIF(evidence.payload_json->>'onset', '') AS onset_label,
        NULLIF(evidence.payload_json->>'frequency', '') AS frequency_curie,
        NULLIF(evidence.payload_json->>'frequency', '') AS frequency_label,
        NULLIF(evidence.payload_json->>'modifier', '') AS modifier_curie,
        NULLIF(evidence.payload_json->>'modifier', '') AS modifier_label,
        COALESCE(evidence.payload_json->>'sex', '') AS sex,
        COALESCE(evidence.payload_json->>'aspect', '') AS aspect
      FROM relationships rel
      INNER JOIN entities disease
        ON disease.entity_id = rel.subject_entity_id
      INNER JOIN entities phenotype
        ON phenotype.entity_id = rel.object_entity_id
      LEFT JOIN LATERAL (
        SELECT
          relationship_evidence.source_key,
          relationship_evidence.source_record_key,
          relationship_evidence.evidence_code,
          relationship_evidence.payload_json,
          relationship_evidence.observed_at
        FROM relationship_evidence
        WHERE relationship_evidence.relationship_id = rel.relationship_id
        ORDER BY relationship_evidence.observed_at DESC
        LIMIT 1
      ) AS evidence
        ON TRUE
      WHERE rel.predicate_key IN ('has_phenotype', 'lacks_phenotype')
        AND disease.entity_type = 'disease'
        AND disease.is_placeholder = FALSE
        AND phenotype.entity_type = 'phenotype'
${disabledClause}
      ORDER BY disease.entity_id, phenotype.entity_id, rel.predicate_key, evidence.observed_at DESC NULLS LAST
    `,
    params
  );

  return result.rows.map((row) => ({
    ...row,
    row_source_mode: 'relationship_fallback'
  }));
}

export async function loadDxDiseasePhenotypeRows(client, { disabledSourceKeys = [] } = {}) {
  const normalizedDisabledSourceKeys = normalizeSourceKeyFilter(disabledSourceKeys);
  let typedRows = [];
  try {
    typedRows = await loadTypedPhenotypeRows(client, {
      disabledSourceKeys: normalizedDisabledSourceKeys
    });
  } catch (error) {
    if (!['42P01', '42703'].includes(error?.code)) {
      throw error;
    }
  }

  const fallbackRows = await loadFallbackPhenotypeRows(client, {
    disabledSourceKeys: normalizedDisabledSourceKeys
  });
  const rows = mergeDiseasePhenotypeRows(typedRows, fallbackRows);

  return {
    sourceMode: typedRows.length ? 'typed_plus_relationships' : 'relationship_fallback',
    disabledSourceKeys: normalizedDisabledSourceKeys,
    rows
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

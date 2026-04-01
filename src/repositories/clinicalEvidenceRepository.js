function logMissingClinicalEvidenceTable(operation, error) {
  if (error?.code === '42P01') {
    console.warn('[genovy] clinical evidence table unavailable', {
      operation,
      error: error.message || String(error)
    });
  }
}

export async function listCrossSourcePhenotypeConcordance(client, pairs, options = {}) {
  const normalizedPairs = (pairs || [])
    .map((pair) => ({
      diseaseCurie: String(pair.diseaseCurie || '').trim(),
      phenotypeCurie: String(pair.phenotypeCurie || '').trim(),
      presenceStatus: String(pair.presenceStatus || '').trim()
    }))
    .filter((pair) => pair.diseaseCurie && pair.phenotypeCurie && pair.presenceStatus);

  if (!normalizedPairs.length) {
    return [];
  }

  const excludedSourceKeys = Array.isArray(options.excludeSourceKeys)
    ? [...new Set(options.excludeSourceKeys.map((value) => String(value || '').trim()).filter(Boolean))]
    : [];

  try {
    const result = await client.query(
      `
        WITH input AS (
          SELECT
            value->>'diseaseCurie' AS disease_curie,
            value->>'phenotypeCurie' AS phenotype_curie,
            value->>'presenceStatus' AS presence_status
          FROM jsonb_array_elements($1::jsonb) AS value
        ),
        resolved AS (
          SELECT
            input.disease_curie,
            input.phenotype_curie,
            input.presence_status,
            disease.entity_id AS disease_entity_id,
            phenotype.entity_id AS phenotype_entity_id
          FROM input
          INNER JOIN entities disease
            ON disease.canonical_curie = input.disease_curie
          INNER JOIN entities phenotype
            ON phenotype.canonical_curie = input.phenotype_curie
        )
        SELECT
          resolved.disease_curie,
          resolved.phenotype_curie,
          resolved.presence_status,
          assertion.source_key
        FROM resolved
        INNER JOIN clinical_phenotype_assertions assertion
          ON assertion.subject_entity_id = resolved.disease_entity_id
         AND assertion.phenotype_entity_id = resolved.phenotype_entity_id
         AND assertion.presence_status = resolved.presence_status
        WHERE NOT (assertion.source_key = ANY($2::text[]))
        GROUP BY
          resolved.disease_curie,
          resolved.phenotype_curie,
          resolved.presence_status,
          assertion.source_key
        ORDER BY
          resolved.disease_curie ASC,
          resolved.phenotype_curie ASC,
          resolved.presence_status ASC,
          assertion.source_key ASC
      `,
      [JSON.stringify(normalizedPairs), excludedSourceKeys]
    );

    return result.rows.map((row) => ({
      diseaseCurie: row.disease_curie,
      phenotypeCurie: row.phenotype_curie,
      presenceStatus: row.presence_status,
      sourceKey: row.source_key
    }));
  } catch (error) {
    logMissingClinicalEvidenceTable('listCrossSourcePhenotypeConcordance', error);
    if (error?.code === '42P01') {
      return [];
    }
    throw error;
  }
}

export async function upsertClinicalPhenotypeAssertionsBatch(client, rows) {
  if (!rows.length) {
    return;
  }

  await client.query(
    `
      WITH input AS (
        SELECT
          (value->>'subjectEntityId')::BIGINT AS subject_entity_id,
          (value->>'phenotypeEntityId')::BIGINT AS phenotype_entity_id,
          value->>'presenceStatus' AS presence_status,
          value->>'sourceKey' AS source_key,
          NULLIF(value->>'syncRunId', '')::BIGINT AS sync_run_id,
          value->>'sourceRecordKey' AS source_record_key,
          NULLIF(value->>'evidenceCode', '') AS evidence_code,
          NULLIF(value->>'confidenceScore', '')::NUMERIC(5,4) AS confidence_score,
          NULLIF(value->>'onsetEntityId', '')::BIGINT AS onset_entity_id,
          NULLIF(value->>'frequencyEntityId', '')::BIGINT AS frequency_entity_id,
          NULLIF(value->>'modifierEntityId', '')::BIGINT AS modifier_entity_id,
          NULLIF(value->>'sex', '') AS sex,
          NULLIF(value->>'aspect', '') AS aspect,
          NULLIF(value->>'referenceText', '') AS reference_text,
          NULLIF(value->>'provenanceUrl', '') AS provenance_url,
          COALESCE(value->'payload', '{}'::jsonb) AS payload_json
        FROM jsonb_array_elements($1::jsonb) AS value
      ),
      updated AS (
        UPDATE clinical_phenotype_assertions target
        SET
          sync_run_id = input.sync_run_id,
          evidence_code = COALESCE(input.evidence_code, target.evidence_code),
          confidence_score = COALESCE(input.confidence_score, target.confidence_score),
          onset_entity_id = COALESCE(input.onset_entity_id, target.onset_entity_id),
          frequency_entity_id = COALESCE(input.frequency_entity_id, target.frequency_entity_id),
          modifier_entity_id = COALESCE(input.modifier_entity_id, target.modifier_entity_id),
          sex = COALESCE(input.sex, target.sex),
          aspect = COALESCE(input.aspect, target.aspect),
          reference_text = COALESCE(input.reference_text, target.reference_text),
          provenance_url = COALESCE(input.provenance_url, target.provenance_url),
          payload_json = target.payload_json || input.payload_json,
          observed_at = NOW(),
          updated_at = NOW()
        FROM input
        WHERE target.source_key = input.source_key
          AND target.source_record_key = input.source_record_key
          AND target.subject_entity_id = input.subject_entity_id
          AND target.phenotype_entity_id = input.phenotype_entity_id
          AND target.presence_status = input.presence_status
        RETURNING
          target.source_key,
          target.source_record_key,
          target.subject_entity_id,
          target.phenotype_entity_id,
          target.presence_status
      )
      INSERT INTO clinical_phenotype_assertions (
        subject_entity_id,
        phenotype_entity_id,
        presence_status,
        source_key,
        sync_run_id,
        source_record_key,
        evidence_code,
        confidence_score,
        onset_entity_id,
        frequency_entity_id,
        modifier_entity_id,
        sex,
        aspect,
        reference_text,
        provenance_url,
        payload_json
      )
      SELECT
        subject_entity_id,
        phenotype_entity_id,
        presence_status,
        source_key,
        sync_run_id,
        source_record_key,
        evidence_code,
        confidence_score,
        onset_entity_id,
        frequency_entity_id,
        modifier_entity_id,
        sex,
        aspect,
        reference_text,
        provenance_url,
        payload_json
      FROM input
      WHERE NOT EXISTS (
        SELECT 1
        FROM updated
        WHERE updated.source_key = input.source_key
          AND updated.source_record_key = input.source_record_key
          AND updated.subject_entity_id = input.subject_entity_id
          AND updated.phenotype_entity_id = input.phenotype_entity_id
          AND updated.presence_status = input.presence_status
      )
    `,
    [JSON.stringify(rows)]
  );
}

export async function upsertClinicalNaturalHistoryAssertion(client, row) {
  const result = await client.query(
    `
      INSERT INTO clinical_natural_history_assertions (
        disease_entity_id,
        source_key,
        sync_run_id,
        source_record_key,
        validation_status,
        expert_link,
        source_text,
        provenance_url,
        payload_json
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
      ON CONFLICT (source_key, source_record_key, disease_entity_id)
      DO UPDATE SET
        sync_run_id = EXCLUDED.sync_run_id,
        validation_status = COALESCE(EXCLUDED.validation_status, clinical_natural_history_assertions.validation_status),
        expert_link = COALESCE(EXCLUDED.expert_link, clinical_natural_history_assertions.expert_link),
        source_text = COALESCE(EXCLUDED.source_text, clinical_natural_history_assertions.source_text),
        provenance_url = COALESCE(EXCLUDED.provenance_url, clinical_natural_history_assertions.provenance_url),
        payload_json = clinical_natural_history_assertions.payload_json || EXCLUDED.payload_json,
        observed_at = NOW(),
        updated_at = NOW()
      RETURNING clinical_natural_history_assertion_id
    `,
    [
      row.diseaseEntityId,
      row.sourceKey,
      row.syncRunId,
      row.sourceRecordKey,
      row.validationStatus || null,
      row.expertLink || null,
      row.sourceText || null,
      row.provenanceUrl || null,
      JSON.stringify(row.payload || {})
    ]
  );

  return result.rows[0]?.clinical_natural_history_assertion_id || null;
}

export async function replaceClinicalNaturalHistoryTerms(client, naturalHistoryAssertionId, terms) {
  await client.query(
    `
      DELETE FROM clinical_natural_history_terms
      WHERE clinical_natural_history_assertion_id = $1
    `,
    [naturalHistoryAssertionId]
  );

  if (!terms.length) {
    return;
  }

  await client.query(
    `
      WITH input AS (
        SELECT
          $2::BIGINT AS clinical_natural_history_assertion_id,
          value->>'termRole' AS term_role,
          NULLIF(value->>'termEntityId', '')::BIGINT AS term_entity_id,
          value->>'termLabel' AS term_label,
          COALESCE(NULLIF(value->>'sortOrder', '')::INTEGER, 0) AS sort_order
        FROM jsonb_array_elements($1::jsonb) AS value
      )
      INSERT INTO clinical_natural_history_terms (
        clinical_natural_history_assertion_id,
        term_role,
        term_entity_id,
        term_label,
        sort_order
      )
      SELECT
        clinical_natural_history_assertion_id,
        term_role,
        term_entity_id,
        term_label,
        sort_order
      FROM input
      ON CONFLICT (clinical_natural_history_assertion_id, term_role, term_label)
      DO NOTHING
    `,
    [JSON.stringify(terms), naturalHistoryAssertionId]
  );
}

export async function upsertGeneDiseaseValidityAssertionsBatch(client, rows) {
  if (!rows.length) {
    return;
  }

  await client.query(
    `
      WITH input AS (
        SELECT
          (value->>'geneEntityId')::BIGINT AS gene_entity_id,
          (value->>'diseaseEntityId')::BIGINT AS disease_entity_id,
          value->>'sourceKey' AS source_key,
          NULLIF(value->>'syncRunId', '')::BIGINT AS sync_run_id,
          value->>'sourceRecordKey' AS source_record_key,
          value->>'classification' AS classification,
          NULLIF(value->>'modeOfInheritance', '') AS mode_of_inheritance,
          NULLIF(value->>'curationSop', '') AS curation_sop,
          NULLIF(value->>'classificationDate', '')::DATE AS classification_date,
          NULLIF(value->>'gcep', '') AS gcep,
          NULLIF(value->>'onlineReportUrl', '') AS online_report_url,
          NULLIF(value->>'provenanceUrl', '') AS provenance_url,
          COALESCE(value->'payload', '{}'::jsonb) AS payload_json
        FROM jsonb_array_elements($1::jsonb) AS value
      )
      INSERT INTO clinical_gene_disease_validity_assertions (
        gene_entity_id,
        disease_entity_id,
        source_key,
        sync_run_id,
        source_record_key,
        classification,
        mode_of_inheritance,
        curation_sop,
        classification_date,
        gcep,
        online_report_url,
        provenance_url,
        payload_json
      )
      SELECT
        gene_entity_id,
        disease_entity_id,
        source_key,
        sync_run_id,
        source_record_key,
        classification,
        mode_of_inheritance,
        curation_sop,
        classification_date,
        gcep,
        online_report_url,
        provenance_url,
        payload_json
      FROM input
      ON CONFLICT (source_key, source_record_key, gene_entity_id, disease_entity_id, classification)
      DO UPDATE SET
        sync_run_id = EXCLUDED.sync_run_id,
        mode_of_inheritance = COALESCE(EXCLUDED.mode_of_inheritance, clinical_gene_disease_validity_assertions.mode_of_inheritance),
        curation_sop = COALESCE(EXCLUDED.curation_sop, clinical_gene_disease_validity_assertions.curation_sop),
        classification_date = COALESCE(EXCLUDED.classification_date, clinical_gene_disease_validity_assertions.classification_date),
        gcep = COALESCE(EXCLUDED.gcep, clinical_gene_disease_validity_assertions.gcep),
        online_report_url = COALESCE(EXCLUDED.online_report_url, clinical_gene_disease_validity_assertions.online_report_url),
        provenance_url = COALESCE(EXCLUDED.provenance_url, clinical_gene_disease_validity_assertions.provenance_url),
        payload_json = clinical_gene_disease_validity_assertions.payload_json || EXCLUDED.payload_json,
        observed_at = NOW(),
        updated_at = NOW()
    `,
    [JSON.stringify(rows)]
  );
}

export async function upsertVariantDiseaseAssertionsBatch(client, rows) {
  if (!rows.length) {
    return;
  }

  await client.query(
    `
      WITH input AS (
        SELECT
          (value->>'variantEntityId')::BIGINT AS variant_entity_id,
          (value->>'diseaseEntityId')::BIGINT AS disease_entity_id,
          NULLIF(value->>'geneEntityId', '')::BIGINT AS gene_entity_id,
          value->>'sourceKey' AS source_key,
          NULLIF(value->>'syncRunId', '')::BIGINT AS sync_run_id,
          value->>'sourceRecordKey' AS source_record_key,
          NULLIF(value->>'alleleId', '') AS allele_id,
          NULLIF(value->>'variationId', '') AS variation_id,
          NULLIF(value->>'variantName', '') AS variant_name,
          NULLIF(value->>'variationType', '') AS variation_type,
          NULLIF(value->>'clinicalSignificance', '') AS clinical_significance,
          NULLIF(value->>'clinicalSignificanceSimple', '')::INTEGER AS clinical_significance_simple,
          NULLIF(value->>'reviewStatus', '') AS review_status,
          NULLIF(value->>'numberSubmitters', '')::INTEGER AS number_submitters,
          NULLIF(value->>'origin', '') AS origin,
          NULLIF(value->>'originSimple', '') AS origin_simple,
          NULLIF(value->>'assembly', '') AS assembly,
          NULLIF(value->>'lastEvaluated', '')::DATE AS last_evaluated,
          NULLIF(value->>'rcvAccession', '') AS rcv_accession,
          NULLIF(value->>'phenotypeIds', '') AS phenotype_ids,
          NULLIF(value->>'phenotypeList', '') AS phenotype_list,
          NULLIF(value->>'provenanceUrl', '') AS provenance_url,
          COALESCE(value->'payload', '{}'::jsonb) AS payload_json
        FROM jsonb_array_elements($1::jsonb) AS value
      )
      INSERT INTO clinical_variant_disease_assertions (
        variant_entity_id,
        disease_entity_id,
        gene_entity_id,
        source_key,
        sync_run_id,
        source_record_key,
        allele_id,
        variation_id,
        variant_name,
        variation_type,
        clinical_significance,
        clinical_significance_simple,
        review_status,
        number_submitters,
        origin,
        origin_simple,
        assembly,
        last_evaluated,
        rcv_accession,
        phenotype_ids,
        phenotype_list,
        provenance_url,
        payload_json
      )
      SELECT
        variant_entity_id,
        disease_entity_id,
        gene_entity_id,
        source_key,
        sync_run_id,
        source_record_key,
        allele_id,
        variation_id,
        variant_name,
        variation_type,
        clinical_significance,
        clinical_significance_simple,
        review_status,
        number_submitters,
        origin,
        origin_simple,
        assembly,
        last_evaluated,
        rcv_accession,
        phenotype_ids,
        phenotype_list,
        provenance_url,
        payload_json
      FROM input
      ON CONFLICT (source_key, source_record_key, variant_entity_id, disease_entity_id, assembly)
      DO UPDATE SET
        sync_run_id = EXCLUDED.sync_run_id,
        gene_entity_id = COALESCE(EXCLUDED.gene_entity_id, clinical_variant_disease_assertions.gene_entity_id),
        clinical_significance = COALESCE(EXCLUDED.clinical_significance, clinical_variant_disease_assertions.clinical_significance),
        clinical_significance_simple = COALESCE(EXCLUDED.clinical_significance_simple, clinical_variant_disease_assertions.clinical_significance_simple),
        review_status = COALESCE(EXCLUDED.review_status, clinical_variant_disease_assertions.review_status),
        number_submitters = COALESCE(EXCLUDED.number_submitters, clinical_variant_disease_assertions.number_submitters),
        origin = COALESCE(EXCLUDED.origin, clinical_variant_disease_assertions.origin),
        origin_simple = COALESCE(EXCLUDED.origin_simple, clinical_variant_disease_assertions.origin_simple),
        last_evaluated = COALESCE(EXCLUDED.last_evaluated, clinical_variant_disease_assertions.last_evaluated),
        rcv_accession = COALESCE(EXCLUDED.rcv_accession, clinical_variant_disease_assertions.rcv_accession),
        phenotype_ids = COALESCE(EXCLUDED.phenotype_ids, clinical_variant_disease_assertions.phenotype_ids),
        phenotype_list = COALESCE(EXCLUDED.phenotype_list, clinical_variant_disease_assertions.phenotype_list),
        provenance_url = COALESCE(EXCLUDED.provenance_url, clinical_variant_disease_assertions.provenance_url),
        payload_json = clinical_variant_disease_assertions.payload_json || EXCLUDED.payload_json,
        observed_at = NOW(),
        updated_at = NOW()
    `,
    [JSON.stringify(rows)]
  );
}

export async function listNaturalHistoryByEntity(client, entityId, limit = 12) {
  try {
    const cappedLimit = Math.max(1, Math.min(50, Number(limit) || 12));
    const result = await client.query(
      `
        SELECT
          nh.clinical_natural_history_assertion_id,
          nh.source_key,
          nh.source_record_key,
          nh.validation_status,
          nh.expert_link,
          nh.source_text,
          nh.provenance_url,
          COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'termRole', term.term_role,
                'termCurie', entity.canonical_curie,
                'termLabel', term.term_label,
                'sortOrder', term.sort_order
              )
              ORDER BY term.term_role ASC, term.sort_order ASC, term.term_label ASC
            ) FILTER (WHERE term.clinical_natural_history_term_id IS NOT NULL),
            '[]'::jsonb
          ) AS terms
        FROM clinical_natural_history_assertions nh
        LEFT JOIN clinical_natural_history_terms term
          ON term.clinical_natural_history_assertion_id = nh.clinical_natural_history_assertion_id
        LEFT JOIN entities entity
          ON entity.entity_id = term.term_entity_id
        WHERE nh.disease_entity_id = $1
        GROUP BY nh.clinical_natural_history_assertion_id
        ORDER BY nh.source_key ASC, nh.source_record_key ASC
        LIMIT $2
      `,
      [entityId, cappedLimit]
    );

    return result.rows.map((row) => ({
      assertionId: row.clinical_natural_history_assertion_id,
      sourceKey: row.source_key,
      sourceRecordKey: row.source_record_key,
      validationStatus: row.validation_status || '',
      expertLink: row.expert_link || '',
      sourceText: row.source_text || '',
      provenanceUrl: row.provenance_url || '',
      terms: Array.isArray(row.terms) ? row.terms : []
    }));
  } catch (error) {
    logMissingClinicalEvidenceTable('listNaturalHistoryByEntity', error);
    if (error?.code === '42P01') {
      return [];
    }
    throw error;
  }
}

export async function listGeneDiseaseValidityByEntity(client, entityId, limit = 20) {
  try {
    const cappedLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const result = await client.query(
      `
        SELECT
          validity.source_key,
          validity.source_record_key,
          validity.classification,
          validity.mode_of_inheritance,
          validity.curation_sop,
          validity.classification_date,
          validity.gcep,
          validity.online_report_url,
          validity.provenance_url,
          gene.canonical_curie AS gene_curie,
          gene.canonical_label AS gene_label,
          disease.canonical_curie AS disease_curie,
          disease.canonical_label AS disease_label
        FROM clinical_gene_disease_validity_assertions validity
        INNER JOIN entities gene ON gene.entity_id = validity.gene_entity_id
        INNER JOIN entities disease ON disease.entity_id = validity.disease_entity_id
        WHERE validity.gene_entity_id = $1 OR validity.disease_entity_id = $1
        ORDER BY
          validity.classification_date DESC NULLS LAST,
          validity.classification ASC,
          gene.canonical_label ASC
        LIMIT $2
      `,
      [entityId, cappedLimit]
    );

    return result.rows;
  } catch (error) {
    logMissingClinicalEvidenceTable('listGeneDiseaseValidityByEntity', error);
    if (error?.code === '42P01') {
      return [];
    }
    throw error;
  }
}

export async function listVariantDiseaseAssertionsByEntity(client, entityId, limit = 30) {
  try {
    const cappedLimit = Math.max(1, Math.min(200, Number(limit) || 30));
    const result = await client.query(
      `
        SELECT
          variant_assertion.source_key,
          variant_assertion.source_record_key,
          variant_assertion.allele_id,
          variant_assertion.variation_id,
          variant_assertion.variant_name,
          variant_assertion.variation_type,
          variant_assertion.clinical_significance,
          variant_assertion.clinical_significance_simple,
          variant_assertion.review_status,
          variant_assertion.number_submitters,
          variant_assertion.origin,
          variant_assertion.origin_simple,
          variant_assertion.assembly,
          variant_assertion.last_evaluated,
          variant_assertion.rcv_accession,
          variant_assertion.phenotype_ids,
          variant_assertion.phenotype_list,
          variant_assertion.provenance_url,
          variant.canonical_curie AS variant_curie,
          variant.canonical_label AS variant_label,
          gene.canonical_curie AS gene_curie,
          gene.canonical_label AS gene_label,
          disease.canonical_curie AS disease_curie,
          disease.canonical_label AS disease_label
        FROM clinical_variant_disease_assertions variant_assertion
        INNER JOIN entities variant ON variant.entity_id = variant_assertion.variant_entity_id
        INNER JOIN entities disease ON disease.entity_id = variant_assertion.disease_entity_id
        LEFT JOIN entities gene ON gene.entity_id = variant_assertion.gene_entity_id
        WHERE variant_assertion.variant_entity_id = $1
          OR variant_assertion.gene_entity_id = $1
          OR variant_assertion.disease_entity_id = $1
        ORDER BY
          variant_assertion.last_evaluated DESC NULLS LAST,
          variant_assertion.clinical_significance_simple DESC NULLS LAST,
          variant_assertion.review_status ASC
        LIMIT $2
      `,
      [entityId, cappedLimit]
    );

    return result.rows;
  } catch (error) {
    logMissingClinicalEvidenceTable('listVariantDiseaseAssertionsByEntity', error);
    if (error?.code === '42P01') {
      return [];
    }
    throw error;
  }
}

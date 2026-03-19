import { assertRequiredEnv } from '../config/env.js';
import { withClient } from '../db/pool.js';
import { normalizeCurie, stableHash } from '../lib/curies.js';
import { stableJson } from '../lib/json.js';
import { dedupeEvidenceRows, dedupeRelationshipsByKey } from '../lib/syncBatchDedup.js';
import {
  upsertResolvedRelationships,
  upsertRelationshipEvidenceBatch,
  upsertSourceRecord
} from '../repositories/knowledgeRepository.js';
import { upsertClinicalPhenotypeAssertionsBatch } from '../repositories/clinicalEvidenceRepository.js';
import {
  createSyncRun,
  ensureSourceCatalog,
  finalizeSyncRun,
  markSourceSyncState
} from '../repositories/sourceRepository.js';
import { SOURCE_KEYS } from '../constants/sourceCatalog.js';

const SOURCE_KEY = SOURCE_KEYS.PHENOTYPE_PROPAGATION;
const RELATIONSHIP_BATCH_SIZE = 500;
const CLINICAL_ASSERTION_BATCH_SIZE = 500;

const APPROACHES = Object.freeze({
  A: Object.freeze({
    code: 'A',
    qualifier: 'propagated_from_xref'
  }),
  B: Object.freeze({
    code: 'B',
    qualifier: 'propagated_from_parent'
  }),
  C: Object.freeze({
    code: 'C',
    qualifier: 'propagated_from_gene'
  })
});

function chunkArray(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function buildRelationshipKey(subjectEntityId, predicateKey, objectEntityId, qualifiers) {
  return stableHash(`${subjectEntityId}|${predicateKey}|${objectEntityId}|${stableJson(qualifiers || {})}`);
}

function buildPhenotypeKey(diseaseEntityId, phenotypeEntityId) {
  return `${diseaseEntityId}|${phenotypeEntityId}`;
}

function buildPropagationRecordKey({ approachCode, diseaseCurie, phenotypeCurie, donorKey }) {
  return `phenotype-propagation:${approachCode}:${diseaseCurie}:${phenotypeCurie}:${donorKey}`;
}

function normalizeXrefCurie(xrefCurie) {
  const normalized = normalizeCurie(xrefCurie);
  if (!normalized) {
    return '';
  }

  if (normalized.startsWith('ORPHANET:')) {
    return normalized.replace(/^ORPHANET:/, 'ORPHA:');
  }

  return normalized;
}

function isEquivalentXrefCurie(curie) {
  return curie.startsWith('OMIM:') || curie.startsWith('ORPHA:');
}

function initApproachSummary() {
  return {
    diseaseEntityIds: new Set(),
    edgeCount: 0
  };
}

async function loadDiseasePhenotypeCounts(client) {
  const result = await client.query(
    `
      WITH phenotype_pairs AS (
        SELECT
          subject_entity_id AS disease_entity_id,
          phenotype_entity_id
        FROM clinical_phenotype_assertions
        WHERE presence_status = 'present'

        UNION

        SELECT
          rel.subject_entity_id AS disease_entity_id,
          rel.object_entity_id AS phenotype_entity_id
        FROM relationships rel
        INNER JOIN entities disease
          ON disease.entity_id = rel.subject_entity_id
        INNER JOIN entities phenotype
          ON phenotype.entity_id = rel.object_entity_id
        WHERE rel.predicate_key = 'has_phenotype'
          AND disease.entity_type = 'disease'
          AND phenotype.entity_type = 'phenotype'
      )
      SELECT
        disease.entity_id,
        disease.canonical_curie,
        disease.canonical_label,
        disease.is_placeholder,
        COUNT(DISTINCT phenotype_pairs.phenotype_entity_id)::INTEGER AS phenotype_count
      FROM entities disease
      LEFT JOIN phenotype_pairs
        ON phenotype_pairs.disease_entity_id = disease.entity_id
      WHERE disease.entity_type = 'disease'
      GROUP BY disease.entity_id, disease.canonical_curie, disease.canonical_label, disease.is_placeholder
      ORDER BY disease.entity_id ASC
    `
  );

  return result.rows.map((row) => ({
    entityId: row.entity_id,
    canonicalCurie: row.canonical_curie,
    canonicalLabel: row.canonical_label,
    isPlaceholder: Boolean(row.is_placeholder),
    phenotypeCount: Number(row.phenotype_count || 0)
  }));
}

async function loadExistingDiseasePhenotypePairs(client) {
  const result = await client.query(
    `
      SELECT DISTINCT disease_entity_id, phenotype_entity_id
      FROM (
        SELECT
          subject_entity_id AS disease_entity_id,
          phenotype_entity_id
        FROM clinical_phenotype_assertions
        WHERE presence_status = 'present'

        UNION

        SELECT
          rel.subject_entity_id AS disease_entity_id,
          rel.object_entity_id AS phenotype_entity_id
        FROM relationships rel
        INNER JOIN entities disease
          ON disease.entity_id = rel.subject_entity_id
        INNER JOIN entities phenotype
          ON phenotype.entity_id = rel.object_entity_id
        WHERE rel.predicate_key = 'has_phenotype'
          AND disease.entity_type = 'disease'
          AND phenotype.entity_type = 'phenotype'
      ) pairs
    `
  );

  return new Set(
    result.rows.map((row) => buildPhenotypeKey(row.disease_entity_id, row.phenotype_entity_id))
  );
}

async function loadDirectDiseasePhenotypeDonors(client) {
  const typed = await client.query(
    `
      SELECT DISTINCT ON (assertion.subject_entity_id, assertion.phenotype_entity_id)
        assertion.subject_entity_id AS disease_entity_id,
        disease.canonical_curie AS disease_curie,
        disease.canonical_label AS disease_label,
        assertion.phenotype_entity_id,
        phenotype.canonical_curie AS phenotype_curie,
        phenotype.canonical_label AS phenotype_label,
        assertion.source_key,
        assertion.source_record_key,
        COALESCE(assertion.evidence_code, '') AS evidence_code,
        assertion.onset_entity_id,
        assertion.frequency_entity_id,
        assertion.modifier_entity_id,
        COALESCE(assertion.sex, '') AS sex,
        COALESCE(assertion.aspect, '') AS aspect,
        COALESCE(assertion.reference_text, '') AS reference_text,
        COALESCE(assertion.provenance_url, '') AS provenance_url,
        COALESCE(assertion.payload_json, '{}'::jsonb) AS payload_json
      FROM clinical_phenotype_assertions assertion
      INNER JOIN entities disease
        ON disease.entity_id = assertion.subject_entity_id
      INNER JOIN entities phenotype
        ON phenotype.entity_id = assertion.phenotype_entity_id
      WHERE assertion.presence_status = 'present'
        AND assertion.source_key <> $1
        AND disease.entity_type = 'disease'
        AND phenotype.entity_type = 'phenotype'
      ORDER BY assertion.subject_entity_id, assertion.phenotype_entity_id, assertion.observed_at DESC
    `,
    [SOURCE_KEY]
  );

  const donorsByKey = new Map();
  for (const row of typed.rows) {
    donorsByKey.set(buildPhenotypeKey(row.disease_entity_id, row.phenotype_entity_id), {
      diseaseEntityId: row.disease_entity_id,
      diseaseCurie: row.disease_curie,
      diseaseLabel: row.disease_label,
      phenotypeEntityId: row.phenotype_entity_id,
      phenotypeCurie: row.phenotype_curie,
      phenotypeLabel: row.phenotype_label,
      sourceKey: row.source_key,
      sourceRecordKey: row.source_record_key,
      evidenceCode: row.evidence_code,
      onsetEntityId: row.onset_entity_id,
      frequencyEntityId: row.frequency_entity_id,
      modifierEntityId: row.modifier_entity_id,
      sex: row.sex,
      aspect: row.aspect,
      referenceText: row.reference_text,
      provenanceUrl: row.provenance_url,
      payload: row.payload_json || {}
    });
  }

  const fallback = await client.query(
    `
      SELECT DISTINCT ON (rel.subject_entity_id, rel.object_entity_id)
        rel.subject_entity_id AS disease_entity_id,
        disease.canonical_curie AS disease_curie,
        disease.canonical_label AS disease_label,
        rel.object_entity_id AS phenotype_entity_id,
        phenotype.canonical_curie AS phenotype_curie,
        phenotype.canonical_label AS phenotype_label,
        COALESCE(evidence.source_key, rel.primary_source_key, '') AS source_key,
        COALESCE(evidence.source_record_key, '') AS source_record_key,
        COALESCE(evidence.evidence_code, '') AS evidence_code,
        COALESCE(rel.qualifiers_json->>'sex', '') AS sex,
        COALESCE(rel.qualifiers_json->>'aspect', '') AS aspect,
        COALESCE(rel.qualifiers_json->>'reference', '') AS reference_text,
        COALESCE(evidence.provenance_url, '') AS provenance_url,
        COALESCE(evidence.payload_json, rel.qualifiers_json, '{}'::jsonb) AS payload_json
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
          relationship_evidence.provenance_url,
          relationship_evidence.payload_json,
          relationship_evidence.observed_at
        FROM relationship_evidence
        WHERE relationship_evidence.relationship_id = rel.relationship_id
        ORDER BY relationship_evidence.observed_at DESC
        LIMIT 1
      ) evidence
        ON TRUE
      WHERE rel.predicate_key = 'has_phenotype'
        AND disease.entity_type = 'disease'
        AND phenotype.entity_type = 'phenotype'
        AND COALESCE(evidence.source_key, rel.primary_source_key, '') <> $1
        AND NOT EXISTS (
          SELECT 1
          FROM clinical_phenotype_assertions assertion
          WHERE assertion.subject_entity_id = rel.subject_entity_id
            AND assertion.phenotype_entity_id = rel.object_entity_id
            AND assertion.presence_status = 'present'
        )
      ORDER BY rel.subject_entity_id, rel.object_entity_id, evidence.observed_at DESC NULLS LAST
    `,
    [SOURCE_KEY]
  );

  for (const row of fallback.rows) {
    const key = buildPhenotypeKey(row.disease_entity_id, row.phenotype_entity_id);
    if (donorsByKey.has(key)) {
      continue;
    }

    donorsByKey.set(key, {
      diseaseEntityId: row.disease_entity_id,
      diseaseCurie: row.disease_curie,
      diseaseLabel: row.disease_label,
      phenotypeEntityId: row.phenotype_entity_id,
      phenotypeCurie: row.phenotype_curie,
      phenotypeLabel: row.phenotype_label,
      sourceKey: row.source_key,
      sourceRecordKey: row.source_record_key,
      evidenceCode: row.evidence_code,
      onsetEntityId: null,
      frequencyEntityId: null,
      modifierEntityId: null,
      sex: row.sex,
      aspect: row.aspect,
      referenceText: row.reference_text,
      provenanceUrl: row.provenance_url,
      payload: row.payload_json || {}
    });
  }

  const donorsByDiseaseId = new Map();
  for (const donor of donorsByKey.values()) {
    const donors = donorsByDiseaseId.get(donor.diseaseEntityId) || [];
    donors.push(donor);
    donorsByDiseaseId.set(donor.diseaseEntityId, donors);
  }

  for (const donors of donorsByDiseaseId.values()) {
    donors.sort((left, right) => left.phenotypeCurie.localeCompare(right.phenotypeCurie));
  }

  return donorsByDiseaseId;
}

async function loadDiseaseXrefs(client, diseaseEntityIds) {
  if (!diseaseEntityIds.length) {
    return new Map();
  }

  const result = await client.query(
    `
      SELECT
        entity_id,
        xref_curie
      FROM entity_xrefs
      WHERE entity_id = ANY($1::BIGINT[])
      ORDER BY entity_id ASC, xref_curie ASC
    `,
    [diseaseEntityIds]
  );

  const xrefsByDiseaseId = new Map();
  for (const row of result.rows) {
    const xrefs = xrefsByDiseaseId.get(row.entity_id) || [];
    xrefs.push(row.xref_curie);
    xrefsByDiseaseId.set(row.entity_id, xrefs);
  }

  return xrefsByDiseaseId;
}

async function loadDiseaseParents(client, diseaseEntityIds) {
  if (!diseaseEntityIds.length) {
    return new Map();
  }

  const result = await client.query(
    `
      SELECT
        rel.subject_entity_id AS child_entity_id,
        parent.entity_id AS parent_entity_id,
        parent.canonical_curie AS parent_curie,
        parent.canonical_label AS parent_label
      FROM relationships rel
      INNER JOIN entities parent
        ON parent.entity_id = rel.object_entity_id
      WHERE rel.predicate_key = 'is_a'
        AND rel.subject_entity_id = ANY($1::BIGINT[])
        AND parent.entity_type = 'disease'
      ORDER BY rel.subject_entity_id ASC, parent.canonical_curie ASC
    `,
    [diseaseEntityIds]
  );

  const parentsByDiseaseId = new Map();
  for (const row of result.rows) {
    const parents = parentsByDiseaseId.get(row.child_entity_id) || [];
    parents.push({
      entityId: row.parent_entity_id,
      canonicalCurie: row.parent_curie,
      canonicalLabel: row.parent_label
    });
    parentsByDiseaseId.set(row.child_entity_id, parents);
  }

  return parentsByDiseaseId;
}

async function loadDiseaseEntitiesByCurie(client, canonicalCuries) {
  if (!canonicalCuries.length) {
    return new Map();
  }

  const result = await client.query(
    `
      SELECT
        entity_id,
        canonical_curie,
        canonical_label
      FROM entities
      WHERE canonical_curie = ANY($1::TEXT[])
        AND entity_type = 'disease'
      ORDER BY canonical_curie ASC
    `,
    [canonicalCuries]
  );

  return new Map(
    result.rows.map((row) => [
      row.canonical_curie,
      {
        entityId: row.entity_id,
        canonicalCurie: row.canonical_curie,
        canonicalLabel: row.canonical_label
      }
    ])
  );
}

async function loadGeneMediatedCandidates(client, diseaseEntityIds) {
  if (!diseaseEntityIds.length) {
    return [];
  }

  const result = await client.query(
    `
      SELECT DISTINCT ON (disease.entity_id, phenotype.entity_id, gene.concept_id)
        disease.entity_id AS disease_entity_id,
        disease.canonical_curie AS disease_curie,
        disease.canonical_label AS disease_label,
        phenotype.entity_id AS phenotype_entity_id,
        phenotype.canonical_curie AS phenotype_curie,
        phenotype.canonical_label AS phenotype_label,
        COALESCE(gene.canonical_curie, preferred_entity.canonical_curie, gene.canonical_label) AS gene_curie,
        gene.canonical_label AS gene_label,
        COALESCE(evidence.source_key, gp.primary_source_key, '') AS source_key,
        COALESCE(evidence.source_record_key, '') AS source_record_key,
        COALESCE(evidence.evidence_code, '') AS evidence_code,
        COALESCE(evidence.provenance_url, '') AS provenance_url,
        COALESCE(evidence.payload_json, gp.qualifiers_json, '{}'::jsonb) AS payload_json
      FROM canonical_concepts gene
      INNER JOIN canonical_concept_memberships disease_gene_membership
        ON disease_gene_membership.concept_id = gene.concept_id
      INNER JOIN relationships gd
        ON gd.subject_entity_id = disease_gene_membership.entity_id
      INNER JOIN entities disease
        ON disease.entity_id = gd.object_entity_id
      INNER JOIN canonical_concept_memberships phenotype_gene_membership
        ON phenotype_gene_membership.concept_id = gene.concept_id
      INNER JOIN relationships gp
        ON gp.subject_entity_id = phenotype_gene_membership.entity_id
      INNER JOIN entities phenotype
        ON phenotype.entity_id = gp.object_entity_id
      LEFT JOIN entities preferred_entity
        ON preferred_entity.entity_id = gene.preferred_entity_id
      LEFT JOIN LATERAL (
        SELECT
          relationship_evidence.source_key,
          relationship_evidence.source_record_key,
          relationship_evidence.evidence_code,
          relationship_evidence.provenance_url,
          relationship_evidence.payload_json,
          relationship_evidence.observed_at
        FROM relationship_evidence
        WHERE relationship_evidence.relationship_id = gp.relationship_id
        ORDER BY relationship_evidence.observed_at DESC
        LIMIT 1
      ) evidence
        ON TRUE
      WHERE gene.concept_type = 'gene'
        AND gd.predicate_key = 'associated_with_disease'
        AND gp.predicate_key = 'associated_with_phenotype'
        AND disease.entity_id = ANY($1::BIGINT[])
        AND phenotype.entity_type = 'phenotype'
        AND COALESCE(evidence.source_key, gp.primary_source_key, '') <> $2
      ORDER BY disease.entity_id, phenotype.entity_id, gene.concept_id, evidence.observed_at DESC NULLS LAST
    `,
    [diseaseEntityIds, SOURCE_KEY]
  );

  return result.rows.map((row) => ({
    diseaseEntityId: row.disease_entity_id,
    diseaseCurie: row.disease_curie,
    diseaseLabel: row.disease_label,
    phenotypeEntityId: row.phenotype_entity_id,
    phenotypeCurie: row.phenotype_curie,
    phenotypeLabel: row.phenotype_label,
    geneCurie: row.gene_curie,
    geneLabel: row.gene_label,
    sourceKey: row.source_key,
    sourceRecordKey: row.source_record_key,
    evidenceCode: row.evidence_code,
    provenanceUrl: row.provenance_url,
    payload: row.payload_json || {}
  }));
}

function addCandidate({
  candidates,
  pendingPhenotypeKeys,
  approachSummary,
  candidate
}) {
  const phenotypeKey = buildPhenotypeKey(candidate.diseaseEntityId, candidate.phenotypeEntityId);
  if (pendingPhenotypeKeys.has(phenotypeKey)) {
    return false;
  }

  pendingPhenotypeKeys.add(phenotypeKey);
  candidates.push(candidate);
  approachSummary.edgeCount += 1;
  approachSummary.diseaseEntityIds.add(candidate.diseaseEntityId);
  return true;
}

function buildDiseaseDerivedCandidate({
  approach,
  disease,
  phenotype,
  donor,
  donorType
}) {
  const donorKey = donor.canonicalCurie;
  const sourceRecordKey = buildPropagationRecordKey({
    approachCode: approach.code,
    diseaseCurie: disease.canonicalCurie,
    phenotypeCurie: phenotype.phenotypeCurie,
    donorKey
  });

  const propagationPayload = {
    source: approach.qualifier,
    donorType,
    propagatedFromCurie: donor.canonicalCurie,
    propagatedFromLabel: donor.canonicalLabel,
    donorSourceKey: phenotype.sourceKey || '',
    donorSourceRecordKey: phenotype.sourceRecordKey || '',
    donorEvidenceCode: phenotype.evidenceCode || '',
    donorReferenceText: phenotype.referenceText || ''
  };

  return {
    approachCode: approach.code,
    qualifier: approach.qualifier,
    diseaseEntityId: disease.entityId,
    diseaseCurie: disease.canonicalCurie,
    diseaseLabel: disease.canonicalLabel,
    phenotypeEntityId: phenotype.phenotypeEntityId,
    phenotypeCurie: phenotype.phenotypeCurie,
    phenotypeLabel: phenotype.phenotypeLabel,
    onsetEntityId: phenotype.onsetEntityId,
    frequencyEntityId: phenotype.frequencyEntityId,
    modifierEntityId: phenotype.modifierEntityId,
    sex: phenotype.sex || '',
    aspect: phenotype.aspect || '',
    referenceText: phenotype.referenceText || donor.canonicalCurie,
    provenanceUrl: phenotype.provenanceUrl || '',
    evidenceCode: phenotype.evidenceCode || '',
    donorSourceKey: phenotype.sourceKey || '',
    donorSourceRecordKey: phenotype.sourceRecordKey || '',
    payload: propagationPayload,
    relationshipQualifiers: {
      source: approach.qualifier,
      propagatedFromCurie: donor.canonicalCurie,
      propagatedFromLabel: donor.canonicalLabel,
      donorType
    },
    sourceRecordKey
  };
}

function buildGeneDerivedCandidate({ disease, phenotype, gene }) {
  const donorKey = gene.geneCurie || gene.geneLabel;
  const sourceRecordKey = buildPropagationRecordKey({
    approachCode: APPROACHES.C.code,
    diseaseCurie: disease.canonicalCurie,
    phenotypeCurie: phenotype.phenotypeCurie,
    donorKey
  });

  return {
    approachCode: APPROACHES.C.code,
    qualifier: APPROACHES.C.qualifier,
    diseaseEntityId: disease.entityId,
    diseaseCurie: disease.canonicalCurie,
    diseaseLabel: disease.canonicalLabel,
    phenotypeEntityId: phenotype.phenotypeEntityId,
    phenotypeCurie: phenotype.phenotypeCurie,
    phenotypeLabel: phenotype.phenotypeLabel,
    onsetEntityId: null,
    frequencyEntityId: null,
    modifierEntityId: null,
    sex: '',
    aspect: '',
    referenceText: gene.geneCurie || gene.geneLabel,
    provenanceUrl: gene.provenanceUrl || '',
    evidenceCode: gene.evidenceCode || '',
    donorSourceKey: gene.sourceKey || '',
    donorSourceRecordKey: gene.sourceRecordKey || '',
    payload: {
      source: APPROACHES.C.qualifier,
      donorType: 'gene',
      propagatedFromGeneCurie: gene.geneCurie,
      propagatedFromGeneLabel: gene.geneLabel,
      donorSourceKey: gene.sourceKey || '',
      donorSourceRecordKey: gene.sourceRecordKey || '',
      donorEvidenceCode: gene.evidenceCode || ''
    },
    relationshipQualifiers: {
      source: APPROACHES.C.qualifier,
      propagatedFromGeneCurie: gene.geneCurie,
      propagatedFromGeneLabel: gene.geneLabel
    },
    sourceRecordKey
  };
}

function buildPropagationPlan({
  diseaseRows,
  diseasePhenotypeDonorsByDiseaseId,
  xrefsByDiseaseId,
  diseaseEntityByCurie,
  parentsByDiseaseId,
  geneCandidates,
  existingPhenotypeKeys
}) {
  const zeroDiseases = diseaseRows.filter(
    (row) => !row.isPlaceholder && row.phenotypeCount === 0
  );
  const diseaseById = new Map(zeroDiseases.map((row) => [row.entityId, row]));
  const pendingPhenotypeKeys = new Set(existingPhenotypeKeys);
  const candidates = [];
  const approachSummary = {
    A: initApproachSummary(),
    B: initApproachSummary(),
    C: initApproachSummary()
  };

  const zeroMondoDiseases = zeroDiseases
    .filter((row) => row.canonicalCurie.startsWith('MONDO:'))
    .sort((left, right) => left.canonicalCurie.localeCompare(right.canonicalCurie));

  for (const disease of zeroMondoDiseases) {
    const xrefs = xrefsByDiseaseId.get(disease.entityId) || [];
    for (const rawXrefCurie of xrefs) {
      const xrefCurie = normalizeXrefCurie(rawXrefCurie);
      if (!isEquivalentXrefCurie(xrefCurie)) {
        continue;
      }

      const donorDisease = diseaseEntityByCurie.get(xrefCurie);
      if (!donorDisease || donorDisease.entityId === disease.entityId) {
        continue;
      }

      const donorPhenotypes = diseasePhenotypeDonorsByDiseaseId.get(donorDisease.entityId) || [];
      for (const donorPhenotype of donorPhenotypes) {
        addCandidate({
          candidates,
          pendingPhenotypeKeys,
          approachSummary: approachSummary.A,
          candidate: buildDiseaseDerivedCandidate({
            approach: APPROACHES.A,
            disease,
            phenotype: donorPhenotype,
            donor: donorDisease,
            donorType: 'xref_disease'
          })
        });
      }
    }
  }

  for (const disease of zeroMondoDiseases) {
    const parents = parentsByDiseaseId.get(disease.entityId) || [];
    for (const parent of parents) {
      const donorPhenotypes = diseasePhenotypeDonorsByDiseaseId.get(parent.entityId) || [];
      for (const donorPhenotype of donorPhenotypes) {
        addCandidate({
          candidates,
          pendingPhenotypeKeys,
          approachSummary: approachSummary.B,
          candidate: buildDiseaseDerivedCandidate({
            approach: APPROACHES.B,
            disease,
            phenotype: donorPhenotype,
            donor: parent,
            donorType: 'parent_disease'
          })
        });
      }
    }
  }

  for (const geneCandidate of geneCandidates) {
    const disease = diseaseById.get(geneCandidate.diseaseEntityId);
    if (!disease) {
      continue;
    }

    addCandidate({
      candidates,
      pendingPhenotypeKeys,
      approachSummary: approachSummary.C,
      candidate: buildGeneDerivedCandidate({
        disease,
        phenotype: geneCandidate,
        gene: geneCandidate
      })
    });
  }

  return {
    zeroPhenotypeDiseaseCount: zeroDiseases.length,
    candidates,
    approachSummary
  };
}

async function persistPropagationPlan(client, syncRunId, candidates) {
  const relationshipRows = [];
  const evidenceRows = [];
  const sourceRecords = [];
  const clinicalAssertions = [];

  for (const candidate of candidates) {
    const relationshipKey = buildRelationshipKey(
      candidate.diseaseEntityId,
      'has_phenotype',
      candidate.phenotypeEntityId,
      candidate.relationshipQualifiers
    );

    relationshipRows.push({
      relationshipKey,
      subjectEntityId: candidate.diseaseEntityId,
      predicateKey: 'has_phenotype',
      objectEntityId: candidate.phenotypeEntityId,
      qualifiers: candidate.relationshipQualifiers
    });

    evidenceRows.push({
      relationshipKey,
      sourceKey: SOURCE_KEY,
      syncRunId,
      sourceRecordKey: candidate.sourceRecordKey,
      evidenceType: 'disease_phenotype_propagation',
      evidenceCode: candidate.evidenceCode || 'IEA',
      provenanceUrl: candidate.provenanceUrl || '',
      payload: {
        ...candidate.payload,
        diseaseCurie: candidate.diseaseCurie,
        phenotypeCurie: candidate.phenotypeCurie
      }
    });

    sourceRecords.push({
      sourceKey: SOURCE_KEY,
      syncRunId,
      recordType: 'phenotype_propagation',
      sourceRecordKey: candidate.sourceRecordKey,
      canonicalCurie: candidate.diseaseCurie,
      payload: {
        source: candidate.qualifier,
        diseaseCurie: candidate.diseaseCurie,
        diseaseLabel: candidate.diseaseLabel,
        phenotypeCurie: candidate.phenotypeCurie,
        phenotypeLabel: candidate.phenotypeLabel,
        donorSourceKey: candidate.donorSourceKey,
        donorSourceRecordKey: candidate.donorSourceRecordKey,
        propagation: candidate.payload
      }
    });

    clinicalAssertions.push({
      subjectEntityId: candidate.diseaseEntityId,
      phenotypeEntityId: candidate.phenotypeEntityId,
      presenceStatus: 'present',
      sourceKey: SOURCE_KEY,
      syncRunId,
      sourceRecordKey: candidate.sourceRecordKey,
      evidenceCode: candidate.evidenceCode || 'IEA',
      onsetEntityId: candidate.onsetEntityId,
      frequencyEntityId: candidate.frequencyEntityId,
      modifierEntityId: candidate.modifierEntityId,
      sex: candidate.sex,
      aspect: candidate.aspect,
      referenceText: candidate.referenceText,
      provenanceUrl: candidate.provenanceUrl,
      payload: candidate.payload
    });
  }

  for (const sourceRecord of sourceRecords) {
    await upsertSourceRecord(client, sourceRecord);
  }

  for (const relationshipBatch of chunkArray(relationshipRows, RELATIONSHIP_BATCH_SIZE)) {
    const persisted = await upsertResolvedRelationships(
      client,
      dedupeRelationshipsByKey(relationshipBatch),
      SOURCE_KEY
    );
    const relationshipIdByKey = new Map(
      persisted.map((row) => [row.relationship_key, row.relationship_id])
    );
    const resolvedEvidenceRows = [];
    for (const evidence of evidenceRows) {
      if (!relationshipIdByKey.has(evidence.relationshipKey)) {
        continue;
      }
      resolvedEvidenceRows.push({
        relationshipId: relationshipIdByKey.get(evidence.relationshipKey),
        sourceKey: evidence.sourceKey,
        syncRunId: evidence.syncRunId,
        sourceRecordKey: evidence.sourceRecordKey,
        evidenceType: evidence.evidenceType,
        evidenceCode: evidence.evidenceCode,
        provenanceUrl: evidence.provenanceUrl,
        payload: evidence.payload
      });
    }
    await upsertRelationshipEvidenceBatch(client, dedupeEvidenceRows(resolvedEvidenceRows));
  }

  for (const assertionBatch of chunkArray(clinicalAssertions, CLINICAL_ASSERTION_BATCH_SIZE)) {
    await upsertClinicalPhenotypeAssertionsBatch(client, assertionBatch);
  }

  return {
    sourceRecordCount: sourceRecords.length,
    relationshipCount: relationshipRows.length,
    clinicalAssertionCount: clinicalAssertions.length
  };
}

function summarizeApproach(approachSummary) {
  return Object.fromEntries(
    Object.entries(approachSummary).map(([key, value]) => [
      key,
      {
        diseasesGained: value.diseaseEntityIds.size,
        edgeCount: value.edgeCount
      }
    ])
  );
}

async function buildSummary(client, { execute = false } = {}) {
  const diseaseRows = await loadDiseasePhenotypeCounts(client);
  const eligibleDiseaseRows = diseaseRows.filter(
    (row) => !row.isPlaceholder && row.phenotypeCount <= 5
  );
  const existingPhenotypeKeys = await loadExistingDiseasePhenotypePairs(client);
  const diseasePhenotypeDonorsByDiseaseId = await loadDirectDiseasePhenotypeDonors(client);

  const xrefsByDiseaseId = await loadDiseaseXrefs(
    client,
    eligibleDiseaseRows.map((row) => row.entityId)
  );
  const normalizedXrefCuries = Array.from(
    new Set(
      Array.from(xrefsByDiseaseId.values())
        .flat()
        .map((xrefCurie) => normalizeXrefCurie(xrefCurie))
        .filter((curie) => isEquivalentXrefCurie(curie))
    )
  );
  const diseaseEntityByCurie = await loadDiseaseEntitiesByCurie(client, normalizedXrefCuries);
  const parentsByDiseaseId = await loadDiseaseParents(
    client,
    eligibleDiseaseRows
      .filter((row) => row.canonicalCurie.startsWith('MONDO:'))
      .map((row) => row.entityId)
  );
  const geneCandidates = await loadGeneMediatedCandidates(
    client,
    eligibleDiseaseRows
      .filter((row) => row.phenotypeCount === 0)
      .map((row) => row.entityId)
  );

  const plan = buildPropagationPlan({
    diseaseRows: eligibleDiseaseRows,
    diseasePhenotypeDonorsByDiseaseId,
    xrefsByDiseaseId,
    diseaseEntityByCurie,
    parentsByDiseaseId,
    geneCandidates,
    existingPhenotypeKeys
  });

  const summary = {
    execute,
    sourceKey: SOURCE_KEY,
    eligibleDiseaseCount: eligibleDiseaseRows.length,
    zeroPhenotypeDiseaseCount: plan.zeroPhenotypeDiseaseCount,
    diseasesGainedPhenotypes: new Set(plan.candidates.map((candidate) => candidate.diseaseEntityId)).size,
    newPhenotypeEdges: plan.candidates.length,
    breakdown: summarizeApproach(plan.approachSummary)
  };

  return {
    plan,
    summary
  };
}

async function runPropagation({ execute = false } = {}) {
  assertRequiredEnv({ requireAdminToken: false });

  return withClient(async (client) => {
    const { plan, summary } = await buildSummary(client, { execute });
    if (!execute) {
      return summary;
    }

    await client.query('BEGIN');
    let syncRun = null;

    try {
      await ensureSourceCatalog(client);
      syncRun = await createSyncRun(client, SOURCE_KEY, {
        triggerMode: 'manual',
        requestedBy: 'codex-phenotype-propagation-step2',
        options: {
          propagationApproaches: ['A', 'B', 'C']
        }
      });

      const persistenceSummary = await persistPropagationPlan(client, syncRun.sync_run_id, plan.candidates);
      const fullSummary = {
        ...summary,
        syncRunId: syncRun.sync_run_id,
        persistedSourceRecords: persistenceSummary.sourceRecordCount,
        persistedRelationships: persistenceSummary.relationshipCount,
        persistedClinicalAssertions: persistenceSummary.clinicalAssertionCount
      };

      await finalizeSyncRun(client, syncRun.sync_run_id, {
        status: 'completed',
        sourceVersion: 'step2-phenotype-propagation-v1',
        summary: fullSummary,
        errorMessage: ''
      });
      await markSourceSyncState(
        client,
        SOURCE_KEY,
        syncRun.sync_run_id,
        'step2-phenotype-propagation-v1',
        fullSummary
      );
      await client.query('COMMIT');
      return fullSummary;
    } catch (error) {
      await client.query('ROLLBACK');
      if (syncRun?.sync_run_id) {
        await finalizeSyncRun(client, syncRun.sync_run_id, {
          status: 'failed',
          sourceVersion: 'step2-phenotype-propagation-v1',
          summary: {},
          errorMessage: error.message || 'Phenotype propagation failed.'
        }).catch(() => null);
      }
      throw error;
    }
  });
}

const execute = process.argv.includes('--execute');

runPropagation({ execute })
  .then((summary) => {
    console.log(JSON.stringify(summary, null, 2));
  })
  .catch((error) => {
    console.error('[propagate-sparse-disease-phenotypes] failed:', error);
    process.exit(1);
  });

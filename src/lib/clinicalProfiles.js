import { normalizeCurie } from './curies.js';

export const CLINICAL_PROFILE_CONSTANTS = Object.freeze({
  profileRelationshipPredicates: Object.freeze(['has_phenotype', 'lacks_phenotype']),
  qualifierKeys: Object.freeze(['onset', 'frequency', 'modifier']),
  positivePredicate: 'has_phenotype',
  negativePredicate: 'lacks_phenotype',
  defaultLimit: 200,
  maxLimit: 500,
  naturalHistoryLimit: 12,
  geneDiseaseValidityLimit: 20,
  variantAssertionLimit: 30
});

export function parseProfileLimit(rawValue) {
  const parsed = Number.parseInt(String(rawValue ?? CLINICAL_PROFILE_CONSTANTS.defaultLimit), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return CLINICAL_PROFILE_CONSTANTS.defaultLimit;
  }
  return Math.min(parsed, CLINICAL_PROFILE_CONSTANTS.maxLimit);
}

export function collectQualifierCuries(rows) {
  const values = new Set();
  for (const row of rows) {
    const qualifiers = row.qualifiers_json || {};
    for (const key of CLINICAL_PROFILE_CONSTANTS.qualifierKeys) {
      const normalized = normalizeCurie(qualifiers[key] || '');
      if (normalized) {
        values.add(normalized);
      }
    }
  }
  return [...values];
}

export function summarizeProfileRows(rows, qualifierLabelByCurie = new Map()) {
  const observations = rows.map((row) => {
    const qualifiers = row.qualifiers_json || {};
    const onsetCurie = normalizeCurie(qualifiers.onset || '');
    const frequencyCurie = normalizeCurie(qualifiers.frequency || '');
    const modifierCurie = normalizeCurie(qualifiers.modifier || '');

    return {
      predicateKey: row.predicate_key,
      phenotypeCurie: row.phenotype_curie,
      phenotypeLabel: row.phenotype_label,
      onset: {
        curie: onsetCurie,
        label: onsetCurie ? qualifierLabelByCurie.get(onsetCurie) || onsetCurie : '',
        raw: qualifiers.onset || ''
      },
      frequency: {
        curie: frequencyCurie,
        label: frequencyCurie ? qualifierLabelByCurie.get(frequencyCurie) || frequencyCurie : '',
        raw: qualifiers.frequency || ''
      },
      modifier: {
        curie: modifierCurie,
        label: modifierCurie ? qualifierLabelByCurie.get(modifierCurie) || modifierCurie : '',
        raw: qualifiers.modifier || ''
      },
      sex: qualifiers.sex || '',
      aspect: qualifiers.aspect || '',
      evidenceCode: row.evidence_code || '',
      reference: qualifiers.reference || row.reference || '',
      confidenceScore: row.confidence_score == null ? null : Number(row.confidence_score),
      provenanceUrl: row.provenance_url || '',
      sourceRecordKey: row.source_record_key || ''
    };
  });

  const positiveObservations = observations.filter(
    (observation) => observation.predicateKey === CLINICAL_PROFILE_CONSTANTS.positivePredicate
  );
  const negativeObservations = observations.filter(
    (observation) => observation.predicateKey === CLINICAL_PROFILE_CONSTANTS.negativePredicate
  );

  return {
    observations,
    positiveObservations,
    negativeObservations,
    positivePhenotypeCount: positiveObservations.length,
    negativePhenotypeCount: negativeObservations.length
  };
}

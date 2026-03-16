import { DX_QUERY_DEFAULTS } from '../constants/dx.js';
import { normalizeCurie } from './curies.js';

function normalizeHpoCurie(rawValue) {
  const normalized = normalizeCurie(rawValue);
  return normalized.startsWith('HP:') ? normalized : '';
}

function uniqueCuries(values) {
  return [...new Set(values.filter(Boolean))];
}

function extractPhenopacketTerms(phenopacket) {
  const present = [];
  const excluded = [];

  for (const feature of phenopacket?.phenotypicFeatures || []) {
    const curie = normalizeHpoCurie(feature?.type?.id || feature?.type?.identifier || feature?.id || '');
    if (!curie) {
      continue;
    }

    if (feature?.excluded === true) {
      excluded.push(curie);
      continue;
    }

    present.push(curie);
  }

  return {
    presentPhenotypeCuries: uniqueCuries(present),
    excludedPhenotypeCuries: uniqueCuries(excluded),
    sourceFormat: 'phenopacket'
  };
}

function normalizeDiseaseCurie(rawValue) {
  return normalizeCurie(rawValue || '');
}

function extractDiagnosisDiseaseCurie(diagnosis) {
  return normalizeDiseaseCurie(
    diagnosis?.disease?.term?.id ||
      diagnosis?.disease?.term?.identifier ||
      diagnosis?.disease?.id ||
      diagnosis?.term?.id ||
      diagnosis?.term?.identifier ||
      diagnosis?.id ||
      ''
  );
}

function extractPlainTermList(input) {
  const values = [];
  for (const item of input || []) {
    if (typeof item === 'string') {
      values.push(normalizeHpoCurie(item));
      continue;
    }

    if (item && typeof item === 'object') {
      values.push(normalizeHpoCurie(item.id || item.curie || item.identifier || ''));
    }
  }

  return {
    presentPhenotypeCuries: uniqueCuries(values),
    excludedPhenotypeCuries: [],
    sourceFormat: 'hpo_terms'
  };
}

export function extractDxPhenotypeInput(payload) {
  if (payload?.phenopacket) {
    return extractPhenopacketTerms(payload.phenopacket);
  }

  if (Array.isArray(payload?.hpoTerms)) {
    return extractPlainTermList(payload.hpoTerms);
  }

  if (Array.isArray(payload?.phenotypeTerms)) {
    return extractPlainTermList(payload.phenotypeTerms);
  }

  return {
    presentPhenotypeCuries: [],
    excludedPhenotypeCuries: [],
    sourceFormat: 'unknown'
  };
}

export function extractPhenopacketDiseaseCuries(phenopacket) {
  const values = [];

  for (const disease of phenopacket?.diseases || []) {
    if (disease?.excluded === true) {
      continue;
    }
    values.push(
      normalizeDiseaseCurie(disease?.term?.id || disease?.term?.identifier || disease?.id || '')
    );
  }

  for (const interpretation of phenopacket?.interpretations || []) {
    if (interpretation?.diagnosis) {
      values.push(extractDiagnosisDiseaseCurie(interpretation.diagnosis));
    }

    for (const diagnosis of interpretation?.diagnoses || []) {
      values.push(extractDiagnosisDiseaseCurie(diagnosis));
    }
  }

  return uniqueCuries(values);
}

export function extractPhenopacketCaseId(phenopacket, fallbackId = 'phenopacket-case') {
  const rawValue =
    phenopacket?.id ||
    phenopacket?.subject?.id ||
    phenopacket?.subject?.alternateIds?.[0] ||
    fallbackId;

  return String(rawValue).trim() || fallbackId;
}

export function parseDxLimit(rawValue) {
  const parsed = Number.parseInt(String(rawValue || DX_QUERY_DEFAULTS.defaultLimit), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DX_QUERY_DEFAULTS.defaultLimit;
  }
  return Math.min(parsed, DX_QUERY_DEFAULTS.maxLimit);
}

export function validateDxPhenotypeInput(input) {
  if (input.presentPhenotypeCuries.length < DX_QUERY_DEFAULTS.minPhenotypeTerms) {
    return `At least ${DX_QUERY_DEFAULTS.minPhenotypeTerms} HPO term is required.`;
  }

  if (input.presentPhenotypeCuries.length > DX_QUERY_DEFAULTS.maxPhenotypeTerms) {
    return `A maximum of ${DX_QUERY_DEFAULTS.maxPhenotypeTerms} HPO terms is supported per request.`;
  }

  return '';
}

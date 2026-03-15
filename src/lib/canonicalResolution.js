import { normalizeCurie, normalizeLabel, splitCuriePrefix } from './curies.js';

export const CANONICAL_RESOLUTION_STRATEGY = Object.freeze({
  EXACT_IDENTIFIER: 'exact_identifier',
  EXACT_LABEL: 'exact_label'
});

export const CANONICAL_CONFIDENCE = Object.freeze({
  [CANONICAL_RESOLUTION_STRATEGY.EXACT_IDENTIFIER]: 1,
  [CANONICAL_RESOLUTION_STRATEGY.EXACT_LABEL]: 0.82
});

const IDENTIFIER_PRIORITY_BY_TYPE = Object.freeze({
  disease: Object.freeze(['MONDO', 'ORPHA', 'OMIM', 'GARD']),
  phenotype: Object.freeze(['HP']),
  gene: Object.freeze(['HGNC', 'NCBIGene', 'ENSEMBL']),
  variant: Object.freeze(['CLINVAR', 'CAID', 'VRS']),
  trial: Object.freeze(['NCT']),
  paper: Object.freeze(['PMID', 'PMCID', 'DOI'])
});

const GLOBAL_IDENTIFIER_PRIORITY = Object.freeze(['MONDO', 'HP', 'HGNC', 'NCT', 'PMID', 'PMCID', 'DOI']);

const PREFERRED_ENTITY_SCORE = Object.freeze({
  IDENTIFIER_MATCH: 1000,
  NON_PLACEHOLDER: 100,
  HAS_DESCRIPTION: 10
});

function uniqueNormalizedValues(values) {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeCurie(value))
        .filter(Boolean)
        .filter((value) => !value.startsWith('PLACEHOLDER:'))
    )
  );
}

function getIdentifierPriority(entityType, curie) {
  const { prefix } = splitCuriePrefix(curie);
  const perTypePriority = IDENTIFIER_PRIORITY_BY_TYPE[entityType] || [];
  const typeIndex = perTypePriority.indexOf(prefix);
  if (typeIndex >= 0) {
    return typeIndex;
  }

  const globalIndex = GLOBAL_IDENTIFIER_PRIORITY.indexOf(prefix);
  if (globalIndex >= 0) {
    return perTypePriority.length + globalIndex;
  }

  return Number.MAX_SAFE_INTEGER;
}

function choosePreferredIdentifier(entityType, identifiers) {
  const normalizedIdentifiers = uniqueNormalizedValues(identifiers);
  if (!normalizedIdentifiers.length) {
    return null;
  }

  return normalizedIdentifiers
    .sort((left, right) => {
      const priorityDelta = getIdentifierPriority(entityType, left) - getIdentifierPriority(entityType, right);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }
      return left.localeCompare(right);
    })[0];
}

export function buildCanonicalSeed(entity) {
  const candidateIdentifiers = [entity.canonicalCurie, ...(entity.xrefCuries || [])];
  const preferredIdentifier = choosePreferredIdentifier(entity.entityType, candidateIdentifiers);

  if (preferredIdentifier) {
    return {
      canonicalKey: `identifier:${preferredIdentifier}`,
      canonicalCurie: preferredIdentifier,
      resolutionStrategy: CANONICAL_RESOLUTION_STRATEGY.EXACT_IDENTIFIER,
      confidenceScore: CANONICAL_CONFIDENCE[CANONICAL_RESOLUTION_STRATEGY.EXACT_IDENTIFIER],
      matchedOn: {
        identifierCurie: preferredIdentifier,
        candidateIdentifiers: uniqueNormalizedValues(candidateIdentifiers)
      }
    };
  }

  const normalizedLabel = normalizeLabel(entity.canonicalLabel || entity.normalizedLabel || '');
  return {
    canonicalKey: `label:${entity.entityType}:${normalizedLabel}`,
    canonicalCurie: '',
    resolutionStrategy: CANONICAL_RESOLUTION_STRATEGY.EXACT_LABEL,
    confidenceScore: CANONICAL_CONFIDENCE[CANONICAL_RESOLUTION_STRATEGY.EXACT_LABEL],
    matchedOn: {
      normalizedLabel
    }
  };
}

function scoreEntityPreference(entity) {
  let score = 0;

  if (entity.seed?.canonicalCurie) {
    score += PREFERRED_ENTITY_SCORE.IDENTIFIER_MATCH;
    score -= getIdentifierPriority(entity.entityType, entity.seed.canonicalCurie);
  }
  if (!entity.isPlaceholder) {
    score += PREFERRED_ENTITY_SCORE.NON_PLACEHOLDER;
  }
  if (entity.description) {
    score += PREFERRED_ENTITY_SCORE.HAS_DESCRIPTION;
  }

  return score;
}

export function selectPreferredEntity(groupMembers) {
  return [...groupMembers].sort((left, right) => {
    const scoreDelta = scoreEntityPreference(right) - scoreEntityPreference(left);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    const labelDelta = String(left.canonicalLabel || '').localeCompare(String(right.canonicalLabel || ''));
    if (labelDelta !== 0) {
      return labelDelta;
    }

    return Number(left.entityId) - Number(right.entityId);
  })[0];
}

export function groupEntitiesIntoCanonicalConcepts(entityRows) {
  const grouped = new Map();

  for (const entity of entityRows) {
    const seed = buildCanonicalSeed(entity);
    const entry = {
      ...entity,
      seed
    };
    const existing = grouped.get(seed.canonicalKey);
    if (existing) {
      existing.members.push(entry);
      existing.memberEntityIds.push(entry.entityId);
      if (seed.matchedOn.identifierCurie) {
        existing.identifierCuries.add(seed.matchedOn.identifierCurie);
      }
      continue;
    }

    grouped.set(seed.canonicalKey, {
      canonicalKey: seed.canonicalKey,
      conceptType: entity.entityType,
      resolutionStrategy: seed.resolutionStrategy,
      confidenceScore: seed.confidenceScore,
      members: [entry],
      memberEntityIds: [entry.entityId],
      identifierCuries: new Set(seed.matchedOn.identifierCurie ? [seed.matchedOn.identifierCurie] : [])
    });
  }

  return Array.from(grouped.values()).map((group) => {
    const preferredEntity = selectPreferredEntity(group.members);
    return {
      ...group,
      preferredEntity,
      canonicalCurie: preferredEntity.seed.canonicalCurie || null,
      canonicalLabel: preferredEntity.canonicalLabel,
      normalizedLabel: normalizeLabel(preferredEntity.canonicalLabel),
      identifierCuries: Array.from(group.identifierCuries).sort()
    };
  });
}

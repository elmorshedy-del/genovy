import { isLikelyGeneSymbol, normalizeCurie, normalizeLabel, splitCuriePrefix } from './curies.js';

export const CANONICAL_RESOLUTION_STRATEGY = Object.freeze({
  EXACT_IDENTIFIER: 'exact_identifier',
  EXACT_LABEL: 'exact_label',
  GENE_SYMBOL_BRIDGE: 'gene_symbol_bridge'
});

export const CANONICAL_CONFIDENCE = Object.freeze({
  [CANONICAL_RESOLUTION_STRATEGY.EXACT_IDENTIFIER]: 1,
  [CANONICAL_RESOLUTION_STRATEGY.EXACT_LABEL]: 0.82,
  [CANONICAL_RESOLUTION_STRATEGY.GENE_SYMBOL_BRIDGE]: 0.91
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

function collectEntityIdentifiers(entity) {
  return uniqueNormalizedValues([entity.canonicalCurie, ...(entity.xrefCuries || [])]);
}

function buildGeneSymbolBridgeKey(entity, identifiers) {
  if (entity.entityType !== 'gene') {
    return '';
  }

  const prefixes = new Set(identifiers.map((identifier) => splitCuriePrefix(identifier).prefix));
  const canBridgeByIdentifier = prefixes.has('HGNC') || prefixes.has('NCBIGene') || prefixes.has('ENSEMBL');
  const normalizedLabel = normalizeLabel(entity.canonicalLabel || entity.normalizedLabel || '');
  if (!canBridgeByIdentifier || !normalizedLabel || !isLikelyGeneSymbol(entity.canonicalLabel || entity.normalizedLabel)) {
    return '';
  }

  return `gene_symbol:${normalizedLabel}`;
}

function buildEntityMatchKeys(entity, identifiers) {
  const keys = identifiers.map((identifier) => `identifier:${identifier}`);
  const geneBridgeKey = buildGeneSymbolBridgeKey(entity, identifiers);
  if (geneBridgeKey) {
    keys.push(geneBridgeKey);
  }
  return keys;
}

function createDisjointSet(size) {
  const parents = Array.from({ length: size }, (_, index) => index);
  const ranks = Array.from({ length: size }, () => 0);

  function find(index) {
    if (parents[index] !== index) {
      parents[index] = find(parents[index]);
    }
    return parents[index];
  }

  function union(left, right) {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot === rightRoot) {
      return;
    }

    if (ranks[leftRoot] < ranks[rightRoot]) {
      parents[leftRoot] = rightRoot;
      return;
    }
    if (ranks[leftRoot] > ranks[rightRoot]) {
      parents[rightRoot] = leftRoot;
      return;
    }

    parents[rightRoot] = leftRoot;
    ranks[leftRoot] += 1;
  }

  return {
    find,
    union
  };
}

export function buildCanonicalSeed(entity) {
  const candidateIdentifiers = collectEntityIdentifiers(entity);
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
  const entries = entityRows.map((entity) => {
    const identifiers = collectEntityIdentifiers(entity);
    return {
      ...entity,
      identifiers,
      matchKeys: buildEntityMatchKeys(entity, identifiers),
      seed: buildCanonicalSeed(entity)
    };
  });

  const disjointSet = createDisjointSet(entries.length);
  const indicesByMatchKey = new Map();

  entries.forEach((entry, index) => {
    for (const matchKey of entry.matchKeys) {
      const existingIndices = indicesByMatchKey.get(matchKey) || [];
      for (const existingIndex of existingIndices) {
        disjointSet.union(index, existingIndex);
      }
      existingIndices.push(index);
      indicesByMatchKey.set(matchKey, existingIndices);
    }
  });

  const grouped = new Map();

  entries.forEach((entry, index) => {
    const rootIndex = disjointSet.find(index);
    const existing = grouped.get(rootIndex);
    if (existing) {
      existing.members.push(entry);
      existing.memberEntityIds.push(entry.entityId);
      for (const identifier of entry.identifiers) {
        existing.identifierCuries.add(identifier);
      }
      if (entry.matchKeys.some((matchKey) => matchKey.startsWith('gene_symbol:'))) {
        existing.hasGeneSymbolBridge = true;
      }
      return;
    }

    grouped.set(rootIndex, {
      conceptType: entry.entityType,
      members: [entry],
      memberEntityIds: [entry.entityId],
      identifierCuries: new Set(entry.identifiers),
      hasGeneSymbolBridge: entry.matchKeys.some((matchKey) => matchKey.startsWith('gene_symbol:'))
    });
  });

  return Array.from(grouped.values()).map((group) => {
    const preferredEntity = selectPreferredEntity(group.members);
    const preferredIdentifier = choosePreferredIdentifier(group.conceptType, Array.from(group.identifierCuries));
    const resolutionStrategy = preferredIdentifier
      ? group.hasGeneSymbolBridge
        ? CANONICAL_RESOLUTION_STRATEGY.GENE_SYMBOL_BRIDGE
        : CANONICAL_RESOLUTION_STRATEGY.EXACT_IDENTIFIER
      : CANONICAL_RESOLUTION_STRATEGY.EXACT_LABEL;
    const confidenceScore = CANONICAL_CONFIDENCE[resolutionStrategy];
    const canonicalKey = preferredIdentifier
      ? `identifier:${preferredIdentifier}`
      : `label:${group.conceptType}:${normalizeLabel(preferredEntity.canonicalLabel)}`;

    return {
      ...group,
      canonicalKey,
      preferredEntity,
      resolutionStrategy,
      confidenceScore,
      canonicalCurie: preferredIdentifier || null,
      canonicalLabel: preferredEntity.canonicalLabel,
      normalizedLabel: normalizeLabel(preferredEntity.canonicalLabel),
      identifierCuries: Array.from(group.identifierCuries).sort()
    };
  });
}

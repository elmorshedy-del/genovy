import { normalizeCurie } from '../lib/curies.js';

export const GENE_DISEASE_SCIENTIFIC_DEFAULTS = Object.freeze({
  maxExistingExamples: 5,
  maxDiseaseHierarchyDepth: 12,
  sameFamilyMaxAncestorDepth: 2,
  minFamilyAncestorLabelLength: 8
});

export const GENE_DISEASE_RELATION_BUCKETS = Object.freeze({
  knownExact: 'known_exact',
  knownEquivalent: 'known_equivalent',
  underNormalizedDiseaseIdentity: 'under_normalized_disease_identity',
  sameFamilyAncestorLink: 'same_family_ancestor_link',
  sameFamilyDescendantLink: 'same_family_descendant_link',
  sameFamilySharedAncestor: 'same_family_shared_ancestor',
  novelCandidate: 'novel_candidate'
});

const CODE_LIKE_DISEASE_LABEL_PATTERN = /^(?:[A-Z]+:)?\d+(?:[._-]\d+)*$/;

const EXISTING_LINKS_QUERY = `
  SELECT
    rel.subject_concept_id AS gene_concept_id,
    rel.object_concept_id AS disease_concept_id,
    disease.canonical_curie AS disease_curie,
    disease.canonical_label AS disease_label,
    disease.normalized_label AS disease_normalized_label
  FROM canonical_relationships rel
  INNER JOIN canonical_concepts disease
    ON disease.concept_id = rel.object_concept_id
  WHERE rel.predicate_key = 'associated_with_disease'
    AND rel.subject_concept_id = ANY($1::BIGINT[])
`;

const DISEASE_RELATION_CLOSURE_QUERY = `
  WITH RECURSIVE ancestors AS (
    SELECT
      seed.concept_id AS seed_concept_id,
      seed.concept_id AS related_concept_id,
      0::INTEGER AS depth
    FROM canonical_concepts seed
    WHERE seed.concept_id = ANY($1::BIGINT[])

    UNION ALL

    SELECT
      ancestors.seed_concept_id,
      rel.object_concept_id AS related_concept_id,
      ancestors.depth + 1
    FROM ancestors
    INNER JOIN canonical_relationships rel
      ON rel.subject_concept_id = ancestors.related_concept_id
      AND rel.predicate_key = 'is_a'
    WHERE ancestors.depth < $2
  ),
  descendants AS (
    SELECT
      seed.concept_id AS seed_concept_id,
      seed.concept_id AS related_concept_id,
      0::INTEGER AS depth
    FROM canonical_concepts seed
    WHERE seed.concept_id = ANY($1::BIGINT[])

    UNION ALL

    SELECT
      descendants.seed_concept_id,
      rel.subject_concept_id AS related_concept_id,
      descendants.depth + 1
    FROM descendants
    INNER JOIN canonical_relationships rel
      ON rel.object_concept_id = descendants.related_concept_id
      AND rel.predicate_key = 'is_a'
    WHERE descendants.depth < $2
  )
  SELECT
    relationship.direction,
    relationship.seed_concept_id,
    relationship.related_concept_id,
    MIN(relationship.depth)::INTEGER AS depth
  FROM (
    SELECT 'ancestor'::TEXT AS direction, * FROM ancestors
    UNION ALL
    SELECT 'descendant'::TEXT AS direction, * FROM descendants
  ) AS relationship
  GROUP BY relationship.direction, relationship.seed_concept_id, relationship.related_concept_id
`;

const DISEASE_METADATA_QUERY = `
  SELECT
    disease.concept_id,
    disease.canonical_curie,
    disease.canonical_label,
    disease.normalized_label,
    COALESCE(
      ARRAY_AGG(DISTINCT alias.normalized_alias) FILTER (WHERE alias.normalized_alias IS NOT NULL),
      ARRAY[]::TEXT[]
    ) AS normalized_aliases,
    COALESCE(
      ARRAY_AGG(DISTINCT xref.xref_curie) FILTER (WHERE xref.xref_curie IS NOT NULL),
      ARRAY[]::TEXT[]
    ) AS identifier_curies
  FROM canonical_concepts disease
  LEFT JOIN canonical_concept_aliases alias
    ON alias.concept_id = disease.concept_id
  LEFT JOIN canonical_concept_memberships membership
    ON membership.concept_id = disease.concept_id
  LEFT JOIN entity_xrefs xref
    ON xref.entity_id = membership.entity_id
  WHERE disease.concept_id = ANY($1::BIGINT[])
  GROUP BY disease.concept_id, disease.canonical_curie, disease.canonical_label, disease.normalized_label
`;

function dedupeStrings(values, limit = 0) {
  const deduped = [];
  const seen = new Set();
  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    deduped.push(value);
    if (limit > 0 && deduped.length >= limit) {
      break;
    }
  }
  return deduped;
}

function dedupePositiveIntegers(values) {
  return [...new Set(
    values
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0)
  )];
}

function buildRelationshipDepthMap(relationshipRows, direction) {
  const map = new Map();
  for (const row of relationshipRows) {
    if (row.direction !== direction) {
      continue;
    }

    const seedConceptId = Number(row.seed_concept_id);
    const relatedConceptId = Number(row.related_concept_id);
    const depth = Number(row.depth);
    if (!map.has(seedConceptId)) {
      map.set(seedConceptId, new Map());
    }

    const depthMap = map.get(seedConceptId);
    const existingDepth = depthMap.get(relatedConceptId);
    if (existingDepth == null || depth < existingDepth) {
      depthMap.set(relatedConceptId, depth);
    }
  }

  return map;
}

function normalizeIdentifierValues(values) {
  return dedupeStrings(
    values
      .map((value) => normalizeCurie(value))
      .filter(Boolean)
  );
}

function buildDiseaseAliasSet(metadata) {
  const aliasSet = new Set(metadata?.normalizedAliases || []);
  if (metadata?.normalizedLabel) {
    aliasSet.add(metadata.normalizedLabel);
  }
  return aliasSet;
}

function buildDiseaseIdentifierSet(metadata) {
  return new Set(metadata?.identifierCuries || []);
}

function isCodeLikeDiseaseIdentity(metadata) {
  if (!metadata) {
    return false;
  }

  const canonicalLabel = String(metadata.canonicalLabel || '').trim();
  const canonicalCurie = String(metadata.canonicalCurie || '').trim();
  if (!canonicalLabel) {
    return false;
  }
  if (canonicalCurie && canonicalLabel === canonicalCurie) {
    return true;
  }
  return CODE_LIKE_DISEASE_LABEL_PATTERN.test(canonicalLabel);
}

function haveEquivalentDiseaseIdentity(candidateMetadata, existingMetadata) {
  if (!candidateMetadata || !existingMetadata) {
    return false;
  }

  if (
    candidateMetadata.normalizedLabel &&
    existingMetadata.normalizedLabel &&
    candidateMetadata.normalizedLabel === existingMetadata.normalizedLabel
  ) {
    return true;
  }

  const candidateAliases = buildDiseaseAliasSet(candidateMetadata);
  const existingAliases = buildDiseaseAliasSet(existingMetadata);
  for (const alias of candidateAliases) {
    if (existingAliases.has(alias)) {
      return true;
    }
  }

  const candidateIdentifiers = buildDiseaseIdentifierSet(candidateMetadata);
  const existingIdentifiers = buildDiseaseIdentifierSet(existingMetadata);
  for (const identifier of candidateIdentifiers) {
    if (existingIdentifiers.has(identifier)) {
      return true;
    }
  }

  return false;
}

function findSharedFamilyAncestor(candidateMetadata, existingMetadata, ancestorDepthByDisease, options) {
  const candidateAncestors = ancestorDepthByDisease.get(candidateMetadata.conceptId);
  const existingAncestors = ancestorDepthByDisease.get(existingMetadata.conceptId);
  if (!candidateAncestors || !existingAncestors) {
    return null;
  }

  let bestMatch = null;
  for (const [ancestorConceptId, candidateDepth] of candidateAncestors.entries()) {
    if (candidateDepth <= 0 || candidateDepth > options.sameFamilyMaxAncestorDepth) {
      continue;
    }

    const existingDepth = existingAncestors.get(ancestorConceptId);
    if (existingDepth == null || existingDepth <= 0 || existingDepth > options.sameFamilyMaxAncestorDepth) {
      continue;
    }

    const ancestorMetadata = options.diseaseMetadataById.get(ancestorConceptId);
    if (!ancestorMetadata || !ancestorMetadata.normalizedLabel) {
      continue;
    }
    if (ancestorMetadata.normalizedLabel.length < options.minFamilyAncestorLabelLength) {
      continue;
    }

    const candidateMatchesAncestor = buildDiseaseAliasSet(candidateMetadata).has(ancestorMetadata.normalizedLabel)
      || candidateMetadata.normalizedLabel.includes(ancestorMetadata.normalizedLabel);
    const existingMatchesAncestor = buildDiseaseAliasSet(existingMetadata).has(ancestorMetadata.normalizedLabel)
      || existingMetadata.normalizedLabel.includes(ancestorMetadata.normalizedLabel);

    if (!candidateMatchesAncestor && !existingMatchesAncestor) {
      continue;
    }

    const totalDepth = candidateDepth + existingDepth;
    if (!bestMatch || totalDepth < bestMatch.totalDepth) {
      bestMatch = {
        ancestorConceptId,
        ancestorLabel: ancestorMetadata.canonicalLabel,
        candidateDepth,
        existingDepth,
        totalDepth
      };
    }
  }

  return bestMatch;
}

function buildDiseaseMetadataFromRow(row) {
  return {
    conceptId: Number(row.concept_id),
    canonicalCurie: row.canonical_curie,
    canonicalLabel: row.canonical_label,
    normalizedLabel: row.normalized_label,
    normalizedAliases: row.normalized_aliases || [],
    identifierCuries: normalizeIdentifierValues([
      row.canonical_curie,
      ...(row.identifier_curies || [])
    ])
  };
}

export function isStrictNovelGeneDiseaseBucket(bucket) {
  return bucket === GENE_DISEASE_RELATION_BUCKETS.novelCandidate;
}

export function classifyGeneDiseaseCandidate(candidatePair, context, options = {}) {
  const resolvedOptions = {
    ...GENE_DISEASE_SCIENTIFIC_DEFAULTS,
    ...options
  };
  const geneConceptId = Number(candidatePair.geneConceptId);
  const diseaseConceptId = Number(candidatePair.diseaseConceptId);
  const candidateDiseaseMetadata = context.diseaseMetadataById.get(diseaseConceptId);
  const linkedDiseases = context.existingLinksByGene.get(geneConceptId) || [];
  const candidateAncestorDepths = context.ancestorDepthByDisease.get(diseaseConceptId) || new Map();
  const candidateDescendantDepths = context.descendantDepthByDisease.get(diseaseConceptId) || new Map();

  const exactMatches = [];
  const equivalentMatches = [];
  const ancestorMatches = [];
  const descendantMatches = [];
  const sharedAncestorMatches = [];

  for (const linkedDisease of linkedDiseases) {
    const existingDiseaseMetadata = context.diseaseMetadataById.get(linkedDisease.diseaseConceptId);
    if (!existingDiseaseMetadata) {
      continue;
    }

    if (linkedDisease.diseaseConceptId === diseaseConceptId) {
      exactMatches.push(existingDiseaseMetadata.canonicalLabel);
      continue;
    }

    if (haveEquivalentDiseaseIdentity(candidateDiseaseMetadata, existingDiseaseMetadata)) {
      equivalentMatches.push(existingDiseaseMetadata.canonicalLabel);
      continue;
    }

    const existingAsAncestorDepth = candidateAncestorDepths.get(linkedDisease.diseaseConceptId);
    if (existingAsAncestorDepth != null && existingAsAncestorDepth > 0) {
      ancestorMatches.push(`${existingDiseaseMetadata.canonicalLabel} (depth ${existingAsAncestorDepth})`);
      continue;
    }

    const existingAsDescendantDepth = candidateDescendantDepths.get(linkedDisease.diseaseConceptId);
    if (existingAsDescendantDepth != null && existingAsDescendantDepth > 0) {
      descendantMatches.push(`${existingDiseaseMetadata.canonicalLabel} (depth ${existingAsDescendantDepth})`);
      continue;
    }

    const sharedAncestor = findSharedFamilyAncestor(
      candidateDiseaseMetadata,
      existingDiseaseMetadata,
      context.ancestorDepthByDisease,
      {
        ...resolvedOptions,
        diseaseMetadataById: context.diseaseMetadataById
      }
    );
    if (sharedAncestor) {
      sharedAncestorMatches.push(
        `${existingDiseaseMetadata.canonicalLabel} via ${sharedAncestor.ancestorLabel}`
      );
    }
  }

  let relationBucket = GENE_DISEASE_RELATION_BUCKETS.novelCandidate;
  if (exactMatches.length) {
    relationBucket = GENE_DISEASE_RELATION_BUCKETS.knownExact;
  } else if (equivalentMatches.length) {
    relationBucket = GENE_DISEASE_RELATION_BUCKETS.knownEquivalent;
  } else if (isCodeLikeDiseaseIdentity(candidateDiseaseMetadata)) {
    relationBucket = GENE_DISEASE_RELATION_BUCKETS.underNormalizedDiseaseIdentity;
  } else if (ancestorMatches.length) {
    relationBucket = GENE_DISEASE_RELATION_BUCKETS.sameFamilyAncestorLink;
  } else if (descendantMatches.length) {
    relationBucket = GENE_DISEASE_RELATION_BUCKETS.sameFamilyDescendantLink;
  } else if (sharedAncestorMatches.length) {
    relationBucket = GENE_DISEASE_RELATION_BUCKETS.sameFamilySharedAncestor;
  }

  return {
    relationBucket,
    strictNoveltyPass: isStrictNovelGeneDiseaseBucket(relationBucket),
    exactMatches,
    equivalentMatches,
    ancestorMatches,
    descendantMatches,
    sharedAncestorMatches
  };
}

export async function loadGeneDiseaseScientificContext(client, {
  geneConceptIds = [],
  candidateDiseaseConceptIds = [],
  options = {}
} = {}) {
  const resolvedOptions = {
    ...GENE_DISEASE_SCIENTIFIC_DEFAULTS,
    ...options
  };
  const resolvedGeneConceptIds = dedupePositiveIntegers(geneConceptIds);
  const resolvedCandidateDiseaseConceptIds = dedupePositiveIntegers(candidateDiseaseConceptIds);

  if (!resolvedGeneConceptIds.length) {
    return {
      existingLinksByGene: new Map(),
      ancestorDepthByDisease: new Map(),
      descendantDepthByDisease: new Map(),
      diseaseMetadataById: new Map()
    };
  }

  const existingLinksResult = await client.query(EXISTING_LINKS_QUERY, [resolvedGeneConceptIds]);
  const existingLinksByGene = new Map();
  const linkedDiseaseConceptIds = new Set(resolvedCandidateDiseaseConceptIds);

  for (const row of existingLinksResult.rows) {
    const geneConceptId = Number(row.gene_concept_id);
    const diseaseConceptId = Number(row.disease_concept_id);
    linkedDiseaseConceptIds.add(diseaseConceptId);
    if (!existingLinksByGene.has(geneConceptId)) {
      existingLinksByGene.set(geneConceptId, []);
    }
    existingLinksByGene.get(geneConceptId).push({
      diseaseConceptId,
      diseaseCurie: row.disease_curie,
      diseaseLabel: row.disease_label
    });
  }

  if (!linkedDiseaseConceptIds.size) {
    return {
      existingLinksByGene,
      ancestorDepthByDisease: new Map(),
      descendantDepthByDisease: new Map(),
      diseaseMetadataById: new Map()
    };
  }

  const closureResult = await client.query(DISEASE_RELATION_CLOSURE_QUERY, [
    [...linkedDiseaseConceptIds],
    resolvedOptions.maxDiseaseHierarchyDepth
  ]);
  const ancestorDepthByDisease = buildRelationshipDepthMap(closureResult.rows, 'ancestor');
  const descendantDepthByDisease = buildRelationshipDepthMap(closureResult.rows, 'descendant');

  const diseaseMetadataIds = new Set([...linkedDiseaseConceptIds]);
  for (const row of closureResult.rows) {
    diseaseMetadataIds.add(Number(row.related_concept_id));
  }

  const diseaseMetadataResult = await client.query(DISEASE_METADATA_QUERY, [[...diseaseMetadataIds]]);
  const diseaseMetadataById = new Map(
    diseaseMetadataResult.rows.map((row) => {
      const metadata = buildDiseaseMetadataFromRow(row);
      return [metadata.conceptId, metadata];
    })
  );

  return {
    existingLinksByGene,
    ancestorDepthByDisease,
    descendantDepthByDisease,
    diseaseMetadataById
  };
}

export function summarizeGeneDiseaseScientificExclusions(classifiedRows) {
  const bucketCounts = {};
  for (const row of classifiedRows) {
    bucketCounts[row.relationBucket] = (bucketCounts[row.relationBucket] || 0) + 1;
  }
  return bucketCounts;
}

export function buildGeneDiseaseExampleSummary(classifiedRow, maxExistingExamples = GENE_DISEASE_SCIENTIFIC_DEFAULTS.maxExistingExamples) {
  return {
    existingMatchExamples: dedupeStrings(
      [
        ...classifiedRow.exactMatches,
        ...classifiedRow.equivalentMatches,
        ...classifiedRow.ancestorMatches,
        ...classifiedRow.descendantMatches
      ],
      maxExistingExamples
    ).join(' | '),
    sharedFamilyExamples: dedupeStrings(classifiedRow.sharedAncestorMatches, maxExistingExamples).join(' | ')
  };
}

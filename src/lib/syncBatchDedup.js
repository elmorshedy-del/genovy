function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mergePayload(existingPayload, nextPayload) {
  if (isPlainObject(existingPayload) && isPlainObject(nextPayload)) {
    return {
      ...existingPayload,
      ...nextPayload
    };
  }

  return nextPayload ?? existingPayload ?? {};
}

export function dedupeRelationshipsByKey(relationships = []) {
  const relationshipByKey = new Map();

  for (const relationship of relationships) {
    relationshipByKey.set(relationship.relationshipKey, relationship);
  }

  return Array.from(relationshipByKey.values());
}

export function dedupeEvidenceRows(evidenceRows = []) {
  const evidenceByKey = new Map();

  for (const row of evidenceRows) {
    const evidenceKey = [
      row.relationshipId,
      row.sourceKey,
      row.sourceRecordKey || '',
      row.evidenceType,
      row.evidenceCode || ''
    ].join('|');

    const existing = evidenceByKey.get(evidenceKey);
    if (!existing) {
      evidenceByKey.set(evidenceKey, row);
      continue;
    }

    evidenceByKey.set(evidenceKey, {
      ...existing,
      ...row,
      syncRunId: row.syncRunId || existing.syncRunId,
      confidenceScore: row.confidenceScore ?? existing.confidenceScore,
      provenanceUrl: row.provenanceUrl || existing.provenanceUrl,
      payload: mergePayload(existing.payload, row.payload)
    });
  }

  return Array.from(evidenceByKey.values());
}

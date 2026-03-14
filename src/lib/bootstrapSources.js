export function shouldSkipCompletedSources(options = {}) {
  return options.skipCompletedSources !== false && options.includeCompletedSources !== true;
}

export function filterBootstrapSourceKeys(sourceKeys, successfulSourceKeys = [], options = {}) {
  if (!shouldSkipCompletedSources(options)) {
    return sourceKeys;
  }

  const successfulKeySet = new Set(successfulSourceKeys);
  return sourceKeys.filter((sourceKey) => !successfulKeySet.has(sourceKey));
}

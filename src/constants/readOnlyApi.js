export const READ_ONLY_API = Object.freeze({
  version: 'v1',
  basePath: '/api/v1',
  authScheme: 'Bearer',
  authHeader: 'Authorization',
  alternateAuthHeader: 'X-API-Key',
  tokenEnvVar: 'GENOVY_READONLY_API_TOKEN',
  docsPath: '/api/v1',
  openApiPath: '/api/v1/openapi.json'
});

export const READ_ONLY_API_ENDPOINTS = Object.freeze([
  {
    method: 'GET',
    path: '/api/v1',
    summary: 'API index and usage guidance',
    query: []
  },
  {
    method: 'GET',
    path: '/api/v1/openapi.json',
    summary: 'OpenAPI 3.1 document for the read-only surface',
    query: []
  },
  {
    method: 'GET',
    path: '/api/v1/health',
    summary: 'Service health and runtime flags',
    query: []
  },
  {
    method: 'GET',
    path: '/api/v1/platform/overview',
    summary: 'Runtime, source, sync, and graph summary overview',
    query: []
  },
  {
    method: 'GET',
    path: '/api/v1/knowledge/summary',
    summary: 'Top-level knowledge graph counts and canonical summary',
    query: []
  },
  {
    method: 'GET',
    path: '/api/v1/knowledge/search',
    summary: 'Search diseases, genes, phenotypes, variants, and trials',
    query: ['q', 'entityType', 'limit']
  },
  {
    method: 'GET',
    path: '/api/v1/knowledge/entities/:curie',
    summary: 'Load raw entity detail by CURIE',
    query: []
  },
  {
    method: 'GET',
    path: '/api/v1/knowledge/profiles/:curie',
    summary: 'Load clinical profile by disease CURIE',
    query: ['limit']
  },
  {
    method: 'GET',
    path: '/api/v1/knowledge/canonical/summary',
    summary: 'Canonical concept summary',
    query: []
  },
  {
    method: 'GET',
    path: '/api/v1/knowledge/canonical/search',
    summary: 'Search canonical concepts',
    query: ['q', 'conceptType', 'limit']
  },
  {
    method: 'GET',
    path: '/api/v1/knowledge/canonical/concepts/:conceptId',
    summary: 'Load canonical concept detail',
    query: []
  }
]);

import express from 'express';
import { READ_ONLY_API, READ_ONLY_API_ENDPOINTS } from '../constants/readOnlyApi.js';
import healthRouter from './health.js';
import knowledgeRouter from './knowledge.js';
import platformRouter from './platform.js';

function buildBaseUrl(req) {
  const protocol = String(req.get('x-forwarded-proto') || req.protocol || 'https')
    .split(',')[0]
    .trim();
  const host = String(req.get('x-forwarded-host') || req.get('host') || '')
    .split(',')[0]
    .trim();

  return `${protocol}://${host}`;
}

function buildExamples(baseUrl) {
  return Object.freeze({
    overview: `${baseUrl}/api/v1/platform/overview`,
    diseaseSearch: `${baseUrl}/api/v1/knowledge/search?q=Huntington%20disease&limit=3`,
    canonicalSearch: `${baseUrl}/api/v1/knowledge/canonical/search?q=STXBP1&limit=3`,
    profile: `${baseUrl}/api/v1/knowledge/profiles/MONDO:0007739`
  });
}

function buildApiIndex(req) {
  const baseUrl = buildBaseUrl(req);

  return {
    success: true,
    api: {
      name: 'Genovy Read-Only API',
      version: READ_ONLY_API.version,
      baseUrl: `${baseUrl}${READ_ONLY_API.basePath}`,
      auth: {
        type: 'token',
        scheme: READ_ONLY_API.authScheme,
        header: READ_ONLY_API.authHeader,
        alternateHeader: READ_ONLY_API.alternateAuthHeader
      },
      docs: {
        index: `${baseUrl}${READ_ONLY_API.docsPath}`,
        openapi: `${baseUrl}${READ_ONLY_API.openApiPath}`
      },
      endpoints: READ_ONLY_API_ENDPOINTS,
      examples: buildExamples(baseUrl)
    }
  };
}

function buildOpenApiSpec(req) {
  const baseUrl = buildBaseUrl(req);

  return {
    openapi: '3.1.0',
    info: {
      title: 'Genovy Read-Only API',
      version: READ_ONLY_API.version,
      description: 'Versioned, token-protected read-only surface for consultants and downstream analysis.'
    },
    servers: [
      {
        url: `${baseUrl}${READ_ONLY_API.basePath}`
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    },
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    paths: {
      '/': {
        get: {
          summary: 'API index',
          responses: {
            '200': {
              description: 'Read-only API index'
            }
          }
        }
      },
      '/openapi.json': {
        get: {
          summary: 'OpenAPI document',
          responses: {
            '200': {
              description: 'OpenAPI 3.1 JSON'
            }
          }
        }
      },
      '/health': {
        get: {
          summary: 'Health',
          responses: {
            '200': {
              description: 'Service health'
            }
          }
        }
      },
      '/platform/overview': {
        get: {
          summary: 'Platform overview',
          responses: {
            '200': {
              description: 'Runtime, sync, and knowledge summary overview'
            }
          }
        }
      },
      '/knowledge/summary': {
        get: {
          summary: 'Knowledge summary',
          responses: {
            '200': {
              description: 'Knowledge graph counts and canonical summary'
            }
          }
        }
      },
      '/knowledge/search': {
        get: {
          summary: 'Search raw entities',
          parameters: [
            { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'entityType', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } }
          ],
          responses: {
            '200': {
              description: 'Entity search results'
            }
          }
        }
      },
      '/knowledge/entities/{curie}': {
        get: {
          summary: 'Load raw entity detail',
          parameters: [{ name: 'curie', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Entity detail'
            }
          }
        }
      },
      '/knowledge/profiles/{curie}': {
        get: {
          summary: 'Load clinical profile',
          parameters: [
            { name: 'curie', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } }
          ],
          responses: {
            '200': {
              description: 'Clinical profile'
            }
          }
        }
      },
      '/knowledge/canonical/summary': {
        get: {
          summary: 'Canonical summary',
          responses: {
            '200': {
              description: 'Canonical summary'
            }
          }
        }
      },
      '/knowledge/canonical/search': {
        get: {
          summary: 'Search canonical concepts',
          parameters: [
            { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'conceptType', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } }
          ],
          responses: {
            '200': {
              description: 'Canonical search results'
            }
          }
        }
      },
      '/knowledge/canonical/concepts/{conceptId}': {
        get: {
          summary: 'Load canonical concept detail',
          parameters: [{ name: 'conceptId', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            '200': {
              description: 'Canonical concept detail'
            }
          }
        }
      }
    }
  };
}

const router = express.Router();

router.get('/', (req, res) => {
  res.json(buildApiIndex(req));
});

router.get('/docs', (req, res) => {
  res.json(buildApiIndex(req));
});

router.get('/openapi.json', (req, res) => {
  res.json(buildOpenApiSpec(req));
});

router.use('/health', healthRouter);
router.use('/platform', platformRouter);
router.use('/knowledge', knowledgeRouter);

export default router;

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ENV } from './config/env.js';
import healthRouter from './routes/health.js';
import adminSourcesRouter from './routes/adminSources.js';
import apiV1Router from './routes/apiV1.js';
import knowledgeRouter from './routes/knowledge.js';
import dxRouter from './routes/dx.js';
import platformRouter from './routes/platform.js';
import geneReviewsAuditRouter from './routes/geneReviewsAudit.js';
import { requireFeature } from './middleware/featureGate.js';
import { createReadOnlyApiAuth } from './middleware/readOnlyApiAuth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

export function createApp(runtimeStatus, options = {}) {
  const app = express();
  const readOnlyApiToken = options.readOnlyApiToken || ENV.readOnlyApiToken;
  app.use(express.json({ limit: '2mb' }));

  app.use('/health', healthRouter);
  app.use('/api/platform', platformRouter);
  app.use('/api/gene-reviews-audit', geneReviewsAuditRouter);
  app.use(
    '/api/v1',
    requireFeature(
      runtimeStatus.readOnlyApiReady,
      'Read-only API is unavailable until DATABASE_URL and GENOVY_READONLY_API_TOKEN are configured.'
    ),
    createReadOnlyApiAuth({ token: readOnlyApiToken }),
    apiV1Router
  );
  app.use(
    '/api/admin',
    requireFeature(
      runtimeStatus.adminApiReady,
      'Admin API is unavailable until DATABASE_URL and RARE_DISEASE_ADMIN_TOKEN are configured.'
    ),
    adminSourcesRouter
  );
  app.use(
    '/api/knowledge',
    requireFeature(
      runtimeStatus.knowledgeApiReady,
      'Knowledge API is unavailable until DATABASE_URL is configured.'
    ),
    knowledgeRouter
  );
  app.use(
    '/api/dx',
    requireFeature(
      runtimeStatus.knowledgeApiReady,
      'DX API is unavailable until DATABASE_URL is configured.'
    ),
    dxRouter
  );
  app.get('/platform', (_req, res) => {
    res.sendFile(path.join(publicDir, 'platform.html'));
  });
  app.get('/audit/genereviews', (_req, res) => {
    res.sendFile(path.join(publicDir, 'geneReviewsAudit.html'));
  });
  app.use(express.static(publicDir));

  app.use((error, _req, res, _next) => {
    console.error('[genovy] unhandled route error', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  });

  return app;
}

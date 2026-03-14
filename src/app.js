import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import healthRouter from './routes/health.js';
import adminSourcesRouter from './routes/adminSources.js';
import knowledgeRouter from './routes/knowledge.js';
import { requireFeature } from './middleware/featureGate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

export function createApp(runtimeStatus) {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.use('/health', healthRouter);
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

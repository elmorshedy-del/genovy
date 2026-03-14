import { createApp } from './app.js';
import { ENV, assertRequiredEnv } from './config/env.js';
import { runMigrations } from './db/migrate.js';
import { withClient } from './db/pool.js';
import { ensureSourceCatalog } from './repositories/sourceRepository.js';

async function start() {
  assertRequiredEnv();
  await runMigrations();
  await withClient((client) => ensureSourceCatalog(client));

  const app = createApp();
  app.listen(ENV.port, () => {
    console.log(`[genovy] listening on port ${ENV.port}`);
  });
}

start().catch((error) => {
  console.error('[genovy] startup failed', error);
  process.exit(1);
});

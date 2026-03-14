import { createApp } from './app.js';
import { ENV, SERVICE_FLAGS, getRuntimeStatus } from './config/env.js';
import { runMigrations } from './db/migrate.js';
import { withClient } from './db/pool.js';
import { ensureSourceCatalog } from './repositories/sourceRepository.js';

async function start() {
  const runtimeStatus = getRuntimeStatus();

  if (SERVICE_FLAGS.hasDatabase) {
    await runMigrations();
    await withClient((client) => ensureSourceCatalog(client));
  } else {
    console.warn(
      '[genovy] starting without DATABASE_URL; serving public website only until database configuration is added.'
    );
  }

  if (SERVICE_FLAGS.hasDatabase && !SERVICE_FLAGS.hasAdminToken) {
    console.warn(
      '[genovy] RARE_DISEASE_ADMIN_TOKEN is missing; admin sync routes will stay disabled until it is configured.'
    );
  }

  const app = createApp(runtimeStatus);
  app.listen(ENV.port, () => {
    console.log(`[genovy] listening on port ${ENV.port} in ${runtimeStatus.mode} mode`);
  });
}

start().catch((error) => {
  console.error('[genovy] startup failed', error);
  process.exit(1);
});

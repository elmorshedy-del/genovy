import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { assertRequiredEnv } from '../config/env.js';
import { withClient } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, 'migrations');

async function applyMigration(client, migrationName, sql) {
  const existing = await client.query(
    'SELECT 1 FROM schema_migrations WHERE migration_name = $1 LIMIT 1',
    [migrationName]
  );
  if (existing.rowCount) {
    return false;
  }

  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
      [migrationName]
    );
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export async function runMigrations() {
  assertRequiredEnv({ requireAdminToken: false });
  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();

  return withClient(async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        migration_name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const applied = [];
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      if (await applyMigration(client, file, sql)) {
        applied.push(file);
      }
    }
    return applied;
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then((applied) => {
      console.log(JSON.stringify({ applied }, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('[migrate] failed:', error);
      process.exit(1);
    });
}

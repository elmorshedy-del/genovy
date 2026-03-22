import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { assertRequiredEnv } from '../config/env.js';
import { withClient } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, 'migrations');

async function resolveMigrationNameColumn(client) {
  const result = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'schema_migrations'
      ORDER BY ordinal_position ASC
    `
  );

  const columnNames = new Set(result.rows.map((row) => row.column_name));
  if (columnNames.has('migration_name')) {
    return 'migration_name';
  }
  if (columnNames.has('version')) {
    return 'version';
  }
  return 'migration_name';
}

async function applyMigration(client, migrationName, sql, migrationNameColumn) {
  const existing = await client.query(
    `SELECT 1 FROM schema_migrations WHERE ${migrationNameColumn} = $1 LIMIT 1`,
    [migrationName]
  );
  if (existing.rowCount) {
    return false;
  }

    await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(
      `INSERT INTO schema_migrations (${migrationNameColumn}) VALUES ($1)`,
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
    const migrationNameColumn = await resolveMigrationNameColumn(client);

    const applied = [];
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      if (await applyMigration(client, file, sql, migrationNameColumn)) {
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

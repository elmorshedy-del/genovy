import { Pool } from 'pg';
import { ENV } from '../config/env.js';

let pool = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: ENV.databaseUrl,
      ssl: ENV.nodeEnv === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
}

export async function withClient(callback) {
  const client = await getPool().connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

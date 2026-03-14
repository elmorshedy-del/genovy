const DEFAULT_PORT = 3100;

function parsePort(rawValue) {
  const parsed = Number.parseInt(String(rawValue || DEFAULT_PORT), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

export const ENV = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parsePort(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL || '',
  adminToken: process.env.RARE_DISEASE_ADMIN_TOKEN || ''
});

export const SERVICE_FLAGS = Object.freeze({
  hasDatabase: Boolean(ENV.databaseUrl),
  hasAdminToken: Boolean(ENV.adminToken)
});

export function getServiceMode() {
  if (SERVICE_FLAGS.hasDatabase && SERVICE_FLAGS.hasAdminToken) {
    return 'full';
  }
  if (SERVICE_FLAGS.hasDatabase) {
    return 'knowledge_only';
  }
  return 'website_only';
}

export function getRuntimeStatus() {
  return {
    mode: getServiceMode(),
    publicSiteReady: true,
    knowledgeApiReady: SERVICE_FLAGS.hasDatabase,
    adminApiReady: SERVICE_FLAGS.hasDatabase && SERVICE_FLAGS.hasAdminToken
  };
}

export function assertRequiredEnv(options = {}) {
  const { requireAdminToken = true } = options;
  const missing = [];
  if (!ENV.databaseUrl) missing.push('DATABASE_URL');
  if (requireAdminToken && !ENV.adminToken) missing.push('RARE_DISEASE_ADMIN_TOKEN');
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

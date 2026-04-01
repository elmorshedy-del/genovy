const DEFAULT_PORT = 3100;

function parsePort(rawValue) {
  const parsed = Number.parseInt(String(rawValue || DEFAULT_PORT), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

function safeParseUrl(value) {
  try {
    return value ? new URL(value) : null;
  } catch {
    return null;
  }
}

function selectDatabaseUrl() {
  const privateUrl = process.env.DATABASE_URL || '';
  const publicUrl = process.env.DATABASE_PUBLIC_URL || '';
  const mode = String(process.env.GENOVY_DATABASE_URL_MODE || '').trim().toLowerCase();

  if (mode === 'public') return publicUrl || privateUrl;
  if (mode === 'private') return privateUrl || publicUrl;

  const privateParsed = safeParseUrl(privateUrl);
  if (
    process.platform === 'darwin' &&
    privateParsed?.hostname?.endsWith('.railway.internal') &&
    publicUrl
  ) {
    return publicUrl;
  }
  return privateUrl || publicUrl;
}

function shouldUseDatabaseSsl(connectionString) {
  const parsed = safeParseUrl(connectionString);
  const sslMode = parsed?.searchParams?.get('sslmode');
  if (sslMode && sslMode.toLowerCase() === 'require') return true;
  if (parsed?.hostname?.endsWith('.proxy.rlwy.net')) return true;
  return process.env.NODE_ENV === 'production';
}

const databaseUrl = selectDatabaseUrl();

export const ENV = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parsePort(process.env.PORT),
  databaseUrl,
  databaseUsesSsl: shouldUseDatabaseSsl(databaseUrl),
  adminToken: process.env.RARE_DISEASE_ADMIN_TOKEN || '',
  readOnlyApiToken: process.env.GENOVY_READONLY_API_TOKEN || '',
  geneReviewsAuditManifestDir:
    process.env.GENOVY_GR_AUDIT_MANIFEST_DIR ||
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-latest5-settled-20260330/stage6_manifest_medgemma',
  geneReviewsAuditVerifyDir:
    process.env.GENOVY_GR_AUDIT_VERIFY_DIR ||
    '/Users/ahmedelmorshedy/Genovy-phenotype-enrichment-20260316-0914/output/genereviews-pipeline-latest5-settled-20260330/stage7_verify_medgemma'
});

export const SERVICE_FLAGS = Object.freeze({
  hasDatabase: Boolean(ENV.databaseUrl),
  hasAdminToken: Boolean(ENV.adminToken),
  hasReadOnlyApiToken: Boolean(ENV.readOnlyApiToken)
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
    adminApiReady: SERVICE_FLAGS.hasDatabase && SERVICE_FLAGS.hasAdminToken,
    readOnlyApiReady: SERVICE_FLAGS.hasDatabase && SERVICE_FLAGS.hasReadOnlyApiToken
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

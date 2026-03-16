import { READ_ONLY_API } from '../constants/readOnlyApi.js';

function extractBearerToken(authorizationHeader) {
  const rawHeader = String(authorizationHeader || '').trim();
  if (!rawHeader) {
    return '';
  }

  const [scheme, value] = rawHeader.split(/\s+/, 2);
  if (!scheme || !value || scheme.toLowerCase() !== 'bearer') {
    return '';
  }

  return value.trim();
}

export function createReadOnlyApiAuth({ token }) {
  return function readOnlyApiAuth(req, res, next) {
    const providedToken =
      extractBearerToken(req.get('authorization')) || String(req.get('x-api-key') || '').trim();

    if (providedToken && token && providedToken === token) {
      return next();
    }

    return res.status(401).json({
      success: false,
      error: 'Unauthorized.',
      auth: {
        scheme: READ_ONLY_API.authScheme,
        header: READ_ONLY_API.authHeader,
        alternateHeader: READ_ONLY_API.alternateAuthHeader
      }
    });
  };
}

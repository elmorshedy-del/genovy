import { ENV } from '../config/env.js';

export function requireAdminToken(req, res, next) {
  const token = req.get('x-admin-token') || '';
  if (!token || token !== ENV.adminToken) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }
  return next();
}

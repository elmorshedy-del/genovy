export function requireFeature(enabled, message) {
  return function featureGate(_req, res, next) {
    if (!enabled) {
      return res.status(503).json({
        success: false,
        error: message
      });
    }
    return next();
  };
}

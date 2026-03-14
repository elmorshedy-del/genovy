import express from 'express';
import { getRuntimeStatus } from '../config/env.js';

const router = express.Router();

router.get('/', (_req, res) => {
  const runtime = getRuntimeStatus();
  res.json({
    success: true,
    status: runtime.publicSiteReady ? 'ok' : 'degraded',
    service: 'genovy',
    runtime
  });
});

export default router;

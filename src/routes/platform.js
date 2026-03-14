import express from 'express';
import { loadPlatformOverview } from '../services/platformOverviewService.js';

const router = express.Router();

router.get('/overview', async (_req, res) => {
  const overview = await loadPlatformOverview();
  res.json({
    success: true,
    overview
  });
});

export default router;

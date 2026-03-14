import express from 'express';
import { withClient } from '../db/pool.js';
import { getEntityDetail, listKnowledgeSummary } from '../repositories/knowledgeRepository.js';

const router = express.Router();

router.get('/summary', async (_req, res) => {
  try {
    const summary = await withClient((client) => listKnowledgeSummary(client));
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to load summary.' });
  }
});

router.get('/entities/:curie', async (req, res) => {
  try {
    const detail = await withClient((client) => getEntityDetail(client, req.params.curie));
    if (!detail) {
      return res.status(404).json({ success: false, error: 'Entity not found.' });
    }
    return res.json({ success: true, detail });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load entity.' });
  }
});

export default router;

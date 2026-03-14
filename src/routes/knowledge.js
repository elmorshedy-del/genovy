import express from 'express';
import { withClient } from '../db/pool.js';
import { getEntityDetail, listKnowledgeSummary, searchKnowledgeEntities } from '../repositories/knowledgeRepository.js';

const router = express.Router();
const SEARCH_QUERY_MIN_LENGTH = 2;
const SEARCH_QUERY_MAX_LENGTH = 80;
const SEARCH_LIMIT_DEFAULT = 8;

router.get('/summary', async (_req, res) => {
  try {
    const summary = await withClient((client) => listKnowledgeSummary(client));
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to load summary.' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    const entityType = String(req.query.entityType || '').trim();
    const limit = Number.parseInt(String(req.query.limit || SEARCH_LIMIT_DEFAULT), 10);

    if (!query || query.length < SEARCH_QUERY_MIN_LENGTH) {
      return res.json({ success: true, results: [] });
    }

    if (query.length > SEARCH_QUERY_MAX_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Search query must be ${SEARCH_QUERY_MAX_LENGTH} characters or fewer.`
      });
    }

    const results = await withClient((client) =>
      searchKnowledgeEntities(client, {
        query,
        entityType,
        limit
      })
    );
    return res.json({ success: true, results });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to search entities.' });
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

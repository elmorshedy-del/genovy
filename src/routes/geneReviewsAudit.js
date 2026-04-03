import express from 'express';
import {
  loadGeneReviewsAuditChapter,
  loadGeneReviewsAuditIndex,
  loadGeneReviewsRunStatus
} from '../services/geneReviewsAuditService.js';

const router = express.Router();

router.get('/index', async (_req, res) => {
  const index = await loadGeneReviewsAuditIndex();
  res.json({
    success: true,
    ...index
  });
});

router.get('/chapters/:chapterKey', async (req, res) => {
  const chapter = await loadGeneReviewsAuditChapter(req.params.chapterKey);
  if (!chapter) {
    res.status(404).json({
      success: false,
      error: 'GeneReviews audit chapter not found.'
    });
    return;
  }
  res.json({
    success: true,
    ...chapter
  });
});

router.get('/run-status', async (req, res) => {
  const payload = await loadGeneReviewsRunStatus(req.query.run);
  res.json({
    success: true,
    ...payload
  });
});

export default router;

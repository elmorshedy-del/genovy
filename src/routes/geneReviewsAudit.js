import express from 'express';
import { loadGeneReviewsAuditChapter, loadGeneReviewsAuditIndex } from '../services/geneReviewsAuditService.js';

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

export default router;

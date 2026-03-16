import express from 'express';
import { withClient } from '../db/pool.js';
import { extractDxPhenotypeInput, parseDxLimit, validateDxPhenotypeInput } from '../lib/phenopackets.js';
import {
  loadDxSimilarityIndex,
  rankDiseasesByPhenotypeSimilarity,
  rankGenesByPhenotypeSimilarity
} from '../services/dx/similarityEngine.js';

const router = express.Router();

router.post('/rank', async (req, res) => {
  try {
    const input = extractDxPhenotypeInput(req.body || {});
    const validationError = validateDxPhenotypeInput(input);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const ranking = await withClient(async (client) => {
      const index = await loadDxSimilarityIndex(client);
      return rankDiseasesByPhenotypeSimilarity(index, {
        phenotypeCuries: input.presentPhenotypeCuries,
        limit: parseDxLimit(req.body?.limit)
      });
    });

    return res.json({
      success: true,
      engine: 'genovy-dx-sim',
      input,
      ranking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to rank diseases.'
    });
  }
});

router.post('/rank-genes', async (req, res) => {
  try {
    const input = extractDxPhenotypeInput(req.body || {});
    const validationError = validateDxPhenotypeInput(input);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const ranking = await withClient(async (client) => {
      const index = await loadDxSimilarityIndex(client);
      return rankGenesByPhenotypeSimilarity(index, {
        phenotypeCuries: input.presentPhenotypeCuries,
        limit: parseDxLimit(req.body?.limit)
      });
    });

    return res.json({
      success: true,
      engine: 'genovy-dx-sim',
      analysisType: 'gene',
      input,
      ranking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to rank genes.'
    });
  }
});

export default router;

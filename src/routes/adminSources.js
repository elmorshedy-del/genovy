import express from 'express';
import { requireAdminToken } from '../middleware/adminAuth.js';
import { withClient } from '../db/pool.js';
import { getSyncRunById, listSourcesWithState, listSyncRuns, updateSourceActivation } from '../repositories/sourceRepository.js';
import {
  bootstrapKnowledgeNetwork,
  listActiveSourceSyncs,
  queueBootstrapKnowledgeNetwork,
  queueSourceSync,
  syncSource
} from '../services/sourceSyncService.js';
import { rebuildCanonicalLayer } from '../services/canonicalResolutionService.js';

const router = express.Router();

router.use(requireAdminToken);

async function setSourceActivation(req, res, isActive) {
  try {
    const source = await withClient((client) => updateSourceActivation(client, req.params.sourceKey, isActive));
    if (!source) {
      return res.status(404).json({ success: false, error: 'Source not found.' });
    }
    return res.json({ success: true, source });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to update source state.' });
  }
}

router.get('/sources', async (_req, res) => {
  try {
    const sources = await withClient((client) => listSourcesWithState(client));
    res.json({ success: true, sources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to list sources.' });
  }
});

router.get('/sync-runs', async (req, res) => {
  try {
    const runs = await withClient((client) =>
      listSyncRuns(client, {
        sourceKey: String(req.query.sourceKey || ''),
        limit: Number.parseInt(String(req.query.limit || '20'), 10)
      })
    );
    res.json({ success: true, runs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to list sync runs.' });
  }
});

router.get('/sync-runs/:syncRunId', async (req, res) => {
  try {
    const run = await withClient((client) => getSyncRunById(client, req.params.syncRunId));
    if (!run) {
      return res.status(404).json({ success: false, error: 'Sync run not found.' });
    }
    return res.json({ success: true, run });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load sync run.' });
  }
});

router.get('/active-syncs', (_req, res) => {
  res.json({
    success: true,
    activeSyncs: listActiveSourceSyncs()
  });
});

router.patch('/sources/:sourceKey', async (req, res) => {
  const { isActive } = req.body || {};
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ success: false, error: 'Request body must include boolean isActive.' });
  }
  return setSourceActivation(req, res, isActive);
});

router.post('/sources/:sourceKey/enable', async (req, res) => setSourceActivation(req, res, true));

router.post('/sources/:sourceKey/disable', async (req, res) => setSourceActivation(req, res, false));

router.post('/sources/:sourceKey/sync', async (req, res) => {
  try {
    const result = await syncSource(req.params.sourceKey, req.body || {}, 'admin_api');
    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message || 'Sync failed.' });
  }
});

router.post('/sources/:sourceKey/sync/async', async (req, res) => {
  try {
    const result = await queueSourceSync(req.params.sourceKey, req.body || {}, 'admin_api');
    res.status(202).json({ success: true, result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message || 'Sync queue failed.' });
  }
});

router.post('/bootstrap', async (req, res) => {
  try {
    const results = await bootstrapKnowledgeNetwork(req.body || {}, 'admin_api');
    res.json({ success: true, results });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message || 'Bootstrap failed.' });
  }
});

router.post('/bootstrap/async', async (req, res) => {
  try {
    const results = await queueBootstrapKnowledgeNetwork(req.body || {}, 'admin_api');
    res.status(202).json({ success: true, results });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message || 'Bootstrap queue failed.' });
  }
});

router.post('/canonical/rebuild', async (req, res) => {
  try {
    const result = await rebuildCanonicalLayer({
      triggerMode: 'admin_api',
      requestedBy: 'admin_api',
      options: req.body || {}
    });
    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message || 'Canonical rebuild failed.' });
  }
});

export default router;

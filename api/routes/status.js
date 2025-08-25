// api/routes/status.js
const express = require('express');
const axios = require('axios');

const router = express.Router();

const PROVIDER  = process.env.MUSIC_PROVIDER || 'sunoapi_org';
const SUNO_BASE = process.env.SUNOAPI_ORG_BASE_URL;       // e.g. https://api.sunoapi.org/api/v1
const SUNO_GEN  = process.env.SUNOAPI_ORG_GENERATE_PATH;  // e.g. /generate

async function pingSuno() {
  const url = `${SUNO_BASE || ''}${SUNO_GEN || ''}`;
  if (!SUNO_BASE || !SUNO_GEN) {
    return { ok: false, status: 0, url, error: 'missing_env' };
  }
  try {
    const res = await axios.options(url, { timeout: 4000, validateStatus: () => true });
    return { ok: res.status >= 200 && res.status < 400, status: res.status, url };
  } catch (e) {
    return { ok: false, status: e.response?.status ?? 0, url, error: 'network_error' };
  }
}

/* ---------- STATIC ROUTES (must be before any "/:id") ---------- */

// GET /api/status  -> simple backend health
router.get('/', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime(), provider: PROVIDER });
});

// GET /api/status/provider  -> provider (Suno) reachability
router.get('/provider', async (_req, res) => {
  if (PROVIDER !== 'sunoapi_org') return res.json({ provider: PROVIDER, ok: true, note: 'not_suno' });
  const info = await pingSuno();
  res.json({ provider: 'sunoapi_org', ...info });
});

// GET /api/status/music  -> alias used by your frontend; same as /provider
router.get('/music', async (_req, res) => {
  if (PROVIDER !== 'sunoapi_org') return res.json({ provider: PROVIDER, ok: true, note: 'not_suno' });
  const info = await pingSuno();
  res.json({ provider: 'sunoapi_org', ...info });
});

/* ---------- (Optional) REQUEST STATUS by ID ---------- */
/* If you need to keep your old "status-by-id" endpoint, put it LAST so it
   does NOT swallow "/provider" or "/music". Adjust to your store API. */

router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    // Example: read from your requestStore (adapt to your real code)
    const store = require('../lib/requestStore'); // path may differ in your project
    const rec = await store.get(id);

    if (!rec) {
      return res.status(404).json({
        error: 'Request not found',
        message: `No request found with ID: ${id}`,
        hint: 'This could mean the request was never persisted or the ID is incorrect',
      });
    }

    // Return whatever your frontend expects for a job status:
    res.json({
      status: rec.status || 'processing',
      audioUrl: rec.audioUrl ?? null,
      progress: rec.progress ?? 0,
      message: rec.message ?? null,
    });
  } catch (e) {
    res.status(500).json({ error: 'status_lookup_failed', message: e.message });
  }
});

module.exports = router;

// api/routes/status.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

const PROVIDER  = process.env.MUSIC_PROVIDER || 'sunoapi_org';
const SUNO_BASE = process.env.SUNOAPI_ORG_BASE_URL;       // e.g. https://api.sunoapi.org/api/v1
const SUNO_GEN  = process.env.SUNOAPI_ORG_GENERATE_PATH;  // e.g. /generate

async function pingSuno() {
  const url = `${SUNO_BASE || ''}${SUNO_GEN || ''}`;
  if (!SUNO_BASE || !SUNO_GEN) return { ok: false, status: 0, url, error: 'missing_env' };
  try {
    const res = await axios.options(url, { timeout: 4000, validateStatus: () => true });
    return { ok: res.status >= 200 && res.status < 400, status: res.status, url };
  } catch (e) {
    return { ok: false, status: e.response?.status ?? 0, url, error: 'network_error' };
  }
}

// GET /api/status
router.get('/', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime(), provider: PROVIDER });
});

// GET /api/status/provider
router.get('/provider', async (_req, res) => {
  if (PROVIDER !== 'sunoapi_org') return res.json({ provider: PROVIDER, ok: true, note: 'not_suno' });
  const info = await pingSuno();
  res.json({ provider: 'sunoapi_org', ...info });
});

// GET /api/status/music  (frontend alias)
router.get('/music', async (_req, res) => {
  if (PROVIDER !== 'sunoapi_org') return res.json({ provider: PROVIDER, ok: true, note: 'not_suno' });
  const info = await pingSuno();
  res.json({ provider: 'sunoapi_org', ...info });
});

module.exports = router;

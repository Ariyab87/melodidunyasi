// api/routes/status.js
const express = require('express');
const axios = require('axios');

const router = express.Router();

const PROVIDER  = process.env.MUSIC_PROVIDER || 'sunoapi_org';
const SUNO_BASE = process.env.SUNOAPI_ORG_BASE_URL || '';       // e.g. https://api.sunoapi.org/api/v1
const SUNO_GEN  = process.env.SUNOAPI_ORG_GENERATE_PATH || '';  // e.g. /generate

const PING_URL  = `${SUNO_BASE}${SUNO_GEN}`;

// Lightweight reachability probe for Suno
async function pingSuno() {
  if (!SUNO_BASE || !SUNO_GEN) {
    return { ok: false, status: 0, url: PING_URL, error: 'missing_env' };
  }

  try {
    // use axios.request for widest compatibility
    const res = await axios.request({
      method: 'OPTIONS',           // just a ping; no billing
      url: PING_URL,
      timeout: 3000,
      validateStatus: () => true,  // treat any HTTP code as a response
    });
    return {
      ok: res.status >= 200 && res.status < 400,
      status: res.status,
      url: PING_URL,
    };
  } catch (e) {
    // NEVER throw out of here — always return a JSON result
    return {
      ok: false,
      status: 0,
      url: PING_URL,
      error: e.code || 'network_error',
      message: e.message,
    };
  }
}

/* ---------- STATIC ROUTES (registered before any "/:id") ---------- */

// GET /api/status  -> backend health
router.get('/', (_req, res) => {
  try {
    res.json({ ok: true, uptime: process.uptime(), provider: PROVIDER });
  } catch {
    res.json({ ok: true }); // still never 5xx
  }
});

// GET /api/status/provider  -> suno reachability
router.get('/provider', async (_req, res) => {
  try {
    if (PROVIDER !== 'sunoapi_org') return res.json({ ok: true, provider: PROVIDER, note: 'not_suno' });
    const r = await pingSuno();
    // Ensure "ok" is present for the frontend
    return res.json(r);
  } catch (e) {
    return res.json({ ok: false, error: 'handler_exception', message: e.message });
  }
});

// GET /api/status/music  -> alias used by frontend
router.get('/music', async (_req, res) => {
  try {
    if (PROVIDER !== 'sunoapi_org') return res.json({ ok: true, provider: PROVIDER, note: 'not_suno' });
    const r = await pingSuno();
    return res.json(r);
  } catch (e) {
    return res.json({ ok: false, error: 'handler_exception', message: e.message });
  }
});

/* ---------- OPTIONAL: job status by id (keep LAST) ---------- */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    // If you actually use a store, adapt this block. Otherwise you can remove it.
    const store = require('../lib/requestStore');
    const rec = await store.get(id);
    if (!rec) {
      return res.status(404).json({
        error: 'Request not found',
        message: `No request found with ID: ${id}`,
        hint: 'This could mean the request was never persisted or the ID is incorrect',
      });
    }
    return res.json({
      status: rec.status || 'processing',
      audioUrl: rec.audioUrl ?? null,
      progress: rec.progress ?? 0,
      message: rec.message ?? null,
    });
  } catch (e) {
    return res.status(200).json({ ok: false, error: 'status_lookup_failed', message: e.message });
  }
});

module.exports = router;

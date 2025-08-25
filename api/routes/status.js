// api/routes/status.js
const express = require("express");
const axios = require("axios");

const router = express.Router();

const MUSIC_PROVIDER = process.env.MUSIC_PROVIDER || "sunoapi_org";

// --- Suno (sunoapi_org) config from .env
const SUNO_BASE = process.env.SUNOAPI_ORG_BASE_URL;          // e.g. https://api.sunoapi.org/api/v1
const SUNO_GEN  = process.env.SUNOAPI_ORG_GENERATE_PATH;     // e.g. /generate

// Lightweight reachability probe (no charge): OPTIONS /generate
async function pingSuno() {
  const url = `${SUNO_BASE}${SUNO_GEN}`;
  try {
    const res = await axios.options(url, { timeout: 4000, validateStatus: () => true });
    return {
      ok: res.status >= 200 && res.status < 400,
      status: res.status,
      url,
    };
  } catch (err) {
    return {
      ok: false,
      status: err.response?.status ?? 0,
      url,
      error: "network_error",
    };
  }
}

// API health of *our* backend
router.get("/", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime(), provider: MUSIC_PROVIDER });
});

// Provider status (used by frontend)
router.get("/provider", async (_req, res) => {
  try {
    if (MUSIC_PROVIDER !== "sunoapi_org") {
      return res.json({ provider: MUSIC_PROVIDER, ok: true, note: "not-suno" });
    }
    const r = await pingSuno();
    return res.json({ provider: "sunoapi_org", ...r });
  } catch (e) {
    return res.json({ provider: "sunoapi_org", ok: false, status: 0, error: "ping_exception" });
  }
});

// Alias for backward compatibility (used by frontend)
router.get("/music", async (_req, res) => {
  try {
    if (MUSIC_PROVIDER !== "sunoapi_org") {
      return res.json({ provider: MUSIC_PROVIDER, ok: true, note: "not-suno" });
    }
    const r = await pingSuno();
    return res.json({ provider: "sunoapi_org", ...r });
  } catch (e) {
    return res.json({ provider: "sunoapi_org", ok: false, status: 0, error: "ping_exception" });
  }
});

module.exports = router;

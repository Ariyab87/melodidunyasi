// api/routes/debug.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const axios = require('axios');

/**
 * GET /api/debug/ping
 */
router.get('/debug/ping', (_req, res) => {
  res.json({ ok: true, ping: 'pong', timestamp: new Date().toISOString() });
});

/**
 * POST /api/debug/echo
 */
router.post('/debug/echo', (req, res) => {
  res.json({
    method: req.method,
    path: req.path,
    origin: req.headers.origin || null,
    headers: req.headers,
    bodyKeys: Object.keys(req.body || {}),
    body: req.body || null,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/debug/env
 */
router.get('/debug/env', (_req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV || null,
    MUSIC_PROVIDER: process.env.MUSIC_PROVIDER || null,
    CORS_ORIGINS: process.env.CORS_ORIGINS || null,
    BACKEND_PUBLIC_URL: process.env.BACKEND_PUBLIC_URL || null,
    FRONTEND_URL: process.env.FRONTEND_URL || null,
    SUNOAPI_ORG_BASE_URL: process.env.SUNOAPI_ORG_BASE_URL || null,
    SUNOAPI_ORG_API_KEY_present: !!process.env.SUNOAPI_ORG_API_KEY,
  });
});

/**
 * GET /api/debug/suno-last
 */
router.get('/debug/suno-last', (_req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads/last_suno_response.json');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'No Suno response file found',
        message: 'No songs have been generated yet, or the response file was not saved',
      });
    }
    const responseData = fs.readFileSync(filePath, 'utf8');
    const parsedData = JSON.parse(responseData);
    res.status(200).json({
      success: true,
      message: 'Last Suno API response retrieved',
      data: parsedData,
      fileInfo: {
        path: filePath,
        size: fs.statSync(filePath).size,
        lastModified: fs.statSync(filePath).mtime,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to read response file', message: error.message });
  }
});

/**
 * GET /api/debug/suno-status
 * Shows both legacy SUNO_* and current SUNOAPI_ORG_* variables.
 */
router.get('/debug/suno-status', (_req, res) => {
  const orgKey = process.env.SUNOAPI_ORG_API_KEY || '';
  const legacyKey = process.env.SUNO_API_KEY || '';
  const mask = (k) => (k && k.length >= 8 ? `${k.slice(0, 4)}...${k.slice(-4)}` : (k ? '***' : 'N/A'));

  res.status(200).json({
    success: true,
    message: 'Suno service status',
    data: {
      org: {
        baseUrl: process.env.SUNOAPI_ORG_BASE_URL || 'https://api.sunoapi.org/api/v1',
        keyPresent: !!orgKey,
        keyMask: mask(orgKey),
        generatePath: process.env.SUNOAPI_ORG_GENERATE_PATH || '/generate',
        recordInfoPath: process.env.SUNOAPI_ORG_RECORDINFO_PATH || '/generate/record-info',
      },
      legacy: {
        baseUrl: process.env.SUNO_BASE_URL || 'https://api.suno.ai',
        keyPresent: !!legacyKey,
        keyMask: mask(legacyKey),
      },
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/debug/suno-auth
 */
router.get('/debug/suno-auth', (_req, res) => {
  const sunoKey = process.env.SUNOAPI_ORG_API_KEY || '';
  const hasKey = !!sunoKey;
  const keyMask = hasKey && sunoKey.length >= 8 ? `${sunoKey.substring(0, 4)}...${sunoKey.substring(sunoKey.length - 4)}` : '***';
  const baseUrl = process.env.SUNOAPI_ORG_BASE_URL || 'https://api.sunoapi.org/api/v1';
  const generatePath = process.env.SUNOAPI_ORG_GENERATE_PATH || '/generate';
  const recordInfoPath = process.env.SUNOAPI_ORG_RECORDINFO_PATH || '/generate/record-info';

  res.status(200).json({
    success: true,
    message: 'SunoAPI.org authentication debug info',
    data: { hasKey, keyMask, baseUrl, generatePath, recordInfoPath },
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/debug/test-suno-auth
 * Minimal POST to /generate using BOTH auth header styles.
 */
router.post('/debug/test-suno-auth', async (_req, res) => {
  try {
    const apiKey = process.env.SUNOAPI_ORG_API_KEY;
    const baseUrl = (process.env.SUNOAPI_ORG_BASE_URL || 'https://api.sunoapi.org/api/v1').replace(/\/$/, '');
    if (!apiKey) {
      return res.status(400).json({ success: false, error: 'No API key configured', message: 'SUNOAPI_ORG_API_KEY is missing' });
    }

    const response = await axios.post(`${baseUrl}/generate`,
      { prompt: 'SongCreator auth test', duration: 30 },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
        validateStatus: () => true,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Auth request completed',
      status: response.status,
      data: response.data,
      baseUrl,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication test failed',
      message: error.message,
      details: {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      },
    });
  }
});

/**
 * GET /api/debug/uploads
 */
router.get('/debug/uploads', (_req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    const audioDir = path.join(uploadsDir, 'audio');
    const safeRead = (p) => (fs.existsSync(p) ? fs.readdirSync(p) : []);

    const files = {
      uploads: safeRead(uploadsDir),
      audio: safeRead(audioDir),
      lastSunoResponseBytes: fs.existsSync(path.join(uploadsDir, 'last_suno_response.json'))
        ? fs.statSync(path.join(uploadsDir, 'last_suno_response.json')).size
        : 0,
    };

    res.status(200).json({ success: true, message: 'Uploads directory contents', data: files });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to read uploads directory', message: error.message });
  }
});

/**
 * GET /api/debug/suno-auth-check
 * Quick connectivity probe (performs POST to /generate behind the scenes).
 */
router.get('/debug/suno-auth-check', async (_req, res) => {
  const base = (process.env.SUNOAPI_ORG_BASE_URL || '').replace(/\/$/, '');
  const gen = process.env.SUNOAPI_ORG_GENERATE_PATH || '/generate';
  const url = `${base || 'https://api.sunoapi.org/api/v1'}${gen.startsWith('/') ? gen : `/${gen}`}`;

  try {
    const r = await axios.post(
      url,
      { prompt: 'SongCreator connectivity test' },
      {
        headers: {
          Authorization: `Bearer ${process.env.SUNOAPI_ORG_API_KEY || ''}`,
          'x-api-key': process.env.SUNOAPI_ORG_API_KEY || '',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
        validateStatus: () => true,
      }
    );
    return res.json({ ok: true, status: r.status, url, data: r.data });
  } catch (e) {
    return res.json({ ok: false, status: 0, url, error: e.message });
  }
});

module.exports = router;

// api/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ---- DIAGNOSTICS (don’t print secrets) ----
console.log(
  '[ENV] MUSIC_PROVIDER:', process.env.MUSIC_PROVIDER,
  '| SUNO KEY present:', !!process.env.SUNOAPI_ORG_API_KEY
);

/* ============================ CORS (MUST BE FIRST) ============================ */
const envOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const fallbackOrigins = [
  'https://melodidunyasi.com',
  'https://www.melodidunyasi.com',
  'http://localhost:3000',
  'http://localhost:3001',
];

const allowedOrigins = [...new Set([...envOrigins, ...fallbackOrigins])];
console.log('[CORS] Allowed origins:', allowedOrigins);

// manual preflight handler to guarantee headers even if something else misbehaves
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isAllowed = !origin || allowedOrigins.includes(origin);

  if (isAllowed) {
    // Always reflect the origin (so credentials can work)
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin'); // make proxies cache by Origin
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept'
    );
    // Optional: expose a couple of useful headers
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Length');
  }

  if (req.method === 'OPTIONS') {
    // Short-circuit preflights here with 204
    return res.sendStatus(204);
  }

  if (!isAllowed) {
    return res.status(403).json({ error: 'CORS blocked', origin });
  }

  return next();
});

// keep cors() too (harmless; helps with edge cases)
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('CORS blocked'));
    },
    credentials: true,
  })
);
/* ========================== END CORS (MUST BE FIRST) ========================== */

/* ----------------------------- Parsers ----------------------------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* -------------------------- SUNO callback -------------------------- */
app.post(['/callback/suno', '/api/callback/suno'], async (req, res) => {
  try {
    console.log('[SUNO CALLBACK]', JSON.stringify(req.body));
    const payload = req.body || {};
    const jobId = payload.jobId || payload.taskId || payload.id || payload.data?.taskId || payload.data?.id || null;
    const recordId = payload.recordId || payload.data?.recordId || payload.data?.id || null;

    if (jobId || recordId) {
      const store = require('./lib/requestStore');
      const all = await store.list();
      const record = all.find(r => r.providerJobId === jobId || (recordId && r.providerRecordId === recordId));

      if (record) {
        const audioUrl =
          payload.audioUrl || payload.audio_url || payload.url ||
          payload.data?.audioUrl || payload.data?.audio_url ||
          payload.data?.audio?.url || (payload.data?.files?.[0]?.url) || null;

        const status =
          payload.status || payload.state || payload.jobStatus ||
          payload.data?.status || (audioUrl ? 'completed' : 'processing');

        const patch = { status, updatedAt: new Date().toISOString() };
        if (recordId && !record.providerRecordId) patch.providerRecordId = recordId;
        if (audioUrl) patch.audioUrl = audioUrl;

        await store.update(record.id, patch);
        await store.saveNow();

        console.info('[CALLBACK] Updated %s -> %s (audio: %s)', record.id, status, audioUrl ? 'yes' : 'no');
      } else {
        console.warn('[CALLBACK] No matching record for jobId=%s recordId=%s', jobId, recordId);
      }
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[CALLBACK] Error:', err.message);
    return res.status(200).json({ ok: true });
  }
});

/* ------------------------------ Health ------------------------------ */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), env: process.env.NODE_ENV || 'development' });
});

/* ------------------------------ Routes ------------------------------ */
const songRoutes     = require('./routes/songRoutes');
const voiceRoutes    = require('./routes/voiceRoutes');
const videoRoutes    = require('./routes/videoRoutes');
const uploadRoutes   = require('./routes/uploadRoutes');
const adminRoutes    = require('./routes/adminRoutes');
const debugRoutes    = require('./routes/debug');
const statusRoutes   = require('./routes/status');
const downloadRoutes = require('./routes/downloadRoutes');

/**
 * Mount status under a fixed base FIRST to avoid collisions with any `/:id` routes.
 */
app.use('/api/status', statusRoutes);   // -> /api/status, /api/status/provider, /api/status/music

// Mount the rest under /api
app.use('/api', songRoutes);
app.use('/api', voiceRoutes);
app.use('/api', videoRoutes);
app.use('/api', uploadRoutes);
app.use('/api', adminRoutes);
app.use('/api', debugRoutes);
app.use('/api', downloadRoutes);

/* ----------------------- Initialize request store ----------------------- */
const store = require('./lib/requestStore');
(async () => {
  try {
    await store.init();
    console.log('[STORE] Initialized');
  } catch (e) {
    console.error('[STORE] Init failed:', e.message);
  }
})();

/* ----------------------------- Error handler ---------------------------- */
app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  if (err?.type === 'entity.too.large' || err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large', message: 'The uploaded file exceeds the maximum allowed size.' });
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

/* -------------------------------- 404 -------------------------------- */
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', message: `The requested route ${req.originalUrl} does not exist.` });
});

module.exports = app;

/* ------------------------------ Start ------------------------------ */
if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log('API listening on', PORT);
    console.log(`Env: ${process.env.NODE_ENV || 'development'}`);
    const baseUrl = process.env.BACKEND_PUBLIC_URL || process.env.FRONTEND_URL || `http://localhost:${PORT}`;
    console.log(`Health: ${baseUrl}/health`);
  });
}

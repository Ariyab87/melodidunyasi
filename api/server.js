// api/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

/* ------------------------- CORS ------------------------- */
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

const allOrigins = [...new Set([...envOrigins, ...fallbackOrigins])];
console.log('[CORS] Allowed origins:', allOrigins);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allOrigins.includes(origin)) return cb(null, true);
    console.log('[CORS] Blocked:', origin);
    return cb(new Error('CORS blocked'));
  },
  credentials: true,
}));

/* -------------------- Parsers -------------------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ------------------ SUNO callback ---------------- */
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

/* ---------------------- Health ---------------------- */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), env: process.env.NODE_ENV || 'development' });
});

/* ---------------------- Routes ---------------------- */
const songRoutes     = require('./routes/songRoutes');
const voiceRoutes    = require('./routes/voiceRoutes');
const videoRoutes    = require('./routes/videoRoutes');
const uploadRoutes   = require('./routes/uploadRoutes');
const adminRoutes    = require('./routes/adminRoutes');
const debugRoutes    = require('./routes/debug');
const statusRoutes   = require('./routes/status');
const downloadRoutes = require('./routes/downloadRoutes');

/**
 * IMPORTANT:
 * Mount status under a *fixed base* first to avoid collisions with any router
 * that registers generic param routes like `/:id`.
 */
app.use('/api/status', statusRoutes);     // exposes: GET /api/status, /api/status/provider, /api/status/music

// Mount the rest under /api
app.use('/api', songRoutes);
app.use('/api', voiceRoutes);
app.use('/api', videoRoutes);
app.use('/api', uploadRoutes);
app.use('/api', adminRoutes);
app.use('/api', debugRoutes);
app.use('/api', downloadRoutes);

/* --------------- Init request store --------------- */
const store = require('./lib/requestStore');
(async () => {
  try {
    await store.init();
    console.log('[STORE] Initialized');
  } catch (e) {
    console.error('[STORE] Init failed:', e.message);
  }
})();

/* --------------------- Errors ---------------------- */
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

/* ---------------------- 404 ------------------------ */
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', message: `The requested route ${req.originalUrl} does not exist.` });
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log('API listening on', PORT);
    console.log(`Env: ${process.env.NODE_ENV || 'development'}`);
    const baseUrl = process.env.BACKEND_PUBLIC_URL || process.env.FRONTEND_URL || `http://localhost:${PORT}`;
    console.log(`Health: ${baseUrl}/health`);
  });
}

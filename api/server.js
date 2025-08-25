// api/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

/* ------------------------- CORS (allow your frontend) ---------------------- */
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

// de‑dup
const allOrigins = [...new Set([...envOrigins, ...fallbackOrigins])];

console.log('[CORS] CORS_ORIGINS env var:', process.env.CORS_ORIGINS);
console.log('[CORS] All allowed origins:', allOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // allow server‑to‑server / curl (no origin)
    if (!origin || allOrigins.includes(origin)) return callback(null, true);
    console.log('[CORS] Blocking origin:', origin, 'Allowed:', allOrigins);
    return callback(new Error('CORS blocked'));
  },
  credentials: true,
}));

/* --------------------------- Body parsers ---------------------------------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* --------------------------- SUNO callback -------------------------------- */
app.post(['/callback/suno', '/api/callback/suno'], async (req, res) => {
  try {
    console.log('[SUNO CALLBACK]', JSON.stringify(req.body));

    const payload = req.body || {};
    const jobId =
      payload.jobId ||
      payload.taskId ||
      payload.id ||
      payload.data?.taskId ||
      payload.data?.id ||
      null;

    const recordId =
      payload.recordId ||
      payload.data?.recordId ||
      payload.data?.id ||
      null;

    if (jobId || recordId) {
      const store = require('./lib/requestStore');
      const all = await store.list();

      const record = all.find(
        r =>
          r.providerJobId === jobId ||
          (recordId && r.providerRecordId === recordId)
      );

      if (record) {
        const audioUrl =
          payload.audioUrl ||
          payload.audio_url ||
          payload.url ||
          payload.data?.audioUrl ||
          payload.data?.audio_url ||
          payload.data?.audio?.url ||
          (payload.data?.files?.[0]?.url) ||
          null;

        const status =
          payload.status ||
          payload.state ||
          payload.jobStatus ||
          payload.data?.status ||
          (audioUrl ? 'completed' : 'processing');

        const patch = {
          status,
          updatedAt: new Date().toISOString(),
        };

        if (recordId && !record.providerRecordId) patch.providerRecordId = recordId;
        if (audioUrl) patch.audioUrl = audioUrl;

        await store.update(record.id, patch);
        await store.saveNow();

        console.info(
          '[CALLBACK] Updated record %s → status=%s audio=%s',
          record.id,
          status,
          audioUrl ? 'yes' : 'no'
        );
      } else {
        console.warn('[CALLBACK] No matching record for jobId=%s recordId=%s', jobId, recordId);
      }
    }

    // Always return 200 so the provider doesn't retry forever
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[CALLBACK] Error processing callback:', error.message);
    return res.status(200).json({ ok: true });
  }
});

/* ------------------------------ Health ------------------------------------ */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
  });
});

/* ------------------------------ Routes ------------------------------------ */
const songRoutes = require('./routes/songRoutes');
const voiceRoutes = require('./routes/voiceRoutes');
const videoRoutes = require('./routes/videoRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const debugRoutes = require('./routes/debug');
const statusRoutes = require('./routes/status');
const downloadRoutes = require('./routes/downloadRoutes');

// Mount EVERYTHING under /api so frontend can call NEXT_PUBLIC_API_URL + /api/...
app.use('/api', statusRoutes);    // exposes: /api/status, /api/status/provider
app.use('/api', songRoutes);      // e.g. /api/song/...
app.use('/api', voiceRoutes);     // e.g. /api/voice/...
app.use('/api', videoRoutes);     // e.g. /api/video/...
app.use('/api', uploadRoutes);    // e.g. /api/upload/...
app.use('/api', adminRoutes);     // e.g. /api/admin/...
app.use('/api', debugRoutes);     // e.g. /api/debug/...
app.use('/api', downloadRoutes);  // e.g. /api/download/...

/* --------------------- Initialize request store --------------------------- */
const store = require('./lib/requestStore');
(async () => {
  try {
    await store.init();
    console.log('[STORE] Request store initialized at startup');
  } catch (error) {
    console.error('[STORE] Failed to initialize store at startup:', error.message);
  }
})();

/* -------------------------- Error handlers -------------------------------- */
app.use((err, _req, res, _next) => {
  console.error('Error:', err);

  if (err?.type === 'entity.too.large' || err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: 'The uploaded file exceeds the maximum allowed size.',
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

/* -------------------------------- 404 ------------------------------------- */
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist.`,
  });
});

/* ----------------------------- Exports / Listen --------------------------- */
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log('API listening on', PORT);
    console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
    const baseUrl =
      process.env.BACKEND_PUBLIC_URL ||
      process.env.FRONTEND_URL ||
      `http://localhost:${PORT}`;
    console.log(`🔗 Health check: ${baseUrl}/health`);
  });
}

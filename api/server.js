// api/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

/* ============================ BOOT LOG ============================ */
console.log(
  '[ENV] MUSIC_PROVIDER:', process.env.MUSIC_PROVIDER,
  '| SUNO KEY present:', !!process.env.SUNOAPI_ORG_API_KEY
);

/* ============================ CORS ============================ */
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

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Blocked by CORS: ${origin}`));
  },
  credentials: true, // required for fetch(..., { credentials: 'include' })
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'x-app-secret',
    'Accept',
    'Cache-Control',
    'Pragma',
    'Expires',
  ],
  maxAge: 86400,
};

app.use(cors(corsOptions));
// make sure preflights include Allow-Credentials: true, too
app.options('*', cors(corsOptions));

/* ============================ PARSERS ============================ */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ============================ SUNO CALLBACK ============================ */
// Handles multiple payload shapes including snake_case and data.data[] arrays
app.post(['/callback/suno', '/api/callback/suno'], async (req, res) => {
  try {
    const p = req.body || {};
    console.log('[SUNO CALLBACK RAW]', JSON.stringify(p).slice(0, 500));

    // job / record IDs (support snake_case and nesting)
    const jobId =
      p.jobId ||
      p.taskId ||
      p.id ||
      p.task_id ||
      p.data?.taskId ||
      p.data?.task_id ||
      p.data?.id ||
      null;

    const recordId =
      p.recordId ||
      p.record_id ||
      p.data?.recordId ||
      p.data?.record_id ||
      p.data?.id ||
      null;

    // audio URL (support flat, nested, and array under data.data)
    let audioUrl =
      p.audioUrl ||
      p.audio_url ||
      p.url ||
      p.data?.audioUrl ||
      p.data?.audio_url ||
      p.data?.audio?.url ||
      (p.data?.files?.[0]?.url) ||
      null;

    // Some providers send an array in data.data
    let arrayFirst = null;
    if (!audioUrl && Array.isArray(p.data?.data) && p.data.data.length) {
      arrayFirst = p.data.data[0] || {};
      audioUrl = arrayFirst.audio_url || arrayFirst.audioUrl || arrayFirst.url || null;
    }

    const statusRaw =
      p.status ||
      p.state ||
      p.jobStatus ||
      p.data?.status ||
      (audioUrl ? 'completed' : 'processing');

    // Find stored request
    const store = require('./lib/requestStore');
    const all = await store.list();
    const rec = all.find(r =>
      (jobId && String(r.providerJobId) === String(jobId)) ||
      (recordId && String(r.providerRecordId) === String(recordId))
    );

    if (!rec) {
      console.warn('[CALLBACK] No matching record for jobId=%s recordId=%s', jobId, recordId);
      return res.status(200).json({ ok: true });
    }

    const patch = {
      status: statusRaw,
      updatedAt: new Date().toISOString(),
    };

    // If array item had an id, we can treat it as providerRecordId
    const discoveredRecordId = arrayFirst?.id || null;
    if ((recordId || discoveredRecordId) && !rec.providerRecordId) {
      patch.providerRecordId = String(recordId || discoveredRecordId);
    }
    if (audioUrl) {
      patch.audioUrl = String(audioUrl);
    }

    await store.update(rec.id, patch);
    await store.saveNow();

    console.info('[CALLBACK] %s -> %s (audio=%s)', rec.id, statusRaw, audioUrl ? 'yes' : 'no');
    return res.json({ ok: true });
  } catch (err) {
    console.error('[CALLBACK] Error:', err.message);
    return res.status(200).json({ ok: true }); // never fail provider
  }
});

/* ============================ HEALTH / DEBUG ============================ */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), env: process.env.NODE_ENV || 'development' });
});
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), env: process.env.NODE_ENV || 'development' });
});

app.post('/api/debug/echo', (req, res) => {
  res.json({
    headers: req.headers,
    bodyKeys: Object.keys(req.body || {}),
    body: req.body,
    originSeen: req.headers.origin || null,
  });
});

/* ============================ ROUTES ============================ */
const songRoutes     = require('./routes/songRoutes');
const voiceRoutes    = require('./routes/voiceRoutes');
const videoRoutes    = require('./routes/videoRoutes');
const uploadRoutes   = require('./routes/uploadRoutes');
const adminRoutes    = require('./routes/adminRoutes');
const debugRoutes    = require('./routes/debug');
const statusRoutes   = require('./routes/status');
const downloadRoutes = require('./routes/downloadRoutes');

app.use('/api/status', statusRoutes);

// ⛔️ Removed APP_SECRET gate from /api/song/* to avoid 401s
// If you ever want to protect admin-only endpoints, apply a gate just there.

// Mount the rest of API routes
app.use('/api', songRoutes);
app.use('/api', voiceRoutes);
app.use('/api', videoRoutes);
app.use('/api', uploadRoutes);
app.use('/api', adminRoutes);
app.use('/api', debugRoutes);
app.use('/api', downloadRoutes);

/* ============================ STORE INIT ============================ */
const store = require('./lib/requestStore');
(async () => {
  try {
    await store.init();
    console.log('[STORE] Initialized');
  } catch (e) {
    console.error('[STORE] Init failed:', e.message);
  }
})();

/* ============================ ERROR HANDLER ============================ */
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  if (err?.type === 'entity.too.large' || err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large', message: 'The uploaded file exceeds the maximum allowed size.' });
  }
  if (String(err.message || '').startsWith('Blocked by CORS')) {
    return res.status(403).json({ error: 'CORS blocked', message: err.message });
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

/* ============================ 404 ============================ */
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', message: `The requested route ${req.originalUrl} does not exist.` });
});

module.exports = app;

/* ============================ START ============================ */
if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log('API listening on', PORT);
    console.log(`Env: ${process.env.NODE_ENV || 'development'}`);
    const baseUrl = process.env.BACKEND_PUBLIC_URL || `http://localhost:${PORT}`;
    console.log(`Health: ${baseUrl}/health`);
  });
}

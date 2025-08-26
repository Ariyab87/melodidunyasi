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
/**
 * We keep CORS simple and correct:
 * - Allow only the origins you specify (plus safe fallbacks).
 * - Always answer OPTIONS quickly so browsers can POST.
 */
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

app.use(cors({
  origin: (origin, cb) => {
    // allow server-to-server/no-origin and allowed browser origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Blocked by CORS: ${origin}`));
  },
  credentials: false,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'x-app-secret',
    'Accept',
    'Cache-Control',
    'Pragma',
    'Expires',
  ],
  maxAge: 86400, // 24h preflight cache
}));

// Make sure every path responds fast to OPTIONS
app.options('*', cors());

/* ============================ PARSERS ============================ */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ============================ OPTIONAL APP SECRET ============================ */
/**
 * Some templates add a lightweight gate for POST routes.
 * This middleware **never blocks** unless APP_SECRET is set.
 * That way, you don't accidentally 401 in production because
 * the frontend cannot safely keep a secret.
 */
function optionalAppSecret(req, res, next) {
  const expected = process.env.APP_SECRET;
  if (!expected) return next(); // no gate configured
  const got = req.get('x-app-secret');
  if (got === expected) return next();
  console.warn('[AUTH] Missing/incorrect x-app-secret');
  return res.status(401).json({ error: 'unauthorized', message: 'x-app-secret required' });
}

/* ============================ SUNO CALLBACK ============================ */
app.post(['/callback/suno', '/api/callback/suno'], async (req, res) => {
  try {
    console.log('[SUNO CALLBACK]', JSON.stringify(req.body));
    const payload  = req.body || {};
    const jobId    = payload.jobId || payload.taskId || payload.id || payload.data?.taskId || payload.data?.id || null;
    const recordId = payload.recordId || payload.data?.recordId || payload.data?.id || null;

    if (jobId || recordId) {
      const store = require('./lib/requestStore');
      const all = await store.list();
      const record = all.find(r =>
        r.providerJobId === jobId ||
        (recordId && r.providerRecordId === recordId)
      );

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

        const storeMod = require('./lib/requestStore');
        await storeMod.update(record.id, patch);
        await storeMod.saveNow();
        console.info('[CALLBACK] Updated %s -> %s (audio: %s)', record.id, status, audioUrl ? 'yes' : 'no');
      } else {
        console.warn('[CALLBACK] No matching record for jobId=%s recordId=%s', jobId, recordId);
      }
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[CALLBACK] Error:', err.message);
    return res.status(200).json({ ok: true }); // never fail callbacks
  }
});

/* ============================ HEALTH / DEBUG ============================ */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), env: process.env.NODE_ENV || 'development' });
});
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), env: process.env.NODE_ENV || 'development' });
});

// Helpful echo to see what the browser is actually sending (temporarily keep)
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

// Mount status first (no collisions)
app.use('/api/status', statusRoutes);

// Protect only if APP_SECRET is configured; otherwise no-op
app.use('/api/song', optionalAppSecret); // ← applies to /api/song/* only if APP_SECRET is set

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
  // CORS error bubble (from our origin validator)
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

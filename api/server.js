const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configuration - read from environment variable
const origins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origins.includes(origin)) callback(null, true);
    else callback(new Error('CORS blocked'));
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Stores / libs ---
const callbackStore = require('./lib/callbackStore'); // <-- file-backed store for callbacks
const store = require('./lib/requestStore');

// Initialize request store at startup
(async () => {
  try {
    await store.init();
    console.log('[STORE] Request store initialized at startup');
  } catch (error) {
    console.error('[STORE] Failed to initialize store at startup:', error.message);
  }
})();

// ---------- CALLBACKS ----------
/**
 * Suno callback endpoint (works with or without /api).
 * Saves the payload keyed by jobId/taskId so the status endpoint can read it.
 */
app.post(['/callback/suno', '/api/callback/suno'], (req, res) => {
  const body = req.body || {};

  // Try common fields for the provider task id
  const jobId =
    body.taskId || body.jobId || body.id ||
    (body.data && (body.data.taskId || body.data.jobId || body.data.id)) ||
    (body.result && (body.result.taskId || body.result.jobId)) || null;

  const status = body.status || body.state || body.message || 'callback';

  // Save (even if jobId is null, we still keep last payload under 'unknown')
  if (jobId) {
    callbackStore.set(jobId, { provider: 'sunoapi_org', status, raw: body });
    console.log('[SUNO CALLBACK] jobId=%s status=%s saved', jobId, status);
  } else {
    console.warn('[SUNO CALLBACK] payload had no jobId/taskId', body);
  }

  return res.status(200).json({ ok: true });
});

// ---------- HEALTH ----------
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
  });
});

// ---------- ROUTES ----------
const songRoutes = require('./routes/songRoutes');
const voiceRoutes = require('./routes/voiceRoutes');
const videoRoutes = require('./routes/videoRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const debugRoutes = require('./routes/debug');
const statusRoutes = require('./routes/status'); // keeps /status/music ping
const downloadRoutes = require('./routes/downloadRoutes');

// API Routes (mounted at root; your reverse-proxy/consumer uses /api when needed)
app.use('/song', songRoutes);
app.use('/voice', voiceRoutes);
app.use('/video', videoRoutes);
app.use('/upload', uploadRoutes);
app.use('/admin', adminRoutes);
app.use('/debug', debugRoutes);
app.use('/status', statusRoutes);
app.use('/download', downloadRoutes);

// ---------- JOB STATUS ENDPOINTS ----------
/**
 * Read job status saved by the callback.
 * Supports:
 *   GET /status/song?jobId=...
 *   GET /status/song/:jobId
 *   and the same under /api prefix.
 */
function jobStatusResponse(jobId, res) {
  if (!jobId) return res.status(400).json({ ok: false, error: 'MISSING_JOB_ID' });
  const rec = callbackStore.get(jobId);
  if (!rec) return res.json({ ok: true, jobId, status: 'pending' });
  return res.json({
    ok: true,
    jobId,
    status: rec.status,
    result: rec.raw,
    updatedAt: rec.updatedAt
  });
}

app.get(['/status/song', '/api/status/song'], (req, res) => {
  const { jobId } = req.query;
  console.log('[status/song] query jobId=%s', jobId || '-');
  return jobStatusResponse(jobId, res);
});

app.get(['/status/song/:jobId', '/api/status/song/:jobId'], (req, res) => {
  const { jobId } = req.params;
  console.log('[status/song] param jobId=%s', jobId || '-');
  return jobStatusResponse(jobId, res);
});

// ---------- ERROR HANDLERS ----------
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.type === 'entity.too.large' || err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: 'The uploaded file exceeds the maximum allowed size.'
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist.`
  });
});

// Export the app for Passenger
module.exports = app;

// Start server when run directly
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

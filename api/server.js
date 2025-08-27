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

    // Check callback type to determine if this is a final callback
    const callbackType = p.data?.callbackType || p.callbackType || 'unknown';
    console.log('[CALLBACK] Callback type:', callbackType, 'for jobId:', jobId, 'recordId:', recordId);
    
    // COMPREHENSIVE audio URL extraction - check ALL possible locations
    let audioUrl = null;
    
    // Method 1: Direct properties
    audioUrl = p.audioUrl || p.audio_url || p.url || null;
    
    // Method 2: Nested data properties
    if (!audioUrl) {
      audioUrl = p.data?.audioUrl || p.data?.audio_url || p.data?.audio?.url || null;
    }
    
    // Method 3: Files array
    if (!audioUrl && p.data?.files && Array.isArray(p.data.files)) {
      audioUrl = p.data.files[0]?.url || p.data.files[0]?.audio_url || null;
    }
    
    // Method 4: Data array (most common Suno format)
    if (!audioUrl && Array.isArray(p.data?.data) && p.data.data.length > 0) {
      const firstItem = p.data.data[0];
      audioUrl = firstItem.audio_url || firstItem.audioUrl || firstItem.url || firstItem.audioUrl || null;
      
      // Also check nested audio properties
      if (!audioUrl && firstItem.audio) {
        audioUrl = firstItem.audio.url || firstItem.audio.audio_url || null;
      }
    }
    
    // Method 5: Deep nested search
    if (!audioUrl) {
      const deepSearch = (obj, depth = 0) => {
        if (depth > 3) return null; // Prevent infinite recursion
        if (!obj || typeof obj !== 'object') return null;
        
        for (const [key, value] of Object.entries(obj)) {
          if (key.includes('audio') && key.includes('url') && value && typeof value === 'string') {
            return value;
          }
          if (typeof value === 'object' && value !== null) {
            const found = deepSearch(value, depth + 1);
            if (found) return found;
          }
        }
        return null;
      };
      
      audioUrl = deepSearch(p);
    }
    
    // Some providers send an array in data.data
    let arrayFirst = null;
    if (!audioUrl && Array.isArray(p.data?.data) && p.data.data.length) {
      arrayFirst = p.data.data[0] || {};
      audioUrl = arrayFirst.audio_url || arrayFirst.audioUrl || arrayFirst.url || null;
    }

    // VALIDATION: Only treat as completed if we have a valid audio URL (not empty string)
    const hasValidAudioUrl = audioUrl && audioUrl.trim() !== '' && audioUrl !== 'null' && audioUrl !== 'undefined';
    console.log('[CALLBACK] 🔍 COMPREHENSIVE AUDIO URL SEARCH:');
    console.log('[CALLBACK] - Raw audioUrl found:', audioUrl);
    console.log('[CALLBACK] - Is valid URL:', hasValidAudioUrl);
    console.log('[CALLBACK] - Callback type:', callbackType);
    console.log('[CALLBACK] - Full payload keys:', Object.keys(p));
    if (p.data) console.log('[CALLBACK] - Data keys:', Object.keys(p.data));
    if (p.data?.data && Array.isArray(p.data.data)) {
      console.log('[CALLBACK] - Data array length:', p.data.data.length);
      console.log('[CALLBACK] - First item keys:', Object.keys(p.data.data[0] || {}));
    }

    const statusRaw =
      p.status ||
      p.state ||
      p.jobStatus ||
      p.data?.status ||
      (hasValidAudioUrl ? 'completed' : 'processing');

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

    // For "first" callbacks, don't update status to completed unless we have audio
    if (callbackType === 'first' && !hasValidAudioUrl) {
      console.log('[CALLBACK] First callback without audio - keeping status as processing');
      patch.status = 'processing'; // Override to keep as processing
    }

    // If array item had an id, we can treat it as providerRecordId
    const discoveredRecordId = arrayFirst?.id || null;
    if ((recordId || discoveredRecordId) && !rec.providerRecordId) {
      patch.providerRecordId = String(recordId || discoveredRecordId);
    }
    if (hasValidAudioUrl) {
      patch.audioUrl = String(audioUrl);
      console.log('[CALLBACK] Setting audioUrl in patch:', audioUrl);
    } else {
      console.log('[CALLBACK] No valid audio URL, keeping existing audioUrl');
    }

    await store.update(rec.id, patch);
    await store.saveNow();

    // Aggressively invalidate status cache to ensure frontend gets updated status immediately
    if (statusCache && typeof statusCache.delete === 'function') {
      statusCache.delete(rec.id);
      console.log('[CALLBACK] Invalidated status cache for:', rec.id);
      
      // Also clear any related caches to be extra sure
      const allKeys = Array.from(statusCache.keys());
      const relatedKeys = allKeys.filter(key => key.includes(rec.id) || key.includes(rec.providerJobId));
      relatedKeys.forEach(key => {
        statusCache.delete(key);
        console.log('[CALLBACK] Also invalidated related cache key:', key);
      });
    }

    console.info('[CALLBACK] %s -> %s (audio=%s, type=%s) - Record updated successfully', 
      rec.id, statusRaw, hasValidAudioUrl ? 'yes' : 'no', callbackType);
    console.log('[CALLBACK] Updated record:', { 
      id: rec.id, 
      status: statusRaw, 
      audioUrl: hasValidAudioUrl ? audioUrl : 'not set', 
      callbackType,
      updatedAt: patch.updatedAt 
    });
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

app.post('/api/debug/callback-test', (req, res) => {
  const p = req.body || {};
  const callbackType = p.data?.callbackType || p.callbackType || 'unknown';
  const audioUrl = p.data?.data?.[0]?.audio_url || p.audio_url || null;
  const hasValidAudioUrl = audioUrl && audioUrl.trim() !== '';
  
  res.json({
    callbackType,
    audioUrl,
    hasValidAudioUrl,
    status: hasValidAudioUrl ? 'completed' : 'processing',
    timestamp: new Date().toISOString(),
    rawBody: req.body
  });
});

/* ============================ ROUTES ============================ */
const { router: songRoutes, statusCache } = require('./routes/songRoutes');
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

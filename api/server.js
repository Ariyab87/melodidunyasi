const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configuration - read from environment variable
// FIXED: Allow melodidunyasi.com to access the backend
const origins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

// Fallback origins for development/production
const fallbackOrigins = [
  'https://melodidunyasi.com',
  'https://www.melodidunyasi.com',
  'http://localhost:3000',
  'http://localhost:3001'
];

// Combine environment origins with fallbacks
const allOrigins = [...new Set([...origins, ...fallbackOrigins])];

console.log('[CORS] Configured origins:', origins);
console.log('[CORS] CORS_ORIGINS env var:', process.env.CORS_ORIGINS);
console.log('[CORS] All allowed origins:', allOrigins);

app.use(cors({ 
  origin: (origin, callback) => {
    console.log('[CORS] Request from origin:', origin);
    if (!origin || allOrigins.includes(origin)) {
      console.log('[CORS] Allowing origin:', origin);
      callback(null, true);
    } else {
      console.log('[CORS] Blocking origin:', origin, 'Allowed origins:', allOrigins);
      callback(new Error('CORS blocked'));
    }
  }, 
  credentials: true 
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Callback endpoint for Suno (must be before any auth middleware)
app.post(['/callback/suno', '/api/callback/suno'], async (req, res) => {
  try {
    console.log('[SUNO CALLBACK]', JSON.stringify(req.body));
    
    const payload = req.body || {};
    const jobId = payload.jobId || payload.taskId || payload.id || payload.data?.taskId || payload.data?.id || null;
    const recordId = payload.recordId || payload.data?.recordId || payload.data?.id || null;
    
    if (jobId || recordId) {
      // Import store here to avoid circular dependency issues
      const store = require('./lib/requestStore');
      
      // Find stored request by provider ids
      const all = await store.list();
      const record = all.find(r => r.providerJobId === jobId || (recordId && r.providerRecordId === recordId));
      
      if (record) {
        // Extract audio URL from various possible fields
        const audioUrl = payload.audioUrl || payload.audio_url || payload.url ||
          payload.data?.audioUrl || payload.data?.audio_url ||
          payload.data?.audio?.url || (payload.data?.files?.[0]?.url) || null;
        
        const status = payload.status || payload.state || payload.jobStatus || 
          payload.data?.status || (audioUrl ? 'completed' : 'processing');
        
        const patch = {
          status,
          updatedAt: new Date().toISOString()
        };
        
        if (recordId && !record.providerRecordId) {
          patch.providerRecordId = recordId;
        }
        
        if (audioUrl) {
          patch.audioUrl = audioUrl;
        }
        
        await store.update(record.id, patch);
        await store.saveNow();
        
        console.info('[CALLBACK] Updated record %s → status=%s audio=%s', 
          record.id, status, audioUrl ? 'yes' : 'no');
      } else {
        console.warn('[CALLBACK] No matching record for jobId=%s recordId=%s', jobId, recordId);
      }
    }
    
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[CALLBACK] Error processing callback:', error.message);
    // Never fail the callback - return success to Suno
    return res.status(200).json({ ok: true });
  }
});

// Health check endpoint (no /api prefix since app will be mounted at /api)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Import and use route handlers
const songRoutes = require('./routes/songRoutes');
const voiceRoutes = require('./routes/voiceRoutes');
const videoRoutes = require('./routes/videoRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const debugRoutes = require('./routes/debug');
const statusRoutes = require('./routes/status');
const downloadRoutes = require('./routes/downloadRoutes');

// Add route aliases for backward compatibility
app.use('/api/status', statusRoutes);

// Initialize request store at startup
const store = require('./lib/requestStore');
(async () => {
  try {
    await store.init();
    console.log('[STORE] Request store initialized at startup');
  } catch (error) {
    console.error('[STORE] Failed to initialize store at startup:', error.message);
  }
})();

// API Routes (these will be accessible at /api/... when mounted)
app.use('/song', songRoutes);
app.use('/voice', voiceRoutes);
app.use('/video', videoRoutes);
app.use('/upload', uploadRoutes);
app.use('/admin', adminRoutes);
app.use('/debug', debugRoutes);
app.use('/status', statusRoutes);
app.use('/download', downloadRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'File too large',
      message: 'The uploaded file exceeds the maximum allowed size.'
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
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
    const baseUrl = process.env.BACKEND_PUBLIC_URL || process.env.FRONTEND_URL || `http://localhost:${PORT}`;
    console.log(`🔗 Health check: ${baseUrl}/health`);
  });
}

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configuration - read from environment variable
const origins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || origins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked'));
    }
  }, 
  credentials: true 
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });
}

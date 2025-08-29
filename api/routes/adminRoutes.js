// api/routes/adminRoutes.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');

const router = express.Router();

/* -------------------- Admin auth (optional) -------------------- */
/**
 * If ADMIN_SECRET_KEY is set, require clients to send it in the
 * `x-admin-key` header. If it's NOT set, do not block (useful in dev).
 */
const adminAuth = (req, res, next) => {
  const required = process.env.ADMIN_SECRET_KEY;
  if (!required) return next(); // no key configured → don't block

  const provided = req.headers['x-admin-key'];
  if (provided && provided === required) {
    // No-cache on admin responses
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized access' });
};

// Apply auth to everything in this router
router.use(adminAuth);

/* -------------------- Helpers -------------------- */
async function pathExists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

async function getDirectorySize(dirPath) {
  if (!(await pathExists(dirPath))) return 0;

  let total = 0;
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const p = path.join(dirPath, entry.name);
    const st = await fsp.stat(p);
    if (st.isDirectory()) total += await getDirectorySize(p);
    else total += st.size;
  }
  return total;
}

async function getFileCount(dirPath) {
  if (!(await pathExists(dirPath))) return 0;

  let count = 0;
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const p = path.join(dirPath, entry.name);
    const st = await fsp.stat(p);
    count += st.isDirectory() ? await getFileCount(p) : 1;
  }
  return count;
}

async function getLastModified(dirPath) {
  if (!(await pathExists(dirPath))) return null;
  const st = await fsp.stat(dirPath);
  return st.mtime.toISOString();
}

function formatBytes(bytes) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/* -------------------- Routes -------------------- */
/**
 * GET /api/admin/dashboard
 */
router.get('/dashboard', async (_req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    const audioDir = path.join(uploadsDir, 'audio');
    const videoDir = path.join(uploadsDir, 'videos');
    const imageDir = path.join(uploadsDir, 'images');

    const stats = {
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString(),
      },
      storage: {
        total: await getDirectorySize(uploadsDir),
        audio: await getDirectorySize(audioDir),
        video: await getDirectorySize(videoDir),
        images: await getDirectorySize(imageDir),
      },
      services: {
        suno: process.env.SUNO_API_KEY ? 'Active' : 'Inactive',
        kits: process.env.KITS_API_KEY ? 'Active' : 'Inactive',
        runway: process.env.RUNWAY_API_KEY ? 'Active' : 'Inactive',
      },
    };

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/services
 */
router.get('/services', async (_req, res) => {
  try {
    const services = {
      suno: {
        name: 'Suno AI',
        status: process.env.SUNO_API_KEY ? 'Active' : 'Inactive',
        apiKey: process.env.SUNO_API_KEY ? `***${process.env.SUNO_API_KEY.slice(-4)}` : 'Not set',
        baseUrl: process.env.SUNO_BASE_URL || 'https://api.suno.ai',
        rateLimit: process.env.SUNO_RATE_LIMIT || 'Unlimited',
        enabled: process.env.SUNO_ENABLED !== 'false',
      },
      kits: {
        name: 'KITS AI',
        status: process.env.KITS_API_KEY ? 'Active' : 'Inactive',
        apiKey: process.env.KITS_API_KEY ? `***${process.env.KITS_API_KEY.slice(-4)}` : 'Not set',
        baseUrl: process.env.KITS_BASE_URL || 'https://api.kits.ai',
        rateLimit: process.env.KITS_RATE_LIMIT || 'Unlimited',
        enabled: process.env.KITS_ENABLED !== 'false',
      },
      runway: {
        name: 'RunwayML',
        status: process.env.RUNWAY_API_KEY ? 'Active' : 'Inactive',
        apiKey: process.env.RUNWAY_API_KEY ? `***${process.env.RUNWAY_API_KEY.slice(-4)}` : 'Not set',
        baseUrl: process.env.RUNWAY_BASE_URL || 'https://api.runwayml.com',
        rateLimit: process.env.RUNWAY_RATE_LIMIT || 'Unlimited',
        enabled: process.env.RUNWAY_ENABLED !== 'false',
      },
    };

    res.json({ success: true, data: services });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/services/update
 */
router.post('/services/update', async (req, res) => {
  try {
    const { service, config } = req.body || {};
    if (!service || !config) {
      return res.status(400).json({ error: 'Service and config are required' });
    }
    res.json({
      success: true,
      message: `${service} configuration updated successfully`,
      data: { service, config },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/services/toggle
 */
router.post('/services/toggle', async (req, res) => {
  try {
    const { service, enabled } = req.body || {};
    if (!service || typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Service and enabled status are required' });
    }
    res.json({
      success: true,
      message: `${service} ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: { service, enabled },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/requests
 */
router.get('/requests', async (req, res) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query;
    const mock = [
      {
        id: 'req_001',
        type: 'song',
        user: 'john@example.com',
        status: 'completed',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        service: 'suno',
        price: 0,
        userDetails: { name: 'John Doe', email: 'john@example.com', phone: '+1234567890' },
      },
      {
        id: 'req_002',
        type: 'voice',
        user: 'jane@example.com',
        status: 'processing',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        service: 'kits',
        price: 250,
        userDetails: { name: 'Jane Smith', email: 'jane@example.com', phone: '+1987654321' },
      },
      {
        id: 'req_003',
        type: 'video',
        user: 'bob@example.com',
        status: 'pending',
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        price: 500,
        userDetails: { name: 'Bob Johnson', email: 'bob@example.com', phone: '+1122334455' },
      },
      {
        id: 'req_004',
        type: 'song',
        user: 'anna@example.com',
        status: 'completed',
        createdAt: new Date(Date.now() - 600000).toISOString(),
        completedAt: new Date(Date.now() - 300000).toISOString(),
        service: 'suno',
        price: 0,
        downloadUrl: '/api/song/download/req_004',
        userDetails: { name: 'Anna Birthday', email: 'anna@example.com', phone: '+1555123456' },
        songDetails: {
          style: 'Pop',
          mood: 'Happy',
          tempo: 'Medium (80-120 BPM)',
          occasion: 'Birthday',
          story:
            "It's Anna's 30th birthday. She loves sunsets, beach walks, and always sings along to pop songs in the car.",
        },
      },
    ];

    const filtered = type ? mock.filter(r => r.type === type) : mock;
    const page = filtered.slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      success: true,
      data: { requests: page, total: filtered.length, limit: Number(limit), offset: Number(offset) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/orders
 */
router.get('/orders', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const mock = [
      {
        id: 'ORD_001',
        userId: 'user_123',
        type: 'song',
        status: 'pending',
        price: 0,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        userDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          gdprConsent: true,
          gdprConsentDate: new Date(Date.now() - 86400000).toISOString(),
        },
        serviceDetails: { service: 'suno', prompt: 'Happy birthday song for my daughter', style: 'pop', mood: 'happy' },
      },
      {
        id: 'ORD_002',
        userId: 'user_456',
        type: 'voice',
        status: 'completed',
        price: 250,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        completedAt: new Date(Date.now() - 3600000).toISOString(),
        userDetails: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+1987654321',
          gdprConsent: true,
          gdprConsentDate: new Date(Date.now() - 172800000).toISOString(),
        },
        serviceDetails: { service: 'kits', purpose: 'Voice cloning for podcast', quality: 'high' },
      },
    ];

    const filtered = status ? mock.filter(o => o.status === status) : mock;
    const page = filtered.slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      success: true,
      data: { orders: page, total: filtered.length, limit: Number(limit), offset: Number(offset) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/gdpr-logs
 */
router.get('/gdpr-logs', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const logs = [
      {
        id: 'gdpr_001',
        userId: 'user_123',
        action: 'consent_given',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        userDetails: { name: 'John Doe', email: 'john@example.com', ipAddress: '192.168.1.1' },
        consentDetails: { marketing: true, analytics: true, necessary: true },
      },
      {
        id: 'gdpr_002',
        userId: 'user_456',
        action: 'data_deletion_request',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        userDetails: { name: 'Jane Smith', email: 'jane@example.com', ipAddress: '192.168.1.2' },
        deletionDetails: { reason: 'Privacy concerns', dataTypes: ['personal', 'usage'] },
      },
    ];

    const page = logs.slice(Number(offset), Number(offset) + Number(limit));
    res.json({ success: true, data: { logs: page, total: logs.length, limit: Number(limit), offset: Number(offset) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/pricing
 * Note: Admin users get free access to all services
 */
router.get('/pricing', async (_req, res) => {
  try {
    const pricing = {
      song: {
        basePrice: 0, // Free for admin users
        currency: 'TL',
        features: ['Custom lyrics', 'Style selection', 'Mood customization', 'Premium quality output', '2 re-generations included'],
        addons: {
          additionalSong: { price: 500, description: 'Additional song' },
          premiumQuality: { price: 100, description: 'Premium quality upgrade' },
          fastDelivery: { price: 150, description: '3-day delivery (instead of 7-day)' },
        },
      },
      voice: {
        basePrice: 0, // Free for admin users
        currency: 'TL',
        features: ['Voice cloning', 'High quality output', 'Multiple languages', 'Custom training', 'Standard support'],
        addons: {
          commercialLicense: { price: 100, description: 'Commercial usage rights' },
          bulkProcessing: { price: 200, description: 'Process 5+ voice clones (20% discount)' },
          premiumQuality: { price: 75, description: 'Premium quality upgrade' },
        },
      },
      video: {
        basePrice: 0, // Free for admin users
        currency: 'TL',
        features: ['Video animation', 'Custom prompts', 'High resolution', 'Multiple formats', 'Premium quality output'],
        addons: {
          extendedDuration: { price: 200, description: 'Additional 15 seconds' },
          premiumEffects: { price: 150, description: 'Premium effects pack' },
          fastDelivery: { price: 250, description: '3-day delivery (instead of 7-day)' },
        },
      },
    };

    res.json({ success: true, data: pricing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/pricing/update
 */
router.post('/pricing/update', async (req, res) => {
  try {
    const { service, pricing } = req.body || {};
    if (!service || !pricing) {
      return res.status(400).json({ error: 'Service and pricing are required' });
    }
    res.json({ success: true, message: `${service} pricing updated successfully`, data: { service, pricing } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/content
 */
router.get('/content', async (_req, res) => {
  try {
    const content = {
      hero: {
        title: 'Create Your Perfect Song',
        subtitle: 'AI-powered music creation for every occasion',
        slogan: 'Where memories become melodies',
        backgroundImage: '/images/hero-bg.jpg',
        ctaText: 'Start Creating',
        ctaLink: '#song-request',
      },
      services: {
        song: {
          title: 'Custom Song Creation',
          description: 'AI-generated songs tailored to your story',
          icon: '🎵',
          features: ['Personalized lyrics', 'Multiple styles', 'Custom duration'],
        },
        voice: {
          title: 'Voice Cloning',
          description: 'Clone any voice with AI technology',
          icon: '🎤',
          features: ['High quality', 'Multiple languages', 'Commercial use'],
        },
        video: {
          title: 'Video Animation',
          description: 'Bring your ideas to life with AI animation',
          icon: '🎬',
          features: ['Custom prompts', 'High resolution', 'Multiple formats'],
        },
      },
      forms: {
        songRequest: {
          fields: [
            { name: 'fullName', label: 'Full Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'phone', label: 'Phone', type: 'tel', required: false },
            { name: 'specialOccasion', label: 'Special Occasion', type: 'text', required: true },
            { name: 'songStyle', label: 'Song Style', type: 'select', required: true, options: ['Pop', 'Rock', 'Jazz', 'Classical'] },
            { name: 'mood', label: 'Mood', type: 'select', required: true, options: ['Happy', 'Sad', 'Energetic', 'Calm'] },
            { name: 'tempo', label: 'Tempo', type: 'select', required: true, options: ['Slow', 'Medium', 'Fast'] },
            { name: 'namesToInclude', label: 'Names to Include', type: 'text', required: false },
            { name: 'yourStory', label: 'Your Story', type: 'textarea', required: true },
            { name: 'additionalNotes', label: 'Additional Notes', type: 'textarea', required: false },
          ],
        },
        voiceCloning: {
          fields: [
            { name: 'fullName', label: 'Full Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'purpose', label: 'Purpose', type: 'text', required: true },
            { name: 'targetLanguage', label: 'Target Language', type: 'select', required: false, options: ['English', 'Spanish', 'French', 'German'] },
            { name: 'quality', label: 'Quality', type: 'select', required: false, options: ['Standard', 'High', 'Premium'] },
            { name: 'additionalNotes', label: 'Additional Notes', type: 'textarea', required: false },
          ],
        },
        videoGeneration: {
          fields: [
            { name: 'fullName', label: 'Full Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'animationStyle', label: 'Animation Style', type: 'select', required: false, options: ['Realistic', 'Cartoon', 'Abstract', 'Cinematic'] },
            { name: 'desiredDuration', label: 'Desired Duration (seconds)', type: 'number', required: false },
            { name: 'animationPrompt', label: 'Animation Prompt', type: 'textarea', required: true },
            { name: 'videoScenario', label: 'Video Scenario', type: 'textarea', required: false },
            { name: 'additionalNotes', label: 'Additional Notes', type: 'textarea', required: false },
          ],
        },
      },
    };

    res.json({ success: true, data: content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/content/update
 */
router.post('/content/update', async (req, res) => {
  try {
    const { section, content } = req.body || {};
    if (!section || !content) {
      return res.status(400).json({ error: 'Section and content are required' });
    }
    res.json({ success: true, message: `${section} content updated successfully`, data: { section, content } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/email-templates
 */
router.get('/email-templates', async (_req, res) => {
  try {
    const templates = {
      welcome: {
        name: 'Welcome Email',
        subject: 'Welcome to SongCreator!',
        body:
          `Hi {{userName}},\n\nWelcome to SongCreator! We're excited to have you on board.\n\n` +
          `Your account has been successfully created and you can now start creating amazing AI-generated content.\n\n` +
          `Best regards,\nThe SongCreator Team`,
        variables: ['{{userName}}', '{{userEmail}}'],
        enabled: true,
      },
      orderConfirmation: {
        name: 'Order Confirmation',
        subject: 'Order Confirmed - {{orderType}}',
        body:
          `Hi {{userName}},\n\nThank you for your order! We've received your request for {{orderType}}.\n\n` +
          `Order Details:\n- Order ID: {{orderId}}\n- Service: {{orderType}}\n- Price: {{price}}\n- Status: {{status}}\n\n` +
          `We'll start processing your request immediately and will keep you updated on the progress.\n\n` +
          `Best regards,\nThe SongCreator Team`,
        variables: ['{{userName}}', '{{orderType}}', '{{orderId}}', '{{price}}', '{{status}}', '{{currency}}'],
        enabled: true,
      },
      orderCompleted: {
        name: 'Order Completed',
        subject: 'Your {{orderType}} is Ready!',
        body:
          `Hi {{userName}},\n\nGreat news! Your {{orderType}} has been completed and is ready for download.\n\n` +
          `Order Details:\n- Order ID: {{orderId}}\n- Service: {{orderType}}\n- Download Link: {{downloadLink}}\n\n` +
          `We hope you love the result! If you have any questions or need modifications, please don't hesitate to contact us.\n\n` +
          `Best regards,\nThe SongCreator Team`,
        variables: ['{{userName}}', '{{orderType}}', '{{orderId}}', '{{downloadLink}}'],
        enabled: true,
      },
      passwordReset: {
        name: 'Password Reset',
        subject: 'Password Reset Request',
        body:
          `Hi {{userName}},\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n` +
          `{{resetLink}}\n\nIf you didn't request this, please ignore this email. The link will expire in 24 hours.\n\n` +
          `Best regards,\nThe SongCreator Team`,
        variables: ['{{userName}}', '{{resetLink}}'],
        enabled: true,
      },
    };

    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/storage
 */
router.get('/storage', async (_req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    const audioDir = path.join(uploadsDir, 'audio');
    const videoDir = path.join(uploadsDir, 'videos');
    const imageDir = path.join(uploadsDir, 'images');
    const tempDir = path.join(uploadsDir, 'temp');

    const storageInfo = {
      directories: {
        audio: {
          path: audioDir,
          size: await getDirectorySize(audioDir),
          fileCount: await getFileCount(audioDir),
          lastModified: await getLastModified(audioDir),
        },
        video: {
          path: videoDir,
          size: await getDirectorySize(videoDir),
          fileCount: await getFileCount(videoDir),
          lastModified: await getLastModified(videoDir),
        },
        image: {
          path: imageDir,
          size: await getDirectorySize(imageDir),
          fileCount: await getFileCount(imageDir),
          lastModified: await getLastModified(imageDir),
        },
        temp: {
          path: tempDir,
          size: await getDirectorySize(tempDir),
          fileCount: await getFileCount(tempDir),
          lastModified: await getLastModified(tempDir),
        },
      },
      total: {
        size: await getDirectorySize(uploadsDir),
        fileCount: await getFileCount(uploadsDir),
      },
    };

    res.json({ success: true, data: storageInfo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/storage/cleanup
 */
router.post('/storage/cleanup', async (req, res) => {
  try {
    const { type = 'temp', olderThan } = req.body || {};
    let cleanedFiles = 0;
    let freedSpace = 0;

    if (type === 'temp') {
      const tempDir = path.join(__dirname, '../uploads/temp');
      if (await pathExists(tempDir)) {
        const files = await fsp.readdir(tempDir);
        for (const file of files) {
          const p = path.join(tempDir, file);
          const st = await fsp.stat(p);
          const isOldEnough = olderThan ? Date.now() - st.mtime.getTime() > Number(olderThan) : true;
          if (st.isFile() && isOldEnough) {
            await fsp.unlink(p);
            cleanedFiles += 1;
            freedSpace += st.size;
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      data: { cleanedFiles, freedSpace: formatBytes(freedSpace), type },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/logs
 */
router.get('/logs', async (req, res) => {
  try {
    const { level = 'all', limit = 100 } = req.query;
    const logs = [
      { timestamp: new Date().toISOString(), level: 'info',  message: 'Song generation completed successfully', service: 'suno',  userId: 'user_123' },
      { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'warn',  message: 'API rate limit approaching',            service: 'kits',  userId: 'user_456' },
      { timestamp: new Date(Date.now() - 120000).toISOString(), level: 'error', message: 'Video generation failed',               service: 'runway', userId: 'user_789' },
    ];

    const filtered = level === 'all' ? logs : logs.filter(l => l.level === level);
    res.json({ success: true, data: { logs: filtered.slice(0, Number(limit)), total: filtered.length } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/system/restart
 */
router.post('/system/restart', async (req, res) => {
  try {
    const { service } = req.body || {};
    res.json({ success: true, message: service ? `${service} service restarted` : 'All services restarted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

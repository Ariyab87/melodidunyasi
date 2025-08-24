const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');

// Admin authentication middleware (you can enhance this with JWT)
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }
  
  // Set no-cache headers for admin routes
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  next();
};

// Apply admin authentication to all routes
router.use(adminAuth);

/**
 * @route GET /api/admin/dashboard
 * @desc Get admin dashboard statistics
 * @access Admin only
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Get upload directory stats
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
        timestamp: new Date().toISOString()
      },
      storage: {
        total: await getDirectorySize(uploadsDir),
        audio: await getDirectorySize(audioDir),
        video: await getDirectorySize(videoDir),
        images: await getDirectorySize(imageDir)
      },
      services: {
        suno: process.env.SUNO_API_KEY ? 'Active' : 'Inactive',
        kits: process.env.KITS_API_KEY ? 'Active' : 'Inactive',
        runway: process.env.RUNWAY_API_KEY ? 'Active' : 'Inactive'
      }
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/admin/services
 * @desc Get all service configurations and status
 * @access Admin only
 */
router.get('/services', async (req, res) => {
  try {
    const services = {
      suno: {
        name: 'Suno AI',
        status: process.env.SUNO_API_KEY ? 'Active' : 'Inactive',
        apiKey: process.env.SUNO_API_KEY ? '***' + process.env.SUNO_API_KEY.slice(-4) : 'Not set',
        baseUrl: process.env.SUNO_BASE_URL || 'https://api.suno.ai',
        rateLimit: process.env.SUNO_RATE_LIMIT || 'Unlimited',
        enabled: process.env.SUNO_ENABLED !== 'false'
      },
      kits: {
        name: 'KITS AI',
        status: process.env.KITS_API_KEY ? 'Active' : 'Inactive',
        apiKey: process.env.KITS_API_KEY ? '***' + process.env.KITS_API_KEY.slice(-4) : 'Not set',
        baseUrl: process.env.KITS_BASE_URL || 'https://api.kits.ai',
        rateLimit: process.env.KITS_RATE_LIMIT || 'Unlimited',
        enabled: process.env.KITS_ENABLED !== 'false'
      },
      runway: {
        name: 'RunwayML',
        status: process.env.RUNWAY_API_KEY ? 'Active' : 'Inactive',
        apiKey: process.env.RUNWAY_API_KEY ? '***' + process.env.RUNWAY_API_KEY.slice(-4) : 'Not set',
        baseUrl: process.env.RUNWAY_BASE_URL || 'https://api.runwayml.com',
        rateLimit: process.env.RUNWAY_RATE_LIMIT || 'Unlimited',
        enabled: process.env.RUNWAY_ENABLED !== 'false'
      }
    };

    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/admin/services/update
 * @desc Update service configuration
 * @access Admin only
 */
router.post('/services/update', async (req, res) => {
  try {
    const { service, config } = req.body;
    
    if (!service || !config) {
      return res.status(400).json({ error: 'Service and config are required' });
    }

    // In a real application, you'd update environment variables or config files
    // For now, we'll just return success
    res.json({ 
      success: true, 
      message: `${service} configuration updated successfully`,
      data: { service, config }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/admin/services/toggle
 * @desc Toggle service enable/disable status
 * @access Admin only
 */
router.post('/services/toggle', async (req, res) => {
  try {
    const { service, enabled } = req.body;
    
    if (!service || typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Service and enabled status are required' });
    }

    // In a real application, you'd update environment variables or config files
    res.json({ 
      success: true, 
      message: `${service} ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: { service, enabled }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/admin/requests
 * @desc Get recent service requests
 * @access Admin only
 */
router.get('/requests', adminAuth, async (req, res) => {
  try {
    // Additional no-cache headers for this specific endpoint
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const { type, limit = 50, offset = 0 } = req.query;
    
    // In a real application, you'd query a database
    // For now, we'll return mock data
    const mockRequests = [
      {
        id: 'req_001',
        type: 'song',
        user: 'john@example.com',
        status: 'completed',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        service: 'suno',
        price: 0,
        userDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        }
      },
      {
        id: 'req_002',
        type: 'voice',
        user: 'jane@example.com',
        status: 'processing',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        service: 'kits',
        price: 250,
        userDetails: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+1987654321'
        }
      },
      {
        id: 'req_003',
        type: 'video',
        user: 'bob@example.com',
        status: 'pending',
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        price: 500,
        userDetails: {
          name: 'Bob Johnson',
          email: 'bob@example.com',
          phone: '+1122334455'
        }
      },
             {
         id: 'req_004',
         type: 'song',
         user: 'anna@example.com',
         status: 'completed',
         createdAt: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
         completedAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
         service: 'suno',
         price: 0,
         downloadUrl: '/api/song/download/req_004',
         userDetails: {
           name: 'Anna Birthday',
           email: 'anna@example.com',
           phone: '+1555123456'
         },
         songDetails: {
           style: 'Pop',
           mood: 'Happy',
           tempo: 'Medium (80-120 BPM)',
           occasion: 'Birthday',
           story: "It's Anna's 30th birthday. She loves sunsets, beach walks, and always sings along to pop songs in the car. The song should celebrate her kindness, her laughter that fills the room, and how her friends and family are proud of her. Make it uplifting, fun, and danceable."
         }
       }
    ];

    let filteredRequests = mockRequests;
    if (type) {
      filteredRequests = mockRequests.filter(req => req.type === type);
    }

    const paginatedRequests = filteredRequests.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        requests: paginatedRequests,
        total: filteredRequests.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/admin/orders
 * @desc Get order tracking information
 * @access Admin only
 */
router.get('/orders', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    // Mock order data
    const mockOrders = [
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
          gdprConsentDate: new Date(Date.now() - 86400000).toISOString()
        },
        serviceDetails: {
          service: 'suno',
          prompt: 'Happy birthday song for my daughter',
          style: 'pop',
          mood: 'happy'
        }
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
          gdprConsentDate: new Date(Date.now() - 172800000).toISOString()
        },
        serviceDetails: {
          service: 'kits',
          purpose: 'Voice cloning for podcast',
          quality: 'high'
        }
      }
    ];

    let filteredOrders = mockOrders;
    if (status) {
      filteredOrders = mockOrders.filter(order => order.status === status);
    }

    const paginatedOrders = filteredOrders.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        orders: paginatedOrders,
        total: filteredOrders.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/admin/gdpr-logs
 * @desc Get GDPR consent logs
 * @access Admin only
 */
router.get('/gdpr-logs', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    // Mock GDPR logs
    const mockGdprLogs = [
      {
        id: 'gdpr_001',
        userId: 'user_123',
        action: 'consent_given',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        userDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          ipAddress: '192.168.1.1'
        },
        consentDetails: {
          marketing: true,
          analytics: true,
          necessary: true
        }
      },
      {
        id: 'gdpr_002',
        userId: 'user_456',
        action: 'data_deletion_request',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        userDetails: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          ipAddress: '192.168.1.2'
        },
        deletionDetails: {
          reason: 'Privacy concerns',
          dataTypes: ['personal', 'usage']
        }
      }
    ];

    const paginatedLogs = mockGdprLogs.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        logs: paginatedLogs,
        total: mockGdprLogs.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/admin/pricing
 * @desc Get current pricing configuration
 * @access Admin only
 */
router.get('/pricing', async (req, res) => {
  try {
    const pricing = {
      song: {
        basePrice: 0,
        currency: 'TL',
        features: ['3 free songs', 'Custom lyrics', 'Style selection', 'Mood customization', 'Standard quality output'],
        addons: {
          additionalSong: { price: 500, description: 'Additional song (after 3 free)' },
          premiumQuality: { price: 100, description: 'Premium quality upgrade' },
          fastDelivery: { price: 150, description: '3-day delivery (instead of 7-day)' }
        }
      },
      voice: {
        basePrice: 250,
        currency: 'TL',
        features: ['Voice cloning', 'High quality output', 'Multiple languages', 'Custom training', 'Standard support'],
        addons: {
          commercialLicense: { price: 100, description: 'Commercial usage rights' },
          bulkProcessing: { price: 200, description: 'Process 5+ voice clones (20% discount)' },
          premiumQuality: { price: 75, description: 'Premium quality upgrade' }
        }
      },
      video: {
        basePrice: 500,
        currency: 'TL',
        features: ['Video animation', 'Custom prompts', 'High resolution', 'Multiple formats', 'Premium quality output'],
        addons: {
          extendedDuration: { price: 200, description: 'Additional 15 seconds' },
          premiumEffects: { price: 150, description: 'Premium effects pack' },
          fastDelivery: { price: 250, description: '3-day delivery (instead of 7-day)' }
        }
      }
    };

    res.json({ success: true, data: pricing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/admin/pricing/update
 * @desc Update pricing configuration
 * @access Admin only
 */
router.post('/pricing/update', async (req, res) => {
  try {
    const { service, pricing } = req.body;
    
    if (!service || !pricing) {
      return res.status(400).json({ error: 'Service and pricing are required' });
    }

    // In a real application, you'd update pricing in database or config
    res.json({ 
      success: true, 
      message: `${service} pricing updated successfully`,
      data: { service, pricing }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/admin/content
 * @desc Get website content configuration
 * @access Admin only
 */
router.get('/content', async (req, res) => {
  try {
    const content = {
      hero: {
        title: 'Create Your Perfect Song',
        subtitle: 'AI-powered music creation for every occasion',
        slogan: 'Where memories become melodies',
        backgroundImage: '/images/hero-bg.jpg',
        ctaText: 'Start Creating',
        ctaLink: '#song-request'
      },
      services: {
        song: {
          title: 'Custom Song Creation',
          description: 'AI-generated songs tailored to your story',
          icon: '🎵',
          features: ['Personalized lyrics', 'Multiple styles', 'Custom duration']
        },
        voice: {
          title: 'Voice Cloning',
          description: 'Clone any voice with AI technology',
          icon: '🎤',
          features: ['High quality', 'Multiple languages', 'Commercial use']
        },
        video: {
          title: 'Video Animation',
          description: 'Bring your ideas to life with AI animation',
          icon: '🎬',
          features: ['Custom prompts', 'High resolution', 'Multiple formats']
        }
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
            { name: 'additionalNotes', label: 'Additional Notes', type: 'textarea', required: false }
          ]
        },
        voiceCloning: {
          fields: [
            { name: 'fullName', label: 'Full Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'purpose', label: 'Purpose', type: 'text', required: true },
            { name: 'targetLanguage', label: 'Target Language', type: 'select', required: false, options: ['English', 'Spanish', 'French', 'German'] },
            { name: 'quality', label: 'Quality', type: 'select', required: false, options: ['Standard', 'High', 'Premium'] },
            { name: 'additionalNotes', label: 'Additional Notes', type: 'textarea', required: false }
          ]
        },
        videoGeneration: {
          fields: [
            { name: 'fullName', label: 'Full Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'animationStyle', label: 'Animation Style', type: 'select', required: false, options: ['Realistic', 'Cartoon', 'Abstract', 'Cinematic'] },
            { name: 'desiredDuration', label: 'Desired Duration (seconds)', type: 'number', required: false },
            { name: 'animationPrompt', label: 'Animation Prompt', type: 'textarea', required: true },
            { name: 'videoScenario', label: 'Video Scenario', type: 'textarea', required: false },
            { name: 'additionalNotes', label: 'Additional Notes', type: 'textarea', required: false }
          ]
        }
      }
    };

    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/admin/content/update
 * @desc Update website content
 * @access Admin only
 */
router.post('/content/update', async (req, res) => {
  try {
    const { section, content } = req.body;
    
    if (!section || !content) {
      return res.status(400).json({ error: 'Section and content are required' });
    }

    // In a real application, you'd update content in database or config files
    res.json({ 
      success: true, 
      message: `${section} content updated successfully`,
      data: { section, content }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/admin/email-templates
 * @desc Get email template configurations
 * @access Admin only
 */
router.get('/email-templates', async (req, res) => {
  try {
    const templates = {
      welcome: {
        name: 'Welcome Email',
        subject: 'Welcome to SongCreator!',
        body: `Hi {{userName}},

Welcome to SongCreator! We're excited to have you on board.

Your account has been successfully created and you can now start creating amazing AI-generated content.

Best regards,
The SongCreator Team`,
        variables: ['{{userName}}', '{{userEmail}}'],
        enabled: true
      },
      orderConfirmation: {
        name: 'Order Confirmation',
        subject: 'Order Confirmed - {{orderType}}',
        body: `Hi {{userName}},

Thank you for your order! We've received your request for {{orderType}}.

Order Details:
- Order ID: {{orderId}}
- Service: {{orderType}}
- Price: {{price}}
- Status: {{status}}

We'll start processing your request immediately and will keep you updated on the progress.

Best regards,
The SongCreator Team`,
        variables: ['{{userName}}', '{{orderType}}', '{{orderId}}', '{{price}}', '{{status}}', '{{currency}}'],
        enabled: true
      },
      orderCompleted: {
        name: 'Order Completed',
        subject: 'Your {{orderType}} is Ready!',
        body: `Hi {{userName}},

Great news! Your {{orderType}} has been completed and is ready for download.

Order Details:
- Order ID: {{orderId}}
- Service: {{orderType}}
- Download Link: {{downloadLink}}

We hope you love the result! If you have any questions or need modifications, please don't hesitate to contact us.

Best regards,
The SongCreator Team`,
        variables: ['{{userName}}', '{{orderType}}', '{{orderId}}', '{{downloadLink}}'],
        enabled: true
      },
      passwordReset: {
        name: 'Password Reset',
        subject: 'Password Reset Request',
        body: `Hi {{userName}},

We received a request to reset your password. Click the link below to create a new password:

{{resetLink}}

If you didn't request this, please ignore this email. The link will expire in 24 hours.

Best regards,
The SongCreator Team`,
        variables: ['{{userName}}', '{{resetLink}}'],
        enabled: true
      }
    };

    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/admin/email-templates/update
 * @desc Update email template
 * @access Admin only
 */
router.post('/email-templates/update', async (req, res) => {
  try {
    const { template, content } = req.body;
    
    if (!template || !content) {
      return res.status(400).json({ error: 'Template and content are required' });
    }

    // In a real application, you'd update template in database or config files
    res.json({ 
      success: true, 
      message: `${template} template updated successfully`,
      data: { template, content }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/admin/storage
 * @desc Get detailed storage information
 * @access Admin only
 */
router.get('/storage', async (req, res) => {
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
          lastModified: await getLastModified(audioDir)
        },
        video: {
          path: videoDir,
          size: await getDirectorySize(videoDir),
          fileCount: await getFileCount(videoDir),
          lastModified: await getLastModified(videoDir)
        },
        image: {
          path: imageDir,
          size: await getDirectorySize(imageDir),
          fileCount: await getFileCount(imageDir),
          lastModified: await getLastModified(imageDir)
        },
        temp: {
          path: tempDir,
          size: await getDirectorySize(tempDir),
          fileCount: await getFileCount(tempDir),
          lastModified: await getLastModified(tempDir)
        }
      },
      total: {
        size: await getDirectorySize(uploadsDir),
        fileCount: await getFileCount(uploadsDir)
      }
    };

    res.json({ success: true, data: storageInfo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/admin/storage/cleanup
 * @desc Clean up temporary files and old uploads
 * @access Admin only
 */
router.post('/storage/cleanup', async (req, res) => {
  try {
    const { type = 'temp', olderThan } = req.body;
    
    let cleanedFiles = 0;
    let freedSpace = 0;

    if (type === 'temp') {
      const tempDir = path.join(__dirname, '../uploads/temp');
      const files = await fs.readdir(tempDir);
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (olderThan && (Date.now() - stats.mtime.getTime()) > olderThan) {
          const fileSize = stats.size;
          await fs.remove(filePath);
          cleanedFiles++;
          freedSpace += fileSize;
        }
      }
    }

    res.json({
      success: true,
      message: `Cleanup completed successfully`,
      data: {
        cleanedFiles,
        freedSpace: formatBytes(freedSpace),
        type
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/admin/logs
 * @desc Get system logs
 * @access Admin only
 */
router.get('/logs', async (req, res) => {
  try {
    const { level = 'all', limit = 100 } = req.query;
    
    // In a real application, you'd read from log files or database
    // For now, we'll return mock logs
    const mockLogs = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Song generation completed successfully',
        service: 'suno',
        userId: 'user_123'
      },
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'warn',
        message: 'API rate limit approaching',
        service: 'kits',
        userId: 'user_456'
      },
      {
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: 'error',
        message: 'Video generation failed',
        service: 'runway',
        userId: 'user_789'
      }
    ];

    let filteredLogs = mockLogs;
    if (level !== 'all') {
      filteredLogs = mockLogs.filter(log => log.level === level);
    }

    res.json({
      success: true,
      data: {
        logs: filteredLogs.slice(0, parseInt(limit)),
        total: filteredLogs.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/admin/system/restart
 * @desc Restart system services
 * @access Admin only
 */
router.post('/system/restart', async (req, res) => {
  try {
    const { service } = req.body;
    
    // In a real application, you'd restart the specified service
    // For now, we'll just return success
    res.json({
      success: true,
      message: service ? `${service} service restarted` : 'All services restarted'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
async function getDirectorySize(dirPath) {
  try {
    if (!await fs.pathExists(dirPath)) return 0;
    
    let totalSize = 0;
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        totalSize += await getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  } catch (error) {
    return 0;
  }
}

async function getFileCount(dirPath) {
  try {
    if (!await fs.pathExists(dirPath)) return 0;
    
    let count = 0;
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        count += await getFileCount(filePath);
      } else {
        count++;
      }
    }
    
    return count;
  } catch (error) {
    return 0;
  }
}

async function getLastModified(dirPath) {
  try {
    if (!await fs.pathExists(dirPath)) return null;
    
    const stats = await fs.stat(dirPath);
    return stats.mtime.toISOString();
  } catch (error) {
    return null;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;

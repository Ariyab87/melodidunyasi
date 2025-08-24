const express = require('express');
const router = express.Router();
const runwayService = require('../services/runwayService');
const { mediaUpload } = require('../middleware/uploadMiddleware');
const path = require('path');

/**
 * @route POST /api/video/generate
 * @desc Generate video animation using RunwayML Gen-3 with media uploads
 * @access Public
 */
router.post('/generate', mediaUpload, async (req, res) => {
  try {
    const {
      fullName,
      email,
      animationStyle,
      desiredDuration,
      animationPrompt,
      videoScenario,
      additionalNotes
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !animationPrompt) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide all required fields: fullName, email, animationPrompt',
        required: ['fullName', 'email', 'animationPrompt']
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }

    // Check if media files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'Media files required',
        message: 'Please upload at least one media file for video generation'
      });
    }

    const mediaFiles = req.files;
    const mediaFilePaths = mediaFiles.map(file => file.path);
    const totalSize = mediaFiles.reduce((sum, file) => sum + file.size, 0);

    console.log('🎬 Video generation request received:', {
      fullName,
      email,
      style: animationStyle,
      duration: desiredDuration,
      prompt: animationPrompt,
      mediaFiles: mediaFiles.length,
      totalSize: `${(totalSize / 1024 / 1024).toFixed(2)}MB`
    });

    // Prepare video data for RunwayML
    const videoData = {
      animationStyle,
      desiredDuration: parseInt(desiredDuration) || 10,
      animationPrompt,
      videoScenario,
      additionalNotes,
      quality: 'high',
      fps: 24
    };

    // Generate video using RunwayML API
    const videoResult = await runwayService.generateVideo(videoData, mediaFilePaths);

    // Prepare response
    const response = {
      success: true,
      message: 'Video generation started successfully',
      data: {
        videoId: videoResult.id,
        status: videoResult.status,
        style: videoResult.animationStyle,
        prompt: videoResult.prompt,
        duration: videoResult.duration,
        fps: videoResult.fps,
        resolution: videoResult.resolution,
        fileSize: videoResult.fileSize,
        mediaFilesCount: videoResult.mediaFilesCount,
        generatedAt: videoResult.generatedAt,
        provider: 'runwayml'
      },
      user: {
        fullName,
        email
      },
      media: {
        filesCount: mediaFiles.length,
        totalSize: totalSize,
        uploadedAt: new Date().toISOString()
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Video generation error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Video generation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/video/status/:videoId
 * @desc Check the status of a video generation request
 * @access Public
 */
router.get('/status/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({
        error: 'Missing video ID',
        message: 'Please provide a valid video ID'
      });
    }

    console.log('🔍 Checking video generation status:', videoId);

    // Check status with RunwayML API
    const status = await runwayService.checkVideoStatus(videoId);

    res.status(200).json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('❌ Video status check error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to check video status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/video/models
 * @desc Get available RunwayML models and capabilities
 * @access Public
 */
router.get('/models', async (req, res) => {
  try {
    console.log('📋 Fetching available RunwayML models');

    const models = await runwayService.getModels();

    res.status(200).json({
      success: true,
      data: models
    });

  } catch (error) {
    console.error('❌ Error fetching models:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch models',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/video/health
 * @desc Check RunwayML API health and configuration
 * @access Public
 */
router.get('/health', (req, res) => {
  const hasApiKey = !!process.env.RUNWAY_API_KEY;
  const apiUrl = process.env.RUNWAY_API_URL || 'https://api.runwayml.com/v1';
  const model = process.env.RUNWAY_MODEL || 'gen-3';

  res.status(200).json({
    success: true,
    data: {
      service: 'RunwayML Video Generation',
      status: hasApiKey ? 'configured' : 'not_configured',
      apiUrl: apiUrl,
      model: model,
      hasApiKey: hasApiKey,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * @route GET /api/video/supported-formats
 * @desc Get supported media formats for video generation
 * @access Public
 */
router.get('/supported-formats', (req, res) => {
  const allowedMediaTypes = process.env.ALLOWED_MEDIA_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'mp4', 'mov', 'avi'];
  const maxTotalSize = 50 * 1024 * 1024; // 50MB total limit

  res.status(200).json({
    success: true,
    data: {
      supportedFormats: {
        images: ['jpg', 'jpeg', 'png'],
        videos: ['mp4', 'mov', 'avi']
      },
      maxTotalSize: maxTotalSize,
      maxTotalSizeMB: (maxTotalSize / 1024 / 1024).toFixed(1),
      maxFiles: 10,
      requirements: {
        minResolution: '720p recommended',
        maxDuration: '60 seconds',
        quality: 'High quality images/videos with good lighting'
      }
    }
  });
});

/**
 * @route GET /api/video/styles
 * @desc Get available animation styles for video generation
 * @access Public
 */
router.get('/styles', (req, res) => {
  const animationStyles = [
    'cinematic',
    'artistic',
    'smooth',
    'dynamic',
    'elegant',
    'playful',
    'dramatic',
    'subtle',
    'energetic',
    'calm'
  ];

  res.status(200).json({
    success: true,
    data: {
      animationStyles,
      description: 'These styles control how your photos and videos are animated and transformed'
    }
  });
});

/**
 * @route GET /api/video/durations
 * @desc Get available duration options for video generation
 * @access Public
 */
router.get('/durations', (req, res) => {
  const durations = [
    { value: 5, label: '5 seconds', description: 'Quick preview' },
    { value: 10, label: '10 seconds', description: 'Standard length' },
    { value: 15, label: '15 seconds', description: 'Extended version' },
    { value: 30, label: '30 seconds', description: 'Full experience' },
    { value: 45, label: '45 seconds', description: 'Extended experience' },
    { value: 60, label: '60 seconds', description: 'Maximum length' }
  ];

  res.status(200).json({
    success: true,
    data: {
      durations,
      note: 'Longer durations may take more time to generate and cost more credits'
    }
  });
});

module.exports = router;

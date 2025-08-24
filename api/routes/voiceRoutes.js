const express = require('express');
const router = express.Router();
const kitsService = require('../services/kitsService');
const { audioUpload } = require('../middleware/uploadMiddleware');
const path = require('path');

/**
 * @route POST /api/voice/clone
 * @desc Clone a voice using KITS AI API with audio upload
 * @access Public
 */
router.post('/clone', audioUpload, async (req, res) => {
  try {
    const {
      fullName,
      email,
      purpose,
      additionalNotes,
      targetLanguage = 'en',
      quality = 'high'
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !purpose) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide all required fields: fullName, email, purpose',
        required: ['fullName', 'email', 'purpose']
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

    // Check if audio file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'Audio file required',
        message: 'Please upload an audio file for voice cloning'
      });
    }

    const audioFilePath = req.file.path;
    const audioFileName = req.file.originalname;
    const audioFileSize = req.file.size;

    console.log('🎤 Voice cloning request received:', {
      fullName,
      email,
      purpose,
      audioFile: audioFileName,
      audioSize: `${(audioFileSize / 1024 / 1024).toFixed(2)}MB`,
      targetLanguage,
      quality
    });

    // Prepare voice data for KITS AI
    const voiceData = {
      purpose,
      additionalNotes,
      targetLanguage,
      quality
    };

    // Clone voice using KITS AI API
    const voiceResult = await kitsService.cloneVoice(voiceData, audioFilePath);

    // Prepare response
    const response = {
      success: true,
      message: 'Voice cloning started successfully',
      data: {
        voiceId: voiceResult.id,
        status: voiceResult.status,
        purpose: voiceResult.purpose,
        quality: voiceResult.quality,
        targetLanguage: voiceResult.targetLanguage,
        processingTime: voiceResult.processingTime,
        generatedAt: voiceResult.generatedAt,
        provider: 'kits-ai'
      },
      user: {
        fullName,
        email
      },
      audio: {
        filename: audioFileName,
        size: audioFileSize,
        uploadedAt: new Date().toISOString()
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Voice cloning error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Voice cloning failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/voice/status/:voiceId
 * @desc Check the status of a voice cloning request
 * @access Public
 */
router.get('/status/:voiceId', async (req, res) => {
  try {
    const { voiceId } = req.params;

    if (!voiceId) {
      return res.status(400).json({
        error: 'Missing voice ID',
        message: 'Please provide a valid voice ID'
      });
    }

    console.log('🔍 Checking voice cloning status:', voiceId);

    // Check status with KITS AI API
    const status = await kitsService.checkVoiceStatus(voiceId);

    res.status(200).json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('❌ Voice status check error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to check voice status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/voice/synthesize
 * @desc Generate speech using a cloned voice
 * @access Public
 */
router.post('/synthesize', async (req, res) => {
  try {
    const {
      voiceId,
      text,
      speed = 1.0,
      pitch = 1.0,
      emotion = 'neutral'
    } = req.body;

    // Validate required fields
    if (!voiceId || !text) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide voiceId and text',
        required: ['voiceId', 'text']
      });
    }

    // Validate text length
    if (text.length > 1000) {
      return res.status(400).json({
        error: 'Text too long',
        message: 'Text must be 1000 characters or less'
      });
    }

    console.log('🗣️  Speech synthesis request:', {
      voiceId,
      textLength: text.length,
      speed,
      pitch,
      emotion
    });

    // Generate speech using KITS AI API
    const speechResult = await kitsService.generateSpeech(voiceId, text, {
      speed,
      pitch,
      emotion
    });

    res.status(200).json({
      success: true,
      message: 'Speech generated successfully',
      data: speechResult
    });

  } catch (error) {
    console.error('❌ Speech synthesis error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Speech synthesis failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/voice/models
 * @desc Get available KITS AI models and capabilities
 * @access Public
 */
router.get('/models', async (req, res) => {
  try {
    console.log('📋 Fetching available KITS AI models');

    const models = await kitsService.getModels();

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
 * @route GET /api/voice/health
 * @desc Check KITS AI API health and configuration
 * @access Public
 */
router.get('/health', (req, res) => {
  const hasApiKey = !!process.env.KITS_API_KEY;
  const apiUrl = process.env.KITS_API_URL || 'https://api.kits.ai/v1';
  const model = process.env.KITS_MODEL || 'voice-cloning';

  res.status(200).json({
    success: true,
    data: {
      service: 'KITS AI Voice Cloning',
      status: hasApiKey ? 'configured' : 'not_configured',
      apiUrl: apiUrl,
      model: model,
      hasApiKey: hasApiKey,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * @route GET /api/voice/supported-formats
 * @desc Get supported audio formats for voice cloning
 * @access Public
 */
router.get('/supported-formats', (req, res) => {
  const allowedAudioTypes = process.env.ALLOWED_AUDIO_TYPES?.split(',') || ['mp3', 'wav', 'm4a', 'aac'];
  const maxFileSize = process.env.MAX_FILE_SIZE || 10 * 1024 * 1024; // 10MB

  res.status(200).json({
    success: true,
    data: {
      supportedFormats: allowedAudioTypes,
      maxFileSize: maxFileSize,
      maxFileSizeMB: (maxFileSize / 1024 / 1024).toFixed(1),
      requirements: {
        minDuration: '30 seconds',
        maxDuration: '10 minutes',
        quality: 'Clear speech/singing with minimal background noise'
      }
    }
  });
});

module.exports = router;

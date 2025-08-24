const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const sunoService = require('../services/sunoService');

/**
 * @route GET /api/debug/suno-last
 * @desc Get the last Suno API response for debugging
 * @access Public (for debugging purposes)
 */
router.get('/suno-last', (req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads/last_suno_response.json');
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'No Suno response file found',
        message: 'No songs have been generated yet, or the response file was not saved'
      });
    }

    const responseData = fs.readFileSync(filePath, 'utf8');
    const parsedData = JSON.parse(responseData);
    
    res.status(200).json({
      success: true,
      message: 'Last Suno API response retrieved',
      data: parsedData,
      fileInfo: {
        path: filePath,
        size: fs.statSync(filePath).size,
        lastModified: fs.statSync(filePath).mtime
      }
    });
    
  } catch (error) {
    console.error('❌ Error reading Suno response file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read response file',
      message: error.message
    });
  }
});

/**
 * @route GET /api/debug/suno-status
 * @desc Get current Suno service status and configuration
 * @access Public (for debugging purposes)
 */
router.get('/suno-status', (req, res) => {
  try {
    const status = {
      apiKey: process.env.SUNO_API_KEY ? 'Configured' : 'Not configured',
      apiKeyPreview: process.env.SUNO_API_KEY ? 
        `***${process.env.SUNO_API_KEY.slice(-4)}` : 'N/A',
      baseUrl: process.env.SUNO_BASE_URL || 'https://api.suno.ai',
      model: process.env.SUNO_MODEL || 'suno-music-1',
      enabled: process.env.SUNO_ENABLED !== 'false',
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json({
      success: true,
      message: 'Suno service status',
      data: status
    });
    
  } catch (error) {
    console.error('❌ Error getting Suno status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get status',
      message: error.message
    });
  }
});

/**
 * @route GET /api/debug/suno-auth
 * @desc Get SunoAPI.org authentication debug information
 * @access Public (for debugging purposes)
 */
router.get('/suno-auth', (req, res) => {
  try {
    const sunoKey = process.env.SUNOAPI_ORG_API_KEY;
    const hasKey = !!sunoKey;
    const keyMask = hasKey && sunoKey.length >= 8 ? 
      `${sunoKey.substring(0, 4)}...${sunoKey.substring(sunoKey.length - 4)}` : 
      '***';
    
    const authHeaderPresent = hasKey;
    const baseUrl = process.env.SUNOAPI_ORG_BASE_URL || 'https://api.sunoapi.org/api/v1';
    const generatePath = process.env.SUNOAPI_ORG_GENERATE_PATH || '/generate';
    const recordInfoPath = process.env.SUNOAPI_ORG_RECORDINFO_PATH || '/generate/record-info';
    
    res.status(200).json({
      success: true,
      message: 'SunoAPI.org authentication debug info',
      data: {
        hasKey,
        keyMask,
        authHeaderPresent,
        baseUrl,
        generatePath,
        recordInfoPath
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error getting SunoAPI.org auth debug info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get auth debug info',
      message: error.message
    });
  }
});

/**
 * @route POST /api/debug/test-suno-auth
 * @desc Test SunoAPI.org authentication with current credentials
 * @access Public (for debugging purposes)
 */
router.post('/test-suno-auth', async (req, res) => {
  try {
    const axios = require('axios');
    const apiKey = process.env.SUNOAPI_ORG_API_KEY;
    const baseUrl = process.env.SUNOAPI_ORG_BASE_URL || 'https://api.sunoapi.org/api/v1';
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'No API key configured',
        message: 'SUNOAPI_ORG_API_KEY is missing'
      });
    }
    
    console.log('🔍 [DEBUG] Testing SunoAPI.org authentication...');
    console.log('🔍 [DEBUG] API Key:', apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4));
    console.log('🔍 [DEBUG] Base URL:', baseUrl);
    
    // Test with minimal payload
    const testPayload = {
      prompt: 'test',
      duration: 30,
      model: 'V4',
      customMode: false,
      instrumental: false,
      callBackUrl: process.env.SUNOAPI_ORG_CALLBACK_URL || 'https://webhook.site/your-unique-url'
    };
    
    const response = await axios.post(`${baseUrl}/generate`, testPayload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      data: {
        status: response.status,
        response: response.data,
        apiKey: apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4),
        baseUrl: baseUrl
      }
    });
    
  } catch (error) {
    console.error('❌ [DEBUG] SunoAPI.org auth test failed:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    
    res.status(500).json({
      success: false,
      error: 'Authentication test failed',
      message: error.message,
      details: {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      }
    });
  }
});

/**
 * @route GET /api/debug/uploads
 * @desc List all files in uploads directory for debugging
 * @access Public (for debugging purposes)
 */
router.get('/uploads', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    const audioDir = path.join(uploadsDir, 'audio');
    
    const files = {
      uploads: fs.readdirSync(uploadsDir),
      audio: fs.existsSync(audioDir) ? fs.readdirSync(audioDir) : [],
      lastSunoResponse: fs.existsSync(path.join(uploadsDir, 'last_suno_response.json')) ? 
        fs.statSync(path.join(uploadsDir, 'last_suno_response.json')).size : 0
    };
    
    res.status(200).json({
      success: true,
      message: 'Uploads directory contents',
      data: files
    });
    
  } catch (error) {
    console.error('❌ Error reading uploads directory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read uploads directory',
      message: error.message
    });
  }
});

/**
 * @route GET /api/debug/suno-diagnose
 * @desc Perform diagnostic test on Suno API to identify connectivity/credits issues
 * @access Public
 */
router.get('/suno-diagnose', async (req, res) => {
  try {
    console.log('🔍 [DEBUG] Suno diagnostic requested');
    
    // Check if Suno API key is configured
    if (!process.env.SUNO_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Suno API key not configured',
        message: 'Please set SUNO_API_KEY environment variable'
      });
    }

    // Run diagnostic test using existing service instance
    const diagnosticResult = await sunoService.diagnoseSunoAPI();
    
    console.log('🔍 [DEBUG] Diagnostic completed:', {
      status: diagnosticResult.status,
      ok: diagnosticResult.ok,
      region: diagnosticResult.region,
      viaProxy: diagnosticResult.viaProxy
    });

    res.status(200).json({
      success: true,
      message: 'Suno API diagnostic completed',
      data: diagnosticResult
    });

  } catch (error) {
    console.error('❌ [DEBUG] Error during Suno diagnostic:', error);
    res.status(500).json({
      success: false,
      error: 'Diagnostic failed',
      message: error.message
    });
  }
});

module.exports = router;

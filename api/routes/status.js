const express = require('express');
const router = express.Router();
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const http = require('http');
const https = require('https');

// Get the current music provider
const { getMusicProvider } = require('../services/providers');
const musicProvider = getMusicProvider();
const currentProvider = musicProvider.getProviderInfo().name;
const baseUrl = musicProvider.getProviderInfo().baseUrl;

// Import request store for song lookup
const requestStore = require('../lib/requestStore');

// Proxy configuration - prioritize PROXY_URL over SUNO_HTTP_PROXY
const proxyUrl = process.env.PROXY_URL || process.env.SUNO_HTTP_PROXY;

// Agent configuration with proxy support
const agentOptions = proxyUrl ? 
  { 
    httpsAgent: new HttpsProxyAgent(proxyUrl),
    httpAgent: new HttpsProxyAgent(proxyUrl)
  } : 
  {
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true })
  };

/**
 * @route GET /api/status/song
 * @desc Get song status by jobId or songId
 * @access Public
 */
router.get('/song', async (req, res) => {
  try {
    const { jobId, songId } = req.query;
    
    if (!jobId && !songId) {
      return res.status(400).json({
        ok: false,
        error: 'MISSING_JOB_ID',
        message: 'Please provide either jobId or songId parameter'
      });
    }

    let resolvedJobId = jobId;
    let resolvedSongId = songId;

    // If only songId provided, look up providerJobId from store
    if (!resolvedJobId && resolvedSongId) {
      try {
        const record = await requestStore.getById(resolvedSongId);
        if (!record) {
          return res.status(404).json({
            ok: false,
            error: 'SONG_NOT_FOUND',
            message: `No song found with ID: ${resolvedSongId}`
          });
        }
        
        if (!record.providerJobId) {
          return res.status(400).json({
            ok: false,
            error: 'NO_PROVIDER_JOB_ID',
            message: `Song ${resolvedSongId} has no provider job ID`
          });
        }
        
        resolvedJobId = record.providerJobId;
        console.log(`[status/song] Resolved songId=${resolvedSongId} → jobId=${resolvedJobId}`);
      } catch (storeError) {
        console.error('[status/song] Store lookup error:', storeError.message);
        return res.status(500).json({
          ok: false,
          error: 'STORE_ERROR',
          message: 'Failed to lookup song from store'
        });
      }
    }

    console.log('[status/song] songId=%s jobId=%s', resolvedSongId || '-', resolvedJobId || '-');

    // Get status from provider
    try {
      const statusResult = await musicProvider.getRecordInfo({ jobId: resolvedJobId });
      
      // Get song record for additional context
      let songRecord = null;
      if (resolvedSongId) {
        songRecord = await requestStore.getById(resolvedSongId);
      } else {
        // Try to find song by providerJobId
        songRecord = await requestStore.getByProviderJobId(resolvedJobId);
      }

      const response = {
        ok: true,
        songId: songRecord?.id || resolvedSongId || null,
        jobId: resolvedJobId,
        status: statusResult.status,
        result: {
          audioUrl: statusResult.audioUrl,
          progress: statusResult.progress,
          recordId: statusResult.recordId
        },
        raw: statusResult,
        provider: currentProvider,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
      
    } catch (providerError) {
      console.error('[status/song] Provider error:', providerError.message);
      
      // Return partial success if we have store data
      if (resolvedSongId) {
        try {
          const record = await requestStore.getById(resolvedSongId);
          if (record) {
            return res.status(200).json({
              ok: true,
              songId: resolvedSongId,
              jobId: resolvedJobId,
              status: record.status || 'unknown',
              result: {
                audioUrl: record.fileUrl || null,
                progress: null,
                recordId: record.providerRecordId || null
              },
              raw: { error: providerError.message },
              provider: currentProvider,
              timestamp: new Date().toISOString(),
              note: 'Status from store (provider unavailable)'
            });
          }
        } catch (storeError) {
          console.error('[status/song] Store fallback error:', storeError.message);
        }
      }

      res.status(500).json({
        ok: false,
        error: 'PROVIDER_ERROR',
        message: 'Failed to get status from provider',
        details: providerError.message,
        jobId: resolvedJobId,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('[status/song] Unexpected error:', error.message);
    res.status(500).json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/status/song/:jobId
 * @desc Get song status by jobId (path parameter)
 * @access Public
 */
router.get('/song/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      return res.status(400).json({
        ok: false,
        error: 'MISSING_JOB_ID',
        message: 'Job ID is required'
      });
    }

    console.log('[status/song] songId=%s jobId=%s', '-', jobId);

    // Get status from provider
    try {
      const statusResult = await musicProvider.getRecordInfo({ jobId });
      
      // Try to find song by providerJobId
      let songRecord = null;
      songRecord = await requestStore.getByProviderJobId(jobId);

      const response = {
        ok: true,
        songId: songRecord?.id || null,
        jobId: jobId,
        status: statusResult.status,
        result: {
          audioUrl: statusResult.audioUrl,
          progress: statusResult.progress,
          recordId: statusResult.recordId
        },
        raw: statusResult,
        provider: currentProvider,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
      
    } catch (providerError) {
      console.error('[status/song] Provider error:', providerError.message);
      
      // Return partial success if we have store data
      const songRecord = await requestStore.getByProviderJobId(jobId);
      
      if (songRecord) {
        return res.status(200).json({
          ok: true,
          songId: songRecord.id,
          jobId: jobId,
          status: songRecord.status || 'unknown',
          result: {
            audioUrl: songRecord.fileUrl || null,
            progress: null,
            recordId: songRecord.providerRecordId || null
          },
          raw: { error: providerError.message },
          provider: currentProvider,
          timestamp: new Date().toISOString(),
          note: 'Status from store (provider unavailable)'
        });
      }

      res.status(500).json({
        ok: false,
        error: 'PROVIDER_ERROR',
        message: 'Failed to get status from provider',
        details: providerError.message,
        jobId: jobId,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('[status/song] Unexpected error:', error.message);
    res.status(500).json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/status/music
 * @desc Check music provider availability using the configured provider
 * @access Public
 */
router.get('/music', async (req, res) => {
  try {
    console.log('🔍 [STATUS] Checking music provider availability...');
    console.log('🔍 [STATUS] Provider:', currentProvider);
    console.log('🔍 [STATUS] Base URL:', baseUrl);
    console.log('🔍 [STATUS] Using proxy:', proxyUrl || 'none');

    // Use the music provider's health check
    const healthStatus = await musicProvider.health();

    // Handle AUTH_ERROR specifically
    if (healthStatus.reason === 'AUTH_ERROR') {
      return res.status(401).json({
        ok: false,
        status: 401,
        reason: 'AUTH_ERROR',
        message: 'Authorization failed. Check SUNOAPI_ORG_API_KEY and account credits.',
        provider: currentProvider,
        baseUrl: baseUrl,
        proxy: {
          configured: !!proxyUrl,
          url: proxyUrl || null
        },
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      ...healthStatus,
      provider: currentProvider,
      baseUrl: baseUrl,
      proxy: {
        configured: !!proxyUrl,
        url: proxyUrl || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔍 [STATUS] Error checking music provider:', error.message);
    
    // Enhanced error logging
    if (error.response) {
      console.error('❌ Response details:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });
    }
    
    res.status(500).json({
      ok: false,
      status: 500,
      error: error.message,
      provider: currentProvider,
      baseUrl: baseUrl,
      proxy: {
        configured: !!proxyUrl,
        url: proxyUrl || null
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/status/suno
 * @desc Check Suno API availability with lightweight ping (legacy endpoint)
 * @access Public
 */
router.get('/suno', async (req, res) => {
  try {
    // If using sunoapi_org, redirect to music status
    if (process.env.MUSIC_PROVIDER === 'sunoapi_org') {
      console.log('🔍 [STATUS] Redirecting Suno status check to music provider');
      return res.redirect('/api/status/music');
    }

    const sunoBaseUrl = process.env.SUNO_BASE_URL || 'https://api.suno.ai';
    const apiKey = process.env.SUNO_API_KEY;
    
    if (!apiKey) {
      return res.status(503).json({
        ok: false,
        status: 503,
        error: 'Suno API key not configured',
        region: process.env.DEPLOY_REGION || 'local',
        viaProxy: !!proxyUrl,
        proxyUrl: proxyUrl
      });
    }

    console.log('🔍 [STATUS] Checking Suno API availability...');
    console.log('🔍 [STATUS] Base URL:', sunoBaseUrl);
    console.log('🔍 [STATUS] Using proxy:', proxyUrl || 'none');

    // Perform lightweight HEAD request to check availability
    const response = await axios.head(`${sunoBaseUrl}/v1`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'song-webapp/1.0'
      },
      timeout: 10000, // 10 second timeout for status check
      validateStatus: s => s >= 200 && s < 600, // Accept any response to check status
      ...agentOptions
    });

    const status = response.status;
    const ok = status >= 200 && status < 500; // Consider 4xx as "available" (API responding)

    console.log('🔍 [STATUS] Suno API response:', { status, ok });

    res.status(200).json({
      ok,
      status,
      provider: 'suno_official',
      region: process.env.DEPLOY_REGION || 'local',
      viaProxy: !!proxyUrl,
      proxyUrl: proxyUrl,
      timestamp: new Date().toISOString(),
      message: ok ? 'Suno API is responding' : 'Suno API is experiencing issues',
      // Add region block hint for 503 errors
      ...(status === 503 && {
        code: 'REGION_BLOCK',
        hint: 'Region/Network block detected. Try using a proxy or switching regions.'
      })
    });

  } catch (error) {
    console.error('🔍 [STATUS] Error checking Suno API:', error.message);
    
    const isNetworkError = !error.response;
    const status = error.response?.status || (isNetworkError ? 'network-error' : 'unknown');
    
    res.status(503).json({
      ok: false,
      status,
      error: error.message,
      provider: 'suno_official',
      region: process.env.DEPLOY_REGION || 'local',
      viaProxy: !!proxyUrl,
      proxyUrl: proxyUrl,
      timestamp: new Date().toISOString(),
      message: isNetworkError ? 'Network error - Suno API unreachable' : 'Suno API error'
    });
  }
});

/**
 * @route GET /api/status
 * @desc Get overall system status
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const providerInfo = musicProvider.getProviderInfo();
    
    const status = {
      system: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      region: process.env.DEPLOY_REGION || 'local',
      music: {
        provider: providerInfo.provider,
        baseUrl: providerInfo.baseUrl,
        configured: providerInfo.configured,
        proxy: providerInfo.proxy
      },
      proxy: {
        configured: !!proxyUrl,
        url: proxyUrl || null,
        global: process.env.PROXY_URL || null,
        legacy: process.env.SUNO_HTTP_PROXY || null
      }
    };

    res.status(200).json(status);
  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({
      system: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

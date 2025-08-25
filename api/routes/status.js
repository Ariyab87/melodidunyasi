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

// Import request store for song status lookups
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
        error: 'Missing required parameter',
        message: 'Please provide either jobId or songId'
      });
    }
    
    let record = null;
    let resolvedJobId = jobId;
    
    // If songId provided, look up the record to get jobId
    if (songId && !jobId) {
      try {
        record = await requestStore.getById(songId);
        if (record && record.providerJobId) {
          resolvedJobId = record.providerJobId;
          console.log(`[STATUS] Resolved songId ${songId} → jobId ${resolvedJobId}`);
        } else {
          return res.status(200).json({
            ok: true,
            songId,
            jobId: null,
            status: record?.status || 'not_found',
            audioUrls: record?.audioUrl ? [record.audioUrl] : [],
            result: record,
            updatedAt: record?.updatedAt || new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`[STATUS] Error looking up songId ${songId}:`, error.message);
        return res.status(200).json({
          ok: true,
          songId,
          jobId: null,
          status: 'error',
          audioUrls: [],
          result: { error: error.message },
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    // If we have a jobId, check provider status
    if (resolvedJobId) {
      try {
        const provider = getMusicProvider();
        const statusInfo = await provider.getRecordInfo({ jobId: resolvedJobId });
        
        // Normalize the response
        const normalized = {
          ok: true,
          jobId: resolvedJobId,
          songId: songId || null,
          status: statusInfo.status || 'processing',
          audioUrls: statusInfo.audioUrl ? [statusInfo.audioUrl] : [],
          result: statusInfo,
          updatedAt: new Date().toISOString()
        };
        
        // If we have a record, update it with the latest status
        if (record && statusInfo.status !== record.status) {
          try {
            await requestStore.update(record.id, {
              status: statusInfo.status,
              audioUrl: statusInfo.audioUrl,
              updatedAt: normalized.updatedAt
            });
            await requestStore.saveNow();
            console.log(`[STATUS] Updated record ${record.id} status to ${statusInfo.status}`);
          } catch (updateError) {
            console.warn(`[STATUS] Failed to update record ${record.id}:`, updateError.message);
          }
        }
        
        return res.status(200).json(normalized);
        
      } catch (providerError) {
        console.error(`[STATUS] Provider error for jobId ${resolvedJobId}:`, providerError.message);
        
        // Return current record status if available, otherwise error
        if (record) {
          return res.status(200).json({
            ok: true,
            jobId: resolvedJobId,
            songId: songId || null,
            status: record.status || 'error',
            audioUrls: record.audioUrl ? [record.audioUrl] : [],
            result: record,
            updatedAt: record.updatedAt || new Date().toISOString()
          });
                 } else {
           return res.status(200).json({
             ok: true,
             jobId: resolvedJobId,
             songId: songId || null,
             status: 'error',
             audioUrls: [],
             result: { error: providerError.message },
             updatedAt: new Date().toISOString()
           });
         }
      }
    }
    
    // Fallback: return record status if available
    if (record) {
      return res.status(200).json({
        ok: true,
        songId: songId || null,
        jobId: record.providerJobId || null,
        status: record.status || 'unknown',
        audioUrls: record.audioUrl ? [record.audioUrl] : [],
        result: record,
        updatedAt: record.updatedAt || new Date().toISOString()
      });
    }
    
    // No record found
    return res.status(200).json({
      ok: true,
      songId: songId || null,
      jobId: jobId || null,
      status: 'not_found',
      audioUrls: [],
      result: null,
      updatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[STATUS] Error in song status endpoint:', error.message);
    res.status(500).json({
      ok: false,
      error: 'Internal server error',
      message: error.message,
      updatedAt: new Date().toISOString()
    });
  }
});

module.exports = router;

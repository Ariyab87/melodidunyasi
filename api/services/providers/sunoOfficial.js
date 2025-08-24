const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const http = require('http');
const https = require('https');
const { HttpsProxyAgent } = require('https-proxy-agent');

// Agent configuration without proxy support
const agentOptions = {
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
};

// Exponential backoff helper
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function withBackoff(fn, { tries = 5, baseMs = 600, maxMs = 5000 } = {}) {
  let attempt = 0;
  while (true) {
    try { 
      return await fn(); 
    } catch (err) {
      const status = err?.response?.status;
      const transient = !status || (status >= 500 && status < 600);
      if (!transient || ++attempt >= tries) throw err;
      const delay = Math.min(baseMs * 2 ** (attempt - 1), maxMs) + Math.random() * 250;
      console.warn(`[RETRY] attempt ${attempt}/${tries} after ${delay|0}ms (status=${status})`);
      await sleep(delay);
    }
  }
}

class SunoOfficialProvider {
  constructor() {
    this.apiKey = process.env.SUNO_API_KEY;
    this.apiUrl = process.env.SUNO_BASE_URL || 'https://api.suno.ai/v1';
    this.model = process.env.SUNO_MODEL || 'suno-music-1';
    
    if (!this.apiKey) {
      console.warn('⚠️  SUNO_API_KEY not found in environment variables');
    } else {
      console.log('✅ Official Suno API key configured successfully');
    }
    
    // Log connection configuration
    console.log('🔍 [PROXY] Official Suno provider using direct connection');
  }

  /**
   * Generate a song using official Suno API
   * @param {Object} songData - Song generation parameters
   * @returns {Promise<Object>} - Generated song data with common shape
   */
  async generateSong(songData) {
    try {
      if (!this.apiKey) {
        throw new Error('Suno API key not configured');
      }

      const {
        prompt,
        style,
        mood,
        tempo,
        duration = 30,
        instrumental = false,
        language = 'en',
        debugSmall = false
      } = songData;

      // Validate required fields
      if (!prompt) {
        throw new Error('Song prompt is required');
      }

      // Prepare the request payload
      let requestPayload = {
        prompt: this._buildPrompt(prompt, style, mood, tempo),
        model: this.model,
        duration: Math.min(Math.max(duration, 10), 300), // 10-300 seconds
        instrumental: instrumental,
        language: language,
        // Additional parameters for better control
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: 1000
      };

      // Debug small request path for testing
      if (debugSmall) {
        console.log('🧪 [DEBUG] Using small test request path');
        requestPayload = {
          prompt: `${prompt} (10s test)`,
          model: this.model,
          duration: 10
        };
        console.log('🧪 [DEBUG] Simplified payload:', requestPayload);
      }

      console.log('🎵 Generating song with Official Suno API:', {
        prompt: requestPayload.prompt,
        duration: requestPayload.duration,
        style: style,
        mood: mood,
        debugSmall: debugSmall
      });

      // Prepare axios options with proxy support and custom User-Agent
      const postOptions = {
        headers: { 
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'song-webapp/1.0'
        },
        timeout: 30000, // 30 seconds timeout
        validateStatus: s => s >= 200 && s < 300,
        ...agentOptions
      };

      // Make API request to Suno with exponential backoff
      let sunoResponse;
      try {
        sunoResponse = await withBackoff(() => 
          axios.post(`${this.apiUrl}/music/generate`, requestPayload, postOptions)
        );
      } catch (err) {
        const res = err.response;
        const status = res?.status;
        
        console.error('[SUNO_OFFICIAL][ERR] status:', status);
        console.error('[SUNO_OFFICIAL][ERR] headers:', res?.headers);
        console.error('[SUNO_OFFICIAL][ERR] data:', typeof res?.data === 'string' ? res.data : JSON.stringify(res?.data, null, 2));
        
        // Handle specific error types
        if (status === 503) {
          const regionHint = process.env.DEPLOY_REGION || 'local';
          throw new Error(`Suno API temporarily unavailable (503): ${res?.data?.message || 'Service unavailable'}`);
        }
        
        if (status >= 400 && status < 500) {
          // Don't retry on 4xx errors, surface full body
          throw new Error(`Suno API error (${status}): ${res?.data?.message || 'Client error'}`);
        }
        
        // For other errors (5xx, network issues), throw generic error
        throw new Error(`Suno API error (${status || 'no-status'}): ${res?.data?.message || 'Unknown error'}`);
      }

      const response = sunoResponse;

      // 🔍 DEBUG: Log full response and save to file
      const result = response.data;
      console.log('[SUNO_OFFICIAL][RAW]', JSON.stringify(result, null, 2));
      
      // Save response to file for debugging
      await this._saveSunoResponse(result);
      
      // Extract and log audio URL
      const audioUrl = result.audio_url;
      console.log('[SUNO_OFFICIAL] audioUrl:', audioUrl);
      
      if (!audioUrl) {
        console.warn('⚠️  [SUNO_OFFICIAL] WARNING: No audio_url found in response!');
        console.warn('⚠️  [SUNO_OFFICIAL] Response keys:', Object.keys(result));
      }
      
      if (result && result.status === 'success') {
        // Return in common shape
        return {
          audio_url: result.audio_url,
          job_id: result.id || this._generateId(),
          status: 'completed',
          duration: result.duration || duration,
          prompt: prompt,
          style: style,
          mood: mood,
          tempo: tempo,
          generatedAt: new Date().toISOString(),
          provider: 'suno_official',
          metadata: {
            model: this.model,
            apiVersion: 'v1',
            processingTime: result.processing_time || null
          }
        };
      } else {
        throw new Error('Unexpected response format from Suno API');
      }

    } catch (error) {
      console.error('❌ Error generating song with Official Suno:', error.message);
      throw error;
    }
  }

  /**
   * Check the health of the official Suno API
   * @returns {Promise<Object>} - Health status
   */
  async health() {
    try {
      if (!this.apiKey) {
        return {
          ok: false,
          status: 503,
          error: 'Suno API key not configured',
          provider: 'suno_official'
        };
      }

      console.log('🔍 [HEALTH] Checking Official Suno API availability...');
      console.log('🔍 [HEALTH] Base URL:', this.apiUrl);
      console.log('🔍 [HEALTH] Using proxy:', proxyUrl || 'none');

      // Perform lightweight HEAD request to check availability
      const response = await axios.head(`${this.apiUrl}/v1`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'song-webapp/1.0'
        },
        timeout: 10000, // 10 second timeout for status check
        validateStatus: s => s >= 200 && s < 600, // Accept any response to check status
        ...agentOptions
      });

      const status = response.status;
      const ok = status >= 200 && status < 500; // Consider 4xx as "available" (API responding)

      console.log('🔍 [HEALTH] Official Suno API response:', { status, ok });

      return {
        ok,
        status,
        provider: 'suno_official',
        region: process.env.DEPLOY_REGION || 'local',
        viaProxy: !!proxyUrl,
        proxyUrl: proxyUrl,
        timestamp: new Date().toISOString(),
        message: ok ? 'Official Suno API is responding' : 'Official Suno API is experiencing issues'
      };

    } catch (error) {
      console.error('🔍 [HEALTH] Error checking Official Suno API:', error.message);
      
      const isNetworkError = !error.response;
      const status = error.response?.status || (isNetworkError ? 'network-error' : 'unknown');
      
      return {
        ok: false,
        status,
        error: error.message,
        provider: 'suno_official',
        region: process.env.DEPLOY_REGION || 'local',
        viaProxy: !!proxyUrl,
        proxyUrl: proxyUrl,
        timestamp: new Date().toISOString(),
        message: isNetworkError ? 'Network error - Official Suno API unreachable' : 'Official Suno API error'
      };
    }
  }

  /**
   * Run diagnostics on the official Suno API
   * @returns {Promise<Object>} - Diagnostic results
   */
  async diagnose() {
    try {
      console.log('[DIAG] Starting Official Suno API diagnostic test...');
      
      const diagnosticPayload = {
        prompt: 'diagnostic test',
        model: this.model,
        duration: 5
      };

      console.log('[DIAG] Using payload:', diagnosticPayload);
      console.log('[DIAG] API URL:', this.apiUrl);
      console.log('[DIAG] Using proxy:', proxyUrl || 'none');

      // Prepare axios options with proxy support and custom User-Agent
      const postOptions = {
        headers: { 
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'song-webapp/1.0'
        },
        timeout: 30000, // 30 seconds timeout
        validateStatus: s => s >= 200 && s < 600, // Accept any response to check status
        ...agentOptions
      };

      // Make minimal diagnostic request
      const response = await axios.post(`${this.apiUrl}/music/generate`, diagnosticPayload, postOptions);
      
      const status = response.status;
      const body = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
      
      console.log(`[DIAG] Response status: ${status}`);
      console.log(`[DIAG] Response body: ${body.substring(0, 500)}${body.length > 500 ? '...' : ''}`);
      
      return {
        ok: status >= 200 && status < 500,
        status,
        provider: 'suno_official',
        region: process.env.DEPLOY_REGION || 'local',
        viaProxy: !!proxyUrl,
        proxyUrl: proxyUrl,
        body: body.substring(0, 1000), // Limit body size in response
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('[DIAG] Official Suno API diagnostic test failed:', error.message);
      
      const res = error.response;
      const status = res?.status || 'network-error';
      const body = res?.data ? (typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2)) : 'No response body';
      
      return {
        ok: false,
        status,
        provider: 'suno_official',
        region: process.env.DEPLOY_REGION || 'local',
        viaProxy: !!proxyUrl,
        proxyUrl: proxyUrl,
        body: `Error: ${error.message}. Response: ${body.substring(0, 1000)}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Save Suno API response to file for debugging
   * @param {Object} responseData - The response data from Suno API
   * @private
   */
  async _saveSunoResponse(responseData) {
    try {
      const uploadsDir = path.join(__dirname, '../../uploads');
      const filePath = path.join(uploadsDir, 'last_suno_official_response.json');
      
      // Ensure uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const responseWithTimestamp = {
        ...responseData,
        debugTimestamp: new Date().toISOString(),
        debugInfo: 'This response was saved for debugging purposes (Official Suno)',
        proxyUsed: proxyUrl || 'none'
      };
      
      fs.writeFileSync(filePath, JSON.stringify(responseWithTimestamp, null, 2));
      console.log('🔍 [DOWNLOAD] saved Official Suno response to:', filePath);
      
    } catch (error) {
      console.error('❌ Error saving Official Suno response:', error);
    }
  }

  /**
   * Build a comprehensive prompt for better song generation
   * @param {string} prompt - Base prompt
   * @param {string} style - Musical style
   * @param {string} mood - Emotional mood
   * @param {string} tempo - Tempo preference
   * @returns {string} - Enhanced prompt
   */
  _buildPrompt(prompt, style, mood, tempo) {
    let enhancedPrompt = prompt;

    if (style) {
      enhancedPrompt += ` in ${style} style`;
    }

    if (mood) {
      enhancedPrompt += ` with ${mood} mood`;
    }

    if (tempo) {
      enhancedPrompt += ` at ${tempo} tempo`;
    }

    // Add quality and structure hints
    enhancedPrompt += '. Create a professional, high-quality composition with clear structure, engaging melodies, and appropriate instrumentation.';

    return enhancedPrompt;
  }

  /**
   * Generate a unique ID for tracking
   * @returns {string} - Unique ID
   */
  _generateId() {
    return `suno_official_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new SunoOfficialProvider();

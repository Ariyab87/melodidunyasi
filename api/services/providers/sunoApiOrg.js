const axios = require('axios');
const http = require('http');
const https = require('https');

class SunoApiOrgProvider {
  constructor() {
    // Read environment variables with new naming convention
    this.apiKey = process.env.SUNOAPI_ORG_API_KEY;
    this.baseUrl = process.env.SUNOAPI_ORG_BASE_URL || 'https://api.sunoapi.org/api/v1';
    this.generatePath = process.env.SUNOAPI_ORG_GENERATE_PATH || '/generate';
    this.recordInfoPath = process.env.SUNOAPI_ORG_RECORDINFO_PATH || '/generate/record-info';
    this.callbackUrl = process.env.SUNOAPI_ORG_CALLBACK_URL || 'https://webhook.site/your-unique-url';
    
    // Log configuration (masked key)
    if (this.apiKey) {
      const keyMask = `${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 4)}`;
      console.log(`✅ SunoAPI.org key configured successfully: ${keyMask}`);
    } else {
      console.warn('⚠️  SUNOAPI_ORG_API_KEY is missing');
    }
    
    console.log(`[SUNOAPI_ORG] Base: ${this.baseUrl}`);
    console.log(`[SUNOAPI_ORG] Generate path: ${this.generatePath} => ${this.baseUrl}${this.generatePath}`);
    console.log(`[SUNOAPI_ORG] Record-info path: ${this.recordInfoPath} => ${this.baseUrl}${this.recordInfoPath}`);
    
    // Agent configuration
    this.agentOptions = {
      httpAgent: new http.Agent({ keepAlive: true }),
      httpsAgent: new https.Agent({ keepAlive: true }),
    };
    
    console.log('🔍 [PROXY] SunoAPI.org provider using direct connection');
  }

  _buildHeaders() {
    if (!this.apiKey) {
      throw new Error('SUNOAPI_ORG_API_KEY is not configured');
    }
    
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  _isAuthError(response) {
    // Check for 401/403 status codes
    if (response.status === 401 || response.status === 403) {
      return true;
    }
    
    // Check for specific error codes in JSON response
    if (response.data && response.data.code) {
      return response.data.code === 401 || response.data.code === 403;
    }
    
    return false;
  }

  _handleAuthError(response) {
    const error = new Error('SunoAPI.org authentication failed');
    error.code = 'AUTH_ERROR';
    error.status = response.status;
    error.response = response;
    throw error;
  }

  async diag() {
    try {
      console.log('🔍 [SUNOAPI_ORG] Running endpoint diagnostics...');
      
      // Test OPTIONS request
      const optionsResponse = await axios({
        method: 'OPTIONS',
        url: `${this.baseUrl}${this.generatePath}`,
        ...this.agentOptions
      });
      console.log(`[SUNOAPI_ORG][DIAG] OPTIONS ${this.baseUrl}${this.generatePath} -> ${optionsResponse.status} ${optionsResponse.headers['content-type']}`);
      console.log(`[SUNOAPI_ORG][DIAG] Response body: ${optionsResponse.data}`);
      
      // Test POST request with minimal required parameters
      const testPayload = {
        prompt: 'Test song',
        duration: 30,
        model: 'V4',
        customMode: false,
        instrumental: false,
        callBackUrl: this.callbackUrl
      };
      
      const postResponse = await axios({
        method: 'POST',
        url: `${this.baseUrl}${this.generatePath}`,
        headers: this._buildHeaders(),
        data: testPayload,
        ...this.agentOptions
      });
      console.log(`[SUNOAPI_ORG][DIAG] POST ${this.baseUrl}${this.generatePath} -> ${postResponse.status} ${postResponse.headers['content-type']}`);
      console.log(`[SUNOAPI_ORG][DIAG] Response body: ${JSON.stringify(postResponse.data)}`);
      
      // Test GET request
      const getResponse = await axios({
        method: 'GET',
        url: `${this.baseUrl}${this.recordInfoPath}`,
        headers: this._buildHeaders(),
        ...this.agentOptions
      });
      console.log(`[SUNOAPI_ORG][DIAG] GET ${this.baseUrl}${this.recordInfoPath} -> ${getResponse.status} ${getResponse.headers['content-type']}`);
      console.log(`[SUNOAPI_ORG][DIAG] Response body: ${JSON.stringify(getResponse.data)}`);
      
      return {
        ok: true,
        status: 200,
        provider: 'sunoapi_org',
        baseUrl: this.baseUrl,
        endpoints: {
          generate: `${this.baseUrl}${this.generatePath}`,
          recordInfo: `${this.baseUrl}${this.recordInfoPath}`
        }
      };
      
    } catch (error) {
      console.error('❌ [SUNOAPI_ORG] Diagnostic failed:', error.message);
      
      if (error.response) {
        if (this._isAuthError(error.response)) {
          this._handleAuthError(error.response);
        }
        
        return {
          ok: false,
          status: error.response.status,
          reason: error.response.data?.code || 'UNKNOWN_ERROR',
          message: error.response.data?.msg || error.message,
          provider: 'sunoapi_org',
          baseUrl: this.baseUrl
        };
      }
      
      return {
        ok: false,
        status: 500,
        reason: 'NETWORK_ERROR',
        message: error.message,
        provider: 'sunoapi_org',
        baseUrl: this.baseUrl
      };
    }
  }

  async generateSong(prompt, duration = 30, style = 'Pop', mood = 'Happy', debugSmall = false) {
    try {
      console.log('🎵 Generating song with SunoAPI.org:', {
        prompt: prompt.substring(0, 100) + '...',
        duration,
        style,
        mood,
        debugSmall
      });
      
      // Truncate prompt to fit SunoAPI.org requirements (400 chars max for non-custom mode)
      const truncatedPrompt = prompt.length > 400 ? prompt.substring(0, 397) + '...' : prompt;
      
      const requestPayload = {
        prompt: truncatedPrompt,
        duration: duration,
        model: 'V4', // Required parameter
        customMode: false, // Required parameter
        instrumental: false, // Required parameter
        callBackUrl: this.callbackUrl // Required parameter
      };
      
      console.log(`[SUNOAPI_ORG][POST] ${this.baseUrl}${this.generatePath}`);
      
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}${this.generatePath}`,
        headers: this._buildHeaders(),
        data: requestPayload,
        ...this.agentOptions
      });
      
      console.log('🔍 [SUNOAPI_ORG] Generate request successful');
      
      if (this._isAuthError(response)) {
        this._handleAuthError(response);
      }
      
      // Extract task ID from response
      const result = response.data;
      let taskId = null;
      
      if (result.taskId) {
        taskId = result.taskId;
      } else if (result.data?.taskId) {
        taskId = result.data.taskId;
      } else if (result.id) {
        taskId = result.id;
      }
      
      if (!taskId) {
        console.error('[SUNOAPI_ORG][ERR] No task ID in response:', result);
        console.error('[SUNOAPI_ORG][ERR] status:', response.status);
        console.error('[SUNOAPI_ORG][ERR] headers:', response.headers);
        console.error('[SUNOAPI_ORG][ERR] data:', response.data);
        throw new Error('SunoAPI.org error (no-status): No task ID in response');
      }
      
      return {
        success: true,
        taskId: taskId,
        status: 'pending',
        provider: 'sunoapi_org',
        message: 'Song generation started successfully'
      };
      
    } catch (error) {
      console.error('❌ Error generating song with SunoAPI.org:', error.message);
      
      if (error.code === 'AUTH_ERROR') {
        throw error; // Re-throw AUTH_ERROR for proper handling
      }
      
      if (error.response) {
        const errorMsg = error.response.data?.msg || error.message;
        const errorCode = error.response.data?.code || error.response.status;
        throw new Error(`SunoAPI.org error (${errorCode}): ${errorMsg}`);
      }
      
      throw new Error(`SunoAPI.org error (no-status): ${error.message}`);
    }
  }

  async health() {
    try {
      const diagResult = await this.diag();
      return diagResult;
    } catch (error) {
      console.error('❌ [SUNOAPI_ORG] Health check failed:', error.message);
      
      if (error.code === 'AUTH_ERROR') {
        return {
          ok: false,
          status: 401,
          reason: 'AUTH_ERROR',
          message: 'Authentication failed. Check SUNOAPI_ORG_API_KEY.',
          provider: 'sunoapi_org',
          baseUrl: this.baseUrl
        };
      }
      
      return {
        ok: false,
        status: 500,
        reason: 'HEALTH_CHECK_FAILED',
        message: error.message,
        provider: 'sunoapi_org',
        baseUrl: this.baseUrl
      };
    }
  }
}

module.exports = SunoApiOrgProvider;

const axios = require('axios');

function createSunoApiProvider({ apiKey, baseURL } = {}) {
  const BASE = baseURL || process.env.SUNOAPI_ORG_BASE_URL || 'https://api.sunoapi.org/api/v1';
  const KEY = apiKey || process.env.SUNOAPI_ORG_API_KEY || process.env.SUNOAPI_KEY || process.env.SUNO_API_KEY;
  
  // Helper to clean undefined/null/empty values from objects
  function clean(obj) {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
  }
  
  if (!KEY) {
    console.warn('[sunoapi_org] Missing SUNOAPI_ORG_API_KEY / SUNOAPI_KEY / SUNO_API_KEY');
  }

  const http = axios.create({ 
    baseURL: BASE, 
    timeout: 60000, 
    headers: KEY ? { Authorization: `Bearer ${KEY}` } : {} 
  });

  async function tryOne(path, key, value) {
    if (!value) return { ok: false };
    try {
      const { data } = await http.get(path, { params: { [key]: value } });
      return { ok: true, data, source: `${path}?${key}=${value}` };
    } catch (e) {
      if (e.response?.status === 404) return { ok: false, nf: true };
      return { ok: false };
    }
  }

  async function resolve(ids) {
    const { jobId, recordId } = ids || {};
    
    // Strategy 1: Try /generate/status first for progress and recordId
    if (jobId) {
      const statusResult = await tryOne('/generate/status', 'taskId', jobId);
      if (statusResult.ok && statusResult.data) {
        console.log(`[sunoapi_org] Status resolved via: /generate/status?taskId=${jobId}`);
        return statusResult;
      }
    }
    
    // Strategy 2: Fallback to /generate/record-info for audioUrl
    const recordIdToTry = recordId || jobId;
    if (recordIdToTry) {
      const recordResult = await tryOne('/generate/record-info', 'id', recordIdToTry);
      if (recordResult.ok && recordResult.data) {
        console.log(`[sunoapi_org] Status resolved via: /generate/record-info?id=${recordIdToTry}`);
        return recordResult;
      }
    }
    
    // Strategy 3: Extra fallback for jobId
    if (jobId) {
      const fallbackResult = await tryOne('/task/status', 'taskId', jobId);
      if (fallbackResult.ok && fallbackResult.data) {
        console.log(`[sunoapi_org] Status resolved via: /task/status?taskId=${jobId}`);
        return fallbackResult;
      }
    }
    
    // Never throw on 404/null, return processing status
    console.log(`[sunoapi_org] No status found for jobId=${jobId} recordId=${recordId}, returning processing`);
    return { ok: false, data: null, source: null };
  }

  function normalize(raw) {
    if (!raw) return { status: 'processing', audioUrl: null, progress: null, recordId: null };
    
    const d = raw.data ?? raw; // some wrap {code,msg,data}
    
    const status =
      d.status || d.state || d.jobStatus || d?.result?.status ||
      (d.audioUrl || d.audio_url ? 'completed' : 'processing');

    const audioUrl =
      d.audioUrl || d.audio_url ||
      d?.audio?.url || d?.audio?.[0]?.url || d?.files?.[0]?.url || null;

    const progress = d.progress ?? d.percent ?? d.percentage ?? null;

    const recordId = d.recordId || d?.data?.recordId || d.id || null;

    return { status, audioUrl, progress, recordId };
  }

  return {
    getProviderInfo() { 
      return { name: 'sunoapi_org', baseUrl: BASE }; 
    },

    async health() {
      try {
        // Test the API with a simple OPTIONS request
        await http.options('/generate');
        
        return {
          ok: true,
          status: 200,
          reason: 'OK',
          message: 'SunoAPI.org is responding',
          provider: 'sunoapi_org',
          baseUrl: BASE
        };
      } catch (error) {
        console.error('[sunoapi_org] Health check error:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
        
        // Handle authentication errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          return {
            ok: false,
            status: 401,
            reason: 'AUTH_ERROR',
            message: 'Authentication failed. Check SUNOAPI_ORG_API_KEY.',
            provider: 'sunoapi_org',
            baseUrl: BASE
          };
        }
        
        return {
          ok: false,
          status: error.response?.status || 500,
          reason: 'HEALTH_CHECK_FAILED',
          message: error.message,
          provider: 'sunoapi_org',
          baseUrl: BASE
        };
      }
    },

    async generate({ prompt, style, tags, instrumental, callbackUrl }) {
      try {
        // Get callback URL from params, env, or construct from backend URL
        const cb = callbackUrl
          || process.env.SUNOAPI_ORG_CALLBACK_URL
          || (process.env.BACKEND_PUBLIC_URL
              ? `${process.env.BACKEND_PUBLIC_URL.replace(/\/$/, '')}/api/song/callback`
              : undefined);

        if (!cb) console.warn('[sunoapi_org] No callback URL configured; provider may 400');

        // Build payload with required fields and defaults
        const payload = {
          prompt,
          style,
          tags,
          instrumental: !!instrumental,
          model: 'V4', // Default to V4 model
          customMode: false, // Default to standard mode
          // Send both casings to satisfy API differences
          callbackUrl: cb,
          callBackUrl: cb
        };
        
        const body = clean(payload);
        console.log('[sunoapi_org] Sending payload:', JSON.stringify(body));
        const { data } = await http.post('/generate', body);
        
        // Log raw response for diagnostics (truncated to 800 chars)
        const rawStr = JSON.stringify(data).substring(0, 800);
        console.log(`[sunoapi_org] Raw generate response: ${rawStr}${rawStr.length >= 800 ? '...' : ''}`);
        
        return { 
          jobId: data.jobId || data.id || data.taskId, 
          raw: data 
        };
      } catch (error) {
        console.error('[sunoapi_org] Generate error:', error.message);
        
        const d = error.response?.data;
        // keep raw details for diagnostics
        const err = new Error(d?.msg || error.message || 'Generation error');
        err.status = error.response?.status;
        err.raw = d || null;
        
        if (error.response?.status === 429 || d?.code === 429) err.kind = 'INSUFFICIENT_CREDITS';
        if (error.response?.status === 401) err.kind = 'BAD_API_KEY';
        if (error.response?.status === 403) err.kind = 'FORBIDDEN';
        if (error.response?.status === 400) err.kind = 'BAD_REQUEST';
        if (error.response?.status === 408 || error.response?.status === 504) err.kind = 'TIMEOUT';
        if (!err.kind && !d?.jobId) err.kind = 'NO_JOB_ID';
        
        throw err;
      }
    },

    async getRecordInfo(ids) {
      const r = await resolve(ids);
      const norm = normalize(r.data);
      if (r.source) console.log(`[sunoapi_org] Status resolved via: ${r.source}`);
      return { ...norm, tried: r.source || 'none' };
    }
  };
}

module.exports = { createSunoApiProvider };

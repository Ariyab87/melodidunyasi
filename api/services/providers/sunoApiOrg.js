// api/services/providers/sunoApiOrg.js
/* eslint-disable no-console */
const axios = require('axios');

const BASE       = process.env.SUNOAPI_ORG_BASE_URL || 'https://api.sunoapi.org/api/v1';
const GEN_PATH   = process.env.SUNOAPI_ORG_GENERATE_PATH || '/generate';
const INFO_PATH  = process.env.SUNOAPI_ORG_RECORDINFO_PATH || '/generate/record-info';
const API_KEY    = process.env.SUNOAPI_ORG_API_KEY || '';

const GEN_URL  = `${BASE}${GEN_PATH}`;
const INFO_URL = `${BASE}${INFO_PATH}`;

function sunoHeaders() {
  if (!API_KEY) {
    const e = new Error('missing_suno_api_key');
    e.httpStatus = 500;
    throw e;
  }
  // Send BOTH forms; harmless if one is ignored by the provider.
  return {
    Authorization: `Bearer ${API_KEY}`,
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  };
}

async function health() {
  try {
    const r = await axios.options(GEN_URL, {
      timeout: 3000,
      validateStatus: () => true,
    });
    return { ok: r.status >= 200 && r.status < 400, status: r.status, url: GEN_URL };
  } catch (e) {
    return { ok: false, status: 0, url: GEN_URL, error: 'network_error' };
  }
}

async function generateSong(prompt, duration, style, mood, debugSmall, instrumental = false) {
  const body = {
    prompt: prompt || 'SongCreator test',
    title: 'SongCreator',
    // include if your provider supports them (they'll be ignored otherwise)
    duration,
    style,
    mood,
    debugSmall,
    // Add model version to match playground
    model: 'V4', // Temporarily hardcoded to match playground exactly
    // Add custom mode support
    customMode: false,
    // Add instrumental mode
    instrumental: !!instrumental
  };

  // Get callback URL from env or construct from backend URL
  const base = (process.env.BACKEND_PUBLIC_URL || process.env.FRONTEND_URL || '').replace(/\/$/, '');
  const defaultCb = base ? `${base}/callback/suno` : '';
  const cb = process.env.SUNOAPI_ORG_CALLBACK_URL || defaultCb;

  if (!cb) {
    console.warn('[sunoapi_org] ⚠️ WARNING: No callback URL configured!');
    console.warn('[sunoapi_org] This means Suno cannot notify your system when the song is ready.');
    console.warn('[sunoapi_org] You will need to manually check the status or set these environment variables:');
    console.warn('[sunoapi_org] - BACKEND_PUBLIC_URL=https://your-domain.com');
    console.warn('[sunoapi_org] - SUNOAPI_ORG_CALLBACK_URL=https://your-domain.com/callback/suno');
  } else {
    console.log('[sunoapi_org] Using callback URL:', cb);
    // Add callback URL to the request body if the API supports it
    if (cb) {
      body.callbackUrl = cb;
      body.callBackUrl = cb; // Some APIs use different casing
    }
  }

  let r;
  try {
    console.log('[SUNO_API_ORG] Sending generation request:', { prompt: prompt.substring(0, 100) + '...', style, mood, duration });
    r = await axios.post(GEN_URL, body, {
      headers: sunoHeaders(),
      timeout: 30000,
      validateStatus: () => true,
    });
  } catch (e) {
    const err = new Error(`suno_network_error:${e.message}`);
    err.httpStatus = 502;
    throw err;
  }

  if (r.status === 401 || r.status === 403) {
    const err = new Error('suno_auth_failed');
    err.httpStatus = 401;
    err.details = r.data;
    console.error('[SUNO] Auth failed:', r.status, r.data);
    throw err;
  }
  if (r.status >= 400) {
    const err = new Error('suno_generate_failed');
    err.httpStatus = 502;
    err.details = { status: r.status, data: r.data };
    console.error('[SUNO] Generate failed:', r.status, r.data);
    throw err;
  }

  // Extract jobId and recordId from the response
  const responseData = r.data;
  console.log('[SUNO_API_ORG] Raw response:', JSON.stringify(responseData, null, 2));
  
  // Try multiple possible field names for jobId and recordId
  const jobId = responseData.jobId || responseData.taskId || responseData.id || 
                responseData.data?.jobId || responseData.data?.taskId || responseData.data?.id ||
                responseData.job_id || responseData.task_id || responseData.record_id ||
                responseData.data?.job_id || responseData.data?.task_id || responseData.data?.record_id;
                
  const recordId = responseData.recordId || responseData.data?.recordId || 
                   responseData.record_id || responseData.data?.record_id ||
                   responseData.recordId || responseData.data?.recordId ||
                   responseData.id || responseData.data?.id; // Sometimes the main ID is the record ID
  
  console.log('[SUNO_API_ORG] All possible ID fields found:');
  console.log('[SUNO_API_ORG] - jobId fields:', {
    jobId: responseData.jobId,
    taskId: responseData.taskId,
    id: responseData.id,
    'data.jobId': responseData.data?.jobId,
    'data.taskId': responseData.data?.taskId,
    'data.id': responseData.data?.id,
    job_id: responseData.job_id,
    task_id: responseData.task_id,
    record_id: responseData.record_id
  });
  console.log('[SUNO_API_ORG] - recordId fields:', {
    recordId: responseData.recordId,
    'data.recordId': responseData.data?.recordId,
    record_id: responseData.record_id,
    'data.record_id': responseData.data?.record_id,
    id: responseData.id,
    'data.id': responseData.data?.id
  });
  
  console.log('[SUNO_API_ORG] Final extracted IDs - jobId:', jobId, 'recordId:', recordId);
  
  if (!jobId) {
    console.error('[SUNO_API_ORG] No jobId found in response');
    console.error('[SUNO_API_ORG] Available top-level keys:', Object.keys(responseData));
    if (responseData.data) {
      console.error('[SUNO_API_ORG] Available data keys:', Object.keys(responseData.data));
    }
    throw new Error('No job ID returned from Suno API');
  }
  
  return {
    jobId,
    recordId,
    raw: responseData,
    status: responseData.status || 'queued'
  };
}

async function getRecordInfo(recordId) {
  let r;
  try {
    console.log('[SUNO_API_ORG] Checking record info for:', recordId);
    r = await axios.get(INFO_URL, {
      headers: sunoHeaders(),
      params: { id: recordId }, // adjust if your API uses a different param
      timeout: 15000,
      validateStatus: () => true,
    });
  } catch (e) {
    const err = new Error(`suno_network_error:${e.message}`);
    err.httpStatus = 502;
    throw err;
  }

  if (r.status >= 400) {
    const err = new Error('suno_recordinfo_failed');
    err.httpStatus = 502;
    err.details = { status: r.status, data: r.data };
    console.error('[SUNO] Record-info failed:', r.status, r.data);
    throw err;
  }

  const responseData = r.data;
  console.log('[SUNO_API_ORG] Record info response:', JSON.stringify(responseData, null, 2));
  
  // Extract audio URL from various possible locations
  const audioUrl = responseData.audioUrl || responseData.audio_url || responseData.url || 
                   responseData.data?.audioUrl || responseData.data?.audio_url || 
                   responseData.data?.url || null;
  
  // Extract status from various possible locations
  const status = responseData.status || responseData.state || responseData.jobStatus || 
                 (audioUrl ? 'completed' : 'processing');
  
  // Extract progress
  const progress = typeof responseData.progress === 'number' 
    ? responseData.progress 
    : (status === 'completed' ? 100 : status === 'queued' ? 0 : 50);
  
  console.log('[SUNO_API_ORG] Extracted info - status:', status, 'audioUrl:', audioUrl, 'progress:', progress);
  
  return {
    status,
    audioUrl,
    progress,
    recordId,
    raw: responseData
  };
}

module.exports = class SunoApiOrgProvider {
  async health() { return health(); }
  async generateSong(prompt, duration, style, mood, debugSmall) {
    return generateSong(prompt, duration, style, mood, debugSmall);
  }
  async getRecordInfo(id) { return getRecordInfo(id); }
};

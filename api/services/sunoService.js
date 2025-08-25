// api/services/sunoService.js
const axios = require('axios');

const BASE     = process.env.SUNOAPI_ORG_BASE_URL || 'https://api.sunoapi.org/api/v1';
const GEN_PATH = process.env.SUNOAPI_ORG_GENERATE_PATH || '/generate';
const INFO_PATH= process.env.SUNOAPI_ORG_RECORDINFO_PATH || '/generate/record-info';
const API_KEY  = process.env.SUNOAPI_ORG_API_KEY;

function authHeaders() {
  if (!API_KEY) {
    const e = new Error('missing_suno_api_key');
    e.httpStatus = 500;
    throw e;
  }
  return {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function generateSong(payload) {
  const url = `${BASE}${GEN_PATH}`;
  const headers = authHeaders();

  // optional: minimal shaping of payload
  const body = {
    prompt: payload?.prompt || payload?.story || 'SongCreator test',
    title: payload?.title || 'SongCreator',
    // add any required fields your provider expects here
  };

  const res = await axios.post(url, body, {
    headers,
    timeout: 30000,
    validateStatus: () => true,
  });

  if (res.status === 401 || res.status === 403) {
    const e = new Error('suno_auth_failed');
    e.httpStatus = 401;
    e.details = res.data;
    throw e;
  }
  if (res.status >= 400) {
    const e = new Error('suno_generate_failed');
    e.httpStatus = 502;
    e.details = { status: res.status, data: res.data };
    throw e;
  }

  return res.data; // should contain job/record info
}

async function getRecordInfo(recordId) {
  const url = `${BASE}${INFO_PATH}`;
  const headers = authHeaders();

  const res = await axios.get(url, {
    headers,
    params: { id: recordId }, // adjust if your API expects another param name
    timeout: 15000,
    validateStatus: () => true,
  });

  if (res.status >= 400) {
    const e = new Error('suno_recordinfo_failed');
    e.httpStatus = 502;
    e.details = { status: res.status, data: res.data };
    throw e;
  }

  return res.data;
}

module.exports = { generateSong, getRecordInfo };

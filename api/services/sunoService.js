// api/services/sunoService.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE       = (process.env.SUNOAPI_ORG_BASE_URL || 'https://api.sunoapi.org/api/v1').replace(/\/$/, '');
const GEN_PATH   = process.env.SUNOAPI_ORG_GENERATE_PATH   || '/generate';
const INFO_PATH  = process.env.SUNOAPI_ORG_RECORDINFO_PATH || '/generate/record-info';
const MODELS_PATH= process.env.SUNOAPI_ORG_MODELS_PATH     || '/models';
const API_KEY    = process.env.SUNOAPI_ORG_API_KEY;
const CALLBACK   = process.env.SUNOAPI_ORG_CALLBACK_URL || '';

function requireKey() {
  if (!API_KEY) {
    const e = new Error('SUNO_API_KEY_MISSING');
    e.httpStatus = 500;
    throw e;
  }
}

function authHeaders() {
  requireKey();
  return {
    Authorization: `Bearer ${API_KEY}`, // many providers accept Bearer …
    'x-api-key': API_KEY,               // … and some expect x-api-key
    'Content-Type': 'application/json',
  };
}

const http = axios.create({
  baseURL: BASE,
  timeout: 30000,
  validateStatus: () => true,
});

/**
 * Normalize provider result to a common shape
 */
function normalizeGenerateResponse(resData) {
  // Try to pull a job/record id from various shapes
  const jobId =
    resData?.jobId || resData?.taskId || resData?.id ||
    resData?.data?.jobId || resData?.data?.taskId || resData?.data?.id || null;

  const recordId =
    resData?.recordId || resData?.data?.recordId || null;

  const audioUrl =
    resData?.audioUrl || resData?.audio_url || resData?.url ||
    resData?.data?.audioUrl || resData?.data?.audio_url ||
    resData?.data?.audio?.url || (resData?.data?.files?.[0]?.url) || null;

  const status =
    resData?.status || resData?.state || resData?.jobStatus ||
    (audioUrl ? 'completed' : 'queued');

  return {
    status,
    audioUrl,
    metadata: { jobId, recordId, raw: resData },
  };
}

/**
 * Start generation
 */
async function generateSong(payload = {}) {
  const url = `${GEN_PATH.startsWith('/') ? GEN_PATH : `/${GEN_PATH}`}`;

  const body = {
    prompt: payload.prompt || payload.story || 'SongCreator test',
    title: payload.title || payload.fullName || 'SongCreator',
    style: payload.songStyle || payload.style || undefined,
    mood: payload.mood || undefined,
    tempo: payload.tempo || undefined,
    duration: payload.duration || 30,
    instrumental: typeof payload.instrumental === 'boolean' ? payload.instrumental : false,
    language: payload.language || 'en',
    namesToInclude: payload.namesToInclude || undefined,
    callbackUrl: CALLBACK || undefined, // if configured
  };

  const res = await http.post(url, body, { headers: authHeaders() });

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

  return normalizeGenerateResponse(res.data);
}

/**
 * Query status by job/record id
 */
async function checkSongStatus({ jobId, recordId }) {
  const url = `${INFO_PATH.startsWith('/') ? INFO_PATH : `/${INFO_PATH}`}`;
  const params = {};

  // Most providers accept record id here; if jobId is all we have, pass it along too.
  if (recordId) params.id = recordId;
  if (jobId) params.jobId = jobId;

  const res = await http.get(url, { headers: authHeaders(), params, timeout: 20000 });

  if (res.status === 401 || res.status === 403) {
    const e = new Error('suno_auth_failed');
    e.httpStatus = 401;
    e.details = res.data;
    throw e;
  }
  if (res.status >= 400) {
    const e = new Error('suno_recordinfo_failed');
    e.httpStatus = 502;
    e.details = { status: res.status, data: res.data };
    throw e;
  }

  const data = res.data;

  // Normalize possible shapes
  const audioUrl =
    data?.audioUrl || data?.audio_url || data?.url ||
    data?.data?.audioUrl || data?.data?.audio_url ||
    data?.data?.audio?.url || (data?.data?.files?.[0]?.url) || null;

  const status =
    data?.status || data?.state || data?.jobStatus ||
    (audioUrl ? 'completed' : (data?.queued ? 'queued' : 'processing'));

  const progress = typeof data?.progress === 'number'
    ? data.progress
    : (status === 'completed' ? 100 : status === 'queued' ? 0 : 50);

  const discoveredRecordId =
    data?.recordId || data?.data?.recordId || recordId || null;

  return {
    status,
    progress,
    audioUrl,
    estimatedTime: data?.etaSeconds ?? data?.estimatedTime ?? null,
    startedAt: data?.startedAt || null,
    recordId: discoveredRecordId,
  };
}

/**
 * Optional: list models (best-effort; falls back to minimal info)
 */
async function getModels() {
  const url = `${MODELS_PATH.startsWith('/') ? MODELS_PATH : `/${MODELS_PATH}`}`;
  const res = await http.get(url, { headers: authHeaders(), timeout: 15000 });
  if (res.status >= 400) {
    // fallback
    return [
      { id: 'default', name: 'Default Model', provider: 'sunoapi_org' }
    ];
  }
  return res.data;
}

/**
 * Download helper to save an audio file under /uploads/audio
 */
async function downloadAudioFile(fileUrl, songId, baseName = 'song') {
  if (!fileUrl) throw new Error('downloadAudioFile: missing fileUrl');

  const dir = path.join(__dirname, '..', 'uploads', 'audio');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const safeBase = baseName.replace(/[^\w.-]+/g, '_').slice(0, 40);
  const filename = `${safeBase}_${songId}.mp3`;
  const filePath = path.join(dir, filename);

  const resp = await axios.get(fileUrl, { responseType: 'stream' });
  const writer = fs.createWriteStream(filePath);
  await new Promise((resolve, reject) => {
    resp.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  const size = fs.statSync(filePath).size;
  return { filename, path: filePath, size };
}

module.exports = {
  generateSong,
  checkSongStatus,
  getModels,
  downloadAudioFile,
};

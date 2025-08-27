// api/routes/songRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const sunoService = require('../services/sunoService');
const requestStore = require('../lib/requestStore');
const { startGeneration } = require('../services/sunoService');

// ---------------------------------------------------------------------------
// Small, in-memory micro-cache for status polling
// ---------------------------------------------------------------------------
const statusCache = new Map(); // id -> { ts, payload }
const TTL_MS = 1500; // 1.5s

// Proxy debug
const proxyUrl = process.env.SUNO_HTTP_PROXY;
console.log(`[STATUS] Using proxy: ${proxyUrl || 'none'}`);

// ---------------------------------------------------------------------------
// Helper: build a full prompt
// ---------------------------------------------------------------------------
function buildSongPrompt(data) {
  const {
    specialOccasion,
    songStyle,
    mood,
    tempo,
    namesToInclude,
    yourStory,
    additionalNotes
  } = data;

  let prompt = `Create a ${String(songStyle || '').toLowerCase()} song for a ${String(specialOccasion || '').toLowerCase()}. `;
  prompt += `The mood should be ${String(mood || '').toLowerCase()} with a ${String(tempo || '').toLowerCase()} tempo. `;
  if (namesToInclude) prompt += `Include the names: ${namesToInclude}. `;
  prompt += `Story: ${yourStory}. `;
  if (additionalNotes) prompt += `Additional notes: ${additionalNotes}. `;
  prompt += `Make it emotional, memorable, and perfect for the occasion. The song should be uplifting and celebratory.`;
  return prompt;
}

/* ==============================
   Back-compat route aliases
   ============================== */
// alias for POST /api/generate  <->  /api/song/generate
function attachGenerate(handler) {
  router.post('/song/generate', handler);
  router.post('/generate', handler); // alias used by your working curl
}
// alias for GET /api/status/:id  <->  /api/song/status/:songId
function attachStatus(handler) {
  router.get('/song/status/:songId', handler);
  router.get('/status/:id', (req, res) => {
    req.params.songId = req.params.id;
    return handler(req, res);
  });
}

// ===========================================================================
// POST /api/song/test
// ===========================================================================
router.post('/song/test', async (req, res) => {
  try {
    const { prompt = 'Create a happy pop song about friendship' } = req.body;

    const songPrompt = buildSongPrompt({
      specialOccasion: 'Test',
      songStyle: 'Pop',
      mood: 'Happy',
      tempo: 'Medium (80-120 BPM)',
      namesToInclude: '',
      yourStory: prompt,
      additionalNotes: 'This is a test generation'
    });

    const songData = {
      prompt: songPrompt,
      style: 'Pop',
      mood: 'Happy',
      tempo: 'Medium (80-120 BPM)',
      duration: 30,
      instrumental: false,
      language: 'en'
    };

    const songResult = await sunoService.generateSong(songData);

    let downloadInfo = null;
    if (songResult.audioUrl) {
      try {
        const downloadResult = await sunoService.downloadAudioFile(
          songResult.audioUrl,
          songResult.id,
          `Song_Pop_${prompt.substring(0, 30)}`
        );
        downloadInfo = {
          savedFilename: downloadResult.filename,
          downloadUrl: `${process.env.PUBLIC_API_BASE || process.env.BACKEND_PUBLIC_URL || "http://localhost:5001"}/api/download/${downloadResult.filename}`,
          size: downloadResult.size
        };
      } catch (e) {
        console.warn('TEST: download failed:', e.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Test song generation completed',
      songId: songResult.id,
      audioUrl: songResult.audioUrl,
      savedFilename: downloadInfo?.savedFilename || null,
      downloadUrl: downloadInfo?.downloadUrl || null,
      data: songResult
    });
  } catch (error) {
    if (error.code === 'SUNO_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        error: 'Suno temporarily unavailable',
        hint: 'Try again or switch region/proxy',
        region: error.regionHint,
        message: error.message
      });
    }
    res.status(500).json({ success: false, error: 'Test song generation failed', message: error.message });
  }
});

// ===========================================================================
// POST /api/song/simple
// ===========================================================================
router.post('/song/simple', async (req, res) => {
  try {
    const {
      prompt,
      style = 'pop',
      duration = 30,
      userEmail = 'test@example.com',
      debugSmall = false
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Please provide a prompt'
      });
    }

    const songId = `simple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const songData = {
      prompt,
      style,
      mood: 'Happy',
      tempo: 'Medium (80-120 BPM)',
      duration,
      instrumental: false,
      language: 'en',
      debugSmall
    };

    const songResult = await sunoService.generateSong(songData);

    let downloadInfo = null;
    if (songResult.audioUrl) {
      try {
        const downloadResult = await sunoService.downloadAudioFile(
          songResult.audioUrl,
          songId,
          `Song_${style}_${prompt.substring(0, 30)}`
        );
        downloadInfo = {
          savedFilename: downloadResult.filename,
          downloadUrl: `${process.env.PUBLIC_API_BASE || process.env.BACKEND_PUBLIC_URL || "http://localhost:5001"}/api/download/${downloadResult.filename}`,
          size: downloadResult.size
        };
      } catch (e) {
        console.warn('SIMPLE: download failed:', e.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Simple song generation completed',
      songId,
      audioUrl: songResult.audioUrl,
      savedFilename: downloadInfo?.savedFilename || null,
      downloadUrl: downloadInfo?.downloadUrl || null,
      data: songResult
    });
  } catch (error) {
    if (error.code === 'SUNO_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        error: 'Suno temporarily unavailable',
        hint: 'Try again or switch region/proxy',
        region: error.regionHint,
        message: error.message
      });
    }
    res.status(500).json({ success: false, error: 'Simple song generation failed', message: error.message });
  }
});

// ===========================================================================
// POST /api/song   (kept for admin/manual requests)
// ===========================================================================
router.post('/song', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      songStyle,
      mood,
      specialOccasion,
      namesToInclude,
      story,
      tempo,
      notes,
      timestamp,
      instrumental
    } = req.body;

    const instrumentalValue = typeof instrumental === 'boolean' ? instrumental : false;

    if (!name || !email || !specialOccasion || !songStyle || !mood || !tempo || !story) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message:
          'Please provide all required fields: name, email, specialOccasion, songStyle, mood, tempo, story'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }

    const requestId = `song_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const prompt =
      `Create a ${songStyle || 'pop'} song for ${specialOccasion || 'an event'}. ` +
      `Mood: ${mood || 'neutral'}. Tempo: ${tempo || 'Medium (80-120 BPM)'}. ` +
      `Include names: ${namesToInclude || 'N/A'}. Story: ${story || 'N/A'}.`;

    const record = {
      id: requestId,
      name,
      email,
      phone: phone || null,
      songStyle,
      mood,
      specialOccasion,
      namesToInclude,
      story,
      tempo,
      notes,
      timestamp,
      prompt,
      instrumental: instrumentalValue,
      provider: 'sunoapi_org',
      providerApiKey: (process.env.ALLOW_BYOK === 'true') ? req.body.providerApiKey || null : null,
      providerJobId: null,
      providerRecordId: null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await requestStore.create(record);
    await requestStore.saveNow();

    startGeneration(record).catch(err => console.error('[gen] unhandled:', err));

    res.status(201).json({
      success: true,
      message: 'Song request submitted successfully',
      id: requestId,
      status: 'pending',
      estimatedProcessingTime: '5-10 minutes',
      nextSteps: [
        'Your request has been queued for processing',
        'Our AI will start generating your song shortly',
        'You can check the status using the link below',
        "You will receive an email when it's ready"
      ]
    });
  } catch (error) {
    if (error.code === 'SUNO_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        error: 'Suno temporarily unavailable',
        hint: 'Try again or switch region/proxy',
        region: error.regionHint,
        message: error.message
      });
    }
    res.status(500).json({ success: false, error: 'Internal server error', message: 'Failed to submit song request. Please try again.' });
  }
});

// ===========================================================================
// POST /api/song/generate   (main handler)
// ===========================================================================
const generateHandler = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      specialOccasion,
      songStyle,
      mood,
      tempo,
      namesToInclude,
      yourStory,
      additionalNotes,
      model
    } = req.body;

    if (!fullName || !email || !specialOccasion || !songStyle || !mood || !tempo || !yourStory) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Please fill in all required fields',
        required: ['fullName', 'email', 'specialOccasion', 'songStyle', 'mood', 'tempo', 'yourStory']
      });
    }

    let prompt = `Create a ${songStyle.toLowerCase()} song for a ${specialOccasion.toLowerCase()}. `;
    prompt += `The mood should be ${mood.toLowerCase()} with a ${tempo.toLowerCase()} tempo. `;
    if (namesToInclude) prompt += `Include the names: ${namesToInclude}. `;
    prompt += `Story: ${yourStory}`;
    if (additionalNotes) prompt += ` ${additionalNotes}`;

    const requestId = `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await requestStore.create({
      id: requestId,
      name: fullName,
      email,
      phone,
      songStyle,
      mood,
      specialOccasion,
      namesToInclude,
      story: yourStory,
      tempo,
      notes: additionalNotes,
      provider: 'sunoapi_org',
      providerJobId: null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await requestStore.saveNow();

    try {
      const songResult = await sunoService.generateSong({
        prompt,
        songStyle,
        mood,
        tempo,
        fullName,
        email,
        phone,
        model
      });

      if (songResult.metadata?.jobId) {
        await requestStore.update(requestId, {
          providerJobId: songResult.metadata.jobId,
          status: 'queued',
          updatedAt: new Date().toISOString()
        });
        await requestStore.saveNow();
      }

      return res.status(200).json({
        success: true,
        message: 'Song generation started successfully',
        songId: requestId,
        jobId: songResult.metadata?.jobId || null,
        status: songResult.status || 'queued',
        estimatedTime: '2-5 minutes',
        data: songResult
      });
    } catch (generationError) {
      await requestStore.update(requestId, {
        status: 'failed',
        error: generationError.message,
        updatedAt: new Date().toISOString()
      });
      await requestStore.saveNow();
      return res.status(500).json({
        success: false,
        error: 'Song generation failed',
        message: generationError.message,
        requestId,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error', message: error.message, timestamp: new Date().toISOString() });
  }
};
attachGenerate(generateHandler);

// ===========================================================================
// GET /api/song/status/:songId  (+ alias /api/status/:id)
// ===========================================================================
const statusHandler = async (req, res) => {
  try {
    const { songId } = req.params;
    const jobIdFromQuery = (req.query.jobId || '').toString().trim() || null;
    if (!songId) {
      return res.status(400).json({ error: 'Missing song ID', message: 'Please provide a valid song ID' });
    }

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '0');
    res.set('Pragma', 'no-cache');

    let record = await requestStore.getById(songId);

    // Check cache but invalidate if record has been updated recently
    const cached = statusCache.get(songId);
    if (cached && (Date.now() - cached.ts) < TTL_MS) {
      // If we have a record, check if it's been updated since cache
      if (record) {
        const recordUpdatedAt = new Date(record.updatedAt).getTime();
        if (cached.ts < recordUpdatedAt) {
          // Record was updated after cache, invalidate it
          statusCache.delete(songId);
          console.log('[STATUS] Cache invalidated for', songId, 'record updated at', record.updatedAt);
        } else {
          // Cache is still valid
          console.log('[STATUS] Using cached response for', songId);
          return res.status(200).json(cached.payload);
        }
      } else {
        // No record yet, use cache
        console.log('[STATUS] Using cached response for', songId, '(no record)');
        return res.status(200).json(cached.payload);
      }
    }

    if (!record && jobIdFromQuery) {
      try {
        const info = await sunoService.checkSongStatus({ jobId: jobIdFromQuery, recordId: null });

        const now = new Date().toISOString();
        await requestStore.create({
          id: songId,
          provider: 'sunoapi_org',
          providerJobId: jobIdFromQuery,
          providerRecordId: info.recordId || null,
          status: info.status || 'processing',
          audioUrl: info.audioUrl || null,
          createdAt: now,
          updatedAt: now,
        }).catch(() => {});
        await requestStore.saveNow();

        const payload = {
          status: info.status || 'processing',
          audioUrl: info.audioUrl || null,
          progress: typeof info.progress === 'number' ? info.progress : (info.status === 'completed' ? 100 : info.status === 'queued' ? 0 : 50),
          etaSeconds: info.estimatedTime ?? null,
          startedAt: info.startedAt || now,
          updatedAt: new Date().toISOString()
        };
        statusCache.set(songId, { ts: Date.now(), payload });
        return res.status(200).json(payload);
      } catch (e) {
        return res.status(202).json({
          status: 'initializing',
          audioUrl: null,
          progress: 0,
          message: 'Record not found; provider query failed. Retry shortly.',
          detail: e.message
        });
      }
    }

    if (!record) {
      return res.status(202).json({
        status: 'initializing',
        audioUrl: null,
        progress: 0,
        message: 'Request not yet persisted; retry soon.'
      });
    }

    if (record.status === 'failed' || record.providerError) {
      return res.status(200).json({
        status: 'failed',
        audioUrl: null,
        progress: 100,
        errorType: record.providerError?.type || 'GEN_ERROR',
        errorMessage: record.providerError?.message || 'Generation failed',
        retryable: !!record.providerError?.retryable,
        billingUrl: process.env.PROVIDER_BILLING_URL_SUNOAPI || null
      });
    }

    if (!record.providerJobId) {
      const createdAt = new Date(record.createdAt);
      const ageSeconds = (Date.now() - createdAt) / 1000;
      if (record.status === 'pending' && ageSeconds > 8) {
        await requestStore.update(songId, {
          status: 'failed',
          providerError: {
            type: 'GEN_TIMEOUT',
            message: 'Generation did not start within expected time',
            code: 'TIMEOUT',
            data: { ageSeconds: ageSeconds.toFixed(1) }
          },
          updatedAt: new Date().toISOString()
        });
        await requestStore.saveNow();
        return res.status(200).json({
          status: 'failed',
          audioUrl: null,
          progress: 100,
          message: 'Generation did not start within expected time. Please try again.'
        });
      }
      return res.status(200).json({
        status: 'initializing',
        audioUrl: null,
        progress: 0,
        message: 'Request is initializing, waiting for provider assignment.'
      });
    }

    // First check if the database record already has the audio URL (from callback)
    if (record.audioUrl && record.status === 'completed') {
      console.log('[STATUS] Using database record with existing audio URL for', songId);
      const normalized = {
        status: 'completed',
        audioUrl: record.audioUrl,
        progress: 100,
        etaSeconds: null,
        startedAt: record.createdAt,
        updatedAt: record.updatedAt
      };

      // If we have an audio URL, try to download it and provide download info
      let downloadInfo = null;
      try {
        const downloadResult = await sunoService.downloadAudioFile(
          record.audioUrl,
          songId,
          `Song_${record.songStyle || 'Pop'}_${record.mood || 'Happy'}`
        );
        downloadInfo = {
          savedFilename: downloadResult.filename,
          downloadUrl: `${process.env.PUBLIC_API_BASE || process.env.BACKEND_PUBLIC_URL || "http://localhost:5001"}/api/download/${downloadResult.filename}`,
          size: downloadResult.size
        };
        
        // Update the record with download info
        const patch = { 
          savedFilename: downloadResult.filename,
          downloadUrl: downloadInfo.downloadUrl,
          fileSize: downloadResult.size,
          updatedAt: new Date().toISOString()
        };
        await requestStore.update(songId, patch);
        await requestStore.saveNow();
      } catch (e) {
        console.warn('[STATUS] Download failed for existing audio URL:', e.message);
      }

      const payload = {
        status: normalized.status,
        audioUrl: normalized.audioUrl,
        progress: normalized.progress,
        etaSeconds: normalized.etaSeconds,
        startedAt: normalized.startedAt,
        updatedAt: normalized.updatedAt,
        // Include download info if available
        ...(downloadInfo && {
          savedFilename: downloadInfo.savedFilename,
          downloadUrl: downloadInfo.downloadUrl,
          fileSize: downloadInfo.size
        })
      };

      statusCache.set(songId, { ts: Date.now(), payload });
      res.set('Cache-Control', 'no-store');
      return res.json(payload);
    }

    // If no audio URL in database, query external API
    console.log('[STATUS] Querying external API for', songId);
    const info = await sunoService.checkSongStatus({
      jobId: record.providerJobId,
      recordId: record.providerRecordId,
    });

    if (info.recordId && !record.providerRecordId) {
      await requestStore.update(songId, { providerRecordId: info.recordId, updatedAt: new Date().toISOString() });
      await requestStore.saveNow();
    }

    let finalStatus = info;
    if (info.status === 'completed' && !info.audioUrl) {
      for (let i = 0; i < 3; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const retry = await sunoService.checkSongStatus({ jobId: record.providerJobId, recordId: record.providerRecordId });
        if (retry.audioUrl) { finalStatus = retry; break; }
      }
    }

    const normalized = {
      status: finalStatus.status || 'processing',
      audioUrl: finalStatus.audioUrl || null,
      progress: typeof finalStatus.progress === 'number'
        ? finalStatus.progress
        : (finalStatus.status === 'completed' ? 100 : finalStatus.status === 'queued' ? 0 : 50),
      etaSeconds: finalStatus.estimatedTime ?? null,
      startedAt: finalStatus.startedAt ?? record.createdAt,
      updatedAt: new Date().toISOString()
    };

    // If song is completed and we have an audio URL, download it and provide download info
    let downloadInfo = null;
    if (finalStatus.status === 'completed' && finalStatus.audioUrl) {
      try {
        const downloadResult = await sunoService.downloadAudioFile(
          finalStatus.audioUrl,
          songId,
          `Song_${record.songStyle || 'Pop'}_${record.mood || 'Happy'}`
        );
        downloadInfo = {
          savedFilename: downloadResult.filename,
          downloadUrl: `${process.env.PUBLIC_API_BASE || process.env.BACKEND_PUBLIC_URL || "http://localhost:5001"}/api/download/${downloadResult.filename}`,
          size: downloadResult.size
        };
        
        // Update the record with download info
        const patch = { 
          status: normalized.status, 
          updatedAt: normalized.updatedAt,
          savedFilename: downloadResult.filename,
          downloadUrl: downloadInfo.downloadUrl,
          fileSize: downloadResult.size
        };
        if (finalStatus.audioUrl) patch.audioUrl = finalStatus.audioUrl;
        await requestStore.update(songId, patch);
        await requestStore.saveNow();
      } catch (e) {
        console.warn('MAIN: download failed:', e.message);
        // Still update the record with basic info
        const patch = { status: normalized.status, updatedAt: normalized.updatedAt };
        if (finalStatus.audioUrl) patch.audioUrl = finalStatus.audioUrl;
        await requestStore.update(songId, patch);
        await requestStore.saveNow();
      }
    } else {
      // Update the record with basic info
      const patch = { status: normalized.status, updatedAt: normalized.updatedAt };
      if (finalStatus.audioUrl) patch.audioUrl = finalStatus.audioUrl;
      await requestStore.update(songId, patch);
      await requestStore.saveNow();
    }

    const payload = {
      status: normalized.status,
      audioUrl: normalized.audioUrl,
      progress: normalized.progress,
      etaSeconds: normalized.etaSeconds,
      startedAt: normalized.startedAt,
      updatedAt: normalized.updatedAt,
      // Include download info if available
      ...(downloadInfo && {
        savedFilename: downloadInfo.savedFilename,
        downloadUrl: downloadInfo.downloadUrl,
        fileSize: downloadInfo.size
      })
    };

    statusCache.set(songId, { ts: Date.now(), payload });

    res.set('Cache-Control', 'no-store');
    return res.json(payload);
  } catch (providerError) {
    if (providerError.code === 'AUTH_ERROR') {
      return res.status(200).json({ status: 'error', error: 'AUTH_ERROR', message: 'Authentication failed. Check API key and credits.', progress: 0 });
    }
    return res.status(200).json({ status: 'processing', error: providerError.message, message: `Provider temporarily unavailable: ${providerError.message}`, progress: 0 });
  }
};
attachStatus(statusHandler);

// ===========================================================================
// GET /api/song/models
// ===========================================================================
router.get('/song/models', async (_req, res) => {
  try {
    const models = await sunoService.getModels();
    res.status(200).json({ success: true, data: models });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch models', message: error.message, timestamp: new Date().toISOString() });
  }
});

// ===========================================================================
// GET /api/song/health
// ===========================================================================
router.get('/song/health', (_req, res) => {
  const hasApiKey = !!process.env.SUNOAPI_ORG_API_KEY;
  const apiUrl = process.env.SUNOAPI_ORG_BASE_URL || 'https://api.sunoapi.org/api/v1';
  const base = (process.env.BACKEND_PUBLIC_URL || process.env.FRONTEND_URL || '').replace(/\/$/, '');
  const defaultCb = base ? `${base}/callback/suno` : '';
  const callbackUrl = process.env.SUNOAPI_ORG_CALLBACK_URL || defaultCb;

  res.status(200).json({
    success: true,
    data: {
      service: 'SunoAPI.org Song Generation',
      status: hasApiKey ? 'configured' : 'not_configured',
      apiUrl,
      hasApiKey,
      callbackUrl,
      timestamp: new Date().toISOString()
    }
  });
});

// ===========================================================================
// GET /api/song/provider/health
// ===========================================================================
router.get('/song/provider/health', async (_req, res) => {
  try {
    const { getMusicProvider } = require('../services/providers');
    const provider = getMusicProvider();

    if (typeof provider.health === 'function') {
      const health = await provider.health();
      if (health.ok) return res.status(200).json({ ok: true, provider: health.provider, message: health.message, status: health.status });
      return res.status(503).json({ ok: false, provider: health.provider, message: health.message, status: health.status, reason: health.reason });
    }

    const hasApiKey = !!(process.env.SUNOAPI_ORG_API_KEY || process.env.SUNOAPI_KEY || process.env.SUNO_API_KEY);
    if (hasApiKey) return res.status(200).json({ ok: true, provider: 'sunoapi_org', message: 'API key configured, provider ready', status: 200 });
    return res.status(503).json({ ok: false, provider: 'unknown', message: 'No API key configured', status: 503, reason: 'NO_API_KEY' });
  } catch (error) {
    res.status(500).json({ ok: false, provider: 'unknown', message: 'Health check failed', status: 500, reason: 'HEALTH_CHECK_ERROR' });
  }
});

// ===========================================================================
// POST /api/song/callback  (+ GET health ping)
// ===========================================================================
router.post('/song/callback', express.json({ type: '*/*' }), async (req, res) => {
  try {
    const p = req.body || {};
    const jobId = p.jobId || p.taskId || p.id || p.task_id || p.data?.taskId || p.data?.task_id || p.data?.id || null;
    const recordId = p.recordId || p.record_id || p.data?.recordId || p.data?.record_id || p.data?.id || null;

    const all = await requestStore.list();
    const rec = all.find(r => r.providerJobId === String(jobId) || (recordId && r.providerRecordId === String(recordId)));
    if (!rec) return res.status(200).json({ ok: true });

    let audioUrl =
      p.audioUrl || p.audio_url || p.url ||
      p.data?.audioUrl || p.data?.audio_url ||
      p.data?.audio?.url || (p.data?.files?.[0]?.url) || null;

    if (!audioUrl && Array.isArray(p.data?.data) && p.data.data.length) {
      const first = p.data.data[0] || {};
      audioUrl = first.audio_url || first.audioUrl || first.url || null;
    }

    const status =
      p.status || p.state || p.jobStatus || p.data?.status || (audioUrl ? 'completed' : 'processing');

    const patch = { status, updatedAt: new Date().toISOString() };
    if (recordId && !rec.providerRecordId) patch.providerRecordId = String(recordId);
    if (audioUrl) patch.audioUrl = String(audioUrl);

    await requestStore.update(rec.id, patch);
    await requestStore.saveNow();
    res.json({ ok: true });
  } catch {
    res.status(200).json({ ok: true });
  }
});
router.get('/song/callback', (_req, res) => res.send('OK'));

// ===========================================================================
// GET /api/song/:id
// ===========================================================================
router.get('/song/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing request ID', message: 'Please provide a valid request ID' });

    const record = await requestStore.getById(id);
    if (!record) {
      return res.status(404).json({ error: 'Request not found', message: `No request found with ID: ${id}`, hint: 'This could mean the request was never persisted or the ID is incorrect' });
    }

    const { email, phone, ...safeRecord } = record;
    const maskedRecord = {
      ...safeRecord,
      email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : null,
      phone: phone ? `${phone.substring(0, 3)}***${phone.substring(phone.length - 2)}` : null
    };

    res.status(200).json({
      success: true,
      record: maskedRecord,
      timestamp: new Date().toISOString(),
      debug: {
        hasProviderJobId: !!record.providerJobId,
        providerJobId: record.providerJobId,
        status: record.status,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve request', message: error.message });
  }
});

// ===========================================================================
// POST /api/song/cache/invalidate/:id
// ===========================================================================
router.post('/song/cache/invalidate/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: 'Missing song ID' });
    
    statusCache.delete(id);
    console.log('[CACHE] Manually invalidated cache for:', id);
    
    res.status(200).json({ 
      success: false, 
      message: 'Cache invalidated',
      songId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to invalidate cache', message: error.message });
  }
});

// ===========================================================================
// GET /api/song/cache/status/:id
// ===========================================================================
router.get('/song/cache/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: 'Missing song ID' });
    
    const cached = statusCache.get(id);
    const record = await requestStore.getById(id);
    
    res.status(200).json({ 
      success: true,
      songId: id,
      cache: cached ? {
        exists: true,
        timestamp: cached.ts,
        age: Date.now() - cached.ts,
        payload: cached.payload
      } : {
        exists: false
      },
      record: record ? {
        status: record.status,
        audioUrl: record.audioUrl,
        updatedAt: record.updatedAt,
        providerJobId: record.providerJobId,
        providerRecordId: record.providerRecordId,
        savedFilename: record.savedFilename,
        downloadUrl: record.downloadUrl,
        fileSize: record.fileSize
      } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check cache status', message: error.message });
  }
});

// ===========================================================================
// GET /api/song/debug/status/:id
// ===========================================================================
router.get('/song/debug/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: 'Missing song ID' });
    
    const record = await requestStore.getById(id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Song not found' });
    }

    // Force check external API status
    let externalStatus = null;
    try {
      if (record.providerJobId) {
        const { getMusicProvider } = require('../services/providers');
        const provider = getMusicProvider();
        if (provider && typeof provider.checkSongStatus === 'function') {
          externalStatus = await provider.checkSongStatus({
            jobId: record.providerJobId,
            recordId: record.providerRecordId
          });
        }
      }
    } catch (e) {
      externalStatus = { error: e.message };
    }
    
    res.status(200).json({ 
      success: true,
      songId: id,
      database: {
        status: record.status,
        audioUrl: record.audioUrl,
        updatedAt: record.updatedAt,
        providerJobId: record.providerJobId,
        providerRecordId: record.providerRecordId,
        savedFilename: record.savedFilename,
        downloadUrl: record.downloadUrl,
        fileSize: record.fileSize
      },
      external: externalStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check debug status', message: error.message });
  }
});

// ===========================================================================
// GET /api/song/debug/stats
// ===========================================================================
router.get('/song/debug/stats', async (_req, res) => {
  try {
    const stats = await requestStore.getStats();
    res.status(200).json({ success: true, stats, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve stats', message: error.message });
  }
});

// ===========================================================================
// POST /api/song/retry/:id
// ===========================================================================
router.post('/song/retry/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: 'Missing song ID', message: 'Please provide a valid song ID' });

    const record = await requestStore.getById(id);
    if (!record) return res.status(404).json({ success: false, error: 'Song not found', message: 'The requested song was not found' });

    if (record.status !== 'failed' || !record.providerError?.retryable) {
      return res.status(400).json({ success: false, error: 'Not retryable', message: 'This song cannot be retried. Check the error details for more information.' });
    }

    if (process.env.ALLOW_BYOK === 'true' && req.body?.providerApiKey) {
      record.providerApiKey = req.body.providerApiKey;
    }

    await requestStore.update(id, {
      status: 'pending',
      providerError: null,
      providerJobId: null,
      updatedAt: new Date().toISOString()
    });
    await requestStore.saveNow();

    startGeneration(record).catch(err => console.error('[retry] unhandled', err));
    res.status(202).json({ success: true, id, status: 'pending', message: 'Song generation restarted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error', message: 'Failed to retry song generation' });
  }
});

// Export statusCache for external access (e.g., callback invalidation)
module.exports = { router, statusCache };

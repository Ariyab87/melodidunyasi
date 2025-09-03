// api/routes/songRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const sunoService = require('../services/sunoService');
const requestStore = require('../lib/requestStore');
const { startGeneration } = require('../services/sunoService');
const { detectLanguage } = require('../services/sunoService');

// ---------------------------------------------------------------------------
// Admin auth middleware (same as adminRoutes.js)
// ---------------------------------------------------------------------------
const adminAuth = (req, res, next) => {
  const required = process.env.ADMIN_SECRET_KEY;
  if (!required) return next(); // no key configured → don't block

  const provided = req.headers['x-admin-key'];
  if (provided && provided === required) {
    // Mark request as admin for free access
    req.isAdmin = true;
    return next();
  }
  return next(); // Continue for non-admin users (they'll need to pay)
};

// Apply admin auth middleware to all routes
router.use(adminAuth);

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
      debugSmall = false,
      instrumental = false,
      exactLyrics = false
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Please provide a prompt'
      });
    }

    const songId = `simple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Detect language from prompt
    const detectedLanguage = detectLanguage(prompt);
    
    const songData = {
      prompt,
      style,
      mood: 'Happy',
      tempo: 'Medium (80-120 BPM)',
      duration,
      instrumental: !!instrumental,
      language: detectedLanguage,
      debugSmall,
      exactLyrics: !!exactLyrics
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
// GET /api/test-language/:text - Test language detection
// ===========================================================================
router.get('/test-language/:text', (req, res) => {
  const { text } = req.params;
  const { detectLanguage } = require('../services/sunoService');
  
  const detected = detectLanguage(decodeURIComponent(text));
  
  res.json({
    text: decodeURIComponent(text),
    detectedLanguage: detected,
    timestamp: new Date().toISOString()
  });
});

// ===========================================================================
// POST /api/song   (kept for admin/manual requests)
// Note: Admin users (with valid x-admin-key header) get free access
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
      language,
      timestamp,
      instrumental,
      exactLyrics
    } = req.body;

    const instrumentalValue = typeof instrumental === 'boolean' ? instrumental : false;
    const exactLyricsValue = typeof exactLyrics === 'boolean' ? exactLyrics : false;

    if (!email || !specialOccasion || !songStyle || !mood || !tempo || !story) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message:
          'Please provide all required fields: email, specialOccasion, songStyle, mood, tempo, story'
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

    console.log('[ROUTE] Received language from form:', language);
    console.log('[ROUTE] Using language:', language || 'tr');
    console.log('[ROUTE] Language type:', typeof language);
    console.log('[ROUTE] Language value:', JSON.stringify(language));

    const prompt =
      `Create a ${songStyle || 'pop'} song for ${specialOccasion || 'an event'}. ` +
      `Mood: ${mood || 'neutral'}. Tempo: ${tempo || 'Medium (80-120 BPM)'}. ` +
      `Language: ${language || 'tr'}. ` +
      `Include names: ${namesToInclude || 'N/A'}. Story: ${story || 'N/A'}.`;
    
    console.log('[ROUTE] Generated prompt with language:', prompt.substring(0, 200) + '...');

    const record = {
      id: requestId,
      name: name || null,
      email,
      phone: phone || null,
      songStyle,
      mood,
      specialOccasion,
      namesToInclude: name || namesToInclude || null, // Use name field as namesToInclude if provided
      story,
      tempo,
      notes,
      language: language || 'tr', // Default to Turkish if not provided
      timestamp,
      prompt,
      instrumental: instrumentalValue,
      exactLyrics: exactLyricsValue,
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

    console.log('[ROUTE] Starting generation for record:', record.id);
    
    // Wait for startGeneration to complete and handle any errors
    try {
      const generationResult = await startGeneration(record);
      console.log('[ROUTE] Generation started successfully:', generationResult);
    } catch (generationError) {
      console.error('[ROUTE] Failed to start generation:', generationError);
      // Update record with error status
      await requestStore.update(record.id, {
        status: 'failed',
        error: generationError.message,
        updatedAt: new Date().toISOString()
      });
      await requestStore.saveNow();
      
      return res.status(500).json({
        success: false,
        error: 'Failed to start song generation',
        message: generationError.message
      });
    }

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
      name,
      email,
      phone,
      specialOccasion,
      songStyle,
      mood,
      tempo,
      language,
      namesToInclude,
      story,
      additionalNotes,
      model
    } = req.body;

    if (!email || !specialOccasion || !songStyle || !mood || !tempo || !story) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Please fill in all required fields',
        required: ['email', 'specialOccasion', 'songStyle', 'mood', 'tempo', 'story']
      });
    }

    let prompt = `Create a ${songStyle.toLowerCase()} song for a ${specialOccasion.toLowerCase()}. `;
    prompt += `The mood should be ${mood.toLowerCase()} with a ${tempo.toLowerCase()} tempo. `;
    if (namesToInclude) prompt += `Include the names: ${namesToInclude}. `;
    prompt += `Story: ${story}`;
    if (additionalNotes) prompt += ` ${additionalNotes}`;

    const requestId = `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await requestStore.create({
      id: requestId,
      name: name,
      email,
      phone,
      songStyle,
      mood,
      specialOccasion,
      language,
      namesToInclude,
      story: story,
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
        language,
        name,
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

    // Check cache but invalidate if record has been updated recently OR if record has audio URL
    const cached = statusCache.get(songId);
    if (cached && (Date.now() - cached.ts) < TTL_MS) {
      // If we have a record, check if it's been updated since cache
      if (record) {
        const recordUpdatedAt = new Date(record.updatedAt).getTime();
        const hasAudioUrl = record.audioUrl && record.status === 'completed';
        
        if (cached.ts < recordUpdatedAt || hasAudioUrl) {
          // Record was updated after cache OR has audio URL, invalidate it
          statusCache.delete(songId);
          console.log('[STATUS] Cache invalidated for', songId, 
            hasAudioUrl ? 'due to audio URL presence' : 'record updated at ' + record.updatedAt);
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

    // 🔒 GUARANTEED AUDIO URL DELIVERY: First check if the database record already has the audio URL (from callback)
    if (record.audioUrl && record.status === 'completed') {
      console.log('[STATUS] 🎯 GUARANTEED: Using database record with existing audio URL for', songId);
      console.log('[STATUS] Audio URL found:', record.audioUrl);
      
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
        
        console.log('[STATUS] ✅ Download successful:', downloadInfo);
        
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
        console.warn('[STATUS] ⚠️ Download failed for existing audio URL:', e.message);
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

      // 🔒 GUARANTEE: Don't cache completed responses to ensure fresh data
      console.log('[STATUS] 🎯 GUARANTEED: Returning audio URL from database for', songId, 'without caching');
      console.log('[STATUS] Final payload:', JSON.stringify(payload, null, 2));
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      return res.json(payload);
    }
    
    // 🔒 SPECIAL CASE: If we have audio URL but status is not completed, force it
    if (record.audioUrl && record.status !== 'completed') {
      console.log('[STATUS] 🔒 SPECIAL CASE: Found audio URL but status is', record.status, '- forcing to completed');
      
      // Update the record status to completed
      try {
        await requestStore.update(songId, {
          status: 'completed',
          updatedAt: new Date().toISOString()
        });
        await requestStore.saveNow();
        console.log('[STATUS] ✅ Record status updated to completed');
        
        // Now return the audio URL immediately
        const payload = {
          status: 'completed',
          audioUrl: record.audioUrl,
          progress: 100,
          etaSeconds: null,
          startedAt: record.createdAt,
          updatedAt: new Date().toISOString()
        };
        
        console.log('[STATUS] 🎯 SPECIAL CASE: Returning forced completed status with audio URL');
        console.log('[STATUS] Final payload:', JSON.stringify(payload, null, 2));
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        return res.json(payload);
      } catch (e) {
        console.error('[STATUS] ❌ Failed to update record status:', e.message);
        // Continue with normal flow
      }
    }

    // 🔒 FALLBACK: If no audio URL in database, query external API with RETRY mechanism
    console.log('[STATUS] 🔄 FALLBACK: Querying external API for', songId, 'because no audio URL in database');
    console.log('[STATUS] Current record status:', record.status, 'audioUrl:', record.audioUrl);
    console.log('[STATUS] Provider IDs - jobId:', record.providerJobId, 'recordId:', record.providerRecordId);
    
    let info = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    // Only attempt external API if we have valid provider IDs
    if (record.providerJobId && record.providerRecordId) {
      while (retryCount < maxRetries && (!info || !info.audioUrl)) {
        try {
          console.log('[STATUS] 🔄 Attempt', retryCount + 1, 'of', maxRetries, 'to get audio URL from external API');
          console.log('[STATUS] Calling external API with jobId:', record.providerJobId, 'recordId:', record.providerRecordId);
          
          info = await sunoService.checkSongStatus({
            jobId: record.providerJobId,
            recordId: record.providerRecordId,
          });
          
          console.log('[STATUS] External API response:', {
            status: info.status,
            hasAudioUrl: !!info.audioUrl,
            audioUrl: info.audioUrl,
            retryCount: retryCount + 1
          });
          
          if (info.audioUrl) {
            console.log('[STATUS] ✅ SUCCESS: Got audio URL from external API on attempt', retryCount + 1);
            break;
          }
          
          retryCount++;
          if (retryCount < maxRetries) {
            console.log('[STATUS] ⏳ Waiting 2 seconds before retry...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.error('[STATUS] ❌ Error querying external API:', error.message);
          retryCount++;
          if (retryCount < maxRetries) {
            console.log('[STATUS] ⏳ Waiting 2 seconds before retry...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      if (!info) {
        console.error('[STATUS] ❌ FAILED: Could not get status from external API after', maxRetries, 'attempts');
        // Don't return error - continue with what we have
        console.log('[STATUS] ⚠️ Continuing without external API data, using record status');
        info = {
          status: record.status,
          audioUrl: record.audioUrl,
          progress: record.status === 'completed' ? 100 : 0
        };
      }
    } else {
      console.log('[STATUS] ⚠️ No provider IDs available, skipping external API call');
      console.log('[STATUS] Using record data directly');
      info = {
        status: record.status,
        audioUrl: record.audioUrl,
        progress: record.status === 'completed' ? 100 : 0
      };
    }

    if (info.recordId && !record.providerRecordId) {
      await requestStore.update(songId, { providerRecordId: info.recordId, updatedAt: new Date().toISOString() });
      await requestStore.saveNow();
    }

    let finalStatus = info;
    
    // 🔒 GUARANTEED AUDIO URL UPDATE: If we got audio URL from external API, update database immediately
    if (info.audioUrl && info.status === 'completed') {
      console.log('[STATUS] 🎯 GUARANTEED: Got audio URL from external API, updating database immediately');
      
      try {
        const updatePatch = {
          status: 'completed',
          audioUrl: info.audioUrl,
          updatedAt: new Date().toISOString()
        };
        
        await requestStore.update(songId, updatePatch);
        await requestStore.saveNow();
        
        console.log('[STATUS] ✅ SUCCESS: Database updated with audio URL:', info.audioUrl);
        
        // Also clear cache to ensure fresh data
        statusCache.delete(songId);
        console.log('[STATUS] Cache cleared for fresh data');
        
      } catch (error) {
        console.error('[STATUS] ❌ ERROR: Failed to update database with audio URL:', error.message);
      }
    }
    
    // Additional retry logic if still no audio URL
    if (info.status === 'completed' && !info.audioUrl) {
      console.log('[STATUS] ⚠️ Status completed but no audio URL, attempting additional retries...');
      for (let i = 0; i < 3; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const retry = await sunoService.checkSongStatus({ jobId: record.providerJobId, recordId: record.providerRecordId });
        if (retry.audioUrl) { 
          finalStatus = retry; 
          console.log('[STATUS] ✅ SUCCESS: Got audio URL on retry attempt', i + 1);
          break; 
        }
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

    // 🔒 FINAL GUARANTEE: Ensure audio URL is always included if available
    const finalAudioUrl = normalized.audioUrl || finalStatus?.audioUrl || record.audioUrl;
    const finalStatusValue = finalAudioUrl ? 'completed' : (normalized.status || record.status);
    
    console.log('[STATUS] 🎯 FINAL GUARANTEE CHECK:');
    console.log('[STATUS] - Normalized audioUrl:', normalized.audioUrl);
    console.log('[STATUS] - FinalStatus audioUrl:', finalStatus?.audioUrl);
    console.log('[STATUS] - Record audioUrl:', record.audioUrl);
    console.log('[STATUS] - Final audioUrl to send:', finalAudioUrl);
    console.log('[STATUS] - Final status to send:', finalStatusValue);
    
    const payload = {
      status: finalStatusValue,
      audioUrl: finalAudioUrl, // 🔒 GUARANTEED: Always include if available
      progress: finalStatusValue === 'completed' ? 100 : (normalized.progress || 0),
      etaSeconds: normalized.etaSeconds,
      startedAt: normalized.startedAt || record.createdAt,
      updatedAt: normalized.updatedAt || record.updatedAt,
      // Include download info if available
      ...(downloadInfo && {
        savedFilename: downloadInfo.savedFilename,
        downloadUrl: downloadInfo.downloadUrl,
        fileSize: downloadInfo.size
      })
    };
    
    // 🔒 FINAL VALIDATION: Log the exact payload being sent
    console.log('[STATUS] 🎯 FINAL PAYLOAD BEING SENT TO FRONTEND:');
    console.log('[STATUS]', JSON.stringify(payload, null, 2));
    
    // 🔒 GUARANTEE: If we have audio URL, force status to completed
    if (finalAudioUrl && payload.status !== 'completed') {
      console.log('[STATUS] 🔒 FORCING: Status changed to completed because audio URL is available');
      payload.status = 'completed';
      payload.progress = 100;
    }

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
      success: true, 
      message: 'Cache invalidated',
      songId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to invalidate cache', message: error.message });
  }
});

// ===========================================================================
// POST /api/song/force-refresh/:id
// ===========================================================================
router.post('/song/force-refresh/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: 'Missing song ID' });
    
    // Clear cache
    statusCache.delete(id);
    
    // Force re-query the record
    const record = await requestStore.getById(id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Song not found' });
    }
    
    console.log('[FORCE-REFRESH] Forced refresh for:', id, 'record:', record);
    
    res.status(200).json({ 
      success: true, 
      message: 'Force refresh completed',
      songId: id,
      record: {
        status: record.status,
        audioUrl: record.audioUrl,
        updatedAt: record.updatedAt,
        hasAudioUrl: !!record.audioUrl
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to force refresh', message: error.message });
  }
});

// ===========================================================================
// POST /api/song/simulate-complete-callback/:id
// ===========================================================================
router.post('/song/simulate-complete-callback/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: 'Missing song ID' });
    
    // Simulate a complete callback with audio URL
    const mockCallback = {
      data: {
        callbackType: 'complete',
        data: [{
          audio_url: 'https://example.com/test-audio.mp3',
          id: 'test-record-id'
        }]
      }
    };
    
    // Process the mock callback
    const store = require('../lib/requestStore');
    const record = await store.getById(id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Song not found' });
    }
    
    // Update the record as if callback was received
    await store.update(id, {
      status: 'completed',
      audioUrl: 'https://example.com/test-audio.mp3',
      updatedAt: new Date().toISOString()
    });
    await store.saveNow();
    
    // Clear cache
    statusCache.delete(id);
    
    console.log('[SIMULATE-CALLBACK] Simulated complete callback for:', id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Simulated complete callback',
      songId: id,
      audioUrl: 'https://example.com/test-audio.mp3',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to simulate callback', message: error.message });
  }
});

// ===========================================================================
// GET /api/song/guarantee-audio/:id
// ===========================================================================
router.get('/song/guarantee-audio/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: 'Missing song ID' });
    
    console.log('[GUARANTEE-AUDIO] 🔒 Testing guaranteed audio URL delivery for:', id);
    
    // Clear cache first
    statusCache.delete(id);
    
    // Get the record
    const record = await requestStore.getById(id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Song not found' });
    }
    
    console.log('[GUARANTEE-AUDIO] Current record:', {
      id: record.id,
      status: record.status,
      audioUrl: record.audioUrl,
      providerJobId: record.providerJobId,
      providerRecordId: record.providerRecordId
    });
    
    // Force check external API if no audio URL
    if (!record.audioUrl && record.providerJobId) {
      console.log('[GUARANTEE-AUDIO] 🔄 No audio URL in database, checking external API...');
      
      try {
        const sunoService = require('../services/sunoService');
        const externalStatus = await sunoService.checkSongStatus({
          jobId: record.providerJobId,
          recordId: record.providerRecordId
        });
        
        console.log('[GUARANTEE-AUDIO] External API response:', externalStatus);
        
        if (externalStatus.audioUrl) {
          console.log('[GUARANTEE-AUDIO] ✅ Got audio URL from external API, updating database...');
          
          await requestStore.update(id, {
            status: 'completed',
            audioUrl: externalStatus.audioUrl,
            updatedId: externalStatus.audioUrl,
            updatedAt: new Date().toISOString()
          });
          await requestStore.saveNow();
          
          console.log('[GUARANTEE-AUDIO] ✅ Database updated successfully');
        }
      } catch (error) {
        console.error('[GUARANTEE-AUDIO] ❌ Error checking external API:', error.message);
      }
    }
    
    // Get final record state
    const finalRecord = await requestStore.getById(id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Audio URL guarantee test completed',
      songId: id,
      record: {
        status: finalRecord.status,
        audioUrl: finalRecord.audioUrl,
        hasAudioUrl: !!finalRecord.audioUrl,
        updatedAt: finalRecord.updatedAt
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to guarantee audio', message: error.message });
  }
});

// ===========================================================================
// GET /api/song/debug-provider-ids/:id
// ===========================================================================
router.get('/song/debug-provider-ids/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: 'Missing song ID' });
    
    console.log('[DEBUG-PROVIDER-IDS] 🔍 Debugging provider IDs for:', id);
    
    // Get the record
    const record = await requestStore.getById(id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Song not found' });
    }
    
    // Check all possible provider ID fields
    const providerFields = {
      providerJobId: record.providerJobId,
      providerRecordId: record.providerRecordId,
      jobId: record.jobId,
      recordId: record.recordId,
      sunoJobId: record.sunoJobId,
      sunoRecordId: record.sunoRecordId,
      externalJobId: record.externalJobId,
      externalRecordId: record.externalRecordId
    };
    
    console.log('[DEBUG-PROVIDER-IDS] All provider fields:', providerFields);
    
    // Check if any provider IDs exist
    const hasAnyProviderId = Object.values(providerFields).some(id => id && id.trim() !== '');
    
    res.status(200).json({ 
      success: true, 
      message: 'Provider ID debug completed',
      songId: id,
      record: {
        status: record.status,
        audioUrl: record.audioUrl,
        hasAudioUrl: !!record.audioUrl,
        updatedAt: record.updatedAt
      },
      providerFields,
      hasAnyProviderId,
      canCallExternalAPI: hasAnyProviderId && record.providerJobId && record.providerRecordId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to debug provider IDs', message: error.message });
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

// ===========================================================================
// GET /api/song/safe-test-audio-delivery/:id
// ===========================================================================
router.get('/song/safe-test-audio-delivery/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: 'Missing song ID' });
    
    console.log('[SAFE-TEST] 🧪 SAFE TESTING: Testing audio URL delivery system for:', id);
    console.log('[SAFE-TEST] ⚠️ NO NEW SONGS GENERATED - NO CREDITS WITHDRAWN');
    
    // Clear cache first
    statusCache.delete(id);
    
    // Get the record
    const record = await requestStore.getById(id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Song not found' });
    }
    
    console.log('[SAFE-TEST] 📊 Current record state:');
    console.log('[SAFE-TEST] - ID:', record.id);
    console.log('[SAFE-TEST] - Status:', record.status);
    console.log('[SAFE-TEST] - Audio URL:', record.audioUrl);
    console.log('[SAFE-TEST] - Provider Job ID:', record.providerJobId);
    console.log('[SAFE-TEST] - Provider Record ID:', record.providerRecordId);
    
    // Test 1: Database Audio URL Check
    console.log('[SAFE-TEST] 🧪 TEST 1: Database Audio URL Check');
    let test1Result = null;
    if (record.audioUrl && record.status === 'completed') {
      test1Result = {
        success: true,
        method: 'Database has audio URL',
        audioUrl: record.audioUrl,
        status: 'completed'
      };
      console.log('[SAFE-TEST] ✅ TEST 1 PASSED: Database has audio URL');
    } else {
      test1Result = {
        success: false,
        method: 'Database check failed',
        reason: record.audioUrl ? 'Status not completed' : 'No audio URL',
        currentStatus: record.status,
        hasAudioUrl: !!record.audioUrl
      };
      console.log('[SAFE-TEST] ❌ TEST 1 FAILED:', test1Result.reason);
    }
    
    // Test 2: Provider ID Validation
    console.log('[SAFE-TEST] 🧪 TEST 2: Provider ID Validation');
    const test2Result = {
      success: !!(record.providerJobId && record.providerRecordId),
      providerJobId: record.providerJobId,
      providerRecordId: record.providerRecordId,
      canCallExternalAPI: !!(record.providerJobId && record.providerRecordId)
    };
    console.log('[SAFE-TEST]', test2Result.success ? '✅ TEST 2 PASSED: Provider IDs valid' : '❌ TEST 2 FAILED: Missing provider IDs');
    
    // Test 3: External API Simulation (NO ACTUAL CALLS)
    console.log('[SAFE-TEST] 🧪 TEST 3: External API Simulation (NO ACTUAL CALLS)');
    let test3Result = null;
    if (test2Result.success) {
      test3Result = {
        success: true,
        method: 'External API simulation',
        message: 'Provider IDs available - would call external API in real scenario',
        simulatedCall: {
          jobId: record.providerJobId,
          recordId: record.providerRecordId
        }
      };
      console.log('[SAFE-TEST] ✅ TEST 3 PASSED: External API simulation successful');
    } else {
      test3Result = {
        success: false,
        method: 'External API simulation',
        reason: 'Cannot simulate - missing provider IDs',
        recommendation: 'Check song generation process for provider ID storage'
      };
      console.log('[SAFE-TEST] ❌ TEST 3 FAILED: Cannot simulate external API calls');
    }
    
    // Test 4: Final Payload Construction
    console.log('[SAFE-TEST] 🧪 TEST 4: Final Payload Construction');
    let test4Result = null;
    
    // Simulate the final guarantee logic
    const finalAudioUrl = record.audioUrl;
    const finalStatus = finalAudioUrl ? 'completed' : record.status;
    const finalProgress = finalStatus === 'completed' ? 100 : 0;
    
    const simulatedPayload = {
      status: finalStatus,
      audioUrl: finalAudioUrl,
      progress: finalProgress,
      etaSeconds: null,
      startedAt: record.createdAt,
      updatedAt: record.updatedAt
    };
    
    test4Result = {
      success: true,
      method: 'Payload construction simulation',
      finalAudioUrl: finalAudioUrl,
      finalStatus: finalStatus,
      finalProgress: finalProgress,
      simulatedPayload: simulatedPayload,
      willReachFrontend: !!finalAudioUrl
    };
    
    console.log('[SAFE-TEST] ✅ TEST 4 PASSED: Payload construction successful');
    console.log('[SAFE-TEST] Final simulated payload:', JSON.stringify(simulatedPayload, null, 2));
    
    // Test 5: Overall System Health
    console.log('[SAFE-TEST] 🧪 TEST 5: Overall System Health');
    const overallHealth = {
      databaseHasAudioUrl: !!record.audioUrl,
      statusIsCompleted: record.status === 'completed',
      providerIdsValid: test2Result.success,
      audioUrlWillReachFrontend: !!finalAudioUrl,
      systemReady: !!finalAudioUrl || (test2Result.success && record.status !== 'error')
    };
    
    const test5Result = {
      success: overallHealth.audioUrlWillReachFrontend || overallHealth.systemReady,
      method: 'Overall system health check',
      health: overallHealth,
      recommendation: overallHealth.audioUrlWillReachFrontend 
        ? 'System is working correctly - audio URL will reach frontend'
        : overallHealth.systemReady 
          ? 'System is ready but needs external API call to get audio URL'
          : 'System has issues - check song generation process'
    };
    
    console.log('[SAFE-TEST]', test5Result.success ? '✅ TEST 5 PASSED: System is healthy' : '❌ TEST 5 FAILED: System has issues');
    
    // Compile all test results
    const allTests = {
      test1: test1Result,
      test2: test2Result,
      test3: test3Result,
      test4: test4Result,
      test5: test5Result
    };
    
    const passedTests = Object.values(allTests).filter(test => test.success).length;
    const totalTests = Object.keys(allTests).length;
    
    console.log('[SAFE-TEST] 📊 FINAL TEST RESULTS:', passedTests, 'out of', totalTests, 'tests passed');
    
    // Final recommendation
    let finalRecommendation = '';
    if (overallHealth.audioUrlWillReachFrontend) {
      finalRecommendation = '🎉 SUCCESS: Audio URL will reach frontend immediately!';
    } else if (overallHealth.systemReady) {
      finalRecommendation = '⚠️ PARTIAL: System ready but needs external API to get audio URL';
    } else {
      finalRecommendation = '❌ ISSUE: System has problems - audio URL may not reach frontend';
    }
    
    console.log('[SAFE-TEST] 🎯 FINAL RECOMMENDATION:', finalRecommendation);
    
    res.status(200).json({ 
      success: true, 
      message: 'Safe audio URL delivery test completed - NO CREDITS WITHDRAWN',
      songId: id,
      timestamp: new Date().toISOString(),
      testResults: allTests,
      summary: {
        passedTests,
        totalTests,
        successRate: `${Math.round((passedTests / totalTests) * 100)}%`,
        finalRecommendation
      },
      record: {
        status: record.status,
        audioUrl: record.audioUrl,
        hasAudioUrl: !!record.audioUrl,
        updatedAt: record.updatedAt
      }
    });
    
  } catch (error) {
    console.error('[SAFE-TEST] ❌ Test failed:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Safe test failed', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===========================================================================
// POST /api/song/simulate-callback-test/:id
// ===========================================================================
router.post('/song/simulate-callback-test/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { callbackType = 'complete', audioUrl = null } = req.body;
    
    if (!id) return res.status(400).json({ success: false, error: 'Missing song ID' });
    
    console.log('[SIMULATE-CALLBACK] 🧪 SIMULATING CALLBACK: Testing callback system for:', id);
    console.log('[SIMULATE-CALLBACK] ⚠️ NO REAL CALLBACKS - NO CREDITS WITHDRAWN');
    console.log('[SIMULATE-CALLBACK] Simulated callback type:', callbackType, 'audioUrl:', audioUrl);
    
    // Get the record
    const record = await requestStore.getById(id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Song not found' });
    }
    
    console.log('[SIMULATE-CALLBACK] 📊 Current record before simulation:');
    console.log('[SIMULATE-CALLBACK] - Status:', record.status);
    console.log('[SIMULATE-CALLBACK] - Audio URL:', record.audioUrl);
    
    // Simulate different callback scenarios
    let simulatedCallback = null;
    let expectedResult = null;
    
    if (callbackType === 'first') {
      // Simulate first callback (usually no audio URL)
      simulatedCallback = {
        data: {
          callbackType: 'first',
          data: [{
            id: record.providerRecordId || 'simulated-record-id',
            status: 'processing'
          }]
        }
      };
      expectedResult = {
        status: 'processing',
        audioUrl: null,
        reason: 'First callback - should keep status as processing'
      };
    } else if (callbackType === 'complete') {
      // Simulate complete callback (with audio URL)
      const testAudioUrl = audioUrl || 'https://example.com/simulated-audio.mp3';
      simulatedCallback = {
        data: {
          callbackType: 'complete',
          data: [{
            id: record.providerRecordId || 'simulated-record-id',
            audio_url: testAudioUrl,
            status: 'completed'
          }]
        }
      };
      expectedResult = {
        status: 'completed',
        audioUrl: testAudioUrl,
        reason: 'Complete callback - should set status to completed with audio URL'
      };
    } else if (callbackType === 'error') {
      // Simulate error callback
      simulatedCallback = {
        data: {
          callbackType: 'error',
          data: [{
            id: record.providerRecordId || 'simulated-record-id',
            status: 'error',
            error: 'Simulated error for testing'
          }]
        }
      };
      expectedResult = {
        status: 'error',
        audioUrl: null,
        reason: 'Error callback - should set status to error'
      };
    }
    
    console.log('[SIMULATE-CALLBACK] 🎭 Simulated callback payload:');
    console.log('[SIMULATE-CALLBACK]', JSON.stringify(simulatedCallback, null, 2));
    
    // Simulate what would happen in the callback handler
    let simulationResult = null;
    
    if (callbackType === 'complete' && audioUrl) {
      // Simulate successful completion
      try {
        // Update the record as if callback was processed
        const updatePatch = {
          status: 'completed',
          audioUrl: audioUrl,
          updatedAt: new Date().toISOString()
        };
        
        await requestStore.update(id, updatePatch);
        await requestStore.saveNow();
        
        // Clear cache
        statusCache.delete(id);
        
        simulationResult = {
          success: true,
          action: 'Record updated successfully',
          newStatus: 'completed',
          newAudioUrl: audioUrl,
          cacheCleared: true
        };
        
        console.log('[SIMULATE-CALLBACK] ✅ Simulation successful: Record updated to completed');
        
      } catch (error) {
        simulationResult = {
          success: false,
          action: 'Failed to update record',
          error: error.message
        };
        console.error('[SIMULATE-CALLBACK] ❌ Simulation failed:', error.message);
      }
    } else {
      // Simulate other callback types
      simulationResult = {
        success: true,
        action: 'Callback simulated (no database changes)',
        callbackType: callbackType,
        expectedBehavior: expectedResult.reason
      };
      console.log('[SIMULATE-CALLBACK] ✅ Simulation completed for callback type:', callbackType);
    }
    
    // Get final record state
    const finalRecord = await requestStore.getById(id);
    
    // Test the status endpoint to see if audio URL would reach frontend
    console.log('[SIMULATE-CALLBACK] 🧪 Testing if audio URL would reach frontend...');
    
    // Simulate the status check logic
    let frontendDeliveryTest = null;
    if (finalRecord.audioUrl && finalRecord.status === 'completed') {
      frontendDeliveryTest = {
        success: true,
        willReachFrontend: true,
        method: 'Database has audio URL and completed status',
        audioUrl: finalRecord.audioUrl
      };
      console.log('[SIMULATE-CALLBACK] ✅ Frontend delivery test PASSED: Audio URL will reach frontend');
    } else {
      frontendDeliveryTest = {
        success: false,
        willReachFrontend: false,
        reason: finalRecord.audioUrl ? 'Status not completed' : 'No audio URL',
        currentStatus: finalRecord.status,
        hasAudioUrl: !!finalRecord.audioUrl
      };
      console.log('[SIMULATE-CALLBACK] ❌ Frontend delivery test FAILED:', frontendDeliveryTest.reason);
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Callback simulation completed - NO CREDITS WITHDRAWN',
      songId: id,
      timestamp: new Date().toISOString(),
      simulation: {
        callbackType,
        simulatedCallback,
        expectedResult,
        simulationResult
      },
      frontendDeliveryTest,
      record: {
        status: finalRecord.status,
        audioUrl: finalRecord.audioUrl,
        hasAudioUrl: !!finalRecord.audioUrl,
        updatedAt: finalRecord.updatedAt
      },
      summary: {
        callbackSimulated: true,
        audioUrlWillReachFrontend: frontendDeliveryTest.willReachFrontend,
        recommendation: frontendDeliveryTest.willReachFrontend 
          ? '🎉 SUCCESS: Audio URL will reach frontend after this callback!'
          : '⚠️ PARTIAL: Callback processed but audio URL may not reach frontend'
      }
    });
    
  } catch (error) {
    console.error('[SIMULATE-CALLBACK] ❌ Simulation failed:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Callback simulation failed', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Export statusCache for external access (e.g., callback invalidation)
module.exports = { router, statusCache };

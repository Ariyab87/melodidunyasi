const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const sunoService = require('../services/sunoService');
const requestStore = require('../lib/requestStore');
const { startGeneration } = require('../services/sunoService');
// const { sendSongCompletionEmail } = require('../services/emailService');

// Status response caching to avoid hammering the provider
const statusCache = new Map(); // id -> { ts, payload }
const TTL_MS = 1500; // 1.5 seconds cache TTL

// Log proxy configuration on startup
const proxyUrl = process.env.SUNO_HTTP_PROXY;
console.log(`[STATUS] Using proxy: ${proxyUrl || 'none'}`);

/**
 * Build a comprehensive song prompt from form data
 */
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

  let prompt = `Create a ${songStyle.toLowerCase()} song for a ${specialOccasion.toLowerCase()}. `;
  prompt += `The mood should be ${mood.toLowerCase()} with a ${tempo.toLowerCase()} tempo. `;
  
  if (namesToInclude) {
    prompt += `Include the names: ${namesToInclude}. `;
  }
  
  prompt += `Story: ${yourStory}. `;
  
  if (additionalNotes) {
    prompt += `Additional notes: ${additionalNotes}. `;
  }
  
  prompt += `Make it emotional, memorable, and perfect for the occasion. The song should be uplifting and celebratory.`;
  
  return prompt;
}

/**
 * @route POST /api/song/test
 * @desc Test song generation with a simple prompt
 * @access Public
 */
router.post('/test', async (req, res) => {
  try {
    const { prompt = 'Create a happy pop song about friendship' } = req.body;
    
    console.log('🧪 TEST: Starting song generation with prompt:', prompt);
    
    // Build the song prompt
    const songPrompt = buildSongPrompt({
      specialOccasion: 'Test',
      songStyle: 'Pop',
      mood: 'Happy',
      tempo: 'Medium (80-120 BPM)',
      namesToInclude: '',
      yourStory: prompt,
      additionalNotes: 'This is a test generation'
    });

    // Prepare song data for Suno API
    const songData = {
      prompt: songPrompt,
      style: 'Pop',
      mood: 'Happy',
      tempo: 'Medium (80-120 BPM)',
      duration: 30,
      instrumental: false,
      language: 'en'
    };

    console.log('🧪 TEST: Song data prepared:', songData);

    // Generate song using Suno API
    const songResult = await sunoService.generateSong(songData);
    
    console.log('🧪 TEST: Song generation result:', songResult);
    
    // If we have an audio URL, download the file
    let downloadInfo = null;
    if (songResult.audioUrl) {
      try {
        console.log('🧪 TEST: Starting audio download...');
        const downloadResult = await sunoService.downloadAudioFile(
          songResult.audioUrl, 
          songResult.id, 
          `Song_${songData.style}_${prompt.substring(0, 30)}`
        );
        
        downloadInfo = {
          savedFilename: downloadResult.filename,
          downloadUrl: `${process.env.PUBLIC_API_BASE || process.env.BACKEND_PUBLIC_URL || "http://localhost:5001"}/api/download/${downloadResult.filename}`,
          size: downloadResult.size
        };
        
        console.log('🧪 TEST: Audio downloaded successfully:', downloadInfo);
      } catch (downloadError) {
        console.error('🧪 TEST: Audio download failed:', downloadError.message);
        // Continue without download info
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
    console.error('🧪 TEST: Error in test song generation:', error);
    
    // Handle Suno unavailable error specifically
    if (error.code === 'SUNO_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        error: 'Suno temporarily unavailable',
        hint: 'Try again or switch region/proxy',
        region: error.regionHint,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Test song generation failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/song/simple
 * @desc Submit a simple song request with minimal fields
 * @access Public
 */
router.post('/simple', async (req, res) => {
  try {
    const {
      prompt,
      style = 'pop',
      duration = 30,
      userEmail = 'test@example.com',
      debugSmall = false
    } = req.body;

    // Validate required fields
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Please provide a prompt'
      });
    }

    console.log('🎵 SIMPLE: Song request submitted:', { prompt, style, duration, userEmail });

    // Generate unique song ID
    const songId = `simple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare song data for Suno API
    const songData = {
      prompt: prompt,
      style: style,
      mood: 'Happy',
      tempo: 'Medium (80-120 BPM)',
      duration: duration,
      instrumental: false,
      language: 'en',
      debugSmall: debugSmall
    };

    console.log('🎵 SIMPLE: Song data prepared for Suno:', songData);

    // Generate song using Suno API
    const songResult = await sunoService.generateSong(songData);
    
    console.log('🎵 SIMPLE: Song generation completed:', songResult);
    
    // If we have an audio URL, download the file
    let downloadInfo = null;
    if (songResult.audioUrl) {
      try {
        console.log('🎵 SIMPLE: Starting audio download...');
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
        
        console.log('🎵 SIMPLE: Audio downloaded successfully:', downloadInfo);
      } catch (downloadError) {
        console.error('🎵 SIMPLE: Audio download failed:', downloadError.message);
        // Continue without download info
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Simple song generation completed',
      songId: songId,
      audioUrl: songResult.audioUrl,
      savedFilename: downloadInfo?.savedFilename || null,
      downloadUrl: downloadInfo?.downloadUrl || null,
      data: songResult
    });

  } catch (error) {
    console.error('🎵 SIMPLE: Error in simple song generation:', error);
    
    // Handle Suno unavailable error specifically
    if (error.code === 'SUNO_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        error: 'Suno temporarily unavailable',
        hint: 'Try again or switch region/proxy',
        region: error.regionHint,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Simple song generation failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/song
 * @desc Submit a song request (form submission)
 * @access Public
 */
router.post('/', async (req, res) => {
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
      status,
      instrumental
    } = req.body;

    // Default instrumental to false if not provided
    const instrumentalValue = typeof instrumental === 'boolean' ? instrumental : false;

    // Validate required fields
    if (!name || !email || !specialOccasion || !songStyle || !mood || !tempo || !story) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Please provide all required fields: name, email, specialOccasion, songStyle, mood, tempo, story'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }

    // BACKEND generates the canonical requestId
    const requestId = `song_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    
    // Build the song prompt from form fields, store for transparency
    const prompt = `Create a ${songStyle || 'pop'} song for ${specialOccasion || 'an event'}. ` +
                   `Mood: ${mood || 'neutral'}. Tempo: ${tempo || 'Medium (80-120 BPM)'}. ` +
                   `Include names: ${namesToInclude || 'N/A'}. Story: ${story || 'N/A'}.`;

    // Create and persist the request record IMMEDIATELY
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

    console.log('🎵 Song request submitted:', record);

    // Persist to store and force flush to disk BEFORE starting generation
    await requestStore.create(record);
    await requestStore.saveNow();
    
    console.info(`[create] saved ${requestId}, starting generation…`);

    // Fire-and-forget with error capture
    startGeneration(record).catch(err => {
      console.error('[gen] unhandled:', err);
    });

    // Return success response with the backend-generated requestId
    res.status(201).json({
      success: true,
      message: 'Song request submitted successfully',
      id: requestId, // Return the backend-generated ID
      status: 'pending',
      estimatedProcessingTime: '5-10 minutes',
      nextSteps: [
        'Your request has been queued for processing',
        'Our AI will start generating your song shortly',
        'You can check the status using the link below',
        'You will receive an email when it\'s ready'
      ]
    });

  } catch (error) {
    console.error('Error submitting song request:', error);
    
    // Handle Suno unavailable error specifically
    if (error.code === 'SUNO_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        error: 'Suno temporarily unavailable',
        hint: 'Try again or switch region/proxy',
        region: error.regionHint,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to submit song request. Please try again.'
    });
  }
});

/**
 * @route POST /api/song/generate
 * @desc Generate a new song
 * @access Public
 */
router.post('/generate', async (req, res) => {
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
      additionalNotes
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !specialOccasion || !songStyle || !mood || !tempo || !yourStory) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Please fill in all required fields',
        required: ['fullName', 'email', 'specialOccasion', 'songStyle', 'mood', 'tempo', 'yourStory']
      });
    }

    // Create the prompt
    let prompt = `Create a ${songStyle.toLowerCase()} song for a ${specialOccasion.toLowerCase()}. `;
    prompt += `The mood should be ${mood.toLowerCase()} with a ${tempo.toLowerCase()} tempo. `;
    
    if (namesToInclude) {
      prompt += `Include the names: ${namesToInclude}. `;
    }
    
    prompt += `Story: ${yourStory}`;
    
    if (additionalNotes) {
      prompt += ` ${additionalNotes}`;
    }

    console.log('🎵 Song generation request received:', {
      fullName,
      email,
      specialOccasion,
      songStyle,
      mood,
      tempo,
      promptLength: prompt.length
    });

    // Generate internal request ID
    const requestId = `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Immediately create and persist the request record
    const requestRecord = await requestStore.create({
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
    
    // Ensure it's persisted to disk immediately
    await requestStore.saveNow();
    
    console.log(`📝 [GENERATE] Created and persisted request: ${requestId}`);

    // Start AI song generation
    console.log('🎵 Starting AI song generation for:', requestId);
    console.log('🎵 Song prompt:', prompt);

    try {
      // Generate the song using the service
      const songResult = await sunoService.generateSong({
        prompt,
        songStyle,
        mood,
        tempo,
        fullName,
        email,
        phone
      });

      // Update the request record with the provider job ID
      if (songResult.metadata?.jobId) {
        await requestStore.update(requestId, {
          providerJobId: songResult.metadata.jobId,
          status: 'queued',
          updatedAt: new Date().toISOString()
        });
        await requestStore.saveNow();
        
        console.info(`[map] requestId=${requestId} → providerJobId=${songResult.metadata.jobId}`);
      }

      // Return success response with both songId and jobId
      const response = {
        success: true,
        message: 'Song generation started successfully',
        songId: requestId,
        jobId: songResult.metadata?.jobId || null,
        status: songResult.status || 'queued',
        estimatedTime: '2-5 minutes',
        data: songResult
      };
      
      console.log(`✅ [GENERATE] Success response for ${requestId}:`, response);
      res.status(200).json(response);

    } catch (generationError) {
      console.error('❌ Song generation failed:', generationError.message);
      
      // Update request status to failed
      await requestStore.update(requestId, {
        status: 'failed',
        error: generationError.message,
        updatedAt: new Date().toISOString()
      });
      await requestStore.saveNow();
      
      res.status(500).json({
        success: false,
        error: 'Song generation failed',
        message: generationError.message,
        requestId: requestId,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Song generation error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/song/test-suno
 * @desc Test Suno API connection
 * @access Public
 */
router.get('/test-suno', async (req, res) => {
  try {
    console.log('🧪 Testing Suno API connection...');
    
    // Test basic connection
    const testResult = await sunoService.getModels();
    
    res.status(200).json({
      success: true,
      message: 'Suno API connection successful!',
      data: testResult
    });
    
  } catch (error) {
    console.error('❌ Suno API test failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Suno API test failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/song/download-test
 * @desc Test downloading audio from a Suno URL
 * @access Public
 */
router.post('/download-test', async (req, res) => {
  try {
    const { audioUrl, songId = 'test_song' } = req.body;
    
    if (!audioUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing audioUrl',
        message: 'Please provide an audioUrl to test download'
      });
    }
    
    console.log('🧪 DOWNLOAD TEST: Testing download from:', audioUrl);
    
    // Test the download functionality
    const downloadedFilePath = await sunoService.downloadAudioFile(audioUrl, songId);
    
    res.status(200).json({
      success: true,
      message: 'Download test completed successfully',
      downloadedFilePath: downloadedFilePath,
      songId: songId
    });
    
  } catch (error) {
    console.error('🧪 DOWNLOAD TEST: Error in download test:', error);
    res.status(500).json({
      success: false,
      error: 'Download test failed',
      message: error.message
    });
  }
});

/**
 * @route GET /api/song/download/:songId
 * @desc Download completed song file
 * @access Public
 */
router.get('/download/:songId', async (req, res) => {
  try {
    const { songId } = req.params;
    
    // Check if this is Anna's song (req_004) or contains 'anna'
    if (songId.includes('req_004') || songId.includes('anna')) {
      // Serve the mock song file for Anna
      const filePath = path.join(__dirname, '../uploads/audio/anna_song_mock.mp3');
      
      // Check if file exists
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="anna_song_${Date.now()}.mp3"`);
        res.sendFile(filePath);
      } else {
        res.status(404).json({
          success: false,
          error: 'Song file not found',
          message: 'The song file could not be located'
        });
      }
    } else {
      // For other songs, check if they have actual files
      // In production, this would check the database for file paths
      res.status(404).json({
        success: false,
        error: 'Song not ready',
        message: 'This song is not ready for download yet'
      });
    }
    
  } catch (error) {
    console.error('Error downloading song:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to download song'
    });
  }
});

/**
 * @route GET /api/download/:filename
 * @desc Download a generated audio file
 * @access Public
 */
router.get('/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({
        error: 'Missing filename',
        message: 'Please provide a valid filename'
      });
    }
    
    const filePath = path.join(__dirname, '../uploads/audio', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The requested audio file was not found'
      });
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('❌ File download error:', error.message);
    res.status(500).json({
      error: 'Download failed',
      message: error.message
    });
  }
});

/**
 * @route GET /api/song/status/:songId
 * @desc Check the status of a song generation
 * @access Public
 */
router.get('/status/:songId', async (req, res) => {
  try {
    const { songId } = req.params;

    if (!songId) {
      return res.status(400).json({
        error: 'Missing song ID',
        message: 'Please provide a valid song ID'
      });
    }

    console.log('🔍 Checking song status:', songId);

    // Load by internal id from store
    const record = await requestStore.getById(songId);
    
    // Set cache control headers to prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '0');
    res.set('Pragma', 'no-cache');
    
    // Check micro-cache for recent responses (1.5s TTL)
    const cached = statusCache.get(songId);
    if (cached && (Date.now() - cached.ts) < TTL_MS) {
      console.log(`📋 [STATUS] Returning cached response for ${songId} (age: ${Date.now() - cached.ts}ms)`);
      return res.status(200).json(cached.payload);
    }
    
    // If record doesn't exist, return 202 for initializing
    if (!record) {
      console.log(`⏳ [STATUS] Record not found for ${songId}, returning 202 for retry`);
      return res.status(202).json({
        status: 'initializing',
        audioUrl: null,
        progress: 0,
        message: 'Request not yet persisted; retry soon.'
      });
    }

    // If record is failed or has provider error, return failure details
    if (record.status === 'failed' || record.providerError) {
      console.log(`❌ [STATUS] Record ${songId} is failed:`, record.providerError?.type || 'unknown error');
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
    
    // If record exists but no provider job ID yet, return current status
    if (!record.providerJobId) {
      console.log(`⏳ [STATUS] Record ${songId} has no provider job ID yet, status: ${record.status}`);
      
      // Check if generation has timed out (older than 8-10 seconds)
      const createdAt = new Date(record.createdAt);
      const now = new Date();
      const ageSeconds = (now - createdAt) / 1000;
      
      if (record.status === 'pending' && ageSeconds > 8) {
        console.warn(`⏰ [STATUS] Record ${songId} timed out after ${ageSeconds.toFixed(1)}s, marking as failed`);
        
        // Mark as failed with timeout error
        await requestStore.update(songId, {
          status: 'failed',
          providerError: {
            type: 'GEN_TIMEOUT',
            message: 'Generation did not start within expected time',
            code: 'TIMEOUT',
            status: 408,
            data: { ageSeconds: ageSeconds.toFixed(1) }
          },
          updatedAt: new Date().toISOString()
        });
        await requestStore.saveNow();
        
        return res.status(200).json({
          status: 'failed',
          audioUrl: null,
          progress: 100,
          message: 'Generation did not start within expected time. Please try again.',
          error: {
            type: 'GEN_TIMEOUT',
            message: 'Generation did not start within expected time'
          }
        });
      }
      
      return res.status(200).json({
        status: 'initializing',
        audioUrl: null,
        progress: 0,
        message: 'Request is initializing, waiting for provider assignment.'
      });
    }
    
    // If providerError is present, return failed status
    if (record.providerError) {
      console.log(`❌ [STATUS] Record ${songId} has provider error:`, record.providerError);
      return res.status(200).json({
        status: 'failed',
        audioUrl: null,
        progress: 100,
        message: record.providerError.message,
        error: {
          type: record.providerError.type,
          message: record.providerError.message
        }
      });
    }
    
    // Safety fallback: if no provider IDs exist, return current status
    if (!record.providerJobId && !record.providerRecordId) {
      return res.status(200).set('Cache-Control', 'no-store').json({
        status: record.status || 'queued',
        audioUrl: null,
        progress: 0
      });
    }
    
    // If provider job ID exists, query provider with that ID (not the internal id)
    console.log(`🔍 [STATUS] Checking provider status for ${songId} → provider job ID: ${record.providerJobId}`);
    
    try {
      const info = await sunoService.checkSongStatus({
        jobId: record.providerJobId,
        recordId: record.providerRecordId,
      });
      
      // If provider returns a recordId and we don't have it stored, save it
      if (info.recordId && !record.providerRecordId) {
        await requestStore.update(songId, {
          providerRecordId: info.recordId,
          updatedAt: new Date().toISOString()
        });
        await requestStore.saveNow();
        console.log(`[STATUS] Discovered and saved recordId: ${info.recordId} for ${songId}`);
      }
      
      // If status === 'completed' but audioUrl is null, do a short internal retry
      let finalStatus = info;
      if (info.status === 'completed' && !info.audioUrl) {
        console.log(`[STATUS] Completed but no audioUrl, doing short retry for ${songId}`);
        for (let i = 0; i < 3; i++) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
          const retryStatus = await sunoService.checkSongStatus({
            jobId: record.providerJobId,
            recordId: record.providerRecordId,
          });
          if (retryStatus.audioUrl) {
            finalStatus = retryStatus;
            console.log(`[STATUS] Retry ${i + 1} succeeded, got audioUrl for ${songId}`);
            break;
          }
        }
      }
      
      // Normalize the provider response
      const normalized = {
        status: finalStatus.status || 'processing',
        audioUrl: finalStatus.audioUrl || null,
        progress: typeof finalStatus.progress === 'number' ? finalStatus.progress
                  : (finalStatus.status === 'completed' ? 100
                    : finalStatus.status === 'queued' ? 0
                    : 50),
        etaSeconds: finalStatus.estimatedTime ?? null,
        startedAt: finalStatus.startedAt ?? record.createdAt,
        updatedAt: new Date().toISOString()
      };
      
      // Persist status transitions
      const patch = { 
        status: normalized.status,
        updatedAt: normalized.updatedAt
      };
      
      if (finalStatus.audioUrl) {
        patch.audioUrl = finalStatus.audioUrl;
      }
      
              await requestStore.update(songId, patch);
        await requestStore.saveNow();
      
      // Cache the response for 1.5 seconds to avoid hammering the provider
      const payload = { 
        status: normalized.status,
        audioUrl: normalized.audioUrl,
        progress: normalized.progress,
        etaSeconds: normalized.etaSeconds,
        startedAt: normalized.startedAt,
        updatedAt: normalized.updatedAt
      };
      statusCache.set(songId, { ts: Date.now(), payload });
      
      // Set cache control headers to prevent caching
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Expires', '0');
      res.set('Pragma', 'no-cache');
      res.set('Cache-Control', 'no-store');
      
      res.json(payload);
      
    } catch (providerError) {
      console.error(`❌ [STATUS] Provider error for ${songId}:`, providerError.message);
      
      // If it's an auth error, return it specifically
      if (providerError.code === 'AUTH_ERROR') {
        return res.status(200).json({
          status: 'error',
          error: 'AUTH_ERROR',
          message: 'Authentication failed. Check API key and credits.',
          progress: 0
        });
      }
      
      // For other provider errors, return processing status instead of error
      // This allows the frontend to keep polling instead of failing immediately
      return res.status(200).json({
        status: 'processing',
        error: providerError.message,
        message: `Provider temporarily unavailable: ${providerError.message}`,
        progress: 0
      });
    }

  } catch (error) {
    console.error('❌ Song status check error:', error.message);
    
    // Never throw 500, always return a valid response
    res.status(200).json({
      status: 'error',
      error: 'Failed to check song status',
      message: error.message,
      progress: 0
    });
  }
});

/**
 * @route GET /api/song/models
 * @desc Get available Suno models and capabilities
 * @access Public
 */
router.get('/models', async (req, res) => {
  try {
    console.log('📋 Fetching available Suno models');

    const models = await sunoService.getModels();

    res.status(200).json({
      success: true,
      data: models
    });

  } catch (error) {
    console.error('❌ Error fetching models:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch models',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/song/health
 * @desc Check Suno API health and configuration
 * @access Public
 */
router.get('/health', (req, res) => {
  const hasApiKey = !!process.env.SUNOAPI_ORG_API_KEY;
  const apiUrl = process.env.SUNOAPI_ORG_BASE_URL || 'https://api.sunoapi.org/api/v1';
  
  // Get callback URL for validation
  const base = (process.env.BACKEND_PUBLIC_URL || process.env.FRONTEND_URL || '').replace(/\/$/, '');
  const defaultCb = base ? `${base}/callback/suno` : '';
  const callbackUrl = process.env.SUNOAPI_ORG_CALLBACK_URL || defaultCb;

  res.status(200).json({
    success: true,
    data: {
      service: 'SunoAPI.org Song Generation',
      status: hasApiKey ? 'configured' : 'not_configured',
      apiUrl: apiUrl,
      hasApiKey: hasApiKey,
      callbackUrl: callbackUrl,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * @route GET /api/provider/health
 * @desc Check if the music provider is healthy and ready
 * @access Public
 */
router.get('/provider/health', async (req, res) => {
  try {
    console.log('🔍 [HEALTH] Checking provider health...');
    
    // Get the music provider instance
    const { getMusicProvider } = require('../services/providers');
    const provider = getMusicProvider();
    
    // Check if provider has a health method
    if (typeof provider.health === 'function') {
      const health = await provider.health();
      
      if (health.ok) {
        console.log('✅ [HEALTH] Provider is healthy:', health.message);
        return res.status(200).json({
          ok: true,
          provider: health.provider,
          message: health.message,
          status: health.status
        });
      } else {
        console.warn('⚠️ [HEALTH] Provider health check failed:', health.message);
        return res.status(503).json({
          ok: false,
          provider: health.provider,
          message: health.message,
          status: health.status,
          reason: health.reason
        });
      }
    } else {
      // Fallback: check if API key is configured
      const hasApiKey = !!(process.env.SUNOAPI_ORG_API_KEY || process.env.SUNOAPI_KEY || process.env.SUNO_API_KEY);
      
      if (hasApiKey) {
        console.log('✅ [HEALTH] Provider API key configured, assuming ready');
        return res.status(200).json({
          ok: true,
          provider: 'sunoapi_org',
          message: 'API key configured, provider ready',
          status: 200
        });
      } else {
        console.warn('⚠️ [HEALTH] No provider API key configured');
        return res.status(503).json({
          ok: false,
          provider: 'unknown',
          message: 'No API key configured',
          status: 503,
          reason: 'NO_API_KEY'
        });
      }
    }
    
  } catch (error) {
    console.error('❌ [HEALTH] Provider health check error:', error.message);
    res.status(500).json({
      ok: false,
      provider: 'unknown',
      message: 'Health check failed',
      status: 500,
      reason: 'HEALTH_CHECK_ERROR'
    });
  }
});

/**
 * @route POST /api/song/callback
 * @desc Webhook endpoint for SunoAPI.org to send status updates
 * @access Public
 */
router.post('/callback', express.json({ type: '*/*' }), async (req, res) => {
  try {
    const p = req.body || {};
    const jobId = p.jobId || p.taskId || p.id || p.data?.taskId || p.data?.id || null;
    const recordId = p.recordId || p.data?.recordId || p.data?.id || null;

    console.log('[callback] Received webhook:', { jobId, recordId, body: JSON.stringify(p).substring(0, 200) });

    // Find stored request by provider ids
    const all = await requestStore.list();
    const rec = all.find(r => r.providerJobId === jobId || (recordId && r.providerRecordId === recordId));
    
    if (!rec) {
      console.warn('[callback] No matching record for jobId=%s recordId=%s', jobId, recordId);
      return res.status(200).json({ ok: true });
    }

    // Extract audio URL
    const audioUrl =
      p.audioUrl || p.audio_url || p.url ||
      p.data?.audioUrl || p.data?.audio_url ||
      p.data?.audio?.url || (p.data?.files?.[0]?.url) || null;

    const status =
      p.status || p.state || p.jobStatus || p.data?.status || (audioUrl ? 'completed' : 'processing');

    const patch = {
      status,
      updatedAt: new Date().toISOString()
    };
    
    if (recordId && !rec.providerRecordId) patch.providerRecordId = recordId;
    if (audioUrl) patch.fileUrl = audioUrl;

    await requestStore.update(rec.id, patch);
    await requestStore.saveNow();

    console.info('[callback] %s → status=%s audio=%s', rec.id, status, audioUrl ? 'yes' : 'no');
    
    // Send email notification if song is completed with audio
    // if (status === 'completed' && audioUrl && rec.email) {
    //   // Send email asynchronously (don't wait for it)
    //   sendSongCompletionEmail(rec).catch(err => 
    //     console.error('[callback] Email notification failed:', err.message)
    //   );
    // }
    
    res.json({ ok: true });
    
  } catch (e) {
    console.error('[callback] error', e);
    res.status(200).json({ ok: true }); // never fail provider
  }
});

/**
 * @route GET /api/song/callback
 * @desc Health check for callback endpoint
 * @access Public
 */
router.get('/callback', (req, res) => res.send('OK'));

/**
 * @route GET /api/song/:id
 * @desc Get stored request record (debug route)
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        error: 'Missing request ID',
        message: 'Please provide a valid request ID'
      });
    }
    
    const record = await requestStore.getById(id);
    
    if (!record) {
      return res.status(404).json({
        error: 'Request not found',
        message: `No request found with ID: ${id}`,
        hint: 'This could mean the request was never persisted or the ID is incorrect'
      });
    }
    
    // Return the record with sensitive information masked
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
    console.error('❌ Debug route error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve request',
      message: error.message
    });
  }
});

/**
 * @route GET /api/song/debug/stats
 * @desc Get store statistics (debug route)
 * @access Public
 */
router.get('/debug/stats', async (req, res) => {
  try {
    const stats = await requestStore.getStats();
    
    res.status(200).json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Stats route error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve stats',
      message: error.message
    });
  }
});

/**
 * @route POST /api/song/retry/:id
 * @desc Retry a failed song generation request
 * @access Public
 */
router.post('/retry/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Missing song ID',
        message: 'Please provide a valid song ID'
      });
    }

    console.log(`🔄 [RETRY] Attempting to retry song generation for: ${id}`);

    // Get the existing record
    const record = await requestStore.getById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Song not found',
        message: 'The requested song was not found'
      });
    }

    // Check if the record is in a retryable state
    if (record.status !== 'failed' || !record.providerError?.retryable) {
      return res.status(400).json({
        success: false,
        error: 'Not retryable',
        message: 'This song cannot be retried. Check the error details for more information.'
      });
    }

    // Optional BYOK support
    if (process.env.ALLOW_BYOK === 'true' && req.body?.providerApiKey) {
      record.providerApiKey = req.body.providerApiKey;
    }

    // Reset the record to pending state
    await requestStore.update(id, {
      status: 'pending',
      providerError: null,
      providerJobId: null,
      updatedAt: new Date().toISOString()
    });
    await requestStore.saveNow();

    console.log(`🔄 [RETRY] Reset record ${id} to pending, starting new generation`);

    // Start generation asynchronously
    startGeneration(record).catch(err => console.error('[retry] unhandled', err));
    
    res.status(202).json({
      success: true,
      id: id,
      status: 'pending',
      message: 'Song generation restarted successfully'
    });

  } catch (error) {
    console.error('❌ [RETRY] Error retrying song generation:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retry song generation'
    });
  }
});

module.exports = router;

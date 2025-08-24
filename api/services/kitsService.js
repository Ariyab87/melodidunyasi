const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');

class KitsService {
  constructor() {
    this.apiKey = process.env.KITS_API_KEY;
    this.apiUrl = process.env.KITS_API_URL || 'https://api.kits.ai/v1';
    this.model = process.env.KITS_MODEL || 'voice-cloning';
    
    if (!this.apiKey) {
      console.warn('⚠️  KITS_API_KEY not found in environment variables');
    }
  }

  /**
   * Clone a voice using KITS AI API
   * @param {Object} voiceData - Voice cloning parameters
   * @param {string} audioFilePath - Path to the uploaded audio file
   * @returns {Promise<Object>} - Voice cloning result
   */
  async cloneVoice(voiceData, audioFilePath) {
    try {
      if (!this.apiKey) {
        throw new Error('KITS AI API key not configured');
      }

      if (!audioFilePath || !await fs.pathExists(audioFilePath)) {
        throw new Error('Audio file not found');
      }

      const {
        purpose,
        additionalNotes,
        targetLanguage = 'en',
        quality = 'high'
      } = voiceData;

      // Validate required fields
      if (!purpose) {
        throw new Error('Voice cloning purpose is required');
      }

      console.log('🎤 Starting voice cloning with KITS AI:', {
        purpose: purpose,
        audioFile: path.basename(audioFilePath),
        quality: quality,
        targetLanguage: targetLanguage
      });

      // Read and validate audio file
      const audioBuffer = await fs.readFile(audioFilePath);
      const fileSize = audioBuffer.length;
      const maxSize = 10 * 1024 * 1024; // 10MB limit

      if (fileSize > maxSize) {
        throw new Error(`Audio file too large: ${(fileSize / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB.`);
      }

      // Create form data for file upload
      const formData = new FormData();
      formData.append('audio', audioBuffer, {
        filename: path.basename(audioFilePath),
        contentType: this._getAudioContentType(audioFilePath)
      });
      formData.append('purpose', purpose);
      formData.append('quality', quality);
      formData.append('target_language', targetLanguage);
      
      if (additionalNotes) {
        formData.append('additional_notes', additionalNotes);
      }

      // Make API request to KITS AI
      const response = await axios.post(
        `${this.apiUrl}/voice/clone`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            ...formData.getHeaders(),
            'User-Agent': 'SongCreator/1.0.0'
          },
          timeout: 180000 // 3 minutes timeout
        }
      );

      if (response.data && response.data.status === 'success') {
        const voiceResult = {
          id: response.data.id || this._generateId(),
          status: 'completed',
          voiceModelUrl: response.data.voice_model_url,
          sampleAudioUrl: response.data.sample_audio_url,
          purpose: purpose,
          quality: quality,
          targetLanguage: targetLanguage,
          processingTime: response.data.processing_time || null,
          generatedAt: new Date().toISOString(),
          provider: 'kits-ai',
          metadata: {
            model: this.model,
            apiVersion: 'v1',
            audioDuration: response.data.audio_duration || null,
            voiceSimilarity: response.data.voice_similarity || null
          }
        };

        console.log('✅ Voice cloned successfully:', voiceResult.id);
        return voiceResult;
      } else {
        throw new Error('Unexpected response format from KITS AI API');
      }

    } catch (error) {
      console.error('❌ Error cloning voice with KITS AI:', error.message);
      
      // Handle specific error cases
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 401:
            throw new Error('Invalid KITS AI API key');
          case 403:
            throw new Error('Insufficient KITS AI API credits');
          case 429:
            throw new Error('KITS AI API rate limit exceeded');
          case 400:
            throw new Error(`KITS AI API error: ${data.error || 'Invalid request'}`);
          case 413:
            throw new Error('Audio file too large for KITS AI processing');
          case 500:
            throw new Error('KITS AI API internal error');
          default:
            throw new Error(`KITS AI API error (${status}): ${data.error || 'Unknown error'}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('KITS AI API request timeout');
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('KITS AI API endpoint not found');
      } else {
        throw new Error(`Voice cloning failed: ${error.message}`);
      }
    }
  }

  /**
   * Check the status of a voice cloning request
   * @param {string} voiceId - The voice ID to check
   * @returns {Promise<Object>} - Current status
   */
  async checkVoiceStatus(voiceId) {
    try {
      if (!this.apiKey) {
        throw new Error('KITS AI API key not configured');
      }

      const response = await axios.get(
        `${this.apiUrl}/voice/status/${voiceId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'User-Agent': 'SongCreator/1.0.0'
          },
          timeout: 30000
        }
      );

      return {
        id: voiceId,
        status: response.data.status,
        progress: response.data.progress || 0,
        estimatedTime: response.data.estimated_time || null,
        voiceModelUrl: response.data.voice_model_url || null,
        sampleAudioUrl: response.data.sample_audio_url || null,
        error: response.data.error || null
      };

    } catch (error) {
      console.error('❌ Error checking voice status:', error.message);
      throw new Error(`Failed to check voice status: ${error.message}`);
    }
  }

  /**
   * Generate speech using a cloned voice
   * @param {string} voiceId - The cloned voice ID
   * @param {string} text - Text to convert to speech
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Generated speech result
   */
  async generateSpeech(voiceId, text, options = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('KITS AI API key not configured');
      }

      if (!voiceId || !text) {
        throw new Error('Voice ID and text are required');
      }

      const {
        speed = 1.0,
        pitch = 1.0,
        emotion = 'neutral'
      } = options;

      const requestPayload = {
        voice_id: voiceId,
        text: text,
        speed: Math.max(0.5, Math.min(speed, 2.0)), // 0.5x to 2x
        pitch: Math.max(0.5, Math.min(pitch, 2.0)), // 0.5x to 2x
        emotion: emotion
      };

      console.log('🗣️  Generating speech with cloned voice:', {
        voiceId: voiceId,
        textLength: text.length,
        speed: speed,
        pitch: pitch
      });

      const response = await axios.post(
        `${this.apiUrl}/voice/synthesize`,
        requestPayload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'SongCreator/1.0.0'
          },
          timeout: 120000 // 2 minutes timeout
        }
      );

      if (response.data && response.data.status === 'success') {
        return {
          id: response.data.id || this._generateId(),
          status: 'completed',
          audioUrl: response.data.audio_url,
          duration: response.data.duration || null,
          text: text,
          voiceId: voiceId,
          generatedAt: new Date().toISOString(),
          provider: 'kits-ai'
        };
      } else {
        throw new Error('Unexpected response format from KITS AI API');
      }

    } catch (error) {
      console.error('❌ Error generating speech:', error.message);
      throw new Error(`Speech generation failed: ${error.message}`);
    }
  }

  /**
   * Get available voice cloning models and capabilities
   * @returns {Promise<Object>} - Available models
   */
  async getModels() {
    try {
      if (!this.apiKey) {
        throw new Error('KITS AI API key not configured');
      }

      const response = await axios.get(
        `${this.apiUrl}/models`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'User-Agent': 'SongCreator/1.0.0'
          },
          timeout: 30000
        }
      );

      return response.data;

    } catch (error) {
      console.error('❌ Error fetching KITS AI models:', error.message);
      throw new Error(`Failed to fetch models: ${error.message}`);
    }
  }

  /**
   * Get the content type for audio files
   * @param {string} filePath - Path to the audio file
   * @returns {string} - MIME content type
   */
  _getAudioContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac'
    };
    return contentTypes[ext] || 'audio/mpeg';
  }

  /**
   * Generate a unique ID for tracking
   * @returns {string} - Unique ID
   */
  _generateId() {
    return `kits_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new KitsService();

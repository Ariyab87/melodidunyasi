const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');

class RunwayService {
  constructor() {
    this.apiKey = process.env.RUNWAY_API_KEY;
    this.apiUrl = process.env.RUNWAY_API_URL || 'https://api.runwayml.com/v1';
    this.model = process.env.RUNWAY_MODEL || 'gen-3';
    
    if (!this.apiKey) {
      console.warn('⚠️  RUNWAY_API_KEY not found in environment variables');
    }
  }

  /**
   * Generate video animation using RunwayML Gen-3
   * @param {Object} videoData - Video generation parameters
   * @param {Array<string>} mediaFilePaths - Array of paths to uploaded media files
   * @returns {Promise<Object>} - Video generation result
   */
  async generateVideo(videoData, mediaFilePaths) {
    try {
      if (!this.apiKey) {
        throw new Error('RunwayML API key not configured');
      }

      if (!mediaFilePaths || mediaFilePaths.length === 0) {
        throw new Error('Media files are required');
      }

      const {
        animationStyle,
        desiredDuration,
        animationPrompt,
        videoScenario,
        additionalNotes,
        quality = 'high',
        fps = 24
      } = videoData;

      // Validate required fields
      if (!animationPrompt) {
        throw new Error('Animation prompt is required');
      }

      console.log('🎬 Starting video generation with RunwayML:', {
        style: animationStyle,
        duration: desiredDuration,
        prompt: animationPrompt,
        mediaFiles: mediaFilePaths.length,
        quality: quality,
        fps: fps
      });

      // Validate and process media files
      const mediaFiles = await this._processMediaFiles(mediaFilePaths);
      
      // Create form data for the request
      const formData = new FormData();
      
      // Add media files
      mediaFiles.forEach((file, index) => {
        formData.append(`media_${index}`, file.buffer, {
          filename: file.filename,
          contentType: file.contentType
        });
      });

      // Add other parameters
      formData.append('prompt', animationPrompt);
      formData.append('model', this.model);
      formData.append('quality', quality);
      formData.append('fps', fps);
      formData.append('duration', Math.min(Math.max(desiredDuration || 10, 5), 60)); // 5-60 seconds
      
      if (animationStyle) {
        formData.append('style', animationStyle);
      }
      
      if (videoScenario) {
        formData.append('scenario', videoScenario);
      }
      
      if (additionalNotes) {
        formData.append('additional_notes', additionalNotes);
      }

      // Make API request to RunwayML
      const response = await axios.post(
        `${this.apiUrl}/video/generate`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            ...formData.getHeaders(),
            'User-Agent': 'SongCreator/1.0.0'
          },
          timeout: 300000 // 5 minutes timeout
        }
      );

      if (response.data && response.data.status === 'success') {
        const videoResult = {
          id: response.data.id || this._generateId(),
          status: 'completed',
          videoUrl: response.data.video_url,
          thumbnailUrl: response.data.thumbnail_url,
          duration: response.data.duration || desiredDuration,
          fps: response.data.fps || fps,
          resolution: response.data.resolution || null,
          fileSize: response.data.file_size || null,
          animationStyle: animationStyle,
          prompt: animationPrompt,
          mediaFilesCount: mediaFilePaths.length,
          generatedAt: new Date().toISOString(),
          provider: 'runwayml',
          metadata: {
            model: this.model,
            apiVersion: 'v1',
            processingTime: response.data.processing_time || null,
            quality: quality
          }
        };

        console.log('✅ Video generated successfully:', videoResult.id);
        return videoResult;
      } else {
        throw new Error('Unexpected response format from RunwayML API');
      }

    } catch (error) {
      console.error('❌ Error generating video with RunwayML:', error.message);
      
      // Handle specific error cases
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 401:
            throw new Error('Invalid RunwayML API key');
          case 403:
            throw new Error('Insufficient RunwayML API credits');
          case 429:
            throw new Error('RunwayML API rate limit exceeded');
          case 400:
            throw new Error(`RunwayML API error: ${data.error || 'Invalid request'}`);
          case 413:
            throw new Error('Media files too large for RunwayML processing');
          case 500:
            throw new Error('RunwayML API internal error');
          default:
            throw new Error(`RunwayML API error (${status}): ${data.error || 'Unknown error'}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('RunwayML API request timeout');
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('RunwayML API endpoint not found');
      } else {
        throw new Error(`Video generation failed: ${error.message}`);
      }
    }
  }

  /**
   * Check the status of a video generation request
   * @param {string} videoId - The video ID to check
   * @returns {Promise<Object>} - Current status
   */
  async checkVideoStatus(videoId) {
    try {
      if (!this.apiKey) {
        throw new Error('RunwayML API key not configured');
      }

      const response = await axios.get(
        `${this.apiUrl}/video/status/${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'User-Agent': 'SongCreator/1.0.0'
          },
          timeout: 30000
        }
      );

      return {
        id: videoId,
        status: response.data.status,
        progress: response.data.progress || 0,
        estimatedTime: response.data.estimated_time || null,
        videoUrl: response.data.video_url || null,
        thumbnailUrl: response.data.thumbnail_url || null,
        error: response.data.error || null
      };

    } catch (error) {
      console.error('❌ Error checking video status:', error.message);
      throw new Error(`Failed to check video status: ${error.message}`);
    }
  }

  /**
   * Process and validate media files for video generation
   * @param {Array<string>} filePaths - Array of file paths
   * @returns {Promise<Array>} - Processed media files
   */
  async _processMediaFiles(filePaths) {
    const processedFiles = [];
    const maxTotalSize = 50 * 1024 * 1024; // 50MB total limit
    let totalSize = 0;

    for (const filePath of filePaths) {
      if (!await fs.pathExists(filePath)) {
        throw new Error(`Media file not found: ${filePath}`);
      }

      const fileBuffer = await fs.readFile(filePath);
      const fileSize = fileBuffer.length;
      totalSize += fileSize;

      if (totalSize > maxTotalSize) {
        throw new Error(`Total media files size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds limit of 50MB`);
      }

      const filename = path.basename(filePath);
      const contentType = this._getMediaContentType(filePath);

      // Validate file type
      if (!this._isValidMediaType(filename)) {
        throw new Error(`Unsupported media file type: ${filename}`);
      }

      processedFiles.push({
        buffer: fileBuffer,
        filename: filename,
        contentType: contentType,
        size: fileSize
      });
    }

    return processedFiles;
  }

  /**
   * Validate if a file is a supported media type
   * @param {string} filename - The filename to validate
   * @returns {boolean} - Whether the file type is supported
   */
  _isValidMediaType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const allowedTypes = process.env.ALLOWED_MEDIA_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'mp4', 'mov', 'avi'];
    return allowedTypes.includes(ext.substring(1));
  }

  /**
   * Get the content type for media files
   * @param {string} filePath - Path to the media file
   * @returns {string} - MIME content type
   */
  _getMediaContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo'
    };
    return contentTypes[ext] || 'application/octet-stream';
  }

  /**
   * Get available video generation models and capabilities
   * @returns {Promise<Object>} - Available models
   */
  async getModels() {
    try {
      if (!this.apiKey) {
        throw new Error('RunwayML API key not configured');
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
      console.error('❌ Error fetching RunwayML models:', error.message);
      throw new Error(`Failed to fetch models: ${error.message}`);
    }
  }

  /**
   * Generate a unique ID for tracking
   * @returns {string} - Unique ID
   */
  _generateId() {
    return `runway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new RunwayService();

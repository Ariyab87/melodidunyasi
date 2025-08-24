const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

/**
 * @route POST /api/upload/test
 * @desc Test file upload functionality
 * @access Public
 */
router.post('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Upload endpoint is working',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route GET /api/upload/info
 * @desc Get upload configuration and limits
 * @access Public
 */
router.get('/info', (req, res) => {
  const config = {
    maxFileSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
    maxFileSizeMB: (process.env.MAX_FILE_SIZE || 10 * 1024 * 1024) / 1024 / 1024,
    maxFiles: 10,
    maxFields: 20,
    allowedAudioTypes: process.env.ALLOWED_AUDIO_TYPES?.split(',') || ['mp3', 'wav', 'm4a', 'aac'],
    allowedMediaTypes: process.env.ALLOWED_MEDIA_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'mp4', 'mov', 'avi'],
    uploadPaths: {
      audio: './uploads/audio',
      images: './uploads/images',
      videos: './uploads/videos',
      temp: './uploads/temp'
    }
  };

  res.status(200).json({
    success: true,
    data: config
  });
});

/**
 * @route GET /api/upload/storage
 * @desc Get storage usage information
 * @access Public
 */
router.get('/storage', async (req, res) => {
  try {
    const uploadDirs = [
      { name: 'audio', path: './uploads/audio' },
      { name: 'images', path: './uploads/images' },
      { name: 'videos', path: './uploads/videos' },
      { name: 'temp', path: './uploads/temp' }
    ];

    const storageInfo = {};

    for (const dir of uploadDirs) {
      try {
        const files = await fs.readdir(dir.path);
        const stats = await fs.stat(dir.path);
        
        let totalSize = 0;
        let fileCount = files.length;

        // Calculate total size of files
        for (const file of files) {
          try {
            const filePath = path.join(dir.path, file);
            const fileStats = await fs.stat(filePath);
            totalSize += fileStats.size;
          } catch (error) {
            console.warn(`Could not stat file ${file}:`, error.message);
          }
        }

        storageInfo[dir.name] = {
          fileCount,
          totalSize,
          totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
          lastModified: stats.mtime
        };
      } catch (error) {
        storageInfo[dir.name] = {
          error: error.message,
          fileCount: 0,
          totalSize: 0,
          totalSizeMB: '0.00'
        };
      }
    }

    // Calculate total storage
    const totalStorage = Object.values(storageInfo).reduce((sum, info) => {
      return sum + (info.totalSize || 0);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        directories: storageInfo,
        total: {
          fileCount: Object.values(storageInfo).reduce((sum, info) => sum + (info.fileCount || 0), 0),
          totalSize,
          totalSizeMB: (totalStorage / 1024 / 1024).toFixed(2)
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error getting storage info:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get storage information',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route DELETE /api/upload/cleanup
 * @desc Clean up temporary and old files
 * @access Public
 */
router.delete('/cleanup', async (req, res) => {
  try {
    const { type = 'temp' } = req.query;
    let cleanedFiles = 0;
    let cleanedSize = 0;

    if (type === 'temp') {
      // Clean up temp files older than 1 hour
      const tempDir = './uploads/temp';
      const files = await fs.readdir(tempDir);
      const oneHourAgo = Date.now() - (60 * 60 * 1000);

      for (const file of files) {
        try {
          const filePath = path.join(tempDir, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime.getTime() < oneHourAgo) {
            const fileSize = stats.size;
            await fs.remove(filePath);
            cleanedFiles++;
            cleanedSize += fileSize;
            console.log(`🧹 Cleaned up temp file: ${file}`);
          }
        } catch (error) {
          console.warn(`Could not clean up file ${file}:`, error.message);
        }
      }
    } else if (type === 'all') {
      // Clean up all upload directories (use with caution)
      const uploadDirs = ['./uploads/audio', './uploads/images', './uploads/videos', './uploads/temp'];
      
      for (const dir of uploadDirs) {
        try {
          const files = await fs.readdir(dir);
          
          for (const file of files) {
            try {
              const filePath = path.join(dir, file);
              const stats = await fs.stat(filePath);
              const fileSize = stats.size;
              
              await fs.remove(filePath);
              cleanedFiles++;
              cleanedSize += fileSize;
              console.log(`🧹 Cleaned up file: ${file}`);
            } catch (error) {
              console.warn(`Could not clean up file ${file}:`, error.message);
            }
          }
        } catch (error) {
          console.warn(`Could not read directory ${dir}:`, error.message);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Cleanup completed successfully`,
      data: {
        cleanedFiles,
        cleanedSize,
        cleanedSizeMB: (cleanedSize / 1024 / 1024).toFixed(2),
        type,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Cleanup failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/upload/health
 * @desc Check upload system health
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    const uploadDirs = [
      './uploads',
      './uploads/audio',
      './uploads/images',
      './uploads/videos',
      './uploads/temp'
    ];

    const healthStatus = {};

    for (const dir of uploadDirs) {
      try {
        await fs.access(dir, fs.constants.R_OK | fs.constants.W_OK);
        healthStatus[dir] = 'healthy';
      } catch (error) {
        healthStatus[dir] = 'unhealthy';
      }
    }

    const allHealthy = Object.values(healthStatus).every(status => status === 'healthy');

    res.status(200).json({
      success: true,
      data: {
        service: 'File Upload System',
        status: allHealthy ? 'healthy' : 'degraded',
        directories: healthStatus,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error checking upload health:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

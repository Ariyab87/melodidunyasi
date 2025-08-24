const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist
const createUploadDirs = async () => {
  const dirs = [
    './uploads',
    './uploads/audio',
    './uploads/images',
    './uploads/videos',
    './uploads/temp'
  ];
  
  for (const dir of dirs) {
    await fs.ensureDir(dir);
  }
};

createUploadDirs().catch(console.error);

// Configure storage for different file types
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = './uploads/temp';
    
    // Determine upload path based on file type
    if (file.fieldname === 'audio') {
      uploadPath = './uploads/audio';
    } else if (file.fieldname.startsWith('media')) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        uploadPath = './uploads/images';
      } else if (['.mp4', '.mov', '.avi'].includes(ext)) {
        uploadPath = './uploads/videos';
      }
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and UUID
    const timestamp = Date.now();
    const uuid = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}_${uuid}${ext}`;
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedAudioTypes = process.env.ALLOWED_AUDIO_TYPES?.split(',') || ['mp3', 'wav', 'm4a', 'aac'];
  const allowedMediaTypes = process.env.ALLOWED_MEDIA_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'mp4', 'mov', 'avi'];
  
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (file.fieldname === 'audio') {
    if (allowedAudioTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Audio file type .${ext} is not allowed. Allowed types: ${allowedAudioTypes.join(', ')}`), false);
    }
  } else if (file.fieldname.startsWith('media')) {
    if (allowedMediaTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Media file type .${ext} is not allowed. Allowed types: ${allowedMediaTypes.join(', ')}`), false);
    }
  } else {
    cb(new Error('Invalid field name'), false);
  }
};

// Configure multer with limits and validation
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 10, // Maximum 10 files
    fields: 20 // Maximum 20 form fields
  }
});

// Specific upload configurations for different use cases
const audioUpload = upload.single('audio');
const mediaUpload = upload.array('media', 10); // Max 10 media files
const mixedUpload = upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'media', maxCount: 10 }
]);

// Error handling wrapper
const handleUploadError = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            return res.status(413).json({
              error: 'File too large',
              message: `File "${err.field}" exceeds the maximum allowed size of ${(process.env.MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB`
            });
          case 'LIMIT_FILE_COUNT':
            return res.status(413).json({
              error: 'Too many files',
              message: `Maximum ${err.limit} files allowed`
            });
          case 'LIMIT_FIELD_COUNT':
            return res.status(413).json({
              error: 'Too many form fields',
              message: `Maximum ${err.limit} form fields allowed`
            });
          case 'LIMIT_UNEXPECTED_FILE':
            return res.status(400).json({
              error: 'Unexpected file field',
              message: `Unexpected file field "${err.field}"`
            });
          default:
            return res.status(400).json({
              error: 'File upload error',
              message: err.message
            });
        }
      } else if (err) {
        return res.status(400).json({
          error: 'File validation error',
          message: err.message
        });
      }
      next();
    });
  };
};

// Cleanup temporary files
const cleanupTempFiles = async (req, res, next) => {
  try {
    const tempDir = './uploads/temp';
    const files = await fs.readdir(tempDir);
    
    // Remove files older than 1 hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime.getTime() < oneHourAgo) {
        await fs.remove(filePath);
        console.log(`🧹 Cleaned up temp file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
  
  next();
};

// Schedule cleanup every hour
setInterval(() => {
  cleanupTempFiles({}, {}, () => {});
}, 60 * 60 * 1000);

module.exports = {
  audioUpload: handleUploadError(audioUpload),
  mediaUpload: handleUploadError(mediaUpload),
  mixedUpload: handleUploadError(mixedUpload),
  cleanupTempFiles,
  upload
};

const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();

function isSafeSegment(seg) {
  // prevent path traversal
  return /^[\w\-. ]+$/.test(seg);
}

/**
 * @route GET /api/download/:filename
 * @desc Download audio file by filename
 * @access Public
 */
router.get("/download/:filename", (req, res) => {
  const { filename } = req.params;
  
  console.log(`🔍 [DOWNLOAD] Request for filename: ${filename}`);
  
  if (!filename || !isSafeSegment(filename)) {
    console.log(`❌ [DOWNLOAD] Invalid filename: ${filename}`);
    return res.status(400).json({ error: "Invalid filename" });
  }
  
  let filePath = path.join(__dirname, "..", "uploads", "audio", filename);
  console.log(`🔍 [DOWNLOAD] Looking for file at: ${filePath}`);
  
  // If file not found, try alternative extensions
  if (!fs.existsSync(filePath)) {
    console.log(`❌ [DOWNLOAD] File not found at: ${filePath}`);
    const baseName = path.parse(filename).name;
    const ext = path.extname(filename).toLowerCase();
    
    // Try alternative extensions if common mismatch
    if (ext === '.wav') {
      const mp3Path = path.join(__dirname, "..", "uploads", "audio", `${baseName}.mp3`);
      if (fs.existsSync(mp3Path)) {
        filePath = mp3Path;
        console.log(`🔍 [DOWNLOAD] Found ${baseName}.mp3 instead of ${filename}`);
      }
    } else if (ext === '.mp3') {
      const wavPath = path.join(__dirname, "..", "uploads", "audio", `${baseName}.wav`);
      if (fs.existsSync(wavPath)) {
        filePath = wavPath;
        console.log(`🔍 [DOWNLOAD] Found ${baseName}.wav instead of ${filename}`);
      }
    }
    
    // If still not found, return 404
    if (!fs.existsSync(filePath)) {
      console.log(`❌ [DOWNLOAD] File not found after trying alternatives`);
      return res.status(404).json({ error: "File not found" });
    }
  } else {
    console.log(`✅ [DOWNLOAD] File found at: ${filePath}`);
  }
  
  // Set proper headers for download
  res.setHeader("Content-Disposition", `attachment; filename="${path.basename(filePath)}"`);
  
  console.log(`✅ [DOWNLOAD] Starting download for: ${filename}`);
  
  // Stream the file
  res.download(filePath, (err) => {
    if (err) {
      console.error('❌ Error serving download:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Download failed" });
      }
    } else {
      console.log(`✅ [DOWNLOAD] Download completed successfully for: ${filename}`);
    }
  });
});

module.exports = router;

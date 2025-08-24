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
router.get("/:filename", (req, res) => {
  const { filename } = req.params;
  
  if (!filename || !isSafeSegment(filename)) {
    return res.status(400).json({ error: "Invalid filename" });
  }
  
  let filePath = path.join(__dirname, "..", "uploads", filename);
  
  // If file not found, try alternative extensions
  if (!fs.existsSync(filePath)) {
    const baseName = path.parse(filename).name;
    const ext = path.extname(filename).toLowerCase();
    
    // Try alternative extensions if common mismatch
    if (ext === '.wav') {
      const mp3Path = path.join(__dirname, "..", "uploads", `${baseName}.mp3`);
      if (fs.existsSync(mp3Path)) {
        filePath = mp3Path;
        console.log(`🔍 [DOWNLOAD] Found ${baseName}.mp3 instead of ${filename}`);
      }
    } else if (ext === '.mp3') {
      const wavPath = path.join(__dirname, "..", "uploads", `${baseName}.wav`);
      if (fs.existsSync(wavPath)) {
        filePath = wavPath;
        console.log(`🔍 [DOWNLOAD] Found ${baseName}.wav instead of ${filename}`);
      }
    }
    
    // If still not found, return 404
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
  }
  
  // Set proper headers for download
  res.setHeader("Content-Disposition", `attachment; filename="${path.basename(filePath)}"`);
  
  // Stream the file
  res.download(filePath, (err) => {
    if (err) {
      console.error('❌ Error serving download:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Download failed" });
      }
    }
  });
});

module.exports = router;

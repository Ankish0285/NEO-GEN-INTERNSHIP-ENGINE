const express = require('express');
const router  = express.Router();
const upload  = require('../middleware/uploadMiddleware');
const { optionalAuth } = require('../middleware/authMiddleware');
const { smartCloudinaryUpload } = require('../utils/cloudinaryUpload');

/**
 * @desc    Upload any file with automatic Cloudinary duplicate detection.
 *          If the exact same file (by SHA-256 hash) was uploaded before,
 *          the existing Cloudinary URL is returned — no second upload.
 * @route   POST /api/upload
 * @access  Public / Optional-Auth
 */
router.post('/', optionalAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    // Determine if this is an image type (for Cloudinary resource_type)
    const isImage = /^image\//i.test(req.file.mimetype);
    const isDoc   = /\.(pdf|docx?)$/i.test(req.file.originalname);
    const resourceType = isDoc ? 'raw' : (isImage ? 'image' : 'auto');

    const result = await smartCloudinaryUpload(req.file, {
      folder: 'neo-gen/uploads',
      resourceType,
    });

    return res.status(200).json({
      message:  result.reused ? 'Existing file reused (duplicate detected)' : 'File uploaded successfully',
      filePath: result.url,
      fileName: req.file.originalname,
      reused:   result.reused,
      isLocal:  result.isLocal || false,
    });
  } catch (error) {
    console.error('[Upload Route] Error:', error.message);
    return res.status(500).json({ message: error.message || 'Upload failed' });
  }
});

module.exports = router;

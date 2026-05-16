const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// @desc    Upload file
// @route   POST /api/upload
// @access  Public/Private
router.post('/', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            res.status(400);
            throw new Error('Please upload a file');
        }
        // Multer diskStorage sets path to a filesystem path (invalid in <img src>). Expose web path.
        const publicPath = `/uploads/${req.file.filename}`;
        res.status(200).json({
            message: 'File uploaded successfully',
            filePath: publicPath,
            fileName: req.file.originalname
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;

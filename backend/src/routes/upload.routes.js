const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { upload, uploadToS3 } = require('../middleware/upload');

router.post('/image', authenticate, upload.single('file'), uploadToS3, (req, res) => {
  res.json({ url: req.fileUrl, key: req.fileKey });
});

router.post('/images', authenticate, upload.array('files', 20), uploadToS3, (req, res) => {
  res.json({ files: req.uploadedFiles });
});

module.exports = router;

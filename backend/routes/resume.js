const express = require('express');
const router = express.Router();
const { analyzeResume } = require('../controllers/resumeController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/analyze', protect, upload.single('resume'), analyzeResume);

module.exports = router;

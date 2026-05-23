const express = require('express');
const router = express.Router();
const { startAptitudeSession, submitAptitudeSession } = require('../controllers/aptitudeController');
const { protect } = require('../middleware/auth');

router.get('/start', protect, startAptitudeSession);
router.post('/submit', protect, submitAptitudeSession);

module.exports = router;

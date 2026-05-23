const express = require('express');
const router = express.Router();
const {
  startSession,
  submitSession,
  getHistory,
  toggleBookmark,
  saveNote,
  getLeaderboard
} = require('../controllers/interviewController');
const { protect } = require('../middleware/auth');

router.post('/session/start', protect, startSession);
router.post('/session/submit', protect, submitSession);
router.get('/history', protect, getHistory);
router.get('/leaderboard', protect, getLeaderboard);
router.post('/questions/:id/bookmark', protect, toggleBookmark);
router.post('/questions/:id/note', protect, saveNote);

module.exports = router;

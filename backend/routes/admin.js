const express = require('express');
const router = express.Router();
const {
  getGlobalStats,
  listAllQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  listAllUsers,
  deleteUser
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// All routes are double-guarded by token check AND administrator clearance check
router.get('/stats', protect, adminOnly, getGlobalStats);
router.get('/questions', protect, adminOnly, listAllQuestions);
router.post('/questions', protect, adminOnly, createQuestion);
router.put('/questions/:id', protect, adminOnly, updateQuestion);
router.delete('/questions/:id', protect, adminOnly, deleteQuestion);
router.get('/users', protect, adminOnly, listAllUsers);
router.delete('/users/:id', protect, adminOnly, deleteUser);

module.exports = router;

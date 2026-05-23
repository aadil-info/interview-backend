const mongoose = require('mongoose');
const { createModel } = require('../config/db');

const schema = new mongoose.Schema({
  userId:         { type: String, required: true },
  answers:        [{ questionId: String, questionText: String, selectedOptionIndex: Number,
                     correctOptionIndex: Number, isCorrect: Boolean, explanation: String }],
  score:          { type: Number, required: true },
  correctCount:   { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  durationSeconds:{ type: Number, default: 0 },
  createdAt:      { type: Date, default: Date.now }
});

module.exports = createModel('AptitudeTest', schema);

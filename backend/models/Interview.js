const mongoose = require('mongoose');
const { createModel } = require('../config/db');

const schema = new mongoose.Schema({
  userId:          { type: String, required: true },
  category:        { type: String, enum: ['technical','hr'], required: true },
  difficulty:      { type: String, enum: ['beginner','intermediate','advanced'], required: true },
  questions:       [{ questionId: String, questionText: String, userAnswer: String,
                      score: Number, feedback: String, sentiment: String,
                      speed: Number, matchingKeywords: [String] }],
  overallScore:    { type: Number, default: 0 },
  overallFeedback: { type: String, default: '' },
  durationSeconds: { type: Number, default: 0 },
  createdAt:       { type: Date, default: Date.now }
});

module.exports = createModel('Interview', schema);

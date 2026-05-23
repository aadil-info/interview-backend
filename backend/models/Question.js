const mongoose = require('mongoose');
const { createModel } = require('../config/db');

const schema = new mongoose.Schema({
  category:          { type: String, enum: ['technical','hr','aptitude'], required: true },
  topic:             { type: String, required: true },
  difficulty:        { type: String, enum: ['beginner','intermediate','advanced'], default: 'beginner' },
  questionText:      { type: String, required: true },
  options:           [{ type: String }],
  correctOptionIndex:{ type: Number },
  explanation:       { type: String },
  suggestedKeywords: [{ type: String }],
  idealResponse:     { type: String },
  createdAt:         { type: Date, default: Date.now }
});

module.exports = createModel('Question', schema);

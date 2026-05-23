const mongoose = require('mongoose');
const { createModel } = require('../config/db');

const schema = new mongoose.Schema({
  userId:         { type: String, required: true },
  fileName:       { type: String, required: true },
  atsScore:       { type: Number, required: true },
  skillsDetected: [{ type: String }],
  missingSkills:  [{ type: String }],
  improvements:   [{ type: String }],
  createdAt:      { type: Date, default: Date.now }
});

module.exports = createModel('Resume', schema);

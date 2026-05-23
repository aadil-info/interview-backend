const mongoose = require('mongoose');
const { createModel } = require('../config/db');

const schema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['user','admin'], default: 'user' },
  bookmarks: [{ type: String }],
  notes:     { type: Map, of: String, default: {} },
  createdAt: { type: Date, default: Date.now }
});

module.exports = createModel('User', schema);

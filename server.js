require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { connectDB, isJSONMode } = require('./backend/config/db');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dynamic DB Initializer
connectDB();

// Express Static folder mount for frontend
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/interviews', require('./backend/routes/interview'));
app.use('/api/resume', require('./backend/routes/resume'));
app.use('/api/aptitude', require('./backend/routes/aptitude'));
app.use('/api/admin', require('./backend/routes/admin'));

// HTML Navigation Fallback Routing (Supports clean URL routing to frontend html pages)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/interview', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'interview.html'));
});

app.get('/aptitude', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'aptitude.html'));
});

app.get('/resume-analyzer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'resume-analyzer.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Root path fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server Listening
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`❇️  AI Interview Prep SaaS Started Successfully!`);
  console.log(`🚀 Portal Link: http://localhost:${PORT}`);
  console.log(`📂 DB Engine  : ${isJSONMode() ? 'Resilient JSON Database Fallback Mode' : 'Connected to MongoDB'}`);
  console.log(`===================================================`);
});

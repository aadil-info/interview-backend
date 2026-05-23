const User = require('../models/User');
const Interview = require('../models/Interview');
const AptitudeTest = require('../models/AptitudeTest');
const Resume = require('../models/Resume');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'ai_interview_prep_secret_key_987654321', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    // The role can be admin if explicitly requested in dev/testing, but defaults to 'user'
    const userRole = role === 'admin' ? 'admin' : 'user';

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: userRole,
      bookmarks: [],
      notes: {}
    });

    if (user) {
      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      return res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Get user profile with statistics
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch user statistics
    const interviews = await Interview.find({ userId: String(user._id) });
    const aptitudeTests = await AptitudeTest.find({ userId: String(user._id) });
    const resumes = await Resume.find({ userId: String(user._id) });

    // Aggregate statistics
    const totalInterviews = interviews.length;
    const totalAptitudeTests = aptitudeTests.length;
    
    // Average Interview Score
    let avgInterviewScore = 0;
    if (totalInterviews > 0) {
      const sum = interviews.reduce((acc, curr) => acc + (curr.overallScore || 0), 0);
      avgInterviewScore = Math.round(sum / totalInterviews);
    }

    // Average Aptitude Score
    let avgAptitudeScore = 0;
    if (totalAptitudeTests > 0) {
      const sum = aptitudeTests.reduce((acc, curr) => acc + (curr.score || 0), 0);
      avgAptitudeScore = Math.round(sum / totalAptitudeTests);
    }

    // Latest Resume ATS Score
    let latestResumeATS = 0;
    if (resumes.length > 0) {
      // Find latest resume
      const sortedResumes = resumes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      latestResumeATS = sortedResumes[0].atsScore || 0;
    }

    // Compile dynamic history logs
    const recentActivity = [];
    
    interviews.forEach(i => {
      recentActivity.push({
        type: 'Mock Interview',
        label: `${i.category.toUpperCase()} (${i.difficulty})`,
        score: i.overallScore,
        date: i.createdAt,
        id: i._id
      });
    });

    aptitudeTests.forEach(a => {
      recentActivity.push({
        type: 'Aptitude Test',
        label: `Aptitude Practice`,
        score: a.score,
        date: a.createdAt,
        id: a._id
      });
    });

    resumes.forEach(r => {
      recentActivity.push({
        type: 'Resume ATS Scan',
        label: r.fileName,
        score: r.atsScore,
        date: r.createdAt,
        id: r._id
      });
    });

    // Sort active log by date descending
    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Return profile & compiled statistics
    return res.json({
      profile: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bookmarks: user.bookmarks || [],
        notes: user.notes || {},
        createdAt: user.createdAt
      },
      stats: {
        totalInterviews,
        avgInterviewScore,
        totalAptitudeTests,
        avgAptitudeScore,
        latestResumeATS
      },
      recentActivity: recentActivity.slice(0, 10) // Limit to top 10 items
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Server error retrieving profile', error: error.message });
  }
};

// @desc    Update user profile or notes/bookmarks
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update details
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) {
      // Check if email already in use
      const dup = await User.findOne({ email: req.body.email });
      if (dup && String(dup._id) !== String(user._id)) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = req.body.email;
    }

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    // Update fields (mongoose needs markModified for Map/Array updates, JSON handles standard object write)
    const updated = await User.findByIdAndUpdate(
      user._id,
      {
        name: user.name,
        email: user.email,
        password: user.password
      },
      { new: true }
    );

    return res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
};

module.exports = {
  signup,
  login,
  getProfile,
  updateProfile
};

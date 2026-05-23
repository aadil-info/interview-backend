const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ai_interview_prep_secret_key_987654321');

      const user = await User.findById(decoded.id);
      if (!user) return res.status(401).json({ message: 'Not authorized, user not found' });

      // Flatten Mongoose doc to plain object for JSON-DB compatibility
      req.user = user.toObject ? user.toObject() : user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ message: 'Access denied: Administrators only' });
};

module.exports = { protect, adminOnly };

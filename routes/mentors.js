const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const MentorProfile = require('../models/MentorProfile');
const StartupPitch = require('../models/StartupPitch');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

// Request feedback from a mentor
router.post('/request-feedback', verifyToken, async (req, res) => {
  try {
    const { mentorId } = req.body;
    
    // Get the startup user
    const startupUser = await User.findById(req.userId);
    if (!startupUser || startupUser.role !== 'Startup') {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    // Get the mentor profile
    const mentorProfile = await MentorProfile.findById(mentorId);
    if (!mentorProfile) {
      return res.status(404).json({ msg: 'Mentor not found' });
    }

    // Get the latest pitch from the startup
    const latestPitch = await StartupPitch.findOne({ userId: req.userId })
      .sort({ createdAt: -1 });

    if (!latestPitch) {
      return res.status(400).json({ msg: 'No pitch found. Please create a pitch first.' });
    }

    // TODO: Implement notification system to notify the mentor
    // For now, we'll just return success
    res.json({ msg: 'Feedback request sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router; 
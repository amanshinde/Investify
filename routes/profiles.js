const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const InvestorProfile = require('../models/InvestorProfile');
const MentorProfile = require('../models/MentorProfile');
const StartupProfile = require('../models/StartupProfile');

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

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    let profile;
    switch (user.role) {
      case 'Investor':
        profile = await InvestorProfile.findOne({ userId: req.userId });
        break;
      case 'Mentor':
        profile = await MentorProfile.findOne({ userId: req.userId });
        break;
      case 'Startup':
        profile = await StartupProfile.findOne({ userId: req.userId });
        break;
      default:
        return res.status(400).json({ msg: 'Invalid role' });
    }

    res.json({ user, profile });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create/Update Investor Profile
router.post('/investor', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'Investor') {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    const { company, description, profilePicture, investmentFocus } = req.body;
    
    let profile = await InvestorProfile.findOne({ userId: req.userId });
    if (profile) {
      // Update existing profile
      profile.company = company;
      profile.description = description;
      profile.profilePicture = profilePicture;
      profile.investmentFocus = investmentFocus;
      profile.updatedAt = Date.now();
    } else {
      // Create new profile
      profile = new InvestorProfile({
        userId: req.userId,
        company,
        description,
        profilePicture,
        investmentFocus
      });
    }

    await profile.save();
    user.profileCompleted = true;
    await user.save();

    res.json({ msg: 'Profile saved successfully', profile });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create/Update Mentor Profile
router.post('/mentor', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'Mentor') {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    const { position, expertise, description, profilePicture, mentoringApproach } = req.body;
    
    let profile = await MentorProfile.findOne({ userId: req.userId });
    if (profile) {
      // Update existing profile
      profile.position = position;
      profile.expertise = expertise;
      profile.description = description;
      profile.profilePicture = profilePicture;
      profile.mentoringApproach = mentoringApproach;
      profile.updatedAt = Date.now();
    } else {
      // Create new profile
      profile = new MentorProfile({
        userId: req.userId,
        position,
        expertise,
        description,
        profilePicture,
        mentoringApproach
      });
    }

    await profile.save();
    user.profileCompleted = true;
    await user.save();

    res.json({ msg: 'Profile saved successfully', profile });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create/Update Startup Profile
router.post('/startup', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'Startup') {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    const { startupName, founderName, industry, description, logo, stage } = req.body;
    
    let profile = await StartupProfile.findOne({ userId: req.userId });
    if (profile) {
      // Update existing profile
      profile.startupName = startupName;
      profile.founderName = founderName;
      profile.industry = industry;
      profile.description = description;
      profile.logo = logo;
      profile.stage = stage;
      profile.updatedAt = Date.now();
    } else {
      // Create new profile
      profile = new StartupProfile({
        userId: req.userId,
        startupName,
        founderName,
        industry,
        description,
        logo,
        stage
      });
    }

    await profile.save();
    user.profileCompleted = true;
    await user.save();

    res.json({ msg: 'Profile saved successfully', profile });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get profile data for dashboard
router.get('/dashboard-data', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    let profile;
    switch (user.role) {
      case 'Investor':
        profile = await InvestorProfile.findOne({ userId: req.userId });
        break;
      case 'Mentor':
        profile = await MentorProfile.findOne({ userId: req.userId });
        break;
      case 'Startup':
        profile = await StartupProfile.findOne({ userId: req.userId });
        break;
      default:
        return res.status(400).json({ msg: 'Invalid role' });
    }

    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    // Combine user and profile data
    const dashboardData = {
      name: user.name,
      role: user.role,
      ...profile.toObject()
    };

    res.json(dashboardData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router; 
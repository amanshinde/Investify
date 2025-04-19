const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const passport = require('passport');

const router = express.Router();

// Local Signup
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ msg: 'User already exists' });

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashed, role });
  await user.save();

  res.status(201).json({ msg: 'Signup successful' });
});

// Local Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ msg: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ 
    token,
    role: user.role,
    name: user.name,
    profileCompleted: user.profileCompleted
  });
});

// Check profile completion status
router.get('/profile-status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    res.json({ 
      profileCompleted: user.profileCompleted,
      role: user.role
    });
  } catch (error) {
    res.status(401).json({ msg: 'Invalid token' });
  }
});

// Update profile completion status
router.post('/complete-profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.profileCompleted = true;
    await user.save();

    res.json({ msg: 'Profile completed successfully' });
  } catch (error) {
    res.status(401).json({ msg: 'Invalid token' });
  }
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/login',
  successRedirect: '/dashboard'
}));

// Google OAuth Login
router.post('/google-login', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        name,
        email,
        role: 'Startup', // Default role for Google sign-in
        profileCompleted: false
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    
    res.json({
      token,
      role: user.role,
      name: user.name,
      profileCompleted: user.profileCompleted
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ msg: 'Error during Google login' });
  }
});

module.exports = router;

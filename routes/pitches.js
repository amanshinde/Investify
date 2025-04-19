const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const StartupPitch = require('../models/StartupPitch');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log('No authorization header');
        return res.status(401).json({ msg: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        console.log('No token in authorization header');
        return res.status(401).json({ msg: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        console.log('Token verified for user:', decoded.id);
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({ msg: 'Invalid token' });
    }
};

// Create a new pitch with file uploads
router.post('/', verifyToken, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'pitchDeck', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('Received pitch creation request:', {
            body: req.body,
            files: req.files,
            userId: req.userId
        });
        
        const user = await User.findById(req.userId);
        if (!user || user.role !== 'Startup') {
            console.log('Unauthorized access attempt:', { userId: req.userId, role: user?.role });
            return res.status(403).json({ msg: 'Unauthorized' });
        }

        // Check if user already has a pitch
        const existingPitch = await StartupPitch.findOne({ userId: req.userId });
        if (existingPitch) {
            console.log('User already has a pitch:', existingPitch._id);
            return res.status(400).json({ msg: 'You already have a pitch. Please use the update function to modify it.' });
        }

        const {
            title,
            industry,
            description,
            marketDetails,
            tractionDetails
        } = req.body;

        console.log('Creating new pitch for user:', { 
            userId: req.userId, 
            title,
            hasVideo: !!req.files?.video?.[0],
            hasPitchDeck: !!req.files?.pitchDeck?.[0],
            hasPdf: !!req.files?.pdf?.[0]
        });

        const pitch = new StartupPitch({
            userId: req.userId,
            title,
            industry,
            description,
            videoUrl: req.files?.video?.[0] ? `http://localhost:5000/uploads/${req.files.video[0].filename}` : '',
            pitchDeckUrl: req.files?.pitchDeck?.[0] ? `http://localhost:5000/uploads/${req.files.pitchDeck[0].filename}` : '',
            pdfUrl: req.files?.pdf?.[0] ? `http://localhost:5000/uploads/${req.files.pdf[0].filename}` : '',
            marketDetails,
            tractionDetails
        });

        const savedPitch = await pitch.save();
        console.log('Pitch saved successfully:', { 
            pitchId: savedPitch._id, 
            title: savedPitch.title,
            videoUrl: savedPitch.videoUrl,
            pitchDeckUrl: savedPitch.pitchDeckUrl,
            pdfUrl: savedPitch.pdfUrl
        });
        
        res.json({ msg: 'Pitch created successfully', pitch: savedPitch });
    } catch (error) {
        console.error('Error creating pitch:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
});

// Get all pitches for a startup
router.get('/my-pitches', verifyToken, async (req, res) => {
    try {
        console.log('Fetching pitches for user:', req.userId);
        
        const user = await User.findById(req.userId);
        if (!user) {
            console.log('User not found:', req.userId);
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.role !== 'Startup') {
            console.log('Unauthorized role:', user.role);
            return res.status(403).json({ msg: 'Unauthorized - User must be a Startup' });
        }

        const pitches = await StartupPitch.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .select('title description videoUrl pitchDeckUrl pdfUrl createdAt updatedAt');
        
        console.log(`Found ${pitches.length} pitches for user ${req.userId}`);
        console.log('Pitches:', pitches);
        
        res.json(pitches);
    } catch (error) {
        console.error('Error fetching pitches:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
});

// Get all pitches (for investors and mentors)
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || (user.role !== 'Investor' && user.role !== 'Mentor')) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    const pitches = await StartupPitch.find()
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(pitches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get a single pitch by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || (user.role !== 'Investor' && user.role !== 'Mentor')) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    const pitch = await StartupPitch.findById(req.params.id)
      .populate('userId', 'name');
    
    if (!pitch) {
      return res.status(404).json({ msg: 'Pitch not found' });
    }

    res.json(pitch);
  } catch (error) {
    console.error('Error fetching pitch:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Update a pitch
router.put('/my-pitches', verifyToken, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'pitchDeck', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('Updating pitch for user:', req.userId);
        
        const user = await User.findById(req.userId);
        if (!user || user.role !== 'Startup') {
            return res.status(403).json({ msg: 'Unauthorized' });
        }

        // Get the latest pitch for the user
        const latestPitch = await StartupPitch.findOne({ userId: req.userId })
            .sort({ createdAt: -1 });

        if (!latestPitch) {
            return res.status(404).json({ msg: 'No pitch found to update' });
        }

        const {
            title,
            industry,
            description,
            marketDetails,
            tractionDetails
        } = req.body;

        // Update pitch fields
        latestPitch.title = title || latestPitch.title;
        latestPitch.industry = industry || latestPitch.industry;
        latestPitch.description = description || latestPitch.description;
        latestPitch.marketDetails = marketDetails || latestPitch.marketDetails;
        latestPitch.tractionDetails = tractionDetails || latestPitch.tractionDetails;

        // Update file URLs if new files are uploaded
        if (req.files?.video?.[0]) {
            latestPitch.videoUrl = `/uploads/${req.files.video[0].filename}`;
        }
        if (req.files?.pitchDeck?.[0]) {
            latestPitch.pitchDeckUrl = `/uploads/${req.files.pitchDeck[0].filename}`;
        }
        if (req.files?.pdf?.[0]) {
            latestPitch.pdfUrl = `/uploads/${req.files.pdf[0].filename}`;
        }

        latestPitch.updatedAt = Date.now();

        const updatedPitch = await latestPitch.save();
        console.log('Pitch updated successfully:', updatedPitch._id);
        
        res.json({ msg: 'Pitch updated successfully', pitch: updatedPitch });
    } catch (error) {
        console.error('Error updating pitch:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
});

// Delete a pitch
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'Startup') {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    const pitch = await StartupPitch.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!pitch) {
      return res.status(404).json({ msg: 'Pitch not found' });
    }

    res.json({ msg: 'Pitch deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router; 
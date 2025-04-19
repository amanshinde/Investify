const mongoose = require('mongoose');

const mentorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  position: {
    type: String,
    required: true
  },
  expertise: [{
    type: String,
    required: true
  }],
  description: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  mentoringApproach: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MentorProfile', mentorProfileSchema); 
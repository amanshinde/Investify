const mongoose = require('mongoose');

const startupProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  startupName: {
    type: String,
    required: true
  },
  founderName: {
    type: String,
    required: true
  },
  industry: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  logo: {
    type: String,
    default: ''
  },
  stage: {
    type: String,
    enum: ['Idea', 'MVP', 'Early Traction', 'Growth', 'Scale'],
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

module.exports = mongoose.model('StartupProfile', startupProfileSchema); 
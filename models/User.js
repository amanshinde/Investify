const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { 
    type: String, 
    unique: true,
    required: true
  },
  password: String,
  role: {
    type: String,
    enum: ['Startup', 'Mentor', 'Investor'],
    default: 'Startup'
  },
  googleId: String,
  profileCompleted: { 
    type: Boolean, 
    default: false 
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);

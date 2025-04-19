const mongoose = require('mongoose');

const pitchSchema = new mongoose.Schema({
    startupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    industry: {
        type: String,
        required: true
    },
    fundingGoal: {
        type: Number,
        required: true
    },
    currentFunding: {
        type: Number,
        default: 0
    },
    pitchDeck: {
        type: String,
        required: true
    },
    videoUrl: {
        type: String
    },
    interestedInvestors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    savedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['active', 'funded', 'closed'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Pitch', pitchSchema); 
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  rollNumber: {
    type: String,
    default: '',
    trim: true,
  },
  year: {
    type: String,
    default: '3rd Year',
  },
  branch: {
    type: String,
    default: 'Computer Science & Engineering',
  },
  college: {
    type: String,
    default: 'Delhi Technological University',
  },
  phone: {
    type: String,
    default: '+91 98765 43210',
  },
  avatar: {
    type: String,
    default: '',
  },
  password: {
    type: String,
    required: true,
  },
  followedClubs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
  }],
  shortlistedCompetitions: [{
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    competitionName: String,
    currentRound: Number,
    totalRounds: Number,
    currentRoundName: String,
    nextRoundName: String,
    nextRoundDate: String,
    progressPercent: Number,
  }],
  rejectedCompetitions: [{
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    date: String,
  }],
  interests: [{
    type: String,
    trim: true,
  }],
  interestSubCategories: [{
    type: String,
    trim: true,
  }],
  onboardingCompleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', UserSchema);

const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  initials: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Technical', 'Cultural', 'Sports', 'Literary', 'Social & Environment', 'Business & Entrepreneurship', 'Arts & Media'],
    default: 'Technical',
  },
  description: {
    type: String,
    required: true,
  },
  memberCount: {
    type: Number,
    default: 120,
  },
  followerCount: {
    type: Number,
    default: 350,
  },
  logoColor: {
    type: String,
    default: 'from-indigo-600 to-violet-600',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Club', ClubSchema);

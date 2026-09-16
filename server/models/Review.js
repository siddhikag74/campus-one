const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  ratings: {
    overall: { type: Number, required: true, min: 1, max: 5 },
    contentQuality: { type: Number, required: true, min: 1, max: 5 },
    presentation: { type: Number, required: true, min: 1, max: 5 },
    engagement: { type: Number, required: true, min: 1, max: 5 },
    // Backward compatibility aliases
    content: { type: Number, min: 1, max: 5 },
    organisation: { type: Number, min: 1, max: 5 },
    venue: { type: Number, min: 1, max: 5 },
  },
  averageRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  reviewText: {
    type: String,
    maxlength: 1000,
    trim: true,
    default: '',
  },
  comment: {
    type: String,
    maxlength: 1000,
    trim: true,
    default: '',
  },
  suggestions: {
    type: String,
    maxlength: 500,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

ReviewSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);


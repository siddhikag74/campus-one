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
    content: { type: Number, required: true, min: 1, max: 5 },
    organisation: { type: Number, required: true, min: 1, max: 5 },
    venue: { type: Number, required: true, min: 1, max: 5 },
    overall: { type: Number, required: true, min: 1, max: 5 },
  },
  comment: {
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

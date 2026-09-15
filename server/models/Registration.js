const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
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
  fullName: {
    type: String,
    required: true,
  },
  collegeEmail: {
    type: String,
    required: true,
  },
  rollNumber: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  teamName: {
    type: String,
    default: '',
  },
  teamMembers: [{
    type: String,
  }],
  status: {
    type: String,
    default: 'Confirmed',
  },
}, {
  timestamps: true,
});

RegistrationSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Registration', RegistrationSchema);

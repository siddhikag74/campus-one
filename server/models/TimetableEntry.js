const mongoose = require('mongoose');

const TimetableEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  courseCode: {
    type: String,
    required: true,
    trim: true,
  },
  faculty: {
    type: String,
    default: 'Faculty Instructor',
    trim: true,
  },
  venue: {
    type: String,
    required: true,
    trim: true,
  },
  dayOfWeek: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  startTime: {
    type: String,
    required: true, // e.g. "09:00 AM" or "09:00"
  },
  endTime: {
    type: String,
    required: true, // e.g. "10:00 AM" or "10:00"
  },
  type: {
    type: String,
    enum: ['Lecture', 'Lab', 'Tutorial', 'Seminar', 'Workshop'],
    default: 'Lecture',
  },
  status: {
    type: String,
    enum: ['scheduled', 'venue_changed', 'cancelled', 'postponed', 'time_changed', 'date_changed'],
    default: 'scheduled',
  },
  changeReason: {
    type: String,
    default: null,
  },
  originalVenue: {
    type: String,
    default: null,
  },
  originalStartTime: {
    type: String,
    default: null,
  },
  originalEndTime: {
    type: String,
    default: null,
  },
  originalDay: {
    type: String,
    default: null,
  },
  originalDate: {
    type: String,
    default: null,
  },
  currentDate: {
    type: String, // e.g. "2026-09-15"
    default: null,
  },
  colorTag: {
    type: String,
    default: 'indigo', // 'indigo', 'violet', 'amber', 'emerald', 'sky', 'rose'
  },
  attendanceRequired: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for high-performance student schedule queries
TimetableEntrySchema.index({ user: 1, dayOfWeek: 1, startTime: 1 });

module.exports = mongoose.model('TimetableEntry', TimetableEntrySchema);

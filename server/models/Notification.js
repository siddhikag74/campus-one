const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'new_event',
      'registration_confirmed',
      'reminder',
      'deadline',
      'deadline_extended',
      'shortlisted',
      'rejection',
      'announcement',
      'timetable_change',
      'class_cancelled',
      'class_postponed',
      'venue_changed',
      'class_time_changed',
      'class_date_changed'
    ],
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null,
  },
  timetableEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimetableEntry',
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  timeAgo: {
    type: String,
    default: 'Just now',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Notification', NotificationSchema);

const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Events', 'Competitions', 'Workshops', 'Others'],
  },
  status: {
    type: String,
    required: true,
    enum: ['new', 'upcoming', 'deadline-approaching', 'missed'],
    default: 'upcoming',
  },
  dateStr: {
    type: String,
    required: true, // e.g. "Sep 18, 2026"
  },
  isoDate: {
    type: String,
    required: true, // "2026-09-18" for calendar matching
  },
  time: {
    type: String,
    required: true, // e.g. "02:00 PM - 05:00 PM"
  },
  venue: {
    type: String,
    required: true,
  },
  deadline: {
    type: String,
    required: true, // e.g. "Sep 16, 2026, 11:59 PM"
  },
  isoDeadline: {
    type: String,
    required: true, // "2026-09-16"
  },
  teamSize: {
    type: String,
    default: 'Individual', // or "1 - 4 Members"
  },
  isTeamEvent: {
    type: Boolean,
    default: false,
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
  deadlineAlert: {
    isExtended: { type: Boolean, default: false },
    originalDeadline: String,
    newDeadline: String,
    message: String,
  },
  venueAlert: {
    isUpdated: { type: Boolean, default: false },
    originalVenue: String,
    newVenue: String,
    message: String,
  },
  about: {
    type: String,
    required: true,
  },
  eligibility: {
    type: String,
    default: 'Open to all enrolled undergraduate and postgraduate students from recognized colleges/universities. Valid College ID required.',
  },
  whatToExpect: [{
    type: String,
  }],
  importantInformation: {
    type: String,
    default: '',
  },
  isCompetition: {
    type: Boolean,
    default: false,
  },
  competitionRounds: [{
    roundNumber: Number,
    name: String,
    description: String,
    date: String,
    status: {
      type: String,
      enum: ['Completed', 'In Progress', 'Upcoming'],
      default: 'Upcoming',
    },
  }],
  hasMedia: {
    type: Boolean,
    default: false,
  },
  slidesTitle: {
    type: String,
    default: '',
  },
  qrCodeLabel: {
    type: String,
    default: '',
  },
  tags: [{
    type: String,
  }],
  popularityScore: {
    type: Number,
    default: 50,
  },
  organizerUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resources: [{
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['pdf', 'ppt', 'doc', 'image', 'video', 'drive', 'form', 'link', 'qr'],
      required: true,
      default: 'pdf',
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Event', EventSchema);


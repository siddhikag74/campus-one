const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Club = require('../models/Club');
const Registration = require('../models/Registration');
const SavedEvent = require('../models/SavedEvent');
const ImportantEvent = require('../models/ImportantEvent');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/auth');
const { sendWhatsAppNotification } = require('../integrations/meta/whatsapp');

// Helper to attach user-specific states to an array of events
const attachUserStates = async (events, userId) => {
  if (!userId || !events.length) {
    return events.map(e => ({
      ...e.toObject(),
      isSaved: false,
      isRegistered: false,
      isImportant: false,
    }));
  }

  const eventIds = events.map(e => e._id);
  const [saved, registered, important] = await Promise.all([
    SavedEvent.find({ user: userId, event: { $in: eventIds } }).select('event'),
    Registration.find({ user: userId, event: { $in: eventIds } }).select('event'),
    ImportantEvent.find({ user: userId, event: { $in: eventIds } }).select('event'),
  ]);

  const savedSet = new Set(saved.map(s => s.event.toString()));
  const registeredSet = new Set(registered.map(r => r.event.toString()));
  const importantSet = new Set(important.map(i => i.event.toString()));

  return events.map(e => {
    const obj = e.toObject();
    const id = e._id.toString();
    return {
      ...obj,
      isSaved: savedSet.has(id),
      isRegistered: registeredSet.has(id),
      isImportant: importantSet.has(id),
    };
  });
};

const INTEREST_KEYWORD_MAP = {
  tech: ['tech', 'coding', 'hackathon', 'web dev', 'ai', 'robotics', 'software', 'acm', 'dsc', 'cyber', 'developer', 'algorithm', 'cloud', 'iot', 'programming', 'codeblitz', 'github', 'git'],
  finance: ['finance', 'investment', 'trading', 'econtalk', 'case study', 'consulting', 'fintech', 'money', 'stock', 'economics', 'venture', 'product management', 'business'],
  dance: ['dance', 'choreography', 'western', 'bhangra', 'hip hop', 'rhythm', 'step', 'ballroom', 'nataraja', 'she vibes', 'showcase'],
  music: ['music', 'band', 'singing', 'concert', 'acoustic', 'vocals', 'instrumental', 'jam', 'taranum', 'sound', 'jamming', 'fest'],
  sports: ['sports', 'football', 'cricket', 'basketball', 'athletics', 'tournament', 'badminton', 'futsal', 'synergy', 'fitness', 'marathon', 'league'],
  creativity: ['creativity', 'art', 'design', 'media', 'content', 'writing', 'illustration', 'creative', 'visual', 'literary', 'tedx', 'ui/ux'],
  fashion: ['fashion', 'styling', 'runway', 'vogue', 'glam', 'apparel', 'modelling', 'couture', 'tarangana', 'she vibes'],
  photography: ['photography', 'photo', 'camera', 'videography', 'cinematography', 'lens', 'shutter', 'film', 'photowalk', 'exhibition'],
  architecture: ['architecture', 'urban', 'drafting', 'model making', 'planning', 'structure', 'cad', 'spatial', 'design'],
  gaming: ['gaming', 'esports', 'valorant', 'bgmi', 'fifa', 'lan', 'console', 'streamer', 'game', 'codeblitz', 'hackathon'],
};

// GET /api/events
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    const filter = {};

    const isStandardCategory = category && ['events', 'competitions', 'workshops', 'others'].includes(category.toLowerCase());
    const isInterestCategory = category && !isStandardCategory && category.toLowerCase() !== 'all';

    if (isStandardCategory) {
      filter.category = new RegExp('^' + category + '$', 'i');
    }

    if (status && status.toLowerCase() !== 'all') {
      filter.status = status.toLowerCase();
    }

    let query = Event.find(filter).populate('club');
    let events = await query.exec();

    // Filter by student interest keyword if interest-based category is requested
    if (isInterestCategory) {
      const interestKey = category.toLowerCase().trim();
      const keywords = INTEREST_KEYWORD_MAP[interestKey] || [interestKey];

      events = events.filter(e => {
        const textToSearch = [
          e.title || '',
          e.about || '',
          e.category || '',
          e.club?.name || '',
          ...(e.tags || []),
        ].join(' ').toLowerCase();

        return keywords.some(kw => textToSearch.includes(kw));
      });
    }

    // Client-side / regex search across event name, club name, venue, category, and tags
    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      events = events.filter(e => {
        const titleMatch = e.title?.toLowerCase().includes(term);
        const clubMatch = e.club?.name?.toLowerCase().includes(term);
        const venueMatch = e.venue?.toLowerCase().includes(term);
        const categoryMatch = e.category?.toLowerCase().includes(term);
        const tagMatch = (e.tags || []).some(t => t.toLowerCase().includes(term));
        return titleMatch || clubMatch || venueMatch || categoryMatch || tagMatch;
      });
    }

    const enhancedEvents = await attachUserStates(events, req.user?._id);
    return res.json({
      success: true,
      count: enhancedEvents.length,
      events: enhancedEvents,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/events/:id
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('club');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const userId = req.user?._id;
    const [saved, registered, important, reviews] = await Promise.all([
      userId ? SavedEvent.findOne({ user: userId, event: event._id }) : null,
      userId ? Registration.findOne({ user: userId, event: event._id }) : null,
      userId ? ImportantEvent.findOne({ user: userId, event: event._id }) : null,
      Review.find({ event: event._id }).populate('user', 'name rollNumber avatar').sort('-createdAt'),
    ]);

    const obj = event.toObject();
    obj.isSaved = !!saved;
    obj.isRegistered = !!registered;
    obj.isImportant = !!important;
    obj.reviews = reviews;
    obj.registrationDetails = registered || null;

    // Calculate rating averages if reviews exist
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + (r.ratings?.overall || 0), 0);
      obj.averageRating = Number((sum / reviews.length).toFixed(1));
      obj.reviewCount = reviews.length;
    } else {
      obj.averageRating = null;
      obj.reviewCount = 0;
    }

    return res.json({
      success: true,
      event: obj,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/events/:id/register
router.post('/:id/register', authMiddleware, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('club');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status === 'missed') {
      return res.status(400).json({ success: false, message: 'Registration is closed for this event.' });
    }

    const userId = req.user._id;

    // Duplicate check
    const existing = await Registration.findOne({ user: userId, event: event._id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already registered for this event.',
        registration: existing,
      });
    }

    const {
      fullName,
      collegeEmail,
      rollNumber,
      phoneNumber,
      year,
      branch,
      teamName,
      teamMembers,
    } = req.body;

    const studentRoll = rollNumber || req.user.rollNumber || 'N/A';

    if (!fullName || !collegeEmail || !phoneNumber || !year || !branch) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all required student identification fields (Name, Email, Phone, Year, Branch).',
      });
    }

    const registration = await Registration.create({
      user: userId,
      event: event._id,
      fullName,
      collegeEmail,
      rollNumber: studentRoll,
      phoneNumber,
      year,
      branch,
      teamName: teamName || '',
      teamMembers: Array.isArray(teamMembers) ? teamMembers : (teamMembers ? [teamMembers] : []),
    });

    // Create In-App Notification
    await Notification.create({
      user: userId,
      type: 'registration_confirmed',
      title: '✅ Registration Confirmed',
      body: `Your registration for ${event.title} is confirmed. Check your email & calendar for details.`,
      event: event._id,
      timeAgo: 'Just now',
    });

    // Trigger WhatsApp notification service (demo mock mode / production)
    await sendWhatsAppNotification(phoneNumber, 'registration_confirmed', {
      userName: fullName,
      eventName: event.title,
      clubName: event.club?.name || 'Campus Club',
      venue: event.venue,
      date: event.dateStr,
      time: event.time,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration Successful!',
      registration,
      event: {
        id: event._id,
        title: event.title,
        club: event.club?.name,
        date: event.dateStr,
        venue: event.venue,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/events/:id/save (Favorite)
router.post('/:id/save', authMiddleware, async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;

    await SavedEvent.findOneAndUpdate(
      { user: userId, event: eventId },
      { user: userId, event: eventId },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: 'Event added to favorites',
      isSaved: true,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/events/:id/save (Unfavorite)
router.delete('/:id/save', authMiddleware, async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;

    await SavedEvent.findOneAndDelete({ user: userId, event: eventId });

    return res.json({
      success: true,
      message: 'Event removed from favorites',
      isSaved: false,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/events/:id/important (Mark as Important)
router.post('/:id/important', authMiddleware, async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;

    await ImportantEvent.findOneAndUpdate(
      { user: userId, event: eventId },
      { user: userId, event: eventId },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: 'Event marked as Important',
      isImportant: true,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/events/:id/important (Unmark Important)
router.delete('/:id/important', authMiddleware, async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;

    await ImportantEvent.findOneAndDelete({ user: userId, event: eventId });

    return res.json({
      success: true,
      message: 'Event removed from Important',
      isImportant: false,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/events/:id/reviews
// Strictly permitted ONLY when event.status === 'missed'
router.post('/:id/reviews', authMiddleware, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status !== 'missed') {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be submitted for completed/missed events.',
      });
    }

    const userId = req.user._id;
    const existing = await Review.findOne({ user: userId, event: event._id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a review for this event.',
      });
    }

    const { ratings, comment } = req.body;

    if (
      !ratings ||
      !ratings.content ||
      !ratings.organisation ||
      !ratings.venue ||
      !ratings.overall
    ) {
      return res.status(400).json({
        success: false,
        message: 'All 4 ratings (Content, Organisation, Venue, Overall) are mandatory.',
      });
    }

    if (comment && comment.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Review comments cannot exceed 500 characters.',
      });
    }

    const review = await Review.create({
      user: userId,
      event: event._id,
      ratings: {
        content: Number(ratings.content),
        organisation: Number(ratings.organisation),
        venue: Number(ratings.venue),
        overall: Number(ratings.overall),
      },
      comment: (comment || '').trim(),
    });

    return res.status(201).json({
      success: true,
      message: 'Review Submitted!',
      review,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/events/:id/reviews
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const reviews = await Review.find({ event: req.params.id })
      .populate('user', 'name rollNumber avatar')
      .sort('-createdAt');

    return res.json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// ORGANIZER-ONLY ENDPOINTS (Strict RBAC)
// ==========================================

// POST /api/events
// Create a new event (Organizer ONLY)
router.post('/', authMiddleware, authorizeRoles('organizer', 'admin'), async (req, res, next) => {
  try {
    const {
      title,
      clubId,
      category,
      dateStr,
      isoDate,
      time,
      venue,
      deadline,
      isoDeadline,
      teamSize,
      isTeamEvent,
      about,
      eligibility,
      whatToExpect,
      tags,
    } = req.body;

    if (!title || !category || !venue || !dateStr || !time || !about) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: Title, Category, Venue, Date, Time, and About.',
      });
    }

    // Resolve or fallback to organizer's club or default
    let club = null;
    if (clubId) {
      club = await Club.findById(clubId);
    }
    if (!club) {
      club = await Club.findOne({ name: /IEEE|Computer/i }) || await Club.findOne({});
    }

    const newEvent = await Event.create({
      title: title.trim(),
      club: club._id,
      category: category || 'Events',
      status: 'upcoming',
      dateStr: dateStr.trim(),
      isoDate: isoDate || new Date().toISOString().split('T')[0],
      time: time.trim(),
      venue: venue.trim(),
      deadline: deadline || 'Day of Event',
      isoDeadline: isoDeadline || isoDate || new Date().toISOString().split('T')[0],
      teamSize: teamSize || (isTeamEvent ? '2 - 4 Members' : 'Individual'),
      isTeamEvent: !!isTeamEvent,
      about: about.trim(),
      eligibility: eligibility || 'Open to all enrolled university students with valid ID.',
      whatToExpect: Array.isArray(whatToExpect) ? whatToExpect : [whatToExpect || 'Hands-on practical session & networking'],
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : ['Tech', 'CampusOne']),
      organizerUser: req.user._id,
      resources: [],
    });

    return res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      event: newEvent,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/events/:id/resources
// Add / post post-event resources (PDFs, PPTs, Docs, Images, Videos, Drive links, Forms, QR codes)
// Strictly restricted to ORGANIZERS
router.post('/:id/resources', authMiddleware, authorizeRoles('organizer', 'admin'), async (req, res, next) => {
  try {
    const { title, type, url, description } = req.body;

    if (!title || !url) {
      return res.status(400).json({
        success: false,
        message: 'Resource title and link/URL are required.',
      });
    }

    const allowedTypes = ['pdf', 'ppt', 'doc', 'image', 'video', 'drive', 'form', 'link', 'qr'];
    const resourceType = type && allowedTypes.includes(type.toLowerCase()) ? type.toLowerCase() : 'pdf';

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const newResource = {
      title: title.trim(),
      type: resourceType,
      url: url.trim(),
      description: (description || '').trim(),
      uploadedAt: new Date(),
    };

    event.resources = event.resources || [];
    event.resources.push(newResource);
    event.hasMedia = true;
    await event.save();

    return res.status(201).json({
      success: true,
      message: `Resource '${title}' published successfully!`,
      resources: event.resources,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/events/:id/resources/:resourceId
// Delete a resource from an event (Organizer ONLY)
router.delete('/:id/resources/:resourceId', authMiddleware, authorizeRoles('organizer', 'admin'), async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    event.resources = (event.resources || []).filter(
      r => r._id.toString() !== req.params.resourceId
    );
    if (event.resources.length === 0) {
      event.hasMedia = false;
    }
    await event.save();

    return res.json({
      success: true,
      message: 'Resource deleted successfully.',
      resources: event.resources,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


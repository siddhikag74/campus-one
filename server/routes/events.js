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
const { authorizeRoles, optionalAuth } = require('../middleware/auth');
const { sendWhatsAppNotification } = require('../integrations/meta/whatsapp');

// Helper to calculate review stats, category averages, and rating breakdown
const calculateReviewStats = (reviews = [], currentUserId = null) => {
  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 0,
      reviewCount: 0,
      categoryAverages: {
        overall: 0,
        contentQuality: 0,
        presentation: 0,
        engagement: 0,
      },
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      userReview: null,
    };
  }

  let totalOverall = 0;
  let totalContent = 0;
  let totalPresentation = 0;
  let totalEngagement = 0;
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let userReview = null;

  reviews.forEach((r) => {
    const overall = Number(r.ratings?.overall) || 5;
    const content = Number(r.ratings?.contentQuality ?? r.ratings?.content) || overall;
    const presentation = Number(r.ratings?.presentation ?? r.ratings?.organisation) || overall;
    const engagement = Number(r.ratings?.engagement ?? r.ratings?.venue) || overall;

    totalOverall += overall;
    totalContent += content;
    totalPresentation += presentation;
    totalEngagement += engagement;

    const rounded = Math.max(1, Math.min(5, Math.round(overall)));
    breakdown[rounded] = (breakdown[rounded] || 0) + 1;

    if (
      currentUserId &&
      (r.user?._id?.toString() === currentUserId.toString() ||
        r.user?.toString() === currentUserId.toString())
    ) {
      userReview = r;
    }
  });

  const count = reviews.length;
  const averageRating = Number((totalOverall / count).toFixed(1));

  return {
    averageRating,
    reviewCount: count,
    categoryAverages: {
      overall: Number((totalOverall / count).toFixed(1)),
      contentQuality: Number((totalContent / count).toFixed(1)),
      presentation: Number((totalPresentation / count).toFixed(1)),
      engagement: Number((totalEngagement / count).toFixed(1)),
    },
    ratingBreakdown: breakdown,
    userReview,
  };
};

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
    obj.registrationDetails = registered || null;

    // Calculate rating averages and category breakdown
    const stats = calculateReviewStats(reviews, userId);
    obj.reviews = reviews;
    obj.reviewStats = stats;
    obj.averageRating = stats.averageRating > 0 ? stats.averageRating : null;
    obj.reviewCount = stats.reviewCount;
    obj.categoryAverages = stats.categoryAverages;
    obj.ratingBreakdown = stats.ratingBreakdown;
    obj.userReview = stats.userReview;

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
// Submit or update a review with 4 criteria ratings, review text, and suggestions
router.post('/:id/reviews', authMiddleware, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const userId = req.user._id;
    const { ratings, reviewText, comment, suggestions } = req.body;

    if (!ratings) {
      return res.status(400).json({
        success: false,
        message: 'Ratings are required for all 4 categories.',
      });
    }

    const overall = Number(ratings.overall);
    const contentQuality = Number(ratings.contentQuality ?? ratings.content);
    const presentation = Number(ratings.presentation ?? ratings.organisation);
    const engagement = Number(ratings.engagement ?? ratings.venue);

    if (
      !overall || overall < 1 || overall > 5 ||
      !contentQuality || contentQuality < 1 || contentQuality > 5 ||
      !presentation || presentation < 1 || presentation > 5 ||
      !engagement || engagement < 1 || engagement > 5
    ) {
      return res.status(400).json({
        success: false,
        message: 'All 4 ratings (Overall Experience, Content & Quality, Presentation & Organization, Engagement & Usefulness) must be between 1 and 5 stars.',
      });
    }

    const text = (reviewText ?? comment ?? '').trim();
    const sugg = (suggestions ?? '').trim();

    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Review text cannot exceed 1000 characters.',
      });
    }

    if (sugg.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Suggestions cannot exceed 500 characters.',
      });
    }

    const avgRating = Number(((overall + contentQuality + presentation + engagement) / 4).toFixed(1));

    // Check for existing review to update or prevent duplicate
    let review = await Review.findOne({ user: userId, event: event._id });
    let isUpdate = false;

    if (review) {
      isUpdate = true;
      review.ratings = {
        overall,
        contentQuality,
        presentation,
        engagement,
        content: contentQuality,
        organisation: presentation,
        venue: engagement,
      };
      review.averageRating = avgRating;
      review.reviewText = text;
      review.comment = text;
      review.suggestions = sugg;
      await review.save();
    } else {
      review = await Review.create({
        user: userId,
        event: event._id,
        ratings: {
          overall,
          contentQuality,
          presentation,
          engagement,
          content: contentQuality,
          organisation: presentation,
          venue: engagement,
        },
        averageRating: avgRating,
        reviewText: text,
        comment: text,
        suggestions: sugg,
      });
    }

    await review.populate('user', 'name rollNumber avatar role');

    // Fetch updated stats
    const allReviews = await Review.find({ event: event._id }).populate('user', 'name rollNumber avatar role');
    const stats = calculateReviewStats(allReviews, userId);

    return res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? 'Review updated successfully! ⭐' : 'Review submitted successfully! ⭐',
      isUpdate,
      review,
      stats,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/events/:id/reviews
// Retrieve all reviews, stats breakdown, and current user's review
router.get('/:id/reviews', optionalAuth, async (req, res, next) => {
  try {
    const reviews = await Review.find({ event: req.params.id })
      .populate('user', 'name rollNumber avatar role')
      .sort('-createdAt');

    const stats = calculateReviewStats(reviews, req.user?._id);

    return res.json({
      success: true,
      count: reviews.length,
      reviews,
      stats,
      userReview: stats.userReview,
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


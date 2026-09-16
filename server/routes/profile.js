const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Registration = require('../models/Registration');
const SavedEvent = require('../models/SavedEvent');
const ImportantEvent = require('../models/ImportantEvent');
const authMiddleware = require('../middleware/auth');

// GET /api/profile
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate('followedClubs');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 1. Registered Events
    const registrations = await Registration.find({ user: userId })
      .populate({
        path: 'event',
        populate: { path: 'club' },
      })
      .sort({ createdAt: -1 });

    const registeredEvents = registrations
      .filter(r => r.event)
      .map(r => ({
        registrationId: r._id,
        registeredAt: r.createdAt,
        teamName: r.teamName,
        event: {
          ...r.event.toObject(),
          isRegistered: true,
        },
      }));

    const registeredIds = new Set(registeredEvents.map(r => r.event._id.toString()));

    // 2. Saved Events
    const saved = await SavedEvent.find({ user: userId })
      .populate({
        path: 'event',
        populate: { path: 'club' },
      })
      .sort({ createdAt: -1 });

    const savedEvents = saved
      .filter(s => s.event)
      .map(s => ({
        ...s.event.toObject(),
        isSaved: true,
        isRegistered: registeredIds.has(s.event._id.toString()),
      }));

    // 3. Pending Events (Events marked Important, but NOT yet registered)
    const important = await ImportantEvent.find({ user: userId })
      .populate({
        path: 'event',
        populate: { path: 'club' },
      })
      .sort({ createdAt: -1 });

    const pendingEvents = important
      .filter(i => i.event && !registeredIds.has(i.event._id.toString()))
      .map(i => ({
        ...i.event.toObject(),
        isImportant: true,
        isSaved: savedEvents.some(s => s._id.toString() === i.event._id.toString()),
      }));

    // 4. Shortlisted Competitions
    const shortlisted = user.shortlistedCompetitions || [];

    // 5. Rejected Competitions
    const rejected = user.rejectedCompetitions || [];

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        year: user.year,
        branch: user.branch,
        college: user.college,
        phone: user.phone,
        avatar: user.avatar,
        interests: user.interests || [],
        interestSubCategories: user.interestSubCategories || [],
        onboardingCompleted: !!user.onboardingCompleted,
        followedClubsCount: (user.followedClubs || []).length,
      },
      stats: {
        registeredCount: registeredEvents.length,
        savedCount: savedEvents.length,
        shortlistedCount: shortlisted.length,
      },
      tabs: {
        registered: registeredEvents,
        pending: pendingEvents,
        shortlisted,
        rejected,
        saved: savedEvents,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/profile/interests
// Fetch currently authenticated user's saved interests
router.get('/interests', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('interests interestSubCategories onboardingCompleted');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      interests: user.interests || [],
      interestSubCategories: user.interestSubCategories || [],
      onboardingCompleted: !!user.onboardingCompleted,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/profile/interests (and PUT /api/profile/interests)
// Update currently authenticated user's saved interests & subcategories
const handleUpdateInterests = async (req, res, next) => {
  try {
    const { interests, interestSubCategories } = req.body;

    if (!interests || !Array.isArray(interests)) {
      return res.status(400).json({
        success: false,
        message: 'Interests must be an array of selected categories.',
      });
    }

    const cleanedInterests = interests.map(i => String(i).trim()).filter(Boolean);
    const cleanedSubCategories = Array.isArray(interestSubCategories)
      ? interestSubCategories.map(s => String(s).trim()).filter(Boolean)
      : [];

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          interests: cleanedInterests,
          interestSubCategories: cleanedSubCategories,
          onboardingCompleted: true,
        },
      },
      { new: true }
    ).select('-password');

    return res.json({
      success: true,
      message: 'Your interests have been updated.',
      user: updatedUser,
      interests: updatedUser.interests || [],
      interestSubCategories: updatedUser.interestSubCategories || [],
    });
  } catch (error) {
    next(error);
  }
};

router.patch('/interests', authMiddleware, handleUpdateInterests);
router.put('/interests', authMiddleware, handleUpdateInterests);

// PUT /api/profile
router.put('/', authMiddleware, async (req, res, next) => {
  try {
    const { name, phone, branch, year, interests, interestSubCategories } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (phone) updates.phone = phone.trim();
    if (branch) updates.branch = branch.trim();
    if (year) updates.year = year.trim();
    if (interests && Array.isArray(interests)) {
      updates.interests = interests.map(i => String(i).trim()).filter(Boolean);
    }
    if (interestSubCategories && Array.isArray(interestSubCategories)) {
      updates.interestSubCategories = interestSubCategories.map(s => String(s).trim()).filter(Boolean);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select('-password');

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


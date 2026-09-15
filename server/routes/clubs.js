const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const Event = require('../models/Event');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/clubs
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const clubs = await Club.find().sort({ memberCount: -1 });
    const user = req.user ? await User.findById(req.user._id) : null;
    const followedSet = new Set((user?.followedClubs || []).map(id => id.toString()));

    // Get upcoming event count for each club
    const clubSummaries = await Promise.all(
      clubs.map(async (club) => {
        const upcomingEventCount = await Event.countDocuments({
          club: club._id,
          status: { $in: ['new', 'upcoming', 'deadline-approaching'] },
        });

        return {
          ...club.toObject(),
          upcomingEventCount,
          isFollowed: followedSet.has(club._id.toString()),
        };
      })
    );

    return res.json({
      success: true,
      count: clubSummaries.length,
      clubs: clubSummaries,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/clubs/:id
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    const [upcomingEvents, pastEvents] = await Promise.all([
      Event.find({
        club: club._id,
        status: { $in: ['new', 'upcoming', 'deadline-approaching'] },
      }).populate('club').sort({ isoDate: 1 }),
      Event.find({
        club: club._id,
        status: 'missed',
      }).populate('club').sort({ isoDate: -1 }),
    ]);

    const user = req.user ? await User.findById(req.user._id) : null;
    const isFollowed = (user?.followedClubs || []).some(
      id => id.toString() === club._id.toString()
    );

    return res.json({
      success: true,
      club: {
        ...club.toObject(),
        isFollowed,
        upcomingEvents,
        pastEvents,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/clubs/:id/follow
router.post('/:id/follow', authMiddleware, async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    const userId = req.user._id;
    await User.findByIdAndUpdate(userId, {
      $addToSet: { followedClubs: club._id },
    });

    const updatedClub = await Club.findByIdAndUpdate(
      club._id,
      { $inc: { followerCount: 1 } },
      { new: true }
    );

    return res.json({
      success: true,
      message: `Now following ${club.name}`,
      isFollowed: true,
      followerCount: updatedClub.followerCount,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/clubs/:id/follow
router.delete('/:id/follow', authMiddleware, async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    const userId = req.user._id;
    await User.findByIdAndUpdate(userId, {
      $pull: { followedClubs: club._id },
    });

    const updatedClub = await Club.findByIdAndUpdate(
      club._id,
      { $inc: { followerCount: -1 } },
      { new: true }
    );

    return res.json({
      success: true,
      message: `Unfollowed ${club.name}`,
      isFollowed: false,
      followerCount: Math.max(0, updatedClub.followerCount),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

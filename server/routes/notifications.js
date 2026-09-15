const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');

// GET /api/notifications
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ user: userId })
      .populate('event', 'title category venue dateStr status')
      .sort({ createdAt: -1 });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Separate into "new" (unread or within last 24 hours) and "earlier"
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newNotifications = notifications.filter(n => !n.isRead || new Date(n.createdAt) > oneDayAgo);
    const earlierNotifications = notifications.filter(n => n.isRead && new Date(n.createdAt) <= oneDayAgo);

    return res.json({
      success: true,
      unreadCount,
      totalCount: notifications.length,
      all: notifications,
      new: newNotifications,
      earlier: earlierNotifications,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authMiddleware, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    ).populate('event');

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    return res.json({
      success: true,
      notification,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', authMiddleware, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    return res.json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

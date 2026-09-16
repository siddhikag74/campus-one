const express = require('express');
const router = express.Router();
const TimetableEntry = require('../models/TimetableEntry');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/auth');

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to convert time string (e.g. "09:00 AM", "02:30 PM", "14:00") to total minutes from 00:00 (0..1439)
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const str = timeStr.trim().toUpperCase();
  const isPM = str.includes('PM');
  const isAM = str.includes('AM');
  const cleanStr = str.replace(/AM|PM/g, '').trim();
  const parts = cleanStr.split(':');
  if (parts.length < 2) return null;
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return null;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

// Helper to check if two time slots overlap on the same day: [start1, end1) vs [start2, end2)
const doTimeSlotsOverlap = (start1Str, end1Str, start2Str, end2Str) => {
  const s1 = parseTimeToMinutes(start1Str);
  let e1 = parseTimeToMinutes(end1Str);
  const s2 = parseTimeToMinutes(start2Str);
  let e2 = parseTimeToMinutes(end2Str);

  if (s1 === null || e1 === null || s2 === null || e2 === null) return false;
  if (e1 <= s1) e1 += 60; // fallback if end <= start (default 1 hr duration)
  if (e2 <= s2) e2 += 60;

  return Math.max(s1, s2) < Math.min(e1, e2);
};

// Helper to calculate current academic week metadata
const getWeekMetadata = (weekOffset = 0) => {
  const baseDate = new Date(2026, 8, 15); // Tuesday, Sep 15, 2026 (DTU Fall Semester)
  baseDate.setDate(baseDate.getDate() + (weekOffset * 7));

  // Find Monday of that week
  const day = baseDate.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + diffToMonday);

  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekRange = `${monthNames[monday.getMonth()]} ${monday.getDate()} – ${monthNames[saturday.getMonth()]} ${saturday.getDate()}, 2026`;
  const weekNum = 6 + weekOffset;

  return {
    weekNumber: weekNum,
    academicWeek: `Academic Week ${weekNum}`,
    semester: 'Fall Semester 2026',
    weekRange,
    isCurrentWeek: weekOffset === 0,
    currentDay: DAYS_ORDER[new Date().getDay() === 0 ? 0 : new Date().getDay() - 1] || 'Tuesday',
  };
};

// Default canonical timetable schedule (15 unique classes across Mon-Sat, zero time clashes)
const CANONICAL_SCHEDULE = [
  // MONDAY (3 non-overlapping classes)
  {
    subject: 'Data Structures & Algorithms',
    courseCode: 'CS201',
    faculty: 'Dr. Sharma',
    venue: 'Room B-204',
    dayOfWeek: 'Monday',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    type: 'Lecture',
    status: 'scheduled',
    colorTag: 'indigo',
  },
  {
    subject: 'Database Management Systems',
    courseCode: 'CS305',
    faculty: 'Dr. Mehta',
    venue: 'Lab 2',
    dayOfWeek: 'Monday',
    startTime: '11:00 AM',
    endTime: '12:00 PM',
    type: 'Lab',
    status: 'venue_changed',
    originalVenue: 'Room A-101',
    changeReason: 'Relocated to Lab 2 for high-memory server configuration practicals.',
    colorTag: 'amber',
  },
  {
    subject: 'Computer Networks Lab',
    courseCode: 'CS401',
    faculty: 'Prof. Kapoor',
    venue: 'Network Lab 1',
    dayOfWeek: 'Monday',
    startTime: '02:00 PM',
    endTime: '03:30 PM',
    type: 'Lab',
    status: 'scheduled',
    colorTag: 'violet',
  },

  // TUESDAY (3 non-overlapping classes)
  {
    subject: 'Operating Systems',
    courseCode: 'CS301',
    faculty: 'Dr. Verma',
    venue: 'Room C-102',
    dayOfWeek: 'Tuesday',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    type: 'Lecture',
    status: 'cancelled',
    changeReason: 'Faculty attending National Research Symposium on Kernel Architectures.',
    colorTag: 'rose',
  },
  {
    subject: 'Software Engineering & Agile',
    courseCode: 'CS309',
    faculty: 'Prof. Iyer',
    venue: 'Room B-204',
    dayOfWeek: 'Tuesday',
    startTime: '01:00 PM',
    endTime: '02:00 PM',
    type: 'Lecture',
    status: 'scheduled',
    colorTag: 'emerald',
  },
  {
    subject: 'Discrete Mathematics',
    courseCode: 'MA201',
    faculty: 'Dr. Gupta',
    venue: 'Seminar Hall A',
    dayOfWeek: 'Tuesday',
    startTime: '03:00 PM',
    endTime: '04:00 PM',
    type: 'Lecture',
    status: 'scheduled',
    colorTag: 'sky',
  },

  // WEDNESDAY (3 non-overlapping classes)
  {
    subject: 'Theory of Computation',
    courseCode: 'CS303',
    faculty: 'Dr. Reddy',
    venue: 'Room B-204',
    dayOfWeek: 'Wednesday',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    type: 'Lecture',
    status: 'scheduled',
    colorTag: 'indigo',
  },
  {
    subject: 'Web Technologies & Cloud UI',
    courseCode: 'CS307',
    faculty: 'Prof. Roy',
    venue: 'Room C-104',
    dayOfWeek: 'Wednesday',
    startTime: '11:15 AM',
    endTime: '12:15 PM',
    type: 'Lecture',
    status: 'scheduled',
    colorTag: 'emerald',
  },
  {
    subject: 'Computer Networks',
    courseCode: 'CS401',
    faculty: 'Prof. Kapoor',
    venue: 'Room B-301',
    dayOfWeek: 'Wednesday',
    startTime: '02:00 PM',
    endTime: '03:00 PM',
    type: 'Lecture',
    status: 'postponed',
    originalDay: 'Wednesday',
    originalStartTime: '02:00 PM',
    originalEndTime: '03:00 PM',
    changeReason: 'Postponed to Thursday at 02:00 PM due to departmental NAAC audit meeting.',
    colorTag: 'violet',
  },

  // THURSDAY (2 non-overlapping classes - duplicate rescheduled placeholder removed)
  {
    subject: 'Design & Analysis of Algorithms',
    courseCode: 'CS302',
    faculty: 'Dr. Sharma',
    venue: 'Room B-204',
    dayOfWeek: 'Thursday',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    type: 'Lecture',
    status: 'scheduled',
    colorTag: 'indigo',
  },
  {
    subject: 'Artificial Intelligence & Neural Nets',
    courseCode: 'CS405',
    faculty: 'Dr. Swaminathan',
    venue: 'Room A-204',
    dayOfWeek: 'Thursday',
    startTime: '12:00 PM',
    endTime: '01:00 PM',
    type: 'Lecture',
    status: 'time_changed',
    originalStartTime: '10:00 AM',
    originalEndTime: '11:00 AM',
    changeReason: 'Class time rescheduled to 12:00 PM for joint session with M.Tech AI cohort.',
    colorTag: 'sky',
  },

  // FRIDAY (3 non-overlapping classes)
  {
    subject: 'Cloud Computing & DevOps',
    courseCode: 'CS412',
    faculty: 'Dr. Chopra',
    venue: 'Lab 3',
    dayOfWeek: 'Friday',
    startTime: '09:00 AM',
    endTime: '10:30 AM',
    type: 'Lab',
    status: 'scheduled',
    colorTag: 'emerald',
  },
  {
    subject: 'Object Oriented Software Design',
    courseCode: 'CS204',
    faculty: 'Prof. Saxena',
    venue: 'Room B-204',
    dayOfWeek: 'Friday',
    startTime: '11:00 AM',
    endTime: '12:00 PM',
    type: 'Lecture',
    status: 'scheduled',
    colorTag: 'indigo',
  },
  {
    subject: 'AI Capstone Project Colloquium',
    courseCode: 'CS499',
    faculty: 'Dr. Swaminathan',
    venue: 'Innovation Hub',
    dayOfWeek: 'Friday',
    startTime: '02:30 PM',
    endTime: '04:00 PM',
    type: 'Seminar',
    status: 'scheduled',
    colorTag: 'violet',
  },

  // SATURDAY (1 non-overlapping class)
  {
    subject: 'Competitive Programming Masterclass',
    courseCode: 'CP101',
    faculty: 'Dr. Sharma',
    venue: 'Lab 2',
    dayOfWeek: 'Saturday',
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    type: 'Workshop',
    status: 'scheduled',
    colorTag: 'amber',
  },
];

// Seed default timetable entries for a user and clean up any duplicate entries
const ensureUserTimetable = async (userId) => {
  const existingEntries = await TimetableEntry.find({ user: userId });

  // Clean up any legacy duplicate entries (e.g. "[Rescheduled]" duplicates)
  await TimetableEntry.deleteMany({
    user: userId,
    subject: /\[Rescheduled\]/i,
  });

  if (existingEntries.length === 0) {
    const defaultSchedule = CANONICAL_SCHEDULE.map(item => ({
      ...item,
      user: userId,
    }));
    await TimetableEntry.insertMany(defaultSchedule);
    return;
  }

  // De-duplicate any existing multiple entries with identical (courseCode + dayOfWeek + startTime)
  const seenKeys = new Set();
  const idsToDelete = [];

  for (const entry of existingEntries) {
    const key = `${entry.courseCode}_${entry.dayOfWeek}_${entry.startTime}`;
    if (seenKeys.has(key)) {
      idsToDelete.push(entry._id);
    } else {
      seenKeys.add(key);
    }
  }

  if (idsToDelete.length > 0) {
    await TimetableEntry.deleteMany({ _id: { $in: idsToDelete } });
  }
};


// GET /api/timetable
// Retrieve student timetable with optional day or status filter
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user._id;
    await ensureUserTimetable(userId);

    const query = { user: userId };
    if (req.query.day) {
      query.dayOfWeek = req.query.day;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }

    const entries = await TimetableEntry.find(query).sort({ dayOfWeek: 1, startTime: 1 });

    return res.json({
      success: true,
      count: entries.length,
      entries,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/timetable/today
// Get today's classes sorted chronologically
router.get('/today', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user._id;
    await ensureUserTimetable(userId);

    const dayParam = req.query.day;
    let targetDay = dayParam;

    if (!targetDay) {
      // Default to today's real day or Tuesday if Sunday/other
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayIndex = new Date().getDay();
      targetDay = days[todayIndex];
      if (targetDay === 'Sunday') targetDay = 'Monday';
    }

    const todayClasses = await TimetableEntry.find({
      user: userId,
      dayOfWeek: targetDay,
    }).sort({ startTime: 1 });

    return res.json({
      success: true,
      day: targetDay,
      count: todayClasses.length,
      classes: todayClasses,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/timetable/week
// Full weekly timetable grouped by day Monday-Saturday
router.get('/week', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user._id;
    await ensureUserTimetable(userId);

    const weekOffset = parseInt(req.query.weekOffset, 10) || 0;
    const metadata = getWeekMetadata(weekOffset);

    const entries = await TimetableEntry.find({ user: userId }).sort({ startTime: 1 });

    // Group by Day
    const days = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
    };

    let scheduledCount = 0;
    let venueChangedCount = 0;
    let cancelledCount = 0;
    let postponedCount = 0;
    let timeChangedCount = 0;

    entries.forEach((item) => {
      if (days[item.dayOfWeek]) {
        days[item.dayOfWeek].push(item);
      }

      if (item.status === 'scheduled') scheduledCount++;
      else if (item.status === 'venue_changed') venueChangedCount++;
      else if (item.status === 'cancelled') cancelledCount++;
      else if (item.status === 'postponed') postponedCount++;
      else if (item.status === 'time_changed' || item.status === 'date_changed') timeChangedCount++;
    });

    return res.json({
      success: true,
      metadata,
      days,
      stats: {
        totalClasses: entries.length,
        scheduled: scheduledCount,
        venueChanged: venueChangedCount,
        cancelled: cancelledCount,
        postponed: postponedCount,
        timeChanged: timeChangedCount,
        totalModifications: venueChangedCount + cancelledCount + postponedCount + timeChangedCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/timetable/changes
// Get recent schedule changes and modification logs
router.get('/changes', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user._id;
    await ensureUserTimetable(userId);

    const changedEntries = await TimetableEntry.find({
      user: userId,
      status: { $ne: 'scheduled' },
    }).sort({ updatedAt: -1 });

    return res.json({
      success: true,
      count: changedEntries.length,
      changes: changedEntries,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/timetable/:id
// Single timetable entry details
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const entry = await TimetableEntry.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found' });
    }

    return res.json({ success: true, entry });
  } catch (error) {
    next(error);
  }
});

// POST /api/timetable
// Create a new timetable entry with strict conflict & duplicate validation (Professor/Admin only)
router.post('/', authMiddleware, authorizeRoles('professor', 'admin'), async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { subject, courseCode, faculty, venue, dayOfWeek, startTime, endTime, type, colorTag } = req.body;

    if (!subject || !courseCode || !venue || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: Subject, Course Code, Venue, Day, Start Time, End Time.',
      });
    }

    // 1. Check for duplicate class (same course code on same day and start time)
    const existingDuplicate = await TimetableEntry.findOne({
      user: userId,
      courseCode: courseCode.trim().toUpperCase(),
      dayOfWeek,
      startTime: startTime.trim(),
    });

    if (existingDuplicate) {
      return res.status(409).json({
        success: false,
        message: `Duplicate class: '${subject}' (${courseCode}) is already scheduled on ${dayOfWeek} at ${startTime}.`,
      });
    }

    // 2. Check for time slot clash on the same day
    const sameDayClasses = await TimetableEntry.find({
      user: userId,
      dayOfWeek,
      status: { $ne: 'cancelled' },
    });

    for (const existingClass of sameDayClasses) {
      if (doTimeSlotsOverlap(startTime, endTime, existingClass.startTime, existingClass.endTime)) {
        return res.status(400).json({
          success: false,
          message: `Time clash: '${existingClass.subject}' (${existingClass.courseCode}) is already scheduled on ${dayOfWeek} from ${existingClass.startTime} to ${existingClass.endTime}. Two classes cannot occupy the same time slot.`,
          conflictingClass: {
            subject: existingClass.subject,
            courseCode: existingClass.courseCode,
            dayOfWeek,
            startTime: existingClass.startTime,
            endTime: existingClass.endTime,
          },
        });
      }
    }

    const newEntry = await TimetableEntry.create({
      user: userId,
      subject: subject.trim(),
      courseCode: courseCode.trim().toUpperCase(),
      faculty: faculty || req.user.name || 'Faculty Instructor',
      venue: venue.trim(),
      dayOfWeek,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      type: type || 'Lecture',
      colorTag: colorTag || 'indigo',
      status: 'scheduled',
    });

    return res.status(201).json({
      success: true,
      message: 'Class added to timetable successfully without conflicts.',
      entry: newEntry,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/timetable/:id/change
// Strictly restricted to PROFESSORS and ADMINS
// Applies Cancel, Postpone, Reschedule, Venue Change, and validates against time clashes
router.patch('/:id/change', authMiddleware, authorizeRoles('professor', 'admin'), async (req, res, next) => {
  try {
    const userId = req.user._id;
    // Allow professor to modify their own entry or any matching course entry
    let entry = await TimetableEntry.findOne({ _id: req.params.id, user: userId });
    if (!entry) {
      entry = await TimetableEntry.findById(req.params.id);
    }

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found' });
    }

    const { action, newVenue, newStartTime, newEndTime, newDay, reason } = req.body;

    // VALIDATION: Prevent time slot clashes if shifting time or postponing to another day/time
    if (action === 'postpone' || action === 'time_change') {
      const targetDay = (action === 'postpone' ? newDay : null) || entry.dayOfWeek;
      const targetStartTime = newStartTime || entry.startTime;
      const targetEndTime = newEndTime || entry.endTime;

      // Find all active (non-cancelled) classes on the target day for this user
      const sameDayClasses = await TimetableEntry.find({
        user: userId,
        dayOfWeek: targetDay,
        _id: { $ne: entry._id },
        status: { $ne: 'cancelled' },
      });

      for (const existingClass of sameDayClasses) {
        if (doTimeSlotsOverlap(targetStartTime, targetEndTime, existingClass.startTime, existingClass.endTime)) {
          return res.status(400).json({
            success: false,
            message: `Time slot conflict: '${existingClass.subject}' (${existingClass.courseCode}) is already scheduled on ${targetDay} from ${existingClass.startTime} to ${existingClass.endTime}. Cannot reschedule into an occupied time slot.`,
            conflictingClass: {
              subject: existingClass.subject,
              courseCode: existingClass.courseCode,
              dayOfWeek: targetDay,
              startTime: existingClass.startTime,
              endTime: existingClass.endTime,
            },
          });
        }
      }
    }

    let notificationType = 'timetable_change';
    let notificationTitle = 'Timetable Update';
    let notificationBody = '';

    if (action === 'venue_change') {
      entry.originalVenue = entry.originalVenue || entry.venue;
      entry.venue = newVenue || 'Seminar Hall B';
      entry.status = 'venue_changed';
      entry.changeReason = reason || `Relocated from ${entry.originalVenue} to ${entry.venue}.`;

      notificationType = 'venue_changed';
      notificationTitle = 'Classroom Moved 📍';
      notificationBody = `Prof. ${req.user.name}: Your ${entry.subject} class has moved from ${entry.originalVenue} to ${entry.venue}.`;
    } else if (action === 'cancel') {
      entry.status = 'cancelled';
      entry.changeReason = reason || 'Class cancelled due to departmental faculty symposium.';

      notificationType = 'class_cancelled';
      notificationTitle = 'Class Cancelled ❌';
      notificationBody = `Prof. ${req.user.name}: Your ${entry.subject} (${entry.courseCode}) class at ${entry.startTime} on ${entry.dayOfWeek} has been cancelled.`;
    } else if (action === 'postpone') {
      entry.originalDay = entry.originalDay || entry.dayOfWeek;
      entry.originalStartTime = entry.originalStartTime || entry.startTime;
      entry.originalEndTime = entry.originalEndTime || entry.endTime;
      entry.dayOfWeek = newDay || 'Thursday';
      entry.startTime = newStartTime || entry.startTime;
      entry.endTime = newEndTime || entry.endTime;
      entry.status = 'postponed';
      entry.changeReason = reason || `Postponed to ${entry.dayOfWeek} at ${entry.startTime}.`;

      notificationType = 'class_postponed';
      notificationTitle = 'Class Postponed ⏳';
      notificationBody = `Prof. ${req.user.name}: Your ${entry.subject} class has been postponed to ${entry.dayOfWeek} at ${entry.startTime}.`;
    } else if (action === 'time_change') {
      entry.originalStartTime = entry.originalStartTime || entry.startTime;
      entry.originalEndTime = entry.originalEndTime || entry.endTime;
      entry.startTime = newStartTime || '12:00 PM';
      entry.endTime = newEndTime || '01:00 PM';
      entry.status = 'time_changed';
      entry.changeReason = reason || `Time shifted from ${entry.originalStartTime} to ${entry.startTime}.`;

      notificationType = 'class_time_changed';
      notificationTitle = 'Class Time Changed ⏰';
      notificationBody = `Prof. ${req.user.name}: Your ${entry.subject} class time has changed from ${entry.originalStartTime} to ${entry.startTime}.`;
    } else if (action === 'reset') {
      entry.status = 'scheduled';
      if (entry.originalVenue) {
        entry.venue = entry.originalVenue;
        entry.originalVenue = null;
      }
      if (entry.originalDay) {
        entry.dayOfWeek = entry.originalDay;
        entry.originalDay = null;
      }
      if (entry.originalStartTime) {
        entry.startTime = entry.originalStartTime;
        entry.originalStartTime = null;
      }
      if (entry.originalEndTime) {
        entry.endTime = entry.originalEndTime;
        entry.originalEndTime = null;
      }
      entry.changeReason = null;

      notificationType = 'timetable_change';
      notificationTitle = 'Schedule Restored 🔄';
      notificationBody = `Prof. ${req.user.name}: Your ${entry.subject} class has been restored to regular schedule (${entry.startTime}, ${entry.venue}).`;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid schedule change action' });
    }

    await entry.save();


    // Propagate same change to other student timetable entries of the same courseCode
    const affectedEntries = await TimetableEntry.find({ courseCode: entry.courseCode });
    await TimetableEntry.updateMany(
      { courseCode: entry.courseCode, _id: { $ne: entry._id } },
      {
        $set: {
          status: entry.status,
          venue: entry.venue,
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
          changeReason: entry.changeReason,
          originalVenue: entry.originalVenue,
          originalStartTime: entry.originalStartTime,
          originalEndTime: entry.originalEndTime,
          originalDay: entry.originalDay,
        }
      }
    );

    // Collect all affected student user IDs and professor
    const targetUserIds = new Set();
    targetUserIds.add(userId.toString());
    affectedEntries.forEach(ae => {
      if (ae.user) targetUserIds.add(ae.user.toString());
    });

    const notificationsToInsert = Array.from(targetUserIds).map(uid => ({
      user: uid,
      type: notificationType,
      title: notificationTitle,
      body: notificationBody,
      timetableEntry: entry._id,
      isRead: false,
      timeAgo: 'Just now',
    }));

    const insertedNotifications = await Notification.insertMany(notificationsToInsert);
    const notification = insertedNotifications[0];


    return res.json({
      success: true,
      message: `Schedule update applied: ${notificationTitle}`,
      entry,
      notification,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/timetable/reset-demo
// Reset current user's timetable back to default seeded scenario
router.post('/reset-demo', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user._id;
    await TimetableEntry.deleteMany({ user: userId });
    await ensureUserTimetable(userId);

    return res.json({
      success: true,
      message: 'Timetable reset to demo state with schedule changes.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


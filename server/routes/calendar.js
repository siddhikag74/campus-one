const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const authMiddleware = require('../middleware/auth');

// GET /api/calendar
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || 2026;
    const month = parseInt(req.query.month, 10) || 9; // 9 = September

    // Query events with dates formatted as YYYY-MM
    const monthStr = month < 10 ? `0${month}` : `${month}`;
    const prefix = `${year}-${monthStr}`;

    const events = await Event.find({
      $or: [
        { isoDate: new RegExp(`^${prefix}`) },
        { isoDeadline: new RegExp(`^${prefix}`) }
      ]
    }).populate('club');

    const userId = req.user?._id;
    const registrations = userId
      ? await Registration.find({ user: userId }).select('event')
      : [];
    const registeredSet = new Set(registrations.map(r => r.event.toString()));

    // Build map of date -> dot types & events list
    const calendarDays = {};

    events.forEach(event => {
      const eventDate = event.isoDate;
      const deadlineDate = event.isoDeadline;
      const isRegistered = registeredSet.has(event._id.toString());

      // Classify Event Date
      if (eventDate && eventDate.startsWith(prefix)) {
        if (!calendarDays[eventDate]) {
          calendarDays[eventDate] = { dots: new Set(), events: [] };
        }
        
        let dotColor = 'indigo';
        if (isRegistered) {
          dotColor = 'green';
        }
        calendarDays[eventDate].dots.add(dotColor);

        calendarDays[eventDate].events.push({
          id: event._id,
          title: event.title,
          club: event.club?.name,
          clubInitials: event.club?.initials,
          time: event.time,
          venue: event.venue,
          category: event.category,
          status: event.status,
          isRegistered,
          isDeadline: false,
          dotColor,
        });
      }

      // Classify Deadline Date
      if (deadlineDate && deadlineDate.startsWith(prefix) && event.status !== 'missed') {
        if (!calendarDays[deadlineDate]) {
          calendarDays[deadlineDate] = { dots: new Set(), events: [] };
        }
        calendarDays[deadlineDate].dots.add('red');

        // Check if not already in that day's list
        const alreadyInDay = calendarDays[deadlineDate].events.some(e => e.id.toString() === event._id.toString());
        if (!alreadyInDay) {
          calendarDays[deadlineDate].events.push({
            id: event._id,
            title: `${event.title} (Deadline)`,
            club: event.club?.name,
            clubInitials: event.club?.initials,
            time: 'Closes 11:59 PM',
            venue: event.venue,
            category: event.category,
            status: event.status,
            isRegistered,
            isDeadline: true,
            dotColor: 'red',
          });
        }
      }
    });

    const TimetableEntry = require('../models/TimetableEntry');
    const timetableEntries = userId
      ? await TimetableEntry.find({ user: userId })
      : [];

    // Map day of week to day of month in current month/year
    const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateObj = new Date(year, month - 1, dayNum);
      const dayName = daysMap[dateObj.getDay()];
      const dayPad = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
      const isoKey = `${prefix}-${dayPad}`;

      // Find timetable classes for this day of week
      const matchingClasses = timetableEntries.filter(c => c.dayOfWeek === dayName);

      matchingClasses.forEach(cls => {
        if (!calendarDays[isoKey]) {
          calendarDays[isoKey] = { dots: new Set(), events: [] };
        }

        let dotColor = 'indigo';
        if (cls.status === 'venue_changed') dotColor = 'amber';
        else if (cls.status === 'cancelled') dotColor = 'red';
        else if (cls.status === 'postponed') dotColor = 'indigo';
        else if (cls.status === 'time_changed') dotColor = 'indigo';

        calendarDays[isoKey].dots.add(dotColor);

        // Add class item to day's events
        calendarDays[isoKey].events.push({
          id: cls._id,
          isTimetableClass: true,
          title: `${cls.subject} (${cls.courseCode})`,
          club: cls.faculty,
          clubInitials: cls.courseCode.substring(0, 2),
          time: `${cls.startTime} - ${cls.endTime}`,
          venue: cls.venue,
          category: 'Classes',
          status: cls.status,
          changeReason: cls.changeReason,
          originalVenue: cls.originalVenue,
          isRegistered: true,
          isDeadline: false,
          dotColor,
        });
      });
    }

    // Convert dots sets to arrays
    const formattedDays = {};
    for (const [day, data] of Object.entries(calendarDays)) {
      formattedDays[day] = {
        dots: Array.from(data.dots),
        events: data.events,
      };
    }

    return res.json({
      success: true,
      year,
      month,
      calendarDays: formattedDays,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

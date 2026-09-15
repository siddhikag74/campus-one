import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  XCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Info,
  Layers,
  ArrowRight,
  Edit3,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAppData } from '../context/AppDataContext';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TimetableScreen = ({ highlightedClassId }) => {
  const { showToast } = useToast();
  const { refreshGlobalData } = useAppData();

  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState('Tuesday'); // Default to current day
  const [weekData, setWeekData] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [recentChanges, setRecentChanges] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);

  // Simulate Change Modal State
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [simulatingClass, setSimulatingClass] = useState(null);
  const [simAction, setSimAction] = useState('venue_change');
  const [simPayload, setSimPayload] = useState({
    newVenue: 'Seminar Hall B',
    newStartTime: '12:00 PM',
    newEndTime: '01:00 PM',
    newDay: 'Thursday',
    reason: 'Relocated for high-bandwidth practical session.',
  });
  const [submittingChange, setSubmittingChange] = useState(false);

  const fetchTimetableData = async () => {
    try {
      setLoading(true);
      const [weekRes, todayRes, changesRes] = await Promise.all([
        api.getWeekTimetable(weekOffset),
        api.getTodayClasses(),
        api.getTimetableChanges(),
      ]);

      setWeekData(weekRes);
      setTodayClasses(todayRes.classes || []);
      setRecentChanges(changesRes.changes || []);

      if (weekRes.metadata?.currentDay) {
        setSelectedDay((prev) => (weekOffset === 0 ? weekRes.metadata.currentDay : prev));
      }
    } catch (err) {
      console.error('Failed to load timetable data:', err);
      showToast(err.message || 'Could not fetch timetable', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetableData();
  }, [weekOffset]);

  // Handle highlighted class from notification click
  useEffect(() => {
    if (highlightedClassId && weekData) {
      // Find which day this class is in
      for (const day of DAYS_OF_WEEK) {
        const found = weekData.days?.[day]?.find((c) => c._id === highlightedClassId);
        if (found) {
          setSelectedDay(day);
          setSelectedClass(found);
          break;
        }
      }
    }
  }, [highlightedClassId, weekData]);

  const handleApplyChange = async (e) => {
    e.preventDefault();
    if (!simulatingClass) return;

    try {
      setSubmittingChange(true);
      const res = await api.changeTimetableSchedule(simulatingClass._id, {
        action: simAction,
        ...simPayload,
      });

      showToast(res.message || 'Schedule updated successfully! Notification dispatched.', 'success');
      setSimModalOpen(false);
      setSimulatingClass(null);
      await fetchTimetableData();
      refreshGlobalData(); // Refreshes unread notification counts
    } catch (err) {
      showToast(err.message || 'Failed to update class schedule', 'error');
    } finally {
      setSubmittingChange(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      setLoading(true);
      await api.resetDemoTimetable();
      showToast('Timetable reset to demo schedule state.', 'success');
      await fetchTimetableData();
      refreshGlobalData();
    } catch (err) {
      showToast(err.message || 'Failed to reset timetable', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openSimulateModal = (cls) => {
    setSimulatingClass(cls);
    setSimAction('venue_change');
    setSimPayload({
      newVenue: cls.venue === 'Lab 2' ? 'Seminar Hall A' : 'Lab 2',
      newStartTime: cls.startTime === '10:00 AM' ? '12:00 PM' : '10:00 AM',
      newEndTime: cls.endTime === '11:00 AM' ? '01:00 PM' : '11:00 AM',
      newDay: cls.dayOfWeek === 'Thursday' ? 'Friday' : 'Thursday',
      reason: 'Administrative room reallocation for laboratory equipment setup.',
    });
    setSimModalOpen(true);
  };

  const renderStatusBadge = (cls) => {
    switch (cls.status) {
      case 'venue_changed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
            <MapPin className="w-3 h-3 text-amber-600" />
            <span>Venue Changed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>CANCELLED</span>
          </span>
        );
      case 'postponed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-violet-100 text-violet-900 border border-violet-200">
            <Clock className="w-3 h-3 text-violet-600" />
            <span>POSTPONED</span>
          </span>
        );
      case 'time_changed':
      case 'date_changed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 border border-sky-200">
            <Clock className="w-3 h-3 text-sky-600" />
            <span>Time Changed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
            <span>Scheduled</span>
          </span>
        );
    }
  };

  const renderClassCard = (cls, isCompact = false) => {
    const isCancelled = cls.status === 'cancelled';
    const isVenueChanged = cls.status === 'venue_changed';
    const isPostponed = cls.status === 'postponed';
    const isTimeChanged = cls.status === 'time_changed' || cls.status === 'date_changed';
    const isHighlighted = highlightedClassId === cls._id;

    // Border and background styling based on status
    let cardStyle = 'bg-surface border-slate-200/80 shadow-card';
    if (isCancelled) {
      cardStyle = 'bg-rose-50/40 border-rose-200/90 shadow-subtle';
    } else if (isVenueChanged) {
      cardStyle = 'bg-amber-50/30 border-amber-300 shadow-card';
    } else if (isPostponed) {
      cardStyle = 'bg-violet-50/30 border-violet-300 shadow-card';
    } else if (isTimeChanged) {
      cardStyle = 'bg-sky-50/30 border-sky-300 shadow-card';
    }

    if (isHighlighted) {
      cardStyle += ' ring-2 ring-primary ring-offset-2';
    }

    return (
      <div
        key={cls._id}
        className={`rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${cardStyle} touch-scale`}
      >
        <div>
          {/* Top Header Row: Course Code & Status Badge */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black font-heading px-2 py-0.5 rounded-lg bg-primary/10 text-primary">
                {cls.courseCode}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {cls.type || 'Lecture'}
              </span>
            </div>
            {renderStatusBadge(cls)}
          </div>

          {/* Subject Title */}
          <h3
            className={`font-heading font-extrabold text-sm text-slate-900 leading-snug mb-1 ${
              isCancelled ? 'line-through text-slate-500' : ''
            }`}
          >
            {cls.subject}
          </h3>

          {/* Faculty Instructor */}
          <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mb-3">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{cls.faculty}</span>
          </p>

          {/* Change Alert Banners */}
          {isVenueChanged && (
            <div className="mb-3 p-2 bg-amber-100/70 border border-amber-200 rounded-xl text-[11px] text-amber-950 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-tight">
                <span className="font-extrabold block">Venue Changed</span>
                <span>
                  Moved from <strong className="line-through">{cls.originalVenue}</strong> &rarr;{' '}
                  <strong className="text-amber-900">{cls.venue}</strong>
                </span>
                {cls.changeReason && <span className="block text-[10px] text-amber-800 mt-0.5">{cls.changeReason}</span>}
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="mb-3 p-2 bg-rose-100/70 border border-rose-200 rounded-xl text-[11px] text-rose-900 flex items-start gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-tight">
                <span className="font-extrabold block">Class Cancelled</span>
                <span>{cls.changeReason || 'This scheduled session has been cancelled by faculty.'}</span>
              </div>
            </div>
          )}

          {isPostponed && (
            <div className="mb-3 p-2 bg-violet-100/70 border border-violet-200 rounded-xl text-[11px] text-violet-950 flex items-start gap-1.5">
              <Clock className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
              <div className="leading-tight">
                <span className="font-extrabold block">Class Postponed</span>
                <span>
                  Was {cls.originalDay || cls.dayOfWeek} at {cls.originalStartTime || cls.startTime}
                </span>
                {cls.changeReason && <span className="block text-[10px] text-violet-800 mt-0.5">{cls.changeReason}</span>}
              </div>
            </div>
          )}

          {isTimeChanged && (
            <div className="mb-3 p-2 bg-sky-100/70 border border-sky-200 rounded-xl text-[11px] text-sky-950 flex items-start gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
              <div className="leading-tight">
                <span className="font-extrabold block">Time Shifted</span>
                <span>
                  Was <strong className="line-through">{cls.originalStartTime}</strong> &rarr;{' '}
                  <strong>{cls.startTime}</strong>
                </span>
                {cls.changeReason && <span className="block text-[10px] text-sky-800 mt-0.5">{cls.changeReason}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Card Footer: Time slot, Room/Venue, and Admin Simulation Tool */}
        <div className="pt-3 border-t border-slate-100/80 flex items-center justify-between gap-2 mt-1">
          <div className="space-y-0.5 overflow-hidden">
            {/* Time Slot */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>
                {cls.startTime} – {cls.endTime}
              </span>
            </div>

            {/* Room / Venue */}
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className={`truncate ${isVenueChanged ? 'text-amber-900 font-extrabold' : ''}`}>
                {cls.venue}
              </span>
            </div>
          </div>

          {/* Simulate Change button for live testing */}
          <button
            onClick={() => openSimulateModal(cls)}
            title="Simulate schedule change"
            aria-label="Simulate schedule change"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-primary/10 hover:text-primary text-slate-500 transition-colors touch-scale cursor-pointer shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const currentDayClasses = weekData?.days?.[selectedDay] || [];
  const stats = weekData?.stats || { totalClasses: 0, scheduled: 0, venueChanged: 0, cancelled: 0, postponed: 0, timeChanged: 0 };
  const metadata = weekData?.metadata || { academicWeek: 'Academic Week 6', weekRange: 'Sep 15 – Sep 20, 2026' };

  return (
    <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 min-h-full pb-16 animate-fade-in">
      {/* 1. Header with Title & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <CalendarClock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-heading font-black text-slate-900 tracking-tight">
              My Timetable
            </h1>
            <span className="text-[10px] font-extrabold bg-primary text-white px-2 py-0.5 rounded-full shadow-sm">
              Live Sync
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500">
            Your classes, schedule changes and important updates in one place.
          </p>
        </div>

        {/* Quick Reset Demo Button */}
        <button
          onClick={handleResetDemo}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-subtle touch-scale cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Demo Scenario</span>
        </button>
      </div>

      {/* 2. Week Navigation & Academic Week Header */}
      <div className="bg-surface rounded-2xl p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-heading font-black text-slate-900">
              {metadata.academicWeek}
            </h2>
            <span className="text-[11px] font-bold text-slate-400 font-mono">
              ({metadata.weekRange})
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
            DTU B.Tech CSE &bull; Fall Semester 2026
          </span>
        </div>

        {/* Week Switcher Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            aria-label="Previous week"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors touch-scale cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setWeekOffset(0)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all touch-scale cursor-pointer ${
              weekOffset === 0
                ? 'bg-primary text-white shadow-sm shadow-primary/25'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Current Week
          </button>

          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            aria-label="Next week"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors touch-scale cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Schedule Legend & Modification Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface/70 rounded-2xl border border-slate-200/60 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-extrabold uppercase text-[10px] tracking-wider text-slate-400">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>
            <span className="text-slate-700 font-semibold text-[11px]">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-amber-800 font-semibold text-[11px]">Venue Changed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-rose-800 font-semibold text-[11px]">Cancelled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
            <span className="text-violet-800 font-semibold text-[11px]">Postponed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            <span className="text-sky-800 font-semibold text-[11px]">Time Changed</span>
          </div>
        </div>

        {stats.totalModifications > 0 && (
          <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {stats.totalModifications} Active Changes
          </span>
        )}
      </div>

      {/* 4. TODAY'S CLASSES SECTION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-heading font-black text-slate-900 tracking-tight">
              Today's Classes
            </h2>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            {todayClasses.length} Scheduled
          </span>
        </div>

        {loading ? (
          <LoadingSkeleton type="cards" count={3} />
        ) : todayClasses.length === 0 ? (
          <div className="bg-surface rounded-2xl p-6 border border-dashed border-slate-200 text-center text-xs text-slate-500 font-medium">
            No classes scheduled today. Enjoy your break!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {todayClasses.map((cls) => renderClassCard(cls))}
          </div>
        )}
      </section>

      {/* 5. RECENT SCHEDULE CHANGES & NOTIFICATIONS FEED */}
      {recentChanges.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-heading font-black text-slate-900 tracking-tight">
                Recent Schedule Changes
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-500">
              {recentChanges.length} Modified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentChanges.map((item) => (
              <div
                key={item._id}
                onClick={() => {
                  setSelectedDay(item.dayOfWeek);
                  setSelectedClass(item);
                }}
                className="bg-surface rounded-2xl p-3 border border-slate-200/80 shadow-subtle hover:shadow-card transition-all cursor-pointer space-y-1.5 touch-scale"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold font-heading text-slate-900">
                    {item.dayOfWeek}
                  </span>
                  {renderStatusBadge(item)}
                </div>
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {item.subject}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                  {item.changeReason || `Schedule modified for ${item.courseCode}`}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. WEEK-BASED TIMETABLE SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-heading font-black text-slate-900 tracking-tight">
              Weekly Timetable Grid
            </h2>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            Monday &rarr; Saturday
          </span>
        </div>

        {/* Day Selector Pills (Active on all screen sizes for fast navigation) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDay === day;
            const count = weekData?.days?.[day]?.length || 0;
            const hasChange = weekData?.days?.[day]?.some((c) => c.status !== 'scheduled');

            return (
              <button
                key={day}
                id={`day-tab-${day.toLowerCase()}`}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all touch-scale cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : 'bg-surface text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span>{day}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
                {hasChange && (
                  <span
                    title="Contains modified classes"
                    className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-500'}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Classes for the Selected Day */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 font-heading">
              {selectedDay}'s Classes ({currentDayClasses.length})
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Click class to inspect or simulate changes
            </span>
          </div>

          {loading ? (
            <LoadingSkeleton type="cards" count={3} />
          ) : currentDayClasses.length === 0 ? (
            <div className="p-8 bg-surface rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
              No classes scheduled for {selectedDay}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {currentDayClasses.map((cls) => renderClassCard(cls))}
            </div>
          )}
        </div>

        {/* Desktop Full Week Overview Columns (Visible on Desktop >=1024px) */}
        <div className="hidden lg:block pt-6 border-t border-slate-200/80 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-heading">
            Full Week Overview (Monday &ndash; Saturday)
          </h3>

          <div className="grid grid-cols-6 gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const dayClasses = weekData?.days?.[day] || [];
              const isSelected = selectedDay === day;

              return (
                <div
                  key={day}
                  className={`rounded-2xl p-3 border transition-all ${
                    isSelected
                      ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/20'
                      : 'bg-surface border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-black font-heading text-slate-900">{day.substring(0, 3)}</span>
                    <span className="text-[10px] font-bold text-slate-400">{dayClasses.length}</span>
                  </div>

                  <div className="space-y-2">
                    {dayClasses.map((cls) => (
                      <div
                        key={cls._id}
                        onClick={() => {
                          setSelectedDay(day);
                          setSelectedClass(cls);
                        }}
                        className={`p-2 rounded-xl border text-[10px] cursor-pointer hover:shadow-subtle transition-all ${
                          cls.status === 'cancelled'
                            ? 'bg-rose-50 border-rose-200 line-through text-slate-400'
                            : cls.status === 'venue_changed'
                            ? 'bg-amber-50 border-amber-200 text-amber-950 font-bold'
                            : cls.status === 'postponed'
                            ? 'bg-violet-50 border-violet-200 text-violet-950 font-bold'
                            : cls.status === 'time_changed'
                            ? 'bg-sky-50 border-sky-200 text-sky-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-800 font-medium'
                        }`}
                      >
                        <div className="font-extrabold truncate">{cls.courseCode}</div>
                        <div className="truncate text-slate-500">{cls.startTime}</div>
                        <div className="truncate text-slate-400">{cls.venue}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. SIMULATE SCHEDULE CHANGE MODAL */}
      {simModalOpen && simulatingClass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 animate-slide-up space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900">
                  Simulate Schedule Change
                </h3>
                <p className="text-[11px] text-slate-500 truncate max-w-[280px]">
                  {simulatingClass.subject} ({simulatingClass.courseCode})
                </p>
              </div>
              <button
                onClick={() => setSimModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyChange} className="space-y-3.5">
              {/* Action Type Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Change Action
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimAction('venue_change')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      simAction === 'venue_change'
                        ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    📍 Move Venue
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimAction('cancel')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      simAction === 'cancel'
                        ? 'bg-rose-100 border-rose-300 text-rose-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    ❌ Cancel Class
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimAction('postpone')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      simAction === 'postpone'
                        ? 'bg-violet-100 border-violet-300 text-violet-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    ⏳ Postpone Class
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimAction('time_change')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      simAction === 'time_change'
                        ? 'bg-sky-100 border-sky-300 text-sky-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    ⏰ Change Time
                  </button>
                </div>
              </div>

              {/* Dynamic Field Inputs based on selected action */}
              {simAction === 'venue_change' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    New Classroom / Venue
                  </label>
                  <input
                    type="text"
                    required
                    value={simPayload.newVenue}
                    onChange={(e) => setSimPayload({ ...simPayload, newVenue: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              {simAction === 'postpone' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">New Day</label>
                    <select
                      value={simPayload.newDay}
                      onChange={(e) => setSimPayload({ ...simPayload, newDay: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">New Time</label>
                    <input
                      type="text"
                      value={simPayload.newStartTime}
                      onChange={(e) => setSimPayload({ ...simPayload, newStartTime: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                </div>
              )}

              {simAction === 'time_change' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">New Start Time</label>
                    <input
                      type="text"
                      value={simPayload.newStartTime}
                      onChange={(e) => setSimPayload({ ...simPayload, newStartTime: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">New End Time</label>
                    <input
                      type="text"
                      value={simPayload.newEndTime}
                      onChange={(e) => setSimPayload({ ...simPayload, newEndTime: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Reason Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Reason for Student Notification
                </label>
                <input
                  type="text"
                  required
                  value={simPayload.reason}
                  onChange={(e) => setSimPayload({ ...simPayload, reason: e.target.value })}
                  placeholder="e.g. Faculty conference, lab setup, NAAC inspection"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Reset to scheduled option */}
              {simulatingClass.status !== 'scheduled' && (
                <button
                  type="button"
                  onClick={() => {
                    setSimAction('reset');
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  🔄 Restore to Normal Schedule
                </button>
              )}

              {/* Modal Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSimModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingChange}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/25 disabled:opacity-50"
                >
                  {submittingChange ? 'Applying Change...' : 'Apply & Notify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableScreen;

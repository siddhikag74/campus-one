import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to convert time string to minutes
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

// Check if two time slots overlap
const doTimeSlotsOverlap = (start1Str, end1Str, start2Str, end2Str) => {
  const s1 = parseTimeToMinutes(start1Str);
  let e1 = parseTimeToMinutes(end1Str);
  const s2 = parseTimeToMinutes(start2Str);
  let e2 = parseTimeToMinutes(end2Str);
  if (s1 === null || e1 === null || s2 === null || e2 === null) return false;
  if (e1 <= s1) e1 += 60;
  if (e2 <= s2) e2 += 60;
  return Math.max(s1, s2) < Math.min(e1, e2);
};

// Deduplicate array of classes so each class only appears once
const deduplicateClasses = (classList = []) => {
  const seen = new Set();
  return classList.filter((cls) => {
    if (!cls) return false;
    const key = `${cls.courseCode}_${cls.dayOfWeek}_${cls.startTime}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const ProfessorScheduleScreen = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [selectedDay, setSelectedDay] = useState('Monday');
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Class Change Modal State
  const [selectedClass, setSelectedClass] = useState(null);
  const [actionType, setActionType] = useState('cancel'); // 'cancel' | 'postpone' | 'time_change' | 'venue_change' | 'reset'
  const [reason, setReason] = useState('');
  const [newVenue, setNewVenue] = useState('');
  const [newStartTime, setNewStartTime] = useState('11:00 AM');
  const [newEndTime, setNewEndTime] = useState('12:00 PM');
  const [newDay, setNewDay] = useState('Thursday');
  const [submitting, setSubmitting] = useState(false);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const data = await api.getWeekTimetable(0);
      if (data?.days) {
        Object.keys(data.days).forEach((d) => {
          data.days[d] = deduplicateClasses(data.days[d]);
        });
      }
      setTimetableData(data);
    } catch (err) {
      showToast(err.message || 'Failed to fetch timetable', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleOpenActionModal = (cls, defaultAction = 'cancel') => {
    setSelectedClass(cls);
    setActionType(defaultAction);
    setReason('');
    setNewVenue(cls.venue || 'Seminar Hall B');
    setNewStartTime(cls.startTime || '11:00 AM');
    setNewEndTime(cls.endTime || '12:00 PM');
    setNewDay(cls.dayOfWeek === 'Wednesday' ? 'Thursday' : 'Friday');
  };

  const handleApplyChange = async (e) => {
    e.preventDefault();
    if (!selectedClass) return;

    // Client-side time clash validation
    if (actionType === 'postpone' || actionType === 'time_change') {
      const targetDay = (actionType === 'postpone' ? newDay : null) || selectedClass.dayOfWeek;
      const targetStartTime = newStartTime || selectedClass.startTime;
      const targetEndTime = newEndTime || selectedClass.endTime;

      const targetDayClasses = timetableData?.days?.[targetDay] || [];
      const conflictingClass = targetDayClasses.find(
        (cls) =>
          cls._id !== selectedClass._id &&
          cls.status !== 'cancelled' &&
          doTimeSlotsOverlap(targetStartTime, targetEndTime, cls.startTime, cls.endTime)
      );

      if (conflictingClass) {
        showToast(
          `Time clash: '${conflictingClass.subject}' (${conflictingClass.courseCode}) is already scheduled on ${targetDay} from ${conflictingClass.startTime} to ${conflictingClass.endTime}.`,
          'warning'
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        action: actionType,
        reason: reason.trim() || undefined,
        newVenue: actionType === 'venue_change' ? newVenue.trim() : undefined,
        newStartTime: (actionType === 'time_change' || actionType === 'postpone') ? newStartTime : undefined,
        newEndTime: (actionType === 'time_change' || actionType === 'postpone') ? newEndTime : undefined,
        newDay: actionType === 'postpone' ? newDay : undefined,
      };

      const res = await api.changeTimetableSchedule(selectedClass._id, payload);
      showToast(res.message || 'Schedule change applied & students notified! 📢', 'success');
      setSelectedClass(null);
      fetchSchedule();
    } catch (err) {
      showToast(err.message || 'Failed to update schedule', 'error');
    } finally {
      setSubmitting(false);
    }
  };


  const getStatusBadge = (status) => {
    switch (status) {
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            Cancelled
          </span>
        );
      case 'postponed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Postponed
          </span>
        );
      case 'venue_changed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Venue Relocated
          </span>
        );
      case 'time_changed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            Time Shifted
          </span>
        );
      case 'scheduled':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Active / On-Time
          </span>
        );
    }
  };

  const currentDayClasses = timetableData?.days?.[selectedDay] || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-lg text-white tracking-tight">Faculty Timetable</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Professor Mode
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {user?.department || 'Department of Computer Science & Engineering'} • {user?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={logout}
              className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Total Classes (Week)</span>
            <div className="text-2xl font-black font-heading text-white mt-1">
              {timetableData?.stats?.totalClasses || 16}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Cancelled Classes</span>
            <div className="text-2xl font-black font-heading text-red-400 mt-1">
              {timetableData?.stats?.cancelled || 0}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Postponed Classes</span>
            <div className="text-2xl font-black font-heading text-purple-400 mt-1">
              {timetableData?.stats?.postponed || 0}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Venue / Time Shifted</span>
            <div className="text-2xl font-black font-heading text-amber-400 mt-1">
              {(timetableData?.stats?.venueChanged || 0) + (timetableData?.stats?.timeChanged || 0)}
            </div>
          </div>
        </div>

        {/* Days of Week Tab Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {DAYS.map((day) => {
            const isSelected = selectedDay === day;
            const count = timetableData?.days?.[day]?.length || 0;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{day}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isSelected ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Classes List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold font-heading text-white">{selectedDay} Teaching Schedule</h2>
              <p className="text-xs text-slate-400">
                Cancel, postpone, or relocate your classes. Student schedules and live alerts update instantly.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <svg className="animate-spin h-8 w-8 text-emerald-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading timetable...
            </div>
          ) : currentDayClasses.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 p-6">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-base font-bold text-white mb-1">No Classes on {selectedDay}</h3>
              <p className="text-xs text-slate-400">No scheduled lectures or labs found for this day.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentDayClasses.map((cls) => {
                const isCancelled = cls.status === 'cancelled';
                const isPostponed = cls.status === 'postponed';

                return (
                  <div
                    key={cls._id}
                    className={`rounded-2xl border p-5 transition-all ${
                      isCancelled
                        ? 'bg-red-950/20 border-red-500/30'
                        : isPostponed
                        ? 'bg-purple-950/20 border-purple-500/30'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Class Details */}
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
                            {cls.courseCode}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            • {cls.type}
                          </span>
                          {getStatusBadge(cls.status)}
                        </div>

                        <h3 className={`text-base font-bold font-heading text-white ${isCancelled ? 'line-through text-slate-400' : ''}`}>
                          {cls.subject}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2">
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                            ⏰ {cls.startTime} – {cls.endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            📍 {cls.venue}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            👤 {cls.faculty}
                          </span>
                        </div>

                        {cls.changeReason && (
                          <div className="mt-2 text-xs py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                            <span className="font-bold text-amber-400">Faculty Notice:</span> {cls.changeReason}
                          </div>
                        )}
                      </div>

                      {/* Professor Quick Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {cls.status !== 'cancelled' ? (
                          <button
                            onClick={() => handleOpenActionModal(cls, 'cancel')}
                            className="py-1.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel Class
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenActionModal(cls, 'reset')}
                            className="py-1.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all"
                          >
                            Restore Class
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenActionModal(cls, 'postpone')}
                          className="py-1.5 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Postpone
                        </button>

                        <button
                          onClick={() => handleOpenActionModal(cls, 'time_change')}
                          className="py-1.5 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold transition-all"
                        >
                          Reschedule Time
                        </button>

                        <button
                          onClick={() => handleOpenActionModal(cls, 'venue_change')}
                          className="py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all"
                        >
                          Relocate Venue
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* PROFESSOR ACTION MODAL */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400">Professor Schedule Controls</span>
                <h3 className="text-base font-bold font-heading text-white line-clamp-1">
                  {selectedClass.subject} ({selectedClass.courseCode})
                </h3>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyChange} className="space-y-4">
              {/* Action Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Select Action *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType('cancel')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      actionType === 'cancel'
                        ? 'bg-red-500/20 border-red-500 text-red-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    ❌ Cancel Class
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('postpone')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      actionType === 'postpone'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    ⏳ Postpone Class
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('time_change')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      actionType === 'time_change'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    ⏰ Reschedule Time
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('venue_change')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      actionType === 'venue_change'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    📍 Change Venue
                  </button>
                </div>
              </div>

              {/* Dynamic Action Fields */}
              {actionType === 'postpone' && (
                <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/30 space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                      Postpone to Day
                    </label>
                    <select
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    >
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-purple-300 mb-1">New Start Time</label>
                      <input
                        type="text"
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        placeholder="02:00 PM"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-purple-300 mb-1">New End Time</label>
                      <input
                        type="text"
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        placeholder="03:00 PM"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {actionType === 'time_change' && (
                <div className="p-3 rounded-xl bg-slate-950 border border-sky-500/30 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-sky-300 mb-1">New Start Time</label>
                    <input
                      type="text"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      placeholder="12:00 PM"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-sky-300 mb-1">New End Time</label>
                    <input
                      type="text"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      placeholder="01:00 PM"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {actionType === 'venue_change' && (
                <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30">
                  <label className="block text-[11px] font-semibold text-amber-300 mb-1">New Classroom / Lab Venue</label>
                  <input
                    type="text"
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    placeholder="e.g. Seminar Hall B / Lab 3"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
              )}

              {/* Faculty Reason */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Reason / Broadcast Note for Students
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    actionType === 'cancel'
                      ? 'e.g. Class cancelled due to departmental faculty conference.'
                      : actionType === 'postpone'
                      ? 'e.g. Postponed to Thursday due to NAAC audit meeting.'
                      : 'Provide details for student notification...'
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedClass(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-md hover:opacity-95 disabled:opacity-50"
                >
                  {submitting ? 'Applying...' : 'Apply & Notify Students'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorScheduleScreen;

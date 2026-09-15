import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAppData } from '../context/AppDataContext';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

export const CalendarScreen = ({ onNavigateToEvent }) => {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // Default September 2026
  const [selectedDateStr, setSelectedDateStr] = useState('2026-09-18');
  const [calendarData, setCalendarData] = useState({});
  const [loading, setLoading] = useState(true);

  const { registeredEventIds } = useAppData();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const res = await api.getCalendar(currentYear, currentMonth);
      setCalendarData(res.calendarDays || {});
    } catch (err) {
      console.error('Failed to load calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Generate calendar grid days for current month
  const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
  const getFirstDayOffset = (year, month) => {
    const day = new Date(year, month - 1, 1).getDay();
    // Monday as first day: 0=Sun -> 6, 1=Mon -> 0
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOffset = getFirstDayOffset(currentYear, currentMonth);

  const monthPad = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
  const selectedDayData = calendarData[selectedDateStr] || { events: [] };

  return (
    <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-5 min-h-full pb-12">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-heading font-black text-slate-900 tracking-tight">
            Campus Calendar
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Month Navigation Card */}
        <div className="lg:col-span-7 bg-surface rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-card">
          {/* Month Selector Bar */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors touch-scale cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <h2 className="text-sm sm:text-base font-heading font-black text-slate-900">
              {monthNames[currentMonth - 1]} {currentYear}
            </h2>

            <button
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors touch-scale cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
              <span key={d} className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
            {/* Leading blank days */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`blank-${i}`} className="h-9 sm:h-11"></div>
            ))}

            {/* Actual days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayPad = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
              const isoKey = `${currentYear}-${monthPad}-${dayPad}`;

              const isSelected = selectedDateStr === isoKey;
              const dayInfo = calendarData[isoKey];
              const dots = dayInfo?.dots || [];

              return (
                <button
                  key={isoKey}
                  onClick={() => setSelectedDateStr(isoKey)}
                  className={`h-9 sm:h-11 rounded-xl flex flex-col items-center justify-center relative transition-all touch-scale cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white font-extrabold shadow-sm shadow-primary/30'
                      : 'text-slate-700 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  <span className="text-xs sm:text-sm leading-none">{dayNum}</span>

                  {/* Calendar Dots */}
                  {dots.length > 0 && (
                    <div className="flex items-center gap-0.5 mt-1">
                      {dots.map((dot, idx) => (
                        <span
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full ${
                            dot === 'green'
                              ? isSelected ? 'bg-emerald-300' : 'bg-emerald-500'
                              : dot === 'red'
                              ? isSelected ? 'bg-rose-300' : 'bg-rose-500'
                              : isSelected ? 'bg-white' : 'bg-primary'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-100 text-[10px] sm:text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Registered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Deadline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span>Other Event</span>
            </div>
          </div>
        </div>

        {/* Selected Date Event List Section */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 font-heading">
              Events on {selectedDateStr}
            </h3>
            <span className="text-[10px] font-bold text-slate-500">
              {selectedDayData.events.length} Scheduled
            </span>
          </div>

          {loading ? (
            <LoadingSkeleton type="list" count={2} />
          ) : selectedDayData.events.length > 0 ? (
            <div className="space-y-2">
              {selectedDayData.events.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigateToEvent(item.id)}
                  className="bg-surface rounded-2xl p-3.5 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all cursor-pointer flex items-center justify-between gap-3 touch-scale"
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.time}
                      </span>
                      {item.isRegistered && (
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md">
                          Registered
                        </span>
                      )}
                      {item.isDeadline && (
                        <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-md">
                          Deadline
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 font-heading truncate">
                      {item.title}
                    </h4>

                    <p className="text-[10px] text-slate-500 truncate">
                      {item.club} &bull; {item.venue}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-surface rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
              No events scheduled for this day. Select another date with indicator dots.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarScreen;

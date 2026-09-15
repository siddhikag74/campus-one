import React from 'react';
import { Heart, Calendar, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const EventCard = ({ event, onSelect, compact = false }) => {
  const { savedEventIds, toggleSave } = useAppData();
  const isSaved = savedEventIds.has(event._id);

  // Category Color Map
  const categoryStyles = {
    Events: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    Competitions: 'bg-amber-50 text-amber-700 border-amber-200/80',
    Workshops: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    Others: 'bg-rose-50 text-rose-700 border-rose-200/80',
  };

  const badgeClass = categoryStyles[event.category] || 'bg-slate-100 text-slate-700 border-slate-200';

  const handleHeartClick = (e) => {
    e.stopPropagation();
    toggleSave(event._id, event.title);
  };

  return (
    <div
      onClick={() => onSelect && onSelect(event._id)}
      className="group relative bg-surface rounded-2xl p-3 border border-slate-200/70 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden touch-scale"
    >
      {/* Top Bar: Category badge & Favorite button */}
      <div>
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1 overflow-hidden">
            <span
              className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeClass} truncate`}
            >
              {event.category}
            </span>
            {event.isPopular && (
              <span
                title="Popular on Campus"
                className="text-xs shrink-0 flex items-center leading-none"
              >
                🔥
              </span>
            )}
          </div>

          <button
            type="button"
            aria-label={isSaved ? 'Remove from favorites' : 'Save to favorites'}
            onClick={handleHeartClick}
            className={`p-1.5 rounded-full transition-colors ${
              isSaved
                ? 'text-rose-500 bg-rose-50'
                : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100'
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                isSaved ? 'fill-rose-500 scale-110' : 'stroke-[2]'
              }`}
            />
          </button>
        </div>

        {/* Event Title */}
        <h3 className="font-heading font-extrabold text-xs text-slate-900 leading-snug line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {event.title}
        </h3>

        {/* Organizing Club */}
        <p className="text-[10px] text-slate-500 font-medium truncate mb-2.5">
          {event.club?.name || 'Campus Club'}
        </p>

        {/* Alert Pill (Deadline Extension or Venue Change) */}
        {event.deadlineAlert?.isExtended && (
          <div className="mb-2 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200/80 text-[9px] font-semibold text-emerald-800 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
            <span className="truncate">Deadline Ext. {event.deadlineAlert.newDeadline}</span>
          </div>
        )}

        {event.venueAlert?.isUpdated && (
          <div className="mb-2 px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200/80 text-[9px] font-semibold text-sky-800 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-sky-600 shrink-0" />
            <span className="truncate">New: {event.venueAlert.newVenue}</span>
          </div>
        )}
      </div>

      {/* Footer Info: Venue & Date */}
      <div className="pt-2 border-t border-slate-100 mt-1 space-y-1">
        <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate">
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">{event.venue}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-700">
          <Calendar className="w-3 h-3 text-primary shrink-0" />
          <span className="truncate">{event.dateStr}</span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;

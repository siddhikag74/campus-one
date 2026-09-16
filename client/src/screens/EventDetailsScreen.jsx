import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  FileText,
  QrCode,
  Star,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api';
import { useAppData } from '../context/AppDataContext';
import EventInfoChip from '../components/events/EventInfoChip';
import RoundCard from '../components/events/RoundCard';
import AlertBanner from '../components/common/AlertBanner';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import ErrorState from '../components/common/ErrorState';

export const EventDetailsScreen = ({
  eventId,
  onBack,
  onNavigateToRegister,
  onNavigateToReview,
  onNavigateToClub,
}) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    savedEventIds,
    toggleSave,
    importantEventIds,
    toggleImportant,
    registeredEventIds,
  } = useAppData();

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getEventById(eventId);
      setEvent(res.event);
    } catch (err) {
      console.error('Failed to load event details:', err);
      setError(err.message || 'Could not load event information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchDetails();
    }
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-full bg-campusBg p-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-surface border border-slate-200 text-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-5 w-32 bg-slate-200 rounded"></div>
        </div>
        <LoadingSkeleton type="details" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-full bg-campusBg p-4">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-surface border border-slate-200 text-slate-700 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <ErrorState message={error || 'Event not found'} onRetry={fetchDetails} />
      </div>
    );
  }

  const isSaved = savedEventIds.has(event._id);
  const isImportant = importantEventIds.has(event._id);
  const isRegistered = registeredEventIds.has(event._id) || event.isRegistered;
  const isMissed = event.status === 'missed';

  const categoryGradients = {
    Events: 'from-indigo-600 via-indigo-700 to-violet-800',
    Competitions: 'from-amber-500 via-orange-600 to-amber-700',
    Workshops: 'from-emerald-600 via-teal-700 to-emerald-800',
    Others: 'from-rose-500 via-pink-600 to-rose-700',
  };

  const headerGradient = categoryGradients[event.category] || categoryGradients.Events;

  return (
    <div className="min-h-full bg-campusBg pb-24 animate-fade-in flex flex-col">
      {/* Hero Category Header with Back & Favorite Actions */}
      <div className={`relative px-4 pt-4 pb-8 bg-gradient-to-br ${headerGradient} text-white shadow-md`}>
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            id="btn-event-details-back"
            onClick={onBack}
            aria-label="Back to previous screen"
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-md transition-all touch-scale"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            {/* Mark as Important Star Toggle */}
            <button
              onClick={() => toggleImportant(event._id)}
              aria-label={isImportant ? 'Unmark important' : 'Mark as important'}
              className={`p-2 rounded-xl backdrop-blur-md transition-all touch-scale ${
                isImportant
                  ? 'bg-amber-400 text-amber-950 font-bold shadow-sm'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <Star className={`w-5 h-5 ${isImportant ? 'fill-amber-950' : ''}`} />
            </button>

            {/* Favorite Button */}
            <button
              id="btn-event-details-favorite"
              onClick={() => toggleSave(event._id, event.title)}
              aria-label={isSaved ? 'Remove from favorites' : 'Save to favorites'}
              className={`p-2 rounded-xl backdrop-blur-md transition-all touch-scale ${
                isSaved
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-white' : ''}`} />
            </button>
          </div>
        </div>

        {/* Category & Status Pill */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
            {event.category}
          </span>
          {event.isPopular && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white shadow-sm flex items-center gap-1">
              <span>🔥 Popular</span>
            </span>
          )}
          {isMissed && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
              Concluded / Missed
            </span>
          )}
        </div>

        {/* Event Title */}
        <h1 className="font-heading font-black text-xl text-white leading-tight mb-2 tracking-tight">
          {event.title}
        </h1>

        {/* Club Chip */}
        <button
          onClick={() => event.club?._id && onNavigateToClub && onNavigateToClub(event.club._id)}
          className="inline-flex items-center gap-1.5 text-xs text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-md transition-colors"
        >
          <span className="font-medium">Organized by</span>
          <span className="font-bold underline decoration-white/40">{event.club?.name || 'Campus Club'}</span>
          <ChevronRight className="w-3.5 h-3.5 opacity-70" />
        </button>
      </div>

      {/* Main Body Content */}
      <div className="p-4 space-y-4 -mt-3">
        {/* Alerts (Deadline extension / Venue changed) */}
        {event.deadlineAlert?.isExtended && (
          <AlertBanner
            type="deadline"
            title="Deadline Extended!"
            message={`${event.deadlineAlert.message || `Extended to ${event.deadlineAlert.newDeadline}`}`}
          />
        )}

        {event.venueAlert?.isUpdated && (
          <AlertBanner
            type="venue"
            title="Venue Update Notice"
            message={`${event.venueAlert.message || `Moved to ${event.venueAlert.newVenue}`}`}
          />
        )}

        {/* Key Info Chips Grid */}
        <div className="grid grid-cols-2 gap-2">
          <EventInfoChip icon={Calendar} label="Date" value={event.dateStr} />
          <EventInfoChip icon={Clock} label="Time" value={event.time} />
          <EventInfoChip icon={MapPin} label="Venue" value={event.venue} />
          <EventInfoChip
            icon={Clock}
            label="Registration Deadline"
            value={event.deadline}
            highlight={event.status === 'deadline-approaching'}
          />
          <div className="col-span-2">
            <EventInfoChip icon={Users} label="Participation" value={event.teamSize || 'Individual'} />
          </div>
        </div>

        {/* Mark as Important Quick Banner */}
        <div className="bg-surface rounded-2xl p-3 border border-slate-200/80 shadow-subtle flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-800 font-heading block">
              {isImportant ? 'Marked as Important' : 'Track this Opportunity'}
            </span>
            <span className="text-[11px] text-slate-500 block">
              {isImportant ? 'Visible under Profile → Pending list' : 'Add to your Pending watchlist'}
            </span>
          </div>
          <button
            onClick={() => toggleImportant(event._id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all touch-scale ${
              isImportant
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isImportant ? '⭐ Marked' : '+ Mark Important'}
          </button>
        </div>

        {/* About Section */}
        <div className="bg-surface rounded-2xl p-4 border border-slate-200/80 shadow-subtle space-y-2">
          <h3 className="text-xs font-extrabold font-heading text-slate-900 uppercase tracking-wider">
            About the Event
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
            {event.about}
          </p>
        </div>

        {/* Eligibility Section */}
        {event.eligibility && (
          <div className="bg-surface rounded-2xl p-4 border border-slate-200/80 shadow-subtle space-y-2">
            <h3 className="text-xs font-extrabold font-heading text-slate-900 uppercase tracking-wider">
              Eligibility
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {event.eligibility}
            </p>
          </div>
        )}

        {/* What to Expect */}
        {event.whatToExpect && event.whatToExpect.length > 0 && (
          <div className="bg-surface rounded-2xl p-4 border border-slate-200/80 shadow-subtle space-y-2">
            <h3 className="text-xs font-extrabold font-heading text-slate-900 uppercase tracking-wider">
              What to Expect
            </h3>
            <ul className="space-y-1.5">
              {event.whatToExpect.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Competition Rounds Timeline (For Competitions) */}
        {event.isCompetition && event.competitionRounds && event.competitionRounds.length > 0 && (
          <div className="bg-surface rounded-2xl p-4 border border-slate-200/80 shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold font-heading text-slate-900 uppercase tracking-wider">
                Competition Rounds
              </h3>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {event.competitionRounds.length} Rounds
              </span>
            </div>

            <div className="pt-2">
              {event.competitionRounds.map((round, idx) => (
                <RoundCard
                  key={idx}
                  round={round}
                  isLast={idx === event.competitionRounds.length - 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Important Information Amber Callout */}
        {event.importantInformation && (
          <AlertBanner
            type="important"
            title="Important Guidelines"
            message={event.importantInformation}
          />
        )}

        {/* Post-Event Media & Resources Section (Docs, PDFs, PPTs, Drive, Forms, QR, Media) */}
        {((event.resources && event.resources.length > 0) || event.hasMedia) && (
          <div className="bg-surface rounded-2xl p-4 border border-slate-200/80 shadow-subtle space-y-3">
            <h3 className="text-xs font-extrabold font-heading text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Post-Event Media & Resources</span>
              {event.resources?.length > 0 && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  {event.resources.length} Available
                </span>
              )}
            </h3>

            {/* Dynamic Resources Attached by Organizer */}
            {event.resources && event.resources.length > 0 && (
              <div className="space-y-2">
                {event.resources.map((res, idx) => {
                  const typeIcons = {
                    pdf: { icon: '📄', color: 'bg-red-50 text-red-700 border-red-200', label: 'PDF Document' },
                    ppt: { icon: '📊', color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Presentation Deck' },
                    doc: { icon: '📝', color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Document' },
                    drive: { icon: '📁', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Google Drive' },
                    form: { icon: '📋', color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Recruitment Form' },
                    qr: { icon: '📱', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'QR Code' },
                    video: { icon: '🎥', color: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Video Recording' },
                    image: { icon: '🖼️', color: 'bg-pink-50 text-pink-700 border-pink-200', label: 'Image Asset' },
                    link: { icon: '🔗', color: 'bg-cyan-50 text-cyan-700 border-cyan-200', label: 'Resource Link' },
                  };
                  const meta = typeIcons[res.type] || typeIcons.pdf;

                  return (
                    <div key={res._id || idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-primary/40 transition-colors">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className={`p-2 rounded-lg text-base shrink-0 border ${meta.color}`}>
                          {meta.icon}
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-xs font-bold text-slate-800 block truncate">
                            {res.title}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {res.description || meta.label}
                          </span>
                        </div>
                      </div>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-[11px] font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 shrink-0 flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Default Slides Placeholder */}
            {(!event.resources || event.resources.length === 0) && event.hasMedia && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-600 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs font-bold text-slate-800 block truncate">
                      {event.slidesTitle || 'Session_Presentation_Deck.pdf'}
                    </span>
                    <span className="text-[10px] text-slate-500">Official Slides & Handouts</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-semibold text-primary bg-primary/10 rounded-lg">
                  Available
                </span>
              </div>
            )}
          </div>
        )}


        {/* Existing Reviews Section */}
        {event.reviews && event.reviews.length > 0 && (
          <div className="bg-surface rounded-2xl p-4 border border-slate-200/80 shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold font-heading text-slate-900 uppercase tracking-wider">
                Student Reviews ({event.reviews.length})
              </h3>
              {event.averageRating && (
                <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{event.averageRating} / 5</span>
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-1">
              {event.reviews.map((r) => (
                <div key={r._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center">
                        {r.user?.name ? r.user.name.charAt(0) : 'S'}
                      </div>
                      <span className="font-bold text-slate-900">{r.user?.name || 'Verified Student'}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-[11px] font-bold text-slate-700">{r.ratings?.overall}</span>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-slate-600 text-[11px] leading-relaxed italic">
                      "{r.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Rule Requirement:
            "Write a Review" must ONLY appear when:
            event.status === "missed"
            It must NOT appear for: new, upcoming, deadline approaching!
        */}
        {isMissed && (
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-200/80 shadow-subtle text-center space-y-2">
            <h4 className="font-heading font-extrabold text-xs text-indigo-950">
              Attended this event?
            </h4>
            <p className="text-[11px] text-indigo-700 max-w-[260px] mx-auto">
              Share your feedback on content, venue, and organisation to help future students!
            </p>
            <button
              id="btn-write-review"
              onClick={() => onNavigateToReview(event._id)}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover shadow-sm transition-all touch-scale inline-flex items-center gap-1.5"
            >
              <Star className="w-3.5 h-3.5 fill-white" />
              <span>Write a Review</span>
            </button>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Floating Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-surface/95 backdrop-blur-md border-t border-slate-200/80 z-30 shadow-lg flex items-center justify-center">
        <div className="w-full max-w-[390px]">
          {isRegistered ? (
            <div className="w-full py-3 px-4 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>✅ Registered for this event</span>
            </div>
          ) : isMissed ? (
            <button
              disabled
              className="w-full py-3 px-4 bg-slate-200 text-slate-500 rounded-xl text-xs font-bold cursor-not-allowed shadow-none"
            >
              Registration Closed (Concluded)
            </button>
          ) : (
            <button
              id="btn-register-action"
              onClick={() => onNavigateToRegister(event._id)}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-md shadow-primary/30 transition-all touch-scale flex items-center justify-center gap-2"
            >
              <span>Register Now</span>
              <span className="font-extrabold">→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsScreen;

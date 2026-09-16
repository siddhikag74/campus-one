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
  MessageSquare,
  Award,
  Sparkles,
  Lightbulb,
  Edit3,
} from 'lucide-react';
import { api } from '../services/api';
import { useAppData } from '../context/AppDataContext';
import EventInfoChip from '../components/events/EventInfoChip';
import RoundCard from '../components/events/RoundCard';
import AlertBanner from '../components/common/AlertBanner';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import ErrorState from '../components/common/ErrorState';
import RatingStars from '../components/common/RatingStars';
import EventReviewModal from '../components/events/EventReviewModal';

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
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

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

  const handleReviewSubmitted = (updatedReview, stats) => {
    setEvent((prev) => {
      if (!prev) return prev;
      const prevReviews = prev.reviews || [];
      const filtered = prevReviews.filter(
        (r) => r._id?.toString() !== updatedReview._id?.toString() &&
               r.user?._id?.toString() !== updatedReview.user?._id?.toString()
      );
      const newReviews = [updatedReview, ...filtered];
      return {
        ...prev,
        reviews: newReviews,
        userReview: updatedReview,
        averageRating: stats?.averageRating || updatedReview.averageRating || prev.averageRating,
        reviewCount: stats?.reviewCount || newReviews.length,
        categoryAverages: stats?.categoryAverages || prev.categoryAverages,
        ratingBreakdown: stats?.ratingBreakdown || prev.ratingBreakdown,
      };
    });
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


        {/* Comprehensive Student Reviews & Ratings Section */}
        <div id="event-reviews-section" className="bg-surface rounded-2xl p-4 border border-slate-200/80 shadow-subtle space-y-4">
          {/* Section Header with Overall Rating Badge */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-extrabold font-heading text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Student Reviews ({event.reviews?.length || 0})</span>
              </h3>
              <p className="text-[10px] text-slate-400">
                Verified feedback from campus attendees
              </p>
            </div>

            {event.averageRating ? (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="text-xs font-black text-amber-900">
                  {event.averageRating}
                </span>
                <span className="text-[10px] text-amber-700 font-bold">/ 5</span>
              </div>
            ) : (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                New Event
              </span>
            )}
          </div>

          {/* 4 Category Ratings Breakdown Summary */}
          {event.categoryAverages && event.reviews?.length > 0 && (
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-medium block">Overall Experience</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    ⭐ {event.categoryAverages.overall || event.averageRating || '—'}
                  </span>
                  <RatingStars value={Math.round(event.categoryAverages.overall || event.averageRating || 0)} readOnly size="xs" />
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-medium block">Content & Quality</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    ⭐ {event.categoryAverages.contentQuality || event.averageRating || '—'}
                  </span>
                  <RatingStars value={Math.round(event.categoryAverages.contentQuality || event.averageRating || 0)} readOnly size="xs" />
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-medium block">Presentation & Organization</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    ⭐ {event.categoryAverages.presentation || event.averageRating || '—'}
                  </span>
                  <RatingStars value={Math.round(event.categoryAverages.presentation || event.averageRating || 0)} readOnly size="xs" />
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-medium block">Engagement & Usefulness</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    ⭐ {event.categoryAverages.engagement || event.averageRating || '—'}
                  </span>
                  <RatingStars value={Math.round(event.categoryAverages.engagement || event.averageRating || 0)} readOnly size="xs" />
                </div>
              </div>
            </div>
          )}

          {/* Primary Action Button: "Write a Review" / "Edit Your Review" */}
          <div className="pt-1">
            <button
              id="btn-write-review-main"
              onClick={() => setIsReviewModalOpen(true)}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all touch-scale flex items-center justify-center gap-2 shadow-sm ${
                event.userReview
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                  : 'bg-primary hover:bg-primary-hover text-white shadow-primary/20'
              }`}
            >
              {event.userReview ? (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Your Review (Rated {event.userReview.averageRating || event.userReview.ratings?.overall || 5}★)</span>
                </>
              ) : (
                <>
                  <Star className="w-3.5 h-3.5 fill-white" />
                  <span>Write a Review</span>
                </>
              )}
            </button>
          </div>

          {/* Written Reviews List */}
          {event.reviews && event.reviews.length > 0 ? (
            <div className="space-y-3 pt-2">
              {event.reviews.map((r) => {
                const isMyReview = event.userReview && (
                  r._id?.toString() === event.userReview._id?.toString() ||
                  r.user?._id?.toString() === event.userReview.user?._id?.toString()
                );
                const overallScore = r.ratings?.overall || r.averageRating || 5;
                const reviewBody = r.reviewText || r.comment;

                return (
                  <div
                    key={r._id}
                    className={`p-3.5 rounded-2xl border text-xs space-y-2 transition-all ${
                      isMyReview
                        ? 'bg-amber-50/40 border-amber-200/90 shadow-subtle'
                        : 'bg-slate-50 border-slate-200/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
                          {r.user?.name ? r.user.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 leading-tight">
                              {r.user?.name || 'Verified Student'}
                            </span>
                            {isMyReview && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block leading-tight">
                            {r.user?.rollNumber ? `Roll: ${r.user.rollNumber}` : 'Campus Student'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-[11px] font-bold text-slate-800">{overallScore}/5</span>
                        </div>

                        {isMyReview && (
                          <button
                            onClick={() => setIsReviewModalOpen(true)}
                            aria-label="Edit review"
                            className="p-1 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Category mini ratings */}
                    <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 pt-0.5">
                      {r.ratings?.contentQuality && (
                        <span className="bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/60">
                          Content: {r.ratings.contentQuality}★
                        </span>
                      )}
                      {r.ratings?.presentation && (
                        <span className="bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/60">
                          Presentation: {r.ratings.presentation}★
                        </span>
                      )}
                      {r.ratings?.engagement && (
                        <span className="bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/60">
                          Engagement: {r.ratings.engagement}★
                        </span>
                      )}
                    </div>

                    {/* Written Comment */}
                    {reviewBody && (
                      <p className="text-slate-700 text-xs leading-relaxed italic bg-white/70 p-2.5 rounded-xl border border-slate-100">
                        "{reviewBody}"
                      </p>
                    )}

                    {/* Suggestions */}
                    {r.suggestions && (
                      <div className="flex items-start gap-1.5 text-[11px] text-amber-900 bg-amber-50/80 p-2 rounded-xl border border-amber-200/60">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-[10px] text-amber-800 uppercase tracking-wider">
                            Suggestion for Improvement
                          </span>
                          <p className="text-[11px] leading-relaxed">
                            {r.suggestions}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-500 mx-auto flex items-center justify-center">
                <Star className="w-5 h-5 fill-amber-400" />
              </div>
              <p className="text-xs font-bold text-slate-800">No reviews yet</p>
              <p className="text-[11px] text-slate-500 max-w-[220px] mx-auto">
                Be the first student to review this event and share your thoughts!
              </p>
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="px-3.5 py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg hover:bg-primary-hover shadow-xs transition-all touch-scale"
              >
                + Write First Review
              </button>
            </div>
          )}
        </div>

        {/* Review Modal */}
        <EventReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          event={event}
          existingReview={event.userReview}
          onReviewSubmitted={handleReviewSubmitted}
        />
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

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import RatingStars from '../components/common/RatingStars';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

export const ReviewScreen = ({ eventId, onBack, onComplete }) => {
  const { showToast } = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  // 4 required ratings (1-5)
  const [ratings, setRatings] = useState({
    content: 0,
    organisation: 0,
    venue: 0,
    overall: 0,
  });

  // Optional written comment, max 500 chars
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await api.getEventById(eventId);
        setEvent(res.event);
      } catch (err) {
        showToast('Failed to load event details for review', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (eventId) fetchEvent();
  }, [eventId, showToast]);

  // Submit button must remain disabled until all four ratings have been selected
  const allRatingsSelected =
    ratings.content > 0 &&
    ratings.organisation > 0 &&
    ratings.venue > 0 &&
    ratings.overall > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allRatingsSelected) return;

    try {
      setSubmitting(true);
      const res = await api.submitReview(eventId, {
        ratings,
        comment,
      });

      setSubmittedData({
        review: res.review,
        ratings,
        comment,
      });
      showToast('Review submitted successfully! ⭐', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <LoadingSkeleton type="details" />
      </div>
    );
  }

  // After Submission Screen: "Review Submitted!"
  if (submittedData) {
    return (
      <div className="min-h-full bg-campusBg p-4 flex flex-col justify-center items-center text-center animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-500 flex items-center justify-center mb-4 shadow-md shadow-amber-500/10">
          <Star className="w-9 h-9 fill-amber-500 stroke-[1.5]" />
        </div>

        <h2 className="text-xl font-heading font-black text-slate-900 mb-1">
          Review Submitted!
        </h2>
        <p className="text-xs text-slate-500 max-w-[260px] mb-6">
          Thank you for sharing your experience. Your feedback helps clubs and future students!
        </p>

        {/* Rating Summary Card */}
        <div className="w-full max-w-sm bg-surface rounded-2xl p-4 border border-slate-200/80 shadow-card text-left space-y-3 mb-6">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Event
            </span>
            <span className="text-xs font-bold text-slate-900 block truncate">
              {event?.title}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Content Quality</span>
              <RatingStars value={submittedData.ratings.content} readOnly size="sm" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Event Organisation</span>
              <RatingStars value={submittedData.ratings.organisation} readOnly size="sm" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Venue & Logistics</span>
              <RatingStars value={submittedData.ratings.venue} readOnly size="sm" />
            </div>
            <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-100">
              <span className="text-slate-900">Overall Experience</span>
              <RatingStars value={submittedData.ratings.overall} readOnly size="sm" />
            </div>
          </div>

          {submittedData.comment && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Your Written Review
              </span>
              <p className="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                "{submittedData.comment}"
              </p>
            </div>
          )}
        </div>

        <button
          id="btn-review-back-to-event"
          onClick={onBack}
          className="w-full max-w-sm py-3 px-4 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover shadow-md shadow-primary/20 transition-all touch-scale"
        >
          Back to Event
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-campusBg p-4 pb-12 animate-fade-in flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          aria-label="Back"
          className="p-2 rounded-xl bg-surface border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors touch-scale"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-heading font-black text-slate-900 leading-tight">
            Write Event Review
          </h1>
          <p className="text-[11px] text-slate-500 truncate max-w-[240px]">
            {event?.title}
          </p>
        </div>
      </div>

      {/* Event Summary Pill */}
      <div className="bg-surface rounded-2xl p-3 border border-slate-200/80 shadow-subtle mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold font-heading text-slate-800 truncate">
            {event?.title}
          </span>
          <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded-full bg-slate-100">
            Concluded
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {event?.club?.name} &bull; {event?.venue} &bull; {event?.dateStr}
        </p>
      </div>

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        {/* Rating Category 1: Content */}
        <div className="bg-surface rounded-2xl p-3.5 border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 font-heading block">
              Content Rating *
            </span>
            <span className="text-[10px] text-slate-400 block">
              Quality of speaker, topics, or challenges
            </span>
          </div>
          <RatingStars
            value={ratings.content}
            onChange={(val) => setRatings({ ...ratings, content: val })}
            size="md"
          />
        </div>

        {/* Rating Category 2: Organisation */}
        <div className="bg-surface rounded-2xl p-3.5 border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 font-heading block">
              Organisation Rating *
            </span>
            <span className="text-[10px] text-slate-400 block">
              Timekeeping, schedule, and volunteer support
            </span>
          </div>
          <RatingStars
            value={ratings.organisation}
            onChange={(val) => setRatings({ ...ratings, organisation: val })}
            size="md"
          />
        </div>

        {/* Rating Category 3: Venue */}
        <div className="bg-surface rounded-2xl p-3.5 border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 font-heading block">
              Venue Rating *
            </span>
            <span className="text-[10px] text-slate-400 block">
              Seating, audiovisuals, and comfort
            </span>
          </div>
          <RatingStars
            value={ratings.venue}
            onChange={(val) => setRatings({ ...ratings, venue: val })}
            size="md"
          />
        </div>

        {/* Rating Category 4: Overall */}
        <div className="bg-surface rounded-2xl p-3.5 border border-slate-200/80 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 font-heading block">
              Overall Experience *
            </span>
            <span className="text-[10px] text-slate-400 block">
              Your overall impression of the event
            </span>
          </div>
          <RatingStars
            value={ratings.overall}
            onChange={(val) => setRatings({ ...ratings, overall: val })}
            size="md"
          />
        </div>

        {/* Optional Written Review */}
        <div className="bg-surface rounded-2xl p-3.5 border border-slate-200/80 shadow-subtle space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 font-heading">
              Written Feedback (Optional)
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              {comment.length}/500
            </span>
          </div>

          <textarea
            maxLength={500}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like most? What can be improved?"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder-slate-400"
          />
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            id="btn-submit-review"
            disabled={!allRatingsSelected || submitting}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold shadow-md transition-all touch-scale flex items-center justify-center gap-2 ${
              allRatingsSelected
                ? 'bg-primary hover:bg-primary-hover text-white shadow-primary/25 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {submitting ? (
              <span>Submitting Review...</span>
            ) : !allRatingsSelected ? (
              <span>Select all 4 ratings to submit</span>
            ) : (
              <>
                <span>Submit Review</span>
                <span className="font-extrabold">★</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewScreen;

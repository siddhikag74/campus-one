import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  AlertCircle,
  Award,
  Sparkles,
  Lightbulb,
  MessageSquare,
  Loader2,
  Edit3,
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import RatingStars from '../components/common/RatingStars';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

const RATING_CATEGORIES = [
  {
    key: 'overall',
    label: 'Overall Experience',
    description: 'Your overall impression and experience with the event',
    icon: Star,
  },
  {
    key: 'contentQuality',
    label: 'Content & Quality',
    description: 'Quality of speakers, technical depth, and actionable knowledge',
    icon: Award,
  },
  {
    key: 'presentation',
    label: 'Presentation & Organization',
    description: 'Timekeeping, logistics, slides, and coordination',
    icon: Sparkles,
  },
  {
    key: 'engagement',
    label: 'Engagement & Usefulness',
    description: 'Practical takeaways, networking, and hands-on participation',
    icon: Lightbulb,
  },
];

const RATING_DESCRIPTORS = {
  1: 'Needs Work (1/5)',
  2: 'Fair (2/5)',
  3: 'Good (3/5)',
  4: 'Very Good (4/5)',
  5: 'Exceptional (5/5)',
};

export const ReviewScreen = ({ eventId, onBack, onComplete }) => {
  const { showToast } = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [error, setError] = useState(null);

  // 4 required ratings (1-5)
  const [ratings, setRatings] = useState({
    overall: 0,
    contentQuality: 0,
    presentation: 0,
    engagement: 0,
  });

  // Text inputs with limits
  const [reviewText, setReviewText] = useState('');
  const [suggestions, setSuggestions] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getEventById(eventId);
        setEvent(res.event);

        // Pre-fill if user has an existing review
        if (res.event?.userReview) {
          const prev = res.event.userReview;
          setIsEditing(true);
          setRatings({
            overall: prev.ratings?.overall || 0,
            contentQuality: prev.ratings?.contentQuality || prev.ratings?.content || 0,
            presentation: prev.ratings?.presentation || prev.ratings?.organisation || 0,
            engagement: prev.ratings?.engagement || prev.ratings?.venue || 0,
          });
          setReviewText(prev.reviewText || prev.comment || '');
          setSuggestions(prev.suggestions || '');
        }
      } catch (err) {
        setError(err.message || 'Failed to load event details for review');
        showToast('Failed to load event details for review', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (eventId) fetchEvent();
  }, [eventId, showToast]);

  const selectedValues = [
    ratings.overall,
    ratings.contentQuality,
    ratings.presentation,
    ratings.engagement,
  ].filter((v) => v > 0);

  const ratedCount = selectedValues.length;
  const allRatingsSelected = ratedCount === 4;

  const liveAverage =
    ratedCount > 0
      ? (selectedValues.reduce((a, b) => a + b, 0) / ratedCount).toFixed(1)
      : '0.0';

  const handleRatingChange = (key, val) => {
    setRatings((prev) => ({ ...prev, [key]: val }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allRatingsSelected) {
      setError('Please select ratings (1–5 stars) for all 4 criteria.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        ratings,
        reviewText: reviewText.trim(),
        comment: reviewText.trim(),
        suggestions: suggestions.trim(),
      };

      const res = await api.submitReview(eventId, payload);

      setSubmittedData({
        review: res.review,
        ratings,
        reviewText,
        suggestions,
        isUpdate: res.isUpdate || isEditing,
      });

      showToast(
        isEditing
          ? 'Your review has been updated! ⭐'
          : 'Review published successfully! ⭐',
        'success'
      );
    } catch (err) {
      setError(err.message || 'Failed to submit review');
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

  // After Submission Screen
  if (submittedData) {
    return (
      <div className="min-h-full bg-campusBg p-4 flex flex-col justify-center items-center text-center animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-500 flex items-center justify-center mb-4 shadow-md shadow-amber-500/10">
          <Star className="w-9 h-9 fill-amber-500 stroke-[1.5]" />
        </div>

        <h2 className="text-xl font-heading font-black text-slate-900 mb-1">
          {submittedData.isUpdate ? 'Review Updated!' : 'Review Published!'}
        </h2>
        <p className="text-xs text-slate-500 max-w-[280px] mb-6">
          Thank you for rating {event?.title}. Your feedback helps clubs and fellow students!
        </p>

        {/* Rating Summary Card */}
        <div className="w-full max-w-sm bg-surface rounded-2xl p-4 border border-slate-200/80 shadow-card text-left space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Event
              </span>
              <span className="text-xs font-bold text-slate-900 block truncate max-w-[200px]">
                {event?.title}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Overall Score
              </span>
              <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                ⭐ {liveAverage} / 5.0
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Overall Experience</span>
              <RatingStars value={submittedData.ratings.overall} readOnly size="sm" showScore />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Content & Quality</span>
              <RatingStars value={submittedData.ratings.contentQuality} readOnly size="sm" showScore />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Presentation & Organization</span>
              <RatingStars value={submittedData.ratings.presentation} readOnly size="sm" showScore />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Engagement & Usefulness</span>
              <RatingStars value={submittedData.ratings.engagement} readOnly size="sm" showScore />
            </div>
          </div>

          {submittedData.reviewText && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Your Review
              </span>
              <p className="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                "{submittedData.reviewText}"
              </p>
            </div>
          )}

          {submittedData.suggestions && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Suggestions for Improvement
              </span>
              <p className="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                "{submittedData.suggestions}"
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
    <div className="min-h-full bg-campusBg p-4 pb-16 animate-fade-in flex flex-col">
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
          <h1 className="text-base font-heading font-black text-slate-900 leading-tight flex items-center gap-2">
            <span>{isEditing ? 'Edit Your Review' : 'Write Event Review'}</span>
            {isEditing && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                Editing
              </span>
            )}
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
            {event?.category || 'Event'}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {event?.club?.name} &bull; {event?.venue} &bull; {event?.dateStr}
        </p>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5 flex-1">
        {/* Section 1: Ratings */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold font-heading text-slate-800">
            1. Rate Event Experience (All 4 Required)
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              allRatingsSelected
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {ratedCount}/4 Rated
          </span>
        </div>

        <div className="space-y-2.5">
          {RATING_CATEGORIES.map((cat) => {
            const val = ratings[cat.key] || 0;
            const Icon = cat.icon;
            const descriptor = RATING_DESCRIPTORS[val];

            return (
              <div
                key={cat.key}
                id={`rating-row-${cat.key}`}
                className={`p-3.5 rounded-2xl border transition-all ${
                  val > 0
                    ? 'bg-surface border-amber-200/90 shadow-subtle'
                    : 'bg-surface border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        val > 0
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">
                        {cat.label} *
                      </span>
                      <span className="text-[10px] text-slate-400 block leading-tight">
                        {cat.description}
                      </span>
                    </div>
                  </div>

                  {/* Selected rating display */}
                  <span
                    className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md shrink-0 transition-colors ${
                      val > 0
                        ? 'bg-amber-100 text-amber-800 border border-amber-300/80'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {val > 0 ? `${val}/5` : 'Not Rated'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <RatingStars
                    value={val}
                    onChange={(newVal) => handleRatingChange(cat.key, newVal)}
                    size="md"
                  />
                  <span className="text-[11px] font-medium text-slate-500 italic">
                    {descriptor || 'Tap stars to rate'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Section 2: Write Your Review */}
        <div className="bg-surface rounded-2xl p-3.5 border border-slate-200/80 shadow-subtle space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="screen-review-text"
              className="text-xs font-bold text-slate-800 font-heading flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span>2. Write Your Review</span>
            </label>
            <span
              className={`text-[10px] font-mono ${
                reviewText.length > 900
                  ? 'text-rose-600 font-bold'
                  : 'text-slate-400'
              }`}
            >
              {reviewText.length}/1000
            </span>
          </div>

          <textarea
            id="screen-review-text"
            maxLength={1000}
            rows={3}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="What were the best takeaways? How was the organization and content? Share your thoughts..."
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder-slate-400"
          />
        </div>

        {/* Section 3: Suggestions for Improvement */}
        <div className="bg-surface rounded-2xl p-3.5 border border-slate-200/80 shadow-subtle space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="screen-suggestions-text"
              className="text-xs font-bold text-slate-800 font-heading flex items-center gap-1.5"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>3. Suggestions for Improvement (Optional)</span>
            </label>
            <span
              className={`text-[10px] font-mono ${
                suggestions.length > 450
                  ? 'text-rose-600 font-bold'
                  : 'text-slate-400'
              }`}
            >
              {suggestions.length}/500
            </span>
          </div>

          <textarea
            id="screen-suggestions-text"
            maxLength={500}
            rows={2}
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value)}
            placeholder="Ideas for next time: topics you'd like covered, logistics improvements, or timing adjustments..."
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none placeholder-slate-400"
          />
        </div>

        {/* Live Rating Summary Preview */}
        <div className="bg-gradient-to-br from-indigo-50/80 via-slate-50 to-amber-50/60 rounded-2xl p-3.5 border border-indigo-100/90 shadow-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-900 font-heading">
              Rating Summary Preview
            </span>
            <div className="flex items-center gap-1 text-xs font-black text-amber-600 bg-white/90 px-2.5 py-0.5 rounded-full border border-amber-200/70 shadow-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{liveAverage} / 5.0</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {RATING_CATEGORIES.map((cat) => {
              const score = ratings[cat.key];
              return (
                <span
                  key={cat.key}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
                    score > 0
                      ? 'bg-white text-slate-800 border-slate-200 shadow-xs'
                      : 'bg-slate-100 text-slate-400 border-slate-200/50'
                  }`}
                >
                  {cat.label.split(' ')[0]}: {score > 0 ? `${score}★` : '—'}
                </span>
              );
            })}
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            id="btn-submit-review"
            disabled={!allRatingsSelected || submitting}
            className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold shadow-md transition-all touch-scale flex items-center justify-center gap-2 ${
              allRatingsSelected && !submitting
                ? 'bg-primary hover:bg-primary-hover text-white shadow-primary/25 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isEditing ? 'Updating Review...' : 'Publishing Review...'}</span>
              </>
            ) : !allRatingsSelected ? (
              <span>Select all 4 ratings to submit ({ratedCount}/4)</span>
            ) : (
              <>
                <span>{isEditing ? 'Update Review' : 'Submit Review'}</span>
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


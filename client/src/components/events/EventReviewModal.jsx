import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Lightbulb,
  Award,
  Loader2,
  Edit3,
} from 'lucide-react';
import RatingStars from '../common/RatingStars';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const RATING_CATEGORIES = [
  {
    key: 'overall',
    label: 'Overall Experience',
    description: 'Your overall rating and impression of the event',
    icon: Star,
  },
  {
    key: 'contentQuality',
    label: 'Content & Quality',
    description: 'Depth of material, speakers, tasks, and takeaways',
    icon: Award,
  },
  {
    key: 'presentation',
    label: 'Presentation & Organization',
    description: 'Schedule adherence, coordination, and clarity',
    icon: Sparkles,
  },
  {
    key: 'engagement',
    label: 'Engagement & Usefulness',
    description: 'Practical value, audience interaction, and relevance',
    icon: Lightbulb,
  },
];

const RATING_DESCRIPTORS = {
  1: 'Needs Improvement',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Exceptional!',
};

export const EventReviewModal = ({
  isOpen,
  onClose,
  event,
  existingReview = null,
  onReviewSubmitted,
}) => {
  const { showToast } = useToast();

  const [ratings, setRatings] = useState({
    overall: 0,
    contentQuality: 0,
    presentation: 0,
    engagement: 0,
  });

  const [reviewText, setReviewText] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedReview, setSubmittedReview] = useState(null);

  // Pre-fill if editing existing review
  useEffect(() => {
    if (existingReview) {
      setRatings({
        overall: existingReview.ratings?.overall || 0,
        contentQuality:
          existingReview.ratings?.contentQuality ||
          existingReview.ratings?.content ||
          0,
        presentation:
          existingReview.ratings?.presentation ||
          existingReview.ratings?.organisation ||
          0,
        engagement:
          existingReview.ratings?.engagement ||
          existingReview.ratings?.venue ||
          0,
      });
      setReviewText(
        existingReview.reviewText || existingReview.comment || ''
      );
      setSuggestions(existingReview.suggestions || '');
    } else {
      setRatings({
        overall: 0,
        contentQuality: 0,
        presentation: 0,
        engagement: 0,
      });
      setReviewText('');
      setSuggestions('');
    }
    setError(null);
    setIsSuccess(false);
    setSubmittedReview(null);
  }, [existingReview, isOpen]);

  if (!isOpen || !event) return null;

  const isEditing = Boolean(existingReview);

  // Calculate live average of selected categories
  const selectedValues = [
    ratings.overall,
    ratings.contentQuality,
    ratings.presentation,
    ratings.engagement,
  ].filter((v) => v > 0);

  const ratedCount = selectedValues.length;
  const isComplete = ratedCount === 4;

  const currentAverage =
    ratedCount > 0
      ? (
          selectedValues.reduce((a, b) => a + b, 0) / ratedCount
        ).toFixed(1)
      : '0.0';

  const handleRatingChange = (key, value) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isComplete) {
      setError('Please rate all 4 categories (1 to 5 stars) to proceed.');
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

      const res = await api.submitReview(event._id, payload);

      setIsSuccess(true);
      setSubmittedReview(res.review);
      showToast(
        isEditing
          ? 'Your review has been updated! ⭐'
          : 'Thank you! Your review has been submitted. ⭐',
        'success'
      );

      if (onReviewSubmitted) {
        onReviewSubmitted(res.review, res.stats);
      }
    } catch (err) {
      console.error('Review submission error:', err);
      setError(err.message || 'Failed to submit review. Please try again.');
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg bg-surface rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-review-title"
      >
        {/* Modal Header */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/40">
          <div className="pr-6">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">
                {isEditing ? '✏️ Edit Review' : '⭐ Write Review'}
              </span>
              <span className="text-[11px] text-slate-300 truncate max-w-[200px]">
                {event.category || 'Event'}
              </span>
            </div>
            <h2
              id="modal-review-title"
              className="text-base sm:text-lg font-heading font-black text-white leading-tight truncate max-w-[320px]"
            >
              {event.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            aria-label="Close review modal"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors touch-scale"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Success State */}
          {isSuccess ? (
            <div className="py-6 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-500 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10">
                <Star className="w-9 h-9 fill-amber-500 stroke-[1.5]" />
              </div>

              <div>
                <h3 className="text-lg font-heading font-black text-slate-900">
                  {isEditing ? 'Review Updated!' : 'Review Submitted!'}
                </h3>
                <p className="text-xs text-slate-500 max-w-[280px] mx-auto mt-1">
                  Your feedback helps clubs enhance future events and guides fellow students across campus.
                </p>
              </div>

              {/* Submitted Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left space-y-2.5 max-w-sm mx-auto">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-xs font-bold text-slate-700">Average Rating Given</span>
                  <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    ⭐ {currentAverage} / 5.0
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                  <div>
                    <span className="block text-slate-400 text-[10px]">Overall:</span>
                    <span className="font-bold text-slate-800">{ratings.overall}/5 Stars</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px]">Content & Quality:</span>
                    <span className="font-bold text-slate-800">{ratings.contentQuality}/5 Stars</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px]">Presentation:</span>
                    <span className="font-bold text-slate-800">{ratings.presentation}/5 Stars</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px]">Engagement:</span>
                    <span className="font-bold text-slate-800">{ratings.engagement}/5 Stars</span>
                  </div>
                </div>

                {reviewText && (
                  <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-700 italic">
                    "{reviewText}"
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full max-w-sm py-3 px-4 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover shadow-md shadow-primary/20 transition-all touch-scale"
              >
                Done & Return to Event
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Banner */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Instruction Prompt */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 font-heading">
                  1. Rate Event Experience (All 4 Required)
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isComplete
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {ratedCount}/4 Rated
                </span>
              </div>

              {/* 4 Interactive Category Star Ratings */}
              <div className="space-y-2.5">
                {RATING_CATEGORIES.map((cat) => {
                  const val = ratings[cat.key] || 0;
                  const Icon = cat.icon;
                  const descriptor = RATING_DESCRIPTORS[val];

                  return (
                    <div
                      key={cat.key}
                      id={`rating-row-${cat.key}`}
                      className={`p-3 rounded-2xl border transition-all ${
                        val > 0
                          ? 'bg-slate-50/80 border-amber-200/80 shadow-subtle'
                          : 'bg-surface border-slate-200/70 hover:border-slate-300'
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
                            <span className="text-[10px] text-slate-500 block leading-tight">
                              {cat.description}
                            </span>
                          </div>
                        </div>

                        {/* Selected Rating Badge */}
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

                      {/* Stars Row with Hover/Click */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <RatingStars
                          value={val}
                          onChange={(newVal) => handleRatingChange(cat.key, newVal)}
                          size="md"
                        />
                        <span className="text-[11px] font-medium text-slate-500 italic">
                          {descriptor || 'Click stars to rate'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Section 2: Written Feedback */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="review-written-text"
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
                    id="review-written-text"
                    maxLength={1000}
                    rows={3}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share what you liked, key insights gained, speaker highlights, and overall quality..."
                    className="w-full p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none placeholder-slate-400"
                  />
                </div>

                {/* Section 3: Suggestions for Improvement */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="review-suggestions-text"
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
                    id="review-suggestions-text"
                    maxLength={500}
                    rows={2}
                    value={suggestions}
                    onChange={(e) => setSuggestions(e.target.value)}
                    placeholder="Ideas on how organizers can make the next edition even better (e.g. venue, timing, hands-on labs)..."
                    className="w-full p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Live Rating Summary Card Before Submission */}
              <div className="bg-gradient-to-br from-indigo-50/80 via-slate-50 to-amber-50/60 rounded-2xl p-3.5 border border-indigo-100/90 shadow-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-900 font-heading">
                    Rating Summary Preview
                  </span>
                  <div className="flex items-center gap-1 text-xs font-black text-amber-600 bg-white/90 px-2.5 py-0.5 rounded-full border border-amber-200/70 shadow-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{currentAverage} / 5.0</span>
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
                        {cat.label.split(' ')[0]}:{' '}
                        {score > 0 ? `${score}★` : '—'}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="w-1/3 py-3 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors touch-scale"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  id="btn-submit-review-modal"
                  disabled={!isComplete || submitting}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold shadow-md transition-all touch-scale flex items-center justify-center gap-2 ${
                    isComplete && !submitting
                      ? 'bg-primary hover:bg-primary-hover text-white shadow-primary/25 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isEditing ? 'Updating Review...' : 'Submitting Review...'}</span>
                    </>
                  ) : !isComplete ? (
                    <span>Rate all 4 categories ({ratedCount}/4)</span>
                  ) : (
                    <>
                      <span>{isEditing ? 'Update Review' : 'Submit Review'}</span>
                      <span className="font-extrabold">★</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventReviewModal;

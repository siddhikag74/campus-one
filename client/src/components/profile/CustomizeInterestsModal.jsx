import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Sparkles,
  Layers,
  AlertCircle,
  Loader2,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { MAIN_INTERESTS, CREATIVITY_SUBCATEGORIES } from '../../constants/interests';

export const CustomizeInterestsModal = ({ isOpen, onClose, onUpdated }) => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [initialInterests, setInitialInterests] = useState([]);
  const [initialSubCategories, setInitialSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch authenticated user's saved interests on open
  useEffect(() => {
    const fetchCurrentInterests = async () => {
      if (!isOpen) return;
      try {
        setLoading(true);
        setErrorMessage('');
        
        // Try fetching fresh from API, fallback to current user context
        let currentInterests = user?.interests || [];
        let currentSubCategories = user?.interestSubCategories || [];

        try {
          const res = await api.getProfileInterests();
          if (res.success) {
            currentInterests = res.interests || [];
            currentSubCategories = res.interestSubCategories || [];
          }
        } catch (apiErr) {
          console.warn('Using context user interests fallback:', apiErr);
        }

        setSelectedInterests(currentInterests);
        setSelectedSubCategories(currentSubCategories);
        setInitialInterests(currentInterests);
        setInitialSubCategories(currentSubCategories);
      } catch (err) {
        console.error('Failed to load user interests:', err);
        setErrorMessage('Failed to load your current interest preferences.');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentInterests();
  }, [isOpen, user]);

  if (!isOpen) return null;

  const toggleInterest = (interestId) => {
    setSelectedInterests((prev) => {
      const isSelected = prev.includes(interestId);
      if (isSelected) {
        if (interestId === 'Creativity') {
          setSelectedSubCategories([]);
        }
        return prev.filter((id) => id !== interestId);
      } else {
        return [...prev, interestId];
      }
    });
    if (errorMessage) setErrorMessage('');
  };

  const toggleSubCategory = (subId) => {
    setSelectedSubCategories((prev) => {
      if (prev.includes(subId)) {
        return prev.filter((id) => id !== subId);
      } else {
        return [...prev, subId];
      }
    });
  };

  const selectAllSubcategories = () => {
    if (selectedSubCategories.length === CREATIVITY_SUBCATEGORIES.length) {
      setSelectedSubCategories([]);
    } else {
      setSelectedSubCategories(CREATIVITY_SUBCATEGORIES.map((s) => s.id));
    }
  };

  const handleResetToInitial = () => {
    setSelectedInterests(initialInterests);
    setSelectedSubCategories(initialSubCategories);
    setErrorMessage('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (selectedInterests.length === 0) {
      setErrorMessage('Please select at least one interest to personalize your campus recommendations.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage('');

      const payload = {
        interests: selectedInterests,
        interestSubCategories: selectedInterests.includes('Creativity')
          ? selectedSubCategories
          : [],
      };

      const res = await api.updateProfileInterests(payload);

      if (res.success) {
        showToast('Your interests have been updated.', 'success');
        if (refreshUser) await refreshUser();
        if (onUpdated) onUpdated(res.user || payload);
        onClose();
      } else {
        setErrorMessage(res.message || 'Failed to update interests.');
        showToast(res.message || 'Failed to update interests', 'error');
      }
    } catch (err) {
      console.error('Error saving customized interests:', err);
      setErrorMessage(err.message || 'Failed to save interests. Please try again.');
      showToast(err.message || 'Failed to save interests', 'error');
    } finally {
      setSaving(false);
    }
  };

  const totalSelectedCount = selectedInterests.length;
  const isCreativitySelected = selectedInterests.includes('Creativity');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        className="relative w-full max-w-3xl bg-surface rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-customize-interests-title"
      >
        {/* Modal Header */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-primary to-violet-500 text-white flex items-center justify-center shadow-md shadow-primary/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="modal-customize-interests-title"
                className="text-base sm:text-lg font-heading font-black text-white leading-tight"
              >
                Customize Interests
              </h2>
              <p className="text-[11px] text-slate-300">
                Personalize your event recommendations and campus feed
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={saving}
            aria-label="Close modal"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors touch-scale"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Loading State */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs font-bold text-slate-600">
                Loading your saved preferences...
              </p>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Status Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold font-heading text-slate-900 uppercase tracking-wider">
                    Select Your Categories
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-colors ${
                      totalSelectedCount > 0
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {totalSelectedCount} of {MAIN_INTERESTS.length} Selected
                  </span>
                </div>

                {initialInterests.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetToInitial}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Responsive Interests Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MAIN_INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest.id);
                  const Icon = interest.icon;

                  return (
                    <div
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      className={`group relative p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex items-start justify-between gap-3 touch-scale select-none ${
                        isSelected
                          ? `bg-gradient-to-br ${interest.color} shadow-sm ring-1 ring-primary/20`
                          : 'bg-surface border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg transition-transform duration-200 group-hover:scale-105 shrink-0 ${
                            isSelected
                              ? 'bg-white shadow-xs shadow-black/5'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span className="text-base">{interest.emoji}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-heading font-extrabold text-sm text-slate-900 leading-tight">
                              {interest.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">
                            {interest.tagline}
                          </p>
                        </div>
                      </div>

                      {/* Checkbox Indicator */}
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-primary text-white shadow-xs'
                            : 'border-2 border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Creativity Subcategories Section */}
              {isCreativitySelected && (
                <div className="p-4 bg-gradient-to-br from-fuchsia-50/70 via-pink-50/40 to-slate-50 rounded-2xl border border-fuchsia-200/80 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🎨</span>
                      <span className="text-xs font-extrabold font-heading text-fuchsia-950 uppercase tracking-wider">
                        Creativity Sub-specializations (Optional)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={selectAllSubcategories}
                      className="text-[11px] font-bold text-fuchsia-700 hover:text-fuchsia-900 transition-colors"
                    >
                      {selectedSubCategories.length === CREATIVITY_SUBCATEGORIES.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {CREATIVITY_SUBCATEGORIES.map((sub) => {
                      const isSubSelected = selectedSubCategories.includes(sub.id);
                      const SubIcon = sub.icon;

                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => toggleSubCategory(sub.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all touch-scale flex items-center gap-1.5 ${
                            isSubSelected
                              ? 'bg-fuchsia-600 text-white shadow-xs shadow-fuchsia-500/20'
                              : 'bg-white text-slate-700 border border-slate-200/80 hover:border-fuchsia-300'
                          }`}
                        >
                          <SubIcon className="w-3.5 h-3.5" />
                          <span>{sub.name}</span>
                          {isSubSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors touch-scale"
          >
            Cancel
          </button>

          <button
            type="button"
            id="btn-save-customized-interests"
            onClick={handleSave}
            disabled={loading || saving || selectedInterests.length === 0}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all touch-scale flex items-center justify-center gap-2 ${
              selectedInterests.length > 0 && !saving
                ? 'bg-primary hover:bg-primary-hover text-white shadow-primary/25 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Interests...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Interests</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizeInterestsModal;

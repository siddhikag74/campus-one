import React, { useState } from 'react';
import { 
  Check, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  LogOut, 
  Palette, 
  Laptop, 
  Coins, 
  Flame, 
  Music, 
  Trophy, 
  Shirt, 
  Camera, 
  Landmark, 
  Gamepad2,
  Brush,
  Video,
  PenTool,
  Feather,
  Paintbrush
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MAIN_INTERESTS = [
  {
    id: 'Tech',
    name: 'Tech',
    emoji: '💻',
    icon: Laptop,
    tagline: 'Hackathons, coding & AI workshops',
    color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/30 text-blue-600',
    activeBadge: 'bg-blue-600 text-white',
  },
  {
    id: 'Finance',
    name: 'Finance',
    emoji: '💰',
    icon: Coins,
    tagline: 'Competitions, investing & case studies',
    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-600',
    activeBadge: 'bg-emerald-600 text-white',
  },
  {
    id: 'Dance',
    name: 'Dance',
    emoji: '💃',
    icon: Flame,
    tagline: 'Auditions, workshops & choreography',
    color: 'from-rose-500/10 to-pink-500/10 border-rose-500/30 text-rose-600',
    activeBadge: 'bg-rose-600 text-white',
  },
  {
    id: 'Music',
    name: 'Music',
    emoji: '🎵',
    icon: Music,
    tagline: 'Concerts, jams & acoustics',
    color: 'from-purple-500/10 to-violet-500/10 border-purple-500/30 text-purple-600',
    activeBadge: 'bg-purple-600 text-white',
  },
  {
    id: 'Sports',
    name: 'Sports',
    emoji: '⚽',
    icon: Trophy,
    tagline: 'Tournaments, leagues & athletics',
    color: 'from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-600',
    activeBadge: 'bg-amber-600 text-white',
  },
  {
    id: 'Creativity',
    name: 'Creativity',
    emoji: '🎨',
    icon: Palette,
    tagline: 'Art, design, writing & content creation',
    hasSubcategories: true,
    color: 'from-fuchsia-500/10 to-pink-500/10 border-fuchsia-500/30 text-fuchsia-600',
    activeBadge: 'bg-fuchsia-600 text-white',
  },
  {
    id: 'Fashion',
    name: 'Fashion',
    emoji: '👗',
    icon: Shirt,
    tagline: 'Styling, runway & apparel trends',
    color: 'from-pink-500/10 to-rose-500/10 border-pink-500/30 text-pink-600',
    activeBadge: 'bg-pink-600 text-white',
  },
  {
    id: 'Photography',
    name: 'Photography',
    emoji: '📸',
    icon: Camera,
    tagline: 'Photowalks, frames & cinematography',
    color: 'from-cyan-500/10 to-blue-500/10 border-cyan-500/30 text-cyan-600',
    activeBadge: 'bg-cyan-600 text-white',
  },
  {
    id: 'Architecture',
    name: 'Architecture',
    emoji: '🏛️',
    icon: Landmark,
    tagline: 'Spatial design, drafting & structures',
    color: 'from-stone-500/10 to-zinc-500/10 border-stone-500/30 text-stone-600',
    activeBadge: 'bg-stone-700 text-white',
  },
  {
    id: 'Gaming',
    name: 'Gaming',
    emoji: '🎮',
    icon: Gamepad2,
    tagline: 'Esports, tournaments & gaming hubs',
    color: 'from-violet-500/10 to-indigo-500/10 border-violet-500/30 text-violet-600',
    activeBadge: 'bg-violet-600 text-white',
  },
];

const CREATIVITY_SUBCATEGORIES = [
  { id: 'Creative Art', name: 'Creative Art', icon: Brush },
  { id: 'Media', name: 'Media', icon: Video },
  { id: 'Content Creation', name: 'Content Creation', icon: Sparkles },
  { id: 'Design', name: 'Design', icon: PenTool },
  { id: 'Writing', name: 'Writing', icon: Feather },
  { id: 'Illustration', name: 'Illustration', icon: Paintbrush },
];

export const InterestSelectionScreen = () => {
  const { user, saveInterests, logout } = useAuth();

  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const toggleInterest = (interestId) => {
    setSelectedInterests((prev) => {
      const isSelected = prev.includes(interestId);
      if (isSelected) {
        // If deselecting Creativity, also clean up subcategories
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

  const handleContinue = async () => {
    if (selectedInterests.length === 0) {
      setErrorMessage('Please pick at least one interest to personalize your dashboard.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    const res = await saveInterests({
      interests: selectedInterests,
      interestSubCategories: selectedInterests.includes('Creativity') ? selectedSubCategories : [],
    });

    setSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.message || 'Could not save your preferences. Please try again.');
    }
  };

  const totalSelectedCount = selectedInterests.length;
  const isCreativitySelected = selectedInterests.includes('Creativity');

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between selection:bg-primary/20">
      {/* Top Brand Bar */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-violet-600 text-white font-black font-heading text-base flex items-center justify-center shadow-md shadow-primary/25">
            C
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-heading font-extrabold text-slate-900 text-sm tracking-tight">
                CampusOne
              </span>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.2 rounded-full">
                Step 2 of 2
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Personalized Setup</p>
          </div>
        </div>

        {/* User Badge & Sign Out */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-right">
            <div>
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {user?.name || 'Student'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">
                {user?.email}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
              {user?.avatar || 'CO'}
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-50 to-indigo-50 border border-primary/20 text-primary px-3.5 py-1.5 rounded-full text-xs font-bold mb-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" style={{ animationDuration: '8s' }} />
            <span>Customize Your Feed</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 tracking-tight leading-tight">
            What are you into?
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium mt-2 max-w-lg mx-auto leading-relaxed">
            Pick your interests and we’ll make your campus experience more personal.
          </p>

          {/* Dynamic Selection Indicator Counter */}
          <div className="mt-4 inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full shadow-xs border border-slate-200/80 text-xs font-bold text-slate-700">
            <span className={`w-2 h-2 rounded-full ${totalSelectedCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            <span>
              {totalSelectedCount === 0
                ? 'Select 1 or more interests to continue'
                : `${totalSelectedCount} ${totalSelectedCount === 1 ? 'interest' : 'interests'} selected`}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="max-w-xl mx-auto mb-6 p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs font-semibold text-rose-700 flex items-center justify-between animate-in fade-in duration-200">
            <span>⚠️ {errorMessage}</span>
            <button
              onClick={() => setErrorMessage('')}
              className="text-rose-500 hover:text-rose-800 text-sm font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Interest Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-6">
          {MAIN_INTERESTS.map((item) => {
            const isSelected = selectedInterests.includes(item.id);
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleInterest(item.id)}
                className={`relative group text-left p-4 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[128px] select-none ${
                  isSelected
                    ? 'bg-white ring-2 ring-primary shadow-lg shadow-primary/10 -translate-y-1'
                    : 'bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                {/* Selection Checkmark Badge */}
                <div className="flex items-start justify-between w-full mb-2">
                  <div className="text-2xl sm:text-3xl transform group-hover:scale-110 transition-transform">
                    {item.emoji}
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-primary text-white scale-100 shadow-xs'
                        : 'bg-slate-100 text-slate-300 group-hover:bg-slate-200'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${isSelected ? 'stroke-[3]' : 'opacity-0'}`} />
                  </div>
                </div>

                {/* Name & Tagline */}
                <div>
                  <h3 className={`font-heading font-extrabold text-sm sm:text-base leading-snug ${isSelected ? 'text-primary' : 'text-slate-900'}`}>
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                    {item.tagline}
                  </p>
                </div>

                {/* Special Creativity Sub-badge hint */}
                {item.hasSubcategories && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50/80 px-2 py-0.5 rounded-md self-start">
                    <Layers className="w-3 h-3" />
                    <span>Includes sub-fields</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Creativity Subcategories Section (Appears when Creativity is selected) */}
        {isCreativitySelected && (
          <div className="bg-gradient-to-br from-fuchsia-50/70 via-purple-50/50 to-white rounded-3xl p-5 sm:p-6 border border-fuchsia-200/80 shadow-sm mb-8 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-fuchsia-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎨</span>
                  <h4 className="font-heading font-extrabold text-slate-900 text-sm sm:text-base">
                    Creativity Sub-Categories
                  </h4>
                  <span className="text-[10px] font-bold bg-fuchsia-100 text-fuchsia-700 px-2 py-0.5 rounded-full">
                    {selectedSubCategories.length} selected
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Select the creative niches you’d like highlighted in your feed.
                </p>
              </div>

              <button
                type="button"
                onClick={selectAllSubcategories}
                className="text-xs font-bold text-fuchsia-700 hover:text-fuchsia-900 hover:underline self-start sm:self-auto cursor-pointer"
              >
                {selectedSubCategories.length === CREATIVITY_SUBCATEGORIES.length
                  ? 'Clear All'
                  : 'Select All Subcategories'}
              </button>
            </div>

            {/* Subcategories Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {CREATIVITY_SUBCATEGORIES.map((sub) => {
                const isSubSelected = selectedSubCategories.includes(sub.id);
                const SubIcon = sub.icon;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => toggleSubCategory(sub.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                      isSubSelected
                        ? 'bg-fuchsia-600 text-white shadow-sm ring-1 ring-fuchsia-600 scale-[1.02]'
                        : 'bg-white hover:bg-fuchsia-50/80 text-slate-700 border border-fuchsia-200/60 shadow-xs'
                    }`}
                  >
                    <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubSelected ? 'text-white' : 'text-fuchsia-600'}`} />
                    <span className="truncate flex-1">{sub.name}</span>
                    {isSubSelected && <Check className="w-3 h-3 stroke-[3] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Callout Info */}
        <div className="bg-slate-100/70 rounded-2xl p-4 border border-slate-200/60 text-center max-w-xl mx-auto">
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            💡 <strong className="text-slate-700">One-time setup:</strong> You won't be asked again on future sign-ins. You can fine-tune these preferences anytime in your Profile.
          </p>
        </div>
      </main>

      {/* Sticky Bottom Action Bar */}
      <footer className="w-full bg-white/95 backdrop-blur-md border-t border-slate-200/80 py-4 px-4 sm:px-8 sticky bottom-0 z-30 shadow-lg shadow-slate-900/5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-medium text-center sm:text-left">
            {totalSelectedCount > 0 ? (
              <span>
                Personalizing dashboard for{' '}
                <strong className="text-primary font-bold">
                  {selectedInterests.slice(0, 3).join(', ')}
                  {selectedInterests.length > 3 && ` +${selectedInterests.length - 3} more`}
                </strong>
              </span>
            ) : (
              <span className="text-slate-400">Please choose at least 1 interest to continue.</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={totalSelectedCount === 0 || submitting}
            className={`w-full sm:w-auto px-8 py-3 rounded-xl font-heading font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
              totalSelectedCount > 0 && !submitting
                ? 'bg-primary hover:bg-primary-hover text-white shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 touch-scale'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Personalizing...</span>
              </div>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default InterestSelectionScreen;

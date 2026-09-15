import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Check, Plus, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { useAppData } from '../context/AppDataContext';
import EventCard from '../components/events/EventCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';

export const ClubDetailsScreen = ({ clubId, onBack, onNavigateToEvent }) => {
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);

  const { followedClubIds, toggleFollowClub } = useAppData();

  useEffect(() => {
    const fetchClub = async () => {
      try {
        setLoading(true);
        const res = await api.getClubById(clubId);
        setClub(res.club);
      } catch (err) {
        console.error('Failed to fetch club details:', err);
      } finally {
        setLoading(false);
      }
    };
    if (clubId) fetchClub();
  }, [clubId]);

  if (loading || !club) {
    return (
      <div className="p-4 space-y-4">
        <LoadingSkeleton type="details" />
      </div>
    );
  }

  const isFollowed = followedClubIds.has(club._id);

  return (
    <div className="min-h-full bg-campusBg p-4 pb-12 animate-fade-in flex flex-col space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          aria-label="Back"
          className="p-2 rounded-xl bg-surface border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors touch-scale"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Follow/Unfollow Button */}
        <button
          onClick={() => toggleFollowClub(club._id, club.name)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all touch-scale shadow-sm ${
            isFollowed
              ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
              : 'bg-primary text-white hover:bg-primary-hover shadow-primary/25'
          }`}
        >
          {isFollowed ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              <span>Following</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Follow Club</span>
            </>
          )}
        </button>
      </div>

      {/* Club Hero Card */}
      <div className="bg-surface rounded-2xl p-4 border border-slate-200/80 shadow-card text-center flex flex-col items-center">
        <div
          className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${
            club.logoColor || 'from-indigo-600 to-violet-600'
          } text-white font-extrabold font-heading text-xl flex items-center justify-center mb-3 shadow-lg shadow-primary/20`}
        >
          {club.initials}
        </div>

        <h1 className="text-base font-heading font-black text-slate-900 leading-tight mb-1">
          {club.name}
        </h1>

        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-3">
          {club.category}
        </span>

        {/* Members & Followers */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 mb-3">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{club.memberCount} Members</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300"></div>
          <div>
            <span>{club.followerCount} Followers</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed text-center max-w-xs">
          {club.description}
        </p>
      </div>

      {/* Section 1: Upcoming Events */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-heading flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Upcoming Events</span>
          </h2>
          <span className="text-[10px] font-bold text-slate-400">
            ({club.upcomingEvents?.length || 0})
          </span>
        </div>

        {club.upcomingEvents && club.upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {club.upcomingEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                onSelect={onNavigateToEvent}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No upcoming events"
            description="This club does not currently have any scheduled events."
          />
        )}
      </section>

      {/* Section 2: Past Events */}
      <section className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-heading">
            Past Events
          </h2>
          <span className="text-[10px] font-bold text-slate-400">
            ({club.pastEvents?.length || 0})
          </span>
        </div>

        {club.pastEvents && club.pastEvents.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {club.pastEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                onSelect={onNavigateToEvent}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic text-center py-4">
            No past events archived yet.
          </p>
        )}
      </section>
    </div>
  );
};

export default ClubDetailsScreen;

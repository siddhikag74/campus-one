import React from 'react';
import { Users, Calendar, Check, Plus } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const ClubCard = ({ club, onSelect }) => {
  const { followedClubIds, toggleFollowClub } = useAppData();
  const isFollowed = followedClubIds.has(club._id);

  const handleFollowClick = (e) => {
    e.stopPropagation();
    toggleFollowClub(club._id, club.name);
  };

  return (
    <div
      onClick={() => onSelect && onSelect(club._id)}
      className="bg-surface rounded-2xl p-3.5 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 touch-scale"
    >
      {/* Club Logo & Info */}
      <div className="flex items-center gap-3 overflow-hidden">
        {/* Initials Avatar */}
        <div
          className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${
            club.logoColor || 'from-indigo-600 to-violet-600'
          } text-white font-extrabold font-heading text-sm flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/10`}
        >
          {club.initials}
        </div>

        {/* Club Details */}
        <div className="overflow-hidden">
          <h4 className="font-heading font-extrabold text-xs text-slate-900 truncate">
            {club.name}
          </h4>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block truncate">
            {club.category}
          </span>

          <div className="flex items-center gap-2.5 mt-1 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400" />
              {club.memberCount} members
            </span>
            <span className="flex items-center gap-1 font-semibold text-primary">
              <Calendar className="w-3 h-3" />
              {club.upcomingEventCount ?? 0} upcoming
            </span>
          </div>
        </div>
      </div>

      {/* Follow Toggle Button */}
      <button
        type="button"
        onClick={handleFollowClick}
        aria-label={isFollowed ? 'Unfollow Club' : 'Follow Club'}
        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all shrink-0 touch-scale ${
          isFollowed
            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            : 'bg-primary text-white hover:bg-primary-hover shadow-sm'
        }`}
      >
        {isFollowed ? (
          <>
            <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
            <span>Following</span>
          </>
        ) : (
          <>
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>Follow</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ClubCard;

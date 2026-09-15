import React from 'react';
import { CheckCircle2, Clock, PlayCircle } from 'lucide-react';

export const RoundCard = ({ round, isLast = false }) => {
  const statusStyles = {
    Completed: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      bar: 'bg-emerald-500',
    },
    'In Progress': {
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: PlayCircle,
      iconColor: 'text-amber-600',
      bar: 'bg-amber-500',
    },
    Upcoming: {
      badge: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: Clock,
      iconColor: 'text-slate-400',
      bar: 'bg-slate-300',
    },
  };

  const style = statusStyles[round.status] || statusStyles.Upcoming;
  const StatusIcon = style.icon;

  return (
    <div className="relative flex gap-3">
      {/* Left indicator timeline line & dot */}
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full bg-surface border-2 border-primary/30 flex items-center justify-center shrink-0 shadow-sm z-10">
          <StatusIcon className={`w-4 h-4 ${style.iconColor}`} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-1"></div>}
      </div>

      {/* Round Details */}
      <div className="flex-1 pb-4">
        <div className="bg-surface rounded-xl p-3 border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
              Round {round.roundNumber}
            </span>
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}
            >
              {round.status}
            </span>
          </div>

          <h4 className="font-heading font-bold text-xs text-slate-900 mb-1">{round.name}</h4>
          <p className="text-[11px] text-slate-600 leading-relaxed mb-2">{round.description}</p>

          <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Target Date: {round.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoundCard;

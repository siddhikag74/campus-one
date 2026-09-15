import React from 'react';

export const EventInfoChip = ({ icon: Icon, label, value, highlight = false }) => {
  return (
    <div
      className={`flex items-start gap-2 p-2.5 rounded-xl border transition-all ${
        highlight
          ? 'bg-primary/5 border-primary/20 text-primary'
          : 'bg-surface border-slate-200/80 text-slate-700 shadow-subtle'
      }`}
    >
      <div
        className={`p-1.5 rounded-lg shrink-0 ${
          highlight ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="overflow-hidden">
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
          {label}
        </span>
        <span className="text-xs font-bold text-slate-900 block truncate">{value}</span>
      </div>
    </div>
  );
};

export default EventInfoChip;

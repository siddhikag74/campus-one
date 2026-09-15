import React from 'react';
import { Sparkles } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Sparkles,
  title = 'No items found',
  description = 'Try adjusting your search query or filters to discover other campus activities.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-surface rounded-2xl border border-dashed border-slate-200 shadow-subtle my-3">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 stroke-[1.8]" />
      </div>
      <h3 className="text-sm font-bold text-slate-800 font-heading mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover shadow-sm transition-all touch-scale"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

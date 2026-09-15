import React from 'react';

export const LoadingSkeleton = ({ type = 'cards', count = 4 }) => {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 animate-pulse">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="bg-surface rounded-2xl p-3 border border-slate-200/60 shadow-subtle flex flex-col justify-between h-[180px]"
          >
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="h-4 w-16 bg-slate-200 rounded-md"></div>
                <div className="h-6 w-6 bg-slate-200 rounded-full"></div>
              </div>
              <div className="h-4 w-full bg-slate-200 rounded mb-1.5"></div>
              <div className="h-3 w-3/4 bg-slate-200 rounded mb-3"></div>
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-1/2 bg-slate-200 rounded"></div>
              <div className="h-3 w-2/3 bg-slate-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="bg-surface rounded-xl p-3.5 border border-slate-200/60 shadow-subtle flex items-center justify-between"
          >
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/5 bg-slate-200 rounded"></div>
              <div className="h-3 w-2/5 bg-slate-200 rounded"></div>
            </div>
            <div className="h-6 w-16 bg-slate-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  // Details skeleton
  return (
    <div className="space-y-4 animate-pulse p-4">
      <div className="h-36 bg-slate-200 rounded-2xl"></div>
      <div className="h-6 w-3/4 bg-slate-200 rounded"></div>
      <div className="flex gap-2">
        <div className="h-8 w-24 bg-slate-200 rounded-xl"></div>
        <div className="h-8 w-24 bg-slate-200 rounded-xl"></div>
      </div>
      <div className="h-20 bg-slate-200 rounded-xl"></div>
    </div>
  );
};

export default LoadingSkeleton;

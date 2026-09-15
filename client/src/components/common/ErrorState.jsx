import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ErrorState = ({
  title = 'Failed to load content',
  message = 'There was a network or server issue connecting to CampusOne.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6 bg-rose-50/60 rounded-2xl border border-rose-200 shadow-subtle my-4">
      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-2.5">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-rose-950 font-heading mb-1">{title}</h3>
      <p className="text-xs text-rose-700 max-w-[260px] mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all touch-scale"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;

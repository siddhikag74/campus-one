import React from 'react';
import { AlertCircle, Clock, MapPin, AlertTriangle } from 'lucide-react';

export const AlertBanner = ({ type, title, message, compact = false }) => {
  if (type === 'deadline') {
    return (
      <div className="flex items-start gap-2 bg-emerald-50 text-emerald-900 border border-emerald-200/80 rounded-xl p-2.5 shadow-subtle">
        <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          {title && <span className="font-bold text-emerald-950 block">{title}</span>}
          <span className="text-emerald-800">{message}</span>
        </div>
      </div>
    );
  }

  if (type === 'venue') {
    return (
      <div className="flex items-start gap-2 bg-indigo-50 text-indigo-900 border border-indigo-200/80 rounded-xl p-2.5 shadow-subtle">
        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          {title && <span className="font-bold text-indigo-950 block">{title}</span>}
          <span className="text-indigo-800">{message}</span>
        </div>
      </div>
    );
  }

  // Default: Amber callout for Important Information
  return (
    <div className="flex items-start gap-2.5 bg-amber-50 text-amber-900 border border-amber-200/90 rounded-xl p-3 shadow-subtle">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div className="text-xs leading-relaxed">
        {title && <span className="font-bold text-amber-950 block mb-0.5">{title}</span>}
        <span className="text-amber-800 font-medium">{message}</span>
      </div>
    </div>
  );
};

export default AlertBanner;

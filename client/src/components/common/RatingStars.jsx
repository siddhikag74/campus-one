import React, { useState } from 'react';
import { Star } from 'lucide-react';

const scoreDescriptors = {
  1: 'Poor (1/5)',
  2: 'Fair (2/5)',
  3: 'Good (3/5)',
  4: 'Very Good (4/5)',
  5: 'Excellent (5/5)',
};

export const RatingStars = ({
  value = 0,
  onChange,
  readOnly = false,
  size = 'md',
  showScore = false,
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  const starSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const currentDisplay = hoverValue || value;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= currentDisplay;

          return (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              onClick={() => onChange && onChange(star)}
              onMouseEnter={() => !readOnly && setHoverValue(star)}
              onMouseLeave={() => !readOnly && setHoverValue(0)}
              className={`p-0.5 transition-transform duration-100 ${
                readOnly
                  ? 'cursor-default'
                  : 'hover:scale-125 active:scale-95 touch-scale cursor-pointer'
              }`}
            >
              <Star
                className={`${starSizes[size] || starSizes.md} transition-all duration-150 ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_1px_3px_rgba(251,191,36,0.4)]'
                    : 'text-slate-300 stroke-[1.5]'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showScore && (
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors ${
            currentDisplay > 0
              ? 'text-amber-700 bg-amber-50 border border-amber-200/80'
              : 'text-slate-400 bg-slate-100'
          }`}
        >
          {currentDisplay > 0 ? `${currentDisplay}/5` : '0/5'}
        </span>
      )}
    </div>
  );
};

export default RatingStars;


import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const RatingStars = ({ value = 0, onChange, readOnly = false, size = 'md' }) => {
  const [hoverValue, setHoverValue] = useState(0);

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const currentDisplay = hoverValue || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= currentDisplay;

        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange && onChange(star)}
            onMouseEnter={() => !readOnly && setHoverValue(star)}
            onMouseLeave={() => !readOnly && setHoverValue(0)}
            className={`p-0.5 transition-transform duration-100 ${
              readOnly ? 'cursor-default' : 'hover:scale-125 touch-scale cursor-pointer'
            }`}
          >
            <Star
              className={`${starSizes[size]} transition-colors ${
                isFilled
                  ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                  : 'text-slate-300 stroke-[1.5]'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default RatingStars;

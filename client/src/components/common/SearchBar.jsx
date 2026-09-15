import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchBar = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search events, clubs, venues...',
  autoFocus = false,
}) => {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        id="input-global-search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-9 pr-8 py-2.5 bg-surface text-slate-800 text-xs font-medium placeholder-slate-400 rounded-xl border border-slate-200/80 shadow-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
      />
      {value && (
        <button
          onClick={onClear || (() => onChange(''))}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;

import React from 'react';
import { Calendar, Trophy, Laptop, Sparkles, Grid } from 'lucide-react';

export const CategoryChips = ({ activeCategory, onSelectCategory }) => {
  const categories = [
    { id: 'All', label: 'All', icon: Grid, color: 'text-slate-600', activeBg: 'bg-slate-900 text-white' },
    { id: 'Events', label: 'Events', icon: Calendar, color: 'text-indigo-600', activeBg: 'bg-primary text-white' },
    { id: 'Competitions', label: 'Competitions', icon: Trophy, color: 'text-amber-600', activeBg: 'bg-amber-600 text-white' },
    { id: 'Workshops', label: 'Workshops', icon: Laptop, color: 'text-emerald-600', activeBg: 'bg-emerald-600 text-white' },
    { id: 'Others', label: 'Others', icon: Sparkles, color: 'text-rose-600', activeBg: 'bg-rose-600 text-white' },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        const Icon = cat.icon;

        return (
          <button
            key={cat.id}
            id={`category-chip-${cat.id}`}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 touch-scale ${
              isActive
                ? `${cat.activeBg} shadow-sm`
                : 'bg-surface text-slate-600 hover:bg-slate-100 border border-slate-200/80 shadow-subtle'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : cat.color}`} />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryChips;

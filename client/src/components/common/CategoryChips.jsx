import React from 'react';
import { 
  Grid, 
  Calendar, 
  Trophy, 
  Laptop, 
  Sparkles, 
  Coins, 
  Flame, 
  Music, 
  Gamepad2, 
  Palette,
  Camera,
  Shirt,
  Landmark
} from 'lucide-react';

export const CategoryChips = ({ activeCategory, onSelectCategory }) => {
  const categories = [
    { id: 'All', label: 'All', icon: Grid, color: 'text-slate-600', activeBg: 'bg-slate-900 text-white' },
    { id: 'Tech', label: 'Tech', emoji: '💻', color: 'text-blue-600', activeBg: 'bg-blue-600 text-white' },
    { id: 'Finance', label: 'Finance', emoji: '💰', color: 'text-emerald-600', activeBg: 'bg-emerald-600 text-white' },
    { id: 'Dance', label: 'Dance', emoji: '💃', color: 'text-rose-600', activeBg: 'bg-rose-600 text-white' },
    { id: 'Music', label: 'Music', emoji: '🎵', color: 'text-purple-600', activeBg: 'bg-purple-600 text-white' },
    { id: 'Sports', label: 'Sports', emoji: '⚽', color: 'text-amber-600', activeBg: 'bg-amber-600 text-white' },
    { id: 'Creativity', label: 'Creativity', emoji: '🎨', color: 'text-fuchsia-600', activeBg: 'bg-fuchsia-600 text-white' },
    { id: 'Gaming', label: 'Gaming', emoji: '🎮', color: 'text-violet-600', activeBg: 'bg-violet-600 text-white' },
    { id: 'Photography', label: 'Photography', emoji: '📸', color: 'text-cyan-600', activeBg: 'bg-cyan-600 text-white' },
    { id: 'Fashion', label: 'Fashion', emoji: '👗', color: 'text-pink-600', activeBg: 'bg-pink-600 text-white' },
    { id: 'Architecture', label: 'Architecture', emoji: '🏛️', color: 'text-stone-600', activeBg: 'bg-stone-700 text-white' },
    { id: 'Competitions', label: 'Competitions', icon: Trophy, color: 'text-amber-600', activeBg: 'bg-amber-600 text-white' },
    { id: 'Workshops', label: 'Workshops', icon: Laptop, color: 'text-emerald-600', activeBg: 'bg-emerald-600 text-white' },
    { id: 'Events', label: 'Events', icon: Calendar, color: 'text-indigo-600', activeBg: 'bg-primary text-white' },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
      {categories.map((cat) => {
        const isActive = activeCategory?.toLowerCase() === cat.id.toLowerCase();
        const Icon = cat.icon;

        return (
          <button
            key={cat.id}
            id={`category-chip-${cat.id.toLowerCase()}`}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 touch-scale cursor-pointer ${
              isActive
                ? `${cat.activeBg} shadow-sm font-bold scale-[1.02]`
                : 'bg-surface text-slate-600 hover:bg-slate-100 border border-slate-200/80 shadow-subtle'
            }`}
          >
            {cat.emoji ? (
              <span className="text-xs">{cat.emoji}</span>
            ) : Icon ? (
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : cat.color}`} />
            ) : null}
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryChips;

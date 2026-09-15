import React from 'react';
import { Home, Compass, CalendarClock, Calendar, User } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';

export const BottomNavigation = ({ activeTab, onTabChange }) => {
  const { importantEventIds } = useAppData();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'timetable', label: 'Timetable', icon: CalendarClock },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User, badge: importantEventIds.size > 0 },
  ];

  return (
    <nav
      id="bottom-navigation"
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-slate-200/80 z-40 shadow-lg"
    >
      <div className="max-w-2xl md:max-w-3xl mx-auto h-16 px-2 sm:px-4 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 sm:px-4 md:px-6 rounded-xl transition-all duration-150 touch-scale cursor-pointer ${
                isActive
                  ? 'text-primary font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-110 stroke-[2.4px]' : 'stroke-[1.8px]'
                  }`}
                />
                {item.badge && !isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white"></span>
                )}
              </div>
              <span className="text-[10px] md:text-xs mt-0.5 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 w-5 h-0.5 bg-primary rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;

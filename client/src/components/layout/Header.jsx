import React from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';

export const Header = ({ onOpenNotifications }) => {
  const { user } = useAuth();
  const { unreadCount } = useAppData();

  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  return (
    <header className="bg-surface/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 border-b border-slate-200/60 sticky top-0 z-20 shadow-subtle">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand & Personalized Greeting */}
        <div className="flex items-center gap-2.5">
          {/* Gradient C Logo */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
            <span className="text-white font-black text-xl font-heading leading-none">C</span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold font-heading text-slate-900 tracking-tight leading-none">
                CampusOne
              </h1>
              <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                AI Beta
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
              Hi, {firstName} 👋 &bull; Discover opportunities
            </p>
          </div>
        </div>

        {/* Notification Bell with Badge */}
        <button
          id="btn-notifications-bell"
          onClick={onOpenNotifications}
          aria-label="Open Notifications"
          className="relative p-2 rounded-xl text-slate-600 hover:text-primary hover:bg-primary/5 transition-colors touch-scale cursor-pointer"
        >
          <Bell className="w-5 h-5 stroke-[2px]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[17px] h-[17px] bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 ring-2 ring-surface shadow-sm animate-pulse-subtle">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;

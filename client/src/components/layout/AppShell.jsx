import React from 'react';
import BottomNavigation from './BottomNavigation';

export const AppShell = ({
  children,
  activeTab,
  onTabChange,
  showBottomNav = true,
  currentScreen = 'home',
}) => {
  return (
    <div className="min-h-screen bg-campusBg flex flex-col w-full text-slate-800 selection:bg-primary selection:text-white">
      {/* Scrollable Screen Content Container */}
      <main
        id="main-scrollable-container"
        className={`flex-1 w-full flex flex-col ${
          showBottomNav ? 'pb-20 md:pb-24' : 'pb-6'
        }`}
      >
        {children}
      </main>

      {/* Global Bottom Navigation */}
      {showBottomNav && (
        <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
      )}
    </div>
  );
};

export default AppShell;

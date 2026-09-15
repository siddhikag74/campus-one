import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import AppShell from './components/layout/AppShell';

// Auth Screens
import LoginScreen from './screens/auth/LoginScreen';
import SignUpScreen from './screens/auth/SignUpScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';
import InterestSelectionScreen from './screens/auth/InterestSelectionScreen';

// Main Screens
import HomeScreen from './screens/HomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import TimetableScreen from './screens/TimetableScreen';
import CalendarScreen from './screens/CalendarScreen';
import ProfileScreen from './screens/ProfileScreen';

// Sub-screens (Hides bottom navigation)
import EventDetailsScreen from './screens/EventDetailsScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import ClubDetailsScreen from './screens/ClubDetailsScreen';
import ReviewScreen from './screens/ReviewScreen';
import NotificationsScreen from './screens/NotificationsScreen';

export const MainApp = () => {
  // Main tabs: 'home' | 'explore' | 'timetable' | 'calendar' | 'profile'
  const [activeTab, setActiveTab] = useState('home');
  const [highlightedClassId, setHighlightedClassId] = useState(null);

  // Subscreen state: null OR { type, id }
  const [subscreen, setSubscreen] = useState(null);

  // Subscreen navigation handlers
  const handleOpenEvent = (eventId) => {
    setSubscreen({ type: 'event-details', eventId });
  };

  const handleOpenRegister = (eventId) => {
    setSubscreen({ type: 'register', eventId });
  };

  const handleOpenReview = (eventId) => {
    setSubscreen({ type: 'review', eventId });
  };

  const handleOpenClub = (clubId) => {
    setSubscreen({ type: 'club-details', clubId });
  };

  const handleOpenNotifications = () => {
    setSubscreen({ type: 'notifications' });
  };

  const handleBackToEvent = (eventId) => {
    setSubscreen({ type: 'event-details', eventId });
  };

  const handleCloseSubscreen = () => {
    setSubscreen(null);
  };

  const handleTabChange = (tabId) => {
    setSubscreen(null); // Return to main tab when clicking bottom navigation
    setActiveTab(tabId);
  };

  // Sub-screens such as Event Details, Registration, Club Details, Review, and Notifications HIDE the bottom navigation
  const showBottomNav = !subscreen;

  const renderContent = () => {
    if (subscreen) {
      switch (subscreen.type) {
        case 'event-details':
          return (
            <EventDetailsScreen
              eventId={subscreen.eventId}
              onBack={handleCloseSubscreen}
              onNavigateToRegister={handleOpenRegister}
              onNavigateToReview={handleOpenReview}
              onNavigateToClub={handleOpenClub}
            />
          );

        case 'register':
          return (
            <RegistrationScreen
              eventId={subscreen.eventId}
              onBack={() => handleBackToEvent(subscreen.eventId)}
              onComplete={() => handleBackToEvent(subscreen.eventId)}
            />
          );

        case 'review':
          return (
            <ReviewScreen
              eventId={subscreen.eventId}
              onBack={() => handleBackToEvent(subscreen.eventId)}
              onComplete={() => handleBackToEvent(subscreen.eventId)}
            />
          );

        case 'club-details':
          return (
            <ClubDetailsScreen
              clubId={subscreen.clubId}
              onBack={handleCloseSubscreen}
              onNavigateToEvent={handleOpenEvent}
            />
          );

        case 'notifications':
          return (
            <NotificationsScreen
              onBack={handleCloseSubscreen}
              onNavigateToEvent={handleOpenEvent}
              onNavigateToTimetable={(classId) => {
                setSubscreen(null);
                setHighlightedClassId(classId);
                setActiveTab('timetable');
              }}
            />
          );

        default:
          break;
      }
    }

    // Default Main Navigation Tabs
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            onNavigateToEvent={handleOpenEvent}
            onOpenNotifications={handleOpenNotifications}
          />
        );

      case 'explore':
        return (
          <ExploreScreen
            onNavigateToEvent={handleOpenEvent}
            onNavigateToClub={handleOpenClub}
          />
        );

      case 'timetable':
        return (
          <TimetableScreen
            highlightedClassId={highlightedClassId}
          />
        );

      case 'calendar':
        return (
          <CalendarScreen
            onNavigateToEvent={handleOpenEvent}
          />
        );

      case 'profile':
        return (
          <ProfileScreen
            onNavigateToEvent={handleOpenEvent}
          />
        );

      default:
        return (
          <HomeScreen
            onNavigateToEvent={handleOpenEvent}
            onOpenNotifications={handleOpenNotifications}
          />
        );
    }
  };

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={handleTabChange}
      showBottomNav={showBottomNav}
      currentScreen={subscreen ? subscreen.type : activeTab}
    >
      {renderContent()}
    </AppShell>
  );
};

// Root Router & Authentication Guard
const AppRoot = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup' | 'forgot-password'

  // Loading state with branded splash screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center shadow-xl shadow-primary/30 animate-pulse mb-4">
          <span className="text-white font-black text-3xl font-heading">C</span>
        </div>
        <h2 className="text-lg font-black font-heading text-white tracking-tight">
          CampusOne
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-1 animate-pulse">
          Authenticating campus session...
        </p>
      </div>
    );
  }

  // Unauthenticated routing: only allow access to login, signup, forgot-password
  if (!isAuthenticated) {
    switch (authView) {
      case 'signup':
        return <SignUpScreen onNavigateToLogin={() => setAuthView('login')} />;
      case 'forgot-password':
        return <ForgotPasswordScreen onNavigateToLogin={() => setAuthView('login')} />;
      case 'login':
      default:
        return (
          <LoginScreen
            onNavigateToSignUp={() => setAuthView('signup')}
            onNavigateToForgotPassword={() => setAuthView('forgot-password')}
          />
        );
    }
  }

  // Onboarding flow: show Interest Selection only if user has not completed onboarding
  if (!user?.onboardingCompleted) {
    return <InterestSelectionScreen />;
  }

  // Authenticated state: render main application
  return <MainApp />;
};

export const App = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppDataProvider>
          <AppRoot />
        </AppDataProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;

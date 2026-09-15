import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const AppDataContext = createContext();

export const AppDataProvider = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [savedEventIds, setSavedEventIds] = useState(new Set());
  const [importantEventIds, setImportantEventIds] = useState(new Set());
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
  const [followedClubIds, setFollowedClubIds] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync state from profile and notifications
  const refreshGlobalData = useCallback(async () => {
    try {
      const [profileData, notifData] = await Promise.all([
        api.getProfile().catch(() => null),
        api.getNotifications().catch(() => null),
      ]);

      if (profileData?.tabs) {
        const saved = new Set((profileData.tabs.saved || []).map((e) => e._id));
        const registered = new Set((profileData.tabs.registered || []).map((r) => r.event._id));
        const pending = new Set((profileData.tabs.pending || []).map((e) => e._id));

        setSavedEventIds(saved);
        setRegisteredEventIds(registered);
        // Important events include pending + registered events marked important
        setImportantEventIds(pending);
      }

      if (profileData?.user?.followedClubs) {
        setFollowedClubIds(new Set(profileData.user.followedClubs));
      }

      if (notifData) {
        setUnreadCount(notifData.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Could not sync app global data:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshGlobalData();
    } else {
      // Clear user data on logout
      setSavedEventIds(new Set());
      setImportantEventIds(new Set());
      setRegisteredEventIds(new Set());
      setFollowedClubIds(new Set());
      setUnreadCount(0);
    }
  }, [user, refreshGlobalData]);

  // Optimistic Toggle Favorite (Heart)
  const toggleSave = async (eventId, eventTitle = 'Event') => {
    const isCurrentlySaved = savedEventIds.has(eventId);

    // Optimistic state change
    setSavedEventIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlySaved) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });

    try {
      if (isCurrentlySaved) {
        await api.unsaveEvent(eventId);
        showToast(`Removed from favorites`, 'info');
      } else {
        await api.saveEvent(eventId);
        showToast(`Saved to favorites! ❤️`, 'success');
      }
    } catch (err) {
      // Revert on failure
      setSavedEventIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) next.add(eventId);
        else next.delete(eventId);
        return next;
      });
      showToast('Failed to update favorite', 'error');
    }
  };

  // Optimistic Toggle Important
  const toggleImportant = async (eventId) => {
    const isCurrentlyImportant = importantEventIds.has(eventId);

    setImportantEventIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyImportant) next.delete(eventId);
      else next.add(eventId);
      return next;
    });

    try {
      if (isCurrentlyImportant) {
        await api.unmarkImportant(eventId);
        showToast('Removed from Important', 'info');
      } else {
        await api.markImportant(eventId);
        showToast('Marked as Important ⭐ (View in Profile → Pending)', 'success');
      }
    } catch (err) {
      setImportantEventIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyImportant) next.add(eventId);
        else next.delete(eventId);
        return next;
      });
      showToast('Failed to update important status', 'error');
    }
  };

  // Optimistic Toggle Follow Club
  const toggleFollowClub = async (clubId, clubName = 'Club') => {
    const isCurrentlyFollowed = followedClubIds.has(clubId);

    setFollowedClubIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyFollowed) next.delete(clubId);
      else next.add(clubId);
      return next;
    });

    try {
      if (isCurrentlyFollowed) {
        await api.unfollowClub(clubId);
        showToast(`Unfollowed ${clubName}`, 'info');
      } else {
        await api.followClub(clubId);
        showToast(`Following ${clubName}! 🔔`, 'success');
      }
    } catch (err) {
      setFollowedClubIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFollowed) next.add(clubId);
        else next.delete(clubId);
        return next;
      });
      showToast('Failed to update club follow status', 'error');
    }
  };

  const recordRegistration = (eventId) => {
    setRegisteredEventIds((prev) => new Set([...prev, eventId]));
    refreshGlobalData();
  };

  const decrementUnread = () => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const clearUnread = () => {
    setUnreadCount(0);
  };

  return (
    <AppDataContext.Provider
      value={{
        savedEventIds,
        importantEventIds,
        registeredEventIds,
        followedClubIds,
        unreadCount,
        toggleSave,
        toggleImportant,
        toggleFollowClub,
        recordRegistration,
        decrementUnread,
        clearUnread,
        refreshGlobalData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);

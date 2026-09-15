import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCheck,
  Sparkles,
  CheckCircle2,
  Clock,
  Hourglass,
  Volume2,
  Trophy,
  HeartCrack,
  Megaphone,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';

export const NotificationsScreen = ({ onBack, onNavigateToEvent, onNavigateToTimetable }) => {
  const [notifications, setNotifications] = useState({ new: [], earlier: [], all: [] });
  const [loading, setLoading] = useState(true);

  const { clearUnread, decrementUnread } = useAppData();
  const { showToast } = useToast();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      setNotifications(res);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      clearUnread();
      showToast('All notifications marked as read', 'success');
      fetchNotifications();
    } catch (err) {
      showToast('Failed to mark notifications read', 'error');
    }
  };

  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      try {
        await api.markNotificationAsRead(item._id);
        decrementUnread();
      } catch (err) {
        console.error(err);
      }
    }

    if (item.timetableEntry || item.type.includes('class') || item.type.includes('venue') || item.type.includes('timetable')) {
      if (onNavigateToTimetable) {
        onNavigateToTimetable(item.timetableEntry?._id || item.timetableEntry);
      }
    } else if (item.event?._id) {
      onNavigateToEvent(item.event._id);
    }
  };

  // Notification Icon & Left Border Map
  const notifConfig = {
    new_event: {
      icon: '🎉',
      borderColor: 'border-l-indigo-500',
      bgColor: 'bg-indigo-50/50',
    },
    registration_confirmed: {
      icon: '✅',
      borderColor: 'border-l-emerald-500',
      bgColor: 'bg-emerald-50/50',
    },
    reminder: {
      icon: '⏰',
      borderColor: 'border-l-amber-500',
      bgColor: 'bg-amber-50/50',
    },
    deadline: {
      icon: '⏳',
      borderColor: 'border-l-rose-500',
      bgColor: 'bg-rose-50/50',
    },
    deadline_extended: {
      icon: '📢',
      borderColor: 'border-l-emerald-600',
      bgColor: 'bg-emerald-50/50',
    },
    shortlisted: {
      icon: '🏆',
      borderColor: 'border-l-amber-500',
      bgColor: 'bg-amber-50/50',
    },
    rejection: {
      icon: '💌',
      borderColor: 'border-l-slate-400',
      bgColor: 'bg-slate-50',
    },
    announcement: {
      icon: '📣',
      borderColor: 'border-l-purple-500',
      bgColor: 'bg-purple-50/50',
    },
    timetable_change: {
      icon: '🔄',
      borderColor: 'border-l-indigo-500',
      bgColor: 'bg-indigo-50/50',
    },
    class_cancelled: {
      icon: '❌',
      borderColor: 'border-l-rose-500',
      bgColor: 'bg-rose-50/50',
    },
    class_postponed: {
      icon: '⏳',
      borderColor: 'border-l-violet-500',
      bgColor: 'bg-violet-50/50',
    },
    venue_changed: {
      icon: '📍',
      borderColor: 'border-l-amber-500',
      bgColor: 'bg-amber-50/50',
    },
    class_time_changed: {
      icon: '⏰',
      borderColor: 'border-l-sky-500',
      bgColor: 'bg-sky-50/50',
    },
    class_date_changed: {
      icon: '📅',
      borderColor: 'border-l-purple-500',
      bgColor: 'bg-purple-50/50',
    },
  };

  const renderNotificationCard = (item) => {
    const config = notifConfig[item.type] || notifConfig.announcement;

    return (
      <div
        key={item._id}
        onClick={() => handleNotificationClick(item)}
        className={`relative p-3.5 rounded-2xl bg-surface border border-slate-200/80 shadow-subtle hover:shadow-card transition-all cursor-pointer border-l-4 ${
          config.borderColor
        } ${!item.isRead ? config.bgColor : ''} touch-scale flex items-start justify-between gap-3`}
      >
        <div className="flex items-start gap-3">
          <span className="text-xl leading-none shrink-0 pt-0.5">{config.icon}</span>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-heading font-extrabold text-slate-900">
                {item.title}
              </h4>
              {!item.isRead && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">{item.body}</p>
            <span className="text-[10px] text-slate-400 font-semibold block pt-1">
              {item.timeAgo || 'Recently'}
            </span>
          </div>
        </div>

        {item.event && (
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-full bg-campusBg p-4 pb-12 animate-fade-in flex flex-col space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Back"
            className="p-2 rounded-xl bg-surface border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors touch-scale"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-heading font-black text-slate-900">
            Notifications
          </h1>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-slate-100 text-primary border border-slate-200 text-[11px] font-bold transition-colors touch-scale"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark all read</span>
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton type="list" count={5} />
      ) : notifications.all?.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="You are all caught up! New event updates and deadline alerts will appear here."
        />
      ) : (
        <div className="space-y-4">
          {/* New Section */}
          {notifications.new?.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-heading">
                New
              </h3>
              <div className="space-y-2">
                {notifications.new.map(renderNotificationCard)}
              </div>
            </div>
          )}

          {/* Earlier Section */}
          {notifications.earlier?.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 font-heading">
                Earlier
              </h3>
              <div className="space-y-2">
                {notifications.earlier.map(renderNotificationCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsScreen;

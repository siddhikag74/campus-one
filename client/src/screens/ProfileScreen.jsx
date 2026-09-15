import React, { useState, useEffect } from 'react';
import {
  User,
  GraduationCap,
  Building,
  Edit3,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  HeartCrack,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  X,
  LogOut,
  Mail,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import EventCard from '../components/events/EventCard';
import EventGrid from '../components/events/EventGrid';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';

export const ProfileScreen = ({ onNavigateToEvent }) => {
  const { user: authUser, updateProfile, logout } = useAuth();
  const { refreshGlobalData } = useAppData();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('registered');

  // Edit Profile Modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    branch: '',
    year: '',
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getProfile();
      setProfileData(res);
      if (res.user) {
        setEditForm({
          name: res.user.name || '',
          phone: res.user.phone || '',
          branch: res.user.branch || '',
          year: res.user.year || '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const success = await updateProfile(editForm);
    if (success) {
      setIsEditing(false);
      fetchProfile();
      refreshGlobalData();
    }
  };

  const student = profileData?.user || authUser;
  const stats = profileData?.stats || { registeredCount: 0, savedCount: 0, shortlistedCount: 0 };
  const tabs = profileData?.tabs || { registered: [], pending: [], shortlisted: [], rejected: [], saved: [] };

  const tabOptions = [
    { id: 'registered', label: 'Registered', count: stats.registeredCount },
    { id: 'pending', label: 'Pending', count: tabs.pending?.length || 0 },
    { id: 'shortlisted', label: 'Shortlisted', count: stats.shortlistedCount },
    { id: 'rejected', label: 'Rejected', count: tabs.rejected?.length || 0 },
    { id: 'saved', label: 'Saved', count: stats.savedCount },
  ];

  return (
    <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-5 min-h-full pb-12">
      {/* Header Profile Card */}
      <div className="bg-surface rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-card">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Gradient Avatar with Initials */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary via-indigo-600 to-violet-500 text-white font-black font-heading text-lg flex items-center justify-center shadow-md shadow-primary/25 shrink-0">
              {student?.name
                ? student.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                : 'AS'}
            </div>

            <div>
              <h1 className="text-base font-heading font-black text-slate-900 leading-tight">
                {student?.name || authUser?.name || 'Student'}
              </h1>
              {student?.rollNumber ? (
                <span className="text-[11px] font-mono font-bold text-primary block mt-0.5">
                  Roll: {student.rollNumber}
                </span>
              ) : null}
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                {student?.year || '1st Year'} &bull; {student?.branch || 'General'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-edit-profile"
              onClick={() => setIsEditing(true)}
              aria-label="Edit Profile"
              title="Edit Profile"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors touch-scale"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              id="btn-logout-header"
              onClick={logout}
              aria-label="Log out"
              title="Sign Out"
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors touch-scale"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Student metadata chips */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-slate-600 font-semibold">
            <Building className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{student?.college || authUser?.college || 'Delhi Technological University'}</span>
          </div>
          {(student?.email || authUser?.email) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-slate-500 font-medium">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{student?.email || authUser?.email}</span>
            </div>
          )}
        </div>

        {/* Profile Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
          <div className="p-2 rounded-xl bg-primary/5">
            <span className="text-base font-extrabold font-heading text-primary block leading-none mb-1">
              {stats.registeredCount}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Registered
            </span>
          </div>

          <div className="p-2 rounded-xl bg-rose-50">
            <span className="text-base font-extrabold font-heading text-rose-600 block leading-none mb-1">
              {stats.savedCount}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Saved
            </span>
          </div>

          <div className="p-2 rounded-xl bg-amber-50">
            <span className="text-base font-extrabold font-heading text-amber-600 block leading-none mb-1">
              {stats.shortlistedCount}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Shortlisted
            </span>
          </div>
        </div>
      </div>

      {/* Profile Horizontal Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {tabOptions.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all touch-scale flex items-center gap-1.5 ${
                isActive
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'bg-surface text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREAS */}
      {loading ? (
        <LoadingSkeleton type="list" count={3} />
      ) : (
        <div className="space-y-3 animate-fade-in">
          {/* TAB 1: Registered (Compact registered event rows) */}
          {activeTab === 'registered' && (
            <div className="space-y-2">
              {tabs.registered?.length > 0 ? (
                tabs.registered.map((item) => (
                  <div
                    key={item.registrationId || item.event._id}
                    onClick={() => onNavigateToEvent(item.event._id)}
                    className="bg-surface rounded-2xl p-3.5 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all cursor-pointer flex items-center justify-between gap-3 touch-scale"
                  >
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Confirmed
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {item.event.category}
                        </span>
                      </div>

                      <h4 className="text-xs font-heading font-extrabold text-slate-900 truncate">
                        {item.event.title}
                      </h4>

                      <p className="text-[10px] text-slate-500 truncate">
                        {item.event.club?.name} &bull; {item.event.venue} &bull; {item.event.dateStr}
                      </p>

                      {item.teamName && (
                        <span className="text-[10px] font-bold text-primary block">
                          Team: {item.teamName}
                        </span>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No registrations yet"
                  description="Browse the campus feed and register for upcoming competitions and workshops."
                />
              )}
            </div>
          )}

          {/* TAB 2: Pending (Events marked Important but NOT registered + explanatory callout) */}
          {activeTab === 'pending' && (
            <div className="space-y-3">
              {/* Explanatory Callout Banner */}
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-extrabold block mb-0.5 text-amber-950">
                    Important Opportunities Watchlist
                  </span>
                  <span>
                    Events you marked as <strong>Important ⭐</strong> but have not yet registered for.
                    Be sure to finalize your entry before deadlines expire!
                  </span>
                </div>
              </div>

              {tabs.pending?.length > 0 ? (
                <div className="space-y-2">
                  {tabs.pending.map((event) => (
                    <div
                      key={event._id}
                      onClick={() => onNavigateToEvent(event._id)}
                      className="bg-surface rounded-2xl p-3.5 border border-amber-200/80 shadow-subtle hover:shadow-card transition-all cursor-pointer flex items-center justify-between gap-3 touch-scale"
                    >
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                            ⭐ Important
                          </span>
                          <span className="text-[10px] text-rose-600 font-bold">
                            Closes {event.deadline}
                          </span>
                        </div>
                        <h4 className="text-xs font-heading font-extrabold text-slate-900 truncate">
                          {event.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate">
                          {event.club?.name} &bull; {event.venue}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToEvent(event._id);
                        }}
                        className="px-2.5 py-1.5 bg-primary text-white text-[11px] font-bold rounded-xl hover:bg-primary-hover shrink-0"
                      >
                        Register →
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No pending important events"
                  description="Tap the Star icon on any event to keep track of high-priority opportunities here."
                />
              )}
            </div>
          )}

          {/* TAB 3: Shortlisted (Competition progress cards) */}
          {activeTab === 'shortlisted' && (
            <div className="space-y-3">
              {tabs.shortlisted?.length > 0 ? (
                tabs.shortlisted.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-surface rounded-2xl p-4 border border-slate-200/80 shadow-card space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-heading font-extrabold text-slate-900">
                          {item.competitionName}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Round {item.currentRound} of {item.totalRounds}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                        <span>Progress</span>
                        <span>{item.progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-500"
                          style={{ width: `${item.progressPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="pt-1 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="font-semibold text-slate-500">Current Round:</span>
                        <span className="font-bold text-slate-900">{item.currentRoundName}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="font-semibold text-slate-500">Next Round:</span>
                        <span className="font-bold text-primary">{item.nextRoundName}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[10px]">
                        <span>Next Evaluation:</span>
                        <span className="font-semibold">{item.nextRoundDate}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={Trophy}
                  title="No active competition shortlists"
                  description="When you advance through hackathon or case challenge rounds, status tracks here."
                />
              )}
            </div>
          )}

          {/* TAB 4: Rejected (Neutral, softly styled rejection cards) */}
          {activeTab === 'rejected' && (
            <div className="space-y-3">
              {tabs.rejected?.length > 0 ? (
                tabs.rejected.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-surface rounded-2xl p-4 border border-slate-200/80 shadow-subtle space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-heading font-extrabold text-slate-800">
                        {item.competitionName}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-semibold">{item.date}</span>
                    </div>

                    <span className="text-[10px] font-bold text-slate-500 block">
                      {item.roundName}
                    </span>

                    <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {item.message}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No competition rejections"
                  description="All competition feedback updates will appear here."
                />
              )}
            </div>
          )}

          {/* TAB 5: Saved (Two-column EventCard grid) */}
          {activeTab === 'saved' && (
            <div>
              {tabs.saved?.length > 0 ? (
                <EventGrid events={tabs.saved} onSelectEvent={onNavigateToEvent} />
              ) : (
                <EmptyState
                  title="No saved events"
                  description="Tap the heart icon on any event card to bookmark it for later."
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Account Settings & Sign Out Card */}
      <div className="bg-surface rounded-2xl p-4 border border-slate-200/80 space-y-3 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800 font-heading">
              Account & Session
            </h4>
            <p className="text-[11px] text-slate-500">
              Signed in as <span className="font-semibold text-slate-700">{student?.email || authUser?.email || 'student'}</span>
            </p>
          </div>
        </div>

        <button
          id="btn-logout-full"
          onClick={logout}
          className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors touch-scale"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of CampusOne</span>
        </button>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 animate-slide-up space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-sm text-slate-900">
                Edit Student Profile
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Year</label>
                  <select
                    value={editForm.year}
                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Branch</label>
                  <input
                    type="text"
                    value={editForm.branch}
                    onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/25"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;

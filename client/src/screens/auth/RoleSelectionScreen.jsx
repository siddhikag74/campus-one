import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const RoleSelectionScreen = () => {
  const { user, selectRole, logout } = useAuth();
  const { showToast } = useToast();
  const [selectedRole, setSelectedRole] = useState(null);
  const [organization, setOrganization] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      id: 'student',
      title: 'Student',
      badge: 'Campus Life',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14v7" />
        </svg>
      ),
      color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400',
      activeBorder: 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30',
      tagline: 'Discover events, sync timetable & join clubs',
      description: 'Personalized campus feed, 1-click event registrations, student timetable sync, and club discovery.',
      features: [
        'Explore & register for 30+ campus events',
        'Auto-synced class schedule & instant alerts',
        'Follow student clubs & societies',
      ],
    },
    {
      id: 'organizer',
      title: 'Organizer',
      badge: 'Club & Society Lead',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
      activeBorder: 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30',
      tagline: 'Host events & upload post-event resources',
      description: 'Create events, manage registrations, and attach Docs, PDFs, PPTs, Drive links, forms, and QR codes.',
      features: [
        'Create & publish official campus events',
        'Post post-event Docs, PDFs, PPTs, & Drive links',
        'Embed Google recruitment forms & QR codes',
      ],
    },
    {
      id: 'professor',
      title: 'Professor',
      badge: 'Faculty & Academics',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      ),
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
      activeBorder: 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30',
      tagline: 'Manage faculty timetable & class status',
      description: 'Dedicated faculty timetable view with 1-click class cancellation, postponement, rescheduling, and live student alerts.',
      features: [
        'Dedicated Professor schedule management',
        'Cancel, postpone, or reschedule classes',
        'Live status badges & automatic student notifications',
      ],
    },
  ];

  const handleSubmit = async () => {
    if (!selectedRole) {
      showToast('Please select your campus role to continue.', 'warning');
      return;
    }

    try {
      setLoading(true);
      await selectRole({
        role: selectedRole,
        organization: organization.trim(),
        department: department.trim(),
      });
    } catch (err) {
      showToast(err.message || 'Failed to set role', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-white font-black text-xl font-heading">C</span>
          </div>
          <div>
            <span className="font-heading font-black text-lg tracking-tight text-white">CampusOne</span>
            <span className="text-xs text-primary font-semibold block">Onboarding • Step 1 of 2</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto w-full my-auto py-8 z-10">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
            <span>🎓 Welcome, {user?.name || 'Scholar'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-white tracking-tight leading-tight">
            Are you a <span className="bg-gradient-to-r from-blue-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent">Student, Organizer,</span> or <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Professor?</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            Select your account type to configure the right tools, permissions, and dashboards tailored for you.
          </p>
        </div>

        {/* 3 Interactive Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
          {roles.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`relative rounded-2xl p-5 sm:p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between border bg-slate-900/60 backdrop-blur-sm hover:scale-[1.02] ${
                  isSelected
                    ? role.activeBorder
                    : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                {/* Selected Indicator Badge */}
                {isSelected && (
                  <div className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white shadow-md shadow-primary/40">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                <div>
                  {/* Icon & Role Badge */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${role.color} border`}>
                      {role.icon}
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {role.badge}
                      </span>
                      <h3 className="text-xl font-bold font-heading text-white mt-1">
                        {role.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-300 mb-2">
                    {role.tagline}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {role.description}
                  </p>

                  {/* Bullet points */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
                    {role.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                        <svg className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-3">
                  <div
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-center transition-all ${
                      isSelected
                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                        : 'bg-slate-800/80 text-slate-400 group-hover:text-white'
                    }`}
                  >
                    {isSelected ? '✓ Selected' : `Select ${role.title}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Role-Specific Detail Inputs */}
        {selectedRole === 'organizer' && (
          <div className="max-w-md mx-auto mb-6 p-4 rounded-2xl bg-slate-900 border border-amber-500/30 animate-fadeIn">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">
              Society / Club / Organization Name
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. IEEE DTU Student Branch, ACM Chapter, Rotaract"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Used when publishing official campus events and attaching post-event resources.
            </span>
          </div>
        )}

        {selectedRole === 'professor' && (
          <div className="max-w-md mx-auto mb-6 p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 animate-fadeIn">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
              Academic Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Dept. of Computer Science & Engineering"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-400 placeholder:text-slate-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Used for timetable management and student broadcast alerts.
            </span>
          </div>
        )}

        {/* Continue Button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={!selectedRole || loading}
            className={`w-full max-w-md py-3.5 px-6 rounded-2xl font-bold font-heading text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-xl ${
              selectedRole && !loading
                ? 'bg-gradient-to-r from-primary via-indigo-500 to-violet-500 text-white shadow-primary/30 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving Role...
              </>
            ) : (
              <>
                <span>Continue as {selectedRole ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) : '...'}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-500">
            {selectedRole === 'student'
              ? 'Next: Personalize your interests & campus feed.'
              : selectedRole === 'organizer'
              ? 'Next: Direct access to Organizer Hub & Event Management.'
              : selectedRole === 'professor'
              ? 'Next: Direct access to Faculty Timetable & Schedule Controls.'
              : 'Please select a role above to proceed.'}
          </p>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-slate-600 py-2 z-10">
        CampusOne • Role-Based Campus Infrastructure
      </div>
    </div>
  );
};

export default RoleSelectionScreen;

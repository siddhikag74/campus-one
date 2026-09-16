import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export const OrganizerDashboardScreen = ({ onOpenEvent }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventForResources, setSelectedEventForResources] = useState(null);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);

  // New Event Form State
  const [createForm, setCreateForm] = useState({
    title: '',
    category: 'Events',
    venue: '',
    dateStr: '',
    time: '',
    deadline: '',
    about: '',
    teamSize: 'Individual',
    isTeamEvent: false,
    eligibility: 'Open to all enrolled college/university students with valid ID.',
    tags: 'Tech, Workshop',
  });
  const [creating, setCreating] = useState(false);

  // Resource Form State
  const [resourceForm, setResourceForm] = useState({
    title: '',
    type: 'pdf', // 'pdf' | 'ppt' | 'doc' | 'image' | 'video' | 'drive' | 'form' | 'link' | 'qr'
    url: '',
    description: '',
  });
  const [uploadingResource, setUploadingResource] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getEvents({ category: 'All' });
      setEvents(data.events || []);
    } catch (err) {
      showToast(err.message || 'Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!createForm.title || !createForm.venue || !createForm.dateStr || !createForm.time || !createForm.about) {
      showToast('Please fill in all required fields.', 'warning');
      return;
    }

    try {
      setCreating(true);
      const tagsArray = createForm.tags ? createForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      await api.createEvent({
        ...createForm,
        tags: tagsArray,
      });
      showToast('Event published successfully! 🚀', 'success');
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        category: 'Events',
        venue: '',
        dateStr: '',
        time: '',
        deadline: '',
        about: '',
        teamSize: 'Individual',
        isTeamEvent: false,
        eligibility: 'Open to all enrolled college/university students with valid ID.',
        tags: 'Tech, Workshop',
      });
      fetchEvents();
    } catch (err) {
      showToast(err.message || 'Failed to create event', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenResourceManager = (event) => {
    setSelectedEventForResources(event);
    setShowResourceModal(true);
    setResourceForm({
      title: '',
      type: 'pdf',
      url: '',
      description: '',
    });
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!resourceForm.title || !resourceForm.url) {
      showToast('Please provide a resource title and URL / Link.', 'warning');
      return;
    }

    try {
      setUploadingResource(true);
      const res = await api.addEventResource(selectedEventForResources._id, resourceForm);
      showToast(`Resource '${resourceForm.title}' added successfully! 📎`, 'success');
      
      // Update local event resources
      setSelectedEventForResources(prev => ({
        ...prev,
        resources: res.resources || [...(prev.resources || []), { ...resourceForm, _id: Date.now().toString(), uploadedAt: new Date() }],
      }));

      setResourceForm({
        title: '',
        type: 'pdf',
        url: '',
        description: '',
      });
      fetchEvents();
    } catch (err) {
      showToast(err.message || 'Failed to add resource', 'error');
    } finally {
      setUploadingResource(false);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      await api.deleteEventResource(selectedEventForResources._id, resourceId);
      showToast('Resource removed successfully.', 'info');
      setSelectedEventForResources(prev => ({
        ...prev,
        resources: (prev.resources || []).filter(r => r._id !== resourceId),
      }));
      fetchEvents();
    } catch (err) {
      showToast(err.message || 'Failed to remove resource', 'error');
    }
  };

  const getResourceTypeBadge = (type) => {
    const badges = {
      pdf: { label: 'PDF Document', bg: 'bg-red-500/10 text-red-400 border-red-500/30', icon: '📄' },
      ppt: { label: 'PPT Slides', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30', icon: '📊' },
      doc: { label: 'Doc File', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: '📝' },
      drive: { label: 'Google Drive', bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', icon: '📁' },
      form: { label: 'Google / Recr. Form', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: '📋' },
      qr: { label: 'QR Code', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: '📱' },
      video: { label: 'Video / Media', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: '🎥' },
      image: { label: 'Image Asset', bg: 'bg-pink-500/10 text-pink-400 border-pink-500/30', icon: '🖼️' },
      link: { label: 'External Link', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', icon: '🔗' },
    };
    return badges[type] || badges.pdf;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-lg text-white tracking-tight">Organizer Hub</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Organizer Mode
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {user?.organization || 'Campus Society & Event Management'} • {user?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:opacity-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Event</span>
            </button>
            <button
              onClick={logout}
              className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <span className="text-xs text-slate-400 font-medium">Campus Events</span>
            <div className="text-2xl font-black font-heading text-white mt-1">{events.length}</div>
            <span className="text-[11px] text-amber-400 mt-1 block">Active in CampusOne Feed</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <span className="text-xs text-slate-400 font-medium">Post-Event Resource Hub</span>
            <div className="text-2xl font-black font-heading text-amber-400 mt-1">
              {events.reduce((sum, e) => sum + (e.resources?.length || 0), 0)} Files
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Docs, PPTs, Drive Links & QR</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <span className="text-xs text-slate-400 font-medium">Organizer Permissions</span>
            <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Full Resource & Event Control
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Restricted only to Organizers</span>
          </div>
        </div>

        {/* Events Section */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold font-heading text-white">Campus Events & Resources</h2>
            <p className="text-xs text-slate-400">
              Manage events and attach post-event slide decks, docs, Drive folders, and recruitment forms.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <svg className="animate-spin h-8 w-8 text-amber-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 p-6">
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-base font-bold text-white mb-1">No Events Published Yet</h3>
            <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
              Get started by creating your society's first campus event.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Create New Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => {
              const resCount = event.resources?.length || 0;
              return (
                <div
                  key={event._id}
                  className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {event.category}
                        </span>
                        <h3 className="text-base font-bold font-heading text-white mt-1.5 line-clamp-1">
                          {event.title}
                        </h3>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        event.status === 'upcoming' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {event.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {event.about}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 mb-4 py-2.5 px-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div>📍 {event.venue}</div>
                      <div>🗓️ {event.dateStr}</div>
                      <div>⏰ {event.time}</div>
                      <div>👥 {event.teamSize}</div>
                    </div>

                    {/* Resources attached preview */}
                    {resCount > 0 && (
                      <div className="mb-4">
                        <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5 mb-2">
                          <span>📎 Attached Post-Event Resources ({resCount}):</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {event.resources.slice(0, 3).map((r, i) => {
                            const badge = getResourceTypeBadge(r.type);
                            return (
                              <a
                                key={i}
                                href={r.url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={`text-[10px] px-2 py-1 rounded-lg border flex items-center gap-1 hover:opacity-80 transition-opacity ${badge.bg}`}
                              >
                                <span>{badge.icon}</span>
                                <span className="max-w-[120px] truncate">{r.title}</span>
                              </a>
                            );
                          })}
                          {resCount > 3 && (
                            <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 text-slate-400">
                              +{resCount - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => handleOpenResourceManager(event)}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Post Resources ({resCount})</span>
                    </button>
                    {onOpenEvent && (
                      <button
                        onClick={() => onOpenEvent(event._id)}
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                      >
                        Preview
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold font-heading text-white">Create New Event</h3>
                <p className="text-xs text-slate-400">Publish a campus event to the student feed</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. HackDTU 2026: 36-Hour National Hackathon"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Events">Events</option>
                    <option value="Competitions">Competitions</option>
                    <option value="Workshops">Workshops</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Venue *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.venue}
                    onChange={(e) => setCreateForm({ ...createForm, venue: e.target.value })}
                    placeholder="e.g. Main Auditorium / Lab 3"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Event Date *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.dateStr}
                    onChange={(e) => setCreateForm({ ...createForm, dateStr: e.target.value })}
                    placeholder="e.g. Sep 22, 2026"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.time}
                    onChange={(e) => setCreateForm({ ...createForm, time: e.target.value })}
                    placeholder="e.g. 10:00 AM - 04:00 PM"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  About Event *
                </label>
                <textarea
                  required
                  rows={3}
                  value={createForm.about}
                  onChange={(e) => setCreateForm({ ...createForm, about: e.target.value })}
                  placeholder="Provide complete description, rules, and overview..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Team Size
                  </label>
                  <input
                    type="text"
                    value={createForm.teamSize}
                    onChange={(e) => setCreateForm({ ...createForm, teamSize: e.target.value })}
                    placeholder="e.g. 1 - 4 Members"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={createForm.tags}
                    onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                    placeholder="Tech, AI, Hackathon"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md hover:opacity-95 disabled:opacity-50"
                >
                  {creating ? 'Publishing...' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POST-EVENT RESOURCES MODAL */}
      {showResourceModal && selectedEventForResources && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400">Post-Event Media & Resources</span>
                <h3 className="text-base font-bold font-heading text-white line-clamp-1">
                  {selectedEventForResources.title}
                </h3>
              </div>
              <button
                onClick={() => setShowResourceModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* List of currently attached resources */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
                Attached Resources ({(selectedEventForResources.resources || []).length})
              </h4>
              {(!selectedEventForResources.resources || selectedEventForResources.resources.length === 0) ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                  No post-event materials attached yet. Add PDFs, PPTs, Drive links, forms, or QR codes below.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedEventForResources.resources.map((res) => {
                    const badge = getResourceTypeBadge(res.type);
                    return (
                      <div
                        key={res._id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${badge.bg}`}>
                            {badge.icon} {badge.label}
                          </span>
                          <div className="truncate">
                            <span className="font-bold text-white block truncate">{res.title}</span>
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-primary hover:underline truncate block"
                            >
                              {res.url}
                            </a>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteResource(res._id)}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors ml-2 shrink-0"
                          title="Delete resource"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add Resource Form */}
            <form onSubmit={handleAddResource} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                + Attach New Resource / Link
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Resource Type *
                  </label>
                  <select
                    value={resourceForm.type}
                    onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="pdf">📄 PDF Document</option>
                    <option value="ppt">📊 PPT / Presentation Slides</option>
                    <option value="doc">📝 Doc / Handout</option>
                    <option value="drive">📁 Google Drive Link</option>
                    <option value="form">📋 Google / Recruitment Form</option>
                    <option value="qr">📱 QR Code Asset</option>
                    <option value="video">🎥 Video Recording</option>
                    <option value="image">🖼️ Image / Photo Album</option>
                    <option value="link">🔗 External Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Resource Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={resourceForm.title}
                    onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                    placeholder="e.g. Session Slides & Code Repo"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Resource URL / Link / Drive / Form URL *
                </label>
                <input
                  type="url"
                  required
                  value={resourceForm.url}
                  onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                  placeholder="https://drive.google.com/... or https://forms.gle/..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Optional Description / Notes
                </label>
                <input
                  type="text"
                  value={resourceForm.description}
                  onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                  placeholder="e.g. Includes workshop solutions and competition dataset"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={uploadingResource}
                className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {uploadingResource ? 'Attaching...' : 'Attach Resource'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboardScreen;

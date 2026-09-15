import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, User, Mail, Hash, Phone, Users, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

export const RegistrationScreen = ({ eventId, onBack, onComplete }) => {
  const { user } = useAuth();
  const { recordRegistration } = useAppData();
  const { showToast } = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Form state prefilled from demo user
  const [formData, setFormData] = useState({
    fullName: '',
    collegeEmail: '',
    rollNumber: '',
    phoneNumber: '',
    year: '3rd Year',
    branch: 'Computer Science & Engineering',
    teamName: '',
    teamMembers: '',
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name || '',
        collegeEmail: user.email || '',
        rollNumber: user.rollNumber || '',
        phoneNumber: user.phone || '+91 98765 43210',
        year: user.year || '3rd Year',
        branch: user.branch || 'Computer Science & Engineering',
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await api.getEventById(eventId);
        setEvent(res.event);
      } catch (err) {
        showToast('Failed to load event for registration', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (eventId) fetchEvent();
  }, [eventId, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.fullName || !formData.collegeEmail || !formData.rollNumber || !formData.phoneNumber) {
      setErrorMessage('Please fill in all mandatory identity fields.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        fullName: formData.fullName,
        collegeEmail: formData.collegeEmail,
        rollNumber: formData.rollNumber,
        phoneNumber: formData.phoneNumber,
        year: formData.year,
        branch: formData.branch,
        teamName: formData.teamName,
        teamMembers: formData.teamMembers
          ? formData.teamMembers.split(',').map((m) => m.trim()).filter(Boolean)
          : [],
      };

      const res = await api.registerForEvent(eventId, payload);
      recordRegistration(eventId);
      setSuccessData(res);
      showToast('🎉 Registration confirmed!', 'success');
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <LoadingSkeleton type="details" />
      </div>
    );
  }

  // Success View Screen
  if (successData) {
    return (
      <div className="min-h-full bg-campusBg p-4 flex flex-col justify-center items-center text-center animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-md shadow-emerald-500/10">
          <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
        </div>

        <h2 className="text-xl font-heading font-black text-slate-900 mb-1">
          Registration Successful!
        </h2>
        <p className="text-xs text-slate-500 max-w-[260px] mb-6">
          A confirmation alert has been dispatched to your WhatsApp and college email.
        </p>

        {/* Event Summary Card */}
        <div className="w-full max-w-sm bg-surface rounded-2xl p-4 border border-slate-200/80 shadow-card text-left space-y-2.5 mb-6">
          <div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
              Event
            </span>
            <span className="text-sm font-heading font-extrabold text-slate-900 block">
              {event?.title}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Club</span>
              <span className="text-xs font-bold text-slate-700 block truncate">
                {event?.club?.name}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Date</span>
              <span className="text-xs font-bold text-slate-700 block truncate">
                {event?.dateStr}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-slate-400 font-semibold block">Venue</span>
              <span className="text-xs font-bold text-slate-700 block truncate">
                {event?.venue}
              </span>
            </div>
          </div>
        </div>

        <button
          id="btn-back-to-event"
          onClick={onBack}
          className="w-full max-w-sm py-3 px-4 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover shadow-md shadow-primary/20 transition-all touch-scale"
        >
          Back to Event
        </button>
      </div>
    );
  }

  const isTeam = event?.isTeamEvent || (event?.teamSize && event.teamSize.includes('Members'));

  return (
    <div className="min-h-full bg-campusBg p-4 pb-12 animate-fade-in flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          id="btn-registration-back"
          onClick={onBack}
          aria-label="Back"
          className="p-2 rounded-xl bg-surface border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-heading font-black text-slate-900 leading-tight">
            Event Registration
          </h2>
          <p className="text-[11px] text-slate-500 truncate max-w-[250px]">
            {event?.title}
          </p>
        </div>
      </div>

      {/* Event Summary Pill */}
      <div className="bg-surface rounded-2xl p-3 border border-slate-200/80 shadow-subtle mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold font-heading text-slate-800 truncate">
            {event?.title}
          </span>
          <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">
            {event?.category}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {event?.club?.name} &bull; {event?.dateStr} &bull; {event?.venue}
        </p>
      </div>

      {/* Error Notice if any */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium mb-3">
          {errorMessage}
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5 flex-1">
        {/* Full Name */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full pl-9 pr-3 py-2 bg-surface text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* College Email */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">College Email *</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="email"
              required
              value={formData.collegeEmail}
              onChange={(e) => setFormData({ ...formData, collegeEmail: e.target.value })}
              className="w-full pl-9 pr-3 py-2 bg-surface text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Roll Number & Phone in 2-col */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Roll Number *</label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-surface text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number *</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-surface text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Year Dropdown & Branch Dropdown */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Year *</label>
            <select
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className="w-full px-3 py-2 bg-surface text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="Postgraduate">Postgraduate</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Branch *</label>
            <select
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              className="w-full px-3 py-2 bg-surface text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="Computer Science & Engineering">CSE</option>
              <option value="Information Technology">IT</option>
              <option value="Electronics & Communication">ECE</option>
              <option value="Electrical Engineering">EE</option>
              <option value="Mechanical Engineering">ME</option>
              <option value="Civil Engineering">CE</option>
              <option value="Economics & Management">Economics</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Conditional Team Fields (When Team Event) */}
        {isTeam && (
          <div className="p-3 bg-primary/5 rounded-2xl border border-primary/20 space-y-3 mt-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary font-heading">
              <Users className="w-4 h-4" />
              <span>Team Event Details ({event.teamSize})</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Team Name *</label>
              <input
                type="text"
                required={isTeam}
                placeholder="e.g. CodeWizards"
                value={formData.teamName}
                onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                className="w-full px-3 py-2 bg-surface text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Teammate Roll Numbers (Comma separated)
              </label>
              <input
                type="text"
                placeholder="23BCS1089, 23BEC1012"
                value={formData.teamMembers}
                onChange={(e) => setFormData({ ...formData, teamMembers: e.target.value })}
                className="w-full px-3 py-2 bg-surface text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
        )}

        <div className="pt-3">
          <button
            type="submit"
            id="btn-submit-registration"
            disabled={submitting}
            className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md shadow-primary/30 transition-all touch-scale disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span>Submitting Registration...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <span className="font-extrabold">✓</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistrationScreen;

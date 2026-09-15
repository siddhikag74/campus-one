import React, { useState } from 'react';
import { Mail, Lock, User, Building2, GraduationCap, Calendar, Eye, EyeOff, ArrowRight, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SignUpScreen = ({ onNavigateToLogin }) => {
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: 'Delhi Technological University',
    branch: 'Computer Science & Engineering',
    year: '1st Year',
    rollNumber: '',
    phone: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const passwordLengthValid = formData.password.length >= 8;
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter your college email address.');
      return;
    }

    if (!passwordLengthValid) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    const result = await signup(formData);
    setLoading(false);
    if (!result.success) {
      setError(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back Button & Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary transition-colors py-1.5 px-2 rounded-lg hover:bg-slate-200/60"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </button>
          <span className="text-[11px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            Student Registration
          </span>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
            Join CampusOne
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Create your account to discover events, hackathons, and clubs.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200/80 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs font-semibold text-rose-700 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <p className="flex-1 leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Priya Singh"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* College Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                College / University Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="student@dtu.ac.in"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* College / University */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                College / University *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={formData.college}
                  onChange={(e) => handleChange('college', e.target.value)}
                  placeholder="Delhi Technological University"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Course / Department & Year */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Course / Dept *
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={formData.branch}
                    onChange={(e) => handleChange('branch', e.target.value)}
                    placeholder="CSE, ECE, Mech..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-9 pr-2.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Year of Study *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={formData.year}
                    onChange={(e) => handleChange('year', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-9 pr-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgrad">Postgraduate</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                <span className={`w-2 h-2 rounded-full ${passwordLengthValid ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className={passwordLengthValid ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                  At least 8 characters
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-slate-400"
                />
              </div>
              {formData.confirmPassword && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                  {passwordsMatch ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-rose-600 font-semibold">
                      Passwords do not match
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-bold font-heading rounded-xl shadow-md shadow-primary/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 touch-scale cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Already have account */}
          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="font-bold text-primary hover:text-primary-hover hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpScreen;

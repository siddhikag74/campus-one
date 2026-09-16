import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen = ({ onNavigateToSignUp, onNavigateToForgotPassword }) => {
  const { login, demoLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your college email and password.');
      return;
    }

    setError('');
    setLoading(true);
    const result = await login({ email, password, remember: rememberMe });
    setLoading(false);
    if (!result.success) {
      setError(result.message || 'Incorrect email or password.');
    }
  };

  const handleDemoLogin = async (role = 'student') => {
    setError('');
    setDemoLoading(role);
    await demoLogin(role);
    setDemoLoading(null);
  };

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-violet-600 text-white font-black font-heading text-2xl shadow-lg shadow-primary/25 mb-3">
            C
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
              CampusOne
            </h1>
            <span className="text-[11px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Beta
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Sign in to discover opportunities on your campus.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200/80 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs font-semibold text-rose-700 flex items-start gap-2.5 animate-in fade-in duration-200">
              <span className="text-sm shrink-0">⚠️</span>
              <p className="flex-1 leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                College Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@dtu.ac.in"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onNavigateToForgotPassword}
                  className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30 accent-primary"
                />
                Keep me signed in
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !!demoLoading}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-sm font-bold font-heading rounded-xl shadow-md shadow-primary/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 touch-scale cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2.5 text-slate-400 font-bold tracking-wider">
                Quick Evaluator Access (3 Roles)
              </span>
            </div>
          </div>

          {/* 3-Role Demo Buttons */}
          <div className="grid grid-cols-1 gap-2">
            {/* Student Demo */}
            <button
              type="button"
              onClick={() => handleDemoLogin('student')}
              disabled={loading || !!demoLoading}
              className="w-full py-2 px-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:border-blue-400 rounded-xl text-xs font-bold text-blue-700 flex items-center justify-between transition-all hover:shadow-sm touch-scale cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🎓</span>
                <div>
                  <div className="font-extrabold text-slate-900 text-xs">
                    Demo Student <span className="text-[10px] font-mono text-blue-600 font-normal">(Arjun Sharma)</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    Student Feed, Registered Events & Schedule
                  </div>
                </div>
              </div>
              {demoLoading === 'student' ? (
                <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <span className="text-[10px] font-bold bg-blue-600/10 text-blue-600 px-2 py-0.5 rounded-md">Try Student</span>
              )}
            </button>

            {/* Organizer Demo */}
            <button
              type="button"
              onClick={() => handleDemoLogin('organizer')}
              disabled={loading || !!demoLoading}
              className="w-full py-2 px-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-400 rounded-xl text-xs font-bold text-amber-700 flex items-center justify-between transition-all hover:shadow-sm touch-scale cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">📢</span>
                <div>
                  <div className="font-extrabold text-slate-900 text-xs">
                    Demo Organizer <span className="text-[10px] font-mono text-amber-600 font-normal">(IEEE DTU)</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    Create Events & Upload Docs/PPTs/Drive/QR
                  </div>
                </div>
              </div>
              {demoLoading === 'organizer' ? (
                <div className="w-4 h-4 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
              ) : (
                <span className="text-[10px] font-bold bg-amber-600/10 text-amber-600 px-2 py-0.5 rounded-md">Try Organizer</span>
              )}
            </button>

            {/* Professor Demo */}
            <button
              type="button"
              onClick={() => handleDemoLogin('professor')}
              disabled={loading || !!demoLoading}
              className="w-full py-2 px-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 hover:border-emerald-400 rounded-xl text-xs font-bold text-emerald-700 flex items-center justify-between transition-all hover:shadow-sm touch-scale cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🏛️</span>
                <div>
                  <div className="font-extrabold text-slate-900 text-xs">
                    Demo Professor <span className="text-[10px] font-mono text-emerald-600 font-normal">(Dr. Sharma)</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    Timetable View, Cancel & Postpone Classes
                  </div>
                </div>
              </div>
              {demoLoading === 'professor' ? (
                <div className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
              ) : (
                <span className="text-[10px] font-bold bg-emerald-600/10 text-emerald-600 px-2 py-0.5 rounded-md">Try Professor</span>
              )}
            </button>
          </div>


          {/* Sign Up Link */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-500 font-medium">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToSignUp}
                className="font-bold text-primary hover:text-primary-hover hover:underline"
              >
                Sign up for CampusOne
              </button>
            </p>
          </div>
        </div>

        {/* Security / Privacy Footer */}
        <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Secured with JWT and isolated student databases</span>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

import React, { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const ForgotPasswordScreen = ({ onNavigateToLogin }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSubmitted(true);
      showToast('Password recovery instructions sent!', 'success');
    } catch (err) {
      showToast('Unable to process request right now.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back Button */}
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary transition-colors py-1.5 px-2 rounded-lg hover:bg-slate-200/60 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </button>

        {/* Card */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200/80 space-y-5">
          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-extrabold font-heading text-slate-900">
                Check Your Inbox
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                If an account exists for <span className="font-bold text-slate-800">{email}</span>, password reset instructions have been dispatched.
              </p>
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold font-heading rounded-xl transition-all shadow-md"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-2">
                <h1 className="text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
                  Reset Password
                </h1>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  Enter your registered college email to receive reset instructions.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-sm font-bold font-heading rounded-xl shadow-md shadow-primary/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 touch-scale cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Recovery Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;

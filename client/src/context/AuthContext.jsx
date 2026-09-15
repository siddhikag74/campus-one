import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const initAuth = useCallback(async () => {
    const token = localStorage.getItem('campusone_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.getMe();
      if (data.user) {
        setUser(data.user);
      } else {
        localStorage.removeItem('campusone_token');
        setUser(null);
      }
    } catch (err) {
      console.warn('Session restoration failed:', err.message);
      localStorage.removeItem('campusone_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();

    // Listen for unauthorized 401 events dispatched from API calls
    const handleUnauthorized = () => {
      localStorage.removeItem('campusone_token');
      setUser(null);
      showToast('Session expired. Please log in again.', 'warning');
    };

    window.addEventListener('campusone:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('campusone:unauthorized', handleUnauthorized);
    };
  }, [initAuth, showToast]);

  const login = async ({ email, password, remember = true }) => {
    try {
      const res = await api.login({ email, password });
      if (res.user) {
        setUser(res.user);
        showToast(res.message || 'Login successful!', 'success');
        return { success: true, user: res.user };
      }
      return { success: false, message: 'Login failed' };
    } catch (err) {
      showToast(err.message || 'Incorrect email or password.', 'error');
      return { success: false, message: err.message || 'Incorrect email or password.' };
    }
  };

  const signup = async (formData) => {
    try {
      const res = await api.register(formData);
      if (res.user) {
        setUser(res.user);
        showToast('Account created successfully! Welcome 🎉', 'success');
        return { success: true, user: res.user };
      }
      return { success: false, message: 'Registration failed' };
    } catch (err) {
      showToast(err.message || 'Registration failed. Please try again.', 'error');
      return { success: false, message: err.message || 'Registration failed.' };
    }
  };

  const demoLogin = async () => {
    try {
      const res = await api.demoLogin();
      if (res.user) {
        setUser(res.user);
        showToast('Logged in as Demo Student Arjun Sharma 🚀', 'success');
        return { success: true, user: res.user };
      }
      return { success: false, message: 'Demo login failed' };
    } catch (err) {
      showToast(err.message || 'Demo login failed', 'error');
      return { success: false, message: err.message };
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  const updateProfile = async (formData) => {
    try {
      const res = await api.updateProfile(formData);
      if (res.user) {
        setUser(res.user);
        showToast('Profile updated successfully', 'success');
        return true;
      }
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
      return false;
    }
  };

  const saveInterests = async ({ interests, interestSubCategories }) => {
    try {
      const res = await api.saveOnboardingInterests({ interests, interestSubCategories });
      if (res.user) {
        setUser(res.user);
        showToast(res.message || 'Preferences personalized successfully! 🎯', 'success');
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'Failed to save interests' };
    } catch (err) {
      showToast(err.message || 'Failed to save interests', 'error');
      return { success: false, message: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        demoLogin,
        logout,
        updateProfile,
        saveInterests,
        refreshUser: initAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;

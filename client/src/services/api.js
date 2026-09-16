// In production on Vercel (All-in-One), API is served from the same domain under /api
// If an external backend is configured via VITE_API_URL, use that directly
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const getHeaders = () => {
  const token = localStorage.getItem('campusone_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({ success: false, message: 'Server response could not be parsed.' }));
  if (!res.ok) {
    if (res.status === 401) {
      // Broadcast session expired / unauthorized event for AuthContext to intercept
      window.dispatchEvent(new CustomEvent('campusone:unauthorized'));
    }
    const error = new Error(data.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
};

export const api = {
  // Authentication
  login: async (credentials) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('campusone_token', data.token);
    }
    return data;
  },

  register: async (formData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('campusone_token', data.token);
    }
    return data;
  },

  demoLogin: async (role = 'student') => {
    const res = await fetch(`${API_BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('campusone_token', data.token);
    }
    return data;
  },

  selectRole: async ({ role, organization, department }) => {
    const res = await fetch(`${API_BASE}/auth/role`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ role, organization, department }),
    });
    return handleResponse(res);
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
      });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('campusone_token');
    }
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  saveOnboardingInterests: async ({ interests, interestSubCategories }) => {
    const res = await fetch(`${API_BASE}/auth/onboarding`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ interests, interestSubCategories }),
    });
    return handleResponse(res);
  },

  forgotPassword: async (email) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  resetPassword: async (payload) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Events (Organizer & Student)
  createEvent: async (payload) => {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  addEventResource: async (eventId, payload) => {
    const res = await fetch(`${API_BASE}/events/${eventId}/resources`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  deleteEventResource: async (eventId, resourceId) => {
    const res = await fetch(`${API_BASE}/events/${eventId}/resources/${resourceId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },


  // Events
  getEvents: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.status) query.append('status', params.status);

    const res = await fetch(`${API_BASE}/events?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getEventById: async (id) => {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  registerForEvent: async (id, payload) => {
    const res = await fetch(`${API_BASE}/events/${id}/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  saveEvent: async (id) => {
    const res = await fetch(`${API_BASE}/events/${id}/save`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  unsaveEvent: async (id) => {
    const res = await fetch(`${API_BASE}/events/${id}/save`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  markImportant: async (id) => {
    const res = await fetch(`${API_BASE}/events/${id}/important`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  unmarkImportant: async (id) => {
    const res = await fetch(`${API_BASE}/events/${id}/important`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  submitReview: async (id, payload) => {
    const res = await fetch(`${API_BASE}/events/${id}/reviews`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Clubs
  getClubs: async () => {
    const res = await fetch(`${API_BASE}/clubs`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getClubById: async (id) => {
    const res = await fetch(`${API_BASE}/clubs/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  followClub: async (id) => {
    const res = await fetch(`${API_BASE}/clubs/${id}/follow`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  unfollowClub: async (id) => {
    const res = await fetch(`${API_BASE}/clubs/${id}/follow`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Calendar
  getCalendar: async (year, month) => {
    const query = new URLSearchParams();
    if (year) query.append('year', year);
    if (month) query.append('month', month);

    const res = await fetch(`${API_BASE}/calendar?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Notifications
  getNotifications: async () => {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  markNotificationAsRead: async (id) => {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  markAllNotificationsAsRead: async () => {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Profile
  getProfile: async () => {
    const res = await fetch(`${API_BASE}/profile`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateProfile: async (payload) => {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Recommendations
  getRecommendations: async () => {
    const res = await fetch(`${API_BASE}/recommendations`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Timetable
  getTimetable: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.day) query.append('day', params.day);
    if (params.status) query.append('status', params.status);

    const res = await fetch(`${API_BASE}/timetable?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getTodayClasses: async (day) => {
    const query = new URLSearchParams();
    if (day) query.append('day', day);

    const res = await fetch(`${API_BASE}/timetable/today?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getWeekTimetable: async (weekOffset = 0) => {
    const query = new URLSearchParams();
    if (weekOffset !== undefined) query.append('weekOffset', weekOffset);

    const res = await fetch(`${API_BASE}/timetable/week?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getTimetableChanges: async () => {
    const res = await fetch(`${API_BASE}/timetable/changes`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getTimetableEntry: async (id) => {
    const res = await fetch(`${API_BASE}/timetable/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  changeTimetableSchedule: async (id, payload) => {
    const res = await fetch(`${API_BASE}/timetable/${id}/change`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  resetDemoTimetable: async () => {
    const res = await fetch(`${API_BASE}/timetable/reset-demo`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

export default api;

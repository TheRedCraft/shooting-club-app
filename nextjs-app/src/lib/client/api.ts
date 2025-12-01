'use client';

import axios from 'axios';

// Create an axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth service
export const authService = {
  login: (usernameOrEmail: string, password: string) => {
    return api.post('/auth/login', { email: usernameOrEmail, password });
  },
  register: (username: string, email: string, password: string) => {
    return api.post('/auth/register', { username, email, password });
  }
};

// Admin service
export const adminService = {
  getPendingUsers: () => api.get('/admin/pending'),
  getLinkedUsers: () => api.get('/admin/linked-users'),
  getMeytonShooters: () => api.get('/admin/meyton-shooters'),
  linkUser: (userId: number, shooterId: string) => 
    api.post('/admin/link-user', { userId, shooterId }),
  unlinkUser: (userId: number) => api.post(`/admin/unlink-user/${userId}`),
  approveUser: (userId: number) => api.post(`/admin/approve-user/${userId}`),
  deleteUser: (userId: number) => api.delete(`/admin/users/${userId}`),
  toggleAdmin: (userId: number, isAdminStatus: boolean) => 
    api.post('/admin/toggle-admin', { userId, isAdminStatus })
};

// Dashboard service
export const dashboardService = {
  getStats: (timeRange = 'all') => api.get(`/dashboard/stats?timeRange=${timeRange}`),
  getRecentSessions: (timeRange = 'all', page = 1, limit = 10) => 
    api.get(`/dashboard/recent-sessions?timeRange=${timeRange}&page=${page}&limit=${limit}`),
  getScoreTrend: (timeRange = 'all') => api.get(`/dashboard/score-trend?timeRange=${timeRange}`),
  getShotDistribution: (timeRange = 'all') => api.get(`/dashboard/shot-distribution?timeRange=${timeRange}`),
  getTrends: (metric: string, period: string, limit = 12) => 
    api.get(`/dashboard/trends?metric=${metric}&period=${period}&limit=${limit}`)
};

// Session service
export const sessionService = {
  getSession: (id: string) => api.get(`/sessions/${id}`)
};

// Leaderboard service
export const leaderboardService = {
  getLeaderboard: (sortBy = 'avgScore', timeRange = 'all', limit = 50) => 
    api.get(`/leaderboard?sortBy=${sortBy}&timeRange=${timeRange}&limit=${limit}`)
};

// Profile service
export const profileService = {
  getProfile: () => api.get('/profile')
};

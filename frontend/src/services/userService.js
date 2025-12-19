import api from './api';

export const userService = {
  // Get all users
  getAllUsers: async (params) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  // Upload avatar - FIXED VERSION
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post('/users/avatar', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data' 
      }
    });
    
    return response.data;
  },

  // Search users
  searchUsers: async (query) => {
    const response = await api.get('/users/search', { params: query });
    return response.data;
  },

  // Get user stats
  getUserStats: async (userId) => {
    const response = await api.get(`/users/${userId}/stats`);
    return response.data;
  },

  // Get leaderboard
  getLeaderboard: async (params) => {
    const response = await api.get('/users/leaderboard', { params });
    return response.data;
  },
};
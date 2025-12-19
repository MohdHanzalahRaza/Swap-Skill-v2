// ============================================
// FILE: frontend/src/services/exchangeService.js
// CREATE NEW FILE
// ============================================
import api from './api';

export const exchangeService = {
  // Create exchange request
  createExchange: async (exchangeData) => {
    const response = await api.post('/exchanges', exchangeData);
    return response.data;
  },

  // Get all my exchanges
  getMyExchanges: async (params) => {
    const response = await api.get('/exchanges', { params });
    return response.data;
  },

  // Get exchange by ID
  getExchangeById: async (exchangeId) => {
    const response = await api.get(`/exchanges/${exchangeId}`);
    return response.data;
  },

  // Update exchange status (accept/reject/complete)
  updateExchangeStatus: async (exchangeId, status) => {
    const response = await api.put(`/exchanges/${exchangeId}/status`, { status });
    return response.data;
  },

  // Cancel exchange
  cancelExchange: async (exchangeId) => {
    const response = await api.delete(`/exchanges/${exchangeId}`);
    return response.data;
  },

  // Schedule exchange session
  scheduleExchange: async (exchangeId, scheduleData) => {
    const response = await api.put(`/exchanges/${exchangeId}/schedule`, scheduleData);
    return response.data;
  },

  // Get exchange statistics
  getExchangeStats: async () => {
    const response = await api.get('/exchanges/stats');
    return response.data;
  }
};
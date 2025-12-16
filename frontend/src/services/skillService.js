import api from './api';

export const skillService = {
  getAllSkills: async (params) => {
    const response = await api.get('/skills', { params });
    return response.data;
  },

  createSkill: async (skillData) => {
    const response = await api.post('/skills', skillData);
    return response.data;
  },

  updateSkill: async (skillId, skillData) => {
    const response = await api.put(`/skills/${skillId}`, skillData);
    return response.data;
  },

  deleteSkill: async (skillId) => {
    const response = await api.delete(`/skills/${skillId}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/skills/categories');
    return response.data;
  },
};
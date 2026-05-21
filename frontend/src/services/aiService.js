import { api } from './api';

export const getAIStatus = () => api.get('/ai/status');

export const getAIProfile = () => api.get('/ai/profile');

export const analyzeResumeAI = (jobDescription = '') =>
  api.post('/ai/analyze', { jobDescription });

export const getAIRecommendations = (limit = 12) =>
  api.get(`/ai/recommendations?limit=${limit}`);

export const matchInternshipAI = (internshipId) =>
  api.post(`/ai/match/${internshipId}`);

export const sendAIChat = (message) => api.post('/ai/chat', { message });

export const getAdminAIInsights = () => api.get('/ai/admin/insights');

export default {
  getAIStatus,
  getAIProfile,
  analyzeResumeAI,
  getAIRecommendations,
  matchInternshipAI,
  sendAIChat,
  getAdminAIInsights,
};

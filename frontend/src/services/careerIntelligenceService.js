import { api } from './api';

// --- Career Goals ---
export const getMyCareerGoal = () => api.get('/career-goals');
export const upsertCareerGoal = (data) => api.post('/career-goals', data);
export const deleteCareerGoal = () => api.delete('/career-goals');

// --- Skill Assessments ---
export const getMyAssessments = () => api.get('/skill-assessments');
export const addAssessment = (data) => api.post('/skill-assessments', data);
export const updateAssessment = (id, data) => api.put(`/skill-assessments/${id}`, data);
export const deleteAssessment = (id) => api.delete(`/skill-assessments/${id}`);
export const getAdminAllAssessments = () => api.get('/skill-assessments/admin/all');

// --- Interview Logs ---
export const getMyInterviewLogs = () => api.get('/interview-logs');
export const createInterviewLog = (data) => api.post('/interview-logs', data);
export const updateInterviewLog = (id, data) => api.put(`/interview-logs/${id}`, data);
export const deleteInterviewLog = (id) => api.delete(`/interview-logs/${id}`);
export const getAdminInterviewLogs = () => api.get('/interview-logs/admin/all');

// --- Feedback ---
export const getFeedbackForms = () => api.get('/feedback/forms');
export const getFeedbackFormById = (id) => api.get(`/feedback/forms/${id}`);
export const createFeedbackForm = (data) => api.post('/feedback/forms', data);
export const updateFeedbackForm = (id, data) => api.put(`/feedback/forms/${id}`, data);
export const deleteFeedbackForm = (id) => api.delete(`/feedback/forms/${id}`);
export const submitFeedbackResponse = (formId, data) => api.post(`/feedback/forms/${formId}/respond`, data);
export const getFormResponses = (formId) => api.get(`/feedback/forms/${formId}/responses`);

// --- Career Events ---
export const getCareerEvents = () => api.get('/career-events');
export const getCareerEventById = (id) => api.get(`/career-events/${id}`);
export const createCareerEvent = (data) => api.post('/career-events', data);
export const updateCareerEvent = (id, data) => api.put(`/career-events/${id}`, data);
export const deleteCareerEvent = (id) => api.delete(`/career-events/${id}`);
export const registerForEvent = (id) => api.post(`/career-events/${id}/register`);
export const unregisterFromEvent = (id) => api.delete(`/career-events/${id}/register`);

// --- Placements ---
export const getMyPlacements = () => api.get('/placements/my');
export const addPlacement = (data) => api.post('/placements', data);
export const updatePlacement = (id, data) => api.put(`/placements/${id}`, data);
export const deletePlacement = (id) => api.delete(`/placements/${id}`);
export const adminGetAllPlacements = () => api.get('/placements/admin/all');
export const adminVerifyPlacement = (id) => api.put(`/placements/admin/${id}/verify`);

// --- Adaptive Learning ---
export const getMyAdaptivePlan = () => api.get('/adaptive-learning');
export const refreshAdaptivePlan = () => api.post('/adaptive-learning/refresh');
export const markGuideCompleted = (guideId) => api.put(`/adaptive-learning/${guideId}/complete`);
export const adminGetAllAdaptivePlans = () => api.get('/adaptive-learning/admin/all');

// --- Career Intelligence ---
export const getCareerDashboard = () => api.get('/career-intelligence/dashboard');
export const getSkillGapAnalysis = () => api.get('/career-intelligence/skill-gap');
export const getAdminCareerIntelligenceOverview = () => api.get('/career-intelligence/admin/overview');

export default {
  // Career Goals
  getMyCareerGoal,
  upsertCareerGoal,
  deleteCareerGoal,
  // Skill Assessments
  getMyAssessments,
  addAssessment,
  updateAssessment,
  deleteAssessment,
  getAdminAllAssessments,
  // Interview Logs
  getMyInterviewLogs,
  createInterviewLog,
  updateInterviewLog,
  deleteInterviewLog,
  getAdminInterviewLogs,
  // Feedback
  getFeedbackForms,
  getFeedbackFormById,
  createFeedbackForm,
  updateFeedbackForm,
  deleteFeedbackForm,
  submitFeedbackResponse,
  getFormResponses,
  // Career Events
  getCareerEvents,
  getCareerEventById,
  createCareerEvent,
  updateCareerEvent,
  deleteCareerEvent,
  registerForEvent,
  unregisterFromEvent,
  // Placements
  getMyPlacements,
  addPlacement,
  updatePlacement,
  deletePlacement,
  adminGetAllPlacements,
  adminVerifyPlacement,
  // Adaptive Learning
  getMyAdaptivePlan,
  refreshAdaptivePlan,
  markGuideCompleted,
  adminGetAllAdaptivePlans,
  // Career Intelligence
  getCareerDashboard,
  getSkillGapAnalysis,
  getAdminCareerIntelligenceOverview,
};

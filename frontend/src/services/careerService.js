import { api } from './api';

// --- Skill Evidence ---
export const getSkillEvidence = () => api.get('/skill-evidence');
export const getSkillEvidenceBreakdown = () => api.get('/skill-evidence/breakdown');
export const addSkillEvidence = (data) => api.post('/skill-evidence', data);

// --- Career ---
export const getSkillGaps = () => api.get('/career/skill-gaps');
export const getActionPlan = () => api.get('/career/action-plan');
export const updateActionItem = (id) => api.patch('/career/action-plan/' + id, {});
export const getReadiness = () => api.get('/career/readiness');
export const getDigitalTwin = () => api.get('/career/digital-twin');
export const getCareerPaths = () => api.get('/career/career-paths');

// --- Outcomes ---
export const recordOutcome = (data) => api.post('/outcomes', data);
export const getOutcomePatterns = () => api.get('/outcomes/patterns');
export const getInterviewLearning = () => api.get('/outcomes/interview-learning');

// --- Certificates ---
export const getMyCertificates = () => api.get('/certificates/my');
export const verifyCertificate = (id) => api.get('/certificates/verify/' + id);
export const issueCertificate = (data) => api.post('/certificates', data);
export const verifyCertificateAdmin = (id) => api.put('/certificates/' + id + '/verify', {});
export const revokeCertificate = (id) => api.put('/certificates/' + id + '/revoke', {});
export const getAllCertificates = (params) => api.get('/certificates', { params });

// --- Admin ---
export const getCareerInsights = () => api.get('/admin/career-insights');

// --- Completion ---
export const getPartnerCompletions = (params) => api.get('/completion/partner/all', { params });
export const updateCompletionStatus = (id, data) => api.put('/completion/' + id, data);

// --- Internship Quality ---
export const getInternshipQuality = (internshipId) => api.get(`/internship-quality/${internshipId}`);

export default {
  // Skill Evidence
  getSkillEvidence,
  getSkillEvidenceBreakdown,
  addSkillEvidence,
  // Career
  getSkillGaps,
  getActionPlan,
  updateActionItem,
  getReadiness,
  getDigitalTwin,
  getCareerPaths,
  // Outcomes
  recordOutcome,
  getOutcomePatterns,
  getInterviewLearning,
  // Certificates
  getMyCertificates,
  verifyCertificate,
  issueCertificate,
  verifyCertificateAdmin,
  revokeCertificate,
  getAllCertificates,
  // Admin
  getCareerInsights,
  // Completion
  getPartnerCompletions,
  updateCompletionStatus,
  // Internship Quality
  getInternshipQuality,
};

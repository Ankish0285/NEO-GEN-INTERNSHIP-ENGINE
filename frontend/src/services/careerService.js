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

// --- Career Intelligence ---
export const getSkillGapPriority = () => api.get('/career-intelligence/skill-gap-priority');
export const simulateWhatIf = (data) => api.post('/career-intelligence/what-if', data);
export const getOpportunityUnlock = (skill) => api.get('/career-intelligence/opportunity-unlock', { params: { skill } });
export const getOpportunityCost = () => api.get('/career-intelligence/opportunity-cost');
export const getWhyNotApply = (internshipId) => api.get(`/career-intelligence/why-not-apply/${internshipId}`);
export const getCounterfactual = (data) => api.post('/career-intelligence/counterfactual', data);
export const getExplainableRec = (internshipId) => api.get(`/career-intelligence/explain/${internshipId}`);

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
export const revokeCertificateAdmin = (certificateId, reason) => api.put(`/certificates/${certificateId}/revoke`, { reason });
export const getAllCertificates = (params) => api.get('/certificates', { params });
export const getAdminCertificates = (params) => api.get('/certificates/admin/all', { params });
export const getPartnerCertificates = () => api.get('/certificates/partner');
export const getPublicCertificate = (certificateId) => api.get(`/certificates/verify/${certificateId}`);

// --- Admin ---
export const getCareerInsights = () => api.get('/admin/career-insights');
export const getAdminPlatformIntelligence = () => api.get('/admin/intelligence');

// --- Partner Intelligence ---
export const getPartnerIntelligence = () => api.get('/partner/intelligence');

// --- Completion ---
export const getPartnerCompletions = (params) => api.get('/completion/partner/all', { params });
export const updateCompletionStatus = (applicationId, newStatus, performanceRating) =>
  api.put(`/completion/${applicationId}/status`, { newStatus, performanceRating });
export const getCompletionStatus = (applicationId) => api.get(`/completion/${applicationId}`);

// --- Internship Quality ---
export const getInternshipQuality = (internshipId) => api.get(`/internship-quality/${internshipId}`);

// --- Interview Log Analysis ---
export const getRejectionPatterns = () => api.get('/interview-logs/rejection-patterns');
export const getInterviewLogLearning = () => api.get('/interview-logs/interview-learning');

// --- Adaptive Learning ---
export const getAdaptiveLearningRecommendations = () => api.get('/adaptive-learning/recommendations');

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
  // Career Intelligence
  getSkillGapPriority,
  simulateWhatIf,
  getOpportunityUnlock,
  getOpportunityCost,
  getWhyNotApply,
  getCounterfactual,
  getExplainableRec,
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
  revokeCertificateAdmin,
  getAllCertificates,
  getAdminCertificates,
  getPartnerCertificates,
  getPublicCertificate,
  // Admin
  getCareerInsights,
  getAdminPlatformIntelligence,
  // Partner Intelligence
  getPartnerIntelligence,
  // Completion
  getPartnerCompletions,
  updateCompletionStatus,
  getCompletionStatus,
  // Internship Quality
  getInternshipQuality,
  // Interview Log Analysis
  getRejectionPatterns,
  getInterviewLogLearning,
  // Adaptive Learning
  getAdaptiveLearningRecommendations,
};

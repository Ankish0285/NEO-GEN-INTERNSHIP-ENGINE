import { api } from './api';

// --- Skill Evidence ---
export const getSkillEvidence = () => api.get('/skill-evidence');
export const getSkillEvidenceBreakdown = () => api.get('/skill-evidence/breakdown');
export const addSkillEvidence = (data) => api.post('/skill-evidence', data);

// --- Career ---
export const getSkillGaps = () => api.get('/career/skill-gaps');
export const getActionPlan = () => api.get('/career/action-plan');
export const updateActionItem = (id) => api.patch('/career/action-plan/' + id, {});
export const getReadiness = () => api.get('/career-intelligence/readiness');
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
export const verifyByVerificationId = (vid) => api.get('/certificates/verify/' + vid);
export const issueCertificate = (data) => api.post('/certificates', data);
export const verifyCertificateAdmin = (id) => api.put('/certificates/' + id + '/verify', {});
export const revokeCertificate = (id) => api.patch('/certificates/' + id + '/revoke', {});
export const revokeCertificateAdmin = (certId, reason) => api.patch(`/certificates/${certId}/revoke`, { reason });
export const getAllCertificates = (params) => api.get('/certificates/admin/all', { params });
export const getAdminCertificates = (params) => api.get('/certificates/admin/all', { params });
export const getPartnerCertificates = () => api.get('/certificates/partner');
export const getPublicCertificate = (certificateId) => api.get(`/certificates/verify/${certificateId}`);
export const adminIssueCertificate = (data) => api.post('/certificates/admin/issue', data);
export const searchStudentsForCert = (q) => api.get(`/certificates/admin/students/search?q=${encodeURIComponent(q)}`);
export const getPartnerAcceptedApplications = () => api.get('/certificates/partner/accepted-applications');
export const uploadCertificateAdmin = (formData) => api.upload('/certificates/upload', formData);
export const generateCertificateAdmin = (data) => api.post('/certificates/generate', data);
export const uploadCertificatePartner = (formData) => api.upload('/certificates/upload', formData);
export const generateCertificatePartner = (data) => api.post('/certificates/generate', data);
export const searchStudentsForPartner = (q) => api.get(`/certificates/partner/students/search?q=${encodeURIComponent(q)}`);
export const getCertificateById = (id) => api.get('/certificates/' + id);
export const deleteCertificate = (id) => api.delete('/certificates/' + id);


// --- Admin ---
export const getCareerInsights = () => api.get('/admin/career-insights');
export const getAdminPlatformIntelligence = () => api.get('/admin/intelligence');

// --- NEO GEN Cert Branding (super_admin) ---
export const getNeogenCertBranding = () => api.get('/admin/cert-branding');
export const updateNeogenCertBranding = (data) => api.put('/admin/cert-branding', data);
export const uploadNeogenCertLogo = (formData) => api.upload('/admin/cert-branding/logo', formData);
export const uploadNeogenCertSignature = (formData) => api.upload('/admin/cert-branding/signature', formData);

// --- Partner Cert Settings ---
export const getPartnerCertSettings = () => api.get('/partner/cert-settings');
export const updatePartnerCertSettings = (data) => api.put('/partner/cert-settings', data);
export const uploadPartnerCertLogo = (formData) => api.upload('/partner/cert-settings/logo', formData);
export const uploadPartnerCertSignature = (formData) => api.upload('/partner/cert-settings/signature', formData);

// --- Public NEO GEN branding (for cert preview, no auth) ---
export const getPublicNeogenBranding = () => api.get('/certificates/branding/neogen');

// --- Partner Intelligence ---
export const getPartnerIntelligence = () => api.get('/partner/intelligence');

// --- Completion ---
export const getPartnerCompletions = (params) => api.get('/completion/partner/all', { params });
export const updateCompletionStatus = (applicationId, newStatus, performanceRating) =>
  api.put(`/completion/${applicationId}/status`, { newStatus, performanceRating });
export const getCompletionStatus = (applicationId) => api.get(`/completion/${applicationId}`);

// --- Internship Quality ---
export const getInternshipQuality = (internshipId) => api.get(`/internship-quality/${internshipId}`);
export const getApplicationStrength = (applicationId) => api.get(`/internship-quality/application/${applicationId}/strength`);

// --- Interview Log Analysis ---
export const getRejectionPatterns = () => api.get('/interview-logs/rejection-patterns');
export const getInterviewLogLearning = () => api.get('/interview-logs/interview-learning');

// --- Adaptive Learning ---
export const getAdaptiveLearningRecommendations = () => api.get('/adaptive-learning/recommendations');

// --- Placements ---
export const getMyPlacements = () => api.get('/placements/my');

// --- Skill Assessments ---
export const getMySkillAssessments = () => api.get('/skill-assessments');

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
  verifyByVerificationId,
  issueCertificate,
  verifyCertificateAdmin,
  revokeCertificate,
  revokeCertificateAdmin,
  getAllCertificates,
  getAdminCertificates,
  getPartnerCertificates,
  getPublicCertificate,
  adminIssueCertificate,
  searchStudentsForCert,
  getPartnerAcceptedApplications,
  uploadCertificateAdmin,
  generateCertificateAdmin,
  uploadCertificatePartner,
  generateCertificatePartner,
  searchStudentsForPartner,
  getCertificateById,
  deleteCertificate,
  // Admin
  getCareerInsights,
  getAdminPlatformIntelligence,
  // NEO GEN Cert Branding
  getNeogenCertBranding,
  updateNeogenCertBranding,
  uploadNeogenCertLogo,
  uploadNeogenCertSignature,
  // Partner Cert Settings
  getPartnerCertSettings,
  updatePartnerCertSettings,
  uploadPartnerCertLogo,
  uploadPartnerCertSignature,
  // Public NEO GEN branding
  getPublicNeogenBranding,
  // Partner Intelligence
  getPartnerIntelligence,
  // Completion
  getPartnerCompletions,
  updateCompletionStatus,
  getCompletionStatus,
  // Internship Quality
  getInternshipQuality,
  getApplicationStrength,
  // Interview Log Analysis
  getRejectionPatterns,
  getInterviewLogLearning,
  // Adaptive Learning
  getAdaptiveLearningRecommendations,
  // Placements
  getMyPlacements,
  // Skill Assessments
  getMySkillAssessments,
};

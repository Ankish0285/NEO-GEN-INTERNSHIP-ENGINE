const axios = require('axios');

const AI_BASE = (process.env.AI_SERVICE_URL || 'http://localhost:8001').replace(/\/+$/, '');
const TIMEOUT = parseInt(process.env.AI_SERVICE_TIMEOUT || '20000', 10);

const client = axios.create({
  baseURL: AI_BASE,
  timeout: TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

const isAvailable = async () => {
  try {
    const { data } = await client.get('/api/v1/health', { timeout: 3000 });
    return data?.status === 'ok';
  } catch {
    return false;
  }
};

const analyzeATS = async (resumeText, jobDescription = '') => {
  const { data } = await client.post('/api/v1/ats/analyze', {
    resume_text: resumeText,
    job_description: jobDescription,
  });
  return data.data;
};

const parseResume = async (resumeText) => {
  const { data } = await client.post('/api/v1/resume/parse', {
    resume_text: resumeText,
    job_description: '',
  });
  return data.data;
};

const buildProfile = async (payload) => {
  const { data } = await client.post('/api/v1/profile/build', {
    resume_text: payload.resumeText || '',
    user_data: payload.userData || {},
    applications: payload.applications || [],
    interests: payload.interests || [],
  });
  return data.data;
};

const getRecommendations = async (payload) => {
  const { data } = await client.post('/api/v1/recommendations', {
    resume_text: payload.resumeText || '',
    internships: payload.internships || [],
    user_data: payload.userData || {},
    applications: payload.applications || [],
    top_k: payload.topK || 12,
  });
  return data.data;
};

const fullPipeline = async (payload) => {
  const { data } = await client.post('/api/v1/pipeline/full', {
    resume_text: payload.resumeText || '',
    internships: payload.internships || [],
    user_data: payload.userData || {},
    applications: payload.applications || [],
    top_k: payload.topK || 12,
  });
  return data.data;
};

const matchInternship = async (resumeText, internship) => {
  const { data } = await client.post('/api/v1/match/internship', {
    resume_text: resumeText,
    internship,
  });
  return data.data;
};

const chat = async (message, context = {}) => {
  const { data } = await client.post('/api/v1/chat', { message, context });
  return data.data;
};

module.exports = {
  isAvailable,
  analyzeATS,
  parseResume,
  buildProfile,
  getRecommendations,
  fullPipeline,
  matchInternship,
  chat,
};

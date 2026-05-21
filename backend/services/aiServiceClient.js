const { spawn, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const AI_DIR = path.join(__dirname, '../ai');
const AI_PORT = process.env.AI_PORT || '8001';
const AI_BASE = (process.env.AI_SERVICE_URL || `http://127.0.0.1:${AI_PORT}`).replace(/\/+$/, '');
const TIMEOUT = parseInt(process.env.AI_SERVICE_TIMEOUT || '25000', 10);

const getPythonPath = () => {
  if (process.env.AI_PYTHON) return process.env.AI_PYTHON;
  const venvWin = path.join(AI_DIR, '.venv', 'Scripts', 'python.exe');
  const venvUnix = path.join(AI_DIR, '.venv', 'bin', 'python');
  if (fs.existsSync(venvWin)) return venvWin;
  if (fs.existsSync(venvUnix)) return venvUnix;
  return process.platform === 'win32' ? 'python' : 'python3';
};

const runCli = (command, payload = {}) =>
  new Promise((resolve, reject) => {
    const py = getPythonPath();
    const cli = path.join(AI_DIR, 'cli.py');
    const proc = spawn(py, [cli, command], {
      cwd: AI_DIR,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `AI CLI exit ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch (e) {
        reject(new Error(`AI CLI invalid JSON: ${stdout.slice(0, 200)}`));
      }
    });
    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.end();
  });

const httpClient = axios.create({
  baseURL: AI_BASE,
  timeout: TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

let httpAvailable = null;

const checkHttp = async () => {
  try {
    const { data } = await httpClient.get('/api/v1/health', { timeout: 2500 });
    httpAvailable = data?.status === 'ok';
  } catch {
    httpAvailable = false;
  }
  return httpAvailable;
};

const callAI = async (httpPath, cliCommand, payload, unwrap = true) => {
  if (httpAvailable !== false) {
    try {
      const { data } = await httpClient.post(httpPath, payload);
      return unwrap ? data.data : data;
    } catch {
      httpAvailable = false;
    }
  }
  const result = await runCli(cliCommand, payload);
  return result;
};

const isAvailable = async () => {
  if (await checkHttp()) return true;
  try {
    const r = await runCli('health', {});
    return r?.status === 'ok';
  } catch {
    return false;
  }
};

const analyzeATS = (resumeText, jobDescription = '') =>
  callAI(
    '/api/v1/ats/analyze',
    'analyze',
    { resume_text: resumeText, job_description: jobDescription }
  );

const parseResume = (resumeText) =>
  callAI('/api/v1/resume/parse', 'parse', { resume_text: resumeText });

const buildProfile = (payload) =>
  callAI('/api/v1/profile/build', 'profile', {
    resume_text: payload.resumeText || '',
    user_data: payload.userData || {},
    applications: payload.applications || [],
    interests: payload.interests || [],
  });

const getRecommendations = (payload) =>
  callAI('/api/v1/recommendations', 'recommendations', {
    resume_text: payload.resumeText || '',
    internships: payload.internships || [],
    user_data: payload.userData || {},
    applications: payload.applications || [],
    top_k: payload.topK || 12,
  });

const fullPipeline = (payload) =>
  callAI('/api/v1/pipeline/full', 'pipeline', {
    resume_text: payload.resumeText || '',
    internships: payload.internships || [],
    user_data: payload.userData || {},
    applications: payload.applications || [],
    memory: payload.memory || {},
    top_k: payload.topK || 12,
  });

const getIntelligence = (payload) =>
  callAI('/api/v1/intelligence', 'intelligence', {
    resume_text: payload.resumeText || '',
    internships: payload.internships || [],
    user_data: payload.userData || {},
    applications: payload.applications || [],
    memory: payload.memory || {},
    top_k: payload.topK || 15,
  });

const chatWithIntelligence = (message, intelligence) =>
  callAI(
    '/api/v1/chat/intelligence',
    'chat_intel',
    { message, intelligence },
    true
  ).catch(() => chat(message, { intelligence }));

const matchInternship = (resumeText, internship) =>
  callAI('/api/v1/match/internship', 'match', {
    resume_text: resumeText,
    internship,
  });

const chat = (message, context = {}) =>
  callAI('/api/v1/chat', 'chat', { message, context });

/** Start embedded AI server (optional, faster than CLI per request). */
const startAIServer = () => {
  if (process.env.AI_AUTO_START === '0') return null;
  const py = getPythonPath();
  if (!fs.existsSync(path.join(AI_DIR, 'server.py'))) return null;

  const proc = spawn(py, ['-m', 'uvicorn', 'server:app', '--host', '127.0.0.1', '--port', AI_PORT], {
    cwd: AI_DIR,
    stdio: 'ignore',
    detached: false,
  });
  proc.on('error', (e) => console.warn('[AI] Could not start:', e.message));
  console.log(`[AI] Started on ${AI_BASE}`);
  return proc;
};

module.exports = {
  isAvailable,
  analyzeATS,
  parseResume,
  buildProfile,
  getRecommendations,
  fullPipeline,
  getIntelligence,
  matchInternship,
  chat,
  chatWithIntelligence,
  startAIServer,
  runCli,
};

const DEFAULT_API_ORIGIN = 'http://localhost:5000';

export function getApiOrigin() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_ORIGIN) {
    return String(import.meta.env.VITE_API_ORIGIN).replace(/\/$/, '');
  }
  // Vite dev (any port): API is always on backend — avoids wrong window.origin (4173, 5173, etc.)
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    return DEFAULT_API_ORIGIN;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '');
  }
  return DEFAULT_API_ORIGIN;
}

function isCloudinaryUrl(s) {
  return /res\.cloudinary\.com/i.test(String(s || ''));
}

/** Fix http://localhost:5000/file.pdf -> /uploads/file.pdf path on same host */
function fixBrokenLocalResumeHttpUrl(s) {
  try {
    const u = new URL(String(s).trim());
    const host = u.hostname.toLowerCase();
    if (host !== 'localhost' && host !== '127.0.0.1') return s;
    const parts = u.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || '';
    if (!/\.(pdf|docx?)$/i.test(last)) return s;
    if (parts[0] === 'uploads') return s;
    u.pathname = `/uploads/${last}`;
    return u.toString();
  } catch {
    return s;
  }
}

function uploadsPathFromNorm(norm) {
  if (norm.startsWith('uploads/')) return `/${norm}`;
  const lastSegment = norm.split('/').pop();
  const looksLikeFile = /\.(pdf|docx?|PDF|DOCX?)$/i.test(lastSegment || '');
  if (looksLikeFile && (!norm.includes('/') || norm === lastSegment)) {
    return `/uploads/${lastSegment}`;
  }
  return `/${norm}`;
}

/**
 * Browser-openable resume URL. Always uses absolute API origin for local files
 * so "Open in new tab" works even when the UI runs on another port.
 */
export function resolveResumeUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  if (/^https?:\/\//i.test(s)) {
    if (isCloudinaryUrl(s)) return s;
    return fixBrokenLocalResumeHttpUrl(s);
  }
  if (/^\/\//.test(s)) return `https:${s}`;

  const norm = s.replace(/\\/g, '/').replace(/^\//, '');
  const origin = getApiOrigin();
  const pathPart = uploadsPathFromNorm(norm);
  return `${origin}${pathPart}`;
}

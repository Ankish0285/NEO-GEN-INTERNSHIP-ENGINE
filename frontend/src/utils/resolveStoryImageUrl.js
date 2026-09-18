import { getApiOrigin } from './resolveResumeUrl';

/**
 * Resolves a success-story image URL to a browser-usable absolute URL.
 *
 * Decision table (evaluated in order):
 *  1. null / empty                     → ''  (caller shows initials fallback)
 *  2. data:image/...                   → unchanged  (base64 inline)
 *  3. https://... or http://...        → unchanged  (Cloudinary, S3, CDN, any absolute URL)
 *  4. Protocol-relative //...          → https:// prefixed
 *  5. Windows absolute path C:\...     → extract filename → /uploads/filename via API origin
 *  6. /uploads/... or uploads/...      → prepend API origin
 *  7. Bare filename (no slash)         → API origin + /uploads/filename
 *  8. Any other relative path          → API origin + / + path
 *
 * API origin resolution (via getApiOrigin):
 *  - Dev:        VITE_API_ORIGIN env var (e.g. http://localhost:5000)
 *  - Production: window.location.origin  (same-origin deployment on CloudFront)
 */
export function resolveStoryImageUrl(raw) {
  if (!raw || typeof raw !== 'string') return '';

  const s = raw.trim();
  if (!s) return '';

  // 1. Base64 inline — return unchanged
  if (/^data:image\//i.test(s)) return s;

  // 2. Already an absolute HTTP/HTTPS URL (Cloudinary, S3, CDN, etc.) — return unchanged
  //    This includes https://res.cloudinary.com/... which must never be modified.
  if (/^https?:\/\//i.test(s)) return s;

  // 3. Protocol-relative URL
  if (/^\/\//.test(s)) return `https:${s}`;

  // 4. Windows absolute path (e.g. C:\Users\...\uploads\filename.jpg)
  //    Extract just the filename and serve from the uploads endpoint.
  if (/^[A-Za-z]:[/\\]/.test(s)) {
    const norm = s.replace(/\\/g, '/');
    const filename = norm.split('/').pop(); // basename
    if (!filename) return ''; // malformed — show initials
    return `${getApiOrigin()}/uploads/${filename}`;
  }

  // 5. Relative / local path — resolve against the backend API origin
  //    NEVER use window.location.origin here: in dev the frontend runs on
  //    a different port (5173) from the backend (5000).
  const origin = getApiOrigin();
  const norm = s.replace(/\\/g, '/');

  if (norm.startsWith('/uploads/')) {
    return `${origin}${norm}`;
  }

  if (/^uploads\//i.test(norm)) {
    return `${origin}/${norm}`;
  }

  // 6. Bare filename — assume it lives under /uploads/
  if (!norm.includes('/')) {
    return `${origin}/uploads/${norm}`;
  }

  // 7. Any other relative path
  const withSlash = norm.startsWith('/') ? norm : `/${norm}`;
  return `${origin}${withSlash}`;
}

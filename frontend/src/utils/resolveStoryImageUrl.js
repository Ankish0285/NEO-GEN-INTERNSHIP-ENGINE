import { getApiOrigin } from './resolveResumeUrl';

function getUploadOrigin() {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return window.location.origin.replace(/\/$/, '');
  }

  return getApiOrigin();
}

export function resolveStoryImageUrl(raw) {
  if (!raw || typeof raw !== 'string') return '';

  const s = raw.trim();
  if (!s) return '';

  if (/^data:image\//i.test(s)) return s;
  if (/^https?:\/\//i.test(s)) return s;

  const norm = s.replace(/\\/g, '/');
  const origin = getUploadOrigin();

  const m = norm.match(/\/uploads\/([^/?#]+)(?:[?#].*)?$/i);

  if (m) {
    return `${origin}/uploads/${m[1]}`;
  }

  if (norm.startsWith('/uploads/')) {
    return `${origin}${norm.split('?')[0]}`;
  }

  const bare = norm.replace(/^\//, '');

  if (/^uploads\//i.test(bare)) {
    return `${origin}/${bare.split('?')[0]}`;
  }

  return s;
}

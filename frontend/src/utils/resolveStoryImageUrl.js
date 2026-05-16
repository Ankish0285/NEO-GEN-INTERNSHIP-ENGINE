import { getApiOrigin } from './resolveResumeUrl';

/**
 * Browser-safe URL for a success-story image. Fixes legacy DB values where
 * multer stored a full Windows/Unix filesystem path instead of /uploads/...
 */
export function resolveStoryImageUrl(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const s = raw.trim();
  if (!s) return '';
  if (/^data:image\//i.test(s)) return s;
  if (/^https?:\/\//i.test(s)) return s;

  const norm = s.replace(/\\/g, '/');
  const m = norm.match(/\/uploads\/([^/?#]+)(?:[?#].*)?$/i);
  if (m) {
    return `${getApiOrigin()}/uploads/${m[1]}`;
  }
  if (norm.startsWith('/uploads/')) {
    return `${getApiOrigin()}${norm.split('?')[0]}`;
  }
  const bare = norm.replace(/^\//, '');
  if (/^uploads\//i.test(bare)) {
    return `${getApiOrigin()}/${bare.split('?')[0]}`;
  }
  return s;
}

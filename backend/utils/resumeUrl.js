const path = require('path');

function isHttpUrl(s) {
  return /^https?:\/\//i.test(String(s || '').trim());
}

function isCloudinaryUrl(s) {
  return /res\.cloudinary\.com/i.test(String(s || ''));
}

/** True if we should replace with latest Resume fileUrl (Cloudinary) or fix path. */
function needsResumeReplacement(stored) {
  if (stored == null || String(stored).trim() === '') return true;
  if (!isHttpUrl(stored)) return true;
  if (isCloudinaryUrl(stored)) return false;
  const u = String(stored).toLowerCase();
  return u.includes('localhost') || u.includes('127.0.0.1');
}

/** e.g. http://localhost:5000/file.pdf -> http://localhost:5000/uploads/file.pdf */
function fixLocalResumeHttpUrl(stored) {
  try {
    const u = new URL(String(stored).trim());
    const host = u.hostname.toLowerCase();
    if (host !== 'localhost' && host !== '127.0.0.1') return stored;
    const parts = u.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || '';
    if (!/\.(pdf|docx?)$/i.test(last)) return stored;
    if (parts[0] === 'uploads') return stored;
    u.pathname = `/uploads/${last}`;
    return u.toString();
  } catch {
    return stored;
  }
}

function publicApiBase() {
  return String(process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`).replace(
    /\/$/,
    ''
  );
}

/** Public URL for a locally stored upload path or bare filename */
function uploadsPublicUrl(stored) {
  const base = publicApiBase();
  const norm = String(stored || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\//, '');
  if (!norm) return null;
  if (norm.startsWith('uploads/')) return `${base}/${norm}`;
  return `${base}/uploads/${path.basename(norm)}`;
}

module.exports = {
  isHttpUrl,
  isCloudinaryUrl,
  needsResumeReplacement,
  fixLocalResumeHttpUrl,
  publicApiBase,
  uploadsPublicUrl,
};

/**
 * slugify.js
 * Converts an internship title + optional company/location into a
 * stable, URL-safe slug for SEO-friendly canonical URLs.
 *
 * Rules:
 *  - lowercase
 *  - spaces and special chars → hyphens
 *  - multiple hyphens collapsed
 *  - leading/trailing hyphens stripped
 */

/**
 * @param {string} str
 * @returns {string}
 */
export function slugify(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')                        // decompose accented chars
    .replace(/[\u0300-\u036f]/g, '')         // strip diacritics
    .replace(/[^a-z0-9\s-]/g, ' ')          // keep only alphanum, spaces, hyphens
    .trim()
    .replace(/[\s-]+/g, '-')                 // collapse whitespace/hyphens
    .replace(/^-+|-+$/g, '');               // trim leading/trailing hyphens
}

/**
 * Build the canonical slug for an internship document.
 * Format: {title}-{organization}-{location}
 * Falls back gracefully when fields are missing.
 *
 * @param {object} internship  - Mongoose/plain internship object
 * @returns {string}
 */
export function internshipSlug(internship) {
  if (!internship) return '';
  const parts = [
    internship.title,
    internship.organization || internship.department,
    internship.location,
  ]
    .filter(Boolean)
    .map(slugify);
  return parts.join('-');
}

/**
 * Resolve an internship's canonical URL.
 * @param {object} internship
 * @param {string} [base='https://neogeninternshipengine.me']
 * @returns {string}
 */
export function internshipCanonical(internship, base = 'https://neogeninternshipengine.me') {
  const slug = internshipSlug(internship);
  return slug ? `${base}/internships/${slug}` : base;
}

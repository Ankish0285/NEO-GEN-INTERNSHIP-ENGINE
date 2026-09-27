/**
 * sitemapRoutes.js
 * GET /api/sitemap/internships.xml
 *
 * Returns a valid XML sitemap containing one <url> per active internship,
 * using the same slug logic as the frontend (title-org-location).
 * Excludes draft/pending/closed internships — only 'active' and 'published'.
 *
 * Submit this URL to Google Search Console alongside the static sitemap.xml:
 *   https://api.neogeninternshipengine.me/api/sitemap/internships.xml
 */

const express    = require('express');
const router     = express.Router();
const Internship = require('../models/Internship');

const SITE = 'https://neogeninternshipengine.me';

/** Mirror of frontend slugify() — must stay in sync */
function slugify(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function internshipSlug(doc) {
  return [doc.title, doc.organization || doc.department, doc.location]
    .filter(Boolean)
    .map(slugify)
    .join('-');
}

function isoDate(d) {
  try { return new Date(d).toISOString().split('T')[0]; } catch { return null; }
}

router.get('/internships.xml', async (req, res) => {
  try {
    const internships = await Internship
      .find({ status: { $in: ['active', 'published'] } })
      .select('title organization department location createdAt updatedAt deadline status')
      .lean();

    const urls = internships
      .map(doc => {
        const slug = internshipSlug(doc);
        if (!slug) return null;
        const loc      = `${SITE}/internships/${slug}`;
        const lastmod  = isoDate(doc.updatedAt || doc.createdAt) || isoDate(new Date());
        // Expire listing if past deadline
        const expired  = doc.deadline && new Date(doc.deadline) < new Date();
        const priority = expired ? '0.4' : '0.8';
        return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
      })
      .filter(Boolean);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1-hour cache
    res.status(200).send(xml);
  } catch (err) {
    console.error('[sitemap] error:', err.message);
    res.status(500).send('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>');
  }
});

module.exports = router;

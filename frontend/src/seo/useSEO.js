/**
 * useSEO.js
 * React hook that writes document.title and all <head> meta tags
 * required for SEO, Open Graph, Twitter Cards, and canonical URLs.
 *
 * Usage:
 *   useSEO({ title, description, canonical, ogImage, ogType, noIndex })
 *
 * Works without react-helmet — uses plain DOM manipulation so it is
 * compatible with any Vite/React SPA configuration.
 */

import { useEffect } from 'react';

const SITE_NAME = 'NEOGEN INTERNSHIP ENGINE';
const SITE_URL  = 'https://neogeninternshipengine.me';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_DESC  =
  'NEOGEN INTERNSHIP ENGINE — AI-powered internship discovery for students across every field. ' +
  'Engineering, Commerce, Management, Law, Medical, Design and more. Find internships in India, remote and work-from-home.';

/**
 * Upsert a <meta> tag by attribute selector.
 */
function setMeta(selector, attr, content) {
  if (!content) return;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [attrName, attrValue] = selector
      .replace(/^\[|\]$/g, '')   // strip [ ]
      .split('=')
      .map(s => s.replace(/['"]/g, ''));
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, content);
}

/**
 * Upsert a <link rel="canonical"> tag.
 */
function setCanonical(href) {
  if (!href) return;
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * @param {object} opts
 * @param {string}  opts.title         – Page-specific title (will be suffixed with SITE_NAME)
 * @param {string}  [opts.description] – Meta description (150–160 chars ideal)
 * @param {string}  [opts.canonical]   – Full canonical URL
 * @param {string}  [opts.ogImage]     – Open Graph image URL
 * @param {string}  [opts.ogType]      – 'website' (default) | 'article' | 'object'
 * @param {boolean} [opts.noIndex]     – true → add noindex,nofollow
 * @param {string}  [opts.twitterCard] – 'summary' | 'summary_large_image' (default)
 */
export function useSEO({
  title,
  description = DEFAULT_DESC,
  canonical,
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
  noIndex = false,
  twitterCard = 'summary_large_image',
} = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

    // ── document.title ────────────────────────────────────────────────
    document.title = fullTitle;

    // ── Standard meta ─────────────────────────────────────────────────
    setMeta('meta[name="description"]',        'content', description);
    setMeta('meta[name="application-name"]',   'content', SITE_NAME);

    // ── Robots ────────────────────────────────────────────────────────
    setMeta(
      'meta[name="robots"]',
      'content',
      noIndex ? 'noindex,nofollow' : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'
    );

    // ── Canonical ─────────────────────────────────────────────────────
    setCanonical(canonical || SITE_URL);

    // ── Open Graph ────────────────────────────────────────────────────
    setMeta('meta[property="og:type"]',        'content', ogType);
    setMeta('meta[property="og:site_name"]',   'content', SITE_NAME);
    setMeta('meta[property="og:title"]',       'content', fullTitle);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]',         'content', canonical || SITE_URL);
    setMeta('meta[property="og:image"]',       'content', ogImage);
    setMeta('meta[property="og:image:alt"]',   'content', SITE_NAME);

    // ── Twitter Card ──────────────────────────────────────────────────
    setMeta('meta[name="twitter:card"]',        'content', twitterCard);
    setMeta('meta[name="twitter:title"]',       'content', fullTitle);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]',       'content', ogImage);
    setMeta('meta[name="twitter:image:alt"]',   'content', SITE_NAME);
  }, [title, description, canonical, ogImage, ogType, noIndex, twitterCard]);
}

export { SITE_NAME, SITE_URL, DEFAULT_DESC, DEFAULT_IMAGE };

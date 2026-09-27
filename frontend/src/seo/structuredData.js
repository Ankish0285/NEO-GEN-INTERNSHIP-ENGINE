/**
 * structuredData.js
 * Builds valid JSON-LD structured data objects for NEOGEN INTERNSHIP ENGINE.
 *
 * References:
 *  - https://schema.org/JobPosting
 *  - https://schema.org/Organization
 *  - https://schema.org/WebSite
 *  - https://developers.google.com/search/docs/appearance/structured-data/job-posting
 */

const SITE_URL  = 'https://neogeninternshipengine.me';
const SITE_NAME = 'NEOGEN INTERNSHIP ENGINE';
const FOUNDER   = 'Ankish Kumar';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a Date/string to ISO 8601 date string or undefined. */
function isoDate(val) {
  if (!val) return undefined;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch {
    return undefined;
  }
}

/** Detect whether an internship is genuinely remote. */
function isRemote(internship) {
  const loc = (internship.location || '').toLowerCase();
  const mode = (internship.workMode || '').toLowerCase();
  return loc.includes('remote') || loc.includes('work from home') ||
         mode.includes('remote') || mode.includes('wfh') || mode.includes('work from home');
}

// ─── Organization structured data ─────────────────────────────────────────────

/**
 * @returns {object} Schema.org/Organization JSON-LD
 */
export function buildOrganizationLD() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    founder: {
      '@type': 'Person',
      name: FOUNDER,
    },
    description:
      'NEOGEN INTERNSHIP ENGINE is an AI-powered internship discovery and recruitment platform for students across all academic branches and fields in India.',
    sameAs: [],   // social profile URLs can be added when known
  };
}

// ─── WebSite structured data ──────────────────────────────────────────────────

/**
 * Includes Sitelinks Searchbox markup.
 * @returns {object} Schema.org/WebSite JSON-LD
 */
export function buildWebSiteLD() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/find-internship?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ─── JobPosting structured data ───────────────────────────────────────────────

/**
 * Build a valid Schema.org/JobPosting for an internship.
 * Only includes fields that have actual data — never fabricates.
 *
 * @param {object} internship  Internship document from the DB / API
 * @param {string} canonicalUrl  Full canonical URL for this internship page
 * @returns {object} JSON-LD object
 */
export function buildJobPostingLD(internship, canonicalUrl) {
  if (!internship) return null;

  const remote = isRemote(internship);

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: internship.title || '',
    description: [
      internship.description,
      internship.responsibilities ? `Responsibilities: ${internship.responsibilities}` : null,
      internship.requirements     ? `Requirements: ${internship.requirements}`         : null,
      internship.benefits         ? `Benefits: ${internship.benefits}`                  : null,
    ].filter(Boolean).join('\n\n') || internship.title,
    url: canonicalUrl || SITE_URL,
    identifier: {
      '@type': 'PropertyValue',
      name: SITE_NAME,
      value: String(internship._id || internship.id || ''),
    },
    hiringOrganization: {
      '@type': 'Organization',
      name: internship.organization || internship.department || SITE_NAME,
      sameAs: SITE_URL,
    },
  };

  // datePosted — required by Google
  const posted = isoDate(internship.createdAt);
  if (posted) ld.datePosted = posted;
  else ld.datePosted = new Date().toISOString().split('T')[0]; // fallback: today

  // validThrough (deadline)
  const validThrough = isoDate(internship.deadline);
  if (validThrough) ld.validThrough = validThrough;

  // Location
  if (remote) {
    ld.jobLocationType = 'TELECOMMUTE';
    ld.applicantLocationRequirements = {
      '@type': 'Country',
      name: 'India',
    };
  } else if (internship.location) {
    ld.jobLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: internship.location,
        addressCountry: 'IN',
      },
    };
  }

  // Employment type — internships map to INTERN
  ld.employmentType = 'INTERN';

  // baseSalary (stipend) — only if numeric value parseable
  if (internship.stipend) {
    const numeric = parseInt(String(internship.stipend).replace(/[^0-9]/g, ''));
    if (!isNaN(numeric) && numeric > 0) {
      ld.baseSalary = {
        '@type': 'MonetaryAmount',
        currency: 'INR',
        value: {
          '@type': 'QuantitativeValue',
          value: numeric,
          unitText: 'MONTH',
        },
      };
    }
  }

  // directApply: only true when no external applyLink exists
  ld.directApply = !internship.applyLink;

  return ld;
}

// ─── Inject / remove JSON-LD script tag from <head> ──────────────────────────

/**
 * Injects (or updates) a <script type="application/ld+json"> in <head>.
 * @param {string} id   Unique DOM id so we can replace it on re-render
 * @param {object|object[]} data   One or array of JSON-LD objects
 */
export function injectJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(Array.isArray(data) ? data : [data], null, 0);
}

/**
 * Removes a previously injected JSON-LD tag.
 * @param {string} id
 */
export function removeJsonLd(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

/**
 * Shared helpers used by every resume template.
 *
 * They bridge OLD property names (p.title, p.link, exp.duration)
 * with NEW form state names (p.name, p.techStack, p.github, exp.startDate/endDate).
 * Supporting both means templates work regardless of data origin.
 */

/** Safely get the first truthy value from a list of object keys. */
export const pick = (obj, ...keys) => {
  for (const k of keys) { if (obj?.[k]) return obj[k]; }
  return '';
};

/** Format a date range. Supports current/present flag. */
export const dateRange = (start, end, current) => {
  if (!start && !end) return '';
  if (current) return `${start || ''} – Present`;
  return [start, end].filter(Boolean).join(' – ');
};

/** Always return an array (handles undefined/null). */
export const safeArr = (v) => Array.isArray(v) ? v : [];

/**
 * Normalise a project entry — works with BOTH old shape
 * { title, link, description } and new shape { name, techStack, github, demo, ... }
 */
export const normProject = (p) => ({
  name:      p.name      || p.title       || '',
  role:      p.role      || '',
  techStack: p.techStack || p.technologies || '',
  description: p.description || '',
  startDate: p.startDate || '',
  endDate:   p.endDate   || '',
  github:    p.github    || p.link        || '',
  demo:      p.demo      || '',
});

/**
 * Normalise an experience entry — works with old { title, company, duration }
 * and new { title, company, type, location, startDate, endDate, current, description }
 */
export const normExp = (e) => ({
  title:       e.title       || '',
  company:     e.company     || '',
  type:        e.type        || '',
  location:    e.location    || '',
  dateStr:     dateRange(e.startDate, e.endDate, e.current) || e.duration || '',
  description: e.description || '',
});

/**
 * Normalise an education entry — works with old { degree/title, institution/company, year/duration }
 * and new { degree, institution, field, startDate, endDate, cgpa, percentage, location, coursework }
 */
export const normEdu = (e) => ({
  degree:      e.degree      || e.title    || '',
  institution: e.institution || e.company  || '',
  dateStr:     [e.startDate, e.endDate].filter(Boolean).join(' – ') || e.year || e.duration || '',
  field:       e.field       || '',
  cgpa:        e.cgpa        || '',
  percentage:  e.percentage  || '',
  location:    e.location    || '',
  coursework:  e.coursework  || '',
  highlights:  e.highlights  || '',
  description: e.description || '',
});

/** Normalise a certification entry. */
export const normCert = (c) => (typeof c === 'string'
  ? { name: c, issuer: '', issueDate: '', credId: '', credUrl: '' }
  : { name: c.name || '', issuer: c.issuer || '', issueDate: c.issueDate || '', credId: c.credId || '', credUrl: c.credUrl || '' }
);

/** Normalise an achievement entry. */
export const normAch = (a) => (typeof a === 'string'
  ? { title: a, org: '', date: '', prize: '', description: '' }
  : { title: a.title || '', org: a.org || '', date: a.date || '', prize: a.prize || '', description: a.description || '' }
);

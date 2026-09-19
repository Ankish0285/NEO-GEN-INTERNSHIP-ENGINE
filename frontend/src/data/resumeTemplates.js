/**
 * resumeTemplates.js
 * Single source of truth for template definitions.
 * Import this on both the gallery page and the builder page.
 *
 * access: 'FREE' | 'PREMIUM'
 * Rule: first 2 are FREE, the rest require an active Premium subscription.
 * The backend mirrors this list; templateId is the authoritative key.
 */

export const RESUME_TEMPLATES = [
  {
    templateId: 'modern-ats',
    displayOrder: 1,
    access: 'FREE',
    name: 'Modern ATS',
    description: 'Clean single-column layout optimised for Applicant Tracking Systems.',
    tags: ['ATS-Friendly', 'Clean', 'Versatile'],
    color: '#FF9933',       // accent colour used inside the template
    previewBg: '#fff8f0',   // gallery card background
  },
  {
    templateId: 'professional',
    displayOrder: 2,
    access: 'FREE',
    name: 'Professional',
    description: 'Classic two-tone header with structured sections for experienced applicants.',
    tags: ['ATS-Friendly', 'Classic', 'Experienced'],
    color: '#1d4ed8',
    previewBg: '#eff6ff',
  },
  {
    templateId: 'software-engineer',
    displayOrder: 3,
    access: 'PREMIUM',
    name: 'Software Engineer',
    description: 'Tech-focused layout with skills matrix and project highlights.',
    tags: ['ATS-Friendly', 'Tech', 'Projects'],
    color: '#138808',
    previewBg: '#f0fdf4',
  },
  {
    templateId: 'student-fresher',
    displayOrder: 4,
    access: 'PREMIUM',
    name: 'Student / Fresher',
    description: 'Education-first template ideal for final-year students and fresh graduates.',
    tags: ['ATS-Friendly', 'Fresher', 'Education'],
    color: '#7c3aed',
    previewBg: '#f5f3ff',
  },
  {
    templateId: 'minimal',
    displayOrder: 5,
    access: 'PREMIUM',
    name: 'Minimal',
    description: 'Ultra-clean white-space design that lets your content speak.',
    tags: ['ATS-Friendly', 'Minimal', 'Modern'],
    color: '#0f172a',
    previewBg: '#f8fafc',
  },
  {
    templateId: 'executive',
    displayOrder: 6,
    access: 'PREMIUM',
    name: 'Executive',
    description: 'Bold header with competency bars — ideal for senior roles.',
    tags: ['ATS-Friendly', 'Senior', 'Bold'],
    color: '#b45309',
    previewBg: '#fffbeb',
  },
];

/** Sorted by displayOrder (deterministic). */
export const SORTED_TEMPLATES = [...RESUME_TEMPLATES].sort(
  (a, b) => a.displayOrder - b.displayOrder
);

/** Lookup by templateId. */
export const getTemplateById = (id) =>
  RESUME_TEMPLATES.find((t) => t.templateId === id) || null;

/** IDs that are FREE (used by backend config too). */
export const FREE_TEMPLATE_IDS = RESUME_TEMPLATES
  .filter((t) => t.access === 'FREE')
  .map((t) => t.templateId);

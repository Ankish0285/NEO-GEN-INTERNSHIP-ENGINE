/**
 * categories.js
 * Canonical category definitions for NEOGEN INTERNSHIP ENGINE SEO.
 *
 * Each entry maps a URL slug → metadata used for category pages.
 * The `keywords` array drives the client-side filter that picks internships
 * to show on each category page — matched against title, skills, description.
 *
 * Only categories with broad, real use in the Indian internship market are
 * included. Do not create thin pages just to rank for keywords.
 */

export const CATEGORIES = [
  // ── Engineering & Technology ──────────────────────────────────────
  {
    slug: 'engineering',
    label: 'Engineering Internships',
    h1: 'Engineering Internships in India',
    description:
      'Browse engineering internships across Mechanical, Civil, Electrical, Electronics, Chemical, and Aerospace branches. ' +
      'Open to BE, B.Tech, and diploma students across India.',
    keywords: [
      'engineering', 'mechanical', 'civil', 'electrical', 'electronics',
      'chemical', 'automobile', 'aerospace', 'instrumentation', 'production',
    ],
  },
  {
    slug: 'computer-science',
    label: 'Computer Science Internships',
    h1: 'Computer Science & IT Internships',
    description:
      'Find internships in Computer Science, Information Technology, software development, networking, and related fields. ' +
      'Ideal for B.Tech CSE, BCA, and MCA students.',
    keywords: [
      'computer science', 'software', 'programming', 'developer', 'coder',
      'it', 'information technology', 'bca', 'mca', 'b.tech cse',
    ],
  },
  {
    slug: 'ai-ml',
    label: 'AI & Machine Learning Internships',
    h1: 'AI, Machine Learning & Data Science Internships',
    description:
      'Explore internships in Artificial Intelligence, Machine Learning, Deep Learning, NLP, and Data Science. ' +
      'Perfect for students with Python, TensorFlow, or PyTorch skills.',
    keywords: [
      'ai', 'artificial intelligence', 'machine learning', 'deep learning',
      'nlp', 'data science', 'data analyst', 'tensorflow', 'pytorch',
      'computer vision', 'llm', 'generative ai',
    ],
  },
  {
    slug: 'web-development',
    label: 'Web Development Internships',
    h1: 'Web Development Internships',
    description:
      'Discover frontend, backend, and full-stack web development internships. ' +
      'Work with React, Node.js, Django, PHP, and more.',
    keywords: [
      'web development', 'frontend', 'backend', 'full stack', 'react',
      'node.js', 'angular', 'vue', 'html', 'css', 'javascript', 'php', 'django', 'flask',
    ],
  },
  // ── Commerce & Finance ────────────────────────────────────────────
  {
    slug: 'commerce',
    label: 'Commerce Internships',
    h1: 'Commerce & Finance Internships',
    description:
      'Find internships for Commerce students covering Accounting, Finance, Banking, Economics, FinTech, and Taxation. ' +
      'Open to B.Com, M.Com, and CA aspirants.',
    keywords: [
      'commerce', 'accounting', 'finance', 'banking', 'economics',
      'taxation', 'fintech', 'b.com', 'ca', 'audit', 'tally', 'gst',
    ],
  },
  // ── Management & Business ─────────────────────────────────────────
  {
    slug: 'management',
    label: 'Management Internships',
    h1: 'Management & Business Internships',
    description:
      'Browse management internships covering MBA, Business Development, Operations, Supply Chain, Product Management, ' +
      'and Entrepreneurship. Suitable for BBA, MBA, and PGDM students.',
    keywords: [
      'management', 'mba', 'business', 'operations', 'supply chain',
      'product management', 'bba', 'pgdm', 'business development', 'strategy',
    ],
  },
  // ── Marketing & Communication ─────────────────────────────────────
  {
    slug: 'marketing',
    label: 'Marketing Internships',
    h1: 'Marketing & Digital Marketing Internships',
    description:
      'Explore internships in Digital Marketing, Social Media, Content Marketing, SEO, Brand Management, and Sales. ' +
      'Open to all graduation backgrounds.',
    keywords: [
      'marketing', 'digital marketing', 'social media', 'content marketing',
      'seo', 'sem', 'email marketing', 'brand management', 'advertising',
      'public relations', 'sales',
    ],
  },
  // ── Human Resources ───────────────────────────────────────────────
  {
    slug: 'hr',
    label: 'HR Internships',
    h1: 'Human Resources & Recruitment Internships',
    description:
      'Find HR internships in Recruitment, Talent Acquisition, Learning & Development, Employee Engagement, ' +
      'and People Operations.',
    keywords: [
      'hr', 'human resources', 'recruitment', 'talent acquisition',
      'learning development', 'employee engagement', 'people operations', 'payroll',
    ],
  },
  // ── Law ───────────────────────────────────────────────────────────
  {
    slug: 'law',
    label: 'Law Internships',
    h1: 'Law & Legal Internships',
    description:
      'Discover legal internships for LLB and LLM students — covering Corporate Law, Litigation, ' +
      'Legal Research, Intellectual Property, and Contract Drafting.',
    keywords: [
      'law', 'legal', 'llb', 'llm', 'corporate law', 'litigation',
      'legal research', 'intellectual property', 'contract', 'compliance',
    ],
  },
  // ── Healthcare & Medical ──────────────────────────────────────────
  {
    slug: 'medical',
    label: 'Medical & Healthcare Internships',
    h1: 'Medical & Healthcare Internships',
    description:
      'Find internships in Medicine, Nursing, Public Health, Hospital Administration, and Healthcare Management.',
    keywords: [
      'medical', 'healthcare', 'nursing', 'public health', 'hospital',
      'mbbs', 'bsc nursing', 'health administration', 'paramedical',
    ],
  },
  {
    slug: 'pharmacy',
    label: 'Pharmacy Internships',
    h1: 'Pharmacy & Clinical Research Internships',
    description:
      'Browse internship opportunities in Pharmaceutical companies, Clinical Research, Drug Regulatory Affairs, ' +
      'and Quality Control for B.Pharm and M.Pharm students.',
    keywords: [
      'pharmacy', 'pharmaceutical', 'clinical research', 'drug regulatory',
      'quality control', 'b.pharm', 'm.pharm', 'pharmacology',
    ],
  },
  // ── Life Sciences ─────────────────────────────────────────────────
  {
    slug: 'biotechnology',
    label: 'Biotechnology & Life Science Internships',
    h1: 'Biotechnology, Microbiology & Life Science Internships',
    description:
      'Explore internships in Biotechnology, Microbiology, Biochemistry, Genetics, and Biomedical fields. ' +
      'For B.Sc and M.Sc life science students.',
    keywords: [
      'biotechnology', 'microbiology', 'biochemistry', 'genetics',
      'biomedical', 'life science', 'b.sc', 'm.sc', 'molecular biology',
    ],
  },
  // ── Design ────────────────────────────────────────────────────────
  {
    slug: 'design',
    label: 'Design Internships',
    h1: 'Graphic, UI/UX & Product Design Internships',
    description:
      'Find internships in Graphic Design, UI/UX, Product Design, Motion Graphics, Fashion Design, and Interior Design. ' +
      'For students from design colleges and art institutions.',
    keywords: [
      'design', 'graphic design', 'ui ux', 'ui/ux', 'product design',
      'figma', 'adobe', 'motion graphics', 'fashion design', 'interior design',
      'visual design',
    ],
  },
  // ── Architecture ──────────────────────────────────────────────────
  {
    slug: 'architecture',
    label: 'Architecture Internships',
    h1: 'Architecture & Urban Planning Internships',
    description:
      'Browse architecture internships at design firms, real estate companies, and urban planning agencies. ' +
      'For B.Arch and M.Arch students.',
    keywords: [
      'architecture', 'urban planning', 'b.arch', 'm.arch', 'autocad',
      'revit', 'real estate', 'interior architecture', 'structural design',
    ],
  },
  // ── Media & Communications ────────────────────────────────────────
  {
    slug: 'media',
    label: 'Media & Journalism Internships',
    h1: 'Media, Journalism & Mass Communication Internships',
    description:
      'Explore internships in Journalism, Mass Communication, Film Production, Photography, ' +
      'Video Production, and Content Creation.',
    keywords: [
      'media', 'journalism', 'mass communication', 'film', 'photography',
      'video production', 'content creation', 'writing', 'broadcast',
    ],
  },
  // ── Education & EdTech ────────────────────────────────────────────
  {
    slug: 'education',
    label: 'Education & EdTech Internships',
    h1: 'Education & EdTech Internships',
    description:
      'Find teaching, academic research, curriculum design, and EdTech internships. ' +
      'Suitable for B.Ed students and education enthusiasts.',
    keywords: [
      'education', 'teaching', 'edtech', 'b.ed', 'curriculum',
      'academic research', 'tutoring', 'e-learning', 'instructional design',
    ],
  },
  // ── Hospitality & Tourism ─────────────────────────────────────────
  {
    slug: 'hospitality',
    label: 'Hospitality & Tourism Internships',
    h1: 'Hospitality, Hotel Management & Tourism Internships',
    description:
      'Browse internship opportunities in Hotel Management, Hospitality, Travel & Tourism, Event Management, ' +
      'and Food & Beverage. For IHM and hotel management college students.',
    keywords: [
      'hospitality', 'hotel management', 'tourism', 'travel', 'event management',
      'food beverage', 'ihm', 'front office', 'housekeeping',
    ],
  },
  // ── Agriculture ───────────────────────────────────────────────────
  {
    slug: 'agriculture',
    label: 'Agriculture Internships',
    h1: 'Agriculture & Agribusiness Internships',
    description:
      'Discover internships in Agriculture, Agribusiness, Food Technology, Dairy Technology, and Rural Development. ' +
      'For B.Sc Agriculture and related students.',
    keywords: [
      'agriculture', 'agribusiness', 'food technology', 'dairy', 'horticulture',
      'agritech', 'rural development', 'b.sc agriculture',
    ],
  },
  // ── Social Impact ─────────────────────────────────────────────────
  {
    slug: 'ngo',
    label: 'NGO & Social Work Internships',
    h1: 'NGO, Social Work & Non-profit Internships',
    description:
      'Find internships with NGOs, non-profits, and social enterprises working in areas like ' +
      'education, healthcare, environment, and community development.',
    keywords: [
      'ngo', 'social work', 'non-profit', 'community development',
      'social impact', 'volunteer', 'csr', 'sustainable development',
    ],
  },
  // ── Research ──────────────────────────────────────────────────────
  {
    slug: 'research',
    label: 'Research Internships',
    h1: 'Research Internships in India',
    description:
      'Explore academic and industrial research internships across science, social science, economics, and technology fields. ' +
      'Suitable for undergraduate and postgraduate students.',
    keywords: [
      'research', 'academic research', 'iit', 'iim', 'laboratory',
      'r&d', 'thesis', 'research paper', 'internship research',
    ],
  },
  // ── Remote / Work-from-home ───────────────────────────────────────
  {
    slug: 'remote',
    label: 'Remote Internships',
    h1: 'Remote & Work-from-Home Internships',
    description:
      'Find fully remote and work-from-home internships across all fields — technology, marketing, design, finance, and more. ' +
      'Apply from anywhere in India.',
    keywords: [
      'remote', 'work from home', 'wfh', 'online internship', 'virtual internship',
      'work anywhere',
    ],
    isLocation: true,   // used by the router to know this is a location-type category
  },
];

/**
 * Lookup a category by URL slug.
 * @param {string} slug
 * @returns {object|undefined}
 */
export function getCategoryBySlug(slug) {
  return CATEGORIES.find(c => c.slug === slug);
}

/**
 * Determine whether an internship matches a given category based on keywords.
 * @param {object} internship  – internship document
 * @param {object} category    – category from CATEGORIES array
 * @returns {boolean}
 */
export function internshipMatchesCategory(internship, category) {
  if (!internship || !category) return false;

  // Special case: remote category
  if (category.slug === 'remote') {
    const loc  = (internship.location  || '').toLowerCase();
    const mode = (internship.workMode  || '').toLowerCase();
    return loc.includes('remote') || loc.includes('work from home') ||
           mode.includes('remote') || mode.includes('wfh') || mode.includes('work from home');
  }

  const haystack = [
    internship.title,
    internship.description,
    internship.department,
    ...(internship.skills || []),
    ...(internship.branchRequirements || []),
    ...(internship.degreeRequirements || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return category.keywords.some(kw => haystack.includes(kw.toLowerCase()));
}

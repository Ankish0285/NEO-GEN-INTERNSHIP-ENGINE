# NEOGEN INTERNSHIP ENGINE — Production SEO System (PRD)

## Overview
- **Summary**: Design and implement a scalable, production-ready SEO architecture for NEOGEN INTERNSHIP ENGINE covering global branding, homepage, dynamic internship detail slugs, category & location pages, internal linking, sitemap.xml, robots.txt, canonical URLs, Open Graph/Twitter cards, JobPosting JSON-LD, Organization/WebSite JSON-LD, and technical SEO (alt text, headings, semantic HTML, 404).
- **Purpose**: Make the website technically indexable by Google/Bing for genuine internship-related search queries across every academic branch, field, industry, location and internship type supported by the platform.
- **Target Users**: Search engine crawlers (Googlebot, Bingbot), students searching for internships across India, partners, success-story readers, resume-template visitors.

## Goals
1. Standardize global visible + SEO brand name to `NEOGEN INTERNSHIP ENGINE` (founder `Ankish Kumar`, website `https://neogeninternshipengine.me`).
2. Add crawlable internship detail pages at `/internships/:slug` with canonical URLs and unique per-page metadata.
3. Add meaningful category pages at `/internships/category/:slug` and location pages at `/internships/location/:slug` (gated by actual data in the platform).
4. Inject valid Schema.org JobPosting JSON-LD on individual internship detail pages only.
5. Inject Organization + WebSite JSON-LD globally (homepage).
6. Publish a valid `/sitemap.xml` (Vite build-time generated with dynamic entries + static) and `/robots.txt` disallowing private/dashboard areas.
7. Canonical, Open Graph and Twitter metadata for every public indexable page.
8. Preserve and do not break existing application flow (login, dashboards, applications, resume, ATS, AI, subscriptions, Razorpay, support, success stories, resources, policies).

## Non-Goals
- Guarantee any specific ranking position.
- Keyword stuff content.
- Create hundreds of thin/spam doorway pages for empty categories/cities.
- Modify backend API contracts, auth, data models, payment flow, or user data.
- Add SEO to private/authenticated pages, admin, partner, or student dashboards.
- SSR or Next.js migration; remain Vite SPA.
- Create invented phone, address, awards, social metadata for Organization JSON-LD.
- Deploy or push changes to GitHub automatically.

## Background & Context
- Existing repo: MERN + Vite SPA at `/frontend`, Express backend at `/backend`.
- Public routes today: `/`, `/find-internship`, `/success-stories`, `/resources/resume-templates`, `/resume-builder/:templateId`, `/login`, `/forgot-password`, `/reset-password/:token`.
- No individual internship detail page exists; `FindInternship` page renders a list with inline apply modal.
- Internship model has fields: `_id, title, organization, department, duration, stipend, location, eligibility, deadline, description, skills, workMode, type, startDate, openings, benefits, responsibilities, status, createdAt, updatedAt, stats.views/applied/hired`.
- Backend public API: `GET /api/internships` (filters: `?search`, `?location`, `?department`) and `GET /api/internships/:id`. No slug endpoint.
- `index.html` has correct `<title>NEOGEN INTERNSHIP ENGINE</title>` and description + `application-name`, but no Open Graph/Twitter/sitemap/robots/OG image tags. No JSON-LD.
- `frontend/public/` does not exist; assets at `frontend/src/assets/` and `frontend/logo.png`.
- `vite.config.js` default Vite SPA (no plugins for sitemap/robots).
- No SEO library; dependencies = 26 packages. Avoid heavy new deps; use a small custom `<SEO>` component + hooks manipulating `document`.

## Functional Requirements

### BRANDING
- FR-1 All `<title>`, `og:title`, `og:site_name`, `twitter:title`, `application-name`, Organization JSON-LD `name`, WebSite JSON-LD `name` must be exactly `NEOGEN INTERNSHIP ENGINE` (no spacing variants: `NEO GEN`, `Neogen`, lowercase).
- FR-2 Organization JSON-LD must include `founder.name = "Ankish Kumar"`, `url = "https://neogeninternshipengine.me"`, no invented contact details.
- FR-3 Global canonical base URL must be `https://neogeninternshipengine.me`.

### HOME PAGE SEO
- FR-4 Home page unique title e.g. `Internships for Students | NEOGEN INTERNSHIP ENGINE`.
- FR-5 Home page unique meta description describing the platform as internship discovery covering multiple fields/branches in India with remote/WFH and AI/ATS features that actually exist.
- FR-6 Home heading preserves design; semantic H1 must communicate internship discovery across fields.
- FR-7 Home page injects Organization + WebSite JSON-LD.

### DYNAMIC INTERNSHIP DETAILS
- FR-8 New route `/internships/:slug` (public, unauthenticated) renders InternshipDetail page by resolving slug → internship.
- FR-9 Slugs are stable, lowercase, kebab-case generated from `title-organization-location` (or `title-_id` fallback) and URL-safe.
- FR-10 InternshipDetail page generates unique title like `{title} | {organization} | NEOGEN INTERNSHIP ENGINE`.
- FR-11 InternshipDetail page generates unique meta description from `(description or eligibility).slice(0, 160)`.
- FR-12 InternshipDetail page sets canonical `https://neogeninternshipengine.me/internships/:slug`.
- FR-13 InternshipDetail page injects OG/Twitter metadata (title/description/URL/site_name/card: `summary_large_image` + OG image if available).
- FR-14 InternshipDetail page renders Schema.org JobPosting JSON-LD only when status in `{active, published}` and data available. Invent no fields.
- FR-15 Backend adds public `GET /api/internships/by-slug/:slug` and `GET /api/internships/seed/urls` endpoints (no auth) — existing `/:id` unchanged. Mongoose model untouched.
- FR-16 A slug utility function (shared concept) returns slug for internship; applied when rendering cards linking to `/internships/:slug`.
- FR-17 InternshipList and InternshipCard anchor elements link to `/internships/:slug` (detail page) using `<a>` with meaningful anchor text (`title` at `organization` in `location`) — internal crawlable links.

### CATEGORY & LOCATION PAGES (data-gated)
- FR-18 New route `/internships/category/:slug` and `/internships/location/:slug` renders a shared ListingPage component.
- FR-19 Only categories/locations present in platform data (or whitelisted supported list) return 200; unknown slug → generic "no internships found" but with helpful indexable descriptive content about the field/location when it is a supported category name; unknown unsupported names → 404 via component navigation + `<meta name="robots" content="noindex">`.
- FR-20 Each page has unique H1 + intro content + meta title/description + canonical URL + OG/Twitter metadata.
- FR-21 Whitelist covers: Engineering/CS/IT/AI-ML/Data-Science/Software/Web/Mobile/Cybersecurity/Cloud/DevOps/Electronics/Electrical/Mechanical/Civil/Chemical/Automobile/Commerce/Accounting/Finance/Banking/Investment/FinTech/Economics/MBA/Business-Management/Operations/Biz-Dev/Product-Management/Supply-Chain/Entrepreneurship/Digital-Marketing/Marketing/Sales/Social-Media/Content-Marketing/PR/Advertising/HR/Recruitment/Talent-Acq/People-Ops/Legal/Corporate-Law/Legal-Research/Medical/Healthcare/Nursing/Public-Health/Hospital-Administration/Pharmaceutical/Clinical-Research/Biotechnology/Microbiology/Biochemistry/Genetics/Biomedical/Physics/Chemistry/Mathematics/Statistics/Environmental-Science/English/History/Political-Science/Psychology/Sociology/Languages/Humanities/Graphic-Design/UI-UX-Design/Product-Design/Fashion-Design/Interior-Design/Architecture/Urban-Planning/Teaching/Education/Academic-Research/EdTech/Journalism/Mass-Comm/Film/Photography/Video-Production/Content-Creation/Hotel-Management/Hospitality/Travel-Tourism/Event-Management/Agriculture/Agribusiness/Food-Technology/Dairy-Technology/Government/Public-Sector/Policy-Research/Research/NGO/Social-Work/Community-Dev/Non-profit + Remote/WFH + popular India metro cities (Jaipur, Delhi, Mumbai, Bangalore, Hyderabad, Pune, Chennai, Kolkata, Ahmedabad, Kochi, Indore, Bhubaneswar, Lucknow, Chandigarh, Nagpur, Patna, Surat, Visakhapatnam, Coimbatore, Madurai).

### INTERNAL LINKING
- FR-22 Home page links to `/find-internship`, `/success-stories`, `/resources/resume-templates` and featured internships link to `/internships/:slug` with descriptive anchors.
- FR-23 About section footer/sidebar area (if any) lists a few top categories/locations as links.
- FR-24 InternshipDetail shows related internships + links to category + location page of that internship.

### SITEMAP.XML + ROBOTS.TXT
- FR-25 Vite plugin/script emits `dist/sitemap.xml` at build-time listing: static public pages + supported category pages (whitelist) + supported city/location pages (whitelist) + internship URLs fetched or generated from a JSON fixture `seed-sitemap-internships.json` (backend `GET /api/internships/seed/urls` returns list of `{slug}` for active/published). Build runs without network via fallback fixture.
- FR-26 Sitemap includes `<lastmod>` and `<changefreq>` where appropriate.
- FR-27 `dist/robots.txt` lines: `User-agent: *`, `Allow: /`, `Disallow: /admin/`, `Disallow: /dashboard/`, `Disallow: /partner/dashboard/`, `Disallow: /profile/`, `Disallow: /applications/`, `Disallow: /resume-builder/`, `Disallow: /reset-password/`, `Disallow: /forgot-password`, `Disallow: /private/`, plus `Sitemap: https://neogeninternshipengine.me/sitemap.xml`.
- FR-28 Sitemap NEVER includes login/register/dashboard/admin/private pages.

### CANONICAL URLs
- FR-29 Every public indexable page inserts `<link rel="canonical" href="https://neogeninternshipengine.me/{path}">` with no query params (except `/:slug` which has none).
- FR-30 Canonical URLs use HTTPS, no trailing slash, lowercase path, match route actual paths.

### OG / SOCIAL CARDS
- FR-31 Every public page injects: `og:title`, `og:description`, `og:url`, `og:type=website`, `og:image` (use `/logo.png` — already present), `og:site_name=NEOGEN INTERNSHIP ENGINE`, `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`.

### TECHNICAL SEO
- FR-32 Semantic HTML: one H1 per page; H2/H3 hierarchy preserved.
- FR-33 Featured images and story/hero images include descriptive `alt` text; lazy loading via `loading="lazy"` and where possible explicit `width/height`.
- FR-34 404 behavior: unknown routes render a proper NotFound page (component) with `<meta name="robots" content="noindex, follow">` and H1 "Page not found" + links to home.

## Non-Functional Requirements
- NFR-1 Zero new required runtime npm dependencies. If a sitemap build plugin is required, install `sitemap` as `devDependency` only; but preferred: write small Node script in `frontend/scripts/build-seo-assets.cjs` with only built-in Node (`http.request` optional, no external dep).
- NFR-2 `npm run build` succeeds with `exit code 0`; no diagnostics errors.
- NFR-3 After build, `dist/robots.txt` and `dist/sitemap.xml` are present and non-empty.
- NFR-4 Internship detail page must not break Apply/Application flow; existing modal/API integration is preserved.
- NFR-5 SEO updates run client-side only (no SSR changes); acceptable for SPA with Google's evergreen rendering; JSON-LD rendered via `<script>` into `<head>` or component-rendered into body bottom and injected as DOM node into head via the SEO component.
- NFR-6 No `.env` or secrets changed or exposed; no `.env.*` touched.
- NFR-7 Responsive mobile-friendly layout preserved; no CSS breaking existing themes.
- NFR-8 Google's structured-data requirements for JobPosting: required fields populated if present; do not invent missing values.

## Constraints
- Technical: Vite SPA; React Router v6; Mongo Internship schema immutable; no new production deps.
- Business: Brand exact `NEOGEN INTERNSHIP ENGINE`; Founder `Ankish Kumar`; URLs `https://neogeninternshipengine.me` and `https://api.neogeninternshipengine.me`. No fake data in JobPosting.
- Dependencies: Existing dashboard routes (`/dashboard`, `/admin/dashboard`, `/partner/dashboard`) and auth/reset routes must not be indexed.

## Assumptions
- A-1 The `seed-sitemap-internships.json` fallback fixture is generated manually for production runs or by calling `GET /api/internships/seed/urls` during a prebuild step; build-time script will have fallback so `npm run build` still works when backend is offline.
- A-2 OG image at `/logo.png` is acceptable as the site-wide og:image; we will not generate per-internship OG images (user did not request per-page screenshots).
- A-3 Category whitelist hardcoded is OK; dynamic from DB would be nicer but user wants only supported categories + data-gated.
- A-4 Slug collision (two internships with identical titles) resolves by appending `-2` / `-3` deterministically using `_id` suffix fallback.
- A-5 Backend `getInternships` already returns public `{status:{$in:['active','published']}}` filtered list. If not, the by-slug endpoint applies it.

## Open Questions
- [ ] Are city names required to be India-only? Assuming yes per platform positioning.
- [ ] Do we need a separate "Remote Internships in India" page? Yes — handled via `/internships/location/remote` and `/internships/location/work-from-home`.
- [ ] Does backend currently filter inactive in public list? Assuming yes; will double check controller read and add active-only filter in by-slug endpoint.

## Acceptance Criteria

### AC-1: Global Brand Exact Match
- **Type**: `rule`
- **Given**: Built app loaded at `/`
- **When**: DevTools inspect `<title>`, `<meta property="og:site_name">`, `<meta property="og:title">`, `<meta name="application-name">`, JSON-LD Organization `name`
- **Then**: Every occurrence is exactly the string `NEOGEN INTERNSHIP ENGINE`
- **Pass Condition**: No string matches `NEO GEN`, `NEO GEN INTERNSHIP ENGINE`, `Neogen`, or lowercase variants in the targeted 6 DOM locations
- **Evidence**: Browser DevTools Elements tab + grep source output

### AC-2: Home Page Unique SEO Title & Description & H1
- **Type**: `rule`
- **Given**: Route `/`
- **When**: Inspect `document.title`, `meta[name=description]`, first `<h1>`
- **Then**: title contains both "Internships" and "NEOGEN INTERNSHIP ENGINE"; description is between 120-170 chars and mentions India, multiple fields, AI/ATS only if actually present; H1 is unique on page
- **Pass Condition**: All 3 assertions true
- **Evidence**: DevTools Elements, copy lengths

### AC-3: Internship Detail at /internships/:slug Renders 200 + Canonical + OG + JobPosting JSON-LD
- **Type**: `rule`
- **Given**: An active/published internship with known `_id`
- **When**: Navigate browser to `/internships/{slug}` (slug computed deterministically from title)
- **Then**: 1) Page renders internship content (title, org, description, apply button) 2) `<link rel=canonical>` = `https://neogeninternshipengine.me/internships/{slug}` 3) `og:url` same as canonical 4) unique `og:title` containing both internship title and org 5) JSON-LD script of `@type=JobPosting` in DOM with matching title
- **Pass Condition**: 5 checks true
- **Evidence**: DOM snapshot of `/internships/{slug}`

### AC-4: JobPosting JSON-LD Not On Other Pages
- **Type**: `rule`
- **Given**: Routes `/`, `/find-internship`, `/internships/category/engineering`, `/internships/location/jaipur`, `/success-stories`
- **When**: Search DOM for `@type":"JobPosting"`
- **Then**: None of the non-detail pages have JobPosting JSON-LD
- **Pass Condition**: 0 matches on all 5 pages
- **Evidence**: grep innerHTML output

### AC-5: Category/Location Pages (Whitelist Supported)
- **Type**: `rule`
- **Given**: Supported category `/internships/category/engineering` and supported city `/internships/location/delhi`
- **When**: Navigate to both
- **Then**: 200 render, unique H1 includes category or location, meta title includes it, canonical is correct, internship grid or empty-state with helpful intro content renders; supported category names do not emit `noindex`
- **Pass Condition**: 4 items true per page × 2 pages
- **Evidence**: DOM snapshots + meta robots check

### AC-6: Unknown / Unsupported Names → NOINDEX or 404
- **Type**: `rule`
- **Given**: `/internships/category/not-a-real-category-xyz123`
- **When**: Navigate; look for `<meta name="robots">`
- **Then**: Contains `noindex` OR route shows NotFound component
- **Pass Condition**: Either condition true
- **Evidence**: Screenshot of meta tag

### AC-7: Internal Links Exist Between Home ↔ Categories ↔ Internship Detail
- **Type**: `rubric`
- **Dimension**: Internal linking graph quality
- **Scale**: 1-5
- **Anchors**: 1 = No crawlable links between SEO sections; 3 = Some links but many missing anchors; 5 = Descriptive `<a>` tags present: Home → featured internship slugs → category + location links → internship detail links back to category/location. No exact-match keyword anchor stuffing.
- **Pass Threshold**: >= 4
- **Evidence**: Link element HTML sample list

### AC-8: dist/robots.txt + dist/sitemap.xml after build
- **Type**: `rule`
- **Given**: Fresh `npm run build`
- **When**: ls dist; cat dist/robots.txt dist/sitemap.xml
- **Then**: Both files exist; robots.txt includes at least `Disallow: /admin/`, `Disallow: /dashboard/`, `Sitemap:` line with correct URL; sitemap.xml is well-formed XML containing static public URLs + category (engineering/commerce/marketing/hr/design) + location (jaipur/delhi/mumbai/bangalore/hyderabad) + at least `/internships/:slug` pattern (example or real entries from seed fixture)
- **Pass Condition**: Files present + required lines + valid XML
- **Evidence**: Console output from `ls` + file contents

### AC-9: Private Pages Not in Sitemap
- **Type**: `rule`
- **Given**: Built sitemap.xml
- **When**: grep for `/login`, `/dashboard`, `/admin`, `/partner/dashboard`, `/profile`, `/applications`, `/forgot-password`, `/reset-password`
- **Then**: 0 matches
- **Pass Condition**: True
- **Evidence**: grep exit status

### AC-10: Canonical URLs Use HTTPS + No Query Params
- **Type**: `rule`
- **Given**: Public page routes `/`, `/find-internship`, `/success-stories`, `/internships/{slug}`, `/internships/category/{x}`, `/internships/location/{y}`, `/resources/resume-templates`
- **When**: Inspect `<link rel=canonical>` hrefs
- **Then**: All begin with `https://neogeninternshipengine.me`, contain no `?` query strings; paths match the route
- **Pass Condition**: True for all pages checked
- **Evidence**: Link href output

### AC-11: 404 NotFound Page (noindex)
- **Type**: `rule`
- **Given**: Navigate to `/this-route-does-not-exist-xyz`
- **When**: Render page + inspect meta robots
- **Then**: H1 "Page not found" (or similar) + canonical self OR `meta robots=noindex,follow` + link back to home
- **Pass Condition**: True
- **Evidence**: DOM snapshot

### AC-12: npm run build exit 0
- **Type**: `rule`
- **Given**: No code diagnostics errors
- **When**: `cd frontend && npm run build`
- **Then**: Process exit code 0; `dist/` contains index.html + seo asset files
- **Pass Condition**: Exit 0 + files
- **Evidence**: CLI output

### AC-13: Existing Functionality Not Broken (Smoke Test)
- **Type**: `rubric`
- **Dimension**: App preservation fidelity
- **Scale**: 1-5
- **Anchors**: 1 = Core flows broken (login modal, FindInternship, Apply); 3 = Minor visual regressions; 5 = All existing pages render, login/logout buttons appear, FindInternship lists + modals work, dashboards load (if backend running), success stories public page loads, no console errors unique to SEO changes
- **Pass Threshold**: >= 4
- **Evidence**: Console error count; list of pages loaded successfully

### AC-14: Alt Text & Lazy Loading on Hero/Story/Card Images
- **Type**: `rule`
- **Given**: Home page HTML + FindInternship + SuccessStories
- **When**: Inspect `<img>` elements
- **Then**: At a minimum, hero background decorative (or the actual featured images) have non-empty `alt`; story profile images have alt containing name or brand; logo images have alt `NEOGEN INTERNSHIP ENGINE logo`; `<img>` tags below-the-fold include `loading="lazy"` and `width/height` where feasible
- **Pass Condition**: True
- **Evidence**: Sample of img tag attributes

### AC-15: Dark/Light Mode & Transitions Preserved
- **Type**: `rule`
- **Given**: Toggle dark/light on home + internship detail
- **When**: Visually inspect About section bg (per prior fixes) + cards + text contrast
- **Then**: No white background in dark mode; transitions smooth 250ms
- **Pass Condition**: True
- **Evidence**: Screenshot diffs or manual visual check log

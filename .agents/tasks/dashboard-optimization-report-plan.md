# Implementation Plan — NEO GEN Dashboard Optimization + Learning Resources

> Generated from codebase exploration. All file paths are relative to the workspace root
> `d:\my code\my project\NEO GEN INTERNSHIP ENGINE`.

---

## Codebase audit findings

| File | Finding |
|---|---|
| `backend/models/Guide.js` | 8 fields present (title, description, sections, status, difficulty, estimatedTime, author, timestamps). MISSING: youtubeUrl, youtubeVideoId, thumbnailUrl, category, tags, targetAudience, isPublic |
| `backend/controllers/guideController.js` | 4 functions (getGuides, createGuide, updateGuide, deleteGuide). No audience filtering, no search, no pagination, no YouTube validation |
| `backend/routes/guideRoutes.js` | GET / public; POST/PUT/DELETE admin-only. No student/partner/public scoped endpoints |
| `backend/server.js` | Registers `app.use('/api/guides', require('./routes/guideRoutes'))` ✓ |
| `backend/middleware/authMiddleware.js` | Exports: protect, optionalAuth, admin (allows 'admin' OR 'super_admin'), partner |
| `frontend/src/utils/roleConfig.js` | Flat `menuItems[]` per role. No grouping structure. 4 roles: student, admin, super_admin, partner |
| `frontend/src/components/dashboard/common/Sidebar.jsx` | Iterates `config.menuItems` with NavLink. No group/section support |
| `frontend/src/components/Navbar.jsx` | 'Resources' nav item scrolls to `#resources-section` on homepage — needs to link to `/learning-resources` |
| `frontend/src/routes/AppRoutes.jsx` | All existing routes present. No /learning-resources route exists yet |
| `frontend/src/services/api.js` | `api.get/post/put/patch/delete/upload` pattern; axios interceptor unwraps `response.data` |
| `frontend/src/components/ui/Card.jsx` | Props: children, className, noPadding, title, subtitle, action, onClick, variant |
| `frontend/src/components/ui/Modal.jsx` | Props: isOpen, onClose, title, className, children. Portal-based with AnimatePresence |

---

## FEAT decomposition

This work decomposes into 3 independent-then-sequential FEATs:
- **FEAT-001** — Backend: Guide model + controller + routes (no frontend changes)
- **FEAT-002** — Frontend: Learning Resources components + pages + Navbar + AppRoutes
- **FEAT-003** — Frontend: Sidebar grouping for all three dashboards

FEAT artifacts live at: `.agents/tasks/dashboard-opt/`

---

## Implementation Plan

- [ ] 1. **FEAT-001 — Extend Guide model and replace guide backend**
      Extend `backend/models/Guide.js` with 7 new fields: `youtubeUrl`, `youtubeVideoId`, `thumbnailUrl`, `category`, `tags`, `targetAudience`, `isPublic`. Replace `guideController.js` with full CRUD including YouTube URL validation/extraction, audience-scoped query endpoints (public / student / partner / admin), search, category filter, and pagination. Replace `guideRoutes.js` to expose the new scoped endpoints (`GET /api/guides`, `/api/guides/student`, `/api/guides/partner`, `/api/guides/admin`, `GET /api/guides/:id`, and admin write endpoints).

      Files to modify:
      - `backend/models/Guide.js` — add 7 fields
      - `backend/controllers/guideController.js` — full replacement
      - `backend/routes/guideRoutes.js` — full replacement

      Verify: `cd backend && node -e "const G = require('./models/Guide'); console.log(Object.keys(G.schema.paths).join(', '))"` — must print youtubeUrl, youtubeVideoId, thumbnailUrl, category, tags, targetAudience, isPublic; `cd backend && npm test` — existing tests pass.

- [ ] 2. **FEAT-002 — Learning Resources frontend (shared components + pages + routing)**
      Create `frontend/src/services/learningService.js` (8 exports). Create 4 shared components under `frontend/src/components/learning/`: `ResourceCard.jsx`, `ResourceFilters.jsx`, `ResourcePlayer.jsx` (YouTube iframe embed, 16:9 ratio), `ResourceModal.jsx`. Create 4 view pages: admin CRUD page `frontend/src/components/dashboard/admin/LearningResources.jsx`, student view `frontend/src/components/dashboard/student/LearningResources.jsx`, partner view `frontend/src/components/dashboard/partner/LearningResources.jsx`, public page `frontend/src/pages/LearningResourcesPublic.jsx`. Update `Navbar.jsx` to link 'Resources' to `/learning-resources` instead of scrolling. Add 4 new routes to `AppRoutes.jsx`.

      Files to create:
      - `frontend/src/services/learningService.js`
      - `frontend/src/components/learning/ResourceCard.jsx`
      - `frontend/src/components/learning/ResourceFilters.jsx`
      - `frontend/src/components/learning/ResourcePlayer.jsx`
      - `frontend/src/components/learning/ResourceModal.jsx`
      - `frontend/src/components/dashboard/admin/LearningResources.jsx`
      - `frontend/src/components/dashboard/student/LearningResources.jsx`
      - `frontend/src/components/dashboard/partner/LearningResources.jsx`
      - `frontend/src/pages/LearningResourcesPublic.jsx`

      Files to modify:
      - `frontend/src/components/Navbar.jsx` — 'Resources' → Link to /learning-resources
      - `frontend/src/routes/AppRoutes.jsx` — 4 new routes

      Verify: `cd frontend && npm run build` — 0 errors; `cd frontend && npm run test` — all pass.

- [ ] 3. **FEAT-003 — Sidebar navigation grouping for all three dashboards**
      Add `menuGroups` property to all 4 role entries in `roleConfig.js` (student, admin, super_admin, partner). Each role gets collapsible section groups. Learning Resources item is included in each role's groups pointing to the routes created in FEAT-002. Update `Sidebar.jsx` to render grouped navigation when `config.menuGroups` is present, with collapse/expand state per group defaulting to open. Preserve flat `menuItems` fallback for backward compatibility.

      Files to modify:
      - `frontend/src/utils/roleConfig.js` — add menuGroups to all 4 roles
      - `frontend/src/components/dashboard/common/Sidebar.jsx` — add grouped rendering

      Verify: `cd frontend && npm run build` — 0 errors; `cd frontend && npm run test` — all pass.

---

## Key implementation details

### YouTube URL extraction (backend, FEAT-001)
```js
function extractYouTubeVideoId(url) {
  if (!url) return null;
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,       // youtube.com/watch?v=ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,   // youtu.be/ID
    /embed\/([a-zA-Z0-9_-]{11})/,       // youtube.com/embed/ID
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
```

### ResourcePlayer embed URL (frontend, FEAT-002)
```jsx
<iframe
  src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
  sandbox="allow-scripts allow-same-origin allow-presentation"
  title={title}
  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
/>
```

### Audience scoping (backend, FEAT-001)
| Caller | Query filter |
|---|---|
| Public (no auth) | `{ status: 'published', $or: [{targetAudience:'public'},{isPublic:true}] }` |
| Student | `{ status: 'published', targetAudience: { $in: ['students','both','public'] } }` |
| Partner | `{ status: 'published', targetAudience: { $in: ['partners','both','public'] } }` |
| Admin | All records, optional status filter |

### menuGroups structure (frontend, FEAT-003)
```js
menuGroups: [
  { label: null, items: [...] },                          // ungrouped, always visible
  { label: 'Career Development', collapsible: true, items: [...] }, // collapsible section
]
```
Sidebar reads `config.menuGroups || null`. If null, falls back to existing `menuItems` flat render.

---

## Build and test commands

| Environment | Command |
|---|---|
| Frontend build check | `cd frontend && npm run build` |
| Frontend unit tests | `cd frontend && npm run test` |
| Backend smoke test | `cd backend && node -e "require('./models/Guide')"` |
| Backend unit tests | `cd backend && npm test` |
| Frontend dev server | `cd frontend && npm run dev` |
| Backend dev server | `cd backend && npm run server` |

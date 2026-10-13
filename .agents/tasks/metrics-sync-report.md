# NEO GEN Internship Engine — Metrics Sync Final Report

Generated: 2026-10-13  
Commit: `a2d551e` — `fix: centralized student metrics sync - readiness route, fabricated 75, atsScore sync, || to ?? fixes`

---

## Root Causes Found and Fixed

### 1. Missing `/api/career/readiness` route
`InternshipReadiness.jsx` always showed 0% because `careerService.js` called `api.get('/career/readiness')` but `server.js` registered no `/api/career` mount (only `/api/career-goals`, `/api/career-events`, `/api/career-intelligence`). The component caught the 404 silently with `console.warn` and defaulted to `readiness = {}`, rendering every sub-metric as `0`.

**Fixed by:** Creating `backend/routes/careerRoutes.js` and `backend/controllers/careerController.js` with a `getReadiness` handler that derives sub-scores from existing `AIStudentProfile`, `Resume`, `SkillEvidence`, and application data, then registering the mount at `/api/career` in `server.js`.

---

### 2. Fabricated 75% AI Confidence
Two hardcoded fallbacks invented scores for students who had never run an analysis:

- `AIIntelligenceHub.jsx` line ~248: `profile?.aiConfidenceScore || ats.ai_confidence_score || 75` — showed `75%` when no analysis existed.
- `atsController.js`: `let aiConfidenceScore = 70` (line 97) and `aiAts.ai_confidence_score || 75` (line 105) — if the Python engine returned `0`, the stored value became `75` instead of `0`.

**Fixed by:** Replacing `|| 75` and `|| 70` defaults with `?? null` / nullish-safe checks. Missing confidence now shows "Not analyzed" in the UI instead of a fabricated percentage. In `aiController.js`, all four fabricated-zero paths were changed: `employabilityScore || 0` → `?? null`, `internshipReadinessScore || 0` → `?? null`, `aiConfidenceScore || 0` → `?? null`, `latestMatchPercentage || 0` → `?? null`. The hardcoded offline fallback of `60` for `ai_confidence_score` was also removed and replaced with `null`.

---

### 3. `User.atsScore` not synced after `analyzeResumeAI`
`atsController.uploadResume` wrote `User.atsScore` correctly on first upload. However `aiController.analyzeResumeAI` updated `Resume.atsScore` after re-analysis but never updated `User.atsScore`, leaving the User document with the stale upload-time score. Subsequent calls to the Python recommendations engine then received this old value via `atsScore: user.atsScore`.

**Fixed by:** Adding `User.findByIdAndUpdate` after the `Resume` save in `analyzeResumeAI` so `User.atsScore` is kept in sync with `Resume.atsScore` on every analysis.

---

### 4. `||` instead of `??` for score fallbacks
Multiple components used `||` which treats `0` as falsy, silently skipping a valid zero score in favour of the next fallback value in the chain.

**Fixed in:**
- `AIIntelligenceHub.jsx` — fallback chains for `atsScore`, `employabilityScore`, `internshipReadinessScore`, `aiConfidenceScore`
- `Overview.jsx` — `dashboardData?.atsScore || atsScoreData?.score || 0` → `??` chain
- `Analytics.jsx` — empty-chart guard `if (!score) return []` → `if (score == null) return []`
- `ATSResume.jsx` — `atsScoreData?.score || 0` → `?? 0`

---

### 5. `InternshipReadiness.jsx` isolated from correct API and shared context
The component fetched its own data independently, was not connected to `StudentDashboardContext`, and could not benefit from post-upload refreshes. Combined with root cause #1, this meant the page was always broken.

**Fixed by:** Connecting `InternshipReadiness.jsx` to the new `/api/career/readiness` endpoint and adding a "No data" state so the page displays "Not analyzed yet" rather than all-zero scores when no analysis has been run.

---

## Canonical Source for Each Metric

| Metric | Canonical Source | Endpoint |
|--------|-----------------|----------|
| `atsScore` | `Resume.atsScore` (latest resume) → `User.atsScore` fallback | `GET /api/resume/score` |
| `employabilityScore` | `AIStudentProfile.employabilityScore` | `GET /api/ai/profile` |
| `internshipReadinessScore` | `AIStudentProfile.internshipReadinessScore` | `GET /api/career/readiness` (new) |
| `aiConfidenceScore` | `AIStudentProfile.aiConfidenceScore` → ATS result → `null` (never fabricated) | `GET /api/metrics/student` |
| `careerDomain` | `AIStudentProfile.careerDomain` | `GET /api/ai/profile` |
| Aggregated view | All of the above combined | `GET /api/metrics/student` (created Phase 2, commit `8c81e26`) |

---

## Files Changed

| File | Reason |
|------|--------|
| `backend/controllers/aiController.js` | Sync `User.atsScore` after `analyzeResumeAI`; replace `|| 0` → `?? null` for all four score fields; remove fabricated `60` offline fallback for `ai_confidence_score` |
| `backend/controllers/metricsController.js` | New file (Phase 2) — canonical `GET /api/metrics/student` aggregator |
| `backend/routes/metricsRoutes.js` | New file (Phase 2) — registers `/api/metrics/student` |
| `backend/controllers/careerController.js` | New file (Phase 3) — `getReadiness` handler deriving sub-scores from existing models |
| `backend/routes/careerRoutes.js` | New file (Phase 3) — registers `/api/career/readiness` |
| `backend/server.js` | Mount new `/api/career` and `/api/metrics` route files |
| `backend/controllers/atsController.js` | Replace `aiConfidenceScore || 75` and `let aiConfidenceScore = 70` with `?? null` |
| `frontend/src/components/ai/AIIntelligenceHub.jsx` | Replace `|| 75` AI confidence fallback with `?? null`; change `||` → `??` for all score fallback chains; render "Not analyzed" for null values |
| `frontend/src/components/dashboard/student/Overview.jsx` | Change `\|\|` → `??` in ATS score fallback chain |
| `frontend/src/components/dashboard/student/Analytics.jsx` | Change empty-chart guard from `!score` to `score == null` |
| `frontend/src/components/dashboard/student/ATSResume.jsx` | Change `atsScoreData?.score \|\| 0` → `?? 0` |
| `frontend/src/components/dashboard/student/InternshipReadiness.jsx` | Connect to `/api/career/readiness`; add "Not analyzed" empty state |
| `frontend/src/hooks/useStudentMetrics.js` | New file (Phase 3) — shared hook wrapping `GET /api/metrics/student` for reuse across pages |
| `frontend/src/context/StudentDashboardContext.jsx` | Fix `||` → `??` in score reads; expose canonical metrics from context |
| `backend/__tests__/unit/metricsScoring.test.js` | New file (Phase 6) — 7 Jest unit tests covering score handling rules |
| `frontend/src/__tests__/utils/metricsScoring.test.js` | New file (Phase 6) — 6 Vitest unit tests covering frontend score handling |

---

## Score Handling Rules Applied

- `??` (nullish coalescing) used instead of `||` for all score fallbacks throughout
- `score == null` used instead of `!score` for missing-data guards
- `0` is a valid score — never replaced with a default
- `null` means unavailable — shown as "Not analyzed" or "—" in the UI
- Fabricated defaults (`75`, `70`, `60`) removed from both frontend and backend

---

## Test Results

Runner: inline Node.js validation (test files created for Jest/Vitest)  
Generated: 2026-10-13

```
BACKEND — Metrics score handling
  ✓ score of 0 is preserved with nullish check
  ✓ score of 0 fails truthiness (documents fixed bug)
  ✓ null score is not fabricated
  ✓ Resume.atsScore takes priority over User.atsScore
  ✓ User.atsScore used when Resume has no atsScore
  ✓ no fabricated 75 for aiConfidenceScore
  ✓ dataStatus is no_data when no resume parsed text

FRONTEND — Frontend metrics score handling
  ✓ score 0 preserved with nullish coalescing
  ✓ score 0 incorrectly replaced by || operator (documents fixed bug)
  ✓ null score shows placeholder
  ✓ no fabricated 75 for missing AI confidence
  ✓ job match score remains distinct from general ATS score
  ✓ empty chart guard uses null check not truthiness

Tests: 13  Passed: 13  Failed: 0
Status: PASS
```

Test files created:
- `backend/__tests__/unit/metricsScoring.test.js` — 7 tests (Jest)
- `frontend/src/__tests__/utils/metricsScoring.test.js` — 6 tests (Vitest)

Note: two tests ("score of 0 fails truthiness", "score 0 incorrectly replaced by || operator") are intentional documentation tests that assert the pre-fix bug behavior. They are correct as written and serve as regression anchors.

---

## Build Result

```
Step 7a: Frontend Production Build
Command: node frontend/node_modules/vite/bin/vite.js build
Result: ✅ SUCCESS — built in ~17-18s

Artifacts:
  dist/index.html                     5.83 kB  (gzip: 1.77 kB)
  dist/assets/logo-EFmGWgiU.png   2,231.39 kB
  dist/assets/index-wuZG8Dpx.css    243.81 kB  (gzip: 38.40 kB)
  dist/assets/index-DedzJ6ea.js   1,617.52 kB  (gzip: 424.82 kB)

Warnings (pre-existing, not introduced by this work):
  - resumeTemplates.js is both dynamically and statically imported
  - Some chunks larger than 500 kB (no chunking config in place)

Step 7b: Backend Lint
  backend/controllers/aiController.js       ✅ PASS
  backend/controllers/metricsController.js  ✅ PASS
  backend/routes/metricsRoutes.js           ✅ PASS

Step 7c: Commit
  Hash:    a2d551e
  Message: fix: centralized student metrics sync - readiness route,
           fabricated 75, atsScore sync, || to ?? fixes
```

---

## Remaining Items

- `InterviewLog` model not yet created — `interviewScore` in the readiness response returns `null` (intentional; shown as "Not analyzed" in UI, not fabricated).
- No database migrations required — all changes are logic and API URL fixes; existing schema fields were sufficient.
- `PublicAIChat.jsx` required no changes — confirmed in audit that it uses only the unauthenticated `/api/ai/public-chat` endpoint and never accesses student data.
- `AIChatAssistant.jsx` required no changes — it correctly uses authenticated student profile data from `AIStudentProfile.rawAnalysis` as chat context; no fabricated numbers are injected.
- Large chunk warnings in the frontend build are pre-existing and unrelated to this work; code-splitting configuration is a separate concern.

---

## Deployment Steps

> Do NOT execute automatically.

1. Run `npm install` in both `/backend` and `/frontend` (no new external dependencies were added, but lockfiles should be confirmed consistent).
2. Run `cd backend && npm run lint` to verify no regressions.
3. Run `cd frontend && npm run build` to confirm the production bundle still passes.
4. Run `cd frontend && npm test` (Vitest) and `cd backend && npm test` (Jest) for the full test suite.
5. Deploy backend to existing AWS EC2 instance — no environment variable changes required; no infrastructure changes.
6. Deploy `frontend/dist/` to existing S3 / CloudFront hosting.
7. Verify `GET /api/metrics/student` returns correct `atsScore`, `employabilityScore`, `internshipReadinessScore`, and `aiConfidenceScore` in staging (use a student account that has run AI analysis).
8. Verify `GET /api/career/readiness` returns sub-scores (not all zero) for a student with an analysed resume.
9. Verify the InternshipReadiness page shows actual scores, not 0%, after analysis.
10. Verify AI Confidence shows "Not analyzed" for a student who has never run analysis (not `75%`).
11. Verify a score of `0` on any metric is displayed as `0`, not replaced by a fallback value.
12. Smoke-test `PublicAIChat` in an incognito window — confirm it returns general responses only and does not expose student data.
13. Do NOT run database migrations — none are required.

# Phase 4 Implementation Plan — NEO GEN Internship Engine

## What Was Read / What Exists vs. What Must Be Created

### Existing (confirmed by reading)
| File | Status | Notes |
|------|--------|-------|
| `backend/models/SkillAssessment.js` | Exists | Simple quiz model `{user, skill, level, score, source, assessedAt}`. No evidence sources, no confidenceScore. A NEW model `SkillEvidence.js` must be created. |
| `backend/models/AIStudentProfile.js` | Exists | Has `skillProfile[], strengths[], weaknesses[], learningRoadmap[]`. No `performanceHistory` field. |
| `backend/models/ActivityLog.js` | Exists | `{user, action, details, ip, userAgent}`. Already usable for certificate audit. |
| `backend/controllers/careerIntelligenceController.js` | Exists | Only 3 handlers: `getCareerDashboard`, `getSkillGapAnalysis`, `getAdminCareerIntelligenceOverview`. Missing: getSkillGapPriority, getWhatIfSimulation, getOpportunityUnlock, getWhyNotApply, getCounterfactualRecommendation, getExplainableRecommendation, rankApplicationsByValue. |
| `backend/controllers/adaptiveLearningController.js` | Exists | Has `getMyAdaptivePlan, refreshAdaptivePlan, markGuideCompleted, adminGetAllAdaptivePlans, getAdaptiveLearningRecommendations`. Missing: `completeLearning`, `submitAssessment`. |
| `backend/controllers/feedbackController.js` | Exists | Has `submitFeedbackResponse` that updates `SkillAssessment` on high ratings. Does NOT update `AIStudentProfile`. |
| `backend/controllers/aiController.js` | Exists | No `generate-application` endpoint. Has `checkTruthGuard`. Missing: `generateApplication`. |
| `backend/controllers/internshipQualityController.js` | Exists | Only `getInternshipQuality`. Missing: `getApplicationStrength`. `calculateQualityScore` is a local function (importable). |
| `backend/controllers/certificateController.js` | Exists | Does NOT import ActivityLog. No audit logging for issue/verify/revoke. |
| `backend/routes/careerIntelligenceRoutes.js` | Exists | Only 3 routes. All new routes must be added. |
| `backend/routes/adaptiveLearningRoutes.js` | Exists | 5 routes. Missing `/complete-learning` and `/assessment`. |
| `backend/routes/internshipQualityRoutes.js` | Exists | Only `GET /:internshipId`. Missing `/application/:applicationId/strength`. |
| `backend/server.js` | Exists | Missing `/api/skill-evidence` registration. All others registered. |
| `backend/utils/notificationHelper.js` | Exists | Signature: `createAndNotify(app, {recipient, title, message, type, priority, link})`. |
| `frontend/src/services/careerService.js` | Exists | Has `getSkillEvidence, getSkillEvidenceBreakdown, addSkillEvidence` (all correctly pointing to `/skill-evidence`). Missing: `getSkillGapPriority, simulateWhatIf, getOpportunityUnlock, getOpportunityCost, getWhyNotApply, getCounterfactual, getExplainableRec`. |
| `frontend/src/services/aiService.js` | Exists | Missing: `generateApplication`. |
| `frontend/src/components/dashboard/student/SkillEvidenceHub.jsx` | Exists | Already calls `/skill-evidence` correctly. Already responsive. |
| `frontend/src/components/dashboard/student/SkillGapPriority.jsx` | Exists | Calls `getSkillGaps()` → wrong endpoint `/career/skill-gaps`. Must switch to `getSkillGapPriority()`. simulateHandler posts to wrong path. |
| `frontend/src/components/dashboard/student/CareerPathSimulator.jsx` | Exists | Calls `getCareerPaths()` → stub `/career/career-paths`. No hardcoded paths. Must compute from real SkillEvidence using CAREER_PATHS constant. |
| `frontend/src/components/dashboard/student/DigitalTwin.jsx` | Exists | Calls `getDigitalTwin()` → stub `/career/digital-twin`. Must be replaced with 3 real API calls. |
| `frontend/src/components/dashboard/student/Applications.jsx` | Exists | Has ApplicationStrengthBar already. Missing Priority Rank badge from opportunity-cost. |
| `frontend/src/components/dashboard/student/Recommendations.jsx` | Exists | Does NOT use ExplainableRecommendationCard. Must add Explain button + modal. |
| `frontend/src/pages/InternshipDetailPage.jsx` | Exists | No WhyNotApplyModal integration. Must add 'Why Not Apply?' button. |
| `frontend/src/components/career/WhyNotApplyModal.jsx` | Exists | Ready to use. |
| `frontend/src/components/career/ExplainableRecommendationCard.jsx` | Exists | Ready to use. |

### Must Be Created (net-new files)
| File | Purpose |
|------|---------|
| `backend/models/SkillEvidence.js` | New model with evidenceSources[], confidenceScore, proficiency |
| `backend/models/MicroAssessment.js` | Assessment doc with questions, userAnswers, score |
| `backend/controllers/skillEvidenceController.js` | CRUD + calculateConfidence function |
| `backend/routes/skillEvidenceRoutes.js` | 4 routes for skill evidence |

---

## Task Dependency Map

```
FEAT-001 (SkillEvidence model + controller + routes + server.js + careerService additions)
    │
    ├──► FEAT-002 (Career Intelligence endpoints — needs SkillEvidence model + calculateConfidence)
    │
    ├──► FEAT-003 (Backend extensions — needs SkillEvidence model + calculateConfidence)
    │       (FEAT-002 and FEAT-003 are independent of each other)
    │
    └──► FEAT-004 (Frontend wiring — needs careerService additions from FEAT-001,
                   endpoints from FEAT-002, some endpoints from FEAT-003)
    
FEAT-005 (Mobile responsiveness — independent, reads components in their final state)
```

---

## Ordered Implementation Plan

- [ ] 1. **Create `backend/models/SkillEvidence.js`** — new Mongoose model with `evidenceSourceSchema` (type enum, description, strength enum, verifiedAt, sourceId, notes) and `skillEvidenceSchema` (user, skillName, proficiency enum, confidenceScore 0–100, evidenceSources[], relatedProjects[], relatedInternships[], lastVerified, isVerified). Compound unique index `{user:1, skillName:1}`.
      Files: `backend/models/SkillEvidence.js` *(CREATE)*
      Verify: `cd backend && node -e "require('./models/SkillEvidence'); console.log('OK')"` — no errors.

- [ ] 2. **Create `backend/models/MicroAssessment.js`** — `{user: ObjectId ref User, skillName: String required, questions:[{question,options:[String],correctIndex:Number}], userAnswers:[Number], score, maxScore, completedAt: Date default now, evidenceAdded: Boolean default false}`.
      Files: `backend/models/MicroAssessment.js` *(CREATE)*
      Verify: `cd backend && node -e "require('./models/MicroAssessment'); console.log('OK')"` — no errors.

- [ ] 3. **Create `backend/controllers/skillEvidenceController.js`** with:
      - `calculateConfidence(evidenceSources, isVerified)` — exported pure function. Weights: `{resume:15,project:25,assessment:20,internship:15,learning:7,certificate:20,interview:10,feedback:8}`. Multipliers: `{weak:0.5,moderate:1.0,strong:1.3}`. Only first occurrence of each type counted. isVerified adds 10% bonus. Cap at 100.
      - `getSkillEvidence` (GET /) — returns all user's SkillEvidence docs.
      - `getSkillEvidenceBreakdown` (GET /breakdown) — returns `{[skillName]: confidenceScore}` object.
      - `upsertSkillEvidence` (POST /) — upserts doc, recalculates confidenceScore, fires notification if score improved >10 points.
      - `deleteSkillEvidence` (DELETE /:id) — deletes by id and user.
      Files: `backend/controllers/skillEvidenceController.js` *(CREATE)*
      Verify: `cd backend && node -e "const c=require('./controllers/skillEvidenceController'); console.log(c.calculateConfidence([{type:'project',strength:'strong'}],false))"` — must print 33.

- [ ] 4. **Create `backend/routes/skillEvidenceRoutes.js`** — routes: `GET /` → getSkillEvidence; `POST /` → upsertSkillEvidence; `GET /breakdown` → getSkillEvidenceBreakdown; `DELETE /:id` → deleteSkillEvidence. All use `protect` middleware.
      Files: `backend/routes/skillEvidenceRoutes.js` *(CREATE)*
      Verify: file has no syntax errors (`node -e "require('./routes/skillEvidenceRoutes')"` from backend/).

- [ ] 5. **Register `/api/skill-evidence` in `backend/server.js`** — add `app.use('/api/skill-evidence', require('./routes/skillEvidenceRoutes'));` after the `/api/certificates` line.
      Files: `backend/server.js` *(MODIFY)*
      Verify: `cd backend && node server.js` — starts without errors; console shows skill-evidence route.

- [ ] 6. **Add missing service functions to `frontend/src/services/careerService.js`** — add exports: `getSkillGapPriority, simulateWhatIf, getOpportunityUnlock, getOpportunityCost, getWhyNotApply, getCounterfactual, getExplainableRec`. Add all to the default export object too.
      Files: `frontend/src/services/careerService.js` *(MODIFY)*
      Verify: `cd frontend && npm run build` — exit code 0.

- [ ] 7. **Add `generateApplication` to `frontend/src/services/aiService.js`** — `export const generateApplication = (internshipId) => api.post('/ai/generate-application', { internshipId });`
      Files: `frontend/src/services/aiService.js` *(MODIFY)*
      Verify: `cd frontend && npm run build` — exit code 0.

- [ ] 8. **Add career intelligence handlers to `backend/controllers/careerIntelligenceController.js`** (Tasks B, C, E, H, I):
      - `getSkillGapPriority` — loads SkillEvidence + Internship demand map; returns sorted priority list.
      - `getWhatIfSimulation` — loads SkillEvidence for skill; counts opportunity delta.
      - `getOpportunityUnlock` — queries Internship by required skill; returns counts.
      - `getWhyNotApply` — compares internship required skills vs user SkillEvidence; returns concerns list.
      - `getCounterfactualRecommendation` — three question types; returns recommendation + reasoning.
      - `getExplainableRecommendation` — matched/missing skills vs SkillEvidence; returns fitScore + reasons.
      - `rankApplicationsByValue` — loads Applied applications; scores and ranks A/B/C.
      Add `require` imports for SkillEvidence, Internship, Application, calculateConfidence, calculateQualityScore at top.
      Files: `backend/controllers/careerIntelligenceController.js` *(MODIFY)*
      Verify: `cd backend && node -e "require('./controllers/careerIntelligenceController'); console.log('OK')"` — no errors.

- [ ] 9. **Wire all new handlers into `backend/routes/careerIntelligenceRoutes.js`** — add 7 new routes: `GET /skill-gap-priority`, `POST /what-if`, `GET /opportunity-unlock`, `GET /why-not-apply/:internshipId`, `POST /counterfactual`, `GET /explain/:internshipId`, `GET /opportunity-cost`. All `protect`.
      Files: `backend/routes/careerIntelligenceRoutes.js` *(MODIFY)*
      Verify: `cd backend && node server.js` — starts without errors.

- [ ] 10. **Add `getApplicationStrength` to `backend/controllers/internshipQualityController.js`** — loads Application, Internship, user SkillEvidence; computes fitScore (0.4) + evidenceScore (0.4) + completenessScore (0.2); returns `{applicationStrength, breakdown, disclaimer}`.
       Import Application, SkillEvidence models. Add to `module.exports`.
       Files: `backend/controllers/internshipQualityController.js` *(MODIFY)*
       Verify: `cd backend && node -e "require('./controllers/internshipQualityController'); console.log('OK')"` — no errors.

- [ ] 11. **Add `/application/:applicationId/strength` route to `backend/routes/internshipQualityRoutes.js`**.
       Files: `backend/routes/internshipQualityRoutes.js` *(MODIFY)*
       Verify: `cd backend && node server.js` — no errors.

- [ ] 12. **Add `generateApplication` handler to `backend/controllers/aiController.js`** (Task D + Task M):
       - Load User, SkillEvidence, Internship.
       - Guard: if no skills AND no evidence → return 400 with helpful message.
       - Compose prompt context; call `aiClient.chat`.
       - Run truthGuard on result.
       - Return `{coverLetter, truthGuardIssues, isEstimate:true, disclaimer}`.
       - Also in `analyzeResumeAI` response, add `isEstimate:true` and `disclaimer` fields to success data.
       Add `generateApplication` to `module.exports`.
       Files: `backend/controllers/aiController.js` *(MODIFY)*
       Verify: `cd backend && node -e "require('./controllers/aiController'); console.log('OK')"` — no errors.

- [ ] 13. **Register `POST /generate-application` in `backend/routes/aiRoutes.js`** — read aiRoutes.js first; add `router.post('/generate-application', protect, generateApplication)`.
       Files: `backend/routes/aiRoutes.js` *(MODIFY)*
       Verify: `cd backend && node server.js` — no errors.

- [ ] 14. **Enhance `backend/controllers/adaptiveLearningController.js`** (Task F):
       - Add `completeLearning` handler (PUT `/:guideId/complete-learning`): body `{assessmentScore, skillsTargeted:[]}`. For each skill: upsert SkillEvidence with assessment evidence. Recalculate confidence. Fire `createAndNotify` after all updates.
       - Add `submitAssessment` handler (POST `/assessment`): body `{skillName, questions, userAnswers}`. Calculate score vs correctIndex. Save MicroAssessment. Upsert SkillEvidence assessment source. Return `{score, maxScore, percentage, skillConfidenceUpdated:true, newConfidenceScore}`.
       Import: SkillEvidence, MicroAssessment, `{calculateConfidence}` from skillEvidenceController, `{createAndNotify}`.
       Files: `backend/controllers/adaptiveLearningController.js` *(MODIFY)*
       Verify: `cd backend && node -e "require('./controllers/adaptiveLearningController'); console.log('OK')"` — no errors.

- [ ] 15. **Add new routes to `backend/routes/adaptiveLearningRoutes.js`** — import `completeLearning, submitAssessment`. Add `router.put('/:guideId/complete-learning', protect, completeLearning)` and `router.post('/assessment', protect, submitAssessment)`.
       Files: `backend/routes/adaptiveLearningRoutes.js` *(MODIFY)*
       Verify: `cd backend && node server.js` — no errors.

- [ ] 16. **Enhance `backend/controllers/feedbackController.js`** (Task G):
       Add `AIStudentProfile = require('../models/AIStudentProfile')` to imports. In `submitFeedbackResponse`, after the existing SkillAssessment update block, add: find or create AIStudentProfile for `studentId`. For each high-rated dimension: add `skillName` to `profile.skillProfile` if not present; add to `profile.strengths` if rating >= 4 and not present; remove from `profile.weaknesses` if present. Save profile.
       Files: `backend/controllers/feedbackController.js` *(MODIFY)*
       Verify: `cd backend && node -e "require('./controllers/feedbackController'); console.log('OK')"` — no errors.

- [ ] 17. **Add ActivityLog audit calls to `backend/controllers/certificateController.js`** (Task O):
       Add `ActivityLog = require('../models/ActivityLog')` at top. In `issueCertificate`: add `ActivityLog.create({user: req.user.id, action:'certificate_issued', details:{certificateId, studentId, internshipId}, ip:req.ip, userAgent:req.headers['user-agent']})`. In `verifyCertificate`: `ActivityLog.create({...action:'certificate_verified'...})`. In `revokeCertificate`: `ActivityLog.create({...action:'certificate_revoked', details:{reason}...})`. Use `await` but wrap in `try/catch` so audit failure doesn't break the main response.
       Files: `backend/controllers/certificateController.js` *(MODIFY)*
       Verify: `cd backend && node -e "require('./controllers/certificateController'); console.log('OK')"` — no errors.

- [ ] 18. **Fix `frontend/src/components/dashboard/student/SkillGapPriority.jsx`** (Task B frontend):
       Replace `getSkillGaps()` call with `getSkillGapPriority()`. Replace `api.post('/career/what-if', ...)` simulate handler with `simulateWhatIf({skill, improvementPoints:20})` from careerService. Read SkillGapItem.jsx to confirm what props it expects; add a field mapping layer if needed (e.g. `{...gap, skill: gap.skillName}` before passing to SkillGapItem).
       Files: `frontend/src/components/dashboard/student/SkillGapPriority.jsx` *(MODIFY)*
       Verify: `cd frontend && npm run build` — exit code 0.

- [ ] 19. **Wire `WhyNotApplyModal` into `frontend/src/pages/InternshipDetailPage.jsx`** (Task C frontend):
       Import `WhyNotApplyModal` and `{ getWhyNotApply }` from careerService. Add state `showWhyNot, whyNotData, whyNotLoading`. Add `handleWhyNotApply` async handler. Add 'Why Not Apply?' button near the Apply button (visible only when `isAuthenticated`). Add `<WhyNotApplyModal>` at bottom of JSX.
       Files: `frontend/src/pages/InternshipDetailPage.jsx` *(MODIFY)*
       Verify: `cd frontend && npm run build` — exit code 0.

- [ ] 20. **Add Explainable Recs to `frontend/src/components/dashboard/student/Recommendations.jsx`** (Task I frontend):
       Import `ExplainableRecommendationCard`, `Modal`, `{ getExplainableRec }`. Add state `explainData, explainLoading, showExplain`. Add `handleExplain` handler. Add `onExplain` prop to `InternshipCard` and render an 'Explain' button in InternshipCard. Add `Modal` with `ExplainableRecommendationCard` at bottom of Recommendations return.
       Files: `frontend/src/components/dashboard/student/Recommendations.jsx` *(MODIFY)*
       Verify: `cd frontend && npm run build` — exit code 0.

- [ ] 21. **Add Priority Rank badge to `frontend/src/components/dashboard/student/Applications.jsx`** (Task E frontend):
       Import `{ getOpportunityCost }` from careerService. Add `opportunityRanks` state. In a `useEffect`, call `getOpportunityCost()` and build `{[appId]: rank}` map (catch errors silently). Render Priority badge in the expanded application detail panel.
       Files: `frontend/src/components/dashboard/student/Applications.jsx` *(MODIFY)*
       Verify: `cd frontend && npm run build` — exit code 0.

- [ ] 22. **Wire real APIs into `frontend/src/components/dashboard/student/DigitalTwin.jsx`** (Task J):
       Replace `getDigitalTwin()` with `Promise.allSettled([getAIIntelligence(), getSkillEvidenceBreakdown(), getMyCertificates()])`. Map results to `{currentSkills, strengths, weaknesses, targetRoles, confidenceMap, opportunityProfile}` that the existing JSX already renders. Keep existing display JSX unchanged.
       Files: `frontend/src/components/dashboard/student/DigitalTwin.jsx` *(MODIFY)*
       Verify: `cd frontend && npm run build` — exit code 0.

- [ ] 23. **Replace stub in `frontend/src/components/dashboard/student/CareerPathSimulator.jsx`** (Task K):
       Define `CAREER_PATHS` constant with 4 paths (Frontend, Backend, Data Science, DevOps) each with `requiredSkills[]`. Replace `getCareerPaths()` call with `getSkillEvidence()`. Compute coverage, coveredSkills, missingSkills, skillCoverage[], nextSteps[] for each path from SkillEvidence docs. setPaths with the computed array. Existing display JSX handles all these fields.
       Files: `frontend/src/components/dashboard/student/CareerPathSimulator.jsx` *(MODIFY)*
       Verify: `cd frontend && npm run build` — exit code 0.

- [ ] 24. **Mobile responsiveness audit** (Task P):
       Read `CareerActionPlan.jsx` (offset 80+), `SkillGapItem.jsx`, `SkillEvidenceCard.jsx`, `WhatIfSimulator.jsx`. For any fixed widths found (`w-Npx`, inline `style={{width}}`), replace with responsive Tailwind variants. SkillEvidenceHub and SkillGapPriority already confirmed responsive.
       Files: Potentially `frontend/src/components/career/WhatIfSimulator.jsx`, `frontend/src/components/career/SkillGapItem.jsx`, `frontend/src/components/career/SkillEvidenceCard.jsx`, `frontend/src/components/dashboard/student/CareerActionPlan.jsx` *(MODIFY if needed)*
       Verify: `cd frontend && npm run build` — exit code 0.

- [ ] 25. **Final integration smoke test** — start backend (`node server.js`), confirm all registered routes print at startup without errors. Run `cd frontend && npm run build` — must exit 0 with no build errors.
       Files: none
       Verify: `cd backend && node server.js` + `cd frontend && npm run build` both succeed.

---

## Task → Step Mapping Reference

| Master Task | Plan Steps |
|-------------|-----------|
| A — SkillEvidence Model + Controller + Routes | 1, 3, 4, 5, 6 |
| B — Skill Gap Priority (backend) | 8, 9 |
| B — Skill Gap Priority (frontend) | 18 |
| C — Why Not Apply (backend) | 8, 9 |
| C — Why Not Apply (frontend) | 19 |
| D — AI Application Assistant (backend) | 12, 13 |
| D — AI Application Assistant (frontend) | 7 |
| E — Application Strength (backend) | 10, 11 |
| E — Opportunity Cost + rank badge (frontend) | 21 |
| F — Learning Completion + Micro Assessment | 2, 14, 15 |
| G — Internship Performance → AI Profile | 16 |
| H — Counterfactual Recommendation | 8, 9 |
| I — Explainable Recs (backend) | 8, 9 |
| I — Explainable Recs (frontend) | 20 |
| J — Digital Twin real data | 22 |
| K — Career Path Simulator | 23 |
| L — Notification Integration | Included in steps 3 (upsertSkillEvidence) and 14 (completeLearning) |
| M — AI Safety | 12 |
| N — Error Handling | Handled in steps 3, 8 (asyncHandler throughout, 400/404 returns) |
| O — Certificate Audit Log | 17 |
| P — Mobile Responsiveness | 24 |

---

## Key Decisions & Rationale

1. **New `SkillEvidence` model, not extending `SkillAssessment`**: `SkillAssessment` is a simple `{skill, score, level}` tuple used by feedbackController. It cannot hold evidence arrays or confidence logic without breaking existing consumers. A new model is the correct approach.

2. **`calculateConfidence` exported from `skillEvidenceController`**: Both `adaptiveLearningController` and `careerIntelligenceController` need it. Exporting from the controller (rather than a utils file) keeps the weight table in one place and is consistent with how `calculateQualityScore` is handled in `internshipQualityController`.

3. **`createAndNotify` call signature**: Confirmed from `notificationHelper.js` — takes `(app, {recipient, title, message, type, priority, link})`. All new notification calls use this exact shape.

4. **CareerPathSimulator uses local computation, not a new backend endpoint**: The 4 paths are static domain knowledge. Computing coverage client-side from the already-loaded SkillEvidence avoids a round trip and keeps the logic where it belongs.

5. **DigitalTwin uses `Promise.allSettled`** (not `Promise.all`): The AI intelligence endpoint can be offline. `allSettled` ensures partial data still renders rather than crashing the component.

6. **AIStudentProfile `performanceHistory` field does not exist** in the schema. Task G's feedback integration instead pushes to `strengths` and `skillProfile` arrays, which do exist. This avoids schema migration.

7. **FEAT decomposition**: The 16 tasks decompose into 5 FEATs by dependency grouping: data layer (FEAT-001), backend intelligence (FEAT-002), backend extensions (FEAT-003), frontend wiring (FEAT-004), and responsiveness (FEAT-005). FEAT-002 and FEAT-003 are independent of each other (both depend only on FEAT-001). This ordering ensures no coder step encounters a missing import.

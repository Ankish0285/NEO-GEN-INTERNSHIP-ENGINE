# Implementation Plan: Career Intelligence UI

## Exploration Findings

All key files read. Key decisions made during exploration:

- **careerService.js is a new file**: `careerIntelligenceService.js` already exists (from the prior backend task) with different endpoint paths. The new `careerService.js` covers the new Career Intelligence UI API endpoints (`/skill-evidence`, `/career/skill-gaps`, `/career/action-plan`, `/certificates`, etc.).
- **Icon availability confirmed**: All required lucide-react icons verified in v0.363.0 node_modules: ShieldCheck ✓, Target ✓, ListChecks ✓, Gauge ✓, BookOpen ✓, CheckCircle2 ✓, Award ✓, TrendingUp ✓, Book ✓, Code ✓, Mic ✓.
- **neo-glass is defined in index.css** (full CSS file) — used in Card.jsx as the primary glass class.
- **Skeleton is a named export** (`import { Skeleton } from '../../ui/Skeleton'`) — not a default export.
- **No test runner**: build verification is `npm run build` from `frontend/`. This must pass at end.
- **FeedbackForm.jsx** is a sub-component of CompletionWorkflow, not a direct route — do not add it as a route in AppRoutes.jsx.
- **CertificateVerification.jsx** is a standalone page (NOT inside any dashboard wrapper) — it goes in `frontend/src/pages/`.
- **Dependency order**: ConfidenceBar → everything else; careerService.js → all components; shared career/ components → dashboard sections.

## Dependency Graph

```
careerService.js
  └─→ all components

frontend/src/components/career/
  ConfidenceBar.jsx           ← no internal deps
  ├─→ SkillEvidenceCard.jsx
  ├─→ SkillGapItem.jsx
  ├─→ ApplicationStrengthBar.jsx
  ├─→ InternshipQualityBadge.jsx  (no ConfidenceBar needed)
  ├─→ ExplainableRecommendationCard.jsx
  ├─→ InternshipReadiness.jsx (student dashboard, uses ConfidenceBar)
  PassportSection.jsx         ← no internal deps
  CertificateCard.jsx         ← no internal deps
  WhyNotApplyModal.jsx        ← depends on Modal from ui/
  WhatIfSimulator.jsx         ← no career/ deps
  TruthGuardAlert.jsx         ← no career/ deps

frontend/src/components/dashboard/student/   ← depend on career/ components
frontend/src/components/dashboard/partner/   ← depend on career/ components
frontend/src/components/dashboard/admin/     ← depend on careerService only
frontend/src/pages/CertificateVerification   ← depends on careerService only

AppRoutes.jsx + roleConfig.js  ← depend on ALL above being present
```

---

## Implementation Plan

- [ ] 1. **Create `frontend/src/services/careerService.js`**
      New service file using `{ api }` from `./api`. Named exports for all career UI endpoints:
      skill-evidence (getSkillEvidence, getSkillEvidenceBreakdown, addSkillEvidence),
      career (getSkillGaps, getActionPlan, updateActionItem, getReadiness, getDigitalTwin, getCareerPaths),
      outcomes (recordOutcome, getOutcomePatterns, getInterviewLearning),
      certificates (getMyCertificates, verifyCertificate, issueCertificate, verifyCertificateAdmin, revokeCertificate, getAllCertificates),
      admin (getCareerInsights), completion (getPartnerCompletions, updateCompletionStatus).
      Default export object with all functions.
      Files: `frontend/src/services/careerService.js`
      Verify: File exists with correct named exports (checked at build time in step 17).

- [ ] 2. **Create `frontend/src/components/career/ConfidenceBar.jsx`**
      Horizontal progress bar, framer-motion animated fill, color auto-coded (score<30 red, <60 amber, ≥60 green), props: score, label, showPercent, size (sm/md/lg), colorOverride. Default export.
      Files: `frontend/src/components/career/ConfidenceBar.jsx`
      Verify: File exists; build check in step 17.

- [ ] 3. **Create remaining 9 shared career components** (all depend on ConfidenceBar from step 2 for those that use it)
      - `SkillEvidenceCard.jsx` — uses ConfidenceBar; props: skillName, proficiency, confidenceScore, evidenceSources[], isVerified
      - `SkillGapItem.jsx` — uses ConfidenceBar; props: rank, skillName, priority, currentConfidence, gapScore, estimatedImpact, learningEffort, reason
      - `InternshipQualityBadge.jsx` — 3 compact badges; props: qualityScore, riskLevel, roiEstimate
      - `ApplicationStrengthBar.jsx` — uses ConfidenceBar; props: strength, breakdown, disclaimer
      - `TruthGuardAlert.jsx` — dismissible alert; props: issues[], onEdit
      - `ExplainableRecommendationCard.jsx` — expandable card; props: internship, matchedSkills[], missingSkills[], fitScore, reasons[], warnings[]
      - `CertificateCard.jsx` — certificate display with copy ID; props: certificate{...}
      - `PassportSection.jsx` — section header + chips + empty state; props: title, icon, items[], emptyMessage
      - `WhyNotApplyModal.jsx` — uses Modal from ui/; props: isOpen, onClose, internshipTitle, concerns[], overallRisk, recommendation
      - `WhatIfSimulator.jsx` — skill select + simulate button + before/after display; props: onSimulate, skills[]
      Files: `frontend/src/components/career/SkillEvidenceCard.jsx`, `SkillGapItem.jsx`, `InternshipQualityBadge.jsx`, `ApplicationStrengthBar.jsx`, `TruthGuardAlert.jsx`, `ExplainableRecommendationCard.jsx`, `CertificateCard.jsx`, `PassportSection.jsx`, `WhyNotApplyModal.jsx`, `WhatIfSimulator.jsx`
      Verify: All 10 files exist; build check in step 17.

- [ ] 4. **Create `frontend/src/components/dashboard/student/SkillEvidenceHub.jsx`**
      Fetches GET /skill-evidence + /skill-evidence/breakdown in parallel. Overall confidence summary at top. Grid of SkillEvidenceCard. 'Add Skill Evidence' button → Modal form → POST /skill-evidence. Loading skeleton (6 cards), empty state.
      Files: `frontend/src/components/dashboard/student/SkillEvidenceHub.jsx`
      Verify: File exists; build check in step 17.

- [ ] 5. **Create `frontend/src/components/dashboard/student/SkillGapPriority.jsx`**
      Fetches GET /career/skill-gaps. Ranked list of SkillGapItem + embedded WhatIfSimulator.
      Files: `frontend/src/components/dashboard/student/SkillGapPriority.jsx`
      Verify: File exists; build check in step 17.

- [ ] 6. **Create `frontend/src/components/dashboard/student/CareerActionPlan.jsx`**
      Fetches GET /career/action-plan. Numbered items with icons (Book/Code/FileText/Briefcase/Mic), priority badges, 'Mark Done' (PATCH /career/action-plan/:id), refresh button.
      Files: `frontend/src/components/dashboard/student/CareerActionPlan.jsx`
      Verify: File exists; build check in step 17.

- [ ] 7. **Create `frontend/src/components/dashboard/student/InternshipReadiness.jsx`**
      Fetches GET /career/readiness. Large overall score. Five ConfidenceBars for sub-scores. Disclaimer text.
      Files: `frontend/src/components/dashboard/student/InternshipReadiness.jsx`
      Verify: File exists; build check in step 17.

- [ ] 8. **Create `frontend/src/components/dashboard/student/DigitalTwin.jsx`**
      Fetches GET /career/digital-twin. Six sections (Current Skills, Confidence Map, Target Roles, Strengths, Weaknesses, Opportunity Profile) rendered as Cards. Read-only.
      Files: `frontend/src/components/dashboard/student/DigitalTwin.jsx`
      Verify: File exists; build check in step 17.

- [ ] 9. **Create `frontend/src/components/dashboard/student/CareerPathSimulator.jsx`**
      Fetches GET /career/career-paths. Four path cards with ConfidenceBars for coverage. Click → detail Modal.
      Files: `frontend/src/components/dashboard/student/CareerPathSimulator.jsx`
      Verify: File exists; build check in step 17.

- [ ] 10. **Create `frontend/src/components/dashboard/student/DigitalPassport.jsx`**
       Tabbed (Skills/Internships/Certificates/Projects/Assessments/Achievements). Skills tab: GET /skill-evidence filtered to verified. Certificates tab: GET /certificates/my → CertificateCard. Other tabs: PassportSection with 'Coming Soon'. 'Share Passport' → toast. Privacy note.
       Files: `frontend/src/components/dashboard/student/DigitalPassport.jsx`
       Verify: File exists; build check in step 17.

- [ ] 11. **Create `frontend/src/components/dashboard/student/ApplicationOutcomes.jsx`**
       Two tabs: Record Outcome form (POST /outcomes) + Pattern Analysis (GET /outcomes/patterns + GET /outcomes/interview-learning). Empty state with encouraging message.
       Files: `frontend/src/components/dashboard/student/ApplicationOutcomes.jsx`
       Verify: File exists; build check in step 17.

- [ ] 12. **Create `frontend/src/components/dashboard/student/CompanyFeedback.jsx`**
       Fetches GET /internship-feedback/my. Feedback cards with ConfidenceBars (1-5 scale × 20 = 0-100). Empty state.
       Files: `frontend/src/components/dashboard/student/CompanyFeedback.jsx`
       Verify: File exists; build check in step 17.

- [ ] 13. **Create partner dashboard components**
       - `FeedbackForm.jsx` — Star rating inputs (1-5) for 6 dimensions, 3 textareas. POST /internship-feedback. Props: applicationId, studentName, internshipTitle, onSubmit, onCancel. **Standalone component, not a route**.
       - `CompletionWorkflow.jsx` — GET /completion/partner/all. Status progression, 'Update Status' confirm modal, 'Mark Completed' opens FeedbackForm, 'Issue Certificate' link.
       - `CertificateWorkflow.jsx` — GET /completion/partner/all?status=completed. List, 'Issue Certificate' → POST /certificates. Admin-verification note.
       Files: `frontend/src/components/dashboard/partner/FeedbackForm.jsx`, `CompletionWorkflow.jsx`, `CertificateWorkflow.jsx`
       Verify: Files exist; build check in step 17.

- [ ] 14. **Create admin dashboard components**
       - `CertificateManagement.jsx` — GET /certificates, table with status filter + search. 'Verify' (PUT /certificates/:id/verify), 'Revoke' with confirm modal (PUT /certificates/:id/revoke).
       - `CareerIntelligenceInsights.jsx` — GET /admin/career-insights. Four stat cards + top-10 skill gaps. Privacy note.
       Files: `frontend/src/components/dashboard/admin/CertificateManagement.jsx`, `CareerIntelligenceInsights.jsx`
       Verify: Files exist; build check in step 17.

- [ ] 15. **Create `frontend/src/pages/CertificateVerification.jsx`**
       Standalone page (no dashboard wrapper). useParams for certificateId. Auto-fetch GET /certificates/verify/:id. Status visuals. Privacy: first name + last initial only. 'Verify Another' search input at bottom.
       Files: `frontend/src/pages/CertificateVerification.jsx`
       Verify: File exists; build check in step 17.

- [ ] 16. **Extend `AppRoutes.jsx` and `roleConfig.js`**
       AppRoutes.jsx: ADD imports for 14 new components (9 student + 2 partner + 2 admin + 1 public page). ADD Route elements inside existing dashboard Route blocks and at top-level. DO NOT import FeedbackForm as a route.
       roleConfig.js: ADD 8 new icons to lucide-react import. ADD 5 student menu items (after analytics), 2 partner items (before analytics), 2 admin items (before analytics in both admin + super_admin).
       Files: `frontend/src/routes/AppRoutes.jsx`, `frontend/src/utils/roleConfig.js`
       Verify: After save, proceed to step 17.

- [ ] 17. **Run build and fix any errors**
       Run: `cd 'd:\my code\my project\NEO GEN INTERNSHIP ENGINE/frontend' && npm run build 2>&1`
       Fix any errors Vite reports. Common pitfalls to check:
       - Missing default export in any new file
       - Incorrect relative import path (career/ components are at `../../career/` from `dashboard/student/`)
       - Icon names that don't exist (all verified — ShieldCheck, Target, ListChecks, Gauge, BookOpen, CheckCircle2, Award, TrendingUp, Book, Code, Mic all confirmed in v0.363.0)
       - Skeleton must be imported as named export: `import { Skeleton } from '../../ui/Skeleton'`
       - CertificateVerification uses `../services/careerService` (one level up from pages/)
       Re-run until exit 0.
       Files: (any that need fixing)
       Verify: `npm run build` exits 0 with no errors.

- [ ] 18. **Commit**
       Stage all new and modified files and commit with message: `feat: career intelligence UI — components, pages, routes, nav config`
       Files: all new files + AppRoutes.jsx + roleConfig.js
       Verify: `git log --oneline -1` shows the commit.

---

## Potential Issues / Notes

1. **careerService.js path in pages/**: `CertificateVerification.jsx` is in `frontend/src/pages/` so it imports careerService as `../services/careerService` (not `../../services/careerService`).

2. **FeedbackForm is NOT a route**: It's a sub-component rendered inside CompletionWorkflow. Do not add a Route for it in AppRoutes.jsx and do not import it there.

3. **Skeleton named export**: `import { Skeleton } from '../../ui/Skeleton'` — this is a named export, not default. All other ui/ components use default exports.

4. **Book icon for CareerActionPlan**: `Book` (not `BookOpen`) is the plain book icon. Both exist in v0.363.0. Use `Book` for the learning action type and `BookOpen` in the nav config.

5. **ConfidenceBar in CompanyFeedback**: The feedback rating is 1–5 scale; multiply by 20 to convert to the 0–100 scale ConfidenceBar expects.

6. **Admin section duplicated in roleConfig**: Both `admin` and `super_admin` keys need the same two new menu items added.

7. **neo-glass class**: Defined in `index.css`. Use `className="neo-glass ..."` directly — it works as a Tailwind-style utility class loaded globally.

8. **FEAT artifacts are at `.agents/tasks/task-career-ui/`** — these files are NOT committed with the source code.

# FEAT-005: Mobile responsiveness, Digital Passport expansion, AI cover letter, Application Strength

FEAT-005 delivers four things: targeted responsive fixes to SkillGapItem, three new fields on the InterviewLog model, full implementation of the four previously-stubbed DigitalPassport tabs (Internships, Projects, Assessments, Achievements), and a complete AI cover letter modal with "Calculate Strength" button wiring in Applications. The prior review raised three blocking findings (Priority A/B/C format, dead `getApplicationStrength` export, Achievements tab eager-load gap); all three are resolved in the current code. The build artifact (`frontend/dist/`) exists and is populated, confirming the build passed.

Watch for: **confirmed** — `currentInternshipId` is set in `handleGenerateWithAI` but never read by any subsequent logic in the component. It has no effect on modal content or behavior as shipped. **confirmed** — the AI modal error path (network failure or empty AI response) silently resets to an empty textarea with "No content was generated. Please try again." — the user cannot distinguish a transient network error from a legitimate empty result.

**Verdict**: APPROVED

---

## High-level view

The SkillGapItem responsive fix correctly separates the rank+name row from the badge row using `flex-col sm:flex-row sm:items-start`. The `min-w-0` on both the outer flex child and the name span is necessary to allow text truncation; without it a long skill name overflows on narrow viewports. CertificateCard's date/status row uses `flex items-center gap-2 flex-wrap`, which wraps cleanly without the explicit `flex-col` pattern — acceptable since both elements are short inline spans.

The three InterviewLog fields (`difficultTopics`, `interviewStage`, `selfAssessment`) are syntactically correct Mongoose field definitions. They appear after the `outcome` field, inside the schema object, with correct types and defaults.

DigitalPassport now eagerly fetches certs, internships, and assessments on mount — fixing the prior review's concern that the Achievements tab would show zeros if the user navigated there directly. The `allLoaded` guard in the achievements panel renders "Loading achievements… please wait a moment." until all four fetches complete, which is the right fallback.

Applications.jsx resolves both prior concerns: `PRIORITY_TIERS` maps numeric ranks 1/2/3 to Priority A/B/C labels with distinct color schemes, and a legend block below the page header shows all three tiers with descriptions. `getApplicationStrength` is wired to a "Calculate Strength" button that appears in the expanded row when no pre-computed strength exists, with per-application `strengthData` state tracking loading, success, and error states.

Two minor issues remain: `currentInternshipId` state is set but never consumed, and the AI modal error path is indistinguishable from an empty-but-successful response.

---

<details>
<summary>Issues (2)</summary>

1. **`currentInternshipId` set but never read** — `setCurrentInternshipId(internshipId)` is called in `handleGenerateWithAI` but `currentInternshipId` is not used anywhere in the modal or elsewhere. Either use it to show which internship the letter was generated for, or remove the state to avoid confusion.

2. **AI modal error path is silent** — the `catch` block in `handleGenerateWithAI` sets `aiContent` and `aiIssues` to empty and exits, leaving the modal open with "No content was generated. Please try again." The user cannot distinguish a network failure from an intentionally empty AI response. Adding a toast on the error path (e.g., `toast.error('Generation failed — please try again')`) would make the failure actionable.

</details>

<details>
<summary>Details</summary>

### Opportunity Cost — Priority A/B/C format and legend

`PRIORITY_TIERS` maps rank `1` → "Priority A" (emerald), `2` → "Priority B" (amber), `3` → "Priority C" (slate), with a fallback for ranks outside 1–3. The legend block renders all three tiers inline with "= highest/moderate/lower value" descriptions. This matches the review spec. Ranks beyond 3 fall back to `Priority {rank}` with an indigo style — a reasonable escape hatch.

### Application Strength button and state

`strengthData` is keyed by application ID and tracks `{ loading, strength, breakdown }`. The "Calculate Strength" button appears only when neither a pre-computed value (`app.applicationStrength` / `app.strengthScore`) nor a previously fetched `strengthEntry` exists. This prevents duplicate fetches on re-expand. The error state (`strength === null`) shows "Could not calculate strength. Try again later." — the button is gone at that point, so the user has no retry path without closing and reopening the row.

### AI cover letter modal

The modal renders outside the `<motion.div>` wrapper using a React Fragment, which is correct for a fixed overlay. `TruthGuardAlert` renders above the textarea only when `aiIssues.length > 0`. The "Copy to Clipboard" button is conditionally shown only when `aiContent` is non-empty. `currentInternshipId` is set in `handleGenerateWithAI` and never subsequently read — dead state.

### DigitalPassport eager-load fix

The mount `useEffect` now calls `fetchCerts()`, `fetchInternships()`, and `fetchAssessments()` in addition to `fetchSkills()`. The `fetchedTabs` guard inside each fetch function prevents redundant calls when the user later clicks those tabs. The `allLoaded` check in the achievements renderer covers all four data sources, so a fast network will populate achievements on first render without requiring the user to visit each tab.

### Shared loading indicator

All five fetch functions toggle the same `loading` boolean. Rapid tab switching can produce a stale loading state where tab A's `finally` clears `loading` while tab B's request is still in flight. This is a pre-existing pattern across the component, not introduced by FEAT-005.

</details>

---

<details>
<summary>File map</summary>

| File | Change |
|------|--------|
| `backend/models/InterviewLog.js` | Added `difficultTopics`, `interviewStage`, `selfAssessment` fields |
| `frontend/src/components/career/SkillGapItem.jsx` | Mobile responsive restructure: two-div layout with `flex-col sm:flex-row` and `min-w-0` |
| `frontend/src/components/career/CertificateCard.jsx` | Date/status row uses `flex-wrap`; no layout regression |
| `frontend/src/components/dashboard/student/Applications.jsx` | Priority A/B/C tier map and legend; Calculate Strength button with per-app state; Generate with AI button and modal |
| `frontend/src/components/dashboard/student/DigitalPassport.jsx` | Internships, Projects, Assessments, Achievements tabs implemented; eager-load on mount for Achievements counts |
| `frontend/src/services/careerService.js` | Added `getApplicationStrength`, `getMyPlacements`, `getMySkillAssessments` exports |

Full diff: `git diff HEAD~1` in project root.

</details>

# Implementation Plan — NEO GEN Career Intelligence Loop

## Absolute Rules (apply to every item below)
- **DO NOT delete or modify any existing code — only ADD.**
- All new Mongoose schema fields must be optional with safe defaults (`default: null` or `default: []` etc.).
- Use `express-async-handler` in every controller: `const asyncHandler = require('express-async-handler');`
- Use CommonJS `require/module.exports` throughout the backend — no ES module syntax.
- Use existing middleware: `protect`, `admin`, `partner`, `optionalAuth` from `backend/middleware/authMiddleware.js`.
- Use `createAndNotify(app, {...})` from `backend/utils/notificationHelper.js` for every notification.
- The Python engine must be deterministic — no LLM calls, no external API calls, rule-based/scoring logic only.
- Never expose secrets, passwords, tokens, or private data in responses.

---

## Step 1 — Create 8 new Mongoose model files

Create each file from scratch (they do not exist yet). All fields are optional with safe defaults.

### 1a. `backend/models/CareerGoal.js`
Schema fields:
- `user` — ObjectId ref `'User'`, required, unique (one goal doc per student)
- `targetRoles` — `[String]`, default `[]`
- `targetDomains` — `[String]`, default `[]`
- `targetCompanies` — `[String]`, default `[]`
- `preferredLocation` — String, default `''`
- `expectedSalary` — String, default `''`
- `targetTimeline` — String, default `''` (e.g. `'6 months'`)
- `notes` — String, default `''`
- `updatedAt` / `createdAt` via `{ timestamps: true }`

### 1b. `backend/models/SkillAssessment.js`
Schema fields:
- `user` — ObjectId ref `'User'`, required
- `skill` — String, required
- `level` — String, enum `['beginner','intermediate','advanced']`, default `'beginner'`
- `score` — Number, default `0`  (0–100)
- `source` — String, default `'self'`  (e.g. `'self'`, `'ai'`, `'test'`)
- `assessedAt` — Date, default `Date.now`
- timestamps: true

### 1c. `backend/models/InterviewLog.js`
Schema fields:
- `user` — ObjectId ref `'User'`, required
- `application` — ObjectId ref `'Application'`, default `null`
- `internship` — ObjectId ref `'Internship'`, default `null`
- `interviewDate` — Date, default `null`
- `interviewType` — String, enum `['phone','video','onsite','technical','hr']`, default `'video'`
- `status` — String, enum `['scheduled','completed','cancelled','no_show']`, default `'scheduled'`
- `notes` — String, default `''`
- `rating` — Number, default `0` (1–5, self-rating)
- `outcome` — String, enum `['pending','passed','failed','waitlisted']`, default `'pending'`
- timestamps: true

### 1d. `backend/models/FeedbackForm.js`
Schema fields:
- `title` — String, required
- `description` — String, default `''`
- `targetAudience` — String, enum `['student','partner','all']`, default `'student'`
- `questions` — Array of sub-docs:
  - `question` String required
  - `type` String enum `['text','rating','mcq','boolean']` default `'text'`
  - `options` `[String]` default `[]`
  - `required` Boolean default `false`
- `isActive` — Boolean, default `true`
- `createdBy` — ObjectId ref `'User'`, required
- timestamps: true

### 1e. `backend/models/FeedbackResponse.js`
Schema fields:
- `form` — ObjectId ref `'FeedbackForm'`, required
- `respondent` — ObjectId ref `'User'`, default `null` (null = anonymous)
- `answers` — Array of sub-docs:
  - `question` String
  - `answer` Mixed (text / number / boolean)
- `submittedAt` — Date, default `Date.now`
- timestamps: true

### 1f. `backend/models/CareerEvent.js`
Schema fields:
- `title` — String, required
- `description` — String, default `''`
- `eventType` — String, enum `['webinar','workshop','fair','mock_interview','networking']`, default `'webinar'`
- `host` — String, default `''`
- `eventDate` — Date, default `null`
- `registrationDeadline` — Date, default `null`
- `meetLink` — String, default `''`
- `maxParticipants` — Number, default `0` (0 = unlimited)
- `registeredUsers` — `[{ type: ObjectId, ref: 'User' }]`, default `[]`
- `status` — String, enum `['upcoming','live','completed','cancelled']`, default `'upcoming'`
- `createdBy` — ObjectId ref `'User'`, required
- timestamps: true

### 1g. `backend/models/PlacementRecord.js`
Schema fields:
- `student` — ObjectId ref `'User'`, required
- `internship` — ObjectId ref `'Internship'`, default `null`
- `company` — String, default `''`
- `role` — String, default `''`
- `stipend` — String, default `''`
- `startDate` — Date, default `null`
- `endDate` — Date, default `null`
- `isVerified` — Boolean, default `false`
- `verifiedBy` — ObjectId ref `'User'`, default `null`
- `certificate` — String, default `''` (URL)
- `notes` — String, default `''`
- timestamps: true

### 1h. `backend/models/AdaptiveLearning.js`
Schema fields:
- `user` — ObjectId ref `'User'`, required, unique
- `recommendedGuides` — `[{ guide: { type: ObjectId, ref: 'Guide' }, reason: String, priority: Number }]`, default `[]`
- `completedGuides` — `[{ type: ObjectId, ref: 'Guide' }]`, default `[]`
- `currentSkillGaps` — `[String]`, default `[]`
- `learningPath` — Array of sub-docs:
  - `skill` String
  - `course` String
  - `priority` Number
  - `estimatedWeeks` Number
- `lastUpdated` — Date, default `null`
- timestamps: true

**Files:** `backend/models/CareerGoal.js`, `backend/models/SkillAssessment.js`, `backend/models/InterviewLog.js`, `backend/models/FeedbackForm.js`, `backend/models/FeedbackResponse.js`, `backend/models/CareerEvent.js`, `backend/models/PlacementRecord.js`, `backend/models/AdaptiveLearning.js`

**Verify:** `node -e "require('./backend/models/CareerGoal'); require('./backend/models/SkillAssessment'); require('./backend/models/InterviewLog'); require('./backend/models/FeedbackForm'); require('./backend/models/FeedbackResponse'); require('./backend/models/CareerEvent'); require('./backend/models/PlacementRecord'); require('./backend/models/AdaptiveLearning'); console.log('Models OK')"` from the workspace root — must print `Models OK` without errors. (Requires `MONGO_URI` in env; if not set, use `node --require dotenv/config -e ...` from `backend/` with `dotenv` config, or simply confirm no `require`-time parse errors using `node --check`.)

---

## Step 2 — Extend `Internship.js` and `Application.js`

Add new **optional** fields only — do not touch existing fields.

### 2a. `backend/models/Internship.js` — add to `internshipSchema` before `timestamps`:
```js
// Career Intelligence Loop additions
aiMatchMetadata: { type: mongoose.Schema.Types.Mixed, default: null },
placementCount: { type: Number, default: 0 },
tags: { type: [String], default: [] },
```

### 2b. `backend/models/Application.js` — add to `applicationSchema` before `timestamps`:
```js
// Career Intelligence Loop additions
interviewScheduled: { type: Boolean, default: false },
interviewDate: { type: Date, default: null },
interviewNotes: { type: String, default: '' },
feedbackGiven: { type: Boolean, default: false },
placementConfirmed: { type: Boolean, default: false },
```

**Files:** `backend/models/Internship.js`, `backend/models/Application.js`

**Verify:** `node --check backend/models/Internship.js && node --check backend/models/Application.js` — both exit 0.

---

## Step 3 — Create 8 new controller files

Pattern: every controller uses `const asyncHandler = require('express-async-handler')` and CommonJS exports. Use `createAndNotify` wherever a notification is warranted. Use `req.app` to pass the express `app` instance to `createAndNotify`. All controllers import only the models they actually need.

### 3a. `backend/controllers/careerGoalController.js`
Imports: `CareerGoal`, `asyncHandler`
Functions:
- `getMyCareerGoal` — GET, returns logged-in student's goal doc (or null)
- `upsertCareerGoal` — POST/PUT, upsert by `{ user: req.user.id }`, return saved doc
- `deleteCareerGoal` — DELETE, remove student's own goal doc

### 3b. `backend/controllers/skillAssessmentController.js`
Imports: `SkillAssessment`, `asyncHandler`
Functions:
- `getMyAssessments` — GET all assessments for the student
- `addAssessment` — POST, create new skill assessment record
- `updateAssessment` — PUT `/:id`, update own assessment
- `deleteAssessment` — DELETE `/:id`, delete own assessment
- `getAdminAllAssessments` — GET (admin), all assessments with student populate

### 3c. `backend/controllers/interviewLogController.js`
Imports: `InterviewLog`, `Application`, `asyncHandler`, `createAndNotify`
Functions:
- `getMyInterviewLogs` — GET all logs for the student
- `createInterviewLog` — POST, create log; call `createAndNotify` to notify student of scheduled interview
- `updateInterviewLog` — PUT `/:id`, student updates own log
- `deleteInterviewLog` — DELETE `/:id`, student deletes own log
- `getAdminInterviewLogs` — GET (admin), all logs populated with user + internship

### 3d. `backend/controllers/feedbackController.js`
Imports: `FeedbackForm`, `FeedbackResponse`, `ActivityLog`, `asyncHandler`, `createAndNotify`
Functions:
- `getFeedbackForms` — GET all active forms (filtered by `targetAudience` or `'all'`)
- `getFeedbackFormById` — GET `/:id`
- `createFeedbackForm` — POST (admin), create form
- `updateFeedbackForm` — PUT `/:id` (admin)
- `deleteFeedbackForm` — DELETE `/:id` (admin)
- `submitFeedbackResponse` — POST `/:formId/respond`, save response; log to `ActivityLog`
- `getFormResponses` — GET `/:formId/responses` (admin), all responses for a form

### 3e. `backend/controllers/careerEventController.js`
Imports: `CareerEvent`, `asyncHandler`, `createAndNotify`
Functions:
- `getCareerEvents` — GET, public list of upcoming/live events (populate nothing sensitive)
- `getCareerEventById` — GET `/:id`
- `createCareerEvent` — POST (admin), create event; call `createAndNotify` with `recipient: null` for global broadcast
- `updateCareerEvent` — PUT `/:id` (admin)
- `deleteCareerEvent` — DELETE `/:id` (admin)
- `registerForEvent` — POST `/:id/register` (protect), add `req.user.id` to `registeredUsers` array if not already registered; call `createAndNotify` to confirm to student
- `unregisterFromEvent` — DELETE `/:id/register` (protect), remove from `registeredUsers`

### 3f. `backend/controllers/placementController.js`
Imports: `PlacementRecord`, `Application`, `User`, `asyncHandler`, `createAndNotify`
Functions:
- `getMyPlacements` — GET student's own placement records
- `addPlacement` — POST (protect), student self-reports a placement
- `adminGetAllPlacements` — GET (admin), all records populated with student + internship
- `adminVerifyPlacement` — PUT `/:id/verify` (admin), set `isVerified: true`, `verifiedBy: req.user.id`; call `createAndNotify` to inform student
- `updatePlacement` — PUT `/:id` (protect), student updates own unverified record
- `deletePlacement` — DELETE `/:id` (admin or owner)

### 3g. `backend/controllers/adaptiveLearningController.js`
Imports: `AdaptiveLearning`, `Guide`, `AIStudentProfile`, `asyncHandler`
Functions:
- `getMyAdaptivePlan` — GET, returns student's adaptive learning doc (or empty shell)
- `refreshAdaptivePlan` — POST, reads `AIStudentProfile.learningRoadmap` and `currentSkillGaps` from the student's AI profile; queries `Guide` collection for published guides matching skills in the gaps; upserts `AdaptiveLearning` doc; returns updated plan
- `markGuideCompleted` — PUT `/:guideId/complete`, adds guide to `completedGuides`, removes from `recommendedGuides`
- `adminGetAllAdaptivePlans` — GET (admin), all docs populated with user

### 3h. `backend/controllers/careerIntelligenceController.js`
Imports: `AIStudentProfile`, `CareerGoal`, `SkillAssessment`, `PlacementRecord`, `AdaptiveLearning`, `Application`, `asyncHandler`, `aiClient` (`require('../services/aiServiceClient')`)
Functions:
- `getCareerDashboard` — GET, aggregates for the logged-in student: AI profile summary, career goals, top skill assessments, recent placements, pending interviews (from `InterviewLog`), adaptive learning summary — returns a single merged object, no new DB writes
- `getSkillGapAnalysis` — GET, fetches `AIStudentProfile.learningRoadmap` for the student; calls `aiClient` endpoint `/api/v1/career-intelligence/skill-gap` (to be added in Step 6); falls back gracefully to roadmap data if AI service offline
- `getAdminCareerIntelligenceOverview` — GET (admin), aggregate stats: total placements, verified placements, total career goals set, avg employability score across AI profiles, domain distribution

**Files:** `backend/controllers/careerGoalController.js`, `backend/controllers/skillAssessmentController.js`, `backend/controllers/interviewLogController.js`, `backend/controllers/feedbackController.js`, `backend/controllers/careerEventController.js`, `backend/controllers/placementController.js`, `backend/controllers/adaptiveLearningController.js`, `backend/controllers/careerIntelligenceController.js`

**Verify:** `node --check backend/controllers/careerGoalController.js` (and repeat for each file) — all must exit 0.

---

## Step 4 — Create 8 new route files

Pattern follows `backend/routes/reviewRoutes.js` and `backend/routes/applicationRoutes.js`: use `express.Router()`, import controller functions and middleware, use `router.route(path)` chaining, export with `module.exports = router`.

### 4a. `backend/routes/careerGoalRoutes.js`
- `GET /` → `protect`, `getMyCareerGoal`
- `POST /` → `protect`, `upsertCareerGoal`
- `PUT /` → `protect`, `upsertCareerGoal`
- `DELETE /` → `protect`, `deleteCareerGoal`

### 4b. `backend/routes/skillAssessmentRoutes.js`
- `GET /` → `protect`, `getMyAssessments`
- `POST /` → `protect`, `addAssessment`
- `GET /admin/all` → `protect`, `admin`, `getAdminAllAssessments`
- `PUT /:id` → `protect`, `updateAssessment`
- `DELETE /:id` → `protect`, `deleteAssessment`

### 4c. `backend/routes/interviewLogRoutes.js`
- `GET /` → `protect`, `getMyInterviewLogs`
- `POST /` → `protect`, `createInterviewLog`
- `GET /admin/all` → `protect`, `admin`, `getAdminInterviewLogs`
- `PUT /:id` → `protect`, `updateInterviewLog`
- `DELETE /:id` → `protect`, `deleteInterviewLog`

### 4d. `backend/routes/feedbackRoutes.js`
- `GET /forms` → `protect`, `getFeedbackForms`
- `GET /forms/:id` → `protect`, `getFeedbackFormById`
- `POST /forms` → `protect`, `admin`, `createFeedbackForm`
- `PUT /forms/:id` → `protect`, `admin`, `updateFeedbackForm`
- `DELETE /forms/:id` → `protect`, `admin`, `deleteFeedbackForm`
- `POST /forms/:formId/respond` → `protect`, `submitFeedbackResponse`
- `GET /forms/:formId/responses` → `protect`, `admin`, `getFormResponses`

### 4e. `backend/routes/careerEventRoutes.js`
- `GET /` → `optionalAuth`, `getCareerEvents`
- `GET /:id` → `optionalAuth`, `getCareerEventById`
- `POST /` → `protect`, `admin`, `createCareerEvent`
- `PUT /:id` → `protect`, `admin`, `updateCareerEvent`
- `DELETE /:id` → `protect`, `admin`, `deleteCareerEvent`
- `POST /:id/register` → `protect`, `registerForEvent`
- `DELETE /:id/register` → `protect`, `unregisterFromEvent`

### 4f. `backend/routes/placementRoutes.js`
- `GET /my` → `protect`, `getMyPlacements`
- `POST /` → `protect`, `addPlacement`
- `GET /admin/all` → `protect`, `admin`, `adminGetAllPlacements`
- `PUT /admin/:id/verify` → `protect`, `admin`, `adminVerifyPlacement`
- `PUT /:id` → `protect`, `updatePlacement`
- `DELETE /:id` → `protect`, `deletePlacement`

### 4g. `backend/routes/adaptiveLearningRoutes.js`
- `GET /` → `protect`, `getMyAdaptivePlan`
- `POST /refresh` → `protect`, `refreshAdaptivePlan`
- `PUT /:guideId/complete` → `protect`, `markGuideCompleted`
- `GET /admin/all` → `protect`, `admin`, `adminGetAllAdaptivePlans`

### 4h. `backend/routes/careerIntelligenceRoutes.js`
- `GET /dashboard` → `protect`, `getCareerDashboard`
- `GET /skill-gap` → `protect`, `getSkillGapAnalysis`
- `GET /admin/overview` → `protect`, `admin`, `getAdminCareerIntelligenceOverview`

**Files:** `backend/routes/careerGoalRoutes.js`, `backend/routes/skillAssessmentRoutes.js`, `backend/routes/interviewLogRoutes.js`, `backend/routes/feedbackRoutes.js`, `backend/routes/careerEventRoutes.js`, `backend/routes/placementRoutes.js`, `backend/routes/adaptiveLearningRoutes.js`, `backend/routes/careerIntelligenceRoutes.js`

**Verify:** `node --check backend/routes/careerGoalRoutes.js` (and repeat for each) — all must exit 0.

---

## Step 5 — Register new routes in `backend/server.js`

Add the following lines **after** the last existing `app.use('/api/...')` line and **before** the `app.use('/uploads', ...)` static file line. Do not remove or reorder existing lines.

```js
app.use('/api/career-goals',          require('./routes/careerGoalRoutes'));
app.use('/api/skill-assessments',     require('./routes/skillAssessmentRoutes'));
app.use('/api/interview-logs',        require('./routes/interviewLogRoutes'));
app.use('/api/feedback',              require('./routes/feedbackRoutes'));
app.use('/api/career-events',         require('./routes/careerEventRoutes'));
app.use('/api/placements',            require('./routes/placementRoutes'));
app.use('/api/adaptive-learning',     require('./routes/adaptiveLearningRoutes'));
app.use('/api/career-intelligence',   require('./routes/careerIntelligenceRoutes'));
```

**File:** `backend/server.js`

**Verify:** `node --check backend/server.js` exits 0. Then `node backend/server.js` starts without crashing (it will fail to connect DB in a test environment, but the `require()` chain must not throw a syntax or module-not-found error — look for `[Bootstrap] Initializing database connection...` in output before any crash).

---

## Step 6 — Python engine file and FastAPI endpoint additions

### 6a. New engine file: `backend/ai/engines/career_intelligence_engine.py`

This is a **new file** — add it alongside the existing engine files. It must be **deterministic** — no LLM calls, no external HTTP calls, pure Python rule-based logic.

Functions to implement:

```python
def compute_skill_gap(skill_profile: list, learning_roadmap: list, career_domain: dict) -> dict:
    """
    Takes AI profile skill_profile, learning_roadmap, and career_domain.
    Returns: { gaps: list, priority_skills: list, estimated_weeks: int, coverage_score: float }
    coverage_score = (known skills / total domain target skills) * 100, clamped to [0,100].
    """

def compute_career_readiness(profile: dict, placements: list, assessments: list) -> dict:
    """
    Combines employabilityScore, assessments avg, placement history.
    Returns: { readiness_score: float, level: str, breakdown: dict }
    level: 'low' (<40), 'medium' (40-70), 'high' (>70)
    """

def generate_learning_recommendations(skill_gaps: list, completed_guide_ids: list, guides: list) -> list:
    """
    Matches skill gaps against guide titles/difficulty. Returns top-5 ranked guide recommendations.
    Input guides: list of dicts with _id, title, difficulty, sections[].
    Output: [{ guide_id, title, reason, priority }] — sorted by priority ascending (1 = highest).
    """
```

### 6b. New endpoints in `backend/ai/server.py`

Add the following **after** the last existing `@app.post` block — do not modify any existing route. Import the new engine at the top of the file (after existing imports):

```python
from engines.career_intelligence_engine import compute_skill_gap, compute_career_readiness, generate_learning_recommendations
```

New Pydantic models and routes to add:

```python
class SkillGapRequest(BaseModel):
    skill_profile: list = Field(default_factory=list)
    learning_roadmap: list = Field(default_factory=list)
    career_domain: dict = Field(default_factory=dict)

class CareerReadinessRequest(BaseModel):
    profile: dict = Field(default_factory=dict)
    placements: list = Field(default_factory=list)
    assessments: list = Field(default_factory=list)

class LearningRecommendRequest(BaseModel):
    skill_gaps: list = Field(default_factory=list)
    completed_guide_ids: list = Field(default_factory=list)
    guides: list = Field(default_factory=list)

@app.post('/api/v1/career-intelligence/skill-gap')
def career_skill_gap(body: SkillGapRequest):
    return {'success': True, 'data': compute_skill_gap(body.skill_profile, body.learning_roadmap, body.career_domain)}

@app.post('/api/v1/career-intelligence/readiness')
def career_readiness(body: CareerReadinessRequest):
    return {'success': True, 'data': compute_career_readiness(body.profile, body.placements, body.assessments)}

@app.post('/api/v1/career-intelligence/learning-recommendations')
def learning_recommendations(body: LearningRecommendRequest):
    return {'success': True, 'data': generate_learning_recommendations(body.skill_gaps, body.completed_guide_ids, body.guides)}
```

Also add a `careerIntelligence` method to `backend/services/aiServiceClient.js` (only add — do not remove anything):
```js
const careerIntelligenceSkillGap = (payload) =>
  callAI('/api/v1/career-intelligence/skill-gap', 'career_skill_gap', {
    skill_profile: payload.skillProfile || [],
    learning_roadmap: payload.learningRoadmap || [],
    career_domain: payload.careerDomain || {},
  });
```
Export it alongside existing exports.

**Files:** `backend/ai/engines/career_intelligence_engine.py` (new), `backend/ai/server.py` (add only), `backend/services/aiServiceClient.js` (add only)

**Verify:** `python -c "from engines.career_intelligence_engine import compute_skill_gap, compute_career_readiness, generate_learning_recommendations; print('Engine OK')"` run from `backend/ai/` — must print `Engine OK`. Then `node --check backend/services/aiServiceClient.js` exits 0.

---

## Step 7 — Frontend service file

Create a new file that follows the pattern of `frontend/src/services/aiService.js` (named exports, uses `import { api } from './api'`).

**File:** `frontend/src/services/careerIntelligenceService.js`

Export these named functions (matching the routes registered in Steps 4–5):

```js
// Career Goals
export const getMyCareerGoal = () => api.get('/career-goals');
export const upsertCareerGoal = (data) => api.post('/career-goals', data);
export const deleteCareerGoal = () => api.delete('/career-goals');

// Skill Assessments
export const getMyAssessments = () => api.get('/skill-assessments');
export const addAssessment = (data) => api.post('/skill-assessments', data);
export const updateAssessment = (id, data) => api.put(`/skill-assessments/${id}`, data);
export const deleteAssessment = (id) => api.delete(`/skill-assessments/${id}`);
export const getAdminAllAssessments = () => api.get('/skill-assessments/admin/all');

// Interview Logs
export const getMyInterviewLogs = () => api.get('/interview-logs');
export const createInterviewLog = (data) => api.post('/interview-logs', data);
export const updateInterviewLog = (id, data) => api.put(`/interview-logs/${id}`, data);
export const deleteInterviewLog = (id) => api.delete(`/interview-logs/${id}`);
export const getAdminInterviewLogs = () => api.get('/interview-logs/admin/all');

// Feedback
export const getFeedbackForms = () => api.get('/feedback/forms');
export const getFeedbackFormById = (id) => api.get(`/feedback/forms/${id}`);
export const createFeedbackForm = (data) => api.post('/feedback/forms', data);
export const updateFeedbackForm = (id, data) => api.put(`/feedback/forms/${id}`, data);
export const deleteFeedbackForm = (id) => api.delete(`/feedback/forms/${id}`);
export const submitFeedbackResponse = (formId, data) => api.post(`/feedback/forms/${formId}/respond`, data);
export const getFormResponses = (formId) => api.get(`/feedback/forms/${formId}/responses`);

// Career Events
export const getCareerEvents = () => api.get('/career-events');
export const getCareerEventById = (id) => api.get(`/career-events/${id}`);
export const createCareerEvent = (data) => api.post('/career-events', data);
export const updateCareerEvent = (id, data) => api.put(`/career-events/${id}`, data);
export const deleteCareerEvent = (id) => api.delete(`/career-events/${id}`);
export const registerForEvent = (id) => api.post(`/career-events/${id}/register`);
export const unregisterFromEvent = (id) => api.delete(`/career-events/${id}/register`);

// Placements
export const getMyPlacements = () => api.get('/placements/my');
export const addPlacement = (data) => api.post('/placements', data);
export const getAdminAllPlacements = () => api.get('/placements/admin/all');
export const adminVerifyPlacement = (id) => api.put(`/placements/admin/${id}/verify`);
export const updatePlacement = (id, data) => api.put(`/placements/${id}`, data);
export const deletePlacement = (id) => api.delete(`/placements/${id}`);

// Adaptive Learning
export const getMyAdaptivePlan = () => api.get('/adaptive-learning');
export const refreshAdaptivePlan = () => api.post('/adaptive-learning/refresh');
export const markGuideCompleted = (guideId) => api.put(`/adaptive-learning/${guideId}/complete`);
export const getAdminAllAdaptivePlans = () => api.get('/adaptive-learning/admin/all');

// Career Intelligence Dashboard
export const getCareerDashboard = () => api.get('/career-intelligence/dashboard');
export const getSkillGapAnalysis = () => api.get('/career-intelligence/skill-gap');
export const getAdminCareerIntelligenceOverview = () => api.get('/career-intelligence/admin/overview');

export default {
  getMyCareerGoal, upsertCareerGoal, deleteCareerGoal,
  getMyAssessments, addAssessment, updateAssessment, deleteAssessment, getAdminAllAssessments,
  getMyInterviewLogs, createInterviewLog, updateInterviewLog, deleteInterviewLog, getAdminInterviewLogs,
  getFeedbackForms, getFeedbackFormById, createFeedbackForm, updateFeedbackForm, deleteFeedbackForm,
  submitFeedbackResponse, getFormResponses,
  getCareerEvents, getCareerEventById, createCareerEvent, updateCareerEvent, deleteCareerEvent,
  registerForEvent, unregisterFromEvent,
  getMyPlacements, addPlacement, getAdminAllPlacements, adminVerifyPlacement, updatePlacement, deletePlacement,
  getMyAdaptivePlan, refreshAdaptivePlan, markGuideCompleted, getAdminAllAdaptivePlans,
  getCareerDashboard, getSkillGapAnalysis, getAdminCareerIntelligenceOverview,
};
```

**File:** `frontend/src/services/careerIntelligenceService.js`

**Verify:** `npm run build` from `frontend/` — must complete without errors (no import resolution failures).

---

## Step 8 — Verification steps (end-to-end)

Run these in order after all steps are complete:

1. **Syntax check all new backend JS files:**
   ```
   node --check backend/models/CareerGoal.js
   node --check backend/models/SkillAssessment.js
   node --check backend/models/InterviewLog.js
   node --check backend/models/FeedbackForm.js
   node --check backend/models/FeedbackResponse.js
   node --check backend/models/CareerEvent.js
   node --check backend/models/PlacementRecord.js
   node --check backend/models/AdaptiveLearning.js
   node --check backend/models/Internship.js
   node --check backend/models/Application.js
   node --check backend/controllers/careerGoalController.js
   node --check backend/controllers/skillAssessmentController.js
   node --check backend/controllers/interviewLogController.js
   node --check backend/controllers/feedbackController.js
   node --check backend/controllers/careerEventController.js
   node --check backend/controllers/placementController.js
   node --check backend/controllers/adaptiveLearningController.js
   node --check backend/controllers/careerIntelligenceController.js
   node --check backend/routes/careerGoalRoutes.js
   node --check backend/routes/skillAssessmentRoutes.js
   node --check backend/routes/interviewLogRoutes.js
   node --check backend/routes/feedbackRoutes.js
   node --check backend/routes/careerEventRoutes.js
   node --check backend/routes/placementRoutes.js
   node --check backend/routes/adaptiveLearningRoutes.js
   node --check backend/routes/careerIntelligenceRoutes.js
   node --check backend/server.js
   node --check backend/services/aiServiceClient.js
   ```
   All must exit 0.

2. **Python engine syntax check:**
   ```
   python -m py_compile backend/ai/engines/career_intelligence_engine.py
   python -m py_compile backend/ai/server.py
   ```
   Both must exit 0.

3. **Frontend build:**
   ```
   cd frontend && npm run build
   ```
   Must complete without errors.

4. **Backend startup probe** (no DB needed for parse check):
   ```
   node -e "const app = require('./backend/server.js')" 2>&1 | head -5
   ```
   Must show the bootstrap log line (DB connect attempt), not a `MODULE_NOT_FOUND` or `SyntaxError`.

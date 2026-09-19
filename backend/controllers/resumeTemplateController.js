/**
 * resumeTemplateController.js
 * Protects premium resume template access at the API level.
 *
 * FREE_TEMPLATE_IDS mirrors frontend/src/data/resumeTemplates.js.
 * Backend is the source of truth — never trust the client.
 *
 * Admin endpoints (super_admin only):
 *   GET  /api/resume-templates/admin/config          — list templates + access levels
 *   PUT  /api/resume-templates/admin/config/:templateId — toggle FREE/PREMIUM
 */

const asyncHandler = require('express-async-handler');
const { getActiveSubscription } = require('../middleware/subscriptionMiddleware');
const SiteSettings = require('../models/SiteSettings');

// ── Config: can be overridden by admin via SiteSettings ──────────────────────
const DEFAULT_FREE_IDS = ['modern-ats', 'professional'];

const ALL_TEMPLATE_IDS = [
  'modern-ats',
  'professional',
  'software-engineer',
  'student-fresher',
  'minimal',
  'executive',
];

const TEMPLATE_META = {
  'modern-ats':        { name: 'Modern ATS',        displayOrder: 1 },
  'professional':      { name: 'Professional',       displayOrder: 2 },
  'software-engineer': { name: 'Software Engineer',  displayOrder: 3 },
  'student-fresher':   { name: 'Student / Fresher',  displayOrder: 4 },
  'minimal':           { name: 'Minimal',            displayOrder: 5 },
  'executive':         { name: 'Executive',          displayOrder: 6 },
};

/** Load admin-configured free template IDs from SiteSettings. Falls back to defaults. */
async function getFreeTemplateIds() {
  try {
    const doc = await SiteSettings.findOne({ key: 'main' }).lean();
    const ids  = doc?.resumeTemplateConfig?.freeTemplateIds;
    if (Array.isArray(ids) && ids.length > 0) return ids;
  } catch { /* fallback */ }
  return [...DEFAULT_FREE_IDS];
}

/** Save free template IDs to SiteSettings. */
async function saveFreeTemplateIds(ids) {
  await SiteSettings.findOneAndUpdate(
    { key: 'main' },
    { $set: { 'resumeTemplateConfig.freeTemplateIds': ids } },
    { upsert: true, new: true }
  );
}

const checkTemplateAccess = asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  if (!ALL_TEMPLATE_IDS.includes(templateId)) {
    res.status(404); throw new Error(`Template "${templateId}" not found.`);
  }

  const freeIds = await getFreeTemplateIds();
  if (freeIds.includes(templateId)) {
    return res.json({ success: true, allowed: true, access: 'FREE', templateId });
  }

  const userId    = req.user._id || req.user.id;
  const activeSub = await getActiveSubscription(userId);
  if (!activeSub) {
    return res.status(403).json({
      success: false, allowed: false, code: 'SUBSCRIPTION_REQUIRED',
      message: 'This resume template requires an active Premium subscription.',
      requiresSubscription: true,
    });
  }
  return res.json({ success: true, allowed: true, access: 'PREMIUM', templateId });
});

const validateTemplateUse = asyncHandler(async (req, res) => {
  const { templateId } = req.body;
  if (!templateId || !ALL_TEMPLATE_IDS.includes(templateId)) {
    res.status(400); throw new Error('Valid templateId is required.');
  }

  const freeIds = await getFreeTemplateIds();
  if (freeIds.includes(templateId)) {
    return res.json({ success: true, allowed: true, templateId });
  }

  const userId    = req.user._id || req.user.id;
  const activeSub = await getActiveSubscription(userId);
  if (!activeSub) {
    return res.status(403).json({
      success: false, allowed: false, code: 'SUBSCRIPTION_REQUIRED',
      message: 'This resume template requires an active Premium subscription.',
      requiresSubscription: true,
    });
  }
  return res.json({ success: true, allowed: true, templateId });
});

const getTemplates = asyncHandler(async (req, res) => {
  const freeIds = await getFreeTemplateIds();
  const templates = ALL_TEMPLATE_IDS.map((id, idx) => ({
    templateId:   id,
    displayOrder: TEMPLATE_META[id]?.displayOrder || idx + 1,
    name:         TEMPLATE_META[id]?.name || id,
    access:       freeIds.includes(id) ? 'FREE' : 'PREMIUM',
  }));
  res.json({ success: true, templates });
});

// ── Admin: list all templates with current access config ─────────────────────
const adminGetTemplateConfig = asyncHandler(async (req, res) => {
  const freeIds = await getFreeTemplateIds();
  const templates = ALL_TEMPLATE_IDS.map((id, idx) => ({
    templateId:   id,
    displayOrder: TEMPLATE_META[id]?.displayOrder || idx + 1,
    name:         TEMPLATE_META[id]?.name || id,
    access:       freeIds.includes(id) ? 'FREE' : 'PREMIUM',
    canToggle:    true,
  }));
  res.json({ success: true, templates, freeTemplateIds: freeIds });
});

// ── Admin: toggle a template between FREE and PREMIUM ────────────────────────
const adminSetTemplateAccess = asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  const { access } = req.body;  // 'FREE' | 'PREMIUM'

  if (!ALL_TEMPLATE_IDS.includes(templateId)) {
    res.status(404); throw new Error(`Template "${templateId}" not found.`);
  }
  if (!['FREE', 'PREMIUM'].includes(access)) {
    res.status(400); throw new Error('access must be FREE or PREMIUM.');
  }

  const freeIds = await getFreeTemplateIds();
  let newFreeIds;
  if (access === 'FREE') {
    newFreeIds = freeIds.includes(templateId) ? freeIds : [...freeIds, templateId];
  } else {
    newFreeIds = freeIds.filter(id => id !== templateId);
  }

  await saveFreeTemplateIds(newFreeIds);

  res.json({
    success: true,
    message: `Template "${templateId}" is now ${access}.`,
    templateId,
    access,
    freeTemplateIds: newFreeIds,
  });
});

module.exports = {
  checkTemplateAccess,
  validateTemplateUse,
  getTemplates,
  adminGetTemplateConfig,
  adminSetTemplateAccess,
};

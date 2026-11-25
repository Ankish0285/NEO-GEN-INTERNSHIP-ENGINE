const asyncHandler = require('express-async-handler');
const { randomUUID } = require('crypto');
const EmailLog = require('../models/EmailLog');
const User = require('../models/User');
const SiteSettings = require('../models/SiteSettings');
const emailService = require('../services/emailService');
const { defaultSiteSettings } = require('../utils/defaultSiteSettings');

const CATEGORY_KEYS = [
  'welcomeEmail',
  'newInternship',
  'successStory',
  'certificateIssued',
  'certificateStatus',
  'announcements',
];

const VALID_STATUSES = ['sent', 'failed', 'pending'];
const VALID_AUDIENCES = ['students', 'partners', 'all'];

// @desc    Get paginated email notification logs
// @route   GET /api/admin/email-logs
// @access  Private/Admin
const getEmailLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const filter = {};

  if (req.query.status && VALID_STATUSES.includes(req.query.status)) {
    filter.status = req.query.status;
  }
  const VALID_EVENT_TYPES = ['welcome', 'new_internship', 'success_story', 'certificate_issued', 'certificate_status', 'announcement'];
  if (req.query.eventType) {
    if (!VALID_EVENT_TYPES.includes(req.query.eventType)) {
      res.status(400);
      throw new Error('Invalid eventType');
    }
    filter.eventType = req.query.eventType;
  }
  if (req.query.search) {
    filter.recipientEmail = { $regex: String(req.query.search).trim(), $options: 'i' };
  }
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }

  const total = await EmailLog.countDocuments(filter);
  const data = await EmailLog.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('recipientId', 'name email')
    .lean();

  res.json({ data, total, page, pages: Math.ceil(total / limit) || 1 });
});

// @desc    Retry a failed/pending email log
// @route   POST /api/admin/email-logs/:id/retry
// @access  Private/Admin
const retryEmailLog = asyncHandler(async (req, res) => {
  const log = await EmailLog.findById(req.params.id);
  if (!log) {
    res.status(404);
    throw new Error('Email log not found');
  }
  // Trade-off: the stored bodyHtml from the original send is reused on retry rather than
  // re-rendering from the event type and ref ID. This avoids needing to reload the original
  // source document (internship, certificate, etc.) and keeps retry fast. The HTML
  // originates from our own templates, and this route is admin-only, so the attack surface
  // is limited. If a future migration changes templates, stale HTML may be retried until
  // the log entry is replaced by a fresh send.
  const categoryKey = emailService.EVENT_CATEGORY_MAP[log.eventType];
  if (!(await emailService.isCategoryEnabled(categoryKey))) {
    return res.json({ skipped: true, reason: 'category disabled' });
  }
  try {
    const result = await emailService.sendWithRetry({
      to: log.recipientEmail,
      subject: log.subject,
      html: log.bodyHtml,
      text: log.subject,
    });
    if (result && result.skipped) {
      res.status(503);
      throw new Error(`Retry failed: ${result.reason}`);
    }
    await emailService.recordResult(log._id, true);
    res.json({ success: true, message: 'Email retry succeeded' });
  } catch (err) {
    await emailService.recordResult(log._id, false, err.message);
    res.status(500);
    throw new Error(`Retry failed: ${err.message}`);
  }
});

// @desc    Get email notification stats (counts by status and by eventType)
// @route   GET /api/admin/email-stats
// @access  Private/Admin
const getEmailStats = asyncHandler(async (req, res) => {
  const byStatusAgg = await EmailLog.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const byEventTypeAgg = await EmailLog.aggregate([{ $group: { _id: '$eventType', count: { $sum: 1 } } }]);

  const byStatus = { sent: 0, failed: 0, pending: 0 };
  for (const s of byStatusAgg) byStatus[s._id] = s.count;
  const byEventType = {};
  for (const e of byEventTypeAgg) byEventType[e._id] = e.count;

  res.json({
    byStatus,
    byEventType,
    total: byStatus.sent + byStatus.failed + byStatus.pending,
  });
});

// @desc    Send an announcement email to a selected audience (fire-and-forget)
// @route   POST /api/admin/announcements
// @access  Private/Admin
const sendAnnouncement = asyncHandler(async (req, res) => {
  const { subject, title, body, cta, ctaUrl, audience } = req.body;
  if (!subject || !title || !body) {
    res.status(400);
    throw new Error('subject, title and body are required');
  }

  const audienceKey = (VALID_AUDIENCES.includes(String(audience || '').toLowerCase()) ? String(audience).toLowerCase() : 'students');
  let query = {};
  if (audienceKey === 'students') query = { role: 'student', active: { $ne: false } };
  else if (audienceKey === 'partners') query = { role: 'partner' };
  else query = {}; // all

  const announcementId = randomUUID();

  const recipientCount = await User.countDocuments(query);

  setImmediate(() => {
    User.find(query)
      .select('email name')
      .lean()
      .then((recipients) =>
        emailService.sendAnnouncementToAudience({ announcementId, subject, title, body, cta, ctaUrl, recipients })
      )
      .catch((err) => console.error('[Email] announcement:', err.message));
  });

  res.status(202).json({ success: true, announcementId, recipientCount });
});

// @desc    Get email notification category settings (merged with defaults)
// @route   GET /api/admin/email-settings
// @access  Private/Admin
const getEmailSettings = asyncHandler(async (req, res) => {
  const doc = await SiteSettings.findOne({ key: 'main' }).select('emailNotifications');
  const defaults = (defaultSiteSettings && defaultSiteSettings.emailNotifications) || {};
  const settings = {};
  for (const k of CATEGORY_KEYS) {
    const docVal = doc && doc.emailNotifications ? doc.emailNotifications[k] : undefined;
    let enabled;
    if (docVal && typeof docVal.enabled === 'boolean') {
      enabled = docVal.enabled;
    } else if (defaults[k] && typeof defaults[k].enabled === 'boolean') {
      enabled = defaults[k].enabled;
    } else {
      enabled = true;
    }
    settings[k] = { enabled };
  }
  res.json({ emailNotifications: settings });
});

// @desc    Update email notification category settings
// @route   PUT /api/admin/email-settings
// @access  Private/Admin
const updateEmailSettings = asyncHandler(async (req, res) => {
  const incoming = req.body.emailNotifications || req.body;
  const doc = await SiteSettings.findOne({ key: 'main' });
  if (!doc) {
    res.status(404);
    throw new Error('Site settings not initialized');
  }
  if (!doc.emailNotifications) doc.emailNotifications = {};
  for (const k of CATEGORY_KEYS) {
    const val = incoming[k];
    if (val == null) continue;
    if (typeof val === 'object') {
      doc.emailNotifications[k] = { enabled: val.enabled === false ? false : true };
    } else if (typeof val === 'boolean') {
      doc.emailNotifications[k] = { enabled: val };
    }
  }
  doc.markModified('emailNotifications');
  await doc.save();
  if (typeof emailService.invalidateSettingsCache === 'function') {
    emailService.invalidateSettingsCache();
  }
  res.json({ success: true, emailNotifications: doc.emailNotifications });
});

module.exports = {
  getEmailLogs,
  retryEmailLog,
  getEmailStats,
  sendAnnouncement,
  getEmailSettings,
  updateEmailSettings,
};

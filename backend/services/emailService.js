// Centralized email notification service.
// Reuses the existing EMAIL_USER / EMAIL_PASS Gmail config (same as utils/sendEmail.js)
// but adds templating, logging (EmailLog), idempotency, per-category gating, retry, and bulk sends.
// All high-level sends are designed to be called fire-and-forget (setImmediate + .catch)
// so they never block API responses. utils/sendEmail.js (auth OTP / reset) stays untouched.

const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');
const SiteSettings = require('../models/SiteSettings');
const User = require('../models/User');
const {
  welcomeEmail,
  newInternshipEmail,
  newSuccessStoryEmail,
  certificateIssuedEmail,
  certificateStatusEmail,
  announcementEmail,
} = require('../utils/emailTemplates');

// EmailLog.eventType -> SiteSettings.emailNotifications category key
const EVENT_CATEGORY_MAP = {
  welcome: 'welcomeEmail',
  new_internship: 'newInternship',
  success_story: 'successStory',
  certificate_issued: 'certificateIssued',
  certificate_status: 'certificateStatus',
  announcement: 'announcements',
};

const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [1000, 2000, 4000];
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 1000;
const SETTINGS_CACHE_TTL = 60 * 1000;

// Lazily-created singleton transporter (Gmail).
let transporter = null;
let smtpNotConfiguredLogged = false;

const getEmailCreds = () => ({
  user: (process.env.EMAIL_USER || '').trim(),
  pass: (process.env.EMAIL_PASS || '').replace(/\s/g, ''),
});

const getTransporter = () => {
  if (transporter) return transporter;
  const { user, pass } = getEmailCreds();
  if (!user || !pass) {
    if (!smtpNotConfiguredLogged) {
      console.log('[Email] SMTP not configured — set EMAIL_USER and EMAIL_PASS to enable outgoing notification emails');
      smtpNotConfiguredLogged = true;
    }
    return null;
  }
  transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  smtpNotConfiguredLogged = false;
  return transporter;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const chunk = (arr, size) => {
  const out = [];
  const n = Array.isArray(arr) ? arr.length : 0;
  for (let i = 0; i < n; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// ─── Settings cache + per-category gating ────────────────────────────────────
let settingsCache = null;

const invalidateSettingsCache = () => {
  settingsCache = null;
};

const loadEnabledMap = async () => {
  const now = Date.now();
  if (settingsCache && now - settingsCache.ts < SETTINGS_CACHE_TTL) return settingsCache.map;
  const map = {};
  try {
    const doc = await SiteSettings.findOne({ key: 'main' }).select('emailNotifications');
    if (doc && doc.emailNotifications) {
      for (const cat of Object.values(EVENT_CATEGORY_MAP)) {
        const entry = doc.emailNotifications[cat];
        map[cat] = entry && entry.enabled === false ? false : true;
      }
    }
  } catch (err) {
    console.error('[Email] Failed to load email notification settings:', err.message);
  }
  // Default every category to enabled when missing (never silently disable email).
  for (const cat of Object.values(EVENT_CATEGORY_MAP)) {
    if (map[cat] === undefined) map[cat] = true;
  }
  settingsCache = { ts: now, map };
  return map;
};

const isCategoryEnabled = async (categoryKey) => {
  const map = await loadEnabledMap();
  return map[categoryKey] !== false;
};

// ─── Idempotency + result recording ──────────────────────────────────────────
const getOrCreateLog = async ({ eventType, recipientId, recipientEmail, subject, bodyHtml, eventRefId }) => {
  const refId = eventRefId || '';
  let log = await EmailLog.findOne({ eventType, recipientId, eventRefId: refId });
  if (log && log.status === 'sent') {
    return { skip: true, log };
  }
  if (!log) {
    try {
      log = await EmailLog.create({
        eventType,
        recipientId: recipientId || null,
        recipientEmail,
        subject,
        bodyHtml: bodyHtml || '',
        status: 'pending',
        eventRefId: refId,
      });
    } catch (e) {
      // Race: another worker created the same log — refetch.
      log = await EmailLog.findOne({ eventType, recipientId, eventRefId: refId });
      if (log && log.status === 'sent') return { skip: true, log };
    }
  }
  // Refresh subject/body so a retry of a pending/failed log resends the latest content.
  log.subject = subject;
  log.bodyHtml = bodyHtml || '';
  log.recipientEmail = recipientEmail;
  return { skip: false, log };
};

const recordResult = async (logId, ok, error) => {
  try {
    await EmailLog.findByIdAndUpdate(logId, {
      status: ok ? 'sent' : 'failed',
      $inc: { attempts: 1 },
      lastAttemptAt: new Date(),
      error: ok ? '' : String(error || 'Unknown error').slice(0, 500),
    });
  } catch (e) {
    console.error('[Email] recordResult error:', e.message);
  }
};

// ─── Low-level send ───────────────────────────────────────────────────────────
/**
 * Send a single email with up to MAX_ATTEMPTS retries and exponential backoff.
 * Logs only to + subject — never SMTP credentials. Returns { skipped } when SMTP
 * is not configured (so callers never throw on missing creds).
 */
const sendWithRetry = async ({ to, subject, html, text }) => {
  const tp = getTransporter();
  if (!tp) return { skipped: true, reason: 'SMTP not configured' };
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[Email] Sending to ${to} | subject="${subject}" | attempt ${attempt}/${MAX_ATTEMPTS}`);
      const info = await tp.sendMail({
        from: `NEOGEN INTERNSHIP ENGINE <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text: text || subject,
      });
      console.log(`[Email] Sent to ${to} | messageId=${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      lastErr = err;
      console.error(`[Email] Attempt ${attempt}/${MAX_ATTEMPTS} failed for ${to}: ${err.message}`);
      if (attempt < MAX_ATTEMPTS) await sleep(BACKOFF_MS[attempt - 1] != null ? BACKOFF_MS[attempt - 1] : 4000);
    }
  }
  throw lastErr || new Error('Email sending failed');
};

/**
 * Low-level bulk send (chunk of 50, 1s delay between batches). No idempotency/gating —
 * used as a primitive. High-level notify functions use the idempotent dispatcher instead.
 * recipients are { _id, email } user objects.
 */
const sendBulkEmail = async ({ recipients, buildMail }) => {
  const batches = chunk(recipients, BATCH_SIZE);
  const results = [];
  for (let i = 0; i < batches.length; i++) {
    for (const recipient of batches[i]) {
      if (!recipient || !recipient.email) continue;
      try {
        const mail = buildMail(recipient);
        const res = await sendWithRetry({ to: recipient.email, subject: mail.subject, html: mail.html, text: mail.text });
        results.push({ recipient: recipient.email, success: !(res && res.skipped), skipped: !!(res && res.skipped) });
      } catch (err) {
        results.push({ recipient: recipient.email, success: false, error: err.message });
      }
    }
    if (i < batches.length - 1) await sleep(BATCH_DELAY_MS);
  }
  return results;
};

// ─── Internal dispatchers (gating + idempotency + send + log) ─────────────────
const _sendOne = async ({ eventType, categoryKey, eventRefId, recipient, buildMail }) => {
  if (!recipient || !recipient.email) return { skipped: 'no-recipient' };
  if (!(await isCategoryEnabled(categoryKey))) return { skipped: 'category-disabled' };
  if (!getTransporter()) return { skipped: 'smtp-not-configured' };

  const mail = buildMail(recipient);
  const { skip, log } = await getOrCreateLog({
    eventType,
    recipientId: recipient._id,
    recipientEmail: recipient.email,
    subject: mail.subject,
    bodyHtml: mail.html,
    eventRefId,
  });
  if (skip) return { skipped: 'duplicate' };

  try {
    const res = await sendWithRetry({ to: recipient.email, subject: mail.subject, html: mail.html, text: mail.text });
    if (res && res.skipped) {
      await recordResult(log._id, false, res.reason);
      return { skipped: res.reason };
    }
    await recordResult(log._id, true);
    return { success: true };
  } catch (err) {
    await recordResult(log._id, false, err.message);
    return { success: false, error: err.message };
  }
};

const _dispatchBulk = async ({ eventType, categoryKey, eventRefId, recipients, buildMail }) => {
  if (!(await isCategoryEnabled(categoryKey))) {
    return { skipped: 'category-disabled', sent: 0, failed: 0, duplicate: 0, total: recipients.length };
  }
  if (!getTransporter()) {
    return { skipped: 'smtp-not-configured', sent: 0, failed: 0, duplicate: 0, total: recipients.length };
  }
  const batches = chunk(recipients, BATCH_SIZE);
  let sent = 0;
  let failed = 0;
  let duplicate = 0;
  for (let i = 0; i < batches.length; i++) {
    for (const recipient of batches[i]) {
      const res = await _sendOne({ eventType, categoryKey, eventRefId, recipient, buildMail });
      if (res.success) sent++;
      else if (res.skipped) duplicate++;
      else failed++;
    }
    if (i < batches.length - 1) await sleep(BATCH_DELAY_MS);
  }
  return { sent, failed, duplicate, total: recipients.length };
};

// ─── Certificate student resolver (populate student if needed) ────────────────
const _getCertStudent = async (cert) => {
  if (cert.student && cert.student.email) {
    return { _id: cert.student._id, name: cert.student.name, email: cert.student.email };
  }
  const Certificate = require('../models/Certificate');
  const full = await Certificate.findById(cert._id).populate('student', 'name email');
  const s = full && full.student;
  return s ? { _id: s._id, name: s.name, email: s.email } : null;
};

// ─── High-level notification functions ───────────────────────────────────────
const sendWelcomeEmail = async (user) =>
  _sendOne({
    eventType: 'welcome',
    categoryKey: 'welcomeEmail',
    eventRefId: String(user._id),
    recipient: { _id: user._id, email: user.email },
    buildMail: () => welcomeEmail(user),
  });

const notifyNewInternship = async (internship) => {
  const recipients = await User.find({ role: 'student', active: { $ne: false } }).select('email name');
  return _dispatchBulk({
    eventType: 'new_internship',
    categoryKey: 'newInternship',
    eventRefId: String(internship._id),
    recipients,
    buildMail: (r) => newInternshipEmail({ name: r.name, email: r.email }, internship),
  });
};

const notifySuccessStory = async (story) => {
  const recipients = await User.find({ role: 'student', active: { $ne: false } }).select('email name');
  return _dispatchBulk({
    eventType: 'success_story',
    categoryKey: 'successStory',
    eventRefId: String(story._id),
    recipients,
    buildMail: (r) => newSuccessStoryEmail({ name: r.name, email: r.email }, story),
  });
};

const notifyCertificateIssued = async (cert) => {
  const student = await _getCertStudent(cert);
  if (!student || !student.email) return { skipped: 'no-student' };
  return _sendOne({
    eventType: 'certificate_issued',
    categoryKey: 'certificateIssued',
    eventRefId: String(cert._id),
    recipient: { _id: student._id, email: student.email },
    buildMail: () => certificateIssuedEmail({ name: student.name, email: student.email }, cert),
  });
};

const notifyCertificateStatus = async (cert, statusLabel) => {
  const student = await _getCertStudent(cert);
  if (!student || !student.email) return { skipped: 'no-student' };
  return _sendOne({
    eventType: 'certificate_status',
    categoryKey: 'certificateStatus',
    eventRefId: String(cert._id),
    recipient: { _id: student._id, email: student.email },
    buildMail: () => certificateStatusEmail({ name: student.name, email: student.email }, cert, statusLabel),
  });
};

const sendAnnouncementToAudience = async ({ announcementId, subject, title, body, cta, ctaUrl, recipients }) =>
  _dispatchBulk({
    eventType: 'announcement',
    categoryKey: 'announcements',
    eventRefId: String(announcementId),
    recipients: recipients || [],
    buildMail: (r) => announcementEmail({ name: r.name, email: r.email }, { subject, title, body, cta, ctaUrl }),
  });

module.exports = {
  EVENT_CATEGORY_MAP,
  sendWithRetry,
  sendBulkEmail,
  isCategoryEnabled,
  getOrCreateLog,
  recordResult,
  chunk,
  invalidateSettingsCache,
  sendWelcomeEmail,
  notifyNewInternship,
  notifySuccessStory,
  notifyCertificateIssued,
  notifyCertificateStatus,
  sendAnnouncementToAudience,
};

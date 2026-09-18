const asyncHandler = require('express-async-handler');
const SiteSettings = require('../models/SiteSettings');
const ActivityLog = require('../models/ActivityLog');
const { defaultSiteSettings } = require('../utils/defaultSiteSettings');
const { smartCloudinaryUpload, releaseCloudinaryAsset } = require('../utils/cloudinaryUpload');

const SECTION_KEYS = [
  'branding',
  'hero',
  'about',
  'howItWorks',
  'contact',
  'footer',
  'social',
  'resources',
  'policies',
  'team',
];

function isCloudinaryConfigured() {
  return ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].every((key) => {
    const val = process.env[key];
    return val && !String(val).toLowerCase().includes('your_');
  });
}

function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  const out = { ...(target || {}) };
  for (const key of Object.keys(source)) {
    const val = source[key];
    if (val === undefined) continue;
    if (Array.isArray(val)) {
      out[key] = val;
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      out[key] = deepMerge(out[key] || {}, val);
    } else {
      out[key] = val;
    }
  }
  return out;
}

function toPlainSection(value) {
  if (!value) return {};
  if (typeof value.toObject === 'function') return value.toObject();
  return { ...value };
}

function sanitizeIncoming(body) {
  if (!body || typeof body !== 'object') return {};
  const clean = { ...body };
  delete clean._id;
  delete clean.__v;
  delete clean.key;
  delete clean.createdAt;
  delete clean.updatedAt;
  return clean;
}

async function getOrCreateSettings() {
  let doc = await SiteSettings.findOne({ key: 'main' });
  if (!doc) {
    doc = await SiteSettings.create(defaultSiteSettings);
  }
  return doc;
}

function normalizeTeamSection(raw) {
  const base = defaultSiteSettings.team;
  if (!raw || typeof raw !== 'object') {
    return { title: base.title, subtitle: base.subtitle, members: [] };
  }
  const members = Array.isArray(raw.members)
    ? raw.members.map((m) => ({
        name: String(m?.name ?? '').trim(),
        position: String(m?.position ?? '').trim(),
        note: String(m?.note ?? '').trim(),
        photoUrl: String(m?.photoUrl ?? '').trim(),
      }))
    : [];
  return {
    title: String(raw.title ?? base.title).trim() || base.title,
    subtitle: String(raw.subtitle ?? base.subtitle).trim() || base.subtitle,
    members,
  };
}

function toPublicPayload(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  delete obj.__v;
  obj.team = normalizeTeamSection(obj.team);
  return obj;
}

/**
 * Extract every Cloudinary image URL currently stored in a SiteSettings doc.
 * Used to identify which old URLs need to be released after an update.
 */
function extractSiteImageUrls(doc) {
  const urls = new Set();
  const isCloud = (v) => v && typeof v === 'string' && /res\.cloudinary\.com/i.test(v);

  if (isCloud(doc?.branding?.logoUrl))        urls.add(doc.branding.logoUrl);
  if (isCloud(doc?.hero?.backgroundImage))    urls.add(doc.hero.backgroundImage);
  if (Array.isArray(doc?.hero?.backgroundImages)) {
    doc.hero.backgroundImages.forEach((u) => { if (isCloud(u)) urls.add(u); });
  }
  if (Array.isArray(doc?.team?.members)) {
    doc.team.members.forEach((m) => { if (isCloud(m?.photoUrl)) urls.add(m.photoUrl); });
  }
  return urls;
}

// @desc    Get public site settings (website content)
// @route   GET /api/site-settings
// @access  Public
const getSiteSettings = asyncHandler(async (req, res) => {
  const doc = await getOrCreateSettings();
  res.status(200).json({ success: true, settings: toPublicPayload(doc) });
});

// @desc    Update site settings (super admin only)
// @route   PUT /api/site-settings
// @access  Private/Admin
const updateSiteSettings = asyncHandler(async (req, res) => {
  const doc = await getOrCreateSettings();
  const incoming = sanitizeIncoming(req.body?.settings || req.body);

  if (!Object.keys(incoming).length) {
    res.status(400);
    throw new Error('No settings data provided');
  }

  if (incoming.hero && incoming.hero.overlayOpacity !== undefined) {
    incoming.hero.overlayOpacity = Number(incoming.hero.overlayOpacity);
  }

  // Snapshot existing Cloudinary URLs BEFORE the merge
  const urlsBefore = extractSiteImageUrls(doc.toObject ? doc.toObject() : doc);

  for (const section of SECTION_KEYS) {
    if (incoming[section] === undefined) continue;

    if (section === 'team') {
      doc.team = normalizeTeamSection(incoming.team);
      doc.markModified('team');
      continue;
    }

    const current = toPlainSection(doc[section]);
    doc[section] = deepMerge(current, incoming[section]);
    doc.markModified(section);
  }

  doc.key = 'main';
  await doc.save();

  // Snapshot URLs AFTER save, then release any that were removed
  const urlsAfter = extractSiteImageUrls(doc.toObject ? doc.toObject() : doc);
  for (const oldUrl of urlsBefore) {
    if (!urlsAfter.has(oldUrl)) {
      // Fire-and-forget — never blocks or throws
      releaseCloudinaryAsset(oldUrl).catch((e) =>
        console.warn('[SiteSettings] releaseCloudinaryAsset error:', e.message)
      );
    }
  }

  try {
    await ActivityLog.create({
      user: req.user._id,
      action: 'Updated Website Content',
      details: { sections: Object.keys(incoming) },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  } catch (_) { /* ignore */ }

  res.status(200).json({
    success: true,
    message: 'Website content updated',
    settings: toPublicPayload(doc),
  });
});

// @desc    Upload image for website CMS (logo, hero, etc.)
// @route   POST /api/site-settings/upload
// @access  Private/Admin
const uploadSiteAsset = asyncHandler(async (req, res) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    res.status(403);
    throw new Error('Forbidden - Super Admin access required');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image file');
  }

  const cloudReady = isCloudinaryConfigured();
  let resultUrl;

  if (cloudReady) {
    try {
      const uploadResult = await smartCloudinaryUpload(req.file, {
        folder: 'neo-gen/site-assets',
        resourceType: 'image',
      });
      resultUrl = uploadResult.url;
      console.log(
        uploadResult.reused
          ? `[SiteSettings] Reused existing Cloudinary asset: ${resultUrl}`
          : `[SiteSettings] Uploaded new asset to Cloudinary: ${resultUrl}`
      );
    } catch (err) {
      res.status(500);
      throw new Error(`Upload failed: ${err.message}`);
    }
  } else {
    resultUrl = `/uploads/${req.file.filename}`;
  }

  res.status(200).json({
    success: true,
    url: resultUrl,
    message: 'Image uploaded successfully',
  });
});

module.exports = {
  getSiteSettings,
  updateSiteSettings,
  uploadSiteAsset,
};

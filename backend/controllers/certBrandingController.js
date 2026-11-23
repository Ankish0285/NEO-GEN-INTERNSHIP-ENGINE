const asyncHandler = require('express-async-handler');
const SiteSettings = require('../models/SiteSettings');
const { smartCloudinaryUpload, releaseCloudinaryAsset } = require('../utils/cloudinaryUpload');

const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
const ALLOWED_SIG_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_LOGO_SIZE = 5 * 1024 * 1024;   // 5 MB
const MAX_SIG_SIZE  = 2 * 1024 * 1024;   // 2 MB

/**
 * GET /api/admin/cert-branding
 * Super admin only. Returns neogenCertBranding sub-document from SiteSettings.
 */
const getCertBranding = asyncHandler(async (req, res) => {
  if (req.user && req.user.role !== 'super_admin') {
    res.status(403);
    throw new Error('Super admin only');
  }

  const settings = await SiteSettings.findOne({ key: 'main' }).select('neogenCertBranding');
  const branding = settings?.neogenCertBranding ?? {
    logoUrl: '',
    logoPublicId: '',
    ceoName: 'Ankish Kumar',
    ceoDesignation: 'Founder & CEO, NEO GEN Internship Engine',
    ceoSignatureUrl: '',
    ceoSignaturePublicId: '',
  };

  res.json({ success: true, data: branding });
});

/**
 * GET /api/certificates/branding/neogen  (public — no auth)
 * Returns neogenCertBranding for use in certificate preview.
 */
const getPublicCertBranding = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.findOne({ key: 'main' }).select('neogenCertBranding');
  const branding = settings?.neogenCertBranding ?? {
    logoUrl: '',
    logoPublicId: '',
    ceoName: 'Ankish Kumar',
    ceoDesignation: 'Founder & CEO, NEO GEN Internship Engine',
    ceoSignatureUrl: '',
    ceoSignaturePublicId: '',
  };

  res.json({ success: true, data: branding });
});

/**
 * PUT /api/admin/cert-branding
 * Super admin only. Updates ceoName and ceoDesignation text fields.
 */
const updateCertBranding = asyncHandler(async (req, res) => {
  if (req.user.role !== 'super_admin') {
    res.status(403);
    throw new Error('Super admin only');
  }

  const { ceoName, ceoDesignation } = req.body;

  const updated = await SiteSettings.findOneAndUpdate(
    { key: 'main' },
    {
      $set: {
        'neogenCertBranding.ceoName': (ceoName || '').trim() || 'Ankish Kumar',
        'neogenCertBranding.ceoDesignation': (ceoDesignation || '').trim() || 'Founder & CEO, NEO GEN Internship Engine',
        'neogenCertBranding.updatedAt': new Date(),
      },
    },
    { upsert: true, new: true }
  );

  res.json({ success: true, data: updated.neogenCertBranding });
});

/**
 * POST /api/admin/cert-branding/logo
 * Super admin only. Uploads NEO GEN logo to Cloudinary.
 */
const uploadCertBrandingLogo = asyncHandler(async (req, res) => {
  if (req.user.role !== 'super_admin') {
    res.status(403);
    throw new Error('Super admin only');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Logo file is required');
  }

  if (!ALLOWED_LOGO_TYPES.includes(req.file.mimetype)) {
    res.status(400);
    throw new Error('Invalid file type. Allowed: PNG, JPG, SVG');
  }

  if (req.file.size > MAX_LOGO_SIZE) {
    res.status(400);
    throw new Error('File too large. Maximum 5 MB');
  }

  // Fetch old logo URL for cleanup
  const existing = await SiteSettings.findOne({ key: 'main' }).select('neogenCertBranding');
  const oldLogoUrl = existing?.neogenCertBranding?.logoUrl || '';

  const { url, publicId } = await smartCloudinaryUpload(req.file, {
    folder: 'neogen/cert-branding',
    resourceType: 'image',
  });

  const updated = await SiteSettings.findOneAndUpdate(
    { key: 'main' },
    {
      $set: {
        'neogenCertBranding.logoUrl': url,
        'neogenCertBranding.logoPublicId': publicId,
        'neogenCertBranding.updatedAt': new Date(),
      },
    },
    { upsert: true, new: true }
  );

  if (oldLogoUrl && oldLogoUrl !== url) {
    await releaseCloudinaryAsset(oldLogoUrl);
  }

  res.json({ success: true, data: updated.neogenCertBranding });
});

/**
 * POST /api/admin/cert-branding/signature
 * Super admin only. Uploads CEO signature image to Cloudinary.
 */
const uploadCertBrandingSignature = asyncHandler(async (req, res) => {
  if (req.user.role !== 'super_admin') {
    res.status(403);
    throw new Error('Super admin only');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Signature file is required');
  }

  if (!ALLOWED_SIG_TYPES.includes(req.file.mimetype)) {
    res.status(400);
    throw new Error('Invalid file type. Allowed: PNG, JPG');
  }

  if (req.file.size > MAX_SIG_SIZE) {
    res.status(400);
    throw new Error('File too large. Maximum 2 MB');
  }

  const existing = await SiteSettings.findOne({ key: 'main' }).select('neogenCertBranding');
  const oldSigUrl = existing?.neogenCertBranding?.ceoSignatureUrl || '';

  const { url, publicId } = await smartCloudinaryUpload(req.file, {
    folder: 'neogen/cert-signatures',
    resourceType: 'image',
  });

  const updated = await SiteSettings.findOneAndUpdate(
    { key: 'main' },
    {
      $set: {
        'neogenCertBranding.ceoSignatureUrl': url,
        'neogenCertBranding.ceoSignaturePublicId': publicId,
        'neogenCertBranding.updatedAt': new Date(),
      },
    },
    { upsert: true, new: true }
  );

  if (oldSigUrl && oldSigUrl !== url) {
    await releaseCloudinaryAsset(oldSigUrl);
  }

  res.json({ success: true, data: updated.neogenCertBranding });
});

module.exports = {
  getCertBranding,
  getPublicCertBranding,
  updateCertBranding,
  uploadCertBrandingLogo,
  uploadCertBrandingSignature,
};

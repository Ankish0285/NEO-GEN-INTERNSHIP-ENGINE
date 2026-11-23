const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { smartCloudinaryUpload, releaseCloudinaryAsset } = require('../utils/cloudinaryUpload');

const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_SIG_TYPES  = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_LOGO_SIZE = 5 * 1024 * 1024;   // 5 MB
const MAX_SIG_SIZE  = 2 * 1024 * 1024;   // 2 MB

/**
 * GET /api/partner/cert-settings
 * Partner only. Returns the partner's certSettings.
 */
const getPartnerCertSettings = asyncHandler(async (req, res) => {
  const settings = req.user.partnerInfo?.certSettings ?? {
    logoUrl: '',
    logoPublicId: '',
    signatoryName: '',
    signatoryDesignation: '',
    signatureUrl: '',
    signaturePublicId: '',
  };

  res.json({ success: true, data: settings });
});

/**
 * PUT /api/partner/cert-settings
 * Partner only. Updates signatoryName and signatoryDesignation.
 */
const updatePartnerCertSettings = asyncHandler(async (req, res) => {
  const { signatoryName, signatoryDesignation } = req.body;

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        'partnerInfo.certSettings.signatoryName': (signatoryName || '').trim(),
        'partnerInfo.certSettings.signatoryDesignation': (signatoryDesignation || '').trim(),
        'partnerInfo.certSettings.updatedAt': new Date(),
      },
    },
    { new: true }
  );

  res.json({ success: true, data: updated.partnerInfo?.certSettings ?? {} });
});

/**
 * POST /api/partner/cert-settings/logo
 * Partner only. Uploads partner logo to Cloudinary.
 */
const uploadPartnerCertLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Logo file is required');
  }

  if (!ALLOWED_LOGO_TYPES.includes(req.file.mimetype)) {
    res.status(400);
    throw new Error('Invalid file type. Allowed: PNG, JPG');
  }

  if (req.file.size > MAX_LOGO_SIZE) {
    res.status(400);
    throw new Error('File too large. Maximum 5 MB');
  }

  const oldLogoUrl = req.user.partnerInfo?.certSettings?.logoUrl || '';

  const { url, publicId } = await smartCloudinaryUpload(req.file, {
    folder: 'partners/cert-logos',
    resourceType: 'image',
  });

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        'partnerInfo.certSettings.logoUrl': url,
        'partnerInfo.certSettings.logoPublicId': publicId,
        'partnerInfo.certSettings.updatedAt': new Date(),
      },
    },
    { new: true }
  );

  if (oldLogoUrl && oldLogoUrl !== url) {
    await releaseCloudinaryAsset(oldLogoUrl);
  }

  res.json({ success: true, data: updated.partnerInfo?.certSettings ?? {} });
});

/**
 * POST /api/partner/cert-settings/signature
 * Partner only. Uploads signatory signature image to Cloudinary.
 */
const uploadPartnerCertSignature = asyncHandler(async (req, res) => {
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

  const oldSigUrl = req.user.partnerInfo?.certSettings?.signatureUrl || '';

  const { url, publicId } = await smartCloudinaryUpload(req.file, {
    folder: 'partners/cert-signatures',
    resourceType: 'image',
  });

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        'partnerInfo.certSettings.signatureUrl': url,
        'partnerInfo.certSettings.signaturePublicId': publicId,
        'partnerInfo.certSettings.updatedAt': new Date(),
      },
    },
    { new: true }
  );

  if (oldSigUrl && oldSigUrl !== url) {
    await releaseCloudinaryAsset(oldSigUrl);
  }

  res.json({ success: true, data: updated.partnerInfo?.certSettings ?? {} });
});

module.exports = {
  getPartnerCertSettings,
  updatePartnerCertSettings,
  uploadPartnerCertLogo,
  uploadPartnerCertSignature,
};

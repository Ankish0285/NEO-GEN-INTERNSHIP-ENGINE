/**
 * cloudinaryUpload.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Two exported functions:
 *
 *  1. smartCloudinaryUpload(multerFile, options)
 *     Automatic duplicate-detection upload.
 *     - SHA-256 hash the file bytes
 *     - Reuse existing Cloudinary asset if hash matches a MediaAsset record
 *     - Otherwise upload fresh and save a new MediaAsset record
 *
 *  2. releaseCloudinaryAsset(oldUrl)
 *     Safe old-asset cleanup after a successful replacement.
 *     - Resolves the URL to a MediaAsset record (via cloudinaryUrl field)
 *     - Counts every live reference to that URL across ALL models/fields
 *     - Destroys from Cloudinary + removes MediaAsset ONLY when refCount === 0
 *     - Never throws — logs failures so the caller's DB state stays intact
 */

const crypto     = require('crypto');
const fs         = require('fs');
const cloudinary = require('../config/cloudinary');
const MediaAsset = require('../models/MediaAsset');

// ─── helpers ──────────────────────────────────────────────────────────────────

function isCloudinaryConfigured() {
  return ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].every((key) => {
    const val = process.env[key];
    return val && !String(val).toLowerCase().includes('your_');
  });
}

function isCloudinaryUrl(url) {
  return typeof url === 'string' && /res\.cloudinary\.com/i.test(url);
}

function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash   = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end',  ()      => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function deleteTempFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
}

// ─── reference counting ───────────────────────────────────────────────────────
/**
 * Count how many live database documents still reference a given Cloudinary URL.
 * Checks every model/field that can store a Cloudinary URL in this project.
 *
 * Returns a number >= 0.  Errors in individual model queries are caught and
 * treated as "1 reference" (conservative — never delete on uncertainty).
 */
async function countLiveReferences(url) {
  if (!url || !isCloudinaryUrl(url)) return 1; // non-Cloudinary URLs are never deleted

  // Lazy-require models to avoid circular dependency issues
  const User         = require('../models/User');
  const Resume       = require('../models/Resume');
  const SuccessStory = require('../models/SuccessStory');
  const SiteSettings = require('../models/SiteSettings');

  let total = 0;

  // Each query is wrapped independently so a failure in one does not abort others.

  // User.profilePicture
  try { total += await User.countDocuments({ profilePicture: url }); }
  catch (e) { console.warn('[releaseAsset] User.profilePicture count error:', e.message); total += 1; }

  // User.resume  (some users store the resume URL directly on their profile)
  try { total += await User.countDocuments({ resume: url }); }
  catch (e) { console.warn('[releaseAsset] User.resume count error:', e.message); total += 1; }

  // Resume.fileUrl  (ATS resume documents)
  try { total += await Resume.countDocuments({ fileUrl: url }); }
  catch (e) { console.warn('[releaseAsset] Resume.fileUrl count error:', e.message); total += 1; }

  // SuccessStory.image
  try { total += await SuccessStory.countDocuments({ image: url }); }
  catch (e) { console.warn('[releaseAsset] SuccessStory.image count error:', e.message); total += 1; }

  // SiteSettings — branding.logoUrl
  try { total += await SiteSettings.countDocuments({ 'branding.logoUrl': url }); }
  catch (e) { console.warn('[releaseAsset] SiteSettings.branding.logoUrl count error:', e.message); total += 1; }

  // SiteSettings — hero.backgroundImage
  try { total += await SiteSettings.countDocuments({ 'hero.backgroundImage': url }); }
  catch (e) { console.warn('[releaseAsset] SiteSettings.hero.backgroundImage count error:', e.message); total += 1; }

  // SiteSettings — hero.backgroundImages array element
  try { total += await SiteSettings.countDocuments({ 'hero.backgroundImages': url }); }
  catch (e) { console.warn('[releaseAsset] SiteSettings.hero.backgroundImages count error:', e.message); total += 1; }

  // SiteSettings — team.members[].photoUrl
  try { total += await SiteSettings.countDocuments({ 'team.members.photoUrl': url }); }
  catch (e) { console.warn('[releaseAsset] SiteSettings.team.members.photoUrl count error:', e.message); total += 1; }

  return total;
}

// ─── smartCloudinaryUpload ────────────────────────────────────────────────────
/**
 * @param {object} multerFile   — req.file from multer diskStorage
 * @param {object} [options]
 * @param {string} [options.folder='neo-gen/uploads']
 * @param {string} [options.resourceType='auto']  — 'image' | 'raw' | 'auto'
 * @returns {Promise<{ url, publicId, reused, sha256, isLocal }>}
 */
async function smartCloudinaryUpload(multerFile, options = {}) {
  const { folder = 'neo-gen/uploads', resourceType = 'auto' } = options;

  if (!multerFile || !multerFile.path) {
    throw new Error('smartCloudinaryUpload: multerFile.path is required');
  }

  // 1. Hash the file
  let sha256;
  try {
    sha256 = await hashFile(multerFile.path);
  } catch (err) {
    deleteTempFile(multerFile.path);
    throw new Error(`Failed to hash file: ${err.message}`);
  }

  // 2. No-Cloudinary fallback
  if (!isCloudinaryConfigured()) {
    const localPath = `/uploads/${multerFile.filename}`;
    console.log(`[CloudinaryUpload] Cloudinary not configured — stored locally: ${localPath}`);
    return { url: localPath, publicId: multerFile.filename, reused: false, sha256, isLocal: true };
  }

  // 3. Check for duplicate
  let existing;
  try { existing = await MediaAsset.findOne({ sha256 }); }
  catch (dbErr) { console.warn(`[CloudinaryUpload] DB lookup failed — uploading. ${dbErr.message}`); }

  if (existing) {
    deleteTempFile(multerFile.path);
    console.log(`[CloudinaryUpload] ✓ Duplicate — reusing: ${existing.cloudinaryUrl}`);
    return { url: existing.cloudinaryUrl, publicId: existing.cloudinaryPublicId, reused: true, sha256, isLocal: false };
  }

  // 4. Fresh upload
  let uploadResult;
  try {
    uploadResult = await cloudinary.uploader.upload(multerFile.path, {
      folder,
      resource_type: resourceType,
    });
  } catch (uploadErr) {
    deleteTempFile(multerFile.path);
    throw new Error(`Cloudinary upload failed: ${uploadErr.message}`);
  }

  deleteTempFile(multerFile.path);

  // 5. Save MediaAsset record
  try {
    await MediaAsset.create({
      sha256,
      cloudinaryUrl:      uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      resourceType:       uploadResult.resource_type || resourceType,
      folder,
      originalName:  multerFile.originalname || '',
      mimeType:      multerFile.mimetype     || '',
      fileSizeBytes: multerFile.size         || 0,
    });
  } catch (saveErr) {
    if (saveErr.code !== 11000) {
      console.warn(`[CloudinaryUpload] Could not save MediaAsset record: ${saveErr.message}`);
    }
  }

  console.log(`[CloudinaryUpload] ✓ Uploaded new asset: ${uploadResult.secure_url}`);
  return { url: uploadResult.secure_url, publicId: uploadResult.public_id, reused: false, sha256, isLocal: false };
}

// ─── releaseCloudinaryAsset ───────────────────────────────────────────────────
/**
 * Safe cleanup of an old Cloudinary asset after a successful replacement.
 *
 * Call AFTER the database has been successfully updated with the new URL.
 * Never throws — all errors are logged.  The caller's transaction stays intact.
 *
 * @param {string} oldUrl  — the Cloudinary secure_url that was just replaced
 */
async function releaseCloudinaryAsset(oldUrl) {
  if (!oldUrl || !isCloudinaryUrl(oldUrl)) return; // nothing to do for local/empty URLs

  try {
    // 1. Count how many live documents still reference this URL
    const refCount = await countLiveReferences(oldUrl);

    if (refCount > 0) {
      console.log(`[releaseAsset] ✓ Kept — ${refCount} reference(s) remain: ${oldUrl}`);
      return;
    }

    // 2. Look up MediaAsset for publicId + resourceType
    const asset = await MediaAsset.findOne({ cloudinaryUrl: oldUrl });

    if (!asset) {
      // URL exists in Cloudinary but no MediaAsset record (pre-dedup upload).
      // Parse publicId from URL using existing cloudinaryCleanup logic.
      const { parseCloudinaryUrl } = require('./cloudinaryCleanup');
      const parsed = parseCloudinaryUrl(oldUrl);
      if (!parsed) {
        console.warn(`[releaseAsset] Could not parse public_id from URL: ${oldUrl}`);
        return;
      }
      await cloudinary.uploader.destroy(parsed.publicId, {
        resource_type: parsed.resourceType,
        invalidate: true,
      });
      console.log(`[releaseAsset] ✓ Deleted from Cloudinary (no MediaAsset record): ${parsed.publicId}`);
      return;
    }

    // 3. Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(asset.cloudinaryPublicId, {
        resource_type: asset.resourceType || 'image',
        invalidate: true,
      });
      console.log(`[releaseAsset] ✓ Deleted from Cloudinary: ${asset.cloudinaryPublicId}`);
    } catch (destroyErr) {
      // Log but do NOT remove the MediaAsset record — allows safe retry
      console.error(`[releaseAsset] ✗ Cloudinary delete failed (will retry later): ${destroyErr.message}`);
      return;
    }

    // 4. Remove the MediaAsset record now Cloudinary copy is gone
    await MediaAsset.deleteOne({ _id: asset._id });
    console.log(`[releaseAsset] ✓ MediaAsset record removed: ${asset._id}`);

  } catch (err) {
    // Never propagate — log only.  DB state and new asset are unaffected.
    console.error(`[releaseAsset] Unexpected error (non-fatal): ${err.message}`);
  }
}

module.exports = { smartCloudinaryUpload, releaseCloudinaryAsset };

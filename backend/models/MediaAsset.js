const mongoose = require('mongoose');

/**
 * MediaAsset — tracks every file ever uploaded to Cloudinary.
 *
 * The `sha256` field is the hex-encoded SHA-256 hash of the raw file bytes.
 * Before uploading a new file we look up its hash here.  If a record exists
 * we reuse the stored Cloudinary URL; otherwise we upload and save a new record.
 *
 * This keeps Cloudinary storage clean and eliminates duplicate uploads.
 */
const mediaAssetSchema = new mongoose.Schema(
  {
    sha256: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      default: 'image',
    },
    folder: {
      type: String,
      default: '',
    },
    originalName: {
      type: String,
      default: '',
    },
    mimeType: {
      type: String,
      default: '',
    },
    fileSizeBytes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MediaAsset', mediaAssetSchema);

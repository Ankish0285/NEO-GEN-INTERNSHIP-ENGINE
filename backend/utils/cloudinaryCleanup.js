const cloudinary = require('../config/cloudinary');

function parseCloudinaryUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  try {
    const url = new URL(rawUrl.trim());

    if (!/res\.cloudinary\.com$/i.test(url.hostname)) {
      return null;
    }

    const parts = url.pathname.split('/').filter(Boolean);

    const typeIndex = parts.findIndex(
      (part, index) =>
        ['image', 'video', 'raw'].includes(part) &&
        parts[index + 1] === 'upload'
    );

    if (typeIndex === -1) return null;

    const resourceType = parts[typeIndex];

    let publicParts = parts.slice(typeIndex + 2);

    const versionIndex = publicParts.findIndex((part) => /^v\d+$/.test(part));

    if (versionIndex >= 0) {
      publicParts = publicParts.slice(versionIndex + 1);
    }

    if (!publicParts.length) return null;

    let publicId = decodeURIComponent(publicParts.join('/'));

    // Cloudinary public_id normally excludes the file extension.
    publicId = publicId.replace(/\.[a-z0-9]+$/i, '');

    if (!publicId) return null;

    return {
      publicId,
      resourceType,
    };
  } catch {
    return null;
  }
}

async function deleteCloudinaryAsset(rawUrl) {
  const parsed = parseCloudinaryUrl(rawUrl);

  if (!parsed) {
    return null;
  }

  try {
    const result = await cloudinary.uploader.destroy(parsed.publicId, {
      resource_type: parsed.resourceType,
      type: 'upload',
      invalidate: true,
    });

    console.log(
      `[Cloudinary Cleanup] ${parsed.resourceType}/${parsed.publicId}:`,
      result?.result || result
    );

    return result;
  } catch (error) {
    console.error(
      `[Cloudinary Cleanup] Failed for ${parsed.resourceType}/${parsed.publicId}:`,
      error.message
    );
    throw error;
  }
}

module.exports = {
  parseCloudinaryUrl,
  deleteCloudinaryAsset,
};

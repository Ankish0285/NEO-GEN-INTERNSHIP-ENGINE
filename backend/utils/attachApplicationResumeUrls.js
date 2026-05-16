const mongoose = require('mongoose');
const Resume = require('../models/Resume');
const {
  isHttpUrl,
  needsResumeReplacement,
  fixLocalResumeHttpUrl,
  uploadsPublicUrl,
} = require('./resumeUrl');

/**
 * Normalize resume URLs on application JSON for the client:
 * - Prefer latest Cloudinary fileUrl from Resume when stored link is missing / relative / localhost.
 * - Fix http://localhost:5000/file.pdf -> .../uploads/file.pdf
 */
async function attachResolvedResumeUrls(applications) {
  if (!applications?.length) return applications;

  const apps = Array.isArray(applications) ? applications : [applications];
  const uniqueIds = [
    ...new Set(
      apps
        .map((a) => {
          const sid = a.student?._id ?? a.student;
          return sid && mongoose.Types.ObjectId.isValid(String(sid)) ? String(sid) : null;
        })
        .filter(Boolean)
    ),
  ];

  const urlMap = {};
  if (uniqueIds.length > 0) {
    const oidList = uniqueIds.map((id) => new mongoose.Types.ObjectId(id));
    const latestByUser = await Resume.aggregate([
      { $match: { user: { $in: oidList } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$user', fileUrl: { $first: '$fileUrl' } } },
    ]);
    for (const row of latestByUser) {
      if (row.fileUrl && isHttpUrl(row.fileUrl)) {
        urlMap[String(row._id)] = row.fileUrl;
      }
    }
  }

  for (const app of apps) {
    const sid = String(app.student?._id || app.student);
    const best = sid && urlMap[sid] ? urlMap[sid] : null;
    let cur = app.resume || app.details?.resumePath;

    if (best && isHttpUrl(best) && needsResumeReplacement(cur)) {
      app.resume = best;
      if (app.details) app.details.resumePath = best;
      continue;
    }

    if (cur && isHttpUrl(cur) && needsResumeReplacement(cur)) {
      const fixed = fixLocalResumeHttpUrl(cur);
      if (fixed && fixed !== cur) {
        app.resume = fixed;
        if (app.details) app.details.resumePath = fixed;
      }
      continue;
    }

    if (!cur || isHttpUrl(cur)) continue;

    const fixed = (best && isHttpUrl(best) ? best : null) || uploadsPublicUrl(cur);
    if (fixed) {
      app.resume = fixed;
      if (app.details) app.details.resumePath = fixed;
    }
  }

  return applications;
}

module.exports = { attachResolvedResumeUrls };

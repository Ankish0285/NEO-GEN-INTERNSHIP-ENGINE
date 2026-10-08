const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const PlacementRecord = require('../models/PlacementRecord');
const SkillAssessment = require('../models/SkillAssessment');

const getPlatformIntelligence = asyncHandler(async (req, res) => {
  const totalCertificates = await PlacementRecord.countDocuments({ certificateId: { $exists: true } });
  const activeCertificates = await PlacementRecord.countDocuments({ certificateId: { $exists: true }, status: 'active' });
  const totalCompletions = await PlacementRecord.countDocuments({ completionStatus: 'completed' });

  const applicationStats = await Application.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const completionStats = await PlacementRecord.aggregate([
    { $group: { _id: '$completionStatus', count: { $sum: 1 } } }
  ]);

  const skillGaps = await SkillAssessment.aggregate([
    { $group: { _id: '$skillName', avgScore: { $avg: '$score' }, count: { $sum: 1 } } },
    { $sort: { avgScore: 1 } },
    { $limit: 10 }
  ]);

  res.json({
    success: true,
    data: {
      certificates: { total: totalCertificates, active: activeCertificates },
      completions: totalCompletions,
      applicationFunnel: applicationStats,
      completionStats,
      topSkillGaps: skillGaps,
    }
  });
});

module.exports = { getPlatformIntelligence };

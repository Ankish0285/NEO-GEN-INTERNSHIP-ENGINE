const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const PlacementRecord = require('../models/PlacementRecord');
const Internship = require('../models/Internship');
const FeedbackForm = require('../models/FeedbackForm');

const getPartnerIntelligence = asyncHandler(async (req, res) => {
  const internships = await Internship.find({ createdBy: req.user._id }).select('_id title');
  const internshipIds = internships.map(i => i._id);

  const appFunnel = await Application.aggregate([
    { $match: { internship: { $in: internshipIds } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const completionStats = await PlacementRecord.aggregate([
    { $match: { partnerId: req.user._id } },
    { $group: { _id: '$completionStatus', count: { $sum: 1 } } }
  ]);

  const certStats = await PlacementRecord.aggregate([
    { $match: { partnerId: req.user._id, certificateId: { $exists: true } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const feedbackSummary = await FeedbackForm.aggregate([
    { $match: { partnerId: req.user._id } },
    { $group: {
      _id: null,
      avgTechnical: { $avg: '$technicalSkills' },
      avgCommunication: { $avg: '$communication' },
      avgOverall: { $avg: '$overallRating' },
      count: { $sum: 1 }
    }}
  ]);

  res.json({
    success: true,
    data: {
      applicationFunnel: appFunnel,
      completionStats,
      certificateStats: certStats,
      feedbackSummary: feedbackSummary[0] || null,
      totalInternships: internships.length,
    }
  });
});

module.exports = { getPartnerIntelligence };

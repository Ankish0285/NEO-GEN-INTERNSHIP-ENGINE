const asyncHandler = require('express-async-handler');
const Internship = require('../models/Internship');

const calculateQualityScore = (internship) => {
  let score = 0;
  const breakdown = {};

  if (internship.description && internship.description.length > 300) { score += 20; breakdown.description = 20; }
  else if (internship.description && internship.description.length > 100) { score += 10; breakdown.description = 10; }

  const skillCount = (internship.skills || internship.requiredSkills || []).length;
  if (skillCount >= 3) { score += 15; breakdown.skills = 15; }
  else if (skillCount > 0) { score += 8; breakdown.skills = 8; }

  if (internship.duration) { score += 10; breakdown.duration = 10; }
  if (internship.stipend && internship.stipend !== '0' && internship.stipend !== 'unpaid') { score += 10; breakdown.stipend = 10; }
  if (internship.requirements || internship.responsibilities) { score += 10; breakdown.requirements = 10; }
  if (internship.perks || internship.benefits) { score += 10; breakdown.benefits = 10; }
  if (internship.createdBy) { score += 15; breakdown.partnerVerified = 15; }
  if (internship.certificateOffered) { score += 10; breakdown.certificate = 10; }

  score = Math.min(score, 100);
  let riskLevel = score < 40 ? 'high' : score < 70 ? 'medium' : 'low';
  let roiEstimate = (score >= 70 && skillCount >= 3) ? 'high' : score >= 40 ? 'medium' : 'low';

  return { qualityScore: score, riskLevel, roiEstimate, breakdown };
};

const getInternshipQuality = asyncHandler(async (req, res) => {
  const internship = await Internship.findById(req.params.internshipId);
  if (!internship) { res.status(404); throw new Error('Internship not found'); }
  const quality = calculateQualityScore(internship);
  res.json({
    ...quality,
    disclaimer: 'Score based on available listing data. Verify independently before applying.',
    internshipId: internship._id,
    title: internship.title,
  });
});

module.exports = { getInternshipQuality, calculateQualityScore };

const asyncHandler = require('express-async-handler');
const SkillEvidence = require('../models/SkillEvidence');
const { createAndNotify } = require('../utils/notificationHelper');

// ─── Pure / deterministic helper ──────────────────────────────────────────────

/**
 * calculateConfidence
 * Weights per evidence type (only the FIRST occurrence of each type counts).
 * strengthMultiplier is applied to each source's weighted score.
 * isVerified adds a 10 % bonus to the final sum.
 * Result is capped at 100 and returned as an integer.
 *
 * @param {Array<{type: string, strength: string}>} evidenceSources
 * @param {boolean} isVerified
 * @returns {number} integer 0-100
 */
const calculateConfidence = (evidenceSources, isVerified) => {
  const weights = {
    resume: 15,
    project: 25,
    assessment: 20,
    internship: 15,
    learning: 7,
    certificate: 20,
    interview: 10,
    feedback: 8,
  };

  const strengthMultiplier = {
    weak: 0.5,
    moderate: 1.0,
    strong: 1.3,
  };

  const seenTypes = new Set();
  let sum = 0;

  for (const source of evidenceSources) {
    const type = source.type;
    if (seenTypes.has(type)) continue; // only first occurrence counts
    seenTypes.add(type);

    const weight = weights[type] || 0;
    const multiplier = strengthMultiplier[source.strength] || 1.0;
    sum += weight * multiplier;
  }

  if (isVerified) {
    sum = sum * 1.1;
  }

  return Math.min(100, Math.round(sum));
};

// ─── Route handlers ───────────────────────────────────────────────────────────

// GET /api/skill-evidence
const getSkillEvidence = asyncHandler(async (req, res) => {
  const docs = await SkillEvidence.find({ user: req.user.id });
  res.json(docs);
});

// GET /api/skill-evidence/breakdown
const getSkillEvidenceBreakdown = asyncHandler(async (req, res) => {
  const docs = await SkillEvidence.find({ user: req.user.id }).select(
    'skillName confidenceScore proficiency'
  );

  const breakdown = {};
  for (const doc of docs) {
    breakdown[doc.skillName] = doc.confidenceScore;
  }

  res.json(breakdown);
});

// POST /api/skill-evidence
const upsertSkillEvidence = asyncHandler(async (req, res) => {
  const { skillName, proficiency, evidenceType, description, strength, notes } = req.body;

  if (!skillName) {
    res.status(400);
    throw new Error('skillName is required');
  }

  // Find existing doc or build a new one
  let doc = await SkillEvidence.findOne({ user: req.user.id, skillName });
  const previousScore = doc ? doc.confidenceScore : 0;

  if (!doc) {
    doc = new SkillEvidence({
      user: req.user.id,
      skillName,
      proficiency: proficiency || 'beginner',
      evidenceSources: [],
    });
  } else if (proficiency) {
    doc.proficiency = proficiency;
  }

  // Push the new evidence entry (evidenceType maps to `type`)
  if (evidenceType) {
    doc.evidenceSources.push({
      type: evidenceType,
      description: description || '',
      strength: strength || 'moderate',
      notes: notes || '',
      verifiedAt: new Date(),
    });
  }

  // Recalculate confidence
  const newScore = calculateConfidence(doc.evidenceSources, doc.isVerified);
  doc.confidenceScore = newScore;

  const saved = await doc.save();

  // Notify if score improved by more than 10 points
  if (Math.abs(newScore - previousScore) > 10) {
    await createAndNotify(req.app, {
      recipient: req.user.id,
      title: 'Skill Confidence Updated',
      message: `Your ${skillName} confidence improved to ${newScore}%!`,
      type: 'success',
      priority: 'medium',
      link: '/dashboard/career',
    });
  }

  res.json(saved);
});

// DELETE /api/skill-evidence/:id
const deleteSkillEvidence = asyncHandler(async (req, res) => {
  const doc = await SkillEvidence.findOne({ _id: req.params.id, user: req.user.id });

  if (!doc) {
    res.status(404);
    throw new Error('Skill evidence not found');
  }

  await doc.deleteOne();
  res.json({ success: true });
});

// GET /api/skill-evidence/breakdown (alias kept for route clarity)
const getSkillConfidenceBreakdown = asyncHandler(async (req, res) => {
  const docs = await SkillEvidence.find({ user: req.user.id }).select(
    'skillName confidenceScore proficiency'
  );

  const breakdown = {};
  for (const doc of docs) {
    breakdown[doc.skillName] = doc.confidenceScore;
  }

  res.json(breakdown);
});

module.exports = {
  calculateConfidence,
  getSkillEvidence,
  getSkillEvidenceBreakdown,
  upsertSkillEvidence,
  deleteSkillEvidence,
  getSkillConfidenceBreakdown,
};

const mongoose = require('mongoose');

const placementRecordSchema = mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship',
      default: null,
    },
    company: { type: String, default: '' },
    role: { type: String, default: '' },
    stipend: { type: String, default: '' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    certificate: { type: String, default: '' },
    notes: { type: String, default: '' },

    // Certificate fields (Task 4a)
    certificateId: { type: String, sparse: true },
    organization: { type: String },
    skills: { type: [String], default: [] },
    status: { type: String, enum: ['pending','active','revoked'], default: 'pending' },
    qrCodeData: { type: String },
    publicVerifyUrl: { type: String },
    issuedAt: { type: Date },
    verifiedAt: { type: Date },
    revokedAt: { type: Date },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    revokedReason: { type: String },

    // Completion workflow fields (Task 5a)
    completionStatus: { type: String, enum: ['applied','selected','started','in_progress','completed','terminated'], default: 'applied' },
    selectedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    terminatedAt: { type: Date },
    terminationReason: { type: String },
    markedCompletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performanceRating: { type: Number, min: 1, max: 5 },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    internshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship' },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PlacementRecord', placementRecordSchema);

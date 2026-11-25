const mongoose = require('mongoose');
const crypto = require('crypto');
const { randomUUID } = require('crypto');

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      unique: true,
      sparse: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    issuerOrganization: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    organization: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    internalNotes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['uploaded', 'generated'],
      required: true,
    },
    fileUrl: {
      type: String,
      default: '',
    },
    filePublicId: {
      type: String,
      default: '',
    },
    verificationId: {
      type: String,
      unique: true,
      sparse: true,
    },
    templateId: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: 'Internship Completion Certificate',
    },
    description: {
      type: String,
      default: '',
    },
    qrCodeData: {
      type: String,
      default: '',
    },
    // Admin verify/revoke tracking
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    revokedReason: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to auto-generate certificateId and verificationId
certificateSchema.pre('save', function (next) {
  if (!this.certificateId) {
    this.certificateId =
      'NEOGEN-CERT-' +
      crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  if (!this.verificationId) {
    this.verificationId = randomUUID();
  }
  next();
});

module.exports = mongoose.model('Certificate', certificateSchema);

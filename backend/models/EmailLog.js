const mongoose = require('mongoose');

/**
 * EmailLog persists every outgoing notification email so that:
 *  - duplicates for the same event + recipient are prevented (unique compound index),
 *  - admins can view history, stats, and retry failed sends,
 *  - fire-and-forget triggers never block API responses.
 */
const emailLogSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        'welcome',
        'new_internship',
        'success_story',
        'certificate_issued',
        'certificate_status',
        'announcement',
      ],
      index: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    recipientEmail: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    // Stored so admin "retry" can resend without regenerating the template.
    bodyHtml: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastAttemptAt: {
      type: Date,
    },
    error: {
      type: String,
      default: '',
    },
    // Idempotency key per event (e.g. internship _id, announcement id, user _id).
    eventRefId: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// One email per (event, recipient, eventRef) — prevents duplicate notifications.
emailLogSchema.index({ eventType: 1, recipientId: 1, eventRefId: 1 }, { unique: true });

module.exports = mongoose.model('EmailLog', emailLogSchema);

const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true },
    status: { type: String, enum: ['PROCESSING', 'PROCESSED', 'FAILED'], default: 'PROCESSING' },
    processedAt: { type: Date, default: null },
    error: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
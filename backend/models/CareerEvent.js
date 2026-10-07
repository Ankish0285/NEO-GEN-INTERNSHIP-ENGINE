const mongoose = require('mongoose');

const careerEventSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    eventType: {
      type: String,
      enum: ['webinar', 'workshop', 'fair', 'mock_interview', 'networking'],
      default: 'webinar',
    },
    host: { type: String, default: '' },
    eventDate: { type: Date, default: null },
    registrationDeadline: { type: Date, default: null },
    meetLink: { type: String, default: '' },
    maxParticipants: { type: Number, default: 0 },
    registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['upcoming', 'live', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CareerEvent', careerEventSchema);

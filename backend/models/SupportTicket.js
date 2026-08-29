const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    fileName: { type: String, default: '' },
  },
  { _id: false }
);

const replySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, default: '' },
    authorRole: { type: String, default: '' },
    message: { type: String, required: true },
    attachments: { type: [attachmentSchema], default: [] },
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    userName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    role: { type: String, enum: ['student', 'admin', 'super_admin', 'partner'], default: 'student' },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    category: {
      type: String,
      enum: ['Technical', 'Account', 'Application', 'Internship', 'Billing', 'General', 'Other'],
      default: 'General',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved'],
      default: 'Pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    assignedToName: { type: String, default: '' },
    attachments: { type: [attachmentSchema], default: [] },
    replies: { type: [replySchema], default: [] },
    unreadByUser: { type: Boolean, default: false },
    unreadByStaff: { type: Boolean, default: true },
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

supportTicketSchema.index({ lastActivityAt: -1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);

const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
    },
    message: {
      type: String,
      required: [true, 'Please add a message'],
    },
    subject: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['New', 'Read', 'Replied'],
      default: 'New',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Message', messageSchema);

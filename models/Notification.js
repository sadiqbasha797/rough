const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      refPath: 'recipient.model'
    },
    model: {
      type: String,
      required: true,
      enum: ['Patient', 'Clinisist', 'Admin', 'Organization', 'OrgAdmin', 'Manager', 'OtherModel'] // Added new models here
    }
  },
  sender: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'sender.model',
      default: null
    },
    model: {
      type: String,
      enum: ['Patient', 'Clinisist', 'Admin', 'Organization', 'OrgAdmin', 'Manager', 'OtherModel'], // Added new models here
      default: null
    }
  },
  type: {
    type: String,
    enum: ['general', 'appointment', 'reminder', 'message', 'alert', 'promotion', 'subscription'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

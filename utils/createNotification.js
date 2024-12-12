const Notification = require('../models/Notification');

const createNotification = async (recipientId, recipientModel, message, senderId = null, senderModel = null, type = 'general') => {
  try {
    const notification = new Notification({
      recipient: {
        id: recipientId,
        model: recipientModel
      },
      sender: senderId ? { id: senderId, model: senderModel } : null,
      type,
      message
    });

    await notification.save();
    console.log('Notification created:', message);
  } catch (error) {
    console.error('Error creating notification:', error.message);
  }
};

module.exports = createNotification;

const Notification = require('../models/Notification');
const { io } = require('../index'); // Import the Socket.IO instance

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
    
    // Emit the notification to the recipient via Socket.IO
    io.to(recipientId).emit('newNotification', notification); // Send the notification to the specific recipient
  } catch (error) {
    console.error('Error creating notification:', error.message);
  }
};

module.exports = createNotification;

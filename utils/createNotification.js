const Notification = require('../models/Notification');
const admin = require('../utils/firebaseConfig');
const Patient = require('../models/patient');
const Clinisist = require('../models/Clinisist');

const createNotification = async (recipientId, recipientModel, message, senderId = null, senderModel = null, type = 'general') => {
  try {
    // Create and save notification
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
    
    // Only attempt socket.io notification if there's a recipientId
    if (recipientId && global.io) {
      global.io.to(recipientId.toString()).emit('newNotification', notification);
    }

    // Only attempt push notification if there's a recipientId
    if (recipientId) {
      try {
        // Get recipient's device token based on the model
        let recipient;
        if (recipientModel === 'Patient') {
          recipient = await Patient.findById(recipientId);
        } else if (recipientModel === 'Clinisist') {
          recipient = await Clinisist.findById(recipientId);
        }

        if (recipient && recipient.deviceToken) {
          const pushMessage = {
            notification: {
              title: getNotificationTitle(type),
              body: message,
            },
            data: {
              notificationId: notification._id.toString(),
              type: type,
              recipientModel: recipientModel,
            },
            token: recipient.deviceToken,
            android: {
              priority: 'high',
            },
            apns: {
              headers: {
                'apns-priority': '10',
              },
            },
          };

          const response = await admin.messaging().send(pushMessage);
          console.log('Push notification sent successfully:', response);
        } else {
          console.log('No device token found for recipient:', recipientId);
        }
      } catch (pushError) {
        console.error('Error sending push notification:', pushError);
      }
    } else {
      console.log('Skipping push notification for admin notification');
    }

    return notification;

  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Helper function to generate notification titles
function getNotificationTitle(type) {
  const titles = {
    general: 'New Notification',
    appointment: 'Appointment Update',
    reminder: 'Reminder',
    message: 'New Message',
    alert: 'Alert',
    promotion: 'Special Offer',
    subscription: 'Subscription Update'
  };
  return titles[type] || 'New Notification';
}

module.exports = createNotification;

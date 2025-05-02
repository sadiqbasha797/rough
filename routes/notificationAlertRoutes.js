const express = require('express');
const router = express.Router();
const notificationAlertController = require('../controllers/notificationAlertController');

// Non-parameterized routes first
router.post('/', notificationAlertController.createNotificationAlert);
router.get('/', notificationAlertController.getAllNotificationAlerts);
router.post('/search', notificationAlertController.getByDeviceToken);

// Parameterized routes last
router.get('/:id', notificationAlertController.getNotificationAlertById);
router.put('/:id', notificationAlertController.updateNotificationAlert);
router.delete('/:id', notificationAlertController.deleteNotificationAlert);

module.exports = router;

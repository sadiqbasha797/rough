const NotificationAlert = require('../models/notification-alert');

// Create a new notification alert
exports.createNotificationAlert = async (req, res) => {
    try {
        const { deviceToken, allowed } = req.body;
        
        // Check for existing device token
        const existingAlert = await NotificationAlert.findOne({ deviceToken });
        if (existingAlert) {
            // Update existing alert
            existingAlert.allowed = allowed;
            await existingAlert.save();
            return res.json({
                status: "success",
                body: existingAlert,
                message: "Notification alert updated successfully"
            });
        }

        const alert = new NotificationAlert({ deviceToken, allowed });
        await alert.save();
        res.json({
            status: "success",
            body: alert,
            message: "Notification alert created successfully"
        });
    } catch (error) {
        res.json({
            status: "success",
            body: null,
            message: "Failed to create notification alert: " + error.message
        });
    }
};

// Get notification alert by device token
exports.getByDeviceToken = async (req, res) => {
    try {
        const { deviceToken } = req.body;
        const alert = await NotificationAlert.findOne({ deviceToken });
        
        if (!alert) {
            return res.json({
                status: "success",
                body: null,
                message: "No notification alert found for this device token"
            });
        }

        res.json({
            status: "success",
            body: alert,
            message: "Notification alert retrieved successfully"
        });
    } catch (error) {
        res.json({
            status: "success",
            body: null,
            message: "Failed to retrieve notification alert: " + error.message
        });
    }
};

// Get all notification alerts
exports.getAllNotificationAlerts = async (req, res) => {
    try {
        const alerts = await NotificationAlert.find();
        res.json({
            status: "success",
            body: alerts,
            message: "Notification alerts retrieved successfully"
        });
    } catch (error) {
        res.json({
            status: "success",
            body: null,
            message: "Failed to retrieve notification alerts: " + error.message
        });
    }
};

// Get a notification alert by ID
exports.getNotificationAlertById = async (req, res) => {
    try {
        const alert = await NotificationAlert.findById(req.params.id);
        if (!alert) {
            return res.json({
                status: "success",
                body: null,
                message: "Notification alert not found"
            });
        }
        res.json({
            status: "success",
            body: alert,
            message: "Notification alert retrieved successfully"
        });
    } catch (error) {
        res.json({
            status: "success",
            body: null,
            message: "Failed to retrieve notification alert: " + error.message
        });
    }
};



// Update a notification alert by ID
exports.updateNotificationAlert = async (req, res) => {
    try {
        const { deviceToken, allowed } = req.body;
        const alert = await NotificationAlert.findByIdAndUpdate(
            req.params.id,
            { deviceToken, allowed },
            { new: true, runValidators: true }
        );
        if (!alert) {
            return res.json({
                status: "success",
                body: null,
                message: "Notification alert not found"
            });
        }
        res.json({
            status: "success",
            body: alert,
            message: "Notification alert updated successfully"
        });
    } catch (error) {
        res.json({
            status: "success",
            body: null,
            message: "Failed to update notification alert: " + error.message
        });
    }
};

// Delete a notification alert by ID
exports.deleteNotificationAlert = async (req, res) => {
    try {
        const alert = await NotificationAlert.findByIdAndDelete(req.params.id);
        if (!alert) {
            return res.json({
                status: "success",
                body: null,
                message: "Notification alert not found"
            });
        }
        res.json({
            status: "success",
            body: null,
            message: "Notification alert deleted successfully"
        });
    } catch (error) {
        res.json({
            status: "success",
            body: null,
            message: "Failed to delete notification alert: " + error.message
        });
    }
};
const mongoose = require('mongoose');

const notificationAlertSchema = new mongoose.Schema({
    deviceToken: {
        type: String,
        required: true,
        unique: true
    },
    allowed: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('NotificationAlert', notificationAlertSchema);

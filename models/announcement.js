const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    media: {
        type: String,
        trim: true
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    type: {
        type: String,
        enum: ['All', 'Clinicians', 'Managers', 'Organizations', 'Patients', 'Assistants'],
        default: 'All'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);


const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    patient_name: {
        type: String,
        required: true,
        trim: true
    },
    patient_mobile_num: {
        type: String,
        required: true,
        trim: true
    },
    patient_location: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    },
    distance: {
        type: Number,
        required: true,
        min: 0 // Distance cannot be negative
    },
    nearest_clinisist_name: {
        type: String,
        required: true,
        trim: true
    },
    nearest_clinisist_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinisist',
        required: true
    },
    nearest_clinisist_location: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;

const mongoose = require('mongoose');

const assistantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
   
    address: {
        type: String,
    },
    otp: {
        type: String,
        default: null,
    },
    otpExpires: {
        type: Date,
        default: null,
    },
    socialMediaLinks: {
        type: [String],
    },
    contact: {
        email: {
            type: String,
        },
        mobile: {
            type: String,
        }
    },
 
    bio: {
        type: String,
    },
    image: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

const Assistant = mongoose.model('Assistant', assistantSchema);

module.exports = Assistant;
